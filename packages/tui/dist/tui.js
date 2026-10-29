/**
 * Minimal TUI implementation with differential rendering
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { performance } from "node:perf_hooks";
import { withFullscreenImageFallback } from "./components/image.js";
import { FullscreenViewport } from "./fullscreen.js";
import { getKeybindings } from "./keybindings.js";
import { isKeyRelease, matchesKey } from "./keys.js";
import { isMouseSequence, isWheelDown, isWheelUp, MOUSE_BUTTON_LEFT, parseSgrMouseEvent } from "./mouse.js";
import { deleteKittyImage, getCapabilities, isImageLine, setCellDimensions } from "./terminal-image.js";
import { extractSegments, normalizeTerminalOutput, sliceByColumn, sliceWithWidth, stripAnsi, visibleContentSpan, visibleWidth, } from "./utils.js";
const KITTY_SEQUENCE_PREFIX = "\x1b_G";
function extractKittyImageIds(line) {
    const sequenceStart = line.indexOf(KITTY_SEQUENCE_PREFIX);
    if (sequenceStart === -1)
        return [];
    const paramsStart = sequenceStart + KITTY_SEQUENCE_PREFIX.length;
    const paramsEnd = line.indexOf(";", paramsStart);
    if (paramsEnd === -1)
        return [];
    const params = line.slice(paramsStart, paramsEnd);
    for (const param of params.split(",")) {
        const [key, value] = param.split("=", 2);
        if (key !== "i" || value === undefined)
            continue;
        const id = Number(value);
        if (Number.isInteger(id) && id > 0 && id <= 0xffffffff) {
            return [id];
        }
    }
    return [];
}
/** Type guard to check if a component implements Focusable */
export function isFocusable(component) {
    return component !== null && "focused" in component;
}
/**
 * Cursor position marker - APC (Application Program Command) sequence.
 * This is a zero-width escape sequence that terminals ignore.
 * Components emit this at the cursor position when focused.
 * TUI finds and strips this marker, then positions the hardware cursor there.
 */
export const CURSOR_MARKER = "\x1b_pi:c\x07";
export { visibleWidth };
/** Parse a SizeValue into absolute value given a reference size */
function parseSizeValue(value, referenceSize) {
    if (value === undefined)
        return undefined;
    if (typeof value === "number")
        return value;
    // Parse percentage string like "50%"
    const match = value.match(/^(\d+(?:\.\d+)?)%$/);
    if (match) {
        return Math.floor((referenceSize * parseFloat(match[1])) / 100);
    }
    return undefined;
}
function isTermuxSession() {
    return Boolean(process.env.TERMUX_VERSION);
}
/**
 * Container - a component that contains other components
 */
export class Container {
    children = [];
    selectionRegions = [];
    addChild(component) {
        this.children.push(component);
        this.selectionRegions = [];
    }
    removeChild(component) {
        const index = this.children.indexOf(component);
        if (index !== -1) {
            this.children.splice(index, 1);
            this.selectionRegions = [];
        }
    }
    clear() {
        this.children = [];
        this.selectionRegions = [];
    }
    invalidate() {
        this.selectionRegions = [];
        for (const child of this.children) {
            child.invalidate?.();
        }
    }
    render(width) {
        const lines = [];
        const selectionRegions = [];
        for (const child of this.children) {
            const lineOffset = lines.length;
            const childLines = child.render(width);
            for (const region of child.getSelectionRegions?.() ?? []) {
                selectionRegions.push({
                    ...region,
                    line: region.line + lineOffset,
                    tableTop: region.tableTop + lineOffset,
                    tableBottom: region.tableBottom + lineOffset,
                });
            }
            for (const line of childLines) {
                lines.push(line);
            }
        }
        this.selectionRegions = selectionRegions;
        return lines;
    }
    getSelectionRegions() {
        return this.selectionRegions;
    }
}
/**
 * TUI - Main class for managing terminal UI with differential rendering
 */
export class TUI extends Container {
    terminal;
    previousLines = [];
    previousKittyImageIds = new Set();
    previousWidth = 0;
    previousHeight = 0;
    focusedComponent = null;
    inputListeners = new Set();
    /** Global callback for debug key (Shift+Ctrl+D). Called before input is forwarded to focused component. */
    onDebug;
    /** Copies fullscreen mouse selections; when unset, OSC 52 is written directly. */
    onCopy;
    renderRequested = false;
    renderTimer;
    lastRenderAt = 0;
    static MIN_RENDER_INTERVAL_MS = 16;
    cursorRow = 0; // Logical cursor row (end of rendered content)
    hardwareCursorRow = 0; // Actual terminal cursor row (may differ due to IME positioning)
    showHardwareCursor = process.env.PI_HARDWARE_CURSOR === "1";
    clearOnShrink = process.env.PI_CLEAR_ON_SHRINK === "1"; // Clear empty rows when content shrinks (default: off)
    maxLinesRendered = 0; // Track terminal's working area (max lines ever rendered)
    previousViewportTop = 0; // Track previous viewport top for resize-aware cursor moves
    fullRedrawCount = 0;
    preserveViewportOnNextRender = false; // One-shot: repaint visible viewport in place instead of replaying scrollback
    stopped = false;
    overlaySelectionRegions = [];
    // While set, doRender paints fixed frames via the viewport; the inline
    // differ's bookkeeping stays frozen in `inlineState` until exit.
    fullscreen = null;
    static WHEEL_SCROLL_LINES = 3;
    static SELECTION_AUTO_SCROLL_DELAY_MS = 150;
    static SELECTION_AUTO_SCROLL_INTERVAL_MS = 50;
    selectionAutoScrollTimer;
    selectionAutoScrollDirection = null;
    selectionAutoScrollRow = 0;
    selectionAutoScrollColumn = 0;
    // Overlay stack for modal components rendered on top of base content
    focusOrderCounter = 0;
    overlayStack = [];
    constructor(terminal, showHardwareCursor) {
        super();
        this.terminal = terminal;
        if (showHardwareCursor !== undefined) {
            this.showHardwareCursor = showHardwareCursor;
        }
    }
    get fullRedraws() {
        return this.fullRedrawCount;
    }
    getShowHardwareCursor() {
        return this.showHardwareCursor;
    }
    setShowHardwareCursor(enabled) {
        if (this.showHardwareCursor === enabled)
            return;
        this.showHardwareCursor = enabled;
        if (!enabled) {
            this.terminal.hideCursor();
        }
        this.requestRender();
    }
    getClearOnShrink() {
        return this.clearOnShrink;
    }
    /**
     * Set whether to trigger full re-render when content shrinks.
     * When true (default), empty rows are cleared when content shrinks.
     * When false, empty rows remain (reduces redraws on slower terminals).
     */
    setClearOnShrink(enabled) {
        this.clearOnShrink = enabled;
    }
    setFocus(component) {
        // Clear focused flag on old component
        if (isFocusable(this.focusedComponent)) {
            this.focusedComponent.focused = false;
        }
        this.focusedComponent = component;
        // Set focused flag on new component
        if (isFocusable(component)) {
            component.focused = true;
        }
    }
    /**
     * Show an overlay component with configurable positioning and sizing.
     * Returns a handle to control the overlay's visibility.
     */
    showOverlay(component, options) {
        const entry = {
            component,
            options,
            preFocus: this.focusedComponent,
            hidden: false,
            focusOrder: ++this.focusOrderCounter,
        };
        this.overlayStack.push(entry);
        // Only focus if overlay is actually visible
        if (!options?.nonCapturing && this.isOverlayVisible(entry)) {
            this.setFocus(component);
        }
        this.syncFullscreenMouseTracking();
        this.terminal.hideCursor();
        this.requestRender();
        // Return handle for controlling this overlay
        return {
            hide: () => {
                const index = this.overlayStack.indexOf(entry);
                if (index !== -1) {
                    this.overlayStack.splice(index, 1);
                    // Restore focus if this overlay had focus
                    if (this.focusedComponent === component) {
                        const topVisible = this.getTopmostVisibleOverlay();
                        this.setFocus(topVisible?.component ?? entry.preFocus);
                    }
                    if (this.overlayStack.length === 0)
                        this.terminal.hideCursor();
                    this.syncFullscreenMouseTracking();
                    this.requestRender();
                }
            },
            setHidden: (hidden) => {
                if (entry.hidden === hidden)
                    return;
                entry.hidden = hidden;
                // Update focus when hiding/showing
                if (hidden) {
                    // If this overlay had focus, move focus to next visible or preFocus
                    if (this.focusedComponent === component) {
                        const topVisible = this.getTopmostVisibleOverlay();
                        this.setFocus(topVisible?.component ?? entry.preFocus);
                    }
                }
                else {
                    // Restore focus to this overlay when showing (if it's actually visible)
                    if (!options?.nonCapturing && this.isOverlayVisible(entry)) {
                        entry.focusOrder = ++this.focusOrderCounter;
                        this.setFocus(component);
                    }
                }
                this.syncFullscreenMouseTracking();
                this.requestRender();
            },
            isHidden: () => entry.hidden,
            focus: () => {
                if (!this.overlayStack.includes(entry) || !this.isOverlayVisible(entry))
                    return;
                if (this.focusedComponent !== component) {
                    this.setFocus(component);
                }
                entry.focusOrder = ++this.focusOrderCounter;
                this.syncFullscreenMouseTracking();
                this.requestRender();
            },
            unfocus: () => {
                if (this.focusedComponent !== component)
                    return;
                const topVisible = this.getTopmostVisibleOverlay();
                this.setFocus(topVisible && topVisible !== entry ? topVisible.component : entry.preFocus);
                this.syncFullscreenMouseTracking();
                this.requestRender();
            },
            isFocused: () => this.focusedComponent === component,
        };
    }
    /** Hide the topmost overlay and restore previous focus. */
    hideOverlay() {
        const overlay = this.overlayStack.pop();
        if (!overlay)
            return;
        if (this.focusedComponent === overlay.component) {
            // Find topmost visible overlay, or fall back to preFocus
            const topVisible = this.getTopmostVisibleOverlay();
            this.setFocus(topVisible?.component ?? overlay.preFocus);
        }
        if (this.overlayStack.length === 0)
            this.terminal.hideCursor();
        this.syncFullscreenMouseTracking();
        this.requestRender();
    }
    /** Check if there are any visible overlays */
    hasOverlay() {
        return this.overlayStack.some((o) => this.isOverlayVisible(o));
    }
    /** Check if an overlay entry is currently visible */
    isOverlayVisible(entry) {
        if (entry.hidden)
            return false;
        if (entry.options?.visible) {
            return entry.options.visible(this.terminal.columns, this.terminal.rows);
        }
        return true;
    }
    /** Find the topmost visible capturing overlay, if any */
    getTopmostVisibleOverlay() {
        for (let i = this.overlayStack.length - 1; i >= 0; i--) {
            if (this.overlayStack[i].options?.nonCapturing)
                continue;
            if (this.isOverlayVisible(this.overlayStack[i])) {
                return this.overlayStack[i];
            }
        }
        return undefined;
    }
    shouldEnableFullscreenMouseTracking() {
        if (!this.fullscreen?.mouse)
            return false;
        return !this.overlayStack.some((entry) => entry.options?.suspendFullscreenMouse === true && this.isOverlayVisible(entry));
    }
    isFullscreenOverlayFocused() {
        return this.overlayStack.some((entry) => entry.component === this.focusedComponent);
    }
    syncFullscreenMouseTracking() {
        const enabled = this.shouldEnableFullscreenMouseTracking();
        if (!enabled) {
            this.stopSelectionAutoScroll();
            this.fullscreen?.viewport.clearSelection();
        }
        else if (this.isFullscreenOverlayFocused()) {
            this.stopSelectionAutoScroll();
        }
        this.terminal.setMouseTracking(enabled);
    }
    invalidate() {
        super.invalidate();
        for (const overlay of this.overlayStack)
            overlay.component.invalidate?.();
    }
    start() {
        this.stopped = false;
        this.terminal.start((data) => this.handleInput(data), () => this.requestRender());
        this.terminal.hideCursor();
        this.queryCellSize();
        this.requestRender();
    }
    addInputListener(listener) {
        this.inputListeners.add(listener);
        return () => {
            this.inputListeners.delete(listener);
        };
    }
    removeInputListener(listener) {
        this.inputListeners.delete(listener);
    }
    queryCellSize() {
        // Only query if terminal supports images (cell size is only used for image rendering)
        if (!getCapabilities().images) {
            return;
        }
        // Query terminal for cell size in pixels: CSI 16 t
        // Response format: CSI 6 ; height ; width t
        this.terminal.write("\x1b[16t");
    }
    stop(options = {}) {
        const preserveAltScreen = options.preserveAltScreen === true && this.terminal.altScreenActive;
        const flushFullscreen = options.flushFullscreen ?? !preserveAltScreen;
        this.exitFullscreen({ flush: flushFullscreen, leaveAltScreen: !preserveAltScreen });
        this.stopped = true;
        if (this.renderTimer) {
            clearTimeout(this.renderTimer);
            this.renderTimer = undefined;
        }
        // Move cursor to the end of the content to prevent overwriting/artifacts on exit
        if (!preserveAltScreen && this.previousLines.length > 0) {
            const targetRow = this.previousLines.length; // Line after the last content
            const lineDiff = targetRow - this.hardwareCursorRow;
            if (lineDiff > 0) {
                this.terminal.write(`\x1b[${lineDiff}B`);
            }
            else if (lineDiff < 0) {
                this.terminal.write(`\x1b[${-lineDiff}A`);
            }
            this.terminal.write("\r\n");
        }
        if (preserveAltScreen) {
            this.terminal.hideCursor();
        }
        else {
            this.terminal.showCursor();
        }
        this.terminal.stop({ preserveAltScreen });
    }
    requestRender(force = false) {
        if (force) {
            this.fullscreen?.viewport.reset();
            // Keep the previous frame metadata so the forced full repaint can
            // clean up only the visible viewport and avoid touching scrollback.
            this.previousWidth = -1; // -1 triggers widthChanged, forcing a full clear
            this.cursorRow = 0;
            this.hardwareCursorRow = 0;
            this.maxLinesRendered = 0;
            if (this.renderTimer) {
                clearTimeout(this.renderTimer);
                this.renderTimer = undefined;
            }
            this.renderRequested = true;
            process.nextTick(() => {
                if (this.stopped || !this.renderRequested) {
                    return;
                }
                this.renderRequested = false;
                this.lastRenderAt = performance.now();
                this.doRender();
            });
            return;
        }
        if (this.renderRequested)
            return;
        this.renderRequested = true;
        process.nextTick(() => this.scheduleRender());
    }
    /**
     * Request a render that keeps the user anchored at their current scroll
     * position. Normally, when content above the visible viewport changes, the
     * renderer may fall back to a full screen redraw that replays the entire
     * transcript from the top. For deliberate toggles (e.g. expanding all tool
     * output) that is jarring: it scrolls to the top and reprints everything.
     * This instead repaints only the visible viewport in place, leaving
     * scrollback untouched.
     */
    requestRenderPreservingViewport() {
        this.preserveViewportOnNextRender = true;
        this.requestRender();
    }
    /**
     * Render a scrollable transcript window on the alternate screen with `dock`
     * pinned to the bottom rows; the primary screen stays untouched until exit.
     * Wheel tracking is enabled blind — probing is not viable (tmux never
     * answers DECRQM) and unsupporting terminals ignore the mode-sets.
     */
    enterFullscreen(options) {
        if (this.fullscreen)
            return;
        this.fullscreen = {
            viewport: new FullscreenViewport(),
            scroll: options.scroll,
            dock: options.dock,
            mouse: options.mouse !== false,
            viewportControls: options.viewportControls !== false,
            inlineState: {
                previousLines: this.previousLines,
                previousKittyImageIds: this.previousKittyImageIds,
                previousWidth: this.previousWidth,
                previousHeight: this.previousHeight,
                cursorRow: this.cursorRow,
                hardwareCursorRow: this.hardwareCursorRow,
                maxLinesRendered: this.maxLinesRendered,
                previousViewportTop: this.previousViewportTop,
            },
        };
        this.terminal.enterAltScreen();
        this.terminal.hideCursor();
        this.syncFullscreenMouseTracking();
        this.requestRender();
    }
    /**
     * Leave fullscreen. The inline differ resumes against the entry snapshot,
     * so content produced while fullscreen flows into native scrollback.
     */
    exitFullscreen(options = {}) {
        this.stopSelectionAutoScroll();
        if (!this.fullscreen)
            return;
        const { inlineState } = this.fullscreen;
        this.fullscreen = null;
        this.syncFullscreenMouseTracking();
        if (options.leaveAltScreen !== false) {
            this.terminal.leaveAltScreen();
        }
        this.previousLines = inlineState.previousLines;
        this.previousKittyImageIds = inlineState.previousKittyImageIds;
        this.previousWidth = inlineState.previousWidth;
        this.previousHeight = inlineState.previousHeight;
        this.cursorRow = inlineState.cursorRow;
        this.hardwareCursorRow = inlineState.hardwareCursorRow;
        this.maxLinesRendered = inlineState.maxLinesRendered;
        this.previousViewportTop = inlineState.previousViewportTop;
        // synchronous so the flush also happens on shutdown, where a scheduled render never fires
        if (options.flush !== false && !this.stopped) {
            this.doRender();
        }
    }
    isFullscreen() {
        return this.fullscreen !== null;
    }
    /** Scroll the fullscreen transcript window (negative = up). */
    scrollBy(lines) {
        if (!this.fullscreen)
            return;
        this.fullscreen.viewport.scrollBy(lines);
        this.requestRender();
    }
    scrollToTop() {
        if (!this.fullscreen)
            return;
        this.fullscreen.viewport.scrollToTop();
        this.requestRender();
    }
    scrollToBottom() {
        if (!this.fullscreen)
            return;
        this.fullscreen.viewport.scrollToBottom();
        this.requestRender();
    }
    /** Scroll state of the fullscreen window, or null when not fullscreen. */
    getScrollInfo() {
        return this.fullscreen?.viewport.scrollInfo() ?? null;
    }
    copySelection(text) {
        if (this.onCopy) {
            this.onCopy(text);
            return;
        }
        // fallback: OSC 52 works locally, over SSH, and through tmux (set-clipboard)
        const base64 = Buffer.from(text, "utf8").toString("base64");
        this.terminal.write(`\x1b]52;c;${base64}\x07`);
    }
    updateSelectionAutoScroll(viewport, screenRow, screenColumn) {
        const direction = viewport.selectionAutoScrollDirection(screenRow);
        this.selectionAutoScrollRow = screenRow;
        this.selectionAutoScrollColumn = screenColumn;
        if (direction === this.selectionAutoScrollDirection && this.selectionAutoScrollTimer)
            return;
        this.stopSelectionAutoScroll();
        if (direction === null)
            return;
        this.selectionAutoScrollDirection = direction;
        this.scheduleSelectionAutoScroll(TUI.SELECTION_AUTO_SCROLL_DELAY_MS);
    }
    scheduleSelectionAutoScroll(delay) {
        this.selectionAutoScrollTimer = setTimeout(() => {
            this.selectionAutoScrollTimer = undefined;
            const fullscreen = this.fullscreen;
            const direction = this.selectionAutoScrollDirection;
            if (!fullscreen ||
                this.isFullscreenOverlayFocused() ||
                direction === null ||
                fullscreen.viewport.selectionAutoScrollDirection(this.selectionAutoScrollRow) !== direction ||
                !fullscreen.viewport.scrollSelection(direction, this.selectionAutoScrollColumn)) {
                this.stopSelectionAutoScroll();
                return;
            }
            this.requestRender();
            this.scheduleSelectionAutoScroll(TUI.SELECTION_AUTO_SCROLL_INTERVAL_MS);
        }, delay);
        this.selectionAutoScrollTimer.unref();
    }
    stopSelectionAutoScroll() {
        if (this.selectionAutoScrollTimer) {
            clearTimeout(this.selectionAutoScrollTimer);
            this.selectionAutoScrollTimer = undefined;
        }
        this.selectionAutoScrollDirection = null;
    }
    scheduleRender() {
        if (this.stopped || this.renderTimer || !this.renderRequested) {
            return;
        }
        const elapsed = performance.now() - this.lastRenderAt;
        const delay = Math.max(0, TUI.MIN_RENDER_INTERVAL_MS - elapsed);
        this.renderTimer = setTimeout(() => {
            this.renderTimer = undefined;
            if (this.stopped || !this.renderRequested) {
                return;
            }
            this.renderRequested = false;
            this.lastRenderAt = performance.now();
            this.doRender();
            if (this.renderRequested) {
                this.scheduleRender();
            }
        }, delay);
    }
    handleInput(data) {
        if (this.inputListeners.size > 0) {
            let current = data;
            for (const listener of this.inputListeners) {
                const result = listener(current);
                if (result?.consume) {
                    return;
                }
                if (result?.data !== undefined) {
                    current = result.data;
                }
            }
            if (current.length === 0) {
                return;
            }
            data = current;
        }
        // Consume terminal cell size responses without blocking unrelated input.
        if (this.consumeCellSizeResponse(data)) {
            return;
        }
        // Global debug key handler (Shift+Ctrl+D)
        if (matchesKey(data, "shift+ctrl+d") && this.onDebug) {
            this.onDebug();
            return;
        }
        if (this.fullscreen && this.handleFullscreenInput(data)) {
            return;
        }
        // If focused component is an overlay, verify it's still visible
        // (visibility can change due to terminal resize or visible() callback)
        const focusedOverlay = this.overlayStack.find((o) => o.component === this.focusedComponent);
        if (focusedOverlay && !this.isOverlayVisible(focusedOverlay)) {
            // Focused overlay is no longer visible, redirect to topmost visible overlay
            const topVisible = this.getTopmostVisibleOverlay();
            if (topVisible) {
                this.setFocus(topVisible.component);
            }
            else {
                // No visible overlays, restore to preFocus
                this.setFocus(focusedOverlay.preFocus);
            }
        }
        // Pass input to focused component (including Ctrl+C)
        // The focused component can decide how to handle Ctrl+C
        if (this.focusedComponent?.handleInput) {
            // Filter out key release events unless component opts in
            if (isKeyRelease(data) && !this.focusedComponent.wantsKeyRelease) {
                return;
            }
            this.focusedComponent.handleInput(data);
            this.requestRender();
        }
    }
    // Mouse reports are always consumed (nothing downstream understands them);
    // viewport keys are skipped while an overlay has focus so selectors keep
    // their own pageUp/pageDown.
    handleFullscreenInput(data) {
        const fullscreen = this.fullscreen;
        if (!fullscreen)
            return false;
        const overlayFocused = this.isFullscreenOverlayFocused();
        if (isMouseSequence(data)) {
            // consumed even when disabled — mouse reports are garbage downstream
            const event = this.terminal.mouseTrackingActive ? parseSgrMouseEvent(data) : null;
            if (event && !overlayFocused) {
                const viewport = fullscreen.viewport;
                if (isWheelUp(event)) {
                    this.stopSelectionAutoScroll();
                    this.scrollBy(-TUI.WHEEL_SCROLL_LINES);
                }
                else if (isWheelDown(event)) {
                    this.stopSelectionAutoScroll();
                    this.scrollBy(TUI.WHEEL_SCROLL_LINES);
                }
                else if (event.button === MOUSE_BUTTON_LEFT && event.press && !event.motion) {
                    this.stopSelectionAutoScroll();
                    if (!viewport.beginSelection(event.y - 1, event.x - 1)) {
                        viewport.beginFrameSelection(event.y - 1, event.x - 1);
                    }
                    this.requestRender();
                }
                else if (event.button === MOUSE_BUTTON_LEFT && event.press && event.motion) {
                    viewport.extendActiveSelection(event.y - 1, event.x - 1);
                    this.updateSelectionAutoScroll(viewport, event.y - 1, event.x - 1);
                    this.requestRender();
                }
                else if (!event.press && viewport.hasSelection()) {
                    this.stopSelectionAutoScroll();
                    const text = viewport.endActiveSelection();
                    if (text)
                        this.copySelection(text);
                    this.requestRender();
                }
                else if (!event.press) {
                    this.stopSelectionAutoScroll();
                    viewport.clearSelection();
                }
            }
            else if (event && overlayFocused) {
                this.stopSelectionAutoScroll();
                const viewport = fullscreen.viewport;
                if (event.button === MOUSE_BUTTON_LEFT && event.press && !event.motion) {
                    if (!viewport.beginFrameSelection(event.y - 1, event.x - 1)) {
                        viewport.beginSelection(event.y - 1, event.x - 1);
                    }
                    this.requestRender();
                }
                else if (event.button === MOUSE_BUTTON_LEFT && event.press && event.motion) {
                    viewport.extendActiveSelection(event.y - 1, event.x - 1);
                    this.requestRender();
                }
                else if (!event.press && viewport.hasSelection()) {
                    const text = viewport.endActiveSelection();
                    if (text)
                        this.copySelection(text);
                    this.requestRender();
                }
                else if (!event.press) {
                    viewport.clearSelection();
                }
            }
            return true;
        }
        this.stopSelectionAutoScroll();
        if (overlayFocused || !fullscreen.viewportControls)
            return false;
        const keybindings = getKeybindings();
        if (keybindings.matches(data, "tui.viewport.pageUp")) {
            this.scrollBy(-fullscreen.viewport.pageSize());
            return true;
        }
        if (keybindings.matches(data, "tui.viewport.pageDown")) {
            this.scrollBy(fullscreen.viewport.pageSize());
            return true;
        }
        if (keybindings.matches(data, "tui.viewport.top")) {
            this.scrollToTop();
            return true;
        }
        if (keybindings.matches(data, "tui.viewport.follow")) {
            this.scrollToBottom();
            return true;
        }
        return false;
    }
    consumeCellSizeResponse(data) {
        // Response format: ESC [ 6 ; height ; width t
        const match = data.match(/^\x1b\[6;(\d+);(\d+)t$/);
        if (!match) {
            return false;
        }
        const heightPx = parseInt(match[1], 10);
        const widthPx = parseInt(match[2], 10);
        if (heightPx <= 0 || widthPx <= 0) {
            return true;
        }
        setCellDimensions({ widthPx, heightPx });
        // Invalidate all components so images re-render with correct dimensions.
        this.invalidate();
        this.requestRender();
        return true;
    }
    /**
     * Resolve overlay layout from options.
     * Returns { width, row, col, maxHeight } for rendering.
     */
    resolveOverlayLayout(options, overlayHeight, termWidth, termHeight) {
        const opt = options ?? {};
        // Parse margin (clamp to non-negative)
        const margin = typeof opt.margin === "number"
            ? { top: opt.margin, right: opt.margin, bottom: opt.margin, left: opt.margin }
            : (opt.margin ?? {});
        const marginTop = Math.max(0, margin.top ?? 0);
        const marginRight = Math.max(0, margin.right ?? 0);
        const marginBottom = Math.max(0, margin.bottom ?? 0);
        const marginLeft = Math.max(0, margin.left ?? 0);
        // Available space after margins
        const availWidth = Math.max(1, termWidth - marginLeft - marginRight);
        const availHeight = Math.max(1, termHeight - marginTop - marginBottom);
        // === Resolve width ===
        let width = parseSizeValue(opt.width, termWidth) ?? Math.min(80, availWidth);
        // Apply minWidth
        if (opt.minWidth !== undefined) {
            width = Math.max(width, opt.minWidth);
        }
        // Clamp to available space
        width = Math.max(1, Math.min(width, availWidth));
        // === Resolve maxHeight ===
        let maxHeight = parseSizeValue(opt.maxHeight, termHeight);
        // Clamp to available space
        if (maxHeight !== undefined) {
            maxHeight = Math.max(1, Math.min(maxHeight, availHeight));
        }
        // Effective overlay height (may be clamped by maxHeight)
        const effectiveHeight = maxHeight !== undefined ? Math.min(overlayHeight, maxHeight) : overlayHeight;
        // === Resolve position ===
        let row;
        let col;
        if (opt.row !== undefined) {
            if (typeof opt.row === "string") {
                // Percentage: 0% = top, 100% = bottom (overlay stays within bounds)
                const match = opt.row.match(/^(\d+(?:\.\d+)?)%$/);
                if (match) {
                    const maxRow = Math.max(0, availHeight - effectiveHeight);
                    const percent = parseFloat(match[1]) / 100;
                    row = marginTop + Math.floor(maxRow * percent);
                }
                else {
                    // Invalid format, fall back to center
                    row = this.resolveAnchorRow("center", effectiveHeight, availHeight, marginTop);
                }
            }
            else {
                // Absolute row position
                row = opt.row;
            }
        }
        else {
            // Anchor-based (default: center)
            const anchor = opt.anchor ?? "center";
            row = this.resolveAnchorRow(anchor, effectiveHeight, availHeight, marginTop);
        }
        if (opt.col !== undefined) {
            if (typeof opt.col === "string") {
                // Percentage: 0% = left, 100% = right (overlay stays within bounds)
                const match = opt.col.match(/^(\d+(?:\.\d+)?)%$/);
                if (match) {
                    const maxCol = Math.max(0, availWidth - width);
                    const percent = parseFloat(match[1]) / 100;
                    col = marginLeft + Math.floor(maxCol * percent);
                }
                else {
                    // Invalid format, fall back to center
                    col = this.resolveAnchorCol("center", width, availWidth, marginLeft);
                }
            }
            else {
                // Absolute column position
                col = opt.col;
            }
        }
        else {
            // Anchor-based (default: center)
            const anchor = opt.anchor ?? "center";
            col = this.resolveAnchorCol(anchor, width, availWidth, marginLeft);
        }
        // Apply offsets
        if (opt.offsetY !== undefined)
            row += opt.offsetY;
        if (opt.offsetX !== undefined)
            col += opt.offsetX;
        // Clamp to terminal bounds (respecting margins)
        row = Math.max(marginTop, Math.min(row, termHeight - marginBottom - effectiveHeight));
        col = Math.max(marginLeft, Math.min(col, termWidth - marginRight - width));
        return { width, row, col, maxHeight };
    }
    resolveAnchorRow(anchor, height, availHeight, marginTop) {
        switch (anchor) {
            case "top-left":
            case "top-center":
            case "top-right":
                return marginTop;
            case "bottom-left":
            case "bottom-center":
            case "bottom-right":
                return marginTop + availHeight - height;
            case "left-center":
            case "center":
            case "right-center":
                return marginTop + Math.floor((availHeight - height) / 2);
        }
    }
    resolveAnchorCol(anchor, width, availWidth, marginLeft) {
        switch (anchor) {
            case "top-left":
            case "left-center":
            case "bottom-left":
                return marginLeft;
            case "top-right":
            case "right-center":
            case "bottom-right":
                return marginLeft + availWidth - width;
            case "top-center":
            case "center":
            case "bottom-center":
                return marginLeft + Math.floor((availWidth - width) / 2);
        }
    }
    /** Composite all overlays into content lines (sorted by focusOrder, higher = on top). */
    compositeOverlays(lines, termWidth, termHeight) {
        if (this.overlayStack.length === 0)
            return lines;
        const result = [...lines];
        const overlaySelectionRegions = [...this.overlaySelectionRegions];
        // Pre-render all visible overlays and calculate positions
        const rendered = [];
        let minLinesNeeded = result.length;
        const visibleEntries = this.overlayStack.filter((e) => this.isOverlayVisible(e));
        visibleEntries.sort((a, b) => a.focusOrder - b.focusOrder);
        for (const entry of visibleEntries) {
            const { component, options } = entry;
            const scrollback = options?.scrollback === true;
            let aboveMarker;
            if (options?.aboveMarker) {
                for (let line = result.length - 1; line >= 0; line--) {
                    const markerIndex = result[line].indexOf(options.aboveMarker);
                    if (markerIndex === -1)
                        continue;
                    aboveMarker = {
                        line,
                        col: visibleWidth(result[line].slice(0, markerIndex)),
                        offsetY: options.offsetY ?? 0,
                    };
                    result[line] =
                        result[line].slice(0, markerIndex) + result[line].slice(markerIndex + options.aboveMarker.length);
                    break;
                }
                if (!aboveMarker)
                    continue;
            }
            // Get layout with height=0 first to determine width and maxHeight
            // (width and maxHeight don't depend on overlay height)
            const { width, maxHeight } = this.resolveOverlayLayout(options, 0, termWidth, termHeight);
            // Render component at calculated width
            let overlayLines = component.render(width);
            // Apply maxHeight if specified
            if (maxHeight !== undefined && overlayLines.length > maxHeight) {
                overlayLines = overlayLines.slice(0, maxHeight);
            }
            // Get final row/col with actual overlay height
            const { row, col } = this.resolveOverlayLayout(options, overlayLines.length, termWidth, termHeight);
            rendered.push({ component, overlayLines, row, col, w: width, scrollback, aboveMarker });
            if (!aboveMarker) {
                minLinesNeeded = Math.max(minLinesNeeded, row + overlayLines.length);
            }
        }
        // Pad to at least terminal height so overlays have screen-relative positions.
        // Excludes maxLinesRendered: the historical high-water mark caused self-reinforcing
        // inflation that pushed content into scrollback on terminal widen.
        const workingHeight = Math.max(result.length, termHeight, minLinesNeeded);
        // Extend result with empty lines if content is too short for overlay placement or working area
        while (result.length < workingHeight) {
            result.push("");
        }
        const viewportStart = Math.max(0, workingHeight - termHeight);
        // Composite each overlay
        for (const renderedOverlay of rendered) {
            const { component, w, scrollback, aboveMarker } = renderedOverlay;
            let { overlayLines, row, col } = renderedOverlay;
            if (aboveMarker) {
                const markerRow = Math.max(1, aboveMarker.line - viewportStart + aboveMarker.offsetY);
                if (markerRow >= termHeight)
                    continue;
                while (overlayLines.length > markerRow && stripAnsi(overlayLines[0] ?? "").trim().length === 0) {
                    overlayLines = overlayLines.slice(1);
                }
                while (overlayLines.length > markerRow && stripAnsi(overlayLines.at(-1) ?? "").trim().length === 0) {
                    overlayLines = overlayLines.slice(0, -1);
                }
                if (overlayLines.length > markerRow) {
                    overlayLines = overlayLines.slice(overlayLines.length - markerRow);
                }
                row = markerRow - overlayLines.length;
                col = Math.max(0, Math.min(aboveMarker.col, termWidth - w));
            }
            const overlayStart = scrollback && !aboveMarker ? Math.max(0, workingHeight - (row + overlayLines.length)) : viewportStart;
            for (let i = 0; i < overlayLines.length; i++) {
                const idx = overlayStart + row + i;
                if (idx >= 0 && idx < result.length) {
                    // Defensive: truncate overlay line to declared width before compositing
                    // (components should already respect width, but this ensures it)
                    const truncatedOverlayLine = visibleWidth(overlayLines[i]) > w ? sliceByColumn(overlayLines[i], 0, w, true) : overlayLines[i];
                    result[idx] = this.compositeLineAt(result[idx], truncatedOverlayLine, col, w, termWidth);
                    this.subtractSelectionCoverage(overlaySelectionRegions, idx, col, col + w);
                    const span = component === this.focusedComponent ? this.selectableSpan(truncatedOverlayLine, w) : null;
                    if (span) {
                        overlaySelectionRegions.push({ line: idx, col: col + span.from, width: span.to - span.from });
                    }
                }
            }
        }
        this.overlaySelectionRegions = overlaySelectionRegions;
        return result;
    }
    selectableSpan(line, maxWidth) {
        return visibleContentSpan(line, maxWidth);
    }
    createDockSelectionRegions(frame, transcriptWindowHeight, width) {
        const regions = [];
        for (let row = Math.max(0, transcriptWindowHeight); row < frame.length; row++) {
            const span = this.selectableSpan(frame[row] ?? "", width);
            if (span) {
                regions.push({ line: row, col: span.from, width: span.to - span.from });
            }
        }
        return regions;
    }
    subtractSelectionCoverage(regions, line, coverStart, coverEnd) {
        for (let i = regions.length - 1; i >= 0; i--) {
            const region = regions[i];
            if (region.line !== line)
                continue;
            const regionStart = region.col;
            const regionEnd = region.col + region.width;
            if (coverEnd <= regionStart || coverStart >= regionEnd)
                continue;
            const replacements = [];
            if (regionStart < coverStart) {
                replacements.push({ line, col: regionStart, width: coverStart - regionStart });
            }
            if (coverEnd < regionEnd) {
                replacements.push({ line, col: coverEnd, width: regionEnd - coverEnd });
            }
            regions.splice(i, 1, ...replacements);
        }
    }
    static SEGMENT_RESET = "\x1b[0m\x1b]8;;\x07";
    applyLineResets(lines) {
        const reset = TUI.SEGMENT_RESET;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!isImageLine(line)) {
                lines[i] = normalizeTerminalOutput(line) + reset;
            }
        }
        return lines;
    }
    collectKittyImageIds(lines) {
        const ids = new Set();
        for (const line of lines) {
            for (const id of extractKittyImageIds(line)) {
                ids.add(id);
            }
        }
        return ids;
    }
    deleteKittyImages(ids) {
        let buffer = "";
        for (const id of ids) {
            buffer += deleteKittyImage(id);
        }
        return buffer;
    }
    expandLastChangedForKittyImages(firstChanged, lastChanged) {
        let expandedLastChanged = lastChanged;
        for (let i = firstChanged; i < this.previousLines.length; i++) {
            if (extractKittyImageIds(this.previousLines[i]).length > 0) {
                expandedLastChanged = Math.max(expandedLastChanged, i);
            }
        }
        return expandedLastChanged;
    }
    deleteChangedKittyImages(firstChanged, lastChanged) {
        if (firstChanged < 0 || lastChanged < firstChanged)
            return "";
        const ids = new Set();
        const maxLine = Math.min(lastChanged, this.previousLines.length - 1);
        for (let i = firstChanged; i <= maxLine; i++) {
            for (const id of extractKittyImageIds(this.previousLines[i] ?? "")) {
                ids.add(id);
            }
        }
        return this.deleteKittyImages(ids);
    }
    /** Splice overlay content into a base line at a specific column. Single-pass optimized. */
    compositeLineAt(baseLine, overlayLine, startCol, overlayWidth, totalWidth) {
        if (isImageLine(baseLine))
            return baseLine;
        // Single pass through baseLine extracts both before and after segments
        const afterStart = startCol + overlayWidth;
        const base = extractSegments(baseLine, startCol, afterStart, totalWidth - afterStart, true);
        // Extract overlay with width tracking (strict=true to exclude wide chars at boundary)
        const overlay = sliceWithWidth(overlayLine, 0, overlayWidth, true);
        // Pad segments to target widths
        const beforePad = Math.max(0, startCol - base.beforeWidth);
        const overlayPad = Math.max(0, overlayWidth - overlay.width);
        const actualBeforeWidth = Math.max(startCol, base.beforeWidth);
        const actualOverlayWidth = Math.max(overlayWidth, overlay.width);
        const afterTarget = Math.max(0, totalWidth - actualBeforeWidth - actualOverlayWidth);
        const afterPad = Math.max(0, afterTarget - base.afterWidth);
        // Compose result
        const r = TUI.SEGMENT_RESET;
        const result = base.before +
            " ".repeat(beforePad) +
            r +
            overlay.text +
            " ".repeat(overlayPad) +
            r +
            base.after +
            " ".repeat(afterPad);
        // CRITICAL: Always verify and truncate to terminal width.
        // This is the final safeguard against width overflow which would crash the TUI.
        // Width tracking can drift from actual visible width due to:
        // - Complex ANSI/OSC sequences (hyperlinks, colors)
        // - Wide characters at segment boundaries
        // - Edge cases in segment extraction
        const resultWidth = visibleWidth(result);
        if (resultWidth <= totalWidth) {
            return result;
        }
        // Truncate with strict=true to ensure we don't exceed totalWidth
        return sliceByColumn(result, 0, totalWidth, true);
    }
    /**
     * Find and extract cursor position from rendered lines.
     * Searches for CURSOR_MARKER, calculates its position, and strips it from the output.
     * Only scans the bottom terminal height lines (visible viewport).
     * @param lines - Rendered lines to search
     * @param height - Terminal height (visible viewport size)
     * @returns Cursor position { row, col } or null if no marker found
     */
    extractCursorPosition(lines, height) {
        // Only scan the bottom `height` lines (visible viewport)
        const viewportTop = Math.max(0, lines.length - height);
        for (let row = lines.length - 1; row >= viewportTop; row--) {
            const line = lines[row];
            const markerIndex = line.indexOf(CURSOR_MARKER);
            if (markerIndex !== -1) {
                // Calculate visual column (width of text before marker)
                const beforeMarker = line.slice(0, markerIndex);
                const col = visibleWidth(beforeMarker);
                // Strip marker from the line
                lines[row] = line.slice(0, markerIndex) + line.slice(markerIndex + CURSOR_MARKER.length);
                return { row, col };
            }
        }
        return null;
    }
    renderFullscreen() {
        const fullscreen = this.fullscreen;
        if (!fullscreen)
            return;
        const width = this.terminal.columns;
        const height = this.terminal.rows;
        this.syncFullscreenMouseTracking();
        this.overlaySelectionRegions = [];
        const transcript = [];
        const selectionRegions = [];
        const dock = withFullscreenImageFallback(() => {
            for (const component of fullscreen.scroll) {
                const lineOffset = transcript.length;
                const componentLines = component.render(width);
                for (const region of component.getSelectionRegions?.() ?? []) {
                    selectionRegions.push({
                        ...region,
                        line: region.line + lineOffset,
                        tableTop: region.tableTop + lineOffset,
                        tableBottom: region.tableBottom + lineOffset,
                    });
                }
                transcript.push(...componentLines);
            }
            return fullscreen.dock.render(width);
        });
        let frame = fullscreen.viewport.composeFrame(transcript, dock, height, selectionRegions);
        this.overlaySelectionRegions.push(...this.createDockSelectionRegions(frame, fullscreen.viewport.windowHeight(), width));
        const scrollInfo = fullscreen.viewport.scrollInfo();
        if (fullscreen.viewportControls && !scrollInfo.following) {
            // Follow hint composited over the bottom of the transcript window,
            // just above the dock. Overlays still paint on top of it.
            const followKey = getKeybindings().getKeys("tui.viewport.follow")[0] ?? "ctrl+shift+down";
            const label = ` ${followKey} to follow `;
            const labelWidth = visibleWidth(label);
            const row = fullscreen.viewport.windowHeight() - 1;
            if (row >= 0 && row < frame.length && labelWidth <= width) {
                const col = Math.floor((width - labelWidth) / 2);
                frame[row] = this.compositeLineAt(frame[row], `\x1b[7m${label}\x1b[27m`, col, labelWidth, width);
            }
        }
        if (this.overlayStack.length > 0) {
            frame = withFullscreenImageFallback(() => this.compositeOverlays(frame, width, height));
        }
        const cursorPos = this.extractCursorPosition(frame, height);
        fullscreen.viewport.applyFrameSelection(frame, height, this.overlaySelectionRegions);
        this.applyLineResets(frame);
        fullscreen.viewport.paint((data) => this.terminal.write(data), frame, width, height, cursorPos);
        if (cursorPos && this.showHardwareCursor) {
            this.terminal.showCursor();
        }
        else {
            this.terminal.hideCursor();
        }
    }
    doRender() {
        if (this.stopped)
            return;
        if (this.fullscreen) {
            this.preserveViewportOnNextRender = false;
            this.renderFullscreen();
            return;
        }
        // One-shot: consume here so it never leaks into a later render.
        this.overlaySelectionRegions = [];
        const preserveViewport = this.preserveViewportOnNextRender;
        this.preserveViewportOnNextRender = false;
        const width = this.terminal.columns;
        const height = this.terminal.rows;
        const widthChanged = this.previousWidth !== 0 && this.previousWidth !== width;
        const heightChanged = this.previousHeight !== 0 && this.previousHeight !== height;
        const previousBufferLength = this.previousHeight > 0 ? this.previousViewportTop + this.previousHeight : height;
        let prevViewportTop = heightChanged ? Math.max(0, previousBufferLength - height) : this.previousViewportTop;
        let viewportTop = prevViewportTop;
        let hardwareCursorRow = this.hardwareCursorRow;
        const computeLineDiff = (targetRow) => {
            const currentScreenRow = hardwareCursorRow - prevViewportTop;
            const targetScreenRow = targetRow - viewportTop;
            return targetScreenRow - currentScreenRow;
        };
        // Render all components to get new lines
        let newLines = this.render(width);
        // Composite overlays into the rendered lines (before differential compare)
        if (this.overlayStack.length > 0) {
            newLines = this.compositeOverlays(newLines, width, height);
        }
        // Extract cursor position before applying line resets (marker must be found first)
        const cursorPos = this.extractCursorPosition(newLines, height);
        newLines = this.applyLineResets(newLines);
        // Helper to clear the viewport and repaint the current screen. Do not
        // clear terminal scrollback: users rely on it to read long prior messages.
        const fullRender = (clear, preserveViewport = false) => {
            this.fullRedrawCount += 1;
            let buffer = "\x1b[?2026h"; // Begin synchronized output
            // Viewport-preserving repaint: rewrite only the visible viewport in
            // place, leaving terminal scrollback untouched. Keeps the user
            // anchored at their current focus instead of replaying the whole
            // (now-resized) transcript from the top. Only meaningful when there
            // is a previous frame on screen to paint over.
            if (preserveViewport && this.previousLines.length > 0) {
                const windowStart = Math.max(0, newLines.length - height);
                const visibleCount = newLines.length - windowStart;
                // Rows the previous frame occupied on screen.
                const prevScreenRows = Math.min(height, this.previousLines.length);
                // Only delete Kitty images within the repainted viewport. Images that
                // live in scrollback above the visible slice are never redrawn here, so
                // deleting them would leave broken history when the user scrolls up.
                buffer += this.deleteChangedKittyImages(prevViewportTop, prevViewportTop + prevScreenRows - 1);
                // Move the hardware cursor up to the top of the visible screen.
                // Use the local prevViewportTop (height-adjusted earlier in doRender)
                // rather than the field, so the move stays consistent with the rest
                // of the render when the terminal height changed this frame.
                const screenRow = Math.max(0, Math.min(prevScreenRows - 1, this.hardwareCursorRow - prevViewportTop));
                if (screenRow > 0)
                    buffer += `\x1b[${screenRow}A`;
                buffer += "\r";
                // Clear the top row up front: the loop below clears it on its first
                // iteration, but when there is no content (visibleCount === 0) the
                // loop never runs and the leftover-clear moves down before clearing,
                // which would leave row 0 stale.
                if (visibleCount === 0)
                    buffer += "\x1b[2K";
                for (let i = 0; i < visibleCount; i++) {
                    if (i > 0)
                        buffer += "\r\n";
                    buffer += "\x1b[2K"; // Clear current line
                    buffer += newLines[windowStart + i];
                }
                // Clear any rows the previous frame used below the new content.
                // Row 0 is already occupied (by content, or by the visibleCount === 0
                // clear above), so only clear the rows below it — clamping with
                // max(visibleCount, 1) avoids emitting a newline past the last screen
                // row, which would scroll the terminal.
                if (visibleCount < prevScreenRows) {
                    const leftover = prevScreenRows - Math.max(visibleCount, 1);
                    for (let i = 0; i < leftover; i++) {
                        buffer += "\r\n\x1b[2K";
                    }
                    if (leftover > 0)
                        buffer += `\x1b[${leftover}A`; // Back up to the last content row
                }
                buffer += "\x1b[?2026l"; // End synchronized output
                this.terminal.write(buffer);
                this.cursorRow = Math.max(0, newLines.length - 1);
                this.hardwareCursorRow = this.cursorRow;
                // Reset (not just grow) the high-water mark to the repainted content,
                // mirroring the full-redraw path. Otherwise a preserving collapse
                // leaves maxLinesRendered inflated, and the next plain render would
                // re-trigger clearOnShrink.
                this.maxLinesRendered = newLines.length;
                this.previousViewportTop = windowStart;
                this.positionHardwareCursor(cursorPos, newLines.length);
                this.previousLines = newLines;
                this.previousKittyImageIds = this.collectKittyImageIds(newLines);
                this.previousWidth = width;
                this.previousHeight = height;
                return;
            }
            const renderStart = clear && this.previousLines.length > 0 ? Math.max(0, newLines.length - height) : 0;
            if (clear) {
                const previousVisibleTop = Math.min(prevViewportTop, Math.max(0, this.previousLines.length - height));
                const previousVisibleBottom = Math.min(this.previousLines.length - 1, previousVisibleTop + height - 1);
                buffer += this.deleteChangedKittyImages(previousVisibleTop, previousVisibleBottom);
                buffer += "\x1b[2J\x1b[H"; // Clear screen and home while preserving scrollback
            }
            for (let i = renderStart; i < newLines.length; i++) {
                if (i > renderStart)
                    buffer += "\r\n";
                buffer += newLines[i];
            }
            buffer += "\x1b[?2026l"; // End synchronized output
            this.terminal.write(buffer);
            this.cursorRow = Math.max(0, newLines.length - 1);
            this.hardwareCursorRow = this.cursorRow;
            // Reset max lines when clearing, otherwise track growth
            if (clear) {
                this.maxLinesRendered = newLines.length;
            }
            else {
                this.maxLinesRendered = Math.max(this.maxLinesRendered, newLines.length);
            }
            const bufferLength = Math.max(height, newLines.length);
            this.previousViewportTop = Math.max(0, bufferLength - height);
            this.positionHardwareCursor(cursorPos, newLines.length);
            this.previousLines = newLines;
            this.previousKittyImageIds = this.collectKittyImageIds(newLines);
            this.previousWidth = width;
            this.previousHeight = height;
        };
        const debugRedraw = process.env.PI_DEBUG_REDRAW === "1";
        const logRedraw = (reason) => {
            if (!debugRedraw)
                return;
            const logPath = path.join(os.homedir(), ".prime", "agent", "pi-debug.log");
            const msg = `[${new Date().toISOString()}] fullRender: ${reason} (prev=${this.previousLines.length}, new=${newLines.length}, height=${height})\n`;
            fs.appendFileSync(logPath, msg);
        };
        // First render - just output everything without clearing (assumes clean screen)
        if (this.previousLines.length === 0 && !widthChanged && !heightChanged) {
            logRedraw("first render");
            fullRender(false);
            return;
        }
        // Width changes always need a full re-render because wrapping changes.
        if (widthChanged) {
            logRedraw(`terminal width changed (${this.previousWidth} -> ${width})`);
            fullRender(true);
            return;
        }
        // Height changes normally need a full re-render to keep the visible viewport aligned,
        // but Termux changes height when the software keyboard shows or hides.
        // In that environment, a full redraw causes the entire history to replay on every toggle.
        if (heightChanged && !isTermuxSession()) {
            logRedraw(`terminal height changed (${this.previousHeight} -> ${height})`);
            fullRender(true);
            return;
        }
        // Content shrunk below the working area and no overlays - re-render to clear empty rows
        // (overlays need the padding, so only do this when no overlays are active)
        // Configurable via setClearOnShrink() or PI_CLEAR_ON_SHRINK=0 env var
        if (this.clearOnShrink && newLines.length < this.maxLinesRendered && this.overlayStack.length === 0) {
            logRedraw(`clearOnShrink (maxLinesRendered=${this.maxLinesRendered})`);
            fullRender(true, preserveViewport);
            return;
        }
        // Find first and last changed lines
        let firstChanged = -1;
        let lastChanged = -1;
        const maxLines = Math.max(newLines.length, this.previousLines.length);
        for (let i = 0; i < maxLines; i++) {
            const oldLine = i < this.previousLines.length ? this.previousLines[i] : "";
            const newLine = i < newLines.length ? newLines[i] : "";
            if (oldLine !== newLine) {
                if (firstChanged === -1) {
                    firstChanged = i;
                }
                lastChanged = i;
            }
        }
        const appendedLines = newLines.length > this.previousLines.length;
        if (appendedLines) {
            if (firstChanged === -1) {
                firstChanged = this.previousLines.length;
            }
            lastChanged = newLines.length - 1;
        }
        if (firstChanged !== -1) {
            lastChanged = this.expandLastChangedForKittyImages(firstChanged, lastChanged);
        }
        const appendStart = appendedLines && firstChanged === this.previousLines.length && firstChanged > 0;
        // No changes - but still need to update hardware cursor position if it moved
        if (firstChanged === -1) {
            this.positionHardwareCursor(cursorPos, newLines.length);
            this.previousViewportTop = prevViewportTop;
            this.previousHeight = height;
            return;
        }
        // All changes are in deleted lines (nothing to render, just clear)
        if (firstChanged >= newLines.length) {
            if (this.previousLines.length > newLines.length) {
                let buffer = "\x1b[?2026h";
                buffer += this.deleteChangedKittyImages(firstChanged, lastChanged);
                // Move to end of new content (clamp to 0 for empty content)
                const targetRow = Math.max(0, newLines.length - 1);
                if (targetRow < prevViewportTop) {
                    logRedraw(`deleted lines moved viewport up (${targetRow} < ${prevViewportTop})`);
                    fullRender(true, preserveViewport);
                    return;
                }
                const lineDiff = computeLineDiff(targetRow);
                if (lineDiff > 0)
                    buffer += `\x1b[${lineDiff}B`;
                else if (lineDiff < 0)
                    buffer += `\x1b[${-lineDiff}A`;
                buffer += "\r";
                // Clear extra lines without scrolling
                const extraLines = this.previousLines.length - newLines.length;
                if (extraLines > height) {
                    logRedraw(`extraLines > height (${extraLines} > ${height})`);
                    fullRender(true, preserveViewport);
                    return;
                }
                if (extraLines > 0) {
                    buffer += "\x1b[1B";
                }
                for (let i = 0; i < extraLines; i++) {
                    buffer += "\r\x1b[2K";
                    if (i < extraLines - 1)
                        buffer += "\x1b[1B";
                }
                if (extraLines > 0) {
                    buffer += `\x1b[${extraLines}A`;
                }
                buffer += "\x1b[?2026l";
                this.terminal.write(buffer);
                this.cursorRow = targetRow;
                this.hardwareCursorRow = targetRow;
            }
            this.positionHardwareCursor(cursorPos, newLines.length);
            this.previousLines = newLines;
            this.previousKittyImageIds = this.collectKittyImageIds(newLines);
            this.previousWidth = width;
            this.previousHeight = height;
            this.previousViewportTop = prevViewportTop;
            return;
        }
        // Differential rendering can only touch what was actually visible.
        // If the first changed line is above the previous viewport, the rows on
        // screen no longer correspond to newLines, so we have to repaint.
        //
        // When the transcript is taller than the viewport — e.g. attaching to a
        // long or still-streaming session, where off-screen tool results keep
        // resolving — replaying the whole transcript on every such change is what
        // makes the screen flicker and scroll from the
        // top. Repaint only the visible window in place instead, leaving
        // scrollback (and the user's history) untouched. Short transcripts that
        // fit on screen keep the cheap full redraw.
        //
        // Only do this while the transcript is growing (the streaming case). A
        // shrink — a rebuild or compaction that replaces the transcript with
        // fewer lines — leaves the now-removed lines stale in scrollback above the
        // visible window, so it still needs a full screen redraw. That is a
        // one-time event, so it costs no recurring flicker.
        if (firstChanged < prevViewportTop) {
            logRedraw(`firstChanged < viewportTop (${firstChanged} < ${prevViewportTop})`);
            const preserveScrollback = newLines.length > height && newLines.length >= this.previousLines.length;
            fullRender(true, preserveScrollback || preserveViewport);
            return;
        }
        // Render from first changed line to end
        // Build buffer with all updates wrapped in synchronized output
        let buffer = "\x1b[?2026h"; // Begin synchronized output
        buffer += this.deleteChangedKittyImages(firstChanged, lastChanged);
        const prevViewportBottom = prevViewportTop + height - 1;
        const moveTargetRow = appendStart ? firstChanged - 1 : firstChanged;
        if (moveTargetRow > prevViewportBottom) {
            const currentScreenRow = Math.max(0, Math.min(height - 1, hardwareCursorRow - prevViewportTop));
            const moveToBottom = height - 1 - currentScreenRow;
            if (moveToBottom > 0) {
                buffer += `\x1b[${moveToBottom}B`;
            }
            const scroll = moveTargetRow - prevViewportBottom;
            buffer += "\r\n".repeat(scroll);
            prevViewportTop += scroll;
            viewportTop += scroll;
            hardwareCursorRow = moveTargetRow;
        }
        // Move cursor to first changed line (use hardwareCursorRow for actual position)
        const lineDiff = computeLineDiff(moveTargetRow);
        if (lineDiff > 0) {
            buffer += `\x1b[${lineDiff}B`; // Move down
        }
        else if (lineDiff < 0) {
            buffer += `\x1b[${-lineDiff}A`; // Move up
        }
        buffer += appendStart ? "\r\n" : "\r"; // Move to column 0
        // Only render changed lines (firstChanged to lastChanged), not all lines to end
        // This reduces flicker when only a single line changes (e.g., spinner animation)
        const renderEnd = Math.min(lastChanged, newLines.length - 1);
        for (let i = firstChanged; i <= renderEnd; i++) {
            if (i > firstChanged)
                buffer += "\r\n";
            buffer += "\x1b[2K"; // Clear current line
            const line = newLines[i];
            const isImage = isImageLine(line);
            if (!isImage && visibleWidth(line) > width) {
                // Log all lines to crash file for debugging
                const crashLogPath = path.join(os.homedir(), ".prime", "agent", "pi-crash.log");
                const crashData = [
                    `Crash at ${new Date().toISOString()}`,
                    `Terminal width: ${width}`,
                    `Line ${i} visible width: ${visibleWidth(line)}`,
                    "",
                    "=== All rendered lines ===",
                    ...newLines.map((l, idx) => `[${idx}] (w=${visibleWidth(l)}) ${l}`),
                    "",
                ].join("\n");
                fs.mkdirSync(path.dirname(crashLogPath), { recursive: true });
                fs.writeFileSync(crashLogPath, crashData);
                // Clean up terminal state before throwing
                this.stop();
                const errorMsg = [
                    `Rendered line ${i} exceeds terminal width (${visibleWidth(line)} > ${width}).`,
                    "",
                    "This is likely caused by a custom TUI component not truncating its output.",
                    "Use visibleWidth() to measure and truncateToWidth() to truncate lines.",
                    "",
                    `Debug log written to: ${crashLogPath}`,
                ].join("\n");
                throw new Error(errorMsg);
            }
            buffer += line;
        }
        // Track where cursor ended up after rendering
        let finalCursorRow = renderEnd;
        // If we had more lines before, clear them and move cursor back
        if (this.previousLines.length > newLines.length) {
            // Move to end of new content first if we stopped before it
            if (renderEnd < newLines.length - 1) {
                const moveDown = newLines.length - 1 - renderEnd;
                buffer += `\x1b[${moveDown}B`;
                finalCursorRow = newLines.length - 1;
            }
            const extraLines = this.previousLines.length - newLines.length;
            for (let i = newLines.length; i < this.previousLines.length; i++) {
                buffer += "\r\n\x1b[2K";
            }
            // Move cursor back to end of new content
            buffer += `\x1b[${extraLines}A`;
        }
        buffer += "\x1b[?2026l"; // End synchronized output
        if (process.env.PI_TUI_DEBUG === "1") {
            const debugDir = "/tmp/tui";
            fs.mkdirSync(debugDir, { recursive: true });
            const debugPath = path.join(debugDir, `render-${Date.now()}-${Math.random().toString(36).slice(2)}.log`);
            const debugData = [
                `firstChanged: ${firstChanged}`,
                `viewportTop: ${viewportTop}`,
                `cursorRow: ${this.cursorRow}`,
                `height: ${height}`,
                `lineDiff: ${lineDiff}`,
                `hardwareCursorRow: ${hardwareCursorRow}`,
                `renderEnd: ${renderEnd}`,
                `finalCursorRow: ${finalCursorRow}`,
                `cursorPos: ${JSON.stringify(cursorPos)}`,
                `newLines.length: ${newLines.length}`,
                `previousLines.length: ${this.previousLines.length}`,
                "",
                "=== newLines ===",
                JSON.stringify(newLines, null, 2),
                "",
                "=== previousLines ===",
                JSON.stringify(this.previousLines, null, 2),
                "",
                "=== buffer ===",
                JSON.stringify(buffer),
            ].join("\n");
            fs.writeFileSync(debugPath, debugData);
        }
        // Write entire buffer at once
        this.terminal.write(buffer);
        // Track cursor position for next render
        // cursorRow tracks end of content (for viewport calculation)
        // hardwareCursorRow tracks actual terminal cursor position (for movement)
        this.cursorRow = Math.max(0, newLines.length - 1);
        this.hardwareCursorRow = finalCursorRow;
        // Track terminal's working area (grows but doesn't shrink unless cleared)
        this.maxLinesRendered = Math.max(this.maxLinesRendered, newLines.length);
        this.previousViewportTop = Math.max(prevViewportTop, finalCursorRow - height + 1);
        // Position hardware cursor for IME
        this.positionHardwareCursor(cursorPos, newLines.length);
        this.previousLines = newLines;
        this.previousKittyImageIds = this.collectKittyImageIds(newLines);
        this.previousWidth = width;
        this.previousHeight = height;
    }
    /**
     * Position the hardware cursor for IME candidate window.
     * @param cursorPos The cursor position extracted from rendered output, or null
     * @param totalLines Total number of rendered lines
     */
    positionHardwareCursor(cursorPos, totalLines) {
        if (!cursorPos || totalLines <= 0) {
            this.terminal.hideCursor();
            return;
        }
        // Clamp cursor position to valid range
        const targetRow = Math.max(0, Math.min(cursorPos.row, totalLines - 1));
        const targetCol = Math.max(0, cursorPos.col);
        // Move cursor from current position to target
        const rowDelta = targetRow - this.hardwareCursorRow;
        let buffer = "";
        if (rowDelta > 0) {
            buffer += `\x1b[${rowDelta}B`; // Move down
        }
        else if (rowDelta < 0) {
            buffer += `\x1b[${-rowDelta}A`; // Move up
        }
        // Move to absolute column (1-indexed)
        buffer += `\x1b[${targetCol + 1}G`;
        if (buffer) {
            this.terminal.write(buffer);
        }
        this.hardwareCursorRow = targetRow;
        if (this.showHardwareCursor) {
            this.terminal.showCursor();
        }
        else {
            this.terminal.hideCursor();
        }
    }
}
//# sourceMappingURL=tui.js.map
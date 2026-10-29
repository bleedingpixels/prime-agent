/**
 * Minimal TUI implementation with differential rendering
 */
import { type ScrollInfo } from "./fullscreen.js";
import type { TableCellSelectionRegion } from "./selection-metadata.js";
import type { Terminal } from "./terminal.js";
import { visibleWidth } from "./utils.js";
/**
 * Component interface - all components must implement this
 */
export interface Component {
    /**
     * Render the component to lines for the given viewport width
     * @param width - Current viewport width
     * @returns Array of strings, each representing a line
     */
    render(width: number): string[];
    getSelectionRegions?(): ReadonlyArray<TableCellSelectionRegion>;
    /**
     * Optional handler for keyboard input when component has focus
     */
    handleInput?(data: string): void;
    /**
     * If true, component receives key release events (Kitty protocol).
     * Default is false - release events are filtered out.
     */
    wantsKeyRelease?: boolean;
    /**
     * Invalidate any cached rendering state.
     * Called when theme changes or when component needs to re-render from scratch.
     */
    invalidate(): void;
}
export interface TuiStopOptions {
    preserveAltScreen?: boolean;
    flushFullscreen?: boolean;
}
export interface FullscreenOptions {
    scroll: Component[];
    dock: Component;
    mouse?: boolean;
    viewportControls?: boolean;
}
interface ExitFullscreenOptions {
    flush?: boolean;
    leaveAltScreen?: boolean;
}
type InputListenerResult = {
    consume?: boolean;
    data?: string;
} | undefined;
type InputListener = (data: string) => InputListenerResult;
/**
 * Interface for components that can receive focus and display a hardware cursor.
 * When focused, the component should emit CURSOR_MARKER at the cursor position
 * in its render output. TUI will find this marker and position the hardware
 * cursor there for proper IME candidate window positioning.
 */
export interface Focusable {
    /** Set by TUI when focus changes. Component should emit CURSOR_MARKER when true. */
    focused: boolean;
}
/** Type guard to check if a component implements Focusable */
export declare function isFocusable(component: Component | null): component is Component & Focusable;
/**
 * Cursor position marker - APC (Application Program Command) sequence.
 * This is a zero-width escape sequence that terminals ignore.
 * Components emit this at the cursor position when focused.
 * TUI finds and strips this marker, then positions the hardware cursor there.
 */
export declare const CURSOR_MARKER = "\u001B_pi:c\u0007";
export { visibleWidth };
/**
 * Anchor position for overlays
 */
export type OverlayAnchor = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center" | "left-center" | "right-center";
/**
 * Margin configuration for overlays
 */
export interface OverlayMargin {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}
/** Value that can be absolute (number) or percentage (string like "50%") */
export type SizeValue = number | `${number}%`;
/**
 * Options for overlay positioning and sizing.
 * Values can be absolute numbers or percentage strings (e.g., "50%").
 */
export interface OverlayOptions {
    /** Width in columns, or percentage of terminal width (e.g., "50%") */
    width?: SizeValue;
    /** Minimum width in columns */
    minWidth?: number;
    /** Maximum height in rows, or percentage of terminal height (e.g., "50%") */
    maxHeight?: SizeValue;
    /** Render overlay content into terminal scrollback instead of clipping it to the visible viewport. */
    scrollback?: boolean;
    /** Anchor point for positioning (default: 'center') */
    anchor?: OverlayAnchor;
    /** Horizontal offset from anchor position (positive = right) */
    offsetX?: number;
    /** Vertical offset from anchor position (positive = down) */
    offsetY?: number;
    /** Row position: absolute number, or percentage (e.g., "25%" = 25% from top) */
    row?: SizeValue;
    /** Column position: absolute number, or percentage (e.g., "50%" = centered horizontally) */
    col?: SizeValue;
    /** Zero-width marker in base content; positions the overlay immediately above its row. */
    aboveMarker?: string;
    /** Margin from terminal edges. Number applies to all sides. */
    margin?: OverlayMargin | number;
    /**
     * Control overlay visibility based on terminal dimensions.
     * If provided, overlay is only rendered when this returns true.
     * Called each render cycle with current terminal dimensions.
     */
    visible?: (termWidth: number, termHeight: number) => boolean;
    /** If true, don't capture keyboard focus when shown */
    nonCapturing?: boolean;
    /** If true, temporarily disable fullscreen mouse tracking while the overlay is visible. */
    suspendFullscreenMouse?: boolean;
}
/**
 * Handle returned by showOverlay for controlling the overlay
 */
export interface OverlayHandle {
    /** Permanently remove the overlay (cannot be shown again) */
    hide(): void;
    /** Temporarily hide or show the overlay */
    setHidden(hidden: boolean): void;
    /** Check if overlay is temporarily hidden */
    isHidden(): boolean;
    /** Focus this overlay and bring it to the visual front */
    focus(): void;
    /** Release focus to the previous target */
    unfocus(): void;
    /** Check if this overlay currently has focus */
    isFocused(): boolean;
}
/**
 * Container - a component that contains other components
 */
export declare class Container implements Component {
    children: Component[];
    private selectionRegions;
    addChild(component: Component): void;
    removeChild(component: Component): void;
    clear(): void;
    invalidate(): void;
    render(width: number): string[];
    getSelectionRegions(): ReadonlyArray<TableCellSelectionRegion>;
}
/**
 * TUI - Main class for managing terminal UI with differential rendering
 */
export declare class TUI extends Container {
    terminal: Terminal;
    private previousLines;
    private previousKittyImageIds;
    private previousWidth;
    private previousHeight;
    private focusedComponent;
    private inputListeners;
    /** Global callback for debug key (Shift+Ctrl+D). Called before input is forwarded to focused component. */
    onDebug?: () => void;
    /** Copies fullscreen mouse selections; when unset, OSC 52 is written directly. */
    onCopy?: (text: string) => void;
    private renderRequested;
    private renderTimer;
    private lastRenderAt;
    private static readonly MIN_RENDER_INTERVAL_MS;
    private cursorRow;
    private hardwareCursorRow;
    private showHardwareCursor;
    private clearOnShrink;
    private maxLinesRendered;
    private previousViewportTop;
    private fullRedrawCount;
    private preserveViewportOnNextRender;
    private stopped;
    private overlaySelectionRegions;
    private fullscreen;
    private static readonly WHEEL_SCROLL_LINES;
    private static readonly SELECTION_AUTO_SCROLL_DELAY_MS;
    private static readonly SELECTION_AUTO_SCROLL_INTERVAL_MS;
    private selectionAutoScrollTimer;
    private selectionAutoScrollDirection;
    private selectionAutoScrollRow;
    private selectionAutoScrollColumn;
    private focusOrderCounter;
    private overlayStack;
    constructor(terminal: Terminal, showHardwareCursor?: boolean);
    get fullRedraws(): number;
    getShowHardwareCursor(): boolean;
    setShowHardwareCursor(enabled: boolean): void;
    getClearOnShrink(): boolean;
    /**
     * Set whether to trigger full re-render when content shrinks.
     * When true (default), empty rows are cleared when content shrinks.
     * When false, empty rows remain (reduces redraws on slower terminals).
     */
    setClearOnShrink(enabled: boolean): void;
    setFocus(component: Component | null): void;
    /**
     * Show an overlay component with configurable positioning and sizing.
     * Returns a handle to control the overlay's visibility.
     */
    showOverlay(component: Component, options?: OverlayOptions): OverlayHandle;
    /** Hide the topmost overlay and restore previous focus. */
    hideOverlay(): void;
    /** Check if there are any visible overlays */
    hasOverlay(): boolean;
    /** Check if an overlay entry is currently visible */
    private isOverlayVisible;
    /** Find the topmost visible capturing overlay, if any */
    private getTopmostVisibleOverlay;
    private shouldEnableFullscreenMouseTracking;
    private isFullscreenOverlayFocused;
    private syncFullscreenMouseTracking;
    invalidate(): void;
    start(): void;
    addInputListener(listener: InputListener): () => void;
    removeInputListener(listener: InputListener): void;
    private queryCellSize;
    stop(options?: TuiStopOptions): void;
    requestRender(force?: boolean): void;
    /**
     * Request a render that keeps the user anchored at their current scroll
     * position. Normally, when content above the visible viewport changes, the
     * renderer may fall back to a full screen redraw that replays the entire
     * transcript from the top. For deliberate toggles (e.g. expanding all tool
     * output) that is jarring: it scrolls to the top and reprints everything.
     * This instead repaints only the visible viewport in place, leaving
     * scrollback untouched.
     */
    requestRenderPreservingViewport(): void;
    /**
     * Render a scrollable transcript window on the alternate screen with `dock`
     * pinned to the bottom rows; the primary screen stays untouched until exit.
     * Wheel tracking is enabled blind — probing is not viable (tmux never
     * answers DECRQM) and unsupporting terminals ignore the mode-sets.
     */
    enterFullscreen(options: FullscreenOptions): void;
    /**
     * Leave fullscreen. The inline differ resumes against the entry snapshot,
     * so content produced while fullscreen flows into native scrollback.
     */
    exitFullscreen(options?: ExitFullscreenOptions): void;
    isFullscreen(): boolean;
    /** Scroll the fullscreen transcript window (negative = up). */
    scrollBy(lines: number): void;
    scrollToTop(): void;
    scrollToBottom(): void;
    /** Scroll state of the fullscreen window, or null when not fullscreen. */
    getScrollInfo(): ScrollInfo | null;
    private copySelection;
    private updateSelectionAutoScroll;
    private scheduleSelectionAutoScroll;
    private stopSelectionAutoScroll;
    private scheduleRender;
    private handleInput;
    private handleFullscreenInput;
    private consumeCellSizeResponse;
    /**
     * Resolve overlay layout from options.
     * Returns { width, row, col, maxHeight } for rendering.
     */
    private resolveOverlayLayout;
    private resolveAnchorRow;
    private resolveAnchorCol;
    /** Composite all overlays into content lines (sorted by focusOrder, higher = on top). */
    private compositeOverlays;
    private selectableSpan;
    private createDockSelectionRegions;
    private subtractSelectionCoverage;
    private static readonly SEGMENT_RESET;
    private applyLineResets;
    private collectKittyImageIds;
    private deleteKittyImages;
    private expandLastChangedForKittyImages;
    private deleteChangedKittyImages;
    /** Splice overlay content into a base line at a specific column. Single-pass optimized. */
    private compositeLineAt;
    /**
     * Find and extract cursor position from rendered lines.
     * Searches for CURSOR_MARKER, calculates its position, and strips it from the output.
     * Only scans the bottom terminal height lines (visible viewport).
     * @param lines - Rendered lines to search
     * @param height - Terminal height (visible viewport size)
     * @returns Cursor position { row, col } or null if no marker found
     */
    private extractCursorPosition;
    private renderFullscreen;
    private doRender;
    /**
     * Position the hardware cursor for IME candidate window.
     * @param cursorPos The cursor position extracted from rendered output, or null
     * @param totalLines Total number of rendered lines
     */
    private positionHardwareCursor;
}
//# sourceMappingURL=tui.d.ts.map
/**
 * Fullscreen (alternate-screen) viewport: a scrollable window over the
 * transcript with a dock (editor/footer) pinned to the bottom rows. Frames
 * are a fixed grid painted with absolute addressing and diffed row-by-row;
 * scroll position is application state, not terminal scrollback.
 */
import { isImageLine } from "./terminal-image.js";
import { sliceByColumn, stripAnsi, visibleWidth } from "./utils.js";
export const FULLSCREEN_MIN_TRANSCRIPT_ROWS = 3;
export function clippedFullscreenDockHeight(dockLength, height) {
    const maxDock = Math.max(0, height - FULLSCREEN_MIN_TRANSCRIPT_ROWS);
    return Math.min(dockLength, maxDock);
}
// Kitty images span multiple physical rows and cannot be clipped to a window.
const IMAGE_PLACEHOLDER = "\x1b[2m[image — view in inline mode]\x1b[0m";
export class FullscreenViewport {
    scrollTop = 0;
    following = true;
    prevFrame = [];
    prevWidth = 0;
    prevHeight = 0;
    lastMaxScroll = 0;
    lastWindowHeight = 0;
    lastTranscript = [];
    lastFrame = [];
    lastFrameVisibleStart = 0;
    lastFrameVisibleHeight = 0;
    frameSelectionRegions = [];
    tableCellSelectionRegions = [];
    activeFrameSelection = null;
    activeTableSelection = null;
    selectionAnchor = null;
    selectionHead = null;
    selectionMode = null;
    /**
     * Compose a frame of exactly `height` lines: scrolled transcript window on
     * top, dock pinned to the bottom. Following pins the window to the
     * transcript end; otherwise it stays frozen while content appends.
     */
    composeFrame(transcript, dock, height, tableCellSelectionRegions = []) {
        let dockLines = dock;
        const dockHeight = clippedFullscreenDockHeight(dockLines.length, height);
        if (dockLines.length > dockHeight) {
            // bottom of the dock (editor + footer) wins over widgets above it
            dockLines = dockLines.slice(dockLines.length - dockHeight);
        }
        const windowHeight = height - dockLines.length;
        const maxScroll = Math.max(0, transcript.length - windowHeight);
        if (this.following) {
            this.scrollTop = maxScroll;
        }
        else {
            this.scrollTop = Math.max(0, Math.min(this.scrollTop, maxScroll));
        }
        this.lastMaxScroll = maxScroll;
        this.lastWindowHeight = windowHeight;
        this.lastTranscript = transcript;
        this.tableCellSelectionRegions = tableCellSelectionRegions;
        const window = transcript.slice(this.scrollTop, this.scrollTop + windowHeight);
        for (let i = 0; i < window.length; i++) {
            if (isImageLine(window[i]))
                window[i] = IMAGE_PLACEHOLDER;
        }
        this.highlightSelection(window);
        while (window.length < windowHeight) {
            window.push("");
        }
        return [...window, ...dockLines];
    }
    orderedSelection() {
        const a = this.selectionAnchor;
        const b = this.selectionHead;
        if (!a || !b || (a.line === b.line && a.col === b.col))
            return null;
        const flipped = a.line > b.line || (a.line === b.line && a.col > b.col);
        return flipped ? { start: b, end: a } : { start: a, end: b };
    }
    // Per-line selected column span, or null when the line is outside the selection.
    selectionSpan(lineIndex, sel) {
        if (lineIndex < sel.start.line || lineIndex > sel.end.line)
            return null;
        return {
            from: lineIndex === sel.start.line ? sel.start.col : 0,
            to: lineIndex === sel.end.line ? sel.end.col : Number.MAX_SAFE_INTEGER,
        };
    }
    highlightSelection(window) {
        if (this.selectionMode !== "transcript" && this.selectionMode !== "table")
            return;
        const sel = this.orderedSelection();
        if (!sel)
            return;
        for (let i = 0; i < window.length; i++) {
            const lineIndex = this.scrollTop + i;
            const spans = this.selectionMode === "table"
                ? this.selectedTableSpans(lineIndex, sel)
                : [this.selectionSpan(lineIndex, sel)].filter((span) => span !== null);
            for (let spanIndex = spans.length - 1; spanIndex >= 0; spanIndex--) {
                window[i] = this.highlightLine(window[i], spans[spanIndex]);
            }
        }
    }
    /** Begin a selection at a screen position; false when outside the transcript window. */
    beginSelection(screenRow, screenCol) {
        const line = this.transcriptLineForScreenRow(screenRow, false);
        if (line === null) {
            this.clearSelection();
            return false;
        }
        const point = { line, col: Math.max(0, screenCol) };
        this.selectionAnchor = point;
        this.selectionHead = { ...point };
        const table = this.tableAtPoint(point);
        const tableCell = table ? this.closestTableCell(table, point) : null;
        if (table && tableCell) {
            this.activeTableSelection = { table, anchor: tableCell };
            this.selectionMode = "table";
        }
        else {
            this.activeTableSelection = null;
            this.selectionMode = "transcript";
        }
        return true;
    }
    extendSelection(screenRow, screenCol) {
        if (!this.selectionAnchor || (this.selectionMode !== "transcript" && this.selectionMode !== "table"))
            return;
        const line = this.transcriptLineForScreenRow(screenRow, true);
        if (line === null)
            return;
        this.selectionHead = { line, col: Math.max(0, screenCol) };
    }
    selectionAutoScrollDirection(screenRow) {
        if (!this.selectionAnchor ||
            !this.selectionHead ||
            (this.selectionMode !== "transcript" && this.selectionMode !== "table"))
            return null;
        const bounds = this.transcriptScreenBounds();
        if (!bounds)
            return null;
        if (this.selectionHead.line < this.selectionAnchor.line && screenRow <= bounds.firstRow && this.scrollTop > 0) {
            return -1;
        }
        if (this.selectionHead.line > this.selectionAnchor.line &&
            screenRow >= bounds.lastRow &&
            this.scrollTop < this.lastMaxScroll) {
            return 1;
        }
        return null;
    }
    scrollSelection(direction, screenCol) {
        if (!this.selectionAnchor || (this.selectionMode !== "transcript" && this.selectionMode !== "table"))
            return false;
        const previousScrollTop = this.scrollTop;
        this.scrollBy(direction);
        if (this.scrollTop === previousScrollTop)
            return false;
        const bounds = this.transcriptScreenBounds();
        if (!bounds)
            return false;
        this.extendSelection(direction === -1 ? bounds.firstRow : bounds.lastRow, screenCol);
        return true;
    }
    /** Finish the selection and return its plain text (null when empty). */
    endSelection() {
        if (this.selectionMode !== "transcript" && this.selectionMode !== "table") {
            this.clearSelection();
            return null;
        }
        const sel = this.orderedSelection();
        const text = sel
            ? this.selectionMode === "table"
                ? this.extractTableSelectionText(this.lastTranscript, sel)
                : this.extractSelectionText(this.lastTranscript, sel)
            : null;
        this.clearSelection();
        return text;
    }
    extendActiveSelection(screenRow, screenCol) {
        if (this.selectionMode === "frame") {
            this.extendFrameSelection(screenRow, screenCol);
        }
        else if (this.selectionMode === "transcript" || this.selectionMode === "table") {
            this.extendSelection(screenRow, screenCol);
        }
    }
    endActiveSelection() {
        if (this.selectionMode === "frame") {
            return this.endFrameSelection();
        }
        if (this.selectionMode === "transcript" || this.selectionMode === "table") {
            return this.endSelection();
        }
        this.clearSelection();
        return null;
    }
    /** Snapshot and highlight the final screen frame for overlay/dock selection. */
    applyFrameSelection(frame, height, selectableRegions) {
        this.lastFrame = frame;
        this.lastFrameVisibleHeight = Math.min(Math.max(0, height), frame.length);
        this.lastFrameVisibleStart = Math.max(0, frame.length - this.lastFrameVisibleHeight);
        this.frameSelectionRegions = selectableRegions;
        if (this.selectionMode !== "frame")
            return;
        const sel = this.orderedSelection();
        if (!sel)
            return;
        for (let lineIndex = sel.start.line; lineIndex <= sel.end.line; lineIndex++) {
            let line = frame[lineIndex];
            if (line === undefined)
                continue;
            const spans = this.selectedFrameSpans(lineIndex, sel);
            for (let i = spans.length - 1; i >= 0; i--) {
                line = this.highlightLine(line, spans[i]);
            }
            frame[lineIndex] = line;
        }
    }
    beginFrameSelection(screenRow, screenCol) {
        const point = this.framePoint(screenRow, screenCol);
        if (!point || !this.isFrameSelectable(point)) {
            this.clearSelection();
            return false;
        }
        this.activeFrameSelection = {
            frame: [...this.lastFrame],
            regions: this.frameSelectionRegions.map((region) => ({ ...region })),
            visibleStart: this.lastFrameVisibleStart,
            visibleHeight: this.lastFrameVisibleHeight,
        };
        this.selectionAnchor = point;
        this.selectionHead = { ...point };
        this.selectionMode = "frame";
        return true;
    }
    extendFrameSelection(screenRow, screenCol) {
        if (!this.selectionAnchor || this.selectionMode !== "frame")
            return;
        const point = this.framePoint(screenRow, screenCol, this.activeFrameSelection);
        if (!point)
            return;
        const clamped = this.clampFrameSelectionPoint(point);
        if (!clamped)
            return;
        this.selectionHead = clamped;
    }
    endFrameSelection() {
        if (this.selectionMode !== "frame") {
            this.clearSelection();
            return null;
        }
        const sel = this.orderedSelection();
        const active = this.activeFrameSelection;
        const sourceLines = active?.frame ?? this.lastFrame;
        const regions = active?.regions ?? this.frameSelectionRegions;
        this.clearSelection();
        if (!sel)
            return null;
        return this.extractFrameSelectionText(sourceLines, regions, sel);
    }
    highlightLine(line, span) {
        const width = visibleWidth(line);
        const from = Math.min(span.from, width);
        const to = Math.min(span.to, width);
        if (to <= from)
            return line;
        const before = sliceByColumn(line, 0, from);
        const selected = stripAnsi(sliceByColumn(line, from, to - from));
        const after = sliceByColumn(line, to, Math.max(0, width - to));
        return `${before}\x1b[0m\x1b[7m${selected}\x1b[27m${after}`;
    }
    framePoint(screenRow, screenCol, snapshot = null) {
        const visibleHeight = snapshot?.visibleHeight ?? this.lastFrameVisibleHeight;
        if (visibleHeight === 0)
            return null;
        const visibleStart = snapshot?.visibleStart ?? this.lastFrameVisibleStart;
        const frameLength = snapshot?.frame.length ?? this.lastFrame.length;
        const row = Math.max(0, Math.min(screenRow, visibleHeight - 1));
        const line = visibleStart + row;
        if (line < 0 || line >= frameLength)
            return null;
        return { line, col: Math.max(0, screenCol) };
    }
    transcriptScreenBounds() {
        if (this.lastWindowHeight <= 0)
            return null;
        const visibleHeight = this.lastFrameVisibleHeight > 0 ? this.lastFrameVisibleHeight : this.lastWindowHeight;
        if (visibleHeight <= 0)
            return null;
        const visibleStart = this.lastFrameVisibleHeight > 0 ? this.lastFrameVisibleStart : 0;
        const visibleEnd = visibleStart + visibleHeight - 1;
        const transcriptStart = Math.max(0, visibleStart);
        const transcriptEnd = Math.min(this.lastWindowHeight - 1, visibleEnd);
        if (transcriptStart > transcriptEnd)
            return null;
        return {
            firstRow: transcriptStart - visibleStart,
            lastRow: transcriptEnd - visibleStart,
            visibleStart,
            visibleHeight,
            transcriptStart,
            transcriptEnd,
        };
    }
    transcriptLineForScreenRow(screenRow, clamp) {
        const bounds = this.transcriptScreenBounds();
        if (!bounds)
            return null;
        if (!clamp && (screenRow < 0 || screenRow >= bounds.visibleHeight))
            return null;
        const row = clamp ? Math.max(0, Math.min(screenRow, bounds.visibleHeight - 1)) : screenRow;
        const frameLine = bounds.visibleStart + row;
        if (!clamp && (frameLine < bounds.transcriptStart || frameLine > bounds.transcriptEnd))
            return null;
        return this.scrollTop + Math.max(bounds.transcriptStart, Math.min(frameLine, bounds.transcriptEnd));
    }
    isFrameSelectable(point) {
        return this.frameSelectionRegions.some((region) => region.line === point.line && point.col >= region.col && point.col < region.col + region.width);
    }
    tableRegions(table) {
        return this.tableCellSelectionRegions.filter((region) => region.table === table);
    }
    tableAtPoint(point) {
        const tables = new Set(this.tableCellSelectionRegions.map((region) => region.table));
        for (const table of tables) {
            const region = this.tableRegions(table)[0];
            if (region &&
                point.line >= region.tableTop &&
                point.line <= region.tableBottom &&
                point.col >= Math.max(0, region.tableLeft - 1) &&
                point.col <= region.tableRight) {
                return table;
            }
        }
        return null;
    }
    closestTableCell(table, point) {
        let closest = null;
        let closestLineDistance = Number.POSITIVE_INFINITY;
        let closestColumnDistance = Number.POSITIVE_INFINITY;
        for (const region of this.tableRegions(table)) {
            const lineDistance = Math.abs(point.line - region.line);
            const end = region.col + region.width;
            const columnDistance = point.col < region.col ? region.col - point.col : point.col > end ? point.col - end : 0;
            if (lineDistance < closestLineDistance ||
                (lineDistance === closestLineDistance && columnDistance < closestColumnDistance)) {
                closest = { row: region.row, column: region.column };
                closestLineDistance = lineDistance;
                closestColumnDistance = columnDistance;
            }
        }
        return closest;
    }
    activeTableRange() {
        const active = this.activeTableSelection;
        const head = this.selectionHead;
        if (!active || !head)
            return null;
        const headCell = this.closestTableCell(active.table, head);
        if (!headCell)
            return null;
        return {
            fromRow: Math.min(active.anchor.row, headCell.row),
            toRow: Math.max(active.anchor.row, headCell.row),
            fromColumn: Math.min(active.anchor.column, headCell.column),
            toColumn: Math.max(active.anchor.column, headCell.column),
        };
    }
    selectedTableSpans(lineIndex, sel) {
        const active = this.activeTableSelection;
        const range = this.activeTableRange();
        if (!active || !range)
            return [];
        const singleCell = range.fromRow === range.toRow && range.fromColumn === range.toColumn;
        const selectionSpan = singleCell ? this.selectionSpan(lineIndex, sel) : null;
        if (singleCell && !selectionSpan)
            return [];
        const spans = [];
        for (const region of this.tableCellSelectionRegions) {
            if (region.line !== lineIndex ||
                region.table !== active.table ||
                region.row < range.fromRow ||
                region.row > range.toRow ||
                region.column < range.fromColumn ||
                region.column > range.toColumn)
                continue;
            const from = selectionSpan ? Math.max(selectionSpan.from, region.col) : region.col;
            const to = selectionSpan ? Math.min(selectionSpan.to, region.col + region.width) : region.col + region.width;
            if (to > from)
                spans.push({ from, to });
        }
        return spans.sort((a, b) => a.from - b.from);
    }
    frameRegionsForLine(line, regions = this.activeFrameSelection?.regions ?? this.frameSelectionRegions) {
        return regions.filter((region) => region.line === line && region.width > 0).sort((a, b) => a.col - b.col);
    }
    clampFrameSelectionPoint(point) {
        const regions = this.frameRegionsForLine(point.line);
        if (regions.length === 0)
            return null;
        let closest = regions[0].col;
        let distance = Number.POSITIVE_INFINITY;
        for (const region of regions) {
            const start = region.col;
            const end = region.col + region.width;
            if (point.col >= start && point.col <= end) {
                return { line: point.line, col: Math.max(start, Math.min(point.col, end)) };
            }
            for (const col of [start, end]) {
                const nextDistance = Math.abs(point.col - col);
                if (nextDistance < distance) {
                    closest = col;
                    distance = nextDistance;
                }
            }
        }
        return { line: point.line, col: closest };
    }
    selectedFrameSpans(lineIndex, sel, regions = this.activeFrameSelection?.regions ?? this.frameSelectionRegions) {
        const span = this.selectionSpan(lineIndex, sel);
        if (!span)
            return [];
        const spans = [];
        for (const region of this.frameRegionsForLine(lineIndex, regions)) {
            const from = Math.max(span.from, region.col);
            const to = Math.min(span.to, region.col + region.width);
            if (to > from)
                spans.push({ from, to });
        }
        return spans;
    }
    extractFrameSelectionText(sourceLines, regions, sel) {
        const lines = [];
        for (let lineIndex = sel.start.line; lineIndex <= sel.end.line; lineIndex++) {
            const line = sourceLines[lineIndex] ?? "";
            const spans = this.selectedFrameSpans(lineIndex, sel, regions);
            if (spans.length === 0)
                continue;
            const parts = [];
            for (const span of spans) {
                parts.push(stripAnsi(sliceByColumn(line, span.from, Math.max(0, span.to - span.from))));
            }
            lines.push(parts.join("").trimEnd());
        }
        const text = lines.join("\n");
        return text.trim().length > 0 ? text : null;
    }
    extractSelectionText(sourceLines, sel) {
        const lines = [];
        for (let lineIndex = sel.start.line; lineIndex <= sel.end.line; lineIndex++) {
            const line = sourceLines[lineIndex] ?? "";
            const span = this.selectionSpan(lineIndex, sel);
            if (!span)
                continue;
            const width = visibleWidth(line);
            const from = Math.min(span.from, width);
            const to = Math.min(span.to, width);
            lines.push(stripAnsi(sliceByColumn(line, from, Math.max(0, to - from))).trimEnd());
        }
        const text = lines.join("\n");
        return text.trim().length > 0 ? text : null;
    }
    compareSelectionPoints(a, b) {
        return a.line === b.line ? a.col - b.col : a.line - b.line;
    }
    extractTableSelectionText(sourceLines, sel) {
        const active = this.activeTableSelection;
        const range = this.activeTableRange();
        if (!active || !range)
            return null;
        if (range.fromRow !== range.toRow || range.fromColumn !== range.toColumn) {
            const contents = new Map();
            for (const region of this.tableRegions(active.table)) {
                contents.set(`${region.row}:${region.column}`, region.content);
            }
            const rows = [];
            for (let row = range.fromRow; row <= range.toRow; row++) {
                const cells = [];
                for (let column = range.fromColumn; column <= range.toColumn; column++) {
                    cells.push(contents.get(`${row}:${column}`) ?? "");
                }
                rows.push(cells.join("\t"));
            }
            const text = rows.join("\n");
            return text.trim().length > 0 ? text : null;
        }
        const cellRegions = this.tableRegions(active.table)
            .filter((region) => region.row === range.fromRow && region.column === range.fromColumn)
            .sort((a, b) => a.line - b.line || a.segment - b.segment);
        const first = cellRegions[0];
        const last = cellRegions.at(-1);
        if (first && last) {
            const cellStart = { line: first.line, col: first.col };
            const cellEnd = { line: last.line, col: last.col + last.width };
            if (this.compareSelectionPoints(sel.start, cellStart) <= 0 &&
                this.compareSelectionPoints(sel.end, cellEnd) >= 0) {
                return first.content.trim().length > 0 ? first.content : null;
            }
        }
        const lines = [];
        for (let lineIndex = sel.start.line; lineIndex <= sel.end.line; lineIndex++) {
            const line = sourceLines[lineIndex] ?? "";
            const spans = this.selectedTableSpans(lineIndex, sel);
            if (spans.length === 0)
                continue;
            const parts = spans.map((span) => stripAnsi(sliceByColumn(line, span.from, Math.max(0, span.to - span.from))));
            lines.push(parts.join("").trimEnd());
        }
        const text = lines.join("\n");
        return text.trim().length > 0 ? text : null;
    }
    clearSelection() {
        this.selectionAnchor = null;
        this.selectionHead = null;
        this.selectionMode = null;
        this.activeFrameSelection = null;
        this.activeTableSelection = null;
    }
    hasSelection() {
        return this.orderedSelection() !== null;
    }
    /** Row-diff a composed frame against the previous one with absolute addressing. */
    paint(write, frame, width, height, cursorPos) {
        // over-tall frames (overlay overflow) show their bottom `height` lines
        if (frame.length > height) {
            frame = frame.slice(frame.length - height);
        }
        let buffer = "\x1b[?2026h";
        if (width !== this.prevWidth || height !== this.prevHeight || this.prevFrame.length === 0) {
            buffer += "\x1b[2J\x1b[H";
            this.prevFrame = [];
        }
        for (let row = 0; row < height; row++) {
            const line = frame[row] ?? "";
            if (this.prevFrame[row] === line)
                continue;
            buffer += `\x1b[${row + 1};1H\x1b[2K`;
            // an overwide line would wrap and shear the grid; clamp instead of crash
            buffer += visibleWidth(line) > width ? sliceByColumn(line, 0, width, true) : line;
        }
        if (cursorPos) {
            buffer += `\x1b[${Math.min(cursorPos.row, height - 1) + 1};${cursorPos.col + 1}H`;
        }
        buffer += "\x1b[?2026l";
        write(buffer);
        this.prevFrame = frame;
        this.prevWidth = width;
        this.prevHeight = height;
    }
    /** Force the next paint to clear and repaint the whole screen. */
    reset() {
        this.prevFrame = [];
    }
    /** Scrolling up pauses following; reaching the bottom resumes it. */
    scrollBy(delta) {
        const base = this.following ? this.lastMaxScroll : this.scrollTop;
        this.scrollTop = Math.max(0, Math.min(base + delta, this.lastMaxScroll));
        this.following = this.scrollTop >= this.lastMaxScroll;
    }
    scrollToTop() {
        this.scrollTop = 0;
        this.following = this.lastMaxScroll === 0;
    }
    scrollToBottom() {
        this.scrollTop = this.lastMaxScroll;
        this.following = true;
    }
    pageSize() {
        return Math.max(1, this.lastWindowHeight - 1);
    }
    windowHeight() {
        return this.lastWindowHeight;
    }
    isFollowing() {
        return this.following;
    }
    scrollInfo() {
        return {
            following: this.following,
            linesBelow: Math.max(0, this.lastMaxScroll - this.scrollTop),
            linesAbove: this.scrollTop,
        };
    }
}
//# sourceMappingURL=fullscreen.js.map
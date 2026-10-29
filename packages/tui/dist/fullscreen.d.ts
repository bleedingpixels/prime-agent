/**
 * Fullscreen (alternate-screen) viewport: a scrollable window over the
 * transcript with a dock (editor/footer) pinned to the bottom rows. Frames
 * are a fixed grid painted with absolute addressing and diffed row-by-row;
 * scroll position is application state, not terminal scrollback.
 */
import type { TableCellSelectionRegion } from "./selection-metadata.js";
export declare const FULLSCREEN_MIN_TRANSCRIPT_ROWS = 3;
export declare function clippedFullscreenDockHeight(dockLength: number, height: number): number;
export interface ScrollInfo {
    following: boolean;
    linesBelow: number;
    linesAbove: number;
}
export type SelectionScrollDirection = -1 | 1;
interface FrameSelectionRegion {
    line: number;
    col: number;
    width: number;
}
export declare class FullscreenViewport {
    private scrollTop;
    private following;
    private prevFrame;
    private prevWidth;
    private prevHeight;
    private lastMaxScroll;
    private lastWindowHeight;
    private lastTranscript;
    private lastFrame;
    private lastFrameVisibleStart;
    private lastFrameVisibleHeight;
    private frameSelectionRegions;
    private tableCellSelectionRegions;
    private activeFrameSelection;
    private activeTableSelection;
    private selectionAnchor;
    private selectionHead;
    private selectionMode;
    /**
     * Compose a frame of exactly `height` lines: scrolled transcript window on
     * top, dock pinned to the bottom. Following pins the window to the
     * transcript end; otherwise it stays frozen while content appends.
     */
    composeFrame(transcript: string[], dock: string[], height: number, tableCellSelectionRegions?: ReadonlyArray<TableCellSelectionRegion>): string[];
    private orderedSelection;
    private selectionSpan;
    private highlightSelection;
    /** Begin a selection at a screen position; false when outside the transcript window. */
    beginSelection(screenRow: number, screenCol: number): boolean;
    extendSelection(screenRow: number, screenCol: number): void;
    selectionAutoScrollDirection(screenRow: number): SelectionScrollDirection | null;
    scrollSelection(direction: SelectionScrollDirection, screenCol: number): boolean;
    /** Finish the selection and return its plain text (null when empty). */
    endSelection(): string | null;
    extendActiveSelection(screenRow: number, screenCol: number): void;
    endActiveSelection(): string | null;
    /** Snapshot and highlight the final screen frame for overlay/dock selection. */
    applyFrameSelection(frame: string[], height: number, selectableRegions: ReadonlyArray<FrameSelectionRegion>): void;
    beginFrameSelection(screenRow: number, screenCol: number): boolean;
    extendFrameSelection(screenRow: number, screenCol: number): void;
    endFrameSelection(): string | null;
    private highlightLine;
    private framePoint;
    private transcriptScreenBounds;
    private transcriptLineForScreenRow;
    private isFrameSelectable;
    private tableRegions;
    private tableAtPoint;
    private closestTableCell;
    private activeTableRange;
    private selectedTableSpans;
    private frameRegionsForLine;
    private clampFrameSelectionPoint;
    private selectedFrameSpans;
    private extractFrameSelectionText;
    private extractSelectionText;
    private compareSelectionPoints;
    private extractTableSelectionText;
    clearSelection(): void;
    hasSelection(): boolean;
    /** Row-diff a composed frame against the previous one with absolute addressing. */
    paint(write: (data: string) => void, frame: string[], width: number, height: number, cursorPos: {
        row: number;
        col: number;
    } | null): void;
    /** Force the next paint to clear and repaint the whole screen. */
    reset(): void;
    /** Scrolling up pauses following; reaching the bottom resumes it. */
    scrollBy(delta: number): void;
    scrollToTop(): void;
    scrollToBottom(): void;
    pageSize(): number;
    windowHeight(): number;
    isFollowing(): boolean;
    scrollInfo(): ScrollInfo;
}
export {};
//# sourceMappingURL=fullscreen.d.ts.map
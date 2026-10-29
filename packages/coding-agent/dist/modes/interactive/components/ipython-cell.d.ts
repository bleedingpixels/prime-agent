import { type Component } from "@earendil-works/pi-tui";
export interface IPythonCellContentBlock {
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
}
export interface IPythonCellState {
    code: string;
    content?: readonly IPythonCellContentBlock[];
    details?: unknown;
    isPartial?: boolean;
    isError?: boolean;
    expanded?: boolean;
    showExpandHint?: boolean;
    executionStarted?: boolean;
    argsComplete?: boolean;
    showImages?: boolean;
    /** Session cwd — edit paths nested under it render relative, else absolute. */
    cwd?: string;
}
export declare function getIpythonCodeFromArgs(args: unknown): string;
export declare class IPythonCellComponent implements Component {
    private readonly renderCache;
    private state;
    private stateVersion;
    constructor(state: IPythonCellState);
    update(state: IPythonCellState): void;
    invalidate(): void;
    render(width: number): string[];
    private collapsedLine;
    /** Status marker — color carries running/done/error; ✓/✗ once finished. */
    private marker;
    private lineCounts;
    private statusKind;
    private hasResult;
    private renderCode;
    private highlightInputLine;
    private renderOutput;
    private renderSentAgentMessages;
    private renderDiffs;
    private renderFileDiff;
    private renderOutputText;
    private renderTraceback;
    private addWrapped;
    private addBlank;
    private addPlain;
}
//# sourceMappingURL=ipython-cell.d.ts.map
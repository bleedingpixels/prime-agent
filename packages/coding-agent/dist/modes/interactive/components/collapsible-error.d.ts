import { type Component } from "@earendil-works/pi-tui";
export interface CollapsibleErrorOptions {
    text: string;
    summary?: string;
    expanded?: boolean;
    forceCollapse?: boolean;
    paddingX?: number;
}
export declare function normalizeErrorDetails(text: string): string;
export declare function summarizeErrorDetails(text: string): string;
export declare function shouldCollapseErrorDetails(text: string): boolean;
export declare class CollapsibleErrorComponent implements Component {
    private readonly options;
    private expanded;
    constructor(options: CollapsibleErrorOptions);
    setExpanded(expanded: boolean): void;
    invalidate(): void;
    render(width: number): string[];
    private renderText;
}
//# sourceMappingURL=collapsible-error.d.ts.map
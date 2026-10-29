import { type Component } from "@earendil-works/pi-tui";
export declare const TOOL_PANEL_PADDING_X = 2;
export declare function toolPanelContentWidth(width: number): number;
/**
 * Format a single tool panel line: content indented by the panel padding and
 * padded to the full width, on the subtle panel background that groups the
 * block.
 */
export declare function toolPanelLine(line: string, width: number): string;
/**
 * Panel shell for tool executions: a status header line followed by the
 * tool's own call/result components, every line on the panel background so
 * the whole block reads as one unit. Children render at the reduced content
 * width; lines that still overflow are truncated, matching ipython cell
 * behavior.
 */
export declare class ToolPanel implements Component {
    private children;
    private header;
    private cache?;
    setHeader(header: string): void;
    addChild(component: Component): void;
    clear(): void;
    invalidate(): void;
    render(width: number): string[];
}
//# sourceMappingURL=tool-panel.d.ts.map
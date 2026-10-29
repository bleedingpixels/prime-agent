import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { ToolResultMessage } from "@earendil-works/pi-ai";
import { type Component } from "@earendil-works/pi-tui";
export interface FileChangeSummary {
    path: string;
    added: number;
    removed: number;
}
export declare function getToolFileChanges(toolName: string, args: unknown, result: {
    details?: unknown;
    isError: boolean;
}, cwd: string): FileChangeSummary[];
export declare function mergeTurnFileChanges(target: Map<string, FileChangeSummary>, message: AgentMessage, toolResults: readonly ToolResultMessage[], cwd: string): void;
export declare class FileChangeSummaryComponent implements Component {
    private readonly changes;
    private readonly cwd;
    constructor(changes: readonly FileChangeSummary[], cwd: string);
    render(width: number): string[];
    invalidate(): void;
}
export declare function formatTotalChangeSummary(changes: readonly FileChangeSummary[]): string;
//# sourceMappingURL=edit-summary.d.ts.map
import { type Component, type Focusable } from "@earendil-works/pi-tui";
import type { AgentConnectionRlmChildAgentSnapshot } from "../../agent-connection/index.js";
export interface SubagentSummaryCounts {
    total: number;
    running: number;
    idle: number;
    inactive: number;
}
export declare function countDirectSubagentStatuses(children: Iterable<AgentConnectionRlmChildAgentSnapshot>, parentId: string | undefined, activeHeartbeatSessionIds: ReadonlySet<string>): SubagentSummaryCounts;
/** One-line entry into the current session's scoped agents view. */
export declare class SubagentSummaryLine implements Component, Focusable {
    private readonly getLocationLabel;
    private readonly getContextLabel;
    private readonly getOverrideLabel;
    focused: boolean;
    private counts;
    private openable;
    onOpen?: () => void;
    onCancel?: () => void;
    onChatAction?: (data: string) => void;
    constructor(getLocationLabel?: () => string | undefined, getContextLabel?: () => string | undefined, getOverrideLabel?: () => string | undefined);
    setSubagentCounts(counts: SubagentSummaryCounts): void;
    setOpenable(openable: boolean): void;
    isSelectable(): boolean;
    handleInput(data: string): void;
    render(width: number): string[];
    private renderInfoLine;
    invalidate(): void;
}
//# sourceMappingURL=subagent-summary-line.d.ts.map
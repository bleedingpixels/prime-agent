import type { AgentConnectionSessionEvent } from "../agent-connection/index.js";
export type AgentActivity = "waiting" | "thinking" | "writing" | "writing-code" | "executing";
export interface AgentActivityStatus {
    activity: AgentActivity;
    /** "down" while receiving model output, "up" while sending (request in flight or tool executing). */
    direction: "down" | "up";
    /** Output tokens accumulated since the user's last message. */
    tokens: number;
}
export declare const AGENT_ACTIVITY_LABELS: Record<AgentActivity, string>;
/**
 * Derives what the agent is doing right now (and how many output tokens it has
 * produced since the user's last message) from the session event stream, so the
 * working loader can show more than a static "Working...".
 */
export declare class AgentActivityTracker {
    private activity;
    private completedTokens;
    private streamingUsageTokens;
    private streamingChars;
    private runningToolCount;
    private reportedTokens;
    handleEvent(event: AgentConnectionSessionEvent): void;
    getStatus(): AgentActivityStatus;
    private currentTokens;
    reset(): void;
    private estimatedStreamingTokens;
}
export declare function formatTokenCount(count: number): string;
//# sourceMappingURL=agent-activity.d.ts.map
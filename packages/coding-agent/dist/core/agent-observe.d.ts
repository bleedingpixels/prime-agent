import type { AgentMessage } from "@earendil-works/pi-agent-core";
export declare const AGENT_OBSERVE_SKILL_NAME = "agent-observe";
export declare const AGENT_OBSERVE_IMPORT_NAME = "agent_observe";
export declare const ORCHESTRATION_HEARTBEAT_SKILL_NAME = "orchestration-heartbeat";
export interface AgentObserveAgentSummary {
    activeSessionId: string;
    sessionId: string;
    sessionName?: string;
    runtimeKind?: "top-level" | "subagent";
    cwd: string;
    status: string;
    isCurrent: boolean;
    isStreaming: boolean;
    isCompacting: boolean;
    attachedClients: number;
    messageCount: number;
    queuedCount: number;
    isSessionActive: boolean;
    parentActiveSessionId?: string;
    parentSessionId?: string;
    rlmChildId?: string;
    rlmParentNodeId?: string;
    firstMessage?: string;
    latestMessage?: AgentObserveMessagePreview;
}
export interface AgentObserveListResult {
    current: AgentObserveAgentSummary;
    agents: AgentObserveAgentSummary[];
}
export interface AgentObserveAgentSnapshot {
    agent: AgentObserveAgentSummary;
}
export interface AgentObserveRecentMessagesInput {
    target: string;
    limit?: number;
    maxChars?: number;
}
export interface AgentObserveRecentMessagesResult {
    agent: AgentObserveAgentSummary;
    messages: AgentObserveMessagePreview[];
    limit: number;
    maxChars: number;
    truncated: boolean;
}
export interface AgentObserveMessagePreview {
    index: number;
    role: string;
    timestamp?: number;
    text: string;
    truncated: boolean;
    toolCalls?: string[];
    customType?: string;
}
export interface AgentObserveController {
    listAgents(): AgentObserveListResult | Promise<AgentObserveListResult>;
    getAgent(target: string): AgentObserveAgentSnapshot | Promise<AgentObserveAgentSnapshot>;
    recentMessages(input: AgentObserveRecentMessagesInput): AgentObserveRecentMessagesResult | Promise<AgentObserveRecentMessagesResult>;
}
export declare function createAgentObserveHostHandlers(controller: AgentObserveController): {
    "agent_observe.list": () => Promise<Record<string, unknown>>;
    "agent_observe.get": (payload?: Record<string, unknown>) => Promise<Record<string, unknown>>;
    "agent_observe.recent": (payload?: Record<string, unknown>) => Promise<Record<string, unknown>>;
};
export declare function normalizeObserveLimit(limit: number | undefined, defaultLimit?: number): number;
export declare function normalizeObserveMaxChars(maxChars: number | undefined, defaultMaxChars?: number): number;
export declare function createAgentObserveMessagePreview(message: AgentMessage, index: number, maxChars: number): AgentObserveMessagePreview;
//# sourceMappingURL=agent-observe.d.ts.map
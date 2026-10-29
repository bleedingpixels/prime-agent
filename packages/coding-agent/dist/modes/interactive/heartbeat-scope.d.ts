import type { AgentConnectionHeartbeat, AgentConnectionRlmChildAgentSnapshot } from "../agent-connection/types.js";
interface HeartbeatSessionIdentity {
    activeSessionId?: string;
    sessionId: string;
}
export declare function scopeHeartbeatsToSession(heartbeats: readonly AgentConnectionHeartbeat[], session: HeartbeatSessionIdentity | undefined, children: Iterable<Pick<AgentConnectionRlmChildAgentSnapshot, "activeSessionId">>): AgentConnectionHeartbeat[];
export {};
//# sourceMappingURL=heartbeat-scope.d.ts.map
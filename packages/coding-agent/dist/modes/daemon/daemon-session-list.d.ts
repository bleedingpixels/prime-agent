import type { AgentMessage, ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { Api, Model } from "@earendil-works/pi-ai";
import type { AgentSessionRuntimeDiagnostic } from "../../core/agent-session-services.js";
import { type AgentCronJob } from "../../core/cron-jobs.js";
import type { SessionActionSnapshot } from "../../core/session-action-store.js";
import type { AgentTaskState, SessionInfo } from "../../core/session-manager.js";
import type { AgentConnectionRlmChildAgentSnapshot } from "../agent-connection/types.js";
import type { ActiveSessionState } from "./active-session-state.js";
export type SessionLifecycle = "draft" | "live" | "archived";
export type SessionActivity = "working" | "idle";
export type SessionRosterStatus = "running" | "idle" | "inactive";
export interface SessionSummary {
    id: string;
    lifecycle: SessionLifecycle;
    activity: SessionActivity;
    isSessionActive: boolean;
    hasActiveHeartbeat?: boolean;
    /** Any active heartbeat registered for this session. Paused heartbeats do not pin residency. */
    hasRegisteredHeartbeat?: boolean;
    /** Any active or paused non-heartbeat scheduled job registered for this session. */
    hasRegisteredCronJob?: boolean;
    /** Latest message activity, used by the supervisor residency policy. */
    lastActivityAt?: string;
    runtimeKind?: "top-level" | "subagent";
    /** RLM spawn depth (0 for roots); fork edges preserve the source depth. */
    rlmDepth?: number;
    activeSessionId?: string;
    sessionId: string;
    sessionFile?: string;
    sessionName?: string;
    cwd: string;
    model?: Model<Api>;
    thinkingLevel?: ThinkingLevel;
    isStreaming: boolean;
    isCompacting: boolean;
    isBashRunning?: boolean;
    hasRunningRlmChildren?: boolean;
    /** True while the agent is streaming with tool calls pending; drives the "running tools" label. */
    isRunningTools?: boolean;
    attachedClients: number;
    messageCount: number;
    unfinishedActionCount?: number;
    sessionActions: SessionActionSnapshot;
    streamingMessage?: AgentMessage;
    created?: string;
    modified?: string;
    firstMessage?: string;
    parentActiveSessionId?: string;
    parentSessionId?: string;
    parentSessionPath?: string;
    rlmChildId?: string;
    repliedSinceTask?: boolean;
    rlmParentNodeId?: string;
    /** Source of the IPython cell that spawned this subagent, for display. */
    spawnCode?: string;
    modelFallbackMessage?: string;
    diagnostics?: AgentSessionRuntimeDiagnostic[];
    /** One-line background summary of what the agent is doing or just did. */
    summary?: string;
    /** Completion verdict for an idle session; absent while working or unjudged. */
    taskState?: AgentTaskState;
    /** Resident session-host process state, populated by the global supervisor. */
    workerState?: "starting" | "ready" | "recovering" | "stopping" | "failed";
    /** Diagnostic process identity; clients must not use this as a stable session identifier. */
    workerPid?: number;
}
/**
 * Pick the model fallback message to show when attaching to a daemon session.
 *
 * The daemon's summary is authoritative. The attaching process's own startup
 * snapshot only applies when the summary reports no model: a UI process may
 * compute "no models available" merely because it cannot see credentials the
 * daemon resolves fine (e.g. an env var set only for the daemon).
 */
export declare function resolveAttachModelFallbackMessage(summary: SessionSummary, startupModelFallbackMessage: string | undefined): string | undefined;
export declare function classifySessionRosterStatus(summary: SessionSummary): SessionRosterStatus;
export declare function isSessionSummaryBusy(summary: SessionSummary): boolean;
export declare function buildSessionList(activeSessions: readonly ActiveSessionState[], savedSessions: readonly SessionInfo[], scheduledJobs?: readonly AgentCronJob[]): SessionSummary[];
export declare function summaryForActiveSession(activeSession: ActiveSessionState, savedSession?: SessionInfo, hasActiveHeartbeat?: boolean, hasRegisteredHeartbeat?: boolean, hasRegisteredCronJob?: boolean): SessionSummary;
export declare function isSummaryCurrent(activeSession: ActiveSessionState): boolean;
export declare function summaryForInactiveSession(session: SessionInfo, hasRegisteredHeartbeat?: boolean, hasRegisteredCronJob?: boolean): SessionSummary;
/**
 * Build snapshots for all RLM child sessions hosted by the daemon under the
 * given session, including grandchildren. Mirrors the shape of live
 * rlm_child_update events so attach clients can seed their subagent state
 * from daemon memory instead of replaying the event stream.
 */
export declare function buildRlmChildSnapshots(rootActiveSessionId: string, activeSessions: readonly ActiveSessionState[]): AgentConnectionRlmChildAgentSnapshot[];
export declare function isActiveSessionBusy(activeSession: ActiveSessionState): boolean;
export declare function activeActivityForSession(activeSession: ActiveSessionState): SessionActivity;
/**
 * Lifecycle for an on-disk session not resident in the daemon. Explicitly
 * archived/crashed records stay out of the view; everything else is classified
 * by message count (live once a message exists, draft otherwise). A missing
 * session_state is treated as not-archived, so older sessions that never wrote a
 * lifecycle entry still surface. Message-based to match activeLifecycleForSession.
 */
export declare function inactiveLifecycleForSession(session: SessionInfo): SessionLifecycle;
export declare function activeLifecycleForSession(activeSession: ActiveSessionState): SessionLifecycle;
//# sourceMappingURL=daemon-session-list.d.ts.map
import type { Socket } from "node:net";
import type { AgentSessionRuntime } from "../../core/agent-session-runtime.js";
import type { AgentStatus } from "../../core/session-manager.js";
import type { DaemonClientCapability, DaemonEventSequence, DaemonExtensionUIResponse } from "./daemon-protocol.js";
export interface DaemonSocketClient {
    id: string;
    socket: Socket;
    attachedActiveSessionIds: Set<string>;
    /** Session events are dropped while the socket is blocked and replaced with one catch-up snapshot on drain. */
    catchupActiveSessionIds?: Set<string>;
    /** A real runtime replacement takes precedence over an ordinary resync for the same queued catch-up. */
    catchupPurposes?: Map<string, "replacement" | "resync">;
    /** The single catch-up drain currently serving this client. */
    catchupPromise?: Promise<void>;
    /** Delayed retry after transient catch-up snapshot preparation failure. */
    catchupRetryTimer?: NodeJS.Timeout;
    backpressured?: boolean;
    authenticated?: boolean;
    transport?: "jsonl" | "private-framed";
    snapshotStreaming?: boolean;
    snapshotActiveSessionIds?: Set<string>;
    snapshotActiveSessionCounts?: Map<string, number>;
    snapshotTransferAbortControllers?: Map<string, AbortController>;
    snapshotTransferTails?: Map<string, Promise<void>>;
    detachInput: () => void;
    supportsExtensionUi: boolean;
    capabilities: Set<DaemonClientCapability>;
    capabilitiesByActiveSessionId?: Map<string, Set<DaemonClientCapability>>;
}
export interface ActiveSessionState {
    activeSessionId: string;
    runtime: AgentSessionRuntime;
    clients: Set<DaemonSocketClient>;
    /** Attach snapshots in flight: reserved for passivation busyness, but not yet event recipients. */
    pendingAttaches: number;
    extensionUiRequests: Map<string, ActiveSessionExtensionUiRequest>;
    eventGeneration: string;
    lastEventSequence: DaemonEventSequence;
    unsubscribe?: () => void;
    /** Latest background status summary, surfaced in the agents view. */
    summaryState?: AgentStatus;
    /**
     * Client env (e.g. herdr pane identity), merged over process.env for this
     * session's pi.exec() subprocesses. Bound when the runtime is created (or
     * adopted from the first env-carrying create that reuses an env-less
     * session); never overwritten after that — watchers also attach, and
     * extensions capture identity at load. Subagents inherit the parent's.
     */
    clientEnv?: Record<string, string>;
}
export interface ActiveSessionExtensionUiRequest {
    resolve: (response: DaemonExtensionUIResponse) => void;
}
interface ActiveSessionIdIndex {
    has(activeSessionId: string): boolean;
}
export declare function createActiveSessionId(existingIds?: ActiveSessionIdIndex): string;
export declare class AmbiguousActiveSessionError extends Error {
    constructor(message: string);
}
export declare function resolveActiveSessionState(sessions: ReadonlyMap<string, ActiveSessionState>, selector: string): ActiveSessionState;
export {};
//# sourceMappingURL=active-session-state.d.ts.map
import { type KernelBootstrapProgressHandler, type KernelPythonSkill } from "./bootstrap.js";
import { type RestoreResult, type SnapshotResult } from "./state-snapshot.js";
export declare class KernelBusyAfterInterruptError extends Error {
    constructor();
}
/** Comm target the kernel-side `rlm.host_request` shim opens for typed host requests. */
export declare const HOST_COMM_TARGET = "host.request";
/**
 * Handles one typed request from Python code running in the kernel.
 * The returned record is sent back verbatim as the comm reply payload.
 */
export type HostRequestHandler = (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
/** Host request handlers keyed by request type (e.g. "rlm.run", "goal.complete"). */
export type HostRequestHandlers = Record<string, HostRequestHandler>;
/** Where and how to persist the kernel's user namespace so it survives resume. */
export interface KernelSnapshotConfig {
    /** Absolute path for the dill payload. */
    path: string;
    /** Absolute path for the JSON manifest written alongside the payload. */
    manifestPath: string;
    /** Skip variables (and abort the payload) above this many bytes. Default 256 MiB. */
    maxBytes?: number;
    /** Debounce window for the auto-snapshot after a successful execution. Default 1500 ms. */
    debounceMs?: number;
}
export interface KernelManagerOptions {
    /** Python interpreter that has `ipykernel` available. Defaults to the auto-bootstrapped kernel. */
    python?: string;
    cwd?: string;
    env?: Record<string, string>;
    sessionId?: string;
    hostHandlers?: HostRequestHandlers;
    pythonSkills?: readonly KernelPythonSkill[];
    /** Persist/revive the user namespace across kernel restarts and session resume. */
    snapshot?: KernelSnapshotConfig;
    /** Default: "prime-agent". */
    username?: string;
}
export interface KernelStartOptions {
    onBootstrapProgress?: KernelBootstrapProgressHandler;
    signal?: AbortSignal;
}
export interface ExecuteOptions {
    /** Aborting interrupts the kernel via the control channel. */
    signal?: AbortSignal;
    onStream?: (chunk: string, name: "stdout" | "stderr") => void;
    onLateSentAgentMessage?: (message: KernelSentAgentMessage) => void;
    /** Cap stdout / stderr / result at this many characters. Default 65536. */
    maxOutputChars?: number;
    /** Synthetic host cell (snapshot/restore/list); excluded from lastCellCode attribution. */
    internal?: boolean;
}
/** MIME tag the `edit` skill emits diff payloads under, via `display_data`. */
export declare const DIFF_DISPLAY_MIME = "application/vnd.prime-agent.diff+json";
/** MIME tag the `attach-image` skill emits media payloads under, via `display_data`. */
export declare const ATTACHMENT_DISPLAY_MIME = "application/vnd.prime-agent.attachment+json";
/** MIME tag the `agent-message` skill emits after sending a message. */
export declare const AGENT_MESSAGE_DISPLAY_MIME = "application/vnd.prime-agent.agent-message+json";
/** One file edit, captured from a {@link DIFF_DISPLAY_MIME} display payload. */
export interface KernelDiffDisplay {
    path: string;
    oldStr: string;
    newStr: string;
    /** 1-based line where `oldStr` begins in the file, for absolute line numbers. */
    startLine?: number;
}
/** One media attachment, captured from an {@link ATTACHMENT_DISPLAY_MIME} display payload. */
export interface KernelAttachment {
    mimeType: string;
    /** base64-encoded bytes. */
    data: string;
    /** Source path, surfaced to the TUI renderer. */
    path?: string;
}
export interface KernelSentAgentMessage {
    id: string;
    message: string;
    deliveryStatus: "delivered" | "queued";
    receiverRole?: "parent" | "sibling" | "child";
    target: {
        activeSessionId: string;
        sessionId: string;
        sessionName?: string;
    };
}
export interface ExecuteResult {
    stdout: string;
    stderr: string;
    /** Last `execute_result` payload (text/plain), if the cell produced one. */
    result?: string;
    /** Diffs emitted via display_data, in order. */
    diffs?: KernelDiffDisplay[];
    /** Media attachments emitted via display_data, in order. */
    attachments?: KernelAttachment[];
    /** Agent messages sent from this cell, in order. */
    sentAgentMessages?: KernelSentAgentMessage[];
    status: "ok" | "error" | "aborted";
    error?: {
        ename: string;
        evalue: string;
        traceback: string[];
    };
    durationMs: number;
}
export declare class KernelManager {
    private readonly options;
    private readonly session;
    private readonly commTargets;
    private readonly handledHostRequestCommIds;
    private kernel?;
    private kernelPid?;
    /** Polls a forked kernel's pid for death (no "exit" event on a non-child). */
    private forkedLivenessTimer?;
    private shell?;
    private iopub?;
    private control?;
    private iopubPumpPromise?;
    private connection?;
    private tempDir?;
    private kernelStderr;
    /** Serializes execute() calls — Jupyter shell channel is request/reply. */
    private executionQueue;
    private activeExecution?;
    private readonly activeExecutionIdleWaiters;
    private readonly lateSentAgentMessageHandlers;
    private lastCellCode?;
    private readonly inFlightHostRequests;
    private state;
    /** Memoized so concurrent callers all await the same in-flight startup. */
    private startPromise?;
    /** Pending debounced auto-snapshot, if one has been scheduled. */
    private snapshotTimer?;
    constructor(options: KernelManagerOptions);
    get ownerSessionId(): string | undefined;
    private appendKernelDiagnostic;
    start(options?: KernelStartOptions): Promise<void>;
    private doStart;
    private startForkedLivenessMonitor;
    private forkedKernelDied;
    private waitForResolvedConnection;
    private probeReady;
    execute(code: string, opts?: ExecuteOptions): Promise<ExecuteResult>;
    private enqueueExecute;
    private executeInner;
    private startIopubPump;
    private runIopubPump;
    private handleExecutionMessage;
    private finishActiveExecution;
    private resolveExecution;
    private dispatchLateSentAgentMessage;
    private registerLateSentAgentMessageHandler;
    private rejectActiveExecution;
    private notifyActiveExecutionIdle;
    private waitForActiveExecutionToClear;
    private waitForActiveExecutionToClearForReuse;
    private handleCommMessage;
    private startHostRequestFromComm;
    private handleHostRequest;
    private sendCommMessage;
    private interrupt;
    private cleanupResources;
    private waitForHostRequestsToSettle;
    shutdown(opts?: {
        snapshot?: boolean;
    }): Promise<void>;
    restart(): Promise<void>;
    kill(): Promise<void>;
    /**
     * Serialize the user namespace to disk (best-effort, per-variable). No-op when
     * the kernel isn't running or no snapshot target was configured. Never throws.
     */
    snapshotState(): Promise<SnapshotResult | null>;
    /**
     * Revive a previously snapshotted namespace into the kernel. Call right after
     * start() and before the runtime bootstrap, which then refreshes live handles
     * (rlm, skills) over anything restored. Never throws.
     */
    restoreState(): Promise<RestoreResult | null>;
    /** Live user-defined top-level names, or null if the kernel isn't running. Never throws. */
    listNamespaceNames(signal?: AbortSignal): Promise<string[] | null>;
    private scheduleSnapshot;
    private clearSnapshotTimer;
    private flushSnapshotForDispose;
    /** Graceful cleanup. Waits briefly for in-flight host request handlers before closing sockets. */
    dispose(): Promise<void>;
    /** Synchronous best-effort cleanup. Safe to call from `process.on('exit')`. */
    disposeSync(): void;
    get isRunning(): boolean;
}
//# sourceMappingURL=index.d.ts.map
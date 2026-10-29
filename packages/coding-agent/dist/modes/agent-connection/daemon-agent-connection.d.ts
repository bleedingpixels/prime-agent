import type { AgentMessage, ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { ImageContent, ServiceTier, Transport } from "@earendil-works/pi-ai";
import type { AgentSessionMessageReceipt, AgentSessionMessageSafetyStatus } from "../../core/agent-messages.js";
import type { AgentAutonomousStatus } from "../../core/autonomous.js";
import type { BashResult } from "../../core/bash-executor.js";
import type { CompactionResult } from "../../core/compaction/index.js";
import type { ContextTreeNode } from "../../core/context-tree.js";
import type { AgentCronJob, AgentHeartbeatDeliveryMode, AgentHeartbeatManagementAction, AgentHeartbeatUpdateAction } from "../../core/cron-jobs.js";
import type { RefinementResult } from "../../core/refinement/index.js";
import type { DeleteSessionFileResult } from "../../core/session-file-actions.js";
import type { SessionStats } from "../../core/session-stats.js";
import { type DaemonClient } from "../daemon/daemon-client.js";
import type { AgentConnection, AgentConnectionBeforeSessionInvalidateListener, AgentConnectionEventListener, AgentConnectionExecuteBashOptions, AgentConnectionExtensionUiResponse, AgentConnectionForkOptions, AgentConnectionHeartbeat, AgentConnectionModel, AgentConnectionModelCatalog, AgentConnectionModelCycleResult, AgentConnectionNavigateTreeOptions, AgentConnectionNavigateTreeResult, AgentConnectionNewSessionOptions, AgentConnectionPromptOptions, AgentConnectionQueuedMessageLane, AgentConnectionQueuedMessageMutation, AgentConnectionQueuedMessageMutationStatus, AgentConnectionQueueMode, AgentConnectionQueueState, AgentConnectionResourceSnapshot, AgentConnectionSavedSessionInfo, AgentConnectionSavedSessionScope, AgentConnectionScopedModel, AgentConnectionSessionContext, AgentConnectionSessionHeader, AgentConnectionSessionListCallbacks, AgentConnectionSessionTreeFlatNode, AgentConnectionSessionTreeNode, AgentConnectionSessionWatcher, AgentConnectionSideQuestionTurn, AgentConnectionSlashCommand, AgentConnectionSnapshot, AgentConnectionState, AgentConnectionSwitchSessionOptions, AgentConnectionToolDefinition, AgentConnectionUserMessage } from "./types.js";
export declare const DAEMON_REFINE_REQUEST_TIMEOUT_MS: number;
export declare const DAEMON_RECONNECT_TIMEOUT_MS = 60000;
export declare const DAEMON_SNAPSHOT_TIMEOUT_MS = 30000;
export interface DaemonAgentConnectionOptions {
    closeClientOnDispose?: boolean;
    /** Restart/probe the detached supervisor after a transient socket loss. */
    recoverDaemon?: () => Promise<void>;
    /** Bound supervisor recovery before surfacing a fatal connection error. */
    reconnectTimeoutMs?: number;
    /** Bound an incomplete streamed snapshot before failing the attach or resync. */
    snapshotTimeoutMs?: number;
    /**
     * Send this client's allowlisted env (herdr pane identity) with attach so
     * an env-less session (e.g. cron-created) adopts it. Set only by the
     * primary interactive connection — the daemon adopts-if-absent, never
     * rebinds, so watchers must not send env at all.
     */
    sendClientEnv?: boolean;
    /** Advertise support for interactive extension dialogs. */
    supportsExtensionUi?: boolean;
    /** Dispose the connection by stopping its hidden worker instead of detaching. */
    ownedSession?: boolean;
    /** Require the target worker to have been created with telemetry disabled. */
    telemetryDisabled?: true;
}
/**
 * AgentConnection adapter for the local daemon JSONL socket transport.
 *
 * InteractiveMode depends only on AgentConnection; local socket ownership and
 * daemon command details stay inside this adapter.
 */
export declare function buildSessionTreeFromFlatNodes(flatNodes: readonly AgentConnectionSessionTreeFlatNode[]): AgentConnectionSessionTreeNode[];
export declare class DaemonAgentConnection implements AgentConnection {
    private readonly client;
    private activeSessionId;
    private readonly options;
    private readonly listeners;
    private readonly unsubscribeDaemonMessages;
    private readonly unsubscribeDaemonClose;
    private readonly clientId;
    private ownedSessionPromotionTail;
    private lastEventCursor;
    private readonly retiredEventGenerations;
    private lastEventSequence;
    private latestSnapshot;
    private latestSnapshotIsFresh;
    private attachedSessionId;
    private attachedSessionFile;
    private daemonLogPath;
    private updateRestartPending;
    private updateReconnectFailed;
    private terminalCloseEmitted;
    private updateReconnectPromise?;
    private readonly activeSideQuestionIds;
    private readonly snapshotAssemblies;
    private readonly completedSnapshots;
    private readonly pendingReattachActiveSessionIds;
    private readonly snapshotRecoveryPromises;
    private readonly ignoredSnapshotIds;
    private reconnectPromise?;
    private readonly definitiveRequestErrors;
    private disposing;
    private disposed;
    constructor(client: DaemonClient, activeSessionId: string, options?: DaemonAgentConnectionOptions);
    static attach(client: DaemonClient, activeSessionId: string, options?: DaemonAgentConnectionOptions): Promise<DaemonAgentConnection>;
    attach(): Promise<void>;
    subscribe(listener: AgentConnectionEventListener): () => void;
    onBeforeSessionInvalidate(_listener: AgentConnectionBeforeSessionInvalidateListener): () => void;
    getState(): Promise<AgentConnectionState>;
    getInitialSnapshot(): Promise<AgentConnectionSnapshot>;
    getMessages(): Promise<AgentMessage[]>;
    getSessionHeader(): Promise<AgentConnectionSessionHeader | undefined>;
    getCommands(): Promise<AgentConnectionSlashCommand[]>;
    getResourceSnapshot(): Promise<AgentConnectionResourceSnapshot>;
    getAvailableModels(): Promise<AgentConnectionModel[]>;
    getModelCatalog(): Promise<AgentConnectionModelCatalog>;
    getSessionStats(): Promise<SessionStats>;
    getContextTree(): Promise<ContextTreeNode>;
    getSessionContext(): Promise<AgentConnectionSessionContext>;
    getSessionTree(): Promise<{
        tree: AgentConnectionSessionTreeNode[];
        leafId: string | null;
    }>;
    listSavedSessions(scope: AgentConnectionSavedSessionScope, callbacks?: AgentConnectionSessionListCallbacks): Promise<AgentConnectionSavedSessionInfo[]>;
    getQueue(): Promise<AgentConnectionQueueState>;
    mutateQueuedMessage(lane: AgentConnectionQueuedMessageLane, index: number, expectedText: string, mutation: AgentConnectionQueuedMessageMutation): Promise<AgentConnectionQueuedMessageMutationStatus>;
    clearQueue(): Promise<AgentConnectionQueueState>;
    abortAndClearQueue(): Promise<AgentConnectionQueueState>;
    listCronJobs(options?: {
        includeInactive?: boolean;
    }): Promise<AgentCronJob[]>;
    listHeartbeats(): Promise<AgentConnectionHeartbeat[]>;
    manageHeartbeat(activeSessionId: string, jobId: string, action: AgentHeartbeatManagementAction): Promise<AgentCronJob>;
    addCronJob(schedule: string, prompt: string): Promise<AgentCronJob>;
    cancelCronJob(jobId: string): Promise<AgentCronJob>;
    getHeartbeat(): Promise<AgentCronJob | undefined>;
    setHeartbeat(schedule: string, instruction: string, deliveryMode?: AgentHeartbeatDeliveryMode): Promise<AgentCronJob>;
    updateHeartbeat(action: AgentHeartbeatUpdateAction): Promise<AgentCronJob | undefined>;
    sendAgentMessage(targetActiveSessionId: string, message: string): Promise<AgentSessionMessageReceipt>;
    getAgentMessageStatus(): Promise<AgentSessionMessageSafetyStatus>;
    pauseAgentMessages(): Promise<AgentSessionMessageSafetyStatus>;
    resumeAgentMessages(): Promise<AgentSessionMessageSafetyStatus>;
    clearAgentMessages(): Promise<number>;
    getUserMessagesForForking(): Promise<AgentConnectionUserMessage[]>;
    getLastAssistantText(): Promise<string | undefined>;
    getSystemPrompt(): Promise<string>;
    getToolDefinition(name: string): Promise<AgentConnectionToolDefinition | undefined>;
    setSessionEntryLabel(entryId: string, label: string | undefined): Promise<void>;
    respondToExtensionUiRequest(requestId: string, response: AgentConnectionExtensionUiResponse): Promise<void>;
    prompt(message: string, options?: AgentConnectionPromptOptions): Promise<void>;
    promptAndWait(message: string, options?: AgentConnectionPromptOptions): Promise<void>;
    private promptWithAdmissionCancellation;
    startSideQuestion(id: string, question: string, previousTurns?: AgentConnectionSideQuestionTurn[]): Promise<void>;
    abortSideQuestion(id: string): Promise<boolean>;
    steer(message: string, images?: ImageContent[]): Promise<void>;
    followUp(message: string, images?: ImageContent[]): Promise<void>;
    abort(): Promise<void>;
    cancelRlmChild(childId: string): Promise<boolean>;
    waitForIdle(): Promise<void>;
    waitForHeadlessCompletion(): Promise<AgentAutonomousStatus>;
    executeBash(command: string, options?: AgentConnectionExecuteBashOptions): Promise<void>;
    executeBashAndWait(command: string): Promise<BashResult>;
    abortBash(): Promise<void>;
    setModel(provider: string, modelId: string): Promise<AgentConnectionModel>;
    cycleModel(direction?: "forward" | "backward"): Promise<AgentConnectionModelCycleResult | undefined>;
    setScopedModels(scopedModels: AgentConnectionScopedModel[]): Promise<void>;
    setThinkingLevel(level: ThinkingLevel): Promise<void>;
    setServiceTier(serviceTier: ServiceTier): Promise<void>;
    cycleThinkingLevel(): Promise<ThinkingLevel | undefined>;
    setTransport(transport: Transport): Promise<void>;
    setSteeringMode(mode: AgentConnectionQueueMode): Promise<void>;
    setFollowUpMode(mode: AgentConnectionQueueMode): Promise<void>;
    setAutoCompactionEnabled(enabled: boolean): Promise<void>;
    setAutoRetryEnabled(enabled: boolean): Promise<void>;
    compact(customInstructions?: string): Promise<CompactionResult>;
    refine(options?: {
        instructions?: string;
        rollbackId?: string;
        global?: boolean;
    }): Promise<RefinementResult>;
    abortCompaction(): Promise<void>;
    abortBranchSummary(): Promise<void>;
    abortRetry(): Promise<void>;
    reload(): Promise<void>;
    newSession(options?: AgentConnectionNewSessionOptions): Promise<{
        cancelled: boolean;
    }>;
    switchSession(sessionPath: string, options?: AgentConnectionSwitchSessionOptions): Promise<{
        cancelled: boolean;
    }>;
    private reattachSession;
    fork(entryId: string, options?: AgentConnectionForkOptions): Promise<{
        cancelled: boolean;
        selectedText?: string;
    }>;
    navigateTree(targetId: string, options?: AgentConnectionNavigateTreeOptions): Promise<AgentConnectionNavigateTreeResult>;
    importFromJsonl(inputPath: string, cwdOverride?: string): Promise<{
        cancelled: boolean;
    }>;
    exportToHtml(outputPath?: string): Promise<string>;
    exportToJsonl(outputPath?: string): Promise<string>;
    setSessionName(name: string): Promise<void>;
    getRlmMaxDepthStatus(): Promise<{
        maxDepth: number;
        source: "chat" | "default" | "env" | "global" | "inherited";
    }>;
    setRlmMaxDepth(maxDepth: number, options?: {
        global?: boolean;
    }): Promise<{
        maxDepth: number;
        source: "chat" | "default" | "env" | "global" | "inherited";
        globalSaved: boolean;
        globalError?: string | undefined;
    }>;
    renameSavedSession(sessionPath: string, name: string): Promise<void>;
    deleteSavedSession(sessionPath: string): Promise<DeleteSessionFileResult>;
    watchSession(activeSessionId: string): Promise<AgentConnectionSessionWatcher | undefined>;
    dispose(): Promise<void>;
    promoteToResident(): Promise<void>;
    private withOwnedSessionPromotion;
    private reconnect;
    private requestOk;
    private requestData;
    private handleDaemonMessage;
    private captureDaemonLogPath;
    private formatDaemonSessionClosedError;
    private formatDaemonConnectionClosedError;
    private formatUpdateReconnectError;
    private formatDaemonDiagnosticContext;
    private reconnectAfterUpdate;
    private restoreConnectionAfterUpdate;
    private getSnapshotAssembly;
    private rejectSnapshotAssemblies;
    private ignoreSnapshotId;
    private rejectSnapshotAssembly;
    private recoverFailedSnapshot;
    private waitForSnapshot;
    private applyReplacementSnapshot;
    private completeSnapshotAssembly;
    private observeStreamingMessage;
    private isMessageForActiveSession;
    private isStaleSequencedMessage;
    private observeDaemonEventSequence;
    private observeEventCursor;
    private emit;
    private observeSideQuestionEvent;
}
//# sourceMappingURL=daemon-agent-connection.d.ts.map
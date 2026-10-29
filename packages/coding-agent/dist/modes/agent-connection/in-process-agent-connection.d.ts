import type { AgentMessage, ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { ImageContent, ServiceTier, Transport } from "@earendil-works/pi-ai";
import type { AgentSessionMessageReceipt, AgentSessionMessageSafetyStatus } from "../../core/agent-messages.js";
import type { AgentSessionRuntime } from "../../core/agent-session-runtime.js";
import type { AgentAutonomousStatus } from "../../core/autonomous.js";
import type { BashResult } from "../../core/bash-executor.js";
import type { CompactionResult } from "../../core/compaction/index.js";
import type { ContextTreeNode } from "../../core/context-tree.js";
import type { AgentCronJob, AgentHeartbeatDeliveryMode, AgentHeartbeatManagementAction, AgentHeartbeatUpdateAction } from "../../core/cron-jobs.js";
import type { ExtensionUIContext } from "../../core/extensions/types.js";
import type { RefinementResult } from "../../core/refinement/index.js";
import { type DeleteSessionFileResult } from "../../core/session-file-actions.js";
import type { SessionStats } from "../../core/session-stats.js";
import type { AgentConnection, AgentConnectionBeforeSessionInvalidateListener, AgentConnectionEventListener, AgentConnectionExecuteBashOptions, AgentConnectionExtensionUiResponse, AgentConnectionForkOptions, AgentConnectionHeartbeat, AgentConnectionModel, AgentConnectionModelCatalog, AgentConnectionModelCycleResult, AgentConnectionNavigateTreeOptions, AgentConnectionNavigateTreeResult, AgentConnectionNewSessionOptions, AgentConnectionPromptOptions, AgentConnectionQueuedMessageLane, AgentConnectionQueuedMessageMutation, AgentConnectionQueuedMessageMutationStatus, AgentConnectionQueueMode, AgentConnectionQueueState, AgentConnectionResourceSnapshot, AgentConnectionSavedSessionInfo, AgentConnectionSavedSessionScope, AgentConnectionScopedModel, AgentConnectionSessionContext, AgentConnectionSessionHeader, AgentConnectionSessionListCallbacks, AgentConnectionSessionTreeNode, AgentConnectionSessionWatcher, AgentConnectionSideQuestionTurn, AgentConnectionSlashCommand, AgentConnectionSnapshot, AgentConnectionState, AgentConnectionSwitchSessionOptions, AgentConnectionToolDefinition, AgentConnectionUserMessage } from "./types.js";
export interface InProcessHeadlessExtensionOptions {
    uiContext?: ExtensionUIContext;
    shutdownHandler?: () => void;
}
export declare class InProcessAgentConnection implements AgentConnection {
    private readonly runtimeHost;
    private readonly listeners;
    private readonly beforeSessionInvalidateListeners;
    private readonly sideQuestionRuns;
    private headlessExtensionOptions;
    private unsubscribeSessionEvents;
    constructor(runtimeHost: AgentSessionRuntime);
    bindHeadlessExtensions(options?: InProcessHeadlessExtensionOptions): Promise<void>;
    subscribe(listener: AgentConnectionEventListener): () => void;
    onBeforeSessionInvalidate(listener: AgentConnectionBeforeSessionInvalidateListener): () => void;
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
    listCronJobs(_options?: {
        includeInactive?: boolean;
    }): Promise<AgentCronJob[]>;
    listHeartbeats(): Promise<AgentConnectionHeartbeat[]>;
    manageHeartbeat(_activeSessionId: string, _jobId: string, _action: AgentHeartbeatManagementAction): Promise<AgentCronJob>;
    addCronJob(_schedule: string, _prompt: string): Promise<AgentCronJob>;
    cancelCronJob(_jobId: string): Promise<AgentCronJob>;
    getHeartbeat(): Promise<AgentCronJob | undefined>;
    setHeartbeat(_schedule: string, _instruction: string, _deliveryMode?: AgentHeartbeatDeliveryMode): Promise<AgentCronJob>;
    updateHeartbeat(_action: AgentHeartbeatUpdateAction): Promise<AgentCronJob | undefined>;
    sendAgentMessage(_targetActiveSessionId: string, _message: string): Promise<AgentSessionMessageReceipt>;
    getAgentMessageStatus(): Promise<AgentSessionMessageSafetyStatus>;
    pauseAgentMessages(): Promise<AgentSessionMessageSafetyStatus>;
    resumeAgentMessages(): Promise<AgentSessionMessageSafetyStatus>;
    clearAgentMessages(): Promise<number>;
    getUserMessagesForForking(): Promise<AgentConnectionUserMessage[]>;
    getLastAssistantText(): Promise<string | undefined>;
    getSystemPrompt(): Promise<string>;
    getToolDefinition(name: string): Promise<AgentConnectionToolDefinition | undefined>;
    setSessionEntryLabel(entryId: string, label: string | undefined): Promise<void>;
    respondToExtensionUiRequest(_requestId: string, _response: AgentConnectionExtensionUiResponse): Promise<void>;
    prompt(message: string, options?: AgentConnectionPromptOptions): Promise<void>;
    promptAndWait(message: string, options?: AgentConnectionPromptOptions): Promise<void>;
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
    getRlmMaxDepthStatus(): Promise<import("../../core/rlm-max-depth.js").RlmMaxDepthStatus>;
    setRlmMaxDepth(maxDepth: number, options?: {
        global?: boolean;
    }): Promise<import("../../core/rlm-max-depth.js").SetRlmMaxDepthResult>;
    renameSavedSession(sessionPath: string, name: string): Promise<void>;
    deleteSavedSession(sessionPath: string): Promise<DeleteSessionFileResult>;
    watchSession(childId: string): Promise<AgentConnectionSessionWatcher | undefined>;
    dispose(): Promise<void>;
    private get session();
    private bindCurrentSessionEvents;
    private bindCurrentSessionExtensions;
    private abortAllSideQuestions;
    private emit;
}
//# sourceMappingURL=in-process-agent-connection.d.ts.map
/**
 * AgentSession - Core abstraction for agent lifecycle and session management.
 *
 * This class is shared between all run modes (interactive, print, rpc).
 * It encapsulates:
 * - Agent state access
 * - Event subscription with automatic session persistence
 * - Model and thinking level management
 * - Compaction (manual and auto)
 * - Bash execution
 * - Session switching and branching
 *
 * Modes use this class and add their own I/O layer on top.
 */
import { Agent, type AgentEvent, type AgentMessage, type AgentState, type AgentTool, type ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { ImageContent, Model, ServiceTier, TextContent, UserMessage } from "@earendil-works/pi-ai";
import { type AgentFamilyRosterResult, type AgentSessionMessage, type AgentSessionMessageController, type AgentSessionMessageListResult, type AgentSessionMessageReceipt } from "./agent-messages.js";
import { type AgentObserveAgentSnapshot, type AgentObserveController, type AgentObserveListResult, type AgentObserveRecentMessagesResult } from "./agent-observe.js";
import type { AuthSourceToken } from "./auth-storage.js";
import { type AgentAutonomousConfig, type AgentAutonomousStatus } from "./autonomous.js";
import { type BashResult } from "./bash-executor.js";
import { type CompactionResult } from "./compaction/index.js";
import { type ContextTreeNode } from "./context-tree.js";
import type { AgentCronJob, AgentRlmHeartbeatController } from "./cron-jobs.js";
import { type ContextUsage, type ExtensionCommandContextActions, type ExtensionErrorListener, ExtensionRunner, type ExtensionUIContext, type InputSource, type ReplacedSessionContext, type SessionStartEvent, type ShutdownHandler, type ToolDefinition, type ToolInfo } from "./extensions/index.js";
import { type GoalHostResponse, type GoalState } from "./goals.js";
import type { KernelSentAgentMessage } from "./kernel/index.js";
import type { McpManager } from "./mcp/mcp-manager.js";
import { type CustomMessage } from "./messages.js";
import type { ModelRegistry } from "./model-registry.js";
import { type PromptTemplate } from "./prompt-templates.js";
import { type AutoRefineReason, type AutoRefineReview, type RefinementPlan, type RefinementResult } from "./refinement/index.js";
import type { ResourceLoader } from "./resource-loader.js";
import { type RlmDeleteSubagentResult, type RlmFindModelsResult, type RlmListSubagentsResult, type RlmSpawnHandle, type SubagentRuntimeHost } from "./rlm-runtime.js";
import { type DeliveryPolicy, type DeliveryRecord, type QueuedMessageLane, type QueuedMessageMutation, type QueuedMessageMutationStatus, type SessionActionSnapshot, type WakePolicy } from "./session-action-store.js";
import type { BranchSummaryEntry, SessionContext } from "./session-manager.js";
import { SessionManager } from "./session-manager.js";
import type { SessionStats } from "./session-stats.js";
import type { SettingsManager } from "./settings-manager.js";
import { type SessionSlashCommand } from "./slash-commands.js";
import { type BashOperations } from "./tools/bash.js";
export type { GoalState, GoalStatus } from "./goals.js";
export type { SessionStats } from "./session-stats.js";
export { type ParsedSkillBlock, parseSkillBlock } from "./skill-blocks.js";
export type RlmChildAgentStatus = "queued" | "running" | "done" | "error" | "cancelled";
export interface RlmChildAgentActivity {
    kind: "waiting" | "writing" | "executing";
    toolName?: string;
}
export interface RlmChildAgentSnapshot {
    id: string;
    parentId?: string;
    activeSessionId?: string;
    /** Stable daemon-visible session name for addressing/displaying the child. */
    sessionName?: string;
    /** Exact provider/model selector used by the child. */
    model?: string;
    label: string;
    status: RlmChildAgentStatus;
    durationMs?: number;
    answerPreview?: string;
    /** Number of tool executions the subagent has started so far. */
    toolUseCount?: number;
    /** Context size (tokens) of the subagent's latest turn. */
    tokenCount?: number;
    /** Latest recap of what the subagent is doing, from the summarizer. */
    recap?: string;
    sessionDir: string;
    activity?: RlmChildAgentActivity;
    /** Child sent at least one explicit agent message since task admission. */
    repliedSinceTask?: boolean;
    /** Failure reason when status is "error". */
    error?: string;
}
export type CompactionReason = "manual" | "threshold" | "overflow" | "requested";
/** Session-specific events that extend the core AgentEvent */
export type AgentSessionEvent = AgentEvent | {
    type: "ipython_sent_agent_message";
    toolCallId: string;
    message: KernelSentAgentMessage;
} | {
    type: "session_action_update";
    actions: SessionActionSnapshot;
} | {
    type: "compaction_start";
    reason: CompactionReason;
    customInstructions?: string;
} | {
    type: "session_info_changed";
    name: string | undefined;
} | {
    type: "thinking_level_changed";
    level: ThinkingLevel;
} | {
    type: "service_tier_changed";
    serviceTier: ServiceTier;
} | {
    type: "compaction_end";
    reason: CompactionReason;
    result: CompactionResult | undefined;
    aborted: boolean;
    willRetry: boolean;
    errorMessage?: string;
    /** "warning" for benign skips (nothing to compact), "error" for real failures */
    errorSeverity?: "warning" | "error";
    customInstructions?: string;
} | {
    type: "auto_retry_start";
    attempt: number;
    maxAttempts: number;
    delayMs: number;
    errorMessage: string;
} | {
    type: "auto_retry_end";
    success: boolean;
    attempt: number;
    finalError?: string;
} | {
    type: "auth_stale";
    provider: string;
    sourceTokens?: readonly AuthSourceToken[];
} | {
    type: "rlm_child_update";
    child: RlmChildAgentSnapshot;
} | {
    type: "recap_update";
    recap: string | undefined;
} | {
    type: "goal_update";
    goal: GoalState;
} | {
    type: "bash_start";
    command: string;
    excludeFromContext: boolean;
    transient?: boolean;
    runId?: string;
} | {
    type: "bash_output";
    chunk: string;
} | {
    type: "bash_end";
    exitCode: number | undefined;
    cancelled: boolean;
    truncated: boolean;
    fullOutputPath?: string;
    /** Set when execution failed before producing a result (e.g. spawn failure) */
    errorMessage?: string;
    /** Set for transient (side-conversation) runs so other attached clients suppress them. */
    transient?: boolean;
    /** Echo of the caller-supplied run id, so clients correlate runs by identity. */
    runId?: string;
} | {
    type: "refine_complete";
    result: RefinementResult;
} | {
    type: "refine_failed";
    error: string;
};
/** Listener function for agent session events */
export type AgentSessionEventListener = (event: AgentSessionEvent) => void;
/** Thrown when compaction is skipped for a benign reason (surfaced as a warning, not an error) */
export declare class CompactionSkippedError extends Error {
}
export interface AgentSessionConfig {
    agent: Agent;
    sessionManager: SessionManager;
    settingsManager: SettingsManager;
    serviceTierPreference?: ServiceTier;
    cwd: string;
    /** Config dir backing credentials (auth.json); exported to the kernel for skills. */
    agentDir?: string;
    /** Models to cycle through with Ctrl+P (from --models flag) */
    scopedModels?: Array<{
        model: Model<any>;
        thinkingLevel?: ThinkingLevel;
    }>;
    /** Resource loader for skills, prompts, themes, context files, system prompt */
    resourceLoader: ResourceLoader;
    /** SDK custom tools registered outside extensions */
    customTools?: ToolDefinition[];
    /** Model registry for API key resolution and model discovery */
    modelRegistry: ModelRegistry;
    /** Initial active built-in tool names. Default: [ipython] */
    initialActiveToolNames?: string[];
    /** Optional allowlist of tool names. When provided, only these tool names are exposed. */
    allowedToolNames?: string[];
    /**
     * Whether the built-in long-running goals feature is available: the bundled
     * goal skill in the IPython kernel, its goal.* host handlers, and /goal.
     * Default: true.
     */
    includeGoals?: boolean;
    /** Daemon-backed agent-to-agent messaging bridge. Omitted for local-only sessions. */
    agentMessageController?: AgentSessionMessageController;
    /** Daemon-backed read-only active-session observation bridge. Omitted for local-only sessions. */
    agentObserveController?: AgentObserveController;
    /**
     * Whether the bundled compact skill and its compact.* host handlers are
     * available to the model. Default: the compaction.agentCallable setting.
     */
    includeCompactSkill?: boolean;
    /**
     * Optional host-side controller for the bundled rlm-heartbeat Python skill.
     * When omitted, rlm_heartbeat.* host requests are unavailable.
     */
    rlmHeartbeatController?: AgentRlmHeartbeatController;
    /**
     * Optional MCP integration manager. When present, its mcp.* host requests
     * (refresh, begin_login) are exposed to the kernel.
     */
    mcpManager?: McpManager;
    /**
     * Override base tools (useful for custom runtimes).
     *
     * These are synthesized into minimal ToolDefinitions internally so AgentSession can keep
     * a definition-first registry even when callers provide plain AgentTool instances.
     */
    baseToolsOverride?: Record<string, AgentTool>;
    /** Mutable ref used by Agent to access the current ExtensionRunner */
    extensionRunnerRef?: {
        current?: ExtensionRunner;
    };
    /** Session start event metadata emitted when extensions bind to this runtime. */
    sessionStartEvent?: SessionStartEvent;
    /** Current RLM recursion depth. Root sessions default to RLM_DEPTH or 0. */
    rlmDepth?: number;
    /** Maximum RLM recursion depth. Defaults to RLM_MAX_DEPTH or 1. */
    rlmMaxDepth?: number;
    /** Directory exposed to the kernel as RLM_SESSION_DIR. */
    rlmSessionDir?: string;
    /** Node id for this session when it is itself an RLM child. */
    rlmParentNodeId?: string;
    /** Parent agent name/id shown in child communication doctrine. */
    rlmParentAgent?: string;
    /** Host responsible for creating RLM subagent runtimes. */
    subagentRuntimeHost?: SubagentRuntimeHost;
    /** Host-side autonomous continuation policy. */
    autonomous?: AgentAutonomousConfig;
    /**
     * Boot the IPython kernel in the background as soon as the session is created,
     * so the first ipython tool call doesn't pay the kernel cold start.
     *
     * Only applies to main agents (rlmDepth 0); subagent kernels stay lazy. Default: false.
     */
    prewarmIpythonKernel?: boolean;
    /** Test/extension hook for automatic refine review decisions. Defaults to the model-backed review gate. */
    autoRefineReviewer?: AutoRefineReviewer;
    /**
     * When true, auto-refine runs synchronously between turns at the
     * shouldStopAfterTurn boundary instead of in the background after
     * agent_end. Used for print/headless autonomous runs so refinement
     * never overlaps the primary model request. Default: false.
     */
    serializedRefine?: boolean;
    /**
     * Initial goal to seed at session creation. Only applied when rlmDepth
     * is 0 and no persisted thread_goal_state entry exists in the branch.
     */
    initialGoal?: {
        objective: string;
        tokenBudget?: number;
    };
}
export interface ExtensionBindings {
    uiContext?: ExtensionUIContext;
    commandContextActions?: ExtensionCommandContextActions;
    shutdownHandler?: ShutdownHandler;
    onError?: ExtensionErrorListener;
}
export interface AutoRefineReviewRequest {
    reason: AutoRefineReason;
    turnsSinceLastReview: number;
}
/**
 * Discriminated result from a serialized-mode background planning pass.
 * - "plan": review approved and planning succeeded; carry the exact plan,
 *   options, and abort controller so the boundary can apply directly
 *   without a second planning request.
 * - "skip": reviewer declined; no refine needed.
 * - "failure": review or planning threw; boundary should not retry.
 */
export type SerializedBackgroundPlanResult = {
    status: "plan";
    plan: RefinementPlan;
    options: {
        instructions?: string;
        rollbackId?: string;
        global?: boolean;
    };
    abort: AbortController;
    branchVersion: number;
} | {
    status: "skip";
} | {
    status: "invalidated";
    branchVersion: number;
} | {
    status: "failure";
    /** True when the background plan was for an explicit refine.run (skipReview). */
    explicit: boolean;
    /** Original options for the failed plan, to allow re-queue on explicit failure. */
    options: {
        instructions?: string;
        rollbackId?: string;
        global?: boolean;
    };
    branchVersion: number;
};
export type AutoRefineReviewer = (request: AutoRefineReviewRequest, signal?: AbortSignal) => Promise<AutoRefineReview>;
/** Options for AgentSession.prompt() */
export interface PromptOptions {
    /** Whether to expand file-based prompt templates (default: true) */
    expandPromptTemplates?: boolean;
    /** Image attachments */
    images?: ImageContent[];
    /** When streaming, how to queue the message: "steer" (interrupt) or "followUp" (wait). Required if streaming. */
    streamingBehavior?: "steer" | "followUp";
    /** Coalesce follow-up queueing so only one pending follow-up exists for this key. */
    followUpQueueKey?: string;
    /** Source of input for extension input event handlers. Defaults to "interactive". */
    source?: InputSource;
    /** Internal hook used by RPC mode to observe prompt preflight acceptance or rejection. */
    preflightResult?: (success: boolean, queued?: boolean) => void;
    /** Queue instead of starting immediately when the session is idle but already has queued work. */
    queueIfBusy?: boolean;
    /** Start queued work when no agent turn is currently running. */
    resumeIfIdle?: boolean;
    /** Host-generated prompt that must bypass extension/slash/template input interception. */
    internalPrompt?: boolean;
    /** Prevent host-driven prompts from causing autonomous continuation injection. */
    suppressAutonomousContinuation?: boolean;
    /** Skip extension input handlers for replaying already-accepted input. */
    skipInputHandlers?: boolean;
    /** Cancel this prompt while it is waiting for direct-turn admission. */
    signal?: AbortSignal;
    /** Internal host hook fired at the direct-turn ownership commit point. */
    admissionCommitted?: () => void;
    agentMessageId?: string;
    content?: (TextContent | ImageContent)[];
    customMessage?: CustomMessage;
}
type PreTurnCompactionTiming = "beforeModelSelection" | "afterModelSelection" | "skip";
type RefineBarrierPolicy = "always" | "ifInFlight" | "skip";
interface CommitPreparationPolicy {
    initialRefineBarrier: RefineBarrierPolicy;
    flushPendingBashBeforeValidation: boolean;
    validateModelAndAuth: boolean;
    awaitPendingModelSelection: boolean;
    preTurnCompaction: PreTurnCompactionTiming;
    finalRefineBarrier: RefineBarrierPolicy;
}
type QueuedAgentMessage = UserMessage | CustomMessage;
export interface TurnExecutionPolicy {
    preparation: CommitPreparationPolicy;
    runBeforeAgentStart: boolean;
    nextTurnContextTiming: "preparation" | "commit" | "skip";
    preserveEmptyExtensionPrompt: boolean;
    completionIncludesRetryChain: boolean;
}
export declare const SESSION_ACTION_RECOVERY_FORMAT_VERSION = 1;
export interface SessionActionRecoveryRecord {
    id: string;
    role: DeliveryRecord["role"];
    message: QueuedAgentMessage;
    ownerActionId: string;
}
export type SessionActionRecoveryPayload = {
    kind: "turn";
    text: string;
    preview?: string;
    records: SessionActionRecoveryRecord[];
    images?: ImageContent[];
    content?: (TextContent | ImageContent)[];
    customMessage?: CustomMessage;
    executionPolicy: TurnExecutionPolicy;
    queueVisible: boolean;
    acceptedAgentMessage: boolean;
    acceptedBeforeCompletion: boolean;
} | {
    kind: "session_command";
    text: string;
    command: SessionSlashCommand;
    images?: ImageContent[];
};
export interface SessionActionRecoveryAction {
    id: string;
    source: InputSource | "internal";
    delivery: DeliveryPolicy;
    wake: WakePolicy;
    payload: SessionActionRecoveryPayload;
    queueKey?: string;
    agentMessageId?: string;
    suppressAutonomousContinuation?: boolean;
}
export interface SessionActionRecoverySnapshot {
    formatVersion: typeof SESSION_ACTION_RECOVERY_FORMAT_VERSION;
    actions: SessionActionRecoveryAction[];
}
/** Result from cycleModel() */
export interface ModelCycleResult {
    model: Model<any>;
    thinkingLevel: ThinkingLevel;
    serviceTier: ServiceTier;
    /** Whether cycling through scoped models (--models flag) or all available */
    isScoped: boolean;
}
interface ModelSelectOptions {
    waitForExtensions?: boolean;
}
import type { RlmMaxDepthStatus, SetRlmMaxDepthResult } from "./rlm-max-depth.js";
export type { RlmMaxDepthSource, RlmMaxDepthStatus, SetRlmMaxDepthResult } from "./rlm-max-depth.js";
export declare function compactRlmText(text: string, maxLength?: number): string;
export declare function rlmChildLabel(prompt: string): string;
export declare class AgentSession {
    readonly agent: Agent;
    readonly sessionManager: SessionManager;
    readonly settingsManager: SettingsManager;
    private _serviceTierPreference;
    private _scopedModels;
    private _unsubscribeAgent?;
    private _eventListeners;
    private _lastSessionActionSnapshot;
    private _agentEventQueue;
    /** Session-owned actions. Items are never fed into Agent.steer/followUp. */
    private readonly _actionStore;
    private _sessionInputPump;
    private _sessionInputPumpRequested;
    private _sessionInputPumpEpoch;
    private _sessionInputArrivalEpoch;
    private _sessionInputPumpSuspended;
    private readonly _queuedWorkPauses;
    private _sessionActionCommitTail;
    private _sessionActionCommitOwner;
    private _pendingSessionActionFenceWaiters;
    private readonly _sessionActionCommitContext;
    private readonly _sessionActionCommitDisposeAbortController;
    private readonly _sessionInputCheckpointWaiters;
    /** Messages queued to be included with the next user prompt as context ("asides"). */
    private _pendingNextTurnMessages;
    private _goalState;
    private _goalAccountingStartedAt;
    private _goalAccountedAssistantMessages;
    private _goalAbortInProgress;
    private _autonomousState;
    private _autonomousContinuationSuppressionDepth;
    private _autonomousContinuationSuppressedMessages;
    private _compactionAbortController;
    private _autoCompactionAbortController;
    private _compactionOperation;
    /** One recovery attempt per overflow; "reported" dedups the failure notice. */
    private _overflowRecovery;
    private _continueAfterThresholdCompaction;
    private _pendingRequestedCompaction;
    private _pendingRequestedRefine;
    private _branchSummaryAbortController;
    private _branchSummaryOperation;
    private _retryAbortController;
    private _retryAttempt;
    private _retryPromise;
    private _retryResolve;
    private _retryAuthFailureSources;
    private _agentMessageOutcomes;
    private _lateIpythonSentAgentMessages;
    /** Outcome disclosures whose session-file append failed; retained for context rebuilds. */
    private readonly _unpersistedCompactionOutcomes;
    private _bashAbortController;
    private _userBashRunning;
    private _userBashAbortRequested;
    private _pendingBashMessages;
    private _extensionRunner;
    private _execEnvProvider?;
    private _turnIndex;
    private _modelSelectEmitQueue;
    private _modelSelectEmitQueueIdle;
    private _modelSelectEmitContext;
    private _resourceLoader;
    private _customTools;
    private _baseToolDefinitions;
    private _cwd;
    private _agentDir?;
    private _extensionRunnerRef?;
    private _initialActiveToolNames?;
    private _allowedToolNames?;
    private _includeGoals;
    private _includeCompactSkill;
    private _rlmHeartbeatController?;
    private _agentMessageController?;
    private _agentObserveController?;
    private _mcpManager?;
    private _baseToolsOverride?;
    private _sessionStartEvent;
    private _extensionUIContext?;
    private _extensionCommandContextActions?;
    private _extensionShutdownHandler?;
    private _extensionErrorListener?;
    private _extensionErrorUnsubscriber?;
    private _disposed;
    private readonly _disposeCallbacks;
    private _disposeCallbacksPromise?;
    private _disposing;
    private _disposeAsyncPromise?;
    private _ipythonKernelProvisioner?;
    /** Artifact dir backing the current provisioner's kernel snapshot, if any. */
    private _ipythonKernelSnapshotDir?;
    /** True once the runtime has been built once; later builds are in-process rebuilds (/reload). */
    private _ipythonRuntimeBuilt;
    private readonly _prewarmIpythonKernel;
    private _rlmDepth;
    private readonly _configuredRlmMaxDepth;
    private _rlmMaxDepth;
    private _rlmMaxDepthSource;
    private _rlmSessionDir?;
    private _rlmParentNodeId?;
    private _rlmParentAgent?;
    private _repliedToParentSinceTask;
    private _parentReplyCount;
    private _subagentRuntimeHost?;
    private _activeRlmChildRuns;
    private _pendingRlmSubagentSessionNames;
    private _rlmChildSessions;
    private _deletedRlmChildIds;
    private _rlmChildCleanupFailures;
    private _deletingRlmChildren;
    private _rlmChildUnsubscribes;
    /** Latest recap for this session, written by the daemon summarizer; read by a parent to label its child snapshots. */
    private _currentRecap?;
    private _modelRegistry;
    private _toolRegistry;
    private _toolDefinitions;
    private _toolPromptSnippets;
    private _toolPromptGuidelines;
    private _baseSystemPrompt;
    private _baseSystemPromptOptions;
    private _assistantTurnsSinceAutoRefine;
    private _lastAutoRefineReviewAt;
    private _autoRefineInProgress;
    private readonly _autoRefineOperations;
    private readonly _scheduledAutoRefineTimers;
    private _compactAutoRefinePending;
    private _turnIntervalAutoRefinePending;
    private _postCompactionContinuationScheduled;
    private _postCompactionContinuationTimer;
    private _postCompactionContinuationMessages;
    private _scheduledPostCompactionContinuationMessages;
    private _queuedAutonomousThresholdContinuations;
    private _queuedAutonomousContinuationSnapshots;
    private _pendingThresholdCompactionAutonomousMessages;
    private _pendingAutoRefineReview;
    private _autoRefineBranchVersion;
    private _autoRefineReviewAbort?;
    private _refineAbortController?;
    private readonly _autoRefineReviewer?;
    /** When true, auto-refine runs synchronously between turns (serialized mode). */
    private readonly _serializedRefine;
    /** Settles (never rejects) after a planned refine waits for idle and finishes applying. */
    private _refineInFlight?;
    /** Settles when the background planning LLM pass completes. Planning does not block turn entry points. */
    private _refinePlanInFlight?;
    /**
     * Settles when a serialized-mode background planning pass completes.
     * Planning starts at assistant message_end (overlapping tool execution)
     * and is awaited at shouldStopAfterTurn before applying.
     */
    private _serializedPlanInFlight?;
    private _serializedPlanClaim?;
    private _serializedExplicitRefineOptions?;
    constructor(config: AgentSessionConfig);
    /**
     * Set the RLM heartbeat controller after construction. Used by
     * print/headless mode to attach an in-process heartbeat scheduler
     * when the session is created outside the daemon.
     */
    setRlmHeartbeatController(controller: AgentRlmHeartbeatController): void;
    /** Model registry for API key resolution and model discovery */
    get modelRegistry(): ModelRegistry;
    setSubagentRuntimeHost(host?: SubagentRuntimeHost): void;
    private _getRequiredRequestAuth;
    /**
     * Install tool hooks once on the Agent instance.
     *
     * The callbacks read `this._extensionRunner` at execution time, so extension reload swaps in the
     * new runner without reinstalling hooks. Extension-specific tool wrappers are still used to adapt
     * registered tool execution to the extension context. Tool call and tool result interception now
     * happens here instead of in wrappers.
     */
    private _installAgentToolHooks;
    private _installAgentContinuationHook;
    private _installAgentTurnHook;
    /** Emit an event to all listeners */
    private _emit;
    private _emitQueueUpdate;
    private _restoreLateIpythonSentAgentMessages;
    private _rememberLateIpythonSentAgentMessage;
    private _applyLateIpythonSentAgentMessages;
    private _recordLateIpythonSentAgentMessage;
    private _emitGoalUpdate;
    private _loadPersistedRlmMaxDepthState;
    private _resolveRlmMaxDepth;
    private _loadPersistedGoalState;
    /**
     * Whether the session branch is seedable for an initial goal. Returns true
     * only when the branch contains exclusively bootstrap entry types
     * (model_change, thinking_level_change, service_tier_change) and no
     * thread_goal_state custom entry. Any message, custom entry, or persisted
     * goal (including cleared/complete/error) means the session has been used
     * and should not be reseeded.
     */
    private _isBranchSeedable;
    private _reloadGoalStateFromBranch;
    private _reloadRlmMaxDepthFromBranch;
    private _persistGoalState;
    private _setGoalState;
    private _goalWithCurrentWallClock;
    private _goalWithAccountedWallClock;
    private _cancelSessionActions;
    private _clearQueuedGoalContexts;
    private _startGoal;
    private _clearGoal;
    private _pauseGoal;
    private _resumeGoal;
    private _finishGoalWithError;
    private _finishGoalForTerminalAssistantMessage;
    private _stopGoalContinuationForTerminalMessage;
    private _parseGoalSlashCommand;
    private _parseAutonomousSlashCommand;
    private _formatAutonomousStatus;
    private _emitAutonomousStatus;
    private _handleAutonomousSlashCommand;
    /** Append custom messages returned by before_agent_start extension handlers. */
    private _appendBeforeAgentStartMessages;
    private _validateCanStartAgentRun;
    /**
     * Goals are pursued through the IPython goal skill, so the only tool the
     * model needs is ipython. Force-activate it (including into a live
     * continuation context) so the model can always reach `goal.complete()`.
     */
    private _ensureGoalRuntimeActive;
    private _runOrQueueGoalContext;
    private _handleGoalSlashCommand;
    private _accountGoalUsageForAssistantMessage;
    private get _steeringStopPending();
    private _shouldStopBeforeTurn;
    private _shouldStopAfterTurn;
    private _shouldStopForThresholdCompaction;
    private _runSerializedRefineCheckpoint;
    private _runSerializedRefineCheckpointAfterBackground;
    private _runSerializedAutoRefineReview;
    private _consumeSerializedBackgroundPlan;
    private _applySerializedPlan;
    /**
     * Start background refinement planning at assistant message_end, while
     * tools are still executing. The plan (if any) is awaited at the
     * shouldStopAfterTurn boundary before applying. Planning overlaps tool
     * execution only — never another model request.
     */
    private _maybeStartSerializedBackgroundPlan;
    private _runBackgroundPlan;
    private _runSerializedRefine;
    private _thresholdCompactionNeeded;
    private _snapshotAutonomousRuntimeState;
    private _restoreAutonomousRuntimeSnapshot;
    private _queueAutonomousContinuationForThresholdCompaction;
    private _clearQueuedAutonomousContinuations;
    private _clearQueuedAutonomousContinuationsAfterSkippedThresholdCompaction;
    /**
     * Handle a goal.* request from the IPython kernel host bridge (the bundled
     * goal skill). All goal state stays host-side; the kernel only sees the
     * serialized snake_case response.
     */
    handleGoalHostRequest(type: string, payload?: Record<string, unknown>): GoalHostResponse;
    /**
     * Handle a compact.* request from the kernel host bridge. Compaction would
     * abort the run executing the requesting cell, so compact.run only schedules
     * it; _checkCompaction consumes the request at the turn boundary.
     */
    handleCompactHostRequest(type: string, payload?: Record<string, unknown>): Record<string, unknown>;
    /**
     * Handle a refine.* request from the kernel host bridge. Like compact,
     * refinement waits for the current turn to become idle before applying
     * changes, so refine.run only schedules it; _consumePendingRequestedRefine
     * fires it at the turn boundary. This prevents a deadlock that would occur
     * if refine() awaited agent idle from within the active tool call.
     */
    handleRefineHostRequest(type: string, payload?: Record<string, unknown>): Record<string, unknown>;
    /**
     * Handle an rlm_heartbeat.* request from the bundled rlm-heartbeat skill.
     * These heartbeats are internal to this active session and never read or
     * mutate the user-level /heartbeat.
     */
    handleRlmHeartbeatHostRequest(type: string, payload?: Record<string, unknown>): Record<string, unknown>;
    handleAgentMessageHostRequest(type: string, payload?: Record<string, unknown>): Promise<AgentSessionMessageListResult | AgentSessionMessageReceipt | AgentFamilyRosterResult> | AgentSessionMessageListResult | AgentFamilyRosterResult;
    handleAgentObserveHostRequest(type: string, payload?: Record<string, unknown>): AgentObserveListResult | AgentObserveAgentSnapshot | AgentObserveRecentMessagesResult | Promise<AgentObserveListResult | AgentObserveAgentSnapshot | AgentObserveRecentMessagesResult>;
    private _createGoalFromHost;
    private _completeGoalFromHost;
    private _getGoalContinuationMessages;
    private _getContinuationMessages;
    private _lastAssistantMessage;
    private _agentMessageOutcome;
    /**
     * Register a delivery waiter before submitting the prompt. Delivery outcomes are not retained
     * for late lookup, so callers that register after admission may wait for a future use of the id.
     */
    waitForAgentMessagePromptDelivery(agentMessageId: string): Promise<void>;
    /** Resolve (no error) or reject an existing leg of an agent message outcome. */
    private _settleAgentMessage;
    /** Reject both currently registered legs of an agent message outcome. */
    private _rejectAgentMessage;
    private _rejectQueuedAgentMessageDeliveries;
    private _capturingCancelledAction;
    private _hasCancelledDispatchCapture;
    /** Internal handler for agent events - shared by subscribe and reconnect */
    private _handleAgentEvent;
    private _createRetryPromiseForAgentEnd;
    private _findLastAssistantInMessages;
    private _addLoginGuidanceToAuthError;
    private _processAgentEvent;
    private _isPromptTurnStartMessage;
    /** Resolve the pending retry promise */
    private _resolveRetry;
    /** Find the last assistant message in agent state (including aborted ones) */
    private _findLastAssistantMessage;
    private _replaceMessageInPlace;
    private _emitExtensionEvent;
    /**
     * Subscribe to agent events.
     * Session persistence is handled internally (saves messages on message_end).
     * Multiple listeners can be added. Returns unsubscribe function for this listener.
     */
    subscribe(listener: AgentSessionEventListener): () => void;
    /**
     * Temporarily disconnect from agent events.
     * User listeners are preserved and will receive events again after resubscribe().
     * Used internally during operations that need to pause event processing.
     */
    private _disconnectFromAgent;
    /**
     * Reconnect to agent events after _disconnectFromAgent().
     * Preserves all existing listeners.
     */
    private _reconnectToAgent;
    /**
     * Remove all listeners and disconnect from agent.
     * Call this when completely done with the session.
     */
    /**
     * Async teardown for graceful quit/switch: await the IPython kernel's dispose
     * (which flushes a final namespace snapshot) before the synchronous dispose, so
     * the latest state reaches disk instead of racing process exit.
     */
    disposeAsync(): Promise<void>;
    private _drainPendingRefinementForDisposal;
    private _disposeAsyncOnce;
    private _startDisposeCallbacks;
    dispose(): void;
    registerDisposeCallback(callback: () => void | Promise<void>): void;
    /** Full agent state */
    get state(): AgentState;
    /** Current model (may be undefined if not yet selected) */
    get model(): Model<any> | undefined;
    /** Current thinking level */
    get thinkingLevel(): ThinkingLevel;
    get serviceTier(): ServiceTier;
    /** Whether agent is currently streaming a response */
    get isStreaming(): boolean;
    /** Current effective system prompt (includes any per-turn extension modifications) */
    get systemPrompt(): string;
    /** Current retry attempt (0 if not retrying) */
    get retryAttempt(): number;
    /**
     * Get the names of currently active tools.
     * Returns the names of tools currently set on the agent.
     */
    getActiveToolNames(): string[];
    /**
     * Get all configured tools with name, description, parameter schema, and source metadata.
     */
    getAllTools(): ToolInfo[];
    getToolDefinition(name: string): ToolDefinition | undefined;
    /**
     * Set active tools by name.
     * Only tools in the registry can be enabled. Unknown tool names are ignored.
     * Also rebuilds the system prompt to reflect the new tool set.
     * Changes take effect on the next agent turn.
     */
    setActiveToolsByName(toolNames: string[]): void;
    /** Whether compaction or branch summarization is currently running */
    get isCompacting(): boolean;
    /** All messages including custom types like BashExecutionMessage */
    get messages(): AgentMessage[];
    buildSessionContext(): SessionContext;
    /**
     * Merge disclosures whose session-file append failed into a rebuilt message
     * list at their timestamp position, where they appeared live.
     */
    private _mergeUnpersistedCompactionOutcomes;
    /** Current steering mode */
    get steeringMode(): "all" | "one-at-a-time";
    /** Current follow-up mode */
    get followUpMode(): "all" | "one-at-a-time";
    /** Current session file path, or undefined if sessions are disabled */
    get sessionFile(): string | undefined;
    /** Current session ID */
    get sessionId(): string;
    /** Current RLM spawn depth for this session. */
    get rlmDepth(): number;
    /** Current absolute RLM spawn-depth cap. */
    get rlmMaxDepth(): number;
    /** Current session display name, if set */
    get sessionName(): string | undefined;
    get goalState(): GoalState;
    getAutonomousStatus(): AgentAutonomousStatus;
    recordHostAutonomousContinuation(): void;
    refreshAutonomousGates(): Promise<void>;
    private _runWithAutonomousContinuationSuppressed;
    private _markAutonomousContinuationSuppressed;
    /** Scoped models for cycling (from --models flag) */
    get scopedModels(): ReadonlyArray<{
        model: Model<any>;
        thinkingLevel?: ThinkingLevel;
    }>;
    /** Update scoped models for cycling */
    setScopedModels(scopedModels: Array<{
        model: Model<any>;
        thinkingLevel?: ThinkingLevel;
    }>): void;
    /** File-based prompt templates */
    get promptTemplates(): ReadonlyArray<PromptTemplate>;
    private _normalizePromptSnippet;
    private _normalizePromptGuidelines;
    private _rebuildSystemPrompt;
    private _refreshExtensionSystemPrompt;
    private _finishSubmissionNormalization;
    private _normalizeSubmission;
    private _runPreTurnCompaction;
    private _prepareForCommit;
    private _applyPreparedSystemPrompt;
    private _canStartSessionActionImmediately;
    /**
     * Send a prompt to the agent.
     * - Handles extension commands (registered via pi.registerCommand) immediately, even during streaming
     * - Expands file-based prompt templates by default
     * - During streaming, queues via steer() or followUp() based on streamingBehavior option
     * - Validates model and API key before sending (when not streaming)
     * @throws Error if streaming and no streamingBehavior specified
     * @throws Error if no model selected or no API key available (when not streaming)
     */
    prompt(text: string, options?: PromptOptions): Promise<void>;
    /** Resolve once the session has accepted ownership, before queued or active execution completes. */
    promptUntilAccepted(text: string, options?: PromptOptions): Promise<void>;
    promptAndWait(text: string, options?: PromptOptions): Promise<void>;
    acceptAgentMessagePrompt(text: string, options?: PromptOptions): Promise<void>;
    queueAgentMessagePrompt(text: string, streamingBehavior: "steer" | "followUp", customMessage?: AgentSessionMessage): Promise<boolean>;
    promptHeartbeat(job: AgentCronJob, options?: PromptOptions): Promise<void>;
    private _promptInjectedMessage;
    private _prompt;
    private _executeExtensionCommand;
    /**
     * Expand skill commands (/skill:name args) to their full content.
     * Returns the expanded text, or the original text if not a skill command or skill not found.
     * Emits errors via extension runner if file read fails.
     */
    private _expandSkillCommand;
    /**
     * Queue a steering message while the agent is running.
     * Delivered after the current assistant turn finishes executing its tool calls,
     * before the next LLM call.
     * Expands skill commands and prompt templates. Errors on extension commands.
     * @param images Optional image attachments to include with the message
     * @throws Error if text is an extension command
     */
    steer(text: string, images?: ImageContent[], options?: {
        queueKey?: string;
        agentMessageId?: string;
        resumeIfIdle?: boolean;
    }): Promise<void>;
    /**
     * Queue a follow-up message to be processed after the agent finishes.
     * Delivered only when agent has no more tool calls or steering messages.
     * Expands skill commands and prompt templates. Errors on extension commands.
     * @param images Optional image attachments to include with the message
     * @throws Error if text is an extension command
     */
    followUp(text: string, images?: ImageContent[], options?: {
        queueKey?: string;
        agentMessageId?: string;
        resumeIfIdle?: boolean;
    }): Promise<boolean>;
    restoreSessionActions(snapshot: SessionActionRecoverySnapshot): Promise<number>;
    private _restoreSessionCommand;
    private _restorePromptInput;
    restoreSteeringMessage(text: string, images?: ImageContent[], options?: {
        queueKey?: string;
        agentMessageId?: string;
        content?: (TextContent | ImageContent)[];
        customMessage?: CustomMessage;
        prefixMessages?: CustomMessage[];
    }): Promise<void>;
    restoreFollowUpMessage(text: string, images?: ImageContent[], options?: {
        queueKey?: string;
        agentMessageId?: string;
        content?: (TextContent | ImageContent)[];
        customMessage?: CustomMessage;
        prefixMessages?: CustomMessage[];
    }): Promise<boolean>;
    private _buildPromptContent;
    private _takePendingNextTurnMessages;
    private _deliveryPolicy;
    private _createDeliveryRecord;
    private _turnExecutionPolicy;
    private _createPreparedTurnAction;
    private _createSessionCommandAction;
    private _coalescedFollowUpOwner;
    private _assertSessionActionAdmissionAvailable;
    private _admitSessionInput;
    private _queuePreparedPrompt;
    private _runtimeActivity;
    private _hasSelectableSessionInput;
    get hasPendingSessionWork(): boolean;
    get hasPendingAdmissionWaiters(): boolean;
    private _scheduleSessionInputPump;
    private _pumpSessionInputs;
    private _executeSelectedSessionCommand;
    private _isBusyForSessionInput;
    private _isSessionInputHandoffDeferred;
    private _asError;
    private _isDeferredSessionInputError;
    private _surfaceSessionInputError;
    private _startPreparedTurnActions;
    private _executeQueuedSessionCommand;
    private _appendDurableSessionCommandMessage;
    /**
     * Throw an error if the text is an extension command.
     */
    private _throwIfExtensionCommand;
    /**
     * Send a custom message to the session. Creates a CustomMessageEntry.
     *
     * Handles three cases:
     * - Streaming: queues message, processed when loop pulls from queue
     * - Not streaming + triggerTurn: appends to state/session, starts new turn
     * - Not streaming + no trigger: appends to state/session, no turn
     *
     * @param message Custom message with customType, content, display, details
     * @param options.triggerTurn If true and not streaming, triggers a new LLM turn
     * @param options.deliverAs Delivery mode: "steer", "followUp", or "nextTurn"
     */
    sendCustomMessage<T = unknown>(message: Pick<CustomMessage<T>, "customType" | "content" | "display" | "details">, options?: {
        triggerTurn?: boolean;
        deliverAs?: "steer" | "followUp" | "nextTurn";
    }): Promise<void>;
    /**
     * Send a user message to the agent. Always triggers a turn.
     * When the agent is streaming, use deliverAs to specify how to queue the message.
     *
     * @param content User message content (string or content array)
     * @param options.deliverAs Delivery mode when streaming: "steer" or "followUp"
     */
    sendUserMessage(content: string | (TextContent | ImageContent)[], options?: {
        deliverAs?: "steer" | "followUp";
    }): Promise<void>;
    /**
     * Clear all queued messages and return them.
     * Useful for restoring to editor when user aborts.
     * @returns Object with steering and followUp arrays
     */
    clearQueue(): {
        steering: string[];
        followUp: string[];
    };
    private _invalidateQueuedPromptPreparation;
    clearQueuedUserMessagesMatching(predicate: (text: string) => boolean): {
        steering: string[];
        followUp: string[];
    };
    /**
     * Mutate a single visible queued message, addressed by its position in the same
     * projection the session-action snapshot publishes. expectedText must match the
     * item's current preview so clients never edit a shifted queue by accident.
     */
    mutateQueuedMessage(lane: QueuedMessageLane, index: number, expectedText: string, mutation: QueuedMessageMutation): QueuedMessageMutationStatus;
    get queuedActionCount(): number;
    get unfinishedActionCount(): number;
    get isQueuedWorkSuspended(): boolean;
    get isSessionActive(): boolean;
    getSessionActionSnapshot(): SessionActionSnapshot;
    getSteeringMessages(): readonly string[];
    getSteeringMessagePreviews(): readonly string[];
    getFollowUpMessages(): readonly string[];
    getFollowUpMessagePreviews(): readonly string[];
    getSessionActionRecoverySnapshot(): SessionActionRecoverySnapshot;
    private _notifySessionInputCheckpointChange;
    private _observeSessionActionDeferral;
    waitForSessionInputCheckpoint(signal?: AbortSignal): Promise<void>;
    acquireQueuedWorkPause(): {
        release(): void;
    };
    private _acquireDirectTurnAdmissionFence;
    private _acquireSessionActionCommitFence;
    /** Resume the scheduler after requestAbort/abortForUpdateRestart suspended it; owned pause leases are unaffected. */
    resumeQueuedWork(): boolean;
    waitForSessionInputIdle(): Promise<void>;
    waitForIdle(): Promise<void>;
    getPendingNextTurnMessageSnapshots(): readonly CustomMessage[];
    restorePendingNextTurnMessages(messages: readonly CustomMessage[]): void;
    removeQueuedFollowUp(queueKey: string): boolean;
    get resourceLoader(): ResourceLoader;
    requestAbort(): void;
    /**
     * Abort current operation and wait for agent to become idle.
     */
    abort(): Promise<void>;
    abortForUpdateRestart(): void;
    private _emitModelSelect;
    private _queueModelSelectEmit;
    /**
     * Set model directly.
     * Validates that the model is available, saves to session and settings.
     * @throws Error if the model is not available
     */
    setModel(model: Model<any>, options?: ModelSelectOptions): Promise<void>;
    private _trackModelSelectEmitError;
    private _shouldWaitForModelSelectEmit;
    private _pendingModelSelectEmit;
    /**
     * Cycle to next/previous model.
     * Uses scoped models (from --models flag) if available, otherwise all available models.
     * @param direction - "forward" (default) or "backward"
     * @returns The new model info, or undefined if only one model available
     */
    cycleModel(direction?: "forward" | "backward", options?: ModelSelectOptions): Promise<ModelCycleResult | undefined>;
    private _cycleScopedModel;
    private _cycleAvailableModel;
    /**
     * Set thinking level.
     * Clamps to model capabilities based on available thinking levels.
     * Saves to session and settings only if the level actually changes.
     */
    setThinkingLevel(level: ThinkingLevel): void;
    setServiceTier(serviceTier: ServiceTier): void;
    private _getEffectiveServiceTier;
    private _getServiceTierForModelSwitch;
    private _clampServiceTierForModel;
    /**
     * Cycle to next thinking level.
     * @returns New level, or undefined if model doesn't support thinking
     */
    cycleThinkingLevel(): ThinkingLevel | undefined;
    /**
     * Get available thinking levels for current model.
     * Ultra is appended only when the model exposes native max reasoning.
     */
    getAvailableThinkingLevels(): ThinkingLevel[];
    /**
     * Check if current model supports thinking/reasoning.
     */
    supportsThinking(): boolean;
    private _getThinkingLevelForModelSwitch;
    private _clampThinkingLevel;
    private _notifyKernelStateAfterCompaction;
    /**
     * Tell the model when a resumed session revived its IPython kernel state, so it
     * knows which variables are actually available instead of assuming the kernel is
     * the one it left. Delivered as context before the next turn.
     */
    private _onIpythonStateRestored;
    /**
     * Set steering message mode.
     * Saves to settings.
     */
    setSteeringMode(mode: "all" | "one-at-a-time"): void;
    /**
     * Set follow-up message mode.
     * Saves to settings.
     */
    setFollowUpMode(mode: "all" | "one-at-a-time"): void;
    /**
     * Manually compact the session context.
     * Aborts current agent operation first.
     * @param customInstructions Optional instructions for the compaction summary
     */
    compact(customInstructions?: string, options?: {
        skipAbort?: boolean;
    }): Promise<CompactionResult>;
    private _performCompaction;
    private _reapDeletedRlmSubagentRuntimesAfterCompaction;
    /**
     * Cancel in-progress compaction (manual or auto).
     */
    abortCompaction(): void;
    private _localHarnessStateDir;
    private _autoRefineAllowedForSession;
    private _cancelPostCompactionContinue;
    private _discardPendingAutoRefine;
    private _invalidatePendingAutoRefineForBranchChange;
    /**
     * Consume a refine request that was scheduled by the agent-callable refine
     * skill (refine.run). Fire-and-forget: the refine() method handles its own
     * background planning, idle wait, application, and error recovery. Called
     * at the turn boundary after compaction checks and before auto-refine
     * scheduling so the manual request takes priority.
     */
    private _emitRefineFailed;
    private _consumePendingRequestedRefine;
    private _scheduleAutoRefineAfterAgentEnd;
    private _scheduleAutoRefineAfterCompaction;
    private _schedulePostCompactionContinue;
    /** Whether any snapshot of scheduled continuation messages is still session-owned. */
    private _sessionOwnsScheduledContinuations;
    private _runScheduledPostCompactionContinue;
    private _forgetConsumedPostCompactionContinuations;
    private _shouldSkipAutoRefineForActiveAgent;
    private _scheduleDeferredAutoRefineIfIdle;
    private _scheduleAutoRefine;
    private _maybeAutoRefine;
    private _runApprovedRefine;
    private _reviewAutoRefine;
    /** Global harness state overlaid with this session's local state, when persisted. */
    private _loadMergedHarnessState;
    private _loadRefinementHistory;
    /**
     * Refine editable continual harness state: prompt notes, memory, skills, and subagent specs.
     * The base system prompt is intentionally not editable through this path.
     *
     * Planning runs in the background and does NOT block turn entry points
     * (`_waitForRefineIdle` only waits for `_refineInFlight`). Only the fast
     * application phase (disk I/O + in-memory mutation) blocks turn entry points.
     */
    refine(options?: {
        instructions?: string;
        rollbackId?: string;
        global?: boolean;
    }, internal?: {
        skipAbort?: boolean;
    }): Promise<RefinementResult>;
    private _waitForRefineIdle;
    private _planRefine;
    private _applyRefine;
    /**
     * Cancel in-progress branch summarization.
     */
    abortBranchSummary(): void;
    /**
     * Check if compaction is needed and run it.
     * Called after agent_end and before prompt submission.
     *
     * Two cases:
     * 1. Overflow: LLM returned context overflow error, remove error message from agent state, compact, auto-retry
     * 2. Threshold: Context over threshold, compact, and continue only for stopped in-progress loops or queued messages
     *
     * @param assistantMessage The assistant message to check
     * @param skipAbortedCheck If false, include aborted messages (for pre-prompt check). Default: true
     */
    private _getThresholdContextTokens;
    private _checkCompaction;
    /**
     * Internal: Run automatic (threshold/overflow) or model-requested compaction
     * with events.
     */
    /** Emit an unsuccessful compaction_end and durably record the outcome. */
    private _endCompactionUnsuccessfully;
    private _persistCompactionOutcome;
    private _runAutoCompaction;
    /**
     * Toggle auto-compaction setting.
     */
    setAutoCompactionEnabled(enabled: boolean): void;
    /** Whether auto-compaction is enabled */
    get autoCompactionEnabled(): boolean;
    /**
     * Set the provider for extra env vars merged over process.env in extension
     * pi.exec() subprocesses. The function is read at exec time, so a host (e.g.
     * the daemon) can update the underlying value per attach without rebinding.
     */
    setExecEnvProvider(provider: (() => Record<string, string | undefined> | undefined) | undefined): void;
    bindExtensions(bindings: ExtensionBindings): Promise<void>;
    private extendResourcesFromExtensions;
    private buildExtensionResourcePaths;
    private getExtensionSourceLabel;
    private _applyExtensionBindings;
    private _refreshCurrentModelFromRegistry;
    private _bindExtensionCore;
    private _refreshToolRegistry;
    private _buildRuntime;
    /**
     * Skills exposed to the model (system prompt + kernel). The bundled goal
     * and compact skills are withheld when disabled for this session.
     */
    private _modelVisibleSkills;
    /** Typed handlers for host requests arriving from the IPython kernel comm bridge. */
    private _createKernelHostHandlers;
    reload(): Promise<void>;
    private _rlmKernelEnv;
    private _addWebsearchKeyEnv;
    private _ensureRlmSessionDir;
    private _createChildRlmSessionDir;
    private _createEphemeralRlmSessionDir;
    /** Context size (tokens) of this session's latest assistant turn, for live subagent display. */
    _contextTokensForCurrentMessages(): number | undefined;
    setCurrentRecap(recap: string | undefined): void;
    get repliedToParentSinceTask(): boolean | undefined;
    getCurrentRecap(): string | undefined;
    private _findAssistantEntryForMessage;
    private _createRlmSubagentRuntimeOptions;
    private _createRlmSubagentRuntime;
    private _createInlineRlmSubagentRuntime;
    private _cancelActiveRlmChildRuns;
    private _cancelRlmChildRun;
    /** Status of a direct RLM child run, while the run is still tracked. */
    getRlmChildRunStatus(childId: string): RlmChildAgentStatus | undefined;
    private _currentActiveSessionId;
    private _awaitPendingRlmChildPublication;
    /** Current direct-child registry for the model-facing rlm.list_subagents API. */
    listRlmSubagents(): Promise<RlmListSubagentsResult>;
    private _buildRlmSubagentList;
    private _rlmSubagentMatchesTarget;
    private _resolveDirectRlmSubagent;
    /** Delete an inactive direct or nested child by its registry child id without affecting active runs. */
    deleteInactiveRlmSubagent(childId: string, isExternallyRunning?: () => boolean): Promise<"deleted" | "not_found" | "running">;
    /** Delete a running, retained, or passive direct child selected from this parent session's registry. */
    deleteRlmSubagent(target: string): Promise<RlmDeleteSubagentResult>;
    private _trackRlmSubagentDeletion;
    private _deleteRlmSubagentSession;
    private _removeRlmSubagentTracking;
    private _emitRlmSubagentRemoval;
    private _deleteResolvedRlmSubagent;
    /**
     * Retain a finished child session for the parent lifetime so inspectors and
     * daemon-hosted agent messaging can keep addressing it. Returns false (and disposes
     * the child) when the parent is already tearing down, so the caller can drop the
     * matching event forwarder too.
     */
    registerRlmChildSession(childId: string, session: AgentSession, unsubscribe?: () => void): boolean;
    /** Stop retaining an idle daemon child without deleting its durable registry row. */
    releaseRlmChildSession(childId: string, session: AgentSession): (() => void) | false;
    /** True when any direct or nested subagent is still running or queued. */
    hasRunningRlmChildren(): boolean;
    getRlmChildSession(childId: string): AgentSession | undefined;
    /**
     * Cancel a single RLM child run by id, searching nested child sessions.
     *
     * @returns true when a running or queued run was cancelled; false when the
     * id is unknown or the run already finished.
     */
    cancelRlmChildRun(childId: string, reason?: string): boolean;
    private _assertRlmSubagentSessionNameAvailable;
    private _authenticatedRlmModels;
    findRlmModels(query: string, limit: number): Promise<RlmFindModelsResult>;
    private _resolveRlmSubagentModel;
    private _startRlmChildRun;
    runRlmChild(prompt: string, kwargs?: Record<string, unknown>, spawnCode?: string): Promise<RlmSpawnHandle>;
    /**
     * Check if an error is retryable (overloaded, rate limit, server errors).
     * Context overflow errors are NOT retryable (handled by compaction instead).
     */
    private _isRetryableError;
    private _isFauxProviderQueueExhausted;
    private _isAgentLifecycleFailure;
    private _getProviderStreamFailureDetails;
    private _getProviderStreamFailureKind;
    private _isStructuredPermanentProviderFailure;
    private _isStructuredPermanentProviderRetryExhausted;
    private _getProviderStreamFailureAuthStatus;
    private _isConcreteProviderAuthFailure;
    private _captureRetryAuthFailureSource;
    private _markProviderAuthStale;
    private _markProviderAuthStaleForRetryFailure;
    private _finishActiveRetryWithFailure;
    private _handleRetryableError;
    /**
     * Cancel in-progress retry.
     */
    abortRetry(): void;
    private waitForRetry;
    /** Whether auto-retry is currently in progress */
    get isRetrying(): boolean;
    /** Whether an accepted prompt is still running or waiting for retry completion. */
    get hasAcceptedPromptInFlight(): boolean;
    /** Whether auto-retry is enabled */
    get autoRetryEnabled(): boolean;
    /**
     * Toggle auto-retry setting.
     */
    setAutoRetryEnabled(enabled: boolean): void;
    /**
     * Execute a bash command.
     * Adds result to agent context and session.
     * @param command The bash command to execute
     * @param onChunk Optional streaming callback for output
     * @param options.excludeFromContext If true, command output won't be sent to LLM (!! prefix)
     * @param options.operations Custom BashOperations for remote execution
     */
    executeBash(command: string, onChunk?: (chunk: string) => void, options?: {
        excludeFromContext?: boolean;
        operations?: BashOperations;
        transient?: boolean;
    }): Promise<BashResult>;
    /**
     * Run a user-initiated bash command (! / !! prefix), emitting bash_start,
     * bash_output, and bash_end session events so any attached client can render
     * streaming output. Extensions can intercept execution via the user_bash event.
     * Execution failures are reported through bash_end rather than a rejected promise;
     * only the already-running guard and extension dispatch errors reject.
     * @param command The bash command to execute
     * @param options.excludeFromContext If true, command output won't be sent to LLM (!! prefix)
     */
    runUserBash(command: string, options?: {
        excludeFromContext?: boolean;
        transient?: boolean;
        runId?: string;
    }): Promise<void>;
    private _drainQueuedMessagesAfterBash;
    private runUserBashLocked;
    /**
     * Record a bash execution result in session history.
     * Used by executeBash and by extensions that handle bash execution themselves.
     */
    recordBashResult(command: string, result: BashResult, options?: {
        excludeFromContext?: boolean;
    }): void;
    /**
     * Cancel running bash command.
     */
    abortBash(): void;
    /** Whether a bash command is currently running */
    get isBashRunning(): boolean;
    /** Whether there are pending bash messages waiting to be flushed */
    get hasPendingBashMessages(): boolean;
    /**
     * Flush pending bash messages to agent state and session.
     * Called after agent turn completes to maintain proper message ordering.
     */
    private _flushPendingBashMessages;
    /** Current RLM max-depth value and the source that supplied it. */
    getRlmMaxDepthStatus(): RlmMaxDepthStatus;
    /** Persist and immediately apply a per-chat RLM max-depth override. */
    setRlmMaxDepth(maxDepth: number, options?: {
        global?: boolean;
    }): Promise<SetRlmMaxDepthResult>;
    /** Set a display name for the current session. */
    setSessionName(name: string): void;
    /**
     * Navigate to a different node in the session tree.
     * Unlike fork() which creates a new session file, this stays in the same file.
     *
     * @param targetId The entry ID to navigate to
     * @param options.summarize Whether user wants to summarize abandoned branch
     * @param options.customInstructions Custom instructions for summarizer
     * @param options.replaceInstructions If true, customInstructions replaces the default prompt
     * @param options.label Label to attach to the branch summary entry
     * @returns Result with editorText (if user message) and cancelled status
     */
    private _branchNavigationQueue;
    navigateTree(targetId: string, options?: {
        summarize?: boolean;
        customInstructions?: string;
        replaceInstructions?: boolean;
        label?: string;
    }): Promise<{
        editorText?: string;
        cancelled: boolean;
        aborted?: boolean;
        summaryEntry?: BranchSummaryEntry;
    }>;
    private _navigateTree;
    private _navigateTreeUnderPause;
    /**
     * Get all user messages from session for fork selector.
     */
    getUserMessagesForForking(): Array<{
        entryId: string;
        text: string;
    }>;
    private _extractUserMessageText;
    /**
     * Get session statistics.
     */
    getSessionStats(): SessionStats;
    getContextUsage(): ContextUsage | undefined;
    /** RLM session dir holding sub-* child sessions, without creating directories. */
    private _rlmSessionDirForReading;
    private _contextWindowResolver;
    /**
     * Build the agent context overview for /context: this session as the root
     * plus one node per RLM sub-agent, recursively. Running children are read
     * from their live sessions; completed children from their persisted session
     * dirs, so the tree survives child disposal and session resume.
     */
    getContextTree(): ContextTreeNode;
    /**
     * Export session to HTML.
     * @param outputPath Optional output path (defaults to session directory)
     * @returns Path to exported file
     */
    exportToHtml(outputPath?: string): Promise<string>;
    /**
     * Export the current session branch to a JSONL file.
     * Writes the session header followed by all entries on the current branch path.
     * @param outputPath Target file path. If omitted, generates a timestamped file in cwd.
     * @returns The resolved output file path.
     */
    exportToJsonl(outputPath?: string): string;
    /**
     * Get text content of last assistant message.
     * Useful for /copy command.
     * @returns Text content, or undefined if no assistant message exists
     */
    getLastAssistantText(): string | undefined;
    createReplacedSessionContext(): ReplacedSessionContext;
    /**
     * Check if extensions have handlers for a specific event type.
     */
    hasExtensionHandlers(eventType: string): boolean;
    /**
     * Get the extension runner (for setting UI context and error handlers).
     */
    get extensionRunner(): ExtensionRunner;
}
//# sourceMappingURL=agent-session.d.ts.map
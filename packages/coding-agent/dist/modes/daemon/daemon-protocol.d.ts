import type { AgentMessage, ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { ImageContent, ServiceTier, TextContent, Transport } from "@earendil-works/pi-ai";
import type { AgentSessionMessageDeliveryMode, AgentSessionMessageReceipt, AgentSessionMessageSafetyStatus } from "../../core/agent-messages.js";
import type { SessionActionRecoverySnapshot } from "../../core/agent-session.js";
import type { AgentSessionRuntimeConfig } from "../../core/agent-session-config.js";
import type { AgentSessionRuntimeMetadata } from "../../core/agent-session-runtime.js";
import type { AgentAutonomousStatus } from "../../core/autonomous.js";
import type { BashResult } from "../../core/bash-executor.js";
import type { AgentCronJob, AgentHeartbeatDeliveryMode, AgentHeartbeatManagementAction, AgentHeartbeatUpdateAction } from "../../core/cron-jobs.js";
import type { InputSource } from "../../core/extensions/types.js";
import type { CustomMessage } from "../../core/messages.js";
import type { QueuedMessageLane, QueuedMessageMutation } from "../../core/session-action-store.js";
import type { SessionCwdIssue } from "../../core/session-cwd.js";
import type { DeleteSessionFileResult } from "../../core/session-file-actions.js";
import type { AgentConnectionAgentStatus, AgentConnectionHeartbeat, AgentConnectionQueueMode, AgentConnectionResourceSnapshot, AgentConnectionRlmChildAgentSnapshot, AgentConnectionSavedSessionScope, AgentConnectionSavedSessionState, AgentConnectionScopedModel, AgentConnectionSessionContext, AgentConnectionSessionEvent, AgentConnectionSessionHeader, AgentConnectionSessionTreeNode, AgentConnectionSideQuestionEvent, AgentConnectionSideQuestionTurn, AgentConnectionState } from "../agent-connection/types.js";
import type { SessionSummary } from "./daemon-session-list.js";
/**
 * Local daemon JSONL protocol.
 *
 * This is the transport used by DaemonAgentConnection today, not the final
 * remote gateway protocol. The protocol primitives below are intentionally
 * JSON-serializable so a future gateway can wrap or proxy this local transport
 * without leaking transport details back into InteractiveMode.
 */
export declare const DAEMON_PROTOCOL_NAME = "prime-agent.daemon";
export declare const DAEMON_PROTOCOL_VERSION = 7;
export declare const DAEMON_COMMAND_ENVELOPE_MIN_PROTOCOL_VERSION = 7;
export declare const DAEMON_SCHEMA_REVISION = 16;
export declare const DAEMON_SCHEMA_ID = "protocol-7-schema-16-1bcb9e7f1a49";
export type DaemonProtocolName = typeof DAEMON_PROTOCOL_NAME;
export type DaemonProtocolVersion = number;
export type DaemonCommandId = string;
export type DaemonEventId = string;
export type DaemonEventSequence = number;
export interface DaemonEventCursor {
    generation: string;
    sequence: DaemonEventSequence;
}
export type DaemonClientId = string;
export type DaemonClientCapability = "attach_snapshot" | "event_sequence" | "extension_ui" | "slim_attach" | "chunked_snapshot" | "client_owned_sessions";
export type DaemonPromptAdmissionCancellationStatus = "cancelled" | "owned" | "unknown";
export interface DaemonPromptAdmissionCancellationResult {
    status: DaemonPromptAdmissionCancellationStatus;
}
export type DaemonServerCapability = DaemonClientCapability | "delete_rlm_subagent" | "heartbeat_catalog" | "heartbeat_management" | "model_catalog" | "side_question_transcript" | "transient_bash" | "session_input_admission" | "prompt_admission_cancellation" | "queue_message_mutation";
export type DaemonReplayStatus = "complete" | "partial" | "unavailable";
export interface DaemonProtocolInfo {
    name: DaemonProtocolName;
    version: DaemonProtocolVersion;
}
export declare const DAEMON_PROTOCOL_INFO: DaemonProtocolInfo;
export declare const DAEMON_DEFAULT_CLIENT_CAPABILITIES: readonly DaemonClientCapability[];
export declare const DAEMON_SUPPORTED_CLIENT_CAPABILITIES: readonly DaemonClientCapability[];
export declare const DAEMON_DEFAULT_SERVER_CAPABILITIES: readonly DaemonServerCapability[];
export interface DaemonRuntimeIdentity {
    buildId: string;
    executablePath: string;
    entrypointPath?: string;
    launcherPath?: string;
}
export type DaemonResumeCursor = ({
    activeSessionId?: string;
} & DaemonEventCursor) | {
    activeSessionId?: string;
    eventSequence: DaemonEventSequence;
};
export interface DaemonAttachClientMetadata {
    clientId?: DaemonClientId;
    capabilities?: readonly DaemonClientCapability[];
    resumeCursor?: DaemonResumeCursor;
    /** Opt-out-only policy. A telemetry-enabled worker must reject this attach. */
    telemetryDisabled?: true;
}
/**
 * Client-side env vars forwarded to the daemon so extensions can reach them
 * (e.g. HERDR_PANE_ID/HERDR_SOCKET_PATH that herdr sets per pane). The daemon
 * scopes these to the created session and merges them over process.env for
 * that session's pi.exec() subprocesses — it does not mutate the daemon's own
 * env. Carried on create only: attach must not rebind a session's identity,
 * since watchers (agents view, subagent viewers) also attach.
 */
export interface DaemonClientEnv {
    env?: Record<string, string>;
}
export type DaemonSessionLifecycle = "resident" | "client_owned";
export interface DaemonLaunchEnv {
    launchEnv?: Record<string, string>;
}
/**
 * The allowlist of env vars a client may forward. One shared list because it
 * is the wire contract: clients filter before sending and the daemon
 * re-filters on receipt (the socket peer is untrusted).
 */
export declare const DAEMON_CLIENT_ENV_KEYS: readonly ["HERDR_ENV", "HERDR_PANE_ID", "HERDR_SOCKET_PATH", "HERDR_TAB_ID", "HERDR_WORKSPACE_ID"];
/** Collect the allowlisted env vars from the client process for the create command. */
export declare function collectDaemonClientEnv(source?: NodeJS.ProcessEnv): Record<string, string> | undefined;
export declare function collectDaemonLaunchEnv(source?: NodeJS.ProcessEnv): Record<string, string>;
export interface DaemonReplayInfo {
    status: DaemonReplayStatus;
    fromSequence?: DaemonEventSequence;
    toSequence: DaemonEventSequence;
    fromCursor?: DaemonEventCursor;
    toCursor?: DaemonEventCursor;
    reason?: string;
}
export interface DaemonEventMeta {
    id: DaemonEventId;
    protocol: DaemonProtocolInfo;
    activeSessionId?: string;
    sequence?: DaemonEventSequence;
    cursor?: DaemonEventCursor;
    emittedAt: string;
    replayed?: boolean;
}
export interface DaemonCommandEnvelope<TCommand extends DaemonCommand = DaemonCommand> {
    type: "command";
    id: DaemonCommandId;
    protocol: DaemonProtocolInfo;
    clientId?: DaemonClientId;
    command: TCommand;
}
export type DaemonCommandWire = DaemonCommand | DaemonCommandEnvelope;
export interface DaemonEventEnvelope<TEvent extends DaemonOutbound = DaemonOutbound> {
    type: "event";
    id: DaemonEventId;
    protocol: DaemonProtocolInfo;
    activeSessionId?: string;
    sequence?: DaemonEventSequence;
    cursor?: DaemonEventCursor;
    emittedAt: string;
    event: TEvent;
}
export interface DaemonArtifactReference {
    id: string;
    sessionId: string;
    type: string;
    logicalPath: string;
    relativePath?: string;
    mimeType?: string;
    metadata?: Record<string, string | number | boolean | null>;
}
export interface DaemonSessionSnapshot {
    activeSessionId: string;
    summary: SessionSummary;
    state: AgentConnectionState;
    messages: AgentMessage[];
    sessionContext?: AgentConnectionSessionContext;
    sessionTree?: {
        tree: AgentConnectionSessionTreeNode[];
        leafId: string | null;
    };
    lastEventSequence: DaemonEventSequence;
    lastEventCursor?: DaemonEventCursor;
    parent?: {
        activeSessionId?: string;
        sessionId?: string;
        nodeId?: string;
        childId?: string;
    };
    /** Live RLM child sessions (including grandchildren) hosted by the daemon under this session. */
    children?: AgentConnectionRlmChildAgentSnapshot[];
}
export interface DaemonAttachResult {
    protocol: DaemonProtocolInfo;
    activeSessionId: string;
    /** Omitted for clients with the "slim_attach" capability; use snapshot.summary. */
    state?: SessionSummary;
    /** Omitted for clients with the "slim_attach" capability; use snapshot.messages. */
    messages?: AgentMessage[];
    snapshot: DaemonSessionSnapshot;
    replay: DaemonReplayInfo;
    lastEventSequence: DaemonEventSequence;
    lastEventCursor?: DaemonEventCursor;
    snapshotStream?: {
        id: string;
        messageCount: number;
        targetChunkBytes: number;
    };
    client: {
        id: DaemonClientId;
        capabilities: DaemonClientCapability[];
    };
}
export declare const DAEMON_UPDATE_RESTART_FORMAT_VERSION = 1;
export interface DaemonUpdateRestartQueue {
    actions: SessionActionRecoverySnapshot;
    nextTurn: CustomMessage[];
}
export interface DaemonUpdateRestartSession {
    activeSessionId: string;
    sessionId: string;
    sessionFile: string;
    cwd: string;
    config: AgentSessionRuntimeConfig;
    runtimeMetadata?: AgentSessionRuntimeMetadata;
    clientEnv?: Record<string, string>;
    queue: DaemonUpdateRestartQueue;
    shouldResume: boolean;
    wasStreaming: boolean;
    wasCompacting: boolean;
    wasBashRunning: boolean;
    hadRunningRlmChildren: boolean;
    wasRetrying: boolean;
    hadAcceptedPromptInFlight: boolean;
}
export interface DaemonUpdateRestartManifest {
    formatVersion: typeof DAEMON_UPDATE_RESTART_FORMAT_VERSION;
    createdAt: string;
    sessions: DaemonUpdateRestartSession[];
    discardedActiveSessionIds?: string[];
}
export type DaemonSavedSessionListCommand = {
    id?: string;
    type: "list_saved_sessions";
    activeSessionId: string;
    scope: AgentConnectionSavedSessionScope;
} | {
    id?: string;
    type: "list_saved_sessions";
    cwd: string;
    sessionDir?: string;
    scope: AgentConnectionSavedSessionScope;
};
export type DaemonCommand = {
    id?: string;
    type: "list";
    all?: boolean;
    cwd?: string;
    sessionDir?: string;
    includeClientOwned?: boolean;
} | DaemonSavedSessionListCommand | ({
    id?: string;
    type: "create";
    sessionPath?: string;
    continueRecent?: boolean;
    noSession?: boolean;
    name?: string;
    config?: AgentSessionRuntimeConfig;
    runtimeMetadata?: AgentSessionRuntimeMetadata;
    lifecycle?: DaemonSessionLifecycle;
} & DaemonClientEnv & DaemonLaunchEnv) | ({
    id?: string;
    type: "attach";
    activeSessionId: string;
    supportsExtensionUi?: boolean;
} & DaemonAttachClientMetadata & DaemonClientEnv & DaemonLaunchEnv) | ({
    id?: string;
    type: "reattach";
    activeSessionId: string;
    targetActiveSessionId: string;
    supportsExtensionUi?: boolean;
} & DaemonAttachClientMetadata & DaemonClientEnv & DaemonLaunchEnv) | {
    id?: string;
    type: "detach";
    activeSessionId?: string;
} | {
    id?: string;
    type: "complete_owned_session";
    activeSessionId: string;
} | {
    id?: string;
    type: "promote_owned_session";
    activeSessionId: string;
} | {
    id?: string;
    type: "kill";
    activeSessionId: string;
} | {
    id?: string;
    type: "rename";
    activeSessionId: string;
    name: string;
} | {
    id?: string;
    type: "prompt";
    activeSessionId: string;
    message: string;
    content?: (TextContent | ImageContent)[];
    images?: ImageContent[];
    streamingBehavior?: "steer" | "followUp";
    queueIfBusy?: boolean;
    expandPromptTemplates?: boolean;
    source?: InputSource;
    agentMessageId?: string;
    customMessage?: CustomMessage;
    /** Unique only when the caller needs cancellable pre-ownership admission. */
    admissionId?: string;
} | {
    id?: string;
    type: "cancel_prompt_admission";
    activeSessionId: string;
    admissionId: string;
} | {
    id?: string;
    type: "prompt_and_wait";
    activeSessionId: string;
    message: string;
    content?: (TextContent | ImageContent)[];
    images?: ImageContent[];
    streamingBehavior?: "steer" | "followUp";
    queueIfBusy?: boolean;
    expandPromptTemplates?: boolean;
    source?: InputSource;
    /** Unique only when the caller needs cancellable pre-ownership admission. */
    admissionId?: string;
} | {
    id?: string;
    type: "steer";
    activeSessionId: string;
    message: string;
    content?: (TextContent | ImageContent)[];
    images?: ImageContent[];
    queueKey?: string;
    expandPromptTemplates?: boolean;
    agentMessageId?: string;
    customMessage?: CustomMessage;
    prefixMessages?: CustomMessage[];
} | {
    id?: string;
    type: "follow_up";
    activeSessionId: string;
    message: string;
    content?: (TextContent | ImageContent)[];
    images?: ImageContent[];
    queueKey?: string;
    expandPromptTemplates?: boolean;
    agentMessageId?: string;
    customMessage?: CustomMessage;
    prefixMessages?: CustomMessage[];
} | {
    id?: string;
    type: "restore_next_turn";
    activeSessionId: string;
    messages: CustomMessage[];
} | {
    id?: string;
    type: "restore_actions";
    activeSessionId: string;
    snapshot: SessionActionRecoverySnapshot;
} | {
    id?: string;
    type: "append_custom_message";
    activeSessionId: string;
    message: Pick<CustomMessage, "customType" | "content" | "display" | "details">;
} | {
    id?: string;
    type: "resume_queue";
    activeSessionId: string;
} | {
    id?: string;
    type: "send_message";
    targetActiveSessionId: string;
    message: string;
    fromActiveSessionId?: string;
    /** Internal worker-origin marker; public clients remain unrestricted. */
    agentOrigin?: boolean;
    deliveryMode?: AgentSessionMessageDeliveryMode;
} | {
    id?: string;
    type: "agent_messages_status";
    activeSessionId?: string;
} | {
    id?: string;
    type: "agent_messages_pause";
    activeSessionId?: string;
} | {
    id?: string;
    type: "agent_messages_resume";
    activeSessionId?: string;
} | {
    id?: string;
    type: "agent_messages_clear";
    activeSessionId: string;
} | {
    id?: string;
    type: "abort";
    activeSessionId: string;
} | {
    id?: string;
    type: "start_side_question";
    activeSessionId: string;
    sideQuestionId: string;
    question: string;
    previousTurns?: AgentConnectionSideQuestionTurn[];
} | {
    id?: string;
    type: "abort_side_question";
    activeSessionId: string;
    sideQuestionId: string;
} | {
    id?: string;
    type: "execute_bash";
    activeSessionId: string;
    command: string;
    excludeFromContext?: boolean;
    transient?: boolean;
    runId?: string;
} | {
    id?: string;
    type: "abort_bash";
    activeSessionId: string;
} | {
    id?: string;
    type: "cancel_rlm_child";
    activeSessionId: string;
    childId: string;
} | {
    id?: string;
    type: "delete_rlm_subagent";
    activeSessionId: string;
    childId: string;
} | {
    id?: string;
    type: "wait_for_idle";
    activeSessionId: string;
} | {
    id?: string;
    type: "wait_for_headless_completion";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_session_header";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_state";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_connection_state";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_messages";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_session_stats";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_context_tree";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_commands";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_resource_snapshot";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_model_catalog";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_available_models";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_queue";
    activeSessionId: string;
} | {
    id?: string;
    type: "mutate_queued_message";
    activeSessionId: string;
    lane: QueuedMessageLane;
    index: number;
    expectedText: string;
    mutation: QueuedMessageMutation;
} | {
    id?: string;
    type: "clear_queue";
    activeSessionId: string;
} | {
    id?: string;
    type: "abort_and_clear_queue";
    activeSessionId: string;
} | {
    id?: string;
    type: "cron_list";
    activeSessionId?: string;
    includeInactive?: boolean;
} | {
    id?: string;
    type: "heartbeats_list";
    activeSessionId?: string;
} | {
    id?: string;
    type: "heartbeat_manage";
    activeSessionId: string;
    jobId: string;
    action: AgentHeartbeatManagementAction;
} | {
    id?: string;
    type: "cron_add";
    activeSessionId: string;
    schedule: string;
    prompt: string;
    promoteOwnedSession?: boolean;
} | {
    id?: string;
    type: "cron_cancel";
    activeSessionId?: string;
    jobId: string;
} | {
    id?: string;
    type: "heartbeat_get";
    activeSessionId: string;
} | {
    id?: string;
    type: "heartbeat_set";
    activeSessionId: string;
    schedule: string;
    prompt: string;
    deliveryMode?: AgentHeartbeatDeliveryMode;
    promoteOwnedSession?: boolean;
} | {
    id?: string;
    type: "heartbeat_update";
    activeSessionId: string;
    action: AgentHeartbeatUpdateAction;
} | {
    id?: string;
    type: "set_model";
    activeSessionId: string;
    provider: string;
    modelId: string;
} | {
    id?: string;
    type: "cycle_model";
    activeSessionId: string;
    direction?: "forward" | "backward";
} | {
    id?: string;
    type: "set_scoped_models";
    activeSessionId: string;
    scopedModels: AgentConnectionScopedModel[];
} | {
    id?: string;
    type: "set_thinking_level";
    activeSessionId: string;
    level: ThinkingLevel;
} | {
    id?: string;
    type: "set_service_tier";
    activeSessionId: string;
    serviceTier: ServiceTier;
} | {
    id?: string;
    type: "cycle_thinking_level";
    activeSessionId: string;
} | {
    id?: string;
    type: "set_transport";
    activeSessionId: string;
    transport: Transport;
} | {
    id?: string;
    type: "set_steering_mode";
    activeSessionId: string;
    mode: AgentConnectionQueueMode;
} | {
    id?: string;
    type: "set_follow_up_mode";
    activeSessionId: string;
    mode: AgentConnectionQueueMode;
} | {
    id?: string;
    type: "set_auto_compaction";
    activeSessionId: string;
    enabled: boolean;
} | {
    id?: string;
    type: "set_auto_retry";
    activeSessionId: string;
    enabled: boolean;
} | {
    id?: string;
    type: "compact";
    activeSessionId: string;
    customInstructions?: string;
} | {
    id?: string;
    type: "refine";
    activeSessionId: string;
    instructions?: string;
    rollbackId?: string;
    global?: boolean;
} | {
    id?: string;
    type: "abort_compaction";
    activeSessionId: string;
} | {
    id?: string;
    type: "abort_branch_summary";
    activeSessionId: string;
} | {
    id?: string;
    type: "abort_retry";
    activeSessionId: string;
} | {
    id?: string;
    type: "execute_bash_and_wait";
    activeSessionId: string;
    command: string;
} | {
    id?: string;
    type: "reload";
    activeSessionId: string;
} | {
    id?: string;
    type: "new_session";
    activeSessionId: string;
    parentSession?: string;
} | {
    id?: string;
    type: "switch_session";
    activeSessionId: string;
    sessionPath: string;
    cwdOverride?: string;
} | {
    id?: string;
    type: "fork";
    activeSessionId: string;
    entryId: string;
    position?: "before" | "at";
} | {
    id?: string;
    type: "navigate_tree";
    activeSessionId: string;
    targetId: string;
    summarize?: boolean;
    customInstructions?: string;
    replaceInstructions?: boolean;
    label?: string;
} | {
    id?: string;
    type: "import_jsonl";
    activeSessionId: string;
    inputPath: string;
    cwdOverride?: string;
} | {
    id?: string;
    type: "export_html";
    activeSessionId: string;
    outputPath?: string;
} | {
    id?: string;
    type: "export_jsonl";
    activeSessionId: string;
    outputPath?: string;
} | {
    id?: string;
    type: "set_session_name";
    activeSessionId: string;
    name: string;
    workerToken?: string;
} | {
    id?: string;
    type: "get_rlm_max_depth_status";
    activeSessionId: string;
} | {
    id?: string;
    type: "set_rlm_max_depth";
    activeSessionId: string;
    maxDepth: number;
    global?: boolean;
} | {
    id?: string;
    type: "rename_saved_session";
    activeSessionId?: string;
    sessionPath: string;
    name: string;
} | {
    id?: string;
    type: "delete_saved_session";
    activeSessionId?: string;
    sessionPath: string;
} | {
    id?: string;
    type: "get_session_context";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_session_tree";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_user_messages_for_forking";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_last_assistant_text";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_system_prompt";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_tool_definition";
    activeSessionId: string;
    name: string;
} | {
    id?: string;
    type: "set_session_entry_label";
    activeSessionId: string;
    entryId: string;
    label?: string;
} | {
    id?: string;
    type: "extension_ui_response";
    activeSessionId: string;
    requestId: string;
    response: DaemonExtensionUIResponse;
} | {
    id?: string;
    type: "ack_result";
    commandId: string;
} | {
    id?: string;
    type: "prepare_update_restart";
} | {
    id?: string;
    type: "retry_worker";
    activeSessionId: string;
} | {
    id?: string;
    type: "restart";
} | {
    id?: string;
    type: "shutdown";
    force?: boolean;
};
type DaemonCommandName = DaemonCommand["type"];
export interface DaemonCommandCompatibility {
    minProtocol: number;
    minSchemaRevision?: number;
    capability?: DaemonServerCapability;
}
export declare const DAEMON_COMMAND_COMPATIBILITY: {
    readonly ack_result: {
        readonly minProtocol: 7;
    };
    readonly list: {
        readonly minProtocol: 7;
    };
    readonly list_saved_sessions: {
        readonly minProtocol: 7;
    };
    readonly create: {
        readonly minProtocol: 7;
    };
    readonly attach: {
        readonly minProtocol: 7;
    };
    readonly reattach: {
        readonly minProtocol: 7;
    };
    readonly detach: {
        readonly minProtocol: 7;
    };
    readonly complete_owned_session: {
        readonly minProtocol: 7;
        readonly capability: "client_owned_sessions";
    };
    readonly promote_owned_session: {
        readonly minProtocol: 7;
        readonly capability: "client_owned_sessions";
    };
    readonly kill: {
        readonly minProtocol: 7;
    };
    readonly rename: {
        readonly minProtocol: 7;
    };
    readonly prompt: {
        readonly minProtocol: 7;
        readonly capability: "session_input_admission";
    };
    readonly cancel_prompt_admission: {
        readonly minProtocol: 7;
        readonly minSchemaRevision: 8;
        readonly capability: "prompt_admission_cancellation";
    };
    readonly prompt_and_wait: {
        readonly minProtocol: 7;
        readonly capability: "session_input_admission";
    };
    readonly steer: {
        readonly minProtocol: 7;
        readonly capability: "session_input_admission";
    };
    readonly follow_up: {
        readonly minProtocol: 7;
        readonly capability: "session_input_admission";
    };
    readonly restore_next_turn: {
        readonly minProtocol: 7;
    };
    readonly restore_actions: {
        readonly minProtocol: 7;
    };
    readonly append_custom_message: {
        readonly minProtocol: 7;
    };
    readonly resume_queue: {
        readonly minProtocol: 7;
        readonly capability: "session_input_admission";
    };
    readonly send_message: {
        readonly minProtocol: 7;
    };
    readonly agent_messages_status: {
        readonly minProtocol: 7;
    };
    readonly agent_messages_pause: {
        readonly minProtocol: 7;
    };
    readonly agent_messages_resume: {
        readonly minProtocol: 7;
    };
    readonly agent_messages_clear: {
        readonly minProtocol: 7;
    };
    readonly abort: {
        readonly minProtocol: 7;
    };
    readonly start_side_question: {
        readonly minProtocol: 7;
    };
    readonly abort_side_question: {
        readonly minProtocol: 7;
    };
    readonly execute_bash: {
        readonly minProtocol: 7;
    };
    readonly abort_bash: {
        readonly minProtocol: 7;
    };
    readonly cancel_rlm_child: {
        readonly minProtocol: 7;
    };
    readonly delete_rlm_subagent: {
        readonly minProtocol: 7;
        readonly capability: "delete_rlm_subagent";
    };
    readonly wait_for_idle: {
        readonly minProtocol: 7;
    };
    readonly wait_for_headless_completion: {
        readonly minProtocol: 7;
    };
    readonly get_session_header: {
        readonly minProtocol: 7;
    };
    readonly get_state: {
        readonly minProtocol: 7;
    };
    readonly get_connection_state: {
        readonly minProtocol: 7;
    };
    readonly get_messages: {
        readonly minProtocol: 7;
    };
    readonly get_session_stats: {
        readonly minProtocol: 7;
    };
    readonly get_context_tree: {
        readonly minProtocol: 7;
    };
    readonly get_commands: {
        readonly minProtocol: 7;
    };
    readonly get_resource_snapshot: {
        readonly minProtocol: 7;
    };
    readonly get_model_catalog: {
        readonly minProtocol: 7;
        readonly capability: "model_catalog";
    };
    readonly get_available_models: {
        readonly minProtocol: 7;
    };
    readonly get_queue: {
        readonly minProtocol: 7;
    };
    readonly mutate_queued_message: {
        readonly minProtocol: 7;
        readonly minSchemaRevision: 15;
        readonly capability: "queue_message_mutation";
    };
    readonly clear_queue: {
        readonly minProtocol: 7;
    };
    readonly abort_and_clear_queue: {
        readonly minProtocol: 7;
    };
    readonly cron_list: {
        readonly minProtocol: 7;
    };
    readonly heartbeats_list: {
        readonly minProtocol: 7;
        readonly capability: "heartbeat_catalog";
    };
    readonly heartbeat_manage: {
        readonly minProtocol: 7;
        readonly capability: "heartbeat_management";
    };
    readonly cron_add: {
        readonly minProtocol: 7;
    };
    readonly cron_cancel: {
        readonly minProtocol: 7;
    };
    readonly heartbeat_get: {
        readonly minProtocol: 7;
    };
    readonly heartbeat_set: {
        readonly minProtocol: 7;
    };
    readonly heartbeat_update: {
        readonly minProtocol: 7;
    };
    readonly set_model: {
        readonly minProtocol: 7;
    };
    readonly cycle_model: {
        readonly minProtocol: 7;
    };
    readonly set_scoped_models: {
        readonly minProtocol: 7;
    };
    readonly set_thinking_level: {
        readonly minProtocol: 7;
    };
    readonly set_service_tier: {
        readonly minProtocol: 7;
    };
    readonly cycle_thinking_level: {
        readonly minProtocol: 7;
    };
    readonly set_transport: {
        readonly minProtocol: 7;
    };
    readonly set_steering_mode: {
        readonly minProtocol: 7;
    };
    readonly set_follow_up_mode: {
        readonly minProtocol: 7;
    };
    readonly set_auto_compaction: {
        readonly minProtocol: 7;
    };
    readonly set_auto_retry: {
        readonly minProtocol: 7;
    };
    readonly compact: {
        readonly minProtocol: 7;
    };
    readonly refine: {
        readonly minProtocol: 7;
    };
    readonly abort_compaction: {
        readonly minProtocol: 7;
    };
    readonly abort_branch_summary: {
        readonly minProtocol: 7;
    };
    readonly abort_retry: {
        readonly minProtocol: 7;
    };
    readonly execute_bash_and_wait: {
        readonly minProtocol: 7;
    };
    readonly reload: {
        readonly minProtocol: 7;
    };
    readonly new_session: {
        readonly minProtocol: 7;
    };
    readonly switch_session: {
        readonly minProtocol: 7;
    };
    readonly fork: {
        readonly minProtocol: 7;
    };
    readonly navigate_tree: {
        readonly minProtocol: 7;
    };
    readonly import_jsonl: {
        readonly minProtocol: 7;
    };
    readonly export_html: {
        readonly minProtocol: 7;
    };
    readonly export_jsonl: {
        readonly minProtocol: 7;
    };
    readonly set_session_name: {
        readonly minProtocol: 7;
    };
    readonly get_rlm_max_depth_status: {
        readonly minProtocol: 7;
        readonly minSchemaRevision: 11;
    };
    readonly set_rlm_max_depth: {
        readonly minProtocol: 7;
        readonly minSchemaRevision: 11;
    };
    readonly rename_saved_session: {
        readonly minProtocol: 7;
    };
    readonly delete_saved_session: {
        readonly minProtocol: 7;
    };
    readonly get_session_context: {
        readonly minProtocol: 7;
    };
    readonly get_session_tree: {
        readonly minProtocol: 7;
    };
    readonly get_user_messages_for_forking: {
        readonly minProtocol: 7;
    };
    readonly get_last_assistant_text: {
        readonly minProtocol: 7;
    };
    readonly get_system_prompt: {
        readonly minProtocol: 7;
    };
    readonly get_tool_definition: {
        readonly minProtocol: 7;
    };
    readonly set_session_entry_label: {
        readonly minProtocol: 7;
    };
    readonly extension_ui_response: {
        readonly minProtocol: 7;
    };
    readonly prepare_update_restart: {
        readonly minProtocol: 7;
    };
    readonly retry_worker: {
        readonly minProtocol: 7;
    };
    readonly restart: {
        readonly minProtocol: 7;
    };
    readonly shutdown: {
        readonly minProtocol: 7;
    };
};
export declare function getDaemonCommandCompatibilities(command: DaemonCommand): readonly DaemonCommandCompatibility[];
export type DaemonResponse = {
    id?: string;
    type: "response";
    command: string;
    success: true;
    data?: unknown;
} | {
    id?: string;
    type: "response";
    command: string;
    success: false;
    error: string;
    errorInfo?: DaemonErrorInfo;
};
export type DaemonErrorInfo = {
    code: "missing_session_cwd";
    issue: SessionCwdIssue;
} | {
    code: "session_import_file_not_found";
    filePath: string;
} | {
    code: "session_already_active";
    sessionPath: string;
    activeSessionId?: string;
} | {
    code: "command_result_uncertain";
    clientId: DaemonClientId;
    commandId: DaemonCommandId;
};
export type DaemonSessionClosedReason = "killed" | "shutdown" | "completed" | "replaced" | "update";
export type DaemonClosingReason = "shutdown" | "update";
export type DaemonExtensionUIResponse = {
    value: string;
} | {
    confirmed: boolean;
} | {
    cancelled: true;
};
export declare function isDaemonDialogExtensionUiRequest(method: string): boolean;
/**
 * True when a daemon rejected a command it does not know, i.e. the daemon
 * process was started from a build that predates the command.
 */
export declare function isUnknownDaemonCommandError(error: unknown, command: DaemonCommand["type"]): boolean;
export type DaemonRequestProgress = {
    id?: string;
    type: "session_list_progress";
    command: "list_saved_sessions";
    activeSessionId?: string;
    loaded: number;
    total: number;
} | {
    id?: string;
    type: "session_list_item";
    command: "list_saved_sessions";
    activeSessionId?: string;
    session: DaemonSavedSessionInfo;
};
export interface DaemonSavedSessionInfo {
    path: string;
    id: string;
    cwd: string;
    name?: string;
    state?: AgentConnectionSavedSessionState;
    parentSessionPath?: string;
    rlmDepth?: number;
    created: string;
    modified: string;
    messageCount: number;
    firstMessage: string;
    allMessagesText: string;
    agentStatus?: AgentConnectionAgentStatus;
}
export type DaemonDeleteSavedSessionResult = DeleteSessionFileResult;
export type DaemonAutonomousStatus = AgentAutonomousStatus;
export type DaemonBashResult = BashResult;
export type DaemonSessionHeader = AgentConnectionSessionHeader;
export type DaemonResourceSnapshot = AgentConnectionResourceSnapshot;
export type DaemonCronJob = AgentCronJob;
export type DaemonHeartbeat = AgentConnectionHeartbeat;
export type DaemonAgentSessionMessageReceipt = AgentSessionMessageReceipt;
export type DaemonAgentSessionMessageSafetyStatus = AgentSessionMessageSafetyStatus;
export type DaemonOutbound = DaemonResponse | DaemonRequestProgress | {
    type: "daemon_hello";
    socketPath: string;
    protocol: DaemonProtocolInfo;
    schemaId?: string;
    /** Monotonic wire-schema revision for field-sensitive compatibility checks. */
    schemaRevision?: number;
    /** App version of the daemon process, used to detect stale daemons after self-update. */
    appVersion?: string;
    runtime?: DaemonRuntimeIdentity;
    /** Changes whenever the public supervisor process is replaced. */
    supervisorGeneration?: string;
    /** Diagnostic process identity for attributing supervisor replacement. */
    supervisorPid?: number;
    /** Durable owner marker for validating update handoff fences. */
    supervisorOwnerToken?: string;
    /** Process start identity captured when the durable owner was published. */
    supervisorProcessStartId?: string;
    /** Normalized socket identity stored in the durable owner record. */
    supervisorSocketPath?: string;
    clientId: DaemonClientId;
    serverCapabilities: readonly DaemonServerCapability[];
} | {
    type: "daemon_closing";
    reason: DaemonClosingReason;
} | {
    type: "heartbeats_changed";
} | {
    type: "session_event";
    activeSessionId: string;
    event: AgentConnectionSessionEvent;
    meta?: DaemonEventMeta;
} | {
    type: "side_question_event";
    activeSessionId: string;
    event: AgentConnectionSideQuestionEvent;
} | {
    type: "session_status";
    activeSessionId: string;
    recap?: string;
    meta?: DaemonEventMeta;
} | {
    type: "session_replaced";
    activeSessionId: string;
    state: AgentConnectionState;
    messages: AgentMessage[];
    snapshotFollows?: boolean;
    meta?: DaemonEventMeta;
} | {
    type: "session_resynced";
    activeSessionId: string;
    snapshot: DaemonSessionSnapshot;
    meta?: DaemonEventMeta;
} | {
    type: "session_attached";
    activeSessionId: string;
    state: SessionSummary;
    messages: AgentMessage[];
    snapshot?: DaemonSessionSnapshot;
    replay?: DaemonReplayInfo;
    lastEventSequence?: DaemonEventSequence;
} | {
    type: "session_snapshot_begin";
    activeSessionId: string;
    snapshotId: string;
    snapshot: Omit<DaemonSessionSnapshot, "messages">;
    messageCount: number;
    targetChunkBytes: number;
    purpose?: "attach" | "replacement" | "resync";
} | {
    type: "session_snapshot_chunk";
    activeSessionId: string;
    snapshotId: string;
    index: number;
    messages: AgentMessage[];
} | {
    type: "session_snapshot_end";
    activeSessionId: string;
    snapshotId: string;
    chunkCount: number;
    lastEventSequence: DaemonEventSequence;
    lastEventCursor?: DaemonEventCursor;
} | {
    type: "session_snapshot_failed";
    activeSessionId: string;
    snapshotId: string;
    error: string;
} | {
    type: "session_detached";
    activeSessionId: string;
} | {
    type: "session_closed";
    activeSessionId: string;
    reason: DaemonSessionClosedReason;
    meta?: DaemonEventMeta;
} | {
    type: "extension_ui_request";
    activeSessionId: string;
    id: string;
    method: string;
    payload: Record<string, unknown>;
    meta?: DaemonEventMeta;
} | {
    type: "extension_error";
    activeSessionId: string;
    extensionPath: string;
    event: string;
    error: string;
    meta?: DaemonEventMeta;
};
export declare const DAEMON_OUTBOUND_COMPATIBILITY: {
    readonly response: {
        readonly minProtocol: 7;
    };
    readonly session_list_progress: {
        readonly minProtocol: 7;
    };
    readonly session_list_item: {
        readonly minProtocol: 7;
    };
    readonly daemon_hello: {
        readonly minProtocol: 7;
    };
    readonly daemon_closing: {
        readonly minProtocol: 7;
    };
    readonly heartbeats_changed: {
        readonly minProtocol: 7;
        readonly capability: "heartbeat_catalog";
    };
    readonly session_event: {
        readonly minProtocol: 7;
    };
    readonly side_question_event: {
        readonly minProtocol: 7;
    };
    readonly session_status: {
        readonly minProtocol: 7;
    };
    readonly session_replaced: {
        readonly minProtocol: 7;
    };
    readonly session_resynced: {
        readonly minProtocol: 7;
    };
    readonly session_attached: {
        readonly minProtocol: 7;
    };
    readonly session_snapshot_begin: {
        readonly minProtocol: 7;
    };
    readonly session_snapshot_chunk: {
        readonly minProtocol: 7;
    };
    readonly session_snapshot_end: {
        readonly minProtocol: 7;
    };
    readonly session_snapshot_failed: {
        readonly minProtocol: 7;
    };
    readonly session_detached: {
        readonly minProtocol: 7;
    };
    readonly session_closed: {
        readonly minProtocol: 7;
    };
    readonly extension_ui_request: {
        readonly minProtocol: 7;
    };
    readonly extension_error: {
        readonly minProtocol: 7;
    };
};
export declare function createDaemonCommandEnvelope<TCommand extends DaemonCommand>(command: TCommand, id: DaemonCommandId, clientId?: DaemonClientId, protocolVersion?: DaemonProtocolVersion): DaemonCommandEnvelope<TCommand>;
export declare function isDaemonCommandEnvelope(value: unknown): value is DaemonCommandEnvelope;
/**
 * Best-effort id salvage for rejected command lines, so parse failures reach
 * the sender as correlatable responses instead of client-side timeouts.
 * Deliberately ignores everything but the id itself: whatever made the line
 * unparseable (rejected protocol version, missing or invalid type), the
 * sender still correlates the failure by id.
 */
export declare function salvageDaemonCommandId(line: string): string | undefined;
export declare function isDaemonMutatingCommand(command: Pick<DaemonCommand, "type">): boolean;
export declare const UPDATE_RESTART_DRAIN_COMMANDS: ReadonlySet<DaemonCommand["type"]>;
export declare function createDaemonEventEnvelope<TEvent extends DaemonOutbound>(event: TEvent, meta: DaemonEventMeta): DaemonEventEnvelope<TEvent>;
export declare function createDaemonEventMeta(activeSessionId: string, sequence: DaemonEventSequence, emittedAt?: string, generation?: string): DaemonEventMeta;
export declare function createDaemonReplayInfo(resumeCursor: DaemonResumeCursor | undefined, lastEventSequence: DaemonEventSequence, generation?: string): DaemonReplayInfo;
export declare function success(id: string | undefined, command: DaemonCommandName, data?: unknown): DaemonResponse;
export declare function failure(id: string | undefined, command: string, error: unknown, errorInfo?: DaemonErrorInfo): DaemonResponse;
export {};
//# sourceMappingURL=daemon-protocol.d.ts.map
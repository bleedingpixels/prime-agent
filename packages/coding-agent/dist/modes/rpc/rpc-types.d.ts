/**
 * RPC protocol types for headless operation.
 *
 * Commands are sent as JSON lines on stdin.
 * Responses and events are emitted as JSON lines on stdout.
 */
import type { AgentEvent, AgentMessage, ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { ImageContent, Model } from "@earendil-works/pi-ai";
import type { AgentSessionMessageReceipt, AgentSessionMessageSafetyStatus } from "../../core/agent-messages.js";
import type { BashResult } from "../../core/bash-executor.js";
import type { CompactionResult } from "../../core/compaction/index.js";
import type { AgentCronJob, AgentHeartbeatDeliveryMode, AgentHeartbeatManagementAction, AgentHeartbeatUpdateAction } from "../../core/cron-jobs.js";
import type { GoalState } from "../../core/goals.js";
import type { RefinementResult } from "../../core/refinement/index.js";
import type { SessionActionSnapshot } from "../../core/session-action-store.js";
import type { SessionStats } from "../../core/session-stats.js";
import type { AgentConnectionHeartbeat, AgentConnectionSourceInfo } from "../agent-connection/types.js";
export type RpcCommand = {
    id?: string;
    type: "prompt";
    message: string;
    images?: ImageContent[];
    streamingBehavior?: "steer" | "followUp";
} | {
    id?: string;
    type: "steer";
    message: string;
    images?: ImageContent[];
} | {
    id?: string;
    type: "follow_up";
    message: string;
    images?: ImageContent[];
} | {
    id?: string;
    type: "abort";
} | {
    id?: string;
    type: "new_session";
    parentSession?: string;
} | {
    id?: string;
    type: "get_state";
} | {
    id?: string;
    type: "set_model";
    provider: string;
    modelId: string;
} | {
    id?: string;
    type: "cycle_model";
} | {
    id?: string;
    type: "get_available_models";
} | {
    id?: string;
    type: "set_thinking_level";
    level: ThinkingLevel;
} | {
    id?: string;
    type: "cycle_thinking_level";
} | {
    id?: string;
    type: "set_steering_mode";
    mode: "all" | "one-at-a-time";
} | {
    id?: string;
    type: "set_follow_up_mode";
    mode: "all" | "one-at-a-time";
} | {
    id?: string;
    type: "compact";
    customInstructions?: string;
} | {
    id?: string;
    type: "refine";
    instructions?: string;
    rollbackId?: string;
    global?: boolean;
} | {
    id?: string;
    type: "set_auto_compaction";
    enabled: boolean;
} | {
    id?: string;
    type: "set_auto_retry";
    enabled: boolean;
} | {
    id?: string;
    type: "abort_retry";
} | {
    id?: string;
    type: "bash";
    command: string;
} | {
    id?: string;
    type: "abort_bash";
} | {
    id?: string;
    type: "get_session_stats";
} | {
    id?: string;
    type: "export_html";
    outputPath?: string;
} | {
    id?: string;
    type: "switch_session";
    sessionPath: string;
} | {
    id?: string;
    type: "fork";
    entryId: string;
} | {
    id?: string;
    type: "clone";
} | {
    id?: string;
    type: "get_fork_messages";
} | {
    id?: string;
    type: "get_last_assistant_text";
} | {
    id?: string;
    type: "set_session_name";
    name: string;
} | {
    id?: string;
    type: "get_messages";
} | {
    id?: string;
    type: "send_message";
    targetActiveSessionId: string;
    message: string;
} | {
    id?: string;
    type: "agent_messages_status";
} | {
    id?: string;
    type: "agent_messages_pause";
} | {
    id?: string;
    type: "agent_messages_resume";
} | {
    id?: string;
    type: "agent_messages_clear";
} | {
    id?: string;
    type: "list_schedules";
    includeInactive?: boolean;
} | {
    id?: string;
    type: "add_schedule";
    schedule: string;
    prompt: string;
} | {
    id?: string;
    type: "cancel_schedule";
    jobId: string;
} | {
    id?: string;
    type: "list_heartbeats";
} | {
    id?: string;
    type: "get_heartbeat";
} | {
    id?: string;
    type: "set_heartbeat";
    schedule: string;
    prompt: string;
    deliveryMode?: AgentHeartbeatDeliveryMode;
} | {
    id?: string;
    type: "update_heartbeat";
    action: AgentHeartbeatUpdateAction;
} | {
    id?: string;
    type: "manage_heartbeat";
    activeSessionId: string;
    jobId: string;
    action: AgentHeartbeatManagementAction;
} | {
    id?: string;
    type: "observe";
    activeSessionId: string;
} | {
    id?: string;
    type: "unobserve";
    activeSessionId: string;
} | {
    id?: string;
    type: "get_commands";
};
/** A command available for invocation via prompt */
export interface RpcSlashCommand {
    /** Command name (without leading slash) */
    name: string;
    /** Human-readable description */
    description?: string;
    /** What kind of command this is */
    source: "extension" | "prompt" | "skill";
    /** Source metadata for the owning resource */
    sourceInfo: AgentConnectionSourceInfo;
}
export interface RpcSessionState {
    model?: Model<any>;
    thinkingLevel: ThinkingLevel;
    isStreaming: boolean;
    isCompacting: boolean;
    steeringMode: "all" | "one-at-a-time";
    followUpMode: "all" | "one-at-a-time";
    sessionFile?: string;
    sessionId: string;
    sessionName?: string;
    autoCompactionEnabled: boolean;
    messageCount: number;
    sessionActions: SessionActionSnapshot;
    goal: GoalState;
}
export type RpcResponse = {
    id?: string;
    type: "response";
    command: "prompt";
    success: true;
} | {
    id?: string;
    type: "response";
    command: "steer";
    success: true;
} | {
    id?: string;
    type: "response";
    command: "follow_up";
    success: true;
} | {
    id?: string;
    type: "response";
    command: "abort";
    success: true;
} | {
    id?: string;
    type: "response";
    command: "new_session";
    success: true;
    data: {
        cancelled: boolean;
    };
} | {
    id?: string;
    type: "response";
    command: "get_state";
    success: true;
    data: RpcSessionState;
} | {
    id?: string;
    type: "response";
    command: "set_model";
    success: true;
    data: Model<any>;
} | {
    id?: string;
    type: "response";
    command: "cycle_model";
    success: true;
    data: {
        model: Model<any>;
        thinkingLevel: ThinkingLevel;
        isScoped: boolean;
    } | null;
} | {
    id?: string;
    type: "response";
    command: "get_available_models";
    success: true;
    data: {
        models: Model<any>[];
    };
} | {
    id?: string;
    type: "response";
    command: "set_thinking_level";
    success: true;
} | {
    id?: string;
    type: "response";
    command: "cycle_thinking_level";
    success: true;
    data: {
        level: ThinkingLevel;
    } | null;
} | {
    id?: string;
    type: "response";
    command: "set_steering_mode";
    success: true;
} | {
    id?: string;
    type: "response";
    command: "set_follow_up_mode";
    success: true;
} | {
    id?: string;
    type: "response";
    command: "compact";
    success: true;
    data: CompactionResult;
} | {
    id?: string;
    type: "response";
    command: "refine";
    success: true;
    data: RefinementResult;
} | {
    id?: string;
    type: "response";
    command: "set_auto_compaction";
    success: true;
} | {
    id?: string;
    type: "response";
    command: "set_auto_retry";
    success: true;
} | {
    id?: string;
    type: "response";
    command: "abort_retry";
    success: true;
} | {
    id?: string;
    type: "response";
    command: "bash";
    success: true;
    data: BashResult;
} | {
    id?: string;
    type: "response";
    command: "abort_bash";
    success: true;
} | {
    id?: string;
    type: "response";
    command: "get_session_stats";
    success: true;
    data: SessionStats;
} | {
    id?: string;
    type: "response";
    command: "export_html";
    success: true;
    data: {
        path: string;
    };
} | {
    id?: string;
    type: "response";
    command: "switch_session";
    success: true;
    data: {
        cancelled: boolean;
    };
} | {
    id?: string;
    type: "response";
    command: "fork";
    success: true;
    data: {
        text: string;
        cancelled: boolean;
    };
} | {
    id?: string;
    type: "response";
    command: "clone";
    success: true;
    data: {
        cancelled: boolean;
    };
} | {
    id?: string;
    type: "response";
    command: "get_fork_messages";
    success: true;
    data: {
        messages: Array<{
            entryId: string;
            text: string;
        }>;
    };
} | {
    id?: string;
    type: "response";
    command: "get_last_assistant_text";
    success: true;
    data: {
        text: string | null;
    };
} | {
    id?: string;
    type: "response";
    command: "set_session_name";
    success: true;
} | {
    id?: string;
    type: "response";
    command: "get_messages";
    success: true;
    data: {
        messages: AgentMessage[];
    };
} | {
    id?: string;
    type: "response";
    command: "send_message";
    success: true;
    data: AgentSessionMessageReceipt;
} | {
    id?: string;
    type: "response";
    command: "agent_messages_status" | "agent_messages_pause" | "agent_messages_resume";
    success: true;
    data: AgentSessionMessageSafetyStatus;
} | {
    id?: string;
    type: "response";
    command: "agent_messages_clear";
    success: true;
    data: {
        cleared: number;
    };
} | {
    id?: string;
    type: "response";
    command: "list_schedules";
    success: true;
    data: {
        jobs: AgentCronJob[];
    };
} | {
    id?: string;
    type: "response";
    command: "add_schedule";
    success: true;
    data: {
        job: AgentCronJob;
    };
} | {
    id?: string;
    type: "response";
    command: "cancel_schedule";
    success: true;
    data: {
        job: AgentCronJob;
    };
} | {
    id?: string;
    type: "response";
    command: "list_heartbeats";
    success: true;
    data: {
        heartbeats: AgentConnectionHeartbeat[];
    };
} | {
    id?: string;
    type: "response";
    command: "get_heartbeat";
    success: true;
    data: {
        heartbeat: AgentCronJob | null;
    };
} | {
    id?: string;
    type: "response";
    command: "set_heartbeat" | "update_heartbeat" | "manage_heartbeat";
    success: true;
    data: {
        heartbeat: AgentCronJob | null;
    };
} | {
    id?: string;
    type: "response";
    command: "observe";
    success: true;
    data: {
        messages: AgentMessage[];
    };
} | {
    id?: string;
    type: "response";
    command: "unobserve";
    success: true;
} | {
    id?: string;
    type: "response";
    command: "get_commands";
    success: true;
    data: {
        commands: RpcSlashCommand[];
    };
} | {
    id?: string;
    type: "response";
    command: string;
    success: false;
    error: string;
};
/** Emitted when an extension needs user input */
export type RpcExtensionUIRequest = {
    type: "extension_ui_request";
    id: string;
    method: "select";
    title: string;
    options: string[];
    timeout?: number;
} | {
    type: "extension_ui_request";
    id: string;
    method: "confirm";
    title: string;
    message: string;
    timeout?: number;
} | {
    type: "extension_ui_request";
    id: string;
    method: "input";
    title: string;
    placeholder?: string;
    timeout?: number;
} | {
    type: "extension_ui_request";
    id: string;
    method: "editor";
    title: string;
    prefill?: string;
} | {
    type: "extension_ui_request";
    id: string;
    method: "notify";
    message: string;
    notifyType?: "info" | "warning" | "error";
} | {
    type: "extension_ui_request";
    id: string;
    method: "setStatus";
    statusKey: string;
    statusText: string | undefined;
} | {
    type: "extension_ui_request";
    id: string;
    method: "setWidget";
    widgetKey: string;
    widgetLines: string[] | undefined;
    widgetPlacement?: "aboveEditor" | "belowEditor";
} | {
    type: "extension_ui_request";
    id: string;
    method: "setTitle";
    title: string;
} | {
    type: "extension_ui_request";
    id: string;
    method: "set_editor_text";
    text: string;
};
/** Response to an extension UI request */
export type RpcExtensionUIResponse = {
    type: "extension_ui_response";
    id: string;
    value: string;
} | {
    type: "extension_ui_response";
    id: string;
    confirmed: boolean;
} | {
    type: "extension_ui_response";
    id: string;
    cancelled: true;
};
export type RpcCommandType = RpcCommand["type"];
export type RpcObservedSessionEvent = {
    type: "observed_session_event";
    activeSessionId: string;
    event: AgentEvent;
} | {
    type: "observed_session_closed";
    activeSessionId: string;
    error?: string;
};
//# sourceMappingURL=rpc-types.d.ts.map
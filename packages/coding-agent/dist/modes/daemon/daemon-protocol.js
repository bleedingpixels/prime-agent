/**
 * Local daemon JSONL protocol.
 *
 * This is the transport used by DaemonAgentConnection today, not the final
 * remote gateway protocol. The protocol primitives below are intentionally
 * JSON-serializable so a future gateway can wrap or proxy this local transport
 * without leaking transport details back into InteractiveMode.
 */
export const DAEMON_PROTOCOL_NAME = "prime-agent.daemon";
export const DAEMON_PROTOCOL_VERSION = 7;
export const DAEMON_COMMAND_ENVELOPE_MIN_PROTOCOL_VERSION = 7;
// Revision 9 publishes persisted RLM spawn depth on passive session rows.
// Revision 10 publishes persisted RLM spawn depth on all session catalog rows.
// Revision 11 adds immediate get/set commands for active-session RLM max depth.
// Revision 12 publishes idle-residency metadata on session summary rows.
// Revision 13 narrows agent-origin reach and roster wire shapes to the nuclear family.
// Revision 14 carries the client's monotonic telemetry opt-out on attach and reattach.
// Revision 15 adds the mutate_queued_message command and queue_message_mutation capability.
// Revision 16 adds the "stopping" workerState and stops reporting disconnected workers as "ready".
export const DAEMON_SCHEMA_REVISION = 16;
export const DAEMON_SCHEMA_ID = "protocol-7-schema-16-1bcb9e7f1a49";
export const DAEMON_PROTOCOL_INFO = {
    name: DAEMON_PROTOCOL_NAME,
    version: DAEMON_PROTOCOL_VERSION,
};
export const DAEMON_DEFAULT_CLIENT_CAPABILITIES = [
    "attach_snapshot",
    "event_sequence",
];
export const DAEMON_SUPPORTED_CLIENT_CAPABILITIES = [
    "attach_snapshot",
    "event_sequence",
    "extension_ui",
    "slim_attach",
    "chunked_snapshot",
    "client_owned_sessions",
];
export const DAEMON_DEFAULT_SERVER_CAPABILITIES = [
    ...DAEMON_SUPPORTED_CLIENT_CAPABILITIES,
    "delete_rlm_subagent",
    "heartbeat_catalog",
    "heartbeat_management",
    "model_catalog",
    "side_question_transcript",
    "transient_bash",
    "session_input_admission",
    "prompt_admission_cancellation",
    "queue_message_mutation",
];
/**
 * The allowlist of env vars a client may forward. One shared list because it
 * is the wire contract: clients filter before sending and the daemon
 * re-filters on receipt (the socket peer is untrusted).
 */
export const DAEMON_CLIENT_ENV_KEYS = [
    "HERDR_ENV",
    "HERDR_PANE_ID",
    "HERDR_SOCKET_PATH",
    "HERDR_TAB_ID",
    "HERDR_WORKSPACE_ID",
];
/** Collect the allowlisted env vars from the client process for the create command. */
export function collectDaemonClientEnv(source = process.env) {
    const env = {};
    for (const key of DAEMON_CLIENT_ENV_KEYS) {
        const value = source[key];
        if (value !== undefined) {
            env[key] = value;
        }
    }
    return Object.keys(env).length > 0 ? env : undefined;
}
export function collectDaemonLaunchEnv(source = process.env) {
    const env = {};
    for (const [key, value] of Object.entries(source)) {
        if (value !== undefined && !key.startsWith("PRIME_AGENT_INTERNAL_")) {
            env[key] = value;
        }
    }
    return env;
}
export const DAEMON_UPDATE_RESTART_FORMAT_VERSION = 1;
const LEGACY_DAEMON_COMMAND = { minProtocol: 7 };
const CURRENT_DAEMON_COMMAND = { minProtocol: 7 };
const RLM_MAX_DEPTH_COMMAND = { minProtocol: 7, minSchemaRevision: 11 };
const SESSION_INPUT_ADMISSION_COMMAND = {
    minProtocol: 7,
    capability: "session_input_admission",
};
const PROMPT_ADMISSION_CANCELLATION_COMMAND = {
    minProtocol: 7,
    minSchemaRevision: 8,
    capability: "prompt_admission_cancellation",
};
const CLIENT_OWNED_DAEMON_COMMAND = {
    minProtocol: 7,
    capability: "client_owned_sessions",
};
const DELETE_RLM_SUBAGENT_COMMAND = {
    minProtocol: 7,
    capability: "delete_rlm_subagent",
};
const FLAT_SESSION_TREE_COMMAND = { minProtocol: 7 };
const TELEMETRY_POLICY_COMMAND = { minProtocol: 7, minSchemaRevision: 14 };
export const DAEMON_COMMAND_COMPATIBILITY = {
    ack_result: LEGACY_DAEMON_COMMAND,
    list: LEGACY_DAEMON_COMMAND,
    list_saved_sessions: LEGACY_DAEMON_COMMAND,
    create: LEGACY_DAEMON_COMMAND,
    attach: LEGACY_DAEMON_COMMAND,
    reattach: LEGACY_DAEMON_COMMAND,
    detach: LEGACY_DAEMON_COMMAND,
    complete_owned_session: CLIENT_OWNED_DAEMON_COMMAND,
    promote_owned_session: CLIENT_OWNED_DAEMON_COMMAND,
    kill: LEGACY_DAEMON_COMMAND,
    rename: LEGACY_DAEMON_COMMAND,
    prompt: SESSION_INPUT_ADMISSION_COMMAND,
    cancel_prompt_admission: PROMPT_ADMISSION_CANCELLATION_COMMAND,
    prompt_and_wait: SESSION_INPUT_ADMISSION_COMMAND,
    steer: SESSION_INPUT_ADMISSION_COMMAND,
    follow_up: SESSION_INPUT_ADMISSION_COMMAND,
    restore_next_turn: LEGACY_DAEMON_COMMAND,
    restore_actions: LEGACY_DAEMON_COMMAND,
    append_custom_message: LEGACY_DAEMON_COMMAND,
    resume_queue: SESSION_INPUT_ADMISSION_COMMAND,
    send_message: LEGACY_DAEMON_COMMAND,
    agent_messages_status: LEGACY_DAEMON_COMMAND,
    agent_messages_pause: LEGACY_DAEMON_COMMAND,
    agent_messages_resume: LEGACY_DAEMON_COMMAND,
    agent_messages_clear: LEGACY_DAEMON_COMMAND,
    abort: LEGACY_DAEMON_COMMAND,
    start_side_question: LEGACY_DAEMON_COMMAND,
    abort_side_question: LEGACY_DAEMON_COMMAND,
    execute_bash: LEGACY_DAEMON_COMMAND,
    abort_bash: LEGACY_DAEMON_COMMAND,
    cancel_rlm_child: LEGACY_DAEMON_COMMAND,
    delete_rlm_subagent: DELETE_RLM_SUBAGENT_COMMAND,
    wait_for_idle: LEGACY_DAEMON_COMMAND,
    wait_for_headless_completion: CURRENT_DAEMON_COMMAND,
    get_session_header: CURRENT_DAEMON_COMMAND,
    get_state: LEGACY_DAEMON_COMMAND,
    get_connection_state: LEGACY_DAEMON_COMMAND,
    get_messages: LEGACY_DAEMON_COMMAND,
    get_session_stats: LEGACY_DAEMON_COMMAND,
    get_context_tree: LEGACY_DAEMON_COMMAND,
    get_commands: LEGACY_DAEMON_COMMAND,
    get_resource_snapshot: LEGACY_DAEMON_COMMAND,
    get_model_catalog: { minProtocol: 7, capability: "model_catalog" },
    get_available_models: LEGACY_DAEMON_COMMAND,
    get_queue: LEGACY_DAEMON_COMMAND,
    mutate_queued_message: { minProtocol: 7, minSchemaRevision: 15, capability: "queue_message_mutation" },
    clear_queue: LEGACY_DAEMON_COMMAND,
    abort_and_clear_queue: LEGACY_DAEMON_COMMAND,
    cron_list: LEGACY_DAEMON_COMMAND,
    heartbeats_list: { minProtocol: 7, capability: "heartbeat_catalog" },
    heartbeat_manage: { minProtocol: 7, capability: "heartbeat_management" },
    cron_add: LEGACY_DAEMON_COMMAND,
    cron_cancel: LEGACY_DAEMON_COMMAND,
    heartbeat_get: LEGACY_DAEMON_COMMAND,
    heartbeat_set: LEGACY_DAEMON_COMMAND,
    heartbeat_update: LEGACY_DAEMON_COMMAND,
    set_model: LEGACY_DAEMON_COMMAND,
    cycle_model: LEGACY_DAEMON_COMMAND,
    set_scoped_models: LEGACY_DAEMON_COMMAND,
    set_thinking_level: LEGACY_DAEMON_COMMAND,
    set_service_tier: LEGACY_DAEMON_COMMAND,
    cycle_thinking_level: LEGACY_DAEMON_COMMAND,
    set_transport: LEGACY_DAEMON_COMMAND,
    set_steering_mode: LEGACY_DAEMON_COMMAND,
    set_follow_up_mode: LEGACY_DAEMON_COMMAND,
    set_auto_compaction: LEGACY_DAEMON_COMMAND,
    set_auto_retry: CURRENT_DAEMON_COMMAND,
    compact: LEGACY_DAEMON_COMMAND,
    refine: LEGACY_DAEMON_COMMAND,
    abort_compaction: LEGACY_DAEMON_COMMAND,
    abort_branch_summary: LEGACY_DAEMON_COMMAND,
    abort_retry: LEGACY_DAEMON_COMMAND,
    execute_bash_and_wait: CURRENT_DAEMON_COMMAND,
    reload: LEGACY_DAEMON_COMMAND,
    new_session: LEGACY_DAEMON_COMMAND,
    switch_session: LEGACY_DAEMON_COMMAND,
    fork: LEGACY_DAEMON_COMMAND,
    navigate_tree: LEGACY_DAEMON_COMMAND,
    import_jsonl: LEGACY_DAEMON_COMMAND,
    export_html: LEGACY_DAEMON_COMMAND,
    export_jsonl: LEGACY_DAEMON_COMMAND,
    set_session_name: LEGACY_DAEMON_COMMAND,
    get_rlm_max_depth_status: RLM_MAX_DEPTH_COMMAND,
    set_rlm_max_depth: RLM_MAX_DEPTH_COMMAND,
    rename_saved_session: LEGACY_DAEMON_COMMAND,
    delete_saved_session: LEGACY_DAEMON_COMMAND,
    get_session_context: LEGACY_DAEMON_COMMAND,
    get_session_tree: FLAT_SESSION_TREE_COMMAND,
    get_user_messages_for_forking: LEGACY_DAEMON_COMMAND,
    get_last_assistant_text: LEGACY_DAEMON_COMMAND,
    get_system_prompt: LEGACY_DAEMON_COMMAND,
    get_tool_definition: LEGACY_DAEMON_COMMAND,
    set_session_entry_label: LEGACY_DAEMON_COMMAND,
    extension_ui_response: LEGACY_DAEMON_COMMAND,
    prepare_update_restart: LEGACY_DAEMON_COMMAND,
    retry_worker: LEGACY_DAEMON_COMMAND,
    restart: LEGACY_DAEMON_COMMAND,
    shutdown: LEGACY_DAEMON_COMMAND,
};
export function getDaemonCommandCompatibilities(command) {
    const compatibility = DAEMON_COMMAND_COMPATIBILITY[command.type];
    const carriesTelemetryPolicy = ((command.type === "attach" || command.type === "reattach") && command.telemetryDisabled !== undefined) ||
        (command.type === "create" && command.config?.telemetryDisabled !== undefined);
    if (carriesTelemetryPolicy) {
        return [TELEMETRY_POLICY_COMMAND, compatibility];
    }
    if ((command.type === "prompt" || command.type === "prompt_and_wait") && command.admissionId !== undefined) {
        return [PROMPT_ADMISSION_CANCELLATION_COMMAND, compatibility];
    }
    return [compatibility];
}
export function isDaemonDialogExtensionUiRequest(method) {
    return method === "select" || method === "confirm" || method === "input" || method === "editor";
}
/**
 * True when a daemon rejected a command it does not know, i.e. the daemon
 * process was started from a build that predates the command.
 */
export function isUnknownDaemonCommandError(error, command) {
    return error instanceof Error && error.message.includes(`Unknown daemon command: ${command}`);
}
export const DAEMON_OUTBOUND_COMPATIBILITY = {
    response: LEGACY_DAEMON_COMMAND,
    session_list_progress: LEGACY_DAEMON_COMMAND,
    session_list_item: LEGACY_DAEMON_COMMAND,
    daemon_hello: LEGACY_DAEMON_COMMAND,
    daemon_closing: LEGACY_DAEMON_COMMAND,
    heartbeats_changed: { minProtocol: 7, capability: "heartbeat_catalog" },
    session_event: LEGACY_DAEMON_COMMAND,
    side_question_event: LEGACY_DAEMON_COMMAND,
    session_status: LEGACY_DAEMON_COMMAND,
    session_replaced: LEGACY_DAEMON_COMMAND,
    session_resynced: LEGACY_DAEMON_COMMAND,
    session_attached: LEGACY_DAEMON_COMMAND,
    session_snapshot_begin: LEGACY_DAEMON_COMMAND,
    session_snapshot_chunk: LEGACY_DAEMON_COMMAND,
    session_snapshot_end: LEGACY_DAEMON_COMMAND,
    session_snapshot_failed: LEGACY_DAEMON_COMMAND,
    session_detached: LEGACY_DAEMON_COMMAND,
    session_closed: LEGACY_DAEMON_COMMAND,
    extension_ui_request: LEGACY_DAEMON_COMMAND,
    extension_error: LEGACY_DAEMON_COMMAND,
};
export function createDaemonCommandEnvelope(command, id, clientId, protocolVersion = DAEMON_PROTOCOL_VERSION) {
    return {
        type: "command",
        id,
        protocol: { name: DAEMON_PROTOCOL_NAME, version: protocolVersion },
        ...(clientId ? { clientId } : {}),
        command,
    };
}
export function isDaemonCommandEnvelope(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const candidate = value;
    return (candidate.type === "command" &&
        typeof candidate.id === "string" &&
        candidate.protocol?.name === DAEMON_PROTOCOL_NAME &&
        typeof candidate.protocol.version === "number" &&
        candidate.protocol.version >= DAEMON_COMMAND_ENVELOPE_MIN_PROTOCOL_VERSION &&
        candidate.protocol.version <= DAEMON_PROTOCOL_VERSION &&
        (candidate.clientId === undefined || typeof candidate.clientId === "string") &&
        typeof candidate.command === "object" &&
        candidate.command !== null);
}
/**
 * Best-effort id salvage for rejected command lines, so parse failures reach
 * the sender as correlatable responses instead of client-side timeouts.
 * Deliberately ignores everything but the id itself: whatever made the line
 * unparseable (rejected protocol version, missing or invalid type), the
 * sender still correlates the failure by id.
 */
export function salvageDaemonCommandId(line) {
    try {
        const candidate = JSON.parse(line);
        if (!candidate || typeof candidate !== "object") {
            return undefined;
        }
        return typeof candidate.id === "string" ? candidate.id : undefined;
    }
    catch {
        return undefined;
    }
}
const READ_ONLY_DAEMON_COMMANDS = new Set([
    "ack_result",
    "list",
    "list_saved_sessions",
    "attach",
    "reattach",
    "agent_messages_status",
    "wait_for_idle",
    "get_session_header",
    "get_state",
    "get_connection_state",
    "get_messages",
    "get_session_stats",
    "get_context_tree",
    "get_commands",
    "get_resource_snapshot",
    "get_model_catalog",
    "get_available_models",
    "get_queue",
    "cron_list",
    "heartbeats_list",
    "heartbeat_get",
    "get_session_context",
    "get_session_tree",
    "get_user_messages_for_forking",
    "get_last_assistant_text",
    "get_system_prompt",
    "get_rlm_max_depth_status",
    "get_tool_definition",
]);
export function isDaemonMutatingCommand(command) {
    return !READ_ONLY_DAEMON_COMMANDS.has(command.type);
}
export const UPDATE_RESTART_DRAIN_COMMANDS = new Set([
    "extension_ui_response",
    "abort",
    "abort_bash",
    "abort_branch_summary",
    "abort_compaction",
    "abort_retry",
]);
export function createDaemonEventEnvelope(event, meta) {
    return {
        type: "event",
        id: meta.id,
        protocol: meta.protocol,
        ...(meta.activeSessionId ? { activeSessionId: meta.activeSessionId } : {}),
        ...(meta.sequence !== undefined ? { sequence: meta.sequence } : {}),
        ...(meta.cursor ? { cursor: meta.cursor } : {}),
        emittedAt: meta.emittedAt,
        event,
    };
}
export function createDaemonEventMeta(activeSessionId, sequence, emittedAt = new Date().toISOString(), generation = activeSessionId) {
    return {
        id: `${activeSessionId}:${sequence}`,
        protocol: DAEMON_PROTOCOL_INFO,
        activeSessionId,
        sequence,
        cursor: { generation, sequence },
        emittedAt,
    };
}
export function createDaemonReplayInfo(resumeCursor, lastEventSequence, generation = "legacy") {
    const toCursor = { generation, sequence: lastEventSequence };
    if (!resumeCursor) {
        return {
            status: "complete",
            toSequence: lastEventSequence,
            toCursor,
        };
    }
    const resumeSequence = "sequence" in resumeCursor ? resumeCursor.sequence : resumeCursor.eventSequence;
    const fromCursor = "generation" in resumeCursor
        ? { generation: resumeCursor.generation, sequence: resumeCursor.sequence }
        : undefined;
    if (fromCursor && fromCursor.generation !== generation) {
        return {
            status: "unavailable",
            fromSequence: resumeSequence,
            toSequence: lastEventSequence,
            fromCursor,
            toCursor,
            reason: "event_generation_changed",
        };
    }
    if (resumeSequence > lastEventSequence) {
        return {
            status: "unavailable",
            fromSequence: resumeSequence,
            toSequence: lastEventSequence,
            ...(fromCursor ? { fromCursor } : {}),
            toCursor,
            reason: "resume_cursor_ahead_of_session",
        };
    }
    if (resumeSequence === lastEventSequence) {
        return {
            status: "complete",
            fromSequence: resumeSequence,
            toSequence: lastEventSequence,
            ...(fromCursor ? { fromCursor } : {}),
            toCursor,
        };
    }
    return {
        status: "unavailable",
        fromSequence: resumeSequence,
        toSequence: lastEventSequence,
        ...(fromCursor ? { fromCursor } : {}),
        toCursor,
        reason: "event_replay_not_available",
    };
}
export function success(id, command, data) {
    return data === undefined
        ? { id, type: "response", command, success: true }
        : { id, type: "response", command, success: true, data };
}
export function failure(id, command, error, errorInfo) {
    return {
        id,
        type: "response",
        command,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        ...(errorInfo ? { errorInfo } : {}),
    };
}
//# sourceMappingURL=daemon-protocol.js.map
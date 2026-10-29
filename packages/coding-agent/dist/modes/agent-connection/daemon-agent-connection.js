import { randomUUID } from "node:crypto";
import { appendRotatingLog, getAgentLogPath, getDaemonLogPath } from "../../config.js";
import { SessionAlreadyActiveError } from "../../core/session-lease.js";
import { DaemonCapabilityUnavailableError, getDaemonSocketCloseReason, } from "../daemon/daemon-client.js";
import { deserializeDaemonError } from "../daemon/daemon-errors.js";
import { collectDaemonClientEnv, collectDaemonLaunchEnv, isUnknownDaemonCommandError, } from "../daemon/daemon-protocol.js";
import { listDaemonHeartbeats } from "../daemon/heartbeat-catalog.js";
import { deleteDaemonSavedSession, listDaemonSavedSessions, renameDaemonSavedSession, } from "../daemon/saved-session-catalog.js";
import { AgentConnectionPromptAdmissionError } from "./types.js";
export const DAEMON_REFINE_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
const DAEMON_LONG_RUNNING_REQUEST_TIMEOUT_MS = 24 * 60 * 60 * 1000;
export const DAEMON_RECONNECT_TIMEOUT_MS = 60_000;
export const DAEMON_SNAPSHOT_TIMEOUT_MS = 30_000;
const MAX_IGNORED_SNAPSHOT_IDS = 128;
const UPDATE_RECONNECT_TIMEOUT_MS = 120000;
const UPDATE_RECONNECT_RETRY_MS = 100;
const MAX_COMPLETED_SNAPSHOTS = 128;
const OWNED_SESSION_DISPOSE_RECONNECT_WAIT_MS = 10_000;
const updateTransportReconnects = new WeakMap();
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function formatErrorSentence(error) {
    const message = (error instanceof Error ? error.message : String(error)).trim();
    if (!message) {
        return "Unknown daemon error.";
    }
    return /[.!?]$/.test(message) ? message : `${message}.`;
}
function reconnectDaemonTransportAfterUpdate(client) {
    const existing = updateTransportReconnects.get(client);
    if (existing) {
        return existing;
    }
    const reconnectPromise = Promise.resolve()
        .then(async () => {
        client.disconnectForReconnect("update");
        const deadline = Date.now() + UPDATE_RECONNECT_TIMEOUT_MS;
        let lastError;
        while (Date.now() < deadline) {
            try {
                await client.reconnect(1000);
                return;
            }
            catch (error) {
                lastError = error;
            }
            await delay(UPDATE_RECONNECT_RETRY_MS);
        }
        throw lastError ?? new Error("the updated daemon did not become available");
    })
        .finally(() => {
        if (updateTransportReconnects.get(client) === reconnectPromise) {
            updateTransportReconnects.delete(client);
        }
    });
    updateTransportReconnects.set(client, reconnectPromise);
    return reconnectPromise;
}
/**
 * AgentConnection adapter for the local daemon JSONL socket transport.
 *
 * InteractiveMode depends only on AgentConnection; local socket ownership and
 * daemon command details stay inside this adapter.
 */
export function buildSessionTreeFromFlatNodes(flatNodes) {
    const byId = new Map();
    const roots = [];
    for (const flatNode of flatNodes) {
        byId.set(flatNode.entry.id, { ...flatNode, children: [] });
    }
    for (const flatNode of flatNodes) {
        const entry = flatNode.entry;
        const node = byId.get(entry.id);
        const parent = entry.parentId === null || entry.parentId === entry.id ? undefined : byId.get(entry.parentId);
        if (parent)
            parent.children.push(node);
        else
            roots.push(node);
    }
    // Match SessionManager.getTree() ordering without recursively walking deep
    // chains: every node is already indexed, so sort each sibling array directly.
    for (const node of byId.values()) {
        node.children.sort((left, right) => new Date(left.entry.timestamp).getTime() - new Date(right.entry.timestamp).getTime());
    }
    return roots;
}
export class DaemonAgentConnection {
    client;
    activeSessionId;
    options;
    listeners = new Set();
    unsubscribeDaemonMessages;
    unsubscribeDaemonClose;
    clientId = `daemon-agent-connection:${randomUUID()}`;
    ownedSessionPromotionTail = Promise.resolve();
    lastEventCursor;
    retiredEventGenerations = new Set();
    lastEventSequence;
    latestSnapshot;
    latestSnapshotIsFresh = false;
    attachedSessionId;
    attachedSessionFile;
    daemonLogPath;
    updateRestartPending = false;
    updateReconnectFailed = false;
    terminalCloseEmitted = false;
    updateReconnectPromise;
    activeSideQuestionIds = new Set();
    snapshotAssemblies = new Map();
    completedSnapshots = new Map();
    pendingReattachActiveSessionIds = new Set();
    snapshotRecoveryPromises = new Map();
    ignoredSnapshotIds = new Set();
    reconnectPromise;
    definitiveRequestErrors = new WeakSet();
    disposing = false;
    disposed = false;
    constructor(client, activeSessionId, options = {}) {
        this.client = client;
        this.activeSessionId = activeSessionId;
        this.options = options;
        if (options.recoverDaemon) {
            this.client.enableRequestRecovery();
        }
        this.unsubscribeDaemonMessages = this.client.onMessage((message) => {
            void this.handleDaemonMessage(message).catch((error) => {
                try {
                    appendRotatingLog(getAgentLogPath(), `[${new Date().toISOString()}] daemon-message: ignored ${message.type} failure: ${String(error)}`);
                }
                catch {
                    // Logging failure must not turn an isolated message error into a connection failure.
                }
            });
        });
        this.captureDaemonLogPath();
        this.unsubscribeDaemonClose = this.client.onClose((error) => {
            this.rejectSnapshotAssemblies(error);
            if (this.disposed || this.terminalCloseEmitted) {
                return;
            }
            const closeReason = getDaemonSocketCloseReason(error);
            if (closeReason === "shutdown") {
                this.terminalCloseEmitted = true;
                void this.emit({ type: "closed", error: this.formatDaemonSessionClosedError("shutdown") });
                return;
            }
            if ((this.updateRestartPending || closeReason === "update") && !this.updateReconnectFailed) {
                this.updateRestartPending = true;
                void this.reconnectAfterUpdate();
                return;
            }
            if (this.options.recoverDaemon) {
                void this.reconnect(error);
                return;
            }
            this.terminalCloseEmitted = true;
            void this.emit({ type: "closed", error: this.formatDaemonConnectionClosedError(error) });
        });
    }
    static async attach(client, activeSessionId, options) {
        const connection = new DaemonAgentConnection(client, activeSessionId, options);
        try {
            await connection.attach();
            return connection;
        }
        catch (error) {
            await connection.dispose();
            throw error;
        }
    }
    async attach() {
        const supportsExtensionUi = this.options.supportsExtensionUi !== false;
        const result = await this.requestData({
            type: "attach",
            activeSessionId: this.activeSessionId,
            supportsExtensionUi,
            clientId: this.clientId,
            capabilities: [
                "attach_snapshot",
                "event_sequence",
                ...(supportsExtensionUi ? ["extension_ui"] : []),
                "slim_attach",
                "chunked_snapshot",
                ...(this.options.ownedSession ? ["client_owned_sessions"] : []),
            ],
            env: this.options.sendClientEnv ? collectDaemonClientEnv() : undefined,
            launchEnv: this.options.ownedSession ? collectDaemonLaunchEnv() : undefined,
            telemetryDisabled: this.options.telemetryDisabled,
            resumeCursor: this.lastEventCursor === undefined
                ? undefined
                : {
                    activeSessionId: this.activeSessionId,
                    ...this.lastEventCursor,
                },
        });
        this.activeSessionId = getAttachActiveSessionId(result);
        const summary = "snapshot" in result ? result.snapshot.summary : result;
        this.attachedSessionId = summary.sessionId;
        this.attachedSessionFile =
            summary.sessionFile ?? ("snapshot" in result ? result.snapshot.state.sessionFile : undefined);
        this.captureDaemonLogPath();
        this.updateReconnectFailed = false;
        this.terminalCloseEmitted = false;
        const attachCursor = getAttachLastEventCursor(result);
        if (attachCursor) {
            this.observeEventCursor(attachCursor);
        }
        this.lastEventSequence = maxEventSequence(this.lastEventSequence, getAttachLastEventSequence(result));
        if ("snapshot" in result) {
            const snapshot = result.snapshotStream
                ? await this.waitForSnapshot(result.snapshotStream.id)
                : result.snapshot;
            this.latestSnapshot = mapDaemonSessionSnapshot(snapshot, result.replay);
            if (this.lastEventSequence !== undefined) {
                this.latestSnapshot.lastEventSequence = this.lastEventSequence;
            }
            if (this.lastEventCursor) {
                this.latestSnapshot.lastEventCursor = this.lastEventCursor;
            }
            this.latestSnapshotIsFresh = true;
        }
        else {
            this.latestSnapshot = undefined;
            this.latestSnapshotIsFresh = false;
        }
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    onBeforeSessionInvalidate(_listener) {
        return () => { };
    }
    async getState() {
        if (this.latestSnapshotIsFresh && this.latestSnapshot) {
            return this.latestSnapshot.state;
        }
        return this.requestData({
            type: "get_connection_state",
            activeSessionId: this.activeSessionId,
        });
    }
    async getInitialSnapshot() {
        if (this.latestSnapshotIsFresh && this.latestSnapshot) {
            return this.latestSnapshot;
        }
        // The session tree is intentionally not fetched here: it is large on long
        // sessions and only needed when the user opens the tree/branch selector.
        // getSessionTree() fetches it lazily via get_session_tree on first use.
        const snapshotCursor = this.lastEventCursor;
        const snapshotSequence = this.lastEventSequence;
        const [state, messagesData, sessionContextData] = await Promise.all([
            this.requestData({
                type: "get_connection_state",
                activeSessionId: this.activeSessionId,
            }),
            this.requestData({
                type: "get_messages",
                activeSessionId: this.activeSessionId,
            }),
            this.requestData({
                type: "get_session_context",
                activeSessionId: this.activeSessionId,
            }),
        ]);
        // Children only travel in the attach snapshot; a session event arriving
        // before the first read marks the cache stale, but the attach-time child
        // roster is still the best seed available (live rlm_child_update events
        // overwrite each entry anyway).
        const children = this.latestSnapshot?.children;
        const streamingMessage = this.latestSnapshot?.streamingMessage;
        this.latestSnapshot = {
            state,
            messages: messagesData.messages,
            sessionContext: sessionContextData.context,
            ...(children ? { children } : {}),
            ...(streamingMessage ? { streamingMessage } : {}),
        };
        if (snapshotSequence !== undefined) {
            this.latestSnapshot.lastEventSequence = snapshotSequence;
        }
        if (snapshotCursor) {
            this.latestSnapshot.lastEventCursor = snapshotCursor;
        }
        this.latestSnapshotIsFresh =
            snapshotSequence === this.lastEventSequence &&
                snapshotCursor?.generation === this.lastEventCursor?.generation &&
                snapshotCursor?.sequence === this.lastEventCursor?.sequence;
        return this.latestSnapshot;
    }
    async getMessages() {
        if (this.latestSnapshotIsFresh && this.latestSnapshot) {
            return this.latestSnapshot.messages;
        }
        const data = await this.requestData({
            type: "get_messages",
            activeSessionId: this.activeSessionId,
        });
        return data.messages;
    }
    async getSessionHeader() {
        const data = await this.requestData({
            type: "get_session_header",
            activeSessionId: this.activeSessionId,
        });
        return data.header ?? undefined;
    }
    async getCommands() {
        const data = await this.requestData({
            type: "get_commands",
            activeSessionId: this.activeSessionId,
        });
        return data.commands;
    }
    async getResourceSnapshot() {
        return this.requestData({
            type: "get_resource_snapshot",
            activeSessionId: this.activeSessionId,
        });
    }
    async getAvailableModels() {
        const data = await this.requestData({
            type: "get_available_models",
            activeSessionId: this.activeSessionId,
        });
        return data.models;
    }
    async getModelCatalog() {
        if (!this.client.supportsServerCapability("model_catalog")) {
            const models = await this.getAvailableModels();
            return {
                models,
                configuredProviders: [...new Set(models.map((model) => model.provider))],
            };
        }
        return this.requestData({
            type: "get_model_catalog",
            activeSessionId: this.activeSessionId,
        });
    }
    async getSessionStats() {
        return this.requestData({
            type: "get_session_stats",
            activeSessionId: this.activeSessionId,
        });
    }
    async getContextTree() {
        return this.requestData({
            type: "get_context_tree",
            activeSessionId: this.activeSessionId,
        });
    }
    async getSessionContext() {
        if (this.latestSnapshotIsFresh && this.latestSnapshot?.sessionContext) {
            return this.latestSnapshot.sessionContext;
        }
        const data = await this.requestData({
            type: "get_session_context",
            activeSessionId: this.activeSessionId,
        });
        return data.context;
    }
    async getSessionTree() {
        if (this.latestSnapshotIsFresh && this.latestSnapshot?.sessionTree) {
            return this.latestSnapshot.sessionTree;
        }
        const data = await this.requestData({
            type: "get_session_tree",
            activeSessionId: this.activeSessionId,
        });
        return { tree: buildSessionTreeFromFlatNodes(data.flatNodes), leafId: data.leafId };
    }
    async listSavedSessions(scope, callbacks) {
        return listDaemonSavedSessions(this.client, { activeSessionId: this.activeSessionId }, scope, callbacks);
    }
    async getQueue() {
        return this.requestData({
            type: "get_queue",
            activeSessionId: this.activeSessionId,
        });
    }
    async mutateQueuedMessage(lane, index, expectedText, mutation) {
        if (!this.client.supportsServerCapability("queue_message_mutation"))
            return "unsupported";
        const data = await this.requestData({
            type: "mutate_queued_message",
            activeSessionId: this.activeSessionId,
            lane,
            index,
            expectedText,
            mutation,
        });
        return data.status;
    }
    async clearQueue() {
        return this.requestData({
            type: "clear_queue",
            activeSessionId: this.activeSessionId,
        });
    }
    async abortAndClearQueue() {
        try {
            return await this.requestData({
                type: "abort_and_clear_queue",
                activeSessionId: this.activeSessionId,
            });
        }
        catch (error) {
            if (isUnknownDaemonCommandError(error, "abort_and_clear_queue")) {
                throw new Error("the daemon is running an older build; restart the daemon and try again");
            }
            throw error;
        }
    }
    async listCronJobs(options = {}) {
        const data = await this.requestData({
            type: "cron_list",
            activeSessionId: this.activeSessionId,
            includeInactive: options.includeInactive,
        });
        return data.jobs;
    }
    async listHeartbeats() {
        return listDaemonHeartbeats(this.client, this.options.ownedSession ? this.activeSessionId : undefined);
    }
    async manageHeartbeat(activeSessionId, jobId, action) {
        if (!this.client.supportsServerCapability("heartbeat_management")) {
            throw new Error("Heartbeat management requires a newer Prime Agent daemon.");
        }
        try {
            const data = await this.requestData({
                type: "heartbeat_manage",
                activeSessionId,
                jobId,
                action,
            });
            return data.heartbeat;
        }
        catch (error) {
            if (isUnknownDaemonCommandError(error, "heartbeat_manage")) {
                throw new Error("Heartbeat management requires a newer Prime Agent daemon.");
            }
            throw error;
        }
    }
    async addCronJob(schedule, prompt) {
        return this.withOwnedSessionPromotion(async (promoteOwnedSession) => {
            const data = await this.requestData({
                type: "cron_add",
                activeSessionId: this.activeSessionId,
                schedule,
                prompt,
                promoteOwnedSession,
            });
            return data.job;
        });
    }
    async cancelCronJob(jobId) {
        const data = await this.requestData({
            type: "cron_cancel",
            activeSessionId: this.activeSessionId,
            jobId,
        });
        return data.job;
    }
    async getHeartbeat() {
        const data = await this.requestData({
            type: "heartbeat_get",
            activeSessionId: this.activeSessionId,
        });
        return data.heartbeat ?? undefined;
    }
    async setHeartbeat(schedule, instruction, deliveryMode) {
        return this.withOwnedSessionPromotion(async (promoteOwnedSession) => {
            const data = await this.requestData({
                type: "heartbeat_set",
                activeSessionId: this.activeSessionId,
                schedule,
                prompt: instruction,
                ...(deliveryMode ? { deliveryMode } : {}),
                promoteOwnedSession,
            });
            return data.heartbeat;
        });
    }
    async updateHeartbeat(action) {
        const data = await this.requestData({
            type: "heartbeat_update",
            activeSessionId: this.activeSessionId,
            action,
        });
        return data.heartbeat ?? undefined;
    }
    async sendAgentMessage(targetActiveSessionId, message) {
        return this.requestData({
            type: "send_message",
            targetActiveSessionId,
            message,
            fromActiveSessionId: this.activeSessionId,
        });
    }
    async getAgentMessageStatus() {
        return this.requestData({
            type: "agent_messages_status",
            activeSessionId: this.activeSessionId,
        });
    }
    async pauseAgentMessages() {
        return this.requestData({
            type: "agent_messages_pause",
            activeSessionId: this.activeSessionId,
        });
    }
    async resumeAgentMessages() {
        return this.requestData({
            type: "agent_messages_resume",
            activeSessionId: this.activeSessionId,
        });
    }
    async clearAgentMessages() {
        return this.requestData({
            type: "agent_messages_clear",
            activeSessionId: this.activeSessionId,
        });
    }
    async getUserMessagesForForking() {
        const data = await this.requestData({
            type: "get_user_messages_for_forking",
            activeSessionId: this.activeSessionId,
        });
        return data.messages;
    }
    async getLastAssistantText() {
        const data = await this.requestData({
            type: "get_last_assistant_text",
            activeSessionId: this.activeSessionId,
        });
        return data.text ?? undefined;
    }
    async getSystemPrompt() {
        const data = await this.requestData({
            type: "get_system_prompt",
            activeSessionId: this.activeSessionId,
        });
        return data.systemPrompt;
    }
    async getToolDefinition(name) {
        const data = await this.requestData({
            type: "get_tool_definition",
            activeSessionId: this.activeSessionId,
            name,
        });
        return data.toolDefinition;
    }
    async setSessionEntryLabel(entryId, label) {
        await this.requestOk({
            type: "set_session_entry_label",
            activeSessionId: this.activeSessionId,
            entryId,
            label,
        });
    }
    async respondToExtensionUiRequest(requestId, response) {
        await this.requestOk({
            type: "extension_ui_response",
            activeSessionId: this.activeSessionId,
            requestId,
            response,
        });
    }
    async prompt(message, options) {
        await this.promptWithAdmissionCancellation("prompt", message, options);
    }
    async promptAndWait(message, options) {
        await this.promptWithAdmissionCancellation("prompt_and_wait", message, options);
    }
    async promptWithAdmissionCancellation(type, message, options) {
        const signal = options?.signal;
        if (signal?.aborted) {
            throw new AgentConnectionPromptAdmissionError("Prompt admission was cancelled.", "cancelled");
        }
        if (!signal) {
            await this.requestData({
                type,
                activeSessionId: this.activeSessionId,
                message,
                images: options?.images,
                streamingBehavior: options?.streamingBehavior,
                queueIfBusy: options?.queueIfBusy,
                source: options?.source,
            }, DAEMON_LONG_RUNNING_REQUEST_TIMEOUT_MS);
            return;
        }
        const admissionId = `prompt-admission:${randomUUID()}`;
        let resolveAbort = () => { };
        const aborted = new Promise((resolve) => {
            resolveAbort = () => resolve("abort");
        });
        const onAbort = () => resolveAbort();
        signal.addEventListener("abort", onAbort, { once: true });
        // Close the listener-registration race before issuing the first request.
        if (signal.aborted) {
            signal.removeEventListener("abort", onAbort);
            throw new AgentConnectionPromptAdmissionError("Prompt admission was cancelled.", "cancelled");
        }
        const command = {
            type,
            activeSessionId: this.activeSessionId,
            message,
            images: options.images,
            streamingBehavior: options.streamingBehavior,
            queueIfBusy: options.queueIfBusy,
            source: options.source,
            admissionId,
        };
        let promptError;
        const promptRequest = this.requestData(command, DAEMON_LONG_RUNNING_REQUEST_TIMEOUT_MS).catch((error) => {
            promptError =
                error instanceof DaemonCapabilityUnavailableError && !error.afterReconnect
                    ? new AgentConnectionPromptAdmissionError(error.message, "unsupported", { cause: error })
                    : error;
            return "failed";
        });
        try {
            const first = await Promise.race([promptRequest.then(() => "settled"), aborted]);
            if (first === "settled" && promptError === undefined)
                return;
            if (first === "settled" && promptError instanceof AgentConnectionPromptAdmissionError)
                throw promptError;
            if (first === "settled" &&
                !signal.aborted &&
                promptError instanceof Error &&
                this.definitiveRequestErrors.has(promptError)) {
                throw promptError;
            }
            let status = "unknown";
            try {
                const result = await this.requestData({
                    type: "cancel_prompt_admission",
                    activeSessionId: this.activeSessionId,
                    admissionId,
                });
                status = result.status;
            }
            catch {
                // Timeout/transport is indistinguishable from accepted ownership.
            }
            await promptRequest;
            if (promptError instanceof AgentConnectionPromptAdmissionError)
                throw promptError;
            const definitiveFailure = promptError instanceof Error && this.definitiveRequestErrors.has(promptError);
            if (promptError === undefined || (status === "owned" && type === "prompt" && !definitiveFailure))
                return;
            throw new AgentConnectionPromptAdmissionError(promptError instanceof Error ? promptError.message : "Prompt admission did not complete.", status, promptError === undefined ? undefined : { cause: promptError });
        }
        finally {
            signal.removeEventListener("abort", onAbort);
        }
    }
    async startSideQuestion(id, question, previousTurns) {
        if (previousTurns?.length && !this.client.supportsServerCapability("side_question_transcript")) {
            // An older daemon would silently ignore previousTurns and answer the
            // follow-up without the side-conversation context; fail loudly instead.
            throw new Error("the daemon is running an older build without side-conversation follow-ups; restart the daemon and try again");
        }
        this.activeSideQuestionIds.add(id);
        try {
            await this.requestOk({
                type: "start_side_question",
                activeSessionId: this.activeSessionId,
                sideQuestionId: id,
                question,
                previousTurns,
            });
        }
        catch (error) {
            this.activeSideQuestionIds.delete(id);
            if (isUnknownDaemonCommandError(error, "start_side_question")) {
                throw new Error("the daemon is running an older build; restart the daemon and try again");
            }
            throw error;
        }
    }
    async abortSideQuestion(id) {
        const data = await this.requestData({
            type: "abort_side_question",
            activeSessionId: this.activeSessionId,
            sideQuestionId: id,
        });
        this.activeSideQuestionIds.delete(id);
        return data.aborted;
    }
    async steer(message, images) {
        await this.requestOk({ type: "steer", activeSessionId: this.activeSessionId, message, images });
    }
    async followUp(message, images) {
        await this.requestOk({ type: "follow_up", activeSessionId: this.activeSessionId, message, images });
    }
    async abort() {
        await this.requestOk({ type: "abort", activeSessionId: this.activeSessionId });
    }
    async cancelRlmChild(childId) {
        try {
            const result = await this.requestData({
                type: "cancel_rlm_child",
                activeSessionId: this.activeSessionId,
                childId,
            });
            return result.cancelled;
        }
        catch (error) {
            if (isUnknownDaemonCommandError(error, "cancel_rlm_child")) {
                throw new Error("the daemon is running an older build; restart the daemon and try again");
            }
            throw error;
        }
    }
    async waitForIdle() {
        await this.requestData({ type: "wait_for_idle", activeSessionId: this.activeSessionId }, DAEMON_LONG_RUNNING_REQUEST_TIMEOUT_MS);
    }
    async waitForHeadlessCompletion() {
        return this.requestData({
            type: "wait_for_headless_completion",
            activeSessionId: this.activeSessionId,
        }, DAEMON_LONG_RUNNING_REQUEST_TIMEOUT_MS);
    }
    async executeBash(command, options) {
        if (options?.transient && !this.client.supportsServerCapability("transient_bash")) {
            // An older daemon would record the run into the session, leaking the
            // side conversation into the main transcript; fail loudly instead.
            throw new Error("the daemon is running an older build without side-conversation bash; restart the daemon and try again");
        }
        try {
            await this.requestOk({
                type: "execute_bash",
                activeSessionId: this.activeSessionId,
                command,
                excludeFromContext: options?.excludeFromContext,
                transient: options?.transient,
                runId: options?.runId,
            });
        }
        catch (error) {
            if (isUnknownDaemonCommandError(error, "execute_bash")) {
                throw new Error("the daemon is running an older build; restart the daemon and try again");
            }
            throw error;
        }
    }
    async executeBashAndWait(command) {
        return this.requestData({
            type: "execute_bash_and_wait",
            activeSessionId: this.activeSessionId,
            command,
        }, DAEMON_LONG_RUNNING_REQUEST_TIMEOUT_MS);
    }
    async abortBash() {
        try {
            await this.requestOk({ type: "abort_bash", activeSessionId: this.activeSessionId });
        }
        catch (error) {
            if (isUnknownDaemonCommandError(error, "abort_bash")) {
                throw new Error("the daemon is running an older build; restart the daemon and try again");
            }
            throw error;
        }
    }
    async setModel(provider, modelId) {
        return this.requestData({
            type: "set_model",
            activeSessionId: this.activeSessionId,
            provider,
            modelId,
        });
    }
    async cycleModel(direction) {
        const result = await this.requestData({
            type: "cycle_model",
            activeSessionId: this.activeSessionId,
            direction,
        });
        return result ?? undefined;
    }
    async setScopedModels(scopedModels) {
        await this.requestOk({
            type: "set_scoped_models",
            activeSessionId: this.activeSessionId,
            scopedModels,
        });
    }
    async setThinkingLevel(level) {
        await this.requestOk({ type: "set_thinking_level", activeSessionId: this.activeSessionId, level });
    }
    async setServiceTier(serviceTier) {
        await this.requestOk({ type: "set_service_tier", activeSessionId: this.activeSessionId, serviceTier });
    }
    async cycleThinkingLevel() {
        const result = await this.requestData({
            type: "cycle_thinking_level",
            activeSessionId: this.activeSessionId,
        });
        return result?.level;
    }
    async setTransport(transport) {
        await this.requestOk({ type: "set_transport", activeSessionId: this.activeSessionId, transport });
    }
    async setSteeringMode(mode) {
        await this.requestOk({ type: "set_steering_mode", activeSessionId: this.activeSessionId, mode });
    }
    async setFollowUpMode(mode) {
        await this.requestOk({ type: "set_follow_up_mode", activeSessionId: this.activeSessionId, mode });
    }
    async setAutoCompactionEnabled(enabled) {
        await this.requestOk({ type: "set_auto_compaction", activeSessionId: this.activeSessionId, enabled });
    }
    async setAutoRetryEnabled(enabled) {
        await this.requestOk({ type: "set_auto_retry", activeSessionId: this.activeSessionId, enabled });
    }
    async compact(customInstructions) {
        return this.requestData({
            type: "compact",
            activeSessionId: this.activeSessionId,
            customInstructions,
        });
    }
    async refine(options = {}) {
        const command = {
            type: "refine",
            activeSessionId: this.activeSessionId,
            instructions: options.instructions,
            rollbackId: options.rollbackId,
        };
        if (options.global !== undefined) {
            command.global = options.global;
        }
        return this.requestData(command, DAEMON_REFINE_REQUEST_TIMEOUT_MS);
    }
    async abortCompaction() {
        await this.requestOk({ type: "abort_compaction", activeSessionId: this.activeSessionId });
    }
    async abortBranchSummary() {
        await this.requestOk({ type: "abort_branch_summary", activeSessionId: this.activeSessionId });
    }
    async abortRetry() {
        await this.requestOk({ type: "abort_retry", activeSessionId: this.activeSessionId });
    }
    async reload() {
        await this.requestOk({ type: "reload", activeSessionId: this.activeSessionId });
    }
    async newSession(options) {
        return this.requestData({
            type: "new_session",
            activeSessionId: this.activeSessionId,
            parentSession: options?.parentSession,
        });
    }
    async switchSession(sessionPath, options) {
        const sourceActiveSessionId = this.activeSessionId;
        try {
            return await this.requestData({
                type: "switch_session",
                activeSessionId: sourceActiveSessionId,
                sessionPath,
                cwdOverride: options?.cwdOverride,
            });
        }
        catch (error) {
            if (!(error instanceof SessionAlreadyActiveError) || !error.activeSessionId) {
                throw error;
            }
            if (this.options.ownedSession) {
                throw error;
            }
            if (error.activeSessionId === sourceActiveSessionId) {
                return { cancelled: false };
            }
            return this.reattachSession(sourceActiveSessionId, error.activeSessionId);
        }
    }
    async reattachSession(sourceActiveSessionId, targetActiveSessionId) {
        const previousState = {
            lastEventCursor: this.lastEventCursor,
            lastEventSequence: this.lastEventSequence,
            latestSnapshot: this.latestSnapshot,
            latestSnapshotIsFresh: this.latestSnapshotIsFresh,
            retiredEventGenerations: new Set(this.retiredEventGenerations),
        };
        this.activeSessionId = targetActiveSessionId;
        this.lastEventCursor = undefined;
        this.lastEventSequence = undefined;
        this.latestSnapshot = undefined;
        this.latestSnapshotIsFresh = false;
        this.retiredEventGenerations.clear();
        this.pendingReattachActiveSessionIds.add(targetActiveSessionId);
        let reattached = false;
        try {
            const supportsExtensionUi = this.options.supportsExtensionUi !== false;
            const result = await this.requestData({
                type: "reattach",
                activeSessionId: sourceActiveSessionId,
                targetActiveSessionId,
                supportsExtensionUi,
                clientId: this.clientId,
                capabilities: [
                    "attach_snapshot",
                    "event_sequence",
                    ...(supportsExtensionUi ? ["extension_ui"] : []),
                    "slim_attach",
                    "chunked_snapshot",
                    ...(this.options.ownedSession ? ["client_owned_sessions"] : []),
                ],
                env: this.options.sendClientEnv ? collectDaemonClientEnv() : undefined,
                launchEnv: this.options.ownedSession ? collectDaemonLaunchEnv() : undefined,
                telemetryDisabled: this.options.telemetryDisabled,
            });
            reattached = true;
            this.activeSessionId = result.activeSessionId;
            this.activeSideQuestionIds.clear();
            if (result.snapshotStream) {
                try {
                    await this.waitForSnapshot(result.snapshotStream.id);
                }
                catch (snapshotError) {
                    await this.snapshotRecoveryPromises.get(result.snapshotStream.id);
                    if (!this.latestSnapshotIsFresh) {
                        throw snapshotError;
                    }
                }
            }
            else {
                this.applyReplacementSnapshot(result.snapshot, result.replay);
                await this.emit({
                    type: "session_replaced",
                    state: result.snapshot.state,
                    messages: result.snapshot.messages,
                });
            }
            return { cancelled: false };
        }
        catch (error) {
            if (!reattached) {
                this.activeSessionId = sourceActiveSessionId;
                this.lastEventCursor = previousState.lastEventCursor;
                this.lastEventSequence = previousState.lastEventSequence;
                this.latestSnapshot = previousState.latestSnapshot;
                this.latestSnapshotIsFresh = previousState.latestSnapshotIsFresh;
                this.retiredEventGenerations.clear();
                for (const generation of previousState.retiredEventGenerations) {
                    this.retiredEventGenerations.add(generation);
                }
            }
            throw error;
        }
        finally {
            this.pendingReattachActiveSessionIds.delete(targetActiveSessionId);
        }
    }
    async fork(entryId, options) {
        return this.requestData({
            type: "fork",
            activeSessionId: this.activeSessionId,
            entryId,
            position: options?.position,
        });
    }
    async navigateTree(targetId, options) {
        return this.requestData({
            type: "navigate_tree",
            activeSessionId: this.activeSessionId,
            targetId,
            summarize: options?.summarize,
            customInstructions: options?.customInstructions,
            replaceInstructions: options?.replaceInstructions,
            label: options?.label,
        });
    }
    async importFromJsonl(inputPath, cwdOverride) {
        return this.requestData({
            type: "import_jsonl",
            activeSessionId: this.activeSessionId,
            inputPath,
            cwdOverride,
        });
    }
    async exportToHtml(outputPath) {
        const data = await this.requestData({
            type: "export_html",
            activeSessionId: this.activeSessionId,
            outputPath,
        });
        return data.path;
    }
    async exportToJsonl(outputPath) {
        const data = await this.requestData({
            type: "export_jsonl",
            activeSessionId: this.activeSessionId,
            outputPath,
        });
        return data.path;
    }
    async setSessionName(name) {
        await this.requestOk({ type: "set_session_name", activeSessionId: this.activeSessionId, name });
    }
    async getRlmMaxDepthStatus() {
        return this.requestData({
            type: "get_rlm_max_depth_status",
            activeSessionId: this.activeSessionId,
        });
    }
    async setRlmMaxDepth(maxDepth, options) {
        return this.requestData({
            type: "set_rlm_max_depth",
            activeSessionId: this.activeSessionId,
            maxDepth,
            global: options?.global,
        });
    }
    async renameSavedSession(sessionPath, name) {
        await renameDaemonSavedSession(this.client, { activeSessionId: this.activeSessionId }, sessionPath, name);
    }
    async deleteSavedSession(sessionPath) {
        return deleteDaemonSavedSession(this.client, { activeSessionId: this.activeSessionId }, sessionPath);
    }
    async watchSession(activeSessionId) {
        // A second connection on the shared client; each one filters to its own session id.
        // attach() rejects for an unknown/exited session — treat that as unreachable.
        let connection;
        try {
            connection = await DaemonAgentConnection.attach(this.client, activeSessionId, { closeClientOnDispose: false });
        }
        catch {
            return undefined;
        }
        return {
            getMessages: () => connection.getMessages(),
            getCommands: () => connection.getCommands(),
            subscribe: (listener) => connection.subscribe(listener),
            getToolDefinition: (name) => connection.getToolDefinition(name),
            close: () => connection.dispose(),
        };
    }
    async dispose() {
        if (this.disposed || this.disposing) {
            return;
        }
        this.disposing = true;
        if (this.options.ownedSession && !this.client.isConnected && this.reconnectPromise) {
            await Promise.race([this.reconnectPromise, delay(OWNED_SESSION_DISPOSE_RECONNECT_WAIT_MS)]).catch(() => undefined);
        }
        this.disposed = true;
        this.updateRestartPending = false;
        await Promise.allSettled([...this.activeSideQuestionIds].map((id) => this.abortSideQuestion(id)));
        this.unsubscribeDaemonMessages();
        this.unsubscribeDaemonClose();
        if (this.options.ownedSession) {
            await this.requestOk({ type: "complete_owned_session", activeSessionId: this.activeSessionId }).catch(() => undefined);
        }
        else {
            await this.requestOk({ type: "detach", activeSessionId: this.activeSessionId }).catch(() => undefined);
        }
        if (this.options.closeClientOnDispose) {
            this.client.close();
        }
        this.rejectSnapshotAssemblies(new Error("Daemon connection disposed during snapshot transfer"));
    }
    async promoteToResident() {
        await this.withOwnedSessionPromotion(async (promoteOwnedSession) => {
            if (!promoteOwnedSession)
                return;
            await this.requestOk({ type: "promote_owned_session", activeSessionId: this.activeSessionId });
        });
    }
    withOwnedSessionPromotion(operation) {
        const run = this.ownedSessionPromotionTail.then(async () => {
            const promoteOwnedSession = this.options.ownedSession === true;
            const result = await operation(promoteOwnedSession);
            if (promoteOwnedSession) {
                this.options.ownedSession = false;
            }
            return result;
        });
        this.ownedSessionPromotionTail = run.then(() => undefined, () => undefined);
        return run;
    }
    async reconnect(cause) {
        if (this.reconnectPromise) {
            return this.reconnectPromise;
        }
        this.reconnectPromise = (async () => {
            void this.emit({ type: "connection_status", status: "reconnecting", error: cause.message });
            const deadline = Date.now() + (this.options.reconnectTimeoutMs ?? DAEMON_RECONNECT_TIMEOUT_MS);
            let attempt = 0;
            let lastError = cause;
            while (!this.disposed && Date.now() < deadline) {
                try {
                    await this.options.recoverDaemon?.();
                    if (this.disposed) {
                        return;
                    }
                    await this.client.connect(1000);
                    await this.client.waitForHello(3000);
                    await this.attach();
                    if (!this.disposed) {
                        const snapshot = await this.getInitialSnapshot();
                        void this.emit({ type: "session_resynced", snapshot });
                        void this.emit({ type: "connection_status", status: "connected" });
                    }
                    return;
                }
                catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    if (this.disposed) {
                        return;
                    }
                    this.client.resetTransportForReconnect();
                    const remainingMs = deadline - Date.now();
                    if (remainingMs <= 0) {
                        break;
                    }
                    const delayMs = Math.min(remainingMs, 2000, 100 * 2 ** Math.min(attempt, 5));
                    attempt++;
                    await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
                }
            }
            if (!this.disposed) {
                this.client.close();
                await this.emit({ type: "closed", error: `Daemon reconnection failed: ${lastError.message}` });
            }
        })().finally(() => {
            this.reconnectPromise = undefined;
        });
        return this.reconnectPromise;
    }
    async requestOk(command) {
        await this.requestData(command);
    }
    async requestData(command, timeoutMs, options) {
        const response = await this.client.request(command, timeoutMs, options);
        if (!response.success) {
            const error = deserializeDaemonError(response);
            this.definitiveRequestErrors.add(error);
            throw error;
        }
        if (invalidatesCachedSnapshot(command.type)) {
            this.latestSnapshotIsFresh = false;
        }
        return response.data;
    }
    async handleDaemonMessage(message) {
        if (message.type === "heartbeats_changed") {
            await this.emit({ type: "heartbeats_changed" });
            return;
        }
        if (!this.isMessageForActiveSession(message)) {
            return;
        }
        if ("snapshotId" in message && this.ignoredSnapshotIds.has(message.snapshotId)) {
            if (message.type === "session_snapshot_end" || message.type === "session_snapshot_failed") {
                this.ignoredSnapshotIds.delete(message.snapshotId);
            }
            return;
        }
        if (message.type === "session_snapshot_begin") {
            const assembly = this.getSnapshotAssembly(message.snapshotId);
            assembly.begin = message;
            return;
        }
        if (message.type === "session_snapshot_chunk") {
            this.getSnapshotAssembly(message.snapshotId).chunks.set(message.index, message.messages);
            return;
        }
        if (message.type === "session_snapshot_end") {
            await this.completeSnapshotAssembly(message);
            return;
        }
        if (message.type === "session_snapshot_failed") {
            const assembly = this.getSnapshotAssembly(message.snapshotId);
            const purpose = assembly.begin?.purpose ?? "attach";
            const snapshotError = new Error(message.error);
            const recoveryPromise = purpose === "replacement" || purpose === "resync"
                ? this.recoverFailedSnapshot(purpose, snapshotError)
                : undefined;
            if (recoveryPromise) {
                this.snapshotRecoveryPromises.set(message.snapshotId, recoveryPromise);
            }
            this.rejectSnapshotAssembly(message.snapshotId, assembly, snapshotError);
            this.ignoreSnapshotId(message.snapshotId);
            if (recoveryPromise) {
                try {
                    await recoveryPromise;
                }
                finally {
                    this.snapshotRecoveryPromises.delete(message.snapshotId);
                }
            }
            return;
        }
        if (this.isStaleSequencedMessage(message)) {
            return;
        }
        this.observeDaemonEventSequence(message);
        if (message.type === "session_event") {
            if (message.event.type !== "refine_complete" && message.event.type !== "refine_failed") {
                this.observeStreamingMessage(message.event);
            }
            this.latestSnapshotIsFresh = false;
            await this.emit({ type: "session_event", event: message.event });
            return;
        }
        if (message.type === "side_question_event") {
            this.observeSideQuestionEvent(message.event);
            await this.emit({ type: "side_question_event", event: message.event });
            return;
        }
        if (message.type === "session_status") {
            // Keep a cached snapshot's recap current so a later re-attach seeds it.
            if (this.latestSnapshot) {
                this.latestSnapshot = {
                    ...this.latestSnapshot,
                    state: { ...this.latestSnapshot.state, recap: message.recap },
                };
            }
            await this.emit({ type: "session_status", recap: message.recap });
            return;
        }
        if (message.type === "session_resynced") {
            this.attachedSessionId = message.snapshot.state.sessionId;
            this.attachedSessionFile = message.snapshot.state.sessionFile;
            this.latestSnapshot = mapDaemonSessionSnapshot(message.snapshot);
            if (this.lastEventSequence !== undefined) {
                this.latestSnapshot.lastEventSequence = this.lastEventSequence;
            }
            if (this.lastEventCursor) {
                this.latestSnapshot.lastEventCursor = this.lastEventCursor;
            }
            this.latestSnapshotIsFresh = true;
            await this.emit({ type: "session_resynced", snapshot: this.latestSnapshot });
            return;
        }
        if (message.type === "session_replaced") {
            this.attachedSessionId = message.state.sessionId;
            this.attachedSessionFile = message.state.sessionFile;
            if (message.snapshotFollows) {
                this.latestSnapshotIsFresh = false;
                return;
            }
            const latestSnapshot = {
                state: message.state,
                messages: message.messages,
            };
            if (this.lastEventSequence !== undefined) {
                latestSnapshot.lastEventSequence = this.lastEventSequence;
            }
            if (this.lastEventCursor) {
                latestSnapshot.lastEventCursor = this.lastEventCursor;
            }
            this.latestSnapshot = latestSnapshot;
            this.latestSnapshotIsFresh = true;
            await this.emit({ type: "session_replaced", state: message.state, messages: message.messages });
            return;
        }
        if (message.type === "extension_ui_request") {
            await this.emit({
                type: "extension_ui_request",
                request: {
                    id: message.id,
                    method: message.method,
                    payload: message.payload,
                },
            });
            return;
        }
        if (message.type === "extension_error") {
            await this.emit({
                type: "extension_error",
                extensionPath: message.extensionPath,
                event: message.event,
                error: message.error,
            });
            return;
        }
        if (message.type === "session_closed") {
            if (message.reason === "update") {
                this.captureDaemonLogPath();
                this.updateRestartPending = true;
                void this.reconnectAfterUpdate();
                return;
            }
            this.terminalCloseEmitted = true;
            await this.emit({ type: "closed", error: this.formatDaemonSessionClosedError(message.reason) });
        }
    }
    captureDaemonLogPath() {
        const socketPath = this.client.hello?.socketPath;
        if (socketPath) {
            this.daemonLogPath = getDaemonLogPath(socketPath);
        }
    }
    formatDaemonSessionClosedError(reason) {
        const explanation = {
            killed: "The daemon stopped this agent session. Its transcript remains saved and can be reopened from Agents View.",
            shutdown: "The Prime Agent daemon shut down while this window was attached. The session transcript remains saved; restart Prime Agent and reopen it from Agents View.",
            completed: "The daemon closed this agent session after it completed. Its transcript remains available from Agents View.",
            replaced: "The daemon replaced this agent session with another session. Reopen the current session from Agents View.",
            update: "The Prime Agent daemon restarted for an update, but this window did not restore automatically. The session transcript remains saved; restart Prime Agent and reopen it from Agents View.",
        };
        return `${explanation[reason]} ${this.formatDaemonDiagnosticContext()}`;
    }
    formatDaemonConnectionClosedError(error) {
        return `Lost connection to the Prime Agent daemon. Cause: ${formatErrorSentence(error)} The session transcript remains saved; restart Prime Agent or reopen the session from Agents View. ${this.formatDaemonDiagnosticContext()}`;
    }
    formatUpdateReconnectError(error) {
        return `The Prime Agent daemon restarted for an update, but this window could not reconnect to its restored session before the recovery timeout expired. Last error: ${formatErrorSentence(error)} The session transcript remains saved; restart Prime Agent and reopen it from Agents View. ${this.formatDaemonDiagnosticContext()}`;
    }
    formatDaemonDiagnosticContext() {
        const details = [];
        if (this.attachedSessionId) {
            details.push(`Session ID: ${this.attachedSessionId}.`);
        }
        if (this.attachedSessionFile) {
            details.push(`Session file: ${this.attachedSessionFile}.`);
        }
        details.push(`Diagnostic log: ${this.daemonLogPath ?? getAgentLogPath()}.`);
        return details.join(" ");
    }
    reconnectAfterUpdate() {
        if (this.updateReconnectPromise) {
            return this.updateReconnectPromise;
        }
        void this.emit({
            type: "connection_status",
            status: "reconnecting",
            error: "The Prime Agent daemon is restarting for an update.",
        });
        const reconnectPromise = reconnectDaemonTransportAfterUpdate(this.client)
            .then(() => this.restoreConnectionAfterUpdate())
            .then(() => {
            if (!this.disposed) {
                void this.emit({ type: "connection_status", status: "connected" });
            }
        })
            .catch(async (error) => {
            this.updateRestartPending = false;
            this.updateReconnectFailed = true;
            if (!this.disposed) {
                this.terminalCloseEmitted = true;
                await this.emit({
                    type: "closed",
                    error: this.formatUpdateReconnectError(error),
                });
            }
        })
            .finally(() => {
            if (this.updateReconnectPromise === reconnectPromise) {
                this.updateReconnectPromise = undefined;
            }
        });
        this.updateReconnectPromise = reconnectPromise;
        return reconnectPromise;
    }
    async restoreConnectionAfterUpdate() {
        const sessionId = this.attachedSessionId;
        const sessionFile = this.attachedSessionFile;
        if (!sessionId && !sessionFile) {
            throw new Error("the previous session identity is unavailable");
        }
        const deadline = Date.now() + UPDATE_RECONNECT_TIMEOUT_MS;
        let lastError;
        while (!this.disposed && Date.now() < deadline) {
            try {
                await this.client.reconnect(1000);
                if (this.disposed) {
                    return;
                }
                const response = await this.client.request({ type: "list" }, 30000);
                if (this.disposed) {
                    return;
                }
                if (!response.success) {
                    throw deserializeDaemonError(response);
                }
                const sessions = readSessionSummaries(response.data);
                const restored = sessions.find((summary) => summary.activeSessionId !== undefined &&
                    ((sessionFile !== undefined && summary.sessionFile === sessionFile) ||
                        (sessionId !== undefined && summary.sessionId === sessionId)));
                if (restored?.activeSessionId) {
                    if (this.disposed) {
                        return;
                    }
                    this.activeSessionId = restored.activeSessionId;
                    this.lastEventSequence = undefined;
                    this.lastEventCursor = undefined;
                    this.retiredEventGenerations.clear();
                    await this.attach();
                    if (this.disposed) {
                        return;
                    }
                    const snapshot = await this.getInitialSnapshot();
                    if (this.disposed) {
                        return;
                    }
                    this.updateRestartPending = false;
                    void this.emit({ type: "session_resynced", snapshot });
                    return;
                }
            }
            catch (error) {
                lastError = error;
            }
            await delay(UPDATE_RECONNECT_RETRY_MS);
        }
        if (this.disposed) {
            return;
        }
        throw lastError ?? new Error("the restored session did not become available");
    }
    getSnapshotAssembly(snapshotId) {
        const existing = this.snapshotAssemblies.get(snapshotId);
        if (existing) {
            return existing;
        }
        let resolveSnapshot;
        let rejectSnapshot;
        const promise = new Promise((resolve, reject) => {
            resolveSnapshot = resolve;
            rejectSnapshot = reject;
        });
        void promise.catch(() => undefined);
        const timeout = setTimeout(() => {
            const current = this.snapshotAssemblies.get(snapshotId);
            if (current) {
                current.reject(new Error(`Timed out waiting for snapshot ${snapshotId}`));
                this.snapshotAssemblies.delete(snapshotId);
                this.ignoreSnapshotId(snapshotId);
            }
        }, this.options.snapshotTimeoutMs ?? DAEMON_SNAPSHOT_TIMEOUT_MS);
        timeout.unref();
        const assembly = {
            chunks: new Map(),
            promise,
            resolve: resolveSnapshot,
            reject: rejectSnapshot,
            timeout,
        };
        this.snapshotAssemblies.set(snapshotId, assembly);
        return assembly;
    }
    rejectSnapshotAssemblies(error) {
        for (const assembly of this.snapshotAssemblies.values()) {
            clearTimeout(assembly.timeout);
            assembly.reject(error);
        }
        this.snapshotAssemblies.clear();
        this.completedSnapshots.clear();
        this.snapshotRecoveryPromises.clear();
        this.ignoredSnapshotIds.clear();
    }
    ignoreSnapshotId(snapshotId) {
        this.ignoredSnapshotIds.add(snapshotId);
        while (this.ignoredSnapshotIds.size > MAX_IGNORED_SNAPSHOT_IDS) {
            const oldest = this.ignoredSnapshotIds.values().next().value;
            if (oldest === undefined) {
                break;
            }
            this.ignoredSnapshotIds.delete(oldest);
        }
    }
    rejectSnapshotAssembly(snapshotId, assembly, error) {
        assembly.reject(error);
        clearTimeout(assembly.timeout);
        if (assembly.begin?.purpose && assembly.begin.purpose !== "attach") {
            this.snapshotAssemblies.delete(snapshotId);
        }
    }
    async recoverFailedSnapshot(purpose, snapshotError) {
        this.latestSnapshotIsFresh = false;
        if (purpose === "replacement") {
            this.latestSnapshot = undefined;
        }
        try {
            const snapshot = await this.getInitialSnapshot();
            if (this.disposed) {
                return;
            }
            this.attachedSessionId = snapshot.state.sessionId;
            this.attachedSessionFile = snapshot.state.sessionFile;
            if (purpose === "replacement") {
                await this.emit({ type: "session_replaced", state: snapshot.state, messages: snapshot.messages });
            }
            else {
                await this.emit({ type: "session_resynced", snapshot });
            }
        }
        catch (recoveryError) {
            if (this.disposed) {
                return;
            }
            this.terminalCloseEmitted = true;
            await this.emit({
                type: "closed",
                error: `Failed to recover from a ${purpose} snapshot transfer. Snapshot error: ${formatErrorSentence(snapshotError)} Recovery error: ${formatErrorSentence(recoveryError)} ${this.formatDaemonDiagnosticContext()}`,
            });
        }
    }
    async waitForSnapshot(snapshotId) {
        const completed = this.completedSnapshots.get(snapshotId);
        if (completed) {
            this.completedSnapshots.delete(snapshotId);
            return completed;
        }
        const assembly = this.getSnapshotAssembly(snapshotId);
        try {
            return await assembly.promise;
        }
        finally {
            clearTimeout(assembly.timeout);
            this.snapshotAssemblies.delete(snapshotId);
            this.completedSnapshots.delete(snapshotId);
        }
    }
    applyReplacementSnapshot(snapshot, replay) {
        if (snapshot.lastEventCursor) {
            this.observeEventCursor(snapshot.lastEventCursor);
        }
        this.lastEventSequence = maxEventSequence(this.lastEventSequence, snapshot.lastEventSequence);
        this.attachedSessionId = snapshot.state.sessionId;
        this.attachedSessionFile = snapshot.state.sessionFile;
        this.latestSnapshot = mapDaemonSessionSnapshot(snapshot, replay);
        this.latestSnapshotIsFresh = true;
    }
    async completeSnapshotAssembly(message) {
        const assembly = this.getSnapshotAssembly(message.snapshotId);
        if (!assembly.begin) {
            this.rejectSnapshotAssembly(message.snapshotId, assembly, new Error(`Snapshot ${message.snapshotId} ended before it began`));
            return;
        }
        if (assembly.chunks.size !== message.chunkCount) {
            this.rejectSnapshotAssembly(message.snapshotId, assembly, new Error(`Snapshot ${message.snapshotId} ended with ${assembly.chunks.size} of ${message.chunkCount} chunks`));
            return;
        }
        const messages = [];
        for (let index = 0; index < message.chunkCount; index++) {
            const chunk = assembly.chunks.get(index);
            if (!chunk) {
                this.rejectSnapshotAssembly(message.snapshotId, assembly, new Error(`Snapshot ${message.snapshotId} is missing chunk ${index}`));
                return;
            }
            messages.push(...chunk);
        }
        if (messages.length !== assembly.begin.messageCount) {
            this.rejectSnapshotAssembly(message.snapshotId, assembly, new Error(`Snapshot ${message.snapshotId} contained ${messages.length} of ${assembly.begin.messageCount} messages`));
            return;
        }
        const snapshot = {
            ...assembly.begin.snapshot,
            messages,
            lastEventSequence: message.lastEventSequence,
            lastEventCursor: message.lastEventCursor,
        };
        if (message.lastEventCursor) {
            this.observeEventCursor(message.lastEventCursor);
        }
        this.lastEventSequence = maxEventSequence(this.lastEventSequence, message.lastEventSequence);
        this.attachedSessionId = snapshot.state.sessionId;
        this.attachedSessionFile = snapshot.state.sessionFile;
        this.latestSnapshot = mapDaemonSessionSnapshot(snapshot);
        this.latestSnapshotIsFresh = true;
        assembly.resolve(snapshot);
        const purpose = assembly.begin.purpose ?? "attach";
        clearTimeout(assembly.timeout);
        if (purpose !== "attach") {
            this.snapshotAssemblies.delete(message.snapshotId);
            if (this.pendingReattachActiveSessionIds.has(message.activeSessionId)) {
                this.completedSnapshots.set(message.snapshotId, snapshot);
                while (this.completedSnapshots.size > MAX_COMPLETED_SNAPSHOTS) {
                    const oldest = this.completedSnapshots.keys().next().value;
                    if (oldest === undefined) {
                        break;
                    }
                    this.completedSnapshots.delete(oldest);
                }
            }
        }
        if (purpose === "replacement") {
            await this.emit({ type: "session_replaced", state: snapshot.state, messages });
        }
        else if (purpose === "resync") {
            await this.emit({ type: "session_resynced", snapshot: this.latestSnapshot });
        }
    }
    observeStreamingMessage(event) {
        if (!this.latestSnapshot) {
            return;
        }
        if ((event.type === "message_start" || event.type === "message_update") && event.message.role === "assistant") {
            this.latestSnapshot = { ...this.latestSnapshot, streamingMessage: event.message };
            return;
        }
        if ((event.type === "message_end" && event.message.role === "assistant") || event.type === "agent_end") {
            const { streamingMessage: _streamingMessage, ...snapshot } = this.latestSnapshot;
            this.latestSnapshot = snapshot;
        }
    }
    isMessageForActiveSession(message) {
        if (!("activeSessionId" in message)) {
            return false;
        }
        return message.activeSessionId === this.activeSessionId;
    }
    isStaleSequencedMessage(message) {
        const cursor = getDaemonMessageCursor(message);
        if (cursor) {
            if (this.retiredEventGenerations.has(cursor.generation)) {
                return true;
            }
            return (this.lastEventCursor?.generation === cursor.generation && cursor.sequence <= this.lastEventCursor.sequence);
        }
        const sequence = getDaemonMessageSequence(message);
        return sequence !== undefined && this.lastEventSequence !== undefined && sequence <= this.lastEventSequence;
    }
    observeDaemonEventSequence(message) {
        const cursor = getDaemonMessageCursor(message);
        if (cursor) {
            this.observeEventCursor(cursor);
            this.lastEventSequence = cursor.sequence;
            return;
        }
        const sequence = getDaemonMessageSequence(message);
        if (sequence === undefined) {
            return;
        }
        this.lastEventSequence =
            this.lastEventSequence === undefined ? sequence : Math.max(this.lastEventSequence, sequence);
        if (this.lastEventCursor) {
            this.lastEventCursor = {
                ...this.lastEventCursor,
                sequence: Math.max(this.lastEventCursor.sequence, sequence),
            };
        }
    }
    observeEventCursor(cursor) {
        const current = this.lastEventCursor;
        if (current && current.generation !== cursor.generation) {
            this.retiredEventGenerations.add(current.generation);
        }
        if (!current || current.generation !== cursor.generation || cursor.sequence > current.sequence) {
            this.lastEventCursor = cursor;
        }
    }
    async emit(event) {
        const deliveries = [];
        for (const listener of [...this.listeners]) {
            try {
                deliveries.push(Promise.resolve(listener(event)));
            }
            catch {
                // One attachment must not interrupt delivery or transport recovery for the others.
            }
        }
        await Promise.allSettled(deliveries);
    }
    observeSideQuestionEvent(event) {
        if (event.status !== "running") {
            this.activeSideQuestionIds.delete(event.id);
        }
    }
}
function readSessionSummaries(value) {
    if (!value || typeof value !== "object" || !Array.isArray(value.sessions)) {
        throw new Error("Daemon returned an invalid session list response");
    }
    return value.sessions;
}
function getAttachActiveSessionId(result) {
    if ("snapshot" in result) {
        return result.activeSessionId;
    }
    return result.activeSessionId ?? result.id;
}
function getAttachLastEventSequence(result) {
    if ("lastEventSequence" in result) {
        return result.lastEventSequence;
    }
    return undefined;
}
function getAttachLastEventCursor(result) {
    if ("lastEventCursor" in result) {
        return result.lastEventCursor;
    }
    return undefined;
}
function maxEventSequence(current, observed) {
    if (current === undefined) {
        return observed;
    }
    if (observed === undefined) {
        return current;
    }
    return Math.max(current, observed);
}
function mapDaemonSessionSnapshot(snapshot, replay) {
    const connectionSnapshot = {
        state: snapshot.state,
        messages: snapshot.messages,
        ...(snapshot.summary.streamingMessage ? { streamingMessage: snapshot.summary.streamingMessage } : {}),
        lastEventSequence: snapshot.lastEventSequence,
        lastEventCursor: snapshot.lastEventCursor,
    };
    if (snapshot.sessionContext) {
        connectionSnapshot.sessionContext = snapshot.sessionContext;
    }
    if (snapshot.sessionTree) {
        connectionSnapshot.sessionTree = snapshot.sessionTree;
    }
    if (snapshot.parent) {
        connectionSnapshot.parent = snapshot.parent;
    }
    if (snapshot.children) {
        connectionSnapshot.children = snapshot.children;
    }
    if (replay) {
        connectionSnapshot.replay = replay;
    }
    return connectionSnapshot;
}
function getDaemonMessageSequence(message) {
    if (!("meta" in message)) {
        return undefined;
    }
    return message.meta?.sequence;
}
function getDaemonMessageCursor(message) {
    if (!("meta" in message)) {
        return undefined;
    }
    return message.meta?.cursor;
}
function invalidatesCachedSnapshot(commandType) {
    switch (commandType) {
        case "attach":
        case "reattach":
        case "detach":
        case "list":
        case "list_saved_sessions":
        case "wait_for_idle":
        case "get_state":
        case "get_connection_state":
        case "get_messages":
        case "get_session_stats":
        case "get_commands":
        case "get_resource_snapshot":
        case "get_model_catalog":
        case "get_available_models":
        case "get_queue":
        case "cron_list":
        case "heartbeats_list":
        case "get_session_context":
        case "get_session_tree":
        case "get_user_messages_for_forking":
        case "get_last_assistant_text":
        case "get_system_prompt":
        case "get_tool_definition":
        case "start_side_question":
        case "abort_side_question":
        case "export_html":
        case "export_jsonl":
            return false;
        default:
            return true;
    }
}
//# sourceMappingURL=daemon-agent-connection.js.map
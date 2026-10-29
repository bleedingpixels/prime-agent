import { resolve } from "node:path";
import { deleteSessionFile } from "../../core/session-file-actions.js";
import { SessionManager } from "../../core/session-manager.js";
import { startSideQuestion } from "../../core/side-question.js";
import { waitForHeadlessCompletion } from "../headless-completion.js";
import { createAgentConnectionCommands, createAgentConnectionResourceSnapshot, createAgentConnectionSnapshot, createAgentConnectionState, } from "./snapshot.js";
import { createAgentConnectionToolDefinition } from "./tool-definition.js";
export class InProcessAgentConnection {
    runtimeHost;
    listeners = new Set();
    beforeSessionInvalidateListeners = new Set();
    sideQuestionRuns = new Map();
    headlessExtensionOptions;
    unsubscribeSessionEvents;
    constructor(runtimeHost) {
        this.runtimeHost = runtimeHost;
        this.bindCurrentSessionEvents();
        if (typeof this.runtimeHost.setBeforeSessionInvalidate === "function") {
            this.runtimeHost.setBeforeSessionInvalidate(() => {
                this.abortAllSideQuestions();
                for (const listener of [...this.beforeSessionInvalidateListeners]) {
                    listener();
                }
            });
        }
        this.runtimeHost.setRebindSession(async () => {
            this.bindCurrentSessionEvents();
            if (this.headlessExtensionOptions) {
                await this.bindCurrentSessionExtensions();
            }
            await this.emit({
                type: "session_replaced",
                state: createAgentConnectionState(this.runtimeHost),
                messages: this.runtimeHost.session.messages,
            });
        });
    }
    async bindHeadlessExtensions(options = {}) {
        this.headlessExtensionOptions = options;
        await this.bindCurrentSessionExtensions();
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    onBeforeSessionInvalidate(listener) {
        this.beforeSessionInvalidateListeners.add(listener);
        return () => {
            this.beforeSessionInvalidateListeners.delete(listener);
        };
    }
    async getState() {
        return createAgentConnectionState(this.runtimeHost);
    }
    async getInitialSnapshot() {
        return createAgentConnectionSnapshot(this.runtimeHost);
    }
    async getMessages() {
        return this.session.state.messages;
    }
    async getSessionHeader() {
        return this.session.sessionManager.getHeader() ?? undefined;
    }
    async getCommands() {
        return createAgentConnectionCommands(this.session);
    }
    async getResourceSnapshot() {
        return createAgentConnectionResourceSnapshot(this.session);
    }
    async getAvailableModels() {
        return this.session.modelRegistry.refreshAvailableModels();
    }
    async getModelCatalog() {
        return this.session.modelRegistry.refreshModelCatalog();
    }
    async getSessionStats() {
        return this.session.getSessionStats();
    }
    async getContextTree() {
        return this.session.getContextTree();
    }
    async getSessionContext() {
        return this.session.buildSessionContext();
    }
    async getSessionTree() {
        return {
            tree: this.session.sessionManager.getTree(),
            leafId: this.session.sessionManager.getLeafId(),
        };
    }
    async listSavedSessions(scope, callbacks) {
        // In-memory managers hold "" for "no explicit session dir"; pass undefined so
        // list()/listAll() fall back to the default directories instead of scanning "".
        const sessionDir = this.session.sessionManager.getSessionDir() || undefined;
        if (scope === "current") {
            return SessionManager.list(this.session.sessionManager.getCwd(), sessionDir, callbacks);
        }
        return SessionManager.listAll(callbacks, sessionDir);
    }
    async getQueue() {
        return {
            steering: [...this.session.getSteeringMessagePreviews()],
            followUp: [...this.session.getFollowUpMessagePreviews()],
        };
    }
    async mutateQueuedMessage(lane, index, expectedText, mutation) {
        return this.session.mutateQueuedMessage(lane, index, expectedText, mutation);
    }
    async clearQueue() {
        return this.session.clearQueue();
    }
    async abortAndClearQueue() {
        const queue = this.session.clearQueue();
        this.session.requestAbort();
        return queue;
    }
    async listCronJobs(_options = {}) {
        return [];
    }
    async listHeartbeats() {
        return [];
    }
    async manageHeartbeat(_activeSessionId, _jobId, _action) {
        throw new Error("Heartbeats require daemon mode");
    }
    async addCronJob(_schedule, _prompt) {
        throw new Error("Cron jobs require daemon mode");
    }
    async cancelCronJob(_jobId) {
        throw new Error("Cron jobs require daemon mode");
    }
    async getHeartbeat() {
        return undefined;
    }
    async setHeartbeat(_schedule, _instruction, _deliveryMode) {
        throw new Error("Heartbeats require daemon mode");
    }
    async updateHeartbeat(_action) {
        throw new Error("Heartbeats require daemon mode");
    }
    async sendAgentMessage(_targetActiveSessionId, _message) {
        throw new Error("Agent messaging requires daemon mode");
    }
    async getAgentMessageStatus() {
        throw new Error("Agent messaging requires daemon mode");
    }
    async pauseAgentMessages() {
        throw new Error("Agent messaging requires daemon mode");
    }
    async resumeAgentMessages() {
        throw new Error("Agent messaging requires daemon mode");
    }
    async clearAgentMessages() {
        throw new Error("Agent messaging requires daemon mode");
    }
    async getUserMessagesForForking() {
        return this.session.getUserMessagesForForking();
    }
    async getLastAssistantText() {
        return this.session.getLastAssistantText();
    }
    async getSystemPrompt() {
        return this.session.systemPrompt;
    }
    async getToolDefinition(name) {
        return createAgentConnectionToolDefinition(this.session.getToolDefinition(name));
    }
    async setSessionEntryLabel(entryId, label) {
        this.session.sessionManager.appendLabelChange(entryId, label);
    }
    async respondToExtensionUiRequest(_requestId, _response) {
        // In-process extension UI requests are handled directly by InteractiveMode.
    }
    async prompt(message, options) {
        await new Promise((resolve, reject) => {
            let settled = false;
            let accepted = false;
            const resolveOnce = () => {
                if (!settled) {
                    settled = true;
                    resolve();
                }
            };
            const rejectOnce = (error) => {
                if (!settled) {
                    settled = true;
                    reject(error);
                }
            };
            const prompt = this.session.prompt(message, {
                ...(options?.images ? { images: options.images } : {}),
                ...(options?.streamingBehavior ? { streamingBehavior: options.streamingBehavior, resumeIfIdle: true } : {}),
                ...(options?.queueIfBusy !== undefined ? { queueIfBusy: options.queueIfBusy } : {}),
                ...(options?.source ? { source: options.source } : {}),
                ...(options?.signal ? { signal: options.signal } : {}),
                preflightResult: (success) => {
                    if (success) {
                        accepted = true;
                        resolveOnce();
                    }
                },
            });
            void prompt.then(() => {
                if (accepted)
                    resolveOnce();
                else
                    rejectOnce(new Error("Prompt was not accepted by the session."));
            }, rejectOnce);
        });
    }
    async promptAndWait(message, options) {
        await this.session.promptAndWait(message, {
            ...(options?.images ? { images: options.images } : {}),
            ...(options?.streamingBehavior ? { streamingBehavior: options.streamingBehavior, resumeIfIdle: true } : {}),
            ...(options?.queueIfBusy !== undefined ? { queueIfBusy: options.queueIfBusy } : {}),
            ...(options?.source ? { source: options.source } : {}),
            ...(options?.signal ? { signal: options.signal } : {}),
        });
    }
    async startSideQuestion(id, question, previousTurns) {
        if (this.sideQuestionRuns.has(id)) {
            throw new Error(`Side question already exists: ${id}`);
        }
        const run = startSideQuestion(this.session.agent, id, question, (event) => this.emit({ type: "side_question_event", event }), previousTurns);
        this.sideQuestionRuns.set(id, run);
        const removeRun = () => {
            this.sideQuestionRuns.delete(id);
        };
        void run.done.then(removeRun, removeRun);
    }
    async abortSideQuestion(id) {
        const run = this.sideQuestionRuns.get(id);
        if (!run) {
            return false;
        }
        run.abort();
        return true;
    }
    async steer(message, images) {
        await this.session.steer(message, images, { resumeIfIdle: true });
    }
    async followUp(message, images) {
        await this.session.followUp(message, images, { resumeIfIdle: true });
    }
    async abort() {
        this.session.requestAbort();
    }
    async cancelRlmChild(childId) {
        return this.session.cancelRlmChildRun(childId);
    }
    async waitForIdle() {
        await this.session.waitForIdle();
    }
    async waitForHeadlessCompletion() {
        return waitForHeadlessCompletion(this.session);
    }
    async executeBash(command, options) {
        await this.session.runUserBash(command, options);
    }
    async executeBashAndWait(command) {
        return this.session.executeBash(command);
    }
    async abortBash() {
        this.session.abortBash();
    }
    async setModel(provider, modelId) {
        const availableModels = await this.session.modelRegistry.refreshAvailableModels();
        const model = availableModels.find((candidate) => {
            return candidate.provider === provider && candidate.id === modelId;
        });
        if (!model) {
            throw new Error(`Model not found: ${provider}/${modelId}`);
        }
        await this.session.setModel(model);
        return model;
    }
    async cycleModel(direction = "forward") {
        return this.session.cycleModel(direction);
    }
    async setScopedModels(scopedModels) {
        this.session.setScopedModels(scopedModels);
    }
    async setThinkingLevel(level) {
        this.session.setThinkingLevel(level);
    }
    async setServiceTier(serviceTier) {
        this.session.setServiceTier(serviceTier);
    }
    async cycleThinkingLevel() {
        return this.session.cycleThinkingLevel();
    }
    async setTransport(transport) {
        this.session.settingsManager.setTransport(transport);
        this.session.agent.transport = transport;
    }
    async setSteeringMode(mode) {
        this.session.setSteeringMode(mode);
    }
    async setFollowUpMode(mode) {
        this.session.setFollowUpMode(mode);
    }
    async setAutoCompactionEnabled(enabled) {
        this.session.setAutoCompactionEnabled(enabled);
    }
    async setAutoRetryEnabled(enabled) {
        this.session.setAutoRetryEnabled(enabled);
    }
    async compact(customInstructions) {
        return this.session.compact(customInstructions);
    }
    async refine(options = {}) {
        return this.session.refine(options);
    }
    async abortCompaction() {
        this.session.abortCompaction();
    }
    async abortBranchSummary() {
        this.session.abortBranchSummary();
    }
    async abortRetry() {
        this.session.abortRetry();
    }
    async reload() {
        await this.session.reload();
    }
    async newSession(options) {
        return this.runtimeHost.newSession(options);
    }
    async switchSession(sessionPath, options) {
        return this.runtimeHost.switchSession(sessionPath, options);
    }
    async fork(entryId, options) {
        return this.runtimeHost.fork(entryId, options);
    }
    async navigateTree(targetId, options) {
        return this.session.navigateTree(targetId, options);
    }
    async importFromJsonl(inputPath, cwdOverride) {
        return this.runtimeHost.importFromJsonl(inputPath, cwdOverride);
    }
    async exportToHtml(outputPath) {
        return this.session.exportToHtml(outputPath);
    }
    async exportToJsonl(outputPath) {
        return this.session.exportToJsonl(outputPath);
    }
    async setSessionName(name) {
        const trimmedName = name.trim();
        if (!trimmedName) {
            throw new Error("Session name cannot be empty");
        }
        this.session.setSessionName(trimmedName);
    }
    async getRlmMaxDepthStatus() {
        return this.session.getRlmMaxDepthStatus();
    }
    async setRlmMaxDepth(maxDepth, options) {
        return this.session.setRlmMaxDepth(maxDepth, options);
    }
    async renameSavedSession(sessionPath, name) {
        const trimmedName = name.trim();
        if (!trimmedName) {
            throw new Error("Session name cannot be empty");
        }
        const currentSessionFile = this.session.sessionFile;
        if (currentSessionFile && resolve(currentSessionFile) === resolve(sessionPath)) {
            this.session.setSessionName(trimmedName);
            return;
        }
        SessionManager.open(sessionPath).appendSessionInfo(trimmedName);
    }
    async deleteSavedSession(sessionPath) {
        return deleteSessionFile(sessionPath);
    }
    async watchSession(childId) {
        const child = this.session.getRlmChildSession(childId);
        if (!child) {
            return undefined;
        }
        const unsubscribes = new Set();
        return {
            getMessages: async () => child.messages,
            getCommands: async () => createAgentConnectionCommands(child),
            subscribe: (listener) => {
                const unsubscribe = child.subscribe((event) => void listener({ type: "session_event", event }));
                unsubscribes.add(unsubscribe);
                return () => {
                    unsubscribes.delete(unsubscribe);
                    unsubscribe();
                };
            },
            getToolDefinition: async (name) => createAgentConnectionToolDefinition(child.getToolDefinition(name)),
            close: async () => {
                for (const unsubscribe of unsubscribes) {
                    unsubscribe();
                }
                unsubscribes.clear();
            },
        };
    }
    async dispose() {
        this.abortAllSideQuestions();
        this.unsubscribeSessionEvents?.();
        this.unsubscribeSessionEvents = undefined;
        if (typeof this.runtimeHost.setBeforeSessionInvalidate === "function") {
            this.runtimeHost.setBeforeSessionInvalidate(undefined);
        }
        this.runtimeHost.setRebindSession(undefined);
        await this.runtimeHost.dispose();
    }
    get session() {
        return this.runtimeHost.session;
    }
    bindCurrentSessionEvents() {
        this.unsubscribeSessionEvents?.();
        this.unsubscribeSessionEvents = this.session.subscribe((event) => {
            void this.emit({ type: "session_event", event });
        });
    }
    async bindCurrentSessionExtensions() {
        const session = this.session;
        await session.bindExtensions({
            uiContext: this.headlessExtensionOptions?.uiContext,
            commandContextActions: {
                waitForIdle: () => session.waitForIdle(),
                newSession: (options) => this.runtimeHost.newSession(options),
                fork: async (entryId, options) => {
                    const result = await this.runtimeHost.fork(entryId, options);
                    return { cancelled: result.cancelled };
                },
                navigateTree: async (targetId, options) => {
                    const result = await session.navigateTree(targetId, options);
                    return { cancelled: result.cancelled };
                },
                switchSession: (sessionPath, options) => this.runtimeHost.switchSession(sessionPath, options),
                reload: () => session.reload(),
            },
            shutdownHandler: this.headlessExtensionOptions?.shutdownHandler,
            onError: (error) => {
                void this.emit({
                    type: "extension_error",
                    extensionPath: error.extensionPath,
                    event: error.event,
                    error: error.error,
                });
            },
        });
    }
    abortAllSideQuestions() {
        for (const run of this.sideQuestionRuns.values()) {
            run.abort();
        }
        this.sideQuestionRuns.clear();
    }
    async emit(event) {
        for (const listener of [...this.listeners]) {
            await listener(event);
        }
    }
}
//# sourceMappingURL=in-process-agent-connection.js.map
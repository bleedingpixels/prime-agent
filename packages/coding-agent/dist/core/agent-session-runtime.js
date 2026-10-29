import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { flushAgentTraceUpload } from "./agent-traces.js";
import { isNoModelsAvailableMessage } from "./auth-guidance.js";
import { emitSessionShutdownEvent } from "./extensions/runner.js";
import { assertSessionCwdExists } from "./session-cwd.js";
import { SessionImportFileNotFoundError } from "./session-import-errors.js";
import { acquireSessionLease, canonicalSessionPath } from "./session-lease.js";
import { SessionManager } from "./session-manager.js";
export { SessionImportFileNotFoundError } from "./session-import-errors.js";
function extractUserMessageText(content) {
    if (typeof content === "string") {
        return content;
    }
    return content
        .filter((part) => part.type === "text" && typeof part.text === "string")
        .map((part) => part.text)
        .join("");
}
/**
 * Owns the current AgentSession plus its cwd-bound services.
 *
 * Session replacement methods tear down the current runtime first, then create
 * and apply the next runtime. If creation fails, the error is propagated to the
 * caller. The caller is responsible for user-facing error handling.
 */
export class AgentSessionRuntime {
    _session;
    _services;
    createRuntime;
    _diagnostics;
    _modelFallbackMessage;
    sessionConfig;
    _metadata;
    _sessionLease;
    rebindSession;
    sessionReplacedListeners = new Set();
    runtimeEnvScope;
    beforeSessionInvalidate;
    subagentRuntimeHost;
    subagentRuntimes = new Map();
    disposePromise;
    constructor(_session, _services, createRuntime, _diagnostics = [], _modelFallbackMessage, sessionConfig, _metadata = {
        kind: "top-level",
        createdAt: Date.now(),
    }, _sessionLease) {
        this._session = _session;
        this._services = _services;
        this.createRuntime = createRuntime;
        this._diagnostics = _diagnostics;
        this._modelFallbackMessage = _modelFallbackMessage;
        this.sessionConfig = sessionConfig;
        this._metadata = _metadata;
        this._sessionLease = _sessionLease;
        this.bindRuntimeHost();
    }
    get services() {
        return this._services;
    }
    get session() {
        return this._session;
    }
    get cwd() {
        return this._services.cwd;
    }
    get diagnostics() {
        return this._diagnostics;
    }
    get modelFallbackMessage() {
        // The "no models available" warning describes session state, not a
        // startup event: once the session gains a model (set_model, /login,
        // onboarding), the stored snapshot is stale and must not reach clients.
        if (isNoModelsAvailableMessage(this._modelFallbackMessage) && this._session.model) {
            return undefined;
        }
        return this._modelFallbackMessage;
    }
    get metadata() {
        return { ...this._metadata };
    }
    get runtimeConfig() {
        return this.sessionConfig ? { ...this.sessionConfig } : undefined;
    }
    setRebindSession(rebindSession) {
        this.rebindSession = rebindSession;
    }
    onSessionReplaced(listener) {
        this.sessionReplacedListeners.add(listener);
        return () => this.sessionReplacedListeners.delete(listener);
    }
    /**
     * Host-installed scope wrapping every runtime rebuild (new/switch/fork/
     * import and subagent creation), during which extensions re-load. The
     * daemon uses it to apply the session's client env for load-time captures.
     */
    setRuntimeEnvScope(scope) {
        this.runtimeEnvScope = scope;
    }
    scopedBuild(fn) {
        return this.runtimeEnvScope ? this.runtimeEnvScope(fn) : fn();
    }
    setSubagentRuntimeHost(host) {
        this.subagentRuntimeHost = host;
        this.bindRuntimeHost();
    }
    /**
     * Set a synchronous callback that runs after `session_shutdown` handlers finish
     * but before the current session is invalidated.
     *
     * This is for host-owned UI teardown that must not yield to the event loop,
     * such as detaching extension-provided TUI components before the old extension
     * context becomes stale.
     */
    setBeforeSessionInvalidate(beforeSessionInvalidate) {
        this.beforeSessionInvalidate = beforeSessionInvalidate;
    }
    async emitBeforeSwitch(reason, targetSessionFile) {
        const runner = this.session.extensionRunner;
        if (!runner.hasHandlers("session_before_switch")) {
            return { cancelled: false };
        }
        const result = await runner.emit({
            type: "session_before_switch",
            reason,
            targetSessionFile,
        });
        return { cancelled: result?.cancel === true };
    }
    async emitBeforeFork(entryId, options) {
        const runner = this.session.extensionRunner;
        if (!runner.hasHandlers("session_before_fork")) {
            return { cancelled: false };
        }
        const result = await runner.emit({
            type: "session_before_fork",
            entryId,
            ...options,
        });
        return { cancelled: result?.cancel === true };
    }
    async teardownCurrent(reason, targetSessionFile) {
        await emitSessionShutdownEvent(this.session.extensionRunner, {
            type: "session_shutdown",
            reason,
            targetSessionFile,
        });
        await flushAgentTraceUpload(this.session.sessionManager).catch(() => undefined);
        this.beforeSessionInvalidate?.();
        // Await the kernel's final snapshot flush before invalidating the session.
        await this.session.disposeAsync();
        await this.disposeHostedSubagentRuntimes();
    }
    bindRuntimeHost() {
        this._session.setSubagentRuntimeHost(this.subagentRuntimeHost ?? this);
    }
    apply(result) {
        this._session = result.session;
        this._services = result.services;
        this._diagnostics = result.diagnostics;
        this._modelFallbackMessage = result.modelFallbackMessage;
        this.bindRuntimeHost();
    }
    acquireReplacementLease(sessionPath) {
        if (sessionPath && this._sessionLease?.sessionPath === canonicalSessionPath(sessionPath)) {
            return this._sessionLease;
        }
        return acquireSessionLease(sessionPath, this.services.agentDir);
    }
    releaseUncommittedLease(lease) {
        if (lease !== this._sessionLease) {
            lease?.release();
        }
    }
    releaseSessionLease() {
        this._sessionLease?.release();
        this._sessionLease = undefined;
    }
    commitReplacementLease(lease) {
        if (lease === this._sessionLease) {
            return;
        }
        const previous = this._sessionLease;
        this._sessionLease = lease;
        previous?.release();
    }
    async buildAndApplyReplacement(build, lease) {
        let result;
        try {
            result = await build();
        }
        catch (error) {
            this.releaseUncommittedLease(lease);
            throw error;
        }
        this.apply(result);
        this.commitReplacementLease(lease);
    }
    async teardownForReplacement(reason, targetSessionFile, lease) {
        try {
            await this.teardownCurrent(reason, targetSessionFile);
        }
        catch (error) {
            this.releaseUncommittedLease(lease);
            throw error;
        }
    }
    async disposeSubagentRuntimes() {
        const runtimes = [...this.subagentRuntimes.values()];
        this.subagentRuntimes.clear();
        let disposeError;
        for (const runtime of runtimes) {
            try {
                await runtime.dispose();
            }
            catch (error) {
                disposeError ??= error;
            }
        }
        if (disposeError) {
            throw disposeError;
        }
    }
    async disposeHostedSubagentRuntimes() {
        let disposeError;
        try {
            await this.subagentRuntimeHost?.disposeRlmSubagentRuntimes?.();
        }
        catch (error) {
            disposeError ??= error;
        }
        try {
            await this.disposeSubagentRuntimes();
        }
        catch (error) {
            disposeError ??= error;
        }
        if (disposeError) {
            throw disposeError;
        }
    }
    listSubagentRuntimes() {
        return [...this.subagentRuntimes.values()];
    }
    async createRlmSubagentRuntime(options) {
        const sessionManager = SessionManager.create(options.parentSession.sessionManager.getCwd(), options.sessionDir);
        if (options.parentSession.sessionFile) {
            sessionManager.newSession({
                parentSession: options.parentSession.sessionFile,
                rlmDepth: options.rlmDepth,
            });
        }
        const runtime = await this.scopedBuild(() => createAgentSessionRuntime(this.createRuntime, {
            cwd: sessionManager.getCwd(),
            agentDir: this.services.agentDir,
            sessionManager,
            sessionStartEvent: { type: "session_start", reason: "startup" },
            sessionConfig: this.sessionConfig,
            sessionOptions: {
                model: options.model,
                thinkingLevel: options.thinkingLevel,
                serviceTier: options.serviceTier,
                scopedModels: options.scopedModels,
                initialActiveToolNames: options.activeToolNames,
                allowedToolNames: options.allowedToolNames,
                customTools: options.customTools,
                includeGoals: options.includeGoals,
                includeCompactSkill: options.includeCompactSkill,
                rlmDepth: options.rlmDepth,
                rlmMaxDepth: options.rlmMaxDepth,
                rlmSessionDir: options.sessionDir,
                rlmParentNodeId: options.rlmParentNodeId,
                rlmParentAgent: options.parentSession.sessionName ?? options.parentSession.sessionId,
            },
            runtimeMetadata: {
                kind: "subagent",
                createdAt: Date.now(),
                parentSessionId: options.parentSession.sessionId,
                parentSessionFile: options.parentSession.sessionFile,
                rlmChildId: options.id,
                rlmParentNodeId: options.rlmParentNodeId,
                prompt: options.prompt,
                spawnCode: options.spawnCode,
                sessionDir: options.sessionDir,
            },
        }));
        this.subagentRuntimes.set(options.id, runtime);
        try {
            await runtime.session.bindExtensions({});
            if (options.parentSession.getRlmChildRunStatus(options.id) === "cancelled") {
                throw new Error("RLM subagent startup was cancelled");
            }
            if (runtime.session.sessionName !== options.sessionName) {
                runtime.session.setSessionName(options.sessionName);
            }
            options.onSessionPublished?.(runtime.session);
        }
        catch (error) {
            this.subagentRuntimes.delete(options.id);
            await runtime.dispose();
            throw error;
        }
        return runtime;
    }
    async deleteRlmSubagentRuntime(childId, session) {
        const runtime = this.subagentRuntimes.get(childId);
        if (!runtime) {
            await session.disposeAsync();
            return;
        }
        this.subagentRuntimes.delete(childId);
        const shouldDisposeStaleSession = runtime.session !== session;
        try {
            await runtime.dispose();
        }
        finally {
            if (shouldDisposeStaleSession) {
                await session.disposeAsync();
            }
        }
    }
    async finishSessionReplacement(withSession) {
        if (this.rebindSession) {
            await this.rebindSession(this.session);
        }
        for (const listener of this.sessionReplacedListeners) {
            await listener(this.session);
        }
        if (withSession) {
            await withSession(this.session.createReplacedSessionContext());
        }
    }
    async switchSession(sessionPath, options) {
        const beforeResult = await this.emitBeforeSwitch("resume", sessionPath);
        if (beforeResult.cancelled) {
            return beforeResult;
        }
        const previousSessionFile = this.session.sessionFile;
        const lease = this.acquireReplacementLease(sessionPath);
        let sessionManager;
        try {
            sessionManager = SessionManager.open(sessionPath, undefined, options?.cwdOverride);
            assertSessionCwdExists(sessionManager, this.cwd);
        }
        catch (error) {
            this.releaseUncommittedLease(lease);
            throw error;
        }
        await this.teardownForReplacement("resume", sessionManager.getSessionFile(), lease);
        await this.buildAndApplyReplacement(() => this.scopedBuild(() => this.createRuntime({
            cwd: sessionManager.getCwd(),
            agentDir: this.services.agentDir,
            sessionManager,
            sessionStartEvent: {
                type: "session_start",
                reason: "resume",
                previousSessionFile,
            },
            sessionConfig: this.sessionConfig,
        })), lease);
        await this.finishSessionReplacement(options?.withSession);
        return { cancelled: false };
    }
    async newSession(options) {
        const beforeResult = await this.emitBeforeSwitch("new");
        if (beforeResult.cancelled) {
            return beforeResult;
        }
        const previousSessionFile = this.session.sessionFile;
        const sessionDir = this.session.sessionManager.getSessionDir();
        const sessionManager = SessionManager.create(this.cwd, sessionDir);
        if (options?.parentSession) {
            sessionManager.newSession({
                parentSession: options.parentSession,
                rlmDepth: this.session.sessionManager.getHeader()?.rlmDepth ?? this.session.rlmDepth,
            });
        }
        const lease = this.acquireReplacementLease(sessionManager.getSessionFile());
        await this.teardownForReplacement("new", sessionManager.getSessionFile(), lease);
        await this.buildAndApplyReplacement(() => this.scopedBuild(() => this.createRuntime({
            cwd: this.cwd,
            agentDir: this.services.agentDir,
            sessionManager,
            sessionStartEvent: {
                type: "session_start",
                reason: "new",
                previousSessionFile,
            },
            sessionConfig: this.sessionConfig,
        })), lease);
        if (options?.setup) {
            await options.setup(this.session.sessionManager);
            this.session.agent.state.messages = this.session.sessionManager.buildSessionContext().messages;
        }
        await this.finishSessionReplacement(options?.withSession);
        return { cancelled: false };
    }
    async fork(entryId, options) {
        const position = options?.position ?? "before";
        const beforeResult = await this.emitBeforeFork(entryId, { position });
        if (beforeResult.cancelled) {
            return { cancelled: true };
        }
        let targetLeafId;
        let selectedText;
        const selectedEntry = this.session.sessionManager.getEntry(entryId);
        if (!selectedEntry) {
            throw new Error("Invalid entry ID for forking");
        }
        if (position === "at") {
            targetLeafId = selectedEntry.id;
        }
        else {
            if (selectedEntry.type !== "message" || selectedEntry.message.role !== "user") {
                throw new Error("Invalid entry ID for forking");
            }
            targetLeafId = selectedEntry.parentId;
            selectedText = extractUserMessageText(selectedEntry.message.content);
        }
        const previousSessionFile = this.session.sessionFile;
        if (this.session.sessionManager.isPersisted()) {
            const currentSessionFile = this.session.sessionFile;
            if (!currentSessionFile) {
                throw new Error("Persisted session is missing a session file");
            }
            const sessionDir = this.session.sessionManager.getSessionDir();
            if (!targetLeafId) {
                const sourceHeader = this.session.sessionManager.getHeader();
                const sessionManager = SessionManager.create(this.cwd, sessionDir);
                sessionManager.newSession({
                    parentSession: currentSessionFile,
                    rlmDepth: sourceHeader?.rlmDepth ?? this.session.rlmDepth,
                });
                const lease = this.acquireReplacementLease(sessionManager.getSessionFile());
                await this.teardownForReplacement("fork", sessionManager.getSessionFile(), lease);
                await this.buildAndApplyReplacement(() => this.scopedBuild(() => this.createRuntime({
                    cwd: this.cwd,
                    agentDir: this.services.agentDir,
                    sessionManager,
                    sessionStartEvent: {
                        type: "session_start",
                        reason: "fork",
                        previousSessionFile,
                    },
                    sessionConfig: this.sessionConfig,
                })), lease);
                await this.finishSessionReplacement(options?.withSession);
                return { cancelled: false, selectedText };
            }
            const sourceManager = SessionManager.open(currentSessionFile, sessionDir);
            const forkedSessionPath = sourceManager.createBranchedSession(targetLeafId);
            if (!forkedSessionPath) {
                throw new Error("Failed to create forked session");
            }
            const sessionManager = SessionManager.open(forkedSessionPath, sessionDir);
            const lease = this.acquireReplacementLease(sessionManager.getSessionFile());
            await this.teardownForReplacement("fork", sessionManager.getSessionFile(), lease);
            await this.buildAndApplyReplacement(() => this.scopedBuild(() => this.createRuntime({
                cwd: sessionManager.getCwd(),
                agentDir: this.services.agentDir,
                sessionManager,
                sessionStartEvent: {
                    type: "session_start",
                    reason: "fork",
                    previousSessionFile,
                },
                sessionConfig: this.sessionConfig,
            })), lease);
            await this.finishSessionReplacement(options?.withSession);
            return { cancelled: false, selectedText };
        }
        const sessionManager = this.session.sessionManager;
        if (!targetLeafId) {
            const sourceHeader = sessionManager.getHeader();
            sessionManager.newSession({
                parentSession: this.session.sessionFile,
                rlmDepth: sourceHeader?.rlmDepth ?? this.session.rlmDepth,
            });
        }
        else {
            sessionManager.createBranchedSession(targetLeafId);
        }
        const lease = this.acquireReplacementLease(sessionManager.getSessionFile());
        await this.teardownForReplacement("fork", sessionManager.getSessionFile(), lease);
        await this.buildAndApplyReplacement(() => this.scopedBuild(() => this.createRuntime({
            cwd: this.cwd,
            agentDir: this.services.agentDir,
            sessionManager,
            sessionStartEvent: {
                type: "session_start",
                reason: "fork",
                previousSessionFile,
            },
            sessionConfig: this.sessionConfig,
        })), lease);
        await this.finishSessionReplacement(options?.withSession);
        return { cancelled: false, selectedText };
    }
    /**
     * Import a session JSONL file and switch runtime state to the imported session.
     *
     * @returns `{ cancelled: true }` when cancelled by `session_before_switch`, otherwise `{ cancelled: false }`.
     * @throws {SessionImportFileNotFoundError} When the input path does not exist.
     * @throws {MissingSessionCwdError} When the imported session cwd cannot be resolved and no override is provided.
     */
    async importFromJsonl(inputPath, cwdOverride) {
        const resolvedPath = resolve(inputPath);
        if (!existsSync(resolvedPath)) {
            throw new SessionImportFileNotFoundError(resolvedPath);
        }
        const sessionDir = this.session.sessionManager.getSessionDir();
        if (!existsSync(sessionDir)) {
            mkdirSync(sessionDir, { recursive: true });
        }
        const destinationPath = join(sessionDir, basename(resolvedPath));
        const beforeResult = await this.emitBeforeSwitch("resume", destinationPath);
        if (beforeResult.cancelled) {
            return beforeResult;
        }
        const previousSessionFile = this.session.sessionFile;
        const lease = this.acquireReplacementLease(destinationPath);
        let sessionManager;
        try {
            if (resolve(destinationPath) !== resolvedPath) {
                copyFileSync(resolvedPath, destinationPath);
            }
            sessionManager = SessionManager.open(destinationPath, sessionDir, cwdOverride);
            assertSessionCwdExists(sessionManager, this.cwd);
        }
        catch (error) {
            this.releaseUncommittedLease(lease);
            throw error;
        }
        await this.teardownForReplacement("resume", sessionManager.getSessionFile(), lease);
        await this.buildAndApplyReplacement(() => this.scopedBuild(() => this.createRuntime({
            cwd: sessionManager.getCwd(),
            agentDir: this.services.agentDir,
            sessionManager,
            sessionStartEvent: {
                type: "session_start",
                reason: "resume",
                previousSessionFile,
            },
            sessionConfig: this.sessionConfig,
        })), lease);
        await this.finishSessionReplacement();
        return { cancelled: false };
    }
    async disposeOnce() {
        let disposeError;
        try {
            await emitSessionShutdownEvent(this.session.extensionRunner, {
                type: "session_shutdown",
                reason: "quit",
            });
        }
        catch (error) {
            disposeError ??= error;
        }
        try {
            await flushAgentTraceUpload(this.session.sessionManager);
        }
        catch (error) {
            disposeError ??= error;
        }
        try {
            this.beforeSessionInvalidate?.();
        }
        catch (error) {
            disposeError ??= error;
        }
        try {
            // Await the kernel's final snapshot flush before tearing the session down.
            await this.session.disposeAsync();
        }
        catch (error) {
            disposeError ??= error;
        }
        try {
            await this.disposeHostedSubagentRuntimes();
        }
        catch (error) {
            disposeError ??= error;
        }
        try {
            if (disposeError) {
                throw disposeError;
            }
        }
        finally {
            this.releaseSessionLease();
        }
    }
    async dispose() {
        if (!this.disposePromise) {
            this.disposePromise = this.disposeOnce();
        }
        await this.disposePromise;
    }
}
/**
 * Create the initial runtime from a runtime factory and initial session target.
 *
 * The same factory is stored on the returned AgentSessionRuntime and reused for
 * later /new, resume, /fork, and import flows.
 */
export async function createAgentSessionRuntime(createRuntime, options) {
    const { sessionLease, ...runtimeOptions } = options;
    const lease = sessionLease ?? acquireSessionLease(runtimeOptions.sessionManager.getSessionFile(), runtimeOptions.agentDir);
    try {
        assertSessionCwdExists(runtimeOptions.sessionManager, runtimeOptions.cwd);
        const result = await createRuntime(runtimeOptions);
        return new AgentSessionRuntime(result.session, result.services, createRuntime, result.diagnostics, result.modelFallbackMessage, runtimeOptions.sessionConfig, runtimeOptions.runtimeMetadata, lease);
    }
    catch (error) {
        lease?.release();
        throw error;
    }
}
export { createAgentSessionFromServices, createAgentSessionServices, } from "./agent-session-services.js";
//# sourceMappingURL=agent-session-runtime.js.map
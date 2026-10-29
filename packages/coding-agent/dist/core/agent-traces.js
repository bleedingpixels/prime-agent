import { Buffer } from "node:buffer";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { appendRotatingLog, getAgentTracesLogPath, getSessionsDir, VERSION } from "../config.js";
import { readFirstLineSync } from "../utils/file-lines.js";
import { loadPrimeCliConfig, PRIME_AGENT_TRACES_PROVIDER_ID, PRIME_INFERENCE_PROVIDER_ID, resolvePrimeAgentTracesBaseUrl, } from "./prime-inference-auth.js";
const MAX_TRACE_BYTES = 20 * 1024 * 1024;
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
const TRACE_UPLOAD_DEBOUNCE_MS = 1_000;
const TRACE_UPLOAD_MIN_INTERVAL_MS = 60_000;
const TRACE_UPLOAD_RETRY_BASE_DELAY_MS = 500;
const TRACE_UPLOAD_RETRY_MAX_DELAY_MS = 10_000;
const TRACE_UPLOAD_MAX_RETRIES = 3;
const TRACE_UPLOAD_RETRY_JITTER = 0.2;
const TRACE_PREVIEW_MAX_CHARS = 8_000;
const TRACE_UPLOAD_ALL_CONCURRENCY = 4;
const TRACE_UPLOAD_RATE_LIMIT_REQUESTS = 5;
const TRACE_UPLOAD_RATE_LIMIT_WINDOW_MS = 60_000;
const TRACE_UPLOAD_RATE_LIMIT_SAFETY_MS = 100;
const TRACE_UPLOAD_ALL_MIN_REQUEST_INTERVAL_MS = Math.ceil(TRACE_UPLOAD_RATE_LIMIT_WINDOW_MS / TRACE_UPLOAD_RATE_LIMIT_REQUESTS) + TRACE_UPLOAD_RATE_LIMIT_SAFETY_MS;
function stringEnv(name) {
    const value = process.env[name];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function describeError(error) {
    if (!(error instanceof Error)) {
        return String(error);
    }
    const cause = error.cause;
    if (isRecord(cause)) {
        const code = typeof cause.code === "string" ? cause.code : undefined;
        const causeMessage = typeof cause.message === "string" ? cause.message : undefined;
        const detail = code ?? causeMessage;
        if (detail && detail !== error.message) {
            return `${error.message} (${detail})`;
        }
    }
    return error.message;
}
class TraceUploadTimeoutError extends Error {
    constructor(timeoutMs) {
        super(`Trace upload timed out after ${timeoutMs}ms`);
        this.name = "TraceUploadTimeoutError";
    }
}
const RETRIABLE_NETWORK_CODES = new Set([
    "ECONNRESET",
    "ECONNREFUSED",
    "ECONNABORTED",
    "EPIPE",
    "ETIMEDOUT",
    "ENETUNREACH",
    "ENETDOWN",
    "EAI_AGAIN",
    "UND_ERR_SOCKET",
    "UND_ERR_CONNECT_TIMEOUT",
]);
const RETRIABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
function isRetriableNetworkError(error) {
    if (error instanceof TraceUploadTimeoutError) {
        return true;
    }
    if (!(error instanceof Error) || error.name === "AbortError") {
        return false;
    }
    const cause = error.cause;
    return isRecord(cause) && typeof cause.code === "string" && RETRIABLE_NETWORK_CODES.has(cause.code);
}
function stringField(data, key) {
    const value = data[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function numberField(data, key) {
    const value = data[key];
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
function isSessionHeader(value) {
    return (isRecord(value) &&
        value.type === "session" &&
        typeof value.id === "string" &&
        typeof value.timestamp === "string" &&
        typeof value.cwd === "string" &&
        (value.parentSession === undefined || typeof value.parentSession === "string"));
}
function readSessionHeader(sessionFile) {
    try {
        const firstLine = readFirstLineSync(sessionFile);
        if (!firstLine?.trim()) {
            return undefined;
        }
        const parsed = JSON.parse(firstLine);
        return isSessionHeader(parsed) ? parsed : undefined;
    }
    catch {
        return undefined;
    }
}
/** Active-branch git for the indexing headers: walk leaf to root, not the last git_state in
 * file order (which may belong to a sibling branch). */
export function activeGitContext(body, header) {
    const byId = new Map();
    let leafId = null;
    for (const line of body.split("\n")) {
        if (!line.trim())
            continue;
        let parsed;
        try {
            parsed = JSON.parse(line);
        }
        catch {
            continue;
        }
        if (!isRecord(parsed) || parsed.type === "session" || typeof parsed.id !== "string")
            continue;
        byId.set(parsed.id, {
            parentId: typeof parsed.parentId === "string" ? parsed.parentId : null,
            type: typeof parsed.type === "string" ? parsed.type : "",
            git: parsed.git,
        });
        leafId = parsed.id;
    }
    let current = leafId ? byId.get(leafId) : undefined;
    for (let depth = 0; current && depth < byId.size + 1; depth += 1) {
        if (current.type === "git_state" && isRecord(current.git)) {
            return current.git;
        }
        current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return header.git;
}
function resolveParentSessionPath(sessionFile, parentSession) {
    return isAbsolute(parentSession) ? parentSession : resolve(dirname(sessionFile), parentSession);
}
function resolveTraceContext(sessionFile, header) {
    let traceId = header.id;
    let parentSessionId;
    let currentFile = sessionFile;
    let currentHeader = header;
    for (let depth = 0; depth < 32; depth += 1) {
        if (!currentHeader.parentSession) {
            break;
        }
        const parentPath = resolveParentSessionPath(currentFile, currentHeader.parentSession);
        const parentHeader = readSessionHeader(parentPath);
        if (!parentHeader) {
            break;
        }
        if (depth === 0) {
            parentSessionId = parentHeader.id;
        }
        traceId = parentHeader.id;
        currentFile = parentPath;
        currentHeader = parentHeader;
    }
    return { traceId, parentSessionId };
}
function parseResponseObject(text) {
    if (!text.trim()) {
        return undefined;
    }
    try {
        const parsed = JSON.parse(text);
        return isRecord(parsed) ? parsed : undefined;
    }
    catch {
        return undefined;
    }
}
async function readResponseMessage(response) {
    const text = await response.text().catch(() => "");
    if (!text.trim()) {
        return response.statusText || "Unknown error";
    }
    const parsed = parseResponseObject(text);
    if (parsed) {
        const error = parsed.error;
        if (isRecord(error)) {
            const message = stringField(error, "message");
            if (message)
                return message;
        }
        const detail = stringField(parsed, "detail");
        if (detail)
            return detail;
        const message = stringField(parsed, "message");
        if (message)
            return message;
    }
    return text.trim();
}
async function fetchWithTimeout(fetchFn, url, init, timeoutMs, signal) {
    const controller = new AbortController();
    const timeoutError = new TraceUploadTimeoutError(timeoutMs);
    let timedOut = false;
    const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort(timeoutError);
    }, timeoutMs);
    const onAbort = () => controller.abort(signal?.reason);
    if (signal?.aborted) {
        onAbort();
    }
    else {
        signal?.addEventListener("abort", onAbort, { once: true });
    }
    try {
        return await fetchFn(url, { ...init, signal: controller.signal });
    }
    catch (error) {
        if (timedOut) {
            throw timeoutError;
        }
        throw error;
    }
    finally {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", onAbort);
    }
}
function delay(ms, signal) {
    return new Promise((resolve) => {
        if (signal?.aborted) {
            resolve();
            return;
        }
        const timeout = setTimeout(finish, ms);
        const onAbort = () => finish();
        function finish() {
            clearTimeout(timeout);
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }
        signal?.addEventListener("abort", onAbort, { once: true });
    });
}
function traceUploadRetryDelay(retryIndex) {
    const exponentialDelay = Math.min(TRACE_UPLOAD_RETRY_MAX_DELAY_MS, TRACE_UPLOAD_RETRY_BASE_DELAY_MS * 2 ** retryIndex);
    const jitterMultiplier = 1 - TRACE_UPLOAD_RETRY_JITTER + Math.random() * TRACE_UPLOAD_RETRY_JITTER * 2;
    return Math.max(0, Math.round(exponentialDelay * jitterMultiplier));
}
function retryAfterDelay(response) {
    const value = response.headers.get("retry-after")?.trim();
    if (!value) {
        return undefined;
    }
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.min(Math.ceil(seconds * 1_000), TRACE_UPLOAD_RATE_LIMIT_WINDOW_MS);
    }
    const retryAt = Date.parse(value);
    return Number.isFinite(retryAt)
        ? Math.min(Math.max(0, retryAt - Date.now()), TRACE_UPLOAD_RATE_LIMIT_WINDOW_MS)
        : undefined;
}
async function fetchWithRetry(fetchFn, url, init, timeoutMs, signal, beforeRequest) {
    for (let attempt = 0;; attempt += 1) {
        let retryDelayMs;
        try {
            await beforeRequest?.();
            if (signal?.aborted) {
                throw signal.reason ?? new Error("Trace upload cancelled");
            }
            const response = await fetchWithTimeout(fetchFn, url, init, timeoutMs, signal);
            if (attempt >= TRACE_UPLOAD_MAX_RETRIES || !RETRIABLE_HTTP_STATUSES.has(response.status)) {
                return response;
            }
            if (response.status === 429) {
                retryDelayMs = retryAfterDelay(response) ?? TRACE_UPLOAD_RATE_LIMIT_WINDOW_MS;
            }
            else if (response.status === 503) {
                retryDelayMs = retryAfterDelay(response);
            }
            await response.body?.cancel().catch(() => undefined);
        }
        catch (error) {
            if (signal?.aborted) {
                throw signal.reason ?? error;
            }
            if (attempt >= TRACE_UPLOAD_MAX_RETRIES || !isRetriableNetworkError(error)) {
                throw error;
            }
        }
        await delay(retryDelayMs ?? traceUploadRetryDelay(attempt), signal);
        if (signal?.aborted) {
            throw signal.reason ?? new Error("Trace upload cancelled");
        }
    }
}
function traceContentPreview(body, maxChars) {
    if (body.length <= maxChars) {
        return { content: body.trimEnd(), truncated: false };
    }
    const marker = "\n... middle of trace omitted ...\n";
    const available = Math.max(0, maxChars - marker.length);
    const headChars = Math.ceil(available / 2);
    const tailChars = Math.floor(available / 2);
    return {
        content: `${body.slice(0, headChars).trimEnd()}${marker}${body.slice(body.length - tailChars).trimStart()}`,
        truncated: true,
    };
}
export async function previewAgentTraceFile(options) {
    if (!options.sessionFile) {
        return { status: "no_session_file" };
    }
    let fileSize;
    try {
        const stats = await stat(options.sessionFile);
        if (!stats.isFile()) {
            return { status: "no_session_file" };
        }
        fileSize = stats.size;
    }
    catch {
        return { status: "no_session_file" };
    }
    if (fileSize === 0) {
        return { status: "empty_session" };
    }
    const header = readSessionHeader(options.sessionFile);
    if (!header) {
        return { status: "invalid_session", message: "Session file is missing a valid session header" };
    }
    let body = "";
    if (fileSize <= MAX_TRACE_BYTES) {
        try {
            body = await readFile(options.sessionFile, "utf8");
        }
        catch (error) {
            return { status: "failed", message: describeError(error) };
        }
        if (!body.trim()) {
            return { status: "empty_session" };
        }
    }
    const traceContext = resolveTraceContext(options.sessionFile, header);
    const baseUrl = resolvePrimeAgentTracesBaseUrl(options.baseUrl);
    const git = body ? activeGitContext(body, header) : header.git;
    const preview = body
        ? traceContentPreview(body, Math.max(256, options.maxContentChars ?? TRACE_PREVIEW_MAX_CHARS))
        : { content: "", truncated: true };
    return {
        status: "ready",
        sessionFile: options.sessionFile,
        sessionId: header.id,
        traceId: traceContext.traceId,
        parentSessionId: traceContext.parentSessionId,
        cwd: header.cwd,
        size: fileSize,
        maxBytes: MAX_TRACE_BYTES,
        uploadable: fileSize <= MAX_TRACE_BYTES,
        endpoint: `${baseUrl}/api/v1/agent-traces/sessions/${encodeURIComponent(header.id)}`,
        gitRepo: git?.repoUrl,
        gitCommit: git?.commit,
        contentPreview: preview.content,
        truncated: preview.truncated,
    };
}
async function findSessionFilesUnder(root, files) {
    let entries;
    try {
        entries = await readdir(root, { withFileTypes: true });
    }
    catch {
        return;
    }
    for (const entry of entries) {
        const entryPath = join(root, entry.name);
        if (entry.isDirectory()) {
            await findSessionFilesUnder(entryPath, files);
            continue;
        }
        if (entry.isFile() && entry.name.endsWith(".jsonl") && readSessionHeader(entryPath)) {
            files.add(entryPath);
        }
    }
}
export async function findAgentTraceFiles(sessionDir = getSessionsDir()) {
    const files = new Set();
    const roots = new Set([resolve(sessionDir), resolve(dirname(sessionDir), "session-artifacts")]);
    await Promise.all([...roots].map((root) => findSessionFilesUnder(root, files)));
    return [...files].sort();
}
function createTraceUploadAllRequestGate(signal) {
    let nextRequestAt = 0;
    let queue = Promise.resolve();
    return () => {
        const slot = queue.then(async () => {
            const waitMs = Math.max(0, nextRequestAt - Date.now());
            if (waitMs > 0) {
                await delay(waitMs, signal);
            }
            if (!signal?.aborted) {
                nextRequestAt = Date.now() + TRACE_UPLOAD_ALL_MIN_REQUEST_INTERVAL_MS;
            }
        });
        queue = slot.catch(() => undefined);
        return slot;
    };
}
export async function uploadAllAgentTraces(options) {
    const { sessionDir, concurrency, onProgress, ...uploadOptions } = options;
    const sessionFiles = await findAgentTraceFiles(sessionDir);
    const results = new Array(sessionFiles.length);
    let cursor = 0;
    let completed = 0;
    const beforeRequest = createTraceUploadAllRequestGate(uploadOptions.signal);
    onProgress?.({ completed, total: sessionFiles.length });
    const worker = async () => {
        while (true) {
            if (uploadOptions.signal?.aborted) {
                return;
            }
            const index = cursor;
            cursor += 1;
            const sessionFile = sessionFiles[index];
            if (!sessionFile) {
                return;
            }
            const result = await uploadAgentTraceFileWithRequestGate({
                ...uploadOptions,
                sessionFile,
                reloadConfig: false,
            }, beforeRequest);
            if (uploadOptions.signal?.aborted && result.status === "failed") {
                return;
            }
            results[index] = { sessionFile, result };
            completed += 1;
            onProgress?.({ completed, total: sessionFiles.length, sessionFile, result });
        }
    };
    const requestedConcurrency = concurrency ?? TRACE_UPLOAD_ALL_CONCURRENCY;
    const normalizedConcurrency = Number.isFinite(requestedConcurrency) && requestedConcurrency > 0
        ? Math.max(1, Math.floor(requestedConcurrency))
        : TRACE_UPLOAD_ALL_CONCURRENCY;
    const workerCount = Math.min(sessionFiles.length, normalizedConcurrency);
    await Promise.all(Array.from({ length: workerCount }, worker));
    const completedResults = results.filter((item) => item !== undefined);
    let uploaded = 0;
    let failed = 0;
    let bytesStored = 0;
    for (const item of completedResults) {
        if (item.result.status === "uploaded") {
            uploaded += 1;
            bytesStored += item.result.bytesStored;
        }
        else if (item.result.status === "failed") {
            failed += 1;
        }
    }
    return {
        total: sessionFiles.length,
        uploaded,
        failed,
        skipped: sessionFiles.length - uploaded - failed,
        bytesStored,
        results: completedResults,
    };
}
export async function getPrimeAgentTraceCredential(authStorage, options = {}) {
    const traceEnvKey = stringEnv("PRIME_AGENT_TRACES_API_KEY");
    if (traceEnvKey) {
        return { apiKey: traceEnvKey, source: "environment", label: "PRIME_AGENT_TRACES_API_KEY" };
    }
    if (options.reloadAuth !== false) {
        authStorage.reload();
    }
    const traceKey = await authStorage.getApiKey(PRIME_AGENT_TRACES_PROVIDER_ID, { includeFallback: false });
    if (traceKey) {
        return { apiKey: traceKey, source: "stored", label: "Prime Agent Traces credential" };
    }
    const primeEnvKey = stringEnv("PRIME_API_KEY");
    if (primeEnvKey) {
        return { apiKey: primeEnvKey, source: "environment", label: "PRIME_API_KEY" };
    }
    const primeCredential = authStorage.get(PRIME_INFERENCE_PROVIDER_ID);
    if (primeCredential) {
        const primeKey = await authStorage.getApiKey(PRIME_INFERENCE_PROVIDER_ID, { includeFallback: false });
        if (primeKey) {
            return { apiKey: primeKey, source: "prime-inference", label: "Prime Inference credential" };
        }
    }
    const primeCliKey = loadPrimeCliConfig(options.configPath).apiKey;
    if (primeCliKey) {
        return { apiKey: primeCliKey, source: "prime-cli", label: "Prime CLI credential" };
    }
    return undefined;
}
async function getAgentTracesEnabled(options) {
    if (options.reloadConfig !== false) {
        await options.settingsManager.reload().catch(() => undefined);
    }
    return options.settingsManager.getAgentTracesEnabled();
}
async function uploadAgentTraceFileWithRequestGate(options, beforeRequest) {
    const result = await performAgentTraceUpload(options, beforeRequest);
    logAgentTraceOutcome(options.sessionFile, result);
    return result;
}
export function uploadAgentTraceFile(options) {
    return uploadAgentTraceFileWithRequestGate(options);
}
function logAgentTraceOutcome(sessionFile, result) {
    let line;
    switch (result.status) {
        case "uploaded":
            line = `uploaded session ${result.sessionId} (${result.bytesStored} bytes)`;
            break;
        case "failed":
            line = `upload failed${result.statusCode ? ` (HTTP ${result.statusCode})` : ""}: ${result.message}`;
            break;
        case "too_large":
            line = `upload skipped: session is ${result.size} bytes (limit ${result.maxBytes})`;
            break;
        case "invalid_session":
            line = `upload skipped: ${result.message}`;
            break;
        case "missing_credentials":
            line = "upload skipped: no Prime credential configured (run /traces login)";
            break;
        default:
            return;
    }
    const suffix = sessionFile ? ` [${sessionFile}]` : "";
    appendRotatingLog(getAgentTracesLogPath(), `[${new Date().toISOString()}] ${line}${suffix}`);
}
async function performAgentTraceUpload(options, beforeRequest) {
    const requireEnabled = options.requireEnabled !== false;
    if (requireEnabled && !(await getAgentTracesEnabled(options))) {
        return { status: "disabled" };
    }
    if (!options.sessionFile) {
        return { status: "no_session_file" };
    }
    let fileSize;
    try {
        const stats = await stat(options.sessionFile);
        if (!stats.isFile()) {
            return { status: "no_session_file" };
        }
        fileSize = stats.size;
    }
    catch {
        return { status: "no_session_file" };
    }
    if (fileSize === 0) {
        return { status: "empty_session" };
    }
    if (fileSize > MAX_TRACE_BYTES) {
        return { status: "too_large", size: fileSize, maxBytes: MAX_TRACE_BYTES };
    }
    const header = readSessionHeader(options.sessionFile);
    if (!header) {
        return { status: "invalid_session", message: "Session file is missing a valid session header" };
    }
    const credential = await getPrimeAgentTraceCredential(options.authStorage, {
        configPath: options.configPath,
        reloadAuth: options.reloadConfig !== false,
    });
    if (!credential) {
        return { status: "missing_credentials" };
    }
    if (requireEnabled && !(await getAgentTracesEnabled(options))) {
        return { status: "disabled" };
    }
    let body;
    try {
        body = await readFile(options.sessionFile, "utf8");
    }
    catch (error) {
        return { status: "failed", message: describeError(error) };
    }
    if (!body.trim()) {
        return { status: "empty_session" };
    }
    const traceContext = resolveTraceContext(options.sessionFile, header);
    const bodyBytes = Buffer.byteLength(body, "utf8");
    const headers = {
        Authorization: `Bearer ${credential.apiKey}`,
        "Content-Type": "application/x-ndjson",
        Accept: "application/json",
        "X-Trace-Id": traceContext.traceId,
        "X-Cwd": header.cwd,
        "X-Agent-Version": VERSION,
    };
    if (traceContext.parentSessionId) {
        headers["X-Parent-Session"] = traceContext.parentSessionId;
    }
    const git = activeGitContext(body, header);
    if (git?.repoUrl) {
        headers["X-Git-Repo"] = git.repoUrl;
    }
    if (git?.commit) {
        headers["X-Git-Commit"] = git.commit;
    }
    if (requireEnabled && !(await getAgentTracesEnabled(options))) {
        return { status: "disabled" };
    }
    const baseUrl = resolvePrimeAgentTracesBaseUrl(options.baseUrl);
    const url = `${baseUrl}/api/v1/agent-traces/sessions/${encodeURIComponent(header.id)}`;
    const fetchFn = options.fetchFn ?? fetch;
    let response;
    try {
        response = await fetchWithRetry(fetchFn, url, {
            method: "PUT",
            headers,
            body,
        }, options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS, options.signal, beforeRequest);
    }
    catch (error) {
        return { status: "failed", message: describeError(error) };
    }
    if (!response.ok) {
        return {
            status: "failed",
            statusCode: response.status,
            message: await readResponseMessage(response),
        };
    }
    const responseText = await response.text().catch(() => "");
    const responseData = parseResponseObject(responseText);
    return {
        status: "uploaded",
        sessionId: responseData ? (stringField(responseData, "session_id") ?? header.id) : header.id,
        traceId: responseData ? (stringField(responseData, "trace_id") ?? traceContext.traceId) : traceContext.traceId,
        bytesStored: responseData ? (numberField(responseData, "bytes_stored") ?? bodyBytes) : bodyBytes,
        key: responseData ? stringField(responseData, "key") : undefined,
    };
}
export function uploadAgentTraceSession(options) {
    return uploadAgentTraceFile({
        ...options,
        sessionFile: options.sessionManager.getSessionFile(),
    });
}
class AgentTraceUploadController {
    sessionManager;
    options;
    timeout;
    pending = false;
    inFlight;
    flushPromise;
    lastUploadStartedAt;
    lastUploadedSignature;
    constructor(sessionManager, options) {
        this.sessionManager = sessionManager;
        this.options = options;
    }
    update(options) {
        this.options = options;
    }
    schedule = () => {
        this.pending = true;
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        const elapsed = this.lastUploadStartedAt === undefined ? 0 : Date.now() - this.lastUploadStartedAt;
        const throttleDelay = this.lastUploadStartedAt === undefined ? 0 : Math.max(0, TRACE_UPLOAD_MIN_INTERVAL_MS - elapsed);
        this.timeout = setTimeout(() => {
            this.timeout = undefined;
            void this.flush().catch(() => undefined);
        }, Math.max(TRACE_UPLOAD_DEBOUNCE_MS, throttleDelay));
    };
    async getCurrentFileSignature() {
        const sessionFile = this.sessionManager.getSessionFile();
        if (!sessionFile) {
            return undefined;
        }
        try {
            const stats = await stat(sessionFile);
            return `${sessionFile}:${stats.size}:${stats.mtimeMs}`;
        }
        catch {
            return undefined;
        }
    }
    async flush() {
        if (this.flushPromise) {
            const result = await this.flushPromise;
            if (!this.pending) {
                return result;
            }
            return (await this.flush()) ?? result;
        }
        this.flushPromise = this.runFlush();
        try {
            return await this.flushPromise;
        }
        finally {
            this.flushPromise = undefined;
        }
    }
    async runFlush() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
        if (this.inFlight) {
            await this.inFlight.catch(() => undefined);
        }
        if (!this.pending) {
            return undefined;
        }
        const signature = await this.getCurrentFileSignature();
        if (signature && signature === this.lastUploadedSignature) {
            this.pending = false;
            return undefined;
        }
        this.pending = false;
        this.lastUploadStartedAt = Date.now();
        this.inFlight = uploadAgentTraceSession({
            ...this.options,
            sessionManager: this.sessionManager,
        });
        try {
            const result = await this.inFlight;
            if (result.status === "uploaded" && signature) {
                this.lastUploadedSignature = signature;
            }
            return result;
        }
        finally {
            this.inFlight = undefined;
        }
    }
}
const traceUploadControllers = new WeakMap();
export function installAgentTraceUpload(sessionManager, options) {
    let controller = traceUploadControllers.get(sessionManager);
    if (controller) {
        controller.update(options);
        return;
    }
    controller = new AgentTraceUploadController(sessionManager, options);
    traceUploadControllers.set(sessionManager, controller);
    sessionManager.onPersist(controller.schedule);
}
export async function flushAgentTraceUpload(sessionManager) {
    return traceUploadControllers.get(sessionManager)?.flush();
}
//# sourceMappingURL=agent-traces.js.map
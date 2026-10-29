import { randomUUID } from "crypto";
import { appendFileSync, chmodSync, chownSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync, } from "fs";
import { readdir, readFile, stat } from "fs/promises";
import { basename, dirname, join, resolve } from "path";
import { v7 as uuidv7 } from "uuid";
import { getAgentDir as getDefaultAgentDir, getSessionsDir } from "../config.js";
import { readFirstLineSync, readLinesAsBuffers } from "../utils/file-lines.js";
import { captureGitContext, gitContextsEqual } from "../utils/git.js";
import { createBranchSummaryMessage, createCompactionSummaryMessage, createCustomMessage, } from "./messages.js";
import { cloneUsage } from "./usage.js";
export const CURRENT_SESSION_VERSION = 3;
const SESSION_LIST_SEARCH_TEXT_MAX_CHARS = 64 * 1024;
const SESSION_LIST_PARSE_MAX_LINE_CHARS = 1024 * 1024;
const SESSION_LIST_LARGE_MESSAGE_PREVIEW_MAX_CHARS = 256;
const SESSION_STREAMING_LOAD_THRESHOLD_BYTES = 128 * 1024 * 1024;
const SESSION_ASYNC_PARSE_YIELD_BYTES = 4 * 1024 * 1024;
// Entry types that can represent user intent (vs. daemon bookkeeping like
// session_state/agent_status/git_state/child_usage_attributed). Used by
// hasUserContent to decide whether a message-less draft is safe to discard.
const CONTENT_ENTRY_TYPES = new Set([
    "message",
    "custom_message",
    "custom",
    "model_change",
    "thinking_level_change",
    "service_tier_change",
    "session_info",
    "label",
    "compaction",
    "branch_summary",
]);
function realpathIfPresent(path) {
    try {
        return realpathSync(path);
    }
    catch (error) {
        if (error.code === "ENOENT")
            return path;
        throw error;
    }
}
function statMetadataIfPresent(path) {
    try {
        const { mode, uid, gid } = statSync(path);
        return { mode: mode & 0o777, uid, gid };
    }
    catch (error) {
        if (error.code === "ENOENT")
            return undefined;
        throw error;
    }
}
function createSessionId() {
    return uuidv7();
}
function getSessionFilePath(sessionDir, sessionId) {
    return join(sessionDir, `${sessionId}.jsonl`);
}
function createUniqueSessionFileTarget(sessionDir) {
    for (let i = 0; i < 100; i++) {
        const sessionId = createSessionId();
        const sessionFile = getSessionFilePath(sessionDir, sessionId);
        if (!existsSync(sessionFile)) {
            return { sessionId, sessionFile };
        }
    }
    throw new Error("Unable to create a unique session file");
}
function getSessionArtifactPath(sessionDir, sessionId) {
    return join(dirname(sessionDir), "session-artifacts", sessionId);
}
/** Generate a unique short ID (8 hex chars, collision-checked) */
function generateId(byId) {
    for (let i = 0; i < 100; i++) {
        const id = randomUUID().slice(0, 8);
        if (!byId.has(id))
            return id;
    }
    // Fallback to full UUID if somehow we have collisions
    return randomUUID();
}
/** Migrate v1 → v2: add id/parentId tree structure. Mutates in place. */
function migrateV1ToV2(entries) {
    const ids = new Set();
    let prevId = null;
    for (const entry of entries) {
        if (entry.type === "session") {
            entry.version = 2;
            continue;
        }
        entry.id = generateId(ids);
        entry.parentId = prevId;
        prevId = entry.id;
        // Convert firstKeptEntryIndex to firstKeptEntryId for compaction
        if (entry.type === "compaction") {
            const comp = entry;
            if (typeof comp.firstKeptEntryIndex === "number") {
                const targetEntry = entries[comp.firstKeptEntryIndex];
                if (targetEntry && targetEntry.type !== "session") {
                    comp.firstKeptEntryId = targetEntry.id;
                }
                delete comp.firstKeptEntryIndex;
            }
        }
    }
}
/** Migrate v2 → v3: rename hookMessage role to custom. Mutates in place. */
function migrateV2ToV3(entries) {
    for (const entry of entries) {
        if (entry.type === "session") {
            entry.version = 3;
            continue;
        }
        // Update message entries with hookMessage role
        if (entry.type === "message") {
            const msgEntry = entry;
            if (msgEntry.message && msgEntry.message.role === "hookMessage") {
                msgEntry.message.role = "custom";
            }
        }
    }
}
/**
 * Run all necessary migrations to bring entries to current version.
 * Mutates entries in place. Returns true if any migration was applied.
 */
function migrateToCurrentVersion(entries) {
    const header = entries.find((e) => e.type === "session");
    const version = header?.version ?? 1;
    if (version >= CURRENT_SESSION_VERSION)
        return false;
    if (version < 2)
        migrateV1ToV2(entries);
    if (version < 3)
        migrateV2ToV3(entries);
    return true;
}
/** Exported for testing */
export function migrateSessionEntries(entries) {
    migrateToCurrentVersion(entries);
}
/** Exported for compaction.test.ts */
export function parseSessionEntries(content) {
    const entries = [];
    const lines = content.trim().split("\n");
    for (const line of lines) {
        if (!line.trim())
            continue;
        try {
            const entry = JSON.parse(line);
            entries.push(entry);
        }
        catch {
            // Skip malformed lines
        }
    }
    applyChildUsageAttributions(entries);
    return entries;
}
function applyChildUsageAttributions(entries) {
    const assistantEntriesById = new Map();
    for (const entry of entries) {
        if (entry.type === "message" && entry.message.role === "assistant") {
            assistantEntriesById.set(entry.id, entry);
        }
    }
    for (const entry of entries) {
        if (entry.type !== "child_usage_attributed")
            continue;
        const target = assistantEntriesById.get(entry.targetId);
        if (!target)
            continue;
        target.message.usage = cloneUsage(entry.aggregateUsage);
    }
}
export function getLatestCompactionEntry(entries) {
    for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].type === "compaction") {
            return entries[i];
        }
    }
    return null;
}
/**
 * Build the session context from entries using tree traversal.
 * If leafId is provided, walks from that entry to root.
 * Handles compaction and branch summaries along the path.
 */
export function buildSessionContext(entries, leafId, byId) {
    // Build uuid index if not available
    if (!byId) {
        byId = new Map();
        for (const entry of entries) {
            byId.set(entry.id, entry);
        }
    }
    // Find leaf
    let leaf;
    if (leafId === null) {
        // Explicitly null - return no messages (navigated to before first entry)
        return { messages: [], thinkingLevel: "off", serviceTier: "default", model: null };
    }
    if (leafId) {
        leaf = byId.get(leafId);
    }
    if (!leaf) {
        // Fallback to last entry (when leafId is undefined)
        leaf = entries[entries.length - 1];
    }
    if (!leaf) {
        return { messages: [], thinkingLevel: "off", serviceTier: "default", model: null };
    }
    // push+reverse, not unshift-per-entry: unshift is O(n), making this O(n^2) on long sessions.
    const path = [];
    let current = leaf;
    while (current) {
        path.push(current);
        current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    path.reverse();
    // Extract settings and find compaction
    let thinkingLevel = "off";
    let serviceTier = "default";
    let model = null;
    let compaction = null;
    for (const entry of path) {
        if (entry.type === "thinking_level_change") {
            thinkingLevel = entry.thinkingLevel;
        }
        else if (entry.type === "service_tier_change") {
            serviceTier = entry.serviceTier;
        }
        else if (entry.type === "model_change") {
            model = { provider: entry.provider, modelId: entry.modelId };
        }
        else if (entry.type === "message" && entry.message.role === "assistant") {
            model = { provider: entry.message.provider, modelId: entry.message.model };
        }
        else if (entry.type === "compaction") {
            compaction = entry;
        }
    }
    // Build messages and collect corresponding entries
    // When there's a compaction, model context remains summary-first while the
    // summary records where clients should present it among retained messages.
    const messages = [];
    const appendMessage = (entry, target = messages) => {
        if (entry.type === "message") {
            target.push(entry.message);
        }
        else if (entry.type === "custom_message") {
            target.push(createCustomMessage(entry.customType, entry.content, entry.display, entry.details, entry.timestamp));
        }
        else if (entry.type === "branch_summary" && entry.summary) {
            target.push(createBranchSummaryMessage(entry.summary, entry.fromId, entry.timestamp));
        }
    };
    if (compaction) {
        // Find compaction index in path
        const compactionIdx = path.findIndex((e) => e.type === "compaction" && e.id === compaction.id);
        // Collect kept messages (before compaction, starting from firstKeptEntryId).
        // The context remains summary-first for the model; retainedMessageCount records
        // the exact chronological presentation boundary for clients.
        const retainedMessages = [];
        let foundFirstKept = false;
        for (let i = 0; i < compactionIdx; i++) {
            const entry = path[i];
            if (entry.id === compaction.firstKeptEntryId) {
                foundFirstKept = true;
            }
            if (foundFirstKept) {
                appendMessage(entry, retainedMessages);
            }
        }
        messages.push(createCompactionSummaryMessage(compaction.summary, compaction.tokensBefore, compaction.timestamp, compaction.customInstructions, retainedMessages.length), ...retainedMessages);
        // Emit messages after compaction
        for (let i = compactionIdx + 1; i < path.length; i++) {
            const entry = path[i];
            appendMessage(entry);
        }
    }
    else {
        // No compaction - emit all messages, handle branch summaries and custom messages
        for (const entry of path) {
            appendMessage(entry);
        }
    }
    return { messages, thinkingLevel, serviceTier, model };
}
/**
 * Compute the default session directory for a cwd.
 * Returns the configured session root.
 */
export function getDefaultSessionDir(_cwd, agentDir = getDefaultAgentDir()) {
    const sessionDir = getSessionsDir(agentDir);
    if (!existsSync(sessionDir)) {
        mkdirSync(sessionDir, { recursive: true });
    }
    return sessionDir;
}
// Decode per line off a Buffer: toString("utf8") on a whole large file is far slower
// (one giant UTF-16 string). Splitting on 0x0a is UTF-8-safe.
function appendEntryFromBuffer(entries, buffer, start = 0, end = buffer.length) {
    if (end <= start)
        return;
    try {
        entries.push(JSON.parse(buffer.toString("utf8", start, end)));
    }
    catch {
        // Skip malformed or blank lines.
    }
}
function parseEntriesFromBuffer(buffer) {
    const entries = [];
    let start = 0;
    while (start < buffer.length) {
        let end = buffer.indexOf(0x0a, start);
        if (end === -1)
            end = buffer.length;
        appendEntryFromBuffer(entries, buffer, start, end);
        start = end + 1;
    }
    return entries;
}
async function parseEntriesFromBufferAsync(buffer) {
    const entries = [];
    let start = 0;
    let bytesSinceYield = 0;
    while (start < buffer.length) {
        let end = buffer.indexOf(0x0a, start);
        if (end === -1)
            end = buffer.length;
        appendEntryFromBuffer(entries, buffer, start, end);
        bytesSinceYield += end - start + 1;
        start = end + 1;
        if (bytesSinceYield >= SESSION_ASYNC_PARSE_YIELD_BYTES) {
            bytesSinceYield = 0;
            await new Promise((resolve) => setImmediate(resolve));
        }
    }
    return entries;
}
function finalizeLoadedEntries(entries) {
    if (entries.length === 0)
        return entries;
    const header = entries[0];
    if (header.type !== "session" || typeof header.id !== "string") {
        return [];
    }
    applyChildUsageAttributions(entries);
    return entries;
}
/** Exported for testing */
export function loadEntriesFromFile(filePath) {
    if (!existsSync(filePath))
        return [];
    return finalizeLoadedEntries(parseEntriesFromBuffer(readFileSync(filePath)));
}
// Async loader for the daemon: reads off the event loop and yields while parsing so a
// large load doesn't freeze other sessions. Large files stream to avoid retaining both
// the full input Buffer and the parsed entry graph at the same time.
export async function loadEntriesFromFileAsync(filePath, options = {}) {
    if (!existsSync(filePath))
        return [];
    const streamThresholdBytes = options.streamThresholdBytes ?? SESSION_STREAMING_LOAD_THRESHOLD_BYTES;
    if ((await stat(filePath)).size < streamThresholdBytes) {
        return finalizeLoadedEntries(await parseEntriesFromBufferAsync(await readFile(filePath)));
    }
    const entries = [];
    let bytesSinceYield = 0;
    for await (const line of readLinesAsBuffers(filePath)) {
        appendEntryFromBuffer(entries, line);
        bytesSinceYield += line.length + 1;
        if (bytesSinceYield >= SESSION_ASYNC_PARSE_YIELD_BYTES) {
            bytesSinceYield = 0;
            await new Promise((resolve) => setImmediate(resolve));
        }
    }
    return finalizeLoadedEntries(entries);
}
function readSessionHeader(filePath) {
    const firstLine = readFirstLineSync(filePath);
    if (!firstLine) {
        return undefined;
    }
    return JSON.parse(firstLine);
}
function isValidRlmDepth(value) {
    return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
export function resolveSessionRlmDepth(header, sessionPath) {
    return resolveLegacySessionRlmDepth(header, sessionPath, new Set()) ?? legacyChildDepthFromPath(sessionPath);
}
function resolveLegacySessionRlmDepth(header, sessionPath, visitedPaths) {
    if (isValidRlmDepth(header.rlmDepth)) {
        return header.rlmDepth;
    }
    if (!header.parentSession) {
        return 0;
    }
    const resolvedSessionPath = resolve(sessionPath);
    if (visitedPaths.has(resolvedSessionPath)) {
        return undefined;
    }
    visitedPaths.add(resolvedSessionPath);
    const pathDepth = legacyChildDepthFromPath(sessionPath);
    const parentSessionPath = resolve(dirname(sessionPath), header.parentSession);
    try {
        const parentHeader = readSessionHeader(parentSessionPath);
        if (parentHeader) {
            const parentDepth = resolveLegacySessionRlmDepth(parentHeader, parentSessionPath, visitedPaths);
            if (parentDepth !== undefined) {
                return pathDepth > 0 ? parentDepth + 1 : parentDepth;
            }
        }
    }
    catch {
        // Fall back to artifact ancestry for unavailable or invalid legacy parents.
    }
    finally {
        visitedPaths.delete(resolvedSessionPath);
    }
    return pathDepth;
}
function legacyChildDepthFromPath(sessionPath) {
    let depth = 0;
    for (const segment of dirname(sessionPath)
        .split(/[\\/]+/)
        .reverse()) {
        if (!/^sub-[0-9a-f]{8}$/.test(segment)) {
            break;
        }
        depth += 1;
    }
    return depth;
}
function deriveChildRlmDepth(parentHeader) {
    const depth = parentHeader?.rlmDepth;
    return isValidRlmDepth(depth) && depth < Number.MAX_SAFE_INTEGER ? depth + 1 : undefined;
}
function rootRlmDepthFromEnv() {
    const value = process.env.RLM_DEPTH;
    if (value === undefined || value === "") {
        return 0;
    }
    const parsed = Number(value);
    if (!/^\d+$/.test(value) || !isValidRlmDepth(parsed)) {
        throw new Error("RLM_DEPTH must be a non-negative integer");
    }
    return parsed;
}
function isValidSessionFile(filePath) {
    try {
        const header = readSessionHeader(filePath);
        return header?.type === "session" && typeof header.id === "string";
    }
    catch {
        return false;
    }
}
/** Exported for testing */
export function findMostRecentSession(sessionDir) {
    try {
        const files = readdirSync(sessionDir)
            .filter((f) => f.endsWith(".jsonl"))
            .map((f) => join(sessionDir, f))
            .filter(isValidSessionFile)
            .map((path) => ({ path, mtime: statSync(path).mtime }))
            .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        return files[0]?.path || null;
    }
    catch {
        return null;
    }
}
function normalizeCwd(cwd) {
    return resolve(cwd);
}
function sessionInfoMatchesCwd(session, cwd) {
    return !!session.cwd && normalizeCwd(session.cwd) === normalizeCwd(cwd);
}
function sessionHeaderMatchesCwd(header, cwd) {
    return (header?.type === "session" &&
        typeof header.id === "string" &&
        typeof header.cwd === "string" &&
        normalizeCwd(header.cwd) === normalizeCwd(cwd));
}
export function findMostRecentSessionForCwd(sessionDir, cwd) {
    try {
        const files = readdirSync(sessionDir)
            .filter((f) => f.endsWith(".jsonl"))
            .map((f) => join(sessionDir, f))
            .map((path) => {
            try {
                const header = readSessionHeader(path);
                if (!sessionHeaderMatchesCwd(header, cwd)) {
                    return undefined;
                }
                return { path, mtime: statSync(path).mtime };
            }
            catch {
                return undefined;
            }
        })
            .filter((entry) => entry !== undefined)
            .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        return files[0]?.path || null;
    }
    catch {
        return null;
    }
}
function isMessageWithContent(message) {
    return typeof message.role === "string" && "content" in message;
}
function extractTextContent(message) {
    const content = message.content;
    if (typeof content === "string") {
        return content;
    }
    return content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join(" ");
}
// Legacy "hidden" and "sleep" statuses (written by older versions) both map to
// the current "archived".
function normalizeSessionStateStatus(value) {
    if (value === "active" || value === "archived" || value === "crash") {
        return value;
    }
    if (value === "hidden" || value === "sleep") {
        return "archived";
    }
    return undefined;
}
function updateLastActivityTime(lastActivityTime, entry) {
    if (entry.type !== "message") {
        return lastActivityTime;
    }
    const message = entry.message;
    if (!isMessageWithContent(message)) {
        return lastActivityTime;
    }
    if (message.role !== "user" && message.role !== "assistant") {
        return lastActivityTime;
    }
    const msgTimestamp = message.timestamp;
    if (typeof msgTimestamp === "number") {
        return Math.max(lastActivityTime ?? 0, msgTimestamp);
    }
    const entryTimestamp = entry.timestamp;
    if (typeof entryTimestamp === "string") {
        const t = new Date(entryTimestamp).getTime();
        if (!Number.isNaN(t)) {
            return Math.max(lastActivityTime ?? 0, t);
        }
    }
    return lastActivityTime;
}
function getSessionModifiedDateFromLastActivity(lastActivityTime, header, statsMtime) {
    if (typeof lastActivityTime === "number" && lastActivityTime > 0) {
        return new Date(lastActivityTime);
    }
    const headerTime = typeof header.timestamp === "string" ? new Date(header.timestamp).getTime() : NaN;
    return !Number.isNaN(headerTime) ? new Date(headerTime) : statsMtime;
}
function appendCappedSearchText(current, text) {
    if (!text || current.length >= SESSION_LIST_SEARCH_TEXT_MAX_CHARS) {
        return current;
    }
    const next = current ? ` ${text}` : text;
    return current + next.slice(0, SESSION_LIST_SEARCH_TEXT_MAX_CHARS - current.length);
}
function looksLikeMessageEntry(line) {
    return line.includes('"type":"message"') || line.includes('"type": "message"');
}
function extractJsonStringPropertyPrefix(text, propertyName, maxChars, startIndex = 0) {
    const propertyIndex = text.indexOf(`"${propertyName}"`, startIndex);
    if (propertyIndex < 0) {
        return undefined;
    }
    let index = propertyIndex + propertyName.length + 2;
    while (index < text.length && /\s/.test(text[index] ?? ""))
        index++;
    if (text[index] !== ":") {
        return undefined;
    }
    index++;
    while (index < text.length && /\s/.test(text[index] ?? ""))
        index++;
    if (text[index] !== '"') {
        return undefined;
    }
    index++;
    let result = "";
    let escaped = false;
    for (; index < text.length && result.length < maxChars; index++) {
        const char = text[index];
        if (escaped) {
            result += char;
            escaped = false;
            continue;
        }
        if (char === "\\") {
            escaped = true;
            continue;
        }
        if (char === '"') {
            break;
        }
        result += char;
    }
    return result;
}
function extractOversizedMessageSummary(line) {
    const timestampText = extractJsonStringPropertyPrefix(line, "timestamp", 64);
    const timestamp = timestampText ? new Date(timestampText).getTime() : NaN;
    const messageIndex = line.indexOf('"message"');
    const role = messageIndex >= 0
        ? extractJsonStringPropertyPrefix(line, "role", 64, messageIndex)
        : extractJsonStringPropertyPrefix(line, "role", 64);
    let textPreview;
    if (messageIndex >= 0) {
        textPreview =
            extractJsonStringPropertyPrefix(line, "content", SESSION_LIST_LARGE_MESSAGE_PREVIEW_MAX_CHARS, messageIndex) ??
                extractJsonStringPropertyPrefix(line, "text", SESSION_LIST_LARGE_MESSAGE_PREVIEW_MAX_CHARS, messageIndex);
    }
    return {
        role,
        ...(Number.isNaN(timestamp) ? {} : { timestamp }),
        ...(textPreview ? { textPreview } : {}),
    };
}
// Session files are append-only, so an unchanged (size, mtimeMs) means identical
// content: cache list metadata and rescan only files that changed.
const sessionInfoCache = new Map();
export async function readSessionInfo(filePath) {
    let stats;
    try {
        stats = await stat(filePath);
    }
    catch {
        return null;
    }
    const cached = sessionInfoCache.get(filePath);
    if (cached && cached.size === stats.size && cached.mtimeMs === stats.mtimeMs) {
        return cached.info;
    }
    const info = await scanSessionInfo(filePath, stats);
    sessionInfoCache.set(filePath, { size: stats.size, mtimeMs: stats.mtimeMs, info });
    return info;
}
async function scanSessionInfo(filePath, stats) {
    try {
        let header;
        let messageCount = 0;
        let firstMessage = "";
        let allMessagesText = "";
        let name;
        let state;
        let agentStatus;
        let lastActivityTime;
        for await (const lineBuffer of readLinesAsBuffers(filePath)) {
            const line = lineBuffer.toString("utf8");
            if (!line.trim())
                continue;
            // Large tool-result entries can be many MB. They do not carry the
            // session-list metadata we need, and parsing them during every refresh
            // can exhaust the daemon heap.
            if (line.length > SESSION_LIST_PARSE_MAX_LINE_CHARS) {
                if (looksLikeMessageEntry(line)) {
                    messageCount++;
                    const summary = extractOversizedMessageSummary(line);
                    if (typeof summary.timestamp === "number" && (summary.role === "user" || summary.role === "assistant")) {
                        lastActivityTime = Math.max(lastActivityTime ?? 0, summary.timestamp);
                    }
                    if (summary.role === "user" && !firstMessage) {
                        firstMessage = summary.textPreview || "(large message)";
                    }
                }
                continue;
            }
            const trimmed = line.trim();
            let entry;
            try {
                entry = JSON.parse(trimmed);
            }
            catch {
                // Skip malformed lines
                continue;
            }
            // Extract session name (use latest, including explicit clears)
            if (entry.type === "session_info") {
                const infoEntry = entry;
                name = infoEntry.name?.trim() || undefined;
            }
            if (entry.type === "session_state") {
                const stateEntry = entry;
                const status = normalizeSessionStateStatus(stateEntry.state?.status);
                if (status) {
                    state = { status };
                }
            }
            // Keep the latest recap/verdict so off-daemon sessions don't all show as
            // unjudged in the agents view. Append-only, so last seen wins.
            if (entry.type === "agent_status") {
                agentStatus = entry.status;
            }
            if (!header) {
                if (entry.type !== "session") {
                    return null;
                }
                header = entry;
            }
            lastActivityTime = updateLastActivityTime(lastActivityTime, entry);
            if (entry.type !== "message")
                continue;
            messageCount++;
            const message = entry.message;
            if (!isMessageWithContent(message))
                continue;
            if (message.role !== "user" && message.role !== "assistant")
                continue;
            const textContent = extractTextContent(message);
            if (!textContent)
                continue;
            allMessagesText = appendCappedSearchText(allMessagesText, textContent);
            if (!firstMessage && message.role === "user") {
                firstMessage = textContent;
            }
        }
        if (!header)
            return null;
        const cwd = typeof header.cwd === "string" ? header.cwd : "";
        const parentSessionPath = header.parentSession;
        const rlmDepth = resolveSessionRlmDepth(header, filePath);
        const modified = getSessionModifiedDateFromLastActivity(lastActivityTime, header, stats.mtime);
        return {
            path: filePath,
            id: header.id,
            cwd,
            name,
            state,
            parentSessionPath,
            rlmDepth,
            created: new Date(header.timestamp),
            modified,
            messageCount,
            firstMessage: firstMessage || "(no messages)",
            allMessagesText,
            agentStatus,
        };
    }
    catch {
        return null;
    }
}
async function listSessionsFromDir(dir, callbacks, progressOffset = 0, progressTotal) {
    const sessions = [];
    if (!existsSync(dir)) {
        return sessions;
    }
    try {
        const dirEntries = await readdir(dir);
        const files = dirEntries.filter((f) => f.endsWith(".jsonl")).map((f) => join(dir, f));
        const total = progressTotal ?? files.length;
        // drop cache entries for deleted files so it stays bounded
        const present = new Set(files);
        for (const key of sessionInfoCache.keys()) {
            if (dirname(key) === dir && !present.has(key)) {
                sessionInfoCache.delete(key);
            }
        }
        let loaded = 0;
        for (const file of files) {
            const info = await readSessionInfo(file);
            loaded++;
            callbacks?.onProgress?.(progressOffset + loaded, total);
            if (info) {
                sessions.push(info);
                callbacks?.onSession?.(info);
            }
        }
    }
    catch {
        // Return empty list on error
    }
    return sessions;
}
/**
 * Manages conversation sessions as append-only trees stored in JSONL files.
 *
 * Each session entry has an id and parentId forming a tree structure. The "leaf"
 * pointer tracks the current position. Appending creates a child of the current leaf.
 * Branching moves the leaf to an earlier entry, allowing new branches without
 * modifying history.
 *
 * Use buildSessionContext() to get the resolved message list for the LLM, which
 * handles compaction summaries and follows the path from root to current leaf.
 */
export class SessionManager {
    sessionId = "";
    sessionFile;
    sessionDir;
    cwd;
    persist;
    flushed = false;
    fileEntries = [];
    byId = new Map();
    labelsById = new Map();
    labelTimestampsById = new Map();
    leafId = null;
    persistListeners = new Set();
    constructor(cwd, sessionDir, sessionFile, persist, preloadedEntries) {
        this.cwd = cwd;
        this.sessionDir = sessionDir;
        this.persist = persist;
        if (persist && sessionDir && !existsSync(sessionDir)) {
            mkdirSync(sessionDir, { recursive: true });
        }
        if (sessionFile) {
            this.setSessionFile(sessionFile, preloadedEntries);
        }
        else {
            this.newSession();
        }
    }
    /**
     * Switch to a different session file (used for resume and branching).
     * preloadedEntries must be loadEntriesFromFile(sessionFile) for the same path; it
     * lets the async daemon path skip the synchronous re-read.
     */
    setSessionFile(sessionFile, preloadedEntries) {
        this.sessionFile = resolve(sessionFile);
        if (existsSync(this.sessionFile)) {
            this.fileEntries = preloadedEntries ?? loadEntriesFromFile(this.sessionFile);
            // If file was empty or corrupted (no valid header), truncate and start fresh
            // to avoid appending messages without a session header (which breaks the session)
            if (this.fileEntries.length === 0) {
                const explicitPath = this.sessionFile;
                this.newSession();
                this.sessionFile = explicitPath;
                this._rewriteFile();
                this.flushed = true;
                return;
            }
            const header = this.fileEntries.find((e) => e.type === "session");
            this.sessionId = header?.id ?? createSessionId();
            let shouldRewrite = migrateToCurrentVersion(this.fileEntries);
            if (header?.parentSession && !isValidRlmDepth(header.rlmDepth)) {
                header.rlmDepth = resolveSessionRlmDepth(header, this.sessionFile);
                shouldRewrite = true;
            }
            if (shouldRewrite) {
                this._rewriteFile();
            }
            this._buildIndex();
            this.flushed = true;
        }
        else {
            const explicitPath = this.sessionFile;
            this.newSession();
            this.sessionFile = explicitPath; // preserve explicit path from --resume selector
        }
    }
    newSession(options) {
        let sessionId = options?.id ?? createSessionId();
        let sessionFile;
        const hasExplicitRlmDepth = options !== undefined && Object.hasOwn(options, "rlmDepth");
        let parentHeader;
        if (options?.parentSession && !hasExplicitRlmDepth) {
            try {
                parentHeader = readSessionHeader(options.parentSession);
            }
            catch {
                // Legacy-invalid or unavailable parents leave the child depth unknown.
            }
        }
        if (this.persist) {
            if (options?.id) {
                sessionFile = getSessionFilePath(this.getSessionDir(), sessionId);
                if (existsSync(sessionFile)) {
                    throw new Error(`Session file already exists for id "${sessionId}": ${sessionFile}`);
                }
            }
            else {
                const target = createUniqueSessionFileTarget(this.getSessionDir());
                sessionId = target.sessionId;
                sessionFile = target.sessionFile;
            }
        }
        this.sessionId = sessionId;
        const timestamp = new Date().toISOString();
        const git = this.persist ? (captureGitContext(this.cwd) ?? undefined) : undefined;
        const rlmDepth = hasExplicitRlmDepth
            ? options?.rlmDepth
            : options?.parentSession
                ? deriveChildRlmDepth(parentHeader)
                : rootRlmDepthFromEnv();
        const header = {
            type: "session",
            version: CURRENT_SESSION_VERSION,
            id: this.sessionId,
            timestamp,
            cwd: this.cwd,
            parentSession: options?.parentSession,
            rlmDepth,
            git,
        };
        this.fileEntries = [header];
        this.byId.clear();
        this.labelsById.clear();
        this.labelTimestampsById.clear();
        this.leafId = null;
        this.flushed = false;
        if (this.persist) {
            this.sessionFile = sessionFile;
        }
        return this.sessionFile;
    }
    _buildIndex() {
        this.byId.clear();
        this.labelsById.clear();
        this.labelTimestampsById.clear();
        this.leafId = null;
        for (const entry of this.fileEntries) {
            if (entry.type === "session")
                continue;
            this.byId.set(entry.id, entry);
            this.leafId = entry.id;
            if (entry.type === "label") {
                if (entry.label) {
                    this.labelsById.set(entry.targetId, entry.label);
                    this.labelTimestampsById.set(entry.targetId, entry.timestamp);
                }
                else {
                    this.labelsById.delete(entry.targetId);
                    this.labelTimestampsById.delete(entry.targetId);
                }
            }
        }
    }
    _rewriteFile() {
        if (!this.persist || !this.sessionFile)
            return;
        const content = `${this.fileEntries.map((e) => JSON.stringify(e)).join("\n")}\n`;
        const targetPath = realpathIfPresent(this.sessionFile);
        const directory = dirname(targetPath);
        mkdirSync(directory, { recursive: true });
        const tempPath = join(directory, `.${basename(targetPath)}.${process.pid}.${randomUUID()}.tmp`);
        try {
            const metadata = statMetadataIfPresent(targetPath);
            writeFileSync(tempPath, content, metadata === undefined ? undefined : { mode: metadata.mode });
            if (metadata !== undefined) {
                chownSync(tempPath, metadata.uid, metadata.gid);
                chmodSync(tempPath, metadata.mode);
            }
            renameSync(tempPath, targetPath);
        }
        finally {
            rmSync(tempPath, { force: true });
        }
        this._notifyPersistListeners();
    }
    _notifyPersistListeners() {
        if (!this.sessionFile) {
            return;
        }
        for (const listener of this.persistListeners) {
            try {
                listener(this.sessionFile);
            }
            catch {
                // Persistence observers must not break session writes.
            }
        }
    }
    onPersist(listener) {
        this.persistListeners.add(listener);
        return () => {
            this.persistListeners.delete(listener);
        };
    }
    isPersisted() {
        return this.persist;
    }
    getCwd() {
        return this.cwd;
    }
    getSessionDir() {
        return this.sessionDir;
    }
    getSessionId() {
        return this.sessionId;
    }
    getSessionFile() {
        return this.sessionFile;
    }
    materializeSessionFile(sessionDir) {
        if (this.sessionFile) {
            return this.sessionFile;
        }
        const dir = sessionDir ?? (this.sessionDir || getDefaultSessionDir(this.cwd));
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        const previousHeader = this.getHeader();
        const target = createUniqueSessionFileTarget(dir);
        this.sessionDir = dir;
        this.sessionId = target.sessionId;
        this.sessionFile = target.sessionFile;
        this.persist = true;
        const timestamp = new Date().toISOString();
        const git = captureGitContext(this.cwd) ?? undefined;
        const header = {
            type: "session",
            version: CURRENT_SESSION_VERSION,
            id: this.sessionId,
            timestamp,
            cwd: this.cwd,
            parentSession: previousHeader?.parentSession,
            rlmDepth: resolveSessionRlmDepth(previousHeader ?? {}, target.sessionFile),
            git,
        };
        this.fileEntries = [header, ...this.getEntries()];
        this._rewriteFile();
        this.flushed = true;
        return this.sessionFile;
    }
    getSessionArtifactDir() {
        return this.persist ? getSessionArtifactPath(this.sessionDir, this.sessionId) : undefined;
    }
    /**
     * Force-write all in-memory entries to the session file immediately.
     * This bypasses the no-assistant guard in {@link _persist} so that
     * pre-model entries (session header, goal state, settings changes)
     * are durable on disk before the first assistant response.
     * No-op for in-memory (non-persisted) sessions.
     */
    flushNow() {
        if (!this.persist || !this.sessionFile)
            return;
        if (this.flushed && existsSync(this.sessionFile))
            return;
        this._rewriteFile();
        this.flushed = true;
    }
    _persist(entry) {
        if (!this.persist || !this.sessionFile)
            return;
        const hasAssistant = this.fileEntries.some((e) => e.type === "message" && e.message.role === "assistant");
        const shouldPersistWithoutAssistant = entry.type === "session_state" || entry.type === "session_info";
        if (!hasAssistant && !shouldPersistWithoutAssistant) {
            // Mark as not flushed so when assistant arrives, all entries get written
            this.flushed = false;
            return;
        }
        if (!this.flushed || !existsSync(this.sessionFile)) {
            this._rewriteFile();
            this.flushed = true;
        }
        else {
            mkdirSync(dirname(this.sessionFile), { recursive: true });
            appendFileSync(this.sessionFile, `${JSON.stringify(entry)}\n`);
            this._notifyPersistListeners();
        }
    }
    _appendEntry(entry) {
        this.fileEntries.push(entry);
        this.byId.set(entry.id, entry);
        this.leafId = entry.id;
        this._persist(entry);
    }
    /** Append a message as child of current leaf, then advance leaf. Returns entry id.
     * Does not allow writing CompactionSummaryMessage and BranchSummaryMessage directly.
     * Reason: we want these to be top-level entries in the session, not message session entries,
     * so it is easier to find them.
     * These need to be appended via appendCompaction() and appendBranchSummary() methods.
     */
    appendMessage(message) {
        const entry = {
            type: "message",
            id: generateId(this.byId),
            parentId: this.leafId,
            timestamp: new Date().toISOString(),
            message,
        };
        this._appendEntry(entry);
        return entry.id;
    }
    /** Append a thinking level change as child of current leaf, then advance leaf. Returns entry id. */
    appendThinkingLevelChange(thinkingLevel) {
        const entry = {
            type: "thinking_level_change",
            id: generateId(this.byId),
            parentId: this.leafId,
            timestamp: new Date().toISOString(),
            thinkingLevel,
        };
        this._appendEntry(entry);
        return entry.id;
    }
    /** Append a service tier change as child of current leaf, then advance leaf. Returns entry id. */
    appendServiceTierChange(serviceTier) {
        const entry = {
            type: "service_tier_change",
            id: generateId(this.byId),
            parentId: this.leafId,
            timestamp: new Date().toISOString(),
            serviceTier,
        };
        this._appendEntry(entry);
        return entry.id;
    }
    /** Append a model change as child of current leaf, then advance leaf. Returns entry id. */
    appendModelChange(provider, modelId) {
        const entry = {
            type: "model_change",
            id: generateId(this.byId),
            parentId: this.leafId,
            timestamp: new Date().toISOString(),
            provider,
            modelId,
        };
        this._appendEntry(entry);
        return entry.id;
    }
    /** Append a compaction summary as child of current leaf, then advance leaf. Returns entry id. */
    appendCompaction(summary, firstKeptEntryId, tokensBefore, details, fromHook, customInstructions) {
        const entry = {
            type: "compaction",
            id: generateId(this.byId),
            parentId: this.leafId,
            timestamp: new Date().toISOString(),
            summary,
            firstKeptEntryId,
            tokensBefore,
            details,
            fromHook,
            customInstructions,
        };
        this._appendEntry(entry);
        return entry.id;
    }
    /** Append a custom entry (for extensions) as child of current leaf, then advance leaf. Returns entry id. */
    appendCustomEntry(customType, data) {
        const entry = {
            type: "custom",
            customType,
            data,
            id: generateId(this.byId),
            parentId: this.leafId,
            timestamp: new Date().toISOString(),
        };
        this._appendEntry(entry);
        return entry.id;
    }
    /** Append a custom entry and undo its in-memory index if persistence fails. */
    appendCustomEntryWithRollback(customType, data) {
        return this._appendEntryWithRollback(() => this.appendCustomEntry(customType, data));
    }
    /** Append an RLM child usage attribution and update the parent assistant aggregate in memory. */
    appendChildUsageAttribution(targetId, childUsage, aggregateUsage, origin) {
        const target = this.byId.get(targetId);
        if (target?.type !== "message" || target.message.role !== "assistant") {
            throw new Error(`Assistant message entry ${targetId} not found`);
        }
        target.message.usage = cloneUsage(aggregateUsage);
        const entry = {
            type: "child_usage_attributed",
            id: generateId(this.byId),
            parentId: this.leafId,
            timestamp: new Date().toISOString(),
            targetId,
            childUsage: cloneUsage(childUsage),
            aggregateUsage: cloneUsage(aggregateUsage),
            ...(origin ? { origin } : {}),
        };
        this._appendEntry(entry);
        return entry.id;
    }
    /** Append a session info entry (e.g., display name). Returns entry id. */
    appendSessionInfo(name) {
        const entry = {
            type: "session_info",
            id: generateId(this.byId),
            parentId: this.leafId,
            timestamp: new Date().toISOString(),
            name: name.trim(),
        };
        this._appendEntry(entry);
        return entry.id;
    }
    /** Append a session lifecycle state entry. Returns entry id. */
    appendSessionState(state) {
        const entry = {
            type: "session_state",
            id: generateId(this.byId),
            parentId: this.leafId,
            timestamp: new Date().toISOString(),
            state: { status: state.status },
        };
        this._appendEntry(entry);
        return entry.id;
    }
    /** Get the current session name from the latest session_info entry, if any. */
    getSessionName() {
        // Walk entries in reverse to find the latest session_info entry.
        // Empty names explicitly clear the session title.
        const entries = this.getEntries();
        for (let i = entries.length - 1; i >= 0; i--) {
            const entry = entries[i];
            if (entry.type === "session_info") {
                return entry.name?.trim() || undefined;
            }
        }
        return undefined;
    }
    /** Get the current session lifecycle state from the latest session_state entry, if any. */
    getSessionState() {
        const entries = this.getEntries();
        for (let i = entries.length - 1; i >= 0; i--) {
            const entry = entries[i];
            if (entry.type === "session_state") {
                const status = normalizeSessionStateStatus(entry.state.status);
                if (status) {
                    return { status };
                }
            }
        }
        return undefined;
    }
    /**
     * True when the session holds user-meaningful persisted content, as opposed to
     * only daemon-written bookkeeping (session_state, agent_status, git_state) or
     * the default model/thinking entries every new session is created with. Used by
     * the daemon discard guard to decide whether a message-less draft is safe to
     * delete (that guard always also requires zero messages).
     *
     * createAgentSession opens a new session with an optional leading `model_change`
     * followed by `thinking_level_change` and `service_tier_change`. That creation
     * prefix is skipped; anything beyond it is user content.
     */
    hasUserContent() {
        const contentEntries = this.getEntries().filter((entry) => CONTENT_ENTRY_TYPES.has(entry.type));
        let start = 0;
        if (contentEntries[start]?.type === "model_change") {
            start++;
        }
        if (contentEntries[start]?.type === "thinking_level_change") {
            start++;
        }
        if (contentEntries[start]?.type === "service_tier_change") {
            start++;
        }
        return contentEntries.length > start;
    }
    /** Append the latest agent status (summary + completion judgment). Returns entry id. */
    appendAgentStatus(status) {
        const entry = {
            type: "agent_status",
            id: generateId(this.byId),
            parentId: this.leafId,
            timestamp: new Date().toISOString(),
            status: {
                summary: status.summary,
                taskState: status.taskState,
                basedOnMessageCount: status.basedOnMessageCount,
            },
        };
        this._appendEntry(entry);
        return entry.id;
    }
    /** Append a git state entry as child of current leaf, then advance leaf. Returns entry id. */
    appendGitState(git) {
        const entry = {
            type: "git_state",
            id: generateId(this.byId),
            parentId: this.leafId,
            timestamp: new Date().toISOString(),
            git,
        };
        this._appendEntry(entry);
        return entry.id;
    }
    recordGitStateIfChanged() {
        if (!this.persist)
            return undefined;
        const git = captureGitContext(this.cwd);
        if (!git)
            return undefined;
        const last = this.getActiveGitContext();
        if (last && gitContextsEqual(last, git))
            return undefined;
        return this.appendGitState(git);
    }
    /** Active-branch git: nearest git_state from leaf to root, else the header snapshot. */
    getActiveGitContext() {
        let current = this.leafId ? this.byId.get(this.leafId) : undefined;
        while (current) {
            if (current.type === "git_state")
                return current.git;
            current = current.parentId ? this.byId.get(current.parentId) : undefined;
        }
        const header = this.fileEntries[0];
        return header?.type === "session" ? header.git : undefined;
    }
    /** Get the latest agent status from the most recent agent_status entry, if any. */
    getLatestAgentStatus() {
        // Walk the current leaf to root so we only read status on the active branch,
        // not a sibling branch's status that happens to sit later in the file.
        let current = this.leafId ? this.byId.get(this.leafId) : undefined;
        while (current) {
            if (current.type === "agent_status") {
                return { ...current.status };
            }
            current = current.parentId ? this.byId.get(current.parentId) : undefined;
        }
        return undefined;
    }
    /**
     * Append a custom message entry (for extensions) that participates in LLM context.
     * @param customType Extension identifier for filtering on reload
     * @param content Message content (string or TextContent/ImageContent array)
     * @param display Whether to show in TUI (true = styled display, false = hidden)
     * @param details Optional extension-specific metadata (not sent to LLM)
     * @returns Entry id
     */
    appendCustomMessageEntry(customType, content, display, details) {
        const entry = {
            type: "custom_message",
            customType,
            content,
            display,
            details,
            id: generateId(this.byId),
            parentId: this.leafId,
            timestamp: new Date().toISOString(),
        };
        this._appendEntry(entry);
        return entry.id;
    }
    /**
     * Append a custom message, undoing the append if persistence fails so a
     * best-effort record never leaves an unsaved leaf for later entries.
     */
    appendCustomMessageEntryWithRollback(customType, content, display, details) {
        return this._appendEntryWithRollback(() => this.appendCustomMessageEntry(customType, content, display, details));
    }
    _appendEntryWithRollback(append) {
        const previousLeafId = this.leafId;
        try {
            const entryId = append();
            this.flushNow();
            return entryId;
        }
        catch (error) {
            // The append indexes the entry before persisting it; undo exactly that.
            if (this.leafId !== null && this.leafId !== previousLeafId) {
                this.byId.delete(this.leafId);
                this.fileEntries.pop();
                this.leafId = previousLeafId;
                // The failed append may have left a torn line on disk. Restore the file
                // from the rolled-back entries now; if that also fails (e.g. the disk is
                // still full), fall back to forcing the next persist to rewrite.
                this.flushed = false;
                try {
                    this.flushNow();
                }
                catch {
                    this.flushed = false;
                }
            }
            throw error;
        }
    }
    // =========================================================================
    // Tree Traversal
    // =========================================================================
    getLeafId() {
        return this.leafId;
    }
    getLeafEntry() {
        return this.leafId ? this.byId.get(this.leafId) : undefined;
    }
    getEntry(id) {
        return this.byId.get(id);
    }
    /**
     * Get all direct children of an entry.
     */
    getChildren(parentId) {
        const children = [];
        for (const entry of this.byId.values()) {
            if (entry.parentId === parentId) {
                children.push(entry);
            }
        }
        return children;
    }
    /**
     * Get the label for an entry, if any.
     */
    getLabel(id) {
        return this.labelsById.get(id);
    }
    /**
     * Set or clear a label on an entry.
     * Labels are user-defined markers for bookmarking/navigation.
     * Pass undefined or empty string to clear the label.
     */
    appendLabelChange(targetId, label) {
        if (!this.byId.has(targetId)) {
            throw new Error(`Entry ${targetId} not found`);
        }
        const entry = {
            type: "label",
            id: generateId(this.byId),
            parentId: this.leafId,
            timestamp: new Date().toISOString(),
            targetId,
            label,
        };
        this._appendEntry(entry);
        if (label) {
            this.labelsById.set(targetId, label);
            this.labelTimestampsById.set(targetId, entry.timestamp);
        }
        else {
            this.labelsById.delete(targetId);
            this.labelTimestampsById.delete(targetId);
        }
        return entry.id;
    }
    /**
     * Walk from entry to root, returning all entries in path order.
     * Includes all entry types (messages, compaction, model changes, etc.).
     * Use buildSessionContext() to get the resolved messages for the LLM.
     */
    getBranch(fromId) {
        // push+reverse, not unshift-per-entry: unshift is O(n), which makes this O(n^2) on long sessions.
        const path = [];
        const startId = fromId ?? this.leafId;
        let current = startId ? this.byId.get(startId) : undefined;
        while (current) {
            path.push(current);
            current = current.parentId ? this.byId.get(current.parentId) : undefined;
        }
        path.reverse();
        return path;
    }
    /**
     * Build the session context (what gets sent to the LLM).
     * Uses tree traversal from current leaf.
     */
    buildSessionContext() {
        // Pass fileEntries directly rather than getEntries(): the resolved context
        // is computed from the leaf-to-root walk over byId (which already excludes
        // the header), so the entries argument is only a fallback for an undefined
        // leaf — never hit here since leafId is always set or null. Avoids an O(n)
        // array copy on every call (attach, get_session_context, agent init, ...).
        return buildSessionContext(this.fileEntries, this.leafId, this.byId);
    }
    /**
     * Get session header.
     */
    getHeader() {
        const h = this.fileEntries.find((e) => e.type === "session");
        return h ? h : null;
    }
    /**
     * Get all session entries (excludes header). Returns a shallow copy.
     * The session is append-only: use appendXXX() to add entries, branch() to
     * change the leaf pointer. Entries cannot be modified or deleted.
     */
    getEntries() {
        return this.fileEntries.filter((e) => e.type !== "session");
    }
    /**
     * Get the session as a tree structure. Returns a shallow defensive copy of all entries.
     * A well-formed session has exactly one root (first entry with parentId === null).
     * Orphaned entries (broken parent chain) are also returned as roots.
     */
    getFlatTree() {
        return this.getEntries().map((entry) => ({
            entry,
            label: this.labelsById.get(entry.id),
            labelTimestamp: this.labelTimestampsById.get(entry.id),
        }));
    }
    getTree() {
        const entries = this.getFlatTree();
        const nodeMap = new Map();
        const roots = [];
        // Create nodes with resolved labels
        for (const flatNode of entries) {
            nodeMap.set(flatNode.entry.id, { ...flatNode, children: [] });
        }
        // Build tree
        for (const flatNode of entries) {
            const entry = flatNode.entry;
            const node = nodeMap.get(entry.id);
            if (entry.parentId === null || entry.parentId === entry.id) {
                roots.push(node);
            }
            else {
                const parent = nodeMap.get(entry.parentId);
                if (parent) {
                    parent.children.push(node);
                }
                else {
                    // Orphan - treat as root
                    roots.push(node);
                }
            }
        }
        // Sort children by timestamp (oldest first, newest at bottom)
        // Use iterative approach to avoid stack overflow on deep trees
        const stack = [...roots];
        while (stack.length > 0) {
            const node = stack.pop();
            node.children.sort((a, b) => new Date(a.entry.timestamp).getTime() - new Date(b.entry.timestamp).getTime());
            stack.push(...node.children);
        }
        return roots;
    }
    // =========================================================================
    // Branching
    // =========================================================================
    /**
     * Start a new branch from an earlier entry.
     * Moves the leaf pointer to the specified entry. The next appendXXX() call
     * will create a child of that entry, forming a new branch. Existing entries
     * are not modified or deleted.
     */
    branch(branchFromId) {
        if (!this.byId.has(branchFromId)) {
            throw new Error(`Entry ${branchFromId} not found`);
        }
        this.leafId = branchFromId;
    }
    /**
     * Reset the leaf pointer to null (before any entries).
     * The next appendXXX() call will create a new root entry (parentId = null).
     * Use this when navigating to re-edit the first user message.
     */
    resetLeaf() {
        this.leafId = null;
    }
    /**
     * Start a new branch with a summary of the abandoned path.
     * Same as branch(), but also appends a branch_summary entry that captures
     * context from the abandoned conversation path.
     */
    branchWithSummary(branchFromId, summary, details, fromHook) {
        if (branchFromId !== null && !this.byId.has(branchFromId)) {
            throw new Error(`Entry ${branchFromId} not found`);
        }
        this.leafId = branchFromId;
        const entry = {
            type: "branch_summary",
            id: generateId(this.byId),
            parentId: branchFromId,
            timestamp: new Date().toISOString(),
            fromId: branchFromId ?? "root",
            summary,
            details,
            fromHook,
        };
        this._appendEntry(entry);
        return entry.id;
    }
    /**
     * Create a new session file containing only the path from root to the specified leaf.
     * Useful for extracting a single conversation path from a branched session.
     * Returns the new session file path, or undefined if not persisting.
     */
    createBranchedSession(leafId) {
        const previousSessionFile = this.sessionFile;
        const path = this.getBranch(leafId);
        if (path.length === 0) {
            throw new Error(`Entry ${leafId} not found`);
        }
        // Filter out LabelEntry from path - we'll recreate them from the resolved map
        const pathWithoutLabels = path.filter((e) => e.type !== "label");
        const target = this.persist
            ? createUniqueSessionFileTarget(this.getSessionDir())
            : { sessionId: createSessionId(), sessionFile: undefined };
        const newSessionId = target.sessionId;
        const timestamp = new Date().toISOString();
        const newSessionFile = target.sessionFile;
        const header = {
            type: "session",
            version: CURRENT_SESSION_VERSION,
            id: newSessionId,
            timestamp,
            cwd: this.cwd,
            parentSession: this.persist ? previousSessionFile : undefined,
            rlmDepth: resolveSessionRlmDepth(this.getHeader() ?? {}, previousSessionFile ?? newSessionFile ?? ""),
            git: this.persist ? (captureGitContext(this.cwd) ?? undefined) : undefined,
        };
        // Collect labels for entries in the path
        const pathEntryIds = new Set(pathWithoutLabels.map((e) => e.id));
        const labelsToWrite = [];
        for (const [targetId, label] of this.labelsById) {
            if (pathEntryIds.has(targetId)) {
                labelsToWrite.push({ targetId, label, timestamp: this.labelTimestampsById.get(targetId) });
            }
        }
        if (this.persist) {
            // Build label entries
            const lastEntryId = pathWithoutLabels[pathWithoutLabels.length - 1]?.id || null;
            let parentId = lastEntryId;
            const labelEntries = [];
            for (const { targetId, label, timestamp: labelTimestamp } of labelsToWrite) {
                const labelEntry = {
                    type: "label",
                    id: generateId(new Set(pathEntryIds)),
                    parentId,
                    timestamp: labelTimestamp,
                    targetId,
                    label,
                };
                pathEntryIds.add(labelEntry.id);
                labelEntries.push(labelEntry);
                parentId = labelEntry.id;
            }
            this.fileEntries = [header, ...pathWithoutLabels, ...labelEntries];
            this.sessionId = newSessionId;
            this.sessionFile = newSessionFile;
            this._buildIndex();
            // Only write the file now if it contains an assistant message.
            // Otherwise defer to _persist(), which creates the file on the
            // first assistant response, matching the newSession() contract
            // and avoiding the duplicate-header bug when _persist()'s
            // no-assistant guard later resets flushed to false.
            const hasAssistant = this.fileEntries.some((e) => e.type === "message" && e.message.role === "assistant");
            if (hasAssistant) {
                this._rewriteFile();
                this.flushed = true;
            }
            else {
                this.flushed = false;
            }
            return newSessionFile;
        }
        // In-memory mode: replace current session with the path + labels
        const labelEntries = [];
        let parentId = pathWithoutLabels[pathWithoutLabels.length - 1]?.id || null;
        for (const { targetId, label, timestamp: labelTimestamp } of labelsToWrite) {
            const labelEntry = {
                type: "label",
                id: generateId(new Set([...pathEntryIds, ...labelEntries.map((e) => e.id)])),
                parentId,
                timestamp: labelTimestamp,
                targetId,
                label,
            };
            labelEntries.push(labelEntry);
            parentId = labelEntry.id;
        }
        this.fileEntries = [header, ...pathWithoutLabels, ...labelEntries];
        this.sessionId = newSessionId;
        this._buildIndex();
        return undefined;
    }
    /**
     * Create a new session.
     * @param cwd Working directory (stored in session header)
     * @param sessionDir Optional session directory. If omitted, uses the configured session root.
     */
    static create(cwd, sessionDir) {
        const dir = sessionDir ?? getDefaultSessionDir(cwd);
        return new SessionManager(cwd, dir, undefined, true);
    }
    /**
     * Open a specific session file.
     * @param path Path to session file
     * @param sessionDir Optional session directory for /new or /branch. If omitted, derives from file's parent.
     * @param cwdOverride Optional cwd override instead of the session header cwd.
     */
    static open(path, sessionDir, cwdOverride) {
        // Only the header's cwd is needed to construct the manager; the constructor
        // (setSessionFile) performs the full parse. Read just the first line here
        // instead of parsing the entire file a second time — that double parse is a
        // needless O(n) cost on open and is noticeable for long sessions.
        let cwd = cwdOverride;
        if (cwd === undefined) {
            let header;
            try {
                header = readSessionHeader(path);
            }
            catch {
                header = undefined;
            }
            // readSessionHeader only inspects the first physical line. If that isn't a
            // valid session header (e.g. a leading blank/whitespace or malformed line),
            // fall back to the full loader, which trims and skips such lines exactly
            // like setSessionFile does — so this.cwd stays consistent with the header
            // the session is actually loaded with. This slow path is rare.
            if (header?.type !== "session" || typeof header.id !== "string") {
                header = loadEntriesFromFile(path).find((e) => e.type === "session");
            }
            cwd = header?.cwd;
        }
        // If no sessionDir provided, derive from file's parent directory
        const dir = sessionDir ?? resolve(path, "..");
        return new SessionManager(cwd ?? process.cwd(), dir, path, true);
    }
    /**
     * Non-blocking open() for the daemon: parses off the event loop so a large load
     * doesn't freeze other sessions. Falls back to open() for any non-happy path so
     * behavior is identical to it.
     */
    static async openAsync(path, sessionDir, cwdOverride) {
        if (!existsSync(path)) {
            return SessionManager.open(path, sessionDir, cwdOverride);
        }
        const entries = await loadEntriesFromFileAsync(path);
        // empty/corrupt: defer to open() (finalizeLoadedEntries guarantees entries[0] is a valid header otherwise)
        if (entries.length === 0) {
            return SessionManager.open(path, sessionDir, cwdOverride);
        }
        const cwd = cwdOverride ?? entries[0].cwd;
        const dir = sessionDir ?? resolve(path, "..");
        return new SessionManager(cwd ?? process.cwd(), dir, path, true, entries);
    }
    /**
     * Continue the most recent session, or create new if none.
     * @param cwd Working directory
     * @param sessionDir Optional session directory. If omitted, uses the configured session root.
     */
    static continueRecent(cwd, sessionDir) {
        const dir = sessionDir ?? getDefaultSessionDir(cwd);
        const mostRecent = findMostRecentSessionForCwd(dir, cwd);
        if (mostRecent) {
            return new SessionManager(cwd, dir, mostRecent, true);
        }
        return new SessionManager(cwd, dir, undefined, true);
    }
    /** Create an in-memory session (no file persistence) */
    static inMemory(cwd = process.cwd(), sessionDir = "") {
        return new SessionManager(cwd, sessionDir, undefined, false);
    }
    /**
     * Fork a session from another project directory into the current project.
     * Creates a new session in the target cwd with the full history from the source session.
     * @param sourcePath Path to the source session file
     * @param targetCwd Target working directory (where the new session will be stored)
     * @param sessionDir Optional session directory. If omitted, uses default for targetCwd.
     */
    static forkFrom(sourcePath, targetCwd, sessionDir) {
        const sourceEntries = loadEntriesFromFile(sourcePath);
        if (sourceEntries.length === 0) {
            throw new Error(`Cannot fork: source session file is empty or invalid: ${sourcePath}`);
        }
        const sourceHeader = sourceEntries.find((e) => e.type === "session");
        if (!sourceHeader) {
            throw new Error(`Cannot fork: source session has no header: ${sourcePath}`);
        }
        migrateToCurrentVersion(sourceEntries);
        const dir = sessionDir ?? getDefaultSessionDir(targetCwd);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        // Create new session file with new ID but forked content
        const target = createUniqueSessionFileTarget(dir);
        const newSessionId = target.sessionId;
        const timestamp = new Date().toISOString();
        const newSessionFile = target.sessionFile;
        // Write new header pointing to source as parent, with updated cwd
        const newHeader = {
            type: "session",
            version: CURRENT_SESSION_VERSION,
            id: newSessionId,
            timestamp,
            cwd: targetCwd,
            parentSession: sourcePath,
            rlmDepth: resolveSessionRlmDepth(sourceHeader, sourcePath),
            git: captureGitContext(targetCwd) ?? undefined,
        };
        appendFileSync(newSessionFile, `${JSON.stringify(newHeader)}\n`);
        // Drop the source's git_state entries (re-linking children): they describe the source repo,
        // so the fork would otherwise report the source's git instead of its own target context.
        const droppedParent = new Map();
        for (const entry of sourceEntries) {
            if (entry.type === "git_state")
                droppedParent.set(entry.id, entry.parentId);
        }
        const liveParent = (parentId) => {
            let pid = parentId;
            while (pid !== null && droppedParent.has(pid))
                pid = droppedParent.get(pid) ?? null;
            return pid;
        };
        for (const entry of sourceEntries) {
            if (entry.type === "session" || entry.type === "git_state")
                continue;
            const parentId = liveParent(entry.parentId);
            const out = parentId === entry.parentId ? entry : { ...entry, parentId };
            appendFileSync(newSessionFile, `${JSON.stringify(out)}\n`);
        }
        return new SessionManager(targetCwd, dir, newSessionFile, true);
    }
    /**
     * List all sessions for a directory.
     * @param cwd Working directory (used to compute default session directory)
     * @param sessionDir Optional session directory. If omitted, uses the configured session root.
     * @param callbacks Optional callbacks for progress and discovered sessions
     */
    static async list(cwd, sessionDir, callbacks) {
        const dir = sessionDir ?? getDefaultSessionDir(cwd);
        const matchesCwd = (session) => sessionInfoMatchesCwd(session, cwd);
        const sessions = (await listSessionsFromDir(dir, {
            onProgress: callbacks?.onProgress,
            onSession: callbacks?.onSession
                ? (session) => {
                    if (matchesCwd(session)) {
                        callbacks.onSession?.(session);
                    }
                }
                : undefined,
        })).filter(matchesCwd);
        sessions.sort((a, b) => b.modified.getTime() - a.modified.getTime());
        return sessions;
    }
    /**
     * List all sessions across all project directories.
     * @param callbacks Optional callbacks for progress and discovered sessions
     * @param sessionDir Optional session root. If omitted, uses the configured session root.
     */
    static async listAll(callbacks, sessionDir) {
        const sessionsDir = sessionDir ?? getSessionsDir();
        const sessions = await listSessionsFromDir(sessionsDir, callbacks);
        sessions.sort((a, b) => b.modified.getTime() - a.modified.getTime());
        return sessions;
    }
}
//# sourceMappingURL=session-manager.js.map
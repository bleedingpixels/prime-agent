import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { calculateContextTokens, estimateContextTokens } from "./compaction/index.js";
import { buildSessionContext, loadEntriesFromFile } from "./session-manager.js";
import { addAssistantUsage, cloneUsage, emptyUsage, subtractAssistantUsage } from "./usage.js";
function isAssistantEntry(entry) {
    return entry.type === "message" && entry.message.role === "assistant";
}
function readUserMessageText(content) {
    if (typeof content === "string") {
        return content;
    }
    if (!Array.isArray(content)) {
        return "";
    }
    return content
        .filter((block) => typeof block === "object" &&
        block !== null &&
        block.type === "text" &&
        typeof block.text === "string")
        .map((block) => block.text)
        .join("\n");
}
/** Compact a prompt into a one-line label, mirroring compactRlmText in agent-session.ts. */
function compactLabel(text, maxLength = 80) {
    const compact = text.replace(/\s+/g, " ").trim();
    if (compact.length <= maxLength) {
        return compact;
    }
    return `${compact.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
/**
 * Usage totals for one agent: `totalUsage` sums the branch's assistant usage
 * (attributed aggregates, so descendants are included), `ownUsage` removes the
 * attributions targeting those assistants. Attribution entries are matched by
 * target across ALL entries, not just the branch: attributions rewrite the
 * target assistant's usage no matter which branch they were appended on, so a
 * fork that keeps the assistant but drops the attribution entry must still
 * subtract it.
 *
 * Totals are deliberately cumulative across compactions: compaction shrinks
 * the model-facing context, not what the session has spent, so assistants
 * dropped from the resolved context still count here.
 */
export function computeOwnAndTotalUsage(branch, allEntries) {
    const totalUsage = emptyUsage();
    const branchAssistantIds = new Set();
    for (const entry of branch) {
        if (isAssistantEntry(entry)) {
            branchAssistantIds.add(entry.id);
            addAssistantUsage(totalUsage, entry.message.usage);
        }
    }
    const ownUsage = cloneUsage(totalUsage);
    for (const entry of allEntries) {
        if (entry.type === "child_usage_attributed" && branchAssistantIds.has(entry.targetId)) {
            subtractAssistantUsage(ownUsage, entry.childUsage);
        }
    }
    return { ownUsage, totalUsage };
}
/**
 * Current context utilization from persisted entries, mirroring
 * AgentSession.getContextUsage(): unknown right after a compaction until the
 * next assistant response, otherwise the last assistant usage plus an
 * estimate for trailing messages (tool results, queued user input) that have
 * not hit the model yet.
 */
function computeContextUsageFromEntries(allEntries, branch, contextWindow) {
    if (!contextWindow || contextWindow <= 0) {
        return undefined;
    }
    let latestCompactionIndex = -1;
    for (let i = branch.length - 1; i >= 0; i--) {
        if (branch[i].type === "compaction") {
            latestCompactionIndex = i;
            break;
        }
    }
    if (latestCompactionIndex >= 0) {
        let hasPostCompactionUsage = false;
        for (let i = branch.length - 1; i > latestCompactionIndex; i--) {
            const entry = branch[i];
            if (!isAssistantEntry(entry)) {
                continue;
            }
            const assistant = entry.message;
            if (assistant.stopReason === "aborted" || assistant.stopReason === "error") {
                continue;
            }
            if (calculateContextTokens(assistant.usage) > 0) {
                hasPostCompactionUsage = true;
            }
            break;
        }
        if (!hasPostCompactionUsage) {
            return { tokens: null, contextWindow, percent: null };
        }
    }
    const estimate = estimateContextTokens(buildSessionContext(allEntries).messages);
    if (estimate.tokens <= 0) {
        return undefined;
    }
    return { tokens: estimate.tokens, contextWindow, percent: (estimate.tokens / contextWindow) * 100 };
}
function sessionEntriesFromFile(file) {
    return loadEntriesFromFile(file).filter((entry) => entry.type !== "session");
}
/**
 * Entries on the current branch, root to leaf, mirroring
 * SessionManager.getBranch(): the leaf is the last appended entry and the
 * branch is its parentId chain. Keeps forked/abandoned paths out of usage
 * sums so disk nodes match what a live session would report.
 */
function branchEntries(entries) {
    if (entries.length === 0) {
        return [];
    }
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    const branch = [];
    const seen = new Set();
    let current = entries[entries.length - 1];
    while (current && !seen.has(current.id)) {
        seen.add(current.id);
        branch.push(current);
        current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return branch.reverse();
}
/**
 * Terminal status for a persisted child, inferred from how its last assistant
 * turn ended: errored and aborted runs should not render as successful.
 */
function statusFromBranch(entries) {
    for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        if (!isAssistantEntry(entry)) {
            continue;
        }
        if (entry.message.stopReason === "error") {
            return "error";
        }
        if (entry.message.stopReason === "aborted") {
            return "cancelled";
        }
        return "done";
    }
    return "done";
}
function findSessionFile(dir) {
    let newest;
    for (const name of readdirSync(dir)) {
        if (!name.endsWith(".jsonl")) {
            continue;
        }
        const path = join(dir, name);
        try {
            const mtime = statSync(path).mtime.getTime();
            if (!newest || mtime > newest.mtime) {
                newest = { path, mtime };
            }
        }
        catch {
            // Skip unreadable files.
        }
    }
    return newest?.path;
}
function listChildSessionDirs(rlmSessionDir) {
    let names;
    try {
        names = readdirSync(rlmSessionDir);
    }
    catch {
        return [];
    }
    return names
        .filter((name) => name.startsWith("sub-"))
        .map((name) => join(rlmSessionDir, name))
        .filter((path) => {
        try {
            return statSync(path).isDirectory();
        }
        catch {
            return false;
        }
    })
        .sort((a, b) => {
        try {
            return statSync(a).mtime.getTime() - statSync(b).mtime.getTime();
        }
        catch {
            return 0;
        }
    });
}
/**
 * Build a context node for a completed RLM child from its persisted session
 * dir (sub-xxxx/). Children that already attributed grandchild usage carry the
 * aggregate on their assistant messages (applyChildUsageAttributions), so own
 * usage is recovered by subtracting the attribution entries. Returns undefined
 * when the dir holds no readable session.
 */
export function loadContextTreeChildFromDisk(childSessionDir, resolveContextWindow) {
    const sessionFile = findSessionFile(childSessionDir);
    if (!sessionFile) {
        return undefined;
    }
    const allEntries = sessionEntriesFromFile(sessionFile);
    const branch = branchEntries(allEntries);
    if (branch.length === 0) {
        return undefined;
    }
    const { ownUsage, totalUsage } = computeOwnAndTotalUsage(branch, allEntries);
    let model;
    for (const entry of branch) {
        if (entry.type === "model_change") {
            model = { provider: entry.provider, id: entry.modelId };
        }
    }
    let label = "";
    for (const entry of branch) {
        if (entry.type === "message" && entry.message.role === "user") {
            label = compactLabel(readUserMessageText(entry.message.content));
            if (label) {
                break;
            }
        }
    }
    const contextWindow = model ? resolveContextWindow(model.provider, model.id) : undefined;
    return {
        id: basename(childSessionDir),
        label: label || "child agent",
        status: statusFromBranch(branch),
        model,
        ownUsage,
        totalUsage,
        contextUsage: computeContextUsageFromEntries(allEntries, branch, contextWindow),
        children: loadContextTreeChildrenFromDisk(childSessionDir, resolveContextWindow),
    };
}
/**
 * Build context nodes for all persisted RLM children under an RLM session
 * dir, recursing into nested sub-* dirs for grandchildren. `skipIds`
 * excludes children that are already represented live.
 */
export function loadContextTreeChildrenFromDisk(rlmSessionDir, resolveContextWindow, skipIds) {
    if (!rlmSessionDir || !existsSync(rlmSessionDir)) {
        return [];
    }
    const nodes = [];
    for (const childDir of listChildSessionDirs(rlmSessionDir)) {
        if (skipIds?.has(basename(childDir))) {
            continue;
        }
        const node = loadContextTreeChildFromDisk(childDir, resolveContextWindow);
        if (node) {
            nodes.push(node);
        }
    }
    return nodes;
}
//# sourceMappingURL=context-tree.js.map
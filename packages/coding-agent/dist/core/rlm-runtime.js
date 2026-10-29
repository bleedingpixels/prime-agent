const RLM_SUBAGENT_SESSION_NAME_MAX_LENGTH = 64;
export const DEFAULT_RLM_MODEL_SEARCH_LIMIT = 8;
export const MAX_RLM_MODEL_SEARCH_LIMIT = 20;
/** Validate and normalize an orchestrator-supplied subagent session name. */
export function normalizeRequestedRlmSubagentSessionName(value) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new Error("rlm.run name must be a string");
    }
    const name = value.trim();
    if (!name) {
        throw new Error("rlm.run name must not be empty");
    }
    if (name.length > RLM_SUBAGENT_SESSION_NAME_MAX_LENGTH) {
        throw new Error(`rlm.run name must be at most ${RLM_SUBAGENT_SESSION_NAME_MAX_LENGTH} characters`);
    }
    return name;
}
/** Validate and normalize an orchestrator-supplied subagent model reference. */
export function normalizeRequestedRlmSubagentModel(value) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new Error("rlm.run model must be a string");
    }
    const model = value.trim();
    if (!model) {
        throw new Error("rlm.run model must not be empty");
    }
    return model;
}
/** Create a readable, collision-resistant default name usable as an agent-message selector. */
export function createDefaultRlmSubagentSessionName(prompt, childId) {
    const promptSlug = prompt
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const idSuffix = childId
        .replace(/^sub-/, "")
        .replace(/[^A-Za-z0-9]+/g, "")
        .slice(-8) || "child";
    const fixedLength = "subagent--".length + idSuffix.length;
    const promptPart = (promptSlug || "worker")
        .slice(0, Math.max(1, RLM_SUBAGENT_SESSION_NAME_MAX_LENGTH - fixedLength))
        .replace(/-+$/g, "");
    return `subagent-${promptPart || "worker"}-${idSuffix}`;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalizeModelSearchText(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
export function findRlmModelMatches(query, models, limit) {
    const normalizedQuery = normalizeModelSearchText(query.trim());
    return models
        .map((model) => {
        const selector = `${model.provider}/${model.id}`;
        const fields = [selector, model.id, model.name || model.id];
        const normalizedFields = fields.map(normalizeModelSearchText);
        let score = normalizedQuery ? Number.POSITIVE_INFINITY : 0;
        if (normalizedQuery) {
            const exactIndex = normalizedFields.indexOf(normalizedQuery);
            const prefixIndex = normalizedFields.findIndex((field) => field.startsWith(normalizedQuery));
            const partialIndex = normalizedFields.findIndex((field) => field.includes(normalizedQuery));
            if (exactIndex >= 0)
                score = exactIndex;
            else if (prefixIndex >= 0)
                score = 3 + prefixIndex;
            else if (partialIndex >= 0)
                score = 6 + partialIndex;
        }
        return { model, selector, score };
    })
        .filter((candidate) => Number.isFinite(candidate.score))
        .sort((a, b) => a.score - b.score || a.selector.localeCompare(b.selector))
        .slice(0, limit)
        .map(({ model, selector }) => ({
        provider: model.provider,
        id: model.id,
        name: model.name || model.id,
        selector,
    }));
}
/** Adapt an RlmRunHandler into the typed "rlm.run" handler for the kernel host bridge. */
export function createRlmRunHostHandler(handler) {
    return async (payload) => {
        if (typeof payload.prompt !== "string") {
            throw new Error("rlm.run prompt must be a string");
        }
        const kwargs = isRecord(payload.kwargs) ? payload.kwargs : {};
        const cellSourceCode = typeof payload.cellSourceCode === "string" ? payload.cellSourceCode : undefined;
        const result = await handler({
            prompt: payload.prompt,
            kwargs,
            cellSourceCode,
        });
        return result;
    };
}
/** Search a bounded authenticated model catalog without adding it to the system prompt. */
export function createRlmFindModelsHostHandler(handler) {
    return async (payload) => {
        if (typeof payload.query !== "string") {
            throw new Error("rlm.find_models query must be a string");
        }
        const limit = payload.limit === undefined ? DEFAULT_RLM_MODEL_SEARCH_LIMIT : payload.limit;
        if (!Number.isInteger(limit) || limit < 1 || limit > MAX_RLM_MODEL_SEARCH_LIMIT) {
            throw new Error(`rlm.find_models limit must be an integer from 1 to ${MAX_RLM_MODEL_SEARCH_LIMIT}`);
        }
        return { models: (await handler(payload.query, limit)).models };
    };
}
/** Expose the current parent session's RLM child registry to its kernel. */
export function createRlmListSubagentsHostHandler(handler) {
    return async () => {
        const { subagents } = await handler();
        return { subagents };
    };
}
/** Delete one direct child selected from the current parent session's registry. */
export function createRlmDeleteSubagentHostHandler(handler) {
    return async (payload) => {
        if (typeof payload.target !== "string" || !payload.target.trim()) {
            throw new Error("rlm.delete_subagent target must be a non-empty string");
        }
        const { subagent, outcome } = await handler(payload.target.trim());
        return outcome === undefined ? { subagent } : { subagent, outcome };
    };
}
//# sourceMappingURL=rlm-runtime.js.map
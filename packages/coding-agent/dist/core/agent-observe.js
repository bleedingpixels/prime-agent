export const AGENT_OBSERVE_SKILL_NAME = "agent-observe";
export const AGENT_OBSERVE_IMPORT_NAME = "agent_observe";
export const ORCHESTRATION_HEARTBEAT_SKILL_NAME = "orchestration-heartbeat";
export function createAgentObserveHostHandlers(controller) {
    return {
        "agent_observe.list": async () => controller.listAgents(),
        "agent_observe.get": async (payload = {}) => {
            if (typeof payload.target !== "string") {
                throw new Error("agent_observe.get target must be a string");
            }
            return (await controller.getAgent(payload.target));
        },
        "agent_observe.recent": async (payload = {}) => {
            if (typeof payload.target !== "string") {
                throw new Error("agent_observe.recent target must be a string");
            }
            return (await controller.recentMessages({
                target: payload.target,
                limit: normalizeOptionalInteger(payload.limit, "agent_observe.recent limit"),
                maxChars: normalizeOptionalInteger(payload.max_chars ?? payload.maxChars, "agent_observe.recent max_chars"),
            }));
        },
    };
}
export function normalizeObserveLimit(limit, defaultLimit = 8) {
    return clampInteger(limit ?? defaultLimit, 1, 50, "agent_observe limit");
}
export function normalizeObserveMaxChars(maxChars, defaultMaxChars = 800) {
    return clampInteger(maxChars ?? defaultMaxChars, 80, 2_000, "agent_observe max_chars");
}
export function createAgentObserveMessagePreview(message, index, maxChars) {
    const text = messageText(message);
    const clipped = truncate(text, maxChars);
    const toolCalls = message.role === "assistant" ? assistantToolCalls(message) : undefined;
    return {
        index,
        role: message.role,
        ...(message.timestamp ? { timestamp: message.timestamp } : {}),
        text: clipped.text,
        truncated: clipped.truncated,
        ...(toolCalls && toolCalls.length > 0 ? { toolCalls } : {}),
        ...(message.role === "custom" ? { customType: message.customType } : {}),
    };
}
function normalizeOptionalInteger(value, label) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new Error(`${label} must be an integer when provided`);
    }
    return value;
}
function clampInteger(value, min, max, label) {
    if (!Number.isInteger(value)) {
        throw new Error(`${label} must be an integer`);
    }
    if (value < min || value > max) {
        throw new Error(`${label} must be between ${min} and ${max}`);
    }
    return value;
}
function truncate(text, maxChars) {
    if (text.length <= maxChars) {
        return { text, truncated: false };
    }
    return { text: text.slice(0, maxChars), truncated: true };
}
function messageText(message) {
    switch (message.role) {
        case "user":
        case "assistant":
            return contentText(message.content);
        case "toolResult":
            return contentText(message.content);
        case "bashExecution":
            return [message.command, message.output].filter(Boolean).join("\n");
        case "custom":
            return typeof message.content === "string" ? message.content : contentText(message.content);
        case "branchSummary":
            return message.summary;
        case "compactionSummary":
            return message.summary;
        default: {
            const exhaustive = message;
            return JSON.stringify(exhaustive);
        }
    }
}
function contentText(content) {
    if (typeof content === "string") {
        return content;
    }
    if (!Array.isArray(content)) {
        return "";
    }
    return content
        .map((block) => {
        if (!block || typeof block !== "object" || !("type" in block)) {
            return "";
        }
        if (block.type === "text" && "text" in block && typeof block.text === "string") {
            return block.text;
        }
        if (block.type === "thinking" && "thinking" in block && typeof block.thinking === "string") {
            return block.thinking;
        }
        if (block.type === "image") {
            return "[image]";
        }
        if (block.type === "toolCall" && "name" in block && typeof block.name === "string") {
            return `[tool_call:${block.name}]`;
        }
        return "";
    })
        .filter(Boolean)
        .join("\n");
}
function assistantToolCalls(message) {
    return message.content.filter((block) => block.type === "toolCall").map((block) => block.name);
}
//# sourceMappingURL=agent-observe.js.map
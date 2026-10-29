import { parseStreamingJson } from "@earendil-works/pi-ai";
export function createCompactAssistantDelta(message) {
    if (message.type !== "session_event" || message.event.type !== "message_update") {
        return undefined;
    }
    if (message.event.message.role !== "assistant") {
        return undefined;
    }
    const { partial: _partial, ...assistantMessageEvent } = message.event
        .assistantMessageEvent;
    const contentStart = compactContentStart(message.event.message, assistantMessageEvent);
    const toolCallArguments = compactToolCallArguments(message.event.message, assistantMessageEvent);
    return {
        type: "assistant_stream_delta",
        activeSessionId: message.activeSessionId,
        assistantMessageEvent: assistantMessageEvent,
        ...(contentStart ? { contentStart } : {}),
        ...(toolCallArguments ? { toolCallArguments } : {}),
        ...(message.meta ? { meta: message.meta } : {}),
    };
}
function compactToolCallArguments(message, event) {
    if (event.type !== "toolcall_delta") {
        return undefined;
    }
    const content = message.content[event.contentIndex];
    return content?.type === "toolCall" ? content.arguments : undefined;
}
function compactContentStart(message, event) {
    if (event.type !== "text_start" && event.type !== "thinking_start" && event.type !== "toolcall_start") {
        return undefined;
    }
    const content = message.content[event.contentIndex];
    if (event.type === "text_start" && content?.type === "text") {
        return { ...content, text: "" };
    }
    if (event.type === "thinking_start" && content?.type === "thinking") {
        return { ...content, thinking: "" };
    }
    if (event.type === "toolcall_start" && content?.type === "toolCall") {
        return { ...content, arguments: {} };
    }
    return undefined;
}
export class CompactAssistantStreamReconstructor {
    partialMessages = new Map();
    toolCallJson = new Map();
    seed(activeSessionId, message) {
        this.partialMessages.set(activeSessionId, message);
    }
    observe(message) {
        if (message.type !== "session_event") {
            if (message.type === "session_replaced" ||
                message.type === "session_resynced" ||
                message.type === "session_closed") {
                this.clear(message.activeSessionId);
            }
            return;
        }
        if (message.event.type === "message_start" && message.event.message.role === "assistant") {
            this.partialMessages.set(message.activeSessionId, message.event.message);
            return;
        }
        if (message.event.type === "message_end") {
            this.clear(message.activeSessionId);
        }
    }
    reconstruct(delta) {
        const partial = this.partialMessages.get(delta.activeSessionId);
        if (!partial) {
            return undefined;
        }
        const event = delta.assistantMessageEvent;
        switch (event.type) {
            case "text_start":
                partial.content[event.contentIndex] = delta.contentStart ?? { type: "text", text: "" };
                break;
            case "text_delta": {
                const content = partial.content[event.contentIndex];
                if (content?.type !== "text") {
                    return undefined;
                }
                content.text += event.delta;
                break;
            }
            case "text_end": {
                const content = partial.content[event.contentIndex];
                if (content?.type !== "text") {
                    return undefined;
                }
                content.text = event.content;
                break;
            }
            case "thinking_start":
                partial.content[event.contentIndex] = delta.contentStart ?? { type: "thinking", thinking: "" };
                break;
            case "thinking_delta": {
                const content = partial.content[event.contentIndex];
                if (content?.type !== "thinking") {
                    return undefined;
                }
                content.thinking += event.delta;
                break;
            }
            case "thinking_end": {
                const content = partial.content[event.contentIndex];
                if (content?.type !== "thinking") {
                    return undefined;
                }
                content.thinking = event.content;
                break;
            }
            case "toolcall_start":
                if (!delta.contentStart || delta.contentStart.type !== "toolCall") {
                    return undefined;
                }
                partial.content[event.contentIndex] = delta.contentStart;
                this.toolCallJson.set(this.toolCallKey(delta.activeSessionId, event.contentIndex), "");
                break;
            case "toolcall_delta": {
                const content = partial.content[event.contentIndex];
                if (content?.type !== "toolCall") {
                    return undefined;
                }
                if (delta.toolCallArguments) {
                    content.arguments = delta.toolCallArguments;
                }
                else {
                    const key = this.toolCallKey(delta.activeSessionId, event.contentIndex);
                    const partialJson = `${this.toolCallJson.get(key) ?? ""}${event.delta}`;
                    this.toolCallJson.set(key, partialJson);
                    content.arguments = parseStreamingJson(partialJson);
                }
                break;
            }
            case "toolcall_end":
                partial.content[event.contentIndex] = event.toolCall;
                this.toolCallJson.delete(this.toolCallKey(delta.activeSessionId, event.contentIndex));
                break;
            case "start":
            case "done":
            case "error":
                return undefined;
        }
        return {
            type: "session_event",
            activeSessionId: delta.activeSessionId,
            event: {
                type: "message_update",
                message: { ...partial, content: [...partial.content] },
                assistantMessageEvent: event,
            },
            ...(delta.meta ? { meta: delta.meta } : {}),
        };
    }
    clear(activeSessionId) {
        this.partialMessages.delete(activeSessionId);
        for (const key of this.toolCallJson.keys()) {
            if (key.startsWith(`${activeSessionId}:`)) {
                this.toolCallJson.delete(key);
            }
        }
    }
    toolCallKey(activeSessionId, contentIndex) {
        return `${activeSessionId}:${contentIndex}`;
    }
}
export function isCompactAssistantDelta(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const candidate = value;
    return (candidate.type === "assistant_stream_delta" &&
        typeof candidate.activeSessionId === "string" &&
        typeof candidate.assistantMessageEvent === "object" &&
        candidate.assistantMessageEvent !== null);
}
//# sourceMappingURL=compact-session-stream.js.map
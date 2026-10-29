import { type AssistantMessage } from "@earendil-works/pi-ai";
import type { DaemonEventMeta, DaemonOutbound } from "./daemon-protocol.js";
type SessionEvent = Extract<DaemonOutbound, {
    type: "session_event";
}>["event"];
type MessageUpdateEvent = Extract<SessionEvent, {
    type: "message_update";
}>;
type WithoutPartial<T> = T extends {
    partial: AssistantMessage;
} ? Omit<T, "partial"> : T;
type CompactAssistantMessageEvent = WithoutPartial<MessageUpdateEvent["assistantMessageEvent"]>;
export interface CompactAssistantDelta {
    type: "assistant_stream_delta";
    activeSessionId: string;
    assistantMessageEvent: CompactAssistantMessageEvent;
    contentStart?: AssistantMessage["content"][number];
    toolCallArguments?: Record<string, unknown>;
    meta?: DaemonEventMeta;
}
export declare function createCompactAssistantDelta(message: DaemonOutbound): CompactAssistantDelta | undefined;
export declare class CompactAssistantStreamReconstructor {
    private readonly partialMessages;
    private readonly toolCallJson;
    seed(activeSessionId: string, message: AssistantMessage): void;
    observe(message: DaemonOutbound): void;
    reconstruct(delta: CompactAssistantDelta): DaemonOutbound | undefined;
    clear(activeSessionId: string): void;
    private toolCallKey;
}
export declare function isCompactAssistantDelta(value: unknown): value is CompactAssistantDelta;
export {};
//# sourceMappingURL=compact-session-stream.d.ts.map
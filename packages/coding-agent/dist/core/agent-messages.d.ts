import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { HostRequestHandler } from "./kernel/index.js";
import type { CustomMessage } from "./messages.js";
export declare const AGENT_MESSAGE_CUSTOM_TYPE = "agent_message";
export declare const AGENT_MESSAGE_SKILL_NAME = "agent-message";
export declare const AGENT_MESSAGE_IMPORT_NAME = "agent_message";
export declare const AGENT_MESSAGE_SOURCE = "agent_message";
export declare const AGENT_MESSAGE_RECEIVED_PREVIEW_LABEL = "Agent message received";
export declare const DEFAULT_AGENT_MESSAGE_MAX_CHARS = 16384;
export declare const DEFAULT_AGENT_MESSAGE_MAX_PENDING_PER_SESSION = 20;
export declare const DEFAULT_AGENT_MESSAGE_RATE_LIMIT_CAPACITY = 3;
export declare const DEFAULT_AGENT_MESSAGE_RATE_LIMIT_REFILL_MS = 1000;
/** Legacy daemon wire input accepted and ignored for compatibility. */
export type AgentSessionMessageDeliveryMode = "auto" | "steer" | "follow_up";
export type AgentSessionMessageDeliveryStatus = "delivered" | "queued";
export type AgentSessionMessageRuntimeKind = "top-level" | "subagent";
export type AgentFamilyStatus = "running" | "idle" | "inactive";
export type AgentFamilyRelationship = "parent" | "sibling" | "child";
export declare const AGENT_FAMILY_REACH_ERROR = "Agent reach is limited to parent, siblings, and children";
export interface AgentSessionMessageEndpoint {
    activeSessionId: string;
    sessionId: string;
    sessionName?: string;
    runtimeKind?: AgentSessionMessageRuntimeKind;
}
export interface AgentSessionMessageSender extends Partial<AgentSessionMessageEndpoint> {
    clientId?: string;
}
export type AgentMessageDirection = "received" | "sent";
/** Format the directional role/name segment shared by received and sent agent-message UI. */
export declare function formatAgentMessageParticipant(direction: AgentMessageDirection, role: AgentFamilyRelationship | undefined, endpoint?: (Partial<AgentSessionMessageEndpoint> & {
    clientId?: string;
}) | null): string;
export interface AgentSessionMessageAgentSummary extends AgentSessionMessageEndpoint {
    cwd: string;
    isStreaming: boolean;
    unfinishedActionCount: number;
    parentActiveSessionId?: string;
    rlmChildId?: string;
    sessionDir?: string;
    sessionPath?: string;
    parentSessionId?: string;
    parentSessionPath?: string;
    rlmDepth?: number;
    status?: AgentFamilyStatus;
    rlmChildRegistryStatus?: "running" | "completed" | "deleted";
}
export interface AgentSessionMessageListResult {
    current?: AgentSessionMessageEndpoint;
    agents: AgentSessionMessageAgentSummary[];
}
export interface AgentFamilyCatalogEntry {
    id: string;
    name?: string;
    depth: number;
    status: AgentFamilyStatus;
    repliedSinceTask?: boolean;
    parentSessionId?: string;
    parentSessionPath?: string;
    sessionPath?: string;
}
export interface AgentFamilyRosterEntry {
    relationship: AgentFamilyRelationship;
    name: string;
    id: string;
    depth: number;
    status: AgentFamilyStatus;
    repliedSinceTask?: boolean;
}
export interface AgentFamilyRosterResult {
    current: {
        name: string;
        id: string;
        depth: number;
    };
    entries: AgentFamilyRosterEntry[];
}
export interface AgentSessionNameScope {
    parentSessionId?: string;
    parentSessionPath?: string;
    depth: number;
}
export interface AgentSessionNameAvailabilityInput extends AgentSessionNameScope {
    name: string;
    ignoreSessionId?: string;
}
export interface AgentSessionMessagePayload {
    id: string;
    source: typeof AGENT_MESSAGE_SOURCE;
    message: string;
    from?: AgentSessionMessageSender;
    /** Sender relationship from the receiver's point of view. */
    fromRelationship?: AgentFamilyRelationship;
    target: AgentSessionMessageEndpoint;
}
export interface AgentSessionMessageDetails {
    id: string;
    message: string;
    from?: AgentSessionMessageSender;
    fromRelationship?: AgentFamilyRelationship;
    target?: AgentSessionMessageEndpoint;
}
export interface AgentSessionMessage extends CustomMessage<AgentSessionMessageDetails> {
    customType: typeof AGENT_MESSAGE_CUSTOM_TYPE;
    content: string;
    details: AgentSessionMessageDetails;
}
export interface AgentSessionMessageReceipt {
    id: string;
    source: typeof AGENT_MESSAGE_SOURCE;
    target: AgentSessionMessageEndpoint;
    from?: AgentSessionMessageSender;
    message: string;
    deliveryStatus: AgentSessionMessageDeliveryStatus;
    /** Present when deliveryStatus is "delivered": the message reached the target's context. */
    deliveredAt?: string;
    /** Present when deliveryStatus is "queued": the message waits behind the target's current work. */
    queuedAt?: string;
    deliveryMode?: "steer";
}
export interface AgentSessionMessageSendInput {
    target: string;
    message: string;
    receiverRole?: AgentFamilyRelationship;
}
export interface AgentSessionMessageController {
    listAgents(): AgentSessionMessageListResult | Promise<AgentSessionMessageListResult>;
    roster?(): AgentFamilyRosterResult | Promise<AgentFamilyRosterResult>;
    awaitPendingChildPublication?(selector: string): Promise<string | undefined>;
    assertSessionNameAvailable?(input: AgentSessionNameAvailabilityInput): void | Promise<void>;
    setSessionName?(name: string): void | Promise<void>;
    sendAgentMessage(input: AgentSessionMessageSendInput): Promise<AgentSessionMessageReceipt>;
}
export interface AgentSessionMessageSafetyStatus {
    paused: boolean;
    maxMessageChars: number;
    maxPendingPerSession: number;
    rateLimitCapacity: number;
    rateLimitRefillMs: number;
}
/**
 * Structural reservation key for sibling-scoped session names. JSON encoding keeps
 * parent paths and names containing delimiter characters from colliding into one key;
 * the worker- and supervisor-side reservation maps must never diverge in encoding.
 */
export declare function sessionNameReservationKey(input: {
    name: string;
    depth: number;
    parentSessionId?: string;
    parentSessionPath?: string;
}): string;
export declare function formatAgentSessionNameUnavailable(name: string, depth: number): string;
export declare function assertAgentSessionNameAvailable(catalog: readonly AgentFamilyCatalogEntry[], input: AgentSessionNameAvailabilityInput): void;
export declare function buildAgentFamilyRoster(current: AgentFamilyCatalogEntry, catalog: readonly AgentFamilyCatalogEntry[]): AgentFamilyRosterResult;
/** Pure nuclear-family policy over persisted parent-edge snapshots. */
export declare function agentFamilyRelationship(current: AgentFamilyCatalogEntry, target: AgentFamilyCatalogEntry): AgentFamilyRelationship | undefined;
export declare function assertAgentFamilyReach(current: AgentFamilyCatalogEntry, target: AgentFamilyCatalogEntry): AgentFamilyRelationship;
export declare function createAgentSessionMessageId(): string;
export declare function normalizeAgentSessionMessage(message: string, maxChars?: number): string;
export declare function assertDirectAgentMessageTarget(target: string): string;
export declare function assertAgentMessageQueueCapacity(unfinishedActionCount: number, maxPending?: number): void;
export declare function parseAgentSessionMessagePromptId(text: string): string | undefined;
export declare function isAgentSessionMessagePrompt(text: string): boolean;
export declare function createAgentSessionMessagePrompt(payload: AgentSessionMessagePayload): string;
export declare function createAgentSessionMessage(payload: AgentSessionMessagePayload, timestamp?: number): AgentSessionMessage;
export declare function isAgentSessionMessage(message: AgentMessage): message is AgentSessionMessage;
export declare function createAgentSessionMessageReceipt(payload: AgentSessionMessagePayload, status: AgentSessionMessageDeliveryStatus, at?: string): AgentSessionMessageReceipt;
export interface AgentSessionMessageRateLimiterOptions {
    capacity?: number;
    refillMs?: number;
    now?: () => number;
}
export declare class AgentSessionMessageRateLimiter {
    private readonly capacity;
    private readonly refillMs;
    private readonly now;
    private readonly buckets;
    constructor(options?: AgentSessionMessageRateLimiterOptions);
    tryConsume(key: string): {
        ok: true;
    } | {
        ok: false;
        retryAfterMs: number;
    };
    refund(key: string): void;
    clear(key?: string): void;
    clearMatching(predicate: (key: string) => boolean): void;
}
export declare function createAgentMessageHostHandlers(controller: Pick<AgentSessionMessageController, "roster" | "sendAgentMessage" | "awaitPendingChildPublication">): Record<string, HostRequestHandler>;
//# sourceMappingURL=agent-messages.d.ts.map
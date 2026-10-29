import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { ImageContent, UserMessage } from "@earendil-works/pi-ai";
import type { InputSource } from "./extensions/index.js";
import type { CustomMessage } from "./messages.js";
import type { SessionSlashCommand } from "./slash-commands.js";
export type DeliveryPolicy = "next_turn_boundary" | "when_run_idle";
export type WakePolicy = "immediate" | "on_lower_boundary" | "external_resume";
export type QueuedMessageLane = "steering" | "followUp";
export declare function queuedMessageLaneDeliveryPolicy(lane: QueuedMessageLane): DeliveryPolicy;
export type QueuedMessageMutation = {
    type: "delete";
} | {
    type: "move";
    direction: -1 | 1;
} | {
    type: "replace";
    text: string;
    images?: ImageContent[];
    lane: QueuedMessageLane;
};
export type QueuedMessageMutationStatus = "applied" | "rejected" | "invalid";
export interface SessionActionSnapshot {
    queuedCount: number;
    steering: readonly string[];
    followUps: readonly string[];
    active?: {
        kind: "turn" | "session_command";
        phase: "preparing" | "committing" | "running";
        label?: string;
    };
}
export interface DeliveryRecord {
    id: string;
    role: "primary" | "prefix" | "next_turn";
    message: UserMessage | CustomMessage;
    started: boolean;
    durable: boolean;
    ownerActionId: string;
}
export interface SessionTurnPayload {
    kind: "turn";
    records: DeliveryRecord[];
    text: string;
    preview?: string;
}
export interface SessionCommandPayload {
    kind: "session_command";
    command: SessionSlashCommand;
    text: string;
}
export type SessionActionPayload = SessionTurnPayload | SessionCommandPayload;
export type ActionLifecycle = {
    state: "queued";
} | {
    state: "selected";
} | {
    state: "preparing";
    preparation?: object;
} | {
    state: "committing";
} | {
    state: "running";
    execution: "agent_turn" | "session_command";
} | {
    state: "completed";
} | {
    state: "failed";
    error: Error;
} | {
    state: "cancelled";
};
export interface SessionAction<TPayload extends SessionActionPayload = SessionActionPayload> {
    id: string;
    source: InputSource | "internal";
    delivery: DeliveryPolicy;
    wake: WakePolicy;
    payload: TPayload;
    lifecycle: ActionLifecycle;
    queueKey?: string;
    agentMessageId?: string;
    suppressAutonomousContinuation?: boolean;
}
export interface RollbackProof {
    dispatchSettled: true;
    transcript: readonly AgentMessage[];
}
export declare function transitionSessionAction(action: SessionAction, next: ActionLifecycle, options?: {
    rollbackProof?: RollbackProof;
}): void;
export type AdmissionDisposition = "starts_when_admitted" | "queued";
export type SubmissionOutcome = {
    status: "accepted";
    actionId: string;
    disposition: AdmissionDisposition;
} | {
    status: "coalesced";
    existingActionId: string;
} | {
    status: "handled_without_turn";
} | {
    status: "extension_command";
    completion: Promise<void>;
};
export type DeliveryOutcome = {
    status: "delivered";
} | {
    status: "not_applicable";
};
export interface ActionTicket {
    id: string;
    accepted: Promise<SubmissionOutcome>;
    delivered: Promise<DeliveryOutcome>;
    completed: Promise<void>;
}
export declare class ActionTicketController {
    readonly ticket: ActionTicket;
    private readonly accepted;
    private readonly delivered;
    private readonly completed;
    constructor(id: string);
    settleAccepted(outcome: SubmissionOutcome): boolean;
    settleDelivered(outcome: DeliveryOutcome): boolean;
    rejectDelivered(error: Error): boolean;
    settleCompleted(error?: Error): boolean;
}
export declare class ActionStore<TAction extends SessionAction = SessionAction> {
    private readonly nextTurnBoundary;
    private readonly whenRunIdle;
    private readonly tickets;
    enqueue(action: TAction): void;
    enqueueFront(action: TAction): void;
    selectFirst(): TAction | undefined;
    remove(predicate: (action: TAction) => boolean, candidates?: readonly TAction[]): TAction[];
    rollback(action: TAction, proof?: RollbackProof): void;
    swapQueued(left: TAction, right: TAction): void;
    moveQueued(action: TAction, delivery: DeliveryPolicy, index: number): void;
    queuedActions(policy?: DeliveryPolicy): readonly TAction[];
    clearableActions(policy?: DeliveryPolicy): readonly TAction[];
    snapshotActions(): readonly TAction[];
    unfinishedActions(policy?: DeliveryPolicy): readonly TAction[];
    activeActions(policy?: DeliveryPolicy): readonly TAction[];
    queuePreview(policy: DeliveryPolicy): readonly string[];
    ticketFor(action: TAction): ActionTicketController;
    ownedActions(): readonly TAction[];
    actionsForMessage(message: UserMessage | CustomMessage): readonly TAction[];
    releaseTerminal(action: TAction): void;
    private actions;
    private list;
    private assertNewAction;
}
export interface RuntimeActivity {
    lowerAgentRun: boolean;
    compaction: boolean;
    retry: boolean;
    bash: boolean;
    refinementApply: boolean;
    branchMutation: boolean;
    schedulerPauseCount: number;
    disposing: boolean;
}
export type IdleEvictionMinutes = number | "off";
export interface SessionEvictionSnapshot {
    isSessionActive: boolean;
    attachedClients: number;
    hasRegisteredHeartbeat: boolean;
    hasRegisteredCronJob: boolean;
    lastActivityAt: number;
}
export interface SessionPassivationSnapshot extends SessionEvictionSnapshot {
    hasParent: boolean;
    hasNonPassiveDescendants: boolean;
    isHydrating: boolean;
}
export interface WorkerEvictionSnapshot {
    lifecycle: "starting" | "ready" | "recovering" | "stopping" | "failed";
    isConnected: boolean;
    isStopping: boolean;
    hasOwnerClient: boolean;
    isPreparingUpdateRestart: boolean;
    sessions: readonly SessionEvictionSnapshot[];
}
/** Pure per-node residency policy. Roots remain owned by whole-worker eviction. */
export declare function canPassivateSession(session: SessionPassivationSnapshot, idleEvictionMinutes: IdleEvictionMinutes, now?: number): boolean;
/** Pure whole-tree residency policy. Callers must supply supervisor-owned attachment state. */
export declare function canEvictWorker(worker: WorkerEvictionSnapshot, idleEvictionMinutes: IdleEvictionMinutes, now?: number): boolean;
export declare function canSelectSessionAction(activity: RuntimeActivity): boolean;
//# sourceMappingURL=session-action-store.d.ts.map
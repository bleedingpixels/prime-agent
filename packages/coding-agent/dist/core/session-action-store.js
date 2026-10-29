export function queuedMessageLaneDeliveryPolicy(lane) {
    return lane === "steering" ? "next_turn_boundary" : "when_run_idle";
}
const TERMINAL_STATES = new Set(["completed", "failed", "cancelled"]);
const ACTIVE_STATES = new Set(["selected", "preparing", "committing", "running"]);
const CLEARABLE_STATES = new Set(["queued", "selected", "preparing"]);
function isClearable(action) {
    return CLEARABLE_STATES.has(action.lifecycle.state);
}
const LEGAL_TRANSITIONS = {
    queued: new Set(["selected", "failed", "cancelled"]),
    selected: new Set(["queued", "preparing", "running", "failed", "cancelled"]),
    preparing: new Set(["queued", "committing", "failed", "cancelled"]),
    committing: new Set(["queued", "running", "failed", "cancelled"]),
    running: new Set(["completed", "failed", "cancelled"]),
    completed: new Set(),
    failed: new Set(),
    cancelled: new Set(),
};
function primaryRecords(action) {
    return action.payload.kind === "turn" ? action.payload.records.filter((record) => record.role === "primary") : [];
}
export function transitionSessionAction(action, next, options = {}) {
    const previous = action.lifecycle.state;
    if (!LEGAL_TRANSITIONS[previous].has(next.state)) {
        throw new Error(`Illegal session action lifecycle transition: ${previous} -> ${next.state}`);
    }
    if (previous === "committing" && next.state === "queued") {
        const proof = options.rollbackProof;
        if (!proof?.dispatchSettled) {
            throw new Error("Committing session action rollback requires a settled dispatch and transcript proof");
        }
        const transcript = new Set(proof.transcript);
        if (primaryRecords(action).some((record) => transcript.has(record.message))) {
            throw new Error("Cannot roll back a session action whose primary message is durable in the transcript");
        }
    }
    action.lifecycle = next;
}
function createDeferred() {
    let settled = false;
    let resolvePromise;
    let rejectPromise;
    const promise = new Promise((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
    });
    void promise.catch(() => undefined);
    return {
        promise,
        settle: (value) => {
            if (settled)
                return false;
            settled = true;
            resolvePromise(value);
            return true;
        },
        reject: (error) => {
            if (settled)
                return false;
            settled = true;
            rejectPromise(error);
            return true;
        },
    };
}
export class ActionTicketController {
    ticket;
    accepted = createDeferred();
    delivered = createDeferred();
    completed = createDeferred();
    constructor(id) {
        this.ticket = {
            id,
            accepted: this.accepted.promise,
            delivered: this.delivered.promise,
            completed: this.completed.promise,
        };
    }
    settleAccepted(outcome) {
        return this.accepted.settle(outcome);
    }
    settleDelivered(outcome) {
        return this.delivered.settle(outcome);
    }
    rejectDelivered(error) {
        return this.delivered.reject(error);
    }
    settleCompleted(error) {
        return error ? this.completed.reject(error) : this.completed.settle();
    }
}
export class ActionStore {
    nextTurnBoundary = [];
    whenRunIdle = [];
    tickets = new Map();
    enqueue(action) {
        this.assertNewAction(action);
        this.list(action.delivery).push(action);
        this.tickets.set(action.id, new ActionTicketController(action.id));
    }
    enqueueFront(action) {
        this.assertNewAction(action);
        const list = this.list(action.delivery);
        const firstQueued = list.findIndex((item) => item.lifecycle.state === "queued");
        list.splice(firstQueued < 0 ? list.length : firstQueued, 0, action);
        this.tickets.set(action.id, new ActionTicketController(action.id));
    }
    selectFirst() {
        const action = this.nextTurnBoundary.find((item) => item.lifecycle.state === "queued") ??
            this.whenRunIdle.find((item) => item.lifecycle.state === "queued");
        if (action)
            transitionSessionAction(action, { state: "selected" });
        return action;
    }
    remove(predicate, candidates = this.clearableActions()) {
        const removed = candidates.filter(predicate);
        for (const action of removed)
            transitionSessionAction(action, { state: "cancelled" });
        return removed;
    }
    rollback(action, proof) {
        transitionSessionAction(action, { state: "queued" }, { rollbackProof: proof });
    }
    swapQueued(left, right) {
        if (left.lifecycle.state !== "queued" || right.lifecycle.state !== "queued" || left.delivery !== right.delivery) {
            throw new Error("Only queued actions in the same lane can be swapped");
        }
        const list = this.list(left.delivery);
        const leftIndex = list.indexOf(left);
        const rightIndex = list.indexOf(right);
        if (leftIndex < 0 || rightIndex < 0)
            throw new Error("Queued action is not owned by this store");
        [list[leftIndex], list[rightIndex]] = [right, left];
    }
    moveQueued(action, delivery, index) {
        if (action.lifecycle.state !== "queued")
            throw new Error("Only queued actions can be moved");
        const source = this.list(action.delivery);
        const sourceIndex = source.indexOf(action);
        if (sourceIndex < 0)
            throw new Error(`Session action ${action.id} is not owned by this store`);
        source.splice(sourceIndex, 1);
        action.delivery = delivery;
        const target = this.list(delivery);
        const queued = target.filter((item) => item.lifecycle.state === "queued");
        const before = queued[Math.max(0, Math.min(index, queued.length))];
        target.splice(before ? target.indexOf(before) : target.length, 0, action);
    }
    queuedActions(policy) {
        return this.actions(policy).filter((action) => action.lifecycle.state === "queued");
    }
    clearableActions(policy) {
        return this.actions(policy).filter(isClearable);
    }
    snapshotActions() {
        return this.queuedActions();
    }
    unfinishedActions(policy) {
        return this.actions(policy).filter((action) => !TERMINAL_STATES.has(action.lifecycle.state));
    }
    activeActions(policy) {
        return this.actions(policy).filter((action) => ACTIVE_STATES.has(action.lifecycle.state));
    }
    queuePreview(policy) {
        return this.queuedActions(policy).map((action) => action.payload.kind === "turn" ? (action.payload.preview ?? action.payload.text) : action.payload.text);
    }
    ticketFor(action) {
        const ticket = this.tickets.get(action.id);
        if (!ticket)
            throw new Error(`Session action ${action.id} is not owned by this store`);
        return ticket;
    }
    ownedActions() {
        return this.actions();
    }
    actionsForMessage(message) {
        return this.actions().filter((action) => action.payload.kind === "turn" && action.payload.records.some((record) => record.message === message));
    }
    releaseTerminal(action) {
        if (!TERMINAL_STATES.has(action.lifecycle.state)) {
            throw new Error(`Cannot release nonterminal session action ${action.id}`);
        }
        const list = this.list(action.delivery);
        const index = list.indexOf(action);
        if (index >= 0)
            list.splice(index, 1);
        this.tickets.delete(action.id);
    }
    actions(policy) {
        if (policy)
            return this.list(policy);
        return [...this.nextTurnBoundary, ...this.whenRunIdle];
    }
    list(policy) {
        return policy === "next_turn_boundary" ? this.nextTurnBoundary : this.whenRunIdle;
    }
    assertNewAction(action) {
        if (action.lifecycle.state !== "queued")
            throw new Error("Only queued session actions can be enqueued");
        if (this.tickets.has(action.id))
            throw new Error(`Duplicate session action id: ${action.id}`);
    }
}
function isIdleEvictionThresholdMet(session, idleEvictionMinutes, now) {
    if (idleEvictionMinutes === "off" || !Number.isFinite(idleEvictionMinutes) || idleEvictionMinutes <= 0) {
        return false;
    }
    return (!session.isSessionActive &&
        session.attachedClients === 0 &&
        !session.hasRegisteredHeartbeat &&
        !session.hasRegisteredCronJob &&
        Number.isFinite(session.lastActivityAt) &&
        now - session.lastActivityAt >= idleEvictionMinutes * 60_000);
}
/** Pure per-node residency policy. Roots remain owned by whole-worker eviction. */
export function canPassivateSession(session, idleEvictionMinutes, now = Date.now()) {
    return (session.hasParent &&
        !session.hasNonPassiveDescendants &&
        !session.isHydrating &&
        isIdleEvictionThresholdMet(session, idleEvictionMinutes, now));
}
/** Pure whole-tree residency policy. Callers must supply supervisor-owned attachment state. */
export function canEvictWorker(worker, idleEvictionMinutes, now = Date.now()) {
    if (worker.lifecycle !== "ready" ||
        !worker.isConnected ||
        worker.isStopping ||
        worker.hasOwnerClient ||
        worker.isPreparingUpdateRestart ||
        worker.sessions.length === 0) {
        return false;
    }
    return worker.sessions.every((session) => isIdleEvictionThresholdMet(session, idleEvictionMinutes, now));
}
export function canSelectSessionAction(activity) {
    return (!activity.lowerAgentRun &&
        !activity.compaction &&
        !activity.retry &&
        !activity.bash &&
        !activity.refinementApply &&
        !activity.branchMutation &&
        activity.schedulerPauseCount === 0 &&
        !activity.disposing);
}
//# sourceMappingURL=session-action-store.js.map
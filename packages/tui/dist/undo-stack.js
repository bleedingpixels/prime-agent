/**
 * Generic undo stack with clone-on-push semantics.
 *
 * Stores cloned state snapshots. Popped snapshots are returned directly
 * since they are already detached.
 */
export class UndoStack {
    clone;
    stack = [];
    constructor(clone = structuredClone) {
        this.clone = clone;
    }
    /** Push a clone of the given state onto the stack. */
    push(state) {
        this.stack.push(this.clone(state));
    }
    /** Pop and return the most recent snapshot, or undefined if empty. */
    pop() {
        return this.stack.pop();
    }
    /** Remove all snapshots. */
    clear() {
        this.stack.length = 0;
    }
    get length() {
        return this.stack.length;
    }
}
//# sourceMappingURL=undo-stack.js.map
/**
 * Generic undo stack with clone-on-push semantics.
 *
 * Stores cloned state snapshots. Popped snapshots are returned directly
 * since they are already detached.
 */
export declare class UndoStack<S> {
    private readonly clone;
    private stack;
    constructor(clone?: (state: S) => S);
    /** Push a clone of the given state onto the stack. */
    push(state: S): void;
    /** Pop and return the most recent snapshot, or undefined if empty. */
    pop(): S | undefined;
    /** Remove all snapshots. */
    clear(): void;
    get length(): number;
}
//# sourceMappingURL=undo-stack.d.ts.map
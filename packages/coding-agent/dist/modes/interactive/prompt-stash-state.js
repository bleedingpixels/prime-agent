export class ClientPromptStashStore {
    states = new Map();
    forSession(sessionId) {
        let state = this.states.get(sessionId);
        if (!state) {
            state = {};
            this.states.set(sessionId, state);
        }
        return state;
    }
    release(sessionId, state) {
        if (state.stash === undefined &&
            (state.queuedStashes?.length ?? 0) === 0 &&
            this.states.get(sessionId) === state) {
            this.states.delete(sessionId);
        }
    }
}
//# sourceMappingURL=prompt-stash-state.js.map
import { randomUUID } from "node:crypto";
import { formatSessionDisplayId, matchesSessionIdSuffix } from "./daemon-session-id.js";
export function createActiveSessionId(existingIds) {
    while (true) {
        const activeSessionId = formatSessionDisplayId(randomUUID());
        if (!existingIds?.has(activeSessionId)) {
            return activeSessionId;
        }
    }
}
export class AmbiguousActiveSessionError extends Error {
    constructor(message) {
        super(message);
        this.name = "AmbiguousActiveSessionError";
    }
}
export function resolveActiveSessionState(sessions, selector) {
    const direct = sessions.get(selector);
    if (direct) {
        return direct;
    }
    const exactMatches = uniqueStates([...sessions.values()].filter((state) => {
        const session = state.runtime.session;
        return session.sessionId === selector || session.sessionName === selector;
    }));
    if (exactMatches.length === 1) {
        return exactMatches[0];
    }
    if (exactMatches.length > 1) {
        throw new AmbiguousActiveSessionError(formatAmbiguousSessionError(selector, exactMatches));
    }
    const suffixMatches = uniqueStates([...sessions.values()].filter((state) => {
        const session = state.runtime.session;
        return (matchesSessionIdSuffix(state.activeSessionId, selector) ||
            matchesSessionIdSuffix(session.sessionId, selector));
    }));
    if (suffixMatches.length === 1) {
        return suffixMatches[0];
    }
    if (suffixMatches.length > 1) {
        throw new AmbiguousActiveSessionError(formatAmbiguousSessionError(selector, suffixMatches));
    }
    throw new Error(`Unknown active session: ${selector}`);
}
function uniqueStates(states) {
    const unique = new Map();
    for (const state of states) {
        unique.set(state.activeSessionId, state);
    }
    return [...unique.values()];
}
function formatAmbiguousSessionError(selector, states) {
    return `Ambiguous active session "${selector}": matches ${states.map(formatSessionMatch).join(", ")}`;
}
function formatSessionMatch(state) {
    const session = state.runtime.session;
    const name = session.sessionName ? ` (${session.sessionName})` : "";
    return `${state.activeSessionId}/${session.sessionId}${name}`;
}
//# sourceMappingURL=active-session-state.js.map
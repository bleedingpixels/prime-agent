export function scopeHeartbeatsToSession(heartbeats, session, children) {
    if (!session) {
        return [];
    }
    const activeSessionIds = new Set();
    if (session.activeSessionId) {
        activeSessionIds.add(session.activeSessionId);
    }
    for (const child of children) {
        if (child.activeSessionId) {
            activeSessionIds.add(child.activeSessionId);
        }
    }
    return heartbeats.filter((heartbeat) => heartbeat.job.sessionId === session.sessionId || activeSessionIds.has(heartbeat.job.activeSessionId));
}
//# sourceMappingURL=heartbeat-scope.js.map
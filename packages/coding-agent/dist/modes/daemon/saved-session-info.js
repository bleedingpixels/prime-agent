export function serializeSavedSessionInfo(session) {
    return {
        path: session.path,
        id: session.id,
        cwd: session.cwd,
        name: session.name,
        state: session.state,
        parentSessionPath: session.parentSessionPath,
        rlmDepth: session.rlmDepth,
        created: session.created.toISOString(),
        modified: session.modified.toISOString(),
        messageCount: session.messageCount,
        firstMessage: session.firstMessage,
        allMessagesText: session.allMessagesText,
        agentStatus: session.agentStatus,
    };
}
export function deserializeSavedSessionInfo(session) {
    return {
        path: session.path,
        id: session.id,
        cwd: session.cwd,
        name: session.name,
        state: session.state,
        parentSessionPath: session.parentSessionPath,
        rlmDepth: session.rlmDepth,
        created: new Date(session.created),
        modified: new Date(session.modified),
        messageCount: session.messageCount,
        firstMessage: session.firstMessage,
        allMessagesText: session.allMessagesText,
        agentStatus: session.agentStatus,
    };
}
//# sourceMappingURL=saved-session-info.js.map
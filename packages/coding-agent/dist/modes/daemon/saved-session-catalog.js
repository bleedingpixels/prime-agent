import { deserializeDaemonError } from "./daemon-errors.js";
import { deserializeSavedSessionInfo } from "./saved-session-info.js";
export { deserializeSavedSessionInfo } from "./saved-session-info.js";
export async function listDaemonSavedSessions(client, context, scope, callbacks) {
    const command = "activeSessionId" in context
        ? { type: "list_saved_sessions", activeSessionId: context.activeSessionId, scope }
        : { type: "list_saved_sessions", cwd: context.cwd, sessionDir: context.sessionDir, scope };
    const response = await client.request(command, 30000, {
        onProgress: (update) => {
            if (update.type === "session_list_progress") {
                callbacks?.onProgress?.(update.loaded, update.total);
            }
            else {
                callbacks?.onSession?.(deserializeSavedSessionInfo(update.session));
            }
        },
    });
    if (!response.success) {
        throw deserializeDaemonError(response);
    }
    const data = response.data;
    return data.sessions.map(deserializeSavedSessionInfo);
}
export async function renameDaemonSavedSession(client, context, sessionPath, name) {
    const command = "activeSessionId" in context
        ? { type: "rename_saved_session", activeSessionId: context.activeSessionId, sessionPath, name }
        : { type: "rename_saved_session", sessionPath, name };
    const response = await client.request(command);
    if (!response.success) {
        throw deserializeDaemonError(response);
    }
}
export async function deleteDaemonSavedSession(client, context, sessionPath) {
    const command = "activeSessionId" in context
        ? { type: "delete_saved_session", activeSessionId: context.activeSessionId, sessionPath }
        : { type: "delete_saved_session", sessionPath };
    const response = await client.request(command);
    if (!response.success) {
        throw deserializeDaemonError(response);
    }
    return response.data;
}
//# sourceMappingURL=saved-session-catalog.js.map
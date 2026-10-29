import type { DeleteSessionFileResult } from "../../core/session-file-actions.js";
import type { AgentConnectionSavedSessionInfo, AgentConnectionSavedSessionScope, AgentConnectionSessionListCallbacks } from "../agent-connection/types.js";
import type { DaemonClient } from "./daemon-client.js";
export { deserializeSavedSessionInfo } from "./saved-session-info.js";
export type DaemonSavedSessionCatalogContext = {
    activeSessionId: string;
} | {
    cwd: string;
    sessionDir?: string;
};
export declare function listDaemonSavedSessions(client: DaemonClient, context: DaemonSavedSessionCatalogContext, scope: AgentConnectionSavedSessionScope, callbacks?: AgentConnectionSessionListCallbacks): Promise<AgentConnectionSavedSessionInfo[]>;
export declare function renameDaemonSavedSession(client: DaemonClient, context: DaemonSavedSessionCatalogContext, sessionPath: string, name: string): Promise<void>;
export declare function deleteDaemonSavedSession(client: DaemonClient, context: DaemonSavedSessionCatalogContext, sessionPath: string): Promise<DeleteSessionFileResult>;
//# sourceMappingURL=saved-session-catalog.d.ts.map
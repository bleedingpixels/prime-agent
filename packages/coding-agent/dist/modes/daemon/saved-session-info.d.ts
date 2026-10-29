import type { SessionInfo } from "../../core/session-manager.js";
import type { AgentConnectionSavedSessionInfo } from "../agent-connection/types.js";
import type { DaemonSavedSessionInfo } from "./daemon-protocol.js";
export declare function serializeSavedSessionInfo(session: SessionInfo): DaemonSavedSessionInfo;
export declare function deserializeSavedSessionInfo(session: DaemonSavedSessionInfo): AgentConnectionSavedSessionInfo;
//# sourceMappingURL=saved-session-info.d.ts.map
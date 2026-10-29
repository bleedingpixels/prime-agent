import type { AgentConnectionHeartbeat } from "../agent-connection/types.js";
import type { DaemonClient } from "./daemon-client.js";
export declare function listDaemonHeartbeats(client: DaemonClient, activeSessionId?: string): Promise<AgentConnectionHeartbeat[]>;
//# sourceMappingURL=heartbeat-catalog.d.ts.map
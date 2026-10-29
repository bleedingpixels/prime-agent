import type { Api, Model } from "@earendil-works/pi-ai";
import type { AgentSession } from "../../core/agent-session.js";
import type { AgentSessionRuntime } from "../../core/agent-session-runtime.js";
import type { AgentConnectionModel, AgentConnectionResourceSnapshot, AgentConnectionSlashCommand, AgentConnectionSnapshot, AgentConnectionState } from "./types.js";
export declare function createAgentConnectionState(runtime: AgentSessionRuntime, activeSessionId?: string): AgentConnectionState;
export declare function createAgentConnectionSnapshot(runtime: AgentSessionRuntime, activeSessionId?: string): AgentConnectionSnapshot;
export declare function createAgentConnectionCommands(session: AgentSession): AgentConnectionSlashCommand[];
export declare function createAgentConnectionResourceSnapshot(session: AgentSession): AgentConnectionResourceSnapshot;
export declare function toConnectionModel(model: Model<Api>): AgentConnectionModel;
export declare function toConnectionModel(model: Model<Api> | undefined): AgentConnectionModel | undefined;
//# sourceMappingURL=snapshot.d.ts.map
/**
 * RPC mode: headless operation with JSON commands on stdin and JSON responses/events on stdout.
 */
import type { AgentSessionRuntime } from "../../core/agent-session-runtime.js";
import type { AgentConnection } from "../agent-connection/types.js";
export type { RpcCommand, RpcExtensionUIRequest, RpcExtensionUIResponse, RpcObservedSessionEvent, RpcResponse, RpcSessionState, } from "./rpc-types.js";
export declare function runRpcMode(runtimeHost: AgentSessionRuntime): Promise<never>;
export declare function runRpcModeWithConnection(connection: AgentConnection): Promise<never>;
//# sourceMappingURL=rpc-mode.d.ts.map
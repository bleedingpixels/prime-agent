import type { SubagentRuntimeHost } from "../../core/rlm-runtime.js";
import type { AgentConnectionState } from "../agent-connection/types.js";
import type { ActiveSessionState } from "./active-session-state.js";
import { type DaemonOutbound } from "./daemon-protocol.js";
export interface ActiveSessionBindingCallbacks {
    broadcast: (state: ActiveSessionState, message: DaemonOutbound) => void;
    createConnectionState?: (state: ActiveSessionState) => AgentConnectionState;
    sessionReplaced?: (state: ActiveSessionState) => void;
    shutdown: () => void;
    subagentRuntimeHost?: SubagentRuntimeHost;
}
export declare function bindActiveSessionState(state: ActiveSessionState, callbacks: ActiveSessionBindingCallbacks): Promise<void>;
//# sourceMappingURL=daemon-extension-binding.d.ts.map
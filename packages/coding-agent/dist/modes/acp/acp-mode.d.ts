import * as acp from "@agentclientprotocol/sdk";
import type { AgentSessionRuntime } from "../../core/agent-session-runtime.js";
import type { AgentConnection } from "../agent-connection/types.js";
export interface AcpModeOptions {
    /** Bind headless extensions once the connection is live (in-process mode). */
    bindHeadlessExtensions?: () => Promise<void>;
    /**
     * Transport override. Defaults to NDJSON over stdio; tests supply an
     * in-memory stream pair so the protocol runs without a subprocess.
     */
    stream?: ReturnType<typeof acp.ndJsonStream>;
    /** Skip claiming stdout when the caller supplies its own transport. */
    ownStdout?: boolean;
}
export declare function runAcpMode(runtimeHost: AgentSessionRuntime): Promise<never>;
export declare function runAcpModeWithConnection(connection: AgentConnection, options?: AcpModeOptions): Promise<never>;
//# sourceMappingURL=acp-mode.d.ts.map
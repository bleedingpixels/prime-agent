import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { Model, ServiceTier } from "@earendil-works/pi-ai";
import type { AgentSessionMessageController } from "./agent-messages.js";
import type { AgentObserveController } from "./agent-observe.js";
import type { AgentExecutionMode } from "./agent-session-config.js";
import { AuthStorage } from "./auth-storage.js";
import type { AgentAutonomousConfig } from "./autonomous.js";
import type { AgentRlmHeartbeatController } from "./cron-jobs.js";
import type { SessionStartEvent, ToolDefinition } from "./extensions/index.js";
import { McpManager } from "./mcp/mcp-manager.js";
import { ModelRegistry } from "./model-registry.js";
import { type DefaultResourceLoaderOptions, type ResourceLoader } from "./resource-loader.js";
import type { SubagentRuntimeHost } from "./rlm-runtime.js";
import { type CreateAgentSessionResult } from "./sdk.js";
import type { SessionManager } from "./session-manager.js";
import { SettingsManager } from "./settings-manager.js";
/**
 * Non-fatal issues collected while creating services or sessions.
 *
 * Runtime creation returns diagnostics to the caller instead of printing or
 * exiting. The app layer decides whether warnings should be shown and whether
 * errors should abort startup.
 */
export interface AgentSessionRuntimeDiagnostic {
    type: "info" | "warning" | "error";
    message: string;
}
/**
 * Inputs for creating cwd-bound runtime services.
 *
 * These services are recreated whenever the effective session cwd changes.
 * CLI-provided resource paths should be resolved to absolute paths before they
 * reach this function, so later cwd switches do not reinterpret them.
 */
export interface CreateAgentSessionServicesOptions {
    cwd: string;
    agentDir?: string;
    authStorage?: AuthStorage;
    settingsManager?: SettingsManager;
    modelRegistry?: ModelRegistry;
    extensionFlagValues?: Map<string, boolean | string>;
    resourceLoaderOptions?: Omit<DefaultResourceLoaderOptions, "cwd" | "agentDir" | "settingsManager">;
    /**
     * Skip the built-in Herdr reporter for these services. Set for RLM subagent
     * runtimes: they inherit the parent's HERDR_* pane identity, so their own
     * reporter would race the parent's on the same pane and a subagent quit
     * would release the pane while the parent is still running.
     */
    noBuiltinHerdrReporter?: boolean;
    /** Explicit daemon-carried opt-out; cannot enable telemetry. */
    telemetryDisabled?: true;
}
export interface AgentSessionCreationOptions {
    model?: Model<any>;
    thinkingLevel?: ThinkingLevel;
    /** Provider service tier. Fast mode uses "priority". */
    serviceTier?: ServiceTier;
    scopedModels?: Array<{
        model: Model<any>;
        thinkingLevel?: ThinkingLevel;
    }>;
    tools?: string[];
    noTools?: "all" | "builtin";
    customTools?: ToolDefinition[];
    initialActiveToolNames?: string[];
    allowedToolNames?: string[];
    includeGoals?: boolean;
    includeCompactSkill?: boolean;
    agentMessageController?: AgentSessionMessageController;
    agentObserveController?: AgentObserveController;
    rlmDepth?: number;
    rlmMaxDepth?: number;
    rlmSessionDir?: string;
    rlmParentNodeId?: string;
    rlmParentAgent?: string;
    subagentRuntimeHost?: SubagentRuntimeHost;
    rlmHeartbeatController?: AgentRlmHeartbeatController;
    prewarmIpythonKernel?: boolean;
    autonomous?: AgentAutonomousConfig;
    /** Serialized refine mode for print/headless autonomous runs. */
    serializedRefine?: boolean;
    /** User-facing client mode that created the top-level session. */
    executionMode?: AgentExecutionMode;
    /** Explicit daemon-carried opt-out; cannot enable telemetry. */
    telemetryDisabled?: true;
    /** Initial goal to seed at session creation (rlmDepth 0 only, idempotent). */
    initialGoal?: {
        objective: string;
        tokenBudget?: number;
    };
}
/**
 * Inputs for creating an AgentSession from already-created services.
 *
 * Use this after services exist and any cwd-bound model/tool/session options
 * have been resolved against those services.
 */
export interface CreateAgentSessionFromServicesOptions extends AgentSessionCreationOptions {
    services: AgentSessionServices;
    sessionManager: SessionManager;
    sessionStartEvent?: SessionStartEvent;
}
/**
 * Coherent cwd-bound runtime services for one effective session cwd.
 *
 * This is infrastructure only. The AgentSession itself is created separately so
 * session options can be resolved against these services first.
 */
export interface AgentSessionServices {
    cwd: string;
    agentDir: string;
    authStorage: AuthStorage;
    settingsManager: SettingsManager;
    modelRegistry: ModelRegistry;
    resourceLoader: ResourceLoader;
    mcpManager: McpManager;
    diagnostics: AgentSessionRuntimeDiagnostic[];
}
/**
 * Create cwd-bound runtime services.
 *
 * Returns services plus diagnostics. It does not create an AgentSession.
 */
export declare function createAgentSessionServices(options: CreateAgentSessionServicesOptions): Promise<AgentSessionServices>;
/**
 * Create an AgentSession from previously created services.
 *
 * This keeps session creation separate from service creation so callers can
 * resolve model, thinking, tools, and other session inputs against the target
 * cwd before constructing the session.
 */
export declare function createAgentSessionFromServices(options: CreateAgentSessionFromServicesOptions): Promise<CreateAgentSessionResult>;
//# sourceMappingURL=agent-session-services.d.ts.map
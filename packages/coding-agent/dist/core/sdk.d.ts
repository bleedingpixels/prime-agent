import { type ThinkingLevel } from "@earendil-works/pi-agent-core";
import { type Model } from "@earendil-works/pi-ai";
import { AgentSession } from "./agent-session.js";
import type { AgentSessionCreationOptions } from "./agent-session-services.js";
import { AuthStorage } from "./auth-storage.js";
import type { AgentAutonomousConfig } from "./autonomous.js";
import type { LoadExtensionsResult, SessionStartEvent, ToolDefinition } from "./extensions/index.js";
import { McpManager } from "./mcp/mcp-manager.js";
import { ModelRegistry } from "./model-registry.js";
import type { ResourceLoader } from "./resource-loader.js";
import { SessionManager } from "./session-manager.js";
import { SettingsManager } from "./settings-manager.js";
import { createBashTool, createEditTool, createIpythonTool, withFileMutationQueue } from "./tools/index.js";
export interface CreateAgentSessionOptions extends AgentSessionCreationOptions {
    /** Working directory for project-local discovery. Default: process.cwd() */
    cwd?: string;
    /** Global config directory. Default: ~/.pi/agent */
    agentDir?: string;
    /** Auth storage for credentials. Default: AuthStorage.create(agentDir/auth.json) */
    authStorage?: AuthStorage;
    /** Model registry. Default: ModelRegistry.create(authStorage, agentDir/models.json) */
    modelRegistry?: ModelRegistry;
    /** Model to use. Default: from settings, else first available */
    model?: Model<any>;
    /** Thinking level. Default: from settings, else 'medium' (clamped to model capabilities) */
    thinkingLevel?: ThinkingLevel;
    /** Models available for cycling (Ctrl+P in interactive mode) */
    scopedModels?: Array<{
        model: Model<any>;
        thinkingLevel?: ThinkingLevel;
    }>;
    /**
     * Optional default tool suppression mode when no explicit allowlist is provided.
     *
     * - "all": start with no tools enabled
     * - "builtin": disable the default built-in tool (ipython)
     *   but keep extension/custom tools enabled
     */
    noTools?: "all" | "builtin";
    /**
     * Optional allowlist of tool names.
     *
     * When omitted, pi enables the default built-in tool (ipython)
     * and leaves extension/custom tools enabled unless `noTools` changes that default.
     * When provided, only the listed tool names are enabled.
     */
    tools?: string[];
    /** Custom tools to register (in addition to built-in tools). */
    customTools?: ToolDefinition[];
    /** Resource loader. When omitted, DefaultResourceLoader is used. */
    resourceLoader?: ResourceLoader;
    /** MCP integration manager. When omitted, MCP host handlers are not wired. */
    mcpManager?: McpManager;
    /** Session manager. Default: SessionManager.create(cwd) */
    sessionManager?: SessionManager;
    /** Settings manager. Default: SettingsManager.create(cwd, agentDir) */
    settingsManager?: SettingsManager;
    /** Session start event metadata for extension runtime startup. */
    sessionStartEvent?: SessionStartEvent;
    /** Host-side autonomous continuation policy. */
    autonomous?: AgentAutonomousConfig;
}
/** Result from createAgentSession */
export interface CreateAgentSessionResult {
    /** The created session */
    session: AgentSession;
    /** Extensions result (for UI context setup in interactive mode) */
    extensionsResult: LoadExtensionsResult;
    /** Warning if session was restored with a different model than saved */
    modelFallbackMessage?: string;
}
export type { AgentSessionRuntimeConfig } from "./agent-session-config.js";
export * from "./agent-session-runtime.js";
export type { AgentSessionCreationOptions } from "./agent-session-services.js";
export type { ExtensionAPI, ExtensionCommandContext, ExtensionContext, ExtensionFactory, SlashCommandInfo, SlashCommandSource, ToolDefinition, } from "./extensions/index.js";
export type { PromptTemplate } from "./prompt-templates.js";
export type { CreateRlmSubagentRuntimeOptions, RlmSubagentRuntime, SubagentRuntimeHost } from "./rlm-runtime.js";
export type { Skill } from "./skills.js";
export type { Tool } from "./tools/index.js";
export { createBashTool, createEditTool, createIpythonTool, withFileMutationQueue, };
/**
 * Create an AgentSession with the specified options.
 *
 * @example
 * ```typescript
 * // Minimal - uses defaults
 * const { session } = await createAgentSession();
 *
 * // With explicit model
 * import { getModel } from '@earendil-works/pi-ai';
 * const { session } = await createAgentSession({
 *   model: getModel('anthropic', 'claude-opus-4-5'),
 *   thinkingLevel: 'high',
 * });
 *
 * // Continue previous session
 * const { session, modelFallbackMessage } = await createAgentSession({
 *   continueSession: true,
 * });
 *
 * // Full control
 * const loader = new DefaultResourceLoader({
 *   cwd: process.cwd(),
 *   agentDir: getAgentDir(),
 *   settingsManager: SettingsManager.create(),
 * });
 * await loader.reload();
 * const { session } = await createAgentSession({
 *   model: myModel,
 *   tools: ["ipython"],
 *   resourceLoader: loader,
 *   sessionManager: SessionManager.inMemory(),
 * });
 * ```
 */
export declare function createAgentSession(options?: CreateAgentSessionOptions): Promise<CreateAgentSessionResult>;
//# sourceMappingURL=sdk.d.ts.map
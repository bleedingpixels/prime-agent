import type { AgentSession, ExtensionBindings } from "../../core/agent-session.js";
import type { AgentSessionRuntime } from "../../core/agent-session-runtime.js";
import type { AgentSessionServices } from "../../core/agent-session-services.js";
import type { ExtensionCommandContext, ExtensionRunner, ToolDefinition } from "../../core/extensions/index.js";
import type { ModelRegistry } from "../../core/model-registry.js";
import type { SessionManager } from "../../core/session-manager.js";
import type { SettingsManager } from "../../core/settings-manager.js";
import type { Theme } from "./theme/theme.js";
/**
 * Local UI services that are intentionally separate from AgentConnection.
 *
 * These services cover client-local concerns such as settings, auth/model
 * registry access, and theme registration. They are not execution ownership and
 * should not be used to reach back into AgentSessionRuntime or AgentSession.
 */
export interface InteractiveModeUiServices {
    settingsManager: SettingsManager;
    modelRegistry: ModelRegistry;
    getInitialCwd(): string;
    getInitialSessionName(): string | undefined;
    getThemes(): Theme[];
}
type LocalExtensionNewSessionOptions = Parameters<ExtensionCommandContext["newSession"]>[0];
type LocalExtensionForkOptions = Parameters<ExtensionCommandContext["fork"]>[1];
type LocalExtensionSwitchOptions = NonNullable<Parameters<ExtensionCommandContext["switchSession"]>[1]> & {
    cwdOverride?: string;
};
export type InteractiveModeLocalToolRendererDefinition = Pick<ToolDefinition, "renderCall" | "renderResult" | "renderShell">;
/**
 * In-process compatibility adapter for local-only extension hooks.
 *
 * This is deliberately not part of AgentConnection. It may expose
 * AgentSessionRuntime-backed callbacks for the legacy in-process path, but
 * daemon/gateway-backed InteractiveMode instances must run with
 * bindLocalSessionExtensions disabled and without this host.
 */
export interface InteractiveModeLocalSessionHost {
    createUiServices(): InteractiveModeUiServices;
    getSessionManager(): SessionManager;
    getExtensionRunner(): ExtensionRunner;
    getToolRendererDefinition(toolName: string): InteractiveModeLocalToolRendererDefinition | undefined;
    getSystemPrompt(): string;
    getAbortSignal(): AbortSignal | undefined;
    bindExtensions(bindings: ExtensionBindings): Promise<void>;
    newSession(options?: LocalExtensionNewSessionOptions): Promise<{
        cancelled: boolean;
    }>;
    fork(entryId: string, options?: LocalExtensionForkOptions): Promise<{
        cancelled: boolean;
        selectedText?: string;
    }>;
    switchSession(sessionPath: string, options?: LocalExtensionSwitchOptions): Promise<{
        cancelled: boolean;
    }>;
}
export declare function createInteractiveModeUiServices(session: AgentSession): InteractiveModeUiServices;
export declare function createInteractiveModeUiServicesFromServices(options: {
    services: AgentSessionServices;
    sessionManager: SessionManager;
}): InteractiveModeUiServices;
export declare function createInteractiveModeLocalSessionHost(runtimeHost: AgentSessionRuntime): InteractiveModeLocalSessionHost;
export {};
//# sourceMappingURL=interactive-mode-services.d.ts.map
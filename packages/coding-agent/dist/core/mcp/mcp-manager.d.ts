import type { AuthStorage } from "../auth-storage.js";
import type { McpServerConfig } from "../settings-manager.js";
export interface McpManagerOptions {
    authStorage: AuthStorage;
    /** Reads the current Settings.mcpServers (name → config). Re-read on refresh(). */
    getUserServers?: () => Record<string, McpServerConfig> | undefined;
    /** Start an interactive host-side login for a server. Provided by the UI mode. */
    beginLogin?: (server: string) => Promise<void>;
}
export declare class McpManager {
    private readonly authStorage;
    private readonly getUserServers;
    private readonly beginLogin?;
    private integrations;
    /** Provider ids we registered for user servers, so refresh can drop removed ones. */
    private registeredUserProviderIds;
    constructor(options: McpManagerOptions);
    /** Re-read settings and re-register providers; call after a session reload. */
    refresh(): void;
    private providerId;
    private resolveIntegrations;
    private registerProviders;
    /**
     * Register OAuth providers for user-declared (non-catalog) servers. Public so it
     * can run after ModelRegistry.refresh() resets the registry — otherwise custom
     * `mcp:<server>` providers vanish on every refresh (e.g. post-login).
     */
    registerUserProviders(): void;
    /** True when valid credentials exist for the integration (drives enablement). */
    private isAuthed;
    /** `-<server>/SKILL.md` overrides for every built-in integration the user isn't logged into. */
    getDisabledBuiltinSkillOverrides(): string[];
    /** Host-request handlers exposed to the kernel. */
    hostHandlers(): Record<string, (payload: Record<string, unknown>) => Promise<Record<string, unknown>>>;
    /** Status for the /mcp list command. */
    listStatus(): Array<{
        server: string;
        label: string;
        enabled: boolean;
        usesOAuth: boolean;
    }>;
}
//# sourceMappingURL=mcp-manager.d.ts.map
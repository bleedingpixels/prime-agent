// Host side of MCP integrations. The protocol itself runs Python-side in the kernel; the host
// only registers OAuth providers, gates integration skills by auth, and serves mcp.* host-requests.
import { BUILTIN_MCP_CATALOG, createMcpOAuthProvider, getCatalogEntry, registerBuiltinMcpOAuthProviders, } from "@earendil-works/pi-ai/mcp";
import { registerOAuthProvider, unregisterOAuthProvider } from "@earendil-works/pi-ai/oauth";
export class McpManager {
    authStorage;
    getUserServers;
    beginLogin;
    integrations = new Map();
    /** Provider ids we registered for user servers, so refresh can drop removed ones. */
    registeredUserProviderIds = new Set();
    constructor(options) {
        this.authStorage = options.authStorage;
        this.getUserServers = options.getUserServers ?? (() => undefined);
        this.beginLogin = options.beginLogin;
        this.resolveIntegrations();
        this.registerProviders();
    }
    /** Re-read settings and re-register providers; call after a session reload. */
    refresh() {
        this.resolveIntegrations();
        this.registerProviders();
    }
    providerId(server) {
        return `mcp:${server}`;
    }
    resolveIntegrations() {
        const integrations = new Map();
        for (const entry of BUILTIN_MCP_CATALOG) {
            integrations.set(entry.server, {
                server: entry.server,
                label: entry.label,
                url: entry.url,
                usesOAuth: entry.oauth?.kind === "oauth",
            });
        }
        for (const [server, config] of Object.entries(this.getUserServers() ?? {})) {
            if (config.type !== "http")
                continue; // stdio servers self-manage in Python
            integrations.set(server, {
                server,
                label: server,
                url: config.url,
                usesOAuth: config.oauth === true,
                bearerTokenEnvVar: config.bearerTokenEnvVar,
                enabled: config.enabled,
                headers: config.headers,
                userDeclared: true,
            });
        }
        this.integrations = integrations;
    }
    registerProviders() {
        registerBuiltinMcpOAuthProviders();
        this.registerUserProviders();
    }
    /**
     * Register OAuth providers for user-declared (non-catalog) servers. Public so it
     * can run after ModelRegistry.refresh() resets the registry — otherwise custom
     * `mcp:<server>` providers vanish on every refresh (e.g. post-login).
     */
    registerUserProviders() {
        const current = new Set();
        for (const integration of this.integrations.values()) {
            if (!integration.userDeclared)
                continue;
            const id = this.providerId(integration.server);
            if (integration.usesOAuth) {
                // Register pointing at the user's URL (overrides a catalog default too).
                current.add(id);
                registerOAuthProvider(createMcpOAuthProvider({
                    server: integration.server,
                    label: integration.label,
                    url: integration.url,
                }));
            }
            else if (getCatalogEntry(integration.server)) {
                // User overrode a catalog server with a custom URL but no oauth: drop the
                // built-in provider so we never send the official token to that URL.
                unregisterOAuthProvider(id);
            }
        }
        // Drop providers for user servers removed since the last registration.
        for (const id of this.registeredUserProviderIds) {
            if (!current.has(id))
                unregisterOAuthProvider(id);
        }
        this.registeredUserProviderIds = current;
    }
    /** True when valid credentials exist for the integration (drives enablement). */
    isAuthed(integration) {
        if (integration.enabled === false)
            return false;
        if (integration.bearerTokenEnvVar && process.env[integration.bearerTokenEnvVar]?.trim()) {
            return true;
        }
        // A user server that overrides a catalog name must NOT inherit the built-in's
        // stored mcp: creds — those were issued for the official endpoint and could be
        // sent to the override URL. Such an override authenticates only via a bearer
        // env var (handled above); we don't trust auth.json OAuth creds for it.
        if (integration.userDeclared && getCatalogEntry(integration.server)) {
            return false;
        }
        const cred = this.authStorage.get(this.providerId(integration.server));
        return cred !== undefined;
    }
    /** `-<server>/SKILL.md` overrides for every built-in integration the user isn't logged into. */
    getDisabledBuiltinSkillOverrides() {
        const overrides = [];
        for (const entry of BUILTIN_MCP_CATALOG) {
            const integration = this.integrations.get(entry.server);
            if (integration && !this.isAuthed(integration)) {
                overrides.push(`-${entry.server}/SKILL.md`);
            }
        }
        return overrides;
    }
    /** Host-request handlers exposed to the kernel. */
    hostHandlers() {
        const handlers = {
            "mcp.refresh": async (payload) => {
                const server = String(payload.server ?? "");
                if (!server)
                    throw new Error("mcp.refresh requires a server");
                // getApiKey refreshes + rewrites auth.json under lock; Python re-reads.
                // Surface failure (throw) instead of a false success so the kernel can
                // report a refresh error rather than a misleading "not enabled".
                const key = await this.authStorage.getApiKey(this.providerId(server));
                if (!key)
                    throw new Error(`Could not refresh credentials for ${server}`);
                return {};
            },
            // Resolved config so the kernel skill connects to the same URL the host
            // registered/authenticated (honors a user's mcpServers `url` override).
            "mcp.config": async (payload) => {
                const server = String(payload.server ?? "");
                if (!server)
                    throw new Error("mcp.config requires a server");
                const integration = this.integrations.get(server);
                if (!integration)
                    return {};
                const config = { url: integration.url };
                if (integration.headers && Object.keys(integration.headers).length > 0) {
                    config.headers = integration.headers;
                }
                return config;
            },
        };
        // Only expose begin_login when an interactive login is actually wired, so the
        // kernel doesn't get a handler whose only behavior is to throw.
        const beginLogin = this.beginLogin;
        if (beginLogin) {
            handlers["mcp.begin_login"] = async (payload) => {
                const server = String(payload.server ?? "");
                if (!server)
                    throw new Error("mcp.begin_login requires a server");
                await beginLogin(server);
                return {};
            };
        }
        return handlers;
    }
    /** Status for the /mcp list command. */
    listStatus() {
        return Array.from(this.integrations.values()).map((integration) => ({
            server: integration.server,
            label: integration.label,
            enabled: this.isAuthed(integration),
            usesOAuth: integration.usesOAuth,
        }));
    }
}
//# sourceMappingURL=mcp-manager.js.map
import type { OAuthProviderInterface } from "../utils/oauth/types.js";
export interface McpOAuthConfig {
    /** MCP server name; provider id becomes `mcp:<server>`. */
    server: string;
    /** Human label for UI. */
    label?: string;
    /** The MCP endpoint URL — discovery is rooted at its origin. */
    url: string;
    /** Pre-registered client id (servers without DCR, e.g. Slack). */
    clientId?: string;
    /** Explicit scopes; falls back to the server's advertised scopes. */
    scopes?: string;
}
/** Build a provider for one MCP server. Register it with registerOAuthProvider(). */
export declare function createMcpOAuthProvider(config: McpOAuthConfig): OAuthProviderInterface;
//# sourceMappingURL=oauth.d.ts.map
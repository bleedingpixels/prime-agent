import { type McpOAuthConfig } from "./oauth.js";
export interface McpCatalogEntry {
    /** Matches the skill package import name and the auth.json key `mcp:<server>`. */
    server: string;
    label: string;
    url: string;
    oauth?: Omit<McpOAuthConfig, "server" | "url"> & {
        kind: "oauth";
    };
}
export declare const BUILTIN_MCP_CATALOG: readonly McpCatalogEntry[];
export declare function getCatalogEntry(server: string): McpCatalogEntry | undefined;
/**
 * Register the built-in catalog's OAuth providers. Idempotent. Must be called
 * after any resetOAuthProviders() (e.g. ModelRegistry.refresh) since reset drops
 * everything but the model-provider built-ins.
 */
export declare function registerBuiltinMcpOAuthProviders(): void;
//# sourceMappingURL=catalog.d.ts.map
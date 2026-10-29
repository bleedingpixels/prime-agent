/**
 * Provider authentication flows (login/logout dialogs and selectors).
 *
 * Extracted from InteractiveMode so any TUI surface that owns a `TUI` and a
 * `ModelRegistry` (interactive sessions, the agents view) can run the same
 * auth UI. Host-specific side effects (footer refresh, billing warnings) hang
 * off the small host interface instead of the flows themselves.
 */
import type { TUI } from "@earendil-works/pi-tui";
import type { ModelRegistry } from "../../core/model-registry.js";
import { type AuthSelectorCategory, type AuthSelectorProvider } from "./components/oauth-selector.js";
export type AuthenticationResult = {
    status: "success";
    providerId: string;
    providerName: string;
    authType: "oauth" | "api_key";
    /** "service" credentials (e.g. web search) don't affect model selection. */
    kind?: "provider" | "service";
} | {
    status: "cancelled";
} | {
    status: "failed";
};
export declare const BEDROCK_PROVIDER_ID = "amazon-bedrock";
export declare const ANTHROPIC_SUBSCRIPTION_AUTH_WARNING = "Anthropic subscription auth is active. Third-party harness usage draws from extra usage and is billed per token, not your Claude plan limits. Manage extra usage at https://claude.ai/settings/usage.";
/** Returns the extra-usage warning when the given model would run on Anthropic subscription auth. */
export declare function getAnthropicSubscriptionAuthWarning(modelRegistry: ModelRegistry, model: {
    provider: string;
} | undefined): Promise<string | undefined>;
export declare function isApiKeyLoginProvider(providerId: string, oauthProviderIds: ReadonlySet<string>, builtInProviderIds?: ReadonlySet<string>): boolean;
export interface ProviderAuthFlowsHost {
    readonly ui: TUI;
    readonly modelRegistry: ModelRegistry;
    showStatus(message: string): void;
    showError(message: string): void;
    /** Models currently visible to the host; used to detect providers configured via external credentials. */
    getAvailableModels(): Promise<ReadonlyArray<{
        provider: string;
    }>>;
    /** Invoked after stored credentials change so the host can refresh dependent UI. */
    onAuthChanged?(): void | Promise<void>;
    /** Invoked after a successful login (e.g. to surface billing warnings). */
    onLoginCompleted?(): void;
}
export interface ProviderLoginOptions {
    authType?: "oauth" | "api_key";
    initialCategory?: AuthSelectorCategory;
}
export declare class ProviderAuthFlows {
    private readonly host;
    constructor(host: ProviderAuthFlowsHost);
    /** Runs the provider selector followed by the matching login dialog. */
    /**
     * Run the OAuth login flow for an MCP integration server.
     *
     * The provider must already be registered (the McpManager does this as
     * `mcp:<server>`). On success the credentials land in auth.json and the
     * caller should reload resources so the integration's skill enables.
     */
    runMcpLogin(server: string, label?: string): Promise<AuthenticationResult>;
    runLogin(options?: ProviderLoginOptions): Promise<AuthenticationResult>;
    loginProvider(providerOption: AuthSelectorProvider): Promise<AuthenticationResult>;
    /** Shows the stored-credential selector and removes the chosen credential. */
    /** Returns the provider id that was logged out, or null if nothing changed (cancelled / none). */
    runLogout(): Promise<string | null>;
    getLoginProviderOptions(authType?: "oauth" | "api_key"): AuthSelectorProvider[];
    private getLogoutProviderOptions;
    private completeProviderAuthentication;
    private completeExternalProviderSetup;
    private hasAvailableProviderModels;
    private showBedrockSetupDialog;
    private showPrimeTeamSelector;
    private getPrimeInferenceDefaultTeamStatus;
    private selectPrimeInferenceTeam;
    private completePrimeInferenceLogin;
    private completePrimeAgentTracesLogin;
    runPrimeInferenceLogin(): Promise<AuthenticationResult>;
    runPrimeAgentTracesLogin(): Promise<AuthenticationResult>;
    private showApiKeyLoginDialog;
    private showOAuthLoginSelect;
    private showLoginDialog;
}
//# sourceMappingURL=auth-flows.d.ts.map
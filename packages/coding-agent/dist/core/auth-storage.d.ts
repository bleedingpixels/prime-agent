/**
 * Credential storage for API keys and OAuth tokens.
 * Handles loading, saving, and refreshing credentials from auth.json.
 *
 * Uses file locking to prevent race conditions when multiple pi instances
 * try to refresh tokens simultaneously.
 */
import { type OAuthCredentials, type OAuthLoginCallbacks, type OAuthProviderId } from "@earendil-works/pi-ai";
import { type PrimeTeam } from "./prime-inference-auth.js";
export type PrimeTeamCredential = {
    teamId: string;
    name: string;
    slug?: string;
    role?: string;
    createdAt?: string;
};
export type ApiKeyCredential = {
    type: "api_key";
    key: string;
    primeTeam?: PrimeTeamCredential | null;
};
export type OAuthCredential = {
    type: "oauth";
} & OAuthCredentials;
export type AuthCredential = ApiKeyCredential | OAuthCredential;
export type AuthStorageData = Record<string, AuthCredential>;
export type AuthStatus = {
    configured: boolean;
    source?: "stored" | "runtime" | "environment" | "prime_cli" | "fallback" | "models_json_key" | "models_json_command" | "stale";
    label?: string;
};
export type AuthStorageOptions = {
    primeCliConfigPath?: string;
    usePrimeCliConfig?: boolean;
};
type LockResult<T> = {
    result: T;
    next?: string;
};
type ActiveAuthStatusSource = Exclude<NonNullable<AuthStatus["source"]>, "stale">;
export type AuthSourceToken = {
    provider: string;
    source: ActiveAuthStatusSource;
    identityFingerprint: string;
    valueFingerprint: string;
};
type AuthApiKeyResult = {
    apiKey?: string;
    sourceToken?: AuthSourceToken;
};
export interface AuthStorageBackend {
    withLock<T>(fn: (current: string | undefined) => LockResult<T>): T;
    withLockAsync<T>(fn: (current: string | undefined) => Promise<LockResult<T>>): Promise<T>;
}
export declare class FileAuthStorageBackend implements AuthStorageBackend {
    private authPath;
    constructor(authPath?: string);
    private ensureParentDir;
    private ensureFileExists;
    private acquireLockSyncWithRetry;
    withLock<T>(fn: (current: string | undefined) => LockResult<T>): T;
    withLockAsync<T>(fn: (current: string | undefined) => Promise<LockResult<T>>): Promise<T>;
}
export declare class InMemoryAuthStorageBackend implements AuthStorageBackend {
    private value;
    withLock<T>(fn: (current: string | undefined) => LockResult<T>): T;
    withLockAsync<T>(fn: (current: string | undefined) => Promise<LockResult<T>>): Promise<T>;
}
/**
 * Credential storage backed by a JSON file.
 */
export declare class AuthStorage {
    private storage;
    private options;
    private data;
    private runtimeOverrides;
    private staleAuthSources;
    private fallbackResolver?;
    private loadError;
    private errors;
    private constructor();
    static create(authPath?: string, options?: AuthStorageOptions): AuthStorage;
    static fromStorage(storage: AuthStorageBackend, options?: AuthStorageOptions): AuthStorage;
    static inMemory(data?: AuthStorageData, options?: AuthStorageOptions): AuthStorage;
    /**
     * Set a runtime API key override (not persisted to disk).
     * Used for CLI --api-key flag.
     */
    setRuntimeApiKey(provider: string, apiKey: string): void;
    /**
     * Remove a runtime API key override.
     */
    removeRuntimeApiKey(provider: string): void;
    /**
     * Set a fallback resolver for API keys not found in auth.json or env vars.
     * Used for custom provider keys from models.json.
     */
    setFallbackResolver(resolver: (provider: string) => string | undefined): void;
    private recordError;
    private fingerprintAuthSource;
    private createAuthSourceCandidate;
    private getStoredCredentialValueMaterial;
    private getRuntimeAuthCandidate;
    private getPrimeCliAuthCandidate;
    private getStoredAuthCandidate;
    private getEnvironmentAuthCandidate;
    private getAmbientEnvironmentIdentityMaterial;
    private getFallbackAuthCandidate;
    private getAuthSourceCandidates;
    private isAuthSourceStale;
    private getMatchingStaleAuthSources;
    private getAvailableAuthCandidate;
    private toAuthStatus;
    private getAuthStatusFromCandidates;
    markAuthStale(provider: string): boolean;
    private getAuthSourceTokenForCandidate;
    getCurrentAuthSourceToken(provider: string): AuthSourceToken | undefined;
    markAuthSourceStale(token: AuthSourceToken): boolean;
    private clearStaleAuthSource;
    private parseStorageData;
    /**
     * Reload credentials from storage.
     */
    reload(): void;
    private persistProviderChange;
    /**
     * Get credential for a provider.
     */
    get(provider: string): AuthCredential | undefined;
    /**
     * Set credential for a provider.
     */
    set(provider: string, credential: AuthCredential): void;
    /**
     * Remove credential for a provider.
     */
    remove(provider: string): void;
    /**
     * List all providers with credentials.
     */
    list(): string[];
    /**
     * Check if credentials exist for a provider in auth.json.
     */
    has(provider: string): boolean;
    /**
     * Check if any form of auth is configured for a provider.
     * Unlike getApiKey(), this doesn't refresh OAuth tokens.
     */
    hasAuth(provider: string): boolean;
    /**
     * Return auth status without exposing credential values or refreshing tokens.
     */
    getAuthStatus(provider: string): AuthStatus;
    /**
     * Get all credentials (for passing to getOAuthApiKey).
     */
    getAll(): AuthStorageData;
    drainErrors(): Error[];
    /**
     * Login to an OAuth provider.
     */
    login(providerId: OAuthProviderId, callbacks: OAuthLoginCallbacks): Promise<void>;
    /**
     * Logout from a provider.
     */
    logout(provider: string): void;
    private refreshOAuthTokenWithLock;
    /**
     * Get API key for a provider.
     * Priority:
     * 1. Runtime override (CLI --api-key)
     * 2. Prime Inference: environment variable, Prime CLI config, auth.json
     * 3. Other providers: auth.json, environment variable
     * 4. Fallback resolver (models.json custom providers)
     */
    getApiKeyWithSourceToken(providerId: string, options?: {
        includeFallback?: boolean;
    }): Promise<AuthApiKeyResult>;
    getApiKey(providerId: string, options?: {
        includeFallback?: boolean;
    }): Promise<string | undefined>;
    /**
     * Get all registered OAuth providers
     */
    getOAuthProviders(): import("@earendil-works/pi-ai").OAuthProviderInterface[];
    setPrimeInferenceTeamSelection(team: PrimeTeam | null): void;
    setPrimeInferenceApiKey(apiKey: string): void;
    getPrimeInferenceTeamSelection(): PrimeTeamCredential | null | undefined;
    getProviderHeaders(providerId: string): Record<string, string> | undefined;
    getPrimeCliConfigPath(): string | undefined;
    private toPrimeTeamCredential;
    private getPrimeCliConfig;
    private getPrimeCliApiKey;
    private getEnabledPrimeCliConfigPath;
    private isPrimeCliConfigEnabled;
}
export {};
//# sourceMappingURL=auth-storage.d.ts.map
/**
 * Credential storage for API keys and OAuth tokens.
 * Handles loading, saving, and refreshing credentials from auth.json.
 *
 * Uses file locking to prevent race conditions when multiple pi instances
 * try to refresh tokens simultaneously.
 */
import { createHash } from "node:crypto";
import { findEnvKeys, getEnvApiKey, } from "@earendil-works/pi-ai";
import { getOAuthApiKey, getOAuthProvider, getOAuthProviders } from "@earendil-works/pi-ai/oauth";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import lockfile from "proper-lockfile";
import { getAgentDir } from "../config.js";
import { clearPrimeCliCredentials, getPrimeCliConfigPath, loadPrimeCliConfig, PRIME_INFERENCE_PROVIDER_ID, savePrimeCliApiKey, savePrimeCliTeamSelection, } from "./prime-inference-auth.js";
import { resolveConfigValue, resolveConfigValueUncached } from "./resolve-config-value.js";
export class FileAuthStorageBackend {
    authPath;
    constructor(authPath = join(getAgentDir(), "auth.json")) {
        this.authPath = authPath;
    }
    ensureParentDir() {
        const dir = dirname(this.authPath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true, mode: 0o700 });
        }
    }
    ensureFileExists() {
        if (!existsSync(this.authPath)) {
            writeFileSync(this.authPath, "{}", "utf-8");
            chmodSync(this.authPath, 0o600);
        }
    }
    acquireLockSyncWithRetry(path) {
        const maxAttempts = 10;
        const delayMs = 20;
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return lockfile.lockSync(path, { realpath: false });
            }
            catch (error) {
                const code = typeof error === "object" && error !== null && "code" in error
                    ? String(error.code)
                    : undefined;
                if (code !== "ELOCKED" || attempt === maxAttempts) {
                    throw error;
                }
                lastError = error;
                const start = Date.now();
                while (Date.now() - start < delayMs) {
                    // Sleep synchronously to avoid changing callers to async.
                }
            }
        }
        throw lastError ?? new Error("Failed to acquire auth storage lock");
    }
    withLock(fn) {
        this.ensureParentDir();
        this.ensureFileExists();
        let release;
        try {
            release = this.acquireLockSyncWithRetry(this.authPath);
            const current = existsSync(this.authPath) ? readFileSync(this.authPath, "utf-8") : undefined;
            const { result, next } = fn(current);
            if (next !== undefined) {
                writeFileSync(this.authPath, next, "utf-8");
                chmodSync(this.authPath, 0o600);
            }
            return result;
        }
        finally {
            if (release) {
                release();
            }
        }
    }
    async withLockAsync(fn) {
        this.ensureParentDir();
        this.ensureFileExists();
        let release;
        let lockCompromised = false;
        let lockCompromisedError;
        const throwIfCompromised = () => {
            if (lockCompromised) {
                throw lockCompromisedError ?? new Error("Auth storage lock was compromised");
            }
        };
        try {
            release = await lockfile.lock(this.authPath, {
                retries: {
                    retries: 10,
                    factor: 2,
                    minTimeout: 100,
                    maxTimeout: 10000,
                    randomize: true,
                },
                stale: 30000,
                onCompromised: (err) => {
                    lockCompromised = true;
                    lockCompromisedError = err;
                },
            });
            throwIfCompromised();
            const current = existsSync(this.authPath) ? readFileSync(this.authPath, "utf-8") : undefined;
            const { result, next } = await fn(current);
            throwIfCompromised();
            if (next !== undefined) {
                writeFileSync(this.authPath, next, "utf-8");
                chmodSync(this.authPath, 0o600);
            }
            throwIfCompromised();
            return result;
        }
        finally {
            if (release) {
                try {
                    await release();
                }
                catch {
                    // Ignore unlock errors when lock is compromised.
                }
            }
        }
    }
}
export class InMemoryAuthStorageBackend {
    value;
    withLock(fn) {
        const { result, next } = fn(this.value);
        if (next !== undefined) {
            this.value = next;
        }
        return result;
    }
    async withLockAsync(fn) {
        const { result, next } = await fn(this.value);
        if (next !== undefined) {
            this.value = next;
        }
        return result;
    }
}
/**
 * Credential storage backed by a JSON file.
 */
export class AuthStorage {
    storage;
    options;
    data = {};
    runtimeOverrides = new Map();
    staleAuthSources = new Map();
    fallbackResolver;
    loadError = null;
    errors = [];
    constructor(storage, options = {}) {
        this.storage = storage;
        this.options = options;
        this.reload();
    }
    static create(authPath, options) {
        const authOptions = options ?? { usePrimeCliConfig: authPath === undefined };
        return new AuthStorage(new FileAuthStorageBackend(authPath ?? join(getAgentDir(), "auth.json")), authOptions);
    }
    static fromStorage(storage, options) {
        return new AuthStorage(storage, options);
    }
    static inMemory(data = {}, options) {
        const storage = new InMemoryAuthStorageBackend();
        storage.withLock(() => ({ result: undefined, next: JSON.stringify(data, null, 2) }));
        return AuthStorage.fromStorage(storage, options);
    }
    /**
     * Set a runtime API key override (not persisted to disk).
     * Used for CLI --api-key flag.
     */
    setRuntimeApiKey(provider, apiKey) {
        this.clearStaleAuthSource(provider, "runtime");
        this.runtimeOverrides.set(provider, apiKey);
    }
    /**
     * Remove a runtime API key override.
     */
    removeRuntimeApiKey(provider) {
        this.clearStaleAuthSource(provider, "runtime");
        this.runtimeOverrides.delete(provider);
    }
    /**
     * Set a fallback resolver for API keys not found in auth.json or env vars.
     * Used for custom provider keys from models.json.
     */
    setFallbackResolver(resolver) {
        this.fallbackResolver = resolver;
    }
    recordError(error) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        this.errors.push(normalizedError);
    }
    fingerprintAuthSource(source, material) {
        const digest = createHash("sha256").update(source).update("\0").update(material).digest("hex");
        return `${source}:${digest}`;
    }
    createAuthSourceCandidate(options) {
        return {
            configured: options.configured,
            source: options.source,
            ...(options.label ? { label: options.label } : {}),
            identityFingerprint: this.fingerprintAuthSource(options.source, `identity:${options.identityMaterial}`),
            ...(options.valueMaterial !== undefined
                ? {
                    valueFingerprint: this.fingerprintAuthSource(options.source, `value:${options.identityMaterial}\0${options.valueMaterial}`),
                }
                : {}),
            ...(options.resolveValueMaterial
                ? {
                    resolveValueFingerprint: () => {
                        const valueMaterial = options.resolveValueMaterial?.();
                        return valueMaterial === undefined
                            ? undefined
                            : this.fingerprintAuthSource(options.source, `value:${options.identityMaterial}\0${valueMaterial}`);
                    },
                }
                : {}),
        };
    }
    getStoredCredentialValueMaterial(providerId, credential) {
        if (credential.type === "api_key") {
            if (credential.key.startsWith("!")) {
                const resolvedKey = resolveConfigValueUncached(credential.key);
                return resolvedKey === undefined ? undefined : `api_key:command:${credential.key}\0${resolvedKey}`;
            }
            return `api_key:${credential.key}\0${resolveConfigValue(credential.key) ?? ""}`;
        }
        const provider = getOAuthProvider(providerId);
        const apiKey = provider?.getApiKey(credential) ?? credential.access;
        return `oauth:${apiKey}\0${credential.refresh}\0${credential.expires}`;
    }
    getRuntimeAuthCandidate(provider) {
        const apiKey = this.runtimeOverrides.get(provider);
        if (!apiKey) {
            return undefined;
        }
        return {
            label: "--api-key",
            ...this.createAuthSourceCandidate({
                configured: false,
                source: "runtime",
                identityMaterial: provider,
                valueMaterial: apiKey,
            }),
        };
    }
    getPrimeCliAuthCandidate(provider) {
        const apiKey = this.getPrimeCliApiKey(provider);
        if (!apiKey) {
            return undefined;
        }
        return {
            label: "Prime CLI",
            ...this.createAuthSourceCandidate({
                configured: false,
                source: "prime_cli",
                identityMaterial: provider,
                valueMaterial: apiKey,
            }),
        };
    }
    getStoredAuthCandidate(provider, options) {
        const credential = this.data[provider];
        if (!credential) {
            return undefined;
        }
        const isCommandApiKey = credential.type === "api_key" && credential.key.startsWith("!");
        const identityMaterial = isCommandApiKey ? `api_key:command:${credential.key}` : `${provider}:${credential.type}`;
        const commandValueMaterial = isCommandApiKey && options?.resolvedCommandValue !== undefined
            ? `api_key:command:${credential.key}\0${options.resolvedCommandValue}`
            : undefined;
        return this.createAuthSourceCandidate({
            configured: true,
            source: "stored",
            identityMaterial,
            valueMaterial: commandValueMaterial ??
                (isCommandApiKey && !options?.resolveCommandValue
                    ? undefined
                    : this.getStoredCredentialValueMaterial(provider, credential)),
            resolveValueMaterial: isCommandApiKey
                ? () => this.getStoredCredentialValueMaterial(provider, credential)
                : undefined,
        });
    }
    getEnvironmentAuthCandidate(provider) {
        const envKeys = findEnvKeys(provider);
        const envKey = envKeys?.[0];
        const apiKey = getEnvApiKey(provider);
        if (!apiKey) {
            return undefined;
        }
        const label = envKey ?? "ambient credentials";
        const identityMaterial = envKey ?? this.getAmbientEnvironmentIdentityMaterial(provider);
        return this.createAuthSourceCandidate({
            configured: false,
            source: "environment",
            label,
            identityMaterial,
            valueMaterial: `${identityMaterial}\0${apiKey}`,
        });
    }
    getAmbientEnvironmentIdentityMaterial(provider) {
        if (provider === "amazon-bedrock") {
            if (process.env.AWS_PROFILE)
                return `amazon-bedrock:profile:${process.env.AWS_PROFILE}`;
            if (process.env.AWS_ACCESS_KEY_ID) {
                return `amazon-bedrock:access-key:${process.env.AWS_ACCESS_KEY_ID}:${process.env.AWS_SECRET_ACCESS_KEY ?? ""}:${process.env.AWS_SESSION_TOKEN ?? ""}`;
            }
            if (process.env.AWS_BEARER_TOKEN_BEDROCK) {
                return `amazon-bedrock:bearer:${process.env.AWS_BEARER_TOKEN_BEDROCK}`;
            }
            if (process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI) {
                return `amazon-bedrock:ecs-relative:${process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}`;
            }
            if (process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI) {
                return `amazon-bedrock:ecs-full:${process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI}`;
            }
            if (process.env.AWS_WEB_IDENTITY_TOKEN_FILE) {
                return `amazon-bedrock:web-identity:${process.env.AWS_WEB_IDENTITY_TOKEN_FILE}`;
            }
        }
        if (provider === "google-vertex") {
            const project = process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCLOUD_PROJECT ?? "";
            const location = process.env.GOOGLE_CLOUD_LOCATION ?? "";
            const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "application-default";
            return `google-vertex:${project}:${location}:${credentialsPath}`;
        }
        return provider;
    }
    getFallbackAuthCandidate(provider) {
        const apiKey = this.fallbackResolver?.(provider);
        if (!apiKey) {
            return undefined;
        }
        return this.createAuthSourceCandidate({
            configured: false,
            source: "fallback",
            label: "custom provider config",
            identityMaterial: provider,
            valueMaterial: apiKey,
        });
    }
    getAuthSourceCandidates(provider, options) {
        const fallbackCandidate = options?.includeFallback === false ? undefined : this.getFallbackAuthCandidate(provider);
        const candidates = provider === PRIME_INFERENCE_PROVIDER_ID
            ? [
                this.getRuntimeAuthCandidate(provider),
                this.getEnvironmentAuthCandidate(provider),
                this.getPrimeCliAuthCandidate(provider),
                this.getStoredAuthCandidate(provider),
                fallbackCandidate,
            ]
            : [
                this.getRuntimeAuthCandidate(provider),
                this.getStoredAuthCandidate(provider),
                this.getEnvironmentAuthCandidate(provider),
                fallbackCandidate,
            ];
        return candidates.filter((candidate) => candidate !== undefined);
    }
    isAuthSourceStale(provider, candidate) {
        const matchingStale = this.getMatchingStaleAuthSources(provider, candidate);
        if (matchingStale.length === 0) {
            return false;
        }
        const valueFingerprint = candidate.valueFingerprint ?? candidate.resolveValueFingerprint?.();
        return Boolean(valueFingerprint && matchingStale.some((token) => token.valueFingerprint === valueFingerprint));
    }
    getMatchingStaleAuthSources(provider, candidate) {
        const stale = this.staleAuthSources.get(provider);
        if (!stale) {
            return [];
        }
        return stale.filter((token) => token.source === candidate.source && token.identityFingerprint === candidate.identityFingerprint);
    }
    getAvailableAuthCandidate(provider, options) {
        let hasStaleCandidate = false;
        for (const candidate of this.getAuthSourceCandidates(provider, options)) {
            if (this.isAuthSourceStale(provider, candidate)) {
                hasStaleCandidate = true;
                continue;
            }
            return { candidate, hasStaleCandidate };
        }
        return { hasStaleCandidate };
    }
    toAuthStatus(candidate) {
        return {
            configured: candidate.configured,
            source: candidate.source,
            ...(candidate.label ? { label: candidate.label } : {}),
        };
    }
    getAuthStatusFromCandidates(provider) {
        const { candidate, hasStaleCandidate } = this.getAvailableAuthCandidate(provider);
        if (candidate) {
            return this.toAuthStatus(candidate);
        }
        if (hasStaleCandidate) {
            return { configured: false, source: "stale", label: "expired" };
        }
        return { configured: false };
    }
    markAuthStale(provider) {
        const token = this.getCurrentAuthSourceToken(provider);
        return token ? this.markAuthSourceStale(token) : false;
    }
    getAuthSourceTokenForCandidate(provider, candidate) {
        const valueFingerprint = candidate.valueFingerprint ?? candidate.resolveValueFingerprint?.();
        if (!valueFingerprint) {
            return undefined;
        }
        return {
            provider,
            source: candidate.source,
            identityFingerprint: candidate.identityFingerprint,
            valueFingerprint,
        };
    }
    getCurrentAuthSourceToken(provider) {
        const { candidate } = this.getAvailableAuthCandidate(provider);
        if (!candidate) {
            return undefined;
        }
        return this.getAuthSourceTokenForCandidate(provider, candidate);
    }
    markAuthSourceStale(token) {
        if (token.provider.length === 0) {
            return false;
        }
        const stale = this.staleAuthSources.get(token.provider) ?? [];
        if (!stale.some((existing) => existing.source === token.source &&
            existing.identityFingerprint === token.identityFingerprint &&
            existing.valueFingerprint === token.valueFingerprint)) {
            stale.push(token);
        }
        this.staleAuthSources.set(token.provider, stale);
        return true;
    }
    clearStaleAuthSource(provider, source) {
        const stale = this.staleAuthSources.get(provider);
        if (!stale) {
            return;
        }
        const next = stale.filter((token) => token.source !== source);
        if (next.length === 0) {
            this.staleAuthSources.delete(provider);
        }
        else {
            this.staleAuthSources.set(provider, next);
        }
    }
    parseStorageData(content) {
        if (!content) {
            return {};
        }
        return JSON.parse(content);
    }
    /**
     * Reload credentials from storage.
     */
    reload() {
        let content;
        try {
            this.storage.withLock((current) => {
                content = current;
                return { result: undefined };
            });
            this.data = this.parseStorageData(content);
            this.loadError = null;
        }
        catch (error) {
            this.loadError = error;
            this.recordError(error);
        }
    }
    persistProviderChange(provider, credential) {
        if (this.loadError) {
            return;
        }
        try {
            this.storage.withLock((current) => {
                const currentData = this.parseStorageData(current);
                const merged = { ...currentData };
                if (credential) {
                    merged[provider] = credential;
                }
                else {
                    delete merged[provider];
                }
                return { result: undefined, next: JSON.stringify(merged, null, 2) };
            });
        }
        catch (error) {
            this.recordError(error);
        }
    }
    /**
     * Get credential for a provider.
     */
    get(provider) {
        return this.data[provider] ?? undefined;
    }
    /**
     * Set credential for a provider.
     */
    set(provider, credential) {
        this.clearStaleAuthSource(provider, "stored");
        this.data[provider] = credential;
        this.persistProviderChange(provider, credential);
    }
    /**
     * Remove credential for a provider.
     */
    remove(provider) {
        this.clearStaleAuthSource(provider, "stored");
        delete this.data[provider];
        this.persistProviderChange(provider, undefined);
    }
    /**
     * List all providers with credentials.
     */
    list() {
        return Object.keys(this.data);
    }
    /**
     * Check if credentials exist for a provider in auth.json.
     */
    has(provider) {
        return provider in this.data;
    }
    /**
     * Check if any form of auth is configured for a provider.
     * Unlike getApiKey(), this doesn't refresh OAuth tokens.
     */
    hasAuth(provider) {
        return this.getAvailableAuthCandidate(provider).candidate !== undefined;
    }
    /**
     * Return auth status without exposing credential values or refreshing tokens.
     */
    getAuthStatus(provider) {
        return this.getAuthStatusFromCandidates(provider);
    }
    /**
     * Get all credentials (for passing to getOAuthApiKey).
     */
    getAll() {
        return { ...this.data };
    }
    drainErrors() {
        const drained = [...this.errors];
        this.errors = [];
        return drained;
    }
    /**
     * Login to an OAuth provider.
     */
    async login(providerId, callbacks) {
        const provider = getOAuthProvider(providerId);
        if (!provider) {
            throw new Error(`Unknown OAuth provider: ${providerId}`);
        }
        const credentials = await provider.login(callbacks);
        this.set(providerId, { type: "oauth", ...credentials });
    }
    /**
     * Logout from a provider.
     */
    logout(provider) {
        if (provider === PRIME_INFERENCE_PROVIDER_ID && this.isPrimeCliConfigEnabled()) {
            try {
                clearPrimeCliCredentials(this.getEnabledPrimeCliConfigPath());
                this.clearStaleAuthSource(provider, "prime_cli");
            }
            catch (error) {
                this.recordError(error);
                throw error;
            }
        }
        this.remove(provider);
    }
    /**
     * Refresh OAuth token with backend locking to prevent race conditions.
     * Multiple pi instances may try to refresh simultaneously when tokens expire.
     */
    async refreshOAuthTokenWithLock(providerId) {
        const provider = getOAuthProvider(providerId);
        if (!provider) {
            return null;
        }
        const result = await this.storage.withLockAsync(async (current) => {
            const currentData = this.parseStorageData(current);
            this.data = currentData;
            this.loadError = null;
            const cred = currentData[providerId];
            if (cred?.type !== "oauth") {
                return { result: null };
            }
            if (Date.now() < cred.expires) {
                return { result: { apiKey: provider.getApiKey(cred), newCredentials: cred } };
            }
            const oauthCreds = {};
            for (const [key, value] of Object.entries(currentData)) {
                if (value.type === "oauth") {
                    oauthCreds[key] = value;
                }
            }
            const refreshed = await getOAuthApiKey(providerId, oauthCreds);
            if (!refreshed) {
                return { result: null };
            }
            const merged = {
                ...currentData,
                [providerId]: { type: "oauth", ...refreshed.newCredentials },
            };
            this.data = merged;
            this.loadError = null;
            return { result: refreshed, next: JSON.stringify(merged, null, 2) };
        });
        return result;
    }
    /**
     * Get API key for a provider.
     * Priority:
     * 1. Runtime override (CLI --api-key)
     * 2. Prime Inference: environment variable, Prime CLI config, auth.json
     * 3. Other providers: auth.json, environment variable
     * 4. Fallback resolver (models.json custom providers)
     */
    async getApiKeyWithSourceToken(providerId, options) {
        // Runtime override takes highest priority
        const runtimeCandidate = this.getRuntimeAuthCandidate(providerId);
        const runtimeKey = this.runtimeOverrides.get(providerId);
        if (runtimeKey && runtimeCandidate && !this.isAuthSourceStale(providerId, runtimeCandidate)) {
            return {
                apiKey: runtimeKey,
                sourceToken: this.getAuthSourceTokenForCandidate(providerId, runtimeCandidate),
            };
        }
        const envCandidate = this.getEnvironmentAuthCandidate(providerId);
        const envKey = getEnvApiKey(providerId);
        if (providerId === PRIME_INFERENCE_PROVIDER_ID &&
            envKey &&
            envCandidate &&
            !this.isAuthSourceStale(providerId, envCandidate)) {
            return {
                apiKey: envKey,
                sourceToken: this.getAuthSourceTokenForCandidate(providerId, envCandidate),
            };
        }
        if (providerId === PRIME_INFERENCE_PROVIDER_ID) {
            const primeCliCandidate = this.getPrimeCliAuthCandidate(providerId);
            const primeCliKey = this.getPrimeCliApiKey(providerId);
            if (primeCliKey && primeCliCandidate && !this.isAuthSourceStale(providerId, primeCliCandidate)) {
                return {
                    apiKey: primeCliKey,
                    sourceToken: this.getAuthSourceTokenForCandidate(providerId, primeCliCandidate),
                };
            }
        }
        const cred = this.data[providerId];
        if (cred?.type === "api_key") {
            const storedCandidate = this.getStoredAuthCandidate(providerId);
            if (storedCandidate && !this.isAuthSourceStale(providerId, storedCandidate)) {
                const hasStaleRecord = this.getMatchingStaleAuthSources(providerId, storedCandidate).length > 0;
                const apiKey = cred.key.startsWith("!") && hasStaleRecord
                    ? resolveConfigValueUncached(cred.key)
                    : resolveConfigValue(cred.key);
                const sourceToken = apiKey === undefined
                    ? undefined
                    : this.getAuthSourceTokenForCandidate(providerId, cred.key.startsWith("!")
                        ? (this.getStoredAuthCandidate(providerId, { resolvedCommandValue: apiKey }) ??
                            storedCandidate)
                        : storedCandidate);
                return { apiKey, sourceToken };
            }
        }
        if (cred?.type === "oauth") {
            const storedCandidate = this.getStoredAuthCandidate(providerId);
            if (storedCandidate && !this.isAuthSourceStale(providerId, storedCandidate)) {
                const provider = getOAuthProvider(providerId);
                if (!provider) {
                    // Unknown OAuth provider, can't get API key
                    return {};
                }
                // Check if token needs refresh
                const needsRefresh = Date.now() >= cred.expires;
                if (needsRefresh) {
                    // Use locked refresh to prevent race conditions
                    try {
                        const result = await this.refreshOAuthTokenWithLock(providerId);
                        if (result) {
                            const refreshedCandidate = this.getStoredAuthCandidate(providerId);
                            return {
                                apiKey: result.apiKey,
                                sourceToken: refreshedCandidate
                                    ? this.getAuthSourceTokenForCandidate(providerId, refreshedCandidate)
                                    : undefined,
                            };
                        }
                    }
                    catch (error) {
                        this.recordError(error);
                        // Refresh failed - re-read file to check if another instance succeeded
                        this.reload();
                        const updatedCred = this.data[providerId];
                        if (updatedCred?.type === "oauth" && Date.now() < updatedCred.expires) {
                            // Another instance refreshed successfully, use those credentials
                            const updatedCandidate = this.getStoredAuthCandidate(providerId);
                            return {
                                apiKey: provider.getApiKey(updatedCred),
                                sourceToken: updatedCandidate
                                    ? this.getAuthSourceTokenForCandidate(providerId, updatedCandidate)
                                    : undefined,
                            };
                        }
                        // Refresh truly failed - return undefined so model discovery skips this provider
                        // User can /login to re-authenticate (credentials preserved for retry)
                        return {};
                    }
                }
                else {
                    // Token not expired, use current access token
                    return {
                        apiKey: provider.getApiKey(cred),
                        sourceToken: this.getAuthSourceTokenForCandidate(providerId, storedCandidate),
                    };
                }
            }
        }
        // Other providers preserve auth.json priority over environment variables.
        if (providerId !== PRIME_INFERENCE_PROVIDER_ID &&
            envKey &&
            envCandidate &&
            !this.isAuthSourceStale(providerId, envCandidate)) {
            return {
                apiKey: envKey,
                sourceToken: this.getAuthSourceTokenForCandidate(providerId, envCandidate),
            };
        }
        // Fall back to custom resolver (e.g., models.json custom providers)
        if (options?.includeFallback !== false) {
            const fallbackCandidate = this.getFallbackAuthCandidate(providerId);
            if (fallbackCandidate && !this.isAuthSourceStale(providerId, fallbackCandidate)) {
                return {
                    apiKey: this.fallbackResolver?.(providerId) ?? undefined,
                    sourceToken: this.getAuthSourceTokenForCandidate(providerId, fallbackCandidate),
                };
            }
        }
        return {};
    }
    async getApiKey(providerId, options) {
        const result = await this.getApiKeyWithSourceToken(providerId, options);
        return result.apiKey;
    }
    /**
     * Get all registered OAuth providers
     */
    getOAuthProviders() {
        return getOAuthProviders();
    }
    setPrimeInferenceTeamSelection(team) {
        if (this.isPrimeCliConfigEnabled()) {
            try {
                savePrimeCliTeamSelection(team, this.getEnabledPrimeCliConfigPath());
            }
            catch (error) {
                this.recordError(error);
                throw error;
            }
            return;
        }
        const credential = this.data[PRIME_INFERENCE_PROVIDER_ID];
        if (credential?.type !== "api_key") {
            return;
        }
        this.set(PRIME_INFERENCE_PROVIDER_ID, {
            ...credential,
            primeTeam: team ? this.toPrimeTeamCredential(team) : null,
        });
    }
    setPrimeInferenceApiKey(apiKey) {
        if (this.isPrimeCliConfigEnabled()) {
            try {
                const configPath = this.getEnabledPrimeCliConfigPath();
                const config = loadPrimeCliConfig(configPath);
                const existingCredential = this.data[PRIME_INFERENCE_PROVIDER_ID];
                const legacyPrimeTeam = existingCredential?.type === "api_key" ? existingCredential.primeTeam : undefined;
                if (config.apiKey !== apiKey) {
                    savePrimeCliApiKey(apiKey, configPath);
                }
                else if (!config.teamIdFromEnv && (legacyPrimeTeam === null || (!config.teamId && legacyPrimeTeam))) {
                    savePrimeCliTeamSelection(legacyPrimeTeam, configPath);
                }
                this.clearStaleAuthSource(PRIME_INFERENCE_PROVIDER_ID, "prime_cli");
            }
            catch (error) {
                this.recordError(error);
                throw error;
            }
            if (this.data[PRIME_INFERENCE_PROVIDER_ID]) {
                this.remove(PRIME_INFERENCE_PROVIDER_ID);
            }
            return;
        }
        const existingCredential = this.data[PRIME_INFERENCE_PROVIDER_ID];
        const existingPrimeTeam = existingCredential?.type === "api_key" ? existingCredential.primeTeam : undefined;
        this.set(PRIME_INFERENCE_PROVIDER_ID, {
            type: "api_key",
            key: apiKey,
            ...(existingPrimeTeam !== undefined ? { primeTeam: existingPrimeTeam } : {}),
        });
    }
    getPrimeInferenceTeamSelection() {
        let config;
        if (this.isPrimeCliConfigEnabled()) {
            config = this.getPrimeCliConfig(PRIME_INFERENCE_PROVIDER_ID);
            if (config?.teamIdFromEnv) {
                return undefined;
            }
        }
        const credential = this.data[PRIME_INFERENCE_PROVIDER_ID];
        const authSource = this.getAuthStatus(PRIME_INFERENCE_PROVIDER_ID).source;
        if (authSource === "runtime" || authSource === "environment") {
            return undefined;
        }
        if (authSource === "prime_cli") {
            if (credential?.type === "api_key" && credential.primeTeam === null) {
                return null;
            }
            if (config?.teamId) {
                return this.toPrimeTeamCredential({
                    teamId: config.teamId,
                    name: config.teamName ?? "Prime CLI team",
                    ...(config.teamRole ? { role: config.teamRole } : {}),
                });
            }
            if (credential?.type === "api_key" && credential.primeTeam) {
                return credential.primeTeam;
            }
            return null;
        }
        if (credential?.type === "api_key" && credential.primeTeam !== undefined) {
            return credential.primeTeam;
        }
        if (!config?.apiKey && config?.teamId) {
            return this.toPrimeTeamCredential({
                teamId: config.teamId,
                name: config.teamName ?? "Prime CLI team",
                ...(config.teamRole ? { role: config.teamRole } : {}),
            });
        }
        return undefined;
    }
    getProviderHeaders(providerId) {
        if (providerId !== PRIME_INFERENCE_PROVIDER_ID) {
            return undefined;
        }
        const primeCliConfig = this.getPrimeCliConfig(providerId);
        if (primeCliConfig?.teamIdFromEnv) {
            return primeCliConfig.teamId ? { "X-Prime-Team-ID": primeCliConfig.teamId } : undefined;
        }
        const teamId = this.getPrimeInferenceTeamSelection()?.teamId;
        return teamId ? { "X-Prime-Team-ID": teamId } : undefined;
    }
    getPrimeCliConfigPath() {
        if (!this.isPrimeCliConfigEnabled()) {
            return undefined;
        }
        return getPrimeCliConfigPath(this.options.primeCliConfigPath);
    }
    toPrimeTeamCredential(team) {
        const credential = {
            teamId: team.teamId,
            name: team.name,
        };
        if (team.slug) {
            credential.slug = team.slug;
        }
        if (team.role) {
            credential.role = team.role;
        }
        if (team.createdAt) {
            credential.createdAt = team.createdAt;
        }
        return credential;
    }
    getPrimeCliConfig(providerId) {
        if (providerId !== PRIME_INFERENCE_PROVIDER_ID) {
            return undefined;
        }
        if (!this.isPrimeCliConfigEnabled()) {
            return undefined;
        }
        return loadPrimeCliConfig(this.options.primeCliConfigPath);
    }
    getPrimeCliApiKey(providerId) {
        return this.getPrimeCliConfig(providerId)?.apiKey;
    }
    getEnabledPrimeCliConfigPath() {
        const configPath = this.getPrimeCliConfigPath();
        if (!configPath) {
            throw new Error("Prime CLI config is not enabled");
        }
        return configPath;
    }
    isPrimeCliConfigEnabled() {
        return Boolean(this.options.usePrimeCliConfig || this.options.primeCliConfigPath);
    }
}
//# sourceMappingURL=auth-storage.js.map
/**
 * Provider authentication flows (login/logout dialogs and selectors).
 *
 * Extracted from InteractiveMode so any TUI surface that owns a `TUI` and a
 * `ModelRegistry` (interactive sessions, the agents view) can run the same
 * auth UI. Host-specific side effects (footer refresh, billing warnings) hang
 * off the small host interface instead of the flows themselves.
 */
import * as path from "node:path";
import { getProviders } from "@earendil-works/pi-ai";
import { getAuthPath, getDocsPath } from "../../config.js";
import { checkPrimeAgentTracesAccess, checkPrimeInferenceAccess, fetchPrimeTeams, loadPrimeCliConfig, loginPrimeAgentTraces, loginPrimeInference, PRIME_AGENT_TRACES_PROVIDER_ID, PRIME_AGENT_TRACES_PROVIDER_NAME, PRIME_INFERENCE_PROVIDER_ID, PRIME_INFERENCE_PROVIDER_NAME, resolvePrimeAgentTracesBaseUrl, } from "../../core/prime-inference-auth.js";
import { BUILT_IN_PROVIDER_DISPLAY_NAMES } from "../../core/provider-display-names.js";
import { SERPER_CREDENTIAL_ID, SERPER_CREDENTIAL_NAME } from "../../core/websearch-credential.js";
import { showFullPaneOverlay } from "./components/centered-overlay.js";
import { ExtensionSelectorComponent } from "./components/extension-selector.js";
import { LoginDialogComponent } from "./components/login-dialog.js";
import { compareAuthSelectorProviders, OAuthSelectorComponent, } from "./components/oauth-selector.js";
import { PrimeTeamSelectorComponent } from "./components/prime-team-selector.js";
import { theme } from "./theme/theme.js";
export const BEDROCK_PROVIDER_ID = "amazon-bedrock";
export const ANTHROPIC_SUBSCRIPTION_AUTH_WARNING = "Anthropic subscription auth is active. Third-party harness usage draws from extra usage and is billed per token, not your Claude plan limits. Manage extra usage at https://claude.ai/settings/usage.";
function isAnthropicSubscriptionAuthKey(apiKey) {
    return typeof apiKey === "string" && apiKey.startsWith("sk-ant-oat");
}
/** Returns the extra-usage warning when the given model would run on Anthropic subscription auth. */
export async function getAnthropicSubscriptionAuthWarning(modelRegistry, model) {
    if (!model || model.provider !== "anthropic") {
        return undefined;
    }
    const storedCredential = modelRegistry.authStorage.get("anthropic");
    if (storedCredential?.type === "oauth") {
        return ANTHROPIC_SUBSCRIPTION_AUTH_WARNING;
    }
    try {
        const apiKey = await modelRegistry.getApiKeyForProvider(model.provider);
        if (isAnthropicSubscriptionAuthKey(apiKey)) {
            return ANTHROPIC_SUBSCRIPTION_AUTH_WARNING;
        }
    }
    catch {
        // Ignore auth lookup failures for warning-only checks.
    }
    return undefined;
}
const BUILT_IN_MODEL_PROVIDERS = new Set(getProviders());
export function isApiKeyLoginProvider(providerId, oauthProviderIds, builtInProviderIds = BUILT_IN_MODEL_PROVIDERS) {
    if (BUILT_IN_PROVIDER_DISPLAY_NAMES[providerId]) {
        return true;
    }
    if (builtInProviderIds.has(providerId)) {
        return false;
    }
    return !oauthProviderIds.has(providerId);
}
export class ProviderAuthFlows {
    host;
    constructor(host) {
        this.host = host;
    }
    /** Runs the provider selector followed by the matching login dialog. */
    /**
     * Run the OAuth login flow for an MCP integration server.
     *
     * The provider must already be registered (the McpManager does this as
     * `mcp:<server>`). On success the credentials land in auth.json and the
     * caller should reload resources so the integration's skill enables.
     */
    runMcpLogin(server, label) {
        const providerId = `mcp:${server}`;
        const provider = this.host.modelRegistry.authStorage.getOAuthProviders().find((p) => p.id === providerId);
        if (!provider) {
            this.host.showError(`Unknown MCP integration: ${server}`);
            return Promise.resolve({ status: "failed" });
        }
        return this.showLoginDialog(providerId, label ?? provider.name, "service");
    }
    runLogin(options = {}) {
        const { authType, initialCategory } = options;
        const providerOptions = this.getLoginProviderOptions(authType);
        if (providerOptions.length === 0) {
            this.host.showStatus(authType === "oauth"
                ? "No subscription providers available."
                : authType === "api_key"
                    ? "No API key providers available."
                    : "No providers available.");
            return Promise.resolve({ status: "failed" });
        }
        return new Promise((resolve) => {
            let handle;
            const close = () => {
                handle?.hide();
                this.host.ui.requestRender();
            };
            const selector = new OAuthSelectorComponent("login", this.host.modelRegistry.authStorage, providerOptions, async (providerOption) => {
                close();
                resolve(await this.loginProvider(providerOption));
            }, () => {
                close();
                resolve({ status: "cancelled" });
            }, (providerId) => this.host.modelRegistry.getProviderAuthStatus(providerId), { getRows: () => this.host.ui.terminal.rows, initialCategory });
            handle = showFullPaneOverlay(this.host.ui, selector, 78);
        });
    }
    loginProvider(providerOption) {
        const kind = providerOption.category === "service" ? "service" : "provider";
        if (providerOption.authType === "oauth") {
            return this.showLoginDialog(providerOption.id, providerOption.name, kind);
        }
        if (providerOption.id === PRIME_INFERENCE_PROVIDER_ID) {
            return this.runPrimeInferenceLogin();
        }
        if (providerOption.id === BEDROCK_PROVIDER_ID) {
            return this.showBedrockSetupDialog(providerOption.id, providerOption.name);
        }
        return this.showApiKeyLoginDialog(providerOption.id, providerOption.name, kind);
    }
    /** Shows the stored-credential selector and removes the chosen credential. */
    /** Returns the provider id that was logged out, or null if nothing changed (cancelled / none). */
    runLogout() {
        const providerOptions = this.getLogoutProviderOptions();
        if (providerOptions.length === 0) {
            this.host.showStatus("No stored credentials to remove. /logout only removes credentials saved by /login; environment variables and models.json config are unchanged.");
            return Promise.resolve(null);
        }
        return new Promise((resolve) => {
            let handle;
            const close = () => {
                handle?.hide();
                this.host.ui.requestRender();
            };
            const selector = new OAuthSelectorComponent("logout", this.host.modelRegistry.authStorage, providerOptions, async (providerOption) => {
                close();
                try {
                    this.host.modelRegistry.authStorage.logout(providerOption.id);
                    this.host.modelRegistry.refresh();
                    await this.host.onAuthChanged?.();
                    const message = providerOption.authType === "oauth"
                        ? `Logged out of ${providerOption.name}`
                        : `Removed stored API key for ${providerOption.name}. Environment variables and models.json config are unchanged.`;
                    this.host.showStatus(message);
                    resolve(providerOption.id);
                }
                catch (error) {
                    this.host.showError(`Logout failed: ${error instanceof Error ? error.message : String(error)}`);
                    resolve(null);
                }
            }, () => {
                close();
                resolve(null);
            }, undefined, { getRows: () => this.host.ui.terminal.rows });
            handle = showFullPaneOverlay(this.host.ui, selector, 78);
        });
    }
    getLoginProviderOptions(authType) {
        const authStorage = this.host.modelRegistry.authStorage;
        const oauthProviders = authStorage.getOAuthProviders();
        const oauthProviderIds = new Set(oauthProviders.map((provider) => provider.id));
        const options = oauthProviders.map((provider) => ({
            id: provider.id,
            name: provider.name,
            authType: "oauth",
            // MCP integrations (mcp:<server>) are services, not model providers.
            ...(provider.id.startsWith("mcp:") ? { category: "service" } : {}),
        }));
        const modelProviders = new Set(this.host.modelRegistry.getAll().map((model) => model.provider));
        for (const providerId of modelProviders) {
            if (!isApiKeyLoginProvider(providerId, oauthProviderIds)) {
                continue;
            }
            options.push({
                id: providerId,
                name: this.host.modelRegistry.getProviderDisplayName(providerId),
                authType: "api_key",
            });
        }
        // Serper is a skill credential, not a model provider, so add it manually.
        options.push({
            id: SERPER_CREDENTIAL_ID,
            name: SERPER_CREDENTIAL_NAME,
            authType: "api_key",
            category: "service",
        });
        const filteredOptions = authType ? options.filter((option) => option.authType === authType) : options;
        return filteredOptions.sort(compareAuthSelectorProviders);
    }
    getLogoutProviderOptions() {
        const authStorage = this.host.modelRegistry.authStorage;
        const options = [];
        const oauthProvidersById = new Map(authStorage.getOAuthProviders().map((p) => [p.id, p]));
        for (const providerId of authStorage.list()) {
            const credential = authStorage.get(providerId);
            if (!credential) {
                continue;
            }
            const isSerper = providerId === SERPER_CREDENTIAL_ID;
            const isMcp = providerId.startsWith("mcp:");
            const name = isSerper
                ? SERPER_CREDENTIAL_NAME
                : isMcp
                    ? (oauthProvidersById.get(providerId)?.name ?? providerId.slice("mcp:".length))
                    : this.host.modelRegistry.getProviderDisplayName(providerId);
            options.push({
                id: providerId,
                name,
                authType: credential.type,
                category: isSerper || isMcp ? "service" : "provider",
            });
        }
        if (!options.some((option) => option.id === PRIME_INFERENCE_PROVIDER_ID)) {
            const primeInferenceStatus = authStorage.getAuthStatus(PRIME_INFERENCE_PROVIDER_ID);
            if (primeInferenceStatus.source === "prime_cli") {
                options.push({
                    id: PRIME_INFERENCE_PROVIDER_ID,
                    name: PRIME_INFERENCE_PROVIDER_NAME,
                    authType: "api_key",
                });
            }
        }
        return options.sort((a, b) => a.name.localeCompare(b.name));
    }
    async completeProviderAuthentication(providerId, providerName, authType, statusSuffix, kind = "provider", credentialPath = getAuthPath()) {
        this.host.modelRegistry.refresh();
        const actionLabel = authType === "oauth" ? `Logged in to ${providerName}` : `Saved API key for ${providerName}`;
        await this.host.onAuthChanged?.();
        this.host.showStatus(`${actionLabel}. Credentials saved to ${credentialPath}${statusSuffix ? `. ${statusSuffix}` : ""}`);
        this.host.onLoginCompleted?.();
        return {
            status: "success",
            providerId,
            providerName,
            authType,
            kind,
        };
    }
    async completeExternalProviderSetup(providerId, providerName) {
        this.host.modelRegistry.refresh();
        await this.host.onAuthChanged?.();
        this.host.showStatus(`${providerName} uses external credentials. Select a model after configuring them.`);
        return {
            status: "success",
            providerId,
            providerName,
            authType: "api_key",
        };
    }
    async hasAvailableProviderModels(providerId) {
        const models = await this.host.getAvailableModels();
        return models.some((model) => model.provider === providerId);
    }
    async showBedrockSetupDialog(providerId, providerName) {
        const dialog = new LoginDialogComponent(this.host.ui, providerId, () => {
            // Completion handled below.
        }, providerName, "Amazon Bedrock setup");
        const handle = showFullPaneOverlay(this.host.ui, dialog, 88);
        const closeDialog = () => {
            handle.hide();
            this.host.ui.requestRender();
        };
        try {
            await dialog.showContinueInfo([
                theme.fg("text", "Amazon Bedrock uses AWS credentials instead of a single API key."),
                theme.fg("text", "Configure an AWS profile, IAM keys, bearer token, or role-based credentials."),
                theme.fg("muted", "See:"),
                theme.fg("accent", `  ${path.join(getDocsPath(), "providers.md")}`),
            ]);
            closeDialog();
            if (!(await this.hasAvailableProviderModels(providerId))) {
                this.host.showStatus(`${providerName} credentials were not detected. Configure them, then reopen /model.`);
                return { status: "cancelled" };
            }
            return await this.completeExternalProviderSetup(providerId, providerName);
        }
        catch (error) {
            closeDialog();
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (errorMsg !== "Login cancelled") {
                this.host.showError(`Failed to set up ${providerName}: ${errorMsg}`);
                return { status: "failed" };
            }
            return { status: "cancelled" };
        }
    }
    showPrimeTeamSelector(teams, currentTeamId) {
        return new Promise((resolve) => {
            let handle;
            const close = () => {
                handle?.hide();
                this.host.ui.requestRender();
            };
            const selector = new PrimeTeamSelectorComponent(teams, currentTeamId, (team) => {
                close();
                resolve(team);
            }, () => {
                close();
                resolve(undefined);
            }, { getRows: () => this.host.ui.terminal.rows });
            handle = showFullPaneOverlay(this.host.ui, selector, 78);
        });
    }
    getPrimeInferenceDefaultTeamStatus() {
        const configPath = this.host.modelRegistry.authStorage.getPrimeCliConfigPath();
        if (configPath) {
            let config;
            try {
                config = loadPrimeCliConfig(configPath);
            }
            catch {
                return "Using personal account.";
            }
            if (config.teamIdFromEnv) {
                return "Using team from PRIME_TEAM_ID.";
            }
            if (config.teamName) {
                return `Using team "${config.teamName}".`;
            }
            if (config.teamId) {
                return "Using Prime CLI team.";
            }
        }
        const storedTeam = this.host.modelRegistry.authStorage.getPrimeInferenceTeamSelection();
        if (storedTeam) {
            return `Using team "${storedTeam.name}".`;
        }
        if (storedTeam === null) {
            return "Using personal account.";
        }
        return "Using personal account.";
    }
    async selectPrimeInferenceTeam(apiKey, dialog) {
        try {
            const config = loadPrimeCliConfig(this.host.modelRegistry.authStorage.getPrimeCliConfigPath());
            if (config.teamIdFromEnv) {
                this.host.modelRegistry.authStorage.reload();
                return "Using team from PRIME_TEAM_ID.";
            }
            dialog.showProgress("Loading Prime teams...");
            const teams = await fetchPrimeTeams(apiKey, config.baseUrl, { signal: dialog.signal });
            if (dialog.signal.aborted) {
                return this.getPrimeInferenceDefaultTeamStatus();
            }
            if (teams.length === 0) {
                this.host.modelRegistry.authStorage.setPrimeInferenceTeamSelection(null);
                return "Using personal account.";
            }
            const storedTeam = this.host.modelRegistry.authStorage.getPrimeInferenceTeamSelection();
            const currentTeamId = storedTeam === null ? undefined : (storedTeam?.teamId ?? config.teamId);
            const selectedTeam = await this.showPrimeTeamSelector(teams, currentTeamId);
            if (selectedTeam !== undefined) {
                this.host.modelRegistry.authStorage.setPrimeInferenceTeamSelection(selectedTeam);
            }
            return selectedTeam
                ? `Using team "${selectedTeam.name}".`
                : selectedTeam === null
                    ? "Using personal account."
                    : this.getPrimeInferenceDefaultTeamStatus();
        }
        catch {
            this.host.modelRegistry.authStorage.reload();
            return this.getPrimeInferenceDefaultTeamStatus();
        }
    }
    async completePrimeInferenceLogin(apiKey, dialog, closeDialog) {
        this.host.modelRegistry.authStorage.setPrimeInferenceApiKey(apiKey);
        const teamStatus = await this.selectPrimeInferenceTeam(apiKey, dialog);
        closeDialog();
        return await this.completeProviderAuthentication(PRIME_INFERENCE_PROVIDER_ID, PRIME_INFERENCE_PROVIDER_NAME, "api_key", teamStatus, "provider", this.host.modelRegistry.authStorage.getPrimeCliConfigPath() ?? getAuthPath());
    }
    async completePrimeAgentTracesLogin(apiKey, closeDialog) {
        this.host.modelRegistry.authStorage.set(PRIME_AGENT_TRACES_PROVIDER_ID, {
            type: "api_key",
            key: apiKey,
        });
        closeDialog();
        return await this.completeProviderAuthentication(PRIME_AGENT_TRACES_PROVIDER_ID, PRIME_AGENT_TRACES_PROVIDER_NAME, "api_key");
    }
    async runPrimeInferenceLogin() {
        const dialog = new LoginDialogComponent(this.host.ui, PRIME_INFERENCE_PROVIDER_ID, (_success, _message) => {
            // Completion handled below.
        }, PRIME_INFERENCE_PROVIDER_NAME);
        const handle = showFullPaneOverlay(this.host.ui, dialog, {
            maxContentWidth: 88,
            suspendFullscreenMouse: true,
        });
        const closeDialog = () => {
            handle.hide();
            this.host.ui.requestRender();
        };
        // The browser challenge gets its own controller so a manually pasted key
        // can stop the polling without tearing down the dialog.
        const browserAbort = new AbortController();
        const onDialogAbort = () => browserAbort.abort();
        dialog.signal.addEventListener("abort", onDialogAbort, { once: true });
        let manualInputArmed = false;
        let resolveManualKey = () => { };
        const manualKeyEntry = new Promise((resolve) => {
            resolveManualKey = resolve;
        });
        const armManualInput = (prompt) => {
            manualInputArmed = true;
            void (async () => {
                let value = (await dialog.showManualInput(prompt)).trim();
                while (!value) {
                    value = (await dialog.waitForInput()).trim();
                }
                resolveManualKey({ apiKey: value, source: "manual" });
            })().catch(() => {
                // Cancellation surfaces through the dialog signal.
            });
        };
        try {
            const browserLogin = loginPrimeInference({
                onAuth: (info) => {
                    dialog.showAuth(info.url, info.instructions);
                    armManualInput("Complete the sign-in in your browser, or paste an API key below:");
                },
                onProgress: (message) => {
                    dialog.showProgress(message);
                },
                signal: browserAbort.signal,
            }, {
                configPath: this.host.modelRegistry.authStorage.getPrimeCliConfigPath(),
            });
            // When the browser challenge cannot start or breaks down, keep the dialog
            // open and fall back to plain API key entry instead of failing outright.
            const browserLoginOrFallback = browserLogin.catch((error) => {
                if (browserAbort.signal.aborted) {
                    throw error;
                }
                const errorMsg = error instanceof Error ? error.message : String(error);
                dialog.showProgress(`Browser sign-in unavailable (${errorMsg}).`);
                if (!manualInputArmed) {
                    armManualInput("Paste a Prime API key below:");
                }
                return manualKeyEntry;
            });
            // Once the browser flow has settled into manual fallback, nothing above
            // rejects on cancel anymore, so the dialog signal must end the race too.
            const dialogCancelled = new Promise((_, reject) => {
                dialog.signal.addEventListener("abort", () => reject(new Error("Login cancelled")), { once: true });
            });
            // Promise.race observes the rejections below, but keep dedicated handlers
            // so neither an aborted browser flow nor a cancelled dialog can surface
            // as an unhandled rejection.
            browserLoginOrFallback.catch(() => { });
            dialogCancelled.catch(() => { });
            const result = await Promise.race([browserLoginOrFallback, manualKeyEntry, dialogCancelled]);
            if (dialog.signal.aborted) {
                closeDialog();
                return { status: "cancelled" };
            }
            if (result.source === "manual") {
                browserAbort.abort();
                dialog.showProgress("Checking Prime Inference access...");
                const config = loadPrimeCliConfig(this.host.modelRegistry.authStorage.getPrimeCliConfigPath());
                const access = await checkPrimeInferenceAccess(result.apiKey, config.baseUrl, { signal: dialog.signal });
                if (dialog.signal.aborted) {
                    closeDialog();
                    return { status: "cancelled" };
                }
                if (!access.ok) {
                    const status = access.status === undefined ? "" : `HTTP ${access.status}: `;
                    throw new Error(`Prime API key does not have Prime Inference access (${status}${access.message})`);
                }
            }
            return await this.completePrimeInferenceLogin(result.apiKey, dialog, closeDialog);
        }
        catch (error) {
            closeDialog();
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (!dialog.signal.aborted && errorMsg !== "Login cancelled") {
                this.host.showError(`Failed to login to ${PRIME_INFERENCE_PROVIDER_NAME}: ${errorMsg}`);
                return { status: "failed" };
            }
            return { status: "cancelled" };
        }
        finally {
            dialog.signal.removeEventListener("abort", onDialogAbort);
        }
    }
    async runPrimeAgentTracesLogin() {
        const dialog = new LoginDialogComponent(this.host.ui, PRIME_AGENT_TRACES_PROVIDER_ID, (_success, _message) => {
            // Completion handled below.
        }, PRIME_AGENT_TRACES_PROVIDER_NAME);
        const handle = showFullPaneOverlay(this.host.ui, dialog, {
            maxContentWidth: 88,
            suspendFullscreenMouse: true,
        });
        const closeDialog = () => {
            handle.hide();
            this.host.ui.requestRender();
        };
        const browserAbort = new AbortController();
        const onDialogAbort = () => browserAbort.abort();
        dialog.signal.addEventListener("abort", onDialogAbort, { once: true });
        let manualInputArmed = false;
        let resolveManualKey = () => { };
        const manualKeyEntry = new Promise((resolve) => {
            resolveManualKey = resolve;
        });
        const armManualInput = (prompt) => {
            manualInputArmed = true;
            void (async () => {
                let value = (await dialog.showManualInput(prompt)).trim();
                while (!value) {
                    value = (await dialog.waitForInput()).trim();
                }
                resolveManualKey({ apiKey: value, source: "manual" });
            })().catch(() => {
                // Cancellation surfaces through the dialog signal.
            });
        };
        try {
            const browserLogin = loginPrimeAgentTraces({
                onAuth: (info) => {
                    dialog.showAuth(info.url, info.instructions);
                    armManualInput("Complete the sign-in in your browser, or paste a Prime API key below:");
                },
                onProgress: (message) => {
                    dialog.showProgress(message);
                },
                signal: browserAbort.signal,
            });
            const browserLoginOrFallback = browserLogin.catch((error) => {
                if (browserAbort.signal.aborted) {
                    throw error;
                }
                const errorMsg = error instanceof Error ? error.message : String(error);
                dialog.showProgress(`Browser sign-in unavailable (${errorMsg}).`);
                if (!manualInputArmed) {
                    armManualInput("Paste a Prime API key below:");
                }
                return manualKeyEntry;
            });
            const dialogCancelled = new Promise((_, reject) => {
                dialog.signal.addEventListener("abort", () => reject(new Error("Login cancelled")), { once: true });
            });
            browserLoginOrFallback.catch(() => { });
            dialogCancelled.catch(() => { });
            const result = await Promise.race([browserLoginOrFallback, manualKeyEntry, dialogCancelled]);
            if (dialog.signal.aborted) {
                closeDialog();
                return { status: "cancelled" };
            }
            if (result.source === "manual") {
                browserAbort.abort();
                dialog.showProgress("Checking Prime Agent trace access...");
                const access = await checkPrimeAgentTracesAccess(result.apiKey, resolvePrimeAgentTracesBaseUrl(), {
                    signal: dialog.signal,
                });
                if (dialog.signal.aborted) {
                    closeDialog();
                    return { status: "cancelled" };
                }
                if (!access.ok) {
                    const status = access.status === undefined ? "" : `HTTP ${access.status}: `;
                    throw new Error(`Prime API key does not have Prime Agent trace access (${status}${access.message})`);
                }
            }
            return await this.completePrimeAgentTracesLogin(result.apiKey, closeDialog);
        }
        catch (error) {
            closeDialog();
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (!dialog.signal.aborted && errorMsg !== "Login cancelled") {
                this.host.showError(`Failed to login to ${PRIME_AGENT_TRACES_PROVIDER_NAME}: ${errorMsg}`);
                return { status: "failed" };
            }
            return { status: "cancelled" };
        }
        finally {
            dialog.signal.removeEventListener("abort", onDialogAbort);
        }
    }
    async showApiKeyLoginDialog(providerId, providerName, kind = "provider") {
        const dialog = new LoginDialogComponent(this.host.ui, providerId, (_success, _message) => {
            // Completion handled below
        }, providerName);
        const handle = showFullPaneOverlay(this.host.ui, dialog, 88);
        const closeDialog = () => {
            handle.hide();
            this.host.ui.requestRender();
        };
        try {
            const apiKey = (await dialog.showPrompt("Enter API key:")).trim();
            if (!apiKey) {
                throw new Error("API key cannot be empty.");
            }
            this.host.modelRegistry.authStorage.set(providerId, { type: "api_key", key: apiKey });
            closeDialog();
            return await this.completeProviderAuthentication(providerId, providerName, "api_key", undefined, kind);
        }
        catch (error) {
            closeDialog();
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (errorMsg !== "Login cancelled") {
                this.host.showError(`Failed to save API key for ${providerName}: ${errorMsg}`);
                return { status: "failed" };
            }
            return { status: "cancelled" };
        }
    }
    showOAuthLoginSelect(dialogHandle, prompt) {
        return new Promise((resolve) => {
            dialogHandle.setHidden(true);
            let selectorHandle;
            const restoreDialog = () => {
                selectorHandle?.hide();
                dialogHandle.setHidden(false);
                dialogHandle.focus();
                this.host.ui.requestRender();
            };
            const labels = prompt.options.map((option) => option.label);
            const selector = new ExtensionSelectorComponent(prompt.message, labels, (optionLabel) => {
                restoreDialog();
                resolve(prompt.options.find((option) => option.label === optionLabel)?.id);
            }, () => {
                restoreDialog();
                resolve(undefined);
            }, { getRows: () => this.host.ui.terminal.rows });
            selectorHandle = showFullPaneOverlay(this.host.ui, selector, 76);
        });
    }
    async showLoginDialog(providerId, providerName, kind = "provider") {
        const providerInfo = this.host.modelRegistry.authStorage
            .getOAuthProviders()
            .find((provider) => provider.id === providerId);
        // Providers that use callback servers (can paste redirect URL)
        const usesCallbackServer = providerInfo?.usesCallbackServer ?? false;
        // Create login dialog component
        const dialog = new LoginDialogComponent(this.host.ui, providerId, (_success, _message) => {
            // Completion handled below
        }, providerName);
        const dialogHandle = showFullPaneOverlay(this.host.ui, dialog, {
            maxContentWidth: 88,
            suspendFullscreenMouse: true,
        });
        // Promise for manual code input (racing with callback server)
        let manualCodeResolve;
        let manualCodeReject;
        const manualCodePromise = new Promise((resolve, reject) => {
            manualCodeResolve = resolve;
            manualCodeReject = reject;
        });
        // Close dialog overlay helper.
        const closeDialog = () => {
            dialogHandle.hide();
            this.host.ui.requestRender();
        };
        try {
            await this.host.modelRegistry.authStorage.login(providerId, {
                onAuth: (info) => {
                    dialog.showAuth(info.url, info.instructions);
                    if (usesCallbackServer) {
                        // Show input for manual paste, racing with callback
                        dialog
                            .showManualInput("Paste redirect URL below, or complete login in browser:")
                            .then((value) => {
                            if (value && manualCodeResolve) {
                                manualCodeResolve(value);
                                manualCodeResolve = undefined;
                            }
                        })
                            .catch(() => {
                            if (manualCodeReject) {
                                manualCodeReject(new Error("Login cancelled"));
                                manualCodeReject = undefined;
                            }
                        });
                    }
                    else if (providerId === "github-copilot") {
                        // GitHub Copilot polls after onAuth
                        dialog.showWaiting("Waiting for browser authentication...");
                    }
                    // For Anthropic: onPrompt is called immediately after
                },
                onPrompt: async (prompt) => {
                    return dialog.showPrompt(prompt.message, prompt.placeholder);
                },
                onProgress: (message) => {
                    dialog.showProgress(message);
                },
                onSelect: (prompt) => this.showOAuthLoginSelect(dialogHandle, prompt),
                onManualCodeInput: () => manualCodePromise,
                signal: dialog.signal,
            });
            // Success
            closeDialog();
            return await this.completeProviderAuthentication(providerId, providerName, "oauth", undefined, kind);
        }
        catch (error) {
            closeDialog();
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (errorMsg !== "Login cancelled") {
                this.host.showError(`Failed to login to ${providerName}: ${errorMsg}`);
                return { status: "failed" };
            }
            return { status: "cancelled" };
        }
    }
}
//# sourceMappingURL=auth-flows.js.map
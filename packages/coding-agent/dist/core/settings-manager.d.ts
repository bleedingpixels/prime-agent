import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { ServiceTier, Transport } from "@earendil-works/pi-ai";
export declare const DEFAULT_IDLE_EVICTION_MINUTES = 90;
export interface CompactionSettings {
    enabled?: boolean;
    reserveTokens?: number;
    keepRecentTokens?: number;
    agentCallable?: boolean;
}
export interface BranchSummarySettings {
    reserveTokens?: number;
    skipPrompt?: boolean;
}
export interface AutoRefineSettings {
    enabled?: boolean;
    turnInterval?: number;
    compact?: boolean;
    cooldownMs?: number;
}
export interface ProviderRetrySettings {
    timeoutMs?: number;
    maxRetries?: number;
    maxRetryDelayMs?: number;
}
export interface RetrySettings {
    enabled?: boolean;
    maxRetries?: number;
    baseDelayMs?: number;
    provider?: ProviderRetrySettings;
}
export interface TerminalSettings {
    showImages?: boolean;
    clearOnShrink?: boolean;
    showTerminalProgress?: boolean;
    fullscreen?: boolean;
    fullscreenMouse?: boolean;
}
export interface ImageSettings {
    autoResize?: boolean;
    blockImages?: boolean;
}
export interface ThinkingBudgetsSettings {
    minimal?: number;
    low?: number;
    medium?: number;
    high?: number;
}
export interface MarkdownSettings {
    codeBlockIndent?: string;
}
export interface BundledSkillsSettings {
    websearch?: boolean;
}
export interface WarningSettings {
    anthropicExtraUsage?: boolean;
}
export type TransportSetting = Transport;
/**
 * Package source for npm/git packages.
 * - String form: load all resources from the package
 * - Object form: filter which resources to load
 */
export type PackageSource = string | {
    source: string;
    extensions?: string[];
    skills?: string[];
    prompts?: string[];
    themes?: string[];
};
/**
 * Remote/local MCP server an integration connects to. Built-in integrations
 * (Linear/Notion) are defined in the ai/mcp catalog; this is for user-declared
 * servers. The kernel-side integration package reads creds from auth.json
 * (`mcp:<name>`); login/refresh run host-side.
 */
export type McpServerConfig = {
    type: "http";
    url: string;
    headers?: Record<string, string>;
    /** Env var holding a static bearer token (skips OAuth). */
    bearerTokenEnvVar?: string;
    /** Use the generic OAuth login flow for this server. */
    oauth?: boolean;
    /** Force-disable even when credentials exist. */
    enabled?: boolean;
    enabledTools?: string[];
    disabledTools?: string[];
} | {
    type: "stdio";
    command: string;
    args?: string[];
    env?: Record<string, string>;
    enabled?: boolean;
    enabledTools?: string[];
    disabledTools?: string[];
};
export interface Settings {
    onboardingShown?: boolean;
    onboardingCompleted?: boolean;
    defaultProvider?: string;
    defaultModel?: string;
    recentModels?: string[];
    defaultThinkingLevel?: ThinkingLevel;
    defaultServiceTier?: ServiceTier;
    rlmMaxDepth?: number;
    idleEvictionMinutes?: number | "off";
    transport?: TransportSetting;
    steeringMode?: "all" | "one-at-a-time";
    followUpMode?: "all" | "one-at-a-time";
    theme?: string;
    compaction?: CompactionSettings;
    autoRefine?: AutoRefineSettings;
    agentTraces?: AgentTracesSettings;
    telemetry?: TelemetrySettings;
    branchSummary?: BranchSummarySettings;
    retry?: RetrySettings;
    hideThinkingBlock?: boolean;
    shellPath?: string;
    quietStartup?: boolean;
    shellCommandPrefix?: string;
    npmCommand?: string[];
    mcpServers?: Record<string, McpServerConfig>;
    packages?: PackageSource[];
    extensions?: string[];
    skills?: string[];
    prompts?: string[];
    themes?: string[];
    enableSkillCommands?: boolean;
    bundledSkills?: BundledSkillsSettings;
    enableBuiltinSkills?: boolean;
    terminal?: TerminalSettings;
    images?: ImageSettings;
    enabledModels?: string[];
    treeFilterMode?: "default" | "no-tools" | "user-only" | "labeled-only" | "all";
    thinkingBudgets?: ThinkingBudgetsSettings;
    editorPaddingX?: number;
    autocompleteMaxVisible?: number;
    showHardwareCursor?: boolean;
    markdown?: MarkdownSettings;
    warnings?: WarningSettings;
    sessionDir?: string;
}
export interface AgentTracesSettings {
    enabled?: boolean;
}
export interface TelemetrySettings {
    enabled?: boolean;
    noticeShown?: boolean;
}
export type SettingsScope = "global" | "project";
export interface SettingsStorage {
    withLock(scope: SettingsScope, fn: (current: string | undefined) => string | undefined): void;
}
export interface SettingsError {
    scope: SettingsScope;
    error: Error;
}
export declare class FileSettingsStorage implements SettingsStorage {
    private globalSettingsPath;
    private projectSettingsPath;
    constructor(cwd: string, agentDir: string);
    private acquireLockSyncWithRetry;
    withLock(scope: SettingsScope, fn: (current: string | undefined) => string | undefined): void;
}
export declare class InMemorySettingsStorage implements SettingsStorage {
    private global;
    private project;
    withLock(scope: SettingsScope, fn: (current: string | undefined) => string | undefined): void;
}
export declare class SettingsManager {
    private storage;
    private globalSettings;
    private projectSettings;
    private settings;
    private runtimeOverrides;
    private modifiedFields;
    private modifiedNestedFields;
    private modifiedProjectFields;
    private modifiedProjectNestedFields;
    private globalSettingsLoadError;
    private projectSettingsLoadError;
    private writeQueue;
    private errors;
    private constructor();
    /** Create a SettingsManager that loads from files */
    static create(cwd: string, agentDir?: string): SettingsManager;
    /** Create a SettingsManager from an arbitrary storage backend */
    static fromStorage(storage: SettingsStorage): SettingsManager;
    /** Create an in-memory SettingsManager (no file I/O) */
    static inMemory(settings?: Partial<Settings>): SettingsManager;
    private static loadFromStorage;
    private static tryLoadFromStorage;
    /** Migrate old settings format to new format */
    private static migrateSettings;
    getGlobalSettings(): Settings;
    getProjectSettings(): Settings;
    reload(): Promise<void>;
    /** Apply additional overrides on top of current settings */
    applyOverrides(overrides: Partial<Settings>): void;
    /** Mark a global field as modified during this session */
    private markModified;
    /** Mark a project field as modified during this session */
    private markProjectModified;
    private recordError;
    private clearModifiedScope;
    private enqueueWrite;
    private cloneModifiedNestedFields;
    private persistScopedSettings;
    private save;
    private saveProjectSettings;
    flush(): Promise<void>;
    drainErrors(scope?: SettingsScope): SettingsError[];
    getOnboardingShown(): boolean;
    setOnboardingShown(shown: boolean): void;
    getSessionDir(): string | undefined;
    getDefaultProvider(): string | undefined;
    getDefaultModel(): string | undefined;
    setDefaultProvider(provider: string): void;
    setDefaultModel(modelId: string): void;
    setDefaultModelAndProvider(provider: string, modelId: string): void;
    getRecentModels(): string[];
    private recordModelUseInternal;
    getSteeringMode(): "all" | "one-at-a-time";
    setSteeringMode(mode: "all" | "one-at-a-time"): void;
    getFollowUpMode(): "all" | "one-at-a-time";
    setFollowUpMode(mode: "all" | "one-at-a-time"): void;
    getTheme(): string | undefined;
    setTheme(theme: string): void;
    getDefaultThinkingLevel(): ThinkingLevel | undefined;
    setDefaultThinkingLevel(level: ThinkingLevel): void;
    getDefaultServiceTier(): ServiceTier;
    setDefaultServiceTier(serviceTier: ServiceTier): void;
    getRlmMaxDepth(): number | undefined;
    setRlmMaxDepth(maxDepth: number): void;
    getIdleEvictionMinutes(): number | "off";
    setIdleEvictionMinutes(value: number | "off"): void;
    getTransport(): TransportSetting;
    setTransport(transport: TransportSetting): void;
    getCompactionEnabled(): boolean;
    setCompactionEnabled(enabled: boolean): void;
    getAgentTracesEnabled(): boolean;
    setAgentTracesEnabled(enabled: boolean): void;
    getTelemetryEnabled(): boolean;
    private getOrCreateGlobalTelemetrySettings;
    setTelemetryEnabled(enabled: boolean): void;
    getTelemetryNoticeShown(): boolean;
    setTelemetryNoticeShown(shown: boolean): void;
    getCompactionReserveTokens(): number;
    getCompactionKeepRecentTokens(): number;
    getCompactionAgentCallable(): boolean;
    getCompactionSettings(): {
        enabled: boolean;
        reserveTokens: number;
        keepRecentTokens: number;
    };
    getAutoRefineSettings(): {
        enabled: boolean;
        turnInterval: number;
        compact: boolean;
        cooldownMs: number;
    };
    getBranchSummarySettings(): {
        reserveTokens: number;
        skipPrompt: boolean;
    };
    getBranchSummarySkipPrompt(): boolean;
    getRetryEnabled(): boolean;
    setRetryEnabled(enabled: boolean): void;
    getRetrySettings(): {
        enabled: boolean;
        maxRetries: number;
        baseDelayMs: number;
    };
    getProviderRetrySettings(): {
        timeoutMs?: number;
        maxRetries?: number;
        maxRetryDelayMs: number;
    };
    getHideThinkingBlock(): boolean;
    setHideThinkingBlock(hide: boolean): void;
    getShellPath(): string | undefined;
    setShellPath(path: string | undefined): void;
    getQuietStartup(): boolean;
    setQuietStartup(quiet: boolean): void;
    getShellCommandPrefix(): string | undefined;
    setShellCommandPrefix(prefix: string | undefined): void;
    getNpmCommand(): string[] | undefined;
    setNpmCommand(command: string[] | undefined): void;
    getPackages(): PackageSource[];
    setPackages(packages: PackageSource[]): void;
    setProjectPackages(packages: PackageSource[]): void;
    getExtensionPaths(): string[];
    setExtensionPaths(paths: string[]): void;
    setProjectExtensionPaths(paths: string[]): void;
    getSkillPaths(): string[];
    setSkillPaths(paths: string[]): void;
    setProjectSkillPaths(paths: string[]): void;
    getPromptTemplatePaths(): string[];
    setPromptTemplatePaths(paths: string[]): void;
    setProjectPromptTemplatePaths(paths: string[]): void;
    getThemePaths(): string[];
    setThemePaths(paths: string[]): void;
    setProjectThemePaths(paths: string[]): void;
    getEnableSkillCommands(): boolean;
    setEnableSkillCommands(enabled: boolean): void;
    getBundledSkills(): {
        websearch: boolean;
    };
    getBundledWebsearchEnabled(): boolean;
    getEnableBuiltinSkills(): boolean;
    setEnableBuiltinSkills(enabled: boolean): void;
    getThinkingBudgets(): ThinkingBudgetsSettings | undefined;
    getShowImages(): boolean;
    setShowImages(show: boolean): void;
    getClearOnShrink(): boolean;
    setClearOnShrink(enabled: boolean): void;
    getFullscreen(): boolean;
    setFullscreen(enabled: boolean): void;
    getFullscreenMouse(): boolean;
    setFullscreenMouse(enabled: boolean): void;
    getShowTerminalProgress(): boolean;
    setShowTerminalProgress(enabled: boolean): void;
    getImageAutoResize(): boolean;
    setImageAutoResize(enabled: boolean): void;
    getBlockImages(): boolean;
    setBlockImages(blocked: boolean): void;
    getEnabledModels(): string[] | undefined;
    getMcpServers(): Record<string, McpServerConfig> | undefined;
    setEnabledModels(patterns: string[] | undefined): void;
    getTreeFilterMode(): "default" | "no-tools" | "user-only" | "labeled-only" | "all";
    setTreeFilterMode(mode: "default" | "no-tools" | "user-only" | "labeled-only" | "all"): void;
    getShowHardwareCursor(): boolean;
    setShowHardwareCursor(enabled: boolean): void;
    getEditorPaddingX(): number;
    setEditorPaddingX(padding: number): void;
    getAutocompleteMaxVisible(): number;
    setAutocompleteMaxVisible(maxVisible: number): void;
    getCodeBlockIndent(): string;
    getWarnings(): WarningSettings;
    setWarnings(warnings: WarningSettings): void;
}
//# sourceMappingURL=settings-manager.d.ts.map
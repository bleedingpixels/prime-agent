import type { AgentSession } from "./agent-session.js";
import type { AgentExecutionMode } from "./agent-session-config.js";
import type { AuthCredential, AuthStatus } from "./auth-storage.js";
import type { SettingsManager } from "./settings-manager.js";
type TelemetryPrimitive = string | number | boolean | null;
type TelemetryProperties = Record<string, TelemetryPrimitive>;
export type TelemetryEventName = "agent started" | "onboarding completed" | "agent command used" | "agent run completed" | "agent session ended";
export type TelemetryExecutionMode = AgentExecutionMode | "unknown";
export type TelemetryOnboardingOutcome = "success" | "error" | "aborted";
export type TelemetryAuthCategory = "oauth" | "api_key" | "runtime_api_key" | "environment" | "prime_cli" | "models_json" | "fallback" | "stale" | "stored" | "none";
export interface TelemetryEvent {
    id: string;
    name: TelemetryEventName;
    timestamp: string;
    properties: TelemetryProperties;
}
export interface TelemetryBatch {
    installation_id: string;
    events: TelemetryEvent[];
}
export interface TelemetrySink {
    capture(name: TelemetryEventName, properties: TelemetryProperties): void;
    flush(): Promise<void>;
}
interface TelemetryClientOptions {
    agentDir: string;
    endpoint?: string;
    fetch?: typeof fetch;
    now?: () => number;
    randomId?: () => string;
    batchSize?: number;
    flushIntervalMs?: number;
    requestTimeoutMs?: number;
}
interface InstallAgentTelemetryOptions {
    agentDir: string;
    settingsManager: SettingsManager;
    executionMode?: AgentExecutionMode;
    sink?: TelemetrySink;
    now?: () => number;
    randomId?: () => string;
}
export interface CaptureOnboardingCompletedOptions {
    agentDir: string;
    settingsManager: SettingsManager;
    durationMs: number;
    outcome: TelemetryOnboardingOutcome;
    provider?: string;
    authSource?: AuthStatus["source"];
    storedCredentialType?: AuthCredential["type"];
    sink?: TelemetrySink;
    now?: () => number;
    randomId?: () => string;
}
export interface CaptureAgentCommandUsedOptions {
    agentDir: string;
    settingsManager: SettingsManager;
    commandName: string;
    sink?: TelemetrySink;
    now?: () => number;
    randomId?: () => string;
}
export declare function isTelemetryEnabled(settingsManager: SettingsManager): boolean;
export declare function getOrCreateTelemetryInstallationId(agentDir: string, randomId?: () => string): string;
export declare class TelemetryClient implements TelemetrySink {
    private readonly options;
    private readonly endpoint;
    private readonly fetchImpl;
    private readonly now;
    private readonly randomId;
    private readonly batchSize;
    private readonly flushIntervalMs;
    private readonly requestTimeoutMs;
    private installationId?;
    private queue;
    private flushTimer?;
    private flushInFlight?;
    private disabled;
    constructor(options: TelemetryClientOptions);
    capture(name: TelemetryEventName, properties: TelemetryProperties): void;
    private scheduleFlush;
    flush(): Promise<void>;
    private drainQueue;
    private send;
}
export declare function telemetryProviderCategory(provider: string | undefined): string;
export declare function telemetryAuthCategory(source: AuthStatus["source"], storedCredentialType?: AuthCredential["type"]): TelemetryAuthCategory;
export declare function captureOnboardingCompleted(options: CaptureOnboardingCompletedOptions): Promise<void>;
export declare function captureAgentCommandUsed(options: CaptureAgentCommandUsedOptions): Promise<void>;
export declare function installAgentTelemetry(session: AgentSession, options: InstallAgentTelemetryOptions): void;
export {};
//# sourceMappingURL=telemetry.d.ts.map
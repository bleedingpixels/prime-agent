import type { OAuthAuthInfo } from "@earendil-works/pi-ai";
export declare const PRIME_INFERENCE_PROVIDER_ID = "prime-inference";
export declare const PRIME_INFERENCE_PROVIDER_NAME = "Prime Inference";
export declare const PRIME_AGENT_TRACES_PROVIDER_ID = "prime-agent-traces";
export declare const PRIME_AGENT_TRACES_PROVIDER_NAME = "Prime Agent Traces";
export type PrimeInferenceAuthSource = "prime-cli" | "browser";
export type PrimeInferenceLoginResult = {
    apiKey: string;
    source: PrimeInferenceAuthSource;
};
export type PrimeCliConfig = {
    apiKey?: string;
    baseUrl: string;
    frontendUrl: string;
    inferenceUrl: string;
    path: string;
    teamId?: string;
    teamName?: string;
    teamRole?: string;
    teamIdFromEnv: boolean;
};
export type PrimeInferenceLoginCallbacks = {
    onAuth: (info: OAuthAuthInfo) => void;
    onProgress?: (message: string) => void;
    signal?: AbortSignal;
};
export type PrimeInferenceLoginOptions = {
    configPath?: string;
    fetchFn?: typeof fetch;
    pollIntervalMs?: number;
    requestTimeoutMs?: number;
};
export type PrimeInferenceAccessResult = {
    ok: true;
} | {
    ok: false;
    status?: number;
    message: string;
};
export type PrimeTeam = {
    teamId: string;
    name: string;
    slug?: string;
    role?: string;
    createdAt?: string;
};
export declare function getPrimeCliConfigPath(configPath?: string): string;
export declare function loadPrimeCliConfig(configPath?: string): PrimeCliConfig;
export declare function savePrimeCliApiKey(apiKey: string, configPath?: string): PrimeCliConfig;
export declare function clearPrimeCliCredentials(configPath?: string): PrimeCliConfig;
export declare function savePrimeCliTeamSelection(team: PrimeTeam | null, configPath?: string): PrimeCliConfig;
export declare function resolvePrimeAgentTracesBaseUrl(baseUrl?: string): string;
export declare function fetchPrimeTeams(apiKey: string, baseUrl: string, options?: {
    fetchFn?: typeof fetch;
    requestTimeoutMs?: number;
    signal?: AbortSignal;
}): Promise<PrimeTeam[]>;
export declare function checkPrimeInferenceAccess(apiKey: string, baseUrl: string, options?: {
    fetchFn?: typeof fetch;
    requestTimeoutMs?: number;
    signal?: AbortSignal;
}): Promise<PrimeInferenceAccessResult>;
export declare function checkPrimeAgentTracesAccess(apiKey: string, baseUrl: string, options?: {
    fetchFn?: typeof fetch;
    requestTimeoutMs?: number;
    signal?: AbortSignal;
}): Promise<PrimeInferenceAccessResult>;
export declare function loginPrimeInference(callbacks: PrimeInferenceLoginCallbacks, options?: PrimeInferenceLoginOptions): Promise<PrimeInferenceLoginResult>;
export declare function loginPrimeAgentTraces(callbacks: PrimeInferenceLoginCallbacks, options?: PrimeInferenceLoginOptions): Promise<PrimeInferenceLoginResult>;
//# sourceMappingURL=prime-inference-auth.d.ts.map
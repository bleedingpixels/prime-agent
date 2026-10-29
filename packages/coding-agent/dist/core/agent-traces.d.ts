import type { AuthStorage } from "./auth-storage.js";
import type { SessionHeader, SessionManager } from "./session-manager.js";
import type { SettingsManager } from "./settings-manager.js";
export type AgentTraceCredentialSource = "environment" | "stored" | "prime-inference" | "prime-cli";
export interface AgentTraceCredential {
    apiKey: string;
    source: AgentTraceCredentialSource;
    label: string;
}
export type AgentTraceUploadResult = {
    status: "uploaded";
    sessionId: string;
    traceId: string;
    bytesStored: number;
    key?: string;
} | {
    status: "disabled";
} | {
    status: "missing_credentials";
} | {
    status: "no_session_file";
} | {
    status: "empty_session";
} | {
    status: "invalid_session";
    message: string;
} | {
    status: "too_large";
    size: number;
    maxBytes: number;
} | {
    status: "failed";
    statusCode?: number;
    message: string;
};
export interface AgentTraceUploadOptions {
    sessionFile: string | undefined;
    authStorage: AuthStorage;
    settingsManager: SettingsManager;
    /** Require the global automatic-sharing opt-in. Set false only for an explicit one-shot upload command. */
    requireEnabled?: boolean;
    baseUrl?: string;
    configPath?: string;
    fetchFn?: typeof fetch;
    reloadConfig?: boolean;
    requestTimeoutMs?: number;
    signal?: AbortSignal;
}
export interface AgentTraceSessionUploadOptions extends Omit<AgentTraceUploadOptions, "sessionFile"> {
    sessionManager: SessionManager;
}
export interface AgentTraceUploadInstallOptions {
    authStorage: AuthStorage;
    settingsManager: SettingsManager;
    baseUrl?: string;
    configPath?: string;
    fetchFn?: typeof fetch;
    requestTimeoutMs?: number;
}
export type AgentTracePreviewResult = {
    status: "ready";
    sessionFile: string;
    sessionId: string;
    traceId: string;
    parentSessionId?: string;
    cwd: string;
    size: number;
    maxBytes: number;
    uploadable: boolean;
    endpoint: string;
    gitRepo?: string;
    gitCommit?: string;
    contentPreview: string;
    truncated: boolean;
} | {
    status: "no_session_file";
} | {
    status: "empty_session";
} | {
    status: "invalid_session";
    message: string;
} | {
    status: "failed";
    message: string;
};
export interface AgentTracePreviewOptions {
    sessionFile: string | undefined;
    baseUrl?: string;
    maxContentChars?: number;
}
export interface AgentTraceUploadAllProgress {
    completed: number;
    total: number;
    sessionFile?: string;
    result?: AgentTraceUploadResult;
}
export interface AgentTraceUploadAllOptions extends Omit<AgentTraceUploadOptions, "sessionFile"> {
    sessionDir?: string;
    concurrency?: number;
    onProgress?: (progress: AgentTraceUploadAllProgress) => void;
}
export interface AgentTraceUploadAllResult {
    total: number;
    uploaded: number;
    failed: number;
    skipped: number;
    bytesStored: number;
    results: Array<{
        sessionFile: string;
        result: AgentTraceUploadResult;
    }>;
}
/** Active-branch git for the indexing headers: walk leaf to root, not the last git_state in
 * file order (which may belong to a sibling branch). */
export declare function activeGitContext(body: string, header: SessionHeader): {
    repoUrl?: string;
    commit?: string;
} | undefined;
export declare function previewAgentTraceFile(options: AgentTracePreviewOptions): Promise<AgentTracePreviewResult>;
export declare function findAgentTraceFiles(sessionDir?: string): Promise<string[]>;
export declare function uploadAllAgentTraces(options: AgentTraceUploadAllOptions): Promise<AgentTraceUploadAllResult>;
export declare function getPrimeAgentTraceCredential(authStorage: AuthStorage, options?: {
    reloadAuth?: boolean;
    configPath?: string;
}): Promise<AgentTraceCredential | undefined>;
export declare function uploadAgentTraceFile(options: AgentTraceUploadOptions): Promise<AgentTraceUploadResult>;
export declare function uploadAgentTraceSession(options: AgentTraceSessionUploadOptions): Promise<AgentTraceUploadResult>;
export declare function installAgentTraceUpload(sessionManager: SessionManager, options: AgentTraceUploadInstallOptions): void;
export declare function flushAgentTraceUpload(sessionManager: SessionManager): Promise<AgentTraceUploadResult | undefined>;
//# sourceMappingURL=agent-traces.d.ts.map
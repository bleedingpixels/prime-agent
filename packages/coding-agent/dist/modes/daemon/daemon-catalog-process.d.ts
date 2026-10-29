import type { DeleteSessionFileResult } from "../../core/session-file-actions.js";
import { type SessionInfo } from "../../core/session-manager.js";
export declare const DAEMON_CATALOG_ROLE_ENV = "PRIME_AGENT_INTERNAL_DAEMON_CATALOG";
interface CatalogListCallbacks {
    onProgress?: (loaded: number, total: number) => void;
    onSession?: (session: SessionInfo) => void;
}
export declare function listSavedSessionSiblings(sessionPath: string): Promise<SessionInfo[]>;
/** @internal Exported to pin catalog selector semantics without spawning a catalog process. */
export declare function resolveCatalogSessionMatch(sessions: readonly SessionInfo[], selector: string): SessionInfo | undefined;
export declare function isDaemonCatalogProcess(environment?: NodeJS.ProcessEnv): boolean;
export declare function runDaemonCatalogProcess(): Promise<never>;
export declare class DaemonCatalogClient {
    private readonly onDiagnostic;
    private child?;
    private starting?;
    private readonly pending;
    constructor(onDiagnostic: (message: string) => void);
    start(): Promise<void>;
    list(cwd?: string, sessionDir?: string, callbacks?: CatalogListCallbacks): Promise<SessionInfo[]>;
    siblings(sessionPath: string): Promise<SessionInfo[]>;
    rename(sessionPath: string, name: string): Promise<void>;
    resolve(selector: string, cwd: string, sessionDir?: string): Promise<string>;
    delete(sessionPath: string): Promise<DeleteSessionFileResult>;
    archive(sessionPath: string, sessionId: string): Promise<boolean>;
    markInterrupted(sessionPath: string, activeSessionId: string, operations: string[]): Promise<void>;
    stop(): Promise<void>;
    private spawnCatalog;
    private request;
    private handleMessage;
    private handleClose;
}
export {};
//# sourceMappingURL=daemon-catalog-process.d.ts.map
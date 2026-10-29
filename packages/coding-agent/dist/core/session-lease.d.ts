export declare const SESSION_LEASES_ENABLED_ENV = "PRIME_AGENT_INTERNAL_SESSION_LEASES";
export declare const SESSION_LEASE_OWNER_ID_ENV = "PRIME_AGENT_INTERNAL_SESSION_LEASE_OWNER_ID";
export declare class SessionAlreadyActiveError extends Error {
    readonly sessionPath: string;
    readonly activeSessionId?: string | undefined;
    readonly code: "session_already_active";
    constructor(sessionPath: string, activeSessionId?: string | undefined);
}
export declare class SessionLease {
    readonly sessionPath: string;
    private readonly directory;
    private readonly token;
    private released;
    constructor(sessionPath: string, directory: string, token: string);
    release(): void;
}
export declare function canonicalSessionPath(sessionPath: string): string;
type ProcessQuery = (command: string, args: string[]) => string;
export declare function getWindowsProcessStartId(pid: number, query?: ProcessQuery): string | undefined;
export declare function getProcessStartId(pid: number): string | undefined;
export declare function acquireSessionLease(sessionPath: string | undefined, agentDir: string, environment?: NodeJS.ProcessEnv): SessionLease | undefined;
export {};
//# sourceMappingURL=session-lease.d.ts.map
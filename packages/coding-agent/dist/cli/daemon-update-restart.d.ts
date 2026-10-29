export declare const DAEMON_UPDATE_RESTART_COORDINATOR_FLAG = "--internal-update-restart-coordinator";
export declare const DAEMON_UPDATE_RESTART_STATUS_FLAG = "--internal-update-restart-status";
export declare const DAEMON_UPDATE_RESTART_ORIGIN_FLAG = "--internal-update-restart-origin";
export type DaemonUpdateRestartPhase = "starting" | "preparing" | "stopping" | "starting_daemon" | "restoring" | "complete" | "skipped" | "failed";
export interface DaemonUpdateRestartCounts {
    total: number;
    restored: number;
    resumed: number;
    failed: number;
}
export interface DaemonUpdateRestartFailure {
    sessionFile: string;
    message: string;
}
export interface DaemonUpdateRestartProcessIdentity {
    pid: number;
    processStartId?: string;
    supervisorGeneration?: string;
    supervisorOwnerToken?: string;
}
export interface DaemonUpdateRestartStatus {
    version: 1;
    requestId: string;
    socketPath: string;
    phase: DaemonUpdateRestartPhase;
    coordinator: DaemonUpdateRestartProcessIdentity;
    predecessor?: DaemonUpdateRestartProcessIdentity;
    successor?: DaemonUpdateRestartProcessIdentity;
    counts: DaemonUpdateRestartCounts;
    failures?: DaemonUpdateRestartFailure[];
    message?: string;
    startedAt: string;
    updatedAt: string;
    heartbeatAt?: string;
}
export interface DaemonUpdateRestartReport {
    info: string[];
    warnings: string[];
}
export interface DaemonUpdateRestartCoordinatorRecord extends DaemonUpdateRestartProcessIdentity {
    version: 1;
    token: string;
    requestId: string;
    socketPath: string;
    statusPath: string;
    createdAt: string;
}
export interface LaunchDaemonUpdateRestartCoordinatorOptions {
    socketPath: string;
    agentDir: string;
    cwd?: string;
    originActiveSessionId?: string;
    timeoutMs?: number;
}
export interface AcquireDaemonUpdateRestartCoordinatorOptions {
    requestId: string;
    socketPath: string;
    statusPath: string;
    registryDir?: string;
}
export declare function resolveDaemonUpdateRestartSocketPath(socketPath?: string): string;
export declare function buildDaemonUpdateRestartReport(status: DaemonUpdateRestartStatus): DaemonUpdateRestartReport;
export declare function readDaemonUpdateRestartStatus(path: string): DaemonUpdateRestartStatus | undefined;
export declare class DaemonUpdateRestartStatusWriter {
    private readonly path;
    private status;
    constructor(path: string, requestId: string, socketPath: string);
    update(update: Partial<Omit<DaemonUpdateRestartStatus, "version" | "requestId" | "socketPath" | "coordinator">>): void;
    current(): DaemonUpdateRestartStatus;
    touch(): void;
    startHeartbeat(): () => void;
    private persist;
}
export declare class DaemonUpdateRestartCoordinatorLease {
    readonly record: DaemonUpdateRestartCoordinatorRecord;
    private readonly registryDir;
    private readonly path;
    private released;
    constructor(record: DaemonUpdateRestartCoordinatorRecord, registryDir: string, path: string);
    release(): Promise<void>;
}
export declare class DaemonUpdateRestartCoordinatorAlreadyRunningError extends Error {
    readonly record: DaemonUpdateRestartCoordinatorRecord;
    constructor(record: DaemonUpdateRestartCoordinatorRecord);
}
export declare function acquireDaemonUpdateRestartCoordinator(options: AcquireDaemonUpdateRestartCoordinatorOptions): Promise<DaemonUpdateRestartCoordinatorLease>;
export declare function waitForActiveDaemonUpdateRestartCoordinator(record: DaemonUpdateRestartCoordinatorRecord, progressTimeoutMs?: number): Promise<DaemonUpdateRestartStatus>;
export declare function launchDaemonUpdateRestartCoordinator(options: LaunchDaemonUpdateRestartCoordinatorOptions): Promise<DaemonUpdateRestartStatus>;
//# sourceMappingURL=daemon-update-restart.d.ts.map
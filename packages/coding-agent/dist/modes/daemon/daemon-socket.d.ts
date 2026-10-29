export declare class DaemonSocketPathLease {
    readonly socketPath: string;
    private readonly releaseLock;
    private released;
    constructor(socketPath: string, releaseLock: () => Promise<void>);
    release(): Promise<void>;
}
export interface DaemonSocketIdentity {
    dev: number;
    ino: number;
}
export declare function defaultDaemonSocketPath(): string;
export declare function acquireDaemonSocketPathLease(socketPath: string): Promise<DaemonSocketPathLease | undefined>;
export declare function prepareDaemonSocketPath(socketPath: string, lease?: DaemonSocketPathLease): Promise<void>;
export declare function restrictDaemonSocketPath(socketPath: string): void;
export declare function getDaemonSocketIdentity(socketPath: string): DaemonSocketIdentity | undefined;
export declare function cleanupDaemonSocketPath(socketPath: string, expectedIdentity?: DaemonSocketIdentity, lease?: DaemonSocketPathLease): void;
export declare function defaultDaemonSocketDir(): string;
//# sourceMappingURL=daemon-socket.d.ts.map
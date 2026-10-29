type DaemonSupervisorOwnerPhase = "starting" | "owner" | "stopping";
interface ProcessIdentity {
    pid: number;
    processStartId?: string;
}
interface DaemonSupervisorOwnerRecord extends ProcessIdentity {
    version: 1;
    role: "supervisor";
    token: string;
    generation: string;
    socketPath: string;
    descriptorDir: string;
    agentDir: string;
    appVersion: string;
    phase: DaemonSupervisorOwnerPhase;
    createdAt: string;
    updatedAt: string;
}
interface DaemonShutdownAdmissionRecord extends ProcessIdentity {
    version: 1;
    token: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
}
interface DaemonSupervisorHelloIdentity {
    supervisorGeneration?: string;
    supervisorOwnerToken?: string;
    supervisorPid?: number;
    supervisorProcessStartId?: string;
    supervisorSocketPath?: string;
}
interface AcquireDaemonSupervisorOwnershipOptions {
    socketPath: string;
    descriptorDir: string;
    agentDir: string;
    generation: string;
    appVersion: string;
    registryDir?: string;
}
declare class DaemonSupervisorOwnership {
    readonly record: DaemonSupervisorOwnerRecord;
    private readonly registryDir;
    private readonly ownerDirectory;
    private released;
    constructor(record: DaemonSupervisorOwnerRecord, registryDir: string, ownerDirectory: string);
    assertCurrent(): Promise<void>;
    updatePhase(phase: DaemonSupervisorOwnerPhase): Promise<void>;
    release(): Promise<void>;
}
declare class DaemonShutdownAdmission {
    private readonly record;
    private readonly registryDir;
    private released;
    private lost;
    private refreshPromise?;
    private readonly refreshTimer;
    constructor(record: DaemonShutdownAdmissionRecord, registryDir: string);
    assertOrRenew(): Promise<void>;
    release(): Promise<void>;
}
export declare function acquireDaemonSupervisorOwnership(options: AcquireDaemonSupervisorOwnershipOptions): Promise<DaemonSupervisorOwnership>;
export declare function assertDaemonSupervisorOwnerCurrent(owner: {
    generation: string;
    pid: number;
    processStartId?: string;
    socketPath: string;
}, validatedFingerprint?: string): Promise<string>;
export declare function acquireDaemonShutdownAdmission(): Promise<DaemonShutdownAdmission>;
export declare function isDaemonShutdownAdmissionActive(): Promise<boolean>;
export declare function persistDaemonStartupFenceFromOwner(socketPath: string, hello: DaemonSupervisorHelloIdentity, registryDir?: string): Promise<void>;
export declare function waitForDaemonStartupFence(socketPath: string, timeoutMs?: number, registryDir?: string): Promise<void>;
export {};
//# sourceMappingURL=daemon-supervisor-ownership.d.ts.map
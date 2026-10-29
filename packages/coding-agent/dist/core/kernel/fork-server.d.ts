export declare class ForkServerUnavailable extends Error {
    constructor(message: string);
}
export declare function isForkServerEnabled(): boolean;
interface SpawnParams {
    connectionPath: string;
    cwd?: string;
    env?: Record<string, string | undefined>;
}
/**
 * Fork a kernel onto `spawn.connectionPath` from the shared template for this
 * interpreter, applying `spawn.cwd`/`spawn.env` in the forked child. Throws
 * ForkServerUnavailable if forking is disabled or fails — callers fall back to
 * direct spawn. Returns the forked child's pid (owned/killed by the caller).
 */
export declare function forkKernel(python: string, spawn: SpawnParams): Promise<number>;
export declare function disposeAllForkServers(): void;
export {};
//# sourceMappingURL=fork-server.d.ts.map
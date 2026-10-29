import { type DaemonUpdateRestartStatus } from "./cli/daemon-update-restart.js";
import { type DaemonUpdateRestartManifest } from "./modes/daemon/daemon-protocol.js";
export type PackageCommand = "install" | "remove" | "update" | "list";
export declare function isSelfUpdateSource(source: string): boolean;
export declare function resolveUpdateDaemonSocketPath(explicitSocketPath?: string): string;
export declare function prepareDaemonUpdateRestart(socketPath: string, agentDir: string): Promise<DaemonUpdateRestartManifest>;
export declare function runDaemonUpdateRestartCoordinator(options: {
    socketPath: string;
    agentDir: string;
    statusPath: string;
    originActiveSessionId?: string;
}): Promise<DaemonUpdateRestartStatus>;
export declare function handleConfigCommand(args: string[]): Promise<boolean>;
export declare function handlePackageCommand(args: string[]): Promise<boolean>;
//# sourceMappingURL=package-manager-cli.d.ts.map
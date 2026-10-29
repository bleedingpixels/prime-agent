/**
 * Daemon launch/readiness helpers.
 *
 * This module stays light on imports so clients can start a cold daemon before
 * the heavy main module graph loads. main.ts reuses the same memoized promise.
 */
import { DaemonClient, type DaemonHello } from "../modes/daemon/daemon-client.js";
import { type SessionSummary } from "../modes/daemon/daemon-session-list.js";
export declare function isDaemonSessionSummary(value: unknown): value is SessionSummary;
type DaemonVersionProbe = {
    status: "absent";
} | {
    status: "current";
    hello: DaemonHello;
} | {
    status: "stale";
    hello?: DaemonHello;
};
/** Connect to a running daemon and check whether it matches this client's protocol and app version. */
export declare function probeDaemonVersion(socketPath: string): Promise<DaemonVersionProbe>;
export declare function listActiveDaemonSessionSummaries(client: DaemonClient, options?: {
    includeClientOwned?: boolean;
}): Promise<SessionSummary[]>;
/** Thrown when a stale-version daemon can't be replaced. The message is user-facing. */
export declare class StaleDaemonError extends Error {
    readonly socketPath: string;
    constructor(socketPath: string, hello?: DaemonHello);
}
export declare function shutdownConnectedDaemonAndWait(client: DaemonClient, socketPath: string, timeoutMs?: number, hello?: DaemonHello | undefined): Promise<boolean>;
export declare function shutdownDaemonAndWait(socketPath: string, timeoutMs?: number): Promise<boolean>;
export type RunningDaemonProbe = {
    reachable: false;
} | {
    reachable: true;
    activeSessions?: SessionSummary[];
    busyClientOwnedSessionCount?: number;
};
export declare function isSessionBusy(summary: SessionSummary): boolean;
export declare function probeRunningDaemonSessions(socketPath: string): Promise<RunningDaemonProbe>;
/**
 * Ensure a current-version daemon is listening on socketPath, spawning one if
 * needed. Memoized per socket so the early kick from cli.ts and the await in
 * main.ts share one probe/spawn; failed attempts are forgotten so a later call
 * retries (and surfaces the real error at its await site).
 */
export declare function ensureInteractiveDaemonRunning(socketPath: string, spawnCwd?: string): Promise<void>;
export declare function shouldStartDaemonEarly(args: readonly string[], startupBenchmark: boolean): boolean;
export declare function maybeStartDaemonEarly(args: readonly string[]): void;
export {};
//# sourceMappingURL=daemon-launch.d.ts.map
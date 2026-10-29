/**
 * `daemon ps` discovers every prime-agent daemon on the machine, not just the
 * one on a single socket. Discovery has two sources merged by socket path:
 *
 *  1. The OS list of listening unix sockets owned by a prime-agent process
 *     (`ss -lxp` on Linux, `lsof` on macOS). Daemons set process.title to
 *     APP_NAME and carry nothing useful in argv, so the socket→pid mapping the
 *     kernel keeps is the only reliable way to find daemons on arbitrary
 *     `--daemon-socket` paths. This is the same data as `ss -lxp | grep
 *     prime-agent`, just parsed.
 *  2. A sweep of the default socket dir, which catches orphaned socket *files*
 *     left behind by daemons that are no longer running.
 *
 * Each discovered socket is then probed with the existing daemon_hello + list
 * primitives, so introspection works even against stale daemons running an
 * older build (a new protocol command would not).
 */
export type DaemonStatus = "current" | "stale" | "unreachable" | "orphan-file";
export interface DiscoveredDaemonProcess {
    pid: number;
    socketPath: string;
    uptimeSeconds?: number;
}
export interface DaemonInfo {
    socketPath: string;
    pid?: number;
    uptimeSeconds?: number;
    version?: string;
    protocolVersion?: number;
    schemaId?: string;
    buildId?: string;
    executablePath?: string;
    pidSource?: "listener" | "hello";
    sessionCount?: number;
    status: DaemonStatus;
    isDefault: boolean;
    hasTrackedWorkers?: boolean;
}
export declare function evaluateShutdownQuietPeriod(now: number, quietSince: number | undefined): "complete" | "waiting";
/** Parse `ss -lxp` output into the prime-agent daemons listening on unix sockets. */
export declare function parseSsListeners(stdout: string, appName: string): DiscoveredDaemonProcess[];
/** Parse `lsof -nP -F pn -U -a -c <app>` output into listening unix socket owners (macOS fallback). */
export declare function parseLsofListeners(stdout: string): DiscoveredDaemonProcess[];
export declare function parsePrimeAgentProcessIds(stdout: string, appName: string): number[];
export declare function mergeDiscoveredDaemonProcesses(...groups: readonly DiscoveredDaemonProcess[][]): DiscoveredDaemonProcess[];
/** Parse `ps -o pid=,etimes=` output into a pid → uptime-seconds map. */
export declare function parsePsEtimes(stdout: string): Map<number, number>;
export declare function verifyHelloSupervisorPid(pid: number | undefined, expectedProcessStartId: string | undefined): number | undefined;
/** Discover every daemon on the machine and probe each for version + session count. */
export declare function discoverDaemons(): Promise<DaemonInfo[]>;
export declare function sortDaemons(infos: DaemonInfo[]): DaemonInfo[];
export declare function runPs(json: boolean): Promise<void>;
export type ReapAction = {
    kind: "remove-file";
    daemon: DaemonInfo;
} | {
    kind: "kill";
    daemon: DaemonInfo;
} | {
    kind: "shutdown";
    daemon: DaemonInfo;
} | {
    kind: "skip";
    daemon: DaemonInfo;
    reason: string;
};
/**
 * Decide what to do with each discovered daemon (pure, no side effects). Reap
 * targets only clearly-safe daemons: orphaned socket files (including a stale
 * default daemon.sock with no live process), and reachable idle daemons on
 * non-default sockets. A reachable default daemon, and any reachable daemon with
 * live sessions, are never touched.
 *
 * Unreachable (hung) daemons can't report a session count, so they are only
 * ever killed with `force`, and even then never via a pid that backs more than
 * one discovered daemon (e.g. macOS lsof reports every unix socket a process
 * holds, so killing a shared pid could take down a reachable daemon with live
 * sessions). runReap additionally re-probes a kill candidate immediately before
 * the SIGTERM and backs off to the session-aware paths if it has since become
 * reachable, so a daemon that recovered with live sessions is never killed.
 */
export declare function planReap(daemons: readonly DaemonInfo[], force: boolean): ReapAction[];
export declare function planShutdownAll(daemons: readonly DaemonInfo[], force: boolean): ReapAction[];
export type ShutdownConfirmationPlan = "none" | "prompt" | "json-error" | "tty-error";
export declare function planShutdownConfirmation(daemonCount: number, json: boolean, force: boolean, stdinIsTTY: boolean | undefined): ShutdownConfirmationPlan;
export declare function runShutdownAll(json: boolean, force: boolean): Promise<void>;
export declare function isWorkerSocketPath(socketPath: string): boolean;
export declare function runReap(json: boolean, force: boolean): Promise<void>;
//# sourceMappingURL=daemon-ps.d.ts.map
/**
 * Shared confirmation for stopping a running daemon that has live sessions.
 *
 * Both `prime-agent update --self` and interactive startup (when taking over a
 * stale-version daemon) need to ask before discarding busy sessions. They keep
 * the same busy-session semantics here and only vary the wording via `copy`.
 *
 * Kept out of daemon-launch.ts so the early fire-and-forget launch path stays
 * light on imports (no readline/chalk); this module is only reached on the
 * interactive, post-startup paths.
 */
import { type RunningDaemonProbe } from "./daemon-launch.js";
/** Prompt for a yes/no answer at a TTY. Empty/anything-but-yes resolves false (default No). */
export declare function promptYesNo(message: string): Promise<boolean>;
export declare function pluralizeSessions(count: number): {
    noun: string;
    pronoun: string;
};
export interface DaemonSessionLossCopy {
    /** Full sentence describing the busy sessions and what stopping the daemon does. */
    busyDetail(count: number): string;
    /** Full sentence for the reachable-but-unlistable case (work may be lost). */
    unlistableDetail: string;
    /** Question appended after the detail when prompting at a TTY (before " [y/N]"). */
    question: string;
    /** Remediation appended after the detail when not at a TTY. */
    nonTtyHint: string;
}
/**
 * Returns true when it is safe to proceed with stopping the daemon: it is not
 * reachable, `force` is set, no sessions are busy, or the user confirmed at a
 * TTY. Returns false to abort (busy/unlistable and either declined or non-TTY).
 * Only busy sessions (streaming, compacting, running bash, or pending messages)
 * require confirmation; idle loaded sessions are restored from disk.
 */
export declare function confirmDaemonSessionLoss(probe: RunningDaemonProbe, options: {
    force: boolean;
    copy: DaemonSessionLossCopy;
}): Promise<boolean>;
//# sourceMappingURL=daemon-stop-confirm.d.ts.map
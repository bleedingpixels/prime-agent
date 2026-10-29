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
import { createInterface } from "node:readline";
import chalk from "chalk";
import { isSessionBusy } from "./daemon-launch.js";
/** Prompt for a yes/no answer at a TTY. Empty/anything-but-yes resolves false (default No). */
export function promptYesNo(message) {
    return new Promise((resolve) => {
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        rl.question(`${message} [y/N] `, (answer) => {
            rl.close();
            const normalized = answer.trim().toLowerCase();
            resolve(normalized === "y" || normalized === "yes");
        });
    });
}
export function pluralizeSessions(count) {
    return count === 1 ? { noun: "session", pronoun: "it" } : { noun: "sessions", pronoun: "them" };
}
/**
 * Returns true when it is safe to proceed with stopping the daemon: it is not
 * reachable, `force` is set, no sessions are busy, or the user confirmed at a
 * TTY. Returns false to abort (busy/unlistable and either declined or non-TTY).
 * Only busy sessions (streaming, compacting, running bash, or pending messages)
 * require confirmation; idle loaded sessions are restored from disk.
 */
export async function confirmDaemonSessionLoss(probe, options) {
    const { force, copy } = options;
    if (!probe.reachable || force) {
        return true;
    }
    let detail;
    if (probe.activeSessions === undefined) {
        // Reachable but couldn't list sessions: assume work may be lost.
        detail = copy.unlistableDetail;
    }
    else {
        const busySessionCount = probe.activeSessions.filter(isSessionBusy).length + (probe.busyClientOwnedSessionCount ?? 0);
        if (busySessionCount === 0) {
            return true;
        }
        detail = copy.busyDetail(busySessionCount);
    }
    if (!process.stdin.isTTY) {
        console.error(chalk.red(`${detail} ${copy.nonTtyHint}`));
        return false;
    }
    return promptYesNo(`${detail} ${copy.question}`);
}
//# sourceMappingURL=daemon-stop-confirm.js.map
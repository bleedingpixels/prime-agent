/**
 * Post-exit hint telling the user how to resume the session they just left.
 */
import type { SessionStats } from "../../core/session-stats.js";
export type ResumeHintStats = Pick<SessionStats, "sessionId" | "sessionFile" | "userMessages">;
/**
 * Format the resume hint printed to stdout after the TUI exits.
 *
 * Returns undefined when there is nothing to resume: ephemeral sessions
 * (--no-session) have no session file, and sessions without any user
 * messages may never have been flushed to disk.
 */
export declare function formatResumeHint(stats: ResumeHintStats | undefined): string | undefined;
//# sourceMappingURL=resume-hint.d.ts.map
/**
 * Global, environment-scoped startup notices (app update, extension updates, tmux setup).
 *
 * These are not tied to any single conversation, so they are surfaced on the agents
 * view rather than appended to a session's chat stream. The checks and styled
 * formatters live here so both the agents view and the interactive fallback render
 * identical wording.
 */
import type { SettingsManager } from "../../core/settings-manager.js";
export interface StartupNotices {
    /** Newer Prime Agent version available, if any. */
    newVersion?: string;
    /** Display names of extensions with available updates. */
    packageUpdates: string[];
    /** tmux keyboard setup warning, if the current tmux config is suboptimal. */
    tmuxWarning?: string;
}
export interface StartupNoticeCheckOptions {
    version: string;
    cwd: string;
    agentDir: string;
    settingsManager: SettingsManager;
}
/** Run every startup check in parallel and collect the results. */
export declare function gatherStartupNotices(options: StartupNoticeCheckOptions): Promise<StartupNotices>;
export declare function checkForPackageUpdates(options: {
    cwd: string;
    agentDir: string;
    settingsManager: SettingsManager;
}): Promise<string[]>;
export declare function checkTmuxKeyboardSetup(): Promise<string | undefined>;
export declare function formatUpdateAvailableNotice(newVersion: string): string;
export declare function formatPackageUpdateNotice(packages: string[]): string;
export declare function formatTmuxWarningNotice(message: string): string;
//# sourceMappingURL=startup-notices.d.ts.map
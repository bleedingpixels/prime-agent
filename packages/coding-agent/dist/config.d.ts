/**
 * Detect if we're running as a Bun compiled binary.
 * Bun binaries have import.meta.url containing "$bunfs", "~BUN", or "%7EBUN" (Bun's virtual filesystem path)
 */
export declare const isBunBinary: boolean;
/** Detect if Bun is the runtime (compiled binary or bun run) */
export declare const isBunRuntime: boolean;
export declare const SELF_UPDATE_INTERACTIVE_CHILD_ENV = "PRIME_AGENT_INTERACTIVE_SELF_UPDATE";
export declare const SELF_UPDATE_NOT_ATTEMPTED_EXIT_CODE = 75;
export type InstallMethod = "bun-binary" | "homebrew" | "npm" | "pnpm" | "yarn" | "bun" | "unknown";
interface SelfUpdateCommandStep {
    command: string;
    args: string[];
    display: string;
}
export interface SelfUpdateCommand extends SelfUpdateCommandStep {
    steps?: SelfUpdateCommandStep[];
}
export declare function detectInstallMethod(): InstallMethod;
export declare function getSelfUpdateCommand(packageName: string, npmCommand?: string[], updateSpec?: string, updatePackageName?: string): SelfUpdateCommand | undefined;
export declare function getSelfUpdateUnavailableInstruction(packageName: string, npmCommand?: string[], updateSpec?: string, updatePackageName?: string): string;
export declare function getUpdateInstruction(packageName: string): string;
/**
 * Get the base directory for resolving package assets (themes, package.json, README.md, CHANGELOG.md).
 * - For Bun binary: returns the directory containing the executable
 * - For Node.js (dist/): returns __dirname (the dist/ directory)
 * - For tsx (src/): returns parent directory (the package root)
 */
export declare function getPackageDir(): string;
/**
 * Get path to built-in themes directory (shipped with package)
 * - For Bun binary: theme/ next to executable
 * - For Node.js (dist/): dist/modes/interactive/theme/
 * - For tsx (src/): src/modes/interactive/theme/
 */
export declare function getThemesDir(): string;
/**
 * Get path to HTML export template directory (shipped with package)
 * - For Bun binary: export-html/ next to executable
 * - For Node.js (dist/): dist/core/export-html/
 * - For tsx (src/): src/core/export-html/
 */
export declare function getExportTemplateDir(): string;
/** Get path to package.json */
export declare function getPackageJsonPath(): string;
/** Get path to README.md */
export declare function getReadmePath(): string;
/** Get path to docs directory */
export declare function getDocsPath(): string;
/** Get path to examples directory */
export declare function getExamplesPath(): string;
/** Get path to CHANGELOG.md */
export declare function getChangelogPath(): string;
/**
 * Get path to built-in interactive assets directory.
 * - For Bun binary: assets/ next to executable
 * - For Node.js (dist/): dist/modes/interactive/assets/
 * - For tsx (src/): src/modes/interactive/assets/
 */
export declare function getInteractiveAssetsDir(): string;
/** Get path to a bundled interactive asset */
export declare function getBundledInteractiveAssetPath(name: string): string;
/**
 * Get the directory containing built-in skills shipped with the package.
 * - For Bun binary: skills/ next to executable
 * - For Node.js (dist/): dist/skills/
 * - For tsx (src/): skills/ at the package root
 */
export declare function getBundledSkillsDir(): string;
export declare const PACKAGE_NAME: string;
export declare const APP_NAME: string;
export declare const APP_TITLE: string;
export declare const CONFIG_DIR_NAME: string;
export declare const VERSION: string;
export declare const ENV_AGENT_DIR: string;
export declare const ENV_SESSION_DIR: string;
export declare const ENV_LEGACY_SESSION_DIR: string;
export declare function expandTildePath(path: string): string;
/** Get the share viewer URL for a gist ID */
export declare function getShareViewerUrl(gistId: string): string;
/** Get the agent config directory (e.g., ~/.prime/agent/) */
export declare function getAgentDir(): string;
/** Get path to user's custom themes directory */
export declare function getCustomThemesDir(): string;
/** Directory where daemon and client diagnostic logs are written (e.g. ~/.prime/agent/logs/). */
export declare function getLogsDir(): string;
/** Log file capturing client-side agent-open failures. */
export declare function getClientErrorLogPath(): string;
export declare function getAgentTracesLogPath(): string;
/** Shared structured (JSON lines) log for client, daemon, and provider diagnostics. */
export declare function getAgentLogPath(): string;
/**
 * Log file for a daemon. The basename keeps it readable; a hash of the full
 * socket path makes it unique so two sockets that share a basename (e.g.
 * daemon.sock in different dirs) don't interleave into one file.
 */
export declare function getDaemonLogPath(socketPath: string): string;
export declare function getDaemonUpdateRestartManifestPath(socketPath: string, agentDir?: string): string;
export declare function getLegacyDaemonUpdateRestartManifestPath(agentDir?: string): string;
/**
 * Append a line to a log file, keeping its size bounded with a single-generation
 * rotation. Opens and closes per call (no held fd), so rotation works at runtime
 * — a long-lived writer rotates on the write that crosses the cap, not only at
 * startup. Best-effort: diagnostics must never throw into the caller.
 */
export declare function appendRotatingLog(logPath: string, message: string, maxBytes?: number): void;
/** Get path to models.json */
export declare function getModelsPath(): string;
/** Get path to auth.json */
export declare function getAuthPath(): string;
/** Get path to settings.json */
export declare function getSettingsPath(): string;
/** Get path to cron jobs store */
export declare function getCronJobsPath(agentDir?: string): string;
/** Get path to tools directory */
export declare function getToolsDir(): string;
/** Get path to managed binaries directory (fd, rg) */
export declare function getBinDir(): string;
/** Get path to prompt templates directory */
export declare function getPromptsDir(): string;
/** Get path to sessions directory */
export declare function getSessionsDir(agentDir?: string): string;
export declare function getSessionDirEnvOverride(): string | undefined;
/** Get path to debug log file */
export declare function getDebugLogPath(): string;
export {};
//# sourceMappingURL=config.d.ts.map
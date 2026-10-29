/**
 * One-time migrations that run on startup.
 */
/**
 * Migrate legacy oauth.json and settings.json apiKeys to auth.json.
 *
 * @returns Array of provider names that were migrated
 */
export declare function migrateAuthToAuthJson(): string[];
/**
 * Migrate sessions from ~/.pi/agent/*.jsonl to the session root.
 *
 * Bug in v0.30.0: Sessions were saved to ~/.pi/agent/ instead of
 * ~/.pi/agent/sessions/. This migration moves them to the configured
 * session root.
 *
 * See: https://github.com/earendil-works/pi-mono/issues/320
 */
export declare function migrateSessionsFromAgentRoot(): void;
/**
 * Migrate legacy per-cwd session directories into the flat session root.
 *
 * Older versions stored sessions under ~/.prime/agent/sessions/--cwd--/*.jsonl.
 * The daemon list/continue paths now scan the flat session root, so move any
 * existing nested JSONL session files up one level.
 */
export declare function migrateLegacySessionDirsToSessionRoot(): void;
/**
 * Print deprecation warnings and wait for keypress.
 */
export declare function showDeprecationWarnings(warnings: string[]): Promise<void>;
/**
 * Run all migrations. Called once on startup.
 *
 * @returns Object with migration results and deprecation warnings
 */
export declare function runMigrations(cwd: string): {
    migratedAuthProviders: string[];
    deprecationWarnings: string[];
};
//# sourceMappingURL=migrations.d.ts.map
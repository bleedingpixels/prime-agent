/** Re-filter client-sent env to the allowlist; the socket peer is untrusted. */
export declare function filterClientEnv(env?: Record<string, string>): Record<string, string> | undefined;
/**
 * Exec env for a session's subprocesses: pins every allowlisted key to the
 * session's value (unset when the client didn't send it), or to the daemon's
 * startup value for env-less sessions. Pinning makes subprocess env
 * independent of any env window another session has open at spawn time.
 */
export declare function execEnvForSession(clientEnv?: Record<string, string>): Record<string, string | undefined>;
/**
 * Run fn with the client's env applied to process.env, restoring afterwards.
 * Extensions capture vars like HERDR_PANE_ID synchronously at module load, so
 * they must be in process.env while the session loads its extensions; after
 * this window the session's exec env covers subprocess reads.
 */
export declare function withClientEnv<T>(env: Record<string, string> | undefined, fn: () => Promise<T>): Promise<T>;
//# sourceMappingURL=daemon-client-env.d.ts.map
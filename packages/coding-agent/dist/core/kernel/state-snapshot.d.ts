/** Default ceiling on a snapshot payload. Over-cap variables are skipped + reported. */
export declare const DEFAULT_SNAPSHOT_MAX_BYTES: number;
export interface SnapshotResult {
    /** Top-level names successfully serialized into the payload. */
    saved: string[];
    /** Names that could not be serialized, with a short reason. */
    skipped: {
        name: string;
        reason: string;
    }[];
    /** Payload size on disk, in bytes. */
    bytes: number;
    path: string;
}
export interface RestoreResult {
    /** Names successfully revived into the kernel namespace. */
    restored: string[];
    /** Names present in the snapshot that failed to revive, with a short reason. */
    failed: {
        name: string;
        reason: string;
    }[];
    path: string;
}
/** Absolute path to the dill payload within a session's artifact directory. */
export declare function snapshotPathIn(artifactDir: string): string;
/** Absolute path to the JSON manifest within a session's artifact directory. */
export declare function manifestPathIn(artifactDir: string): string;
/**
 * Python that serializes the user namespace to `outPath` (atomic write) and a
 * sibling `.json` manifest, then prints a single marker line with the result.
 */
export declare function buildSnapshotCode(outPath: string, manifestPath: string, maxBytes: number): string;
/**
 * Python that loads the payload at `inPath` (if present) into the user namespace,
 * reviving each name independently, then prints a single marker line with the result.
 * Tolerant of a missing or corrupt file: reports an empty restore, never raises.
 */
export declare function buildRestoreCode(inPath: string): string;
/** Marker-line list of live user-defined names, filtered like the snapshot. Never raises. */
export declare function buildListNamesCode(): string;
export declare function parseSnapshotResult(stdout: string, path: string): SnapshotResult | null;
export declare function parseRestoreResult(stdout: string, path: string): RestoreResult | null;
/** Sorted list of live user-defined names, or null if the marker was absent/invalid. */
export declare function parseListNamesResult(stdout: string): string[] | null;
//# sourceMappingURL=state-snapshot.d.ts.map
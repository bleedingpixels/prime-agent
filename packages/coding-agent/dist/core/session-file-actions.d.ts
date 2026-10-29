export type DeleteSessionFileResult = {
    ok: true;
    method: "trash" | "unlink";
} | {
    ok: false;
    error: string;
};
export interface DeleteSessionFileOptions {
    afterFileRemoved?: () => void;
}
/**
 * Delete a session file, trying the `trash` CLI first, then falling back to unlink.
 * Also permanently removes the session's artifact directory, but only
 * once the session file itself is gone — otherwise a failed delete would orphan a
 * session whose kernel snapshot has already been destroyed.
 */
export declare function deleteSessionFile(sessionPath: string, options?: DeleteSessionFileOptions): Promise<DeleteSessionFileResult>;
//# sourceMappingURL=session-file-actions.d.ts.map
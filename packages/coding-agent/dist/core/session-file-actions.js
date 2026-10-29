import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { rm, unlink } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
/**
 * Permanently remove a session's artifact directory (durable schedule state,
 * kernel snapshot, RLM scratch files, …), which lives at
 * `<dirname(sessionDir)>/session-artifacts/<id>`.
 * Only invoked on delete, never on deactivation.
 */
async function deleteSessionArtifacts(sessionPath) {
    const sessionId = basename(sessionPath).replace(/\.jsonl$/, "");
    if (!sessionId)
        return;
    const artifactDir = join(dirname(dirname(sessionPath)), "session-artifacts", sessionId);
    await rm(artifactDir, { recursive: true, force: true });
}
/** Remove the session `.jsonl`, trying the `trash` CLI first, then falling back to unlink. */
async function removeSessionFile(sessionPath) {
    const trashArgs = sessionPath.startsWith("-") ? ["--", sessionPath] : [sessionPath];
    const trashResult = spawnSync("trash", trashArgs, { encoding: "utf-8" });
    const getTrashErrorHint = () => {
        const parts = [];
        if (trashResult.error) {
            parts.push(trashResult.error.message);
        }
        const stderr = trashResult.stderr?.trim();
        if (stderr) {
            parts.push(stderr.split("\n")[0] ?? stderr);
        }
        if (parts.length === 0)
            return null;
        return `trash: ${parts.join(" - ").slice(0, 200)}`;
    };
    if (trashResult.status === 0 || !existsSync(sessionPath)) {
        return { ok: true, method: "trash" };
    }
    try {
        await unlink(sessionPath);
        return { ok: true, method: "unlink" };
    }
    catch (err) {
        const unlinkError = err instanceof Error ? err.message : String(err);
        const trashErrorHint = getTrashErrorHint();
        const error = trashErrorHint ? `${unlinkError} (${trashErrorHint})` : unlinkError;
        return { ok: false, error };
    }
}
/**
 * Delete a session file, trying the `trash` CLI first, then falling back to unlink.
 * Also permanently removes the session's artifact directory, but only
 * once the session file itself is gone — otherwise a failed delete would orphan a
 * session whose kernel snapshot has already been destroyed.
 */
export async function deleteSessionFile(sessionPath, options = {}) {
    const result = await removeSessionFile(sessionPath);
    if (result.ok) {
        options.afterFileRemoved?.();
        await deleteSessionArtifacts(sessionPath);
    }
    return result;
}
//# sourceMappingURL=session-file-actions.js.map
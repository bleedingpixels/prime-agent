import { closeSync, fsyncSync, openSync, readFileSync, rmSync, writeSync } from "node:fs";
import { getProcessStartId } from "./session-lease.js";
export const ORPHAN_PROCESS_JOURNAL_ENV = "PRIME_AGENT_INTERNAL_ORPHAN_PROCESS_JOURNAL";
export function recordOrphanProcessState(pid, active) {
    const path = process.env[ORPHAN_PROCESS_JOURNAL_ENV];
    if (!path || !Number.isInteger(pid) || pid <= 0) {
        return;
    }
    const processStartId = active ? getProcessStartId(pid) : undefined;
    const record = {
        version: 1,
        pid,
        ownerPid: process.pid,
        ...(processStartId ? { processStartId } : {}),
        active,
        recordedAt: new Date().toISOString(),
    };
    try {
        const descriptor = openSync(path, "a", 0o600);
        try {
            writeSync(descriptor, `${JSON.stringify(record)}\n`);
            fsyncSync(descriptor);
        }
        finally {
            closeSync(descriptor);
        }
    }
    catch {
        // Process tracking must not make a successfully spawned command fail.
    }
}
export function readActiveOrphanProcesses(path, ownerPid) {
    let contents;
    try {
        contents = readFileSync(path, "utf8");
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }
        throw error;
    }
    const latest = new Map();
    for (const line of contents.split("\n")) {
        if (!line) {
            continue;
        }
        try {
            const record = JSON.parse(line);
            if (record.version === 1 &&
                Number.isInteger(record.pid) &&
                (record.pid ?? 0) > 0 &&
                record.ownerPid === ownerPid &&
                typeof record.active === "boolean" &&
                typeof record.recordedAt === "string") {
                latest.set(record.pid, record);
            }
        }
        catch {
            // A crash can truncate only the final append.
        }
    }
    return [...latest.values()]
        .filter((record) => record.active && typeof record.processStartId === "string")
        .map((record) => ({ pid: record.pid, processStartId: record.processStartId }));
}
export function isOrphanProcessIdentityCurrent(orphan) {
    return getProcessStartId(orphan.pid) === orphan.processStartId;
}
export function clearOrphanProcessJournal(path) {
    rmSync(path, { force: true });
}
//# sourceMappingURL=orphan-process-journal.js.map
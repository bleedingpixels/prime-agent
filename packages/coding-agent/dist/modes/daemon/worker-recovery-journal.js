import { chmodSync, closeSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync, writeSync, } from "node:fs";
import { dirname } from "node:path";
function parseRecords(path) {
    const latest = new Map();
    let contents;
    try {
        contents = readFileSync(path, "utf8");
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return latest;
        }
        throw error;
    }
    for (const line of contents.split("\n")) {
        if (!line) {
            continue;
        }
        let record;
        try {
            record = JSON.parse(line);
        }
        catch {
            continue;
        }
        if (record.version === 1 &&
            typeof record.activeSessionId === "string" &&
            typeof record.sessionId === "string" &&
            typeof record.busy === "boolean" &&
            typeof record.operation === "string") {
            latest.set(record.activeSessionId, record);
        }
    }
    return latest;
}
export class WorkerRecoveryJournal {
    path;
    latest;
    constructor(path) {
        this.path = path;
        mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
        this.latest = parseRecords(path);
    }
    record(input) {
        const previous = this.latest.get(input.activeSessionId);
        if (previous?.busy === input.busy &&
            previous.operation === input.operation &&
            previous.sessionFile === input.sessionFile) {
            return;
        }
        const record = {
            version: 1,
            ...input,
            recordedAt: new Date().toISOString(),
        };
        this.append(record);
        this.latest.set(record.activeSessionId, record);
        if ([...this.latest.values()].every((entry) => !entry.busy)) {
            this.compact();
        }
    }
    getLatest() {
        return [...this.latest.values()];
    }
    static readLatest(path) {
        return [...parseRecords(path).values()];
    }
    append(record) {
        const descriptor = openSync(this.path, "a", 0o600);
        try {
            writeSync(descriptor, `${JSON.stringify(record)}\n`);
            fsyncSync(descriptor);
        }
        finally {
            closeSync(descriptor);
        }
        chmodSync(this.path, 0o600);
    }
    compact() {
        const tempPath = `${this.path}.${process.pid}.tmp`;
        writeFileSync(tempPath, `${[...this.latest.values()].map((record) => JSON.stringify(record)).join("\n")}\n`, {
            mode: 0o600,
        });
        chmodSync(tempPath, 0o600);
        renameSync(tempPath, this.path);
    }
}
//# sourceMappingURL=worker-recovery-journal.js.map
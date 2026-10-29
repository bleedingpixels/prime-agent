import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { lockSync } from "proper-lockfile";
export const SESSION_LEASES_ENABLED_ENV = "PRIME_AGENT_INTERNAL_SESSION_LEASES";
export const SESSION_LEASE_OWNER_ID_ENV = "PRIME_AGENT_INTERNAL_SESSION_LEASE_OWNER_ID";
export class SessionAlreadyActiveError extends Error {
    sessionPath;
    activeSessionId;
    code = "session_already_active";
    constructor(sessionPath, activeSessionId) {
        super(activeSessionId
            ? `Session is already active in ${activeSessionId}: ${sessionPath}`
            : `Session is already active in another process: ${sessionPath}`);
        this.sessionPath = sessionPath;
        this.activeSessionId = activeSessionId;
        this.name = "SessionAlreadyActiveError";
    }
}
export class SessionLease {
    sessionPath;
    directory;
    token;
    released = false;
    constructor(sessionPath, directory, token) {
        this.sessionPath = sessionPath;
        this.directory = directory;
        this.token = token;
    }
    release() {
        if (this.released) {
            return;
        }
        this.released = true;
        try {
            withLeaseGuard(this.directory, () => {
                const owner = readLeaseOwner(this.directory);
                if (owner?.token === this.token) {
                    rmSync(this.directory, { recursive: true, force: true });
                }
            });
        }
        catch {
            // Lease cleanup is best-effort. A stale owner is reclaimed by the next process.
        }
    }
}
function leasesEnabled(environment) {
    const value = environment[SESSION_LEASES_ENABLED_ENV]?.toLowerCase();
    return value === "1" || value === "true" || value === "yes";
}
function leaseDirectory(agentDir, sessionPath) {
    const key = createHash("sha256").update(sessionPath).digest("hex");
    return join(agentDir, "session-leases", `${key}.lock`);
}
export function canonicalSessionPath(sessionPath) {
    const resolvedPath = resolve(sessionPath);
    try {
        return realpathSync(resolvedPath);
    }
    catch {
        try {
            return join(realpathSync(dirname(resolvedPath)), basename(resolvedPath));
        }
        catch {
            return resolvedPath;
        }
    }
}
function readLeaseOwner(directory) {
    try {
        const parsed = JSON.parse(readFileSync(join(directory, "owner.json"), "utf8"));
        if (parsed.version !== 1 ||
            typeof parsed.token !== "string" ||
            typeof parsed.pid !== "number" ||
            typeof parsed.sessionPath !== "string" ||
            typeof parsed.createdAt !== "string") {
            return undefined;
        }
        return parsed;
    }
    catch {
        return undefined;
    }
}
function isProcessAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    }
    catch (error) {
        return error.code === "EPERM";
    }
}
function runProcessQuery(command, args) {
    return execFileSync(command, args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
    });
}
export function getWindowsProcessStartId(pid, query = runProcessQuery) {
    if (!Number.isInteger(pid) || pid <= 0) {
        return undefined;
    }
    try {
        const startTicks = query("powershell.exe", [
            "-NoLogo",
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            `([System.Diagnostics.Process]::GetProcessById(${pid})).StartTime.ToUniversalTime().Ticks`,
        ]).trim();
        return /^\d+$/.test(startTicks) ? `win:${startTicks}` : undefined;
    }
    catch {
        return undefined;
    }
}
export function getProcessStartId(pid) {
    if (!Number.isInteger(pid) || pid <= 0) {
        return undefined;
    }
    if (process.platform === "win32") {
        return getWindowsProcessStartId(pid);
    }
    try {
        const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
        const commandEnd = stat.lastIndexOf(")");
        const fields = stat.slice(commandEnd + 2).split(" ");
        const startTime = fields[19];
        if (startTime) {
            return `proc:${startTime}`;
        }
    }
    catch {
        // Fall through to the portable process listing used on macOS and BSD.
    }
    try {
        const startTime = runProcessQuery("ps", ["-p", String(pid), "-o", "lstart="]).trim();
        return startTime ? `ps:${startTime}` : undefined;
    }
    catch {
        return undefined;
    }
}
let currentProcessStartId;
let currentProcessStartIdRead = false;
function getCurrentProcessStartId() {
    if (!currentProcessStartIdRead) {
        currentProcessStartId = getProcessStartId(process.pid);
        currentProcessStartIdRead = true;
    }
    return currentProcessStartId;
}
function isLeaseOwnerAlive(owner) {
    if (!isProcessAlive(owner.pid)) {
        return false;
    }
    if (!owner.processStartId) {
        return true;
    }
    const currentStartId = getProcessStartId(owner.pid);
    return currentStartId === undefined || currentStartId === owner.processStartId;
}
function withLeaseGuard(directory, action) {
    let release;
    for (let attempt = 0; attempt < 100; attempt++) {
        try {
            release = lockSync(directory, {
                realpath: false,
                lockfilePath: `${directory}.guard`,
                stale: 5000,
            });
            break;
        }
        catch (error) {
            if (error.code !== "ELOCKED") {
                throw error;
            }
            if (attempt === 99) {
                throw new Error(`Could not coordinate session lease: ${directory}`);
            }
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
        }
    }
    if (!release) {
        throw new Error(`Could not coordinate session lease: ${directory}`);
    }
    try {
        return action();
    }
    finally {
        release();
    }
}
function reclaimStaleLease(directory) {
    const stalePath = `${directory}.stale-${process.pid}-${randomUUID()}`;
    try {
        renameSync(directory, stalePath);
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return true;
        }
        return false;
    }
    rmSync(stalePath, { recursive: true, force: true });
    return true;
}
export function acquireSessionLease(sessionPath, agentDir, environment = process.env) {
    if (!sessionPath || !leasesEnabled(environment)) {
        return undefined;
    }
    const canonicalPath = canonicalSessionPath(sessionPath);
    const root = join(agentDir, "session-leases");
    mkdirSync(root, { recursive: true, mode: 0o700 });
    const directory = leaseDirectory(agentDir, canonicalPath);
    return withLeaseGuard(directory, () => {
        for (let attempt = 0; attempt < 3; attempt++) {
            const token = randomUUID();
            const candidateDirectory = `${directory}.candidate-${process.pid}-${token}`;
            const owner = {
                version: 1,
                token,
                pid: process.pid,
                processStartId: getCurrentProcessStartId(),
                activeSessionId: environment[SESSION_LEASE_OWNER_ID_ENV],
                sessionPath: canonicalPath,
                createdAt: new Date().toISOString(),
            };
            mkdirSync(candidateDirectory, { mode: 0o700 });
            writeFileSync(join(candidateDirectory, "owner.json"), `${JSON.stringify(owner, null, 2)}\n`, {
                mode: 0o600,
            });
            try {
                renameSync(candidateDirectory, directory);
                return new SessionLease(canonicalPath, directory, token);
            }
            catch (error) {
                rmSync(candidateDirectory, { recursive: true, force: true });
                const code = error.code;
                if (code !== "EEXIST" && code !== "ENOTEMPTY") {
                    throw error;
                }
                const existingOwner = readLeaseOwner(directory);
                if (existingOwner && isLeaseOwnerAlive(existingOwner)) {
                    throw new SessionAlreadyActiveError(canonicalPath, existingOwner.activeSessionId);
                }
                reclaimStaleLease(directory);
            }
        }
        const owner = existsSync(directory) ? readLeaseOwner(directory) : undefined;
        if (owner && isLeaseOwnerAlive(owner)) {
            throw new SessionAlreadyActiveError(canonicalPath, owner.activeSessionId);
        }
        throw new Error(`Could not acquire session lease: ${canonicalPath}`);
    });
}
//# sourceMappingURL=session-lease.js.map
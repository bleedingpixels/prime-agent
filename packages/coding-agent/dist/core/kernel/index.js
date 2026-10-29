// TODO: reconsider persistent kernel vs stateless `python -c` once RLM-1 weights land.
import { spawn } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { registerSessionResourceCleanup } from "@earendil-works/pi-ai";
import { v4 as uuid } from "uuid";
import { Dealer, Subscriber } from "zeromq";
import { ensureKernelPython } from "./bootstrap.js";
import { ForkServerUnavailable, forkKernel, isForkServerEnabled } from "./fork-server.js";
import { buildListNamesCode, buildRestoreCode, buildSnapshotCode, DEFAULT_SNAPSHOT_MAX_BYTES, parseListNamesResult, parseRestoreResult, parseSnapshotResult, } from "./state-snapshot.js";
const DELIM = Buffer.from("<IDS|MSG>");
const PROTOCOL_VERSION = "5.3";
const PORTS_RESOLVE_TIMEOUT_MS = 5000;
const READY_TIMEOUT_MS = 5000;
// Loopback PUB/SUB subscription propagation is usually sub-ms, but keep a small guard before first execute.
const IOPUB_SUBSCRIBE_DELAY_MS = 50;
const DEFAULT_MAX_OUTPUT_CHARS = 65536;
const HOST_REQUEST_DISPOSE_TIMEOUT_MS = 5000;
const DEFAULT_SNAPSHOT_DEBOUNCE_MS = 1500;
// How often to poll a forked kernel's pid for unexpected death.
const FORKED_LIVENESS_POLL_MS = 1000;
// Snapshot/restore cells can be large to (de)serialize; give them room beyond the user cap.
const SNAPSHOT_MAX_OUTPUT_CHARS = 1_000_000;
// Cap how long a graceful dispose waits on the final snapshot; the debounced
// on-disk copy is the fallback if this is exceeded.
const SNAPSHOT_DISPOSE_TIMEOUT_MS = 5000;
const KERNEL_ABORT_GRACE_MS = 1000;
const KERNEL_BUSY_REUSE_WAIT_MS = 5000;
const KERNEL_BUSY_INTERRUPT_INTERVAL_MS = 500;
const MAX_LATE_SENT_AGENT_MESSAGE_HANDLERS = 256;
const KERNEL_BUSY_AFTER_INTERRUPT_MESSAGE = "IPython kernel is still running the previously interrupted cell. Wait and try again, or kill the IPython kernel to start fresh.";
export class KernelBusyAfterInterruptError extends Error {
    constructor() {
        super(KERNEL_BUSY_AFTER_INTERRUPT_MESSAGE);
        this.name = "KernelBusyAfterInterruptError";
    }
}
/** Comm target the kernel-side `rlm.host_request` shim opens for typed host requests. */
export const HOST_COMM_TARGET = "host.request";
/** MIME tag the `edit` skill emits diff payloads under, via `display_data`. */
export const DIFF_DISPLAY_MIME = "application/vnd.prime-agent.diff+json";
/** MIME tag the `attach-image` skill emits media payloads under, via `display_data`. */
export const ATTACHMENT_DISPLAY_MIME = "application/vnd.prime-agent.attachment+json";
/** MIME tag the `agent-message` skill emits after sending a message. */
export const AGENT_MESSAGE_DISPLAY_MIME = "application/vnd.prime-agent.agent-message+json";
/**
 * Hard ceiling on a single attachment's base64 payload, a defensive guard
 * against a runaway direct `display_data` emit. The `attach-image` skill caps
 * its own images well under this (see `_MAX_IMAGE_BYTES`), so a skill-produced
 * attachment is never dropped here — only a non-skill emit can hit this.
 */
const MAX_ATTACHMENT_DATA_CHARS = 10_000_000;
/** Parse a {@link DIFF_DISPLAY_MIME} payload, tolerating malformed input. */
function parseDiffDisplay(payload) {
    if (!isRecord(payload)) {
        return undefined;
    }
    const { path, old_str: oldStr, new_str: newStr, start_line: startLine } = payload;
    if (typeof path !== "string" || typeof oldStr !== "string" || typeof newStr !== "string") {
        return undefined;
    }
    return { path, oldStr, newStr, startLine: typeof startLine === "number" ? startLine : undefined };
}
/**
 * Parse an {@link ATTACHMENT_DISPLAY_MIME} payload. Malformed payloads are
 * tolerantly ignored (`undefined`); a well-formed payload exceeding
 * {@link MAX_ATTACHMENT_DATA_CHARS} is reported as `"oversized"` so the caller
 * can fail the cell loudly rather than silently dropping the image.
 */
function parseAttachmentDisplay(payload) {
    if (!isRecord(payload)) {
        return undefined;
    }
    const { mime_type: mimeType, data, path } = payload;
    if (typeof mimeType !== "string" || typeof data !== "string") {
        return undefined;
    }
    if (data.length > MAX_ATTACHMENT_DATA_CHARS) {
        return "oversized";
    }
    return { mimeType, data, path: typeof path === "string" ? path : undefined };
}
function parseSentAgentMessage(payload) {
    if (!isRecord(payload) || !isRecord(payload.target)) {
        return undefined;
    }
    const { id, message, deliveryStatus, receiverRole, target } = payload;
    const { activeSessionId, sessionId, sessionName } = target;
    if (typeof id !== "string" ||
        typeof message !== "string" ||
        (deliveryStatus !== "delivered" && deliveryStatus !== "queued") ||
        typeof activeSessionId !== "string" ||
        typeof sessionId !== "string") {
        return undefined;
    }
    return {
        id,
        message,
        deliveryStatus,
        ...(receiverRole === "parent" || receiverRole === "sibling" || receiverRole === "child" ? { receiverRole } : {}),
        target: {
            activeSessionId,
            sessionId,
            ...(typeof sessionName === "string" ? { sessionName } : {}),
        },
    };
}
function createKernelStartupAbortError() {
    return new Error("Kernel startup aborted");
}
function raceStartupWithAbort(promise, signal) {
    if (!signal) {
        return promise;
    }
    if (signal.aborted) {
        return Promise.reject(createKernelStartupAbortError());
    }
    return new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => signal.removeEventListener("abort", abort);
        const abort = () => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            reject(createKernelStartupAbortError());
        };
        signal.addEventListener("abort", abort, { once: true });
        promise.then((value) => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            resolve(value);
        }, (error) => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            reject(error);
        });
    });
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((promiseResolve, promiseReject) => {
        resolve = promiseResolve;
        reject = promiseReject;
    });
    return { promise, resolve, reject };
}
// ---- wire format ---------------------------------------------------------
function buildMessage(msgType, content, session, username) {
    return {
        header: {
            msg_id: uuid(),
            session,
            username,
            date: new Date().toISOString(),
            msg_type: msgType,
            version: PROTOCOL_VERSION,
        },
        parent_header: {},
        metadata: {},
        content,
    };
}
function sign(parts, key) {
    const hmac = createHmac("sha256", key);
    for (const p of parts)
        hmac.update(p);
    return Buffer.from(hmac.digest("hex"));
}
function encode(msg, key) {
    const parts = [
        Buffer.from(JSON.stringify(msg.header)),
        Buffer.from(JSON.stringify(msg.parent_header)),
        Buffer.from(JSON.stringify(msg.metadata)),
        Buffer.from(JSON.stringify(msg.content)),
    ];
    return [DELIM, sign(parts, key), ...parts];
}
function decode(frames) {
    let i = 0;
    while (i < frames.length && !frames[i].equals(DELIM))
        i++;
    if (i + 5 >= frames.length)
        return null;
    try {
        return {
            header: JSON.parse(frames[i + 2].toString()),
            parent_header: JSON.parse(frames[i + 3].toString()),
            metadata: JSON.parse(frames[i + 4].toString()),
            content: JSON.parse(frames[i + 5].toString()),
        };
    }
    catch {
        return null;
    }
}
// ---- connection setup ----------------------------------------------------
const CONNECTION_PORT_KEYS = ["shell_port", "iopub_port", "stdin_port", "control_port", "hb_port"];
function hasResolvedPorts(info) {
    return CONNECTION_PORT_KEYS.every((key) => Number.isInteger(info[key]) && info[key] > 0);
}
function parseConnectionInfo(value) {
    if (!isRecord(value))
        return null;
    if (value.ip !== "127.0.0.1")
        return null;
    if (value.transport !== "tcp")
        return null;
    if (value.signature_scheme !== "hmac-sha256")
        return null;
    if (typeof value.key !== "string")
        return null;
    const shellPort = value.shell_port;
    const iopubPort = value.iopub_port;
    const stdinPort = value.stdin_port;
    const controlPort = value.control_port;
    const hbPort = value.hb_port;
    if (typeof shellPort !== "number" || !Number.isInteger(shellPort))
        return null;
    if (typeof iopubPort !== "number" || !Number.isInteger(iopubPort))
        return null;
    if (typeof stdinPort !== "number" || !Number.isInteger(stdinPort))
        return null;
    if (typeof controlPort !== "number" || !Number.isInteger(controlPort))
        return null;
    if (typeof hbPort !== "number" || !Number.isInteger(hbPort))
        return null;
    const kernelName = typeof value.kernel_name === "string" ? value.kernel_name : "python3";
    return {
        ip: value.ip,
        transport: value.transport,
        shell_port: shellPort,
        iopub_port: iopubPort,
        stdin_port: stdinPort,
        control_port: controlPort,
        hb_port: hbPort,
        signature_scheme: value.signature_scheme,
        key: value.key,
        kernel_name: kernelName,
    };
}
function readConnectionInfo(path) {
    try {
        return parseConnectionInfo(JSON.parse(readFileSync(path, "utf8")));
    }
    catch {
        return null;
    }
}
function makeConnection() {
    const info = {
        ip: "127.0.0.1",
        transport: "tcp",
        shell_port: 0,
        iopub_port: 0,
        stdin_port: 0,
        control_port: 0,
        hb_port: 0,
        signature_scheme: "hmac-sha256",
        key: randomBytes(16).toString("hex"),
        kernel_name: "python3",
    };
    const tempDir = mkdtempSync(join(tmpdir(), "prime-agent-kernel-"));
    const path = join(tempDir, "connection.json");
    writeFileSync(path, JSON.stringify(info, null, 2), { mode: 0o600 });
    return { info, path, tempDir };
}
// ---- process-wide cleanup -----------------------------------------------
const liveKernels = new Set();
let signalHandlersInstalled = false;
registerSessionResourceCleanup((sessionId) => {
    for (const k of liveKernels) {
        if (!sessionId || k.ownerSessionId === sessionId) {
            void k.dispose();
        }
    }
});
function installSignalHandlersOnce() {
    if (signalHandlersInstalled)
        return;
    signalHandlersInstalled = true;
    const asyncShutdown = async () => {
        // These paths can await, so flush the namespace snapshot before tearing down.
        await Promise.allSettled([...liveKernels].map((k) => k.shutdown({ snapshot: true })));
    };
    // `beforeExit` and signal handlers can await async cleanup. `exit`
    // can only do sync work (Node won't run pending microtasks past it),
    // so it falls back to `disposeSync()` which kills the child synchronously.
    process.on("beforeExit", () => {
        void asyncShutdown();
    });
    process.on("SIGINT", () => {
        void asyncShutdown().finally(() => process.exit(130));
    });
    process.on("SIGTERM", () => {
        void asyncShutdown().finally(() => process.exit(143));
    });
    process.on("exit", () => {
        for (const k of liveKernels)
            k.disposeSync();
    });
}
// ---- kernel manager ------------------------------------------------------
export class KernelManager {
    options;
    session = uuid();
    commTargets = new Map();
    handledHostRequestCommIds = new Set();
    kernel;
    // Set instead of `kernel` when the kernel was forked from the forkserver: it is
    // not a direct child, so it has no ChildProcess handle and is killed by pid.
    kernelPid;
    /** Polls a forked kernel's pid for death (no "exit" event on a non-child). */
    forkedLivenessTimer;
    shell;
    iopub;
    control;
    iopubPumpPromise;
    connection;
    tempDir;
    kernelStderr = "";
    /** Serializes execute() calls — Jupyter shell channel is request/reply. */
    executionQueue = Promise.resolve();
    activeExecution;
    activeExecutionIdleWaiters = new Set();
    lateSentAgentMessageHandlers = new Map();
    // Source of the most recently started cell, retained after it finishes so
    // rlm.run spawns from detached asyncio tasks (cell already idle) can still
    // attribute their spawning program.
    lastCellCode;
    inFlightHostRequests = new Set();
    state = "idle";
    /** Memoized so concurrent callers all await the same in-flight startup. */
    startPromise;
    /** Pending debounced auto-snapshot, if one has been scheduled. */
    snapshotTimer;
    constructor(options) {
        this.options = {
            python: options.python,
            cwd: options.cwd,
            env: options.env,
            sessionId: options.sessionId,
            hostHandlers: options.hostHandlers,
            pythonSkills: options.pythonSkills,
            snapshot: options.snapshot,
            username: options.username ?? "prime-agent",
        };
    }
    get ownerSessionId() {
        return this.options.sessionId;
    }
    appendKernelDiagnostic(message) {
        this.kernelStderr += `[kernel] ${message.endsWith("\n") ? message : `${message}\n`}`;
    }
    async start(options = {}) {
        if (options.signal?.aborted) {
            throw createKernelStartupAbortError();
        }
        if (!this.startPromise) {
            this.startPromise = this.doStart({ onBootstrapProgress: options.onBootstrapProgress }).catch((error) => {
                this.startPromise = undefined;
                throw error;
            });
        }
        return raceStartupWithAbort(this.startPromise, options.signal);
    }
    async doStart(startOptions) {
        if (this.state !== "idle")
            return;
        this.state = "starting";
        installSignalHandlersOnce();
        // Tracked from the moment startup begins so session cleanup and signal
        // handlers can dispose a kernel that is still booting.
        liveKernels.add(this);
        let python;
        try {
            python =
                this.options.python ??
                    (await ensureKernelPython({
                        pythonSkills: this.options.pythonSkills,
                        onProgress: startOptions.onBootstrapProgress,
                    }));
            this.options.python = python;
        }
        catch (error) {
            liveKernels.delete(this);
            if (this.state !== "shutdown")
                this.state = "idle";
            throw error;
        }
        if (this.state === "shutdown") {
            throw new Error("Kernel was disposed during startup");
        }
        let connection = makeConnection();
        this.tempDir = connection.tempDir;
        // Fast path: fork a pre-imported kernel from the forkserver. Any failure
        // (disabled, unavailable, fork error) degrades to the direct-spawn path so
        // correctness never depends on fork.
        let forked = false;
        if (isForkServerEnabled()) {
            try {
                this.kernelPid = await forkKernel(python, {
                    connectionPath: connection.path,
                    cwd: this.options.cwd,
                    // Match the direct-spawn env exactly: merge the current host env with
                    // the per-kernel overrides, applied fresh in the child (the template's
                    // inherited env snapshot may be stale by fork time).
                    env: this.options.env ? { ...process.env, ...this.options.env } : { ...process.env },
                });
                forked = true;
            }
            catch (err) {
                if (!(err instanceof ForkServerUnavailable))
                    throw err;
                this.appendKernelDiagnostic(`forkserver unavailable, spawning directly: ${err.message}`);
                this.kernelPid = undefined;
                // A fork request that times out or loses its pid reply may still have
                // forked a child that binds the ports in this connection file. Mint a
                // fresh connection for the direct spawn so a possible orphan can never
                // collide with it (write the same file / re-bind the same ports).
                try {
                    rmSync(connection.tempDir, { recursive: true, force: true });
                }
                catch {
                    // Leave the temp dir for OS tmp cleanup.
                }
                connection = makeConnection();
                this.tempDir = connection.tempDir;
            }
        }
        if (!forked) {
            const kernel = spawn(python, ["-m", "ipykernel_launcher", "-f", connection.path], {
                cwd: this.options.cwd,
                env: this.options.env ? { ...process.env, ...this.options.env } : process.env,
                stdio: ["ignore", "pipe", "pipe"],
            });
            this.kernel = kernel;
            kernel.stderr?.on("data", (buf) => {
                const s = buf.toString();
                this.kernelStderr += s;
            });
            kernel.on("error", (err) => {
                if (this.kernel !== kernel)
                    return;
                this.appendKernelDiagnostic(`spawn error: ${err.message}`);
                this.state = "shutdown";
                liveKernels.delete(this);
                this.cleanupResources();
            });
            kernel.on("exit", (code, signal) => {
                if (this.kernel !== kernel)
                    return;
                if (this.state !== "shutdown") {
                    this.appendKernelDiagnostic(`unexpected exit code=${code} signal=${signal}`);
                }
                this.state = "shutdown";
                liveKernels.delete(this);
                this.cleanupResources();
            });
        }
        const connectionPath = connection.path;
        let conn;
        try {
            conn = await this.waitForResolvedConnection(connectionPath);
            this.connection = conn;
        }
        catch (e) {
            const canRetryStartup = this.state !== "shutdown";
            await this.shutdown();
            if (canRetryStartup)
                this.state = "idle";
            throw e;
        }
        this.shell = new Dealer();
        this.iopub = new Subscriber();
        this.control = new Dealer();
        this.shell.connect(`${conn.transport}://${conn.ip}:${conn.shell_port}`);
        this.iopub.connect(`${conn.transport}://${conn.ip}:${conn.iopub_port}`);
        this.control.connect(`${conn.transport}://${conn.ip}:${conn.control_port}`);
        this.iopub.subscribe("");
        // ZMQ PUB/SUB slow-joiner: give the subscription a brief chance to reach the kernel before first execute.
        await sleep(IOPUB_SUBSCRIBE_DELAY_MS);
        this.startIopubPump();
        try {
            await this.probeReady();
        }
        catch (e) {
            const canRetryStartup = this.state !== "shutdown";
            await this.shutdown();
            if (canRetryStartup)
                this.state = "idle";
            throw e;
        }
        this.state = "running";
        this.startForkedLivenessMonitor();
    }
    // A forked kernel isn't a direct child, so no "exit" fires when it dies. Poll its
    // pid so a mid-run death tears down like the direct-spawn exit handler: mark
    // shutdown, drop from liveKernels, and reject any in-flight execution.
    startForkedLivenessMonitor() {
        if (this.kernelPid === undefined)
            return;
        this.forkedLivenessTimer = globalThis.setInterval(() => {
            if (this.state !== "running")
                return;
            if (!this.forkedKernelDied())
                return;
            this.appendKernelDiagnostic("forked kernel exited unexpectedly");
            this.state = "shutdown";
            liveKernels.delete(this);
            this.cleanupResources();
        }, FORKED_LIVENESS_POLL_MS);
        this.forkedLivenessTimer.unref?.();
    }
    // A forked kernel is not a direct child, so it emits no "exit" event; poll its
    // pid so a dead child fails fast instead of burning the full resolve timeout.
    forkedKernelDied() {
        if (this.kernelPid === undefined)
            return false;
        try {
            process.kill(this.kernelPid, 0);
            return false;
        }
        catch (error) {
            // EPERM means the pid exists but isn't signalable by us — still alive.
            // Only ESRCH (no such process) is genuine death.
            return !(error instanceof Error && error.code === "EPERM");
        }
    }
    async waitForResolvedConnection(connectionPath) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < PORTS_RESOLVE_TIMEOUT_MS) {
            if (this.state === "shutdown" || this.forkedKernelDied()) {
                const tail = this.kernelStderr.slice(-1024);
                throw new Error(`Kernel exited before resolving ports. stderr:\n${tail || "(empty)"}`);
            }
            const info = readConnectionInfo(connectionPath);
            if (info && hasResolvedPorts(info)) {
                return info;
            }
            await sleep(25);
        }
        const tail = this.kernelStderr.slice(-1024);
        throw new Error(`Kernel did not resolve connection ports within ${PORTS_RESOLVE_TIMEOUT_MS}ms. stderr tail:\n${tail || "(empty)"}`);
    }
    async probeReady() {
        const conn = this.connection;
        const shell = this.shell;
        const msg = buildMessage("kernel_info_request", {}, this.session, this.options.username);
        const requestMsgId = msg.header.msg_id;
        await shell.send(encode(msg, conn.key));
        const startedAt = Date.now();
        while (Date.now() - startedAt < READY_TIMEOUT_MS) {
            if (this.state === "shutdown" || this.forkedKernelDied()) {
                const tail = this.kernelStderr.slice(-1024);
                throw new Error(`Kernel exited during startup. stderr:\n${tail || "(empty)"}`);
            }
            const remaining = READY_TIMEOUT_MS - (Date.now() - startedAt);
            const winner = await Promise.race([
                shell.receive().then((frames) => ({ kind: "frames", frames })),
                sleep(remaining).then(() => ({ kind: "timeout" })),
            ]);
            if (winner.kind === "timeout")
                break;
            const incoming = decode(winner.frames);
            if (incoming?.header.msg_type === "kernel_info_reply" &&
                incoming.parent_header.msg_id === requestMsgId) {
                return;
            }
        }
        const tail = this.kernelStderr.slice(-1024);
        throw new Error(`Kernel did not respond to kernel_info_request within ${READY_TIMEOUT_MS}ms. stderr tail:\n${tail || "(empty)"}`);
    }
    async execute(code, opts = {}) {
        const result = await this.enqueueExecute(code, opts);
        // Refresh the on-disk snapshot after real work so a later resume (or a
        // crash before graceful shutdown) revives the most recent namespace.
        if (result.status === "ok") {
            this.scheduleSnapshot();
        }
        return result;
    }
    /** Queue and run a cell, serializing against all other executions. */
    async enqueueExecute(code, opts) {
        if (opts.signal?.aborted) {
            return { stdout: "", stderr: "", status: "aborted", durationMs: 0 };
        }
        await this.start({ signal: opts.signal });
        if (this.state === "shutdown") {
            throw new Error("Kernel has been shut down");
        }
        const prev = this.executionQueue;
        let resolveNext = () => { };
        this.executionQueue = new Promise((r) => {
            resolveNext = r;
        });
        await prev;
        const started = Date.now();
        try {
            await this.waitForActiveExecutionToClearForReuse(opts.signal);
            if (opts.signal?.aborted) {
                return { stdout: "", stderr: "", status: "aborted", durationMs: Date.now() - started };
            }
            if (this.state === "shutdown") {
                throw new Error("Kernel has been shut down");
            }
            return await this.executeInner(code, opts, started);
        }
        finally {
            resolveNext();
        }
    }
    async executeInner(code, opts, started) {
        const conn = this.connection;
        const shell = this.shell;
        const maxChars = opts.maxOutputChars ?? DEFAULT_MAX_OUTPUT_CHARS;
        const msg = buildMessage("execute_request", {
            code,
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
            stop_on_error: true,
        }, this.session, this.options.username);
        const requestMsgId = msg.header.msg_id;
        if (opts.signal?.aborted) {
            return { stdout: "", stderr: "", status: "aborted", durationMs: Date.now() - started };
        }
        if (this.activeExecution) {
            throw new Error("Kernel already has an active execution");
        }
        const result = createDeferred();
        const execution = {
            requestMsgId,
            code,
            started,
            maxChars,
            opts,
            stdout: "",
            stderr: "",
            stdoutTruncated: false,
            stderrTruncated: false,
            diffs: [],
            attachments: [],
            sentAgentMessages: [],
            status: "ok",
            settled: false,
            resolve: result.resolve,
            reject: result.reject,
        };
        let abortTimer;
        const clearAbortTimer = () => {
            if (abortTimer) {
                globalThis.clearTimeout(abortTimer);
                abortTimer = undefined;
            }
        };
        const forceAbort = () => {
            if (this.activeExecution !== execution) {
                return;
            }
            execution.status = "aborted";
            this.resolveExecution(execution, { clearActive: false });
        };
        const onAbort = () => {
            void this.interrupt().catch(() => undefined);
            clearAbortTimer();
            abortTimer = globalThis.setTimeout(forceAbort, KERNEL_ABORT_GRACE_MS);
            if (abortTimer && typeof abortTimer === "object" && "unref" in abortTimer) {
                abortTimer.unref();
            }
        };
        try {
            this.activeExecution = execution;
            opts.signal?.addEventListener("abort", onAbort, { once: true });
            if (opts.signal?.aborted) {
                onAbort();
            }
            if (!opts.internal) {
                this.lastCellCode = code;
            }
            try {
                const sendPromise = shell.send(encode(msg, conn.key));
                sendPromise.catch(() => undefined);
                await Promise.race([sendPromise, result.promise.then(() => undefined)]);
                if (this.activeExecution === execution && execution.status !== "aborted") {
                    await sendPromise;
                }
            }
            catch (error) {
                if (this.activeExecution === execution) {
                    this.activeExecution = undefined;
                }
                throw error instanceof Error ? error : new Error(String(error));
            }
            return await result.promise;
        }
        finally {
            clearAbortTimer();
            opts.signal?.removeEventListener("abort", onAbort);
        }
    }
    startIopubPump() {
        if (this.iopubPumpPromise) {
            return;
        }
        this.iopubPumpPromise = this.runIopubPump();
    }
    async runIopubPump() {
        const iopub = this.iopub;
        if (!iopub) {
            return;
        }
        try {
            for await (const frames of iopub) {
                const incoming = decode(frames);
                if (!incoming)
                    continue;
                const t = incoming.header.msg_type;
                if (t === "comm_open" || t === "comm_msg" || t === "comm_close") {
                    this.handleCommMessage(incoming);
                    continue;
                }
                this.handleExecutionMessage(incoming);
            }
        }
        catch (error) {
            if (this.state !== "shutdown") {
                this.appendKernelDiagnostic(`iopub pump failed: ${errorMessage(error)}`);
                this.rejectActiveExecution(new Error(`Kernel IOPub channel failed: ${errorMessage(error)}`));
            }
        }
        finally {
            if (this.iopub === iopub) {
                this.iopubPumpPromise = undefined;
            }
        }
    }
    handleExecutionMessage(incoming) {
        const execution = this.activeExecution;
        const parentMessageId = incoming.parent_header.msg_id;
        if (!execution || parentMessageId !== execution.requestMsgId) {
            if (incoming.header.msg_type === "display_data" || incoming.header.msg_type === "update_display_data") {
                const content = incoming.content;
                this.dispatchLateSentAgentMessage(parentMessageId, content.data?.[AGENT_MESSAGE_DISPLAY_MIME]);
            }
            return;
        }
        const t = incoming.header.msg_type;
        if (execution.settled && (t === "display_data" || t === "update_display_data")) {
            const content = incoming.content;
            if (this.dispatchLateSentAgentMessage(parentMessageId, content.data?.[AGENT_MESSAGE_DISPLAY_MIME])) {
                return;
            }
        }
        if (t === "stream") {
            const c = incoming.content;
            if (c.name === "stdout") {
                if (execution.stdout.length < execution.maxChars) {
                    execution.stdout += c.text;
                    if (execution.stdout.length > execution.maxChars) {
                        execution.stdout = execution.stdout.slice(0, execution.maxChars);
                        execution.stdoutTruncated = true;
                    }
                }
            }
            else if (c.name === "stderr") {
                if (execution.stderr.length < execution.maxChars) {
                    execution.stderr += c.text;
                    if (execution.stderr.length > execution.maxChars) {
                        execution.stderr = execution.stderr.slice(0, execution.maxChars);
                        execution.stderrTruncated = true;
                    }
                }
            }
            execution.opts.onStream?.(c.text, c.name);
        }
        else if (t === "execute_result") {
            const c = incoming.content;
            if (c.data["text/plain"])
                execution.result = c.data["text/plain"];
        }
        else if (t === "display_data" || t === "update_display_data") {
            const c = incoming.content;
            const diff = parseDiffDisplay(c.data?.[DIFF_DISPLAY_MIME]);
            if (diff)
                execution.diffs.push(diff);
            const attachment = parseAttachmentDisplay(c.data?.[ATTACHMENT_DISPLAY_MIME]);
            if (attachment === "oversized") {
                execution.stderr += `${execution.stderr ? "\n" : ""}attachment dropped: exceeds ${MAX_ATTACHMENT_DATA_CHARS} base64 chars`;
                execution.status = "error";
            }
            else if (attachment) {
                execution.attachments.push(attachment);
            }
            const sentAgentMessage = parseSentAgentMessage(c.data?.[AGENT_MESSAGE_DISPLAY_MIME]);
            if (sentAgentMessage)
                execution.sentAgentMessages.push(sentAgentMessage);
        }
        else if (t === "error") {
            const c = incoming.content;
            execution.error = c;
            execution.status = "error";
        }
        else if (t === "status") {
            const c = incoming.content;
            if (c.execution_state === "idle") {
                this.finishActiveExecution(execution);
            }
        }
    }
    finishActiveExecution(execution) {
        if (this.activeExecution !== execution) {
            return;
        }
        this.resolveExecution(execution, { clearActive: true });
    }
    resolveExecution(execution, options) {
        const didClearActive = options.clearActive && this.activeExecution === execution;
        if (options.clearActive && this.activeExecution === execution) {
            this.activeExecution = undefined;
        }
        if (!execution.settled) {
            execution.settled = true;
            if (execution.opts.onLateSentAgentMessage) {
                this.registerLateSentAgentMessageHandler(execution.requestMsgId, execution.opts.onLateSentAgentMessage);
            }
            let stdout = execution.stdout;
            let stderr = execution.stderr;
            let result = execution.result;
            let status = execution.status;
            if (execution.stdoutTruncated)
                stdout += `\n[... output truncated at ${execution.maxChars} chars ...]`;
            if (execution.stderrTruncated)
                stderr += `\n[... output truncated at ${execution.maxChars} chars ...]`;
            if (result !== undefined && result.length > execution.maxChars) {
                result = `${result.slice(0, execution.maxChars)}\n[... output truncated at ${execution.maxChars} chars ...]`;
            }
            if (execution.opts.signal?.aborted)
                status = "aborted";
            execution.resolve({
                stdout,
                stderr,
                result,
                diffs: execution.diffs.length > 0 ? execution.diffs : undefined,
                attachments: execution.attachments.length > 0 ? execution.attachments : undefined,
                sentAgentMessages: execution.sentAgentMessages.length > 0 ? execution.sentAgentMessages : undefined,
                error: execution.error,
                status,
                durationMs: Date.now() - execution.started,
            });
        }
        if (didClearActive) {
            this.notifyActiveExecutionIdle();
        }
    }
    dispatchLateSentAgentMessage(parentMessageId, value) {
        const sentAgentMessage = parseSentAgentMessage(value);
        if (!sentAgentMessage || !parentMessageId) {
            return false;
        }
        const handler = this.lateSentAgentMessageHandlers.get(parentMessageId);
        if (!handler) {
            return false;
        }
        this.lateSentAgentMessageHandlers.delete(parentMessageId);
        this.lateSentAgentMessageHandlers.set(parentMessageId, handler);
        handler(sentAgentMessage);
        return true;
    }
    registerLateSentAgentMessageHandler(requestMessageId, handler) {
        this.lateSentAgentMessageHandlers.set(requestMessageId, handler);
        while (this.lateSentAgentMessageHandlers.size > MAX_LATE_SENT_AGENT_MESSAGE_HANDLERS) {
            const oldestRequestMessageId = this.lateSentAgentMessageHandlers.keys().next().value;
            if (oldestRequestMessageId === undefined) {
                break;
            }
            this.lateSentAgentMessageHandlers.delete(oldestRequestMessageId);
        }
    }
    rejectActiveExecution(error) {
        const execution = this.activeExecution;
        if (!execution) {
            return;
        }
        this.activeExecution = undefined;
        execution.reject(error);
        this.notifyActiveExecutionIdle();
    }
    notifyActiveExecutionIdle() {
        for (const resolve of this.activeExecutionIdleWaiters) {
            resolve();
        }
        this.activeExecutionIdleWaiters.clear();
    }
    waitForActiveExecutionToClear(signal, timeoutMs) {
        if (!this.activeExecution) {
            return Promise.resolve(true);
        }
        return new Promise((resolve) => {
            let settled = false;
            let timeout;
            const finish = (cleared) => {
                if (settled) {
                    return;
                }
                settled = true;
                if (timeout) {
                    globalThis.clearTimeout(timeout);
                }
                this.activeExecutionIdleWaiters.delete(onIdle);
                signal?.removeEventListener("abort", onAbort);
                resolve(cleared);
            };
            const onIdle = () => finish(true);
            const onAbort = () => finish(false);
            this.activeExecutionIdleWaiters.add(onIdle);
            signal?.addEventListener("abort", onAbort, { once: true });
            timeout = globalThis.setTimeout(() => finish(false), timeoutMs);
            if (timeout && typeof timeout === "object" && "unref" in timeout) {
                timeout.unref();
            }
        });
    }
    async waitForActiveExecutionToClearForReuse(signal) {
        const started = Date.now();
        while (this.activeExecution && Date.now() - started < KERNEL_BUSY_REUSE_WAIT_MS) {
            if (this.state === "shutdown") {
                throw new Error("Kernel has been shut down");
            }
            void this.interrupt().catch(() => undefined);
            const remaining = KERNEL_BUSY_REUSE_WAIT_MS - (Date.now() - started);
            const cleared = await this.waitForActiveExecutionToClear(signal, Math.max(1, Math.min(KERNEL_BUSY_INTERRUPT_INTERVAL_MS, remaining)));
            if (cleared || signal?.aborted) {
                return;
            }
        }
        if (this.activeExecution) {
            throw new KernelBusyAfterInterruptError();
        }
    }
    handleCommMessage(incoming) {
        const msgType = incoming.header.msg_type;
        const content = incoming.content;
        const commId = content.comm_id;
        if (typeof commId !== "string") {
            return;
        }
        if (msgType === "comm_close") {
            this.commTargets.delete(commId);
            this.handledHostRequestCommIds.delete(commId);
            return;
        }
        if (msgType === "comm_open") {
            const targetName = content.target_name;
            if (typeof targetName !== "string") {
                return;
            }
            this.commTargets.set(commId, targetName);
            if (targetName === HOST_COMM_TARGET) {
                this.startHostRequestFromComm(commId, content.data);
            }
            return;
        }
        const targetName = this.commTargets.get(commId);
        if (msgType === "comm_msg" && targetName === HOST_COMM_TARGET) {
            this.startHostRequestFromComm(commId, content.data);
        }
    }
    startHostRequestFromComm(commId, data) {
        if (this.handledHostRequestCommIds.has(commId)) {
            return;
        }
        this.handledHostRequestCommIds.add(commId);
        const task = (async () => {
            try {
                const result = await this.handleHostRequest(data);
                try {
                    await this.sendCommMessage(commId, { status: "ok", ...result });
                }
                catch (replyError) {
                    this.appendKernelDiagnostic(`failed to send host request ok reply for comm ${commId}: ${errorMessage(replyError)}`);
                }
            }
            catch (error) {
                this.appendKernelDiagnostic(`host request failed for comm ${commId}: ${errorMessage(error)}`);
                try {
                    await this.sendCommMessage(commId, { status: "error", error: errorMessage(error) });
                }
                catch (replyError) {
                    this.appendKernelDiagnostic(`failed to send host request error reply for comm ${commId}: ${errorMessage(replyError)}`);
                }
            }
        })();
        this.inFlightHostRequests.add(task);
        void task.finally(() => {
            this.inFlightHostRequests.delete(task);
        });
    }
    async handleHostRequest(data) {
        if (!isRecord(data)) {
            throw new Error("host request payload must be an object");
        }
        if (typeof data.type !== "string" || data.type.length === 0) {
            throw new Error("host request payload must have a string type");
        }
        const handler = this.options.hostHandlers?.[data.type];
        if (!handler) {
            throw new Error(`host request type "${data.type}" is not available in this session`);
        }
        // Tag the request with the cell that triggered it. A blocking call is still
        // the in-flight execution; detached spawns (asyncio.create_task) fire after
        // the scheduling cell goes idle, so fall back to that last cell's source.
        const cellSourceCode = this.activeExecution?.code ?? this.lastCellCode;
        return handler({ ...data, cellSourceCode });
    }
    async sendCommMessage(commId, data) {
        const channel = this.control ?? this.shell;
        if (!channel || !this.connection) {
            throw new Error("Kernel channel is not connected");
        }
        const msg = buildMessage("comm_msg", { comm_id: commId, data }, this.session, this.options.username);
        await channel.send(encode(msg, this.connection.key));
    }
    async interrupt() {
        if (!this.control || !this.connection)
            return;
        const msg = buildMessage("interrupt_request", {}, this.session, this.options.username);
        await this.control.send(encode(msg, this.connection.key));
    }
    cleanupResources(killSignal = "SIGTERM") {
        this.clearSnapshotTimer();
        this.lateSentAgentMessageHandlers.clear();
        if (this.forkedLivenessTimer) {
            globalThis.clearInterval(this.forkedLivenessTimer);
            this.forkedLivenessTimer = undefined;
        }
        this.rejectActiveExecution(new Error("Kernel has been shut down"));
        this.shell?.close();
        this.iopub?.close();
        this.control?.close();
        this.shell = undefined;
        this.iopub = undefined;
        this.control = undefined;
        this.iopubPumpPromise = undefined;
        try {
            if (this.kernel) {
                this.kernel.kill(killSignal);
            }
            else if (this.kernelPid !== undefined && !this.forkedKernelDied()) {
                // Only signal a forked kernel confirmed still alive: a dead pid may have
                // been recycled by the OS, and a kill would then hit an unrelated process.
                process.kill(this.kernelPid, killSignal);
            }
        }
        catch {
            // Kernel already exited.
        }
        this.kernel = undefined;
        this.kernelPid = undefined;
        this.connection = undefined;
        if (this.tempDir) {
            try {
                rmSync(this.tempDir, { recursive: true, force: true });
            }
            catch {
                // Leave the temp dir for OS tmp cleanup.
            }
        }
        this.tempDir = undefined;
        this.startPromise = undefined;
    }
    async waitForHostRequestsToSettle(tasks, timeoutMs) {
        let timeout;
        const timeoutPromise = new Promise((resolve) => {
            timeout = globalThis.setTimeout(() => resolve("timeout"), timeoutMs);
            if (timeout && typeof timeout === "object" && "unref" in timeout) {
                timeout.unref();
            }
        });
        const result = await Promise.race([Promise.allSettled(tasks).then(() => "settled"), timeoutPromise]);
        if (timeout) {
            globalThis.clearTimeout(timeout);
        }
        if (result === "timeout") {
            this.appendKernelDiagnostic(`timed out waiting ${timeoutMs}ms for ${tasks.length} host request task(s) during dispose`);
        }
    }
    async shutdown(opts = {}) {
        if (this.state === "shutdown") {
            liveKernels.delete(this);
            this.cleanupResources();
            return;
        }
        // Best-effort final flush (bounded) before teardown — used by signal handlers
        // so a SIGINT/SIGTERM exit doesn't lose work the debounced snapshot hasn't saved.
        if (opts.snapshot) {
            await this.flushSnapshotForDispose();
        }
        this.state = "shutdown";
        liveKernels.delete(this);
        try {
            if (this.control && this.connection) {
                const msg = buildMessage("shutdown_request", { restart: false }, this.session, this.options.username);
                await this.control.send(encode(msg, this.connection.key));
                await sleep(200);
            }
        }
        catch (error) {
            this.appendKernelDiagnostic(`shutdown_request send failed (killing instead): ${error instanceof Error ? error.message : String(error)}`);
        }
        this.cleanupResources();
    }
    async restart() {
        const prev = this.executionQueue;
        let resolveNext = () => { };
        this.executionQueue = new Promise((r) => {
            resolveNext = r;
        });
        await prev;
        try {
            await this.shutdown();
            this.state = "idle";
            this.kernelStderr = "";
            await this.start();
        }
        finally {
            resolveNext();
        }
    }
    async kill() {
        this.state = "shutdown";
        liveKernels.delete(this);
        this.cleanupResources("SIGKILL");
    }
    /**
     * Serialize the user namespace to disk (best-effort, per-variable). No-op when
     * the kernel isn't running or no snapshot target was configured. Never throws.
     */
    async snapshotState() {
        const cfg = this.options.snapshot;
        if (!cfg || !this.isRunning)
            return null;
        const code = buildSnapshotCode(cfg.path, cfg.manifestPath, cfg.maxBytes ?? DEFAULT_SNAPSHOT_MAX_BYTES);
        try {
            const r = await this.enqueueExecute(code, { maxOutputChars: SNAPSHOT_MAX_OUTPUT_CHARS, internal: true });
            if (r.status !== "ok") {
                this.appendKernelDiagnostic(`state snapshot failed: ${r.error?.evalue ?? r.stderr}`);
                return null;
            }
            return parseSnapshotResult(r.stdout, cfg.path);
        }
        catch (error) {
            this.appendKernelDiagnostic(`state snapshot error: ${errorMessage(error)}`);
            return null;
        }
    }
    /**
     * Revive a previously snapshotted namespace into the kernel. Call right after
     * start() and before the runtime bootstrap, which then refreshes live handles
     * (rlm, skills) over anything restored. Never throws.
     */
    async restoreState() {
        const cfg = this.options.snapshot;
        if (!cfg)
            return null;
        const code = buildRestoreCode(cfg.path);
        try {
            const r = await this.enqueueExecute(code, { maxOutputChars: SNAPSHOT_MAX_OUTPUT_CHARS, internal: true });
            if (r.status !== "ok") {
                this.appendKernelDiagnostic(`state restore failed: ${r.error?.evalue ?? r.stderr}`);
                return null;
            }
            return parseRestoreResult(r.stdout, cfg.path);
        }
        catch (error) {
            this.appendKernelDiagnostic(`state restore error: ${errorMessage(error)}`);
            return null;
        }
    }
    /** Live user-defined top-level names, or null if the kernel isn't running. Never throws. */
    async listNamespaceNames(signal) {
        if (!this.isRunning)
            return null;
        try {
            const r = await this.enqueueExecute(buildListNamesCode(), {
                maxOutputChars: SNAPSHOT_MAX_OUTPUT_CHARS,
                internal: true,
                signal,
            });
            if (r.status !== "ok") {
                this.appendKernelDiagnostic(`namespace listing failed: ${r.error?.evalue ?? r.stderr}`);
                return null;
            }
            return parseListNamesResult(r.stdout);
        }
        catch (error) {
            this.appendKernelDiagnostic(`namespace listing error: ${errorMessage(error)}`);
            return null;
        }
    }
    scheduleSnapshot() {
        const cfg = this.options.snapshot;
        if (!cfg)
            return;
        if (this.snapshotTimer)
            clearTimeout(this.snapshotTimer);
        this.snapshotTimer = globalThis.setTimeout(() => {
            this.snapshotTimer = undefined;
            void this.snapshotState();
        }, cfg.debounceMs ?? DEFAULT_SNAPSHOT_DEBOUNCE_MS);
        if (this.snapshotTimer && typeof this.snapshotTimer === "object" && "unref" in this.snapshotTimer) {
            this.snapshotTimer.unref();
        }
    }
    clearSnapshotTimer() {
        if (this.snapshotTimer) {
            clearTimeout(this.snapshotTimer);
            this.snapshotTimer = undefined;
        }
    }
    /** Best-effort final snapshot before a graceful dispose, bounded by a timeout. */
    async flushSnapshotForDispose() {
        if (!this.options.snapshot || !this.isRunning)
            return;
        let timeout;
        const guard = new Promise((resolve) => {
            timeout = globalThis.setTimeout(resolve, SNAPSHOT_DISPOSE_TIMEOUT_MS);
            if (timeout && typeof timeout === "object" && "unref" in timeout)
                timeout.unref();
        });
        try {
            await Promise.race([this.snapshotState().then(() => undefined), guard]);
        }
        finally {
            if (timeout)
                clearTimeout(timeout);
        }
    }
    /** Graceful cleanup. Waits briefly for in-flight host request handlers before closing sockets. */
    dispose() {
        return (async () => {
            // Final namespace flush while the kernel is still live (session end / reload).
            await this.flushSnapshotForDispose();
            this.state = "shutdown";
            liveKernels.delete(this);
            const inFlightHostRequests = [...this.inFlightHostRequests];
            // TODO: plumb AbortSignal through AgentSession.prompt so disposal can cancel long-running child loops.
            try {
                if (inFlightHostRequests.length > 0) {
                    await this.waitForHostRequestsToSettle(inFlightHostRequests, HOST_REQUEST_DISPOSE_TIMEOUT_MS);
                }
            }
            finally {
                this.cleanupResources();
            }
        })();
    }
    /** Synchronous best-effort cleanup. Safe to call from `process.on('exit')`. */
    disposeSync() {
        this.state = "shutdown";
        liveKernels.delete(this);
        // TODO: replace this best-effort hard-exit path if Node exposes an awaitable process-exit cleanup hook.
        this.cleanupResources();
    }
    get isRunning() {
        return this.state === "running";
    }
}
//# sourceMappingURL=index.js.map
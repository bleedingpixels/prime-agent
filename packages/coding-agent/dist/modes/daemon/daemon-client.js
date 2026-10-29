import { randomUUID } from "node:crypto";
import { createConnection } from "node:net";
import { getDaemonLogPath } from "../../config.js";
import { attachJsonlLineReader, serializeJsonLine } from "../rpc/jsonl.js";
import { createDaemonCommandEnvelope, DAEMON_COMMAND_ENVELOPE_MIN_PROTOCOL_VERSION, DAEMON_PROTOCOL_VERSION, getDaemonCommandCompatibilities, isDaemonMutatingCommand, } from "./daemon-protocol.js";
function daemonEndpointDetails(socketPath) {
    return `Socket: ${socketPath}. Daemon log: ${getDaemonLogPath(socketPath)}.`;
}
export class DaemonSocketClosedError extends Error {
    daemonClosingReason;
    constructor(socketPath, daemonClosingReason, cause) {
        const reasonDetails = daemonClosingReason ? ` Reason: ${daemonClosingReason}.` : "";
        const causeDetails = cause ? ` Cause: ${cause}.` : "";
        super(`Connection to the Prime Agent daemon closed.${reasonDetails}${causeDetails} ${daemonEndpointDetails(socketPath)}`);
        this.daemonClosingReason = daemonClosingReason;
        this.name = "DaemonSocketClosedError";
    }
}
export class DaemonCapabilityUnavailableError extends Error {
    command;
    capability;
    afterReconnect;
    constructor(command, capability, afterReconnect = false) {
        super(capability
            ? `The running Prime Agent daemon does not support ${capability}.`
            : `The running Prime Agent daemon does not support ${command}.`);
        this.command = command;
        this.capability = capability;
        this.afterReconnect = afterReconnect;
        this.name = "DaemonCapabilityUnavailableError";
    }
}
export function getDaemonSocketCloseReason(error) {
    return error instanceof DaemonSocketClosedError ? error.daemonClosingReason : undefined;
}
const DEFAULT_RECONNECT_TIMEOUT_MS = 60_000;
const RECONNECT_CONNECT_TIMEOUT_MS = 1000;
const RECONNECT_HELLO_TIMEOUT_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 2000;
export class DaemonClient {
    socketPath;
    socket;
    detachReader;
    listeners = new Set();
    closeListeners = new Set();
    pendingRequests = new Map();
    requestId = 0;
    protocolClientId = `daemon-client:${randomUUID()}`;
    requestRecoveryEnabled = false;
    reconnectOptions;
    autoReconnectPromise;
    closed = false;
    helloMessage;
    daemonClosingReason;
    reconnectPromise;
    helloWaiters = new Set();
    constructor(socketPath) {
        this.socketPath = socketPath;
    }
    get hello() {
        return this.helloMessage;
    }
    get isConnected() {
        return this.socket !== undefined && !this.socket.destroyed;
    }
    supportsServerCapability(capability) {
        return this.helloMessage?.serverCapabilities?.includes(capability) === true;
    }
    /** Wait for the daemon_hello greeting sent on connect. */
    async waitForHello(timeoutMs = 3000) {
        if (this.helloMessage) {
            return this.helloMessage;
        }
        if (!this.socket || this.socket.destroyed) {
            throw new Error(`Cannot wait for the Prime Agent daemon handshake because the daemon is not connected. ${daemonEndpointDetails(this.socketPath)}`);
        }
        return new Promise((resolve, reject) => {
            const waiter = {
                resolve,
                reject,
                timeout: setTimeout(() => {
                    this.helloWaiters.delete(waiter);
                    reject(new Error(`Timed out after ${timeoutMs}ms waiting for the Prime Agent daemon handshake. ${daemonEndpointDetails(this.socketPath)}`));
                }, timeoutMs),
            };
            this.helloWaiters.add(waiter);
        });
    }
    async connect(timeoutMs = 3000) {
        if (this.socket) {
            throw new Error(`Prime Agent daemon client is already connected. ${daemonEndpointDetails(this.socketPath)}`);
        }
        this.helloMessage = undefined;
        this.daemonClosingReason = undefined;
        const socket = createConnection(this.socketPath);
        this.socket = socket;
        this.detachReader = attachJsonlLineReader(socket, (line) => this.handleLine(line));
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup();
                this.clearSocketReference(socket);
                socket.destroy();
                reject(new Error(`Timed out after ${timeoutMs}ms connecting to the Prime Agent daemon. ${daemonEndpointDetails(this.socketPath)}`));
            }, timeoutMs);
            const cleanup = () => {
                clearTimeout(timeout);
                socket.off("connect", onConnect);
                socket.off("error", onError);
            };
            const onConnect = () => {
                cleanup();
                resolve();
            };
            const onError = (error) => {
                cleanup();
                this.clearSocketReference(socket);
                reject(new Error(`Failed to connect to the Prime Agent daemon: ${error.message}. ${daemonEndpointDetails(this.socketPath)}`));
            };
            socket.once("connect", onConnect);
            socket.once("error", onError);
        });
        socket.on("error", (error) => this.notifyClosed(socket, this.daemonClosingReason
            ? new DaemonSocketClosedError(this.socketPath, this.daemonClosingReason, error.message)
            : error));
        socket.on("close", () => this.notifyClosed(socket, new DaemonSocketClosedError(this.socketPath, this.daemonClosingReason)));
    }
    async reconnect(timeoutMs = 3000) {
        if (this.reconnectPromise) {
            return this.reconnectPromise;
        }
        if (this.socket && !this.socket.destroyed) {
            return;
        }
        const reconnectPromise = this.connect(timeoutMs);
        this.reconnectPromise = reconnectPromise;
        try {
            await reconnectPromise;
        }
        finally {
            if (this.reconnectPromise === reconnectPromise) {
                this.reconnectPromise = undefined;
            }
        }
    }
    disconnectForReconnect(reason) {
        const socket = this.socket;
        if (!socket || socket.destroyed) {
            return;
        }
        this.daemonClosingReason = reason;
        this.notifyClosed(socket, new DaemonSocketClosedError(this.socketPath, reason));
        socket.end();
        socket.destroy();
    }
    /** Discard a partially recovered transport so the next retry can reconnect cleanly. */
    resetTransportForReconnect() {
        const socket = this.socket;
        if (!socket) {
            return;
        }
        this.clearSocketReference(socket);
        this.rejectAll(new DaemonSocketClosedError(this.socketPath, undefined, "reconnect attempt did not complete"), this.requestRecoveryEnabled);
        socket.destroy();
    }
    onMessage(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    onClose(listener) {
        this.closeListeners.add(listener);
        return () => {
            this.closeListeners.delete(listener);
        };
    }
    /** Keep in-flight command promises alive and resend their stable envelopes after reconnect. */
    enableRequestRecovery() {
        this.requestRecoveryEnabled = true;
    }
    /** Reconnect a global/raw daemon client after supervisor replacement. */
    enableAutoReconnect(options) {
        this.requestRecoveryEnabled = true;
        this.reconnectOptions = options;
    }
    async request(command, timeoutMs = 30000, options = {}) {
        if (!this.socket || this.socket.destroyed) {
            throw new Error(`Cannot send daemon command "${command.type}" because the Prime Agent daemon is not connected. ${daemonEndpointDetails(this.socketPath)}`);
        }
        const hello = this.helloMessage ?? (await this.waitForHello());
        const compatibilities = getDaemonCommandCompatibilities(command);
        const missingCompatibility = compatibilities.find((compatibility) => !this.meetsCommandCompatibility(hello, compatibility));
        if (missingCompatibility) {
            throw new DaemonCapabilityUnavailableError(command.type, missingCompatibility.capability);
        }
        const envelopeProtocolVersion = Math.min(hello.protocol.version, DAEMON_PROTOCOL_VERSION);
        return this.requestWire(command, timeoutMs, options, envelopeProtocolVersion >= DAEMON_COMMAND_ENVELOPE_MIN_PROTOCOL_VERSION ? envelopeProtocolVersion : undefined, compatibilities);
    }
    meetsCommandCompatibility(hello, compatibility) {
        return (hello.protocol.version >= compatibility.minProtocol &&
            (compatibility.minSchemaRevision === undefined ||
                (hello.schemaRevision ?? 0) >= compatibility.minSchemaRevision) &&
            (compatibility.capability === undefined ||
                hello.serverCapabilities?.includes(compatibility.capability) === true));
    }
    async authenticateWorker(token, timeoutMs = 3000) {
        const legacyAuthentication = { type: "worker_auth", token };
        const response = await this.requestWire(legacyAuthentication, timeoutMs);
        if (!response.success) {
            throw new Error(response.error);
        }
    }
    async requestWorker(command, timeoutMs = 30000) {
        return this.requestWire(command, timeoutMs);
    }
    async requestWire(command, timeoutMs, options = {}, publicEnvelopeProtocolVersion, compatibilities = []) {
        if (!this.socket || this.socket.destroyed) {
            throw new Error(`Cannot send daemon command "${command.type}" because the Prime Agent daemon is not connected. ${daemonEndpointDetails(this.socketPath)}`);
        }
        const id = `daemon_${++this.requestId}`;
        const fullCommand = { ...command, id };
        const wireCommand = publicEnvelopeProtocolVersion
            ? createDaemonCommandEnvelope(fullCommand, id, this.protocolClientId, publicEnvelopeProtocolVersion)
            : fullCommand;
        const wireData = serializeJsonLine(wireCommand);
        const acknowledgeResult = publicEnvelopeProtocolVersion !== undefined && isDaemonMutatingCommand(fullCommand);
        return new Promise((resolve, reject) => {
            const pending = {
                resolve,
                reject,
                timeoutMs,
                commandType: command.type,
                onProgress: options.onProgress,
                wireData,
                awaitingReconnect: false,
                acknowledgeResult,
                compatibilities,
            };
            this.pendingRequests.set(id, pending);
            this.armPendingRequestTimeout(id, pending);
            this.socket.write(wireData);
        });
    }
    armPendingRequestTimeout(id, pending) {
        pending.timeout = setTimeout(() => {
            this.pendingRequests.delete(id);
            pending.reject(new Error(`Timed out after ${pending.timeoutMs}ms waiting for the Prime Agent daemon response to "${pending.commandType}". ${daemonEndpointDetails(this.socketPath)}`));
        }, pending.timeoutMs);
    }
    close() {
        this.closed = true;
        this.reconnectOptions = undefined;
        this.detachReader?.();
        this.detachReader = undefined;
        this.rejectAll(new Error(`Prime Agent daemon client closed before the operation completed. ${daemonEndpointDetails(this.socketPath)}`));
        this.socket?.end();
        this.socket?.destroy();
        this.socket = undefined;
    }
    clearSocketReference(socket) {
        if (this.socket !== socket) {
            return;
        }
        this.detachReader?.();
        this.detachReader = undefined;
        this.socket = undefined;
    }
    handleLine(line) {
        let message;
        try {
            message = JSON.parse(line);
        }
        catch {
            return;
        }
        if (isDaemonHello(message)) {
            this.helloMessage = message;
            for (const waiter of [...this.helloWaiters]) {
                clearTimeout(waiter.timeout);
                this.helloWaiters.delete(waiter);
                waiter.resolve(message);
            }
            if (this.socket && !this.socket.destroyed) {
                for (const [id, pending] of this.pendingRequests) {
                    if (!pending.awaitingReconnect) {
                        continue;
                    }
                    pending.awaitingReconnect = false;
                    const missingCompatibility = pending.compatibilities.find((compatibility) => !this.meetsCommandCompatibility(message, compatibility));
                    if (missingCompatibility) {
                        this.pendingRequests.delete(id);
                        pending.reject(new DaemonCapabilityUnavailableError(pending.commandType, missingCompatibility.capability, true));
                        continue;
                    }
                    this.armPendingRequestTimeout(id, pending);
                    this.socket.write(pending.wireData);
                }
            }
        }
        if (isDaemonClosing(message)) {
            this.daemonClosingReason = message.reason;
        }
        if (isDaemonResponse(message) && message.id) {
            const pending = this.pendingRequests.get(message.id);
            if (pending) {
                if (pending.timeout) {
                    clearTimeout(pending.timeout);
                }
                this.pendingRequests.delete(message.id);
                pending.resolve(message);
                if (pending.acknowledgeResult) {
                    this.acknowledgeCommandResult(message.id);
                }
                return;
            }
        }
        if (isDaemonRequestProgress(message) && message.id) {
            const pending = this.pendingRequests.get(message.id);
            if (pending) {
                pending.onProgress?.(message);
                return;
            }
        }
        for (const listener of this.listeners) {
            try {
                listener(message);
            }
            catch {
                // A consumer failure must not interrupt protocol parsing for other clients.
            }
        }
    }
    acknowledgeCommandResult(commandId) {
        const hello = this.helloMessage;
        if (!this.socket ||
            this.socket.destroyed ||
            !hello ||
            hello.protocol.version < DAEMON_COMMAND_ENVELOPE_MIN_PROTOCOL_VERSION) {
            return;
        }
        const id = `daemon_ack_${++this.requestId}`;
        const command = { id, type: "ack_result", commandId };
        const protocolVersion = Math.min(hello.protocol.version, DAEMON_PROTOCOL_VERSION);
        this.socket.write(serializeJsonLine(createDaemonCommandEnvelope(command, id, this.protocolClientId, protocolVersion)));
    }
    rejectAll(error, preservePendingRequests = false) {
        for (const [id, pending] of this.pendingRequests) {
            if (preservePendingRequests) {
                if (pending.timeout) {
                    clearTimeout(pending.timeout);
                    pending.timeout = undefined;
                }
                pending.awaitingReconnect = true;
                continue;
            }
            if (pending.timeout) {
                clearTimeout(pending.timeout);
            }
            pending.reject(error);
            this.pendingRequests.delete(id);
        }
        for (const waiter of [...this.helloWaiters]) {
            clearTimeout(waiter.timeout);
            this.helloWaiters.delete(waiter);
            waiter.reject(error);
        }
    }
    notifyClosed(socket, error) {
        if (this.socket !== socket) {
            return;
        }
        this.clearSocketReference(socket);
        this.rejectAll(error, this.requestRecoveryEnabled);
        for (const listener of [...this.closeListeners]) {
            listener(error);
        }
        if (this.reconnectOptions && !this.closed) {
            void this.autoReconnect(error);
        }
    }
    async autoReconnect(cause) {
        if (this.autoReconnectPromise) {
            return this.autoReconnectPromise;
        }
        const options = this.reconnectOptions;
        if (!options || this.closed) {
            return;
        }
        this.emitReconnectStatus({ status: "reconnecting", error: cause.message });
        this.autoReconnectPromise = (async () => {
            const deadline = Date.now() + (options.timeoutMs ?? DEFAULT_RECONNECT_TIMEOUT_MS);
            let attempt = 0;
            let lastError = cause;
            while (!this.closed && this.reconnectOptions === options && Date.now() < deadline) {
                try {
                    await options.recoverDaemon();
                    if (this.closed || this.reconnectOptions !== options) {
                        return;
                    }
                    await this.connect(RECONNECT_CONNECT_TIMEOUT_MS);
                    await this.waitForHello(RECONNECT_HELLO_TIMEOUT_MS);
                    this.emitReconnectStatus({ status: "connected" });
                    return;
                }
                catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    this.resetTransportForReconnect();
                    const remainingMs = deadline - Date.now();
                    if (remainingMs <= 0) {
                        break;
                    }
                    const delayMs = Math.min(remainingMs, MAX_RECONNECT_DELAY_MS, 100 * 2 ** Math.min(attempt, 5));
                    attempt++;
                    await delay(delayMs);
                }
            }
            if (this.closed || this.reconnectOptions !== options) {
                return;
            }
            const failure = new Error(`Daemon reconnection failed: ${lastError.message}`);
            this.rejectAll(failure);
            this.emitReconnectStatus({ status: "failed", error: failure.message });
            this.reconnectOptions = undefined;
        })().finally(() => {
            this.autoReconnectPromise = undefined;
        });
        return this.autoReconnectPromise;
    }
    emitReconnectStatus(status) {
        try {
            this.reconnectOptions?.onStatus?.(status);
        }
        catch {
            // UI status callbacks must never interrupt transport recovery.
        }
    }
}
function delay(ms) {
    return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}
function isDaemonClosing(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const candidate = value;
    return candidate.type === "daemon_closing" && (candidate.reason === "shutdown" || candidate.reason === "update");
}
function isDaemonHello(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const candidate = value;
    return candidate.type === "daemon_hello" && typeof candidate.protocol === "object" && candidate.protocol !== null;
}
function isDaemonResponse(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const candidate = value;
    return (candidate.type === "response" && typeof candidate.success === "boolean" && typeof candidate.command === "string");
}
function isDaemonRequestProgress(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const candidate = value;
    if (candidate.command !== "list_saved_sessions" || typeof candidate.id !== "string") {
        return false;
    }
    if (candidate.type === "session_list_progress") {
        return typeof candidate.loaded === "number" && typeof candidate.total === "number";
    }
    return candidate.type === "session_list_item" && isDaemonSavedSessionInfo(candidate.session);
}
function isDaemonSavedSessionInfo(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const candidate = value;
    return (typeof candidate.path === "string" &&
        typeof candidate.id === "string" &&
        typeof candidate.cwd === "string" &&
        typeof candidate.created === "string" &&
        typeof candidate.modified === "string" &&
        typeof candidate.messageCount === "number" &&
        typeof candidate.firstMessage === "string" &&
        typeof candidate.allMessagesText === "string" &&
        (candidate.agentStatus === undefined || isDaemonSavedSessionAgentStatus(candidate.agentStatus)));
}
function isDaemonSavedSessionAgentStatus(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const candidate = value;
    return (typeof candidate.summary === "string" &&
        typeof candidate.basedOnMessageCount === "number" &&
        (candidate.taskState === undefined ||
            candidate.taskState === "needs_input" ||
            candidate.taskState === "completed"));
}
//# sourceMappingURL=daemon-client.js.map
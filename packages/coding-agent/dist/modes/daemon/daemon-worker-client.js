import { createConnection } from "node:net";
import { serializeJsonLine } from "../rpc/jsonl.js";
import { PrivateFramedChannel } from "../session-worker/private-framing.js";
import { isDaemonWorkerFrameHeader, } from "./daemon-worker-protocol.js";
export class DaemonWorkerClient {
    socketPath;
    socket;
    channel;
    frameListeners = new Set();
    closeListeners = new Set();
    pending = new Map();
    requestId = 0;
    hello;
    helloWaiters = new Set();
    constructor(socketPath) {
        this.socketPath = socketPath;
    }
    async connect(timeoutMs = 3000) {
        if (this.socket) {
            throw new Error("Daemon worker client is already connected");
        }
        const socket = createConnection(this.socketPath);
        this.socket = socket;
        this.channel = new PrivateFramedChannel(socket, isDaemonWorkerFrameHeader);
        this.channel.onFrame((frame) => this.handleFrame(frame));
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup();
                socket.destroy();
                reject(new Error(`Timed out connecting to daemon worker socket: ${this.socketPath}`));
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
                reject(error);
            };
            socket.once("connect", onConnect);
            socket.once("error", onError);
        });
        socket.on("error", (error) => this.notifyClosed(socket, error));
        socket.on("close", () => this.notifyClosed(socket, new Error("Daemon worker socket closed")));
    }
    waitForHello(timeoutMs = 3000) {
        if (this.hello) {
            return Promise.resolve(this.hello);
        }
        if (!this.socket || this.socket.destroyed) {
            return Promise.reject(new Error("Daemon worker client is not connected"));
        }
        return new Promise((resolve, reject) => {
            const waiter = {
                resolve,
                reject,
                timeout: setTimeout(() => {
                    this.helloWaiters.delete(waiter);
                    reject(new Error("Timed out waiting for daemon worker hello"));
                }, timeoutMs),
            };
            this.helloWaiters.add(waiter);
        });
    }
    onFrame(listener) {
        this.frameListeners.add(listener);
        return () => this.frameListeners.delete(listener);
    }
    onClose(listener) {
        this.closeListeners.add(listener);
        return () => this.closeListeners.delete(listener);
    }
    request(command, timeoutMs = 30_000) {
        return this.requestWire(command, timeoutMs);
    }
    requestWorker(command, timeoutMs = 30_000) {
        return this.requestWire(command, timeoutMs);
    }
    async authenticateWorker(token, owner, timeoutMs = 3000) {
        const response = await this.requestWorker({ type: "worker_auth", token, ...owner }, timeoutMs);
        if (!response.success) {
            throw new Error(response.error);
        }
    }
    close() {
        this.rejectAll(new Error("Daemon worker client closed"));
        this.channel?.close();
        this.channel = undefined;
        this.socket?.destroy();
        this.socket = undefined;
    }
    async requestWire(command, timeoutMs) {
        if (!this.channel || !this.socket || this.socket.destroyed) {
            throw new Error("Daemon worker client is not connected");
        }
        const id = `worker_${++this.requestId}`;
        const fullCommand = { ...command, id };
        const response = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`Timed out waiting for daemon worker response to ${command.type}`));
            }, timeoutMs);
            this.pending.set(id, { resolve, reject, timeout });
        });
        try {
            await this.channel.send({ kind: "command", requestId: id, commandType: command.type }, Buffer.from(serializeJsonLine(fullCommand)));
        }
        catch (error) {
            const pending = this.pending.get(id);
            if (pending) {
                clearTimeout(pending.timeout);
                this.pending.delete(id);
                pending.reject(error instanceof Error ? error : new Error(String(error)));
            }
        }
        return response;
    }
    handleFrame(frame) {
        if (frame.header.kind !== "outbound") {
            return;
        }
        if (frame.header.outboundType === "response" && frame.header.requestId) {
            const pending = this.pending.get(frame.header.requestId);
            if (pending) {
                let response;
                try {
                    response = JSON.parse(frame.payload.toString("utf8"));
                }
                catch (error) {
                    clearTimeout(pending.timeout);
                    this.pending.delete(frame.header.requestId);
                    pending.reject(new Error(`Invalid daemon worker response: ${String(error)}`));
                    return;
                }
                if (isDaemonResponse(response)) {
                    clearTimeout(pending.timeout);
                    this.pending.delete(frame.header.requestId);
                    pending.resolve(response);
                    return;
                }
            }
        }
        if (frame.header.outboundType === "daemon_hello") {
            try {
                const parsed = JSON.parse(frame.payload.toString("utf8"));
                if (parsed.type === "daemon_hello") {
                    this.hello = parsed;
                    for (const waiter of [...this.helloWaiters]) {
                        clearTimeout(waiter.timeout);
                        this.helloWaiters.delete(waiter);
                        waiter.resolve(parsed);
                    }
                }
            }
            catch {
                // The malformed frame eventually fails the hello timeout.
            }
        }
        for (const listener of this.frameListeners) {
            listener(frame);
        }
    }
    rejectAll(error) {
        for (const [id, pending] of this.pending) {
            clearTimeout(pending.timeout);
            pending.reject(error);
            this.pending.delete(id);
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
        this.socket = undefined;
        this.channel = undefined;
        this.rejectAll(error);
        for (const listener of [...this.closeListeners]) {
            listener(error);
        }
    }
}
function isDaemonResponse(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const candidate = value;
    return (candidate.type === "response" && typeof candidate.command === "string" && typeof candidate.success === "boolean");
}
//# sourceMappingURL=daemon-worker-client.js.map
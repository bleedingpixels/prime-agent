import { type PrivateFrame } from "../session-worker/private-framing.js";
import type { DaemonCommand, DaemonOutbound, DaemonResponse } from "./daemon-protocol.js";
import { type DaemonWorkerCommand, type DaemonWorkerCommandBody, type DaemonWorkerFrameHeader } from "./daemon-worker-protocol.js";
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type DaemonCommandBody = DistributiveOmit<DaemonCommand, "id">;
type DaemonWorkerAuthentication = Omit<Extract<DaemonWorkerCommand, {
    type: "worker_auth";
}>, "id" | "type" | "token">;
export type DaemonWorkerFrameListener = (frame: PrivateFrame<DaemonWorkerFrameHeader>) => void;
export type DaemonWorkerCloseListener = (error: Error) => void;
type DaemonHello = Extract<DaemonOutbound, {
    type: "daemon_hello";
}>;
export declare class DaemonWorkerClient {
    private readonly socketPath;
    private socket?;
    private channel?;
    private readonly frameListeners;
    private readonly closeListeners;
    private readonly pending;
    private requestId;
    private hello?;
    private readonly helloWaiters;
    constructor(socketPath: string);
    connect(timeoutMs?: number): Promise<void>;
    waitForHello(timeoutMs?: number): Promise<DaemonHello>;
    onFrame(listener: DaemonWorkerFrameListener): () => void;
    onClose(listener: DaemonWorkerCloseListener): () => void;
    request(command: DaemonCommandBody, timeoutMs?: number): Promise<DaemonResponse>;
    requestWorker(command: DaemonWorkerCommandBody, timeoutMs?: number): Promise<DaemonResponse>;
    authenticateWorker(token: string, owner: DaemonWorkerAuthentication, timeoutMs?: number): Promise<void>;
    close(): void;
    private requestWire;
    private handleFrame;
    private rejectAll;
    private notifyClosed;
}
export {};
//# sourceMappingURL=daemon-worker-client.d.ts.map
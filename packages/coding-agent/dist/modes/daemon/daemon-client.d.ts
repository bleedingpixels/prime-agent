import { type DaemonClosingReason, type DaemonCommand, type DaemonOutbound, type DaemonRequestProgress, type DaemonResponse, type DaemonServerCapability } from "./daemon-protocol.js";
import type { DaemonWorkerCommandBody } from "./daemon-worker-protocol.js";
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type DaemonCommandBody = DistributiveOmit<DaemonCommand, "id">;
export type DaemonHello = Extract<DaemonOutbound, {
    type: "daemon_hello";
}>;
export type DaemonClientMessageListener = (message: DaemonOutbound) => void;
export type DaemonClientCloseListener = (error: Error) => void;
export type DaemonClientProgressListener = (message: DaemonRequestProgress) => void;
export interface DaemonClientRequestOptions {
    onProgress?: DaemonClientProgressListener;
}
export declare class DaemonSocketClosedError extends Error {
    readonly daemonClosingReason?: DaemonClosingReason | undefined;
    constructor(socketPath: string, daemonClosingReason?: DaemonClosingReason | undefined, cause?: string);
}
export declare class DaemonCapabilityUnavailableError extends Error {
    readonly command: DaemonCommand["type"];
    readonly capability: DaemonServerCapability | undefined;
    readonly afterReconnect: boolean;
    constructor(command: DaemonCommand["type"], capability: DaemonServerCapability | undefined, afterReconnect?: boolean);
}
export declare function getDaemonSocketCloseReason(error: Error): DaemonClosingReason | undefined;
export type DaemonClientReconnectStatus = {
    status: "reconnecting";
    error: string;
} | {
    status: "connected";
} | {
    status: "failed";
    error: string;
};
export interface DaemonClientReconnectOptions {
    recoverDaemon: () => Promise<void>;
    timeoutMs?: number;
    onStatus?: (status: DaemonClientReconnectStatus) => void;
}
export declare class DaemonClient {
    private readonly socketPath;
    private socket?;
    private detachReader?;
    private readonly listeners;
    private readonly closeListeners;
    private readonly pendingRequests;
    private requestId;
    private readonly protocolClientId;
    private requestRecoveryEnabled;
    private reconnectOptions?;
    private autoReconnectPromise?;
    private closed;
    private helloMessage?;
    private daemonClosingReason?;
    private reconnectPromise?;
    private readonly helloWaiters;
    constructor(socketPath: string);
    get hello(): DaemonHello | undefined;
    get isConnected(): boolean;
    supportsServerCapability(capability: DaemonServerCapability): boolean;
    /** Wait for the daemon_hello greeting sent on connect. */
    waitForHello(timeoutMs?: number): Promise<DaemonHello>;
    connect(timeoutMs?: number): Promise<void>;
    reconnect(timeoutMs?: number): Promise<void>;
    disconnectForReconnect(reason: DaemonClosingReason): void;
    /** Discard a partially recovered transport so the next retry can reconnect cleanly. */
    resetTransportForReconnect(): void;
    onMessage(listener: DaemonClientMessageListener): () => void;
    onClose(listener: DaemonClientCloseListener): () => void;
    /** Keep in-flight command promises alive and resend their stable envelopes after reconnect. */
    enableRequestRecovery(): void;
    /** Reconnect a global/raw daemon client after supervisor replacement. */
    enableAutoReconnect(options: DaemonClientReconnectOptions): void;
    request(command: DaemonCommandBody, timeoutMs?: number, options?: DaemonClientRequestOptions): Promise<DaemonResponse>;
    private meetsCommandCompatibility;
    authenticateWorker(token: string, timeoutMs?: number): Promise<void>;
    requestWorker(command: DaemonWorkerCommandBody, timeoutMs?: number): Promise<DaemonResponse>;
    private requestWire;
    private armPendingRequestTimeout;
    close(): void;
    private clearSocketReference;
    private handleLine;
    private acknowledgeCommandResult;
    private rejectAll;
    private notifyClosed;
    private autoReconnect;
    private emitReconnectStatus;
}
export {};
//# sourceMappingURL=daemon-client.d.ts.map
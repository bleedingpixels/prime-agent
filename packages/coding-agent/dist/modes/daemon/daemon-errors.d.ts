import type { DaemonErrorInfo, DaemonResponse } from "./daemon-protocol.js";
export declare function serializeDaemonError(error: unknown): DaemonErrorInfo | undefined;
export declare function deserializeDaemonError(response: Extract<DaemonResponse, {
    success: false;
}>): Error;
//# sourceMappingURL=daemon-errors.d.ts.map
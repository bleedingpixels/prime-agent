import type { Duplex } from "node:stream";
export interface PrivateFrameLimits {
    maxHeaderBytes: number;
    maxPayloadBytes: number;
}
export declare const DEFAULT_PRIVATE_FRAME_LIMITS: PrivateFrameLimits;
export interface PrivateFrame<THeader extends object> {
    header: THeader;
    payload: Buffer;
}
export type PrivateFrameHeaderValidator<THeader extends object> = (value: unknown) => value is THeader;
export declare function encodePrivateFrame<THeader extends object>(header: THeader, payload?: Uint8Array, limits?: PrivateFrameLimits): Buffer;
export declare class PrivateFrameDecoder<THeader extends object> {
    private readonly validateHeader;
    private readonly limits;
    private buffered;
    constructor(validateHeader: PrivateFrameHeaderValidator<THeader>, limits?: PrivateFrameLimits);
    get bufferedBytes(): number;
    push(chunk: Uint8Array): PrivateFrame<THeader>[];
    finish(): void;
}
export type PrivateFrameListener<THeader extends object> = (frame: PrivateFrame<THeader>) => void;
export declare class PrivateFramedChannel<THeader extends object> {
    private readonly stream;
    private readonly limits;
    private readonly decoder;
    private readonly listeners;
    private closed;
    constructor(stream: Duplex, validateHeader: PrivateFrameHeaderValidator<THeader>, limits?: PrivateFrameLimits);
    onFrame(listener: PrivateFrameListener<THeader>): () => void;
    send(header: THeader, payload?: Uint8Array): Promise<void>;
    close(): void;
    private readonly handleData;
    private readonly handleEnd;
    private readonly handleClose;
    private detach;
}
//# sourceMappingURL=private-framing.d.ts.map
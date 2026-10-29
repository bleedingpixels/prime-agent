const FRAME_PREFIX_BYTES = 8;
export const DEFAULT_PRIVATE_FRAME_LIMITS = {
    maxHeaderBytes: 1024 * 1024,
    maxPayloadBytes: 1024 * 1024 * 1024,
};
function assertFrameLength(name, value, maximum) {
    if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
        throw new Error(`Invalid private frame ${name}: ${value}`);
    }
}
function isObjectHeader(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function encodePrivateFrame(header, payload = Buffer.alloc(0), limits = DEFAULT_PRIVATE_FRAME_LIMITS) {
    const headerBuffer = Buffer.from(JSON.stringify(header), "utf8");
    const payloadBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
    assertFrameLength("header length", headerBuffer.length, limits.maxHeaderBytes);
    assertFrameLength("payload length", payloadBuffer.length, limits.maxPayloadBytes);
    if (headerBuffer.length === 0) {
        throw new Error("Private frame header cannot be empty");
    }
    const frame = Buffer.allocUnsafe(FRAME_PREFIX_BYTES + headerBuffer.length + payloadBuffer.length);
    frame.writeUInt32BE(headerBuffer.length, 0);
    frame.writeUInt32BE(payloadBuffer.length, 4);
    headerBuffer.copy(frame, FRAME_PREFIX_BYTES);
    payloadBuffer.copy(frame, FRAME_PREFIX_BYTES + headerBuffer.length);
    return frame;
}
export class PrivateFrameDecoder {
    validateHeader;
    limits;
    buffered = Buffer.alloc(0);
    constructor(validateHeader, limits = DEFAULT_PRIVATE_FRAME_LIMITS) {
        this.validateHeader = validateHeader;
        this.limits = limits;
    }
    get bufferedBytes() {
        return this.buffered.length;
    }
    push(chunk) {
        if (chunk.length > 0) {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            this.buffered = this.buffered.length === 0 ? buffer : Buffer.concat([this.buffered, buffer]);
        }
        const frames = [];
        let offset = 0;
        while (this.buffered.length - offset >= FRAME_PREFIX_BYTES) {
            const headerLength = this.buffered.readUInt32BE(offset);
            const payloadLength = this.buffered.readUInt32BE(offset + 4);
            assertFrameLength("header length", headerLength, this.limits.maxHeaderBytes);
            assertFrameLength("payload length", payloadLength, this.limits.maxPayloadBytes);
            if (headerLength === 0) {
                throw new Error("Private frame header cannot be empty");
            }
            const frameLength = FRAME_PREFIX_BYTES + headerLength + payloadLength;
            if (this.buffered.length - offset < frameLength) {
                break;
            }
            const headerStart = offset + FRAME_PREFIX_BYTES;
            const payloadStart = headerStart + headerLength;
            let decoded;
            try {
                decoded = JSON.parse(this.buffered.toString("utf8", headerStart, payloadStart));
            }
            catch (error) {
                throw new Error(`Invalid private frame header JSON: ${error instanceof Error ? error.message : String(error)}`);
            }
            if (!isObjectHeader(decoded) || !this.validateHeader(decoded)) {
                throw new Error("Invalid private frame routing header");
            }
            frames.push({
                header: decoded,
                payload: Buffer.from(this.buffered.subarray(payloadStart, payloadStart + payloadLength)),
            });
            offset += frameLength;
        }
        if (offset > 0) {
            this.buffered = Buffer.from(this.buffered.subarray(offset));
        }
        return frames;
    }
    finish() {
        if (this.buffered.length !== 0) {
            throw new Error(`Private frame channel ended with ${this.buffered.length} incomplete bytes`);
        }
    }
}
export class PrivateFramedChannel {
    stream;
    limits;
    decoder;
    listeners = new Set();
    closed = false;
    constructor(stream, validateHeader, limits = DEFAULT_PRIVATE_FRAME_LIMITS) {
        this.stream = stream;
        this.limits = limits;
        this.decoder = new PrivateFrameDecoder(validateHeader, limits);
        stream.on("data", this.handleData);
        stream.on("end", this.handleEnd);
        stream.on("close", this.handleClose);
    }
    onFrame(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    async send(header, payload) {
        if (this.closed || this.stream.destroyed) {
            throw new Error("Private frame channel is closed");
        }
        const frame = encodePrivateFrame(header, payload, this.limits);
        await new Promise((resolve, reject) => {
            this.stream.write(frame, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    close() {
        if (this.closed) {
            return;
        }
        this.closed = true;
        this.detach();
        this.stream.end();
    }
    handleData = (chunk) => {
        try {
            for (const frame of this.decoder.push(chunk)) {
                for (const listener of this.listeners) {
                    listener(frame);
                }
            }
        }
        catch (error) {
            this.stream.destroy(error instanceof Error ? error : new Error(String(error)));
        }
    };
    handleEnd = () => {
        try {
            this.decoder.finish();
        }
        catch (error) {
            this.stream.destroy(error instanceof Error ? error : new Error(String(error)));
        }
    };
    handleClose = () => {
        this.closed = true;
        this.detach();
    };
    detach() {
        this.stream.off("data", this.handleData);
        this.stream.off("end", this.handleEnd);
        this.stream.off("close", this.handleClose);
        this.listeners.clear();
    }
}
//# sourceMappingURL=private-framing.js.map
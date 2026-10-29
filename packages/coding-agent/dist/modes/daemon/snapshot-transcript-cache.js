import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
export const SNAPSHOT_TARGET_CHUNK_BYTES = 512 * 1024;
export const SNAPSHOT_MEMORY_CACHE_BYTES = 4 * 1024 * 1024;
export function createSnapshotTranscriptChunks(options) {
    const messages = [...options.messages];
    const targetChunkBytes = options.targetChunkBytes ?? SNAPSHOT_TARGET_CHUNK_BYTES;
    return {
        *[Symbol.iterator]() {
            options.signal?.throwIfAborted();
            let serializedMessages = [];
            let serializedBytes = 0;
            let index = 0;
            const flush = () => {
                if (serializedMessages.length === 0) {
                    return undefined;
                }
                const prefix = `{"type":"session_snapshot_chunk","activeSessionId":${JSON.stringify(options.activeSessionId)},` +
                    `"snapshotId":${JSON.stringify(options.snapshotId)},"index":${index},"messages":[`;
                const line = Buffer.from(`${prefix}${serializedMessages.join(",")}]}\n`);
                serializedMessages = [];
                serializedBytes = 0;
                index++;
                return line;
            };
            for (const message of messages) {
                options.signal?.throwIfAborted();
                const serialized = JSON.stringify(message);
                const bytes = Buffer.byteLength(serialized) + (serializedMessages.length > 0 ? 1 : 0);
                if (serializedMessages.length > 0 && serializedBytes + bytes > targetChunkBytes) {
                    const chunk = flush();
                    if (chunk)
                        yield chunk;
                }
                serializedMessages.push(serialized);
                serializedBytes += bytes;
            }
            options.signal?.throwIfAborted();
            const chunk = flush();
            if (chunk)
                yield chunk;
        },
    };
}
export class SnapshotTranscriptCache {
    options;
    chunks = [];
    cacheDirectory;
    totalBytes = 0;
    completed = false;
    readers = 0;
    disposeRequested = false;
    disposed = false;
    failure;
    chunkWaiters = new Map();
    targetChunkBytes;
    snapshotId;
    activeSessionId;
    constructor(options) {
        this.options = options;
        this.targetChunkBytes = options.targetChunkBytes ?? SNAPSHOT_TARGET_CHUNK_BYTES;
        this.snapshotId = options.snapshotId;
        this.activeSessionId = options.activeSessionId;
        if (options.messages) {
            this.encodeMessages(options.messages);
            this.completed = true;
        }
    }
    get chunkCount() {
        return this.chunks.length;
    }
    get complete() {
        return this.completed && !this.failure && !this.disposed;
    }
    get bytes() {
        return this.totalBytes;
    }
    get fileBacked() {
        return this.cacheDirectory !== undefined;
    }
    readChunk(index) {
        const chunk = this.chunks[index];
        if (!chunk) {
            throw new Error(`Unknown snapshot transcript chunk: ${index}`);
        }
        if (chunk.buffer) {
            return chunk.buffer;
        }
        if (!chunk.path) {
            throw new Error(`Snapshot transcript chunk ${index} has no backing storage`);
        }
        return readFileSync(chunk.path);
    }
    *[Symbol.iterator]() {
        for (let index = 0; index < this.chunkCount; index++) {
            yield this.readChunk(index);
        }
    }
    appendEncodedChunk(buffer) {
        if (this.completed || this.failure || this.disposed) {
            throw new Error(`Snapshot transcript ${this.snapshotId} is not writable`);
        }
        this.storeChunk(buffer);
    }
    markComplete() {
        if (this.completed) {
            return;
        }
        if (this.failure || this.disposed) {
            throw new Error(`Snapshot transcript ${this.snapshotId} cannot be completed`);
        }
        this.completed = true;
        for (const [index, waiters] of this.chunkWaiters) {
            if (index < this.chunks.length) {
                continue;
            }
            for (const waiter of waiters) {
                waiter.resolve(undefined);
            }
            this.chunkWaiters.delete(index);
        }
    }
    markFailed(error) {
        if (this.failure) {
            return;
        }
        this.failure = error;
        for (const waiters of this.chunkWaiters.values()) {
            for (const waiter of waiters) {
                waiter.reject(error);
            }
        }
        this.chunkWaiters.clear();
    }
    waitForChunk(index) {
        if (this.failure) {
            return Promise.reject(this.failure);
        }
        if (index < this.chunks.length) {
            return Promise.resolve(this.readChunk(index));
        }
        if (this.completed) {
            return Promise.resolve(undefined);
        }
        return new Promise((resolve, reject) => {
            const waiters = this.chunkWaiters.get(index) ?? [];
            waiters.push({ resolve, reject });
            this.chunkWaiters.set(index, waiters);
        });
    }
    retain() {
        if (this.disposed) {
            throw new Error(`Snapshot transcript ${this.snapshotId} was disposed`);
        }
        this.readers++;
        let released = false;
        return () => {
            if (released)
                return;
            released = true;
            this.readers--;
            if (this.readers === 0 && this.disposeRequested) {
                this.disposeNow();
            }
        };
    }
    dispose() {
        if (this.disposed || this.disposeRequested)
            return;
        this.disposeRequested = true;
        if (this.readers > 0)
            return;
        this.disposeNow();
    }
    disposeNow() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.markFailed(new Error(`Snapshot transcript ${this.snapshotId} was disposed`));
        if (this.cacheDirectory) {
            rmSync(this.cacheDirectory, { recursive: true, force: true });
            this.cacheDirectory = undefined;
        }
        this.chunks.length = 0;
    }
    encodeMessages(messages) {
        let serializedMessages = [];
        let serializedBytes = 0;
        const flush = () => {
            if (serializedMessages.length === 0) {
                return;
            }
            const index = this.chunks.length;
            const prefix = `{"type":"session_snapshot_chunk","activeSessionId":${JSON.stringify(this.options.activeSessionId)},` +
                `"snapshotId":${JSON.stringify(this.options.snapshotId)},"index":${index},"messages":[`;
            const line = Buffer.from(`${prefix}${serializedMessages.join(",")}]}\n`);
            this.storeChunk(line);
            serializedMessages = [];
            serializedBytes = 0;
        };
        for (const message of messages) {
            const serialized = JSON.stringify(message);
            const bytes = Buffer.byteLength(serialized) + (serializedMessages.length > 0 ? 1 : 0);
            if (serializedMessages.length > 0 && serializedBytes + bytes > this.targetChunkBytes) {
                flush();
            }
            serializedMessages.push(serialized);
            serializedBytes += bytes;
        }
        flush();
    }
    storeChunk(buffer) {
        this.totalBytes += buffer.length;
        const memoryLimit = this.options.memoryCacheBytes ?? SNAPSHOT_MEMORY_CACHE_BYTES;
        if (!this.cacheDirectory && this.totalBytes > memoryLimit) {
            this.cacheDirectory = join(this.options.cacheRoot, this.options.snapshotId.replaceAll(/[^a-zA-Z0-9_-]/g, "_"));
            mkdirSync(this.cacheDirectory, { recursive: true, mode: 0o700 });
            for (let index = 0; index < this.chunks.length; index++) {
                const existing = this.chunks[index];
                if (!existing.buffer) {
                    continue;
                }
                const path = join(this.cacheDirectory, `${index}.jsonl`);
                writeFileSync(path, existing.buffer, { mode: 0o600 });
                this.chunks[index] = { path };
            }
        }
        if (this.cacheDirectory) {
            const path = join(this.cacheDirectory, `${this.chunks.length}.jsonl`);
            writeFileSync(path, buffer, { mode: 0o600 });
            this.chunks.push({ path });
        }
        else {
            this.chunks.push({ buffer });
        }
        const index = this.chunks.length - 1;
        const waiters = this.chunkWaiters.get(index);
        if (waiters) {
            const stored = this.readChunk(index);
            for (const waiter of waiters) {
                waiter.resolve(stored);
            }
            this.chunkWaiters.delete(index);
        }
    }
}
//# sourceMappingURL=snapshot-transcript-cache.js.map
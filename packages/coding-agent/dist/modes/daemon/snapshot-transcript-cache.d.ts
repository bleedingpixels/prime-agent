import type { AgentMessage } from "@earendil-works/pi-agent-core";
export declare const SNAPSHOT_TARGET_CHUNK_BYTES: number;
export declare const SNAPSHOT_MEMORY_CACHE_BYTES: number;
export interface SnapshotTranscriptCacheOptions {
    activeSessionId: string;
    snapshotId: string;
    messages?: readonly AgentMessage[];
    cacheRoot: string;
    targetChunkBytes?: number;
    memoryCacheBytes?: number;
}
export type SnapshotTranscriptChunkSource = (Iterable<Buffer> | AsyncIterable<Buffer>) & {
    markFailed?(error: Error): void;
    dispose?(): void;
};
export declare function createSnapshotTranscriptChunks(options: {
    activeSessionId: string;
    snapshotId: string;
    messages: readonly AgentMessage[];
    targetChunkBytes?: number;
    signal?: AbortSignal;
}): Iterable<Buffer>;
export declare class SnapshotTranscriptCache {
    private readonly options;
    private readonly chunks;
    private cacheDirectory?;
    private totalBytes;
    private completed;
    private readers;
    private disposeRequested;
    private disposed;
    private failure?;
    private readonly chunkWaiters;
    readonly targetChunkBytes: number;
    readonly snapshotId: string;
    readonly activeSessionId: string;
    constructor(options: SnapshotTranscriptCacheOptions);
    get chunkCount(): number;
    get complete(): boolean;
    get bytes(): number;
    get fileBacked(): boolean;
    readChunk(index: number): Buffer;
    [Symbol.iterator](): Iterator<Buffer>;
    appendEncodedChunk(buffer: Buffer): void;
    markComplete(): void;
    markFailed(error: Error): void;
    waitForChunk(index: number): Promise<Buffer | undefined>;
    retain(): () => void;
    dispose(): void;
    private disposeNow;
    private encodeMessages;
    private storeChunk;
}
//# sourceMappingURL=snapshot-transcript-cache.d.ts.map
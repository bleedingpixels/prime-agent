/**
 * Counting semaphore for bounding async concurrency. FIFO: waiters acquire in
 * the order they queued.
 */
export declare class Semaphore {
    private available;
    private readonly waiters;
    constructor(permits: number);
    get queueLength(): number;
    private acquire;
    private release;
    /** Run `fn` while holding a permit, releasing it even if `fn` throws. Rejects without running if `signal` aborts while queued. */
    run<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T>;
}
//# sourceMappingURL=semaphore.d.ts.map
/**
 * Counting semaphore for bounding async concurrency. FIFO: waiters acquire in
 * the order they queued.
 */
export class Semaphore {
    available;
    waiters = [];
    constructor(permits) {
        if (!Number.isInteger(permits) || permits < 1) {
            throw new Error(`Semaphore permits must be a positive integer, got ${permits}`);
        }
        this.available = permits;
    }
    get queueLength() {
        return this.waiters.length;
    }
    async acquire(signal) {
        if (signal?.aborted) {
            throw signal.reason ?? new Error("aborted");
        }
        if (this.available > 0) {
            this.available -= 1;
            return;
        }
        // A queued waiter can be aborted before it gets a permit; on abort it
        // removes itself from the queue so it never consumes a slot.
        await new Promise((resolve, reject) => {
            const waiter = () => {
                signal?.removeEventListener("abort", onAbort);
                resolve();
            };
            const onAbort = () => {
                const i = this.waiters.indexOf(waiter);
                if (i !== -1)
                    this.waiters.splice(i, 1);
                reject(signal?.reason ?? new Error("aborted"));
            };
            this.waiters.push(waiter);
            signal?.addEventListener("abort", onAbort, { once: true });
        });
    }
    release() {
        const next = this.waiters.shift();
        if (next) {
            next();
        }
        else {
            this.available += 1;
        }
    }
    /** Run `fn` while holding a permit, releasing it even if `fn` throws. Rejects without running if `signal` aborts while queued. */
    async run(fn, signal) {
        await this.acquire(signal);
        try {
            return await fn();
        }
        finally {
            this.release();
        }
    }
}
//# sourceMappingURL=semaphore.js.map
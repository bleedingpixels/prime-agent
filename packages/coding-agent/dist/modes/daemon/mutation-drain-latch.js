/** Counts in-flight mutating commands so update-restart preparation can wait for them to drain. */
export class MutationDrainLatch {
    active = 0;
    waiters = new Set();
    begin() {
        this.active++;
    }
    end() {
        this.active--;
        for (const resolve of this.waiters)
            resolve();
        this.waiters.clear();
    }
    async waitForDrain(remaining, signal, abortMessage) {
        if (signal.aborted)
            throw new Error(abortMessage);
        while (this.active > remaining) {
            await new Promise((resolve, reject) => {
                let settled = false;
                const settle = (error) => {
                    if (settled)
                        return;
                    settled = true;
                    this.waiters.delete(onDrained);
                    signal.removeEventListener("abort", onAbort);
                    if (error)
                        reject(error);
                    else
                        resolve();
                };
                const onDrained = () => settle();
                const onAbort = () => settle(new Error(abortMessage));
                this.waiters.add(onDrained);
                signal.addEventListener("abort", onAbort, { once: true });
            });
            if (signal.aborted)
                throw new Error(abortMessage);
        }
    }
}
//# sourceMappingURL=mutation-drain-latch.js.map
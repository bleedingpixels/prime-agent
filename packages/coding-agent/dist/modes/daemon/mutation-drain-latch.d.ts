/** Counts in-flight mutating commands so update-restart preparation can wait for them to drain. */
export declare class MutationDrainLatch {
    private active;
    private readonly waiters;
    begin(): void;
    end(): void;
    waitForDrain(remaining: number, signal: AbortSignal, abortMessage: string): Promise<void>;
}
//# sourceMappingURL=mutation-drain-latch.d.ts.map
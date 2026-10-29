export declare class PromptAdmissionCancelledError extends Error {
    constructor();
}
export declare function throwIfPromptAdmissionCancelled(signal: AbortSignal | undefined): void;
/**
 * Await `promise` unless `signal` aborts first. Always observes the supplied
 * work's rejection so a cancelled admission never leaks an unhandled rejection.
 */
export declare function waitForPromptAdmission<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T>;
//# sourceMappingURL=prompt-admission.d.ts.map
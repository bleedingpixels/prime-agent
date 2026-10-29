export declare function resolveKernelBootConcurrency(): number;
export declare function withKernelBootPermit<T>(boot: () => Promise<T>, signal?: AbortSignal): Promise<T>;
//# sourceMappingURL=boot-gate.d.ts.map
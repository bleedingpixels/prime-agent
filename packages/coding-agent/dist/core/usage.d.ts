import type { Usage } from "@earendil-works/pi-ai";
export declare function emptyUsage(): Usage;
export declare function addAssistantUsage(total: Usage, usage: Usage): void;
/** Remove a previously added usage, clamping at zero to absorb attribution drift. */
export declare function subtractAssistantUsage(total: Usage, usage: Usage): void;
export declare function cloneUsage(usage: Usage): Usage;
//# sourceMappingURL=usage.d.ts.map
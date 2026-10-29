import type { SessionInfo } from "./session-manager.js";
export type ResolvedSession = {
    type: "path";
    path: string;
} | {
    type: "local";
    path: string;
} | {
    type: "global";
    path: string;
    cwd: string;
};
export declare class SessionSelectorError extends Error {
    readonly selector: string;
    constructor(message: string, selector: string);
}
export declare class SessionSelectorNotFoundError extends SessionSelectorError {
    readonly suggestion?: string | undefined;
    constructor(selector: string, suggestion?: string | undefined);
}
export declare class SessionSelectorAmbiguousError extends SessionSelectorError {
    readonly matches: readonly SessionInfo[];
    constructor(selector: string, matches: readonly SessionInfo[]);
}
export declare function looksLikeSessionPath(selector: string): boolean;
export declare function resolveSessionPath(selector: string, cwd: string, sessionDir?: string): Promise<ResolvedSession>;
export declare function findClosestSessionId(selector: string, sessions: readonly Pick<SessionInfo, "id">[]): string | undefined;
//# sourceMappingURL=session-resolver.d.ts.map
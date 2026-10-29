export declare const MIN_NODE_VERSION: string;
export interface NodeVersionGuardIO {
    version: string;
    log: (message: string) => void;
    exit: (code: number) => void;
}
export declare function assertNodeVersion(io: NodeVersionGuardIO): boolean;
//# sourceMappingURL=node-version-check.d.ts.map
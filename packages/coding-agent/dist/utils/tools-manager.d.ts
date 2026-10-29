export type ManagedTool = "fd" | "rg";
export type ToolUnavailableReason = "offline" | "manual_install_required" | "unsupported_platform" | "download_failed";
export interface ToolAvailableResult {
    status: "available";
    path: string;
}
export interface ToolUnavailableResult {
    status: "unavailable";
    reason: ToolUnavailableReason;
    platform: string;
    architecture: string;
    detail?: string;
}
export type ToolEnsureResult = ToolAvailableResult | ToolUnavailableResult;
export declare function getToolPath(tool: ManagedTool): string | null;
export declare function formatMissingRipgrepMessage(result: ToolUnavailableResult): string;
export declare function ensureToolWithStatus(tool: ManagedTool, silent?: boolean): Promise<ToolEnsureResult>;
export declare function ensureTool(tool: ManagedTool, silent?: boolean): Promise<string | undefined>;
//# sourceMappingURL=tools-manager.d.ts.map
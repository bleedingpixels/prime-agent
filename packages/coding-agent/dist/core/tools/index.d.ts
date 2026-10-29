export { type BashOperations, type BashSpawnContext, type BashSpawnHook, type BashToolDetails, type BashToolInput, type BashToolOptions, createBashTool, createBashToolDefinition, createLocalBashOperations, } from "./bash.js";
export { createEditTool, createEditToolDefinition, type EditOperations, type EditToolDetails, type EditToolInput, type EditToolOptions, } from "./edit.js";
export { withFileMutationQueue } from "./file-mutation-queue.js";
export { createIpythonTool, createIpythonToolDefinition, IpythonKernelProvisioner, type IpythonToolDetails, type IpythonToolInput, type IpythonToolOptions, } from "./ipython.js";
export { DEFAULT_MAX_BYTES, DEFAULT_MAX_LINES, formatSize, type TruncationOptions, type TruncationResult, truncateHead, truncateLine, truncateTail, } from "./truncate.js";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import type { ToolDefinition } from "../extensions/types.js";
import { type IpythonToolOptions } from "./ipython.js";
export type Tool = AgentTool<any>;
export type ToolDef = ToolDefinition<any, any>;
export type ToolName = "ipython";
export declare const allToolNames: Set<ToolName>;
export interface ToolsOptions {
    ipython?: IpythonToolOptions;
}
export declare function createToolDefinition(toolName: ToolName, cwd: string, options?: ToolsOptions): ToolDef;
export declare function createTool(toolName: ToolName, cwd: string, options?: ToolsOptions): Tool;
export declare function createAllToolDefinitions(cwd: string, options?: ToolsOptions): Record<ToolName, ToolDef>;
export declare function createAllTools(cwd: string, options?: ToolsOptions): Record<ToolName, Tool>;
//# sourceMappingURL=index.d.ts.map
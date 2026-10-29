export { createBashTool, createBashToolDefinition, createLocalBashOperations, } from "./bash.js";
export { createEditTool, createEditToolDefinition, } from "./edit.js";
export { withFileMutationQueue } from "./file-mutation-queue.js";
export { createIpythonTool, createIpythonToolDefinition, IpythonKernelProvisioner, } from "./ipython.js";
export { DEFAULT_MAX_BYTES, DEFAULT_MAX_LINES, formatSize, truncateHead, truncateLine, truncateTail, } from "./truncate.js";
import { createIpythonTool, createIpythonToolDefinition } from "./ipython.js";
export const allToolNames = new Set(["ipython"]);
export function createToolDefinition(toolName, cwd, options) {
    switch (toolName) {
        case "ipython":
            return createIpythonToolDefinition(cwd, options?.ipython);
        default:
            throw new Error(`Unknown tool name: ${toolName}`);
    }
}
export function createTool(toolName, cwd, options) {
    switch (toolName) {
        case "ipython":
            return createIpythonTool(cwd, options?.ipython);
        default:
            throw new Error(`Unknown tool name: ${toolName}`);
    }
}
export function createAllToolDefinitions(cwd, options) {
    return {
        ipython: createIpythonToolDefinition(cwd, options?.ipython),
    };
}
export function createAllTools(cwd, options) {
    return {
        ipython: createIpythonTool(cwd, options?.ipython),
    };
}
//# sourceMappingURL=index.js.map
/**
 * Extension system types.
 *
 * Extensions are TypeScript modules that can:
 * - Subscribe to agent lifecycle events
 * - Register LLM-callable tools
 * - Register commands, keyboard shortcuts, and CLI flags
 * - Interact with the user via UI primitives
 */
/**
 * Preserve parameter inference for standalone tool definitions.
 *
 * Use this when assigning a tool to a variable or passing it through arrays such
 * as `customTools`, where contextual typing would otherwise widen params to
 * `unknown`.
 */
export function defineTool(tool) {
    return tool;
}
// Type guards for ToolResultEvent
export function isBashToolResult(e) {
    return e.toolName === "bash";
}
export function isEditToolResult(e) {
    return e.toolName === "edit";
}
export function isIpythonToolResult(e) {
    return e.toolName === "ipython";
}
export function isToolCallEventType(toolName, event) {
    return event.toolName === toolName;
}
//# sourceMappingURL=types.js.map
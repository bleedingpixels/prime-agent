/**
 * Tool wrappers for extension-registered tools.
 *
 * These wrappers only adapt tool execution so extension tools receive the runner context.
 * Tool call and tool result interception is handled by AgentSession via agent-core hooks.
 */
import { wrapToolDefinition, wrapToolDefinitions } from "../tools/tool-definition-wrapper.js";
function toRunnerGetter(source) {
    return typeof source === "function" ? source : () => source;
}
/**
 * Wrap a RegisteredTool into an AgentTool.
 * Uses the runner's createContext() for consistent context across tools and event handlers.
 */
export function wrapRegisteredTool(registeredTool, runner) {
    const getRunner = toRunnerGetter(runner);
    return wrapToolDefinition(registeredTool.definition, () => getRunner().createContext());
}
/**
 * Wrap all registered tools into AgentTools.
 * Uses the runner's createContext() for consistent context across tools and event handlers.
 */
export function wrapRegisteredTools(registeredTools, runner) {
    const getRunner = toRunnerGetter(runner);
    return wrapToolDefinitions(registeredTools.map((registeredTool) => registeredTool.definition), () => getRunner().createContext());
}
//# sourceMappingURL=wrapper.js.map
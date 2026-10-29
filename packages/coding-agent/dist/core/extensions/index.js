/**
 * Extension system for lifecycle events and custom tools.
 */
// Built-in extensions
export { createHerdrAgentStateExtension, hasFileBasedHerdrIntegration, herdrAgentStateExtension, } from "./builtin/herdr-agent-state.js";
export { createExtensionRuntime, discoverAndLoadExtensions, loadExtensionFromFactory, loadExtensions, } from "./loader.js";
export { ExtensionRunner } from "./runner.js";
// Type guards
export { defineTool, isBashToolResult, isEditToolResult, isIpythonToolResult, isToolCallEventType, } from "./types.js";
export { wrapRegisteredTool, wrapRegisteredTools } from "./wrapper.js";
//# sourceMappingURL=index.js.map
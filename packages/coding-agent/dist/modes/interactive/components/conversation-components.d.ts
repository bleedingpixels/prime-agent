import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { Component, MarkdownTheme, TUI } from "@earendil-works/pi-tui";
import { type ToolExecutionDefinition, type ToolExecutionOptions } from "./tool-execution.js";
export interface ConversationComponentsOptions {
    ui: TUI;
    cwd: string;
    toolOptions: ToolExecutionOptions;
    getToolDefinition: (name: string) => ToolExecutionDefinition | undefined;
    markdownTheme?: MarkdownTheme;
    hideThinkingBlock?: boolean;
    hiddenThinkingLabel?: string;
    toolsExpanded?: boolean;
    agentMessagesExpanded?: boolean;
    isRecognizedSlashCommand?: (name: string) => boolean;
}
export declare function isCompactAgentMessageNeighbor(component: Component | undefined): boolean;
/** Build conversation components from a message list, matching tool results to their calls. */
export declare function buildConversationComponents(messages: readonly AgentMessage[], options: ConversationComponentsOptions): Component[];
//# sourceMappingURL=conversation-components.d.ts.map
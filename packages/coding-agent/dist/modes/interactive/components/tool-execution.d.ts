import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import { type Component, Container, type TUI } from "@earendil-works/pi-tui";
import type { ToolRenderContext, ToolRenderResultOptions } from "../../../core/extensions/types.js";
import type { KernelSentAgentMessage } from "../../../core/kernel/index.js";
import type { AgentConnectionToolDefinition } from "../../agent-connection/index.js";
import { type Theme } from "../theme/theme.js";
export interface ToolExecutionOptions {
    showImages?: boolean;
    /** Whether image metadata may parse dimensions from base64 data. */
    includeImageDimensions?: boolean;
}
export interface ToolExecutionRendererDefinition {
    renderShell?: "default" | "self";
    renderCall?: (args: any, theme: Theme, context: ToolRenderContext<any, any>) => Component;
    renderResult?: (result: AgentToolResult<any>, options: ToolRenderResultOptions, theme: Theme, context: ToolRenderContext<any, any>) => Component;
}
export type ToolExecutionDefinition = AgentConnectionToolDefinition & Partial<ToolExecutionRendererDefinition>;
export declare class ToolExecutionComponent extends Container {
    private contentPanel;
    private selfRenderContainer;
    private callRendererComponent?;
    private resultRendererComponent?;
    private ipythonCellComponent?;
    private rendererState;
    private imageComponents;
    private toolName;
    private toolCallId;
    private args;
    private expanded;
    private showExpandHint;
    private showImages;
    private includeImageDimensions;
    private isPartial;
    private toolDefinition?;
    private builtInToolDefinition?;
    private ui;
    private cwd;
    private executionStarted;
    private argsComplete;
    private pendingSentAgentMessages;
    private result?;
    private hideComponent;
    constructor(toolName: string, toolCallId: string, args: any, options: ToolExecutionOptions | undefined, toolDefinition: ToolExecutionDefinition | undefined, ui: TUI, cwd: string);
    private getCallRenderer;
    private getResultRenderer;
    private hasRendererDefinition;
    private getRenderShell;
    private shouldUseIpythonRenderer;
    private getRenderContext;
    private createCallFallback;
    private createResultFallback;
    updateArgs(args: any): void;
    markExecutionStarted(): void;
    setArgsComplete(): void;
    updateResult(result: {
        content: Array<{
            type: string;
            text?: string;
            data?: string;
            mimeType?: string;
        }>;
        details?: any;
        isError: boolean;
    }, isPartial?: boolean): void;
    appendSentAgentMessage(message: KernelSentAgentMessage): void;
    setExpanded(expanded: boolean): void;
    setShowExpandHint(show: boolean): void;
    setShowImages(show: boolean): void;
    setIncludeImageDimensions(include: boolean): void;
    invalidate(): void;
    render(width: number): string[];
    private isStatusAnimating;
    private usesSelfRenderShell;
    private updateDisplay;
    /**
     * Mount the call/result renderer components into the given shell container.
     * `useFallbacks` keeps the bold-tool-name call fallback for self-rendering
     * tools; the default panel shell already names the tool in its header.
     */
    private mountRenderers;
    private panelHeader;
    private panelStatus;
    private getTextOutput;
    private formatToolExecution;
}
export declare function selectLatestToolExpandHint(existingComponents: readonly Component[], latestComponent: ToolExecutionComponent): void;
//# sourceMappingURL=tool-execution.d.ts.map
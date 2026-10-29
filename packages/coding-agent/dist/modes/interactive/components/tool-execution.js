import { Container, Image, Text } from "@earendil-works/pi-tui";
import { createBashToolDefinition } from "../../../core/tools/bash.js";
import { createEditToolDefinition } from "../../../core/tools/edit.js";
import { createAllToolDefinitions } from "../../../core/tools/index.js";
import { getTextOutput as getRenderedTextOutput } from "../../../core/tools/render-utils.js";
import { theme } from "../theme/theme.js";
import { getWorkingPulseFrame, workingIconFrame } from "../theme/working-icon.js";
import { FileChangeSummaryComponent, getToolFileChanges } from "./edit-summary.js";
import { getIpythonCodeFromArgs, IPythonCellComponent } from "./ipython-cell.js";
import { ToolPanel } from "./tool-panel.js";
function hasToolRenderer(toolDefinition) {
    return toolDefinition?.renderCall !== undefined || toolDefinition?.renderResult !== undefined;
}
function matchesBuiltInReplayMetadata(toolName, toolDefinition) {
    if (!toolDefinition) {
        return true;
    }
    if (hasToolRenderer(toolDefinition)) {
        return false;
    }
    return toolDefinition.replayBuiltInToolName === toolName;
}
function createReplayBuiltInToolDefinition(toolName, cwd, toolDefinition) {
    if (toolName === "ipython") {
        return createAllToolDefinitions(cwd).ipython;
    }
    switch (toolName) {
        case "bash": {
            const builtInDefinition = createBashToolDefinition(cwd);
            return matchesBuiltInReplayMetadata(toolName, toolDefinition) ? builtInDefinition : undefined;
        }
        case "edit": {
            const builtInDefinition = createEditToolDefinition(cwd);
            return matchesBuiltInReplayMetadata(toolName, toolDefinition) ? builtInDefinition : undefined;
        }
        default:
            return undefined;
    }
}
export class ToolExecutionComponent extends Container {
    contentPanel;
    selfRenderContainer;
    callRendererComponent;
    resultRendererComponent;
    ipythonCellComponent;
    rendererState = {};
    imageComponents = [];
    toolName;
    toolCallId;
    args;
    expanded = false;
    showExpandHint = true;
    showImages;
    includeImageDimensions;
    isPartial = true;
    toolDefinition;
    builtInToolDefinition;
    ui;
    cwd;
    executionStarted = false;
    argsComplete = false;
    pendingSentAgentMessages = [];
    result;
    hideComponent = false;
    constructor(toolName, toolCallId, args, options = {}, toolDefinition, ui, cwd) {
        super();
        this.toolName = toolName;
        this.toolCallId = toolCallId;
        this.args = args;
        this.toolDefinition = toolDefinition;
        this.builtInToolDefinition = createReplayBuiltInToolDefinition(toolName, cwd, toolDefinition);
        this.showImages = options.showImages ?? true;
        this.includeImageDimensions = options.includeImageDimensions ?? true;
        this.ui = ui;
        this.cwd = cwd;
        // Always create both shell variants. contentPanel is the tool panel used
        // for default renderer-based composition (and the generic fallback when no
        // tool definition exists). selfRenderContainer is used when the tool
        // renders its own framing.
        this.contentPanel = new ToolPanel();
        this.selfRenderContainer = new Container();
        if (this.hasRendererDefinition() && this.getRenderShell() === "self") {
            this.addChild(this.selfRenderContainer);
        }
        else {
            this.addChild(this.contentPanel);
        }
        this.updateDisplay();
    }
    getCallRenderer() {
        if (!this.builtInToolDefinition) {
            return this.toolDefinition?.renderCall;
        }
        if (!this.toolDefinition) {
            return this.builtInToolDefinition.renderCall;
        }
        return this.toolDefinition.renderCall ?? this.builtInToolDefinition.renderCall;
    }
    getResultRenderer() {
        if (!this.builtInToolDefinition) {
            return this.toolDefinition?.renderResult;
        }
        if (!this.toolDefinition) {
            return this.builtInToolDefinition.renderResult;
        }
        return this.toolDefinition.renderResult ?? this.builtInToolDefinition.renderResult;
    }
    hasRendererDefinition() {
        return this.builtInToolDefinition !== undefined || this.toolDefinition !== undefined;
    }
    getRenderShell() {
        if (this.shouldUseIpythonRenderer()) {
            return "self";
        }
        if (!this.builtInToolDefinition) {
            return this.toolDefinition?.renderShell ?? "default";
        }
        if (!this.toolDefinition) {
            return this.builtInToolDefinition.renderShell ?? "default";
        }
        return this.toolDefinition.renderShell ?? this.builtInToolDefinition.renderShell ?? "default";
    }
    shouldUseIpythonRenderer() {
        return this.toolName === "ipython" && !this.toolDefinition?.renderCall && !this.toolDefinition?.renderResult;
    }
    getRenderContext(lastComponent) {
        return {
            args: this.args,
            toolCallId: this.toolCallId,
            invalidate: () => {
                this.invalidate();
                this.ui.requestRender();
            },
            lastComponent,
            state: this.rendererState,
            cwd: this.cwd,
            executionStarted: this.executionStarted,
            argsComplete: this.argsComplete,
            isPartial: this.isPartial,
            expanded: this.expanded,
            showExpandHint: this.showExpandHint,
            showImages: this.showImages,
            includeImageDimensions: this.includeImageDimensions,
            isError: this.result?.isError ?? false,
        };
    }
    createCallFallback() {
        return new Text(theme.fg("toolTitle", theme.bold(this.toolName)), 0, 0);
    }
    createResultFallback() {
        const output = this.getTextOutput();
        if (!output) {
            return undefined;
        }
        return new Text(theme.fg("toolOutput", output), 0, 0);
    }
    updateArgs(args) {
        this.args = args;
        this.updateDisplay();
    }
    markExecutionStarted() {
        this.executionStarted = true;
        this.updateDisplay();
        this.ui.requestRender();
    }
    setArgsComplete() {
        this.argsComplete = true;
        this.updateDisplay();
        this.ui.requestRender();
    }
    updateResult(result, isPartial = false) {
        const details = typeof result.details === "object" && result.details !== null
            ? result.details
            : {};
        const sentAgentMessages = Array.isArray(details.sentAgentMessages) ? [...details.sentAgentMessages] : [];
        for (const message of this.pendingSentAgentMessages) {
            if (!sentAgentMessages.some((entry) => typeof entry === "object" && entry !== null && "id" in entry && entry.id === message.id)) {
                sentAgentMessages.push(message);
            }
        }
        this.result = sentAgentMessages.length > 0 ? { ...result, details: { ...details, sentAgentMessages } } : result;
        this.isPartial = isPartial;
        this.updateDisplay();
    }
    appendSentAgentMessage(message) {
        if (this.pendingSentAgentMessages.some((entry) => entry.id === message.id)) {
            return;
        }
        this.pendingSentAgentMessages.push(message);
        if (this.result) {
            this.updateResult(this.result, this.isPartial);
        }
    }
    setExpanded(expanded) {
        this.expanded = expanded;
        this.updateDisplay();
    }
    setShowExpandHint(show) {
        if (this.showExpandHint === show) {
            return;
        }
        this.showExpandHint = show;
        this.updateDisplay();
    }
    setShowImages(show) {
        this.showImages = show;
        this.updateDisplay();
    }
    setIncludeImageDimensions(include) {
        this.includeImageDimensions = include;
        this.updateDisplay();
    }
    invalidate() {
        super.invalidate();
        this.updateDisplay();
    }
    render(width) {
        if (this.hideComponent) {
            return [];
        }
        // Refresh the animated glyph without rebuilding the whole panel, for as long
        // as panelStatus() is still animating (including partial streaming results).
        if (this.isStatusAnimating() && !this.usesSelfRenderShell()) {
            this.contentPanel.setHeader(this.panelHeader());
        }
        return super.render(width);
    }
    isStatusAnimating() {
        if (!this.executionStarted) {
            return false;
        }
        // Matches panelStatus(): animating until a non-partial or error result lands.
        if (this.result && !this.isPartial) {
            return false;
        }
        return !this.result?.isError;
    }
    usesSelfRenderShell() {
        return this.hasRendererDefinition() && this.getRenderShell() === "self";
    }
    updateDisplay() {
        let hasContent = false;
        this.hideComponent = false;
        if (this.hasRendererDefinition() && this.getRenderShell() === "self") {
            this.selfRenderContainer.clear();
            if (this.shouldUseIpythonRenderer()) {
                const state = {
                    code: getIpythonCodeFromArgs(this.args),
                    content: this.result?.content,
                    details: this.result?.details,
                    isPartial: this.isPartial,
                    isError: this.result?.isError ?? false,
                    expanded: this.expanded,
                    executionStarted: this.executionStarted,
                    argsComplete: this.argsComplete,
                    showExpandHint: this.showExpandHint,
                    showImages: this.showImages,
                    cwd: this.cwd,
                };
                if (!this.ipythonCellComponent) {
                    this.ipythonCellComponent = new IPythonCellComponent(state);
                }
                else {
                    this.ipythonCellComponent.update(state);
                }
                this.selfRenderContainer.addChild(this.ipythonCellComponent);
                hasContent = true;
            }
            else {
                hasContent = this.mountRenderers(this.selfRenderContainer, true);
            }
        }
        else {
            // Default shell: tool panel with a `label · status` header so the block
            // is self-identifying. The header replaces the bold-tool-name fallback.
            this.contentPanel.setHeader(this.panelHeader());
            this.contentPanel.clear();
            if (this.hasRendererDefinition()) {
                this.mountRenderers(this.contentPanel, false);
            }
            else {
                const fallbackText = this.formatToolExecution();
                if (fallbackText) {
                    this.contentPanel.addChild(new Text(fallbackText, 0, 0));
                }
            }
            hasContent = true;
        }
        for (const img of this.imageComponents) {
            this.removeChild(img);
        }
        this.imageComponents = [];
        if (this.result) {
            const imageBlocks = this.result.content.filter((c) => c.type === "image");
            for (let i = 0; i < imageBlocks.length; i++) {
                const img = imageBlocks[i];
                if (!this.showImages || !img.data || !img.mimeType)
                    continue;
                const imageComponent = new Image(img.data, img.mimeType, { fallbackColor: (s) => theme.fg("toolOutput", s) }, {
                    fallbackOnly: true,
                    fallbackPrefix: "    ╰─ ",
                });
                this.imageComponents.push(imageComponent);
                this.addChild(imageComponent);
            }
        }
        const isBuiltInEdit = this.toolName === "edit" &&
            (this.toolDefinition === undefined || this.toolDefinition.replayBuiltInToolName === "edit");
        if (!this.expanded && this.result && (isBuiltInEdit || this.shouldUseIpythonRenderer())) {
            const changes = getToolFileChanges(this.toolName, this.args, this.result, this.cwd);
            if (changes.length > 0) {
                const container = this.usesSelfRenderShell() ? this.selfRenderContainer : this.contentPanel;
                container.addChild(new FileChangeSummaryComponent(changes, this.cwd));
                hasContent = true;
            }
        }
        if (this.hasRendererDefinition() && !hasContent && this.imageComponents.length === 0) {
            this.hideComponent = true;
        }
    }
    /**
     * Mount the call/result renderer components into the given shell container.
     * `useFallbacks` keeps the bold-tool-name call fallback for self-rendering
     * tools; the default panel shell already names the tool in its header.
     */
    mountRenderers(container, useFallbacks) {
        let hasContent = false;
        const callRenderer = this.getCallRenderer();
        if (!callRenderer) {
            if (useFallbacks) {
                container.addChild(this.createCallFallback());
                hasContent = true;
            }
        }
        else {
            try {
                const component = callRenderer(this.args, theme, this.getRenderContext(this.callRendererComponent));
                this.callRendererComponent = component;
                container.addChild(component);
                hasContent = true;
            }
            catch {
                this.callRendererComponent = undefined;
                if (useFallbacks) {
                    container.addChild(this.createCallFallback());
                    hasContent = true;
                }
            }
        }
        if (this.result) {
            const resultRenderer = this.getResultRenderer();
            if (!resultRenderer) {
                const component = this.createResultFallback();
                if (component) {
                    container.addChild(component);
                    hasContent = true;
                }
            }
            else {
                try {
                    const component = resultRenderer({ content: this.result.content, details: this.result.details }, { expanded: this.expanded, isPartial: this.isPartial }, theme, this.getRenderContext(this.resultRendererComponent));
                    this.resultRendererComponent = component;
                    container.addChild(component);
                    hasContent = true;
                }
                catch {
                    this.resultRendererComponent = undefined;
                    const component = this.createResultFallback();
                    if (component) {
                        container.addChild(component);
                        hasContent = true;
                    }
                }
            }
        }
        return hasContent;
    }
    panelHeader() {
        const label = this.toolDefinition?.label ?? this.builtInToolDefinition?.label ?? this.toolName;
        return `${theme.fg("muted", label)}${theme.fg("dim", " · ")}${this.panelStatus()}`;
    }
    panelStatus() {
        if (this.result && !this.isPartial) {
            return this.result.isError ? theme.fg("error", "error") : theme.fg("success", "done");
        }
        if (this.result?.isError) {
            return theme.fg("error", "error");
        }
        if (this.executionStarted) {
            return theme.fg("bashMode", `${workingIconFrame(getWorkingPulseFrame())} running`);
        }
        return theme.fg("muted", "queued");
    }
    getTextOutput() {
        return getRenderedTextOutput(this.result, this.showImages, {
            includeImageDimensions: this.includeImageDimensions,
        });
    }
    formatToolExecution() {
        const parts = [];
        const content = JSON.stringify(this.args, null, 2);
        if (content) {
            parts.push(content);
        }
        const output = this.getTextOutput();
        if (output) {
            parts.push(output);
        }
        return parts.join("\n\n");
    }
}
export function selectLatestToolExpandHint(existingComponents, latestComponent) {
    for (let index = existingComponents.length - 1; index >= 0; index--) {
        const component = existingComponents[index];
        if (component instanceof ToolExecutionComponent) {
            component.setShowExpandHint(false);
            break;
        }
    }
    latestComponent.setShowExpandHint(true);
}
//# sourceMappingURL=tool-execution.js.map
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.js";
export const TOOL_PANEL_PADDING_X = 2;
export function toolPanelContentWidth(width) {
    return Math.max(1, width - TOOL_PANEL_PADDING_X * 2);
}
/**
 * Format a single tool panel line: content indented by the panel padding and
 * padded to the full width, on the subtle panel background that groups the
 * block.
 */
export function toolPanelLine(line, width) {
    const contentWidth = toolPanelContentWidth(width);
    const truncated = truncateToWidth(line, contentWidth, "");
    const padding = " ".repeat(Math.max(0, contentWidth - visibleWidth(truncated)));
    const sidePad = " ".repeat(TOOL_PANEL_PADDING_X);
    return theme.bg("toolPanelBg", `${sidePad}${truncated}${padding}${sidePad}`);
}
/**
 * Panel shell for tool executions: a status header line followed by the
 * tool's own call/result components, every line on the panel background so
 * the whole block reads as one unit. Children render at the reduced content
 * width; lines that still overflow are truncated, matching ipython cell
 * behavior.
 */
export class ToolPanel {
    children = [];
    header = "";
    cache;
    setHeader(header) {
        this.header = header;
    }
    addChild(component) {
        this.children.push(component);
        this.cache = undefined;
    }
    clear() {
        this.children = [];
        this.cache = undefined;
    }
    invalidate() {
        this.cache = undefined;
        for (const child of this.children) {
            child.invalidate?.();
        }
    }
    render(width) {
        const childLines = [];
        for (const child of this.children) {
            childLines.push(...child.render(toolPanelContentWidth(width)));
        }
        // The background sample detects theme changes that don't go through
        // invalidate().
        const bgSample = theme.bg("toolPanelBg", " ");
        const cache = this.cache;
        if (cache &&
            cache.width === width &&
            cache.header === this.header &&
            cache.bgSample === bgSample &&
            cache.childLines.length === childLines.length &&
            cache.childLines.every((line, i) => line === childLines[i])) {
            return cache.lines;
        }
        const lines = [toolPanelLine(this.header, width)];
        if (childLines.length > 0) {
            lines.push(toolPanelLine("", width));
            for (const line of childLines) {
                lines.push(toolPanelLine(line, width));
            }
        }
        this.cache = { width, header: this.header, bgSample, childLines, lines };
        return lines;
    }
}
//# sourceMappingURL=tool-panel.js.map
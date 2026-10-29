import { getKeybindings, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.js";
import { keyText } from "./keybinding-hints.js";
export function countDirectSubagentStatuses(children, parentId, activeHeartbeatSessionIds) {
    let total = 0;
    let running = 0;
    let idle = 0;
    for (const child of children) {
        if (child.parentId !== parentId || child.status === "cancelled")
            continue;
        total += 1;
        const isRunning = child.status === "running" ||
            child.status === "queued" ||
            child.activity !== undefined ||
            (child.activeSessionId !== undefined && activeHeartbeatSessionIds.has(child.activeSessionId));
        if (isRunning) {
            running += 1;
        }
        else if ((child.status === "done" || child.status === "error") && child.activeSessionId !== undefined) {
            idle += 1;
        }
    }
    return { total, running, idle, inactive: total - running - idle };
}
/** One-line entry into the current session's scoped agents view. */
export class SubagentSummaryLine {
    getLocationLabel;
    getContextLabel;
    getOverrideLabel;
    focused = false;
    counts = { total: 0, running: 0, idle: 0, inactive: 0 };
    openable = false;
    onOpen;
    onCancel;
    onChatAction;
    constructor(getLocationLabel = () => undefined, getContextLabel = () => undefined, getOverrideLabel = () => undefined) {
        this.getLocationLabel = getLocationLabel;
        this.getContextLabel = getContextLabel;
        this.getOverrideLabel = getOverrideLabel;
    }
    setSubagentCounts(counts) {
        this.counts = counts;
    }
    setOpenable(openable) {
        this.openable = openable;
    }
    isSelectable() {
        return this.counts.total > 0 && this.openable;
    }
    handleInput(data) {
        const keybindings = getKeybindings();
        if (keybindings.matches(data, "tui.select.confirm") || keybindings.matches(data, "app.agents.open")) {
            if (this.isSelectable())
                this.onOpen?.();
            return;
        }
        if (keybindings.matches(data, "tui.select.up") ||
            keybindings.matches(data, "tui.select.cancel") ||
            keybindings.matches(data, "app.agents.back")) {
            this.onCancel?.();
            return;
        }
        this.onChatAction?.(data);
    }
    render(width) {
        const lines = this.renderInfoLine(width);
        if (this.counts.total === 0)
            return lines;
        const summary = `${this.counts.total} subagent${this.counts.total === 1 ? "" : "s"}: ${this.counts.running} running · ${this.counts.idle} idle · ${this.counts.inactive} inactive`;
        const openHint = this.openable
            ? `  ${keyText("tui.select.confirm")} or ${keyText("app.agents.open")} to open`
            : "";
        const text = `${this.focused ? "▸" : " "} ${summary}${openHint}`;
        const line = truncateToWidth(text, width, "…");
        lines.push(this.focused ? theme.bg("selectedBg", line.padEnd(width)) : theme.fg("dim", line));
        return lines;
    }
    renderInfoLine(width) {
        const overrideLabel = this.getOverrideLabel()?.trim();
        const locationLabel = this.getLocationLabel()?.trim();
        const contextLabel = this.getContextLabel()?.trim();
        const left = overrideLabel || locationLabel || "";
        if (!left && !contextLabel)
            return [];
        const safeWidth = Math.max(1, width);
        const right = contextLabel ?? "";
        const gap = left && right ? 2 : 0;
        const rightWidth = Math.min(visibleWidth(right), Math.max(0, safeWidth - gap));
        const leftWidth = Math.max(0, safeWidth - rightWidth - gap);
        const renderedLeft = truncateToWidth(left, leftWidth, "…");
        const renderedRight = truncateToWidth(right, rightWidth, "…");
        const padding = Math.max(0, safeWidth - visibleWidth(renderedLeft) - visibleWidth(renderedRight));
        return [theme.fg("muted", `${renderedLeft}${" ".repeat(padding)}${renderedRight}`)];
    }
    invalidate() {
        // Render output is derived from counts and focus state.
    }
}
//# sourceMappingURL=subagent-summary-line.js.map
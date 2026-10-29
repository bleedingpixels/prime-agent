import { Container, Spacer, Text, truncateToWidth, visibleWidth, wrapTextWithAnsi, } from "@earendil-works/pi-tui";
import { formatAgentMessageParticipant } from "../../../core/agent-messages.js";
import { getMarkdownTheme, theme } from "../theme/theme.js";
import { expandCollapseHint } from "./keybinding-hints.js";
function collapseText(text) {
    return text.replace(/\s+/g, " ").trim();
}
/** `◆ <label> · <participant>[ · <preview>]` summary line shared by received and sent agent-message UI. */
export function agentMessageSummaryLine(label, participant, preview) {
    const parts = [`${theme.fg("accent", "◆")} ${theme.fg("muted", label)}`, theme.fg("muted", participant)];
    if (preview) {
        parts.push(theme.fg("muted", preview));
    }
    return parts.join(theme.fg("dim", " · "));
}
/** Single-line message preview sized to fit after the summary-line prefix. */
export function agentMessagePreview(prefixWidth, message) {
    return truncateToWidth(collapseText(message), Math.max(20, 100 - prefixWidth));
}
/** `╰─`-guttered message body lines shared by received and sent agent-message UI. */
export function agentMessageBodyLines(message, width) {
    const safeWidth = Math.max(1, width);
    const textWidth = Math.max(1, safeWidth - 4);
    const bodyLines = message.split("\n").flatMap((line) => {
        const wrapped = wrapTextWithAnsi(line, textWidth);
        return wrapped.length > 0 ? wrapped : [""];
    });
    return bodyLines.map((line, index) => {
        const prefix = index === 0 ? theme.fg("dim", "╰─ ") : "   ";
        return truncateToWidth(` ${prefix}${theme.fg("customMessageText", line)}`, safeWidth, "");
    });
}
class AgentMessageBodyComponent {
    message;
    constructor(message) {
        this.message = message;
    }
    render(width) {
        return agentMessageBodyLines(this.message, width);
    }
    invalidate() { }
}
export class AgentMessageComponent extends Container {
    message;
    content = new Container();
    header = new Text("", 1, 0);
    expanded = false;
    constructor(message, _markdownTheme = getMarkdownTheme(), options = {}) {
        super();
        this.message = message;
        if (!options.suppressLeadingSpace)
            this.addChild(new Spacer(1));
        this.addChild(this.content);
        this.updateDisplay();
    }
    setExpanded(expanded) {
        if (this.expanded === expanded) {
            return;
        }
        this.expanded = expanded;
        this.updateDisplay();
    }
    invalidate() {
        super.invalidate();
        this.updateDisplay();
    }
    updateDisplay() {
        this.content.clear();
        this.header.setText(this.headerText());
        this.content.addChild(this.header);
        if (this.expanded) {
            this.content.addChild(new AgentMessageBodyComponent(this.message.details.message));
        }
    }
    headerText() {
        const label = "Agent message received";
        const participant = formatAgentMessageParticipant("received", this.message.details.fromRelationship, this.message.details.from);
        const hint = expandCollapseHint("app.messages.expand", this.expanded);
        if (this.expanded) {
            return `${agentMessageSummaryLine(label, participant)} ${hint}`;
        }
        const prefixWidth = visibleWidth(`◆ ${label} · ${participant} · `);
        const preview = agentMessagePreview(prefixWidth, this.message.details.message);
        return `${agentMessageSummaryLine(label, participant, preview)} ${hint}`;
    }
}
//# sourceMappingURL=agent-message.js.map
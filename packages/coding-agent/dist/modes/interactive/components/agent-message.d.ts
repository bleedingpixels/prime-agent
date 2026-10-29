import { Container, type MarkdownTheme } from "@earendil-works/pi-tui";
import { type AgentSessionMessage } from "../../../core/agent-messages.js";
/** `◆ <label> · <participant>[ · <preview>]` summary line shared by received and sent agent-message UI. */
export declare function agentMessageSummaryLine(label: string, participant: string, preview?: string): string;
/** Single-line message preview sized to fit after the summary-line prefix. */
export declare function agentMessagePreview(prefixWidth: number, message: string): string;
/** `╰─`-guttered message body lines shared by received and sent agent-message UI. */
export declare function agentMessageBodyLines(message: string, width: number): string[];
export declare class AgentMessageComponent extends Container {
    private readonly message;
    private readonly content;
    private readonly header;
    private expanded;
    constructor(message: AgentSessionMessage, _markdownTheme?: MarkdownTheme, options?: {
        suppressLeadingSpace?: boolean;
    });
    setExpanded(expanded: boolean): void;
    invalidate(): void;
    private updateDisplay;
    private headerText;
}
//# sourceMappingURL=agent-message.d.ts.map
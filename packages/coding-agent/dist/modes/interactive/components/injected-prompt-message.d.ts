import type { AgentMessage } from "@earendil-works/pi-agent-core";
import { Container, type MarkdownTheme } from "@earendil-works/pi-tui";
import { type GoalContextDetails } from "../../../core/goals.js";
import { type CustomMessage, type HeartbeatPromptDetails, type IpythonStateRestoredDetails, type RlmChildFailureDetails, type RlmChildTerminalNoticeDetails } from "../../../core/messages.js";
type InjectedPromptDetails = GoalContextDetails | HeartbeatPromptDetails | IpythonStateRestoredDetails | RlmChildFailureDetails | RlmChildTerminalNoticeDetails;
type InjectedPromptMessage = CustomMessage<InjectedPromptDetails>;
export declare function isInjectedPromptMessage(message: AgentMessage): message is InjectedPromptMessage;
export declare class InjectedPromptMessageComponent extends Container {
    private readonly message;
    private readonly markdownTheme;
    private readonly content;
    private readonly header;
    private expanded;
    constructor(message: InjectedPromptMessage, markdownTheme?: MarkdownTheme);
    setExpanded(expanded: boolean): void;
    invalidate(): void;
    private updateDisplay;
    private headerText;
    private heartbeatHeaderText;
    private metaText;
}
export {};
//# sourceMappingURL=injected-prompt-message.d.ts.map
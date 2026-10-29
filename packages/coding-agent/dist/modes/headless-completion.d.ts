import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { AgentSession } from "../core/agent-session.js";
import { type AgentAutonomousStatus } from "../core/autonomous.js";
import { type CompactionOutcomeMessage, type SessionSlashCommandResultMessage } from "../core/messages.js";
export declare function latestAutonomousGateAttempt(status: AgentAutonomousStatus): number;
export type HeadlessTerminalResultMessage = AssistantMessage | SessionSlashCommandResultMessage;
export interface HeadlessTerminalResult {
    primary?: HeadlessTerminalResultMessage;
    compactionOutcomes: CompactionOutcomeMessage[];
}
export declare function selectHeadlessTerminalResult(messages: readonly AgentMessage[]): HeadlessTerminalResult;
export declare function waitForHeadlessCompletion(session: AgentSession): Promise<AgentAutonomousStatus>;
//# sourceMappingURL=headless-completion.d.ts.map
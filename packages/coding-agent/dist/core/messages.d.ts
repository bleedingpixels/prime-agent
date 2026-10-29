/**
 * Custom message types and transformers for the coding agent.
 *
 * Extends the base AgentMessage type with coding-agent specific message types,
 * and provides a transformer to convert them to LLM-compatible messages.
 */
import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { ImageContent, Message, TextContent } from "@earendil-works/pi-ai";
import type { AgentCronJob } from "./cron-jobs.js";
import { type SessionSlashCommand } from "./slash-commands.js";
export declare const COMPACTION_SUMMARY_PREFIX = "The conversation history before this point was compacted into the following summary:\n\n<summary>\n";
export declare const COMPACTION_SUMMARY_SUFFIX = "\n</summary>";
export declare const BRANCH_SUMMARY_PREFIX = "The following is a summary of a branch that this conversation came back from:\n\n<summary>\n";
export declare const BRANCH_SUMMARY_SUFFIX = "</summary>";
export declare const HEARTBEAT_PROMPT_CUSTOM_TYPE = "heartbeat_prompt";
export declare const HEARTBEAT_PROMPT_PREVIEW_LABEL = "Heartbeat prompt";
export declare const IPYTHON_STATE_RESTORED_CUSTOM_TYPE = "ipython_state_restored";
export declare const SESSION_SLASH_COMMAND_CUSTOM_TYPE = "session_slash_command";
export declare const SESSION_SLASH_COMMAND_RESULT_CUSTOM_TYPE = "session_slash_command_result";
export declare const COMPACTION_OUTCOME_CUSTOM_TYPE = "compaction_outcome";
export declare const RLM_CHILD_FAILURE_CUSTOM_TYPE = "rlm_child_failure";
export declare const RLM_CHILD_TERMINAL_NOTICE_CUSTOM_TYPE = "rlm_child_terminal_notice";
export interface SessionSlashCommandDetails {
    command: SessionSlashCommand;
    commandEntryId?: string;
}
export interface SessionSlashCommandResultDetails {
    command: SessionSlashCommand;
    success: boolean;
    severity: "info" | "warning" | "error";
    error?: string;
    commandEntryId?: string;
}
export interface SessionSlashCommandMessage extends CustomMessage<SessionSlashCommandDetails> {
    customType: typeof SESSION_SLASH_COMMAND_CUSTOM_TYPE;
    content: string;
    details: SessionSlashCommandDetails;
}
export interface SessionSlashCommandResultMessage extends CustomMessage<SessionSlashCommandResultDetails> {
    customType: typeof SESSION_SLASH_COMMAND_RESULT_CUSTOM_TYPE;
    content: string;
    details: SessionSlashCommandResultDetails;
}
export type CompactionOutcomeReason = "threshold" | "overflow" | "requested";
export type CompactionOutcome = "skipped" | "cancelled" | "failed";
export interface CompactionOutcomeDetails {
    reason: CompactionOutcomeReason;
    outcome: CompactionOutcome;
}
export interface CompactionOutcomeMessage extends CustomMessage<CompactionOutcomeDetails> {
    customType: typeof COMPACTION_OUTCOME_CUSTOM_TYPE;
    content: string;
    details: CompactionOutcomeDetails;
}
export interface RlmChildFailureDetails {
    childId: string;
    sessionName: string;
    error: string;
}
export type RlmChildTerminalNoticeDetails = {
    kind: "cancelled";
    childId: string;
    sessionName: string;
    reason?: string;
} | {
    kind: "completed_without_reply";
    childId: string;
    sessionName: string;
    lastAssistantTextPreview?: string;
};
export declare function createRlmChildFailureMessage(details: RlmChildFailureDetails, timestamp?: number): CustomMessage<RlmChildFailureDetails>;
export declare function createRlmChildTerminalNoticeMessage(details: RlmChildTerminalNoticeDetails, timestamp?: number): CustomMessage<RlmChildTerminalNoticeDetails>;
/**
 * Message type for bash executions via the ! command.
 */
export interface BashExecutionMessage {
    role: "bashExecution";
    command: string;
    output: string;
    exitCode: number | undefined;
    cancelled: boolean;
    truncated: boolean;
    fullOutputPath?: string;
    timestamp: number;
    /** If true, this message is excluded from LLM context (!! prefix) */
    excludeFromContext?: boolean;
}
/**
 * Message type for extension-injected messages via sendMessage().
 * These are custom messages that extensions can inject into the conversation.
 */
export interface CustomMessage<T = unknown> {
    role: "custom";
    customType: string;
    content: string | (TextContent | ImageContent)[];
    display: boolean;
    details?: T;
    timestamp: number;
}
export interface HeartbeatPromptDetails {
    jobId: string;
    schedule: string;
    status: AgentCronJob["status"];
    runCount: number;
    nextRunAt?: string;
    lastRunAt?: string;
}
export interface IpythonStateRestoredDetails {
    restored: boolean;
}
export interface BranchSummaryMessage {
    role: "branchSummary";
    summary: string;
    fromId: string;
    timestamp: number;
}
export interface CompactionSummaryMessage {
    role: "compactionSummary";
    summary: string;
    tokensBefore: number;
    /** Number of retained messages that precede this summary in transcript presentation. */
    retainedMessageCount?: number;
    /** User instructions that guided the summary (from `/compact <instructions>`) */
    customInstructions?: string;
    timestamp: number;
}
declare module "@earendil-works/pi-agent-core" {
    interface CustomAgentMessages {
        bashExecution: BashExecutionMessage;
        custom: CustomMessage;
        branchSummary: BranchSummaryMessage;
        compactionSummary: CompactionSummaryMessage;
    }
}
/**
 * Format bash output for LLM context. The fence must be longer than any
 * backtick run in the output so command output cannot terminate it early.
 */
export declare function bashOutputToText(msg: Pick<BashExecutionMessage, "output" | "exitCode" | "cancelled" | "truncated" | "fullOutputPath">): string;
/**
 * Convert a BashExecutionMessage to user message text for LLM context.
 */
export declare function bashExecutionToText(msg: BashExecutionMessage): string;
export declare function createBranchSummaryMessage(summary: string, fromId: string, timestamp: string): BranchSummaryMessage;
export declare function createCompactionSummaryMessage(summary: string, tokensBefore: number, timestamp: string, customInstructions?: string, retainedMessageCount?: number): CompactionSummaryMessage;
/** Convert CustomMessageEntry to AgentMessage format */
export declare function createCustomMessage(customType: string, content: string | (TextContent | ImageContent)[], display: boolean, details: unknown | undefined, timestamp: string): CustomMessage;
export declare function createSessionSlashCommandMessage(command: SessionSlashCommand, details?: Omit<SessionSlashCommandDetails, "command">, display?: boolean, timestamp?: number): SessionSlashCommandMessage;
export declare function createSessionSlashCommandResultMessage(content: string, details: SessionSlashCommandResultDetails, display?: boolean, timestamp?: number): SessionSlashCommandResultMessage;
export declare function createCompactionOutcomeMessage(content: string, details: CompactionOutcomeDetails, display?: boolean, timestamp?: number): CompactionOutcomeMessage;
export declare function isSessionSlashCommand(value: unknown): value is SessionSlashCommand;
export declare function isSessionSlashCommandMessage(message: unknown): message is SessionSlashCommandMessage;
export declare function isSessionSlashCommandResultMessage(message: unknown): message is SessionSlashCommandResultMessage;
export declare function isCompactionOutcomeMessage(message: unknown): message is CompactionOutcomeMessage;
export declare function createHeartbeatPromptMessage(job: AgentCronJob, timestamp?: number): CustomMessage<HeartbeatPromptDetails>;
/**
 * Transform AgentMessages (including custom types) to LLM-compatible Messages.
 *
 * This is used by:
 * - Agent's transormToLlm option (for prompt calls and queued messages)
 * - Compaction's generateSummary (for summarization)
 * - Custom extensions and tools
 */
export declare function convertToLlm(messages: AgentMessage[]): Message[];
//# sourceMappingURL=messages.d.ts.map
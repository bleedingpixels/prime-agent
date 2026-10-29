import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { Api, Model } from "@earendil-works/pi-ai";
import type { ModelRegistry } from "../../core/model-registry.js";
import type { AgentStatus, AgentTaskState } from "../../core/session-manager.js";
import type { ActiveSessionState } from "./active-session-state.js";
export declare const AGENT_STATUS_SYSTEM_PROMPT = "You generate a status line for an AI coding agent dashboard. You are given the recent conversation between a user and the agent, plus whether the agent is currently working or idle.\n\nOutput ONLY these two tags, nothing before, between, or after. Do not think out loud, explain, or count words.\n<recap>a present-tense clause, at most 12 words, saying what the agent is doing or just did, no trailing period</recap>\n<status>one of NEEDS_INPUT, COMPLETED</status>\n\nSTATUS meaning:\n- COMPLETED: the agent finished its turn AND the user's request is fully done with nothing left.\n- NEEDS_INPUT: the agent finished its turn but the task is not fully done \u2014 it asked a question, hit a blocker, or needs more prompting.\nWhen you are unsure between COMPLETED and NEEDS_INPUT, choose NEEDS_INPUT.\n\nExample:\n<recap>Refactoring the auth middleware and updating its tests</recap>\n<status>NEEDS_INPUT</status>";
export interface AgentStatusResult {
    summary: string;
    taskState?: AgentTaskState;
}
/** Resolve the cheap summary model, or undefined when it has no configured auth. */
export declare function resolveSummaryModel(registry: ModelRegistry): Model<Api> | undefined;
/** Serialize the trailing messages into a compact prompt body (tool calls by name only). */
export declare function buildStatusContext(messages: readonly AgentMessage[], isWorking: boolean): string;
/** Take the content of the last `<recap>` and `<status>` tags; idle verdicts default to needs_input. */
export declare function parseAgentStatusResponse(text: string, isWorking: boolean): AgentStatusResult | undefined;
export interface GenerateAgentStatusParams {
    registry: ModelRegistry;
    messages: readonly AgentMessage[];
    isWorking: boolean;
    signal?: AbortSignal;
}
/** One cheap model call for a fresh status, or undefined if unavailable/empty/failed. */
export declare function generateAgentStatus(params: GenerateAgentStatusParams): Promise<AgentStatusResult | undefined>;
/** True when the new status differs enough from the stored one to be worth broadcasting. */
export declare function agentStatusChanged(previous: AgentStatus | undefined, next: AgentStatusResult): boolean;
/**
 * Background status summarization for daemon-hosted sessions, top-level and
 * subagents alike. A periodic sweep refreshes working sessions; debounced
 * turn-end activity drives the idle verdict. Status lives in memory; settled
 * idle verdicts are persisted.
 */
export declare class DaemonSessionSummarizer {
    private readonly listSessions;
    private readonly onStatusChanged?;
    private readonly generate;
    private interval;
    private readonly debounceTimers;
    private readonly inFlight;
    private readonly rerunRequested;
    constructor(listSessions: () => readonly ActiveSessionState[], onStatusChanged?: ((state: ActiveSessionState) => void) | undefined, generate?: (params: GenerateAgentStatusParams) => Promise<AgentStatusResult | undefined>);
    start(): void;
    stop(): void;
    /** Drop any pending work for a session that is closing. */
    forget(activeSessionId: string): void;
    /** Seed in-memory status from the persisted entry when a session is added. */
    seed(state: ActiveSessionState): void;
    /** Called when a session finishes a turn; debounce until the agent settles. */
    notifyActivity(state: ActiveSessionState): void;
    private summarize;
}
//# sourceMappingURL=daemon-session-summarizer.d.ts.map
import type { AgentMessage, ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { Model } from "@earendil-works/pi-ai";
import type { CustomEntry } from "../session-manager.js";
export declare const REFINEMENT_CUSTOM_TYPE = "prime-agent.refinement";
export declare const REFINE_SKILL_NAME = "refine";
export type RefinementKind = "prompt" | "memory" | "skill" | "subagent";
export type RefinementAction = "create" | "update" | "delete";
export type HarnessScope = "local" | "global";
export interface HarnessEntry {
    id: string;
    kind: RefinementKind;
    title: string;
    content: string;
    path: string;
    scope?: HarnessScope;
    reference: Record<string, unknown>;
    arguments: Record<string, unknown>;
    metadata: Record<string, unknown>;
    source: string;
    created_at: string;
    updated_at: string;
    version: number;
}
export interface HarnessRefinementEvent {
    id: string;
    trigger: string;
    changes: string[];
    evidence: string;
    outcome: string;
    created_at: string;
}
export interface HarnessState {
    schema: number;
    entries: Record<RefinementKind, Record<string, HarnessEntry>>;
    refinements: HarnessRefinementEvent[];
}
export interface RefinementEdit {
    action: RefinementAction;
    kind: RefinementKind;
    id?: string;
    title?: string;
    content?: string;
    path?: string;
    reference?: Record<string, unknown>;
    arguments?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    reason?: string;
}
export interface RefinementProposal {
    summary: string;
    rationale: string;
    edits: RefinementEdit[];
    expectedOutcome: string;
}
export interface AppliedRefinementEdit extends RefinementEdit {
    id: string;
    before?: HarnessEntry;
    after?: HarnessEntry;
    applied: boolean;
    error?: string;
}
export interface RefinementResult {
    id: string;
    summary: string;
    rationale: string;
    expectedOutcome: string;
    appliedEdits: AppliedRefinementEdit[];
    harnessStatePath: string;
    rollbackOf?: string;
    scope?: HarnessScope;
}
export interface RefineOptions {
    instructions?: string;
    rollbackId?: string;
    global?: boolean;
}
export type AutoRefineReason = "turn_interval" | "compact";
export interface AutoRefineReviewContext {
    reason: AutoRefineReason;
    turnsSinceLastReview: number;
}
export interface AutoRefineReview {
    shouldRefine: boolean;
    rationale: string;
    instructions?: string;
}
export declare function inferRefinementResultScope(result: RefinementResult): HarnessScope | undefined;
export declare function getGlobalHarnessStateDir(agentDir?: string): string;
export declare function getLocalHarnessStateDir(sessionArtifactDir: string | undefined): string | undefined;
export declare function getHarnessStatePath(harnessStateDir?: string): string;
export declare function loadHarnessState(harnessStateDir?: string, scope?: HarnessScope): HarnessState;
export declare function mergeHarnessStates(globalState: HarnessState, localState?: HarnessState): HarnessState;
export declare function saveHarnessState(harnessStateDir: string, state: HarnessState): string;
export declare function getRefinementHistoryPath(harnessStateDir?: string): string;
/**
 * Append a global-scope refinement to the cross-session history log so it can be
 * rolled back from any session. Local-scope refinements are recorded only in the
 * session JSONL and roll back via their recorded harnessStatePath.
 */
export declare function appendGlobalRefinement(harnessStateDir: string, result: RefinementResult): string;
export declare function loadGlobalRefinementHistory(harnessStateDir?: string): RefinementResult[];
/**
 * Merge global and session refinement history, de-duplicating by id. Session entries
 * win on conflict so a session that is mid-flight still resolves its own latest result.
 */
export declare function mergeRefinementHistory(global: readonly RefinementResult[], session: readonly RefinementResult[]): RefinementResult[];
export declare function formatHarnessStateForPrompt(state: HarnessState, options?: {
    maxEntriesPerKind?: number;
    maxRefinements?: number;
    maxContentLength?: number;
    includeIpythonExamples?: boolean;
    includeShellExamples?: boolean;
    includeRefineExamples?: boolean;
}): string;
export declare function applyRefinementProposal(state: HarnessState, proposal: RefinementProposal, options: {
    id: string;
    rollbackOf?: string;
    scope?: HarnessScope;
    baselineState?: HarnessState;
}): RefinementResult;
export declare function getRefinementHistory(entries: readonly CustomEntry[]): RefinementResult[];
export interface RefinementPlan {
    proposal: RefinementProposal;
    id: string;
    rollbackOf?: string;
    rollbackScope?: HarnessScope;
    /** Target-scope state captured before planning, used to reject conflicting edits at apply time. */
    baselineState?: HarnessState;
}
/**
 * Produce a refinement proposal (the LLM pass, or a rollback proposal) without
 * mutating any harness state. Separated from {@link applyRefinementProposal} so
 * callers can re-read the harness file immediately before applying — the LLM call
 * here can take many seconds, during which the kernel or another session may write
 * the shared `harness_state.json`.
 */
export declare function planRefinement(messages: AgentMessage[], state: HarnessState, history: RefinementResult[], model: Model<any>, apiKey: string, options?: RefineOptions, headers?: Record<string, string>, signal?: AbortSignal, thinkingLevel?: ThinkingLevel): Promise<RefinementPlan>;
export declare function reviewAutoRefine(messages: AgentMessage[], state: HarnessState, history: RefinementResult[], model: Model<any>, apiKey: string, context: AutoRefineReviewContext, headers?: Record<string, string>, signal?: AbortSignal, thinkingLevel?: ThinkingLevel): Promise<AutoRefineReview>;
export declare function refineHarness(messages: AgentMessage[], state: HarnessState, history: RefinementResult[], model: Model<any>, apiKey: string, options?: RefineOptions, headers?: Record<string, string>, signal?: AbortSignal, thinkingLevel?: ThinkingLevel): Promise<RefinementResult>;
//# sourceMappingURL=refinement.d.ts.map
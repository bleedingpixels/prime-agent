import type { ImageContent } from "@earendil-works/pi-ai";
import type { CustomMessage } from "./messages.js";
export declare const GOAL_STATE_CUSTOM_TYPE = "thread_goal_state";
export declare const GOAL_CONTEXT_CUSTOM_TYPE = "goal_context";
export declare const GOAL_CONTEXT_PREVIEW_LABEL = "Goal context";
export declare const GOAL_SKILL_NAME = "goal";
export declare const MAX_THREAD_GOAL_OBJECTIVE_CHARS = 4000;
export type GoalStatus = "idle" | "active" | "paused" | "budget_limited" | "complete" | "error";
export type GoalContextKind = "continuation" | "budget_limit" | "objective_updated";
export interface GoalState {
    active: boolean;
    status: GoalStatus;
    goalId?: string;
    objective?: string;
    tokenBudget?: number;
    tokensUsed: number;
    timeUsedSeconds: number;
    continuationsUsed: number;
    createdAt?: number;
    updatedAt?: number;
    lastReason?: string;
    lastError?: string;
}
/** Goal payload returned to the kernel-side goal skill. Keys are Python-conventional snake_case. */
export type SerializedGoal = {
    goal_id?: string;
    objective: string;
    status: Exclude<GoalStatus, "idle">;
    token_budget?: number;
    tokens_used: number;
    time_used_seconds: number;
    created_at?: number;
    updated_at?: number;
};
/** Reply payload for goal.* host requests from the IPython kernel. */
export type GoalHostResponse = {
    goal: SerializedGoal | null;
    remaining_tokens: number | null;
    completion_budget_report: string | null;
};
export interface GoalContextDetails {
    kind: GoalContextKind;
    goalId?: string;
    objective: string;
    status: GoalStatus;
    continuationsUsed: number;
}
export declare function emptyGoalState(): GoalState;
export declare function normalizeGoalState(goal: GoalState): GoalState;
export declare function validateGoalObjective(value: string): string;
export declare function validateGoalBudget(value: number | undefined): number | undefined;
export declare function goalTokenDeltaForUsage(usage: {
    input: number;
    output: number;
}): number;
export declare function isPersistedGoalState(value: unknown): value is GoalState;
export declare function goalHostResponse(goal: GoalState, includeCompletionReport: boolean): GoalHostResponse;
export declare function createGoalContextMessage(goal: GoalState, kind: GoalContextKind, images?: ImageContent[]): CustomMessage<GoalContextDetails>;
export declare function formatGoalUsage(goal: GoalState): string | undefined;
//# sourceMappingURL=goals.d.ts.map
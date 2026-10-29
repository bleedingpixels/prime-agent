import type { AssistantMessage, Usage, UserMessage } from "@earendil-works/pi-ai";
export interface AgentAutonomousConfig {
    enabled?: boolean;
    maxContinuations?: number;
    maxTurns?: number;
    maxTokens?: number;
    timeoutMs?: number;
    continuationPrompt?: string;
    gates?: AgentAutonomousGateConfig;
}
export interface AgentAutonomousGateConfig {
    commands?: string[];
    maxRetries?: number;
    timeoutMs?: number;
}
export interface AgentAutonomousGateFailure {
    command: string;
    attempt: number;
    exitText: string;
    output: string;
}
export interface AgentAutonomousStatus {
    enabled: boolean;
    continuationsUsed: number;
    turnsUsed: number;
    tokensUsed: number;
    startedAt?: number;
    limits: Required<Omit<AgentAutonomousConfig, "enabled" | "continuationPrompt" | "gates">>;
    gates: Required<AgentAutonomousGateConfig>;
    gateAttempts: Record<string, number>;
    lastGateFailure?: AgentAutonomousGateFailure;
}
export declare const DEFAULT_AUTONOMOUS_CONTINUATION_PROMPT = "No human input is available in autonomous mode. Continue working until the host evaluator, verifier, or configured autonomous limits stop the run. If you were asking the user a question, make a reasonable assumption and verify it. If you believe you are blocked, prove it with host-observable evidence, preserve that evidence, and keep looking for safe progress while budget remains. Do not end the session yourself; the verifier/evaluator decides completion when configured gates pass.";
export declare const DEFAULT_AUTONOMOUS_LIMITS: Required<Omit<AgentAutonomousConfig, "enabled" | "continuationPrompt" | "gates">>;
export declare const DEFAULT_AUTONOMOUS_GATES: Required<AgentAutonomousGateConfig>;
export interface AutonomousRuntimeState {
    enabled: boolean;
    continuationsUsed: number;
    turnsUsed: number;
    tokensUsed: number;
    startedAt?: number;
    limits: Required<Omit<AgentAutonomousConfig, "enabled" | "continuationPrompt" | "gates">>;
    continuationPrompt: string;
    gates: Required<AgentAutonomousGateConfig>;
    gateAttempts: Record<string, number>;
    lastGateFailure?: GateFailure;
    lastGateFailureSnapshot?: GitWorktreeSnapshot;
}
export type AutonomousLimitReason = "maxContinuations" | "maxTurns" | "maxTokens" | "timeoutMs";
export type AutonomousGateResult = "passed" | "failed" | "retry_exhausted";
type AutonomousLimitState = Pick<AgentAutonomousStatus, "continuationsUsed" | "turnsUsed" | "tokensUsed" | "startedAt" | "limits">;
export interface AutonomousDecision {
    shouldContinue: boolean;
    reason: "missing_terminal_evidence" | "gate_failed" | "not_needed" | "limit_reached";
}
interface GitWorktreeSnapshot {
    status: string;
    diff: string;
    untrackedHash: string;
}
interface AutonomousOperationOptions {
    cwd?: string;
    signal?: AbortSignal;
}
type GateFailure = AgentAutonomousGateFailure;
export declare function createAutonomousRuntimeState(config?: AgentAutonomousConfig, _options?: {
    cwd?: string;
}): AutonomousRuntimeState;
export declare function setAutonomousEnabled(state: AutonomousRuntimeState, enabled: boolean, _options?: {
    cwd?: string;
}): void;
export declare function autonomousStatus(state: AutonomousRuntimeState): AgentAutonomousStatus;
export declare function addAutonomousUsage(state: AutonomousRuntimeState, usage: Usage | undefined): void;
export declare function addAutonomousContinuation(state: AutonomousRuntimeState): void;
export declare function nextAutonomousContinuation(state: AutonomousRuntimeState, message: AssistantMessage, options?: AutonomousOperationOptions, now?: number): Promise<UserMessage | undefined>;
export declare function shouldAutonomouslyContinue(state: AutonomousRuntimeState, message: AssistantMessage, options?: AutonomousOperationOptions, now?: number): Promise<AutonomousDecision>;
export declare function autonomousLimitReason(state: AutonomousLimitState, now?: number): AutonomousLimitReason | undefined;
export declare function refreshAutonomousQualityGates(state: AutonomousRuntimeState, options?: AutonomousOperationOptions): Promise<AutonomousGateResult | undefined>;
export declare function buildAutonomousGateFailureContinuation(failure: AgentAutonomousGateFailure, maxRetries: number, timestamp?: number): string;
export {};
//# sourceMappingURL=autonomous.d.ts.map
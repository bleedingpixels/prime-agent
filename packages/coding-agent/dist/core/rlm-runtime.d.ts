import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { Api, Model, ServiceTier } from "@earendil-works/pi-ai";
import type { AgentSession } from "./agent-session.js";
import type { ToolDefinition } from "./extensions/index.js";
import type { HostRequestHandler } from "./kernel/index.js";
export interface RlmRunRequest {
    prompt: string;
    kwargs: Record<string, unknown>;
    /** Source of the IPython cell that issued this rlm.run call, when available. */
    cellSourceCode?: string;
}
export interface RlmSpawnHandle {
    rlm_child_id: string;
    name: string;
    session_dir: string;
    model: string;
}
export type RlmSubagentRegistryStatus = "running" | "completed" | "error";
export interface RlmSubagentRegistryEntry {
    rlm_child_id: string;
    active_session_id: string | null;
    session_id: string | null;
    session_name: string;
    session_dir: string;
    status: RlmSubagentRegistryStatus;
}
export interface RlmListSubagentsResult {
    subagents: RlmSubagentRegistryEntry[];
}
export interface RlmDeleteSubagentResult {
    subagent: RlmSubagentRegistryEntry;
    outcome?: "deleted" | "skipped_running";
}
export interface RlmModelMatch {
    provider: string;
    id: string;
    name: string;
    selector: string;
}
export interface RlmFindModelsResult {
    models: RlmModelMatch[];
}
export type RlmRunHandler = (request: RlmRunRequest) => Promise<Record<string, unknown>>;
export type RlmListSubagentsHandler = () => RlmListSubagentsResult | Promise<RlmListSubagentsResult>;
export type RlmDeleteSubagentHandler = (target: string) => Promise<RlmDeleteSubagentResult>;
export type RlmFindModelsHandler = (query: string, limit: number) => RlmFindModelsResult | Promise<RlmFindModelsResult>;
export declare const DEFAULT_RLM_MODEL_SEARCH_LIMIT = 8;
export declare const MAX_RLM_MODEL_SEARCH_LIMIT = 20;
/** Validate and normalize an orchestrator-supplied subagent session name. */
export declare function normalizeRequestedRlmSubagentSessionName(value: unknown): string | undefined;
/** Validate and normalize an orchestrator-supplied subagent model reference. */
export declare function normalizeRequestedRlmSubagentModel(value: unknown): string | undefined;
/** Create a readable, collision-resistant default name usable as an agent-message selector. */
export declare function createDefaultRlmSubagentSessionName(prompt: string, childId: string): string;
export declare function findRlmModelMatches(query: string, models: Model<Api>[], limit: number): RlmModelMatch[];
/** Adapt an RlmRunHandler into the typed "rlm.run" handler for the kernel host bridge. */
export declare function createRlmRunHostHandler(handler: RlmRunHandler): HostRequestHandler;
/** Search a bounded authenticated model catalog without adding it to the system prompt. */
export declare function createRlmFindModelsHostHandler(handler: RlmFindModelsHandler): HostRequestHandler;
/** Expose the current parent session's RLM child registry to its kernel. */
export declare function createRlmListSubagentsHostHandler(handler: RlmListSubagentsHandler): HostRequestHandler;
/** Delete one direct child selected from the current parent session's registry. */
export declare function createRlmDeleteSubagentHostHandler(handler: RlmDeleteSubagentHandler): HostRequestHandler;
export interface RlmSubagentRuntime {
    session: AgentSession;
}
export interface CreateRlmSubagentRuntimeOptions {
    parentSession: AgentSession;
    id: string;
    prompt: string;
    sessionName: string;
    sessionDir: string;
    model: Model<any>;
    thinkingLevel: ThinkingLevel;
    serviceTier: ServiceTier;
    scopedModels: Array<{
        model: Model<any>;
        thinkingLevel?: ThinkingLevel;
    }>;
    activeToolNames: string[];
    allowedToolNames?: string[];
    customTools: ToolDefinition[];
    includeGoals: boolean;
    includeCompactSkill: boolean;
    rlmDepth: number;
    rlmMaxDepth: number;
    rlmParentNodeId: string;
    /** Source of the IPython cell that spawned this subagent, for display. */
    spawnCode?: string;
    /** Publish the session to the parent before a host makes the runtime addressable. */
    onSessionPublished?: (session: AgentSession) => void;
}
export interface SubagentRuntimeHost {
    createRlmSubagentRuntime(options: CreateRlmSubagentRuntimeOptions): Promise<RlmSubagentRuntime>;
    /** Persist host-owned completion before the child becomes passivation-eligible. */
    completeRlmSubagentRuntime?(childId: string, session: AgentSession): boolean;
    /** Release a host-owned child after its detached initial task settles. */
    releaseRlmSubagentRuntime?: (runtime: RlmSubagentRuntime, options: CreateRlmSubagentRuntimeOptions, status: "done" | "error" | "cancelled") => Promise<void>;
    /** Close or remove the host-owned child; session is absent when a persisted child is still passive. */
    deleteRlmSubagentRuntime(childId: string, session?: AgentSession): Promise<void>;
    disposeRlmSubagentRuntimes?(): Promise<void>;
}
//# sourceMappingURL=rlm-runtime.d.ts.map
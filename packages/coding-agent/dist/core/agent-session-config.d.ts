import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { AgentAutonomousConfig } from "./autonomous.js";
export type AgentExecutionMode = "interactive" | "print" | "json" | "rpc" | "acp";
export interface AgentSessionRuntimeConfig {
    cwd?: string;
    agentDir?: string;
    sessionDir?: string;
    provider?: string;
    model?: string;
    apiKey?: string;
    systemPrompt?: string;
    appendSystemPrompt?: string[];
    thinking?: ThinkingLevel;
    models?: string[];
    tools?: string[];
    noTools?: boolean;
    noBuiltinTools?: boolean;
    extensions?: string[];
    noExtensions?: boolean;
    skills?: string[];
    noSkills?: boolean;
    promptTemplates?: string[];
    noPromptTemplates?: boolean;
    themes?: string[];
    noThemes?: boolean;
    noContextFiles?: boolean;
    autonomous?: AgentAutonomousConfig;
    extensionFlagValues?: Record<string, boolean | string>;
    /**
     * When true, auto-refine runs synchronously between turns at the
     * shouldStopAfterTurn boundary instead of in the background after
     * agent_end. Passed from the JSON/print client to the daemon worker
     * so it survives the appMode="daemon" context switch.
     */
    serializedRefine?: boolean;
    /** User-facing client mode that created this session. The daemon is transport, not an execution mode. */
    executionMode?: AgentExecutionMode;
    /** Opt-out-only policy carried across daemon process boundaries. */
    telemetryDisabled?: true;
    /**
     * Initial goal to seed when creating a new top-level session (rlmDepth 0).
     * Ignored for subagent sessions and when the branch already has a persisted
     * thread_goal_state entry (idempotent restart/rehydration).
     */
    initialGoal?: {
        objective: string;
        tokenBudget?: number;
    };
}
export declare function mergeAgentSessionRuntimeConfig(base: AgentSessionRuntimeConfig, override?: AgentSessionRuntimeConfig): AgentSessionRuntimeConfig;
export declare function mergeAutonomousConfig(base: AgentAutonomousConfig | undefined, override: AgentAutonomousConfig | undefined): AgentAutonomousConfig | undefined;
//# sourceMappingURL=agent-session-config.d.ts.map
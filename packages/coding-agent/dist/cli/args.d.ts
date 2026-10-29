/**
 * CLI argument parsing and help display
 */
import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
export type Mode = "text" | "json" | "rpc" | "acp" | "daemon";
export interface Args {
    provider?: string;
    model?: string;
    apiKey?: string;
    cwd?: string;
    systemPrompt?: string;
    appendSystemPrompt?: string[];
    thinking?: ThinkingLevel;
    continue?: boolean;
    resume?: true | string;
    help?: boolean;
    version?: boolean;
    mode?: Mode;
    daemonSocket?: string;
    noSession?: boolean;
    fork?: string;
    sessionDir?: string;
    models?: string[];
    tools?: string[];
    noTools?: boolean;
    noBuiltinTools?: boolean;
    extensions?: string[];
    noExtensions?: boolean;
    print?: boolean;
    export?: string;
    noSkills?: boolean;
    skills?: string[];
    promptTemplates?: string[];
    noPromptTemplates?: boolean;
    themes?: string[];
    noThemes?: boolean;
    noContextFiles?: boolean;
    autonomous?: boolean;
    autonomousGates?: string[];
    autonomousGateRetries?: number;
    autonomousGateTimeoutMs?: number;
    autonomousMaxContinuations?: number;
    autonomousMaxTurns?: number;
    autonomousMaxTokens?: number;
    autonomousTimeoutMs?: number;
    goal?: string;
    goalTokenBudget?: number;
    listModels?: string | true;
    offline?: boolean;
    verbose?: boolean;
    messages: string[];
    fileArgs: string[];
    /** Unknown flags (potentially extension flags) - map of flag name to value */
    unknownFlags: Map<string, boolean | string>;
    diagnostics: Array<{
        type: "warning" | "error";
        message: string;
    }>;
}
export declare const INTERNAL_RUNTIME_COMMAND_MARKER = "\0prime-agent-runtime-command";
export declare function isValidThinkingLevel(level: string): level is ThinkingLevel;
export declare function parseArgs(args: string[]): Args;
//# sourceMappingURL=args.d.ts.map
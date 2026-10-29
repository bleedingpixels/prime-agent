/**
 * System prompt construction and project context loading
 */
import { type HarnessState } from "./refinement/index.js";
import { type Skill } from "./skills.js";
export interface BuildSystemPromptOptions {
    /** Custom system prompt (replaces default). */
    customPrompt?: string;
    /** Active tools. Tool schemas carry tool descriptions outside the prompt body. */
    selectedTools?: string[];
    /** Optional one-line tool snippets keyed by tool name. Used only for custom prompts. */
    toolSnippets?: Record<string, string>;
    /** Additional guideline bullets appended to the system prompt. */
    promptGuidelines?: string[];
    /** Text to append to system prompt. */
    appendSystemPrompt?: string;
    /** Working directory. */
    cwd: string;
    /** Conversation log path. */
    messagesPath?: string;
    /** Pre-loaded context files. */
    contextFiles?: Array<{
        path: string;
        content: string;
    }>;
    /** Pre-loaded skills. */
    skills?: Skill[];
    /** Whether to include the model-facing rlm recursion guidance. */
    allowRecursion?: boolean;
    /** Whether Ultra mode should add proactive, bounded delegation guidance. */
    proactiveSubagents?: boolean;
    /** Fixed recursive-agent depth for this session. */
    rlmDepth?: number;
    /** Human-readable parent name or id for child communication doctrine. */
    rlmParentAgent?: string;
    /** Global harness state to inject as compact persistent context. */
    harnessState?: HarnessState;
}
/** Build the system prompt with tools, guidelines, and context */
export declare function buildSystemPrompt(options: BuildSystemPromptOptions): string;
//# sourceMappingURL=system-prompt.d.ts.map
export interface RlmPromptOptions {
    cwd: string;
    skillsDir?: string;
    installedSkills?: string[];
    messagesPath: string;
    allowRecursion?: boolean;
    depth?: number;
    parentAgent?: string;
    activeTools?: string[];
}
export interface ChildAgentDoctrineOptions {
    depth?: number;
    parentAgent?: string;
    installedSkills?: string[];
    activeTools?: string[];
}
export declare function buildChildAgentDoctrine(options: ChildAgentDoctrineOptions): string | undefined;
export declare function buildRlmPrompt(options: RlmPromptOptions): string;
/**
 * Supplemental sub-agent delegation guidance, appended after the base RLM
 * prompt (see system-prompt.ts). The recursion block covers the mechanics
 * (`rlm(...)` admission and handle management); this block adds the
 * when and why in the same When -> Why -> menu order Claude Code's Agent tool
 * uses. The subagent-spec menu itself renders just after this, inside the
 * harness-state block.
 */
export declare function buildSubagentGuidance(options?: {
    includeRefineExamples?: boolean;
    hasAgentMessage?: boolean;
    hasAgentObserve?: boolean;
}): string;
//# sourceMappingURL=rlm.d.ts.map
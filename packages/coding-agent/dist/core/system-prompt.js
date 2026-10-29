/**
 * System prompt construction and project context loading
 */
import { buildChildAgentDoctrine, buildRlmPrompt, buildSubagentGuidance } from "./prompts/index.js";
import { formatHarnessStateForPrompt, REFINE_SKILL_NAME } from "./refinement/index.js";
import { formatSkillsForPrompt, getPythonSkillRuntimeInfo } from "./skills.js";
const ULTRA_MULTI_AGENT_MODE = `<multi_agent_mode>
Ultra reasoning is active. Proactively delegate independent, context-heavy research, review, or implementation when parallelism would materially improve speed or quality. Keep fan-out bounded, request explicit replies when results are needed, synthesize the results, and independently verify the final answer. Do not delegate trivial, tightly coupled, or inherently serial work.
</multi_agent_mode>`;
/** Build the system prompt with tools, guidelines, and context */
export function buildSystemPrompt(options) {
    const { customPrompt, selectedTools, promptGuidelines, appendSystemPrompt, cwd, messagesPath, contextFiles: providedContextFiles, skills: providedSkills, allowRecursion, proactiveSubagents, harnessState, } = options;
    const promptCwd = cwd.replace(/\\/g, "/");
    const promptMessagesPath = (messagesPath ?? "not persisted").replace(/\\/g, "/");
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const date = `${year}-${month}-${day}`;
    const appendSection = appendSystemPrompt ? `\n\n${appendSystemPrompt}` : "";
    const contextFiles = providedContextFiles ?? [];
    const skills = providedSkills ?? [];
    const tools = selectedTools ?? ["ipython"];
    const hasIpython = tools.includes("ipython");
    const hasBash = tools.includes("bash");
    const visibleSkills = skills.filter((skill) => !skill.disableModelInvocation);
    const visiblePythonSkillImportNames = getPythonSkillRuntimeInfo(visibleSkills).map((skill) => skill.importName);
    const hasRefineSkill = visibleSkills.some((skill) => skill.name === REFINE_SKILL_NAME);
    const ultraSection = proactiveSubagents && (allowRecursion ?? true) && hasIpython ? `\n\n${ULTRA_MULTI_AGENT_MODE}` : "";
    if (customPrompt) {
        let prompt = customPrompt;
        // Append project context files
        if (contextFiles.length > 0) {
            prompt += "\n\n# Project Context\n\n";
            prompt += "Project-specific instructions and guidelines:\n\n";
            for (const { path: filePath, content } of contextFiles) {
                prompt += `## ${filePath}\n\n${content}\n\n`;
            }
        }
        // Append skills section only when the model has a way to inspect skill files.
        const customPromptHasFileAccess = !selectedTools || selectedTools.includes("ipython") || selectedTools.includes("bash");
        if (customPromptHasFileAccess && skills.length > 0) {
            prompt += formatSkillsForPrompt(skills);
        }
        // Add date and working directory last
        prompt += `\nCurrent date: ${date}`;
        prompt += `\nCurrent working directory: ${promptCwd}`;
        const childDoctrine = buildChildAgentDoctrine({
            depth: options.rlmDepth,
            parentAgent: options.rlmParentAgent,
            installedSkills: visiblePythonSkillImportNames,
            activeTools: tools,
        });
        if (childDoctrine) {
            prompt += `\n\n${childDoctrine}`;
        }
        if (harnessState) {
            prompt += `\n\n${formatHarnessStateForPrompt(harnessState, { includeIpythonExamples: hasIpython, includeShellExamples: hasBash, includeRefineExamples: hasIpython && hasRefineSkill })}`;
        }
        if (appendSection) {
            prompt += appendSection;
        }
        prompt += ultraSection;
        return prompt;
    }
    let prompt = buildRlmPrompt({
        cwd: promptCwd,
        messagesPath: promptMessagesPath,
        installedSkills: visiblePythonSkillImportNames,
        activeTools: tools.filter((name) => name === "ipython" || name === "bash" || name === "edit"),
        allowRecursion,
        depth: options.rlmDepth,
        parentAgent: options.rlmParentAgent,
    });
    // Appended AFTER the trained buildRlmPrompt prefix, and before the harness-state
    // menu, so the model reads when/why to delegate and then sees the concrete subagent
    // specs it can match against — the same ordering as Claude Code's Agent tool.
    if ((allowRecursion ?? true) && hasIpython) {
        const visiblePythonSkillNames = new Set(getPythonSkillRuntimeInfo(visibleSkills).map((skill) => skill.importName));
        prompt += `\n\n${buildSubagentGuidance({
            includeRefineExamples: hasRefineSkill,
            hasAgentMessage: visiblePythonSkillNames.has("agent_message"),
            hasAgentObserve: visiblePythonSkillNames.has("agent_observe"),
        })}`;
    }
    if (harnessState) {
        prompt += `\n\n${formatHarnessStateForPrompt(harnessState, { includeIpythonExamples: hasIpython, includeShellExamples: hasBash, includeRefineExamples: hasIpython && hasRefineSkill })}`;
    }
    const guidelines = formatPromptGuidelines(promptGuidelines);
    if (guidelines) {
        prompt += `\n\n# Additional Guidance\n\n${guidelines}`;
    }
    // Append project context files
    if (contextFiles.length > 0) {
        prompt += "\n\n# Project Context\n\n";
        prompt += "Project-specific instructions and guidelines:\n\n";
        for (const { path: filePath, content } of contextFiles) {
            prompt += `## ${filePath}\n\n${content}\n\n`;
        }
    }
    // Append skills section only when the model has a way to inspect skill files.
    const hasFileAccess = tools.includes("ipython") || tools.includes("bash");
    if (hasFileAccess && skills.length > 0) {
        prompt += formatSkillsForPrompt(skills);
    }
    if (appendSection) {
        prompt += appendSection;
    }
    prompt += ultraSection;
    return prompt;
}
function formatPromptGuidelines(promptGuidelines) {
    const guidelinesList = [];
    const guidelinesSet = new Set();
    for (const guideline of promptGuidelines ?? []) {
        const normalized = guideline.trim();
        if (normalized.length > 0 && !guidelinesSet.has(normalized)) {
            guidelinesSet.add(normalized);
            guidelinesList.push(normalized);
        }
    }
    return guidelinesList.map((guideline) => `- ${guideline}`).join("\n");
}
//# sourceMappingURL=system-prompt.js.map
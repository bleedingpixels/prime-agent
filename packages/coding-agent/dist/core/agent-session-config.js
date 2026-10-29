export function mergeAgentSessionRuntimeConfig(base, override) {
    if (!override) {
        return cloneAgentSessionRuntimeConfig(base);
    }
    return {
        cwd: override.cwd ?? base.cwd,
        agentDir: override.agentDir ?? base.agentDir,
        sessionDir: override.sessionDir ?? base.sessionDir,
        provider: override.provider ?? base.provider,
        model: override.model ?? base.model,
        apiKey: override.apiKey ?? base.apiKey,
        systemPrompt: override.systemPrompt ?? base.systemPrompt,
        appendSystemPrompt: cloneArray(override.appendSystemPrompt ?? base.appendSystemPrompt),
        thinking: override.thinking ?? base.thinking,
        models: cloneArray(override.models ?? base.models),
        tools: cloneArray(override.tools ?? base.tools),
        noTools: override.noTools ?? base.noTools,
        noBuiltinTools: override.noBuiltinTools ?? base.noBuiltinTools,
        extensions: cloneArray(override.extensions ?? base.extensions),
        noExtensions: override.noExtensions ?? base.noExtensions,
        skills: cloneArray(override.skills ?? base.skills),
        noSkills: override.noSkills ?? base.noSkills,
        promptTemplates: cloneArray(override.promptTemplates ?? base.promptTemplates),
        noPromptTemplates: override.noPromptTemplates ?? base.noPromptTemplates,
        themes: cloneArray(override.themes ?? base.themes),
        noThemes: override.noThemes ?? base.noThemes,
        noContextFiles: override.noContextFiles ?? base.noContextFiles,
        autonomous: mergeAutonomousConfig(base.autonomous, override.autonomous),
        extensionFlagValues: base.extensionFlagValues || override.extensionFlagValues
            ? { ...(base.extensionFlagValues ?? {}), ...(override.extensionFlagValues ?? {}) }
            : undefined,
        serializedRefine: override.serializedRefine ?? base.serializedRefine,
        executionMode: override.executionMode ?? base.executionMode,
        telemetryDisabled: base.telemetryDisabled || override.telemetryDisabled ? true : undefined,
        initialGoal: override.initialGoal ?? base.initialGoal,
    };
}
function cloneAgentSessionRuntimeConfig(config) {
    return {
        ...config,
        appendSystemPrompt: cloneArray(config.appendSystemPrompt),
        models: cloneArray(config.models),
        tools: cloneArray(config.tools),
        extensions: cloneArray(config.extensions),
        skills: cloneArray(config.skills),
        promptTemplates: cloneArray(config.promptTemplates),
        themes: cloneArray(config.themes),
        autonomous: mergeAutonomousConfig(undefined, config.autonomous),
        extensionFlagValues: config.extensionFlagValues ? { ...config.extensionFlagValues } : undefined,
        serializedRefine: config.serializedRefine,
        executionMode: config.executionMode,
        telemetryDisabled: config.telemetryDisabled,
        initialGoal: config.initialGoal ? { ...config.initialGoal } : undefined,
    };
}
export function mergeAutonomousConfig(base, override) {
    if (!base && !override) {
        return undefined;
    }
    const gates = mergeAutonomousGateConfig(base?.gates, override?.gates);
    return {
        ...(base ?? {}),
        ...(override ?? {}),
        ...(gates ? { gates } : {}),
    };
}
function mergeAutonomousGateConfig(base, override) {
    if (!base && !override) {
        return undefined;
    }
    return {
        ...(base ?? {}),
        ...(override ?? {}),
        ...(override?.commands !== undefined || base?.commands !== undefined
            ? { commands: cloneArray(override?.commands ?? base?.commands) }
            : {}),
    };
}
function cloneArray(value) {
    return value ? [...value] : undefined;
}
//# sourceMappingURL=agent-session-config.js.map
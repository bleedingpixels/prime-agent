export function createInteractiveModeUiServices(session) {
    return {
        settingsManager: session.settingsManager,
        modelRegistry: session.modelRegistry,
        getInitialCwd: () => session.sessionManager.getCwd(),
        getInitialSessionName: () => session.sessionManager.getSessionName(),
        getThemes: () => session.resourceLoader.getThemes().themes,
    };
}
export function createInteractiveModeUiServicesFromServices(options) {
    const { services, sessionManager } = options;
    return {
        settingsManager: services.settingsManager,
        modelRegistry: services.modelRegistry,
        getInitialCwd: () => sessionManager.getCwd(),
        getInitialSessionName: () => sessionManager.getSessionName(),
        getThemes: () => services.resourceLoader.getThemes().themes,
    };
}
export function createInteractiveModeLocalSessionHost(runtimeHost) {
    return {
        createUiServices: () => createInteractiveModeUiServices(runtimeHost.session),
        getSessionManager: () => runtimeHost.session.sessionManager,
        getExtensionRunner: () => runtimeHost.session.extensionRunner,
        getToolRendererDefinition: (toolName) => {
            const definition = runtimeHost.session.getToolDefinition(toolName);
            if (!definition) {
                return undefined;
            }
            const rendererDefinition = {};
            if (definition.renderCall) {
                rendererDefinition.renderCall = definition.renderCall;
            }
            if (definition.renderResult) {
                rendererDefinition.renderResult = definition.renderResult;
            }
            if (definition.renderShell) {
                rendererDefinition.renderShell = definition.renderShell;
            }
            return Object.keys(rendererDefinition).length > 0 ? rendererDefinition : undefined;
        },
        getSystemPrompt: () => runtimeHost.session.systemPrompt,
        getAbortSignal: () => runtimeHost.session.agent.signal,
        bindExtensions: (bindings) => runtimeHost.session.bindExtensions(bindings),
        newSession: (options) => runtimeHost.newSession(options),
        fork: (entryId, options) => runtimeHost.fork(entryId, options),
        switchSession: (sessionPath, options) => runtimeHost.switchSession(sessionPath, options),
    };
}
//# sourceMappingURL=interactive-mode-services.js.map
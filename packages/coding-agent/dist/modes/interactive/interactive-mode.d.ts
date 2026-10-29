/**
 * Interactive mode for the coding agent.
 * Handles TUI rendering and user interaction, delegating agent execution to AgentConnection.
 */
import { type ImageContent } from "@earendil-works/pi-ai";
import { type Component } from "@earendil-works/pi-tui";
import type { AgentConnection, AgentConnectionState } from "../agent-connection/index.js";
import type { InteractiveModeLocalSessionHost, InteractiveModeUiServices } from "./interactive-mode-services.js";
import type { ClientPromptStashStore } from "./prompt-stash-state.js";
export declare const START_HINTS: readonly ["Try \"refactor @<filepath>\"", "Try \"fix bugs in @<filepath>\"", "Try \"add tests for @<filepath>\"", "Try \"explain how @<filepath> works\"", "Try \"improve performance in @<filepath>\""];
export declare function getRandomStartHint(random?: () => number): (typeof START_HINTS)[number];
export declare function formatQueuedMessagePreview(message: string, label: "Steering" | "Follow-up"): string;
export declare function styleQueuedMessagePreview(message: string, label: "Steering" | "Follow-up", isRecognizedSlashCommand: (name: string) => boolean): string;
export declare function formatSplashCwd(cwd: string): string;
export declare function truncatePathMiddle(value: string, width: number): string;
export interface BrandSplashMetadataLine {
    label: string;
    value: string;
}
export interface BrandSplashHeaderOptions {
    logo?: string;
    topPadding?: boolean;
    getExtraMetadata?: () => readonly BrandSplashMetadataLine[];
    getHideStartHint?: () => boolean;
    getStartHint?: () => string;
}
export declare class BrandSplashHeader implements Component {
    private readonly version;
    private readonly getModelId;
    private readonly getCwd;
    private readonly verboseInstructions?;
    private readonly options;
    private readonly logoRaw;
    private readonly logoCanvasWidth;
    private readonly gutter;
    private readonly labelWidth;
    constructor(version: string, getModelId: () => string | undefined, getCwd: () => string, verboseInstructions?: string | undefined, options?: BrandSplashHeaderOptions);
    invalidate(): void;
    render(width: number): string[];
}
export declare function updateArgsIncludeSelf(args: readonly string[]): boolean;
export declare function buildUpdateRelaunchArgs(args: readonly string[], sessionFile: string | undefined): string[];
export declare function buildUpdateChildArgs(args: readonly string[], daemonSocketPath: string): string[];
export declare function resolveInteractiveUpdateDaemonSocketPath(args: readonly string[], activeDaemonSocketPath: string): string;
/**
 * Options for InteractiveMode initialization.
 */
export interface InteractiveInitialPrompt {
    text: string;
    images?: ImageContent[];
}
export interface InteractiveModeOptions {
    /** Providers that were migrated to auth.json (shows warning) */
    migratedProviders?: string[];
    /** Warning message if session model couldn't be restored */
    modelFallbackMessage?: string;
    /** One-off warning shown on startup. */
    startupNotice?: string;
    /** Initial message to send on startup (can include @file content) */
    initialMessage?: string;
    /** Images to attach to the initial message */
    initialImages?: ImageContent[];
    /** Additional text-only messages to send after the initial message. */
    initialMessages?: string[];
    /** Additional image-bearing prompts to send after the initial messages. */
    initialPrompts?: InteractiveInitialPrompt[];
    /** Force verbose startup (overrides quietStartup setting) */
    verbose?: boolean;
    /** Agent execution boundary. InteractiveMode never talks directly to AgentSession for core execution. */
    agentConnection: AgentConnection;
    /** Exact daemon socket to preserve across an interactive self-update restart. */
    daemonSocketPath?: string;
    /**
     * Local-only host for in-process extension binding and callback-bearing session operations.
     * This must remain optional adapter glue, not a generic execution dependency.
     */
    localSessionHost?: InteractiveModeLocalSessionHost;
    /** Bind extension handlers in the local session host. Disabled for daemon/gateway-backed clients. */
    bindLocalSessionExtensions?: boolean;
    /** UI-local services used for settings, auth, resources, and rendering. Defaults to services from localSessionHost. */
    uiServices?: InteractiveModeUiServices;
    /** Extra cleanup for externally-owned UI service hosts. Runs after the connection is disposed and before process exit. */
    onShutdown?: () => void | Promise<void>;
    /** Allow returning from a full session to the agents view without stopping the daemon-owned agent. */
    returnToAgentsView?: boolean;
    /** Enter fullscreen regardless of the persisted fullscreen preference. */
    forceFullscreen?: boolean;
    /**
     * The agents view already surfaced global startup notices (app/extension updates, tmux setup),
     * so this session must not repeat them in its chat stream. Distinct from `returnToAgentsView`,
     * which also covers direct daemon attaches where the agents view was never shown.
     */
    agentsViewOwnsStartupNotices?: boolean;
    /** Persisted RLM depth supplied by the daemon SessionSummary. */
    sessionDepth?: number;
    /** Whether the unified daemon/catalog projection had any direct children. */
    sessionHasChildren?: boolean;
    /** Client-owned stash store shared across chat views in this TUI process. */
    promptStashStore?: ClientPromptStashStore;
    /** Initial stable session id used to scope prompt stash state. */
    promptStashSessionId?: string;
}
export interface InteractiveModeRunResult {
    type: "agents_view" | "scoped_agents_view";
    source: Pick<AgentConnectionState, "activeSessionId" | "sessionFile" | "sessionId" | "sessionName" | "cwd">;
}
export declare function formatAgentDepthLabel(depth: number | undefined, hasChildren: boolean): string | undefined;
export declare class InteractiveMode {
    private options;
    private static readonly EXIT_HINT_DURATION_MS;
    private static readonly ESCAPE_REPEAT_WINDOW_MS;
    private uiServices;
    private agentConnection;
    private localSessionHost;
    private bindLocalSessionExtensions;
    private ui;
    private chatContainer;
    private shortcutGuideContainer;
    private pendingMessagesContainer;
    private statusContainer;
    private queuedMessagesContainer;
    private sideQuestionContainer;
    private featureHintContainer;
    private defaultEditor;
    private editor;
    private readonly promptStashStore;
    private promptStashSessionId;
    private promptStashState;
    private editorComponentFactory;
    private autocompleteProvider;
    private autocompleteProviderWrappers;
    private fdPath;
    private mainContainer;
    private mainViewContainer;
    private promptDock;
    private footerSlot;
    private fullscreenEnabled;
    private editorContainer;
    private footer;
    private footerDataProvider;
    private keybindings;
    private version;
    private readonly startHint;
    private isInitialized;
    private onInputCallback?;
    private submittedInputBehavior;
    private latestEditorPromptStash;
    private pendingSubmittedPromptStash;
    private inputSubmissionGeneration;
    private inputSubmissionsPending;
    private pendingPromptStashReleases;
    private readonly retainedSubmissionGenerations;
    private admitPendingStartupPrompts;
    private agentsViewRequest;
    private loadingAnimation;
    private workingMessage;
    private workingVisible;
    private workingIndicatorOptions;
    private workingStartedAt;
    private workingTimer;
    private readonly featureHintDeck;
    private currentFeatureHint;
    private featureHintEligibleAt;
    private featureHintTimer;
    private featureHintAnimationTimer;
    private featureHintComponent;
    private featureHintRunPending;
    private featureHintSuppressedByQueue;
    private pulseTimer;
    private pulseFrame;
    private readonly activityTracker;
    private contextUsageTokenBaseline;
    private contextUsageRefresh;
    private readonly defaultHiddenThinkingLabel;
    private hiddenThinkingLabel;
    private ctrlCExitHintExpiresAt;
    private ctrlCExitHintTimer;
    private escapeRepeatAction;
    private escapeRepeatExpiresAt;
    private escapeRepeatTimer;
    private anthropicSubscriptionWarningShown;
    private lastStatusSpacer;
    private lastStatusText;
    private lastGoalAnnouncement;
    private goalTrayTimer;
    private streamingComponent;
    private streamingMessage;
    private sideQuestionComponent;
    private sideQuestionEvent;
    private sideQuestionTurns;
    private activeSideQuestionId;
    private sideQuestionBash;
    private sideQuestionBashComponent;
    private sideQuestionBashDiscarded;
    private activeBashComponent;
    private pendingBashComponents;
    private sessionEventQueue;
    private sessionEventGeneration;
    private fastModeToggleQueue;
    private pendingTools;
    private ipythonToolComponents;
    private lateIpythonSentAgentMessages;
    private pendingToolCreations;
    private startedToolCalls;
    private pendingToolGeneration;
    private toolDefinitionCache;
    private agentRunFileChanges;
    private subagentSummaryLine;
    private subagentSnapshots;
    private rlmNodeId;
    private toolOutputExpanded;
    private agentMessagesExpanded;
    private hideThinkingBlock;
    private skillCommands;
    private connectionCommands;
    private connectionModels;
    private connectionModelCatalog;
    private connectionConfiguredProviders;
    private connectionModelsFetchedAt;
    private connectionModelsRefreshVersion;
    private connectionModelsRefreshInFlight;
    private connectionState;
    private connectionResourceSnapshot;
    private sessionHasMessages;
    private heartbeatCatalog;
    private heartbeats;
    private heartbeatRefreshPromise;
    private heartbeatRefreshRequested;
    private heartbeatManager;
    private heartbeatManagerHandle;
    private heartbeatManagerRefreshTimer;
    private pastedImages;
    private nextImageMarkerId;
    private unsubscribe?;
    private signalCleanupHandlers;
    private autoCompactionLoader;
    private retryLoader;
    private retryCountdown;
    private traceUploadAllAbortController;
    private connectionQueue;
    private readonly queueSelection;
    private isApplyingQueueSelectionText;
    private queueMutationChain;
    private pendingQueueEdit;
    private shutdownRequested;
    private extensionSelector;
    private extensionInput;
    private extensionEditor;
    private extensionTerminalInputUnsubscribers;
    private activeConnectionExtensionUiRequests;
    private extensionWidgetsAbove;
    private extensionWidgetsBelow;
    private widgetContainerAbove;
    private widgetContainerBelow;
    private recapContainer;
    private sessionRecap;
    private customFooter;
    private headerContainer;
    private builtInHeader;
    private customHeader;
    private getLocalSessionHost;
    private get settingsManager();
    private get modelRegistry();
    constructor(options: InteractiveModeOptions);
    private get promptStash();
    private set promptStash(value);
    private hydratePromptStash;
    private bindPromptStashSession;
    private releasePromptStashSession;
    private completeDeferredPromptStashRelease;
    private getAutocompleteSourceTag;
    private getAutocompleteSourceLabel;
    private getBuiltInCommandConflictDiagnostics;
    private isRecognizedSlashCommand;
    private createBaseAutocompleteProvider;
    private setupAutocompleteProvider;
    init(): Promise<void>;
    /**
     * Update terminal title with session name and cwd.
     */
    private updateTerminalTitle;
    /**
     * Run the interactive mode. This is the main entry point.
     * Initializes the UI, shows warnings, processes initial messages, and starts the interactive loop.
     */
    run(): Promise<InteractiveModeRunResult>;
    private getModelFallbackWarningAction;
    private getOnboardingState;
    private shouldRunOnboarding;
    private shouldRunPrimeCliOnboardingSplash;
    private markOnboardingShown;
    private runStartupOnboarding;
    private showOnboardingModelSelection;
    private runOnboardingFlow;
    private getMarkdownThemeWithSettings;
    private formatDisplayPath;
    private formatExtensionDisplayPath;
    private formatContextPath;
    private getStartupExpansionState;
    /**
     * Get a short path relative to the package root for display.
     */
    private getShortPath;
    private getCompactPathLabel;
    private getCompactPackageSourceLabel;
    private getCompactExtensionLabel;
    private getCompactDisplayPathSegments;
    private getCompactNonPackageExtensionLabel;
    private getCompactExtensionLabels;
    private getDisplaySourceInfo;
    private getScopeGroup;
    private isPackageSource;
    private buildScopeGroups;
    private formatScopeGroups;
    private findSourceInfoForPath;
    private formatPathWithSource;
    private formatDiagnostics;
    private showLoadedResources;
    private bindCurrentSessionExtensions;
    private applyRuntimeSettings;
    private refreshConnectionQueue;
    private replaceConnectionQueue;
    private refreshConnectionCatalog;
    private refreshHeartbeatCatalog;
    private applyHeartbeatCatalog;
    private updateScopedHeartbeats;
    private applyConnectionStateSnapshot;
    private patchConnectionState;
    private applyOptimisticContextUsage;
    private refreshConnectionContextUsage;
    private updateConnectionStateFromEvent;
    private getCurrentCwd;
    private getCurrentSessionName;
    private applyAuthStaleEvent;
    private getCurrentModel;
    private getCurrentModelId;
    private isAgentStreaming;
    private isAgentCompacting;
    private isBashRunning;
    private hasInterruptibleWork;
    private getRetryAttempt;
    private getQueuedActionCount;
    private getGoalState;
    private getConnectionContextUsage;
    private getScopedModelState;
    private rebindCurrentSession;
    private handleFatalRuntimeError;
    private resetCurrentSessionRenderState;
    private resetPendingToolState;
    private renderCurrentSessionState;
    private refreshCommandCatalogForCurrentSession;
    private renderResyncedSession;
    private getCachedToolDefinition;
    private loadToolDefinition;
    private getLatestStreamingToolCall;
    private registerIpythonToolComponent;
    private getOrCreatePendingToolComponent;
    private createToolExecutionDefinition;
    private preloadToolDefinitions;
    /**
     * Set up keyboard shortcuts registered by extensions.
     */
    private setupExtensionShortcuts;
    /**
     * Set extension status text in the footer.
     */
    private setExtensionStatus;
    private getWorkingLoaderMessage;
    private createWorkingLoader;
    private formatWorkingElapsed;
    private updateWorkingLoaderMessage;
    private startWorkingTimer;
    private startWorkingLoader;
    private stopWorkingLoader;
    private startFeatureHintPresentation;
    private showFeatureHint;
    private clearFeatureHintPresentation;
    private resumeFeatureHintPresentation;
    private shouldSuppressFeatureHint;
    private endFeatureHintRun;
    private prepareFeatureHintRun;
    private updateWorkingPulse;
    private tickWorkingPulse;
    private stopWorkingPulse;
    private shouldShowWorkingLoader;
    private startCompactionLoader;
    private syncWorkingLoader;
    private setWorkingVisible;
    private setWorkingIndicator;
    private setHiddenThinkingLabel;
    /**
     * Set an extension widget (string array or custom component).
     */
    private setExtensionWidget;
    private clearExtensionWidgets;
    private resetExtensionUI;
    private static readonly MAX_WIDGET_LINES;
    /**
     * Render all extension widgets to the widget container.
     */
    private renderWidgets;
    private renderRecap;
    private renderWidgetContainer;
    /**
     * Set a custom footer component, or restore the built-in footer.
     */
    private setExtensionFooter;
    /**
     * Set a custom header component, or restore the built-in header.
     */
    private setExtensionHeader;
    private addExtensionTerminalInputListener;
    private clearExtensionTerminalInputListeners;
    /**
     * Create the ExtensionUIContext for extensions.
     */
    private createExtensionUIContext;
    /**
     * Show a selector for extensions.
     */
    private showExtensionSelector;
    /**
     * Hide the extension selector.
     */
    private hideExtensionSelector;
    private showExtensionConfirm;
    private promptForMissingSessionCwd;
    /**
     * Show a text input for extensions.
     */
    private showExtensionInput;
    /**
     * Hide the extension input.
     */
    private hideExtensionInput;
    /**
     * Show a multi-line editor for extensions (with Ctrl+G support).
     */
    private showExtensionEditor;
    /**
     * Hide the extension editor.
     */
    private hideExtensionEditor;
    /**
     * Set a custom editor component from an extension.
     * Pass undefined to restore the default editor.
     */
    private setCustomEditorComponent;
    /**
     * Show a notification for extensions.
     */
    private showExtensionNotify;
    private showExtensionCustom;
    /**
     * Show an extension error in the UI.
     */
    private showExtensionError;
    private setupKeyHandlers;
    private snapshotPromptStashFrom;
    private snapshotPromptStash;
    private handlePromptStash;
    private restorePromptStashIfEditorEmpty;
    private retainSubmittedDraft;
    private retainStartupPromptDrafts;
    private getPromptStashImages;
    private handleClipboardImagePaste;
    /**
     * Record a pasted image, evicting the oldest entries once the retained bytes
     * exceed {@link MAX_PASTED_IMAGE_BYTES} so a long session stays bounded. The
     * just-added image and any whose marker is still referenced (editor or queues)
     * are never evicted, so a live marker never loses its image.
     */
    private rememberPastedImage;
    /**
     * Marker ids still reachable — current editor text, prompt history (recallable
     * with the up arrow), the compaction queue, and the connection queue. These are
     * never evicted so a recall or resend never finds a marker with no image.
     */
    private liveImageMarkerIds;
    /**
     * The images whose `[image #N]` markers are present in `text`, or undefined if
     * none. Read-only: the registry is never cleared here, so deleting a marker
     * simply drops its image while restoring the marker (undo, history, retry,
     * dequeue) brings it back. Marker presence in the sent text is the single
     * source of truth.
     *
     * Resolved against the current model: if it has no image input, attachments
     * are dropped here (matching the paste-time hint) rather than sent and
     * downgraded downstream.
     */
    private collectImagesFor;
    private hasPastedImagesFor;
    private handleSideQuestion;
    private handleSideQuestionEvent;
    private finishSideQuestionBash;
    private clearSideQuestion;
    private resetSideQuestion;
    private abortSideQuestion;
    private renderTreeNavigation;
    private setupEditorSubmitHandler;
    private subscribeToAgent;
    private handleConnectionExtensionUiRequest;
    private expectsConnectionExtensionUiResponse;
    private cancelActiveConnectionExtensionUiRequests;
    private resolveConnectionExtensionUiRequest;
    private handleEvent;
    private startAssistantStreamingMessage;
    private ensureAssistantStreamingComponent;
    private handleGoalUpdate;
    private syncGoalTray;
    private updateGoalTrayTimer;
    private stopGoalTrayTimer;
    private setGoalAnnouncementBaseline;
    private goalAnnouncementSnapshot;
    private shouldAnnounceGoalUpdate;
    private formatGoalStatus;
    private formatGoalDetailSuffix;
    private seedSubagentSummary;
    private replaceSubagentSummary;
    private updateSubagentSummary;
    private refreshSubagentSummary;
    private updateSubagentSummaryLine;
    private removeSubagentSnapshot;
    private resetSubagentSummary;
    private focusEditor;
    private focusSubagentSummary;
    private openScopedAgentsView;
    private handleSubagentSummaryChatAction;
    private getTrayOverrideLabel;
    private getTrayLocationLabel;
    private getShortcutsTrayHint;
    private isNewChat;
    private setSessionHasMessages;
    private getModelTrayLabel;
    private getAgentsViewTrayHint;
    private getTrayContextLabel;
    private getTrayHeartbeatLabel;
    private getTrayGoalLabel;
    private formatGoalElapsed;
    /** Extract text content from a user message */
    private getUserMessageText;
    private createLegacyHeartbeatPromptMessage;
    private isTextOnlyUserMessage;
    private isLikelyHeartbeatPromptTimestamp;
    private heartbeatLegacyPromptToleranceMs;
    /**
     * Show a status message in the chat.
     *
     * If multiple status messages are emitted back-to-back (without anything else being added to the chat),
     * we update the previous status line instead of appending new ones to avoid log spam.
     */
    private showStatus;
    private copyFullscreenSelection;
    private echoLocalCommand;
    private addMessageToEditorHistory;
    private addMessageToChat;
    /**
     * Render session context to chat. Used for initial load and rebuild after compaction.
     * @param sessionContext Session context to render
     * @param options.updateFooter Update footer state
     * @param options.populateHistory Add user messages to editor history
     * @param options.clearChat Clear the current transcript immediately before rendering
     * @param options.limitTranscript Limit transcript replay to the recent tail
     */
    private orderMessagesForTranscript;
    private renderSessionContext;
    renderInitialMessages(): Promise<void>;
    private restoreStreamingMessageFromSnapshot;
    private getSessionContextFromConnectionSnapshot;
    getUserInput(): Promise<string | undefined>;
    private rebuildChatFromMessages;
    private handleEscape;
    private armEscapeRepeat;
    private takeEscapeRepeatAction;
    private clearEscapeRepeat;
    private handleCtrlC;
    private handleInterruptKey;
    private interruptOrClearInput;
    private showCtrlCExitHint;
    private clearCtrlCExitHint;
    private isCtrlCExitHintVisible;
    private handleCtrlD;
    /**
     * Gracefully shutdown the agent.
     * Stops the TUI before emitting shutdown events so extension UI cleanup cannot
     * repaint the final frame while the process is exiting.
     */
    private isShuttingDown;
    private shutdown;
    /**
     * Tear down the session's terminal UI before handing the terminal back to the
     * agents view. Drains in-flight Kitty/SSH key-release sequences so they don't
     * leak into the parent UI, then stops the renderer and theme watcher. Safe to
     * call from a crash path too; idempotent via stop().
     */
    teardownSessionUi(options?: {
        preserveAltScreen?: boolean;
    }): Promise<void>;
    private handleAgentsBack;
    private requestAgentsView;
    private returnToAgentsView;
    private emergencyTerminalExit;
    private checkShutdownRequested;
    private registerSignalHandlers;
    private unregisterSignalHandlers;
    private handleCtrlZ;
    private handleFollowUp;
    private browseQueueSelection;
    /** Serializes queue mutations so rapid keypresses never race each other or use stale indices. */
    private enqueueQueueMutation;
    private moveQueueSelection;
    /**
     * Applies the edited text to the selected queued message. Returns true when
     * the submission was consumed (the caller must not treat it as a new prompt).
     * Empty text deletes; otherwise replaces, moving the item to `targetLane`.
     */
    private applyQueueSelection;
    /**
     * Images for a queue replace: undefined preserves the server's images (some
     * markers cannot be resolved by this client), [] clears, a list replaces.
     */
    private collectQueueReplaceImages;
    private setEditorTextFromQueueSelection;
    private getQueueSelectionHeader;
    private updateEditorBorderColor;
    private getPromptContextContainers;
    private getPromptDockComponents;
    /** Enter or leave fullscreen rendering without touching the persisted setting. */
    private applyFullscreen;
    private setFullscreenMode;
    private toggleToolOutputExpansion;
    private toggleAgentMessageExpansion;
    private setToolsExpanded;
    /** Expansion state for a chat component: agent messages toggle separately from tools. */
    private expansionStateFor;
    private applyChatExpansion;
    private toggleThinkingBlockVisibility;
    private openExternalEditor;
    private clearInputBar;
    showError(errorMessage: string): void;
    showWarning(warningMessage: string): void;
    showNewVersionNotification(newVersion: string): void;
    showPackageUpdateNotification(packages: string[]): void;
    /** Get all queued messages from the session-owned connection queue. */
    private getAllQueuedMessages;
    private updatePendingMessagesDisplay;
    /** Move pending bash components from pending area to chat */
    private flushPendingBashComponents;
    /**
     * Shows a selector component in place of the editor.
     * @param create Factory that receives a `done` callback and returns the component and focus target
     */
    private showSelector;
    private showFullPaneOverlay;
    private showSettingsSelector;
    private handleModelCommand;
    private findExactModelMatch;
    private applySelectedModel;
    private completeModelSelection;
    private ensureModelProviderConfigured;
    private isModelProviderConfigured;
    private applyConnectionModelCatalog;
    private getConnectionAvailableModels;
    private getConnectionModelCatalog;
    private getCachedModelCandidates;
    private getModelSelectorRefreshPromise;
    private invalidateConnectionModelRefresh;
    private invalidateConnectionModels;
    private refreshConnectionModelsAfterAuthChange;
    private getModelCandidates;
    private getScopedModelsFromModelIds;
    private updateAvailableProviderCount;
    private maybeWarnAboutAnthropicSubscriptionAuth;
    private getAvailableThinkingLevels;
    private getThinkingLevelCompletions;
    private getHeartbeatArgumentCompletions;
    private currentModelSupportsFastMode;
    private handleFastCommand;
    private handleEffortCommand;
    private showThinkingSelector;
    private applyThinkingLevel;
    private showModelSelector;
    private showConfigurationMenu;
    private showModelsSelector;
    private showUserMessageSelector;
    private handleCloneCommand;
    private showTreeSelector;
    private handleResumeSession;
    private showOnboardingSplash;
    private createAuthFlows;
    private prepareForModelSelectionAfterLogin;
    private handleMcpCommand;
    private showLogoutSelector;
    private handleUpdateCommand;
    private handleReloadCommand;
    private handleExportCommand;
    private getPathCommandArgument;
    private handleImportCommand;
    private handleShareCommand;
    private handleCopyCommand;
    private handleNameCommand;
    private handleRlmMaxDepthCommand;
    private handleSessionCommand;
    private handleLogsCommand;
    private handleSystemPromptCommand;
    private formatTraceUploadResult;
    private uploadCurrentTraceOnce;
    private previewCurrentTrace;
    private formatTracePreview;
    private uploadAllTraces;
    private handleTracesCommand;
    private handleContextCommand;
    private handleHeartbeatCommand;
    private showHeartbeatManager;
    private closeHeartbeatManager;
    private scheduleHeartbeatManagerRefresh;
    private manageHeartbeat;
    private showHeartbeat;
    private handleChangelogCommand;
    /**
     * Capitalize keybinding for display (e.g., "ctrl+c" -> "Ctrl+C").
     */
    private capitalizeKey;
    /**
     * Get capitalized display string for an app keybinding action.
     */
    private getAppKeyDisplay;
    /**
     * Get capitalized display string for an editor keybinding action.
     */
    private getEditorKeyDisplay;
    private getShortcutGuide;
    private getHotkeysGuide;
    private showShortcutGuide;
    private handleHotkeysCommand;
    private clearShortcutGuide;
    private handleClearCommand;
    private handleDebugCommand;
    private handleArminSaysHi;
    private handleDementedDelves;
    private handleDaxnuts;
    private checkDaxnutsEasterEgg;
    stop(options?: {
        preserveAltScreen?: boolean;
    }): void;
}
//# sourceMappingURL=interactive-mode.d.ts.map
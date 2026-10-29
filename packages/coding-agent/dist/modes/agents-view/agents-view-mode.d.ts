import { type AutocompleteProvider, type Component, type Focusable } from "@earendil-works/pi-tui";
import type { AgentSessionRuntimeConfig } from "../../core/agent-session-config.js";
import type { AgentConnectionHeartbeat, AgentConnectionSavedSessionInfo } from "../agent-connection/types.js";
import { type DaemonClosingReason, type DaemonCommand } from "../daemon/daemon-protocol.js";
import { type SessionSummary } from "../daemon/daemon-session-list.js";
import type { InteractiveModeUiServices } from "../interactive/interactive-mode-services.js";
import { ClientPromptStashStore } from "../interactive/prompt-stash-state.js";
import { type StartupNotices } from "../shared/startup-notices.js";
import { type AgentsViewScopeFrame, type AgentsViewScopeKey, type AgentsViewSelectionKey, type UnifiedSessionRecord } from "./agents-view-state.js";
export interface AgentsViewModeOptions {
    socketPath?: string;
    config: AgentSessionRuntimeConfig;
    uiServices: InteractiveModeUiServices;
    createUiServicesForSession?: (summary: SessionSummary) => Promise<InteractiveModeUiServices>;
    migratedProviders?: string[];
    modelFallbackMessage?: string;
    startupModelId?: string;
    verbose?: boolean;
    recoverDaemon?: () => Promise<void>;
    reconnectTimeoutMs?: number;
    promptStashStore?: ClientPromptStashStore;
    initialSession?: SessionSummary;
    /** When set, the first view is rooted at this session's direct children. */
    initialScopeKey?: AgentsViewScopeKey;
}
export type AgentsViewRunResult = {
    type: "exit";
} | {
    type: "scope_back";
    selection: SessionSummary;
    expandedAncestorSessionIds: string[];
    returnChat?: SessionSummary;
    hasChildren: boolean;
} | {
    type: "open";
    summary: SessionSummary;
    /** Row restored after chat closes; differs from summary only for an unattachable-child fallback. */
    selection?: SessionSummary;
    expandedAncestorSessionIds?: string[];
    hasChildren?: boolean;
    statusMessage?: string;
};
export type AgentsViewPersistentState = {
    selectedRowIdentity?: string;
    backSession?: SessionSummary;
    scopeFrames?: AgentsViewScopeFrame[];
    scopeRootSummary?: SessionSummary;
    selectedSessionKey?: AgentsViewSelectionKey;
    pendingExpandedAncestorSessionIds?: string[];
    expandedSubagentParents?: Set<string>;
    programShownParents?: Set<string>;
    statusMessage?: string;
    startupNotices?: StartupNotices;
    startupNoticesPromise?: Promise<StartupNotices>;
    query?: string;
    savedSessions?: AgentConnectionSavedSessionInfo[];
    lastSuccessfulSavedSessions?: AgentConnectionSavedSessionInfo[];
    lastSuccessfulLiveSummaries?: SessionSummary[];
    savedCatalogGeneration?: number;
    heartbeats?: AgentConnectionHeartbeat[];
};
export declare function resolveAgentsViewSessionUiServices(options: Pick<AgentsViewModeOptions, "createUiServicesForSession" | "uiServices">, summary: SessionSummary): Promise<InteractiveModeUiServices>;
export declare function createAgentsViewResumeConfig(config: AgentSessionRuntimeConfig, overrideCwd?: string): AgentSessionRuntimeConfig;
export declare function createAgentsViewListCommand(): Extract<DaemonCommand, {
    type: "list";
}>;
export declare function resolveAgentsViewActiveSummaryForPath(sessionPath: string, summaries: readonly SessionSummary[]): SessionSummary | undefined;
export declare function formatAgentsViewStatusLine(text: string): string;
export declare function combineAgentsViewStartupNotices(...notices: readonly (string | undefined)[]): string | undefined;
export declare function shouldReconnectAgentsViewDaemon(reason: DaemonClosingReason | undefined): boolean;
export declare function createAgentsViewReplyHeadline(text: string | undefined): string | undefined;
export declare function getAgentsViewDepth(scopeRoot: SessionSummary | undefined): number;
export declare function createInitialAgentsViewScopeFrames(initialScopeKey: AgentsViewScopeKey | undefined, returnChat: SessionSummary | undefined): AgentsViewScopeFrame[];
export declare function createInitialAgentsViewPersistentState(options: Pick<AgentsViewModeOptions, "initialScopeKey" | "initialSession">): AgentsViewPersistentState;
export declare function createScopeBackReturnChatOpenResult(result: Extract<AgentsViewRunResult, {
    type: "scope_back";
}>): Extract<AgentsViewRunResult, {
    type: "open";
}> | undefined;
export declare function resolveAgentsViewOpenCwd(summary: SessionSummary, fallbackCwd: string | undefined): {
    overrideCwd?: string;
    notice?: string;
};
export declare function runAgentsViewMode(options: AgentsViewModeOptions): Promise<void>;
declare const AGENTS_VIEW_COMMAND_NAMES: readonly ["name", "kill"];
export type AgentsViewCommandName = (typeof AGENTS_VIEW_COMMAND_NAMES)[number];
export interface AgentsViewCommand {
    name: AgentsViewCommandName;
    args: string;
}
/** Row-targeted commands the armed composer maps onto existing RPCs. */
export declare function parseAgentsViewCommand(text: string): AgentsViewCommand | undefined;
/**
 * Reject recognized built-ins that are neither session-owned nor view
 * commands, so they are never sent to the model as plain prompt text.
 */
export declare function getReplyComposerCommandRejection(text: string): string | undefined;
/** Autocomplete for the reply composer: session-owned plus view commands. */
export declare function createReplyComposerAutocompleteProvider(cwd: string, fdPath?: string): AutocompleteProvider;
export declare function resolveCurrentReplyTargetSummary(records: readonly UnifiedSessionRecord[], target: {
    key: string;
    summary: SessionSummary;
}, findLive: (activeSessionId: string) => SessionSummary | undefined): SessionSummary;
export declare class AgentsViewMode implements Component, Focusable {
    private readonly options;
    private readonly persistentState;
    focused: boolean;
    private readonly ui;
    private readonly editor;
    private readonly splash;
    private readonly fullscreenDock;
    private readonly keybindings;
    private client;
    private unsubscribeClientClose;
    private unsubscribeClientMessage;
    private reconnectPromise;
    private reconnectTimedOut;
    private daemonShutdownReceived;
    private resolveRun;
    private pollTimer;
    private heartbeatPollTimer;
    private animationTimer;
    private ctrlCExitHintExpiresAt;
    private ctrlCExitHintTimer;
    private deleteConfirmExpiresAt;
    private deleteConfirmTimer;
    private workingIconFrame;
    private rows;
    private lastListedSummaries;
    private lastVisibleSummaries;
    private savedSessions;
    private lastSuccessfulSavedSessions;
    private heartbeats;
    private unifiedRecords;
    private unifiedIndex;
    private scopedRecords;
    private scopeKey;
    private scopeRootSummary;
    private liveCatalogReady;
    private savedCatalogReady;
    private savedCatalogGeneration;
    private liveCatalogGeneration;
    private heartbeatCatalogGeneration;
    private liveCatalogPollPromise;
    private liveCatalogRefreshPending;
    private savedCatalogRefreshPending;
    private expandedSubagentParents;
    private programShownParents;
    private selectedIndex;
    private selectedRowIdentity;
    private selectedActiveSessionId;
    private selectedSessionKey;
    private selectionAnchorPending;
    /** Armed reply composer target: a live agent or a saved session to resume on send. */
    private replyTarget;
    /** Provider bound to the armed target's cwd for file-path completions. */
    private replyAutocomplete;
    private fdPath;
    private creatingNewSession;
    private replyLastAssistantText;
    private replyLastAssistantTextLoading;
    private replyHeaderTime;
    private pendingDeleteAgent;
    private pendingKillSubagent;
    private renameTarget;
    private actionModeSearchQuery;
    private readonly inactiveAgentIdentities;
    private statusMessage;
    private statusMessageTone;
    private statusMessageSticky;
    private statusMessageTimer;
    private stopped;
    constructor(options: AgentsViewModeOptions, persistentState?: AgentsViewPersistentState);
    run(): Promise<AgentsViewRunResult>;
    handleInput(data: string): void;
    private isSearchCursorAtEnd;
    render(width: number): string[];
    invalidate(): void;
    private renderContent;
    private loadStartupNotices;
    private renderStartupNotices;
    private handleListNavigation;
    private handleCtrlC;
    private showCtrlCExitHint;
    private clearCtrlCExitHint;
    private isCtrlCExitHintVisible;
    private showDeleteConfirmation;
    private clearDeleteConfirmation;
    private isDeleteConfirmationVisible;
    private setStatusMessage;
    /** Sticky messages (e.g. billing warnings) stay until the user acknowledges them with any keypress. */
    private clearStickyStatusMessage;
    private moveSelection;
    private applyPendingAncestorExpansion;
    private setSearchQuery;
    private queryChanged;
    private getFilteredRecords;
    /** Rebuild rows from the last fetched summaries, keeping selection on the same row. */
    private rebuildRows;
    private submit;
    /** Alt+Enter in the reply composer queues the reply as a follow-up. */
    private handleReplyFollowUp;
    private getSavedSessionCwd;
    private getSavedSessionCatalogContext;
    private openSelected;
    private toggleSubagentList;
    /**
     * Toggle the full spawn program for the agent owning the selected row:
     * one press shows it, another hides it. The subagent list is expanded as
     * needed so the code sits directly above the subagents it launched.
     */
    private cycleProgramForSelected;
    /** Whether any subagent under the given agent identity carries spawn code. */
    private targetHasSpawnCode;
    /** True when the selected row exposes the "show program" affordance. */
    private selectedRowCanShowProgram;
    private openSelectedSubagent;
    /** Session ids of every ancestor of a subagent row, root-most first. */
    private collectSubagentAncestorSessionIds;
    /**
     * The whole subagent tree belongs to the root agent's session, so nested
     * subagents also resolve to their top-level ancestor.
     */
    private findSubagentRootRow;
    private toggleReplyTarget;
    private setReplyTarget;
    private enterRenameMode;
    private exitRenameMode;
    private confirmRename;
    private renameSession;
    private findSummaryByActiveSessionId;
    private renderReplyHeaderLine;
    private getLastAssistantText;
    private sendReply;
    private createNewSession;
    private runAgentsViewCommand;
    private connectDedicatedClient;
    /** Point selection (and its persisted key) at a freshly resumed session row. */
    private selectSummary;
    private handleDeleteSelected;
    private handleKillSubagentSelected;
    private killSubagent;
    private stopAgentForDeletion;
    private deactivatePendingAgent;
    private sendPrompt;
    private pollSessions;
    private refreshSessions;
    private applySessionList;
    private reconcileCatalogs;
    private refreshBothCatalogs;
    private refreshSavedSessions;
    private refreshHeartbeats;
    private withPendingDeleteSession;
    private resolveMissingSelectionAnchor;
    private restoreSelection;
    private getSelectableRowIndexes;
    private syncSelectedRowState;
    private finish;
    private subscribeToClientClose;
    private handleDaemonShutdown;
    private startClientReconnect;
    private reconnectClient;
    private requireSocketPath;
    private requireClient;
    private getAgentCountsText;
    private renderSessionRows;
    private renderRow;
    private renderCodeRow;
    private finalizeRenderedLine;
    private isPendingDeleteRow;
    private isPendingKillSubagentRow;
    private getPendingDeleteTitle;
    private renderPrompt;
    private renderDock;
    private renderHints;
    private renderReplyComposerHints;
    private visibleListRows;
    private contentHeight;
    private getSplashModelId;
    private getSplashCwd;
    private getRowIcon;
    private formatRowIcon;
}
export declare function formatAgentsViewRelativeTime(value: string | undefined, now?: number): string;
export {};
//# sourceMappingURL=agents-view-mode.d.ts.map
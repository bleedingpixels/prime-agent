/**
 * Background daemon mode.
 *
 * The daemon owns live AgentSessionRuntime instances and exposes a small JSONL
 * protocol over a local socket. Clients can attach/detach from sessions without
 * disposing the underlying agent loop.
 */
import { type AgentSessionRuntimeConfig } from "../../core/agent-session-config.js";
import { type CreateAgentSessionRuntimeFactory } from "../../core/agent-session-runtime.js";
import { type ActiveSessionState, type DaemonSocketClient } from "./active-session-state.js";
import { type DaemonClientCapability, type DaemonOutbound } from "./daemon-protocol.js";
export interface DaemonModeOptions {
    socketPath?: string;
    defaultSessionConfig: AgentSessionRuntimeConfig;
    createRuntime: CreateAgentSessionRuntimeFactory;
    worker?: {
        authenticationToken: string;
        restoreActiveSessionId?: string;
    };
}
export type { DaemonCommand, DaemonOutbound, DaemonResponse, } from "./daemon-protocol.js";
export type { SessionActivity, SessionLifecycle, SessionSummary, } from "./daemon-session-list.js";
export { defaultDaemonSocketPath } from "./daemon-socket.js";
export declare function runDaemonMode(options: DaemonModeOptions): Promise<never>;
export declare function isTerminalRemoteAgentMessageError(error: unknown): error is Error;
export declare class AgentDaemon {
    private readonly socketPath;
    private readonly options;
    private server?;
    private shuttingDown;
    private readonly updateRestartQueuePauses;
    private readonly mutationDrain;
    private updateRestart?;
    private ownsSocketPath;
    private socketIdentity?;
    private readonly clients;
    private readonly sessions;
    private readonly openingSessions;
    /** Covers path resolution through publication in openingSessions, before the runtime promise exists. */
    private readonly reservingSessionOpens;
    private readonly bindingCompletions;
    /**
     * Resolved-session-file keyed passivations let wake paths join after closeSessionOnce
     * removes the live session. This intentionally complements closingSessions: that map
     * coalesces every close by transient activeSessionId, while this one identifies the
     * passivation-only close reason by the durable identity needed by hydration/opening.
     */
    private readonly passivatingSessions;
    private readonly closingSessions;
    private readonly sideQuestionRuns;
    /** Live prompt admissions, keyed by session and caller-generated admission id. */
    private readonly promptAdmissions;
    private readonly signalCleanupHandlers;
    private readonly cronStore;
    private readonly agentDir;
    private readonly cronScheduler;
    private readonly agentMessageRateLimiter;
    private readonly remoteAgentPeers;
    private readonly agentMessagePendingReservations;
    private readonly agentMessageTargetLocks;
    private readonly agentMessageAcceptingTargets;
    private readonly agentMessagePreparingTargets;
    private readonly bindingSessions;
    private readonly pendingSessionNames;
    private restoreActiveSessionId;
    private supervisorMonitorTimer?;
    private supervisorFenceTimer?;
    private supervisorLaunchInProgress;
    private readonly supervisorClaims;
    private agentMessagesPaused;
    private readonly summarizer;
    private readonly recoveryJournal?;
    constructor(socketPath: string, options: DaemonModeOptions);
    private log;
    private installCrashHandlers;
    start(): Promise<void>;
    private startSupervisorMonitor;
    private scheduleSupervisorAvailabilityCheck;
    private checkSupervisorAvailability;
    private hasAuthenticatedSupervisorConnection;
    private revokeSupervisorClaim;
    private clearSupervisorAvailabilityCheck;
    private scheduleSupervisorFenceCheck;
    private checkSupervisorFences;
    private assertSupervisorClaimCurrent;
    private canConnectToSupervisor;
    private launchReplacementSupervisor;
    private isProcessAlive;
    private cleanupSocketPath;
    /**
     * Adopt env for a session that has none, propagating to subagents spawned
     * before adoption (their exec-env providers read state.clientEnv live).
     * Never overwrites an existing identity.
     */
    private adoptClientEnv;
    private rlmSubagentRegistryPath;
    private appendRlmSubagentRegistryEntry;
    private recordRlmSubagentRegistryEntry;
    private recordRlmSubagentDeletion;
    private readLatestRlmSubagentRegistry;
    private readLatestRlmSubagentRegistryPath;
    private rlmSubagentRegistryPathForEntry;
    private rlmSubagentRegistryPathForInfo;
    private listPassiveRlmSubagents;
    private passiveRlmSubagentsByPath;
    private buildRlmChildSnapshotsWithPassiveRlmSubagents;
    private buildSessionListWithPassiveRlmSubagents;
    private findPassiveRlmSubagent;
    private addRuntime;
    private refreshReplacedSessionState;
    private registerCronStoreForState;
    private createRuntime;
    private runCronJob;
    private getRunnableCronJob;
    private promptWithAgentMessagePreparingGuard;
    private promptHeartbeatWithAgentMessagePreparingGuard;
    private withAgentMessagePreparingGuard;
    private createCronJobForState;
    private createHeartbeatForState;
    private updateHeartbeatForState;
    private createRlmHeartbeatForState;
    private updateRlmHeartbeatForState;
    private deleteRlmHeartbeatForState;
    private listHeartbeats;
    private manageHeartbeat;
    private rebindCronJobsToState;
    private cancelSubagentRlmHeartbeats;
    private cancelScheduledJobsForSession;
    private cancelScheduledJobsForSessionFile;
    private deleteSavedSessionFile;
    private removeQueuedHeartbeatFollowUp;
    private getOrCreateCronJobSession;
    private restoreRlmHeartbeatSession;
    private cancelRlmHeartbeat;
    private isPersistedCronJobRunnable;
    private isCronJobRunnableForState;
    private findSessionBySessionFile;
    private getSessionState;
    private getBoundSessionState;
    private getOrHydrateBoundSessionState;
    private waitForHydratingChild;
    private createSubagentRuntimeHost;
    private createRlmSubagentRuntime;
    private sessionPassivationSnapshot;
    private passivateSession;
    private passivateIdleChildren;
    private findPassivationBySessionFile;
    private waitForPassivation;
    private hydratePassiveRlmSubagent;
    private rehydrateCompletedRlmSubagent;
    private waitForBoundSession;
    private rehydrateCompletedRlmSubagentOnce;
    private createAgentMessageController;
    private createAgentObserveController;
    private createAgentObserveListResult;
    private createAgentObserveAgentSnapshot;
    private createAgentObserveRecentMessages;
    private createAgentObserveSummary;
    private handleConnection;
    private promptAdmissionKey;
    /**
     * Parse and synchronously register prompt admission before returning a promise.
     * This method is intentionally non-async: handleLine invokes it before its first await.
     */
    private parseCommandAndRegisterPromptAdmission;
    private handleLine;
    private writeWorkerSuccess;
    private handleWorkerCommand;
    private handleCommand;
    private createAttachResult;
    private createSessionSnapshot;
    private streamWorkerSnapshot;
    private writeWorkerSnapshotRecord;
    private writeWorkerSnapshotBuffer;
    private createConnectionState;
    private createAgentSessionMessageEndpoint;
    private createAgentSessionMessageSender;
    private createAgentMessageAgentSummary;
    private createAgentMessageListResult;
    private createAgentFamilyCatalog;
    private createAgentFamilyRoster;
    private assertFamilySessionNameAvailable;
    private resolveHeaderParentSessionPath;
    private assertStateSessionNameAvailable;
    private withSessionNameReservation;
    private setStateSessionNameViaSupervisor;
    private setStateSessionName;
    private listTargetableSessionStates;
    private getAgentMessageSafetyStatus;
    private createCliAgentMessageSenderKey;
    private clearQueuedAgentSessionMessagesForState;
    private clearQueuedAgentSessionMessagesForAllStates;
    private reserveAgentMessageQueueSlot;
    private withAgentMessageTargetLock;
    private agentFamilyEntry;
    private passiveAgentFamilyEntry;
    private getOrHydrateAuthorizedAgentFamilyTarget;
    private resolveAgentFamilySessionName;
    private isAgentFamilyReachable;
    private assertAgentFamilyReachable;
    private agentMessageRelationship;
    private sendAgentSessionMessage;
    private sendRemoteAgentSessionMessage;
    private acceptAgentSessionMessage;
    private detachClientFromSession;
    private isDiscardableDraft;
    /**
     * True when a session holds nothing worth persisting: no messages, no user
     * config (model/name/etc.), and no scheduled jobs. Shared by the detach-time
     * discard and the close-time file deletion so both agree on what an abandoned
     * draft is.
     */
    private isEmptyDraftContent;
    private createUpdateRestartSession;
    private appendUpdateRestartMarker;
    private writeUpdateRestartManifest;
    private getUpdateRestartSessionDepth;
    private assertUpdateRestartNotCancelled;
    private beginUpdateRestartTransaction;
    private runUpdateRestartPreparation;
    private prepareUpdateRestartCheckpoint;
    private commitPreparedUpdateRestart;
    private cancelPreparedUpdateRestart;
    private prepareUpdateRestart;
    private hasScheduledJobsForSession;
    private detachClient;
    private findActiveSessionByFile;
    private abortWaitingPromptAdmissionsForSession;
    private closeSession;
    private closeReasonStrength;
    private isStrongerCloseReason;
    private applyReasonUpgrade;
    private closeKeepsResumeEntry;
    private archiveSession;
    private abortBashForClose;
    private closeSessionOnce;
    private closeChildSessions;
    private broadcastToSession;
    private beginReplacementSnapshot;
    private prepareReplacementSnapshot;
    private broadcastGlobal;
    private recordWorkerRecoveryState;
    private catchUpBackpressuredClient;
    private clearClientCatchupRetry;
    private scheduleClientCatchupRetry;
    private drainBackpressuredClientCatchupQueue;
    private drainBackpressuredClientCatchups;
    private queueClientCatchup;
    private stampRlmChildActiveSessionId;
    private addSessionEventMeta;
    private write;
    private writeSerialized;
    private abortSideQuestionsFor;
    private hasActiveSideQuestionFor;
    private registerSignalHandlers;
    private getShutdownClosingReason;
    private shutdown;
}
export declare function getChildActiveSessionStates(sessions: ReadonlyMap<string, ActiveSessionState>, parentState: ActiveSessionState): ActiveSessionState[];
export declare function detachClientFromActiveSession(client: DaemonSocketClient, state: ActiveSessionState): void;
export declare function setDaemonClientSessionCapabilities(client: DaemonSocketClient, activeSessionId: string, capabilities: ReadonlySet<DaemonClientCapability>): void;
export declare function markClientSnapshotStreaming(client: DaemonSocketClient, activeSessionId: string): AbortSignal;
export declare function finishClientSnapshotStreaming(client: DaemonSocketClient, activeSessionId: string): void;
export declare function cancelPendingExtensionUiRequests(state: ActiveSessionState): void;
export declare function shouldSendDaemonOutboundToClient(client: DaemonSocketClient, message: DaemonOutbound): boolean;
export declare function resolveDaemonSessionPath(selector: string, cwd: string, sessionDir?: string): Promise<string>;
//# sourceMappingURL=daemon-mode.d.ts.map
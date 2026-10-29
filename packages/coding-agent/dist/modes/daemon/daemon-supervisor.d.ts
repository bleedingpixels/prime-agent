import { type AgentSessionRuntimeConfig } from "../../core/agent-session-config.js";
import { type IdleEvictionMinutes } from "../../core/session-action-store.js";
interface DaemonSupervisorOptions {
    socketPath?: string;
    defaultSessionConfig: AgentSessionRuntimeConfig;
    descriptorDir?: string;
}
export declare function idleEvictionSweepIntervalMs(idleEvictionMinutes: IdleEvictionMinutes): number;
export declare function runDaemonSupervisorMode(options: DaemonSupervisorOptions): Promise<never>;
export declare class DaemonSupervisor {
    private readonly socketPath;
    private server?;
    private readonly ready;
    private markReady;
    private rejectReady;
    private ownsSocketPath;
    private socketIdentity?;
    private socketLease?;
    private ownership?;
    private cleanupPromise?;
    private shuttingDown;
    private updateRestartPhase?;
    private readonly mutationDrain;
    private readonly clients;
    private readonly protocolClientIds;
    private readonly workers;
    private workerStopCounts?;
    private readonly openingWorkers;
    /** Public admission ids are scoped to the socket that registered them. */
    private readonly promptAdmissions;
    private readonly signalCleanupHandlers;
    private readonly descriptorDir;
    private readonly generation;
    private readonly supervisorConfigPath;
    private readonly defaultSessionConfig;
    private readonly snapshotCacheRoot;
    private commandJournal;
    private readonly streamReconstructor;
    private readonly compactCatchupInProgress;
    private agentPeerSyncQueue;
    private readonly pendingSessionNames;
    private readonly catalog;
    private readonly settingsManager;
    private idleEvictionTimer?;
    private idleEvictionSweep?;
    private idleEvictionFence?;
    constructor(socketPath: string, options: DaemonSupervisorOptions);
    start(): Promise<void>;
    private listen;
    private log;
    private clearIdleEvictionTimer;
    private scheduleIdleEvictionSweep;
    private workerEvictionSnapshot;
    private runIdleEvictionSweep;
    private assertCurrentOwnership;
    private assertRecoveryAllowed;
    private supervisorAuthenticationClaim;
    private loadWorkerDescriptors;
    private loadPersistedSupervisorConfig;
    private persistSupervisorConfig;
    private hasPersistedWorkerDescriptors;
    private persistWorker;
    private deleteWorkerDescriptor;
    private handleConnection;
    private cancelOwnedWorkerCleanup;
    private protocolClientId;
    private scheduleOwnedWorkerCleanupForClient;
    private scheduleOwnedWorkerCleanup;
    private promptAdmissionKey;
    private promptAdmissionsFor;
    private getPromptAdmission;
    private deletePromptAdmission;
    private cancelWaitingPromptAdmissionsForClient;
    /** Non-async by design: prompt registration completes before handleLine's first await. */
    private parseCommandAndRegisterPromptAdmission;
    private handleLine;
    private handleCommand;
    private handleList;
    private handleSavedSessionList;
    private createOrReuseWorker;
    private reuseWorkerForCreate;
    private reclaimStaleWorkerRegistration;
    private promoteOwnedWorker;
    private launchWorker;
    private connectWorker;
    private subscribeWorker;
    private adoptOrRecoverWorker;
    private handleWorkerClose;
    private isWorkerRecoveryEligible;
    private isWorkerRecoveryCandidate;
    private deferWorkerRecovery;
    private resumeDeferredWorkerRecovery;
    private failWorkerSnapshotCache;
    private retireWorkerSnapshotCache;
    private snapshotGenerationsFor;
    private snapshotGeneration;
    private currentSnapshotGeneration;
    private deleteSnapshotGeneration;
    private failSnapshotGeneration;
    private createSnapshotDuplicateValidation;
    private settleSnapshotDuplicateValidation;
    private recoverWorker;
    private isWorkerRecoveryCancelled;
    private recoverUncertainWorkerOperations;
    private refreshWorkerSummaries;
    private familyCatalogEntries;
    private withSessionNameReservation;
    private assertSupervisorSessionNameAvailable;
    private savedSessionNameReservationInput;
    private summaryNameReservationInput;
    private assertSupervisorSavedSessionNameAvailable;
    private assertSavedSiblingNameAvailable;
    private syncAgentPeers;
    private isVisibleWorker;
    /** A worker with a durable or in-memory stop intent is stopping, never live. */
    private isWorkerStopping;
    /** Live workers are visible to all clients and not stopping. */
    private isLiveWorker;
    /**
     * The lifecycle reported to clients. A stop intent always wins, and a worker
     * whose process connection is gone is never reported as "ready".
     */
    private effectiveWorkerState;
    private requireAvailableWorkerClient;
    private familyCatalogEntry;
    private agentPeerSummary;
    private publicSummary;
    private findWorker;
    private findWorkerForClient;
    private isWorkerAccessibleToClient;
    private assertWorkerAccessibleToClient;
    private matchWorkers;
    private findSummaryInWorker;
    private findWorkerBySessionFile;
    private forwardToWorker;
    private attachClient;
    private assertTelemetryAttachAllowed;
    private cacheLoadedSnapshot;
    private getOrCreateTranscriptCache;
    private createStreamedAttachResult;
    private streamSnapshot;
    private reserveSnapshotStream;
    private writeSnapshotRecord;
    private writeSnapshotBuffer;
    private detachClient;
    private syncWorkerExtensionUi;
    private handleWorkerFrame;
    private invalidateWorkerSnapshot;
    private scheduleCompactCatchup;
    private queueCatchup;
    private catchUpClient;
    private drainClientCatchupQueue;
    private drainClientCatchups;
    private prepareUpdateRestart;
    private prepareUpdateRestartFenced;
    private validateAndPersistUpdateManifest;
    /**
     * Verdict on whether a pid is still the process we launched. Callers must
     * be conservative in both directions: signal a pid only on "current"
     * (never SIGKILL a recycled pid), and clean up a registration only on
     * "gone"/"replaced" (never orphan a live worker because a transient
     * identity lookup failed).
     */
    private processIdentity;
    private stopWorker;
    private stopWorkerUntracked;
    /**
     * A stop that timed out leaves a tombstoned registration behind. Keep
     * escalating in the background until the process is gone, then finish the
     * interrupted cleanup instead of leaving a dead worker registered forever.
     */
    private scheduleWorkerStopFinalization;
    private finalizeTimedOutWorkerStop;
    private finalizeArchivedWorkerStop;
    private reclaimStoppedWorkerCronLock;
    private workerSessionArtifactContext;
    private persistWorkerStopTombstone;
    private write;
    private broadcastHeartbeatsChanged;
    private writeSerialized;
    private registerSignalHandlers;
    private cleanupSocket;
    private cleanupSupervisorResources;
    private cleanupSupervisorResourcesOnce;
    private runCleanupStep;
    private reportCleanupFailure;
    private shutdown;
}
export {};
//# sourceMappingURL=daemon-supervisor.d.ts.map
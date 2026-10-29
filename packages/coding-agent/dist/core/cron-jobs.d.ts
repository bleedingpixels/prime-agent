export type AgentCronJobStatus = "active" | "paused" | "completed" | "cancelled";
export type AgentCronScheduleKind = "once" | "cron" | "interval";
export type AgentCronJobSource = "cron" | "heartbeat" | "rlm_heartbeat";
export type AgentCronJobRuntimeKind = "top-level" | "subagent";
export type AgentHeartbeatUpdateAction = "pause" | "resume" | "clear";
export type AgentHeartbeatManagementAction = "pause" | "resume" | "stop";
export type AgentRlmHeartbeatStatusUpdate = "pause" | "resume";
/**
 * How a scheduled heartbeat prompt is delivered when the target session is busy:
 * "steer" interrupts the current turn, "follow_up" waits for it to finish.
 */
export type AgentHeartbeatDeliveryMode = "steer" | "follow_up";
export interface AgentCronSchedule {
    kind: AgentCronScheduleKind;
    expression: string;
    intervalMs?: number;
}
export interface AgentCronJob {
    id: string;
    status: AgentCronJobStatus;
    source?: AgentCronJobSource;
    runtimeKind?: AgentCronJobRuntimeKind;
    /** Delivery mode for heartbeat/rlm_heartbeat jobs when the session is busy. Defaults to "steer". */
    deliveryMode?: AgentHeartbeatDeliveryMode;
    activeSessionId: string;
    sessionId: string;
    sessionFile: string;
    cwd: string;
    label?: string;
    prompt: string;
    schedule: AgentCronSchedule;
    createdAt: string;
    updatedAt: string;
    nextRunAt?: string;
    lastRunAt?: string;
    lastSkippedAt?: string;
    lastError?: string;
    runCount: number;
}
export interface CreateAgentCronJobInput {
    activeSessionId: string;
    sessionId: string;
    sessionFile: string;
    cwd: string;
    label?: string;
    prompt: string;
    scheduleText: string;
    source?: AgentCronJobSource;
    runtimeKind?: AgentCronJobRuntimeKind;
    deliveryMode?: AgentHeartbeatDeliveryMode;
    now?: Date;
}
export type AgentCronJobRunResult = "ran" | "skipped";
export interface AgentCronDispatch {
    id: string;
    job: AgentCronJob;
}
export interface AgentCronSchedulerHooks {
    runJob: (job: AgentCronJob) => Promise<AgentCronJobRunResult | undefined>;
    beginDispatch?: (dispatch: AgentCronDispatch) => (() => void) | undefined;
    now?: () => Date;
    onError?: (job: AgentCronJob, error: unknown) => void;
}
export interface HeartbeatCronSessionActivity {
    isStreaming: boolean;
    isCompacting?: boolean;
    isRetrying?: boolean;
    isBashRunning: boolean;
    hasPendingSessionWork: boolean;
    unfinishedActionCount: number;
}
export declare const SESSION_SCHEDULED_JOBS_FILENAME = "scheduled-jobs.json";
export declare const DEFAULT_HEARTBEAT_SCHEDULE = "every 5m";
export declare const DEFAULT_HEARTBEAT_DELIVERY_MODE: AgentHeartbeatDeliveryMode;
export type ParsedHeartbeatCommand = {
    type: "status";
} | {
    type: "pause";
} | {
    type: "resume";
} | {
    type: "clear";
} | {
    type: "set";
    schedule: string;
    instruction: string;
    deliveryMode?: AgentHeartbeatDeliveryMode;
};
export interface AgentRlmHeartbeatController {
    listRlmHeartbeats(options?: {
        includeInactive?: boolean;
    }): AgentCronJob[];
    createRlmHeartbeat(input: {
        instruction: string;
        interval?: string;
        label?: string;
        deliveryMode?: AgentHeartbeatDeliveryMode;
    }): AgentCronJob;
    updateRlmHeartbeat(input: {
        id: string;
        instruction?: string;
        interval?: string;
        label?: string;
        status?: AgentRlmHeartbeatStatusUpdate;
        deliveryMode?: AgentHeartbeatDeliveryMode;
    }): AgentCronJob | undefined;
    deleteRlmHeartbeat(id: string): AgentCronJob | undefined;
}
export declare class AgentCronJobStore {
    private readonly filePath?;
    private readonly sessionArtifactMode;
    private readonly sessionArtifactFiles;
    private readonly heartbeatChangeListeners;
    constructor(filePath?: string | undefined, sessionArtifactMode?: boolean);
    static forSessionArtifacts(): AgentCronJobStore;
    onHeartbeatChange(listener: () => void): () => void;
    registerSessionArtifact(sessionId: string, artifactDir: string): boolean;
    recoverSessionArtifact(sessionId: string, now?: Date): AgentCronJob[];
    list(): AgentCronJob[];
    create(input: CreateAgentCronJobInput): AgentCronJob;
    /**
     * Active session ids are daemon-local. When a persisted session is restored,
     * bind jobs stored for its stable session file to the new live session id.
     * When a live session switches to another persisted file, move jobs stored for
     * its stable active session id to the new file so future restores target the
     * current session instead of the previous one.
     */
    rebindSessionJobs(input: {
        activeSessionId: string;
        sessionId: string;
        sessionFile: string;
        cwd: string;
    }): AgentCronJob[];
    getHeartbeat(activeSessionId: string): AgentCronJob | undefined;
    getLatestHeartbeat(activeSessionId: string): AgentCronJob | undefined;
    createHeartbeat(input: CreateAgentCronJobInput): AgentCronJob;
    listRlmHeartbeats(activeSessionId: string, options?: {
        includeInactive?: boolean;
    }): AgentCronJob[];
    createRlmHeartbeat(input: CreateAgentCronJobInput): AgentCronJob;
    updateRlmHeartbeat(activeSessionId: string, id: string, update: {
        label?: string;
        prompt?: string;
        scheduleText?: string;
        status?: AgentRlmHeartbeatStatusUpdate;
        deliveryMode?: AgentHeartbeatDeliveryMode;
        now?: Date;
    }): AgentCronJob | undefined;
    deleteRlmHeartbeat(activeSessionId: string, id: string, now?: Date): AgentCronJob | undefined;
    cancelRlmHeartbeatsForSession(activeSessionId: string, now?: Date): AgentCronJob[];
    cancelJobsForSession(input: {
        activeSessionId?: string;
        sessionId?: string;
        sessionFile?: string;
    }, now?: Date): AgentCronJob[];
    pauseHeartbeat(activeSessionId: string, now?: Date): AgentCronJob | undefined;
    resumeHeartbeat(activeSessionId: string, now?: Date): AgentCronJob | undefined;
    clearHeartbeat(activeSessionId: string, now?: Date): AgentCronJob | undefined;
    manageHeartbeat(activeSessionId: string, id: string, action: AgentHeartbeatManagementAction, now?: Date): AgentCronJob | undefined;
    cancel(id: string, now?: Date): AgentCronJob | undefined;
    recordRunResult(id: string, result: {
        now?: Date;
        error?: unknown;
    }): AgentCronJob | undefined;
    recordSkipResult(id: string, result: {
        now?: Date;
    }): AgentCronJob | undefined;
    due(now?: Date): AgentCronJob[];
    claimDue(dueAt?: Date, claimedAt?: Date): AgentCronDispatch[];
    getClaimedJob(id: string): AgentCronJob | undefined;
    recordDispatchResult(dispatchId: string, result: {
        now?: Date;
        outcome: AgentCronJobRunResult;
        error?: unknown;
    }): AgentCronJob | undefined;
    recoverInterruptedDispatches(now?: Date): AgentCronJob[];
    recoverInterruptedDispatchesById(dispatchIds: readonly string[], now?: Date): AgentCronJob[];
    getDueJob(id: string, now?: Date): AgentCronJob | undefined;
    nextActiveRunAt(): Date | undefined;
    private readJobs;
    private readStates;
    private mutateStates;
    private writeJobs;
    private notifyHeartbeatChange;
    private requireFilePath;
}
export declare function migrateLegacyCronJobsToSessionArtifacts(filePath: string, options?: {
    isSessionOwned?: (job: AgentCronJob) => boolean;
    now?: Date;
}): number;
export declare class AgentCronScheduler {
    private readonly store;
    private readonly hooks;
    private timer;
    private running;
    private stopped;
    private hasStarted;
    private readonly dispatchLanes;
    constructor(store: AgentCronJobStore, hooks: AgentCronSchedulerHooks);
    start(): void;
    stop(): void;
    wake(): void;
    runDue(now?: Date): Promise<number>;
    private queueDispatch;
    private scheduleNext;
    private now;
}
export declare function parseAgentCronSchedule(input: string, now?: Date): {
    schedule: AgentCronSchedule;
    nextRunAt: Date;
};
export declare function normalizeHeartbeatSchedule(input: string | undefined): string;
export declare function normalizeHeartbeatDeliveryMode(value: unknown): AgentHeartbeatDeliveryMode | undefined;
export declare function resolveHeartbeatStreamingBehavior(deliveryMode: AgentHeartbeatDeliveryMode | undefined): "steer" | "followUp";
export declare function parseHeartbeatCommand(input: string): ParsedHeartbeatCommand;
export declare function nextRunAtForSchedule(schedule: AgentCronSchedule, after: Date): Date | undefined;
export declare function formatAgentCronJob(job: AgentCronJob): string;
export declare function isHeartbeatCronJob(job: AgentCronJob): boolean;
export declare function shouldDeferHeartbeatCronJob(job: AgentCronJob, activity: HeartbeatCronSessionActivity): boolean;
//# sourceMappingURL=cron-jobs.d.ts.map
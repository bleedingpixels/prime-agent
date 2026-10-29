export interface WorkerRecoveryRecord {
    version: 1;
    activeSessionId: string;
    sessionId: string;
    sessionFile?: string;
    busy: boolean;
    operation: string;
    recordedAt: string;
}
export declare class WorkerRecoveryJournal {
    private readonly path;
    private readonly latest;
    constructor(path: string);
    record(input: Omit<WorkerRecoveryRecord, "version" | "recordedAt">): void;
    getLatest(): WorkerRecoveryRecord[];
    static readLatest(path: string): WorkerRecoveryRecord[];
    private append;
    private compact;
}
//# sourceMappingURL=worker-recovery-journal.d.ts.map
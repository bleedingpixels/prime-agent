export declare const ORPHAN_PROCESS_JOURNAL_ENV = "PRIME_AGENT_INTERNAL_ORPHAN_PROCESS_JOURNAL";
export interface ActiveOrphanProcess {
    pid: number;
    processStartId: string;
}
export declare function recordOrphanProcessState(pid: number, active: boolean): void;
export declare function readActiveOrphanProcesses(path: string, ownerPid: number): ActiveOrphanProcess[];
export declare function isOrphanProcessIdentityCurrent(orphan: ActiveOrphanProcess): boolean;
export declare function clearOrphanProcessJournal(path: string): void;
//# sourceMappingURL=orphan-process-journal.d.ts.map
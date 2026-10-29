import type { DaemonClientId, DaemonCommandId, DaemonResponse } from "./daemon-protocol.js";
export type CommandJournalBeginResult = {
    status: "new";
} | {
    status: "pending";
} | {
    status: "complete";
    response: DaemonResponse;
};
export declare function createCommandIdempotencyKey(clientId: DaemonClientId, commandId: DaemonCommandId): string;
/**
 * Append-only command journal used at the supervisor boundary. A received
 * record is durable before a mutating command is dispatched; a missing result
 * after a crash is therefore treated as uncertain and is never replayed.
 */
export declare class CommandRecoveryJournal {
    private readonly path;
    private readonly entries;
    private recordCount;
    constructor(path: string);
    lookup(clientId: DaemonClientId, commandId: DaemonCommandId): Exclude<CommandJournalBeginResult, {
        status: "new";
    }> | undefined;
    begin(clientId: DaemonClientId, commandId: DaemonCommandId, commandType: string): CommandJournalBeginResult;
    recordResult(clientId: DaemonClientId, commandId: DaemonCommandId, response: DaemonResponse): void;
    acknowledge(clientId: DaemonClientId, commandId: DaemonCommandId): void;
    private load;
    private append;
    private compact;
}
//# sourceMappingURL=command-recovery-journal.d.ts.map
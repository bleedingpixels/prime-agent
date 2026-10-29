/** Merge late-bound fields (e.g. mode, sessionId) into every subsequent log entry. */
export declare function setLogContext(fields: Record<string, unknown>): void;
/**
 * Route all structured logging (coding-agent and pi-ai) to the shared JSONL
 * log at ~/.prime/agent/logs/agent.jsonl. One master file, filterable by the
 * pid/context fields; writes are best-effort and size-bounded.
 */
export declare function installFileLogSink(fields?: Record<string, unknown>): void;
//# sourceMappingURL=logging.d.ts.map
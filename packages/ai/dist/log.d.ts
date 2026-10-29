/**
 * Minimal structured logger shared by pi-ai and its consumers. The library
 * never writes files: entries go to an injectable sink (setLogSink). Without
 * a sink, warn/error fall back to console.error and debug/info are dropped.
 * Logging must never throw into the caller.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogEntry {
    ts: string;
    level: LogLevel;
    component: string;
    msg: string;
    [field: string]: unknown;
}
export type LogSink = (entry: LogEntry) => void;
export interface Logger {
    debug(msg: string, fields?: Record<string, unknown>): void;
    info(msg: string, fields?: Record<string, unknown>): void;
    warn(msg: string, fields?: Record<string, unknown>): void;
    error(msg: string, fields?: Record<string, unknown>): void;
}
/** Install the process-wide log sink. Pass undefined to restore the default. */
export declare function setLogSink(next: LogSink | undefined): void;
/** JSON.stringify that never throws: circular refs and BigInts degrade instead of dropping the entry. */
export declare function stringifyLogEntry(entry: LogEntry): string;
export declare function getLogger(component: string): Logger;
//# sourceMappingURL=log.d.ts.map
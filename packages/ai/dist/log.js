/**
 * Minimal structured logger shared by pi-ai and its consumers. The library
 * never writes files: entries go to an injectable sink (setLogSink). Without
 * a sink, warn/error fall back to console.error and debug/info are dropped.
 * Logging must never throw into the caller.
 */
let sink;
/** Install the process-wide log sink. Pass undefined to restore the default. */
export function setLogSink(next) {
    sink = next;
}
function jsonReplacer() {
    const seen = new WeakSet();
    return (_key, value) => {
        if (typeof value === "bigint")
            return value.toString();
        if (typeof value === "object" && value !== null) {
            if (seen.has(value))
                return "[Circular]";
            seen.add(value);
        }
        return value;
    };
}
/** JSON.stringify that never throws: circular refs and BigInts degrade instead of dropping the entry. */
export function stringifyLogEntry(entry) {
    try {
        return JSON.stringify(entry, jsonReplacer());
    }
    catch {
        return JSON.stringify({
            ts: entry.ts,
            level: entry.level,
            component: entry.component,
            msg: String(entry.msg),
            fieldsError: "unserializable fields dropped",
        });
    }
}
function emit(level, component, msg, fields) {
    try {
        // Reserved keys win over caller fields so entries can't be misclassified.
        const entry = { ...fields, ts: new Date().toISOString(), level, component, msg };
        try {
            if (sink) {
                sink(entry);
                return;
            }
        }
        catch {
            // Broken sink: fall through to the console fallback.
        }
        if (level === "warn" || level === "error") {
            console.error(stringifyLogEntry(entry));
        }
    }
    catch {
        // Diagnostics must never break the operation being logged.
    }
}
export function getLogger(component) {
    return {
        debug: (msg, fields) => emit("debug", component, msg, fields),
        info: (msg, fields) => emit("info", component, msg, fields),
        warn: (msg, fields) => emit("warn", component, msg, fields),
        error: (msg, fields) => emit("error", component, msg, fields),
    };
}
//# sourceMappingURL=log.js.map
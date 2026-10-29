import { setLogSink, stringifyLogEntry } from "@earendil-works/pi-ai";
import { appendRotatingLog, getAgentLogPath } from "../config.js";
const AGENT_LOG_MAX_BYTES = 20 * 1024 * 1024;
let context = {};
/** Merge late-bound fields (e.g. mode, sessionId) into every subsequent log entry. */
export function setLogContext(fields) {
    Object.assign(context, fields);
}
/**
 * Route all structured logging (coding-agent and pi-ai) to the shared JSONL
 * log at ~/.prime/agent/logs/agent.jsonl. One master file, filterable by the
 * pid/context fields; writes are best-effort and size-bounded.
 */
export function installFileLogSink(fields) {
    context = { pid: process.pid, ...fields };
    setLogSink((entry) => {
        appendRotatingLog(getAgentLogPath(), stringifyLogEntry({ ...entry, ...context }), AGENT_LOG_MAX_BYTES);
    });
}
//# sourceMappingURL=logging.js.map
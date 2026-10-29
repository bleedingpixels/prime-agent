import { autonomousLimitReason } from "../../core/autonomous.js";
/**
 * Map a finished prime-agent turn onto an ACP stop reason.
 *
 * Autonomous quality gates deliberately do NOT surface as a distinct stop
 * reason: a failing gate is a continuation inside the same prompt turn, so the
 * turn only ends once the gate loop itself is finished. What the client sees is
 * why the loop stopped, not that a gate failed mid-flight.
 */
export function acpStopReason(options) {
    if (options.cancelled)
        return "cancelled";
    const status = options.autonomous;
    if (!status?.enabled)
        return "end_turn";
    const limit = autonomousLimitReason(status);
    // Token exhaustion is the one autonomous limit ACP expresses natively. Turn,
    // continuation, and wall-clock limits all mean the agent was stopped before
    // finishing, so none of them may report as a clean end_turn.
    if (limit === "maxTokens")
        return "max_tokens";
    if (limit)
        return "max_turn_requests";
    return "end_turn";
}
//# sourceMappingURL=acp-stop-reason.js.map
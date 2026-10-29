/** Prompt admission failure; only a confirmed cancellation is retry-safe. */
export class AgentConnectionPromptAdmissionError extends Error {
    status;
    cancelled;
    constructor(message, status, options) {
        super(message, options);
        this.status = status;
        this.cancelled = status === "cancelled";
        this.name = "AgentConnectionPromptAdmissionError";
    }
}
//# sourceMappingURL=types.js.map
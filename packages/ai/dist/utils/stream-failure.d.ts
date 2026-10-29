import type { AssistantMessage } from "../types.js";
/**
 * Shared classification and reporting for provider stream failures, so no
 * provider collapses a specific cause (refusal, safety filter, overload, ...)
 * into a generic string before it is logged and persisted.
 */
export type StreamFailureKind = "refusal" | "safety" | "overloaded" | "rate_limit" | "server_error" | "auth" | "invalid_request" | "malformed_response" | "unknown";
export interface StreamFailureInfo {
    kind: StreamFailureKind;
    /** Provider's own error/stop identifier, e.g. "overloaded_error" or "SAFETY". */
    providerErrorType?: string;
    status?: number;
    requestId?: string;
    /** Truncated raw provider payload for post-mortems. */
    raw?: string;
}
export declare class StreamFailureError extends Error {
    readonly info: StreamFailureInfo;
    constructor(message: string, info: StreamFailureInfo);
}
/** Build a user-facing message like "Provider overloaded (overloaded_error, 529) [request_id: req_abc]". */
export declare function streamFailureMessage(info: StreamFailureInfo, detail?: string): string;
export declare function classifyStreamFailure(providerErrorType?: string, status?: number): StreamFailureKind;
/**
 * Failure for a stream that terminated with a provider stop/finish reason that
 * maps to "error" (e.g. Anthropic "refusal", Gemini "SAFETY"). Providers call
 * this instead of throwing a generic error, so the raw reason survives.
 */
export declare function streamFailureFromStopReason(rawStopReason: string | undefined, extra?: Pick<StreamFailureInfo, "requestId">): StreamFailureError;
export declare function truncateRawPayload(raw: string): string;
/**
 * Best-effort extraction of structured failure info from any thrown value:
 * StreamFailureError, provider SDK errors (Anthropic/OpenAI APIError, AWS SDK
 * exceptions, Google ApiError), or plain errors.
 */
export declare function extractStreamFailureInfo(error: unknown): StreamFailureInfo;
/**
 * User-facing message for a thrown stream error: a classified one-liner with
 * the provider's own short message, never the raw payload/trace. Unrecognized
 * errors pass through verbatim so their text (which downstream retry matching
 * may depend on) is preserved.
 */
export declare function formatStreamFailureMessage(error: unknown): string;
/**
 * Record a terminal stream failure on the message (structured diagnostic that
 * persists to session JSONL) and emit one structured log line. Call from the
 * provider's terminal catch after stopReason/errorMessage are set; no-op for
 * user-initiated aborts.
 */
export declare function recordStreamFailure(model: {
    provider: string;
    id: string;
    api: string;
}, output: AssistantMessage, error: unknown): void;
//# sourceMappingURL=stream-failure.d.ts.map
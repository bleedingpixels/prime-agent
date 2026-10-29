import { createRequire as __piBundleCreateRequire } from 'node:module'; const require = __piBundleCreateRequire(import.meta.url);

// ../ai/src/utils/diagnostics.ts
function formatThrownValue(value) {
  if (value instanceof Error) return value.message || value.name;
  if (typeof value === "string") return value;
  return String(value);
}
function extractDiagnosticError(error) {
  if (!(error instanceof Error)) return { name: "ThrownValue", message: formatThrownValue(error) };
  const code = error.code;
  return {
    name: error.name || void 0,
    message: error.message || error.name,
    stack: error.stack,
    code: typeof code === "string" || typeof code === "number" ? code : void 0
  };
}
function createAssistantMessageDiagnostic(type, error, details) {
  return { type, timestamp: Date.now(), error: extractDiagnosticError(error), details };
}
function appendAssistantMessageDiagnostic(message, diagnostic) {
  message.diagnostics = [...message.diagnostics ?? [], diagnostic];
}

// ../ai/src/log.ts
var sink;
function setLogSink(next) {
  sink = next;
}
function jsonReplacer() {
  const seen = /* @__PURE__ */ new WeakSet();
  return (_key, value) => {
    if (typeof value === "bigint") return value.toString();
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  };
}
function stringifyLogEntry(entry) {
  try {
    return JSON.stringify(entry, jsonReplacer());
  } catch {
    return JSON.stringify({
      ts: entry.ts,
      level: entry.level,
      component: entry.component,
      msg: String(entry.msg),
      fieldsError: "unserializable fields dropped"
    });
  }
}
function emit(level, component, msg, fields) {
  try {
    const entry = { ...fields, ts: (/* @__PURE__ */ new Date()).toISOString(), level, component, msg };
    try {
      if (sink) {
        sink(entry);
        return;
      }
    } catch {
    }
    if (level === "warn" || level === "error") {
      console.error(stringifyLogEntry(entry));
    }
  } catch {
  }
}
function getLogger(component) {
  return {
    debug: (msg, fields) => emit("debug", component, msg, fields),
    info: (msg, fields) => emit("info", component, msg, fields),
    warn: (msg, fields) => emit("warn", component, msg, fields),
    error: (msg, fields) => emit("error", component, msg, fields)
  };
}

// ../ai/src/utils/stream-failure.ts
var StreamFailureError = class extends Error {
  constructor(message, info) {
    super(message);
    this.name = "StreamFailureError";
    this.info = info;
  }
};
var KIND_MESSAGES = {
  refusal: "Model refused to respond",
  safety: "Response blocked by provider safety filters",
  overloaded: "Provider overloaded",
  rate_limit: "Provider rate limit exceeded",
  server_error: "Provider server error",
  auth: "Provider authentication failed",
  invalid_request: "Provider rejected the request",
  malformed_response: "Provider returned a malformed response",
  unknown: "Provider stream failed"
};
function streamFailureMessage(info, detail) {
  const qualifiers = [info.providerErrorType, info.status !== void 0 ? String(info.status) : void 0].filter(Boolean).join(", ");
  let message = KIND_MESSAGES[info.kind];
  if (qualifiers) message += ` (${qualifiers})`;
  if (detail) message += `: ${detail}`;
  if (info.requestId) message += ` [request_id: ${info.requestId}]`;
  return message;
}
function classifyStreamFailure(providerErrorType, status) {
  const type = providerErrorType?.toLowerCase() ?? "";
  if (type === "refusal") return "refusal";
  if (/sensitive|safety|prohibited_content|blocklist|spii|recitation|content.?filter|guardrail|flagged/.test(type)) {
    return "safety";
  }
  if (type.includes("overloaded") || status === 529) return "overloaded";
  if (type.includes("rate_limit") || type.includes("throttl") || status === 429) return "rate_limit";
  if (/authentication|permission|unauthorized/.test(type) || status === 401 || status === 403) return "auth";
  if (type.includes("invalid_request") || type.includes("not_found_error") || status === 400 || status === 404) {
    return "invalid_request";
  }
  if (type.includes("malformed")) return "malformed_response";
  if (type.includes("api_error") || type.includes("server_error") || type.includes("unavailable") || status !== void 0 && status >= 500) {
    return "server_error";
  }
  return "unknown";
}
function streamFailureFromStopReason(rawStopReason, extra) {
  const info = {
    kind: rawStopReason ? classifyStreamFailure(rawStopReason) : "unknown",
    providerErrorType: rawStopReason,
    requestId: extra?.requestId
  };
  if (info.kind === "unknown" && /malformed/i.test(rawStopReason ?? "")) info.kind = "malformed_response";
  const message = rawStopReason ? streamFailureMessage(info) : streamFailureMessage(info, "stream ended with an error and no stop reason");
  return new StreamFailureError(message, info);
}
var MAX_RAW_LENGTH = 2e3;
function truncateRawPayload(raw) {
  return raw.length > MAX_RAW_LENGTH ? `${raw.slice(0, MAX_RAW_LENGTH)}\u2026` : raw;
}
function extractStreamFailureParts(error) {
  if (error instanceof StreamFailureError) return { info: error.info };
  if (!(error instanceof Error)) return { info: { kind: "unknown" } };
  const err = error;
  const status = typeof err.status === "number" ? err.status : typeof err.statusCode === "number" ? err.statusCode : void 0;
  let body = err.error;
  if (body && typeof body === "object" && body.error && typeof body.error === "object") {
    body = body.error;
  }
  const bodyType = body && typeof body === "object" ? body.type ?? body.code : void 0;
  const bodyMessage = body && typeof body === "object" ? body.message : void 0;
  const providerErrorType = typeof bodyType === "string" ? bodyType : typeof err.code === "string" ? err.code : err.name !== "Error" && err.name !== "StreamFailureError" ? err.name : void 0;
  const headers = err.headers;
  const headerRequestId = headers && typeof headers.get === "function" ? headers.get("request-id") ?? headers.get("x-request-id") : headers && typeof headers === "object" ? headers["request-id"] ?? headers["x-request-id"] : void 0;
  const rawRequestId = err.requestID ?? err.request_id ?? err.$metadata?.requestId ?? headerRequestId;
  const requestId = typeof rawRequestId === "string" ? rawRequestId : void 0;
  return {
    info: {
      kind: classifyStreamFailure(providerErrorType ?? error.message, status),
      providerErrorType,
      status,
      requestId
    },
    detail: typeof bodyMessage === "string" ? bodyMessage : void 0
  };
}
function extractStreamFailureInfo(error) {
  return extractStreamFailureParts(error).info;
}
function formatStreamFailureMessage(error) {
  if (error instanceof StreamFailureError) return error.message;
  const { info, detail } = extractStreamFailureParts(error);
  if (info.kind === "unknown") {
    return error instanceof Error ? error.message : JSON.stringify(error);
  }
  return streamFailureMessage(info, detail);
}
var log = getLogger("ai.provider");
function recordStreamFailure(model, output, error) {
  if (output.stopReason !== "error") return;
  const info = extractStreamFailureInfo(error);
  appendAssistantMessageDiagnostic(output, {
    type: "provider_stream_failure",
    timestamp: Date.now(),
    error: extractDiagnosticError(error),
    details: { ...info }
  });
  const rawMessage = error instanceof Error ? error.message : String(error);
  log.error("provider stream failure", {
    provider: model.provider,
    model: model.id,
    api: model.api,
    kind: info.kind,
    providerErrorType: info.providerErrorType,
    status: info.status,
    requestId: info.requestId,
    message: output.errorMessage,
    // errorMessage is user-facing and concise; keep the raw cause for debugging.
    cause: rawMessage === output.errorMessage ? void 0 : truncateRawPayload(rawMessage)
  });
}

export {
  setLogSink,
  stringifyLogEntry,
  getLogger,
  formatThrownValue,
  extractDiagnosticError,
  createAssistantMessageDiagnostic,
  appendAssistantMessageDiagnostic,
  StreamFailureError,
  streamFailureMessage,
  classifyStreamFailure,
  streamFailureFromStopReason,
  truncateRawPayload,
  extractStreamFailureInfo,
  formatStreamFailureMessage,
  recordStreamFailure
};

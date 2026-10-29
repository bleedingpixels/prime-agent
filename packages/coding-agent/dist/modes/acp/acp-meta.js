/**
 * Namespaced `_meta` payloads for prime-agent capabilities that ACP has no
 * native concept for (IPython cell semantics, RLM subagents, autonomous gates,
 * goals, heartbeats, continual harness state).
 *
 * ACP reserves `_meta` on capability objects, notifications, tool calls, and
 * content blocks precisely so agents can carry non-standard data. Vanilla ACP
 * clients ignore these keys; a prime-agent-aware client (or the verifiers
 * harness) reads them. Never add non-standard fields to an ACP object root.
 */
/** Reverse-domain namespace for every prime-agent `_meta` payload. */
export const PRIME_AGENT_META_NAMESPACE = "ai.primeintellect.prime-agent";
/** Wrap a prime-agent payload in its reverse-domain `_meta` envelope. */
export function primeAgentMeta(payload) {
    return { [PRIME_AGENT_META_NAMESPACE]: payload };
}
//# sourceMappingURL=acp-meta.js.map
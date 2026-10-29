# Ultra Reasoning

Ultra is a conversation-scoped agent mode that combines a provider's native `max` reasoning effort with proactive, bounded use of Prime Agent's recursive subagents. It is host behavior rather than a new provider reasoning value.

## Use Ultra

Ultra is available only when the selected model advertises native `max` reasoning. Select it in any of these ways:

```text
/effort ultra
```

```bash
prime-agent --thinking ultra
prime-agent --model openai-codex/gpt-5.6-sol:ultra
```

The thinking selector, RPC `set_thinking_level` command, SDK `thinkingLevel` option, and extension thinking-level APIs also accept `ultra` when the active model supports it.

Ultra remains selected when its conversation is saved and resumed. It intentionally does not replace `defaultThinkingLevel` for new conversations. If `ultra` is written into global settings manually, Prime Agent normalizes that saved default to `max`.

## Runtime Semantics

Prime Agent keeps `ultra` in agent and session state so the coding host can distinguish it from ordinary `max`. Before every provider request, the core agent translates it to provider-native `max`. Direct summarization requests used by compaction apply the same translation.

Provider metadata remains provider-native:

- `thinkingLevelMap` supports values through `max`; do not add an `ultra` key.
- Ultra is synthesized by the coding host only when `getSupportedThinkingLevels()` includes `max`.
- Moving an Ultra session to a model without native `max` clamps it to the highest level that model supports.

This design works across providers. Ultra is not limited to OpenAI models; any current or custom model with native `max` support is eligible.

## Daemon Compatibility

Daemon clients negotiate the `ultra_thinking_level` capability. A capable client receives conversation state and events as `ultra`; a legacy client receives wire-safe `max`, cannot cycle into Ultra, and cannot send Ultra-bearing commands. The supervisor keeps Ultra intact across a capable supervisor-to-worker hop, then normalizes attach snapshots, live events, lists, standalone session context, and command responses separately for each public client. A newer supervisor rejects Ultra-bearing commands for an older worker that does not advertise the capability.

## Proactive Delegation

While Ultra is active, the system prompt adds a `<multi_agent_mode>` section directing the model to delegate independent, context-heavy research, review, and implementation when parallelism materially improves speed or quality. The doctrine requires bounded fan-out, explicit result collection, synthesis, and independent verification. It discourages delegation for trivial, tightly coupled, or serial work.

The additional doctrine is capability-gated. It appears only when:

1. Ultra is the current thinking level.
2. The IPython tool is active.
3. The session has remaining recursive-agent depth.

Entering or leaving Ultra rebuilds the base system prompt without discarding extension modifications or a custom system prompt. Eligible recursive children inherit Ultra and independently send `max` to their provider. Children using a model without native `max` receive that model's normal clamped level. At the recursion limit, provider reasoning remains `max`, but the proactive delegation section is omitted because another child cannot be spawned.

Ultra supplies orchestration guidance rather than an unconditional scheduler. The model still decides whether delegation is useful for a particular turn, and all existing RLM depth and resource limits continue to apply.

## Implementation Map

The feature spans two layers while leaving the provider package unchanged:

- [`../../agent/src/types.ts`](../../agent/src/types.ts) adds host-level `ultra` state.
- [`../../agent/src/thinking-level.ts`](../../agent/src/thinking-level.ts) maps host effort to provider effort.
- [`../src/core/thinking-level.ts`](../src/core/thinking-level.ts) owns availability and clamping.
- [`../src/core/agent-session.ts`](../src/core/agent-session.ts) handles prompt transitions, conversation-only persistence, and child inheritance.
- [`../src/core/system-prompt.ts`](../src/core/system-prompt.ts) adds capability-gated delegation guidance.
- [`../src/core/compaction/compaction.ts`](../src/core/compaction/compaction.ts) normalizes direct summarization calls.
- [`../src/modes/daemon/daemon-protocol.ts`](../src/modes/daemon/daemon-protocol.ts) negotiates Ultra across daemon versions.
- [`../src/modes/daemon/daemon-thinking-level-compat.ts`](../src/modes/daemon/daemon-thinking-level-compat.ts) downgrades Ultra to `max` for legacy clients.
- [`../src/modes/daemon/daemon-supervisor.ts`](../src/modes/daemon/daemon-supervisor.ts) preserves Ultra across capable workers and normalizes each public client independently.
- CLI, selectors, theme styling, SDK/RPC types, examples, and user documentation expose the new level.

`@earendil-works/pi-ai` deliberately retains its native reasoning-level union and model metadata. Keeping the translation at the agent boundary prevents provider adapters from receiving an unsupported `ultra` value.

## Verification Coverage

Focused tests cover:

- Provider requests retaining Ultra in host state while receiving `max`.
- Native-`max` capability detection and clamping.
- Adding and removing the Ultra system-prompt doctrine.
- Custom-system-prompt preservation.
- Conversation-scoped settings normalization.
- Both direct compaction request paths normalizing Ultra to provider `max`.
- CLI and `/effort` selection.
- Recursive child inheritance and provider `max` requests.
- Persisted-session rehydration retaining the Ultra doctrine and provider mapping.
- Old-client/new-daemon state, list, context, event, and snapshot downgrades.
- New-client/old-daemon and new-supervisor/old-worker command rejection.
- Supervisor/worker snapshot streaming after worker isolation and adoption.

The relevant suites are in `packages/agent/test/agent.test.ts` and the Ultra-related test files under `packages/coding-agent/test/`.

## Maintaining a Private Build

An official `prime-agent update` replaces the installed release bundle. Until Ultra ships in that release channel, a private installation must reapply the fork after each official update:

1. Rebase or merge the new upstream release into the private Ultra branch.
2. Run the repository checks and focused Ultra tests.
3. Rebuild and redeploy the agent and coding-agent packages from the private branch.
4. Restart the daemon so it loads the replacement bundle; already-running processes do not hot-reload changed files.
5. Confirm `prime-agent --help` lists `ultra`, confirm `prime-agent status --json` reports the private build, and select `/effort ultra` in the restored conversation.

Keep a backup of the upstream installed bundle so the official build can be restored independently of the source branch. The source commit remains the durable copy; an overlay of generated files is only a deployment artifact.

## Maintenance Invariants

When updating this feature:

1. Keep `ultra` out of provider-native model metadata and translate it at every direct inference boundary.
2. Gate availability on native `max`, not provider or model names.
3. Rebuild prompts on both entry to and exit from Ultra.
4. Preserve conversation-only persistence and recursive depth limits.
5. Keep daemon wire values capability-gated: legacy clients receive `max`, and newer clients reject Ultra commands against older daemons or session workers.
6. Update CLI, interactive, RPC, SDK, extension, documentation, and test surfaces together when the thinking-level union changes.

# Zenith

Zenith is Prime Agent's built-in Python-backed skill for durable, evidence-gated autonomous missions. It coordinates bounded RLM children from the resident root agent while persisting a project-local mission ledger.

## Invoke

```text
/skill:zenith <mission brief>
```

`/skill:zenith` is the canonical built-in command. A global Prime prompt template may also provide:

```text
/zenith <mission brief>
```

The compatibility template tells Prime to load the installed `zenith` skill and treats the arguments as an explicit fully autonomous mission. It does not invoke Telos or an external Zenith harness.

## Operating model

1. The root investigates the repository and records baseline state.
2. The root writes a charter and falsifiable contract, then `start` creates only a planning skeleton.
3. Root-spawned, read-only critics adversarially review the proposed contract and persist immutable preflight `end_review` handoffs. Preflight is required by default, and the latest review must pass with a nonblank report and evidence.
4. After incorporating those findings, the root submits a dependency-aware DAG of bounded `work` and read-only `validate` tasks plus declarative `gate` nodes; after a prior `advance` reaches readiness, strict `close` admits only the separate terminal reviewer and never dispatches plan work.
5. `zenith.advance` performs one reconciliation/admission tick. RLM calls return admission handles, so the root ends its turn instead of waiting.
6. Children record structured results with `zenith.end_task` or `zenith.end_review`; direct messages only wake the root.
7. Fresh validators treat worker output as claims and independently reproduce evidence.
8. An independent terminal review checks the final workspace before evidence-gated closure.

The default Prime recursion depth permits root-to-child delegation only. Zenith tasks are intentionally self-contained; children must not delegate.

## Durability

Mission state is stored under:

```text
<workspace>/.prime/agent/zenith/missions/
```

Use the Python API to transition state rather than editing ledger files. Normal Prime sessions are daemon-backed resident workers, so the UI can detach while the root, kernel, schedules, and RLM descendants remain resident:

```bash
prime-agent list
prime-agent attach <agent>
```

For an explicitly autonomous mission, Zenith can arrange a `follow_up` RLM heartbeat whose instruction performs at most one normal bounded advancement, stops after any admission, and never resolves attention autonomously. A persistent goal is separately opt-in with `create_goal=True`; it is never created by default. Failed heartbeat cleanup stays retryable, and abort returns `/goal clear` when an opted-in goal remains active. These are continuity mechanisms, not the source of truth. Continual-harness refinement is reserved for repeated reusable methods and must not hold mutable mission state.

## Python API

Prime pre-imports the `zenith` module into IPython. Concurrency may be fixed or `"auto"`; auto scales to dependency-ready weighted demand within explicit bounds. Per-task `concurrency_cost`, `priority`, and `exclusive` hints modulate admission, and runtime scale-down drains without cancelling children. The public API is:

- `await zenith.start(...)`
- `zenith.submit_plan(...)`
- `zenith.inspect(...)`
- `zenith.get_decide_preconditions(...)`
- `zenith.list_missions(...)`
- `await zenith.advance(...)`
- `await zenith.set_concurrency(...)`
- `await zenith.decide(...)`
- `await zenith.close(...)`
- `await zenith.abort(...)`
- `await zenith.end_task(...)`
- `await zenith.end_review(...)`
- `await zenith.ensure_continuity(...)`
- `await zenith.finalize_continuity(...)`
- `await zenith(action=..., ...)` or `await zenith.run(action=..., ...)`

See [references/api.md](references/api.md) for signatures and examples. The callable dispatcher is a convenience surface; explicit methods are clearer in orchestration code.

## Safety and limitations

Zenith is coordination and durable local bookkeeping, not a security sandbox, a distributed transaction system, admission authentication, or exactly-once execution for external side effects. Children normally share the root worker's OS permissions. Zenith rejects symlinks in its ledger authority path and checks mission-root containment, but a malicious same-user process can still race checks or rewrite files. Task path boundaries are instructions, not enforcement. Shared-worktree writers must be serialized through DAG dependencies, and destructive or externally visible actions still require the authorization demanded by the user and project.

## Guides

- [Mission design](references/mission-design.md)
- [Orchestration, recovery, and stopping](references/orchestration.md)
- [Evidence, validation, and closure](references/validation.md)
- [Python API reference](references/api.md)

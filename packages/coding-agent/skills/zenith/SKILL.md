---
name: zenith
description: Run durable, Prime-native autonomous missions with a falsifiable contract, dependency-aware task DAG, bounded RLM workers, fresh validators, explicit attention handling, recovery, and evidence-gated stopping. Use when the user invokes /skill:zenith or /zenith, or requests a long-running repository mission that must survive detach/resume and be independently verified.
license: Apache-2.0
compatibility: Requires Prime Agent's persistent IPython kernel, RLM child runtime, daemon-backed sessions, and the bundled Python zenith skill.
---

# Zenith

Treat the user's arguments as the mission brief. Zenith is a durable orchestration method and Python-backed skill, not a second daemon or an autonomous shell loop.

## Non-negotiable model

- The **root agent is the orchestrator**. It owns investigation, charter, contract, DAG, attention decisions, and closure. This version has no in-place strict patch/replan mutation.
- RLM children receive bounded `worker`, `validator`, or `terminal-review` assignments. They do not own the mission. At Prime's default recursion depth, children cannot delegate.
- `rlm(...)` returns an **admission handle only**, never a result. After `zenith.advance(...)` admits children, end the turn; never wait or poll for them.
- Children persist structured handoffs with `await zenith.end_task(...)` or `await zenith.end_review(...)`. `agent_message` is wake-up only, not authoritative result transport.
- The durable source of truth is `<workspace>/.prime/agent/zenith/missions/`. Kernel variables, transcripts, messages, goals, heartbeats, and continual-harness entries are not the mission ledger. Zenith rejects symlinks in this authority path, but same-user processes can still race or rewrite files; this is not an OS security boundary.
- Worker output and worker-run green commands are claims. Fresh validators and an independent terminal review must verify the final workspace.
- `close` starts the final evidence gate; the mission becomes `done` only after a successful independent terminal review is ingested. `abort` is explicit unsuccessful termination. Stopping work is not closure.

## Root workflow

### 1. Recover before creating

Resolve an absolute workspace, call `zenith.list_missions(...)`, and inspect any matching active mission. Resume it rather than creating a duplicate. After detach, compaction, or restart, recover from the ledger; resident agents are found with `prime-agent list` and resumed with `prime-agent attach <agent>`.

### 2. Investigate and charter

Before dispatching work, read project instructions, map the relevant code and checks, record version-control and test baselines, and identify shared files, unsafe side effects, missing access, and stopping conditions. Write a precise mission charter with objective, scope, non-goals, constraints, hazards, baseline, and authorization boundary.

Create atomic contract assertions with stable IDs, falsifiable descriptions, and required evidence. After this root investigation, call `await zenith.start(...)` to persist only a `planning` skeleton. Preflight is required by default; use `require_preflight=False` only when the caller explicitly waives it. Then spawn root-owned, read-only RLM critics to adversarially review the charter and contract. Give each a unique preflight attempt ID and require structured `await zenith.end_review(...)`; after admitting them, end the turn. Incorporate every material finding and obtain a latest passing, nonblank preflight result before plan submission.

Read [Mission Design](references/mission-design.md) before starting a mission or designing a separately authorized replacement after abort.

### 3. Submit the DAG

`start` never admits a planner or worker. Once all preflight contract reviews are incorporated, call `zenith.submit_plan(...)` to submit bounded tasks with exact roles `work`, `validate`, and declarative `gate`; include dependencies, allowed terrain, acceptance text, assertion targets, and scheduling hints when useful. `concurrency=N` is a fixed slot budget; `concurrency="auto"` deterministically scales to ready weighted demand within explicit `min_concurrency`/`max_concurrency` bounds. `concurrency_cost`, `priority`, and `exclusive` let the DAG express task cost and isolation. Auto is not host-resource telemetry. Serialize writers that share files, generated outputs, manifests, schemas, migrations, or global registries.

Consult [API Reference](references/api.md) for exact signatures and schemas.

### 4. Arrange explicit continuity when authorized

For an explicitly fully autonomous mission—such as `/zenith ...`—use `await zenith.ensure_continuity(...)` to provision a Zenith-owned `rlm_heartbeat` using `delivery_mode="follow_up"`. Goal creation is separately opt-in with `create_goal=True`; `start`, `run`, and `ensure_continuity` do not create a goal by default. Each follow-up may perform one normal bounded `advance`, end immediately after any admission, and call `close` only when that tick is ready; it must never accept risk or make attention decisions. Do not alter the user's `/heartbeat`.

The Prime daemon keeps the root, kernel, schedules, and descendants resident while the UI is detached. Continual harness/refinement is only for a repeated, reusable method discovered across missions; never store mutable mission status there.

### 5. Advance one tick

```python
state = zenith.inspect(mission_id=mission_id, workspace=workspace)
tick = await zenith.advance(mission_id=mission_id, workspace=workspace)
```

Each `advance` reconciles durable results and performs at most one bounded scheduling tick. If `tick["dispatched"]` is non-empty, **end the assistant turn immediately**. Do not sleep, poll, wait on child completion, or gather `rlm` calls. A child completion later wakes the root; inspect the ledger and advance again.

### 6. Handle attention without inventing unavailable mutation

If inspection or advancement returns attention, choose only an available action through `await zenith.decide(...)` and record a reason. Capture exact failure context before retrying. Strict patch/replan mutation is unavailable in this version and must not be advertised or attempted. Retry only genuinely retryable work already present in the submitted DAG. If dependencies, scope, safety, or evidence invalidate that graph, leave attention open for user judgment or abort and begin a separately authorized replacement mission while preserving the original ledger. Adjust a live mission with `await zenith.set_concurrency(...)`; scaling down drains and never cancels admitted work. Never retry a deterministic failure unchanged or automatically accept a validator rejection.

Read [Orchestration, Recovery, and Stopping](references/orchestration.md) for continuity, state recovery, attention, and honest limitations.

### 7. Validate and close

Every consequential assertion needs fresh independent validator evidence after the relevant implementation. After a prior `advance` has made the DAG ready, `await zenith.close(...)` performs a strict state check without advancing or dispatching task work, then admits a separate read-only `terminal-review` that inspects the complete final diff, baseline, required project-native commands, delivered scope, and unresolved risks without relying on the internal Zenith ledger. Admission is not completion: end the turn.

The reviewer records `end_review`; a later `advance` ingests it. Only a passing review moves the mission to `done`. A failed review opens attention. Retry an existing eligible task only when the failure is genuinely retryable; otherwise leave attention open or abort and start a separately authorized replacement mission, because strict patch/replan mutation is unavailable. Any later completion attempt requires fresh validation and a new terminal review. Do not edit the ledger or weaken the contract to force success. Use `await zenith.abort(...)` for intentional unsuccessful termination. Then call `await zenith.finalize_continuity(...)` to remove Zenith-owned follow-up resources; cleanup failures remain retryable. Complete a Zenith-created goal only after successful closure. If an abort leaves an opted-in goal active, Zenith returns the explicit manual action `/goal clear` and does not claim continuity was fully finalized.

Read [Evidence, Validation, and Closure](references/validation.md) before accepting validator results or closing.

## User-facing commands

- `/skill:zenith <mission brief>` is the canonical built-in skill command.
- `/zenith <mission brief>` is a global Prime prompt-template compatibility command that loads this installed skill and explicitly requests a fully autonomous mission.

Do not follow or modify similarly named non-Prime compatibility aliases when this built-in skill is loaded.

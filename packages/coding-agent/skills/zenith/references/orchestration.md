# Orchestration, Recovery, and Stopping

## Authority and roles

The **root Prime agent is the orchestrator**. It investigates, owns the charter and contract, submits and revises the DAG, interprets evidence, decides attention items, and alone closes or aborts the mission.

RLM children are bounded executors:

- a plan task with role `work`: one implementation or focused investigation assignment;
- a plan task with role `validate`: a fresh, read-only verification of specified assertions after implementation; or
- the `terminal-review` admitted by `close`: the final independent, read-only review of the complete workspace and closure evidence.

A plan role of `gate` is a declarative AND gate and does not admit a child.

Do not give a child the entire mission or orchestration authority. At Prime's default maximum recursion depth, root sessions can create children but children cannot create grandchildren. Every child prompt must therefore be self-contained and must forbid delegation.

## One bounded scheduler tick per turn

`await zenith.advance(...)` performs one reconciliation/scheduling tick. It may process newly recorded results, expose an attention item, or admit dependency-ready children within the current weighted concurrency policy. Fixed policies use a stable slot budget; auto policies recompute bounded effective capacity from active and ready task cost each tick. Runtime scale-down drains rather than cancelling admitted children.

RLM admission is not completion. An underlying `await rlm(...)` returns only a handle containing `rlm_child_id`, `name`, `session_dir`, and `model`; it never returns the child's answer. Therefore:

1. Call `advance` once.
2. If it admits one or more children, retain the returned summary and **end the current assistant turn immediately**.
3. Do not wait, sleep, poll `rlm.list_subagents()`, spin on ledger files, or wrap admissions in a fan-in such as `asyncio.gather`.
4. Let child completion wake the root for another turn, then inspect the ledger and call the next bounded `advance`.

Multiple results may arrive over several turns. The durable ledger, not message order, determines state.

## Structured child handoff

A Zenith child must finish by calling the installed Python skill from its own kernel:

```python
await zenith.end_task(
    mission_id="mission-id",
    task_id="implement-resume",
    attempt_id="attempt-id-from-child-prompt",
    done=True,
    passed=True,
    report="Implemented resume state transitions and added focused cases.",
    evidence=[
        {
            "kind": "command-claim",
            "command": "project-native focused test command",
            "exit_code": 0,
            "summary": "Worker reports 12 focused cases passed; validator must rerun.",
        }
    ],
    workspace="/absolute/path/to/repository",
)
```

Plan validators use `await zenith.end_task(...)` with assertion-by-assertion verdicts. The separate terminal reviewer uses `await zenith.end_review(...)` with its independent final report, gaps, and evidence. Consult [API Reference](api.md) for exact fields.

`end_task` and `end_review` persist the structured result before notifying the root. `agent_message` is only a small wake-up signal; it is not the result transport or mission database. Do not paste large reports, secrets, or authoritative pass/fail state into messages. If notification is delayed or duplicated, the root recovers from the ledger.

Worker-reported files, commands, outputs, and “green” checks remain claims. They do not pass contract assertions.

## Continuity for a fully autonomous mission

The canonical `/skill:zenith` command works in the current Prime session. The global `/zenith` prompt template explicitly treats its arguments as a fully autonomous mission. For such an explicit request, `ensure_continuity` creates an agent-owned `rlm_heartbeat` with `delivery_mode="follow_up"`, so idle reconciliation can resume without interrupting an active turn. A persistent goal is a separate opt-in: pass `create_goal=True` only with explicit authorization. `start`, `run`, and `ensure_continuity` never create one by default.

Do not create a competing user `/heartbeat`. A follow-up may inspect and call one normal bounded `advance`; if that admits children it ends immediately, and if the tick is `ready_for_review` it may call `close` once and end after reviewer admission. It must not decide attention, patch, retry, abort, or accept risk. Judgment remains with the root's normal turn.

A typical follow-up instruction is:

```text
Continue Zenith mission <mission-id> with one bounded tick. If attention is open, report it without deciding. Otherwise advance once; end immediately after any admission, or close once only if that tick is ready for review. Never poll or create a loop.
```

Call `finalize_continuity` when the mission reaches a terminal state so Zenith-owned heartbeat state is removed. A failed heartbeat deletion preserves its ID with `finalized=False` for retry. Complete a Zenith-created goal only after successful evidence-gated closure; an aborted mission is not a completed objective. If abort leaves an opted-in goal current, run `/goal clear` as returned by the API, then retry finalization.

The mission ledger remains independent of goal and heartbeat state. Losing a heartbeat does not lose the mission.

## Detach and resume

Normal interactive Prime sessions are daemon-backed resident workers. Closing the TUI detaches the client; it does not make a running Zenith mission complete or abort it. From a shell:

```bash
prime-agent list
prime-agent attach <agent>
```

The resident root owns the session, kernel, schedules, and RLM descendants. After attachment or context compaction, recover by mission ID or absolute workspace with `zenith.list_missions(...)` and `zenith.inspect(...)`. Do not depend on an in-memory Python variable or transcript summary as the sole state record.

## State recovery procedure

On every resumed or uncertain turn:

1. Resolve the absolute workspace and list its missions. Reuse a matching active mission instead of creating a duplicate.
2. Inspect the mission ledger and note its current plan revision, task states, assertion states, outstanding reviews, running child identities, and attention item.
3. If a child is recorded as running, let `advance` reconcile it with Prime's retained direct-child registry. Do not launch a replacement writer merely because no message arrived.
4. If the recorded child cannot be reconciled, move through the explicit attention decision path. Preserve its prior claims and uncertain state.
5. Check continuity resources and recreate only missing Zenith-owned resources when the mission is explicitly autonomous.
6. Run at most one bounded `advance` tick.

Mission files live under:

```text
<workspace>/.prime/agent/zenith/missions/
```

Treat these files as an internal ledger. Use the public Python API, not hand-edits, for normal transitions. Preserve a damaged ledger and stop honestly rather than fabricating state.

## Attention and decisions

Attention is a durable stop requiring root judgment. Typical causes include a
failed child, missing result, validator rejection, unsafe operation, dependency
mismatch, iteration limit, stale/uncertain child, or a user decision.

`decide` resolves **every currently open attention item exactly once** through
the sole recoverable CAS mutation path. The safe client sequence is:

1. call `zenith.get_decide_preconditions(...)` and retain its revision and exact
   seven raw-byte hashes;
2. choose one canonical lowercase UUIDv4 operation ID and the complete action
   batch covering the exact open attention IDs;
3. outside the mission lock, create immutable mode-0400 structured v2 reports
   for the controller-owned action policy, each bound to that exact operation;
   for `continue`, use a v2 controller-HMAC receipt with the same operation ID
   and a canonical whole-second UTC `issued_at` within the 300-second age and
   30-second future-skew bounds; then construct the exact closed
   `zenith.decide.evidence/v1` manifest bound to that operation, snapshot,
   action digest, attention binding, and code/build/config subject; and
4. submit all four strict inputs and retain the returned durable receipt.

```python
snapshot = zenith.get_decide_preconditions(
    "mission-id", workspace="/absolute/path/to/repository"
)
decisions = [
    {
        "attention_id": "attn-id-from-inspect",
        "action": "retry",
        "task_id": "implement-resume",
        "reason": "Transient provider admission failure; no workspace edits occurred.",
    }
]
# Mint once, then prepare `evidence_manifest` per references/api.md so it
# binds this UUID, snapshot, exact normalized action, attention, and report.
import uuid
operation_id = str(uuid.uuid4())
# evidence_manifest = <closed manifest constructed from immutable reports>
receipt = await zenith.decide(
    mission_id="mission-id",
    decisions=decisions,
    workspace="/absolute/path/to/repository",
    expected_revision=snapshot["revision"],
    expected_file_hashes=snapshot["file_hashes"],
    evidence_manifest=evidence_manifest,
    operation_id=operation_id,
)
```

Generate the UUIDv4 once and reuse that same value only for response-loss
replay. Missing strict inputs fail before any write. Reusing an operation ID
with a different normalized request conflicts;
using a new ID after an uncertain post-COMMIT error risks expressing a second
logical request. Retry/query only with the original ID.

The exact action strings are:

- **`retry`**: reset the named non-gate task to pending for another bounded
  attempt. It requires an integrity-bound `retry-diagnostic` report with
  controller-extracted `retry-recommended`; the stored receipt truthfully marks
  this conservative evidence `authenticated=false`.
- **`continue`**: accept explicitly named assertion risks with `accepted_risks`
  (or `targets`) and a non-empty reason. It requires a controller-authenticated
  `independent-risk-approval`; a caller-authored PASS/authorized/producer string
  can never authorize risk acceptance.
- **`patch`**: **unavailable in strict transactions** and always rejected with
  `PATCH_TRANSACTION_UNAVAILABLE`/422. Contract/plan/contract-Markdown are not
  transactional outputs in this version, so no official workflow may advertise
  or attempt patch mutation.
- **`abort`**: terminate ledger state unsuccessfully with a non-empty reason. If
  any item aborts, every decision in that batch must use `abort`. It requires an
  integrity-bound `abort-rationale` report with `abort-recommended`. The public
  `abort` alias accepts only this same fully strict batch; legacy reason-only
  abort and its independent flat-file writer are disabled.

If a user decision, authenticated approval, or exact evidence binding is
missing, leave attention open and ask the user; there is no `user-input` action.
Never omit an open attention ID, submit one twice, automatically continue after
a validator rejection, mix `abort` with another action, or server-fill a
snapshot that the caller did not review.

## Stopping rules

Stop dispatching and surface attention when:

- authorization, credentials, product intent, or required infrastructure is missing;
- the next action is destructive, privileged, financially consequential, production-facing, or otherwise outside the charter;
- writers would overlap unsafe shared terrain;
- repeated failure shows the current plan is invalid;
- a validator finds a material defect or evidence is stale;
- a mission budget, retry limit, iteration limit, or explicit stopping condition is reached;
- ledger state is damaged or a running child has uncertain side effects.

`close` means successful, evidence-gated completion. `abort` means intentional unsuccessful termination with a reason. Neither stopping work nor a worker saying “done” is closure.

## Honest limitations

- Zenith provides durable local coordination, not distributed transactions or exactly-once external side effects.
- Child path boundaries and read-only instructions are policies, not OS sandboxes.
- Daemon workers and kernels normally have the user's operating-system permissions.
- The ledger persists mission state, not arbitrary external service state or every process spawned by a child.
- Detach/resume depends on the local Prime daemon and persisted session artifacts remaining available.
- A validator is independent in context and role, not necessarily in machine, credentials, model provider, or repository checkout.
- Concurrency in one shared worktree can still conflict; the DAG must serialize shared writers.
- Human approval remains necessary where project policy, safety, or unavailable evidence requires it.
- Strict ledger transactions retain and revalidate trusted-parent, mission-root, lock, metadata, state, receipt, and evidence descriptors; reject unsafe owners/modes/ACLs, links and directory swaps; and refuse unsupported storage. These controls still cannot sandbox or defeat a malicious same-user process with authority over the backing directories. Admission handles and IDs are correlation data, not authentication.
- Multi-file decision atomicity is logical and recoverable only for conforming Zenith readers, all of which take the mission lock and recover first. Raw filesystem readers can observe a transient post-COMMIT installation mixture and are unsupported.
- Strict decisions are admitted only on the filesystem profiles listed in `references/api.md`. Transaction metadata is closed and quota-bounded; archives and receipts are not automatically garbage-collected.

# Python API Reference

Prime exposes this Python-backed skill as the pre-imported callable module `zenith`. Direct methods return JSON-serializable dictionaries. Most successful mission operations return an envelope containing `ok`, `action`, `mission_id`, `state`, and `revision`; strict `decide` and strict `abort` instead return the complete durable `DecideReceiptV1`, whose nested `response` is the stable logical envelope. Invalid input or an invalid transition raises `zenith.ZenithError`.

Use the same absolute workspace path in every call. IDs must begin with an alphanumeric character, contain only letters, numbers, `.`, `_`, or `-`, and be at most 128 characters.

## Root lifecycle

### `await zenith.start(...)`

```python
await zenith.start(
    brief: str,
    workspace: str = ".",
    concurrency: int | str = 3,
    min_concurrency: int = 1,
    max_concurrency: int | None = None,
    model: str | None = None,
    validator_model: str | None = None,
    reviewer_model: str | None = None,
    persistent: bool = False,
    heartbeat_interval: str = "5m",
    require_preflight: bool = True,
    create_goal: bool = False,
) -> dict[str, object]
```

Creates only the root-owned planning skeleton and returns paths to its ledger and brief. It does **not** admit a planner or any other child. An integer `concurrency` selects a fixed slot budget from `1..32`. Exact `"auto"` selects deterministic demand autoscaling bounded by `min_concurrency` and `max_concurrency` (default maximum 8); it does not inspect host CPU, memory, or provider quota. Model overrides select work, validator, and terminal-review children. `require_preflight=True` is recorded by default. `persistent=True` also calls `ensure_continuity`; it creates a heartbeat but no goal unless the caller separately opts in with `create_goal=True`.

Investigate the repository, write the charter, and adversarially review the contract before submitting a plan. Put the durable mission summary—objective, scope, non-goals, baseline, constraints, hazards, evidence expectations, and stopping conditions—in `brief` or the optional `mission` text passed to `submit_plan`.

### `zenith.submit_plan(...)`

```python
zenith.submit_plan(
    mission_id: str,
    contract: object,
    tasks: object,
    workspace: str = ".",
    mission: str = "",
) -> dict[str, object]
```

Validates and submits the initial contract and DAG, then changes `planning` to `running`. When preflight is required, it discovers and validates immutable planning-phase review results, requires the latest result to be passing with a nonblank report and evidence, and persists the accepted preflight summary. No result, a malformed result, or a latest failed result blocks submission. Only `start(require_preflight=False)` explicitly waives this gate. An identical repeat is idempotent; a different submission is rejected after planning.

Contract schema:

```python
contract = {
    "assertions": [
        {
            "id": "upload-resume",
            "description": "An interrupted upload resumes without retransmitting confirmed bytes.",
            "required_evidence": ["focused-test", "diff-inspection"],
        }
    ]
}
```

Task schema:

```python
tasks = [
    {
        "id": "implement-resume",
        "role": "work",
        "targets": ["upload-resume"],
        "depends_on": [],
        "description": "Implement the bounded change and focused tests.",
        "allowed_paths": ["src/upload/", "tests/upload/"],
        "concurrency_cost": 2,
        "priority": 10,
        "exclusive": False,
    },
    {
        "id": "validate-resume",
        "role": "validate",
        "targets": ["upload-resume"],
        "depends_on": ["implement-resume"],
        "description": "Read-only independent validation with fresh evidence.",
        "read_only": True,
    },
    {
        "id": "gate-resume",
        "role": "gate",
        "targets": ["upload-resume"],
        "depends_on": ["validate-resume"],
        "description": "Declarative AND gate after all validators.",
    },
]
```

Roles are exactly `work`, `validate`, and `gate`. A work task cannot be declared read-only. Validators cannot set `read_only=False` or `write=True` and are normalized to `read_only=True`. A gate is declarative and cannot carry `model`, `write`, `instructions`, or `read_only` fields. Plan validation requires:

- a non-empty `contract.assertions` list, non-empty `required_evidence` for every assertion, and a non-empty task list;
- unique known IDs and an acyclic dependency graph;
- exactly one work owner for each assertion;
- at least one downstream validator for each assertion; and
- at least one gate for each assertion, downstream of all its validators.

A `work` task may use `targets=[]` for targetless scaffolding or support work; `validate` and `gate` tasks require non-empty targets. Spawned tasks accept scheduling hints: `concurrency_cost` (`1..32`, default 1), `priority` (`-100..100`, higher first, task ID breaks ties), and `exclusive` (default false). An exclusive ready task forms a drain barrier and is admitted alone. Gates reject scheduling hints because they consume no child capacity. Additional JSON fields such as `allowed_paths`, `acceptance`, and `hazards` are preserved and included in worker prompts, but they are instructions rather than OS enforcement.

### `zenith.list_missions(...)`

```python
zenith.list_missions(workspace: str = ".") -> dict[str, object]
```

Returns workspace mission summaries newest-first. A damaged mission is listed with state `corrupt` and an error instead of being silently ignored.

### `zenith.inspect(...)`

```python
zenith.inspect(mission_id: str = "", workspace: str = ".") -> dict[str, object]
```

Returns the authoritative mission projection, open attention, and ledger path without advancing execution. When `mission_id` is empty, it selects the most recently updated healthy mission. Pass an ID explicitly during orchestration to avoid ambiguity.

### `await zenith.advance(...)`

```python
await zenith.advance(
    mission_id: str,
    workspace: str = ".",
    dispatch: bool = True,
) -> dict[str, object]
```

Performs one bounded tick. It reconciles immutable handoffs against Prime's retained direct-child registry, ingests results, updates gates/assertions/attention, and best-effort deletes only completed children whose handoffs are durable. With the default `dispatch=True`, it also admits dependency-ready `work` or `validate` tasks up to the concurrency ceiling. `dispatch=False` remains available for an explicitly reconciliation-only call and never admits ready work; autonomous Zenith follow-ups use the normal bounded tick so a healthy mission cannot stall between DAG layers.

The response includes `ingested`, `dispatched`, `deleted_children`, and `warnings`. Every `dispatched` entry contains `task_id`, `attempt_id`, and the RLM admission `handle`. After an admission returns, Zenith commits it only if the same attempt is still the active reserved generation; otherwise it immediately best-effort deletes the late handle. If `dispatched` is non-empty, end the assistant turn. Do not wait or poll. Persisted task and terminal-review results are schema-, role-, identity-, type-, and evidence-checked before aggregate state changes; malformed or symlinked results open attention rather than passing or crashing the tick. Handles and attempt IDs correlate lifecycle state; they do not authenticate a caller against another process running with the same OS permissions.

Task prompts include the bounded charter, task specification, assertion policy, and only the latest three compact attempt summaries. Each section has a hard character ceiling so repeated large reports or evidence cannot grow child context without bound; durable workspace artifacts remain available for targeted inspection.

When a terminal-review handoff is ingested successfully, `advance` moves the mission to `done` and automatically finalizes continuity for a persistent mission.

### `await zenith.set_concurrency(...)`

```python
await zenith.set_concurrency(
    mission_id: str,
    concurrency: int | str,
    workspace: str = ".",
    min_concurrency: int = 1,
    max_concurrency: int | None = None,
) -> dict[str, object]
```

Changes the durable policy at runtime. Integers select fixed capacity; exact `"auto"` selects demand-based scaling within the supplied bounds. Policy changes never cancel, delete, or supersede healthy admitted children. Scaling below current active cost sets `scale_down_pending=true` and drains naturally; no new work is admitted until capacity is available. A requested maximum below any individual active or pending task cost is rejected rather than leaving that task permanently unrunnable. Repeating the same policy is idempotent and creates no duplicate event. `advance` returns the current policy, effective capacity, active cost, and drain state.

Auto demand is the weighted sum of active reservations and dependency-ready tasks, clamped to the configured bounds. This is task-aware local scheduling, not measurement of system load or Prime-wide capacity. Admission rejection by the host still becomes attention.

### `zenith.get_decide_preconditions(...)`

```python
zenith.get_decide_preconditions(
    mission_id: str,
    workspace: str = ".",
) -> dict[str, object]
```

This read-only convenience helper acquires the mission lock, completes any
recoverable committed transaction, and returns `revision` plus `file_hashes` for
these exact raw-byte inputs:

- `mission.json`
- `attention.json`
- `decisions.json`
- `events.json`
- `contract.json`
- `plan.json`
- `mission.md`

Every digest has the form `sha256:` followed by 64 lowercase hexadecimal
characters. The bytes are not reserialized or normalized. A client must retain
the snapshot it actually reviewed; `decide` never fills missing preconditions
from a newer server snapshot.

### `await zenith.decide(...)`

```python
await zenith.decide(
    mission_id: str,
    decisions: object,
    workspace: str = ".",
    *,
    expected_revision: int | None = None,
    expected_file_hashes: Mapping[str, str] | None = None,
    evidence_manifest: EvidenceManifestV1 | None = None,
    operation_id: str | None = None,
) -> DecideReceiptV1
```

The four additions are keyword-only. Their `None` defaults preserve old Python
argument binding only: an old state-changing call now fails before the lock or
any write with typed `ZenithError(code="PRECONDITION_REQUIRED",
http_status=428)`. There is no legacy mutation bypass.

`expected_revision` is a non-negative integer. `expected_file_hashes` must have
exactly the seven keys returned by `get_decide_preconditions`. `operation_id`
must be a canonical lowercase RFC 4122 UUIDv4. The normalized request digest
binds the mission ID, operation ID, revision, exact hash object, complete
normalized actions (including exact attention/task IDs), and complete validated
evidence manifest.

Under the mission lock, Zenith recovers first and checks the durable receipt
before comparing preconditions. The initial success and every exact replay
return the same complete immutable `DecideReceiptV1` retained at
`.zenith-decide/receipts/<operation_id>.json`; its `response` member is the
stable logical mission envelope. The receipt binds the operation/request
digests, before/after revisions and hashes, accepted evidence, journal digest,
COMMIT binding, its own logical-body digest/mode/size identity, and a stable
idempotency result. Therefore:

- same operation ID + same request digest returns the original stable receipt;
- same operation ID + different request digest fails with
  `IDEMPOTENCY_CONFLICT`/409 and does not mutate state;
- a stale revision or any raw hash mismatch fails with
  `PRECONDITION_FAILED`/412 and does not mutate state;
- invalid evidence fails with `INVALID_EVIDENCE`/422; and
- corrupt or irreconcilable transaction state fails closed with
  `RECOVERY_BLOCKED`/503.

`decisions` must cover every open attention ID exactly once. Strict mode
supports `retry`, `continue`, and `abort`. **`patch` currently fails closed**
with `PATCH_TRANSACTION_UNAVAILABLE`/422: contract, plan, and per-assertion
contract Markdown are not yet complete bounded transaction outputs, so Zenith
will not partially persist a patch.

#### Evidence manifest v1

The manifest is a bounded, duplicate-free, NFC, closed JSON object. Every
nested object rejects unknown fields. A representative action entry is:

```json
{
  "schema": "zenith.decide.evidence/v1",
  "mission_id": "exact-mission-id",
  "operation_id": "lowercase-uuid-v4",
  "base_revision": 12,
  "base_snapshot_sha256": "sha256:<JCS digest of the seven-key hash object>",
  "action_evidence": [
    {
      "action_sha256": "sha256:<JCS digest of the normalized action>",
      "target_id": "exact-open-attention-id",
      "target_type": "attention",
      "subject": {
        "code_sha256": "sha256:<exact code digest>",
        "build_sha256": "sha256:<exact build digest>",
        "config_sha256": "sha256:<exact config digest>"
      },
      "subject_sha256": "sha256:<JCS digest of subject>",
      "artifacts": [
        {
          "kind": "retry-diagnostic",
          "media_type": "application/json",
          "path": "preflight-artifacts/retry-report.json",
          "report_schema": "zenith.evidence.retry-diagnostic/v2",
          "sha256": "sha256:<raw artifact bytes>",
          "size": 123,
          "validator_id": "zenith.retry-diagnostic/v1",
          "mode": "0400",
          "identity": {
            "device": 1, "inode": 2, "uid": 1000, "gid": 1000, "nlink": 1
          }
        }
      ]
    }
  ]
}
```

`action_evidence` is a bijection with requested actions. Each artifact report
binds its exact schema/result, raw digest, size, mode, owner/group/inode/link
identity, exact operation ID, code/build/config subject, seven-file base snapshot,
normalized action, and the complete controller-extracted attention binding (kind,
task/assertion, and targets). These operation-bound policy reports use
`zenith.evidence.retry-diagnostic/v2`,
`zenith.evidence.abort-rationale/v2`, or
`zenith.evidence.independent-risk-approval/v2`; operation-unbound v1 report
bytes are rejected. Paths are NFC mission-relative POSIX paths beneath
`preflight-artifacts/` or `evidence/`; absolute paths, dot components, symlinks,
hard links, devices/FIFOs/sockets, writable files, ACLs, alternate spellings,
unknown schemas/validators, and oversized/deep documents are rejected. Reports
are re-opened and rehashed immediately before COMMIT. Zenith never executes an
artifact command, plugin, or script under the mission lock.

The controller-owned action policy is closed:

- `retry` accepts exactly `retry-diagnostic` /
  `zenith.retry-diagnostic/v1` with extracted result `retry-recommended` and
  records `authenticated=false`;
- `abort` accepts exactly `abort-rationale` / `zenith.abort-rationale/v1` with
  result `abort-recommended` and records `authenticated=false`;
- `continue` accepts only `independent-risk-approval` /
  `zenith.independent-risk-approval/v1` with result `risk-accepted` and a valid
  controller-authenticated provenance receipt.

The first two are deliberately narrow conservative transitions for which an
integrity-bound caller-authored report is admitted honestly as unauthenticated.
Risk acceptance is not conservative and never trusts caller strings such as
`producer`, `authorized`, `independent`, or `PASS`. It requires an absolute,
controller-configured `ZENITH_EVIDENCE_TRUST_ROOT_FILE`. Zenith opens `/` as a
retained trusted anchor, then opens and retains every directory and the final key
component with dirfd-relative `O_NOFOLLOW`; every parent is rechecked for
root/controller ownership, non-writable mode, directory type, ACL absence, and
entry identity after the bounded key read. The final key must remain the same
controller-owned, singly linked, mode-0400 regular file across pre/post `fstat`
and final-entry comparison.

The descriptor-bound read-only `terminal-reviews/`
`zenith.evidence.provenance-receipt/v2` HMAC receipt binds the exact operation
ID, reviewer ID, artifact/action/subject digests, exact
target, extracted result, and canonical whole-second UTC `issued_at`. Initial
admission accepts at most 300 seconds of age and 30 seconds of future clock skew.
A different operation ID, stale receipt, future receipt, missing trust root, or
changed parent/file chain fails with `INVALID_EVIDENCE`/422. After COMMIT, an
exact request replay for the same operation ID returns its already validated
durable `DecideReceiptV1` without reapplying freshness to external evidence.

#### Recoverable logical transaction

A successful non-patch decision prepares immutable full postimages for
`attention.json`, `decisions.json`, `events.json`, `mission.md`, `mission.json`,
and the permanent operation receipt. Transaction/metadata directories are exact
mode 0700; live/staged state and `journal.json` are exact mode 0600; permanent
and staged receipts, reservations, COMMIT, and APPLIED are exact mode 0400. A
reservation is never written at its final `.reserve` name: a bounded exact-name
temporary is exclusively created mode 0600, fully written, file-fsynced,
content/identity validated, finalized and file-fsynced mode 0400, then published
with `renameat2(RENAME_NOREPLACE)` and a directory fsync. With no active
transaction, recovery durably removes zero-byte, partial, fully written, or
finalized temporaries without parsing them; a final-name collision or any unsafe
cleanup ambiguity fails closed. It fsyncs each staged file and directory, then
creates/fsyncs COMMIT and fsyncs the active transaction directory. The
durable directory fsync containing COMMIT is the normal logical linearization
point. Recovery installs fixed postimages in the documented order, with
`mission.json` (the revision sentinel) last, publishes the mode-0400 receipt,
creates APPLIED, and archives the transaction. It never reruns decision logic or
regenerates timestamps. APPLIED is terminal and verify-only: if APPLIED already
exists, recovery must find every exact live postimage and the exact permanent
receipt and may only archive; it never repairs a missing receipt, preimage, mode,
or other impossible terminal state.

Strict transaction access is admitted only on Linux ext2/3/4, XFS, btrfs,
tmpfs, and overlayfs profiles with `flock`, `O_NOFOLLOW`, retained directory
file descriptors, `renameat2(RENAME_NOREPLACE)`, and directory fsync available.
NFS, SMB/CIFS, FUSE, AFS, 9p, Ceph, OCFS, GFS, eCryptfs, and unknown filesystem
magic values fail with `UNSUPPORTED_STORAGE`/503. Strict metadata is bounded to
4,096 archived operations and 256 MiB; admission fails before preparation when
that closed quota would be exceeded. This version does not garbage-collect
receipts or archives automatically.

POSIX does not make the five flat-file renames atomic as a set. The guarantee is
recoverable logical atomicity for conforming Zenith APIs: every authoritative
mission reader/mutator acquires `.lock` and invokes recovery before loading
state. Unsupported raw filesystem readers can observe a transient mixture after
COMMIT and before recovery completes. A live target that matches neither its
recorded preimage nor postimage, a missing/corrupt committed postimage, a
conflicting receipt, or a changed read-only contract/plan input blocks all
conforming access pending explicit repair.

The transaction performs no external side effects. In particular an `abort`
action changes only mission ledger state; continuity cleanup is not performed
inside strict `decide` and must be handled separately. Success preserves the
existing revision rule: exactly one revision increment.

### `await zenith.close(...)`

```python
await zenith.close(mission_id: str, workspace: str = ".") -> dict[str, object]
```

Performs no `advance` and never dispatches plan work. It strictly checks the current durable state. If state is `ready_for_review`, it admits one independent terminal reviewer, changes state to `reviewing`, and returns its attempt/handle. The reviewer handle is committed only while that exact reservation remains active; a late handle after abort or another invalidating transition is deleted. This is admission, not completion: end the turn.

The terminal-review result is later ingested by `advance`. A pass changes state to `done`; a failure opens attention. Calling `close` while `reviewing` returns the current review without admitting a duplicate. Calling it after `done` is idempotent.

### `await zenith.abort(...)`

```python
await zenith.abort(
    mission_id: str,
    reason: str = "",
    workspace: str = ".",
    *,
    decisions: object | None = None,
    expected_revision: int | None = None,
    expected_file_hashes: Mapping[str, str] | None = None,
    evidence_manifest: EvidenceManifestV1 | None = None,
    operation_id: str | None = None,
) -> DecideReceiptV1
```

This is only a compatibility alias for the strict transaction route. Every
normalized decision must be `action="abort"`, cover every open attention item,
and carry the same four strict inputs and action-specific evidence required by
`decide`. A non-empty legacy `reason` is rejected with
`LEGACY_ABORT_UNAVAILABLE`/428; there is no reason-only write path. Transactional
abort changes only ledger state and returns/replays its durable receipt. It does
not stop children, clean continuity resources, or complete/clear a goal inline;
perform separately authorized cleanup after the committed ledger transition.

## Child handoffs

### `await zenith.end_task(...)`

```python
await zenith.end_task(
    mission_id: str,
    task_id: str,
    attempt_id: str,
    done: bool,
    passed: bool,
    report: str,
    verdicts: object = None,
    evidence: object = None,
    request_attention: bool = False,
    workspace: str = ".",
) -> dict[str, object]
```

Writes one immutable result for the attempt named in the child prompt, then sends the parent a best-effort wake-up message. A repeated identical result is idempotent; conflicting reuse is rejected. `report` is required.

A `work` task must not submit assertion verdicts. Its green commands remain claims. A `validate` task is read-only, must submit non-empty evidence, and must map every target assertion exactly once to `passed` or `failed`. `passed` on the call says the task ran reliably; assertion verdicts independently determine the gate. Set `request_attention=True` when the root must review a non-terminal concern.

```python
await zenith.end_task(
    mission_id="mission-id",
    task_id="validate-resume",
    attempt_id="a0001",
    done=True,
    passed=True,
    report="Fresh validation ran reliably; the target assertion passed.",
    verdicts={"upload-resume": "passed"},
    evidence=[
        {
            "kind": "focused-test",
            "command": "project-native validator command",
            "exit_code": 0,
            "summary": "Fresh interruption and boundary cases passed.",
        }
    ],
    workspace="/absolute/path/to/repository",
)
```

The result becomes aggregate mission state only on a later root `advance`. `agent_message` is wake-up only.

### `await zenith.end_review(...)`

```python
await zenith.end_review(
    mission_id: str,
    attempt_id: str,
    passed: bool,
    report: str,
    gaps: object = None,
    evidence: object = None,
    workspace: str = ".",
) -> dict[str, object]
```

Writes one immutable review result and sends a best-effort wake-up. It requires a non-empty report and non-empty evidence; `passed=False` also requires at least one explicit item in `gaps`.

- During `planning`, a root-selected, previously unknown attempt ID is accepted as `phase="preflight"`. This is the supported structured handoff for root-spawned read-only contract critics. It is stored at `terminal-reviews/<attempt-id>/result.json`, does not mutate aggregate mission state, and must be read/incorporated by the root before `submit_plan`.
- During terminal `reviewing`, the attempt ID must match the attempt admitted by `close`; the result records `phase="terminal"`. The reviewer is read-only and must not read or rely on `.prime/agent/zenith`; `gaps` records final risks. A later `advance` ingests it.

Outside `planning`, an unknown review attempt is rejected. In both phases, `agent_message` is only wake-up transport.

## Continuity

### `await zenith.ensure_continuity(...)`

```python
await zenith.ensure_continuity(
    mission_id: str,
    workspace: str = ".",
    heartbeat_interval: str = "5m",
    create_goal: bool = False,
) -> dict[str, object]
```

Idempotently attempts to create a labeled RLM heartbeat. A mission-owned goal is created only when `create_goal=True` is explicitly requested. A stale `setting_up` reservation is recovered instead of blocking forever. The heartbeat always uses `delivery_mode="follow_up"` and its instruction is limited to one bounded advancement (plus closure only when that tick is ready); it never makes attention decisions or accepts risk. Conflicts or unavailable surfaces become recorded warnings, not fabricated continuity. It never alters the user's `/heartbeat`.

### `await zenith.finalize_continuity(...)`

```python
await zenith.finalize_continuity(
    mission_id: str,
    workspace: str = ".",
    complete_goal: bool = True,
) -> dict[str, object]
```

Idempotently removes the recorded mission heartbeat. A failed deletion preserves the heartbeat ID and `finalized=False`, so a later call retries it. With `complete_goal=True`, it completes only the current goal whose ID or exact objective still matches the mission-owned goal. Use `False` after abort or another unsuccessful stop; if the owned goal remains active, the result requires `/goal clear` and remains unfinalized. Successful persistent completion attempts cleanup automatically. Strict transactional abort deliberately has no external side effects, so its caller must invoke this helper separately after the receipt is durable.

## Callable `run` dispatcher

```python
await zenith.run(
    brief: str = "",
    workspace: str = ".",
    action: str = "start",
    mission_id: str = "",
    input_path: str = "",
    concurrency: int | str = 3,
    min_concurrency: int = 1,
    max_concurrency: int | None = None,
    persistent: bool = True,
    heartbeat_interval: str = "5m",
    model: str = "",
    require_preflight: bool = True,
    create_goal: bool = False,
) -> str
```

The module is callable through the Python-skill convention, so `await zenith(...)` is equivalent to `await zenith.run(...)`. Unlike direct methods, `run` returns a formatted **JSON string** and converts exceptions into `{ok: false, error, error_type, code, http_status}` envelopes for typed `ZenithError`s.

Actions are:

```text
start, submit_plan, inspect, get_decide_preconditions, list, list_missions, advance, set_concurrency, decide, close, abort,
end_task, end_review, ensure_continuity, finalize_continuity
```

`submit_plan`, `set_concurrency`, `decide`, `abort`, `end_task`, and `end_review` take their JSON payload from the absolute `input_path`. A strict `decide` payload has exactly the top-level keys `decisions`, `expected_revision`, `expected_file_hashes`, `evidence_manifest`, and `operation_id`; strict `abort` has the same exact keyset and rejects non-abort actions. Missing or unknown keys are rejected rather than synthesized or discarded. Dispatcher input must be an absolute, controller-owned, singly linked, ACL-free, non-setid and non-group/world-writable regular file no larger than 512 KiB; it is opened without following symlinks and parsed as bounded strict JSON before materialization. A concurrency payload uses `{"concurrency":"auto","min_concurrency":2,"max_concurrency":8}` or `{"concurrency":4}`. `finalize_continuity` reads `input_path.complete_goal` when supplied. The direct methods are clearer for normal IPython orchestration.

## Trust boundary

Strict mission access retains checked descriptors for the trusted mission parent, exact mode-0700 mission root, exact mode-0600 singly linked lock inode, metadata tree, transaction directories, state files, receipts, and evidence components. It rejects symlink/hard-link replacement, unsafe owners/modes/ACLs, entry/inode swaps, unexpected names, and unsupported storage, and revalidates the authority before COMMIT and return. These controls close cooperating-client/crash and many path-race failures; they are not a sandbox or admission authentication and cannot defeat a malicious same-user process that can mutate the underlying directories between syscalls. Use trusted workers and an external sandbox or privileged single writer for hostile code.

## State vocabulary

Mission states:

```text
planning, running, attention_needed, ready_for_review, reviewing, done, aborted
```

Task statuses:

```text
pending, dispatching, running, cleared, failed, superseded
```

Assertion statuses:

```text
pending, passed, failed, accepted_risk
```

Use the public API for transitions. Do not hand-edit ledger JSON.

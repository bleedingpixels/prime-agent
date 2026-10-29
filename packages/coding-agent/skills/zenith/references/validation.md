# Evidence, Validation, and Closure

## Claims are not evidence

A worker can report a changed file, command, exit code, test count, or screenshot. That report is still a **claim**. A contract assertion passes only when a fresh validator independently examines the resulting workspace and records evidence with verifiable provenance.

This distinction applies even when:

- the implementation child says all tests passed;
- a command in worker output is green;
- the diff looks small;
- the builder also wrote the tests;
- the same model is used for worker and validator; or
- the root remembers seeing successful output earlier.

Do not copy a worker's verdict into a validator result.

## Evidence quality

Useful evidence is specific and reproducible:

- exact command or inspection performed;
- absolute or workspace-relative affected paths;
- exit status and bounded relevant output;
- test counts or named cases when available;
- environment and skipped capability constraints;
- the assertion ID the evidence supports;
- the task/review and plan revision that produced it;
- negative cases, not only the happy path;
- unresolved risks and baseline failures.

Weak evidence includes “looks good,” unbounded logs, an uncited screenshot, a builder-authored summary, or a command without exit status. Never store secrets or raw credential-bearing output.

Evidence is revision-sensitive. Any later change to an assertion's relevant terrain invalidates earlier validation unless a new validator confirms that the evidence remains applicable.

## Fresh validators

Create validator tasks in the DAG after their implementation dependencies. A validator should:

1. start from the charter, contract, implementation claims, current workspace, and baseline—not the builder's internal reasoning;
2. remain read-only;
3. inspect the actual diff and version-control state;
4. run project-native focused and regression checks independently;
5. test relevant failure and boundary cases;
6. determine whether changes exceeded allowed scope;
7. record a verdict for every assigned assertion through `await zenith.end_task(...)`;
8. record failed or blocked evidence honestly; and
9. avoid delegation.

A validator that fixes the implementation becomes a worker. Its old validation cannot be used for closure; schedule a new validator after the fix.

Example semantics (use the exact installed signature from [API Reference](api.md)):

```python
await zenith.end_task(
    mission_id="mission-id",
    task_id="validate-upload",
    attempt_id="attempt-id-from-child-prompt",
    done=True,
    passed=True,
    report="Fresh checks ran reliably; resume succeeds, but zero-byte compatibility fails.",
    verdicts=[
        {"assertion_id": "upload-resume", "status": "passed", "reason": "Fresh interruption cases passed."},
        {"assertion_id": "upload-compat", "status": "failed", "reason": "Zero-byte regression reproduced."},
    ],
    evidence=[
        {
            "kind": "regression-test",
            "command": "project-native compatibility command",
            "exit_code": 1,
            "summary": "Failure reproduced independently.",
        }
    ],
    workspace="/absolute/path/to/repository",
)
```

A validator rejection produces attention; it never counts as “mostly passed.” This version does not offer in-place strict patch/replan mutation.

## Independent terminal review

Every successful mission needs a final `terminal-review` role after all implementation and focused validation work. It is distinct from validators assigned to individual tasks.

The terminal reviewer receives the original brief and workspace but is forbidden to read or rely on `.prime/agent/zenith`. This prevents prior agent claims and verdicts from anchoring the final review. It independently checks:

- current version-control status and complete diff;
- delivered behavior against the original mission brief;
- project-mandated final checks in the project's native environment;
- negative cases, unsafe side effects, and unreviewed shared-file edits;
- pre-existing changes and baseline failures visible in the workspace;
- documentation, migration, cleanup, and generated-file obligations; and
- whether the delivered workspace has any gaps that prevent successful completion.

The root separately checks contract coverage, evidence provenance, task state, and attention in the ledger before admitting this reviewer.

Do not ask the last builder to perform terminal review. Do not turn an earlier focused validator into terminal review by renaming its result. If terminal review finds any material issue, leave attention open and follow the unavailable-patch policy below. Schedule a **new** terminal review only after genuinely retryable existing work or a separately authorized replacement mission has been freshly validated.

## Closure gate

The root may call `close` to start terminal review only when all of the following are true in the durable ledger:

- the mission has a final charter and plan revision;
- every active plan task and declarative gate is successfully terminal;
- no task child is running or awaiting an unrecorded result;
- no attention item is unresolved;
- every contract assertion is passed by its downstream validators, or an explicitly authorized risk decision is recorded;
- every assertion has non-empty independent validator evidence with valid provenance;
- the root has checked every contract-specific required evidence kind;
- required project-native verification completed successfully, or an authorized exception is explicit;
- baseline and unrelated user changes remain accurately separated; and
- no undisclosed security, destructive-action, or external-side-effect risk remains.

After a separate `advance` has reconciled state and reached readiness, `await zenith.close(...)` performs a strict state check without advancing or dispatching task work, admits the independent terminal reviewer, and returns in `reviewing`. End the turn. The reviewer records `await zenith.end_review(...)`; a later `advance` ingests that immutable result. Only a passing review of the final workspace moves the mission to `done`. A failed review opens attention. Retry an existing eligible task only when the failure is genuinely retryable; otherwise leave attention open or abort and create a separately authorized replacement mission. Strict patch/replan mutation is unavailable and must not be advertised or attempted. Any later closure attempt requires fresh validation and a new terminal review.

The API structurally enforces non-empty assertion `required_evidence` policies, non-empty validator and terminal-review evidence, DAG provenance, assertion verdicts, and clean attention. The specific evidence-kind strings remain contract policy rather than a built-in evidence-kind type system; the root and terminal reviewer must check their satisfaction explicitly. Never hand-edit the ledger or weaken an assertion merely to pass the gate.

## Closure report

A successful user report should include:

- mission ID and terminal status;
- objective and workspace;
- final plan revision;
- assertions passed, with concise evidence provenance;
- implementation summary and changed files;
- fresh validator commands/results;
- independent terminal-review verdict;
- baseline/unrelated changes;
- limitations or actions intentionally not taken; and
- how to inspect the retained ledger.

An aborted or blocked report must say it did **not** close successfully, give the exact reason and attention state, identify any partial changes or uncertain side effects, and state the next safe action.

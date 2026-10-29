# Continual Harness Refinement

Prime Agent's continual harness stores supplemental prompt notes, memories,
reusable skill descriptions, and reusable subagent specifications. Refinement
reviews the current conversation and makes small, evidence-backed changes to
that state. It never rewrites Prime Agent's base system prompt.

Refinement is useful when a lesson should affect later turns or future sessions,
rather than remain only in the conversation history.

## Ways Refinement Starts

Prime Agent has three refinement paths. They share the same planning and apply
pipeline, but have different triggers.

### User command

Run refinement directly from the prompt:

```text
/refine [instructions]
/refine --global [instructions]
/refine rollback <refinement-id>
/refine rollback <refinement-id> --global
```

Instructions focus the review but do not prescribe raw harness edits. For
example:

```text
/refine Record the validated release-check procedure for this session.
/refine --global Remember that I prefer absolute filesystem paths.
```

`/refine` is local to the current session by default. `--global` explicitly
targets state shared by future Prime Agent sessions.

### Agent-requested refinement

In a persisted root session, the model can schedule refinement from IPython with
the bundled `refine` skill:

```python
await refine.status()
await refine.run()
await refine.run("persist the validated debugging procedure")
await refine.run("persist this durable preference", global_=True)
```

`refine.run()` does not run refinement inside the active IPython cell. It returns
immediately and schedules the request for the end of the current turn. The model
should continue its work normally after calling it.

`refine.status()` reports:

- `pending`: an explicit request is queued for the current turn;
- `in_flight`: refinement is planning or applying.

One request per turn is sufficient. Calling `refine.run()` again before the turn
ends updates the pending request instead of queueing another refinement pass. An
explicit `refine.run()` request does not go through the auto-refine review gate.

### Automatic refinement

Automatic refinement is enabled by default for persisted root sessions. It is
not enabled for RLM child agents or sessions without a local session-artifact
store.

Prime Agent considers an automatic review at these checkpoints:

- after 25 successful, non-aborted assistant messages by default;
- after successful manual or automatic compaction by default.

A checkpoint does not unconditionally modify the harness. Prime Agent first uses
the selected model to run a review gate. The gate approves refinement only when
the trajectory contains evidence that will be useful in later session turns. It
should reject transient output, unsupported hypotheses, and one-off noise. If
the gate declines, no harness edits are made.

Automatic reviews have a 20-minute cooldown by default. Automatic refinement
targets local session state only. Use `/refine --global` or
`refine.run(..., global_=True)` separately when global persistence is justified.

Configure the behavior in the global or project `settings.json`:

```json
{
  "autoRefine": {
    "enabled": true,
    "turnInterval": 25,
    "compact": true,
    "cooldownMs": 1200000
  }
}
```

Set `autoRefine.enabled` to `false` to disable automatic reviews. This does not
disable manual `/refine` or explicit agent calls to `refine.run()`.

## What a Refinement Can Change

A proposal contains zero or more `create`, `update`, or `delete` edits for these
entry kinds:

| Kind | Use |
|---|---|
| Prompt note | A narrow behavioral policy that supplements the immutable base prompt. |
| Memory | A durable fact, decision, failure, preference, or validated outcome. |
| Skill description | A reusable Python call contract for a repeated procedure. |
| Subagent specification | A reusable delegation role, instructions, and invocation guidance. |

A continual-harness skill is a persisted description and call contract. It does
not install a Python package or add executable code. Use `skill-creator` when a
new packaged skill is required.

## Local and Global Scope

Local refinement is the default. Use it for:

- current-task progress and coordination;
- temporary blockers;
- project facts that are not clearly reusable across sessions;
- session-specific procedures or overrides.

Use global refinement only for:

- stable cross-session lessons;
- durable user preferences;
- reusable procedures or delegation roles;
- explicitly project-qualified facts likely to matter in future sessions for
  that project.

During local refinement, global entries are read-only context. The refiner
cannot update or delete them through a local proposal.

## Planning and Application

A normal refinement proceeds as follows:

1. Prime Agent loads the current local and global harness overview and recorded
   refinement history.
2. It gives the selected model the recent conversation trajectory, requested
   scope, and optional instructions.
3. The model returns a structured proposal containing create, update, or delete
   edits. It may return an empty edit list when no change is justified.
4. Planning may run in the background, but application waits until the agent is
   quiescent. Refinement does not abort the active turn.
5. Prime Agent reloads the target harness immediately before applying the plan.
   An entry changed concurrently since planning is rejected instead of being
   overwritten.
6. Valid edits and a refinement event are persisted. The active system prompt is
   rebuilt from the updated supplemental state, and the session reconnects.

In interactive sessions, model planning can overlap normal work while only the
short apply phase blocks the next turn. Serialized print or headless sessions
apply refinement at a quiescent boundary between turns so it cannot overlap the
primary model request.

## Rollback

Each applied refinement records before-and-after entry snapshots. Rollback
creates a new refinement that reverses the applied edits:

```text
/refine rollback refine_20260812031500000
```

Use the refinement ID shown in the harness overview or refinement result. Global
refinements have cross-session history; local refinements are rolled back through
the session's recorded history and harness location.

## When to Refine

Use refinement after evidence establishes a reusable improvement, such as:

- a repeated failure has a diagnosed prevention rule;
- a tactic or procedure has been validated and should be reused;
- a recurring delegation role should become a subagent specification;
- the user gives a durable preference or correction;
- an existing harness entry is wrong, obsolete, or harmful;
- a focused lesson should be persisted now instead of waiting for an automatic
  review.

Do not refine for transient command output, unverified guesses, or ordinary
conversation summarization. Use `/compact` to reduce conversation context. Keep
refinements small: update the narrowest relevant memory, skill description,
prompt note, or subagent specification instead of rewriting the whole harness.

For mutable mission status or detailed task tracking, use session artifacts or
normal project files rather than durable global harness entries.

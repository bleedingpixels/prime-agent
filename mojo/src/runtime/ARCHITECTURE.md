# Native actor runtime

## Scope and source boundary

This runtime supplies in-process ownership, behavior scheduling, actor mailboxes,
and lifecycle operations for the Mojo agent harness. Provider protocols, tool
execution, session persistence, and user interfaces belong to separate modules.

The product reference is Prime Agent Rust v0.10.0, commit
`d592d5e7746408fe9097541af96d3239e263f7a1`. The checked-out TypeScript project is
historical and is not the current parity target. Relevant Rust contracts are
`crates/pa-core/src/session_engine/agent_messaging.rs` and
`crates/pa-types/src/daemon/agent_roster.rs`.

This first slice is not a claim of complete upstream parity. In particular,
daemon protocol compatibility, persisted family routing, token-bucket message
rate limits, process isolation, and forced interruption of a running native
callback require separate implementations and evidence.

## Ownership and scheduling seam

A scheduler owns resource state. A behavior declares its complete resource set
before admission. During execution, only an acquired behavior may read or
replace those values; the controlling caller may inspect or replace them while
the scheduler is idle.
Behaviors with overlapping resource sets preserve submission order; independent
behaviors may execute concurrently. No application-global mutable state is
needed for actor identities, mailboxes, or task state.

The deterministic seam is a submitted behavior plus its resource set, payload,
and callback. `step()` executes a reproducible transition. The native worker
path executes a batch of nonconflicting behaviors and joins their completion
before the scheduler changes ownership bookkeeping. Tests supply schedules and
assert state and mailbox effects rather than using elapsed time as readiness.

Agent conversation state belongs in a scheduler-owned resource. Harness code
must submit the actual model-turn or tool-result transition against that
resource; storing a conversation elsewhere and scheduling only an actor label
would not establish ownership of agent execution.

## Architecture alternatives

The team considered importing the complete Aethon BoC runtime, implementing an
independent scheduler, and adapting its pure admission planner to native agent
callbacks. The selected boundary reuses the donor's `identity.mojo` and
`schedule_plan.mojo`. The planner constructs logical requests, deduplicates and
orders physical cown requests, preserves their argument mapping, and accounts
for the phase-two hold. The native adapter supplies resource storage, conflict
selection, callback dispatch, and worker completion.

A complete import would carry language-runtime arenas, execution records,
replay formats, and production-body dependencies into the agent harness. An
independent scheduler alone would not meet the requested implementation reuse.
This extraction retains the existing admission algorithm while allowing
independently owned agent state and native callbacks. It is not the complete
Aethon runtime or its lock-free scheduling protocol. Exact source hashes,
adaptations, and license provenance belong in the vendor directory.

## Verification and limits

The required invariants are conflict exclusion, submission-order preservation,
foreign-resource rejection, scoped resource access, bounded FIFO mailboxes,
terminal-state consistency, and scheduler recovery after callback failure.
Focused native tests must demonstrate both deterministic behavior and execution
on the native concurrency boundary. Mutation evidence must show an invariant
test failing when the corresponding production guard is removed.

The native adapter currently targets 64-bit Linux pthreads. Its private aligned
mutex and condition buffers, thread handle representation, and C entrypoint
have been exercised on that platform; other platforms require ABI validation
or a platform adapter. With multiple workers, each selected batch creates and
joins its worker threads. A single worker executes queued behaviors directly.
The parallel path supplies concurrency but is not a persistent thread pool.

The scheduler is controlled by one caller. A callback must finish all accesses
through its acquisition before returning, and must not share that acquisition
with another thread or mutate aliased state outside its declared cowns. The
runtime rejects an escaped acquisition after its lease expires; this is a
trusted-callback contract, not a sandbox for arbitrary unsafe native code.
Resource reads return copies, which can be expensive for large histories.

Callback failure expires the acquisition and releases the batch. Changes made
before an error remain visible, independently selected callbacks may already
have completed, and later queued work remains available. This is recovery of
ownership and scheduling, without transactional rollback. Cancellation is a
cooperative actor-state transition; it cannot interrupt an executing callback.

Performance measurements are serialized by the parent task after integration.
Parallel execution capability alone does not establish a throughput improvement.

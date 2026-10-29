# Validation receipt

Date: 2026-10-13 UTC. Source reference: Prime Agent Rust `d592d5e7746408fe9097541af96d3239e263f7a1`. Work branch: `codex/mojo-boc-agent`. Toolchain: Mojo `1.2.0.dev2026100305` (`4ad841b8`), Linux x86-64, `-O3 --Werror`, system libcurl.

## Scope and implementation

The native executable implements the harness/CLI subset documented in the README. It does not delegate agent execution to Rust, Python or TypeScript. Three Astra leads coordinated six GPT-6.1 Sol High workers across runtime, harness and interfaces. Integration and measurement followed those disjoint implementation tasks.

BoC reuse is concrete: the existing `identity.mojo` and `schedule_plan.mojo` from `aethon-boc-runtime` commit `6090dc8f7bd5514b64fde89c8367a06a6a1cca4b` provide identity and admission planning. Every admitted behavior uses the donor planner and hold-accounting oracle. `vendor/boc/PROVENANCE.md` records original/adapted hashes and compiler changes. The adapter and pthread dispatcher are new; the donor interpreter arena and lock-free runtime are not ported wholesale.

## Correctness evidence

`make -C mojo test` passed ten native test programs and the composed CLI checks, including the final lifecycle repairs. The provider test required host permission for ephemeral loopback sockets; the first sandboxed run failed at socket creation. No external model API or credential was used. The successful final complete log is `/tmp/prime-mojo-native-suite-final.log`.

| Area | Verified behavior |
| --- | --- |
| BoC runtime | Resource deduplication, forged identity rejection, acquisition lifetime, callback failure, ordered conflicts and simultaneous disjoint workers using a barrier |
| Actors | Bounded mailboxes, parent/child relationships, terminal state, cancellation and identity isolation |
| Harness | Typed messages, token accounting, provider turns, stale/duplicate result rejection, all tool-result completion orders, budgets and failure transitions |
| Sessions | Actor-owned turn state, family joins/cancellation, failure isolation and transcript restoration |
| Interfaces | Strict JSON/Unicode/limits, argument rejection, local HTTP status/body limits, tool permissions/path restrictions, atomic file replacement and transcript validation |
| Composed CLI | Actual write/edit/read/shell effects, save/resume, denied tools, turn exhaustion, actor spawn/message/wait/cancel, failed child provider and successive interactive prompts |

Runtime/harness checks also ran repeated schedules with multiple deterministic order seeds and worker counts. Timing was not used as a readiness signal. Workers performed targeted mutation checks for ownership, mailbox capacity, ordered tool results, cancellation, cached usage, JSON validation, permissions and provider status handling.

The composed CLI mutation check rebuilt an isolated source copy with edit writing back the original content. The maintained CLI script failed at the observable file-content assertion (`original` versus `changed`), exit 1. Production source was not mutated. Evidence: `/tmp/prime-mojo-cli-mutation-result.log`.

Final review found two additional lifecycle defects. Child turn-budget exhaustion escaped into the parent loop; it now settles the child and returns an error through `wait_agent`. Interactive prompts retained completed actor trees; prompt cleanup now releases the tree while preserving the transcript. Both maintained regressions failed against the original implementation and passed after repair. The interactive regression processes 129 prompts and verifies 258 saved messages. The native session suite also passed order seeds 1, 7 and 29 with 1, 2 and 4 workers. Root budget exhaustion still returns a nonzero exit status.

## Serial scheduler measurement

`make -C mojo benchmark` builds an isolated baseline by applying `benchmarks/serial-baseline.patch`, then builds the current candidate. The baseline is this port immediately before the one-worker fast path. It is not Rust Prime Agent and not the full donor runtime. The patch changes only that path; both executables use the same compiler options, workload and checked state.

Each sample submits 256 jobs over 16 cowns, repeated 256 times: 65,536 increments. Every cown value, completed count and aggregate checksum is checked. Five pairs ran sequentially with alternating AB/BA order. Admission, execution and total workload time use the native monotonic clock; build time and process launch are outside those timers. Raw JSON, shell CPU timings, binaries, source hashes and host metadata are retained in `build/evidence/scheduler.JvVu21Qe/`.

| Phase | Baseline median (range) | Candidate median (range) |
| --- | --- | --- |
| Scheduler execution | 1.064205 s (0.957577–1.863560) | 0.006145 s (0.006092–0.006359) |
| Admission | 0.020588 s (0.020019–0.030420) | 0.019318 s (0.018911–0.019667) |
| Total checked workload | 1.085111 s (0.978475–1.894469) | 0.025558 s (0.025201–0.026178) |

Ratios of medians: 173.2× for execution and 42.5× for the total workload in this run. The removed cost is per-behavior pthread creation and conflict-batch selection when only one worker is requested; the new path calls the same checked `step()` operation directly. The large ratio reflects an inefficient initial adapter path. This is not an application throughput, provider latency, multi-worker scaling or Rust comparison claim. This shared 16-CPU host showed material baseline variance; raw ranges are part of the result. An earlier five-pair run measured 159.7× execution improvement, consistent with the direction but not a fixed performance guarantee.

Remaining performance costs include copied actor snapshots, queue removal, synchronous CLI effects and creating pthread workers for each parallel batch. No persistent worker-pool or full-agent throughput claim is made.

## Repository gates and limits

`npm run check` exited 1, including the final rerun. Biome inspected the original 877 files without applying changes, then the existing repository test-policy gate failed on TypeScript/Python tests outside `mojo/` (environment-gated paths, polling, sleeps and other existing violations). The standalone required `npm run check:test-policy` also exited 1. Logs: `/tmp/prime-mojo-npm-check-final.log` and `/tmp/prime-mojo-test-policy.log`. Later stages of the chained repository check did not run. The installed npm also warns that it does not recognize `min-release-age`; no dependencies were changed. No exclusion, baseline or policy was weakened.

Hashes of all original tracked/untracked files were captured before the formatter-capable check and verified unchanged afterward. The pre-existing untracked work remains separate. No commit, push, install or publication was performed.

Live provider authentication/model availability, complete upstream parity, daemon compatibility, restart recovery of live actors, platform portability and partial pthread-start fault injection remain unverified. See the README for unsupported upstream surfaces. The donor source's redistribution license remains unspecified; local source provenance does not establish permission to publish it under Prime Agent's MIT notice.

# BoC implementation provenance

The admission planner in `upstream/` is adapted from the user-owned local
repository `/home/lazysloth/dev/aethon-boc-runtime`, commit
`6090dc8f7bd5514b64fde89c8367a06a6a1cca4b`. The two source files were clean in
that checkout when copied on 2026-10-13 UTC.

| File | Original SHA-256 | Adapted SHA-256 |
| --- | --- | --- |
| `src/runtime/boc/identity.mojo` → `upstream/identity.mojo` | `79f072c74235df8b4ce184498b0b2affc4854a929a6a923473ae708d8177e409` | `2d15ec77434079d4cf96663b78be087d594ef66e7352dff2cc6bd365f68f2fd0` |
| `src/runtime/boc/schedule_plan.mojo` → `upstream/schedule_plan.mojo` | `e6fc9d10044d201d2df6a36cf82fded815aa81876141ddbd3f5c0c782889315b` | `c4cdde1c01f92eb32e793e1be5269ce26095ac90303e6bff675504588c0fe504` |

The only source adaptation removes `ImplicitlyDeletable` from the declarations
of `CownHandle`, `ModelMutation`, `SchedulePlan`, and `ResolutionReport`, because
the current Mojo compiler no longer defines that trait. No planner algorithm
or identity comparison was changed.

`core.mojo` is a new native adapter. Every admitted behavior calls the existing
`make_schedule_plan` algorithm, including its ordered deduplication, argument
map, duplicate compensation, and phase-two hold accounting. Admission validates
the existing `simulate_resolutions` / `accounting_ok` oracle. The adapter
provides agent-state storage, scoped acquisitions, callback packets, conflict
selection, and native worker dispatch. The donor's full interpreter arena,
production bodies, replay machinery, and lock-free protocol are not imported.

No repository-wide `LICENSE`, `COPYING`, or applicable `NOTICE` file was found
in the donor checkout. A license under an unrelated benchmark does not license
these files. This record establishes technical provenance for the authorized
local port; it does not assert a redistribution license. The Prime Agent
license elsewhere in this tree does not establish licensing for this donor.

# Source provenance

## Prime Agent

- Repository: https://github.com/PrimeIntellect-ai/prime-agent
- Porting revision: `d592d5e7746408fe9097541af96d3239e263f7a1`
- Upstream version: `0.10.0`
- Implementation language at that revision: Rust (nine workspace crates).
- Local original checkout: `e311d6495124cf0bdc629c813fc97a39a9a3054d`, TypeScript.
- License: MIT; see `LICENSE.prime-agent`.

The port uses upstream contracts and source as its reference. No claim of byte-for-byte daemon, session-file, or terminal parity is implied by the independent native CLI.

## BoC

The existing local implementation is in `/home/lazysloth/dev/aethon/src/runtime/boc` and `/home/lazysloth/dev/aethon-boc-runtime/src/runtime/boc`. Runtime provenance records identify the exact reused files and any adaptations. The public typed API documents single-host ownership and cannot by itself establish concurrent agent execution; concurrency requires separate tests in this port.

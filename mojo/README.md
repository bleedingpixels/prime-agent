# Prime Agent in Mojo

Native Mojo port of Prime Agent's agent harness, with behavior-oriented concurrency (BoC) as the ownership and scheduling model for subagents.

The porting reference is the Rust upstream at commit `d592d5e7746408fe9097541af96d3239e263f7a1` (version 0.10.0). The surrounding checkout is an older TypeScript revision and is preserved. The implementation lives entirely in this directory.

## Build

Development toolchain: Mojo `1.2.0.dev2026100305` (`4ad841b8`), Linux x86-64. Native provider transport links system libcurl. The agent runtime does not call a Python, Rust, or TypeScript implementation.

```sh
make -C mojo build
mojo/build/prime-agent-mojo --help
make -C mojo test
make -C mojo demo
```

Compilation uses optimization level 3 and treats warnings as errors. Build products remain in the ignored `build/` directory. Set `MOJO=/path/to/mojo` to use a specific compiler.

The test runner also needs Bash and jq, and permission to bind ephemeral loopback sockets. Its HTTP fixtures run locally and do not use provider credentials. The native binary needs system libcurl and libc. Shell tools use Linux process facilities.

## Use

From the repository root, run the offline actor example:

```sh
mojo/build/prime-agent-mojo --cwd mojo --fixture examples/actors.json --mode json "Delegate a task to a helper."
```

This invokes the real agent loop and actor tools with predetermined provider responses. It spawns a child, waits for its result, and completes the parent. It does not make a model request.

For an actual model, supply the full Chat Completions endpoint, model identifier, and the name of an environment variable holding its credential:

```sh
mojo/build/prime-agent-mojo \
  --base-url https://api.openai.com/v1/chat/completions \
  --model YOUR_MODEL_ID --api-key-env OPENAI_API_KEY \
  --cwd /absolute/path/to/project --session conversation.json \
  "Read the project and explain its entry point."
```

The endpoint is the complete request URL, despite the `--base-url` option name. Provider/model access and live authentication were not exercised during validation. There is no implicit provider or model fallback.

Use `--allow-write` for `write` and `edit`, or `--allow-shell` for `bash`. Shell access grants the process its normal local authority; the file-tool workspace restrictions do not sandbox shell commands. File tools reject absolute paths, parent traversal and symlink traversal. Fixture, transcript and tool paths are relative to `--cwd`. An explicit `--session` permits that transcript write even without `--allow-write`.

Use `--resume conversation.json` to load this port's native transcript, `--interactive` for successive prompts until `/quit` or EOF, and `--max-turns N` to bound provider turns per actor. `--mode json` emits events and a final result. The protocol is local to this port.

## Architecture

- `src/runtime/`: actor identities, bounded mailboxes, lifecycle and BoC ownership.
- `src/harness/`: typed messages, provider events, turn reduction and actor-backed sessions.
- `src/interfaces/`: provider transport, durable session I/O, local tools and CLI.
- `vendor/`: adapted BoC primitives and their provenance.
- `tests/`: native deterministic behavior tests with no provider credentials or paid requests.

The scheduler acquires the whole resource set for a behavior before execution. Behaviors sharing an actor's state retain submission order; independent actor states can execute on native pthread workers. One-worker execution avoids thread creation. Provider and tool effects cross explicit boundaries so failure behavior can be tested locally.

Subagents have actor-owned state, a bounded mailbox, parent/child identity, lifecycle and budgets. The model-facing tools are `spawn_agent`, `send_message`, `receive_message`, `wait_agent` and `cancel_agent`, alongside `read`, `write`, `edit` and `bash`. Cancellation is cooperative. Actor IDs are scoped to one prompt tree; interactive turns retain conversation history and release completed actors. The CLI currently drives provider calls and local effects synchronously; parallel scheduler execution does not imply parallel network requests.

## Port status

Implemented: a runnable native agent loop, Chat Completions transport, local tools, actor subagents, budgets, text/JSON output, an interactive prompt loop and native transcript save/resume. The implementation is a port of the core harness and CLI, not complete upstream feature parity.

Not implemented: the daemon protocol, full-screen TUI, RPC/ACP, streaming, OAuth/subscription login, complete provider/model catalog, Python RLM kernel, telemetry/release machinery, or upstream session-file compatibility. Child actor trees and mailboxes are not durable across process restart. Native transcript persistence is separate from daemon crash recovery.

See [validation](docs/VALIDATION.md) for the verified scope, repository check blocker and measurements. Reproduce the serial scheduler comparison with `make -C mojo benchmark`; it compiles both variants from the same source and stores raw samples and hashes under `build/evidence/`.

Prime Agent source provenance and its MIT notice are preserved in `UPSTREAM.md` and `LICENSE.prime-agent`.

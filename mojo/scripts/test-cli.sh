#!/usr/bin/env bash
# testing artifact: deterministic process-boundary CLI checks
set -euo pipefail
cd "$(dirname "$0")/.."
binary="${PRIME_MOJO_TEST_BINARY:-$PWD/build/prime-agent-mojo}"
workspace="$(mktemp -d "${TMPDIR:-/tmp}/prime-mojo-cli.XXXXXXXX")"
trap 'rm -rf "$workspace"' EXIT

jq -n '
  def call($id; $name; $args):
    {choices: [{message: {role: "assistant", content: null,
      tool_calls: [{id: $id, type: "function", function: {name: $name, arguments: ($args | tojson)}}]},
      finish_reason: "tool_calls"}]};
  def done: {choices: [{message: {role: "assistant", content: "complete"}, finish_reason: "stop"}]};
  [call("write-1"; "write"; {path: "result.txt", content: "original"}),
   call("edit-1"; "edit"; {path: "result.txt", edits: [{oldText: "original", newText: "changed"}]}),
   call("read-1"; "read"; {path: "result.txt"}),
   call("shell-1"; "bash"; {command: "cat result.txt"}), done]
' > "$workspace/tools.json"
"$binary" --cwd "$workspace" --fixture tools.json --allow-write --allow-shell \
  --session transcript.json "Exercise local tools" > "$workspace/output.txt"
[[ "$(cat "$workspace/result.txt")" == changed ]]
jq -e '
  .format == "prime-mojo-transcript" and .version == 1 and
  ([.messages[] | select(.role == 2)] | length == 4) and
  all(.messages[] | select(.role == 2); .is_error == false) and
  any(.messages[]; .tool_call_id == "read-1" and .content[0].text == "changed") and
  any(.messages[]; .tool_call_id == "shell-1" and .content[0].text == "changed")
' "$workspace/transcript.json" > /dev/null

jq '.[-1:]' "$workspace/tools.json" > "$workspace/answer.json"
"$binary" --cwd "$workspace" --fixture answer.json --allow-write \
  --resume transcript.json --session resumed.json "Continue" > "$workspace/resumed-output.txt"
jq -e --slurpfile previous "$workspace/transcript.json" '
  (.messages | length) == ($previous[0].messages | length) + 2 and
  .messages[0:($previous[0].messages | length)] == $previous[0].messages
' "$workspace/resumed.json" > /dev/null

mkdir "$workspace/denied"
cp "$workspace/tools.json" "$workspace/denied/tools.json"
"$binary" --cwd "$workspace/denied" --fixture tools.json \
  --session denied.json "Exercise denied tools" > "$workspace/denied-output.txt"
[[ ! -e "$workspace/denied/result.txt" ]]
jq -e 'all(.messages[] | select(.role == 2); .is_error == true)' \
  "$workspace/denied/denied.json" > /dev/null

jq -n '
  def call($id; $name; $args):
    {choices: [{message: {role: "assistant", content: null,
      tool_calls: [{id: $id, type: "function", function: {name: $name, arguments: ($args | tojson)}}]},
      finish_reason: "tool_calls"}]};
  def done($text): {choices: [{message: {role: "assistant", content: $text}, finish_reason: "stop"}]};
  [call("spawn-1"; "spawn_agent"; {name: "child", prompt: "Receive the task and finish"}),
   call("send-1"; "send_message"; {agent_id: 1, message: "task details"}),
   call("receive-1"; "receive_message"; {}),
   call("wait-1"; "wait_agent"; {agent_id: 1}),
   done("child complete"), done("parent complete")]
' > "$workspace/actors.json"
"$binary" --cwd "$workspace" --fixture actors.json --mode json \
  --session actors-transcript.json "Coordinate a child" > "$workspace/actors-output.jsonl"
jq -e '
  any(.messages[]; .tool_call_id == "wait-1" and .is_error == false and
    .content[0].text == "child complete") and
  any(.messages[]; .tool_call_id == "spawn-1" and (.content[0].text | fromjson | .agent_id == 1))
' "$workspace/actors-transcript.json" > /dev/null
jq -es '
  any(.[]; .type == "agent_event" and .agent_id == 1) and
  any(.[]; .type == "result" and .text == "parent complete")
' "$workspace/actors-output.jsonl" > /dev/null

jq -n '
  def call($id; $name; $args):
    {choices: [{message: {role: "assistant", content: null,
      tool_calls: [{id: $id, type: "function", function: {name: $name, arguments: ($args | tojson)}}]},
      finish_reason: "tool_calls"}]};
  [call("spawn-1"; "spawn_agent"; {name: "cancelled", prompt: "Pending task"}),
   call("cancel-1"; "cancel_agent"; {agent_id: 1}),
   call("wait-1"; "wait_agent"; {agent_id: 1}),
   {choices: [{message: {role: "assistant", content: "cancel complete"}, finish_reason: "stop"}]}]
' > "$workspace/cancel.json"
"$binary" --cwd "$workspace" --fixture cancel.json --session cancel-transcript.json \
  "Cancel a child" > "$workspace/cancel-output.txt"
jq -e '
  any(.messages[]; .tool_call_id == "cancel-1" and .is_error == false) and
  any(.messages[]; .tool_call_id == "wait-1" and .is_error == true)
' "$workspace/cancel-transcript.json" > /dev/null

jq '[.[0], .[3], {error: {message: "child provider failure"}}, .[5]]' \
  "$workspace/actors.json" > "$workspace/child-error.json"
"$binary" --cwd "$workspace" --fixture child-error.json --session child-error-transcript.json \
  "Handle a child provider failure" > "$workspace/child-error-output.txt"
jq -e '
  any(.messages[]; .tool_call_id == "wait-1" and .is_error == true) and
  .messages[-1].content[0].text == "parent complete"
' "$workspace/child-error-transcript.json" > /dev/null

jq '[range(129) | {choices: [{message: {role: "assistant", content: "complete"}, finish_reason: "stop"}]}]' "$workspace/answer.json" > "$workspace/interactive.json"
printf 'turn %s\n' {1..129} | "$binary" --cwd "$workspace" \
  --fixture interactive.json --interactive --session interactive-transcript.json \
  > "$workspace/interactive-output.txt"
jq -e '
  (.messages | length) == 258 and
  .messages[0].content[0].text == "turn 1" and
  .messages[256].content[0].text == "turn 129"
' "$workspace/interactive-transcript.json" > /dev/null

jq '[.[0], .[3], .[2], .[2], .[2], .[5]]' "$workspace/actors.json" > "$workspace/child-budget.json"
"$binary" --cwd "$workspace" --fixture child-budget.json --max-turns 3 \
  --session child-budget-transcript.json "Handle child exhaustion" > "$workspace/child-budget-output.txt"
jq -e 'any(.messages[]; .tool_call_id == "wait-1" and .is_error == true and .content[0].text == "Provider turn budget exhausted") and .messages[-1].content[0].text == "parent complete"' "$workspace/child-budget-transcript.json" > /dev/null

if "$binary" --cwd "$workspace" --fixture tools.json --max-turns 1 "Exhaust budget" > "$workspace/budget.txt" 2>&1; then
  echo "CLI failed to report budget exhaustion" >&2
  exit 1
fi
if "$binary" --unsupported-option > "$workspace/invalid.txt" 2>&1; then
  echo "CLI accepted an unsupported option" >&2
  exit 1
fi
printf 'Passed CLI tools, durable resume, permissions, subagents, cancellation, provider failure and interactive checks\n'

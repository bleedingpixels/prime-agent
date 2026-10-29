from std.testing import assert_equal, assert_true

from harness.engine import TurnStatus
from harness.sessions import AgentSessions
from harness.types import ContentBlock, Message, ModelResponse, StopReason, ToolCall, ToolResult

comptime SHUFFLE_SEED = 1


def answer(text: String) -> ModelResponse:
    return ModelResponse(Message.assistant([ContentBlock.text_block(text)]))


def exercise_family(workers: Int) raises:
    var sessions = AgentSessions()
    var root = sessions.spawn_root("parent", "shared system")
    var first = sessions.spawn_child(root, "first")
    var second = sessions.spawn_child(root, "second")
    var actors = [root, first, second]
    var prompts = [String("coordinate"), String("inspect"), String("wait")]
    var order = [0, 1, 2]
    var seed = Int(SHUFFLE_SEED)
    for i in range(2, 0, -1):
        seed = (seed * 48271) % 2147483647
        var other = seed % (i + 1)
        var value = order[i]
        order[i] = order[other]
        order[other] = value
    for index in order:
        sessions.begin_turn(actors[index], prompts[index])
    assert_true(not sessions.provider_request(first))
    sessions.run(workers)
    var first_request = sessions.provider_request(first).value().copy()
    assert_equal(first_request.context.system_prompt, "shared system")
    assert_equal(first_request.context.messages[0].text(), "inspect")
    assert_equal(sessions.snapshot(root).state.agent.messages[0].text(), "coordinate")
    sessions.send(root, first, "instruction")
    sessions.send(second, first, "sibling detail")
    assert_equal(sessions.receive(first).value().body, "instruction")
    assert_equal(sessions.receive(first).value().body, "sibling detail")
    assert_true(not sessions.receive(first))
    assert_true(not sessions.join(first))

    var response = Message.assistant([
        ContentBlock.tool_call_block(ToolCall("read-id", "read", "{}")),
        ContentBlock.tool_call_block(ToolCall("edit-id", "edit", "{}")),
    ], StopReason.TOOL_USE)
    sessions.apply_response(first, first_request.request_id, ModelResponse(response^))
    sessions.run(workers)
    assert_equal(len(sessions.pending_tools(first)), 2)
    sessions.apply_tool_result(first, first_request.request_id, ToolResult("edit-id", "edit", [ContentBlock.text_block("edited")]))
    sessions.run(workers)
    assert_equal(len(sessions.pending_tools(first)), 1)
    assert_true(not sessions.provider_request(first))
    sessions.apply_tool_result(first, first_request.request_id, ToolResult("read-id", "read", [ContentBlock.text_block("read")]))
    sessions.run(workers)
    var next_request = sessions.provider_request(first).value().copy()
    assert_equal(next_request.request_id, first_request.request_id + 1)
    assert_equal(next_request.context.messages[2].tool_call_id, "read-id")
    assert_equal(next_request.context.messages[3].tool_call_id, "edit-id")
    sessions.apply_response(first, next_request.request_id, answer("retained child result"))
    sessions.cancel(second)
    sessions.run(workers)
    assert_equal(sessions.join(first).value(), "retained child result")
    assert_equal(sessions.join(first).value(), "retained child result")
    assert_equal(sessions.snapshot(first).status, "completed")
    assert_equal(sessions.snapshot(second).status, "cancelled")
    assert_equal(sessions.snapshot(second).state.agent.status.tag, TurnStatus.CANCELLED.tag)
    assert_equal(sessions.snapshot(root).state.agent.messages[0].text(), "coordinate")
    var cancelled_raised = False
    try:
        _ = sessions.join(second)
    except:
        cancelled_raised = True
    assert_true(cancelled_raised)
    var root_request = sessions.provider_request(root).value().copy()
    sessions.apply_response(root, root_request.request_id, answer("parent complete"))
    sessions.run(workers)
    assert_equal(sessions.join(root).value(), "parent complete")


def check_limits_and_resume() raises:
    var sessions = AgentSessions(max_depth=1, max_agents=3)
    var root = sessions.spawn_root("parent")
    var child = sessions.spawn_child(root, "child")
    var depth_raised = False
    try:
        _ = sessions.spawn_child(child, "too deep")
    except:
        depth_raised = True
    assert_true(depth_raised)
    var resumed = sessions.spawn_root("resumed")
    sessions.restore_messages(resumed, [Message.user("old"), answer("prior").message.copy()])
    sessions.begin_turn(resumed, "new")
    sessions.run(2)
    var request = sessions.provider_request(resumed).value().copy()
    assert_equal(len(request.context.messages), 3)
    assert_equal(request.context.messages[0].text(), "old")
    assert_equal(request.context.messages[2].text(), "new")
    var count_raised = False
    try:
        _ = sessions.spawn_root("too many")
    except:
        count_raised = True
    assert_true(count_raised)
    sessions.cancel(child)
    sessions.run(2)
    assert_equal(sessions.snapshot(child).status, "cancelled")


def check_stale_response_isolation() raises:
    var sessions = AgentSessions()
    var root = sessions.spawn_root("one")
    var other = sessions.spawn_root("two")
    sessions.begin_turn(root, "start")
    sessions.begin_turn(other, "independent")
    sessions.run(2)
    sessions.apply_response(root, 999, answer("stale"))
    var rejected = False
    try:
        sessions.run(2)
    except:
        rejected = True
    assert_true(rejected)
    assert_equal(sessions.snapshot(root).status, "failed")
    assert_equal(len(sessions.snapshot(root).state.agent.messages), 1)
    var request = sessions.provider_request(other).value().copy()
    sessions.apply_response(other, request.request_id, answer("recovered"))
    sessions.run(2)
    assert_equal(sessions.join(other).value(), "recovered")


def main() raises:
    for workers in [1, 2, 4]:
        exercise_family(workers)
    check_limits_and_resume()
    check_stale_response_isolation()
    print("PASS harness sessions: native family turns, ordered tools, retained results, cancellation, limits, resume, failure isolation")

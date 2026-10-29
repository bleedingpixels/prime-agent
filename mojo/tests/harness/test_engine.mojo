from std.testing import TestSuite, assert_equal, assert_false, assert_raises, assert_true
from harness.engine import AgentState, TurnStatus
from harness.types import Budget, ContentBlock, EventKind, Message, ModelResponse, Role, StopReason, ToolCall, ToolResult, Usage

comptime SHUFFLE_SEED = 1


def response(text: String = "done", reason: StopReason = StopReason.STOP) -> ModelResponse:
    return ModelResponse(Message.assistant([ContentBlock.text_block(text)], reason))


def tools_response() -> ModelResponse:
    var blocks = List[ContentBlock]()
    for i in range(3):
        blocks.append(ContentBlock.tool_call_block(ToolCall(String(i), "echo", "{}")))
    return ModelResponse(Message.assistant(blocks^, StopReason.TOOL_USE))


def result(index: Int, terminate: Bool = False) -> ToolResult:
    return ToolResult(String(index), "echo", [ContentBlock.text_block(String(index))], terminate=terminate)


def ready_tools() raises -> AgentState:
    var state = AgentState()
    state.begin_turn("hello")
    var request = state.provider_request()
    state.apply_response(request.request_id, tools_response())
    _ = state.take_pending_tools()
    return state^


def test_plain_turn_and_retained_context() raises:
    var state = AgentState("system")
    state.begin_turn("hello")
    var request = state.provider_request()
    assert_equal(request.context.system_prompt, "system")
    assert_equal(len(request.context.messages), 1)
    with assert_raises():
        state.begin_turn("overlap")
    state.apply_response(request.request_id, response())
    assert_true(state.is_terminal())
    assert_equal(state.status.tag, TurnStatus.COMPLETE.tag)
    assert_equal(len(state.messages), 2)
    assert_equal(state.events[0].kind.tag, EventKind.AGENT_START.tag)
    assert_equal(state.events[len(state.events) - 1].kind.tag, EventKind.AGENT_END.tag)
    var completed_events = state.event_count
    state.cancel("already done")
    assert_equal(state.status.tag, TurnStatus.COMPLETE.tag)
    assert_equal(state.event_count, completed_events)
    state.begin_turn("next")
    var next_request = state.provider_request()
    assert_equal(len(next_request.context.messages), 3)
    assert_true(next_request.request_id > request.request_id)


def test_cancel_idle_records_terminal_lifecycle() raises:
    var state = AgentState()
    state.cancel("removed")
    assert_equal(state.status.tag, TurnStatus.CANCELLED.tag)
    assert_equal(state.failure, "removed")
    assert_false(state.has_pending_work())
    assert_equal(len(state.messages), 0)
    assert_equal(len(state.events), 2)
    assert_equal(state.events[0].kind.tag, EventKind.CANCELLED.tag)
    assert_equal(state.events[1].kind.tag, EventKind.AGENT_END.tag)
    state.cancel("again")
    assert_equal(state.failure, "removed")
    assert_equal(state.event_count, 2)


def test_result_order_for_every_completion_permutation() raises:
    var permutations: List[List[Int]] = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]
    var seed = Int(SHUFFLE_SEED)
    for i in range(len(permutations) - 1, 0, -1):
        seed = (seed * 48271) % 2147483647
        var j = seed % (i + 1)
        var saved = permutations[i].copy()
        permutations[i] = permutations[j].copy()
        permutations[j] = saved^
    for order in permutations:
        var state = ready_tools()
        assert_equal(len(state.pending_tools()), 0)
        for position in range(3):
            state.apply_tool_result(result(order[position]))
            if position < 2:
                assert_equal(len(state.messages), 2)
                assert_equal(state.status.tag, TurnStatus.TOOLS_PENDING.tag)
        assert_equal(state.status.tag, TurnStatus.PROVIDER_READY.tag)
        assert_equal(state.events[len(state.events) - 1].kind.tag, EventKind.TURN_END.tag)
        assert_equal(state.events[len(state.events) - 1].message.role.tag, Role.ASSISTANT.tag)
        var request = state.provider_request()
        assert_equal(request.turn, 2)
        assert_equal(len(request.context.messages), 5)
        for i in range(3):
            assert_equal(request.context.messages[i + 2].tool_call_id, String(i))
        state.apply_response(request.request_id, response())
        assert_equal(len(state.messages), 6)


def test_invalid_and_duplicate_results_leave_pending_intact() raises:
    var state = ready_tools()
    with assert_raises():
        state.apply_tool_result(result(99))
    var wrong_name = result(0)
    wrong_name.name = "other"
    with assert_raises():
        state.apply_tool_result(wrong_name)
    state.apply_tool_result(result(0))
    with assert_raises():
        state.apply_tool_result(result(0))
    assert_equal(len(state.messages), 2)
    state.apply_tool_result(result(1))
    state.apply_tool_result(result(2))
    assert_equal(len(state.messages), 5)


def test_result_requires_dispatch() raises:
    var state = AgentState()
    state.begin_turn("hello")
    var request = state.provider_request()
    state.apply_response(request.request_id, tools_response())
    assert_equal(len(state.pending_tools()), 3)
    with assert_raises():
        state.apply_tool_result(result(0))
    assert_equal(len(state.take_pending_tools()), 3)
    assert_equal(len(state.take_pending_tools()), 0)


def test_tool_error_continues_and_all_terminate_required() raises:
    var state = ready_tools()
    var error_result = result(1)
    error_result.is_error = True
    state.apply_tool_result(result(0, True))
    state.apply_tool_result(error_result)
    state.apply_tool_result(result(2, True))
    assert_equal(state.status.tag, TurnStatus.PROVIDER_READY.tag)
    assert_true(state.messages[3].is_error)
    var terminating = ready_tools()
    for i in range(3):
        terminating.apply_tool_result(result(i, True))
    assert_equal(terminating.status.tag, TurnStatus.COMPLETE.tag)


def test_cancel_retains_completed_and_closes_unresolved_tools() raises:
    var state = ready_tools()
    state.apply_tool_result(result(2))
    state.cancel()
    assert_equal(state.status.tag, TurnStatus.CANCELLED.tag)
    assert_false(state.has_pending_work())
    assert_equal(len(state.pending), 0)
    assert_equal(len(state.messages), 5)
    assert_true(state.messages[2].is_error)
    assert_true(state.messages[3].is_error)
    assert_false(state.messages[4].is_error)
    with assert_raises():
        state.apply_tool_result(result(0))


def test_stale_provider_response_and_failure_partial() raises:
    var state = AgentState()
    state.begin_turn("first")
    var stale = state.provider_request()
    state.cancel()
    state.begin_turn("second")
    var current = state.provider_request()
    with assert_raises():
        state.apply_response(stale.request_id, response())
    var failed = response("partial", StopReason.ERROR)
    failed.message.error_message = "provider failed"
    state.apply_response(current.request_id, failed)
    assert_equal(state.status.tag, TurnStatus.FAILED.tag)
    assert_equal(state.failure, "provider failed")
    assert_equal(state.messages[len(state.messages) - 1].content[0].text, "partial")


def test_turn_token_tool_and_cost_budgets() raises:
    var state = AgentState(budget=Budget(max_turns=1))
    state.begin_turn("hello")
    var request = state.provider_request()
    state.apply_response(request.request_id, tools_response())
    _ = state.take_pending_tools()
    for i in range(3):
        state.apply_tool_result(result(i))
    with assert_raises():
        _ = state.provider_request()
    assert_equal(state.status.tag, TurnStatus.BUDGET_EXHAUSTED.tag)
    var limited = AgentState(budget=Budget(max_tool_calls=2))
    limited.begin_turn("hello")
    var limited_request = limited.provider_request()
    limited.apply_response(limited_request.request_id, tools_response())
    assert_equal(limited.status.tag, TurnStatus.BUDGET_EXHAUSTED.tag)
    assert_equal(len(limited.pending_tools()), 0)
    for token_limit in [True, False]:
        var measured = AgentState(budget=Budget(max_tokens=10 if token_limit else 0, max_cost=Float64(0 if token_limit else 1)))
        measured.begin_turn("hello")
        var measured_request = measured.provider_request()
        var answer = tools_response()
        answer.message.usage = Usage(input=3, output=5, cache_read=1, cache_write=1, cost=1)
        measured.apply_response(measured_request.request_id, answer)
        _ = measured.take_pending_tools()
        for i in range(3):
            measured.apply_tool_result(result(i))
        with assert_raises():
            _ = measured.provider_request()
        assert_equal(measured.usage.total_tokens(), 10)


def test_copy_restore_and_event_bound() raises:
    var state = AgentState(max_events=3)
    state.restore_messages([Message.user("prior")])
    state.begin_turn("current")
    var copied = state.copy()
    state.cancel()
    assert_equal(copied.status.tag, TurnStatus.PROVIDER_READY.tag)
    assert_equal(len(state.events), 3)
    assert_true(state.event_count > len(state.events))
    var events = state.drain_events()
    assert_equal(len(events), 3)
    assert_equal(len(state.events), 0)
    assert_equal(len(copied.messages), 2)


def test_stale_tool_result_with_reused_call_id() raises:
    var state = ready_tools()
    var old_request = state.request_id
    state.cancel()
    state.begin_turn("second")
    var request = state.provider_request()
    state.apply_response(request.request_id, tools_response())
    _ = state.take_pending_tools()
    with assert_raises():
        state.apply_tool_result(result(0), old_request)
    assert_equal(len(state.messages), 7)
    for i in range(3):
        state.apply_tool_result(result(i), request.request_id)
    assert_equal(state.status.tag, TurnStatus.PROVIDER_READY.tag)


def test_invalid_inputs_rejected_before_commit() raises:
    var invalid = AgentState(budget=Budget(max_turns=-1))
    with assert_raises():
        invalid.begin_turn("hello")
    assert_equal(len(invalid.messages), 0)
    var state = AgentState()
    state.begin_turn("hello")
    var request = state.provider_request()
    var negative = response()
    negative.message.usage = Usage(input=-1)
    with assert_raises():
        state.apply_response(request.request_id, negative)
    var duplicate = tools_response()
    duplicate.message.content[1].tool_call.id = "0"
    with assert_raises():
        state.apply_response(request.request_id, duplicate)
    assert_equal(len(state.messages), 1)
    state.usage = Usage(input=Usage.MAX_TOKENS)
    var overflow = response()
    overflow.message.usage = Usage(output=1)
    with assert_raises():
        state.apply_response(request.request_id, overflow)
    assert_equal(state.usage.total_tokens(), Usage.MAX_TOKENS)
    assert_equal(len(state.messages), 1)


def test_history_bound_and_failure_close_pending() raises:
    var bounded = AgentState(max_history=3)
    bounded.begin_turn("hello")
    var request = bounded.provider_request()
    bounded.apply_response(request.request_id, tools_response())
    assert_equal(bounded.status.tag, TurnStatus.FAILED.tag)
    assert_true(len(bounded.messages) <= bounded.max_history)
    assert_equal(len(bounded.messages), 1)
    assert_equal(len(bounded.pending), 0)
    var failed = ready_tools()
    failed.fail("executor failed")
    assert_equal(failed.status.tag, TurnStatus.FAILED.tag)
    assert_equal(failed.failure, "executor failed")
    for i in range(3):
        assert_true(failed.messages[i + 2].is_error)


def main() raises:
    TestSuite.discover_tests[__functions_in_module()]().run()

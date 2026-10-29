from std.testing import assert_equal, assert_false, assert_true
from harness.types import AgentEvent, Budget, ContentBlock, ContentKind, Context, EventKind, Message, Model, ModelResponse, Role, StopReason, ToolCall, ToolDefinition, ToolResult, Usage


def test_ordered_message_views_and_metadata() raises:
    var blocks = List[ContentBlock]()
    blocks.append(ContentBlock.text_block("before", "text-sig"))
    blocks.append(ContentBlock.thinking_block("private", "think-sig", True))
    blocks.append(ContentBlock.tool_call_block(ToolCall("a", "read", "{\"path\":\"a\"}", "call-sig")))
    blocks.append(ContentBlock.image_block("QQ==", "image/png"))
    blocks.append(ContentBlock.tool_call_block(ToolCall("b", "write", "{}")))
    blocks.append(ContentBlock.text_block("after"))
    var message = Message.assistant(blocks^, StopReason.TOOL_USE, 17)
    var calls = message.tool_calls()
    assert_equal(message.text(), "before after")
    assert_equal(len(calls), 2)
    assert_equal(calls[0].id, "a")
    assert_equal(calls[1].name, "write")
    assert_equal(calls[0].arguments_json, "{\"path\":\"a\"}")
    assert_equal(calls[0].thought_signature, "call-sig")
    assert_equal(message.content[0].signature, "text-sig")
    assert_true(message.content[1].redacted)
    assert_equal(message.content[3].mime_type, "image/png")
    assert_equal(message.timestamp, 17)
    assert_equal(message.role.wire_name(), "assistant")
    assert_equal(message.stop_reason.wire_name(), "toolUse")


def test_context_and_response_are_independent_snapshots() raises:
    var messages = List[Message]()
    messages.append(Message.user("question", 9))
    var tools = List[ToolDefinition]()
    tools.append(ToolDefinition("read", "read file", "{\"type\":\"object\"}"))
    var context = Context("system", messages^, tools^)
    var snapshot = context.copy()
    context.messages[0].content[0].text = "changed"
    context.tools[0].parameters_json = "{}"
    assert_equal(snapshot.messages[0].text(), "question")
    assert_equal(snapshot.tools[0].parameters_json, "{\"type\":\"object\"}")
    var response = ModelResponse(snapshot.messages[0].copy())
    response.message.content[0].text = "answer"
    assert_equal(snapshot.messages[0].text(), "question")
    assert_equal(response.message.text(), "answer")


def test_tool_result_conversion_preserves_error_and_details() raises:
    var blocks = List[ContentBlock]()
    blocks.append(ContentBlock.text_block("failure"))
    blocks.append(ContentBlock.image_block("AA==", "image/jpeg"))
    var result = ToolResult("call-1", "read", blocks^, True, "{\"errno\":2}", True)
    var message = result.to_message(21)
    result.content[0].text = "changed"
    assert_true(message.role == Role.TOOL_RESULT)
    assert_equal(message.tool_call_id, "call-1")
    assert_equal(message.tool_name, "read")
    assert_equal(message.text(), "failure")
    assert_equal(message.details_json, "{\"errno\":2}")
    assert_true(message.is_error)
    assert_equal(message.timestamp, 21)
    assert_true(result.terminate)
    assert_equal(len(message.tool_calls()), 0)


def test_usage_and_budget_account_for_cache_and_exact_limits() raises:
    var usage = Usage(1, 2, 3, 4, 0.125)
    usage.add(Usage(2, 3, 4, 5, 0.125))
    assert_equal(usage.total_tokens(), 24)
    assert_equal(usage.cost, Float64(0.25))
    assert_true(usage.valid())
    assert_false(Usage(input=-1).valid())
    var infinity = Float64(1) / Float64(0)
    assert_false(Usage(cost=infinity).valid())
    assert_false(Usage(cost=Float64(0) / Float64(0)).valid())
    assert_false(Budget(max_cost=infinity).valid())
    assert_true(Usage(Usage.MAX_TOKENS).valid())
    assert_false(Usage(Usage.MAX_TOKENS, 1).valid())
    assert_false(Usage(Usage.MAX_TOKENS).can_add(Usage(1)))
    assert_true(Usage(Usage.MAX_TOKENS - 1).can_add(Usage(1)))
    assert_false(Usage(cost=Float64(1e308)).can_add(Usage(cost=Float64(1e308))))
    assert_false(Budget(max_tokens=-1).valid())
    var budget = Budget(2, 3, 24, 0.25)
    assert_false(budget.exhausted(1, 2, Usage(23, cost=0.249)))
    assert_true(budget.exhausted(2, 0, Usage()))
    assert_true(budget.exhausted(0, 3, Usage()))
    assert_true(budget.exhausted(0, 0, usage))
    assert_true(budget.exhausted(0, 0, Usage(cost=0.25)))
    assert_false(Budget(0, 0, 0, 0).exhausted(1000, 1000, usage))
    assert_true(Budget().exhausted(32, 0, Usage()))
    assert_true(Budget().exhausted(0, 128, Usage()))
    assert_true(Budget().exhausted(0, 0, Usage(262144)))


def test_event_snapshot_retains_payload() raises:
    var event = AgentEvent(EventKind.MESSAGE_END, 3, Message.user("kept"))
    var copy = event.copy()
    event.message.content[0].text = "changed"
    assert_true(copy.kind == EventKind.MESSAGE_END)
    assert_equal(copy.turn, 3)
    assert_equal(copy.message.text(), "kept")
    var model = Model("id", "provider", "api", "endpoint", 8192, 1024)
    assert_equal(model.max_tokens, 1024)
    assert_equal(ContentKind.IMAGE.wire_name(), "image")
    assert_equal(StopReason.ABORTED.wire_name(), "aborted")


def main() raises:
    test_ordered_message_views_and_metadata()
    test_context_and_response_are_independent_snapshots()
    test_tool_result_conversion_preserves_error_and_details()
    test_usage_and_budget_account_for_cache_and_exact_limits()
    test_event_snapshot_retains_payload()
    print("PASS harness types: 5 tests")

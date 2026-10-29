# testing artifact
from std.collections import List
from std.ffi import external_call
from std.testing import assert_equal, assert_true
from harness.types import Message, ContentBlock, ToolCall, StopReason, Usage
from interfaces.sessions import serialize_session, parse_session, save_session, load_session
from interfaces.tools import ToolPolicy, _cstring, read_file, write_file

def main() raises:
    var messages = List[Message]()
    messages.append(Message.user("quoted \" héllo\n", 3))
    var content = List[ContentBlock]()
    content.append(ContentBlock.thinking_block("reason", "opaque", True))
    content.append(ContentBlock.tool_call_block(ToolCall("call1", "read", "{\"path\":\"text\"}", "signature")))
    var assistant = Message.assistant(content^, StopReason.TOOL_USE, 4)
    assistant.usage = Usage(2, 3, 4, 5, 0.125)
    assistant.provider = "fixture"
    assistant.model = "fixture-model"
    assistant.response_id = "response1"
    messages.append(assistant^)
    content = List[ContentBlock]()
    content.append(ContentBlock.text_block("result"))
    var result = Message.tool_result("call1", "read", content^, True, 5)
    result.details_json = "{\"bounded\":true}"
    messages.append(result^)
    var source = serialize_session(messages)
    var resumed = parse_session(source)
    assert_equal(serialize_session(resumed), source)
    assert_equal(resumed[0].text(), "quoted \" héllo\n")
    assert_equal(resumed[1].tool_calls()[0].thought_signature, "signature")
    assert_equal(resumed[1].usage.total_tokens(), 14)
    assert_true(resumed[2].is_error)
    var pending = messages.copy()
    _ = pending.pop()
    for broken in ["{}", source.replace("\"version\":1", "\"version\":2"), source.replace("\"role\":0", "\"role\":9"), source.replace("\"tool_call_id\":\"call1\"", "\"tool_call_id\":\"orphan\""), source.replace("\"input\":2", "\"input\":-1"), source.replace("\"arguments_json\":\"{", "\"arguments_json\":\"["), source.replace("\"tool_name\":\"read\"", "\"tool_name\":\"write\""), source.replace("\"role\":2", "\"role\":0"), serialize_session(pending), source.replace("\"cost\":0.125", "\"cost\":1e999")]:
        var rejected = False
        try:
            _ = parse_session(broken)
        except:
            rejected = True
        assert_true(rejected)
    var rejected = False
    try:
        _ = parse_session(source, 2)
    except:
        rejected = True
    assert_true(rejected)
    var template = _cstring("/tmp/prime-session-XXXXXX")
    assert_true(external_call["mkdtemp", Int](template.unsafe_ptr()) != 0)
    template.resize(len(template) - 1, UInt8(0))
    var root = String(from_utf8=template^)
    var policy = ToolPolicy(root.copy(), allow_write=True, max_bytes=65536)
    try:
        save_session(policy, "transcript", messages)
        assert_equal(serialize_session(load_session(policy, "transcript")), source)
        var bad = messages.copy()
        bad[0].timestamp = -1
        rejected = False
        try:
            save_session(policy, "transcript", bad)
        except:
            rejected = True
        assert_true(rejected)
        assert_equal(read_file(policy, "transcript"), source)
        write_file(policy, "transcript", "{")
        rejected = False
        try:
            _ = load_session(policy, "transcript")
        except:
            rejected = True
        assert_true(rejected)
        print("sessions: durable roundtrip, metadata, validation, preserved prior save passed")
    finally:
        var file = _cstring(root + "/transcript")
        _ = external_call["unlink", Int32](file.unsafe_ptr())
        _ = file
        var path = _cstring(root)
        assert_equal(external_call["rmdir", Int32](path.unsafe_ptr()), 0)
        _ = path

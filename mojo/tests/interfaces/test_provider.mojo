# testing artifact
from interfaces.provider import ProviderConfig, complete, parse_response, serialize_messages, serialize_tools
from interfaces.json import JsonDocument
from harness.types import ContentBlock, Message, ModelResponse, StopReason, ToolCall, ToolDefinition
from std.collections import List
from std.ffi import external_call
from std.memory import Pointer
from std.sys import argv
from std.testing import assert_equal, assert_true


def rejected(body: String, status: Int = 200) raises:
    var failed = False
    try:
        var result = parse_response(body, status)
    except:
        failed = True
    assert_true(failed)


def serve(listener: Int32, body: String, status: Int) raises:
    var connection = external_call["accept", Int32](listener, UInt64(0), UInt64(0))
    assert_true(connection >= 0)
    try:
        var request = List[UInt8]()
        var byte = UInt8(0)
        var length = 0
        while True:
            assert_equal(external_call["read", Int](connection, Pointer(to=byte), Int(1)), 1)
            request.append(byte)
            var n = len(request)
            assert_true(n <= 65536)
            if n >= 4 and request[n-4] == 13 and request[n-3] == 10 and request[n-2] == 13 and request[n-1] == 10:
                break
        var headers = String(unsafe_from_utf8=request^)
        assert_true(headers.startswith("POST /chat/completions HTTP/1.1\r\n"))
        assert_true("Authorization: Bearer fixture-key\r\n" in headers)
        for line in headers.split("\r\n"):
            if line.startswith("Content-Length: "):
                length = Int(line.split(": ")[1])
        assert_true(length > 0 and length <= 65536)
        var bytes = List[UInt8](length=length, fill=UInt8(0))
        var count = 0
        while count < length:
            var n = external_call["read", Int](connection, bytes.unsafe_ptr().unsafe_offset(count), length-count)
            assert_true(n > 0)
            count += n
        var fixture_body = String(unsafe_from_utf8=bytes^)
        var doc = JsonDocument(fixture_body)
        assert_equal(doc.string(doc.get("model")), "fixture-model")
        assert_equal(doc.raw(doc.get("stream")), "false")
        assert_equal(doc.size(doc.get("messages")), 2)
        assert_equal(doc.string(doc.get("role", doc.at(0, doc.get("messages")))), "system")
        assert_equal(doc.size(doc.get("tools")), 1)
        var reply = "HTTP/1.1 " + String(status) + " Fixture\r\nContent-Type: application/json\r\nContent-Length: " + String(body.byte_length()) + "\r\nConnection: close\r\n\r\n" + body
        var sent = 0
        while sent < reply.byte_length():
            var n = external_call["send", Int](connection, reply.as_bytes().unsafe_ptr().unsafe_offset(sent), reply.byte_length()-sent, Int32(0x4000))
            assert_true(n > 0)
            sent += n
    finally:
        _ = external_call["close", Int32](connection)


def loopback(body: String, status: Int = 200, limit: Int = 4096) raises -> ModelResponse:
    var listener = external_call["socket", Int32](Int32(2), Int32(1), Int32(0))
    assert_true(listener >= 0)
    var child = Int32(-1)
    try:
        var address = List[UInt8](length=16, fill=UInt8(0))
        address[0] = 2
        address[4] = 127
        address[7] = 1
        assert_equal(external_call["bind", Int32](listener, address.unsafe_ptr(), UInt32(16)), 0)
        assert_equal(external_call["listen", Int32](listener, Int32(1)), 0)
        var size = UInt32(16)
        assert_equal(external_call["getsockname", Int32](listener, address.unsafe_ptr(), Pointer(to=size)), 0)
        var port = Int(address[2]) * 256 + Int(address[3])
        child = external_call["fork", Int32]()
        assert_true(child >= 0)
        if child == 0:
            var exit_status = Int32(0)
            try:
                serve(listener, body, status)
            except e:
                var detail = "Fixture error: " + String(e) + "\n"
                _ = external_call["write", Int](Int(2), detail.as_bytes().unsafe_ptr(), detail.byte_length())
                exit_status = 3
            _ = external_call["close", Int32](listener)
            external_call["_exit", NoneType](exit_status)
        var messages = List[Message]()
        messages.append(Message.user("hello"))
        var tools = List[ToolDefinition]()
        tools.append(ToolDefinition("read", "read", '{"type":"object"}'))
        var response = complete(ProviderConfig("http://127.0.0.1:" + String(port) + "/chat/completions", "fixture-model", "fixture-key", 3000, limit), serialize_messages("system", messages), serialize_tools(tools))
        var result = Int32(0)
        assert_equal(external_call["waitpid", Int32](child, Pointer(to=result), Int32(0)), child)
        child = -1
        assert_equal(result, 0)
        return response^
    finally:
        _ = external_call["close", Int32](listener)
        if child > 0:
            _ = external_call["kill", Int32](child, Int32(15))
            var result = Int32(0)
            _ = external_call["waitpid", Int32](child, Pointer(to=result), Int32(0))


def main() raises:
    var response = parse_response('{"id":"r","model":"fixture","choices":[{"message":{"role":"assistant","content":"hello","tool_calls":[{"id":"c","type":"function","function":{"name":"read","arguments":"{\\"path\\":\\"x\\"}"}}]},"finish_reason":"tool_calls"}],"usage":{"prompt_tokens":20,"completion_tokens":3,"prompt_tokens_details":{"cached_tokens":7,"cache_write_tokens":2}}}')
    assert_equal(response.message.text(), "hello")
    assert_true(response.message.stop_reason == StopReason.TOOL_USE)
    var calls = response.message.tool_calls()
    assert_equal(len(calls), 1)
    assert_equal(calls[0].name, "read")
    assert_equal(calls[0].arguments_json, '{"path":"x"}')
    assert_equal(response.message.usage.input, 13)
    assert_equal(response.message.usage.cache_read, 5)
    assert_equal(response.message.response_id, "r")
    rejected('{"error":{"message":"bad"}}', 401)
    rejected("unavailable", 503)
    rejected('{"choices":[{"message":{"role":"assistant","content":"ignored"},"finish_reason":"stop"}]}', 401)
    rejected('{"choices":[]}')
    rejected('{"choices":[{"message":{"role":"user"},"finish_reason":"stop"}]}')
    rejected('{"choices":[{"message":{"role":"assistant"},"finish_reason":"tool_calls"}]}')
    var error_response = parse_response('{"choices":[{"message":{"role":"assistant","content":null},"finish_reason":"content_filter"}]}')
    assert_true(error_response.message.stop_reason == StopReason.ERROR)
    assert_equal(error_response.message.error_message, "Provider finish_reason: content_filter")
    var thought = parse_response('{"choices":[{"message":{"role":"assistant","reasoning_content":"think"},"finish_reason":"length"}],"usage":{"prompt_tokens":0,"completion_tokens":1,"prompt_tokens_details":{"cached_tokens":9223372036854775807,"cache_write_tokens":9223372036854775807}}}')
    assert_true(thought.message.stop_reason == StopReason.LENGTH)
    assert_equal(thought.message.content[0].text, "think")
    assert_equal(thought.message.usage.input, 0)
    rejected('{"choices":[{"message":{"role":"assistant"},"finish_reason":"stop"}],"usage":[]}')
    var failed = False
    try:
        var result = complete(ProviderConfig("file:///tmp/no", "fixture", "fake"), "[]")
    except:
        failed = True
    assert_true(failed)
    var wire_messages = List[Message]()
    var blocks = List[ContentBlock]()
    blocks.append(ContentBlock.tool_call_block(ToolCall("call", "read", '{"path":"x"}')))
    wire_messages.append(Message.assistant(blocks^, StopReason.TOOL_USE))
    var result_blocks = List[ContentBlock]()
    result_blocks.append(ContentBlock.text_block("result"))
    wire_messages.append(Message.tool_result("call", "read", result_blocks^))
    var wire = JsonDocument(serialize_messages("", wire_messages))
    assert_equal(wire.string(wire.get("role", wire.at(1))), "tool")
    assert_equal(wire.string(wire.get("tool_call_id", wire.at(1))), "call")
    var success = '{"choices":[{"message":{"role":"assistant","content":"network"},"finish_reason":"stop"}]}'
    var args = argv()
    var seed = 0
    if len(args) > 1:
        seed = Int(args[1]) % 3
    var statuses = [200, 401, 503]
    for i in range(3):
        var status = statuses[(i + seed) % 3]
        if status == 200:
            var native = loopback(success)
            assert_equal(native.message.text(), "network")
            assert_equal(native.message.model, "fixture-model")
            continue
        var rejected_http = False
        try:
            var response = loopback('{"error":{"message":"fixture failure"}}', status)
        except e:
            assert_true(String(e).startswith(String(status) + " fixture failure"))
            rejected_http = True
        assert_true(rejected_http)
    var bounded = False
    try:
        var response = loopback(success, 200, 8)
    except e:
        assert_true("Provider transport failure 23" in String(e))
        bounded = True
    assert_true(bounded)
    print("Provider response, tools, usage, errors: PASS")

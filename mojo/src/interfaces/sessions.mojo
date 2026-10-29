"""Private versioned transcript format; not Rust session JSONL compatibility."""
from std.collections import List
from harness.types import Message, Role, ContentBlock, ContentKind, ToolCall, StopReason, Usage
from interfaces.json import JsonDocument, json_quote
from interfaces.tools import ToolPolicy, read_file, write_file

comptime SESSION_FORMAT = "prime-mojo-transcript"
comptime SESSION_VERSION = 1

def _str(doc: JsonDocument, parent: Int, key: String) raises -> String:
    return doc.string(doc.get(key, parent))

def _int(doc: JsonDocument, parent: Int, key: String) raises -> Int:
    return doc.integer(doc.get(key, parent))

def _bool(doc: JsonDocument, parent: Int, key: String) raises -> Bool:
    var node = doc.get(key, parent)
    if doc.kind(node) != "boolean":
        raise Error("session: expected boolean")
    return doc.raw(node) == "true"

def _field(key: String, value: String) -> String:
    return "," + json_quote(key) + ":" + json_quote(value)

def _object(doc: JsonDocument, node: Int, fields: Int) raises:
    if doc.kind(node) != "object" or doc.size(node) != fields:
        raise Error("session: object fields do not match transcript schema")

def serialize_session(messages: List[Message], max_bytes: Int = 8388608) raises -> String:
    if max_bytes < 1 or max_bytes > 8388608 or len(messages) > 4096:
        raise Error("session: invalid limit or too many messages")
    var result = "{\"format\":" + json_quote(SESSION_FORMAT) + ",\"version\":1,\"messages\":["
    var input_bytes = 0
    for i in range(len(messages)):
        var message = messages[i].copy()
        input_bytes += message.tool_call_id.byte_length() + message.tool_name.byte_length() + message.details_json.byte_length() + message.api.byte_length() + message.provider.byte_length() + message.model.byte_length() + message.response_model.byte_length() + message.response_id.byte_length() + message.error_message.byte_length()
        for block in message.content:
            input_bytes += block.text.byte_length() + block.data.byte_length() + block.mime_type.byte_length() + block.signature.byte_length() + block.tool_call.id.byte_length() + block.tool_call.name.byte_length() + block.tool_call.arguments_json.byte_length() + block.tool_call.thought_signature.byte_length()
        if input_bytes > max_bytes:
            raise Error("session: transcript input exceeds byte limit")
        if i > 0:
            result += ","
        result += "{\"role\":" + String(message.role.tag) + ",\"timestamp\":" + String(message.timestamp)
        result += _field("tool_call_id", message.tool_call_id) + _field("tool_name", message.tool_name)
        result += ",\"is_error\":" + ("true" if message.is_error else "false")
        result += _field("details_json", message.details_json)
        result += ",\"stop_reason\":" + String(message.stop_reason.tag)
        result += _field("api", message.api) + _field("provider", message.provider) + _field("model", message.model)
        result += _field("response_model", message.response_model) + _field("response_id", message.response_id) + _field("error_message", message.error_message)
        result += ",\"usage\":{\"input\":" + String(message.usage.input) + ",\"output\":" + String(message.usage.output)
        result += ",\"cache_read\":" + String(message.usage.cache_read) + ",\"cache_write\":" + String(message.usage.cache_write) + ",\"cost\":" + String(message.usage.cost) + "},\"content\":["
        if len(message.content) > 4096:
            raise Error("session: too many content blocks")
        for j in range(len(message.content)):
            var block = message.content[j].copy()
            if j > 0:
                result += ","
            result += "{\"kind\":" + String(block.kind.tag) + _field("text", block.text) + _field("data", block.data)
            result += _field("mime_type", block.mime_type) + _field("signature", block.signature)
            result += ",\"redacted\":" + ("true" if block.redacted else "false")
            result += ",\"tool_call\":{\"id\":" + json_quote(block.tool_call.id) + _field("name", block.tool_call.name)
            result += _field("arguments_json", block.tool_call.arguments_json) + _field("thought_signature", block.tool_call.thought_signature) + "}}"
            if result.byte_length() > max_bytes:
                raise Error("session: transcript exceeds byte limit")
        result += "]}"
        if result.byte_length() > max_bytes:
            raise Error("session: transcript exceeds byte limit")
    result += "]}"
    if result.byte_length() > max_bytes:
        raise Error("session: transcript exceeds byte limit")
    return result^

def parse_session(source: String, max_bytes: Int = 8388608) raises -> List[Message]:
    if max_bytes < 1 or max_bytes > 8388608:
        raise Error("session: invalid byte limit")
    var doc = JsonDocument(source, max_bytes)
    _object(doc, 0, 3)
    if doc.kind(0) != "object" or _str(doc, 0, "format") != SESSION_FORMAT or _int(doc, 0, "version") != SESSION_VERSION:
        raise Error("session: unsupported transcript format or version")
    var array = doc.get("messages")
    if doc.kind(array) != "array" or doc.size(array) > 4096:
        raise Error("session: invalid messages")
    var messages = List[Message]()
    var calls = List[String]()
    var call_names = List[String]()
    var answered = List[String]()
    for i in range(doc.size(array)):
        var node = doc.at(i, array)
        _object(doc, node, 15)
        var role = _int(doc, node, "role")
        var timestamp = _int(doc, node, "timestamp")
        var stop = _int(doc, node, "stop_reason")
        if role != 2 and len(calls) != len(answered):
            raise Error("session: pending tool results before next message")
        if role < 0 or role > 2 or timestamp < 0 or stop < 0 or stop > 4:
            raise Error("session: invalid role, timestamp, or stop reason")
        var blocks = doc.get("content", node)
        if doc.kind(blocks) != "array" or doc.size(blocks) > 4096:
            raise Error("session: invalid content")
        var content = List[ContentBlock]()
        for j in range(doc.size(blocks)):
            var item = doc.at(j, blocks)
            _object(doc, item, 7)
            var kind = _int(doc, item, "kind")
            if kind < 0 or kind > 3 or (role != 1 and (kind == 1 or kind == 3)):
                raise Error("session: invalid content kind for role")
            var call_node = doc.get("tool_call", item)
            _object(doc, call_node, 4)
            var call = ToolCall(_str(doc, call_node, "id"), _str(doc, call_node, "name"), _str(doc, call_node, "arguments_json"), _str(doc, call_node, "thought_signature"))
            if kind == 3:
                if call.id == "" or call.name == "" or call.id in calls:
                    raise Error("session: empty or duplicate tool call")
                var arguments = JsonDocument(call.arguments_json, max_bytes)
                if arguments.kind(0) != "object":
                    raise Error("session: tool arguments must be an object")
                calls.append(call.id.copy())
                call_names.append(call.name.copy())
            content.append(ContentBlock(ContentKind(kind), _str(doc, item, "text"), _str(doc, item, "data"), _str(doc, item, "mime_type"), _str(doc, item, "signature"), _bool(doc, item, "redacted"), call^))
        var message = Message(Role(role), content^, timestamp)
        message.tool_call_id = _str(doc, node, "tool_call_id")
        message.tool_name = _str(doc, node, "tool_name")
        message.is_error = _bool(doc, node, "is_error")
        message.details_json = _str(doc, node, "details_json")
        message.stop_reason = StopReason(stop)
        message.api = _str(doc, node, "api")
        message.provider = _str(doc, node, "provider")
        message.model = _str(doc, node, "model")
        message.response_model = _str(doc, node, "response_model")
        message.response_id = _str(doc, node, "response_id")
        message.error_message = _str(doc, node, "error_message")
        var usage = doc.get("usage", node)
        _object(doc, usage, 5)
        var cost = doc.get("cost", usage)
        if doc.kind(cost) != "number":
            raise Error("session: cost must be a number")
        message.usage = Usage(_int(doc, usage, "input"), _int(doc, usage, "output"), _int(doc, usage, "cache_read"), _int(doc, usage, "cache_write"), Float64(doc.raw(cost)))
        if not message.usage.valid() or message.usage.cost > Float64(1e308):
            raise Error("session: invalid usage")
        if role == 2:
            if message.tool_call_id not in calls or message.tool_call_id in answered or message.tool_name == "":
                raise Error("session: orphan or duplicate tool result")
            for k in range(len(calls)):
                if calls[k] == message.tool_call_id and call_names[k] != message.tool_name:
                    raise Error("session: tool result name does not match call")
            answered.append(message.tool_call_id.copy())
        messages.append(message^)
    if len(calls) != len(answered):
        raise Error("session: transcript ends with pending tool results")
    return messages^

def save_session(policy: ToolPolicy, path: String, messages: List[Message]) raises:
    var source = serialize_session(messages, policy.max_bytes)
    _ = parse_session(source, policy.max_bytes)
    write_file(policy, path, source)

def load_session(policy: ToolPolicy, path: String) raises -> List[Message]:
    return parse_session(read_file(policy, path), policy.max_bytes)

"""Explicit OpenAI Chat Completions over native libcurl, without retries."""
from std.ffi import OwnedDLHandle
from std.collections import List
from std.memory import Pointer, OptionalPointer
from interfaces.json import JsonDocument, json_quote
from harness.types import ContentBlock, ContentKind, Message, ModelResponse, Role, StopReason, ToolCall, ToolDefinition, Usage

comptime BytePtr = Pointer[UInt8, MutUntrackedOrigin]
comptime Handle = OptionalPointer[UInt8, MutUntrackedOrigin]


def _c_string(value: String) -> List[UInt8]:
    var bytes = List[UInt8]()
    for b in value.as_bytes():
        bytes.append(b)
    bytes.append(0)
    return bytes^


struct ProviderConfig(Copyable, Movable):
    var endpoint: String
    var model: String
    var api_key: String
    var timeout_ms: Int
    var max_response_bytes: Int
    def __init__(out self, endpoint: String, model: String, api_key: String, timeout_ms: Int = 30000, max_response_bytes: Int = 8388608):
        self.endpoint = endpoint
        self.model = model
        self.api_key = api_key
        self.timeout_ms = timeout_ms
        self.max_response_bytes = max_response_bytes


def _optional_string(doc: JsonDocument, key: String, parent: Int = 0) raises -> String:
    var node = doc.get(key, parent)
    if node < 0 or doc.kind(node) == "null":
        return ""
    return doc.string(node)


def _tokens(doc: JsonDocument, key: String, parent: Int) raises -> Int:
    if parent < 0:
        return 0
    var node = doc.get(key, parent)
    if node < 0:
        return 0
    var count = doc.integer(node)
    if count < 0:
        raise Error("Provider negative usage")
    return count


def serialize_tools(tools: List[ToolDefinition]) raises -> String:
    var entries = List[String]()
    for tool in tools:
        var parameters = JsonDocument(tool.parameters_json)
        if tool.name == "" or parameters.kind(0) != "object":
            raise Error("Provider tool needs a name and object schema")
        entries.append('{"type":"function","function":{"name":' + json_quote(tool.name) + ',"description":' + json_quote(tool.description) + ',"parameters":' + tool.parameters_json + "}}")
    return "[" + ",".join(entries) + "]"


def serialize_messages(system_prompt: String, messages: List[Message]) raises -> String:
    var entries = List[String]()
    if system_prompt != "":
        entries.append('{"role":"system","content":' + json_quote(system_prompt) + "}")
    for message in messages:
        var text = String()
        var thinking = List[String]()
        var user_blocks = List[String]()
        var calls = List[String]()
        var images = False
        for block in message.content:
            if block.kind == ContentKind.TEXT:
                text += block.text
                user_blocks.append('{"type":"text","text":' + json_quote(block.text) + "}")
            elif block.kind == ContentKind.IMAGE:
                if message.role != Role.USER:
                    raise Error("Provider images require a user message")
                images = True
                user_blocks.append('{"type":"image_url","image_url":{"url":' + json_quote("data:" + block.mime_type + ";base64," + block.data) + "}}")
            elif block.kind == ContentKind.THINKING:
                if message.role != Role.ASSISTANT:
                    raise Error("Provider thinking requires an assistant message")
                if not block.redacted:
                    thinking.append(block.text.copy())
            elif block.kind == ContentKind.TOOL_CALL:
                if message.role != Role.ASSISTANT:
                    raise Error("Provider tool calls require an assistant message")
                ref call = block.tool_call
                var arguments = JsonDocument(call.arguments_json)
                if call.id == "" or call.name == "" or arguments.kind(0) != "object":
                    raise Error("Provider invalid tool call")
                calls.append('{"id":' + json_quote(call.id) + ',"type":"function","function":{"name":' + json_quote(call.name) + ',"arguments":' + json_quote(call.arguments_json) + "}}")
            else:
                raise Error("Provider unsupported content kind")
        var role = message.role.wire_name()
        if message.role == Role.TOOL_RESULT:
            role = "tool"
        elif message.role != Role.USER and message.role != Role.ASSISTANT:
            raise Error("Provider unsupported message role")
        var content = json_quote(text)
        if images:
            content = "[" + ",".join(user_blocks) + "]"
        elif message.role == Role.ASSISTANT and text == "":
            content = "null"
        var entry = '{"role":' + json_quote(role) + ',"content":' + content
        if message.role == Role.TOOL_RESULT:
            if message.tool_call_id == "":
                raise Error("Provider tool result needs a call id")
            entry += ',"tool_call_id":' + json_quote(message.tool_call_id) + ',"name":' + json_quote(message.tool_name)
        if len(calls) > 0:
            entry += ',"tool_calls":[' + ",".join(calls) + "]"
        if len(thinking) > 0:
            entry += ',"reasoning_content":' + json_quote("\n".join(thinking))
        entries.append(entry + "}")
    return "[" + ",".join(entries) + "]"


def parse_response(body: String, status: Int = 200) raises -> ModelResponse:
    if status < 200 or status >= 300:
        var detail = body
        try:
            var error_doc = JsonDocument(body)
            var error = error_doc.get("error")
            var message = error_doc.get("message", error)
            if error >= 0 and error_doc.kind(message) == "string":
                detail = error_doc.string(message)
            elif error >= 0:
                detail = error_doc.raw(error)
            else:
                detail = "status code (no body)"
        except:
            pass
        if detail.byte_length() == 0:
            detail = "status code (no body)"
        raise Error(String(status) + " " + detail)
    var doc = JsonDocument(body)
    if doc.kind(doc.get("error")) != "missing":
        raise Error("Provider returned error in successful HTTP response")
    var choices = doc.get("choices")
    if doc.kind(choices) != "array" or doc.size(choices) == 0:
        raise Error("Provider missing choices")
    var choice = doc.at(0, choices)
    var message_node = doc.get("message", choice)
    if doc.kind(message_node) != "object" or _optional_string(doc, "role", message_node) != "assistant":
        raise Error("Provider missing assistant message")
    var blocks = List[ContentBlock]()
    var text = _optional_string(doc, "content", message_node)
    if text != "":
        blocks.append(ContentBlock.text_block(text))
    var thinking = _optional_string(doc, "reasoning_content", message_node)
    if thinking != "":
        blocks.append(ContentBlock.thinking_block(thinking))
    var calls = doc.get("tool_calls", message_node)
    if calls >= 0 and doc.kind(calls) != "array" and doc.kind(calls) != "null":
        raise Error("Provider invalid tool calls")
    if doc.kind(calls) == "array":
        for i in range(doc.size(calls)):
            var call = doc.at(i, calls)
            if _optional_string(doc, "type", call) != "function":
                raise Error("Provider unsupported tool call type")
            var function = doc.get("function", call)
            var id = doc.string(doc.get("id", call))
            var name = doc.string(doc.get("name", function))
            var arguments = doc.string(doc.get("arguments", function))
            if id == "" or name == "":
                raise Error("Provider empty tool call identity")
            var parsed = JsonDocument(arguments)
            if parsed.kind(0) != "object":
                raise Error("Provider tool arguments must be an object")
            blocks.append(ContentBlock.tool_call_block(ToolCall(id, name, arguments)))
    var finish = doc.string(doc.get("finish_reason", choice))
    var reason = StopReason.STOP
    var error_message = String()
    if finish == "length":
        reason = StopReason.LENGTH
    elif finish == "tool_calls" or finish == "function_call":
        reason = StopReason.TOOL_USE
        if doc.size(calls) == 0:
            raise Error("Provider tool finish without calls")
    elif finish != "stop" and finish != "end":
        reason = StopReason.ERROR
        error_message = "Provider finish_reason: " + finish
    var message = Message.assistant(blocks^, reason)
    var usage = doc.get("usage")
    if usage >= 0 and doc.kind(usage) != "object" and doc.kind(usage) != "null":
        raise Error("Provider invalid usage")
    var prompt = _tokens(doc, "prompt_tokens", usage)
    var output = _tokens(doc, "completion_tokens", usage)
    var details = doc.get("prompt_tokens_details", usage)
    var cached = _tokens(doc, "cached_tokens", details)
    if doc.get("cached_tokens", details) < 0:
        cached = _tokens(doc, "prompt_cache_hit_tokens", usage)
    var written = _tokens(doc, "cache_write_tokens", details)
    cached = max(0, cached - written)
    message.usage = Usage(max(0, max(0, prompt - written) - cached), output, cached, written)
    message.response_id = _optional_string(doc, "id")
    message.response_model = _optional_string(doc, "model")
    message.error_message = error_message
    message.api = "openai-completions"
    return ModelResponse(message^)


struct _Receive(Movable):
    var storage: List[UInt8]
    var count: Int
    var limit: Int
    def __init__(out self, limit: Int):
        self.storage = List[UInt8](length=limit, fill=UInt8(0))
        self.count = 0
        self.limit = limit


@export
def _prime_provider_receive(data: BytePtr, size: UInt64, count: UInt64, user: BytePtr) abi("C") -> UInt64:
    ref buffer = user.unsafe_bitcast[_Receive]()[]
    if size != 1 or count > UInt64(buffer.limit - buffer.count):
        return 0
    for i in range(Int(count)):
        buffer.storage[buffer.count + i] = data[unsafe_offset=i]
    buffer.count += Int(count)
    return count


def _checked(code: Int32) raises:
    if code != 0:
        raise Error("libcurl option failure " + String(code))


def complete(config: ProviderConfig, messages_json: String, tools_json: String = "[]") raises -> ModelResponse:
    if not (config.endpoint.startswith("http://") or config.endpoint.startswith("https://")) or "\x00" in config.endpoint:
        raise Error("Provider endpoint must explicitly use HTTP or HTTPS")
    if config.model == "" or config.api_key == "" or "\r" in config.api_key or "\n" in config.api_key or "\x00" in config.api_key:
        raise Error("Provider model and safe API key are required")
    if config.timeout_ms <= 0 or config.max_response_bytes <= 0 or config.max_response_bytes > 8388608:
        raise Error("Provider invalid bounds")
    var messages = JsonDocument(messages_json)
    var tools = JsonDocument(tools_json)
    if messages.kind(0) != "array" or tools.kind(0) != "array":
        raise Error("Provider messages and tools must be arrays")
    var body = '{"model":' + json_quote(config.model) + ',"stream":false,"messages":' + messages_json
    if tools.size() > 0:
        body += ',"tools":' + tools_json
    body += "}"
    var lib = OwnedDLHandle("libcurl.so.4")
    var curl = lib.call["curl_easy_init", Handle]()
    if not curl:
        raise Error("libcurl initialization failed")
    var content_type = _c_string("Content-Type: application/json")
    var headers = lib.call["curl_slist_append", Handle](Handle(), content_type.unsafe_ptr())
    if not headers:
        lib.call["curl_easy_cleanup", NoneType](curl)
        raise Error("libcurl header allocation failed")
    var authorization = _c_string("Authorization: Bearer " + config.api_key)
    var next = lib.call["curl_slist_append", Handle](headers, authorization.unsafe_ptr())
    if not next:
        lib.call["curl_slist_free_all", NoneType](headers)
        lib.call["curl_easy_cleanup", NoneType](curl)
        raise Error("libcurl header allocation failed")
    headers = next
    var receive = _Receive(config.max_response_bytes)
    var endpoint = _c_string(config.endpoint)
    var request = _c_string(body)
    try:
        _checked(lib.call["curl_easy_setopt", Int32](curl, Int32(10002), endpoint.unsafe_ptr()))
        _checked(lib.call["curl_easy_setopt", Int32](curl, Int32(10023), headers))
        _checked(lib.call["curl_easy_setopt", Int32](curl, Int32(60), Int64(body.byte_length())))
        _checked(lib.call["curl_easy_setopt", Int32](curl, Int32(10165), request.unsafe_ptr()))
        _checked(lib.call["curl_easy_setopt", Int32](curl, Int32(155), Int64(config.timeout_ms)))
        _checked(lib.call["curl_easy_setopt", Int32](curl, Int32(99), Int64(1)))
        _checked(lib.call["curl_easy_setopt", Int32](curl, Int32(20011), _prime_provider_receive))
        _checked(lib.call["curl_easy_setopt", Int32](curl, Int32(10001), Pointer(to=receive).unsafe_bitcast[UInt8]()))
        var code = lib.call["curl_easy_perform", Int32](curl)
        if code != 0:
            raise Error("Provider transport failure " + String(code))
        var status = Int64(0)
        _checked(lib.call["curl_easy_getinfo", Int32](curl, Int32(0x200002), Pointer(to=status)))
        var bytes = List[UInt8]()
        for i in range(receive.count):
            bytes.append(receive.storage[i])
        var result = parse_response(String(unsafe_from_utf8=bytes^), Int(status))
        result.message.model = config.model
        return result^
    finally:
        lib.call["curl_slist_free_all", NoneType](headers)
        lib.call["curl_easy_cleanup", NoneType](curl)

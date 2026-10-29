"""Native values shared by the agent reducer and provider adapters."""

from std.math import isfinite
from std.sys import size_of

struct Role(Copyable, Movable, ImplicitlyCopyable, Equatable):
    var tag: Int
    comptime USER = Self(0)
    comptime ASSISTANT = Self(1)
    comptime TOOL_RESULT = Self(2)

    def __init__(out self, tag: Int = 0):
        self.tag = tag

    def __eq__(self, other: Self) -> Bool:
        return self.tag == other.tag

    def __ne__(self, other: Self) -> Bool:
        return self.tag != other.tag

    def wire_name(self) -> String:
        if self == Self.ASSISTANT:
            return "assistant"
        if self == Self.TOOL_RESULT:
            return "toolResult"
        return "user"


struct ContentKind(Copyable, Movable, ImplicitlyCopyable, Equatable):
    var tag: Int
    comptime TEXT = Self(0)
    comptime THINKING = Self(1)
    comptime IMAGE = Self(2)
    comptime TOOL_CALL = Self(3)

    def __init__(out self, tag: Int = 0):
        self.tag = tag

    def __eq__(self, other: Self) -> Bool:
        return self.tag == other.tag

    def __ne__(self, other: Self) -> Bool:
        return self.tag != other.tag

    def wire_name(self) -> String:
        if self == Self.THINKING:
            return "thinking"
        if self == Self.IMAGE:
            return "image"
        if self == Self.TOOL_CALL:
            return "toolCall"
        return "text"


struct StopReason(Copyable, Movable, ImplicitlyCopyable, Equatable):
    var tag: Int
    comptime STOP = Self(0)
    comptime LENGTH = Self(1)
    comptime TOOL_USE = Self(2)
    comptime ERROR = Self(3)
    comptime ABORTED = Self(4)

    def __init__(out self, tag: Int = 0):
        self.tag = tag

    def __eq__(self, other: Self) -> Bool:
        return self.tag == other.tag

    def __ne__(self, other: Self) -> Bool:
        return self.tag != other.tag

    def wire_name(self) -> String:
        if self == Self.LENGTH:
            return "length"
        if self == Self.TOOL_USE:
            return "toolUse"
        if self == Self.ERROR:
            return "error"
        if self == Self.ABORTED:
            return "aborted"
        return "stop"


struct ToolCall(Copyable, Movable):
    var id: String
    var name: String
    var arguments_json: String
    var thought_signature: String

    def __init__(out self, var id: String = "", var name: String = "", var arguments_json: String = "{}", var thought_signature: String = ""):
        self.id = id^
        self.name = name^
        self.arguments_json = arguments_json^
        self.thought_signature = thought_signature^


struct ContentBlock(Copyable, Movable):
    var kind: ContentKind
    var text: String
    var data: String
    var mime_type: String
    var signature: String
    var redacted: Bool
    var tool_call: ToolCall

    def __init__(out self, kind: ContentKind = ContentKind.TEXT, var text: String = "", var data: String = "", var mime_type: String = "", var signature: String = "", redacted: Bool = False, var tool_call: ToolCall = ToolCall()):
        self.kind = kind
        self.text = text^
        self.data = data^
        self.mime_type = mime_type^
        self.signature = signature^
        self.redacted = redacted
        self.tool_call = tool_call^

    @staticmethod
    def text_block(var text: String, var signature: String = "") -> Self:
        return Self(text=text^, signature=signature^)

    @staticmethod
    def thinking_block(var text: String, var signature: String = "", redacted: Bool = False) -> Self:
        return Self(kind=ContentKind.THINKING, text=text^, signature=signature^, redacted=redacted)

    @staticmethod
    def image_block(var data: String, var mime_type: String) -> Self:
        return Self(kind=ContentKind.IMAGE, data=data^, mime_type=mime_type^)

    @staticmethod
    def tool_call_block(var call: ToolCall) -> Self:
        return Self(kind=ContentKind.TOOL_CALL, tool_call=call^)


struct Usage(Copyable, Movable, ImplicitlyCopyable):
    comptime MAX_TOKENS = (1 << (size_of[Int]() * 8 - 1)) - 1
    var input: Int
    var output: Int
    var cache_read: Int
    var cache_write: Int
    var cost: Float64

    def __init__(out self, input: Int = 0, output: Int = 0, cache_read: Int = 0, cache_write: Int = 0, cost: Float64 = 0):
        self.input = input
        self.output = output
        self.cache_read = cache_read
        self.cache_write = cache_write
        self.cost = cost

    def total_tokens(self) -> Int:
        return self.input + self.output + self.cache_read + self.cache_write

    def add(mut self, other: Self):
        self.input += other.input
        self.output += other.output
        self.cache_read += other.cache_read
        self.cache_write += other.cache_write
        self.cost += other.cost

    def valid(self) -> Bool:
        if self.input < 0 or self.output < 0 or self.cache_read < 0 or self.cache_write < 0 or self.cost < 0 or not isfinite(self.cost):
            return False
        var remaining = Self.MAX_TOKENS - self.input
        if self.output > remaining:
            return False
        remaining -= self.output
        if self.cache_read > remaining:
            return False
        return self.cache_write <= remaining - self.cache_read

    def can_add(self, other: Self) -> Bool:
        if not self.valid() or not other.valid():
            return False
        return other.total_tokens() <= Self.MAX_TOKENS - self.total_tokens() and isfinite(self.cost + other.cost)


struct Message(Copyable, Movable):
    var role: Role
    var content: List[ContentBlock]
    var timestamp: Int
    var tool_call_id: String
    var tool_name: String
    var is_error: Bool
    var details_json: String
    var usage: Usage
    var stop_reason: StopReason
    var api: String
    var provider: String
    var model: String
    var response_model: String
    var response_id: String
    var error_message: String

    def __init__(out self, role: Role = Role.USER, var content: List[ContentBlock] = List[ContentBlock](), timestamp: Int = 0):
        self.role = role
        self.content = content^
        self.timestamp = timestamp
        self.tool_call_id = ""
        self.tool_name = ""
        self.is_error = False
        self.details_json = ""
        self.usage = Usage()
        self.stop_reason = StopReason.STOP
        self.api = ""
        self.provider = ""
        self.model = ""
        self.response_model = ""
        self.response_id = ""
        self.error_message = ""

    @staticmethod
    def user(var text: String, timestamp: Int = 0) -> Self:
        var content = List[ContentBlock]()
        content.append(ContentBlock.text_block(text^))
        return Self(Role.USER, content^, timestamp)

    @staticmethod
    def assistant(var content: List[ContentBlock], stop_reason: StopReason = StopReason.STOP, timestamp: Int = 0) -> Self:
        var result = Self(Role.ASSISTANT, content^, timestamp)
        result.stop_reason = stop_reason
        return result^

    @staticmethod
    def tool_result(var call_id: String, var name: String, var content: List[ContentBlock], is_error: Bool = False, timestamp: Int = 0) -> Self:
        var result = Self(Role.TOOL_RESULT, content^, timestamp)
        result.tool_call_id = call_id^
        result.tool_name = name^
        result.is_error = is_error
        return result^

    def tool_calls(self) -> List[ToolCall]:
        var calls = List[ToolCall]()
        for block in self.content:
            if block.kind == ContentKind.TOOL_CALL:
                calls.append(block.tool_call.copy())
        return calls^

    def text(self) -> String:
        var parts = List[String]()
        for block in self.content:
            if block.kind == ContentKind.TEXT:
                parts.append(block.text.copy())
        return " ".join(parts)


struct ToolResult(Copyable, Movable):
    var call_id: String
    var name: String
    var content: List[ContentBlock]
    var is_error: Bool
    var details_json: String
    var terminate: Bool

    def __init__(out self, var call_id: String = "", var name: String = "", var content: List[ContentBlock] = List[ContentBlock](), is_error: Bool = False, var details_json: String = "", terminate: Bool = False):
        self.call_id = call_id^
        self.name = name^
        self.content = content^
        self.is_error = is_error
        self.details_json = details_json^
        self.terminate = terminate

    def to_message(self, timestamp: Int = 0) -> Message:
        var result = Message.tool_result(self.call_id.copy(), self.name.copy(), self.content.copy(), self.is_error, timestamp)
        result.details_json = self.details_json.copy()
        return result^


struct ToolDefinition(Copyable, Movable):
    var name: String
    var description: String
    var parameters_json: String

    def __init__(out self, var name: String = "", var description: String = "", var parameters_json: String = "{}"):
        self.name = name^
        self.description = description^
        self.parameters_json = parameters_json^


struct Model(Copyable, Movable):
    var id: String
    var provider: String
    var api: String
    var base_url: String
    var context_window: Int
    var max_tokens: Int

    def __init__(out self, var id: String = "", var provider: String = "", var api: String = "", var base_url: String = "", context_window: Int = 0, max_tokens: Int = 0):
        self.id = id^
        self.provider = provider^
        self.api = api^
        self.base_url = base_url^
        self.context_window = context_window
        self.max_tokens = max_tokens


struct Context(Copyable, Movable):
    var system_prompt: String
    var messages: List[Message]
    var tools: List[ToolDefinition]

    def __init__(out self, var system_prompt: String = "", var messages: List[Message] = List[Message](), var tools: List[ToolDefinition] = List[ToolDefinition]()):
        self.system_prompt = system_prompt^
        self.messages = messages^
        self.tools = tools^


struct ModelResponse(Copyable, Movable):
    var message: Message

    def __init__(out self, var message: Message = Message()):
        self.message = message^


struct Budget(Copyable, Movable, ImplicitlyCopyable):
    var max_turns: Int
    var max_tool_calls: Int
    var max_tokens: Int
    var max_cost: Float64

    def __init__(out self, max_turns: Int = 32, max_tool_calls: Int = 128, max_tokens: Int = 262144, max_cost: Float64 = 0):
        self.max_turns = max_turns
        self.max_tool_calls = max_tool_calls
        self.max_tokens = max_tokens
        self.max_cost = max_cost

    def valid(self) -> Bool:
        return self.max_turns >= 0 and self.max_tool_calls >= 0 and self.max_tokens >= 0 and self.max_cost >= 0 and isfinite(self.max_cost)

    def exhausted(self, turns: Int, tool_calls: Int, usage: Usage) -> Bool:
        return (self.max_turns > 0 and turns >= self.max_turns) or (self.max_tool_calls > 0 and tool_calls >= self.max_tool_calls) or (self.max_tokens > 0 and usage.total_tokens() >= self.max_tokens) or (self.max_cost > 0 and usage.cost >= self.max_cost)


struct EventKind(Copyable, Movable, ImplicitlyCopyable, Equatable):
    var tag: Int
    comptime AGENT_START = Self(0)
    comptime AGENT_END = Self(1)
    comptime TURN_START = Self(2)
    comptime TURN_END = Self(3)
    comptime MESSAGE_START = Self(4)
    comptime MESSAGE_UPDATE = Self(5)
    comptime MESSAGE_END = Self(6)
    comptime TOOL_EXECUTION_START = Self(7)
    comptime TOOL_EXECUTION_UPDATE = Self(8)
    comptime TOOL_EXECUTION_END = Self(9)
    comptime ERROR = Self(10)
    comptime CANCELLED = Self(11)
    comptime BUDGET_EXHAUSTED = Self(12)

    def __init__(out self, tag: Int = 0):
        self.tag = tag

    def __eq__(self, other: Self) -> Bool:
        return self.tag == other.tag

    def __ne__(self, other: Self) -> Bool:
        return self.tag != other.tag


struct AgentEvent(Copyable, Movable):
    var kind: EventKind
    var turn: Int
    var message: Message
    var tool_call: ToolCall
    var tool_result: ToolResult
    var error_message: String

    def __init__(out self, kind: EventKind = EventKind.AGENT_START, turn: Int = 0, var message: Message = Message(), var tool_call: ToolCall = ToolCall(), var tool_result: ToolResult = ToolResult(), var error_message: String = ""):
        self.kind = kind
        self.turn = turn
        self.message = message^
        self.tool_call = tool_call^
        self.tool_result = tool_result^
        self.error_message = error_message^

from harness.types import AgentEvent, Budget, ContentBlock, Context, EventKind, Message, ModelResponse, Role, StopReason, ToolCall, ToolDefinition, ToolResult, Usage


@fieldwise_init
struct TurnStatus(Copyable, Movable, ImplicitlyCopyable):
    var tag: Int
    comptime IDLE = Self(0)
    comptime PROVIDER_READY = Self(1)
    comptime PROVIDER_PENDING = Self(2)
    comptime TOOLS_PENDING = Self(3)
    comptime COMPLETE = Self(4)
    comptime FAILED = Self(5)
    comptime CANCELLED = Self(6)
    comptime BUDGET_EXHAUSTED = Self(7)


@fieldwise_init
struct ProviderRequest(Copyable, Movable):
    var request_id: Int
    var turn: Int
    var context: Context


@fieldwise_init
struct PendingTool(Copyable, Movable):
    var call: ToolCall
    var dispatched: Bool
    var result: Optional[ToolResult]


struct AgentState(Copyable, Movable):
    var system_prompt: String
    var tools: List[ToolDefinition]
    var budget: Budget
    var max_history: Int
    var max_events: Int
    var messages: List[Message]
    var events: List[AgentEvent]
    var usage: Usage
    var failure: String
    var status: TurnStatus
    var turn: Int
    var provider_calls: Int
    var tool_calls: Int
    var pending: List[PendingTool]
    var request_id: Int
    var event_count: Int
    var _turn_open: Bool
    var _assistant: Message

    def __init__(out self, system_prompt: String = "", tools: List[ToolDefinition] = List[ToolDefinition](), budget: Budget = Budget(), max_history: Int = 1024, max_events: Int = 4096):
        self.system_prompt = system_prompt
        self.tools = tools.copy()
        self.budget = budget
        self.max_history = max_history
        self.max_events = max_events
        self.messages = List[Message]()
        self.events = List[AgentEvent]()
        self.usage = Usage()
        self.failure = ""
        self.status = TurnStatus.IDLE
        self.turn = 0
        self.provider_calls = 0
        self.tool_calls = 0
        self.pending = List[PendingTool]()
        self.request_id = 0
        self.event_count = 0
        self._turn_open = False
        self._assistant = Message()

    def is_terminal(self) -> Bool:
        return self.status.tag >= TurnStatus.COMPLETE.tag

    def has_pending_work(self) -> Bool:
        return self.status.tag >= TurnStatus.PROVIDER_READY.tag and self.status.tag <= TurnStatus.TOOLS_PENDING.tag

    def restore_messages(mut self, history: List[Message]) raises:
        if self.has_pending_work():
            raise Error("Cannot restore messages while processing")
        if len(history) > self.max_history:
            raise Error("Message history limit reached")
        self.messages = history.copy()

    def _emit(mut self, kind: EventKind, message: Message = Message(), call: ToolCall = ToolCall(), result: ToolResult = ToolResult(), error: String = ""):
        self.event_count += 1
        if self.max_events <= 0:
            return
        if len(self.events) == self.max_events:
            _ = self.events.pop(0)
        self.events.append(AgentEvent(kind, self.turn, message.copy(), call.copy(), result.copy(), error))

    def drain_events(mut self) -> List[AgentEvent]:
        var drained = self.events^
        self.events = List[AgentEvent]()
        return drained^

    def _append_message(mut self, message: Message):
        self._emit(EventKind.MESSAGE_START, message.copy())
        self.messages.append(message.copy())
        self._emit(EventKind.MESSAGE_END, message.copy())

    def _end_turn(mut self):
        if self._turn_open:
            self._emit(EventKind.TURN_END, self._assistant.copy())
            self._turn_open = False

    def _finish(mut self, status: TurnStatus, error: String = ""):
        self._end_turn()
        self.status = status
        self.failure = error
        self._emit(EventKind.AGENT_END, error=error)

    def begin_turn(mut self, prompt: String) raises:
        if self.has_pending_work():
            raise Error("Agent is already processing")
        if self.max_history <= 0 or self.max_events < 0 or not self.budget.valid():
            raise Error("Invalid history, event, or budget limit")
        if len(self.messages) >= self.max_history:
            raise Error("Message history limit reached")
        self.usage = Usage()
        self.failure = ""
        self.provider_calls = 0
        self.tool_calls = 0
        self.pending.clear()
        self.turn = 1
        self._assistant = Message()
        self.status = TurnStatus.PROVIDER_READY
        self._turn_open = True
        self._emit(EventKind.AGENT_START)
        self._emit(EventKind.TURN_START)
        self._append_message(Message.user(prompt))

    def _budget_reason(self) -> String:
        if self.budget.max_turns > 0 and self.provider_calls >= self.budget.max_turns:
            return "Provider turn budget exhausted"
        if self.budget.max_tokens > 0 and self.usage.total_tokens() >= self.budget.max_tokens:
            return "Token budget exhausted"
        if self.budget.max_cost > 0 and self.usage.cost >= self.budget.max_cost:
            return "Cost budget exhausted"
        return ""

    def provider_request(mut self) raises -> ProviderRequest:
        if self.status.tag != TurnStatus.PROVIDER_READY.tag:
            raise Error("Provider request is not ready")
        var reason = self._budget_reason()
        if reason != "":
            self._emit(EventKind.BUDGET_EXHAUSTED, error=reason)
            self._finish(TurnStatus.BUDGET_EXHAUSTED, reason)
            raise Error(reason)
        if len(self.messages) >= self.max_history:
            self.fail("Message history limit reached")
            raise Error(self.failure)
        if not self._turn_open:
            self.turn += 1
            self._turn_open = True
            self._assistant = Message()
            self._emit(EventKind.TURN_START)
        self.provider_calls += 1
        self.request_id += 1
        self.status = TurnStatus.PROVIDER_PENDING
        return ProviderRequest(self.request_id, self.turn, Context(self.system_prompt.copy(), self.messages.copy(), self.tools.copy()))

    def apply_response(mut self, request_id: Int, response: ModelResponse) raises:
        if self.status.tag != TurnStatus.PROVIDER_PENDING.tag or request_id != self.request_id:
            raise Error("Unknown or stale provider response")
        var message = response.message.copy()
        if message.role.tag != Role.ASSISTANT.tag:
            raise Error("Provider response must be an assistant message")
        if not self.usage.can_add(message.usage):
            raise Error("Provider usage must be nonnegative and finite")
        var calls = message.tool_calls()
        for i in range(len(calls)):
            if calls[i].id == "" or calls[i].name == "":
                raise Error("Tool call must have an ID and name")
            for j in range(i):
                if calls[i].id == calls[j].id:
                    raise Error("Duplicate tool call ID")
        var executes_tools = message.stop_reason.tag != StopReason.ERROR.tag and message.stop_reason.tag != StopReason.ABORTED.tag
        if executes_tools and len(calls) > 0 and len(self.messages) + 1 + len(calls) > self.max_history:
            self._assistant = message.copy()
            self.usage.add(message.usage)
            self.fail("Message history limit reached")
            return
        self._append_message(message.copy())
        self._assistant = message.copy()
        self.usage.add(message.usage)
        if message.stop_reason.tag == StopReason.ERROR.tag:
            self._emit(EventKind.ERROR, error=message.error_message.copy())
            self._finish(TurnStatus.FAILED, message.error_message.copy())
            return
        if message.stop_reason.tag == StopReason.ABORTED.tag:
            self._emit(EventKind.CANCELLED, error=message.error_message.copy())
            self._finish(TurnStatus.CANCELLED, message.error_message.copy())
            return
        if len(calls) == 0:
            self._finish(TurnStatus.COMPLETE)
            return
        self.pending.clear()
        for call in calls:
            self.pending.append(PendingTool(call.copy(), False, Optional[ToolResult]()))
        self.status = TurnStatus.TOOLS_PENDING
        self.tool_calls += len(calls)
        if self.budget.max_tool_calls > 0 and self.tool_calls > self.budget.max_tool_calls:
            var reason = String("Tool call budget exhausted")
            self._abort_tools(reason)
            self._emit(EventKind.BUDGET_EXHAUSTED, error=reason)
            self._finish(TurnStatus.BUDGET_EXHAUSTED, reason)

    def pending_tools(self) -> List[ToolCall]:
        var calls = List[ToolCall]()
        if self.status.tag == TurnStatus.TOOLS_PENDING.tag:
            for slot in self.pending:
                if not slot.dispatched and not slot.result:
                    calls.append(slot.call.copy())
        return calls^

    def take_pending_tools(mut self) raises -> List[ToolCall]:
        if self.status.tag != TurnStatus.TOOLS_PENDING.tag:
            raise Error("Tool work is not ready")
        var calls = self.pending_tools()
        for ref slot in self.pending:
            if not slot.dispatched and not slot.result:
                slot.dispatched = True
                self._emit(EventKind.TOOL_EXECUTION_START, call=slot.call.copy())
        return calls^

    def apply_tool_result(mut self, result: ToolResult, request_id: Int = 0) raises:
        if self.status.tag != TurnStatus.TOOLS_PENDING.tag:
            raise Error("Tool results are not expected")
        if request_id != 0 and request_id != self.request_id:
            raise Error("Unknown or stale tool result")
        var found = -1
        for i in range(len(self.pending)):
            if self.pending[i].call.id == result.call_id:
                found = i
                break
        if found < 0:
            raise Error("Unknown tool call ID")
        if self.pending[found].result:
            raise Error("Duplicate tool result")
        if not self.pending[found].dispatched:
            raise Error("Tool call has not been dispatched")
        if self.pending[found].call.name != result.name:
            raise Error("Tool result name does not match its call")
        self.pending[found].result = Optional(result.copy())
        self._emit(EventKind.TOOL_EXECUTION_END, call=self.pending[found].call.copy(), result=result.copy())
        for slot in self.pending:
            if not slot.result:
                return
        var terminate = True
        for slot in self.pending:
            terminate = terminate and slot.result.value().terminate
        self._flush_tools()
        self._end_turn()
        if terminate:
            self._finish(TurnStatus.COMPLETE)
        else:
            self.status = TurnStatus.PROVIDER_READY

    def _flush_tools(mut self):
        for slot in self.pending:
            if slot.result:
                self._append_message(slot.result.value().to_message())
        self.pending.clear()

    def _abort_tools(mut self, reason: String):
        for i in range(len(self.pending)):
            if not self.pending[i].result:
                var result = ToolResult(self.pending[i].call.id.copy(), self.pending[i].call.name.copy(), [ContentBlock.text_block(reason)], True)
                self.pending[i].result = Optional(result.copy())
                self._emit(EventKind.TOOL_EXECUTION_END, call=self.pending[i].call.copy(), result=result^)
        self._flush_tools()

    def cancel(mut self, reason: String = "Cancelled") raises:
        if self.is_terminal():
            return
        self._abort_tools("Tool execution aborted")
        self._emit(EventKind.CANCELLED, error=reason)
        self._finish(TurnStatus.CANCELLED, reason)

    def fail(mut self, reason: String) raises:
        if not self.has_pending_work():
            return
        self._abort_tools(reason)
        self._emit(EventKind.ERROR, error=reason)
        self._finish(TurnStatus.FAILED, reason)

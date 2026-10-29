"""Actor-owned conversations with explicit provider and tool effect boundaries."""

from harness.engine import AgentState, ProviderRequest, TurnStatus
from harness.types import Budget, Message, ModelResponse, ToolCall, ToolDefinition, ToolResult
from runtime.actors import ActorId, ActorSnapshot, ActorSystem, Message as ActorMessage


struct SessionState(Copyable, Movable):
    var agent: AgentState
    var depth: Int
    var request: Optional[ProviderRequest]
    var tools: List[ToolCall]

    def __init__(out self, var agent: AgentState, depth: Int = 0):
        self.agent = agent^
        self.depth = depth
        self.request = Optional[ProviderRequest]()
        self.tools = List[ToolCall]()

    def advance(mut self) raises:
        if self.agent.status.tag == TurnStatus.PROVIDER_READY.tag:
            try:
                self.request = Optional(self.agent.provider_request())
            except error:
                if not self.agent.is_terminal():
                    raise error
                self.request = Optional[ProviderRequest]()
        elif self.agent.status.tag == TurnStatus.TOOLS_PENDING.tag:
            var ready = self.agent.take_pending_tools()
            for call in ready:
                self.tools.append(call.copy())


struct SessionCommand(Copyable, Movable):
    var kind: Int
    var text: String
    var request_id: Int
    var response: ModelResponse
    var result: ToolResult
    var history: List[Message]

    def __init__(out self, kind: Int, var text: String = "", request_id: Int = 0, var response: ModelResponse = ModelResponse(), var result: ToolResult = ToolResult(), var history: List[Message] = List[Message]()):
        self.kind = kind
        self.text = text^
        self.request_id = request_id
        self.response = response^
        self.result = result^
        self.history = history^


def _apply_command(mut state: SessionState, command: SessionCommand) raises:
    if command.kind == 0:
        state.agent.begin_turn(command.text.copy())
        state.advance()
    elif command.kind == 1:
        state.agent.apply_response(command.request_id, command.response.copy())
        state.request = Optional[ProviderRequest]()
        state.advance()
    elif command.kind == 2:
        state.agent.apply_tool_result(command.result.copy(), command.request_id)
        for i in range(len(state.tools)):
            if state.tools[i].id == command.result.call_id:
                _ = state.tools.pop(i)
                break
        state.advance()
    elif command.kind == 3:
        state.agent.cancel(command.text.copy())
        state.request = Optional[ProviderRequest]()
        state.tools.clear()
    elif command.kind == 4:
        state.agent.restore_messages(command.history.copy())
    else:
        raise Error("Unknown session command")


struct AgentSessions(Movable):
    var actors: ActorSystem[SessionState]
    var ids: List[ActorId]
    var max_depth: Int
    var max_agents: Int

    def __init__(out self, mailbox_capacity: Int = 20, max_depth: Int = 8, max_agents: Int = 128) raises:
        if max_depth < 0 or max_agents <= 0:
            raise Error("Invalid actor session limits")
        self.actors = ActorSystem[SessionState](mailbox_capacity)
        self.ids = List[ActorId]()
        self.max_depth = max_depth
        self.max_agents = max_agents

    def _check_capacity(self) raises:
        if len(self.ids) >= self.max_agents:
            raise Error("Agent count limit reached")

    def spawn_root(mut self, name: String, system_prompt: String = "", tools: List[ToolDefinition] = List[ToolDefinition](), budget: Budget = Budget()) raises -> ActorId:
        self._check_capacity()
        var state = SessionState(AgentState(system_prompt, tools, budget))
        var actor = self.actors.spawn(name, state^)
        self.ids.append(actor)
        return actor

    def spawn_child(mut self, parent: ActorId, name: String) raises -> ActorId:
        self._check_capacity()
        var ancestor = self.actors.snapshot(parent)
        var depth = ancestor.state.depth + 1
        if depth > self.max_depth:
            raise Error("Agent depth limit reached")
        var source = ancestor.state.agent.copy()
        var state = SessionState(AgentState(source.system_prompt.copy(), source.tools.copy(), source.budget, source.max_history, source.max_events), depth)
        var actor = self.actors.spawn(name, state^, Optional(parent))
        self.ids.append(actor)
        return actor

    def begin_turn(mut self, actor: ActorId, prompt: String) raises:
        self.actors.schedule_command(actor, SessionCommand(0, prompt), _apply_command)

    def restore_messages(mut self, actor: ActorId, history: List[Message]) raises:
        self.actors.schedule_command(actor, SessionCommand(4, history=history.copy()), _apply_command)

    def apply_response(mut self, actor: ActorId, request_id: Int, response: ModelResponse) raises:
        self.actors.schedule_command(actor, SessionCommand(1, request_id=request_id, response=response.copy()), _apply_command)

    def apply_tool_result(mut self, actor: ActorId, request_id: Int, result: ToolResult) raises:
        self.actors.schedule_command(actor, SessionCommand(2, request_id=request_id, result=result.copy()), _apply_command)

    def cancel(mut self, actor: ActorId, reason: String = "Cancelled") raises:
        var current = self.actors.snapshot(actor)
        if current.status == "completed" or current.status == "cancelled" or current.status == "failed":
            return
        self.actors.schedule_command(actor, SessionCommand(3, reason), _apply_command)

    def snapshot(self, actor: ActorId) raises -> ActorSnapshot[SessionState]:
        return self.actors.snapshot(actor)

    def provider_request(self, actor: ActorId) raises -> Optional[ProviderRequest]:
        return self.actors.snapshot(actor).state.request.copy()

    def pending_tools(self, actor: ActorId) raises -> List[ToolCall]:
        return self.actors.snapshot(actor).state.tools.copy()

    def send(mut self, sender: ActorId, target: ActorId, body: String) raises:
        self.actors.send(sender, target, body)

    def receive(mut self, actor: ActorId) raises -> Optional[ActorMessage]:
        return self.actors.receive(actor)

    def join(self, actor: ActorId) raises -> Optional[String]:
        var current = self.actors.snapshot(actor)
        if current.status == "failed":
            raise Error(current.result)
        if current.state.agent.status.tag == TurnStatus.COMPLETE.tag:
            return Optional(current.result.copy())
        if current.state.agent.is_terminal():
            raise Error(current.state.agent.failure)
        return Optional[String]()

    def _settle(mut self) raises:
        for actor in self.ids:
            var current = self.actors.snapshot(actor)
            if current.status != "ready":
                continue
            if current.state.agent.status.tag == TurnStatus.CANCELLED.tag:
                _ = self.actors.cancel(actor)
            elif current.state.agent.is_terminal():
                var result = current.state.agent.failure.copy()
                if current.state.agent.status.tag == TurnStatus.COMPLETE.tag:
                    var messages = current.state.agent.messages.copy()
                    if len(messages) > 0:
                        result = messages[len(messages) - 1].text()
                self.actors.finish(actor, result)

    def step(mut self) raises -> Bool:
        var progressed = self.actors.step()
        self._settle()
        return progressed

    def run(mut self, workers: Int = 4) raises:
        self.actors.run(workers)
        self._settle()

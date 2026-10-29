"""Native command-line composition of actor sessions and explicit effects."""
from std.collections import List
from std.ffi import external_call
from std.os import getenv
from std.sys import argv
from harness.sessions import AgentSessions
from harness.types import Budget, ContentBlock, Message, ModelResponse, StopReason, ToolCall, ToolDefinition, ToolResult
from interfaces.json import JsonDocument, json_quote
from interfaces.options import CliOptions, parse_options, print_help
from interfaces.provider import ProviderConfig, complete, parse_response, serialize_messages, serialize_tools
from interfaces.sessions import load_session, save_session
from interfaces.tools import ToolPolicy, execute_tool, read_file, workspace_root
from runtime.actors import ActorId


def tool_definitions(options: CliOptions) -> List[ToolDefinition]:
    var tools = List[ToolDefinition]()
    tools.append(ToolDefinition("read", "Read a UTF-8 file under the workspace", '{"type":"object","properties":{"path":{"type":"string"}},"required":["path"]}'))
    if options.allow_write:
        tools.append(ToolDefinition("write", "Write a UTF-8 workspace file", '{"type":"object","properties":{"path":{"type":"string"},"content":{"type":"string"}},"required":["path","content"]}'))
        tools.append(ToolDefinition("edit", "Apply unique exact-text edits to a workspace file", '{"type":"object","properties":{"path":{"type":"string"},"edits":{"type":"array","items":{"type":"object","properties":{"oldText":{"type":"string"},"newText":{"type":"string"}},"required":["oldText","newText"]}}},"required":["path","edits"]}'))
    if options.allow_shell:
        tools.append(ToolDefinition("bash", "Run a shell command with local user authority", '{"type":"object","properties":{"command":{"type":"string"}},"required":["command"]}'))
    tools.append(ToolDefinition("spawn_agent", "Spawn a child conversation sharing tool permissions and model configuration", '{"type":"object","properties":{"name":{"type":"string"},"prompt":{"type":"string"}},"required":["name","prompt"]}'))
    tools.append(ToolDefinition("send_message", "Send a message to another active agent mailbox", '{"type":"object","properties":{"agent_id":{"type":"integer"},"message":{"type":"string"}},"required":["agent_id","message"]}'))
    tools.append(ToolDefinition("receive_message", "Receive the oldest message from this agent mailbox, or null", '{"type":"object","properties":{}}'))
    tools.append(ToolDefinition("wait_agent", "Wait for a descendant agent and return its retained final result", '{"type":"object","properties":{"agent_id":{"type":"integer"}},"required":["agent_id"]}'))
    tools.append(ToolDefinition("cancel_agent", "Cancel a descendant agent and its descendants", '{"type":"object","properties":{"agent_id":{"type":"integer"}},"required":["agent_id"]}'))
    return tools^


@fieldwise_init
struct PendingWait(Copyable, Movable):
    var owner: ActorId
    var target: ActorId
    var request_id: Int
    var call: ToolCall


def _result(call: ToolCall, text: String, failed: Bool = False) -> ToolResult:
    return ToolResult(call.id.copy(), call.name.copy(), [ContentBlock.text_block(text)], failed)


def _descendant(sessions: AgentSessions, owner: ActorId, target: ActorId) raises -> Bool:
    var current = sessions.snapshot(target)
    while current.parent:
        if current.parent.value() == owner:
            return True
        current = sessions.snapshot(current.parent.value())
    return False


def _actor_id(sessions: AgentSessions, value: Int) raises -> ActorId:
    for actor in sessions.ids:
        if actor.value == value:
            return actor
    raise Error("agent tool: unknown agent ID")


struct CliRunner(Movable):
    var options: CliOptions
    var policy: ToolPolicy
    var storage_policy: ToolPolicy
    var provider: ProviderConfig
    var fixtures: List[String]
    var fixture_index: Int
    var sessions: AgentSessions
    var waits: List[PendingWait]
    var seen_events: List[Int]

    def __init__(out self, options: CliOptions) raises:
        self.options = options.copy()
        var root = workspace_root(options.workspace)
        self.policy = ToolPolicy(root.copy(), options.allow_write, options.allow_shell)
        self.storage_policy = ToolPolicy(root.copy(), True, False, 8388608)
        var key = String("")
        if options.api_key_env != "":
            key = getenv(options.api_key_env)
            if key == "":
                raise Error("configuration: named API key environment variable is empty")
        self.provider = ProviderConfig(options.base_url.copy(), options.model.copy(), key^)
        self.fixtures = List[String]()
        self.fixture_index = 0
        self.sessions = AgentSessions()
        self.waits = List[PendingWait]()
        self.seen_events = List[Int]()
        if options.fixture != "":
            var doc = JsonDocument(read_file(self.storage_policy, options.fixture))
            if doc.kind(0) != "array" or doc.size() == 0:
                raise Error("fixture: expected nonempty response array")
            for i in range(doc.size()):
                self.fixtures.append(doc.raw(doc.at(i)))
        elif options.base_url == "":
            raise Error("configuration: choose --fixture or --base-url with --model")

    def _response(mut self, system_prompt: String, messages: List[Message], tools: List[ToolDefinition]) raises -> ModelResponse:
        if self.options.fixture != "":
            if self.fixture_index >= len(self.fixtures):
                raise Error("fixture: response array exhausted")
            var body = self.fixtures[self.fixture_index].copy()
            self.fixture_index += 1
            return parse_response(body)
        return complete(self.provider, serialize_messages(system_prompt, messages), serialize_tools(tools))

    def _emit(mut self, actor: ActorId) raises:
        while len(self.seen_events) <= actor.value:
            self.seen_events.append(0)
        if self.options.mode != "json":
            return
        var snapshot = self.sessions.snapshot(actor)
        var state = snapshot.state.agent.copy()
        var first = state.event_count - len(state.events)
        for i in range(len(state.events)):
            if first + i >= self.seen_events[actor.value]:
                var event = state.events[i].copy()
                print('{"type":"agent_event","agent_id":' + String(actor.value) + ',"kind":' + String(event.kind.tag) + ',"turn":' + String(event.turn) + ',"text":' + json_quote(event.message.text()) + ',"error":' + json_quote(event.error_message) + '}')
        self.seen_events[actor.value] = state.event_count

    def _cancel_tree(mut self, actor: ActorId) raises:
        var ids = self.sessions.ids.copy()
        for candidate in ids:
            if candidate == actor or _descendant(self.sessions, actor, candidate):
                self.sessions.cancel(candidate)
        self.sessions.run(1)

    def _dispatch(mut self, actor: ActorId, request_id: Int, call: ToolCall) raises:
        var result: ToolResult
        try:
            var doc = JsonDocument(call.arguments_json)
            if call.name == "spawn_agent":
                var name = doc.string(doc.get("name"))
                var prompt = doc.string(doc.get("prompt"))
                var child = self.sessions.spawn_child(actor, name)
                self.sessions.begin_turn(child, prompt)
                self.sessions.run(1)
                result = _result(call, '{"agent_id":' + String(child.value) + '}')
            elif call.name == "send_message":
                var target = _actor_id(self.sessions, doc.integer(doc.get("agent_id")))
                self.sessions.send(actor, target, doc.string(doc.get("message")))
                result = _result(call, "Message delivered")
            elif call.name == "receive_message":
                var message = self.sessions.receive(actor)
                var text = String("null")
                if message:
                    text = '{"sender":' + String(message.value().sender.value) + ',"message":' + json_quote(message.value().body) + '}'
                result = _result(call, text)
            elif call.name == "wait_agent" or call.name == "cancel_agent":
                var target = _actor_id(self.sessions, doc.integer(doc.get("agent_id")))
                if not _descendant(self.sessions, actor, target):
                    raise Error("agent tool: target must be a descendant")
                if call.name == "wait_agent":
                    self.waits.append(PendingWait(actor, target, request_id, call.copy()))
                    return
                self._cancel_tree(target)
                result = _result(call, "Agent cancelled")
            else:
                result = execute_tool(call, self.policy)
        except error:
            result = _result(call, String(error), True)
        self.sessions.apply_tool_result(actor, request_id, result)
        self.sessions.run(1)

    def _resolve_waits(mut self) raises -> Bool:
        var progressed = False
        var i = 0
        while i < len(self.waits):
            var wait = self.waits[i].copy()
            if self.sessions.snapshot(wait.owner).state.agent.is_terminal():
                _ = self.waits.pop(i)
                progressed = True
                continue
            var result = _result(wait.call, "")
            var ready = False
            try:
                var joined = self.sessions.join(wait.target)
                if joined:
                    result = _result(wait.call, joined.value())
                    ready = True
            except error:
                result = _result(wait.call, String(error), True)
                ready = True
            if ready:
                self.sessions.apply_tool_result(wait.owner, wait.request_id, result)
                self.sessions.run(1)
                _ = self.waits.pop(i)
                progressed = True
            else:
                i += 1
        return progressed

    def _waiting(self, actor: ActorId, call: ToolCall) -> Bool:
        for wait in self.waits:
            if wait.owner == actor and wait.call.id == call.id:
                return True
        return False

    def run_prompt(mut self, prompt: String, history: List[Message] = List[Message]()) raises -> List[Message]:
        var root = self.sessions.spawn_root("main-" + String(len(self.sessions.ids)), self.options.system_prompt.copy(), tool_definitions(self.options), Budget(max_turns=self.options.max_turns))
        try:
            if len(history) > 0:
                self.sessions.restore_messages(root, history)
            self.sessions.begin_turn(root, prompt)
            self.sessions.run(1)
            while True:
                var progressed = self._resolve_waits()
                var ids = self.sessions.ids.copy()
                for actor_ref in ids:
                    var actor = actor_ref
                    self._emit(actor)
                    var snapshot = self.sessions.snapshot(actor)
                    if snapshot.state.agent.is_terminal():
                        continue
                    var request = self.sessions.provider_request(actor)
                    if request:
                        var value = request.value().copy()
                        var response: ModelResponse
                        try:
                            response = self._response(value.context.system_prompt, value.context.messages, value.context.tools)
                        except error:
                            var message = Message.assistant(List[ContentBlock](), StopReason.ERROR)
                            message.error_message = String(error)
                            response = ModelResponse(message^)
                        self.sessions.apply_response(actor, value.request_id, response)
                        self.sessions.run(1)
                        progressed = True
                    var calls = self.sessions.pending_tools(actor)
                    var request_id = self.sessions.snapshot(actor).state.agent.request_id
                    for call in calls:
                        if not self._waiting(actor, call):
                            self._dispatch(actor, request_id, call)
                            progressed = True
                    self._emit(actor)
                    if self.sessions.snapshot(root).state.agent.is_terminal():
                        break
                var done = self.sessions.snapshot(root)
                if done.state.agent.is_terminal():
                    var answer = self.sessions.join(root)
                    var messages = done.state.agent.messages.copy()
                    if self.options.session != "":
                        save_session(self.storage_policy, self.options.session, messages)
                    if answer:
                        if self.options.mode == "json":
                            print('{"type":"result","agent_id":' + String(root.value) + ',"text":' + json_quote(answer.value()) + '}')
                        else:
                            print(answer.value())
                    return messages^
                if not progressed:
                    raise Error("agent loop: no runnable work; unresolved wait cycle")
        finally:
            self._cancel_tree(root)
            self.waits.clear()
            self.sessions = AgentSessions()
            self.seen_events.clear()


def _read_prompt() raises -> Optional[String]:
    print("prime> ", end="")
    var bytes = List[UInt8]()
    while True:
        var value = external_call["getchar", Int32]()
        if value < 0:
            if len(bytes) == 0:
                return Optional[String]()
            break
        if value == 10:
            break
        if len(bytes) == 8388608:
            raise Error("input: prompt exceeds eight MiB")
        bytes.append(UInt8(value))
    if len(bytes) > 0 and bytes[len(bytes) - 1] == 13:
        _ = bytes.pop()
    return Optional(String(from_utf8=bytes^))


def run_cli() raises:
    var args = List[String]()
    for arg in argv():
        args.append(String(arg))
    var options = parse_options(args)
    if options.help:
        print_help()
        return
    if options.prompt == "" and not options.interactive:
        raise Error("configuration: prompt required; use --interactive for a terminal conversation")
    var runner = CliRunner(options)
    var history = List[Message]()
    if options.resume != "":
        history = load_session(runner.storage_policy, options.resume)
    if options.prompt != "":
        history = runner.run_prompt(options.prompt, history)
    if options.interactive:
        while True:
            var line = _read_prompt()
            if not line:
                break
            var prompt = line.value()
            if prompt == "/quit" or prompt == "/exit":
                break
            if prompt == "":
                continue
            history = runner.run_prompt(prompt, history)

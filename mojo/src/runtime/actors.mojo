"""Owned actor state, bounded family messages, and native scheduled callbacks."""

from vendor.boc import Acquired, Behavior, Cown, Scheduler


struct ActorId(ImplicitlyCopyable, Movable, Equatable, Writable):
    var value: Int
    var owner: Int
    var _identity: Optional[Cown]

    def __init__(out self, value: Int, owner: Int = 0):
        self.value = value
        self.owner = owner
        self._identity = None

    def __init__(out self, cown: Cown):
        self.value = cown.slot
        self.owner = cown.owner
        self._identity = cown

    def __init__(out self, *, copy: Self):
        self.value = copy.value
        self.owner = copy.owner
        self._identity = copy._identity.copy()

    def write_to(self, mut writer: Some[Writer]):
        writer.write(self.value)

    def write_repr_to(self, mut writer: Some[Writer]):
        writer.write("ActorId(", self.value, ", owner=", self.owner, ")")

    def __eq__(self, other: Self) -> Bool:
        return self.value == other.value and self.owner == other.owner

    def __ne__(self, other: Self) -> Bool:
        return not self == other


@fieldwise_init
struct Message(Copyable, Movable):
    var sender: ActorId
    var target: ActorId
    var body: String
    var sequence: Int


@fieldwise_init
struct ActorStatus(TrivialRegisterPassable):
    var value: Int

    def terminal(self) -> Bool:
        return self.value >= 2

    def text(self) -> String:
        if self.value == 0:
            return "ready"
        if self.value == 1:
            return "running"
        if self.value == 2:
            return "completed"
        if self.value == 3:
            return "cancelled"
        return "failed"


@fieldwise_init
struct ActorState[T: Copyable & Deinitable](Copyable, Movable):
    var id: ActorId
    var name: String
    var parent: Optional[ActorId]
    var status: ActorStatus
    var result: String
    var mailbox: List[Message]
    var state: Self.T

    def require_active(self) raises:
        if self.status.terminal():
            raise Error("actor is terminal")


@fieldwise_init
struct ActorSnapshot[T: Copyable & Deinitable](Copyable, Movable):
    var id: ActorId
    var name: String
    var status: String
    var result: String
    var mailbox_count: Int
    var state: Self.T
    var parent: Optional[ActorId]


struct ActorCommand[
    T: Copyable & Deinitable,
    P: Copyable & Deinitable,
](Behavior):
    comptime State = ActorState[Self.T]
    comptime Callback = def(mut Self.T, Self.P) raises thin -> None
    var cown: Cown
    var payload: Self.P
    var callback: Self.Callback

    def __init__(out self, cown: Cown, var payload: Self.P, callback: Self.Callback):
        self.cown = cown
        self.payload = payload^
        self.callback = callback

    def execute(mut self, mut acquired: Acquired[Self.State], payload: Int) raises:
        var owned = acquired.get(self.cown)
        if owned.status.terminal():
            return
        owned.status = ActorStatus(1)
        acquired.put(self.cown, owned.copy())
        try:
            self.callback(owned.state, self.payload)
        except e:
            owned.status = ActorStatus(4)
            owned.result = String(e)
            owned.mailbox.clear()
            acquired.put(self.cown, owned^)
            raise e
        owned.status = ActorStatus(0)
        acquired.put(self.cown, owned^)


struct ActorSystem[T: Copyable & Deinitable](Movable):
    var _scheduler: Scheduler[ActorState[Self.T]]
    var _actors: List[Cown]
    var _mailbox_capacity: Int
    var _sequence: Int

    def __init__(out self, mailbox_capacity: Int = 20) raises:
        if mailbox_capacity <= 0:
            raise Error("mailbox capacity must be positive")
        self._scheduler = Scheduler[ActorState[Self.T]]()
        self._actors = List[Cown]()
        self._mailbox_capacity = mailbox_capacity
        self._sequence = 0

    def _cown(self, actor: ActorId) raises -> Cown:
        if actor.value < 0 or actor.value >= len(self._actors):
            raise Error("unknown actor")
        var cown = self._actors[actor.value]
        if not actor._identity or actor.owner != cown.owner:
            raise Error("actor belongs to another system")
        var retained = actor._identity.value()
        if retained.owner != cown.owner or retained.slot != cown.slot or retained._identity.ptr() != cown._identity.ptr():
            raise Error("invalid actor identity")
        return cown

    def spawn(
        mut self, name: String, var state: Self.T,
        parent: Optional[ActorId] = None,
    ) raises -> ActorId:
        var clean_name = String(name.strip())
        if clean_name.byte_length() == 0:
            raise Error("actor name must not be empty")
        if parent:
            self._scheduler.inspect(self._cown(parent.value())).require_active()
        var actor = ActorId(len(self._actors))
        var owned = ActorState[Self.T](
            actor, clean_name^, parent.copy(), ActorStatus(0), "",
            List[Message](), state^,
        )
        var cown = self._scheduler.create(owned^)
        actor = ActorId(cown)
        var initialized = self._scheduler.inspect(cown)
        initialized.id = actor
        self._scheduler.replace(cown, initialized^)
        self._actors.append(cown)
        return actor

    def snapshot(self, actor: ActorId) raises -> ActorSnapshot[Self.T]:
        var owned = self._scheduler.inspect(self._cown(actor))
        return ActorSnapshot[Self.T](
            owned.id, owned.name.copy(), owned.status.text(),
            owned.result.copy(), len(owned.mailbox), owned.state.copy(),
            owned.parent.copy(),
        )

    def schedule(
        mut self, actor: ActorId,
        callback: ActorCommand[Self.T, Int].Callback,
        payload: Int = 0,
    ) raises:
        var cown = self._cown(actor)
        self._scheduler.inspect(cown).require_active()
        var command = ActorCommand[Self.T, Int](cown, payload, callback)
        var resources = List[Cown]()
        resources.append(cown)
        _ = self._scheduler.post_owned(resources^, 0, command^)

    def schedule_command[
        P: Copyable & Deinitable,
    ](mut self, actor: ActorId, var payload: P, callback: ActorCommand[Self.T, P].Callback) raises:
        var cown = self._cown(actor)
        self._scheduler.inspect(cown).require_active()
        var command = ActorCommand[Self.T, P](cown, payload^, callback)
        var resources = List[Cown]()
        resources.append(cown)
        _ = self._scheduler.post_owned(resources^, 0, command^)

    def _family(self, sender: ActorState[Self.T], target: ActorState[Self.T]) -> Bool:
        if sender.id == target.id:
            return False
        if sender.parent and sender.parent.value() == target.id:
            return True
        if target.parent and target.parent.value() == sender.id:
            return True
        return Bool(sender.parent) and Bool(target.parent) and sender.parent.value() == target.parent.value()

    def send(mut self, sender: ActorId, target: ActorId, body: String) raises:
        var clean_body = String(body.strip())
        if clean_body.byte_length() == 0:
            raise Error("message must not be empty")
        if clean_body.count_codepoints() > 16_384:
            raise Error("message exceeds character limit")
        var source = self._scheduler.inspect(self._cown(sender))
        var cown = self._cown(target)
        var destination = self._scheduler.inspect(cown)
        source.require_active()
        destination.require_active()
        if not self._family(source, destination):
            raise Error("message target is outside actor family")
        if len(destination.mailbox) >= self._mailbox_capacity:
            raise Error("actor mailbox is full")
        destination.mailbox.append(Message(sender, target, clean_body^, self._sequence))
        self._scheduler.replace(cown, destination^)
        self._sequence += 1

    def receive(mut self, actor: ActorId) raises -> Optional[Message]:
        var cown = self._cown(actor)
        var owned = self._scheduler.inspect(cown)
        owned.require_active()
        if len(owned.mailbox) == 0:
            return None
        var message = owned.mailbox.pop(0)
        self._scheduler.replace(cown, owned^)
        return Optional[Message](message^)

    def cancel(mut self, actor: ActorId) raises -> Bool:
        var cown = self._cown(actor)
        var owned = self._scheduler.inspect(cown)
        if owned.status.terminal():
            return False
        owned.status = ActorStatus(3)
        owned.mailbox.clear()
        self._scheduler.replace(cown, owned^)
        return True

    def finish(mut self, actor: ActorId, result: String) raises:
        var cown = self._cown(actor)
        var owned = self._scheduler.inspect(cown)
        owned.require_active()
        owned.status = ActorStatus(2)
        owned.result = result.copy()
        owned.mailbox.clear()
        self._scheduler.replace(cown, owned^)

    def step(mut self) raises -> Bool:
        return self._scheduler.step()

    def run(mut self, workers: Int = 2) raises:
        _ = self._scheduler.run(workers)

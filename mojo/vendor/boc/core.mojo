from std.collections import List
from std.ffi import external_call
from std.memory import ArcPointer, Pointer
from std.memory.alloc import unsafe_alloc

from .upstream.identity import CownHandle
from .upstream.schedule_plan import ModelMutation, make_schedule_plan, simulate_resolutions, accounting_ok

comptime Raw = Pointer[UInt8, MutUntrackedOrigin]

@fieldwise_init
struct _Lease(ImplicitlyCopyable, Movable):
    var active: Bool

struct Cown(ImplicitlyCopyable, Movable):
    var owner: Int
    var slot: Int
    var _identity: ArcPointer[Int]

    def __init__(out self, identity: ArcPointer[Int], slot: Int):
        self._identity = identity
        self.owner = Int(identity.ptr())
        self.slot = slot

    def __init__(out self, *, copy: Self):
        self.owner = copy.owner
        self.slot = copy.slot
        self._identity = copy._identity

struct Acquired[T: Copyable & Deinitable](Copyable, Movable):
    var _resources: List[Cown]
    var _values: List[Pointer[Self.T, MutUntrackedOrigin]]
    var _lease: ArcPointer[_Lease]

    def __init__(out self, resources: List[Cown], values: List[Pointer[Self.T, MutUntrackedOrigin]], lease: ArcPointer[_Lease]):
        self._resources = resources.copy()
        self._values = values.copy()
        self._lease = lease

    def __init__(out self, *, copy: Self):
        self._resources = copy._resources.copy()
        self._values = copy._values.copy()
        self._lease = copy._lease

    def _index(self, cown: Cown) raises -> Int:
        if not self._lease[].active:
            raise Error("expired acquisition")
        for i in range(len(self._resources)):
            if self._resources[i].owner == cown.owner and self._resources[i]._identity.ptr() == cown._identity.ptr() and self._resources[i].slot == cown.slot:
                return i
        raise Error("undeclared cown")

    def get(self, cown: Cown) raises -> Self.T:
        return self._values[self._index(cown)][].copy()

    def put(mut self, cown: Cown, var value: Self.T) raises:
        self._values[self._index(cown)][] = value^

trait Behavior(Movable, Deinitable):
    comptime State: Copyable & Deinitable
    def execute(mut self, mut acquired: Acquired[Self.State], payload: Int) raises:
        ...

struct _Packet[B: Behavior](Movable):
    var body: Self.B
    var acquired: Acquired[Self.B.State]
    var payload: Int

    def __init__(out self, var body: Self.B, var acquired: Acquired[Self.B.State], payload: Int):
        self.body = body^
        self.acquired = acquired^
        self.payload = payload

def _invoke[B: Behavior](raw: Raw) raises:
    var p = raw.unsafe_bitcast[_Packet[B]]()
    p[].body.execute(p[].acquired, p[].payload)

def _drop[B: Behavior](raw: Raw):
    var p = raw.unsafe_bitcast[_Packet[B]]()
    p.unsafe_deinit_pointee()
    p.unsafe_free()

struct _Thin[T: Copyable & Deinitable](Behavior):
    comptime State = Self.T
    var body: def(mut Acquired[Self.T], Int) raises thin -> None
    def __init__(out self, body: def(mut Acquired[Self.T], Int) raises thin -> None):
        self.body = body
    def execute(mut self, mut acquired: Acquired[Self.T], payload: Int) raises:
        self.body(acquired, payload)

struct _Job(Movable):
    var resources: List[Cown]
    var lease: ArcPointer[_Lease]
    var raw: Raw
    var invoke: def(Raw) raises thin -> None
    var drop: def(Raw) thin -> None
    var failure: String
    var failed: Bool

    def __init__(out self, resources: List[Cown], lease: ArcPointer[_Lease], raw: Raw, invoke: def(Raw) raises thin -> None, drop: def(Raw) thin -> None):
        self.resources = resources.copy()
        self.lease = lease
        self.raw = raw
        self.invoke = invoke
        self.drop = drop
        self.failure = ""
        self.failed = False

    def __deinit__(deinit self):
        self.drop(self.raw)

    def execute(mut self):
        try:
            self.invoke(self.raw)
        except err:
            self.failed = True
            self.failure = String(err)

@fieldwise_init
struct _StartGate(Movable):
    var mutex: Pointer[Int64, MutUntrackedOrigin]
    var condition: Pointer[Int64, MutUntrackedOrigin]
    var opened: Bool
    var cancelled: Bool

@fieldwise_init
struct _Worker(Movable):
    var job: Pointer[_Job, MutUntrackedOrigin]
    var gate: Pointer[_StartGate, MutUntrackedOrigin]

@export
def _worker_entry(worker: Pointer[_Worker, MutUntrackedOrigin]) abi("C") -> Raw:
    var gate = worker[].gate
    _ = external_call["pthread_mutex_lock", Int32](gate[].mutex)
    while not gate[].opened:
        _ = external_call["pthread_cond_wait", Int32](gate[].condition, gate[].mutex)
    var cancelled = gate[].cancelled
    _ = external_call["pthread_mutex_unlock", Int32](gate[].mutex)
    if not cancelled:
        worker[].job[].execute()
    return worker.unsafe_bitcast[UInt8]()

def _dispatch(mut jobs: List[_Job]) raises:
    # Linux pthread objects fit these aligned, private buffers.
    var mutex = unsafe_alloc[Int64](8)
    var condition = unsafe_alloc[Int64](8)
    var null = Optional[Raw]()
    var rc = external_call["pthread_mutex_init", Int32](mutex, null)
    if rc != 0:
        mutex.unsafe_free()
        condition.unsafe_free()
        raise Error("pthread mutex initialization failed")
    rc = external_call["pthread_cond_init", Int32](condition, null)
    if rc != 0:
        _ = external_call["pthread_mutex_destroy", Int32](mutex)
        mutex.unsafe_free()
        condition.unsafe_free()
        raise Error("pthread condition initialization failed")
    var gate = _StartGate(mutex, condition, False, False)
    var slots = unsafe_alloc[_Worker](len(jobs))
    var threads = List[UInt64]()
    for i in range(len(jobs)):
        slots.unsafe_offset(i).unsafe_write(_Worker(Pointer(to=jobs[i]).unsafe_origin_cast[MutUntrackedOrigin](), Pointer(to=gate).unsafe_origin_cast[MutUntrackedOrigin]()))
        var thread: UInt64 = 0
        rc = external_call["pthread_create", Int32](Pointer(to=thread), null, _worker_entry, slots.unsafe_offset(i))
        if rc != 0:
            break
        threads.append(thread)
    _ = external_call["pthread_mutex_lock", Int32](mutex)
    gate.cancelled = len(threads) != len(jobs)
    gate.opened = True
    _ = external_call["pthread_cond_broadcast", Int32](condition)
    _ = external_call["pthread_mutex_unlock", Int32](mutex)
    for thread in threads:
        if external_call["pthread_join", Int32](thread, null) != 0:
            # Releasing a packet with an unjoined worker would be unsound.
            _ = external_call["abort", Int32]()
    slots.unsafe_free()
    _ = external_call["pthread_cond_destroy", Int32](condition)
    _ = external_call["pthread_mutex_destroy", Int32](mutex)
    condition.unsafe_free()
    mutex.unsafe_free()
    if gate.cancelled:
        raise Error("pthread worker startup failed")

struct Scheduler[T: Copyable & Deinitable](Movable):
    var _identity: ArcPointer[Int]
    var _values: List[Pointer[Self.T, MutUntrackedOrigin]]
    var _jobs: List[_Job]
    var _active: Bool
    var _next: Int

    def __init__(out self):
        self._identity = ArcPointer(Int(1))
        self._values = List[Pointer[Self.T, MutUntrackedOrigin]]()
        self._jobs = List[_Job]()
        self._active = False
        self._next = 0

    def __deinit__(deinit self):
        for p in self._values:
            p.unsafe_deinit_pointee()
            p.unsafe_free()

    def owner(self) -> Int:
        return Int(self._identity.ptr())

    def _validate(self, cown: Cown) raises:
        if cown.owner != self.owner() or cown._identity.ptr() != self._identity.ptr() or cown.slot < 0 or cown.slot >= len(self._values):
            raise Error("invalid or foreign cown")
        if self._active:
            raise Error("scheduler is executing")

    def create(mut self, var value: Self.T) raises -> Cown:
        if self._active:
            raise Error("scheduler is executing")
        var p = unsafe_alloc[Self.T](1)
        p.unsafe_write(value^)
        self._values.append(p)
        return Cown(self._identity, len(self._values) - 1)

    def inspect(self, cown: Cown) raises -> Self.T:
        self._validate(cown)
        return self._values[cown.slot][].copy()

    def replace(mut self, cown: Cown, var value: Self.T) raises:
        self._validate(cown)
        self._values[cown.slot][] = value^

    def post(mut self, resources: List[Cown], payload: Int, body: def(mut Acquired[Self.T], Int) raises thin -> None) raises -> Int:
        return self.post_owned(resources, payload, _Thin[Self.T](body))

    def post_owned[B: Behavior](mut self, resources: List[Cown], payload: Int, var body: B) raises -> Int:
        comptime assert Self.T == B.State
        if self._active:
            raise Error("scheduler is executing")
        if len(resources) == 0:
            raise Error("empty resource set")
        var explicit = List[CownHandle]()
        for c in resources:
            self._validate(c)
            explicit.append(CownHandle(self.owner(), 1, c.slot, 1))
        # The donor result slot is an admission-local completion resource.
        var plan = make_schedule_plan(self._next, CownHandle(self.owner(), 1, len(self._values), 1), explicit, ModelMutation())
        var order = List[Int]()
        for i in range(len(plan.unique)):
            order.append(i)
        if not accounting_ok(simulate_resolutions(plan, order)):
            raise Error("invalid request accounting")
        var canonical = List[Cown]()
        var values = List[Pointer[B.State, MutUntrackedOrigin]]()
        for h in plan.unique:
            if h.slot_id < len(self._values):
                canonical.append(Cown(self._identity, h.slot_id))
                values.append(self._values[h.slot_id].unsafe_bitcast[B.State]())
        var lease = ArcPointer(_Lease(False))
        var packet = unsafe_alloc[_Packet[B]](1)
        packet.unsafe_write(_Packet[B](body^, Acquired[B.State](canonical, values, lease), payload))
        self._jobs.append(_Job(canonical, lease, packet.unsafe_bitcast[UInt8](), _invoke[B], _drop[B]))
        var id = self._next
        self._next += 1
        return id

    def step(mut self) raises -> Bool:
        if self._active:
            raise Error("scheduler is executing")
        if len(self._jobs) == 0:
            return False
        self._active = True
        var job = self._jobs.pop(0)
        job.lease.ptr().unsafe_mut_cast[True]()[].active = True
        job.execute()
        job.lease.ptr().unsafe_mut_cast[True]()[].active = False
        self._active = False
        if job.failed:
            raise Error(job.failure)
        return True

    def run(mut self, workers: Int = 2) raises -> Int:
        if workers < 1 or workers > 64:
            raise Error("workers must be in 1..64")
        if self._active:
            raise Error("scheduler is executing")
        var completed = 0
        if workers == 1:
            while self.step():
                completed += 1
            return completed
        while len(self._jobs):
            var earlier = List[Int]()
            var selected = List[Int]()
            for i in range(len(self._jobs)):
                var blocked = False
                for resource in self._jobs[i].resources:
                    for slot in earlier:
                        if resource.slot == slot:
                            blocked = True
                if not blocked and len(selected) < workers:
                    selected.append(i)
                # Even blocked predecessors reserve their place on each cown.
                for resource in self._jobs[i].resources:
                    earlier.append(resource.slot)
            var jobs = List[_Job]()
            for i in range(len(selected)):
                jobs.append(self._jobs.pop(selected[i] - i))
            self._active = True
            for i in range(len(jobs)):
                jobs[i].lease.ptr().unsafe_mut_cast[True]()[].active = True
            var startup_failure = ""
            var startup_failed = False
            try:
                _dispatch(jobs)
            except err:
                startup_failed = True
                startup_failure = String(err)
            var failure = ""
            var failed = False
            for i in range(len(jobs)):
                jobs[i].lease.ptr().unsafe_mut_cast[True]()[].active = False
                if jobs[i].failed and not failed:
                    failed = True
                    failure = jobs[i].failure
            self._active = False
            if startup_failed:
                for i in range(len(selected)):
                    self._jobs.insert(selected[i], jobs.pop(0))
                raise Error(startup_failure)
            completed += len(jobs)
            if failed:
                raise Error(failure)
        return completed

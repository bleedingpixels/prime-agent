# testing artifact
from std.collections import List
from std.testing import assert_equal, assert_false, assert_true
from std.ffi import external_call
from std.memory import Pointer
from std.memory.alloc import unsafe_alloc
from vendor.boc import Acquired, Behavior, Cown, Scheduler

struct Increment(Behavior):
    comptime State = Int
    var cown: Cown
    def __init__(out self, cown: Cown):
        self.cown = cown
    def execute(mut self, mut acquired: Acquired[Int], payload: Int) raises:
        acquired.put(self.cown, acquired.get(self.cown) + payload)

@fieldwise_init
struct Digit(Behavior):
    comptime State = Int
    var resources: List[Cown]
    def execute(mut self, mut acquired: Acquired[Int], payload: Int) raises:
        for resource in self.resources:
            acquired.put(resource, acquired.get(resource) * 10 + payload)

@fieldwise_init
struct Escape(Behavior):
    comptime State = Int
    var saved: Pointer[Optional[Acquired[Int]], MutUntrackedOrigin]
    def execute(mut self, mut acquired: Acquired[Int], payload: Int) raises:
        self.saved[] = Optional(acquired.copy())

struct Fail(Behavior):
    comptime State = Int
    def __init__(out self):
        pass
    def execute(mut self, mut acquired: Acquired[Int], payload: Int) raises:
        raise Error("")

@fieldwise_init
struct Meet(Behavior):
    comptime State = Int
    var cown: Cown
    var barrier: Pointer[Int64, MutUntrackedOrigin]
    def execute(mut self, mut acquired: Acquired[Int], payload: Int) raises:
        var rc = external_call["pthread_barrier_wait", Int32](self.barrier)
        if rc != 0 and rc != -1:
            raise Error("barrier failed")
        acquired.put(self.cown, Int(external_call["pthread_self", UInt64]()))

def refs(a: Cown) -> List[Cown]:
    var result = List[Cown]()
    result.append(a)
    return result^

def test_ownership() raises:
    var scheduler = Scheduler[Int]()
    var a = scheduler.create(1)
    var b = scheduler.create(2)
    var foreign = Scheduler[Int]()
    var forged = foreign.create(0)
    forged.owner = a.owner
    var rejected = False
    try:
        _ = scheduler.inspect(forged)
    except:
        rejected = True
    assert_true(rejected)

    var invalid = a
    invalid.slot = 100
    rejected = False
    try:
        _ = scheduler.inspect(invalid)
    except:
        rejected = True
    assert_true(rejected)
    _ = scheduler.post_owned(refs(a), 1, Increment(b))
    _ = scheduler.post_owned(refs(a), 4, Increment(a))
    rejected = False
    try:
        _ = scheduler.run()
    except:
        rejected = True
    assert_true(rejected)
    assert_equal(scheduler.inspect(b), 2)
    assert_equal(scheduler.run(), 1)
    assert_equal(scheduler.inspect(a), 5)
    var saved = Optional[Acquired[Int]]()
    _ = scheduler.post_owned(refs(a), 0, Escape(Pointer(to=saved).unsafe_origin_cast[MutUntrackedOrigin]()))
    assert_true(scheduler.step())
    rejected = False
    try:
        _ = saved.value().get(a)
    except:
        rejected = True
    assert_true(rejected)
    var moved = scheduler^
    assert_equal(moved.inspect(a), 5)
    rejected = False
    try:
        _ = moved.run(0)
    except:
        rejected = True
    assert_true(rejected)

def test_empty_error() raises:
    for native in range(2):
        var scheduler = Scheduler[Int]()
        var a = scheduler.create(0)
        _ = scheduler.post_owned(refs(a), 0, Fail())
        _ = scheduler.post_owned(refs(a), 1, Increment(a))
        var rejected = False
        try:
            if native:
                _ = scheduler.run(1)
            else:
                _ = scheduler.step()
        except:
            rejected = True
        assert_true(rejected)
        assert_equal(scheduler.inspect(a), 0)
        assert_equal(scheduler.run(1), 1)
        assert_equal(scheduler.inspect(a), 1)

def test_ordering(seed: Int) raises:
    var scheduler = Scheduler[Int]()
    var a = scheduler.create(0)
    var b = scheduler.create(0)
    var independent = List[Cown]()
    for i in range(7):
        independent.append(scheduler.create(i))
    var both = refs(a)
    both.append(b)
    _ = scheduler.post_owned(refs(a), 1, Digit(refs(a)))
    _ = scheduler.post_owned(both, 2, Digit(both.copy()))
    _ = scheduler.post_owned(refs(b), 3, Digit(refs(b)))
    for i in range(7):
        var c = independent[(i * 3 + seed) % 7]
        var duplicate = refs(c)
        duplicate.append(c)
        _ = scheduler.post_owned(duplicate, 10, Increment(c))
    assert_equal(scheduler.run(3), 10)
    assert_equal(scheduler.inspect(a), 12)
    assert_equal(scheduler.inspect(b), 23)
    for i in range(7):
        assert_equal(scheduler.inspect(independent[i]), i + 10)

def test_native_overlap() raises:
    var scheduler = Scheduler[Int]()
    var a = scheduler.create(0)
    var b = scheduler.create(0)
    var barrier = unsafe_alloc[Int64](4)
    var rc = external_call["pthread_barrier_init", Int32](barrier, Optional[Pointer[UInt8, MutUntrackedOrigin]](), UInt32(2))
    if rc != 0:
        barrier.unsafe_free()
        raise Error("barrier initialization failed")
    _ = external_call["alarm", UInt32](UInt32(15))
    try:
        _ = scheduler.post_owned(refs(a), 0, Meet(a, barrier))
        _ = scheduler.post_owned(refs(b), 0, Meet(b, barrier))
        assert_equal(scheduler.run(2), 2)
        assert_true(scheduler.inspect(a) != scheduler.inspect(b))
    finally:
        _ = external_call["alarm", UInt32](UInt32(0))
        _ = external_call["pthread_barrier_destroy", Int32](barrier)
        barrier.unsafe_free()

def main() raises:
    test_ownership()
    test_empty_error()
    for seed in range(7):
        test_ordering(seed)
    test_native_overlap()
    var scheduler = Scheduler[Int]()
    var a = scheduler.create(1)
    var refs = List[Cown]()
    refs.append(a)
    _ = scheduler.post_owned(refs, 4, Increment(a))
    assert_true(scheduler.step())
    assert_equal(scheduler.inspect(a), 5)
    assert_false(scheduler.step())
    _ = scheduler.post_owned(refs, 2, Increment(a))
    assert_equal(scheduler.run(), 1)
    assert_equal(scheduler.inspect(a), 7)
    print("boc core passed")

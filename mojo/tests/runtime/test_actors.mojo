# testing artifact
from std.testing import assert_equal
from runtime import ActorId, ActorSystem


def increment(mut state: Int, amount: Int):
    state += amount


def append_size(mut state: Int, text: String):
    state += text.count_codepoints()


def fail_after_write(mut state: Int, amount: Int) raises:
    state += amount
    raise Error("command failed")


def expired_actor() raises -> ActorId:
    var actors = ActorSystem[Int]()
    return actors.spawn("expired", 0)


def test_identity() raises:
    var stale = expired_actor()
    var actors = ActorSystem[Int]()
    var actor = actors.spawn("current", 0)
    var rejected = False
    try:
        _ = actors.snapshot(stale)
    except:
        rejected = True
    assert_equal(rejected, True)
    rejected = False
    try:
        _ = actors.snapshot(ActorId(actor.value, actor.owner))
    except:
        rejected = True
    assert_equal(rejected, True)
    var altered = actor
    altered.value = actors.spawn("second", 1).value
    rejected = False
    try:
        _ = actors.snapshot(altered)
    except:
        rejected = True
    assert_equal(rejected, True)
    var foreign = ActorSystem[Int]()
    var forged = foreign.spawn("foreign", 2)
    forged.owner = actor.owner
    var retained = forged._identity.value().copy()
    retained.owner = actor.owner
    forged._identity = retained
    rejected = False
    try:
        _ = actors.snapshot(forged)
    except:
        rejected = True
    assert_equal(rejected, True)
    assert_equal(actors.snapshot(actor).state, 0)


def test_messages() raises:
    var actors = ActorSystem[Int](mailbox_capacity=2)
    var parent = actors.spawn("parent", 0)
    var child = actors.spawn("child", 10, parent)
    var sibling = actors.spawn("sibling", 20, parent)
    var stranger = actors.spawn("stranger", 30)
    actors.send(parent, child, " first ")
    actors.send(sibling, child, "second")
    assert_equal(actors.snapshot(child).mailbox_count, 2)
    var rejected = False
    try:
        actors.send(parent, child, "overflow")
    except:
        rejected = True
    assert_equal(rejected, True)
    var first = actors.receive(child)
    assert_equal(Bool(first), True)
    assert_equal(first.value().body, "first")
    assert_equal(first.value().sender, parent)
    assert_equal(first.value().target, child)
    assert_equal(first.value().sequence, 0)
    var second = actors.receive(child)
    assert_equal(second.value().body, "second")
    assert_equal(second.value().sequence, 1)
    assert_equal(Bool(actors.receive(child)), False)
    var invalid_bodies = List[String]()
    invalid_bodies.append(" ")
    invalid_bodies.append(String("x") * 16_385)
    for invalid in invalid_bodies:
        rejected = False
        try:
            actors.send(parent, child, invalid)
        except:
            rejected = True
        assert_equal(rejected, True)
    var invalid_senders = List[ActorId]()
    invalid_senders.append(stranger)
    invalid_senders.append(child)
    invalid_senders.append(ActorId(-1))
    var foreign = ActorSystem[Int]()
    invalid_senders.append(foreign.spawn("foreign", 0))
    for invalid in invalid_senders:
        rejected = False
        try:
            actors.send(invalid, child, "forbidden")
        except:
            rejected = True
        assert_equal(rejected, True)
    actors.send(child, parent, "reply")
    assert_equal(actors.receive(parent).value().body, "reply")
    assert_equal(actors.snapshot(child).mailbox_count, 0)


def test_lifecycle() raises:
    var actors = ActorSystem[Int]()
    var parent = actors.spawn("parent", 0)
    var child = actors.spawn("child", 5, parent)
    actors.schedule(child, increment, 7)
    actors.send(parent, child, "queued")
    assert_equal(actors.cancel(child), True)
    assert_equal(actors.cancel(child), False)
    assert_equal(actors.step(), True)
    assert_equal(actors.snapshot(child).state, 5)
    assert_equal(actors.snapshot(child).status, "cancelled")
    assert_equal(actors.snapshot(child).mailbox_count, 0)
    var rejected = False
    try:
        actors.schedule(child, increment, 99)
    except:
        rejected = True
    assert_equal(rejected, True)
    rejected = False
    try:
        actors.finish(child, "cannot revive")
    except:
        rejected = True
    assert_equal(rejected, True)
    rejected = False
    try:
        actors.send(parent, child, "too late")
    except:
        rejected = True
    assert_equal(rejected, True)
    actors.finish(parent, "done")
    assert_equal(actors.snapshot(parent).status, "completed")
    assert_equal(actors.snapshot(parent).result, "done")
    assert_equal(actors.cancel(parent), False)
    assert_equal(actors.step(), False)


def test_commands(seed: Int) raises:
    var actors = ActorSystem[Int]()
    var left = actors.spawn("left", 0)
    var right = actors.spawn("right", 100)
    actors.schedule(left, increment, 1)
    actors.schedule(right, increment, 13)
    actors.schedule(left, increment, 7)
    assert_equal(actors.step(), True)
    assert_equal(actors.snapshot(left).state, 1)
    assert_equal(actors.snapshot(right).state, 100)
    actors.run(workers=2)
    assert_equal(actors.snapshot(left).state, 8)
    assert_equal(actors.snapshot(right).state, 113)
    actors.schedule_command(left, String("native λ"), append_size)
    actors.run(workers=2)
    assert_equal(actors.snapshot(left).state, 16)
    actors.schedule(left, fail_after_write, 3)
    actors.schedule(right, increment, 5)
    var rejected = False
    try:
        _ = actors.step()
    except:
        rejected = True
    assert_equal(rejected, True)
    assert_equal(actors.snapshot(left).status, "failed")
    assert_equal(actors.snapshot(left).state, 19)
    assert_equal(actors.snapshot(left).result, "command failed")
    actors.run(workers=2)
    assert_equal(actors.snapshot(right).state, 118)
    var expected = List[Int]()
    var independent = List[ActorId]()
    for i in range(4):
        independent.append(actors.spawn(String(i), 0))
        expected.append(0)
    for i in range(16):
        var slot = (i * 7 + seed) % 4
        actors.schedule(independent[slot], increment, i)
        expected[slot] += i
    actors.run(workers=seed + 1)
    for i in range(4):
        assert_equal(actors.snapshot(independent[i]).state, expected[i])


def main() raises:
    test_messages()
    test_lifecycle()
    test_identity()
    for seed in range(1, 4):
        test_commands(seed)
    print("actors: PASS")

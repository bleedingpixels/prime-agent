# benchmark artifact: identical native work for serial scheduler comparisons
from std.collections import List
from std.sys import argv
from std.time import monotonic
from vendor.boc import Acquired, Behavior, Cown, Scheduler

@fieldwise_init
struct Increment(Behavior):
    comptime State = Int
    var cown: Cown

    def execute(mut self, mut acquired: Acquired[Int], payload: Int) raises:
        acquired.put(self.cown, acquired.get(self.cown) + payload)


def main() raises:
    var args = argv()
    var count = 256
    var rounds = 8
    var workers = 1
    if len(args) > 1:
        count = Int(String(args[1]))
    if len(args) > 2:
        rounds = Int(String(args[2]))
    if len(args) > 3:
        workers = Int(String(args[3]))
    if count < 1 or count > 16384 or rounds < 1 or rounds > 1000:
        raise Error("benchmark parameters out of bounds")
    var run_ns = 0
    var admission_ns = 0
    var completed = 0
    var checksum = 0
    var total_start = monotonic()
    for _ in range(rounds):
        var scheduler = Scheduler[Int]()
        var actors = List[Cown]()
        for _ in range(16):
            actors.append(scheduler.create(0))
        var start = monotonic()
        for i in range(count):
            var cown = actors[i % len(actors)]
            var resources = List[Cown]()
            resources.append(cown)
            _ = scheduler.post_owned(resources, 1, Increment(cown))
        admission_ns += monotonic() - start
        start = monotonic()
        completed += scheduler.run(workers)
        run_ns += monotonic() - start
        for i in range(len(actors)):
            var value = scheduler.inspect(actors[i])
            var expected = count // len(actors)
            if i < count % len(actors):
                expected += 1
            if value != expected:
                raise Error("benchmark state mismatch")
            checksum += value
    var total_ns = monotonic() - total_start
    if completed != count * rounds or checksum != completed:
        raise Error("benchmark lost work")
    print('{"jobs":', count, ',"rounds":', rounds, ',"workers":', workers,
          ',"completed":', completed, ',"checksum":', checksum,
          ',"admission_seconds":', Float64(admission_ns) / 1e9,
          ',"run_seconds":', Float64(run_ns) / 1e9,
          ',"total_seconds":', Float64(total_ns) / 1e9, '}')

# Pure request accounting for the BoC executable model (M0).
#
# Implements the normative counter definition of
# docs/internal/actors/boc-mojo-port-spec.md ("Exact request accounting"):
#
#   A = source-order explicit request slots (duplicates included)
#   Q = [fresh result] ++ A          logical request slots
#   U = stable_unique(Q)             deduplicated physical requests
#   D = |Q| - |U|                    duplicate count
#   pending_raw        = |Q| + 1     initial counter, phase-two hold included
#   pending_compensated = |Q| + 1 - D   (== |U| + 1 when clean)
#
# Both pending values are retained on the plan so the exact equation is
# directly testable. The argument map reconstructs every source slot of Q
# (including duplicates) as an index into U, so `(cowhen (a a) ...)` acquires
# once and binds twice.
#
# ModelMutation carries the four M0 mutation gates as test-only option data
# (default construction is the clean production/default model path):
#   phase_hold=False            removes the phase-two hold (+1)
#   duplicate_compensation=False removes the D compensating decrements
#   sorted_link=False           links unique requests in source order
#   predecessor_wait=False      skips the predecessor-publication wait

from std.collections import List

from .identity import CownHandle


struct ModelMutation(ImplicitlyCopyable, Movable):
    """Test-only mutation knobs over the model's load-bearing invariants.
    The default constructor is the clean path; every knob is True there."""

    var phase_hold: Bool
    var duplicate_compensation: Bool
    var sorted_link: Bool
    var predecessor_wait: Bool

    def __init__(out self):
        self.phase_hold = True
        self.duplicate_compensation = True
        self.sorted_link = True
        self.predecessor_wait = True

    def __init__(
        out self,
        *,
        phase_hold: Bool,
        duplicate_compensation: Bool,
        sorted_link: Bool,
        predecessor_wait: Bool,
    ):
        self.phase_hold = phase_hold
        self.duplicate_compensation = duplicate_compensation
        self.sorted_link = sorted_link
        self.predecessor_wait = predecessor_wait


struct SchedulePlan(ImplicitlyCopyable, Movable):
    """One behavior's pure schedule plan: logical and unique request sets,
    argument map, and both pending values."""

    var behavior_id: Int
    var result: CownHandle
    var logical: List[CownHandle]
    var unique: List[CownHandle]
    var argument_map: List[Int]
    var pending_raw: Int
    var pending_compensated: Int
    var duplicate_count: Int

    def __init__(
        out self,
        behavior_id: Int,
        result: CownHandle,
        logical: List[CownHandle],
        unique: List[CownHandle],
        argument_map: List[Int],
        pending_raw: Int,
        pending_compensated: Int,
        duplicate_count: Int,
    ):
        self.behavior_id = behavior_id
        self.result = result
        self.logical = logical.copy()
        self.unique = unique.copy()
        self.argument_map = argument_map.copy()
        self.pending_raw = pending_raw
        self.pending_compensated = pending_compensated
        self.duplicate_count = duplicate_count

    def __init__(out self, *, copy: Self):
        self.behavior_id = copy.behavior_id
        self.result = copy.result
        self.logical = copy.logical.copy()
        self.unique = copy.unique.copy()
        self.argument_map = copy.argument_map.copy()
        self.pending_raw = copy.pending_raw
        self.pending_compensated = copy.pending_compensated
        self.duplicate_count = copy.duplicate_count


def make_schedule_plan(
    behavior_id: Int,
    result: CownHandle,
    explicit: List[CownHandle],
    mutation: ModelMutation,
) -> SchedulePlan:
    """Build the plan for one admission. Pure: no model state is touched.

    The unique list is stable-deduplicated over Q in source order and then
    insertion-sorted by handle order when the sorted_link knob is set (the
    clean path), so physical linking is in ascending cown identity order.
    """
    var logical = List[CownHandle]()
    logical.append(result)
    for h in explicit:
        logical.append(h)

    var unique = List[CownHandle]()
    for h in logical:
        var seen = False
        for u in unique:
            if u == h:
                seen = True
                break
        if not seen:
            unique.append(h)

    if mutation.sorted_link:
        for i in range(1, len(unique)):
            var key = unique[i]
            var j = i - 1
            while j >= 0 and key < unique[j]:
                unique[j + 1] = unique[j]
                j -= 1
            unique[j + 1] = key

    var argument_map = List[Int]()
    for h in logical:
        var idx = -1
        for i in range(len(unique)):
            if unique[i] == h:
                idx = i
                break
        argument_map.append(idx)

    var pending_raw = len(logical) + 1
    var duplicate_count = len(logical) - len(unique)
    var pending_compensated = pending_raw
    if mutation.duplicate_compensation:
        pending_compensated = pending_compensated - duplicate_count
    if not mutation.phase_hold:
        pending_compensated = pending_compensated - 1

    return SchedulePlan(
        behavior_id,
        result,
        logical,
        unique,
        argument_map,
        pending_raw,
        pending_compensated,
        duplicate_count,
    )


struct ResolutionReport(ImplicitlyCopyable, Movable):
    """Pure counter-accounting oracle output for one simulated plan."""

    var zero_transitions: Int
    var final_pending: Int
    var underflow: Bool
    var dispatch_before_hold_release: Bool

    def __init__(
        out self,
        zero_transitions: Int,
        final_pending: Int,
        underflow: Bool,
        dispatch_before_hold_release: Bool,
    ):
        self.zero_transitions = zero_transitions
        self.final_pending = final_pending
        self.underflow = underflow
        self.dispatch_before_hold_release = dispatch_before_hold_release


def simulate_resolutions(
    plan: SchedulePlan,
    request_order: List[Int],
) -> ResolutionReport:
    """Simulate the resolution events of one plan: each unique physical
    request resolves once, in the given order, then the phase-two hold is
    released last (the protocol's fixed phase-two order). Records every
    1 -> 0 observation, the terminal counter, underflow, and whether a
    dispatch transition fired before the hold release."""
    var pending = plan.pending_compensated
    var zero_transitions = 0
    var underflow = False
    var dispatch_before_hold_release = False

    for _idx in request_order:
        if pending == 1:
            dispatch_before_hold_release = True
        pending = pending - 1
        if pending == 0:
            zero_transitions += 1
        if pending < 0:
            underflow = True

    # Phase-two hold release: always the final decrement on the clean path,
    # so it is the only legal site of the unique 1 -> 0 transition.
    pending = pending - 1
    if pending == 0:
        zero_transitions += 1
    if pending < 0:
        underflow = True

    return ResolutionReport(
        zero_transitions, pending, underflow, dispatch_before_hold_release
    )


def accounting_ok(report: ResolutionReport) -> Bool:
    """The exact counter oracle: exactly one 1 -> 0 transition, terminal
    counter zero, no underflow, and no dispatch before the phase-two hold
    release."""
    return (
        report.zero_transitions == 1
        and report.final_pending == 0
        and not report.underflow
        and not report.dispatch_before_hold_release
    )

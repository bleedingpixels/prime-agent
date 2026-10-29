from __future__ import annotations

import json
from pathlib import Path

import pytest

import zenith
from conftest import run, start_with_plan, strict_decide, two_branch_plan


def ledger(path: Path) -> dict:
    return json.loads((path / "mission.json").read_text())


def event_count(path: Path, event: str) -> int:
    events = json.loads((path / "events.json").read_text())
    return sum(item["event"] == event for item in events)


def submit_result(
    workspace: Path,
    mission_id: str,
    dispatched: dict,
    *,
    passed: bool = True,
    verdicts: dict[str, str] | None = None,
    evidence: object = None,
    report: str = "Focused work and checks completed with concrete observations.",
) -> dict:
    return run(
        zenith.end_task(
            mission_id,
            dispatched["task_id"],
            dispatched["attempt_id"],
            done=True,
            passed=passed,
            report=report,
            verdicts=verdicts,
            evidence=evidence,
            workspace=str(workspace),
        )
    )


def test_readiness_is_deterministic_and_respects_concurrency_ceiling(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(
        tmp_path,
        monkeypatch,
        concurrency=1,
        plan=two_branch_plan(),
    )

    first = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    repeated = run(zenith.advance(mission_id, workspace=str(tmp_path)))

    assert [item["task_id"] for item in first["dispatched"]] == ["alpha-work"]
    assert repeated["dispatched"] == []
    assert len(runtime.spawn_calls) == 1
    state = ledger(path)
    assert state["tasks"]["alpha-work"]["status"] == "running"
    assert state["tasks"]["beta-work"]["status"] == "pending"


def test_parallel_admission_handles_are_persisted_without_waiting_for_results(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(
        tmp_path,
        monkeypatch,
        concurrency=2,
        plan=two_branch_plan(),
    )

    advanced = run(zenith.advance(mission_id, workspace=str(tmp_path)))

    assert [item["task_id"] for item in advanced["dispatched"]] == ["alpha-work", "beta-work"]
    assert len(runtime.spawn_calls) == 2
    state = ledger(path)
    for item in advanced["dispatched"]:
        attempt = state["tasks"][item["task_id"]]["attempts"][0]
        assert attempt["status"] == "running"
        assert attempt["handle"]["rlm_child_id"] == item["handle"]["rlm_child_id"]
        assert attempt["ingested"] is False
        result_path = path / "attempts" / item["task_id"] / item["attempt_id"] / "result.json"
        assert not result_path.exists()


def test_atomic_child_handoff_is_ingested_exactly_once_across_repeated_ticks(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    work = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]

    submitted = submit_result(tmp_path, mission_id, work, evidence=["focused tests passed"])
    result_path = Path(submitted["result_path"])
    assert result_path.stat().st_size > 0
    runtime.set_status(work["handle"]["rlm_child_id"], "completed")

    first = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    second = run(zenith.advance(mission_id, workspace=str(tmp_path)))

    assert first["ingested"] == 1
    assert second["ingested"] == 0
    assert event_count(path, "task_result_ingested") == 1
    assert ledger(path)["tasks"]["work"]["attempts"][0]["ingested"] is True
    assert work["handle"]["rlm_child_id"] in runtime.deleted


def test_work_then_validator_then_and_gate_reaches_review_readiness(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    work = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]
    submit_result(tmp_path, mission_id, work, evidence=["work command output"])
    runtime.set_status(work["handle"]["rlm_child_id"], "completed")

    after_work = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    assert after_work["ingested"] == 1
    validator = after_work["dispatched"][0]
    assert validator["task_id"] == "validator"
    submit_result(
        tmp_path,
        mission_id,
        validator,
        verdicts={"feature": "passed"},
        evidence={"commands": ["pytest focused"], "observations": ["assertion held"]},
        report="Independent validator reran the focused check and inspected the diff.",
    )
    runtime.set_status(validator["handle"]["rlm_child_id"], "completed")

    after_validator = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    state = ledger(path)

    assert after_validator["ingested"] == 1
    assert after_validator["dispatched"] == []
    assert state["tasks"]["work"]["status"] == "cleared"
    assert state["tasks"]["validator"]["status"] == "cleared"
    assert state["tasks"]["gate"]["status"] == "cleared"
    assert state["assertions"]["feature"]["status"] == "passed"
    assert state["assertions"]["feature"]["evidence"]
    assert state["state"] == "ready_for_review"


@pytest.mark.parametrize(
    "kwargs, message",
    [
        ({"report": ""}, "report must be a non-empty string"),
        ({"evidence": None}, "requires non-empty evidence"),
        ({"verdicts": {}}, "must cover exactly"),
        ({"verdicts": {"feature": "passed", "extra": "passed"}}, "must cover exactly"),
    ],
)
def test_validator_handoff_requires_nonempty_report_evidence_and_exact_verdict_coverage(
    kwargs: dict,
    message: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, _ = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    work = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]
    submit_result(tmp_path, mission_id, work, evidence=["work evidence"])
    runtime.set_status(work["handle"]["rlm_child_id"], "completed")
    validator = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]
    values = {
        "report": "Independent evidence report.",
        "verdicts": {"feature": "passed"},
        "evidence": ["fresh focused test output"],
        **kwargs,
    }

    with pytest.raises(zenith.ZenithError, match=message):
        submit_result(tmp_path, mission_id, validator, **values)


def test_failed_validator_verdict_creates_attention_and_blocks_gate(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    work = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]
    submit_result(tmp_path, mission_id, work, evidence=["work evidence"])
    runtime.set_status(work["handle"]["rlm_child_id"], "completed")
    validator = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]
    submit_result(
        tmp_path,
        mission_id,
        validator,
        verdicts={"feature": "failed"},
        evidence=["fresh test exposed the defect"],
        report="Independent validation found a reproducible defect.",
    )
    runtime.set_status(validator["handle"]["rlm_child_id"], "completed")

    result = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    state = ledger(path)
    attention = json.loads((path / "attention.json").read_text())

    assert result["state"] == "attention_needed"
    assert state["tasks"]["gate"]["status"] == "failed"
    assert state["assertions"]["feature"]["status"] == "failed"
    assert {item["kind"] for item in attention if item["status"] == "open"} >= {"gate_failed", "assertion_failed"}


def test_task_prompt_contains_charter_full_policy_boundaries_and_prior_failure(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from conftest import single_assertion_plan

    contract, tasks = single_assertion_plan()
    tasks[0].update(
        {
            "allowed_paths": ["src/feature.py", "tests/test_feature.py"],
            "acceptance": "Focused regression passes and the diff stays within allowed paths.",
            "hazards": ["Preserve unrelated dirty files."],
        }
    )
    runtime, mission_id, path = start_with_plan(
        tmp_path, monkeypatch, concurrency=1, plan=(contract, tasks)
    )
    first = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]
    first_prompt = runtime.spawn_calls[-1]["prompt"]
    assert "Mission charter:\nVerified delivery" in first_prompt
    assert '"allowed_paths"' in first_prompt and "src/feature.py" in first_prompt
    assert '"acceptance"' in first_prompt and "Focused regression passes" in first_prompt
    assert '"hazards"' in first_prompt and "Preserve unrelated dirty files" in first_prompt
    assert '"required_evidence"' in first_prompt and "diff-inspection" in first_prompt
    assert "Prior attempt and failure context (latest three attempts only):\n[]" in first_prompt

    failure = "The first bounded attempt reproduced a deterministic edge-case failure."
    submit_result(
        tmp_path,
        mission_id,
        first,
        passed=False,
        evidence=["focused failure", "x" * 50000],
        report=failure,
    )
    runtime.set_status(first["handle"]["rlm_child_id"], "completed")
    run(zenith.advance(mission_id, workspace=str(tmp_path)))
    attention = [
        item for item in json.loads((path / "attention.json").read_text()) if item["status"] == "open"
    ]
    decisions = [
        {"attention_id": item["id"], "action": "retry", "task_id": "work"}
        for item in attention
    ]
    strict_decide(tmp_path, mission_id, decisions)
    run(zenith.advance(mission_id, workspace=str(tmp_path)))
    second_prompt = runtime.spawn_calls[-1]["prompt"]
    assert failure in second_prompt
    assert '"status": "failed"' in second_prompt
    assert "prior evidence truncated" in second_prompt
    assert len(second_prompt) < 90000


def test_legacy_abort_cannot_win_task_admission_race(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    original_spawn = runtime.spawn
    rejected: list[str] = []

    async def attempt_legacy_abort(prompt: str, *, name: str, model: str | None = None):
        handle = await original_spawn(prompt, name=name, model=model)
        try:
            await zenith.abort(mission_id, "Legacy abort race.", workspace=str(tmp_path))
        except zenith.ZenithError as exc:
            rejected.append(exc.code)
        return handle

    monkeypatch.setattr(zenith, "_rlm_spawn", attempt_legacy_abort)
    advanced = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    state = ledger(path)
    handle = runtime.spawn_calls[-1]["handle"]

    assert rejected == ["LEGACY_ABORT_UNAVAILABLE"]
    assert advanced["state"] == "running"
    assert advanced["dispatched"]
    assert handle.rlm_child_id not in runtime.deleted
    assert state["tasks"]["work"]["status"] == "running"
    assert state["tasks"]["work"]["attempts"][-1]["status"] == "running"


def test_reconciliation_only_advance_never_admits_ready_work(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)

    reconciled = run(
        zenith.advance(mission_id, workspace=str(tmp_path), dispatch=False)
    )

    assert reconciled["dispatched"] == []
    assert runtime.spawn_calls == []
    assert ledger(path)["tasks"]["work"]["status"] == "pending"


def test_malformed_direct_task_result_opens_attention_instead_of_crashing_or_passing(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    dispatched = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]
    result_path = (
        path / "attempts" / dispatched["task_id"] / dispatched["attempt_id"] / "result.json"
    )
    result_path.write_text("{}\n")
    runtime.set_status(dispatched["handle"]["rlm_child_id"], "completed")

    advanced = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    state = ledger(path)
    attention = [
        item for item in json.loads((path / "attention.json").read_text()) if item["status"] == "open"
    ]

    assert advanced["state"] == "attention_needed"
    assert state["tasks"]["work"]["status"] == "failed"
    assert state["tasks"]["work"]["attempts"][-1]["status"] == "error"
    assert {item["kind"] for item in attention} >= {"invalid_task_result"}
    assert state["assertions"]["feature"]["status"] != "passed"


def three_ready_plan() -> tuple[dict, list[dict]]:
    contract = {
        "assertions": [
            {"id": name, "description": f"{name} is correct.", "required_evidence": [f"{name}-test"]}
            for name in ("alpha", "beta", "gamma")
        ]
    }
    tasks: list[dict] = []
    for name in ("alpha", "beta", "gamma"):
        tasks.extend(
            [
                {"id": f"{name}-work", "role": "work", "targets": [name], "depends_on": [], "description": f"Implement {name}."},
                {"id": f"{name}-validator", "role": "validate", "targets": [name], "depends_on": [f"{name}-work"], "description": f"Validate {name}."},
                {"id": f"{name}-gate", "role": "gate", "targets": [name], "depends_on": [f"{name}-validator"]},
            ]
        )
    return contract, tasks


def test_weighted_priority_scheduler_respects_capacity_and_is_deterministic(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    contract, tasks = three_ready_plan()
    hints = {
        "alpha-work": {"concurrency_cost": 2, "priority": 10},
        "beta-work": {"concurrency_cost": 1, "priority": 5},
        "gamma-work": {"concurrency_cost": 1, "priority": 0},
    }
    for task in tasks:
        task.update(hints.get(task["id"], {}))
    runtime, mission_id, path = start_with_plan(
        tmp_path, monkeypatch, concurrency=3, plan=(contract, tasks)
    )

    first = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    repeated = run(zenith.advance(mission_id, workspace=str(tmp_path)))

    assert [item["task_id"] for item in first["dispatched"]] == ["alpha-work", "beta-work"]
    assert repeated["dispatched"] == []
    assert sum(
        task["concurrency_cost"]
        for task in ledger(path)["tasks"].values()
        if task["status"] in {"dispatching", "running"}
    ) == 3
    assert ledger(path)["tasks"]["gamma-work"]["status"] == "pending"
    assert len(runtime.spawn_calls) == 2


def test_auto_mode_scales_to_weighted_ready_demand_within_bounds(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    contract, tasks = three_ready_plan()
    tasks_by_id = {task["id"]: task for task in tasks}
    tasks_by_id["alpha-work"]["concurrency_cost"] = 2
    tasks_by_id["beta-work"]["concurrency_cost"] = 2
    tasks_by_id["gamma-work"]["concurrency_cost"] = 1
    runtime, mission_id, path = start_with_plan(
        tmp_path,
        monkeypatch,
        concurrency="auto",
        min_concurrency=1,
        max_concurrency=4,
        plan=(contract, tasks),
    )

    advanced = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    state = ledger(path)

    assert [item["task_id"] for item in advanced["dispatched"]] == ["alpha-work", "beta-work"]
    assert advanced["concurrency_policy"]["mode"] == "auto"
    assert advanced["concurrency_policy"]["effective"] == 4
    assert state["concurrency"] == 4
    assert state["tasks"]["gamma-work"]["status"] == "pending"
    assert len(runtime.spawn_calls) == 2


def test_exclusive_ready_task_is_a_drain_barrier(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    contract, tasks = three_ready_plan()
    tasks_by_id = {task["id"]: task for task in tasks}
    tasks_by_id["alpha-work"].update({"priority": 10, "exclusive": True})
    tasks_by_id["beta-work"]["priority"] = 5
    runtime, mission_id, path = start_with_plan(
        tmp_path, monkeypatch, concurrency=3, plan=(contract, tasks)
    )

    first = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    repeated = run(zenith.advance(mission_id, workspace=str(tmp_path)))

    assert [item["task_id"] for item in first["dispatched"]] == ["alpha-work"]
    assert repeated["dispatched"] == []
    assert ledger(path)["tasks"]["beta-work"]["status"] == "pending"
    assert len(runtime.spawn_calls) == 1


def test_ready_exclusive_waits_for_active_work_and_blocks_new_ordinary_work(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    contract, tasks = three_ready_plan()
    tasks_by_id = {task["id"]: task for task in tasks}
    tasks_by_id["beta-work"]["depends_on"] = ["alpha-work"]
    tasks_by_id["beta-work"].update({"exclusive": True, "priority": -10})
    runtime, mission_id, path = start_with_plan(
        tmp_path, monkeypatch, concurrency=2, plan=(contract, tasks)
    )
    initial = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"]
    assert [item["task_id"] for item in initial] == ["alpha-work", "gamma-work"]
    first = initial[0]
    run(
        zenith.end_task(
            mission_id, first["task_id"], first["attempt_id"], done=True, passed=True,
            report="Alpha complete.", evidence=["alpha"], workspace=str(tmp_path),
        )
    )
    # Gamma remains active while alpha's handoff makes exclusive beta ready.
    second = run(zenith.advance(mission_id, workspace=str(tmp_path)))

    assert second["dispatched"] == []
    assert ledger(path)["tasks"]["beta-work"]["status"] == "pending"
    assert ledger(path)["tasks"]["gamma-work"]["status"] == "running"
    assert len(runtime.spawn_calls) == 2


def test_lower_priority_exclusive_still_blocks_ordinary_admission(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    contract, tasks = three_ready_plan()
    tasks_by_id = {task["id"]: task for task in tasks}
    tasks_by_id["alpha-work"].update({"priority": 10, "exclusive": False})
    tasks_by_id["beta-work"].update({"priority": -10, "exclusive": True})
    runtime, mission_id, path = start_with_plan(
        tmp_path, monkeypatch, concurrency=3, plan=(contract, tasks)
    )

    first = run(zenith.advance(mission_id, workspace=str(tmp_path)))

    assert [item["task_id"] for item in first["dispatched"]] == ["beta-work"]
    assert ledger(path)["tasks"]["alpha-work"]["status"] == "pending"
    assert len(runtime.spawn_calls) == 1


def test_runtime_scale_down_drains_without_cancelling_and_scale_up_resumes(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    runtime, mission_id, path = start_with_plan(
        tmp_path, monkeypatch, concurrency=2, plan=two_branch_plan()
    )
    run(zenith.advance(mission_id, workspace=str(tmp_path)))

    lowered = run(zenith.set_concurrency(mission_id, 1, workspace=str(tmp_path)))
    drained_tick = run(zenith.advance(mission_id, workspace=str(tmp_path)))

    assert lowered["concurrency_policy"]["scale_down_pending"] is True
    assert lowered["concurrency_policy"]["active_cost"] == 2
    assert drained_tick["dispatched"] == []
    assert runtime.deleted == []
    assert all(ledger(path)["tasks"][name]["status"] == "running" for name in ("alpha-work", "beta-work"))

    raised = run(zenith.set_concurrency(mission_id, "auto", workspace=str(tmp_path), min_concurrency=2, max_concurrency=4))
    repeated = run(zenith.set_concurrency(mission_id, "auto", workspace=str(tmp_path), min_concurrency=2, max_concurrency=4))
    assert raised["concurrency_policy"]["mode"] == "auto"
    assert raised["concurrency_policy"]["maximum"] == 4
    assert repeated["idempotent"] is True


def test_plan_rejects_task_that_can_never_fit_policy(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from conftest import single_assertion_plan

    runtime = __import__("conftest").install_runtime(monkeypatch, tmp_path)
    started = run(zenith.start("Impossible capacity", workspace=str(tmp_path), concurrency=2, require_preflight=False))
    contract, tasks = single_assertion_plan()
    tasks[0]["concurrency_cost"] = 3

    with pytest.raises(zenith.ZenithError, match="exceed the concurrency policy maximum 2"):
        zenith.submit_plan(started["mission_id"], contract, tasks, workspace=str(tmp_path))
    assert runtime.spawn_calls == []


def test_concurrent_advances_do_not_oversubscribe_weighted_capacity(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import asyncio

    contract, tasks = three_ready_plan()
    for task in tasks:
        if task["role"] == "work":
            task["concurrency_cost"] = 2
    runtime, mission_id, path = start_with_plan(
        tmp_path, monkeypatch, concurrency=4, plan=(contract, tasks)
    )
    original_spawn = runtime.spawn
    spawn_entered = asyncio.Event()
    release_spawn = asyncio.Event()

    async def blocked_spawn(prompt: str, *, name: str, model: str | None = None):
        spawn_entered.set()
        await release_spawn.wait()
        return await original_spawn(prompt, name=name, model=model)

    monkeypatch.setattr(zenith, "_rlm_spawn", blocked_spawn)

    async def concurrent_ticks() -> tuple[dict, dict]:
        first_task = asyncio.create_task(zenith.advance(mission_id, workspace=str(tmp_path)))
        await spawn_entered.wait()
        second = await zenith.advance(mission_id, workspace=str(tmp_path))
        release_spawn.set()
        first = await first_task
        return first, second

    first, second = run(concurrent_ticks())
    dispatched = first["dispatched"] + second["dispatched"]
    state = ledger(path)

    assert len({item["task_id"] for item in dispatched}) == len(dispatched) == 2
    assert sum(
        task["concurrency_cost"]
        for task in state["tasks"].values()
        if task["status"] in {"dispatching", "running"}
    ) == 4
    assert len(runtime.spawn_calls) == 2
    assert first["state"] == second["state"] == "running"
    assert ledger(path)["attention_open"] == []


@pytest.mark.parametrize("bad", [0, 33, True, 1.5, None, "1", "AUTO"])
def test_start_rejects_invalid_concurrency_modes(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, bad: object
) -> None:
    __import__("conftest").install_runtime(monkeypatch, tmp_path)
    with pytest.raises(zenith.ZenithError, match="concurrency"):
        run(zenith.start("Invalid concurrency", workspace=str(tmp_path), concurrency=bad, require_preflight=False))


def test_legacy_ledger_without_policy_uses_fixed_concurrency(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    runtime, mission_id, path = start_with_plan(
        tmp_path, monkeypatch, concurrency=2, plan=two_branch_plan()
    )
    state = ledger(path)
    state.pop("concurrency_policy")
    for task in state["tasks"].values():
        task.pop("concurrency_cost", None)
        task.pop("exclusive", None)
        task.pop("priority", None)
    (path / "mission.json").write_text(json.dumps(state))

    advanced = run(zenith.advance(mission_id, workspace=str(tmp_path)))

    assert [item["task_id"] for item in advanced["dispatched"]] == ["alpha-work", "beta-work"]
    assert advanced["concurrency_policy"]["mode"] == "fixed"
    assert advanced["concurrency_policy"]["effective"] == 2
    assert len(runtime.spawn_calls) == 2

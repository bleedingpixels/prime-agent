from __future__ import annotations

import json
from pathlib import Path

import pytest

import zenith
from conftest import install_runtime, run, single_assertion_plan, start_with_plan


def read_json(path: Path) -> object:
    return json.loads(path.read_text())


def test_start_creates_durable_root_owned_planning_schema_without_admitting_a_child(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime = install_runtime(monkeypatch, tmp_path)

    result = run(
        zenith.start(
            "  Implement a durable verified feature.  ",
            workspace=str(tmp_path),
            concurrency=2,
            model="planner-model",
        )
    )

    mission_id = result["mission_id"]
    mission_dir = tmp_path / ".prime" / "agent" / "zenith" / "missions" / mission_id
    assert Path(result["path"]) == mission_dir
    assert mission_dir.is_dir()
    for directory in ("contract", "attempts", "evidence", "terminal-reviews"):
        assert (mission_dir / directory).is_dir()
    for artifact in ("mission.json", "mission.md", "brief.md", "attention.json", "decisions.json", "events.json"):
        assert (mission_dir / artifact).stat().st_size > 0

    ledger = read_json(mission_dir / "mission.json")
    assert isinstance(ledger, dict)
    assert ledger["schema_version"] == 1
    assert ledger["workspace"] == str(tmp_path.resolve())
    assert ledger["brief"] == "Implement a durable verified feature."
    assert ledger["state"] == "planning"
    assert ledger["concurrency"] == 2
    assert ledger["models"]["work"] == "planner-model"
    assert ledger["require_preflight"] is True
    assert ledger["preflight"] == {"accepted": None}
    assert ledger["tasks"] == {}
    assert ledger["assertions"] == {}
    assert runtime.spawn_calls == []


@pytest.mark.parametrize("brief", ["", "   ", None])
def test_start_rejects_empty_brief(
    brief: object,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_runtime(monkeypatch, tmp_path)
    with pytest.raises(zenith.ZenithError, match="brief must be a non-empty string"):
        run(zenith.start(brief, workspace=str(tmp_path)))  # type: ignore[arg-type]
    assert not (tmp_path / ".prime" / "agent" / "zenith" / "missions").exists()


@pytest.mark.parametrize("concurrency", [0, 33, True, 1.5])
def test_start_rejects_invalid_concurrency(
    concurrency: object,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_runtime(monkeypatch, tmp_path)
    with pytest.raises(zenith.ZenithError, match="concurrency must be an integer from 1 through 32"):
        run(zenith.start("brief", workspace=str(tmp_path), concurrency=concurrency))  # type: ignore[arg-type]


def test_submit_plan_inspect_and_list_missions_round_trip(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime = install_runtime(monkeypatch, tmp_path)
    started = run(zenith.start("Plan and deliver", workspace=str(tmp_path), require_preflight=False))
    contract, tasks = single_assertion_plan()

    submitted = zenith.submit_plan(
        started["mission_id"],
        contract=contract,
        tasks=tasks,
        workspace=str(tmp_path),
        mission="A non-empty mission report preface.",
    )
    inspected = zenith.inspect(started["mission_id"], workspace=str(tmp_path))
    listed = zenith.list_missions(workspace=str(tmp_path))

    assert submitted["state"] == "running"
    assert submitted["task_count"] == 3
    assert inspected["mission"]["tasks"]["work"]["status"] == "pending"
    mission_dir = Path(inspected["path"])
    persisted_contract = read_json(mission_dir / "contract.json")
    persisted_plan = read_json(mission_dir / "plan.json")
    assert persisted_contract["assertions"][0]["id"] == "feature"
    assert persisted_plan["mission"] == "A non-empty mission report preface."
    assert [mission["mission_id"] for mission in listed["missions"]] == [started["mission_id"]]
    assert runtime.spawn_calls == []


def test_submit_plan_is_idempotent_only_for_the_same_plan(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, _ = start_with_plan(tmp_path, monkeypatch)
    contract, tasks = single_assertion_plan()

    repeated = zenith.submit_plan(
        mission_id,
        contract=contract,
        tasks=tasks,
        workspace=str(tmp_path),
        mission="Verified delivery",
    )
    assert repeated["idempotent"] is True

    changed = list(tasks)
    changed[0] = {**tasks[0], "description": "Changed work after submission."}
    with pytest.raises(zenith.ZenithError, match="cannot accept a plan"):
        zenith.submit_plan(
            mission_id,
            contract=contract,
            tasks=changed,
            workspace=str(tmp_path),
            mission="Verified delivery",
        )


def test_planning_preflight_review_handoff_is_atomic_and_does_not_mutate_aggregate_state(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_runtime(monkeypatch, tmp_path)
    started = run(zenith.start("Plan after adversarial review", workspace=str(tmp_path)))

    first = run(
        zenith.end_review(
            started["mission_id"],
            "contract-critic-1",
            passed=False,
            report="Read-only critic found an ambiguous negative-case assertion.",
            gaps=["Specify the negative case before submitting the plan."],
            evidence=["contract line-by-line inspection"],
            workspace=str(tmp_path),
        )
    )
    repeated = run(
        zenith.end_review(
            started["mission_id"],
            "contract-critic-1",
            passed=False,
            report="Read-only critic found an ambiguous negative-case assertion.",
            gaps=["Specify the negative case before submitting the plan."],
            evidence=["contract line-by-line inspection"],
            workspace=str(tmp_path),
        )
    )
    result = read_json(Path(first["result_path"]))
    state = read_json(Path(started["mission_path"]))

    assert repeated["idempotent"] is True
    assert result["phase"] == "preflight"
    assert result["report"].strip()
    assert result["evidence"]
    assert state["state"] == "planning"
    assert state["review"] == {"status": "pending", "attempts": []}


def test_submit_plan_requires_latest_passing_preflight_and_persists_summary(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_runtime(monkeypatch, tmp_path)
    started = run(zenith.start("Preflight-gated plan", workspace=str(tmp_path)))
    contract, tasks = single_assertion_plan()

    with pytest.raises(zenith.ZenithError, match="requires at least one passing preflight"):
        zenith.submit_plan(started["mission_id"], contract, tasks, workspace=str(tmp_path), mission="charter")

    run(
        zenith.end_review(
            started["mission_id"],
            "preflight-pass-1",
            passed=True,
            report="The bounded charter and contract are falsifiable and safe to submit.",
            evidence=[{"kind": "contract-inspection", "summary": "Reviewed all assertions."}],
            workspace=str(tmp_path),
        )
    )
    run(
        zenith.end_review(
            started["mission_id"],
            "preflight-fail-2",
            passed=False,
            report="The latest revision reintroduced an uncovered hazard.",
            gaps=["Add the missing hazard boundary."],
            evidence=[{"kind": "contract-inspection", "summary": "Reviewed the latest revision."}],
            workspace=str(tmp_path),
        )
    )
    with pytest.raises(zenith.ZenithError, match="latest preflight review preflight-fail-2 did not pass"):
        zenith.submit_plan(started["mission_id"], contract, tasks, workspace=str(tmp_path), mission="charter")

    run(
        zenith.end_review(
            started["mission_id"],
            "preflight-pass-3",
            passed=True,
            report="The revised charter closes the hazard and is ready for execution.",
            evidence=[{"kind": "contract-inspection", "summary": "Rechecked the revised contract."}],
            workspace=str(tmp_path),
        )
    )
    submitted = zenith.submit_plan(
        started["mission_id"], contract, tasks, workspace=str(tmp_path), mission="charter"
    )
    persisted = read_json(Path(started["mission_path"]))

    assert submitted["state"] == "running"
    assert persisted["preflight"]["accepted"]["attempt_id"] == "preflight-pass-3"
    assert persisted["preflight"]["accepted"]["report"].strip()
    assert persisted["preflight"]["accepted"]["evidence"]


def test_ledger_authority_rejects_symlinked_workspace_path(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_runtime(monkeypatch, tmp_path)
    outside = tmp_path / "outside"
    outside.mkdir()
    (tmp_path / ".prime").symlink_to(outside, target_is_directory=True)

    with pytest.raises(zenith.ZenithError, match="ledger authority path must not contain symlinks"):
        run(zenith.start("Do not escape workspace", workspace=str(tmp_path)))

    assert list(outside.iterdir()) == []

from __future__ import annotations

import json
from pathlib import Path

import pytest

import zenith
from conftest import run, start_with_plan, strict_decide, strict_decide_arguments, two_branch_plan


def read_json(path: Path) -> object:
    return json.loads(path.read_text())


def fail_work(
    workspace: Path,
    mission_id: str,
    runtime: object,
) -> dict:
    dispatched = run(zenith.advance(mission_id, workspace=str(workspace)))["dispatched"][0]
    run(
        zenith.end_task(
            mission_id,
            dispatched["task_id"],
            dispatched["attempt_id"],
            done=False,
            passed=False,
            report="The work attempt failed after a focused command exposed a deterministic defect.",
            evidence=["focused command failed"],
            workspace=str(workspace),
        )
    )
    runtime.set_status(dispatched["handle"]["rlm_child_id"], "completed")
    result = run(zenith.advance(mission_id, workspace=str(workspace)))
    assert result["state"] == "attention_needed"
    return dispatched


def open_attention(path: Path) -> list[dict]:
    return [item for item in read_json(path / "attention.json") if item["status"] == "open"]


def test_decide_requires_exactly_one_decision_for_every_open_attention(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    fail_work(tmp_path, mission_id, runtime)
    attention = open_attention(path)
    assert len(attention) >= 2

    one = {"attention_id": attention[0]["id"], "action": "retry", "task_id": "work"}
    kwargs = strict_decide_arguments(tmp_path, mission_id, [one])
    with pytest.raises(zenith.ZenithError, match="cover every open attention item exactly once"):
        run(zenith.decide(mission_id, [one], workspace=str(tmp_path), **kwargs))

    duplicate = [one, one]
    # Duplicate action evidence cannot be constructed; strict parsing rejects
    # the duplicate before any state access or write.
    with pytest.raises(zenith.ZenithError, match="duplicate attention_id"):
        run(
            zenith.decide(
                mission_id,
                duplicate,
                workspace=str(tmp_path),
                expected_revision=kwargs["expected_revision"],
                expected_file_hashes=kwargs["expected_file_hashes"],
                evidence_manifest=kwargs["evidence_manifest"],
                operation_id=kwargs["operation_id"],
            )
        )

    extra = [
        *[{"attention_id": item["id"], "action": "retry", "task_id": "work"} for item in attention],
        {"attention_id": "not-open", "action": "retry", "task_id": "work"},
    ]
    extra_kwargs = strict_decide_arguments(tmp_path, mission_id, extra)
    with pytest.raises(zenith.ZenithError, match="extra=.*not-open"):
        run(zenith.decide(mission_id, extra, workspace=str(tmp_path), **extra_kwargs))
    assert len(open_attention(path)) == len(attention)


def test_retry_resolves_all_attention_and_creates_a_new_attempt(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    first = fail_work(tmp_path, mission_id, runtime)
    decisions = [
        {"attention_id": item["id"], "action": "retry", "task_id": "work"}
        for item in open_attention(path)
    ]

    decided = strict_decide(tmp_path, mission_id, decisions)
    retried = run(zenith.advance(mission_id, workspace=str(tmp_path)))

    assert decided["state"] == "running"
    assert open_attention(path) == []
    assert retried["dispatched"][0]["task_id"] == "work"
    assert retried["dispatched"][0]["attempt_id"] == "a0002"
    assert retried["dispatched"][0]["handle"]["rlm_child_id"] != first["handle"]["rlm_child_id"]


def test_continue_records_explicit_accepted_risk_and_can_reach_review_gate(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    work = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]
    run(
        zenith.end_task(
            mission_id,
            "work",
            work["attempt_id"],
            done=True,
            passed=True,
            report="Work completed and focused checks ran.",
            evidence=["focused checks"],
            workspace=str(tmp_path),
        )
    )
    runtime.set_status(work["handle"]["rlm_child_id"], "completed")
    validator = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]
    run(
        zenith.end_task(
            mission_id,
            "validator",
            validator["attempt_id"],
            done=True,
            passed=True,
            report="Independent validation found a known environmental discrepancy.",
            verdicts={"feature": "failed"},
            evidence=["fresh validator command output"],
            workspace=str(tmp_path),
        )
    )
    runtime.set_status(validator["handle"]["rlm_child_id"], "completed")
    run(zenith.advance(mission_id, workspace=str(tmp_path)))

    decisions = [
        {
            "attention_id": item["id"],
            "action": "continue",
            "accepted_risks": ["feature"],
            "reason": "The user explicitly accepts the documented environmental discrepancy.",
        }
        for item in open_attention(path)
    ]
    continued = strict_decide(tmp_path, mission_id, decisions)
    state = read_json(path / "mission.json")

    assert continued["state"] == "ready_for_review"
    assert state["assertions"]["feature"]["status"] == "accepted_risk"
    assert state["assertions"]["feature"]["accepted_risk"]["reason"]
    assert state["assertions"]["feature"]["evidence"]


def test_strict_patch_fails_closed_without_partial_plan_persistence(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    fail_work(tmp_path, mission_id, runtime)
    attention = open_attention(path)
    replacement_tasks = [
        {
            "id": "work-v2",
            "role": "work",
            "targets": ["feature"],
            "depends_on": [],
            "description": "Implement the corrected approach using failure evidence.",
        },
        {
            "id": "validator-v2",
            "role": "validate",
            "targets": ["feature"],
            "depends_on": ["work-v2"],
            "description": "Independently validate the corrected implementation.",
        },
        {
            "id": "gate-v2",
            "role": "gate",
            "targets": ["feature"],
            "depends_on": ["validator-v2"],
        },
    ]
    decisions = [
        {
            "attention_id": item["id"],
            "action": "patch",
            "patch": {
                "supersede": ["work", "validator", "gate"],
                "add_tasks": replacement_tasks,
            }
            if index == 0
            else {},
        }
        for index, item in enumerate(attention)
    ]
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    before = {name: (path / name).read_bytes() for name in zenith._DECIDE_HASH_FILES}

    with pytest.raises(zenith.ZenithError) as raised:
        run(zenith.decide(mission_id, decisions, workspace=str(tmp_path), **kwargs))

    assert raised.value.code == "PATCH_TRANSACTION_UNAVAILABLE"
    assert {name: (path / name).read_bytes() for name in zenith._DECIDE_HASH_FILES} == before
    assert not (path / ".zenith-decide").exists()




def test_missing_handoff_and_stale_child_are_deduplicated_then_recoverable_by_retry(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    work = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]
    runtime.set_status(work["handle"]["rlm_child_id"], "completed")

    first = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    second = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    attention = open_attention(path)

    assert first["state"] == "attention_needed"
    assert second["state"] == "attention_needed"
    assert [item["kind"] for item in attention] == ["missing_handoff"]
    decisions = [
        {"attention_id": attention[0]["id"], "action": "retry", "task_id": "work"}
    ]
    strict_decide(tmp_path, mission_id, decisions)
    replacement = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]
    assert replacement["attempt_id"] == "a0002"


def test_orphaned_child_handle_opens_attention_instead_of_guessing_completion(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    work = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]
    runtime.children = [
        child for child in runtime.children if child["rlm_child_id"] != work["handle"]["rlm_child_id"]
    ]

    advanced = run(zenith.advance(mission_id, workspace=str(tmp_path)))

    assert advanced["state"] == "attention_needed"
    assert [item["kind"] for item in open_attention(path)] == ["orphaned_child"]


def test_invalid_second_decision_leaves_every_ledger_file_byte_identical(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    fail_work(tmp_path, mission_id, runtime)
    attention = open_attention(path)
    assert len(attention) >= 2
    decisions = [
        {
            "attention_id": attention[0]["id"],
            "action": "continue",
            "accepted_risks": ["feature"],
            "reason": "This mutation must remain staged when a later decision is invalid.",
        },
        {
            "attention_id": attention[1]["id"],
            "action": "retry",
            "task_id": "missing-task",
        },
        *[
            {
                "attention_id": item["id"],
                "action": "continue",
                "accepted_risks": ["feature"],
                "reason": "Covered only so the batch reaches full validation.",
            }
            for item in attention[2:]
        ],
    ]

    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    before = {
        item.relative_to(path): item.read_bytes()
        for item in path.rglob("*")
        if item.is_file() and item.name != ".lock"
    }
    with pytest.raises(zenith.ZenithError, match="must identify a task"):
        run(zenith.decide(mission_id, decisions, workspace=str(tmp_path), **kwargs))

    after = {
        item.relative_to(path): item.read_bytes()
        for item in path.rglob("*")
        if item.is_file() and item.name != ".lock"
    }
    assert after == before


def test_repeated_strict_patch_requests_never_reserve_operation_or_mutate_history(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    fail_work(tmp_path, mission_id, runtime)
    attention = open_attention(path)
    decisions = [
        {"attention_id": item["id"], "action": "patch", "patch": {}}
        for item in attention
    ]
    before = {name: (path / name).read_bytes() for name in zenith._DECIDE_HASH_FILES}

    for _ in range(2):
        kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
        with pytest.raises(zenith.ZenithError) as raised:
            run(zenith.decide(mission_id, decisions, workspace=str(tmp_path), **kwargs))
        assert raised.value.code == "PATCH_TRANSACTION_UNAVAILABLE"

    assert {name: (path / name).read_bytes() for name in zenith._DECIDE_HASH_FILES} == before
    assert not (path / ".zenith-decide").exists()




def test_patch_refuses_to_supersede_a_running_task(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(
        tmp_path, monkeypatch, concurrency=2, plan=two_branch_plan()
    )
    dispatched = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"]
    alpha = next(item for item in dispatched if item["task_id"] == "alpha-work")
    run(
        zenith.end_task(
            mission_id,
            alpha["task_id"],
            alpha["attempt_id"],
            done=False,
            passed=False,
            report="Alpha failed while beta remains active.",
            evidence=["alpha failure"],
            workspace=str(tmp_path),
        )
    )
    runtime.set_status(alpha["handle"]["rlm_child_id"], "completed")
    run(zenith.advance(mission_id, workspace=str(tmp_path)))
    attention = open_attention(path)
    decisions = [
        {
            "attention_id": item["id"],
            "action": "patch",
            "patch": {"supersede": ["beta-work"]} if index == 0 else {},
        }
        for index, item in enumerate(attention)
    ]

    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    with pytest.raises(zenith.ZenithError) as raised:
        run(zenith.decide(mission_id, decisions, workspace=str(tmp_path), **kwargs))
    assert raised.value.code == "PATCH_TRANSACTION_UNAVAILABLE"


@pytest.mark.parametrize("status", ["dispatching", "running", "cleared"])
def test_patch_refuses_to_supersede_active_or_cleared_task_status(
    status: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, _, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    state = read_json(path / "mission.json")
    contract = read_json(path / "contract.json")
    plan = read_json(path / "plan.json")
    state["tasks"]["work"]["status"] = status

    with pytest.raises(zenith.ZenithError, match=f"cannot supersede {status} task work"):
        zenith._apply_patch(
            state,
            contract,
            plan,
            [{"patch": {"supersede": ["work"]}}],
        )


def test_patch_allows_superseding_cleared_validator_with_failed_verdicts(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    state = read_json(path / "mission.json")
    contract = read_json(path / "contract.json")
    plan = read_json(path / "plan.json")
    state["tasks"]["work"]["status"] = "cleared"
    state["tasks"]["validator"]["status"] = "cleared"
    state["tasks"]["validator"]["latest_verdicts"] = {"feature": "failed"}
    state["tasks"]["gate"]["status"] = "failed"
    replacement = [
        {
            "id": "validator-v2",
            "role": "validate",
            "targets": ["feature"],
            "depends_on": ["work"],
            "description": "Fresh validation after the reliable rejection.",
        },
        {
            "id": "gate-v2",
            "role": "gate",
            "targets": ["feature"],
            "depends_on": ["validator-v2"],
        },
    ]

    staged_contract, staged_plan = zenith._apply_patch(
        state,
        contract,
        plan,
        [
            {
                "patch": {
                    "supersede": ["validator", "gate"],
                    "add_tasks": replacement,
                }
            }
        ],
    )

    assert staged_contract == contract
    assert next(task for task in staged_plan["tasks"] if task["id"] == "validator")["superseded"]
    assert next(task for task in staged_plan["tasks"] if task["id"] == "gate")["superseded"]
    assert {task["id"] for task in staged_plan["tasks"] if not task.get("superseded")} == {
        "work", "validator-v2", "gate-v2"
    }


@pytest.mark.parametrize(
    ("role", "verdicts"),
    [
        ("work", {}),
        ("validate", {"feature": "passed"}),
        ("validate", {}),
        ("validate", {"feature": "failed", "other": "passed"}),
        ("validate", {"feature": "blocked"}),
    ],
)
def test_patch_refuses_to_supersede_other_cleared_tasks(
    role: str,
    verdicts: dict[str, str],
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, _, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    state = read_json(path / "mission.json")
    contract = read_json(path / "contract.json")
    plan = read_json(path / "plan.json")
    task_id = "validator" if role == "validate" else "work"
    state["tasks"][task_id]["status"] = "cleared"
    state["tasks"][task_id]["latest_verdicts"] = verdicts

    with pytest.raises(zenith.ZenithError, match=f"cannot supersede cleared task {task_id}"):
        zenith._apply_patch(
            state,
            contract,
            plan,
            [{"patch": {"supersede": [task_id]}}],
        )


def test_patch_refuses_to_cancel_cleared_failed_validator(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, _, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    state = read_json(path / "mission.json")
    contract = read_json(path / "contract.json")
    plan = read_json(path / "plan.json")
    state["tasks"]["validator"]["status"] = "cleared"
    state["tasks"]["validator"]["latest_verdicts"] = {"feature": "failed"}

    with pytest.raises(zenith.ZenithError, match="cannot cancel cleared task validator"):
        zenith._apply_patch(
            state,
            contract,
            plan,
            [{"patch": {"cancel": ["validator"]}}],
        )


def test_patch_cancels_pending_task_through_preserved_inactive_history(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, _, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    state = read_json(path / "mission.json")
    contract = read_json(path / "contract.json")
    plan = read_json(path / "plan.json")
    replacement = [
        {
            "id": "validator-v2",
            "role": "validate",
            "targets": ["feature"],
            "depends_on": ["work"],
            "description": "Replacement validation after pending cancellation.",
        },
        {
            "id": "gate-v2",
            "role": "gate",
            "targets": ["feature"],
            "depends_on": ["validator-v2"],
        },
    ]

    _, staged_plan = zenith._apply_patch(
        state,
        contract,
        plan,
        [
            {
                "patch": {
                    "cancel": ["validator", "gate"],
                    "add_tasks": replacement,
                }
            }
        ],
    )

    assert next(task for task in staged_plan["tasks"] if task["id"] == "validator")["superseded"]
    assert next(task for task in staged_plan["tasks"] if task["id"] == "gate")["superseded"]
    assert {task["id"] for task in staged_plan["tasks"] if not task.get("superseded")} == {
        "work", "validator-v2", "gate-v2"
    }

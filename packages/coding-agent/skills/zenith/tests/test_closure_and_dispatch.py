from __future__ import annotations

import json
from pathlib import Path

import pytest

import zenith
from conftest import install_runtime, run, start_with_plan, strict_decide


def mission(path: Path) -> dict:
    return json.loads((path / "mission.json").read_text())


def complete_task(
    workspace: Path,
    mission_id: str,
    runtime: object,
    dispatched: dict,
    *,
    validator: bool = False,
) -> None:
    run(
        zenith.end_task(
            mission_id,
            dispatched["task_id"],
            dispatched["attempt_id"],
            done=True,
            passed=True,
            report=(
                "Independent validator inspected the diff and reran a focused command."
                if validator
                else "Worker implemented the bounded change and ran a focused command."
            ),
            verdicts={"feature": "passed"} if validator else None,
            evidence=["fresh validator evidence" if validator else "worker check output"],
            workspace=str(workspace),
        )
    )
    runtime.set_status(dispatched["handle"]["rlm_child_id"], "completed")


def ready_mission(
    workspace: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> tuple[object, str, Path]:
    runtime, mission_id, path = start_with_plan(workspace, monkeypatch, concurrency=1)
    work = run(zenith.advance(mission_id, workspace=str(workspace)))["dispatched"][0]
    complete_task(workspace, mission_id, runtime, work)
    validator = run(zenith.advance(mission_id, workspace=str(workspace)))["dispatched"][0]
    complete_task(workspace, mission_id, runtime, validator, validator=True)
    advanced = run(zenith.advance(mission_id, workspace=str(workspace)))
    assert advanced["state"] == "ready_for_review"
    return runtime, mission_id, path


def test_close_is_strict_until_tasks_assertions_gates_and_evidence_are_clear(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)

    with pytest.raises(zenith.ZenithError, match="cannot close while state is running"):
        run(zenith.close(mission_id, workspace=str(tmp_path)))

    assert runtime.list_calls == 0
    assert runtime.spawn_calls == []
    assert mission(path)["tasks"]["work"]["status"] == "pending"


def test_close_admits_independent_terminal_reviewer_with_ledger_blind_prompt(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = ready_mission(tmp_path, monkeypatch)

    closed = run(zenith.close(mission_id, workspace=str(tmp_path)))
    state = mission(path)
    review = state["review"]["attempts"][0]
    review_spawn = runtime.spawn_calls[-1]

    assert closed["state"] == "reviewing"
    assert state["review"]["status"] == "running"
    assert review["handle"]["rlm_child_id"] == closed["review"]["attempts"][0]["handle"]["rlm_child_id"]
    assert "forbidden to read or rely on any files under .prime/agent/zenith" in review_spawn["prompt"]
    assert "end_review" in review_spawn["prompt"]
    assert "agent_message" not in review_spawn["prompt"]


@pytest.mark.parametrize(
    "report, evidence, message",
    [
        ("", ["evidence"], "review report must be a non-empty string"),
        ("Independent report", None, "requires non-empty independent evidence"),
        ("Independent report", [], "requires non-empty independent evidence"),
    ],
)
def test_terminal_review_rejects_blank_report_or_evidence(
    report: str,
    evidence: object,
    message: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path = ready_mission(tmp_path, monkeypatch)
    run(zenith.close(mission_id, workspace=str(tmp_path)))
    attempt_id = mission(path)["review"]["attempts"][0]["id"]

    with pytest.raises(zenith.ZenithError, match=message):
        run(
            zenith.end_review(
                mission_id,
                attempt_id,
                passed=True,
                report=report,
                evidence=evidence,
                workspace=str(tmp_path),
            )
        )


def test_passing_independent_terminal_review_is_ingested_once_and_closes_mission(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = ready_mission(tmp_path, monkeypatch)
    run(zenith.close(mission_id, workspace=str(tmp_path)))
    review = mission(path)["review"]["attempts"][0]
    handed_off = run(
        zenith.end_review(
            mission_id,
            review["id"],
            passed=True,
            report="Independent terminal review reran required checks and found no unresolved gaps.",
            gaps=[],
            evidence={"commands": ["focused tests"], "diff": "independently inspected"},
            workspace=str(tmp_path),
        )
    )
    assert Path(handed_off["result_path"]).stat().st_size > 0
    runtime.set_status(review["handle"]["rlm_child_id"], "completed")

    first = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    second = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    state = mission(path)

    assert first["state"] == "done"
    assert second["state"] == "done"
    assert state["review"]["status"] == "cleared"
    assert state["review"]["attempts"][0]["ingested"] is True
    review_result = state["review"]["attempts"][0]["result"]
    assert review_result["report"].strip()
    assert review_result["evidence"]


def test_failed_independent_terminal_review_opens_attention_and_blocks_close(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = ready_mission(tmp_path, monkeypatch)
    run(zenith.close(mission_id, workspace=str(tmp_path)))
    review = mission(path)["review"]["attempts"][0]
    run(
        zenith.end_review(
            mission_id,
            review["id"],
            passed=False,
            report="Independent terminal review reproduced an unresolved regression.",
            gaps=["focused regression remains"],
            evidence=["fresh failing command output"],
            workspace=str(tmp_path),
        )
    )
    runtime.set_status(review["handle"]["rlm_child_id"], "completed")

    advanced = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    attention = json.loads((path / "attention.json").read_text())

    assert advanced["state"] == "attention_needed"
    assert mission(path)["review"]["status"] == "failed"
    assert any(item["kind"] == "terminal_review_failed" and item["status"] == "open" for item in attention)
    with pytest.raises(zenith.ZenithError, match="cannot close"):
        run(zenith.close(mission_id, workspace=str(tmp_path)))


def test_legacy_abort_fails_closed_without_state_or_metadata_writes(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = start_with_plan(tmp_path, monkeypatch, concurrency=1)
    work = run(zenith.advance(mission_id, workspace=str(tmp_path)))["dispatched"][0]
    before = {
        name: (path / name).read_bytes()
        for name in ("mission.json", "events.json", "mission.md")
    }

    for _ in range(2):
        with pytest.raises(zenith.ZenithError) as raised:
            run(zenith.abort(mission_id, "User withdrew the mission.", workspace=str(tmp_path)))
        assert raised.value.code == "LEGACY_ABORT_UNAVAILABLE"
        assert raised.value.http_status == 428

    assert {name: (path / name).read_bytes() for name in before} == before
    assert not (path / ".zenith-decide").exists()
    assert mission(path)["state"] == "running"
    assert work["handle"]["rlm_child_id"] not in runtime.deleted


def test_run_dispatches_json_file_actions_and_returns_machine_readable_envelopes(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_runtime(monkeypatch, tmp_path)
    started = json.loads(
        run(
            zenith.run(
                brief="Dispatch through run",
                workspace=str(tmp_path),
                action="start",
                persistent=False,
                concurrency=1,
                require_preflight=False,
            )
        )
    )
    contract = {"assertions": [{"id": "feature", "description": "Feature works.", "required_evidence": ["focused-test"]}]}
    tasks = [
        {"id": "work", "role": "work", "targets": ["feature"], "depends_on": [], "description": "work"},
        {"id": "validator", "role": "validate", "targets": ["feature"], "depends_on": ["work"], "description": "validate"},
        {"id": "gate", "role": "gate", "targets": ["feature"], "depends_on": ["validator"]},
    ]
    plan_path = tmp_path / "plan-input.json"
    plan_path.write_text(json.dumps({"contract": contract, "tasks": tasks, "mission": "JSON dispatch"}))

    submitted = json.loads(
        run(
            zenith.run(
                action="submit_plan",
                mission_id=started["mission_id"],
                workspace=str(tmp_path),
                input_path=str(plan_path),
            )
        )
    )
    listed = json.loads(run(zenith.run(action="list", workspace=str(tmp_path))))
    invalid = json.loads(run(zenith.run(action="not-an-action", workspace=str(tmp_path))))

    assert submitted["ok"] is True and submitted["action"] == "submit_plan"
    assert listed["missions"][0]["mission_id"] == started["mission_id"]
    assert invalid["ok"] is False
    assert invalid["error_type"] == "ZenithError"
    assert invalid["error"].strip()


def test_run_routes_every_supported_public_action_through_json_envelopes(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[str] = []

    def sync_stub(name: str):
        def call(*args: object, **kwargs: object) -> dict:
            calls.append(name)
            return {"ok": True, "marker": name}

        return call

    def async_stub(name: str):
        async def call(*args: object, **kwargs: object) -> dict:
            calls.append(name)
            return {"ok": True, "marker": name}

        return call

    for name in ("start", "advance", "set_concurrency", "decide", "close", "abort", "end_task", "end_review", "ensure_continuity", "finalize_continuity"):
        monkeypatch.setattr(zenith, name, async_stub(name))
    for name in ("submit_plan", "inspect", "list_missions"):
        monkeypatch.setattr(zenith, name, sync_stub(name))

    payload_path = tmp_path / "dispatch-input.json"
    payload_path.write_text(
        json.dumps(
            {
                "contract": {},
                "tasks": [],
                "mission": "dispatch",
                "decisions": [],
                "reason": "dispatch",
                "task_id": "task",
                "attempt_id": "attempt",
                "done": True,
                "passed": True,
                "report": "non-empty",
                "evidence": ["non-empty"],
                "complete_goal": False,
                "concurrency": "auto",
                "min_concurrency": 2,
                "max_concurrency": 6,
            }
        )
    )
    strict_payload_path = tmp_path / "strict-dispatch-input.json"
    strict_payload_path.write_text(
        json.dumps(
            {
                "decisions": [],
                "expected_revision": 0,
                "expected_file_hashes": {},
                "evidence_manifest": {},
                "operation_id": "00000000-0000-4000-8000-000000000000",
            }
        )
    )
    actions = [
        "start",
        "submit_plan",
        "inspect",
        "list",
        "list_missions",
        "advance",
        "set_concurrency",
        "decide",
        "close",
        "abort",
        "end_task",
        "end_review",
        "ensure_continuity",
        "finalize_continuity",
    ]
    outputs = []
    for action in actions:
        needs_input = action in {"submit_plan", "set_concurrency", "decide", "abort", "end_task", "end_review", "finalize_continuity"}
        outputs.append(
            json.loads(
                run(
                    zenith.run(
                        action=action,
                        brief="brief",
                        mission_id="mission",
                        workspace=str(tmp_path),
                        input_path=(
                            str(strict_payload_path)
                            if action in {"decide", "abort"}
                            else str(payload_path) if needs_input else ""
                        ),
                        persistent=False,
                    )
                )
            )
        )

    assert all(output["ok"] is True and output["marker"] for output in outputs)
    assert calls == [
        "start",
        "submit_plan",
        "inspect",
        "list_missions",
        "list_missions",
        "advance",
        "set_concurrency",
        "decide",
        "close",
        "abort",
        "end_task",
        "end_review",
        "ensure_continuity",
        "finalize_continuity",
    ]


def test_legacy_abort_cannot_win_terminal_reviewer_admission_race(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = ready_mission(tmp_path, monkeypatch)
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
    closed = run(zenith.close(mission_id, workspace=str(tmp_path)))
    state = mission(path)
    handle = runtime.spawn_calls[-1]["handle"]

    assert rejected == ["LEGACY_ABORT_UNAVAILABLE"]
    assert closed["state"] == "reviewing"
    assert handle.rlm_child_id not in runtime.deleted
    assert state["review"]["status"] == "running"
    assert state["review"]["attempts"][-1]["status"] == "running"


def test_forged_terminal_review_result_cannot_move_mission_to_done(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    runtime, mission_id, path = ready_mission(tmp_path, monkeypatch)
    closed = run(zenith.close(mission_id, workspace=str(tmp_path)))
    review = closed["review"]["attempts"][-1]
    result_path = path / "terminal-reviews" / review["id"] / "result.json"
    result_path.write_text('{"passed": true}\n')
    runtime.set_status(review["handle"]["rlm_child_id"], "completed")

    advanced = run(zenith.advance(mission_id, workspace=str(tmp_path)))
    state = mission(path)
    attention = [
        item for item in json.loads((path / "attention.json").read_text()) if item["status"] == "open"
    ]

    assert advanced["state"] == "attention_needed"
    assert state["state"] != "done"
    assert state["review"]["status"] == "failed"
    assert state["review"]["attempts"][-1]["status"] == "error"
    assert {item["kind"] for item in attention} >= {"invalid_terminal_review_result"}


    decisions = [{"attention_id": item["id"], "action": "retry"} for item in attention]
    retried = strict_decide(tmp_path, mission_id, decisions)
    assert retried["state"] == "ready_for_review"

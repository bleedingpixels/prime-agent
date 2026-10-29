from __future__ import annotations

import json
from pathlib import Path

import pytest

import zenith
from conftest import install_runtime, run


def read_mission(path: Path) -> dict:
    return json.loads((path / "mission.json").read_text())


def install_continuity_hosts(monkeypatch: pytest.MonkeyPatch) -> dict[str, object]:
    calls: dict[str, object] = {"goals": 0, "heartbeats": [], "deleted": []}

    async def create_goal(objective: str) -> dict:
        calls["goals"] = int(calls["goals"]) + 1
        calls["objective"] = objective
        return {"goal_id": "goal-1"}

    async def get_goal() -> dict:
        return {"goal": {"id": "goal-1", "objective": calls.get("objective")}}

    async def complete_goal() -> dict:
        calls["goal_completed"] = True
        return {"ok": True}

    async def create_heartbeat(instruction: str, interval: str, label: str) -> dict:
        calls["heartbeats"].append(
            {"instruction": instruction, "interval": interval, "label": label}
        )
        return {"heartbeat_id": f"heartbeat-{len(calls['heartbeats'])}"}

    async def delete_heartbeat(heartbeat_id: str) -> dict:
        calls["deleted"].append(heartbeat_id)
        return {"ok": True}

    monkeypatch.setattr(zenith, "_goal_create", create_goal)
    monkeypatch.setattr(zenith, "_goal_get", get_goal)
    monkeypatch.setattr(zenith, "_goal_complete", complete_goal)
    monkeypatch.setattr(zenith, "_heartbeat_create", create_heartbeat)
    monkeypatch.setattr(zenith, "_heartbeat_delete", delete_heartbeat)
    return calls


def test_persistent_start_defaults_to_heartbeat_without_creating_a_goal(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_runtime(monkeypatch, tmp_path)
    calls = install_continuity_hosts(monkeypatch)

    started = run(zenith.start("Persist safely", workspace=str(tmp_path), persistent=True))
    state = read_mission(Path(started["path"]))
    instruction = calls["heartbeats"][0]["instruction"]

    assert calls["goals"] == 0
    assert state["continuity"]["goal_owned"] is False
    assert state["continuity"]["heartbeat_id"] == "heartbeat-1"
    assert "Continue Zenith mission" in instruction and "at most once" in instruction
    assert "dispatch=False" not in instruction
    assert "If attention is open, do not decide, accept risk, patch, retry, or abort" in instruction
    assert "If it dispatches children, end the turn immediately without polling" in instruction


def test_stale_setting_up_reservation_is_recovered(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_runtime(monkeypatch, tmp_path)
    calls = install_continuity_hosts(monkeypatch)
    started = run(zenith.start("Recover continuity", workspace=str(tmp_path)))
    path = Path(started["path"])
    state = read_mission(path)
    state["continuity"].update(
        {"setting_up": True, "setting_up_at": "2000-01-01T00:00:00+00:00"}
    )
    (path / "mission.json").write_text(json.dumps(state))

    recovered = run(
        zenith.ensure_continuity(started["mission_id"], workspace=str(tmp_path))
    )

    assert calls["goals"] == 0
    assert recovered["continuity"]["heartbeat_id"] == "heartbeat-1"
    assert "recovered a stale continuity setup reservation" in recovered["warnings"]


def test_failed_heartbeat_deletion_preserves_id_and_retries_finalization(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_runtime(monkeypatch, tmp_path)
    install_continuity_hosts(monkeypatch)
    started = run(zenith.start("Retry cleanup", workspace=str(tmp_path)))
    run(zenith.ensure_continuity(started["mission_id"], workspace=str(tmp_path)))

    async def fail_delete(heartbeat_id: str) -> None:
        raise RuntimeError("daemon unavailable")

    monkeypatch.setattr(zenith, "_heartbeat_delete", fail_delete)
    first = run(
        zenith.finalize_continuity(started["mission_id"], workspace=str(tmp_path))
    )
    assert first["continuity"]["finalized"] is False
    assert first["continuity"]["heartbeat_id"] == "heartbeat-1"

    deleted: list[str] = []

    async def succeed_delete(heartbeat_id: str) -> None:
        deleted.append(heartbeat_id)

    monkeypatch.setattr(zenith, "_heartbeat_delete", succeed_delete)
    second = run(
        zenith.finalize_continuity(started["mission_id"], workspace=str(tmp_path))
    )
    assert deleted == ["heartbeat-1"]
    assert second["continuity"]["finalized"] is True
    assert second["continuity"]["heartbeat_id"] is None


def test_legacy_abort_with_owned_goal_fails_closed_without_cleanup_side_effects(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    install_runtime(monkeypatch, tmp_path)
    calls = install_continuity_hosts(monkeypatch)
    started = run(zenith.start("Abort honestly", workspace=str(tmp_path)))
    run(
        zenith.ensure_continuity(
            started["mission_id"], workspace=str(tmp_path), create_goal=True
        )
    )
    path = tmp_path / ".prime" / "agent" / "zenith" / "missions" / started["mission_id"]
    before = (path / "mission.json").read_bytes()

    with pytest.raises(zenith.ZenithError) as raised:
        run(
            zenith.abort(
                started["mission_id"], "Mission cannot continue.", workspace=str(tmp_path)
            )
        )

    assert raised.value.code == "LEGACY_ABORT_UNAVAILABLE"
    assert raised.value.http_status == 428
    assert calls["goals"] == 1
    assert (path / "mission.json").read_bytes() == before
    assert not (path / ".zenith-decide").exists()

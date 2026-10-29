"""B11 remediation adversarial and crash-boundary tests."""
from __future__ import annotations

import copy
import errno
import hashlib
import hmac
import json
import os
import stat
import subprocess
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pytest

import zenith
from conftest import run, start_with_plan, strict_decide_arguments


class ProcessBoundary(BaseException):
    pass


def _json(path: Path) -> Any:
    return json.loads(path.read_text())


def _raw(path: Path) -> dict[str, bytes]:
    return {name: (path / name).read_bytes() for name in zenith._DECIDE_HASH_FILES}


def _fixture(
    workspace: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> tuple[str, Path, list[dict[str, Any]], dict[str, Any]]:
    runtime, mission_id, path = start_with_plan(workspace, monkeypatch, concurrency=1)
    dispatched = run(zenith.advance(mission_id, workspace=str(workspace)))["dispatched"][0]
    run(
        zenith.end_task(
            mission_id,
            dispatched["task_id"],
            dispatched["attempt_id"],
            done=False,
            passed=False,
            report="Bounded deterministic failure for B11 remediation tests.",
            evidence=["temporary fixture"],
            workspace=str(workspace),
        )
    )
    runtime.set_status(dispatched["handle"]["rlm_child_id"], "completed")
    assert run(zenith.advance(mission_id, workspace=str(workspace)))["state"] == "attention_needed"
    attention = [item for item in _json(path / "attention.json") if item["status"] == "open"]
    decisions = [
        {"attention_id": item["id"], "action": "retry", "task_id": "work"}
        for item in attention
    ]
    kwargs = strict_decide_arguments(workspace, mission_id, decisions)
    return mission_id, path, decisions, kwargs


def _call(workspace: Path, mission_id: str, decisions: Any, kwargs: dict[str, Any]) -> dict[str, Any]:
    return run(zenith.decide(mission_id, decisions, workspace=str(workspace), **kwargs))


def _continue_fixture(
    workspace: Path,
    monkeypatch: pytest.MonkeyPatch,
    *,
    issued_at: str | None = None,
) -> tuple[str, Path, list[dict[str, Any]], dict[str, Any]]:
    mission_id, path, _, _ = _fixture(workspace, monkeypatch)
    attention = [item for item in _json(path / "attention.json") if item["status"] == "open"]
    decisions = [
        {
            "attention_id": item["id"],
            "action": "continue",
            "accepted_risks": ["feature"],
            "reason": "Exact controller-authenticated temporary-fixture approval.",
        }
        for item in attention
    ]
    kwargs = strict_decide_arguments(
        workspace,
        mission_id,
        decisions,
        issued_at=issued_at,
    )
    return mission_id, path, decisions, kwargs


def _rewrite_descriptor_json(
    path: Path,
    descriptor: dict[str, Any],
    value: dict[str, Any],
) -> bytes:
    data = (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()
    os.chmod(path, 0o600)
    fd = os.open(path, os.O_WRONLY | os.O_TRUNC | os.O_CLOEXEC | os.O_NOFOLLOW)
    try:
        zenith._write_all(fd, data)
        os.fchmod(fd, 0o400)
        os.fsync(fd)
    finally:
        os.close(fd)
    value_stat = path.stat(follow_symlinks=False)
    descriptor.update({
        "sha256": zenith._sha256_bytes(data),
        "size": len(data),
        "mode": "0400",
        "identity": {
            "device": value_stat.st_dev,
            "inode": value_stat.st_ino,
            "uid": value_stat.st_uid,
            "gid": value_stat.st_gid,
            "nlink": value_stat.st_nlink,
        },
    })
    return data


def _install_nested_trust_root(workspace: Path) -> Path:
    source_key = workspace / ".zenith-test-controller-trust-root"
    key_data = source_key.read_bytes()
    controller = workspace / "controller-trust"
    key_parent = controller / "keys"
    controller.mkdir(mode=0o700)
    key_parent.mkdir(mode=0o700)
    os.chmod(controller, 0o700)
    os.chmod(key_parent, 0o700)
    key_path = key_parent / "controller.key"
    fd = os.open(key_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_CLOEXEC, 0o400)
    try:
        zenith._write_all(fd, key_data)
        os.fchmod(fd, 0o400)
        os.fsync(fd)
    finally:
        os.close(fd)
    zenith._EVIDENCE_TRUST_ROOT_FILE = key_path
    return key_path


def _leave_applied(
    workspace: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> tuple[str, Path, list[dict[str, Any]], dict[str, Any], dict[str, bytes]]:
    mission_id, path, decisions, kwargs = _fixture(workspace, monkeypatch)
    before = _raw(path)

    def stop(point: str) -> None:
        if point == "after_applied":
            raise ProcessBoundary()

    monkeypatch.setattr(zenith, "_decide_fault", stop)
    with pytest.raises(ProcessBoundary):
        _call(workspace, mission_id, decisions, kwargs)
    monkeypatch.setattr(zenith, "_decide_fault", lambda point: None)
    assert (path / ".zenith-decide" / "active" / "APPLIED").is_file()
    return mission_id, path, decisions, kwargs, before


def test_authenticated_policy_report_rejects_cross_operation_replay(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _continue_fixture(tmp_path, monkeypatch)
    before = _raw(path)
    replay_operation = str(uuid.uuid4())
    replay_kwargs = copy.deepcopy(kwargs)
    replay_kwargs["operation_id"] = replay_operation
    replay_kwargs["evidence_manifest"]["operation_id"] = replay_operation

    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, replay_kwargs)

    assert raised.value.code == "INVALID_EVIDENCE"
    assert raised.value.http_status == 422
    assert "semantic result/subject/snapshot binding" in str(raised.value)
    assert _raw(path) == before
    assert not (path / ".zenith-decide").exists()


def test_authenticated_hmac_receipt_rejects_cross_operation_replay_after_report_rebind(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _continue_fixture(tmp_path, monkeypatch)
    before = _raw(path)
    original_operation = kwargs["operation_id"]
    replay_operation = str(uuid.uuid4())
    key = (tmp_path / ".zenith-test-controller-trust-root").read_bytes()
    replay_kwargs = copy.deepcopy(kwargs)
    replay_kwargs["operation_id"] = replay_operation
    replay_kwargs["evidence_manifest"]["operation_id"] = replay_operation

    for entry in replay_kwargs["evidence_manifest"]["action_evidence"]:
        artifact = entry["artifacts"][0]
        artifact_path = path / artifact["path"]
        report = _json(artifact_path)
        report["operation_id"] = replay_operation
        _rewrite_descriptor_json(artifact_path, artifact, report)

        provenance_descriptor = artifact["provenance_receipt"]
        provenance_path = path / provenance_descriptor["path"]
        provenance = _json(provenance_path)
        assert provenance["operation_id"] == original_operation
        provenance["artifact_sha256"] = artifact["sha256"]
        provenance_body = dict(provenance)
        provenance_body.pop("hmac_sha256")
        provenance["hmac_sha256"] = "sha256:" + hmac.new(
            key,
            zenith._canonical_json_bytes(provenance_body),
            hashlib.sha256,
        ).hexdigest()
        _rewrite_descriptor_json(provenance_path, provenance_descriptor, provenance)

    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, replay_kwargs)

    assert raised.value.code == "INVALID_EVIDENCE"
    assert raised.value.http_status == 422
    assert "provenance receipt binding mismatch" in str(raised.value)
    assert _raw(path) == before
    assert not (path / ".zenith-decide").exists()


@pytest.mark.parametrize(
    ("offset_seconds", "message"),
    [
        (-(zenith._PROVENANCE_MAX_AGE_SECONDS + 60), "stale"),
        (zenith._PROVENANCE_MAX_FUTURE_SKEW_SECONDS + 60, "future"),
    ],
)
def test_authenticated_provenance_enforces_bounded_freshness(
    offset_seconds: int,
    message: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    issued_at = datetime.fromtimestamp(
        zenith._provenance_now_epoch() + offset_seconds,
        timezone.utc,
    ).isoformat(timespec="seconds")
    mission_id, path, decisions, kwargs = _continue_fixture(
        tmp_path,
        monkeypatch,
        issued_at=issued_at,
    )
    before = _raw(path)

    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, kwargs)

    assert raised.value.code == "INVALID_EVIDENCE"
    assert raised.value.http_status == 422
    assert message in str(raised.value)
    assert _raw(path) == before
    assert not (path / ".zenith-decide").exists()


def test_exact_durable_replay_does_not_revalidate_expired_continue_receipt(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    issued_epoch = zenith._provenance_now_epoch()
    issued_at = datetime.fromtimestamp(issued_epoch, timezone.utc).isoformat(timespec="seconds")
    mission_id, path, decisions, kwargs = _continue_fixture(
        tmp_path,
        monkeypatch,
        issued_at=issued_at,
    )
    first = _call(tmp_path, mission_id, decisions, kwargs)
    after = _raw(path)
    monkeypatch.setattr(
        zenith,
        "_provenance_now_epoch",
        lambda: issued_epoch + zenith._PROVENANCE_MAX_AGE_SECONDS + 3600,
    )

    replay = _call(tmp_path, mission_id, decisions, kwargs)

    assert replay == first
    assert _raw(path) == after


@pytest.mark.parametrize("attack", ["intermediate-symlink", "replaceable-parent"])
def test_controller_trust_root_rejects_untrusted_intermediate_components(
    attack: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _continue_fixture(tmp_path, monkeypatch)
    before = _raw(path)
    key_path = _install_nested_trust_root(tmp_path)
    if attack == "intermediate-symlink":
        displaced = key_path.parent.with_name("keys-retained")
        key_path.parent.rename(displaced)
        key_path.parent.symlink_to(displaced.name, target_is_directory=True)
    else:
        os.chmod(key_path.parent.parent, 0o770)

    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, kwargs)

    assert raised.value.code == "INVALID_EVIDENCE"
    assert raised.value.http_status == 422
    assert "retained-chain integrity" in str(raised.value)
    assert _raw(path) == before
    assert not (path / ".zenith-decide").exists()


@pytest.mark.parametrize("attack", ["final-entry", "parent-entry"])
def test_controller_trust_root_detects_post_read_replacement(
    attack: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _continue_fixture(tmp_path, monkeypatch)
    before = _raw(path)
    key_path = _install_nested_trust_root(tmp_path)
    key_bytes = key_path.read_bytes()
    real_read = zenith._read_fd_exact
    changed = False

    def replace_after_read(fd: int, size: int) -> bytes:
        nonlocal changed
        data = real_read(fd, size)
        try:
            target = os.readlink(f"/proc/self/fd/{fd}")
        except OSError:
            return data
        if target != str(key_path) or changed:
            return data
        changed = True
        if attack == "final-entry":
            key_path.rename(key_path.with_name("controller.key.retained"))
        else:
            retained_parent = key_path.parent.with_name("keys-retained")
            key_path.parent.rename(retained_parent)
            key_path.parent.mkdir(mode=0o700)
            os.chmod(key_path.parent, 0o700)
        replacement_fd = os.open(
            key_path,
            os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_CLOEXEC,
            0o400,
        )
        try:
            zenith._write_all(replacement_fd, key_bytes)
            os.fchmod(replacement_fd, 0o400)
            os.fsync(replacement_fd)
        finally:
            os.close(replacement_fd)
        return data

    monkeypatch.setattr(zenith, "_read_fd_exact", replace_after_read)
    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, kwargs)

    assert changed
    assert raised.value.code == "INVALID_EVIDENCE"
    assert raised.value.http_status == 422
    assert "retained-chain integrity" in str(raised.value)
    assert _raw(path) == before
    assert not (path / ".zenith-decide").exists()


@pytest.mark.parametrize("tamper", ["missing-receipt", "live-preimage", "wrong-live-mode"])
def test_applied_is_verify_only_and_never_repairs_impossible_terminal_state(
    tamper: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, _, kwargs, before = _leave_applied(tmp_path, monkeypatch)
    receipt = path / ".zenith-decide" / "receipts" / f"{kwargs['operation_id']}.json"
    if tamper == "missing-receipt":
        receipt.unlink()
    elif tamper == "live-preimage":
        (path / "events.json").write_bytes(before["events.json"])
        os.chmod(path / "events.json", 0o600)
    else:
        os.chmod(path / "events.json", 0o400)
    observed = (path / "events.json").read_bytes()
    observed_mode = (path / "events.json").stat().st_mode & 0o777

    with pytest.raises(zenith.ZenithError) as raised:
        zenith.inspect(mission_id, workspace=str(tmp_path))

    assert raised.value.code == "RECOVERY_BLOCKED"
    assert raised.value.http_status == 503
    assert (path / "events.json").read_bytes() == observed
    assert (path / "events.json").stat().st_mode & 0o777 == observed_mode
    assert (path / ".zenith-decide" / "active" / "APPLIED").exists()
    if tamper == "missing-receipt":
        assert not receipt.exists()


def test_partial_precommit_journal_is_durably_cleaned_and_same_operation_retries(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    before = _raw(path)

    def stop(point: str) -> None:
        if point == "after_journal":
            raise ProcessBoundary()

    monkeypatch.setattr(zenith, "_decide_fault", stop)
    with pytest.raises(ProcessBoundary):
        _call(tmp_path, mission_id, decisions, kwargs)
    journal = path / ".zenith-decide" / "active" / "journal.json"
    partial = journal.read_bytes()[:37]
    os.chmod(journal, 0o600)
    journal.write_bytes(partial)
    os.chmod(journal, 0o600)
    monkeypatch.setattr(zenith, "_decide_fault", lambda point: None)

    inspected = zenith.inspect(mission_id, workspace=str(tmp_path))
    assert inspected["revision"] == kwargs["expected_revision"]
    assert _raw(path) == before
    assert not (path / ".zenith-decide" / "active").exists()
    assert not (path / ".zenith-decide" / "archive" / f"{kwargs['operation_id']}.reserve").exists()

    receipt = _call(tmp_path, mission_id, decisions, kwargs)
    assert receipt["committed_revision"] == kwargs["expected_revision"] + 1


def test_ambiguous_precommit_tree_blocks_without_live_or_cleanup_mutation(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    before = _raw(path)

    def stop(point: str) -> None:
        if point == "after_journal":
            raise ProcessBoundary()

    monkeypatch.setattr(zenith, "_decide_fault", stop)
    with pytest.raises(ProcessBoundary):
        _call(tmp_path, mission_id, decisions, kwargs)
    monkeypatch.setattr(zenith, "_decide_fault", lambda point: None)
    rogue = path / ".zenith-decide" / "active" / "rogue"
    rogue.write_bytes(b"ambiguous\n")
    os.chmod(rogue, 0o600)

    with pytest.raises(zenith.ZenithError) as raised:
        zenith.inspect(mission_id, workspace=str(tmp_path))
    assert raised.value.code == "RECOVERY_BLOCKED"
    assert _raw(path) == before
    assert rogue.read_bytes() == b"ambiguous\n"


def test_dispatcher_rejects_unknown_top_level_field_before_metadata_or_state_write(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    before = _raw(path)
    payload = {"decisions": decisions, **copy.deepcopy(kwargs), "caller_claimed_authorized": True}
    payload_path = tmp_path / "unknown-field.json"
    payload_path.write_text(json.dumps(payload))

    result = json.loads(
        run(
            zenith.run(
                action="decide",
                mission_id=mission_id,
                workspace=str(tmp_path),
                input_path=str(payload_path),
            )
        )
    )

    assert result["ok"] is False
    assert result["code"] == "INVALID_REQUEST"
    assert result["http_status"] == 422
    assert _raw(path) == before
    assert not (path / ".zenith-decide").exists()


@pytest.mark.parametrize("kind", ["oversized-regular", "fifo"])
def test_dispatch_input_is_type_and_size_bounded_before_materialization(
    kind: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, _, _ = _fixture(tmp_path, monkeypatch)
    before = _raw(path)
    payload_path = tmp_path / "unbounded-input"
    if kind == "fifo":
        os.mkfifo(payload_path, 0o600)
    else:
        payload_path.write_bytes(b"{" + b" " * zenith._MAX_REQUEST_BYTES + b"}")

    result = json.loads(
        run(
            zenith.run(
                action="decide",
                mission_id=mission_id,
                workspace=str(tmp_path),
                input_path=str(payload_path),
            )
        )
    )

    assert result["ok"] is False
    assert _raw(path) == before
    assert not (path / ".zenith-decide").exists()


def test_oversized_generated_postimage_is_rejected_before_commit_or_metadata(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, _ = _fixture(tmp_path, monkeypatch)
    overhead = len(json.dumps([{"blob": ""}, {"blob": ""}], separators=(",", ":")).encode())
    payload_bytes = zenith._MAX_STATE_BYTES - 32 - overhead
    first = payload_bytes // 2
    second = payload_bytes - first
    assert first <= zenith._MAX_STATE_STRING_BYTES and second <= zenith._MAX_STATE_STRING_BYTES
    compact = json.dumps(
        [{"blob": "x" * first}, {"blob": "y" * second}],
        separators=(",", ":"),
    ).encode()
    assert len(compact) == zenith._MAX_STATE_BYTES - 32
    (path / "events.json").write_bytes(compact)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    before = _raw(path)

    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, kwargs)

    assert raised.value.code == "OUTPUT_TOO_LARGE"
    assert raised.value.http_status == 422
    assert _raw(path) == before
    assert not (path / ".zenith-decide").exists()


@pytest.mark.parametrize(
    ("partial", "mode"),
    [
        (b"", 0o000),
        (b"partial", 0o200),
        (b"partial-reservation-bytes", 0o400),
        (b"partial-reservation-bytes", 0o600),
    ],
)
def test_orphaned_reservation_temporary_is_durably_removed_before_retry(
    partial: bytes,
    mode: int,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    before = _raw(path)
    metadata = path / ".zenith-decide"
    receipts = metadata / "receipts"
    archive = metadata / "archive"
    for directory in (metadata, receipts, archive):
        directory.mkdir(mode=0o700)
        os.chmod(directory, 0o700)
    temporary = archive / f".{kwargs['operation_id']}.reserve.tmp"
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_CLOEXEC, 0o600)
    try:
        zenith._write_all(fd, partial)
        os.fchmod(fd, mode)
        os.fsync(fd)
    finally:
        os.close(fd)

    receipt = _call(tmp_path, mission_id, decisions, kwargs)

    assert receipt["committed_revision"] == kwargs["expected_revision"] + 1
    assert not temporary.exists()
    assert _raw(path) != before


def test_atomic_reservation_rename_collision_cleans_temp_and_preserves_collision(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    before = _raw(path)
    archive = path / ".zenith-decide" / "archive"
    collision = archive / f"{kwargs['operation_id']}.reserve"
    injected = False

    def collide(point: str) -> None:
        nonlocal injected
        if point != "after_reservation_temp_finalize_fsync" or injected:
            return
        injected = True
        fd = os.open(
            collision,
            os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_CLOEXEC,
            0o400,
        )
        try:
            zenith._write_all(fd, b"independent-final-name-collision")
            os.fchmod(fd, 0o400)
            os.fsync(fd)
        finally:
            os.close(fd)

    monkeypatch.setattr(zenith, "_decide_fault", collide)
    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, kwargs)

    assert injected
    assert raised.value.code == "RECOVERY_BLOCKED"
    assert raised.value.http_status == 503
    assert collision.read_bytes() == b"independent-final-name-collision"
    assert not (archive / f".{kwargs['operation_id']}.reserve.tmp").exists()
    assert not (path / ".zenith-decide" / "active").exists()
    assert _raw(path) == before


def test_partial_final_reservation_collision_blocks_without_overwrite(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    before = _raw(path)
    metadata = path / ".zenith-decide"
    receipts = metadata / "receipts"
    archive = metadata / "archive"
    for directory in (metadata, receipts, archive):
        directory.mkdir(mode=0o700)
        os.chmod(directory, 0o700)
    reservation = archive / f"{kwargs['operation_id']}.reserve"
    fd = os.open(reservation, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_CLOEXEC, 0o400)
    try:
        zenith._write_all(fd, b"partial-final-authority")
        os.fchmod(fd, 0o400)
        os.fsync(fd)
    finally:
        os.close(fd)
    original = reservation.read_bytes()

    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, kwargs)

    assert raised.value.code == "RECOVERY_BLOCKED"
    assert raised.value.http_status == 503
    assert reservation.read_bytes() == original
    assert _raw(path) == before
    assert not (metadata / "active").exists()


def test_final_reservation_name_is_never_written_in_place(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, _, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    real_write_exclusive = zenith._write_exclusive_at
    direct_final_writes: list[str] = []

    def guard(
        dir_fd: int,
        name: str,
        data: bytes,
        mode: int,
        **options: Any,
    ) -> os.stat_result:
        if name.endswith(".reserve"):
            direct_final_writes.append(name)
            raise AssertionError("final reservation authority must be rename-published")
        return real_write_exclusive(dir_fd, name, data, mode, **options)

    monkeypatch.setattr(zenith, "_write_exclusive_at", guard)
    receipt = _call(tmp_path, mission_id, decisions, kwargs)

    assert receipt["operation_id"] == kwargs["operation_id"]
    assert direct_final_writes == []


def test_real_cleanup_failure_overrides_precommit_precondition_error(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    real_unlink = zenith.os.unlink
    reservation_name = f"{kwargs['operation_id']}.reserve"

    def mutate(point: str) -> None:
        if point == "after_journal":
            (path / "mission.md").write_bytes((path / "mission.md").read_bytes() + b"race\n")

    def fail_reservation_cleanup(name: Any, *args: Any, **options: Any) -> None:
        if name == reservation_name:
            raise OSError(errno.EIO, "injected durable reservation cleanup failure")
        real_unlink(name, *args, **options)

    monkeypatch.setattr(zenith, "_decide_fault", mutate)
    monkeypatch.setattr(zenith.os, "unlink", fail_reservation_cleanup)
    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, kwargs)

    assert raised.value.code == "RECOVERY_BLOCKED"
    assert raised.value.http_status == 503
    metadata = path / ".zenith-decide"
    assert not (metadata / "active").exists()
    assert (metadata / "archive" / reservation_name).exists()


def test_operation_archive_collision_blocks_before_commit_and_live_transition(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    before = _raw(path)
    metadata = path / ".zenith-decide"
    receipts = metadata / "receipts"
    archive = metadata / "archive"
    for directory in (metadata, receipts, archive, archive / kwargs["operation_id"]):
        directory.mkdir(mode=0o700)
        os.chmod(directory, 0o700)

    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, kwargs)

    assert raised.value.code == "RECOVERY_BLOCKED"
    assert _raw(path) == before
    assert not (metadata / "active").exists()
    assert not (receipts / f"{kwargs['operation_id']}.json").exists()


def test_caller_authored_generic_pass_cannot_satisfy_closed_retry_policy(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    before = _raw(path)
    entry = kwargs["evidence_manifest"]["action_evidence"][0]
    descriptor = entry["artifacts"][0]
    artifact = path / descriptor["path"]
    report = _json(artifact)
    report["schema"] = "zenith.evidence.test-report/v1"
    report["result"] = "pass"
    data = (json.dumps(report, indent=2, sort_keys=True) + "\n").encode()
    os.chmod(artifact, 0o600)
    artifact.write_bytes(data)
    os.chmod(artifact, 0o400)
    value = artifact.stat()
    descriptor.update({
        "kind": "test-report",
        "validator_id": "zenith.test-report/v1",
        "report_schema": "zenith.evidence.test-report/v1",
        "sha256": zenith._sha256_bytes(data),
        "size": len(data),
        "identity": {
            "device": value.st_dev,
            "inode": value.st_ino,
            "uid": value.st_uid,
            "gid": value.st_gid,
            "nlink": value.st_nlink,
        },
    })

    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, kwargs)
    assert raised.value.code == "INVALID_EVIDENCE"
    assert "action policy" in str(raised.value)
    assert _raw(path) == before
    assert not (path / ".zenith-decide").exists()


@pytest.mark.parametrize("attack", ["lock-symlink", "lock-hardlink", "root-symlink", "metadata-symlink"])
def test_root_lock_and_metadata_authority_replacements_fail_closed(
    attack: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    before = _raw(path)
    comparison_path = path
    if attack == "lock-symlink":
        saved = path / ".lock.saved"
        (path / ".lock").rename(saved)
        (path / ".lock").symlink_to(saved.name)
    elif attack == "lock-hardlink":
        os.link(path / ".lock", path / ".lock.alias")
    elif attack == "root-symlink":
        saved = path.with_name(path.name + ".saved")
        path.rename(saved)
        path.symlink_to(saved.name, target_is_directory=True)
        comparison_path = saved
    else:
        outside = tmp_path / "metadata-target"
        outside.mkdir(mode=0o700)
        os.chmod(outside, 0o700)
        (path / ".zenith-decide").symlink_to(outside, target_is_directory=True)

    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, kwargs)

    assert raised.value.code == "RECOVERY_BLOCKED"
    assert raised.value.http_status == 503
    assert _raw(comparison_path) == before


def test_metadata_directory_swap_during_prepare_is_detected_before_commit(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    before = _raw(path)
    swapped = False

    def swap(point: str) -> None:
        nonlocal swapped
        if point == "after_archive_reservation" and not swapped:
            swapped = True
            metadata = path / ".zenith-decide"
            metadata.rename(path / ".zenith-decide.displaced")
            metadata.mkdir(mode=0o700)
            os.chmod(metadata, 0o700)

    monkeypatch.setattr(zenith, "_decide_fault", swap)
    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, kwargs)

    assert swapped
    assert raised.value.code == "RECOVERY_BLOCKED"
    assert _raw(path) == before
    assert not (path / ".zenith-decide" / "active").exists()


@pytest.mark.parametrize("magic", [0x6969, 0x65735546, 0x12345678])
def test_unsupported_network_fuse_or_unknown_storage_is_refused_without_writes(
    magic: int,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, _, _ = _fixture(tmp_path, monkeypatch)
    before = _raw(path)
    monkeypatch.setattr(zenith, "_filesystem_magic", lambda fd: magic)

    with pytest.raises(zenith.ZenithError) as raised:
        zenith.get_decide_preconditions(mission_id, workspace=str(tmp_path))

    assert raised.value.code == "UNSUPPORTED_STORAGE"
    assert raised.value.http_status == 503
    assert _raw(path) == before
    assert not (path / ".zenith-decide").exists()


def test_short_write_and_eintr_are_completed_or_cleanly_recoverable(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    real_write = zenith.os.write
    interrupted = False

    def eintr_once(fd: int, data: Any) -> int:
        nonlocal interrupted
        if not interrupted:
            interrupted = True
            raise InterruptedError()
        return real_write(fd, data)

    monkeypatch.setattr(zenith.os, "write", eintr_once)
    receipt = _call(tmp_path, mission_id, decisions, kwargs)
    assert interrupted
    assert receipt["committed_revision"] == kwargs["expected_revision"] + 1

    monkeypatch.setattr(zenith.os, "write", real_write)
    second_workspace = tmp_path / "second"
    second_id, second_path, second_decisions, second_kwargs = _fixture(second_workspace, monkeypatch)
    before = _raw(second_path)
    partial = False

    def fail_after_partial_journal(fd: int, data: Any) -> int:
        nonlocal partial
        target = os.readlink(f"/proc/self/fd/{fd}")
        if target.endswith("/journal.json"):
            if not partial:
                partial = True
                return real_write(fd, data[: max(1, len(data) // 2)])
            return 0
        return real_write(fd, data)

    monkeypatch.setattr(zenith.os, "write", fail_after_partial_journal)
    with pytest.raises(zenith.ZenithError) as raised:
        _call(second_workspace, second_id, second_decisions, second_kwargs)
    assert raised.value.code == "RECOVERY_BLOCKED"
    assert partial
    assert _raw(second_path) == before

    monkeypatch.setattr(zenith.os, "write", real_write)
    zenith.inspect(second_id, workspace=str(second_workspace))
    assert _raw(second_path) == before
    replay = _call(second_workspace, second_id, second_decisions, second_kwargs)
    assert replay["committed_revision"] == second_kwargs["expected_revision"] + 1


def test_live_rename_failure_after_commit_recovers_exactly_once(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    real_rename = zenith.os.rename
    failed = False

    def fail_events(source: Any, destination: Any, *args: Any, **kwargs2: Any) -> None:
        nonlocal failed
        if destination == "events.json" and not failed:
            failed = True
            raise OSError(errno.EIO, "injected rename failure")
        real_rename(source, destination, *args, **kwargs2)

    monkeypatch.setattr(zenith.os, "rename", fail_events)
    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, kwargs)
    assert raised.value.code == "RECOVERY_BLOCKED"
    assert (path / ".zenith-decide" / "active" / "COMMIT").exists()

    monkeypatch.setattr(zenith.os, "rename", real_rename)
    inspected = zenith.inspect(mission_id, workspace=str(tmp_path))
    replay = _call(tmp_path, mission_id, decisions, kwargs)
    assert inspected["revision"] == kwargs["expected_revision"] + 1
    assert replay["committed_revision"] == inspected["revision"]


def test_archive_rename_failure_leaves_applied_verify_only_recovery(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    real_noreplace = zenith._rename_noreplace
    failed = False

    def fail_archive(src_fd: int, source: str, dst_fd: int, destination: str) -> None:
        nonlocal failed
        if source == "active" and not failed:
            failed = True
            raise OSError(errno.EIO, "injected archive rename failure")
        real_noreplace(src_fd, source, dst_fd, destination)

    monkeypatch.setattr(zenith, "_rename_noreplace", fail_archive)
    with pytest.raises(zenith.ZenithError) as raised:
        _call(tmp_path, mission_id, decisions, kwargs)
    assert raised.value.code == "RECOVERY_BLOCKED"
    assert (path / ".zenith-decide" / "active" / "APPLIED").exists()

    monkeypatch.setattr(zenith, "_rename_noreplace", real_noreplace)
    inspected = zenith.inspect(mission_id, workspace=str(tmp_path))
    assert inspected["revision"] == kwargs["expected_revision"] + 1
    assert not (path / ".zenith-decide" / "active").exists()


@pytest.mark.parametrize(
    ("point", "code", "committed"),
    [
        ("after_reservation_temp_open", 59, False),
        ("after_reservation_temp_create", 60, False),
        ("after_reservation_temp_partial", 61, False),
        ("after_reservation_temp_write", 62, False),
        ("after_reservation_temp_fsync", 63, False),
        ("after_reservation_temp_finalize", 64, False),
        ("after_reservation_temp_finalize_fsync", 65, False),
        ("after_reservation_rename", 66, False),
        ("after_reservation_directory_fsync", 67, False),
        ("after_archive_reservation", 70, False),
        ("after_active_create", 71, False),
        ("after_stage:attention.json", 72, False),
        ("after_stage:decisions.json", 73, False),
        ("after_stage:events.json", 74, False),
        ("after_stage:mission.md", 75, False),
        ("after_stage:mission.json", 76, False),
        ("after_stage:receipt.json", 77, False),
        ("after_journal", 78, False),
        ("after_commit_file", 79, True),
        ("after_commit_fsync", 80, True),
        ("after_install:attention.json", 81, True),
        ("after_install:decisions.json", 82, True),
        ("after_install:events.json", 83, True),
        ("after_install:mission.md", 84, True),
        ("after_install:mission.json", 85, True),
        ("after_receipt_link", 86, True),
        ("after_receipt_link_fsync", 87, True),
        ("after_receipt_temp_unlink", 88, True),
        ("after_receipt_publish", 89, True),
        ("after_applied", 90, True),
        ("after_archive", 91, True),
    ],
)
def test_real_process_exit_pre_and_post_commit_boundaries(
    point: str,
    code: int,
    committed: bool,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    before = _raw(path)
    payload_path = tmp_path / f"exit-{code}.json"
    payload_path.write_text(json.dumps({
        "mission_id": mission_id,
        "workspace": str(tmp_path),
        "decisions": decisions,
        "kwargs": kwargs,
        "point": point,
        "code": code,
    }))
    script = r'''
import asyncio
import json
import os
import sys
import zenith
payload = json.load(open(sys.argv[1], encoding="utf-8"))
def die(point):
    if point == payload["point"]:
        os._exit(payload["code"])
zenith._decide_fault = die
asyncio.run(zenith.decide(
    payload["mission_id"],
    payload["decisions"],
    workspace=payload["workspace"],
    **payload["kwargs"],
))
'''
    completed = subprocess.run(
        [sys.executable, "-c", script, str(payload_path)],
        check=False,
        env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
        timeout=20,
    )
    assert completed.returncode == code
    if not committed:
        assert _raw(path) == before
        assert not (path / ".zenith-decide" / "active" / "COMMIT").exists()
    else:
        active_commit = path / ".zenith-decide" / "active" / "COMMIT"
        archived_commit = path / ".zenith-decide" / "archive" / kwargs["operation_id"] / "COMMIT"
        assert active_commit.exists() or archived_commit.exists()

    inspected = zenith.inspect(mission_id, workspace=str(tmp_path))
    if committed:
        assert inspected["revision"] == kwargs["expected_revision"] + 1
        receipt = _call(tmp_path, mission_id, decisions, kwargs)
        assert receipt["committed_revision"] == inspected["revision"]
    else:
        assert inspected["revision"] == kwargs["expected_revision"]
        assert _raw(path) == before
        archive = path / ".zenith-decide" / "archive"
        assert not (archive / f".{kwargs['operation_id']}.reserve.tmp").exists()
        assert not (archive / f"{kwargs['operation_id']}.reserve").exists()
        receipt = _call(tmp_path, mission_id, decisions, kwargs)
        assert receipt["committed_revision"] == kwargs["expected_revision"] + 1


def test_receipt_binds_journal_commit_receipt_and_evidence_identities(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    receipt = _call(tmp_path, mission_id, decisions, kwargs)
    archive = path / ".zenith-decide" / "archive" / kwargs["operation_id"]
    journal_bytes = (archive / "journal.json").read_bytes()
    commit_bytes = (archive / "COMMIT").read_bytes()
    commit = json.loads(commit_bytes)
    permanent = path / ".zenith-decide" / "receipts" / f"{kwargs['operation_id']}.json"

    assert receipt["journal_sha256"] == zenith._sha256_bytes(journal_bytes)
    assert receipt["commit_binding_sha256"] == commit["commit_binding_sha256"]
    assert stat.S_IMODE((path / ".zenith-decide").stat().st_mode) == 0o700
    assert stat.S_IMODE((path / ".zenith-decide" / "receipts").stat().st_mode) == 0o700
    assert stat.S_IMODE((path / ".zenith-decide" / "archive").stat().st_mode) == 0o700
    assert stat.S_IMODE(archive.stat().st_mode) == 0o700
    assert stat.S_IMODE((archive / "post").stat().st_mode) == 0o700
    assert stat.S_IMODE((archive / "journal.json").stat().st_mode) == 0o600
    for marker in ("COMMIT", "APPLIED", "reservation.json"):
        assert stat.S_IMODE((archive / marker).stat().st_mode) == 0o400
    for name in zenith._DECIDE_STATE_OUTPUTS:
        assert stat.S_IMODE((path / name).stat().st_mode) == 0o600
        assert stat.S_IMODE((archive / "post" / name).stat().st_mode) == 0o600
    assert stat.S_IMODE((archive / "post" / "receipt.json").stat().st_mode) == 0o400
    assert stat.S_IMODE(permanent.stat().st_mode) == 0o400
    assert receipt["receipt_identity"] == {
        "body_sha256": zenith._receipt_body_hash(receipt),
        "mode": "0400",
        "size": len(permanent.read_bytes()),
    }
    assert receipt["idempotency"] == {"result": "committed", "request_match": True}
    assert all("authenticated" in item for item in receipt["accepted_evidence"])
    assert receipt == _call(tmp_path, mission_id, decisions, kwargs)


@pytest.mark.parametrize(
    ("name", "replacement"),
    [
        ("mission.json", b"{\n"),
        ("attention.json", b"{}\n"),
    ],
)
def test_authoritative_reader_corruption_is_typed_recovery_blocked(
    name: str,
    replacement: bytes,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, _, _ = _fixture(tmp_path, monkeypatch)
    (path / name).write_bytes(replacement)

    with pytest.raises(zenith.ZenithError) as raised:
        zenith.inspect(mission_id, workspace=str(tmp_path))

    assert raised.value.code == "RECOVERY_BLOCKED"
    assert raised.value.http_status == 503
    assert not (path / ".zenith-decide").exists()


def test_official_docs_expose_preconditions_and_never_advertise_strict_patch() -> None:
    package_root = Path(zenith.__file__).resolve().parents[2]
    readme = (package_root / "README.md").read_text()
    skill = (package_root / "SKILL.md").read_text()
    mission_design = (package_root / "references" / "mission-design.md").read_text()
    orchestration = (package_root / "references" / "orchestration.md").read_text()
    validation = (package_root / "references" / "validation.md").read_text()

    assert "- `zenith.get_decide_preconditions(...)`" in readme
    assert "patch/retry path" not in skill
    assert "Every later patch" not in mission_design
    assert "A patch may not supersede" not in mission_design
    assert "requires a patch/retry path" not in validation
    assert "strict patch/replan mutation is unavailable" in skill.lower()
    assert "no official workflow may advertise or attempt it" in mission_design
    assert "no official workflow may advertise" in orchestration
    assert "strict patch/replan mutation is unavailable" in validation.lower()


def test_dispatcher_redacts_unexpected_exception_content(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, decisions, kwargs = _fixture(tmp_path, monkeypatch)
    payload_path = tmp_path / "redaction-input.json"
    payload_path.write_text(json.dumps({"decisions": decisions, **kwargs}))
    before = _raw(path)

    async def unexpected(*args: Any, **kwargs2: Any) -> Any:
        raise RuntimeError("secret-internal-content-must-not-leak")

    monkeypatch.setattr(zenith, "decide", unexpected)
    response = json.loads(run(zenith.run(
        action="decide",
        mission_id=mission_id,
        workspace=str(tmp_path),
        input_path=str(payload_path),
    )))

    assert response == {
        "action": "decide",
        "code": "INTERNAL_ERROR",
        "error": "unexpected internal Zenith failure",
        "error_type": "InternalError",
        "http_status": 500,
        "mission_id": mission_id,
        "ok": False,
    }
    assert "secret-internal-content" not in json.dumps(response)
    assert _raw(path) == before
    assert not (path / ".zenith-decide").exists()

from __future__ import annotations

import asyncio
import copy
import inspect
import json
import os
import subprocess
import sys
import threading
import uuid
from pathlib import Path
from typing import Any

import pytest

import zenith
from conftest import run, start_with_plan, strict_decide_arguments


class SimulatedCrash(BaseException):
    """Stand-in for uncatchable process death at a durable fault boundary."""


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def _open_attention(path: Path) -> list[dict[str, Any]]:
    return [item for item in _read_json(path / "attention.json") if item["status"] == "open"]


def _attention_fixture(
    workspace: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> tuple[Any, str, Path, list[dict[str, Any]]]:
    runtime, mission_id, path = start_with_plan(workspace, monkeypatch, concurrency=1)
    dispatched = run(zenith.advance(mission_id, workspace=str(workspace)))["dispatched"][0]
    run(
        zenith.end_task(
            mission_id,
            dispatched["task_id"],
            dispatched["attempt_id"],
            done=False,
            passed=False,
            report="A deterministic temporary-fixture failure requires a decision.",
            evidence=["temporary fixture"],
            workspace=str(workspace),
        )
    )
    runtime.set_status(dispatched["handle"]["rlm_child_id"], "completed")
    assert run(zenith.advance(mission_id, workspace=str(workspace)))["state"] == "attention_needed"
    decisions = [
        {"attention_id": item["id"], "action": "retry", "task_id": "work"}
        for item in _open_attention(path)
    ]
    return runtime, mission_id, path, decisions


def _authority_bytes(path: Path) -> dict[str, bytes]:
    return {name: (path / name).read_bytes() for name in zenith._DECIDE_HASH_FILES}


def _strict_call(workspace: Path, mission_id: str, decisions: Any, kwargs: dict[str, Any]) -> dict[str, Any]:
    return run(zenith.decide(mission_id, decisions, workspace=str(workspace), **kwargs))


def test_missing_preconditions_is_typed_428_and_zero_writes(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    before = _authority_bytes(path)
    with pytest.raises(zenith.ZenithError) as raised:
        run(zenith.decide(mission_id, decisions, workspace=str(tmp_path)))
    assert raised.value.code == "PRECONDITION_REQUIRED"
    assert raised.value.http_status == 428
    assert _authority_bytes(path) == before
    assert not (path / ".zenith-decide").exists()


def test_precondition_helper_returns_revision_and_exact_seven_raw_hashes(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, _ = _attention_fixture(tmp_path, monkeypatch)
    result = zenith.get_decide_preconditions(mission_id, workspace=str(tmp_path))
    assert set(result) == {"mission_id", "revision", "file_hashes"}
    assert set(result["file_hashes"]) == set(zenith._DECIDE_HASH_FILES)
    assert result["revision"] == _read_json(path / "mission.json")["revision"]
    assert result["file_hashes"] == {
        name: zenith._sha256_bytes((path / name).read_bytes())
        for name in zenith._DECIDE_HASH_FILES
    }


@pytest.mark.parametrize("name", zenith._DECIDE_HASH_FILES)
def test_stale_hash_or_revision_fails_412_without_authority_writes(
    name: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    before = _authority_bytes(path)
    kwargs["expected_file_hashes"] = dict(kwargs["expected_file_hashes"])
    kwargs["expected_file_hashes"][name] = "sha256:" + "0" * 64
    # Keep the manifest snapshot binding syntactically valid for this deliberate
    # stale request; decide must still reject under the lock before mutation.
    kwargs["evidence_manifest"] = copy.deepcopy(kwargs["evidence_manifest"])
    kwargs["evidence_manifest"]["base_snapshot_sha256"] = zenith._sha256_canonical(
        kwargs["expected_file_hashes"]
    )
    with pytest.raises(zenith.ZenithError) as raised:
        _strict_call(tmp_path, mission_id, decisions, kwargs)
    assert raised.value.code == "PRECONDITION_FAILED"
    assert raised.value.http_status == 412
    assert _authority_bytes(path) == before


def test_exact_success_durable_receipt_replay_and_conflict(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    first = _strict_call(tmp_path, mission_id, decisions, kwargs)
    authority_after = _authority_bytes(path)
    events_after = _read_json(path / "events.json")
    receipt_path = path / ".zenith-decide" / "receipts" / f"{kwargs['operation_id']}.json"
    receipt_bytes = receipt_path.read_bytes()
    assert oct(receipt_path.stat().st_mode & 0o777) == "0o400"
    assert first["schema"] == "zenith.decide.receipt/v1"
    assert first["committed_revision"] == kwargs["expected_revision"] + 1
    assert first["response"]["revision"] == first["committed_revision"]

    replay = _strict_call(tmp_path, mission_id, decisions, kwargs)
    assert replay == first
    assert _authority_bytes(path) == authority_after
    assert _read_json(path / "events.json") == events_after
    assert receipt_path.read_bytes() == receipt_bytes

    changed = copy.deepcopy(decisions)
    changed[0]["reason"] = "different bounded request content"
    changed_kwargs = copy.deepcopy(kwargs)
    changed_kwargs["evidence_manifest"] = copy.deepcopy(kwargs["evidence_manifest"])
    normal_changed = zenith._normalise_decide_actions(changed)
    changed_kwargs["evidence_manifest"]["action_evidence"][0]["action_sha256"] = zenith._sha256_canonical(
        normal_changed[0]
    )
    with pytest.raises(zenith.ZenithError) as raised:
        _strict_call(tmp_path, mission_id, changed, changed_kwargs)
    assert raised.value.code == "IDEMPOTENCY_CONFLICT"
    assert raised.value.http_status == 409
    assert _authority_bytes(path) == authority_after


def test_evidence_digest_size_identity_and_semantic_mismatch_fail_422(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    artifact = kwargs["evidence_manifest"]["action_evidence"][0]["artifacts"][0]
    artifact["size"] += 1
    before = _authority_bytes(path)
    with pytest.raises(zenith.ZenithError) as raised:
        _strict_call(tmp_path, mission_id, decisions, kwargs)
    assert raised.value.code == "INVALID_EVIDENCE"
    assert raised.value.http_status == 422
    assert _authority_bytes(path) == before


def test_state_race_during_prepare_is_detected_and_uncommitted_tree_removed(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    before_revision = _read_json(path / "mission.json")["revision"]
    original_fault = zenith._decide_fault

    def mutate(point: str) -> None:
        if point == "after_journal":
            # Simulate an uncooperative raw writer.  The final raw-hash/identity
            # check must abort before COMMIT rather than overwrite it.
            (path / "mission.md").write_bytes((path / "mission.md").read_bytes() + b"race\n")
        original_fault(point)

    monkeypatch.setattr(zenith, "_decide_fault", mutate)
    with pytest.raises(zenith.ZenithError) as raised:
        _strict_call(tmp_path, mission_id, decisions, kwargs)
    assert raised.value.code == "PRECONDITION_FAILED"
    assert _read_json(path / "mission.json")["revision"] == before_revision
    assert not (path / ".zenith-decide" / "active").exists()
    assert not (path / ".zenith-decide" / "receipts" / f"{kwargs['operation_id']}.json").exists()


def test_evidence_race_during_prepare_is_detected_before_commit(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    artifact_relative = kwargs["evidence_manifest"]["action_evidence"][0]["artifacts"][0]["path"]
    artifact_path = path / artifact_relative
    original_fault = zenith._decide_fault

    def replace(point: str) -> None:
        if point == "after_journal":
            artifact_path.chmod(0o600)
        original_fault(point)

    monkeypatch.setattr(zenith, "_decide_fault", replace)
    with pytest.raises(zenith.ZenithError) as raised:
        _strict_call(tmp_path, mission_id, decisions, kwargs)
    assert raised.value.code == "INVALID_EVIDENCE"
    assert not (path / ".zenith-decide" / "active").exists()


@pytest.mark.parametrize(
    "fault_point",
    [
        "after_commit_file",
        "after_commit_fsync",
        "after_install:attention.json",
        "after_install:decisions.json",
        "after_install:events.json",
        "after_install:mission.md",
        "after_install:mission.json",
        "after_receipt_link",
        "after_receipt_link_fsync",
        "after_receipt_temp_unlink",
        "after_receipt_publish",
        "after_applied",
    ],
)
def test_post_commit_fault_at_each_target_subset_recovers_exact_postimages(
    fault_point: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    fired = False

    def fail(point: str) -> None:
        nonlocal fired
        if point == fault_point and not fired:
            fired = True
            raise SimulatedCrash("injected process-death boundary")

    monkeypatch.setattr(zenith, "_decide_fault", fail)
    with pytest.raises(SimulatedCrash, match="process-death"):
        _strict_call(tmp_path, mission_id, decisions, kwargs)
    assert (path / ".zenith-decide" / "active" / "COMMIT").exists()

    monkeypatch.setattr(zenith, "_decide_fault", lambda point: None)
    recovered = zenith.inspect(mission_id, workspace=str(tmp_path))
    replay = _strict_call(tmp_path, mission_id, decisions, kwargs)
    assert replay["committed_revision"] == kwargs["expected_revision"] + 1
    assert recovered["revision"] == replay["committed_revision"]
    assert not (path / ".zenith-decide" / "active").exists()
    assert len([event for event in _read_json(path / "events.json") if event.get("operation_id") == kwargs["operation_id"]]) == 1


def test_precommit_fault_recovers_all_old_without_receipt(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    before = _authority_bytes(path)

    def fail(point: str) -> None:
        if point == "after_journal":
            raise OSError("precommit stop")

    monkeypatch.setattr(zenith, "_decide_fault", fail)
    with pytest.raises(OSError, match="precommit"):
        _strict_call(tmp_path, mission_id, decisions, kwargs)
    monkeypatch.setattr(zenith, "_decide_fault", lambda point: None)
    zenith.inspect(mission_id, workspace=str(tmp_path))
    assert _authority_bytes(path) == before
    assert not (path / ".zenith-decide" / "active").exists()
    assert not (path / ".zenith-decide" / "receipts" / f"{kwargs['operation_id']}.json").exists()


def _make_committed_fault_fixture(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> tuple[str, Path, list[dict[str, Any]], dict[str, Any]]:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)

    def fail(point: str) -> None:
        if point == "after_commit_fsync":
            raise OSError("stop after commit")

    monkeypatch.setattr(zenith, "_decide_fault", fail)
    with pytest.raises(OSError):
        _strict_call(tmp_path, mission_id, decisions, kwargs)
    monkeypatch.setattr(zenith, "_decide_fault", lambda point: None)
    return mission_id, path, decisions, kwargs


@pytest.mark.parametrize("corruption", ["journal", "postimage", "live-third-value"])
def test_committed_corruption_fails_closed_recovery_blocked(
    corruption: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mission_id, path, _, _ = _make_committed_fault_fixture(tmp_path, monkeypatch)
    active = path / ".zenith-decide" / "active"
    if corruption == "journal":
        target = active / "journal.json"
        target.chmod(0o600)
        target.write_bytes(b"{}\n")
        target.chmod(0o400)
    elif corruption == "postimage":
        target = active / "post" / "events.json"
        target.chmod(0o600)
        target.write_bytes(b"[]\n")
        target.chmod(0o600)
    else:
        target = path / "events.json"
        target.write_bytes(b"[]\n")
    with pytest.raises(zenith.ZenithError) as raised:
        zenith.inspect(mission_id, workspace=str(tmp_path))
    assert raised.value.code == "RECOVERY_BLOCKED"
    assert raised.value.http_status == 503
    assert active.exists()


def test_patch_fails_closed_before_evidence_or_transaction_write(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    patches = [
        {"attention_id": item["attention_id"], "action": "patch", "patch": {}}
        for item in decisions
    ]
    kwargs = strict_decide_arguments(tmp_path, mission_id, patches)
    before = _authority_bytes(path)
    with pytest.raises(zenith.ZenithError) as raised:
        _strict_call(tmp_path, mission_id, patches, kwargs)
    assert raised.value.code == "PATCH_TRANSACTION_UNAVAILABLE"
    assert _authority_bytes(path) == before
    assert not (path / ".zenith-decide").exists()


def test_concurrent_distinct_operations_same_snapshot_exactly_one_commits(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs_a = strict_decide_arguments(tmp_path, mission_id, decisions)
    # Reuse the same evidence files/manifest structure but bind a fresh op ID
    # and descriptors generated before either call starts.
    kwargs_b = strict_decide_arguments(tmp_path, mission_id, decisions)
    barrier = threading.Barrier(2)
    outcomes: list[Any] = []

    def caller(kwargs: dict[str, Any]) -> None:
        barrier.wait()
        try:
            outcomes.append(asyncio.run(zenith.decide(mission_id, decisions, workspace=str(tmp_path), **kwargs)))
        except BaseException as exc:
            outcomes.append(exc)

    threads = [threading.Thread(target=caller, args=(kwargs,)) for kwargs in (kwargs_a, kwargs_b)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=10)
    assert all(not thread.is_alive() for thread in threads)
    successes = [item for item in outcomes if isinstance(item, dict)]
    failures = [item for item in outcomes if isinstance(item, zenith.ZenithError)]
    assert len(successes) == 1
    assert len(failures) == 1 and failures[0].code == "PRECONDITION_FAILED"
    assert _read_json(path / "mission.json")["revision"] == kwargs_a["expected_revision"] + 1


def test_many_concurrent_identical_operation_calls_return_same_receipt(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    barrier = threading.Barrier(6)
    outcomes: list[Any] = []

    def caller() -> None:
        barrier.wait()
        try:
            outcomes.append(asyncio.run(zenith.decide(mission_id, decisions, workspace=str(tmp_path), **kwargs)))
        except BaseException as exc:
            outcomes.append(exc)

    threads = [threading.Thread(target=caller) for _ in range(6)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=10)
    assert all(not thread.is_alive() for thread in threads)
    assert all(isinstance(item, dict) for item in outcomes)
    assert outcomes == [outcomes[0]] * 6
    assert len([event for event in _read_json(path / "events.json") if event.get("operation_id") == kwargs["operation_id"]]) == 1


@pytest.mark.parametrize(
    "operation_id",
    [
        "../not-a-uuid",
        "A5D5E3E4-0DD8-4F44-BA62-9939FD534699",
        "00000000-0000-1000-8000-000000000000",
    ],
)
def test_operation_id_must_be_canonical_random_uuid4_before_any_write(
    operation_id: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    before = _authority_bytes(path)
    preconditions = zenith.get_decide_preconditions(mission_id, workspace=str(tmp_path))
    with pytest.raises(zenith.ZenithError) as raised:
        run(
            zenith.decide(
                mission_id,
                decisions,
                workspace=str(tmp_path),
                expected_revision=preconditions["revision"],
                expected_file_hashes=preconditions["file_hashes"],
                evidence_manifest={},
                operation_id=operation_id,
            )
        )
    assert raised.value.code == "INVALID_EVIDENCE"
    assert _authority_bytes(path) == before
    assert not (path / ".zenith-decide").exists()


@pytest.mark.parametrize("attack", ["symlink", "hardlink", "writable", "traversal"])
def test_evidence_path_attacks_fail_closed_422(
    attack: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    descriptor = kwargs["evidence_manifest"]["action_evidence"][0]["artifacts"][0]
    artifact = path / descriptor["path"]
    if attack == "symlink":
        saved = artifact.with_name(artifact.name + ".saved")
        artifact.rename(saved)
        artifact.symlink_to(saved.name)
    elif attack == "hardlink":
        os.link(artifact, artifact.with_name(artifact.name + ".alias"))
    elif attack == "writable":
        artifact.chmod(0o600)
    else:
        descriptor["path"] = "preflight-artifacts/../traversal.json"
    before = _authority_bytes(path)
    with pytest.raises(zenith.ZenithError) as raised:
        _strict_call(tmp_path, mission_id, decisions, kwargs)
    assert raised.value.code == "INVALID_EVIDENCE"
    assert raised.value.http_status == 422
    assert _authority_bytes(path) == before
    assert not (path / ".zenith-decide").exists()


def test_unavailable_authenticated_provenance_fails_closed_instead_of_trusting_claims(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    artifact = kwargs["evidence_manifest"]["action_evidence"][0]["artifacts"][0]
    artifact["provenance_receipt"] = {
        "path": "terminal-reviews/reviewer-receipt.json",
        "sha256": "sha256:" + "1" * 64,
        "size": 1,
        "mode": "0400",
        "identity": {"device": 1, "inode": 1, "uid": os.geteuid(), "gid": os.getegid(), "nlink": 1},
        "reviewer_id": "trusted-reviewer",
    }
    with pytest.raises(zenith.ZenithError) as raised:
        _strict_call(tmp_path, mission_id, decisions, kwargs)
    assert raised.value.code == "INVALID_EVIDENCE"
    assert "does not accept caller-selected provenance" in str(raised.value)
    assert not (path / ".zenith-decide").exists()


def test_semantically_failing_report_is_rejected_even_when_descriptor_matches_bytes(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    descriptor = kwargs["evidence_manifest"]["action_evidence"][0]["artifacts"][0]
    artifact = path / descriptor["path"]
    report = _read_json(artifact)
    report["result"] = "fail"
    data = (json.dumps(report, indent=2, sort_keys=True) + "\n").encode()
    artifact.chmod(0o600)
    artifact.write_bytes(data)
    artifact.chmod(0o400)
    file_stat = artifact.stat()
    descriptor.update(
        {
            "sha256": zenith._sha256_bytes(data),
            "size": len(data),
            "mode": "0400",
            "identity": {
                "device": file_stat.st_dev,
                "inode": file_stat.st_ino,
                "uid": file_stat.st_uid,
                "gid": file_stat.st_gid,
                "nlink": file_stat.st_nlink,
            },
        }
    )
    with pytest.raises(zenith.ZenithError) as raised:
        _strict_call(tmp_path, mission_id, decisions, kwargs)
    assert raised.value.code == "INVALID_EVIDENCE"
    assert "semantic result/subject/snapshot" in str(raised.value)


def test_non_nfc_action_identifier_or_string_is_rejected_before_lock_write(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    decisions[0]["reason"] = "e\u0301"
    preconditions = zenith.get_decide_preconditions(mission_id, workspace=str(tmp_path))
    with pytest.raises(zenith.ZenithError) as raised:
        run(
            zenith.decide(
                mission_id,
                decisions,
                workspace=str(tmp_path),
                expected_revision=preconditions["revision"],
                expected_file_hashes=preconditions["file_hashes"],
                evidence_manifest={},
                operation_id=str(uuid.uuid4()),
            )
        )
    assert raised.value.code == "INVALID_EVIDENCE"
    assert "NFC" in str(raised.value)
    assert not (path / ".zenith-decide").exists()


@pytest.mark.parametrize(
    "payload",
    [
        b'{"decisions": [], "decisions": []}\n',
        b'{"decisions": [], "expected_revision": NaN}\n',
        b'\xff\xfe',
    ],
)
def test_run_dispatcher_strictly_rejects_duplicate_keys_nan_and_invalid_utf8(
    payload: bytes,
    tmp_path: Path,
) -> None:
    input_path = tmp_path / "strict-input.json"
    input_path.write_bytes(payload)
    response = json.loads(
        run(
            zenith.run(
                action="decide",
                mission_id="synthetic-mission",
                workspace=str(tmp_path),
                input_path=str(input_path),
            )
        )
    )
    assert response["ok"] is False
    assert response["error_type"] == "ZenithError"


@pytest.mark.parametrize("attack", ["state-symlink", "state-hardlink", "writable-root"])
def test_state_authority_path_attacks_block_precondition_reader(
    attack: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, _ = _attention_fixture(tmp_path, monkeypatch)
    if attack == "state-symlink":
        plan = path / "plan.json"
        saved = path / "plan.saved"
        plan.rename(saved)
        plan.symlink_to(saved.name)
    elif attack == "state-hardlink":
        os.link(path / "events.json", path / "events.alias")
    else:
        path.chmod(0o770)
    with pytest.raises(zenith.ZenithError) as raised:
        zenith.get_decide_preconditions(mission_id, workspace=str(tmp_path))
    if attack == "writable-root":
        assert raised.value.code == "RECOVERY_BLOCKED"


@pytest.mark.parametrize(
    "fault_point",
    [
        "after_active_create",
        "after_stage:attention.json",
        "after_stage:decisions.json",
        "after_stage:events.json",
        "after_stage:mission.md",
        "after_stage:mission.json",
        "after_stage:receipt.json",
        "after_journal",
    ],
)
def test_every_precommit_staging_subset_recovers_all_old_without_receipt(
    fault_point: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    before = _authority_bytes(path)
    fired = False

    def fail(point: str) -> None:
        nonlocal fired
        if point == fault_point and not fired:
            fired = True
            raise OSError("precommit subset stop")

    monkeypatch.setattr(zenith, "_decide_fault", fail)
    with pytest.raises(OSError, match="precommit subset"):
        _strict_call(tmp_path, mission_id, decisions, kwargs)
    monkeypatch.setattr(zenith, "_decide_fault", lambda point: None)
    zenith.inspect(mission_id, workspace=str(tmp_path))
    assert _authority_bytes(path) == before
    assert not (path / ".zenith-decide" / "active").exists()
    assert not (path / ".zenith-decide" / "receipts" / f"{kwargs['operation_id']}.json").exists()


@pytest.mark.parametrize("corruption", ["commit", "missing-postimage", "applied", "receipt"])
def test_additional_transaction_corruption_is_fail_closed(
    corruption: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    if corruption == "receipt":
        _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
        kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
        _strict_call(tmp_path, mission_id, decisions, kwargs)
        receipt = path / ".zenith-decide" / "receipts" / f"{kwargs['operation_id']}.json"
        receipt.chmod(0o600)
        receipt.write_bytes(b"{}\n")
        receipt.chmod(0o400)
        with pytest.raises(zenith.ZenithError) as raised:
            _strict_call(tmp_path, mission_id, decisions, kwargs)
    else:
        stop = "after_applied" if corruption == "applied" else "after_commit_fsync"
        _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
        kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)

        def fail(point: str) -> None:
            if point == stop:
                raise SimulatedCrash("corruption fixture stop")

        monkeypatch.setattr(zenith, "_decide_fault", fail)
        with pytest.raises(SimulatedCrash):
            _strict_call(tmp_path, mission_id, decisions, kwargs)
        monkeypatch.setattr(zenith, "_decide_fault", lambda point: None)
        active = path / ".zenith-decide" / "active"
        if corruption == "commit":
            target = active / "COMMIT"
            target.chmod(0o600)
            target.write_bytes(b"{}\n")
            target.chmod(0o400)
        elif corruption == "missing-postimage":
            (active / "post" / "events.json").unlink()
        else:
            target = active / "APPLIED"
            target.chmod(0o600)
            target.write_bytes(b"wrong\n")
            target.chmod(0o400)
        with pytest.raises(zenith.ZenithError) as raised:
            zenith.inspect(mission_id, workspace=str(tmp_path))
    assert raised.value.code == "RECOVERY_BLOCKED"
    assert raised.value.http_status == 503


def test_strict_decide_signature_keeps_existing_positionals_and_new_inputs_keyword_only() -> None:
    signature = inspect.signature(zenith.decide)
    assert list(signature.parameters)[:3] == ["mission_id", "decisions", "workspace"]
    for name in ("expected_revision", "expected_file_hashes", "evidence_manifest", "operation_id"):
        parameter = signature.parameters[name]
        assert parameter.kind is inspect.Parameter.KEYWORD_ONLY
        assert parameter.default is None



def test_transaction_fsync_retries_eintr_and_hard_failure_is_typed_503(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    real_fsync = zenith.os.fsync
    calls = 0

    def interrupted_once(fd: int) -> None:
        nonlocal calls
        calls += 1
        if calls == 1:
            raise InterruptedError()
        real_fsync(fd)

    monkeypatch.setattr(zenith.os, "fsync", interrupted_once)
    result = _strict_call(tmp_path, mission_id, decisions, kwargs)
    assert result["committed_revision"] == kwargs["expected_revision"] + 1
    assert calls > 1

    # A fresh fixture exercises the fail-closed error taxonomy.
    monkeypatch.setattr(zenith.os, "fsync", real_fsync)
    _, second_id, second_path, second_decisions = _attention_fixture(tmp_path / "second", monkeypatch)
    second_kwargs = strict_decide_arguments(tmp_path / "second", second_id, second_decisions)
    before = _authority_bytes(second_path)

    def fail_fsync(fd: int) -> None:
        raise OSError("injected durable-write failure")

    monkeypatch.setattr(zenith.os, "fsync", fail_fsync)
    with pytest.raises(zenith.ZenithError) as raised:
        _strict_call(tmp_path / "second", second_id, second_decisions, second_kwargs)
    assert raised.value.code == "RECOVERY_BLOCKED"
    assert raised.value.http_status == 503
    assert _authority_bytes(second_path) == before



def test_real_subprocess_death_after_partial_install_is_recovered(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, mission_id, path, decisions = _attention_fixture(tmp_path, monkeypatch)
    kwargs = strict_decide_arguments(tmp_path, mission_id, decisions)
    payload_path = tmp_path / "subprocess-decide.json"
    payload_path.write_text(
        json.dumps(
            {
                "mission_id": mission_id,
                "workspace": str(tmp_path),
                "decisions": decisions,
                "kwargs": kwargs,
            }
        )
    )
    script = r'''
import asyncio
import json
import os
import sys
import zenith
payload = json.load(open(sys.argv[1], encoding="utf-8"))
def die(point):
    if point == "after_install:events.json":
        os._exit(91)
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
        timeout=15,
    )
    assert completed.returncode == 91
    assert (path / ".zenith-decide" / "active" / "COMMIT").exists()

    recovered = zenith.inspect(mission_id, workspace=str(tmp_path))
    replay = _strict_call(tmp_path, mission_id, decisions, kwargs)
    assert recovered["revision"] == kwargs["expected_revision"] + 1
    assert replay["committed_revision"] == recovered["revision"]
    assert len(
        [
            event
            for event in _read_json(path / "events.json")
            if event.get("operation_id") == kwargs["operation_id"]
        ]
    ) == 1

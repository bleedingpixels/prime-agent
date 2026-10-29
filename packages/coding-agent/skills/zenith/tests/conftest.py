from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Awaitable

import zenith


@dataclass
class FakeHandle:
    rlm_child_id: str
    name: str
    session_dir: str
    model: str | None = None
    status: str = "running"


class FakeRuntime:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.spawn_calls: list[dict[str, Any]] = []
        self.children: list[dict[str, Any]] = []
        self.deleted: list[str] = []
        self.notifications: list[str] = []
        self.list_calls = 0
        self._next_id = 0

    async def spawn(self, prompt: str, *, name: str, model: str | None = None) -> FakeHandle:
        self._next_id += 1
        child_id = f"child-{self._next_id}"
        handle = FakeHandle(
            rlm_child_id=child_id,
            name=name,
            session_dir=str(self.root / child_id),
            model=model,
        )
        self.spawn_calls.append({"prompt": prompt, "name": name, "model": model, "handle": handle})
        self.children.append({"rlm_child_id": child_id, "session_name": name, "status": "running"})
        return handle

    async def list_subagents(self) -> list[dict[str, Any]]:
        self.list_calls += 1
        return [dict(child) for child in self.children]

    async def delete_subagent(self, target: str) -> None:
        self.deleted.append(target)

    async def notify(self, message: str) -> None:
        self.notifications.append(message)

    def set_status(self, child_id: str, status: str) -> None:
        child = next(item for item in self.children if item["rlm_child_id"] == child_id)
        child["status"] = status


def install_runtime(monkeypatch: Any, root: Path) -> FakeRuntime:
    runtime = FakeRuntime(root)
    monkeypatch.setattr(zenith, "_rlm_spawn", runtime.spawn)
    monkeypatch.setattr(zenith, "_rlm_list_subagents", runtime.list_subagents)
    monkeypatch.setattr(zenith, "_rlm_delete_subagent", runtime.delete_subagent)
    monkeypatch.setattr(zenith, "_notify_parent", runtime.notify)
    return runtime


def run(awaitable: Awaitable[Any]) -> Any:
    return asyncio.run(awaitable)


def strict_decide_arguments(
    workspace: Path,
    mission_id: str,
    decisions: Any,
    *,
    operation_id: str | None = None,
    issued_at: str | None = None,
) -> dict[str, Any]:
    """Create policy-shaped bounded evidence for a temporary mission fixture."""

    import hashlib
    import hmac
    import json
    import os
    import stat
    import uuid

    preconditions = zenith.get_decide_preconditions(mission_id, workspace=str(workspace))
    operation_id = operation_id or str(uuid.uuid4())
    actions = zenith._normalise_decide_actions(decisions)
    snapshot_sha256 = zenith._sha256_canonical(preconditions["file_hashes"])
    mission_path = workspace / ".prime" / "agent" / "zenith" / "missions" / mission_id
    attention = {
        item["id"]: item
        for item in json.loads((mission_path / "attention.json").read_text())
        if item.get("status") == "open"
    }
    subject = {
        "build_sha256": zenith._sha256_bytes(b"temporary-fixture-build-v1"),
        "code_sha256": zenith._sha256_bytes(b"temporary-fixture-code-v1"),
        "config_sha256": zenith._sha256_bytes(b"temporary-fixture-config-v1"),
    }
    subject_sha256 = zenith._sha256_canonical(subject)
    action_evidence: list[dict[str, Any]] = []
    evidence_root = mission_path / "preflight-artifacts"
    evidence_root.mkdir(exist_ok=True)
    terminal_root = mission_path / "terminal-reviews"
    for index, action in enumerate(actions):
        action_sha256 = zenith._sha256_canonical(action)
        policy = zenith._EVIDENCE_POLICY.get(action["action"], {
            "kind": "patch-unavailable",
            "validator_id": "zenith.patch-unavailable/v1",
            "report_schema": "zenith.evidence.patch-unavailable/v1",
            "result": "unavailable",
            "authenticated": False,
        })
        report = {
            "schema": policy["report_schema"],
            "mission_id": mission_id,
            "operation_id": operation_id,
            "base_revision": preconditions["revision"],
            "base_snapshot_sha256": snapshot_sha256,
            "target_id": action["attention_id"],
            "action_sha256": action_sha256,
            "subject": subject,
            "subject_sha256": subject_sha256,
            "attention": zenith._attention_evidence_binding(
                attention.get(
                    action["attention_id"],
                    {"id": action["attention_id"], "kind": "not-open", "targets": []},
                )
            ),
            "result": policy["result"],
            "details": "Temporary-fixture policy report; producer authenticity follows the action policy.",
        }
        relative = f"preflight-artifacts/decide-{operation_id}-{index}.json"
        artifact_path = evidence_root / f"decide-{operation_id}-{index}.json"
        data = (json.dumps(report, indent=2, sort_keys=True) + "\n").encode()
        fd = os.open(artifact_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o400)
        try:
            zenith._write_all(fd, data)
            os.fsync(fd)
        finally:
            os.close(fd)
        file_stat = artifact_path.stat()
        descriptor: dict[str, Any] = {
            "kind": policy["kind"],
            "media_type": "application/json",
            "path": relative,
            "report_schema": policy["report_schema"],
            "sha256": "sha256:" + hashlib.sha256(data).hexdigest(),
            "size": len(data),
            "validator_id": policy["validator_id"],
            "mode": f"{stat.S_IMODE(file_stat.st_mode):04o}",
            "identity": {
                "device": file_stat.st_dev,
                "inode": file_stat.st_ino,
                "uid": file_stat.st_uid,
                "gid": file_stat.st_gid,
                "nlink": file_stat.st_nlink,
            },
        }
        if policy["authenticated"]:
            key_path = workspace / ".zenith-test-controller-trust-root"
            if not key_path.exists():
                key = hashlib.sha256(str(workspace).encode()).digest()
                key_fd = os.open(key_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o400)
                try:
                    zenith._write_all(key_fd, key)
                    os.fsync(key_fd)
                finally:
                    os.close(key_fd)
            key = key_path.read_bytes()
            zenith._EVIDENCE_TRUST_ROOT_FILE = key_path
            provenance_body = {
                "schema": "zenith.evidence.provenance-receipt/v2",
                "reviewer_id": "fixture-independent-reviewer",
                "operation_id": operation_id,
                "artifact_sha256": descriptor["sha256"],
                "action_sha256": action_sha256,
                "subject_sha256": subject_sha256,
                "target_id": action["attention_id"],
                "result": policy["result"],
                "issued_at": issued_at or datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
            provenance = {
                **provenance_body,
                "hmac_sha256": "sha256:" + hmac.new(
                    key,
                    zenith._canonical_json_bytes(provenance_body),
                    hashlib.sha256,
                ).hexdigest(),
            }
            provenance_relative = f"terminal-reviews/decide-{operation_id}-{index}-provenance.json"
            provenance_path = terminal_root / f"decide-{operation_id}-{index}-provenance.json"
            provenance_data = (json.dumps(provenance, indent=2, sort_keys=True) + "\n").encode()
            provenance_fd = os.open(provenance_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o400)
            try:
                zenith._write_all(provenance_fd, provenance_data)
                os.fsync(provenance_fd)
            finally:
                os.close(provenance_fd)
            provenance_stat = provenance_path.stat()
            descriptor["provenance_receipt"] = {
                "path": provenance_relative,
                "sha256": zenith._sha256_bytes(provenance_data),
                "size": len(provenance_data),
                "mode": f"{stat.S_IMODE(provenance_stat.st_mode):04o}",
                "identity": {
                    "device": provenance_stat.st_dev,
                    "inode": provenance_stat.st_ino,
                    "uid": provenance_stat.st_uid,
                    "gid": provenance_stat.st_gid,
                    "nlink": provenance_stat.st_nlink,
                },
                "reviewer_id": "fixture-independent-reviewer",
            }
        action_evidence.append({
            "action_sha256": action_sha256,
            "artifacts": [descriptor],
            "subject": subject,
            "subject_sha256": subject_sha256,
            "target_id": action["attention_id"],
            "target_type": "attention",
        })
    manifest = {
        "schema": "zenith.decide.evidence/v1",
        "mission_id": mission_id,
        "operation_id": operation_id,
        "base_revision": preconditions["revision"],
        "base_snapshot_sha256": snapshot_sha256,
        "action_evidence": action_evidence,
    }
    return {
        "expected_revision": preconditions["revision"],
        "expected_file_hashes": preconditions["file_hashes"],
        "evidence_manifest": manifest,
        "operation_id": operation_id,
    }


def strict_decide(
    workspace: Path,
    mission_id: str,
    decisions: Any,
    *,
    operation_id: str | None = None,
) -> dict[str, Any]:
    receipt = run(
        zenith.decide(
            mission_id,
            decisions,
            workspace=str(workspace),
            **strict_decide_arguments(workspace, mission_id, decisions, operation_id=operation_id),
        )
    )
    return receipt["response"]


def single_assertion_plan() -> tuple[dict[str, Any], list[dict[str, Any]]]:
    contract = {
        "assertions": [
            {
                "id": "feature",
                "description": "The delivered feature satisfies the requested behavior.",
                "required_evidence": ["focused-test", "diff-inspection"],
            },
        ]
    }
    tasks = [
        {
            "id": "work",
            "role": "work",
            "targets": ["feature"],
            "depends_on": [],
            "description": "Implement the feature and record focused verification.",
        },
        {
            "id": "validator",
            "role": "validate",
            "targets": ["feature"],
            "depends_on": ["work"],
            "description": "Independently validate the feature.",
        },
        {
            "id": "gate",
            "role": "gate",
            "targets": ["feature"],
            "depends_on": ["validator"],
        },
    ]
    return contract, tasks


def two_branch_plan() -> tuple[dict[str, Any], list[dict[str, Any]]]:
    contract = {
        "assertions": [
            {"id": "alpha", "description": "Alpha behavior is correct.", "required_evidence": ["alpha-test"]},
            {"id": "beta", "description": "Beta behavior is correct.", "required_evidence": ["beta-test"]},
        ]
    }
    tasks: list[dict[str, Any]] = []
    for name in ("alpha", "beta"):
        tasks.extend(
            [
                {
                    "id": f"{name}-work",
                    "role": "work",
                    "targets": [name],
                    "depends_on": [],
                    "description": f"Implement {name} behavior.",
                },
                {
                    "id": f"{name}-validator",
                    "role": "validate",
                    "targets": [name],
                    "depends_on": [f"{name}-work"],
                    "description": f"Independently validate {name} behavior.",
                },
                {
                    "id": f"{name}-gate",
                    "role": "gate",
                    "targets": [name],
                    "depends_on": [f"{name}-validator"],
                },
            ]
        )
    return contract, tasks


def start_with_plan(
    workspace: Path,
    monkeypatch: Any,
    *,
    concurrency: int | str = 2,
    min_concurrency: int = 1,
    max_concurrency: int | None = None,
    plan: tuple[dict[str, Any], list[dict[str, Any]]] | None = None,
) -> tuple[FakeRuntime, str, Path]:
    runtime = install_runtime(monkeypatch, workspace)
    started = run(
        zenith.start(
            "Implement a verified feature",
            workspace=str(workspace),
            concurrency=concurrency,
            min_concurrency=min_concurrency,
            max_concurrency=max_concurrency,
            require_preflight=False,
        )
    )
    mission_id = started["mission_id"]
    contract, tasks = plan or single_assertion_plan()
    zenith.submit_plan(mission_id, contract=contract, tasks=tasks, workspace=str(workspace), mission="Verified delivery")
    return runtime, mission_id, Path(started["path"])

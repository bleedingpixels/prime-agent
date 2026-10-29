"""Prime-native durable multi-agent mission orchestration.

Zenith keeps authority in a workspace ledger and uses Prime's native RLM child
admission API.  Child completions are immutable handoff files; only a later
parent ``advance`` folds those handoffs into aggregate mission state.
"""

from __future__ import annotations

import asyncio
import ctypes
import errno
import hashlib
import hmac
import importlib
import json
import os
import re
import secrets
import shutil
import stat
import sys
import tempfile
import time
import unicodedata
import uuid
from contextlib import AbstractContextManager
from contextvars import ContextVar, Token
from copy import deepcopy
from dataclasses import asdict, is_dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path, PurePosixPath
from typing import Any, Iterable, Literal, Mapping, Sequence, TypeAlias

try:  # Guarded so importing the skill remains cross-platform.
    import fcntl as _fcntl
except ImportError:  # pragma: no cover - exercised on Windows
    _fcntl = None

__version__ = "0.1.0"
_SCHEMA_VERSION = 1
_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")
_ROLES = {"work", "validate", "gate"}
_TASK_STATUSES = {"pending", "dispatching", "running", "cleared", "failed", "superseded"}
_ASSERTION_STATUSES = {"pending", "passed", "failed", "accepted_risk"}
_STATES = {"planning", "running", "attention_needed", "ready_for_review", "reviewing", "done", "aborted"}
_TERMINAL_TASK = {"cleared", "superseded"}
_MAX_CONCURRENCY = 32
_DEFAULT_AUTO_MAX = 8
_DECIDE_HASH_FILES = (
    "mission.json",
    "attention.json",
    "decisions.json",
    "events.json",
    "contract.json",
    "plan.json",
    "mission.md",
)
_DECIDE_STATE_OUTPUTS = (
    "attention.json",
    "decisions.json",
    "events.json",
    "mission.md",
    "mission.json",
)
_HASH_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
_MAX_STATE_BYTES = 16 * 1024 * 1024
_MAX_STATE_NODES = 131_072
_MAX_STATE_DEPTH = 32
_MAX_STATE_STRING_BYTES = 8 * 1024 * 1024
_MAX_REQUEST_BYTES = 512 * 1024
_MAX_EVIDENCE_BYTES = 1024 * 1024
_MAX_EVIDENCE_TOTAL_BYTES = 4 * 1024 * 1024
_MAX_EVIDENCE_ACTIONS = 32
_MAX_EVIDENCE_ARTIFACTS = 32
_MAX_REVISION = (1 << 63) - 1
_MAX_ARCHIVED_OPERATIONS = 4096
_MAX_METADATA_BYTES = 256 * 1024 * 1024
_PROVENANCE_MAX_AGE_SECONDS = 5 * 60
_PROVENANCE_MAX_FUTURE_SKEW_SECONDS = 30
_DECIDE_METADATA = ".zenith-decide"
_RESERVATION_NAME = "RESERVATION"
_RESERVATION_TEMP_NAME = "RESERVATION.tmp"

# A trust root is controller configuration, never a request field.  None means
# authenticated/independent policies fail closed.  Tests may replace this
# module-private path with a mode-0400 temporary controller fixture.
_configured_trust_root = os.environ.get("ZENITH_EVIDENCE_TRUST_ROOT_FILE")
_EVIDENCE_TRUST_ROOT_FILE: Path | None = (
    Path(_configured_trust_root).expanduser() if _configured_trust_root else None
)

_EVIDENCE_POLICY: dict[str, dict[str, Any]] = {
    # Retrying failed work and stopping a mission are conservative: these two
    # narrowly named reports may be integrity-bound but unauthenticated.
    "retry": {
        "kind": "retry-diagnostic",
        "validator_id": "zenith.retry-diagnostic/v1",
        "report_schema": "zenith.evidence.retry-diagnostic/v2",
        "result": "retry-recommended",
        "authenticated": False,
    },
    "abort": {
        "kind": "abort-rationale",
        "validator_id": "zenith.abort-rationale/v1",
        "report_schema": "zenith.evidence.abort-rationale/v2",
        "result": "abort-recommended",
        "authenticated": False,
    },
    # Risk acceptance changes an assertion without independent validation and
    # therefore always requires a controller-authenticated approval receipt.
    "continue": {
        "kind": "independent-risk-approval",
        "validator_id": "zenith.independent-risk-approval/v1",
        "report_schema": "zenith.evidence.independent-risk-approval/v2",
        "result": "risk-accepted",
        "authenticated": True,
    },
}

EvidenceManifestV1: TypeAlias = Mapping[str, Any]
DecideReceiptV1: TypeAlias = dict[str, Any]


class ZenithError(RuntimeError):
    """A user-actionable Zenith ledger or state-machine error.

    ``code`` and ``http_status`` let API adapters preserve the strict decide
    status taxonomy without changing the exception type used by older callers.
    """

    def __init__(
        self,
        message: str,
        *,
        code: str = "ZENITH_ERROR",
        http_status: int = 400,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.http_status = http_status
        self.status = http_status


# Linux filesystem magic values whose flock, same-filesystem renameat2, and
# directory-fsync semantics are explicitly admitted by this implementation.
# Network, FUSE, and unknown storage are rejected rather than guessed safe.
_SUPPORTED_STORAGE_MAGIC: dict[int, str] = {
    0xEF53: "ext2/3/4",
    0x58465342: "xfs",
    0x9123683E: "btrfs",
    0x01021994: "tmpfs",
    0x794C7630: "overlayfs",
}
_UNSUPPORTED_STORAGE_MAGIC: dict[int, str] = {
    0x6969: "nfs",
    0x65735546: "fuse",
    0xFF534D42: "cifs",
    0x517B: "smb",
}


class _StatFS(ctypes.Structure):
    _fields_ = [
        ("f_type", ctypes.c_long),
        ("f_bsize", ctypes.c_long),
        ("f_blocks", ctypes.c_ulong),
        ("f_bfree", ctypes.c_ulong),
        ("f_bavail", ctypes.c_ulong),
        ("f_files", ctypes.c_ulong),
        ("f_ffree", ctypes.c_ulong),
        ("f_fsid", ctypes.c_int * 2),
        ("f_namelen", ctypes.c_long),
        ("f_frsize", ctypes.c_long),
        ("f_flags", ctypes.c_long),
        ("f_spare", ctypes.c_long * 4),
    ]


def _filesystem_magic(fd: int) -> int:
    if not sys.platform.startswith("linux"):
        raise OSError(errno.ENOTSUP, "filesystem qualification is available only on Linux")
    libc = ctypes.CDLL(None, use_errno=True)
    value = _StatFS()
    if libc.fstatfs(fd, ctypes.byref(value)) != 0:
        number = ctypes.get_errno()
        raise OSError(number, os.strerror(number))
    return int(value.f_type) & 0xFFFFFFFF


def _storage_profile(fd: int) -> dict[str, Any]:
    if _fcntl is None:
        raise ZenithError(
            "Zenith strict storage requires POSIX flock; no fallback lock is permitted",
            code="UNSUPPORTED_STORAGE",
            http_status=503,
        )
    if not hasattr(os, "O_DIRECTORY") or not hasattr(os, "O_NOFOLLOW"):
        raise ZenithError(
            "Zenith strict storage requires directory descriptors and no-follow opens",
            code="UNSUPPORTED_STORAGE",
            http_status=503,
        )
    try:
        magic = _filesystem_magic(fd)
    except OSError as exc:
        raise ZenithError(
            "Zenith could not qualify the mission filesystem",
            code="UNSUPPORTED_STORAGE",
            http_status=503,
        ) from exc
    name = _SUPPORTED_STORAGE_MAGIC.get(magic)
    if name is None:
        label = _UNSUPPORTED_STORAGE_MAGIC.get(magic, "unknown")
        raise ZenithError(
            f"Zenith refuses unsupported storage semantics ({label})",
            code="UNSUPPORTED_STORAGE",
            http_status=503,
        )
    return {
        "schema": "zenith.storage-profile/v1",
        "filesystem": name,
        "magic": f"0x{magic:08x}",
        "flock": True,
        "same_filesystem_rename": True,
        "rename_noreplace": True,
        "directory_fsync": True,
    }


_ACTIVE_LOCKS: ContextVar[tuple[Any, ...]] = ContextVar("zenith_active_locks", default=())


class _FileLock(AbstractContextManager["_FileLock"]):
    """Exclusive lock plus retained trusted-parent, mission-root, and metadata FDs."""

    def __init__(self, path: Path, timeout: float = 10.0, stale_after: float = 120.0):
        del stale_after  # stale guard-file locking is intentionally unsupported
        self.path = path
        self.root_path = path.parent
        self.trusted_parent_path = self.root_path.parent
        self.timeout = timeout
        self._trusted_parent_fd: int | None = None
        self._root_fd: int | None = None
        self._lock_fd: int | None = None
        self._metadata_fd: int | None = None
        self._metadata_identity: tuple[int, int] | None = None
        self._trusted_parent_identity: tuple[int, int] | None = None
        self._root_identity: tuple[int, int] | None = None
        self._lock_identity: tuple[int, int] | None = None
        self._owner: int | None = None
        self._gid: int | None = None
        self.storage_profile: dict[str, Any] | None = None
        self.recovery_complete = False
        self._context_token: Token[tuple[Any, ...]] | None = None

    @property
    def trusted_parent_fd(self) -> int:
        if self._trusted_parent_fd is None:
            raise ZenithError("mission authority is not open", code="RECOVERY_BLOCKED", http_status=503)
        return self._trusted_parent_fd

    @property
    def root_fd(self) -> int:
        if self._root_fd is None:
            raise ZenithError("mission authority is not open", code="RECOVERY_BLOCKED", http_status=503)
        return self._root_fd

    @property
    def lock_fd(self) -> int:
        if self._lock_fd is None:
            raise ZenithError("mission lock is not open", code="RECOVERY_BLOCKED", http_status=503)
        return self._lock_fd

    @property
    def owner(self) -> int:
        if self._owner is None:
            raise ZenithError("mission owner is unavailable", code="RECOVERY_BLOCKED", http_status=503)
        return self._owner

    @property
    def gid(self) -> int:
        if self._gid is None:
            raise ZenithError("mission group is unavailable", code="RECOVERY_BLOCKED", http_status=503)
        return self._gid

    def _close_all(self) -> None:
        for attribute in ("_metadata_fd", "_lock_fd", "_root_fd", "_trusted_parent_fd"):
            fd = getattr(self, attribute)
            if fd is not None:
                try:
                    os.close(fd)
                except OSError:
                    pass
                setattr(self, attribute, None)

    @staticmethod
    def _directory_flags() -> int:
        return os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW

    def __enter__(self) -> "_FileLock":
        if _fcntl is None:
            raise ZenithError(
                "Zenith strict storage requires POSIX flock; no fallback lock is permitted",
                code="UNSUPPORTED_STORAGE",
                http_status=503,
            )
        deadline = time.monotonic() + self.timeout
        try:
            self._trusted_parent_fd = os.open(self.trusted_parent_path, self._directory_flags())
            parent_stat = os.fstat(self.trusted_parent_fd)
            parent_entry = os.stat(self.trusted_parent_path, follow_symlinks=False)
            if (
                not stat.S_ISDIR(parent_stat.st_mode)
                or (parent_stat.st_dev, parent_stat.st_ino) != (parent_entry.st_dev, parent_entry.st_ino)
                or parent_stat.st_uid != os.geteuid()
                or parent_stat.st_mode & 0o022
            ):
                raise OSError(errno.EPERM, "unsafe trusted mission parent")
            _reject_acl(self.trusted_parent_fd, "trusted mission parent")
            self._trusted_parent_identity = (parent_stat.st_dev, parent_stat.st_ino)

            self._root_fd = os.open(self.root_path.name, self._directory_flags(), dir_fd=self.trusted_parent_fd)
            root_stat = os.fstat(self.root_fd)
            root_entry = os.stat(self.root_path.name, dir_fd=self.trusted_parent_fd, follow_symlinks=False)
            if (
                not stat.S_ISDIR(root_stat.st_mode)
                or (root_stat.st_dev, root_stat.st_ino) != (root_entry.st_dev, root_entry.st_ino)
                or root_stat.st_uid != parent_stat.st_uid
                or stat.S_IMODE(root_stat.st_mode) != 0o700
            ):
                raise OSError(errno.EPERM, "mission root must be an exact controller-owned mode-0700 directory")
            _reject_acl(self.root_fd, "mission root")
            self._root_identity = (root_stat.st_dev, root_stat.st_ino)
            self._owner = root_stat.st_uid
            self._gid = root_stat.st_gid
            self.storage_profile = _storage_profile(self.root_fd)

            lock_flags = os.O_RDWR | os.O_CLOEXEC | os.O_NOFOLLOW
            self._lock_fd = os.open(self.path.name, lock_flags, dir_fd=self.root_fd)
            lock_stat = os.fstat(self.lock_fd)
            lock_entry = os.stat(self.path.name, dir_fd=self.root_fd, follow_symlinks=False)
            if (
                not stat.S_ISREG(lock_stat.st_mode)
                or lock_stat.st_nlink != 1
                or lock_stat.st_uid != self.owner
                or lock_stat.st_gid != self.gid
                or stat.S_IMODE(lock_stat.st_mode) != 0o600
                or (lock_stat.st_dev, lock_stat.st_ino) != (lock_entry.st_dev, lock_entry.st_ino)
            ):
                raise OSError(errno.EPERM, "mission lock must be an exact controller-owned regular mode-0600 inode")
            _reject_acl(self.lock_fd, "mission lock")
            self._lock_identity = (lock_stat.st_dev, lock_stat.st_ino)
        except ZenithError:
            self._close_all()
            raise
        except OSError as exc:
            self._close_all()
            raise ZenithError(
                "unsafe or missing mission lock authority",
                code="RECOVERY_BLOCKED",
                http_status=503,
            ) from exc

        while True:
            try:
                _fcntl.flock(self.lock_fd, _fcntl.LOCK_EX | _fcntl.LOCK_NB)
                break
            except BlockingIOError as exc:
                if time.monotonic() >= deadline:
                    self._close_all()
                    raise ZenithError(
                        "timed out acquiring the mission lock",
                        code="LOCK_TIMEOUT",
                        http_status=503,
                    ) from exc
                time.sleep(0.05)
            except InterruptedError:
                continue
            except OSError as exc:
                self._close_all()
                raise ZenithError(
                    "mission lock acquisition failed",
                    code="RECOVERY_BLOCKED",
                    http_status=503,
                ) from exc
        try:
            self.revalidate()
        except BaseException:
            try:
                _fcntl.flock(self.lock_fd, _fcntl.LOCK_UN)
            finally:
                self._close_all()
            raise
        self._context_token = _ACTIVE_LOCKS.set((*_ACTIVE_LOCKS.get(), self))
        return self

    def revalidate(self) -> None:
        """Rebind all retained descriptors to their trusted directory entries."""

        try:
            parent_stat = os.fstat(self.trusted_parent_fd)
            parent_entry = os.stat(self.trusted_parent_path, follow_symlinks=False)
            root_stat = os.fstat(self.root_fd)
            root_entry = os.stat(self.root_path.name, dir_fd=self.trusted_parent_fd, follow_symlinks=False)
            lock_stat = os.fstat(self.lock_fd)
            lock_entry = os.stat(self.path.name, dir_fd=self.root_fd, follow_symlinks=False)
            if (
                (parent_stat.st_dev, parent_stat.st_ino) != self._trusted_parent_identity
                or (parent_entry.st_dev, parent_entry.st_ino) != self._trusted_parent_identity
                or parent_stat.st_uid != os.geteuid()
                or parent_stat.st_mode & 0o022
                or (root_stat.st_dev, root_stat.st_ino) != self._root_identity
                or (root_entry.st_dev, root_entry.st_ino) != self._root_identity
                or root_stat.st_uid != self.owner
                or root_stat.st_gid != self.gid
                or stat.S_IMODE(root_stat.st_mode) != 0o700
                or (lock_stat.st_dev, lock_stat.st_ino) != self._lock_identity
                or (lock_entry.st_dev, lock_entry.st_ino) != self._lock_identity
                or not stat.S_ISREG(lock_stat.st_mode)
                or lock_stat.st_nlink != 1
                or lock_stat.st_uid != self.owner
                or lock_stat.st_gid != self.gid
                or stat.S_IMODE(lock_stat.st_mode) != 0o600
            ):
                raise OSError(errno.EPERM, "mission authority identity, owner, or mode changed")
            _reject_acl(self.trusted_parent_fd, "trusted mission parent")
            _reject_acl(self.root_fd, "mission root")
            _reject_acl(self.lock_fd, "mission lock")
            if self._metadata_fd is not None:
                metadata_stat = os.fstat(self._metadata_fd)
                metadata_entry = os.stat(_DECIDE_METADATA, dir_fd=self.root_fd, follow_symlinks=False)
                if (
                    (metadata_stat.st_dev, metadata_stat.st_ino) != self._metadata_identity
                    or (metadata_entry.st_dev, metadata_entry.st_ino) != self._metadata_identity
                    or not stat.S_ISDIR(metadata_stat.st_mode)
                    or metadata_stat.st_uid != self.owner
                    or metadata_stat.st_gid != self.gid
                    or stat.S_IMODE(metadata_stat.st_mode) != 0o700
                ):
                    raise OSError(errno.EPERM, "transaction metadata authority changed")
                _reject_acl(self._metadata_fd, "strict-decision metadata")
            if _storage_profile(self.root_fd) != self.storage_profile:
                raise OSError(errno.EXDEV, "filesystem qualification changed")
        except ZenithError:
            raise
        except OSError as exc:
            raise ZenithError(
                "mission filesystem authority changed",
                code="RECOVERY_BLOCKED",
                http_status=503,
            ) from exc

    def metadata_fd(self, *, create: bool = False) -> int | None:
        if self._metadata_fd is not None:
            self.revalidate()
            return self._metadata_fd
        try:
            fd = os.open(_DECIDE_METADATA, self._directory_flags(), dir_fd=self.root_fd)
        except FileNotFoundError:
            if not create:
                return None
            try:
                os.mkdir(_DECIDE_METADATA, 0o700, dir_fd=self.root_fd)
                _fsync_fd(self.root_fd)
                fd = os.open(_DECIDE_METADATA, self._directory_flags(), dir_fd=self.root_fd)
            except OSError as exc:
                raise ZenithError(
                    "cannot create strict-decision metadata",
                    code="RECOVERY_BLOCKED",
                    http_status=503,
                ) from exc
        except OSError as exc:
            raise ZenithError(
                "cannot open strict-decision metadata",
                code="RECOVERY_BLOCKED",
                http_status=503,
            ) from exc
        value = os.fstat(fd)
        if (
            not stat.S_ISDIR(value.st_mode)
            or value.st_uid != self.owner
            or value.st_gid != self.gid
            or stat.S_IMODE(value.st_mode) != 0o700
        ):
            os.close(fd)
            raise ZenithError(
                "strict-decision metadata must be an exact controller-owned mode-0700 directory",
                code="RECOVERY_BLOCKED",
                http_status=503,
            )
        try:
            _reject_acl(fd, "strict-decision metadata")
        except BaseException:
            os.close(fd)
            raise
        self._metadata_fd = fd
        self._metadata_identity = (value.st_dev, value.st_ino)
        self.revalidate()
        return fd

    def __exit__(self, exc_type: Any, exc: Any, traceback: Any) -> None:
        revalidation_error: BaseException | None = None
        try:
            if exc_type is None and self._lock_fd is not None:
                self.revalidate()
        except BaseException as failure:
            revalidation_error = failure
        finally:
            if self._context_token is not None:
                _ACTIVE_LOCKS.reset(self._context_token)
                self._context_token = None
            if self._lock_fd is not None:
                try:
                    _fcntl.flock(self._lock_fd, _fcntl.LOCK_UN)
                except OSError:
                    pass
            self._close_all()
        if revalidation_error is not None:
            raise revalidation_error


def _current_lock_for(path: Path) -> _FileLock | None:
    lexical = Path(os.path.abspath(os.fspath(path)))
    for candidate in reversed(_ACTIVE_LOCKS.get()):
        if candidate.root_path == lexical:
            return candidate
    return None

def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _provenance_now_epoch() -> int:
    """Return the one-second UTC clock used for bounded approval freshness."""

    return int(time.time())


def _parse_provenance_issued_at(value: Any, *, now_epoch: int) -> int:
    if (
        not isinstance(value, str)
        or len(value.encode("utf-8")) > 32
        or re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:Z|\+00:00)", value)
        is None
    ):
        raise _typed_error(
            "INVALID_EVIDENCE",
            422,
            "provenance receipt issued_at must be canonical whole-second UTC",
        )
    try:
        parsed = datetime.fromisoformat(value[:-1] + "+00:00" if value.endswith("Z") else value)
    except ValueError as exc:
        raise _typed_error(
            "INVALID_EVIDENCE", 422, "provenance receipt issued_at is not a real UTC instant"
        ) from exc
    if parsed.utcoffset() != timedelta(0) or parsed.microsecond != 0:
        raise _typed_error(
            "INVALID_EVIDENCE", 422, "provenance receipt issued_at must be whole-second UTC"
        )
    issued_epoch = int(parsed.timestamp())
    if issued_epoch < now_epoch - _PROVENANCE_MAX_AGE_SECONDS:
        raise _typed_error("INVALID_EVIDENCE", 422, "provenance receipt is stale")
    if issued_epoch > now_epoch + _PROVENANCE_MAX_FUTURE_SKEW_SECONDS:
        raise _typed_error("INVALID_EVIDENCE", 422, "provenance receipt is from the future")
    return issued_epoch


def _typed_error(code: str, http_status: int, message: str) -> ZenithError:
    return ZenithError(message, code=code, http_status=http_status)


def _sha256_bytes(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()


def _canonical_json_bytes(value: Any) -> bytes:
    """Return RFC-8785-compatible bytes for Zenith's deliberately narrow subset.

    Strict decide documents reject floats, so Python's integer/string encoding is
    the same deterministic representation required by JCS for the accepted
    domain.  NFC is checked before this helper is called.
    """

    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def _sha256_canonical(value: Any) -> str:
    return _sha256_bytes(_canonical_json_bytes(value))


def _json_bytes(value: Any) -> bytes:
    return (json.dumps(_jsonable(value), indent=2, sort_keys=True) + "\n").encode("utf-8")


def _strict_json_bytes(
    data: bytes,
    label: str,
    *,
    max_bytes: int = _MAX_STATE_BYTES,
    max_nodes: int = _MAX_STATE_NODES,
    max_depth: int = _MAX_STATE_DEPTH,
    max_string_bytes: int = _MAX_STATE_STRING_BYTES,
) -> Any:
    """Decode a byte-bounded, duplicate-free, finite, NFC JSON document."""

    if len(data) > max_bytes:
        raise ZenithError(f"{label} exceeds the {max_bytes}-byte limit")
    try:
        text = data.decode("utf-8", "strict")
    except UnicodeDecodeError as exc:
        raise ZenithError(f"{label} is not valid UTF-8") from exc

    def pairs(items: list[tuple[str, Any]]) -> dict[str, Any]:
        if len(items) > max_nodes:
            raise ValueError("object member count exceeds the document limit")
        result: dict[str, Any] = {}
        for key, value in items:
            if key in result:
                raise ValueError(f"duplicate JSON key {key!r}")
            result[key] = value
        return result

    def no_float(value: str) -> Any:
        raise ValueError(f"floating-point number {value!r} is not permitted")

    try:
        value = json.loads(
            text,
            object_pairs_hook=pairs,
            parse_float=no_float,
            parse_constant=lambda item: (_ for _ in ()).throw(ValueError(f"non-finite number {item}")),
        )
        remaining = max_nodes
        stack: list[tuple[Any, int]] = [(value, 0)]
        while stack:
            item, depth = stack.pop()
            remaining -= 1
            if remaining < 0 or depth > max_depth:
                raise ValueError("document count/depth limit exceeded")
            if isinstance(item, str):
                if len(item.encode("utf-8")) > max_string_bytes:
                    raise ValueError("document contains an oversized string")
                if unicodedata.normalize("NFC", item) != item:
                    raise ValueError("document contains a non-NFC string")
            elif type(item) is int:
                if not -(1 << 63) <= item <= _MAX_REVISION:
                    raise ValueError("document contains an out-of-range integer")
            elif isinstance(item, dict):
                if len(item) > max_nodes:
                    raise ValueError("object member count exceeds the document limit")
                for key, child in item.items():
                    if len(key.encode("utf-8")) > 256 or unicodedata.normalize("NFC", key) != key:
                        raise ValueError("document contains an invalid object key")
                    stack.append((child, depth + 1))
            elif isinstance(item, list):
                if len(item) > max_nodes:
                    raise ValueError("array length exceeds the document limit")
                stack.extend((child, depth + 1) for child in item)
            elif item is not None and type(item) is not bool:
                raise ValueError("document contains an unsupported JSON value")
        return value
    except (json.JSONDecodeError, ValueError, RecursionError) as exc:
        raise ZenithError(f"invalid strict JSON in {label}: {exc}") from exc


def _strict_json_value(
    value: Any,
    label: str,
    *,
    depth: int = 0,
    budget: list[int] | None = None,
) -> Any:
    """Validate/copy the bounded JSON subset used in request digests."""

    if budget is None:
        budget = [4096]
    budget[0] -= 1
    if budget[0] < 0 or depth > 16:
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label} is too large or deeply nested")
    if value is None or type(value) is bool:
        return value
    if type(value) is int:
        if not -(1 << 63) <= value <= _MAX_REVISION:
            raise _typed_error("INVALID_EVIDENCE", 422, f"{label} contains an out-of-range integer")
        return value
    if isinstance(value, float):
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label} must not contain floating-point values")
    if isinstance(value, str):
        if len(value.encode("utf-8")) > 4096:
            raise _typed_error("INVALID_EVIDENCE", 422, f"{label} contains an oversized string")
        if unicodedata.normalize("NFC", value) != value:
            raise _typed_error("INVALID_EVIDENCE", 422, f"{label} strings must be NFC-normalized")
        return value
    if isinstance(value, Mapping):
        result: dict[str, Any] = {}
        for key, item in value.items():
            if not isinstance(key, str):
                raise _typed_error("INVALID_EVIDENCE", 422, f"{label} object keys must be strings")
            if key in result:
                raise _typed_error("INVALID_EVIDENCE", 422, f"{label} contains a duplicate key {key!r}")
            if unicodedata.normalize("NFC", key) != key or len(key.encode("utf-8")) > 128:
                raise _typed_error("INVALID_EVIDENCE", 422, f"{label} contains an invalid object key")
            result[key] = _strict_json_value(item, f"{label}.{key}", depth=depth + 1, budget=budget)
        return result
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        if len(value) > 256:
            raise _typed_error("INVALID_EVIDENCE", 422, f"{label} array is too long")
        return [
            _strict_json_value(item, f"{label}[{index}]", depth=depth + 1, budget=budget)
            for index, item in enumerate(value)
        ]
    raise _typed_error("INVALID_EVIDENCE", 422, f"{label} contains a non-JSON value")


def _jsonable(value: Any) -> Any:
    if is_dataclass(value):
        return {key: _jsonable(item) for key, item in asdict(value).items()}
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, Mapping):
        return {str(key): _jsonable(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_jsonable(item) for item in value]
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def _atomic_bytes(path: Path, data: bytes) -> None:
    """Durably replace bytes, using the retained mission dirfd when available."""

    authority = _current_lock_for(path.parent)
    if authority is not None and path.parent == authority.root_path:
        if "/" in path.name or path.name in {"", ".", ".."}:
            raise ZenithError("invalid fixed mission-state filename")
        try:
            try:
                existing = os.stat(path.name, dir_fd=authority.root_fd, follow_symlinks=False)
            except FileNotFoundError:
                existing = None
            if existing is not None and (
                not stat.S_ISREG(existing.st_mode)
                or existing.st_nlink != 1
                or existing.st_uid != authority.owner
                or existing.st_gid != authority.gid
                or stat.S_IMODE(existing.st_mode) != 0o600
            ):
                raise OSError(errno.EPERM, "unsafe existing mission-state inode")
            temporary = f".{path.name}.{secrets.token_hex(12)}.tmp"
            flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_CLOEXEC | os.O_NOFOLLOW
            fd = os.open(temporary, flags, 0o600, dir_fd=authority.root_fd)
            try:
                os.fchmod(fd, 0o600)
                _write_all(fd, data)
                _fsync_fd(fd)
            finally:
                os.close(fd)
            try:
                os.rename(
                    temporary,
                    path.name,
                    src_dir_fd=authority.root_fd,
                    dst_dir_fd=authority.root_fd,
                )
                _fsync_fd(authority.root_fd)
            finally:
                try:
                    os.unlink(temporary, dir_fd=authority.root_fd)
                except FileNotFoundError:
                    pass
            authority.revalidate()
            return
        except ZenithError:
            raise
        except OSError as exc:
            raise ZenithError(
                "durable mission-state replacement failed",
                code="RECOVERY_BLOCKED",
                http_status=503,
            ) from exc

    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        os.fchmod(fd, 0o600)
        _write_all(fd, data)
        _fsync_fd(fd)
        os.close(fd)
        fd = -1
        os.replace(temporary, path)
        os.chmod(path, 0o600, follow_symlinks=False)
        directory_fd = os.open(
            path.parent,
            os.O_RDONLY | getattr(os, "O_DIRECTORY", 0) | getattr(os, "O_CLOEXEC", 0),
        )
        try:
            _fsync_fd(directory_fd)
        finally:
            os.close(directory_fd)
    finally:
        if fd >= 0:
            os.close(fd)
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass


def _write_json(path: Path, value: Any) -> None:
    _atomic_bytes(path, _json_bytes(value))


def _write_text(path: Path, value: str) -> None:
    _atomic_bytes(path, value.encode("utf-8"))


def _read_json(path: Path) -> Any:
    authority = _current_lock_for(path.parent)
    authoritative = authority is not None and path.parent == authority.root_path
    try:
        if authoritative:
            if not authority.recovery_complete:
                raise ZenithError(
                    "authoritative mission-state read attempted before recovery",
                    code="RECOVERY_BLOCKED",
                    http_status=503,
                )
            data, _ = _read_regular_at(
                authority.root_fd,
                path.name,
                owner=authority.owner,
                gid=authority.gid,
                max_bytes=_MAX_STATE_BYTES,
                exact_mode=0o600,
                label=path.name,
            )
        else:
            data = path.read_bytes()
        try:
            return _strict_json_bytes(data, f"Zenith artifact {path}")
        except ZenithError as exc:
            if authoritative:
                raise _recovery_blocked(
                    f"authoritative {path.name} is not bounded strict JSON", exc
                ) from exc
            raise
    except FileNotFoundError as exc:
        if authoritative:
            raise _recovery_blocked(f"required authoritative artifact is missing: {path.name}", exc) from exc
        raise ZenithError(f"required Zenith artifact is missing: {path}") from exc


def _workspace(workspace: str | os.PathLike[str]) -> Path:
    if not isinstance(workspace, (str, os.PathLike)):
        raise ZenithError("workspace must be a path string")
    return Path(workspace).expanduser().resolve()


def _require_within(path: Path, parent: Path, label: str) -> None:
    try:
        path.relative_to(parent)
    except ValueError as exc:
        raise ZenithError(f"{label} resolves outside the workspace: {path}") from exc


def _missions_root(workspace: str | os.PathLike[str]) -> Path:
    workspace_path = _workspace(workspace)
    current = workspace_path
    for component in (".prime", "agent", "zenith", "missions"):
        current = current / component
        if current.is_symlink():
            raise _typed_error("RECOVERY_BLOCKED", 503, "Zenith ledger authority path must not contain symlinks")
    resolved = current.resolve(strict=False)
    _require_within(resolved, workspace_path, "Zenith mission root")
    return current


def _valid_id(value: Any, label: str) -> str:
    if not isinstance(value, str) or not _ID_RE.fullmatch(value):
        raise ZenithError(f"{label} must match {_ID_RE.pattern}; got {value!r}")
    return value


def _mission_dir(mission_id: str, workspace: str | os.PathLike[str]) -> Path:
    root = _missions_root(workspace)
    path = root / _valid_id(mission_id, "mission_id")
    if path.is_symlink():
        raise _typed_error("RECOVERY_BLOCKED", 503, "Zenith mission directory authority is a symlink")
    resolved = path.resolve(strict=False)
    _require_within(resolved, _workspace(workspace), "Zenith mission directory")
    for authority_file in ("mission.json", ".lock"):
        if (path / authority_file).is_symlink():
            raise _typed_error("RECOVERY_BLOCKED", 503, "Zenith ledger authority file is a symlink")
    if not (path / "mission.json").is_file():
        raise ZenithError(f"Zenith mission does not exist: {mission_id} under {root}")
    return path


def _load_mission(path: Path) -> dict[str, Any]:
    # Recovery itself never calls _load_mission.  Existing API paths acquire
    # ``path/.lock`` before this load; direct internal use also recovers rather
    # than returning a post-COMMIT mixture.
    _recover_active_transaction(path)
    try:
        mission = _read_json(path / "mission.json")
        if not isinstance(mission, dict) or mission.get("schema_version") != _SCHEMA_VERSION:
            raise ZenithError("unsupported mission schema")
        if mission.get("state") not in _STATES:
            raise ZenithError("invalid mission state")
        _ensure_concurrency_policy(mission)
        return mission
    except ZenithError as exc:
        if exc.code == "RECOVERY_BLOCKED":
            raise
        raise _recovery_blocked("authoritative mission ledger invariant failed", exc) from exc


def _render_mission_markdown(mission: Mapping[str, Any]) -> str:
    charter = mission.get("mission")
    charter_section = f"\n## Mission charter\n\n{charter.strip()}\n" if isinstance(charter, str) and charter.strip() else ""
    return (
        f"# Zenith mission {mission['id']}\n\nState: `{mission['state']}`\n\n"
        f"Workspace: `{mission['workspace']}`\n\nUpdated: {mission['updated_at']}\n{charter_section}"
    )


def _save_mission(path: Path, mission: dict[str, Any]) -> None:
    mission["updated_at"] = _now()
    mission["revision"] = int(mission.get("revision", 0)) + 1
    _write_json(path / "mission.json", mission)
    _write_text(path / "mission.md", _render_mission_markdown(mission))


def _ledger_list(path: Path, name: str) -> list[dict[str, Any]]:
    target = path / name
    if not target.exists():
        return []
    value = _read_json(target)
    if not isinstance(value, list):
        if _current_lock_for(path) is not None:
            raise _recovery_blocked(f"authoritative {name} must contain a JSON list")
        raise ZenithError(f"{target} must contain a JSON list")
    return value


def _append_ledger(path: Path, name: str, item: dict[str, Any]) -> None:
    items = _ledger_list(path, name)
    items.append(item)
    _write_json(path / name, items)


def _event(path: Path, event: str, **details: Any) -> None:
    _append_ledger(path, "events.json", {"at": _now(), "event": event, **_jsonable(details)})


def _envelope(action: str, ledger: dict[str, Any] | None = None, **details: Any) -> dict[str, Any]:
    result: dict[str, Any] = {"ok": True, "action": action}
    if ledger is not None:
        result.update({"mission_id": ledger["id"], "state": ledger["state"], "revision": ledger["revision"]})
    result.update(_jsonable(details))
    return result


def _require_mapping(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, Mapping):
        raise ZenithError(f"{label} must be a JSON object")
    return dict(value)


def _string_list(value: Any, label: str, *, allow_empty: bool = False) -> list[str]:
    if not isinstance(value, Sequence) or isinstance(value, (str, bytes)):
        raise ZenithError(f"{label} must be a list of IDs")
    result = [_valid_id(item, label) for item in value]
    if not allow_empty and not result:
        raise ZenithError(f"{label} must not be empty")
    if len(result) != len(set(result)):
        raise ZenithError(f"{label} contains duplicate IDs")
    return result


def _description(item: Mapping[str, Any], label: str) -> str:
    for field in ("description", "objective", "text", "instructions"):
        value = item.get(field)
        if isinstance(value, str) and value.strip():
            return value.strip()
    raise ZenithError(f"{label} requires a non-empty description")


def _normalise_contract(contract: Any) -> dict[str, Any]:
    result = _require_mapping(contract, "contract")
    raw_assertions = result.get("assertions")
    if not isinstance(raw_assertions, Sequence) or isinstance(raw_assertions, (str, bytes)) or not raw_assertions:
        raise ZenithError("contract.assertions must be a non-empty list")
    assertions: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index, raw in enumerate(raw_assertions):
        item = _require_mapping(raw, f"contract.assertions[{index}]")
        assertion_id = _valid_id(item.get("id"), f"contract.assertions[{index}].id")
        if assertion_id in seen:
            raise ZenithError(f"duplicate assertion id: {assertion_id}")
        seen.add(assertion_id)
        description = _description(item, f"assertion {assertion_id}")
        required_evidence = item.get("required_evidence")
        if (
            not isinstance(required_evidence, Sequence)
            or isinstance(required_evidence, (str, bytes))
            or not required_evidence
            or any(not isinstance(value, str) or not value.strip() for value in required_evidence)
        ):
            raise ZenithError(f"assertion {assertion_id} requires non-empty required_evidence")
        normal = dict(item)
        normal["id"] = assertion_id
        normal["description"] = description
        normal["required_evidence"] = [value.strip() for value in required_evidence]
        normal.pop("status", None)
        assertions.append(normal)
    result["assertions"] = assertions
    return result


def _bounded_integer(value: Any, label: str, minimum: int, maximum: int) -> int:
    if not isinstance(value, int) or isinstance(value, bool) or not minimum <= value <= maximum:
        raise ZenithError(f"{label} must be an integer from {minimum} through {maximum}")
    return value


def _normalise_concurrency_policy(
    concurrency: int | str,
    *,
    min_concurrency: int = 1,
    max_concurrency: int | None = None,
) -> dict[str, Any]:
    if isinstance(concurrency, bool):
        raise ZenithError("concurrency must be an integer from 1 through 32 or 'auto'")
    if isinstance(concurrency, int):
        limit = _bounded_integer(concurrency, "concurrency", 1, _MAX_CONCURRENCY)
        return {
            "mode": "fixed", "minimum": limit, "maximum": limit,
            "effective": limit, "active_cost": 0, "scale_down_pending": False,
        }
    if concurrency != "auto":
        raise ZenithError("concurrency must be an integer from 1 through 32 or 'auto'")
    minimum = _bounded_integer(min_concurrency, "min_concurrency", 1, _MAX_CONCURRENCY)
    maximum = _DEFAULT_AUTO_MAX if max_concurrency is None else _bounded_integer(
        max_concurrency, "max_concurrency", 1, _MAX_CONCURRENCY
    )
    if minimum > maximum:
        raise ZenithError("min_concurrency must not exceed max_concurrency")
    return {
        "mode": "auto", "minimum": minimum, "maximum": maximum,
        "effective": minimum, "active_cost": 0, "scale_down_pending": False,
    }


def _ensure_concurrency_policy(mission: dict[str, Any]) -> dict[str, Any]:
    policy = mission.get("concurrency_policy")
    if not isinstance(policy, Mapping):
        policy = _normalise_concurrency_policy(mission.get("concurrency", 3))
        mission["concurrency_policy"] = policy
    else:
        policy = dict(policy)
        mode = policy.get("mode")
        if mode not in {"fixed", "auto"}:
            raise ZenithError(f"mission {mission.get('id', '<unknown>')} has invalid concurrency mode {mode!r}")
        minimum = _bounded_integer(policy.get("minimum"), "concurrency_policy.minimum", 1, _MAX_CONCURRENCY)
        maximum = _bounded_integer(policy.get("maximum"), "concurrency_policy.maximum", 1, _MAX_CONCURRENCY)
        if minimum > maximum or (mode == "fixed" and minimum != maximum):
            raise ZenithError("mission has an invalid concurrency policy range")
        effective = policy.get("effective", minimum if mode == "auto" else maximum)
        policy.update({
            "minimum": minimum,
            "maximum": maximum,
            "effective": _bounded_integer(effective, "concurrency_policy.effective", 1, _MAX_CONCURRENCY),
            "active_cost": int(policy.get("active_cost", 0)),
            "scale_down_pending": bool(policy.get("scale_down_pending", False)),
        })
        mission["concurrency_policy"] = policy
    mission["concurrency"] = int(policy["effective"])
    return policy


def _task_cost(task: Mapping[str, Any]) -> int:
    if task.get("role") == "gate":
        return 0
    value = task.get("concurrency_cost", 1)
    return value if isinstance(value, int) and not isinstance(value, bool) else 1


def _active_tasks(mission: Mapping[str, Any]) -> list[dict[str, Any]]:
    return [
        task for task in mission.get("tasks", {}).values()
        if task.get("role") != "gate" and task.get("status") in {"dispatching", "running"}
    ]


def _validate_task_capacity(tasks: Iterable[Mapping[str, Any]], maximum: int) -> None:
    oversized = sorted(
        str(task["id"]) for task in tasks
        if task.get("role") != "gate" and task.get("status") not in {"cleared", "superseded"}
        and _task_cost(task) > maximum
    )
    if oversized:
        raise ZenithError(
            f"tasks exceed the concurrency policy maximum {maximum}: {oversized}; "
            "raise the maximum or lower their concurrency_cost"
        )


def _normalise_tasks(tasks: Any) -> list[dict[str, Any]]:
    if not isinstance(tasks, Sequence) or isinstance(tasks, (str, bytes)) or not tasks:
        raise ZenithError("tasks must be a non-empty list")
    result: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index, raw in enumerate(tasks):
        item = _require_mapping(raw, f"tasks[{index}]")
        task_id = _valid_id(item.get("id"), f"tasks[{index}].id")
        if task_id in seen:
            raise ZenithError(f"duplicate task id: {task_id}")
        seen.add(task_id)
        role = item.get("role", item.get("kind"))
        if item.get("role") is not None and item.get("kind") is not None and item["role"] != item["kind"]:
            raise ZenithError(f"task {task_id} has conflicting role and kind")
        if role not in _ROLES:
            raise ZenithError(f"task {task_id} role must be work, validate, or gate")
        targets = _string_list(item.get("targets", []), f"task {task_id}.targets", allow_empty=role == "work")
        dependencies = _string_list(item.get("depends_on", []), f"task {task_id}.depends_on", allow_empty=True)
        if task_id in dependencies:
            raise ZenithError(f"task {task_id} cannot depend on itself")
        if role == "work" and item.get("read_only") is True:
            raise ZenithError(f"work task {task_id} cannot be declared read-only")
        if role == "validate" and (item.get("read_only") is False or item.get("write") is True):
            raise ZenithError(f"validator task {task_id} must be read-only")
        scheduling_fields = ("concurrency_cost", "exclusive", "priority")
        if role == "gate" and any(field in item for field in ("model", "write", "instructions", "read_only", *scheduling_fields)):
            raise ZenithError(
                f"gate task {task_id} cannot carry model/write/instructions/read_only or scheduling fields"
            )
        if role != "gate":
            concurrency_cost = _bounded_integer(
                item.get("concurrency_cost", 1), f"task {task_id}.concurrency_cost", 1, _MAX_CONCURRENCY
            )
            exclusive = item.get("exclusive", False)
            if not isinstance(exclusive, bool):
                raise ZenithError(f"task {task_id}.exclusive must be a boolean")
            priority = _bounded_integer(item.get("priority", 0), f"task {task_id}.priority", -100, 100)
        normal = dict(item)
        normal.pop("kind", None)
        normal["id"] = task_id
        normal["role"] = role
        normal["targets"] = targets
        normal["depends_on"] = dependencies
        normal["description"] = (
            _description(item, f"task {task_id}") if role != "gate" else str(item.get("description") or f"AND gate for {', '.join(targets)}")
        )
        if role == "validate":
            normal["read_only"] = True
        if role != "gate":
            normal["concurrency_cost"] = concurrency_cost
            normal["exclusive"] = exclusive
            normal["priority"] = priority
        result.append(normal)
    return result


def _validate_plan(contract: Any, tasks: Any) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    clean_contract = _normalise_contract(contract)
    clean_tasks = _normalise_tasks(tasks)
    assertion_ids = {item["id"] for item in clean_contract["assertions"]}
    task_by_id = {item["id"]: item for item in clean_tasks}
    for task in clean_tasks:
        unknown_targets = set(task["targets"]) - assertion_ids
        if unknown_targets:
            raise ZenithError(f"task {task['id']} targets unknown assertions: {sorted(unknown_targets)}")
        unknown_dependencies = set(task["depends_on"]) - set(task_by_id)
        if unknown_dependencies:
            raise ZenithError(f"task {task['id']} has unknown dependencies: {sorted(unknown_dependencies)}")

    indegree = {task_id: 0 for task_id in task_by_id}
    followers: dict[str, list[str]] = {task_id: [] for task_id in task_by_id}
    for task in clean_tasks:
        for dependency in task["depends_on"]:
            indegree[task["id"]] += 1
            followers[dependency].append(task["id"])
    queue = sorted(task_id for task_id, degree in indegree.items() if degree == 0)
    visited: list[str] = []
    while queue:
        task_id = queue.pop(0)
        visited.append(task_id)
        for follower in sorted(followers[task_id]):
            indegree[follower] -= 1
            if indegree[follower] == 0:
                queue.append(follower)
                queue.sort()
    if len(visited) != len(task_by_id):
        cyclic = sorted(task_id for task_id, degree in indegree.items() if degree)
        raise ZenithError(f"task dependency graph contains a cycle: {cyclic}")

    ancestors: dict[str, set[str]] = {}
    for task_id in visited:
        values: set[str] = set()
        for dependency in task_by_id[task_id]["depends_on"]:
            values.add(dependency)
            values.update(ancestors[dependency])
        ancestors[task_id] = values
    for assertion_id in sorted(assertion_ids):
        owners = [task for task in clean_tasks if task["role"] == "work" and assertion_id in task["targets"]]
        if len(owners) != 1:
            raise ZenithError(f"assertion {assertion_id} requires exactly one work owner; found {len(owners)}")
        validators = [task for task in clean_tasks if task["role"] == "validate" and assertion_id in task["targets"]]
        if not validators:
            raise ZenithError(f"assertion {assertion_id} has no validator coverage")
        owner_id = owners[0]["id"]
        for validator in validators:
            if owner_id not in ancestors[validator["id"]]:
                raise ZenithError(f"validator {validator['id']} is not downstream of work owner {owner_id}")
        gates = [task for task in clean_tasks if task["role"] == "gate" and assertion_id in task["targets"]]
        if not gates:
            raise ZenithError(f"assertion {assertion_id} has no gate coverage")
        for gate in gates:
            missing = [validator["id"] for validator in validators if validator["id"] not in ancestors[gate["id"]]]
            if missing:
                raise ZenithError(f"gate {gate['id']} is not downstream of validators: {sorted(missing)}")
    return clean_contract, clean_tasks


async def _rlm_spawn(prompt: str, *, name: str, model: str | None = None) -> Any:
    """Runtime hook used by tests and the Prime kernel."""
    module = importlib.import_module("rlm")
    callable_rlm = getattr(module, "rlm", module)
    kwargs: dict[str, Any] = {"name": name}
    if model:
        kwargs["model"] = model
    return await callable_rlm(prompt, **kwargs)


async def _rlm_list_subagents() -> list[Any]:
    module = importlib.import_module("rlm")
    callable_rlm = getattr(module, "rlm", module)
    return list(await callable_rlm.list_subagents())


async def _rlm_delete_subagent(target: str) -> None:
    module = importlib.import_module("rlm")
    callable_rlm = getattr(module, "rlm", module)
    await callable_rlm.delete_subagent(target)


async def _notify_parent(message: str) -> None:
    try:
        module = importlib.import_module("agent_message")
        await module.send(message, receiver_role="parent")
    except Exception:
        return


def _handle_dict(handle: Any) -> dict[str, Any]:
    value = _jsonable(handle)
    if not isinstance(value, dict):
        value = {
            name: _jsonable(getattr(handle, name, None))
            for name in ("rlm_child_id", "name", "session_name", "session_dir", "model", "status")
        }
    return value


def _child_dict(child: Any) -> dict[str, Any]:
    value = _handle_dict(child)
    return {
        "rlm_child_id": value.get("rlm_child_id"),
        "name": value.get("session_name") or value.get("name"),
        "status": value.get("status"),
    }


def _new_mission_id(brief: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", brief.lower()).strip("-")[:28] or "mission"
    return f"{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}-{slug}-{secrets.token_hex(3)}"


def _bounded_prompt_text(value: Any, limit: int, label: str) -> str:
    text = value if isinstance(value, str) else json.dumps(_jsonable(value), indent=2, sort_keys=True)
    if len(text) <= limit:
        return text
    omitted = len(text) - limit
    return f"{text[:limit]}\n... [{label} truncated; {omitted} characters omitted, inspect declared workspace artifacts if needed]"


def _task_prompt(mission: dict[str, Any], task: dict[str, Any], attempt_id: str) -> str:
    task_spec = {
        key: value
        for key, value in task.items()
        if key not in {"status", "attempts", "latest_verdicts", "last_report"}
    }
    assertion_policies = {
        target: {
            key: value
            for key, value in mission["assertions"][target].items()
            if key not in {"status", "evidence", "accepted_risk"}
        }
        for target in task["targets"]
    }
    prior_attempts = []
    for attempt in task.get("attempts", [])[-3:]:
        result = attempt.get("result")
        prior_attempts.append(
            {
                "id": attempt.get("id"),
                "status": attempt.get("status"),
                "error": attempt.get("error"),
                "report": (
                    _bounded_prompt_text(result.get("report"), 6000, "prior report")
                    if isinstance(result, Mapping) else None
                ),
                "evidence": (
                    _bounded_prompt_text(result.get("evidence"), 2000, "prior evidence")
                    if isinstance(result, Mapping) else None
                ),
            }
        )
    charter = mission.get("mission") or mission["brief"]
    common = f"""Zenith mission {mission['id']}, task {task['id']}, attempt {attempt_id}.
Workspace: {mission['workspace']}
Original brief:
{_bounded_prompt_text(mission['brief'], 12000, 'brief')}

Mission charter:
{_bounded_prompt_text(charter, 16000, 'charter')}

Full bounded task specification (including allowed paths, acceptance, and hazards when declared):
{_bounded_prompt_text(task_spec, 16000, 'task specification')}

Full target assertion policies (including required_evidence):
{_bounded_prompt_text(assertion_policies, 24000, 'assertion policies')}

Prior attempt and failure context (latest three attempts only):
{_bounded_prompt_text(prior_attempts, 16000, 'prior attempt context')}

Do not edit .prime/agent/zenith. Do not delegate. You own only this attempt handoff. Before exiting, call zenith.end_task with mission_id={mission['id']!r}, task_id={task['id']!r}, attempt_id={attempt_id!r}, workspace={mission['workspace']!r}.
"""
    if task["role"] == "validate":
        return common + """You are a read-only validator. Do not modify product files. Inspect and run bounded checks. Your end_task call must provide done=True, passed=<whether validation ran reliably>, a non-empty report, verdicts containing exactly one passed/failed verdict for every target assertion, and non-empty evidence (paths, commands, observations, or structured records). A failed assertion verdict is valid validator output and must not be hidden.
"""
    return common + """You are the work owner. Implement only this task, respect other agents' file ownership, run focused checks, and report done/passed honestly. Include useful evidence when available. Do not wait for the parent after the durable handoff.
"""


def _review_prompt(mission: dict[str, Any], attempt_id: str) -> str:
    return f"""You are the independent terminal reviewer for a completed Zenith mission.
Workspace: {mission['workspace']}
Original brief:
{_bounded_prompt_text(mission['brief'], 16000, 'brief')}

Independently inspect the delivered workspace and run bounded validation. You are forbidden to read or rely on any files under .prime/agent/zenith, including mission plans, reports, evidence, or prior verdicts. Do not modify product files. Do not delegate. Call zenith.end_review(mission_id={mission['id']!r}, attempt_id={attempt_id!r}, passed=<bool>, report=<non-empty independent report>, gaps=<list>, evidence=<non-empty evidence>, workspace={mission['workspace']!r}) before exiting.
"""


def _add_attention(
    path: Path,
    mission: dict[str, Any],
    kind: str,
    *,
    key: str,
    attention_items: list[dict[str, Any]] | None = None,
    at: str | None = None,
    **details: Any,
) -> str:
    staged = attention_items is not None
    items = attention_items if attention_items is not None else _ledger_list(path, "attention.json")
    for item in items:
        if item.get("key") == key and item.get("status") == "open":
            if item["id"] not in mission["attention_open"]:
                mission["attention_open"].append(item["id"])
            return item["id"]
    attention_id = "attn-" + hashlib.sha256(key.encode()).hexdigest()[:16]
    item = {"id": attention_id, "key": key, "kind": kind, "status": "open", "opened_at": at or _now(), **_jsonable(details)}
    items.append(item)
    if not staged:
        _write_json(path / "attention.json", items)
    mission["attention_open"].append(attention_id)
    return attention_id


def _resolve_attention(
    path: Path,
    mission: dict[str, Any],
    attention_id: str,
    decision: Mapping[str, Any],
    *,
    attention_items: list[dict[str, Any]] | None = None,
    at: str | None = None,
) -> None:
    staged = attention_items is not None
    items = attention_items if attention_items is not None else _ledger_list(path, "attention.json")
    found = False
    for item in items:
        if item.get("id") == attention_id and item.get("status") == "open":
            item["status"] = "resolved"
            item["resolved_at"] = at or _now()
            item["decision"] = _jsonable(decision)
            found = True
            break
    if not found:
        raise ZenithError(f"attention item is not open: {attention_id}")
    if not staged:
        _write_json(path / "attention.json", items)
    mission["attention_open"] = [item for item in mission["attention_open"] if item != attention_id]


async def start(
    brief: str,
    workspace: str = ".",
    concurrency: int | str = 3,
    min_concurrency: int = 1,
    max_concurrency: int | None = None,
    model: str | None = None,
    validator_model: str | None = None,
    reviewer_model: str | None = None,
    persistent: bool = False,
    heartbeat_interval: str = "5m",
    require_preflight: bool = True,
    create_goal: bool = False,
) -> dict[str, Any]:
    if not isinstance(brief, str) or not brief.strip():
        raise ZenithError("brief must be a non-empty string")
    concurrency_policy = _normalise_concurrency_policy(
        concurrency, min_concurrency=min_concurrency, max_concurrency=max_concurrency
    )
    if not isinstance(persistent, bool):
        raise ZenithError("persistent must be a boolean")
    if not isinstance(require_preflight, bool):
        raise ZenithError("require_preflight must be a boolean")
    if not isinstance(create_goal, bool):
        raise ZenithError("create_goal must be a boolean")
    if not isinstance(heartbeat_interval, str) or not heartbeat_interval.strip():
        raise ZenithError("heartbeat_interval must be a non-empty string")
    for label, value in (("model", model), ("validator_model", validator_model), ("reviewer_model", reviewer_model)):
        if value is not None and (not isinstance(value, str) or not value.strip()):
            raise ZenithError(f"{label} must be a non-empty string or None")
    root = _missions_root(workspace)
    root.mkdir(parents=True, exist_ok=True)
    if _missions_root(workspace).resolve() != root.resolve():
        raise ZenithError("Zenith mission root changed while it was being created")
    mission_id = _new_mission_id(brief)
    path = root / mission_id
    os.mkdir(path, 0o700)
    os.chmod(path, 0o700, follow_symlinks=False)
    for directory in ("contract", "attempts", "evidence", "terminal-reviews"):
        os.mkdir(path / directory, 0o700)
        os.chmod(path / directory, 0o700, follow_symlinks=False)
    lock_fd = os.open(path / ".lock", os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_CLOEXEC | os.O_NOFOLLOW, 0o600)
    try:
        os.fchmod(lock_fd, 0o600)
        _fsync_fd(lock_fd)
    finally:
        os.close(lock_fd)
    now = _now()
    mission: dict[str, Any] = {
        "schema_version": _SCHEMA_VERSION,
        "id": mission_id,
        "workspace": str(_workspace(workspace)),
        "brief": brief.strip(),
        "state": "planning",
        "concurrency": concurrency_policy["effective"],
        "concurrency_policy": concurrency_policy,
        "models": {"work": model, "validator": validator_model or model, "reviewer": reviewer_model or validator_model or model},
        "persistent": bool(persistent),
        "heartbeat_interval": heartbeat_interval,
        "require_preflight": require_preflight,
        "preflight": {"accepted": None},
        "created_at": now,
        "updated_at": now,
        "revision": 0,
        "tasks": {},
        "assertions": {},
        "attention_open": [],
        "review": {"status": "pending", "attempts": []},
        "continuity": {"goal_owned": False, "heartbeat_id": None, "warnings": [], "finalized": False},
    }
    _write_text(path / "brief.md", f"# Original brief\n\n{brief.strip()}\n")
    for filename in ("attention.json", "decisions.json", "events.json"):
        _write_json(path / filename, [])
    _save_mission(path, mission)
    _event(
        path, "mission_started", persistent=bool(persistent), require_preflight=require_preflight,
        concurrency_policy=concurrency_policy,
    )
    if persistent:
        await ensure_continuity(
            mission_id,
            workspace=str(_workspace(workspace)),
            heartbeat_interval=heartbeat_interval,
            create_goal=create_goal,
        )
        with _FileLock(path / ".lock"):
            mission = _load_mission(path)
    return _envelope("start", mission, path=str(path), brief_path=str(path / "brief.md"), mission_path=str(path / "mission.json"))


def _preflight_results(path: Path, mission_id: str) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    reviews_root = path / "terminal-reviews"
    if not reviews_root.exists():
        return results
    for result_path in reviews_root.glob("*/result.json"):
        if result_path.is_symlink() or result_path.parent.is_symlink():
            raise ZenithError(f"preflight result path must not be a symlink: {result_path}")
        raw = _require_mapping(_read_json(result_path), f"preflight result {result_path}")
        if raw.get("phase") != "preflight":
            continue
        attempt_id = _valid_id(raw.get("attempt_id"), "preflight attempt_id")
        if attempt_id != result_path.parent.name:
            raise ZenithError(f"preflight result identity does not match its path: {result_path}")
        value = _validate_persisted_review_result(raw, mission_id, attempt_id, "preflight")
        results.append({**value, "result_path": str(result_path), "mtime_ns": result_path.stat().st_mtime_ns})
    def preflight_order(item: Mapping[str, Any]) -> tuple[Any, ...]:
        suffix = re.search(r"(\d+)$", item["attempt_id"])
        sequence = int(suffix.group(1)) if suffix else -1
        return (item["submitted_at"], sequence, item["mtime_ns"], item["attempt_id"])

    results.sort(key=preflight_order)
    return results


def submit_plan(
    mission_id: str,
    contract: Any,
    tasks: Any,
    workspace: str = ".",
    mission: str = "",
) -> dict[str, Any]:
    path = _mission_dir(mission_id, workspace)
    if not isinstance(mission, str):
        raise ZenithError("mission charter must be a string")
    clean_contract, clean_tasks = _validate_plan(contract, tasks)
    with _FileLock(path / ".lock"):
        ledger = _load_mission(path)
        if ledger["state"] != "planning":
            existing_contract = _read_json(path / "contract.json") if (path / "contract.json").exists() else None
            existing_plan = _read_json(path / "plan.json") if (path / "plan.json").exists() else None
            if existing_contract == clean_contract and existing_plan == {"tasks": clean_tasks, "mission": mission}:
                return _envelope("submit_plan", ledger, idempotent=True)
            raise ZenithError(f"mission {mission_id} cannot accept a plan while state is {ledger['state']}")
        policy = _ensure_concurrency_policy(ledger)
        _validate_task_capacity(clean_tasks, policy["maximum"])
        preflight_summary: dict[str, Any]
        if ledger.get("require_preflight", True):
            preflights = _preflight_results(path, mission_id)
            if not preflights:
                raise ZenithError("submit_plan requires at least one passing preflight review; none were found")
            latest = preflights[-1]
            if not latest["passed"]:
                raise ZenithError(f"latest preflight review {latest['attempt_id']} did not pass")
            preflight_summary = {
                "attempt_id": latest["attempt_id"],
                "passed": True,
                "report": latest["report"],
                "evidence": latest["evidence"],
                "submitted_at": latest["submitted_at"],
                "result_path": latest["result_path"],
                "accepted_at": _now(),
            }
        else:
            preflight_summary = {"required": False, "accepted_at": _now()}
        _write_json(path / "contract.json", clean_contract)
        _write_json(path / "plan.json", {"mission": mission, "tasks": clean_tasks})
        for assertion in clean_contract["assertions"]:
            _write_text(path / "contract" / f"{assertion['id']}.md", f"# {assertion['id']}\n\n{assertion['description']}\n")
        ledger["preflight"] = {"accepted": preflight_summary}
        ledger["mission"] = mission.strip()
        ledger["assertions"] = {
            assertion["id"]: {**assertion, "status": "pending", "evidence": [], "accepted_risk": None}
            for assertion in clean_contract["assertions"]
        }
        ledger["tasks"] = {
            task["id"]: {**task, "status": "pending", "attempts": [], "latest_verdicts": {}}
            for task in clean_tasks
        }
        ledger["state"] = "running"
        _event(
            path,
            "plan_submitted",
            task_count=len(clean_tasks),
            assertion_count=len(clean_contract["assertions"]),
            preflight_attempt=preflight_summary.get("attempt_id"),
        )
        _save_mission(path, ledger)
    return _envelope("submit_plan", ledger, task_count=len(clean_tasks), assertion_count=len(clean_contract["assertions"]))



def list_missions(workspace: str = ".") -> dict[str, Any]:
    root = _missions_root(workspace)
    missions: list[dict[str, Any]] = []
    if root.exists():
        for path in sorted(root.iterdir()):
            if path.is_symlink():
                missions.append({"mission_id": path.name, "state": "corrupt", "error": f"Zenith mission directory must not be a symlink: {path}"})
                continue
            if not path.is_dir() or not (path / "mission.json").exists():
                continue
            try:
                with _FileLock(path / ".lock"):
                    mission = _load_mission(path)
                    missions.append({
                        "mission_id": mission["id"], "state": mission["state"], "brief": mission["brief"],
                        "created_at": mission["created_at"], "updated_at": mission["updated_at"], "revision": mission["revision"],
                    })
            except ZenithError as exc:
                missions.append({"mission_id": path.name, "state": "corrupt", "error": str(exc)})
    missions.sort(key=lambda item: (item.get("updated_at", ""), item["mission_id"]), reverse=True)
    return _envelope("list_missions", workspace=str(_workspace(workspace)), missions=missions)


def inspect(mission_id: str = "", workspace: str = ".") -> dict[str, Any]:
    if not mission_id:
        listing = list_missions(workspace)["missions"]
        healthy = [item for item in listing if item.get("state") != "corrupt"]
        if not healthy:
            raise ZenithError(f"no Zenith missions found under {_missions_root(workspace)}")
        mission_id = healthy[0]["mission_id"]
    path = _mission_dir(mission_id, workspace)
    with _FileLock(path / ".lock"):
        mission = _load_mission(path)
        attention = [item for item in _ledger_list(path, "attention.json") if item.get("status") == "open"]
    return _envelope("inspect", mission, mission=mission, attention=attention, path=str(path))


def _normalise_verdicts(verdicts: Any, targets: Sequence[str]) -> dict[str, str]:
    if isinstance(verdicts, Mapping):
        raw = dict(verdicts)
    elif isinstance(verdicts, Sequence) and not isinstance(verdicts, (str, bytes)):
        raw = {}
        for index, item in enumerate(verdicts):
            entry = _require_mapping(item, f"verdicts[{index}]")
            target = entry.get("target", entry.get("assertion_id"))
            raw[target] = entry.get("verdict", entry.get("status", entry.get("passed")))
    else:
        raise ZenithError("validator verdicts must be an object or list")
    if set(raw) != set(targets):
        raise ZenithError(f"validator verdicts must cover exactly {sorted(targets)}; got {sorted(str(key) for key in raw)}")
    result: dict[str, str] = {}
    for target, value in raw.items():
        if isinstance(value, Mapping):
            value = value.get("verdict", value.get("status", value.get("passed")))
        if value is True or value == "pass" or value == "passed":
            result[str(target)] = "passed"
        elif value is False or value == "fail" or value == "failed":
            result[str(target)] = "failed"
        else:
            raise ZenithError(f"verdict for {target} must be passed or failed")
    return result


def _nonempty(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, bytes):
        return bool(value.strip())
    if isinstance(value, Mapping):
        return bool(value) and any(_nonempty(item) for item in value.values())
    if isinstance(value, (Sequence, set)):
        return bool(value) and any(_nonempty(item) for item in value)
    return True


def _normalise_gaps(value: Any, label: str) -> list[Any]:
    if value is None:
        return []
    if not isinstance(value, Sequence) or isinstance(value, (str, bytes)):
        raise ZenithError(f"{label} must be a list")
    return list(value)


def _validate_persisted_task_result(
    value: Any,
    mission_id: str,
    task: Mapping[str, Any],
    attempt_id: str,
) -> dict[str, Any]:
    result = _require_mapping(value, f"task result {task['id']}/{attempt_id}")
    expected_identity = {
        "schema_version": _SCHEMA_VERSION,
        "mission_id": mission_id,
        "task_id": task["id"],
        "attempt_id": attempt_id,
        "role": task["role"],
    }
    for field, expected in expected_identity.items():
        if result.get(field) != expected:
            raise ZenithError(f"task result {task['id']}/{attempt_id} has invalid {field}")
    for field in ("done", "passed", "request_attention"):
        if not isinstance(result.get(field), bool):
            raise ZenithError(f"task result {task['id']}/{attempt_id} requires boolean {field}")
    if not isinstance(result.get("report"), str) or not result["report"].strip():
        raise ZenithError(f"task result {task['id']}/{attempt_id} requires a nonblank report")
    if not isinstance(result.get("submitted_at"), str) or not result["submitted_at"].strip():
        raise ZenithError(f"task result {task['id']}/{attempt_id} requires submitted_at")
    if task["role"] == "validate":
        result["verdicts"] = _normalise_verdicts(result.get("verdicts"), task["targets"])
        if not _nonempty(result.get("evidence")):
            raise ZenithError(f"validator result {task['id']}/{attempt_id} requires non-empty evidence")
    elif result.get("verdicts") is not None:
        raise ZenithError(f"work result {task['id']}/{attempt_id} must not contain verdicts")
    return result


def _validate_persisted_review_result(
    value: Any,
    mission_id: str,
    attempt_id: str,
    phase: str,
) -> dict[str, Any]:
    result = _require_mapping(value, f"{phase} review result {attempt_id}")
    expected_identity = {
        "schema_version": _SCHEMA_VERSION,
        "mission_id": mission_id,
        "attempt_id": attempt_id,
        "phase": phase,
    }
    for field, expected in expected_identity.items():
        if result.get(field) != expected:
            raise ZenithError(f"{phase} review result {attempt_id} has invalid {field}")
    if not isinstance(result.get("passed"), bool):
        raise ZenithError(f"{phase} review result {attempt_id} requires boolean passed")
    if not isinstance(result.get("report"), str) or not result["report"].strip():
        raise ZenithError(f"{phase} review result {attempt_id} requires a nonblank report")
    if not _nonempty(result.get("evidence")):
        raise ZenithError(f"{phase} review result {attempt_id} requires non-empty evidence")
    result["gaps"] = _normalise_gaps(result.get("gaps"), f"{phase} review gaps")
    if not result["passed"] and not _nonempty(result["gaps"]):
        raise ZenithError(f"failed {phase} review result {attempt_id} requires at least one gap")
    if not isinstance(result.get("submitted_at"), str) or not result["submitted_at"].strip():
        raise ZenithError(f"{phase} review result {attempt_id} requires submitted_at")
    return result


async def end_task(
    mission_id: str,
    task_id: str,
    attempt_id: str,
    done: bool,
    passed: bool,
    report: str,
    verdicts: Any = None,
    evidence: Any = None,
    request_attention: bool = False,
    workspace: str = ".",
) -> dict[str, Any]:
    path = _mission_dir(mission_id, workspace)
    _valid_id(task_id, "task_id")
    _valid_id(attempt_id, "attempt_id")
    if not isinstance(done, bool) or not isinstance(passed, bool):
        raise ZenithError("done and passed must be booleans")
    if not isinstance(request_attention, bool):
        raise ZenithError("request_attention must be a boolean")
    if not isinstance(report, str) or not report.strip():
        raise ZenithError("report must be a non-empty string")
    with _FileLock(path / ".lock"):
        mission = _load_mission(path)
        if mission["state"] in {"done", "aborted"}:
            raise ZenithError(f"mission {mission_id} is already {mission['state']}")
        task = mission["tasks"].get(task_id)
        if task is None:
            raise ZenithError(f"unknown task_id {task_id!r} in mission {mission_id}")
        attempt = next((item for item in task["attempts"] if item["id"] == attempt_id), None)
        if attempt is None:
            raise ZenithError(f"unknown attempt_id {attempt_id!r} for task {task_id}")
        clean_verdicts: dict[str, str] | None = None
        if task["role"] == "validate":
            clean_verdicts = _normalise_verdicts(verdicts, task["targets"])
            if not _nonempty(evidence):
                raise ZenithError(f"validator task {task_id} requires non-empty evidence")
        elif verdicts is not None:
            raise ZenithError(f"work task {task_id} must not submit assertion verdicts")
        result = {
            "schema_version": _SCHEMA_VERSION, "mission_id": mission_id, "task_id": task_id,
            "attempt_id": attempt_id, "role": task["role"], "done": done, "passed": passed,
            "report": report.strip(), "verdicts": clean_verdicts, "evidence": _jsonable(evidence),
            "request_attention": bool(request_attention), "submitted_at": _now(),
        }
        result_path = path / "attempts" / task_id / attempt_id / "result.json"
        if result_path.exists():
            existing = _read_json(result_path)
            comparable = dict(result); comparable.pop("submitted_at", None)
            existing_comparable = dict(existing); existing_comparable.pop("submitted_at", None)
            if existing_comparable != comparable:
                raise ZenithError(f"attempt result already exists with different content: {result_path}")
            envelope = _envelope("end_task", mission, task_id=task_id, attempt_id=attempt_id, idempotent=True)
        else:
            _write_json(result_path, result)
            envelope = _envelope("end_task", mission, task_id=task_id, attempt_id=attempt_id, result_path=str(result_path))
    await _notify_parent(f"Zenith mission {mission_id}: task {task_id} attempt {attempt_id} handed off; call zenith.advance.")
    return envelope


async def end_review(
    mission_id: str,
    attempt_id: str,
    passed: bool,
    report: str,
    gaps: Any = None,
    evidence: Any = None,
    workspace: str = ".",
) -> dict[str, Any]:
    path = _mission_dir(mission_id, workspace)
    _valid_id(attempt_id, "attempt_id")
    if not isinstance(passed, bool):
        raise ZenithError("passed must be a boolean")
    if not isinstance(report, str) or not report.strip():
        raise ZenithError("review report must be a non-empty string")
    if not _nonempty(evidence):
        raise ZenithError("review requires non-empty independent evidence")
    clean_gaps = _normalise_gaps(gaps, "review gaps")
    if not passed and not _nonempty(clean_gaps):
        raise ZenithError("a failed review requires at least one explicit gap")
    with _FileLock(path / ".lock"):
        mission = _load_mission(path)
        attempt = next((item for item in mission["review"]["attempts"] if item["id"] == attempt_id), None)
        preflight = attempt is None and mission["state"] == "planning"
        if attempt is None and not preflight:
            raise ZenithError(f"unknown terminal review attempt {attempt_id!r}")
        result = {"schema_version": _SCHEMA_VERSION, "mission_id": mission_id, "attempt_id": attempt_id,
                  "phase": "preflight" if preflight else "terminal", "passed": passed,
                  "report": report.strip(), "gaps": _jsonable(clean_gaps),
                  "evidence": _jsonable(evidence), "submitted_at": _now()}
        result_path = path / "terminal-reviews" / attempt_id / "result.json"
        if result_path.exists():
            existing = _read_json(result_path)
            left = dict(existing); left.pop("submitted_at", None)
            right = dict(result); right.pop("submitted_at", None)
            if left != right:
                raise ZenithError(f"terminal review result already exists with different content: {result_path}")
            envelope = _envelope("end_review", mission, attempt_id=attempt_id, idempotent=True)
        else:
            _write_json(result_path, result)
            envelope = _envelope("end_review", mission, attempt_id=attempt_id, result_path=str(result_path))
    if preflight:
        await _notify_parent(f"Zenith mission {mission_id}: preflight review {attempt_id} handed off; inspect the review result, revise as needed, then call zenith.submit_plan.")
    else:
        await _notify_parent(f"Zenith mission {mission_id}: terminal review {attempt_id} handed off; call zenith.advance.")
    return envelope


def _child_registry(children: Sequence[Any] | None) -> dict[str, dict[str, Any]] | None:
    if children is None:
        return None
    result: dict[str, dict[str, Any]] = {}
    for child in children:
        item = _child_dict(child)
        if item.get("rlm_child_id"):
            result[str(item["rlm_child_id"])] = item
    return result


def _evaluate(
    path: Path,
    mission: dict[str, Any],
    attention_items: list[dict[str, Any]] | None = None,
    *,
    at: str | None = None,
) -> None:
    for gate in sorted((task for task in mission["tasks"].values() if task["role"] == "gate" and task["status"] != "superseded"), key=lambda item: item["id"]):
        if gate["status"] in {"cleared", "failed"}:
            continue
        dependencies = [mission["tasks"][item] for item in gate["depends_on"]]
        if any(item["status"] == "failed" for item in dependencies):
            gate["status"] = "failed"
        elif all(item["status"] in _TERMINAL_TASK for item in dependencies):
            passed = True
            for target in gate["targets"]:
                if mission["assertions"][target].get("accepted_risk"):
                    continue
                validators = [item for item in mission["tasks"].values() if item["role"] == "validate" and target in item["targets"] and item["status"] != "superseded"]
                if not validators or any(item.get("latest_verdicts", {}).get(target) != "passed" for item in validators):
                    passed = False
            gate["status"] = "cleared" if passed else "failed"
        if gate["status"] == "failed":
            _add_attention(path, mission, "gate_failed", key=f"gate:{gate['id']}:failed", attention_items=attention_items, at=at, task_id=gate["id"], targets=gate["targets"])

    for assertion_id, assertion in mission["assertions"].items():
        if assertion.get("accepted_risk"):
            assertion["status"] = "accepted_risk"
            continue
        owners = [item for item in mission["tasks"].values() if item["role"] == "work" and assertion_id in item["targets"] and item["status"] != "superseded"]
        validators = [item for item in mission["tasks"].values() if item["role"] == "validate" and assertion_id in item["targets"] and item["status"] != "superseded"]
        gates = [item for item in mission["tasks"].values() if item["role"] == "gate" and assertion_id in item["targets"] and item["status"] != "superseded"]
        if any(item["status"] == "failed" for item in owners + validators + gates) or any(item.get("latest_verdicts", {}).get(assertion_id) == "failed" for item in validators):
            assertion["status"] = "failed"
            _add_attention(path, mission, "assertion_failed", key=f"assertion:{assertion_id}:failed", attention_items=attention_items, at=at, assertion_id=assertion_id)
        elif owners and all(item["status"] == "cleared" for item in owners) and validators and all(item["status"] == "cleared" and item.get("latest_verdicts", {}).get(assertion_id) == "passed" for item in validators) and gates and all(item["status"] == "cleared" for item in gates):
            assertion["status"] = "passed"
        else:
            assertion["status"] = "pending"


def _reconcile(path: Path, mission: dict[str, Any], children: Sequence[Any] | None) -> tuple[list[str], int]:
    registry = _child_registry(children)
    deletable: list[str] = []
    ingested = 0
    for task in mission["tasks"].values():
        if task["role"] == "gate" or not task["attempts"]:
            continue
        attempt = task["attempts"][-1]
        child_id = (attempt.get("handle") or {}).get("rlm_child_id")
        child = registry.get(child_id) if registry is not None and child_id else None
        if attempt.get("ingested"):
            if child is not None and child.get("status") in {"completed", "error"} and child_id:
                deletable.append(str(child_id))
            continue
        result_path = path / "attempts" / task["id"] / attempt["id"] / "result.json"
        if result_path.exists():
            try:
                if result_path.is_symlink() or result_path.parent.is_symlink():
                    raise ZenithError(f"task result path must not be a symlink: {result_path}")
                result = _validate_persisted_task_result(
                    _read_json(result_path), mission["id"], task, attempt["id"]
                )
            except ZenithError as exc:
                attempt.update({"ingested": True, "status": "error", "result_error": str(exc)})
                task["status"] = "failed"
                _add_attention(
                    path, mission, "invalid_task_result",
                    key=f"task:{task['id']}:{attempt['id']}:invalid-result",
                    task_id=task["id"], attempt_id=attempt["id"], error=str(exc), targets=task["targets"],
                )
                if child is not None and child.get("status") in {"completed", "error"} and child_id:
                    deletable.append(str(child_id))
                ingested += 1
                _event(path, "task_result_rejected", task_id=task["id"], attempt_id=attempt["id"], error=str(exc))
                continue
            attempt["ingested"] = True
            attempt["result"] = result
            task["last_report"] = result["report"]
            if task["role"] == "validate":
                task["latest_verdicts"] = result["verdicts"]
                for target in task["targets"]:
                    mission["assertions"][target]["evidence"].append({"task_id": task["id"], "attempt_id": attempt["id"], "evidence": result["evidence"]})
                _write_json(path / "evidence" / task["id"] / f"{attempt['id']}.json", result["evidence"])
            if result["done"] and result["passed"]:
                task["status"] = "cleared"
                attempt["status"] = "cleared"
            else:
                task["status"] = "failed"
                attempt["status"] = "failed"
                _add_attention(path, mission, "task_failed", key=f"task:{task['id']}:{attempt['id']}:failed", task_id=task["id"], attempt_id=attempt["id"], report=result["report"], targets=task["targets"])
            if result.get("request_attention"):
                _add_attention(path, mission, "task_requested_attention", key=f"task:{task['id']}:{attempt['id']}:requested", task_id=task["id"], attempt_id=attempt["id"], report=result["report"], targets=task["targets"])
            if child is not None and child.get("status") in {"completed", "error"} and child_id:
                deletable.append(str(child_id))
            ingested += 1
            _event(path, "task_result_ingested", task_id=task["id"], attempt_id=attempt["id"], status=task["status"])
            continue
        if task["status"] not in {"dispatching", "running"} or registry is None:
            continue
        if not child_id:
            # A dispatching attempt with no handle is a valid admission reservation.
            # Another advance may observe it while the reserving tick awaits rlm().
            # Only admission failure/abort may resolve that reservation.
            if task["status"] == "dispatching" and attempt.get("status") == "dispatching":
                continue
            _add_attention(path, mission, "missing_handoff", key=f"task:{task['id']}:{attempt['id']}:no-handle", task_id=task["id"], attempt_id=attempt["id"])
        elif child is None:
            _add_attention(path, mission, "orphaned_child", key=f"task:{task['id']}:{attempt['id']}:orphan", task_id=task["id"], attempt_id=attempt["id"], child_id=child_id)
        elif child.get("status") in {"completed", "error"}:
            _add_attention(path, mission, "missing_handoff" if child["status"] == "completed" else "child_error", key=f"task:{task['id']}:{attempt['id']}:{child['status']}", task_id=task["id"], attempt_id=attempt["id"], child_id=child_id)
    _evaluate(path, mission)
    return deletable, ingested



def _reconcile_review(path: Path, mission: dict[str, Any], children: Sequence[Any] | None) -> tuple[list[str], int]:
    if mission["state"] not in {"reviewing", "done"} or not mission["review"]["attempts"]:
        return [], 0
    attempt = mission["review"]["attempts"][-1]
    registry = _child_registry(children)
    child_id = (attempt.get("handle") or {}).get("rlm_child_id")
    child = registry.get(child_id) if registry is not None and child_id else None
    if attempt.get("ingested"):
        deletable = [str(child_id)] if child is not None and child.get("status") in {"completed", "error"} and child_id else []
        return deletable, 0
    result_path = path / "terminal-reviews" / attempt["id"] / "result.json"
    if result_path.exists():
        try:
            if result_path.is_symlink() or result_path.parent.is_symlink():
                raise ZenithError(f"terminal review result path must not be a symlink: {result_path}")
            result = _validate_persisted_review_result(
                _read_json(result_path), mission["id"], attempt["id"], "terminal"
            )
        except ZenithError as exc:
            attempt.update({"ingested": True, "status": "error", "result_error": str(exc)})
            mission["review"]["status"] = "failed"
            mission["state"] = "attention_needed"
            _add_attention(
                path, mission, "invalid_terminal_review_result",
                key=f"review:{attempt['id']}:invalid-result", attempt_id=attempt["id"], error=str(exc),
            )
            _event(path, "terminal_review_result_rejected", attempt_id=attempt["id"], error=str(exc))
            deletable = [str(child_id)] if child is not None and child.get("status") in {"completed", "error"} and child_id else []
            return deletable, 1
        attempt.update({"ingested": True, "result": result, "status": "cleared" if result["passed"] else "failed"})
        mission["review"]["status"] = attempt["status"]
        if result["passed"]:
            mission["state"] = "done"
            _event(path, "terminal_review_passed", attempt_id=attempt["id"])
        else:
            _add_attention(path, mission, "terminal_review_failed", key=f"review:{attempt['id']}:failed", attempt_id=attempt["id"], report=result["report"], gaps=result.get("gaps", []))
            mission["state"] = "attention_needed"
            _event(path, "terminal_review_failed", attempt_id=attempt["id"])
        deletable = [str(child_id)] if child is not None and child.get("status") in {"completed", "error"} and child_id else []
        return deletable, 1
    if registry is not None:
        if not child_id:
            _add_attention(path, mission, "missing_review_handoff", key=f"review:{attempt['id']}:no-handle", attempt_id=attempt["id"])
            mission["state"] = "attention_needed"
        elif child is None:
            _add_attention(path, mission, "orphaned_review", key=f"review:{attempt['id']}:orphan", attempt_id=attempt["id"], child_id=child_id)
            mission["state"] = "attention_needed"
        elif child.get("status") in {"completed", "error"}:
            _add_attention(path, mission, "missing_review_handoff" if child["status"] == "completed" else "review_child_error", key=f"review:{attempt['id']}:{child['status']}", attempt_id=attempt["id"], child_id=child_id)
            mission["state"] = "attention_needed"
    return [], 0


def _ready_tasks(mission: dict[str, Any]) -> list[dict[str, Any]]:
    result = []
    for task in mission["tasks"].values():
        if task["role"] == "gate" or task["status"] != "pending":
            continue
        if all(mission["tasks"][dependency]["status"] in _TERMINAL_TASK for dependency in task["depends_on"]):
            result.append(task)
    return sorted(result, key=lambda item: (-int(item.get("priority", 0)), item["id"]))


def _effective_concurrency(mission: dict[str, Any], ready: Sequence[Mapping[str, Any]]) -> int:
    policy = _ensure_concurrency_policy(mission)
    active = _active_tasks(mission)
    active_cost = sum(_task_cost(task) for task in active)
    if policy["mode"] == "fixed":
        effective = policy["maximum"]
    else:
        ready_demand = sum(_task_cost(task) for task in ready)
        if active or ready:
            effective = min(policy["maximum"], max(policy["minimum"], active_cost + ready_demand))
        else:
            effective = policy["minimum"]
    policy.update({
        "effective": effective,
        "active_cost": active_cost,
        "scale_down_pending": active_cost > effective,
        "last_evaluated_at": _now(),
    })
    mission["concurrency"] = effective
    return effective


def _select_ready_tasks(
    ready: Sequence[dict[str, Any]], active: Sequence[dict[str, Any]], capacity: int
) -> list[dict[str, Any]]:
    if capacity <= 0 or any(bool(task.get("exclusive")) for task in active):
        return []
    # Any ready exclusive task is a global drain barrier, regardless of its
    # relative priority. Otherwise a stream of ordinary work can starve it.
    exclusive_ready = [task for task in ready if task.get("exclusive")]
    if exclusive_ready:
        if active:
            return []
        candidate = exclusive_ready[0]
        return [candidate] if _task_cost(candidate) <= capacity else []
    selected: list[dict[str, Any]] = []
    remaining = capacity
    for task in ready:
        cost = _task_cost(task)
        if cost <= remaining:
            selected.append(task)
            remaining -= cost
    return selected


def _update_state(path: Path, mission: dict[str, Any]) -> None:
    if mission["state"] in {"done", "aborted", "reviewing", "planning"}:
        return
    if mission["attention_open"]:
        mission["state"] = "attention_needed"
        return
    active = [task for task in mission["tasks"].values() if task["status"] != "superseded"]
    if active and all(task["status"] == "cleared" for task in active) and all(assertion["status"] in {"passed", "accepted_risk"} and assertion["evidence"] for assertion in mission["assertions"].values()):
        mission["state"] = "ready_for_review"
    else:
        mission["state"] = "running"


def _active_task_reservation(mission: dict[str, Any], task_id: str, attempt_id: str) -> bool:
    if mission["state"] in {"planning", "reviewing", "done", "aborted"}:
        return False
    task = mission["tasks"].get(task_id)
    if task is None or task.get("status") != "dispatching" or not task.get("attempts"):
        return False
    attempt = task["attempts"][-1]
    return attempt.get("id") == attempt_id and attempt.get("status") == "dispatching"


async def advance(mission_id: str, workspace: str = ".", dispatch: bool = True) -> dict[str, Any]:
    if not isinstance(dispatch, bool):
        raise ZenithError("dispatch must be a boolean")
    path = _mission_dir(mission_id, workspace)
    children: list[Any] | None
    registry_warning: str | None = None
    try:
        children = await _rlm_list_subagents()
    except Exception as exc:
        children = None
        registry_warning = f"could not list Prime children: {exc}"

    reservations: list[tuple[str, str, str, str | None]] = []
    deletable: list[str] = []
    ingested = 0
    with _FileLock(path / ".lock"):
        mission = _load_mission(path)
        if mission["state"] == "aborted":
            return _envelope("advance", mission, dispatched=[], ingested=0)
        if mission["state"] == "planning":
            return _envelope("advance", mission, dispatched=[], ingested=0, warning="planning is root-owned; investigate and call submit_plan")
        deletable, ingested = _reconcile(path, mission, children)
        review_deletable, review_ingested = _reconcile_review(path, mission, children)
        deletable.extend(review_deletable)
        ingested += review_ingested
        _update_state(path, mission)
        ready = _ready_tasks(mission)
        effective = _effective_concurrency(mission, ready)
        if dispatch and mission["state"] == "running" and not mission["attention_open"]:
            active_tasks = _active_tasks(mission)
            active_cost = sum(_task_cost(task) for task in active_tasks)
            capacity = max(0, effective - active_cost)
            for task in _select_ready_tasks(ready, active_tasks, capacity):
                attempt_id = f"a{len(task['attempts']) + 1:04d}"
                attempt_dir = path / "attempts" / task["id"] / attempt_id
                prompt = _task_prompt(mission, task, attempt_id)
                model = task.get("model") or mission["models"]["validator" if task["role"] == "validate" else "work"]
                name = re.sub(r"[^a-zA-Z0-9-]", "-", f"zenith-{mission_id[-8:]}-{task['id']}-{attempt_id}")[:63]
                attempt = {"id": attempt_id, "status": "dispatching", "created_at": _now(), "handle": None, "ingested": False}
                task["attempts"].append(attempt)
                task["status"] = "dispatching"
                _write_json(attempt_dir / "dispatch.json", {"mission_id": mission_id, "task_id": task["id"], "attempt_id": attempt_id, "role": task["role"], "targets": task["targets"], "concurrency_cost": _task_cost(task), "exclusive": bool(task.get("exclusive")), "priority": int(task.get("priority", 0)), "prompt": prompt, "model": model, "created_at": attempt["created_at"]})
                reservations.append((task["id"], attempt_id, name, model))
                _event(path, "task_dispatch_reserved", task_id=task["id"], attempt_id=attempt_id)
        _save_mission(path, mission)

    deleted: list[str] = []
    delete_warnings: list[str] = []
    for child_id in sorted(set(deletable)):
        try:
            await _rlm_delete_subagent(child_id)
            deleted.append(child_id)
        except Exception as exc:
            delete_warnings.append(f"could not delete retained child {child_id}: {exc}")

    dispatched: list[dict[str, Any]] = []
    for task_id, attempt_id, name, model in reservations:
        with _FileLock(path / ".lock"):
            current = _load_mission(path)
            still_reserved = _active_task_reservation(current, task_id, attempt_id)
        if not still_reserved:
            continue
        dispatch = _read_json(path / "attempts" / task_id / attempt_id / "dispatch.json")
        try:
            handle = await _rlm_spawn(dispatch["prompt"], name=name, model=model)
        except Exception as exc:
            with _FileLock(path / ".lock"):
                mission = _load_mission(path)
                if _active_task_reservation(mission, task_id, attempt_id):
                    task = mission["tasks"][task_id]
                    attempt = task["attempts"][-1]
                    attempt.update({"status": "error", "error": str(exc)})
                    task["status"] = "failed"
                    _add_attention(path, mission, "task_admission_error", key=f"task:{task_id}:{attempt_id}:admission", task_id=task_id, attempt_id=attempt_id, error=str(exc), targets=task["targets"])
                    mission["state"] = "attention_needed"
                    _event(path, "task_admission_failed", task_id=task_id, attempt_id=attempt_id, error=str(exc))
                    _save_mission(path, mission)
                else:
                    delete_warnings.append(f"ignored stale admission failure for {task_id}/{attempt_id}: {exc}")
            continue
        handle_value = _handle_dict(handle)
        late_target = handle_value.get("rlm_child_id") or handle_value.get("session_name") or handle_value.get("name")
        admitted = False
        with _FileLock(path / ".lock"):
            mission = _load_mission(path)
            if _active_task_reservation(mission, task_id, attempt_id):
                task = mission["tasks"][task_id]
                attempt = task["attempts"][-1]
                attempt.update({"status": "running", "admitted_at": _now(), "handle": handle_value})
                task["status"] = "running"
                _event(path, "task_admitted", task_id=task_id, attempt_id=attempt_id, handle=handle_value)
                _save_mission(path, mission)
                admitted = True
        if not admitted:
            if late_target:
                try:
                    await _rlm_delete_subagent(str(late_target))
                    deleted.append(str(late_target))
                except Exception as exc:
                    delete_warnings.append(f"could not delete stale late admission {late_target}: {exc}")
            else:
                delete_warnings.append(f"stale late admission for {task_id}/{attempt_id} returned no deletable handle id")
            continue
        dispatched.append({"task_id": task_id, "attempt_id": attempt_id, "handle": handle_value})
    with _FileLock(path / ".lock"):
        mission = _load_mission(path)
    warnings = ([registry_warning] if registry_warning else []) + delete_warnings
    if mission["state"] == "done" and mission.get("persistent") and not mission.get("continuity", {}).get("finalized"):
        final = await finalize_continuity(mission_id, workspace=workspace)
        warnings.extend(final.get("warnings", []))
        with _FileLock(path / ".lock"):
            mission = _load_mission(path)
    return _envelope(
        "advance", mission, ingested=ingested, dispatched=dispatched,
        deleted_children=sorted(set(deleted)), warnings=warnings,
        concurrency_policy=mission["concurrency_policy"],
    )


async def set_concurrency(
    mission_id: str,
    concurrency: int | str,
    workspace: str = ".",
    min_concurrency: int = 1,
    max_concurrency: int | None = None,
) -> dict[str, Any]:
    """Change a live mission's fixed or automatic concurrency policy without cancelling work."""
    path = _mission_dir(mission_id, workspace)
    requested = _normalise_concurrency_policy(
        concurrency, min_concurrency=min_concurrency, max_concurrency=max_concurrency
    )
    with _FileLock(path / ".lock"):
        mission = _load_mission(path)
        if mission["state"] in {"done", "aborted"}:
            raise ZenithError(f"cannot change concurrency for a {mission['state']} mission")
        current = _ensure_concurrency_policy(mission)
        same_request = (
            current["mode"] == requested["mode"]
            and current["minimum"] == requested["minimum"]
            and current["maximum"] == requested["maximum"]
        )
        if same_request:
            return _envelope(
                "set_concurrency", mission, concurrency_policy=current, idempotent=True
            )
        _validate_task_capacity(mission["tasks"].values(), requested["maximum"])
        active_cost = sum(_task_cost(task) for task in _active_tasks(mission))
        requested.update({
            "active_cost": active_cost,
            "scale_down_pending": active_cost > requested["effective"],
            "updated_at": _now(),
        })
        previous = deepcopy(current)
        mission["concurrency_policy"] = requested
        mission["concurrency"] = requested["effective"]
        _event(
            path, "concurrency_policy_changed", previous=previous,
            concurrency_policy=requested, active_cost=active_cost,
        )
        _save_mission(path, mission)
    return _envelope(
        "set_concurrency", mission, concurrency_policy=mission["concurrency_policy"]
    )



def _recovery_blocked(message: str, exc: BaseException | None = None) -> ZenithError:
    error = _typed_error("RECOVERY_BLOCKED", 503, message)
    if exc is not None:
        error.__cause__ = exc
    return error


def _identity(value: os.stat_result) -> dict[str, int]:
    return {
        "device": int(value.st_dev),
        "inode": int(value.st_ino),
        "uid": int(value.st_uid),
        "gid": int(value.st_gid),
    }


def _artifact_identity(value: os.stat_result) -> dict[str, int]:
    return {**_identity(value), "nlink": int(value.st_nlink)}


def _mode(value: os.stat_result) -> str:
    return f"{stat.S_IMODE(value.st_mode):04o}"


def _fixed_name(name: str, label: str = "filesystem entry") -> str:
    if (
        not isinstance(name, str)
        or not name
        or name in {".", ".."}
        or "/" in name
        or "\x00" in name
        or unicodedata.normalize("NFC", name) != name
    ):
        raise _recovery_blocked(f"invalid fixed name for {label}")
    return name


def _entry_stat_at(dir_fd: int, name: str, *, label: str | None = None) -> os.stat_result | None:
    _fixed_name(name, label or "entry")
    try:
        return os.stat(name, dir_fd=dir_fd, follow_symlinks=False)
    except FileNotFoundError:
        return None
    except OSError as exc:
        raise _recovery_blocked(f"cannot inspect {label or name}", exc) from exc


def _fd_acl_names(fd: int, label: str) -> set[str]:
    try:
        return set(os.listxattr(fd))
    except AttributeError as exc:
        raise _recovery_blocked(f"cannot verify ACL policy for {label}", exc) from exc
    except OSError as exc:
        if exc.errno in {errno.ENOTSUP, getattr(errno, "EOPNOTSUPP", errno.ENOTSUP)}:
            return set()
        raise _recovery_blocked(f"cannot verify ACL policy for {label}", exc) from exc


def _reject_acl(fd: int, label: str) -> None:
    if {"system.posix_acl_access", "system.posix_acl_default"} & _fd_acl_names(fd, label):
        raise _recovery_blocked(f"POSIX ACLs are not permitted on {label}")


def _validate_directory_fd(
    fd: int,
    *,
    owner: int,
    gid: int | None,
    exact_mode: int | None,
    label: str,
) -> os.stat_result:
    value = os.fstat(fd)
    unsafe = (
        not stat.S_ISDIR(value.st_mode)
        or value.st_uid != owner
        or (gid is not None and value.st_gid != gid)
        or bool(value.st_mode & (stat.S_ISUID | stat.S_ISGID))
    )
    if exact_mode is None:
        unsafe = unsafe or bool(value.st_mode & 0o022)
    else:
        unsafe = unsafe or stat.S_IMODE(value.st_mode) != exact_mode
    if unsafe:
        raise _recovery_blocked(f"unsafe directory identity, owner, or mode for {label}")
    _reject_acl(fd, label)
    return value


def _open_directory_at(
    parent_fd: int,
    name: str,
    *,
    owner: int,
    gid: int | None,
    exact_mode: int | None = 0o700,
    label: str | None = None,
    missing_ok: bool = False,
) -> int | None:
    shown = label or name
    _fixed_name(name, shown)
    flags = os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW
    try:
        fd = os.open(name, flags, dir_fd=parent_fd)
    except FileNotFoundError:
        if missing_ok:
            return None
        raise _recovery_blocked(f"required directory is missing: {shown}")
    except OSError as exc:
        raise _recovery_blocked(f"cannot safely open directory {shown}", exc) from exc
    try:
        value = _validate_directory_fd(
            fd,
            owner=owner,
            gid=gid,
            exact_mode=exact_mode,
            label=shown,
        )
        entry = os.stat(name, dir_fd=parent_fd, follow_symlinks=False)
        if (value.st_dev, value.st_ino) != (entry.st_dev, entry.st_ino):
            raise _recovery_blocked(f"directory entry changed while opening {shown}")
        return fd
    except BaseException:
        os.close(fd)
        raise


def _check_secure_directory(path: Path, *, owner: int | None = None) -> os.stat_result:
    """Safely inspect a non-transaction directory without following its final name."""

    expected_owner = owner if owner is not None else os.geteuid()
    flags = os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW
    try:
        fd = os.open(path, flags)
    except OSError as exc:
        raise _recovery_blocked(f"cannot safely open Zenith directory {path.name}", exc) from exc
    try:
        value = _validate_directory_fd(
            fd,
            owner=expected_owner,
            gid=None,
            exact_mode=None,
            label=path.name,
        )
        entry = os.stat(path, follow_symlinks=False)
        if (value.st_dev, value.st_ino) != (entry.st_dev, entry.st_ino):
            raise _recovery_blocked(f"Zenith directory entry changed while opening {path.name}")
        return value
    finally:
        os.close(fd)


def _validate_regular_stat(
    value: os.stat_result,
    *,
    owner: int,
    gid: int | None,
    max_bytes: int,
    exact_mode: int | None,
    writable: bool,
    allowed_links: tuple[int, ...],
    label: str,
) -> None:
    unsafe = (
        not stat.S_ISREG(value.st_mode)
        or value.st_nlink not in allowed_links
        or value.st_uid != owner
        or (gid is not None and value.st_gid != gid)
        or bool(value.st_mode & (stat.S_ISUID | stat.S_ISGID))
        or value.st_size < 0
        or value.st_size > max_bytes
    )
    if exact_mode is None:
        unsafe = unsafe or bool(value.st_mode & 0o022)
        if not writable:
            unsafe = unsafe or bool(value.st_mode & 0o222)
    else:
        unsafe = unsafe or stat.S_IMODE(value.st_mode) != exact_mode
    if unsafe:
        raise _recovery_blocked(f"unsafe regular-file identity, mode, link count, or size for {label}")


def _read_fd_exact(fd: int, size: int) -> bytes:
    chunks: list[bytes] = []
    remaining = size
    while remaining:
        try:
            chunk = os.read(fd, min(remaining, 1024 * 1024))
        except InterruptedError:
            continue
        except OSError as exc:
            if exc.errno == errno.EINTR:
                continue
            raise
        if not chunk:
            raise OSError(errno.EIO, "short read")
        chunks.append(chunk)
        remaining -= len(chunk)
    while True:
        try:
            extra = os.read(fd, 1)
            break
        except InterruptedError:
            continue
        except OSError as exc:
            if exc.errno == errno.EINTR:
                continue
            raise
    if extra:
        raise OSError(errno.EFBIG, "file grew while reading")
    return b"".join(chunks)


def _read_regular_at(
    dir_fd: int,
    name: str,
    *,
    owner: int,
    gid: int | None,
    max_bytes: int,
    exact_mode: int | None = None,
    writable: bool = True,
    allowed_links: tuple[int, ...] = (1,),
    label: str | None = None,
) -> tuple[bytes, os.stat_result]:
    shown = label or name
    _fixed_name(name, shown)
    flags = os.O_RDONLY | os.O_CLOEXEC | os.O_NOFOLLOW
    try:
        fd = os.open(name, flags, dir_fd=dir_fd)
    except OSError as exc:
        raise _recovery_blocked(f"cannot safely open {shown}", exc) from exc
    try:
        before = os.fstat(fd)
        _validate_regular_stat(
            before,
            owner=owner,
            gid=gid,
            max_bytes=max_bytes,
            exact_mode=exact_mode,
            writable=writable,
            allowed_links=allowed_links,
            label=shown,
        )
        _reject_acl(fd, shown)
        data = _read_fd_exact(fd, int(before.st_size))
        after = os.fstat(fd)
        entry = os.stat(name, dir_fd=dir_fd, follow_symlinks=False)
        if (
            (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns)
            != (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns)
            or (after.st_dev, after.st_ino) != (entry.st_dev, entry.st_ino)
        ):
            raise OSError(errno.EAGAIN, "file identity changed while reading")
        return data, after
    except ZenithError:
        raise
    except OSError as exc:
        raise _recovery_blocked(f"cannot safely read {shown}", exc) from exc
    finally:
        os.close(fd)


def _read_regular_bytes(
    path: Path,
    *,
    owner: int,
    max_bytes: int,
    writable: bool = True,
    recovery: bool = False,
    allowed_links: tuple[int, ...] = (1,),
) -> tuple[bytes, os.stat_result]:
    """Compatibility wrapper for evidence paths outside the transaction tree."""

    del recovery
    parent_flags = os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW
    try:
        parent_fd = os.open(path.parent, parent_flags)
    except OSError as exc:
        raise _recovery_blocked(f"cannot safely open parent of {path.name}", exc) from exc
    try:
        return _read_regular_at(
            parent_fd,
            path.name,
            owner=owner,
            gid=None,
            max_bytes=max_bytes,
            exact_mode=None,
            writable=writable,
            allowed_links=allowed_links,
            label=path.name,
        )
    finally:
        os.close(parent_fd)


def _fsync_fd(fd: int) -> None:
    while True:
        try:
            os.fsync(fd)
            return
        except InterruptedError:
            continue
        except OSError as exc:
            if exc.errno == errno.EINTR:
                continue
            raise


def _fsync_directory(path: Path) -> None:
    flags = os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW
    try:
        fd = os.open(path, flags)
        try:
            _fsync_fd(fd)
        finally:
            os.close(fd)
    except OSError as exc:
        raise _recovery_blocked(f"required directory fsync failed for {path.name}", exc) from exc


def _write_all(fd: int, data: bytes) -> None:
    view = memoryview(data)
    offset = 0
    while offset < len(view):
        try:
            written = os.write(fd, view[offset:])
        except InterruptedError:
            continue
        except OSError as exc:
            if exc.errno == errno.EINTR:
                continue
            raise
        if written <= 0 or written > len(view) - offset:
            raise OSError(errno.EIO, "short write")
        offset += written


def _write_exclusive_at(
    dir_fd: int,
    name: str,
    data: bytes,
    mode: int,
    *,
    owner: int,
    gid: int,
    label: str | None = None,
) -> os.stat_result:
    shown = label or name
    _fixed_name(name, shown)
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_CLOEXEC | os.O_NOFOLLOW
    try:
        fd = os.open(name, flags, mode, dir_fd=dir_fd)
    except FileExistsError:
        raise
    except OSError as exc:
        raise _recovery_blocked(f"exclusive create failed for {shown}", exc) from exc
    try:
        try:
            os.fchown(fd, owner, gid)
            os.fchmod(fd, mode)
            _write_all(fd, data)
            value = os.fstat(fd)
            _validate_regular_stat(
                value,
                owner=owner,
                gid=gid,
                max_bytes=max(len(data), 1),
                exact_mode=mode,
                writable=True,
                allowed_links=(1,),
                label=shown,
            )
            if value.st_size != len(data):
                raise OSError(errno.EIO, "durable file size mismatch")
            _reject_acl(fd, shown)
            _fsync_fd(fd)
            return value
        except OSError as exc:
            raise _recovery_blocked(f"durable write failed for {shown}", exc) from exc
    finally:
        os.close(fd)


def _write_exclusive(path: Path, data: bytes, mode: int) -> None:
    """Compatibility wrapper; strict transaction code uses _write_exclusive_at."""

    parent_flags = os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW
    parent_fd = os.open(path.parent, parent_flags)
    try:
        parent_stat = os.fstat(parent_fd)
        _write_exclusive_at(
            parent_fd,
            path.name,
            data,
            mode,
            owner=parent_stat.st_uid,
            gid=parent_stat.st_gid,
            label=path.name,
        )
    finally:
        os.close(parent_fd)


def _mkdir_exclusive_at(
    parent_fd: int,
    name: str,
    *,
    owner: int,
    gid: int,
    label: str | None = None,
) -> int:
    shown = label or name
    _fixed_name(name, shown)
    try:
        os.mkdir(name, 0o700, dir_fd=parent_fd)
        _fsync_fd(parent_fd)
    except FileExistsError as exc:
        raise _recovery_blocked(f"exclusive transaction directory already exists: {shown}", exc) from exc
    except OSError as exc:
        raise _recovery_blocked(f"cannot create transaction directory {shown}", exc) from exc
    opened = _open_directory_at(
        parent_fd,
        name,
        owner=owner,
        gid=gid,
        exact_mode=0o700,
        label=shown,
    )
    assert opened is not None
    return opened


def _ensure_private_directory_at(
    parent_fd: int,
    name: str,
    *,
    owner: int,
    gid: int,
    label: str | None = None,
) -> int:
    shown = label or name
    existing = _entry_stat_at(parent_fd, name, label=shown)
    if existing is None:
        try:
            os.mkdir(name, 0o700, dir_fd=parent_fd)
            _fsync_fd(parent_fd)
        except FileExistsError:
            pass
        except OSError as exc:
            raise _recovery_blocked(f"cannot create transaction directory {shown}", exc) from exc
    opened = _open_directory_at(
        parent_fd,
        name,
        owner=owner,
        gid=gid,
        exact_mode=0o700,
        label=shown,
    )
    assert opened is not None
    return opened


def _rename_noreplace(
    source_dir_fd: int,
    source: str,
    destination_dir_fd: int,
    destination: str,
) -> None:
    _fixed_name(source, "rename source")
    _fixed_name(destination, "rename destination")
    libc = ctypes.CDLL(None, use_errno=True)
    renameat2 = getattr(libc, "renameat2", None)
    if renameat2 is None:
        raise _typed_error("UNSUPPORTED_STORAGE", 503, "rename-no-replace is unavailable")
    renameat2.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_int, ctypes.c_char_p, ctypes.c_uint]
    renameat2.restype = ctypes.c_int
    while True:
        result = renameat2(
            source_dir_fd,
            os.fsencode(source),
            destination_dir_fd,
            os.fsencode(destination),
            1,  # RENAME_NOREPLACE
        )
        if result == 0:
            return
        number = ctypes.get_errno()
        if number == errno.EINTR:
            continue
        if number in {errno.ENOSYS, errno.EINVAL, errno.ENOTSUP, getattr(errno, "EOPNOTSUPP", errno.ENOTSUP)}:
            raise _typed_error("UNSUPPORTED_STORAGE", 503, "filesystem lacks atomic rename-no-replace")
        raise OSError(number, os.strerror(number))


def _validate_hash(value: Any, label: str, *, evidence: bool = False) -> str:
    if not isinstance(value, str) or not _HASH_RE.fullmatch(value):
        if evidence:
            raise _typed_error("INVALID_EVIDENCE", 422, f"{label} must be sha256:<64 lowercase hex>")
        raise _typed_error("PRECONDITION_FAILED", 412, f"{label} must be sha256:<64 lowercase hex>")
    return value


def _closed_object(value: Any, fields: set[str], label: str, *, evidence: bool = True) -> dict[str, Any]:
    if not isinstance(value, Mapping):
        error = _typed_error("INVALID_EVIDENCE", 422, f"{label} must be an object") if evidence else ZenithError(
            f"{label} must be an object"
        )
        raise error
    result = dict(value)
    unknown = set(result) - fields
    if unknown:
        error = _typed_error("INVALID_EVIDENCE", 422, f"{label} has unknown fields: {sorted(unknown)}") if evidence else ZenithError(
            f"{label} has unknown fields: {sorted(unknown)}"
        )
        raise error
    return result


def _normalise_stored_identity(value: Any, label: str, *, links: bool = False) -> dict[str, int]:
    fields = {"device", "inode", "uid", "gid", *(("nlink",) if links else ())}
    result = _closed_object(value, fields, label, evidence=False)
    if set(result) != fields:
        raise ZenithError(f"{label} has an incomplete identity")
    for key, item in result.items():
        if type(item) is not int or item < 0:
            raise ZenithError(f"{label}.{key} must be a non-negative integer")
    return {key: int(result[key]) for key in sorted(fields)}


def _validate_output_descriptors(value: Any, label: str) -> dict[str, dict[str, Any]]:
    if not isinstance(value, dict) or set(value) != {*_DECIDE_STATE_OUTPUTS, "receipt.json"}:
        raise ZenithError(f"{label} has the wrong output keyset")
    result: dict[str, dict[str, Any]] = {}
    for name, raw in value.items():
        descriptor = _closed_object(
            raw,
            {"sha256", "size", "mode", "hash_scope"},
            f"{label}.{name}",
            evidence=False,
        )
        _validate_hash(descriptor.get("sha256"), f"{label}.{name}.sha256")
        maximum = 1024 * 1024 if name == "receipt.json" else _MAX_STATE_BYTES
        if type(descriptor.get("size")) is not int or not 0 <= descriptor["size"] <= maximum:
            raise ZenithError(f"invalid output size for {name}")
        expected_mode = "0400" if name == "receipt.json" else "0600"
        if descriptor.get("mode") != expected_mode:
            raise ZenithError(f"invalid output mode for {name}")
        if name == "receipt.json":
            if set(descriptor) != {"sha256", "size", "mode", "hash_scope"} or descriptor.get("hash_scope") != "receipt-logical-body-v1":
                raise ZenithError("invalid receipt hash scope")
        elif set(descriptor) != {"sha256", "size", "mode"}:
            raise ZenithError(f"unexpected descriptor fields for {name}")
        result[name] = descriptor
    return result


def _validate_input_hashes(value: Any, label: str) -> dict[str, str]:
    if not isinstance(value, dict) or set(value) != set(_DECIDE_HASH_FILES):
        raise ZenithError(f"{label} has the wrong input-hash keyset")
    return {name: _validate_hash(value[name], f"{label}.{name}") for name in _DECIDE_HASH_FILES}

def _require_transaction_authority(path: Path) -> _FileLock:
    authority = _current_lock_for(path)
    if authority is None:
        raise _recovery_blocked("strict mission operation requires the retained mission lock")
    authority.revalidate()
    return authority


def _read_decide_snapshot(path: Path, *, recovery_required: bool = True) -> dict[str, Any]:
    authority = _require_transaction_authority(path)
    if recovery_required and not authority.recovery_complete:
        raise _recovery_blocked("authoritative mission snapshot requested before recovery")
    authority.revalidate()
    records: dict[str, dict[str, Any]] = {}
    parsed: dict[str, Any] = {}
    try:
        for name in _DECIDE_HASH_FILES:
            data, file_stat = _read_regular_at(
                authority.root_fd,
                name,
                owner=authority.owner,
                gid=authority.gid,
                max_bytes=_MAX_STATE_BYTES,
                exact_mode=0o600,
                label=name,
            )
            records[name] = {
                "data": data,
                "hash": _sha256_bytes(data),
                "identity": _artifact_identity(file_stat),
                "mode": _mode(file_stat),
                "mtime_ns": int(file_stat.st_mtime_ns),
                "ctime_ns": int(file_stat.st_ctime_ns),
            }
            if name.endswith(".json"):
                parsed[name] = _strict_json_bytes(data, name)
        mission = parsed["mission.json"]
        if not isinstance(mission, dict) or mission.get("schema_version") != _SCHEMA_VERSION:
            raise ZenithError("unsupported or corrupt mission ledger")
        if mission.get("id") != path.name or mission.get("state") not in _STATES:
            raise ZenithError("mission identity/state invariant failed")
        revision = mission.get("revision")
        if type(revision) is not int or not 0 <= revision <= _MAX_REVISION:
            raise ZenithError("mission revision must be a bounded non-negative integer")
        for name in ("attention.json", "decisions.json", "events.json"):
            if not isinstance(parsed[name], list):
                raise ZenithError(f"{name} must contain a JSON list")
        if not isinstance(parsed["contract.json"], dict) or not isinstance(parsed["plan.json"], dict):
            raise ZenithError("contract.json and plan.json must contain JSON objects")
        attention = parsed["attention.json"]
        if any(not isinstance(item, dict) for item in attention):
            raise ZenithError("attention.json entries must all be objects")
        attention_ids = [item.get("id") for item in attention]
        if (
            any(not isinstance(item, str) or not _ID_RE.fullmatch(item) for item in attention_ids)
            or len(attention_ids) != len(set(attention_ids))
            or any(item.get("status") not in {"open", "resolved"} for item in attention)
        ):
            raise ZenithError("attention ledger contains invalid IDs, statuses, or duplicates")
        open_ids = [item["id"] for item in attention if item["status"] == "open"]
        mission_open = mission.get("attention_open")
        if (
            not isinstance(mission_open, list)
            or len(mission_open) != len(open_ids)
            or set(mission_open) != set(open_ids)
        ):
            raise ZenithError("mission attention index does not match attention.json")
        if any(not isinstance(item, dict) for item in parsed["decisions.json"] + parsed["events.json"]):
            raise ZenithError("decision and event ledgers must contain only objects")
        assertions = parsed["contract.json"].get("assertions")
        tasks = parsed["plan.json"].get("tasks")
        if not isinstance(assertions, list) or not isinstance(tasks, list):
            raise ZenithError("contract assertions and plan tasks must be lists")
        if any(not isinstance(item, dict) for item in assertions + tasks):
            raise ZenithError("contract assertions and plan tasks must contain only objects")
        contract_ids = [item.get("id") for item in assertions]
        plan_ids = [item.get("id") for item in tasks]
        if (
            any(not isinstance(item, str) or not _ID_RE.fullmatch(item) for item in contract_ids + plan_ids)
            or len(contract_ids) != len(set(contract_ids))
            or len(plan_ids) != len(set(plan_ids))
        ):
            raise ZenithError("contract.json or plan.json contains invalid or duplicate IDs")
        mission_assertions = mission.get("assertions")
        mission_tasks = mission.get("tasks")
        if not isinstance(mission_assertions, dict) or set(contract_ids) != set(mission_assertions):
            raise ZenithError("contract.json assertion IDs do not match mission.json")
        if not isinstance(mission_tasks, dict) or set(plan_ids) != set(mission_tasks):
            raise ZenithError("plan.json task IDs do not match mission.json")
        if parsed["plan.json"].get("mission", "") != mission.get("mission", ""):
            raise ZenithError("plan.json mission charter does not match mission.json")
        active_plan = [item for item in tasks if not item.get("superseded")]
        clean_contract, clean_active_plan = _validate_plan(parsed["contract.json"], active_plan)
        _validate_task_capacity(clean_active_plan, _ensure_concurrency_policy(mission)["maximum"])
        clean_by_id = {item["id"]: item for item in clean_active_plan}
        for task_id, task in mission_tasks.items():
            if not isinstance(task, dict) or task.get("status") not in _TASK_STATUSES:
                raise ZenithError(f"mission task {task_id} has an invalid status")
            if task_id in clean_by_id and any(
                task.get(field) != clean_by_id[task_id].get(field)
                for field in ("role", "targets", "depends_on")
            ):
                raise ZenithError(f"mission task {task_id} disagrees with plan.json")
        for assertion_id, assertion in mission_assertions.items():
            if not isinstance(assertion, dict) or assertion.get("status") not in _ASSERTION_STATUSES:
                raise ZenithError(f"mission assertion {assertion_id} has an invalid status")
        if clean_contract != parsed["contract.json"]:
            raise ZenithError("contract.json is not in canonical validated form")
    except ZenithError as exc:
        if exc.code == "RECOVERY_BLOCKED":
            raise
        raise _recovery_blocked("authoritative mission snapshot invariant failed", exc) from exc
    root_stat = os.fstat(authority.root_fd)
    return {
        "root_identity": _identity(root_stat),
        "root_mode": _mode(root_stat),
        "lock_identity": _artifact_identity(os.fstat(authority.lock_fd)),
        "lock_mode": _mode(os.fstat(authority.lock_fd)),
        "storage_profile": deepcopy(authority.storage_profile),
        "records": records,
        "parsed": parsed,
        "revision": revision,
        "hashes": {name: records[name]["hash"] for name in _DECIDE_HASH_FILES},
    }


def _same_snapshot(left: Mapping[str, Any], right: Mapping[str, Any]) -> bool:
    if (
        left["root_identity"] != right["root_identity"]
        or left["root_mode"] != right["root_mode"]
        or left["lock_identity"] != right["lock_identity"]
        or left["lock_mode"] != right["lock_mode"]
        or left["storage_profile"] != right["storage_profile"]
        or left["hashes"] != right["hashes"]
    ):
        return False
    return all(
        left["records"][name]["identity"] == right["records"][name]["identity"]
        and left["records"][name]["mode"] == right["records"][name]["mode"]
        and left["records"][name]["mtime_ns"] == right["records"][name]["mtime_ns"]
        and left["records"][name]["ctime_ns"] == right["records"][name]["ctime_ns"]
        for name in _DECIDE_HASH_FILES
    )


def _validate_journal_bytes(journal_bytes: bytes) -> dict[str, Any]:
    try:
        journal = _strict_json_bytes(journal_bytes, "transaction journal", max_bytes=1024 * 1024)
        fields = {
            "schema", "mission_id", "operation_id", "request_sha256",
            "evidence_manifest_sha256", "base_revision", "result_revision",
            "input_hashes", "outputs", "response_sha256", "committed_at",
            "evidence_artifacts", "mission_root_identity", "mission_root_mode",
            "lock_identity", "lock_mode", "storage_profile", "reservation_sha256",
        }
        journal = _closed_object(journal, fields, "transaction journal", evidence=False)
        if set(journal) != fields or journal.get("schema") != "zenith.decide.transaction/v1":
            raise ZenithError("unsupported or incomplete decide transaction journal schema")
        journal["mission_id"] = _canonical_identifier(journal.get("mission_id"), "journal.mission_id")
        journal["operation_id"] = _canonical_operation_id(journal.get("operation_id"), evidence=False)
        for key in (
            "request_sha256", "evidence_manifest_sha256", "response_sha256", "reservation_sha256"
        ):
            _validate_hash(journal.get(key), f"journal.{key}")
        if (
            type(journal.get("base_revision")) is not int
            or type(journal.get("result_revision")) is not int
            or not 0 <= journal["base_revision"] < _MAX_REVISION
            or journal["result_revision"] != journal["base_revision"] + 1
        ):
            raise ZenithError("journal revisions must encode one bounded increment")
        journal["mission_root_identity"] = _normalise_stored_identity(
            journal.get("mission_root_identity"), "journal.mission_root_identity"
        )
        journal["lock_identity"] = _normalise_stored_identity(
            journal.get("lock_identity"), "journal.lock_identity", links=True
        )
        if journal.get("mission_root_mode") != "0700" or journal.get("lock_mode") != "0600":
            raise ZenithError("journal authority modes are invalid")
        profile = _closed_object(
            journal.get("storage_profile"),
            {"schema", "filesystem", "magic", "flock", "same_filesystem_rename", "rename_noreplace", "directory_fsync"},
            "journal.storage_profile",
            evidence=False,
        )
        if (
            set(profile) != {"schema", "filesystem", "magic", "flock", "same_filesystem_rename", "rename_noreplace", "directory_fsync"}
            or profile.get("schema") != "zenith.storage-profile/v1"
            or any(profile.get(key) is not True for key in ("flock", "same_filesystem_rename", "rename_noreplace", "directory_fsync"))
        ):
            raise ZenithError("journal storage profile is invalid")
        journal["input_hashes"] = _validate_input_hashes(journal.get("input_hashes"), "journal.input_hashes")
        journal["outputs"] = _validate_output_descriptors(journal.get("outputs"), "journal.outputs")
        if not isinstance(journal.get("committed_at"), str) or not journal["committed_at"] or len(journal["committed_at"].encode()) > 128:
            raise ZenithError("journal committed_at is invalid")
        if not isinstance(journal.get("evidence_artifacts"), list) or len(journal["evidence_artifacts"]) > _MAX_EVIDENCE_ARTIFACTS:
            raise ZenithError("journal accepted evidence is invalid")
        journal["evidence_artifacts"] = _strict_json_value(
            journal["evidence_artifacts"], "journal.evidence_artifacts"
        )
        return journal
    except ZenithError as exc:
        if exc.code == "RECOVERY_BLOCKED":
            raise
        raise _recovery_blocked("invalid committed decide journal", exc) from exc


def _validate_transaction_authority(authority: _FileLock, journal: Mapping[str, Any]) -> None:
    authority.revalidate()
    root_stat = os.fstat(authority.root_fd)
    lock_stat = os.fstat(authority.lock_fd)
    if (
        journal.get("mission_root_identity") != _identity(root_stat)
        or journal.get("mission_root_mode") != _mode(root_stat)
        or journal.get("lock_identity") != _artifact_identity(lock_stat)
        or journal.get("lock_mode") != _mode(lock_stat)
        or journal.get("storage_profile") != authority.storage_profile
    ):
        raise _recovery_blocked("mission root, lock, or storage authority differs from the transaction journal")


def _receipt_body_hash(receipt: Mapping[str, Any]) -> str:
    """Digest the stable logical receipt body without self-referential identities."""

    body = dict(receipt)
    for key in ("journal_sha256", "commit_binding_sha256", "receipt_identity"):
        body.pop(key, None)
    return _sha256_canonical(body)


def _validate_receipt_bytes(
    data: bytes,
    *,
    mission_id: str,
    operation_id: str,
    request_sha256: str | None = None,
    journal_sha256: str | None = None,
) -> dict[str, Any]:
    try:
        receipt = _strict_json_bytes(data, "decide receipt", max_bytes=1024 * 1024)
        fields = {
            "schema", "mission_id", "operation_id", "request_sha256",
            "evidence_manifest_sha256", "base_revision", "committed_revision",
            "status", "committed_at", "input_hashes", "output_hashes",
            "accepted_evidence", "response", "journal_sha256",
            "commit_binding_sha256", "receipt_identity", "idempotency",
        }
        receipt = _closed_object(receipt, fields, "decide receipt", evidence=False)
        if set(receipt) != fields or receipt.get("schema") != "zenith.decide.receipt/v1":
            raise ZenithError("unsupported or incomplete decide receipt schema")
        if receipt.get("mission_id") != mission_id or receipt.get("operation_id") != operation_id:
            raise ZenithError("decide receipt identity mismatch")
        if receipt.get("status") != "committed":
            raise ZenithError("decide receipt is not committed")
        for key in (
            "request_sha256", "evidence_manifest_sha256", "journal_sha256",
            "commit_binding_sha256",
        ):
            _validate_hash(receipt.get(key), f"receipt.{key}")
        if (
            type(receipt.get("base_revision")) is not int
            or type(receipt.get("committed_revision")) is not int
            or not 0 <= receipt["base_revision"] < _MAX_REVISION
            or receipt["committed_revision"] != receipt["base_revision"] + 1
        ):
            raise ZenithError("receipt revisions do not encode one bounded increment")
        if not isinstance(receipt.get("committed_at"), str) or not receipt["committed_at"]:
            raise ZenithError("receipt lacks committed_at")
        receipt["input_hashes"] = _validate_input_hashes(receipt.get("input_hashes"), "receipt.input_hashes")
        output_hashes = receipt.get("output_hashes")
        if not isinstance(output_hashes, dict) or set(output_hashes) != set(_DECIDE_STATE_OUTPUTS):
            raise ZenithError("receipt output_hashes has the wrong keyset")
        receipt["output_hashes"] = {
            name: _validate_hash(output_hashes[name], f"receipt.output_hashes.{name}")
            for name in _DECIDE_STATE_OUTPUTS
        }
        if not isinstance(receipt.get("accepted_evidence"), list) or len(receipt["accepted_evidence"]) > _MAX_EVIDENCE_ARTIFACTS:
            raise ZenithError("receipt accepted_evidence is invalid")
        receipt["accepted_evidence"] = _strict_json_value(
            receipt["accepted_evidence"], "receipt.accepted_evidence"
        )
        response = receipt.get("response")
        if not isinstance(response, dict):
            raise ZenithError("receipt lacks its stable logical response")
        response = _strict_json_value(response, "receipt.response")
        if (
            response.get("mission_id") != mission_id
            or response.get("operation_id") != operation_id
            or response.get("request_sha256") != receipt["request_sha256"]
            or response.get("revision") != receipt["committed_revision"]
            or response.get("committed_at") != receipt["committed_at"]
        ):
            raise ZenithError("receipt stable response binding mismatch")
        receipt["response"] = response
        idempotency = _closed_object(
            receipt.get("idempotency"),
            {"result", "request_match"},
            "receipt.idempotency",
            evidence=False,
        )
        if idempotency != {"result": "committed", "request_match": True}:
            raise ZenithError("receipt idempotency binding is invalid")
        receipt_identity = _closed_object(
            receipt.get("receipt_identity"),
            {"body_sha256", "mode", "size"},
            "receipt.receipt_identity",
            evidence=False,
        )
        if set(receipt_identity) != {"body_sha256", "mode", "size"}:
            raise ZenithError("receipt identity is incomplete")
        _validate_hash(receipt_identity.get("body_sha256"), "receipt.receipt_identity.body_sha256")
        if (
            receipt_identity["body_sha256"] != _receipt_body_hash(receipt)
            or receipt_identity.get("mode") != "0400"
            or receipt_identity.get("size") != len(data)
        ):
            raise ZenithError("receipt body digest, final mode, or size identity mismatch")
        if request_sha256 is not None and receipt["request_sha256"] != request_sha256:
            raise _typed_error(
                "IDEMPOTENCY_CONFLICT",
                409,
                f"operation_id {operation_id} was already used for a different decide request",
            )
        if journal_sha256 is not None and receipt["journal_sha256"] != journal_sha256:
            raise ZenithError("receipt journal digest mismatch")
        return receipt
    except ZenithError as exc:
        if exc.code in {"IDEMPOTENCY_CONFLICT", "RECOVERY_BLOCKED"}:
            raise
        raise _recovery_blocked("invalid durable decide receipt", exc) from exc


def _validate_reservation_bytes(
    data: bytes,
    *,
    authority: _FileLock,
    operation_id: str | None = None,
) -> dict[str, Any]:
    try:
        value = _strict_json_bytes(data, "archive reservation", max_bytes=64 * 1024)
        fields = {
            "schema", "mission_id", "operation_id", "request_sha256", "input_hashes",
            "mission_root_identity", "mission_root_mode", "lock_identity", "lock_mode",
        }
        value = _closed_object(value, fields, "archive reservation", evidence=False)
        if set(value) != fields or value.get("schema") != "zenith.decide.archive-reservation/v1":
            raise ZenithError("reservation schema is invalid")
        if value.get("mission_id") != authority.root_path.name:
            raise ZenithError("reservation mission identity mismatch")
        value["operation_id"] = _canonical_operation_id(value.get("operation_id"), evidence=False)
        if operation_id is not None and value["operation_id"] != operation_id:
            raise ZenithError("reservation operation identity mismatch")
        _validate_hash(value.get("request_sha256"), "reservation.request_sha256")
        value["input_hashes"] = _validate_input_hashes(value.get("input_hashes"), "reservation.input_hashes")
        value["mission_root_identity"] = _normalise_stored_identity(
            value.get("mission_root_identity"), "reservation.mission_root_identity"
        )
        value["lock_identity"] = _normalise_stored_identity(
            value.get("lock_identity"), "reservation.lock_identity", links=True
        )
        if value.get("mission_root_mode") != "0700" or value.get("lock_mode") != "0600":
            raise ZenithError("reservation authority modes are invalid")
        if (
            value["mission_root_identity"] != _identity(os.fstat(authority.root_fd))
            or value["lock_identity"] != _artifact_identity(os.fstat(authority.lock_fd))
        ):
            raise ZenithError("reservation authority identity mismatch")
        return value
    except ZenithError as exc:
        if exc.code == "RECOVERY_BLOCKED":
            raise
        raise _recovery_blocked("invalid archive reservation", exc) from exc


def _commit_binding_sha256(journal_sha256: str, reservation_sha256: str) -> str:
    return _sha256_canonical({
        "schema": "zenith.decide.commit-binding/v1",
        "journal_sha256": journal_sha256,
        "reservation_sha256": reservation_sha256,
    })


def _validate_commit_bytes(
    data: bytes,
    *,
    journal_sha256: str,
    reservation_sha256: str,
) -> dict[str, str]:
    try:
        marker = _strict_json_bytes(data, "COMMIT marker", max_bytes=4096)
        fields = {
            "schema", "journal_sha256", "receipt_sha256",
            "reservation_sha256", "commit_binding_sha256",
        }
        marker = _closed_object(marker, fields, "COMMIT marker", evidence=False)
        if set(marker) != fields or marker.get("schema") != "zenith.decide.commit/v1":
            raise ZenithError("COMMIT marker schema is invalid")
        for key in (
            "journal_sha256", "receipt_sha256", "reservation_sha256",
            "commit_binding_sha256",
        ):
            _validate_hash(marker.get(key), f"COMMIT.{key}")
        if (
            marker["journal_sha256"] != journal_sha256
            or marker["reservation_sha256"] != reservation_sha256
            or marker["commit_binding_sha256"]
            != _commit_binding_sha256(journal_sha256, reservation_sha256)
        ):
            raise ZenithError("COMMIT marker digest binding mismatch")
        return marker
    except ZenithError as exc:
        if exc.code == "RECOVERY_BLOCKED":
            raise
        raise _recovery_blocked("invalid COMMIT marker", exc) from exc


def _scandir_names(fd: int, *, limit: int, label: str) -> list[str]:
    names: list[str] = []
    try:
        # Directory descriptors are retained and reused throughout one locked
        # transaction. getdents advances their shared offset, so every bounded
        # enumeration must rewind rather than silently treating a prior scan's
        # EOF as an empty directory.
        os.lseek(fd, 0, os.SEEK_SET)
        with os.scandir(fd) as entries:
            for entry in entries:
                if len(names) >= limit:
                    raise _recovery_blocked(f"{label} exceeds its entry-count limit")
                names.append(_fixed_name(entry.name, label))
    except ZenithError:
        raise
    except OSError as exc:
        raise _recovery_blocked(f"cannot enumerate {label}", exc) from exc
    return sorted(names)


def _metadata_file_mode(name: str) -> int:
    if name in {"COMMIT", "APPLIED", "reservation.json", "receipt.json"}:
        return 0o400
    if name == "journal.json" or name in _DECIDE_STATE_OUTPUTS:
        return 0o600
    raise _recovery_blocked(f"unknown transaction file name {name}")


def _metadata_usage(authority: _FileLock, metadata_fd: int) -> tuple[int, int]:
    """Validate and bound the complete strict-decision metadata tree."""

    total = 0
    archived = 0
    top = _scandir_names(metadata_fd, limit=4, label="strict-decision metadata")
    if set(top) - {"active", "receipts", "archive"}:
        raise _recovery_blocked("strict-decision metadata contains an unknown entry")
    for directory in ("receipts", "archive"):
        if directory not in top:
            continue
        child_fd = _open_directory_at(
            metadata_fd,
            directory,
            owner=authority.owner,
            gid=authority.gid,
            exact_mode=0o700,
            label=directory,
        )
        assert child_fd is not None
        try:
            names = _scandir_names(
                child_fd,
                limit=(_MAX_ARCHIVED_OPERATIONS * (2 if directory == "receipts" else 3)) + 16,
                label=directory,
            )
            if directory == "receipts":
                for name in names:
                    if re.fullmatch(r"[0-9a-f-]{36}\.json", name):
                        _canonical_operation_id(name[:-5], evidence=False)
                        data, _ = _read_regular_at(
                            child_fd,
                            name,
                            owner=authority.owner,
                            gid=authority.gid,
                            max_bytes=1024 * 1024,
                            exact_mode=0o400,
                            label="permanent receipt",
                        )
                        total += len(data)
                    elif re.fullmatch(r"\.[0-9a-f-]{36}\.receipt\.tmp", name):
                        _canonical_operation_id(name[1:-12], evidence=False)
                        data, _ = _read_regular_at(
                            child_fd,
                            name,
                            owner=authority.owner,
                            gid=authority.gid,
                            max_bytes=1024 * 1024,
                            exact_mode=0o400,
                            label="receipt temporary",
                        )
                        total += len(data)
                    else:
                        raise _recovery_blocked("receipts directory contains an unknown entry")
            else:
                for name in names:
                    temporary_match = re.fullmatch(r"\.([0-9a-f-]{36})\.reserve\.tmp", name)
                    if temporary_match is not None:
                        _canonical_operation_id(temporary_match.group(1), evidence=False)
                        data, _ = _read_reservation_temp_at(child_fd, authority, name)
                        total += len(data)
                        continue
                    if name.endswith(".reserve"):
                        _canonical_operation_id(name[:-8], evidence=False)
                        data, _ = _read_regular_at(
                            child_fd,
                            name,
                            owner=authority.owner,
                            gid=authority.gid,
                            max_bytes=64 * 1024,
                            exact_mode=0o400,
                            label="archive reservation",
                        )
                        total += len(data)
                        continue
                    _canonical_operation_id(name, evidence=False)
                    archived += 1
                    if archived > _MAX_ARCHIVED_OPERATIONS:
                        raise _recovery_blocked("archived operation quota is exhausted")
                    operation_fd = _open_directory_at(
                        child_fd,
                        name,
                        owner=authority.owner,
                        gid=authority.gid,
                        exact_mode=0o700,
                        label="archived transaction",
                    )
                    assert operation_fd is not None
                    try:
                        operation_names = _scandir_names(
                            operation_fd,
                            limit=8,
                            label="archived transaction",
                        )
                        if set(operation_names) - {"post", "journal.json", "COMMIT", "APPLIED", "reservation.json"}:
                            raise _recovery_blocked("archived transaction contains an unknown entry")
                        if not {"journal.json", "COMMIT", "APPLIED", "reservation.json"}.issubset(operation_names):
                            raise _recovery_blocked("archived transaction is incomplete")
                        for file_name in set(operation_names) - {"post"}:
                            data, _ = _read_regular_at(
                                operation_fd,
                                file_name,
                                owner=authority.owner,
                                gid=authority.gid,
                                max_bytes=1024 * 1024,
                                exact_mode=_metadata_file_mode(file_name),
                                label=f"archived {file_name}",
                            )
                            total += len(data)
                        if "post" in operation_names:
                            post_fd = _open_directory_at(
                                operation_fd,
                                "post",
                                owner=authority.owner,
                                gid=authority.gid,
                                exact_mode=0o700,
                                label="archived postimages",
                            )
                            assert post_fd is not None
                            try:
                                post_names = _scandir_names(post_fd, limit=8, label="archived postimages")
                                if set(post_names) != {*_DECIDE_STATE_OUTPUTS, "receipt.json"}:
                                    raise _recovery_blocked("archived postimage set is incomplete")
                                for file_name in post_names:
                                    maximum = 1024 * 1024 if file_name == "receipt.json" else _MAX_STATE_BYTES
                                    data, _ = _read_regular_at(
                                        post_fd,
                                        file_name,
                                        owner=authority.owner,
                                        gid=authority.gid,
                                        max_bytes=maximum,
                                        exact_mode=_metadata_file_mode(file_name),
                                        label=f"archived postimage {file_name}",
                                    )
                                    total += len(data)
                            finally:
                                os.close(post_fd)
                    finally:
                        os.close(operation_fd)
        finally:
            os.close(child_fd)
    if "active" in top:
        active_stat = _entry_stat_at(metadata_fd, "active", label="active transaction")
        if active_stat is None or not stat.S_ISDIR(active_stat.st_mode):
            raise _recovery_blocked("active transaction is not a directory")
    if total > _MAX_METADATA_BYTES:
        raise _recovery_blocked("strict-decision metadata byte quota is exhausted")
    return archived, total


def _open_metadata_children(
    authority: _FileLock,
    *,
    create: bool,
) -> tuple[int | None, int | None, int | None]:
    metadata_fd = authority.metadata_fd(create=create)
    if metadata_fd is None:
        return None, None, None
    receipts_stat = _entry_stat_at(metadata_fd, "receipts", label="receipts directory")
    archive_stat = _entry_stat_at(metadata_fd, "archive", label="archive directory")
    if create:
        receipts_fd = _ensure_private_directory_at(
            metadata_fd, "receipts", owner=authority.owner, gid=authority.gid
        )
        archive_fd = _ensure_private_directory_at(
            metadata_fd, "archive", owner=authority.owner, gid=authority.gid
        )
    else:
        if receipts_stat is None and archive_stat is None:
            return metadata_fd, None, None
        if receipts_stat is None or archive_stat is None:
            raise _recovery_blocked("strict-decision metadata directory set is incomplete")
        receipts_fd = _open_directory_at(
            metadata_fd,
            "receipts",
            owner=authority.owner,
            gid=authority.gid,
            exact_mode=0o700,
        )
        archive_fd = _open_directory_at(
            metadata_fd,
            "archive",
            owner=authority.owner,
            gid=authority.gid,
            exact_mode=0o700,
        )
        assert receipts_fd is not None and archive_fd is not None
    return metadata_fd, receipts_fd, archive_fd


def _reservation_name(operation_id: str) -> str:
    return f"{_canonical_operation_id(operation_id, evidence=False)}.reserve"


def _reservation_temp_name(operation_id: str) -> str:
    return f".{_canonical_operation_id(operation_id, evidence=False)}.reserve.tmp"


def _read_reservation_temp_at(
    archive_fd: int,
    authority: _FileLock,
    name: str,
) -> tuple[bytes, os.stat_result]:
    data, value = _read_regular_at(
        archive_fd,
        name,
        owner=authority.owner,
        gid=authority.gid,
        max_bytes=64 * 1024,
        exact_mode=None,
        writable=True,
        label="archive reservation temporary",
    )
    if stat.S_IMODE(value.st_mode) not in {0o400, 0o600}:
        raise _recovery_blocked("archive reservation temporary has an unsafe mode")
    return data, value


def _remove_reservation_temp_at(
    archive_fd: int,
    authority: _FileLock,
    name: str,
    *,
    missing_ok: bool = False,
) -> None:
    """Remove a bounded non-authoritative reservation temporary durably."""

    entry = _entry_stat_at(archive_fd, name, label="archive reservation temporary")
    if entry is None:
        if missing_ok:
            return
        raise _recovery_blocked("archive reservation temporary disappeared during cleanup")
    # A crash can happen immediately after O_EXCL create, before fchmod has
    # neutralized the process umask. Such a non-authoritative entry may be
    # 0000/0200/0400/0600, zero length, or partial. The retained private archive
    # descriptor makes unlinking this exact fixed name safe without reading it.
    if (
        not stat.S_ISREG(entry.st_mode)
        or entry.st_uid != authority.owner
        or entry.st_gid != authority.gid
        or entry.st_nlink != 1
        or entry.st_size < 0
        or entry.st_size > 64 * 1024
        or entry.st_mode & (stat.S_ISUID | stat.S_ISGID)
        or stat.S_IMODE(entry.st_mode) & ~0o600
    ):
        raise _recovery_blocked("archive reservation temporary is not a provable crash image")
    try:
        os.unlink(name, dir_fd=archive_fd)
        _fsync_fd(archive_fd)
    except FileNotFoundError:
        if not missing_ok:
            raise _recovery_blocked("archive reservation temporary disappeared during cleanup")
    except OSError as exc:
        raise _recovery_blocked("cannot durably remove archive reservation temporary", exc) from exc


def _publish_reservation_at(
    archive_fd: int,
    authority: _FileLock,
    operation_id: str,
    data: bytes,
) -> os.stat_result:
    """Fully materialize a reservation temporary before no-replace publication."""

    operation_id = _canonical_operation_id(operation_id, evidence=False)
    final_name = _reservation_name(operation_id)
    temporary = _reservation_temp_name(operation_id)
    _fixed_name(final_name, "archive reservation")
    _fixed_name(temporary, "archive reservation temporary")
    if not 1 <= len(data) <= 64 * 1024:
        raise _typed_error("OUTPUT_TOO_LARGE", 422, "archive reservation exceeds its durable bound")
    flags = os.O_RDWR | os.O_CREAT | os.O_EXCL | os.O_CLOEXEC | os.O_NOFOLLOW
    created = False
    published = False
    fd: int | None = None
    try:
        fd = os.open(temporary, flags, 0o600, dir_fd=archive_fd)
        created = True
        _decide_fault("after_reservation_temp_open")
        os.fchown(fd, authority.owner, authority.gid)
        os.fchmod(fd, 0o600)
        _decide_fault("after_reservation_temp_create")

        # A dedicated split gives crash tests a real partial-byte boundary in
        # the production writer rather than constructing a synthetic fixture.
        split = max(1, len(data) // 2)
        _write_all(fd, data[:split])
        _decide_fault("after_reservation_temp_partial")
        _write_all(fd, data[split:])
        _decide_fault("after_reservation_temp_write")
        _fsync_fd(fd)
        _decide_fault("after_reservation_temp_fsync")

        before = os.fstat(fd)
        _validate_regular_stat(
            before,
            owner=authority.owner,
            gid=authority.gid,
            max_bytes=len(data),
            exact_mode=0o600,
            writable=True,
            allowed_links=(1,),
            label="archive reservation temporary",
        )
        _reject_acl(fd, "archive reservation temporary")
        if before.st_size != len(data):
            raise OSError(errno.EIO, "reservation temporary size mismatch")
        os.lseek(fd, 0, os.SEEK_SET)
        if _read_fd_exact(fd, len(data)) != data:
            raise OSError(errno.EIO, "reservation temporary content mismatch")
        after_read = os.fstat(fd)
        temporary_entry = os.stat(temporary, dir_fd=archive_fd, follow_symlinks=False)
        if (
            (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns)
            != (
                after_read.st_dev,
                after_read.st_ino,
                after_read.st_size,
                after_read.st_mtime_ns,
                after_read.st_ctime_ns,
            )
            or (after_read.st_dev, after_read.st_ino)
            != (temporary_entry.st_dev, temporary_entry.st_ino)
        ):
            raise OSError(errno.EAGAIN, "reservation temporary changed during validation")

        os.fchmod(fd, 0o400)
        _decide_fault("after_reservation_temp_finalize")
        _fsync_fd(fd)
        _decide_fault("after_reservation_temp_finalize_fsync")
        finalized = os.fstat(fd)
        _validate_regular_stat(
            finalized,
            owner=authority.owner,
            gid=authority.gid,
            max_bytes=len(data),
            exact_mode=0o400,
            writable=False,
            allowed_links=(1,),
            label="finalized archive reservation temporary",
        )
        _reject_acl(fd, "finalized archive reservation temporary")
        if finalized.st_size != len(data):
            raise OSError(errno.EIO, "finalized reservation temporary size mismatch")

        _rename_noreplace(archive_fd, temporary, archive_fd, final_name)
        published = True
        _decide_fault("after_reservation_rename")
        final_entry = os.stat(final_name, dir_fd=archive_fd, follow_symlinks=False)
        final_value = os.fstat(fd)
        if (final_value.st_dev, final_value.st_ino) != (final_entry.st_dev, final_entry.st_ino):
            raise OSError(errno.EAGAIN, "published reservation entry identity mismatch")
        _fsync_fd(archive_fd)
        _decide_fault("after_reservation_directory_fsync")
        return final_value
    except BaseException as exc:
        if created and not published and isinstance(exc, Exception):
            try:
                _remove_reservation_temp_at(
                    archive_fd,
                    authority,
                    temporary,
                    missing_ok=True,
                )
            except BaseException as cleanup_error:
                raise cleanup_error from exc
        if isinstance(exc, ZenithError):
            raise
        if isinstance(exc, OSError):
            raise _recovery_blocked("atomic archive reservation publication failed", exc) from exc
        raise
    finally:
        if fd is not None:
            os.close(fd)


def _read_reservation_at(
    archive_fd: int,
    authority: _FileLock,
    operation_id: str,
) -> tuple[bytes, dict[str, Any]]:
    name = _reservation_name(operation_id)
    data, _ = _read_regular_at(
        archive_fd,
        name,
        owner=authority.owner,
        gid=authority.gid,
        max_bytes=64 * 1024,
        exact_mode=0o400,
        label="archive reservation",
    )
    return data, _validate_reservation_bytes(data, authority=authority, operation_id=operation_id)


def _remove_uncommitted_tree(
    authority: _FileLock,
    metadata_fd: int,
    archive_fd: int,
    active_fd: int,
    reservation_name: str,
) -> None:
    """Durably remove one shape-validated pre-COMMIT staging tree."""

    names = _scandir_names(active_fd, limit=5, label="uncommitted active transaction")
    if set(names) - {"post", "journal.json", "reservation.json"}:
        raise _recovery_blocked("uncommitted active transaction contains an ambiguous entry")
    if "post" in names:
        post_fd = _open_directory_at(
            active_fd,
            "post",
            owner=authority.owner,
            gid=authority.gid,
            exact_mode=0o700,
            label="uncommitted postimages",
        )
        assert post_fd is not None
        try:
            post_names = _scandir_names(post_fd, limit=8, label="uncommitted postimages")
            if set(post_names) - {*_DECIDE_STATE_OUTPUTS, "receipt.json"}:
                raise _recovery_blocked("uncommitted postimages contain an ambiguous entry")
            for name in post_names:
                maximum = 1024 * 1024 if name == "receipt.json" else _MAX_STATE_BYTES
                _read_regular_at(
                    post_fd,
                    name,
                    owner=authority.owner,
                    gid=authority.gid,
                    max_bytes=maximum,
                    exact_mode=_metadata_file_mode(name),
                    label=f"uncommitted postimage {name}",
                )
            for name in post_names:
                os.unlink(name, dir_fd=post_fd)
            _fsync_fd(post_fd)
        except OSError as exc:
            raise _recovery_blocked("cannot remove uncommitted postimages", exc) from exc
        finally:
            os.close(post_fd)
        try:
            os.rmdir("post", dir_fd=active_fd)
        except OSError as exc:
            raise _recovery_blocked("cannot remove uncommitted postimage directory", exc) from exc
    for name in ("journal.json", "reservation.json"):
        if name in names:
            maximum = 1024 * 1024 if name == "journal.json" else 64 * 1024
            _read_regular_at(
                active_fd,
                name,
                owner=authority.owner,
                gid=authority.gid,
                max_bytes=maximum,
                exact_mode=(0o600 if name == "journal.json" else 0o400),
                label=f"uncommitted {name}",
            )
            try:
                os.unlink(name, dir_fd=active_fd)
            except OSError as exc:
                raise _recovery_blocked(f"cannot remove uncommitted {name}", exc) from exc
    _fsync_fd(active_fd)
    try:
        os.rmdir("active", dir_fd=metadata_fd)
        _fsync_fd(metadata_fd)
        os.unlink(reservation_name, dir_fd=archive_fd)
        _fsync_fd(archive_fd)
    except OSError as exc:
        raise _recovery_blocked("cannot durably remove uncommitted transaction", exc) from exc
    authority.revalidate()


def _verify_live_base_snapshot(path: Path, reservation: Mapping[str, Any]) -> None:
    snapshot = _read_decide_snapshot(path, recovery_required=False)
    if snapshot["hashes"] != reservation["input_hashes"]:
        raise _recovery_blocked("uncommitted transaction is ambiguous because live state changed")


def _read_raw_receipt_at(
    receipts_fd: int,
    authority: _FileLock,
    operation_id: str,
) -> tuple[bytes, os.stat_result] | None:
    name = f"{operation_id}.json"
    if _entry_stat_at(receipts_fd, name, label="permanent receipt") is None:
        return None
    return _read_regular_at(
        receipts_fd,
        name,
        owner=authority.owner,
        gid=authority.gid,
        max_bytes=1024 * 1024,
        exact_mode=0o400,
        label="permanent receipt",
    )


def _publish_receipt_at(
    receipts_fd: int,
    authority: _FileLock,
    operation_id: str,
    data: bytes,
) -> None:
    destination = f"{operation_id}.json"
    temporary = f".{operation_id}.receipt.tmp"
    existing = _read_raw_receipt_at(receipts_fd, authority, operation_id)
    temporary_stat = _entry_stat_at(receipts_fd, temporary, label="receipt temporary")
    if existing is not None:
        if existing[0] != data:
            raise _recovery_blocked("conflicting permanent receipt")
        if temporary_stat is not None:
            staged, _ = _read_regular_at(
                receipts_fd,
                temporary,
                owner=authority.owner,
                gid=authority.gid,
                max_bytes=1024 * 1024,
                exact_mode=0o400,
                label="receipt temporary",
            )
            if staged != data:
                raise _recovery_blocked("conflicting receipt temporary")
            try:
                os.unlink(temporary, dir_fd=receipts_fd)
                _fsync_fd(receipts_fd)
            except OSError as exc:
                raise _recovery_blocked("cannot remove completed receipt temporary", exc) from exc
        return
    if temporary_stat is None:
        _write_exclusive_at(
            receipts_fd,
            temporary,
            data,
            0o400,
            owner=authority.owner,
            gid=authority.gid,
            label="receipt temporary",
        )
    else:
        staged, _ = _read_regular_at(
            receipts_fd,
            temporary,
            owner=authority.owner,
            gid=authority.gid,
            max_bytes=1024 * 1024,
            exact_mode=0o400,
            label="receipt temporary",
        )
        if staged != data:
            raise _recovery_blocked("conflicting receipt temporary")
    try:
        _rename_noreplace(receipts_fd, temporary, receipts_fd, destination)
        _decide_fault("after_receipt_link")
        _fsync_fd(receipts_fd)
        _decide_fault("after_receipt_link_fsync")
        _decide_fault("after_receipt_temp_unlink")
    except FileExistsError:
        existing = _read_raw_receipt_at(receipts_fd, authority, operation_id)
        if existing is None or existing[0] != data:
            raise _recovery_blocked("receipt destination collided")
        if _entry_stat_at(receipts_fd, temporary, label="receipt temporary") is not None:
            staged, _ = _read_regular_at(
                receipts_fd,
                temporary,
                owner=authority.owner,
                gid=authority.gid,
                max_bytes=1024 * 1024,
                exact_mode=0o400,
                label="receipt temporary",
            )
            if staged != data:
                raise _recovery_blocked("receipt temporary collided")
            os.unlink(temporary, dir_fd=receipts_fd)
            _fsync_fd(receipts_fd)
    except ZenithError:
        raise
    except OSError as exc:
        raise _recovery_blocked("cannot publish permanent receipt", exc) from exc
    existing = _read_raw_receipt_at(receipts_fd, authority, operation_id)
    if existing is None or existing[0] != data:
        raise _recovery_blocked("published receipt verification failed")


def _live_postimage_status(
    authority: _FileLock,
    name: str,
    staged: bytes,
    pre_hash: str,
    post_hash: str,
) -> str:
    current, _ = _read_regular_at(
        authority.root_fd,
        name,
        owner=authority.owner,
        gid=authority.gid,
        max_bytes=_MAX_STATE_BYTES,
        exact_mode=0o600,
        label=f"live {name}",
    )
    digest = _sha256_bytes(current)
    if digest == post_hash:
        if current != staged:
            raise _recovery_blocked(f"live {name} collides with the committed postimage digest")
        return "postimage"
    if digest == pre_hash:
        return "preimage"
    raise _recovery_blocked(f"live {name} is neither the transaction preimage nor postimage")


def _install_postimage_at(
    authority: _FileLock,
    operation_id: str,
    name: str,
    staged: bytes,
    pre_hash: str,
    post_hash: str,
) -> None:
    status = _live_postimage_status(authority, name, staged, pre_hash, post_hash)
    if status == "postimage":
        return
    temporary = f".{operation_id}.{name}.redo"
    temporary_stat = _entry_stat_at(authority.root_fd, temporary, label=f"redo temporary for {name}")
    if temporary_stat is None:
        _write_exclusive_at(
            authority.root_fd,
            temporary,
            staged,
            0o600,
            owner=authority.owner,
            gid=authority.gid,
            label=f"redo temporary for {name}",
        )
    else:
        existing, _ = _read_regular_at(
            authority.root_fd,
            temporary,
            owner=authority.owner,
            gid=authority.gid,
            max_bytes=_MAX_STATE_BYTES,
            exact_mode=0o600,
            label=f"redo temporary for {name}",
        )
        if existing != staged:
            raise _recovery_blocked(f"conflicting redo temporary for {name}")
    if _live_postimage_status(authority, name, staged, pre_hash, post_hash) != "preimage":
        try:
            os.unlink(temporary, dir_fd=authority.root_fd)
        except FileNotFoundError:
            pass
        return
    try:
        os.rename(
            temporary,
            name,
            src_dir_fd=authority.root_fd,
            dst_dir_fd=authority.root_fd,
        )
        _decide_fault(f"after_install:{name}")
    except OSError as exc:
        raise _recovery_blocked(f"postimage installation failed for {name}", exc) from exc
    if _live_postimage_status(authority, name, staged, pre_hash, post_hash) != "postimage":
        raise _recovery_blocked(f"installed postimage verification failed for {name}")


def _receipt_matches_journal(
    receipt: Mapping[str, Any],
    journal: Mapping[str, Any],
) -> bool:
    return (
        receipt["request_sha256"] == journal["request_sha256"]
        and receipt["evidence_manifest_sha256"] == journal["evidence_manifest_sha256"]
        and receipt["base_revision"] == journal["base_revision"]
        and receipt["committed_revision"] == journal["result_revision"]
        and receipt["committed_at"] == journal["committed_at"]
        and receipt["input_hashes"] == journal["input_hashes"]
        and receipt["output_hashes"]
        == {name: journal["outputs"][name]["sha256"] for name in _DECIDE_STATE_OUTPUTS}
        and receipt["accepted_evidence"] == journal["evidence_artifacts"]
        and _sha256_canonical(receipt["response"]) == journal["response_sha256"]
    )


def _load_committed_active(
    path: Path,
    authority: _FileLock,
    metadata_fd: int,
    archive_fd: int,
    active_fd: int,
) -> dict[str, Any]:
    names = _scandir_names(active_fd, limit=7, label="active committed transaction")
    allowed = {"post", "journal.json", "COMMIT", "APPLIED", "reservation.json"}
    if set(names) - allowed or not {"post", "journal.json", "COMMIT", "reservation.json"}.issubset(names):
        raise _recovery_blocked("committed active transaction has an incomplete or unknown entry set")
    reservation_bytes, _ = _read_regular_at(
        active_fd,
        "reservation.json",
        owner=authority.owner,
        gid=authority.gid,
        max_bytes=64 * 1024,
        exact_mode=0o400,
        label="active reservation",
    )
    reservation = _validate_reservation_bytes(reservation_bytes, authority=authority)
    operation_id = reservation["operation_id"]
    archive_reservation_bytes, archive_reservation = _read_reservation_at(
        archive_fd, authority, operation_id
    )
    if archive_reservation_bytes != reservation_bytes or archive_reservation != reservation:
        raise _recovery_blocked("active and archive reservation bindings disagree")
    journal_bytes, _ = _read_regular_at(
        active_fd,
        "journal.json",
        owner=authority.owner,
        gid=authority.gid,
        max_bytes=1024 * 1024,
        exact_mode=0o600,
        label="transaction journal",
    )
    journal = _validate_journal_bytes(journal_bytes)
    journal_sha256 = _sha256_bytes(journal_bytes)
    if (
        journal["operation_id"] != operation_id
        or journal["mission_id"] != path.name
        or journal["request_sha256"] != reservation["request_sha256"]
        or journal["input_hashes"] != reservation["input_hashes"]
        or journal["reservation_sha256"] != _sha256_bytes(reservation_bytes)
    ):
        raise _recovery_blocked("journal and reservation bindings disagree")
    _validate_transaction_authority(authority, journal)
    if _entry_stat_at(archive_fd, operation_id, label="archive destination") is not None:
        raise _recovery_blocked("operation archive collided while an active transaction exists")
    commit_bytes, _ = _read_regular_at(
        active_fd,
        "COMMIT",
        owner=authority.owner,
        gid=authority.gid,
        max_bytes=4096,
        exact_mode=0o400,
        label="COMMIT marker",
    )
    marker = _validate_commit_bytes(
        commit_bytes,
        journal_sha256=journal_sha256,
        reservation_sha256=_sha256_bytes(reservation_bytes),
    )
    post_fd = _open_directory_at(
        active_fd,
        "post",
        owner=authority.owner,
        gid=authority.gid,
        exact_mode=0o700,
        label="committed postimages",
    )
    assert post_fd is not None
    try:
        post_names = _scandir_names(post_fd, limit=8, label="committed postimages")
        if set(post_names) != {*_DECIDE_STATE_OUTPUTS, "receipt.json"}:
            raise _recovery_blocked("committed postimage set is incomplete")
        postimages: dict[str, bytes] = {}
        for name in (*_DECIDE_STATE_OUTPUTS, "receipt.json"):
            descriptor = journal["outputs"][name]
            maximum = 1024 * 1024 if name == "receipt.json" else _MAX_STATE_BYTES
            staged, _ = _read_regular_at(
                post_fd,
                name,
                owner=authority.owner,
                gid=authority.gid,
                max_bytes=maximum,
                exact_mode=int(descriptor["mode"], 8),
                label=f"committed postimage {name}",
            )
            if len(staged) != descriptor["size"]:
                raise _recovery_blocked(f"staged postimage size mismatch for {name}")
            if name == "receipt.json":
                receipt = _validate_receipt_bytes(
                    staged,
                    mission_id=path.name,
                    operation_id=operation_id,
                    journal_sha256=journal_sha256,
                )
                if (
                    _receipt_body_hash(receipt) != descriptor["sha256"]
                    or _sha256_bytes(staged) != marker["receipt_sha256"]
                    or receipt["commit_binding_sha256"] != marker["commit_binding_sha256"]
                    or not _receipt_matches_journal(receipt, journal)
                ):
                    raise _recovery_blocked("staged receipt does not match its committed journal")
            elif _sha256_bytes(staged) != descriptor["sha256"]:
                raise _recovery_blocked(f"staged postimage digest mismatch for {name}")
            postimages[name] = staged
    finally:
        os.close(post_fd)
    for name in ("contract.json", "plan.json"):
        current, _ = _read_regular_at(
            authority.root_fd,
            name,
            owner=authority.owner,
            gid=authority.gid,
            max_bytes=_MAX_STATE_BYTES,
            exact_mode=0o600,
            label=f"read-only input {name}",
        )
        if _sha256_bytes(current) != journal["input_hashes"][name]:
            raise _recovery_blocked(f"read-only decide input changed during recovery: {name}")
    return {
        "names": names,
        "operation_id": operation_id,
        "reservation_name": _reservation_name(operation_id),
        "reservation_bytes": reservation_bytes,
        "journal": journal,
        "journal_bytes": journal_bytes,
        "journal_sha256": journal_sha256,
        "marker": marker,
        "postimages": postimages,
        "receipt": receipt,
    }


def _archive_active_at(
    authority: _FileLock,
    metadata_fd: int,
    archive_fd: int,
    operation_id: str,
) -> None:
    try:
        _rename_noreplace(metadata_fd, "active", archive_fd, operation_id)
        _fsync_fd(archive_fd)
        _fsync_fd(metadata_fd)
        reserve_name = _reservation_name(operation_id)
        os.unlink(reserve_name, dir_fd=archive_fd)
        _fsync_fd(archive_fd)
        _decide_fault("after_archive")
    except FileExistsError as exc:
        raise _recovery_blocked("transaction archive destination collided", exc) from exc
    except ZenithError:
        raise
    except OSError as exc:
        raise _recovery_blocked("transaction archival failed", exc) from exc
    authority.revalidate()


def _verify_applied_then_archive(
    authority: _FileLock,
    metadata_fd: int,
    archive_fd: int,
    receipts_fd: int,
    active_fd: int,
    transaction: Mapping[str, Any],
) -> None:
    expected_applied = (transaction["journal_sha256"] + "\n").encode("ascii")
    applied_bytes, _ = _read_regular_at(
        active_fd,
        "APPLIED",
        owner=authority.owner,
        gid=authority.gid,
        max_bytes=256,
        exact_mode=0o400,
        label="APPLIED marker",
    )
    if applied_bytes != expected_applied:
        raise _recovery_blocked("APPLIED marker digest mismatch")
    journal = transaction["journal"]
    for name in _DECIDE_STATE_OUTPUTS:
        if _live_postimage_status(
            authority,
            name,
            transaction["postimages"][name],
            journal["input_hashes"][name],
            journal["outputs"][name]["sha256"],
        ) != "postimage":
            raise _recovery_blocked(f"APPLIED transaction lacks exact live postimage {name}")
    permanent = _read_raw_receipt_at(
        receipts_fd,
        authority,
        transaction["operation_id"],
    )
    if permanent is None or permanent[0] != transaction["postimages"]["receipt.json"]:
        raise _recovery_blocked("APPLIED transaction lacks its exact permanent receipt")
    stored = _validate_receipt_bytes(
        permanent[0],
        mission_id=authority.root_path.name,
        operation_id=transaction["operation_id"],
        journal_sha256=transaction["journal_sha256"],
    )
    if stored != transaction["receipt"]:
        raise _recovery_blocked("APPLIED permanent receipt does not match staged receipt")
    _validate_transaction_authority(authority, journal)
    _archive_active_at(
        authority,
        metadata_fd,
        archive_fd,
        transaction["operation_id"],
    )


def _recover_committed_active(
    path: Path,
    authority: _FileLock,
    metadata_fd: int,
    receipts_fd: int,
    archive_fd: int,
    active_fd: int,
) -> None:
    transaction = _load_committed_active(path, authority, metadata_fd, archive_fd, active_fd)
    if "APPLIED" in transaction["names"]:
        # APPLIED is terminal and verify-only.  No redo or receipt repair may run.
        _verify_applied_then_archive(
            authority,
            metadata_fd,
            archive_fd,
            receipts_fd,
            active_fd,
            transaction,
        )
        return
    journal = transaction["journal"]
    for name in _DECIDE_STATE_OUTPUTS:
        _validate_transaction_authority(authority, journal)
        _install_postimage_at(
            authority,
            transaction["operation_id"],
            name,
            transaction["postimages"][name],
            journal["input_hashes"][name],
            journal["outputs"][name]["sha256"],
        )
    try:
        _fsync_fd(authority.root_fd)
    except OSError as exc:
        raise _recovery_blocked("mission directory durability failed after postimage installation", exc) from exc
    _validate_transaction_authority(authority, journal)
    _publish_receipt_at(
        receipts_fd,
        authority,
        transaction["operation_id"],
        transaction["postimages"]["receipt.json"],
    )
    _decide_fault("after_receipt_publish")
    _validate_transaction_authority(authority, journal)
    _write_exclusive_at(
        active_fd,
        "APPLIED",
        (transaction["journal_sha256"] + "\n").encode("ascii"),
        0o400,
        owner=authority.owner,
        gid=authority.gid,
        label="APPLIED marker",
    )
    try:
        _fsync_fd(active_fd)
    except OSError as exc:
        raise _recovery_blocked("APPLIED directory durability failed", exc) from exc
    _decide_fault("after_applied")
    # Verify all terminal bytes before the only archival transition.
    refreshed = _load_committed_active(path, authority, metadata_fd, archive_fd, active_fd)
    _verify_applied_then_archive(
        authority,
        metadata_fd,
        archive_fd,
        receipts_fd,
        active_fd,
        refreshed,
    )

def _read_archived_receipt(
    path: Path,
    authority: _FileLock,
    archive_fd: int,
    receipts_fd: int,
    operation_id: str,
    receipt_bytes: bytes,
    *,
    request_sha256: str | None = None,
) -> dict[str, Any]:
    operation_fd = _open_directory_at(
        archive_fd,
        operation_id,
        owner=authority.owner,
        gid=authority.gid,
        exact_mode=0o700,
        label="archived transaction",
    )
    assert operation_fd is not None
    try:
        names = _scandir_names(operation_fd, limit=7, label="archived transaction")
        expected_names = {"post", "journal.json", "COMMIT", "APPLIED", "reservation.json"}
        if set(names) != expected_names:
            raise _recovery_blocked("archived transaction has an incomplete or unknown entry set")
        reservation_bytes, _ = _read_regular_at(
            operation_fd,
            "reservation.json",
            owner=authority.owner,
            gid=authority.gid,
            max_bytes=64 * 1024,
            exact_mode=0o400,
            label="archived reservation",
        )
        reservation = _validate_reservation_bytes(
            reservation_bytes,
            authority=authority,
            operation_id=operation_id,
        )
        journal_bytes, _ = _read_regular_at(
            operation_fd,
            "journal.json",
            owner=authority.owner,
            gid=authority.gid,
            max_bytes=1024 * 1024,
            exact_mode=0o600,
            label="archived journal",
        )
        journal = _validate_journal_bytes(journal_bytes)
        journal_sha256 = _sha256_bytes(journal_bytes)
        if (
            journal["mission_id"] != path.name
            or journal["operation_id"] != operation_id
            or journal["request_sha256"] != reservation["request_sha256"]
            or journal["input_hashes"] != reservation["input_hashes"]
            or journal["reservation_sha256"] != _sha256_bytes(reservation_bytes)
        ):
            raise _recovery_blocked("archived journal and reservation disagree")
        _validate_transaction_authority(authority, journal)
        commit_bytes, _ = _read_regular_at(
            operation_fd,
            "COMMIT",
            owner=authority.owner,
            gid=authority.gid,
            max_bytes=4096,
            exact_mode=0o400,
            label="archived COMMIT marker",
        )
        marker = _validate_commit_bytes(
            commit_bytes,
            journal_sha256=journal_sha256,
            reservation_sha256=_sha256_bytes(reservation_bytes),
        )
        applied_bytes, _ = _read_regular_at(
            operation_fd,
            "APPLIED",
            owner=authority.owner,
            gid=authority.gid,
            max_bytes=256,
            exact_mode=0o400,
            label="archived APPLIED marker",
        )
        if applied_bytes != (journal_sha256 + "\n").encode("ascii"):
            raise _recovery_blocked("archived APPLIED marker mismatch")
        receipt = _validate_receipt_bytes(
            receipt_bytes,
            mission_id=path.name,
            operation_id=operation_id,
            request_sha256=request_sha256,
            journal_sha256=journal_sha256,
        )
        if not _receipt_matches_journal(receipt, journal):
            raise _recovery_blocked("permanent receipt and archived journal disagree")
        post_fd = _open_directory_at(
            operation_fd,
            "post",
            owner=authority.owner,
            gid=authority.gid,
            exact_mode=0o700,
            label="archived postimages",
        )
        assert post_fd is not None
        try:
            post_names = _scandir_names(post_fd, limit=8, label="archived postimages")
            if set(post_names) != {*_DECIDE_STATE_OUTPUTS, "receipt.json"}:
                raise _recovery_blocked("archived postimage set is incomplete")
            for name in (*_DECIDE_STATE_OUTPUTS, "receipt.json"):
                descriptor = journal["outputs"][name]
                maximum = 1024 * 1024 if name == "receipt.json" else _MAX_STATE_BYTES
                data, _ = _read_regular_at(
                    post_fd,
                    name,
                    owner=authority.owner,
                    gid=authority.gid,
                    max_bytes=maximum,
                    exact_mode=int(descriptor["mode"], 8),
                    label=f"archived postimage {name}",
                )
                if len(data) != descriptor["size"]:
                    raise _recovery_blocked(f"archived postimage size mismatch for {name}")
                if name == "receipt.json":
                    if (
                        data != receipt_bytes
                        or _receipt_body_hash(receipt) != descriptor["sha256"]
                        or _sha256_bytes(data) != marker["receipt_sha256"]
                        or receipt["commit_binding_sha256"] != marker["commit_binding_sha256"]
                    ):
                        raise _recovery_blocked("archived receipt postimage mismatch")
                elif _sha256_bytes(data) != descriptor["sha256"]:
                    raise _recovery_blocked(f"archived postimage digest mismatch for {name}")
        finally:
            os.close(post_fd)
        return receipt
    finally:
        os.close(operation_fd)


def _read_permanent_receipt(
    path: Path,
    operation_id: str,
    *,
    request_sha256: str | None = None,
) -> dict[str, Any] | None:
    authority = _require_transaction_authority(path)
    operation_id = _canonical_operation_id(operation_id, evidence=False)
    metadata_fd, receipts_fd, archive_fd = _open_metadata_children(authority, create=False)
    if metadata_fd is None or receipts_fd is None or archive_fd is None:
        return None
    try:
        permanent = _read_raw_receipt_at(receipts_fd, authority, operation_id)
        archive_stat = _entry_stat_at(archive_fd, operation_id, label="operation archive")
        reserve_stat = _entry_stat_at(
            archive_fd,
            _reservation_name(operation_id),
            label="operation archive reservation",
        )
        if permanent is None:
            if archive_stat is not None or reserve_stat is not None:
                raise _recovery_blocked("operation archive/reservation exists without a permanent receipt")
            return None
        if archive_stat is None or reserve_stat is not None:
            raise _recovery_blocked("permanent receipt lacks one exact completed archive")
        return _read_archived_receipt(
            path,
            authority,
            archive_fd,
            receipts_fd,
            operation_id,
            permanent[0],
            request_sha256=request_sha256,
        )
    finally:
        os.close(receipts_fd)
        os.close(archive_fd)


def _recover_no_active(
    path: Path,
    authority: _FileLock,
    metadata_fd: int,
    receipts_fd: int,
    archive_fd: int,
) -> None:
    receipt_names = _scandir_names(
        receipts_fd,
        limit=(_MAX_ARCHIVED_OPERATIONS * 2) + 16,
        label="receipts",
    )
    permanent_ids: set[str] = set()
    for name in receipt_names:
        if re.fullmatch(r"[0-9a-f-]{36}\.json", name):
            operation_id = _canonical_operation_id(name[:-5], evidence=False)
            permanent_ids.add(operation_id)
        elif re.fullmatch(r"\.[0-9a-f-]{36}\.receipt\.tmp", name):
            raise _recovery_blocked("orphaned receipt temporary exists without an active transaction")
        else:
            raise _recovery_blocked("receipts directory contains an unknown entry")
    archive_names = _scandir_names(
        archive_fd,
        limit=(_MAX_ARCHIVED_OPERATIONS * 3) + 16,
        label="archive",
    )
    reservation_temporaries: list[str] = []
    for name in archive_names:
        temporary_match = re.fullmatch(r"\.([0-9a-f-]{36})\.reserve\.tmp", name)
        if temporary_match is not None:
            _canonical_operation_id(temporary_match.group(1), evidence=False)
            reservation_temporaries.append(name)
    # A reservation temporary has never carried authority. With no active
    # transaction, every zero/partial/finalized pre-rename image is therefore
    # provably removable without parsing or changing live mission bytes.
    for name in reservation_temporaries:
        _remove_reservation_temp_at(archive_fd, authority, name)

    archive_ids: set[str] = set()
    reservation_ids: set[str] = set()
    for name in archive_names:
        if name in reservation_temporaries:
            continue
        if name.endswith(".reserve"):
            reservation_ids.add(_canonical_operation_id(name[:-8], evidence=False))
        else:
            archive_ids.add(_canonical_operation_id(name, evidence=False))
    for operation_id in sorted(reservation_ids):
        reservation_bytes, reservation = _read_reservation_at(
            archive_fd,
            authority,
            operation_id,
        )
        has_archive = operation_id in archive_ids
        has_receipt = operation_id in permanent_ids
        if has_archive != has_receipt:
            raise _recovery_blocked("archive reservation has an ambiguous receipt/archive state")
        if has_archive:
            permanent = _read_raw_receipt_at(receipts_fd, authority, operation_id)
            assert permanent is not None
            _read_archived_receipt(
                path,
                authority,
                archive_fd,
                receipts_fd,
                operation_id,
                permanent[0],
            )
        else:
            _verify_live_base_snapshot(path, reservation)
        try:
            os.unlink(_reservation_name(operation_id), dir_fd=archive_fd)
            _fsync_fd(archive_fd)
        except OSError as exc:
            raise _recovery_blocked("cannot clear completed/uncommitted archive reservation", exc) from exc
    if permanent_ids != archive_ids:
        raise _recovery_blocked("permanent receipt and archive operation sets disagree")
    for operation_id in sorted(permanent_ids):
        permanent = _read_raw_receipt_at(receipts_fd, authority, operation_id)
        assert permanent is not None
        _read_archived_receipt(
            path,
            authority,
            archive_fd,
            receipts_fd,
            operation_id,
            permanent[0],
        )
    _metadata_usage(authority, metadata_fd)


def _recover_active_transaction_impl(path: Path) -> None:
    authority = _require_transaction_authority(path)
    authority.recovery_complete = False
    metadata_fd = authority.metadata_fd(create=False)
    if metadata_fd is None:
        authority.recovery_complete = True
        return
    top_names = _scandir_names(metadata_fd, limit=4, label="strict-decision metadata")
    if set(top_names) - {"active", "receipts", "archive"}:
        raise _recovery_blocked("strict-decision metadata contains an unknown entry")
    # A crash while initially creating empty metadata is uncommitted.  Complete
    # the two fixed private directories only when no authority entry exists.
    missing_children = {"receipts", "archive"} - set(top_names)
    if missing_children:
        if "active" in top_names:
            raise _recovery_blocked("active transaction lacks required metadata directories")
        for existing in ({"receipts", "archive"} & set(top_names)):
            existing_fd = _open_directory_at(
                metadata_fd,
                existing,
                owner=authority.owner,
                gid=authority.gid,
                exact_mode=0o700,
            )
            assert existing_fd is not None
            try:
                if _scandir_names(existing_fd, limit=1, label=existing):
                    raise _recovery_blocked("partial metadata creation is ambiguous")
            finally:
                os.close(existing_fd)
        for child in sorted(missing_children):
            fd = _ensure_private_directory_at(
                metadata_fd,
                child,
                owner=authority.owner,
                gid=authority.gid,
            )
            os.close(fd)
    metadata_fd2, receipts_fd, archive_fd = _open_metadata_children(authority, create=False)
    assert metadata_fd2 == metadata_fd and receipts_fd is not None and archive_fd is not None
    try:
        active_stat = _entry_stat_at(metadata_fd, "active", label="active transaction")
        if active_stat is None:
            _recover_no_active(path, authority, metadata_fd, receipts_fd, archive_fd)
            authority.recovery_complete = True
            return
        active_fd = _open_directory_at(
            metadata_fd,
            "active",
            owner=authority.owner,
            gid=authority.gid,
            exact_mode=0o700,
            label="active transaction",
        )
        assert active_fd is not None
        try:
            commit_stat = _entry_stat_at(active_fd, "COMMIT", label="COMMIT marker")
            if commit_stat is None:
                active_names = _scandir_names(
                    active_fd,
                    limit=5,
                    label="uncommitted active transaction",
                )
                if set(active_names) - {"post", "journal.json", "reservation.json"}:
                    raise _recovery_blocked("uncommitted active transaction contains an ambiguous entry")
                active_archive_names = _scandir_names(
                    archive_fd,
                    limit=(_MAX_ARCHIVED_OPERATIONS * 3) + 16,
                    label="archive",
                )
                if any(
                    re.fullmatch(r"\.([0-9a-f-]{36})\.reserve\.tmp", name)
                    for name in active_archive_names
                ):
                    raise _recovery_blocked(
                        "active transaction collides with an archive reservation temporary"
                    )
                reservation_names = [
                    name for name in active_archive_names if name.endswith(".reserve")
                ]
                if len(reservation_names) != 1:
                    raise _recovery_blocked("uncommitted active transaction lacks one exact archive reservation")
                operation_id = _canonical_operation_id(reservation_names[0][:-8], evidence=False)
                archive_reservation_bytes, reservation = _read_reservation_at(
                    archive_fd,
                    authority,
                    operation_id,
                )
                if "reservation.json" in active_names:
                    active_reservation_bytes, _ = _read_regular_at(
                        active_fd,
                        "reservation.json",
                        owner=authority.owner,
                        gid=authority.gid,
                        max_bytes=64 * 1024,
                        exact_mode=0o400,
                        label="active reservation",
                    )
                    if active_reservation_bytes != archive_reservation_bytes:
                        raise _recovery_blocked("uncommitted active/archive reservations disagree")
                _verify_live_base_snapshot(path, reservation)
                _remove_uncommitted_tree(
                    authority,
                    metadata_fd,
                    archive_fd,
                    active_fd,
                    reservation_names[0],
                )
                authority.recovery_complete = True
                return
            _recover_committed_active(
                path,
                authority,
                metadata_fd,
                receipts_fd,
                archive_fd,
                active_fd,
            )
            authority.recovery_complete = True
        finally:
            os.close(active_fd)
    finally:
        os.close(receipts_fd)
        os.close(archive_fd)


def _recover_active_transaction(path: Path) -> None:
    try:
        _recover_active_transaction_impl(path)
    except ZenithError:
        authority = _current_lock_for(path)
        if authority is not None:
            authority.recovery_complete = False
        raise
    except OSError as exc:
        authority = _current_lock_for(path)
        if authority is not None:
            authority.recovery_complete = False
        raise _recovery_blocked("decide transaction recovery failed", exc) from exc


def _decide_fault(point: str) -> None:
    """Internal deterministic fault hook used only by temporary-fixture tests."""

    del point


def _canonical_identifier(value: Any, label: str, *, evidence: bool = False) -> str:
    try:
        result = _valid_id(value, label)
    except ZenithError as exc:
        if evidence:
            raise _typed_error("INVALID_EVIDENCE", 422, str(exc)) from exc
        raise
    if unicodedata.normalize("NFC", result) != result:
        error = _typed_error("INVALID_EVIDENCE", 422, f"{label} must be NFC-normalized") if evidence else ZenithError(
            f"{label} must be NFC-normalized"
        )
        raise error
    return result


def _canonical_operation_id(value: Any, *, evidence: bool = True) -> str:
    label = "operation_id"
    if not isinstance(value, str) or len(value) != 36 or value.lower() != value:
        error = _typed_error("INVALID_EVIDENCE", 422, f"{label} must be a canonical lowercase RFC 4122 UUIDv4") if evidence else ZenithError(
            f"{label} must be a canonical lowercase RFC 4122 UUIDv4"
        )
        raise error
    try:
        parsed = uuid.UUID(value)
    except (ValueError, AttributeError) as exc:
        error = _typed_error("INVALID_EVIDENCE", 422, f"{label} must be a canonical lowercase RFC 4122 UUIDv4") if evidence else ZenithError(
            f"{label} must be a canonical lowercase RFC 4122 UUIDv4"
        )
        raise error from exc
    if str(parsed) != value or parsed.version != 4 or parsed.variant != uuid.RFC_4122:
        error = _typed_error("INVALID_EVIDENCE", 422, f"{label} must be a canonical lowercase RFC 4122 UUIDv4") if evidence else ZenithError(
            f"{label} must be a canonical lowercase RFC 4122 UUIDv4"
        )
        raise error
    return value


def _normalise_expected_hashes(value: Any) -> dict[str, str]:
    if not isinstance(value, dict):
        raise _typed_error(
            "PRECONDITION_FAILED", 412, "expected_file_hashes must be the exact seven-key hash object"
        )
    if set(value) != set(_DECIDE_HASH_FILES):
        raise _typed_error(
            "PRECONDITION_FAILED",
            412,
            f"expected_file_hashes must contain exactly {list(_DECIDE_HASH_FILES)}",
        )
    return {name: _validate_hash(value[name], f"expected_file_hashes[{name}]") for name in _DECIDE_HASH_FILES}


def _normalise_decide_actions(decisions: Any) -> list[dict[str, Any]]:
    raw_values = _decision_list(decisions)
    if not raw_values or len(raw_values) > _MAX_EVIDENCE_ACTIONS:
        raise ZenithError(f"decisions must contain 1..{_MAX_EVIDENCE_ACTIONS} actions")
    result: list[dict[str, Any]] = []
    for index, raw in enumerate(raw_values):
        value = _strict_json_value(raw, f"decisions[{index}]")
        if not isinstance(value, dict):  # defensive; _decision_list already enforces this
            raise ZenithError(f"decisions[{index}] must be an object")
        action = value.get("action")
        if action not in {"retry", "continue", "patch", "abort"}:
            raise ZenithError(f"unsupported attention action: {action!r}")
        attention_id = _canonical_identifier(value.get("attention_id"), f"decisions[{index}].attention_id")
        allowed: set[str]
        if action == "retry":
            allowed = {"attention_id", "action", "task_id", "reason"}
        elif action == "continue":
            allowed = {"attention_id", "action", "accepted_risks", "targets", "reason"}
        elif action == "abort":
            allowed = {"attention_id", "action", "reason"}
        else:
            allowed = {"attention_id", "action", "patch"}
        unknown = set(value) - allowed
        if unknown:
            raise ZenithError(f"decisions[{index}] has unknown fields: {sorted(unknown)}")
        normal: dict[str, Any] = {"attention_id": attention_id, "action": action}
        if action == "retry":
            if "task_id" in value:
                normal["task_id"] = _canonical_identifier(value["task_id"], f"decisions[{index}].task_id")
            if "reason" in value:
                if not isinstance(value["reason"], str) or not value["reason"].strip() or len(value["reason"].encode()) > 4096:
                    raise ZenithError(f"decisions[{index}].reason must be a bounded non-empty string")
                normal["reason"] = value["reason"].strip()
        elif action == "continue":
            if "accepted_risks" in value and "targets" in value:
                raise ZenithError(f"decisions[{index}] must not provide both accepted_risks and targets")
            risks = value.get("accepted_risks", value.get("targets"))
            normal["accepted_risks"] = _string_list(risks, f"decisions[{index}].accepted_risks")
            reason = value.get("reason")
            if not isinstance(reason, str) or not reason.strip() or len(reason.encode()) > 4096:
                raise ZenithError(f"decisions[{index}].reason must be a bounded non-empty string")
            normal["reason"] = reason.strip()
        elif action == "abort":
            reason = value.get("reason")
            if not isinstance(reason, str) or not reason.strip() or len(reason.encode()) > 4096:
                raise ZenithError(f"decisions[{index}].reason must be a bounded non-empty string")
            normal["reason"] = reason.strip()
        else:
            patch = _closed_object(
                value.get("patch", {}),
                {"add_contract", "add_tasks", "supersede", "cancel"},
                f"decisions[{index}].patch",
                evidence=False,
            )
            normal["patch"] = _strict_json_value(patch, f"decisions[{index}].patch")
        result.append(normal)
    if len({item["attention_id"] for item in result}) != len(result):
        raise ZenithError("each open attention item must be decided exactly once; duplicate attention_id found")
    return result


def _normalise_identity(value: Any, label: str) -> dict[str, int]:
    fields = {"device", "inode", "uid", "gid", "nlink"}
    result = _closed_object(value, fields, label)
    if set(result) != fields:
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label} must contain exact inode identity and link count")
    for key, item in result.items():
        if type(item) is not int or item < 0:
            raise _typed_error("INVALID_EVIDENCE", 422, f"{label}.{key} must be a non-negative integer")
    if result["nlink"] != 1:
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label}.nlink must be exactly one")
    return {key: int(result[key]) for key in ("device", "inode", "uid", "gid", "nlink")}


def _normalise_subject(value: Any, label: str) -> dict[str, str]:
    fields = {"code_sha256", "build_sha256", "config_sha256"}
    result = _closed_object(value, fields, label)
    if set(result) != fields:
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label} must bind exact code, build, and config digests")
    return {key: _validate_hash(result[key], f"{label}.{key}", evidence=True) for key in sorted(fields)}


def _normalise_evidence_path(value: Any, label: str, *, receipt: bool = False) -> str:
    if not isinstance(value, str) or not value or len(value.encode("utf-8")) > 512:
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label} must be a bounded relative POSIX path")
    if unicodedata.normalize("NFC", value) != value or "\x00" in value or "\\" in value:
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label} is not a canonical NFC POSIX path")
    pure = PurePosixPath(value)
    components = pure.parts
    if pure.is_absolute() or not components or any(item in {"", ".", ".."} for item in components):
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label} must not be absolute or contain dot components")
    if pure.as_posix() != value or any(len(item.encode("utf-8")) > 128 for item in components):
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label} has an alternate or oversized path spelling")
    allowed = {"terminal-reviews"} if receipt else {"preflight-artifacts", "evidence"}
    if components[0] not in allowed:
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label} is outside configured evidence roots")
    return value


def _normalise_provenance_receipt(value: Any, label: str) -> dict[str, Any]:
    fields = {"path", "sha256", "size", "mode", "identity", "reviewer_id"}
    result = _closed_object(value, fields, label)
    if set(result) != fields:
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label} is missing authenticated receipt fields")
    result["path"] = _normalise_evidence_path(result["path"], f"{label}.path", receipt=True)
    result["sha256"] = _validate_hash(result["sha256"], f"{label}.sha256", evidence=True)
    if type(result["size"]) is not int or not 1 <= result["size"] <= _MAX_EVIDENCE_BYTES:
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label}.size is outside the policy limit")
    if result["mode"] not in {"0400", "0440", "0444"}:
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label}.mode must be read-only")
    result["identity"] = _normalise_identity(result["identity"], f"{label}.identity")
    result["reviewer_id"] = _canonical_identifier(
        result["reviewer_id"], f"{label}.reviewer_id", evidence=True
    )
    return result


def _normalise_evidence_manifest(value: Any) -> dict[str, Any]:
    value = _strict_json_value(value, "evidence_manifest")
    fields = {
        "schema", "mission_id", "operation_id", "base_revision",
        "base_snapshot_sha256", "action_evidence",
    }
    manifest = _closed_object(value, fields, "evidence_manifest")
    if set(manifest) != fields or manifest.get("schema") != "zenith.decide.evidence/v1":
        raise _typed_error("INVALID_EVIDENCE", 422, "evidence_manifest has missing fields or an unsupported schema")
    manifest["mission_id"] = _canonical_identifier(
        manifest["mission_id"], "evidence_manifest.mission_id", evidence=True
    )
    manifest["operation_id"] = _canonical_operation_id(manifest["operation_id"])
    if type(manifest["base_revision"]) is not int or not 0 <= manifest["base_revision"] <= _MAX_REVISION:
        raise _typed_error("INVALID_EVIDENCE", 422, "evidence_manifest.base_revision must be a bounded integer")
    manifest["base_snapshot_sha256"] = _validate_hash(
        manifest["base_snapshot_sha256"], "evidence_manifest.base_snapshot_sha256", evidence=True
    )
    entries = manifest["action_evidence"]
    if not isinstance(entries, list) or not 1 <= len(entries) <= _MAX_EVIDENCE_ACTIONS:
        raise _typed_error("INVALID_EVIDENCE", 422, "evidence_manifest.action_evidence has an invalid count")
    normal_entries: list[dict[str, Any]] = []
    total_artifacts = 0
    for index, raw_entry in enumerate(entries):
        label = f"evidence_manifest.action_evidence[{index}]"
        entry_fields = {
            "action_sha256", "artifacts", "subject", "subject_sha256",
            "target_id", "target_type",
        }
        entry = _closed_object(raw_entry, entry_fields, label)
        if set(entry) != entry_fields:
            raise _typed_error("INVALID_EVIDENCE", 422, f"{label} is missing required fields")
        entry["action_sha256"] = _validate_hash(entry["action_sha256"], f"{label}.action_sha256", evidence=True)
        entry["subject"] = _normalise_subject(entry["subject"], f"{label}.subject")
        entry["subject_sha256"] = _validate_hash(entry["subject_sha256"], f"{label}.subject_sha256", evidence=True)
        if entry["subject_sha256"] != _sha256_canonical(entry["subject"]):
            raise _typed_error("INVALID_EVIDENCE", 422, f"{label}.subject_sha256 does not bind the subject object")
        entry["target_id"] = _canonical_identifier(entry["target_id"], f"{label}.target_id", evidence=True)
        if entry["target_type"] != "attention":
            raise _typed_error("INVALID_EVIDENCE", 422, f"{label}.target_type must be attention")
        artifacts = entry["artifacts"]
        if not isinstance(artifacts, list) or len(artifacts) != 1:
            raise _typed_error("INVALID_EVIDENCE", 422, f"{label}.artifacts must contain exactly one policy artifact")
        total_artifacts += 1
        if total_artifacts > _MAX_EVIDENCE_ARTIFACTS:
            raise _typed_error("INVALID_EVIDENCE", 422, "evidence manifest contains too many artifacts")
        artifact_label = f"{label}.artifacts[0]"
        artifact_fields = {
            "kind", "media_type", "path", "provenance_receipt", "report_schema",
            "sha256", "size", "validator_id", "mode", "identity",
        }
        artifact = _closed_object(artifacts[0], artifact_fields, artifact_label)
        required = artifact_fields - {"provenance_receipt"}
        if not required.issubset(artifact):
            raise _typed_error("INVALID_EVIDENCE", 422, f"{artifact_label} is missing required fields")
        for key in ("kind", "media_type", "validator_id", "report_schema"):
            if not isinstance(artifact[key], str) or not artifact[key] or len(artifact[key].encode()) > 128:
                raise _typed_error("INVALID_EVIDENCE", 422, f"{artifact_label}.{key} is invalid")
            if unicodedata.normalize("NFC", artifact[key]) != artifact[key]:
                raise _typed_error("INVALID_EVIDENCE", 422, f"{artifact_label}.{key} must be NFC")
        if artifact["media_type"] != "application/json":
            raise _typed_error("INVALID_EVIDENCE", 422, f"{artifact_label}.media_type is unsupported")
        artifact["path"] = _normalise_evidence_path(artifact["path"], f"{artifact_label}.path")
        artifact["sha256"] = _validate_hash(artifact["sha256"], f"{artifact_label}.sha256", evidence=True)
        if type(artifact["size"]) is not int or not 1 <= artifact["size"] <= _MAX_EVIDENCE_BYTES:
            raise _typed_error("INVALID_EVIDENCE", 422, f"{artifact_label}.size is outside the policy limit")
        if artifact["mode"] not in {"0400", "0440", "0444"}:
            raise _typed_error("INVALID_EVIDENCE", 422, f"{artifact_label}.mode must be read-only")
        artifact["identity"] = _normalise_identity(artifact["identity"], f"{artifact_label}.identity")
        if "provenance_receipt" in artifact:
            artifact["provenance_receipt"] = _normalise_provenance_receipt(
                artifact["provenance_receipt"], f"{artifact_label}.provenance_receipt"
            )
        entry["artifacts"] = [artifact]
        normal_entries.append(entry)
    pairs = [(entry["target_id"], entry["action_sha256"]) for entry in normal_entries]
    if len(pairs) != len(set(pairs)):
        raise _typed_error("INVALID_EVIDENCE", 422, "evidence manifest contains a duplicate target/action pair")
    manifest["action_evidence"] = normal_entries
    if len(_canonical_json_bytes(manifest)) > 256 * 1024:
        raise _typed_error("INVALID_EVIDENCE", 422, "evidence_manifest exceeds its encoded size limit")
    return manifest


def _read_evidence_relative(path: Path, relative: str) -> tuple[bytes, os.stat_result]:
    authority = _require_transaction_authority(path)
    components = PurePosixPath(relative).parts
    directory_fds: list[int] = []
    current_fd = authority.root_fd
    try:
        for component in components[:-1]:
            try:
                child_fd = os.open(
                    component,
                    os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW,
                    dir_fd=current_fd,
                )
            except OSError as exc:
                raise _typed_error("INVALID_EVIDENCE", 422, "cannot safely open evidence directory") from exc
            directory_fds.append(child_fd)
            current_fd = child_fd
            try:
                value = os.fstat(child_fd)
                entry = os.stat(component, dir_fd=(authority.root_fd if len(directory_fds) == 1 else directory_fds[-2]), follow_symlinks=False)
                if (
                    not stat.S_ISDIR(value.st_mode)
                    or value.st_uid != authority.owner
                    or value.st_gid != authority.gid
                    or value.st_mode & (stat.S_ISUID | stat.S_ISGID | 0o022)
                    or (value.st_dev, value.st_ino) != (entry.st_dev, entry.st_ino)
                ):
                    raise OSError(errno.EPERM, "unsafe evidence directory")
                _reject_acl(child_fd, "evidence directory")
            except (OSError, ZenithError) as exc:
                raise _typed_error("INVALID_EVIDENCE", 422, "unsafe evidence directory authority") from exc
        try:
            file_fd = os.open(
                components[-1],
                os.O_RDONLY | os.O_CLOEXEC | os.O_NOFOLLOW,
                dir_fd=current_fd,
            )
        except OSError as exc:
            raise _typed_error("INVALID_EVIDENCE", 422, "cannot safely open evidence artifact") from exc
        try:
            before = os.fstat(file_fd)
            try:
                _validate_regular_stat(
                    before,
                    owner=authority.owner,
                    gid=authority.gid,
                    max_bytes=_MAX_EVIDENCE_BYTES,
                    exact_mode=None,
                    writable=False,
                    allowed_links=(1,),
                    label="evidence artifact",
                )
                _reject_acl(file_fd, "evidence artifact")
            except ZenithError as exc:
                raise _typed_error("INVALID_EVIDENCE", 422, "unsafe evidence artifact identity or mode") from exc
            try:
                data = _read_fd_exact(file_fd, int(before.st_size))
                after = os.fstat(file_fd)
                entry = os.stat(components[-1], dir_fd=current_fd, follow_symlinks=False)
            except OSError as exc:
                raise _typed_error("INVALID_EVIDENCE", 422, "cannot read stable evidence bytes") from exc
            if (
                (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns)
                != (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns)
                or (after.st_dev, after.st_ino) != (entry.st_dev, entry.st_ino)
            ):
                raise _typed_error("INVALID_EVIDENCE", 422, "evidence changed while being read")
            return data, after
        finally:
            os.close(file_fd)
    finally:
        for fd in reversed(directory_fds):
            os.close(fd)


def _attention_evidence_binding(attention: Mapping[str, Any]) -> dict[str, Any]:
    raw_targets = attention.get("targets", [])
    targets = raw_targets if isinstance(raw_targets, list) else []
    clean_targets: list[str] = []
    for index, target in enumerate(targets):
        clean_targets.append(_canonical_identifier(target, f"attention.targets[{index}]", evidence=True))
    binding = {
        "attention_id": _canonical_identifier(attention.get("id"), "attention.id", evidence=True),
        "kind": str(attention.get("kind", "")),
        "task_id": attention.get("task_id") if isinstance(attention.get("task_id"), str) else None,
        "assertion_id": attention.get("assertion_id") if isinstance(attention.get("assertion_id"), str) else None,
        "targets": clean_targets,
    }
    return _strict_json_value(binding, "attention binding")


def _validate_policy_report(
    data: bytes,
    *,
    policy: Mapping[str, Any],
    mission_id: str,
    operation_id: str,
    base_revision: int,
    base_snapshot_sha256: str,
    target_id: str,
    action_sha256: str,
    subject: Mapping[str, str],
    subject_sha256: str,
    attention_binding: Mapping[str, Any],
    label: str,
) -> dict[str, Any]:
    try:
        report = _strict_json_bytes(data, label, max_bytes=_MAX_EVIDENCE_BYTES)
    except ZenithError as exc:
        raise _typed_error("INVALID_EVIDENCE", 422, "evidence report is not valid bounded strict JSON") from exc
    fields = {
        "schema", "mission_id", "operation_id", "base_revision", "base_snapshot_sha256",
        "target_id", "action_sha256", "subject", "subject_sha256",
        "attention", "result", "details",
    }
    report = _closed_object(report, fields, label)
    if set(report) != fields or report.get("schema") != policy["report_schema"]:
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label} has an unsupported or incomplete schema")
    expected = {
        "mission_id": mission_id,
        "operation_id": operation_id,
        "base_revision": base_revision,
        "base_snapshot_sha256": base_snapshot_sha256,
        "target_id": target_id,
        "action_sha256": action_sha256,
        "subject_sha256": subject_sha256,
        "result": policy["result"],
    }
    if any(report.get(key) != value for key, value in expected.items()):
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label} semantic result/subject/snapshot binding does not match")
    if report.get("subject") != subject or report.get("attention") != attention_binding:
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label} code/build/config or attention binding mismatch")
    if not isinstance(report.get("details"), str) or not report["details"].strip() or len(report["details"].encode()) > 4096:
        raise _typed_error("INVALID_EVIDENCE", 422, f"{label}.details must be a bounded non-empty string")
    return report


def _controller_directory_snapshot(fd: int, *, anchor: bool = False) -> tuple[int, ...]:
    value = os.fstat(fd)
    euid = os.geteuid()
    egid = os.getegid()
    owner_ok = value.st_uid == 0 if anchor else value.st_uid in {0, euid}
    group_ok = value.st_gid == 0 if value.st_uid == 0 else value.st_gid == egid
    if (
        not stat.S_ISDIR(value.st_mode)
        or not owner_ok
        or not group_ok
        or value.st_mode & (stat.S_ISUID | stat.S_ISGID | 0o022)
    ):
        raise OSError(errno.EPERM, "unsafe controller trust-root parent")
    _reject_acl(fd, "controller trust-root parent")
    return (
        value.st_dev,
        value.st_ino,
        value.st_uid,
        value.st_gid,
        value.st_mode,
        value.st_nlink,
    )


def _read_controller_trust_root() -> bytes:
    configured = _EVIDENCE_TRUST_ROOT_FILE
    if configured is None:
        raise _typed_error(
            "INVALID_EVIDENCE", 422, "authenticated evidence requires a configured controller trust root"
        )
    raw_path = os.fspath(configured)
    if not isinstance(raw_path, str):
        raise _typed_error("INVALID_EVIDENCE", 422, "controller trust root path must be text")
    try:
        encoded = raw_path.encode("utf-8")
    except UnicodeError as exc:
        raise _typed_error("INVALID_EVIDENCE", 422, "controller trust root path is invalid") from exc
    pure = PurePosixPath(raw_path)
    components = pure.parts
    canonical = "/" + "/".join(components[1:]) if components and components[0] == "/" else ""
    if (
        not pure.is_absolute()
        or raw_path != canonical
        or unicodedata.normalize("NFC", raw_path) != raw_path
        or "\x00" in raw_path
        or not 2 <= len(components) <= 65
        or len(encoded) > 4096
        or any(item in {"", ".", ".."} or len(item.encode("utf-8")) > 255 for item in components[1:])
    ):
        raise _typed_error(
            "INVALID_EVIDENCE", 422, "controller trust root path must be a bounded canonical absolute path"
        )

    directory_flags = os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW
    file_flags = os.O_RDONLY | os.O_CLOEXEC | os.O_NOFOLLOW
    # Each tuple retains (fd, parent_fd, entry_name, validated_snapshot). The
    # descriptors stay open until after the bounded key read and post-read chain
    # revalidation, so no intermediate pathname lookup becomes authority.
    chain: list[tuple[int, int | None, str, tuple[int, ...]]] = []
    file_fd: int | None = None
    try:
        root_fd = os.open("/", directory_flags)
        try:
            root_snapshot = _controller_directory_snapshot(root_fd, anchor=True)
            root_entry = os.stat("/", follow_symlinks=False)
            if (root_snapshot[0], root_snapshot[1]) != (root_entry.st_dev, root_entry.st_ino):
                raise OSError(errno.EAGAIN, "controller trust-root anchor changed")
        except BaseException:
            os.close(root_fd)
            raise
        chain.append((root_fd, None, "/", root_snapshot))

        current_fd = root_fd
        for component in components[1:-1]:
            child_fd = os.open(component, directory_flags, dir_fd=current_fd)
            try:
                snapshot = _controller_directory_snapshot(child_fd)
                entry = os.stat(component, dir_fd=current_fd, follow_symlinks=False)
                if (snapshot[0], snapshot[1]) != (entry.st_dev, entry.st_ino):
                    raise OSError(errno.EAGAIN, "controller trust-root parent entry changed")
            except BaseException:
                os.close(child_fd)
                raise
            chain.append((child_fd, current_fd, component, snapshot))
            current_fd = child_fd

        final_name = components[-1]
        file_fd = os.open(final_name, file_flags, dir_fd=current_fd)
        before = os.fstat(file_fd)
        _validate_regular_stat(
            before,
            owner=os.geteuid(),
            gid=None,
            max_bytes=4096,
            exact_mode=0o400,
            writable=False,
            allowed_links=(1,),
            label="controller trust root",
        )
        if before.st_size < 32:
            raise OSError(errno.EPERM, "controller trust root is too short")
        _reject_acl(file_fd, "controller trust root")
        initial_entry = os.stat(final_name, dir_fd=current_fd, follow_symlinks=False)
        if (before.st_dev, before.st_ino) != (initial_entry.st_dev, initial_entry.st_ino):
            raise OSError(errno.EAGAIN, "controller trust-root file entry changed")

        data = _read_fd_exact(file_fd, int(before.st_size))
        after = os.fstat(file_fd)
        final_entry = os.stat(final_name, dir_fd=current_fd, follow_symlinks=False)
        if (
            (
                before.st_dev,
                before.st_ino,
                before.st_size,
                before.st_mode,
                before.st_uid,
                before.st_gid,
                before.st_nlink,
                before.st_mtime_ns,
                before.st_ctime_ns,
            )
            != (
                after.st_dev,
                after.st_ino,
                after.st_size,
                after.st_mode,
                after.st_uid,
                after.st_gid,
                after.st_nlink,
                after.st_mtime_ns,
                after.st_ctime_ns,
            )
            or (after.st_dev, after.st_ino) != (final_entry.st_dev, final_entry.st_ino)
        ):
            raise OSError(errno.EAGAIN, "controller trust root changed while being read")
        _reject_acl(file_fd, "controller trust root")

        for fd, parent_fd, component, snapshot in reversed(chain):
            current = _controller_directory_snapshot(fd, anchor=parent_fd is None)
            if current != snapshot:
                raise OSError(errno.EAGAIN, "controller trust-root parent changed while reading")
            if parent_fd is None:
                entry = os.stat("/", follow_symlinks=False)
            else:
                entry = os.stat(component, dir_fd=parent_fd, follow_symlinks=False)
            if (current[0], current[1]) != (entry.st_dev, entry.st_ino):
                raise OSError(errno.EAGAIN, "controller trust-root parent entry was replaced")
        return data
    except (OSError, ZenithError) as exc:
        raise _typed_error(
            "INVALID_EVIDENCE", 422, "controller trust root failed retained-chain integrity checks"
        ) from exc
    finally:
        if file_fd is not None:
            os.close(file_fd)
        for fd, _, _, _ in reversed(chain):
            os.close(fd)


def _validate_provenance_receipt(
    data: bytes,
    *,
    reviewer_id: str,
    operation_id: str,
    artifact_sha256: str,
    action_sha256: str,
    subject_sha256: str,
    target_id: str,
    result: str,
    now_epoch: int,
) -> dict[str, Any]:
    try:
        receipt = _strict_json_bytes(data, "provenance receipt", max_bytes=_MAX_EVIDENCE_BYTES)
    except ZenithError as exc:
        raise _typed_error("INVALID_EVIDENCE", 422, "provenance receipt is invalid strict JSON") from exc
    fields = {
        "schema", "reviewer_id", "operation_id", "artifact_sha256", "action_sha256",
        "subject_sha256", "target_id", "result", "issued_at", "hmac_sha256",
    }
    receipt = _closed_object(receipt, fields, "provenance receipt")
    if set(receipt) != fields or receipt.get("schema") != "zenith.evidence.provenance-receipt/v2":
        raise _typed_error("INVALID_EVIDENCE", 422, "provenance receipt schema is unsupported")
    expected = {
        "reviewer_id": reviewer_id,
        "operation_id": operation_id,
        "artifact_sha256": artifact_sha256,
        "action_sha256": action_sha256,
        "subject_sha256": subject_sha256,
        "target_id": target_id,
        "result": result,
    }
    if any(receipt.get(key) != value for key, value in expected.items()):
        raise _typed_error("INVALID_EVIDENCE", 422, "provenance receipt binding mismatch")
    _parse_provenance_issued_at(receipt.get("issued_at"), now_epoch=now_epoch)
    _validate_hash(receipt.get("hmac_sha256"), "provenance receipt hmac", evidence=True)
    body = dict(receipt)
    supplied = body.pop("hmac_sha256")
    key = _read_controller_trust_root()
    calculated = "sha256:" + hmac.new(key, _canonical_json_bytes(body), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(supplied, calculated):
        raise _typed_error("INVALID_EVIDENCE", 422, "provenance receipt authentication failed")
    return receipt


def _validate_evidence_files(
    path: Path,
    manifest: Mapping[str, Any],
    actions: Sequence[Mapping[str, Any]],
    *,
    mission_id: str,
    operation_id: str,
    expected_revision: int,
    base_snapshot_sha256: str,
    attention_items: Mapping[str, Mapping[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if manifest["mission_id"] != mission_id or manifest["base_revision"] != expected_revision:
        raise _typed_error("INVALID_EVIDENCE", 422, "evidence manifest mission/revision binding mismatch")
    if manifest["base_snapshot_sha256"] != base_snapshot_sha256:
        raise _typed_error("INVALID_EVIDENCE", 422, "evidence manifest snapshot binding mismatch")
    if manifest["operation_id"] != operation_id:
        raise _typed_error("INVALID_EVIDENCE", 422, "evidence manifest operation binding mismatch")
    provenance_now_epoch = _provenance_now_epoch()
    action_by_pair = {
        (action["attention_id"], _sha256_canonical(action)): action
        for action in actions
    }
    entries = {
        (entry["target_id"], entry["action_sha256"]): entry
        for entry in manifest["action_evidence"]
    }
    if len(entries) != len(manifest["action_evidence"]) or set(entries) != set(action_by_pair):
        raise _typed_error("INVALID_EVIDENCE", 422, "action_evidence is not a bijection with requested actions")
    accepted: list[dict[str, Any]] = []
    fingerprints: list[dict[str, Any]] = []
    seen_paths: set[str] = set()
    total_bytes = 0
    for pair in sorted(entries):
        entry = entries[pair]
        action = action_by_pair[pair]
        policy = _EVIDENCE_POLICY.get(action["action"])
        if policy is None:
            raise _typed_error("INVALID_EVIDENCE", 422, "no controller evidence policy exists for the requested action")
        attention = attention_items.get(entry["target_id"])
        if attention is None:
            raise _typed_error("INVALID_EVIDENCE", 422, "evidence target is not an exact open attention item")
        attention_binding = _attention_evidence_binding(attention)
        artifact = entry["artifacts"][0]
        if (
            artifact["kind"] != policy["kind"]
            or artifact["validator_id"] != policy["validator_id"]
            or artifact["report_schema"] != policy["report_schema"]
            or artifact["media_type"] != "application/json"
        ):
            raise _typed_error("INVALID_EVIDENCE", 422, "evidence kind/validator/schema is not allowed by the action policy")
        if artifact["path"] in seen_paths:
            raise _typed_error("INVALID_EVIDENCE", 422, "duplicate evidence artifact path")
        seen_paths.add(artifact["path"])
        data, file_stat = _read_evidence_relative(path, artifact["path"])
        total_bytes += len(data)
        if total_bytes > _MAX_EVIDENCE_TOTAL_BYTES:
            raise _typed_error("INVALID_EVIDENCE", 422, "evidence artifacts exceed the total byte limit")
        if (
            len(data) != artifact["size"]
            or _sha256_bytes(data) != artifact["sha256"]
            or _mode(file_stat) != artifact["mode"]
            or _artifact_identity(file_stat) != artifact["identity"]
        ):
            raise _typed_error("INVALID_EVIDENCE", 422, "evidence artifact descriptor mismatch")
        report = _validate_policy_report(
            data,
            policy=policy,
            mission_id=mission_id,
            operation_id=operation_id,
            base_revision=expected_revision,
            base_snapshot_sha256=base_snapshot_sha256,
            target_id=entry["target_id"],
            action_sha256=entry["action_sha256"],
            subject=entry["subject"],
            subject_sha256=entry["subject_sha256"],
            attention_binding=attention_binding,
            label=artifact["path"],
        )
        authenticated = False
        provenance_descriptor: dict[str, Any] | None = None
        provenance = artifact.get("provenance_receipt")
        if policy["authenticated"]:
            if provenance is None:
                raise _typed_error("INVALID_EVIDENCE", 422, "this action requires controller-authenticated independent evidence")
            provenance_bytes, provenance_stat = _read_evidence_relative(path, provenance["path"])
            total_bytes += len(provenance_bytes)
            if total_bytes > _MAX_EVIDENCE_TOTAL_BYTES:
                raise _typed_error("INVALID_EVIDENCE", 422, "evidence artifacts exceed the total byte limit")
            if (
                len(provenance_bytes) != provenance["size"]
                or _sha256_bytes(provenance_bytes) != provenance["sha256"]
                or _mode(provenance_stat) != provenance["mode"]
                or _artifact_identity(provenance_stat) != provenance["identity"]
            ):
                raise _typed_error("INVALID_EVIDENCE", 422, "provenance receipt descriptor mismatch")
            _validate_provenance_receipt(
                provenance_bytes,
                reviewer_id=provenance["reviewer_id"],
                operation_id=operation_id,
                artifact_sha256=artifact["sha256"],
                action_sha256=entry["action_sha256"],
                subject_sha256=entry["subject_sha256"],
                target_id=entry["target_id"],
                result=policy["result"],
                now_epoch=provenance_now_epoch,
            )
            authenticated = True
            provenance_descriptor = deepcopy(provenance)
            fingerprints.append({
                "path": provenance["path"],
                "sha256": provenance["sha256"],
                "size": provenance["size"],
                "mode": provenance["mode"],
                "identity": provenance["identity"],
            })
        elif provenance is not None:
            raise _typed_error("INVALID_EVIDENCE", 422, "unauthenticated conservative policy does not accept caller-selected provenance")
        descriptor = {
            "action": action["action"],
            "action_sha256": entry["action_sha256"],
            "target_id": entry["target_id"],
            "target_type": "attention",
            "attention": attention_binding,
            "base_snapshot_sha256": base_snapshot_sha256,
            "subject": entry["subject"],
            "subject_sha256": entry["subject_sha256"],
            "kind": artifact["kind"],
            "media_type": artifact["media_type"],
            "path": artifact["path"],
            "sha256": artifact["sha256"],
            "size": artifact["size"],
            "mode": artifact["mode"],
            "identity": artifact["identity"],
            "validator_id": artifact["validator_id"],
            "report_schema": artifact["report_schema"],
            "extracted_result": report["result"],
            "authenticated": authenticated,
            "provenance_receipt": provenance_descriptor,
        }
        accepted.append(descriptor)
        fingerprints.append({
            "path": artifact["path"],
            "sha256": artifact["sha256"],
            "size": artifact["size"],
            "mode": artifact["mode"],
            "identity": artifact["identity"],
        })
    return accepted, fingerprints


def _recheck_evidence_files(path: Path, fingerprints: Sequence[Mapping[str, Any]]) -> None:
    for descriptor in fingerprints:
        data, file_stat = _read_evidence_relative(path, descriptor["path"])
        if (
            len(data) != descriptor["size"]
            or _sha256_bytes(data) != descriptor["sha256"]
            or _mode(file_stat) != descriptor["mode"]
            or _artifact_identity(file_stat) != descriptor["identity"]
        ):
            raise _typed_error("INVALID_EVIDENCE", 422, "evidence changed during decide")


def get_decide_preconditions(mission_id: str, workspace: str = ".") -> dict[str, Any]:
    """Return the exact strict-decide snapshot under lock after recovery."""

    path = _mission_dir(mission_id, workspace)
    with _FileLock(path / ".lock"):
        _recover_active_transaction(path)
        snapshot = _read_decide_snapshot(path)
    return {
        "mission_id": mission_id,
        "revision": snapshot["revision"],
        "file_hashes": snapshot["hashes"],
    }


def _decision_list(decisions: Any) -> list[dict[str, Any]]:
    if isinstance(decisions, dict):
        if not 1 <= len(decisions) <= _MAX_EVIDENCE_ACTIONS:
            raise ZenithError(f"decisions must contain 1..{_MAX_EVIDENCE_ACTIONS} actions")
        keys = list(decisions.keys())
        if any(not isinstance(attention_id, str) for attention_id in keys):
            raise ZenithError("decision object keys must be attention ID strings")
        result: list[dict[str, Any]] = []
        for attention_id in sorted(keys):
            raw = decisions[attention_id]
            item = dict(raw) if isinstance(raw, dict) else {"action": raw}
            if "attention_id" in item and item["attention_id"] != attention_id:
                raise ZenithError(f"decision object key {attention_id!r} conflicts with its attention_id")
            item.setdefault("attention_id", attention_id)
            result.append(item)
        return result
    if isinstance(decisions, (list, tuple)):
        if not 1 <= len(decisions) <= _MAX_EVIDENCE_ACTIONS:
            raise ZenithError(f"decisions must contain 1..{_MAX_EVIDENCE_ACTIONS} actions")
        return [_require_mapping(item, f"decisions[{index}]") for index, item in enumerate(decisions)]
    raise ZenithError("decisions must be a bounded list or plain object keyed by attention_id")


def _apply_patch(
    mission: dict[str, Any],
    contract: dict[str, Any],
    plan: dict[str, Any],
    patches: Sequence[Mapping[str, Any]],
) -> tuple[dict[str, Any], dict[str, Any]]:
    staged_contract = deepcopy(contract)
    tasks = deepcopy(list(plan["tasks"]))
    requested_superseded: set[str] = set()
    requested_cancelled: set[str] = set()
    for decision in patches:
        patch_value = decision.get("patch", decision)
        patch = _require_mapping(patch_value, "patch decision")
        add_contract = patch.get("add_contract", [])
        if isinstance(add_contract, Mapping):
            add_contract = add_contract.get("assertions", [])
        if add_contract:
            if not isinstance(add_contract, Sequence) or isinstance(add_contract, (str, bytes)):
                raise ZenithError("patch.add_contract must be an assertions list or contract object")
            staged_contract["assertions"].extend(deepcopy(list(add_contract)))
        add_tasks = patch.get("add_tasks", [])
        if add_tasks:
            if not isinstance(add_tasks, Sequence) or isinstance(add_tasks, (str, bytes)):
                raise ZenithError("patch.add_tasks must be a list")
            tasks.extend(deepcopy(list(add_tasks)))
        supersede = patch.get("supersede", [])
        if supersede:
            requested_superseded.update(_string_list(supersede, "patch.supersede"))
        cancel = patch.get("cancel", [])
        if cancel:
            requested_cancelled.update(_string_list(cancel, "patch.cancel"))

    task_ids = [_valid_id(_require_mapping(task, "patched task").get("id"), "patched task id") for task in tasks]
    if len(task_ids) != len(set(task_ids)):
        raise ZenithError("patched plan contains duplicate task IDs, including superseded history")
    requested_inactive = requested_superseded | requested_cancelled
    unknown = requested_inactive - set(task_ids)
    if unknown:
        raise ZenithError(f"patch supersedes or cancels unknown tasks: {sorted(unknown)}")
    for task_id in requested_cancelled:
        status = mission["tasks"].get(task_id, {}).get("status")
        if status in {"dispatching", "running", "cleared"}:
            raise ZenithError(f"cannot cancel {status} task {task_id}")
    for task_id in requested_superseded:
        task = mission["tasks"].get(task_id, {})
        status = task.get("status")
        if status in {"dispatching", "running"}:
            raise ZenithError(f"cannot supersede {status} task {task_id}")
        if status == "cleared":
            targets = task.get("targets", [])
            verdicts = task.get("latest_verdicts", {})
            replaceable_validator = (
                task.get("role") == "validate"
                and isinstance(targets, list)
                and bool(targets)
                and isinstance(verdicts, dict)
                and set(verdicts) == set(targets)
                and all(item in {"passed", "failed"} for item in verdicts.values())
                and any(item == "failed" for item in verdicts.values())
            )
            if not replaceable_validator:
                raise ZenithError(f"cannot supersede cleared task {task_id}")

    historically_superseded = {
        task["id"]
        for task in tasks
        if task.get("superseded") or mission["tasks"].get(task["id"], {}).get("status") == "superseded"
    }
    all_superseded = historically_superseded | requested_superseded | requested_cancelled
    active_tasks = [
        {key: value for key, value in task.items() if key != "superseded"}
        for task in tasks
        if task["id"] not in all_superseded
    ]
    clean_contract, clean_active = _validate_plan(staged_contract, active_tasks)
    _validate_task_capacity(clean_active, _ensure_concurrency_policy(mission)["maximum"])
    clean_by_id = {task["id"]: task for task in clean_active}
    new_plan_tasks: list[dict[str, Any]] = []
    for task in tasks:
        task_id = task["id"]
        if task_id in all_superseded:
            item = dict(task)
            item["superseded"] = True
            new_plan_tasks.append(item)
        else:
            new_plan_tasks.append(clean_by_id[task_id])

    old_states = mission["tasks"]
    staged_tasks: dict[str, dict[str, Any]] = {}
    for task in new_plan_tasks:
        task_id = task["id"]
        if task.get("superseded"):
            state = deepcopy(old_states.get(task_id, {**task, "attempts": [], "latest_verdicts": {}}))
            state["status"] = "superseded"
        else:
            state = deepcopy(old_states.get(task_id, {**task, "status": "pending", "attempts": [], "latest_verdicts": {}}))
            state.pop("superseded", None)
            state.update(task)
        staged_tasks[task_id] = state
    mission["tasks"] = staged_tasks

    old_assertions = mission["assertions"]
    staged_assertions: dict[str, dict[str, Any]] = {}
    for assertion in clean_contract["assertions"]:
        state = deepcopy(old_assertions.get(assertion["id"], {"status": "pending", "evidence": [], "accepted_risk": None}))
        state.update(assertion)
        staged_assertions[assertion["id"]] = state
    mission["assertions"] = staged_assertions
    return clean_contract, {"mission": plan.get("mission", ""), "tasks": new_plan_tasks}


async def decide(
    mission_id: str,
    decisions: Any,
    workspace: str = ".",
    *,
    expected_revision: int | None = None,
    expected_file_hashes: Mapping[
        Literal[
            "mission.json", "attention.json", "decisions.json", "events.json",
            "contract.json", "plan.json", "mission.md",
        ],
        str,
    ] | None = None,
    evidence_manifest: EvidenceManifestV1 | None = None,
    operation_id: str | None = None,
) -> DecideReceiptV1:
    """Resolve attention through the sole strict recoverable CAS mutation path."""

    missing: list[str] = []
    if expected_revision is None:
        missing.append("expected_revision")
    if expected_file_hashes is None:
        missing.append("expected_file_hashes")
    if evidence_manifest is None:
        missing.append("evidence_manifest")
    if operation_id is None:
        missing.append("operation_id")
    if missing:
        raise _typed_error(
            "PRECONDITION_REQUIRED",
            428,
            f"strict decide requires: {', '.join(missing)}",
        )
    if type(expected_revision) is not int or not 0 <= expected_revision < _MAX_REVISION:
        raise _typed_error(
            "PRECONDITION_FAILED", 412, "expected_revision must be a bounded non-negative integer"
        )
    canonical_mission_id = _canonical_identifier(mission_id, "mission_id")
    canonical_operation_id = _canonical_operation_id(operation_id)
    expected_hashes = _normalise_expected_hashes(expected_file_hashes)
    values = _normalise_decide_actions(decisions)
    manifest = _normalise_evidence_manifest(evidence_manifest)
    if manifest["operation_id"] != canonical_operation_id:
        raise _typed_error("INVALID_EVIDENCE", 422, "evidence manifest operation_id mismatch")
    if manifest["mission_id"] != canonical_mission_id:
        raise _typed_error("INVALID_EVIDENCE", 422, "evidence manifest mission_id mismatch")
    if manifest["base_revision"] != expected_revision:
        raise _typed_error("INVALID_EVIDENCE", 422, "evidence manifest revision mismatch")
    base_snapshot_sha256 = _sha256_canonical(expected_hashes)
    if manifest["base_snapshot_sha256"] != base_snapshot_sha256:
        raise _typed_error("INVALID_EVIDENCE", 422, "evidence manifest snapshot mismatch")
    request_document = {
        "schema": "zenith.decide.request/v2",
        "mission_id": canonical_mission_id,
        "operation_id": canonical_operation_id,
        "expected_revision": expected_revision,
        "expected_file_hashes": expected_hashes,
        "actions": values,
        "evidence_manifest": manifest,
    }
    request_bytes = _canonical_json_bytes(request_document)
    if len(request_bytes) > _MAX_REQUEST_BYTES:
        raise _typed_error("INVALID_EVIDENCE", 422, "normalized decide request exceeds its byte limit")
    request_sha256 = _sha256_bytes(request_bytes)
    evidence_manifest_sha256 = _sha256_canonical(manifest)
    path = _mission_dir(canonical_mission_id, workspace)

    with _FileLock(path / ".lock") as authority:
        _recover_active_transaction(path)
        replay = _read_permanent_receipt(
            path,
            canonical_operation_id,
            request_sha256=request_sha256,
        )
        if replay is not None:
            return deepcopy(replay)
        snapshot = _read_decide_snapshot(path)
        if snapshot["revision"] != expected_revision or snapshot["hashes"] != expected_hashes:
            raise _typed_error(
                "PRECONDITION_FAILED",
                412,
                "the reviewed mission revision or exact raw file hashes are stale",
            )
        original_mission = deepcopy(snapshot["parsed"]["mission.json"])
        if original_mission["state"] != "attention_needed":
            raise ZenithError(
                f"mission {canonical_mission_id} has no decision point while state is {original_mission['state']}"
            )
        mission = deepcopy(original_mission)
        attention_items = deepcopy(snapshot["parsed"]["attention.json"])
        decision_items = deepcopy(snapshot["parsed"]["decisions.json"])
        event_items = deepcopy(snapshot["parsed"]["events.json"])

        open_ids = set(mission["attention_open"])
        supplied = [item["attention_id"] for item in values]
        if set(supplied) != open_ids:
            raise ZenithError(
                "decisions must cover every open attention item exactly once; "
                f"missing={sorted(open_ids - set(supplied))}, extra={sorted(set(supplied) - open_ids)}"
            )
        items = {item["id"]: item for item in attention_items if item.get("status") == "open"}
        if set(items) != open_ids:
            raise _recovery_blocked("mission attention index does not match the open attention ledger")
        actions = {item["action"] for item in values}
        if "abort" in actions and actions != {"abort"}:
            raise ZenithError("abort cannot be mixed with retry, continue, or patch")
        if "patch" in actions:
            raise _typed_error(
                "PATCH_TRANSACTION_UNAVAILABLE",
                422,
                "strict decide patch is unavailable until contract.json, plan.json, and Markdown projections are complete transaction outputs",
            )
        accepted_evidence, evidence_fingerprints = _validate_evidence_files(
            path,
            manifest,
            values,
            mission_id=canonical_mission_id,
            operation_id=canonical_operation_id,
            expected_revision=expected_revision,
            base_snapshot_sha256=base_snapshot_sha256,
            attention_items=items,
        )

        committed_at = _now()
        for decision in values:
            attention_id = decision["attention_id"]
            attention = items[attention_id]
            action = decision["action"]
            if action == "retry":
                if attention.get("kind") in {
                    "terminal_review_failed", "invalid_terminal_review_result",
                    "review_admission_error", "missing_review_handoff",
                    "orphaned_review", "review_child_error",
                }:
                    mission["review"]["status"] = "pending"
                else:
                    task_id = decision.get("task_id") or attention.get("task_id")
                    if not task_id or task_id not in mission["tasks"]:
                        raise ZenithError(f"retry decision {attention_id} must identify a task")
                    task = mission["tasks"][task_id]
                    if task["role"] == "gate":
                        raise ZenithError(f"gate {task_id} cannot be retried; retry its validator")
                    if task["status"] in {"cleared", "superseded"}:
                        raise ZenithError(f"cannot retry {task['status']} task {task_id}")
                    task["status"] = "pending"
                    task["latest_verdicts"] = {}
                    for gate in mission["tasks"].values():
                        if (
                            gate["role"] == "gate"
                            and set(gate["targets"]) & set(task["targets"])
                            and gate["status"] == "failed"
                        ):
                            gate["status"] = "pending"
                    for target in task["targets"]:
                        if mission["assertions"][target]["status"] != "accepted_risk":
                            mission["assertions"][target]["status"] = "pending"
            elif action == "continue":
                risk_ids = list(decision["accepted_risks"])
                unknown = set(risk_ids) - set(mission["assertions"])
                if unknown:
                    raise ZenithError(f"continue decision accepts unknown assertion risks: {sorted(unknown)}")
                related = set(attention.get("targets", []))
                if attention.get("assertion_id"):
                    related.add(attention["assertion_id"])
                if not related and attention.get("task_id") in mission["tasks"]:
                    related.update(mission["tasks"][attention["task_id"]]["targets"])
                if related and not set(risk_ids).issubset(related):
                    raise ZenithError(
                        f"continue decision {attention_id} accepts unrelated risks: "
                        f"{sorted(set(risk_ids) - related)}"
                    )
                for target in risk_ids:
                    risk_record = {
                        "reason": decision["reason"],
                        "at": committed_at,
                        "attention_id": attention_id,
                    }
                    mission["assertions"][target]["accepted_risk"] = risk_record
                    mission["assertions"][target]["status"] = "accepted_risk"
                    mission["assertions"][target]["evidence"].append({"accepted_risk": risk_record})
                task_id = attention.get("task_id")
                if task_id in mission["tasks"] and mission["tasks"][task_id]["status"] == "failed":
                    mission["tasks"][task_id]["status"] = "superseded"
            elif action == "abort":
                mission["abort_reason"] = decision["reason"]
                mission["state"] = "aborted"
            _resolve_attention(
                path,
                mission,
                attention_id,
                decision,
                attention_items=attention_items,
                at=committed_at,
            )
            decision_items.append({"at": committed_at, **_jsonable(decision)})

        if mission["state"] != "aborted":
            _evaluate(path, mission, attention_items=attention_items, at=committed_at)
            _update_state(path, mission)
        event_items.append({
            "at": committed_at,
            "event": "attention_decided",
            "actions": sorted(actions),
            "operation_id": canonical_operation_id,
            "request_sha256": request_sha256,
            "evidence_manifest_sha256": evidence_manifest_sha256,
        })
        mission["updated_at"] = committed_at
        mission["revision"] = expected_revision + 1
        result_revision = mission["revision"]
        response = _envelope(
            "decide",
            mission,
            decisions=len(values),
            operation_id=canonical_operation_id,
            request_sha256=request_sha256,
            evidence_manifest_sha256=evidence_manifest_sha256,
            committed_at=committed_at,
        )
        postimages: dict[str, bytes] = {
            "attention.json": _json_bytes(attention_items),
            "decisions.json": _json_bytes(decision_items),
            "events.json": _json_bytes(event_items),
            "mission.md": _render_mission_markdown(mission).encode("utf-8"),
            "mission.json": _json_bytes(mission),
        }
        oversized = [name for name, data in postimages.items() if len(data) > _MAX_STATE_BYTES]
        if oversized:
            raise _typed_error(
                "OUTPUT_TOO_LARGE",
                422,
                f"strict decide would exceed the durable postimage limit for: {', '.join(sorted(oversized))}",
            )
        output_descriptors: dict[str, dict[str, Any]] = {
            name: {"sha256": _sha256_bytes(data), "size": len(data), "mode": "0600"}
            for name, data in postimages.items()
        }
        receipt_body: dict[str, Any] = {
            "schema": "zenith.decide.receipt/v1",
            "mission_id": canonical_mission_id,
            "operation_id": canonical_operation_id,
            "request_sha256": request_sha256,
            "evidence_manifest_sha256": evidence_manifest_sha256,
            "base_revision": expected_revision,
            "committed_revision": result_revision,
            "status": "committed",
            "committed_at": committed_at,
            "input_hashes": expected_hashes,
            "output_hashes": {
                name: output_descriptors[name]["sha256"] for name in _DECIDE_STATE_OUTPUTS
            },
            "accepted_evidence": accepted_evidence,
            "response": response,
            "idempotency": {"result": "committed", "request_match": True},
        }
        receipt_body_sha256 = _receipt_body_hash(receipt_body)
        receipt_size = 0
        for _ in range(8):
            placeholder = {
                **receipt_body,
                "journal_sha256": "sha256:" + "0" * 64,
                "commit_binding_sha256": "sha256:" + "0" * 64,
                "receipt_identity": {
                    "body_sha256": receipt_body_sha256,
                    "mode": "0400",
                    "size": receipt_size,
                },
            }
            next_size = len(_json_bytes(placeholder))
            if next_size == receipt_size:
                break
            receipt_size = next_size
        else:  # pragma: no cover - fixed-width encoding converges immediately
            raise _typed_error("OUTPUT_TOO_LARGE", 422, "receipt size identity did not converge")
        output_descriptors["receipt.json"] = {
            "sha256": receipt_body_sha256,
            "size": receipt_size,
            "mode": "0400",
            "hash_scope": "receipt-logical-body-v1",
        }
        reservation = {
            "schema": "zenith.decide.archive-reservation/v1",
            "mission_id": canonical_mission_id,
            "operation_id": canonical_operation_id,
            "request_sha256": request_sha256,
            "input_hashes": expected_hashes,
            "mission_root_identity": snapshot["root_identity"],
            "mission_root_mode": snapshot["root_mode"],
            "lock_identity": snapshot["lock_identity"],
            "lock_mode": snapshot["lock_mode"],
        }
        reservation_bytes = _json_bytes(reservation)
        if len(reservation_bytes) > 64 * 1024:
            raise _typed_error("OUTPUT_TOO_LARGE", 422, "archive reservation exceeds its durable bound")
        journal = {
            "schema": "zenith.decide.transaction/v1",
            "mission_id": canonical_mission_id,
            "operation_id": canonical_operation_id,
            "request_sha256": request_sha256,
            "evidence_manifest_sha256": evidence_manifest_sha256,
            "base_revision": expected_revision,
            "result_revision": result_revision,
            "input_hashes": expected_hashes,
            "outputs": output_descriptors,
            "response_sha256": _sha256_canonical(response),
            "committed_at": committed_at,
            "evidence_artifacts": accepted_evidence,
            "mission_root_identity": snapshot["root_identity"],
            "mission_root_mode": snapshot["root_mode"],
            "lock_identity": snapshot["lock_identity"],
            "lock_mode": snapshot["lock_mode"],
            "storage_profile": snapshot["storage_profile"],
            "reservation_sha256": _sha256_bytes(reservation_bytes),
        }
        journal_bytes = _json_bytes(journal)
        if len(journal_bytes) > 1024 * 1024:
            raise _typed_error("OUTPUT_TOO_LARGE", 422, "transaction journal exceeds its durable bound")
        journal_sha256 = _sha256_bytes(journal_bytes)
        reservation_sha256 = _sha256_bytes(reservation_bytes)
        commit_binding_sha256 = _commit_binding_sha256(journal_sha256, reservation_sha256)
        receipt = {
            **receipt_body,
            "journal_sha256": journal_sha256,
            "commit_binding_sha256": commit_binding_sha256,
            "receipt_identity": {
                "body_sha256": receipt_body_sha256,
                "mode": "0400",
                "size": receipt_size,
            },
        }
        receipt_bytes = _json_bytes(receipt)
        if len(receipt_bytes) != receipt_size or len(receipt_bytes) > 1024 * 1024:
            raise _typed_error("OUTPUT_TOO_LARGE", 422, "durable receipt size is unstable or too large")
        postimages["receipt.json"] = receipt_bytes
        marker_bytes = _json_bytes({
            "schema": "zenith.decide.commit/v1",
            "journal_sha256": journal_sha256,
            "receipt_sha256": _sha256_bytes(receipt_bytes),
            "reservation_sha256": reservation_sha256,
            "commit_binding_sha256": commit_binding_sha256,
        })
        if len(marker_bytes) > 4096:
            raise _typed_error("OUTPUT_TOO_LARGE", 422, "COMMIT marker exceeds its durable bound")

        metadata_fd, receipts_fd, archive_fd = _open_metadata_children(authority, create=True)
        assert metadata_fd is not None and receipts_fd is not None and archive_fd is not None
        active_fd: int | None = None
        post_fd: int | None = None
        try:
            archived_count, metadata_bytes = _metadata_usage(authority, metadata_fd)
            predicted_bytes = (
                sum(len(data) for data in postimages.values())
                + len(receipt_bytes)
                + len(journal_bytes)
                + (2 * len(reservation_bytes))
                + len(marker_bytes)
                + 80
            )
            if archived_count >= _MAX_ARCHIVED_OPERATIONS or metadata_bytes + predicted_bytes > _MAX_METADATA_BYTES:
                raise _typed_error(
                    "STORAGE_QUOTA_EXCEEDED",
                    503,
                    "strict-decision metadata quota cannot admit another recoverable transaction",
                )
            reservation_name = _reservation_name(canonical_operation_id)
            reservation_temporary = _reservation_temp_name(canonical_operation_id)
            for dir_fd, name, label in (
                (archive_fd, canonical_operation_id, "operation archive"),
                (archive_fd, reservation_name, "operation reservation"),
                (archive_fd, reservation_temporary, "operation reservation temporary"),
                (receipts_fd, f"{canonical_operation_id}.json", "operation receipt"),
                (receipts_fd, f".{canonical_operation_id}.receipt.tmp", "receipt temporary"),
                (metadata_fd, "active", "active transaction"),
            ):
                if _entry_stat_at(dir_fd, name, label=label) is not None:
                    raise _recovery_blocked(f"{label} collides before COMMIT")
            _publish_reservation_at(
                archive_fd,
                authority,
                canonical_operation_id,
                reservation_bytes,
            )
            _decide_fault("after_archive_reservation")
            active_fd = _mkdir_exclusive_at(
                metadata_fd,
                "active",
                owner=authority.owner,
                gid=authority.gid,
                label="active transaction",
            )
            _decide_fault("after_active_create")
            _write_exclusive_at(
                active_fd,
                "reservation.json",
                reservation_bytes,
                0o400,
                owner=authority.owner,
                gid=authority.gid,
                label="active reservation",
            )
            post_fd = _mkdir_exclusive_at(
                active_fd,
                "post",
                owner=authority.owner,
                gid=authority.gid,
                label="transaction postimages",
            )
            for name in (*_DECIDE_STATE_OUTPUTS, "receipt.json"):
                mode = 0o400 if name == "receipt.json" else 0o600
                _write_exclusive_at(
                    post_fd,
                    name,
                    postimages[name],
                    mode,
                    owner=authority.owner,
                    gid=authority.gid,
                    label=f"staged postimage {name}",
                )
                _decide_fault(f"after_stage:{name}")
            _fsync_fd(post_fd)
            _write_exclusive_at(
                active_fd,
                "journal.json",
                journal_bytes,
                0o600,
                owner=authority.owner,
                gid=authority.gid,
                label="transaction journal",
            )
            _decide_fault("after_journal")
            _fsync_fd(active_fd)
            _fsync_fd(metadata_fd)

            try:
                final_snapshot = _read_decide_snapshot(path)
                if not _same_snapshot(snapshot, final_snapshot):
                    raise _typed_error(
                        "PRECONDITION_FAILED", 412, "mission files changed while strict decide was preparing"
                    )
                _validate_transaction_authority(authority, journal)
                _recheck_evidence_files(path, evidence_fingerprints)
            except BaseException:
                _remove_uncommitted_tree(
                    authority,
                    metadata_fd,
                    archive_fd,
                    active_fd,
                    reservation_name,
                )
                raise
            _write_exclusive_at(
                active_fd,
                "COMMIT",
                marker_bytes,
                0o400,
                owner=authority.owner,
                gid=authority.gid,
                label="COMMIT marker",
            )
            _decide_fault("after_commit_file")
            try:
                _fsync_fd(active_fd)
            except OSError as exc:
                raise _recovery_blocked(
                    "COMMIT durability is indeterminate; retry only this operation_id",
                    exc,
                ) from exc
            _decide_fault("after_commit_fsync")
        finally:
            if post_fd is not None:
                os.close(post_fd)
            if active_fd is not None:
                os.close(active_fd)
            os.close(receipts_fd)
            os.close(archive_fd)
        _recover_active_transaction(path)
        stored = _read_permanent_receipt(
            path,
            canonical_operation_id,
            request_sha256=request_sha256,
        )
        if stored is None:
            raise _recovery_blocked("committed decide receipt is unexpectedly missing")
        return deepcopy(stored)


def _active_review_reservation(mission: dict[str, Any], attempt_id: str) -> bool:
    attempts = mission.get("review", {}).get("attempts", [])
    if mission.get("state") != "reviewing" or mission.get("review", {}).get("status") != "dispatching" or not attempts:
        return False
    attempt = attempts[-1]
    return attempt.get("id") == attempt_id and attempt.get("status") == "dispatching"


async def close(mission_id: str, workspace: str = ".") -> dict[str, Any]:
    path = _mission_dir(mission_id, workspace)
    with _FileLock(path / ".lock"):
        mission = _load_mission(path)
        if mission["state"] == "done":
            return _envelope("close", mission, idempotent=True)
        if mission["state"] == "reviewing":
            return _envelope("close", mission, review=mission["review"])
        if mission["state"] != "ready_for_review":
            raise ZenithError(f"mission {mission_id} cannot close while state is {mission['state']}; clear tasks, assertions, gates, evidence, and attention first")
        if mission["attention_open"]:
            raise ZenithError(f"mission {mission_id} still has open attention")
        if any(task["status"] not in _TERMINAL_TASK for task in mission["tasks"].values()):
            raise ZenithError(f"mission {mission_id} still has unfinished tasks")
        if any(assertion["status"] not in {"passed", "accepted_risk"} or not assertion["evidence"] for assertion in mission["assertions"].values()):
            raise ZenithError(f"mission {mission_id} has assertions without clean gates/evidence")
        attempt_id = f"r{len(mission['review']['attempts']) + 1:04d}"
        prompt = _review_prompt(mission, attempt_id)
        reviewer_model = mission["models"]["reviewer"]
        review_dir = path / "terminal-reviews" / attempt_id
        attempt = {"id": attempt_id, "status": "dispatching", "created_at": _now(), "handle": None, "ingested": False}
        mission["review"]["attempts"].append(attempt)
        mission["review"]["status"] = "dispatching"
        mission["state"] = "reviewing"
        _write_json(review_dir / "dispatch.json", {"mission_id": mission_id, "attempt_id": attempt_id, "prompt": prompt, "model": reviewer_model, "created_at": attempt["created_at"]})
        _event(path, "terminal_review_reserved", attempt_id=attempt_id)
        _save_mission(path, mission)
    try:
        handle = await _rlm_spawn(prompt, name=f"zenith-{mission_id[-8:]}-terminal-{attempt_id}", model=reviewer_model)
    except Exception as exc:
        with _FileLock(path / ".lock"):
            mission = _load_mission(path)
            if _active_review_reservation(mission, attempt_id):
                attempt = mission["review"]["attempts"][-1]
                attempt.update({"status": "error", "error": str(exc)})
                mission["review"]["status"] = "failed"
                _add_attention(path, mission, "review_admission_error", key=f"review:{attempt_id}:admission", attempt_id=attempt_id, error=str(exc))
                mission["state"] = "attention_needed"
                _event(path, "terminal_review_admission_failed", attempt_id=attempt_id, error=str(exc))
                _save_mission(path, mission)
                return _envelope("close", mission, warning=f"terminal reviewer admission failed: {exc}")
            return _envelope("close", mission, warning=f"ignored stale terminal reviewer admission failure: {exc}")
    handle_value = _handle_dict(handle)
    late_target = handle_value.get("rlm_child_id") or handle_value.get("session_name") or handle_value.get("name")
    admitted = False
    with _FileLock(path / ".lock"):
        mission = _load_mission(path)
        if _active_review_reservation(mission, attempt_id):
            attempt = mission["review"]["attempts"][-1]
            attempt.update({"status": "running", "handle": handle_value, "admitted_at": _now()})
            mission["review"]["status"] = "running"
            _event(path, "terminal_review_admitted", attempt_id=attempt_id, handle=handle_value)
            _save_mission(path, mission)
            admitted = True
    if not admitted:
        warnings: list[str] = []
        if late_target:
            try:
                await _rlm_delete_subagent(str(late_target))
            except Exception as exc:
                warnings.append(f"could not delete stale late terminal reviewer {late_target}: {exc}")
        else:
            warnings.append("stale late terminal reviewer returned no deletable handle id")
        with _FileLock(path / ".lock"):
            mission = _load_mission(path)
        return _envelope("close", mission, review=mission["review"], stale_admission=True, warnings=warnings)
    return _envelope("close", mission, review=mission["review"])


async def abort(
    mission_id: str,
    reason: str = "",
    workspace: str = ".",
    *,
    decisions: Any = None,
    expected_revision: int | None = None,
    expected_file_hashes: Mapping[str, str] | None = None,
    evidence_manifest: EvidenceManifestV1 | None = None,
    operation_id: str | None = None,
) -> DecideReceiptV1:
    """Strict abort compatibility route; legacy reason-only mutation is disabled."""

    if reason:
        raise _typed_error(
            "LEGACY_ABORT_UNAVAILABLE",
            428,
            "reason-only abort is disabled; submit exact abort actions through strict decide inputs",
        )
    if decisions is None:
        raise _typed_error(
            "PRECONDITION_REQUIRED",
            428,
            "strict abort requires decisions plus revision, seven hashes, evidence, and operation_id",
        )
    normalized = _normalise_decide_actions(decisions)
    if any(item["action"] != "abort" for item in normalized):
        raise _typed_error("INVALID_REQUEST", 422, "strict abort accepts only abort actions")
    return await decide(
        mission_id,
        normalized,
        workspace=workspace,
        expected_revision=expected_revision,
        expected_file_hashes=expected_file_hashes,
        evidence_manifest=evidence_manifest,
        operation_id=operation_id,
    )


async def _goal_create(objective: str) -> Any:
    module = importlib.import_module("goal")
    return await module.create(objective)


async def _goal_get() -> Any:
    module = importlib.import_module("goal")
    return await module.get()


async def _goal_complete() -> Any:
    module = importlib.import_module("goal")
    return await module.complete()


async def _heartbeat_create(instruction: str, interval: str, label: str) -> Any:
    module = importlib.import_module("rlm_heartbeat")
    return await module.create(instruction, interval=interval, label=label, delivery_mode="follow_up")


async def _heartbeat_delete(heartbeat_id: str) -> Any:
    module = importlib.import_module("rlm_heartbeat")
    return await module.delete(heartbeat_id)


def _response_id(response: Any, *keys: str) -> str | None:
    value = _jsonable(response)
    if not isinstance(value, Mapping):
        return None
    for key in keys:
        candidate = value.get(key)
        if isinstance(candidate, str) and candidate:
            return candidate
    for nested_key in ("goal", "heartbeat"):
        nested = value.get(nested_key)
        if isinstance(nested, Mapping):
            for key in keys:
                candidate = nested.get(key)
                if isinstance(candidate, str) and candidate:
                    return candidate
    return None


def _setting_up_is_stale(continuity: Mapping[str, Any], stale_after: float = 120.0) -> bool:
    value = continuity.get("setting_up_at")
    if not isinstance(value, str):
        return True
    try:
        timestamp = datetime.fromisoformat(value)
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
    except ValueError:
        return True
    return (datetime.now(timezone.utc) - timestamp).total_seconds() >= stale_after


def _owned_goal_is_current(continuity: Mapping[str, Any], current: Any) -> bool:
    current_value = _jsonable(current)
    goal_value = current_value.get("goal") if isinstance(current_value, Mapping) else None
    current_id = _response_id(current_value, "id", "goal_id")
    current_objective = goal_value.get("objective") if isinstance(goal_value, Mapping) else None
    return (
        bool(continuity.get("goal_id")) and current_id == continuity.get("goal_id")
    ) or current_objective == continuity.get("goal_objective")


async def ensure_continuity(
    mission_id: str,
    workspace: str = ".",
    heartbeat_interval: str = "5m",
    create_goal: bool = False,
) -> dict[str, Any]:
    path = _mission_dir(mission_id, workspace)
    if not isinstance(create_goal, bool):
        raise ZenithError("create_goal must be a boolean")
    setup_warnings: list[str] = []
    with _FileLock(path / ".lock"):
        mission = _load_mission(path)
        continuity = mission["continuity"]
        if mission["state"] in {"done", "aborted"}:
            raise ZenithError(f"cannot establish continuity for a {mission['state']} mission")
        if not isinstance(heartbeat_interval, str) or not heartbeat_interval.strip():
            raise ZenithError("heartbeat_interval must be a non-empty string")
        if continuity.get("setting_up"):
            if not _setting_up_is_stale(continuity):
                return _envelope("ensure_continuity", mission, continuity=continuity, idempotent=True)
            setup_warnings.append("recovered a stale continuity setup reservation")
            continuity["setting_up"] = False
            continuity["setting_up_at"] = None
        need_goal = create_goal and not continuity.get("goal_owned")
        need_heartbeat = not continuity.get("heartbeat_id")
        if not need_goal and not need_heartbeat:
            return _envelope("ensure_continuity", mission, continuity=continuity, idempotent=True)
        continuity["setting_up"] = True
        continuity["setting_up_at"] = _now()
        continuity["finalized"] = False
        snapshot = deepcopy(continuity)
        workspace_path = mission["workspace"]
        _save_mission(path, mission)
    warnings = list(setup_warnings)
    objective = f"Complete Zenith mission {mission_id} in {workspace_path}"
    goal_owned = bool(snapshot.get("goal_owned"))
    goal_id = snapshot.get("goal_id")
    goal_objective = snapshot.get("goal_objective")
    if need_goal:
        try:
            response = await _goal_create(objective)
            goal_owned = True
            goal_id = _response_id(response, "id", "goal_id")
            goal_objective = objective
        except Exception as exc:
            warnings.append(f"goal continuity unavailable: {exc}")
    heartbeat_id = snapshot.get("heartbeat_id")
    if need_heartbeat:
        try:
            response = await _heartbeat_create(
                f"Continue Zenith mission {mission_id} with one bounded tick: inspect its durable ledger. If attention is open, do not decide, accept risk, patch, retry, or abort; report the decision point to the root. Otherwise call await zenith.advance({mission_id!r}, workspace={workspace_path!r}) at most once. If it dispatches children, end the turn immediately without polling. If that tick returns ready_for_review, call await zenith.close({mission_id!r}, workspace={workspace_path!r}) once and end the turn after reviewer admission. Do not create a daemon loop or modify the ledger directly.",
                heartbeat_interval,
                f"zenith:{mission_id}",
            )
            heartbeat_id = _response_id(response, "id", "heartbeat_id")
            if heartbeat_id is None:
                warnings.append("heartbeat was created but its id was not returned; automatic cleanup may be unavailable")
        except Exception as exc:
            warnings.append(f"heartbeat continuity unavailable: {exc}")
    with _FileLock(path / ".lock"):
        mission = _load_mission(path)
        mission["continuity"].update({
            "setting_up": False,
            "setting_up_at": None,
            "goal_owned": goal_owned,
            "goal_id": goal_id,
            "goal_objective": goal_objective,
            "heartbeat_id": heartbeat_id,
            "heartbeat_interval": heartbeat_interval,
            "finalized": False,
            "warnings": mission["continuity"].get("warnings", []) + warnings,
        })
        _event(path, "continuity_ensured", goal_owned=goal_owned, heartbeat_id=heartbeat_id, warnings=warnings)
        _save_mission(path, mission)
    return _envelope("ensure_continuity", mission, continuity=mission["continuity"], warnings=warnings)


async def finalize_continuity(mission_id: str, workspace: str = ".", complete_goal: bool = True) -> dict[str, Any]:
    path = _mission_dir(mission_id, workspace)
    if not isinstance(complete_goal, bool):
        raise ZenithError("complete_goal must be a boolean")
    with _FileLock(path / ".lock"):
        mission = _load_mission(path)
        continuity = dict(mission["continuity"])
        if continuity.get("finalized"):
            return _envelope("finalize_continuity", mission, continuity=continuity, idempotent=True)
    warnings: list[str] = []
    heartbeat_id = continuity.get("heartbeat_id")
    heartbeat_deleted = not bool(heartbeat_id)
    if heartbeat_id:
        try:
            await _heartbeat_delete(heartbeat_id)
            heartbeat_deleted = True
        except Exception as exc:
            warnings.append(f"could not delete mission heartbeat {heartbeat_id}: {exc}")

    goal_completed = bool(continuity.get("goal_completed"))
    goal_pending = bool(continuity.get("goal_owned")) and not goal_completed
    manual_action: str | None = None
    if goal_pending:
        try:
            current = await _goal_get()
            same_goal = _owned_goal_is_current(continuity, current)
            if not same_goal:
                goal_pending = False
                warnings.append("mission goal is no longer current; left the current goal unchanged")
            elif complete_goal:
                await _goal_complete()
                goal_completed = True
                goal_pending = False
            else:
                manual_action = "/goal clear"
                warnings.append("Zenith-owned goal remains active after unsuccessful termination; run `/goal clear`, then retry finalization")
        except Exception as exc:
            warnings.append(f"could not reconcile mission goal: {exc}")
            if not complete_goal:
                manual_action = "/goal clear"
    finalized = heartbeat_deleted and not goal_pending
    with _FileLock(path / ".lock"):
        mission = _load_mission(path)
        update: dict[str, Any] = {
            "finalized": finalized,
            "heartbeat_id": None if heartbeat_deleted else heartbeat_id,
            "goal_completed": goal_completed,
        }
        if finalized:
            update["finalized_at"] = _now()
            update["manual_goal_clear_required"] = False
        else:
            update["finalized_at"] = None
            update["manual_goal_clear_required"] = manual_action is not None
        mission["continuity"].update(update)
        mission["continuity"]["warnings"] = mission["continuity"].get("warnings", []) + warnings
        _event(path, "continuity_finalized" if finalized else "continuity_cleanup_incomplete", goal_completed=goal_completed, warnings=warnings)
        _save_mission(path, mission)
    details: dict[str, Any] = {"continuity": mission["continuity"], "warnings": warnings}
    if manual_action:
        details["manual_action"] = manual_action
    return _envelope("finalize_continuity", mission, **details)


def _read_input(input_path: str, *, max_bytes: int = _MAX_STATE_BYTES) -> dict[str, Any]:
    if not isinstance(input_path, str) or not input_path.strip():
        raise ZenithError("this action requires input_path pointing to a JSON object")
    if not 1 <= max_bytes <= _MAX_STATE_BYTES:
        raise ZenithError("input byte bound is invalid")
    path = Path(input_path).expanduser()
    if not path.is_absolute():
        raise ZenithError("Zenith input_path must be absolute")
    flags = os.O_RDONLY | os.O_CLOEXEC | os.O_NOFOLLOW | getattr(os, "O_NONBLOCK", 0)
    try:
        fd = os.open(path, flags)
    except FileNotFoundError as exc:
        raise ZenithError("required Zenith input is missing") from exc
    except OSError as exc:
        raise ZenithError("cannot safely open Zenith input") from exc
    try:
        before = os.fstat(fd)
        if (
            not stat.S_ISREG(before.st_mode)
            or before.st_nlink != 1
            or before.st_uid != os.geteuid()
            or before.st_mode & (stat.S_ISUID | stat.S_ISGID | 0o022)
            or before.st_size < 0
            or before.st_size > max_bytes
        ):
            raise ZenithError("Zenith input must be one bounded controller-owned regular file")
        _reject_acl(fd, "Zenith input")
        data = _read_fd_exact(fd, int(before.st_size))
        after = os.fstat(fd)
        entry = os.stat(path, follow_symlinks=False)
        if (
            (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns)
            != (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns)
            or (after.st_dev, after.st_ino) != (entry.st_dev, entry.st_ino)
        ):
            raise ZenithError("Zenith input changed while being read")
    except OSError as exc:
        raise ZenithError("cannot read stable bounded Zenith input") from exc
    finally:
        os.close(fd)
    value = _strict_json_bytes(data, "input JSON", max_bytes=max_bytes)
    if not isinstance(value, dict):
        raise ZenithError("input JSON must be an object")
    return value


def _closed_dispatch_payload(payload: dict[str, Any], fields: set[str], action: str) -> dict[str, Any]:
    unknown = set(payload) - fields
    missing = fields - set(payload)
    if unknown or missing:
        raise _typed_error(
            "INVALID_REQUEST",
            422,
            f"{action} input must contain exactly {sorted(fields)}",
        )
    return payload


async def run(
    brief: str = "",
    workspace: str = ".",
    action: str = "start",
    mission_id: str = "",
    input_path: str = "",
    concurrency: int | str = 3,
    min_concurrency: int = 1,
    max_concurrency: int | None = None,
    persistent: bool = True,
    heartbeat_interval: str = "5m",
    model: str = "",
    require_preflight: bool = True,
    create_goal: bool = False,
) -> str:
    """Run one bounded Zenith action and return a JSON envelope string."""
    try:
        if action == "start":
            result = await start(
                brief,
                workspace=workspace,
                concurrency=concurrency,
                min_concurrency=min_concurrency,
                max_concurrency=max_concurrency,
                model=model or None,
                persistent=persistent,
                heartbeat_interval=heartbeat_interval,
                require_preflight=require_preflight,
                create_goal=create_goal,
            )
        elif action in {"list", "list_missions"}:
            result = list_missions(workspace=workspace)
        elif action == "inspect":
            result = inspect(mission_id, workspace=workspace)
        elif action == "get_decide_preconditions":
            result = get_decide_preconditions(mission_id, workspace=workspace)
        elif action == "advance":
            result = await advance(mission_id, workspace=workspace)
        elif action == "set_concurrency":
            payload = _read_input(input_path)
            result = await set_concurrency(
                mission_id,
                payload.get("concurrency"),
                workspace=workspace,
                min_concurrency=payload.get("min_concurrency", 1),
                max_concurrency=payload.get("max_concurrency"),
            )
        elif action == "submit_plan":
            payload = _read_input(input_path)
            result = submit_plan(mission_id, payload.get("contract"), payload.get("tasks"), workspace=workspace, mission=str(payload.get("mission", "")))
        elif action == "decide":
            payload = _closed_dispatch_payload(
                _read_input(input_path, max_bytes=_MAX_REQUEST_BYTES),
                {"decisions", "expected_revision", "expected_file_hashes", "evidence_manifest", "operation_id"},
                "decide",
            )
            result = await decide(
                mission_id,
                payload["decisions"],
                workspace=workspace,
                expected_revision=payload["expected_revision"],
                expected_file_hashes=payload["expected_file_hashes"],
                evidence_manifest=payload["evidence_manifest"],
                operation_id=payload["operation_id"],
            )
        elif action == "close":
            result = await close(mission_id, workspace=workspace)
        elif action == "abort":
            payload = _closed_dispatch_payload(
                _read_input(input_path, max_bytes=_MAX_REQUEST_BYTES),
                {"decisions", "expected_revision", "expected_file_hashes", "evidence_manifest", "operation_id"},
                "abort",
            )
            result = await abort(
                mission_id,
                "",
                workspace=workspace,
                decisions=payload["decisions"],
                expected_revision=payload["expected_revision"],
                expected_file_hashes=payload["expected_file_hashes"],
                evidence_manifest=payload["evidence_manifest"],
                operation_id=payload["operation_id"],
            )
        elif action == "end_task":
            payload = _read_input(input_path)
            result = await end_task(mission_id, workspace=workspace, **payload)
        elif action == "end_review":
            payload = _read_input(input_path)
            result = await end_review(mission_id, workspace=workspace, **payload)
        elif action == "ensure_continuity":
            result = await ensure_continuity(
                mission_id,
                workspace=workspace,
                heartbeat_interval=heartbeat_interval,
                create_goal=create_goal,
            )
        elif action == "finalize_continuity":
            payload = _read_input(input_path) if input_path else {}
            result = await finalize_continuity(mission_id, workspace=workspace, complete_goal=bool(payload.get("complete_goal", True)))
        else:
            raise ZenithError("action must be start, submit_plan, inspect, get_decide_preconditions, list, list_missions, advance, set_concurrency, decide, close, abort, end_task, end_review, ensure_continuity, or finalize_continuity")
        return json.dumps(_jsonable(result), indent=2, sort_keys=True)
    except ZenithError as exc:
        return json.dumps(
            {
                "ok": False,
                "action": action,
                "mission_id": mission_id or None,
                "error": str(exc),
                "error_type": "ZenithError",
                "code": exc.code,
                "http_status": exc.http_status,
            },
            indent=2,
            sort_keys=True,
        )
    except Exception:
        return json.dumps(
            {
                "ok": False,
                "action": action,
                "mission_id": mission_id or None,
                "error": "unexpected internal Zenith failure",
                "error_type": "InternalError",
                "code": "INTERNAL_ERROR",
                "http_status": 500,
            },
            indent=2,
            sort_keys=True,
        )


__all__ = [
    "DecideReceiptV1", "EvidenceManifestV1", "ZenithError", "abort", "advance", "close", "decide",
    "end_review", "end_task", "ensure_continuity", "finalize_continuity",
    "get_decide_preconditions", "inspect", "list_missions", "run", "set_concurrency",
    "start", "submit_plan",
]

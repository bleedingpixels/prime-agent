"""Linux local tools with explicit authority and descriptor anchored file access."""
from std.collections import List
from std.ffi import external_call
from std.memory import stack_allocation
from std.time import monotonic
from harness.types import ToolCall, ToolResult, ContentBlock
from interfaces.json import JsonDocument

comptime _DIRECTORY = 0o200000
comptime _NOFOLLOW = 0o400000
comptime _CLOEXEC = 0o2000000
comptime _NONBLOCK = 0o4000

struct ToolPolicy(Copyable, Movable):
    var workspace_root: String
    var allow_write: Bool
    var allow_shell: Bool
    var max_bytes: Int
    var timeout_ms: Int

    def __init__(out self, var workspace_root: String, allow_write: Bool = False, allow_shell: Bool = False, max_bytes: Int = 65536, timeout_ms: Int = 30000):
        self.workspace_root = workspace_root^
        self.allow_write = allow_write
        self.allow_shell = allow_shell
        self.max_bytes = max_bytes
        self.timeout_ms = timeout_ms

@fieldwise_init
struct Edit(Copyable, Movable):
    var old_text: String
    var new_text: String

@fieldwise_init
struct ShellResult(Copyable, Movable):
    var output: String
    var exit_code: Int
    var timed_out: Bool
    var truncated: Bool

struct _FD(Movable):
    var value: Int32
    def __init__(out self, value: Int32) raises:
        if value < 0:
            raise Error("local tool: descriptor open failed")
        self.value = value
    def __deinit__(deinit self):
        if self.value >= 0:
            _ = external_call["close", Int32](self.value)
    def close(mut self):
        _ = external_call["close", Int32](self.value)
        self.value = -1

def _cstring(value: String) raises -> List[UInt8]:
    if value.byte_length() >= 4096:
        raise Error("local tool: argument too long")
    var result = List[UInt8]()
    for b in value.as_bytes():
        if b == 0:
            raise Error("local tool: NUL argument")
        result.append(b)
    result.append(0)
    return result^

def _errno() -> Int:
    return Int(external_call["__errno_location", Pointer[Int32, MutUntrackedOrigin]]()[])

def _openat(parent: Int32, name: String, flags: Int, mode: Int = 0o600) raises -> Int32:
    var bytes = _cstring(name)
    var result = external_call["openat", Int32](parent, bytes.unsafe_ptr(), Int32(flags | _CLOEXEC), UInt32(mode))
    _ = bytes
    return result

def _validate(policy: ToolPolicy) raises:
    if not policy.workspace_root.startswith("/"):
        raise Error("local tool: workspace root must be absolute")
    if policy.max_bytes < 1 or policy.max_bytes > 8388608 or policy.timeout_ms < 1 or policy.timeout_ms > 300000:
        raise Error("local tool: invalid byte or time limit")

def _root(policy: ToolPolicy) raises -> _FD:
    _validate(policy)
    return _FD(_openat(-100, policy.workspace_root, _DIRECTORY | _NOFOLLOW))

def _parent(policy: ToolPolicy, path: String) raises -> Tuple[_FD, String]:
    if path.startswith("/") or path.byte_length() == 0:
        raise Error("local tool: path must be workspace relative")
    var parts = path.split("/")
    for part in parts:
        if part == "" or part == "." or part == "..":
            raise Error("local tool: invalid path component")
    var parent = _root(policy)
    for i in range(len(parts) - 1):
        var child = _FD(_openat(parent.value, String(parts[i]), _DIRECTORY | _NOFOLLOW))
        _ = parent
        parent = child^
    return parent^, String(parts[len(parts) - 1])

def read_file(policy: ToolPolicy, path: String) raises -> String:
    var pair = _parent(policy, path)
    var fd = _FD(_openat(pair[0].value, pair[1], _NOFOLLOW | _NONBLOCK))
    _ = pair
    # lseek rejects FIFOs/devices rather than allowing a blocking read.
    var size = external_call["lseek", Int64](fd.value, Int64(0), Int32(2))
    if size < 0 or size > Int64(policy.max_bytes):
        raise Error("local tool: file is not seekable or exceeds byte limit")
    if external_call["lseek", Int64](fd.value, Int64(0), Int32(0)) < 0:
        raise Error("local tool: seek failed")
    var bytes = List[UInt8](length=policy.max_bytes + 1, fill=UInt8(0))
    var count = 0
    while count <= policy.max_bytes:
        var n = Int(external_call["read", Int64](fd.value, bytes.unsafe_ptr().unsafe_offset(count), UInt64(policy.max_bytes + 1 - count)))
        if n < 0:
            if _errno() == 4:
                continue
            raise Error("local tool: read failed")
        if n == 0:
            break
        count += n
    _ = fd
    if count > policy.max_bytes:
        raise Error("local tool: file exceeds byte limit")
    bytes.resize(count, UInt8(0))
    return String(from_utf8=bytes^)

def write_file(policy: ToolPolicy, path: String, content: String) raises:
    if not policy.allow_write:
        raise Error("local tool: writes are disabled")
    if content.byte_length() > policy.max_bytes:
        raise Error("local tool: content exceeds byte limit")
    var pair = _parent(policy, path)
    var existing = _openat(pair[0].value, pair[1], _NOFOLLOW | _NONBLOCK)
    if existing >= 0:
        _ = external_call["close", Int32](existing)
    elif _errno() != 2:
        raise Error("local tool: destination is inaccessible")
    var random = stack_allocation[1, UInt64]()
    if external_call["getrandom", Int](random, Int(8), Int32(0)) != 8:
        raise Error("local tool: cannot create unique temporary name")
    var temp = String(".prime-tmp-") + String(random[])
    var temp_bytes = _cstring(temp)
    var name_bytes = _cstring(pair[1])
    var created = False
    try:
        var fd = _FD(_openat(pair[0].value, temp, 1 | 0o100 | 0o200 | _NOFOLLOW))
        created = True
        var bytes = content.as_bytes()
        var count = 0
        while count < content.byte_length():
            var n = external_call["write", Int](Int(fd.value), bytes.unsafe_ptr().unsafe_offset(count), content.byte_length() - count)
            if n < 0 and _errno() == 4:
                continue
            if n <= 0:
                raise Error("local tool: write failed")
            count += n
        _ = bytes
        if external_call["fsync", Int32](fd.value) != 0:
            raise Error("local tool: file sync failed")
        _ = fd
        if external_call["renameat", Int32](pair[0].value, temp_bytes.unsafe_ptr(), pair[0].value, name_bytes.unsafe_ptr()) != 0:
            raise Error("local tool: atomic rename failed")
        if external_call["fsync", Int32](pair[0].value) != 0:
            raise Error("local tool: directory sync failed")
    except error:
        if created:
            _ = external_call["unlinkat", Int32](pair[0].value, temp_bytes.unsafe_ptr(), Int32(0))
        _ = temp_bytes
        _ = name_bytes
        _ = pair
        raise error
    _ = temp_bytes
    _ = name_bytes
    _ = pair

def edit_file(policy: ToolPolicy, path: String, edits: List[Edit]) raises:
    if not policy.allow_write:
        raise Error("local tool: writes are disabled")
    if len(edits) == 0 or len(edits) > 64:
        raise Error("local tool: expected 1..64 edits")
    var original = read_file(policy, path)
    var starts = List[Int]()
    var ends = List[Int]()
    var result_bytes = original.byte_length()
    for edit in edits:
        if edit.old_text.byte_length() == 0:
            raise Error("local tool: old text must not be empty")
        var start = original.find(edit.old_text)
        if start < 0 or original.find(edit.old_text, start + 1) >= 0:
            raise Error("local tool: old text must match exactly once")
        var end = start + edit.old_text.byte_length()
        for i in range(len(starts)):
            if start < ends[i] and starts[i] < end:
                raise Error("local tool: edits overlap")
        starts.append(start)
        ends.append(end)
        result_bytes += edit.new_text.byte_length() - edit.old_text.byte_length()
    if result_bytes > policy.max_bytes:
        raise Error("local tool: edited content exceeds byte limit")
    var result = String("")
    var cursor = 0
    for _ in range(len(edits)):
        var selected = -1
        for i in range(len(edits)):
            if starts[i] >= cursor and (selected < 0 or starts[i] < starts[selected]):
                selected = i
        result += String(original[byte=cursor:starts[selected]]) + edits[selected].new_text
        cursor = ends[selected]
    result += String(original[byte=cursor:])
    write_file(policy, path, result)

@fieldwise_init
struct _PollFD(Copyable, Movable):
    var fd: Int32
    var events: Int16
    var revents: Int16

def _wait_child(pid: Int32, status: Pointer[Int32, MutUntrackedOrigin]) -> Bool:
    while external_call["waitpid", Int32](pid, status, Int32(0)) < 0:
        if _errno() != 4:
            return False
    return True

def run_shell(policy: ToolPolicy, command: String) raises -> ShellResult:
    if not policy.allow_shell:
        raise Error("local tool: shell execution is disabled")
    var root = _root(policy)
    # The command is passed as one argv value, never concatenated with a path.
    var shell = _cstring("/bin/sh")
    var flag = _cstring("-c")
    var script = _cstring(command)
    var args = List[Int]()
    args.append(Int(shell.unsafe_ptr()))
    args.append(Int(flag.unsafe_ptr()))
    args.append(Int(script.unsafe_ptr()))
    args.append(0)
    var pipes = stack_allocation[2, Int32]()
    if external_call["pipe2", Int32](pipes, Int32(_CLOEXEC)) != 0:
        raise Error("local tool: pipe failed")
    var input = _FD(pipes[unsafe_offset=0])
    var output = _FD(pipes[unsafe_offset=1])
    var null_fd = _FD(_openat(-100, "/dev/null", 0))
    var pid = external_call["fork", Int32]()
    if pid < 0:
        raise Error("local tool: fork failed")
    if pid == 0:
        _ = external_call["setpgid", Int32](Int32(0), Int32(0))
        if external_call["fchdir", Int32](root.value) != 0 or external_call["dup2", Int32](output.value, Int32(1)) < 0 or external_call["dup2", Int32](output.value, Int32(2)) < 0 or external_call["dup2", Int32](null_fd.value, Int32(0)) < 0:
            _ = external_call["_exit", Int32](Int32(126))
        _ = external_call["execv", Int32](shell.unsafe_ptr(), args.unsafe_ptr())
        _ = external_call["_exit", Int32](Int32(127))
    _ = external_call["setpgid", Int32](pid, pid)
    _ = root
    _ = shell
    _ = flag
    _ = script
    _ = args
    output.close()
    _ = null_fd
    var deadline = monotonic() + policy.timeout_ms * 1000000
    var bytes = List[UInt8]()
    var block = stack_allocation[4096, UInt8]()
    var timed_out = False
    var truncated = False
    var status = stack_allocation[1, Int32]()
    try:
        var completion = _FD(Int32(external_call["syscall", Int64](Int64(434), pid, Int32(0))))
        while True:
            var remaining = deadline - monotonic()
            if remaining <= 0:
                timed_out = True
                break
            var record = List[_PollFD](length=1, fill=_PollFD(input.value, 1, 0))
            var ready = external_call["poll", Int32](record.unsafe_ptr(), UInt64(1), Int32((remaining + 999999) // 1000000))
            _ = record
            if ready < 0:
                if _errno() == 4:
                    continue
                raise Error("local tool: poll failed")
            if ready == 0:
                timed_out = True
                break
            var n = Int(external_call["read", Int64](input.value, block, UInt64(4096)))
            if n < 0:
                if _errno() == 4:
                    continue
                raise Error("local tool: shell read failed")
            if n == 0:
                break
            for i in range(n):
                if len(bytes) == policy.max_bytes:
                    truncated = True
                    break
                bytes.append(block[unsafe_offset=i])
            if truncated:
                break
        while not timed_out and not truncated:
            var remaining = deadline - monotonic()
            if remaining <= 0:
                timed_out = True
                break
            var event = List[_PollFD](length=1, fill=_PollFD(completion.value, 1, 0))
            var ready = external_call["poll", Int32](event.unsafe_ptr(), UInt64(1), Int32((remaining + 999999) // 1000000))
            _ = event
            if ready < 0:
                if _errno() == 4:
                    continue
                raise Error("local tool: completion poll failed")
            timed_out = ready == 0
            break
        _ = completion
    except error:
        _ = external_call["kill", Int32](-pid, Int32(9))
        _ = _wait_child(pid, status)
        _ = input
        _ = output
        raise error
    if timed_out or truncated:
        _ = external_call["kill", Int32](-pid, Int32(9))
    if not _wait_child(pid, status):
        raise Error("local tool: wait failed")
    _ = input
    _ = output
    var exit_code = 0 if (status[] & 127) == 0 else -1
    if exit_code == 0:
        exit_code = Int((status[] >> 8) & 255)
    return ShellResult(String(from_utf8=bytes^), exit_code, timed_out, truncated)

def workspace_root(path: String) raises -> String:
    """CLI-only canonicalization; tools themselves require an absolute root."""
    var bytes = _cstring(path)
    var buffer = stack_allocation[4096, UInt8]()
    var result = external_call["realpath", Int](bytes.unsafe_ptr(), buffer)
    _ = bytes
    if result == 0:
        raise Error("local tool: workspace does not exist")
    var resolved = List[UInt8]()
    for i in range(4096):
        if buffer[unsafe_offset=i] == 0:
            return String(from_utf8=resolved^)
        resolved.append(buffer[unsafe_offset=i])
    raise Error("local tool: workspace path too long")

def _argument(doc: JsonDocument, name: String) raises -> String:
    return doc.string(doc.get(name))

def execute_tool(call: ToolCall, policy: ToolPolicy) -> ToolResult:
    var content = List[ContentBlock]()
    var details = String("")
    var failed = False
    try:
        var doc = JsonDocument(call.arguments_json, policy.max_bytes)
        if doc.kind(0) != "object":
            raise Error("local tool: arguments must be an object")
        var output: String
        if call.name == "read":
            output = read_file(policy, _argument(doc, "path"))
        elif call.name == "write":
            write_file(policy, _argument(doc, "path"), _argument(doc, "content"))
            output = "File written"
        elif call.name == "edit":
            var node = doc.get("edits")
            if doc.kind(node) != "array":
                raise Error("local tool: edits must be an array")
            var edits = List[Edit]()
            for i in range(doc.size(node)):
                var item = doc.at(i, node)
                edits.append(Edit(doc.string(doc.get("oldText", item)), doc.string(doc.get("newText", item))))
            edit_file(policy, _argument(doc, "path"), edits)
            output = "File edited"
        elif call.name == "bash":
            var result = run_shell(policy, _argument(doc, "command"))
            output = result.output.copy()
            failed = result.exit_code != 0 or result.timed_out or result.truncated
            details = "{\"exit_code\":" + String(result.exit_code) + ",\"timed_out\":" + ("true" if result.timed_out else "false") + ",\"truncated\":" + ("true" if result.truncated else "false") + "}"
        else:
            raise Error("local tool: unknown tool name")
        content.append(ContentBlock.text_block(output^))
    except error:
        failed = True
        content.append(ContentBlock.text_block(String(error)))
    return ToolResult(call.id.copy(), call.name.copy(), content^, failed, details^)

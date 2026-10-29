# testing artifact
from std.collections import List
from std.ffi import external_call
from std.testing import assert_equal, assert_true
from interfaces.tools import ToolPolicy, Edit, read_file, write_file, edit_file, run_shell, execute_tool, workspace_root, _cstring
from harness.types import ToolCall

def main() raises:
    var template = _cstring("/tmp/prime-local-';-XXXXXX")
    assert_true(external_call["mkdtemp", Int](template.unsafe_ptr()) != 0)
    template.resize(len(template) - 1, UInt8(0))
    var root = String(from_utf8=template^)
    var policy = ToolPolicy(root.copy(), allow_write=True, allow_shell=True, max_bytes=4096, timeout_ms=5000)
    try:
        write_file(policy, "text", "alpha beta gamma héllo")
        assert_equal(read_file(policy, "text"), "alpha beta gamma héllo")
        var edits = List[Edit]()
        edits.append(Edit("gamma", "alpha"))
        edits.append(Edit("alpha", "first"))
        edit_file(policy, "text", edits)
        assert_equal(read_file(policy, "text"), "first beta alpha héllo")
        var denied = ToolPolicy(root.copy())
        assert_true(execute_tool(ToolCall("1", "write", "{\"path\":\"text\",\"content\":\"bad\"}"), denied).is_error)
        assert_equal(read_file(policy, "text"), "first beta alpha héllo")
        assert_true(execute_tool(ToolCall("2", "bash", "{\"command\":\"printf unsafe\"}"), denied).is_error)
        for path in ["../outside", "/etc/passwd", "text/../text", "", "./text"]:
            var rejected = False
            try:
                _ = read_file(policy, path)
            except:
                rejected = True
            assert_true(rejected)
        var target = _cstring("/etc/passwd")
        var link = _cstring(root + "/link")
        assert_equal(external_call["symlink", Int32](target.unsafe_ptr(), link.unsafe_ptr()), 0)
        _ = target
        _ = link
        var rejected = False
        try:
            _ = read_file(policy, "link")
        except:
            rejected = True
        assert_true(rejected)
        rejected = False
        try:
            write_file(policy, "link", "no")
        except:
            rejected = True
        assert_true(rejected)
        write_file(policy, "text", "aaa")
        edits = List[Edit]()
        edits.append(Edit("aa", "X"))
        rejected = False
        try:
            edit_file(policy, "text", edits)
        except:
            rejected = True
        assert_true(rejected)
        assert_equal(read_file(policy, "text"), "aaa")
        write_file(policy, "text", "abcdef")
        edits = List[Edit]()
        edits.append(Edit("abc", "X"))
        edits.append(Edit("bcd", "Y"))
        rejected = False
        try:
            edit_file(policy, "text", edits)
        except:
            rejected = True
        assert_true(rejected)
        assert_equal(read_file(policy, "text"), "abcdef")
        var small = ToolPolicy(root.copy(), allow_write=True, max_bytes=2)
        rejected = False
        try:
            _ = read_file(small, "text")
        except:
            rejected = True
        assert_true(rejected)
        rejected = False
        try:
            write_file(small, "text", "long")
        except:
            rejected = True
        assert_true(rejected)
        assert_equal(read_file(policy, "text"), "abcdef")
        var shell = run_shell(policy, "printf stdout; printf stderr >&2; exit 7")
        assert_equal(shell.output, "stdoutstderr")
        assert_equal(shell.exit_code, 7)
        assert_true(not shell.timed_out and not shell.truncated)
        shell = run_shell(policy, "pwd")
        assert_equal(shell.output, root + "\n")
        var deadline_policy = ToolPolicy(root.copy(), allow_shell=True, timeout_ms=100)
        shell = run_shell(deadline_policy, "printf '%s' \"$$\"; exec 1>&- 2>&-; while :; do :; done")
        assert_true(shell.timed_out)
        assert_equal(external_call["kill", Int32](Int32(Int(shell.output)), Int32(0)), -1)
        var cap = ToolPolicy(root.copy(), allow_shell=True, max_bytes=8, timeout_ms=100)
        shell = run_shell(cap, "while :; do printf 123456789; done")
        assert_true(shell.truncated)
        assert_equal(shell.output.byte_length(), 8)
        assert_equal(workspace_root(root), root)
        print("local tools: permissions, paths, atomic writes, original-text edits, shell limits passed")
    finally:
        for name in ["text", "link"]:
            var path = _cstring(root + "/" + name)
            _ = external_call["unlink", Int32](path.unsafe_ptr())
            _ = path
        var path = _cstring(root)
        assert_equal(external_call["rmdir", Int32](path.unsafe_ptr()), 0)
        _ = path

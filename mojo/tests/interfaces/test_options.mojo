# testing artifact
from std.collections import List
from std.testing import assert_equal
from interfaces.options import parse_options


def main() raises:
    var args: List[String] = ["prime", "--allow-write", "--max-turns", "3", "--", "--literal", "prompt"]
    var options = parse_options(args)
    assert_equal(options.allow_write, True)
    assert_equal(options.allow_shell, False)
    assert_equal(options.max_turns, 3)
    assert_equal(options.prompt, "--literal prompt")
    var invalid: List[String] = ["prime", "--mode", "daemon"]
    var rejected = False
    try:
        _ = parse_options(invalid)
    except:
        rejected = True
    assert_equal(rejected, True)
    invalid = ["prime", "--base-url", "http://localhost"]
    rejected = False
    try:
        _ = parse_options(invalid)
    except:
        rejected = True
    assert_equal(rejected, True)
    invalid = ["prime", "--max-turns", "0"]
    rejected = False
    try:
        _ = parse_options(invalid)
    except:
        rejected = True
    assert_equal(rejected, True)
    print("options: PASS")

# testing artifact
from interfaces.json import JsonDocument, json_quote
from std.collections import List
from std.testing import assert_equal, assert_true


def bad(text: String) raises:
    var rejected = False
    try:
        var doc = JsonDocument(text)
    except:
        rejected = True
    assert_true(rejected)


def main() raises:
    var doc = JsonDocument('{"a":[1,{"x":"\\uD83D\\uDE00\\n"}],"b":true,"c":null}')
    var array = doc.get("a")
    assert_equal(doc.size(array), 2)
    assert_equal(doc.integer(doc.at(0, array)), 1)
    assert_equal(doc.string(doc.get("x", doc.at(1, array))), "😀\n")
    assert_equal(doc.raw(doc.get("b")), "true")
    assert_equal(doc.kind(doc.get("c")), "null")
    assert_equal(doc.get("absent"), -1)
    assert_equal(doc.get("a", -1), -1)
    assert_equal(doc.size(-1), 0)
    var value = 'quote" slash\\ tab\t 雪'
    var roundtrip = JsonDocument(json_quote(value))
    assert_equal(roundtrip.string(0), value)
    for text in ["", "[1,]", '{"a":1,"a":2}', "01", "1e", "true false", '"\\uD800"', '"\\uDC00"', '"\\q"', '"\n"', "[", "{", "1.0x"]:
        bad(text)
    var rejected = False
    try:
        var tiny = JsonDocument("[123]", 4)
    except:
        rejected = True
    assert_true(rejected)
    var deep = String("0")
    for _ in range(66):
        deep = "[" + deep + "]"
    bad(deep)
    var bytes = List[UInt8]()
    for b in [34, 192, 128, 34]:
        bytes.append(UInt8(b))
    bad(String(unsafe_from_utf8=bytes^))
    var maximum = JsonDocument("9223372036854775807")
    assert_equal(maximum.integer(0), 9223372036854775807)
    var minimum = JsonDocument("-9223372036854775808")
    assert_equal(minimum.integer(0), -9223372036854775807 - 1)
    rejected = False
    try:
        var overflow = JsonDocument("9223372036854775808")
        _ = overflow.integer(0)
    except:
        rejected = True
    assert_true(rejected)
    print("JSON strict syntax, Unicode, limits: PASS")

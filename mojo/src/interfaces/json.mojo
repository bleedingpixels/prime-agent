"""Bounded JSON tree with strict syntax and decoded Unicode strings."""
from std.collections import Dict, List


def _validate_utf8(value: String) raises:
    var bytes = value.as_bytes()
    var i = 0
    while i < len(bytes):
        var b = Int(bytes[i])
        if b < 128:
            i += 1
            continue
        var n: Int
        var cp: Int
        var minimum: Int
        if b >= 194 and b <= 223:
            n = 2
            cp = b & 31
            minimum = 128
        elif b >= 224 and b <= 239:
            n = 3
            cp = b & 15
            minimum = 2048
        elif b >= 240 and b <= 244:
            n = 4
            cp = b & 7
            minimum = 65536
        else:
            raise Error("JSON invalid UTF-8")
        if i + n > len(bytes):
            raise Error("JSON truncated UTF-8")
        for j in range(1, n):
            var c = Int(bytes[i + j])
            if c < 128 or c > 191:
                raise Error("JSON invalid UTF-8 continuation")
            cp = (cp << 6) | (c & 63)
        if cp < minimum or cp > 1114111 or (cp >= 55296 and cp <= 57343):
            raise Error("JSON invalid Unicode scalar")
        i += n


def _slice(s: String, start: Int, end: Int) -> String:
    var bytes = List[UInt8]()
    var span = s.as_bytes()
    for i in range(start, end):
        bytes.append(span[i])
    return String(unsafe_from_utf8=bytes^)


def _utf8(mut out: List[UInt8], cp: Int):
    if cp < 128:
        out.append(UInt8(cp))
    elif cp < 2048:
        out.append(UInt8(192 | (cp >> 6)))
        out.append(UInt8(128 | (cp & 63)))
    elif cp < 65536:
        out.append(UInt8(224 | (cp >> 12)))
        out.append(UInt8(128 | ((cp >> 6) & 63)))
        out.append(UInt8(128 | (cp & 63)))
    else:
        out.append(UInt8(240 | (cp >> 18)))
        out.append(UInt8(128 | ((cp >> 12) & 63)))
        out.append(UInt8(128 | ((cp >> 6) & 63)))
        out.append(UInt8(128 | (cp & 63)))


struct _Node(Copyable, Movable):
    var parent: Int
    var key: String
    var tag: String
    var start: Int
    var end: Int
    var value: String
    var children: List[Int]
    def __init__(out self, parent: Int, key: String, tag: String, start: Int):
        self.parent = parent
        self.key = key
        self.tag = tag
        self.start = start
        self.end = start
        self.value = ""
        self.children = List[Int]()


struct JsonDocument(Copyable, Movable):
    var source: String
    var nodes: List[_Node]
    var cursor: Int

    def __init__(out self, source: String, max_bytes: Int = 8388608) raises:
        self.source = source
        self.nodes = List[_Node]()
        self.cursor = 0
        if source.byte_length() > max_bytes or max_bytes <= 0:
            raise Error("JSON byte limit exceeded")
        _validate_utf8(source)
        self._space()
        _ = self._value(-1, "", 0)
        self._space()
        if self.cursor != source.byte_length():
            raise Error("JSON trailing input")

    def _byte(self, i: Int) -> Int:
        if i >= self.source.byte_length():
            return -1
        return Int(self.source.as_bytes()[i])

    def _space(mut self):
        while self._byte(self.cursor) == 32 or self._byte(self.cursor) == 9 or self._byte(self.cursor) == 10 or self._byte(self.cursor) == 13:
            self.cursor += 1

    def _hex(mut self) raises -> Int:
        var result = 0
        for _ in range(4):
            var b = self._byte(self.cursor)
            self.cursor += 1
            var v = b - 48
            if b >= 65 and b <= 70:
                v = b - 55
            elif b >= 97 and b <= 102:
                v = b - 87
            elif b < 48 or b > 57:
                raise Error("JSON invalid Unicode escape")
            result = result * 16 + v
        return result

    def _string(mut self) raises -> String:
        if self._byte(self.cursor) != 34:
            raise Error("JSON expected string")
        self.cursor += 1
        var out = List[UInt8]()
        while True:
            var b = self._byte(self.cursor)
            self.cursor += 1
            if b == 34:
                return String(unsafe_from_utf8=out^)
            if b < 32:
                raise Error("JSON unterminated string or control byte")
            if b == 92:
                b = self._byte(self.cursor)
                self.cursor += 1
                if b == 117:
                    var cp = self._hex()
                    if cp >= 55296 and cp <= 56319:
                        if self._byte(self.cursor) != 92 or self._byte(self.cursor + 1) != 117:
                            raise Error("JSON missing low surrogate")
                        self.cursor += 2
                        var low = self._hex()
                        if low < 56320 or low > 57343:
                            raise Error("JSON invalid low surrogate")
                        cp = 65536 + ((cp - 55296) << 10) + low - 56320
                    elif cp >= 56320 and cp <= 57343:
                        raise Error("JSON isolated low surrogate")
                    _utf8(out, cp)
                    continue
                elif b == 98:
                    b = 8
                elif b == 102:
                    b = 12
                elif b == 110:
                    b = 10
                elif b == 114:
                    b = 13
                elif b == 116:
                    b = 9
                elif b != 34 and b != 92 and b != 47:
                    raise Error("JSON invalid escape")
            out.append(UInt8(b))

    def _value(mut self, parent: Int, key: String, depth: Int) raises -> Int:
        if depth > 64 or len(self.nodes) >= 65536:
            raise Error("JSON structural limit exceeded")
        self._space()
        var start = self.cursor
        var b = self._byte(start)
        var tag = "number"
        if b == 123:
            tag = "object"
        elif b == 91:
            tag = "array"
        elif b == 34:
            tag = "string"
        elif b == 116 or b == 102:
            tag = "boolean"
        elif b == 110:
            tag = "null"
        var node = len(self.nodes)
        self.nodes.append(_Node(parent, key, tag, start))
        if parent >= 0:
            self.nodes[parent].children.append(node)
        if tag == "object" or tag == "array":
            var keys = Dict[String, Bool]()
            self.cursor += 1
            self._space()
            var close = 93
            if tag == "object":
                close = 125
            if self._byte(self.cursor) != close:
                while True:
                    var child_key = ""
                    if tag == "object":
                        child_key = self._string()
                        if child_key in keys:
                            raise Error("JSON duplicate object key")
                        keys[child_key.copy()] = True
                        self._space()
                        if self._byte(self.cursor) != 58:
                            raise Error("JSON expected colon")
                        self.cursor += 1
                    _ = self._value(node, child_key, depth + 1)
                    self._space()
                    if self._byte(self.cursor) == close:
                        break
                    if self._byte(self.cursor) != 44:
                        raise Error("JSON expected comma")
                    self.cursor += 1
                    self._space()
            self.cursor += 1
        elif tag == "string":
            self.nodes[node].value = self._string()
        elif tag == "number":
            if b == 45:
                self.cursor += 1
            b = self._byte(self.cursor)
            if b < 48 or b > 57:
                raise Error("JSON expected value")
            self.cursor += 1
            if b != 48:
                while self._byte(self.cursor) >= 48 and self._byte(self.cursor) <= 57:
                    self.cursor += 1
            if self._byte(self.cursor) == 46:
                self.cursor += 1
                self._digits()
            if self._byte(self.cursor) == 101 or self._byte(self.cursor) == 69:
                self.cursor += 1
                if self._byte(self.cursor) == 43 or self._byte(self.cursor) == 45:
                    self.cursor += 1
                self._digits()
        else:
            var token = "null"
            if b == 116:
                token = "true"
            elif b == 102:
                token = "false"
            if _slice(self.source, self.cursor, min(self.cursor + token.byte_length(), self.source.byte_length())) != token:
                raise Error("JSON invalid literal")
            self.cursor += token.byte_length()
        self.nodes[node].end = self.cursor
        return node

    def _digits(mut self) raises:
        var start = self.cursor
        while self._byte(self.cursor) >= 48 and self._byte(self.cursor) <= 57:
            self.cursor += 1
        if self.cursor == start:
            raise Error("JSON expected digits")

    def get(self, key: String, parent: Int = 0) -> Int:
        if parent < 0 or parent >= len(self.nodes):
            return -1
        for i in self.nodes[parent].children:
            if self.nodes[i].key == key:
                return i
        return -1

    def at(self, index: Int, parent: Int = 0) -> Int:
        if parent < 0 or parent >= len(self.nodes):
            return -1
        if index < 0 or index >= len(self.nodes[parent].children):
            return -1
        return self.nodes[parent].children[index]

    def kind(self, node: Int) -> String:
        if node < 0 or node >= len(self.nodes):
            return "missing"
        return self.nodes[node].tag

    def string(self, node: Int) raises -> String:
        if self.kind(node) != "string":
            raise Error("JSON expected string field")
        return self.nodes[node].value

    def raw(self, node: Int) -> String:
        if node < 0 or node >= len(self.nodes):
            return ""
        return _slice(self.source, self.nodes[node].start, self.nodes[node].end)

    def integer(self, node: Int) raises -> Int:
        if self.kind(node) != "number":
            raise Error("JSON expected integer field")
        var text = self.raw(node)
        if "." in text or "e" in text or "E" in text:
            raise Error("JSON expected integer field")
        var negative = text.startswith("-")
        var offset = Int(negative)
        var limit = UInt64(9223372036854775807) + UInt64(negative)
        var result = UInt64(0)
        for i in range(offset, text.byte_length()):
            var digit = UInt64(text.as_bytes()[i] - 48)
            if result > (limit - digit) // 10:
                raise Error("JSON integer out of range")
            result = result * 10 + digit
        if negative:
            if result == UInt64(9223372036854775808):
                return -9223372036854775807 - 1
            return -Int(result)
        return Int(result)

    def size(self, parent: Int = 0) -> Int:
        if parent < 0 or parent >= len(self.nodes):
            return 0
        return len(self.nodes[parent].children)


def json_quote(value: String) -> String:
    var out = List[UInt8]()
    out.append(34)
    var hex = "0123456789abcdef".as_bytes()
    for b in value.as_bytes():
        var c = Int(b)
        if c == 34 or c == 92:
            out.append(92)
            out.append(b)
        elif c < 32:
            for escaped in "\\u00".as_bytes():
                out.append(escaped)
            out.append(hex[c >> 4])
            out.append(hex[c & 15])
        else:
            out.append(b)
    out.append(34)
    return String(unsafe_from_utf8=out^)

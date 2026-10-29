"""Explicit CLI configuration; unsupported options fail before effects."""

from std.collections import List


struct CliOptions(Copyable, Movable):
    var prompt: String
    var fixture: String
    var base_url: String
    var model: String
    var api_key_env: String
    var workspace: String
    var session: String
    var resume: String
    var system_prompt: String
    var mode: String
    var max_turns: Int
    var allow_write: Bool
    var allow_shell: Bool
    var interactive: Bool
    var help: Bool

    def __init__(out self):
        self.prompt = ""
        self.fixture = ""
        self.base_url = ""
        self.model = ""
        self.api_key_env = ""
        self.workspace = "."
        self.session = ""
        self.resume = ""
        self.system_prompt = "You are a coding assistant. Use tools when needed."
        self.mode = "text"
        self.max_turns = 32
        self.allow_write = False
        self.allow_shell = False
        self.interactive = False
        self.help = False


def parse_options(args: List[String]) raises -> CliOptions:
    var result = CliOptions()
    var i = 1
    var positional = False
    while i < len(args):
        var arg = args[i]
        if positional:
            if result.prompt != "":
                result.prompt += " "
            result.prompt += arg
        elif arg == "--":
            positional = True
        elif arg == "--help" or arg == "-h":
            result.help = True
        elif arg == "--allow-write":
            result.allow_write = True
        elif arg == "--allow-shell":
            result.allow_shell = True
        elif arg == "--interactive":
            result.interactive = True
        elif arg == "--print" or arg == "-p":
            result.interactive = False
        elif arg == "--fixture" or arg == "--base-url" or arg == "--model" or arg == "--api-key-env" or arg == "--cwd" or arg == "--session" or arg == "--resume" or arg == "--system-prompt" or arg == "--mode" or arg == "--max-turns":
            i += 1
            if i >= len(args):
                raise Error("configuration: missing value for " + arg)
            var value = args[i]
            if arg == "--fixture":
                result.fixture = value
            elif arg == "--base-url":
                result.base_url = value
            elif arg == "--model":
                result.model = value
            elif arg == "--api-key-env":
                result.api_key_env = value
            elif arg == "--cwd":
                result.workspace = value
            elif arg == "--session":
                result.session = value
            elif arg == "--resume":
                result.resume = value
            elif arg == "--system-prompt":
                result.system_prompt = value
            elif arg == "--mode":
                if value != "text" and value != "json":
                    raise Error("unsupported: mode must be text or json")
                result.mode = value
            else:
                result.max_turns = Int(value)
                if result.max_turns < 1 or result.max_turns > 10000:
                    raise Error("configuration: max-turns must be between 1 and 10000")
        elif arg.startswith("-"):
            raise Error("unsupported: unknown option " + arg)
        else:
            if result.prompt != "":
                result.prompt += " "
            result.prompt += arg
        i += 1
    if result.fixture != "" and result.base_url != "":
        raise Error("configuration: fixture and base-url are mutually exclusive")
    if result.base_url != "" and result.model == "":
        raise Error("configuration: base-url requires an explicit model")
    return result^


def print_help():
    print("Prime Agent Mojo native CLI")
    print("Usage: prime-agent-mojo [options] [--] prompt")
    print("  --fixture FILE       Offline JSON array of Chat Completions responses")
    print("  --base-url URL       Explicit OpenAI-compatible endpoint")
    print("  --model NAME         Explicit provider model")
    print("  --api-key-env NAME   Read credential from this environment variable")
    print("  --cwd DIR            Tool workspace (default current directory)")
    print("  --allow-write        Enable write and edit tools")
    print("  --allow-shell        Enable shell tool (full local process authority)")
    print("  --session FILE       Save transcript after each completed turn")
    print("  --resume FILE        Load native Mojo transcript")
    print("  --system-prompt TEXT Set system instructions")
    print("  --mode text|json     Output format")
    print("  --max-turns N        Bound provider turns (default 32)")
    print("  --interactive        Read prompts until EOF or /quit")
    print("  --print, -p          Run one prompt")
    print("  --help, -h           Show this help")
    print("No daemon, RPC, ACP, OAuth, streaming or upstream session-format compatibility.")

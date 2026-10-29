MOJO ?= mojo
MOJOFLAGS ?= -O3 --Werror
IMPORTS := -I src -I .
LINKFLAGS := -Xlinker -lcurl
SOURCES := $(shell rg --files src vendor -g '*.mojo' 2>/dev/null)

.PHONY: all build test check benchmark demo
all: build

build: build/prime-agent-mojo

build/prime-agent-mojo: $(SOURCES)
	mkdir -p build
	$(MOJO) build $(MOJOFLAGS) $(IMPORTS) $(LINKFLAGS) src/main.mojo -o $@

test: build
	MOJO="$(MOJO)" MOJOFLAGS="$(MOJOFLAGS)" ./scripts/test.sh
	bash ./scripts/test-cli.sh

check: build test

benchmark:
	MOJO="$(MOJO)" MOJOFLAGS="$(MOJOFLAGS)" bash ./scripts/benchmark.sh

demo: build
	./build/prime-agent-mojo --fixture examples/actors.json --mode json "Delegate a task to a helper."

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build/tests
read -r -a compiler_flags <<< "${MOJOFLAGS:--O3 --Werror}"
mapfile -t tests < <(rg --files tests -g 'test_*.mojo' | sort)
if ((${#tests[@]} == 0)); then
    echo "No native Mojo tests found" >&2
    exit 1
fi
for source in "${tests[@]}"; do
    name="${source#tests/}"
    executable="build/tests/${name%.mojo}"
    mkdir -p "$(dirname "$executable")"
    "${MOJO:-mojo}" build "${compiler_flags[@]}" -I src -I . -Xlinker -lcurl "$source" -o "$executable"
    "$executable"
done
echo "Passed ${#tests[@]} native Mojo test programs"

#!/usr/bin/env bash
# benchmark artifact: checked, alternating serial scheduler measurements
set -euo pipefail
cd "$(dirname "$0")/.."
root=$PWD
compiler=$(command -v "${MOJO:-mojo}")
read -r -a flags <<< "${MOJOFLAGS:--O3 --Werror}"
mkdir -p build/evidence
evidence=$(mktemp -d "$root/build/evidence/scheduler.XXXXXXXX")
baseline=$(mktemp -d /tmp/prime-mojo-baseline.XXXXXXXX)
trap 'rm -rf "$baseline"' EXIT
cp -R vendor "$baseline/vendor"
mkdir "$baseline/benchmarks"
cp benchmarks/scheduler.mojo "$baseline/benchmarks/"
patch --batch --fuzz=0 -s -d "$baseline" -p0 < benchmarks/serial-baseline.patch
(
  cd "$baseline"
  "$compiler" build "${flags[@]}" -I . benchmarks/scheduler.mojo -o "$evidence/baseline"
) > "$evidence/baseline-build.log" 2>&1
"$compiler" build "${flags[@]}" -I . benchmarks/scheduler.mojo -o "$evidence/candidate" > "$evidence/candidate-build.log" 2>&1
cp "$baseline/vendor/boc/core.mojo" "$evidence/core.baseline.mojo"
{
  date -u
  "$compiler" --version
  uname -sm
  nproc
  uptime
  printf 'flags=%s\n' "${flags[*]}"
  sha256sum benchmarks/scheduler.mojo vendor/boc/core.mojo "$evidence/core.baseline.mojo" "$evidence/baseline" "$evidence/candidate"
} > "$evidence/environment.txt"
for sample in 1 2 3 4 5; do
  if (( sample % 2 )); then variants=(baseline candidate); else variants=(candidate baseline); fi
  for variant in "${variants[@]}"; do
    { time -p "$evidence/$variant" 256 256 1 > "$evidence/$variant-$sample.json"; } 2> "$evidence/$variant-$sample.time"
    jq -e '.completed == 65536 and .checksum == 65536 and .workers == 1 and .run_seconds > 0' "$evidence/$variant-$sample.json" > /dev/null
  done
done
jq -s '
  def stats: sort | {min: .[0], median: .[2], max: .[4]};
  def side: {run_seconds: (map(.run_seconds) | stats), admission_seconds: (map(.admission_seconds) | stats), total_seconds: (map(.total_seconds) | stats)};
  {baseline: (.[0:5] | side), candidate: (.[5:10] | side)} |
  . + {scheduler_speedup: (.baseline.run_seconds.median / .candidate.run_seconds.median), total_speedup: (.baseline.total_seconds.median / .candidate.total_seconds.median)}
' "$evidence"/baseline-{1,2,3,4,5}.json "$evidence"/candidate-{1,2,3,4,5}.json > "$evidence/summary.json"
cat "$evidence/summary.json"
printf 'Evidence: %s\n' "$evidence"

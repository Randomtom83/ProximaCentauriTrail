#!/usr/bin/env bash
# Proxima Trail — deterministic gate. FAIL LOUD, no silent death.
# Exits NONZERO on any failure, vacuous pass, skipped check, or "found nothing".
# Deps: node 22; scripts/frozen.js; test/frozen-baseline.json; harnesses in test/*.js.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
MIN_TESTS="${MIN_TESTS:-8}"          # vacuous-pass guard: fewer than this = FAIL
                                     # reconciled to the 8 committed harnesses in test/*.js:
                                     # smoke_full_run win_path loss_path brownout_hazard
                                     # colony_smoke voyage_smoke endings_golden mint1b
fail(){ echo "GATE FAIL: $*" >&2; exit 1; }
ok(){   echo "  ok  $*"; }

echo "== 1/4 syntax =="
for f in game.js audio.js; do
  [ -f "$f" ] || fail "missing $f"
  node --check "$f" || fail "node --check $f"
  ok "node --check $f"
done

echo "== 2/4 frozen-three (zero-diff vs committed baseline) =="
[ -f scripts/frozen.js ]          || fail "scripts/frozen.js missing"
[ -f test/frozen-baseline.json ]  || fail "test/frozen-baseline.json missing — cannot prove zero-diff"
node scripts/frozen.js --check test/frozen-baseline.json || fail "frozen-three drift or function not found"
ok "applyOutcome / resolveCheck / tryCompose match baseline"
echo "  note: composeEnding is golden-locked, verified by endings_golden below (not md5)."

echo "== 3/4 harnesses (each must exit nonzero on failure) =="
[ -d test ] || fail "no test/ directory — refusing vacuous pass"
shopt -s nullglob
mapfile -t TESTS < <(ls test/*.js 2>/dev/null | grep -v '/frozen-baseline' || true)
[ "${#TESTS[@]}" -ge "$MIN_TESTS" ] || fail "only ${#TESTS[@]} harness(es) found (< MIN_TESTS=$MIN_TESTS) — refusing vacuous pass"
GOLDEN=0; ran=0
for t in "${TESTS[@]}"; do
  node "$t" || fail "harness failed: $t"     # set -e + this || already aborts; explicit for clarity
  case "$t" in *endings_golden*) GOLDEN=1;; esac
  ran=$((ran+1)); ok "$t"
done
[ "$ran" -eq "${#TESTS[@]}" ] || fail "ran $ran of ${#TESTS[@]} harnesses (a harness exited early)"
[ "$GOLDEN" -eq 1 ] || fail "endings_golden harness not present — composeEnding is unguarded"

echo "== 4/4 result =="
echo "GATE PASS — $ran harnesses green, frozen-three intact, endings golden present."
# Reminder for harness authors: every harness MUST install a global error trap
# (window.onerror + unhandledrejection / process handlers) and assert a real terminal
# state. A swallowed exception or a non-terminating run is a FAILURE, not a pass.

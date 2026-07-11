---
file: harness-commit-spec.md
project: Prompt Writing
chat: Proxima Centauri Trail
date: 2026-06-28
---

# Proxima Trail — Harness Commit Spec (make the gate enforce)

Hand this to a Claude Code session (it's the first real Builder job). Goal: populate `test/`
with harnesses so `scripts/verify.sh` passes **meaningfully** — and so a silent death FAILS it.
The originals were ephemeral `/tmp` files and are gone; regenerate against the current `game.js`.

## Step 0 — discover the test seam (do not guess the API)
`game.js` exposes a test seam (confirmed ~line 4874): when `window.__PROXIMA_TEST__ === true`
is set **before** `game.js` loads, it attaches `window.__proxima = { … }`. **Read that object
literal in `game.js` and enumerate exactly what it exposes** (constructors, `render`, tick,
helpers, `composeEnding`/`composeOutcome`, `exodusYears`, etc.). Build harnesses against those
real exports — cite the seam line in a comment.

## The contract EVERY harness must meet (this is the whole point — no silent death)
Each `test/*.js` harness must:
1. **Boot headless** with the seam on: set `window.__PROXIMA_TEST__ = true` before loading
   `game.js` (jsdom, or a minimal DOM stub — `npm i -D jsdom` is fine; HANDOFF already assumes it).
2. **Install a global error trap up front** and treat ANY fire as failure:
   `window.onerror`, `window.addEventListener('unhandledrejection', …)`, and
   `process.on('uncaughtException')` / `process.on('unhandledRejection')`. If any fires → record
   it and exit nonzero. **A swallowed exception is a failed test, not a pass.**
3. **Drive a real scenario to a real terminal state** and assert the end actually rendered
   (win or loss screen present in the DOM / state), not merely "the harness didn't throw."
4. **Exit nonzero on any failed assertion** (`process.exit(1)` or throw to the top). Exit 0 only
   on genuine success. No `try/catch` that swallows — rethrow if you must catch.
5. Print a one-line `PASS <name>` / `FAIL <name>: <reason>` so the gate log is legible.

## Suite to regenerate (≥ MIN_TESTS; reconcile the count — see below)
- `smoke_full_run.js` — title → outfit → travel → events → end; asserts a terminal screen, zero errors.
- `win_path.js` — drive to a win; assert win screen + a rank string rendered.
- `loss_path.js` — drive to a loss (e.g. resource collapse / all-hands); assert loss screen.
- `brownout_hazard.js` — force a power brownout + a hazard; assert the run survives/ends coherently, no error.
- `colony_smoke.js` — Act II colony front to a terminal colony state.
- `voyage_smoke.js` — Act II homeward ark to a terminal voyage state.
- `endings_golden.js` — **the golden lock for the unfrozen `composeEnding`.** Drive each reachable
  ending state (the two-world matrix + colony-only + voyage-only) and snapshot `{won,tier,cause}`.
  It MUST assert non-empty coverage — **if zero endings were checked, FAIL** (guards a vacuous golden).
- `mint1b.js` — only if M-INT1b is built: assert the off-front digest is read-only (off-front state
  byte-identical with vs without capture) and both HUDs' "Years since exodus" == `exodusYears()`.

That's 7–8. **Reconcile `MIN_TESTS`** in `scripts/verify.sh` (currently `8`) to the real committed
count — set it to the number you actually land, so the vacuous-pass guard matches reality. Never set
it to 0.

## Definition of done
- `bash scripts/verify.sh` exits **0**: `node --check` clean, frozen-three matches baseline,
  `endings_golden` present, every harness green, harness count ≥ `MIN_TESTS`.
- Then deliberately break something (e.g. comment out a `throw`/end-state line in a scratch copy)
  and confirm the relevant harness **FAILS loudly** — prove the gate actually catches a silent death
  before trusting it. Revert the break.
- Commit `test/*.js` + the reconciled `MIN_TESTS` + `test/frozen-baseline.json` in one commit;
  push so CI runs the same suite.

## Notes
- If you add `jsdom`, that creates `package.json` / `node_modules` — add `node_modules/` to
  `.gitignore`; commit `package.json` + lockfile.
- The harnesses use only the seam's public exports; they must not reach into or modify frozen
  functions, and must change no game balance — they observe, they don't tune.

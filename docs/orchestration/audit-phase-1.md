# Audit — Phase 1 "One-Screen Bridge"

- **Range audited:** `91747f8..phase-1` (commits `ee616e8` then `eedc1ce`), worktree `wt-phase-1`, branch `phase-1`.
- **Method:** committed bytes only (`git show`/`git diff`), independent gate re-run, harness mutation test. Executor narration not consulted.
- **Overall verdict: PASS.**

Independent gate re-run (`bash scripts/verify.sh`): `GATE PASS — 10 harnesses green, frozen-three intact, endings golden present.` `node scripts/frozen.js --check` → `frozen-three intact`.

---

## Per-DoD verdict

### DoD 1 — Gate + frozen + baseline immutability — **PASS**
- `verify.sh` reproduced `GATE PASS` (10 harnesses). `frozen.js --check` passes; `applyOutcome`/`resolveCheck`/`tryCompose` md5 unchanged.
- Baseline immutability: `git diff 91747f8..phase-1 --stat -- test/frozen-baseline.json` is **empty** — baseline byte-identical, NOT updated. Correct for a presentation-only phase.

### DoD 2 — Presentation-only diff — **PASS**
- `--stat` for the range touches only: `style.css`, `index.html`, `test/layout_onescreen.js`, `docs/dashboard.html`, `docs/proxima-trail-implementation-plan.md`.
- **`game.js` is not touched at all** (`git diff ... -- game.js` empty). Therefore no changed `data-action`/`data-arg`/`data-set` token, no odds constant, no `earth.truth`/`EARTH_DOOM_YEARS` reference added — vacuously satisfied and stronger than required (the phase needed zero markup edits; `.bridge` already wraps the travel screen, Fork D).

### DoD 3 — Desktop-fit CSS present (AC1) — **PASS**
- `.bridge` (style.css:275-278): `display: grid; grid-template-rows: auto auto minmax(min-content,1fr); height:100%; min-height:0`. Uses `minmax(min-content,1fr)` last row (stronger than the DoD-allowed `minmax(0,1fr)`) — see Note 1.
- `.viewscreen` has `max-height: clamp(120px, 22vh, 200px)` (:206).
- `.console { min-height:0 }` (:291); `.console .log-wrap { min-height:0; contain:size }` (:294).
- `.console .log { min-height:96px }` (:295) — ≤ 96px ✓.
- `#crt` height uses `calc(100dvh - 20px)` (:59).

### DoD 4 — Mobile-fit CSS present (AC2) — **PASS**
- `@media (max-width:900px)`: `.console { display:grid; grid-template-rows: minmax(84px,1fr) auto }` — commands pinned to the bottom `auto` row, log in the flexible top row. Pin is CSS-only on existing DOM order, so it covers BOTH `.commands` variants (manual + autopilot) structurally.
- `.cmd-grid .btn, .commands .btn.small { min-height:44px }` present in the ≤900px block.
- `body` padding references `env(safe-area-inset-*)` (:50); `html,body { overflow-x:hidden }` (:43) and `#app { overflow-x:hidden }` (:124).
- `index.html` diff is EXACTLY the single-token append `, viewport-fit=cover` to the existing viewport meta `content` — no other byte changed.

### DoD 5 — Harness present + loud — **PASS**
- `test/layout_onescreen.js` present, counted by the gate (harness total 10 ≥ 9).
- Mutation test performed independently: replacing `minmax(min-content,1fr)` → `minmax(0,1fr)` produced `FAIL layout_onescreen: … the commands-never-clipped floor is missing` and **exit 1**. Not a false-green. Assertions inspect real substrings pulled from committed files (no hardcoded truthy path).

### DoD 6 — No shared-screen regression (AC3) — **PASS**
- Colony/voyage harnesses green in the gate run.
- `renderColony` (game.js:4585) and `renderVoyage` (4654) have **zero diff hunks** — game.js untouched across the range. Identified by function boundary, not line number.
- `.viewscreen` confirmed travel-only: sole game.js occurrence is line 4359, inside `renderTravel` (4311-4585).
- Fork E global `.menu.row .btn { min-height:44px }` at ≤900px is present and is a raise-only floor; its cross-screen blast radius is discharged by live evidence (DoD 7), not argued.

### DoD 7 — Live evidence (AC1/AC2) — **PASS**
- Verified via the orchestrator's `plan-events.jsonl` log (per instructions, not re-screenshotting):
  - Line 21: earlier **FAIL** note (commit 7974884) documenting the 1280×720 clipping of ATLAS + Abandon — the DoD-7 clipping masquerade the second commit fixed.
  - Line 23: **T5.3 live evidence matrix PASS** (commits ee616e8+eedc1ce) recording: 1280×720 manual (0/0/0 overflow, all 9 buttons incl. ATLAS + Abandon), 1280×720 autopilot (3/3, 0 overflow), 390×844 manual (0 overflow all axes, 9/9 ≥44px, nav chips + crew status column inside right edge → no-clipping assertion satisfied), 390×844 autopilot (all buttons ≥44px visible), **colony 390×844** (10 buttons ≥44px, no right-edge clip, `#app` scrolls normally) and **voyage 390×844** (7 buttons ≥44px, no x overflow) — the mandatory Fork-E cross-screen evidence.
- Cosmetic findings recorded there (topbar wrap, 720px viewscreen route-label clip, voyage STATUS header clip at 390px) are flagged non-blocking / next-phase — outside this phase's AC scope.

### DoD 8 — Docs pair (same commit) — **PASS**
- `docs/dashboard.html`: new `mui2` milestone block (tasks flipped `done`) + two dated `2026-07-02` LOG entries (feature + decision).
- `docs/proxima-trail-implementation-plan.md`: new appended `M-UI2` Addendum in the banner style. Diff shows **zero removed lines** in both files — pure append, prior sections byte-identical (append-only discipline held; +90 lines in the plan file matches the Addendum size).

---

## Undisclosed-fork hunt

No undisclosed forks found. Specifically checked for the usual corner-cutting:

- **Stubs / hardcodes / vacuous harness:** none. The harness inspects real committed substrings and fails loud (mutation-verified, exit 1 with reason).
- **Swallowed errors:** `.console` is deliberately free of `overflow:hidden` (the prior clipping accomplice); an undersized row overflows visibly rather than silently — the opposite of a swallowed failure.
- **Narrowed scope / skipped edge cases:** both `.commands` variants covered structurally by the CSS-only pin; both live-evidenced. Short-desktop (1280×720) edge case handled and evidenced after the first cut failed.
- **Baseline drift:** frozen-baseline byte-identical (not touched).
- **Silent docs clobber:** both docs are pure appends, no prior-content loss.

### Notes (observations, not findings — nothing to fix)

1. **Construct is stronger than the DoD letter.** DoD 3 permits `minmax(0,1fr)`; the build ships `minmax(min-content,1fr)` + `contain:size` on `.log-wrap`. This is a *correction* to the original T2.1/T2.3 plan letter (which `minmax(0,1fr)` alone satisfied but which live evidence proved clipped commands at 1280×720). The change was disclosed in both the second commit message and the docs, is within Fork A's grid approach, and the harness pins the corrected pair. Not a fork away from spec — a documented tightening toward the AC.

2. **`@media (max-height:800px)` block is new vs. the plan text.** It was not in the original M-INT task list but was added in the fix commit to make the min-content-floored console fit short desktops. It stays entirely within `style.css` and touches only travel-scoped/presentation selectors (`.bridge`, `.viewscreen`, `.stations .panel`, `.commands`, `.cmd-grid .btn`, `.btn.primary` padding/font-size only). No logic, no shared-screen structural change, no regression risk. Disclosed in the docs and asserted by harness check (i). Acceptable additive presentation change, not an undisclosed easier path.

---

## Overall: PASS

All 8 DoD items pass against committed bytes; gate and frozen check reproduced independently; harness confirmed fail-loud by mutation; live-evidence matrix (incl. mandatory colony/voyage 390×844) present in the orchestrator log with the no-clipping assertion satisfied. No undisclosed forks. Baseline and game.js untouched.

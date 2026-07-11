# Audit — Phase 4 (M-HOME1: return-leg named structure)

**Auditor inputs only:** worktree `wt-phase-4`, commit range `a4158f3..phase-4` (one commit
`e2d8062`), DoD `docs/orchestration/plan-phase-4.md` §4/§5/§7 + event-log locks. Verified
against committed bytes (`git show <SHA>:<path>`); executor narration not consulted.

**Overall verdict: PASS.** All AC1–AC4 + docs-pair items verified against committed bytes. No
undisclosed forks. No sacred-list drift. Gate independently reproduced GREEN (11 harnesses);
homeleg AC4 windows independently reproduced. One environmental note (worktree jsdom install is
partial) and two non-blocking observations recorded — none affect the verdict.

---

## Commit surface

`e2d8062` touches exactly 4 files: `game.js` (+78/-2), `test/homeleg.js` (+188 new),
`docs/dashboard.html` (+15), `docs/proxima-trail-implementation-plan.md` (+111, pure append).
`game.js` diff is 5 localized hunks: startVoyage@2437, voyageTurn peril region@2496,
new landmark block@2503, renderReturnMap@4369, test-seam export@5007. No other file changed.

---

## Per-DoD verdicts

### AC1 — return-leg structure — **PASS**
- **Voyage-scoped landmark array exists, SIBLING.** `HOME_WAYPOINTS` at game.js:2521 (3 interior
  landmarks). `WAYPOINTS` (50–71) and `CUM` (74) **byte-identical** to a4158f3 (`diff` of
  lines 50–90 = IDENTICAL). Confirmed a sibling, not an edit.
- **startVoyage seeds state; voyageTurn crosses + fires beats through the right path.**
  `waypointIndex:0` added at game.js:2441. `voyageCrossLandmarks(auto)` called at game.js:2506,
  sitting **between** the arrival/crew-death checks (2497–2499) **and** the peril roll (2510) —
  exactly where the DoD requires. Dispatch (`voyageLandmarkBeat`, 2547) routes anchored effects
  through `resolveVoyageCheck`/`voyageOutcome`/`presentVoyageEvent` (game.js:2553–2555) and
  **never `applyOutcome`** (grepped the two new functions — zero `applyOutcome`, zero
  `voyageHazardDanger`, zero `Math.random`).
- **renderReturnMap plots ≥1 interior named node.** Loop at game.js:4430 plots all 3 interior
  landmarks as `rm-node`/`rm-label` overlays with visited/current/future state; reuses
  `rmChart`/`rmGlyph`/`rmCurveY` (no new map engine). Outbound `renderRouteMap` (was 4292, now
  4345) is **byte-identical** offset-only (body diff = IDENTICAL).
- **Fiction guard held.** Names are void/deep-space (*The Fold Seam · The Halfway Dark · The Last
  Beacon*) — no reused Sol-station name.

### AC2 — M-INT2 constants resolved, no unlocked change — **PASS**
- **Every not-locked-to-change constant byte-identical to HEAD** (game.js lines 150–165 diff =
  IDENTICAL): `EARTH_DOOM_YEARS=220`, `VOY_YEARS_PER_TURN=1.6`, `EARTH_NOISE_P=0.30`,
  `LAUNCH_READY=100`.
- **`HOME_HAZARD_P=0.18, HOME_EVENT_P=0.34` declaration line byte-identical** — the whole line
  `var HOME_HAZARD_P = 0.18, HOME_EVENT_P = 0.34;` is unchanged (a4158f3:2614 == phase-4:2667).
  Decision 4A NO-OP honored: no shipped constant changed.
- **`newlife` weight unchanged** (`w: 3` both revisions) — Decision 5 "measure, don't tune" held.
- **No `0.40` leaked into shipped game.js.** Every `0.40`/`0.4` in game.js is a pre-existing
  constant (AGE_PER_TURN, hazard risks, skill factors); none is a `HOME_EVENT_P` override. The
  B-preview 0.40 lives ONLY in `test/homeleg.js:123` via the get/set seam (see AC4).

### AC3 — GATE PASS, frozen-three untouched, outbound byte-identical — **PASS**
- **GATE PASS independently reproduced: 11 harnesses green**, frozen-three intact, endings golden
  present. (Note: the worktree's own `node_modules/jsdom` is a **partial install** — missing
  `lib/api.js` — so a bare `bash scripts/verify.sh` fails at `a11y_focus_live.js` with
  `Cannot find module 'jsdom'`. Re-running with `NODE_PATH` pointed at the main repo's complete
  jsdom yields GATE PASS. This is an environment gap in the isolated worktree, **not** a code
  defect; the committed bytes pass.)
- **Frozen-three md5-intact:** `node scripts/frozen.js --check test/frozen-baseline.json` →
  "frozen-three intact (applyOutcome, resolveCheck, tryCompose)". `test/frozen-baseline.json`
  **byte-identical** to HEAD (not updated → frozen-three not intentionally changed).
- **composeEnding untouched** (first 40 lines diff = IDENTICAL; golden-locked, verified by
  endings harnesses, not md5 — correct handling).
- **Outbound machinery byte-identical:** WAYPOINTS, CUM, renderRouteMap, the outbound advance
  while-loop (game.js:724 region = IDENTICAL), ageCrew, voyageEarthSignal, HAZARDS,
  applyHazardSeverity, voyageHazardDanger/Severity all show no content diff (offset-only). The
  `VOYAGE_EVENTS` array body is **byte-identical** offset-only (moved 2507→2560 by the inserted
  landmark code) — anchored events reuse the existing `longdark`/`word` entries, no new/edited
  event.
- **Harness count 11 ≥ MIN_TESTS(9)**; `test/homeleg.js` present and counted.

### AC4 — winnability + distributional evidence — **PASS**
- **Harness integrity confirmed at bytes.** `test/homeleg.js`: `N=200` (printed), global error
  trap via `test/lib/boot.js` (`window.onerror` + `uncaughtException` + `unhandledRejection`,
  `assertNoErrors` throws), real-terminal-state assertion (`if (!g.voyageDone) throw` on
  non-termination), quiet-turn share and births recorded. Windows are the **exact DoD numbers**,
  not loosened: sound survival `< 94 || > 100` fails, `wins < 1` fails; wounded LOST
  `< 28 || > 52` fails (two-sided). B-preview override is harness-only: `px.HOME_EVENT_P = 0.40`
  (line 123), restored (128), leak-guarded (135).
- **Independently re-ran the harness (n=200/arm):** sound-ark survival **100%** (∈[94,100]),
  **35 wins** (≥1 ✓); wounded-ark LOST **43.5%** (∈[28,52], two-sided ✓); all 600 arrivals
  passed the 3 interior landmarks in order; coupling guard: Halfway Dark→longdark and Last
  Beacon→word both observed. **PASS homeleg.** (My unseeded numbers differ from the recorded run
  — expected stochastic variation; both runs land inside every window.)
- **Recorded rates present in dashboard and internally consistent.** The `docs/dashboard.html`
  LOG entry records sound 99.5%/32 wins/32.4% quiet/13 births, wounded 35.5%/31% quiet/18 births,
  B-preview 99.5%/28.2%/13 births — matching the e2d8062 orchestrator evidence note verbatim
  (the recorded representative run). Both the recorded run and my independent run satisfy the DoD
  windows, so the cross-check holds. (The DoD asks the recorded numbers be cross-checkable against
  harness output; because the harness is unseeded, "cross-check" is window-membership, which
  passes on both runs.)

### Docs pair — **PASS**
- Same commit `e2d8062` carries game.js + dashboard + plan. Plan is a **pure append**
  (zero deletion lines in the md diff), 1377→1488 (+111); **M-HOME1 Addendum** banner at
  plan line 1380; all prior sections byte-identical. Dashboard has both a milestone status block
  (all tasks `done`) and a dated (`2026-07-02`) LOG entry.

---

## Undisclosed-fork hunt — NONE FOUND

- **D1 structure-only lock — CLEAN.** Traced every read of `HOME_WAYPOINTS` (2441, 2521,
  2536–2537, 4425–4431, 5082) and voyage `waypointIndex` (2441, 2534–2538, 4429). All are
  seed / structural-advance / presentation / test-seam. **None feeds `voyageHazardDanger`,
  `HOME_HAZARD_P`, `HOME_EVENT_P`, or any `Math.random` odds path.** The line-230
  `waypointIndex:1` is the unrelated outbound `game.waypointIndex`, untouched.
- **D4/D5 constants — CLEAN.** No unlocked constant moved; declaration lines byte-identical.
- **B-preview override containment — CLEAN.** `0.40` exists only in `test/homeleg.js` via the
  seam accessor; shipped game.js exposes a getter/setter but hardcodes no override.
- **Sibling purity — CLEAN.** No outbound/frozen function edited; all new code is voyage-scoped
  siblings; the peril-roll region is byte-identical but for the inserted pre-roll landmark call
  plus an `if (game.ended || modalOpen()) return;` guard (correctly prevents a landmark-ended
  turn from double-firing a peril).
- **Fences respected.** No trade/refuel hub (D2-1/2C), no position-dependent odds (4C) — the
  landmarks are narrative/anchor only, matching the locked scope.
- **Anchored-event honesty.** The Addendum openly notes the Last Beacon `word` beat is
  `cond`-gated on Earth-not-silent, so it can legitimately not fire in an isolated silent-Earth
  run — verified in the harness code (`if (!ev || (ev.cond && !ev.cond())) return;`, game.js:2552).
  Not a masked defect; a disclosed conditional.

## Non-blocking observations (do not affect verdict)
1. **Worktree jsdom is a partial install** (missing `node_modules/jsdom/lib/api.js`); the bare
   gate fails on module resolution until jsdom is fully installed / NODE_PATH-bridged. Committed
   bytes pass with a complete jsdom. Worth a clean `npm ci` in the worktree before any future run.
2. **Harness is unseeded** — recorded dashboard rates are one representative run, not
   reproducible bit-for-bit. Acceptable under the DoD (window-membership is the contract), but a
   seed would make the recorded-vs-measured cross-check exact rather than distributional.

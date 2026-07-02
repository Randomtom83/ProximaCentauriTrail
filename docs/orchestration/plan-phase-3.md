# Phase 3 Plan — MICRO: D4, numeric distance missing on mobile travel

Single-divergence micro-phase against merged HEAD `ba0347a`. All standing
constraints inherit (presentation gate, sacred list, frozen-three + baseline
untouched, GATE PASS, docs pair). Facts: Phase 2 shipped the G3 fallback
because the T1.4 premise gate FAILED — `vs-foot` (the only `N / 434 ly-abs`
readout, game.js:4371) is clipped by the mobile viewscreen cap, and the
ellipsized topbar squeezes to zero chars at 390px → no numeric distance
anywhere on mobile travel. Premise-gate evidence showed the `.vs-chips` row
(game.js:4362-4367; `flex-wrap:wrap`, style.css:237) survives the cap 3/3.

## M1 — Distance chip, mobile-only (D4)

- **T1.1** In `renderTravel`'s markup string (game.js:4362-4367), append a
  fourth chip after the Earth chip:
  `"<span class='chip dist'><span class='cl'>Dist</span>" +
  Math.round(game.distance) + " / " + TOTAL_DIST + " ly</span>" +`
  Markup-string-only edit; reuses the same already-rendered expressions as
  `vs-foot` (`Math.round(game.distance)`, `TOTAL_DIST`) — no new state read,
  no logic, frozen-three untouched. **Unit wording is deliberate and stands
  as planned:** the chip renders `" ly"` (chip-scale brevity) while `vs-foot`
  keeps `" ly-abs"`; the builder must NOT silently "align" one to the other —
  changing either wording is a plan deviation to surface, not a cleanup.
- **T1.2** In `style.css`: base rule `.chip.dist { display:none; }` (near
  `.chip`, :238) and in the `@media (max-width:900px)` block
  `.chip.dist { display:inline-block; }` — the chip exists only where
  `vs-foot` is clipped; desktop (≥900px) renders exactly as today.
- **T1.3** Extend `test/layout_onescreen.js` with presence assertion **(l)**
  — NOT (k), which is already occupied by Phase 2's shipped FORK-D1b
  assertions. (l) pins three constructs independently: (l1) game.js contains
  the `chip dist` markup string (a `class='chip dist'` span whose expression
  includes `TOTAL_DIST`); (l2) style.css contains the `.chip.dist`
  default-hide rule; (l3) the ≤900px block contains the `.chip.dist` show
  rule. FAIL-LOUD; count stays 10 (Fork J posture carried).

## M2 — Proof + docs (same commit)

- **T2.1** `bash scripts/verify.sh` → GATE PASS (10 harnesses; frozen-three
  md5 vs untouched `test/frozen-baseline.json`).
- **T2.2** Live evidence: **390×844 travel** — Dist chip visible with the
  numeric `N / 434 ly` readout (both `.commands` states not required; the chip
  is in the viewscreen, state-independent), AND **viewscreen-internals
  non-regression: the route rail AND the current waypoint node remain visible
  after the fourth chip lands** — the chip row wraps (`flex-wrap:wrap`) and an
  extra line can push the routemap into the `overflow:hidden` clip while the
  chip itself stays visible, so chip-visibility alone is NOT a pass;
  **1280×720 travel** — byte-for-eye unchanged: no Dist chip rendered
  (display:none), `vs-foot` still sole readout, no duplication.
- **T2.3** Docs pair, same commit: dashboard status + dated log entry;
  append Addendum **M-UI2c** to `docs/proxima-trail-implementation-plan.md`
  (append-only, re-fetch + line-count check).

## Definition of Done (auditor: committed bytes + gate results)

1. GATE PASS; 10 harnesses green; frozen-three md5 unchanged;
   `test/frozen-baseline.json` byte-identical to `ba0347a` (no update — FAIL).
2. Commit touches only `game.js`, `style.css`, `test/layout_onescreen.js`,
   `docs/dashboard.html`, `docs/proxima-trail-implementation-plan.md`.
3. The ENTIRE game.js diff lies inside the `renderTravel` function body
   (function-boundary check, not line numbers) and is a markup-string-only
   insertion: one `chip dist` span; no `data-*` token, no logic, no new
   state reference beyond `game.distance`/`TOTAL_DIST` (both already rendered
   in the same function).
4. style.css contains the `.chip.dist` default-hide rule and the ≤900px show
   rule; no other selector changed.
5. Harness assertion **(l)** present and **content-specific** — it must pin
   (l1) the `chip dist` markup string in game.js, (l2) the `.chip.dist`
   default-hide rule, and (l3) the ≤900px show rule; **mutation-tested:**
   deleting ANY ONE of the three locally makes the harness exit non-zero with
   a printed reason. Finding Phase 2's pre-existing (k) assertions does NOT
   satisfy this item — the auditor must verify the NEW (l) content is present,
   not merely that some assertion passes.
6. Live evidence in the dashboard log: 390×844 numeric distance visible AND
   route rail + current waypoint node still visible (viewscreen-internals
   non-regression); 1280×720 shows no Dist chip / no duplicated readout.
7. Docs pair in the same commit; M-UI2c appended, prior sections
   byte-identical.

## FORK DISCLOSURE

### Fork K — D4 mechanism
- **Options:** (4a) add a distance chip to `.vs-chips` in `renderTravel`
  markup (chosen); (4b) CSS-only reflow of `vs-foot` at ≤900px; (4c) waive D4
  (escalate to Tom).
- **Chosen: 4a.** The chip row is the one element PROVEN (premise-gate
  evidence, chips 3/3) to survive the mobile cap; the presentation gate
  explicitly allows markup strings in render functions, and the edit reuses
  expressions already rendered two lines below. (4b) is honestly risky: the
  same evidence that killed the P2 hide showed `vs-foot` clips BELOW the cap —
  repositioning it inside a ~135px viewscreen at 390px must not push the
  routemap out, and that is a pixel gamble a micro-phase shouldn't take.
  (4c) is unwarranted: a safe, gate-legal fix exists. Note 4a is the first
  game.js edit since Phase 1 — accepted because CSS alone cannot conjure the
  readout into an element that survives the cap (the only CSS route is 4b).

### Fork L — desktop posture of the new chip
- **Options:** (L1) chip mobile-only via default-hide + ≤900px show (chosen);
  (L2) chip everywhere, accept the ≥900px duplication with `vs-foot`;
  (L3) chip everywhere, hide `vs-foot`'s distance span instead.
- **Chosen: L1.** Desktop already has exactly one readout in the right place;
  L2 adds clutter the D2/D1 cleanups just removed, and L3 churns a
  working desktop layout to solve a mobile-only absence. L1 keeps the 1280×720
  evidence trivially checkable ("unchanged") and the diff minimal. Cost: one
  extra CSS pair — disclosed, negligible.

## Out of scope / STOP
- Any game.js edit outside the `renderTravel` markup string; anything touching
  the sacred list, frozen-three, baseline, or gate scripts; any second
  divergence discovered en route → return to orchestrator, do not fix here.

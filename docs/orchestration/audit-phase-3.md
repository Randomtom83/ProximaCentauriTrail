# Audit — Phase 3 (M-UI2c): mobile-only distance chip (D4)

- **Range:** `ba0347a..phase-3` (two commits: `ab6b2ce`, correction `f591fd2`)
- **Worktree:** `C:/Users/thoma/.../wt-phase-3` (branch `phase-3`)
- **Method:** committed bytes only (`git show <SHA>:<path>`, `git diff`), gate re-run,
  local mutation-test of assertion (l). Untracked `evidence.html` ignored (outside range).
- **Overall verdict: PASS**

Files touched in range (matches DoD 2 exactly):
`game.js` (+1), `style.css` (+26), `test/layout_onescreen.js` (+30),
`docs/dashboard.html` (+12), `docs/proxima-trail-implementation-plan.md` (+89).

---

## Per-DoD verdicts

### DoD 1 — GATE PASS; 10 harnesses; frozen-three md5 unchanged; baseline byte-identical — **PASS**
`bash scripts/verify.sh` re-run in the worktree → `GATE PASS — 10 harnesses green,
frozen-three intact, endings golden present.` `git diff --stat ba0347a..phase-3 --
test/frozen-baseline.json` is empty → baseline byte-identical to `ba0347a` (not updated,
as required — an update here would have been a FAIL). Frozen-three (applyOutcome/
resolveCheck/tryCompose) untouched (game.js diff is a single unrelated line; see DoD 3).

### DoD 2 — commit touches only the 5 allowed files — **PASS**
Diff-stat lists exactly `game.js`, `style.css`, `test/layout_onescreen.js`,
`docs/dashboard.html`, `docs/proxima-trail-implementation-plan.md`. No stray files.

### DoD 3 — entire game.js diff inside renderTravel, markup-string-only, no new state — **PASS**
`renderTravel` spans lines 4311–4455 (next fn `renderLog` at 4455) in the committed
`phase-3:game.js`. The sole inserted line is 4367 — inside the body. It is a pure
markup-string insertion appended to the `.vs-chips` concatenation:
`"<span class='chip dist'><span class='cl'>Dist</span>" + Math.round(game.distance) + " / " + TOTAL_DIST + " ly</span>" +`
No `data-*` token, no logic, no new state reference beyond `game.distance` and
`TOTAL_DIST` — both already rendered two lines below in `vs-foot` (4372). One-line diff;
frozen-three not in the hunk.
- **Chip-wording pin verified:** the chip renders `" ly"`; `vs-foot` keeps `" ly-abs"`
  (game.js:4372, and topbar 4139). The deliberate, distinct wording was NOT silently
  aligned — matches the plan's explicit T1.1 instruction.

### DoD 4 — style.css has default-hide + ≤900px show rule; no other selector changed — **PASS**
Only two diff regions (hunk headers `@@ -241` and `@@ -513`). Region 1 adds
`.chip.dist { display: none; }` after the base `.chip .cl` rule. Region 2 (inside the
existing `@media (max-width:900px)` block) adds `.chip.dist { display: inline-block; }`
plus the correction tuning (see fork note). Base `.chip {` rule (line 238) is
byte-identical between `ba0347a` and `phase-3` — the `.chip` font/padding compression
lives **inside** the media block, so desktop `.chip` is unaffected.

### DoD 5 — assertion (l) present, content-specific, mutation-tested; NOT the old (k) — **PASS**
A NEW block labeled `(l)` was added to `test/layout_onescreen.js` (the pre-existing (k)
D1b assertion is untouched and independent). It pins three constructs independently and
was mutation-tested locally against committed bytes:
- **(l1)** delete/rename the `chip dist` markup in game.js → `FAIL … (l1) … chip dist markup … missing`, exit 1.
- **(l2)** remove `.chip.dist { display:none }` → `FAIL … (l2) … default-hide rule`, exit 1.
- **(l3)** change the ≤900px `.chip.dist` to non-`inline-block` → `FAIL … (l3) … show rule`, exit 1.
Each trips a distinct, printed, content-specific reason. Working tree restored clean after.
Finding the old (k) does NOT satisfy this — the NEW (l) content is genuinely present and load-bearing.

### DoD 6 — live evidence: 390×844 distance visible AND rail+node visible; 1280×720 no chip/no dup — **PASS (evidence recorded; correction closed the earlier FAIL)**
This is orchestrator-run live evidence, recorded in the dashboard log + plan-events.jsonl.
The honest failure history is disclosed, not hidden:
- `ab6b2ce`: chip landed ("Dist 0 / 434 ly" visible, log 152px held, overflow 0/0/0) but
  the route rail (~y=123–153) and current node clipped at the 135px cap → **DoD-6 FAIL**
  (plan-events "P3 evidence: chip lands but DoD-6 rail visibility FAILS").
- `f591fd2` correction: rail 75–105, current node 79–101 inside the cap, cur+nxt labels
  visible, vs-foot past the cap, log 152px held, overflow 0/0/0; 1280×720 no chip,
  vs-foot sole ly-abs readout, 9/9 commands (plan-events "P3 official live evidence PASS
  (f591fd2)"; dashboard log 2026-07-02 entries). Final state satisfies DoD 6.

### DoD 7 — docs pair in same commit; M-UI2c appended; prior sections byte-identical — **PASS**
Plan grew 1191→1280 lines (+89, matches stat). `git diff` on the plan shows **zero**
deleted content lines — pure append; Addendum M-UI2c present (banner line 1194) with the
correction disclosed (lines 1266, 1278). Dashboard gained the `mui2c` milestone (statuses
done; orchestrator-run live evidence honestly marked "doing") + two dated 2026-07-02 log
entries (feature + correction). Docs land in the same commits as the code.

---

## Correction disclosure (FORK-D1b-style tuning precedent) — **CLEAN**
The correction (`f591fd2`) is orchestrator-directed CSS parameter tuning of existing
≤900px constructs (`.vs-title` hide, `.chip` compression, `.routemap` envelope,
`.rm-label` offsets), all confined to the `@media (max-width:900px)` block — same
construct family the `max-height:800px` block tunes for D2, so no new fork. It was
disclosed in **both** the commit message and the plan Addendum/dashboard log, not silent.
No cap raise; 1280×720 guaranteed unchanged by scoping (verified: no rule outside the
≤900px block touched by the correction). Judged on final state, DoD 6 is satisfied.

## Undisclosed-fork / corner-cutting hunt — **NONE FOUND**
- No stub, no hardcode, no narrowed scope. The chip reuses existing expressions; no new state.
- Chip wording `" ly"` not aligned to `" ly-abs"` — deliberate, matches plan (would have
  been a silent deviation to flag; it is correct).
- Base `.chip` rule byte-identical — the compression is media-scoped, no desktop bleed.
- Harness count held at 10 (Fork J posture); (l) is not a rubber-stamp — mutation-proven.
- Sacred list / frozen-three / baseline / gate scripts untouched.
- No second divergence introduced en route.

## Overall: **PASS**

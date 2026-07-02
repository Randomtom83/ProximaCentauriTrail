# Plan-reviewer verdict — plan-phase-1.md (One-Screen Bridge)

Reviewed against: north star (one-screen bridge, log + controls always in view),
guardrails (sacred list, zero-diff gate, presentation-only, docs pair), and AC1–AC4.
All `file:line` claims in the plan were checked against working-tree bytes of
`style.css`, `game.js`, `index.html`, `scripts/verify.sh`, `CLAUDE.md`.

Reality check summary (claims that held):
- style.css line cites are accurate: `.bridge` flex/min-height:100% at :273; `.console`
  min-height:210px at :278; `.console .log` min-height:160px at :280; `.viewscreen`
  min-height:158px at :204; `.cmd-grid .btn` padding:8px 6px at :293; `.log` height:200px
  at :321; `#crt` height calc(100vh-20px) at :57 and :471; `body` padding:10px / min-height:100vh
  at :48; `html,body` at :42-45; `#app` overflow-y:auto at :121-124; ≤900px block :470-477.
- game.js: `.viewscreen` is emitted ONLY inside `renderTravel` (single hit at 4359) — Fork D /
  T4.2 scoping claim is TRUE. `.bridge` emitted only at 4410 (renderTravel). Continue button is
  first in the manual `.commands` (4396). Frozen-three symbols exist at the cited-ish lines
  (tryCompose 2855, applyOutcome 2924, resolveCheck 2967; composeEnding 2863).
- verify.sh: MIN_TESTS=9, currently exactly 9 harnesses committed; adding one → 10 (≥9). Gate
  is set -euo pipefail, exit-code-gated, requires endings_golden. Plan's constraint statement matches.

---

## Defects

1. **MAJOR — Fork C / T3.2 (and DoD item 4) miss the autopilot `.commands` variant; the
   "Continue always on screen" claim is false in that state.**
   There are TWO command blocks in `renderTravel` (game.js:4388–4408): when `game.autopilot`
   is true the primary button is `data-action='autorun'` and "One turn"/"Emergency wake" are the
   small buttons — there is NO `continue` primary. The plan repeatedly asserts "Continue is
   already first in `.commands`, game.js:4396" (Fork C, DoD 4) as if it were the sole case; it is
   only the manual case. The CSS forks (grid-pin the command row) are structurally agnostic so
   the *layout* still works, but the DoD's AC2 wording ("Continue + station actions reachable")
   and the live-screenshot evidence (T5.3/DoD 7) are specified only for the manual travel state.
   **Fix:** (a) reword AC2/DoD-4/DoD-7 to "the primary command + secondary actions" rather than
   "Continue," and (b) require the live screenshot at 390×844 to be captured in BOTH the manual
   and autopilot travel states (autorun variant has fewer buttons, so it is the easier case, but
   it must be shown to not regress). Cite game.js:4388 in the build so the builder knows both
   variants exist.

2. **MAJOR — T5.1 assertion (g) "the diff did not add earth.truth/EARTH_DOOM_YEARS to any render
   string" is not statically checkable by a node harness reading committed bytes; as written it
   is a false-loud check.**
   A harness that reads `style.css`+`game.js` as text (T5.1's own stated design: "reads … as
   text") has no diff — it sees only the post-commit file, and both `earth.truth` and
   `EARTH_DOOM_YEARS` legitimately already exist elsewhere in game.js (they are hidden meters
   referenced by game logic). So a text-scan either (i) always passes vacuously, or (ii) matches
   the pre-existing occurrences and always fails — neither proves "the diff didn't add one to a
   render string." This violates the plan's own FAIL-LOUD principle (a check that can't actually
   test = worse than none).
   **Fix:** Move the "no sacred token added to render markup" check OUT of the static harness and
   INTO the auditor's committed-diff review (DoD item 2 already covers "no earth.truth/
   EARTH_DOOM_YEARS reference added" via `git show <SHA>` — the diff IS visible there). Delete
   assertion (g)'s diff clause from T5.1; keep only the presence check ("game.js still contains
   applyOutcome/resolveCheck/tryCompose"), which IS a valid static assertion. Do not claim the
   harness guards the sacred list against additions — the frozen.js md5 gate + auditor diff do that.

3. **MAJOR — Frozen-three protection is asserted but the harness/DoD never re-affirms the
   baseline is UNCHANGED for a presentation-only phase; the md5 gate is only mentioned, and one
   DoD line ("assert game.js still contains applyOutcome/…") could be mistaken for the guard.**
   The real guarantee is `node scripts/frozen.js --check test/frozen-baseline.json` (run inside
   verify.sh) proving md5 identity. DoD item 1 states this correctly. But T5.1(g) and the
   Shared-component section blur it by implying the new harness contributes sacred-list safety.
   For a presentation-only phase the baseline JSON must NOT be touched.
   **Fix:** add an explicit DoD sub-clause: "`test/frozen-baseline.json` is byte-identical to HEAD
   (`git show <SHA>:test/frozen-baseline.json` == pre-image); the frozen-three are md5-unchanged.
   This phase MUST NOT update the baseline." This closes the "silent baseline drift" hole the
   CLAUDE.md zero-diff section warns about.

4. **MINOR — index.html edit vs. "presentation-only diff" list is internally consistent, but the
   viewport-meta change is a behavioral change to the document that the DoD should pin exactly.**
   T1.2 appends `, viewport-fit=cover` to index.html:5. DoD item 2 lists index.html as an allowed
   touched file and item 4 requires the meta to contain `viewport-fit=cover` — good. However the
   DoD does not forbid *other* index.html changes, so a builder could restructure the meta or add
   attributes under cover of "sanctioned edit."
   **Fix:** tighten DoD item 4 to: "index.html diff is EXACTLY the single-token append
   `, viewport-fit=cover` to the existing `content` attribute of the viewport meta; no other
   index.html bytes change." (Byte-scoped, auditor-checkable.)

5. **MINOR — DoD item 6 wording "no diff hunks in game.js:4585-4708 except any inherited nothing"
   is malformed / not objectively checkable.**
   The clause "except any inherited nothing" is unparseable and the fixed line window (4585-4708)
   will shift if any earlier hunk changes game.js line counts — an auditor can't reliably apply a
   frozen line range post-edit.
   **Fix:** restate as: "the bodies of `renderColony` and `renderVoyage` (by function boundary,
   not line number) have zero diff hunks in `git show <SHA> -- game.js`; identify them by
   `function renderColony`/`function renderVoyage` markers, not absolute lines." Drop "except any
   inherited nothing."

6. **MINOR — Fork E (global ≤900px `min-height:44px` on `.menu.row .btn`) is a real presentation
   change to colony/voyage/title screens, yet M4/DoD item 6 asserts "renderColony/renderVoyage
   markup is unchanged" as the non-regression proof — that proves markup, not layout.**
   The plan is honest that E2 is a global mobile change and argues it's monotonic (raises a min,
   can't shrink). That reasoning is sound, but the DoD's non-regression evidence for those screens
   is only "harness green + markup unchanged." Harnesses run under node with no DOM/layout, so
   they cannot catch a mobile layout regression from a taller button. This is a small residual gap,
   not a blocker (the change genuinely only raises a minimum).
   **Fix:** either (a) note in the DoD that colony/voyage mobile layout regression risk from Fork E
   is accepted-by-argument (monotonic min-height, those screens scroll `#app` legitimately), OR
   (b) add colony + voyage to the mobile screenshot set in T5.3 as a spot check. (a) is sufficient;
   pick one and state it so it's a decision, not a silent gap.

7. **MINOR — dependency ordering is correct, but T1.3's `overflow-x:hidden` on `html,body` can
   mask (not fix) a genuine AC2 horizontal-scroll bug, and the plan's own note admits this.**
   The plan correctly labels it "belt-and-suspenders backstop, not the fix" and points to existing
   `min-width:0` flex children. This is acceptable, but if a child DOES overflow width, the
   screenshot check (`#app.scrollWidth <= clientWidth`) will pass while content is silently
   clipped — a false-green against the north star.
   **Fix:** add to T5.3/DoD 7 a visual assertion that no station panel / log content is clipped at
   390px (i.e., verify the last chip/column is fully visible, not just that scrollWidth fits).

---

## Alignment / traceability audit (no defect, stated for the record)

- **Every milestone traces to an AC:** M1→AC2/AC3(global), M2→AC1, M3→AC2, M4→AC3, M5→AC3/AC4 +
  evidence. No milestone is invented beyond the ACs. No phase-scope creep into colony/voyage
  restructuring (correctly fenced to a later phase in Out-of-scope).
- **Sacred list:** no odds/scarcity/difficulty/hidden-meter change is proposed; all edits are CSS
  + markup-string layout. Guardrail respected (subject to defects 2 & 3 tightening the *proof*).
- **Zero-diff gate:** frozen-three untouched by design; verify.sh GATE PASS required (DoD 1).
  composeEnding correctly treated as golden-locked, not md5-gated (matches CLAUDE.md).
- **Docs pair rule:** T5.4 / DoD 8 correctly require dashboard.html status+log AND an appended
  M-UI2 Addendum in the same commit, append-only with a line-count re-fetch check. Compliant.

## Verdict (Cycle 1)
NOT a pass. Defects 1–3 are MAJOR (a false layout claim in the autopilot state, and two
"proof" mechanisms that don't actually prove what they assert — both violating the project's
own FAIL-LOUD rule). Defects 4–7 are MINOR byte-scoping / evidence tightenings. The plan's
CSS strategy (grid height-budget + dvh + command-pin) is sound and well-scoped to `.bridge`;
the corrections are to the *verification and DoD wording*, not to the layout approach.

---

# Cycle 2 — re-review of the revised plan (381 lines)

Re-read the revised `plan-phase-1.md` in full and re-verified every fix against the plan
text AND every NEW factual claim the revision introduced against working-tree bytes of
`game.js`. No claim taken on faith.

## Defect-by-defect verification

1. **(MAJOR — autopilot `.commands` variant) FIXED.** M3 heading reworded to "primary
   command + secondary actions" (plan:113). T3.2 now carries an explicit Builder note
   (plan:127–132) describing BOTH variants; DoD 4 (plan:234–236) requires both variants
   not-below-the-log; T5.3 (plan:191–193) and DoD 7 (plan:258–260) require the 390×844
   evidence in BOTH travel states. Fork C (plan:307–311) corrected. New factual claims
   spot-checked against game.js: autopilot block is 4388–4394 with `data-action='autorun'`
   primary at 4390 and NO `.cmd-grid` — TRUE; manual block 4395–4408 with Continue at 4396,
   6-button `.cmd-grid`, ATLAS button (`AI_NAME = "ATLAS"`, game.js:165) and Abandon — TRUE.
2. **(MAJOR — false-loud T5.1(g) diff assertion) FIXED.** T5.1(g) is now a presence-only
   check (plan:174–175) and a "Scope limit (FAIL-LOUD honesty)" paragraph (plan:176–183)
   explicitly states the harness makes NO sacred-token diff claims and assigns that
   guarantee to the auditor's `git show <SHA>` review (DoD 2) and the frozen.js md5 gate —
   exactly the prescribed fix. DoD 2's retained "no earth.truth/EARTH_DOOM_YEARS reference
   added" clause is fine there: the auditor HAS the diff.
3. **(MAJOR — baseline drift hole) FIXED.** DoD 1 now contains a "Baseline immutability"
   clause (plan:215–220): `test/frozen-baseline.json` byte-identical to pre-phase HEAD,
   baseline edit in a presentation-only phase = automatic FAIL. Matches CLAUDE.md's
   zero-diff posture.
4. **(MINOR — index.html byte-scope) FIXED.** T1.2 (plan:71–76) declares the edit
   byte-scoped, and DoD 4 (plan:238–240) pins it: "EXACTLY the single-token append
   `, viewport-fit=cover` … no other `index.html` bytes change."
5. **(MINOR — malformed DoD 6) FIXED.** "except any inherited nothing" removed; DoD 6
   (plan:246–250) now identifies `renderColony`/`renderVoyage` by function boundary
   ("declaration to its closing brace"), explicitly NOT by absolute line numbers.
6. **(MINOR — Fork E residual risk unstated) FIXED via option (a).** Fork E (plan:342–348)
   now records an "Accepted residual risk (explicit decision, not a silent gap)" —
   node harnesses cannot detect mobile layout regressions; acceptance rests on the
   monotonic-min-height argument; no colony/voyage screenshots required. DoD 6
   (plan:250–255) cross-records the same decision. It is now a decision, not a gap.
7. **(MINOR — overflow-x:hidden masking clipping) FIXED.** T5.3 (plan:193–197) adds the
   no-clipping visual check (rightmost nav chip / last `.cmd-grid` column / crew Status
   column fully visible; "clipping = FAIL"), explicitly noting that
   `scrollWidth <= clientWidth` alone can pass while T1.3's `overflow-x:hidden` clips.
   DoD 7 (plan:260–261) makes it part of the committed evidence requirement.

## New-defect scan of the revision

- Every NEW `file:line` / factual claim introduced by the revision was re-verified:
  game.js:4388–4408 range TRUE; :4390 autorun TRUE; :4396 Continue TRUE; "no `.cmd-grid`"
  in autopilot TRUE; "ATLAS" label TRUE (game.js:165). Plan is 381 lines as claimed.
- Untouched sections (M1 targets, M2, M4, Forks A/B/D, Out-of-scope) are unchanged from
  Cycle 1 and were already verified then.
- DoD 7 still opens with "three-viewport screenshot pass" while the 390×844 viewport now
  requires two captures (both states) — the same sentence spells out the both-states
  requirement explicitly, so it is unambiguous; wording nit only, not a defect.
- No scope creep, no new files, no weakening of any guardrail was introduced by the
  revision. The revision is strictly additive tightening.

## Verdict (Cycle 2)
**PASS.** All seven Cycle-1 defects are genuinely fixed in the committed plan text — each
fix verified at specific plan lines and every new factual claim re-checked against
`game.js` bytes rather than accepted from the Planner's self-report. Probed for regressions
introduced by the revision (new line cites, the autopilot-variant description, the ATLAS
label, DoD internal consistency) and found none; the plan's verification chain is now
honest about what each layer proves (static harness = construct presence, auditor diff =
sacred/scope guard, md5 gate = frozen-three, live screenshots = pixel truth).

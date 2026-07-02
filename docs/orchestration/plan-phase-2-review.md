# Plan-reviewer verdict — plan-phase-2.md (post-merge remediation, D1/D2/D3)

Reviewed against: same north star/guardrails as Phase 1; this phase's ACs are the
three divergence closures (D1 mobile topbar/log squeeze, D2 short-desktop route-label
clip, D3 crew-grid STATUS clip at 390px). Every `file:line` cite checked against
current bytes at HEAD `af85b37` (confirmed via `git rev-parse`; style.css confirmed
533 lines).

Reality check summary (claims that held):
- style.css cites all accurate post-merge: `#topbar-status` flex:1 mono at :111;
  ≤900px block :485–511; `max-height:800px` block :516–524 with the
  `clamp(96px,14vh,150px)` viewscreen cap at :518; `.viewscreen` overflow:hidden
  :204–213; ≤1100px cur/nxt label reduction :479–482; `.rm-label.blw{top:32px}` :269;
  `.routemap` padding `24px 10px 26px` :247; `.crew-head,.crew-row` grid
  `16px minmax(120px,1.5fr) 1fr 1fr 88px; gap:10px` :314–317; `.crew-head`
  letter-spacing:2px :319.
- game.js: `updateTopbar` is exactly at 4131–4140 and emits exactly the claimed
  strings (travel: `DAY n · NEXT: wp · d/total ly-abs`; otherwise `BEST SCORE: n` /
  `EARTH IS DYING`). The duplication claim is TRUE: viewscreen chips carry Day
  (4363) and Next (4364–4365), and `vs-foot` carries the identical
  `distance / TOTAL ly-abs` readout (4371).
- `.bridge` still has a single emit site (game.js:4410) — T1.2's `:has(.bridge)`
  scoping premise re-verified.
- `crewStrip()` renders in exactly three places: travel (4382, `.stations .panel`),
  colony (4617, plain `.panel`), voyage (`.col.panel` inside `.cols`) — the
  shared-grid premise of D3/Fork I is TRUE.
- Gate posture: 10 harnesses committed incl. `test/layout_onescreen.js`;
  MIN_TESTS=9; extending (Fork J) keeps count at 10. Phase-1 lessons carried:
  presence-only harness assertions (no diff claims), baseline immutability in DoD 1,
  byte-scoped CSS-only DoD 2.

Fork I scope judgment (coordinator asked explicitly): **honest scope, not creep.**
The defect lives in the shared `.crew-head,.crew-row` grid (style.css:314–317), and
all three call sites hit the same overflow at 390px; no voyage-unique ancestor class
exists (verified markup — though note Fork I's I2 example selector
`.cols .col .panel .crew-head` mis-describes the markup: voyage uses `col panel` on
the SAME element, so the nested form matches nothing; the conclusion stands, the
example doesn't). The retune lives only in the ≤900px block, desktop untouched, and
the plan itself demands non-regression evidence. Minimal correct fix — but see
defect 3 on the evidence gap it creates.

---

## Defects

1. **MAJOR — D1's load-bearing redundancy premise is unverified on the exact target
   viewport, and the evidence plan never checks it.** Fork G chooses G1 (hide
   `#topbar-status` on travel) *because* the info is "a byte-level duplicate of the
   viewscreen nav chips + vs-foot distance." That justification only holds if the
   surviving copy is actually VISIBLE at 390×844. But `vs-foot` is the LAST child of
   `.viewscreen`, which is `overflow:hidden` with a mobile cap of
   `clamp(96px,16vh,140px)` (style.css:489 → ~135px at 844 tall); at 390px the
   `vs-head` chips wrap and the routemap alone is ~80px tall (padding 24+rail 30+26,
   :247–248), so the viewscreen's content very plausibly exceeds the cap and clips
   `vs-foot` first — i.e., on the exact viewport D1 targets, hiding the topbar line
   may delete the ONLY remaining distance readout rather than deduplicate it. T4.3-D1
   measures log height and topbar single-line/hidden, but never looks at whether the
   duplicated info survived. **Fix:** add to T4.3-D1 and DoD 7: "the 390×844 travel
   shot must show the viewscreen Day/Next chips AND the vs-foot distance readout
   visible (not clipped by the viewscreen cap); if vs-foot is clipped, G1's premise
   fails — fall back to G3 (ellipsized topbar retained on travel) or resolve the
   viewscreen clipping first, and surface the deviation." This keeps the
   information-deletion decision evidence-gated instead of assumed.

2. **MINOR — D3 arithmetic error in T3.1.** "fixed+gap overhead drops from 154px to
   98px, freeing ~56px" — the old overhead is 16px + 88px + 4 gaps × 10px = **144px**
   (not 154), so the freed amount is **~46px** (the new 98px = 14+60+4×6 is correct).
   The fix remains valid and "STATUS ≈58px < 60px track" still holds; only the stated
   numbers are wrong. **Fix:** correct 154→144 and ~56→~46 in T3.1 so the committed
   plan's facts survive audit.

3. **MINOR — Fork I's own standard ("verified, not argued") is not met for colony.**
   Fork I asserts colony clips identically at 390px and is fixed by the same rule,
   and contrasts itself with Phase-1 Fork E by claiming its blast radius is
   *verified* — but T4.3-D3 and DoD 7 require evidence only for voyage (fix) and
   travel (non-regression); colony's 390px crew table is left unevidenced.
   **Fix:** either add a colony 390×844 crew-table shot to T4.3-D3/DoD 7 (one extra
   capture in a session that already visits three screens), or explicitly downgrade
   the colony claim to accepted-by-argument (Fork E precedent) so the stated standard
   matches the evidence actually required.

---

## What else was probed and held

- **Traceability:** M1→D1, M2→D2, M3→D3, M4→proof+docs; no invented milestones, no
  opportunistic restyling (explicitly out of scope). Dependencies ordered (M1–M3
  independent, M4 last, docs pair same-commit).
- **DoD auditor-checkability:** items 1–6 and 8 are byte/gate-checkable (presence of
  named rules in named media blocks, CSS-only diff with game.js/index.html at zero
  diff, baseline immutability, harness assertions falsifiable by local deletion);
  item 7 is dashboard-recorded live evidence per the established Phase-1 pattern.
- **Guardrails:** no sacred-list exposure (the only game.js-adjacent idea, G4, is
  correctly rejected as a function-body edit); frozen-three/baseline untouched by
  design; `:has()` fallback posture honestly disclosed (T1.1 floor contains the
  failure mode).
- **Fork H:** rejecting the cap raise (H4) to protect Phase-1 AC1 is the right call;
  H3's label-reduction + envelope-tightening arithmetic was spot-checked (blw label
  at top:28 inside rail 30 + bottom padding 18 fits) and is plausible within the
  14vh cap.

## Verdict (Cycle 1)
NOT a pass — 1 MAJOR, 2 MINOR. The MAJOR is not the CSS mechanism (which is sound)
but a hole in the verification chain exactly under Fork G's load-bearing premise:
the plan deletes a readout on the strength of a duplicate it never confirms is
visible on the target viewport. All three fixes are wording/evidence additions —
no rework of the chosen mechanisms is required.

---

# Cycle 2 — re-review of the revised plan (255 lines, confirmed by count)

Re-read the revised `plan-phase-2.md` in full. Verified each claimed fix in the
actual plan text and probed the revision for new defects, with specific attention
to the coordinator's question: is the T1.4 conditional coherent end-to-end, and can
the auditor distinguish a legitimate G3 fallback from an executor who simply
skipped G1?

## Defect-by-defect verification

1. **(MAJOR — D1 premise unverified) FIXED, and coherent end-to-end.** The new
   T1.4 (plan:51–64) makes the hide conditional on the 390×844 chips+`vs-foot`
   visibility check, with an explicit G3 fallback ("do NOT ship T1.2 … surface the
   fallback to the orchestrator in the report and the dashboard log entry"). The
   conditional is propagated consistently through every layer it touches: M1 Facts
   qualifies the duplication claim itself (plan:26–27, "provided that copy is
   visible … which is exactly what the T1.4 premise gate verifies"); T4.3-D1
   (plan:128–131) embeds the premise check in the evidence pass; harness (h)
   (plan:114–118) becomes variant-aware (G1 shipped → must pin the hide; G3
   shipped → pins ellipsis alone and MUST NOT require the hide); DoD 3
   (plan:158–165) encodes exactly two acceptable outcomes; Fork G (plan:197–207)
   records the choice as "G1 — conditionally" with the premise as Honest cost #2.

   **Distinguishability probe (the coordinator's question) — HOLDS.** The auditor
   works from committed bytes (CSS + committed dashboard log) and can separate all
   four quadrants:
   - *Legitimate G1:* hide rule present in the ≤900px block AND dashboard log
     records the chips+`vs-foot` visibility evidence → pass.
   - *Legitimate G3:* no hide rule AND the fallback is explicitly recorded in the
     report + dashboard log → pass.
   - *Skipped G1 (lazy executor):* no hide rule and NO recorded fallback → DoD 3's
     "an unsurfaced fallback is a FAIL" catches it by byte-absence of the record.
   - *Unjustified G1:* hide rule present WITHOUT the visibility evidence → DoD 3's
     "a hide rule shipped WITHOUT the chips+`vs-foot` visibility evidence is a
     FAIL" catches it.
   A fifth cross-check exists: a harness/CSS variant mismatch (hide rule in CSS but
   (h) pinning ellipsis-only, or vice versa) violates T4.1's variant rule and is
   itself auditable from committed bytes. No quadrant is indistinguishable.

2. **(MINOR — T3.1 arithmetic) FIXED.** Plan:98–100 now reads "drops from 144px
   (16 + 88 + 4×10 gaps) to 98px (14 + 60 + 4×6), freeing ≈46px" — arithmetic
   re-verified: 16+88+40=144, 14+60+24=98, 144−98=46. Correct.

3. **(MINOR — colony unevidenced) FIXED.** T4.3-D3 (plan:136–139) adds the colony
   crew-table 390×844 shot; DoD 7 (plan:177–179) requires "all three call sites of
   the shared retune evidenced"; Fork I (plan:229–234) now claims verification "at
   ALL THREE call sites … no call site is accepted-by-argument" — the stated
   standard and the required evidence now match.

## New-defect scan of the revision

- The revision is confined to the D1 conditional chain (Facts, T1.4, T4.1(h),
  T4.3-D1, DoD 3, Fork G), the T3.1 numbers, and the colony evidence additions
  (T4.3-D3, DoD 7, Fork I). All other sections byte-consistent with Cycle 1's
  verified text; all Cycle-1-verified cites unchanged and still accurate at HEAD
  `af85b37`.
- T1.4's verification is correctly specified *post-fix* ("with T1.1+T1.2 applied")
  — the premise is checked in the state that would actually ship, not the current
  broken state. Sound ordering.
- The variant-conditional harness (h) does not create a vacuous-pass hole: in
  either variant, deleting the pinned construct(s) still exits non-zero (DoD 6),
  and the variant choice itself is cross-checked against the CSS bytes and the
  dashboard record per DoD 3.
- Residual nits, not defects: Fork I's I2 example selector still mis-describes the
  voyage markup (nested `.cols .col .panel` vs the actual `col panel` on one
  element — conclusion unaffected, noted in Cycle 1); T4.3-D3's "the evidence pass
  already loads colony via the test seam" is a procedural convenience claim, not a
  committed-bytes claim, and carries no DoD weight.
- No scope creep, no guardrail weakening, no new files, no game.js/index.html
  exposure introduced; the CSS-only DoD 2 posture is unchanged.

## Verdict (Cycle 2)
**PASS.** All three Cycle-1 defects are genuinely fixed in the plan text, and the
new T1.4 conditional is coherent end-to-end — its two shippable outcomes are
byte-distinguishable by the auditor in every quadrant, including the adversarial
one (an executor skipping G1 reads as an unsurfaced fallback and FAILs by DoD 3).
The revision was probed for newly introduced defects (variant-harness vacuous-pass
holes, premise-check ordering, arithmetic, evidence/standard consistency) and none
were found; the remediation mechanisms themselves were already sound in Cycle 1.

# Plan-reviewer verdict — plan-phase-4.md (decision-first: the flight home)

Reviewed against the Phase-4 north star ("the flight home is as alive as the flight
out") and AC1–AC4, plus the four extra dimensions requested: decision-block
hygiene, sacred-list discipline, fence-marker correctness, and AC4 harness
loudness. Every `file:line` cite checked against HEAD `a4158f3` bytes (confirmed
via `git rev-parse`; game.js 5016 lines, style.css 696).

## Reality check summary (claims that held — this plan's cite discipline is strong)

- **All §1.1 machinery cites exact:** `voyageTurn` 2466 (peril split at 2501–2503,
  `HOME_HAZARD_P`/`HOME_EVENT_P` order as described; arrival check before peril;
  `voyageEarthSignal`/`voyageAgeCrew`/`applyCommanderFloor` calls in sequence);
  `VOYAGE_EVENTS` 2507 with **exactly 10 entries and exactly the cited ids**
  (derelict, fold, pursuer, sick, calm, cache, lost, word, longdark, newlife);
  cond-gates verified verbatim (fold on `knowledge>=35 || alien.tech`, pursuer on
  `alien.pursuit`, word on Earth not-silent); `rollVoyageEvent` 2548,
  `presentVoyageEvent` 2560, `voyageOutcome` 2580, `HOME_HAZARD_P=0.18,
  HOME_EVENT_P=0.34` at 2614 (→ 48% quiet arithmetic correct), `HOME_HAZARDS`
  2615 = debris/vflare/micromet, `voyageHazardDanger` 2643, `voyageHazardSeverity`
  2695, `voyageArrive` 2723, `voyageHibernate` 2768, `voyageRest` 2803,
  `voyageScavenge` 2819, `renderVoyage` action row 4765–4773 (Continue/Thrust/
  Rations/Pods/Rest/Scavenge, verified).
- **§1.2 structural-gap claims TRUE against bytes:** `startVoyage` 2431 seeds only
  `distance: 0, total: Math.round(TOTAL_DIST * 0.62), turn: 0` (~2440) — no
  waypoint array/index/visited; `renderReturnMap` 4365–4373 draws exactly two
  nodes (Earth `left:0%`, Proxima `left:100%`) + arc + ark at `f*100`; the peril
  roll is position-independent. The complaint's diagnosis is verified, not
  asserted. `rmCurveY`/`rmGlyph`/`rmChart` helpers exist (4275/4279/4323) — T1.4's
  reuse plan is real.
- **Decision-5 constant cites exact:** `LAUNCH_READY=100` (153),
  `VOY_YEARS_PER_TURN=1.6` (160), `EARTH_DOOM_YEARS=220` (163),
  `EARTH_NOISE_P=0.30` (164). `WAYPOINTS` 50–71 / `CUM` 74 / `TOTAL_DIST` 79
  stable. Harness count 10 (→11 with homeleg) correct.
- **Gating structure sound:** every milestone names its governing lock; §7 makes
  the plan a decision request until locks land; M-HOME2's no-op path (4A + no D5
  change) is explicit, so nothing tuning-shaped ships by default. Decision 2C
  (site-hubs) is correctly FENCED on brutal-economy scarcity grounds. Fork blocks
  P1–P4 are genuine engineering forks below the sacred line, each with an honest
  cost note; none smuggles a Tom-level choice.

## Defects

1. **MAJOR — Decision 1's recommendation smuggles Decision 4C's mechanism across
   a lock boundary.** The D1 recommendation is "Option A **+ adopt Option C's
   banding as an INTERNAL consequence of A** … peril weighting can key off 'which
   segment between landmarks are we in'" (plan:127–134). Position-dependent peril
   weighting IS Decision 4C — which the same plan recommends AGAINST ("I am
   explicitly NOT recommending C … most winnability-fragile … D2-1-adjacent",
   plan:247–251). As written, a Tom lock of "D1 as recommended" arguably
   authorizes position-dependent weighting without the D4C lock that governs it —
   a smuggled default crossing decision boundaries. It is also internally
   contradictory: under the recommended combination D1-A(+C) with D4-A (flat odds
   byte-identical), the "banding" either does nothing or does something
   unauthorized. **Fix:** strip the peril-weighting clause from the D1
   recommendation and restate: "A's `at` fractions make banding STRUCTURALLY
   possible later, but NO peril re-weighting ships in this phase unless Decision
   4C is explicitly locked; under 4A the landmarks are narrative/anchor beats
   only." Each mechanism must sit under exactly one lock.

2. **MAJOR — Decision 4 Option A's "provably unchanged / by construction" claim
   is false once Decision 2B anchored events ship, and it misleads the lock.**
   4A's stated pro: "the flat per-turn odds stay exactly as homesmoke-calibrated,
   so AC4 winnability is provably unchanged (the sound-ark 98% / wounded 40%
   numbers hold by construction)" (plan:223–227). But the recommended D2-B adds
   MANDATORY anchored events at landmarks with resource/crew effects routed
   through `voyageOutcome` — the per-crossing outcome distribution shifts even
   with `HOME_HAZARD_P`/`HOME_EVENT_P` byte-identical. The plan's own DoD knows
   this (the 4A bullet requires the sweep to "sit within the P3-M3 homesmoke
   band" — pointless if unchanged by construction). Tom could lock 4A believing
   zero winnability risk while simultaneously locking 2B, which adds some.
   **Fix:** reword 4A's pro: "the CONSTANTS' contribution to risk is unchanged by
   construction; anchored-event effects (Decisions 2B/3) still shift the
   distribution, and that residual shift is exactly what the AC4 sweep must
   bound." The risk profile shown to Tom must be the combined one.

3. **MAJOR — AC4's calibration assertions are not auditor-decidable as written
   ("e.g." floors and an undefined band).** The DoD gives "assert a floor,
   **e.g.** ≥90%" (sound) and "**e.g.** ≥30%" (wounded), and separately requires
   the 4A sweep to "sit within the P3-M3 `homesmoke` band" with no numeric band
   defined anywhere. "E.g." in a DoD means the Builder picks the real number and
   the auditor has nothing fixed to check; the band check is unimplementable
   without tolerances (at n=100/arm, binomial noise is ±~1.4pt at p=0.98 and
   ±~4.9pt at p=0.40 — "≈98%" is not a checkable assertion). The wounded arm is
   also only floored on deadliness (≥30% LOST): a change that made wounded
   crossings 90% LOST would PASS while "winnability preserved" failed. The
   silent-death side of the harness IS loud (error trap + terminal-state
   assertion + ≥100 runs — good); the calibration side is the weak half.
   **Fix:** commit exact numbers in the DoD, two-sided where drift matters — e.g.
   sound-arm survival ≥94% at n≥200/arm; wounded-arm LOST within [30%, 55%];
   measured rates recorded in the dashboard entry; state the sample size in the
   assertion so the tolerance is justified. No "e.g." anywhere in a DoD line.

4. **MINOR — the D2-1 fence-boundary claim is unsupported by any committed
   definition.** The plan asserts "D2-1 (void-leg pacing) is fenced for the
   OUTBOUND void leg … 4C does NOT touch the fenced outbound item" (plan:253–258).
   Searched the repo: `D2-1` and "void-leg" appear ONLY in CLAUDE.md's fence list
   ("D2-1 (void-leg pacing)") with NO outbound scoping; nothing in
   `docs/proxima-trail-implementation-plan.md` or the dashboard defines D2-1. The
   outbound-only boundary is the planner's invention — and by the plan's own words
   the return leg is "mostly the 180-ly interstellar Void," so 4C is plausibly
   WITHIN the fence, not adjacent. Practical handling is compliant either way (4C
   is lock-gated and not recommended), so this is framing, not conduct. **Fix:**
   present 4C as "presumptively within the D2-1 fence unless Tom rules the fence
   is outbound-only," and delete the unsupported "does NOT touch" assertion — the
   fence-note's own closing sentence (ask Tom to confirm) is the correct posture;
   lead with it.

5. **MINOR — sacred-list classification is inconsistent across the plan's own
   sections.** The §2 preamble says "Nothing in this plan touches a sacred-list
   item" (plan:17), Decision 4 calls `HOME_EVENT_P` "sacred-list *adjacent*"
   (plan:216), and Decision 5's preamble says its constants are "on the sacred
   list" (plan:263). Per CLAUDE.md the sacred list covers "any odds" — so
   `HOME_EVENT_P`/`HOME_HAZARD_P` are sacred-list odds, full stop, and a locked
   4B WOULD touch a sacred item (with Tom's explicit authorization, which is the
   one legitimate path). The intro sentence is false under half the decision
   outcomes it offers. **Fix:** replace the intro claim with the accurate thesis
   the rest of the plan already practices: "No sacred-list value changes except
   under an explicit per-item Tom lock; every default is byte-identical" — and
   drop "adjacent" from Decision 4's header (it is a direct sacred-list odds
   decision, which is exactly why it needs the lock).

Nits (not defects): the canonical plan is 1377 lines, not the cited 1378
(off-by-one, possibly newline counting); T1.2's "outbound advance at 724" cite is
the fold-shortcut advance loop — a true instance of the pattern, but worth noting
it is not the primary per-turn advance site.

## Extra-dimension summary (coordinator's asks)

1. **Decision-block hygiene:** D2/D3/D5 are cleanly lockable (options exclusive,
   recommendation separated from the ask, D3's table explicitly "a proposal, not a
   decision", D5 defaulting every row to LEAVE). D1 and D4 fail hygiene as
   defects 1 and 2. No milestone executes before its governing lock (§7 gate +
   per-milestone gating verified); M-HOME2's explicit no-op prevents a
   tuning-by-default.
2. **Sacred discipline:** no recommendation quietly changes a constant — the one
   smuggling risk is defect 1's banding clause (a mechanism, not a value). The
   newlife de-weight row is conditional but correctly lock-gated ("still a lock").
3. **Fences:** Decision 2C's FENCE (economy) is correctly applied. Decision 4C's
   D2-1 framing is defect 4.
4. **AC4 harness:** loud on silent-death (trap + terminal-state + n≥100), weak on
   calibration decidability — defect 3.

## Verdict (Cycle 1)
NOT a pass — 3 MAJOR, 2 MINOR. The re-anchor section is exemplary (every cite
verified true against bytes, including the negative claims about what does NOT
exist), and the lock/gate skeleton is sound. The MAJORs are all decision-hygiene
and proof-decidability flaws: a mechanism smuggled across lock boundaries (D1→4C),
a false zero-risk claim in the recommended option (4A "by construction"), and an
AC4 whose calibration assertions an auditor cannot adjudicate ("e.g." floors, an
undefined band). All fixes are text amendments to the decision blocks and DoD —
no restructuring of the milestones or forks is required.

---

# Cycle 2 — re-review of the revised plan (474 lines, confirmed by count)

Re-read the revised `plan-phase-4.md` in full. Verified all five claimed fixes in
the plan text and probed the coordinator's two specific questions: residual
ambiguity in the D1 lock-boundary statement, and internal consistency of the AC4
windows with the stated n and SEs (re-derived numerically, not taken from the
plan).

## Defect-by-defect verification

1. **(MAJOR — D1 banding smuggle) FIXED.** The recommendation is now "Option A
   (named void landmarks), narrative/anchor-only" (plan:132) with the peril-
   weighting clause deleted, and a dedicated lock-boundary statement (plan:137–143):
   no peril re-weighting without an explicit 4C lock; under 4A landmarks "never
   read into `voyageHazardDanger`, never modify `HOME_HAZARD_P`/`HOME_EVENT_P`,
   never vary any odds by position"; "a lock of 'D1 as recommended' authorizes
   named structure and anchored beats — nothing about odds." One mechanism, one
   lock — the smuggle is gone. *Residual-ambiguity probe:* the phrase "authorizes
   … anchored beats" nominally overlaps Decision 2's domain (anchoring is 2B's
   call, not D1's); however this is non-executable ambiguity — M-HOME1 is gated
   on D1 AND D2 AND D3 (plan:312, §7), so no anchored beat can ship on a D1 lock
   alone. Wording nit, zero build-path consequence; noted, not blocking.
2. **(MAJOR — 4A false "by construction") FIXED, in both places.** Option A's
   pros now say "NOT zero winnability risk" and describe the 2B anchored-event
   residual shift as "real, and … exactly what the AC4 sweep must bound"
   (plan:236–242); "Tom locking 4A + 2B is accepting a small, sweep-bounded
   distribution shift — not 'provably unchanged.'" The same falsehood was also
   fixed in the Decision-5 `HOME_HAZARD_P` row (plan:293: "removes the constant
   itself from AC4 risk — the residual anchored-event shift is what the AC4
   windows bound"). The risk profile shown to Tom is now the combined one.
3. **(MAJOR — AC4 not auditor-decidable) FIXED, with one arithmetic nit (defect
   B below).** The DoD now fixes exact numbers (plan:379–400): n ≥ 200 per arm
   with n printed; sound-arm survival within [94%, 100%] AND ≥1 winning arrival
   tier; wounded-arm LOST within [28%, 52%] two-sided (under = lost its teeth,
   over = deathtrap, both FAIL); measured rates recorded in the dashboard for
   auditor cross-check; the 4A bullet replaces the undefined "homesmoke band"
   with "the two windows above ARE the homesmoke-band check." No "e.g." remains
   in any assertion line. Arm definitions gained concrete configs (Pioneer/no
   brownout vs Voyager/hull ≤ 30/brownout) — an improvement beyond the asked fix.
   *Numeric probe (re-derived):* SE at n=200 is 0.99pt at p=0.98 and 3.46pt at
   p=0.40 — the plan's quoted "≈1.0pt / ≈3.5pt" are accurate. Sound window
   (98→94) = 4.04σ ✓; wounded window (40±12) = **3.46σ**, so the blanket claim
   "the windows below are ≥3.5σ drift bounds" is false for the wounded arm (see
   defect B).
4. **(MINOR — D2-1 fence framing) FIXED.** The fence note now states CLAUDE.md's
   "D2-1 (void-leg pacing)" is unscoped by any committed document, the return leg
   is void-dominated, and 4C is "PRESUMPTIVELY WITHIN the D2-1 fence unless Tom
   rules the fence is outbound-only," with posture `FENCED — needs Tom`
   (plan:269–275); Option C's cons and §6 (plan:458–461) carry the same posture.
   The unsupported "does NOT touch" assertion is gone.
5. **(MINOR — sacred-list classification) FIXED.** The intro thesis is now "no
   sacred-list value changes except under an explicit per-item Tom lock; every
   default is byte-identical," names `HOME_HAZARD_P`/`HOME_EVENT_P` as
   sacred-list odds per CLAUDE.md's "any odds," and frames a locked 4B as the one
   legitimate path (plan:17–22). Decision 4's header drops "adjacent" for "a
   direct sacred-list odds decision" (plan:225). §6 bullet 1 matches (plan:453–455).

Both Cycle-1 nits were also fixed: the canonical-plan cite now reads 1377
(plan:25), and the 724 advance cite is correctly qualified as "one committed
instance … the fold-shortcut path; not the sole advance site" (plan:61–62,
plan:318–319).

## Remaining defects (introduced-or-exposed; both small text fixes)

A. **MINOR — Decision 2 Option A contains a position-dependent-odds mechanism
   that the plan's own new lock-boundary and fence posture forbid as an ordinary
   lock.** 2A's text: a landmark "(optionally) raises the odds an anchored event
   fires near it" (plan:154–156). Raising event odds *near a landmark* IS varying
   odds by position — exactly what the new D1 lock-boundary rules out under 4A
   ("never vary any odds by position," plan:141–142) and what the 4C fence note
   says cannot be locked without Tom's fence ruling. As written, Tom could lock
   2A believing it the "smallest, safest" option while its parenthetical smuggles
   a 4C-class mechanism — the same defect class as Cycle-1 #1, surviving in a
   non-recommended option. Pre-existing text, but the revision's new principle
   now contradicts it outright, and an option that cannot be lawfully implemented
   as written is not genuinely lockable. **Fix:** strike the parenthetical (2A
   becomes blurb-only), or annotate it: "the 'raises the odds nearby' variant is
   position-dependent odds — same FENCED-posture as 4C, not lockable as plain 2A."
B. **MINOR — the AC4 rationale's "≥3.5σ" claim is false for the wounded arm.**
   Re-derived: wounded window 40±12pt at SE 3.46pt = 3.46σ (and by the plan's own
   rounded "≈3.5pt" SE, 12/3.5 = 3.43σ). The sound arm is 4.04σ, fine. The
   operative windows themselves are exact and decidable — only the justification
   sentence overstates. **Fix:** one word — "≈3.5σ" (or "≥3.4σ") instead of
   "≥3.5σ"; do not widen the windows.

## New-defect scan (beyond A/B)

The revision is confined to the intro thesis, D1 recommendation + lock-boundary,
4A pros/recommendation, 4C cons + fence note, D5 `HOME_HAZARD_P` row, AC4 block,
§6 bullets, and the two nit cites. All other sections are byte-consistent with
Cycle-1-verified text; no new file:line claims were introduced requiring fresh
byte checks; milestones, forks, gating, and the docs-pair posture are unchanged.
"Exactly n ≥ 200 … with the n used printed" is awkward phrasing but decidable.

## Verdict (Cycle 2)
NOT a pass — 2 MINOR remaining, both one-line text fixes. All five Cycle-1
defects (and both nits) are genuinely fixed, and the coordinator's two probes
came back clean on the load-bearing side: the D1 lock-boundary's only ambiguity
is non-executable (triple-gated), and the AC4 windows are exact, two-sided, and
decidable at the stated n. What remains: Decision 2A still carries a
position-dependent-odds parenthetical that the plan's own new lock-boundary
forbids (the Cycle-1 smuggle class, surviving in a non-recommended option Tom
could still lock), and the AC4 rationale claims ≥3.5σ where the wounded window
is 3.46σ. Fix both lines and this plan is lockable.

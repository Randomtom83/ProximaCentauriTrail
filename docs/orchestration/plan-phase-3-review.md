# Plan-reviewer verdict — plan-phase-3.md (MICRO: D4, mobile numeric distance)

Reviewed against the standing north star/guardrails; this micro-phase's AC is the
single D4 closure. Every cite checked against HEAD `ba0347a` bytes (confirmed via
`git rev-parse`; style.css 589 lines, game.js 4948, test/layout_onescreen.js 248).

Reality check summary (claims that held):
- **game.js cites accurate:** the `.vs-chips` block is exactly 4362–4367 (Day chip
  4363, Next 4364–4365, Earth 4366, close 4367) — "append after the Earth chip" has
  a well-defined insertion point. `vs-foot` at 4371 renders exactly
  `Math.round(game.distance) + " / " + TOTAL_DIST + " ly-abs"`, so the chip's
  expressions ARE strict reuses (same state reads, no new logic). `TOTAL_DIST` is
  derived (`CUM[CUM.length-1]`, game.js:79) and computes to **434**
  (0+16+26+30+34+30+46+180+52+20) — the plan's "N / 434 ly" evidence text is
  correct.
- **Facts corroborated by committed bytes:** the G3 fallback genuinely shipped —
  the ellipsis floor is active at style.css:527 and the G1 hide exists ONLY inside
  the resolution comment at :528–535, which records the premise-gate failure the
  plan cites (chips visible 3/3; `vs-foot` clipped, bottom 322 vs viewscreen bottom
  230; hide shipped in `791b553` then removed). The plan's premise ("chips survive
  the cap, vs-foot doesn't") matches the recorded evidence.
- **CSS cites accurate:** `.vs-chips` (`flex-wrap:wrap`) at :237, `.chip` at :238
  in the current 589-line file. The display-pair mechanics are sound: base
  `.chip.dist{display:none}` in the base section, `display:inline-block` inside the
  existing ≤900px block (:485+) — later-in-file media rule wins within its
  condition at equal specificity; as a flex item the chip blockifies anyway, so
  `inline-block` is harmless. Desktop ≥900px provably unchanged (base hide applies
  at all widths >900px; there is no other show rule).
- Harness count stays 10 (verified); DoD 1 baseline immutability, DoD 2 file list,
  DoD 3 function-boundary game.js pin, DoD 4 "no other selector changed" are all
  auditor-checkable from committed bytes. Fork K/L reasoning is honest (4b's risk
  is real per the recorded clip evidence; L1 keeps the desktop evidence trivial).

---

## Defects

1. **MAJOR — harness label (k) collides with the ALREADY-SHIPPED (k), making DoD 5
   vacuously satisfiable (false-green vector).** `test/layout_onescreen.js` at HEAD
   already contains assertions (a)–(k); the existing (k) (harness :213–241) pins
   the FORK-D1b commands-compression constructs from the Phase-2 build (an
   unplanned fork logged in plan-events.jsonl — note the shipped letters also
   drifted from the P2 plan: shipped (h) is the stations bound, not the topbar
   ellipsis). T1.3 and DoD 5 name the new chip assertion "(k)": an auditor
   byte-checking DoD 5's "Harness assertion (k) present" finds the OLD (k) and
   passes even if the chip assertion never lands — exactly the vacuous-pass failure
   mode this project's FAIL-LOUD rule forbids. **Fix:** rename the new assertion to
   **(l)** in T1.3 and DoD 5, and make DoD 5 content-specific rather than
   letter-specific: "assertion (l) present, pinning (i) the `chip dist` markup
   string in game.js including `TOTAL_DIST`, (ii) the `.chip.dist` base hide, and
   (iii) the ≤900px show rule; deleting ANY of the three locally exits non-zero
   with a reason." The plan should also correct its implicit model of the harness
   (it assumed P2's planned letters; the shipped file differs).

2. **MINOR — no viewscreen-internals non-regression evidence at 390×844.** The new
   chip changes the chips-row wrap geometry inside an `overflow:hidden` viewscreen
   that the committed evidence shows is ALREADY ~92px over budget at 390×844
   (content bottom 322 vs viewscreen bottom 230, style.css:530–533). A fourth chip
   can wrap the row to another line and push the routemap rail / current node into
   the clipped zone. T2.2 only requires "Dist chip visible with the numeric
   readout" — that can be true while the rail clips below it. **Fix:** extend
   T2.2 and DoD 6: the 390×844 shot must also show the routemap rail and the
   current waypoint node still visible (viewscreen-internals non-regression), not
   just the chip.

Nit (not a defect): the chip's suffix is " ly" where `vs-foot` renders " ly-abs" —
the divergence is titled "numeric ly-abs distance"; information parity holds (same
numbers) and the shorter unit label on a narrow chip is a reasonable, disclosed
choice, but the builder should not "fix" it to ly-abs mid-build without noting it.

---

## What else was probed and held

- **Scope:** single divergence, no creep; the first game.js edit of the run is
  correctly justified (CSS alone cannot conjure the readout into a surviving
  element — the only CSS route is 4b, honestly assessed as a pixel gamble), stays
  inside the presentation gate's explicit "markup strings in render functions"
  allowance, and is pinned by DoD 3's function-boundary check (P1 lesson carried).
- **Dependencies:** T1.1→T1.2→T1.3→M2 ordering sound; docs pair same-commit
  (M-UI2c, append-only, re-fetch check) per standing rule.
- **Guardrails:** frozen-three/baseline untouched by design (DoD 1 pins baseline
  to `ba0347a`); no `data-*`/odds/hidden-meter exposure; no gate-script edits.
- **Fork L:** L1's "1280×720 byte-for-eye unchanged" evidence claim was checked
  against the mechanics — with base-hide and a show rule confined to ≤900px, no
  desktop width can render the chip; the claim is sound.

## Verdict (Cycle 1)
NOT a pass — 1 MAJOR, 1 MINOR. The mechanism (chip + display pair) is sound and
correctly scoped; the MAJOR is a verification defect, not a design one: the plan
labeled its new harness assertion with a letter the shipped harness already uses,
so the DoD's presence check is satisfiable by pre-existing bytes — a false-green
the project's own FAIL-LOUD principle exists to prevent. Both fixes are small text
amendments (rename to (l) + content-specific DoD 5; add viewscreen-internals
non-regression to the 390×844 evidence).

---

# Cycle 2 — re-review of the amended plan (109 lines)

Re-read the amended `plan-phase-3.md` in full and verified each claimed fix in the
plan text. Both Cycle-1 defects and the nit were addressed; the amendment was
probed for newly introduced defects.

## Defect-by-defect verification

1. **(MAJOR — (k) collision / vacuous DoD 5) FIXED.** T1.3 (plan:28–34) renames
   the assertion to **(l)** and states the reason in the plan itself ("NOT (k),
   which is already occupied by Phase 2's shipped FORK-D1b assertions" — matching
   what I verified in the shipped harness at :213–241). The assertion now pins
   three constructs independently: (l1) the `chip dist` markup string in game.js
   including `TOTAL_DIST`, (l2) the `.chip.dist` default-hide rule, (l3) the
   ≤900px show rule. DoD 5 (plan:66–72) is content-specific and mutation-tested
   ("deleting ANY ONE of the three locally makes the harness exit non-zero with a
   printed reason") and — the load-bearing line — explicitly closes the vacuous
   path: "Finding Phase 2's pre-existing (k) assertions does NOT satisfy this
   item — the auditor must verify the NEW (l) content is present, not merely that
   some assertion passes." The false-green vector is eliminated: the (l) letter is
   free (verified letter inventory (a)–(k) at HEAD `ba0347a`), and the DoD check
   can no longer be satisfied by pre-existing bytes.
2. **(MINOR — viewscreen-internals non-regression) FIXED.** T2.2 (plan:42–46)
   requires the 390×844 shot to show "the route rail AND the current waypoint node
   remain visible after the fourth chip lands," and names the exact failure mode
   ("the chip row wraps … an extra line can push the routemap into the
   `overflow:hidden` clip while the chip itself stays visible, so chip-visibility
   alone is NOT a pass"). DoD 6 (plan:73–75) carries the same requirement into the
   committed evidence record.
3. **(Nit — ly vs ly-abs) LOCKED.** T1.1 (plan:20–23) records the unit wording as
   deliberate and forbids a silent mid-build "alignment" in either direction —
   "changing either wording is a plan deviation to surface, not a cleanup."
   Exactly the guard the nit asked for.

## New-defect scan of the amendment

- The amendment is confined to T1.3 (rename + l1/l2/l3), DoD 5 (content-specific,
  mutation-tested, anti-vacuous clause), T2.2/DoD 6 (internals non-regression),
  and T1.1 (wording lock). All other sections are byte-consistent with the
  Cycle-1-verified text; no new `file:line` or factual claims were introduced that
  required fresh byte verification (the "(k) occupied by FORK-D1b" claim matches
  my own Cycle-1 findings against the shipped harness).
- The l1/l2/l3 decomposition strengthens rather than weakens falsifiability: each
  construct is independently pinned, so a partial build (e.g. markup landed, CSS
  pair forgotten) fails loudly instead of hiding behind a compound assertion.
- No scope creep, no guardrail change, no new files; DoD 2's file list, DoD 3's
  function-boundary pin, and the baseline-immutability posture are unchanged.

## Verdict (Cycle 2)
**PASS.** Both Cycle-1 defects are genuinely fixed in the plan text — the (l)
rename plus the anti-vacuous DoD 5 language eliminates the false-green path I
demonstrated against the shipped harness's pre-existing (k), and the 390×844
evidence now covers the named wrap-clip failure mode, not just chip visibility.
The amendment was probed for new defects (assertion falsifiability, consistency of
unchanged sections, scope) and none were found; the mechanism itself was already
sound in Cycle 1.

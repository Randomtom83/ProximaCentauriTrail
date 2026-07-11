# Divergence Report — Pass 3 (final)

*Reconciler pass 3, following the Phase 3 merge (main `8973777` = merge of `ab6b2ce` +
`f591fd2`; audit PASS 7/7 at `docs/orchestration/audit-phase-3.md`). Prior reports:
`divergence-report-1.md` (D1/D2/D3 opened), `divergence-report-2.md` (D1/D2/D3 closed,
D4 opened). Ids reused. Claims verified against committed bytes and an independent gate
re-run — not taken from the coordinator's summary.*

**North star (this run):** *"Proxima Trail plays comfortably on one screen — desktop or
phone — with the story log and the controls both always in view."*

## Overall verdict: **ALIGNED**

D4 is closed on evidence. No new divergences. Every north-star clause, every acceptance
criterion (AC1–AC4), and every guardrail (sacred list, zero-diff gate, FAIL LOUD, docs
pair) holds on merged main.

**Independent verification performed this pass:**
- `bash scripts/verify.sh` re-run on merged main `8973777` → `GATE PASS — 10 harnesses
  green, frozen-three intact, endings golden present.` (reproduced myself).
- `game.js:4367` read at HEAD: the sole game.js change is one markup-string line inside
  `renderTravel` — `<span class='chip dist'><span class='cl'>Dist</span>` +
  `Math.round(game.distance) + " / " + TOTAL_DIST + " ly"`. No `data-*` token, no logic,
  no new state (both expressions already rendered in `vs-foot`, `:4372`). The chip's
  `" ly"` wording is deliberately distinct from vs-foot's `" ly-abs"` — not silently
  aligned (audit DoD 3 pin).
- `style.css` read at HEAD: default-hide `.chip.dist { display:none }` (`:248`), mobile
  show `.chip.dist { display:inline-block }` inside the ≤900px block (`:524`), and the
  correction's interior reclaim — `.vs-title { display:none }` (`:533`), chip
  compression (`:534`), routemap envelope retune (`:535`) — all media-scoped; the
  desktop `.vs-title` rule (`:236`) and base `.chip` rule are untouched.
- `test/layout_onescreen.js:244-272` read: (l1)(l2)(l3) are three independent,
  content-specific assertions (markup string + TOTAL_DIST expression, default-hide,
  ≤900px show), each with its own printed FAIL reason — audited as mutation-verified
  (audit DoD 5), and distinct from the pre-existing (k).
- Audit cross-checked: files touched exactly the 5 allowed (DoD 2); frozen baseline
  byte-identical (DoD 1); honest failure history — first cut `ab6b2ce` FAILED DoD-6
  (chip visible but route rail ~y=123–153 clipped under the 135px cap), disclosed in
  plan-events, fixed by `f591fd2`'s viewscreen-interior reclaim, re-evidenced (rail
  75–105 and current node 79–101 inside the cap, cur/nxt labels visible, log 152px
  held, 0/0/0 overflow; desktop 1280×720 no chip, vs-foot sole ly-abs readout, 9/9
  commands).

---

## CLOSED DIVERGENCES

### D4 — Numeric ly-abs distance absent on mobile travel — **CLOSED** (was cosmetic, opened pass 2)
- **Pass-2 finding:** at 390×844 the numeric distance figure was absent everywhere on
  the travel screen (topbar ellipsized to ~0 chars; `vs-foot` clipped under the capped
  viewscreen) — a real information loss kept on the books rather than waived.
- **What shipped (M-UI2c):** a mobile-only `Dist N / 434 ly` chip appended to
  `.vs-chips` in `renderTravel` (`game.js:4367`, single markup-string line — exactly
  the pass-2 remediation option (a)), default-hidden on desktop and shown only at
  ≤900px via the CSS display pair. Pinned by new fail-loud harness assertions
  (l1)(l2)(l3).
- **Closure test against the pass-2 definition:** the finding was "no numeric distance
  figure anywhere on screen" on mobile travel. Final live evidence (`f591fd2`,
  recorded in plan-events + dashboard, corroborated by audit DoD 6): Dist chip visible
  at 390×844 **together with** the full route rail, current node, and cur/nxt labels
  inside the cap — the fix did not buy the meter back by re-clipping the spatial
  substitute (the first cut did exactly that and was honestly failed and corrected).
  Log strip held at 152px (D1's closure not regressed); desktop unchanged (no chip, no
  duplicate readout, vs-foot intact, 0 overflow). **Closed.**
- **Guardrail note:** this phase touched `game.js` — the first of the three phases to
  do so — and stayed inside the sanctioned envelope: one markup-string line inside a
  render function, frozen-three not in the hunk, baseline byte-identical, gate green
  (audit DoD 1/3). The presentation-only guardrail was honored in substance, not just
  in file lists.

---

## CONSIDERED AND JUDGED NOT A DIVERGENCE

### Mobile viewscreen no longer shows the "NAVIGATION" `vs-title` (correction trade-off)
- **What the code does:** `f591fd2` hides `.vs-title` at ≤900px (`style.css:533`) as
  part of reclaiming viewscreen-interior height so the rail + node + Dist chip all fit
  under the cap. Desktop title untouched (`:236`).
- **Judgment: acceptable-and-recorded, not a new divergence.** Reasoning, held to the
  same standard that kept D4 on the books in pass 2:
  - D4 stayed open because a **meter** (unique numeric information) vanished with no
    numeric substitute. The `vs-title` is a **label** whose information — "this panel
    is navigation" — is fully conveyed by the panel's own content (Day/Next/Earth/Dist
    chips + the route plot). Nothing the player needs to know or do is lost; there is
    a complete functional substitute on the same screen.
  - No documented criterion protects it: it appears in no AC, no north-star clause, and
    no guardrail. The reverse-intent ethos it could brush against (§2.5 "every meter
    and every action visible") concerns meters and actions; a decorative panel heading
    is neither. §2.5's own ranking — layout correctness above ornament — argues *for*
    this trade.
  - It is not silent: disclosed in the correction commit message, the tombstone comment
    at `style.css:525-532`, the plan Addendum, and the dashboard log (audit "Correction
    disclosure — CLEAN"). No accessibility regression: `vs-title` is a visual span, not
    a heading landmark, and the `#sr-live` announcer path is untouched.
  - The trade bought load-bearing content (the spatial rail + the D4 meter) at the cost
    of redundant chrome — the exact priority ordering the project's documented and
    inferred intent both endorse.

---

## CONFIRMED ALIGNMENTS (compact — final state across all three passes)

- **North star, both clauses, both form factors:** desktop ≥1280×720 — log + all 9
  commands + unclipped route labels, zero page scroll (AC1). Mobile 390×844 — 152px
  log strip, 9/9 commands ≥44px, single-line topbar, Dist chip + full rail + node +
  labels inside the viewscreen cap, 0/0/0 overflow (AC2, comfortably).
- **Gate (AC3):** GATE PASS, 10 harnesses, frozen-three intact — reproduced
  independently on merged main `8973777` this pass (as on `ba0347a` in pass 2).
- **Sacred list / zero-diff (AC4):** frozen baseline byte-identical across all three
  phases; the single game.js line in P3 is markup-only inside `renderTravel`, outside
  every frozen function; no sacred token anywhere in added lines; permadeath, sampled
  outcomes, hidden meters, economy, tiers all untouched.
- **FAIL LOUD, applied twice to premises this run:** P2's G1 rolled back on a failed
  premise gate; P3's first cut failed its own rail-visibility DoD and was corrected —
  both failures recorded in the event log, docs, and code comments, neither buried.
  The harness family (a)–(l) is mutation-verified fail-loud throughout.
- **Docs pair rule:** all three phases carried dashboard + plan Addendum in the build
  commits, pure appends, prior sections byte-identical (plan 1073 → 1191 → 1280 lines).
- **No undisclosed forks in any phase:** every fork disclosed and DA-reviewed
  (F-A…F-F, FORK-D1b, the P3 correction); every added selector maps to a task.

---

## Status across passes

| id | pass 1 | pass 2 | pass 3 |
|----|--------|--------|--------|
| D1 | degrades-goal | CLOSED | CLOSED |
| D2 | cosmetic | CLOSED | CLOSED |
| D3 | cosmetic | CLOSED | CLOSED |
| D4 | — | OPEN, cosmetic | **CLOSED** |
| vs-title trade | — | — | considered; **not a divergence** (recorded) |

**Zero open divergences. ALIGNED.**

*End of pass 3 — final.*

# Divergence Report — Pass 2

*Reconciler pass 2, following the Phase 2 merge (main `ba0347a` = merge of `791b553` +
`96de88d`; audit PASS 8/8 at `docs/orchestration/audit-phase-2.md`). Prior report:
`divergence-report-1.md` (D1 degrades-goal, D2 cosmetic, D3 cosmetic). Ids reused.
Claims below were verified against committed bytes and by an independent gate re-run —
not taken from the coordinator's summary.*

**North star (this run):** *"Proxima Trail plays comfortably on one screen — desktop or
phone — with the story log and the controls both always in view."*

**Overall verdict: D1, D2, D3 CLOSED. One NEW cosmetic divergence opened (D4 — the
disclosed D1 residual), so the report is not fully ALIGNED; it is aligned on every
north-star clause and guardrail with a single tracked cosmetic residual.**

**Independent verification performed this pass:**
- `bash scripts/verify.sh` re-run on merged main `ba0347a` → `GATE PASS — 10 harnesses
  green, frozen-three intact, endings golden present.` (reproduced, not quoted).
- `style.css` bytes read at HEAD: ellipsis floor `:527`, G1 hide present only inside the
  tombstone comment (`:528-530`, no live rule), crew-grid retune `:541-542`,
  `@media (max-height:800px)` cur/nxt-only labels + tightened routemap `:560-579`.
- `game.js:4362-4371` read: viewscreen chips carry Day/Next/Earth; the ly-abs figure
  lives only in `vs-foot` (`:4371`) — the element the premise gate measured as clipped
  at 390×844.
- Audit cross-checked: game.js/index.html zero-diff across P2 (audit DoD 2), frozen
  baseline byte-identical (DoD 1), harness fail-loud mutation-verified (DoD 6).

---

## CLOSED DIVERGENCES

### D1 — Mobile topbar wrap squeezes the log — **CLOSED** (was degrades-goal)
- **Pass-1 finding:** ~5-line wrapped `#topbar` above the bridge grid left a measured
  62px log strip at 390×844 — north star served "at its thin margin, not comfortably."
- **What shipped:** one-line ellipsis floor `#topbar-status { white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis; min-width:0 }` in the ≤900px block
  (`style.css:527`). The G1 `:has(.bridge)` hide was built (`791b553`) then **rolled
  back** in `96de88d` because the plan's own premise gate failed — live 390×844
  evidence showed `vs-foot` clipped inside the capped viewscreen, so the topbar's data
  was not fully duplicated there. The sanctioned G3 fallback shipped instead, and the
  rollback was surfaced (dashboard, plan Addendum "Correction" section, event log,
  tombstone comment `style.css:528-530`) — not buried. A disclosed execution-time fork
  **FORK-D1b** (stations bound `clamp(96px,12vh,160px)` + command compression,
  DA-upheld, no touch-floor erosion — audit confirmed zero `min-height` changes) made
  the freed budget actually reach the log.
- **Closure test against the pass-1 severity definition:** the finding was
  degrades-goal because the log was in view but not *comfortably*. Measured result:
  log strip **62 → 152px** at 390×844, topbar single line, 0/0/0 overflow, 9/9
  commands, all touch floors intact (audit DoD 7). The "comfortably" margin the
  north star asks for is now real. **Closed.** The honest residual it left behind is
  a *different, smaller* finding — opened as D4 below, not silently folded into this
  closure.

### D2 — Desktop 720px viewscreen clips route labels — **CLOSED** (was cosmetic)
- **What shipped:** `@media (max-height:800px)` reduces labels to cur/nxt-only
  (`style.css:572-573`, mirroring the pre-existing ≤1100px width rule at `:480-481`)
  and tightens the plot envelope (`.routemap` padding `:578`, `.rm-label.blw`
  top 32→28px `:579`) so even a below-rail label fits inside the cap — existing
  constructs only, no cap raise.
- **Closure test:** re-measured at 1280×720 — zero clipped labels (below-rail label
  bottom 169 ≤ viewscreen bottom 172), AC1 re-verified (audit DoD 4, DoD 7). **Closed.**

### D3 — Voyage crew-table STATUS header clips at 390px — **CLOSED** (was cosmetic)
- **What shipped:** shared crew-grid retune in the ≤900px block —
  `.crew-head, .crew-row { grid-template-columns: 14px minmax(84px,1.4fr) 1fr 1fr 60px;
  gap:6px }` + `.crew-head { letter-spacing:1px }` (`style.css:541-542`). Desktop rules
  (`:314-326`) byte-identical.
- **Closure test:** the fix took the *uniform* scope (Fork I) rather than a narrowed
  voyage-only patch, and STATUS-inside-right-edge was evidenced at **all three**
  call sites (travel/colony/voyage) at 390×844 (audit DoD 5, DoD 7). Broader than the
  pass-1 finding required. **Closed.**

---

## OPEN DIVERGENCES

### D4 — Numeric ly-abs distance readout absent on mobile travel (NEW — the disclosed D1 residual)
- **Severity: cosmetic** (not degrades-goal — reasoning below).
- **Docs say:** the north star names exactly two things that must always be in view:
  **the story log and the controls**. AC2 asks for readable recent log + reachable
  controls + no horizontal scroll. Neither mentions the distance readout. The distance
  figure appears in documented intent only descriptively (`ui-inventory.md:22`, topbar
  travel readout "d/434 ly-abs") — never as an acceptance criterion. The reverse-intent
  read, however, infers a broader ethos: "every meter and every action is visible at
  once" (reverse-intent-1.md §2.5).
- **Code does:** at 390px the ellipsized `#topbar-status` (`style.css:527`) squeezes to
  ~zero visible characters, and the only other home of the numeric figure —
  `vs-foot` (`game.js:4371`) — is clipped inside the capped mobile viewscreen (the very
  premise-gate measurement that forced the G3 fallback). Net: on mobile travel the
  player has Day/Next/Earth chips (`game.js:4363-4366`) and the spatial route plot
  (qualitative progress), but **no numeric distance figure anywhere on screen**.
- **Why cosmetic, not degrades-goal:** both north-star clauses (log in view, controls
  in view) are unaffected — this pass *improved* both. AC1–AC4 all hold. What is lost
  is one redundant-elsewhere-on-desktop numeric meter, on one breakpoint, with a
  qualitative substitute (plot + Next chip) still present. It diverges only from the
  *inferred* §2.5 every-meter-visible ethos, not from any documented criterion. It is
  honestly recorded in the event log, dashboard, and plan Addendum — the correct
  handling for a plan-sanctioned fallback's known cost. Judged **a real (new,
  tracked) divergence at cosmetic severity — not silently "acceptable"** — because an
  information loss should stay on the books until deliberately fixed or deliberately
  waived by Tom, but it does not degrade this run's goal.
- **Remediation (targeted, for a future phase):** restore the figure through a channel
  that survives the mobile caps — e.g. (a) append a compact distance chip to
  `.vs-chips` in `renderTravel` (markup-string-only edit, sanctioned presentation
  scope): `<span class='chip'><span class='cl'>Dist</span>N/434 ly</span>`; or
  (b) let `vs-foot` wrap above the viewscreen cap at ≤900px (CSS-only) so its right
  span stays visible. Option (a) is cleaner; it is a `game.js` render-markup edit, so
  it needs the full presentation-only DoD treatment (zero-diff gate, both `.commands`
  variants unaffected, live re-evidence at 390×844).

---

## CONFIRMED ALIGNMENTS (compact)

- **North star, both clauses, both form factors — strengthened this pass:** desktop
  1280×720 zero clipped content incl. route labels (AC1 re-verified); mobile 390×844
  log strip 152px + 9/9 commands ≥44px + single-line topbar + 0/0/0 overflow (AC2
  comfortably met, no longer marginal).
- **Gate (AC3):** GATE PASS, 10 harnesses, frozen-three intact — **reproduced
  independently on merged main `ba0347a` this pass**, matching the auditor's worktree
  run.
- **Sacred list / zero-diff (AC4):** `game.js` and `index.html` ZERO diff across all of
  Phase 2 (audit DoD 2); frozen baseline byte-identical (DoD 1); no sacred tokens in
  added lines.
- **FAIL LOUD:** harness extended in-file (count stays 10) with (h2)(i2)(j)(k), each
  mutation-tested to exit 1 with a printed reason; (h2) runs against comment-stripped
  CSS so the G1 tombstone cannot false-trip and a live hide rule cannot slip back
  (audit DoD 6).
- **Honest-fallback discipline (process alignment worth naming):** G1 was shipped
  *subject to* a premise gate, the gate failed on real evidence, and the build rolled
  back to the sanctioned fallback with the failure surfaced in code comment, dashboard,
  plan Addendum, and event log. This is the FAIL-LOUD / no-silent-drift ethos applied
  to a design premise, not just to tests.
- **Docs pair rule:** both commits carry dashboard (`mui2b` block, 7/7 done, dated
  entries) + plan Addendum (+118 lines, pure append, prior sections byte-identical)
  (audit DoD 8).
- **No undisclosed forks:** every added selector maps to a disclosed task/fork;
  FORK-D1b disclosed pre-commit and DA-upheld; touch floors byte-intact (audit
  undisclosed-fork hunt, clean).

---

## Status across passes

| id | pass 1 | pass 2 |
|----|--------|--------|
| D1 | degrades-goal | **CLOSED** (residual spun off as D4) |
| D2 | cosmetic | **CLOSED** |
| D3 | cosmetic | **CLOSED** |
| D4 | — | **OPEN, cosmetic** (mobile ly-abs figure absent; disclosed residual of the G3 fallback) |

*End of pass 2.*

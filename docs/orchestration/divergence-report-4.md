# Divergence Report — Pass 4 (the P4 flight-home run)

*Reconciler pass for the P4 run. Prior ledger (D1–D4, the one-screen UI run) is closed and
not re-litigated here. Inputs: reverse-intent DELTA 2 (reverse-intent-1.md:218–314);
documented intent = P4 north_star event + guardrails (plan-events.jsonl:99), the five
Tom-locked decisions D1–D5 + riders ("P4 locks BIND", plan-events.jsonl:119; orchestrator
ruling on P4-D4, :117), plan-phase-4.md (decision blocks, AC1–AC4 DoD, fork blocks P1–P4,
fences), audit-phase-4.md (PASS). Merged main `bbdba5c`. Claims verified against committed
bytes and an independent gate re-run — not taken from summaries.*

**North star (this run):** *"The flight home is as alive as the flight out — the crossing
back to Earth carries the anticipation, texture, and decisions of the outbound trail, tuned
to its own loneliness."*

## Overall verdict: **ALIGNED for this run.**

Zero divergences against the P4 north star, its AC1–AC4, or any lock/fence/guardrail.
The three OPEN colony divergences C1/C2/C3 are confirmed OUT of this run's north star and
routed forward to P5 (see §3) — they are not counted against P4.

**Independent verification performed this pass:**
- `bash scripts/verify.sh` re-run on merged main `bbdba5c` → `GATE PASS — 11 harnesses
  green, frozen-three intact, endings golden present.` (reproduced myself; homeleg counted.)
- `voyageHazardDanger` body read at HEAD (`game.js:2696-2707`): terms are hull, awake-Pilot
  skill, brownout, posture (caution/aggress), `potential`, difficulty — **no
  `v.waypointIndex`, no `v.distance`, no `HOME_WAYPOINTS` term**. The D1 lock boundary
  ("structure/anchor only, never odds by position") holds at bytes, not just in comments.
- Landmark block (`game.js:2530-2560`) grepped: **zero** `applyOutcome`, `Math.random`, or
  `voyageHazardDanger` references — anchored effects route through the voyage-side chain
  only, exactly as locked (FORK P3a) and as the audit found.
- `HOME_WAYPOINTS` (`game.js:2521-2528`) read: three void/deep-space names with the
  fiction-guard comment; sibling of `WAYPOINTS`, not an edit.
- Constants read: `HOME_HAZARD_P = 0.18, HOME_EVENT_P = 0.34` (`game.js:2667`) and
  `EARTH_DOOM_YEARS = 220` (`:163`) byte-identical — D4=A and D5=LEAVE honored.
- Audit cross-checked: frozen baseline byte-identical; outbound machinery
  (WAYPOINTS/CUM/renderRouteMap/ageCrew/voyageEarthSignal/VOYAGE_EVENTS body) byte-identical
  offset-only; auditor independently re-ran the homeleg sweep (600 crossings) with all
  windows passing on an unseeded second run.

---

## 1. The reverse-intent caveat: position-locked anchored beats — CONSIDERED, NOT A DIVERGENCE

Reverse-intent D2.2 flags precisely: *"strictly speaking the crossing is no longer
probabilistically uniform — two beats are position-locked by design"* ("longdark" at 50%,
"word" at 80%). Judged against documented intent, this is **exactly the locked D2=B intent,
not a divergence**:

- **It is the documented decision, made by the human, through the sanctioned process.** The
  P4 guardrail says every odds/pacing/content decision ships ONLY after Tom locks the
  decision blocks. Decision 2 (Option B — anchored decisions at a subset of landmarks) and
  Decision 3 (roster: Halfway Dark and Last Beacon anchored, Fold Seam narrative) were
  surfaced as NEEDS-TOM-LOCK blocks, DA-stress-tested (P4-D2 uphold: "Gameplay is in the
  complaint; B reuses the committed resolver"), and bound in the locks event
  (plan-events.jsonl:119). The sacred-list rule is "stop and surface" — the plan stopped,
  surfaced, and Tom decided. That is the one legitimate path, and it was taken.
- **The sacred item is sampled-not-scripted OUTCOMES, and outcomes remain sampled.** The
  anchored landmarks script the *placement* of an event; its resolution still runs through
  the committed sampled machinery (`resolveVoyageCheck`/`voyageOutcome` — the reverse-intent
  read itself concedes "the sampled engine still resolves them"). "longdark" is a Commander
  *check*, not a fixed result. No outcome became authored.
- **The plan was honest about the residual, in advance.** Decision 4A's own text warns that
  4A+2B is "accepting a small, sweep-bounded distribution shift — not 'provably unchanged'"
  (plan-phase-4.md:237-244) — and AC4's two-sided windows are the bound. The sweep passed
  those windows twice (recorded run + auditor's independent unseeded re-run), so the shift
  is measured and contained, not assumed away.
- **The lock boundary against the *covert* version held.** The genuinely dangerous variant
  — position-dependent *odds* (Decision 4C) — was fenced (`FENCED — needs Tom`, D2-1
  presumption), the plan-reviewer caught and struck a 4C smuggle in review cycle 1
  (plan-events.jsonl:102), and I verified at bytes that no position term reads into the
  danger/odds path. The distinction the reverse-intent report draws (placement vs odds) is
  the same line the locks drew; code and locks agree.

Reverse-intent's own inference (§D2.3.2) lands the same way: a "narrative-pacing value
ranked just below, but touching, the odds-purity value" — which is a fair description of a
deliberate, human-locked, sweep-bounded design choice, not drift.

## 2. AC1–AC4 — each closed against bytes/evidence

- **AC1 (return-leg structure) — CLOSED.** `HOME_WAYPOINTS` sibling exists (`:2521`);
  outbound `WAYPOINTS`/`CUM` byte-identical (audit); `startVoyage` seeds `waypointIndex:0`
  (`:2441`); `voyageCrossLandmarks` sits between arrival check and peril roll (`:2506`) and
  dispatches through `presentVoyageEvent`/`resolveVoyageCheck`/`voyageOutcome`, never
  `applyOutcome` (verified at bytes); `renderReturnMap` plots all 3 interior nodes with
  visited/current/future state, mirror math `left:(1-at)*100%` for the leftward-flying ark,
  reusing the gate-pinned map helpers (`:4418-4442`); fiction guard held (void names, no
  Sol-port reuse). The map that "draws only two nodes" — the visual proof of Tom's
  complaint — now draws five.
- **AC2 (M-INT2 constants per locks) — CLOSED.** Every not-locked-to-change constant
  byte-identical (I read `:2667`/`:163` myself; audit verified the full set incl.
  `VOY_YEARS_PER_TURN`, `EARTH_NOISE_P`, `LAUNCH_READY`, `newlife` weight w:3). D4=A no-op
  honored; the DA's measurement rider shipped as a harness-runtime-only B-preview
  (`HOME_EVENT_P=0.40` exists ONLY in `test/homeleg.js` via the get/set seam, restored and
  leak-guarded) — zero shipped-byte change, exactly per the orchestrator ruling.
- **AC3 (gate + frozen + sibling purity) — CLOSED.** GATE PASS with 11 harnesses reproduced
  by me on `bbdba5c` and by the auditor in the worktree; frozen-three md5-intact; baseline
  byte-identical; `composeEnding` untouched; all outbound cousins byte-identical
  offset-only.
- **AC4 (winnability + distributional evidence) — CLOSED.** Harness windows are the exact
  DoD numbers, not loosened (audit read the bytes: `<94||>100` fails, `<28||>52` two-sided
  fails); recorded run (sound 99.5%, wounded 35.5%) and the auditor's independent run
  (100%, 43.5%, 35 wins) both land inside every window; all 600 arrivals crossed the three
  landmarks in order; the coupling-drift guard confirmed both anchored ids fire at their
  landmarks. Difficulty itself is now regression-tested — a direct extension of the FAIL-
  LOUD ethos into balance territory, as reverse-intent D2.3.3 observes.

**Evidence-mode note (observation, not a finding):** P4's live evidence is DOM-geometry
measurements rather than screenshots ("renderer degraded", plan-events.jsonl:121). The P4
DoD is deliberately bytes-and-harness-checkable and does not mandate screenshots, and the
map geometry was verified numerically at two viewports — acceptable for this phase's ACs.
Worth restoring the screenshot path before the next UI-facing phase. Same for the
auditor's worktree-jsdom environmental note (partial install; committed bytes pass).

## 3. C1 / C2 / C3 — OUT of this run's north star; ROUTED FORWARD to P5

All three were logged by the orchestrator (plan-events.jsonl:104-106) as degrades-goal
**against the project's broader implied intent** (generational simulation, promise-vs-
outcome honesty) — not against P4. Confirmed at each id:

- **C1 — colony has no birth path** (pregnancy machinery exists outbound and on the voyage,
  but `colonyAgeDrift` only ages/matures/kills; `addChild` has zero colony call sites).
  The P4 north star is the *crossing*; C1 is colony-front simulation depth. Fixing it
  touches colony content/pacing → its own decision blocks. **OUT of P4 → route to P5.**
- **C2 — no road home pre-foothold** (the launch/beacon hub renders only when
  `col.footholdReached`; a stalled colony has no path back to Earth, ever). This is the
  closest call, since it gates *access to* the flight home — but the north star is the
  quality and texture of the crossing itself ("the crossing back to Earth carries the
  anticipation, texture, and decisions…"), not who qualifies to attempt it. The P4 plan
  scoped itself to return-leg structure + M-INT2 constants, and `LAUNCH_READY` was
  explicitly reviewed under D5 and locked LEAVE. Changing the foothold gate is a colony
  stage-mechanics and difficulty-posture decision needing its own Tom locks (it brushes
  the brutal-economy/difficulty sacred items). **OUT of P4 → route to P5, flagged as the
  one to examine first** (it can strand a run in a no-terminal-progress pocket, which
  borders the "run reaches a real terminal state" ethos).
- **C3 — Earth never sends promised ships** (the STAY choice promises "signal Earth to
  send more"; `beaconHeard` feeds only ending composition; no arrival mechanic exists).
  A promise-vs-outcome honesty gap on the Earth/colony side — no connection to the
  crossing's texture. New inbound-ship mechanics are new odds/content surfaces → own
  locks. **OUT of P4 → route to P5.**

None of the three is within "the flight home is as alive as the flight out," and none was
made worse by P4 (the P4 diff touches only voyage-scoped siblings + map + harness + docs).
They remain OPEN on the ledger, assigned to the next run.

---

## CONFIRMED ALIGNMENTS (compact)

- **North star answered at its root:** the return leg now has named, anticipatable,
  map-visible structure with two anchored decisions and one foreshadowing beat — the
  literal gap (a two-node map, 48% empty turns with nothing to anchor them) identified in
  the plan's re-anchor and in Tom's complaint.
- **Lock fidelity, all five:** D1=A structure-only (verified at bytes — no position term
  in any odds path); D2=B two anchored (shipped exactly); D3 roster as proposed (names,
  `at` 0.20/0.50/0.80, kinds match the locked table); D4=A shipped constants byte-identical
  + DA measurement rider as harness-only preview; D5 all constants LEAVE (verified).
- **Fences held:** no trade/refuel hub (2C FENCED — no such code); no position-dependent
  odds (4C FENCED — verified); frozen-three/composeEnding untouched; outbound machinery
  byte-identical (sibling discipline held end-to-end).
- **Process guardrail honored:** decision-first plan, plan-reviewer caught the 4C smuggle
  and the false "unchanged-by-construction" claim in cycle 1; DA 8/9 upheld with the one
  partial overturn absorbed as a measurement-only rider under orchestrator ruling; locks
  BIND before build; audit PASS on committed bytes with an independent sweep re-run.
- **FAIL LOUD extended to balance:** `test/homeleg.js` (n=200/arm, error-trapped, real
  terminal state asserted, two-sided windows) makes difficulty drift a gate failure —
  the strongest new alignment of this run.
- **Docs pair rule:** same commit `e2d8062` carries game.js + dashboard (status + dated
  entry with recorded rates) + M-HOME1 Addendum (pure append, 1377→1488).
- **Honest disclosure culture intact:** the plan pre-declared the 4A+2B residual shift;
  the Addendum discloses the cond-gated "word" beat can legitimately not fire on a
  silent-Earth run; the built-ahead texture (Fold Seam null-anchor, rider data recordings)
  matches reverse-intent's "instrument first, decide later" reading — sanctioned
  scaffolding, not scope creep.

---

## Status ledger

| id | scope | status |
|----|-------|--------|
| D1–D4 | one-screen UI run | CLOSED (passes 1–3) |
| P4 anchored-beat placement caveat | this run | considered; **not a divergence** (locked D2=B, sweep-bounded) |
| C1 colony birth path | colony front | OPEN — **routed to P5** |
| C2 road home pre-foothold | colony front | OPEN — **routed to P5** (examine first) |
| C3 Earth's promised ships | colony/Earth front | OPEN — **routed to P5** |

**P4: zero open divergences. ALIGNED for this run.**

*End of pass 4.*

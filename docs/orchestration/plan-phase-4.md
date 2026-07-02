# Phase 4 — The flight home, as alive as the flight out

**Phase goal (Tom's complaint, verbatim):** "the flight home — it includes none of the
excitement or detail or gameplay that the flight to Proxima has."

**North star:** The flight home is as alive as the flight out — the crossing back to Earth
carries the anticipation, texture, and decisions of the outbound trail, tuned to its own
loneliness.

**Two-headed scope:** (a) RETURN-LEG STRUCTURE — named landmarks/segments for the crossing
home that anchor events/decisions the way outbound waypoints do; (b) M-INT2 PROPER — resolve
the long-flagged tuning constants.

**This plan is DECISION-FIRST.** Every odds/pacing/scarcity/content choice is a numbered
DECISION BLOCK tagged **NEEDS TOM LOCK**. Milestones/tasks below the decisions are
CONDITIONAL — the Builder is not cleared to execute a milestone until its governing decision
is locked. **Sacred-list thesis: no sacred-list value changes except under an explicit
per-item Tom lock; every default is byte-identical.** `HOME_HAZARD_P`/`HOME_EVENT_P` ARE
sacred-list odds (CLAUDE.md: "any odds"), so a locked Decision 4B would deliberately touch a
sacred item under Tom's explicit authorization — the one legitimate path. Where a
recommendation would otherwise drift onto the list, it is lock-gated or fenced, never built
by default.

Commit ground truth: HEAD `a4158f3`. Canonical plan re-read fresh this session
(`docs/proxima-trail-implementation-plan.md`, 1377 lines, through M-UI3b). Line cites below
are against the working-tree `game.js` at HEAD.

---

## 1. RE-ANCHOR — what exists at HEAD, verified against bytes

The orchestrator's diagnosis is confirmed by source. The home-crossing **machinery** is at
near-parity; the **structure** is not.

### 1.1 The machinery already present (do NOT rebuild — SIBLING precedent P3-M2..M4)
- **Turn loop:** `voyageTurn(auto)` (game.js:2466) — fuel/O₂/food/ailment/medbay/hull ticks,
  then `voyageEarthSignal()` (2493), `voyageAgeCrew()` (2494), `applyCommanderFloor` (2495),
  arrival check (2497), then ONE peril: `if (peril < HOME_HAZARD_P) rollHomeHazard` else
  `if (peril < HOME_HAZARD_P + HOME_EVENT_P) rollVoyageEvent` else quiet (2501–2503).
- **Hazard spectrum:** `HOME_HAZARDS` (2615) = debris/vflare/micromet, sampled clean→graze→
  serious→casualty→crippling→catastrophic via `voyageHazardDanger` (2643) + `voyageHazardSeverity`
  (2695). Catastrophic → `finishVoyage(false,"LOST WITH ALL HANDS")` → `tryCompose` (never a
  bare endGame). Calibrated at P3-M3 by `homesmoke`: SOUND ark ~98% survive / ~2% catastrophic;
  WOUNDED ark ~40% LOST. **This is the AC4 calibration reference.**
- **Choice-events:** `VOYAGE_EVENTS` (2507) = 10 entries — derelict, fold, pursuer, sick, calm,
  cache, lost, word, longdark, newlife — each a skill-check or narrative beat, weighted,
  some `cond`-gated (fold on knowledge/alien-tech, pursuer on alien.pursuit, word on Earth
  not-silent). `rollVoyageEvent` (2548) / `presentVoyageEvent` (2560) / `voyageOutcome` (2580).
- **Generations:** `voyageAgeCrew` (per grep ~2494 call; sibling of `ageCrew`) — v.crew age at
  `VOY_YEARS_PER_TURN`, a transit-born child matures to man a station (Pilot when vacant).
- **Earth truth/belief arc:** `voyageEarthSignal` runs off the voyage clock; hidden `earth.truth`
  (0–4), bounded shown `earth.estimate`; resolves at arrival on TRUTH (`voyageArrive` 2723).
- **Interactions on the ship HUD:** Thrust, Rations, Pods (`voyageHibernate` 2768), Rest &
  repair (`voyageRest` 2803), Scavenge (`voyageScavenge` 2819) — action row at
  `renderVoyage` 4765–4773.

### 1.2 The structural gap — the return is ONE undifferentiated leg (the whole phase)
- **Outbound** has a named trail: `WAYPOINTS` (game.js:50–71) — 10 nodes, each
  `{ name, dist, kind, blurb, … }`, kinds start/station/hazard/waypoint/void/win; `CUM` (74)
  cumulative distance; `TOTAL_DIST` (79); the ship tracks `game.waypointIndex` + `game.visited`
  (advance while-loop pattern — one committed instance at 724, the fold-shortcut path; not the
  sole advance site); station arrival opens trade/work/rest (`WAYPOINTS[...].kind==="station"`).
  Anticipation is *spatial and named* — you can see Titan Depot coming, and the Void looming.
- **The return leg has NONE of it.** `startVoyage` (2431) builds `game.voyage` with a bare
  scalar span: `distance:0, total: round(TOTAL_DIST*0.62), turn:0` (2440). There is **no
  voyage waypoint array, no CUM, no `v.waypointIndex`, no `visited`, no named segments.**
  Perils fire on a **flat per-turn dice roll** (`HOME_HAZARD_P`/`HOME_EVENT_P`) that is
  position-independent — the same odds at 5% home as at 95% home.
- **The homebound map draws only two nodes.** `renderReturnMap(v)` (4365–4373): Earth glyph at
  `left:0%`, Proxima glyph at `left:100%`, a bare arc, an ark marker at `f*100`. No intermediate
  landmarks, because there is no data behind them. This is the visual proof of the complaint.
- **Quiet-turn share (Tom's "~48%"):** `1 − HOME_HAZARD_P − HOME_EVENT_P = 1 − 0.18 − 0.34 =
  0.48`. Nearly half of homeward turns produce no peril and no landmark beat — an
  undifferentiated hum. That number is the M-INT2 tuning target, but it is a *symptom* of the
  structural gap: with no landmarks to anchor beats, a quiet turn is truly empty.

### 1.3 Constraints that shape every option below
- **SIBLING pattern is mandatory.** Outbound `WAYPOINTS`/`CUM`/`renderRouteMap`/`voyageTurn`'s
  outbound cousins stay byte-identical. New return structure is voyage-scoped state + sibling
  functions, never edits to outbound functions (P3-M3/P3-M4 precedent).
- **Frozen-three untouched:** `applyOutcome`/`resolveCheck`/`tryCompose` md5-identical;
  `composeEnding` golden-locked (unchanged this phase).
- **`voyageOutcome` is the only mutation path** for voyage supplies/hull/distance/crew — new
  landmark effects route through it, never through the frozen `applyOutcome`.
- **Gate contract:** `scripts/verify.sh`, `MIN_TESTS=9`, currently **10** committed harnesses
  (the 9 named + `layout_onescreen`). New harness must FAIL LOUD (nonzero exit, printed reason,
  global error trap, asserts a real terminal state) and be counted by the gate.

---

## 2. DECISION BLOCKS — each NEEDS TOM LOCK before its milestone runs

### DECISION 1 — Return-leg structure model  **[NEEDS TOM LOCK]**

*What shape does the "named trail home" take?* This is the heart of AC1.

**Option A — Named void landmarks (a fresh homebound trail).** A new voyage-scoped array
`HOME_WAYPOINTS` (sibling of `WAYPOINTS`): a handful of named deep-space landmarks the ark
passes on the way back — e.g. *The Fold Seam · The Drift Fields · The Halfway Dark · The Last
Beacon · Sol's Threshold*. Each carries `{ name, at (fraction 0→1), kind, blurb }`. The voyage
gains `v.waypointIndex`/`v.landmarks` (siblings of `game.waypointIndex`/`visited`); crossing a
landmark fires a one-time arrival beat (a logged blurb + optionally an anchored event/decision).
The map (`renderReturnMap`) plots them as nodes between Earth and Proxima.
- *Pros:* strongest answer to the complaint — a *named, anticipatable* trail home, distinct
  fiction from the outbound (these are the empty places between, not the crowded ports out).
  Anchors events spatially so "the pursuer catches you at The Halfway Dark" reads as a place.
  Purely additive; frozen/outbound untouched.
- *Cons:* most build (new array + index tracking + map render + arrival dispatch). Must decide
  landmark count and whether any offer *interaction* (Decision 2).

**Option B — Derived reverse-waypoints (mirror the outbound trail backwards).** Reuse the
outbound `WAYPOINTS` names in reverse (Sol's Threshold ≈ Proxima Approach, … Earth Orbit),
scaling `CUM` to the 0.62 return span. No new content — the landmarks ARE the outbound stations
seen from the other side.
- *Pros:* cheapest; zero new fiction to write; "you pass Titan again, dark now" is poignant.
- *Cons:* **fights the fiction** — the outbound trail is Sol-system ports (Lunar Gateway, Ares,
  Titan); the return is mostly the 180-ly interstellar Void, so a literal reverse implies you
  re-transit Saturn on turn 2, which is nonsense at `total = 0.62·TOTAL_DIST` where the Void
  dominates. Would need heavy reinterpretation to not read as a bug. The "reverse the ports"
  idea is emotionally thin next to Option A's *new* dark places.

**Option C — Segment bands (unnamed phases, no discrete nodes).** Divide the return into 3–4
*bands* by distance fraction (e.g. Outbound Shadow 0–0.3 · The Deep 0.3–0.7 · Homecoming
0.7–1.0) that only re-weight peril odds and tint the log/HUD — no named nodes on the map.
- *Pros:* small build; directly enables position-dependent pacing (feeds Decision 4/5); no new
  map work.
- *Cons:* **does not answer the complaint's "detail"** — bands are invisible structure; there
  are still no *named* landmarks to anticipate. Tom's model is the outbound trail's *named
  nodes*, not a hidden difficulty curve. Weak on AC1's "anchor events/decisions the way
  outbound waypoints do."

**Planner recommendation: Option A (named void landmarks), narrative/anchor-only.** A is the
only option that delivers a *named, anticipatable* trail — the literal thing Tom is asking for
and the thing the map can render. The honest note: A is the most work, and I am NOT collapsing
that fork to save effort — B is cheaper but fiction-breaking, C is cheaper but invisible.

**Lock-boundary statement (one mechanism, one lock):** A's `at` fractions make segment banding
STRUCTURALLY possible later, but **NO peril re-weighting ships in this phase unless Decision 4C
is explicitly locked** (and 4C is itself fence-gated — see the Decision 4 fence note). Under
Decision 4A the landmarks are narrative/anchor beats ONLY: they never read into
`voyageHazardDanger`, never modify `HOME_HAZARD_P`/`HOME_EVENT_P`, and never vary any odds by
position. A lock of "D1 as recommended" authorizes named structure and anchored beats — nothing
about odds.

**Fiction guard (locked regardless of option):** the return landmarks are the *empty between*,
NOT re-transited Sol ports — so Option A's names must be void/deep-space fiction, never a reuse
of station names, to avoid the Option-B incoherence.

---

### DECISION 2 — Do return landmarks offer INTERACTION, or pure narrative anticipation?
**[NEEDS TOM LOCK]** *(governs whether AC1 landmarks are decision points or texture)*

**Option A — Pure narrative anticipation.** A landmark arrival logs its blurb — blurb-only,
no odds effect of any kind — and adds no new player choice. The existing
ship-HUD actions (Thrust/Rations/Pods/Rest/Scavenge) remain the only levers.
- *Pros:* smallest, safest; no new economy or odds surface; anticipation comes from *seeing the
  named landmark approach on the map* and the beat when you reach it.
- *Cons:* less "gameplay" than the outbound stations (which are re-openable trade/work hubs).

**Option B — Anchored decision at some landmarks (an event that MUST resolve there).** Selected
landmarks force a themed choice-event on arrival (e.g. *The Last Beacon* → "broadcast your
position (morale, but the pursuer may hear) or run dark"). Reuses the `VOYAGE_EVENTS` /
`presentVoyageEvent` machinery; the landmark just guarantees a specific event instead of the
dice pool.
- *Pros:* real decisions anchored to places — closest to the outbound "crossings"; high texture;
  reuses committed event machinery (low risk).
- *Cons:* more content to write; each anchored event is an odds/content choice needing its own
  sub-lock (kept inside the Decision-3 content list).

**Option C — Interactive sites (a return analog of stations: trade/scavenge hub).** A landmark
opens a mini-hub — e.g. a derelict depot where you can scavenge-with-choice or a passing convoy
to trade with.
- *Pros:* deepest gameplay parity with outbound stations.
- *Cons:* **heaviest, and brushes the brutal-economy sacred item** — a reliable homebound
  trade/refuel hub would slacken the "finite stores on the long crossing" tension that
  `voyageHibernate`/`voyageScavenge` are built around. Adding a safe resupply valve is a
  scarcity change → **FENCED territory**; not recommended without an explicit scarcity lock.

**Planner recommendation: Option B (anchored decisions at a subset of landmarks), with the
rest Option-A narrative.** B gives the "detail and gameplay" Tom wants by making some landmarks
*decision points*, reuses the committed `VOYAGE_EVENTS` machinery (no frozen-three risk, no new
resolver), and stays clear of the economy. I am flagging honestly that Option A alone is
cheaper and would still add named anticipation — but it under-delivers on "gameplay," which is
literally in the complaint, so I am not defaulting to the cheaper A. Option C is explicitly
**declined as FENCED** — it would touch the brutal-economy scarcity that the sacred list
protects; if Tom wants a homebound trade hub, that is a separate scarcity decision, not this
phase.

**Anchored-event effects route ONLY through `voyageOutcome`** (never `applyOutcome`), and any
new event's odds/rewards are enumerated in Decision 3 for a content lock.

---

### DECISION 3 — Landmark roster + anchored-event content  **[NEEDS TOM LOCK]**
*(the actual named content — a content/odds choice, so it needs the lock even though it adds
no constant change)*

Proposed roster (Option A fiction, 5 landmarks incl. endpoints already drawn; ~3 new named
interior nodes — count is itself part of the lock):

| # | Landmark (working name) | `at` | kind | Beat |
|---|---|---|---|---|
| — | Proxima (start of return) | 0.00 | start | (already drawn) |
| 1 | **The Fold Seam** | ~0.20 | waypoint | narrative: the shortcut you may or may not have taken outbound; foreshadows the `fold` event |
| 2 | **The Halfway Dark** | ~0.50 | void | ANCHORED (Decision 2B): the loneliest point — a morale/hibernation decision |
| 3 | **The Last Beacon** | ~0.80 | waypoint | ANCHORED (Decision 2B): broadcast-or-run-dark, ties to Earth belief + pursuer |
| — | Earth (home space) | 1.00 | win | (already drawn) |

- **Anchored events reuse existing `VOYAGE_EVENTS` beats where possible** (e.g. The Last Beacon
  can anchor a variant of `word`/`longdark`) to minimize net-new odds surfaces. Any genuinely
  new event is written with explicit weights/rewards for the lock.
- **The names, the count, the `at` positions, and whether each anchored event is new or reuses
  an existing beat are ALL part of this lock.** The table above is a proposal, not a decision.

**Planner recommendation:** 3 interior landmarks (above), 2 anchored (Halfway Dark, Last
Beacon), 1 narrative (Fold Seam). Enough to make the trail *named and anticipatable* without
a content-writing blowout. Rationale grounded in existing distributions: with `total ≈
0.62·TOTAL_DIST` and typical return lengths, 3 interior nodes space a landmark roughly every
few turns — dense enough to feel structured, sparse enough that quiet turns still breathe.

---

### DECISION 4 — `HOME_EVENT_P` / `HOME_HAZARD_P`: the 48%-quiet problem  **[NEEDS TOM LOCK]**
*(M-INT2 — a direct sacred-list odds decision — CLAUDE.md's "any odds" covers these constants —
which is exactly why it needs the lock)*

Current: `HOME_HAZARD_P = 0.18`, `HOME_EVENT_P = 0.34` (game.js:2614) → **48% quiet turns.**
Once Decision 1/2 land, landmarks fire their OWN anchored beats on arrival, so a chunk of the
"empty" turns become landmark turns for free — the quiet share drops without touching these
constants at all.

**Option A — Leave both constants byte-identical; let landmarks absorb the quiet.** The
landmark arrivals (Decision 1) are the new texture; the flat per-turn odds stay exactly as
`homesmoke`-calibrated.
- *Pros:* the CONSTANTS' contribution to risk is unchanged by construction — the lowest-risk
  odds posture on offer. **But NOT zero winnability risk:** under the recommended Decision 2B,
  mandatory anchored events at landmarks carry resource/crew effects through `voyageOutcome`,
  so the per-crossing outcome distribution shifts even with both constants byte-identical.
  That residual shift is real, and it is exactly what the AC4 sweep must bound (the numeric
  windows in the DoD). Tom locking 4A + 2B is accepting a small, sweep-bounded distribution
  shift — not "provably unchanged."
- *Cons:* between landmarks, quiet turns are still 48% likely; and the residual anchored-event
  shift above must be proven inside the AC4 windows, not assumed away.

**Option B — Modest `HOME_EVENT_P` bump (e.g. 0.34 → 0.40), `HOME_HAZARD_P` unchanged.** Fewer
quiet turns via more *choice-events* (not more lethality — hazards stay at 0.18).
- *Pros:* directly cuts the quiet share to ~42%; adds texture without adding death risk.
- *Cons:* any odds change requires re-proving AC4 with a fresh homesmoke sweep; must confirm the
  sound-ark survival stays ≈98% and wounded ≈40% (raising *event* not *hazard* odds should not
  move catastrophic rate, but must be shown, not asserted).

**Option C — Position-dependent odds (feed Decision 1C banding).** Quiet near the endpoints,
denser in The Deep; total quiet share unchanged but *distributed* so the middle feels alive and
the approach tightens.
- *Pros:* most evocative pacing; the crossing has a shape.
- *Cons:* most tuning; hardest to prove winnable (odds now vary with position); **presumptively
  WITHIN the D2-1 void-leg pacing fence** (see fence note below), so it needs Tom's fence
  ruling before it can even be locked as a Decision-4 option.

**Planner recommendation: Option A as the baseline (ship it first, prove AC4 inside the DoD
windows), with Option B held as a tunable follow-up IF Tom wants fewer quiet turns after
seeing A.** A is the lowest-odds-risk path: the phase's *structure* work (Decisions 1–3) is
what answers the complaint; changing odds on top is a separate, provable-cost lever. I am
explicitly NOT recommending C (position-dependent odds) for this phase — it is the most
evocative but also the most winnability-fragile, and per the fence note below it sits
presumptively inside the D2-1 fence, so it is not an ordinary lockable option at all.

**FENCE NOTE (D2-1):** CLAUDE.md fences "D2-1 (void-leg pacing)" with NO front scoping, and no
committed document defines its boundary — and by this plan's own re-anchor the return leg is
itself void-dominated. Decision 4C (position-dependent pacing on the return) is therefore
treated as **PRESUMPTIVELY WITHIN the D2-1 fence unless Tom rules the fence is outbound-only.**
Per the fenced-items policy the Planner's posture on 4C is `FENCED — needs Tom`: it cannot be
locked as an ordinary Decision-4 option; it needs Tom's explicit fence ruling first, and only
then a pacing lock. 4A/4B do not raise the fence at all.

---

### DECISION 5 — The remaining M-INT2 constants  **[NEEDS TOM LOCK, per constant]**
*(each is a hidden-meter/pacing value on the sacred list — NO change without an explicit lock;
the default for every one is LEAVE BYTE-IDENTICAL)*

The sacred list names `EARTH_DOOM_YEARS` explicitly as a hidden meter that "stays hidden" and
must never change. These were flagged "tune in M-INT2" in P3-M4, but flagging is not a change
mandate. Each row's recommendation is grounded in the committed distributions.

| Constant | HEAD value | site | Planner recommendation | Rationale |
|---|---|---|---|---|
| `EARTH_DOOM_YEARS` | 220 | 163 | **LEAVE (do not touch)** | Sacred-list-named hidden meter. It sets the truth-worsening pressure curve that makes a long crossing land on a silent/gone Earth; `homesmoke`/`earthm4` were calibrated against it. Changing it silently shifts every ending distribution. Recommend NO change; if Tom wants a different doom horizon it is an explicit, separately-swept lock. |
| `VOY_YEARS_PER_TURN` | 1.6 | 160 | **LEAVE** | Drives `exodusYears()` and voyage aging cadence; M-INT1b's clock legibility depends on the current `max()` reconciliation. A change desyncs the surfaced clock and the aging payoff. No change absent an explicit lock. |
| `EARTH_NOISE_P` | 0.30 | 164 | **LEAVE** | Belief-jitter within the ±1 bound; `earthm4` asserts the bound holds. Cosmetic to change, risky to prove. No change. |
| `LAUNCH_READY` | 100 | 153 | **LEAVE** | The colony refit gate to launch home; `decisionm1` pins the gate behavior. Unrelated to the return-leg texture complaint. No change. |
| `HOME_HAZARD_P` | 0.18 | 2614 | **LEAVE (Decision 4A)** | Lethality knob; leaving it byte-identical removes the constant itself from AC4 risk — the residual anchored-event shift is what the AC4 windows bound. |
| `HOME_EVENT_P` | 0.34 | 2614 | governed by **Decision 4** | Only candidate for a defensible change (texture, not lethality), and only if Tom picks 4B. |
| dual birth-source balance (P3-M4 note) | — | `voyageAgeCrew` + `newlife` event | **REVIEW, likely LEAVE** | P3-M4 flagged that a transit child can be born via BOTH `voyageAgeCrew` pregnancy AND the `newlife` VOYAGE_EVENT. If the birth rate is not visibly too high in the AC4 sweep, leave both. Only if the sweep shows implausible birth frequency, de-weight `newlife` (a content weight, still a lock). |

**Planner recommendation for Decision 5 as a whole: change NOTHING here except possibly
`HOME_EVENT_P` (only under Decision 4B) and possibly the `newlife` weight (only if the AC4
sweep shows a birth-rate problem).** This is the honest position: the complaint is about
*structure*, not *tuning*; most of these constants are sacred-list hidden meters whose default
is "never change." I am not recommending we spend the M-INT2 budget moving numbers that aren't
broken. If Tom wants a specific constant retuned, that is a per-constant lock with its own
before/after sweep evidence.

---

## 3. MILESTONES → TASKS (CONDITIONAL on the locks above)

> The Builder executes a milestone ONLY after its governing decision is locked. Milestones are
> ordered so structure lands first (answers the complaint), tuning second (only if locked).

### M-HOME1 — Return-leg named structure  *(gated on DECISION 1, 2, 3)*
- **T1.1** Add voyage-scoped structure to `startVoyage` (game.js:2431): `v.landmarks =
  HOME_WAYPOINTS.slice()` (or `v.waypointIndex = 0`), computed from a new module-level
  `HOME_WAYPOINTS` array (sibling of `WAYPOINTS`, per Decision 1/3). Additive — outbound
  `WAYPOINTS`/`CUM` untouched.
- **T1.2** In `voyageTurn` (2466), after the distance advance (2471) and before the peril roll
  (2501), add a **landmark-crossing check** (mirroring the outbound waypoint-advance while-loop
  pattern, cf. the committed instance at 724): while the
  next landmark's `at·v.total` is passed, mark it visited and dispatch its beat — narrative log,
  or (Decision 2B) an anchored event via the existing `presentVoyageEvent`/`rollVoyageEvent`
  path. Auto (off-front) resolves inline with no modal, mirroring `rollHomeHazard(auto)`.
- **T1.3** Anchored events (Decision 3): add the locked new/variant entries; effects route
  through `voyageOutcome` only. `cond`-gate as needed (e.g. Last Beacon vs pursuer/Earth state).
- **T1.4** `renderReturnMap(v)` (4365): plot the interior landmarks as nodes between Earth and
  Proxima (reuse the existing `rmChart`/`rmGlyph`/`rmCurveY` helpers — presentation only), with
  visited/current/future state like the outbound `renderRouteMap`. Labels reuse the existing
  overlay/collision system (gate-pinned — do not disturb).
- **T1.5** Ensure the map + any new HUD line fit the M-UI2/M-UI2c one-screen budget (390×844):
  the return map already renders; added interior nodes must not overflow the viewscreen cap.

### M-HOME2 — Pacing/odds tuning  *(gated on DECISION 4; SKIP if 4A + no D5 changes)*
- **T2.1** If Decision 4B locked: change `HOME_EVENT_P` to the locked value at game.js:2614
  (one-line, documented as a deliberate constant change).
- **T2.2** If any Decision 5 constant locked to change: apply exactly the locked value, note it.
- **T2.3** If Decision 4A + no D5 change: this milestone is a **no-op** — record that the quiet
  share dropped via landmark structure alone, constants byte-identical.

### M-HOME3 — Distributional proof + docs pair  *(always runs)*
- **T3.1** New harness `test/homeleg.js` (see DoD) — landmark structure + winnability sweep.
- **T3.2** Run `scripts/verify.sh` → GATE PASS; capture the frozen-three + harness results.
- **T3.3** Docs pair (CLAUDE.md standing rule): append a condensed **M-HOME1** Addendum to
  `docs/proxima-trail-implementation-plan.md` AND flip status + dated log entry in
  `docs/dashboard.html`, in the SAME commit as the code.

---

## 4. DEFINITION OF DONE — auditor-checkable against committed bytes alone

**AC1 — return-leg structure (per Tom-locked Decision 1/2/3):**
- [ ] A voyage-scoped landmark array exists (grep: `HOME_WAYPOINTS` or equivalent locked name)
      and is a SIBLING — `WAYPOINTS` (game.js:50–71) and `CUM` (74) are **byte-identical** to
      HEAD (`git show a4158f3:game.js` diff shows no change in those ranges).
- [ ] `startVoyage` seeds the voyage landmark state; `voyageTurn` crosses landmarks and fires
      their beats (grep the crossing block; it sits between the distance advance and the peril
      roll, and calls `voyageOutcome`/`presentVoyageEvent`, never `applyOutcome`).
- [ ] `renderReturnMap` plots ≥1 interior named node (not just Earth+Proxima) — verifiable in
      the committed function body; reuses `rmChart`/`rmGlyph`, no new map engine.
- [ ] Landmark names are void/deep-space fiction, NOT reused Sol-station names (fiction guard).

**AC2 — M-INT2 constants resolved per Tom-locked decisions (NO change without a lock):**
- [ ] Every constant NOT explicitly locked to change is **byte-identical** to HEAD:
      `EARTH_DOOM_YEARS=220` (163), `VOY_YEARS_PER_TURN=1.6` (160), `EARTH_NOISE_P=0.30` (164),
      `LAUNCH_READY=100` (153), `HOME_HAZARD_P=0.18` (2614). Any constant that DID change cites
      its Tom lock in the commit message and the Addendum.
- [ ] If `HOME_EVENT_P` changed, it changed ONLY to the Decision-4-locked value.

**AC3 — GATE PASS + frozen-three untouched + outbound machinery byte-identical:**
- [ ] `scripts/verify.sh` → **GATE PASS**; `node scripts/frozen.js --check` passes;
      `test/frozen-baseline.json` **byte-identical** to HEAD (frozen-three not intentionally
      changed → baseline not updated).
- [ ] `applyOutcome` / `resolveCheck` / `tryCompose` md5-identical to baseline;
      `composeEnding` unchanged (endings_golden green).
- [ ] **Outbound machinery byte-identical** (sibling precedent): `WAYPOINTS`, `CUM`,
      `renderRouteMap`, and the outbound `voyageTurn` cousins / `ageCrew` / `earthSignal` show
      no diff vs HEAD. New code is voyage-scoped siblings only.
- [ ] Harness count ≥ `MIN_TESTS` (9); `test/homeleg.js` present and counted (→ 11 harnesses).

**AC4 — winnability preserved, homesmoke-style distributional evidence.**
*(Exact numbers, fixed here by the plan — the Builder does not choose them; no "e.g." in any
line. Tolerances derive from binomial noise at the stated n: at n=200, SE ≈ 1.0pt at p=0.98
and ≈ 3.5pt at p=0.40, so the windows below are ≈3.5σ drift bounds around the P3-M3
`homesmoke` reference points of 98% sound-ark survival / 40% wounded-ark LOST.)*
- [ ] `test/homeleg.js` runs a distributional sweep of **exactly n ≥ 200 full return crossings
      per arm, with the n used printed in the harness output**, installs a global error trap,
      and asserts each run reaches a **real terminal state** (an arrival tier or LOST WITH ALL
      HANDS) — FAIL LOUD, no silent/never-ending run.
- [ ] **Sound-ark arm** (Pioneer, healthy hull, no brownout): survival rate **within
      [94%, 100%]**, AND ≥1 run reaches a *winning* arrival tier (winnable, not merely
      survivable). Below 94% = FAIL.
- [ ] **Wounded-ark arm** (Voyager, hull ≤ 30, brownout): LOST WITH ALL HANDS rate **within
      [28%, 52%]** — two-sided: under 28% means the crossing lost its teeth (FAIL), over 52%
      means it became a deathtrap ("preserved" fails even though "deadly" passes — FAIL).
- [ ] The **measured rates for both arms are recorded** in the `docs/dashboard.html` log entry
      (auditor cross-checks the recorded numbers against the harness output).
- [ ] Landmark structure asserted: over a sweep, ≥1 interior landmark is crossed and its beat
      logged; a transit that reaches Earth passes all interior landmarks in order.
- [ ] If DECISION 4A (constants unchanged): the two windows above ARE the homesmoke-band
      check — there is no separate, undefined "band"; passing both windows at n ≥ 200 is the
      evidence that structure (plus the bounded anchored-event shift), not odds, did the work.

**Docs pair (CLAUDE.md standing rule) — checkable:**
- [ ] Same commit contains: the game.js change, a new **M-HOME1** condensed Addendum appended
      (not overwritten) to `docs/proxima-trail-implementation-plan.md`, and a dated
      `docs/dashboard.html` log entry + status flip. Plan line count grew by ~the Addendum size.

---

## 5. FORK BLOCKS — implementation choices that are the PLANNER's (not Tom's) to make

*(These are engineering forks below the sacred-list line — disclosed per the fork-disclosure
rule so the auditor can see I did not silently pick the cheaper path.)*

**FORK P1 — voyage landmark tracking: index vs annotated array.**
- Options: (a) `v.waypointIndex` integer + a module-level `HOME_WAYPOINTS` array (mirrors the
  outbound `game.waypointIndex` + `WAYPOINTS`); (b) a per-voyage array of `{…, hit:false}`
  objects mutated in place.
- **Chosen: (a)** — direct sibling of the committed outbound pattern (game.js:724 advance), so
  the auditor can pattern-match it against known-good code; keeps `save()` payload small
  (index, not duplicated objects). (b) is not obviously worse, but (a) is the established
  precedent and I am choosing consistency over novelty, not effort — both are similar work.

**FORK P2 — landmark position unit: distance-fraction `at` (0→1) vs absolute `CUM`-style.**
- Options: (a) fractional `at` scaled by `v.total` at crossing-time; (b) an absolute cumulative
  distance array like outbound `CUM`.
- **Chosen: (a) fractional** — the return `v.total` is `round(TOTAL_DIST*0.62)` and events like
  `fold`/`crippling` mutate `v.distance` mid-run, so a fraction-of-total is robust to distance
  jumps where an absolute `CUM` baked at launch could desync after a fold shortcut. This is the
  more-robust choice, not the cheaper one.

**FORK P3 — anchored-event delivery: new `VOYAGE_EVENTS` entries with a landmark `cond` vs a
separate `HOME_LANDMARK_EVENTS` table.**
- Options: (a) reuse `VOYAGE_EVENTS` + a landmark-gated dispatch; (b) a separate landmark-event
  table.
- **Chosen: (a)** — reuses the committed `presentVoyageEvent`/`voyageOutcome` resolver (zero new
  resolver code, zero frozen-three risk). A separate table would duplicate resolution logic. I
  note honestly this couples landmark events into the main pool; if that proves messy at build
  time the Builder may surface (b) as a follow-up — but (a) is the correct first cut on a
  reuse-first basis, not a shortcut.

**FORK P4 — harness scope: extend `voyage_smoke.js` vs a new `test/homeleg.js`.**
- Options: (a) add landmark + winnability assertions to the existing `voyage_smoke`;
  (b) a dedicated new harness.
- **Chosen: (b) new `test/homeleg.js`** — the DoD wants a distinct, FAIL-LOUD distributional
  proof that is legible as *the AC4 evidence* and independently counted by the gate. Bolting it
  onto `voyage_smoke` would blur which harness proves winnability. Slightly more setup than (a),
  chosen for auditability, not avoided for effort.

---

## 6. WHAT THIS PLAN DELIBERATELY DOES NOT DO (scope fences)

- **No sacred-list value change without an explicit per-item Tom lock.** Default for every
  constant is byte-identical; a locked 4B (or Decision-5) change is a deliberate, documented
  sacred-odds change under Tom's explicit authorization — the one legitimate path.
- **Decision 2C (homebound trade/refuel hub) is FENCED** — it would slacken the brutal-economy
  scarcity on the crossing. Surfaced, not built, absent a scarcity lock.
- **Decision 4C (position-dependent return pacing) is PRESUMPTIVELY WITHIN the D2-1 fence** —
  CLAUDE.md's "D2-1 (void-leg pacing)" is unscoped by any committed document and the return leg
  is void-dominated. Posture: `FENCED — needs Tom`; it requires Tom's explicit fence ruling
  (outbound-only or not) before any pacing lock, not just an ordinary Decision-4 lock.
- **No frozen-three / outbound edits.** All new machinery is voyage-scoped siblings.
- **No `composeEnding` change** (golden-locked; M-INT1 territory). No focus-toggle change
  (M-INT1b territory). This phase is return-leg structure + M-INT2 constants only.

---

## 7. EXECUTION GATE (the plan is runnable only after this)

The Builder is cleared to start **M-HOME1** once **DECISION 1, 2, and 3 are locked**.
**M-HOME2** is cleared only if **DECISION 4 (and any DECISION 5 constant)** is locked to a
specific value; otherwise it is a documented no-op. **M-HOME3** always runs and produces the
GATE PASS + AC4 evidence + docs pair. Until the locks land, this plan is a decision request,
not a build order.

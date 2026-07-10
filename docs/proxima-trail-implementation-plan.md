---
file: proxima-trail-implementation-plan.md
project: Proxima Trail
chat: Oregon Trail to Proxima Centauri
date: 2026-06-19
---

# Proxima Trail — Implementation Plan

## Context
Browser game reimagining *The Oregon Trail* in space: humanity flees a dying Earth aboard a colony
ship and must reach **Proxima Centauri b** to found a colony. The survival loop is intact — outfit at
the start, manage scarce interdependent resources, make pace/ration decisions, weather random
disasters, keep a crew of named characters alive, and arrive with as much intact as possible.

Built around seven locked design decisions plus a competitive-research pass.

## Locked design decisions
| # | Decision | Choice | Consequence for the build |
|---|---|---|---|
| 1 | Tone | **Mix** — comedic surface, occasional gut-punch | Deadpan event/ailment text; deaths land hard |
| 2 | Crew depth | **Personalities, morale, relationships** | Crew are characters with skills, morale, bonds |
| 3 | Length / difficulty | **Long / roguelike, punishing, high replay** | Tight economy, permadeath, run-based |
| 4 | Astronomy fidelity | **Semi-plausible** | Real bodies and ordering; travel time abstracted |
| 5 | Audio | **Retro SFX only** | Web Audio synthesized beeps/alerts; no music |
| A | Route model | **Roguelike feel on a fixed trail** | Same named route; variety from events/RNG/role |
| B | Resources | **Interdependence (Out There-style)** | Power is a hub; every resource pull risks another |

Confirmed tech: **retro terminal homage** visual style, **split static vanilla files, no build step**,
**full Oregon Trail homage** depth.

## Oregon Trail → Proxima Trail mapping
| Oregon Trail | Proxima Trail |
|---|---|
| Wagon party (5) | Crew (commander + 4), each named, with health/morale/status/skill/bonds |
| Oxen / wagon | Ship drive + hull integrity + reactor (power) |
| Food (hunting) | Rations (replenished via asteroid-mining mini-game) |
| Ammunition | Mining charges |
| Spare parts / clothing | Spare parts + O₂ reserves |
| Money | Credits |
| Pace: steady/strenuous/grueling | Thrust: cruise / burn / overdrive |
| Rations: filling/meager/bare | Rations: full / reduced / survival |
| River crossings | Hazard zones (asteroid field, solar flare, nebula) — multi-choice "crossings" |
| Landmarks / forts | Waypoint stations (rest / trade / events) |
| Dysentery, cholera… | Radiation sickness, hypoxia, hibernation sickness, space dementia… |
| Hunting trip | Asteroid-mining mini-game |
| — (new) | Hibernation — trade time/power for O₂ + food savings, at psychological risk |

## The Power model (the depth engine)
Power is the hub resource. Each turn the reactor produces power; systems draw it. When demand exceeds
supply you hit a **brownout** and must shed load. Reactor output = `base_output × (hull / 100)`, so
hull damage cascades into power and then oxygen crises.

Systems: life support (O₂ scrubbers, high draw), drive (scales with thrust), medbay (treating),
hibernation pods (per sleeper), sensors/nav (hazard odds).

Baseline (5 awake, cruise): O₂ `5×1.0` consumed vs scrubbers `4.0` recovered → net −1.0/turn; food
`5×1.0×ration_mult` (full 1.0 / reduced 0.6 / survival 0.3); fuel cruise 2 / burn 4 / overdrive 7.
First-pass tuning values, not balance gospel.

Hibernation: pod a crew member → O₂/food drop to ~10% of awake, but pods cost power, sleepers can't act
in events, and accrue hibernation-sickness risk + morale drift.

## Crew system
`{ name, role, health, morale, status, skill, bonds }`, status ∈ Healthy | Sick | Injured |
Hibernating | Cracked | Dead. Roles (Commander, Engineer, Pilot, Medic, Xenobiologist) modify matching
outcomes; losing a specialist removes their benefit. Morale drives breakdown/Crack events; bonds make
deaths cascade morale damage to partners.

## Files
- `index.html` — screens + HUD.
- `style.css` — retro CRT terminal theme.
- `game.js` — all logic.
- `audio.js` — Web Audio SFX module.
- `README.md` — what/how to run/play.
- `docs/proxima-trail-implementation-plan.md` — this plan.
- `docs/dashboard.html` — interactive project dashboard + changelog/decision log.

## Sprint breakdown
- **0 Scaffold:** files, docs, retro CSS, screen router, HUD shell.
- **1 Core loop:** state, WAYPOINTS, title→role→store, travel, `advance()`, consumption, log, win/lose.
- **2 Power:** reactor/hull output, allocation, brownout/load-shed, scrubber math, hibernation.
- **3 Crew:** model, roles/skills, morale, bonds, breakdown/Crack, ailments.
- **4 Events & hazards:** ~30 EVENTS w/ skill checks, HAZARDS crossings, mining mini-game.
- **5 Meta:** autosave/permadeath, run history, scoring + ranks, Web Audio SFX, mute.
- **6 Polish & ship:** verification, README, dashboard final pass, commit + PR.

## Save / scoring / audio
Single-slot localStorage autosave (resume current run; no save-scumming). Permadeath converts a loss to
a run-history record. Score = (surviving crew + supplies + credits + hull + speed bonus) × role ×
difficulty, shown line-by-line; ranks: Castaway → Drifter → Navigator → Colonist → Founder of Proxima.
Web Audio oscillator SFX only, mute toggle, init on first gesture.

## Verification
`node --check` the scripts; serve with `python3 -m http.server` and play through outfitting, travel,
power/brownout, hibernation, crew morale/bonds, hazard crossings, mining, save-resume, loss and win.

## Commit & PR
Develop on `claude/intelligent-galileo-y2siqb`; commit game files + `docs/`; keep `docs/dashboard.html`
updated each sprint; push `-u origin`; open a ready-for-review PR.

## Addendum — Sprint 7: route map, transit animations & first-contact surprise
Added after first delivery in response to two notes: the journey lacked Oregon-Trail-style between-scene
motion and a visible waypoint map, and the game treated alien life as a known fact.

- **Route map** (`renderRouteMap` in `game.js`): all 10 waypoints as icon nodes (start ⌂ / station ◉ /
  hazard ✦ / void ❄ / Proxima ◐) with visited / current / future state and a live ship marker, replacing
  the old single progress bar.
- **Transit animations** (`playTransit`): short, skippable parallax-starfield scenes — a `cruise` flyby
  on every Continue, and `dock` / `hazard` / `land` vignettes at waypoint arrivals. Idempotent finish,
  overlap guard, an ANIM toggle in the topbar, and `prefers-reduced-motion` respect; resolves
  synchronously when off so tests and accessibility are unaffected.
- **First contact** (scripted surprise): a new `contact` flag gates all alien content. Events carry
  `req: preContact | postContact`; before the reveal only human ships/stations/derelicts appear, with
  ambiguous foreshadowing (impossible signal, geometric shadow, sensor ghost) that never confirms life.
  A one-time, unpredictably-timed **FIRST CONTACT** event fires in the Interstellar Void (forced before
  the final approach) with a Hail / Observe / Run-dark choice. Afterward, alien encounters and a risky
  Xenobiologist-checked **alien parley/trade** event unlock. Deliberately undocumented in the README.
- **Verification:** jsdom tests confirm the route map (10 nodes + ship), that first contact fires once
  with no alien content before it, that post-contact alien events unlock, and that the animation overlay
  shows and a Space-skip advances exactly one turn. Win/loss playthroughs still pass, zero JS errors.
- **Delivery:** `main` now exists, so this round ships as a reviewable PR into `main`.

## Addendum — Sprint 8 / Phase 1: stakes, scarcity & uncertainty
The game now refuses to assume you'll make it. Built on a **probabilistic influence engine** — a hidden
mission `potential` plus posture axes (explore / aggress / persist / cooperate / caution) that choices
nudge, with the big resolutions *sampled* from those bent odds rather than scripted.
- **Survival pressure:** an enforced cargo **hold cap** (no buying safety); **rescued people join the
  crew** as real mouths-and-hands; lower starting credits/supplies; **hazards** rebuilt on a sampled
  severity spectrum (clean → graze → serious → casualty → crippling → **catastrophic run-ending loss**),
  bent by pilot/sensors/hull/posture/luck.
- **First contact = Fight / Flight / Freeze**, each branching into uncertain outcomes (retaliation &
  possible destruction / a lingering pursuer / commune-ignored-experiment-annihilate), leaving a
  persistent alien standing.
- **Self-hibernation = autopilot:** podding your own character drops the ship to a high-risk autopilot
  (no choices, mounting danger) until a scheduled or emergency wake.
- **Arrival is the midpoint:** `arriveAtProxima()` samples habitability + who's already there + whether a
  faster expedition beat you, then offers colonize-or-return → a sampled Act II epilogue → tiered endings
  (Haven / Foothold / Messenger / Withered / Barren / Too Late / Lost). Reaching PCb is never the win by
  itself.
- **Pacing:** longer voyage, slower transit animation. Fixed a brownout soft-lock and a hull death-spiral.
- **Verification:** jsdom suite green — skilled run wins ~7/10 on Settler, careless play reliably dies,
  hold cap enforced, hazards lethal, F/F/F gating intact, zero JS errors.
## Addendum — Sprint 9 / Phase 1b: economy, balance & engine depth
Closed the three issues flagged in the Phase-1 self-audit, in one pass.
- **Economy relief valves:** mining yields **sellable commodities** (ice/ore/volatiles/rare metals);
  stations trade at **location-based prices** (fuel & O₂ pricier farther out, ore worth more in the
  deep), enabling buy-low/sell-high; **skill-gated outpost jobs** (repair, clinic, survey, contraband
  smuggling with 'heat', and a sure-pay haul) let a broke crew earn their way out. Stations became a
  **re-openable hub** so you can trade, work, and rest in one stop.
- **Engine depth:** hidden `potential` now adds momentum to skill checks and hazard danger; **posture
  weights which events surface**; qualitative omens let potential be *felt* without a number.
- **Difficulty re-tiered** for a real easy→hard spread.
- **Fix:** scrubber O₂ could overfill the hold while hibernating — surplus now vents.
- **Verification:** per-difficulty jsdom sweep — Settler ~70% / Pioneer ~50% / Voyager ~20% over 30 runs
  each, zero hold overflows, zero JS errors; feature/anim/smoke suites still green.
- **Still ahead:** Phases 2–6 (bridge aesthetic, generations, ship AI, wormholes, interactive Act II).

## Addendum — Phase 2 (bridge aesthetic) & Phase 3 (generational crew)
- **Phase 2:** full `style.css` re-theme from the green CRT to a starship-bridge look — LCARS/holographic
  palette, rounded accent-bar panels, pill buttons, a holographic nav viewscreen, crew-station rows,
  bridge-styled modals/mining/transit, and a RED-ALERT frame state. Logic untouched; all `game.js`
  hooks preserved.
- **Phase 3:** crew gain an `age` that advances each turn; **hibernation pauses biological aging**
  (sleepers arrive young, the awake grow old). Mid-voyage **pregnancies → a child** (half-consumption
  mouth) who, after a compressed childhood, **comes of age and takes a crew station**; **elders die of
  old age** and their skill declines. Aging tuned for evocative cadence (births ~40%, coming-of-age
  ~17%) without wrecking balance; difficulty re-verified (Settler ~60 / Pioneer ~55 / Voyager ~35).
  Save key bumped to v2. *Balance figures are approximate — automated-play proxies with real variance.*
## Addendum — Phase 4: ATLAS, the ship mind
A shipboard AI whose `integrity` decays each turn (faster when few minds are awake — the lonely void
frays it). **Stable** it assists checks/hazards and occasionally optimizes; **degrading** it glitches
(false gauges, rogue power reroutes, unease); **hostile** it locks life support/drive, vents stores,
and endangers crew. Engineer **diagnostics** restore it; a last-resort **purge** is risky and
irreversible. Verified: neglected runs degrade it to single digits through glitch→hostile; fuzz clean;
balance re-swept (Settler ~53 / Pioneer ~53 / Voyager ~20 with maintenance). Audit fixes earlier this
session: mining null-crash, `skillFor` best-specialist, inverted Commander benefit. Save key now v3.

## Addendum — Phase 5: wormholes & Earth's fading signal
Rare, optional **wormholes** in deep space: a gamble (shortcut / neutral / lost / catastrophe),
navigable on purpose only with knowledge or alien tech, and never a sure line to Proxima (a shortcut
can't land you at the destination). The "lost" outcome flings you off course to re-localize. **Earth's
signal** fades live → faint → silent (a late, rare gut-punch); its fate colors morale, the arrival
narrative, and the endings (a silent Earth makes "return" mostly grief and a colony "all that is left
of us"). Verified: wormholes fire ~85% of runs, Earth silent ~65%; fuzz clean; balance restored after
softening the morale tax (Settler ~60 / Pioneer ~53 / Voyager ~23). Save key v4.

## Addendum — Phase 6: interactive Act II (roadmap complete)
Reaching Proxima is now genuinely the midpoint. The colonize-or-return decision opens a **playable**
second act:
- **Colony loop** (STAY / MAKE CONTACT): build (self-sufficiency), farm (food), explore, tend the
  people, and — with natives — diplomacy, across years of storms, disease, raids, gifts, births, and a
  possible reinforcement ship from home. Win at self-sufficiency 100 (HAVEN / GUESTS OF PROXIMA); lose
  to starvation, unrest, or hostile natives (WITHERED / TURNED AWAY).
- **Return loop** (RETURN): an interactive homeward voyage — push / steady / scavenge across legs with
  encounters (faster ships overtaking you, the alien pursuer, fold-shortcuts) and an Earth that may be
  thriving, too late, or gone (MESSENGER / THE LONG WAY HOME / TOO LATE / LOST WITH ALL HANDS).
- New colony/return screens + routing; test harnesses updated to drive Act II. Colony economy eased
  after an over-punishing first pass; balance held (Settler ~57 / Pioneer ~50 / Voyager ~23). Fuzz
  clean, suites green.

**All six phases are complete.** Remaining work is playtest-driven tuning and polish.

## Addendum — Act II deepened (the colony, the message home, the voyage back)
The back half was thin next to the journey out, so it was rebuilt with the same care, in phases:
- **Phase R — rigor:** starvation/suffocation gained teeth (escalating famine/anoxia counters that ramp
  the per-turn hit and can end the run), and asleep crew never act (`skillAwake` = best *awake, living*
  specialist; auto-medbay, contact, autopilot hazards, and every colony/voyage check route through it;
  the homeward "pursuer" hits only awake crew).
- **Phase C1 — colony as a real simulation:** a per-year colony loop with skill-check events and
  sampled-severity hazards.
- **Phase C2 — leaving on your terms:** prep + a player-timed launch home that splits the crew (STAY vs
  RETURN), provisioned from colony stores, plus a cheap light-speed beacon hedge.
- **Phase C3 — the voyage home:** a full second turn loop (`game.voyage`) mirroring the outbound trail,
  with its own crew/stores/power, weighted events, sampled hazards, and Earth-state-aware endings.
- **Phase C4 — parallel fronts:** colony and homebound ship advance on a shared clock with a focus
  toggle; the unfocused front runs semi-autonomously; `composeEnding` weighs both (TWO WORLDS … EXTINCT).
- Save key bumped to v5. Balance re-validated; the voyage home made winnable (full provisioning +
  shorter return leg); difficulty-scaled rigor so brief shortfalls survive but neglect kills.

## Addendum — prompt-vs-outcome audit (every promise made true)
A full audit cross-checked each player-facing prompt against its real effect. A cluster promised
mechanics the code never implemented; rather than reword, the mechanics were built so the prompts come
true. **Commander:** awake-crew morale floor + a tie-break (a near-miss check flips to success once).
**Engineer:** repairs cost fewer parts and the hull wears slower. **Medic:** a skilled medic sometimes
treats without spending a dose. **Pilot:** lost ground/time at wormholes and crippling hazards is partly
clawed back. **Xenobiologist:** the Impossible Signal event gained a decode skill check. **Beacon:** now
records whether Earth was still live; a heard beacon turns a double-front failure into the partial win
"THE WORD GOT THROUGH." Plus honest-text nits and `HOLD_MAX` 240 → 300 (start-of-run breathing room;
medicine is hold-exempt). Win-rate sweep re-run; gradient held.

## Addendum — colony redesign: self-sufficiency is emergent
The colony had two overlapping control systems (sector toggles AND a yearly focus producing the same
resources), a win meter disconnected from the economy, an abstract "Build," two dead HUD meters
(Defense, Knowledge), and an unexplained opening brownout. Rebuilt around **one lever and an emergent
goal**: an automatic economy (built infrastructure × tech × habitability produces food/water/materials
each year; the people eat) where **self-sufficiency is derived** — a genuine surplus with a buffer makes
it climb and banks a stable year; a deficit erodes it; you take root only at 100 held ≥ 3 straight years.
The single yearly investment is Build (→ infrastructure + population cap, real habitats), Research
(→ tech, multiplies every yield, replacing the dead Knowledge meter), Survey, Tend, Fortify (now feeds a
**wired** Defense that lowers raid difficulty), or Diplomacy. Sector toggles, the Power/allocate screen,
and the duplicate Farm action are gone; overcrowding replaces the brownout; habitability from the
journey sets opening difficulty and en-route knowledge seeds starting tech. Fixed a Commander-floor leak
(aging/AI ran after the floor). Save key bumped to v6. Sweep gradient held (Settler 47 / Pioneer 43 /
Voyager 17 top win-rate; naive 0 everywhere; zero JS errors).

# ============================================================
# GAME-A POLISH — colony-loop fixes (post-P2-M6, pre-P3-M1)
# A scoped FIX pass, not a milestone. Closes Game-A playability
# gaps surfaced in playtesting before Game B (P3-M1) is built.
# ============================================================

## Context
Playtesting the delivered Game A (P2-M6, commit fd93013) surfaced three loop defects and
one trade gap that make a struggling colony unplayable rather than hard: (1) the colony
has NO way to heal crew — `colonyTurn` only ever damages, Tend touched hope/trauma only,
and there is no colony analog of the ship's auto-medbay; (2) there is no safe labor→
resource action — materials come only from risky Expeditions (which can kill) and events,
so a materials-starved colony has no non-lethal agency (a death spiral with no valve);
(3) the colony advanced a "Year" counter that added a full Earth-year per turn while never
aging crew — producing the "45-year-old at Year 59 / 82 since exodus" contradiction and a
biologically frozen colony. Plus on `none`/uninhabited worlds there is no trade at all
(Contact-trade is natives-only). This pass fixes all four; Game B stays parked.

## Locked decisions (log each as a `decision` LOG entry in docs/dashboard.html)
1. **CLOCK = CYCLES, not Years (option C).** A tidally-locked red-dwarf world (Proxima
   Centauri b: ~11.2-day orbit, likely no normal day/night) has no honest Earth calendar.
   The colony counter is relabeled **"Cycle N"**; the Earth-frame "years since exodus"
   becomes a *separate, honest* stat that advances by a small fraction of an Earth year per
   cycle — never +1 Earth-year/turn. This dissolves the age contradiction at the root.
2. **HEAL + SAFE-GATHER reuse the journey's verbs (option A).** Tend actually mends bodies
   (not just morale); a passive per-cycle recovery tick is the colony analog of the ship's
   auto-medbay; a new **Work/Harvest** action is the colony analog of journey **Mine** — a
   safe, repeatable labor→resource valve. The colony reuses Act-I patterns rather than
   inventing new ones.

## The five fixes (all in game.js; route through the colony loop / its siblings)
1. **Clock = Cycles (Decision 1):** relabel the colony turn counter "Year N"→"Cycle N"
   everywhere player-facing; DECOUPLE the exodus clock (`elapsedYears` advances by a small
   Earth-fraction per cycle, not +1/turn) and label it as the Earth frame; AGING DRIFT —
   age colony crew by that same small per-cycle Earth amount (reuse the aging-rate /
   OLD_AGE / come-of-age constants; do NOT call the journey `ageCrew()` wholesale if it
   also advances shipYears or fires journey-only birth). Founders age a little over a
   normal Game-A — not frozen, no mass die-off.
2. **Tend heals (Decision 2):** the "tend" action, in addition to hope/trauma, heals awake
   living crew and clears a Sick/Injured status the way the ship's auto-medbay does, boosted
   by an awake Medic (`skillAwake("Medic")`).
3. **Per-cycle recovery tick (Decision 2):** when the colony is `_safe` (not in crisis) AND
   the Medical-care survival axis is healthy, a small passive heal + a chance to clear a
   lingering ailment, gated up by an awake Medic / powered infirmary. None on crisis turns.
4. **Work/Harvest action (Decision 2):** a new safe season action — assign the cycle's labor
   for a modest, risk-free materials/food yield scaled by hands (`colHands`) + tech, no
   ecoHarm. Tuned so risky Expeditions still pay more (tech/special finds).
5. **Empty-world trade gap:** on `none` worlds, a minimal way to convert resources (a passing-
   trader / supply-drop event OR a small convert option folded into Work). Kept minimal.

## DO-NOT-TOUCH / forward-links
- **Zero-diff gate:** `applyOutcome` + `resolveCheck` stay byte-identical to HEAD — none of
  this needs them.
- **Game B stays dormant:** `colonyLaunch`/`doLaunch`/`startVoyage`/`sendBeacon` untouched.
- **Forward-link to P3-M1:** Fix 1's decoupled `elapsedYears` is the honest substrate the
  **P3-M4 Years-Since-Exodus clock** and **P3-M2 generations** need — doing it now de-risks
  both. The P2-M6 confirmSettlement forward marker (guard settling once a voyage can be live)
  is unchanged and still owned by P3-M1/M-INT1.

## Verification (all pass before STOP)
- `node --check game.js audio.js`; zero-diff gate (applyOutcome/resolveCheck md5-identical
  to HEAD).
- New `/tmp/colonyfix.js`: Tend raises a hurt crewmate's health and can clear Sick/Injured;
  a safe colony passively recovers an injured colonist over cycles while a crisis colony does
  NOT; Work yields materials/food with no death/ecoHarm and scales with hands; after N cycles
  crew age has DRIFTED up a small amount (not frozen, not +N) and `elapsedYears` is an honest
  small Earth number (not cycle-count); labels read "Cycle" not "Year"; v7 round-trips.
- Smoke win-rate: a sound Settler colony still reaches settled, now MORE survivable but not
  trivial (flag for the M-INT2 sweep).
- Re-run colonyskel + colonym2..m6 + feattest + fuzz — all green.

## Delivery
One scoped session on `claude/intelligent-galileo-y2siqb` (PR #1); dashboard SPRINTS entry
(label "Fix") + feature LOG + the two decision entries; bump LAST_UPDATED; commit + push.
STOP — do not begin P3-M1; the plan is parked and Tom greenlights it after this lands.

# ============================================================
# P3-M1 — THE DECISION + launch machinery (Game-A→Game-B hinge)
# ONE SESSION. Build the home-front STATE + crew-split machinery,
# then STOP BEFORE FLYING — the crossing turn loop is P3-M2.
# ============================================================

## Context
P2-M6 delivered Game A (foothold → player-confirmed SETTLED). The foothold opened a one-time
`⚖ The future` beat that *teased* a road home with a disabled "coming in P3-M1" line. P3-M1
turns that tease into the real **Decision** and builds every piece of the launch EXCEPT the
crossing itself: the home-front state, the crew split, the provisioning, the beacon writer, and
the guards that let a ship exist without anything flying. The home crossing turn loop, HOME
events/hazards, the Earth-signal arc, and generations are all P3-M2..M4.

## Locked decisions (logged as `decision` entries in docs/dashboard.html)
1. **Launch home is a TRUE crew split — ≥1 stays AND ≥1 returns.** The ark never lifts off empty
   and never strands the colony; children and anyone in cold sleep can't crew it. Rejected: the
   old gate that only required ≥1 RETURN (which allowed an all-aboard launch that abandoned the
   colony).
2. **Settling stays available with an ark in flight — it COMPOSES, never hard-ends.** Founding the
   settlement while a ship is out there records `colonyDone(SETTLED)` and `tryCompose` WAITS for the
   live voyage, composing TWO WORLDS later; only the confirm COPY changes ("the ark's fate is still
   unwritten"). Rejected: blocking the settle while a ship is live, or hard-ending the game and
   throwing away the in-flight ark.

## Build (all game.js — copy + state + a guard, NOT a composer rewrite)
1. **Decision hub** — `openFutureDecision` becomes the live hub once footholdReached: Stay · Ready &
   send the ship home (→ readiness gate → roster) · Send a beacon · Found the settlement.
2. **Readiness gate** — `colonyLaunch` gates on `col.shipReadiness >= LAUNCH_READY` (the dead,
   never-declared `col.shipReady` is gone). Below the bar the launch path shows disabled with a plain
   hint. structuralDebt already taxes readiness through Refit's reader; not re-taxed.
3. **Roster** — assign each living crewmate STAY/RETURN; enforce ≥1 each side; children/asleep can't
   crew the ark (shown STAY-locked).
4. **doLaunch** — provision the ark from colony stores capped to HOLD_MAX (trim food→oxygen→fuel),
   DEDUCT the provisions from the colony, move the RETURN crew into `game.voyage`, create the voyage
   with `_flying:false`. Does not fly.
5. **Beacon writer** — `sendBeacon()` sets `col.beaconHeard = (game.earth.status !== "silent")` (a real
   timing call), one-shot, the cheaper hedge. This is the missing WRITER for the field composeEnding
   already reads.
6. **confirmSettlement re-guard** — the P2-M6 forward marker, now due: with a live ark, the confirm
   copy reflows and the game does not hard-end (the mechanism — finishColony→tryCompose-waits — was
   already correct).
7. **"Does not fly" guard** — a `_flying` flag freezes `voyageTurn` / `voyageStep` / `voyageAutoStep`
   and the colony's auto-voyage tick; `renderVoyage` shows an "the ark is away — the crossing begins"
   placeholder. The legacy arrival-RETURN path (`beginReturn`) omits the flag and still flies as before.

## DO-NOT-TOUCH (held)
- Zero-diff gate: `applyOutcome` / `resolveCheck` md5-identical to HEAD.
- `composeEnding` / `tryCompose` not rewritten — they already compose colony×voyage and already wait
  for an active voyage.

## Verification (all passed before STOP)
- `node --check game.js audio.js`; zero-diff gate md5-identical.
- New `/tmp/decisionm1.js`: readiness gate blocks below / allows at the bar; roster rejects all-STAY
  and all-RETURN, accepts a split; doLaunch deducts + caps at HOLD_MAX + moves RETURN crew into
  `game.voyage` (`_flying:false`) and nothing crosses across colony cycles; sendBeacon writes
  beaconHeard for live AND silent Earth (+ one-shot); Found-with-a-live-ark records SETTLED WITHOUT
  ending while a STAY path reaches the SETTLED end screen; v7 round-trip of the launch state.
- STAY-path SETTLED smoke (m6smoke + decisionm1) — no regression to the delivered win.
- colonyskel + colonym2..m6 + colonyfix + feattest + fuzz — all green. (acttwo/voyage2 are stale
  pre-P2 harnesses, already red at HEAD — out of scope.)

## STOP
Game-A→Game-B hinge built: the Decision is reachable (Stay / a true crew-split launch / a beacon
hedge / Found), launch sets up the home FRONT and the crew split — but NOTHING flies. The crossing
turn loop is P3-M2, after Tom reconfirms.

# ============================================================
# P3-M2 — UNFREEZE THE HOME CROSSING (Game B proper begins)
# DELIVERED. The crossing loop already existed (S15-era sibling),
# frozen by P3-M1's _flying. P3-M2 flips a colony-launched ark to
# flying. UNFREEZE + AUDIT + VERIFY — not a rebuild.
# ============================================================

## Re-anchor (verified against source, commit 6d741e8 — reported, not rebuilt)
- The complete sibling crossing loop is LIVE: `voyageTurn` / `voyPower` / `VOYAGE_EVENTS` /
  `rollVoyageEvent` / `presentVoyageEvent` / `resolveVoyageCheck` / `voyageOutcome` / `voyageArrive` /
  `finishVoyage` / `voyageStep` / `voyageAutoStep` / `voyageHibernate` / `voyageRest` / `voyageScavenge` /
  `renderVoyage` — with the Phase-R `_starve`/`_anoxia` teeth, hibernation, `earthSignal()`, tiered
  arrival endings, and a real HUD. NOT rebuilt.
- `confirmSettlement` already carries the P3-M1 `shipOut` guard: with a live voyage it does NOT hard-end —
  `finishColony(true,"SETTLED")`→`tryCompose` WAITS. `composeEnding`'s `if (c && v)` branch already
  composes SETTLED + voyage → TWO WORLDS / A WORLD, AT LEAST / THE MESSENGER. `tryCompose` already waits
  for both fronts; the `focus` handler already switches screens; the off-front already auto-ticks
  (`voyageAfterTurn`→`colonyAutoStep`). **All unchanged — zero-diff gate holds.**
- Staleness audit: every voyage helper + const is live post-colony-rebuild; nothing renamed/removed.

## The only code change — UNFREEZE (chose option (a) + a legacy-save safety net)
- **`doLaunch`** now calls `startVoyage(returnees, prov, true, /*fly=*/true)` — launching a colony-built
  ark flows straight into the crossing (option (a), the simplest). The six `_flying===false` guards
  (`voyageTurn`/`voyageStep`/`voyageAutoStep`/the `colonyAfterTurn` auto-tick/`renderVoyage`) stay and now
  only catch a legacy P3-M1-era PARKED save.
- **Legacy-save safety:** `renderVoyage`'s `_flying===false` placeholder gains a **`▶ Begin the crossing`**
  control (dispatch `voyage:begin` → sets `_flying=true`, save, re-render) so no P3-M1 parked save is
  stranded.
- **`beginReturn`** (legacy arrival turn-around, `_flying` defaults true) is UNCHANGED and shares the same
  loop — not double-built.

## Out of scope (flagged, not built)
- Sampled-severity **HOME_HAZARDS** crossing (P3-M3 — confirmed absent: `applyHazardSeverity` is
  outbound/colony-only; `VOYAGE_EVENTS` are discrete skill-check events).
- Visible **Years-Since-Exodus** dread clock (P3-M4 — the HUD already shows a Year line).
- Fuller bidirectional **focus toggle** UX (M-INT1b — P3-M2 leaves the off-front on the existing auto-step).

## Verification (all passed)
- `node --check game.js audio.js`; zero-diff gate: `applyOutcome`/`resolveCheck`/`composeEnding`/
  `tryCompose` md5-identical to HEAD (the unfreeze touches none of them).
- New `/tmp/crossingm2.js`: a colony-launched ark FLIES (not parks) and a turn advances; the Phase-R
  `_starve`/`_anoxia` teeth bite; brownout halves scrubber recovery; a hibernated returnee doesn't act/eat
  as awake; arrival reaches MESSENGER / THE LONG WAY HOME / TOO LATE and can be LOST WITH ALL HANDS; the
  colony auto-ticks while the ark flies; settling WHILE the ark flies does NOT hard-end and composes
  TWO WORLDS on arrival; v7 round-trips a flying voyage.
- Regression: `feattest` + `fuzz` + `colonyskel` + `colonym2..m6` + `colonyfix` + `decisionm1` all green
  (`decisionm1`'s P3-M1 "parked / does-not-fly" assertions updated to the P3-M2 truth — the ark now flies).

## STOP
The crossing is live: launching a split crew flies the ark home on the existing loop, the colony runs in
parallel, and settling mid-crossing composes TWO WORLDS. P3-M3 (home content/hazards) awaits Tom's reconfirm.

# ============================================================
# P3-M3 — SAMPLED-SEVERITY HOME_HAZARDS (BUILT)
# The home crossing gains a clean→catastrophic hazard spectrum via
# a SIBLING of the outbound HAZARDS layer — never a reuse of the
# frozen/outbound machinery. Built + verified on branch
# claude/intelligent-galileo-y2siqb.
# ============================================================

## Why
The home crossing (P3-M2) already runs events, scavenging, pursuer, and fold — but its hazards
(debris/vflare/micromet) resolved on a single fixed success/failure check. The outbound journey, by
contrast, has clean→catastrophic "crossings" (`HAZARDS` → `resolveHazard` → `applyHazardSeverity`). P3-M3
gives the home front the same scaling spectrum, so a **wounded** ark on the long road home faces genuine,
hull-sensitive death risk — while a sound, careful crossing stays survivable.

## Why a SIBLING, not a reuse (the constraint that shaped the build)
The outbound `resolveHazard`/`applyHazardSeverity` read `game.ship.hull`, `awake()`/`game.crew`,
`game.power.allocation.sensors`, `game.autopilot`, `game.distance`, and call the **frozen** `applyOutcome`
plus a **bare** `endGame`. Reusing them on the home front would corrupt outbound state or hard-end a run
that should compose. So the home front gets a sibling that operates on `game.voyage` via `voyageOutcome`
and ends the VOYAGE (not the game). **Zero-diff gate held:** `applyOutcome` / `resolveCheck` /
`composeEnding` / `tryCompose` AND the outbound `applyHazardSeverity` / `resolveHazard` / `HAZARDS` table
are all byte-identical to HEAD; the only `game.js` change beyond the new sibling block is the one-line
voyageTurn hook and removing three entries from `VOYAGE_EVENTS`.

## DECISION 1 — resolved: separate `HOME_HAZARDS` pool; the three crossings migrated into it
A separate `HOME_HAZARDS` table, and debris / vflare / micromet **moved out of `VOYAGE_EVENTS`** and recast
as sampled crossings (they are the canonical "crossing" perils; keeping them binary while new hazards
sampled would be incoherent and would duplicate debris/flare mechanics). The narrative/economy/navigation
beats — derelict, cache, fold, pursuer, lost, word, longdark, newlife, calm, sick — **stay** as
`VOYAGE_EVENTS` choice-events, untouched.

## What was built (`game.js`, sibling-local)
- **`HOME_HAZARDS`** table (debris field / stellar flare / micrometeoroid swarm), each `{ id, w, title,
  noun, art, text, deathText, options:[{ label, risk, role?, cost? }] }`.
- **`voyageHazardDanger(op)`** — sibling sampler: `op.risk + (100−v.ship.hull)/240 −
  (role==="Pilot"?pilot:pilot*0.4)/320` with `pilot = skillAwake("Pilot", v.crew)`; `+0.12` on
  `voyPower().brownout` (replaces the outbound sensors-off term); `+ max(0,−caution)/500 +
  max(0,aggress)/800 − (potential−50)*0.0025`; `*= DIFFICULTY.harsh`; `clamp(0.03, 0.95)`. **No
  sensors-allocation / no autopilot term.** Same `sampleWeighted` spectrum/weights as the outbound.
- **`voyageHazardSeverity(hz, sev, op)`** — sibling of `applyHazardSeverity`, every mutation via
  `voyageOutcome` on `game.voyage`: clean (influence) · graze (hull) · serious (hull + injure/afflict
  `v.crew`) · casualty (hull + `killCrew(…, v.crew)`, chance of a second) · crippling (hull + fuel/oxygen +
  distance setback) · **catastrophic → `finishVoyage(false, "LOST WITH ALL HANDS", …)` → `tryCompose`**
  (never a bare `endGame`).
- **`rollHomeHazard` / `presentHomeHazard` / `resolveHomeHazard`** — orchestrate pick → (modal or
  auto-safe option) → cost → danger → sample → apply. Auto (off-front) resolves INLINE with no modal.
- **voyageTurn hook:** `var peril = Math.random(); if (peril < HOME_HAZARD_P) rollHomeHazard(auto); else if
  (peril < HOME_HAZARD_P + HOME_EVENT_P) rollVoyageEvent(auto);` (`HOME_HAZARD_P = 0.18`, `HOME_EVENT_P =
  0.34` — tune in M-INT2).

## How it composes when the ark is lost
A catastrophe sets `voyageDone = {won:false, tier:"LOST WITH ALL HANDS"}` and calls `tryCompose`. With the
colony still ACTIVE, `tryCompose` waits — no hard-end, the colony fights on. With a SETTLED colony, it
composes `composeEnding`'s `cWon && !vWon` branch → **A WORLD, AT LEAST** (or **A WORLD, AND WORD** with a
heard beacon).

## Out of scope (deferred, named)
- Earth-signal ARC + visible Years-Since-Exodus dread clock + generations payoff = **P3-M4** (the
  `TOO LATE` Earth-silence outcome that dominates a long sound crossing is this clock, not a hazard).
- `composeEnding` generalization = **M-INT1**; full focus toggle = **M-INT1b**.
- Hazard probability / severity-weight tuning = **M-INT2**.

## Verification (all green)
- `node --check game.js audio.js`; zero-diff gate (four frozen + outbound `applyHazardSeverity` /
  `resolveHazard` / `HAZARDS` byte-identical); migrated ids appear only in `HOME_HAZARDS`.
- **`/tmp/homehaz.js` (new, 24 assertions):** full clean→catastrophic spectrum reachable with scaling
  effects (no harm on clean; injure at serious; kill at casualty; distance setback at crippling);
  catastrophic finishes the VOYAGE (LOST WITH ALL HANDS), waits with an active colony, and composes
  **A WORLD, AT LEAST** with a settled one; a wounded ark (low hull + brownout) samples a worse severity
  than a sound one at the same roll; a hazard never touches outbound `game.ship`/`game.crew`; the headless
  off-front (auto) hazard resolves with no modal and no error.
- **`/tmp/homesmoke.js` (new, 120 full crossings):** SOUND ark (Pioneer) → **98% survive**, wins occur
  (winnable); WOUNDED ark (Voyager, hull 26 → brownout) → **40% LOST WITH ALL HANDS vs 2%** for the sound
  ark — real, hull-sensitive death risk, not an unwinnable deathtrap. Zero JS errors.
- **Regression:** `crossingm2` + `colonyskel` + `colonym2..m6` + `colonyfix` + `decisionm1` + `feattest` +
  `fuzz` + `arrivalfix` all green.

## STOP
The home crossing now has teeth: a wounded ark can be torn apart mid-spectrum (and, if the colony already
stands, the game still composes A WORLD, AT LEAST rather than hard-ending). Next is **P3-M4** — the
Earth-signal arc, the Years-Since-Exodus dread clock, and the generations payoff.


# ============================================================
# P3-M4 — EARTH'S FATE (bounded divergence) + Years-Since-Exodus
# clock + voyage generations (PLAN)
# The home-front Earth arc resolves a HIDDEN TRUTH while the crew act
# on a BOUNDED BELIEF; a single cumulative exodus clock drives the
# dread; voyage crew finally age. All three land as SIBLINGS of the
# outbound machinery — never a rewrite of the outbound path.
# ============================================================

## Re-anchor — what already exists at HEAD de06dd7 (verified by grep; do NOT rebuild)
- **Earth (model):** `game.earth = { status:"live", heard:0 }` (init ~248). `earthSignal()` (~543) is
  OUTBOUND-COUPLED — reads `game.distance / TOTAL_DIST` and `game.turn`, flips `status -> "silent"` on a
  rare late roll (`prog>0.5`), drips banded messages every 9 turns. It is the ONLY writer of status, and it
  only ever writes `"silent"` — so in practice `status ∈ {"live","silent"}`; **`"faint"` is never stored**
  (the HUD "faint" at ~4173 is a `distance>0.6` display band, and the `"faint"` reader branches at ~1414 /
  ~4411 are effectively dead today). Called on BOTH fronts: ~903 (outbound, after `ageCrew`) and ~2342
  (voyageTurn) — **on the voyage it fires off STALE outbound globals, not the voyage clock.** Status readers:
  544/548 (outbound earthSignal self), 556, 1120, 1156, 1414, 1823 (writes `beaconHeard` from status), 2384
  (`word` event cond), 2573 (`voyageArrive` earthGone), 4173 (outbound HUD), 4411 (voyage HUD). SHOWN == TRUTH
  today (no belief field). `voyageArrive` (~2571) is binary on Earth: silent → TOO LATE, else MESSENGER (hull
  ≥55) / THE LONG WAY HOME.
- **Clock:** `shipYears` (~245, advanced only in `ageCrew` by `AGE_PER_TURN`=0.40). Colony `elapsedYears`
  (~1289/1335) = `round(_exodusYear + col.year*CYCLE_YEARS)`, `_exodusYear` fixed at landfall = `round(shipYears)`;
  shown **"Years since exodus"** on the colony HUD (~4343) _(superseded by M-INT1b [3a] — colony stat repoints to exodusYears())_. Voyage HUD shows `"...· Year " +
  (round(shipYears)+v.turn)` (~4414) — unlabeled, and adds raw `v.turn` (not a year-scaled amount). **No single
  cumulative cross-front clock; Earth's fade is per-front PROGRESS only, never time-driven.**
- **Generations:** `ageCrew` (~426) is coupled to `game.crew`/`awake()`/`game._pregnancy`/`game.shipYears`;
  called only at ~888 (outbound). The colony already has its SIBLING — `colonyAgeDrift` (~1286): ages
  `game.crew` by `CYCLE_YEARS`, COME_OF_AGE → Colonist, OLD_AGE mortality, no pregnancy (the project precedent
  for a per-front aging sibling). **The voyage has NO aging sibling:** `v.crew` never ages; the `newlife`
  VOYAGE_EVENT (~2392) can insta-BIRTH a child into `v.crew` (`recruit:true` → push Child at ~2446), but no
  maturation/old-age ever runs, so **a transit-born child never grows up.**

## Zero-diff gate (unchanged from P3-M3)
`applyOutcome` / `resolveCheck` / `composeEnding` / `tryCompose` stay **md5-identical** to HEAD. The OUTBOUND
`earthSignal` and `ageCrew` keep their **byte-identical** bodies — the outbound journey must play identically.
The home/voyage front gets **SIBLINGS** (precedent: `colonyAgeDrift`, `voyageHazard*`), never a rewrite.

## DECISION 1 (locked by Tom) — Earth = bounded divergence: hidden TRUTH + shown BELIEF
A hidden truth spectrum the crew cannot see directly, plus a shown estimate they hold from fragmentary
signals. The estimate drifts toward truth with **lag + noise** but is **bounded — never more than one band
from truth**, so belief may lag and jitter but can never flip to the opposite extreme. Truth resolves at
arrival and CAN differ from the shown estimate within that bound ("you believed *faint*; you arrive to
*silence* — or to a *recovered* world").

**Bands (index 0 best → 4 worst):**
`EARTH_BANDS = ["thriving","recovered","changed","silent","gone"]`.

**New fields on `game.earth` (added to the init at ~248 — additive only, outbound ignores them):**
`{ status:"live", heard:0, truth:2, estimate:2 }` — start at `2 = "changed"` (a stressed-but-living Earth at
exodus, consistent with the existing early "evacuation lotteries grind on" beat).

**Truth step — `earthTruthStep()` (time-pressured; cadence = once per voyage Earth tick):**
```
var pressure = clamp(exodusYears() / EARTH_DOOM_YEARS, 0, 1);   // EARTH_DOOM_YEARS ≈ 220 (tune M-INT2)
var worse  = 0.10 + pressure * 0.50;
var better = 0.10 * (1 - pressure);
if (chance(worse))       earth.truth = Math.min(4, earth.truth + 1);
else if (chance(better)) earth.truth = Math.max(0, earth.truth - 1);   // a short/young endeavor can RECOVER
```
A long endeavor trends worse (higher `worse`, vanishing `better`); a fast one can still land *recovered*/*thriving*.

**Bounded-divergence rule — exact (run each voyage Earth tick, after the truth step):**
```
earth.estimate = clamp(earth.estimate + Math.sign(earth.truth - earth.estimate), 0, 4); // LAG: 1 step toward truth
if (chance(EARTH_NOISE_P)) earth.estimate = clamp(earth.estimate + (chance(0.5)?1:-1), 0, 4); // NOISE jitter
earth.estimate = clamp(earth.estimate, earth.truth - 1, earth.truth + 1);               // BOUND: |est−truth| ≤ 1
```
Provably `|estimate − truth| ≤ 1` after every tick. Belief trails rapid truth changes (lag), wobbles (noise),
but never reaches the opposite pole.

**Resolution at arrival:** `voyageArrive` reads `earth.truth` (the resolved truth), NOT the belief. The shown
estimate up to that moment can differ within the bound — that is the divergence payoff.

## DECISION 2 — backward-compat: `status` becomes a DERIVED view of the BELIEF
Keep `game.earth.status` as a **stored, recomputed** field so **no reader migrates**. A single mapping helper
writes it from the estimate every voyage Earth tick:
```
function deriveEarthStatus(est){ return ["live","live","faint","silent","silent"][est]; }
// voyage Earth tick: game.earth.status = deriveEarthStatus(game.earth.estimate);
```
This finally makes `"faint"` a *reachable* status (band 2 = "changed") — the dead branches at ~1414/~4411 come
alive for free. **Every existing reader keeps working unchanged**, reading belief-derived status:
- Outbound `earthSignal` 544/548 — **untouched** (outbound stays old-model: live→silent on its own roll; it
  never touches truth/estimate, so outbound plays byte-identically).
- 556 (`heard++`) · 1120 · 1156 · 1414 · 1823 (`beaconHeard` writer) · 2384 (`word` cond) · 4173 (outbound HUD)
  · 4411 (voyage HUD) — all read `.status`, all keep working.
- **One reader migrated by design:** `voyageArrive` (2573) moves from `status==="silent"` to `earth.truth`,
  to resolve on TRUTH (in-scope enrichment of voyageArrive's own Earth tiers — see Decision 5b).

## DECISION 3 (+recommend) — one cumulative Years-Since-Exodus clock
**Single source of truth, computed on read (no stored duplicate to desync):**
```
function exodusYears(){
  var y = game.shipYears || 0;                                   // Phase-1 outbound leg
  var colExtra = game.colony ? game.colony.year * CYCLE_YEARS : 0;
  var voyExtra = game.voyage  ? game.voyage.turn * VOY_YEARS_PER_TURN : 0;  // VOY_YEARS_PER_TURN ≈ 1.6 (tune M-INT2)
  return Math.round(y + Math.max(colExtra, voyExtra));           // colony+voyage are ONE wall-clock → max, not sum
}
```
Lives beside the `round1`/`clamp` utilities. Colony's stored `col.elapsedYears` stays as-is for its HUD _(superseded by M-INT1b [3a])_; this
helper generalizes it across fronts. **Surfaced on the VOYAGE HUD:** swap the title clock at ~4414 from
`round(shipYears)+v.turn` to `exodusYears()`, and add a **"Years since exodus"** stat line mirroring the
colony's ~4343. **Drives Earth:** `earthTruthStep()` and `voyageEarthSignal()` read `exodusYears()` for
`pressure` — the longer the whole endeavor, the worse Earth trends and the higher the silence odds.

## DECISION 4 (+recommend) — voyage Earth arc = `voyageEarthSignal()` SIBLING
**Recommend the sibling** (project precedent; leaves outbound `earthSignal` byte-identical). It runs off the
VOYAGE clock — `prog = v.distance / v.total`, `v.turn`, `exodusYears()` for time pressure — and each tick:
steps truth (`earthTruthStep`), steps the bounded estimate, writes derived `status`, drips a message banded by
**belief** (not stale outbound bands), and adjusts voyage-crew morale via `adjustMoraleAll(..., v.crew)`. The
**one-line swap**: the voyageTurn call at ~2342 `earthSignal()` → `voyageEarthSignal()`; the outbound call at
~903 stays `earthSignal()`. *(Rejected: parameterizing `earthSignal(front)` would touch the frozen outbound
body and risk the byte-identical guarantee.)*

## DECISION 5a (+recommend) — voyage generations = `voyageAgeCrew()` SIBLING
**Recommend the sibling** of `ageCrew` (mirrors `colonyAgeDrift`), called from voyageTurn (beside the Earth
tick), leaving outbound `ageCrew` (888) untouched. It operates entirely on `v.crew`:
- **Aging:** `+VOY_YEARS_PER_TURN`/turn; `Hibernating → AGE_HIB` (cold sleep pauses aging); children 2× rate.
- **COME_OF_AGE → mans a station (the concrete payoff):** a transit-born child reaching `COME_OF_AGE` sets
  `child=false`, takes a needed role over `v.crew` — **preferring Pilot when no Pilot is awake** (the most
  load-bearing crossing role: `skillAwake("Pilot", v.crew)` feeds `voyageHazardDanger`), else `neededRole`-style
  pick — `skill = rint(45,70)`, logs *"…comes of age and takes the Pilot station — a child of the dark now flies
  the ark home."* A child born early in the crossing thus matures before arrival and measurably lowers hazard
  danger.
- **OLD_AGE:** age-scaled mortality via `killCrew(c, …, false, v.crew)`.
- **`v._pregnancy`:** add the field; `voyageAgeCrew` gestates + births (into `v.crew` via an `addChild`-style
  push) + organically conceives, mirroring `ageCrew`. The existing `newlife` event stays as a rare *scripted*
  birth beat; two birth sources is acceptable and flagged for M-INT2 balance.
- **Headless off-front (auto):** aging + Earth ticks never open a modal — they log only — so the voyage
  auto-stepping under colony focus resolves inline with no modal and no error.

## DECISION 5b — voyageArrive Earth tiers, resolved on TRUTH (in-scope enrichment)
Replace the binary silent/else with a truth-banded resolution (still gated by hull/crew):
`gone` → **TOO LATE** (no one to receive it); `silent` → **A SILENT SHORE** (you arrive, the air is dead — a
darker TOO LATE variant); `changed` → **MESSENGER** / **THE LONG WAY HOME** by hull (today's live tiers);
`recovered`/`thriving` → a brighter MESSENGER variant (**WORD WORTH CROSSING FOR** — Earth held, your news lands
on a world still able to act). Because resolution is on truth while the HUD showed belief, the arrival can
honestly surprise — within the one-band bound.

## Scope boundary vs M-INT1 / M-INT1b
P3-M4 **resolves** Earth's truth, **surfaces** the belief + cumulative clock, and **wires** voyage
generations; it may enrich `voyageArrive`'s own Earth tiers (5b). It does **NOT** generalize `composeEnding`
(that is **M-INT1** — which will READ `earth.truth`/`exodusYears()`) and does **NOT** add the bidirectional
focus toggle (**M-INT1b**). Hazard/Earth probability + `EARTH_DOOM_YEARS`/`VOY_YEARS_PER_TURN`/`EARTH_NOISE_P`
tuning = **M-INT2**.

## Verification the build will commit to
- `node --check game.js audio.js`; **zero-diff gate** — `applyOutcome`/`resolveCheck`/`composeEnding`/`tryCompose`
  md5-identical; OUTBOUND `earthSignal` + `ageCrew` **byte-identical** (siblings used, so provably unchanged).
- **New harness `/tmp/earthm4.js`:** (a) the shown estimate drifts but stays `|estimate−truth| ≤ 1` across a
  long randomized run; (b) `exodusYears()` advances across fronts and worsens Earth's trend — a long endeavor
  lands a worse truth-at-arrival than a fast one (statistical over N runs); (c) the estimate CAN diverge from
  truth-at-arrival within the bound (observed both equal and ±1); (d) voyage crew age, and a `newlife`/pregnancy
  child matures mid-crossing and mans a station (Pilot when vacant), lowering subsequent hazard danger; (e) every
  existing `earth.status` reader still functions (status is always a valid string ∈ live/faint/silent); (f) the
  headless off-front auto tick resolves with no modal and no error.
- **Regression (all must stay green):** `crossingm2` + `homehaz` + `homesmoke` + `colonyskel` + `colonym2..m6`
  + `colonyfix` + `decisionm1` + `arrivalfix` + `feattest` + `fuzz`. **Smoke:** the dread clock must NOT make the
  home crossing unwinnable — a timely run can still reach a live-Earth ending (MESSENGER / WORD WORTH CROSSING FOR).

## STOP
P3-M4 closes the home front's emotional loop: Earth is no longer a coin-flip but a world the crew *believe* in
on bounded, lagging evidence and *find out about* at the shore; one honest clock makes the long way home cost
something; and a child born between stars can grow up to fly the ship that carries the news. The pieces M-INT1
needs — `earth.truth`, the belief-derived `status`, and `exodusYears()` — are now set.

---

# M-INT1 — Endings composition (split the two-world `cWon && !vWon` branch on `v.tier`)

## Context
P3-M4 gave the homeward arrival six distinct tiers, but `composeEnding`'s two-world branch keys only on the
booleans `cWon` / `vWon` / `beaconHeard` — it never reads `v.tier`, so all six voyage tiers collapse. That
collapse is harmless everywhere except one branch: **`cWon && !vWon`** (a settled colony whose ship did NOT
"win"). That branch hardcodes *"the ship that carried the news never made it home"* — which is **FALSE** for
two of the three losing voyage tiers, because the ship **did** reach home space; Earth was simply gone
(`TOO LATE`) or silent (`A SILENT SHORE`) when it arrived. M-INT1 fixes exactly that one incoherence and
nothing else.

This milestone **unfreezes `composeEnding`** — one of the four functions the P3-M4 zero-diff gate holds
md5-identical. The md5 freeze stops protecting it; the **golden-lock** harness below replaces it, pinning the
change to a closed, two-cell, declared-output set.

## Re-anchor — what exists at HEAD (verified against source; do NOT rebuild)
`composeEnding` (game.js:2844-2863); the game logic is unchanged since `22e600c`.
- **`tryCompose` (2836-2843):** ship-never-launched → colony fate alone composes; otherwise waits for BOTH
  fronts then calls `composeEnding`. **Unchanged by M-INT1.**
- **Two-world branch `c && v` (2850-2855)** keys only on `cWon` / `vWon` / `beaconHeard`; **never reads
  `v.tier`**. Its matrix today:
  - `cWon && vWon` → **TWO WORLDS** (collapses 3 winning voyage tiers — **coherent**, leave byte-identical)
  - `cWon && !vWon` (2852) → tier `beaconHeard ? "A WORLD, AND WORD" : "A WORLD, AT LEAST"`, cause begins
    *"The colony stands and grows — but the ship that carried the news never made it home. "* — **the one
    incoherent branch** (covers `v.tier ∈ {TOO LATE, A SILENT SHORE, LOST WITH ALL HANDS}`)
  - `!cWon && vWon` → **THE MESSENGER** (coherent, leave byte-identical)
  - `!cWon && !vWon && beaconHeard` → **THE WORD GOT THROUGH**; else → **EXTINCT** (both byte-identical)
- **Single-world branches (2856-2861):** colony-only (B) and voyage-only (C) already pass their own tier
  through. **Both byte-identical.**
- **The 3 losing voyage tiers — `voyageArrive` (game.js:2704-2721):** **TOO LATE** (`truth ≥ 4` — ship
  arrives, Earth gone), **A SILENT SHORE** (`truth = 3` — ship arrives, Earth silent), **LOST WITH ALL
  HANDS** (`crew = 0` — ship never arrives; "never made it home" is **true** here).
- **Out of scope (note, do NOT touch):** `resolveActTwo` (game.js:1266) and any path that calls `endGame`
  **directly** — these BYPASS `composeEnding`.

## Decision (locked) — ADDITIVE RE-TIERING, two cells only
Preserve every existing reachable tier's prose **byte-identical**; add new text **only** for the two
incoherent cells. Split the `cWon && !vWon` branch on `v.tier`:

| v.tier | meaning | action |
|---|---|---|
| `TOO LATE` | ship arrived, Earth gone | **NEW pinned text** (cell 1) |
| `A SILENT SHORE` | ship arrived, Earth silent | **NEW pinned text** (cell 2) |
| `LOST WITH ALL HANDS` | ship never arrived | **KEEP existing line byte-identical** (the `else`) |

Everything else is untouched: the `cWon && vWon` → TWO WORLDS collapse stays as-is (coherent); `!cWon &&
vWon` → THE MESSENGER, the `!cWon && !vWon` THE WORD GOT THROUGH / EXTINCT pair, and both single-world
branches stay byte-identical. The beacon-dependent tier names **A WORLD, AND WORD** / **A WORLD, AT LEAST**
remain reachable through the retained `LOST WITH ALL HANDS` else (both beacon states), so nothing is
orphaned.

### Implementation shape (surgical, in place — no refactor)
Replace the single `cWon && !vWon` arm at game.js:2852 with a three-way split on `v.tier` (TOO LATE / A
SILENT SHORE / else), `won` stays `true` for all three. The two new arms are **beacon-independent** (one
pinned string each — the arrival outcome carries the beat); the `else` reproduces today's line verbatim,
including its `beaconHeard` ternary. No `composeOutcome` extraction is required; the diff is one branch.

### The two new pinned strings (golden expected outputs for the re-tiered cells)
- **Cell 1 — `v.tier === "TOO LATE"`**, tier **"A WORLD, AND AN EMPTY SKY"** (win):
  `"The colony stands and grows — and the ship did reach home space, only to find the sky where Earth was
  gone utterly quiet: no domes, no beacons, no answer at all. The crossing was made; there was simply no one
  left to make it to. What you built out here is no longer humanity's newest thread — it is the only one. "
  + c.cause`
- **Cell 2 — `v.tier === "A SILENT SHORE"`**, tier **"A WORLD, AND A SILENT SHORE"** (win):
  `"The colony stands and grows — and the ship did reach home space, only to find Earth still there and
  answering nothing, every receiver dark. The news arrived; the silence kept it. Whatever became of the
  cradle became of it without a word. The world you built out here is the only one still speaking. "
  + c.cause`

## Golden-lock — characterization harness `/tmp/endings_golden.js` (replaces the md5 gate)
A **declared-output-match** harness, not a "no change" gate.
- **Tuple snapshot method (deterministic, no RNG):** for every reachable `(colony × voyage × beacon)` input
  tuple, directly seed the three inputs `composeEnding` reads — `game.colonyDone = {won,tier,cause}`,
  `game.voyageDone = {won,tier,cause}`, `game.colony.beaconHeard` — set `game.ended = false`, call
  `composeEnding()`, then read back `{won: game.won, tier: game.outcomeTier, cause: game.cause}` (set by
  `endGame` at game.js:2868-2870). Reset and repeat. Enumerate: colony ∈ {SETTLED(win), WITHERED(loss),
  LIFE SUPPORT LOST(loss)} × voyage ∈ {the 6 tiers as `{won,tier,cause}` objects, plus `none`} × beacon ∈
  {true, false}, plus the colony-only (B) and voyage-only (C) single-world rows.
- **HEAD snapshot:** run the enumeration against HEAD (pre-change), pin every tuple's `{won,tier,cause}` into
  `EXPECTED_HEAD`.
- **The closed change set** = the two cells `(SETTLED, TOO LATE)` and `(SETTLED, A SILENT SHORE)` — both
  beacon values of each map to the one beacon-independent pinned string above, so **2 distinct new strings
  across 4 input tuples**. Pin these as `EXPECTED_NEW`.
- **Assertion both ways:** every tuple **NOT** in the change set → `{won,tier,cause}` **byte-identical** to
  `EXPECTED_HEAD`; every tuple **IN** the change set → equals its declared `EXPECTED_NEW` string. Net:
  exactly two cells change, and the change-set is a closed, named list.
- **No-orphan check:** A WORLD, AND WORD / A WORLD, AT LEAST still appear (via SETTLED + LOST WITH ALL
  HANDS); TWO WORLDS, THE MESSENGER, THE WORD GOT THROUGH, EXTINCT, and all single-world tiers still appear.

## Scope boundary
Endings composition ONLY. NOT the bidirectional focus toggle (**M-INT1b**). NOT balance / hazard / Earth-doom
tuning (**M-INT2**). `resolveActTwo` and the direct-`endGame` paths are untouched.

## Verification the build will commit to
- `node --check game.js audio.js`.
- **Golden characterization (`/tmp/endings_golden.js`):** off-list tuples byte-identical to HEAD; the two
  on-list cells equal their declared pinned text; no legacy tier orphaned.
- **Narrowed zero-diff gate:** `applyOutcome` / `resolveCheck` / `tryCompose` stay md5-identical to HEAD —
  the gate shrinks from four functions to three; `composeEnding` is now covered by the golden harness.
- **Regression (all must stay green):** `crossingm2` + `homehaz` + `homesmoke` + `earthm4` + `colonyskel` +
  `colonym2..m6` + `colonyfix` + `decisionm1` + `arrivalfix` + `feattest` + `fuzz`.
- **Winnability:** unchanged — the two re-tiered cells were already wins (`cWon`, `won = true`) and stay
  wins; a timely live-Earth arrival still reaches its winning tier.

## STOP
The one false line is gone: a settled colony whose ark crossed the whole dark to a dead or silent Earth no
longer claims the ship "never made it home" — it says the truer thing, that the world you built is now the
only thread left — while every other ending stays byte-for-byte what it was, locked by the golden harness
that now stands in for the md5 gate.

---

# M-INT1b — Parallel-fronts legibility layer (presentation-only wrapper over the live dual-front engine)

## Context
The dual-front machinery (run a colony on Proxima while a crewed ark crosses home) has been live and
unchanged since P3-M2, but the *unfocused* front is blind: acting on one front auto-ticks the other
silently, so the player can't see the off-front's state, can't tell what happened there, and can't feel the
two timelines piling up. M-INT1b is a **presentation-only** layer that makes the already-running second
front legible. It adds **no gameplay**, changes **no rate/odds/constant**, and leaves the engine
byte-identical where the zero-diff gate applies.

## Re-anchor — verified against committed source (the machinery is already there)
- **Focus handler (live):** `case "focus": game.screen = arg; sfx("blip"); renderApp(); break;` (game.js
  4709–4710). HUDs already carry a `⇄` toggle (voyage side 4558).
- **Off-front auto-tick (live, already logs):** act on SHIP → `voyageStep`(2740) → `voyageAfterTurn(false)`
  (2729) → `colonyAutoStep()`(2733, body 2824–2829) → `colonyTurn(action,true)`. Act on COLONY →
  `finishColonyTurn`(1869) → `colonyAfterTurn(false)`(1976) → `voyageTurn(true)`(1984, body 2447–2485). Both
  auto-ticks already write `game.log` via `log(msg,type)`(294–297; capped 220); major beats already log.
  **The digest source already exists.**
- **Both-fronts ending (unchanged):** `tryCompose`(2836) waits for both, then `composeEnding`(2844).
- **Clocks (true relationship, read from source):** `VOY_YEARS_PER_TURN=1.6`(160) · `CYCLE_YEARS=0.5`(1341)
  · `AGE_PER_TURN=0.40`(156) · `EARTH_DOOM_YEARS=220`(163, hidden). `exodusYears()`(26–31) =
  `round(shipYears + max(colony.year×0.5, voyage.turn×1.6))`. After launch each turn advances the focused
  front AND auto-ticks the off front exactly once, so the clocks advance together at different per-turn
  rates; `exodusYears()` takes the `max()`. **No relativistic dilation, no hidden divergence** — voyage crew
  age 1.6/turn vs colonists 0.5/turn (crew age *faster*, the opposite of dilation). The only honest
  legibility move is to surface the single reconciled `exodusYears()` wall-clock the engine already
  computes — not a two-clock juxtaposition.
- **Hidden stays hidden:** `earth.truth`(0–4) and `EARTH_DOOM_YEARS` are never exposed; only
  already-visible diegetic fields (`earth.status`, exodus year, crew-aboard) surface.
- **Self-sufficiency is EMERGENT — no stored number** (1310–1314): the strip reports stored fields (hope,
  stage, year), never a fabricated self-sufficiency value.
- **`SAVE_KEY="proxima-trail-save-v7"`(15)**; `save()` stringifies the whole `game`(272).

## The three locked features → exact render/edit points (presentation only)

### [2a] Always-visible both-fronts status strip — ONE slim `.small dim` line per HUD
- **Voyage HUD** (`renderVoyage` 4532–4584): insert a colony-headline line after 4562 (before the `</div>`
  at 4563): `⇄ Colony — hope {round(colony.meters.hope)} · {colony.stage} · yr {col.elapsedYears}`. Render
  only when `game.colony && !game.colonyDone`.
- **Colony HUD** (`renderColony` 4465–4528): insert a ship-headline line after 4480 (before the `</div>` at
  4481): `⇄ Ark — {round(v.distance)}/{v.total} home · {alive(v.crew).length} aboard · Earth {earth.status}`
  (reuse `alive`(305) + status string at 4557). Render only when `game.voyage && game.voyage.active &&
  !game.voyageDone`.
- Each is a single inline `.small dim` line (the voyage compact pattern — short, `·`-separated, no new
  panel). Reads existing state; computes nothing.

### [3a] Single canonical shared-clock — REPOINT the existing colony stat (no new line, no relabel)
- Show **ONE reconciled clock**, identical on both HUDs: `exodusYears()`(26–31) verbatim — no new
  computation, no rate touched, hidden doom never exposed. **Retire all relativity framing** (the engine is
  a generation-ship `max()` wall-clock; crew age *faster* than colonists, so a dual-year readout would be
  both incoherent as "one clock" and emotionally inverted).
- **Colony HUD — REPOINT, do not add.** In `renderColony`, change the existing
  `stat("Years since exodus", col.elapsedYears)` to `stat("Years since exodus", exodusYears())`. ONE-line
  edit. **Do NOT** add a second year line. **Do NOT** relabel anything "Colony cycles" — `col.elapsedYears`
  is a YEARS value, not cycles.
  - `exodusYears()` is voyage-safe (guards `game.colony`/`game.voyage` → 0), so in colony-only games it
    renders and equals the old `col.elapsedYears` there; in dual-front games it shows the reconciled
    `max()` wall-clock, matching the voyage HUD. Both HUDs then read an identical "Years since exodus".
  - `col.elapsedYears` stays **computed** (`colonyAgeDrift` still uses it); it just stops being the
    displayed stat. Colony cycle progress stays visible in the panel title (`"The Colony · Cycle " +
    col.year`).
- **Voyage HUD — unchanged.** Title (4560) + stat (4568) already read `exodusYears()`. 3a already
  satisfied; add nothing.
- **Field source: `exodusYears()` ONLY.**

### [1c] Adaptive off-front digest — captured from the auto-tick's OWN log, never recomputed/re-rolled
- **Capture (read-only) at the two existing call sites** — wrap, do not modify the tick:
  - `voyageAfterTurn`:2733 → `var _n = game.log.length; colonyAutoStep(); captureDigest("colony", _n);`
  - `colonyAfterTurn`:1984 → `var _n = game.log.length; voyageTurn(true); captureDigest("ship", _n);
    save();` (preserve the existing `save()`).
  - `captureDigest(front,n)` appends `game.log.slice(n)` (the real entries the tick just produced) onto a
    transient `game._offlog` buffer tagged by front, and records a tiny read-only headline snapshot
    (off-crew alive, stage, hope band) for major-detection. It mutates no front state.
- **Surface on toggle-back** in the now-focused HUD's render, then clear:
  - **default (no major beat):** ONE synthesized line from stored fields (e.g. `The colony held steady —
    hope 64, year 28.` / ship mirror `The crossing pressed on — yr 14, 2 aboard.`). Formatting of existing
    state, not a re-run.
  - **major beat:** render the captured log entries verbatim as the digest narrative.
- **"Major" (read-only):** any captured entry `type ∈ {bad,good,sys}` OR off-front `alive` decreased OR
  `colony.stage` changed OR a hope-band threshold cross (≥50 ⇄ <50, or <20). All from the snapshot + the
  entries the tick already produced — no re-roll.

## Enumerated deliverables (the build adds/edits ONLY these)
1. **Render edits:** `renderColony` (off-front strip + **repoint** the existing `Years since exodus` stat
   from `col.elapsedYears` to `exodusYears()` + digest block) and `renderVoyage` (off-front strip + digest
   block; clock already present, no clock line added). Small pure helpers `offStripLine(side)`,
   `digestBlock(side)` near the renderers. **No `twoClockLine` helper; no new colony year line; no "Colony
   cycles" relabel.**
2. **Capture wrappers:** 2 lines each at `voyageAfterTurn`:2733 and `colonyAfterTurn`:1984 + the
   `captureDigest()` helper. **No edit to `colonyAutoStep`/`voyageTurn`/`colonyTurn`.**
3. **Digest data source:** the `game.log` slice the existing auto-tick produced (capture only reads
   `game.log.length` + slices; appends to `_offlog`, never writes front state, so the off-front is
   byte-identical with vs without capture — asserted by harness (a)).
4. **Canonical-clock data source:** `exodusYears()`(26–31) ONLY — one reconciled value, shown verbatim on
   both HUDs; no per-front year-juxtaposition is rendered.
5. **New state + SAVE posture:** only transient `game._offlog` (+ snapshot scalars); rides the existing
   whole-`game` `save()`; old v7 saves lack it → treated as empty. **Stay on v7, no migration.**
6. **Layout (390×844):** nothing added to `#topbar`; the +1 short strip line keeps the voyage action row
   above the 844px fold; the colony HUD adds ≤1 short strip line under its header (the clock stat is a
   repoint, not an addition); the digest block shows only on toggle-back (a few short lines).

## Zero-diff gate (must hold)
- **md5-identical to HEAD:** `applyOutcome`, `resolveCheck`, `tryCompose`; **`composeEnding` unchanged.**
- **No change** to `colonyAutoStep`/`voyageTurn`/`colonyTurn` bodies, any auto-tick rate/odds, any
  `DIFFICULTY`/scoring/tuning constant, or any sampled-outcome path. Hidden meters stay hidden (no
  `earth.truth`/`EARTH_DOOM_YEARS` exposure). Anything requiring a touch above is OUT OF SCOPE.

## Verification the build will commit to (all pass before STOP)
- `node --check game.js audio.js`.
- **Zero-diff:** md5 of `applyOutcome`/`resolveCheck`/`tryCompose` identical to HEAD; `composeEnding`
  unchanged (reuse the M-INT1 md5 harness method).
- **New `/tmp/mint1b.js`:**
  - (a) **read-only proof** — run a dual-front sequence twice (capture on vs a capture-off flag); assert the
    off-front `JSON.stringify({colony, voyage, crew, log})` is byte-identical (capture changes nothing but
    `_offlog`).
  - (b) **canonical-clock equality (UPDATED)** — both HUDs' "Years since exodus" == `exodusYears()` exactly.
    Assert: **no stat labeled "Colony cycles"; no second year line on the colony HUD; `col.elapsedYears`
    no longer rendered as a stat; no per-front year-juxtaposition anywhere.**
  - (c) **adaptive digest** — a seeded no-major tick yields the one-liner; a seeded death/hazard/stage
    milestone yields the full captured narrative (the real log entries).
  - (d) **save posture** — a v7 save WITH `_offlog` round-trips (load → render → no error); a v7 save
    WITHOUT it loads to an empty digest. (No v8.)
- **Regression:** existing colony + voyage harnesses green; endings unchanged incl. the M-INT1 two-world
  cells (rerun `/tmp/endings_golden.js`).
- **Mobile (390×844):** screenshot voyage + colony HUDs — no topbar overflow introduced; the per-turn
  action row stays above the fold on the voyage HUD; strip + repointed clock render as compact lines.

## STOP
With M-INT1b the second front stops being invisible: a slim both-fronts strip, one honest `exodusYears()`
clock shared identically by both HUDs (the colony stat repointed, never duplicated), and an adaptive digest
that replays whatever the off-front auto-tick actually logged — all pure presentation, the engine
byte-identical everywhere the zero-diff gate holds.

# ============================================================
# M-UI1 — Glass-bridge UI overhaul (ADDENDUM, built 2026-07-01)
# Presentation-only: the whole game had shrunk into a dim 1000×780
# box (tiny type, sliver bars, colliding route labels, a broken
# ASCII title, Continue lost among nine identical pills with
# Abandon beside it, the log cramped at 168px). Tom picked the
# FULL BRIDGE REDESIGN over a polish pass or a re-theme.
# ============================================================

## What was built (style.css rewritten + four render functions' markup)
- **Full-viewport frame:** `#crt` fills the screen; base type 14px; DIN flight stack
  (`Bahnschrift` display, `Cascadia Mono`/`Consolas` numerals) — still zero external assets.
- **Viewscreen (travel):** the nav panel becomes a window — two drifting parallax CSS
  starfields, a destination planet on the plot's far edge, Day / Next / Earth-signal as
  HUD chips riding the glass (replacing the label-left/value-right form with a dead middle).
- **Route plot:** EVERY waypoint labeled, alternating above/below the rail so neighbours
  cannot collide (old code labeled only current/previous, same line — "Earth Orbit" ended
  x=255 while "Lunar Gateway" began x=225). ≤1100px: only current/next labels survive.
- **Command console:** the log takes the remaining viewport height beside a command stack —
  `▶ CONTINUE` as a big amber primary key (SPACE hint), the six station verbs in a 2-col
  key grid, ATLAS below, `Abandon run` exiled under a separator.
- **Crew station:** real header row (Name/Health/Morale/Status) replaces per-row `hp`/`mor`
  micro-labels; supply bars 12px (crew 9px) with gauge-tick texture; crit bars still breathe.
- **Title:** broken ASCII logo replaced by a full-bleed hero — big glow type over starfield +
  rising planet; identical actions/shortcuts (R/N/H/L).

## Scope boundary (held)
- Diff = `style.css` + markup strings in `renderTitle` / `renderRouteMap` / `renderTravel` /
  `crewStrip` ONLY. All `data-action` wiring, keyboard shortcuts, `#sr-live` announcer, modal
  focus trap, and `prefers-reduced-motion` kill-switch untouched; colony/voyage/store/role/end
  screens inherit purely via CSS. Nothing the sacred list guards moved — no odds, economy,
  difficulty, or hidden-meter values.

## Verification (all green)
- `scripts/verify.sh` **GATE PASS** — node --check; frozen-three (applyOutcome / resolveCheck /
  tryCompose) md5-identical to baseline; all 9 harnesses green incl. `endings_golden`.
- Live browser pass at 1440×900 and 820×900: title → role → outfitting → launch → travel,
  played to day 133 (hazard modal, three station/trade modals, red-alert active at O₂ 9,
  8-crew roster incl. a child, full colored log). Narrow view stacks console; labels reduce.

## STOP
M-UI1 gives the game a bridge worth sitting on: a real viewscreen, gauges readable at a
glance, the log restored to the heart of the screen — with the engine byte-identical
everywhere the zero-diff gate holds.

# ============================================================
# M-UI2 — One-screen bridge: no page scroll, desktop + mobile
# (ADDENDUM, built 2026-07-02)
# Presentation-only: the M-UI1 bridge looked right but did not
# FIT — on short desktops and on phones (390×844) the .bridge
# column overflowed #app and pushed Continue below the fold; at
# ≤900px the console stacked log-then-commands, burying every
# action. Phase plan: docs/orchestration/plan-phase-1.md
# (forks A–F as recorded there, Fork E per orchestrator ruling).
# ============================================================

## What was built (style.css + one index.html token + one new harness)
- **Viewport plumbing (M1):** `#crt` height gains a `calc(100dvh - 20px)` line after the
  `100vh` fallback (both the base rule and the ≤900px override) — the iOS dynamic URL bar
  stops causing phantom page scroll. `body` padding gains `env(safe-area-inset-*)` after its
  `10px` fallback; `index.html`'s viewport meta gains the single token `, viewport-fit=cover`
  (required for non-zero `env()` insets on iOS — the only index.html byte change).
  `html,body` + `#app` gain `overflow-x:hidden` as the horizontal-scroll backstop.
- **Desktop fit (M2, Fork A — corrected after live evidence):** `.bridge` flex-column →
  `display:grid; grid-template-rows: auto auto minmax(min-content,1fr); height:100%;
  min-height:0; gap:8px`, PAIRED with `contain:size` on `.console .log-wrap`. The console
  row absorbs the leftover height but can never shrink below the COMMANDS stack's intrinsic
  height: `contain:size` removes the log's unbounded scrollback from the row's min-content
  floor, so the floor measures only the commands — structurally unclippable — while the log
  stays the only slack absorber. `.console` carries NO `overflow:hidden` (an undersized row
  must overflow visibly, never silently swallow buttons). `.viewscreen` `min-height:158px` →
  `min-height:0` + `max-height:clamp(120px,22vh,200px)`; `.console`/`.log-wrap` gain
  `min-height:0`; `.console .log` min-height 160px → 96px (desktop). A `@media
  (max-height:800px)` block tightens `.viewscreen` (14vh) and caps `.stations .panel` at
  30vh with internal scroll so the floored console fits a 720px desktop. The log's internal
  `overflow-y:auto` is where scrolling now lives — you scroll the log, never the page.
  **Correction history:** the first cut (commit 7974884) used `minmax(0,1fr)` +
  `.console{overflow:hidden}` per the original T2.1/T2.3 letter — the live-evidence run
  caught it at 1280×720 clipping ATLAS + Abandon invisibly (page unscrollable, buttons gone:
  the DoD-7 clipping masquerade). Coordinator-directed fix within Fork A's grid approach.
- **Mobile fit (M3, Fork C):** in the ≤900px block — `.bridge { gap:6px }`, `.viewscreen`
  capped at `clamp(96px,16vh,140px)`, `.bridge .stations` bounded at
  `clamp(140px,24vh,240px)` with `overflow-y:auto` (stacked to one column at 390px the two
  panels run ~450px tall — the same budget-blowing failure mode as the desktop console, same
  T2.2-style internal-scroll cure), `.console .log { min-height:0 }` (the 84px TRACK floor
  governs; the desktop 96px floor bled behind the pinned commands), and `.console` becomes
  `grid-template-rows: minmax(84px,1fr) auto`: log scrolls in row 1, BOTH `.commands`
  variants (manual Continue+cmd-grid+ATLAS+Abandon AND autopilot Run/One-turn/Emergency-wake,
  game.js:4388–4408) pin to row 2 — pure CSS on the existing DOM order, no markup reorder.
  Touch targets: `.cmd-grid .btn`/`.commands .btn.small` ≥44px, `.btn.primary` ≥48px, and
  (Fork E, orchestrator-affirmed) a global `.menu.row .btn { min-height:44px }` floor that
  also reaches colony/voyage mobile action rows — monotonic, raise-only.
- **Proof harness (M5, Fork F — hardened after the live-evidence failure):** new
  `test/layout_onescreen.js` — plain node, no DOM; reads committed `style.css`/`game.js` as
  text and FAILS LOUD (nonzero exit + printed reason) if any fit-guaranteeing construct is
  missing: dvh height, safe-area padding, the `minmax(min-content,1fr)` + `contain:size`
  never-clip pair, NO `overflow:hidden` on `.console`, bounded `.viewscreen` max-height,
  `.console`/`.log-wrap` `min-height:0`, the ≤900px 44px floor + stations bound + log
  min-height release, the short-viewport media, and frozen-three PRESENCE (presence only —
  the md5 gate, not this harness, proves zero-diff; a text-scan sacred-token claim would be
  vacuous). Its original assertions green-lit the clipped first cut, so every new assertion
  was mutation-tested: construct deleted → exit 1 with printed reason, file restored
  md5-identical. It is the 10th harness counted by the gate (MIN_TESTS=9).

## Scope boundary (held)
- Diff = `style.css` + the exact single-token `index.html` viewport append +
  `test/layout_onescreen.js` + the docs pair. **Zero `game.js` edits** — the phase turned out
  to need no markup change at all (`.bridge` already wraps the whole travel screen, Fork D).
  `renderColony`/`renderVoyage` bodies untouched; `.viewscreen` confirmed travel-only by grep
  (game.js:4359, only in `renderTravel`). No `data-action`/`data-arg` token, keyboard wiring,
  `#sr-live`, focus-trap, or reduced-motion change. `test/frozen-baseline.json` byte-identical
  (NOT updated). Nothing the sacred list guards moved.

## Verification
- `scripts/verify.sh` **GATE PASS — 10 harnesses green** (9 existing + layout_onescreen),
  frozen-three (applyOutcome/resolveCheck/tryCompose) md5-identical to the unchanged
  baseline, endings golden present. Harness fail-loud mutation-tested: `.viewscreen`
  max-height, `contain:size`, re-added `overflow:hidden`, and the mobile stations bound
  each deleted/injected locally → exit 1 with the reason printed, file restored
  md5-identical each time.
- Builder in-browser layout checks after the correction (diagnostic only — NOT the official
  T5.3 evidence): 1280×720 → bridge rows 109/216/265, all 9 command buttons visible, zero
  page/#app/horizontal scroll; 1920×1080 → log 455px, all visible; 390×844 manual AND
  autopilot `.commands` states → all buttons visible at ≥44px, no log/command overlap, no
  scroll; colony-replica `.menu.row` at 390×844 → 44px floor, no overlap, no right-edge clip,
  `#app` scrolls normally.
- Live three-viewport screenshot evidence (1280×720, 1920×1080, 390×844 in BOTH travel
  command states, plus colony+voyage at 390×844 under the Fork-E floor) is **T5.3
  orchestrator-run sign-off** — required by the DoD but captured outside this commit.

## STOP
M-UI2 makes the bridge FIT the glass it's drawn on: one screen, log and every command
co-visible, desktop or phone — the scroll lives inside the ship's log where it belongs,
and the engine stays byte-identical everywhere the zero-diff gate holds.

# ============================================================
# M-UI2b — Post-merge remediation: 3 targeted divergences
# (ADDENDUM, built 2026-07-02)
# Presentation-only, CSS-only. NOT a feature phase. Cites are
# against merged HEAD af85b37 (style.css 533 lines). Phase plan:
# docs/orchestration/plan-phase-2.md (Forks G–J as recorded there).
# ============================================================

## What was built (style.css + test/layout_onescreen.js only)
- **D1, mobile topbar status (degrades-goal, T1.1+T1.2):** `#topbar` sits OUTSIDE `#app`,
  so its travel-only status string (byte-duplicate of the viewscreen's Day/Next chips +
  `vs-foot` distance) wrapped ~5 lines at 390px, squeezing the travel log to ~62px. T1.1
  (unconditional, ships regardless): `@media (max-width:900px) #topbar-status {
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }` caps the
  damage to one line everywhere, in any browser. T1.2 (Fork G1, travel-scoped hide):
  `#crt:has(.bridge) #topbar-status { display:none; }` removes the fully-redundant travel
  line while title/setup screens keep their non-duplicated BEST-SCORE line. **Both pieces
  are committed; T1.2 SHIPPED SUBJECT TO the T1.4 premise gate** — the executor has no
  browser and could not itself confirm the viewscreen's chips + `vs-foot` survive uncropped
  at 390×844 once the topbar line disappears (`vs-foot` is the last child of the
  `overflow:hidden` viewscreen, capped ~135px at 844 tall). The orchestrator owns the live
  390×844 verification and the G1-vs-G3 ship call; if `vs-foot` is found clipped, a
  follow-up commit removes the `:has(.bridge)` hide and G3 (ellipsis-only, topbar retained
  as the sole surviving distance readout) becomes the shipped variant. Where `:has()` is
  unsupported the rule is simply ignored — T1.1 alone still caps the worst case at one
  redundant line, never five.
- **D2, route-label clipping at short desktop heights (cosmetic, T2.1+T2.2, Fork H3):** at
  `max-height:800px` + `>=1100px` wide, every waypoint label rendered inside a 14vh-capped
  viewscreen; `.rm-label.blw{top:32px}` under the 30px rail plus `.routemap`'s 24/26px
  padding exceeded the cap and clipped below-rail labels mid-glyph. Fix: the same
  cur/nxt-only `.rm-label` reduction already used at `<=1100px` is extended into the
  `max-height:800px` block, PLUS `.routemap` padding `24px 10px 26px` → `16px 10px 18px`
  and `.rm-label.blw` top `32px` → `28px` — existing constructs only, no cap raise (H4
  rejected: would steal console-row budget and risk reopening the Phase-1 AC1 no-scroll
  guarantee at 1280×720).
- **D3, crew-table STATUS header clipping at 390px (cosmetic, shared component, T3.1, Fork
  I1):** `.crew-head`/`.crew-row` share one grid (`16px minmax(120px,1.5fr) 1fr 1fr 88px`,
  `gap:10px` — 144px fixed+gap overhead) that overflows its panel at 390px, clipping
  STATUS; the SAME grid renders on travel, colony, and voyage. Fix, uniform at `<=900px`
  (not voyage-only — no voyage-unique ancestor selector exists, and travel/colony clip
  identically): `grid-template-columns: 14px minmax(84px,1.4fr) 1fr 1fr 60px; gap:6px;`
  (98px overhead, freeing ~46px for name/bars) plus `.crew-head` `letter-spacing`
  `2px`→`1px` so STATUS fits its narrower 60px track. Desktop untouched (rule lives only
  in the `<=900px` block).
- **Proof harness (T4.1, Fork J1 — extended, not a new file):** `test/layout_onescreen.js`
  gains 3 presence-only assertions in the same file/media-block family it already pins
  (harness count stays 10, `MIN_TESTS=9` cleared with headroom): `(h2)` the `<=900px`
  block carries the `#topbar-status` ellipsis rule (always, independent of which D1 fork
  ships); `(i2)` the `max-height:800px` block carries both the `.rm-label` cur/nxt
  reduction and the `.routemap` padding tightening; `(j)` the `<=900px` block's
  `.crew-head`/`.crew-row` `grid-template-columns` override has a last track `<=64px`
  (bound catches a regression back toward the 88px desktop track). Each assertion was
  mutation-tested locally: construct deleted individually → harness exits 1 with a printed
  reason; file restored md5-identical after every check.

## Scope boundary (held)
- Diff = `style.css` + `test/layout_onescreen.js` ONLY. **Zero `game.js` and zero
  `index.html` diff** — all three fixes are CSS-only (DoD 2). `test/frozen-baseline.json`
  byte-identical to pre-phase HEAD `af85b37` (NOT updated). No `data-*`/odds/hidden-meter
  token anywhere in the diff. Nothing the sacred list guards moved.

## Verification
- `scripts/verify.sh` **GATE PASS — 10 harnesses green**, frozen-three
  (applyOutcome/resolveCheck/tryCompose) md5-identical to the SAME unchanged baseline,
  endings golden present.
- Live evidence (T4.3) is **orchestrator-run, pending outside this commit** — same posture
  M-UI2's T5.3 evidence pass held: D1 390×844 before/after log-height px + the
  chips-AND-`vs-foot`-visible premise check (or the recorded G3 fallback) + title-screen
  ellipsis sanity shot; D2 1280×720 no-clip label check; D3 390×844 voyage/travel/colony
  crew-table shots (all three shared-component call sites).

## Correction (same milestone, 2026-07-02) — premise-gate verdict + FORK-D1b
- **T1.4 verdict → G3 fallback shipped (plan-sanctioned path, DoD 3):** the orchestrator's
  live 390×844 evidence on 791b553 showed chips visible (3/3) but **`vs-foot` CLIPPED**
  (bottom 322 vs viewscreen bottom 230) — the G1 hide would have deleted the only
  surviving distance readout, so the `#crt:has(.bridge) #topbar-status { display:none }`
  rule is **REMOVED**. G3 ships: the T1.1 ellipsized single-line topbar is retained on
  travel as that readout. Harness `(h2)` flipped to the G3 variant — ellipsis floor still
  required, and the hide now **required ABSENT** (checked against comment-stripped CSS so
  the rule's tombstone comment doesn't trip it; mutation-tested by reintroducing the rule
  → exit 1).
- **FORK-D1b (unplanned, load-bearing — logged via `log_event` to `plan-events.jsonl`
  BEFORE the commit):** the orchestrator's deeper finding — with the topbar freed, the log
  STILL sat at ~62px: the freed ~87px flowed into the stations auto row (154px) while the
  console row sat at min-content (commands-dominated, 288px) and the `minmax(84px,1fr)`
  log row never left its floor. Options: (a) harder stations bound alone (~120px log,
  short); (b) commands compression alone (~124–140px, short); **(c) both — chosen**,
  targeting log ≥ ~150px. Shipped (all `<=900px`): `.bridge .stations` max-height
  `clamp(140px,24vh,240px)` → `clamp(96px,12vh,160px)` — tuned from the fork's initial
  14vh after in-browser measurement showed the log reached only 131px, the commands stack
  being touch-floor-dominated (54px primary + 8×44px buttons, incompressible without
  eating tap targets — off the table); commands compression (`.commands`/`.cmd-grid` gap
  6→4px, `.btn.primary` padding 14→8px + font 17→15px — the `max-height:800px` block's
  existing treatment — plus tighter `.cmd-grid .btn`/`.danger` paddings; the 44/48px
  min-height floors untouched and now harness-pinned); `.bridge` gap 6→4px. **Honest
  cost:** stations ~101px at 844 tall — header + ~2 crew rows glanceable, the rest behind
  the row's existing internal scroll; a denser command console.
- **Builder in-browser diagnostics** (supporting, NOT the official T4.3 evidence):
  390×844 travel — log **62→152px**, no page scroll, min command button 44px, topbar
  single-line carrying the distance readout, crew STATUS inside its panel; 1280×720
  travel — 0 labels clipped (cur/nxt only; below-rail label bottom 169 ≤ viewscreen
  bottom 172), all 9 commands visible, no page scroll (AC1 held); 390×844 title —
  single-line topbar, hero intact, no page scroll.
- **Harness `(k)` added** for the D1b reclaim: stations clamp vh term ≤ 14, a
  `.btn.primary` padding compression present, and the 48px primary floor still pinned;
  (k1)/(k2)/(k3) each mutation-tested (24vh restored / padding removed / floor removed →
  exit 1, file restored md5-identical). Gate re-run: **GATE PASS — 10 harnesses green**,
  frozen-three md5-intact, baseline untouched; diff scope unchanged (style.css +
  layout_onescreen.js + docs pair; zero game.js/index.html).

## STOP
M-UI2b closes the three verified divergences the Phase-1 reconcile loop surfaced without
disturbing the merged one-screen bridge — CSS-only, gate green. D1 resolved through its
encoded conditional exactly as designed: the premise gate failed in evidence, the G1 hide
came back out, G3 shipped — and the unplanned FORK-D1b was logged before it was built, so
the freed space finally reaches the ship's log (62→152px) instead of vanishing into a
scrolling panel.

# ============================================================
# Addendum M-UI2c — D4: numeric distance missing on mobile travel
# ============================================================
Single-divergence micro-phase against merged HEAD `ba0347a` (`docs/orchestration/plan-phase-3.md`).
Facts: shipping the G3 fallback (M-UI2b correction) means `vs-foot` — the only
`N / 434 ly-abs` readout, `game.js:4371` — is clipped by the mobile viewscreen cap, and the
ellipsized topbar squeezes to zero chars at 390px, so mobile travel had NO numeric distance
anywhere. Premise-gate evidence had already shown `.vs-chips` (`game.js:4362-4367`,
`flex-wrap:wrap`) survives the mobile cap 3/3.

## M1 — Distance chip, mobile-only (D4)
- **T1.1 (Fork K, chosen 4a):** `renderTravel`'s `.vs-chips` markup gains a fourth chip
  after Earth — `<span class='chip dist'><span class='cl'>Dist</span>{round(distance)} /
  {TOTAL_DIST} ly</span>` — reusing the same two expressions already rendered in `vs-foot`
  two lines below; markup-string-only, no new state read, no logic, frozen-three untouched.
  **Unit wording deliberate:** chip reads `" ly"` (chip-scale brevity), `vs-foot` keeps
  `" ly-abs"` — NOT aligned, by design. Rejected 4b (CSS-only `vs-foot` reflow at ≤900px —
  the same evidence that killed the Phase-2 G1 hide showed `vs-foot` clips BELOW the cap; a
  pixel gamble a micro-phase shouldn't take) and 4c (waive D4 — unwarranted, a safe fix
  existed).
- **T1.2 (Fork L, chosen L1 — mobile-only):** `style.css` gets `.chip.dist{display:none}`
  near the base `.chip` rule and `.chip.dist{display:inline-block}` inside the EXISTING
  `@media (max-width:900px)` block — no new media query. Desktop (≥900px) renders
  byte-for-eye unchanged, `vs-foot` stays the sole readout. Rejected L2 (chip everywhere,
  duplicate with `vs-foot` on desktop) and L3 (chip everywhere, hide `vs-foot`'s distance
  span instead — churns a working desktop layout).
- **T1.3:** `test/layout_onescreen.js` extended with assertion **(l)** — not (k), already
  occupied by Phase 2's FORK-D1b — three independent, content-specific, mutation-tested
  checks: (l1) the `chip dist` markup string in `game.js` referencing `TOTAL_DIST`; (l2)
  the `.chip.dist` default-hide rule; (l3) the ≤900px `.chip.dist` show rule. Harness count
  stays 10 (Fork J posture carried). All three mutation-tested locally: each construct
  deleted individually → harness exits 1 with a printed, content-specific reason; file
  restored md5-identical after each check.

## Verification
- `scripts/verify.sh` **GATE PASS — 10 harnesses green**, frozen-three
  (`applyOutcome`/`resolveCheck`/`tryCompose`) md5-identical, `test/frozen-baseline.json`
  **BYTE-IDENTICAL** to the unchanged pre-phase HEAD `ba0347a` (NOT updated).
- The ENTIRE `game.js` diff sits inside `renderTravel`'s function body
  (`game.js:4311-4419`) as a single markup-string insertion — one `chip dist` span, no
  `data-*` token, no logic, no new state reference beyond `game.distance`/`TOTAL_DIST`
  (both already rendered in the same function).
- Live evidence (390×844 Dist-chip-visible + route-rail/current-waypoint-node
  non-regression — chip visibility alone is NOT a pass, since the extra wrapped line can
  push the routemap into its `overflow:hidden` clip; 1280×720 no-chip/no-duplication) is
  **orchestrator-run, pending outside this commit** — same posture prior milestones held.

## Correction (same milestone, 2026-07-02) — DoD-6 viewscreen-internals FAIL → ≤900px tuning
- **Orchestrator evidence on `ab6b2ce` at 390×844:** Dist chip VISIBLE ("Dist 0 / 434 ly",
  joined the second chip row — no new row, head 80px with or without it), page/app/x
  overflow 0/0/0, log 152px held — **but DoD 6 FAILED:** the route rail and current
  waypoint node were clipped. Inside the 135px-capped viewscreen: vs-head ended y=93,
  `.routemap` started y=99 with height 80 → the rail (24px into the routemap) sat
  ~y=123–153, cut at the cap. Geometry was ALREADY borderline in P2 (the chip added no
  row) — but DoD 6 pins rail + current node visible, so it had to be made true.
- **Fix (orchestrator-directed parameter tuning, ≤900px block only — same construct
  family the `max-height:800px` block already tunes for D2; no new fork):**
  `.vs-title{display:none}` (decorative "Navigation" label — frees a full head row);
  `.chip{font-size:11px; padding:2px 7px}` (compresses both chip rows);
  `.routemap{margin:2px 0; padding:14px 10px 30px}` (top pad 24→14, margin 6/2→2/0);
  `.rm-label.abv{top:-14px}` / `.rm-label.blw{top:26px}` (offsets shrink with the
  padding so an above/below-rail cur/nxt label stays inside the tightened envelope —
  mirrors D2's blw 32→28 precedent). Bottom pad 30px is deliberate: it seats the blw
  label (needs 9px) AND pushes `vs-foot` fully past the cap — a first cut at 16px left
  a 12px mid-glyph sliver of the foot's first line poking into view; the foot stays
  clipped on mobile exactly as before this phase, the Dist chip is its readout.
- **Builder in-browser measurements (390×844, supporting — official sign-off is
  orchestrator-run):** vs-head 13–59 (was ending 93; title hidden, 4 chips in two
  rows, Dist chip 40–59); rail **75–105** ✓; current node **79–101** ✓; cur/nxt labels
  61–73 (abv) and 101–113 (blw), both visible ✓; vs-foot 137–183 → fully past the 135
  cap (no sliver); log **152px held**; min command button 44px; page/app/x overflow
  0/0/0. **1280×720:** Dist chip `display:none`, `.vs-title` visible, chip font at
  base 12.5px, `vs-foot` sole `ly-abs` readout, 9/9 command buttons visible, zero
  overflow — guaranteed unchanged by scoping (the entire correction lives inside the
  ≤900px block).
- **Gate re-run: GATE PASS — 10 harnesses green**, frozen-three md5-intact, baseline
  untouched. The harness pins none of the tuned parameters, so assertion (l)'s
  mutation-test evidence stands; diff is style.css-only (+17 lines inside the ≤900px
  block) + this docs pair.

## STOP
M-UI2c closes the last verified divergence from the Phase-2 premise-gate FAIL: mobile
travel regains a numeric distance readout via the one CSS-provable element proven to
survive the mobile viewscreen cap, at the cost of one extra chip-scale unit-wording
divergence (`" ly"` vs `" ly-abs"`) — disclosed and intentional, not a cleanup target.
The DoD-6 correction reclaims the viewscreen interior (title row + chip compression +
routemap envelope) so the rail and current node the chip was meant to accompany are
actually visible beside it — without raising the cap or touching the log's 152px.

# ============================================================
# M-UI3 — Ship & starchart artwork (ADDENDUM, built 2026-07-02)
# Intent-first redesign of the two graphics Tom called out: the
# between-locations ship and the navigation bar. Designed from
# intent, not patched: the transit is the Oregon-Trail wagon shot
# (an ARK crossing forever), the nav bar is the mission plotted
# on a bridge starchart. Presentation-only; zero external assets.
# ============================================================

## What was built
- **THE ARK (transit):** the `⊳—■▣` text glyph is replaced by a designed inline-SVG
  colony ship — drive plume (flicker-animated), engine block with amber radiators,
  cargo spine with lit cryo pods, a habitat ring with a sweeping highlight (life
  aboard), lit command prow, blinking nav lights. All artwork is STATIC SVG in
  `index.html`; `playTransit` now only flips `data-variant` on `#transit` — the
  textContent/destIcon writes are gone (NO new markup sinks; the fenced
  innerHTML concern is moot by construction). Destination art per variant, also
  static SVG: ring station (dock), Proxima Centauri b with terminator + atmosphere
  rim (land), drifting debris shards + pulsing warning (hazard, plus red vignette
  and a shudder animation on the ark). Variant table/durations/skip logic unchanged.
- **THE STARCHART (nav):** `renderRouteMap` now plots a shallow ballistic arc
  (SVG quadratic bezier; control-point x at midpoint keeps x(t) linear so node
  left% stays in registration with the curve). Three strokes: dim full arc, wide
  soft glow understroke, bright lit arc — the lit pair trimmed to the ship's
  fraction via `pathLength`/`stroke-dasharray`. Waypoints are drawn SVG glyphs
  riding the curve (Earth with moon · orbit-ring stations · warning-shard hazards
  · dashed hollow void · amber star + world for Proxima · hexagon default),
  coloured by state (visited cyan glow / current amber + pulsing halo / future
  faint). The ship marker is a MINIATURE OF THE TRANSIT ARK (plume, spine, ring,
  hull) gliding the arc with left+top transitions. Labels keep the existing HTML
  overlay system untouched (collision rules + media queries are gate-pinned).
- **Paint-safety note:** the lit arc's glow is a wide understroke, NOT a
  `drop-shadow` filter — a filter inside a `preserveAspectRatio:none` SVG
  rasterizes at stretched scale and measurably hung compositing during evidence.
- All new animations added to the `prefers-reduced-motion` kill list.

## Scope boundary (held)
- Diff: `index.html` (static transit SVG art), `game.js` (`playTransit` variant
  flip; `renderRouteMap` + new `rmCurveY`/`rmGlyph` presentation helpers — render
  layer only), `style.css`. Frozen-three untouched; `test/frozen-baseline.json`
  byte-identical; no odds/economy/difficulty/hidden-meter change; `data-action`
  wiring, keyboard, `#sr-live`, focus trap untouched.

## Verification (all green)
- `scripts/verify.sh` GATE PASS — 10 harnesses, frozen-three md5 intact, endings
  golden. Gate-pinned constructs (`.rm-label` rules, `.routemap` padding
  envelopes, chip pins l1–l3) all preserved.
- Live browser: 1440×900 travel starchart (arc + glyphs + ark marker render, 10
  nodes, 3 arc strokes); transit variants land/dock/hazard freeze-framed and
  reviewed; 390×844 — rail, current node, ark marker, all 10 glyphs AND the Dist
  chip inside the 135px viewscreen cap; log 152px HELD; page/app/x overflow 0/0/0.

## STOP
The ark finally looks like what the fiction says it is, and the nav bar reads as
a plotted crossing — bright where you've survived it, faint where it's still dark.

# ============================================================
# M-UI3b — Colony-front artwork parity (ADDENDUM, built 2026-07-02)
# Tom's catch: M-UI3 gave the ship side the new design language
# but not the colony front. The voyage-home screen still ran the
# LEGACY text rocket (◄ on a flat .track toward "EARTH ⊕") and the
# colony screen had no visual identity at all.
# ============================================================

## What was built (presentation-only)
- **Homebound starchart (`renderVoyage`):** the legacy `.track` bar is replaced by
  the same starchart system via a shared `rmChart()` shell — Earth glyph left,
  Proxima star glyph right, the traversed arc LIT FROM THE PROXIMA END (reversed
  lit-path direction), and the ark marker MIRRORED (`.rm-ship.home`, scaleX(-1))
  flying leftward toward home. `renderRouteMap` (outbound) now delegates to the
  same shell — one chart implementation, two directions. Dead `.track` CSS removed.
- **Colony vista (`renderColony` via `colonyVista()`):** a slim ground-truth strip
  in the colony panel — Proxima's amber glow low on a starred sky (CSS layers, so
  it survives any panel width), and a stretch-tolerant SVG settlement: horizon
  ground, rock outcrops, three cyan-rimmed habitat domes with a lit door, comms
  mast with a blinking beacon. Static composition, reads no game state.
- Fix discovered in review: the first vista used `preserveAspectRatio: slice`,
  which cropped the entire sky at desktop widths — sky moved to CSS background
  layers and the SVG kept only shapes that stretch gracefully (`P.A.R. none`).

## Scope boundary (held)
- Diff: `game.js` render layer only (`rmChart`/`renderReturnMap`/`colonyVista` +
  the one-line `.track` swap + vista insertion), `style.css`. Frozen-three and
  baseline untouched; labels/media/gate-pinned constructs untouched; no state
  reads added; `evidence.html` seam page added untracked (gitignored).

## Verification (all green)
- `scripts/verify.sh` GATE PASS — 10 harnesses, frozen-three intact.
- Live browser: 1440×900 colony (vista renders: glow, domes, beacon) and voyage
  (homebound chart: lit-from-Proxima arc, mirrored ark at 65% position for a 35%-
  home state, Earth/Proxima glyph endpoints); 390×844 both screens — zero
  horizontal overflow, Earth label survives the mobile label reduction, vista 66px.

## STOP
Both fronts now speak one design language: the ark you watch cross the dark is
the ark on the chart — outbound toward Proxima, and mirrored, limping home.

# ============================================================
# M-HOME1 — Return-leg named structure (ADDENDUM, built 2026-07-02)
# Tom's complaint: "the flight home — it includes none of the
# excitement or detail or gameplay that the flight to Proxima
# has." Phase 4 plan (docs/orchestration/plan-phase-4.md) locked
# Decisions 1-5 before build; this addendum records what shipped.
# ============================================================

## Locks executed (Tom, 2026-07-02)
- **Decision 1 = Option A:** named void landmarks — a new voyage-scoped
  `HOME_WAYPOINTS` array (SIBLING of outbound `WAYPOINTS`), tracked via
  `v.waypointIndex` (FORK P1a), positioned by fractional `at` (0->1) of `v.total`
  (FORK P2a — robust to mid-run distance jumps from fold/crippling hazards, which
  a baked absolute `CUM` could not survive). Structure/anchor ONLY: landmarks never
  read `voyageHazardDanger`, never touch `HOME_HAZARD_P`/`HOME_EVENT_P`, never vary
  odds by position.
- **Decision 2 = Option B:** anchored decision-events at two of the three interior
  landmarks, delivered by a landmark-gated dispatch reusing `VOYAGE_EVENTS` +
  `presentVoyageEvent`/`rollVoyageEvent`/`resolveVoyageCheck` (FORK P3a) — zero new
  resolver, zero frozen-three risk. All effects route through `voyageOutcome` only.
- **Decision 3 = roster as proposed:** *The Fold Seam* (at≈0.20, narrative-only) ·
  *The Halfway Dark* (at≈0.50, ANCHORED to the `longdark` VOYAGE_EVENTS entry — the
  loneliest-point morale/hibernation decision) · *The Last Beacon* (at≈0.80,
  ANCHORED to the `word` VOYAGE_EVENTS entry — broadcast-or-run-dark, cond-gated on
  Earth not-silent). Void/deep-space fiction throughout — no reused Sol-station names
  (fiction guard held).
- **Decision 4 = Option A (NO-OP):** `HOME_HAZARD_P`/`HOME_EVENT_P` stay
  byte-identical (`0.18`/`0.34`, game.js — both `var` declaration line untouched).
  M-HOME2 is the documented no-op the plan prescribed: the quiet share drops via
  landmark structure alone.
- **Decision 5:** every remaining M-INT2 constant left byte-identical —
  `EARTH_DOOM_YEARS=220`, `VOY_YEARS_PER_TURN=1.6`, `EARTH_NOISE_P=0.30`,
  `LAUNCH_READY=100`. Dual-birth-source (transit pregnancy + `newlife` event) was
  measured in the sweep (see below) — birth counts stayed modest per 200-crossing
  arm; no change made per the "measure, don't tune" lock.

## What was built
- **`HOME_WAYPOINTS`** (game.js, voyage section, sibling of `VOYAGE_EVENTS`): 3
  interior landmarks `{ name, at, kind, anchorEvent, blurb }`. `startVoyage` seeds
  `v.waypointIndex = 0`.
- **`voyageCrossLandmarks(auto)`** — called from `voyageTurn` between the
  arrival/crew-death checks and the peril roll (mirrors the outbound advance
  while-loop, game.js:724, but reads `game.voyage`, not `game`). While the next
  landmark's `at` fraction is passed, marks it visited and dispatches
  `voyageLandmarkBeat`, which logs the blurb and — for anchored landmarks — pulls
  the matching `VOYAGE_EVENTS` entry by id and resolves it via the existing
  choice-event chain (auto mode resolves inline with no modal, mirroring
  `rollHomeHazard(auto)`/`rollVoyageEvent(auto)`).
- **`renderReturnMap(v)`** now plots the 3 interior landmarks as `rm-node`/`rm-label`
  overlays between the Earth/Proxima endpoints (visited/current/future state,
  screen position mirrored to the homebound chart's existing `left:(1-f)*100%`
  convention) — reuses `rmChart`/`rmGlyph`/`rmCurveY` verbatim; no new map engine.
- **Test seam additions** (inert in production, game.js's `window.__proxima` block):
  `voyageTurn`, `HOME_WAYPOINTS`, a `HOME_EVENT_P` get/set accessor pair (for the
  B-preview harness-runtime-only override), `HOME_HAZARD_P` getter.
- **`test/homeleg.js`** (new, 11th harness): a distributional sweep, n=200 full
  return crossings per arm, over THREE arms — sound-ark, wounded-ark, and a
  B-preview arm (sound-ark config with `HOME_EVENT_P` runtime-monkey-patched to
  0.40 via the seam accessor, restored after the arm — zero shipped-byte change).
  Installs the global error trap, asserts every crossing reaches a real terminal
  state, asserts landmark structure (>=1 crossed; arrivals pass all 3 in order),
  and a coupling-drift guard confirming the anchored dispatch fires the intended
  event at its landmark.

## Scope boundary (held)
- Diff confined to: `startVoyage` (added `waypointIndex: 0` field), `voyageTurn`
  (inserted the landmark-crossing call + a guard line), two new functions
  (`voyageCrossLandmarks`, `voyageLandmarkBeat`) + the `HOME_WAYPOINTS` array,
  `renderReturnMap` (added the interior-node loop), and the test seam block.
- **Zero diff** to `WAYPOINTS`, `CUM`, `TOTAL_DIST`, `renderRouteMap`, the outbound
  advance while-loop (game.js:724), `ageCrew`/outbound `earthSignal`, `HAZARDS`,
  `applyHazardSeverity` — confirmed via `git diff a4158f3 -- game.js` hunk ranges.
- Frozen-three (`applyOutcome`/`resolveCheck`/`tryCompose`) md5-identical;
  `test/frozen-baseline.json` byte-identical; `composeEnding` untouched
  (golden-locked, not in scope this phase).
- `HOME_HAZARD_P=0.18`/`HOME_EVENT_P=0.34` declaration line byte-identical to HEAD
  — only comments near it were added; the constants themselves did not change.

## Verification (all green)
- `scripts/verify.sh` -> **GATE PASS — 11 harnesses green**, frozen-three intact,
  endings golden present, `test/homeleg.js` counted (MIN_TESTS=9, 11 present).
- **`test/homeleg.js` measured rates** (n=200 per arm, one representative run —
  values vary turn-to-turn within the locked AC4 windows across repeat runs):
  - **Sound-ark** (Pioneer, hull 100, no brownout): **survival 99.5%** (window
    [94%,100%]), **32/200 winning arrival tiers**, quiet-turn share **32.4%**,
    transit births **13**.
  - **Wounded-ark** (Voyager, hull 25, brownout): **LOST WITH ALL HANDS 35.5%**
    (window [28%,52%]), quiet-turn share **31%**, transit births **18**.
  - **B-preview** (sound-ark config, `HOME_EVENT_P` harness-overridden 0.34->0.40,
    data-only per ORCHESTRATOR RIDER 1): survival **99.5%**, quiet-turn share
    **28.2%** (down from the 4A baseline's ~32%, as expected from more
    choice-events per turn), transit births **13**. Constant restored after the
    arm; shipped `HOME_EVENT_P` unchanged.
  - **AC1 landmark structure:** every arrival across all 3 arms (n=600 crossings)
    passed all 3 interior landmarks in order (`The Fold Seam -> The Halfway Dark
    -> The Last Beacon`); >=1 landmark crossed confirmed.
  - **RIDER 3 coupling-drift guard:** an isolated clean crossing confirmed The
    Halfway Dark logs and its anchored `longdark` beat resolves at that landmark;
    The Last Beacon logs (its `word` beat is `cond`-gated on Earth not-silent, so
    it fires only when that condition holds at the time of crossing — observed
    absent in that particular isolated run, not a defect).
  - Repeat runs (6x local) held sound-ark in [96.5%,100%] and wounded-ark in
    [29.5%,39.5%] — comfortably inside both DoD windows with margin.
- `node scripts/frozen.js --check test/frozen-baseline.json` -> frozen-three intact.

## STOP
The flight home now has a named trail: three void landmarks the ark passes and
can see coming on the chart, two of them real decisions — same structural answer
to the complaint the outbound trail already gives, tuned to the crossing's own
loneliness. Odds untouched; the structure did the work the AC4 sweep set out to prove.

# ============================================================
# RE-VISION (2026-07-10) — Phase 0 (reconcile & guard) + Phase 1 (the on-ramp)
# Tom's directive: "nothing is sacred" — darker, harder, slightly real, still funny.
# Constitution replaces the sacred list (see CLAUDE.md); on-ramp lands FIRST.
# ============================================================

## Context
Tom reopened the whole design with a three-call mandate: genuinely open to reinvention,
push darker/harder further, tighten the on-ramp first. Two code-grounded deep-reads set
the targets: a punch-pulling audit (the mercy layer: ×0.62 return, four stacked heal
valves, free beacon flipping losses to wins, infinite station jobs, genocide with no
ending consequence, reload skipping crossings) and a run-1 design (narrate the kill-chain
as it happens; dying comprehensibly IS the tutorial). Full plan: Tom's plan file;
principles: CLAUDE.md constitution. Phases: 0 reconcile/guard → 1 on-ramp → 2 mobile
re-verify → 3 hardening wave → 4 reinvention → 5 ops.

## Phase 0 — shipped
- Repo fast-forwarded 9 commits (HEAD now byte-identical to the deployed Y build);
  the three 2026-06-27 audits committed.
- S9: pending hazard/station/void queues persist in game._pending (JSON-safe keys +
  indices); flushQueues re-fires on resume; pend() upgrades legacy saves. Reload can no
  longer skip a crossing. Harness: test/pending_persist.js.
- S1-2: handle() dispatch boundary (save → SYSTEM FAULT log → re-render, static notice
  if the renderer broke); additive window backstops save on timer-escaped errors and
  never claim window.onerror. S2-1: save() slims the blob (log→80) and warns once per
  outage on write failure. Harness: test/error_boundary.js.
- CLAUDE.md: sacred list retired → six-principle constitution; md5 gate re-scoped to a
  drift alarm (deliberate, same-commit baseline updates only); S2-2/S2-4/S3-1/S3-3
  unfenced into Phase 5; tuning contract recorded (naive 0 / S ~35-45 / P ~25-35 / V ~10-15).

## Phase 1 — shipped (all display/recording; frozen-three md5-identical = proof of zero odds change)
- Flight recorder: chronicle()→game.chain (≤60 causal facts at each transition's single
  point of truth: named deaths, ≥15 hull hits via chronHull() watcher, brownout onset
  with output/demand/hull, LS unpowered, cause-tagged anoxia (onset + every 3rd turn),
  starvation onset, pods unpowered, despair count, ATLAS hostile, fuel out, chose-brownout).
  game.firsts marks 16 systems/beats via first() at dispatch cases + beat functions.
- atlasTelemetry(): band-change narration ("Hull 62% — reactor capped at 12 of 20…",
  "Net oxygen −5.0/turn. At this rate: 9 turns of air."), fidelity gated on ATLAS
  integrity (>60 numbers / 28-60 the numbers slip / ≤28 silent).
- Brownout classroom: openAllocate prints the output = base × hull% derivation and
  per-row real consequences; the proceed button captions its exact cost.
- Post-mortem: renderEnd gains FLIGHT RECORDER (chain rows + ATLAS "Final analysis…")
  and, on losses, WHAT YOU NEVER FOUND (accusations, Act N of III, endings-seen count,
  the loss-rank-cap truth). endGame stores compact chain/firsts into meta.runs.
- The chase: showLogbook gains the 16-tier ENDINGS gallery (◼-silhouettes + one-word
  hints, legacy tiers auto-append), THE LADDER (best marked, delta-to-next, day-400
  truth), BEST PER DIFFICULTY. meta.tiersSeen/bestByDiff with loadMeta backfill.
- Honesty pass: title three-act line; How-to rewritten (The Arithmetic / The Long Dark /
  The Shape of the Story); store Tips → provisioning brief computed from live formulas;
  Settler/Voyager blurbs tell the truth; thrust/pods modals state their laws; hazard
  modals name visible danger drivers only (hidden meters stay hidden).
- Harness: test/onramp.js — a REAL suffocation death driven through the real dispatch,
  asserting chain → post-mortem → meta → gallery → honest onboarding, end to end.

## Verification
GATE PASS — 14 harnesses green; frozen-three md5-identical to the committed baseline;
endings_golden untouched. onramp/pending_persist/error_boundary added to the suite
(MIN_TESTS floor still 9; actual 14).

## STOP
Phase 2 next: RE-VERIFY mobile against the M-UI2b/M-UI2c fixes (the 06-27 audit's U1-x
items may already be closed) before porting anything; then the Phase-3 hardening wave
(the mercy layer) with a win-rate sweep per sub-wave against the tuning contract.

# ============================================================
# RE-VISION Phase 2 (2026-07-10) — Playtest patch-wave
# Colony fit · chart YOU/NEXT · full-ship honesty (+ locked forks)
# ============================================================

## Context
Tom's live play surfaced three defects. All fixed with browser-measured evidence
(1280×800 + 390×844) and pinned in the gate.

## Shipped
1. **Colony one-screen fix** (renderColony): verbs-first order (hud + banner + acts +
   hint + world + crew + log) — the season verbs sat at y≈816 in an 800px window, on
   desktop. Colony crew strip bounded (`.colony-crew .crew-strip` max-height + internal
   scroll); at ≤900px decoration yields (`.colony-vista`/`.col-hint` hidden, denser
   `.menu.row` buttons, 44px touch floor held). Measured: desktop verbs bottom 856→465;
   phone all 10 verbs on the first screen (bottom 842). layout_onescreen assertion (m).
2. **Chart legibility** (renderRouteMap/rmChart): ship carries a cyan **YOU** tag; the
   amber destination node's label reads **NEXT ▸ name**. Presentation only.
3. **Full-ship honesty** (DELIBERATE frozen-three change; baseline re-seeded this
   commit, applyOutcome only): recruit resolves first — at MAX_CREW a rescue's rewards
   (morale, their credits) no longer apply while shared-supply costs still do;
   recruit-bearing choices warn "no berths (8/8)" up front; crew headers read n/8 — full.
   BONUS: top-level `o.credits` (distress +90 / probe +260 / barter −80) was silently
   ignored by applyOutcome — prompts that lied in both directions — now honestly applied.

## Locked forks (Tom, this session)
- **Beacon → rare REAL reinforcement** (Phase 3): a beacon that reached a living Earth
  can, decades later on the physics' own timeline, bring an actual relief ship —
  double-edged, epilogue-aware; beacon endings stay demoted to SURVIVAL/EPITAPH.
- **Arrival converts the hold into colony founding capital** (Phase 3): food/meds carry;
  parts+ore→materials/infra; ice/volatiles→water; fuel banks toward the return launch;
  credits convert to nothing (and the game says so, coldly).
- **Crew cap**: defect fixed now; life-support-driven dynamic capacity in Phase 4.

## Verification
GATE PASS — 14 harnesses green; frozen baseline updated for applyOutcome alone
(resolveCheck/tryCompose md5-unchanged); browser evidence both viewports.

## STOP
Next: Phase 2.5 (docs/reality-audit.md — the tech bible) then the Phase-3 hardening
wave with a win-rate sweep per sub-wave.

# ============================================================
# RE-VISION Phase 2.6 (2026-07-10) — Systems-truth audit
# Succession · the journey home · colony machinery · cross-front UX
# Findings routed into Phase 3 (new sub-wave 3.0) and Phase 4. Audit only — no code.
# ============================================================

## Context
Tom asked for a serious look (not a fix pass) at whether the machinery does what the
buttons and fiction promise: taking over a life when you die, the flight home, every
colony verb, what power is based on, Scout clickable at 5/5 sites, life support pinned
at 100, colonists with no useful skill, research that leads nowhere, and switching from
the homebound ship back to the colony. Three line-level audits ran against E: HEAD
6703794 (= deployed Y). Verdict: the *structure* is sound (landmarks, ending
composition, split guards, stage transitions); the defects cluster in identity (one
global `youName`, no notion of fronts), economy leaks, and verbs that lie.

## Findings (line-cited at HEAD 6703794)
- **Succession:** no cross-front succession — dying as the last of one front leaves the
  player inhabiting nobody on the surviving front (L853, L2626→2935); `playerChar()`
  fallback has no Dead-guard and can rebind "you" to a corpse (L842); a hibernating heir
  is never woken and can end the run next turn (L852/854/864 vs L1293); end screen /
  records print the frozen origin `game.role` while the roster `*` moves (L5107/L4406/
  L3083 vs L4807); the split UI is youName-blind and `doLaunch` always flips the screen
  to the voyage (L2535); off-front avatar deaths never prompt (auto-step paths omit
  `maybeSuccession`). Intra-front core is sound and keeps: forced modal, autopilot
  teardown, mid-modal deferral; role-gated checks never misalign (they read crew .role).
- **Colony:** a powered, manned life-support axis structurally pins at 100 — prod
  (8+sysLvl·3)·factor always beats use (heads·drain·techEase) and no entropy touches a
  healthy axis (L1965–71), contradicting the "everything drains — triage" HUD (L4971);
  colonist `skill` is dead data read only in the expedition no-specialist fallback
  (L1774) — a colonist is `pop` with a name; Scout burns a season at 5/5 (button never
  disabled, L5005; effect inside `if(hidden.length)`, L1740–45) and Refit does the same
  at readiness 100/post-launch (L5008); five verbs charge the season on failed
  affordability because `col.year++` precedes every gate (L1955); `colPower` (output
  10+infra, 3 pwr + 1 hand per axis, L1509–18) makes brownout impossible once infra≥5 &
  hands≥5 (allocate turns decorative) and permanent under 5 hands; `popCap` is never
  read (L1588); infra/defense/sysLvl are unbounded flat-cost spam; children eat 1.0
  (ship: 0.5) and faceless `pop` "mans" life support; Research does real math
  (drain ×(1−tech/200), Work ×(1+tech/150), gates Settled) but unlocks nothing visible.
- **Journey home:** Rest/Scavenge advance the colony a full cycle but zero ship turns
  (L2995/3019→2932) and become completely FREE once `colonyDone` (L3024) — farm a parked
  ark to full, then cruise; fuel=0 freezes distance while the log says "coasts on
  momentum" (L2599–2600); no Cracked/breakdowns and no ATLAS on the crossing home —
  even `beginReturn`'s same ship (L1130/L1136 vs L2594); launch provisioning is
  invisible at commit and a lean colony under-provisions the ark (~45% of colony food,
  L2492–2501/L2522); `beaconHeard` is written from possibly-frozen belief (L2085) while
  arrival resolves on hidden truth (L2906); an arrival that reverses the crew's belief
  is never acknowledged (L2911–18); voyage power has no allocate UI (hidden half-
  scrubber brownout under ~hull 45, L2587/2602); metabolism differs from outbound
  (child 1.0/sleeper 0.0 vs 0.5/0.1); last-awake guard is count-only (a child can fly,
  L2968); voyage O₂ uncapped and misdisplayed (L2603).
- **Cross-front UX (Tom hit live):** the switch is one-way — voyage has "⇄ Tend the
  colony" (L5058) but the colony's "⇄ Ark —" line is inert text (L4942); no
  focus→voyage control exists. With the ark flying you cannot look at it again until
  its front self-resolves.
- **Dead promises (carried from the first review):** `col.petition` written, never read;
  `resolveActTwo` colonize/petition/return branches unreachable; colony has no birth
  path (`addChild` has zero colony call sites); event pools too thin for run length
  (outbound 20 → ~6–10 effective per zone; colony 12; return 10 with outbound dupes).
- **Repo:** M-UI3c (77734b3, homebound-chart orientation) stranded in the Dropbox
  clone — never picked into the E: re-vision line; reconcile before Phase 3.

## Routing (amendments adopted into the plan)
- **NEW Phase 3.0 — "The machinery tells the truth"** lands FIRST in Phase 3 (sweeps
  are meaningless while the economy leaks): front-switch symmetry (both strips become
  buttons; off-front avatar death surfaces immediately) · succession integrity (cross-
  front succession; Dead-guard; costed heir-waking; youName-aware split UI, screen
  follows YOU; lineage on the end screen; score-mult rule documented) · colony no-op
  gating (disable-with-reason; affordability before `col.year++`) · voyage economy
  integrity (Rest/Scavenge cost a ship turn; kill the post-colony farm; fuel-0 = named
  drift countdown; O₂ cap + metabolism parity; child-pilot warning) · Earth-fate
  coherence (`beaconHeard` vs truth lagged 4.24 yr; arrival acknowledges the reversal)
  · dead-promise excision (resolveActTwo; petition made real or cut).
- **Phase 3 amendments:** 3.2 gains colony life-support ENTROPY (axes never pin; the
  colony gets the ship's recovery<demand tension) + voyage Cracked/ATLAS-rides-home;
  3.4 gains the provisioning preview ("34 turns of food for 3 awake. You are carrying
  18."); 3.8 gains popCap enforce/retire + caps on infra/defense/sysLvl + colPower
  re-tension (demand grows with what you build); 3.10 gains the flat-success-line
  rewrite + pool expansion (outbound ≥35 / colony ≥24 / return ≥22, 2–3 variant bodies)
  behind a content-lint harness.
- **Phase 4 amendments:** 4.3 — colonists become people (trades assigned at creation
  and coming-of-age; colony verbs read the roster); NEW 4.7 — research leads somewhere
  (tech thresholds unlock named improvements from the tech bible; at-cap disables with
  reason); 4.4 folds in the epitaph/crew-memory device; 4.1 noted as the root fix for
  frozen-belief staleness on colony-only runs.
- **Do not churn (verified working):** landmark crossing, `tryCompose` end-race, split
  guards, stage transitions, modal-verbs-don't-burn-cycles pattern, intra-front
  succession core, focus never double-steps, allocate UI matches the engine.

## Verification (contracted for Phase 3.0)
New harnesses: succession_crossfront.js · colony_gating.js (no `col.year++` without an
effect) · voyage_economy.js (side-actions cost ship turns; post-colonyDone farm
impossible; fuel-0 countdown terminates) · a non-pinning assertion (60-cycle stable
colony must show life-support variance in the back 40). Phase 3.0 is ~odds-neutral
except the closed exploits — sweep before/after to prove the exploit-sized delta.
Full audit + routing detail: Tom's plan file (i-want-you-to-parsed-diffie).

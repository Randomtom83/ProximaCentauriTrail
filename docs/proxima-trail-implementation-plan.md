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

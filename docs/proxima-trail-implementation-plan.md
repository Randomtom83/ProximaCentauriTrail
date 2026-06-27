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
  shown **"Years since exodus"** on the colony HUD (~4343). Voyage HUD shows `"...· Year " +
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
Lives beside the `round1`/`clamp` utilities. Colony's stored `col.elapsedYears` stays as-is for its HUD; this
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

# M-INT1 — Endings composition (generalize `composeEnding` over colony × home × beacon)

## Context
P3-M4 split the homeward arrival into six distinct tiers, but `composeEnding` (the two-world composer) still
reads only the boolean `vWon` — so in any **two-world** ending those six tiers collapse into win/lose, and the
collapsed prose is now factually wrong for some states. A settled colony whose ark reaches home space to find
Earth **gone** (`TOO LATE`) or **silent** (`A SILENT SHORE`) emits *"the colony stands and grows — but the ship
that carried the news never made it home"* — yet the ship **did** make it home; Earth was simply gone or silent
when it arrived. M-INT1 generalizes the composer so each two-world state reads coherently, **without disturbing
any ending that is already correct**.

This milestone **unfreezes `composeEnding`** — one of the four functions the P3-M4 zero-diff gate holds
md5-identical. The md5 freeze stops protecting it; this plan defines the replacement safety net (a golden /
characterization harness, below) that locks the new composer to a **closed, declared set of changes**.

## Re-anchor — what exists at HEAD `22e600c` (verified against source; do NOT rebuild)
- **`tryCompose` (game.js:2836-2843):** ship-never-launched → colony fate alone composes (`!game.voyage`);
  otherwise waits for BOTH fronts (`colonyDone` && `voyageDone`) then calls `composeEnding`. **Unchanged by
  M-INT1** (the wait logic stays md5-identical).
- **`composeEnding` (game.js:2844-2863):** reads `c = game.colonyDone`, `v = game.voyageDone`,
  `beaconHeard = game.colony && game.colony.beaconHeard`. Three structural sections:
  - **(A) two-world `c && v` (2850-2855):** keys ONLY on `cWon` / `vWon` / `beaconHeard` — this is where the
    six voyage tiers collapse. Current cells:
    - `cWon && vWon` → **TWO WORLDS**
    - `cWon && !vWon` → **A WORLD, AND WORD** (beacon) / **A WORLD, AT LEAST** (no beacon)
    - `!cWon && vWon` → **THE MESSENGER**
    - `!cWon && !vWon && beaconHeard` → **THE WORD GOT THROUGH**
    - `!cWon && !vWon && !beaconHeard` → **EXTINCT**
  - **(B) colony-only `c` (2856-2860):** `!cWon && beaconHeard` → **THE WORD GOT THROUGH**; else passthrough
    `won=cWon; tier=c.tier; cause=c.cause` (+ beacon suffix when `cWon && beaconHeard`). **Already coherent —
    frozen byte-identical.**
  - **(C) voyage-only `v` (2861):** passthrough `won=vWon; tier=v.tier; cause=v.cause` — already surfaces the 6
    tiers. **Already coherent — frozen byte-identical.**
  - Then `endGame(won, cause, tier)` (2865).
- **The 6 voyage tiers — `voyageArrive` (game.js:2704-2721):** wins = **WORD WORTH CROSSING FOR** (`truth ≤ 1`,
  hull ≥ 55), **MESSENGER** (`truth = 2`, hull ≥ 55), **THE LONG WAY HOME** (hull < 55, crew ≥ 1); losses =
  **TOO LATE** (`truth ≥ 4`), **A SILENT SHORE** (`truth = 3`), **LOST WITH ALL HANDS** (crew = 0).
- **Colony tiers — `finishColony` (game.js:2293):** win **SETTLED** (1968); losses **WITHERED** (2304-2305, two
  causes) and **LIFE SUPPORT LOST** (2306). Note: section A reads only `cWon`, so WITHERED and LIFE SUPPORT LOST
  are indistinguishable in two-world endings (both `!cWon`) — re-tiering keys on `cWon`, preserving that.
- **Out of scope (note, do NOT touch):** `resolveActTwo` (game.js:1266, incl. the WITHERED at 1281) and any
  path that calls `endGame` **directly** — these BYPASS `composeEnding` and are not M-INT1 endings.

## Decision (locked) — ADDITIVE RE-TIERING
Preserve **every existing tier's prose byte-identical AND keep it reachable**; introduce **NEW tiers ONLY** for
the enumerated collapsed two-world cells whose current text is incoherent or materially under-stated. The named
input tuples move from the generic tier to a new tier **by design** — that is the milestone. No existing string
is reworded. (`homeClass` is derived from `v.tier`, not re-derived from `earth.truth`, so the truth→tier mapping
stays single-sourced in `voyageArrive`.)

### The CLOSED re-tier set (two-world `c && v` only — every other tuple is unchanged)
Derive `homeClass` from `v.tier`: `living` (WORD WORTH CROSSING FOR) · `changed` (MESSENGER) · `hard` (THE LONG
WAY HOME) · `gone` (TOO LATE) · `silent` (A SILENT SHORE) · `lost` (LOST WITH ALL HANDS). Re-tier keys on
`(cWon, homeClass[, beaconHeard])`:

| # | colony | homeClass (v.tier) | today's text | why | NEW tier |
|---|---|---|---|---|---|
| 1 | SETTLED | living (WORD WORTH CROSSING FOR) | TWO WORLDS | under-states a *mended* Earth + a 2nd world | **TWO WORLDS, AND A WAKING EARTH** |
| 2 | SETTLED | gone (TOO LATE) | A WORLD, AND WORD / AT LEAST | **FALSE** — "never made it home"; ship arrived, Earth gone | **A WORLD, AND AN EMPTY SKY** |
| 3 | SETTLED | silent (A SILENT SHORE) | A WORLD, AND WORD / AT LEAST | **FALSE** — same lie; ship arrived, Earth silent | **A WORLD, AND A SILENT SHORE** |
| 4 | WITHERED / LIFE SUPPORT LOST | living (WORD WORTH CROSSING FOR) | THE MESSENGER | under-states a *living* Earth (parallel to #1) | **THE MESSENGER, AND A LIVING EARTH** |

**Everything NOT in this table stays byte-identical and reachable**, including: SETTLED + {changed, hard} →
**TWO WORLDS**; SETTLED + lost (both beacon states) → **A WORLD, AND WORD** / **A WORLD, AT LEAST** (this cell
keeps those two strings reachable); failed + {changed, hard} → **THE MESSENGER**; failed + {gone, silent, lost}
→ **THE WORD GOT THROUGH** (beacon) / **EXTINCT** (no beacon); and all of sections B and C.

### Declared new text (pinned into the golden set as expected output)
Cells **1** and **4** are beacon-independent (the ship reached a living Earth and delivered word in person);
cells **2** and **3** are beacon-dependent (a beacon heard earlier, when Earth was still alive, is meaningful).
Six pinned strings total:

- **#1 — TWO WORLDS, AND A WAKING EARTH** (win): `"A colony takes root under an alien sun — and the ship crosses
  home to find Earth not dying but mending, strong enough to act on what you bring. Three cradles now, and the
  oldest one healing. Humanity is no longer all in one place, and the place it came from is getting back on its
  feet. " + c.cause + " " + v.cause`
- **#2 — A WORLD, AND AN EMPTY SKY** (win): `"The colony stands and grows — and the ship crossed the whole dark
  only to find the sky where Earth was gone quiet for good. " + (beaconHeard ? "Your beacon reached a living
  Earth years ago, before the silence closed in; somewhere in the record, they knew what you found. " : "Earth
  will never know what you built out here. ") + "The future has a foothold; the past has none. " + c.cause`
- **#3 — A WORLD, AND A SILENT SHORE** (win): `"The colony stands and grows — and the ship reached home space to
  find Earth still there but answering nothing, the receivers dark. " + (beaconHeard ? "Your beacon reached a
  living Earth years ago, before it fell silent; they had the maps, once. " : "Whatever happened to the cradle
  happened without a word reaching you. ") + "You carried the future to a new shore; the old one keeps its
  silence. " + c.cause`
- **#4 — THE MESSENGER, AND A LIVING EARTH** (win): `"The colony fell — but the ship reached a living, mending
  Earth with the maps, the warnings, and the survivors. They have the strength to try again, and a place worth
  trying for. Someone else will set out, knowing more. " + v.cause`

## Implementation shape
1. **Extract a pure `composeOutcome(c, v, beaconHeard)`** returning `{won, tier, cause}` with no side-effects.
   `composeEnding` becomes: derive the inputs, call `composeOutcome`, then `endGame(o.won, o.cause, o.tier)`.
   This is the unit-testable seam that replaces the md5 freeze.
2. **Sections B and C** inside `composeOutcome` are the SAME expressions as HEAD, line-for-line — frozen by the
   golden harness, not by md5.
3. **Section A** becomes a dispatch: compute `homeClass` from `v.tier`, then a table keyed `(cWon, homeClass)`.
   Every cell's DEFAULT is today's exact string (the coarse `cWon`/`vWon`/`beaconHeard` fold); the four cells
   above carry the OVERRIDE to their declared new tier/text.

## Golden-lock — characterization harness `/tmp/endings_golden.js` (replaces the md5 gate)
A **declared-output-match** harness (not a "no change" gate). Reuses the jsdom boot + brink-save pattern of the
existing harnesses (`/tmp/earthm4.js`, `/tmp/homehaz.js`), driving each ending to the live end screen and
scraping `{tier: #app h2 text, won: h2 win/loss class, cause: .small.dim text}`.
- **Enumerate the full reachable tuple space** `(colony ∈ {SETTLED, WITHERED, LIFE SUPPORT LOST}) × (home ∈
  {6 voyage tiers} ∪ {none}) × (beacon ∈ {heard, not})`, plus the colony-only (B) and voyage-only (C) rows.
  Two-world brink: preset `game.colonyDone = {won,tier,cause}` and `game.colony.beaconHeard`, set the voyage at
  the brink (`distance = total`, hull and `earth.truth` chosen to yield each `v.tier`), drive one
  `voyage:continue` → `voyageArrive → finishVoyage → tryCompose → composeEnding → endGame`.
- **HEAD snapshot:** run ON HEAD `22e600c` (pre-change), capture every tuple's `{won,tier,cause}` into
  `EXPECTED_HEAD` and pin it into the harness.
- **The CLOSED change set** = the six declared strings of cells #1–#4 (with the two beacon variants of #2/#3),
  pinned as `EXPECTED_NEW`.
- **Assertion both ways:** every tuple **NOT** in the change set → `{won,tier,cause}` byte-identical to
  `EXPECTED_HEAD`; every tuple **ON** the change set → equals its declared `EXPECTED_NEW` string. Net: only the
  four named cells change, and the change set is a closed, verifiable list.
- **No-orphan check:** every legacy tier (TWO WORLDS, A WORLD AND WORD, A WORLD AT LEAST, THE MESSENGER, THE
  WORD GOT THROUGH, EXTINCT, SETTLED, WITHERED, LIFE SUPPORT LOST, and the 6 voyage tiers) still appears for ≥1
  non-override tuple.

## Scope boundary
Endings composition ONLY. NOT the bidirectional focus toggle (**M-INT1b**). NOT balance / hazard / Earth-doom
probability tuning (**M-INT2**). `resolveActTwo` and the direct-`endGame` paths are untouched.

## Verification the build will commit to
- `node --check game.js audio.js`.
- **Golden characterization (`/tmp/endings_golden.js`):** off-list tuples byte-identical to HEAD; the four
  on-list cells emit their declared new text; full new-combo coverage (all four × applicable beacon variants);
  no legacy tier orphaned.
- **Narrowed zero-diff gate:** `applyOutcome` / `resolveCheck` / `tryCompose` stay md5-identical to HEAD — the
  gate shrinks from four functions to three; `composeEnding` is now covered by the golden harness instead.
- **Regression (all must stay green):** `crossingm2` + `homehaz` + `homesmoke` + `earthm4` + `colonyskel` +
  `colonym2..m6` + `colonyfix` + `decisionm1` + `arrivalfix` + `feattest` + `fuzz`.
- **Winnability:** a settled colony + a live-Earth arrival still composes a WIN (TWO WORLDS / TWO WORLDS, AND A
  WAKING EARTH); the re-tiering makes no timely run unwinnable.

## STOP
The two-world arc reads true: a colony that holds while Earth mends, holds while Earth falls silent, or holds
while the sky has gone empty, each end in their own words — and every ending that was already right is frozen,
byte-for-byte, by the golden harness that now stands in for the md5 gate.

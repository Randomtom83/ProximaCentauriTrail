---
file: proxima-trail-implementation-plan.md
project: Proxima Trail
chat: Oregon Trail to Proxima Centauri
date: 2026-0619
---

# Proxima Trail — Expanded Implementation Plan

## Context

Browser game reimagining *The Oregon Trail* in space: humanity flees a dying Earth aboard a colony
ship and must reach **Proxima Centauri b** to found a colony. Survival loop is intact — outfit at the
start, manage scarce interdependent resources, make pace/ration decisions, weather random disasters,
keep a crew of named characters alive, and arrive with as much intact as possible.

This version replaces the first-draft plan and is built around seven locked design decisions plus a
competitive-research pass.

## Locked design decisions

| # | Decision | Choice | Consequence for the build |
|---|---|---|---|
| 1 | Tone | **Mix** — comedic surface, occasional gut-punch | Deadpan event/ailment text; deaths land hard; bittersweet endings |
| 2 | Crew depth | **Personalities, morale, relationships** | Crew are characters with skills, morale, and bonds — not health bars |
| 3 | Length / difficulty | **Long / roguelike, punishing, high replay** | Tight economy, permadeath, run-based, death is common |
| 4 | Astronomy fidelity | **Semi-plausible** | Real bodies and ordering; travel time gameplay-abstracted |
| 5 | Audio | **Retro SFX only** | Web Audio synthesized beeps/alerts; no music track |
| A | Route model | **Roguelike feel on a fixed trail** | Same named route every run; variety from events/RNG/role/choices |
| B | Resources | **Interdependence (Out There-style)** | Power is a hub; every resource pull risks another |

## What the research changed (and why)

The space-survival-management niche is already held by **Out There** (premise: Earth dying, humanity
sends ships to establish new life) and **FTL** (Oregon Trail's resource loop in space, but combat-led).
Both are premium graphical apps. Findings that shaped this plan:

- **The wedge is the format.** A green-phosphor ASCII homage you open instantly in a browser, free, is
  not a known player in any "games like Oregon Trail" roundup. That is the thing to protect: zero
  install, zero build, terminal aesthetic.
- **Narrative is the modern differentiator.** The 2021 official remake's whole upgrade was developed
  narrative, dialogue, scenarios, and a larger cast. The bare mechanical loop alone reads as dated.
  → Decision 2C (crew as characters) is doing this work.
- **Resource interdependence is the genre's most-praised mechanic** (Out There: "spend fuel to get
  oxygen"). → Decision B2 adopts it as the core depth engine (see Power model below).
- **Fixed trail is a differentiator, not a limitation.** Out There's procedural galaxy is sprawling;
  Oregon Trail's single fixed trail is iconic. → Decision A1 keeps one route, roguelike *feel* coming
  from permadeath + event variety, not procedural generation. Less code, more faithful.
- **Crew psychology on a multi-year hibernation haul is native to interstellar travel** and absent from
  wagon-based homages. The Interstellar Void leg leans into this as the signature stretch.

## Oregon Trail → Proxima Trail mapping

| Oregon Trail | Proxima Trail |
|---|---|
| Wagon party (5) | Crew (commander + 4), each named, with health/morale/status/skill/bonds |
| Oxen / wagon | Ship drive + hull integrity + **reactor (power)** |
| Food (hunting) | Rations (replenished via asteroid-mining mini-game) |
| Ammunition | Mining charges |
| Spare parts / clothing | Spare parts + O₂ reserves |
| Money | Credits |
| Pace: steady / strenuous / grueling | Thrust: cruise / burn / overdrive (more speed → more fuel + power) |
| Rations: filling / meager / bare | Rations: full / reduced / survival |
| River crossings | Hazard zones (asteroid field, solar flare, nebula) — signature multi-choice "crossings" |
| Landmarks / forts | Waypoint stations (rest / trade / events) |
| Dysentery, cholera… | Radiation sickness, hypoxia, hibernation sickness, space dementia… |
| Hunting trip | Asteroid-mining mini-game |
| — *(new)* | **Hibernation** — trade time/power for O₂ + food savings, at psychological risk |

## The Power model (decision B2 — the depth engine)

Power is the hub resource. Every turn the **reactor** produces power; systems draw it. When demand
exceeds supply you hit a **brownout** and must shed load — the core tense decision.

**Reactor output** = `base_output × (hull_integrity / 100)`. Damaged hull → less power → cascading
shortfalls. This is how a micrometeoroid strike three turns ago becomes an oxygen crisis now.

| System | Power draw | What it does | Interdependency |
|---|---|---|---|
| Life support (O₂ scrubbers) | High | Recycles O₂ each turn | Under-powered scrubbers → O₂ net-drains |
| Drive (thrust) | Scales with thrust | Distance per turn | Also burns fuel; overdrive spikes both |
| Medbay | Medium (when treating) | Treats ailments | No power → treatment fails or costs more medicine |
| Hibernation pods | Low per sleeper | Keeps hibernating crew alive | Cuts that crew's O₂/food to near-zero |
| Sensors / nav | Low | Improves hazard navigation odds | Off → hazard crossings get a penalty |

**Worked baseline (5 crew, all awake, cruise):**
- O₂: `5 crew × 1.0/turn = 5.0 consumed`. Scrubbers at full power recover `4.0` → **net −1.0/turn**,
  drawn from O₂ reserves. So awake-everyone is *always* slowly losing O₂ — the player must hibernate,
  trade, or mine to stay ahead.
- Food: `5 crew × 1.0/turn × ration_multiplier` (full 1.0 / reduced 0.6 / survival 0.3).
- Fuel: `thrust_fuel[thrust]` per turn (cruise 2 / burn 4 / overdrive 7).
- Power demand vs. output is recomputed every turn; shortfall triggers the load-shed prompt.

> These are **first-pass tuning values, not balance gospel** — they're chosen so "everyone awake forever"
> is unsustainable and hibernation/mining are mandatory pressure-relief valves. Expect to tune after
> playtests. All burn math above is shown so it can be sanity-checked.

**Hibernation (new mechanic):** pod a crew member → their O₂ and food drop to ~10% of awake, but pods
cost power, they can't act in events (a hibernating Pilot can't help you thread an asteroid field), and
each turn asleep accrues hibernation-sickness risk and a slow morale drift. The Interstellar Void leg is
long enough that you *must* hibernate most of the crew — and decide who stays awake to fly.

## Crew system (decision 2C)

Each crew member:

```
{ name, role, health(0–100), morale(0–100), status, skill(0–100), bonds:[names] }
status ∈ Healthy | Sick | Injured | Hibernating | Cracked | Dead
```

**Roles & skill effects** (role skill modifies the matching outcomes):

| Role | Skill improves | If dead, you lose |
|---|---|---|
| Commander | Passive crew-morale floor; tie-breaks event choices | Morale stability |
| Engineer | Repair quality, lowers parts cost, reactor uptime | Cheap/effective repairs |
| Pilot / Navigator | Hazard-crossing odds, lost-time events | Safe hazard navigation |
| Medic | Treatment success, lowers medicine cost | Reliable healing |
| Xenobiologist | Derelict salvage, alien/probe events, research finds | Good encounter outcomes |

**Morale** (0–100): drained by deaths, low rations, prolonged hibernation, failed events, cramped time;
raised by rest, good rations, successful events, reaching waypoints. Low morale → work penalties, then
**breakdown** events (space dementia, refusal, sabotage). A crew member who hits 0 morale can **Crack**
— locks a system, wastes resources, or worse. This is the tone-1D gut-punch surface.

**Relationships / bonds:** specific crew are bonded. When a bonded crewmate dies or is badly hurt, the
partner takes a morale hit — emergent tragedy that makes each death matter (the roguelike weight from
decision 3C). Losing a *specialist* also removes their mechanical benefit, compounding the spiral.

## Files to create

- **`index.html`** — screen containers (title, role select, store, travel, event modal, hazard-crossing,
  mini-game, end screen) + the status HUD (with a power bar and per-crew strip); links `style.css`,
  `game.js`.
- **`style.css`** — retro CRT terminal theme: `#0a0a0a` bg, phosphor green `#33ff66`, monospace stack,
  optional scanline overlay, blinking cursor, amber/red warning accents, ASCII-friendly panel borders.
- **`game.js`** — all game logic (state, data tables, render/routing, turn loop, power model, events,
  hazard crossings, mini-game, crew/morale resolution, scoring, save). Single file to honor *no build*;
  may be split into plain `<script>` files (`data.js` + `game.js`) if it grows — still no bundler.
- **`audio.js`** *(or inline)* — small Web Audio SFX module (synthesized beeps; no asset files).
- **`README.md`** — what it is, how to run (open `index.html` or `python3 -m http.server`), how to play.

## game.js architecture

**State object:**

```js
game = {
  screen, role, difficulty, credits, day, distance, totalDistance, waypointIndex,
  thrust, rations,
  ship: { hull, parts, reactorBase },
  power: { output, demand, allocation:{lifeSupport, drive, medbay, pods, sensors} },
  supplies: { fuel, oxygen, food, medicine, charges },
  crew: [ {name, role, health, morale, status, skill, bonds} ],
  log: [],
  runHistory   // persisted score/run records
}
```

**Data tables (constants at top):**

- `WAYPOINTS` — fixed ordered route: Earth Orbit (start) → Lunar Gateway → Ares Station (Mars) →
  Asteroid Belt (hazard + mining) → Jupiter Slingshot → Titan Depot (Saturn) → Heliopause / Oort Cloud
  → **Interstellar Void** (long hibernation haul) → Proxima Approach (hazard) → **Proxima Centauri b
  (win)**. Each: name, distance-from-previous, blurb, flags (station? hazard? mining?). Distances are
  gameplay-abstracted; an in-game note says they are not literal light-years.
- `ROLES` — Commander / Engineer / Pilot / Medic / Xenobiologist; starting credits + scoring multiplier
  (mirrors banker/carpenter/farmer). Higher-skill-floor roles = lower score multiplier.
- `STORE_ITEMS` — fuel, oxygen, food, parts, medicine, charges; unit prices.
- `EVENTS` — **~30 weighted events** (first pass), each tagged with the zones/states it can fire in, with
  text, effects, and optional **choices that run a skill check** (`crewSkill + rng vs. difficulty` →
  branch). Categories: mechanical (micrometeoroid, reactor fluctuation, hull breach, system malfunction),
  medical (illness outbreak, flare radiation), crew/morale (breakdown, bonding moment, stowaway, mutiny
  seed), encounters (derelict → salvage/trade/danger, distress signal, alien probe → Xenobiologist),
  fortune (supply cache, clean slingshot), navigation (course drift → lost time, sensor ghost).
- `HAZARDS` — dedicated multi-choice "crossing" events (the river-crossing analog), one per hazard zone:
  - **Asteroid Belt** — thread it (Pilot check) / power through (hull risk) / go around (time + fuel).
  - **Solar Flare** — shields up (power) / hide behind a body (time) / ride it out (radiation risk).
  - **Nebula** — sensor-blind navigate (Pilot + sensors power) / wait it out (O₂/food cost).
  - **Proxima Approach** — final gauntlet combining the above under low reserves.
- `AILMENTS` — radiation sickness, hypoxia, hibernation sickness, space dementia, etc.; progress over
  turns, drain health/morale, treated by medicine + powered medbay.
- `SFX` — event→sound map (see Audio).

**Turn loop (`advance()`):**
1. Add days + distance per `thrust`.
2. Compute reactor `output` from hull; compute `demand` from allocation; if `demand > output` →
   **brownout prompt** (shed load) before continuing.
3. Consume fuel (thrust), O₂ (awake crew − scrubber recovery), food (awake crew × rations).
4. Apply ration effects to health; resolve ailments; apply hibernation risk/morale drift to sleepers.
5. Resolve morale (deaths/rations/events) → trigger breakdown/Crack checks.
6. Roll one weighted event valid for the current zone/state.
7. Degrade hull slightly; check waypoint arrival (→ station/hazard handling).
8. Check loss/win conditions.

**Player actions (travel screen):** Continue · Check ship status (full readout incl. power ledger) ·
Set thrust · Set rations · Allocate power (load-shed) · Manage hibernation (pod / wake crew) ·
Rest & repair (time + parts + power → heal hull/crew) · Trade (stations only) · Mine asteroids
(mini-game, at the belt / when permitted).

**Mini-game (asteroid mining = hunting analog):** DOM-based; resource nodes appear in a field, player
clicks to mine within a time/charge limit; yields food/fuel/parts. Costs **charges *and* fuel** (maneuver
to asteroids), so it's net-positive only with good play. Pure vanilla JS + `setTimeout`, no canvas —
keeps the terminal feel.

**Loss conditions:** all crew dead; O₂ 0; stranded with 0 fuel and no path; total hull failure; prolonged
starvation; whole-crew morale collapse (mutiny/abandon). **Win:** reach Proxima Centauri b → colony screen.

## Save system (open item — my call: autosave-resume + permanent death)

Roguelike permadeath, browser-friendly:
- **Single-slot `localStorage` autosave** of the *current* run after each turn → close the tab, resume the
  same run later. No multi-slot, no manual save (prevents save-scumming).
- **Death is permanent:** on a loss, the run save is cleared and converted into a **run-history record**
  (score, rank, cause of death, day reached). No reload-after-death.
- **Persistent meta:** best score, ranks unlocked, run log — survives across runs for the high-replay goal.
- *Stretch variant (noted, not default):* Out There's "saving costs a resource." Punishing; likely too
  harsh for a browser homage. Flag for later, off by default.

## Scoring & ranks (open item — my call)

Classic Oregon Trail tabulation, computed on the end screen:

```
score = ( Σ surviving_crew(health, morale weighted)
        + remaining_supplies + credits + hull + speed_bonus(fewer days) )
        × role_multiplier × difficulty_multiplier
```

Show the breakdown line-by-line (transparent, checkable). Rank ladder (space-themed, thresholds TBD in
tuning), e.g.: *Castaway → Drifter → Navigator → Colonist → Founder of Proxima*. Surviving with the full
crew + a hard role should be the only path to the top rank.

## Audio (decision 5B — SFX only)

Web Audio API, oscillator-synthesized — **no asset files**, preserves no-build:
- UI: keypress blip, menu select, confirm/cancel.
- Travel: per-turn tick, low-fuel/low-O₂ warning tone, **brownout alarm** (distinct, urgent).
- Events: alert sting (bad), chime (good), crew-death tone (somber — sells tone-1D).
- Mini-game: mine-hit blip, charge-empty buzz.
- Master mute toggle in the HUD; respects first-gesture autoplay rules (init audio on first click).

## Verification

- **Syntax:** `node --check game.js` (and any split files) — no test framework.
- **Serve:** `python3 -m http.server 8000` → `http://localhost:8000` (or open `index.html`). Play through:
  1. Title → pick role → store buys deduct credits correctly.
  2. Travel: Continue advances day/distance; resources decrement; events fire; log scrolls.
  3. Thrust/rations changes visibly alter fuel/food/power burn and crew health over several turns.
  4. **Power:** damage hull → reactor output drops → brownout prompt appears → load-shed resolves.
  5. **Interdependence:** under-power scrubbers → O₂ net-drains (confirm the −1.0/turn baseline math).
  6. **Hibernation:** pod crew → O₂/food consumption drops; hibernation-sickness/morale risk accrues;
     a hibernating Pilot is unavailable in a hazard crossing.
  7. **Crew/morale:** drive morale to 0 → breakdown/Crack fires; kill a bonded crewmate → partner morale hit.
  8. Hazard zone (e.g., asteroid belt) → multi-choice crossing resolves with skill check + consequences.
  9. Mining mini-game → charges *and* fuel spent, supplies gained.
  10. **Save:** mid-run reload resumes same run; force a death → run save cleared, score logged, no reload.
  11. Force a loss and a win → end screen shows score breakdown + rank.
  12. Confirm retro styling (green phosphor, monospace, scrolling log) and SFX fire (incl. brownout alarm).

## Commit & PR

- Develop on the working branch, commit the files (`index.html`, `style.css`, `game.js`, optional
  `audio.js`/`data.js`, `README.md`), push with `-u origin`, open a ready-for-review PR describing the
  game, the power/interdependence model, and how to run it.

## Open tuning items (deliberately deferred to playtest)

- Exact economy numbers (prices, starting credits, reactor base output, scrubber recovery rate).
- Event weights and skill-check difficulty curves.
- Rank thresholds and role/difficulty multipliers.
- Interstellar Void length (how many forced-hibernation turns feels epic vs. tedious).

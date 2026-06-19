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

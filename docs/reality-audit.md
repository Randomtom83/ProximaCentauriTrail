---
file: reality-audit.md
project: Proxima Trail
date: 2026-07-10
purpose: The tech bible. Where a real method exists, name it and derive the mechanic from it.
---

# Proxima Trail — Reality Audit (the tech bible)

**The rule (top of the constitution's "the arithmetic doesn't care"):**
> Where the method is **KNOWN**, name it and derive the mechanic from it. Spend the fiction
> budget on **exactly two** premises (the drive, and cold sleep). Keep the mysteries mysterious.

This doc records the real science behind each system so Phase 3/4 mechanics are *derived*, not
re-invented. Sourced from the 2026-07-10 design discussions with Tom.

---

## The classification (every game system)

**✅ KNOWN — we do this today; the only design decision is which method**

| In the game | Real-world basis | Design note |
|---|---|---|
| Scrubbers / O₂ | ISS: water electrolysis makes O₂ (power-hungry); CO₂ removed by consumable LiOH (Apollo/Soyuz) OR regenerable zeolite beds (ISS CDRA); Sabatier closes ~50% of the loop | O₂ is really *stored as water*; the enemy is CO₂, not missing O₂. Decision: LiOH-style **filters** consumable vs regenerable-bed maintenance. See Phase-3 item 9. |
| Reactor / power-as-hub | Space fission is flown (SNAP-10A 1965; Kilopower/KRUSTY 2018). A reactor lives or dies by **heat rejection** — radiators are the biggest, most fragile part | Rename "hull caps reactor output" as **radiator damage** and the core mechanic becomes literally true. |
| Micrometeoroid / hull | Whipple shielding; interstellar dust at fractional-c is a real studied hazard | Already honest. |
| Solar flare / radiation | Storm shelters, mass shielding. **Proxima is a flare star** | The final-approach flare hazard is the most astronomically correct beat in the game. |
| Morale / bonds / "Cracked" | Mars-500, HERA, Antarctic-overwinter studies | Documented reality. |
| Earth signal + light-lag | We talk to Voyager daily; 4.24 ly = 4.24-yr one-way lag | Game UNDER-uses it; the Phase-4 light-lag item makes it honest. |
| Water recycling | ISS recycles >90% | **Absent from the ship game** — a gap worth filling. |
| Colony ISRU (air/water/materials) | MOXIE made O₂ on Mars (2021); regolith 3D-printing prototyped | The colony's automatic economy is "known, unscaled." |
| Ark fuel synthesis | Sabatier methane is SpaceX's actual Mars-return plan | Makes "ark fuel is a colony product" MORE real (Phase-3 item 8/10). |
| Contamination / ecoHarm | COSPAR planetary-protection policy | Real domain. |
| Proxima b | Real planet (2016): habitable zone, tidally locked, flare star | The colony's "Cycles, not years" clock matches tidal locking. |

**🔧 ENGINEERING GAP — physics understood, hardware unbuilt**
- Stations at Moon/Mars/Titan (Lunar Gateway in progress; rest is scale-up).
- Asteroid mining (sampled & returned — OSIRIS-REx, Hayabusa — never *mined*).
- ATLAS: autonomous ship AI is mostly known now; decades-long unattended reliability isn't. The degrading-narrator arc is well-aimed fiction.
- Reproduction in transit: mammalian gestation in space unstudied beyond mice. **Spin gravity** (known physics, unbuilt) is the fix — see below.

**❓ THE TWO ALLOWED FICTIONS (the whole fiction budget)**
1. **The drive.** ~5–10% c needs fusion (Daedalus/Icarus on paper), beam sails (Starshot, gram-scale), or nuclear-pulse **Orion** (buildable with 1960s tech; treaty-banned, not impossible). **NAME IT** in a fiction-bible entry.
2. **Cold sleep.** Human torpor research gets weeks, maybe. Decades is fiction — and load-bearing: the void is uncrossable without it.

**🔮 DELIBERATE MYSTERIES (correctly fictional — keep mysterious)**
Wormholes · first contact · the natives · the galaxy's central black hole.

---

## Oxygen — the method decision (Phase 3 item 9)

Real spacecraft split two problems: **make O₂** (electrolysis of stored water, power-hungry)
and **remove CO₂** (the thing that actually kills you).

- **Consumable scrubbers (LiOH)** — Apollo/Soyuz/Shuttle. Canisters *saturate*. This is the
  Apollo 13 story (square canister, round socket, duct tape). → Model as a **filters** stock:
  scrubbers eat filters; out of filters, scrubbers stop; stations sell them. **Kills the
  drift-forever zombie state (audit S3) at its root** — a fuel-dead ship still suffocates.
- **Regenerable beds (zeolite, CDRA)** — bake out CO₂ with heat + vacuum, reuse; need constant
  **power** and break down constantly. → Model as scrubber efficiency tied to power + upkeep.
- **Oxygen candles (perchlorate)** — one-shot emergency O₂; caused the 1997 Mir fire. →
  Purchasable one-shot item with a small fire-event risk. Historically true, beautifully cruel.
- **Sabatier** closes only ~50%; nobody has ever fully closed the loop (Biosphere 2 failed;
  ESA MELiSSA algae bioreactors are the research path). → A closed colony always needs input.

**Numbers:** ~0.84 kg O₂/day consumed, ~1 kg CO₂/day exhaled per person. A decades crossing
without near-perfect recycling is impossible — which is exactly why the game's "freeze almost
everyone" answer is the most realistic thing in it.

---

## Colony genetics & repopulation (Phase 4 items 3, 3b)

Colony expansion is a **genetics** problem, and it's one of the field's most worked-out.

- **Founder effect:** a small founding pool → inbreeding depression (recessive disease, falling
  fertility, infant mortality) + genetic drift (traits lost by chance).
- **Minimum Viable Population:** the **50/500 rule** (50 short-term, 500 long-term). Moore
  (2002): ~150–180 with social engineering. Cameron Smith (2014), proper pop-genetics:
  **~10,000–40,000** to be safe, ~98 as a theoretical floor under strict breeding control. The
  gap between "98 if perfectly managed" and "40,000 to be safe" *is the drama*.
- **Managed breeding** — zoos run **studbooks** minimizing mean kinship (PMx software).
  Reproduction as an assigned, managed resource, not a private choice. Dark, and real.
- **The diversity hedge — cryobank (Embryo Space Colonization):** ship a small live crew + a
  huge bank of frozen embryos/gametes. A tiny live population maintains a vast effective gene
  pool; periodically introduce "new blood" to reset relatedness. Cryobanking is proven (IVF;
  San Diego's Frozen Zoo produced live births — a ferret, a Przewalski's horse — from
  decades-old frozen cells). Solves MVP at near-zero mass.
- **The one gap:** the **artificial womb** (ectogenesis) — partial only (2017 "biobag" lambs).
  Route around it: a small live crew gestates from the bank the slow way.

**Game mechanic (Phase 4 item 3b):** the ship carries an embryo/gamete bank; it needs power
(power-as-hub reused). Losing it to a brownout is a **quiet extinction** — a second hidden doom
clock beside Earth's, surfaced diegetically (a doctor's worry, a stillbirth pattern), never a
number. Below viable diversity → an irreversible genetic spiral, a loss condition that isn't
starvation, revealed fully only in endings/epilogue.

---

## Species continuity — the real "plan" (Phase 4 item 3c)

The honest fact: **as a species we have no coordinated plan; no institution is assigned this.**
Everything real is a fragment:
- **Svalbard Global Seed Vault** (2008) — the working prototype of the whole philosophy:
  passive, cold, redundant, neutral, far away. Already *used* (Syria/ICARDA withdrawal).
- **Frozen Ark / Frozen Zoo** — cryopreserved DNA/cells/gametes; live births demonstrated.
- **Lunar Biorepository** (2021–24 proposal) — passive cryostorage in the Moon's −200°C
  permanently-shadowed craters: a biosphere backup off-planet.
- **Arch Mission** — knowledge backups (crash-landed on the Moon aboard Beresheet, 2019).
- **DART** (2022) — the ONE executed, funded, successful species-level action to prevent an
  extinction event (deflected an asteroid). And it's about *not dying*, not repopulating.
- **The near-term reality:** global fertility is falling below replacement (2.1); UN projects a
  peak ~10.3 B in the 2080s then decline; South Korea ~0.7. The response is scattered national
  tax incentives, not a plan.

**The through-line, and the game's true spine:** we know exactly *how* to repopulate — the
genetics, cryobanks, managed breeding are settled or demonstrated — and **no one is assigned to
do it.** The knowledge is complete; the coordination is absent. Proxima Trail's premise verbatim:
*there was never a plan; Earth is dying; this is an improvised, under-resourced scramble by
whoever got a ship built.* Make it explicit in the fiction — why one ship, why it's this hard,
why the message home *is* the plan arriving late (Phase 4 item 3c).

---

## Arrival conversion table (Phase 3 item 8)

Ship stores are currently discarded at `beginColony`; the colony starts from a fixed template
regardless of what you carried. In reality the hold **is** the colony's seed capital.

| You bring | Becomes at the colony |
|---|---|
| Food / medicine | Colony food / meds (direct) |
| Spare parts + mined ore / rare metals | Starting **materials** + an **infra** bump (first habitats) |
| Ice / volatiles | Starting **water** + air feedstock |
| Remaining fuel | Banked toward the **return-launch** (ties to ark-fuel-as-colony-product) |
| Credits | Nothing — "Credits are Earth's idea. Nobody out here is selling." |

Arrive fat → found from strength; limp in empty → Act II opens desperate. Balance-sweep after.

---

## Beacon physics (Phase 3 item 5)

A beacon crawls home at light speed: **4.24 years** just to arrive. For a reply/ship: 4.24 yr
there + build/launch years + a crossing at the game's own travel rate (decades of colony
cycles). Layered on the doom clock, Earth is likely silent long before any of it completes.

**Decision (Tom):** a beacon that reached a *living* Earth can — **rarely, and only on that
timeline** — bring a real relief ship (colonists = mouths AND hands, supplies, a hope surge, its
own strains). If the colony is dead when it arrives, the epilogue says so. It's a live-play
payoff, not an ending inflation; beacon endings stay demoted to SURVIVAL/EPITAPH. Also: cost the
beacon a browned-out season, and resolve `beaconHeard` against `earth.truth` lagged 4.24 yr,
revealed only in the epilogue.

---

## Open method-decisions for Tom
1. **Scrubbers:** consumable filters (Apollo-13 model, recommended — kills S3) vs regenerable-bed maintenance vs both.
2. **The drive:** name it — fusion torch / beam-sail / Orion-pulse? (Sets a fiction-bible entry + flavor.)
3. **Cryobank:** hidden meter (like Earth-doom) vs a visible strategic resource you spend.
4. **Ark home carries the backup?** Should the return ship carry a Svalbard-style colony/seed backup, so "word home" is literally "the backup arriving"?

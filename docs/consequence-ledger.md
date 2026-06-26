---
file: consequence-ledger.md
project: Proxima Trail
chat: Oregon Trail to Proxima Centauri
date: 2026-06-24
---

# Proxima Trail — Act II Consequence Ledger (P2-M0)

The spine the whole back half hangs on. **Locked before any Act II game code** so every later milestone
wires its consequences against one consistent contract. Tom's standing rule: *every action/selection has
(a) a visible immediate effect AND (b) at least one hidden long-tail consequence that compounds and
re-surfaces — as a delayed event and/or an ending beat.* Consequences are **mixed-horizon**: the
immediate effect is shown; the long-tail is hidden until it surfaces.

This doc is design only — it defines meters, thresholds, writers, readers, named payoff events, and the
action→consequence rows. Each implementation milestone (P2-M1…) must wire its features to match these
rows, and **no hidden meter ships without ≥1 writer AND ≥1 reader** (the M-INT2 audit enforces this).

---

## 1. Meters

### Visible (shown in the HUD)
- **Survival spine** (`air, water, food, warmth, health`), 0..100 — produced and drained each turn; the
  moment-to-moment squeeze. Below thresholds → ailments, death, `hope` loss. (Detailed in P2-M1.)
- **`hope`** 0..100 — the colony's will. The one *visible* morale-class meter; 0 = abandonment (lose).
- **`elapsedYears`** (the Years-Since-Exodus clock) — total time since leaving Earth across Phase 1 +
  colony + return. Surfaced visibly in P3-M4; it is the dread engine for Earth's fate.

### Hidden (felt, never shown as a number — they surface as events and ending beats)
- **`ecoHarm`** 0..100 — how badly you've scarred the biosphere.
- **`nativeTrust`** 0..100 — the natives' deep read of you (slower, stickier than the visible
  `relations` surface meter).
- **`contamination`** 0..100 — accumulated biological/chemical hazard load from cutting corners.
- **`structuralDebt`** 0..100 — corners cut in construction + materials robbed from the ship.
- **`trauma`** 0..100 — the crew's psychological wear (slower and stickier than `hope`/morale).

### Surface vs deep: `relations` vs `nativeTrust` (only when `dest.inhabited === "natives"`)
- **`relations`** (visible, 0..100) — the natives' **surface stance right now**: drives immediate trade
  availability/prices and whether the next encounter reads friendly or tense. Fast-moving; reacts to your
  last few actions.
- **`nativeTrust`** (hidden, 0..100) — their **deep, slow read** of you over time: stickier; gates the
  big forks (alliance / petition / the decisive Reckoning). The reputation that remembers.
- **Relationship:** `nativeTrust` sets the ceiling/floor that `relations` gravitates toward. A single
  fair trade nudges `relations` up today; only a *pattern* moves `nativeTrust`. Aggression can crater
  `relations` immediately, but `nativeTrust` carries the grudge into the endings.

### Global rules (apply to every hidden meter)
- **Difficulty scaling (P2-M0.1):** all hidden-meter **thresholds, payoff-event odds, and passive-decay
  rates scale with the existing `DIFFICULTY.harsh` dial**, exactly as Phase 1 scales drains/hazards.
  Settler — thresholds sit higher (meters bite later), payoffs fire less often, passive decay faster;
  Voyager — the inverse. **Exact multipliers are deferred to the M-INT2 win-rate sweep**; milestones wire
  the *hook* (a tier-scaled threshold/odds/decay helper), not the numbers.
- **Recovery model (P2-M0.1 — "bodies and minds heal; the world and structures don't"):** see the
  per-meter **Recovery** lines in §2. Passive recovery is **gated** (only ticks when the front is *safe*
  — no active famine/anoxia/outbreak/raid — AND `hope` ≥ floor; crisis turns pause healing) and **slow**
  (much slower than the writers — you're nursing, not erasing). It keeps a long colony from becoming an
  unwinnable doom-ratchet while leaving world/structure damage sticky.

---

## 2. Meter contracts (writers · readers · thresholds · named payoff)

Every meter below has **at least one writer and one reader** — no orphans.

### `ecoHarm` (hidden)
- **Writers (↑):** burn forest for fuel/farmland; over-mine a site; clear ground for habitats (small);
  industrial refining. **Live (P2-M3):** Expeditions that exploit a site (`expeditionRisk`/`doExpedition`),
  tier-scaled. **(↓):** choose geothermal/renewable over extractive; restoration research. **Reducer LIVE
  (P2-M5):** the Restore/Rewild season action (`applyColonyAction "restore"` — 8 materials + a season,
  `ecoHarm −tierDecay(10)`) is the ONLY way ecoHarm comes down — there is NO passive recovery.
- **Readers:** blight/odd-weather event chance scales with it; biosphere-backlash hazard severity; bleeds
  −`nativeTrust` over time; ending beats. **Live (P2-M3):** `colHabDrain` multiplies the per-season
  survival drain by `(1 + ecoHarm/120)` — a scarred world is harder to live on every turn.
- **Thresholds:** <25 negligible · 25–60 occasional blight/strange weather · >60 recurring backlash +
  biosphere-collapse risk.
- **Recovery (P2-M0.1):** **none passive.** The world stays scarred — only restoration research /
  renewable choices reduce it.
- **Named payoff event — "The Ground Remembers"** (fires past ~60): a coordinated backlash
  (spores/blight/migration) — heavy food + health hit; colors a **Scorched** ending beat.

### `nativeTrust` (hidden; only when `dest.inhabited === "natives"`)
- **Writers LIVE (P2-M5):** **(↓)** seizing a site (`doContact "displace"`), war (`doNativeWar`),
  Fortify (a wall reads as a threat), the per-season `ecoHarm`-spillover bleed AND the **`col.woke` bleed**
  (Decision A — disturbing what the natives hold sacred costs you their trust); **(↑)** fair trade, sharing
  medicine, Parley (Xenobiologist), Restore, restraint, and the allied Reckoning. *(Audit fix: it MUST be
  raisable, not one-way doom — confirmed live both directions.)*
- **Readers LIVE (P2-M5):** the per-season **gravitation** (sets the ceiling/floor visible `relations`
  drifts toward, ≤2/season); the **raid hazard `danger()`** (low trust escalates raids, high trust abates
  them → "aid arrives"); the **Reckoning gate**; the words-only render hint. (Trade prices / petition
  alliance ending fork read it later at compose time.)
- **Thresholds:** <25 hostile (raids, paths closed) · 25–60 wary (transactional) · >75 allied (aid,
  gifts, shared defense, merger ending). Harsh-scaled via `tierThreshold`.
- **Named payoff event — "The Reckoning at the Treeline" LIVE (P2-M5)** (bidirectional, fires once late,
  `year ≥ 4`): high trust (≥75) → they decisively stand WITH you (`nativeStanding="allied"`); low trust
  (≤`tierThreshold(22)`) → they move AGAINST you (`nativeStanding="hostile"`). Both consume the shared
  `flags.p_reckon`. The wipeout (`doNativeWar`) pre-consumes it and sets `nativeStanding="displacers"`.
- **Persisted ending-fork fields (M-INT1 reads):** `nativeStanding` (allied/hostile/displacers),
  `nativesGone` (wipeout), `settlerStanding` (merged/rivals); plus `nativeTrust` itself for the petition/
  alliance threshold read at compose time.

### `contamination` (hidden)
- **Writers (↑):** eat unscreened local biology (pre-research); drink unreclaimed water; skip the
  infirmary; overcrowd habitats; cut survival corners to grow fast. **(↓):** biosphere research; build
  the infirmary; sanitation projects.
- **Readers:** a sickness-wave event whose severity scales with it; failed-harvest (crop-disease) chance;
  raises per-turn ailment frequency.
- **Thresholds:** <25 clean · 25–60 simmering (sporadic illness) · >60 outbreak-prone.
- **Recovery (P2-M0.1):** **passive** while the front is *safe* and `hope` ≥ floor — bodies recover
  (slow); faster via the infirmary / sanitation projects.
- **Named payoff event — "The Fever Season"** (fires past ~60): a colony-wide illness wave — multiple
  colonists sicken, deaths scale with `health`/Medic; colors a **plague-scarred** beat. *(Audit fix:
  this is the concrete payoff `contamination` was missing.)*

### `structuralDebt` (hidden)
- **Writers (↑):** strip the landed ship for shelter (big); rush builds without proper materials; build
  on bad ground; skip maintenance. **(↓):** reinforce/repair projects (cost materials + time).
- **Readers:** **return-ship refit cost & time scale UP with it** (ties directly to `shipReadiness` — so
  "strip now" visibly taxes "leave later"); a late structural-collapse hazard; habitat-loss event.
- **Thresholds:** <25 sound · 25–60 strained · >60 failing (collapse risk; refit nearly impossible).
- **Recovery (P2-M0.1):** **none passive.** Structures don't self-heal — only reinforce/repair projects
  (materials + time) reduce it.
- **Named payoff event — "The Long Crack"** (fires past threshold): a major structure fails — habitat/
  power loss + casualties — and visibly inflates the refit cost the moment you try to leave.

### `trauma` (hidden)
- **Writers (↑):** each death witnessed; brutal expeditions; the famine winter; killing natives;
  abandoning people; hibernation. **(↓):** Tend (slow heal); long stretches of safety + good `hope`.
- **Readers:** morale-breakdown frequency scales with it; lowers skill-check reliability; the homeward
  "long dark" event hits harder.
- **Thresholds:** <25 steady · 25–60 frayed · >60 broken.
- **Recovery (P2-M0.1):** **passive** during long safe stretches with good `hope` — minds settle
  (slow); faster via the **Tend** action.
- **Named payoff event — "The One Who Couldn't"** (fires past threshold): a named crewmate breaks
  permanently (locks a role / leaves / self-destructs) — a lasting loss; colors a **haunted survivors**
  beat. *(Audit fix: this is the concrete payoff `trauma` was missing.)*

### `hope` (visible) — already complete
- **Writers:** deaths/darkness/isolation/failure (↓); harvests/births/successful contact/home-signals/
  surviving a set-piece (↑). **Reader:** 0 = abandonment loss; low `hope` cuts labor output + raises
  breakdowns; high `hope` speeds growth/births. **Threshold:** 0 = the colony gives up.

### `elapsedYears` / Earth-clock (visible from P3-M4)
- **Writers:** every turn on every front (+); hibernation and slow/coasting choices add more.
- **Readers:** Earth-fate odds at home arrival (longer → worse — recovered → changed → silent → gone);
  signal-degradation; a mid-game dread on morale.
- **Named payoff:** the arrival resolution (HOMECOMING / THE LONG WAY HOME / TOO LATE) plus the visible
  ticking clock turning end-of-game surprise into sustained dread.

---

## 3. The action ledger (~30 rows)

Columns: **Action / selection · Immediate (visible) · Hidden long-tail (meter) · Delayed event it can
fire · Ending beat it colors.** Each implementation milestone wires the rows it owns.

| # | Action / selection | Immediate (visible) | Hidden long-tail | Delayed event | Ending beat |
|---|---|---|---|---|---|
| 1 | Strip the landed ship for shelter | +warmth/shelter | `structuralDebt`↑, `shipReadiness`↓ | The Long Crack | "we can never leave" |
| 2 | Burn local forest for fuel & farmland | +warmth, +food | `ecoHarm`↑, `nativeTrust`↓ | The Ground Remembers | Scorched |
| 3 | Over-mine an ore/site | +materials (big) | `ecoHarm`↑, site-collapse risk | site collapse / The Ground Remembers | extractive |
| 4 | Choose geothermal (renewable) over extractive | +power (costs time/expedition) | `ecoHarm` growth slowed | fewer backlash events | stewards |
| 5 | Eat unscreened local biology (pre-research) | +food | `contamination`↑ | The Fever Season | plague-scarred |
| 6 | Drink unreclaimed water | +water | `contamination`↑ | sickness wave | plague-scarred |
| 7 | Research the biosphere first (safe food/water) | costs a turn/labor | `contamination` risk↓; unlocks safe yields | prevents Fever Season | careful |
| 8 | Cut survival corners to grow fast (overcrowd) | +pop growth, +build speed | `contamination`↑, `structuralDebt`↑ | Fever Season / The Long Crack | boomtown collapse |
| 9 | Push expeditions hard for materials | +materials/finds | `trauma`↑, injury/death/lost risk | The One Who Couldn't / lost-party | haunted |
| 10 | Send a weak/old crewmate on an expedition | frees stronger hands | death/`trauma`↑ | bonded-death `hope` cascade | memorial |
| 11 | Tend the people (rest/ceremony/medicine) | +`hope`, +health | `trauma`↓ (slow); costs time (`elapsedYears`↑) | fewer breakdowns | they held together |
| 12 | Hibernate colonists through a famine winter | stretches air/food | `trauma`↑, pod-sickness, "wakes wrong" | The One Who Couldn't | frozen years |
| 13 | Aggressive first contact (raid/seize) | +resources (quick) | `nativeTrust`↓ (hard), `trauma`↑ | raids escalate / The Reckoning (hostile) | displacers / war |
| 14 | Fair trade with the natives | costs materials/goods | `nativeTrust`↑ | aid events; better prices | guests |
| 15 | Share medicine/knowledge with the natives | costs meds/time | `nativeTrust`↑ (big) | alliance/aid | two peoples |
| 16 | Displace natives from a site you want | +site access | `nativeTrust`↓ (hard), `ecoHarm`↑ | raids / The Reckoning | displacers |
| 17 | Petition to live among the natives | gives up the independent colony | requires high `nativeTrust` | alliance ending path | Guests of Proxima |
| 18 | Decode native language / research shortcut | +capability, +knowledge | small `nativeTrust`↑; dependence | unlocks alliance dialogue | understanding |
| 19 | Absorb stranded settlers (overtaken expedition) | +hands/pop | `relations`/merger tension; `contamination` risk | merger-vs-rivalry event | many peoples |
| 20 | Build comms dish & send the beacon early (Earth live) | costs power/time | sets `beaconHeard` = true | (the only message that beats silence) | THE WORD GOT THROUGH |
| 21 | Choose STAY (no return) at the Decision | colony gets every hand → faster settled | Earth never learns unless beacon sent | — | settled, alone / settled + word |
| 22 | Rush the return before fully provisioned | depart sooner (`elapsedYears`−) | barely reaches first waystation; mid-crossing failure risk | homeward starvation/lost | barely made it / lost |
| 23 | Leave the old/sick/weak at the colony on split | stronger return crew | colony viability↓ AND broken bonds (`hope`↓ both fronts) | bond-grief both fronts | bittersweet split |
| 24 | Spend the battered ship as the only shelter | +warmth (decisive) | no return ship without full rebuild (near-irreversible) | locks out launch | we chose to stay |
| 25 | Over-rely on one site for all food | efficient now | fragile (one blight wipes it; `ecoHarm`/`contamination` amplify) | famine | monoculture collapse |
| 26 | Fortify against raids (defense build) | +defense (costs materials/labor) | reads as hostile → small `nativeTrust`↓ | fewer-but-tenser raids | fortress |
| 27 | Hibernate the homebound crew to save air | stores last longer | `trauma`↑, morale drift, missed-hazard risk, uneven aging | "the long dark" hits harder | ghost ship |
| 28 | Push hard pace home (burn fuel) | faster arrival (`elapsedYears`−, better Earth odds) | fuel scarcity → stranded risk | homeward fuel-crisis | raced the dark |
| 29 | Coast slow to conserve fuel | fuel safe | more years → worse Earth odds, more events | Earth goes silent en route | too late |
| 30 | Take the fold-shortcut (knowledge/alien tech) | big distance skip (`elapsedYears`−) | lost/re-localize, hull damage risk | getting-lost | leap of faith |
| 31 | Over-exploit a site (expedition) [P2-M3] | big one-time yield (materials/tech/food) | `ecoHarm`↑ (NO passive recovery) → +survival drain via `colHabDrain` | The Ground Remembers (P2-M4) | we became what we fled |
| 32 | Restore / Rewild a scarred site [P2-M5] | costs materials + labor + a season | the ONLY `ecoHarm`↓ — heals the world you scarred | fewer backlash events | stewards |

> **Ship-strip unification (P2-M0.1 — rows 1 & 24 are ONE graduated axis, not two toggles).** Stripping
> the landed ship is a single escalating mechanic. Partial stripping (row 1) adds `structuralDebt`
> incrementally and lowers `shipReadiness`; committing the **whole hull** as shelter (row 24) is the far
> end of that same axis and crosses a **point of no return** (no return ship without a full rebuild).
> Wire as one escalating choice with a threshold so `structuralDebt` is **never double-counted** across
> the two rows.

> **FORWARD MARKER — `confirmSettlement` must be re-guarded at P3-M1/M-INT1 (P2-M6 note, no code yet).**
> P2-M6 ships the player-confirmed Settlement victory as `confirmSettlement` → `finishColony(true,
> "SETTLED")`, which **hard-ends the whole run**. That is correct ONLY while the launch/voyage front is
> dormant (Phase 2). Once a voyage can be live (P3-M1 launch + M-INT1 composed endings), settling while a
> ship is mid-crossing would short-circuit the parallel finale and break **TWO WORLDS**. At P3-M1/M-INT1,
> BOTH (a) `confirmSettlement`'s **availability** (and the `⚖ The future` "Found the settlement" choice)
> AND (b) its **"the colony's story ends here"** copy MUST be guarded: when a ship is in flight, founding
> must **record the settled-front outcome** for `composeEnding` to weigh (set the colony front done/won),
> NOT call `endGame`. Row 21 (Choose STAY) already assumes this seam.

---

## 4. Cascade engines (must thread through every milestone)

1. **Labor/power hub** — finite labor + power; starving one survival or growth axis forces another to
   fail. This is the colony's analogue of Phase 1's *power-is-the-hub*, and it is why the colony is a
   squeeze and not a checklist.
2. **The Earth clock** — total `elapsedYears` across Phase 1 + colony + return sets the home-fate odds.
   Every turn on every front spends it; it is the link that keeps Act II coupled to Phase 1.

If either engine is missing from a milestone's feature, that feature decouples the back half from the
front half — the exact failure this redesign exists to prevent.

---

## 5. Orphan-meter check (the P2-M0 verification)

| Meter | Writer(s) | Reader(s) | Orphan? |
|---|---|---|---|
| `ecoHarm` | rows 2,3,16,25 | The Ground Remembers; backlash hazards; `nativeTrust` bleed; endings | no |
| `nativeTrust` | rows 13,14,15,16,18,19,26 | raids/aid; trade prices; The Reckoning; petition fork; endings | no |
| `contamination` | rows 5,6,8,19,25 | The Fever Season; failed-harvest; ailment frequency | no |
| `structuralDebt` | rows 1,8,24 | refit cost/`shipReadiness`; The Long Crack; collapse | no |
| `trauma` | rows 9,10,12,13,27 (↓ row 11) | breakdown frequency; The One Who Couldn't; homeward long dark | no |
| `hope` | many (deaths/harvests/signals) | abandonment loss; labor; breakdowns | no |
| `elapsedYears` | every turn + rows 22,27,28,29,30 | Earth-fate odds; signal; dread | no |

**No orphans.** Every hidden meter has ≥1 writer and ≥1 reader, and every meter has at least one named,
dramatic payoff so the long-tail is *experienced*, not silently tallied.

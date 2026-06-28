# Proxima Trail — UI Inventory (for external design audit)

Inventory of every screen and modal state in the game, with each control, its keyboard shortcut (if
any), the modal it opens (if any), and the state that gates its visibility. Inventory only — no
critique.

## Capture method
- The static game (`index.html` + `game.js` + `audio.js` + `style.css`) was served locally and driven
  with headless Chromium (Playwright). No game files were modified for the audit.
- Every screen/modal below was reached with a fabricated `localStorage` save and/or scripted clicks, then
  screenshotted at **two viewports**: **mobile 390×844** and **desktop 1280×800**
  (`deviceScaleFactor: 2`).
- Screenshots live in [`docs/screenshots/`](screenshots/), named `<screen>__<viewport>.png`
  (e.g. `travel-hud__mobile.png`, `end-win__desktop.png`). 30 states × 2 viewports = 60 PNGs.

## Global chrome (always visible, every screen)
Rendered by `updateTopbar()`; persists across all screens.

| Control | Selector | Effect | Shortcut | Gate |
|---|---|---|---|---|
| Brand `▣ A.S. PROXIMA · BRIDGE` | `.brand` | Static title | — | always |
| Status readout | `#topbar-status` | `EARTH IS DYING` / `BEST SCORE: N` (off-travel) or `DAY n · NEXT: <waypoint> · d/434 ly-abs` (travel) | — | always |
| `▦ ANIM: ON/OFF` | `#anim-btn` | Toggles between-scene animations (`meta.anim`); persists to meta | — | always |
| `♪ SND: ON/OFF` | `#mute-btn` | Toggles sound mute | — | always |

## Keyboard shortcuts (global handler; suppressed while any modal is open)
| Key | Action | Active on |
|---|---|---|
| `n` | New voyage | title (no game) |
| `r` | Resume voyage | title, when a save exists |
| `h` | How to play | title |
| `l` | Logbook | title, when `meta.runs.length > 0` |
| `Space` / `Enter` / `c` | Continue (advance turn) | travel |
| `t` | Thrust modal | travel |
| `r` | Rations modal | travel |
| `p` | Power/allocate modal | travel |
| `m` | Mining mini-game | travel |

The colony, voyage, role, store, and end screens have **no keyboard shortcuts** — pointer only.

## Action dispatch
A single document click listener reads `data-action` (+ optional `data-arg`) from the clicked element and
routes to `handle(action, arg)`. Modal buttons are either standard choices (with `onClick`) or carry
custom attributes (`data-set`, `data-vset`, `data-sys`, `data-csys`, `data-hib`, `data-vhib`,
`data-esite`, `data-ecrew`, `data-csite`, `data-split`).

The valid `game.screen` values are: `role`, `store`, `travel`, `colony`, `voyage`, `end` (no value →
title). `renderApp()` routes each to its renderer.

---

# 1 · Title & meta screens

## TITLE  · `renderTitle()` · screen = (none)
Purpose: entry point; start a new run, resume a saved one, or open help/records.
Screens: `title__mobile.png`, `title__desktop.png`

| Control | data-action | Effect | Shortcut | Opens | Gate |
|---|---|---|---|---|---|
| Resume voyage | `resume` | Load save, restore its screen | `r` | — | a save exists |
| New voyage | `new` | Go to role select | `n` | — | always |
| How to play | `howto` | Open How-to modal | `h` | How-to | always |
| Logbook (past runs) | `logbook` | Open Logbook modal | `l` | Logbook | `meta.runs.length > 0` |

## HOW-TO  · `showHowTo()` (modal) · over title
Purpose: static rules/help. Screens: `howto__*.png`

| Control | Effect | Gate |
|---|---|---|
| Got it | Close modal | always |

## LOGBOOK  · `showLogbook()` (modal) · over title
Purpose: past-run history; title shows best score. Each row: date, role, difficulty, outcome (★rank for
wins / `lost dNNN` for losses), score. Screens: `logbook__*.png`

| Control | Effect | Gate |
|---|---|---|
| Close | Close modal | always |

## ROLE SELECT  · `renderRole()` · screen = `role`
Purpose: pick crew role + difficulty and preview the 5-person crew. Screens: `role-select__*.png`

| Control | data-action | data-arg | Effect | Gate |
|---|---|---|---|---|
| Role buttons | `pickRole` | `Commander`/`Pilot`/`Engineer`/`Medic`/`Xenobiologist` | Set selected role (shows blurb, starting credits, score ×) | always |
| Difficulty buttons | `pickDiff` | `Settler`/`Pioneer`/`Voyager` | Set difficulty (multiplier + blurb) | always |
| Reroll names | `reroll` | — | Regenerate the 5 crew names | always |
| Outfit the ship → | `toStore` | — | Create the run, go to Store | always |
| ← Back | `backTitle` | — | Discard, return to title | always |

Crew list: one member per role; the selected role is tagged `(you)`.

## STORE / OUTFIT  · `renderStore()` · screen = `store`
Purpose: spend credits on supplies before launch. Header `OUTFITTING — EARTH ORBIT`; shows credits, hold
`N/300`, manifest. Screens: `store__*.png`

| Control | data-action | data-arg | Effect | Gate |
|---|---|---|---|---|
| `+` per item | `buy` | `fuel`/`oxygen`/`food`/`medicine`/`parts`/`charges` | Buy one step (deduct credits, respect hold) | always |
| `−` per item | `sell` | same keys | Sell one step (partial credit refund) | always |
| ▶ LAUNCH FROM EARTH | `launch` | — | Begin the run → Travel | always |
| ← Crew | `backRole` | — | Back to role select | always |

---

# 2 · Travel (outbound) — `renderTravel()` · screen = `travel`

## TRAVEL HUD
Purpose: the main outbound loop — route map, navigation, supplies/power, crew strip, ship's log, action
row. Screens: `travel-hud__*.png`

| Control | data-action | Effect | Shortcut | Opens | Gate |
|---|---|---|---|---|---|
| ▶ Continue | `continue` | Advance one turn (transit vignette if ANIM on) | Space/Enter/`c` | event/hazard/station may follow | always |
| ⚙ Thrust | `thrust` | Drive-thrust select | `t` | Thrust | always |
| 🍽 Rations | `rations` | Ration-level select | `r` | Rations | always |
| ⚡ Power | `power` | Power allocation | `p` | Allocate | always |
| ❄ Pods | `hibernate` | Hibernation pods | — | Hibernation | always |
| 🛠 Rest & repair | `rest` | Spend a turn to repair hull (uses parts/medicine) | — | — | always |
| ⛏ Mine | `mine` | Asteroid mining mini-game | `m` | Mining | at a mining waypoint; charges > 0 |
| 🧠 ATLAS | `ai` | Ship-AI diagnostics/purge | — | AI/ATLAS | always |
| ☼ Emergency wake | `wakeself` | Wake captain from autopilot | — | — | `autopilot === true` |
| ▶▶ Run… | `autorun` | Resume autopilot | — | — | `autopilot === true` |
| Abandon run | `abandon` | Confirm → end the run as a loss | — | confirm | always |

Route map (`renderRouteMap()`, embedded): waypoint nodes (⌂ start · ◉ station · ✦/≋ hazard · ❄ void · ◐
win) with visited/current/future state and a live ship marker; informational, no controls.

## Travel modals

### THRUST  · `openThrust()` — title `⚙ Drive Thrust`
Screens: `modal-thrust__*.png`
| Control | Selector | Effect |
|---|---|---|
| Thrust option | `[data-set="thrust"][data-arg=…]` | Set `game.thrust` (idle/slow/cruise/burn/overdrive); closes |

### RATIONS  · `openRations()` — title `🍽 Ration Level`
Screens: `modal-rations__*.png`
| Control | Selector | Effect |
|---|---|---|
| Ration option | `[data-set="rations"][data-arg=…]` | Set `game.rations` (full/reduced/minimal…); closes |

### ALLOCATE POWER  · `openAllocate(null,false)` — title `⚡ Power Allocation`
Screens: `modal-allocate__*.png`
| Control | Selector | Effect | Gate |
|---|---|---|---|
| System toggle ×5 | `[data-sys=lifeSupport/drive/medbay/sensors/pods]` | Toggle `power.allocation[k]` | always |
| Done | choice | Apply & close | always |

### BROWNOUT (shed load)  · `openBrownout()` → `openAllocate(then,true)` — title `⚡ Power Allocation`, art `!!! BROWNOUT !!!`
Purpose: forced power-shed when `computePower().brownout` (demand > output) on a turn. Shows
`Reactor output N (hull-limited) · demand M`. Screens: `modal-brownout__*.png`
| Control | Selector | Effect | Gate |
|---|---|---|---|
| System toggle ×5 | `[data-sys=…]` | Shed/restore a system | always |
| Run under brownout (systems strain) | choice | Proceed despite brownout | always |

Trigger: a turn where `output = floor(reactorBase × hull/100)` is below demand (low hull/reactor, high
thrust, sleepers, or ailing crew).

### HIBERNATION  · `openHibernation()` — title `❄ Hibernation Pods`
Screens: `modal-hibernation__*.png`
| Control | Selector | Effect | Gate |
|---|---|---|---|
| Sleep/Wake per crew | `[data-hib=sleep/wake][data-name=…]` | Pod a crew member or wake them | per-crew status |
| (sleeping the captain) | confirm sub-modal | Choose autopilot wake condition (next waypoint / emergency-only) | when player sleeps |

### AI / ATLAS  · `openAI()` — title `🧠 ATLAS`
Purpose: manage ship mind; shows integrity % + state. Screens: `modal-ai-atlas__*.png`
| Control | Effect | Gate |
|---|---|---|
| Run diagnostics & recalibrate [Engineer] | `aiDiagnostics()` — integrity up | AI present |
| PURGE the core (irreversible) [Engineer] | `aiPurge()` | integrity ≤ 40 |
| Close | Close modal | always |

### TRADE (station)  · `openTrade(wp)` — title `⇄ Trade — <station>`
Purpose: buy/sell goods at a station; shows credits + hold. Reached from the station arrival modal
(`presentStation` → "Trade with the station"). Screens: `modal-trade__*.png`
| Control | Effect | Gate |
|---|---|---|
| Buy N / Sell N per commodity | Buy/sell fuel, O₂, food, medicine, parts, charges at station prices | per-good price/stock |
| Sell all (cargo) | Liquidate ore/ice/volatiles/rare-metals | cargo held |
| Done | Close | always |

### JOBS (station)  · `openJobs(wp)` — title `⚒ Work — <station>`
Purpose: earn credits via role-/location-filtered jobs (cost a few days). Reached from the station
arrival modal ("Look for work"). Screens: `modal-jobs__*.png`
| Control | Effect | Gate |
|---|---|---|
| Take (per job) | Attempt the job for a credit reward | job offered (varies by who's awake / where) |
| Back | Return to station modal | always |

### MINING mini-game  · `openMining()` — overlay `⛏ ASTEROID MINING` (not the modal system)
Purpose: timed click-to-mine rocks; HUD shows charges, time, haul. Screens: `modal-mining__*.png`
| Control | Selector | Effect | Gate |
|---|---|---|---|
| Click a rock | rock element | Mine it; spends one charge | charges > 0 |
| Dock & keep haul | `#mg-stop` | End mini-game, bank the haul | always |

## Stochastic travel modals

### EVENT (generic)  · `rollEvent()` → `openModal`
Purpose: a sampled en-route incident (e.g. `⚠ ILLNESS ABOARD`, derelicts, signals). Buttons vary per
event; some are role-gated. Screens: `modal-event__*.png`
| Control | Effect | Gate |
|---|---|---|
| (event-specific choices) | Resolve with sampled outcome (crew/supply/log effects) | per event; some role-gated |

Trigger: weighted roll on a turn; pre-/post-contact event pools gated by `game.contact`.

### HAZARD crossing  · `presentHazard(key)` — title `≋ CROSSING: <hazard>`
Purpose: waypoint hazard (Asteroid Belt, Oort/Nebula, Proxima flare, debris/flare/swarm). 2–3 options,
some role-gated; shows crew disposition. Screens: `modal-hazard__*.png`
| Control | Effect | Gate |
|---|---|---|
| Option buttons | Resolve hazard at sampled severity | reaching a hazard waypoint; some role-gated |

### FIRST CONTACT  · `presentFirstContact()` — title `✷ FIRST CONTACT ✷`
Purpose: one-time scripted alien reveal in deep space. Sets `game.contact = true`.
Screens: `modal-firstcontact__*.png`
| Control | Effect | Gate |
|---|---|---|
| FIGHT — power weapons | `resolveContact("fight")` | first-contact only |
| FLIGHT — burn hard and run | `resolveContact("flight")` | first-contact only |
| FREEZE — hold still, go dark | `resolveContact("freeze")` | first-contact only |

Trigger: `!game.contact && waypointIndex ≥ 7` (forced by the final approach); shown via `_contactPending`.

---

# 3 · Colony — `renderColony()` · screen = `colony`

## COLONY HUD
Purpose: run the settlement — survival bars + hope, power/hands allocation, crew & colonists, known-world
panel, action row. Header `THE COLONY · CYCLE n · <world> · <stage>`. Screens: `colony-hud__*.png`

| Control | data-action | data-arg | Effect | Opens | Gate |
|---|---|---|---|---|---|
| 🛡 Secure | `colony` | `secure` | Secure the settlement | — | always |
| 👷 Work | `colony` | `work` | Gather materials & food | — | always |
| 🏗 Build | `colony` | `build` | Raise infrastructure | — | always |
| 🔬 Research | `colony` | `research` | Advance tech | — | always |
| 🧭 Scout | `colony` | `scout` | Reveal hidden sites | — | always |
| ⛏ Expedition | `colony` | `expedition` | Mount a site expedition | Expedition | revealed non-depleted site + awake crew |
| ❤ Tend | `colony` | `tend` | Mend morale & health | — | always |
| 🛠 Refit ship | `colony` | `refit` | Raise `shipReadiness` | — | always |
| 🤝 Contact | `colony` | `contact` | Parley with natives | Contact | `relations != null && !nativesGone` |
| 🧱 Fortify | `colony` | `fortify` | Raise defense | — | `relations != null && !nativesGone` |
| 🌱 Restore | `colony` | `restore` | Reduce ecological harm | — | `ecoHarm > 0` |
| ⚖ The future | `colony` | `decide` | Open the future/launch decision | Future Decision | `footholdReached === true` |
| ▶ Hold | `colony` | `hold` | Rest the colony one cycle | — | always |
| ⚡ Power | `colony` | `allocate` | Colony power & hands | Colony Allocate | always |

Panels: hope meter (color-banded); five survival axes (air/water/food/warmth/health, each with `[OFF]`
when de-allocated); power `demand/output` + hands; settlement stats; native stance (if any); known-world
sites (revealed + unscouted count, eco/“something stirs” warnings). A `★ thriving` banner shows when
`settledEligible`.

## Colony modals

### COLONY ALLOCATE  · `openColonyAllocate()` — title `⚡ Colony Power & Hands`
Screens: `colony-allocate__*.png`
| Control | Selector | Effect | Gate |
|---|---|---|---|
| System toggle ×5 | `[data-csys=air/water/food/warmth/health]` | Toggle `colony.alloc[k]` (ON/OFF) | always |
| Done | choice | Apply & close | always |

### EXPEDITION  · `openExpedition()` — title `🧭 Mount an Expedition`
Screens: `colony-expedition__*.png`
| Control | Selector | Effect | Gate |
|---|---|---|---|
| Pick site | `[data-esite=<id>]` | Target a revealed site | revealed non-depleted site |
| Pick crew | `[data-ecrew=<name>]` | Toggle who goes (awake only) | awake crew |
| Send the expedition | choice | Commit; runs an expedition turn | ≥1 crew assigned |
| Not now | choice | Close | always |

A risk readout (tier + success/death/hurt/lost odds) appears once crew are assigned.

### CONTACT  · `openContact()` — title `🤝 Contact`
Purpose: native diplomacy; shows surface stance + a seizable site. Screens: `colony-contact__*.png`
| Control | Effect | Gate |
|---|---|---|
| Pick site | `[data-csite=<id>]` target a site | revealed site |
| Trade goods [−6 mat → +food, +stance] | `commit("trade")` | `materials ≥ 6` |
| Share medicine [−2 meds → +trust] | `commit("share")` | `meds ≥ 2` |
| Parley & learn [Xenobiologist] | `commit("parley")` | always |
| Seize a site [crater trust] | `commit("displace")` | a site targeted |
| Drive them out [war] | `commit("war")` | always |
| Not now | Close | always |

### FUTURE DECISION  · `openFutureDecision()` — title `⚖ The Decision`
Purpose: the stay-or-send-home hub. Screens: `colony-future-decision__*.png`
| Control | Effect | Gate (disabled when) |
|---|---|---|
| 🚀 Ready & send the ship home | `colonyLaunch()` → crew-split | already launched, or `shipReadiness` not ready |
| 📡 Send a beacon home | `sendBeacon()` | `colony.beacon === true` |
| ⭐ Found the settlement — claim this world | `confirmSettlement()` | `!settledEligible` |
| Stay — keep building | Close | always |

### CREW SPLIT roster  · `colonyLaunch()` — title `🚀 Crew the ark for home`
Purpose: choose who flies home vs. who holds the colony. Screens: `decision-crew-split__*.png`
| Control | Selector | Effect | Gate |
|---|---|---|---|
| STAY / RETURN per crew | `[data-split=stay/go][data-name=<name>]` | Assign each member | children & hibernating locked to STAY |
| Launch for Earth | choice | `doLaunch(returnees)` → starts the homeward voyage | needs ≥1 RETURN **and** ≥1 STAY |
| Not yet | choice | Close | always |

Tally line: `Returning: X · Staying: Y`.

---

# 4 · Voyage (homeward) — `renderVoyage()` · screen = `voyage`

## VOYAGE HUD
Purpose: the long way home — Earth-signal readout, homeward progress track, ship status (fuel/O₂/food/
medicine/hull/years-since-exodus, reactor), crew aboard, action row. Header `THE LONG WAY HOME · YEAR n
SINCE EXODUS`. Screens: `voyage-hud__*.png`

| Control | data-action | data-arg | Effect | Opens | Gate |
|---|---|---|---|---|---|
| ▶ Continue | `voyage` | `continue` | Advance a homeward turn | event/hazard may follow | always |
| ⚙ Thrust | `voyage` | `thrust` | Homeward thrust select | Voyage Thrust | always |
| 🍽 Rations | `voyage` | `rations` | Homeward ration select | Voyage Rations | always |
| ❄ Pods | `voyage` | `pods` | Homeward cold sleep | Voyage Hibernate | always |
| 🔧 Rest & repair | `voyage` | `rest` | Repair the homeward ship | — | always |
| 🔍 Scavenge | `voyage` | `scavenge` | Hunt wreckage on the return trail | — | always |
| ⇄ Tend the colony | `focus` | `colony` | Switch focus to the colony front | — | `colony && !colonyDone` |

(Earth-signal readout shows `Signal from Earth: live/faint/silent`; the signal label is `EARTH ⊕` on the
track, click-through to the marker.)

## Voyage modals

### VOYAGE THRUST  · title `⚙ Drive Thrust (homeward)` — Screens: `voyage-thrust__*.png`
| Control | Selector | Effect |
|---|---|---|
| Thrust option | `[data-vset="thrust"][data-arg=…]` | Set `voyage.thrust`; closes |

### VOYAGE RATIONS  · title `🍽 Ration Level (homeward)` — Screens: `voyage-rations__*.png`
| Control | Selector | Effect |
|---|---|---|
| Ration option | `[data-vset="rations"][data-arg=…]` | Set `voyage.rations`; closes |

### VOYAGE HIBERNATE  · title `❄ Cold Sleep (homeward)` — Screens: `voyage-hibernate__*.png`
| Control | Selector | Effect | Gate |
|---|---|---|---|
| Sleep/Wake per crew | `[data-vhib=sleep/wake][data-name=…]` | Pod/wake a voyage crew member | ≥1 must stay awake to pilot |

---

# 5 · End — `renderEnd()` · screen = `end`

## END SCREEN (win and loss)
Purpose: outcome, score breakdown, rank, and crew manifest. Title is `✦ <TIER> ✦` (cyan, win) or
`✖ <TIER> ✖` (red, loss). Screens: `end-win__*.png` (e.g. `✦ TWO WORLDS ✦`), `end-loss__*.png` (e.g.
`✖ EXTINCT ✖`).

| Control | data-action | Effect | Gate |
|---|---|---|---|
| ▶ New voyage | `again` | Start a new run (role select) | always |
| Title screen | `backTitle` | Return to title | always |
| Logbook | `logbook` | Open run history | always |

Displayed (driven by `game.outcomeTier`, `game.cause`, `game._endScore`, `game._endRank`, `game.crew`):
- **Score** block: surviving crew, supplies & parts, hull integrity, credits, speed bonus (wins, by day),
  subtotal, role × · difficulty ×, **FINAL SCORE**.
- **Rank** badge (e.g. `COLONIST`, `DRIFTER`) and `★ NEW BEST SCORE` when beaten.
- **Final manifest**: survivors (name + role), lost, and any taken-by-the-unknown.

Outcome tiers observed — wins: `TWO WORLDS`, `A WORLD, AND WORD`, `A WORLD, AT LEAST`,
`A WORLD, AND AN EMPTY SKY`, `A WORLD, AND A SILENT SHORE`, `MESSENGER`, `WORD WORTH CROSSING FOR`,
`THE LONG WAY HOME`, `THE MESSENGER`, `THE WORD GOT THROUGH`, `SETTLED`; losses: `EXTINCT`, `WITHERED`,
`LIFE SUPPORT LOST`, `TOO LATE`, `A SILENT SHORE`, `LOST WITH ALL HANDS`.

---

## Screenshot index (30 states × mobile + desktop)
`title` · `howto` · `logbook` · `role-select` · `store` · `travel-hud` · `modal-thrust` ·
`modal-rations` · `modal-allocate` · `modal-brownout` · `modal-hibernation` · `modal-ai-atlas` ·
`modal-trade` · `modal-jobs` · `modal-mining` · `modal-event` · `modal-hazard` · `modal-firstcontact` ·
`colony-hud` · `colony-allocate` · `colony-expedition` · `colony-contact` · `colony-future-decision` ·
`decision-crew-split` · `voyage-hud` · `voyage-thrust` · `voyage-rations` · `voyage-hibernate` ·
`end-win` · `end-loss`

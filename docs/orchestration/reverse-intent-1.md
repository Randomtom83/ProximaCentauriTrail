# Reverse-Intent Report — Proxima Trail

*Independent reconstruction of what the system does and what its builders apparently
valued, derived only from `game.js`, `style.css`, `index.html`, `audio.js`, `test/*`,
`scripts/*`, and `AgenticOS/GRAPH_REPORT.md`. No project docs, plans, or memory files were
read. Every claim cites a file (and line where useful).*

---

## 1. WHAT IT DOES

### 1.1 One artifact, no build step
The whole product is four hand-written static files served by `index.html`: `style.css`,
`audio.js`, and a single 4,948-line IIFE `game.js` (`game.js:9` `(function () { "use strict";`).
`index.html:72-73` loads `audio.js` then `game.js`; there is no bundler, framework, or
dependency in the runtime path. The graph confirms this concentration — the two most-connected
"god nodes" are `$()` (the querySelector helper, `game.js:18`) at ~143 edges and `log()` /
`sfx()` next (GRAPH_REPORT.md §"God Nodes"). This is a deliberately monolithic vanilla-JS
game.

### 1.2 The game: Oregon Trail, relocated to space
It is a resource-attrition survival game. The player outfits a ship at Earth, then advances turn
by turn along a **fixed 10-waypoint trail** from Earth Orbit to Proxima Centauri b
(`game.js:50-71` `WAYPOINTS`). Each `Continue` runs `resolveTurn()` (`game.js:883`), which
advances the day, moves the ship if the drive is powered and fuel remains, and bills the crew
for oxygen and food — crucially **per distance, not per turn** (`game.js:904-914`), so high
thrust is a fuel-and-exposure gamble rather than a shortcut. Depletion escalates: anoxia and
starvation both ramp damage the longer they persist (`game.js:919-956`), and the severity scales
with a difficulty `harsh` factor.

Structurally the run passes through several **screens**, each with its own render function and
its own turn engine:
- **role → store** — crew/difficulty selection and outfitting (`renderRole` 4195, `renderStore` 4236).
- **travel** — the outbound solar-system + interstellar-void leg (`renderTravel` 4311, `resolveTurn` 883).
- **colony** — after arrival at Proxima, a settlement-management loop (`renderColony` 4585, `colonyTurn`/`colonyAutoStep` 2843).
- **voyage** — an *optional homeward* leg on a separately-crewed ark (`renderVoyage` 4654, `voyageStep`/`voyageAutoStep` 2759/2849).
- **end** — scored terminal screen (`renderEnd` 4711, `composeEnding`/`endGame` 2863/2891).

### 1.3 Interlocked subsystems (the "depth engine")
The bridge is a network of coupled meters rather than a single health bar:
- **Power** is the hub. The reactor's output depends on hull integrity; if demand beats output the
  ship *browns out* and the player must shed load — cutting scrubbers drains air, cutting the drive
  halts movement (`computePower`, brownout handling threaded through `resolveTurn`; the how-to text
  at `game.js:4171` states this explicitly).
- **Crew** are individuals with `health`, `morale`, `skill`, `age`, `bonds`, `ailment`, and `status`
  (`newGame` crew build `game.js:194-220`). Specialists matter: `skillFor`/`skillAwake`
  (`game.js:319-350`) pick the best *awake* specialist for a role; a sleeping or dead specialist
  removes their edge. A dead crewmate hurts the morale of bonded crewmates.
- **Hibernation** trades air/food savings for capability loss — sleepers can't act in a crisis, a
  sleeping Medic can't treat, and unpowered pods kill sleepers (`game.js:991-1007`).
- **Aging & generations**: awake crew age ~0.4 yr/turn, cold-sleep nearly stops it (`AGE_PER_TURN`,
  `AGE_HIB` 156-157). Children are born, come of age, and man stations; elders die
  (`voyageAgeCrew` 652, mirrored outbound). The interstellar void is decades long, forcing this.
- **ATLAS**, the ship's mind, degrades over time (`AI_DECAY` 166, `aiTurn` 524) and shifts from
  helping skill checks to hindering them (`aiAssist()` used in `resolveCheck` 2971).
- **Economy**: location-based prices (`priceAt` 117) make fuel/O₂ scarcer the farther from Earth and
  commodities more valuable in the deep; a bounded cargo hold (`HOLD_MAX` 152) forces trade-offs.
- **Mining** is a real-time click mini-game overlay (`index.html:63-70`, `openMining`).

### 1.4 Outcomes are sampled, not scripted
Events fire from a weighted pool (`EVENTS` 2980, `rollEvent` 3142) gated by zone and by a
first-contact flag. The crew's cumulative **posture** (aggress/explore/cooperate/caution,
`game.js:252`) bends which *kinds* of events surface (`eventWeight` 3168), so an aggressive run
feels different from an exploratory one. Choices resolve through `resolveCheck` (2967): a skill roll
plus randomness against a difficulty modified by a hidden `potential` "momentum" meter, sensor
power, and ATLAS. A hidden mission `potential` (0-100) is nudged by `influence()` from choices.
`applyOutcome` (2924) is a generic data-driven mutator: events are declarative `{res, hull, morale,
health, ailment, kill, recruit, inf, text}` objects. Earth's fate is a **hidden truth read through a
bounded, lagging, noisy belief** (`EARTH_BANDS` 162, `voyageEarthSignal` 603 — belief steps one band
toward truth, jitters, but is clamped within ±1 band of truth). The destination's habitability and
whether anyone got there first are **sampled only on arrival** (`dest` 254). This is a designed
commitment to emergent, non-deterministic tragedy.

### 1.5 Parallel two-front endgame
The most intricate machinery is the Act-II split: after arrival the colony and the homeward voyage
can run as **two simultaneous fronts**, each with its own crew, stores, turn loop, and auto-stepper.
The player toggles focus (`case "focus"` 4833) while the off-front auto-advances (`colonyAutoStep`
2843 / `voyageAutoStep` 2849) and reports what happened via a captured "digest" (`digestBlock`,
`offStripLine`, referenced in `renderColony`/`renderVoyage` 4601-4687). `tryCompose` (2855) waits
for **both** fronts to resolve, then `composeEnding` (2863) folds the pair into one of ~13 distinct
ending tiers (two-worlds, the-messenger, a-world-and-an-empty-sky, extinct, etc.). A shared
"years-since-exodus" clock takes the *larger* of the two fronts' contributions, not the sum
(`exodusYears` 26-31).

### 1.6 Permadeath + persistence
A run autosaves to `localStorage` (`SAVE_KEY` 15, `save()` 274), but on any terminal state
`endGame` calls `clearSave()` (2909) — the comment reads *"permadeath: the run is over."* Only
aggregate meta (best score, last 25 runs) persists across runs (`META_KEY` 16, `endGame`
2900-2907). Loss is irreversible by construction.

### 1.7 Presentation layer (the recently-heavy work)
`style.css` and the bottom render functions present a **"glass bridge" CRT command console**
(header comments `style.css:1-8`, "Phase 3 UI"). Characteristics:
- **Full-viewport, single-screen fit.** `#crt` is `height: calc(100dvh - 20px)` (55-70) and the
  travel screen is a CSS grid with `grid-template-rows: auto auto minmax(min-content,1fr)`
  (`.bridge` 276-283). Long inline comments explain a specific invariant: the console row is floored
  at `min-content` and the log is wrapped in `contain: size` so **commands can never be clipped and
  the log is the only slack absorber** (`style.css:280-295`). This is careful anti-regression layout
  engineering, not decoration.
- **Responsive + reachability.** Media queries at `≤1100px`, `≤900px`, and `max-height:800px`
  (479-524) restack the console, cap station panels to scroll internally, and enforce ≥44px touch
  targets (505-510). A comment cites named "Forks" (C, E) — evidence of a deliberated design process.
- **Diegetic HUD.** Nav readouts ride a starfield "viewscreen" as chips instead of a form
  (`renderTravel` 4358-4372); a multi-waypoint route map places labels alternately above/below the
  rail "so they can never collide" (`renderRouteMap` 4293-4298, CSS `.rm-label.abv/.blw` 268-269).
- **Accessibility is wired, not bolted on.** A scoped `#sr-live` polite announcer
  (`index.html:35-36`) receives only the newest log line (`log()` 302-303) so the whole `#app`
  doesn't re-announce every turn; `.sr-only` (35-38) and a `prefers-reduced-motion` block that
  disables every animation (526-530) are present.
- **State is legible through color/animation.** RED ALERT frame toggled by real danger
  (`setAlert` 4309, `.alert` 92-94), crit bars pulse, hibernating crew "breathe", cracked crew
  "tremble", ATLAS "glitches" as it frays (469-474).
- **Audio is synthesized, zero-asset.** `audio.js` is oscillator-only Web Audio beeps
  (header 1-6), guarded so headless/no-AudioContext contexts no-op safely (82-86).

### 1.8 The verification apparatus (disproportionately large)
For a static game there is an unusually heavy quality gate:
- `scripts/verify.sh` is `set -euo pipefail`, refuses a **vacuous pass** (fewer than
  `MIN_TESTS=9` harnesses), checks syntax, the frozen-three, and every harness (13-45).
- `scripts/frozen.js` extracts three functions — `applyOutcome`, `resolveCheck`, `tryCompose` — by
  brace-matching and **md5-locks them against a committed baseline** (10-11, 46-53). The header notes
  `composeEnding` is intentionally *not* md5-frozen but golden-locked instead (7).
- `test/lib/boot.js` boots the real game in jsdom with a **global error trap installed before any
  game code** (35-49) and asserts a *real terminal render* happened (`assertEndRendered` 94-107) —
  "a swallowed exception is a FAILED test, not a pass" (12-13).
- `test/endings_golden.js` pins `{won, tier}` for all 13 reachable ending branches through the live
  pipeline (21-38).

Nine+ harnesses exist: smoke_full_run, win_path, loss_path, brownout_hazard, colony_smoke,
voyage_smoke, endings_golden, mint1b, a11y_focus_live, layout_onescreen (`test/` listing).

---

## 2. IMPLIED INTENT

*Working backwards from what was built. Each inference is tied to a load-bearing structure.*

### 2.1 The builders wanted a *hard, honest* game — cruelty is a feature
Every escalation is designed to punish, and the punishments are graduated and irreversible.
Anoxia/starvation compound (`resolveTurn` 919-956); `endGame` deletes the save (`clearSave` 2909,
comment "permadeath"); loss is scored and archived, not undone. Difficulty tiers change only
*harshness/scarcity multipliers* (`DIFFICULTY` 92-96), never the rules. **The apparent goal is a
survival game where death is real and the player earns outcomes** — the Oregon-Trail lineage is
explicit in the file banner (`game.js:2-4`).

### 2.2 They believe outcomes must be *earned by systems, not authored by the writer*
The heavy investment in a sampling engine — weighted events, posture-bent event selection, a hidden
`potential` momentum meter, arrival-sampled destination, bounded/noisy Earth belief — only makes
sense if the builders specifically did **not** want scripted story beats. `applyOutcome` being a
generic declarative mutator (2924) means content is data; the *engine* decides. The value being
served is **emergent, replayable tragedy** rather than a fixed narrative.

### 2.3 They treat three specific functions as sacred load-bearing balance
`frozen.js` md5-locks exactly `applyOutcome`, `resolveCheck`, `tryCompose` (frozen.js:10). Freezing
the outcome-applier, the check-resolver, and the endgame-gate — and *only* those — implies a belief
that **the fairness/odds of the game are its crown jewels** and must not drift even accidentally.
`composeEnding` was deliberately exempted to golden-lock instead (frozen.js:7, endings_golden.js:2),
showing the endings were expected to *evolve* while the odds were expected to *freeze*. This is a
clear priority ranking: balance > narrative stability > everything else.

### 2.4 They fear silent failure above almost all else
The verification stack is engineered around one obsession: a test that passes without testing is
worse than no test. The pre-installed error trap, the "real terminal render" assertion, the
vacuous-pass guard, and the `MIN_TESTS` floor (boot.js:35-49, 94-107; verify.sh:34) all target
**false-green builds and silent in-game death**. For a small static game this is remarkable and
implies the builders were burned by, or explicitly guarding against, checks that lie.

### 2.5 The recent presentation work reveals a priority on *legibility under constraint*
The CSS comments are not styling notes — they are invariant proofs: "commands can never be clipped,"
"the log is the only slack absorber," "internal scroll, never page scroll," labels that "can never
collide" (`style.css:280-295`, 493-501, 262-269). The intent is that **the entire dense bridge must
fit one screen on desktop, short desktop, tablet, and phone, without ever hiding a control**. This is
a UX thesis: an information-dense management game is only fair if every meter and every action is
visible at once. The diegetic framing (CRT, viewscreen, RED ALERT, ATLAS glitch) shows a second,
compatible goal — **immersion/theme** — but layout correctness clearly ranked above ornament.

### 2.6 They wanted the game to *feel* systemic and alive, cheaply
Crew are simulated as aging, bonding, breaking-down individuals; ATLAS decays; children are born on
the crossing; the land "remembers" what you take (`ecoHarm`, `renderColony` 4624). None of this is
required to win — it is texture that makes the systems feel like a world. The parallel two-front
endgame and its 13 folded endings (composeEnding 2863-2888) are pure elaboration of consequence:
the builders wanted *your specific mix of choices* to produce a *specific, differently-worded fate*.
The effort-to-payoff ratio here signals that **meaningful, legible consequence** is a core value.

### 2.7 They value self-containment and portability
Zero runtime dependencies, no build step, synthesized audio with no asset files (audio.js header),
CSS with no external fonts beyond system stacks (`--display` etc. 29-31), `localStorage`-only
persistence. The implied intent: **the game must run anywhere, forever, from three static files** —
robustness and longevity over modern tooling convenience.

### 2.8 Things present that serve no obvious *gameplay* goal
- **A large orchestration/agentic apparatus is entangled in the graph** (GRAPH_REPORT.md: `.claude/`
  agent definitions, `scripts/log_event.py`, `watchdog.ps1`, communities for Planner/Builder/Auditor/
  Reverse-intent, "Devil's Advocate," a remediation graph). This is a **development-process** system,
  not a game system — it serves *how the game is built and verified*, implying the builders care as
  much about a disciplined, auditable build pipeline as about the game itself. (I did not read those
  files; this is from the graph and the test/script scaffolding.)
- **A dormant "colonyLaunch" / Game-B path** is dispatched (`case "colony" … "launch"` 4821) but the
  comment marks it "intact but dormant in Phase 2" — built-ahead capacity not yet wired to a UI.
- **Legacy-save shims**: `voyageEarthSignal` tolerates old saves (606-607), the voyage screen has a
  branch purely to un-park a "legacy P3-M1-era" save (4659-4671, `case "voyage" "begin"` 4825). These
  serve backward-compatibility across the project's own iterations, not the current player.
- **`SAVE_KEY` = "…-save-v7"** (game.js:15) — the version-7 suffix silently attests to at least seven
  save-schema iterations, i.e. a long, churny development history behind a small codebase.

### 2.9 Net picture of what the builders believed mattered
1. **Fairness/odds are sacred** (frozen-three, difficulty-as-only-lever).
2. **Consequence must be real and irreversible** (permadeath, clearSave).
3. **Outcomes must be sampled, never authored** (posture/potential/sampling engine).
4. **Checks must never lie** (silent-death traps, vacuous-pass guards).
5. **Every control and meter must stay visible and reachable** (one-screen CSS invariants, a11y).
6. **Theme and immersion matter, but below correctness** (CRT/viewscreen ornament that never
   compromises layout).
7. **The build process itself must be disciplined and auditable** (the agentic/verify scaffolding).

---

## DELTA 2 — the return trail (update pass, merged main `bbdba5c`)

*Same independence rule: only the changed code was read (`game.js` return-leg region,
`renderReturnMap`, `test/homeleg.js`). Line numbers are from the post-merge file.*

### D2.1 WHAT IT DOES now on the crossing home

The homeward leg, previously a bare distance bar, now has a **named landmark layer**:

- **`HOME_WAYPOINTS`** (`game.js:2521-2528`) defines three interior landmarks keyed by a
  *fraction* of the voyage total, not absolute distance: The Fold Seam (`at: 0.20`,
  `anchorEvent: null`), The Halfway Dark (`at: 0.50`, `anchorEvent: "longdark"`), The Last
  Beacon (`at: 0.80`, `anchorEvent: "word"`). They are pure "between" places — void seams and
  relay edges — never re-transited Sol ports (comment `2515-2517` calls this a "fiction guard").
- **Crossing detection** — `startVoyage` seeds `v.waypointIndex: 0` as an explicit *sibling*
  of the outbound `game.waypointIndex` (`game.js:2441`). Each `voyageTurn` calls
  `voyageCrossLandmarks(auto)` (`2506`), whose while-loop (`2532-2542`) advances
  `v.waypointIndex` whenever `v.distance / v.total` passes the next landmark's `at` — a
  structural mirror of the outbound advance loop at `game.js:724`, but reading `game.voyage`.
  The fractional keying is deliberate robustness: mid-run distance jumps (the "fold" event
  adds `distance: +70`, `2569`) can't skip the bookkeeping the way a fixed cumulative table
  would (comment `2502-2503`).
- **Landmark beats** — `voyageLandmarkBeat` (`2548-2557`) logs the landmark's blurb; if the
  landmark carries an `anchorEvent` id, it looks that entry up **in the existing
  `VOYAGE_EVENTS` pool** and dispatches it through the committed chain
  (`presentVoyageEvent` / `resolveVoyageCheck` / `voyageOutcome`) — no new resolver.
  "word" is condition-gated (Earth not silent, `2589`) and skipped quietly if ungated (`2552`).
  Off-front (`auto`) crossings resolve the safe/non-role choice inline with no modal
  (`2553-2555`), matching the existing off-front convention.
- **Map plotting** — `renderReturnMap` (`4418-4442`) now plots the interior landmarks on the
  curved homeward chart between the Earth (left, 0%) and Proxima (right, 100%) endpoints. Since
  the ark flies leftward, a landmark's screen x is mirrored: `left:(1-at)*100%` (`4432-4433`).
  Node state (visited / current-with-halo / future) derives directly from `v.waypointIndex`
  (`4429, 4434-4437`), and labels alternate above/below the rail exactly like the outbound map.
  The comment declares it "presentation only — reuses rmChart/rmGlyph/rmCurveY (gate-pinned),
  no new map engine" (`4428`).
- **Statistical harness** — `test/homeleg.js` is a *winnability sweep*, not a unit test: three
  arms of n=200 full crossings driven through the real `voyageTurn(true)` loop. It pins a sound
  ark's survival to [94%,100%] and a wounded Voyager ark's loss rate to [28%,52%]
  (`homeleg.js:105,116`), asserts every arrival crosses all three landmarks **in order 0,1,2**
  (`142-143`), and runs a "coupling-drift guard" confirming the anchored ids actually fire at
  their landmarks by scanning the live log (`150-174`). A third arm temporarily overrides
  `HOME_EVENT_P` to 0.40 through a test-seam get/set accessor pair (`game.js:5083`) and
  verifies it restores (`homeleg.js:122-135`) — a preview knob with zero shipped-byte change.

### D2.2 Does landmark state feed any danger/odds function?

**No — verified in the code paths, not just the comments.** The per-turn peril split is two
constants, `HOME_HAZARD_P = 0.18, HOME_EVENT_P = 0.34` (`game.js:2667`), consumed once per
turn (`2510-2512`); nothing writes them in production (the only setter is the harness seam,
`5083`). `voyageHazardDanger` (`2696-2707`) reads hull, awake-Pilot skill, brownout, posture,
`potential`, and difficulty — **no `v.waypointIndex`, `v.distance`, or `HOME_WAYPOINTS` term**.
The comment block at `2500-2505` asserts this boundary explicitly ("Structure/anchor ONLY:
never reads into voyageHazardDanger… never varies odds by position").

One precise caveat: while *continuous odds* are position-independent, the two **anchored
landmarks deterministically inject a guaranteed event at a fixed position** — "longdark" at
50% (a Commander check, morale ±, `2592-2596`) and "word" at 80% (morale +9,
`inf: {persist: +3}`, `2589-2591`). These are scripted *placements* of already-sampled-outcome
events, so the sampled engine still resolves them; but strictly speaking the crossing is no
longer probabilistically uniform — two beats are position-locked by design.

### D2.3 IMPLIED INTENT of the delta

1. **Pacing without touching the odds.** The entire layer is engineered to add narrative
   *shape* to the emptiest stretch of the game — the decades-long crossing — while provably
   not moving a single probability. The sibling-not-reuse discipline (`v.waypointIndex`
   beside `game.waypointIndex`, `voyageOutcome` never the frozen `applyOutcome`), the
   fraction-keyed positions, and the explicit lock-boundary comment all say the builders'
   first fear when adding content is *accidentally changing the game's fairness*. The
   balance-is-sacred priority inferred in §2.3 is not just preserved — it is now defended
   with in-line boundary declarations at the point of extension.
2. **The dead middle of the voyage was judged a real problem.** Anchoring "longdark" at the
   exact 50% point (maximum distance from both worlds) and "word" at the last plausible
   signal horizon shows the builders think the *emotional low point and the first touch of
   home* deserve guaranteed, not left-to-chance, placement. They were willing to bend
   sampled-everywhere purity for exactly two beats — the clearest statement yet of a
   narrative-pacing value ranked just below, but touching, the odds-purity value.
3. **Statistical, not anecdotal, verification of game feel.** `homeleg.js` asserting
   survival-rate *bands* over 600 simulated crossings extends the anti-silent-failure
   apparatus (§2.4) into balance territory: the builders now regression-test *difficulty
   itself*. A future change that makes the crossing easier or deadlier trips the gate even
   if no function drifted byte-wise.
4. **Present with no apparent mechanical goal:** "The Fold Seam" (`anchorEvent: null`,
   `2522-2523`) does nothing but log a blurb — pure foreshadowing texture for the existing
   "fold" event (`2566`). Likewise the harness's RIDER 2/4 data recordings (quiet-turn share,
   birth counts, `homeleg.js:21-22, 102-103`) assert nothing; they exist to feed some future
   tuning decision. Both are built-ahead scaffolding: evidence the builders instrument first
   and decide later.
5. **Tuning happens in harness runtime, never in shipped bytes.** The `HOME_EVENT_P` get/set
   accessor pair on the test seam (`game.js:5083`) exists so a balance experiment can run
   (the B-preview arm) without editing the shipped constant — the same "zero shipped-byte
   change" discipline the frozen-three gate embodies, now applied to tuning previews.

---

*End of report.*

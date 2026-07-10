---
file: audit-design.md
project: Prompt Writing
chat: Proxima Centauri Trail
date: 2026-06-27
---

# Track C — Creative / Design & Pacing Audit

*Fresh-eyes studio review of the full arc. Mandate: make it attractive, engaging, and intuitive for the average human — **without changing, weakening, or softening gameplay**. Findings are tagged **[Wrapper]** (free to change — telegraphing, framing, feedback, retention surfacing) or **[Sacred-adjacent]** (the fix needs your sign-off and **never alters odds, difficulty, scarcity, or hidden meters**). Source-cited so you can verify.*

---

## Bottom line

The design is **more ambitious and better-tuned than it looks from the outside, and that's the problem.** Three real games (voyage out → colony → voyage home), a genuine emergent-economy colony sim, a hidden Earth-doom clock, and a 15-cell ending matrix — all sitting behind a first run the average human loses without understanding why. The numbers confirm it: **naive play wins 0% on every difficulty** (plan, line 245). The game is *fair but opaque*. It isn't gated by being too hard; it's gated by a player never discovering what's there.

So the design work is not "add or ease." It's **make the existing depth visible and felt** — telegraph the arc, give the long stretches a sense of progress, let the endings become a chase, and turn the silent off-front (M-INT1b) into something the player can read. Every recommendation below preserves the sacred core; most are pure surfacing.

**Verdict: world-class systems, under-communicated. The ceiling is high; the on-ramp is missing.**

---

## What I'm auditing against (the arc, from source)

| Act | What it is | Length / gate (source) | Verb richness |
|-----|-----------|------------------------|---------------|
| **1 · Voyage out** | The proven core trail | 434 ly, ~9 waypoints (`CUM`, game.js 74) | **Highest** — store, mining mini-game, hazard crossings, stations (trade/jobs), ATLAS, first contact |
| **The Decision** | Crew split STAY vs RETURN, ≥1 each | one-time hub (`openFutureDecision`, plan 349) | One high-stakes fork |
| **2 · Colony (Game A)** | Emergent self-sufficiency sim | take root at 100 held ≥3 yrs (plan 238) | One yearly lever: Build/Research/Survey/Tend/Fortify/Diplomacy |
| **3 · Voyage home (Game B)** | Mirror trail, Earth-aware | 432 home, `VOY_YEARS_PER_TURN 1.6` (game.js 160) | Thrust/Rations/Pods/Rest/Scavenge + Tend-the-colony |
| **Parallel fronts** | Colony + ship on a shared clock | already live; off-front auto-ticks (plan 406) | **Legibility only** (M-INT1b) |
| **Endings** | colony tier × voyage tier × beacon | 15+ cells (M-INT1 re-tier) | The payoff matrix |

Difficulty (the only legitimate lever, sacred): **Settler 1.0× / Pioneer 1.6× / Voyager 2.2×** (game.js 92–95). Ranks: **CASTAWAY 0 · DRIFTER 1200 · NAVIGATOR 2600 · COLONIST 4200 · FOUNDER 6000** (game.js 171–176).

---

## Severity tally

| Sev | Meaning | Count |
|-----|---------|-------|
| **D1** | Engagement-critical — average human disengages or never discovers core content | **2** |
| **D2** | Major — a key beat under-delivers vs its design weight | **3** |
| **D3** | Minor / polish | **2** |
| **D4** | Retention surfacing (nice-to-have) | **2** |

Split: **7 [Wrapper] · 2 [Sacred-adjacent]**. No finding changes odds, scarcity, or hidden meters.

---

## Findings

### D1-1 — The scope of the game is invisible at first contact · [Wrapper]
**What:** A first-timer has no idea this is a three-act, multi-ending epic. The title promises "found a colony — if you can"; nothing hints that a *successful colony is only act two*, that you can send a ship **back** to a dying Earth, or that **TWO WORLDS** (colony **and** ship home) is the crown ending. The most ambitious thing about the game is hidden until you've already won twice.
**Why it matters:** people replay toward goals they can see. An unseen ceiling motivates no one.
**Fix:** telegraph the arc without spoiling it — a one-line "the journey out is only the beginning" on the title/how-to, and an **ending matrix in the logbook** (locked silhouettes for endings not yet seen). Surfacing only; the content already exists.

### D1-2 — The first run is an unguided wall (naive win-rate 0%) · [Wrapper]
**Evidence:** plan line 245 — naive play wins **0%** on every tier; even optimal Settler tops out ~47%.
**What:** The systems (power hub, interdependence, the void-leg provisioning test) are deep and unforgiving, and a new player meets all of it at once with no scaffolding. They lose run 1 hard, often without understanding the causal chain (hull → reactor → O₂ → death). This is *the* market-readiness gate, and it is **not** a difficulty problem — it's an onboarding problem.
**Fix (no gameplay change):** a guided framing for the **first** voyage — surface **Settler as the recommended start**, lean on the existing Store TIPS / hazard flavor (already good), and add a thin first-run causal nudge ("hull damage is cutting your reactor output → oxygen is falling"). Teach the chain the game already simulates; don't soften it. *(Pairs with Track B onboarding; here it's the design framing.)*

### D2-1 — The void leg is a 41%-of-the-trip pacing trough · [Sacred-adjacent]
**Evidence:** `CUM` (game.js 74) — the void leg spans ~180 of 434 units, one stretch, sparse waypoints; plan calls it "the void leg is long — bring air and food."
**What:** This long, low-interaction dark is **intentional scarcity** — it's the test you provisioned for at the Store, and it's load-bearing gameplay. But for the average human, a long quiet stretch reads as "nothing is happening," which is where attention drops.
**The line:** do **not** shorten it, add stations, or hand out resources — that's the scarcity, and it's sacred. Fix **legibility and dread** instead: a clear "you are X% through the long dark" sense of progress, and one or two atmospheric beats that cost nothing mechanically (a log line, a morale flicker) so the silence feels *designed* rather than empty. **Needs your sign-off** because it touches the core scarcity stretch — but the fix adds feeling, not margin.

### D2-2 — The Decision is the emotional fulcrum but risks reading as a roster UI · [Wrapper]
**Evidence:** `openFutureDecision` → readiness gate → roster; "≥1 stays AND ≥1 returns" (plan 338–355). I saw the crew-split roster screen — functional, but it's a list with toggles.
**What:** This is the single heaviest beat in the game: you decide who stays under an alien sun and who risks the dark to carry word home — and because of bonds, **some of these people will never see each other again.** Mechanically it's perfect. Emotionally, the presentation is a personnel form.
**Fix:** heighten the *ceremony* around the existing mechanic — a framed moment before the roster ("Choose who carries the word home. Choose who you will never see again."), surface the **bond** each assignment breaks, and a beat of confirmation weight. Zero mechanical change; pure framing of a fork that's already there.

### D2-3 — Off-front blindness — the unfocused front advances invisibly · [Wrapper] → **M-INT1b**
**Evidence:** plan 406–407, 425 — both fronts already advance on a shared clock; the off-front already auto-ticks (`voyageAfterTurn`→`colonyAutoStep`); the focus handler already switches screens; `composeEnding` already weighs both. The only thing missing is **UX**.
**What:** When you focus the colony, the homebound ship runs in the dark, and vice-versa. You toggle back and simply *find* a changed state — a worse year, a hazard survived — with **no narrative of what happened while you were away.** The most novel mechanic in the game is currently a silent background process.
**This is the entire M-INT1b mandate** (next deliverable): make the off-front **legible** — a digest of what happened while you were focused elsewhere, a persistent both-fronts status line, and a clear toggle — **without changing what the auto-step does** (odds untouched; this is a wrapper over a working engine). It must also inherit the **Voyage-HUD compact layout** (Track B U1-2) so it doesn't reintroduce the mobile fold bug on a third HUD.

### D3-1 — The dread clock is excellent and diegetic — preserve it · [Sacred]
**Evidence:** `pressure = exodusYears() / EARTH_DOOM_YEARS` (220), silence gut-punch at estimate ≥3 (game.js 589, 606). Surfaced as the **Earth signal: live → faint → silent** (seen on travel + voyage HUDs).
**What:** A hidden time-pressure that makes "perfect the colony, or launch home now?" genuinely tense, communicated *diegetically* through the fading signal rather than a number. This is design at its best. **Do not expose the meter.**
**Light touch (optional):** echo the signal state once at the Decision ("Earth's signal is already faint — every year you wait, the silence grows"), so the player *feels* the clock at the one moment it should weigh on them. Surfacing the existing diegetic cue, not the hidden number.

### D3-2 — Invisible scoring incentives (speed par, rank thresholds) · [Wrapper]
**Evidence:** `speedBonus = max(0, (400 - day) × 6)` if won (game.js 1191) — a hidden day-400 par; ranks at 1200/2600/4200/6000 (171–176).
**What:** Two of the game's replay incentives — finish faster, climb the rank ladder — are completely invisible during play. The player can't aim at a target they can't see.
**Fix:** surface them in the meta, not the formula — show the rank ladder + your best on the score/logbook screen ("DRIFTER → you're 740 from NAVIGATOR"), and a soft "the longer the crossing, the smaller the speed bonus." No number in the formula changes.

### D4-1 — The 15-ending matrix is a latent collection hook · [Wrapper]
**What:** colony tier × voyage tier × beacon = a rich matrix (TWO WORLDS, A WORLD AND A SILENT SHORE, THE MESSENGER, EXTINCT, THE WORD GOT THROUGH…). Right now most players see one or two and stop. That matrix is a **"gotta-see-them-all" engine** going unused.
**Fix:** an **ending gallery** in the logbook — seen endings revealed, unseen ones as locked silhouettes with a one-word hint. Turns one-and-done into a chase. Pure surfacing of content that already exists.

### D4-2 — Surface the difficulty climb · [Wrapper]
**Evidence:** the gradient is real and well-tuned (Settler 47 / Pioneer 43 / Voyager 17; game.js 92–95).
**What:** The legit difficulty lever (Settler→Pioneer→Voyager) is the intended long-term progression, but there's no visible reason to climb beyond raw score multiplier.
**Fix:** show **best rank per tier** in the logbook ("Settler: FOUNDER · Pioneer: COLONIST · Voyager: —") so the ladder becomes a visible goal. The mult (×1.0/×1.6/×2.2) already rewards it mechanically; this just makes the climb legible.

---

## What is already strong — do NOT touch

- **The emergent-self-sufficiency colony redesign** (one lever, a *derived* goal, automatic economy; plan 232–245) — genuinely sophisticated systems design. Keep exactly as is.
- **The dread clock + diegetic Earth signal** — best single design idea in the game.
- **The 15-cell ending matrix** keyed on colony × voyage × beacon — the crown. (M-INT1 already fixed its one incoherent cell.)
- **The tuned difficulty gradient** — fair, real, naive-proof. The 0% naive win-rate is a *feature* (it means mastery matters), not a bug to patch.
- **Permadeath · sampled-not-scripted outcomes · bonds-cascade-grief · the brutal economy · resource interdependence** — the sacred spine. Every finding above routes around these.
- **TWO WORLDS** as the emotional peak, and the optional nature of going home (a settled colony is already a complete ending).

---

## Pacing map (where engagement rises and dips)

```
Act 1 voyage out   ████████░░  high — but DIPS hard across the void leg (D2-1)
The Decision       ██████████  peak stakes — under-framed (D2-2)
Act 2 colony       ███████░░░  deep sim, but fewer verbs/min than Act 1 (legibility, not content)
Act 3 voyage home  ███████░░░  + the dread clock tightens it (D3-1, good)
Parallel fronts    ████░░░░░░  silent today → M-INT1b is the lift (D2-3)
Endings            ██████████  crown payoff — but most players never see the matrix (D4-1)
```

The two real troughs are **the void leg** (sacred-adjacent: fix with progress-feel, not margin) and **the silent off-front** (M-INT1b). The two unrealized peaks are **the Decision's framing** and **the ending matrix as a chase**. None requires changing how the game plays.

---

## Hand-off to M-INT1b (next deliverable)

The design verdict points straight at M-INT1b as the highest-leverage *design* fix, and it's almost entirely free of gameplay risk because the dual-front engine already runs (plan 406). M-INT1b = the legibility layer:

1. a clear **focus toggle** (COLONY ⇄ HOMEWARD SHIP) with both fronts' status always visible;
2. an **off-front digest** — what happened on the front you weren't watching, in narrative, when you toggle back;
3. inherit the **Voyage-HUD compact layout** so the third HUD ships mobile-correct from day one.

Before I write the build-ready plan-mode prompt, three design forks need your call (next message) — chiefly how much of the off-front to replay (full event log vs one-line digest vs adaptive), how persistent the both-fronts status line should be, and whether the toggle is free or costs a turn. Those decisions shape the plan, so I'll put them to you as a short pick-a-letter set rather than guess.

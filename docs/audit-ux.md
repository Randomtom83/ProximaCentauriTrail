---
file: audit-ux.md
project: Prompt Writing
chat: Proxima Centauri Trail
date: 2026-06-27
---

# Track B — Product / UX & Controls Audit

*Fresh-eyes studio review. Mandate: make the game attractive, engaging, and intuitive for the average human — **without changing, weakening, or softening gameplay**. Every finding here is **[Wrapper]**: legibility, layout, onboarding, feedback. **Nothing in this track touches the sacred list** (permadeath, sampled outcomes, hidden meters, the economy, resource interdependence, emergent bonds, the Settler/Pioneer/Voyager tiers). No odds change. No difficulty change.*

---

## Bottom line

The game is **desktop-complete and mobile-broken.** On a 1280×800 desktop it is genuinely shippable — beautiful, legible, the whole turn fits on one screen. On a 390×844 phone — which is how the overwhelming majority of "average humans" will open a link-shared browser game — the **single most important control on the most-used screen is below the fold**, and a **layout bug sits at the top of every screen.** Neither is a gameplay problem. Both are CSS/layout.

The good news, and the spine of this report: **the fix already exists inside the game.** The homeward Voyage HUD lays out correctly on a phone (action row above the fold) because it uses a compact 2-column resource panel and a short crew strip. The Travel and Colony HUDs bury their controls only because their panels are taller. Port the Voyage HUD's treatment to the other two and the worst problem disappears with zero gameplay risk.

**Verdict: ship-blocking on mobile, trivially fixable, no gameplay touched.**

---

## What I actually looked at (and the honesty boundary)

Evidence is the **60 committed PNGs** at `docs/screenshots/` (commit `76ae9ec`), pulled from the repo and viewed directly. I inspected with my own eyes: `travel-hud` (mobile + desktop), `title`, `store`, `colony-hud`, `voyage-hud`, `modal-event`, `modal-hazard`, `end-win` (all mobile). The remaining states are covered from the inventory + Track A source read.

**Verified technical fact:** every mobile PNG is **780×1688 px = 390×844 CSS px at deviceScaleFactor 2** — a **viewport capture at scroll 0**, i.e. exactly the first phone screen with no scrolling. So "below the fold" below is literal, not inferred. It is also **conservative**: a real mobile browser's URL bar consumes ~150–180 px, so the true visible area is ~390×660 and the real fold is *higher* than what these shots show.

**What these static shots cannot tell me** (deferred, flag honestly): animation/feel, tap responsiveness, scroll smoothness, intermediate/tablet widths, landscape, and real-device font rendering. Those need a live device pass before release sign-off.

---

## Severity tally

| Sev | Meaning | Count | All wrapper? |
|-----|---------|-------|--------------|
| **U1** | Blocks the average human on a phone | **2** | yes |
| **U2** | Major legibility / first-impression | **3** | yes |
| **U3** | Minor / polish / accessibility | **5** | yes |
| **U4** | Defer to Track C (narrative) | **1** | yes |

**Zero gameplay nerfs. Zero sacred-adjacent items.** All eleven are free to fix.

---

## The central finding: desktop-complete, mobile-broken

Same screen, two viewports:

- **`travel-hud__desktop`** — topbar fits on one line; SUPPLIES and CREW sit side-by-side; all 5 crew show hp/mor bars; the full action row (Continue · Thrust · Rations · Power · Pods · Rest & repair · Mine · ATLAS · Abandon run) is visible above SHIP'S LOG. **The entire turn is on one screen.** This is the design target and it's strong.
- **`travel-hud__mobile`** — the same content reflows into one tall column. The first screen shows topbar → NAVIGATION → SUPPLIES → the *start* of CREW (only Mara, clipped). **The action row is not on the first screen at all.** The player's primary per-turn verb is unreachable without scrolling past two full panels and a 5-person roster.

Everything below follows from this single reflow.

---

## Findings

Each: severity · tag · evidence (screenshot) · what · fix · gameplay-risk.

### U1-1 — Topbar overflows on every mobile screen · [Wrapper]
**Evidence:** `title__mobile`, `store__mobile`, `travel-hud__mobile`, `colony-hud__mobile`, `voyage-hud__mobile`, `modal-event__mobile`, `modal-hazard__mobile`, `end-win__mobile` — **all of them.**
**What:** The brand "A.S. PROXIMA · BRIDGE" collides with the status text (BEST SCORE / DAY·NEXT·distance), and the ANIM/SND toggle buttons are clipped off the right edge (you see "SN…", "♪"). The first thing a new player sees on a phone is a broken header.
**Fix:** The topbar is an inline desktop row that doesn't wrap for narrow widths. On mobile: stack to two rows (brand line; status line) or drop the brand to an icon, and move ANIM/SND into a collapsed control or the How-to screen. Pure CSS at the mobile breakpoint.
**Gameplay-risk:** none.

### U1-2 — Primary action row below the fold on Travel + Colony HUDs · [Wrapper]
**Evidence:** `travel-hud__mobile`, `colony-hud__mobile` (action row absent from the scroll-0 viewport); contrast `voyage-hud__mobile` (action row present).
**What:** On the two most-used screens, the buttons the player presses *every single turn* are pushed below topbar → resource panel(s) → a 5-person crew strip. The colony HUD is even taller (Hope + Life Support + Settlement + Crew), so its per-cycle verbs sit even deeper. A first-time phone player lands on the HUD and sees no way to act.
**Fix (already proven in-game — see below):** adopt the Voyage HUD's compact 2-column resource panel, and/or move the action row above the crew strip in DOM order on mobile, and/or pin a slim action bar to the bottom of the viewport. Any one of these lifts the verb above the fold.
**Gameplay-risk:** none — reorders/restyles existing controls; changes nothing about what they do.

### U2-1 — Title ASCII logo garbled and clipped on mobile · [Wrapper]
**Evidence:** `title__mobile`.
**What:** The game's own name is a monospace ASCII-art logo. At 390 px it neither fits (clipped mid-word at "TRA…") nor parses as letters — it's an illegible jumble of slashes and underscores. **The title screen doesn't show the title on a phone.** (The menu buttons below it are clean and well-sized — that part is fine.)
**Fix:** swap the ASCII logo for a responsive SVG/text wordmark at the mobile breakpoint, or scale/replace it under a width media query. The desktop ASCII can stay.
**Gameplay-risk:** none.

### U2-2 — Route-map node labels collide · [Wrapper]
**Evidence:** `travel-hud__mobile` (severe — "Ares Station"/"Asteroid Belt" overlap into mush); `travel-hud__desktop` (minor — the two adjacent labels still touch).
**What:** Adjacent waypoint labels under the node rail overprint each other. Unreadable on mobile, slightly sloppy on desktop.
**Fix:** label only the current + next node, or alternate label above/below the rail, or truncate with ellipsis + tap-to-reveal. Present on desktop too, so worth fixing once for both.
**Gameplay-risk:** none.

### U2-3 — Store row "have / cr/step" layout is cramped on mobile · [Wrapper]
**Evidence:** `store__mobile`.
**What:** Each row crams name, price, "have N", and a two-column "N cr/5" into narrow space; the +/- step subscripts ("+5"/"−5" with the number stacked under the sign) read awkwardly. A new player's *first real decision* is harder to parse than it should be. (The TIPS panel right below it — "Fuel moves you; oxygen & food keep the crew…" — is excellent onboarding and should stay.)
**Fix:** single-line-per-resource with a clear "Own 30 · 6 cr ea" label and larger, unambiguous −/+ steppers. Layout only.
**Gameplay-risk:** none — prices and quantities unchanged.

### U3-1 — Choice buttons double-label the required role · [Wrapper]
**Evidence:** `modal-event__mobile` ("Quarantine and treat **(Medic)** **[Medic]**"), `modal-hazard__mobile` ("Thread it at speed **(Pilot's hands)** **[Pilot]**").
**What:** The authored choice text already names the role in parentheses, and the system appends a `[Role]` requirement tag — so the role prints twice. Reads as a bug.
**Fix:** suppress the `[Role]` tag when the label already contains the role, or standardize on the tag and strip the parenthetical. Cosmetic.
**Gameplay-risk:** none.

### U3-2 — Disabled (role-gated) choices give no reason · [Wrapper]
**Evidence:** `modal-hazard__mobile` — "Thread it at speed (Pilot's hands)" renders greyed/disabled.
**What:** Showing the locked option is *good* telegraphing (the player sees the path exists). But there's no reason why it's locked — a new player sees a dead grey button and can't tell if the Pilot is dead, busy, or hurt.
**Fix:** append a short reason on disabled options ("— Pilot incapacitated" / "— no Pilot aboard"). Reading state you already track; changes no odds.
**Gameplay-risk:** none.

### U3-3 — Day / voyage readout duplicated · [Wrapper]
**Evidence:** `travel-hud__mobile` — topbar shows "DAY 168 · NEXT: The Asteroid Belt · 100/434" and the NAVIGATION panel immediately repeats "Day 168 (voyage yr 12) · Next waypoint The Asteroid Belt." Same on the voyage HUD.
**What:** The same three facts print twice within one screen — wasteful on a phone where vertical space is the scarce resource feeding U1-2.
**Fix:** drop the duplication from one location on mobile (recommend trimming the topbar to brand + toggles, keep the rich readout in the NAVIGATION panel).
**Gameplay-risk:** none.

### U3-4 — Accessibility: whole-app aria-live + no modal focus trap · [Wrapper] *(overlaps Track A S2-3)*
**Evidence:** source (`aria-live="polite"` on `#app`; zero `.focus()` calls), not a screenshot.
**What:** A screen reader re-announces the entire HUD every turn (one polite region wrapping everything), and modal dialogs don't move or trap focus, so keyboard/AT users aren't taken to the choice. This is the biggest "average human with assistive tech" gap.
**Fix:** scope aria-live to a small log/status region; on modal open, move focus to the dialog and trap it; restore focus on close. (Tracked jointly with Track A S2-3.)
**Gameplay-risk:** none.

### U3-5 — Dead vertical space on menu/title screens · [Wrapper]
**Evidence:** `title__mobile` (bottom ~40% empty below the menu).
**What:** Not a bug — just unused space that could carry the wordmark fix (U2-1), a one-line "how it works," or breathing room. Low priority.
**Fix:** optional; fold into the U2-1 wordmark work.
**Gameplay-risk:** none.

### U4-1 — Win-screen ending prose echoes itself · [Wrapper → Track C]
**Evidence:** `end-win__mobile` — "A colony takes root under an alien sun…" then later "Under an alien sun a human settlement takes root and grows."
**What:** `composeEnding` concatenates the headline + colony blurb + voyage blurb, and on the TWO WORLDS cell the colony and voyage lines restate the same image. Reads slightly repetitive at the emotional peak. This is **narrative polish, not layout** — handing to **Track C** (and it touches `composeEnding`, which M-INT1 deliberately unfroze, so it's the natural place to smooth it).
**Gameplay-risk:** none (text only; tiers/odds unchanged).

---

## The fix already exists in-game

`voyage-hud__mobile` is the proof. It lays out correctly on a phone — the action row (Continue · Thrust · Rations · Pods · Rest & repair · Scavenge · Tend the colony) is **above the fold** — for two structural reasons the other HUDs don't share:

1. **Compact 2-column resource panel** (Fuel/Oxygen, Food/Medicine, Hull/Years side-by-side) instead of the Travel HUD's taller mostly-full-width SUPPLIES block.
2. **Short crew strip** (2 aboard vs 5), so the roster doesn't push the verbs down.

The Colony HUD already uses 2-column LIFE SUPPORT and SETTLEMENT panels — it's most of the way there and just needs the crew strip + action row reorder. So the remedy for U1-2 isn't invention, it's **porting a pattern the game already ships.** That's the lowest-risk way to fix the worst problem.

---

## What is already good — do NOT touch

Preserve these; they're working:

- **The modals are the strongest part of the mobile experience.** `modal-hazard__mobile` and `modal-event__mobile` are focused, centered, atmospheric, legible — amber frame, dimmed HUD, icon, flavor, clear choices. The hazard's "only ways that are less likely to kill you" + the little tumbling-rock ASCII field sets stakes perfectly. Don't flatten these.
- **The aesthetic.** Dark bridge / LCARS blue + amber, rounded panels, CRT frame. Cohesive and polished across all 30 states.
- **Controls are real and accessible-by-construction.** Verified in Track A: focusable `<button data-action>` elements with visible key hints ([R]/[N]/etc.), a wired `keydown` listener, and a clean dispatch model. This is *not* a div-soup game — the controls just need to be *positioned* for mobile, not rebuilt.
- **Onboarding telegraphing already started:** the Store TIPS panel and the hazard flavor teach the resource model and the stakes in-line. Extend this pattern; don't remove it.
- **The endings land.** `end-win__mobile` — big title, rank badge, legible score breakdown (showing the Difficulty ×1.6 lever), named survivors in the manifest. The payoff reads on a phone.

---

## Controls verdict

**Real controls, wrong position on mobile.** Keyboard map exists and is wired; buttons are genuine focusable elements with key hints and good affordance (amber = primary action throughout, red = destructive "Abandon run"). The problem is never *what* the controls are — it's that on a phone the main action row falls below the fold (U1-2) and the header that frames them is broken (U1-1). Fix position and overflow; leave the control model alone.

---

## Remediation order (mobile-first, all wrapper)

1. **U1-1 topbar overflow** — every screen; the first thing every player sees. Cheapest, highest-visibility win.
2. **U1-2 action row above the fold** — port the Voyage HUD pattern to Travel + Colony (2-col panels; reorder/pin action row). The ship-blocker.
3. **U2-1 title wordmark** — responsive SVG/text logo on mobile.
4. **U2-2 route labels / U2-3 store rows** — legibility cleanup.
5. **U3-1 / U3-2 modal label + disabled-reason** — quick polish on the already-strong modals.
6. **U3-3 dedup readout / U3-4 a11y (with Track A S2-3) / U3-5 dead space** — debt + accessibility.
7. **U4-1 ending echo** — hand to Track C.

---

## Hand-off

- **To remediation roadmap (synthesis):** U1-1 and U1-2 are release-gate items for any mobile launch; everything else is fast-follow. All wrapper — none needs sacred-list sign-off.
- **To Track C / M-INT1b:** the off-front-blindness concern for the parallel COLONY⇄HOMEWARD SHIP toggle should inherit the Voyage-HUD compact layout from day one so M-INT1b doesn't reintroduce U1-2 on a third HUD. U4-1's `composeEnding` echo lands in Track C (and rides the M-INT1 unfreeze).
- **To live-device pass (pre-release):** confirm the deferred items — feel, tap latency, scroll, tablet/landscape, real-font rendering — that static shots can't show.

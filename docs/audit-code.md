---
file: audit-code.md
project: Prompt Writing
chat: Proxima Centauri Trail
date: 2026-06-27
---

# Proxima Trail — Track A: Engineering / Code Audit

*Fresh-eyes acquisition due-diligence read of the committed source on branch
`claude/intelligent-galileo-y2siqb` (game.js @ 4,814 lines, commit `b735c59`). Filter applied to every
finding: **the gameplay loop is sacred; only the wrapper changes.** Each finding is tagged
**[Wrapper]** (free to fix) or **[Sacred-adjacent]** (protects a sacred property — fix needs sign-off,
but the fix itself does not alter odds or difficulty).*

## Verdict

The engine is **better than its line-count suggests** — a clean single IIFE, heavily and accurately
commented, with a genuinely sophisticated resource loop (per-distance life support, power-gated
production, escalating-then-resetting starvation/anoxia, difficulty-scaled severity, role bonuses woven
through). This is not spaghetti. It is a cult-favorite engine that a studio can ship.

What stands between it and "market-ready" is **not the gameplay — it is operational hardening**: the test
suite isn't in the repo, there are no error boundaries, autosave fails silently, and the accessibility
layer is present-but-naive. None of these require touching the loop. All are wrapper work.

**Severity tally:** 2 × S1 (release blocker) · 4 × S2 (major) · 5 × S3 (minor/debt) · 2 × S4 (polish).
Zero findings require weakening gameplay.

## Architecture assessment

| Dimension | Read |
|---|---|
| Structure | One ~4,814-line IIFE, `"use strict"`, no globals leaked. Sectioned + phase-commented. Readable. |
| Engine quality | High. `resolveTurn` (876–1056) is the model the colony/voyage loops correctly mirror. Interdependence is real, not cosmetic. |
| Determinism | Achievable (tests override `Math.random`) but **no seeded RNG** — see S2-2. |
| Save model | Single-key localStorage JSON, v7, permadeath. Robust *parsing* (guarded), fragile *writing* (S2-1) and *integrity* (S2-4). |
| Duplication | Deliberate sibling appliers (`applyOutcome`/`applyColonyOutcome`; three `resolve*Check`) — protects the zero-diff gate at a maintainability cost (S3-1). |
| Controls markup | Real `<button data-action>` elements with `[R]/[N]` key hints — natively focusable. Good foundation. |

## Findings (severity-ranked)

### S1 — Release blockers (a studio would not ship without these)

**S1-1 · The test suite is not in the repository. [Wrapper]**
Every harness the build process relies on — `feattest`, `fuzz`, `colonyskel`, `colonym2`–`m6`,
`crossingm2`, `homehaz`, `homesmoke`, `earthm4`, `decisionm1`, `arrivalfix`, `endings_golden` — lives in
`/tmp` on the build machine, uncommitted, with no CI. The repo contains the game and the design docs but
**none of its verification**. For an acquiring studio this is the single largest red flag: the safety net
that lets anyone change the code safely does not exist in source control, cannot be run by a new
engineer, and does not gate merges. *Fix:* commit the harnesses to `/test`, add a plain `node`-runnable
index (`test/run.js` or an `npm test` script), and a GitHub Actions workflow that runs them + `node
--check` on every push. This is the prerequisite for everything else — including this audit's own
remediation.

**S1-2 · No error boundaries anywhere except storage. [Wrapper]**
Six `try/catch` blocks exist (272, 274, 277, 283, 289) — **all** wrap localStorage. The turn loop,
event/hazard resolution, the three render paths, and the `handle()` dispatch have **none**. A single
uncaught exception mid-turn freezes the game with no recovery, and under permadeath a transient bug can
cost the player a run they did everything right in. There is no `window.onerror`, no telemetry, no
recover-and-resume. *Fix:* wrap `resolveTurn`/`colonyTurn`/`voyageTurn`, `renderApp`, and `handle` in a
boundary that logs, attempts `save()`, and surfaces a recoverable error screen; add a global
`window.onerror`. Behavior-neutral on the happy path; transforms reliability.

### S2 — Major

**S2-1 · Autosave fails silently. [Wrapper]**
`save()` (270–273) swallows all errors (`catch (e) {}`). The serialized `game` is large — full crew +
colony + voyage + a 220-entry log (294–297) + sites/events/flags. On a quota or serialization failure the
write silently no-ops; the player believes the run is saved, refreshes, and **the run is gone** — the
cruelest possible outcome in a permadeath game. *Fix:* detect write failure, warn the player explicitly
("autosave failed — this run may not resume"), and reduce blob size (cap the log far below 220 in the
*saved* copy, drop transient fields). No gameplay change.

**S2-2 · No seeded RNG. [Wrapper — enables features, changes no odds]**
13 `Math.random` call sites, no central PRNG. Two costs: (a) tests override the global `Math.random`,
which is fragile and order-dependent; (b) there is no way to reproduce a run from a seed — which blocks
both **bug-repro** ("here's the seed that crashed") and a **daily/seeded-challenge mode**, one of the
highest-value retention features for a roguelike. *Fix:* route all randomness through one injectable
`rng()` (e.g. mulberry32) with an optional seed surfaced in the run record. Odds are byte-identical; you
gain reproducibility and a marketing-friendly daily challenge. (Verify with the existing fuzz harness
that distributions are unchanged.)

**S2-3 · Modal focus is never managed; screen-reader announcements are naive. [Wrapper]**
Zero `.focus()` calls in game.js. Modals declare `role="dialog" aria-modal="true"` (index.html 48, 58)
but nothing **moves focus into the dialog or traps Tab inside it** — so a keyboard or screen-reader user
opening an event/hazard cannot reliably reach the choices and can Tab out into the now-hidden background.
Separately, `aria-live="polite"` sits on the entire `#app` (index.html 26), so a screen reader
re-announces the *whole* screen every turn instead of just what changed. *Fix:* on modal open, focus the
dialog's first control and trap Tab until close; restore focus on close. Add a dedicated `aria-live`
region for the log/event text and set the bulk HUD to `aria-live="off"`. Directly serves the
"intuitive for the average human" mandate without touching gameplay.

**S2-4 · Save is plain JSON under one key — no integrity, trivially editable. [Sacred-adjacent]**
The run serializes verbatim to one localStorage key. The design treats **permadeath / no save-scum** as
sacred, but a player can open devtools and edit `credits`, `hull`, or restore a deleted run in seconds —
quietly defeating that pillar. This becomes critical the moment any score goes to a leaderboard. *Fix
(needs your sign-off because it guards a sacred property):* add a lightweight integrity hash + light
obfuscation to the save blob; reject tampered saves to title. The fix changes **no** odds or difficulty —
it only enforces the permadeath the design already intends.

### S3 — Minor / maintainability debt

**S3-1 · Sibling-applier duplication will drift. [Wrapper]**
`applyOutcome` (2905) vs `applyColonyOutcome` (1994); `resolveCheck` (2948) vs `resolveColonyCheck`
(2032) vs `resolveVoyageCheck` (2554) — near-identical bodies kept separate to honor the zero-diff gate.
Deliberate and documented, but real long-term debt: a bug fixed in one **must** be hand-ported to the
others, and they will diverge. Now that M-INT1 has already lifted the gate off `composeEnding`, the
precedent for safe convergence exists. *Recommendation (post-Act-II):* fold the three resolvers and two
appliers onto a shared core guarded by a characterization test — the exact golden-harness pattern M-INT1
used.

**S3-2 · Dead / unwired code. [Wrapper]**
`habMult` (1320) and `tierOdds` (1329) are defined and **never referenced** (confirmed: one match each =
the definition). `voyageAutoStep` (2830) is defined but unwired — it's the forward hook M-INT1b will call;
fine, but track it so it isn't mistaken for live coverage. `KID_NAMES` (423) contains `" Favi"` with a
leading space (masked by `.trim()`, but a latent data smell). *Fix:* delete `habMult`/`tierOdds`, fix the
name, and add a one-line comment marking `voyageAutoStep` as an M-INT1b forward hook.

**S3-3 · Single 4,814-line file. [Wrapper]**
One IIFE holds all data tables, three turn loops, every render path, and the dispatch. It works and is
well-commented, but it is at the edge of maintainability and slows onboarding for the *team* a publisher
will assign. The plan already commits to "split static vanilla files, no build step." *Recommendation:*
split into plain `<script>` files (`data.js` / `engine.js` / `colony.js` / `voyage.js` / `render.js` /
`ui.js`) — no bundler, same load model, far more navigable. Do it after Act II is feature-complete to
avoid churn mid-build.

**S3-4 · 17 `innerHTML` sinks render interpolated strings. [Wrapper]**
All currently render developer-controlled text — there is no free-text input (names come from
`rerollNames`, 4726), so live XSS risk **today is low**. But it's a fragile pattern, and the moment custom
crew names or any typed text is added (a plausible, desirable feature) it becomes a live injection vector.
*Fix:* add a tiny `escapeHtml()` and apply it to interpolated dynamic strings now, as hygiene.

**S3-5 · Three different "no qualified hand" sentinels. [Wrapper]**
`skillFor` returns `25` (all hibernating) / `15` (specialist lost); `skillAwake` returns `12`. Three magic
values for adjacent concepts. *Fix:* name them (`SKILL_ASLEEP` / `SKILL_LOST` / `SKILL_NO_HAND`) and
document the intended ladder, so a balance pass can reason about them.

### S4 — Polish

**S4-1 · Tuning constants are inline. [Wrapper]** The anoxia/starve/wear/age curves (e.g. 919, 938, 1013)
are inline magic numbers, mostly the deliberate "tune in M-INT2" set. *Recommendation:* lift them into one
named `TUNING` block so the M-INT2 balance sweep edits one table, not scattered literals. (Pure
refactor — values unchanged.)

**S4-2 · `aria-hidden` decoration is correct; capitalize on it.** The scanline/flicker/cursor overlays are
properly `aria-hidden` (index.html 12, 13, 30, 35). Good. Extend the same care to the dynamic layer per
S2-3.

## What I could NOT assess here (honesty boundary)

- **Runtime performance.** No browser, so I cannot measure render cost of full-screen re-render every turn,
  or memory growth across a 60–90-turn run. Flagged for Track B once CC provides the UI capture; a
  full-`innerHTML` re-render each turn is a *likely* (not confirmed) perf/jank risk on low-end phones.
- **Visual correctness.** Whether the rendered HUD matches the markup's intent is a screenshot question
  (Track B / 3b).
- **Exhaustive per-function read.** I read the foundation, the turn-loop engine, save, render markup,
  dispatch, and a11y in depth, and static-swept all 244 functions for the systemic issues above. I did not
  line-read every function body; the colony/voyage loops were verified structurally as siblings of
  `resolveTurn` plus the M-INT1 golden run I did last session. If you want a line-by-line of a specific
  subsystem (e.g. the influence engine or the mining mini-game), name it and I'll deep-read it.

## Remediation order (feeds the M-INT2 delivery gate)

1. **S1-1 commit tests + CI** — unblocks safe change; do first.
2. **S1-2 error boundaries** + **S2-1 save-failure surfacing** — reliability, cheap, high-value.
3. **S2-3 modal focus + aria-live** — the biggest accessibility win for "average human."
4. **S2-2 seeded RNG** — pairs naturally with M-INT2 (verify distributions in the same sweep); unlocks the
   daily-challenge retention feature.
5. **S2-4 save integrity** — your sign-off; guards permadeath.
6. **S3 cluster (dedup, dead code, file split, escapeHtml, sentinels)** — post-Act-II cleanup pass.
7. **S4 tuning table** — fold into M-INT2 so the balance sweep has one knob-board.

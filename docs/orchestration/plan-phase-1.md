# Phase 1 Plan — One-Screen Bridge (no-scroll travel on desktop + mobile)

Planner output. Presentation-only. Read committed HEAD yourself; this plan cites
`file:line` against HEAD `f51089b` (style.css 487 lines, game.js 4948 lines,
index.html 75 lines).

---

## Phase goal

The travel screen ("the bridge") is playable with **zero page scrolling** — the
ship's log AND all action buttons visible/reachable simultaneously — on desktop
(≥1280×720) AND mobile web (390×844 portrait, iOS Safari / Android Chrome). The
scroll container is `#app` (`style.css:121-124`, `overflow-y:auto`); today the
`.bridge` column (`.viewscreen` min-height 158px + `.stations` two panels +
`.console` log+commands) overflows short viewports and pushes Continue below the
fold. At ≤900px `.console` stacks (log THEN commands, `style.css:470-477`),
pushing actions even lower.

North star: *Proxima Trail plays comfortably on one screen — desktop or phone —
with the story log and the controls both always in view.*

## Hard constraints (inherited; a change touching these = OUT OF SCOPE, stop and surface)

- **Presentation-only.** Diff confined to `style.css`, render-function **markup
  strings** in `game.js`, and `index.html` if strictly needed. No game-logic
  edits: no `data-action`/`data-arg`/`data-set` values changed, no keyboard
  wiring, no `#sr-live`/focus-trap/`prefers-reduced-motion` behavior changed.
- **Sacred list untouched** (CLAUDE.md): permadeath, sampled outcomes, hidden
  meters (`earth.truth`/`EARTH_DOOM_YEARS`), economy, difficulty tiers. No odds/
  scarcity/hidden-value change.
- **Zero-diff gate:** `applyOutcome` (game.js ~2924), `resolveCheck` (~2967),
  `tryCompose` (~2855) stay **md5-identical** to `test/frozen-baseline.json`
  (`scripts/frozen.js --check`). `composeEnding` (~2863) golden-locked, not
  md5-gated. None of these are in the render layer; do not touch them.
- **`bash scripts/verify.sh` must print `GATE PASS`.** Gate is `set -euo
  pipefail`, needs ≥ `MIN_TESTS=9` harnesses in `test/*.js`, frozen-three intact,
  endings golden present (`scripts/verify.sh:8,26,33-34,45`). Harnesses run under
  **node** (no browser DOM). A new harness must be node-runnable.
- **Docs pair rule:** the build commit MUST also flip the task status + add a
  dated log entry in `docs/dashboard.html` AND append a condensed Addendum
  (`M-UI2` style) to `docs/proxima-trail-implementation-plan.md`, same commit.

## Shared-component impact (must be stated — these are reused, not travel-only)

`.panel`, `.log`, `.menu.row`, `.cols/.col`, `crewStrip()`, `.hud-grid`, `.bar`
are shared by `renderColony` (game.js:4585-4650) and `renderVoyage`
(4654-4708). The **DoD requires: colony + voyage must not regress** (their
harnesses stay green; they still render inside `#app`). They benefit only where a
change is a strict superset (e.g. a global touch-target min-height, safe-area
padding on `#crt`). Travel-specific fit is scoped to `.bridge` and its
descendants and to a `body.screen-travel`-style hook **only if** added without
touching logic — see Fork D. **No structural change to colony/voyage markup.**

---

## Milestones → tasks

### M1 — Viewport plumbing: dvh + safe-area + no horizontal scroll (global, benefits all screens)

- **T1.1** In `style.css`, change the app-height chain from `100vh` to a
  dvh-based value with a vh fallback. Targets: `body { min-height:100vh }`
  (`:48`), `#crt { height: calc(100vh - 20px) }` (`:57`), and the `@media
  (max-width:900px)` `#crt { height: calc(100vh - 20px) }` (`:471`). New form:
  keep `100vh` line, then add a `100dvh`(`calc(100dvh - …)`) line immediately
  after so browsers without dvh use vh and modern mobile uses the *dynamic*
  viewport (excludes the iOS URL bar that causes the phantom-overflow scroll).
- **T1.2** Add safe-area insets so the frame is not under the iOS notch/home
  indicator: extend `body { padding:10px }` (`:48`) to
  `padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))`
  (keep a `padding:10px` fallback line first). In `index.html:5`, append the
  single token `, viewport-fit=cover` to the existing viewport meta's `content`
  attribute — required for `env()` insets to be non-zero on iOS. This is the one
  sanctioned `index.html` edit and it is byte-scoped: **no other `index.html`
  bytes may change** (no attribute reordering, no meta restructuring — DoD 4
  pins this exactly).
- **T1.3** Guarantee no horizontal scroll: add `html,body { overflow-x:hidden }`
  to the `html,body` rule (`:42-45`) and confirm `#app` keeps `overflow-y:auto`
  but gains `overflow-x:hidden` (`:121`). (Root-cause of AC2 horizontal scroll is
  a child exceeding width; this is the belt-and-suspenders backstop, not the fix —
  the fix is min-width:0 flex children, already present at `.col`/`.log-wrap`.)

### M2 — Desktop fit: bridge as a bounded height-budget grid (AC1)

- **T2.1** Convert `.bridge` (`style.css:273`) from
  `display:flex;flex-direction:column;min-height:100%` to
  `display:grid; grid-template-rows: auto auto minmax(0,1fr); height:100%;
  min-height:0; gap:8px`. Rows = viewscreen, stations, console. `minmax(0,1fr)`
  on the console row is the load-bearing trick: it lets the console **shrink to
  the leftover height** instead of the log's intrinsic 200px forcing overflow.
- **T2.2** Cap the two fixed rows so they cannot eat the console. `.viewscreen`
  (`:202-210`): change `min-height:158px` to `min-height:0` and add
  `max-height: clamp(120px, 22vh, 200px)` + `overflow:hidden` (its stars/plot are
  decorative and already `overflow:hidden`). `.bridge .stations` (`:274-275`):
  add `min-height:0`; leave the panels' internal content as-is (they are short:
  supply grid + crew table).
- **T2.3** Let the log own the leftover and never force page scroll. `.console`
  (`:278`): keep flex row but add `min-height:0; overflow:hidden`. `.console
  .log-wrap` (`:279`): add `min-height:0`. `.console .log` (`:280`): the log's
  own `overflow-y:auto` (`.log`, `:319-324`) already scrolls internally — change
  its `height:200px`(`:321`) is NOT here; that base `.log` height is overridden by
  `.console .log { flex:1 1 auto; height:auto; min-height:160px }` (`:280`).
  Lower that `min-height:160px` to `min-height:96px` so on a 720px-tall desktop
  the console fits; the log scrolls internally for older entries.
- **T2.4** DoD proxy for AC1: because the bridge is now `height:100%` grid inside
  `#app` (which is `flex:1 1 auto` inside the fixed-height `#crt`), no descendant
  can exceed `#crt`; the log absorbs overflow via internal scroll. This is
  **statically checkable** (see Harness in M5): assert `.bridge` uses
  `grid-template-rows` with a `minmax(0,1fr)` (or `1fr` + `min-height:0`) console
  row, `.viewscreen` has a bounded `max-height`, and `.console`/`.log-wrap` carry
  `min-height:0`.

### M3 — Mobile fit: recent log + primary command + secondary actions reachable, no page scroll (AC2)

- **T3.1** Keep the M1/M2 chain (dvh + grid) so the same height budget applies at
  390×844. The stations panels already wrap (`flex:1 1 300px`, `:275`) → they
  stack to one column at 390px automatically. Add to the `@media (max-width:900px)`
  block (`:470-477`): `.bridge { gap:6px }` and `.viewscreen { max-height: clamp(96px, 18vh, 150px) }`
  (tighter cap on short phones so the console keeps room).
- **T3.2** Console order on mobile: today `@media (max-width:900px) .console
  { flex-direction:column }` (`:473`) puts **log THEN commands** → actions land
  low. Reorder so **commands are reachable without scrolling** while recent log
  stays visible. Chosen approach (Fork C): keep source order but on mobile make
  the console a grid `grid-template-rows: minmax(72px,1fr) auto`, log in row 1
  (scrolls internally, min 72px so ~3–4 recent entries show), commands in row 2
  pinned at the bottom of the bridge — the primary command + all secondary
  actions always on-screen. **Builder note (both variants):** `renderTravel`
  emits TWO `.commands` blocks (game.js:4388–4408) — manual (`▶ Continue`
  primary + 6-button `.cmd-grid` + ATLAS + Abandon) AND autopilot (`▶▶ Run…`
  primary + One turn + Emergency wake, no `.cmd-grid`). Both share the
  `.commands` class so the CSS pin covers both structurally, but BOTH states
  must fit and be evidenced (T5.3). Implement by overriding `.console` in the
  ≤900px block to
  `display:grid; grid-template-rows: minmax(84px,1fr) auto; gap:6px` and setting
  `.console .commands { flex:0 0 auto }` (already `:474`) — no markup reorder, so
  keyboard/`data-action` wiring is untouched.
- **T3.3** Touch targets ≥44px on mobile. The station grid buttons `.cmd-grid
  .btn` are `padding:8px 6px` (`:293`) → under 44px tall. In the ≤900px block add
  `.cmd-grid .btn, .commands .btn.small { min-height:44px }` and
  `.btn.primary { min-height:48px }`. Continue (`.btn.primary`) is already tall.
  (Global would also help colony/voyage `.menu.row` buttons; see Fork E — chosen:
  add `min-height:44px` to `.menu.row .btn` in the ≤900px block too, a strict
  benefit, no regression.)
- **T3.4** DoD proxy for AC2: statically assert the ≤900px media block contains a
  `.console` grid (or explicit command-pinning) and `min-height:44px` on
  `.cmd-grid .btn`; and that no `.bridge` descendant sets a fixed px height taller
  than the mobile viewport budget. Runtime confirmation via the browser
  screenshot evidence in M5.

### M4 — Non-regression of colony / voyage / other screens (AC3)

- **T4.1** Verify `renderColony` and `renderVoyage` still render top-to-bottom
  inside `#app` (they are NOT `.bridge`; they use `.panel`/`.cols`/`.menu.row`).
  They may legitimately scroll `#app` (they are content screens, not the
  single-screen bridge) — AC1/AC2 are travel-screen claims. The DoD only requires
  they do not *break*: their harnesses stay green and they inherit the M1 (dvh,
  safe-area, ≥44px) improvements.
- **T4.2** Confirm no shared selector was narrowed in a way that regresses them:
  the changed selectors are `.bridge*`, `.viewscreen`, `.console*`, `.cmd-grid`,
  `#crt/body/html` height/padding, and additive ≤900px rules. `.viewscreen` is
  travel-only (grep: used only in `renderTravel`, game.js:4359). Cite the grep in
  the build.

### M5 — Proof: static layout harness + gate + live screenshots (DoD evidence)

- **T5.1** Add `test/layout_onescreen.js` (node, no DOM): reads `style.css` +
  `game.js` as text and asserts the committed CSS constructs that guarantee fit
  (the checkable proxy for AC1/AC2). It must FAIL LOUD (non-zero exit, printed
  reason) if any assertion is missing — never a vacuous pass. Assertions:
  (a) `#crt` height uses a `dvh` value; (b) `body` padding references
  `env(safe-area-inset`; (c) `.bridge` uses `grid-template-rows` with a
  fractional/`minmax(0,1fr)` last row; (d) `.viewscreen` has a bounded
  `max-height`; (e) `.console`/`.log-wrap` carry `min-height:0`; (f) the ≤900px
  block sets `min-height:44px` on `.cmd-grid .btn`; (g) presence check only —
  `game.js` still contains `applyOutcome`/`resolveCheck`/`tryCompose`. This keeps
  harness count ≥ `MIN_TESTS` (adds one). **Scope limit (FAIL-LOUD honesty):**
  the harness makes NO sacred-token diff claims — a node text-scan of committed
  files has no diff to inspect, and `earth.truth`/`EARTH_DOOM_YEARS` legitimately
  exist in game logic, so a "diff did not add the token" text assertion would be
  vacuous or always-failing (false-loud). That guarantee belongs to the
  auditor's committed-diff review (`git show <SHA>`, DoD item 2) and to the
  frozen.js md5 gate — the harness does not claim to guard the sacred list
  beyond (g)'s presence check.
- **T5.2** Run `bash scripts/verify.sh`; commit its `GATE PASS` output as
  evidence text (in the dashboard log entry). Frozen-three md5 must be unchanged.
- **T5.3** Live browser evidence (orchestrator-run, not committed bytes but
  required for sign-off): screenshots of the travel screen at **1280×720** and
  **1920×1080** desktop and **390×844** mobile-emulated portrait showing log +
  all buttons on-screen with `document.scrollingElement.scrollHeight <=
  clientHeight` (no page scroll) and `#app.scrollWidth <= clientWidth` (no
  horizontal scroll). The **390×844 evidence must be captured in BOTH travel
  states** — manual `.commands` (Continue + `.cmd-grid`) and autopilot
  `.commands` (Run/One turn/Emergency wake), game.js:4388–4408. Additionally a
  **no-clipping visual check at 390px**: verify the rightmost content (last nav
  chip, last `.cmd-grid` button column, crew-row Status column) is fully visible
  — `scrollWidth <= clientWidth` alone can pass while `overflow-x:hidden` (T1.3)
  silently clips content; clipping = FAIL. **Also MANDATORY (orchestrator ruling
  on Fork E): colony AND voyage screens at 390×844 (≤900px breakpoint)** —
  screenshots showing their `.menu.row` action buttons rendering correctly with
  the global 44px floor applied, no button overlap/clipping, screens scrolling
  `#app` normally. Capture the console assertion values in the log entry.
- **T5.4** Docs pair (same commit): `docs/dashboard.html` — flip Phase-1 task(s)
  to done + dated log entry (what/why/impact incl. the dvh + grid decision and
  the fork choices). `docs/proxima-trail-implementation-plan.md` — append an
  `M-UI2` condensed Addendum in the existing banner style. **Append only**;
  byte-identical elsewhere; re-fetch and confirm line count grew.

---

## Per-phase Definition of Done (auditor-checkable against committed bytes)

An auditor with `{spec, commit SHA, gate results}` reading committed bytes alone
must be able to confirm ALL of:

1. **Gate:** `bash scripts/verify.sh` prints `GATE PASS`; output captured in the
   dashboard log entry. `node scripts/frozen.js --check test/frozen-baseline.json`
   passes — `applyOutcome`/`resolveCheck`/`tryCompose` md5 unchanged (AC3).
   **Baseline immutability:** `test/frozen-baseline.json` is byte-identical to
   its pre-phase HEAD image (`git show <SHA>:test/frozen-baseline.json` equals
   the pre-image; equivalently the commit's diff does not touch that file). A
   presentation-only phase MUST NOT update the baseline — a baseline edit here
   is the "silent drift" defect CLAUDE.md's zero-diff section forbids, and is an
   automatic FAIL.
2. **Presentation-only diff:** `git show <SHA> --stat` touches only `style.css`,
   `game.js`, `index.html`, `test/layout_onescreen.js`, `docs/dashboard.html`,
   `docs/proxima-trail-implementation-plan.md`. In `game.js`, the diff hunks are
   **inside render functions and are markup strings only** — no changed
   `data-action`/`data-arg`/`data-set` token, no changed numeric/odds constant,
   no `earth.truth`/`EARTH_DOOM_YEARS` reference added (AC4).
3. **Desktop-fit CSS present (AC1 proxy):** `.bridge` rule uses
   `display:grid` + `grid-template-rows` with a `minmax(0,1fr)` (or `1fr` with an
   accompanying `min-height:0`) console row; `.viewscreen` has a bounded
   `max-height`; `.console` and `.console .log-wrap` carry `min-height:0`;
   `.console .log` `min-height` ≤ 96px. `#crt` height uses a `dvh` unit.
4. **Mobile-fit CSS present (AC2 proxy):** the `@media (max-width:900px)` block
   makes the console pin commands (grid rows with the command row `auto` at the
   bottom, or equivalent) so the **primary command + secondary actions** — in
   BOTH `.commands` variants, manual and autopilot (game.js:4388–4408) — are not
   below the log; sets `min-height:44px` on `.cmd-grid .btn`; `body` padding
   references `env(safe-area-inset-*)`; `html,body` (or `#app`) set
   `overflow-x:hidden`. The `index.html` diff is EXACTLY the single-token append
   `, viewport-fit=cover` to the existing `content` attribute of the viewport
   meta — no other `index.html` bytes change.
5. **Harness present + loud:** `test/layout_onescreen.js` exists, is counted by
   `verify.sh` (harness total ≥ 9), and exits non-zero with a printed reason if
   any assertion in T5.1 is false (auditor may delete a required construct locally
   and confirm the harness FAILs — a false-green is a defect).
6. **No shared-screen regression (AC3):** the colony and voyage harnesses in
   `test/*.js` are green in the gate run; and the bodies of `renderColony` and
   `renderVoyage` have **zero diff hunks** in `git show <SHA> -- game.js` —
   identified by function boundary (from the `function renderColony` /
   `function renderVoyage` declaration to its closing brace), NOT by absolute
   line numbers, since earlier hunks may shift line counts. Fork E's global
   ≤900px `min-height:44px` on `.menu.row .btn` IS a deliberate presentation
   change affecting those screens' mobile button height; per the orchestrator's
   Fork E ruling its cross-screen blast radius is **verified, not argued**:
   colony AND voyage ≤900px (390×844) live screenshots are MANDATORY evidence
   (T5.3 / DoD 7) showing their action rows render correctly under the 44px
   floor.
7. **Live evidence (AC1/AC2):** dashboard log entry records the three-viewport
   screenshot pass and the `scrollHeight<=clientHeight` /
   `scrollWidth<=clientWidth` measurements at 1280×720 and 390×844; the 390×844
   pass covers BOTH `.commands` states (manual AND autopilot) and includes the
   no-clipping visual assertion (rightmost chip / button column / crew Status
   column fully visible — clipping masked by `overflow-x:hidden` counts as FAIL).
   Additionally MANDATORY (orchestrator ruling on Fork E): **colony AND voyage
   screenshots at 390×844** evidencing their `.menu.row` buttons under the
   global 44px floor — no overlap, no clipping, normal `#app` scrolling.
8. **Docs pair (same commit):** dashboard status flipped + dated entry; plan file
   has a new appended `M-UI2` Addendum; plan line count grew by roughly the
   Addendum size and prior sections are byte-identical.

---

## FORK DISCLOSURE (load-bearing choices)

### Fork A — How to guarantee the bridge fits the viewport
- **Options:** (A1) fixed grid rows with a flexible console row `minmax(0,1fr)`;
  (A2) `clamp()`/CSS-`scale()` shrink-to-fit of the whole bridge; (A3)
  collapsible/accordion panels (hide stations behind a toggle).
- **Chosen: A1** — grid with a bounded viewscreen, fixed-ish stations, and a
  `minmax(0,1fr)` console row that absorbs slack; the log scrolls internally.
- **Justification:** A1 is the smallest, most robust CSS-only change and it
  *reuses the existing internal scroll of `.log`* (`overflow-y:auto`, `:319`) —
  which is exactly where scrolling *belongs* (you scroll the log, never the page).
  A2 (`transform:scale`) risks blurry text and breaks hit-testing / touch targets
  (a scaled 44px button is no longer 44px physical) — a real regression against
  AC2's touch requirement. A3 adds interactive state = logic wiring = crosses the
  presentation-only line and hides the stations the game wants always-visible.
  This is the cheaper option and it is also the better one; no payoff sacrificed.

### Fork B — dvh strategy for mobile URL-bar overflow
- **Options:** (B1) `100dvh` with a `100vh` fallback line before it; (B2) `100vh`
  only (status quo); (B3) `100svh` (small viewport, URL bar always counted);
  (B4) JS `--vh` custom property recalculated on resize.
- **Chosen: B1** (`dvh` with `vh` fallback).
- **Justification:** `100vh` on iOS Safari counts the viewport *without* the URL
  bar, so the frame is taller than what's actually visible → the phantom page
  scroll AC2 forbids. `dvh` tracks the *dynamic* visible height as the bar
  shows/hides. Fallback `vh` line keeps old browsers working (progressive
  enhancement, no JS). B3 `svh` would under-use space (always subtracts the bar
  even when hidden). B4 is logic (a script) — avoidable and against
  presentation-only; rejected despite being the historically "bulletproof"
  option, because dvh support is now broad enough (2023+) and the fork's whole
  point is to stay CSS-only.

### Fork C — Mobile action reachability (commands placement)
- **Options:** (C1) `position:sticky`/fixed bottom command bar; (C2) tabbed
  panels (log tab / actions tab); (C3) grid-pin commands to the bottom row of the
  bridge, log scrolls above them (chosen).
- **Chosen: C3.**
- **Justification:** C3 needs no markup reorder and no new interactive state, so
  keyboard shortcuts, `data-action` wiring, and the `#sr-live` announcer are
  untouched — it is pure CSS on existing DOM order. In BOTH `.commands` variants
  (game.js:4388–4408) the primary button is first: `▶ Continue` in the manual
  state (game.js:4396) and `▶▶ Run…` (`data-action='autorun'`) in the autopilot
  state (game.js:4390) — the pin works identically for each, and the autopilot
  stack is the shorter/easier case but is still verified separately (T5.3).
  C1 (sticky) can be defeated by iOS dynamic-toolbar
  quirks and can overlap content without a spacer, and "fixed" would escape the
  `#crt` frame. C2 (tabs) hides the log OR the actions — the DoD (and the sacred
  UX intent) is that BOTH are visible at once; tabs also introduce toggle
  state/logic. C3 keeps recent log + all actions co-visible with least risk.

### Fork D — Travel-only scoping without a logic hook
- **Options:** (D1) style `.bridge` and its descendants only (the travel root
  already wraps everything in `<div class='bridge'>`, game.js:4410) — no
  screen-class needed; (D2) add a `body.screen-travel` class toggled in render
  (a logic touch); (D3) restyle globally and hope colony/voyage don't regress.
- **Chosen: D1.**
- **Justification:** `.bridge` is emitted only by `renderTravel` (grep-verifiable)
  and wraps the whole travel screen, so scoping to `.bridge …` selectors isolates
  travel fit **without touching any JS behavior** — no class toggle, no logic
  edit, staying inside the zero-diff/presentation gate. D2 would add a
  `classList` call = logic change (and risks the frozen/gate posture and the
  "markup strings only" DoD). D3 risks silent colony/voyage regressions the DoD
  forbids. D1 is both cheapest and safest.

### Fork E — Touch-target minimum: scope
- **Options:** (E1) apply `min-height:44px` to travel command buttons only;
  (E2) apply to all `.menu.row`/`.btn.small` at ≤900px (mild global benefit).
- **Chosen: E2** (global at mobile breakpoint).
- **Justification:** E2 is a strict, monotonic improvement — every screen's mobile
  buttons meet the 44px accessibility floor, and it cannot *shrink* anything (only
  raises a minimum), so it can't regress colony/voyage layout. The marginal risk
  is a slightly taller mobile menu on content screens that already scroll `#app`
  legitimately (acceptable — those are not the no-scroll target). Chose the
  broader option here because the payoff (accessibility everywhere) outweighs the
  negligible cost. **Review history — Devil's Advocate + orchestrator ruling:**
  the DA conditionally overturned this fork's original "accepted residual risk"
  posture (which relied on the monotonicity argument alone, with no colony/
  voyage screenshots). The orchestrator ruled: **E2 STANDS** (the global 44px
  floor at ≤900px is kept), but the risk is no longer accepted by rationale —
  the cross-screen blast radius must be **verified, not argued**. Colony AND
  voyage ≤900px (390×844) live screenshots are now MANDATORY DoD evidence,
  alongside the travel-state screenshots (see T5.3 and DoD 6/7). The node
  harnesses still cannot see layout (no DOM engine) — the screenshots are the
  layout check for those screens.

### Fork F — AC verification proxy (browser-required vs static)
- **Options:** (F1) commit a headless browser (Puppeteer/Playwright) layout
  harness that actually measures scrollHeight at 1280×720 / 390×844; (F2) commit a
  node **static-CSS** harness asserting the fit-guaranteeing constructs, and use
  orchestrator-run live screenshots as the runtime sign-off (chosen); (F3)
  screenshots only, no harness.
- **Chosen: F2.**
- **Justification:** the existing gate runs harnesses under **plain node** with no
  browser dependency (`scripts/verify.sh:33`, harnesses in `test/*.js`); adding a
  headless-browser dep (F1) would bloat the gate, add flakiness and a heavy
  install, and risk the deterministic-gate contract. F2's static harness is
  deterministic, fast, counts toward `MIN_TESTS`, and FAILS LOUD if a required
  construct is removed — a solid *committed-bytes* proxy for AC1/AC2 — while the
  orchestrator's live 3-viewport screenshots (already how the current problem was
  verified) provide the true runtime confirmation. F3 alone leaves no
  committed-bytes proof, failing the "checkable from committed bytes" rule. F2 is
  the honest middle: cheaper than F1, but not hollow like F3. **Disclosed
  weakness:** a static harness proves the *constructs are present*, not that the
  pixels fit on every device — hence the live screenshot requirement in the DoD
  (item 7) is non-optional, not decorative.

---

## Out of scope / STOP conditions
- Any change to sampled outcomes, odds, economy, difficulty, or hidden meters →
  STOP, surface to Tom (sacred list).
- Any edit to `applyOutcome`/`resolveCheck`/`tryCompose`/`composeEnding` bodies,
  or to `data-action`/`data-arg`/`data-set` tokens, keyboard wiring, `#sr-live`,
  focus trap, or `prefers-reduced-motion` behavior → not presentation-only, STOP.
- Restructuring colony/voyage markup for their own fit → separate phase, not this
  one (Phase 1 is the travel bridge). If found necessary, return `FENCED — needs
  Tom`.

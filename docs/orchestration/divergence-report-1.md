# Divergence Report — Pass 1

*Reconciler pass comparing INFERRED intent (reverse-intent-1.md) against DOCUMENTED
intent (north star + AC1–AC4 in `plan-events.jsonl`, `plan-phase-1.md`, `CLAUDE.md`,
`proxima-trail-implementation-plan.md`, `dashboard.html`, and the orchestrator's
live-evidence notes). No prior divergence reports exist.*

**North star (this run):** *"Proxima Trail plays comfortably on one screen — desktop or
phone — with the story log and the controls both always in view."*

**Overall verdict: substantially ALIGNED, with one degrades-goal divergence and two
cosmetic divergences (all three are the deferred cosmetic findings; see below).** The
built system faithfully serves the documented north star and every guardrail; the
divergences are narrow, already-logged residuals — none of them a docs-promise-not-kept
or a code-does-what-docs-never-sanctioned mismatch in the load-bearing sense.

---

## DIVERGENCES

### D1 — Mobile topbar wrap squeezes the log toward the edge of "in view"
- **Severity: degrades-goal** (does not block the north star; erodes the "story log …
  always in view" half of it on phones).
- **Docs say:** North star — "the story log and the controls both **always in view**";
  AC2 — "mobile web 390×844 portrait: **recent log entries readable** and Continue +
  station actions reachable without scrolling; no horizontal scroll." The reverse-intent
  read infers the same value as a first-order intent: "the log is the only slack absorber"
  and "every meter and every action is visible at once" (reverse-intent-1.md §1.7, §2.5).
- **Code does:** `#topbar` is `flex: 0 0 auto` and lives **outside** the `.bridge` grid
  (`style.css:97-103`, `#topbar` block; `.bridge` grid at `:275-278`). At 390px it still
  renders brand + centered `#topbar-status` nav readout + button cluster
  (`#topbar-status { flex:1 }`, `style.css:111`), which the orchestrator's own live
  evidence records as **wrapping to ~5 lines and "duplicating nav chips and squeezing the
  log"** (`plan-events.jsonl:23`, cosmetic findings). Because the topbar consumes fixed
  budget above the grid, the flexible console row is left with a measured **62px log strip**
  at 390×844 manual state (`plan-events.jsonl:23`). All 9 buttons stay ≥44px and reachable,
  and there is zero page/horizontal scroll — so AC2's *reachability* clause passes, but the
  *"recent log entries readable"* clause is at its thin margin: a ~5-line duplicate header
  is eating the very slack the design says the log should own.
- **Why it's degrades-goal, not blocks:** AC2 is technically met (log present + readable at
  62px ≈ 3 short lines, controls reachable, no scroll — audit DoD-7 PASS,
  `audit-phase-1.md:47`). The north star is *served* but not *comfortably* on phones: the
  duplicated 5-line topbar is redundant chrome stealing log height. This is the one finding
  that touches this run's north star directly rather than an unrelated screen.
- **Remediation (presentation-only, in-scope for a follow-on phase):** in the ≤900px block,
  collapse `#topbar` for the travel screen to a single line — e.g. drop/hide the centered
  `#topbar-status` nav readout on mobile (the same nav data already rides the diegetic
  viewscreen chips, `renderTravel` 4358-4372, so it is a *duplicate* on phones), or
  `white-space:nowrap; overflow:hidden; text-overflow:ellipsis` + reduced font on
  `#topbar-status` so the bar cannot exceed one line. Either recovers ~3–4 lines of log
  height and makes the log-in-view goal *comfortable*, not merely satisfied. Keep it CSS/
  markup-only (no `updateTopbar()` logic change) to stay inside the presentation-only and
  zero-diff guardrails.

### D2 — Desktop 720px viewscreen clips below-rail route-map labels
- **Severity: cosmetic** (no north-star clause about the route map; log + controls remain
  fully in view and unclipped at 1280×720 per the fix commit).
- **Docs say:** the route map is a diegetic nicety; the reverse-intent read notes labels
  are placed alternately above/below "so they can never collide" (reverse-intent-1.md
  §1.7, `renderRouteMap` 4293-4298). No AC covers route-label completeness. The one-screen
  ACs are about log + action buttons (AC1/AC2), which pass.
- **Code does:** `.viewscreen` is capped `max-height: clamp(120px, 22vh, 200px)` +
  `overflow:hidden` (`style.css:206`) so at a 720px-tall desktop the below-rail route
  labels clip inside the viewscreen (`plan-events.jsonl:23` cosmetic finding). This is a
  *deliberate* consequence of the M2 fit strategy (bounded viewscreen so the console/log
  gets the slack) — the cap is the correct trade, the clipped decorative label is the
  residue.
- **Why cosmetic:** the clipped element is a decorative label on a decorative rail; the
  load-bearing content (log, all buttons, ATLAS, Abandon) is fully visible and unclipped at
  1280×720 after the fix (`plan-events.jsonl:21` → `:23`; `audit-phase-1.md:47`). No AC and
  no north-star clause is degraded.
- **Remediation (optional, presentation-only):** either shrink `.rm-label` font / move the
  below-rail labels inline with the rail at short heights, or raise the viewscreen cap only
  in the `min-height` ≥ ~760px range. Low priority; acceptable-and-recorded as-is.

### D3 — Voyage crew-table STATUS header clips at 390px
- **Severity: cosmetic** (voyage is a content screen that legitimately scrolls `#app`;
  outside AC1/AC2's travel-screen scope).
- **Docs say:** AC1/AC2 are explicitly **travel-screen** claims; the plan states colony/
  voyage "may legitimately scroll `#app` … AC1/AC2 are travel-screen claims" and the DoD
  only requires they "do not *break*" (plan-phase-1.md T4.1, DoD 6). The reverse-intent read
  treats voyage as a separate content front, not the single-screen bridge (§1.5).
- **Code does:** at 390px the voyage crew table's STATUS column header clips
  (`plan-events.jsonl:23` cosmetic finding). Live evidence confirms the voyage screen itself
  is functional — 7 action buttons ≥44px, no horizontal overflow, `#app` scrolls normally
  (`plan-events.jsonl:23`; `audit-phase-1.md:47`).
- **Why cosmetic:** a clipped column *header label* on a screen that is out of the
  no-scroll target's scope, with all controls reachable and no functional loss. Explicitly
  fenced out of Phase 1 by the plan ("Restructuring colony/voyage markup for their own fit →
  separate phase", plan-phase-1.md Out-of-scope).
- **Remediation (separate phase):** allow the voyage crew table to scroll horizontally
  within its panel, abbreviate the STATUS header, or restack the table at ≤900px — as an
  explicit colony/voyage-fit phase, not this one.

---

## CONFIRMED ALIGNMENTS (compact — progress visible across passes)

- **North-star core, desktop (AC1):** `.bridge` is a bounded height-budget grid
  (`grid-template-rows: auto auto minmax(min-content,1fr)`, `style.css:275-278`); log +
  all 9 buttons (incl. ATLAS + Abandon) co-visible at 1280×720, 0/0/0 overflow — the
  earlier clipping FAIL (`plan-events.jsonl:21`) was fixed and re-evidenced
  (`:23`, `audit-phase-1.md` DoD-3/DoD-7). **Inferred intent matches documented intent.**
- **North-star core, mobile (AC2):** commands pinned via ≤900px console grid
  (`grid-template-rows: minmax(84px,1fr) auto`), 44px touch floor, safe-area insets,
  `overflow-x:hidden`, `viewport-fit=cover` single-token append; 9/9 buttons reachable, no
  page/horizontal scroll at 390×844 (both manual + autopilot states). Aligned modulo D1's
  comfort margin.
- **dvh viewport fix:** `#crt height: calc(100dvh - 20px)` with vh fallback — the exact
  iOS-URL-bar remedy the reverse-intent read attributes to the CSS invariants (§1.7). Aligned.
- **Sacred list untouched (AC4):** `game.js` **not touched at all** across the range
  (`audit-phase-1.md` DoD-2) — permadeath, sampled outcomes, hidden meters
  (`earth.truth`/`EARTH_DOOM_YEARS`), economy, difficulty tiers all byte-identical. The
  reverse-intent read independently identifies these as the builders' sacred values (§2.1–2.3,
  §2.9); code honors them. Aligned.
- **Zero-diff gate (AC3):** frozen-three (`applyOutcome`/`resolveCheck`/`tryCompose`)
  md5-identical, baseline byte-identical (NOT updated — correct for presentation-only),
  `composeEnding` golden-locked not md5-gated. `verify.sh` → GATE PASS, 10 harnesses.
  Reverse-intent §2.3 infers exactly this priority ranking (balance > narrative > all).
  Aligned.
- **FAIL-LOUD principle:** new `test/layout_onescreen.js` is loud (mutation-tested exit 1,
  `audit-phase-1.md` DoD-5); gate refuses vacuous pass. Matches reverse-intent §2.4 ("checks
  must never lie"). Aligned.
- **Presentation-only guardrail:** diff confined to `style.css`, `index.html`,
  `test/layout_onescreen.js`, `docs/dashboard.html`, `docs/proxima-trail-implementation-plan.md`;
  no logic, no `data-action`/keyboard/`#sr-live`/`prefers-reduced-motion` change
  (`audit-phase-1.md` DoD-2). Aligned.
- **Docs pair rule:** dashboard `mui2` block + dated LOG entries AND appended `M-UI2`
  Addendum, same commit, pure append, prior content byte-identical (`audit-phase-1.md`
  DoD-8). Aligned.
- **Colony/voyage non-regression (AC3):** `renderColony`/`renderVoyage` zero diff hunks;
  their harnesses green; global 44px floor is raise-only and live-evidenced at 390×844
  (`audit-phase-1.md` DoD-6). Aligned (D3 is a pre-existing cosmetic residue, not a
  regression introduced here).

**No code-does-something-docs-never-sanctioned findings.** The two additive constructs the
auditor flagged (`minmax(min-content,1fr)` tightening and a new `@media (max-height:800px)`
block) are documented in commit + docs, stay within Fork A's grid approach and
presentation-only scope, and move *toward* the AC — sanctioned, not stealth.

---

*End of pass 1.*

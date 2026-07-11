# Phase 2 Plan — Post-merge remediation (3 targeted divergences)

Targeted remediation of the Phase-1 reconcile loop's three divergences — NOT a
feature phase. Cites are against merged HEAD `af85b37` (style.css 533 lines).
All Phase-1 constraints inherit unchanged: presentation-only, sacred list,
frozen-three md5 + baseline untouched, `GATE PASS`, docs pair, byte-scoped DoD.

## Phase goal

Fix three verified divergences without disturbing the merged one-screen bridge:
**D1** (degrades-goal) reclaim the mobile `#topbar` status space so the travel
log is comfortably visible at 390×844; **D2** (cosmetic) stop below-rail route
labels clipping mid-glyph at short-height desktops (≤800px tall, ≥1100px wide);
**D3** (cosmetic) stop the crew-table "STATUS" header clipping at 390px without
regressing the travel crew table.

---

## Milestones → tasks

### M1 — D1: mobile topbar status (degrades-goal)

Facts: `#topbar-status` (style.css:111, `flex:1`, mono 13px) is filled by
`updateTopbar` (game.js:4131-4140); on travel it shows `DAY n · NEXT: wp ·
d/total ly-abs` — a byte-level duplicate of the viewscreen nav chips (Day /
Next chips + `vs-foot` distance) *provided that copy is visible at 390×844,
which is exactly what the T1.4 premise gate verifies before the hide ships*.
On non-travel screens it shows `BEST SCORE:
n` / `EARTH IS DYING` (not duplicated anywhere). At 390px the long travel
string wraps ~5 lines, and `#topbar` is OUTSIDE `#app`, so every wrapped line
is stolen from the `#crt` budget → travel log squeezed to ~62px.

- **T1.1** In the `@media (max-width:900px)` block (style.css:485-511) add the
  unconditional one-line floor: `#topbar-status { white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis; min-width:0; }`. This alone caps the
  damage everywhere (topbar can never wrap multi-line again, on any screen, in
  any browser) — `min-width:0` is required for ellipsis inside flex.
- **T1.2** Same block, add the travel-scoped hide:
  `#crt:has(.bridge) #topbar-status { display:none; }`. `.bridge` exists only
  on the travel screen (Phase-1 Fork D, re-verified: single emit site in
  `renderTravel`), so this removes the fully-redundant travel status without
  touching title/setup screens (they keep their ellipsized BEST-SCORE line).
  **Browser-support posture (honest):** `:has()` is supported in all evergreen
  engines since 2023 (Chrome/Edge 105+, Safari 15.4+, Firefox 121+) — the
  target platforms (AC2: iOS Safari / Android Chrome, current) all have it.
  Where `:has()` is unsupported the rule is simply ignored and T1.1's ellipsis
  floor still holds: degradation is one redundant line, never five. No JS.
- **T1.3** No game.js change. Editing `updateTopbar` to de-duplicate the string
  was considered and rejected (Fork G) — it is a function-body edit beyond
  render markup strings, outside the presentation gate.
- **T1.4 — CONDITIONAL premise gate for the hide (reviewer MAJOR-1):** G1's
  justification holds only if the surviving copy is actually VISIBLE at
  390×844. `vs-foot` (the distance readout) is the LAST child of the
  `overflow:hidden` viewscreen, capped `clamp(96px,16vh,140px)` on mobile
  (style.css:489, ~135px at 844 tall); wrapped chips + the ~80px routemap may
  clip it BEFORE the topbar is hidden — in which case T1.2 would delete the
  only remaining distance readout. Therefore, with T1.1+T1.2 applied, the
  executor MUST verify at 390×844 that the Day/Next chips AND the `vs-foot`
  distance readout are visible (not clipped by the viewscreen cap).
  **If `vs-foot` is clipped: do NOT ship T1.2 — remove the `:has(.bridge)`
  hide, fall back to G3 (the T1.1 ellipsized single-line topbar is retained on
  travel and then carries the only surviving distance readout), and surface
  the fallback to the orchestrator in the report and the dashboard log entry.**
  T1.1 ships either way; DoD 3 / harness (h) track whichever variant shipped.

### M2 — D2: route-label clipping at short desktop heights (cosmetic)

Facts: at `@media (max-height:800px)` the viewscreen is capped
`clamp(96px,14vh,150px)` (style.css:518) with `overflow:hidden` (:204-213); at
≥1100px width ALL waypoint labels render (the ≤1100px cur/nxt reduction,
:479-482, does not apply), and `.rm-label.blw { top:32px }` (:269) below the
30px rail + `.routemap` padding `24px 10px 26px` (:247) exceeds the cap →
below-rail labels clip mid-glyph.

- **T2.1** Inside the existing `@media (max-height:800px)` block (:516-524),
  extend the cur/nxt-only label rule to short viewports:
  `.rm-label { display:none; } .rm-label.cur, .rm-label.nxt { display:block; }`
  (byte-same pattern as the ≤1100px block — fewer labels, no mid-glyph row).
- **T2.2** Same block, tighten the plot's vertical envelope so even a
  below-rail cur/nxt label fits inside the 14vh cap:
  `.routemap { padding:16px 10px 18px; } .rm-label.blw { top:28px; }`.
  Existing-constructs-only: no cap raise, no new layout system.
- **T2.3** Rejected (Fork H): raising the short-height viewscreen cap — it
  steals the reclaimed budget from the console row and risks reopening the
  Phase-1 AC1 no-scroll guarantee at 1280×720.

### M3 — D3: crew-table STATUS header clipping at 390px (cosmetic, shared component)

Facts: `.crew-head, .crew-row` share one grid `16px minmax(120px,1.5fr) 1fr
1fr 88px; gap:10px` (:314-317) with header `letter-spacing:2px` (:319); at
390px the fixed tracks + gaps overflow the panel and the last column
("STATUS") clips. The SAME component renders on travel (stations panel),
colony, and voyage (`crewStrip`, game.js).

- **T3.1** In the `@media (max-width:900px)` block add a uniform mobile retune:
  `.crew-head, .crew-row { grid-template-columns: 14px minmax(84px,1.4fr) 1fr
  1fr 60px; gap:6px; } .crew-head { letter-spacing:1px; }`. "STATUS" at 10.5px
  display-font with 1px tracking fits ~58px < 60px track; fixed+gap overhead
  drops from 144px (16 + 88 + 4×10 gaps) to 98px (14 + 60 + 4×6), freeing
  ≈46px for the name/bars columns.
- **T3.2** Scoping decision (Fork I): retune ALL crew tables at ≤900px
  uniformly rather than voyage-only. There is no voyage-specific ancestor class
  (voyage's crew panel is a generic `.col .panel`) and the defect is a property
  of the shared grid at narrow widths — travel and colony clip the same way at
  390px. Uniform fix + explicit evidence on BOTH voyage and travel (T4.3) is
  the scoping-and-evidence answer; desktop is untouched (rule lives only in
  the ≤900px block).

### M4 — Proof + docs (same commit)

- **T4.1** Extend `test/layout_onescreen.js` (Fork J: extend, not a new
  harness — the constructs are the same file/media-block family it already
  pins; harness count stays 10 ≥ MIN_TESTS=9). Add 3 presence assertions, all
  FAIL-LOUD (non-zero exit + printed reason): (h) the ≤900px block contains an
  `#topbar-status` rule with `text-overflow:ellipsis`; AND — only if the T1.4
  premise gate passed and G1 shipped — the `#crt:has(.bridge)`-scoped
  `display:none` (if the G3 fallback shipped, (h) pins the ellipsis rule alone
  and MUST NOT require the hide); (i) the `max-height:800px`
  block contains the `.rm-label` reduction and a `.routemap` padding override;
  (j) the ≤900px block contains a `.crew-head, .crew-row`
  `grid-template-columns` override whose last track is ≤ 64px. Presence checks
  only — no diff claims (Phase-1 MAJOR-2 lesson stands).
- **T4.2** `bash scripts/verify.sh` → `GATE PASS` (10 harnesses green,
  frozen-three md5 vs untouched `test/frozen-baseline.json`).
- **T4.3** Orchestrator live evidence, per divergence:
  - **D1:** 390×844 travel — measured `.log` visible height materially
    improved (record before/after px; before ≈62px), topbar single-line-or-
    hidden; **the shot must show the viewscreen Day/Next chips AND the
    `vs-foot` distance readout visible (not clipped by the viewscreen cap) —
    this is the T1.4 premise gate; if `vs-foot` is clipped, the G3 fallback
    ships instead and the evidence records the fallback + surfaced report**;
    PLUS title-screen sanity shot at 390×844 (T1.1 is global): BEST SCORE line
    ellipsized-not-wrapped, hero intact.
  - **D2:** 1280×720 travel (≥1100px wide, ≤800px tall) — no label clipped
    mid-glyph; cur/nxt labels legible.
  - **D3:** 390×844 voyage — "STATUS" header fully visible; AND 390×844 travel
    crew table non-regression; AND 390×844 colony crew table shot (the third
    call site of the shared retune — cheap, the evidence pass already loads
    colony via the test seam). All three: columns aligned, no clipping.
- **T4.4** Docs pair, same commit: `docs/dashboard.html` status flip + dated
  log entry (divergences fixed, fork decisions, evidence values);
  `docs/proxima-trail-implementation-plan.md` — append condensed Addendum
  **M-UI2b** in the existing banner style, append-only, re-fetch + line-count
  check.

---

## Definition of Done (auditor: committed bytes + gate results only)

1. `verify.sh` prints `GATE PASS`; 10 harnesses green; frozen-three md5
   unchanged; `test/frozen-baseline.json` byte-identical to pre-phase HEAD
   (`af85b37`) — baseline MUST NOT be updated (automatic FAIL if diffed).
2. **Presentation-only diff:** commit touches only `style.css`,
   `test/layout_onescreen.js`, `docs/dashboard.html`,
   `docs/proxima-trail-implementation-plan.md`. **game.js and index.html have
   ZERO diff this phase** (all three fixes are CSS-only). No
   `data-*`/odds/hidden-meter token anywhere in the diff.
3. **D1 bytes (two acceptable outcomes, per the T1.4 premise gate):** the
   ≤900px block contains the `#topbar-status` ellipsis/`min-width:0` rule
   (always); AND EITHER (G1 shipped) the `#crt:has(.bridge)` scoped
   `display:none` rule, with the D1 evidence showing chips + `vs-foot` visible
   — OR (G3 fallback shipped) NO hide rule, with the fallback explicitly
   surfaced in the report and dashboard log entry. A hide rule shipped WITHOUT
   the chips+`vs-foot` visibility evidence is a FAIL; an unsurfaced fallback is
   a FAIL.
4. **D2 bytes:** `max-height:800px` block contains the `.rm-label` cur/nxt
   reduction and the tightened `.routemap` padding / `.rm-label.blw` offset.
5. **D3 bytes:** ≤900px block contains the `.crew-head, .crew-row`
   grid retune (last track ≤64px, gap ≤6px) and the `.crew-head`
   letter-spacing reduction; NO `.crew-head`/`.crew-row` change outside that
   media block (desktop untouched).
6. **Harness:** `layout_onescreen.js` extended with assertions (h)(i)(j);
   deleting any pinned construct locally makes it exit non-zero with a reason.
7. **Live evidence (recorded in the dashboard log entry):** D1 before/after
   log-height px at 390×844 + the chips-AND-`vs-foot`-visible premise check
   (or the recorded G3 fallback) + title sanity; D2 1280×720 no-clip label
   check; D3 voyage 390×844 header visible + travel crew-table non-regression
   shot + colony crew-table 390×844 shot (all three call sites of the shared
   retune evidenced).
8. **Docs pair in the same commit:** dashboard log/status + appended M-UI2b
   Addendum; plan file grew by ~the Addendum size, prior sections
   byte-identical.

---

## FORK DISCLOSURE

### Fork G — D1 mechanism (the load-bearing one)
- **Options:** (G1) `#crt:has(.bridge)`-scoped hide + unconditional ellipsis
  floor (chosen, T1.1+T1.2); (G2) unconditionally hide `#topbar-status` at
  ≤900px (simpler — but title/setup phones lose the BEST SCORE line, the one
  place that info isn't redundant); (G3) ellipsis only, never hide (keeps a
  truncated-to-uselessness `DAY 12 · NE…` line burning a topbar row on travel);
  (G4) edit `updateTopbar` to emit a short mobile string (cleanest data fix but
  a JS function-body edit — outside the presentation gate; also `updateTopbar`
  can't know viewport width without more logic).
- **Chosen: G1 — conditionally (T1.4 premise gate).** It is the only option
  that removes 100% of the redundant travel line, keeps the non-redundant
  title line, and stays CSS-only. Honest cost #1: `:has()` dependency —
  mitigated because G1 *contains* G3 as its browser fallback (no `:has()` →
  one-line ellipsis floor, never five lines). Honest cost #2 (reviewer
  MAJOR-1): G1's "redundant" premise assumes the viewscreen copy SURVIVES at
  390×844, but `vs-foot` may be clipped by the mobile viewscreen cap before
  the topbar is hidden — so the choice is encoded as a conditional: G1 ships
  only if the 390×844 evidence shows chips + `vs-foot` visible; otherwise the
  executor falls back to G3 (ellipsized topbar retained as the surviving
  distance readout) and surfaces it rather than shipping G1 (T1.4, DoD 3).
  G2 was the cheaper fork; rejected because it deletes real (non-duplicated)
  information on non-travel screens when the scoped option costs one extra
  selector.

### Fork H — D2 mechanism
- **Options:** (H1) label reduction (cur/nxt) at short heights only; (H2)
  padding/offset tightening only; (H3) both (chosen); (H4) raise the 14vh cap.
- **Chosen: H3.** H1 alone still clips when cur/nxt lands below-rail (`blw` is
  index-parity, not state); H2 alone is a few-px margin call that varies with
  font metrics. Together they are deterministic within existing constructs.
  H4 rejected: steals console-row budget and risks reopening Phase-1 AC1 at
  1280×720 — a cosmetic fix must not gamble the no-scroll guarantee.

### Fork I — D3 scope (shared component)
- **Options:** (I1) uniform ≤900px retune for all crew tables (chosen); (I2)
  voyage-only via a structural selector (`.cols .col .panel .crew-head` — also
  matches colony; no voyage-unique ancestor exists) or a new `:has()` chain;
  (I3) hide the Status column on phones.
- **Chosen: I1.** The defect is in the shared grid, not in voyage; travel and
  colony hit the same overflow at 390px, so a voyage-only fix would be a
  partial repair wearing a scoping costume — and I2's selectors are either
  wrong (match colony anyway) or brittle. I1's blast radius is verified, not
  argued (Phase-1 Fork-E precedent) at ALL THREE call sites: DoD 7 mandates
  the voyage shot, the travel crew-table non-regression shot, AND a colony
  crew-table 390×844 shot (cheap — the evidence pass already loads colony via
  the test seam; no call site is accepted-by-argument). I3 deletes
  information.
- **Note:** I1 also *fixes* the (unreported) identical clip on travel/colony —
  a strict improvement inside the same divergence, not scope creep: same rule,
  same bytes, evidenced.

### Fork J — harness posture
- **Options:** (J1) extend `layout_onescreen.js` with (h)(i)(j) (chosen); (J2)
  new `test/layout_remediation.js`; (J3) no harness change.
- **Chosen: J1.** The three constructs live in the same file + media-block
  family the harness already pins; extending keeps one authoritative layout
  pinner (count stays 10). J2 adds a file for 3 asserts and splits layout
  truth across two harnesses. J3 leaves the remediation un-pinned — a later
  "cleanup" could silently delete the `:has()` rule and no gate would notice;
  that violates the pin-what-you-fixed principle this project runs on.

---

## Out of scope / STOP
- Any game.js or index.html edit (this phase is CSS-only by DoD 2) — if a fix
  turns out to need one, STOP and return the divergence to the orchestrator.
- Anything touching the sacred list, frozen-three, baseline, or gate scripts.
- Restyling beyond the three divergences (no opportunistic polish).

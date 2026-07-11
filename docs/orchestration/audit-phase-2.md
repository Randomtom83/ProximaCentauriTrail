# Audit — Phase 2 (M-UI2b post-merge remediation)

- **Worktree:** `C:\Users\thoma\Dropbox\My Documents\Programs\wt-phase-2` (branch `phase-2`)
- **Range audited:** `af85b37..phase-2` → `791b553` (M-UI2b) then `96de88d` (correction: G3 fallback + FORK-D1b)
- **Final SHA:** `96de88ddd6ba8c3e26d8835412225f9692f715a8`
- **DoD/plan:** `docs/orchestration/plan-phase-2.md`
- **Method:** committed bytes only (`git show <SHA>:<file>`, `git diff af85b37 phase-2`), independent gate run, mutation fail-loud testing. No executor narration consulted. `evidence.html` (untracked) excluded — out of range.

**Overall verdict: PASS.**

The FINAL state is the plan's sanctioned conditional end-state: T1.4 premise gate FAILED (orchestrator evidence: chips 3/3 visible, `vs-foot` clipped at 390×844), so G1 was rolled back to the G3 fallback in `96de88d`, and the disclosed execution-time FORK-D1b (stations bound + command compression) reclaimed the freed space to the log. Both the fallback and the fork are surfaced in the report path, the dashboard, and the plan Addendum — not buried. Every DoD item verified against committed bytes with file+line evidence.

---

## Per-DoD verdicts

### DoD 1 — Gate green, frozen-three md5 unchanged, baseline byte-identical — **PASS**
- `bash scripts/verify.sh` re-run independently in the worktree → `GATE PASS — 10 harnesses green, frozen-three intact, endings golden present.`
- Frozen-three md5 (`scripts/frozen.js`) exactly equals `test/frozen-baseline.json`:
  `applyOutcome c407745e…`, `resolveCheck bac74c86…`, `tryCompose 52698761…` — all three match byte-for-byte.
- `git diff --stat af85b37 phase-2 -- test/frozen-baseline.json` → empty (baseline NOT updated). No automatic-FAIL condition triggered.

### DoD 2 — Presentation-only diff; game.js/index.html zero diff; no sacred tokens — **PASS**
- `git diff --name-only af85b37 phase-2` returns exactly: `docs/dashboard.html`, `docs/proxima-trail-implementation-plan.md`, `style.css`, `test/layout_onescreen.js`. No other files.
- `git diff --stat af85b37 phase-2 -- game.js index.html` → empty (ZERO diff on both). Confirmed at each intermediate commit too.
- Added-line scan of `style.css`/`test/layout_onescreen.js` for `data-*`, `earth.truth`, `EARTH_DOOM`, `odds`, probability tokens → none.

### DoD 3 — D1 bytes (conditional outcome) — **PASS (G3 fallback branch)**
- Ellipsis floor present (always-required), `style.css:527`:
  `#topbar-status { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }` inside the `@media (max-width:900px)` block (485–559).
- G3 branch: NO live `#crt:has(.bridge) #topbar-status{display:none}` rule anywhere in the final file. The only textual occurrence is inside the T1.2 tombstone comment (`style.css:529`), verified to be within a `/* … */` block, not an active rule.
- Fallback SURFACED (DoD 3 requirement): dashboard task "D1 resolved — G3 FALLBACK (T1.4 premise gate FAILED)" with the `vs-foot` clipped measurement; plan Addendum "Correction" section (`…implementation-plan.md:1146`+) records the verdict and the G3 ship. Not buried → not a FAIL.
- No hide rule shipped without visibility evidence (the FAIL condition); the reverse — a surfaced fallback — is present.

### DoD 4 — D2 bytes in `max-height:800px` block — **PASS**
Inside `@media (max-height:800px)` (560–581):
- `.rm-label { display: none; }` (`style.css:569`)
- `.rm-label.cur, .rm-label.nxt { display: block; }` (`style.css:570`)
- `.routemap { padding: 16px 10px 18px; }` (`style.css:576`) — tightened envelope
- `.rm-label.blw { top: 28px; }` (`style.css:577`) — offset reduced from 32px

### DoD 5 — D3 bytes in ≤900px block; desktop untouched — **PASS**
- `.crew-head, .crew-row { grid-template-columns: 14px minmax(84px,1.4fr) 1fr 1fr 60px; gap: 6px; }` (`style.css:541`) — last track **60px ≤ 64px**, gap **6px ≤ 6px**.
- `.crew-head { letter-spacing: 1px; }` (`style.css:542`) — reduced from 2px.
- Desktop crew rules `style.css:314–326` are byte-identical to `af85b37` (diff empty). No `.crew-head`/`.crew-row` change outside the media block.

### DoD 6 — Harness extended with fail-loud assertions — **PASS**
- `test/layout_onescreen.js` extended (Fork J, same file; count stays 10) with `(h2)`, `(i2)`, `(j)`, `(k)`.
- Mutation-tested fail-loud (each `fail()` → `console.error` + `process.exit(1)`):
  - Delete D3 grid retune → `FAIL … no .crew-head, .crew-row grid-template-columns override`, exit 1.
  - Delete `.rm-label{display:none}` → `FAIL … does not reduce .rm-label to cur/nxt-only`, exit 1.
  - Re-introduce a **live** `#crt:has(.bridge) #topbar-status{display:none}` rule → `(h2)` FAIL with reason, exit 1. The absence check runs against comment-stripped CSS, so the tombstone comment does not false-trip and a genuine live rule cannot slip back in. (Two earlier negative-test attempts appeared to pass; on inspection the injected line had landed *inside* an existing comment block and was legitimately stripped — auditor test-setup error, not a harness gap. The harness catches a real live rule.)

### DoD 7 — Live evidence recorded — **PASS (orchestrator-run, recorded in docs)**
Evidence is orchestrator-owned; verified as recorded in the committed docs and the events log ("P2 official live evidence PASS (96de88d)"):
- D1 390×844: log **62 → 152px**, topbar single line, page/app/x overflow 0/0/0, 9/9 commands, min touch 44px; premise check recorded (chips 3/3, `vs-foot` clipped → G3). Title-screen sanity: single-line topbar, hero intact.
- D2 1280×720: cur/nxt-only labels, 0 clipped (below-rail label bottom 169 ≤ viewscreen bottom 172), AC1 held.
- D3 390×844: STATUS header/values inside right edge on voyage AND travel AND colony — all three shared-grid call sites (Fork I) evidenced.
- **Honest residual (surfaced, not a defect):** with G3, the ellipsized topbar squeezes to ~0 visible chars at 390px, so the ly-abs distance figure is effectively absent on mobile travel (Day/Next chips + route plot remain). Recorded in plan-events and dashboard; a disclosed consequence of the plan-sanctioned fallback, consistent with DoD 3.

### DoD 8 — Docs pair in the same commit, append-only — **PASS**
- Plan file: single additive hunk `@@ -1071,3 +1071,121 @@`; line count 1073 → 1191 (+118, ≈ Addendum size). No deletions; prior sections byte-identical. M-UI2b Addendum + "Correction (same milestone, 2026-07-02)" section present with the G3 verdict, FORK-D1b, and evidence values.
- Dashboard: M-UI2b milestone block (`id:"mui2b"`), all 7 tasks `"done"`, dated `2026-07-02` log entries; G3 fallback, FORK-D1b, D2, D3, harness, gate, and evidence all narrated.
- Both docs are in-range in both commits (`791b553` and `96de88d`).

---

## Undisclosed-fork hunt

Searched for stubs, hardcodes, swallowed errors, narrowed scope, skipped edge cases, TODOs-in-place-of-behavior, and scope creep beyond the three divergences.

- **All added CSS selectors map to a disclosed task/fork.** Enumerated every added rule in the final diff: `#topbar-status` (T1.1), `.crew-head`/`.crew-row`/`.crew-head` (T3.1/D3), `.rm-label*`/`.routemap` (T2.1/T2.2/D2), and `.bridge`/`.bridge .stations`/`.commands`/`.btn.primary`/`.cmd-grid`/`.cmd-grid .btn`/`.commands .danger` (FORK-D1b, disclosed pre-commit in plan-events and surfaced in both docs, DA-upheld). No orphan selectors.
- **FORK-D1b did not silently erode touch targets.** `git diff … -- style.css | grep min-height` shows no `min-height` value changed. The `.cmd-grid .btn`/`.commands .btn.small` 44px and `.btn.primary` 48px floors are byte-intact (`style.css:533–534`); the compression only touched padding/gap/font-size, exactly as the fork disclosed, and harness `(k)` pins the 48px primary floor.
- **No TODO/FIXME/XXX/HACK/stub/"not implemented"** in either touched file (final bytes).
- **No narrowed scope on D3.** The plan chose uniform (Fork I) over voyage-only; the committed rule is the uniform shared-grid retune with all three call sites evidenced — the broader (correct) scope, not a narrowed one.
- **No swallowed errors:** `fail()` hard-exits; the gate is exit-code-gated and reported 10 harnesses (≥ MIN_TESTS). No vacuous pass.

No undisclosed forks found.

---

## Notes for the orchestrator
- The two-commit shape is exactly the plan's encoded conditional: G1 shipped provisionally in `791b553`, premise gate failed in evidence, `96de88d` rolled back to G3 and added FORK-D1b. Judged on FINAL state as instructed — PASS.
- Harness labels differ cosmetically from the DoD's `(h)(i)(j)`: the committed harness reuses Phase-1's `(h)(i)` and adds the Phase-2 checks as `(h2)(i2)(j)(k)`. The constructs the DoD names are all pinned; the `(k)` addition pins FORK-D1b. Substance matches DoD 6.

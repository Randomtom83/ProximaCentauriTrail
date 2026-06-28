# Proxima Trail — session log (2026-06-28)

A record of this working session: the conversation, the decisions, and the commits. Written so a
future session (or Tom) can reconstruct *why* things are the way they are, not just *what* changed.

---

## Context at the start
Coming out of plan-mode work on M-INT1b. Two failed `ExitPlanMode` calls had happened (the session
had already left plan mode), and the corrected `[3a]` decision existed in the live plan buffer but
not yet in the committed repo plan.

---

## Turn-by-turn

### 1. "Why is the context-window plan different from the side-panel plan?"
Explained the divergence: the **side panel** shows a *frozen snapshot* — the plan as last submitted
through `ExitPlanMode` (still the old **two-clock / relativity** version of `[3a]`). The **plan file
on disk** is the live, edited version (the corrected **single canonical clock**). They diverged
because the corrected edits landed after the session left plan mode, so the panel never refreshed.
Takeaway: the file is authoritative; the panel is stale.

### 2. "Present that file / copy it to the repo docs folder"
Discovered the committed `docs/proxima-trail-implementation-plan.md` is a **curated, condensed log**
(Addendum style: P3-M1…P3-M4, M-INT1), not the raw 199 KB plan-mode buffer. Decided the right move
is to **append a condensed M-INT1b Addendum**, never to overwrite the curated doc with the raw buffer.

### 3. "Start keeping it in docs with each update — add to memory; it goes with the build HTML"
Created **`CLAUDE.md`** (project memory) with the standing rule: every milestone that touches
`docs/dashboard.html` must also append a plan Addendum **in the same commit**.
→ commit **`4f7b712`**.

### 4. Corrected `[3a]` + PLAN-FILE DISCIPLINE
Tom supplied the corrected `[3a]` (a one-line **REPOINT**, not a two-clock readout) and a new
**PLAN-FILE DISCIPLINE** policy (the committed plan is the source of truth; read fresh from HEAD;
reconcile chat-only plans into it; verify the line count grew after writing).
- Wrote the full **M-INT1b section** into the committed plan (pure append: 803 → 938 lines, 0
  deletions), carrying the corrected `[3a]`.
- Added PLAN-FILE DISCIPLINE to `CLAUDE.md`.
→ commit **`2123d1e`**.

**The corrected `[3a]` (locked):** show ONE reconciled clock, identical on both HUDs, via
`exodusYears()`. On the colony HUD, **repoint** the existing stat —
`stat("Years since exodus", col.elapsedYears)` → `stat("Years since exodus", exodusYears())` — a
one-line edit. **No** second year line, **no** "Colony cycles" relabel; `col.elapsedYears` stays
computed for `colonyAgeDrift`, it just stops being the displayed stat. Relativity framing retired
(voyage crew age 1.6/turn vs colonists 0.5/turn — they age *faster*, the opposite of dilation).

### 5. M-INT1b BUILD
Implemented the three presentation-only deliverables in `game.js`:
- **[2a]** off-front status strip — one `.small dim` line per HUD (voyage shows the colony headline;
  colony shows the ark headline), stored fields only, render-guarded.
- **[3a]** the one-line colony-stat REPOINT (above).
- **[1c]** adaptive off-front digest — `captureDigest` wraps the two auto-tick *call sites*, slices
  the tick's OWN `game.log` into a transient `game._offlog`; `digestBlock` shows a one-liner on a
  quiet tick and the captured entries verbatim on a major beat. Read-only — writes no front state.

Also widened the **inert `__PROXIMA_TEST__` seam** (production-inert) to expose render/tick/helper
symbols so a headless harness could render real HUDs.

**Verification (all green):** `node --check`; **zero-diff gate** — `applyOutcome`/`resolveCheck`/
`tryCompose`/`composeEnding` md5-identical to HEAD, and the `colonyAutoStep`/`voyageTurn`/`colonyTurn`
bodies byte-identical (only their call sites wrapped); **`mint1b.js` harness 18/18** (read-only
proof; both HUDs render `Years since exodus` == `exodusYears()` = 48 while `col.elapsedYears` = 2;
adaptive digest; v7 save posture); **mobile 390×844** Playwright screenshots of both HUDs (no topbar
overflow introduced — it pre-exists on HEAD; the strip adds 20 px; voyage action row stays above the
844 fold). Dashboard + plan pointers updated in the same commit (docs↔dashboard pairing).
→ commit **`ad92ece`**.

### 6. "Preparing to move local" — reorg + handoff
Repo confirmed **public**. Chosen approach: **delete the whole repo after download** (so git-history
retention is moot), and **all non-game files become private**.
- Split: the playable game (`index.html`, `game.js`, `style.css`, `audio.js`, `README.md`) stays at
  the root; everything non-game moved into **`docs/to-be-deleted/`** (`CLAUDE.md`, the plan,
  `dashboard.html`, `consequence-ledger.md`, `ui-inventory.md`, `screenshots/`).
- Added **`HANDOFF.md`** (orientation for the new local session) and **`handoff.py`** (one command:
  restores the normal dev layout — `CLAUDE.md` → root, dev docs → `docs/` — and serves the game at
  `http://localhost:8000`; cross-platform, idempotent). Both paths smoke-tested.
→ commit **`cb26756`**.

### 7. This file
Tom asked for a markdown record of the conversation in the private folder. That's this document.

---

## Commits this session
| SHA | What |
|-----|------|
| `4f7b712` | Add `CLAUDE.md` project memory: docs plan travels with every dashboard update |
| `2123d1e` | Reconcile M-INT1b into the committed plan + adopt PLAN-FILE DISCIPLINE |
| `ad92ece` | **M-INT1b build** — parallel-fronts legibility layer (presentation only) |
| `cb26756` | Reorg for local handoff: split game (public) vs non-game (to-be-deleted) + handoff |

(All on branch `claude/intelligent-galileo-y2siqb`, which was the repo's default branch. PR #1 was
open; it becomes moot once the repo is deleted after download.)

## Durable decisions to carry forward
- **PLAN-FILE DISCIPLINE** — the committed `docs/proxima-trail-implementation-plan.md` is the source
  of truth; read it fresh, reconcile, append within section banners, verify the line count grew.
- **Docs travel with the build** — plan Addendum + dashboard update + code, in one commit per
  milestone.
- **Zero-diff gate** — build milestones as siblings; keep the frozen four md5-identical to HEAD.
- **`[3a]` is settled** — one canonical `exodusYears()` clock shared by both HUDs; no two-clock /
  relativity readout; `col.elapsedYears` stays computed but undisplayed.

## Likely next work (flagged in the plan, confirm scope first)
- **M-INT1** — endings composition generalization (`composeEnding` over colony × home × beacon).
- **M-INT2** — balance / hazard / Earth-doom tuning.

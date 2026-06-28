# Proxima Trail — handoff to the local session

You are picking this project up **locally** (it was developed in a remote Claude Code
sandbox). This file orients you; `handoff.py` restores the working layout and hosts the game.

---

## 1. What this is
**Proxima Trail** — *The Oregon Trail*, in space. A vanilla-JS browser game (no build step,
no backend). Flee a dying Earth, keep a crew alive across the solar system and the
interstellar void, found a colony on Proxima Centauri b — then (Act II) run the colony while a
crewed ark crosses back home, and weigh both fronts at the finale.

## 2. Run it (two ways)

**Quick:** from the repo root, serve the static files and open the page:
```
python -m http.server 8000      # then open http://localhost:8000
```
(Equivalent: `npx serve`, or VS Code "Live Server". Opening `index.html` via `file://` mostly
works but a server avoids any browser file:// quirks.)

**Recommended (first time after download):** run the handoff script — it restores the private
files to their normal dev locations *and* starts the server:
```
python handoff.py
```

## 3. Layout after download vs. after restore

This repo was reorganized for a clean public/private split before download. **All non-game
files were moved into `docs/to-be-deleted/`** (they were never meant to stay on the public
repo). The playable game stays at the root.

```
After download:                          After `python handoff.py` (normal dev layout):
  index.html  game.js  style.css           index.html  game.js  style.css  audio.js  README.md
  audio.js    README.md                     CLAUDE.md                  ← project memory, back at root
  HANDOFF.md  handoff.py                     docs/
  docs/to-be-deleted/                          proxima-trail-implementation-plan.md
    CLAUDE.md                                  dashboard.html
    proxima-trail-implementation-plan.md       consequence-ledger.md
    dashboard.html                             ui-inventory.md
    consequence-ledger.md                      screenshots/
    ui-inventory.md
    screenshots/
```
`handoff.py` simply moves those files back: `CLAUDE.md` → repo root, the dev docs + screenshots
→ `docs/`. `CLAUDE.md` at the repo root is what makes a local Claude Code session auto-load the
project memory.

## 4. The two source-of-truth docs (read these first)
- **`docs/proxima-trail-implementation-plan.md`** — the curated, condensed project log. Every
  milestone is an appended *Addendum* (`P3-M1 … P3-M4`, `M-INT1`, `M-INT1b`). This is the
  authoritative plan.
- **`docs/dashboard.html`** — a self-contained interactive dashboard + changelog/decision log.
  Open it in a browser; task statuses and a dated log live in inline JS arrays.

## 5. Standing conventions (carried in `CLAUDE.md`)
- **Plan-file discipline:** the committed plan file is the source of truth — read it fresh
  before planning/building; reconcile any chat-only plan into it; never clobber existing
  sections (append/within-section only).
- **Docs travel with the build:** every milestone that touches `docs/dashboard.html` also
  appends a condensed plan Addendum **in the same commit** as the code.
- **Zero-diff gate:** milestones are built as *siblings*, leaving a frozen set of functions
  (`applyOutcome`, `resolveCheck`, `tryCompose`, `composeEnding`) **md5-identical to HEAD**.
  Verify with the method in §6.

## 6. How verification works (reuse this)
- `node --check game.js audio.js` for syntax.
- **Zero-diff:** extract a function by brace-matching from `git show HEAD:game.js` vs the
  working tree and compare md5 (see the M-INT1b/M-INT1 method described in the plan).
- **Test seam:** setting `window.__PROXIMA_TEST__ = true` *before* `game.js` loads exposes
  `window.__proxima` with the internal constructors/render/tick/helpers — a headless harness
  uses this (with a minimal DOM stub, or Playwright) to build a real game and assert on it.
  This seam is **inert in production** (attaches nothing unless the flag is set).
- **Mobile:** Playwright at 390×844 against `index.html`, using `addInitScript` to set the test
  flag, then driving `window.__proxima`.

## 7. Current state (as of this handoff)
- Latest milestone: **M-INT1b — parallel-fronts legibility layer** (presentation-only: an
  off-front status strip, a single canonical `exodusYears()` clock shared by both HUDs, and an
  adaptive off-front digest). Built, verified (zero-diff PASS, 18/18 harness), and committed.
- There was an open GitHub PR (#1) on branch `claude/intelligent-galileo-y2siqb`. Once the repo
  is downloaded and deleted from GitHub, that PR/branch history is moot — continue locally,
  initializing a fresh git repo if you want version control.
- Likely next work (flagged in the plan): **M-INT1** (endings composition generalization) and
  **M-INT2** (balance / hazard / Earth-doom tuning). Confirm scope before building.

## 8. First moves for the new session
1. `python handoff.py` (restores layout + serves the game).
2. Read `docs/proxima-trail-implementation-plan.md` (latest Addendum) and open
   `docs/dashboard.html`.
3. Play a round at `http://localhost:8000` to ground yourself.
4. Confirm the next milestone with the user before building.

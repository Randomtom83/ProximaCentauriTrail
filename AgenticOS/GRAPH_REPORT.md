# Graph Report - Proxima Trail  (2026-07-01)

## Corpus Check
- 50 files · ~121,554 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 725 nodes · 2298 edges · 53 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f51089ba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]

## God Nodes (most connected - your core abstractions)
1. `$()` - 141 edges
2. `log()` - 66 edges
3. `sfx()` - 64 edges
4. `clamp()` - 49 edges
5. `sfx()` - 44 edges
6. `handle()` - 43 edges
7. `============================================================` - 43 edges
8. `log()` - 42 edges
9. `closeModal()` - 40 edges
10. `rint()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `_locked_append()` --references--> `path`  [EXTRACTED]
  .claude/skills/agentic-orchestration/scripts/log_event.py → test/lib/boot.js
- `_locked_append()` --references--> `path`  [EXTRACTED]
  scripts/log_event.py → test/lib/boot.js

## Import Cycles
- 1-file cycle: `test/lib/boot.js -> test/lib/boot.js`

## Communities (53 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (138): $(), addChild(), addCrewMember(), adjustHealthAll(), adjustMoraleAll(), afflict(), ageCrew(), aiAssist() (+130 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (52): applyJobReward(), arrivalChoices(), beginColony(), captureDigest(), cargoSpace(), checkArrival(), clearSave(), closeMinigame() (+44 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (49): aiDiagnostics(), aiPurge(), aiState(), beginReturn(), bindSetter(), cargoUsed(), closeModal(), colonyLaunch() (+41 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (27): _locked_append(), main(), appHTML(), assertEndRendered(), assertNoErrors(), boot(), fail(), freshGame() (+19 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (39): adjustHealthAll(), afflict(), aiAssist(), applyColonyAction(), applyColonyOutcome(), applyHazardSeverity(), applyOutcome(), arriveAtProxima() (+31 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (33): ============================================================, ============================================================, ============================================================, ============================================================, ============================================================, ============================================================, A scoped FIX pass, not a milestone. Closes Game-A playability, a SIBLING of the outbound HAZARDS layer — never a reuse of the (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (26): addChild(), addColonist(), addCrewMember(), adjustMoraleAll(), ageCrew(), aiGlitch(), aiHostile(), aiTurn() (+18 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (21): author, bugs, url, description, devDependencies, jsdom, directories, doc (+13 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (21): Addendum — Act II deepened (the colony, the message home, the voyage back), Addendum — colony redesign: self-sufficiency is emergent, Addendum — Phase 2 (bridge aesthetic) & Phase 3 (generational crew), Addendum — Phase 4: ATLAS, the ship mind, Addendum — Phase 5: wormholes & Earth's fading signal, Addendum — Phase 6: interactive Act II (roadmap complete), Addendum — prompt-vs-outcome audit (every promise made true), Addendum — Sprint 7: route map, transit animations & first-contact surprise (+13 more)

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (21): crewStrip(), digestBlock(), exodusYears(), flashLog(), loadSave(), maybeSuccession(), modalFocusables(), offOneLiner() (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (19): applyCommanderFloor(), colonyAutoStep(), dispositionText(), finishVoyage(), hasAwakeCommander(), hasAwakeSpecialist(), presentHazard(), presentHomeHazard() (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (15): Audio (decision 5B — SFX only), Commit & PR, Context, Crew system (decision 2C), Files to create, game.js architecture, Locked design decisions, Open tuning items (deliberately deferred to playtest) (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.23
Nodes (16): ailing(), animationsOn(), autopilotRun(), autoResolveHazard(), computePower(), flushQueues(), log(), modalOpen() (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.17
Nodes (11): Deploy, FAIL LOUD — no silent death (verification principle), Fenced items — never auto-build (need Tom's decision), Local restore (do this FIRST in a fresh clone), Orchestration — Planner / Builder / Auditor (3-agent), PLAN-FILE DISCIPLINE (standing policy — applies every session), Proxima Trail — project memory, Standing rule: docs plan travels with every build update (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (12): ============================================================, DECISION 1 (locked by Tom) — Earth = bounded divergence: hidden TRUTH + shown BELIEF, DECISION 2 — backward-compat: `status` becomes a DERIVED view of the BELIEF, DECISION 3 (+recommend) — one cumulative Years-Since-Exodus clock, DECISION 4 (+recommend) — voyage Earth arc = `voyageEarthSignal()` SIBLING, DECISION 5a (+recommend) — voyage generations = `voyageAgeCrew()` SIBLING, DECISION 5b — voyageArrive Earth tiers, resolved on TRUTH (in-scope enrichment), Re-anchor — what already exists at HEAD de06dd7 (verified by grep; do NOT rebuild) (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.17
Nodes (11): Commit & PR, Context, Crew system, Files, Locked design decisions, Oregon Trail → Proxima Trail mapping, Proxima Trail — Implementation Plan, Save / scoring / audio (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (10): 0. Kickoff, 1. Setup (once per project — idempotent, adopt-never-overwrite), 2. Build loop (one phase at a time), 3. Devil's Advocate protocol (anti-laziness), 4. Reconcile loop (after all phases pass audit), 5. Heartbeat, watchdog, recovery, 6. Outputs & closeout, 7. Reference files (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.35
Nodes (10): build_state(), esc(), heartbeat_stale(), load_events(), main(), next_up(), progress(), render_closeout() (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (11): [1c] Adaptive off-front digest — captured from the auto-tick's OWN log, never recomputed/re-rolled, [2a] Always-visible both-fronts status strip — ONE slim `.small dim` line per HUD, [3a] Single canonical shared-clock — REPOINT the existing colony stat (no new line, no relabel), Context, Enumerated deliverables (the build adds/edits ONLY these), M-INT1b — Parallel-fronts legibility layer (presentation-only wrapper over the live dual-front engine), Re-anchor — verified against committed source (the machinery is already there), STOP (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.35
Nodes (10): build_state(), esc(), heartbeat_stale(), load_events(), main(), next_up(), progress(), render_closeout() (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (10): Context, Decision (locked) — ADDITIVE RE-TIERING, two cells only, Golden-lock — characterization harness `/tmp/endings_golden.js` (replaces the md5 gate), Implementation shape (surgical, in place — no refactor), M-INT1 — Endings composition (split the two-world `cWon && !vWon` branch on `v.tier`), Re-anchor — what exists at HEAD (verified against source; do NOT rebuild), Scope boundary, STOP (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.20
Nodes (9): 1. What this is, 2. Run it (two ways), 3. Layout after download vs. after restore, 4. The two source-of-truth docs (read these first), 5. Standing conventions (carried in `CLAUDE.md`), 6. How verification works (reuse this), 7. Current state (as of this handoff), 8. First moves for the new session (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.20
Nodes (9): Auditor, Devil's Advocate, Executor, Model tier table, Plan-reviewer, Planner, Reconciler, Reverse-intent (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (9): ============================================================, DECISION 1 — resolved: separate `HOME_HAZARDS` pool; the three crossings migrated into it, How it composes when the ark is lost, Out of scope (deferred, named), STOP, Verification (all green), What was built (`game.js`, sibling-local), Why (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (7): args, crypto, cur, FROZEN, fs, missing, src

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (7): Credits, Development & verification, How to play, Keyboard, Play it, Project layout, Proxima Trail

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (7): Credits, Development & verification, How to play, Keyboard, Play it, Project layout, Proxima Trail

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (7): Credits, Development & verification, How to play, Keyboard, Play it, Project layout, Proxima Trail

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (7): ============================================================, Context, Delivery, DO-NOT-TOUCH / forward-links, Locked decisions (log each as a `decision` LOG entry in docs/dashboard.html), The five fixes (all in game.js; route through the colony loop / its siblings), Verification (all pass before STOP)

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (7): ============================================================, Build (all game.js — copy + state + a guard, NOT a composer rewrite), Context, DO-NOT-TOUCH (held), Locked decisions (logged as `decision` entries in docs/dashboard.html), STOP, Verification (all passed before STOP)

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (6): Definition of done, Notes, Proxima Trail — Harness Commit Spec (make the gate enforce), Step 0 — discover the test seam (do not guess the API), Suite to regenerate (≥ MIN_TESTS; reconcile the count — see below), The contract EVERY harness must meet (this is the whole point — no silent death)

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (6): ============================================================, Out of scope (flagged, not built), Re-anchor (verified against source, commit 6d741e8 — reported, not rebuilt), STOP, The only code change — UNFREEZE (chose option (a) + a legacy-save safety net), Verification (all passed)

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (5): Closeout, Dashboard information model (style free, concepts mandatory), Decision ledger (mandatory at end of every full-auto run), Event log schema & dashboard information model, Event types

### Community 35 - "Community 35"
Cohesion: 0.40
Nodes (5): ============================================================, Scope boundary (held), STOP, Verification (all green), What was built (style.css rewritten + four render functions' markup)

### Community 36 - "Community 36"
Cohesion: 0.83
Nodes (3): verify.sh script, fail(), ok()

## Knowledge Gaps
- **229 isolated node(s):** `name`, `version`, `description`, `main`, `doc` (+224 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `============================================================` connect `Community 5` to `Community 33`, `Community 35`, `Community 8`, `Community 14`, `Community 18`, `Community 20`, `Community 23`, `Community 29`, `Community 30`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Proxima Trail — Implementation Plan` connect `Community 8` to `Community 5`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _229 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07194244604316546 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06892230576441102 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.13010204081632654 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.13846153846153847 - nodes in this community are weakly interconnected._
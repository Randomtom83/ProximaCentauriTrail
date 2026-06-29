# Graph Report - \\RaiDrive-thoma\SFTP\ProximaTrail  (2026-06-29)

## Corpus Check
- Large corpus: 116 files · ~1,195,203 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 376 nodes · 1410 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Ship Systems & Exodus Clock|Ship Systems & Exodus Clock]]
- [[_COMMUNITY_Crew & Outcome Engine|Crew & Outcome Engine]]
- [[_COMMUNITY_ATLAS AI, Power & Launch|ATLAS AI, Power & Launch]]
- [[_COMMUNITY_Agent OS & Remediation|Agent OS & Remediation]]
- [[_COMMUNITY_Colony Turn Engine|Colony Turn Engine]]
- [[_COMMUNITY_Frozen Core & Dual-Front Setup|Frozen Core & Dual-Front Setup]]
- [[_COMMUNITY_NPM Package Manifest|NPM Package Manifest]]
- [[_COMMUNITY_Graphify Viewer Generator|Graphify Viewer Generator]]
- [[_COMMUNITY_Consequence Ledger (hidden meters)|Consequence Ledger (hidden meters)]]
- [[_COMMUNITY_Endings Matrix|Endings Matrix]]
- [[_COMMUNITY_Deterministic Gate (verify.sh)|Deterministic Gate (verify.sh)]]
- [[_COMMUNITY_Plan-File Discipline|Plan-File Discipline]]
- [[_COMMUNITY_Labor  Power Cascade|Labor / Power Cascade]]

## God Nodes (most connected - your core abstractions)
1. `log()` - 66 edges
2. `sfx()` - 64 edges
3. `clamp()` - 49 edges
4. `handle()` - 43 edges
5. `closeModal()` - 40 edges
6. `rint()` - 38 edges
7. `renderTravel()` - 36 edges
8. `alive()` - 33 edges
9. `resolveTurn()` - 33 edges
10. `openModal()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `hope (visible meter)` --references--> `finishColony()`  [INFERRED]
  docs/consequence-ledger.md → game.js
- `Exodus clock (exodusYears)` --references--> `exodusYears()`  [EXTRACTED]
  docs/proxima-trail-implementation-plan.md → game.js
- `Dual-front engine (colony + ark)` --references--> `beginColony()`  [INFERRED]
  docs/proxima-trail-implementation-plan.md → game.js
- `Dual-front engine (colony + ark)` --references--> `startVoyage()`  [INFERRED]
  docs/proxima-trail-implementation-plan.md → game.js
- `Zero-diff gate` --references--> `composeEnding()`  [EXTRACTED]
  CLAUDE.md → game.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **The 3-agent orchestration pipeline** — agents_planner_planner, agents_builder_builder, agents_auditor_auditor, claude_deterministic_gate [EXTRACTED 1.00]
- **Frozen-three functions** — game_applyoutcome, game_resolvecheck, game_trycompose [EXTRACTED 1.00]
- **Fenced items (need Tom)** — claude_fenced_s2_4, claude_fenced_d2_1, claude_fenced_s3_1, claude_fenced_s2_2, claude_fenced_s3_3 [EXTRACTED 1.00]
- **M-INT1b locked features [2a]/[3a]/[1c]** — docs_proxima_trail_implementation_plan_m_int1b_2a, docs_proxima_trail_implementation_plan_m_int1b_3a, docs_proxima_trail_implementation_plan_m_int1b_1c [EXTRACTED 1.00]
- **The five hidden long-tail meters** — docs_consequence_ledger_ecoharm, docs_consequence_ledger_nativetrust, docs_consequence_ledger_contamination, docs_consequence_ledger_structuraldebt, docs_consequence_ledger_trauma [EXTRACTED 1.00]
- **Dual-front finale participants** — game_trycompose, game_composeending, game_exodusyears, docs_proxima_trail_implementation_plan_dual_front_engine [INFERRED 0.85]

## Communities (14 total, 2 thin omitted)

### Community 0 - "Ship Systems & Exodus Clock"
Cohesion: 0.06
Nodes (73): Cascade: The Earth clock, elapsedYears / Earth clock (visible), Exodus clock (exodusYears), M-INT1 (endings re-tier), M-INT1b (parallel-fronts legibility layer), [1c] Adaptive off-front digest, [2a] Both-fronts status strip, [3a] Single canonical shared clock (+65 more)

### Community 1 - "Crew & Outcome Engine"
Cohesion: 0.14
Nodes (55): addChild(), addColonist(), addCrewMember(), adjustMoraleAll(), afflict(), ageCrew(), aiGlitch(), aiHostile() (+47 more)

### Community 2 - "ATLAS AI, Power & Launch"
Cohesion: 0.14
Nodes (54): aiDiagnostics(), aiPurge(), aiState(), autoResolveHazard(), bindSetter(), closeModal(), colonyLaunch(), colonyStageCheck() (+46 more)

### Community 3 - "Agent OS & Remediation"
Cohesion: 0.10
Nodes (39): AgenticOS remediation graph viewer, Auditor (agent), Builder (agent), Planner (agent), Deterministic gate (scripts/verify.sh), FAIL LOUD / no-silent-death, D2-1 void-leg pacing (fenced), Fenced items (need Tom's decision) (+31 more)

### Community 4 - "Colony Turn Engine"
Cohesion: 0.11
Nodes (40): adjustHealthAll(), aiAssist(), applyColonyAction(), applyColonyOutcome(), arriveAtProxima(), byName(), clamp(), colHabDrain() (+32 more)

### Community 5 - "Frozen Core & Dual-Front Setup"
Cohesion: 0.10
Nodes (20): Frozen-three (applyOutcome/resolveCheck/tryCompose), hope (visible meter), Dual-front engine (colony + ark), arrivalChoices(), beginColony(), beginReturn(), finishColony(), seedColonySites() (+12 more)

### Community 6 - "NPM Package Manifest"
Cohesion: 0.09
Nodes (21): author, bugs, url, description, devDependencies, jsdom, directories, doc (+13 more)

### Community 7 - "Graphify Viewer Generator"
Cohesion: 0.10
Nodes (18): byId, DOCS_MD, fs, HTML_FILE, mermaidId(), neighbors(), path, ROOT (+10 more)

### Community 8 - "Consequence Ledger (hidden meters)"
Cohesion: 0.14
Nodes (16): The sacred list, contamination (hidden meter), ecoHarm (hidden meter), Hidden long-tail meters, nativeTrust (hidden meter), No-orphan-meter rule, relations (visible surface stance), structuralDebt (hidden meter) (+8 more)

### Community 10 - "Endings Matrix"
Cohesion: 0.33
Nodes (6): beaconHeard (a beacon that reached a living Earth), Ending: EXTINCT, Ending: THE MESSENGER, Ending: TWO WORLDS, Ending: THE WORD GOT THROUGH, Endings matrix (composeEnding)

### Community 11 - "Deterministic Gate (verify.sh)"
Cohesion: 0.83
Nodes (3): verify.sh script, fail(), ok()

## Knowledge Gaps
- **69 isolated node(s):** `fs`, `path`, `ROOT`, `STATE_FILE`, `HTML_FILE` (+64 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `composeEnding()` connect `Ship Systems & Exodus Clock` to `Endings Matrix`, `Agent OS & Remediation`, `Frozen Core & Dual-Front Setup`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Why does `Zero-diff gate` connect `Agent OS & Remediation` to `Ship Systems & Exodus Clock`, `Frozen Core & Dual-Front Setup`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `ROOT` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Ship Systems & Exodus Clock` be split into smaller, more focused modules?**
  _Cohesion score 0.05727605727605728 - nodes in this community are weakly interconnected._
- **Should `Crew & Outcome Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.1447811447811448 - nodes in this community are weakly interconnected._
- **Should `ATLAS AI, Power & Launch` be split into smaller, more focused modules?**
  _Cohesion score 0.143256464011181 - nodes in this community are weakly interconnected._
- **Should `Agent OS & Remediation` be split into smaller, more focused modules?**
  _Cohesion score 0.09863945578231292 - nodes in this community are weakly interconnected._
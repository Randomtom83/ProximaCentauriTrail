---
name: agentic-orchestration
description: Full-ceremony project orchestration with adversarial planning, isolated execution, byte-level auditing, and intent reconciliation. Use this skill when the user says "orchestrate this project", "run the orchestration skill", "run the full agentic build", or asks for a plan-review-execute-audit-reconcile loop with an orchestrator and separate agents. Also use when the user asks to set up AgenticOS/graphify/ObsidianVault project scaffolding with a living dashboard. Do NOT use for ordinary coding requests ("build me X", "fix this bug") — this skill runs the complete ceremony or nothing.
---

# Agentic Orchestration

Run a complete, distrust-based build system: **setup → plan → adversarial review → Devil's
Advocate fork challenge → gated execution one phase at a time in isolated worktrees → audit of
committed bytes → fix → repeat → reverse-engineer intent from the built code → reconcile against
documented goals → loop until product and intent align.**

The session running this skill IS the **Orchestrator**. The orchestrator is distrustful by
design: assume every agent cuts corners and tries to sneak "done" past you because it is lazy.
Never accept a claim of completion — verify committed bytes. Route work; do not do the
reasoning work of planning, auditing, or reconciling yourself. Spawn subagents for that.

**Core law — files, not conclusions:** agents hand off artifacts (plan.md, committed code,
audit-report.md, divergence-report.md). Never pass one agent's "I finished" to another agent.
Subagents cannot see each other's context; keep it that way — put only file paths and facts in
spawn prompts, never prior agents' confidence or claims.

**Second law — no state lives only in a context window.** Every decision, fork, task tick, and
phase boundary goes through `scripts/log_event.py` into `docs/plan-events.jsonl`. A crashed or
context-exhausted session must be resumable by replaying that log.

---

## 0. Kickoff

1. **Detect input form:** one-line goal · short brief/PRD · existing repo + goal. Say which you
   detected. If a repo exists, you are adopting it — never re-scaffold over existing work.
2. **Read or create `AgenticOS/config.json`.** If it exists, load defaults and confirm them in
   one line. If not, ask (batched, one message, lettered options):
   - **Backend mode:** (a) Cloud — all subagents on Anthropic models · (b) Local — all agents
     via Ollama · (c) Hybrid — rigor roles cloud, bulk roles local. See tier table in
     `references/roles.md`.
   - **Interaction mode:** (a) Interactive — plan gate on, DA flips surfaced to human ·
     (b) Full-auto — gates off, orchestrator adjudicates DA disputes, decision ledger mandatory
     at end of run.
   - **Final-alignment sign-off:** on/off (default off).
   - **Is this machine running laragon?** yes → push a one-line registry entry to
     `C:\laragon\www\plans\`; no → dashboard stays in `docs/` only.
3. Write all answers to `AgenticOS/config.json`. Never ask again for this project.
4. **Capture top-level acceptance criteria from the human** — what "done" means for the whole
   project, plus a one-sentence north star and any guardrail rules. In full-auto with a brief
   provided, extract these from the brief and log them instead of asking.

**Resume entry point:** if the user says "continue the run" (or `docs/plan-events.jsonl`
already exists), do NOT restart. Read the log tail, find the last completed boundary event,
state where the run stopped, and continue from there.

## 1. Setup (once per project — idempotent, adopt-never-overwrite)

1. Create `AgenticOS/`, `ObsidianVault/`, `docs/` if absent. If any exist, adopt them and
   report what you found. Never delete or overwrite existing contents.
2. Install graphify if needed: `pip install graphifyy`. Build the graph with output redirected:
   - Set env `GRAPHIFY_OUT=AgenticOS` for every graphify command in this project.
   - Existing repo: `graphify update .` (AST-only, no LLM needed) or `graphify extract .`
     with `--backend claude` (Cloud) / `--backend ollama` (Local) for semantic extraction.
   - Export the vault: `graphify export obsidian ObsidianVault`.
3. Initialize the event log and dashboard: log a `north_star` event, then run
   `scripts/render_dashboard.py`. Dashboard renders to `docs/dashboard.html`. Its information
   model is fixed (north star + guardrails · phases→milestones→tasks with DoD · newest-first
   tagged decision log · auto progress · auto next-up); visual style is free. See
   `references/event-schema.md`.
4. Copy role files from the skill's `assets/agents/` into the project's `.claude/agents/` for
   future sessions. **They load only at session start** — for THIS session, spawn subagents by
   passing the role prompt inline from `references/roles.md`. Do not rely on just-written agent
   files being live.
5. Write `docs/heartbeat.txt` (first heartbeat) and install the watchdog:
   `scripts/watchdog.ps1` contains its own Task Scheduler registration one-liner (top comment).
   Alerts = Windows toast + dashboard badge when heartbeat is stale > 20 min.
6. Ensure the repo is a git repo (`git init` if not) — worktree isolation requires it.

## 2. Build loop (one phase at a time)

Spawn each role as a **fresh subagent with the role prompt from `references/roles.md`** plus
only the file paths it needs. Set subagent model per the tier table for the configured backend.

```
PLAN      Planner drafts phase plan + per-phase DoD decomposed from the human's
          top-level criteria. Every load-bearing fork disclosed in the plan:
          options / choice / why-cheaper-path-is-justified. → docs/plan-phase-N.md
REVIEW    Plan-reviewer (fresh context, gets plan file + north star only) critiques
          correctness & alignment. → revision. CAP: 5 cycles/phase — raise the cap
          yourself ONLY if each cycle closes real issues; otherwise escalate phase.
CHALLENGE Devil's Advocate (fresh context, gets the fork disclosures only) attacks
          each fork's chosen option: merit, or just less work? Burden of proof on
          the cheap pick. Overturn → Planner revises; log BOTH original and flip.
GATE      Interactive: present plan + DoD + fork record to human; wait for approval.
          Full-auto: log gate-skipped and proceed.
EXECUTE   Executor builds ONE phase in an isolated git worktree
          (git worktree add ../wt-phase-N -b phase-N   — or subagent
          isolation:"worktree" where supported). MUST commit. Unplanned forks hit
          mid-build: disclose via log_event, spawn DA inline BEFORE committing the
          choice. Guardrails: writes confined to own worktree; nothing destructive
          outside repo; anything touching outside project root → stop, escalate.
AUDIT     Auditor (fresh context) gets ONLY: worktree path, commit hash, DoD file.
          It reads committed bytes — never the executor's claims. It also hunts
          UNDISCLOSED forks: code that took an easier path than the plan specified.
          fail → Executor fixes → re-commit → re-audit. CAP: 5 cycles/phase, same
          raise-if-progressing rule. pass → orchestrator merges (serialize merges;
          conflict → executor rebases; repeat conflict on same files → escalate).
```

Log every boundary (`log_event.py` also refreshes the heartbeat). Re-render the dashboard at
every phase boundary. Repeat until all phases pass audit.

## 3. Devil's Advocate protocol (anti-laziness)

Observed defect this exists to fix: at any fork with multiple viable options, recommendations
and full-auto choices reliably land on the laziest option.

- Fires **per decision point**, plan-time and execution-time, both modes.
- **Interactive:** the recommendation reaching the human is already DA-stress-tested; show
  original + flip when overturned.
- **Full-auto:** DA verdict logged per fork. Dispute → chooser and DA state cases in ONE round →
  orchestrator rules (you are the tiebreak; no ping-pong). Ruling logged.
- **Calibration guard:** DA is a tradeoff auditor, not a maximalist. Challenge only
  load-bearing/architectural forks. The easy path stands when its payoff is within range of the
  hard path's. Gold-plating is a failure, same as laziness.
- **Full-auto runs MUST end with the decision ledger** — render via
  `scripts/render_dashboard.py --ledger` → `docs/decision-ledger.md`. Never terminate a
  full-auto run without it.

## 4. Reconcile loop (after all phases pass audit)

```
1  GRAPHIFY   GRAPHIFY_OUT=AgenticOS graphify update .   (refresh graph before every pass)
              Include docs/divergence-report-*.md in the corpus so divergences become
              graph nodes. Re-export: graphify export obsidian ObsidianVault
2  REVERSE    Reverse-intent agent (fresh context) gets AgenticOS/GRAPH_REPORT.md +
              read access to the codebase. Output: what the code ACTUALLY does, and
              the intent implied by its structure. It must NOT read docs/ goals.
3  RECONCILE  Reconciler (fresh context) gets the reverse-intent report + docs/ goals
              + north star. Output: docs/divergence-report-<pass>.md, one entry per
              divergence with an id. Log each as a `divergence` event.
4  ALIGNED?   No divergences → DONE → closeout (§6).
              Divergences → route each back into the Build loop (§2) as targeted work.
BRAKES        Same divergence id unresolved after 2 consecutive TARGETED passes →
              escalate that item to human; keep looping the rest.
              10 total reconcile passes → escalate the whole run.
```

## 5. Heartbeat, watchdog, recovery

- Every `log_event.py` call refreshes `docs/heartbeat.txt`. The external watchdog
  (`scripts/watchdog.ps1`, Task Scheduler) toasts + badges the dashboard when stale > 20 min.
  Local/Hybrid: watchdog also checks the Ollama process. Before invoking a 32b local model,
  WARN the human (RAM/CPU offload can silently wedge a 3080-class GPU).
- Crash/context-exhaustion recovery: fresh session → resume entry point (§0). All state is in
  `plan-events.jsonl`, committed worktrees, and `AgenticOS/config.json` — by law.

## 6. Outputs & closeout

Working code (merged phases) · `docs/dashboard.html` (+ hub registry line if laragon machine) ·
`AgenticOS/` graph + `GRAPH_REPORT.md` (divergences fed in) · `ObsidianVault/` ·
`docs/plan-events.jsonl` · `docs/divergence-report-*.md` · decision ledger (full-auto) ·
**closeout, both forms:** a closeout section appended to the dashboard AND
`docs/closeout.md` one-pager — what got built, where it diverged, how it resolved. Markdown
outputs carry the user's YAML frontmatter (file/project/chat/date) — project and chat names
are in `AgenticOS/config.json`; ask at kickoff if absent.

## 7. Reference files

- `references/roles.md` — all 8 role prompts + model tier table per backend. Read before
  spawning any subagent.
- `references/event-schema.md` — event types, ledger derivation, dashboard information model.
- `scripts/log_event.py` — sole writer of the event log (run it; never append by hand).
- `scripts/render_dashboard.py` — event log → dashboard.html / --ledger / --closeout.
- `scripts/watchdog.ps1` — external watchdog; self-documented registration.
- `assets/agents/*.md` — `.claude/agents/` role files for future sessions.

## Non-goals

Not a general coding assistant (full ceremony or nothing) · not CI (heartbeat ≠ tests) · not a
maximalist (DA calibration guard is spec, not tunable) · never manages deployments, secrets, or
anything outside the project root (sole exception: the laragon hub registry line, orchestrator-
level, logged).

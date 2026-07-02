---
file: event-schema.md
project: prompt writing
chat: Agentic project orchestration system with iterative planning and validation
date: 2026-07-01
---

# Event log schema & dashboard information model

`docs/plan-events.jsonl` — append-only, one JSON object per line. **Single-writer rule: only
`scripts/log_event.py` writes to it.** Every write also refreshes `docs/heartbeat.txt`.

Common fields on every event: `ts` (ISO 8601), `type`, `actor` (orchestrator | planner |
plan-reviewer | devils-advocate | executor | auditor | reverse-intent | reconciler | human).

## Event types

| type | payload fields | purpose |
|---|---|---|
| `north_star` | `statement`, `guardrails[]`, `acceptance_criteria[]` | seeds dashboard header |
| `phase_def` | `phase_id`, `name`, `milestones[{name, tasks[{id,text}], dod[]}]` | plan structure (re-emit to revise) |
| `task_done` | `phase_id`, `task_id` | progress tick |
| `phase_status` | `phase_id`, `status` (planned/gated/executing/auditing/merged/escalated) | boundary marker |
| `note` | `tag`, `title`, `body` | decision & veer log entry |
| `fork` | `fork_id`, `stage` (plan/execution), `options[]`, `chosen`, `justification` | fork disclosure |
| `da_verdict` | `fork_id`, `verdict` (uphold/overturn), `reasoning`, `new_chosen?` | DA challenge result |
| `orchestrator_ruling` | `fork_id`, `ruling`, `reasoning` | full-auto dispute tiebreak |
| `gate` | `phase_id`, `result` (approved/changes/skipped-full-auto) | human gate record |
| `audit` | `phase_id`, `cycle`, `result` (pass/fail), `report_path` | audit outcome |
| `divergence` | `divergence_id`, `pass_n`, `severity`, `summary`, `status` (open/closed/escalated) | reconcile finding |
| `escalation` | `what`, `why` (thrash/cap/guardrail), `item_id?` | human attention required |
| `heartbeat` | `phase_id?`, `detail` | explicit liveness (implicit on every event too) |
| `closeout` | `summary`, `divergence_count`, `passes` | end of run |

`note.tag` ∈ `decision · process · gotcha · rescope · shipped · divergence`.

## Decision ledger (mandatory at end of every full-auto run)

Derived, never hand-written: `render_dashboard.py --ledger` joins every `fork` with its
`da_verdict` and any `orchestrator_ruling`, ordered chronologically →
`docs/decision-ledger.md`. A full-auto run that terminates without this file is incomplete.

## Dashboard information model (style free, concepts mandatory)

`render_dashboard.py` → `docs/dashboard.html`, self-contained, no dependencies. Must present:

1. **North star** + guardrails at top.
2. **Phases → milestones → tasks** with per-phase DoD, checkable state from `task_done`
   events, phase status badges.
3. **Decision & veer log** — newest first, dated, tagged (the six tags above). Forks and DA
   overturns appear here so every direction change is visible in one place.
4. **Auto-computed progress** (overall + per phase) and **auto-derived next-up** (first
   unfinished task in phase order).
5. **Stale badge** — if `heartbeat.txt` is older than 20 minutes at render time, show it.
6. **Closeout section** once a `closeout` event exists.

Re-render at every phase boundary. The HTML is a VIEW; the jsonl is the truth. Never edit the
HTML by hand and never write jsonl except through `log_event.py`.

## Closeout

`render_dashboard.py --closeout` → `docs/closeout.md` one-pager (what got built · where it
diverged · how it resolved · escalations · pass count) AND appends the same content as a
dashboard section. Both forms, always.

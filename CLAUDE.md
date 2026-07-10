# Proxima Trail — project memory

## Standing rule: docs plan travels with every build update
Every milestone / build update that touches `docs/dashboard.html` MUST also update
`docs/proxima-trail-implementation-plan.md`, in the **same commit** as the code change.
The two are a pair — never update one without the other.

- **`docs/proxima-trail-implementation-plan.md`** is the curated, condensed project log.
  For each milestone, **append a new condensed Addendum** in the existing style
  (e.g. `P3-M1 … P3-M4`, `M-INT1`, `M-INT1b`). **Append — never overwrite**, and never
  dump the raw agent plan-mode buffer over it. The verbose plan-mode buffer stays in the
  agent plan file; only the condensed Addendum lands in `docs/`.
- **`docs/dashboard.html`** is the living dashboard / changelog: flip task statuses to done
  and add a dated log entry (what changed, the decision and why, what it affected) as each
  milestone is finished and committed alongside the code.

So each milestone commit = **code + `dashboard.html` log/status + plan Addendum**, together.

## Why the plan lives in `docs/`
The user's canonical path is their local `…\Proxima Trail\docs`; this remote sandbox cannot
write there, so the repo's `docs/` folder is the synced mirror. The implementation plan and
any future design docs live in `docs/`, not just the agent plan file.

## PLAN-FILE DISCIPLINE (standing policy — applies every session)
The canonical plan is the COMMITTED file `docs/proxima-trail-implementation-plan.md`, NOT the
copy in chat / the context window. The context copy is a working draft and drifts; the
committed file is the source of truth.

Before planning OR building any milestone:
1. **READ** the committed file fresh from HEAD (re-open it from the repo; never rely on a
   remembered or pasted copy). Confirm it is complete and current.
2. **RECONCILE:** if a milestone was "planned" only in chat, it is NOT done — write that
   section INTO the committed file so file and agreed plan match.
3. **UPDATE on change:** whenever a milestone's plan is amended, edit the committed file (not
   just chat) so the repo always reflects the latest decision.

Edit discipline (preserve, don't clobber):
- Append/replace ONLY within that milestone's section (its `# ====`/`---` banner block).
- Sections not being changed stay byte-identical — do not reorder, re-summarize, or drop
  existing committed content. Keep doc structure intact.

Verification (self-reports don't count — check the committed file):
- After writing, RE-FETCH the committed file and confirm the target section's banner + key
  lines are present and the line count grew by roughly the section size. State the new line
  count and the markers found. If the count didn't move, the write didn't land — fix before
  reporting done.

## Local restore (do this FIRST in a fresh clone)
On the public repo the dev files are staged under `docs/to-be-deleted/` until restored. Run
`python handoff.py` **before any plan-file read** — otherwise the canonical plan is at
`docs/to-be-deleted/proxima-trail-implementation-plan.md`, not `docs/`, and the first agent
read will whiff. After restore: `CLAUDE.md` → root, plan/dashboard/etc → `docs/`.

## The constitution (2026-07-10 — supersedes "the sacred list")
Tom reopened everything ("nothing is sacred") and set the North Star: **darker, harder,
slightly real, still funny.** The old never-change list is RETIRED as law; what survives of it
survives on merit. Six principles now govern every design decision (full re-vision plan:
Tom's plan file + `docs/audit-design.md` context):

1. **The arithmetic doesn't care.** Physics, biology, logistics are the antagonist. Consequences
   are simulated honestly and narrated coldly. Space is never shortened for the player's
   convenience; light-lag is real; everything heard from Earth is old news.
2. **Legible brutality.** The game may kill you; it may never confuse you. Kill-chains narrate
   themselves as they happen; every death ends in a flight-recorder post-mortem. Dying
   comprehensibly IS the tutorial. Nothing gets easier — it gets visible.
3. **Grief has names.** Deaths are specific and earned (a named disease, a pod that lied, a
   stillbirth on survival rations). Oregon Trail's memorial culture, rebuilt for the void.
4. **The comedy lives in the mundane.** Gallows humor in coffee, paperwork, ATLAS's passive
   aggression — never in survival lines. Lucky-escape flourishes read as deadpan, not triumph.
5. **Hope is earned, never issued.** No passive regeneration, no invisible floors, no free heals,
   no riskless labor. Every mercy has a cost and a name. One healer per front, and it spends
   something.
6. **The mission outlives you.** Permadeath holds; command succession survives but costs (grief,
   legitimacy). Wins are rare, partial, honest: verdicts are TRIUMPH / SURVIVAL / EPITAPH, and
   genocide, contamination, and trauma follow you into the ending text.

**Re-affirmed on merit (not by law):** permadeath · sampled-not-scripted outcomes · hidden
meters stay hidden (surfaced diegetically only — ATLAS, the signal, omens; never numbers) ·
Settler/Pioneer/Voyager tiers · the void leg's full length · naive win-rate 0%.
**Explicitly opened:** odds, scarcity, the economy, heal valves, ending verdicts, act structure —
changeable when a change serves the six principles, always behind the gate + a win-rate sweep.
Tuning contract after hardening: naive 0% everywhere / optimal Settler ~35-45 / Pioneer ~25-35 /
Voyager ~10-15.

## Characterization gate (evolved from the zero-diff gate)
The md5 freeze is no longer a design law — it is a **drift alarm.** The engine is changeable;
it is never changeable *silently*.
- `applyOutcome`, `resolveCheck`, `tryCompose` are still md5-checked by `scripts/frozen.js`
  against `test/frozen-baseline.json`. Changing one is a deliberate act: **update the baseline
  in the same commit and say so in the commit message.** An unexplained baseline bump is a defect.
- `composeEnding` is golden-locked via the `endings_golden` harness (not md5). When the verdict
  model changes (TRIUMPH/SURVIVAL/EPITAPH), regenerate the golden set in the same commit.
- Every behavior-changing commit runs `bash scripts/verify.sh` AND (for balance-touching work)
  a per-difficulty win-rate sweep; report the before/after gradient in the commit body.

## FAIL LOUD — no silent death (verification principle)
A check that passes without actually testing is worse than no check. Two failure modes, both
must be caught:
- **Game silent-death:** a harness installs a global error trap (`window.onerror` +
  unhandledrejection / `process` handlers) and asserts the run reached a **real terminal state**
  (win or loss screen rendered). A swallowed exception or a run that never ends = **FAIL**, not
  a pass.
- **Build silent-death (false-green):** the gate (`scripts/verify.sh`) is `set -euo pipefail`,
  exit-code-gated, and refuses a **vacuous pass** — fewer than `MIN_TESTS` harnesses, a
  frozen-three function not found, or a missing baseline all FAIL. "Found nothing, so passed" is
  a failure.

## Orchestration — Planner / Builder / Auditor (3-agent)
Definitions in `.claude/agents/`. The main session orchestrates (`Task`). Per section:
`planner → builder → scripts/verify.sh → auditor → promote | revert`.
- **Input isolation:** the Auditor gets ONLY {spec, commit SHA, gate results} — never the
  Builder's narration. It reads committed bytes itself (`git show <SHA>`) and cites file:line.
- **Tool-enforced separation:** the Auditor has **no Write/Edit** — it reports, it cannot fix
  its own findings. The deterministic gate is **scripts**, not an agent.
- A self-report is never evidence; "didn't land in the commit" and "no proof" both = FAIL/FLAG.

## Fenced items (updated 2026-07-10)
Tom's re-vision UNFENCED and scheduled: S2-4 save integrity, S2-2 seeded RNG, S3-1
sibling-applier dedup, S3-3 file split (all Phase 5, behind characterization tests), and
D2-1 void-leg *legibility* (length stays). Still fenced — needs Tom, case by case:
- Anything that would change the six constitution principles themselves.
- Exposing a hidden meter as a number (diegetic surfacing is always fine).
- Shortening the trail (either direction) or removing permadeath.
- Non-name `innerHTML` sinks (add `escapeHtml()` before any typed-text feature ships).

## Deploy
Build local; deploy by copying approved static files (`index.html style.css game.js audio.js
docs/`) → `Y:\ProximaTrail` (SFTP→host, fast). `Y:` is a deploy target, not a dev location.

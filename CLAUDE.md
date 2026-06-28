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

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

---
id: auditor
label: "AUDITOR"
kind: agent
track: PIPE
state: active
owner: "CC subagent"
sha: ""
date: 2026-06-28
tags: [proxima-trail, remediation, track-pipe, state-active, kind-agent]
---
# AUDITOR  (`auditor`)

- **State:** active
- **Track:** pipeline
- **Owner:** CC subagent
- **SHA:** —

## Notes

Read-only, NO Write/Edit. Receives only {spec, SHA, gate results}; reads committed bytes itself. May block even if the gate is green.

## Links

- → [[planner]] _(loop)_
- ← [[gate]] _(flow)_

---
_Generated 2026-06-28 by AgenticOS/graphify.js from graph-state.json._

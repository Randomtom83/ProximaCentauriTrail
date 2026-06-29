---
id: gate
label: "GATE"
kind: agent
track: PIPE
state: active
owner: "scripts/verify.sh"
sha: 3fb4a37
date: 2026-06-28
tags: [proxima-trail, remediation, track-pipe, state-active, kind-agent]
---
# GATE  (`gate`)

- **State:** active
- **Track:** pipeline
- **Owner:** scripts/verify.sh
- **SHA:** `3fb4a37`

## Notes

Deterministic. set -euo pipefail, MIN_TESTS=8 guard, frozen-three md5 + composeEnding golden (endings_golden). Refuses a vacuous pass.

## Links

- → [[auditor]] _(flow)_
- ← [[builder]] _(flow)_

---
_Generated 2026-06-28 by AgenticOS/graphify.js from graph-state.json._

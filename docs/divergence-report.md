---
file: divergence-report.md
project: Proxima Trail
chat: Agentic project orchestration system with iterative planning and validation
date: 2026-06-30
---

# Proxima Trail — Reverse-Intent Divergence Report

One-off application of the agentic-orchestration blueprint's **reverse-intent → reconcile** loop:
read what the code *actually does*, reconcile it against the documented intent
(`docs/consequence-ledger.md`, `docs/proxima-trail-implementation-plan.md`, `CLAUDE.md`, and the
graphify `GRAPH_REPORT.md`), and log every mismatch. The triggering exemplar was *"someone got
hibernation sickness without hibernating."*

Sources of truth reconciled against: the consequence-ledger meter contract (§2 writers/readers/payoffs,
§5 orphan check), the implementation plan (M-INT1 / M-INT1b, dual-front engine, endings matrix), and
the sacred list (`CLAUDE.md`).

**Method note:** the isolated reconciler subagent could not be dispatched (host classifier outage), so
this reconcile was run inline via read-only `Read`/`Grep`. Findings cite committed `game.js` lines.

---

## Divergences

### #0 — Hibernation sickness without hibernating  ·  HIGH  ·  SAFE-CORRECTNESS  ·  RESOLVED
- **Code did:** `afflict()` (game.js:402) assigns a random ailment `pick(AILMENTS)` (407) to an *awake*
  crewmate; `AILMENTS` (game.js:168) included `"hibernation sickness"`.
- **Intent:** hibernation sickness is a cold-sleep affliction — every legitimate source gates on a pod
  (game.js:789, 996, 2468, 2773, 3720). A crewmate who never hibernated cannot catch it.
- **Divergence:** a generic illness event could label an awake crewmate with a pod-only ailment.
- **Fix (applied):** removed `"hibernation sickness"` from the generic `AILMENTS` pool (game.js:168) with
  an explaining comment. The pod paths still assign the literal string; the generic pool is now
  `radiation sickness · hypoxia · void fever · decompression trauma`. Frozen-three untouched; ailments
  are flavor-only (no per-name mechanics), so zero balance impact.

### #1 — `trauma` is payoff-only (documented continuous readers missing)  ·  MEDIUM  ·  NEEDS-TOM
- **Code does:** `trauma` has writers (game.js:1767, 1780, 1785, 2087, 2092–2093, 2106, 2130, 2154),
  decay/reducers (1400, 1577, 1754, 2066), and **one reader**: the threshold payoff `p_trauma` →
  "The One Who Couldn't" (game.js:2113, fires at 60). It is read **nowhere else**.
- **Intent:** consequence-ledger §2 `trauma` Readers = *"morale-breakdown frequency scales with it;
  lowers skill-check reliability; the homeward 'long dark' event hits harder."* Those three **continuous**
  readers are not implemented — `trauma` does not appear in `resolveCheck`/`resolveColonyCheck`, the
  breakdown logic, or the homeward hazard severity.
- **Divergence:** the meter accumulates and fires one set-piece but does not continuously *bite* as
  designed, so it carries less weight than intended. (Meets the §5 minimal "≥1 reader" orphan bar via the
  payoff — so it is **not** an orphan — but under-implements the §2 contract.)
- **Likely deferred, not an oversight:** the ledger states the full reader-set is enforced by *the M-INT2
  audit*; the continuous readers may be intentionally parked for the M-INT2 balance pass. Confirm intent.
- **Fix-safety:** NEEDS-TOM — wiring trauma into skill-check reliability / breakdown odds / hazard
  severity changes **odds & difficulty** (sacred list). Escalate; do not auto-build.

### #2 — `contamination` is payoff-only (same pattern as #1)  ·  MEDIUM  ·  NEEDS-TOM
- **Code does:** `contamination` has writers (game.js:2059, 1568, 2161), decay/reducers (1399, 1561,
  1573, 2072), and **one reader**: the threshold payoff `p_fever` → "The Fever Season" (game.js:2107,
  at 60). Read nowhere else.
- **Intent:** ledger §2 `contamination` Readers = *"a sickness-wave event whose severity scales with it;
  failed-harvest (crop-disease) chance; raises per-turn ailment frequency."* The continuous readers
  (per-turn ailment frequency, failed-harvest chance, severity scaling) are not wired.
- **Divergence:** identical shape to #1 — accumulates + one payoff, but no continuous pressure.
- **Likely deferred** (same M-INT2 note). **Fix-safety:** NEEDS-TOM (touches ailment/hazard odds).

---

## Clean reconciles (validated — no divergence)

These intent contracts were checked and **hold** in the committed code:

- **`ecoHarm` — fully wired.** Continuous readers: `colHabDrain` survival-drain multiplier
  `(1 + ecoHarm/120)` (game.js:1354), `nativeTrust` bleed (1864), hazard danger/weight (2168, 2196,
  2198); active-only reducer Restore (1628); payoff `p_eco` "The Ground Remembers" (2104). ✔
- **`structuralDebt` — fully wired.** Continuous reader: refit-cost/readiness tax (1609); hazard danger
  (2177); payoff `p_crack` "The Long Crack" (2110). ✔
- **`nativeTrust` — fully wired.** Gravitation anchor for `relations` (1862), raid `danger()` (2188),
  the Reckoning gate (2120/2126), HUD readout (4559); raisable both directions. ✔
- **`col.woke` — fully wired** (no dead flag): set by the expedition "woke" band (1679–1681), read by
  expedition danger (1649/1652), hope bleed (1857), nativeTrust bleed (1865), the "Bad Dreams" event cond
  (2085), and hazard weights/danger (2188, 2196, 2198). ✔
- **TWO WORLDS forward-marker honored.** The ledger's P2-M6 forward marker (settling must not
  short-circuit the parallel finale once a ship is in flight) is fully implemented: `confirmSettlement`
  (1958) branches its **copy** on `shipOut` (1960–1965) and routes through `finishColony(true,"SETTLED")`
  → `tryCompose` (1972), which **waits** for the live voyage instead of hard-ending (1973–1974). ✔
- **`afflict` is unreachable on the colony front.** No colony event sets `ailment:true`; the three
  `ailment:true` events (game.js:2510, 2979, 3004) are all ship/voyage events, where the four remaining
  ailments are coherent for a deep-space crossing. So no space-flavored ailment can strike a colonist. ✔
- **No hidden-meter UI leak found.** In the render paths scanned, `earth.truth` / `EARTH_DOOM_YEARS` are
  not surfaced; only `earth.status` (the belief view) and the exodus-year clock appear. ✔

---

## Escalation summary

| # | Divergence | Severity | Fix-safety | Disposition |
|---|------------|----------|-----------|-------------|
| 0 | Hibernation sickness on awake crew | HIGH | SAFE-CORRECTNESS | **Fixed** (AILMENTS:168) |
| 1 | `trauma` payoff-only (no continuous readers) | MEDIUM | NEEDS-TOM | Escalate / confirm M-INT2 deferral |
| 2 | `contamination` payoff-only (no continuous readers) | MEDIUM | NEEDS-TOM | Escalate / confirm M-INT2 deferral |

**Bottom line:** the codebase reconciles **well** against documented intent — one genuine
narrative-incoherence bug (fixed), and two ledger meters under-implemented relative to §2's continuous-
reader spec (likely M-INT2-deferred, and any fix is an odds/difficulty change requiring Tom's call). All
other intent contracts checked (three meters, the `woke` flag, the settlement/TWO-WORLDS guard, ailment
context, hidden-meter concealment) hold.

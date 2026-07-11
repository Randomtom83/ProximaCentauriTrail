# Closeout

**North star:** The flight home is as alive as the flight out - the crossing back to Earth carries the anticipation, texture, and decisions of the outbound trail, tuned to its own loneliness.

## What got built
- One-Screen Bridge (no-scroll travel, desktop + mobile) — merged
- Targeted remediation: D1 topbar/log space, D2 label clip, D3 crew-grid clip — merged
- Micro: mobile distance chip (D4) — merged
- The flight home: named landmarks + anchored decisions (M-HOME1-3) — merged

## Where it diverged (8 total, 4 reconcile pass(es))
- **D1** [closed] D1 verified closed on merged main ba0347a (reconciler re-ran gate + read shipped bytes). → closed
- **D2** [closed] D2 verified closed on merged main ba0347a (reconciler re-ran gate + read shipped bytes). → closed
- **D3** [closed] D3 verified closed on merged main ba0347a (reconciler re-ran gate + read shipped bytes). → closed
- **D4** [closed] Mobile distance chip shipped (f591fd2): Dist N / 434 ly visible at 390x844 with rail + current node inside the cap; desktop unchanged. Closed on audited bytes + orchestrator evidence. → closed
- **C1** [degrades-goal] COLONY HAS NO BIRTH PATH - confirmed at bytes: game._pregnancy machinery lives in outbound ageCrew (game.js:468-483) and v._pregnancy in voyageAgeCrew (:671), but colonyAgeDrift has only aging/come-of-age/elder-mortality; addChild has zero colony call sites. A colony can only age out - no new life at Proxima. Queued for P5 decision blocks. → open
- **C2** [degrades-goal] NO ROAD HOME PRE-FOOTHOLD - confirmed: the launch/beacon/settle hub (The future) renders only when col.footholdReached (game.js:4707), set solely at stage=foothold (:1908), plus shipReadiness>=LAUNCH_READY refit grind. A colony that stalls before foothold has NO path back to Earth ever. Design question (brutality vs dead-end) for P5 locks. → open
- **C3** [degrades-goal] EARTH NEVER SENDS SHIPS - confirmed: the STAY arrival choice literally promises 'signal Earth to send more' (game.js:1260) and beaconHeard is written by sendBeacon, but NO mechanic anywhere delivers arriving ships/new colonists; beaconHeard feeds only ending composition. A promise-vs-outcome gap: reinforcement is promised, never delivered. Queued for P5 decision blocks (ties to earth.truth + EARTH_DOOM_YEARS - heavy sacred-list territory). → open
- **P4-anchored-beats** [closed] Reverse-intent caveat (two position-locked beats) ruled NOT a divergence: exactly the Tom-locked D2=B intent; outcomes remain sampled; 4C covert version verified fenced at bytes. → closed

## Escalated to human
- none

_Derived from plan-events.jsonl on 2026-07-02T19:03:53-04:00_
"use strict";
/* pending_persist.js — permadeath must survive a page reload at "HAZARD AHEAD".
 *
 * The exploit (audit S9): hazard/station/void interaction queues were module-level
 * arrays, NOT part of the saved game — and checkArrival advances waypointIndex BEFORE
 * queueing. So arriving at the Belt, seeing "HAZARD AHEAD", and refreshing the browser
 * emptied the queue and waved the ship through the crossing. The fix moves the queues
 * into game._pending (hazard keys + WAYPOINTS indices, JSON-safe) so the autosave
 * carries them and flushQueues() re-fires them on resume.
 *
 * This harness proves the whole loop with a REAL serialize→reboot round-trip:
 *   instance A: arrive at the Belt via the real checkArrival → the hazard is queued
 *               INSIDE game (the exact object save() persists);
 *   JSON round-trip = what localStorage does;
 *   instance B (a fresh boot = the reload): restore the blob, flushQueues() → the
 *               CROSSING modal must present. Skipping it is a FAIL.
 * Plus the legacy-save path: a pre-fix blob without _pending must not throw.
 *
 * Seam: checkArrival, flushQueues, meta (pending-persist seam), newGame, game.
 */
const { boot, freshGame, settle, assertNoErrors, pass, fail } = require("./lib/boot");

const NAME = "pending_persist";

(async function () {
  try {
    // ---- instance A: the run where the hazard queues ----
    const A = boot();
    const gA = freshGame(A.px, "Pilot", "Settler");
    A.px.meta.anim = false;                    // transits resolve synchronously headless

    // Fly the real arrival: waypoint 3 is The Asteroid Belt (kind:hazard, key "belt").
    gA.waypointIndex = 3;
    gA.distance = 72;                          // CUM[3] — exactly at the Belt
    A.px.checkArrival();

    if (!gA._pending) fail(NAME, "game._pending missing after arrival — queue not stored on game");
    if (gA._pending.hazards.indexOf("belt") < 0)
      fail(NAME, "belt hazard not queued in game._pending.hazards: " + JSON.stringify(gA._pending));
    if (gA.waypointIndex !== 4) fail(NAME, "waypointIndex should have advanced past the Belt (the exploit's precondition)");

    // ---- the reload: serialize (what save() writes) → fresh boot → restore ----
    const blob = JSON.stringify(A.px.game);
    const B = boot();
    B.px.meta.anim = false;
    const gB = JSON.parse(blob);
    gB.ended = false;                          // resume path (game.js handle("resume")) does this
    B.px.game = gB;

    B.px.flushQueues();                        // what the travel render does after resume

    const modalB = B.window.document.getElementById("modal");
    if (modalB.classList.contains("hidden"))
      fail(NAME, "no modal after resume — the crossing was skipped by the reload (exploit lives)");
    if (!/Asteroid Belt/.test(modalB.innerHTML))
      fail(NAME, "modal is not the Belt crossing: " + modalB.textContent.slice(0, 120));
    if (B.px.game._pending.hazards.length !== 0)
      fail(NAME, "hazard presented but not dequeued");

    // ---- legacy save (pre-fix blob, no _pending): must lazily default, not throw ----
    const legacy = JSON.parse(blob);
    delete legacy._pending;
    legacy.ended = false;
    A.px.game = legacy;
    A.px.flushQueues();                        // no pending → clean no-op via pend() default
    if (!A.px.game._pending) fail(NAME, "pend() did not lazily create _pending on a legacy save");

    await settle();
    assertNoErrors(A.errors, NAME + " (instance A)");
    assertNoErrors(B.errors, NAME + " (instance B)");

    console.log("  Belt queued in-save → reload → CROSSING re-presents; legacy saves upgrade clean");
    pass(NAME);
    process.exit(0);
  } catch (e) {
    fail(NAME, (e && e.stack) || e);
  }
})();

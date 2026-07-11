"use strict";
/* station_keys.js — QoL pair: number keys press modal choices, and a closed station
 * menu is never a lockout while the ship is still docked.
 *
 * (1) MODAL DIGITS: every multi-choice modal numbers its buttons with .key-n chips and
 *     the modal key trap maps digits 1-9 to those buttons. Proven on the real station
 *     menu: a synthetic "4" keydown must fire Depart and close the modal.
 * (2) DOCKED RE-ENTRY (Tom's report: "a way to get back into the trading post if you
 *     haven't left yet but closed the window"): arriving at a station sets
 *     game._dockedAt; after Depart the travel console must offer a Return-to-station
 *     control that re-opens presentStation WITHOUT re-rolling fresh-arrival business
 *     (_stationFresh stays false — no second contraband fine, no double courier drop);
 *     the next real travel turn (resolveTurn) must clear the docked state and the
 *     control must disappear. A docked player can always get back aboard; a departed
 *     one never can.
 *
 * Seam: checkArrival, flushQueues, handle, resolveTurn, meta, game.
 */
const { boot, freshGame, assertNoErrors, pass, fail } = require("./lib/boot");

const NAME = "station_keys";

(async function () {
  try {
    const A = boot();
    const px = A.px, doc = A.window.document;
    const g = freshGame(px, "Pilot", "Settler");
    px.meta.anim = false;                      // transits resolve synchronously headless

    // ---- arrive at Lunar Gateway (waypoint 1, kind: station) via the real path ----
    g.waypointIndex = 1;
    g.distance = 16;                           // CUM[1] — exactly at the Gateway
    px.checkArrival();
    px.flushQueues();

    const modal = doc.getElementById("modal");
    if (modal.classList.contains("hidden")) fail(NAME, "station menu did not present on arrival");
    if (!/Lunar Gateway/.test(modal.innerHTML)) fail(NAME, "modal is not the Gateway: " + modal.textContent.slice(0, 100));
    if (g._dockedAt !== 1) fail(NAME, "game._dockedAt not set on station arrival (got " + g._dockedAt + ")");
    if (g._stationFresh !== false) fail(NAME, "_stationFresh should be consumed by presentStation");

    // ---- (1) the digit legend + digit dispatch ----
    const chips = modal.querySelectorAll("#modal-choices .key-n");
    if (chips.length !== 4) fail(NAME, "expected 4 numbered .key-n chips on the station menu, got " + chips.length);
    if (chips[3].textContent !== "4") fail(NAME, "4th chip should read '4', got '" + chips[3].textContent + "'");
    modal.dispatchEvent(new A.window.KeyboardEvent("keydown", { key: "4", bubbles: true }));   // 4 = Depart
    if (!modal.classList.contains("hidden")) fail(NAME, "digit '4' did not press Depart — modal still open");

    // ---- (2) still docked: the console offers the way back aboard ----
    if (g._dockedAt !== 1) fail(NAME, "Depart must NOT clear _dockedAt (the ship hasn't moved)");
    const btn = doc.querySelector("[data-action='station']");
    if (!btn) fail(NAME, "travel console lacks the Return-to-station control while docked");
    if (!/Lunar Gateway/.test(btn.textContent)) fail(NAME, "station control doesn't name the port: " + btn.textContent);

    // Re-entry must not re-roll fresh-arrival business: plant contraband heat and prove
    // no fine is taken (the _stationFresh gate, not luck — the block is skipped outright).
    g._heat = 99;
    const creditsBefore = g.credits;
    px.handle("station");
    if (modal.classList.contains("hidden")) fail(NAME, "handle('station') did not reopen the port menu");
    if (!/Lunar Gateway/.test(modal.innerHTML)) fail(NAME, "reopened modal is not the Gateway");
    if (g.credits !== creditsBefore) fail(NAME, "re-entry re-rolled the fresh-arrival fine (credits " + creditsBefore + " -> " + g.credits + ")");
    if (g._heat !== 99) fail(NAME, "re-entry consumed contraband heat — fresh-arrival business must not re-run");
    modal.dispatchEvent(new A.window.KeyboardEvent("keydown", { key: "4", bubbles: true }));   // Depart again

    // ---- the ship moves: docked state tears down ----
    px.resolveTurn();
    if (g._dockedAt !== null) fail(NAME, "resolveTurn must clear _dockedAt (got " + g._dockedAt + ")");
    // A departed player's station action must be a no-op, not a resurrection:
    px.closeModal();                            // clear any event modal the turn rolled
    px.handle("station");
    if (!modal.classList.contains("hidden"))
      fail(NAME, "handle('station') reopened a port after the ship moved");

    assertNoErrors(A, NAME);
    pass(NAME, "digits press choices (4=Depart) · docked re-entry works, skips fresh-arrival business · resolveTurn undocks");
  } catch (e) {
    fail(NAME, (e && e.stack) || String(e));
  }
})();

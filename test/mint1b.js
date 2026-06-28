"use strict";
/* mint1b.js — guards the M-INT1b parallel-fronts legibility layer (game.js:4465), which is
 * "presentation only" and must stay so.
 *
 *  (A) READ-ONLY digest: captureDigest (game.js:4480) may write ONLY the transient
 *      game._offlog / game._offsnap buffers, never front state. Snapshot game.colony and
 *      game.voyage, run a non-trivial capture of each front, and assert both are byte-identical.
 *  (B) ONE CANONICAL CLOCK [3a]: both HUDs' "Years since exodus" must equal exodusYears()
 *      (game.js:26). Render the colony HUD (4527) and the voyage HUD (4596) and assert the
 *      value beside that label, on each, equals exodusYears().
 *
 * Seam: game.js:4874 (newGame, beginColony, startVoyage, renderColony, renderVoyage,
 *                      captureDigest, exodusYears, game).
 */
const { boot, freshGame, settle, appHTML, assertNoErrors, pass, fail } = require("./lib/boot");

const NAME = "mint1b";

// Pull the value rendered immediately after the "Years since exodus" label. Quote-agnostic:
// jsdom re-serializes innerHTML with double quotes, so we match the value span by shape, not
// by its exact class attribute (colony emits `val `, voyage `val`).
function clockInHud(html) {
  const m = html.match(/Years since exodus<\/span>\s*<span[^>]*>\s*(\d+)\s*</);
  return m ? parseInt(m[1], 10) : null;
}

(async function () {
  try {
    const { window, px, errors } = boot();
    const g = freshGame(px);

    g.dest = { habit: 50, habitResult: "marginal", knowledge: 0, inhabited: null, overtaken: false };
    g.shipYears = 12;
    px.beginColony(false);

    const arkCrew = g.crew.slice(0, 2).map(function (c) { return c; });
    px.startVoyage(arkCrew, { fuel: 60, oxygen: 40, food: 40, medicine: 2 }, true, true);

    // ---- (A) read-only digest ----
    const colBefore = JSON.stringify(g.colony);
    const voyBefore = JSON.stringify(g.voyage);
    px.captureDigest("colony", 0);    // capture all existing log into _offlog — non-trivial
    px.captureDigest("ship", 0);
    if (JSON.stringify(g.colony) !== colBefore) fail(NAME, "captureDigest mutated game.colony — off-front is NOT read-only");
    if (JSON.stringify(g.voyage) !== voyBefore) fail(NAME, "captureDigest mutated game.voyage — off-front is NOT read-only");

    // ---- (B) one canonical clock ----
    const E = px.exodusYears();

    px.renderColony();
    const colClock = clockInHud(appHTML(window));
    if (colClock === null) fail(NAME, "colony HUD did not render a 'Years since exodus' stat");
    if (colClock !== E) fail(NAME, "colony HUD clock " + colClock + " != exodusYears() " + E);

    px.renderVoyage();
    const voyClock = clockInHud(appHTML(window));
    if (voyClock === null) fail(NAME, "voyage HUD did not render a 'Years since exodus' stat");
    if (voyClock !== E) fail(NAME, "voyage HUD clock " + voyClock + " != exodusYears() " + E);

    await settle();
    assertNoErrors(errors, NAME);

    console.log("  digest read-only (colony+ark byte-identical); one clock = exodusYears() = " + E + " on both HUDs");
    pass(NAME);
    process.exit(0);
  } catch (e) {
    fail(NAME, (e && e.stack) || e);
  }
})();

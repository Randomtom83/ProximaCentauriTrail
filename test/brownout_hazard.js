"use strict";
/* brownout_hazard.js — force a power brownout + a hazard on the homeward ark, assert the run
 * stays coherent under stress and then ends coherently, with the error trap silent throughout.
 *
 * Brownout is real: voyPower (game.js:2440) reports brownout when demand > output, and output
 * scales with hull — so a near-wrecked hull drives a genuine brownout. renderVoyage (4596) makes
 * it legible (red reactor + ⚠, setAlert). Phase 1 forces the brownout and a hull hazard and
 * asserts the HUD renders it coherently (no silent death). Phase 2 drives the front to a real
 * terminal and asserts the end screen rendered.
 *
 * Seam: game.js:4874 (newGame, beginColony, startVoyage, renderVoyage, colonyAfterTurn, game).
 */
const { boot, freshGame, settle, appHTML, assertNoErrors, assertEndRendered, pass, fail } = require("./lib/boot");

const NAME = "brownout_hazard";

(async function () {
  try {
    const { window, px, errors } = boot();
    const g = freshGame(px);

    g.dest = { habit: 50, habitResult: "marginal", knowledge: 0, inhabited: null, overtaken: false };
    g.shipYears = 8;
    px.beginColony(false);

    const arkCrew = g.crew.slice(0, 3).map(function (c) { return c; });
    px.startVoyage(arkCrew, { fuel: 50, oxygen: 35, food: 35, medicine: 2 }, true, true);

    // ---- Phase 1: force a brownout (gutted hull → output < demand) + a hazard, render it ----
    g.voyage.ship.hull = 1;                       // a hazard blow: hull all but gone → real brownout
    const pw = px.exodusYears;                     // (touch a seam fn to keep the link honest)
    px.renderVoyage();
    const hud = appHTML(window);
    if (!/⚠/.test(hud)) fail(NAME, "brownout warning (⚠) not rendered on the voyage HUD — power stress not legible");
    if (g.ended) fail(NAME, "the run died silently just from rendering a brownout HUD");
    if (g.voyage.active !== true) fail(NAME, "ark should still be flying after a survivable brownout render");

    // ---- Phase 2: the hazard proves fatal — drive to a real, coherent terminal ----
    g.voyage.crew.forEach(function (c) { c.status = "Dead"; });
    g.colony.meters.hope = 0;
    px.colonyAfterTurn(false);                    // real voyageTurn(true) runs UNDER the brownout branch (2455)

    if (!g.voyageDone) fail(NAME, "voyage never terminated after the hazard");
    const end = assertEndRendered(window, false);

    await settle();
    assertNoErrors(errors, NAME);

    console.log("  brownout legible (⚠), survived the render, then ended coherently → " + g.outcomeTier + " · " + end.heading);
    pass(NAME);
    process.exit(0);
  } catch (e) {
    fail(NAME, (e && e.stack) || e);
  }
})();

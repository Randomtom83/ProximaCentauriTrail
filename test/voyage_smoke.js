"use strict";
/* voyage_smoke.js — Act II homeward ark driven to a real terminal voyage state.
 *
 * A flying ark + a holding colony (the real parallel-front setup). Driving the colony turn
 * auto-advances the ship through the REAL homeward tick:
 *   colonyAfterTurn (1977) → voyageTurn(true) (2447) → finishVoyage (2722) → tryCompose → composeEnding.
 * The ark is lost on the crossing (crew gone) so voyageTurn takes its documented
 * LOST WITH ALL HANDS branch (game.js:2479); the colony also gives out the same tick, so the
 * run reaches a coherent terminal end. Asserts the ark's terminal + a real end screen, trap silent.
 *
 * Seam: game.js:4874 (newGame, beginColony, startVoyage, colonyAfterTurn, alive, game).
 */
const { boot, freshGame, settle, assertNoErrors, assertEndRendered, pass, fail } = require("./lib/boot");

const NAME = "voyage_smoke";

(async function () {
  try {
    const { window, px, errors } = boot();
    const g = freshGame(px);

    g.dest = { habit: 50, habitResult: "marginal", knowledge: 0, inhabited: null, overtaken: false };
    g.shipYears = 6;
    px.beginColony(false);

    // Launch a flying ark (fly=true) crewed by a couple of hands drawn from the colony.
    const arkCrew = g.crew.slice(0, 2).map(function (c) { return c; });
    px.startVoyage(arkCrew, { fuel: 60, oxygen: 40, food: 40, medicine: 2 }, true, true);
    if (!g.voyage || !g.voyage.active) fail(NAME, "startVoyage did not create an active voyage");
    if (g.voyage._flying === false) fail(NAME, "ark should be flying (fly=true)");

    // The hazard of the long dark: the ark is lost — every hand aboard is gone.
    g.voyage.crew.forEach(function (c) { c.status = "Dead"; });
    if (px.alive(g.voyage.crew).length !== 0) fail(NAME, "ark crew should all be dead before the tick");

    // Collapse the colony the same season so BOTH fronts resolve → the finale composes.
    g.colony.meters.hope = 0;

    px.colonyAfterTurn(false);   // real endColonyCheck + real voyageTurn(true) auto-advance

    if (!g.voyageDone) fail(NAME, "voyage front never reached a terminal state");
    if (g.voyageDone.tier !== "LOST WITH ALL HANDS") fail(NAME, "ark terminal tier was '" + g.voyageDone.tier + "', expected LOST WITH ALL HANDS");
    const end = assertEndRendered(window, false);

    await settle();
    assertNoErrors(errors, NAME);

    console.log("  ark lost on the crossing → voyageDone=" + g.voyageDone.tier + "; finale " + g.outcomeTier + " · " + end.heading);
    pass(NAME);
    process.exit(0);
  } catch (e) {
    fail(NAME, (e && e.stack) || e);
  }
})();

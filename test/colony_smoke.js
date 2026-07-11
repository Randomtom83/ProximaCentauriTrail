"use strict";
/* colony_smoke.js — Act II colony front driven to a real terminal colony state.
 *
 * Builds the colony through the real constructor (beginColony, game.js:1442), then drives
 * it to a genuine collapse through the real lose-check pipeline:
 *   colonyAfterTurn (1977) → endColonyCheck (2301) → finishColony (2293) → tryCompose (2836)
 *   → composeEnding (2844) → endGame → renderEnd.
 * No front state is hand-set except the hope meter that triggers the documented WITHERED loss.
 * Asserts a real loss screen rendered and the error trap stayed silent.
 *
 * Seam: game.js:4874 (newGame, beginColony, colonyAfterTurn, game).
 */
const { boot, freshGame, settle, assertNoErrors, assertEndRendered, pass, fail } = require("./lib/boot");

const NAME = "colony_smoke";

(async function () {
  try {
    const { window, px, errors } = boot();
    const g = freshGame(px);

    // Minimal valid destination so beginColony builds a clean colony (no natives).
    g.dest = { habit: 50, habitResult: "marginal", knowledge: 0, inhabited: null, overtaken: false };
    g.shipYears = 4;

    px.beginColony(false);
    if (!g.colony) fail(NAME, "beginColony did not create game.colony");
    if (g.screen !== "colony") fail(NAME, "expected colony screen after beginColony, got " + g.screen);
    if (g.voyage) fail(NAME, "no ship was launched — game.voyage should be absent for a colony-only end");

    // Drive to the documented WITHERED collapse: hope runs out (endColonyCheck, game.js:2305).
    g.colony.meters.hope = 0;
    px.colonyAfterTurn(false);

    const end = assertEndRendered(window, false);   // a real loss screen must have rendered
    if (!g.colonyDone || g.colonyDone.won !== false) fail(NAME, "colony did not finish as a loss");

    await settle();
    assertNoErrors(errors, NAME);

    console.log("  colony collapsed → " + g.outcomeTier + " · heading: " + end.heading);
    pass(NAME);
    process.exit(0);
  } catch (e) {
    fail(NAME, (e && e.stack) || e);
  }
})();

"use strict";
/* win_path.js — drive the game to a WIN and assert the win screen + a rank string rendered.
 *
 * Seeds both fronts as won (the exact {won,tier,cause} finishColony/finishVoyage emit) and runs
 * the REAL finale (composeEnding → endGame → renderEnd, game.js:2844/2872/4653). endGame computes
 * the score and rank for real; renderEnd paints the win heading and the rank badge. Asserts the
 * cyan ✦ win heading AND a non-empty rank string in the rank-badge.
 *
 * Seam: game.js:4874 (newGame, composeEnding, game).
 */
const { boot, freshGame, settle, appHTML, assertNoErrors, assertEndRendered, pass, fail } = require("./lib/boot");

const NAME = "win_path";

(async function () {
  try {
    const { window, px, errors } = boot();
    const g = freshGame(px);

    // A clean two-world victory: colony settled AND ship home.
    g.colonyDone = { won: true, tier: "SETTLED", cause: "The colony takes root." };
    g.voyageDone = { won: true, tier: "ARRIVED", cause: "The ship reaches home with the news." };
    g.colony = { beaconHeard: false };

    px.composeEnding();

    const end = assertEndRendered(window, true);   // must be a WIN screen
    if (g.outcomeTier !== "TWO WORLDS") fail(NAME, "expected TWO WORLDS win tier, got '" + g.outcomeTier + "'");

    const badge = window.document.querySelector("#app .rank-badge");
    if (!badge) fail(NAME, "no rank badge element on the win screen");
    const rank = (badge.textContent || "").trim();
    if (!rank) fail(NAME, "rank string is empty on the win screen");
    if (!/rank-badge/.test(appHTML(window))) fail(NAME, "rank badge missing from #app");

    await settle();
    assertNoErrors(errors, NAME);

    console.log("  WIN rendered → " + end.heading + " · rank: " + rank);
    pass(NAME);
    process.exit(0);
  } catch (e) {
    fail(NAME, (e && e.stack) || e);
  }
})();

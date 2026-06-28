"use strict";
/* loss_path.js — drive the game to a LOSS and assert the loss screen rendered.
 *
 * A voyage-only catastrophe: the ark is lost with all hands and no colony was founded, so the
 * finale takes composeEnding's voyage-only branch (game.js:2868) → endGame → renderEnd. Asserts
 * the red ✖ loss heading and that the run's cause text actually rendered (not a blank end).
 *
 * Seam: game.js:4874 (newGame, composeEnding, game).
 */
const { boot, freshGame, settle, appHTML, assertNoErrors, assertEndRendered, pass, fail } = require("./lib/boot");

const NAME = "loss_path";
const CAUSE = "Somewhere on the long road home, the last of them stops answering.";

(async function () {
  try {
    const { window, px, errors } = boot();
    const g = freshGame(px);

    // No colony launched; the ship is lost → a clean loss.
    g.colony = null;
    g.colonyDone = undefined;
    g.voyageDone = { won: false, tier: "LOST WITH ALL HANDS", cause: CAUSE };

    px.composeEnding();

    const end = assertEndRendered(window, false);   // must be a LOSS screen
    if (g.outcomeTier !== "LOST WITH ALL HANDS") fail(NAME, "expected LOST WITH ALL HANDS, got '" + g.outcomeTier + "'");
    if (g.won !== false) fail(NAME, "game.won should be false on a loss");
    if (appHTML(window).indexOf(CAUSE) < 0) fail(NAME, "the loss cause text did not render on the end screen");

    await settle();
    assertNoErrors(errors, NAME);

    console.log("  LOSS rendered → " + end.heading + " · cause text present");
    pass(NAME);
    process.exit(0);
  } catch (e) {
    fail(NAME, (e && e.stack) || e);
  }
})();

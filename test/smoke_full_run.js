"use strict";
/* smoke_full_run.js — broadest boot check: the whole game boots headless through the real seam,
 * reaches a coherent first screen, and can be driven all the way to a real terminal end — with
 * the global error trap silent across the entire run.
 *
 * Phase 1: the real boot IIFE ran on load (renderTitle + updateTopbar, game.js:4886) — assert the
 *          title screen actually painted into #app and nothing tripped the trap during boot.
 * Phase 2: start a fresh run and drive it end-to-end through the real machinery
 *          (newGame → beginColony → colonyAfterTurn collapse → finale) to a terminal end screen.
 *
 * Seam: game.js:4874 (newGame, beginColony, colonyAfterTurn, game).
 */
const { boot, freshGame, settle, appHTML, assertNoErrors, assertEndRendered, pass, fail } = require("./lib/boot");

const NAME = "smoke_full_run";

(async function () {
  try {
    const { window, px, errors } = boot();

    // ---- Phase 1: clean boot to a real first screen ----
    const booted = appHTML(window);
    if (!booted || !booted.trim()) fail(NAME, "#app is empty after boot — the game never rendered a screen");
    assertNoErrors(errors, NAME + " (boot)");   // boot itself must not have died silently

    // ---- Phase 2: drive a fresh run to a real terminal ----
    const g = freshGame(px);
    g.dest = { habit: 50, habitResult: "verdant", knowledge: 0, inhabited: null, overtaken: false };
    g.shipYears = 2;
    px.beginColony(false);
    if (g.screen !== "colony") fail(NAME, "expected colony screen, got " + g.screen);

    g.colony.meters.hope = 0;     // the colony loses heart → real WITHERED collapse
    px.colonyAfterTurn(false);

    const end = assertEndRendered(window);   // a real terminal screen (win or loss) must have rendered
    if (!g.ended) fail(NAME, "run never reached a terminal state");

    await settle();
    assertNoErrors(errors, NAME);

    console.log("  booted clean, drove a full run to terminal → " + g.outcomeTier + " · " + end.heading);
    pass(NAME);
    process.exit(0);
  } catch (e) {
    fail(NAME, (e && e.stack) || e);
  }
})();

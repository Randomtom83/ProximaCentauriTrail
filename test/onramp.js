"use strict";
/* onramp.js — run-1 legibility: the game may kill you, it may never confuse you.
 *
 * Drives a REAL Act-I death through the real dispatch (handle("continue") →
 * onContinue → resolveTurn) with empty tanks and a weak crew, then asserts the
 * whole on-ramp loop closed:
 *   1. RECORDER: the flight-recorder chain recorded the causal facts as they
 *      happened (an O₂ fact, a named death) — written by the engine, not seeded.
 *   2. POST-MORTEM: the loss screen renders "Flight recorder — how this crew died"
 *      + "What you never found" (accusations for untouched systems) + the act marker.
 *   3. META: the run record carries chain/firsts; tiersSeen + bestByDiff updated.
 *   4. GALLERY: the logbook shows the endings census with locked silhouettes and
 *      the rank ladder.
 *   5. HONESTY: How-to teaches the arithmetic; the title telegraphs three acts.
 * All display/recording only — no odds are asserted because none changed.
 *
 * Seam: handle, checkArrival/meta (pending seam), newGame, game.
 */
const { boot, freshGame, settle, appHTML, assertNoErrors, assertEndRendered, pass, fail } = require("./lib/boot");

const NAME = "onramp";

(async function () {
  try {
    const { window, px, errors } = boot();
    const g = freshGame(px, "Pilot", "Settler");
    px.meta.anim = false;
    g.screen = "travel";

    if (!Array.isArray(g.chain) || typeof g.firsts !== "object")
      fail(NAME, "newGame lacks the recorder substrate (chain/firsts)");

    // A doomed ship: no air, no food, a crew already at the edge. The engine itself
    // must write the story of what happens next.
    g.supplies.oxygen = 0; g.supplies.food = 0;
    g.crew.forEach(function (c) { c.health = 5; });

    let spins = 0;
    while (!px.game.ended && spins++ < 8) px.handle("continue");
    if (!px.game.ended) fail(NAME, "the doomed ship refused to die in " + spins + " turns");

    // ---- 1. the chain wrote itself ----
    const chain = px.game.chain || [];
    const facts = chain.map(function (e) { return e.f; }).join(" | ");
    if (!/O₂ depleted/.test(facts)) fail(NAME, "no anoxia fact in the chain: " + facts);
    if (!/\(.*\)/.test(facts)) fail(NAME, "chain facts lack a named cause: " + facts);
    const deadName = g.crew[0].name;
    if (!new RegExp(deadName).test(facts)) fail(NAME, "no named death in the chain: " + facts);

    // ---- 2. the post-mortem rendered ----
    assertEndRendered(window, false);
    const end = appHTML(window);
    if (!/Flight recorder — how this crew died/.test(end)) fail(NAME, "no flight-recorder panel on the loss screen");
    if (!/What you never found/.test(end)) fail(NAME, "no never-found panel on the loss screen");
    if (!/Act I of III/.test(end)) fail(NAME, "no act marker — the scope reveal is missing");
    if (!/power board/.test(end)) fail(NAME, "no accusation for the untouched power board");
    if (!/Final analysis/.test(end)) fail(NAME, "ATLAS never closed the record");

    // ---- 3. meta carries the lesson ----
    const meta = px.meta;
    const run = meta.runs[0];
    if (!run.chain || !run.chain.length) fail(NAME, "run record has no chain — post-mortems not revisitable");
    if (!Array.isArray(run.firsts)) fail(NAME, "run record has no firsts");
    if (!meta.tiersSeen || !Object.keys(meta.tiersSeen).length) fail(NAME, "tiersSeen not updated");
    if (!meta.bestByDiff || !meta.bestByDiff.Settler) fail(NAME, "bestByDiff not updated");

    // ---- 4. the gallery is a chase ----
    px.handle("logbook");
    const modal = window.document.getElementById("modal").innerHTML;
    if (!/Endings — \d+ of \d+/.test(modal)) fail(NAME, "no endings census in the logbook");
    if (!/◼/.test(modal)) fail(NAME, "no locked silhouettes — unseen endings are not teased");
    if (!/The ladder/.test(modal)) fail(NAME, "no rank ladder in the logbook");
    if (!/day 400/.test(modal)) fail(NAME, "the speed-bonus truth is still hidden");
    px.handle("backTitle");

    // ---- 5. honesty surfaces ----
    const title = appHTML(window);
    if (!/three acts/.test(title)) fail(NAME, "title does not telegraph the three-act scope");
    px.handle("howto");
    const howto = window.document.getElementById("modal").innerHTML;
    if (!/The arithmetic/.test(howto)) fail(NAME, "How-to no longer teaches the arithmetic chain");
    if (!/freeze your friends/i.test(howto)) fail(NAME, "How-to lost the long-dark provisioning truth");

    await settle();
    assertNoErrors(errors, NAME);

    console.log("  real suffocation death → chain (" + chain.length + " facts) → post-mortem + accusations + gallery + honest onboarding");
    pass(NAME);
    process.exit(0);
  } catch (e) {
    fail(NAME, (e && e.stack) || e);
  }
})();

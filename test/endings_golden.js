"use strict";
/* endings_golden.js — the golden lock for the UNFROZEN composeEnding (game.js:2844).
 *
 * composeEnding is golden-locked, not md5-frozen (M-INT1 unfroze it). This harness pins
 * the {won, tier} it produces for every reachable ending branch: the two-world matrix,
 * colony-only, and voyage-only. If composeEnding's branch logic drifts, a tier/won here
 * changes and the harness goes red. Each case is driven through the REAL finale pipeline
 * (composeEnding → endGame → renderApp → renderEnd) and asserts the end screen rendered.
 *
 * Vacuous-golden guard: if zero endings were checked, FAIL.
 *
 * Drives the live seam at game.js:4874 (window.__proxima: newGame, composeEnding, game).
 */
const { boot, freshGame, settle, assertNoErrors, assertEndRendered, pass, fail } = require("./lib/boot");

const NAME = "endings_golden";

// Each case seeds game.colonyDone (c) / game.voyageDone (v) — the exact {won,tier,cause}
// shape finishColony/finishVoyage emit (game.js:2293/2722) — plus beaconHeard, then runs
// composeEnding and pins the resulting {won, tier}.
const CASES = [
  // ---- both fronts resolved (c && v) ----
  { name: "two-worlds",          c: { won: true,  tier: "SETTLED" },  v: { won: true,  tier: "ARRIVED" },            beacon: false, won: true,  tier: "TWO WORLDS" },
  { name: "world-and-empty-sky", c: { won: true,  tier: "SETTLED" },  v: { won: false, tier: "TOO LATE" },           beacon: false, won: true,  tier: "A WORLD, AND AN EMPTY SKY" },
  { name: "world-silent-shore",  c: { won: true,  tier: "SETTLED" },  v: { won: false, tier: "A SILENT SHORE" },     beacon: false, won: true,  tier: "A WORLD, AND A SILENT SHORE" },
  { name: "world-and-word",      c: { won: true,  tier: "SETTLED" },  v: { won: false, tier: "LOST WITH ALL HANDS" }, beacon: true,  won: true,  tier: "A WORLD, AND WORD" },
  { name: "world-at-least",      c: { won: true,  tier: "SETTLED" },  v: { won: false, tier: "LOST WITH ALL HANDS" }, beacon: false, won: true,  tier: "A WORLD, AT LEAST" },
  { name: "the-messenger",       c: { won: false, tier: "WITHERED" }, v: { won: true,  tier: "ARRIVED" },            beacon: false, won: true,  tier: "THE MESSENGER" },
  { name: "word-got-through",    c: { won: false, tier: "WITHERED" }, v: { won: false, tier: "LOST WITH ALL HANDS" }, beacon: true,  won: true,  tier: "THE WORD GOT THROUGH" },
  { name: "extinct",             c: { won: false, tier: "WITHERED" }, v: { won: false, tier: "LOST WITH ALL HANDS" }, beacon: false, won: false, tier: "EXTINCT" },
  // ---- colony-only (no ship launched: v == null) ----
  { name: "colony-only-settled", c: { won: true,  tier: "SETTLED" },  v: null, beacon: false, won: true,  tier: "SETTLED" },
  { name: "colony-only-word",    c: { won: false, tier: "WITHERED" }, v: null, beacon: true,  won: true,  tier: "THE WORD GOT THROUGH" },
  { name: "colony-only-withered",c: { won: false, tier: "WITHERED" }, v: null, beacon: false, won: false, tier: "WITHERED" },
  // ---- voyage-only (no colony: c == null) ----
  { name: "voyage-only-arrived", c: null, v: { won: true,  tier: "HOME AT LAST" },        beacon: false, won: true,  tier: "HOME AT LAST" },
  { name: "voyage-only-lost",    c: null, v: { won: false, tier: "LOST WITH ALL HANDS" }, beacon: false, won: false, tier: "LOST WITH ALL HANDS" },
];

(async function () {
  try {
    const { window, px, errors } = boot();
    let checked = 0;
    const snapshot = [];

    for (const t of CASES) {
      const g = freshGame(px);                       // fresh, ended=false, fronts cleared
      if (t.c) g.colonyDone = { won: t.c.won, tier: t.c.tier, cause: "[" + t.name + " colony cause]" };
      if (t.v) g.voyageDone = { won: t.v.won, tier: t.v.tier, cause: "[" + t.name + " voyage cause]" };
      // composeEnding reads game.colony && game.colony.beaconHeard; minimal stub is enough
      // (computeScore/renderEnd never touch game.colony — verified game.js:1181/4653).
      g.colony = t.beacon ? { beaconHeard: true } : (t.c ? { beaconHeard: false } : null);

      px.composeEnding();

      const got = { won: g.won, tier: g.outcomeTier };
      if (got.won !== t.won) fail(NAME, t.name + " — won mismatch: expected " + t.won + ", got " + got.won);
      if (got.tier !== t.tier) fail(NAME, t.name + " — tier mismatch: expected '" + t.tier + "', got '" + got.tier + "'");
      // Real terminal render must have happened (no silent compose).
      assertEndRendered(window, t.won);
      snapshot.push(t.name + " => " + (got.won ? "WIN" : "LOSS") + " · " + got.tier);
      checked++;
    }

    await settle();
    assertNoErrors(errors, NAME);

    // Vacuous-golden guard: zero coverage is a FAIL, not a pass.
    if (checked === 0) fail(NAME, "no endings were checked — vacuous golden");
    if (checked !== CASES.length) fail(NAME, "only " + checked + "/" + CASES.length + " endings checked");

    console.log("  golden coverage (" + checked + " endings):");
    snapshot.forEach(function (s) { console.log("    " + s); });
    pass(NAME + " (" + checked + " endings pinned)");
    process.exit(0);
  } catch (e) {
    fail(NAME, (e && e.stack) || e);
  }
})();

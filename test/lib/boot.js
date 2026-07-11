"use strict";
/* test/lib/boot.js — shared headless boot for Proxima Trail harnesses.
 *
 * NOT a harness: it lives in test/lib/, so scripts/verify.sh's non-recursive
 * `ls test/*.js` glob does not pick it up (it is not counted toward MIN_TESTS,
 * and node never runs it standalone). Harnesses `require("./lib/boot")`.
 *
 * Boots audio.js + game.js inside jsdom with the LIVE test seam ON
 * (game.js:4874 — `if (window.__PROXIMA_TEST__) window.__proxima = {…}`),
 * installs a global error trap BEFORE any game code runs, and asserts the seam
 * attached. The trap is the no-silent-death backbone: any window.onerror,
 * 'error'/'unhandledrejection' event, or process uncaught/unhandled is recorded
 * and turns the harness red — a swallowed exception is a FAILED test, not a pass.
 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..", "..");
const NAMES5 = ["Vega", "Orsk", "Lin", "Mara", "Cole"];   // one per ROLE_ORDER slot (game.js:90/131)

function boot() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const errors = [];

  // outside-only: jsdom does NOT auto-run the page's <script src> tags, so we
  // control load order and flip the seam flag before game.js evaluates.
  const dom = new JSDOM(html, {
    runScripts: "outside-only",
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const { window } = dom;

  // ---- global error trap (installed FIRST, before any game code) ----
  window.onerror = function (msg, src, line, col, err) {
    errors.push("window.onerror: " + ((err && err.stack) || msg));
    return false;
  };
  window.addEventListener("error", function (e) {
    if (e && e.error) errors.push("error event: " + (e.error.stack || e.message));
  });
  window.addEventListener("unhandledrejection", function (e) {
    errors.push("unhandledrejection: " + ((e.reason && e.reason.stack) || e.reason));
  });
  const onUncaught = function (e) { errors.push("uncaughtException: " + ((e && e.stack) || e)); };
  const onUnhandled = function (e) { errors.push("unhandledRejection: " + ((e && e.stack) || e)); };
  process.on("uncaughtException", onUncaught);
  process.on("unhandledRejection", onUnhandled);

  // ---- opt into the seam, then load production scripts in document order ----
  window.__PROXIMA_TEST__ = true;
  try {
    // audio.js is safe headless: no AudioContext in jsdom → init() bails and
    // every note()/play() is a guarded no-op (audio.js) ; game.js guards window.Sound.
    window.eval(fs.readFileSync(path.join(ROOT, "audio.js"), "utf8"));
    window.eval(fs.readFileSync(path.join(ROOT, "game.js"), "utf8"));
  } catch (e) {
    errors.push("boot eval threw: " + (e.stack || e));
  }

  const px = window.__proxima;
  if (!px) {
    throw new Error("test seam did not attach (window.__proxima missing) — seam broken at game.js:4874");
  }
  return { dom, window, px, errors, NAMES5 };
}

// Fresh, fully-formed run state via the real constructor; resets ended/fronts so
// composeEnding() will fire again (it early-returns when game.ended).
function freshGame(px, role, diff) {
  const g = px.newGame(role || "Pilot", diff || "Pioneer", NAMES5);
  g.ended = false;
  g.colonyDone = undefined;
  g.voyageDone = undefined;
  px.game = g;
  return g;
}

// Let any queued microtask/timer rejection surface into the trap before we assert.
function settle() { return new Promise(function (r) { setTimeout(r, 0); }); }

function appHTML(window) { return window.document.getElementById("app").innerHTML; }

// FAIL LOUD: throw if the error trap caught anything.
function assertNoErrors(errors, name) {
  if (errors.length) {
    throw new Error("silent-death trap fired during " + name + ":\n  " + errors.join("\n  "));
  }
}

// Assert the real terminal end screen actually rendered into #app (not "it didn't throw").
// renderEnd (game.js:4653) writes <h2 class='cyan'>✦ TIER ✦</h2> on a win, red ✖ on a loss.
function assertEndRendered(window, expectWon) {
  const g = window.__proxima.game;
  if (!g.ended) throw new Error("game.ended is false — no terminal state reached");
  if (g.screen !== "end") throw new Error("game.screen is '" + g.screen + "', expected 'end'");
  const html = appHTML(window);
  const h2 = window.document.querySelector("#app h2");
  if (!h2) throw new Error("no end-screen heading rendered in #app");
  const won = /✦/.test(h2.textContent) && /cyan/.test(h2.className);
  const lost = /✖/.test(h2.textContent) && /red/.test(h2.className);
  if (!won && !lost) throw new Error("end heading is neither a win nor a loss: " + h2.outerHTML);
  if (expectWon === true && !won) throw new Error("expected a WIN screen, got: " + h2.textContent);
  if (expectWon === false && !lost) throw new Error("expected a LOSS screen, got: " + h2.textContent);
  if (!/rank-badge/.test(html)) throw new Error("no rank badge rendered on the end screen");
  return { heading: h2.textContent.trim(), won: won };
}

function pass(name) { console.log("PASS " + name); }
function fail(name, reason) { console.error("FAIL " + name + ": " + reason); process.exit(1); }

module.exports = {
  boot, freshGame, settle, appHTML, assertNoErrors, assertEndRendered, pass, fail, ROOT, NAMES5,
};

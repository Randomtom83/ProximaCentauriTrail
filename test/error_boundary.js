"use strict";
/* error_boundary.js — a bug may cost a moment, never a run (audit S1-2 + S2-1).
 *
 * Proves three hardening claims on the REAL dispatch path:
 *   1. BOUNDARY: an exception thrown inside a user action is caught by handle()'s
 *      boundary — it does not escape to window.onerror (the run doesn't freeze),
 *      the fault is logged in-fiction, and the run state is preserved to storage.
 *   2. HONEST AUTOSAVE: when localStorage writes fail (quota), save() warns the
 *      player in the log — a permadeath game must never silently stop saving.
 *   3. RECOVERY: storage coming back re-arms the save (a later save() writes again).
 *
 * Note the trap inversion: the shared boot() trap treats any escaped error as a
 * FAIL — so this harness passing means the boundary caught the fault BEFORE the
 * trap saw it. That is the entire point.
 *
 * Seam: handle, save (error-boundary seam), newGame, game, meta.
 */
const { boot, freshGame, settle, assertNoErrors, pass, fail } = require("./lib/boot");

const NAME = "error_boundary";
const SAVE_KEY = "proxima-trail-save-v7";

(async function () {
  try {
    const { window, px, errors } = boot();
    const g = freshGame(px, "Pilot", "Settler");
    px.meta.anim = false;
    g.screen = "travel";

    // ---- 2. HONEST AUTOSAVE: make storage fail, then save ----
    const SP = Object.getPrototypeOf(window.localStorage);
    const origSet = SP.setItem;
    SP.setItem = function (k) {
      if (k === SAVE_KEY) { const e = new Error("quota"); e.name = "QuotaExceededError"; throw e; }
      return origSet.apply(this, arguments);
    };
    px.save();
    const logMsgs = function () { return px.game.log.map(function (l) { return l.msg; }).join("\n"); };
    if (!/AUTOSAVE FAILED/.test(logMsgs()))
      fail(NAME, "save() failed silently — no AUTOSAVE FAILED warning in the log");
    const warnCount1 = (logMsgs().match(/AUTOSAVE FAILED/g) || []).length;
    px.save();  // second failure must NOT spam a second warning
    const warnCount2 = (logMsgs().match(/AUTOSAVE FAILED/g) || []).length;
    if (warnCount2 !== warnCount1) fail(NAME, "AUTOSAVE FAILED warning repeated on consecutive failures");

    // ---- 1. BOUNDARY: break the state so a real action throws ----
    g.crew = null;                      // resolveTurn will die reading the crew
    px.handle("continue");              // must NOT propagate / freeze
    if (!/SYSTEM FAULT/.test(logMsgs()))
      fail(NAME, "boundary did not log the fault: no SYSTEM FAULT line");
    const app = window.document.getElementById("app").innerHTML;
    if (!app || app.length < 40)
      fail(NAME, "app went blank after the fault — recovery rendered nothing");

    // ---- 3. RECOVERY: storage returns; a later save writes for real ----
    SP.setItem = origSet;
    px.game = freshGame(px, "Pilot", "Settler"); // clean state again
    px.game.screen = "travel";
    px.save();
    const blob = window.localStorage.getItem(SAVE_KEY);
    if (!blob) fail(NAME, "save() did not write after storage recovered");
    const slim = JSON.parse(blob);
    if (slim.log.length > 80) fail(NAME, "saved blob log not slimmed (" + slim.log.length + " entries > 80)");

    await settle();
    assertNoErrors(errors, NAME);       // the boundary must have eaten the fault

    console.log("  fault caught in-dispatch, logged, app alive; quota warned once; save recovered + slim");
    pass(NAME);
    process.exit(0);
  } catch (e) {
    fail(NAME, (e && e.stack) || e);
  }
})();

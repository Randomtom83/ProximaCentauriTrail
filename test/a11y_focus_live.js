"use strict";
/* a11y_focus_live.js — accessibility bundle (S2-3 + U3-4 + S4-2):
 *   (1) modal focus trap — focus enters the dialog on open, Tab/Shift-Tab wrap within it,
 *       and focus is restored to the prior trigger on close;
 *   (2) scoped aria-live — the whole #app no longer announces; only the small #sr-live
 *       region carries aria-live, and log() routes the newest message into it.
 *
 * Boots index.html + game.js headless in jsdom via the window.__PROXIMA_TEST__ seam
 * (reuses test/lib/boot.js + its global error trap). Exits nonzero on any failed
 * assertion or trapped error. Drives openModal/closeModal/log through the seam.
 */
const { boot, freshGame, settle, assertNoErrors, pass, fail } = require("./lib/boot");

const NAME = "a11y_focus_live";

(async function () {
  try {
    const { window, px, errors } = boot();
    const doc = window.document;

    // ---- (2a) scoped aria-live: #app is NOT a live region; #sr-live IS ----
    const app = doc.getElementById("app");
    if (app.hasAttribute("aria-live")) fail(NAME, "#app still carries aria-live — the whole screen would re-announce");
    const live = doc.getElementById("sr-live");
    if (!live) fail(NAME, "#sr-live announcer region is missing");
    if (live.getAttribute("aria-live") !== "polite") fail(NAME, "#sr-live is not aria-live=polite");

    // ---- (2b) only the newest log line is announced ----
    freshGame(px);                                  // game must exist for log()
    px.log("Klaxons sing in the dark.", "bad");
    if ((live.textContent || "").indexOf("Klaxons") < 0) fail(NAME, "log() did not announce the newest line into #sr-live");

    // ---- (1a) focus enters the dialog on open ----
    const trigger = doc.createElement("button");
    trigger.textContent = "open";
    doc.body.appendChild(trigger);
    trigger.focus();
    if (doc.activeElement !== trigger) fail(NAME, "trigger button is not focused before opening the modal");

    px.openModal({ title: "T", body: "B", choices: [{ label: "Alpha", onClick: function () {} }, { label: "Beta", onClick: function () {} }] });
    const modal = doc.getElementById("modal");
    if (!modal.contains(doc.activeElement)) fail(NAME, "focus did not move INTO the dialog on open");

    const f = modal.querySelectorAll("button:not([disabled])");
    if (f.length < 2) fail(NAME, "expected >=2 focusable buttons in the modal, got " + f.length);

    // ---- (1b) Tab/Shift-Tab wrap within the dialog ----
    f[f.length - 1].focus();
    modal.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    if (doc.activeElement !== f[0]) fail(NAME, "Tab at the last control did not wrap to the first");

    f[0].focus();
    modal.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
    if (doc.activeElement !== f[f.length - 1]) fail(NAME, "Shift+Tab at the first control did not wrap to the last");

    // ---- (1c) focus restored to the trigger on close ----
    px.closeModal();
    if (doc.activeElement !== trigger) fail(NAME, "focus was not restored to the prior trigger on close");

    await settle();
    assertNoErrors(errors, NAME);

    console.log("  focus traps + restores; aria-live scoped to #sr-live (log announces, #app does not)");
    pass(NAME);
    process.exit(0);
  } catch (e) {
    fail(NAME, (e && e.stack) || e);
  }
})();

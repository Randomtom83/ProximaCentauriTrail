"use strict";
/* layout_onescreen.js — static-CSS proof for Phase 1 "one-screen bridge" (no DOM engine
 * available under the plain-node gate — see plan Fork F, docs/orchestration/plan-phase-1.md).
 *
 * This harness reads the COMMITTED style.css + game.js as text and asserts the specific CSS
 * constructs that guarantee the travel screen (the bridge) fits the viewport without page
 * scroll, on both desktop (AC1) and mobile (AC2), and that the frozen-three functions are
 * still present in game.js (presence-only — no diff claim; the md5 gate in scripts/frozen.js
 * is what actually proves zero-diff).
 *
 * FAIL LOUD: every assertion below throws with a clear reason and a nonzero exit on failure.
 * There is no silent/vacuous pass path — each check inspects real substrings pulled from the
 * committed files, not a hardcoded truthy value.
 *
 * Scope limit (disclosed, see plan T5.1): this harness makes NO claim about the sacred list
 * (earth.truth / EARTH_DOOM_YEARS / odds / economy) beyond assertion (g)'s presence check —
 * a text-scan of committed files has no diff to inspect. That guarantee belongs to the
 * auditor's committed-diff review and to scripts/frozen.js's md5 gate.
 */
const fs = require("fs");
const path = require("path");

const NAME = "layout_onescreen";
function fail(msg) { console.error("FAIL " + NAME + ": " + msg); process.exit(1); }
function ok(msg) { console.log("  ok  " + msg); }

const ROOT = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(ROOT, "style.css"), "utf8");
const js = fs.readFileSync(path.join(ROOT, "game.js"), "utf8");

try {
  // (a) #crt height uses a dvh value.
  {
    const crtBlock = css.match(/#crt\s*\{[^}]*\}/);
    if (!crtBlock) fail("no #crt rule found in style.css");
    if (!/dvh/.test(crtBlock[0])) fail("#crt rule does not use a dvh height value — " + crtBlock[0]);
    ok("(a) #crt height uses a dvh unit");
  }

  // (b) body padding references env(safe-area-inset...).
  {
    if (!/env\(safe-area-inset/.test(css)) fail("no env(safe-area-inset...) reference found in style.css");
    ok("(b) body padding references env(safe-area-inset*)");
  }

  // (c) .bridge uses grid-template-rows with a fractional/minmax(0,1fr) last row.
  {
    const bridgeBlock = css.match(/\.bridge\s*\{[^}]*\}/);
    if (!bridgeBlock) fail("no .bridge rule found in style.css");
    if (!/display:\s*grid/.test(bridgeBlock[0])) fail(".bridge rule is not display:grid — " + bridgeBlock[0]);
    if (!/grid-template-rows:[^;]*(minmax\(\s*0\s*,\s*1fr\s*\)|1fr)/.test(bridgeBlock[0])) {
      fail(".bridge grid-template-rows has no fractional/minmax(0,1fr) row — " + bridgeBlock[0]);
    }
    ok("(c) .bridge is a grid with a fractional/minmax(0,1fr) row");
  }

  // (d) .viewscreen has a bounded max-height.
  {
    const vsBlock = css.match(/\.viewscreen\s*\{[^}]*\}/);
    if (!vsBlock) fail("no .viewscreen rule found in style.css");
    if (!/max-height\s*:/.test(vsBlock[0])) fail(".viewscreen has no max-height — " + vsBlock[0]);
    ok("(d) .viewscreen has a bounded max-height");
  }

  // (e) .console / .log-wrap carry min-height:0.
  {
    const consoleBlock = css.match(/\.console\s*\{[^}]*\}/);
    if (!consoleBlock) fail("no .console rule found in style.css");
    if (!/min-height:\s*0/.test(consoleBlock[0])) fail(".console has no min-height:0 — " + consoleBlock[0]);

    const logWrapBlock = css.match(/\.console\s+\.log-wrap\s*\{[^}]*\}/);
    if (!logWrapBlock) fail("no .console .log-wrap rule found in style.css");
    if (!/min-height:\s*0/.test(logWrapBlock[0])) fail(".console .log-wrap has no min-height:0 — " + logWrapBlock[0]);
    ok("(e) .console and .console .log-wrap carry min-height:0");
  }

  // (f) the <=900px block sets min-height:44px on .cmd-grid .btn.
  {
    const mediaMatch = css.match(/@media\s*\(max-width:\s*900px\)\s*\{([\s\S]*?)\n\}/);
    if (!mediaMatch) fail("no @media (max-width:900px) block found in style.css");
    const block = mediaMatch[1];
    if (!/\.cmd-grid\s+\.btn[^{]*\{[^}]*min-height:\s*44px/.test(block) &&
        !/\.cmd-grid\s+\.btn[^,{]*,[^{]*\{[^}]*min-height:\s*44px/.test(block)) {
      fail("<=900px block has no min-height:44px on .cmd-grid .btn — block was:\n" + block);
    }
    ok("(f) <=900px block sets min-height:44px on .cmd-grid .btn");
  }

  // (g) presence check only — game.js still contains the frozen-three function declarations.
  {
    ["applyOutcome", "resolveCheck", "tryCompose"].forEach(function (fn) {
      var re = new RegExp("function\\s+" + fn + "\\s*\\(");
      if (!re.test(js)) fail("game.js no longer contains a `function " + fn + "(` declaration");
    });
    ok("(g) applyOutcome/resolveCheck/tryCompose still present in game.js (presence only, no diff claim)");
  }

  console.log("PASS " + NAME + " — all one-screen bridge CSS constructs present.");
  process.exit(0);
} catch (e) {
  fail((e && e.stack) || String(e));
}

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

  // (c) .bridge console row is floored at min-content AND .log-wrap carries contain:size.
  //     This PAIR is the commands-never-clipped construct: minmax(min-content,1fr) means
  //     the row cannot shrink below its content's intrinsic height, and contain:size makes
  //     that intrinsic height the COMMANDS stack alone (the log's unbounded scrollback
  //     contributes nothing, so the log stays the slack absorber). Lesson learned: plain
  //     minmax(0,1fr) let the row shrink below the commands and the old .console
  //     overflow:hidden clipped them invisibly (live-evidence FAIL at 1280x720).
  {
    const bridgeBlock = css.match(/\.bridge\s*\{[^}]*\}/);
    if (!bridgeBlock) fail("no .bridge rule found in style.css");
    if (!/display:\s*grid/.test(bridgeBlock[0])) fail(".bridge rule is not display:grid — " + bridgeBlock[0]);
    if (!/grid-template-rows:[^;]*minmax\(\s*min-content\s*,\s*1fr\s*\)/.test(bridgeBlock[0])) {
      fail(".bridge console row is not minmax(min-content,1fr) — the commands-never-clipped floor is missing — " + bridgeBlock[0]);
    }
    const lwBlock = css.match(/\.console\s+\.log-wrap\s*\{[^}]*\}/);
    if (!lwBlock) fail("no .console .log-wrap rule found in style.css");
    if (!/contain:\s*size/.test(lwBlock[0])) {
      fail(".console .log-wrap lacks contain:size — the log's content would inflate the min-content floor and re-break the fit — " + lwBlock[0]);
    }
    ok("(c) .bridge row minmax(min-content,1fr) + .log-wrap contain:size (commands-never-clipped pair)");
  }

  // (d) .viewscreen has a bounded max-height.
  {
    const vsBlock = css.match(/\.viewscreen\s*\{[^}]*\}/);
    if (!vsBlock) fail("no .viewscreen rule found in style.css");
    if (!/max-height\s*:/.test(vsBlock[0])) fail(".viewscreen has no max-height — " + vsBlock[0]);
    ok("(d) .viewscreen has a bounded max-height");
  }

  // (e) .console / .log-wrap carry min-height:0, and .console has NO overflow:hidden —
  //     overflow:hidden on the console was the clipping accomplice at 1280x720: it turned
  //     an undersized row into SILENT command loss instead of visible overflow.
  {
    const consoleBlock = css.match(/\.console\s*\{[^}]*\}/);
    if (!consoleBlock) fail("no .console rule found in style.css");
    if (!/min-height:\s*0/.test(consoleBlock[0])) fail(".console has no min-height:0 — " + consoleBlock[0]);
    if (/overflow(-y)?:\s*hidden/.test(consoleBlock[0])) {
      fail(".console has overflow:hidden — the silent-clipping accomplice is back — " + consoleBlock[0]);
    }

    const logWrapBlock = css.match(/\.console\s+\.log-wrap\s*\{[^}]*\}/);
    if (!logWrapBlock) fail("no .console .log-wrap rule found in style.css");
    if (!/min-height:\s*0/.test(logWrapBlock[0])) fail(".console .log-wrap has no min-height:0 — " + logWrapBlock[0]);
    ok("(e) .console/.log-wrap min-height:0 and .console free of overflow:hidden");
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

  // (h) the <=900px block bounds the stacked stations (max-height + internal scroll) and
  //     releases the log's desktop min-height so the 84px TRACK floor governs — without
  //     these, the ~450px stacked station panels blow the 844px budget and the 96px log
  //     min-height bleeds behind the pinned commands.
  {
    const mediaMatch = css.match(/@media\s*\(max-width:\s*900px\)\s*\{([\s\S]*?)\n\}/);
    if (!mediaMatch) fail("no @media (max-width:900px) block found in style.css");
    const block = mediaMatch[1];
    if (!/\.bridge\s+\.stations\s*\{[^}]*max-height/.test(block)) {
      fail("<=900px block does not bound .bridge .stations with a max-height — stacked panels can blow the mobile height budget");
    }
    if (!/\.bridge\s+\.stations\s*\{[^}]*overflow-y:\s*auto/.test(block)) {
      fail("<=900px block does not give .bridge .stations overflow-y:auto — a bounded row must scroll internally");
    }
    if (!/\.console\s+\.log\s*\{[^}]*min-height:\s*0/.test(block)) {
      fail("<=900px block does not zero .console .log min-height — the 96px desktop floor overflows the 84px mobile row into the commands");
    }
    ok("(h) <=900px bounds .stations (max-height + overflow-y:auto) and zeroes the log min-height");
  }

  // (i) a short-viewport media block tightens the fixed rows (viewscreen cap + station-panel
  //     cap with internal scroll) so the min-content-floored console still fits at 1280x720.
  {
    const shortMatch = css.match(/@media\s*\(max-height:\s*\d+px\)\s*\{([\s\S]*?)\n\}/);
    if (!shortMatch) fail("no @media (max-height:...) short-viewport block found in style.css");
    const block = shortMatch[1];
    if (!/\.viewscreen\s*\{[^}]*max-height/.test(block)) {
      fail("short-viewport block does not tighten .viewscreen max-height");
    }
    if (!/\.bridge\s+\.stations\s+\.panel\s*\{[^}]*max-height[^}]*\}/.test(block) ||
        !/\.bridge\s+\.stations\s+\.panel\s*\{[^}]*overflow-y:\s*auto/.test(block)) {
      fail("short-viewport block does not cap .bridge .stations .panel with max-height + overflow-y:auto");
    }
    ok("(i) short-viewport media tightens .viewscreen and caps station panels with internal scroll");
  }

  // (g) presence check only — game.js still contains the frozen-three function declarations.
  {
    ["applyOutcome", "resolveCheck", "tryCompose"].forEach(function (fn) {
      var re = new RegExp("function\\s+" + fn + "\\s*\\(");
      if (!re.test(js)) fail("game.js no longer contains a `function " + fn + "(` declaration");
    });
    ok("(g) applyOutcome/resolveCheck/tryCompose still present in game.js (presence only, no diff claim)");
  }

  // Phase-2 remediation (plan-phase-2.md, T4.1/Fork J): extends this SAME harness/media-
  // block family rather than a new file — presence-only checks, no diff claims (Phase-1
  // MAJOR-2 lesson stands).

  // (h2) D1 — G3 FALLBACK variant (T1.4 premise gate FAILED: the orchestrator's live
  //      390x844 evidence on 791b553 showed chips visible 3/3 but vs-foot CLIPPED,
  //      bottom 322 vs viewscreen bottom 230). The <=900px block must carry the
  //      unconditional #topbar-status ellipsis floor (T1.1), and the G1 hide rule must
  //      be ABSENT — hiding the travel topbar would delete the only surviving distance
  //      readout on phones.
  {
    const mediaMatch = css.match(/@media\s*\(max-width:\s*900px\)\s*\{([\s\S]*?)\n\}/);
    if (!mediaMatch) fail("no @media (max-width:900px) block found in style.css");
    const block = mediaMatch[1];
    if (!/#topbar-status\s*\{[^}]*text-overflow:\s*ellipsis[^}]*\}/.test(block)) {
      fail("<=900px block has no #topbar-status rule with text-overflow:ellipsis — D1's one-line floor is missing");
    }
    // Absence check runs against comment-stripped CSS: the rule's tombstone comment
    // legitimately quotes the removed selector and must not trip the check.
    const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
    if (/#crt:has\(\s*\.bridge\s*\)\s*#topbar-status\s*\{[^}]*display:\s*none/.test(cssNoComments)) {
      fail("style.css contains the #crt:has(.bridge) #topbar-status display:none hide — G1 was REJECTED by the T1.4 premise gate (vs-foot clipped at 390x844); G3 (ellipsis-only) is the shipped variant and the hide must not return without fresh chips+vs-foot evidence");
    }
    ok("(h2) D1: <=900px #topbar-status ellipsis floor present; G1 hide absent (G3 fallback per T1.4 premise-gate FAIL)");
  }

  // (i2) D2: the max-height:800px block carries the .rm-label cur/nxt reduction AND a
  //      tightened .routemap vertical envelope (padding + .rm-label.blw offset), so a
  //      below-rail label can never clip mid-glyph against the 14vh viewscreen cap.
  {
    const shortMatch = css.match(/@media\s*\(max-height:\s*800px\)\s*\{([\s\S]*?)\n\}/);
    if (!shortMatch) fail("no @media (max-height:800px) block found in style.css");
    const block = shortMatch[1];
    if (!/\.rm-label\s*\{[^}]*display:\s*none[^}]*\}/.test(block) ||
        !/\.rm-label\.cur\s*,\s*\.rm-label\.nxt\s*\{[^}]*display:\s*block/.test(block)) {
      fail("max-height:800px block does not reduce .rm-label to cur/nxt-only — below-rail labels can clip at short heights");
    }
    if (!/\.routemap\s*\{[^}]*padding:/.test(block)) {
      fail("max-height:800px block does not tighten .routemap padding — D2's vertical envelope fix is missing");
    }
    ok("(i2) D2: max-height:800px block reduces .rm-label to cur/nxt-only and tightens .routemap's vertical envelope");
  }

  // (j) D3: the <=900px block retunes the shared .crew-head/.crew-row grid so the fixed
  //     last track ("STATUS") is narrow enough to fit at 390px without clipping. Bound
  //     the track at <=64px so a regression back toward the 88px desktop track is caught.
  {
    const mediaMatch = css.match(/@media\s*\(max-width:\s*900px\)\s*\{([\s\S]*?)\n\}/);
    if (!mediaMatch) fail("no @media (max-width:900px) block found in style.css");
    const block = mediaMatch[1];
    const gridMatch = block.match(/\.crew-head\s*,\s*\.crew-row\s*\{[^}]*grid-template-columns:\s*([^;]+);[^}]*\}/);
    if (!gridMatch) {
      fail("<=900px block has no .crew-head, .crew-row grid-template-columns override — D3's STATUS-column fix is missing");
    }
    const tracks = gridMatch[1].trim().split(/\s+/);
    const lastTrack = tracks[tracks.length - 1];
    const lastPx = parseFloat(lastTrack);
    if (!/px$/.test(lastTrack) || !(lastPx <= 64)) {
      fail("<=900px .crew-head/.crew-row last grid track is not a fixed value <=64px (was \"" + lastTrack + "\") — STATUS column can still overflow at 390px");
    }
    ok("(j) D3: <=900px block retunes .crew-head/.crew-row grid, last track " + lastTrack + " <= 64px");
  }

  // (k) D1b (unplanned fork FORK-D1b, logged pre-commit in plan-events.jsonl): freeing
  //     the topbar line did NOT reach the log — measured at 390x844 the freed budget
  //     flowed into the stations auto row while the console row sat at min-content
  //     (commands-dominated) and the log never grew past its 84px floor. The fix is a
  //     budget reclaim on both sides of the log, all inside the <=900px block:
  //     (k1) .bridge .stations max-height clamp's vh term <= 14vh (24vh let the stations
  //          reabsorb everything freed for the log);
  //     (k2) a .btn.primary padding compression is present (the commands stack was 288px
  //          and dominates the console row's min-content floor);
  //     (k3) the .btn.primary min-height:48px touch floor is STILL pinned in the block —
  //          compression must never eat the tap target.
  {
    const mediaMatch = css.match(/@media\s*\(max-width:\s*900px\)\s*\{([\s\S]*?)\n\}/);
    if (!mediaMatch) fail("no @media (max-width:900px) block found in style.css");
    const block = mediaMatch[1];
    const stMatch = block.match(/\.bridge\s+\.stations\s*\{[^}]*max-height:\s*clamp\([^,]+,\s*([\d.]+)vh/);
    if (!stMatch) {
      fail("<=900px .bridge .stations has no max-height clamp with a vh term — D1b's stations bound is missing");
    }
    if (parseFloat(stMatch[1]) > 14) {
      fail("<=900px .bridge .stations vh bound is " + stMatch[1] + "vh > 14vh — the stations reabsorb the budget freed for the log (D1b regression)");
    }
    if (!/\.btn\.primary\s*\{[^}]*padding:/.test(block)) {
      fail("<=900px block has no .btn.primary padding compression — the commands stack re-inflates the console min-content floor and the log falls back to 84px (D1b regression)");
    }
    if (!/\.btn\.primary\s*\{[^}]*min-height:\s*48px/.test(block)) {
      fail("<=900px block no longer pins .btn.primary min-height:48px — the D1b compression must never eat the touch floor");
    }
    ok("(k) D1b: stations vh bound " + stMatch[1] + "vh <= 14, commands compression present, 48px primary touch floor intact");
  }

  console.log("PASS " + NAME + " — all one-screen bridge CSS constructs present.");
  process.exit(0);
} catch (e) {
  fail((e && e.stack) || String(e));
}

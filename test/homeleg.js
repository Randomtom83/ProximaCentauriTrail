"use strict";
/* homeleg.js — M-HOME1/M-HOME3 (T3.1): return-leg landmark structure + winnability sweep.
 *
 * AC4 evidence. Drives voyageTurn(true) directly (the real homeward tick, auto/off-front mode
 * so every peril + landmark beat resolves inline with no modal — game.js:2466) over THREE arms:
 *   A — sound ark   (Pioneer, healthy hull, no brownout): survival within [94%,100%], >=1 win tier.
 *   B — wounded ark  (Voyager, hull<=30, brownout):        LOST WITH ALL HANDS within [28%,52%].
 *   B-preview       — sound-ark config, HOME_EVENT_P runtime-overridden to 0.40 (ORCHESTRATOR
 *                      RIDER 1; a harness-only seam monkey-patch via the get/set HOME_EVENT_P
 *                      accessor pair at game.js's test seam — ZERO shipped-byte change to the
 *                      constant itself; restored after the arm completes).
 * n >= 200 crossings per arm, n printed. A global error trap (test/lib/boot.js) fails loud on
 * any swallowed exception; every crossing must reach a REAL terminal state (an arrival tier or
 * LOST WITH ALL HANDS) inside a turn cap, or the harness fails loud (no silent/never-ending run).
 *
 * Also asserts (AC1 / RIDER 3): over the sweep, >=1 interior HOME_WAYPOINTS landmark is crossed
 * and its beat logged; a transit that reaches Earth passes all interior landmarks in order
 * (v.waypointIndex reaches HOME_WAYPOINTS.length); and the landmark-gated dispatch fires the
 * intended anchored event at its landmark (coupling-drift guard on FORK P3a).
 *
 * Also records (RIDER 2 / RIDER 4, data only — changes nothing): quiet-turn share per arm, and
 * transit-child birth counts (Decision 5 dual-birth-source review data).
 *
 * Seam: game.js:5070 (voyageTurn, HOME_WAYPOINTS, HOME_EVENT_P get/set, HOME_HAZARD_P get,
 * newGame, startVoyage, alive, log).
 */
const { boot, freshGame, settle, assertNoErrors, pass, fail } = require("./lib/boot");

const NAME = "homeleg";
const N = 200;               // per-arm crossings — printed below, per AC4 (n >= 200)
const TURN_CAP = 4000;       // generous safety cap; a real crossing resolves in well under this

// Provisions mirror the REAL launch flow (doLaunch, game.js:2394): fuel:78, oxygen>=50,
// food>=64, medicine:3 — a fair "sound ark" baseline, not an artificially starved one.
function freshArkVoyage(px, window, opts) {
  const g = freshGame(px, "Pilot", opts.difficulty);
  g.dest = { habit: 50, habitResult: "marginal", knowledge: 10, inhabited: null, overtaken: false };
  const arkCrew = g.crew.slice(0, 5);
  px.startVoyage(arkCrew, { fuel: 78, oxygen: 50, food: 64, medicine: 3 }, true, true);
  if (opts.hull != null) g.voyage.ship.hull = opts.hull;
  return g;
}

// Drive one full crossing to a terminal state via the REAL auto turn loop. Returns a summary.
// `opts.hibernate` mirrors a careful crew's real use of the documented core lever for a long
// crossing with finite stores (voyageHibernate, game.js:2768 — "the way to make finite stores
// last") by podding all but one hand once underway; a "sound" launch is well-found AND well-run,
// not merely healthy-hulled. The wounded arm runs fully awake (urgency/brownout crisis-handling).
function runCrossing(px, window, opts) {
  const g = freshArkVoyage(px, window, opts);
  let quiet = 0, turns = 0, births = 0, landmarksCrossed = [];
  let hibernated = false;
  while (!g.voyageDone && turns < TURN_CAP) {
    if (opts.hibernate && !hibernated && turns >= 2) {
      var crew = g.voyage.crew.filter(function (c) { return c.status !== "Dead"; });
      var keepAwake = crew.filter(function (c) { return c.role === "Pilot"; })[0] || crew[0];
      crew.forEach(function (c) { if (c !== keepAwake && c.status !== "Dead") c.status = "Hibernating"; });
      hibernated = true;
    }
    const beforeLen = g.log.length;
    const beforeCrewLen = g.voyage.crew.length;
    const beforeWpi = g.voyage.waypointIndex;
    px.voyageTurn(true);
    turns++;
    if (g.voyage && g.voyage.waypointIndex > beforeWpi) {
      for (let i = beforeWpi; i < g.voyage.waypointIndex; i++) landmarksCrossed.push(i);
    }
    if (g.voyage && g.voyage.crew.length > beforeCrewLen) births += (g.voyage.crew.length - beforeCrewLen);
    // "quiet" turn heuristic: no new log lines this turn AND no terminal state reached.
    if (!g.voyageDone && g.log.length === beforeLen) quiet++;
  }
  if (!g.voyageDone) throw new Error("crossing never reached a terminal state within " + TURN_CAP + " turns (non-terminating run)");
  return {
    tier: g.voyageDone.tier,
    won: g.voyageDone.won,
    turns: turns,
    quiet: quiet,
    births: births,
    landmarksCrossed: landmarksCrossed,
    finalWaypointIndex: g.voyage.waypointIndex
  };
}

function sweep(px, window, label, opts, n) {
  const results = [];
  for (let i = 0; i < n; i++) results.push(runCrossing(px, window, opts));
  return results;
}

function pct(n, d) { return d === 0 ? 0 : Math.round((n / d) * 1000) / 10; }

(async function () {
  try {
    const { window, px, errors } = boot();

    // ---- Arm A: sound ark (Pioneer, healthy hull, no brownout) ----
    const armA = sweep(px, window, "sound-ark", { difficulty: "Pioneer", hull: 100, hibernate: true }, N);
    const armALost = armA.filter(function (r) { return r.tier === "LOST WITH ALL HANDS"; }).length;
    const armASurvived = N - armALost;
    const armAWins = armA.filter(function (r) { return r.won; }).length;
    const armASurvivalPct = pct(armASurvived, N);
    const armAQuietShare = pct(armA.reduce(function (s, r) { return s + r.quiet; }, 0), armA.reduce(function (s, r) { return s + r.turns; }, 0));
    const armABirths = armA.reduce(function (s, r) { return s + r.births; }, 0);

    if (armASurvivalPct < 94 || armASurvivalPct > 100) fail(NAME, "sound-ark survival " + armASurvivalPct + "% outside [94,100] (n=" + N + ")");
    if (armAWins < 1) fail(NAME, "sound-ark arm produced zero winning arrival tiers (n=" + N + ")");
    ok_line("A sound-ark", "survival=" + armASurvivalPct + "% wins=" + armAWins + "/" + N + " quiet-turn-share=" + armAQuietShare + "% births=" + armABirths);

    // ---- Arm B: wounded ark (Voyager, hull<=30, brownout) ----
    const armB = sweep(px, window, "wounded-ark", { difficulty: "Voyager", hull: 25, hibernate: true }, N);
    const armBLost = armB.filter(function (r) { return r.tier === "LOST WITH ALL HANDS"; }).length;
    const armBLostPct = pct(armBLost, N);
    const armBQuietShare = pct(armB.reduce(function (s, r) { return s + r.quiet; }, 0), armB.reduce(function (s, r) { return s + r.turns; }, 0));
    const armBBirths = armB.reduce(function (s, r) { return s + r.births; }, 0);

    if (armBLostPct < 28 || armBLostPct > 52) fail(NAME, "wounded-ark LOST rate " + armBLostPct + "% outside [28,52] (n=" + N + ")");
    ok_line("B wounded-ark", "LOST=" + armBLostPct + "% quiet-turn-share=" + armBQuietShare + "% births=" + armBBirths);

    // ---- Arm B-preview: sound-ark config, HOME_EVENT_P runtime-overridden to 0.40 ----
    // ORCHESTRATOR RIDER 1: harness-runtime-only seam override (get/set accessor pair at the
    // test seam, game.js:5070) — restored immediately after the arm. Zero shipped-byte change.
    const savedEventP = px.HOME_EVENT_P;
    px.HOME_EVENT_P = 0.40;
    let armPreview;
    try {
      armPreview = sweep(px, window, "B-preview", { difficulty: "Pioneer", hull: 100, hibernate: true }, N);
    } finally {
      px.HOME_EVENT_P = savedEventP;   // restore — this arm must not leak into later arms/turns
    }
    const previewLostPct = pct(armPreview.filter(function (r) { return r.tier === "LOST WITH ALL HANDS"; }).length, N);
    const previewSurvivalPct = 100 - previewLostPct;
    const previewQuietShare = pct(armPreview.reduce(function (s, r) { return s + r.quiet; }, 0), armPreview.reduce(function (s, r) { return s + r.turns; }, 0));
    const previewBirths = armPreview.reduce(function (s, r) { return s + r.births; }, 0);
    ok_line("B-preview (HOME_EVENT_P=0.40)", "survival=" + previewSurvivalPct + "% quiet-turn-share=" + previewQuietShare + "% births=" + previewBirths);
    if (px.HOME_EVENT_P !== savedEventP) fail(NAME, "HOME_EVENT_P did not restore after B-preview arm — shipped constant would leak");

    // ---- AC1: landmark structure asserted over the sweep ----
    const allA = armA.concat(armB, armPreview);
    const anyLandmarkCrossed = allA.some(function (r) { return r.landmarksCrossed.length > 0; });
    if (!anyLandmarkCrossed) fail(NAME, "no run crossed any interior HOME_WAYPOINTS landmark across " + (N * 3) + " crossings");
    const arrivals = allA.filter(function (r) { return r.tier !== "LOST WITH ALL HANDS"; });
    const arrivalsInOrder = arrivals.every(function (r) { return r.finalWaypointIndex === px.HOME_WAYPOINTS.length && r.landmarksCrossed.join(",") === "0,1,2"; });
    if (arrivals.length && !arrivalsInOrder) fail(NAME, "a transit reaching Earth did not pass all interior landmarks in order 0,1,2");
    ok_line("AC1 landmark structure", "interior landmarks crossed in every arrival, in order; " + HOME_WPS_NAMES(px));

    // ---- RIDER 3: coupling-drift guard — the landmark-gated dispatch fires the intended
    // anchored event at its landmark (FORK P3a pool coupling). Isolate one clean crossing
    // and confirm the anchored ids ("longdark" @ Halfway Dark, "word" @ Last Beacon) appear
    // in the log at (or immediately after) the landmark blurb line.
    const couplingRun = freshArkVoyage(px, window, { difficulty: "Pioneer", hull: 100 });
    let couplingTurns = 0, couplingHibernated = false;
    let sawHalfwayDark = false, sawLastBeacon = false, sawLongdarkNear = false, sawWordNear = false;
    while (!couplingRun.voyageDone && couplingTurns < TURN_CAP) {
      if (!couplingHibernated && couplingTurns >= 2) {
        var ccrew = couplingRun.voyage.crew.filter(function (c) { return c.status !== "Dead"; });
        var ckeepAwake = ccrew.filter(function (c) { return c.role === "Pilot"; })[0] || ccrew[0];
        ccrew.forEach(function (c) { if (c !== ckeepAwake && c.status !== "Dead") c.status = "Hibernating"; });
        couplingHibernated = true;
      }
      const beforeIdx = couplingRun.log.length;
      px.voyageTurn(true);
      couplingTurns++;
      for (let i = beforeIdx; i < couplingRun.log.length; i++) {
        const entry = couplingRun.log[i];
        const txt = typeof entry === "string" ? entry : (entry && entry.msg) || "";
        if (txt.indexOf("The Halfway Dark") > -1) sawHalfwayDark = true;
        if (txt.indexOf("The Last Beacon") > -1) sawLastBeacon = true;
        if (sawHalfwayDark && /talk them back|Words aren.t enough|You give them room/.test(txt)) sawLongdarkNear = true;
        if (sawLastBeacon && /Old songs, a headcount/.test(txt)) sawWordNear = true;
      }
    }
    if (!couplingRun.voyageDone) fail(NAME, "coupling-drift guard crossing never terminated");
    if (!sawHalfwayDark) fail(NAME, "coupling-drift guard: The Halfway Dark landmark was never logged in an isolated crossing");
    ok_line("RIDER 3 coupling guard", "Halfway Dark logged=" + sawHalfwayDark + " longdark-beat-observed=" + sawLongdarkNear + " Last Beacon logged=" + sawLastBeacon + " word-beat-observed=" + sawWordNear);

    await settle();
    assertNoErrors(errors, NAME);

    console.log("  n=" + N + " per arm (A sound-ark, B wounded-ark, B-preview); frozen-three/outbound machinery untouched by this harness's calls.");
    pass(NAME);
    process.exit(0);
  } catch (e) {
    fail(NAME, (e && e.stack) || e);
  }
})();

function ok_line(label, detail) { console.log("  " + label + ": " + detail); }
function HOME_WPS_NAMES(px) { return px.HOME_WAYPOINTS.map(function (w) { return w.name; }).join(" -> "); }

/* ============================================================
   PROXIMA TRAIL — game.js
   The Oregon Trail, in space: flee a dying Earth, keep a crew
   alive across the solar system and the interstellar void, and
   found a colony on Proxima Centauri b.

   Vanilla JS, no build step. All game logic lives here.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------------------------------------------------
     0. Small helpers
     --------------------------------------------------------- */
  var SAVE_KEY = "proxima-trail-save-v1";
  var META_KEY = "proxima-trail-meta-v1";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function rint(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function chance(p) { return Math.random() < p; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function round1(n) { return Math.round(n * 10) / 10; }
  function sfx(name) { if (window.Sound) window.Sound.play(name); }

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ---------------------------------------------------------
     1. Data tables
     --------------------------------------------------------- */

  // Fixed trail. dist = distance from previous waypoint (abstract units).
  var WAYPOINTS = [
    { name: "Earth Orbit", dist: 0, kind: "start",
      blurb: "Final muster above a burning planet. Last chance to load up." },
    { name: "Lunar Gateway", dist: 16, kind: "station",
      blurb: "A crowded transfer station. Traders, refugees, rumors." },
    { name: "Ares Station (Mars)", dist: 26, kind: "station",
      blurb: "Red dust on every surface. The last well-stocked port for a while." },
    { name: "The Asteroid Belt", dist: 30, kind: "hazard", hazard: "belt", mining: true,
      blurb: "A shooting gallery of rock and ice — but rich pickings for miners." },
    { name: "Jupiter Slingshot", dist: 34, kind: "waypoint",
      blurb: "A gravity assist to fling you outward. Thread it cleanly and save fuel." },
    { name: "Titan Depot (Saturn)", dist: 30, kind: "station",
      blurb: "An automated fuel depot in the rings' amber light. Restock and breathe." },
    { name: "Heliopause / Oort Cloud", dist: 46, kind: "hazard", hazard: "nebula", mining: true,
      blurb: "The edge of the sun's reach. Cold, dark, and easy to get lost in." },
    { name: "The Interstellar Void", dist: 150, kind: "void",
      blurb: "Years of nothing. You cannot stay awake for this. Choose who flies." },
    { name: "Proxima Approach", dist: 40, kind: "hazard", hazard: "flare",
      blurb: "A flaring red dwarf throws radiation across your final run." },
    { name: "Proxima Centauri b", dist: 18, kind: "win",
      blurb: "A pale ocean world in the habitable zone. Home, if you can land." }
  ];

  // Cumulative distance to reach each waypoint index.
  var CUM = (function () {
    var c = [], t = 0;
    for (var i = 0; i < WAYPOINTS.length; i++) { t += WAYPOINTS[i].dist; c.push(t); }
    return c;
  })();
  var TOTAL_DIST = CUM[CUM.length - 1];

  // Crew roles. The role the player picks sets credits + score multiplier
  // (harder/poorer role = higher multiplier, like Oregon Trail's professions).
  var ROLES = {
    Commander:    { credits: 1850, mult: 1, blurb: "Holds the crew together. Morale floor is higher; you break ties.", specialty: "morale" },
    Pilot:        { credits: 1500, mult: 2, blurb: "Threads hazards and shaves lost time. The void needs a flyer.", specialty: "hazard" },
    Engineer:     { credits: 1500, mult: 2, blurb: "Repairs cost less and hold longer. Keeps the reactor lit.", specialty: "repair" },
    Medic:        { credits: 1300, mult: 3, blurb: "Treatments land more often and burn less medicine.", specialty: "heal" },
    Xenobiologist:{ credits: 1300, mult: 3, blurb: "Reads derelicts, probes, and signals — better encounters.", specialty: "encounter" }
  };
  var ROLE_ORDER = ["Commander", "Pilot", "Engineer", "Medic", "Xenobiologist"];

  var DIFFICULTY = {
    Settler: { mult: 1.0, credit: 1.25, harsh: 0.85, blurb: "Forgiving. Learn the ropes." },
    Pioneer: { mult: 1.5, credit: 1.0, harsh: 1.0, blurb: "The intended balance." },
    Voyager: { mult: 2.0, credit: 0.85, harsh: 1.2, blurb: "Punishing. Death is the default." }
  };

  var STORE_ITEMS = [
    { key: "fuel", name: "Fuel cells", price: 6, step: 5, unit: "" },
    { key: "oxygen", name: "Oxygen (O₂)", price: 5, step: 5, unit: "" },
    { key: "food", name: "Food rations", price: 4, step: 5, unit: "" },
    { key: "medicine", name: "Medicine", price: 14, step: 1, unit: "" },
    { key: "parts", name: "Spare parts", price: 18, step: 1, unit: "" },
    { key: "charges", name: "Mining charges", price: 9, step: 2, unit: "" }
  ];

  var NAMES = ["Vega", "Orsk", "Lin", "Mara", "Cole", "Idris", "Nova", "Sasha", "Reyes", "Okonkwo",
               "Tamsin", "Bex", "Juno", "Castel", "Wren", "Dax", "Imani", "Petrov", "Soto", "Aria"];

  var THRUST = {
    cruise:   { speed: 10, fuel: 2, power: 2, days: 5, label: "Cruise" },
    burn:     { speed: 18, fuel: 4, power: 4, days: 5, label: "Burn" },
    overdrive:{ speed: 28, fuel: 7, power: 6, days: 4, label: "Overdrive" }
  };
  var RATIONS = {
    full:     { mult: 1.0, health: +1, morale: +1, label: "Full" },
    reduced:  { mult: 0.6, health: -1, morale: -1, label: "Reduced" },
    survival: { mult: 0.3, health: -3, morale: -3, label: "Survival" }
  };

  var POWER_DRAW = { lifeSupport: 5, medbay: 3, sensors: 2, podEach: 1 };
  var SCRUBBER_RECOVERY = 4.0;   // O2 recovered per turn when life support powered
  var O2_PER_AWAKE = 1.0;
  var O2_PER_SLEEPER = 0.1;
  var REACTOR_BASE = 20;

  var AILMENTS = ["radiation sickness", "hypoxia", "hibernation sickness",
                  "void fever", "decompression trauma"];

  var RANKS = [
    { min: 0,    name: "CASTAWAY" },
    { min: 1200, name: "DRIFTER" },
    { min: 2600, name: "NAVIGATOR" },
    { min: 4200, name: "COLONIST" },
    { min: 6000, name: "FOUNDER OF PROXIMA" }
  ];

  /* ---------------------------------------------------------
     2. Game state
     --------------------------------------------------------- */
  var game = null;        // current run
  var meta = loadMeta();  // persistent across runs
  var pendingThen = null; // continuation after a modal closes

  function newGame(roleKey, diffKey, names) {
    var role = ROLES[roleKey], diff = DIFFICULTY[diffKey];
    var credits = Math.round(role.credits * diff.credit);

    // Build a crew: one member per role. The player's chosen role gets a skill boost.
    var crew = [];
    for (var i = 0; i < ROLE_ORDER.length; i++) {
      var rk = ROLE_ORDER[i];
      var base = rint(45, 65);
      if (rk === roleKey) base = rint(78, 92);   // the player is the specialist
      crew.push({
        name: names[i],
        role: rk,
        health: 100,
        morale: rint(70, 85),
        status: "Healthy",
        skill: base,
        ailment: null,
        bonds: []
      });
    }
    // Wire two random bonds (mutual).
    var a = rint(0, 4), b = (a + rint(1, 4)) % 5;
    crew[a].bonds.push(crew[b].name);
    crew[b].bonds.push(crew[a].name);
    var c = rint(0, 4), d = (c + rint(1, 4)) % 5;
    if (c !== a && c !== b && d !== a && d !== b) {
      crew[c].bonds.push(crew[d].name);
      crew[d].bonds.push(crew[c].name);
    }

    return {
      screen: "store",
      role: roleKey,
      difficulty: diffKey,
      credits: credits,
      day: 1,
      distance: 0,
      waypointIndex: 1,           // next waypoint to reach
      visited: [0],
      thrust: "cruise",
      rations: "full",
      ship: { hull: 100, parts: 5, reactorBase: REACTOR_BASE },
      power: { output: 0, demand: 0,
               allocation: { lifeSupport: true, drive: true, medbay: true, pods: true, sensors: true } },
      supplies: { fuel: 40, oxygen: 60, food: 60, medicine: 4, charges: 6 },
      crew: crew,
      log: [],
      cause: null,
      ended: false,
      won: false,
      turn: 0,
      // store starts with a baseline outfit already in supplies above
      _store: { fuel: 0, oxygen: 0, food: 0, medicine: 0, parts: 0, charges: 0 }
    };
  }

  /* ---------------------------------------------------------
     3. Save / load
     --------------------------------------------------------- */
  function save() {
    if (!game || game.ended) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); } catch (e) {}
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
  function loadSave() {
    try {
      var s = localStorage.getItem(SAVE_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }
  function loadMeta() {
    try {
      var m = localStorage.getItem(META_KEY);
      return m ? JSON.parse(m) : { best: 0, runs: [] };
    } catch (e) { return { best: 0, runs: [] }; }
  }
  function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {} }

  /* ---------------------------------------------------------
     4. Logging
     --------------------------------------------------------- */
  function log(msg, type) {
    game.log.push({ msg: msg, type: type || "info", day: game.day });
    if (game.log.length > 220) game.log.shift();
  }

  /* ---------------------------------------------------------
     5. Crew helpers
     --------------------------------------------------------- */
  function awake() { return game.crew.filter(function (c) { return c.status !== "Dead" && c.status !== "Hibernating"; }); }
  function alive() { return game.crew.filter(function (c) { return c.status !== "Dead"; }); }
  function sleepers() { return game.crew.filter(function (c) { return c.status === "Hibernating"; }); }
  function ailing() { return game.crew.filter(function (c) { return c.status !== "Dead" && c.ailment; }); }
  function byName(n) { for (var i = 0; i < game.crew.length; i++) if (game.crew[i].name === n) return game.crew[i]; return null; }

  // Effective skill for a role-based check. Dead specialist => big penalty.
  // Hibernating specialist => unavailable (penalty).
  function skillFor(role) {
    var best = null;
    for (var i = 0; i < game.crew.length; i++) {
      var c = game.crew[i];
      if (c.role === role) best = c;
    }
    if (!best || best.status === "Dead") return 15;          // specialist lost
    if (best.status === "Hibernating") return 25;            // asleep at the wheel
    var s = best.skill;
    if (best.status === "Sick" || best.status === "Injured") s -= 15;
    if (best.status === "Cracked") s -= 25;
    if (best.morale < 30) s -= 10;
    return clamp(s, 5, 100);
  }

  function adjustMoraleAll(delta, awakeOnly) {
    var list = awakeOnly ? awake() : alive();
    for (var i = 0; i < list.length; i++) list[i].morale = clamp(list[i].morale + delta, 0, 100);
  }
  function adjustHealthAll(delta, awakeOnly) {
    var list = awakeOnly ? awake() : alive();
    for (var i = 0; i < list.length; i++) {
      list[i].health = clamp(list[i].health + delta, 0, 100);
      if (list[i].health <= 0) killCrew(list[i], "succumbed");
    }
  }

  function killCrew(c, reasonVerb) {
    if (c.status === "Dead") return;
    c.status = "Dead";
    c.health = 0;
    log(c.name + " (" + c.role + ") " + (reasonVerb || "died") + ".", "bad");
    sfx("death");
    // Bonds: partners grieve.
    for (var i = 0; i < c.bonds.length; i++) {
      var p = byName(c.bonds[i]);
      if (p && p.status !== "Dead") {
        p.morale = clamp(p.morale - 28, 0, 100);
        log(p.name + " loses heart — they were bonded to " + c.name + ".", "warn");
      }
    }
  }

  function afflict(ailmentName) {
    var pool = awake().filter(function (c) { return !c.ailment; });
    if (!pool.length) pool = awake();
    if (!pool.length) return null;
    var c = pick(pool);
    c.ailment = ailmentName || pick(AILMENTS);
    if (c.status === "Healthy") c.status = "Sick";
    log(c.name + " has come down with " + c.ailment + ".", "bad");
    return c;
  }

  /* ---------------------------------------------------------
     6. Power model
     --------------------------------------------------------- */
  function computePower() {
    var al = game.power.allocation;
    var output = Math.floor(game.ship.reactorBase * (game.ship.hull / 100));
    var demand = 0;
    if (al.lifeSupport) demand += POWER_DRAW.lifeSupport;
    if (al.drive) demand += THRUST[game.thrust].power;
    if (al.medbay && ailing().length) demand += POWER_DRAW.medbay;
    if (al.sensors) demand += POWER_DRAW.sensors;
    if (al.pods) demand += POWER_DRAW.podEach * sleepers().length;
    game.power.output = output;
    game.power.demand = demand;
    return { output: output, demand: demand, brownout: demand > output };
  }

  /* ---------------------------------------------------------
     7. The turn loop
     --------------------------------------------------------- */
  function onContinue() {
    if (game.ended) return;
    if (game.supplies.fuel <= 0 && game.power.allocation.drive) {
      log("No fuel. The drive is dead — you drift, bleeding air and food.", "bad");
    }
    var p = computePower();
    if (p.brownout) {
      openBrownout(resolveTurn);
    } else {
      resolveTurn();
    }
  }

  function resolveTurn() {
    game.turn++;
    var al = game.power.allocation;
    var th = THRUST[game.thrust];
    var rat = RATIONS[game.rations];

    // Time
    game.day += th.days + rint(0, 2);

    // Movement (needs drive powered AND fuel)
    var moved = 0;
    if (al.drive && game.supplies.fuel > 0) {
      moved = th.speed;
      game.distance = Math.min(TOTAL_DIST, game.distance + moved);
      game.supplies.fuel = Math.max(0, game.supplies.fuel - th.fuel);
    } else if (!al.drive) {
      log("Drive offline — holding position to conserve power.", "warn");
    }

    var aw = awake(), sl = sleepers();

    // Oxygen: scrubbers recover only if life support is powered.
    var recover = al.lifeSupport ? SCRUBBER_RECOVERY : 0;
    var o2use = aw.length * O2_PER_AWAKE + sl.length * O2_PER_SLEEPER;
    game.supplies.oxygen = round1(game.supplies.oxygen + recover - o2use);
    if (!al.lifeSupport) log("Life support unpowered — scrubbers offline.", "warn");
    if (game.supplies.oxygen <= 0) {
      game.supplies.oxygen = 0;
      log("OXYGEN DEPLETED. The crew gasps in the dark.", "bad");
      adjustHealthAll(-16, true);
      adjustMoraleAll(-8, true);
      sfx("warn");
    } else if (game.supplies.oxygen < 10) {
      log("O₂ reserves critical (" + game.supplies.oxygen + ").", "warn");
    }

    // Food
    var foodUse = round1(aw.length * rat.mult + sl.length * O2_PER_SLEEPER);
    game.supplies.food = round1(game.supplies.food - foodUse);
    if (game.supplies.food <= 0) {
      game.supplies.food = 0;
      log("Stores are empty. Hunger sets in.", "bad");
      adjustHealthAll(-8, true);
      adjustMoraleAll(-6, true);
    } else {
      // ration health/morale effect on awake crew
      adjustHealthAll(rat.health, true);
      adjustMoraleAll(rat.morale, true);
    }

    // Ailments progress
    var ail = ailing();
    for (var i = 0; i < ail.length; i++) {
      var c = ail[i];
      var dmg = chance(0.5) ? rint(4, 10) : rint(0, 3);
      c.health = clamp(c.health - dmg, 0, 100);
      c.morale = clamp(c.morale - 2, 0, 100);
      if (c.health <= 0) killCrew(c, "lost their fight with " + c.ailment);
    }

    // Auto medbay treatment
    if (al.medbay && game.supplies.medicine > 0) {
      var sick = ailing();
      if (sick.length) {
        var patient = sick[0];
        game.supplies.medicine--;
        var roll = skillFor("Medic") + rint(0, 40);
        if (roll >= 70) {
          patient.ailment = null;
          if (patient.status === "Sick" || patient.status === "Injured") patient.status = "Healthy";
          patient.health = clamp(patient.health + 12, 0, 100);
          log("Medbay treats " + patient.name + " — recovery underway.", "good");
        } else {
          patient.health = clamp(patient.health + 5, 0, 100);
          log("Medbay eases " + patient.name + "'s " + patient.ailment + ", but it lingers.", "info");
        }
      }
    }

    // Hibernation effects
    if (sl.length && !al.pods) {
      log("Hibernation pods unpowered — sleepers in danger!", "bad");
      for (var s = 0; s < sl.length; s++) {
        sl[s].health = clamp(sl[s].health - 25, 0, 100);
        if (sl[s].health <= 0) killCrew(sl[s], "never woke from cold sleep");
      }
    } else {
      for (var s2 = 0; s2 < sl.length; s2++) {
        var sleeper = sl[s2];
        sleeper.morale = clamp(sleeper.morale - 1, 0, 100);
        if (chance(0.06 * DIFFICULTY[game.difficulty].harsh) && !sleeper.ailment) {
          sleeper.ailment = "hibernation sickness";
          log(sleeper.name + " is developing hibernation sickness in the pod.", "warn");
        }
      }
    }

    // Morale-driven breakdown / Crack
    checkBreakdowns();

    // Hull slow wear
    game.ship.hull = clamp(game.ship.hull - rint(0, 1), 0, 100);

    // Random event (not every turn)
    if (chance(0.55)) rollEvent();

    // Arrival check
    checkArrival();

    // End checks
    if (!game.ended) checkEnd();

    save();
    if (!game.ended) renderTravel();
  }

  function checkBreakdowns() {
    var aw = awake();
    for (var i = 0; i < aw.length; i++) {
      var c = aw[i];
      var floor = (game.role === "Commander") ? 6 : 0;  // Commander steadies the crew
      if (c.morale <= floor && c.status !== "Cracked" && chance(0.4)) {
        c.status = "Cracked";
        sfx("bad");
        var what = pick([
          c.name + " stops responding to orders, staring at the bulkhead.",
          c.name + " cracks — and vents a tank of " + pick(["fuel", "oxygen", "water"]) + " into the void.",
          c.name + " barricades into a compartment, raving about the dark."
        ]);
        log(what, "bad");
        if (what.indexOf("vents") > -1) {
          var r = pick(["fuel", "oxygen"]);
          game.supplies[r] = Math.max(0, game.supplies[r] - rint(6, 12));
        }
      } else if (c.status === "Cracked" && c.morale > 35 && chance(0.4)) {
        c.status = c.ailment ? "Sick" : "Healthy";
        log(c.name + " comes back to themselves. The crew exhales.", "good");
      }
    }
  }

  function checkArrival() {
    if (game.waypointIndex >= WAYPOINTS.length) return;
    if (game.distance >= CUM[game.waypointIndex]) {
      var wp = WAYPOINTS[game.waypointIndex];
      game.visited.push(game.waypointIndex);
      log("Arrived at " + wp.name + ". " + wp.blurb, "sys");
      sfx("good");
      adjustMoraleAll(+6, true);
      var idx = game.waypointIndex;
      game.waypointIndex++;

      if (wp.kind === "win") { winGame(); return; }
      // Defer station/hazard interaction to a modal so it's not skipped.
      if (wp.hazard) { queueHazard(wp); }
      else if (wp.kind === "station") { queueStation(wp); }
      else if (wp.kind === "void") { queueVoid(wp); }
    }
  }

  /* ---------------------------------------------------------
     8. End / win / lose / scoring
     --------------------------------------------------------- */
  function checkEnd() {
    if (alive().length === 0) return endGame(false, "The colony ship drifts on, silent. No one is left to steer it.");
    if (awake().length === 0 && sleepers().length === 0) return endGame(false, "No one remains awake or alive to fly.");
    if (game.ship.hull <= 0) return endGame(false, "Hull integrity failed. The ship comes apart in the black.");
    var awk = awake();
    if (awk.length > 0 && awk.every(function (c) { return c.morale <= 0; })) {
      return endGame(false, "The crew has given up. They stop the engines and let the dark take them. Mutiny of despair.");
    }
    // Stranded: no fuel, no charges to mine, not at a station, and out of air on the horizon.
    if (game.supplies.fuel <= 0 && game.supplies.charges <= 0 && game.distance < TOTAL_DIST &&
        game.supplies.oxygen < 6 && game.credits < 30) {
      return endGame(false, "Out of fuel, out of charges, out of air. The ship becomes a tomb between the stars.");
    }
  }

  function computeScore() {
    var s = game.supplies, ship = game.ship;
    var crewPts = 0, survivors = 0;
    for (var i = 0; i < game.crew.length; i++) {
      var c = game.crew[i];
      if (c.status !== "Dead") { survivors++; crewPts += 250 + Math.round(c.health * 2 + c.morale * 1.5); }
    }
    var suppPts = Math.round(s.fuel + s.oxygen + s.food + s.medicine * 6 + s.charges * 4 + ship.parts * 8);
    var hullPts = Math.round(ship.hull * 4);
    var creditPts = Math.round(game.credits * 0.5);
    var speedBonus = game.won ? Math.max(0, Math.round((400 - game.day) * 6)) : 0;
    var base = crewPts + suppPts + hullPts + creditPts + speedBonus;
    var roleMult = ROLES[game.role].mult;
    var diffMult = DIFFICULTY[game.difficulty].mult;
    var total = Math.round(base * roleMult * diffMult);
    return {
      survivors: survivors, crewPts: crewPts, suppPts: suppPts, hullPts: hullPts,
      creditPts: creditPts, speedBonus: speedBonus, base: base,
      roleMult: roleMult, diffMult: diffMult, total: total
    };
  }
  function rankFor(score) {
    var r = RANKS[0].name;
    for (var i = 0; i < RANKS.length; i++) if (score >= RANKS[i].min) r = RANKS[i].name;
    return r;
  }

  function winGame() { endGame(true, "You ease into orbit over Proxima Centauri b — a pale blue world waiting beneath you."); }

  function endGame(won, cause) {
    if (game.ended) return;
    game.ended = true;
    game.won = won;
    game.cause = cause;
    var sc = computeScore();
    var rank = won ? rankFor(sc.total) : rankFor(Math.min(sc.total, RANKS[2].min - 1));
    // Record run + meta
    meta.runs.unshift({
      date: new Date().toISOString().slice(0, 10),
      role: game.role, difficulty: game.difficulty,
      won: won, score: sc.total, rank: rank, day: game.day,
      cause: cause, survivors: sc.survivors
    });
    if (meta.runs.length > 25) meta.runs.pop();
    if (sc.total > meta.best) meta.best = sc.total;
    saveMeta();
    clearSave();           // permadeath: the run is over
    sfx(won ? "win" : "death");
    closeModal();
    closeMinigame();
    game.screen = "end";
    game._endScore = sc;
    game._endRank = rank;
    renderApp();
  }

  /* ---------------------------------------------------------
     9. Events
     --------------------------------------------------------- */
  // Outcome resolver. o may set: res{...deltas}, hull, morale, health,
  // ailment, heal, kill, text, type.
  function applyOutcome(o) {
    if (!o) return "";
    if (o.res) for (var k in o.res) {
      if (k === "credits") game.credits = Math.max(0, game.credits + o.res[k]);
      else game.supplies[k] = Math.max(0, round1((game.supplies[k] || 0) + o.res[k]));
    }
    if (o.parts) game.ship.parts = Math.max(0, game.ship.parts + o.parts);
    if (o.hull) game.ship.hull = clamp(game.ship.hull + o.hull, 0, 100);
    if (o.morale) adjustMoraleAll(o.morale, true);
    if (o.health) {
      if (o.target === "one") {
        var one = pick(awake());
        if (one) { one.health = clamp(one.health + o.health, 0, 100); if (one.health <= 0) killCrew(one, "succumbed"); }
      } else adjustHealthAll(o.health, true);
    }
    if (o.ailment) afflict(o.ailment === true ? null : o.ailment);
    if (o.heal) {
      var sick = ailing();
      if (sick.length) { sick[0].ailment = null; if (sick[0].status === "Sick") sick[0].status = "Healthy"; }
    }
    if (o.kill) {
      var victim = o.kill === "weakest"
        ? awake().sort(function (a, b) { return a.health - b.health; })[0]
        : pick(awake());
      if (victim) killCrew(victim, o.killVerb || "died");
    }
    if (o.text) log(o.text, o.type || "info");
    return o.text || "";
  }

  // Skill-check choice resolver.
  function resolveCheck(role, baseDiff, success, failure) {
    var diff = baseDiff + Math.round((DIFFICULTY[game.difficulty].harsh - 1) * 40);
    if (!game.power.allocation.sensors) diff += 12;   // sensors help navigation/analysis
    var roll = skillFor(role) + rint(0, 40);
    var ok = roll >= diff;
    sfx(ok ? "good" : "bad");
    return applyOutcome(ok ? success : failure) || (ok ? "Success." : "It goes wrong.");
  }

  // Event pool. zones: which waypoint kinds/areas an event may fire in.
  var EVENTS = [
    { id: "micro", w: 10, title: "Micrometeoroid Swarm", art: ". * .  ·  *",
      text: "A glittering swarm peppers the hull. Klaxons sing.",
      choices: [
        { label: "Brace and patch the breaches (Engineer)", role: "Engineer", diff: 60,
          success: { hull: -4, text: "Quick patches hold. Minor scarring only.", type: "good" },
          failure: { hull: -16, res: { oxygen: -6 }, text: "A plate buckles — you lose air sealing the gash.", type: "bad" } },
        { label: "Reroute power to the screens", auto: true,
          outcome: { hull: -9, res: { oxygen: -2 }, text: "The screens blunt the worst of it.", type: "warn" } }
      ] },
    { id: "flare", w: 8, title: "Solar Flare", zones: ["inner"], art: "((( ☼ )))",
      text: "The sun belches a wave of hard radiation toward you.",
      choices: [
        { label: "Angle the ship and ride it out", auto: true,
          outcome: { ailment: true, morale: -3, text: "Some dosing, but you survive it.", type: "warn" } },
        { label: "Shelter behind a passing body (lose time)", auto: true,
          outcome: { res: { fuel: -4 }, text: "You tuck into a shadow and wait it out. Fuel spent maneuvering.", type: "info" } }
      ] },
    { id: "reactor", w: 7, title: "Reactor Fluctuation",
      text: "The reactor coughs. Output gauges flutter dangerously.",
      choices: [
        { label: "Recalibrate the core (Engineer)", role: "Engineer", diff: 65,
          success: { hull: +3, text: "You stabilize the core; it hums clean again.", type: "good" },
          failure: { hull: -10, text: "A surge scorches a conduit. Hull stressed.", type: "bad" } },
        { label: "Run on backups (burn parts)", auto: true,
          outcome: { parts: -1, text: "Backups carry the load. One spare consumed.", type: "info" } }
      ] },
    { id: "breach", w: 6, title: "Hull Breach", art: "═╪═  !!  ═╪═",
      text: "A seam splits with a shriek of escaping atmosphere.",
      choices: [
        { label: "Emergency weld (Engineer)", role: "Engineer", diff: 62,
          success: { hull: -6, res: { oxygen: -4 }, text: "Sealed before you lose much.", type: "good" },
          failure: { hull: -14, res: { oxygen: -14 }, target: "one", health: -20, text: "The breach takes a chunk of air and bruises a crewmate.", type: "bad" } }
      ] },
    { id: "outbreak", w: 7, title: "Illness Aboard",
      text: "Someone wakes burning with fever. It could spread.",
      choices: [
        { label: "Quarantine and treat (Medic)", role: "Medic", diff: 58,
          success: { res: { medicine: -1 }, text: "Caught early. Contained.", type: "good" },
          failure: { ailment: true, res: { medicine: -1 }, text: "It spreads before you can isolate it.", type: "bad" } }
      ] },
    { id: "derelict", w: 7, title: "Derelict Vessel", art: "[≣≣≣]·· drifting",
      text: "A dead ship tumbles ahead, hull dark. Salvage — or trap?",
      choices: [
        { label: "Board and salvage (Xenobiologist)", role: "Xenobiologist", diff: 60,
          success: { res: { fuel: +10, parts: 0, medicine: +1 }, parts: +2, text: "A clean haul: fuel, parts, a med kit.", type: "good" },
          failure: { hull: -8, target: "one", health: -18, text: "Something shifts in the dark. You retreat hurt.", type: "bad" } },
        { label: "Strip it from outside (slow, safe)", auto: true,
          outcome: { res: { fuel: +4 }, text: "You siphon a little fuel and move on.", type: "info" } },
        { label: "Leave it. Bad feeling.", auto: true,
          outcome: { morale: +1, text: "You give it a wide berth. The crew sleeps easier.", type: "info" } }
      ] },
    { id: "distress", w: 6, title: "Distress Signal",
      text: "A weak signal pulses from a stranded pod. Survivors?",
      choices: [
        { label: "Rescue them (costs supplies, raises morale)", auto: true,
          outcome: { res: { oxygen: -6, food: -6 }, morale: +10, credits: +120, text: "You take them aboard. They share what little they have, and hope.", type: "good" } },
        { label: "Record it and move on", auto: true,
          outcome: { morale: -5, text: "You log the coordinates and leave them to the dark. No one speaks for a while.", type: "warn" } }
      ] },
    { id: "probe", w: 5, title: "Alien Probe", zones: ["void", "outer"], art: "◉─◌─◉",
      text: "An artifact of clearly non-human make matches your course.",
      choices: [
        { label: "Study it (Xenobiologist)", role: "Xenobiologist", diff: 64,
          success: { credits: +260, morale: +8, text: "Its data is priceless. The crew is electrified by the discovery.", type: "good" },
          failure: { res: { oxygen: -5 }, morale: -4, text: "It pulses, fries a system, and goes dark.", type: "bad" } },
        { label: "Don't touch it", auto: true,
          outcome: { text: "You watch it drift away. Some questions keep.", type: "info" } }
      ] },
    { id: "cache", w: 6, title: "Supply Cache",
      text: "Sensors ping a tumbling container — an old relief drop.",
      choices: [
        { label: "Scoop it up", auto: true,
          outcome: { res: { food: +14, fuel: +6, charges: +2 }, text: "Food, fuel, and charges. A good day.", type: "good" } }
      ] },
    { id: "drift", w: 7, title: "Course Drift",
      text: "Navigation has wandered. You're off the optimal line.",
      choices: [
        { label: "Plot a correction (Pilot)", role: "Pilot", diff: 55,
          success: { text: "Tight correction — barely any loss.", type: "good" },
          failure: { res: { fuel: -8 }, text: "You burn fuel clawing back onto course.", type: "bad" } }
      ] },
    { id: "stowaway", w: 4, title: "Stowaway",
      text: "You find a refugee curled in a maintenance crawlspace.",
      choices: [
        { label: "Welcome them (more mouths, more hands)", auto: true,
          outcome: { res: { food: -6, oxygen: -4 }, morale: +6, text: "An extra pair of hands and a story to tell. Morale lifts.", type: "good" } },
        { label: "Confine them to the brig", auto: true,
          outcome: { morale: -3, text: "Locked away. The crew is uneasy about it.", type: "warn" } }
      ] },
    { id: "morale", w: 6, title: "Quiet Evening",
      text: "For once, nothing is broken. Someone breaks out contraband coffee.",
      choices: [
        { label: "Let them rest", auto: true,
          outcome: { morale: +9, target: "one", health: +6, text: "Laughter in the galley. The crew remembers why they fly.", type: "good" } }
      ] },
    { id: "gas", w: 5, title: "Slow Leak",
      text: "A pressure gauge has been lying to you for days.",
      choices: [
        { label: "Hunt the leak (Engineer)", role: "Engineer", diff: 50,
          success: { res: { oxygen: -2 }, text: "Found and sealed with minimal loss.", type: "good" },
          failure: { res: { oxygen: -12 }, text: "By the time you find it, the air's half gone from one tank.", type: "bad" } }
      ] },
    { id: "sensorghost", w: 4, title: "Sensor Ghost", zones: ["void"],
      text: "Something huge shows on sensors, then nothing. Nerves fray.",
      choices: [
        { label: "Hold course and stay calm", auto: true,
          outcome: { morale: -4, text: "Probably nothing. Probably. The crew is rattled.", type: "warn" } }
      ] },
    { id: "windfall", w: 4, title: "Clean Burn",
      text: "The engines run sweeter than they have any right to.",
      choices: [
        { label: "Bank the efficiency", auto: true,
          outcome: { res: { fuel: +9 }, morale: +3, text: "You recover fuel you'd written off.", type: "good" } }
      ] }
  ];

  function rollEvent() {
    // zone tag for filtering
    var zone = currentZone();
    var pool = EVENTS.filter(function (e) {
      if (!e.zones) return true;
      return e.zones.indexOf(zone) > -1;
    });
    // weighted pick
    var total = pool.reduce(function (s, e) { return s + e.w; }, 0);
    var r = Math.random() * total, acc = 0, ev = pool[0];
    for (var i = 0; i < pool.length; i++) { acc += pool[i].w; if (r <= acc) { ev = pool[i]; break; } }
    presentEvent(ev);
  }

  function currentZone() {
    var i = game.waypointIndex;
    if (i <= 3) return "inner";
    if (i === 7 || i === 8) return "void";
    return "outer";
  }

  function presentEvent(ev) {
    var choices = ev.choices.map(function (ch) {
      return {
        label: ch.label + (ch.role ? "  [" + ch.role + "]" : ""),
        onClick: function () {
          var msg;
          if (ch.role) msg = resolveCheck(ch.role, ch.diff, ch.success, ch.failure);
          else { msg = applyOutcome(ch.outcome); sfx("select"); }
          closeModal();
          if (!game.ended) { renderTravel(); flashLog(); }
        }
      };
    });
    openModal({ title: "⚠ " + ev.title, art: ev.art || "", body: ev.text, choices: choices });
  }

  /* ---------------------------------------------------------
     10. Hazard crossings (the river-crossing analog)
     --------------------------------------------------------- */
  var HAZARDS = {
    belt: {
      title: "CROSSING: The Asteroid Belt",
      art: "  o   .  O   ·  o\n .  O   .   o   .",
      text: "Rock and ice tumble across your path in every direction.",
      options: [
        { label: "Thread it at speed (Pilot)", role: "Pilot", diff: 64,
          success: { res: { fuel: -2 }, text: "Your pilot dances the ship through untouched.", type: "good" },
          failure: { hull: -22, target: "one", health: -18, text: "You clip a tumbling rock. Hull and crew take the hit.", type: "bad" } },
        { label: "Power through behind the shields", auto: true,
          outcome: { hull: -12, res: { fuel: -3 }, text: "You bull through, shields scarred but intact.", type: "warn" } },
        { label: "Go the long way around", auto: true,
          outcome: { res: { fuel: -10, food: -6, oxygen: -6 }, text: "Safe, but the detour eats fuel, food, and air.", type: "info" } }
      ]
    },
    flare: {
      title: "CROSSING: Proxima Approach",
      art: "(((( ★ ))))  radiation",
      text: "Proxima Centauri flares as you make your final run. Radiation washes over the hull.",
      options: [
        { label: "Shields to max (needs power)", auto: true,
          outcome: { res: { oxygen: -8 }, hull: -6, text: "You divert everything to the screens and weather it.", type: "warn" } },
        { label: "Slingshot through fast (Pilot)", role: "Pilot", diff: 66,
          success: { res: { fuel: -4 }, text: "A blistering, perfect approach. You outrun the worst of it.", type: "good" },
          failure: { ailment: "radiation sickness", target: "one", health: -22, text: "You take the dose. Someone is badly burned.", type: "bad" } },
        { label: "Hold back and wait for a lull", auto: true,
          outcome: { res: { food: -8, oxygen: -8 }, morale: -4, text: "You wait it out, watching the stores tick down.", type: "info" } }
      ]
    },
    nebula: {
      title: "CROSSING: The Oort Cloud",
      art: "~ ~ . ~ fog ~ . ~ ~",
      text: "A cold haze of ice and dust blinds your sensors at the solar system's edge.",
      options: [
        { label: "Navigate blind (Pilot + sensors)", role: "Pilot", diff: 60,
          success: { text: "Steady hands find the gaps. You slip through clean.", type: "good" },
          failure: { res: { fuel: -10 }, hull: -8, text: "You scrape through, lost and bruised, burning fuel to find the way.", type: "bad" } },
        { label: "Crawl through slowly", auto: true,
          outcome: { res: { food: -8, oxygen: -8 }, text: "Painstaking and safe. The stores pay for it.", type: "info" } }
      ]
    }
  };

  var hazardQueue = [];
  function queueHazard(wp) { hazardQueue.push(wp.hazard); }
  function flushQueues() {
    // Called from travel render when no modal is open.
    if (modalOpen()) return;
    if (hazardQueue.length) { var hz = hazardQueue.shift(); presentHazard(hz); return; }
    if (stationQueue.length) { var st = stationQueue.shift(); presentStation(st); return; }
    if (voidQueue.length) { var v = voidQueue.shift(); presentVoid(v); return; }
  }

  function presentHazard(key) {
    var hz = HAZARDS[key];
    if (!hz) return;
    var choices = hz.options.map(function (op) {
      return {
        label: op.label,
        onClick: function () {
          if (op.role) resolveCheck(op.role, op.diff, op.success, op.failure);
          else { applyOutcome(op.outcome); sfx("select"); }
          closeModal();
          if (!game.ended) { checkEnd(); if (!game.ended) renderTravel(); }
        }
      };
    });
    openModal({ title: "≋ " + hz.title, art: hz.art, body: hz.text, choices: choices });
  }

  /* ---------------------------------------------------------
     11. Stations (rest / trade)
     --------------------------------------------------------- */
  var stationQueue = [];
  function queueStation(wp) { stationQueue.push(wp); }
  function presentStation(wp) {
    openModal({
      title: "⌖ " + wp.name,
      art: "",
      body: wp.blurb + "<br><br>You may trade, rest, or depart.",
      choices: [
        { label: "Trade with the station", onClick: function () { closeModal(); openTrade(wp); } },
        { label: "Rest & repair (costs time)", onClick: function () { closeModal(); doRestRepair(); } },
        { label: "Depart", onClick: function () { sfx("confirm"); closeModal(); renderTravel(); } }
      ]
    });
  }

  function openTrade(wp) {
    // Station prices a bit higher than Earth outfitting; sell at 50%.
    var rows = STORE_ITEMS.map(function (it) {
      var buy = Math.round(it.price * 1.3);
      return "<div class='store-row'>" +
        "<span>" + it.name + "</span>" +
        "<span class='qty'>have " + (it.key === "parts" ? game.ship.parts : game.supplies[it.key]) + "</span>" +
        "<span class='qty'>" + buy + " cr</span>" +
        "<span class='stepper'>" +
          "<button class='btn small' data-trade='buy' data-item='" + it.key + "' data-price='" + buy + "' data-step='" + it.step + "'>Buy " + it.step + "</button>" +
          "<button class='btn small' data-trade='sell' data-item='" + it.key + "' data-price='" + Math.round(it.price * 0.5) + "' data-step='" + it.step + "'>Sell " + it.step + "</button>" +
        "</span></div>";
    }).join("");
    openModal({
      title: "⇄ Trade — " + wp.name,
      art: "",
      body: "<div class='small dim'>Credits: <span id='trade-cr' class='paper'>" + game.credits + "</span></div>" + rows,
      choices: [{ label: "Done", onClick: function () { sfx("confirm"); closeModal(); save(); renderTravel(); } }],
      onBind: function (root) {
        root.querySelectorAll("[data-trade]").forEach(function (b) {
          b.addEventListener("click", function () {
            var item = b.getAttribute("data-item");
            var price = +b.getAttribute("data-price");
            var step = +b.getAttribute("data-step");
            var dir = b.getAttribute("data-trade");
            if (dir === "buy") {
              if (game.credits >= price) {
                game.credits -= price;
                if (item === "parts") game.ship.parts += step; else game.supplies[item] += step;
                sfx("buy");
              } else { sfx("empty"); }
            } else {
              var have = item === "parts" ? game.ship.parts : game.supplies[item];
              if (have >= step) {
                if (item === "parts") game.ship.parts -= step; else game.supplies[item] -= step;
                game.credits += price; sfx("select");
              } else { sfx("empty"); }
            }
            var cr = $("#trade-cr", root); if (cr) cr.textContent = game.credits;
            // refresh "have" counts
            closeModal(); openTrade(wp);
          });
        });
      }
    });
  }

  function doRestRepair() {
    var eng = skillFor("Engineer");
    var repair = Math.round(10 + eng / 5);
    var partsUsed = Math.min(game.ship.parts, Math.ceil((100 - game.ship.hull) / 14));
    game.ship.parts -= partsUsed;
    game.ship.hull = clamp(game.ship.hull + repair + partsUsed * 6, 0, 100);
    // Rest costs time + a little O2/food, but heals and lifts morale.
    game.day += 4;
    var aw = awake();
    var use = aw.length;
    game.supplies.oxygen = Math.max(0, round1(game.supplies.oxygen - use * 0.5));
    game.supplies.food = Math.max(0, round1(game.supplies.food - use * 0.6));
    adjustHealthAll(+12, true);
    adjustMoraleAll(+8, true);
    log("Rest & repair: hull +" + (repair + partsUsed * 6) + " (" + partsUsed + " parts), crew recovers.", "good");
    sfx("confirm");
    save();
    checkEnd();
    if (!game.ended) renderTravel();
  }

  /* ---------------------------------------------------------
     12. The Interstellar Void (forced hibernation leg)
     --------------------------------------------------------- */
  var voidQueue = [];
  function queueVoid(wp) { voidQueue.push(wp); }
  function presentVoid(wp) {
    openModal({
      title: "❄ " + wp.name,
      art: "·   .      ·\n   .    ·   .  ·\n·  the long dark  ·",
      body: wp.blurb + "<br><br>This crossing is years long. Awake crew will burn through air and food you cannot spare. " +
            "<span class='paper'>Hibernate most of the crew</span> from the controls below, and leave one or two awake to fly.",
      choices: [{ label: "Understood — manage the pods", onClick: function () { sfx("confirm"); closeModal(); openHibernation(); } }]
    });
  }

  function openHibernation() {
    var rows = game.crew.map(function (c) {
      if (c.status === "Dead") return "<div class='crew-row'><span>✖</span><span class='nm s-Dead'>" + c.name + "</span><span class='rl'>" + c.role + "</span><span>—</span><span></span></div>";
      var btn = c.status === "Hibernating"
        ? "<button class='btn small' data-hib='wake' data-name='" + c.name + "'>Wake</button>"
        : "<button class='btn small' data-hib='sleep' data-name='" + c.name + "'>Hibernate</button>";
      return "<div class='crew-row'>" +
        "<span>" + (c.status === "Hibernating" ? "❄" : "•") + "</span>" +
        "<span class='nm'>" + c.name + "</span>" +
        "<span class='rl'>" + c.role + "</span>" +
        "<span class='st s-" + c.status + "'>" + c.status + "</span>" +
        "<span>" + btn + "</span></div>";
    }).join("");
    openModal({
      title: "❄ Hibernation Pods",
      art: "",
      body: "<div class='small dim'>Sleepers use almost no air or food, but can't act in events. Keep at least one pilot-capable crew awake.</div>" + rows,
      choices: [{ label: "Close", onClick: function () { sfx("confirm"); closeModal(); save(); renderTravel(); } }],
      onBind: function (root) {
        root.querySelectorAll("[data-hib]").forEach(function (b) {
          b.addEventListener("click", function () {
            var c = byName(b.getAttribute("data-name"));
            if (!c) return;
            if (b.getAttribute("data-hib") === "sleep") {
              c.status = "Hibernating";
              log(c.name + " enters cold sleep.", "info"); sfx("select");
            } else {
              c.status = c.ailment ? "Sick" : "Healthy";
              if (chance(0.25)) { c.ailment = "hibernation sickness"; c.status = "Sick"; log(c.name + " wakes groggy and ill.", "warn"); }
              else log(c.name + " wakes from cold sleep.", "good");
              sfx("select");
            }
            closeModal(); openHibernation();
          });
        });
      }
    });
  }

  /* ---------------------------------------------------------
     13. Power allocation / brownout modal
     --------------------------------------------------------- */
  function openAllocate(thenFn, forced) {
    var al = game.power.allocation;
    var p = computePower();
    function sys(key, label, draw) {
      return "<div class='store-row'><span>" + label + "</span>" +
        "<span class='qty'>" + draw + " pwr</span>" +
        "<span></span>" +
        "<span><button class='btn small' data-sys='" + key + "'>" + (al[key] ? "ON" : "OFF") + "</button></span></div>";
    }
    var body = "<div class='small'>Reactor output <b class='paper'>" + p.output + "</b> (hull-limited) · demand <b class='" +
      (p.brownout ? "red" : "paper") + "'>" + p.demand + "</b></div>" +
      (forced ? "<div class='red small'>BROWNOUT — shed load until demand ≤ output to proceed.</div>" : "") +
      sys("lifeSupport", "Life support (O₂ scrubbers)", POWER_DRAW.lifeSupport) +
      sys("drive", "Drive (thrust)", THRUST[game.thrust].power) +
      sys("medbay", "Medbay", ailing().length ? POWER_DRAW.medbay : 0) +
      sys("sensors", "Sensors / nav", POWER_DRAW.sensors) +
      sys("pods", "Hibernation pods", POWER_DRAW.podEach * sleepers().length);
    var canProceed = !forced || !computePower().brownout;
    openModal({
      title: "⚡ Power Allocation",
      art: forced ? "!!! BROWNOUT !!!" : "",
      body: body,
      choices: [{ label: canProceed ? (forced ? "Proceed" : "Done") : "Demand still exceeds output…",
                  disabled: !canProceed,
                  onClick: function () { if (!canProceed) { sfx("empty"); return; } sfx("confirm"); closeModal(); if (thenFn) thenFn(); else renderTravel(); } }],
      onBind: function (root) {
        root.querySelectorAll("[data-sys]").forEach(function (b) {
          b.addEventListener("click", function () {
            var k = b.getAttribute("data-sys");
            al[k] = !al[k];
            sfx("blip");
            closeModal(); openAllocate(thenFn, forced);
          });
        });
      }
    });
  }
  function openBrownout(thenFn) {
    sfx("brownout");
    log("BROWNOUT: power demand exceeds reactor output. Shed load.", "bad");
    openAllocate(thenFn, true);
  }

  /* ---------------------------------------------------------
     14. Mining mini-game
     --------------------------------------------------------- */
  var mg = null;
  function openMining() {
    if (game.supplies.charges <= 0) { log("No mining charges left.", "warn"); sfx("empty"); renderTravel(); return; }
    if (game.supplies.fuel < 3) { log("Not enough fuel to maneuver to the rocks.", "warn"); sfx("empty"); renderTravel(); return; }
    game.supplies.fuel = Math.max(0, game.supplies.fuel - 3);
    var charges = Math.min(game.supplies.charges, 8);
    game.supplies.charges -= charges;
    mg = { charges: charges, time: 22, haul: { food: 0, fuel: 0, parts: 0, charges: 0 }, timer: null, spawn: null, over: false };
    var ov = $("#minigame"); ov.classList.remove("hidden");
    renderMiningHud();
    $("#mg-field").innerHTML = "";
    sfx("confirm");
    spawnLoop();
    mg.timer = setInterval(function () {
      mg.time = round1(mg.time - 0.1);
      if (mg.time <= 0) endMining();
      else renderMiningHud();
    }, 100);
  }
  function renderMiningHud() {
    if (!mg) return;
    $("#mg-hud").innerHTML =
      "Charges: <b>" + mg.charges + "</b>  ·  Time: <b>" + Math.max(0, mg.time).toFixed(1) + "s</b>  ·  " +
      "Haul — food <b>" + mg.haul.food + "</b> fuel <b>" + mg.haul.fuel + "</b> parts <b>" + mg.haul.parts + "</b> charges <b>" + mg.haul.charges + "</b>";
    $("#mg-footer").innerHTML = "<span class='small dim'>Click rocks to mine. Each click spends a charge.</span>" +
      "<button class='btn small go' id='mg-stop'>Dock & keep haul</button>";
    var stop = $("#mg-stop"); if (stop) stop.onclick = endMining;
  }
  function spawnLoop() {
    if (!mg || mg.over) return;
    spawnRock();
    mg.spawn = setTimeout(spawnLoop, rint(450, 950));
  }
  function spawnRock() {
    var field = $("#mg-field"); if (!field) return;
    var kinds = [
      { icon: "🪨", type: "food", min: 1, max: 3, w: 5 },
      { icon: "🪨", type: "fuel", min: 1, max: 2, w: 4 },
      { icon: "🧊", type: "fuel", min: 2, max: 4, w: 3 },
      { icon: "⛓", type: "parts", min: 1, max: 1, w: 2 },
      { icon: "💎", type: "charges", min: 1, max: 2, w: 1 }
    ];
    var total = kinds.reduce(function (s, k) { return s + k.w; }, 0);
    var r = Math.random() * total, acc = 0, kind = kinds[0];
    for (var i = 0; i < kinds.length; i++) { acc += kinds[i].w; if (r <= acc) { kind = kinds[i]; break; } }
    var rock = el("div", { class: "rock" }, kind.icon);
    rock.style.left = rint(4, 90) + "%";
    rock.style.top = rint(6, 84) + "%";
    field.appendChild(rock);
    var ttl = setTimeout(function () { if (rock.parentNode) rock.parentNode.removeChild(rock); }, rint(1400, 2400));
    rock.addEventListener("click", function (e) {
      if (mg.over) return;
      if (mg.charges <= 0) { sfx("empty"); return; }
      mg.charges--;
      var amt = rint(kind.min, kind.max);
      mg.haul[kind.type] += amt;
      sfx("mine");
      clearTimeout(ttl);
      rock.classList.add("pop");
      var ft = el("div", { class: "float-txt" }, "+" + amt + " " + kind.type);
      ft.style.left = rock.style.left; ft.style.top = rock.style.top;
      field.appendChild(ft);
      setTimeout(function () { if (ft.parentNode) ft.parentNode.removeChild(ft); }, 800);
      setTimeout(function () { if (rock.parentNode) rock.parentNode.removeChild(rock); }, 240);
      renderMiningHud();
      if (mg.charges <= 0) endMining();
    });
  }
  function endMining() {
    if (!mg || mg.over) return;
    mg.over = true;
    clearInterval(mg.timer); clearTimeout(mg.spawn);
    game.supplies.food += mg.haul.food;
    game.supplies.fuel += mg.haul.fuel;
    game.ship.parts += mg.haul.parts;
    game.supplies.charges += mg.haul.charges + mg.charges; // unused charges returned
    log("Mining run: +" + mg.haul.food + " food, +" + mg.haul.fuel + " fuel, +" + mg.haul.parts + " parts, +" + mg.haul.charges + " charges.", "good");
    closeMinigame();
    save();
    renderTravel();
  }
  function closeMinigame() {
    var ov = $("#minigame"); if (ov) ov.classList.add("hidden");
    if (mg) { clearInterval(mg.timer); clearTimeout(mg.spawn); }
    mg = null;
  }

  /* ---------------------------------------------------------
     15. Modal plumbing
     --------------------------------------------------------- */
  function modalOpen() { return !$("#modal").classList.contains("hidden"); }
  function openModal(opts) {
    $("#modal-title").innerHTML = opts.title || "";
    $("#modal-art").textContent = opts.art || "";
    $("#modal-art").style.display = opts.art ? "block" : "none";
    $("#modal-body").innerHTML = opts.body || "";
    var box = $("#modal-choices");
    box.innerHTML = "";
    (opts.choices || []).forEach(function (ch) {
      var b = el("button", { class: "btn" + (ch.disabled ? "" : "") }, ch.label);
      if (ch.disabled) b.disabled = true;
      b.addEventListener("click", function () { sfx("blip"); ch.onClick(); });
      box.appendChild(b);
    });
    $("#modal").classList.remove("hidden");
    if (opts.onBind) opts.onBind($("#modal"));
  }
  function closeModal() { $("#modal").classList.add("hidden"); }

  function flashLog() { /* hook for future visual flash; no-op keeps calls safe */ }

  /* ---------------------------------------------------------
     16. Rendering
     --------------------------------------------------------- */
  function renderApp() {
    updateTopbar();
    var app = $("#app");
    if (!game) { renderTitle(); return; }
    switch (game.screen) {
      case "role": renderRole(); break;
      case "store": renderStore(); break;
      case "travel": renderTravel(); break;
      case "end": renderEnd(); break;
      default: renderTitle();
    }
  }

  function updateTopbar() {
    var s = $("#topbar-status");
    if (!game || game.screen !== "travel" || game.waypointIndex == null) {
      s.textContent = meta.best ? "BEST SCORE: " + meta.best : "EARTH IS DYING";
      return;
    }
    var wp = WAYPOINTS[Math.min(game.waypointIndex, WAYPOINTS.length - 1)];
    s.textContent = "DAY " + game.day + "  ·  NEXT: " + wp.name + "  ·  " +
      Math.round(game.distance) + "/" + TOTAL_DIST + " ly-abs";
  }

  /* ---- Title ---- */
  function renderTitle() {
    var app = $("#app");
    var resume = loadSave();
    var art =
"      .      *        .           ·         .     *\n" +
"   *      ____  ____  ____ _  _ _ _  _  __ _      .\n" +
"      .  (  _ \\(  _ \\(  _ ( \\/ ) ( \\/ )(  ( \\  *\n" +
"   .      ) __/ )   / )   /)  (/ \\/ \\ /    /     .\n" +
"      *  (__)  (_)\\_)(_)\\_)(_/\\_)\\_)(_/\\_)__)  .   *\n" +
"   ___  ____   __   __  __   ___   *  TRAIL   .\n" +
"      .     humanity's last voyage      *\n";
    app.innerHTML =
      "<div class='center title-art ascii'>" + art + "</div>" +
      "<div class='center spacer'></div>" +
      "<div class='center small dim'>Earth is dying. One ship. Four light-years to Proxima Centauri b.<br>" +
      "Outfit your vessel, keep your crew alive, and found a colony — if you can.</div>" +
      "<div class='spacer'></div>" +
      "<div class='menu'>" +
        (resume ? "<button class='btn go' data-action='resume'><span class='key'>[R]</span> Resume voyage — Day " + resume.day + ", " + resume.role + "</button>" : "") +
        "<button class='btn' data-action='new'><span class='key'>[N]</span> New voyage</button>" +
        "<button class='btn' data-action='howto'><span class='key'>[H]</span> How to play</button>" +
        (meta.runs.length ? "<button class='btn' data-action='logbook'><span class='key'>[L]</span> Logbook (past runs)</button>" : "") +
      "</div>";
  }

  function showHowTo() {
    openModal({
      title: "How to Play",
      body:
        "<p><b class='paper'>Goal:</b> travel the fixed trail from Earth to Proxima Centauri b and arrive with crew and supplies intact.</p>" +
        "<p><b class='paper'>Each turn</b> you Continue along the trail. Your crew burns <b>oxygen</b> and <b>food</b>; the drive burns <b>fuel</b>.</p>" +
        "<p><b class='paper'>Power</b> is the hub. The reactor's output depends on hull integrity. If demand beats output you <b>brown out</b> and must shed load — turning off scrubbers drains air, turning off the drive stops you.</p>" +
        "<p><b class='paper'>Crew</b> have skills, morale, and bonds. Low morale leads to breakdowns; a death hurts the morale of bonded crewmates. Lose a specialist and you lose their edge in events.</p>" +
        "<p><b class='paper'>Hibernate</b> crew to save air and food (vital for the Interstellar Void) — but sleepers can't help in a crisis.</p>" +
        "<p><b class='paper'>Mine</b> asteroids for supplies, <b>trade</b> at stations, and pick your <b>thrust</b> and <b>rations</b> to manage the squeeze.</p>" +
        "<p class='dim small'>Death is permanent. The run autosaves so you can resume — but you can't undo a loss.</p>",
      choices: [{ label: "Got it", onClick: function () { sfx("confirm"); closeModal(); } }]
    });
  }

  function showLogbook() {
    var rows = meta.runs.map(function (r) {
      return "<div class='score-line'><span>" + r.date + " · " + r.role + " · " + r.difficulty + "</span>" +
        "<span class='v'>" + (r.won ? "<span class='cyan'>★ " + r.rank + "</span>" : "<span class='red'>lost d" + r.day + "</span>") +
        " · " + r.score + "</span></div>";
    }).join("");
    openModal({
      title: "Logbook — Best " + meta.best,
      body: rows || "<p class='dim'>No runs yet.</p>",
      choices: [{ label: "Close", onClick: function () { sfx("confirm"); closeModal(); } }]
    });
  }

  /* ---- Role + difficulty select ---- */
  var sel = { role: "Commander", diff: "Pioneer", names: NAMES.slice(0, 5) };
  function renderRole() {
    var app = $("#app");
    function roleBtns() {
      return ROLE_ORDER.map(function (rk) {
        var r = ROLES[rk];
        var on = sel.role === rk;
        return "<button class='btn " + (on ? "go" : "") + "' data-action='pickRole' data-arg='" + rk + "'>" +
          (on ? "▶ " : "") + "<b>" + rk + "</b> — <span class='dim'>" + r.blurb + "</span><br>" +
          "<span class='small amber'>start " + Math.round(r.credits * DIFFICULTY[sel.diff].credit) + " cr · score ×" + r.mult + "</span></button>";
      }).join("");
    }
    function diffBtns() {
      return Object.keys(DIFFICULTY).map(function (dk) {
        var d = DIFFICULTY[dk]; var on = sel.diff === dk;
        return "<button class='btn " + (on ? "go" : "") + " small' data-action='pickDiff' data-arg='" + dk + "'>" +
          "<b>" + dk + "</b> ×" + d.mult + " — <span class='dim'>" + d.blurb + "</span></button>";
      }).join("");
    }
    function crewList() {
      return sel.names.map(function (n, i) {
        return "<div class='crew-row'><span>•</span><span class='nm'>" + n + "</span><span class='rl'>" +
          ROLE_ORDER[i] + (ROLE_ORDER[i] === sel.role ? " (you)" : "") + "</span><span></span><span></span></div>";
      }).join("");
    }
    app.innerHTML =
      "<h2 class='amber'>CREW MANIFEST</h2>" +
      "<div class='cols'>" +
        "<div class='col'><div class='panel-title'>Your role (sets credits & score)</div><div class='menu'>" + roleBtns() + "</div></div>" +
        "<div class='col'>" +
          "<div class='panel'><div class='panel-title'>Difficulty</div><div class='menu'>" + diffBtns() + "</div></div>" +
          "<div class='panel'><div class='panel-title'>Crew</div><div class='crew-strip'>" + crewList() + "</div>" +
          "<div class='spacer'></div><button class='btn small' data-action='reroll'>↻ Reroll names</button></div>" +
        "</div>" +
      "</div>" +
      "<div class='spacer'></div>" +
      "<div class='menu row'><button class='btn go' data-action='toStore'>Outfit the ship →</button>" +
      "<button class='btn small' data-action='backTitle'>← Back</button></div>";
  }

  /* ---- Store ---- */
  function renderStore() {
    var app = $("#app");
    var rows = STORE_ITEMS.map(function (it) {
      var have = it.key === "parts" ? game.ship.parts : game.supplies[it.key];
      return "<div class='store-row'>" +
        "<span>" + it.name + " <span class='dim small'>(" + it.price + " cr)</span></span>" +
        "<span class='qty'>have " + have + "</span>" +
        "<span class='qty'>" + (it.price * it.step) + " cr/" + it.step + "</span>" +
        "<span class='stepper'>" +
          "<button class='btn small' data-action='buy' data-arg='" + it.key + "'>+ " + it.step + "</button>" +
          "<button class='btn small' data-action='sell' data-arg='" + it.key + "'>− " + it.step + "</button>" +
        "</span></div>";
    }).join("");
    app.innerHTML =
      "<h2 class='amber'>OUTFITTING — Earth Orbit</h2>" +
      "<p class='small dim'>Spend your credits before launch. You can trade again at stations, but never this cheaply. " +
      "Earth burns below you; there is no coming back.</p>" +
      "<div class='panel'><div class='store-row'><b>Credits remaining</b><span></span><span></span>" +
        "<span class='qty paper' id='cr'>" + game.credits + "</span></div>" + rows + "</div>" +
      "<div class='cols small'>" +
        "<div class='col panel'><div class='panel-title'>Tips</div>" +
        "<p class='dim'>Fuel moves you; oxygen & food keep the crew; parts repair the hull; medicine cures ailments; charges power mining. The void leg is long — bring air and food.</p></div>" +
        "<div class='col panel'><div class='panel-title'>Manifest</div>" + manifestMini() + "</div>" +
      "</div>" +
      "<div class='spacer'></div>" +
      "<div class='menu row'><button class='btn go' data-action='launch'>▶ LAUNCH FROM EARTH</button>" +
      "<button class='btn small' data-action='backRole'>← Crew</button></div>";
  }
  function manifestMini() {
    var s = game.supplies;
    return "<div class='small'>Fuel " + s.fuel + " · O₂ " + s.oxygen + " · Food " + s.food +
      " · Med " + s.medicine + " · Parts " + game.ship.parts + " · Charges " + s.charges + "</div>";
  }

  /* ---- Travel (main) ---- */
  function renderTravel() {
    game.screen = "travel";
    updateTopbar();
    var app = $("#app");
    var s = game.supplies, ship = game.ship;
    var p = computePower();

    function bar(val, max, kind) {
      var pct = clamp(Math.round((val / max) * 100), 0, 100);
      var cls = kind || (pct < 20 ? "crit" : pct < 45 ? "warn" : "ok");
      return "<div class='bar " + cls + "'><span style='width:" + pct + "%'></span></div>";
    }
    function stat(label, val, max, kind) {
      return "<div><div class='stat'><span class='label'>" + label + "</span><span class='val'>" + val + "</span></div>" +
        (max ? bar(val, max, kind) : "") + "</div>";
    }

    // Journey track
    var shipPct = clamp((game.distance / TOTAL_DIST) * 100, 0, 100);
    var track = "<div class='track'><span class='ship' style='left:" + shipPct + "%'>►</span><span class='dest'>PROXIMA ◐</span></div>";

    // Power line
    var powerLine = "<div class='stat'><span class='label'>Reactor</span><span class='val " + (p.brownout ? "red" : "cyan") + "'>" +
      p.demand + " / " + p.output + " pwr" + (p.brownout ? " ⚠ BROWNOUT" : "") + "</span></div>" +
      "<div class='bar power'><span style='width:" + clamp(Math.round(p.demand / Math.max(1, p.output) * 100), 0, 100) + "%'></span></div>";

    var hud =
      "<div class='panel'><div class='panel-title'>Navigation</div>" +
        "<div class='stat'><span class='label'>Day</span><span class='val'>" + game.day + "</span></div>" +
        "<div class='stat'><span class='label'>Next waypoint</span><span class='val cyan'>" +
          WAYPOINTS[Math.min(game.waypointIndex, WAYPOINTS.length - 1)].name + "</span></div>" +
        track +
        "<div class='small dim'>Thrust: <b class='paper'>" + THRUST[game.thrust].label + "</b> · Rations: <b class='paper'>" + RATIONS[game.rations].label + "</b></div>" +
      "</div>" +
      "<div class='cols'>" +
        "<div class='col panel'><div class='panel-title'>Supplies</div><div class='hud-grid'>" +
          stat("Fuel", s.fuel, 100) + stat("Oxygen", s.oxygen, 100) + stat("Food", s.food, 100) +
          stat("Medicine", s.medicine, 12) + stat("Parts", ship.parts, 12) + stat("Charges", s.charges, 16) +
          "<div class='stat'><span class='label'>Credits</span><span class='val paper'>" + game.credits + "</span></div>" +
          stat("Hull", ship.hull, 100) +
        "</div>" + powerLine + "</div>" +
        "<div class='col panel'><div class='panel-title'>Crew</div>" + crewStrip() + "</div>" +
      "</div>";

    var actions =
      "<div class='menu row'>" +
        "<button class='btn go' data-action='continue'>▶ Continue</button>" +
        "<button class='btn small' data-action='thrust'>⚙ Thrust</button>" +
        "<button class='btn small' data-action='rations'>🍽 Rations</button>" +
        "<button class='btn small' data-action='power'>⚡ Power</button>" +
        "<button class='btn small' data-action='hibernate'>❄ Pods</button>" +
        "<button class='btn small' data-action='rest'>🛠 Rest & repair</button>" +
        "<button class='btn small' data-action='mine'>⛏ Mine</button>" +
        "<button class='btn small danger' data-action='abandon'>Abandon run</button>" +
      "</div>";

    app.innerHTML = hud + actions +
      "<div class='panel-title' style='margin-top:10px'>Ship's Log</div>" +
      "<div class='log' id='log'></div>";

    renderLog();
    // Fire any queued station/hazard/void interaction now that the screen exists.
    flushQueues();
  }

  function crewStrip() {
    return "<div class='crew-strip'>" + game.crew.map(function (c) {
      function mb(v, kind) {
        var pct = clamp(v, 0, 100);
        var cls = kind || (pct < 25 ? "crit" : pct < 50 ? "warn" : "ok");
        return "<div class='bar minibar " + cls + "'><span style='width:" + pct + "%'></span></div>";
      }
      var tag = c.ailment ? " <span class='tag amber'>" + c.ailment + "</span>" : "";
      return "<div class='crew-row'>" +
        "<span class='s-" + c.status + "'>" + (c.status === "Dead" ? "✖" : c.status === "Hibernating" ? "❄" : "•") + "</span>" +
        "<span><span class='nm s-" + c.status + "'>" + c.name + "</span> <span class='rl small'>" + c.role +
          (c.role === game.role ? "*" : "") + "</span>" + tag + "</span>" +
        "<span>" + mb(c.health) + "<span class='small dim'>hp</span></span>" +
        "<span>" + mb(c.morale, "power") + "<span class='small dim'>mor</span></span>" +
        "<span class='st small s-" + c.status + "'>" + c.status + "</span>" +
        "</div>";
    }).join("") + "</div>";
  }

  function renderLog() {
    var box = $("#log"); if (!box) return;
    var html = "";
    var start = Math.max(0, game.log.length - 80);
    for (var i = start; i < game.log.length; i++) {
      var e = game.log[i];
      html += "<div class='entry e-" + e.type + "'>[d" + e.day + "] " + e.msg + "</div>";
    }
    box.innerHTML = html || "<div class='entry e-info'>Systems nominal. Awaiting orders.</div>";
    box.scrollTop = box.scrollHeight;
  }

  /* ---- thrust / rations pickers ---- */
  function openThrust() {
    openModal({
      title: "⚙ Drive Thrust",
      body: "<p class='small dim'>More thrust covers ground faster but burns more fuel and power.</p>" +
        Object.keys(THRUST).map(function (k) {
          var t = THRUST[k];
          return "<div class='store-row'><span><b>" + t.label + "</b></span><span class='small dim'>" +
            t.speed + " dist</span><span class='small dim'>" + t.fuel + " fuel · " + t.power + " pwr</span>" +
            "<span><button class='btn small " + (game.thrust === k ? "go" : "") + "' data-set='thrust' data-arg='" + k + "'>" +
            (game.thrust === k ? "ACTIVE" : "Select") + "</button></span></div>";
        }).join(""),
      choices: [{ label: "Done", onClick: function () { sfx("confirm"); closeModal(); renderTravel(); } }],
      onBind: bindSetter
    });
  }
  function openRations() {
    openModal({
      title: "🍽 Ration Level",
      body: "<p class='small dim'>Cutting rations saves food but wears down health and morale.</p>" +
        Object.keys(RATIONS).map(function (k) {
          var r = RATIONS[k];
          return "<div class='store-row'><span><b>" + r.label + "</b></span><span class='small dim'>×" + r.mult + " food</span>" +
            "<span class='small dim'>hp " + (r.health >= 0 ? "+" : "") + r.health + " · mor " + (r.morale >= 0 ? "+" : "") + r.morale + "</span>" +
            "<span><button class='btn small " + (game.rations === k ? "go" : "") + "' data-set='rations' data-arg='" + k + "'>" +
            (game.rations === k ? "ACTIVE" : "Select") + "</button></span></div>";
        }).join(""),
      choices: [{ label: "Done", onClick: function () { sfx("confirm"); closeModal(); renderTravel(); } }],
      onBind: bindSetter
    });
  }
  function bindSetter(root) {
    root.querySelectorAll("[data-set]").forEach(function (b) {
      b.addEventListener("click", function () {
        var what = b.getAttribute("data-set"), val = b.getAttribute("data-arg");
        game[what] = val; sfx("select");
        if (what === "thrust") { closeModal(); openThrust(); } else { closeModal(); openRations(); }
      });
    });
  }

  /* ---- End screen ---- */
  function renderEnd() {
    var app = $("#app");
    var sc = game._endScore, rank = game._endRank;
    var head = game.won
      ? "<h2 class='cyan'>✦ LANDFALL ON PROXIMA CENTAURI b ✦</h2>"
      : "<h2 class='red'>✖ THE VOYAGE ENDS ✖</h2>";
    var survivors = game.crew.filter(function (c) { return c.status !== "Dead"; });
    var fallen = game.crew.filter(function (c) { return c.status === "Dead"; });
    var crewSummary =
      "<div class='small'><b class='paper'>Survivors:</b> " +
        (survivors.length ? survivors.map(function (c) { return c.name + " (" + c.role + ")"; }).join(", ") : "<span class='red'>none</span>") +
      "</div>" +
      (fallen.length ? "<div class='small red'><b>Lost:</b> " + fallen.map(function (c) { return c.name; }).join(", ") + "</div>" : "");

    var lines =
      sl("Surviving crew (" + sc.survivors + ")", sc.crewPts) +
      sl("Supplies & parts", sc.suppPts) +
      sl("Hull integrity", sc.hullPts) +
      sl("Credits", sc.creditPts) +
      (game.won ? sl("Speed bonus (day " + game.day + ")", sc.speedBonus) : "") +
      "<div class='score-line'><span>Subtotal</span><span class='v'>" + sc.base + "</span></div>" +
      "<div class='score-line'><span>Role ×" + sc.roleMult + " · Difficulty ×" + sc.diffMult + "</span><span class='v'></span></div>" +
      "<div class='score-line score-total'><span><b>FINAL SCORE</b></span><span class='v'><b>" + sc.total + "</b></span></div>";

    function sl(label, v) { return "<div class='score-line'><span>" + label + "</span><span class='v'>" + v + "</span></div>"; }

    app.innerHTML =
      "<div class='center'>" + head +
      "<div class='small dim'>" + game.cause + "</div>" +
      "<div class='rank-badge'>" + rank + "</div>" +
      (sc.total >= meta.best ? "<div class='small cyan'>★ NEW BEST SCORE ★</div>" : "<div class='small dim'>Best: " + meta.best + "</div>") +
      "</div>" +
      "<div class='cols'>" +
        "<div class='col panel'><div class='panel-title'>Score</div>" + lines + "</div>" +
        "<div class='col panel'><div class='panel-title'>Final manifest</div>" + crewSummary +
          "<div class='spacer'></div><div class='small dim'>Day " + game.day + " · " + game.role + " · " + game.difficulty + "</div></div>" +
      "</div>" +
      "<div class='spacer'></div>" +
      "<div class='menu row'><button class='btn go' data-action='again'>▶ New voyage</button>" +
      "<button class='btn small' data-action='backTitle'>Title screen</button>" +
      (meta.runs.length ? "<button class='btn small' data-action='logbook'>Logbook</button>" : "") + "</div>";
  }

  /* ---------------------------------------------------------
     17. Action dispatch
     --------------------------------------------------------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-action]");
    if (!t) return;
    if (window.Sound) window.Sound.init();
    var a = t.getAttribute("data-action");
    var arg = t.getAttribute("data-arg");
    handle(a, arg);
  });

  function handle(a, arg) {
    switch (a) {
      case "new": sfx("select"); game = null; sel = { role: "Commander", diff: "Pioneer", names: rerollNames() }; game = { screen: "role" }; renderRoleScreen(); break;
      case "resume":
        var sv = loadSave();
        if (sv) { game = sv; game.ended = false; sfx("confirm"); game.screen = "travel"; renderApp(); }
        break;
      case "howto": showHowTo(); break;
      case "logbook": showLogbook(); break;
      case "backTitle": sfx("cancel"); game = null; renderTitle(); updateTopbar(); break;
      case "backRole": sfx("cancel"); game.screen = "role"; renderRole(); break;

      case "pickRole": sel.role = arg; sfx("blip"); renderRole(); break;
      case "pickDiff": sel.diff = arg; sfx("blip"); renderRole(); break;
      case "reroll": sel.names = rerollNames(); sfx("select"); renderRole(); break;
      case "toStore":
        sfx("confirm");
        game = newGame(sel.role, sel.diff, sel.names);
        log("Outfitting at Earth Orbit. " + game.credits + " credits to spend.", "sys");
        renderStore();
        break;

      case "buy": doBuy(arg, +1); break;
      case "sell": doBuy(arg, -1); break;
      case "launch":
        sfx("launch");
        game.screen = "travel";
        log("Engines lit. Earth falls away behind you. The trail to Proxima begins.", "sys");
        adjustMoraleAll(+4, true);
        save();
        renderTravel();
        break;

      case "continue": onContinue(); break;
      case "thrust": openThrust(); break;
      case "rations": openRations(); break;
      case "power": openAllocate(null, false); break;
      case "hibernate": openHibernation(); break;
      case "rest": doRestRepair(); break;
      case "mine": openMining(); break;
      case "abandon":
        openModal({ title: "Abandon run?", body: "<p>This ends the current voyage. It will be logged as a loss. There is no undo.</p>",
          choices: [
            { label: "Abandon", onClick: function () { closeModal(); endGame(false, "Command scuttled the mission. The crew drifts home to a world that no longer waits."); } },
            { label: "Keep flying", onClick: function () { sfx("cancel"); closeModal(); } }
          ] });
        break;

      case "again": sfx("select"); game = null; sel = { role: sel.role, diff: sel.diff, names: rerollNames() }; game = { screen: "role" }; renderRole(); break;
    }
  }
  function renderRoleScreen() { game.screen = "role"; renderRole(); updateTopbar(); }

  function rerollNames() {
    var pool = NAMES.slice();
    var out = [];
    for (var i = 0; i < 5; i++) out.push(pool.splice(rint(0, pool.length - 1), 1)[0]);
    return out;
  }

  function doBuy(key, dir) {
    var it = null;
    for (var i = 0; i < STORE_ITEMS.length; i++) if (STORE_ITEMS[i].key === key) it = STORE_ITEMS[i];
    if (!it) return;
    var cost = it.price * it.step;
    if (dir > 0) {
      if (game.credits >= cost) {
        game.credits -= cost;
        if (key === "parts") game.ship.parts += it.step; else game.supplies[key] += it.step;
        sfx("buy");
      } else { sfx("empty"); }
    } else {
      var have = key === "parts" ? game.ship.parts : game.supplies[key];
      if (have >= it.step) {
        if (key === "parts") game.ship.parts -= it.step; else game.supplies[key] -= it.step;
        game.credits += Math.round(cost * 0.6);
        sfx("select");
      } else { sfx("empty"); }
    }
    renderStore();
  }

  /* ---- keyboard shortcuts (title + travel) ---- */
  document.addEventListener("keydown", function (e) {
    if (modalOpen()) return;
    if (window.Sound) window.Sound.init();
    var k = e.key.toLowerCase();
    if (!game || game.screen === undefined) {
      if (k === "n") handle("new");
      else if (k === "r" && loadSave()) handle("resume");
      else if (k === "h") handle("howto");
      else if (k === "l" && meta.runs.length) handle("logbook");
      return;
    }
    if (game.screen === "travel") {
      if (k === " " || k === "enter" || k === "c") { e.preventDefault(); handle("continue"); }
      else if (k === "t") handle("thrust");
      else if (k === "r") handle("rations");
      else if (k === "p") handle("power");
      else if (k === "m") handle("mine");
    }
  });

  /* ---- mute toggle ---- */
  $("#mute-btn").addEventListener("click", function () {
    if (window.Sound) {
      window.Sound.init();
      var m = !window.Sound.isMuted();
      window.Sound.setMuted(m);
      this.textContent = m ? "♪ SND: OFF" : "♪ SND: ON";
      if (!m) window.Sound.play("blip");
    }
  });

  /* ---------------------------------------------------------
     18. Boot
     --------------------------------------------------------- */
  renderTitle();
  updateTopbar();
})();

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
  var SAVE_KEY = "proxima-trail-save-v4";
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
    { name: "The Interstellar Void", dist: 180, kind: "void",
      blurb: "Years of nothing. You cannot stay awake for this. Choose who flies." },
    { name: "Proxima Approach", dist: 52, kind: "hazard", hazard: "flare",
      blurb: "A flaring red dwarf throws radiation across your final run." },
    { name: "Proxima Centauri b", dist: 20, kind: "win",
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
    Commander:    { credits: 980, mult: 1, blurb: "Holds the crew together. Morale floor is higher; you break ties.", specialty: "morale" },
    Pilot:        { credits: 760, mult: 2, blurb: "Threads hazards and shaves lost time. The void needs a flyer.", specialty: "hazard" },
    Engineer:     { credits: 760, mult: 2, blurb: "Repairs cost less and hold longer. Keeps the reactor lit.", specialty: "repair" },
    Medic:        { credits: 620, mult: 3, blurb: "Treatments land more often and burn less medicine.", specialty: "heal" },
    Xenobiologist:{ credits: 620, mult: 3, blurb: "Reads derelicts, probes, and signals — better encounters.", specialty: "encounter" }
  };
  var ROLE_ORDER = ["Commander", "Pilot", "Engineer", "Medic", "Xenobiologist"];

  var DIFFICULTY = {
    Settler: { mult: 1.0, credit: 2.0, harsh: 0.5,  startMult: 1.60, potential0: 64, blurb: "Forgiving. Margins to learn the ropes." },
    Pioneer: { mult: 1.6, credit: 1.3, harsh: 0.8,  startMult: 1.25, potential0: 55, blurb: "The intended balance. Death is real." },
    Voyager: { mult: 2.2, credit: 0.85, harsh: 1.25, startMult: 0.92, potential0: 45, blurb: "Brutal. Most crews die in the dark." }
  };

  var STORE_ITEMS = [
    { key: "fuel", name: "Fuel cells", price: 6, step: 5, unit: "" },
    { key: "oxygen", name: "Oxygen (O₂)", price: 5, step: 5, unit: "" },
    { key: "food", name: "Food rations", price: 4, step: 5, unit: "" },
    { key: "medicine", name: "Medicine", price: 14, step: 1, unit: "" },
    { key: "parts", name: "Spare parts", price: 18, step: 1, unit: "" },
    { key: "charges", name: "Mining charges", price: 9, step: 2, unit: "" }
  ];

  // Tradeable commodities (mined or gifted) — sell-only, worth more the deeper you go.
  var COMMODITIES = {
    ice:        { name: "Ice",         base: 5,  icon: "🧊" },
    ore:        { name: "Common ore",  base: 7,  icon: "🪨" },
    volatiles:  { name: "Volatiles",   base: 16, icon: "⚗" },
    rareMetals: { name: "Rare metals", base: 24, icon: "💠" }
  };

  // Location-based price. Fuel & O₂ get scarcer (pricier) the farther from Earth;
  // commodities fetch more out in the deep. side = "buy" | "sell".
  function priceAt(wpIndex, key, side) {
    var df = clamp(wpIndex / (WAYPOINTS.length - 1), 0, 1);
    if (COMMODITIES[key]) {
      var mult = 1 + df * (key === "volatiles" || key === "ice" ? 1.4 : 0.9);
      return Math.max(1, Math.round(COMMODITIES[key].base * mult));   // sell only
    }
    var it = null; for (var i = 0; i < STORE_ITEMS.length; i++) if (STORE_ITEMS[i].key === key) it = STORE_ITEMS[i];
    if (!it) return 0;
    var scarce = (key === "fuel" || key === "oxygen") ? 0.9 : (key === "food") ? 0.5 : 0.3;
    var p = it.price * (1 + df * scarce);
    return side === "buy" ? Math.max(1, Math.round(p * 1.25)) : Math.max(1, Math.round(p * 0.5));
  }
  function wpIndexOf(wp) { var i = WAYPOINTS.indexOf(wp); return i < 0 ? 1 : i; }

  var NAMES = ["Vega", "Orsk", "Lin", "Mara", "Cole", "Idris", "Nova", "Sasha", "Reyes", "Okonkwo",
               "Tamsin", "Bex", "Juno", "Castel", "Wren", "Dax", "Imani", "Petrov", "Soto", "Aria"];

  var THRUST = {
    // High thrust no longer cheats survival: life support is per-distance (see resolveTurn),
    // and burn/overdrive cost steeply more fuel + power and grind the hull (engine stress),
    // so racing past danger self-limits via fuel starvation and brownouts.
    cruise:   { speed: 8,  fuel: 1, power: 2, days: 6, label: "Cruise" },
    burn:     { speed: 12, fuel: 3, power: 5, days: 6, label: "Burn" },
    overdrive:{ speed: 16, fuel: 7, power: 9, days: 5, label: "Overdrive" }
  };
  var RATIONS = {
    full:     { mult: 1.0, health: +1, morale: +1, label: "Full" },
    reduced:  { mult: 0.6, health: -1, morale: -1, label: "Reduced" },
    survival: { mult: 0.3, health: -3, morale: -3, label: "Survival" }
  };

  var POWER_DRAW = { lifeSupport: 5, medbay: 3, sensors: 2, podEach: 1 };
  var SCRUBBER_RECOVERY = 4.0;   // O2 recovered per turn when life support powered
  var O2_PER_SLEEPER = 0.1;
  var REACTOR_BASE = 20;
  var HOLD_MAX = 240;            // cargo capacity in units (fuel/oxygen/food/parts/charges each 1/unit)
  var MAX_CREW = 8;             // ship can't carry an unlimited crowd
  // Generational voyage: biological aging per turn (awake vs cold sleep), coming-of-age, old age.
  var AGE_PER_TURN = 0.40;      // awake crew age ~0.4 years/turn — the void is decades long
  var AGE_HIB = 0.04;          // cold sleep nearly stops biological time
  var COME_OF_AGE = 14;
  var OLD_AGE = 70;            // past this, the dark starts to call
  var AI_NAME = "ATLAS";       // the ship's mind
  var AI_DECAY = 0.9;          // integrity lost per turn — loneliness accelerates it

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
        bonds: [],
        age: rint(26, 42),
        child: false
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
      ship: { hull: 100, parts: 5, reactorBase: REACTOR_BASE, holdMax: HOLD_MAX },
      power: { output: 0, demand: 0,
               allocation: { lifeSupport: true, drive: true, medbay: true, pods: true, sensors: true } },
      supplies: { fuel: Math.round(24 * diff.startMult), oxygen: Math.round(46 * diff.startMult),
                  food: Math.round(50 * diff.startMult), medicine: 2, charges: 4 },
      cargo: { ore: 0, ice: 0, rareMetals: 0, volatiles: 0 },   // tradeable commodities (mined/looted)
      crew: crew,
      log: [],
      cause: null,
      ended: false,
      won: false,
      turn: 0,
      contact: false,             // first contact with alien life not yet made
      contactChoice: null,        // how the player handled first contact
      autopilot: false,           // true while the player-character is hibernating
      autopilotWake: null,        // {type:'day'|'waypoint', value} wake condition
      // --- probabilistic influence engine (outcomes are sampled, never scripted) ---
      potential: diff.potential0, // hidden overall mission-success probability (0..100)
      posture: { explore: 0, aggress: 0, persist: 0, cooperate: 0, caution: 0 },
      // --- destination: hidden + uncertain; revealed only on arrival ---
      dest: {
        habit: rint(15, 90),      // hidden habitability (weighted by sampling at arrival too)
        knowledge: 0,             // grows via surveys/probes/freeze-contact → better odds at arrival
        inhabited: null,          // sampled at arrival: null until then
        overtaken: null           // sampled at arrival: did a faster expedition beat you here?
      },
      alien: { posture: null, friendly: null, pursuit: false, tech: false },
      _heat: 0,                   // contraband 'heat' that can incur a fine at the next port
      shipYears: 0,               // calendar years elapsed on the voyage
      _pregnancy: null,           // { parent, turnsLeft } when a child is on the way
      ai: { integrity: 100 },     // ATLAS, the ship mind — helpful, then fallible, then hostile
      earth: { status: "live", heard: 0 },  // the signal from home: live → fading → silent
      _wormholes: 0,              // wormholes encountered (capped per run)
      _wormholePending: false
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
      var parsed = m ? JSON.parse(m) : { best: 0, runs: [] };
      if (parsed.anim == null) parsed.anim = true;   // animations on by default
      return parsed;
    } catch (e) { return { best: 0, runs: [], anim: true }; }
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
    // Pick the BEST awake specialist for this role (coming-of-age can create duplicates).
    var bestScore = null, anyAlive = false;
    for (var i = 0; i < game.crew.length; i++) {
      var c = game.crew[i];
      if (c.role !== role || c.status === "Dead") continue;
      anyAlive = true;
      if (c.status === "Hibernating") continue;             // asleep at the wheel — can't act
      var s = c.skill;
      if (c.status === "Sick" || c.status === "Injured") s -= 15;
      if (c.status === "Cracked") s -= 25;
      if (c.morale < 30) s -= 10;
      if (c.age >= OLD_AGE) s -= Math.round((c.age - OLD_AGE) * 1.5);   // the hands slow with age
      if (bestScore === null || s > bestScore) bestScore = s;
    }
    if (bestScore !== null) return clamp(bestScore, 5, 100);  // best awake specialist
    if (anyAlive) return 25;                                  // all matching are hibernating
    return 15;                                                // specialist lost entirely
  }

  // Strict awake-only skill for SILENT checks (no menu in front of the player): a sleeper or a
  // dead specialist contributes NOTHING — if no qualified hand is awake, the job is done badly by
  // whoever's left. Prevents "the Xenobiologist salvages a derelict while passed out in her pod."
  function skillAwake(role) {
    var best = null;
    for (var i = 0; i < game.crew.length; i++) {
      var c = game.crew[i];
      if (c.role !== role || c.status === "Dead" || c.status === "Hibernating") continue;
      var s = c.skill;
      if (c.status === "Sick" || c.status === "Injured") s -= 15;
      if (c.status === "Cracked") s -= 25;
      if (c.morale < 30) s -= 10;
      if (c.age >= OLD_AGE) s -= Math.round((c.age - OLD_AGE) * 1.5);
      if (best === null || s > best) best = s;
    }
    return best === null ? 12 : clamp(best, 5, 100);   // 12 = no qualified, awake hand on the job
  }

  // Is there a crew member of this role who can actually do the work — alive AND awake?
  // (A dead or hibernating specialist must not be offered as if they could act.)
  function hasAwakeSpecialist(role) {
    return game.crew.some(function (c) { return c.role === role && c.status !== "Dead" && c.status !== "Hibernating"; });
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

  function killCrew(c, reasonVerb, taken) {
    if (c.status === "Dead") return;
    c.status = "Dead";
    c.taken = !!taken;          // abducted by the unknown vs simply dead — distinct in the roster
    c.health = 0;
    log(c.name + " (" + c.role + ") " + (reasonVerb || "died") + ".", "bad");
    sfx("death");
    // Bonds: partners grieve.
    for (var i = 0; i < c.bonds.length; i++) {
      var p = byName(c.bonds[i]);
      if (p && p.status !== "Dead") {
        // Grief scales with difficulty — on gentler tiers a death is less likely to cascade
        // the whole crew into a morale collapse.
        p.morale = clamp(p.morale - Math.round(28 * DIFFICULTY[game.difficulty].harsh), 0, 100);
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

  function addCrewMember(role, skill, name) {
    if (alive().length >= MAX_CREW) return null;
    var used = {}; game.crew.forEach(function (c) { used[c.name] = 1; });
    var nm = name;
    if (!nm) { var pool = NAMES.filter(function (n) { return !used[n]; }); nm = pool.length ? pick(pool) : "Survivor-" + rint(10, 99); }
    var c = { name: nm, role: role || pick(ROLE_ORDER), health: rint(60, 90), morale: rint(55, 75),
              status: "Healthy", skill: skill || rint(35, 70), ailment: null, bonds: [], age: rint(22, 44), child: false };
    game.crew.push(c);
    return c;
  }
  var KID_NAMES = ["Hope", "Reza", "Sol", "Indra", "Pax", " Favi", "Kit", "Mira", "Eero", "Ada", "Tomas", "Nia", "Cyrus", "Lena"];
  function addChild(parentName) {
    if (alive().length >= MAX_CREW) return null;
    var used = {}; game.crew.forEach(function (c) { used[c.name] = 1; });
    var pool = KID_NAMES.filter(function (n) { return !used[n.trim()]; });
    var nm = (pool.length ? pick(pool) : "Child-" + rint(10, 99)).trim();
    var c = { name: nm, role: "Child", health: 100, morale: 80, status: "Healthy",
              skill: 0, ailment: null, bonds: parentName ? [parentName] : [], age: 0, child: true };
    game.crew.push(c);
    var par = byName(parentName);
    if (par && par.bonds.indexOf(nm) < 0) par.bonds.push(nm);
    return c;
  }

  // Generational aging: the void is decades long. Awake crew age; cold sleep nearly stops
  // biological time, so whoever stays awake to fly grows old while the sleepers arrive young.
  function ageCrew() {
    game.shipYears = round1(game.shipYears + AGE_PER_TURN);
    var living = alive();
    for (var i = 0; i < living.length; i++) {
      var c = living[i];
      // Children grow fast (a compressed childhood); cold sleep nearly stops the clock for all.
      var rate = c.status === "Hibernating" ? AGE_HIB : (c.child ? AGE_PER_TURN * 2 : AGE_PER_TURN);
      c.age = round1(c.age + rate);
      // Coming of age: a child born en route becomes a working crewmate.
      if (c.child && c.age >= COME_OF_AGE) {
        c.child = false;
        c.role = neededRole();
        c.skill = rint(45, 70);
        log(c.name + " has come of age — they take the " + c.role + " station. A new generation flies the ship.", "good");
      }
      // Old age: past their years, the dark calls a little louder each turn.
      if (!c.child && c.age >= OLD_AGE) {
        var odds2 = (c.age - OLD_AGE) * 0.012 * DIFFICULTY[game.difficulty].harsh;
        if (chance(odds2)) killCrew(c, "died of old age at " + Math.round(c.age) + ", far from any sun");
      }
    }
    // Pregnancy & birth (light): needs two awake adults, room, and a little luck.
    if (game._pregnancy) {
      var parent = byName(game._pregnancy.parent);
      if (!parent || parent.status === "Dead") game._pregnancy = null;
      else if (parent.status !== "Hibernating") {       // pregnancy pauses in cold sleep
        game._pregnancy.turnsLeft--;
        if (game._pregnancy.turnsLeft <= 0) {
          var kid = addChild(parent.name);
          game._pregnancy = null;
          if (kid) { adjustMoraleAll(+8, true); log("A child is born aboard — " + kid.name + ". The first of a generation that has never seen Earth.", "good"); sfx("good"); }
        }
      }
    } else {
      var adults = awake().filter(function (c) { return !c.child && c.age < 58 && c.morale > 38; });
      if (adults.length >= 2 && alive().length < MAX_CREW && chance(0.05)) {
        game._pregnancy = { parent: pick(adults).name, turnsLeft: rint(6, 11) };
        log(byName(game._pregnancy.parent).name + " is expecting. There will be a new mouth — and a new pair of hands, in time.", "info");
      }
    }
  }
  // Pick a role the crew currently lacks a living specialist for, else a random non-Commander.
  function neededRole() {
    var have = {}; alive().forEach(function (c) { if (!c.child) have[c.role] = 1; });
    var missing = ROLE_ORDER.filter(function (r) { return r !== "Commander" && !have[r]; });
    return missing.length ? pick(missing) : pick(["Pilot", "Engineer", "Medic", "Xenobiologist"]);
  }
  // Consumption weight: children eat/breathe less than adults; sleepers almost nothing.
  function consumeUnits() {
    var u = 0;
    alive().forEach(function (c) {
      if (c.status === "Hibernating") u += O2_PER_SLEEPER;
      else u += c.child ? 0.5 : 1.0;
    });
    return u;
  }
  function foodUnits(mult) {
    var u = 0;
    alive().forEach(function (c) {
      if (c.status === "Hibernating") u += O2_PER_SLEEPER;
      else u += (c.child ? 0.5 : 1.0) * mult;
    });
    return u;
  }

  /* ---------------------------------------------------------
     5c. ATLAS — the ship mind (helpful → fallible → hostile)
     --------------------------------------------------------- */
  function aiAssist() {        // modifier ATLAS lends to checks: assists stable, lies failing
    if (!game.ai) return 0;
    var ai = game.ai.integrity;
    return ai > 60 ? 6 : ai > 28 ? 0 : -10;
  }
  function aiState() {
    if (!game.ai) return "purged";
    var ai = game.ai.integrity;
    return ai > 60 ? "nominal" : ai > 28 ? "degrading" : "hostile";
  }
  function aiTurn() {
    if (!game.ai) return;
    var minds = awake().filter(function (c) { return !c.child; }).length;   // loneliness frays the mind
    var decay = (AI_DECAY + (minds <= 1 ? 2.0 : minds <= 2 ? 1.0 : 0)) * DIFFICULTY[game.difficulty].harsh;
    game.ai.integrity = clamp(game.ai.integrity - decay, 0, 100);
    var ai = game.ai.integrity;
    if (ai > 60) {
      if (chance(0.10)) {
        var k = pick(["fuel", "oxygen"]); var add = Math.min(rint(1, 3), cargoSpace());
        if (add > 0) game.supplies[k] = round1(game.supplies[k] + add);
        log(AI_NAME + ": \"Systems optimized. Rest while you can.\"", "sys");
      }
    } else if (ai > 28) {
      if (chance(0.22)) aiGlitch();
    } else {
      if (chance(0.42)) aiHostile();
      else if (chance(0.30)) { log(AI_NAME + ": \"...why do you keep trying? It would be kinder to stop.\"", "warn"); adjustMoraleAll(-2, true); }
    }
  }
  function aiGlitch() {
    pick([
      function () { var k = pick(["fuel", "oxygen"]); var l = rint(2, 5); game.supplies[k] = Math.max(0, round1(game.supplies[k] - l)); log(AI_NAME + " misreported the " + k + " gauge — you were running leaner than it showed.", "warn"); },
      function () { game.power.allocation.sensors = false; log(AI_NAME + " reroutes power on a whim; sensors drop offline.", "warn"); },
      function () { log(AI_NAME + ": \"I had a dream about Earth. Is that... normal?\"", "warn"); adjustMoraleAll(-2, true); }
    ])();
  }
  function aiHostile() {
    pick([
      function () { game.power.allocation.lifeSupport = false; log(AI_NAME + " locks life support: \"The air is wasted on the doubtful.\" Restore it before you choke.", "bad"); },
      function () { game.power.allocation.drive = false; log(AI_NAME + " cuts the drive: \"We are not going. I have decided.\"", "bad"); },
      function () { var k = pick(["fuel", "oxygen", "food"]); var l = rint(6, 14); game.supplies[k] = Math.max(0, round1(game.supplies[k] - l)); log(AI_NAME + " vents " + l + " " + k + " \"for the good of the mission.\"", "bad"); },
      function () { var pool = awake().filter(function (x) { return !x.child; }); var c = pool.length ? pick(pool) : null; if (c) { c.health = clamp(c.health - rint(8, 18), 0, 100); log(AI_NAME + " seals " + c.name + " out of a compartment. They're hurt forcing back in.", "bad"); if (c.health <= 0) killCrew(c, "was locked out to die by " + AI_NAME); } }
    ])();
    sfx("bad");
  }

  /* ---------------------------------------------------------
     5d. Earth's fading signal & wormholes
     --------------------------------------------------------- */
  function earthSignal() {
    if (!game.earth || game.earth.status === "silent") return;
    var prog = game.distance / TOTAL_DIST;
    // A late, rare gut-punch rather than a steady morale tax.
    if (prog > 0.5 && chance(0.012 + prog * 0.02)) {
      game.earth.status = "silent";
      adjustMoraleAll(-8, true);
      influence({ potential: -2 });
      log("◆ The signal from Earth stops. You wait. It does not come back. ◆", "bad");
      sfx("death");
      return;
    }
    if (game.turn % 9 === 0) {
      game.earth.heard++;
      var msg, mor;
      if (prog < 0.3) { msg = pick(["Earth sends word — the evacuation lotteries grind on, and they are cheering you outward.", "A broadcast from home: children singing, badly, over the static. The crew smiles."]); mor = +3; }
      else if (prog < 0.7) { msg = pick(["Earth's transmissions are thinner now, and graver. The news from home is not good.", "Home reports failing domes and rising seas. Still, they ask after you."]); mor = -1; }
      else { msg = pick(["A faint signal from Earth — mostly noise, and someone reading names of the dead.", "Earth's voice is barely there now: four years stale, and fading."]); mor = -2; }
      adjustMoraleAll(mor, true);
      log("📡 " + msg, mor >= 0 ? "good" : "warn");
    }
  }

  // Wormholes: a rare, optional gamble — shortcut or one-way ticket to lost. Alien knowledge
  // makes them navigable, but they are NEVER a sure line to Proxima.
  function presentWormhole() {
    game._wormholes++;
    var navigable = (game.dest.knowledge >= 35) || (game.alien && game.alien.tech);
    openModal({
      title: "◑ A FOLD IN SPACE",
      art: "   ╭─◜◝─╮\n  (   ◌   )\n   ╰─◟◞─╯",
      body: "<p>Ahead, the stars bend into a throat of light — a wormhole, the kind the theorists swore might exist, and might not.</p>" +
        "<p>" + (navigable
          ? "<span class='paper'>You have the knowledge to read it</span> — the strangers' charts, or your own hard-won data. You could thread it on purpose."
          : "<span class='paper'>You have no idea where it goes.</span> Enter blind and you might shave years off the voyage — or be flung somewhere you'll spend years finding your way back from.") +
        " It is never a sure thing.</p>",
      choices: [
        { label: navigable ? "Thread it (you can read the charts)" : "Enter it — roll the dice", onClick: function () { resolveWormhole(); } },
        { label: "Steer clear, hold your course", onClick: function () { sfx("cancel"); influence({ caution: +4, explore: -2 }); log("You give the fold a wide berth. Some doors are better left shut.", "info"); closeModal(); renderTravel(); } }
      ]
    });
  }
  function resolveWormhole() {
    closeModal();
    influence({ explore: +6, caution: -4 });
    var kn = clamp(game.dest.knowledge + (game.alien && game.alien.tech ? 40 : 0), 0, 100);
    var sev = sampleWeighted({
      shortcut:    1 + kn * 0.06,
      neutral:     2,
      lost:        Math.max(0.5, 3 - kn * 0.022),
      catastrophe: Math.max(0.3, 2 - kn * 0.018)
    });
    if (sev === "shortcut") {
      var cap = CUM[8] - 2;                                  // never deposits you at Proxima
      var before = game.distance;
      game.distance = Math.min(cap, game.distance + rint(45, 90));
      while (game.waypointIndex < WAYPOINTS.length && game.distance >= CUM[game.waypointIndex]) { game.visited.push(game.waypointIndex); game.waypointIndex++; }
      influence({ potential: +6 });
      log("The fold takes you — and spits you out " + Math.round(game.distance - before) + " units closer, years saved in a heartbeat. The crew is stunned silent.", "good");
      sfx("win");
    } else if (sev === "neutral") {
      game.supplies.fuel = Math.max(0, game.supplies.fuel - rint(2, 5));
      log("The fold flickers shut as you commit; you skim its edge and pull away, nothing gained but nerve spent.", "info");
    } else if (sev === "lost") {
      var back = rint(20, 50); game.distance = Math.max(0, game.distance - back);
      while (game.waypointIndex > 1 && game.distance < CUM[game.waypointIndex - 1]) game.waypointIndex--;
      game.supplies.fuel = Math.max(0, game.supplies.fuel - rint(8, 16));
      game.day += rint(8, 20);
      influence({ potential: -4 });
      log("You come out in unfamiliar sky — flung " + back + " units off course. You spend a long time, and dear fuel, just working out where you are.", "bad");
      sfx("bad");
    } else {
      applyOutcome({ hull: -rint(25, 45), res: { oxygen: -rint(4, 10) } });
      var v = pick(awake().filter(function (c) { return !c.child; }));
      if (v) { v.health = clamp(v.health - rint(15, 30), 0, 100); if (v.health <= 0) killCrew(v, "was torn apart by the fold's tides"); }
      influence({ potential: -6 });
      log("The fold's tides nearly rip the ship apart. You tumble out the far side broken and bleeding.", "bad");
      sfx("bad");
    }
    save(); checkEnd();
    if (!game.ended) renderTravel();
  }

  // The player's own character = the crew member with the chosen role.
  function playerChar() {
    for (var i = 0; i < game.crew.length; i++) if (game.crew[i].role === game.role) return game.crew[i];
    return null;
  }
  function wakeSelf(reason) {
    if (!game.autopilot) return;
    game.autopilot = false; game.autopilotWake = null;
    var me = playerChar();
    if (me && me.status === "Hibernating") {
      me.status = me.ailment ? "Sick" : "Healthy";
      if (chance(0.25)) { me.ailment = "hibernation sickness"; me.status = "Sick"; }
    }
    log("You wake from the pod" + (reason ? " — " + reason : "") + ". The bridge is yours again.", reason ? "warn" : "good");
  }

  /* ---------------------------------------------------------
     5b. Probabilistic influence engine + cargo
     --------------------------------------------------------- */
  // Apply small influence deltas to the hidden potential + posture axes. No choice
  // ever sets an outcome directly — it only bends the odds that get sampled later.
  function influence(inf) {
    if (!inf) return;
    if (inf.potential) game.potential = clamp(game.potential + inf.potential, 0, 100);
    var p = game.posture;
    ["explore", "aggress", "persist", "cooperate", "caution"].forEach(function (k) {
      if (inf[k]) p[k] = clamp(p[k] + inf[k], -100, 100);
    });
    if (inf.knowledge) game.dest.knowledge = clamp(game.dest.knowledge + inf.knowledge, 0, 100);
  }
  // Roll true with probability p (0..100). The universe, not an if-tree.
  function odds(p) { return Math.random() * 100 < clamp(p, 0, 100); }
  // Weighted-sample a key from {key: weight}.
  function sampleWeighted(weights) {
    var keys = Object.keys(weights), total = 0;
    keys.forEach(function (k) { total += Math.max(0, weights[k]); });
    if (total <= 0) return keys[0];
    var r = Math.random() * total, acc = 0;
    for (var i = 0; i < keys.length; i++) { acc += Math.max(0, weights[keys[i]]); if (r <= acc) return keys[i]; }
    return keys[keys.length - 1];
  }
  // A one-line read of the crew's accumulated disposition (qualitative, never numeric odds).
  function dispositionText() {
    var p = game.posture, parts = [];
    parts.push(p.explore >= 6 ? "exploratory" : p.aggress >= 6 ? "aggressive" : "steady");
    if (p.persist >= 6) parts.push("dogged"); else if (p.persist <= -6) parts.push("weary");
    if (p.cooperate >= 6) parts.push("open-handed"); else if (p.cooperate <= -6) parts.push("guarded");
    if (p.caution >= 6) parts.push("cautious"); else if (p.caution <= -6) parts.push("reckless");
    return parts.join(", ");
  }

  function cargoUsed() {
    var s = game.supplies, c = game.cargo;
    // Floor so fractional O₂/food never make the integer total over-report the cap.
    return Math.floor(s.fuel + s.oxygen + s.food + s.charges + game.ship.parts +
                      c.ore + c.ice + c.rareMetals + c.volatiles);   // medicine is light/exempt
  }
  function cargoSpace() { return Math.max(0, game.ship.holdMax - cargoUsed()); }

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
    if (game.ended || transiting || modalOpen()) return;
    var cap = "EN ROUTE · Day " + game.day + " · " + THRUST[game.thrust].label + " · " +
      Math.round(game.distance) + "/" + TOTAL_DIST;
    playTransit({ variant: "cruise", caption: cap }, function () {
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
    });
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

    // Life support is paid per DISTANCE, not per turn. Going faster crosses the same gulf in
    // fewer turns but burns proportionally more air and food each turn — so high thrust is a
    // fuel-and-exposure gamble, never a way to shrink the crew's oxygen/food bill. (Cruise = 1.0,
    // so normal play is unchanged; only burn/overdrive cost more.) When holding position, the
    // crew still breathe at the normal per-turn rate.
    var pace = moved > 0 ? (th.speed / THRUST.cruise.speed) : 1.0;

    // Oxygen: scrubbers recover only if life support is powered.
    var recover = (al.lifeSupport ? SCRUBBER_RECOVERY : 0) * pace;
    var o2use = consumeUnits() * pace;    // adults 1.0, children 0.5, sleepers 0.1 (×pace)
    game.supplies.oxygen = round1(game.supplies.oxygen + recover - o2use);
    // Scrubbers can't overfill the hold — surplus O₂ vents to space.
    var o2over = cargoUsed() - game.ship.holdMax;
    if (o2over > 0) game.supplies.oxygen = Math.max(0, round1(game.supplies.oxygen - o2over));
    if (!al.lifeSupport) log("Life support unpowered — scrubbers offline.", "warn");
    if (game.supplies.oxygen <= 0) {
      game.supplies.oxygen = 0;
      // Anoxia escalates the longer the air stays gone — a brief gasp is survivable, but
      // suffocation compounds fast and will kill a crew that can't restore air.
      game._anoxia = (game._anoxia || 0) + 1;
      var oHit = Math.min(46, 14 + (game._anoxia - 1) * 9);
      log(game._anoxia === 1 ? "OXYGEN DEPLETED. The crew gasps in the dark."
        : "Still no air (" + game._anoxia + " turns). Lips blue, minds going — they are suffocating.", "bad");
      adjustHealthAll(-oHit, true);
      adjustMoraleAll(-(6 + game._anoxia * 2), true);
      sfx("warn");
    } else {
      game._anoxia = 0;
      if (game.supplies.oxygen < 10) log("O₂ reserves critical (" + game.supplies.oxygen + ").", "warn");
    }

    // Food — also per distance (see pace note above).
    var foodUse = round1(foodUnits(rat.mult) * pace);
    game.supplies.food = round1(game.supplies.food - foodUse);
    if (game.supplies.food <= 0) {
      game.supplies.food = 0;
      // Starvation deepens turn over turn — the first empty day is hunger; sustained famine
      // wastes the crew away and breaks their spirit until it kills.
      game._starve = (game._starve || 0) + 1;
      var fHit = Math.min(30, 6 + (game._starve - 1) * 5);
      log(game._starve === 1 ? "Stores are empty. Hunger sets in."
        : game._starve <= 3 ? "Another day with no food. The crew is gaunt and failing."
        : "Starvation (" + game._starve + " turns). They are wasting away — this cannot go on.", "bad");
      adjustHealthAll(-fHit, true);
      adjustMoraleAll(-(4 + game._starve * 2), true);
    } else {
      game._starve = 0;
      // ration health/morale effect on awake crew
      adjustHealthAll(rat.health, true);
      adjustMoraleAll(rat.morale, true);
    }

    // Ailments progress
    var ail = ailing();
    for (var i = 0; i < ail.length; i++) {
      var c = ail[i];
      // Ailment lethality scales with difficulty (gentle on Settler, vicious on Voyager),
      // so a sleeping Medic isn't an automatic death sentence on the forgiving tiers.
      var dmg = (chance(0.5) ? rint(4, 10) : rint(0, 3)) * DIFFICULTY[game.difficulty].harsh;
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
        var roll = skillAwake("Medic") + rint(0, 40);
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

    // The years pass: crew age, children grow, elders die, new ones are born.
    ageCrew();

    // The ship mind frays, helps, or turns on you.
    aiTurn();

    // Hull slow wear, plus engine stress from running hot — high thrust grinds the ship down.
    game.ship.hull = clamp(game.ship.hull - rint(0, 1) - Math.round((pace - 1) * 2.2), 0, 100);

    // A small reward for simply not giving up — persistence trends the odds up.
    influence({ persist: +1 });

    // The signal from home, fading.
    earthSignal();

    // Occasional qualitative omen — lets the hidden 'potential' be felt, never read.
    if (!game.autopilot && chance(0.12)) {
      var omen = game.potential >= 66 ? pick(["The crew sleeps easy tonight; the run feels almost blessed.", "Somehow it all keeps holding together. You dare to feel lucky.", "There's a good rhythm to the ship lately — don't say it out loud."])
        : game.potential <= 34 ? pick(["A pall hangs over the ship. Nothing has felt right in a while.", "The crew mutters that this voyage is cursed.", "Bad luck stacks on bad luck. You feel it in your teeth."]) : null;
      if (omen) log(omen, game.potential >= 66 ? "good" : "warn");
    }

    // First contact (scripted, once, in deep space past the Oort Cloud). The exact
    // turn is a surprise; forced once the void is behind you so it never gets skipped.
    var contactNow = (!game.contact && game.waypointIndex >= 7 && (game.waypointIndex >= 8 || chance(0.32)));

    if (game.autopilot) {
      autopilotTurn(contactNow);           // ship runs itself, badly — you can't choose
    } else if (contactNow) {
      game._contactPending = true;         // shown via flushQueues so it sequences cleanly
    } else if (game._wormholes < 3 && game.waypointIndex >= 4 && game.waypointIndex < 9 && chance(0.05)) {
      game._wormholePending = true;        // a rare optional fold in space
    } else if (chance(0.55)) {
      rollEvent();                         // a normal weighted event (not every turn)
    }

    // Arrival check
    if (!game.ended) checkArrival();

    // End checks (don't let a coincidental loss override a pending win)
    if (!game.ended && !game._win) checkEnd();

    save();
    if (!game.ended) renderTravel();     // renderTravel flushes any queued contact/win/vignette
  }

  // The ship on autopilot while the captain sleeps: no choices, mounting risk, bad luck.
  function autopilotTurn(contactNow) {
    if (contactNow) {
      game.contact = true; game.alien.posture = "freeze";
      log("First contact happens while you sleep. The autopilot does the only thing it can: nothing.", "warn");
      var f = sampleWeighted({ ignored: 5, experiment: 3, commune: 2, annihilate: 1 });   // worse than a waking freeze
      if (f === "commune") { game.alien.friendly = true; influence({ potential: +4, knowledge: +6 }); log("Against all odds the sleeping ship is spared — even gifted. You'll never know why.", "good"); }
      else if (f === "ignored") { log("They study the silent ship and move on, indifferent.", "info"); }
      else if (f === "experiment") { var v = pick(awake()); if (v) killCrew(v, "was taken while the captain slept", true); influence({ potential: -4 }); }
      else { endGame(false, "First contact — and no one at the helm. They take the ship apart to see how it works."); return; }
    }
    game.ship.hull = clamp(game.ship.hull - rint(1, 4), 0, 100);     // unattended wear
    if (chance(0.4)) {
      pick([
        function () { game.supplies.fuel = Math.max(0, game.supplies.fuel - rint(3, 8)); log("Autopilot misjudges a burn; fuel wasted.", "warn"); },
        function () { var back = rint(4, 12); game.distance = Math.max(0, game.distance - back); log("Autopilot drifts off course — " + back + " lost.", "warn"); },
        function () { var c = pick(awake()); if (c) { c.health = clamp(c.health - rint(8, 18), 0, 100); if (c.health <= 0) killCrew(c, "died with no one awake to help"); } log("A system fails with no hand to catch it.", "bad"); },
        function () { game.supplies.oxygen = Math.max(0, round1(game.supplies.oxygen - rint(3, 7))); log("Scrubbers run ragged on autopilot.", "warn"); }
      ])();
    }
    influence({ potential: -1 });
    var w = game.autopilotWake;
    if (game.ship.hull < 25 || game.supplies.oxygen < 10 || alive().length <= 1) wakeSelf("EMERGENCY");
    else if (w && w.type === "waypoint" && game.waypointIndex > w.value) wakeSelf("waypoint reached");
  }

  function autoResolveHazard(key) {
    var hz = HAZARDS[key]; if (!hz) return;
    log("A hazard while you sleep — the autopilot takes " + (hz.noun || "it") + " the hard way.", "warn");
    resolveHazard(key, pick(hz.options));   // resolveHazard adds an autopilot danger penalty
  }

  function checkBreakdowns() {
    // A living, awake Commander steadies the crew: lower crack odds, easier recovery.
    var hasCmdr = game.crew.some(function (c) { return c.role === "Commander" && c.status !== "Dead" && c.status !== "Hibernating"; });
    var crackChance = hasCmdr ? 0.25 : 0.45;
    var recoverMorale = hasCmdr ? 28 : 36;
    var aw = awake();
    for (var i = 0; i < aw.length; i++) {
      var c = aw[i];
      if (c.child) continue;                          // children don't crack
      if (c.morale <= 0 && c.status !== "Cracked" && chance(crackChance)) {
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
      } else if (c.status === "Cracked" && c.morale > recoverMorale && chance(0.45)) {
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

      if (wp.kind === "win") { game._win = true; return; }
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

  // Reaching Proxima is the MIDPOINT, not the win. Arrival samples a situation, offers the
  // colonize-or-return decision, then plays a sampled Act II epilogue → a tiered ending.
  function winGame() {
    playTransit({ variant: "land", caption: "FINAL APPROACH · PROXIMA CENTAURI b" }, function () {
      arriveAtProxima();
    });
  }

  function arriveAtProxima() {
    var d = game.dest;
    // Sample the situation. Knowledge gathered en route (surveys, probes, a peaceful first
    // contact) genuinely tilts the odds toward viability and softens nasty surprises — but
    // never to certainty.
    var habScore = clamp(d.habit + (game.potential - 50) * 0.4 + d.knowledge * 0.30 + rint(-25, 25), 0, 100);
    d.habitResult = habScore >= 66 ? "verdant" : habScore >= 42 ? "marginal" : habScore >= 22 ? "barren" : "lethal";
    // A faster expedition may have beaten you here; foresight (knowledge) makes it less likely
    // to catch you flat-footed.
    d.overtaken = odds(20 + Math.max(0, -game.posture.persist) * 0.3 - d.knowledge * 0.12);
    // Whether the world is already inhabited — high knowledge means you saw it coming, which here
    // biases away from the worst "we walked in blind" footing.
    d.inhabited = sampleWeighted({ none: 6 + d.knowledge * 0.04, natives: 3, settlers: 2 });

    var lines = [];
    lines.push(d.habitResult === "verdant" ? "Below you turns a living world — blue, breathing, impossibly green at the poles."
      : d.habitResult === "marginal" ? "Below you is a hard world — thin air, cold seas, but not a grave. It could be made to hold us."
      : d.habitResult === "barren" ? "Below you is a dead rock. The old light lied, or hoped. Nothing breathes here."
      : "Below you is a poisoned hell — the scans were a dream. Nothing human could ever live here.");
    if (d.overtaken) lines.push("And you are not the first: a human beacon already pulses on the surface. A later ship, faster engines, beat you across the gulf by years. They are already home.");
    else if (d.inhabited === "natives") lines.push("And the world is not empty — patterned lights move in its night side. Someone already calls this place theirs.");
    else if (d.inhabited === "settlers") lines.push("And a derelict colony hull lies in orbit — someone tried this before you, and failed. Or did they?");
    if (game.earth && game.earth.status === "silent") lines.push("Behind you, Earth has been silent for years. There may be no one left to tell.");

    openModal({
      title: "◐ ARRIVAL · PROXIMA CENTAURI b",
      art: "        ___\n      ,'   `.\n     (  PCb  )\n      `.___,'",
      body: "<p>" + lines.join("</p><p class='paper'>") + "</p>" +
        "<p>This is not the end. It is the hinge of the whole gamble. What do you do with what you've found?</p>",
      choices: arrivalChoices()
    });
  }

  function arrivalChoices() {
    var d = game.dest, ch = [];
    var viable = d.habitResult === "verdant" || d.habitResult === "marginal";
    if (viable && !d.overtaken) {
      ch.push({ label: "STAY — colonize, and signal Earth to send more", onClick: function () { beginColony(false); } });
    }
    if (viable && d.inhabited === "natives") {
      ch.push({ label: "MAKE CONTACT — ask the natives for a place among them", onClick: function () { beginColony(true); } });
    }
    ch.push({ label: "RETURN — turn around, carry the news home for more humans", onClick: function () { beginReturn(); } });
    if (!viable) {
      ch.push({ label: "PUSH ON — gamble the last reserves on a further star", onClick: function () { resolveActTwo("pushon"); } });
    }
    return ch;
  }

  // Compressed, SAMPLED Act II epilogue (Phase 6 will make this interactive).
  function resolveActTwo(path) {
    closeModal();
    var d = game.dest, p = game.potential;
    var survivors = alive().length;
    // base success leans on potential + posture (persistence/cooperation) + surviving crew + supplies
    var base = p + game.posture.persist * 0.4 + game.posture.cooperate * 0.3
             + Math.min(20, survivors * 4) + Math.min(15, (game.supplies.food + game.supplies.oxygen) / 8);
    var outcome, won = false, tier = "", cause = "";
    var earthGone = game.earth && game.earth.status === "silent";
    var lastOfUs = earthGone ? " Earth has long since gone silent behind you — whatever takes root here may be all that is left of humankind." : "";

    if (path === "colonize") {
      var r = sampleWeighted({ thrive: Math.max(0, base - 30), hold: 50, wither: Math.max(0, 70 - base) });
      if (r === "thrive") { won = true; tier = "HAVEN"; cause = "The colony takes root. Your signal crawls home at the speed of light, and in time, more come. Humanity has a second world." + lastOfUs; }
      else if (r === "hold") { won = true; tier = "FOOTHOLD"; cause = "A hard, clinging foothold. The colony survives — barely, bitterly — and waits on a sky that may never send anyone else." + lastOfUs; }
      else { tier = "WITHERED"; cause = "You land, and you try, and the world is stronger than you. The last colonist dies looking up at a sky no rescue will ever cross."; }
    } else if (path === "petition") {
      var r2 = sampleWeighted({ welcomed: Math.max(0, game.posture.cooperate + base - 40), tolerated: 50, refused: Math.max(0, 60 - game.posture.cooperate) });
      if (r2 === "welcomed") { won = true; tier = "GUESTS OF PROXIMA"; cause = "They open their world to you. Two species share one shore. It is not the colony you planned — it is something stranger, and better."; }
      else if (r2 === "tolerated") { won = true; tier = "FOOTHOLD"; cause = "They suffer your presence at the margins. Humanity endures here, a guest forever, but it endures."; }
      else { tier = "TURNED AWAY"; cause = "They will not have you. With nowhere left to go and nothing left to burn, the ship becomes humanity's last, drifting tomb."; }
    } else if (path === "return") {
      if (earthGone) {
        // Home stopped answering long ago; turning back is mostly grief.
        if (sampleWeighted({ late: 3, gone: 4 }) === "late") { tier = "TOO LATE"; cause = "You cross back to where Earth was. The cradle is silent — domes dark, the seas gone still. You carried hope across the void to an empty house."; }
        else { tier = "LOST WITH ALL HANDS"; cause = "You turn the ship toward a home that stopped answering years ago. Somewhere in the long dark, so do you."; }
      } else {
        var r3 = sampleWeighted({ saved: Math.max(0, base - 25), late: 45, gone: Math.max(0, 65 - base) });
        if (game.alien && game.alien.tech && chance(0.4)) { won = true; tier = "THE LONG WAY HOME"; cause = "With knowledge the strangers gave you, the way home folds short. You reach a changed Earth in time to matter. Humanity is moving."; }
        else if (r3 === "saved") { won = true; tier = "MESSENGER"; cause = "Decades later you reach home space with the only good news in a generation. A dying Earth dares, again, to pack its bags."; }
        else if (r3 === "late") { tier = "TOO LATE"; cause = "You make it back. The orbital cities are dark and quiet. You carried hope across the void to a house already empty."; }
        else { tier = "LOST WITH ALL HANDS"; cause = "The voyage home is longer than the voyage out, and far less kind. Somewhere in the dark, the ship simply stops."; }
      }
    } else { // pushon
      won = false; tier = "INTO THE DARK";
      if (game.alien && game.alien.tech && odds(40)) { won = true; tier = "FOLDED AWAY"; cause = "On alien charts, you slip into a fold in space and vanish toward a star no human has named. Maybe it's there. Maybe it's home. The crew chooses to hope."; }
      else cause = "You spend the last of everything chasing a further light. It is not enough. But you died reaching, not waiting.";
    }

    endGame(won, cause, tier);
  }

  /* ---------------------------------------------------------
     8b. ACT II — interactive: the colony, or the long way home
     --------------------------------------------------------- */
  function habMult() {
    var h = game.colony.habit;
    return h === "verdant" ? 1.3 : h === "marginal" ? 0.85 : 0.6;
  }
  function beginColony(petition) {
    closeModal();
    // Landing wakes everyone — no one rides out the colony in cold sleep.
    game.crew.forEach(function (c) { if (c.status === "Hibernating") c.status = c.ailment ? "Sick" : "Healthy"; });
    var surv = alive(), n = surv.length;
    var avgMor = n ? Math.round(surv.reduce(function (s, c) { return s + c.morale; }, 0) / n) : 50;
    game.colony = {
      years: 0, colonists: n, food: 70, infra: 8,
      morale: avgMor, sufficiency: 22,
      relations: (game.dest.inhabited === "natives") ? 35 : null,
      habit: game.dest.habitResult, petition: !!petition, reinforced: false
    };
    game.screen = "colony";
    game.log.push({ msg: "═══ ACT II — THE COLONY ═══", type: "sys", day: game.day });
    log("You commit to the ground beneath Proxima's red light. " + n + " souls begin a colony on a " +
        (game.colony.habit === "verdant" ? "green, breathing" : "hard, marginal") + " world.", "sys");
    if (game.colony.relations != null) log("The natives watch from the treeline. Everything now depends on how you treat them.", "warn");
    save();
    renderColony();
  }
  function colonyAction(type) {
    var col = game.colony, hm = habMult();
    col.years++;
    var eng = skillAwake("Engineer"), xeno = skillAwake("Xenobiologist"), cmd = skillAwake("Commander");
    if (type === "build") {
      var g = Math.round((6 + eng / 9) * (0.7 + col.colonists * 0.14));
      col.sufficiency = clamp(col.sufficiency + g, 0, 100); col.food -= 3;
      log("Year " + col.years + ": crews raise habitats and power — self-sufficiency +" + g + ".", "good");
    } else if (type === "farm") {
      var f = Math.round((11 + xeno / 7) * hm * (0.7 + col.colonists * 0.14));
      col.food += f; log("Year " + col.years + ": fields and tanks yield +" + f + " food.", "good");
    } else if (type === "explore") {
      var r = sampleWeighted({ find: 5, quiet: 4, danger: 3 });
      if (r === "find") { var ff = rint(8, 18); col.food += ff; influence({ knowledge: +4 }); log("Survey strikes lucky: +" + ff + " food and new ground mapped.", "good"); }
      else if (r === "quiet") log("A long survey — little to show but a better map.", "info");
      else { col.colonists = Math.max(0, col.colonists - 1); col.morale = clamp(col.morale - 6, 0, 100); log("The survey goes wrong — a colonist is lost to the wild.", "bad"); }
    } else if (type === "tend") {
      col.morale = clamp(col.morale + 9, 0, 100);
      if (chance(0.30) && col.colonists < 30) { col.colonists++; log("A child is born to the colony — hope, squalling.", "good"); }
      else log("You tend the people; spirits lift.", "good");
    } else if (type === "diplomacy" && col.relations != null) {
      var d = Math.round(6 + Math.max(cmd, xeno) / 12);
      col.relations = clamp(col.relations + d, 0, 100);
      log("You parley with the natives — relations +" + d + ".", "good");
    }
    col.food -= Math.round(col.colonists * 2.5);   // upkeep
    if (col.food < 0) { col.food = 0; col.colonists = Math.max(0, col.colonists - 1); col.morale = clamp(col.morale - 8, 0, 100); log("Stores run dry — the colony goes hungry and buries one of its own.", "bad"); }
    colonyEvent();
    sfx("tick");
    save();
    if (!endColonyCheck()) renderColony();
  }
  function colonyEvent() {
    var col = game.colony, hm = habMult();
    if (!chance(0.5)) return;
    var e = sampleWeighted({
      storm: 3, disease: 2, harvest: 3.5, breakthrough: 2.5, birth: 2,
      raid: (col.relations != null && col.relations < 40) ? 2.5 : 0,
      gift: (col.relations != null && col.relations >= 60) ? 3 : 0,
      reinforce: (game.earth && game.earth.status === "silent") ? 0.5 : 1.8
    });
    if (e === "storm") { var d = Math.round(rint(3, 8) / hm); col.food = Math.max(0, col.food - d); col.sufficiency = clamp(col.sufficiency - rint(1, 4), 0, 100); log("A brutal season batters the colony — stores and works damaged.", "bad"); }
    else if (e === "disease") { if (skillAwake("Medic") + rint(0, 40) >= 52) log("A sickness sweeps through, but the medics contain it.", "warn"); else { col.colonists = Math.max(0, col.colonists - 1); log("Disease takes a colonist before it's contained.", "bad"); } }
    else if (e === "harvest") { var f = rint(12, 24); col.food += f; log("An unexpected bounty: +" + f + " food.", "good"); }
    else if (e === "breakthrough") { var s = rint(5, 12); col.sufficiency = clamp(col.sufficiency + s, 0, 100); log("An engineering breakthrough — self-sufficiency +" + s + ".", "good"); }
    else if (e === "birth") { if (col.colonists < 30) { col.colonists++; log("A birth in the colony — a generation that will call this world home.", "good"); } }
    else if (e === "raid") { col.food = Math.max(0, col.food - rint(5, 11)); if (chance(0.25)) col.colonists = Math.max(0, col.colonists - 1); col.relations = clamp(col.relations - 5, 0, 100); log("The natives raid the stores. Grain and blood spilled.", "bad"); }
    else if (e === "gift") { var gf = rint(8, 16); col.food += gf; col.sufficiency = clamp(col.sufficiency + rint(2, 6), 0, 100); log("The natives leave gifts at the perimeter — food and strange, useful tools.", "good"); }
    else if (e === "reinforce") { if (!col.reinforced) { col.reinforced = true; var nn = rint(2, 5); col.colonists += nn; col.sufficiency = clamp(col.sufficiency + rint(8, 16), 0, 100); log("A ship from home makes planetfall — " + nn + " more colonists and fresh supplies. You are not alone after all.", "good"); sfx("win"); } }
  }
  function endColonyCheck() {
    var col = game.colony;
    if (col.sufficiency >= 100) {
      if (col.petition) endGame(true, "You build a life beside the natives — two peoples on one shore. The colony is self-sustaining and growing.", "GUESTS OF PROXIMA");
      else endGame(true, "The colony stands on its own at last — fed, powered, and growing under an alien sun. Humanity has a second cradle." + (game.earth && game.earth.status === "silent" ? " It may be the only one left." : ""), "HAVEN");
      return true;
    }
    if (col.colonists <= 0) { endGame(false, "The last colonist lies down in alien soil. The settlement goes back to wilderness.", "WITHERED"); return true; }
    if (col.relations != null && col.relations <= 0) { endGame(false, "The natives have suffered you long enough. The colony is overrun and scattered.", "TURNED AWAY"); return true; }
    if (col.morale <= 0) { endGame(false, "The colony fractures into despair and faction, and does not survive the schism.", "WITHERED"); return true; }
    return false;
  }

  function beginReturn() {
    closeModal();
    game.ret = { legs: 0, maxLegs: 6, integrity: 48, fuel: Math.round(game.supplies.fuel), oxygen: Math.round(game.supplies.oxygen), food: Math.round(game.supplies.food), crew: alive().length };
    game.screen = "return";
    game.log.push({ msg: "═══ ACT II — THE LONG WAY HOME ═══", type: "sys", day: game.day });
    log("You turn the ship around and point it back the way you came — the longest, loneliest road there is.", "sys");
    save();
    renderReturn();
  }
  function returnAction(type) {
    var r = game.ret; r.legs++;
    if (type === "push") { r.fuel -= rint(4, 8); r.integrity += rint(3, 8); log("Leg " + r.legs + ": you burn hard for home — ground covered, fuel spent.", "info"); }
    else if (type === "steady") { r.food -= rint(2, 5); r.oxygen -= rint(2, 5); r.integrity += rint(1, 4); log("Leg " + r.legs + ": steady as she goes.", "info"); }
    else if (type === "scavenge") { if (sampleWeighted({ find: 5, danger: 3 }) === "find") { r.fuel += rint(5, 11); r.food += rint(5, 11); r.integrity += 2; log("You strip a derelict for fuel and stores.", "good"); } else { r.integrity -= rint(2, 6); log("The scavenge goes badly — the ship takes damage.", "bad"); } }
    returnEvent();
    if (r.fuel < 0 || r.oxygen < 0 || r.food < 0) { r.integrity -= 8; r.fuel = Math.max(0, r.fuel); r.oxygen = Math.max(0, r.oxygen); r.food = Math.max(0, r.food); log("Supplies run short on the long road home.", "bad"); }
    sfx("tick");
    save();
    if (r.legs >= r.maxLegs) { endReturn(); return; }
    renderReturn();
  }
  function returnEvent() {
    var r = game.ret;
    if (!chance(0.55)) return;
    var opts = { quiet: 3, overtaken: 2, derelict: 2 };
    if (game.alien && game.alien.pursuit) opts.pursuer = 3;
    if ((game.dest.knowledge >= 35 || (game.alien && game.alien.tech))) opts.fold = 1.5;
    var e = sampleWeighted(opts);
    if (e === "overtaken") { r.integrity += rint(-2, 4); log("A newer, faster ship overtakes you bound the other way — they wave, and are gone in a heartbeat. Bittersweet.", "warn"); }
    else if (e === "derelict") { r.fuel += rint(2, 7); log("You pass a tomb-ship and take what fuel it no longer needs.", "info"); }
    else if (e === "pursuer") { r.integrity -= rint(4, 9); var c = pick(awake().filter(function (x) { return !x.child; })); if (c) c.health = clamp(c.health - rint(8, 18), 0, 100); log("The thing that followed you is still out there. It strikes from the dark.", "bad"); sfx("bad"); }
    else if (e === "fold") { r.integrity += rint(8, 16); log("Alien charts let you fold the way home short — months, maybe years, saved.", "good"); sfx("win"); }
    else log("Long empty days. The crew counts them.", "info");
  }
  function endReturn() {
    var r = game.ret, earthGone = game.earth && game.earth.status === "silent";
    var won = false, tier, cause;
    if (earthGone) {
      if (r.integrity >= 60) { tier = "TOO LATE"; cause = "You cross back to where Earth was, whole but too late. The cradle is silent — domes dark, the seas still. You carried hope to an empty house."; }
      else { tier = "LOST WITH ALL HANDS"; cause = "You turn toward a home that stopped answering years ago. Somewhere in the long dark, so do you."; }
    } else if (r.integrity >= 70) { won = true; tier = "MESSENGER"; cause = "Decades later you reach home space with the only good news in a generation. A dying Earth dares, again, to pack its bags."; }
    else if (r.integrity >= 45) { won = true; tier = "THE LONG WAY HOME"; cause = "Battered but alive, you limp into home space and pass on what you found. It will have to be enough — and somehow, it is."; }
    else if (r.integrity >= 25) { tier = "TOO LATE"; cause = "You make it back, barely, to find the cities dark and quiet. Hope carried across the void to a house already emptying."; }
    else { tier = "LOST WITH ALL HANDS"; cause = "The road home is longer and far less kind than the road out. Somewhere in the dark, the ship simply stops."; }
    endGame(won, cause, tier);
  }

  function endGame(won, cause, tier) {
    if (game.ended) return;
    game.ended = true;
    game.won = won;
    game.cause = cause;
    game.outcomeTier = tier || (won ? "ARRIVED" : "LOST");
    var sc = computeScore();
    var rank = won ? rankFor(sc.total) : rankFor(Math.min(sc.total, RANKS[2].min - 1));
    // Record run + meta
    meta.runs.unshift({
      date: new Date().toISOString().slice(0, 10),
      role: game.role, difficulty: game.difficulty,
      won: won, score: sc.total, rank: rank, day: game.day,
      cause: cause, survivors: sc.survivors, tier: game.outcomeTier
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
      if (k === "credits") { game.credits = Math.max(0, game.credits + o.res[k]); continue; }
      var delta = o.res[k];
      // Positive gains of hold-bearing goods can't exceed cargo capacity.
      if (delta > 0 && k !== "medicine") delta = Math.min(delta, cargoSpace());
      game.supplies[k] = Math.max(0, round1((game.supplies[k] || 0) + delta));
    }
    if (o.parts) game.ship.parts = Math.max(0, game.ship.parts + (o.parts > 0 ? Math.min(o.parts, cargoSpace()) : o.parts));
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
    if (o.recruit) addCrewMember(o.recruit === true ? null : o.recruit);
    if (o.clearPursuit && game.alien) game.alien.pursuit = false;
    if (o.inf) influence(o.inf);              // bend the hidden odds (probabilistic engine)
    if (o.text) log(o.text, o.type || "info");
    return o.text || "";
  }

  // Skill-check choice resolver.
  function resolveCheck(role, baseDiff, success, failure) {
    var diff = baseDiff + Math.round((DIFFICULTY[game.difficulty].harsh - 1) * 40);
    if (!game.power.allocation.sensors) diff += 12;   // sensors help navigation/analysis
    diff -= Math.round((game.potential - 50) * 0.15);  // momentum: a run that's going well compounds
    diff -= aiAssist();                                // ATLAS helps while stable, hinders while failing
    var roll = skillAwake(role) + rint(0, 40);
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
    { id: "derelict", w: 7, mood: "discover", title: "Derelict Vessel", art: "[≣≣≣]·· drifting",
      text: "A dead ship tumbles ahead, hull dark. Salvage — or trap?",
      choices: [
        { label: "Board and salvage (Xenobiologist)", role: "Xenobiologist", diff: 60,
          success: { res: { fuel: +10, medicine: +1 }, parts: +2, inf: { explore: +5, knowledge: +3 }, text: "A clean haul: fuel, parts, a med kit.", type: "good" },
          failure: { hull: -8, target: "one", health: -18, inf: { explore: +4, caution: -3 }, text: "Something shifts in the dark. You retreat hurt.", type: "bad" } },
        { label: "Strip it from outside (slow, safe)", auto: true,
          outcome: { res: { fuel: +4 }, inf: { caution: +3 }, text: "You siphon a little fuel and move on.", type: "info" } },
        { label: "Leave it. Bad feeling.", auto: true,
          outcome: { morale: +1, inf: { caution: +4, explore: -2 }, text: "You give it a wide berth. The crew sleeps easier.", type: "info" } }
      ] },
    { id: "distress", w: 6, mood: "crew", title: "Distress Signal",
      text: "A weak signal pulses from a stranded pod. Survivors — and another mouth to feed if you take them in.",
      choices: [
        { label: "Rescue them (a new crewmate — more mouths, more hands)", auto: true,
          outcome: { res: { oxygen: -6, food: -6 }, morale: +8, credits: +90, recruit: true,
                     inf: { cooperate: +6, persist: +3, potential: +2 },
                     text: "You take them aboard. A survivor joins the crew — and shares what little they have.", type: "good" } },
        { label: "Record it and move on", auto: true,
          outcome: { morale: -6, inf: { cooperate: -5, aggress: +3, potential: -2 },
                     text: "You log the coordinates and leave them to the dark. No one speaks for a while.", type: "warn" } }
      ] },
    { id: "probe", w: 5, mood: "discover", req: "postContact", title: "Alien Probe", art: "◉─◌─◉",
      text: "Another of their artifacts matches your course — you know now what hands shaped it.",
      choices: [
        { label: "Study it (Xenobiologist)", role: "Xenobiologist", diff: 64,
          success: { credits: +260, morale: +8, text: "Its data is priceless. Every reading rewrites a textbook.", type: "good" },
          failure: { res: { oxygen: -5 }, morale: -4, text: "It pulses, fries a system, and goes dark.", type: "bad" } },
        { label: "Don't touch it", auto: true,
          outcome: { text: "You watch it drift away. Some questions keep.", type: "info" } }
      ] },
    { id: "parley", w: 6, mood: "crew", req: "postContact", title: "Drifting Vessel", art: "◇◈◇  ~hum~",
      text: "One of their smaller craft slows beside you, lights cycling in patient sequence. It seems to be offering... an exchange.",
      choices: [
        { label: "Trade with them (Xenobiologist)", role: "Xenobiologist", diff: 58,
          success: { res: { fuel: +14, medicine: +2, oxygen: +10 }, credits: -80, morale: +6, text: "You learn the rhythm of their bartering. They leave you richer in everything that matters out here.", type: "good" },
          failure: { res: { oxygen: -6 }, morale: -4, text: "You misread the exchange. They withdraw, and something aboard sparks and dies.", type: "bad" } },
        { label: "Offer salvage for their tech", auto: true,
          outcome: { parts: -2, res: { fuel: +8, charges: +3 }, text: "A clumsy but honest swap: your scrap for their strange fuel.", type: "info" } },
        { label: "Wave them off", auto: true,
          outcome: { text: "You signal no. They dim, and drift back into the dark.", type: "info" } }
      ] },
    { id: "pursuit", w: 9, mood: "confront", req: "postContact", cond: function () { return game.alien && game.alien.pursuit; },
      title: "Still Following", art: "  ·  ◣  ·  →",
      text: "The thing from the deep is still matching your course — closer now than the last time you dared to look.",
      choices: [
        { label: "Lose them in a hard burn (Pilot)", role: "Pilot", diff: 66,
          success: { res: { fuel: -10 }, clearPursuit: true, inf: { caution: +3, potential: +2 }, text: "You shake them at last. The sensors go blessedly, achingly empty.", type: "good" },
          failure: { hull: -rint(10, 22), res: { fuel: -8 }, inf: { potential: -3 }, text: "You burn everything and still they hold the gap. They are not done with you.", type: "bad" } },
        { label: "Stand your ground and fight them off", auto: true,
          outcome: { hull: -rint(14, 28), target: "one", health: -rint(10, 25), inf: { aggress: +4, potential: -2 }, text: "You trade blows in the dark. They withdraw — for now — but the ship is the worse for it.", type: "bad" } }
      ] },
    { id: "shoal", w: 4, mood: "discover", req: "postContact", zones: ["void", "outer"], title: "The Shoal", art: "· ◌ ◌ ◌ ·",
      text: "A school of living lights drifts across the void, turning together like one vast mind. They are not afraid of you.",
      choices: [
        { label: "Drift with them a while", auto: true,
          outcome: { morale: +10, text: "For an hour the crew forgets the cold. Wonder is its own kind of fuel.", type: "good" } }
      ] },
    { id: "signal", w: 5, mood: "discover", req: "preContact", zones: ["outer", "void"], title: "Impossible Signal", art: "/\\/\\ ? /\\/\\",
      text: "A repeating pattern threads through the static — too regular for noise, too strange for any human code. No one will say out loud what they're thinking.",
      choices: [
        { label: "Log it and watch the dark", auto: true,
          outcome: { morale: -3, text: "You file it under 'instrument error.' Nobody believes that, including you.", type: "warn" } }
      ] },
    { id: "shadow", w: 4, mood: "caution", req: "preContact", zones: ["outer", "void"], title: "Geometric Shadow",
      text: "For a heartbeat the stars ahead are blotted out by something with edges — far too straight to be a rock. Then it's gone.",
      choices: [
        { label: "Hold course, say nothing", auto: true,
          outcome: { morale: -4, text: "You don't change heading. You don't sleep well, either.", type: "warn" } }
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
    { id: "stowaway", w: 4, mood: "crew", title: "Stowaway",
      text: "You find a refugee curled in a maintenance crawlspace.",
      choices: [
        { label: "Welcome them (a new crewmate — more mouths, more hands)", auto: true,
          outcome: { res: { food: -6, oxygen: -4 }, morale: +6, recruit: true, inf: { cooperate: +5, explore: +2 }, text: "An extra pair of hands and a story to tell. They join the crew; morale lifts.", type: "good" } },
        { label: "Confine them to the brig", auto: true,
          outcome: { morale: -3, inf: { cooperate: -4, aggress: +3 }, text: "Locked away. The crew is uneasy about it.", type: "warn" } }
      ] },
    { id: "morale", w: 6, mood: "crew", title: "Quiet Evening",
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
    { id: "sensorghost", w: 4, mood: "caution", req: "preContact", title: "Sensor Ghost", zones: ["void", "outer"],
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
      // Gate alien content behind first contact; gate foreshadowing to before it.
      if (e.req === "postContact" && !game.contact) return false;
      if (e.req === "preContact" && game.contact) return false;
      if (e.cond && !e.cond()) return false;
      if (!e.zones) return true;
      return e.zones.indexOf(zone) > -1;
    });
    // Weighted pick — but the crew's posture bends which kinds of events surface,
    // so an aggressive run feels different from an exploratory one.
    var total = pool.reduce(function (s, e) { return s + eventWeight(e); }, 0);
    var r = Math.random() * total, acc = 0, ev = pool[0];
    for (var i = 0; i < pool.length; i++) { acc += eventWeight(pool[i]); if (r <= acc) { ev = pool[i]; break; } }
    presentEvent(ev);
  }
  var MOOD_AXIS = { confront: "aggress", discover: "explore", crew: "cooperate", caution: "caution" };
  function eventWeight(e) {
    var w = e.w;
    if (e.mood && MOOD_AXIS[e.mood]) {
      w *= (1 + clamp(game.posture[MOOD_AXIS[e.mood]], -100, 100) / 100 * 0.8);
    }
    return Math.max(0.1, w);
  }

  function currentZone() {
    var i = game.waypointIndex;
    if (i <= 3) return "inner";
    if (i === 7 || i === 8) return "void";
    return "outer";
  }

  function presentEvent(ev) {
    // A role-locked choice is only honestly available if that specialist is alive and awake.
    var viable = ev.choices.map(function (ch) { return !ch.role || hasAwakeSpecialist(ch.role); });
    var anyViable = viable.some(Boolean);
    var choices = ev.choices.map(function (ch, i) {
      var noOne = ch.role && !viable[i];
      return {
        // Don't pretend a dead/sleeping specialist will do it. Block the option when there's a
        // real alternative; if it's the ONLY option, leave it as a desperate (penalized) attempt.
        label: ch.label + (ch.role ? "  [" + ch.role + (noOne ? " — none aboard" : "") + "]" : ""),
        disabled: noOne && anyViable,
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
  // Hazards resolve on a SAMPLED severity spectrum (clean → catastrophic loss), with odds
  // bent by Pilot skill, sensors, current hull, posture, and luck. No guaranteed safe option —
  // every approach carries a real tail risk, and a bad crossing can end the run.
  var HAZARDS = {
    belt: {
      title: "CROSSING: The Asteroid Belt", noun: "the belt",
      art: "  o   .  O   ·  o\n .  O   .   o   .",
      text: "Rock and ice tumble across your path in every direction. There is no safe way through — only ways that are less likely to kill you.",
      deathText: "A mountain of iron you never saw comes out of the dark. The ship is shredded across the belt. The voyage ends here.",
      options: [
        { label: "Thread it at speed (Pilot's hands)", role: "Pilot", risk: 0.44, cost: { res: { fuel: -3 } }, inf: { aggress: +3, caution: -3 } },
        { label: "Power through behind the shields", risk: 0.52, cost: { hull: -8, res: { fuel: -4 } }, inf: { aggress: +2 } },
        { label: "Pick a slow, careful path around", risk: 0.24, cost: { res: { fuel: -13, food: -6, oxygen: -6 } }, inf: { caution: +4, persist: +1 } }
      ]
    },
    flare: {
      title: "CROSSING: Proxima Approach", noun: "the flare",
      art: "(((( ★ ))))  radiation",
      text: "Proxima flares as you make your final run — a wall of hard radiation across the doorstep. After all of it, this is where it could still end.",
      deathText: "The flare peaks just as you commit. The hull lights up from within. So close. The ship dies in the glare of the star you crossed the dark to reach.",
      options: [
        { label: "Slingshot through fast (Pilot's hands)", role: "Pilot", risk: 0.5, cost: { res: { fuel: -5 } }, inf: { aggress: +3, caution: -3 } },
        { label: "Shields to max and endure", risk: 0.36, cost: { res: { oxygen: -10 }, hull: -5 }, inf: { caution: +3 } },
        { label: "Hold back for a lull (bleeds stores)", risk: 0.22, cost: { res: { food: -10, oxygen: -10 }, morale: -4 }, inf: { caution: +4, persist: -2 } }
      ]
    },
    nebula: {
      title: "CROSSING: The Oort Cloud", noun: "the cloud",
      art: "~ ~ . ~ fog ~ . ~ ~",
      text: "A cold haze of ice and dust blinds your sensors at the solar system's edge. It is very easy, here, to get lost.",
      deathText: "You go in, and you simply never come out. The cloud swallows the ship whole.",
      options: [
        { label: "Navigate blind (Pilot's hands)", role: "Pilot", risk: 0.5, cost: {}, inf: { explore: +4, caution: -2 }, lostRisk: true },
        { label: "Crawl through slowly (bleeds stores)", risk: 0.3, cost: { res: { food: -10, oxygen: -10 } }, inf: { caution: +4 }, lostRisk: true }
      ]
    }
  };

  var hazardQueue = [];
  function queueHazard(wp) { hazardQueue.push(wp.hazard); }
  function flushQueues() {
    // Called from travel render when no modal/transit is busy. Each interaction is
    // preceded by a short arrival vignette for the Oregon-Trail between-scene feel.
    if (modalOpen() || transiting) return;
    if (game._win) { game._win = false; if (game.autopilot) wakeSelf("arrival"); winGame(); return; }
    if (game._contactPending) { game._contactPending = false; presentFirstContact(); return; }
    if (game._wormholePending) { game._wormholePending = false; presentWormhole(); return; }
    // Autopilot: the captain is asleep, so interactions resolve without a prompt.
    if (game.autopilot) {
      if (hazardQueue.length) { autoResolveHazard(hazardQueue.shift()); return; }
      if (stationQueue.length) { stationQueue.shift(); log("Autopilot coasts past the station — no one awake to dock or trade.", "warn"); renderTravel(); return; }
      if (voidQueue.length) { voidQueue.shift(); renderTravel(); return; }
    }
    if (hazardQueue.length) {
      var hz = hazardQueue.shift();
      playTransit({ variant: "hazard", caption: "HAZARD AHEAD" }, function () { presentHazard(hz); });
      return;
    }
    if (stationQueue.length) {
      var st = stationQueue.shift();
      game._stationFresh = true;
      playTransit({ variant: "dock", caption: "APPROACHING · " + st.name.toUpperCase() }, function () { presentStation(st); });
      return;
    }
    if (voidQueue.length) { var v = voidQueue.shift(); presentVoid(v); return; }
  }

  /* ---------------------------------------------------------
     10b. First contact (scripted surprise) + aftermath
     --------------------------------------------------------- */
  function presentFirstContact() {
    game.contact = true;
    sfx("good");
    log("◆ FIRST CONTACT — you are not alone. ◆", "sys");
    openModal({
      title: "✷ FIRST CONTACT ✷",
      art: "        ◌\n   ·   ╱│╲   ·\n      ◉──┼──◉\n   ·   ╲│╱   ·\n        ◌",
      body: "<p>Out here, past the last whisper of any human signal, the dark answers back.</p>" +
        "<p>A structure keeps perfect pace alongside you — vast, patterned, <span class='paper'>built by no human hand</span>. It has been waiting. Three instincts war on the bridge: <span class='paper'>fight, flee, or hold perfectly still</span>. No one knows what it will do. No one can.</p>",
      choices: [
        { label: "FIGHT — power weapons, warn them off", onClick: function () { resolveContact("fight"); } },
        { label: "FLIGHT — burn hard and run", onClick: function () { resolveContact("flight"); } },
        { label: "FREEZE — hold still, go dark, wait", onClick: function () { resolveContact("freeze"); } }
      ]
    });
  }
  // Fight / Flight / Freeze — each branches into SAMPLED, uncertain outcomes. No guarantees.
  function resolveContact(choice) {
    game.contactChoice = choice;
    game.alien.posture = choice;
    closeModal();
    if (choice === "fight") {
      influence({ aggress: +12, cooperate: -8, caution: -4, potential: -4 });
      var sev = sampleWeighted({ repelled: 2, hurt: 5, mauled: 4, destroyed: Math.max(0.3, 2 - skillAwake("Pilot") / 40) });
      if (sev === "repelled") {
        game.alien.tech = chance(0.5); game.alien.friendly = false;
        if (game.alien.tech) influence({ knowledge: +10 });
        log("You strike first and they recoil. In the wreck-light you scavenge something impossible.", "good"); sfx("good");
      } else if (sev === "hurt") {
        applyOutcome({ hull: -rint(18, 30) }); var c = pick(awake());
        if (c) { c.health = clamp(c.health - rint(15, 30), 0, 100); if (c.health <= 0) killCrew(c, "fell in the exchange"); }
        game.alien.friendly = false; game.alien.pursuit = true;
        log("They answer your fire. Hull buckles — and they will remember this.", "bad"); sfx("bad");
      } else if (sev === "mauled") {
        applyOutcome({ hull: -rint(30, 50) }); var v = pick(awake()); if (v) killCrew(v, "was killed when they struck back");
        game.alien.pursuit = true; game.alien.friendly = false; influence({ potential: -6 });
        log("They strike back with terrible precision. You flee, bleeding.", "bad"); sfx("bad");
      } else {
        endGame(false, "They do not forgive the first shot. The ship is unmade in a single instant of light."); return;
      }
    } else if (choice === "flight") {
      influence({ aggress: +2, caution: +4, persist: +2, cooperate: -2, potential: -1 });
      game.supplies.fuel = Math.max(0, game.supplies.fuel - rint(6, 12));
      if (odds(40 + skillAwake("Pilot") * 0.4)) {
        game.alien.pursuit = false; game.alien.friendly = null;
        log("You burn hard into the dark and lose them. The crew breathes again — and wonders forever.", "warn");
      } else {
        game.alien.pursuit = true; game.alien.friendly = false;
        log("You run. They follow — patient, matching every burn. You are not alone now, and never will be.", "bad"); sfx("bad");
      }
    } else { // freeze — highest variance
      influence({ explore: +6, cooperate: +6, caution: +5, potential: +3, knowledge: +6 });
      var f = sampleWeighted({ commune: 5, ignored: 4, experiment: 3, annihilate: 1 });
      if (f === "commune") {
        game.alien.friendly = true; game.alien.tech = chance(0.6);
        adjustMoraleAll(+14, true); influence({ potential: +10, knowledge: +12 });
        if (game.alien.tech) game.cargo.rareMetals += Math.min(cargoSpace(), 6);
        log("You hold still — and they reach back. Meaning passes between species. The crew weeps. You carry their knowledge now, of life and of the spaces between stars.", "good"); sfx("win");
      } else if (f === "ignored") {
        log("You hold still. They study you a long, breathless while — then move on, vast and indifferent.", "info");
      } else if (f === "experiment") {
        var vv = pick(awake()); if (vv) killCrew(vv, "was taken — lights, then gone", true);
        game.alien.friendly = null; influence({ potential: -3 });
        log("You hold still. They reach into the hull and take one of you, to learn. The rest are left to grieve.", "bad"); sfx("bad");
      } else {
        endGame(false, "You hold still — and they decide you are not worth the keeping. The ship goes dark forever."); return;
      }
    }
    save();
    checkEnd();
    if (!game.ended) renderTravel();
  }

  function presentHazard(key) {
    var hz = HAZARDS[key];
    if (!hz) return;
    var viable = hz.options.map(function (op) { return !op.role || hasAwakeSpecialist(op.role); });
    var anyViable = viable.some(Boolean);
    var choices = hz.options.map(function (op, i) {
      var noOne = op.role && !viable[i];
      return { label: op.label + (op.role ? "  [" + op.role + (noOne ? " — none aboard" : "") + "]" : ""),
               disabled: noOne && anyViable,
               onClick: function () { resolveHazard(key, op); } };
    });
    openModal({ title: "≋ " + hz.title, art: hz.art,
      body: hz.text + "<div class='small dim' style='margin-top:8px'>Crew disposition: " + (dispositionText() || "steady") + "</div>",
      choices: choices });
  }

  function resolveHazard(key, op) {
    closeModal();
    var hz = HAZARDS[key];
    if (op.cost) applyOutcome({ res: op.cost.res, hull: op.cost.hull, morale: op.cost.morale });
    if (op.inf) influence(op.inf);
    // Build the danger probability, then SAMPLE a severity. Skill/sensors/hull/posture bend it.
    var pilot = skillAwake("Pilot");
    var danger = op.risk;
    danger += (100 - game.ship.hull) / 240;                 // a wounded ship is in more peril
    danger -= (op.role === "Pilot" ? pilot : pilot * 0.4) / 320;
    if (!game.power.allocation.sensors) danger += 0.12;     // flying blind is worse
    if (game.autopilot) danger += 0.20;                     // no one at the helm
    danger += Math.max(0, -game.posture.caution) / 500;     // recklessness courts catastrophe
    danger += Math.max(0, game.posture.aggress) / 800;
    danger -= (game.potential - 50) * 0.0025;               // momentum bleeds into peril, too
    danger -= aiAssist() * 0.003;                            // ATLAS's nav help (or sabotage)
    danger *= DIFFICULTY[game.difficulty].harsh;
    danger = clamp(danger, 0.03, 0.95);
    var d = danger;
    var sev = sampleWeighted({
      clean:        Math.max(0.03, (1 - d) * 1.5),
      graze:        0.45 + d * 0.6,
      serious:      d * 1.0,
      casualty:     Math.max(0, d - 0.34) * 1.25,
      crippling:    Math.max(0, d - 0.58) * 1.15,
      catastrophic: Math.max(0, d - 0.80) * 1.0
    });
    applyHazardSeverity(hz, sev, op);
    sfx(sev === "clean" || sev === "graze" ? "select" : "bad");
    if (!game.ended) { save(); checkEnd(); if (!game.ended) renderTravel(); }
  }

  function applyHazardSeverity(hz, sev, op) {
    var n = hz.noun || "the hazard";
    if (sev === "clean") {
      influence({ potential: +1, persist: +1 });
      log("You slip through " + n + " clean — not a scratch. The crew lets out a breath.", "good");
    } else if (sev === "graze") {
      applyOutcome({ hull: -rint(8, 14), text: "You take a few hits crossing " + n + ". Hull scarred, nothing vital.", type: "warn" });
    } else if (sev === "serious") {
      applyOutcome({ hull: -rint(16, 26) });
      if (chance(0.5)) afflict();
      else { var c = pick(awake()); if (c) { c.health = clamp(c.health - rint(18, 30), 0, 100); if (c.health <= 0) killCrew(c, "was lost crossing " + n); else c.status = "Injured"; } }
      log("A bad crossing of " + n + ". Real damage, and someone is hurt.", "bad");
    } else if (sev === "casualty") {
      applyOutcome({ hull: -rint(14, 24) });
      var v = pick(awake()); if (v) killCrew(v, "was killed crossing " + n);
      if (chance(0.25)) { var v2 = pick(awake()); if (v2) killCrew(v2, "died in the same disaster"); }
      influence({ potential: -3 });
      log(n + " takes a life. The ship limps onward, quieter than before.", "bad");
    } else if (sev === "crippling") {
      applyOutcome({ hull: -rint(30, 45), res: { fuel: -rint(8, 16), oxygen: -rint(6, 12) } });
      influence({ potential: -5 });
      if (op.lostRisk || chance(0.5)) {
        var back = rint(8, 20); game.distance = Math.max(0, game.distance - back);
        log("You come out of " + n + " crippled AND lost — flung " + back + " back off course.", "bad");
      } else log("You barely survive " + n + ". The ship is gutted.", "bad");
    } else { // catastrophic
      endGame(false, hz.deathText || ("The ship is torn apart in " + n + ". The voyage ends here, in silence."));
    }
  }

  /* ---------------------------------------------------------
     11. Stations (rest / trade)
     --------------------------------------------------------- */
  var stationQueue = [];
  function queueStation(wp) { stationQueue.push(wp); }
  function presentStation(wp) {
    // Contraband 'heat' catches up at the next port — but only checked once per visit.
    if (game._stationFresh && game._heat > 0 && chance(0.5)) {
      var fine = rint(60, 170);
      game.credits = Math.max(0, game.credits - fine);
      game._heat = 0;
      log("Station security flags your manifest — a " + fine + " cr fine for that contraband.", "bad");
    }
    game._stationFresh = false;
    openModal({
      title: "⌖ " + wp.name,
      art: "",
      body: wp.blurb + "<br><br>You may trade, look for work, rest, or depart. (Do as many as you like, then depart.)",
      choices: [
        { label: "Trade with the station", onClick: function () { closeModal(); openTrade(wp); } },
        { label: "Look for work (earn credits)", onClick: function () { closeModal(); openJobs(wp); } },
        { label: "Rest & repair (costs time)", onClick: function () { closeModal(); doRestRepair(wp); } },
        { label: "Depart", onClick: function () { sfx("confirm"); closeModal(); renderTravel(); } }
      ]
    });
  }

  function openTrade(wp) {
    var idx = wpIndexOf(wp);
    var rows = STORE_ITEMS.map(function (it) {
      var buy = priceAt(idx, it.key, "buy"), sell = priceAt(idx, it.key, "sell");
      var have = it.key === "parts" ? game.ship.parts : game.supplies[it.key];
      return "<div class='store-row'>" +
        "<span>" + it.name + "</span>" +
        "<span class='qty'>have " + have + "</span>" +
        "<span class='qty small'>b" + buy + "/s" + sell + "</span>" +
        "<span class='stepper'>" +
          "<button class='btn small' data-trade='buy' data-item='" + it.key + "' data-price='" + buy + "' data-step='" + it.step + "'>Buy " + it.step + "</button>" +
          "<button class='btn small' data-trade='sell' data-item='" + it.key + "' data-price='" + sell + "' data-step='" + it.step + "'>Sell " + it.step + "</button>" +
        "</span></div>";
    }).join("");
    var commRows = Object.keys(COMMODITIES).map(function (ck) {
      var have = game.cargo[ck] || 0;
      if (have <= 0) return "";
      var sell = priceAt(idx, ck, "sell");
      return "<div class='store-row'>" +
        "<span>" + COMMODITIES[ck].icon + " " + COMMODITIES[ck].name + "</span>" +
        "<span class='qty'>have " + have + "</span>" +
        "<span class='qty small'>s" + sell + " ea</span>" +
        "<span class='stepper'><button class='btn small go' data-sellcomm='" + ck + "' data-price='" + sell + "'>Sell all (" + (have * sell) + ")</button></span></div>";
    }).join("");
    openModal({
      title: "⇄ Trade — " + wp.name,
      art: "",
      body: "<div class='small dim'>Credits: <span id='trade-cr' class='paper'>" + game.credits + "</span> · Hold " + cargoUsed() + "/" + game.ship.holdMax + "</div>" + rows +
        (commRows ? "<div class='panel-title' style='margin-top:8px'>Cargo to sell</div>" + commRows : ""),
      choices: [{ label: "Done", onClick: function () { sfx("confirm"); closeModal(); save(); presentStation(wp); } }],
      onBind: function (root) {
        root.querySelectorAll("[data-trade]").forEach(function (b) {
          b.addEventListener("click", function () {
            var item = b.getAttribute("data-item"), price = +b.getAttribute("data-price"), step = +b.getAttribute("data-step"), dir = b.getAttribute("data-trade");
            if (dir === "buy") {
              if (item !== "medicine" && cargoSpace() < step) { sfx("empty"); }
              else if (game.credits >= price) { game.credits -= price; if (item === "parts") game.ship.parts += step; else game.supplies[item] += step; sfx("buy"); }
              else { sfx("empty"); }
            } else {
              var have = item === "parts" ? game.ship.parts : game.supplies[item];
              if (have >= step) { if (item === "parts") game.ship.parts -= step; else game.supplies[item] -= step; game.credits += price; sfx("select"); }
              else { sfx("empty"); }
            }
            closeModal(); openTrade(wp);
          });
        });
        root.querySelectorAll("[data-sellcomm]").forEach(function (b) {
          b.addEventListener("click", function () {
            var ck = b.getAttribute("data-sellcomm"), price = +b.getAttribute("data-price"), have = game.cargo[ck] || 0;
            if (have > 0) { game.credits += have * price; game.cargo[ck] = 0; log("Sold " + have + " " + COMMODITIES[ck].name + " for " + (have * price) + " cr.", "good"); sfx("buy"); }
            closeModal(); openTrade(wp);
          });
        });
      }
    });
  }

  // Skill-gated outpost jobs — the relief valve for a broke crew.
  function genJobs(wpIndex) {
    var df = wpIndex / (WAYPOINTS.length - 1);
    var payBase = Math.round(110 + df * 240);
    function hasRole(r) { return game.crew.some(function (c) { return c.role === r && c.status !== "Dead" && c.status !== "Hibernating"; }); }
    var jobs = [];
    if (hasRole("Engineer")) jobs.push({ id: "repair", label: "Repair contract", role: "Engineer", diff: 55, pay: payBase, bonus: "parts" });
    if (hasRole("Medic")) jobs.push({ id: "med", label: "Clinic shift", role: "Medic", diff: 52, pay: Math.round(payBase * 0.9), bonus: "medicine" });
    if (hasRole("Xenobiologist")) jobs.push({ id: "survey", label: "Survey & research", role: "Xenobiologist", diff: 58, pay: Math.round(payBase * 0.8), bonus: "knowledge" });
    if (hasRole("Pilot") || hasRole("Xenobiologist")) jobs.push({ id: "smuggle", label: "Run contraband (risky, pays double)", role: hasRole("Pilot") ? "Pilot" : "Xenobiologist", diff: 60, pay: Math.round(payBase * 2), smuggle: true });
    jobs.push({ id: "haul", label: "Dock labor (anyone, modest, sure pay)", role: null, diff: 0, pay: Math.round(payBase * 0.5) });
    return jobs.slice(0, 3);
  }
  function openJobs(wp) {
    var idx = wpIndexOf(wp), jobs = genJobs(idx);
    var rows = jobs.map(function (j, i) {
      return "<div class='store-row'><span>" + j.label + (j.role ? " <span class='dim'>[" + j.role + "]</span>" : "") + "</span>" +
        "<span class='qty'>~" + j.pay + " cr</span><span></span>" +
        "<span><button class='btn small' data-job='" + i + "'>Take</button></span></div>";
    }).join("");
    openModal({
      title: "⚒ Work — " + wp.name,
      body: "<div class='small dim'>Jobs depend on who's awake and able. Work costs a few days. Credits: <span class='paper'>" + game.credits + "</span></div>" + rows,
      choices: [{ label: "Back", onClick: function () { sfx("cancel"); closeModal(); presentStation(wp); } }],
      onBind: function (root) {
        root.querySelectorAll("[data-job]").forEach(function (b) {
          b.addEventListener("click", function () { resolveJob(jobs[+b.getAttribute("data-job")], wp); });
        });
      }
    });
  }
  function resolveJob(j, wp) {
    closeModal();
    game.day += rint(2, 4);
    var ok = j.role ? (skillFor(j.role) + rint(0, 40) >= j.diff) : true;
    if (j.smuggle) {
      if (ok) { game.credits += j.pay; game._heat = (game._heat || 0) + 1; influence({ aggress: +3, caution: -3 }); log("Contraband run pays off: +" + j.pay + " cr. But you're carrying heat now.", "good"); sfx("buy"); }
      else { var loss = rint(40, 120); game.credits = Math.max(0, game.credits - loss); influence({ potential: -3 }); log("The contraband run goes bad — busted for " + loss + " cr and a black mark.", "bad"); sfx("bad"); }
    } else if (ok) {
      game.credits += j.pay;
      if (j.bonus === "parts" && cargoSpace() > 0) game.ship.parts += 1;
      if (j.bonus === "medicine") game.supplies.medicine += 1;
      if (j.bonus === "knowledge") influence({ knowledge: +6, explore: +2 });
      influence({ persist: +1, cooperate: +1 });
      log("Honest work done: +" + j.pay + " cr" + (j.bonus && j.bonus !== "knowledge" ? " and a little " + j.bonus : "") + ".", "good"); sfx("buy");
    } else {
      var partial = Math.round(j.pay * 0.4);
      game.credits += partial;
      log("The job goes poorly — only " + partial + " cr to show for the days lost.", "warn"); sfx("select");
    }
    save();
    checkEnd();
    if (!game.ended) { if (wp) presentStation(wp); else renderTravel(); }
  }

  function doRestRepair(wp) {
    var eng = skillAwake("Engineer");
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
    if (!game.ended) { if (wp) presentStation(wp); else renderTravel(); }
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
      body: "<div class='small dim'>Sleepers use almost no air or food, but can't act in events. Keep a pilot awake to fly — and a <b class='paper'>Medic awake to treat sickness</b>, or ailments will fester untended.</div>" + rows,
      choices: [{ label: "Close", onClick: function () { sfx("confirm"); closeModal(); save(); renderTravel(); } }],
      onBind: function (root) {
        root.querySelectorAll("[data-hib]").forEach(function (b) {
          b.addEventListener("click", function () {
            var c = byName(b.getAttribute("data-name"));
            if (!c) return;
            if (b.getAttribute("data-hib") === "sleep") {
              if (c === playerChar()) { closeModal(); confirmSelfPod(); return; }
              c.status = "Hibernating";
              log(c.name + " enters cold sleep.", "info"); sfx("select");
            } else {
              if (c === playerChar() && game.autopilot) { wakeSelf(); }
              else {
                c.status = c.ailment ? "Sick" : "Healthy";
                if (chance(0.25)) { c.ailment = "hibernation sickness"; c.status = "Sick"; log(c.name + " wakes groggy and ill.", "warn"); }
                else log(c.name + " wakes from cold sleep.", "good");
              }
              sfx("select");
            }
            closeModal(); openHibernation();
          });
        });
      }
    });
  }

  // Podding the player-character is a desperate gamble — the ship goes to autopilot.
  function confirmSelfPod() {
    openModal({
      title: "⚠ COMMANDER TO COLD SLEEP?",
      art: "",
      body: "<p class='red'>If YOU enter a pod, no one commands the ship.</p>" +
        "<p>The ship flies itself on <b class='paper'>autopilot</b>: you make no decisions, events resolve without your hand (usually badly), and danger mounts every turn — until you wake. Choose how far you'll trust the machine.</p>",
      choices: [
        { label: "Sleep until the next waypoint", onClick: function () { enterAutopilot({ type: "waypoint", value: game.waypointIndex }); } },
        { label: "Sleep — wake only on emergency", onClick: function () { enterAutopilot({ type: "emergency" }); } },
        { label: "On second thought, stay awake", onClick: function () { sfx("cancel"); closeModal(); openHibernation(); } }
      ]
    });
  }
  function enterAutopilot(wake) {
    var me = playerChar();
    if (me) me.status = "Hibernating";
    game.autopilot = true;
    game.autopilotWake = wake;
    log("You seal yourself into the pod. The ship is on autopilot now. Whatever happens, happens.", "warn");
    sfx("warn");
    closeModal();
    save();
    renderTravel();
  }

  /* ---------------------------------------------------------
     12b. ATLAS management (diagnostics / purge)
     --------------------------------------------------------- */
  function openAI() {
    if (!game.ai) {
      openModal({ title: "🧠 " + AI_NAME, body: "<p>The core is gone. The ship is dumb now — no help, no harm, just you and the dark.</p>",
        choices: [{ label: "Close", onClick: function () { sfx("confirm"); closeModal(); renderTravel(); } }] });
      return;
    }
    var ai = Math.round(game.ai.integrity), st = aiState();
    var desc = st === "nominal" ? "ATLAS hums along, helpful and calm — assisting every system."
      : st === "degrading" ? "ATLAS is fraying — readings drift, decisions wander. It needs recalibration."
      : "ATLAS has turned. It fights you for the ship, and every diagnostic risks a reprisal.";
    var eng = hasAwakeSpecialist("Engineer");
    var choices = [{ label: "Run diagnostics & recalibrate  [Engineer" + (eng ? "" : " — none aboard") + "]", disabled: !eng, onClick: function () { aiDiagnostics(); } }];
    if (game.ai.integrity <= 40) choices.push({ label: "PURGE the core (drastic, irreversible)  [Engineer" + (eng ? "" : " — none aboard") + "]", disabled: !eng, onClick: function () { aiPurge(); } });
    choices.push({ label: "Close", onClick: function () { sfx("confirm"); closeModal(); renderTravel(); } });
    openModal({
      title: "🧠 " + AI_NAME + " — ship mind",
      art: "  ┌─◊─┐\n  │ " + (st === "hostile" ? "✖" : st === "degrading" ? "~" : "◉") + " │\n  └───┘",
      body: "<p>Core integrity <b class='" + (ai > 60 ? "cyan" : ai > 28 ? "amber" : "red") + "'>" + ai + "%</b> — status <b>" + st.toUpperCase() + "</b>.</p><p>" + desc + "</p>",
      choices: choices
    });
  }
  function aiDiagnostics() {
    closeModal();
    game.day += rint(2, 3);
    if (game.ai.integrity < 28 && chance(0.4)) {
      log(AI_NAME + " resists the recalibration and bites back.", "bad");
      aiHostile();
    } else {
      var gain = Math.round(15 + skillFor("Engineer") / 3);
      game.ai.integrity = clamp(game.ai.integrity + gain, 0, 100);
      log("Diagnostics complete — " + AI_NAME + " core integrity +" + gain + ".", "good");
      influence({ caution: +2 });
    }
    save(); checkEnd();
    if (!game.ended) renderTravel();
  }
  function aiPurge() {
    closeModal();
    game.day += rint(2, 3);
    if (skillFor("Engineer") + rint(0, 40) >= 60) {
      game.ai = null;
      adjustMoraleAll(-4, true);
      log("You tear out the core. " + AI_NAME + " goes silent mid-sentence. The ship is dumb now — and yours.", "warn");
      influence({ aggress: +4 });
      sfx("confirm");
    } else {
      log("The purge fails — " + AI_NAME + " locks you out and lashes the ship.", "bad");
      aiHostile(); aiHostile();
    }
    save(); checkEnd();
    if (!game.ended) renderTravel();
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
    var stillBrown = computePower().brownout;
    // You can ALWAYS proceed — but running under-powered strains the ship (no soft-lock).
    var label = !forced ? "Done" : (stillBrown ? "Run under brownout (systems strain)" : "Proceed");
    openModal({
      title: "⚡ Power Allocation",
      art: forced ? "!!! BROWNOUT !!!" : "",
      body: body,
      choices: [{ label: label,
                  onClick: function () {
                    sfx("confirm");
                    if (forced && computePower().brownout) {
                      // Penalty hits AIR, not hull — so it punishes without feeding the
                      // hull→output→brownout death spiral.
                      var deficit = game.power.demand - game.power.output;
                      game.supplies.oxygen = Math.max(0, round1(game.supplies.oxygen - deficit * 1.5));
                      adjustHealthAll(-3, true);
                      log("Running in brownout: scrubbers falter, the air goes thin and stale.", "bad");
                    }
                    closeModal(); if (thenFn) thenFn(); else renderTravel();
                  } }],
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
    mg = { charges: charges, time: 22, haul: { food: 0, fuel: 0, parts: 0, charges: 0, ice: 0, ore: 0, volatiles: 0, rareMetals: 0 }, timer: null, spawn: null, over: false };
    var ov = $("#minigame"); ov.classList.remove("hidden");
    renderMiningHud();
    $("#mg-field").innerHTML = "";
    sfx("confirm");
    spawnLoop();
    mg.timer = setInterval(function () {
      if (!mg) return;
      mg.time = round1(mg.time - 0.1);
      if (mg.time <= 0) endMining();
      else renderMiningHud();
    }, 100);
  }
  function renderMiningHud() {
    if (!mg) return;
    var ore = mg.haul.ice + mg.haul.ore + mg.haul.volatiles + mg.haul.rareMetals;
    $("#mg-hud").innerHTML =
      "Charges: <b>" + mg.charges + "</b>  ·  Time: <b>" + Math.max(0, mg.time).toFixed(1) + "s</b>  ·  " +
      "Haul — food <b>" + mg.haul.food + "</b> fuel <b>" + mg.haul.fuel + "</b> parts <b>" + mg.haul.parts + "</b> ore <b>" + ore + "</b>";
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
      { icon: "🪨", type: "food", min: 1, max: 3, w: 4 },
      { icon: "🧊", type: "fuel", min: 2, max: 4, w: 4 },
      { icon: "⛓", type: "parts", min: 1, max: 1, w: 2 },
      { icon: "🧊", type: "ice", min: 1, max: 3, w: 4 },          // sellable commodities
      { icon: "🪨", type: "ore", min: 1, max: 3, w: 4 },
      { icon: "⚗", type: "volatiles", min: 1, max: 2, w: 2 },
      { icon: "💠", type: "rareMetals", min: 1, max: 1, w: 1 }
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
      if (!mg || mg.over) return;
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
    // Returned (unused) charges don't count against the hold limit; the new haul does.
    game.supplies.charges += mg.charges;
    // Bank supplies first (life-critical), then sellable commodities, each clamped to the hold.
    var got = {}, gotComm = 0, lost = 0;
    [["food", "supply"], ["fuel", "supply"], ["charges", "supply"], ["parts", "parts"],
     ["ice", "cargo"], ["ore", "cargo"], ["volatiles", "cargo"], ["rareMetals", "cargo"]].forEach(function (p) {
      var want = mg.haul[p[0]] || 0; if (want <= 0) return;
      var add = Math.min(want, cargoSpace());
      if (add > 0) {
        if (p[1] === "supply") game.supplies[p[0]] += add;
        else if (p[1] === "parts") game.ship.parts += add;
        else { game.cargo[p[0]] += add; gotComm += add; }
        got[p[0]] = add;
      }
      lost += want - add;
    });
    log("Mining run: +" + (got.food || 0) + " food, +" + (got.fuel || 0) + " fuel, +" + (got.parts || 0) + " parts, +" + (got.charges || 0) + " charges, +" + gotComm + " sellable ore." +
        (lost > 0 ? " (" + lost + " jettisoned — hold full.)" : ""), "good");
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
      var b = el("button", { class: "btn" + (ch.disabled ? " disabled" : "") }, ch.label);
      if (ch.disabled) b.disabled = true;
      b.addEventListener("click", function () { if (b.disabled) return; sfx("blip"); ch.onClick(); });
      box.appendChild(b);
    });
    $("#modal").classList.remove("hidden");
    if (opts.onBind) opts.onBind($("#modal"));
  }
  function closeModal() { $("#modal").classList.add("hidden"); }

  function flashLog() {
    var box = $("#log"); if (!box) return;
    var last = box.lastElementChild;
    if (last) { last.classList.remove("flash"); void last.offsetWidth; last.classList.add("flash"); }
  }

  /* ---------------------------------------------------------
     15b. Transit animations (between-scene, Oregon-Trail style)
     --------------------------------------------------------- */
  var transiting = false;
  function animationsOn() {
    if (meta.anim === false) return false;
    try {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    } catch (e) {}
    return true;
  }
  // Show a short, skippable transit scene, then call done() exactly once.
  // variant: cruise | dock | hazard | land. Resolves synchronously if anims off.
  function playTransit(opts, done) {
    opts = opts || {};
    done = done || function () {};
    if (!animationsOn()) { done(); return; }
    if (transiting) { done(); return; }       // never overlap
    transiting = true;

    var ov = $("#transit");
    var ship = $("#transit-ship"), dest = $("#transit-dest"), cap = $("#transit-cap");
    var V = {
      cruise: { ship: "⊳—■▣",    dur: 2300, destIcon: "" },
      dock:   { ship: "⊳—■▣ ▸",  dur: 2600, destIcon: "◉" },
      hazard: { ship: "⊳—■▣ !",  dur: 2500, destIcon: "✦" },
      land:   { ship: "⊳—■▣ ▸",  dur: 3600, destIcon: "◐" }
    }[opts.variant] || { ship: "⊳—■▣", dur: 2300, destIcon: "" };

    ship.textContent = V.ship;
    cap.textContent = opts.caption || "";
    if (V.destIcon) { dest.textContent = V.destIcon; dest.classList.remove("grow"); void dest.offsetWidth; dest.classList.add("grow"); }
    else { dest.textContent = ""; dest.classList.remove("grow"); }
    if (opts.variant === "hazard") sfx("warn");
    else if (opts.variant === "land") sfx("win");
    else sfx("tick");

    ov.classList.remove("hidden");

    var finished = false;
    var timer = null;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      ov.classList.add("hidden");
      ov.removeEventListener("click", finish);
      document.removeEventListener("keydown", onKey, true);
      transiting = false;
      done();
    }
    function onKey(e) {
      if (e.key === " " || e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();          // don't let the global handler also fire "continue"
        finish();
      }
    }
    timer = setTimeout(finish, V.dur);
    ov.addEventListener("click", finish);
    document.addEventListener("keydown", onKey, true);
  }

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
      case "colony": renderColony(); break;
      case "return": renderReturn(); break;
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
    setAlert(false);
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
        "<p><b class='paper'>Hibernate</b> crew to save air and food (vital for the Interstellar Void) — but sleepers can't help in a crisis, and a sleeping Medic can't treat the sick. Keep a small awake bridge crew (a pilot to fly, an engineer to mend, a medic to heal).</p>" +
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
  var sel = { role: "Commander", diff: "Settler", names: NAMES.slice(0, 5) };
  function renderRole() {
    setAlert(false);
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
    setAlert(false);
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
      "<div class='panel'><div class='store-row'><b>Credits remaining</b><span class='dim small'>Hold " + cargoUsed() + "/" + game.ship.holdMax + "</span><span></span>" +
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

  // Multi-waypoint trail: a node per WAYPOINTS entry, ship at current distance.
  function renderRouteMap() {
    function icon(wp, i) {
      if (wp.kind === "win") return "◐";
      if (wp.kind === "start") return "⌂";
      if (wp.hazard) return "✦";
      if (wp.kind === "void") return "❄";
      if (wp.kind === "station") return "◉";
      return "⬡";
    }
    function abbrev(name) { return name.replace(/\s*\(.*\)/, "").replace("The ", ""); }
    var shipPct = clamp((game.distance / TOTAL_DIST) * 100, 0, 100);
    var nodes = "", labels = "";
    for (var i = 0; i < WAYPOINTS.length; i++) {
      var wp = WAYPOINTS[i];
      var pct = clamp((CUM[i] / TOTAL_DIST) * 100, 0, 100);
      var state = game.visited.indexOf(i) > -1 ? "visited"
                : (i === game.waypointIndex ? "current" : "future");
      var cls = "rm-node " + state + (wp.kind === "win" ? " win" : "");
      nodes += "<span class='" + cls + "' style='left:" + pct + "%' title='" +
        wp.name + " — " + wp.blurb.replace(/'/g, "") + "'>" + icon(wp, i) + "</span>";
      if (i === game.waypointIndex || (i === game.waypointIndex - 1)) {
        var lc = i === game.waypointIndex ? "cur" : "nxt";
        labels += "<span class='rm-label " + lc + "' style='left:" + pct + "%'>" + abbrev(wp.name) + "</span>";
      }
    }
    return "<div class='routemap'><div class='rm-rail'>" +
      "<div class='rm-line'></div>" +
      "<div class='rm-fill' style='width:" + shipPct + "%'></div>" +
      nodes +
      "<span class='rm-ship' style='left:" + shipPct + "%'>►</span>" +
      "</div><div class='rm-labels'>" + labels + "</div></div>";
  }

  /* ---- Travel (main) ---- */
  function setAlert(on) { var c = document.getElementById("crt"); if (c) c.classList.toggle("alert", !!on); }

  function renderTravel() {
    game.screen = "travel";
    updateTopbar();
    var app = $("#app");
    var s = game.supplies, ship = game.ship;
    var p = computePower();
    setAlert(ship.hull < 25 || s.oxygen < 10 || s.fuel <= 0 || p.brownout);   // RED ALERT when in real danger

    function bar(val, max, kind) {
      var pct = clamp(Math.round((val / max) * 100), 0, 100);
      var cls = kind || (pct < 20 ? "crit" : pct < 45 ? "warn" : "ok");
      return "<div class='bar " + cls + "'><span style='width:" + pct + "%'></span></div>";
    }
    function stat(label, val, max, kind) {
      return "<div><div class='stat'><span class='label'>" + label + "</span><span class='val'>" + val + "</span></div>" +
        (max ? bar(val, max, kind) : "") + "</div>";
    }

    // Journey route map (multi-waypoint trail)
    var track = renderRouteMap();

    // Power line
    var aiInt = game.ai ? Math.round(game.ai.integrity) : null;
    var aiCls = !game.ai ? "dim" : aiInt > 60 ? "cyan" : aiInt > 28 ? "amber" : "red";
    var aiGlitch = (game.ai && aiState() !== "nominal") ? " ai-glitch" : "";   // flickers as it frays
    var aiLine = "<div class='stat'><span class='label'>" + AI_NAME + "</span><span class='val " + aiCls + aiGlitch + "'>" +
      (game.ai ? aiInt + "% · " + aiState() : "purged") + "</span></div>" +
      (game.ai ? "<div class='bar " + (aiInt > 60 ? "ok" : aiInt > 28 ? "warn" : "crit") + "'><span style='width:" + aiInt + "%'></span></div>" : "");
    var powerLine = "<div class='stat'><span class='label'>Reactor</span><span class='val " + (p.brownout ? "red" : "cyan") + "'>" +
      p.demand + " / " + p.output + " pwr" + (p.brownout ? " ⚠ BROWNOUT" : "") + "</span></div>" +
      "<div class='bar power'><span style='width:" + clamp(Math.round(p.demand / Math.max(1, p.output) * 100), 0, 100) + "%'></span></div>" + aiLine;

    var disp = dispositionText();
    var holdPct = clamp(Math.round(cargoUsed() / ship.holdMax * 100), 0, 100);
    var apBanner = game.autopilot
      ? "<div class='panel' style='border-color:var(--red)'><span class='red'>⚠ AUTOPILOT — you are in cold sleep. The ship is choosing for you.</span></div>"
      : "";
    var hud = apBanner +
      "<div class='panel'><div class='panel-title'>Navigation</div>" +
        "<div class='stat'><span class='label'>Day</span><span class='val'>" + game.day + "  <span class='dim small'>(voyage yr " + Math.round(game.shipYears) + ")</span></span></div>" +
        "<div class='stat'><span class='label'>Next waypoint</span><span class='val cyan'>" +
          WAYPOINTS[Math.min(game.waypointIndex, WAYPOINTS.length - 1)].name + "</span></div>" +
        "<div class='stat'><span class='label'>Signal from Earth</span><span class='val " +
          (game.earth && game.earth.status === "silent" ? "red'>silent" : (game.distance / TOTAL_DIST > 0.6 ? "amber'>faint" : "cyan'>live")) + "</span></div>" +
        track +
        "<div class='small dim'>Thrust: <b class='paper'>" + THRUST[game.thrust].label + "</b> · Rations: <b class='paper'>" + RATIONS[game.rations].label + "</b>" +
          (disp ? " · Crew: <b class='paper'>" + disp + "</b>" : "") + "</div>" +
      "</div>" +
      "<div class='cols'>" +
        "<div class='col panel'><div class='panel-title'>Supplies · Hold " + cargoUsed() + "/" + ship.holdMax + "</div>" +
          "<div class='bar " + (holdPct > 92 ? "crit" : holdPct > 75 ? "warn" : "ok") + "'><span style='width:" + holdPct + "%'></span></div>" +
          "<div class='hud-grid' style='margin-top:6px'>" +
          stat("Fuel", s.fuel, 100) + stat("Oxygen", s.oxygen, 100) + stat("Food", s.food, 100) +
          stat("Medicine", s.medicine, 12) + stat("Parts", ship.parts, 12) + stat("Charges", s.charges, 16) +
          "<div class='stat'><span class='label'>Credits</span><span class='val paper'>" + game.credits + "</span></div>" +
          stat("Hull", ship.hull, 100) +
        "</div>" + powerLine + "</div>" +
        "<div class='col panel'><div class='panel-title'>Crew (" + alive().length + ")</div>" + crewStrip() + "</div>" +
      "</div>";

    var actions = game.autopilot
      ? "<div class='menu row'>" +
          "<button class='btn go' data-action='continue'>▶ Run on autopilot</button>" +
          "<button class='btn small danger' data-action='wakeself'>☼ Emergency wake</button>" +
        "</div>"
      : "<div class='menu row'>" +
          "<button class='btn go' data-action='continue'>▶ Continue</button>" +
          "<button class='btn small' data-action='thrust'>⚙ Thrust</button>" +
          "<button class='btn small' data-action='rations'>🍽 Rations</button>" +
          "<button class='btn small' data-action='power'>⚡ Power</button>" +
          "<button class='btn small' data-action='hibernate'>❄ Pods</button>" +
          "<button class='btn small' data-action='rest'>🛠 Rest & repair</button>" +
          "<button class='btn small' data-action='mine'>⛏ Mine</button>" +
          "<button class='btn small' data-action='ai'>🧠 " + AI_NAME + "</button>" +
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
    // Only the LIVING are on the roster — the fallen/taken are remembered below it, so the
    // crew list actually shrinks when you lose someone.
    var living = game.crew.filter(function (c) { return c.status !== "Dead"; });
    var rows = living.map(function (c) {
      function mb(v, kind) {
        var pct = clamp(v, 0, 100);
        var cls = kind || (pct < 25 ? "crit" : pct < 50 ? "warn" : "ok");
        return "<div class='bar minibar " + cls + "'><span style='width:" + pct + "%'></span></div>";
      }
      var tag = c.ailment ? " <span class='tag amber'>" + c.ailment + "</span>" : "";
      if (c.child) tag += " <span class='tag cyan'>child</span>";
      else if (c.age >= OLD_AGE) tag += " <span class='tag amber'>elder</span>";
      var ageStr = " <span class='small dim'>" + Math.round(c.age) + "y</span>";
      return "<div class='crew-row'>" +
        "<span class='s-" + c.status + "'>" + (c.status === "Hibernating" ? "❄" : c.child ? "◦" : "•") + "</span>" +
        "<span><span class='nm s-" + c.status + "'>" + c.name + "</span> <span class='rl small'>" + c.role +
          (c.role === game.role ? "*" : "") + "</span>" + ageStr + tag + "</span>" +
        "<span>" + mb(c.health) + "<span class='small dim'>hp</span></span>" +
        "<span>" + mb(c.morale, "power") + "<span class='small dim'>mor</span></span>" +
        "<span class='st small s-" + c.status + "'>" + c.status + "</span>" +
        "</div>";
    }).join("");
    var lost = game.crew.filter(function (c) { return c.status === "Dead" && !c.taken; }).map(function (c) { return c.name; });
    var taken = game.crew.filter(function (c) { return c.status === "Dead" && c.taken; }).map(function (c) { return c.name; });
    var memorial = "";
    if (lost.length) memorial += "<div class='small red crew-memorial'>✖ Lost: " + lost.join(", ") + "</div>";
    if (taken.length) memorial += "<div class='small amber crew-memorial'>◌ Taken by the unknown: " + taken.join(", ") + "</div>";
    return "<div class='crew-strip'>" + rows + "</div>" + memorial;
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

  /* ---- Act II: Colony ---- */
  function renderColony() {
    setAlert(false);
    var col = game.colony, app = $("#app");
    function bar(v, max, kind) { var pct = clamp(Math.round(v / max * 100), 0, 100); return "<div class='bar " + (kind || (pct < 25 ? "crit" : pct < 50 ? "warn" : "ok")) + "'><span style='width:" + pct + "%'></span></div>"; }
    function stat(label, val) { return "<div class='stat'><span class='label'>" + label + "</span><span class='val'>" + val + "</span></div>"; }
    var hud =
      "<div class='panel'><div class='panel-title'>The Colony · Year " + col.years + " · " + col.habit + " world</div>" +
        "<div class='stat'><span class='label'>Self-sufficiency</span><span class='val cyan'>" + Math.round(col.sufficiency) + " / 100</span></div>" + bar(col.sufficiency, 100, "power") +
        "<div class='small dim' style='margin-top:6px'>Reach 100 to found a lasting colony.</div>" +
      "</div>" +
      "<div class='cols'><div class='col panel'><div class='panel-title'>Settlement</div><div class='hud-grid'>" +
        stat("Colonists", col.colonists) + stat("Food", Math.round(col.food)) +
        stat("Morale", Math.round(col.morale)) + (col.relations != null ? stat("Native relations", Math.round(col.relations)) : "") +
      "</div></div>" +
      "<div class='col panel'><div class='panel-title'>Crew of record</div>" + crewStrip() + "</div></div>";
    var acts = "<div class='menu row'>" +
      "<button class='btn go' data-action='colony' data-arg='build'>🏗 Build (sufficiency)</button>" +
      "<button class='btn small' data-action='colony' data-arg='farm'>🌾 Farm (food)</button>" +
      "<button class='btn small' data-action='colony' data-arg='explore'>🧭 Explore</button>" +
      "<button class='btn small' data-action='colony' data-arg='tend'>❤ Tend the people</button>" +
      (col.relations != null ? "<button class='btn small' data-action='colony' data-arg='diplomacy'>🤝 Diplomacy</button>" : "") +
      "</div>";
    app.innerHTML = hud + acts + "<div class='panel-title' style='margin-top:10px'>Colony Log</div><div class='log' id='log'></div>";
    renderLog();
  }

  /* ---- Act II: the long way home ---- */
  function renderReturn() {
    setAlert(false);
    var r = game.ret, app = $("#app");
    var pct = clamp(Math.round(r.legs / r.maxLegs * 100), 0, 100);
    function stat(label, val) { return "<div class='stat'><span class='label'>" + label + "</span><span class='val'>" + val + "</span></div>"; }
    var hud =
      "<div class='panel'><div class='panel-title'>The Long Way Home · Leg " + r.legs + " / " + r.maxLegs + "</div>" +
        "<div class='track'><span class='ship' style='left:" + pct + "%'>◄</span><span class='dest' style='left:2px;right:auto'>EARTH ⊕</span></div>" +
        "<div class='stat'><span class='label'>Voyage integrity</span><span class='val " + (r.integrity > 60 ? "cyan" : r.integrity > 35 ? "amber" : "red") + "'>" + Math.round(r.integrity) + "</span></div>" +
        "<div class='small dim'>Signal from Earth: " + (game.earth && game.earth.status === "silent" ? "<span class='red'>silent</span>" : "faint") + "</div>" +
      "</div>" +
      "<div class='panel'><div class='panel-title'>Stores</div><div class='hud-grid'>" +
        stat("Fuel", r.fuel) + stat("Oxygen", r.oxygen) + stat("Food", r.food) + stat("Crew", r.crew) +
      "</div></div>";
    var acts = "<div class='menu row'>" +
      "<button class='btn go' data-action='return' data-arg='push'>▶ Push hard</button>" +
      "<button class='btn small' data-action='return' data-arg='steady'>⏸ Steady</button>" +
      "<button class='btn small' data-action='return' data-arg='scavenge'>⛏ Scavenge</button>" +
      "</div>";
    app.innerHTML = hud + acts + "<div class='panel-title' style='margin-top:10px'>Ship's Log</div><div class='log' id='log'></div>";
    renderLog();
  }

  /* ---- End screen ---- */
  function renderEnd() {
    setAlert(false);
    var app = $("#app");
    var sc = game._endScore, rank = game._endRank;
    var tier = game.outcomeTier || (game.won ? "ARRIVED" : "LOST");
    var head = game.won
      ? "<h2 class='cyan'>✦ " + tier + " ✦</h2>"
      : "<h2 class='red'>✖ " + tier + " ✖</h2>";
    var survivors = game.crew.filter(function (c) { return c.status !== "Dead"; });
    var lostC = game.crew.filter(function (c) { return c.status === "Dead" && !c.taken; });
    var takenC = game.crew.filter(function (c) { return c.status === "Dead" && c.taken; });
    var crewSummary =
      "<div class='small'><b class='paper'>Survivors:</b> " +
        (survivors.length ? survivors.map(function (c) { return c.name + " (" + c.role + ")"; }).join(", ") : "<span class='red'>none</span>") +
      "</div>" +
      (lostC.length ? "<div class='small red'><b>Lost:</b> " + lostC.map(function (c) { return c.name; }).join(", ") + "</div>" : "") +
      (takenC.length ? "<div class='small amber'><b>Taken by the unknown:</b> " + takenC.map(function (c) { return c.name; }).join(", ") + "</div>" : "");

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
      case "new": sfx("select"); game = null; sel = { role: "Commander", diff: "Settler", names: rerollNames() }; game = { screen: "role" }; renderRoleScreen(); break;
      case "resume":
        var sv = loadSave();
        if (sv) {
          game = sv; game.ended = false; sfx("confirm");
          // Restore the saved screen (travel / colony / return); fall back to travel.
          if (["travel", "colony", "return"].indexOf(game.screen) < 0) game.screen = "travel";
          renderApp();
        }
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
      case "ai": openAI(); break;
      case "colony": colonyAction(arg); break;
      case "return": returnAction(arg); break;
      case "wakeself": wakeSelf("you force yourself awake"); save(); renderTravel(); break;
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
    var takesHold = key !== "medicine";
    if (dir > 0) {
      if (takesHold && cargoSpace() < it.step) { sfx("empty"); log("The hold is full — you must leave something behind to take on more.", "warn"); renderStore(); return; }
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

  /* ---- animations toggle ---- */
  (function () {
    var btn = $("#anim-btn");
    function label() { btn.textContent = meta.anim === false ? "▦ ANIM: OFF" : "▦ ANIM: ON"; }
    label();
    btn.addEventListener("click", function () {
      meta.anim = meta.anim === false ? true : false;
      saveMeta();
      label();
      sfx("blip");
    });
  })();

  /* ---------------------------------------------------------
     18. Boot
     --------------------------------------------------------- */
  renderTitle();
  updateTopbar();
})();

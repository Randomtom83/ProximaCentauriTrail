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
  var SAVE_KEY = "proxima-trail-save-v7";
  var META_KEY = "proxima-trail-meta-v1";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function rint(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function chance(p) { return Math.random() < p; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function round1(n) { return Math.round(n * 10) / 10; }
  // P3-M4: one cumulative Years-Since-Exodus clock across fronts. Colony + voyage run on ONE
  // wall-clock after a split, so take the LARGER post-launch contribution, not the sum.
  function exodusYears() {
    var y = game.shipYears || 0;                                              // Phase-1 outbound leg
    var colExtra = (game.colony ? game.colony.year * CYCLE_YEARS : 0);
    var voyExtra = (game.voyage ? game.voyage.turn * VOY_YEARS_PER_TURN : 0);
    return Math.round(y + Math.max(colExtra, voyExtra));
  }
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
  var HOLD_MAX = 300;            // cargo capacity in units (fuel/oxygen/food/parts/charges each 1/unit; medicine exempt)
  var LAUNCH_READY = 100;       // refit % the lander must reach before the ark can attempt the crossing home (P3-M1 gate; tune in M-INT2)
  var MAX_CREW = 8;             // ship can't carry an unlimited crowd
  // Generational voyage: biological aging per turn (awake vs cold sleep), coming-of-age, old age.
  var AGE_PER_TURN = 0.40;      // awake crew age ~0.4 years/turn — the void is decades long
  var AGE_HIB = 0.04;          // cold sleep nearly stops biological time
  var COME_OF_AGE = 14;
  var OLD_AGE = 70;            // past this, the dark starts to call
  var VOY_YEARS_PER_TURN = 1.6;   // P3-M4: a homeward turn is years on the voyage calendar (tune M-INT2)
  // P3-M4: Earth's fate is a hidden TRUTH the crew read only through a BOUNDED, lagging BELIEF.
  var EARTH_BANDS = ["thriving", "recovered", "changed", "silent", "gone"];   // index 0 best → 4 worst
  var EARTH_DOOM_YEARS = 220;     // the longer the whole endeavor, the worse Earth trends
  var EARTH_NOISE_P = 0.30;       // belief jitter — still clamped within ±1 band of truth
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
      youName: names[ROLE_ORDER.indexOf(roleKey)],   // which crewmate "you" are; succession can move it
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
      earth: { status: "live", heard: 0, truth: 2, estimate: 2 },  // status=belief view; truth hidden, estimate=shown belief (P3-M4)
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
  // These default to the ship's crew (game.crew) but accept any crew array, so the colony and
  // the homebound ship can each be driven independently once the party splits at Proxima.
  function awake(cr) { return (cr || game.crew).filter(function (c) { return c.status !== "Dead" && c.status !== "Hibernating"; }); }
  function alive(cr) { return (cr || game.crew).filter(function (c) { return c.status !== "Dead"; }); }
  function sleepers(cr) { return (cr || game.crew).filter(function (c) { return c.status === "Hibernating"; }); }
  function ailing(cr) { return (cr || game.crew).filter(function (c) { return c.status !== "Dead" && c.ailment; }); }
  function byName(n, cr) { cr = cr || game.crew; for (var i = 0; i < cr.length; i++) if (cr[i].name === n) return cr[i]; return null; }

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
  function skillAwake(role, cr) {
    cr = cr || game.crew;
    var best = null;
    for (var i = 0; i < cr.length; i++) {
      var c = cr[i];
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
  function hasAwakeSpecialist(role, cr) {
    return (cr || game.crew).some(function (c) { return c.role === role && c.status !== "Dead" && c.status !== "Hibernating"; });
  }
  // A living, awake Commander "holds the crew together": keeps morale off the floor and breaks ties.
  function hasAwakeCommander(cr) { return hasAwakeSpecialist("Commander", cr); }
  var COMMANDER_FLOOR = 6;        // awake crew morale won't fall below this while a Commander leads
  var TIE_BAND = 4;               // a check that fails by this margin is a "tie" the Commander wins
  // While a Commander leads, lift any awake crewmate who has sunk below the morale floor back up to it.
  function applyCommanderFloor(cr) {
    if (!hasAwakeCommander(cr)) return;
    awake(cr).forEach(function (c) { if (c.morale < COMMANDER_FLOOR) c.morale = COMMANDER_FLOOR; });
  }
  // A living, awake Pilot shaves lost time/ground: cut a lost-distance or lost-days amount by skill.
  function pilotMitigate(amount, cr) {
    if (amount <= 0 || !hasAwakeSpecialist("Pilot", cr)) return amount;
    return Math.max(0, Math.round(amount * (1 - Math.min(60, skillAwake("Pilot", cr)) / 150)));
  }

  function adjustMoraleAll(delta, awakeOnly, cr) {
    var list = awakeOnly ? awake(cr) : alive(cr);
    for (var i = 0; i < list.length; i++) list[i].morale = clamp(list[i].morale + delta, 0, 100);
  }
  function adjustHealthAll(delta, awakeOnly, cr) {
    var list = awakeOnly ? awake(cr) : alive(cr);
    for (var i = 0; i < list.length; i++) {
      list[i].health = clamp(list[i].health + delta, 0, 100);
      if (list[i].health <= 0) killCrew(list[i], "succumbed", false, cr);
    }
  }

  function killCrew(c, reasonVerb, taken, cr) {
    if (c.status === "Dead") return;
    c.status = "Dead";
    c.taken = !!taken;          // abducted by the unknown vs simply dead — distinct in the roster
    c.health = 0;
    log(c.name + " (" + c.role + ") " + (reasonVerb || "died") + ".", "bad");
    sfx("death");
    // Bonds: partners grieve (within their own crew front).
    for (var i = 0; i < c.bonds.length; i++) {
      var p = byName(c.bonds[i], cr);
      if (p && p.status !== "Dead") {
        // Grief scales with difficulty — on gentler tiers a death is less likely to cascade
        // the whole crew into a morale collapse.
        p.morale = clamp(p.morale - Math.round(28 * DIFFICULTY[game.difficulty].harsh), 0, 100);
        log(p.name + " loses heart — they were bonded to " + c.name + ".", "warn");
      }
    }
  }

  function afflict(ailmentName, cr) {
    var pool = awake(cr).filter(function (c) { return !c.ailment; });
    if (!pool.length) pool = awake(cr);
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

  /* ---------------------------------------------------------
     5d-bis. P3-M4 — Earth's fate (bounded divergence) on the HOME front.
     SIBLINGS of the outbound earthSignal/ageCrew (left byte-identical),
     per the colonyAgeDrift / voyageHazard* precedent.
     --------------------------------------------------------- */
  // status is a DERIVED view of BELIEF, so every legacy earth.status reader keeps working.
  function deriveEarthStatus(est) { return ["live", "live", "faint", "silent", "silent"][clamp(Math.round(est), 0, 4)]; }
  // Truth drifts, time-pressured: the longer the whole endeavor, the worse Earth trends.
  function earthTruthStep() {
    var e = game.earth; if (!e) return;
    var pressure = clamp(exodusYears() / EARTH_DOOM_YEARS, 0, 1);
    var worse = 0.10 + pressure * 0.50, better = 0.10 * (1 - pressure);
    if (chance(worse)) e.truth = Math.min(4, e.truth + 1);
    else if (chance(better)) e.truth = Math.max(0, e.truth - 1);   // a young/short endeavor can RECOVER
  }
  // The voyage-aware Earth tick: steps truth, then the BOUNDED, lagging, noisy belief (|est−truth| ≤ 1),
  // writes the derived status, and drips a belief-banded dispatch off the VOYAGE clock.
  function voyageEarthSignal() {
    var e = game.earth, v = game.voyage;
    if (!e || !v) return;
    if (e.truth == null) e.truth = (e.status === "silent") ? 4 : 2;   // tolerate old saves / direct returns
    if (e.estimate == null) e.estimate = e.truth;
    earthTruthStep();
    e.estimate = clamp(e.estimate + Math.sign(e.truth - e.estimate), 0, 4);        // LAG: one step toward truth
    if (chance(EARTH_NOISE_P)) e.estimate = clamp(e.estimate + (chance(0.5) ? 1 : -1), 0, 4);   // NOISE jitter
    e.estimate = clamp(e.estimate, e.truth - 1, e.truth + 1);                      // BOUND: within one band of truth
    e.status = deriveEarthStatus(e.estimate);                                      // belief-derived view (back-compat)
    if (e.estimate >= 3 && !e._silenced) {     // first time belief crosses into silence — a late gut-punch
      e._silenced = true;
      adjustMoraleAll(-6, true, v.crew);
      log("◆ The signal from Earth thins to nothing. You wait. It does not come back. ◆", "bad");
      sfx("death");
      return;
    }
    if (v.turn % 7 === 0) {                     // a periodic belief-banded dispatch
      e.heard++;
      var msg, mor, band = Math.round(e.estimate);
      if (band <= 1) { msg = pick(["Earth answers strong across the gulf — domes holding, harvests in, and they cheer your bearing home.", "A clean broadcast from home: a world that mended itself, asking only that you hurry."]); mor = +2; }
      else if (band === 2) { msg = pick(["Earth's transmissions are thinner now, and graver — failing domes, rising seas, but still they ask after you.", "Home reports a hard decade, and holds on. They are counting the years until you reach them."]); mor = -1; }
      else if (band === 3) { msg = pick(["A faint signal from Earth — mostly noise, and someone reading names of the dead.", "Earth's voice is barely there now: years stale, and fading between the static."]); mor = -2; }
      else { msg = pick(["You sweep the old frequencies. Nothing answers from Earth at all.", "Where Earth's beacon should be there is only the cold hiss of the sky."]); mor = -3; }
      adjustMoraleAll(mor, true, v.crew);
      log("📡 " + msg, mor >= 0 ? "good" : "warn");
    }
  }

  // Generational aging on the HOME front — sibling of ageCrew (which stays outbound-only and byte-identical),
  // mirroring colonyAgeDrift. Operates entirely on v.crew off the voyage-year counter.
  function voyageNeededRole() {
    var have = {}; alive(game.voyage.crew).forEach(function (c) { if (!c.child) have[c.role] = 1; });
    var missing = ROLE_ORDER.filter(function (r) { return r !== "Commander" && !have[r]; });
    return missing.length ? pick(missing) : pick(["Pilot", "Engineer", "Medic", "Xenobiologist"]);
  }
  function voyageAddChild(parentName) {
    var v = game.voyage;
    if (alive(v.crew).length >= MAX_CREW) return null;
    var used = {}; v.crew.forEach(function (c) { used[c.name] = 1; });
    var pool = KID_NAMES.filter(function (n) { return !used[n.trim()]; });
    var nm = (pool.length ? pick(pool) : "Child-" + rint(10, 99)).trim();
    var c = { name: nm, role: "Child", health: 100, morale: 80, status: "Healthy",
              skill: 0, ailment: null, bonds: parentName ? [parentName] : [], age: 0, child: true };
    v.crew.push(c);
    var par = byName(parentName, v.crew);
    if (par && par.bonds.indexOf(nm) < 0) par.bonds.push(nm);
    return c;
  }
  function voyageAgeCrew() {
    var v = game.voyage; if (!v) return;
    var living = alive(v.crew);
    for (var i = 0; i < living.length; i++) {
      var c = living[i];
      var rate = c.status === "Hibernating" ? AGE_HIB : (c.child ? VOY_YEARS_PER_TURN * 2 : VOY_YEARS_PER_TURN);
      c.age = round1(c.age + rate);
      // Coming of age mid-crossing: a transit-born child MANS a station — prefer Pilot when none is awake,
      // which directly lowers voyageHazardDanger (skillAwake("Pilot", v.crew)).
      if (c.child && c.age >= COME_OF_AGE) {
        c.child = false;
        c.role = hasAwakeSpecialist("Pilot", v.crew) ? voyageNeededRole() : "Pilot";
        c.skill = rint(45, 70);
        log("On the long road home, " + c.name + " comes of age and takes the " + c.role + " station — a child of the dark now flies the ark home.", "good");
      }
      if (!c.child && c.age >= OLD_AGE) {
        if (chance((c.age - OLD_AGE) * 0.012 * DIFFICULTY[game.difficulty].harsh)) killCrew(c, "died at " + Math.round(c.age) + ", an elder of the long crossing", false, v.crew);
      }
    }
    if (v._pregnancy) {
      var parent = byName(v._pregnancy.parent, v.crew);
      if (!parent || parent.status === "Dead") v._pregnancy = null;
      else if (parent.status !== "Hibernating") {       // gestation pauses in cold sleep
        v._pregnancy.turnsLeft--;
        if (v._pregnancy.turnsLeft <= 0) {
          var kid = voyageAddChild(parent.name);
          v._pregnancy = null;
          if (kid) { adjustMoraleAll(+8, true, v.crew); log("A child is born aboard the homebound ark — " + kid.name + ". A generation that will know only this ship, and the world ahead.", "good"); sfx("good"); }
        }
      }
    } else {
      var adults = awake(v.crew).filter(function (c) { return !c.child && c.age < 58 && c.morale > 38; });
      if (adults.length >= 2 && alive(v.crew).length < MAX_CREW && chance(0.05)) {
        v._pregnancy = { parent: pick(adults).name, turnsLeft: rint(6, 11) };
        log(byName(v._pregnancy.parent, v.crew).name + " is expecting, even out here — a new pair of hands, in time.", "info");
      }
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
      var back = pilotMitigate(rint(20, 50)); game.distance = Math.max(0, game.distance - back);
      while (game.waypointIndex > 1 && game.distance < CUM[game.waypointIndex - 1]) game.waypointIndex--;
      game.supplies.fuel = Math.max(0, game.supplies.fuel - rint(8, 16));
      game.day += pilotMitigate(rint(8, 20));
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

  // The player's own character. Tracked by name (so command can pass to a survivor on death),
  // falling back to the chosen-role crewmate for older saves and lazily recording it.
  function playerChar() {
    if (game.youName) { var y = byName(game.youName); if (y) return y; }
    for (var i = 0; i < game.crew.length; i++) if (game.crew[i].role === game.role) { game.youName = game.crew[i].name; return game.crew[i]; }
    return null;
  }
  // "You" within a given front's crew (the ship out, the colony, or the ark home), if present there.
  function youIn(cr) { return game.youName ? byName(game.youName, cr) : null; }
  // When the player-character dies but the crew lives on, command passes — let the player choose who
  // they become and carry the run forward through their eyes.
  function maybeSuccession(cr, after) {
    var you = youIn(cr);
    if (!you || you.status !== "Dead") return false;   // you aren't here, or you're alive → nothing to do
    var living = alive(cr);
    if (living.length === 0) return false;             // no one left → the run ends elsewhere
    var cand = living.filter(function (c) { return !c.child; });   // a newborn can't take the helm…
    presentSuccession(you, cand.length ? cand : living, after);    // …unless they're truly all that's left
    return true;
  }
  function presentSuccession(lost, living, after) {
    if (game.autopilot) { game.autopilot = false; game.autopilotWake = null; }   // the podded "you" is gone
    // Successors are the modal's choices (no dismiss option) — a forced, narrative passing of command.
    var choices = living.map(function (c) {
      return {
        label: "Take command as " + c.name + " (" + c.role + (c.child ? ", a child" : ", " + c.age + "y") + ")",
        onClick: function () {
          game.youName = c.name;
          log("Command passes to " + c.name + " (" + c.role + "). The run goes on through their eyes.", "warn");
          sfx("select"); closeModal(); save(); if (after) after();
        }
      };
    });
    openModal({
      title: "⚑ COMMAND PASSES",
      body: "<p>" + lost.name + " (" + lost.role + ") is gone. The voyage does not stop for grief — someone has to take the helm. <b class='paper'>Whose eyes do you see through now?</b></p>",
      choices: choices
    });
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
                      c.ore + c.ice + c.rareMetals + c.volatiles +
                      (game._courier ? game._courier.hold : 0));   // a courier crate takes hold; medicine is light/exempt
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
      // Severity scales with difficulty: forgiving tiers give marginal runs room to recover;
      // a sustained outage still kills everywhere.
      var oHit = Math.round(Math.min(46, 14 + (game._anoxia - 1) * 9) * (0.6 + 0.5 * DIFFICULTY[game.difficulty].harsh));
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
      var fHit = Math.round(Math.min(30, 6 + (game._starve - 1) * 5) * (0.6 + 0.5 * DIFFICULTY[game.difficulty].harsh));
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
        // A skilled, awake Medic sometimes stretches a dose — treats without spending medicine.
        if (!(hasAwakeSpecialist("Medic") && chance(skillAwake("Medic") / 220))) game.supplies.medicine--;
        else log("The medic stretches a dose — treatment without spending medicine.", "good");
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
    // A living, awake Engineer keeps the patches holding longer (slower decay).
    var wear = rint(0, 1) + Math.round((pace - 1) * 2.2);
    if (wear > 0 && hasAwakeSpecialist("Engineer") && chance(skillAwake("Engineer") / 140)) wear -= 1;
    game.ship.hull = clamp(game.ship.hull - wear, 0, 100);

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

    // A living, awake Commander keeps morale off the floor — applied last, after aging and the
    // ship-mind's meddling, so a late-turn shock can't slip the crew under the floor for the turn.
    applyCommanderFloor();

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

  // Fast-forward autopilot: run turns unattended until a wake condition fires (emergency, the
  // chosen waypoint, arrival) or the run ends — so "wake only on emergency" doesn't mean clicking
  // through every single turn while you sleep.
  function autopilotRun() {
    if (!game.autopilot || game.ended || modalOpen() || transiting) return;
    var guard = 0;
    while (game.autopilot && !game.ended && guard++ < 300) {
      if (game.supplies.fuel <= 0 && game.power.allocation.drive)
        log("No fuel. The drive is dead — you drift, bleeding air and food.", "bad");
      var p = computePower();
      if (p.brownout) {                       // no one awake to shed load; the air pays for it
        var deficit = p.demand - p.output;
        game.supplies.oxygen = Math.max(0, round1(game.supplies.oxygen - deficit * 1.5));
        adjustHealthAll(-3, true);
        log("Autopilot runs under brownout — the air goes thin and stale.", "bad");
      }
      resolveTurn();                          // advances one turn (renders + flushes queues; may wake/end)
      if (modalOpen() || transiting) break;   // a decision/vignette interrupted the unattended run
    }
    if (!game.ended) renderApp();
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
    // Despair must be SUSTAINED to end the run — one rock-bottom turn is a crisis you can still
    // pull out of (rest, rations, a good event), not an instant mutiny.
    if (awk.length > 0 && awk.every(function (c) { return c.morale <= 0; })) {
      game._despair = (game._despair || 0) + 1;
      if (game._despair >= 3) return endGame(false, "The crew has given up. They stop the engines and let the dark take them. Mutiny of despair.");
    } else game._despair = 0;
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
    if (viable) {   // overtaken no longer blocks colonizing — a viable world is yours to settle even if another ship arrived first
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
     8b. ACT II — THE COLONY (a full ground simulation)
     Self-sufficiency is EMERGENT, not a number you pump: the colony's built
     infrastructure (raised by Build) and tech (raised by Research) drive an
     automatic economy — each year it grows food/water/materials and the people
     eat. When production outpaces consumption with a buffer to spare, the
     colony is sustaining itself and self-sufficiency climbs; run a deficit and
     it erodes. Hold a real surplus long enough and you take root. The one lever
     each year is where you invest the colony's effort (build / research /
     survey / tend / fortify / diplomacy); habitats cap population, defense
     blunts raids, tech multiplies every yield.
     --------------------------------------------------------- */
  function habMult() {
    var h = game.colony.habit;
    return h === "verdant" ? 1.3 : h === "marginal" ? 0.85 : h === "barren" ? 0.6 : 0.45;
  }
  // === P2-M1 colony skeleton: survival spine + labor/power allocation ===
  // Difficulty hook (Consequence Ledger amendment P2-M0.1): every hidden-meter threshold, payoff-odds,
  // and passive-decay rate scales through these. Numbers are placeholders tuned later in the M-INT2 sweep.
  function colHarsh() { return DIFFICULTY[game.difficulty].harsh; }
  function tierThreshold(base) { return Math.round(base * (1.5 - 0.5 * colHarsh())); }   // higher (later) on Settler
  function tierOdds(base) { return base * (0.6 + 0.5 * colHarsh()); }                     // rarer on Settler
  function tierDecay(base) { return base * (1.5 - 0.5 * colHarsh()); }                    // faster recovery on Settler
  // Victory gate (P2-M6): the INVERSE of tierThreshold — a harder tier sets a HIGHER bar to clear
  // (Settler ×1.0, Pioneer ×1.12, Voyager ×1.3). Exact numbers deferred to the M-INT2 balance sweep.
  function colWinBar(base) { return Math.round(base * (0.8 + 0.4 * colHarsh())); }

  var COL_SYS = ["air", "water", "food", "warmth", "health"];   // the survival spine
  var SURV_LABEL = { air: "Air", water: "Water", food: "Food", warmth: "Warmth", health: "Medical care" };
  var COL_DRAW = 3;          // power each running survival system needs
  // The colony counts CYCLES, not Earth years (Decision: cycles, not years). A tidally-locked red-dwarf
  // world has no honest Earth calendar; the Earth-frame "years since exodus" advances by this small
  // fraction of an Earth year per cycle (never +1/turn), and colony crew age by the same small amount.
  var CYCLE_YEARS = 0.5;

  // Heads = living named crew + abstract settlers (mouths); hands = those who can actually work.
  function colHeads() { return alive(game.crew).length + (game.colony.pop || 0); }
  function colHands() { return awake(game.crew).length + (game.colony.pop || 0); }
  // Habitability sets how hard the world drains you (verdant easy → lethal brutal).
  function colHabDrain() {
    var col = game.colony, h = col.habit;
    var base = h === "verdant" ? 0.7 : h === "marginal" ? 1.0 : h === "barren" ? 1.4 : 1.9;
    return base * (1 + (col.ecoHarm || 0) / 120);   // ecoHarm READER: a scarred world drains harder
  }
  /* ---- P2-M3: the discoverable map + expeditions ---- */
  var COLONY_SITES = [
    { id: "orevein", name: "Ore Vein", kind: "resource", icon: "⛏", yields: { materials: 14 }, capacity: 4, riskBase: 30, ecoCost: 8, wakeRisk: 0, blurb: "A seam of metals within reach of the camp." },
    { id: "springs", name: "Hot Springs", kind: "resource", icon: "♨", yields: { water: 18, food: 6 }, capacity: 5, riskBase: 22, ecoCost: 5, wakeRisk: 0, blurb: "Geothermal water and warmth — a gentler harvest." },
    { id: "forest", name: "Alien Forest", kind: "biome", icon: "🌲", yields: { food: 16, tech: 3 }, capacity: 4, riskBase: 40, ecoCost: 12, wakeRisk: 35, blurb: "A breathing tangle of not-quite-trees. It feels watched." },
    { id: "ice", name: "Deep Ice", kind: "biome", icon: "🧊", yields: { water: 14, tech: 5 }, capacity: 3, riskBase: 46, ecoCost: 7, wakeRisk: 45, blurb: "Black ice kilometers thick. Something is frozen in it." },
    { id: "ruins", name: "The Ruins", kind: "ruin", icon: "🏛", yields: { tech: 12, materials: 6 }, capacity: 3, riskBase: 55, ecoCost: 4, wakeRisk: 70, blurb: "Geometry no human hand made. Older than the light that lied to you." },
    { id: "wreck", name: "Derelict Hull", kind: "ruin", icon: "🛰", yields: { materials: 12, meds: 2, tech: 4 }, capacity: 2, riskBase: 48, ecoCost: 3, wakeRisk: 30, blurb: "A colony ship that tried this before you — and failed. Or did it?" }
  ];
  // Seed the run's map: a fixed (per-run) roster of sites, hidden until scouted. No per-click RNG.
  function seedColonySites() {
    var col = game.colony;
    var pool = COLONY_SITES.slice();
    // bias the roster by what's here: ruins/wreck only when something/someone preceded you
    if (game.dest.inhabited === "none") pool = pool.filter(function (s) { return s.id !== "ruins"; });
    if (game.dest.inhabited !== "settlers") pool = pool.filter(function (s) { return s.id !== "wreck"; });
    // shuffle once (deterministic order for this run), keep ~5
    for (var i = pool.length - 1; i > 0; i--) { var j = rint(0, i); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    col.sites = pool.slice(0, 5).map(function (s, idx) {
      return { id: s.id, name: s.name, kind: s.kind, icon: s.icon, revealed: idx === 0, uses: 0, depleted: false };
    });
    col.scouted = 1;          // the first site is in view at landfall
    col.woke = false; col.wokeWhat = null; col._pendingExpedition = null;
  }
  function siteArch(id) { for (var i = 0; i < COLONY_SITES.length; i++) if (COLONY_SITES[i].id === id) return COLONY_SITES[i]; return null; }
  // Reactor + built infrastructure make power; each manned, powered system feeds its survival axis.
  // Too many systems for the available power OR hands ⇒ brownout: everything runs at a reduced factor.
  function colPower() {
    var col = game.colony, al = col.alloc;
    var on = COL_SYS.filter(function (k) { return al[k]; });
    var output = 10 + col.infra;
    var demand = on.length * COL_DRAW;
    var hands = colHands();
    var brownout = demand > output || on.length > hands;
    var factor = brownout ? Math.max(0.2, Math.min(output / Math.max(1, demand), hands / Math.max(1, on.length))) : 1;
    return { on: on, output: output, demand: demand, hands: hands, brownout: brownout, factor: factor };
  }
  // Passive recovery of the soft hidden meters (P2-M0.1): only when the colony is safe and hope is above
  // its floor; slow. ecoHarm & structuralDebt never decay passively — ecoHarm only comes down via the
  // active Restore action (P2-M5); structuralDebt via reinforce projects.
  function colonyDecay() {
    var col = game.colony;
    if (!col._safe || col.meters.hope < 12) return;
    col.contamination = clamp((col.contamination || 0) - tierDecay(1), 0, 100);
    col.trauma = clamp((col.trauma || 0) - tierDecay(1), 0, 100);
  }

  // Decision (cycles, not years): the colony's "Cycle N" counter is decoupled from the honest Earth
  // clock. elapsedYears advances by a small fraction of an Earth year per cycle (never +1/turn), and the
  // founders age by that same small amount — a little over a colony's life, not frozen and no die-off.
  // Reuses the journey's OLD_AGE / COME_OF_AGE constants but NOT ageCrew() (which advances shipYears and
  // fires journey-only pregnancy/birth). Runs AFTER aliveBefore is captured so a drift death cascades hope.
  function colonyAgeDrift() {
    var col = game.colony;
    var base = (col._exodusYear != null) ? col._exodusYear : Math.round(game.shipYears || 0);
    col.elapsedYears = Math.round(base + col.year * CYCLE_YEARS);
    var living = alive(game.crew);
    for (var i = 0; i < living.length; i++) {
      var c = living[i];
      c.age = round1(c.age + (c.child ? CYCLE_YEARS * 2 : CYCLE_YEARS));
      if (c.child && c.age >= COME_OF_AGE) {     // a child of this world grows into a working hand
        c.child = false; c.role = "Colonist"; c.skill = rint(35, 60);
        log("Cycle " + col.year + ": " + c.name + " has come of age — a child of this world takes a place among its builders.", "good");
      }
      if (!c.child && c.age >= OLD_AGE) {         // gentle, age-scaled mortality for true elders
        if (chance((c.age - OLD_AGE) * 0.012 * colHarsh())) killCrew(c, "died at " + Math.round(c.age) + ", an elder of the colony", false, game.crew);
      }
    }
  }

  // A passive per-cycle recovery tick — the colony analog of the ship's auto-medbay (Decision: heal +
  // safe-gather reuse the journey's verbs). Only on SAFE cycles (nothing in crisis) AND with a healthy,
  // powered medical-care axis; gated up by an awake Medic. No recovery on crisis cycles — that's what the
  // survival escalation is for.
  function colonyRecovery() {
    var col = game.colony;
    if (!col._safe) return;                                   // crisis cycles get no quarter
    if (col.surv.health < 40 || !col.alloc.health) return;    // needs a healthy, powered infirmary axis
    var medic = skillAwake("Medic"), powered = !colPower().brownout;
    var heal = Math.round(3 + (col.surv.health - 40) / 30 + medic / 25);   // small, scales with the axis + a medic
    adjustHealthAll(heal, true);                              // mend awake living crew a little
    var sick = ailing(game.crew).filter(function (c) { return c.status !== "Hibernating"; });
    if (sick.length && chance(clamp((0.25 + medic / 300) * (powered ? 1 : 0.5), 0, 0.8))) {
      var pat = sick.slice().sort(function (a, b) { return a.health - b.health; })[0];
      pat.ailment = null; if (pat.status === "Sick" || pat.status === "Injured") pat.status = "Healthy";
      pat.health = clamp(pat.health + 8, 0, 100);
      log("Cycle " + col.year + ": the infirmary's steady care tells — " + pat.name + " recovers.", "good");
    }
  }

  function beginColony(petition) {
    closeModal();
    // Landing wakes everyone — no one rides out the colony in cold sleep.
    game.crew.forEach(function (c) { if (c.status === "Hibernating") c.status = c.ailment ? "Sick" : "Healthy"; });
    var surv = alive(), n = surv.length;
    var avgMor = n ? Math.round(surv.reduce(function (s, c) { return s + c.morale; }, 0) / n) : 50;
    var natives = game.dest.inhabited === "natives";
    var nstance = natives ? seedNativeStance() : null;   // space first-contact echoes on the ground (P2-M5)
    // Clean-sheet colony state — ALL meters declared up front (most written by later milestones).
    game.colony = {
      stage: "survival", year: 0,
      elapsedYears: Math.round(game.shipYears || 0),     // honest Earth clock — advances a small fraction per cycle
      _exodusYear: Math.round(game.shipYears || 0),      // fixed Earth-year at landfall; the base for elapsedYears
      habit: game.dest.habitResult, petition: !!petition,
      // population: named crew live in game.crew; pop is the abstract settler count (grows later)
      pop: 0, popCap: n + 6,
      // visible survival spine + hope
      surv: { air: 70, water: 70, food: 70, warmth: 70, health: 80 },
      sysLvl: { air: 0, water: 0, food: 0, warmth: 0, health: 0 },   // Secure raises a system's output
      meters: { hope: avgMor },
      alloc: { air: true, water: true, food: true, warmth: true, health: true },
      // resources + built capacity
      supplies: { food: 64, water: 42, materials: 22, meds: 4 },
      infra: 6, tech: Math.round(game.dest.knowledge || 0),
      // natives: surface stance (visible) vs deep reputation (hidden) — see ledger §1/§3; seeded by posture (P2-M5)
      relations: natives ? nstance.relations : null, defense: natives ? nstance.defense : 0,
      nativeStanding: null, nativesGone: false, settlerStanding: null,   // ending-fork fields (M-INT1 reads)
      // hidden long-tail meters (declared now; written by P2-M2…M5)
      ecoHarm: 0, nativeTrust: natives ? nstance.trust : null, contamination: 0, structuralDebt: 0, trauma: 0,
      // the homeward bridge (rebuilt P3-M1) — declared so composeEnding reads real fields
      shipReadiness: 0, beacon: false, beaconHeard: false,
      // bookkeeping
      _esc: { air: 0, water: 0, food: 0, warmth: 0, health: 0 }, _safe: true, _collapse: 0,
      // P2-M6: survival→foothold→settled progression. _stable counts consecutive stable seasons;
      // footholdReached gates the future affordance; settledEligible enables the player-confirmed win.
      _stable: 0, footholdReached: false, settledEligible: false,
      flags: {}     // fire-once set-pieces + named threshold payoffs (persists in the v7 save)
    };
    seedColonySites();        // the discoverable world — sites hidden until scouted (P2-M3)
    seedSettlers(avgMor);     // a few named, bonded colonists came down with you — their loss is personal
    game.screen = "colony";
    game.log.push({ msg: "═══ PHASE 2 — ARRIVAL & COLONY ═══", type: "sys", day: game.day });
    landfallBriefing();
  }

  // How you met the unknown out in the dark colors how these natives meet you on the ground (P2-M5):
  // welcoming (you communed once) / hostile (word of violence travels) / indifferent (no contact made).
  function seedNativeStance() {
    var a = game.alien || {};
    var friendly = a.friendly === true, hostile = a.friendly === false || a.pursuit;
    var base = (a.posture === "freeze" && friendly) ? { relations: 50, trust: 60 }
             : (a.posture === "fight" || hostile) ? { relations: 22, trust: 25 }
             : { relations: 35, trust: 40 };
    base.relations = clamp(base.relations + rint(-6, 6), 0, 100);
    base.trust = clamp(base.trust + rint(-6, 6), 0, 100);
    base.defense = Math.round(10 + (60 - base.trust) / 6);   // they arm against you in proportion to wariness
    return base;
  }

  // Named, bonded settlers (crew-lite) so deaths on the ground land like Phase-1 crew deaths, cascading
  // hope (colonyTurn) and a bonded partner's grief (killCrew). Reuses the crew/bond model.
  function seedSettlers(avgMor) {
    var used = {}; game.crew.forEach(function (c) { used[c.name] = 1; });
    var pool = NAMES.filter(function (n) { return !used[n]; });
    var nS = Math.min(3, MAX_CREW - game.crew.length);
    for (var i = 0; i < nS && pool.length; i++) {
      var nm = pool.splice(rint(0, pool.length - 1), 1)[0];
      var settler = { name: nm, role: "Colonist", health: rint(70, 90), morale: avgMor, status: "Healthy",
        skill: rint(25, 45), ailment: null, bonds: [], age: rint(20, 52), child: false };
      // bond each settler to a random existing member (mutual) — grief travels both ways
      var partner = pick(game.crew);
      if (partner) { settler.bonds.push(partner.name); if (partner.bonds.indexOf(nm) < 0) partner.bonds.push(nm); }
      game.crew.push(settler);
    }
  }

  // Plain-language readout of how the Phase-1 voyage shaped this run (the legible seed).
  function landfallBriefing() {
    var col = game.colony;
    var roles = alive().map(function (c) { return c.role; });
    var uniq = roles.filter(function (r, i) { return roles.indexOf(r) === i; });
    var hull = Math.round(game.ship.hull);
    var habTxt = col.habit === "verdant" ? "green and breathing — kind to lungs and crops"
      : col.habit === "marginal" ? "hard and marginal — survivable, barely"
      : col.habit === "barren" ? "barren and grudging — it will fight you for every breath"
      : "all but lethal — the air itself is against you";
    var hereTxt = game.dest.inhabited === "natives" ? "You are not alone: something lives here, watching from the treeline."
      : game.dest.inhabited === "settlers" ? "A human expedition reached here before you — you are not the first."
      : "No mind stirs on this world but your own.";
    if (game.dest.overtaken) hereTxt += " A faster ship overtook you on the way.";
    var earthTxt = game.earth && game.earth.status === "silent" ? "Earth has gone silent behind you."
      : game.earth && game.earth.status === "faint" ? "Earth's signal is faint and fading."
      : "Earth still calls, faint across the years.";
    var body =
      "<p>The lander settles. " + alive().length + " souls step onto Proxima b.</p>" +
      "<div class='small'><b class='paper'>The world:</b> " + habTxt + ".</div>" +
      "<div class='small'><b class='paper'>Who survived the crossing:</b> " + (uniq.join(", ") || "no specialists — only survivors") + ".</div>" +
      "<div class='small'><b class='paper'>The lander:</b> hull " + hull + "% — " + (hull >= 60 ? "sound enough to refit for a return, in time" : hull >= 30 ? "battered; any return ship will cost dearly" : "a wreck; leaving again may be impossible") + ".</div>" +
      "<div class='small'><b class='paper'>This place:</b> " + hereTxt + "</div>" +
      "<div class='small'><b class='paper'>Home:</b> " + earthTxt + "</div>" +
      "<div class='small dim' style='margin-top:6px'>Keep the colony alive: feed the survival systems with power and hands. There is never quite enough of either.</div>";
    openModal({ title: "⌖ LANDFALL — Proxima Centauri b", body: body,
      choices: [{ label: "Begin", onClick: function () { sfx("confirm"); closeModal(); save(); renderColony(); } }] });
  }

  // Your one deterministic investment this season (P2-M2). Each writes a visible effect AND a hidden
  // long-tail per the Consequence Ledger. "hold" = rest the season (no investment).
  function applyColonyAction(action) {
    var col = game.colony, s = col.supplies, m = col.meters;
    var eng = skillAwake("Engineer"), xeno = skillAwake("Xenobiologist");
    if (action === "secure") {
      // shore up the weakest life-support system: a lasting +output (sysLvl) + a buffer; materials cost
      var axis = COL_SYS.slice().sort(function (a, b) { return col.surv[a] - col.surv[b]; })[0];
      if (s.materials >= 6) {
        s.materials -= 6; col.sysLvl[axis] = (col.sysLvl[axis] || 0) + 1; col.surv[axis] = clamp(col.surv[axis] + 14, 0, 100);
        if (axis === "health") col.contamination = clamp(col.contamination - tierDecay(4), 0, 100);   // infirmary/sanitation
        log("Cycle " + col.year + ": you shore up " + SURV_LABEL[axis] + " — sturdier works, and a buffer restored.", "good");
      } else log("Cycle " + col.year + ": not enough materials to shore up the works (6 needed).", "warn");
    } else if (action === "build") {
      var cost = 5 + Math.floor(col.infra / 3);
      if (s.materials >= cost) { s.materials -= cost; col.infra += 1; log("Cycle " + col.year + ": new habitats and generators — colony capacity grows (infra " + col.infra + ").", "good"); }
      else {  // improvise with unproven local stuff when short — corners get cut (ledger: rush/cut corners)
        col.infra += 1; col.structuralDebt = clamp(col.structuralDebt + 10, 0, 100); col.contamination = clamp(col.contamination + 5, 0, 100);
        log("Cycle " + col.year + ": short on materials, you improvise the build — it stands, but on cut corners.", "warn");
      }
    } else if (action === "research") {
      var t = Math.round(4 + (eng + xeno) / 30); col.tech = clamp(col.tech + t, 0, 100);
      col.contamination = clamp(col.contamination - tierDecay(3), 0, 100);   // understanding the world → safer living
      influence({ knowledge: +2 });
      log("Cycle " + col.year + ": the labs learn the world — tech +" + t + ", and safer ways to live in it.", "good");
    } else if (action === "tend") {
      m.hope = clamp(m.hope + 8, 0, 100); col.trauma = clamp(col.trauma - tierDecay(5), 0, 100);
      // Tend now mends BODIES too, not just morale (the colony has no other deliberate healer): heal awake
      // living crew, and — auto-medbay style — clear one crewmate's Sick/Injured, boosted by an awake Medic.
      var med = skillAwake("Medic");
      adjustHealthAll(Math.round(8 + med / 12), true);
      var hurt = awake(game.crew).filter(function (c) { return c.ailment || c.status === "Sick" || c.status === "Injured"; });
      if (hurt.length && med + rint(0, 40) >= 64) {
        var pat = hurt.slice().sort(function (a, b) { return a.health - b.health; })[0];
        pat.ailment = null; if (pat.status === "Sick" || pat.status === "Injured") pat.status = "Healthy";
        pat.health = clamp(pat.health + 10, 0, 100);
        log("Cycle " + col.year + ": the infirmary sets " + pat.name + " back on their feet.", "good");
      }
      log("Cycle " + col.year + ": you tend the people — spirits lift, bodies mend, and old wounds settle.", "good");
    } else if (action === "work") {
      // A safe, repeatable labor→resource valve — the colony analog of the journey's Mine. No risk, no
      // ecoHarm; a modest yield scaled by hands + tech, deliberately OUT-PAID by the riskier Expedition.
      var hands = colHands(), techF = 1 + (col.tech || 0) / 150;
      var mats = Math.round((2 + hands * 0.6) * techF);
      var chow = Math.round((3 + hands * 0.5) * techF);
      s.materials = round1((s.materials || 0) + mats);
      s.food = round1((s.food || 0) + chow);
      var extra = "";
      // Empty (none) worlds have no natives to trade with (Contact is natives-only) — a work cycle is the
      // outlet: only a genuine ration SURPLUS is rendered down and put up as preservable medical stock, so
      // ordinary work is never taxed. Minimal trade valve for a non-native colony.
      if (game.dest.inhabited === "none" && s.food >= 80) {
        s.food = round1(s.food - 10); s.meds = (s.meds || 0) + 1; extra = " · a ration surplus is put up as medical stock (+1 meds)";
      }
      log("Cycle " + col.year + ": work crews gather and make do — materials +" + mats + ", food +" + chow + extra + ".", "good");
    } else if (action === "refit") {
      if (s.materials >= 5) {
        s.materials -= 5;
        var prog = Math.max(3, Math.round((12 + eng / 8) * (1 - (col.structuralDebt || 0) / 160)));   // structuralDebt taxes the refit
        col.shipReadiness = Math.min(100, col.shipReadiness + prog);
        log("Cycle " + col.year + ": crews refit the lander for the long crossing home — readiness " + col.shipReadiness + "%" + (col.structuralDebt > 30 ? " (the cut corners are slowing it)" : "") + ".", "info");
      } else log("Cycle " + col.year + ": not enough materials to refit the ship (5 needed).", "warn");
    } else if (action === "scout") {
      var hidden = col.sites.filter(function (st) { return !st.revealed; });
      if (hidden.length) {
        hidden[0].revealed = true; col.scouted = (col.scouted || 0) + 1; col.tech = clamp(col.tech + 1, 0, 100);
        log("Cycle " + col.year + ": survey parties map further out — " + hidden[0].icon + " " + hidden[0].name + " comes into view.", "good");
      } else log("Cycle " + col.year + ": the survey finds nothing new — you have mapped what there is to map.", "info");
    } else if (action === "expedition") {
      doExpedition();   // resolves col._pendingExpedition (player-only; no-op if unset)
    } else if (action === "contact") {
      doContact();      // resolves col._pendingContact (player-only; no-op if unset)
    } else if (action === "restore") {
      // the ONLY ecoHarm reducer — active, never passive (ledger row 32). Costs materials + a season.
      if (s.materials >= 8) {
        s.materials -= 8;
        var heal = Math.round(tierDecay(10));
        col.ecoHarm = clamp((col.ecoHarm || 0) - heal, 0, 100);
        if (col.nativeTrust != null) col.nativeTrust = clamp(col.nativeTrust + 2, 0, 100);   // tending the world they revere
        log("Cycle " + col.year + ": work parties rewild a scarred stretch — the land eases (ecoHarm -" + heal + ").", "good");
      } else log("Cycle " + col.year + ": not enough materials to mount a restoration (8 needed).", "warn");
    } else if (action === "fortify") {
      // defense's first writer (ledger row 26) — a wall reads as a threat to the people beyond it
      if (s.materials >= 7) {
        s.materials -= 7; col.defense = (col.defense || 0) + 6;
        if (col.nativeTrust != null) col.nativeTrust = clamp(col.nativeTrust - 3, 0, 100);
        log("Cycle " + col.year + ": you raise the perimeter — walls, watchtowers, cleared fields of fire (defense " + col.defense + ").", "info");
      } else log("Cycle " + col.year + ": not enough materials to fortify (7 needed).", "warn");
    }
  }

  // Pure, shared by the modal (display) and the resolver (roll): what you see is what you roll.
  function expeditionRisk(site, crewNames) {
    var col = game.colony, inst = (col.sites || []).filter(function (st) { return st.id === site.id; })[0] || { uses: 0 };
    var party = (crewNames || []).map(function (n) { return byName(n, game.crew); }).filter(function (c) { return c && c.status !== "Dead"; });
    var bestSkill = 0; party.forEach(function (c) { ["Pilot", "Xenobiologist", "Engineer"].forEach(function (r) { if (c.role === r) bestSkill = Math.max(bestSkill, c.skill || 0); }); });
    if (!bestSkill && party.length) bestSkill = Math.max.apply(null, party.map(function (c) { return (c.skill || 0) * 0.6; }));
    // danger rises with site risk, depletion/over-extraction and a woken thing; falls with skill + hands
    var danger = site.riskBase + inst.uses * 6 + (col.woke ? 12 : 0) - bestSkill * 0.5 - (party.length - 1) * 6;
    danger = Math.round(clamp(danger * (0.6 + 0.5 * colHarsh()), 5, 95));   // tier-scaled
    var death = Math.round(danger * 0.25), hurt = Math.round(danger * 0.6), lost = Math.round(danger * 0.4);
    var woke = Math.round(site.wakeRisk * (col.woke ? 0.4 : 1) * (0.6 + 0.5 * colHarsh()));   // less new "waking" once already woke
    var success = Math.max(20, 140 - danger - woke);
    var tier = danger >= 70 ? "Deadly" : danger >= 45 ? "Dangerous" : danger >= 25 ? "Risky" : "Safe";
    return { tier: tier, danger: danger, odds: { success: success, hurt: hurt, lost: lost, death: death, woke: woke } };
  }

  function doExpedition() {
    var col = game.colony, pend = col._pendingExpedition; col._pendingExpedition = null;
    if (!pend) return;                                   // player-only — auto/parallel path never sets this
    var arch = siteArch(pend.siteId), inst = col.sites.filter(function (st) { return st.id === pend.siteId; })[0];
    if (!arch || !inst || inst.depleted) return;
    var party = (pend.crewNames || []).map(function (n) { return byName(n, game.crew); }).filter(function (c) { return c && c.status !== "Dead" && c.status !== "Hibernating"; });
    if (!party.length) { log("Cycle " + col.year + ": no one fit to send — the expedition never sets out.", "warn"); return; }
    var r = expeditionRisk(arch, party.map(function (c) { return c.name; }));
    var band = sampleWeighted({ success: r.odds.success, hurt: r.odds.hurt, lost: r.odds.lost, death: r.odds.death, woke: r.odds.woke });
    var who = pick(party);
    if (band === "success" || band === "woke") {
      // a haul either way; "woke" also disturbs something
      var got = [];
      Object.keys(arch.yields).forEach(function (k) {
        if (k === "tech") { col.tech = clamp(col.tech + arch.yields.tech, 0, 100); got.push("tech +" + arch.yields.tech); }
        else { col.supplies[k] = (col.supplies[k] || 0) + arch.yields[k]; got.push(k + " +" + arch.yields[k]); }
      });
      inst.uses++;
      col.ecoHarm = clamp((col.ecoHarm || 0) + Math.round(arch.ecoCost * (0.6 + 0.5 * colHarsh())) + (inst.uses > arch.capacity ? 6 : 0), 0, 100);  // WRITER (tier-scaled; over-extraction bites)
      if (inst.uses >= arch.capacity) { inst.depleted = true; log("Cycle " + col.year + ": " + arch.icon + " " + arch.name + " is worked out — nothing more to take.", "warn"); }
      log("Cycle " + col.year + ": the expedition to " + arch.name + " brings back " + got.join(", ") + ".", "good"); sfx("buy");
      if (band === "woke" && !col.woke) {
        col.woke = true; col.wokeWhat = arch.kind === "ruin" ? "something in the ruins" : "something deep in the " + arch.name.toLowerCase();
        log("◆ But you woke " + col.wokeWhat + ". It is aware of you now. ◆", "bad"); sfx("bad");
      }
    } else if (band === "hurt") {
      if (who) { who.health = clamp(who.health - rint(14, 30), 0, 100); if (who.health <= 0) killCrew(who, "died of wounds from the expedition to " + arch.name, false, game.crew); else { afflict(null, [who]); log("Cycle " + col.year + ": the expedition to " + arch.name + " goes wrong — " + who.name + " comes back hurt.", "bad"); } }
      sfx("bad");
    } else if (band === "lost") {
      col.supplies.food = Math.max(0, (col.supplies.food || 0) - rint(4, 10));
      col.meters.hope = clamp(col.meters.hope - 4, 0, 100);
      log("Cycle " + col.year + ": the party is lost for a season on the way to " + arch.name + " — stores burned, nerves frayed, but they straggle home.", "warn"); sfx("warn");
    } else if (band === "death") {
      if (who) killCrew(who, "was lost on the expedition to " + arch.name, false, game.crew);
      sfx("death");
    }
  }

  // Player-only: pick a revealed site + assign AWAKE crew, see the risk tier BEFORE committing.
  function openExpedition() {
    var col = game.colony;
    var sites = col.sites.filter(function (st) { return st.revealed && !st.depleted; });
    if (!sites.length) { log("No site is within reach — Scout to reveal the world first.", "warn"); sfx("empty"); return; }
    var crewAvail = awake(game.crew).filter(function (c) { return !c.child; });
    if (!crewAvail.length) { log("No one is awake and able to send out.", "warn"); sfx("empty"); return; }
    var sel = { siteId: sites[0].id, crew: {} };
    function draw() {
      var arch = siteArch(sel.siteId);
      var chosen = crewAvail.filter(function (c) { return sel.crew[c.name]; }).map(function (c) { return c.name; });
      var r = chosen.length ? expeditionRisk(arch, chosen) : null;
      var tot = r ? (r.odds.success + r.odds.hurt + r.odds.lost + r.odds.death + r.odds.woke) : 1;
      var pct = function (n) { return Math.round(n / tot * 100); };
      var siteRows = sites.map(function (st) { var a = siteArch(st.id);
        return "<div class='store-row'><span>" + st.icon + " " + st.name + " <span class='small dim'>" + a.kind + " · worked " + st.uses + "/" + a.capacity + "</span></span><span class='qty small'>" + Object.keys(a.yields).map(function (k) { return k + " +" + a.yields[k]; }).join(" ") + "</span><span></span>" +
          "<span><button class='btn small " + (sel.siteId === st.id ? "go" : "") + "' data-esite='" + st.id + "'>" + (sel.siteId === st.id ? "TARGET" : "pick") + "</button></span></div>"; }).join("");
      var crewRows = crewAvail.map(function (c) {
        return "<div class='store-row'><span>" + c.name + " <span class='small dim'>" + c.role + "</span></span><span></span><span></span>" +
          "<span><button class='btn small " + (sel.crew[c.name] ? "go" : "") + "' data-ecrew='" + c.name + "'>" + (sel.crew[c.name] ? "GOING" : "send") + "</button></span></div>"; }).join("");
      var tierCls = !r ? "dim" : (r.tier === "Deadly" || r.tier === "Dangerous") ? "red" : r.tier === "Risky" ? "amber" : "cyan";
      var riskTxt = r
        ? "<div class='small' style='margin-top:6px'>Risk: <b class='" + tierCls + "'>" + r.tier + "</b> — about <span class='cyan'>" + pct(r.odds.success) + "%</span> a clean haul, <span class='red'>" + pct(r.odds.death) + "%</span> someone may not come back, " + pct(r.odds.hurt) + "% hurt, " + pct(r.odds.lost) + "% lost a season" + (r.odds.woke ? ", <span class='amber'>" + pct(r.odds.woke) + "% you stir something</span>" : "") + ".</div>" +
          "<div class='small dim'>Exploiting this site scars the world (it gets harder to live here). " + (chosen.length === crewAvail.length ? "<span class='amber'>Sending everyone leaves no hands at home this season.</span>" : "") + "</div>"
        : "<div class='small dim' style='margin-top:6px'>Assign at least one awake crew member to see the risk.</div>";
      openModal({
        title: "🧭 Mount an Expedition",
        body: "<div class='small dim'>Send awake crew to a known site. " + siteArch(sel.siteId).blurb + "</div>" +
          "<div class='panel-title' style='margin-top:6px'>Where</div>" + siteRows +
          "<div class='panel-title' style='margin-top:6px'>Who (awake crew only)</div>" + crewRows + riskTxt,
        choices: [
          { label: chosen.length ? "Send the expedition" : "Pick crew first", disabled: !chosen.length,
            onClick: function () { col._pendingExpedition = { siteId: sel.siteId, crewNames: chosen }; closeModal(); colonyTurn("expedition", false); } },
          { label: "Not now", onClick: function () { sfx("cancel"); closeModal(); renderColony(); } }
        ],
        onBind: function (root) {
          root.querySelectorAll("[data-esite]").forEach(function (b) { b.addEventListener("click", function () { sel.siteId = b.getAttribute("data-esite"); sfx("blip"); closeModal(); draw(); }); });
          root.querySelectorAll("[data-ecrew]").forEach(function (b) { b.addEventListener("click", function () { var n = b.getAttribute("data-ecrew"); sel.crew[n] = !sel.crew[n]; sfx("blip"); closeModal(); draw(); }); });
        }
      });
    }
    draw();
  }

  /* ---- P2-M5: the native arc — Contact hub, the wipeout, and the Reckoning ---- */
  // Resolves col._pendingContact (player-only; auto path never sets it, so this is a no-op headless).
  function doContact() {
    var col = game.colony, pend = col._pendingContact; col._pendingContact = null;
    if (!pend || col.relations == null) return;          // natives only
    var s = col.supplies, kind = pend.kind;
    if (kind === "trade") {
      if (s.materials < 6) { log("Cycle " + col.year + ": nothing worth trading on hand.", "warn"); return; }
      s.materials -= 6; s.food = round1((s.food || 0) + 10);
      applyColonyOutcome({ relations: +8, nativeTrust: +2, inf: { cooperate: +2 },
        text: "You trade metalwork for grain and strange fruit. A fair exchange — and they remember it.", type: "good" });
    } else if (kind === "share") {
      if ((s.meds || 0) < 2) { log("Cycle " + col.year + ": no medicine to spare across the treeline.", "warn"); return; }
      s.meds = Math.max(0, s.meds - 2);
      applyColonyOutcome({ relations: +6, nativeTrust: +10, trauma: -2, inf: { cooperate: +4 },
        text: "You send a healer and what medicine you can spare. It is not forgotten.", type: "good" });
    } else if (kind === "parley") {
      resolveColonyCheck("Xenobiologist", 56,
        { nativeTrust: +8, tech: +5, relations: +4, text: "You sit, and listen, and begin to learn their grammar of this world.", type: "good" },
        { nativeTrust: +2, relations: -2, text: "A long, awkward silence on both sides. Something, at least, was attempted.", type: "warn" });
    } else if (kind === "displace") {
      var site = (col.sites || []).filter(function (st) { return st.id === pend.siteId; })[0];
      var arch = site && siteArch(site.id);
      if (arch && arch.yields) { Object.keys(arch.yields).forEach(function (k) {
        if (k === "tech") col.tech = clamp(col.tech + arch.yields.tech, 0, 100);
        else s[k] = round1((s[k] || 0) + arch.yields[k]); });
        if (site) site.uses++; }
      applyColonyOutcome({ relations: -22, nativeTrust: -16, ecoHarm: +8, trauma: +4, inf: { aggress: +6, cooperate: -4 },
        text: "You take the ground you wanted and move them off it. They go. They do not forgive.", type: "bad" });
    } else if (kind === "war") {
      doNativeWar();
    }
  }
  // The wipeout (gut-punch): a costly assault that, if it succeeds, empties the treeline for good.
  function doNativeWar() {
    var col = game.colony;
    var force = (col.defense || 0) + skillAwake("Commander") * 0.4;
    if (odds(40 + force - (col.nativeTrust || 0) * 0.2)) {
      col.nativesGone = true; col.nativeStanding = "displacers"; col.flags.p_reckon = true;   // explicit consume — no one left to reckon with
      col.relations = 0; col.nativeTrust = clamp((col.nativeTrust || 0) - 40, 0, 100);
      applyColonyOutcome({ surv: { health: -10 }, ecoHarm: +6, trauma: +12, hope: -6, kill: true,
        killVerb: "did not come back from the assault on the natives",
        text: "It is over in three brutal seasons. The treeline is empty now — the raids will not come again, and neither will anything else.", type: "bad" });
    } else {
      applyColonyOutcome({ relations: -20, nativeTrust: -20, surv: { health: -16 }, kill: true,
        killVerb: "fell in the failed assault", trauma: +10, hope: -8,
        text: "You move against them and it goes wrong. You have made an enemy of a whole world, and buried your own for it.", type: "bad" });
    }
  }
  // The Contact modal — native-facing choices only (Fortify/Restore are plain season actions).
  function openContact() {
    var col = game.colony;
    if (col.relations == null || col.nativesGone) { log("There is no one here to treat with.", "warn"); sfx("empty"); return; }
    var s = col.supplies;
    var sites = (col.sites || []).filter(function (st) { return st.revealed && !st.depleted; });
    var sel = { siteId: sites.length ? sites[0].id : null };
    function commit(kind) { col._pendingContact = { kind: kind, siteId: sel.siteId }; closeModal(); colonyTurn("contact", false); }
    function draw() {
      var hint = col.nativeTrust >= 75 ? "They speak of you as kin."
        : col.nativeTrust >= 25 ? "They watch you warily, weighing each thing you do."
        : "They have decided what you are. The treeline is all but closed to you.";
      var siteRows = sites.length ? sites.map(function (st) {
        return "<div class='store-row'><span>" + st.icon + " " + st.name + "</span><span></span><span></span><span><button class='btn small " + (sel.siteId === st.id ? "go" : "") + "' data-csite='" + st.id + "'>" + (sel.siteId === st.id ? "TARGET" : "pick") + "</button></span></div>"; }).join("")
        : "<div class='small dim'>No site is in reach to seize — Scout first.</div>";
      openModal({
        title: "🤝 Contact",
        body: "<div class='small dim'>" + hint + "</div><div class='small'>Surface stance: <b>" + Math.round(col.relations) + "</b></div>" +
          "<div class='panel-title' style='margin-top:6px'>A site to seize</div>" + siteRows,
        choices: [
          { label: "Trade goods  [−6 mat → +food, +stance]", disabled: s.materials < 6, onClick: function () { commit("trade"); } },
          { label: "Share medicine  [−2 meds → +trust]", disabled: (s.meds || 0) < 2, onClick: function () { commit("share"); } },
          { label: "Parley & learn  [Xenobiologist]", onClick: function () { commit("parley"); } },
          { label: "Seize a site  [crater trust]", disabled: !sel.siteId, onClick: function () { commit("displace"); } },
          { label: "Drive them out  [war]", onClick: function () { commit("war"); } },
          { label: "Not now", onClick: function () { sfx("cancel"); closeModal(); renderColony(); } }
        ],
        onBind: function (root) { root.querySelectorAll("[data-csite]").forEach(function (b) { b.addEventListener("click", function () { sel.siteId = b.getAttribute("data-csite"); sfx("blip"); closeModal(); draw(); }); }); }
      });
    }
    draw();
  }

  // One colony season: your chosen action lands first, then each manned, powered survival system feeds
  // its axis while the world drains them by the mouths it must keep (research eases the drain); an empty
  // axis escalates (Phase-R style) into health & hope damage, and deaths cost the colony its hope.
  // auto = the colony advancing unattended (the parallel-front hook).
  function colonyTurn(action, auto) {
    var col = game.colony;
    col.year++;                                   // the colony CYCLE counter (cycles, not Earth years)
    var aliveBefore = alive(game.crew).length;    // captured BEFORE the action so expedition deaths cascade hope
    colonyAgeDrift();                             // honest Earth clock + a small per-cycle aging drift on the founders
    applyColonyAction(action);
    var p = colPower(), heads = colHeads(), drain = colHabDrain();
    var techEase = 1 - (col.tech || 0) / 200;     // research lowers per-head consumption
    if (p.brownout) log("Cycle " + col.year + ": power and hands can't run every system — works falter (" + Math.round(p.factor * 100) + "%).", "warn");

    var inCrisis = false;
    COL_SYS.forEach(function (k) {
      var prod = p.on.indexOf(k) >= 0 ? Math.round((8 + (col.sysLvl[k] || 0) * 3) * p.factor) : 0;
      var use = Math.round(heads * drain * techEase);
      col.surv[k] = clamp(col.surv[k] + prod - use, 0, 100);
      if (col.surv[k] <= 0) {
        col._esc[k] = (col._esc[k] || 0) + 1; inCrisis = true;
        var hit = Math.round(Math.min(26, 8 + (col._esc[k] - 1) * 6) * (0.6 + 0.5 * colHarsh()));
        adjustHealthAll(-hit, true);
        col.meters.hope = clamp(col.meters.hope - (3 + col._esc[k] * 2), 0, 100);
        log(SURV_LABEL[k] + (col._esc[k] === 1 ? " has run out — the colony is in crisis." : " still gone (" + col._esc[k] + ") — people are dying."), "bad");
        if (k === "food" || k === "water") col.pop = Math.max(0, col.pop - Math.ceil(col._esc[k] / 2));
        if (col._esc[k] >= 5) col._collapse = 1;     // sustained total failure of a life-support axis
      } else col._esc[k] = 0;
    });

    col._safe = !inCrisis;                 // gates passive recovery of the soft hidden meters
    colonyRecovery();                      // colony auto-medbay: a little healing on safe cycles
    colonyDecay();
    if (col._safe && col.meters.hope < 100) col.meters.hope = clamp(col.meters.hope + 1, 0, 100);
    // Something stirs: a woken thing presses on morale every season until it's reckoned with (P2-M5).
    if (col.woke) col.meters.hope = clamp(col.meters.hope - 1, 0, 100);
    // Natives (P2-M5): relations is the fast surface stance; nativeTrust the slow anchor it gravitates
    // toward — a single fair trade is felt today, but only a pattern relocates the anchor. ecoHarm and a
    // woken thing (the P2-M3 forward declaration, Decision A) slowly bleed the trust the world is owed.
    if (col.relations != null && col.nativeTrust != null) {
      var gap = col.nativeTrust - col.relations;
      if (gap) col.relations = clamp(col.relations + (gap > 0 ? 1 : -1) * Math.min(2, Math.abs(gap)), 0, 100);
      if ((col.ecoHarm || 0) >= tierThreshold(40)) col.nativeTrust = clamp(col.nativeTrust - tierDecay(1), 0, 100);
      if (col.woke) col.nativeTrust = clamp(col.nativeTrust - tierDecay(1), 0, 100);
    }
    // Roll the season's set-piece / named payoff / hazard / event AFTER consumption and BEFORE the
    // death→hope tally, so event & hazard deaths cascade hope exactly like expedition/survival deaths.
    colonyEventPhase(auto, function () { finishColonyTurn(aliveBefore, auto); });
  }
  // Tail of a colony season — runs after the event/hazard resolves (inline for auto, or from the
  // event modal's onClick for a player turn).
  function finishColonyTurn(aliveBefore, auto) {
    var col = game.colony;
    var died = aliveBefore - alive(game.crew).length;
    if (died > 0) col.meters.hope = clamp(col.meters.hope - died * 5, 0, 100);
    colonyStageCheck(auto);     // P2-M6: survival→foothold, and recompute settled eligibility
    if (!auto) sfx("tick");
    colonyAfterTurn(auto);
  }

  /* ---- P2-M6: foothold transition + player-confirmed Settlement victory ----
     The colony advances by SURVIVAL stability, not a timer: a streak of seasons with nothing in crisis,
     every axis above the floor, and hope holding. Clearing survival is an automatic transition to a
     "foothold" (with a one-time narrative beat); becoming a thriving, growing "settlement" is a WIN the
     player chooses to claim once eligible — it never ends the game on its own. */
  function colonyStageCheck(auto) {
    var col = game.colony, m = col.meters;
    // A stable season: not in crisis, every survival axis comfortably off the floor, hope holding.
    var stable = col._safe && COL_SYS.every(function (k) { return col.surv[k] >= 50; }) && m.hope >= 45;
    col._stable = stable ? (col._stable || 0) + 1 : 0;   // any backslide resets the streak
    // Foothold — automatic once the survival streak holds. Fires a one-time beat on the player path.
    if (col.stage === "survival" && col._stable >= colWinBar(3)) {
      col.stage = "foothold"; col.footholdReached = true;
      log("Cycle " + col.year + ": the colony has a foothold. You are no longer just surviving — you can begin to build something that lasts.", "good");
      sfx("win");
      if (!auto) openFutureDecision();
    }
    // Settled eligibility — recomputed every season; growth + sustained prosperity, never an auto-win.
    // Front-agnostic so it holds on empty, native, and settler worlds alike.
    col.settledEligible = col.stage !== "survival" &&
      col.infra >= colWinBar(12) && (col.tech || 0) >= colWinBar(40) &&
      COL_SYS.every(function (k) { return col.surv[k] >= 60; }) &&
      m.hope >= 60 && (col._stable || 0) >= colWinBar(6);
  }

  // THE DECISION (P3-M1) — the Game-A→Game-B hinge. Once the colony has a foothold the future opens into
  // real, simultaneous choices: STAY and make this world wholly yours; READY & SEND the ship home with a
  // crew split (a true split — some go, some hold the colony); loose a cheaper light-speed BEACON as a
  // hedge; and, when established, FOUND the settlement (a standalone victory that no longer hard-ends the
  // game if an ark is already out there — both fronts then compose). The crossing turn loop itself is P3-M2.
  function openFutureDecision() {
    var col = game.colony;
    var eligible = !!col.settledEligible;
    var ready = (col.shipReadiness || 0) >= LAUNCH_READY;
    var launched = !!(game.voyage && game.voyage.active);
    var beaconSent = !!col.beacon;
    openModal({
      title: "⚖ The Decision",
      body: "<div class='small'>The colony has cleared survival. Now the long question: stay and make this world wholly your own — or try to carry what you found back across the dark to a waiting Earth?</div>" +
        "<div class='small dim' style='margin-top:8px'>These are not exclusive. Ready the lander and send a crew home while the rest hold the colony. Loose a light-speed <b>beacon</b> as a cheaper hedge. And when the settlement is established, call it <b>founded</b> — a victory in itself, whether or not the ark ever reaches home.</div>" +
        (launched ? "<div class='small cyan' style='margin-top:8px'>The ark is away, bound for Earth — its crossing still to come.</div>" : "") +
        (eligible
          ? "<div class='small cyan' style='margin-top:8px'>The settlement is established and thriving. You could call it founded.</div>"
          : "<div class='small amber' style='margin-top:8px'>The settlement isn't established enough yet to found — keep building and growing.</div>") +
        (!launched && !ready ? "<div class='small amber' style='margin-top:6px'>The lander isn't spaceworthy yet (refit " + (col.shipReadiness || 0) + "% / " + LAUNCH_READY + "%) — keep refitting before it can attempt the crossing.</div>" : ""),
      choices: [
        { label: launched ? "🚀 The ark is away" : (ready ? "🚀 Ready &amp; send the ship home" : "🚀 Send the ship home — not spaceworthy yet"),
          disabled: launched || !ready, onClick: function () { closeModal(); colonyLaunch(); } },
        { label: beaconSent ? "📡 Beacon already sent" : "📡 Send a beacon home — a light-speed hedge",
          disabled: beaconSent, onClick: function () { sendBeacon(); } },
        { label: "⭐ Found the settlement — claim this world", disabled: !eligible, onClick: function () { confirmSettlement(); } },
        { label: "Stay — keep building", onClick: function () { sfx("cancel"); closeModal(); renderColony(); } }
      ]
    });
  }

  // The light-speed beacon — a cheaper hedge than a physical crossing. A real TIMING call: sent while
  // Earth still listens, the word gets through (beaconHeard, which composeEnding reads); loosed after
  // Earth has gone silent, it crosses an empty house. One-shot — you cannot recall or re-send it.
  function sendBeacon() {
    var col = game.colony;
    if (col.beacon) { log("The beacon is already away — its message is light-years gone. You can't recall it or send another.", "warn"); sfx("empty"); return; }
    col.beacon = true;
    col.beaconHeard = !!(game.earth && game.earth.status !== "silent");   // WRITER for the field composeEnding reads
    col.meters.hope = clamp(col.meters.hope + 2, 0, 100);                 // something hopeful in the trying
    log(col.beaconHeard
      ? "A season's power pours skyward: a light-speed beacon screaming the maps and the warnings back toward a still-living Earth. Whether anyone is left to act on it you will never know — but the word is away."
      : "You loose the beacon into the dark — but Earth has already gone silent behind you, and it crosses toward an empty house. Still: you sent it.", col.beaconHeard ? "good" : "warn");
    sfx("confirm"); closeModal(); save(); renderColony();
  }

  // The player-confirmed win. A short confirm so an errant click can't end the game.
  // P3-M1 re-guard (the P2-M6 forward marker, now due): if an ark is already away (voyage launched +
  // pending) settling must NOT read as a hard finale. The mechanism is already correct — finishColony
  // records colonyDone and tryCompose WAITS for the live voyage, composing TWO WORLDS later — so this is
  // a COPY + follow-the-ark change, not a composer change.
  function confirmSettlement() {
    var col = game.colony;
    var shipOut = !!(game.voyage && game.voyage.active && !game.voyageDone);
    openModal({
      title: "⭐ Found the settlement?",
      body: shipOut
        ? "<div class='small'>Call it founded? You've made a lasting home here — the colony's victory is yours. But the ark is still out in the dark; its fate, and Earth's, are not yet written. This claims the colony; the crossing's story goes on.</div>"
        : "<div class='small'>Call it founded? The colony's story ends here — as a victory. The work of survival becomes the work of living.</div>",
      choices: [
        { label: "Yes — this is home now", onClick: function () {
            col.stage = "settled";
            var cause = "Under an alien sun, a human settlement takes root and grows. The crossing cost everything, and it was worth it — there is a future here now.";
            if (col.nativeStanding === "allied") cause += " Two peoples share this world, and neither stands alone.";
            closeModal();
            finishColony(true, "SETTLED", cause);
            // With an ark still away, finishColony→tryCompose WAITS (no hard end) — persist + follow the ship out.
            if (!game.ended && game.voyage && game.voyage.active && !game.voyageDone) { game.screen = "voyage"; save(); renderApp(); }
          } },
        { label: "Not yet", onClick: function () { sfx("cancel"); closeModal(); openFutureDecision(); } }
      ]
    });
  }
  // Finish a colony year. auto = the colony advancing unattended while you mind the ship home.
  function colonyAfterTurn(auto) {
    save();
    endColonyCheck();                          // may set colonyDone + compose (ends game only if both fronts done)
    if (game.ended) return;
    if (auto) return;                          // off-front: caller renders
    // Player drove the colony this turn — nudge the homebound ship along the shared clock (unless the ark
    // is launched-but-not-yet-flying: the crossing loop is P3-M2; this milestone parks the ship).
    if (game.voyage && game.voyage.active && !game.voyageDone && game.voyage._flying !== false) { var _dn = game.log.length; voyageTurn(true); captureDigest("ship", _dn); save(); }  // [1c] read-only capture
    if (game.ended) return;
    // If the colony just secured/failed but the ship is still out there, follow the ship.
    if (game.colonyDone && game.voyage && game.voyage.active) game.screen = "voyage";
    renderApp();
  }

  /* ---- P2-M4: colony events, hazards, set-pieces, named ledger payoffs ----
     SIBLINGS of the Phase-1 applyOutcome/resolveCheck (which stay untouched): same shape, but they
     target COLONY state (materials/tech/survival axes + hope + hidden meters), never game.supplies/ship. */
  function applyColonyOutcome(o) {
    if (!o) return "";
    var col = game.colony, s = col.supplies, m = col.meters;
    ["materials", "food", "water", "meds"].forEach(function (k) { if (o[k]) s[k] = Math.max(0, round1((s[k] || 0) + o[k])); });
    if (o.surv) for (var a in o.surv) if (col.surv[a] != null) col.surv[a] = clamp(col.surv[a] + o.surv[a], 0, 100);
    if (o.hope) m.hope = clamp(m.hope + o.hope, 0, 100);
    ["tech", "ecoHarm", "contamination", "structuralDebt", "trauma"].forEach(function (k) { if (o[k]) col[k] = clamp((col[k] || 0) + o[k], 0, 100); });
    if (o.infra) col.infra = Math.max(0, col.infra + o.infra);
    if (o.pop) col.pop = Math.max(0, col.pop + o.pop);
    if (o.relations != null && col.relations != null) col.relations = clamp(col.relations + o.relations, 0, 100);
    if (o.nativeTrust != null && col.nativeTrust != null) col.nativeTrust = clamp(col.nativeTrust + o.nativeTrust, 0, 100);
    if (o.defense) col.defense = Math.max(0, (col.defense || 0) + o.defense);
    if (o.standing) col.nativeStanding = o.standing;     // ending-fork field ONLY — does NOT consume p_reckon (set that explicitly)
    if (o.standingS) col.settlerStanding = o.standingS;  // settlers merger fork
    if (o.health) {
      if (o.target === "one") { var one = pick(awake(game.crew)); if (one) { one.health = clamp(one.health + o.health, 0, 100); if (one.health <= 0) killCrew(one, "succumbed"); else if (o.health < 0 && one.status === "Healthy") one.status = "Injured"; } }
      else adjustHealthAll(o.health, true);
    }
    if (o.ailment) afflict(o.ailment === true ? null : o.ailment);
    if (o.kill) { var v = (o.kill === "weakest") ? awake(game.crew).slice().sort(function (a, b) { return a.health - b.health; })[0] : pick(awake(game.crew)); if (v) killCrew(v, o.killVerb || "was lost"); }
    if (o.crack) { var cc = pick(awake(game.crew).filter(function (c) { return c.status !== "Cracked" && !c.child; })) || pick(awake(game.crew)); if (cc) { cc.status = "Cracked"; log(cc.name + " is not the same after this.", "bad"); } }
    if (o.recruit) addColonist();
    if (o.inf) influence(o.inf);
    if (o.text) log(o.text, o.type || "info");
    return o.text || "";
  }
  function addColonist() {
    if (alive(game.crew).length >= MAX_CREW) { log("There is no room and no rations for another mouth.", "warn"); return; }
    var used = {}; game.crew.forEach(function (c) { used[c.name] = 1; });
    var poolN = NAMES.filter(function (n) { return !used[n]; });
    var nm = poolN.length ? pick(poolN) : "Settler-" + rint(10, 99);
    var partner = pick(game.crew);
    var c = { name: nm, role: "Colonist", health: rint(70, 90), morale: game.colony.meters.hope, status: "Healthy", skill: rint(25, 45), ailment: null, bonds: partner ? [partner.name] : [], age: rint(20, 52), child: false };
    if (partner && partner.bonds.indexOf(nm) < 0) partner.bonds.push(nm);
    game.crew.push(c);
  }
  // Same diff/roll/commander-tie/aiAssist math as resolveCheck (minus the ship-only sensors term),
  // but resolves through applyColonyOutcome. resolveCheck itself is NOT touched.
  function resolveColonyCheck(role, baseDiff, success, failure) {
    var diff = baseDiff + Math.round((DIFFICULTY[game.difficulty].harsh - 1) * 40);
    diff -= Math.round((game.potential - 50) * 0.15);
    diff -= aiAssist();
    var roll = skillAwake(role) + rint(0, 40);
    var ok = roll >= diff;
    if (!ok && hasAwakeCommander() && (diff - roll) <= TIE_BAND) { ok = true; log("The Commander steadies them — the call holds.", "good"); }
    sfx(ok ? "good" : "bad");
    return applyColonyOutcome(ok ? success : failure) || (ok ? "It holds." : "It goes wrong.");
  }

  /* Colony events — EVENTS shape; routed through the generalized rollEvent(COLONY_EVENTS, {colony}). */
  var COLONY_EVENTS = [
    { id: "seam", w: 7, title: "A Promising Seam", text: "Survey drones flag a vein of usable ore within reach of the camp.",
      choices: [
        { label: "Dig it out", role: "Engineer", diff: 56,
          success: { materials: +14, text: "A clean dig — materials enough to build for a while.", type: "good" },
          failure: { materials: +5, health: -14, target: "one", text: "A shaft slumps; you get some ore and a hurt digger.", type: "bad" } },
        { label: "Surface-gather only (safe)", outcome: { materials: +6, text: "You take the easy pickings and leave the deep seam be.", type: "info" } } ] },
    { id: "badwater", w: 6, title: "Tainted Cistern", text: "The reclaimers cough up water with a wrong color and a worse smell.",
      choices: [
        { label: "Screen and treat it", role: "Medic", diff: 54,
          success: { meds: -1, text: "Caught it before anyone drank deep. Clean again.", type: "good" },
          failure: { contamination: +12, surv: { water: -10 }, text: "It's in the supply before you isolate it.", type: "bad" } },
        { label: "Ration the clean stores", outcome: { surv: { water: -8 }, hope: -2, text: "Thirsty weeks, but no one sickens.", type: "warn" } } ] },
    { id: "wanderer", w: 5, mood: "crew", title: "A Lone Wanderer", text: "Sensors find a survivor on foot — another mouth, another pair of hands.",
      choices: [
        { label: "Take them in", outcome: { recruit: true, surv: { food: -4 }, hope: +5, inf: { cooperate: +4 }, text: "You take them in. The colony is a little larger, a little kinder.", type: "good" } },
        { label: "Turn them away", outcome: { hope: -5, inf: { cooperate: -4, aggress: +2 }, text: "You close the gates. No one meets anyone's eyes for a while.", type: "warn" } } ] },
    { id: "quiet", w: 6, title: "A Quiet Season", text: "For once the world asks nothing of you. Long light, gentle weather.",
      choices: [ { label: "Let the people breathe", outcome: { hope: +6, trauma: -4, text: "Spirits lift; old wounds settle a little.", type: "good" } } ] },
    { id: "windfall", w: 5, title: "A Good Year", text: "The fields come in heavy and the cisterns brim.",
      choices: [ { label: "Bring it all in", outcome: { surv: { food: +14, water: +8 }, food: +10, hope: +3, text: "Granaries fill. A good year to remember.", type: "good" } } ] },
    { id: "labwork", w: 5, mood: "discover", title: "An Idea in the Lab", text: "A late night pays off — a better way to close a loop in the life-support chain.",
      choices: [
        { label: "Prove it out", role: "Xenobiologist", diff: 55,
          success: { tech: +6, contamination: -5, text: "It works. Cleaner, leaner systems all round.", type: "good" },
          failure: { surv: { health: -6 }, text: "A dead end, and a few wasted weeks.", type: "warn" } } ] },
    { id: "coldsnap", w: 6, title: "Cold Snap", text: "A hard front rolls off the dark side. The heat can't keep up.",
      choices: [
        { label: "Burn materials for warmth", outcome: { materials: -6, surv: { warmth: +10 }, ecoHarm: +4, text: "You feed the furnaces. Warm enough — at a cost to the land.", type: "warn" } },
        { label: "Huddle and endure", outcome: { surv: { warmth: -10, health: -6 }, hope: -3, text: "You ride it out cold. Some take ill.", type: "bad" } } ] },
    { id: "machine", w: 5, title: "Works Breakdown", text: "A core fabricator throws a rod and seizes.",
      choices: [
        { label: "Strip and rebuild it", role: "Engineer", diff: 57,
          success: { text: "Back online by morning. Barely a hiccup.", type: "good" },
          failure: { structuralDebt: +8, surv: { air: -8 }, text: "You cannibalize other works to limp it along.", type: "bad" } } ] },
    { id: "unrest", w: 5, mood: "crew", title: "Discontent", text: "Whispers in the mess: the work is endless, the sky is wrong, home is a memory.",
      choices: [
        { label: "Hold a council", role: "Commander", diff: 52,
          success: { hope: +10, text: "You hear them out and chart a way forward. The colony exhales.", type: "good" },
          failure: { hope: -4, trauma: +4, text: "The council turns to shouting. Some down tools for a week.", type: "bad" } },
        { label: "Ease the work schedule", outcome: { hope: +6, surv: { food: -4 }, text: "You let people rest. Spirits lift; stores slip.", type: "warn" } } ] },
    { id: "nightmares", w: 5, cond: function () { return game.colony.woke; }, title: "Bad Dreams", text: "Since you woke it, the camp doesn't sleep right. People wake with the same dream they can't name.",
      choices: [
        { label: "Name it, study it", role: "Xenobiologist", diff: 60,
          success: { tech: +4, trauma: +2, text: "You begin to understand the thing in the dark. Knowing helps — a little.", type: "warn" },
          failure: { trauma: +8, hope: -4, text: "The more you look, the more it looks back.", type: "bad" } } ] },
    { id: "salvage", w: 5, mood: "discover", title: "Old Wreck on the Ridge", text: "Wind uncovers the ribs of something that crashed here long before you.",
      choices: [
        { label: "Pick it over", outcome: { materials: +8, tech: +3, ecoHarm: +2, text: "Good salvage — metal and a few answers.", type: "good" } },
        { label: "Leave it to the dust", outcome: { hope: +1, inf: { caution: +2 }, text: "Some graves are better left shut.", type: "info" } } ] },
    { id: "birth", w: 4, cond: function () { return game.colony.meters.hope > 50; }, title: "First Cry", text: "Against all the arithmetic of survival, a child is coming.",
      choices: [ { label: "Welcome them", outcome: { pop: +1, hope: +9, food: -4, inf: { persist: +3 }, text: "A first cry rings down the corridors — the first of a generation that will call this world home.", type: "good" } } ] }
  ];

  /* Named ledger payoffs — fire ONCE when a hidden meter crosses its harsh-scaled threshold (col.flags). */
  var COLONY_PAYOFFS = [
    { id: "p_eco", meter: "ecoHarm", at: 60, ev: { id: "groundremembers", title: "The Ground Remembers",
      text: "The land you scarred answers all at once — spores in the air ducts, blight in the fields, migration paths gone wrong. It is not malice. It is consequence.",
      choices: [ { label: "Weather it", outcome: { surv: { food: -22, air: -12, health: -10 }, trauma: +6, hope: -8, text: "You take what the world gives back, and bury some of your own.", type: "bad" } } ] } },
    { id: "p_fever", meter: "contamination", at: 60, ev: { id: "feverseason", title: "The Fever Season",
      text: "What you let fester finds the whole colony at once. The infirmary overflows by the second week.",
      choices: [ { label: "Triage and pray", outcome: { surv: { health: -20 }, meds: -2, health: -16, kill: true, killVerb: "did not survive the fever", hope: -6, text: "You hold the line where you can. Not everywhere.", type: "bad" } } ] } },
    { id: "p_crack", meter: "structuralDebt", at: 60, ev: { id: "longcrack", title: "The Long Crack",
      text: "The corners you cut come due in a single night: a main habitat groans, and gives.",
      choices: [ { label: "Get everyone clear", outcome: { infra: -1, surv: { warmth: -14, air: -10 }, health: -14, target: "one", structuralDebt: -10, hope: -6, text: "A habitat is lost and someone with it, but most get out. The works are set back hard.", type: "bad" } } ] } },
    { id: "p_trauma", meter: "trauma", at: 60, ev: { id: "onewhocouldnt", title: "The One Who Couldn't",
      text: "It has been too much, for too long. One of your own stops answering — stares at a wall where a window should be.",
      choices: [ { label: "Sit with them", outcome: { crack: true, hope: -5, text: "You do what you can. Some weights don't lift. They will not be the same again.", type: "bad" } } ] } },
    // The Reckoning at the Treeline (P2-M5) — the bidirectional nativeTrust payoff. Both share the
    // `consumes: "p_reckon"` flag (set at fire time by the loop, NOT via o.standing) and each gate carries
    // `!flags.p_reckon`, so exactly one fires, once, late.
    { id: "p_reckon_allied", consumes: "p_reckon",
      gate: function (col) { return col.relations != null && col.nativeTrust != null && !col.flags.p_reckon && col.year >= 4 && col.nativeTrust >= 75; },
      ev: { id: "reckon_allied", title: "The Reckoning at the Treeline",
        text: "They come out of the forest at dawn — not as raiders, but ranked and waiting. Whatever was coming for your colony, they mean to meet it beside you.",
        choices: [ { label: "Stand together", outcome: { standing: "allied", defense: +20, surv: { food: +10 }, hope: +12, nativeTrust: +6, relations: +12, recruit: true,
          text: "The line holds because there are two peoples on it now. You will not be driven off this world.", type: "good" } } ] } },
    { id: "p_reckon_hostile", consumes: "p_reckon",
      gate: function (col) { return col.relations != null && col.nativeTrust != null && !col.flags.p_reckon && col.year >= 4 && col.nativeTrust <= tierThreshold(22); },
      ev: { id: "reckon_hostile", title: "The Reckoning at the Treeline",
        text: "They come out of the forest at dawn — all of them, all at once. The grudge you taught them has a face now, and it is yours.",
        choices: [ { label: "Hold what you can", outcome: { standing: "hostile", surv: { food: -20, health: -16 }, kill: true, killVerb: "fell when the treeline came down on the colony",
          nativeTrust: -10, relations: -20, hope: -10, trauma: +8, text: "You hold the core and lose the edge. The world has decided what you are to it.", type: "bad" } } ] } }
  ];

  /* Survival set-pieces — scripted high-tension beats; intercept the roll ONCE at their thresholds. */
  var COLONY_SETPIECES = [
    { id: "sp_night", when: function () { return game.colony.year >= 1; }, ev: { id: "firstnight", title: "The First Night",
      text: "Proxima sets, and a dark you have never known comes down — fourteen hours of it, full of sounds with no names.",
      choices: [
        { label: "Set watches, keep the fires up", role: "Commander", diff: 50,
          success: { hope: +6, text: "You hold the camp together through the long dark. Dawn finds everyone accounted for.", type: "good" },
          failure: { hope: -4, surv: { warmth: -8 }, text: "A long, frightened night. The fires gutter; nerves fray.", type: "warn" } },
        { label: "Everyone inside, lights low", outcome: { surv: { warmth: -4 }, hope: -2, text: "You wait it out in the dark, listening. Morning comes anyway.", type: "info" } } ] } },
    { id: "sp_storm", when: function () { return game.colony.year >= 2; }, ev: { id: "firststorm", title: "The First Storm",
      text: "The sky turns the color of a bruise and the wind arrives like a fist. The young works have never been tested like this.",
      choices: [
        { label: "Lash it all down", role: "Engineer", diff: 56,
          success: { materials: -4, text: "You brace the works in time. They hold, groaning, through the night.", type: "good" },
          failure: { structuralDebt: +8, surv: { warmth: -10 }, health: -10, target: "one", text: "The storm takes a roof and nearly a life. You rebuild in the rain.", type: "bad" } },
        { label: "Abandon the outer works, save the core", outcome: { surv: { food: -10 }, hope: -2, text: "You let the wind have the edges and hold the center.", type: "warn" } } ] } },
    { id: "sp_winter", when: function () { return game.colony.year >= 3; }, ev: { id: "firstwinter", title: "The Long Winter",
      text: "The seasons here are not Earth's. The cold settles in to stay, and the light thins to almost nothing. This is the one that decides whether a colony becomes a grave.",
      choices: [
        { label: "Pool everything, ration hard", role: "Commander", diff: 58,
          success: { surv: { food: -8, warmth: -6 }, hope: +8, text: "You bring them through the worst of it together. When the light returns, the colony is still here — and surer of itself.", type: "good" },
          failure: { surv: { food: -16, warmth: -12, health: -12 }, kill: true, killVerb: "did not see the spring", trauma: +8, text: "Winter takes its tithe. You come out the far side fewer, and quieter.", type: "bad" } } ] } },
    // Settlers (overtaken) — a lean one-time merger-vs-rivalry beat (P2-M5). The fork rides on settlerStanding
    // + pop/contamination; relations/nativeTrust stay strictly natives-only.
    { id: "sp_merger", when: function () { return game.dest.inhabited === "settlers" && game.colony.year >= 2; },
      ev: { id: "settlermerger", title: "The Other Camp",
        text: "The expedition that came before you did not all die. A ragged band walks in from the derelict's shadow — fewer than they were, and asking to be one people with you.",
        choices: [
          { label: "Take them in — one colony", outcome: { standingS: "merged", recruit: true, pop: +2, surv: { food: -8 }, contamination: +6, hope: +6, inf: { cooperate: +5 }, text: "You merge the camps. More hands, more mouths — and a strain of something their derelict carried.", type: "good" } },
          { label: "Keep them at arm's length", outcome: { standingS: "rivals", hope: -2, inf: { caution: +3, aggress: +2 }, text: "You trade with them but keep the gates. Two camps, eyeing each other across the valley.", type: "warn" } } ] } }
  ];

  /* Colony hazards — sampled clean→catastrophic spectrum (mirrors the ship's applyHazardSeverity). */
  var COLONY_HAZARDS = [
    { id: "blight", w: 5, title: "Crop Blight", text: "A grey rot is in the fields, and it is moving.",
      danger: function () { return 0.30 + (game.colony.ecoHarm || 0) / 240; },
      options: [ { label: "Breed it out", role: "Xenobiologist", riskMult: 0.7 }, { label: "Burn the infected fields (safe, costly)", riskMult: 0.5, cost: { surv: { food: -8 } } } ],
      resolve: function (sev) {
        if (sev === "clean") log("You catch the blight early and stop it cold. The harvest holds.", "good");
        else if (sev === "graze") applyColonyOutcome({ surv: { food: -8 }, text: "Some fields lost before you contain it.", type: "warn" });
        else if (sev === "serious") applyColonyOutcome({ surv: { food: -18 }, food: -6, text: "A season's food, gutted by the rot.", type: "bad" });
        else if (sev === "casualty") applyColonyOutcome({ surv: { food: -24 }, health: -12, hope: -4, text: "Famine on the heels of the blight; people weaken.", type: "bad" });
        else applyColonyOutcome({ surv: { food: -30 }, kill: true, killVerb: "starved when the blight took the harvest", hope: -6, text: "The fields die, and so does someone you could not feed.", type: "bad" }); } },
    { id: "quake", w: 5, title: "Ground Tremor", text: "The young world shrugs. Habitats crack; the works flicker.",
      danger: function () { return 0.34 + (game.colony.structuralDebt || 0) / 220; },
      options: [ { label: "Shore up the structures", role: "Engineer", riskMult: 0.7 }, { label: "Evacuate and ride it out", riskMult: 0.55, cost: { hope: -2 } } ],
      resolve: function (sev) {
        if (sev === "clean") log("The ground settles. The works hold. A scare, no more.", "good");
        else if (sev === "graze") applyColonyOutcome({ materials: -4, text: "Minor cracking; quick repairs.", type: "warn" });
        else if (sev === "serious") applyColonyOutcome({ structuralDebt: +6, surv: { air: -8 }, text: "A habitat splits; you lose pressure and time.", type: "bad" });
        else if (sev === "casualty") applyColonyOutcome({ structuralDebt: +8, health: -16, target: "one", surv: { warmth: -8 }, text: "A wall comes down on the night shift.", type: "bad" });
        else applyColonyOutcome({ infra: -1, structuralDebt: +10, kill: true, killVerb: "was lost when the habitat fell", hope: -6, text: "The quake takes a building and a life with it.", type: "bad" }); } },
    { id: "raid", w: 4, cond: function () { var col = game.colony; return col.relations != null && !col.nativesGone && col.relations < 45; }, title: "Night Raid",
      text: "Figures move beyond the lights. The perimeter alarms scream.",
      // low nativeTrust escalates the raid; high trust pushes it negative (the help that simply doesn't bite)
      danger: function () { var col = game.colony; return 0.42 - (col.defense || 0) / 200 + (col.woke ? 0.1 : 0) + (60 - (col.nativeTrust || 60)) / 200; },
      options: [ { label: "Hold the line", role: "Commander", riskMult: 0.8 }, { label: "Give ground, save the people", riskMult: 0.55, cost: { materials: -6 } } ],
      resolve: function (sev) {
        if (sev === "clean") log("The watch holds; the raiders melt back into the dark with nothing.", "warn");
        else if (sev === "graze") applyColonyOutcome({ food: -6, text: "They take some stores and go.", type: "warn" });
        else if (sev === "serious") applyColonyOutcome({ food: -10, relations: -6, hope: -3, text: "They breach the stores; trust bleeds with the grain.", type: "bad" });
        else if (sev === "casualty") applyColonyOutcome({ food: -10, health: -16, target: "one", relations: -8, text: "Blood at the fence line tonight.", type: "bad" });
        else applyColonyOutcome({ kill: true, killVerb: "fell defending the colony", relations: -10, hope: -6, text: "The perimeter breaks. You hold the camp, but not everyone.", type: "bad" }); } },
    { id: "landpush", w: function () { var col = game.colony; return Math.max(0.1, (col.ecoHarm || 0) / 20 + (col.woke ? 3 : 0)); },
      title: "The Land Pushes Back", text: "Something in the biosphere has decided you are a wound it means to close.",
      danger: function () { var col = game.colony; return 0.30 + (col.ecoHarm || 0) / 150 + (col.woke ? 0.15 : 0); },
      options: [ { label: "Study the pattern", role: "Xenobiologist", riskMult: 0.7 }, { label: "Wall it out, hunker down", riskMult: 0.6, cost: { materials: -5 } } ],
      resolve: function (sev) {
        if (sev === "clean") log("You read the land's mood and step lightly. It subsides.", "good");
        else if (sev === "graze") applyColonyOutcome({ surv: { air: -8 }, text: "Spores in the scrubbers; a hard week of filters.", type: "warn" });
        else if (sev === "serious") applyColonyOutcome({ surv: { food: -12, health: -8 }, ecoHarm: +2, text: "The ecology fights you on every front.", type: "bad" });
        else if (sev === "casualty") applyColonyOutcome({ surv: { air: -14, health: -12 }, health: -14, target: "one", text: "Something gets inside the perimeter, and inside a person.", type: "bad" });
        else applyColonyOutcome({ surv: { air: -18, food: -16 }, kill: true, killVerb: "was taken by the world itself", hope: -8, text: "The world closes on the wound. You are the wound.", type: "bad" }); } }
  ];

  // The season's event phase: set-piece (once) → named payoff (once at threshold) → hazard / event /
  // quiet. Always calls done() exactly once (which runs finishColonyTurn). Player → modal; auto → inline
  // via resolveColonyCheck/skillAwake (no modal). The hook in colonyTurn supplies done.
  function colonyEventPhase(auto, done) {
    var col = game.colony;
    if (!col.flags) col.flags = {};            // tolerate a pre-M4 v7 save that predates fire-once flags
    for (var i = 0; i < COLONY_SETPIECES.length; i++) {
      var sp = COLONY_SETPIECES[i];
      if (!col.flags[sp.id] && sp.when()) { col.flags[sp.id] = true; fireColonyEvent(sp.ev, auto, done); return; }
    }
    for (var j = 0; j < COLONY_PAYOFFS.length; j++) {
      var py = COLONY_PAYOFFS[j];
      if (col.flags[py.id]) continue;
      // gated payoffs (the bidirectional Reckoning) use a predicate; the original meter-threshold ones are
      // behavior-identical via the else branch. A `consumes` flag is set at fire time (NOT via o.standing).
      var ok = py.gate ? py.gate(col) : (col[py.meter] || 0) >= tierThreshold(py.at);
      if (ok) { col.flags[py.id] = true; if (py.consumes) col.flags[py.consumes] = true; fireColonyEvent(py.ev, auto, done); return; }
    }
    var roll = Math.random();
    if (roll < 0.18) {
      var hzs = COLONY_HAZARDS.filter(function (h) { return !h.cond || h.cond(); });
      if (hzs.length) {
        var tot = hzs.reduce(function (s, h) { return s + (typeof h.w === "function" ? h.w() : h.w); }, 0);
        var rr = Math.random() * tot, acc = 0, hz = hzs[0];
        for (var k = 0; k < hzs.length; k++) { acc += (typeof hzs[k].w === "function" ? hzs[k].w() : hzs[k].w); if (rr <= acc) { hz = hzs[k]; break; } }
        resolveColonyHazard(hz, auto, done); return;
      }
    }
    if (roll < 0.55) { rollEvent(COLONY_EVENTS, { colony: true, done: done }); return; }
    done();
  }
  function fireColonyEvent(ev, auto, done) {
    if (auto) {
      var ch = ev.choices.find(function (c) { return !c.role; }) || ev.choices[0];
      if (ch.role) resolveColonyCheck(ch.role, ch.diff, ch.success, ch.failure);
      else applyColonyOutcome(ch.outcome);
      done(); return;
    }
    presentEvent(ev, { colony: true, done: done });
  }
  function resolveColonyHazard(hz, auto, done) {
    if (auto) { doColonyHazard(hz, hz.options.find(function (o) { return !o.role; }) || hz.options[0], done); return; }
    var anyViable = hz.options.some(function (o) { return !o.role || hasAwakeSpecialist(o.role); });
    openModal({ title: "⚠ " + hz.title, art: hz.art || "", body: hz.text,
      choices: hz.options.map(function (op) {
        var noOne = op.role && !hasAwakeSpecialist(op.role);
        return { label: op.label + (op.role ? "  [" + op.role + (noOne ? " — none on hand" : "") + "]" : ""), disabled: noOne && anyViable,
          onClick: function () { closeModal(); doColonyHazard(hz, op, done); } };
      }) });
  }
  function doColonyHazard(hz, op, done) {
    if (op.cost) applyColonyOutcome(op.cost);
    var d = clamp(hz.danger() * (op.riskMult || 1) * DIFFICULTY[game.difficulty].harsh, 0.03, 0.95);
    var sev = sampleWeighted({ clean: Math.max(0.03, (1 - d) * 1.5), graze: 0.45 + d * 0.6, serious: d * 1.0,
      casualty: Math.max(0, d - 0.34) * 1.25, severe: Math.max(0, d - 0.58) * 1.15, catastrophic: Math.max(0, d - 0.80) * 1.0 });
    if (sev === "severe") sev = "casualty";   // colony bands map "severe" onto casualty-grade losses
    hz.resolve(sev);
    sfx(sev === "clean" || sev === "graze" ? "select" : "bad");
    done();
  }

  // Shed-load triage across the survival systems (reuse the ship's brownout pattern). Power and hands
  // can't run all five at once — choose which axes to feed.
  function openColonyAllocate() {
    var col = game.colony, al = col.alloc;
    function rows() {
      return COL_SYS.map(function (k) {
        return "<div class='store-row'><span>" + SURV_LABEL[k] + "</span><span class='qty'>" + COL_DRAW + " pwr · 1 hand</span><span></span>" +
          "<span><button class='btn small " + (al[k] ? "go" : "") + "' data-csys='" + k + "'>" + (al[k] ? "ON" : "OFF") + "</button></span></div>";
      }).join("");
    }
    function draw() {
      var p = colPower();
      openModal({
        title: "⚡ Colony Power & Hands",
        body: "<div class='small'>Power <b class='" + (p.brownout ? "red" : "paper") + "'>" + p.demand + " / " + p.output + "</b> · hands <b class='paper'>" + p.hands + "</b> for <b class='paper'>" + p.on.length + "</b> systems" +
          (p.brownout ? " <span class='red'>— OVERLOADED: everything runs at " + Math.round(p.factor * 100) + "%. Shut a system to feed the rest.</span>" : " — all running systems at full.") + "</div>" + rows(),
        choices: [{ label: "Done", onClick: function () { sfx("confirm"); closeModal(); renderColony(); } }],
        onBind: function (root) {
          root.querySelectorAll("[data-csys]").forEach(function (b) {
            b.addEventListener("click", function () { var k = b.getAttribute("data-csys"); al[k] = !al[k]; sfx("blip"); closeModal(); draw(); });
          });
        }
      });
    }
    draw();
  }

  // The colony's fate is recorded (not the whole game's) — a ship may still be flying home.
  function finishColony(won, tier, cause) {
    if (game.colonyDone) return true;
    game.colonyDone = { won: won, tier: tier, cause: cause };
    log(cause, won ? "good" : "bad");
    tryCompose();
    return true;
  }
  // P2-M1 skeleton: lose conditions only. The colony WIN (foothold → settled) arrives in P2-M6.
  function endColonyCheck() {
    if (game.colonyDone) return true;
    var col = game.colony, m = col.meters;
    if (colHeads() <= 0) return finishColony(false, "WITHERED", "The last colonist lies down in alien soil. The settlement goes back to wilderness.");
    if (m.hope <= 0) return finishColony(false, "WITHERED", "Hope runs out before the supplies do. The colony fractures into despair and does not survive.");
    if (col._collapse) return finishColony(false, "LIFE SUPPORT LOST", "A life-support system fails for good, and the cold and the dark take the rest. The colony is gone.");
    return false;
  }

  /* ---------------------------------------------------------
     8c. ACT II — THE MESSAGE HOME (launch when you choose, split the crew)
     and THE VOYAGE BACK (a full turn loop), running IN PARALLEL with the
     colony on a shared clock. Either front can succeed or fail; the finale
     weighs both.
     --------------------------------------------------------- */

  // (Beacon + launch are rebuilt in P3-M1, the Decision milestone.)

  // Crew split: choose who stays to hold the colony and who rides the ark home.
  function colonyLaunch() {
    var col = game.colony;
    // FIXED readiness gate: the LIVE field is shipReadiness (written by Refit, taxed by structuralDebt via
    // its reader) — NOT the dead, never-declared col.shipReady. structuralDebt already taxes it; don't re-tax.
    if ((col.shipReadiness || 0) < LAUNCH_READY) {
      log("The lander isn't spaceworthy yet — keep at the refit (readiness " + (col.shipReadiness || 0) + "% / " + LAUNCH_READY + "%).", "warn"); sfx("empty"); return;
    }
    var living = alive();
    // Children and anyone still in cold sleep can't crew the ark — they hold the colony by default.
    function canGo(c) { return !c.child && c.status !== "Hibernating"; }
    var picks = {};
    living.forEach(function (c) { picks[c.name] = false; });   // default: stay
    function draw() {
      var rows = living.map(function (c) {
        if (!canGo(c)) {
          return "<div class='crew-row'><span class='nm'>" + c.name + "</span><span class='rl small'>" + c.role + (c.child ? " · child" : " · asleep") + "</span>" +
            "<span class='small dim'>stays (can't crew the ark)</span></div>";
        }
        return "<div class='crew-row'><span class='nm'>" + c.name + "</span><span class='rl small'>" + c.role + "</span>" +
          "<span><button class='btn small " + (picks[c.name] ? "" : "go") + "' data-split='stay' data-name='" + c.name + "'>STAY</button>" +
          "<button class='btn small " + (picks[c.name] ? "go" : "") + "' data-split='go' data-name='" + c.name + "'>RETURN</button></span></div>";
      }).join("");
      var nGo = living.filter(function (c) { return picks[c.name]; }).length;
      var nStay = living.length - nGo;
      // A TRUE split: at least one returns to fly the ark, AND at least one stays to hold the colony —
      // the launch never strands the colony and never lifts off empty.
      var ok = nGo >= 1 && nStay >= 1;
      openModal({
        title: "🚀 Crew the ark for home",
        body: "<div class='small dim'>Choose who flies the news back to Earth and who stays to hold the colony. The ark needs at least one hand to fly it; the colony needs at least one to keep it. The voyage provisions from colony stores.</div>" + rows +
          "<div class='small' style='margin-top:6px'>Returning: <b class='paper'>" + nGo + "</b> · Staying: <b class='paper'>" + nStay + "</b></div>",
        choices: [
          { label: ok ? "Launch for Earth" : (nGo < 1 ? "Assign at least one to RETURN" : "At least one must STAY to hold the colony"),
            disabled: !ok,
            onClick: function () { closeModal(); doLaunch(living.filter(function (c) { return picks[c.name]; })); } },
          { label: "Not yet", onClick: function () { sfx("cancel"); closeModal(); renderColony(); } }
        ],
        onBind: function (root) {
          root.querySelectorAll("[data-split]").forEach(function (b) {
            b.addEventListener("click", function () { picks[b.getAttribute("data-name")] = b.getAttribute("data-split") === "go"; sfx("blip"); closeModal(); draw(); });
          });
        }
      });
    }
    draw();
  }

  function doLaunch(returnees) {
    var col = game.colony;
    // Move the returnees out of the colony crew into the ship's crew.
    var goNames = {}; returnees.forEach(function (c) { goNames[c.name] = 1; });
    game.crew = game.crew.filter(function (c) { return !goNames[c.name]; });   // colony keeps the rest
    // Provision the ark from colony stores (with a full refuel as part of the refit). The homeward
    // crossing is ~the whole trail again, so fuel must cover it. Provisions are capped to HOLD_MAX
    // (mirroring cargoUsed — medicine is hold-exempt), trimming food then oxygen then fuel to fit.
    var prov = { fuel: 78, oxygen: 46 + Math.round((col.supplies.water || 0) * 0.4),
                 food: Math.round((col.supplies.food || 0) * 0.45), medicine: Math.min(col.supplies.meds || 0, 3) };
    var over = (prov.fuel + prov.oxygen + prov.food) - HOLD_MAX;   // non-exempt cargo over capacity
    if (over > 0) { var tf = Math.min(prov.food, over); prov.food -= tf; over -= tf;
      if (over > 0) { var to = Math.min(prov.oxygen, over); prov.oxygen -= to; over -= to; }
      if (over > 0) prov.fuel = Math.max(0, prov.fuel - over); }
    // DEDUCT the provisions from the colony — a real both-fronts cost (the food/water/meds leave with them).
    col.supplies.food = Math.max(0, col.supplies.food - prov.food);
    col.supplies.water = Math.max(0, col.supplies.water - Math.round(prov.oxygen * 0.3));
    col.supplies.meds = Math.max(0, col.supplies.meds - prov.medicine);
    col.pop = Math.max(0, col.pop - returnees.length);     // those people leave the colony's count
    startVoyage(returnees, prov, true, true);              // P3-M2: launch flows straight into the crossing (the ark flies)
    log("The ark lifts off Proxima on a pillar of fire, " + returnees.length + " aboard, carrying word of a new world home. Below, the colony watches it go. The long crossing is still ahead of them.", "sys");
    sfx("launch");
    game.screen = "voyage";
    save();                 // persist AFTER the screen flip so a reload returns to the parked-ark front
    renderApp();
  }

  // Arrival RETURN (turn straight around, no colony) — the whole crew flies home.
  function beginReturn() {
    closeModal();
    // You scavenge and refuel at Proxima before turning around — the homeward ark sets out with a
    // real (if modest) stock on top of whatever you arrived with, not your depleted tanks.
    var prov = { fuel: Math.max(78, Math.round(game.supplies.fuel) + 40), oxygen: Math.max(50, Math.round(game.supplies.oxygen) + 24),
                 food: Math.max(64, Math.round(game.supplies.food) + 30), medicine: Math.max(2, game.supplies.medicine) };
    var crew = alive().slice();
    game.crew = [];   // everyone is now on the voyage
    startVoyage(crew, prov, false);
    game.log.push({ msg: "═══ ACT II — THE LONG WAY HOME ═══", type: "sys", day: game.day });
    log("You turn the ship around and point it back the way you came — the longest, loneliest road there is.", "sys");
    game.screen = "voyage";
    renderApp();
  }

  // fly=false sets up the voyage front WITHOUT crossing (P3-M1 colony launch — the crossing loop is P3-M2).
  // The legacy arrival-RETURN path (beginReturn) omits it → flies as before. Missing _flying (old saves) flies.
  function startVoyage(crew, prov, fromColony, fly) {
    crew.forEach(function (c) { if (c.status === "Hibernating") c.status = c.ailment ? "Sick" : "Healthy"; });
    game.voyage = {
      active: true, arrived: false, fromColony: !!fromColony, crew: crew, _flying: fly !== false,
      supplies: { fuel: prov.fuel, oxygen: prov.oxygen, food: prov.food, medicine: prov.medicine || 2 },
      ship: { hull: Math.max(40, Math.round(game.ship.hull)), parts: Math.max(2, game.ship.parts), reactorBase: REACTOR_BASE },
      thrust: "cruise", rations: "full",
      // The way home is shorter than the way out — you've already mapped the trail (and can lean on
      // the fold/known shortcuts), so a live-Earth arrival is achievable before the signal dies.
      distance: 0, total: Math.round(TOTAL_DIST * 0.62), turn: 0, _starve: 0, _anoxia: 0
    };
    // P3-M4 handoff seam: reconcile Earth's hidden truth/belief FROM the OBSERVED outbound status,
    // so an Earth that went silent on the way out can never be "revived" to faint by the first
    // voyage tick — and the truth-based arrival stays consistent with the established outcome.
    if (game.earth) {
      if (game.earth.truth == null) game.earth.truth = 2;
      if (game.earth.estimate == null) game.earth.estimate = game.earth.truth;
      if (game.earth.status === "silent") {                 // outbound silence is binding
        game.earth.truth = Math.max(game.earth.truth, 3);
        game.earth.estimate = game.earth.truth;             // belief reflects the observed silence — no "faint" flicker
        game.earth._silenced = true;
      } else {
        game.earth.estimate = clamp(game.earth.estimate, game.earth.truth - 1, game.earth.truth + 1);
      }
    }
    save();
  }

  function voyPower() {
    var v = game.voyage, out = Math.floor(v.ship.reactorBase * v.ship.hull / 100);
    var demand = POWER_DRAW.lifeSupport + THRUST[v.thrust].power + POWER_DRAW.sensors;
    return { output: out, demand: demand, brownout: demand > out };
  }

  // One homeward turn (auto = the off-front advancing unattended while you mind the colony).
  function voyageTurn(auto) {
    var v = game.voyage; if (!v || !v.active || v.arrived || v._flying === false) return;   // P3-M1: a launched-but-not-flying ark never crosses (the loop is P3-M2)
    v.turn++;
    var th = THRUST[v.thrust], rat = RATIONS[v.rations], pace = th.speed / THRUST.cruise.speed;
    var p = voyPower();
    if (v.supplies.fuel > 0) { v.distance = Math.min(v.total, v.distance + th.speed); v.supplies.fuel = Math.max(0, v.supplies.fuel - th.fuel); }
    else log("Homeward: no fuel — the ship coasts on momentum and prayer.", "bad");
    var aw = Math.max(1, awake(v.crew).length);
    var recover = (p.brownout ? SCRUBBER_RECOVERY * 0.5 : SCRUBBER_RECOVERY) * pace;
    v.supplies.oxygen = round1(v.supplies.oxygen + recover - aw * pace);
    if (v.supplies.oxygen <= 0) { v.supplies.oxygen = 0; v._anoxia = (v._anoxia || 0) + 1; adjustHealthAll(-Math.min(40, 12 + v._anoxia * 8), true, v.crew); adjustMoraleAll(-6, true, v.crew); log("Homeward: the air is gone. The crew gasps in the dark.", "bad"); } else v._anoxia = 0;
    v.supplies.food = round1(v.supplies.food - aw * rat.mult * pace);
    if (v.supplies.food <= 0) { v.supplies.food = 0; v._starve = (v._starve || 0) + 1; adjustHealthAll(-Math.min(26, 6 + v._starve * 5), true, v.crew); adjustMoraleAll(-5, true, v.crew); log("Homeward: stores are empty. Hunger gnaws.", "bad"); } else { v._starve = 0; adjustHealthAll(rat.health, true, v.crew); adjustMoraleAll(rat.morale, true, v.crew); }
    // ailments tick
    ailing(v.crew).forEach(function (c) { c.health = clamp(c.health - (chance(0.5) ? rint(4, 10) : rint(0, 3)) * DIFFICULTY[game.difficulty].harsh, 0, 100); if (c.health <= 0) killCrew(c, "lost their fight with " + c.ailment, false, v.crew); });
    // auto-medbay — a skilled, awake Medic sometimes stretches a dose (treats free)
    if (v.supplies.medicine > 0) { var sick = ailing(v.crew); if (sick.length && skillAwake("Medic", v.crew) + rint(0, 40) >= 70) { if (!(hasAwakeSpecialist("Medic", v.crew) && chance(skillAwake("Medic", v.crew) / 220))) v.supplies.medicine--; sick[0].ailment = null; if (sick[0].status === "Sick") sick[0].status = "Healthy"; sick[0].health = clamp(sick[0].health + 10, 0, 100); } }
    // Sleepers ride the long dark cheaply (they barely eat or breathe — that's the point of podding
    // crew on the homeward haul) but drift in morale and can wake ill.
    sleepers(v.crew).forEach(function (sl) {
      sl.morale = clamp(sl.morale - 1, 0, 100);
      if (chance(0.05 * DIFFICULTY[game.difficulty].harsh) && !sl.ailment) { sl.ailment = "hibernation sickness"; log("Homeward: " + sl.name + " is developing hibernation sickness in the pod.", "warn"); }
    });
    // Engineer keeps the patches holding (slower hull decay)
    var vwear = rint(0, 1) + Math.round((pace - 1) * 2);
    if (vwear > 0 && hasAwakeSpecialist("Engineer", v.crew) && chance(skillAwake("Engineer", v.crew) / 140)) vwear -= 1;
    v.ship.hull = clamp(v.ship.hull - vwear, 0, 100);
    voyageEarthSignal();   // P3-M4: the home-front Earth arc runs off the VOYAGE clock (bounded belief over hidden truth)
    voyageAgeCrew();       // P3-M4: voyage crew age — a transit-born child matures to man a station; elders pass
    applyCommanderFloor(v.crew);    // a Commander aboard keeps the homeward crew off the floor — applied last
    // arrival?
    if (v.distance >= v.total) { voyageArrive(); return; }
    if (alive(v.crew).length === 0) { finishVoyage(false, "LOST WITH ALL HANDS", "Somewhere on the long road home, the last of them stops answering. The ship coasts on, a tomb with good news no one will ever read."); return; }
    // One peril per homeward turn — a sampled-severity crossing OR a choice-event
    // (mirrors the colony's hazard/event split; auto = the off-front resolves it with no modal).
    var peril = Math.random();
    if (peril < HOME_HAZARD_P) rollHomeHazard(auto);
    else if (peril < HOME_HAZARD_P + HOME_EVENT_P) rollVoyageEvent(auto);
  }

  /* Homeward events — weighted, most with real skill-check choices. */
  var VOYAGE_EVENTS = [
    { id: "derelict", w: 6, title: "Drifting Hulk", text: "A dead ship hangs in your path — fuel and parts for the taking, if it's truly dead.",
      choices: [
        { label: "Board and strip it", role: "Engineer", diff: 56, success: { fuel: +12, parts: +1, text: "A clean salvage — fuel and a spare to spare.", type: "good" }, failure: { health: -16, text: "Something gives way as you board; a crewmate is hurt.", type: "bad", target: "one" } },
        { label: "Siphon from outside (safe)", outcome: { fuel: +5, text: "You skim a little fuel and move on.", type: "info" } }
      ] },
    { id: "fold", w: 4, cond: function () { return game.dest.knowledge >= 35 || (game.alien && game.alien.tech); }, title: "A Fold in the Dark",
      text: "The strangers' charts show a seam in space ahead — a way to fold the long road short.",
      choices: [
        { label: "Thread the fold", role: "Pilot", diff: 60, success: { distance: +70, text: "Space bends, and home leaps closer. Years saved in a heartbeat.", type: "good" }, failure: { hull: -14, text: "The fold spits you out hard and off-line, but ahead.", type: "warn", distance: +20 } }
      ] },
    { id: "pursuer", w: 7, cond: function () { return game.alien && game.alien.pursuit; }, title: "Still Following",
      text: "The thing that trailed you out is on your wake again, patient and wrong.",
      choices: [
        { label: "Lose it in a burn", role: "Pilot", diff: 64, success: { fuel: -8, inf: { potential: +2 }, text: "You shake it at last. The sensors go blessedly empty.", type: "good" }, failure: { hull: -18, health: -14, target: "one", text: "It holds the gap and strikes from the dark.", type: "bad" } }
      ] },
    { id: "sick", w: 5, title: "Sickness in the Hold", text: "Cold-sleep fevers and old wounds flare on the long crossing.",
      choices: [
        { label: "Treat them", role: "Medic", diff: 54, success: { medicine: -1, heal: true, text: "Caught and contained.", type: "good" }, failure: { ailment: true, text: "It takes hold before you can stop it.", type: "bad" } }
      ] },
    { id: "calm", w: 6, title: "Quiet Crossing", text: "Long empty days. The crew counts them, and tells old stories of a green world behind.",
      choices: [{ label: "Let them rest", outcome: { morale: +6, text: "Spirits hold. Home is a long way, but they believe in it.", type: "good" } }] },
    { id: "cache", w: 5, title: "Relief Cache", text: "A tumbling container on the old lane — a relief drop from the voyage out.",
      choices: [{ label: "Scoop it up", outcome: { food: +12, fuel: +5, text: "Food and fuel — a good day on a hard road.", type: "good" } }] },
    { id: "lost", w: 5, title: "Lost in the Deep", text: "The stars don't match the old charts. Somewhere back there, you drifted off the line.",
      choices: [
        { label: "Re-localize from first principles", role: "Xenobiologist", diff: 58, success: { inf: { knowledge: +3 }, text: "You fix your position against the deep-field galaxies and correct course. Barely a day lost.", type: "good" }, failure: { distance: -28, text: "The fix comes slowly, and the ship wanders far off the lane before you catch it.", type: "bad" } },
        { label: "Burn back toward the known lane", outcome: { fuel: -10, distance: -8, text: "You spend fuel muscling back onto the trail you know.", type: "warn" } }
      ] },
    { id: "word", w: 5, cond: function () { return game.earth && game.earth.status !== "silent"; }, title: "A Word From Home",
      text: "Across the years, a faint transmission catches up with you — voices from a world still turning.",
      choices: [{ label: "Gather the crew to listen", outcome: { morale: +9, inf: { persist: +3 }, text: "Old songs, a headcount, a promise that someone is waiting. The crew flies a little taller for days.", type: "good" } }] },
    { id: "longdark", w: 5, title: "The Long Dark", text: "Empty months pile up. One of the crew stops eating with the others and stares at the wall where a window used to matter.",
      choices: [
        { label: "Sit with them (Commander)", role: "Commander", diff: 50, success: { morale: +7, text: "You talk them back from the edge. The crew closes ranks around their own.", type: "good" }, failure: { morale: -4, text: "Words aren't enough tonight. The silence wins this round.", type: "warn" } },
        { label: "Let them be", outcome: { morale: -3, text: "You give them room. The dark gives nothing back.", type: "warn" } }
      ] },
    { id: "newlife", w: 3, cond: function () { return awake(game.voyage.crew).filter(function (c) { return !c.child && c.age < 50; }).length >= 2 && alive(game.voyage.crew).length < MAX_CREW; }, title: "New Life on the Long Road",
      text: "On a crossing measured in decades, life insists on itself: a child is coming, born to the dark between stars.",
      choices: [{ label: "Welcome them", outcome: { recruit: true, morale: +8, food: -4, inf: { persist: +3 }, text: "A first cry rings down the corridors. The ship is a little fuller, and a great deal warmer. They will not remember Earth or Proxima — only this ship, and home ahead.", type: "good" } }] }
  ];
  function rollVoyageEvent(auto) {
    var v = game.voyage;
    var pool = VOYAGE_EVENTS.filter(function (e) { return !e.cond || e.cond(); });
    var total = pool.reduce(function (s, e) { return s + e.w; }, 0);
    var r = Math.random() * total, acc = 0, ev = pool[0];
    for (var i = 0; i < pool.length; i++) { acc += pool[i].w; if (r <= acc) { ev = pool[i]; break; } }
    if (auto) {
      // unattended: take the safe/non-role option if present, else the first
      var ch = ev.choices.find(function (c) { return !c.role; }) || ev.choices[0];
      if (ch.role) resolveVoyageCheck(ch.role, ch.diff, ch.success, ch.failure); else voyageOutcome(ch.outcome);
    } else presentVoyageEvent(ev);
  }
  function presentVoyageEvent(ev) {
    var v = game.voyage;
    var choices = ev.choices.map(function (ch) {
      var noOne = ch.role && !hasAwakeSpecialist(ch.role, v.crew);
      var anyOther = ev.choices.some(function (c2) { return !c2.role || hasAwakeSpecialist(c2.role, v.crew); });
      return {
        label: ch.label + (ch.role ? "  [" + ch.role + (noOne ? " — none aboard" : "") + "]" : ""),
        disabled: noOne && anyOther,
        onClick: function () { closeModal(); if (ch.role) resolveVoyageCheck(ch.role, ch.diff, ch.success, ch.failure); else { voyageOutcome(ch.outcome); sfx("select"); } voyageAfterTurn(false); }
      };
    });
    openModal({ title: "⚠ " + ev.title, body: ev.text, choices: choices });
  }
  function resolveVoyageCheck(role, baseDiff, success, failure) {
    var v = game.voyage, diff = baseDiff + Math.round((DIFFICULTY[game.difficulty].harsh - 1) * 40);
    var roll = skillAwake(role, v.crew) + rint(0, 40), ok = roll >= diff;
    if (!ok && hasAwakeCommander(v.crew) && (diff - roll) <= TIE_BAND) { ok = true; log("Homeward: the Commander breaks the tie — the call holds.", "good"); }
    sfx(ok ? "good" : "bad");
    voyageOutcome(ok ? success : failure);
  }
  function voyageOutcome(o) {
    if (!o) return;
    var v = game.voyage, s = v.supplies;
    ["fuel", "oxygen", "food", "medicine"].forEach(function (k) { if (o[k]) s[k] = Math.max(0, round1(s[k] + o[k])); });
    if (o.parts) v.ship.parts = Math.max(0, v.ship.parts + o.parts);
    if (o.hull) v.ship.hull = clamp(v.ship.hull + o.hull, 0, 100);
    if (o.distance) v.distance = Math.min(v.total, v.distance + o.distance);
    if (o.morale) adjustMoraleAll(o.morale, true, v.crew);
    if (o.health) { if (o.target === "one") { var one = pick(awake(v.crew)); if (one) { one.health = clamp(one.health + o.health, 0, 100); if (one.health <= 0) killCrew(one, "was lost on the road home", false, v.crew); } } else adjustHealthAll(o.health, true, v.crew); }
    if (o.ailment) afflict(o.ailment === true ? null : o.ailment, v.crew);
    if (o.heal) { var sick = ailing(v.crew); if (sick.length) { sick[0].ailment = null; if (sick[0].status === "Sick") sick[0].status = "Healthy"; } }
    var recruitFull = false;
    if (o.recruit) {
      if (alive(v.crew).length >= MAX_CREW) recruitFull = true;
      else {
        var used = {}; v.crew.forEach(function (c) { used[c.name] = 1; });
        var pool = KID_NAMES.filter(function (n) { return !used[n.trim()]; });
        var nm = (pool.length ? pick(pool) : "Child-" + rint(10, 99)).trim();
        v.crew.push({ name: nm, role: "Child", health: 100, morale: 80, status: "Healthy", skill: 0, ailment: null, bonds: [], age: 0, child: true });
      }
    }
    if (o.inf) influence(o.inf);
    if (o.text) log("Homeward: " + (recruitFull ? "there's no berth left aboard for another soul — the crew is already at its limit." : o.text), recruitFull ? "warn" : (o.type || "info"));
  }

  /* ---------------------------------------------------------
     Homeward sampled-severity HAZARDS (P3-M3)
     A SIBLING of the outbound HAZARDS / resolveHazard / applyHazardSeverity layer — NOT a
     reuse: it operates on game.voyage (voyage.ship.hull, awake(v.crew), v.distance) through
     voyageOutcome (never the frozen applyOutcome), and a catastrophe ends the VOYAGE via
     finishVoyage → tryCompose (never a bare endGame), so a live colony still composes.
     debris/vflare/micromet migrated out of VOYAGE_EVENTS so the home front's crossings sample
     a clean→catastrophic spectrum instead of resolving on a single binary check.
     --------------------------------------------------------- */
  var HOME_HAZARD_P = 0.18, HOME_EVENT_P = 0.34;   // per-turn split (hazard / event / else quiet); tune via smoke
  var HOME_HAZARDS = [
    { id: "debris", w: 8, title: "CROSSING: Debris Field", noun: "the debris field",
      art: "  ·  o   .  O  ·\n .   O  ·  o   .",
      text: "Old wreckage tumbles across the homeward lane — some of it moving fast enough to gut the ship. There is no clean way through, only ways less likely to kill you.",
      deathText: "A wall of tumbling iron you never saw fills the screen. The ship is opened to the dark, and the long road home ends here.",
      options: [
        { label: "Thread it at the helm", role: "Pilot", risk: 0.42 },
        { label: "Shields up, bull through", risk: 0.30, cost: { hull: -8 } }
      ] },
    { id: "vflare", w: 6, title: "CROSSING: Stellar Flare", noun: "the flare",
      art: "(((( ★ ))))  rad",
      text: "A distant sun coughs a sheet of hard radiation across the homeward lane. It's coming, and there's no going around it.",
      deathText: "The flare peaks just as you commit. The hull lights up from within, and the crew with it. Home was so close you could read its old light.",
      options: [
        { label: "Angle the hull and ride it out", role: "Pilot", risk: 0.40 },
        { label: "Power down and coast through it dark", risk: 0.26, cost: { fuel: -4, morale: -2 } }
      ] },
    { id: "micromet", w: 6, title: "CROSSING: Micrometeoroid Swarm", noun: "the swarm",
      art: "· ˙ * ˙ · ˙ * · ˙",
      text: "A glittering veil ahead — beautiful, and moving fast enough to core the ship.",
      deathText: "The swarm finds everything at once. A thousand pinpricks become one long tear, and the ship comes apart in the sparkle.",
      options: [
        { label: "Thread the gaps", role: "Pilot", risk: 0.40 },
        { label: "Hold and wait for a gap (costs stores)", risk: 0.22, cost: { food: -6, oxygen: -6 } }
      ] }
  ];
  // The danger sampler — sibling of resolveHazard's math, voyage-scoped: voyage hull + brownout +
  // awake Pilot of the voyage crew + global posture/potential, no sensors-allocation / no autopilot term.
  function voyageHazardDanger(op) {
    var v = game.voyage, pilot = skillAwake("Pilot", v.crew);
    var danger = op.risk;
    danger += (100 - v.ship.hull) / 240;                      // a wounded ark is in more peril
    danger -= (op.role === "Pilot" ? pilot : pilot * 0.4) / 320;
    if (voyPower().brownout) danger += 0.12;                  // a browned-out ship flies half-blind
    danger += Math.max(0, -game.posture.caution) / 500;       // recklessness courts catastrophe
    danger += Math.max(0, game.posture.aggress) / 800;
    danger -= (game.potential - 50) * 0.0025;                 // momentum bleeds into peril, too
    danger *= DIFFICULTY[game.difficulty].harsh;
    return clamp(danger, 0.03, 0.95);
  }
  function rollHomeHazard(auto) {
    var v = game.voyage;
    var total = HOME_HAZARDS.reduce(function (s, h) { return s + h.w; }, 0);
    var r = Math.random() * total, acc = 0, hz = HOME_HAZARDS[0];
    for (var i = 0; i < HOME_HAZARDS.length; i++) { acc += HOME_HAZARDS[i].w; if (r <= acc) { hz = HOME_HAZARDS[i]; break; } }
    if (auto) {
      // unattended off-front: take the safe/non-role option, resolve INLINE with no modal
      var op = hz.options.find(function (o) { return !o.role; }) || hz.options[0];
      resolveHomeHazard(hz, op);
    } else presentHomeHazard(hz);
  }
  function presentHomeHazard(hz) {
    var v = game.voyage;
    var choices = hz.options.map(function (op) {
      var noOne = op.role && !hasAwakeSpecialist(op.role, v.crew);
      var anyOther = hz.options.some(function (o2) { return !o2.role || hasAwakeSpecialist(o2.role, v.crew); });
      return {
        label: op.label + (op.role ? "  [" + op.role + (noOne ? " — none aboard" : "") + "]" : ""),
        disabled: noOne && anyOther,
        onClick: function () { closeModal(); resolveHomeHazard(hz, op); voyageAfterTurn(false); }
      };
    });
    openModal({ title: "⚠ " + hz.title, art: hz.art || "", body: hz.text, choices: choices });
  }
  function resolveHomeHazard(hz, op) {
    if (op.cost) voyageOutcome(op.cost);                       // the chosen approach's up-front price
    var d = voyageHazardDanger(op);
    var sev = sampleWeighted({
      clean:        Math.max(0.03, (1 - d) * 1.5),
      graze:        0.45 + d * 0.6,
      serious:      d * 1.0,
      casualty:     Math.max(0, d - 0.34) * 1.25,
      crippling:    Math.max(0, d - 0.58) * 1.15,
      catastrophic: Math.max(0, d - 0.80) * 1.0
    });
    voyageHazardSeverity(hz, sev, op);
    sfx(sev === "clean" || sev === "graze" ? "select" : "bad");
  }
  // Sibling of applyHazardSeverity — same spectrum, but every mutation lands on game.voyage via
  // voyageOutcome, and catastrophic ends the VOYAGE (not the game) so a live colony composes.
  function voyageHazardSeverity(hz, sev, op) {
    var v = game.voyage, n = hz.noun || "the hazard";
    if (sev === "clean") {
      influence({ potential: +1, persist: +1 });
      log("Homeward: you slip through " + n + " clean — not a scratch. The crew breathes again.", "good");
    } else if (sev === "graze") {
      voyageOutcome({ hull: -rint(8, 14), text: "you take a few hits crossing " + n + ". Plating scarred, nothing vital.", type: "warn" });
    } else if (sev === "serious") {
      voyageOutcome({ hull: -rint(16, 26) });
      if (chance(0.5)) afflict(null, v.crew);
      else { var c = pick(awake(v.crew)); if (c) { c.health = clamp(c.health - rint(18, 30), 0, 100); if (c.health <= 0) killCrew(c, "was lost crossing " + n, false, v.crew); else c.status = "Injured"; } }
      log("Homeward: a bad crossing of " + n + ". Real damage, and someone is hurt.", "bad");
    } else if (sev === "casualty") {
      voyageOutcome({ hull: -rint(14, 24) });
      var vic = pick(awake(v.crew)); if (vic) killCrew(vic, "was killed crossing " + n, false, v.crew);
      if (chance(0.25)) { var v2 = pick(awake(v.crew)); if (v2) killCrew(v2, "died in the same disaster", false, v.crew); }
      influence({ potential: -3 });
      log("Homeward: " + n + " takes a life. The ship limps onward, quieter than before.", "bad");
    } else if (sev === "crippling") {
      voyageOutcome({ hull: -rint(30, 45), fuel: -rint(8, 16), oxygen: -rint(6, 12) });
      influence({ potential: -5 });
      var back = rint(8, 20); v.distance = Math.max(0, v.distance - back);
      log("Homeward: you come out of " + n + " crippled, and flung " + back + " back off course.", "bad");
    } else { // catastrophic — the ark is lost, but a live colony still gets its ending
      finishVoyage(false, "LOST WITH ALL HANDS", hz.deathText || ("The ship is torn apart in " + n + ". The long road home ends here, in silence."));
    }
  }

  function voyageArrive() {
    var v = game.voyage; v.arrived = true; v.active = false;
    // P3-M4: resolve on Earth's hidden TRUTH (not the shown belief) — the arrival can honestly surprise.
    var truth = game.earth ? game.earth.truth : 2;
    var crewN = alive(v.crew).length, hull = v.ship.hull;
    var won = false, tier, cause;
    if (crewN === 0) { finishVoyage(false, "LOST WITH ALL HANDS", "The ship reaches home space on momentum alone. There is no one left aboard to send the signal."); return; }
    if (truth >= 4) {                            // gone
      tier = "TOO LATE"; cause = "You cross back to where Earth was — and find nothing answering at all. No domes, no beacons, not even the old automatic chatter. You carried hope across the void to a grave.";
    } else if (truth === 3) {                    // silent
      tier = "A SILENT SHORE"; cause = "You reach home space and the receivers stay dark. Earth is still there — continents, oceans — but no one hails back. You drift in shouting your good news into a silence that has its own weight.";
    } else if (hull >= 55 && crewN >= 1) {       // changed / recovered / thriving, sound arrival
      won = true;
      if (truth <= 1) { tier = "WORD WORTH CROSSING FOR"; cause = "You reach home space and Earth answers strong — it held, it mended, it endured. And now you hand it a second world besides. The crossing was worth every year it cost."; }
      else { tier = "MESSENGER"; cause = "You reach home space with the only good news in a generation — a second world, and the way to it. A dying Earth dares, again, to pack its bags."; }
    } else { won = true; tier = "THE LONG WAY HOME"; cause = "Battered but breathing, you limp into home space and pass on what you found. It will have to be enough — and somehow, it is."; }
    finishVoyage(won, tier, cause);
  }
  function finishVoyage(won, tier, cause) {
    game.voyageDone = { won: won, tier: tier, cause: cause };
    game.voyage.active = false;
    log(cause, won ? "good" : "bad");
    tryCompose();
  }
  // Finish a homeward turn. auto = the ship advancing unattended while you mind the colony.
  function voyageAfterTurn(auto) {
    save();
    if (game.ended || auto) return;
    // Player drove the ship this turn — nudge the colony along the shared clock.
    if (game.colony && !game.colonyDone) { var _dn = game.log.length; colonyAutoStep(); captureDigest("colony", _dn); }  // [1c] read-only capture
    if (game.ended) return;
    // If the ship just arrived/was lost but the colony fights on, follow the colony.
    if (game.voyageDone && game.colony && !game.colonyDone) game.screen = "colony";
    renderApp();
  }
  // Player-driven homeward turn (the "Continue" on the voyage screen).
  function voyageStep() {
    if (game.voyage && game.voyage._flying === false) { renderVoyage(); return; }   // P3-M1: the ark is away; the crossing is P3-M2
    voyageTurn(false);
    if (modalOpen()) return;      // an event modal will resume the turn via its onClick
    voyageAfterTurn(false);
  }

  // Homeward hibernation — the key lever on a long crossing with finite air and food: pod crew to
  // stretch the stores (sleepers barely consume), at the cost of hands for events and pod-sickness.
  function voyageHibernate() {
    var v = game.voyage;
    var rows = v.crew.map(function (c) {
      if (c.status === "Dead") return "<div class='crew-row'><span>✖</span><span class='nm s-Dead'>" + c.name + "</span><span class='rl'>" + c.role + "</span><span>—</span><span></span></div>";
      var btn = c.status === "Hibernating"
        ? "<button class='btn small' data-vhib='wake' data-name='" + c.name + "'>Wake</button>"
        : "<button class='btn small' data-vhib='sleep' data-name='" + c.name + "'>Hibernate</button>";
      return "<div class='crew-row'><span>" + (c.status === "Hibernating" ? "❄" : "•") + "</span>" +
        "<span class='nm'>" + c.name + "</span><span class='rl'>" + c.role + "</span>" +
        "<span class='st s-" + c.status + "'>" + c.status + "</span><span>" + btn + "</span></div>";
    }).join("");
    openModal({
      title: "❄ Cold Sleep (homeward)",
      body: "<div class='small dim'>Sleepers use almost no air or food — the way to make finite stores last the long crossing — but can't act, and wake groggy. Keep someone awake to fly, and a Medic awake to treat sickness.</div>" + rows,
      choices: [{ label: "Close", onClick: function () { sfx("confirm"); closeModal(); save(); renderVoyage(); } }],
      onBind: function (root) {
        root.querySelectorAll("[data-vhib]").forEach(function (b) {
          b.addEventListener("click", function () {
            var c = byName(b.getAttribute("data-name"), v.crew); if (!c) return;
            if (b.getAttribute("data-vhib") === "sleep") {
              if (awake(v.crew).length <= 1) { log("Someone has to stay awake to fly the ship home.", "warn"); sfx("empty"); return; }
              c.status = "Hibernating"; log("Homeward: " + c.name + " enters cold sleep.", "info");
            } else {
              c.status = c.ailment ? "Sick" : "Healthy";
              if (chance(0.25)) { c.ailment = "hibernation sickness"; c.status = "Sick"; log("Homeward: " + c.name + " wakes groggy and ill.", "warn"); }
              else log("Homeward: " + c.name + " wakes from cold sleep.", "good");
            }
            sfx("select"); closeModal(); voyageHibernate();
          });
        });
      }
    });
  }

  // Rest & repair on the homeward ship — trade time (and a part or two) for hull and morale.
  function voyageRest() {
    var v = game.voyage;
    var eng = skillAwake("Engineer", v.crew);
    var repair = Math.round(10 + eng / 5);
    var partsUsed = Math.min(v.ship.parts, Math.ceil((100 - v.ship.hull) / (14 + eng / 8)));
    v.ship.parts -= partsUsed;
    v.ship.hull = clamp(v.ship.hull + repair + partsUsed * 6, 0, 100);
    v.supplies.oxygen = round1(Math.max(0, v.supplies.oxygen - 2));
    v.supplies.food = round1(Math.max(0, v.supplies.food - 3));
    adjustMoraleAll(+5, true, v.crew);
    log("Homeward: you stand down for a spell — patch the hull (+" + (repair + partsUsed * 6) + (partsUsed ? ", " + partsUsed + " parts" : "") + ") and let the crew breathe. Spirits lift.", "good");
    sfx("confirm");
    voyageAfterTurn(false);
  }

  // Scavenge the old trail — actively hunt the wreckage and caches you passed on the way out.
  function voyageScavenge() {
    var v = game.voyage;
    var skill = Math.max(skillAwake("Engineer", v.crew), skillAwake("Pilot", v.crew));
    var r = sampleWeighted({ haul: 4 + skill / 20, little: 4, nothing: 3, trouble: 2.5 });
    if (r === "haul") {
      var f = rint(8, 16), fu = rint(0, 1) ? 1 : 0;
      v.supplies.fuel = round1(v.supplies.fuel + f); v.supplies.food = round1(v.supplies.food + rint(4, 10)); if (fu) v.ship.parts += 1;
      influence({ explore: +2, persist: +1 });
      log("Homeward: a fat find on the old lane — " + f + " fuel, some food" + (fu ? ", and a usable spare" : "") + ".", "good"); sfx("buy");
    } else if (r === "little") {
      var f2 = rint(3, 7); v.supplies.fuel = round1(v.supplies.fuel + f2);
      log("Homeward: you skim a little fuel (+" + f2 + ") from a tumbling wreck.", "info");
    } else if (r === "nothing") {
      log("Homeward: hours of searching the dark turn up nothing but old debris.", "info");
    } else {
      var hurt = pick(awake(v.crew));
      if (hurt) { hurt.health = clamp(hurt.health - rint(8, 18), 0, 100); if (hurt.health <= 0) killCrew(hurt, "died boarding a wreck on the way home", false, v.crew); }
      v.ship.hull = clamp(v.ship.hull - rint(4, 10), 0, 100); influence({ caution: +2 });
      log("Homeward: a salvage goes wrong — a hull knock and a hurt crewmate for your trouble.", "bad"); sfx("bad");
    }
    voyageAfterTurn(false);
  }

  // === Parallel clock: advancing one front nudges the other along unattended. ===
  function colonyAutoStep() {
    if (!game.colony || game.colonyDone) return;   // safe no-op guard (parallel-front hook for M-INT1b)
    // sensible unattended investment: shore up if a system is low, else research; rest otherwise.
    var col = game.colony, low = COL_SYS.some(function (k) { return col.surv[k] < 35; });
    colonyTurn(low && col.supplies.materials >= 6 ? "secure" : (col.supplies.materials >= 6 ? "research" : "hold"), true);
  }
  function voyageAutoStep() {
    if (!game.voyage || !game.voyage.active || game.voyageDone || game.voyage._flying === false) return;   // P3-M1: parked ark never auto-crosses
    voyageTurn(true);
    if (!game.ended && !game.voyageDone) save();
  }

  function tryCompose() {
    // If the ship never launched, the colony's fate alone ends the game (Phase C1 behavior).
    if (!game.voyage) { if (game.colonyDone) composeEnding(); return; }
    // Parallel: wait for BOTH fronts to resolve.
    if (game.colony && !game.colonyDone) return;   // colony still going
    if (game.voyage.active && !game.voyageDone) return;  // ship still flying
    composeEnding();
  }
  function composeEnding() {
    if (game.ended) return;
    var c = game.colonyDone, v = game.voyageDone;
    var cWon = c && c.won, vWon = v && v.won;
    var beaconHeard = game.colony && game.colony.beaconHeard;   // a beacon that reached a living Earth
    var tier, cause, won;
    if (c && v) {
      if (cWon && vWon) { won = true; tier = "TWO WORLDS"; cause = "A colony takes root under an alien sun — and the ship reaches home with the news. Two cradles now. Humanity is no longer all in one place, and never will be again. " + c.cause + " " + v.cause; }
      else if (cWon && !vWon) {
        // P3-M-INT1: split on v.tier — the ship DID arrive for TOO LATE / A SILENT SHORE (Earth was
        // gone/silent, not the ship lost), so "never made it home" only holds for LOST WITH ALL HANDS.
        won = true;
        if (v.tier === "TOO LATE") { tier = "A WORLD, AND AN EMPTY SKY"; cause = "The colony stands and grows — and the ship did reach home space, only to find the sky where Earth was gone utterly quiet: no domes, no beacons, no answer at all. The crossing was made; there was simply no one left to make it to. What you built out here is no longer humanity's newest thread — it is the only one. " + c.cause; }
        else if (v.tier === "A SILENT SHORE") { tier = "A WORLD, AND A SILENT SHORE"; cause = "The colony stands and grows — and the ship did reach home space, only to find Earth still there and answering nothing, every receiver dark. The news arrived; the silence kept it. Whatever became of the cradle became of it without a word. The world you built out here is the only one still speaking. " + c.cause; }
        else { tier = beaconHeard ? "A WORLD, AND WORD" : "A WORLD, AT LEAST"; cause = "The colony stands and grows — but the ship that carried the news never made it home. " + (beaconHeard ? "Yet your beacon reached a living Earth years ago; they know what you found, and where. " : "Earth may never know. The future, at least, has a foothold. ") + c.cause; }
      }
      else if (!cWon && vWon) { won = true; tier = "THE MESSENGER"; cause = "The colony fell — but the ship reached home carrying the maps, the warnings, and the survivors. Someone else will try again, knowing more. " + v.cause; }
      else if (beaconHeard) { won = true; tier = "THE WORD GOT THROUGH"; cause = "The colony withered and the ship was lost in the dark — but your beacon had already reached a living Earth, carrying the maps and the warnings. You did not survive. What you learned did. The next ones will know more. " + c.cause; }
      else { won = false; tier = "EXTINCT"; cause = "The colony withered and the ship was swallowed by the dark. The long gamble is over, and it is lost. " + c.cause; }
    } else if (c) {
      // Colony-only ending (no ship launched): a heard beacon turns a fallen colony into a partial win.
      if (!cWon && beaconHeard) { won = true; tier = "THE WORD GOT THROUGH"; cause = "The colony did not last — but the beacon you sent reached a living Earth with everything you learned. You are gone; the knowledge is not. " + c.cause; }
      else { won = cWon; tier = c.tier; cause = c.cause + (cWon && beaconHeard ? " Your beacon reached home, too — Earth knows there is a place out here that holds." : ""); }
    }
    else { won = vWon; tier = v.tier; cause = v.cause; }
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
    var recruitFull = false;
    if (o.recruit) { if (!addCrewMember(o.recruit === true ? null : o.recruit)) recruitFull = true; }
    if (o.clearPursuit && game.alien) game.alien.pursuit = false;
    if (o.inf) influence(o.inf);              // bend the hidden odds (probabilistic engine)
    if (o.text) {
      // Don't promise a crewmate the ship can't carry: at full crew, say so plainly instead of
      // logging "they join the crew" when no one was actually added.
      if (recruitFull) log("There's no berth left — the ship is already at full crew (" + MAX_CREW + "). You share what supplies you can, but they can't come aboard.", "warn");
      else log(o.text, o.type || "info");
    }
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
    if (!ok && hasAwakeCommander() && (diff - roll) <= TIE_BAND) { ok = true; log("The Commander breaks the tie — the call holds.", "good"); }
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
          success: { res: { fuel: +14, medicine: +2, oxygen: +10 }, credits: -80, morale: +6, text: "You learn the rhythm of their bartering — a fistful of credits for fuel, air and medicine. Out here, that's a bargain worth making.", type: "good" },
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
        { label: "Decode the pattern", role: "Xenobiologist", diff: 60,
          success: { morale: +4, inf: { knowledge: +6, explore: +4, potential: +2 }, text: "Your xenobiologist teases structure out of the noise — not a translation, but the shape of a mind behind it. Whatever is out here, it is trying to be understood.", type: "good" },
          failure: { morale: -4, inf: { caution: +2 }, text: "The pattern resists every key you try. It only gets stranger the longer you stare.", type: "warn" } },
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

  function rollEvent(pool, opts) {
    opts = opts || {};
    // The ship front draws from EVENTS with zone + contact gating; a colony pool (P2-M4)
    // is passed explicitly and filters on its own e.cond only (no zones / no contact gate).
    var isCol = !!opts.colony;
    var source = pool || EVENTS;
    var zone = currentZone();
    var avail = source.filter(function (e) {
      if (isCol) return e.cond ? !!e.cond() : true;
      // Gate alien content behind first contact; gate foreshadowing to before it.
      if (e.req === "postContact" && !game.contact) return false;
      if (e.req === "preContact" && game.contact) return false;
      if (e.cond && !e.cond()) return false;
      if (!e.zones) return true;
      return e.zones.indexOf(zone) > -1;
    });
    // No event available for this front/turn — don't stall a colony turn waiting on a modal.
    if (!avail.length) { if (opts.done) opts.done(); return; }
    // Weighted pick — but the crew's posture bends which kinds of events surface,
    // so an aggressive run feels different from an exploratory one.
    var total = avail.reduce(function (s, e) { return s + eventWeight(e); }, 0);
    var r = Math.random() * total, acc = 0, ev = avail[0];
    for (var i = 0; i < avail.length; i++) { acc += eventWeight(avail[i]); if (r <= acc) { ev = avail[i]; break; } }
    presentEvent(ev, opts);
  }
  var MOOD_AXIS = { confront: "aggress", discover: "explore", crew: "cooperate", caution: "caution" };
  function eventWeight(e) {
    // Colony events may carry a front-aware weight function (e.g. reads colony state); ship events use a number.
    var w = (typeof e.w === "function") ? e.w() : e.w;
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

  function presentEvent(ev, opts) {
    opts = opts || {};
    var isCol = !!opts.colony;
    // A role-locked choice is only honestly available if that specialist is alive and awake.
    var viable = ev.choices.map(function (ch) { return !ch.role || hasAwakeSpecialist(ch.role); });
    var anyViable = viable.some(Boolean);
    var choices = ev.choices.map(function (ch, i) {
      var noOne = ch.role && !viable[i];
      return {
        // Don't pretend a dead/sleeping specialist will do it. Block the option when there's a
        // real alternative; if it's the ONLY option, leave it as a desperate (penalized) attempt.
        label: ch.label + (ch.role ? "  [" + ch.role + (noOne ? (isCol ? " — none on hand" : " — none aboard") : "") + "]" : ""),
        disabled: noOne && anyViable,
        onClick: function () {
          if (isCol) {
            if (ch.role) resolveColonyCheck(ch.role, ch.diff, ch.success, ch.failure);
            else { applyColonyOutcome(ch.outcome); sfx("select"); }
            closeModal();
            if (opts.done) opts.done();
          } else {
            if (ch.role) resolveCheck(ch.role, ch.diff, ch.success, ch.failure);
            else { applyOutcome(ch.outcome); sfx("select"); }
            closeModal();
            if (!game.ended) { renderTravel(); flashLog(); }
          }
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
      var f = sampleWeighted({ commune: 5, ignored: 4, experiment: 3, annihilate: Math.max(0.2, 0.5 * DIFFICULTY[game.difficulty].harsh) });
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
        // A near-catastrophe — but not an instant, unearned game over. They maul the ship and leave.
        applyOutcome({ hull: -rint(30, 52) });
        var nKill = rint(1, 2);
        for (var ki = 0; ki < nKill; ki++) { var vk = pick(awake()); if (vk) killCrew(vk, "did not survive the encounter"); }
        game.alien.friendly = null; influence({ potential: -8, caution: +4 });
        log("You hold still — and for a heartbeat you are certain it is the end. Then they withdraw, leaving the ship gutted and grieving. You are spared, barely, and will never know why.", "bad"); sfx("bad");
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
        var back = pilotMitigate(rint(8, 20)); game.distance = Math.max(0, game.distance - back);
        log(back > 0 ? "You come out of " + n + " crippled AND lost — flung " + back + " back off course." : "You come out of " + n + " crippled, but the pilot holds your line — no ground lost.", "bad");
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
    var here = wpIndexOf(wp);
    // Contraband 'heat' catches up at the next port — but only checked once per visit.
    if (game._stationFresh && game._heat > 0 && chance(0.5)) {
      var fine = rint(60, 170);
      game.credits = Math.max(0, game.credits - fine);
      game._heat = 0;
      log("Station security flags your manifest — a " + fine + " cr fine for that contraband.", "bad");
    }
    // Deliver a courier crate the moment you reach its destination port (or any later one).
    if (game._stationFresh && game._courier && here >= game._courier.destIdx) {
      var cr = game._courier; game._courier = null;
      if (cr.hot && chance(0.45)) {
        var f = rint(70, 180); game.credits = Math.max(0, game.credits - f); influence({ caution: +2, potential: -2 });
        log("The courier crate trips a customs scan on arrival — it was hotter than you let yourself believe. Seized, and a " + f + " cr fine. No delivery fee.", "bad"); sfx("bad");
      } else {
        game.credits += cr.pay; influence({ persist: +2, cooperate: +2 });
        log("You hand off the sealed crate, intact and on time. The consignee pays in full: +" + cr.pay + " cr, and your hold is your own again.", "good"); sfx("win");
      }
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
        "<div class='panel-title' style='margin-top:8px'>Cargo to sell</div>" +
        (commRows || "<div class='small dim'>Nothing in the hold to sell yet — mine asteroids or take a hauling/courier job, then sell the ore here.</div>"),
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
  // Next station-kind waypoint strictly after idx (for courier deliveries) — or 0 if none.
  function nextStationIdx(idx) {
    for (var i = idx + 1; i < WAYPOINTS.length; i++) if (WAYPOINTS[i].kind === "station") return i;
    return 0;
  }
  // The job pool — a varied, flavored set. Each template: gating (role/zone), pay multiplier, a
  // reward bag, and success/failure narration. genJobs filters by who's awake and where you are,
  // then samples a varying handful so two visits never read the same.
  function genJobs(wpIndex) {
    var df = wpIndex / (WAYPOINTS.length - 1);
    var payBase = Math.round(110 + df * 240);
    var inner = wpIndex <= 3, outer = wpIndex >= 5;
    function awakeRole(r) { return game.crew.some(function (c) { return c.role === r && c.status !== "Dead" && c.status !== "Hibernating"; }); }
    function p(mult) { return Math.round(payBase * mult); }
    var pool = [];
    if (awakeRole("Engineer")) pool.push(
      { id: "repair", w: 5, role: "Engineer", diff: 55, pay: p(1.0), reward: { parts: 1 },
        label: "Overhaul the dock's reactor rigs",
        ok: ["Their reactor sings again — pay, and a spare part pressed into your hand.", "Clean work. The dockmaster rounds up and throws in a part."],
        fail: ["The fix only half-takes; they dock your fee.", "A coupling fights you for a day — partial pay."] },
      { id: "salvage", w: 4, role: "Engineer", diff: 63, pay: p(1.5), reward: { parts: 1, cargo: { type: "rareMetals", amt: 2 } }, risk: "hull",
        label: "Strip a condemned hulk in the breaker yard",
        ok: ["You gut the wreck clean — parts, a little rare alloy, and good money.", "A rich strip; the yard boss waves you back any time."],
        fail: ["A bulkhead lets go — you limp out with a scraped hull and half pay.", "The hulk wasn't as dead as billed. You take a knock for your trouble."] });
    if (awakeRole("Medic")) pool.push(
      { id: "clinic", w: 5, role: "Medic", diff: 52, pay: p(0.9), reward: { medicine: 1 },
        label: "Stand a shift in the station infirmary",
        ok: ["A long shift, but you leave with credits and a restocked kit.", "You patch up half the docks; they pay you in coin and medicine."],
        fail: ["A case goes wrong on your watch; they hold back most of the fee.", "Short-staffed and overrun — little to show for it."] },
      { id: "outbreak", w: outer ? 4 : 1, role: "Medic", diff: 60, pay: p(1.3), reward: { medicine: 2, morale: +3 },
        label: "Contain an outbreak in the outer berths",
        ok: ["You break the chain of infection — they're grateful, and generous.", "The fever burns out under your hand. Word of it lifts your own crew."],
        fail: ["It outruns you; you save who you can and take partial pay.", "Too little, too late in too few hours."] });
    if (awakeRole("Xenobiologist")) pool.push(
      { id: "survey", w: 5, role: "Xenobiologist", diff: 58, pay: p(0.85), reward: { knowledge: 6 },
        label: "Catalogue specimens for the station's archive",
        ok: ["Your notes fill their archive — credits, and you learn the road ahead a little better.", "A good haul of data. The curator pays and asks for more."],
        fail: ["Your samples spoil before cataloguing; partial fee.", "The archive disputes your findings and trims the pay."] },
      { id: "xenodig", w: outer ? 4 : 1, role: "Xenobiologist", diff: 62, pay: p(1.2), reward: { knowledge: 8, cargo: { type: "volatiles", amt: 2 } },
        label: "Lead a dig into the outpost's strange ices",
        ok: ["You read the ice like a book — knowledge, volatiles to sell, and a fat fee.", "The dig pays in coin and in things no one else has seen."],
        fail: ["The seam collapses; you salvage a little data and less money.", "The ice keeps its secrets this time."] });
    if (awakeRole("Pilot")) pool.push(
      { id: "charter", w: 4, role: "Pilot", diff: 56, pay: p(1.2), reward: { morale: +4 },
        label: "Fly a short charter for a paying passenger",
        ok: ["A smooth run for a grateful fare — good credits and a story for the crew.", "Easy flying, easy money. The crew rides high on it."],
        fail: ["You scrape a buoy on approach; the fare halves your tip.", "Rough air, rougher landing. Partial pay."] });
    if (awakeRole("Pilot") || awakeRole("Xenobiologist")) pool.push(
      { id: "smuggle", w: 4, role: awakeRole("Pilot") ? "Pilot" : "Xenobiologist", diff: 60, pay: p(2.0), smuggle: true,
        label: "Run contraband (pays double — or a fine if you're caught)" });
    // Courier: carry sealed cargo to a LATER port for a bigger payout. Uses hold; sometimes hot.
    var destIdx = nextStationIdx(wpIndex);
    if (!game._courier && destIdx && cargoSpace() >= 8) pool.push(
      { id: "courier", w: 5, role: null, diff: 0, pay: p(2.4),
        courier: { destIdx: destIdx, hold: 8, hot: chance(0.4) },
        label: "Courier sealed cargo to " + WAYPOINTS[destIdx].name + " (pays on delivery)" });
    // Always-available fallbacks
    pool.push(
      { id: "haul", w: 3, role: null, diff: 0, pay: p(0.5), label: "Dock labor — modest, but sure pay" },
      { id: "prospect", w: (inner ? 1 : 3), role: null, diff: 0, pay: p(0.6), reward: { cargo: { type: "ore", amt: 3 } },
        label: "Sort tailings at the ore tip (ore + a little coin)" });
    // weighted distinct sample of up to 3
    var picks = [], avail = pool.slice();
    while (picks.length < 3 && avail.length) {
      var tot = avail.reduce(function (s, j) { return s + j.w; }, 0), r = Math.random() * tot, a = 0, k = 0;
      for (; k < avail.length; k++) { a += avail[k].w; if (r <= a) break; }
      picks.push(avail.splice(Math.min(k, avail.length - 1), 1)[0]);
    }
    return picks;
  }
  function openJobs(wp) {
    var idx = wpIndexOf(wp), jobs = genJobs(idx);
    var rows = jobs.map(function (j, i) {
      var tag = j.role ? " <span class='dim'>[" + j.role + "]</span>" : (j.courier ? " <span class='dim'>[deferred]</span>" : " <span class='dim'>[anyone]</span>");
      return "<div class='store-row'><span>" + j.label + tag + "</span>" +
        "<span class='qty'>" + (j.courier ? j.pay + " cr on arrival" : "~" + j.pay + " cr") + "</span><span></span>" +
        "<span><button class='btn small' data-job='" + i + "'>Take</button></span></div>";
    }).join("");
    openModal({
      title: "⚒ Work — " + wp.name,
      body: "<div class='small dim'>What's on offer depends on who's awake and where you are. Work costs a few days. Credits: <span class='paper'>" + game.credits + "</span></div>" + rows,
      choices: [{ label: "Back", onClick: function () { sfx("cancel"); closeModal(); presentStation(wp); } }],
      onBind: function (root) {
        root.querySelectorAll("[data-job]").forEach(function (b) {
          b.addEventListener("click", function () { resolveJob(jobs[+b.getAttribute("data-job")], wp); });
        });
      }
    });
  }
  function applyJobReward(rw) {
    if (!rw) return;
    if (rw.parts && cargoSpace() > 0) game.ship.parts += rw.parts;
    if (rw.medicine) game.supplies.medicine += rw.medicine;
    if (rw.knowledge) influence({ knowledge: rw.knowledge, explore: +2 });
    if (rw.morale) adjustMoraleAll(rw.morale, true);
    if (rw.cargo && cargoSpace() > 0) game.cargo[rw.cargo.type] += Math.min(rw.cargo.amt, cargoSpace());
  }
  function resolveJob(j, wp) {
    closeModal();
    game.day += rint(2, 4);
    // Courier: accept the crate now; payout lands when you reach the destination port.
    if (j.courier) {
      game._courier = { destIdx: j.courier.destIdx, pay: j.pay, hold: j.courier.hold, hot: j.courier.hot };
      influence({ persist: +1, cooperate: +1 });
      log("You take on a sealed courier crate for " + WAYPOINTS[j.courier.destIdx].name + " — " + j.pay + " cr waiting on delivery. It fills " + j.courier.hold + " of your hold" + (j.courier.hot ? ". Something about it makes you not want to ask what's inside." : "."), "info");
      sfx("confirm"); save(); checkEnd();
      if (!game.ended) { if (wp) presentStation(wp); else renderTravel(); }
      return;
    }
    var ok = j.role ? (skillAwake(j.role) + rint(0, 40) >= j.diff) : true;
    if (j.smuggle) {
      if (ok) { game.credits += j.pay; game._heat = (game._heat || 0) + 1; influence({ aggress: +3, caution: -3 }); log("Contraband run pays off: +" + j.pay + " cr. But you're carrying heat now.", "good"); sfx("buy"); }
      else { var loss = rint(40, 120); game.credits = Math.max(0, game.credits - loss); influence({ potential: -3 }); log("The contraband run goes bad — busted for " + loss + " cr and a black mark.", "bad"); sfx("bad"); }
    } else if (ok) {
      game.credits += j.pay;
      applyJobReward(j.reward);
      influence({ persist: +1, cooperate: +1 });
      log((j.ok ? pick(j.ok) : "Honest work done.") + " +" + j.pay + " cr.", "good"); sfx("buy");
    } else {
      var partial = Math.round(j.pay * 0.4);
      game.credits += partial;
      if (j.risk === "hull") { var h = rint(4, 12); game.ship.hull = clamp(game.ship.hull - h, 0, 100); }
      log((j.fail ? pick(j.fail) : "The job goes poorly.") + " Only +" + partial + " cr for the days lost.", "warn"); sfx("select");
    }
    save();
    checkEnd();
    if (!game.ended) { if (wp) presentStation(wp); else renderTravel(); }
  }

  function doRestRepair(wp) {
    var eng = skillAwake("Engineer");
    var repair = Math.round(10 + eng / 5);
    // A skilled Engineer stretches each spare part further — repairs cost fewer parts.
    var partsUsed = Math.min(game.ship.parts, Math.ceil((100 - game.ship.hull) / (14 + eng / 8)));
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
        "<p>The ship flies itself on <b class='paper'>autopilot</b>: you make no decisions, events resolve without your hand (usually badly), and danger mounts every turn. It will run on its own and shake you awake automatically if the ship hits a crisis (failing hull, air, or crew) — or at the moment you choose below.</p>",
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
      case "voyage": renderVoyage(); break;
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
    if (maybeSuccession(game.crew, renderTravel)) return;   // your character fell — command passes first
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
    // Show what's actually in the hold, so mined ore is visible (and obviously sellable at a port).
    var carried = Object.keys(COMMODITIES).filter(function (ck) { return (game.cargo[ck] || 0) > 0; });
    var cargoLine = carried.length
      ? "<div class='small' style='margin-top:4px'>Cargo: " + carried.map(function (ck) { return COMMODITIES[ck].icon + " " + COMMODITIES[ck].name + " ×" + game.cargo[ck]; }).join(" · ") + " <span class='dim'>— sell at a station</span></div>"
      : "";
    if (game._courier) cargoLine += "<div class='small' style='margin-top:2px'>📦 <span class='paper'>Courier crate</span> for " + WAYPOINTS[game._courier.destIdx].name + " <span class='dim'>— " + game._courier.pay + " cr on delivery</span></div>";
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
        "</div>" + powerLine + cargoLine + "</div>" +
        "<div class='col panel'><div class='panel-title'>Crew (" + alive().length + ")</div>" + crewStrip() + "</div>" +
      "</div>";

    var apLabel = (game.autopilotWake && game.autopilotWake.type === "waypoint") ? "▶▶ Run to next waypoint" : "▶▶ Run until emergency";
    var actions = game.autopilot
      ? "<div class='menu row'>" +
          "<button class='btn go' data-action='autorun'>" + apLabel + "</button>" +
          "<button class='btn small' data-action='continue'>▶ One turn</button>" +
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

  function crewStrip(crewArr) {
    var roster = crewArr || game.crew;
    // Only the LIVING are on the roster — the fallen/taken are remembered below it, so the
    // crew list actually shrinks when you lose someone.
    var living = roster.filter(function (c) { return c.status !== "Dead"; });
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
          (c.name === game.youName ? "*" : "") + "</span>" + ageStr + tag + "</span>" +
        "<span>" + mb(c.health) + "<span class='small dim'>hp</span></span>" +
        "<span>" + mb(c.morale, "power") + "<span class='small dim'>mor</span></span>" +
        "<span class='st small s-" + c.status + "'>" + c.status + "</span>" +
        "</div>";
    }).join("");
    var lost = roster.filter(function (c) { return c.status === "Dead" && !c.taken; }).map(function (c) { return c.name; });
    var taken = roster.filter(function (c) { return c.status === "Dead" && c.taken; }).map(function (c) { return c.name; });
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
  // Homeward thrust/rations (set the voyage's own settings; no year cost).
  function openVoyageThrust() {
    var v = game.voyage;
    openModal({ title: "⚙ Drive Thrust (homeward)", body: "<p class='small dim'>More thrust covers ground faster but burns more fuel and power.</p>" +
        Object.keys(THRUST).map(function (k) { var t = THRUST[k]; return "<div class='store-row'><span><b>" + t.label + "</b></span><span class='small dim'>" + t.speed + " dist</span><span class='small dim'>" + t.fuel + " fuel · " + t.power + " pwr</span><span><button class='btn small " + (v.thrust === k ? "go" : "") + "' data-vset='thrust' data-arg='" + k + "'>" + (v.thrust === k ? "ACTIVE" : "Select") + "</button></span></div>"; }).join(""),
      choices: [{ label: "Done", onClick: function () { sfx("confirm"); closeModal(); renderVoyage(); } }],
      onBind: function (root) { root.querySelectorAll("[data-vset]").forEach(function (b) { b.addEventListener("click", function () { v[b.getAttribute("data-vset")] = b.getAttribute("data-arg"); sfx("select"); closeModal(); openVoyageThrust(); }); }); } });
  }
  function openVoyageRations() {
    var v = game.voyage;
    openModal({ title: "🍽 Ration Level (homeward)", body: "<p class='small dim'>Cutting rations saves food but wears down health and morale.</p>" +
        Object.keys(RATIONS).map(function (k) { var r = RATIONS[k]; return "<div class='store-row'><span><b>" + r.label + "</b></span><span class='small dim'>×" + r.mult + " food</span><span class='small dim'>hp " + (r.health >= 0 ? "+" : "") + r.health + " · mor " + (r.morale >= 0 ? "+" : "") + r.morale + "</span><span><button class='btn small " + (v.rations === k ? "go" : "") + "' data-vset='rations' data-arg='" + k + "'>" + (v.rations === k ? "ACTIVE" : "Select") + "</button></span></div>"; }).join(""),
      choices: [{ label: "Done", onClick: function () { sfx("confirm"); closeModal(); renderVoyage(); } }],
      onBind: function (root) { root.querySelectorAll("[data-vset]").forEach(function (b) { b.addEventListener("click", function () { v[b.getAttribute("data-vset")] = b.getAttribute("data-arg"); sfx("select"); closeModal(); openVoyageRations(); }); }); } });
  }

  /* ---- Act II: Colony ---- */
  /* ---- M-INT1b: parallel-fronts legibility layer (presentation only) -----------------------
     Makes the unfocused front legible without touching the engine. captureDigest is READ-ONLY:
     it reads game.log + appends to the transient game._offlog / game._offsnap buffers and writes
     NO front state, so the off-front is byte-identical with vs without capture. offStripLine =
     [2a] one slim headline line; digestBlock = [1c] adaptive digest of the off-tick's OWN log.
     The single canonical clock [3a] is the existing renderColony "Years since exodus" stat,
     repointed to exodusYears() — no new line, no relabel; col.elapsedYears stays computed. */
  function offSnap(front) {                          // read-only headline snapshot for major-detection
    if (front === "colony") {
      var c = game.colony;
      return { alive: c ? colHeads() : 0, stage: c ? c.stage : "", hope: c ? c.meters.hope : 0 };
    }
    var v = game.voyage;
    return { alive: v ? alive(v.crew).length : 0, stage: game.earth ? game.earth.status : "", hope: v ? v.ship.hull : 0 };
  }
  function captureDigest(front, n) {                 // wraps an off-tick CALL SITE; never the tick body
    var slice = game.log.slice(n);                   // the real entries this off-tick just produced
    game._offlog = game._offlog || {};
    var d = game._offlog[front] || { entries: [], major: false };
    var majorNow = slice.some(function (e) { return e.type === "bad" || e.type === "good" || e.type === "sys"; });
    var after = offSnap(front);                       // before/after delta catches a warn-logged death etc.
    game._offsnap = game._offsnap || {};
    var before = game._offsnap[front];
    if (before) {
      if (after.alive < before.alive) majorNow = true;                                                  // a death
      if (after.stage !== before.stage) majorNow = true;                                                // a milestone
      if ((before.hope >= 50) !== (after.hope >= 50) || (after.hope < 20 && before.hope >= 20)) majorNow = true; // hope-band cross
    }
    game._offsnap[front] = after;
    d.entries = d.entries.concat(slice);
    d.major = d.major || majorNow;
    game._offlog[front] = d;
  }
  function offOneLiner(front) {                       // no-major beat: format current stored fields, no re-run
    if (front === "colony") {
      var c = game.colony; if (!c) return "The colony endured while your back was turned.";
      return "The colony held steady — hope " + Math.round(c.meters.hope) + ", year " + c.elapsedYears + ".";
    }
    var v = game.voyage; if (!v) return "The crossing went on without you.";
    return "The crossing pressed on — year " + exodusYears() + ", " + alive(v.crew).length + " aboard.";
  }
  function offStripLine(front) {                      // [2a] one inline .small dim line, stored fields only
    if (front === "colony") {                         // colony headline — shown on the voyage HUD
      if (!(game.colony && !game.colonyDone)) return "";
      var c = game.colony;
      return "<div class='small dim' style='margin-top:6px'>⇄ Colony — hope " + Math.round(c.meters.hope) + " · " + c.stage + " · yr " + c.elapsedYears + "</div>";
    }
    if (!(game.voyage && game.voyage.active && !game.voyageDone)) return "";   // ark headline — shown on the colony HUD
    var v = game.voyage, est = game.earth ? game.earth.status : "live";
    return "<div class='small dim' style='margin-top:6px'>⇄ Ark — " + Math.round(v.distance) + "/" + v.total + " home · " + alive(v.crew).length + " aboard · Earth " + est + "</div>";
  }
  function digestBlock(front) {                       // [1c] surface the off-front's captured log, then clear
    var d = game._offlog && game._offlog[front];
    if (!d || !d.entries || !d.entries.length) return "";
    delete game._offlog[front];                       // show once on this render, then clear
    var head = front === "colony" ? "While you were away — the colony" : "While you were away — the crossing";
    var body = d.major
      ? d.entries.map(function (e) { return "<div class='small'>" + e.msg + "</div>"; }).join("")
      : "<div class='small dim'>" + offOneLiner(front) + "</div>";
    return "<div class='panel'><div class='panel-title'>" + head + "</div>" + body + "</div>";
  }

  function renderColony() {
    if (maybeSuccession(game.crew, renderColony)) return;   // if you fall on the ground, leadership passes
    var col = game.colony, m = col.meters, app = $("#app");
    var p = colPower();
    var lowSurv = COL_SYS.some(function (k) { return col.surv[k] <= 15; });
    setAlert(m.hope < 20 || lowSurv);
    function bar(v, max, kind) { var pct = clamp(Math.round(v / max * 100), 0, 100); return "<div class='bar " + (kind || (pct < 25 ? "crit" : pct < 50 ? "warn" : "ok")) + "'><span style='width:" + pct + "%'></span></div>"; }
    function svRow(k) {
      var v = Math.round(col.surv[k]);
      return "<div><div class='stat'><span class='label'>" + SURV_LABEL[k] + (col.alloc[k] ? "" : " <span class='red small'>OFF</span>") + "</span><span class='val'>" + v + "</span></div>" + bar(col.surv[k], 100) + "</div>";
    }
    function stat(label, val, cls) { return "<div class='stat'><span class='label'>" + label + "</span><span class='val " + (cls || "") + "'>" + val + "</span></div>"; }
    var hud =
      "<div class='panel'><div class='panel-title'>The Colony · Cycle " + col.year + " · " + col.habit + " world · " + col.stage + "</div>" +
        "<div class='stat'><span class='label'>Hope</span><span class='val cyan'>" + Math.round(m.hope) + " / 100</span></div>" + bar(m.hope, 100, "power") +
        "<div class='small dim' style='margin-top:6px'>Survival, not yet a settlement. Air, water, food, warmth and medical care all drain — and there is never enough power and hands to run all five at full. Triage.</div>" +
        offStripLine("ship") +                       // [2a] off-front (the ark) headline
      "</div>" +
      digestBlock("ship") +                          // [1c] what the crossing did while you were here
      "<div class='cols'>" +
        "<div class='col panel'><div class='panel-title'>Life support</div><div class='hud-grid'>" +
          COL_SYS.map(svRow).join("") +
        "</div><div class='small dim' style='margin-top:4px'>Power <b class='" + (p.brownout ? "red" : "paper") + "'>" + p.demand + " / " + p.output + "</b> · hands <b class='paper'>" + p.hands + "</b>" + (p.brownout ? " <span class='red'>⚠ overloaded (" + Math.round(p.factor * 100) + "%)</span>" : "") + "</div></div>" +
        "<div class='col panel'><div class='panel-title'>Settlement</div><div class='hud-grid'>" +
          stat("Colonists", colHeads()) + stat("Materials", Math.round(col.supplies.materials)) +
          stat("Infrastructure", col.infra) + stat("Tech", col.tech || 0) +
          stat("Years since exodus", exodusYears()) +     // [3a] REPOINT: one canonical clock, matches the voyage HUD (col.elapsedYears stays computed for colonyAgeDrift)
          (col.relations != null ? stat("Native stance", Math.round(col.relations), col.relations < 25 ? "red" : "") : stat("Ship home", (col.shipReadiness || 0) + "%")) +
          (col.relations != null ? stat("They", col.nativesGone ? "gone" : (col.nativeTrust >= 75 ? "trust you" : col.nativeTrust >= 25 ? "watch warily" : "hostile"), (col.nativeTrust < 25 && !col.nativesGone) ? "red" : "") : "") +
          (game.dest.inhabited === "settlers" && col.settlerStanding ? stat("Other camp", col.settlerStanding) : "") +
        "</div></div>" +
      "</div>" +
      "<div class='panel'><div class='panel-title'>Crew &amp; colonists</div>" + crewStrip() + "</div>";
    var revealed = (col.sites || []).filter(function (st) { return st.revealed; });
    var hiddenN = (col.sites || []).filter(function (st) { return !st.revealed; }).length;
    var worldRows = revealed.length
      ? revealed.map(function (st) { var a = siteArch(st.id);
          return "<div class='store-row'><span>" + st.icon + " " + st.name + (st.depleted ? " <span class='red small'>worked out</span>" : "") + "</span><span class='small dim'>" + a.kind + "</span><span class='small dim'>" + st.uses + "/" + a.capacity + "</span><span></span></div>"; }).join("")
      : "<div class='small dim'>Nothing mapped yet — Scout to find sites worth an expedition.</div>";
    var strain = (col.ecoHarm || 0) >= 30 ? "<div class='small amber' style='margin-top:4px'>The land feels strained — what you take, it remembers.</div>" : "";
    var stir = col.woke ? "<div class='small red'>Something stirs beyond the perimeter. It knows you are here.</div>" : "";
    var world = "<div class='panel'><div class='panel-title'>Known world · " + revealed.length + "/" + (col.sites || []).length + " mapped" + (hiddenN ? " · " + hiddenN + " unscouted" : "") + "</div>" + worldRows + strain + stir + "</div>";
    var acts = "<div class='menu row'>" +
      "<button class='btn go' data-action='colony' data-arg='secure'>🛡 Secure</button>" +
      "<button class='btn small' data-action='colony' data-arg='work'>👷 Work</button>" +
      "<button class='btn small' data-action='colony' data-arg='build'>🏗 Build</button>" +
      "<button class='btn small' data-action='colony' data-arg='research'>🔬 Research</button>" +
      "<button class='btn small' data-action='colony' data-arg='scout'>🧭 Scout</button>" +
      "<button class='btn small' data-action='colony' data-arg='expedition'>⛏ Expedition</button>" +
      "<button class='btn small' data-action='colony' data-arg='tend'>❤ Tend</button>" +
      "<button class='btn small' data-action='colony' data-arg='refit'>🛠 Refit ship</button>" +
      (col.relations != null && !col.nativesGone ? "<button class='btn small' data-action='colony' data-arg='contact'>🤝 Contact</button>" : "") +
      (col.relations != null && !col.nativesGone ? "<button class='btn small' data-action='colony' data-arg='fortify'>🧱 Fortify</button>" : "") +
      ((col.ecoHarm || 0) > 0 ? "<button class='btn small' data-action='colony' data-arg='restore'>🌱 Restore</button>" : "") +
      (col.footholdReached ? "<button class='btn small' data-action='colony' data-arg='decide'>⚖ The future</button>" : "") +
      "<button class='btn small' data-action='colony' data-arg='hold'>▶ Hold</button>" +
      "<button class='btn small' data-action='colony' data-arg='allocate'>⚡ Power</button>" +
      "</div>";
    var settledBanner = col.settledEligible
      ? "<div class='panel' style='border-color:#33ff66'><div class='small cyan'>★ The colony is thriving — you could call it <b>founded</b>. Open <b class='paper'>⚖ The future</b> to claim this world.</div></div>"
      : "";
    app.innerHTML = hud + world + settledBanner + acts +
      "<div class='small dim'>Each action is a cycle. <b class='paper'>Work</b> gathers materials &amp; food safely · <b class='paper'>Scout</b> reveals the world · <b class='paper'>Expedition</b> sends crew to a site for a bigger haul, at real risk · <b class='paper'>Tend</b> mends spirits and bodies · <b class='paper'>Secure/Build/Research/Refit</b> shape the colony · <b class='paper'>Hold</b> rests. Exploiting sites scars the land.</div>" +
      "<div class='panel-title' style='margin-top:10px'>Colony Log</div><div class='log' id='log'></div>";
    renderLog();
  }

  /* ---- Act II: the long way home ---- */
  // The voyage home — a real turn loop on the homebound ark (its own crew & stores).
  function renderVoyage() {
    var v = game.voyage; if (!v) { renderTitle(); return; }
    if (maybeSuccession(v.crew, renderVoyage)) return;   // if you die on the road home, command passes
    // P3-M2: a fresh launch flies immediately (doLaunch passes fly=true). This branch now only catches a
    // legacy P3-M1-era PARKED save (_flying:false) — offer a one-click "begin the crossing" so it's not stranded.
    if (v._flying === false) {
      var app0 = $("#app");
      var colAlive = game.colony && !game.colonyDone;
      app0.innerHTML =
        "<div class='panel'><div class='panel-title'>The ark is away — the crossing begins</div>" +
          "<div class='small'>The lander has lifted from Proxima with <b class='paper'>" + alive(v.crew).length + "</b> aboard, carrying the maps and the warnings, and is falling outward toward the long dark between the stars.</div>" +
          "<div class='small dim' style='margin-top:8px'>The years of the crossing home are still ahead of them. For now the colony goes on without them" + (colAlive ? " — there is still work on the ground." : ".") + "</div>" +
          "<div class='menu row' style='margin-top:8px'><button class='btn go' data-action='voyage' data-arg='begin'>▶ Begin the crossing</button>" +
          (colAlive ? "<button class='btn small' data-action='focus' data-arg='colony'>⇄ Tend the colony</button>" : "") + "</div>" +
        "</div>" +
        "<div class='panel-title' style='margin-top:10px'>Ship's Log</div><div class='log' id='log'></div>";
      renderLog();
      return;
    }
    var s = v.supplies, p = voyPower();
    setAlert(v.ship.hull < 25 || s.oxygen < 10 || s.fuel <= 0 || p.brownout);
    var app = $("#app");
    var pct = clamp(Math.round(v.distance / v.total * 100), 0, 100);
    function bar(val, max, kind) { var pp = clamp(Math.round(val / max * 100), 0, 100); return "<div class='bar " + (kind || (pp < 20 ? "crit" : pp < 45 ? "warn" : "ok")) + "'><span style='width:" + pp + "%'></span></div>"; }
    function stat(label, val, max, kind) { return "<div><div class='stat'><span class='label'>" + label + "</span><span class='val'>" + val + "</span></div>" + (max ? bar(val, max, kind) : "") + "</div>"; }
    var earthTxt = game.earth && game.earth.status === "silent" ? "<span class='red'>silent</span>" : (game.earth && game.earth.status === "faint" ? "<span class='amber'>faint</span>" : "<span class='cyan'>live</span>");
    var toggle = (game.colony && !game.colonyDone) ? "<button class='btn small' data-action='focus' data-arg='colony'>⇄ Tend the colony</button>" : "";
    var hud =
      "<div class='panel'><div class='panel-title'>The Long Way Home · Year " + exodusYears() + " since exodus</div>" +
        "<div class='track'><span class='ship' style='left:" + pct + "%'>◄</span><span class='dest' style='left:2px;right:auto'>EARTH ⊕</span></div>" +
        "<div class='small dim' style='margin-top:6px'>" + Math.round(v.distance) + " / " + v.total + " home · Signal from Earth: " + earthTxt + "</div>" +
        offStripLine("colony") +                     // [2a] off-front (the colony) headline
      "</div>" +
      digestBlock("colony") +                        // [1c] what the colony did while you were here
      "<div class='cols'>" +
        "<div class='col panel'><div class='panel-title'>Ship</div><div class='hud-grid'>" +
          stat("Fuel", Math.round(s.fuel), 100) + stat("Oxygen", Math.round(s.oxygen), 100) + stat("Food", Math.round(s.food), 100) +
          stat("Medicine", s.medicine, 12) + stat("Hull", v.ship.hull, 100) +
          stat("Years since exodus", exodusYears()) +
          "<div class='stat'><span class='label'>Reactor</span><span class='val " + (p.brownout ? "red" : "cyan") + "'>" + p.demand + " / " + p.output + (p.brownout ? " ⚠" : "") + "</span></div>" +
        "</div><div class='small dim'>Thrust: <b class='paper'>" + THRUST[v.thrust].label + "</b> · Rations: <b class='paper'>" + RATIONS[v.rations].label + "</b></div></div>" +
        "<div class='col panel'><div class='panel-title'>Crew aboard (" + alive(v.crew).length + ")</div>" + crewStrip(v.crew) + "</div>" +
      "</div>";
    var acts = "<div class='menu row'>" +
      "<button class='btn go' data-action='voyage' data-arg='continue'>▶ Continue</button>" +
      "<button class='btn small' data-action='voyage' data-arg='thrust'>⚙ Thrust</button>" +
      "<button class='btn small' data-action='voyage' data-arg='rations'>🍽 Rations</button>" +
      "<button class='btn small' data-action='voyage' data-arg='pods'>❄ Pods</button>" +
      "<button class='btn small' data-action='voyage' data-arg='rest'>🔧 Rest &amp; repair</button>" +
      "<button class='btn small' data-action='voyage' data-arg='scavenge'>🔍 Scavenge</button>" +
      toggle +
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
          if (["travel", "colony", "voyage"].indexOf(game.screen) < 0) game.screen = "travel";
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
      case "colony":
        if (arg === "allocate") openColonyAllocate();
        else if (arg === "expedition") openExpedition();   // player-only modal (sets _pendingExpedition)
        else if (arg === "contact") openContact();         // player-only modal (sets _pendingContact)
        else if (arg === "decide") openFutureDecision();    // P2-M6 future affordance — confirmed in-modal
        else if (arg === "launch") colonyLaunch();   // Game B — intact but dormant in Phase 2
        else colonyTurn(arg, false);   // secure / build / research / tend / refit / scout / restore / fortify / hold — one action per season
        break;
      case "voyage":
        if (arg === "begin") { game.voyage._flying = true; sfx("launch"); save(); renderApp(); }   // P3-M2: un-park a legacy ark
        else if (arg === "continue") voyageStep();
        else if (arg === "thrust") openVoyageThrust();
        else if (arg === "rations") openVoyageRations();
        else if (arg === "pods") voyageHibernate();
        else if (arg === "rest") voyageRest();
        else if (arg === "scavenge") voyageScavenge();
        break;
      case "focus":   // switch which front you're actively running (parallel Act II)
        game.screen = arg; sfx("blip"); renderApp(); break;
      case "autorun": autopilotRun(); break;
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
  // Inert test seam: attaches nothing in production. A harness opts in by setting
  // window.__PROXIMA_TEST__ = true BEFORE this script loads, then drives composeEnding
  // over seeded (colonyDone × voyageDone × beaconHeard) inputs to characterize endings.
  if (typeof window !== "undefined" && window.__PROXIMA_TEST__) {
    window.__proxima = {
      get game() { return game; }, set game(g) { game = g; }, composeEnding: composeEnding,
      // M-INT1b verification seam (inert in production): reach the parallel-fronts layer + constructors.
      newGame: newGame, beginColony: beginColony, startVoyage: startVoyage,
      renderColony: renderColony, renderVoyage: renderVoyage,
      voyageAfterTurn: voyageAfterTurn, colonyAfterTurn: colonyAfterTurn,
      captureDigest: captureDigest, offStripLine: offStripLine, digestBlock: digestBlock,
      exodusYears: exodusYears, alive: alive, colHeads: colHeads
    };
  }

  renderTitle();
  updateTopbar();
})();

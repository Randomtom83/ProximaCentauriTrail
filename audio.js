/* ============================================================
   PROXIMA TRAIL — audio.js
   Tiny Web Audio SFX module. Oscillator-synthesized beeps only,
   no asset files. Honors the "retro SFX only" decision.
   Must be initialized on a user gesture (autoplay policy).
   ============================================================ */
(function (global) {
  "use strict";

  var ctx = null;
  var muted = false;
  var ready = false;

  function init() {
    if (ready) return;
    try {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      ready = true;
    } catch (e) {
      ready = false;
    }
  }

  // One enveloped oscillator note.
  function note(freq, dur, type, gain, startAt, slideTo) {
    if (!ctx || muted) return;
    var t0 = ctx.currentTime + (startAt || 0);
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    var peak = (gain == null ? 0.18 : gain);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, gain) {
    if (!ctx || muted) return;
    var n = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var g = ctx.createGain();
    g.gain.value = gain == null ? 0.12 : gain;
    src.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  // Named sound effects mapped to game events.
  var SFX = {
    blip:    function () { note(660, 0.04, "square", 0.06); },
    select:  function () { note(520, 0.05, "square", 0.10); note(780, 0.05, "square", 0.08, 0.04); },
    confirm: function () { note(523, 0.07, "triangle", 0.14); note(784, 0.10, "triangle", 0.14, 0.06); },
    cancel:  function () { note(300, 0.10, "sawtooth", 0.12, 0, 160); },
    tick:    function () { note(440, 0.03, "square", 0.05); },
    buy:     function () { note(880, 0.05, "square", 0.10); note(1175, 0.06, "square", 0.08, 0.045); },
    good:    function () { note(659, 0.08, "triangle", 0.15); note(988, 0.12, "triangle", 0.15, 0.07); note(1319, 0.14, "triangle", 0.12, 0.15); },
    bad:     function () { note(220, 0.18, "sawtooth", 0.16, 0, 110); noise(0.12, 0.10); },
    warn:    function () { note(740, 0.10, "square", 0.13); note(740, 0.10, "square", 0.13, 0.16); },
    brownout:function () { note(180, 0.45, "sawtooth", 0.18, 0, 70); note(140, 0.45, "square", 0.10, 0.05); },
    death:   function () { note(392, 0.25, "sine", 0.16, 0, 196); note(294, 0.35, "sine", 0.16, 0.22, 147); note(196, 0.6, "sine", 0.14, 0.5, 98); },
    mine:    function () { note(900 + Math.random() * 300, 0.05, "square", 0.10, 0, 500); noise(0.04, 0.06); },
    empty:   function () { note(160, 0.12, "square", 0.12, 0, 120); },
    win:     function () {
      var seq = [523, 659, 784, 1047, 1319];
      for (var i = 0; i < seq.length; i++) note(seq[i], 0.16, "triangle", 0.15, i * 0.13);
    },
    launch:  function () { note(110, 0.9, "sawtooth", 0.18, 0, 440); noise(0.7, 0.10); }
  };

  function play(name) {
    if (!ready || muted) return;
    var fn = SFX[name];
    if (fn) { try { fn(); } catch (e) { /* ignore */ } }
  }

  function setMuted(m) { muted = !!m; }
  function isMuted() { return muted; }

  global.Sound = {
    init: init,
    play: play,
    setMuted: setMuted,
    isMuted: isMuted
  };
})(window);

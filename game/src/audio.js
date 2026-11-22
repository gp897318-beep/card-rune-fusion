// audio.js — tiny WebAudio bleeps generated in code (no audio files).
'use strict';

var AudioFX = (function () {
  var ctx = null;
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function beep(freq, dur, type, vol) {
    if (window.GAME && window.GAME.muted) return;
    if (!ensure()) return;
    var t = ctx.currentTime;
    var o = ctx.createOscillator();
    var gn = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    gn.gain.setValueAtTime(vol || 0.12, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(gn); gn.connect(ctx.destination);
    o.start(t); o.stop(t + dur);
  }
  return {
    play: function () { beep(520, 0.12, 'triangle'); beep(780, 0.14, 'sine', 0.08); },
    fusion: function () { beep(660, 0.1, 'square', 0.07); setTimeout(function () { beep(990, 0.18, 'sine', 0.1); }, 90); },
    hit: function () { beep(180, 0.18, 'sawtooth', 0.09); },
    heal: function () { beep(880, 0.2, 'sine', 0.08); },
    turn: function () { beep(440, 0.1, 'triangle', 0.07); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { beep(f, 0.25, 'triangle', 0.1); }, i * 130); }); },
    lose: function () { [400, 320, 240, 160].forEach(function (f, i) { setTimeout(function () { beep(f, 0.3, 'sawtooth', 0.07); }, i * 150); }); }
  };
})();

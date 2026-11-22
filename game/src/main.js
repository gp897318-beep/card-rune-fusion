// main.js — bootstrap, rival turn runner, autopilot playtest hook for RUNEFUSION.
'use strict';

var FAST = new URLSearchParams(location.search).has('fast');

function delay(ms) {
  return new Promise(function (res) { setTimeout(res, FAST ? 5 : ms); });
}

// Run the rival's whole turn with visible, telegraphed plays.
async function runRivalTurn(g) {
  await delay(500);
  if (g.over) return;
  startRivalTurn(g);
  logLine(g, 'Rival is charging a play…', 'foe');
  renderAll(g);
  await delay(700);
  var plays = rivalChoosePlays(g);
  var shown = [];
  for (var i = 0; i < plays.length; i++) {
    var card = plays[i];
    var idx = g.rival.hand.indexOf(card);
    if (idx < 0) continue;
    var res = playCard(g, g.rival, false, idx);
    if (!res) continue;
    AudioFX.hit();
    shown.push({ label: 'RIVAL PLAYED', card: card, fused: res.fused });
    if (res.damage) floater('−' + res.damage + ' 💥', '', 560, 260);
    renderPlayZone(g, shown);
    renderAll(g);
    if (g.over) break;
    await delay(650);
  }
  if (g.over) { onGameOver(g); return; }
  await delay(400);
  endRivalTurn(g);
  logLine(g, rivalTelegraphText(g), 'sys');
  renderAll(g);
  if (g.over) onGameOver(g);
}

// Autopilot: ?auto=win plays greedily (fusion + wheel first); ?auto=lose passes.
async function autopilot(g, mode) {
  while (!g.over) {
    if (g.phase === 'title') { g.phase = 'player'; startPlayerTurn(g); renderAll(g); }
    if (g.phase === 'player') {
      if (mode === 'win') {
        var played = true;
        while (played && !g.over) {
          played = false;
          // Prefer: fused card, then wheel-counter card, then biggest strike.
          var best = -1, bestScore = -1;
          for (var i = 0; i < g.player.hand.length; i++) {
            var c = g.player.hand[i];
            if (c.cost > g.player.ember) continue;
            var eff = effectiveValue(g, c, true);
            var s = eff.value + (eff.fused ? 8 : 0) + (eff.wheel ? 5 : 0);
            if (c.type === 'mend' && g.player.life > 24) s -= 6;
            if (c.type === 'guard' && g.rival.life < 8) s -= 4;
            if (s > bestScore) { bestScore = s; best = i; }
          }
          if (best >= 0 && bestScore > 0) {
            onCardClick(g, g.player.hand[best].id);
            played = true;
            await delay(60);
          }
        }
      }
      if (!g.over) { onEndTurn(g); }
      await delay(100);
    } else {
      await delay(150);
    }
  }
  window.__gameOver = g.phase;
  window.__autopilotDone = true;
}

function boot() {
  var params = new URLSearchParams(location.search);
  var shot = params.get('shot');
  var game = createGame(20261123);
  window.GAME = game;
  window.__shotReady = false;
  bindInput(game);
  if (shot) {
    setupShot(shot);
    return;
  }
  renderAll(game);
  var auto = params.get('auto');
  if (auto === 'win' || auto === 'lose') {
    game.phase = 'player';
    startPlayerTurn(game);
    renderAll(game);
    autopilot(game, auto);
  }
  window.__shotReady = true;
}

document.addEventListener('DOMContentLoaded', boot);

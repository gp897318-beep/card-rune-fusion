// input.js — click + keyboard input for RUNEFUSION.
'use strict';

var lastPlays = []; // {label, card, fused} shown in the play zone

function onCardClick(g, cardId) {
  if (g.phase !== 'player' || g.over) return;
  var idx = -1;
  for (var i = 0; i < g.player.hand.length; i++) {
    if (g.player.hand[i].id === cardId) { idx = i; break; }
  }
  if (idx < 0) return;
  var card = g.player.hand[idx];
  if (card.cost > g.player.ember) {
    logLine(g, 'Not enough Ember for ' + card.name + ' (' + card.cost + ' needed).', 'sys');
    renderAll(g);
    return;
  }
  var res = playCard(g, g.player, true, idx);
  if (!res) return;
  if (res.fused) AudioFX.fusion(); else if (card.type === 'mend') AudioFX.heal(); else AudioFX.play();
  showFlyingCard(card, res.fused);
  if (res.damage) floater('−' + res.damage + ' 💥', '', 560, 80);
  lastPlays = [{ label: 'YOU PLAYED', card: card, fused: res.fused }];
  renderPlayZone(g, lastPlays);
  renderAll(g);
  if (g.over) { onGameOver(g); }
}

function onEndTurn(g) {
  if (g.phase !== 'player' || g.over) return;
  endPlayerTurn(g);
  AudioFX.turn();
  renderAll(g);
  runRivalTurn(g);
}

function onGameOver(g) {
  renderAll(g);
  if (g.phase === 'won') AudioFX.win(); else if (g.phase === 'lost') AudioFX.lose();
  window.__gameOver = g.phase;
}

function restartGame(seed) {
  lastPlays = [];
  window.GAME = createGame(seed || (Date.now() % 100000));
  window.GAME.phase = 'player';
  startPlayerTurn(window.GAME);
  logLine(window.GAME, 'A new duel begins. Fuse runes, counter the Rival!', 'sys');
  renderAll(window.GAME);
  return window.GAME;
}

function bindInput(g) {
  document.getElementById('begin-btn').addEventListener('click', function () {
    AudioFX.play();
    g.phase = 'player';
    startPlayerTurn(g);
    renderAll(g);
  });
  document.getElementById('end-turn-btn').addEventListener('click', function () { onEndTurn(window.GAME); });
  document.getElementById('mute-btn').addEventListener('click', function () {
    window.GAME.muted = !window.GAME.muted;
    this.textContent = window.GAME.muted ? '🔇 Muted' : '🔊 Sound';
  });
  document.querySelectorAll('[data-restart]').forEach(function (btn) {
    btn.addEventListener('click', function () { restartGame(); });
  });
  document.addEventListener('keydown', function (e) {
    var game = window.GAME;
    if (!game) return;
    if (e.key >= '1' && e.key <= '7') {
      var idx = parseInt(e.key, 10) - 1;
      if (game.player.hand[idx]) onCardClick(game, game.player.hand[idx].id);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (game.phase === 'title') {
        game.phase = 'player'; startPlayerTurn(game); renderAll(game);
      } else onEndTurn(game);
    } else if (e.key === 'r' || e.key === 'R') {
      restartGame();
    } else if (e.key === 'm' || e.key === 'M') {
      game.muted = !game.muted;
      document.getElementById('mute-btn').textContent = game.muted ? '🔇 Muted' : '🔊 Sound';
    }
  });
}

// shots.js — deterministic ?shot= scene setups for the 4 screenshots.
'use strict';

function findCard(g, element, type) {
  for (var i = 0; i < g.player.hand.length; i++) {
    if (g.player.hand[i].element === element && g.player.hand[i].type === type) return g.player.hand[i];
  }
  return null;
}

function setupShot(scene) {
  var g = createGame(424242);
  g.phase = 'player';
  window.GAME = g;
  lastPlays = [];

  if (scene === 'title') {
    g.phase = 'title';
    renderAll(g);
    window.__shotReady = true;
    return;
  }

  if (scene === 'win') {
    g.phase = 'won';
    g.rival.life = 0;
    g.player.life = 18;
    g.turn = 9;
    g.stats = { damageDealt: 34, damageTaken: 12, cardsPlayed: 21, fusions: 5, turns: 9 };
    g.over = true;
    renderAll(g);
    window.__shotReady = true;
    return;
  }

  if (scene === 'loss') {
    g.phase = 'lost';
    g.player.life = 0;
    g.rival.life = 11;
    g.turn = 8;
    g.stats = { damageDealt: 19, damageTaken: 30, cardsPlayed: 16, fusions: 2, turns: 8 };
    g.over = true;
    renderAll(g);
    window.__shotReady = true;
    return;
  }

  // cover: a dramatic mid-duel moment, fully deterministic.
  g.turn = 6;
  g.player.life = 24;
  g.rival.life = 7;
  g.player.ember = 6;
  g.rival.ember = 3;
  g.rivalNextElement = 'gale'; // Rival gathering Gale — Ember counters it (+3)
  g.player.playedThisTurn = ['ember'];
  // Fixed hand: Ember Nova (trick) + Cinder Slash fused pair, plus support cards.
  var hand = [];
  hand.push(makeCard('s1', 'ember', 'trick', 7, 3));
  hand.push(makeCard('s2', 'ember', 'strike', 6, 2));
  hand.push(makeCard('s3', 'tide', 'strike', 5, 2));
  hand.push(makeCard('s4', 'stone', 'guard', 6, 2));
  hand.push(makeCard('s5', 'gale', 'mend', 4, 1));
  g.player.hand = hand;
  g.player.deck = buildDeck().slice(0, 18);
  g.player.discard = buildDeck().slice(0, 4);
  g.rival.hand = buildDeck().slice(0, 5);
  g.rival.deck = buildDeck().slice(0, 20);
  g.log = [
    { text: '⚡ FUSION! Two Ember cards — Cinder Slash doubles to 12!', cls: 'you' },
    { text: 'You played Cinder Slash (🔥) for 12 damage.', cls: 'you' },
    { text: 'Rival is gathering Gale 🌀 — counter it with Ember 🔥 for +3!', cls: 'sys' },
    { text: 'Rival played Wave Crash for 5 damage.', cls: 'foe' },
    { text: '— Turn 6: you draw 2, gain 1 Ember. —', cls: 'sys' }
  ];
  g.stats = { damageDealt: 23, damageTaken: 6, cardsPlayed: 11, fusions: 3, turns: 6 };
  renderAll(g);
  // The moment: Ember Nova mid-flight, damage numbers flying, rival low.
  lastPlays = [{ label: 'YOU PLAYED — FUSION ×2', card: hand[0], fused: true }];
  renderPlayZone(g, lastPlays);
  document.getElementById('callouts').classList.remove('hidden');
  floater('−12 💥', '', 600, 20);
  floater('🔥 BURN 2', 'bonus', 150, 120);
  renderAll(g);
  window.__shotReady = true;
}

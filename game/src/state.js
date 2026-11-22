// state.js — game state, turn flow, fusion + element-wheel rules for RUNEFUSION.
'use strict';

var MAX_LIFE = 30;
var MAX_EMBER = 10;
var HAND_LIMIT = 7;

function makeSide(deck) {
  return { life: MAX_LIFE, ember: 1, block: 0, burn: 0, deck: deck.slice(),
           hand: [], discard: [], playedThisTurn: [] };
}

function createGame(seed) {
  var g = {
    seed: seed || 20261123,
    turn: 1,
    phase: 'title', // title | player | rival | won | lost
    player: makeSide(shuffleDeck(buildDeck(), (seed || 20261123))),
    rival: makeSide(shuffleDeck(buildDeck(), (seed || 20261123) + 777)),
    rivalNextElement: 'tide',
    rivalNextCard: null,
    log: [],
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, fusions: 0, turns: 0 },
    muted: false,
    over: false
  };
  drawCards(g.player, 4);
  drawCards(g.rival, 4);
  g.rivalNextElement = pickTelegraphElement(g);
  return g;
}

function pickTelegraphElement(g) {
  // The rival's next element: drawn from its hand if possible, else random-ish.
  if (g.rival.hand.length) {
    return g.rival.hand[Math.floor(Math.random() * g.rival.hand.length)].element;
  }
  return ELEMENT_KEYS[Math.floor(Math.random() * 4)];
}

function drawCards(side, n) {
  for (var i = 0; i < n; i++) {
    if (side.hand.length >= HAND_LIMIT) break;
    if (!side.deck.length) {
      if (!side.discard.length) break;
      side.deck = shuffleDeck(side.discard, Date.now() % 100000);
      side.discard = [];
    }
    side.hand.push(side.deck.pop());
  }
}

function logLine(g, text, cls) {
  g.log.unshift({ text: text, cls: cls || 'sys' });
  if (g.log.length > 14) g.log.length = 14;
}

// Effective value of a card: wheel +3, then fusion doubles.
function effectiveValue(g, card, isPlayer) {
  var v = card.value;
  var wheel = false;
  if (isPlayer && elementBeats(card.element, g.rivalNextElement)) { v += 3; wheel = true; }
  var fused = false;
  if (isPlayer && g.player.playedThisTurn.indexOf(card.element) !== -1) fused = true;
  if (!isPlayer && g.rival.playedThisTurn.indexOf(card.element) !== -1) fused = true;
  if (fused) v *= 2;
  return { value: v, fused: fused, wheel: wheel };
}

function applyFusionBonus(g, card, isPlayer) {
  var el = ELEMENTS[card.element];
  var foe = isPlayer ? g.rival : g.player;
  var me = isPlayer ? g.player : g.rival;
  if (card.element === 'ember') { foe.burn += 2; logLine(g, '🔥 Burn: ' + (isPlayer ? 'Rival' : 'You') + ' takes 2 next turn.', 'sys'); }
  else if (card.element === 'tide') { drawCards(me, 1); logLine(g, '💧 Fusion: ' + (isPlayer ? 'you draw' : 'Rival draws') + ' 1 card.', 'sys'); }
  else if (card.element === 'stone') { me.block += 3; logLine(g, '⛰️ Fusion: +3 Block.', 'sys'); }
  else if (card.element === 'gale') { foe.ember = Math.max(0, foe.ember - 1); logLine(g, '🌀 Fusion: ' + (isPlayer ? 'Rival' : 'you') + ' lose 1 Ember.', 'sys'); }
  return el;
}

function dealDamage(g, target, amount, isPlayerAttacker) {
  var absorbed = Math.min(target.block, amount);
  target.block -= absorbed;
  var real = amount - absorbed;
  target.life = Math.max(0, target.life - real);
  if (isPlayerAttacker) g.stats.damageDealt += real;
  else g.stats.damageTaken += real;
  return { real: real, absorbed: absorbed };
}

function playCard(g, side, isPlayer, handIndex) {
  var card = side.hand[handIndex];
  if (!card || side.ember < card.cost || g.over) return null;
  var eff = effectiveValue(g, card, isPlayer);
  side.ember -= card.cost;
  side.hand.splice(handIndex, 1);
  side.discard.push(card);
  side.playedThisTurn.push(card.element);
  if (isPlayer) g.stats.cardsPlayed++;
  if (eff.fused) g.stats.fusions++;
  var who = isPlayer ? 'You' : 'Rival';
  var cls = isPlayer ? 'you' : 'foe';
  var foe = isPlayer ? g.rival : g.player;
  var me = isPlayer ? g.player : g.rival;
  var tag = (eff.fused ? '⚡ FUSION ' : '') + (eff.wheel ? '🎯 Wheel +3 ' : '');
  var result = { card: card, fused: eff.fused, wheel: eff.wheel, value: eff.value };
  if (card.type === 'strike' || card.type === 'trick') {
    var d = dealDamage(g, foe, eff.value, isPlayer);
    logLine(g, tag + who + ' played ' + card.name + ' (' + card.icon + ') for ' + eff.value + ' damage' + (d.absorbed ? ' (' + d.absorbed + ' blocked)' : '') + '.', cls);
    result.damage = d.real;
    if (card.type === 'trick') applyFusionBonus(g, card, isPlayer);
  } else if (card.type === 'guard') {
    me.block += eff.value;
    logLine(g, tag + who + ' played ' + card.name + ' — +' + eff.value + ' Block.', cls);
  } else if (card.type === 'mend') {
    me.life = Math.min(MAX_LIFE, me.life + eff.value);
    logLine(g, tag + who + ' played ' + card.name + ' — healed ' + eff.value + ' Life.', cls);
  } else if (card.type === 'draw') {
    drawCards(me, eff.value);
    logLine(g, tag + who + ' played ' + card.name + ' — drew ' + eff.value + ' card' + (eff.value > 1 ? 's' : '') + '.', cls);
  }
  if (eff.fused && card.type !== 'trick') applyFusionBonus(g, card, isPlayer);
  if (eff.fused) logLine(g, '⚡ FUSION! Two ' + ELEMENTS[card.element].name + ' cards — second one doubled!', 'sys');
  checkEnd(g);
  return result;
}

function startPlayerTurn(g) {
  g.phase = 'player';
  g.stats.turns = g.turn;
  var me = g.player;
  me.playedThisTurn = [];
  me.block = 0; // block fades at your next turn
  if (me.burn > 0) {
    me.life = Math.max(0, me.life - me.burn);
    logLine(g, '🔥 Burn hits you for ' + me.burn + '.', 'foe');
    me.burn = 0;
    g.stats.damageTaken += 0;
  }
  me.ember = Math.min(MAX_EMBER, me.ember + 1);
  drawCards(me, 2);
  logLine(g, '— Turn ' + g.turn + ': you draw 2, gain 1 Ember. —', 'sys');
  checkEnd(g);
}

function endPlayerTurn(g) {
  if (g.phase !== 'player' || g.over) return;
  g.phase = 'rival';
  logLine(g, 'You end your turn. The Rival stirs…', 'sys');
}

function startRivalTurn(g) {
  var r = g.rival;
  r.playedThisTurn = [];
  r.block = 0;
  if (r.burn > 0) {
    r.life = Math.max(0, r.life - r.burn);
    logLine(g, '🔥 Burn hits the Rival for ' + r.burn + '.', 'you');
    r.burn = 0;
  }
  r.ember = Math.min(MAX_EMBER, r.ember + 1);
  drawCards(r, 2);
}

function endRivalTurn(g) {
  g.turn++;
  g.rivalNextElement = pickTelegraphElement(g);
  startPlayerTurn(g);
}

function checkEnd(g) {
  if (g.over) return;
  if (g.rival.life <= 0) { g.over = true; g.phase = 'won'; }
  else if (g.player.life <= 0) { g.over = true; g.phase = 'lost'; }
}

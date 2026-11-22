// cards.js — deck + card definitions for RUNEFUSION (elemental fusion duel).
// Four elements, each a colour + shape. Five card types. All names invented here.
'use strict';

var ELEMENTS = {
  ember: { key: 'ember', name: 'Ember', icon: '🔥', color: '#ef4444', beats: 'gale',
           fusionBonus: 'Burn 2 next turn', fusionText: 'Burn 2' },
  tide:  { key: 'tide',  name: 'Tide',  icon: '💧', color: '#3b82f6', beats: 'ember',
           fusionBonus: 'Draw 1 card', fusionText: 'Draw 1' },
  stone: { key: 'stone', name: 'Stone', icon: '⛰️', color: '#a16207', beats: 'tide',
           fusionBonus: 'Gain 3 Block', fusionText: '+3 Block' },
  gale:  { key: 'gale',  name: 'Gale',  icon: '🌀', color: '#22c55e', beats: 'stone',
           fusionBonus: 'Rival loses 1 Ember', fusionText: 'Foe −1 Ember' }
};
var ELEMENT_KEYS = ['ember', 'tide', 'stone', 'gale'];

var TYPES = {
  strike: { key: 'strike', name: 'Strike', icon: '⚔️', verb: 'deals' },
  guard:  { key: 'guard',  name: 'Guard',  icon: '🛡️', verb: 'gains' },
  mend:   { key: 'mend',   name: 'Mend',   icon: '✚',  verb: 'heals' },
  draw:   { key: 'draw',   name: 'Draw',   icon: '↻',  verb: 'draws' },
  trick:  { key: 'trick',  name: 'Trick',  icon: '✦',  verb: 'bursts' }
};

// Invented card names per element, one per type.
var CARD_NAMES = {
  ember: { strike: 'Cinder Slash', guard: 'Ashen Wall', mend: 'Hearth Warmth', draw: 'Spark Search', trick: 'Ember Nova' },
  tide:  { strike: 'Wave Crash',   guard: 'Tidal Wall', mend: 'Spring Renewal', draw: 'Current Pull', trick: 'Maelstrom' },
  stone: { strike: 'Boulder Slam', guard: 'Granite Guard', mend: 'Moss Mend',   draw: 'Quarry Delve', trick: 'Avalanche' },
  gale:  { strike: 'Cyclone Cut',  guard: 'Wind Veil',  mend: 'Breeze Balm',    draw: 'Draft Chase',  trick: 'Tempest' }
};

function makeCard(id, element, type, value, cost) {
  var el = ELEMENTS[element];
  var tp = TYPES[type];
  var rule;
  if (type === 'strike') rule = 'Deal ' + value + ' damage to the Rival.';
  else if (type === 'guard') rule = 'Gain ' + value + ' Block.';
  else if (type === 'mend') rule = 'Restore ' + value + ' Life.';
  else if (type === 'draw') rule = 'Draw ' + value + (value > 1 ? ' cards.' : ' card.');
  else rule = 'Rune Burst: deal ' + value + ' damage + ' + el.fusionText.toLowerCase() + '.';
  return { id: id, element: element, type: type, value: value, cost: cost,
           name: CARD_NAMES[element][type], icon: el.icon, typeIcon: tp.icon,
           rule: rule, fused: false, wheelBonus: false };
}

// 30-card deck: every element gets strikes, guards, mends, draws and tricks.
function buildDeck() {
  var defs = [
    ['ember', 'strike', 6, 2], ['ember', 'strike', 5, 2], ['ember', 'strike', 8, 3],
    ['ember', 'guard', 5, 2], ['ember', 'mend', 5, 2], ['ember', 'draw', 1, 1],
    ['ember', 'trick', 7, 3],
    ['tide', 'strike', 5, 2], ['tide', 'strike', 7, 3], ['tide', 'guard', 6, 2],
    ['tide', 'guard', 4, 1], ['tide', 'mend', 6, 2], ['tide', 'draw', 2, 2],
    ['tide', 'trick', 6, 3],
    ['stone', 'strike', 7, 3], ['stone', 'strike', 4, 1], ['stone', 'guard', 7, 3],
    ['stone', 'guard', 5, 2], ['stone', 'mend', 7, 3], ['stone', 'draw', 1, 1],
    ['stone', 'trick', 8, 4],
    ['gale', 'strike', 6, 2], ['gale', 'strike', 5, 2], ['gale', 'guard', 4, 1],
    ['gale', 'mend', 4, 1], ['gale', 'draw', 2, 2], ['gale', 'trick', 5, 2],
    ['ember', 'strike', 4, 1], ['tide', 'mend', 8, 3]
  ];
  var deck = [];
  for (var i = 0; i < defs.length; i++) {
    deck.push(makeCard('c' + i, defs[i][0], defs[i][1], defs[i][2], defs[i][3]));
  }
  return deck; // 30 cards
}

// Deterministic shuffle (mulberry32) so shot scenes and tests are repeatable.
function shuffleDeck(deck, seed) {
  var s = seed >>> 0;
  function rnd() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  for (var i = deck.length - 1; i > 0; i--) {
    var j = Math.floor(rnd() * (i + 1));
    var tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
  }
  return deck;
}

function elementBeats(a, b) { return ELEMENTS[a].beats === b; }

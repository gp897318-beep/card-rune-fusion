// ai.js — rival logic: readable, telegraphed plays for RUNEFUSION.
'use strict';

// Score a card for the rival in the current position; higher = play sooner.
function scoreRivalCard(g, card, idx) {
  var score = 0;
  var eff = effectiveValue(g, card, false);
  if (card.type === 'strike' || card.type === 'trick') {
    score = 10 + eff.value;
    if (g.player.life <= eff.value + 3) score += 40; // smell the kill
    if (eff.fused) score += 12; // rival likes fusions too
  } else if (card.type === 'guard') {
    score = g.rival.life <= 12 ? 22 + eff.value : 4 + eff.value;
  } else if (card.type === 'mend') {
    score = g.rival.life <= 18 ? 18 + eff.value : 2;
  } else if (card.type === 'draw') {
    score = g.rival.hand.length <= 3 ? 14 : 3;
  }
  // Prefer the element that beats what the player just showed.
  return score;
}

// Pick the rival's plays for this turn (in order), respecting Ember.
function rivalChoosePlays(g) {
  var ember = g.rival.ember;
  var plays = [];
  var hand = g.rival.hand.slice();
  var playedElements = [];
  var guard = false;
  while (true) {
    var best = -1, bestScore = -1;
    for (var i = 0; i < hand.length; i++) {
      var c = hand[i];
      if (c.cost > ember) continue;
      var s = scoreRivalCard(g, c, i);
      // Fusion lure: a second card of an element already chosen scores more.
      if (playedElements.indexOf(c.element) !== -1) s += 12;
      if (s > bestScore) { bestScore = s; best = i; }
    }
    if (best < 0 || bestScore < 5) break;
    var card = hand[best];
    plays.push(card);
    ember -= card.cost;
    playedElements.push(card.element);
    hand.splice(best, 1);
    if (plays.length >= 3) break;
    if (card.type === 'guard') guard = true;
  }
  return plays;
}

// The telegraph: the rival shows the element it will gather next turn.
// Counter element = the one whose "beats" is the gathered element.
function rivalCounterElement(gathered) {
  for (var i = 0; i < ELEMENT_KEYS.length; i++) {
    if (ELEMENTS[ELEMENT_KEYS[i]].beats === gathered) return ELEMENT_KEYS[i];
  }
  return 'ember';
}
function rivalTelegraphText(g) {
  var el = ELEMENTS[g.rivalNextElement];
  var counter = ELEMENTS[rivalCounterElement(g.rivalNextElement)];
  return 'Rival is gathering ' + el.name + ' ' + el.icon + ' — counter it with ' +
    counter.name + ' ' + counter.icon + ' for +3!';
}

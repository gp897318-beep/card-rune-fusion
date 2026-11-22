// render.js — DOM rendering, HUD, legend, callouts, screens for RUNEFUSION.
'use strict';

var $ = function (id) { return document.getElementById(id); };

function cardEl(card, opts) {
  opts = opts || {};
  var d = document.createElement('div');
  d.className = 'card el-' + card.element + (opts.small ? ' small' : '') +
    (opts.fused ? ' fused-glow' : '') + (opts.unaffordable ? ' unaffordable' : '');
  d.dataset.cardId = card.id;
  var effNote = '';
  if (opts.preview) {
    var p = opts.preview;
    if (p.fused || p.wheel) effNote = '<div class="fusion-badge">' +
      (p.fused ? '⚡ ×2 ' : '') + (p.wheel ? '+3 ' : '') + '= ' + p.value + '</div>';
  }
  d.innerHTML =
    '<div class="cost">' + card.cost + '</div>' +
    '<div class="el-tag">' + ELEMENTS[card.element].name.toUpperCase() + '</div>' +
    '<div class="el-ico">' + card.icon + '</div>' +
    '<div class="value">' + (opts.preview ? opts.preview.value : card.value) + '</div>' +
    '<div class="cname">' + card.name + '</div>' +
    '<div class="ctype">' + card.typeIcon + ' ' + TYPES[card.type].name.toUpperCase() + '</div>' +
    '<div class="rule">' + card.rule + '</div>' + effNote;
  return d;
}

function faceDownEl() {
  var d = document.createElement('div');
  d.className = 'card face-down small';
  d.textContent = '✦';
  return d;
}

function renderAll(g) {
  // Screens
  $('title-screen').classList.toggle('hidden', g.phase !== 'title');
  $('table-screen').classList.toggle('hidden', g.phase === 'title' || g.phase === 'won' || g.phase === 'lost');
  $('win-screen').classList.toggle('hidden', g.phase !== 'won');
  $('loss-screen').classList.toggle('hidden', g.phase !== 'lost');
  if (g.phase === 'won') renderEndStats(g, 'win-stats');
  if (g.phase === 'lost') renderEndStats(g, 'loss-stats');
  if (g.phase === 'title') return;

  // Top bar + life
  $('turn-num').textContent = g.turn;
  $('you-life').textContent = g.player.life;
  $('rival-life').textContent = g.rival.life;
  $('you-life').parentElement.classList.toggle('low', g.player.life <= 10);
  $('rival-life').parentElement.classList.toggle('low', g.rival.life <= 10);

  // Hands
  var yh = $('you-hand'); yh.innerHTML = '';
  g.player.hand.forEach(function (card) {
    var preview = g.phase === 'player' ? effectiveValue(g, card, true) : null;
    var el = cardEl(card, { preview: preview, fused: preview && preview.fused,
      unaffordable: g.phase !== 'player' || card.cost > g.player.ember });
    el.addEventListener('click', function () { onCardClick(g, card.id); });
    yh.appendChild(el);
  });
  var rh = $('rival-hand'); rh.innerHTML = '';
  var shown = Math.min(g.rival.hand.length, 7);
  for (var i = 0; i < shown; i++) rh.appendChild(faceDownEl());
  if (g.rival.hand.length > 7) {
    var more = document.createElement('div');
    more.className = 'card face-down small'; more.textContent = '+' + (g.rival.hand.length - 7);
    rh.appendChild(more);
  }

  // Status lines
  $('you-block').textContent = '🛡️ Block ' + g.player.block;
  $('you-ember').textContent = '◆ Ember ' + g.player.ember + '/' + MAX_EMBER;
  $('you-deck').textContent = 'Deck ' + g.player.deck.length + ' · Discard ' + g.player.discard.length;
  $('rival-block').textContent = '🛡️ Block ' + g.rival.block;
  $('rival-ember').textContent = '◆ Ember ' + g.rival.ember + '/' + MAX_EMBER;
  $('rival-deck').textContent = 'Deck ' + g.rival.deck.length + ' · Discard ' + g.rival.discard.length +
    ' · Hand ' + g.rival.hand.length;

  // Telegraph
  var tel = $('telegraph');
  tel.innerHTML = rivalTelegraphText(g);
  tel.style.display = g.phase === 'player' ? '' : 'none';

  // Log
  var lg = $('log'); lg.innerHTML = '';
  g.log.forEach(function (entry) {
    var div = document.createElement('div');
    div.className = entry.cls;
    div.textContent = entry.text;
    lg.appendChild(div);
  });

  // Fusion chips: elements played this turn
  var fc = $('fusion-chips'); fc.innerHTML = '';
  if (!g.player.playedThisTurn.length) {
    fc.innerHTML = '<span style="color:#c4b5fd;font-size:13px">None yet — play two of one element!</span>';
  } else {
    g.player.playedThisTurn.forEach(function (ek) {
      var chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = ELEMENTS[ek].icon + ' ' + ELEMENTS[ek].name;
      fc.appendChild(chip);
    });
    var counts = {};
    g.player.playedThisTurn.forEach(function (ek) { counts[ek] = (counts[ek] || 0) + 1; });
    Object.keys(counts).forEach(function (ek) {
      if (counts[ek] >= 2) {
        var f = document.createElement('span');
        f.className = 'chip fused'; f.textContent = '⚡ FUSED ' + ELEMENTS[ek].name;
        fc.appendChild(f);
      }
    });
  }

  // End turn button
  $('end-turn-btn').disabled = g.phase !== 'player';
  $('end-turn-btn').style.opacity = g.phase === 'player' ? '1' : '0.5';
}

function renderEndStats(g, id) {
  var el = $(id);
  el.innerHTML = 'Turns played: <b>' + g.stats.turns + '</b><br>' +
    'Damage dealt: <b>' + g.stats.damageDealt + '</b> &nbsp;·&nbsp; Damage taken: <b>' + g.stats.damageTaken + '</b><br>' +
    'Cards played: <b>' + g.stats.cardsPlayed + '</b> &nbsp;·&nbsp; Fusions: <b>' + g.stats.fusions + '</b><br>' +
    'Your Life: <b>' + g.player.life + '</b> &nbsp;·&nbsp; Rival Life: <b>' + g.rival.life + '</b>';
}

// Floating damage / heal numbers over the table.
function floater(text, cls, x, y) {
  var f = document.createElement('div');
  f.className = 'floater ' + (cls || '');
  f.textContent = text;
  var zone = $('mid-field');
  f.style.left = (x || (zone.offsetWidth / 2 + (Math.random() * 120 - 60))) + 'px';
  f.style.top = (y || 60) + 'px';
  $('floaters').appendChild(f);
  setTimeout(function () { f.remove(); }, 1500);
}

// Show the last played cards in the middle of the table.
function renderPlayZone(g, lastPlays) {
  var pz = $('play-zone'); pz.innerHTML = '';
  (lastPlays || []).forEach(function (item) {
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="played-label">' + item.label + '</div>';
    wrap.appendChild(cardEl(item.card, { small: true, fused: item.fused }));
    pz.appendChild(wrap);
  });
}

function showFlyingCard(card, fused) {
  var fc = $('flying-card');
  fc.innerHTML = '';
  fc.appendChild(cardEl(card, { fused: fused }));
  fc.classList.remove('hidden');
  fc.style.left = '520px'; fc.style.top = '330px';
  requestAnimationFrame(function () {
    fc.style.left = '520px'; fc.style.top = '60px';
  });
  setTimeout(function () { fc.classList.add('hidden'); }, 800);
}

// render.js — draws every screen of Ember & Tide on one canvas.
//
// The table is a fixed 1280 x 720 stage, scaled to the window. Suits are
// told apart by colour AND by a drawn shape (flame, wave, leaf, stone),
// never by text alone, so a card stays readable at thumbnail size.

import { SUITS } from './deck.js';
import { INTENTS } from './ai.js';

export const STAGE_W = 1280;
export const STAGE_H = 720;
export const CARD_W = 148;
export const CARD_H = 204;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draw one suit's mark at (cx, cy) with radius r, in its suit colour.
export function drawSuitMark(ctx, suit, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color || SUITS[suit].color;
  ctx.strokeStyle = color || SUITS[suit].color;
  ctx.lineWidth = r * 0.22;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (suit === 'ember') {
    // A flame: outer teardrop, inner flick.
    ctx.moveTo(cx, cy - r);
    ctx.bezierCurveTo(cx + r * 0.9, cy - r * 0.2, cx + r * 0.7, cy + r * 0.7, cx, cy + r * 0.8);
    ctx.bezierCurveTo(cx - r * 0.7, cy + r * 0.7, cx - r * 0.9, cy - r * 0.2, cx, cy - r);
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.1);
    ctx.bezierCurveTo(cx + r * 0.4, cy + r * 0.3, cx + r * 0.3, cy + r * 0.7, cx, cy + r * 0.7);
    ctx.bezierCurveTo(cx - r * 0.3, cy + r * 0.7, cx - r * 0.4, cy + r * 0.3, cx, cy - r * 0.1);
    ctx.fill();
  } else if (suit === 'tide') {
    // Three stacked waves.
    for (let i = -1; i <= 1; i++) {
      const y = cy + i * r * 0.55;
      ctx.beginPath();
      ctx.moveTo(cx - r, y);
      ctx.quadraticCurveTo(cx - r * 0.5, y - r * 0.45, cx, y);
      ctx.quadraticCurveTo(cx + r * 0.5, y + r * 0.45, cx + r, y);
      ctx.stroke();
    }
  } else if (suit === 'grove') {
    // A leaf with a centre vein.
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx + r, cy - r * 0.2, cx, cy + r);
    ctx.quadraticCurveTo(cx - r, cy - r * 0.2, cx, cy - r);
    ctx.fill();
    ctx.strokeStyle = '#e9f7ec';
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.7);
    ctx.lineTo(cx, cy + r * 0.7);
    ctx.stroke();
  } else {
    // A cut stone: a hexagon with a facet line.
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#efe9df';
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy - r * 0.2);
    ctx.lineTo(cx + r * 0.5, cy - r * 0.2);
    ctx.lineTo(cx, cy + r * 0.5);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawCardFace(ctx, card, x, y, w, h, opts) {
  const suit = SUITS[card.suit];
  const playable = !opts || opts.playable !== false;
  const hovered = opts && opts.hovered;
  const selected = opts && opts.selected;
  ctx.save();
  if (hovered) { ctx.translate(0, -12); }
  if (selected) { ctx.translate(0, -22); }
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = selected ? 22 : 12;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = playable ? '#fdf6e3' : '#d8d2c2';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = selected ? 5 : 2.5;
  ctx.strokeStyle = selected ? '#ffd23e' : suit.dark;
  ctx.stroke();
  // Suit band at the top.
  roundRect(ctx, x, y, w, 44, 14);
  ctx.fillStyle = suit.color;
  ctx.fill();
  ctx.fillRect(x, y + 30, w, 14);
  // Cost gem, top left.
  ctx.beginPath();
  ctx.arc(x + 24, y + 22, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#1d3557';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffd23e';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(card.cost), x + 24, y + 23);
  // Suit name, top right of the band.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(suit.label.toUpperCase(), x + w - 12, y + 23);
  // Big suit mark in the middle.
  drawSuitMark(ctx, card.suit, x + w / 2, y + 92, 30);
  // Card name.
  ctx.fillStyle = '#22201c';
  ctx.font = 'bold 19px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(card.name, x + w / 2, y + 138);
  // Values line: damage / shield / heal / draw, each with its own mark.
  const values = [];
  if (card.damage > 0) values.push({ mark: '⚔', label: String(card.damage), color: '#c0392b' });
  if (card.shield > 0) values.push({ mark: '⛨', label: String(card.shield), color: '#2f7fd0' });
  if (card.heal > 0) values.push({ mark: '+', label: String(card.heal), color: '#3d9e4d' });
  if (card.draw > 0) values.push({ mark: '↻', label: String(card.draw), color: '#7a5fb0' });
  if (values.length === 0) values.push({ mark: '·', label: '0', color: '#666' });
  const vw = 34;
  const totalW = values.length * vw;
  let vx = x + (w - totalW) / 2;
  ctx.font = 'bold 20px Georgia, serif';
  for (const v of values) {
    ctx.fillStyle = v.color;
    ctx.fillText(v.mark, vx + 12, y + 166);
    ctx.fillStyle = '#22201c';
    ctx.fillText(v.label, vx + 28, y + 166);
    vx += vw;
  }
  // Rules text, wrapped to two lines.
  ctx.fillStyle = '#4a463c';
  ctx.font = '13px Georgia, serif';
  const words = card.text.split(' ');
  let line = '';
  let ly = y + 188;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > w - 20 && line) {
      ctx.fillText(line, x + w / 2, ly);
      line = word;
      ly += 15;
      if (ly > y + h - 6) break;
    } else {
      line = test;
    }
  }
  if (line && ly <= y + h - 6) ctx.fillText(line, x + w / 2, ly);
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = '#274b73';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#ffd23e';
  ctx.stroke();
  roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 8);
  ctx.strokeStyle = 'rgba(255,210,62,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawSuitMark(ctx, 'tide', x + w / 2, y + h / 2 - 14, 26, '#7fb8f0');
  ctx.fillStyle = '#cfe3f7';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('TIDE', x + w / 2, y + h - 34);
  ctx.fillText('WARDEN', x + w / 2, y + h - 20);
  ctx.restore();
}

function drawLifeBar(ctx, x, y, w, life, shield, align) {
  ctx.save();
  ctx.textAlign = align === 'right' ? 'right' : 'left';
  ctx.textBaseline = 'middle';
  // Life bar.
  roundRect(ctx, x, y, w, 26, 13);
  ctx.fillStyle = '#2b2b2b';
  ctx.fill();
  const frac = Math.max(0, life / 30);
  if (frac > 0) {
    roundRect(ctx, x + 2, y + 2, (w - 4) * frac, 22, 11);
    ctx.fillStyle = life <= 10 ? '#e2483d' : '#57b25e';
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px Georgia, serif';
  const labelX = align === 'right' ? x + w - 10 : x + 10;
  ctx.fillText(`♥ ${life} / 30`, labelX, y + 14);
  if (shield > 0) {
    ctx.fillStyle = '#7fb8f0';
    ctx.font = 'bold 16px Georgia, serif';
    const sx = align === 'right' ? x - 12 : x + w + 12;
    ctx.textAlign = align === 'right' ? 'right' : 'left';
    ctx.fillText(`⛨ ${shield}`, sx, y + 14);
  }
  ctx.restore();
}

function drawButton(ctx, x, y, w, h, label, enabled, hovered) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = enabled ? (hovered ? '#ffd23e' : '#f4b942') : '#6b655a';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#1d3557';
  ctx.stroke();
  ctx.fillStyle = '#1d3557';
  ctx.font = 'bold 21px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function drawTable(ctx, state) {
  // Felt table with a soft vignette.
  const grad = ctx.createRadialGradient(640, 330, 120, 640, 360, 760);
  grad.addColorStop(0, '#2e6b4f');
  grad.addColorStop(1, '#173d2b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  ctx.strokeStyle = 'rgba(255,210,62,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(640, 360, 560, 300, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Opponent row: name, life, intent, face-down hand.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('TIDE WARDEN', 48, 44);
  drawLifeBar(ctx, 300, 32, 300, state.warden.life, state.warden.shield, 'left');
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'italic 18px Georgia, serif';
  const intent = INTENTS[state.warden.intent];
  ctx.fillText(`plans to ${intent.label} — ${intent.hint}`, 640, 44);

  const oppW = 92;
  const oppH = 126;
  const oppGap = 14;
  const oppTotal = state.warden.hand.length * oppW + (state.warden.hand.length - 1) * oppGap;
  let ox = 640 - oppTotal / 2;
  for (let i = 0; i < state.warden.hand.length; i++) {
    drawCardBack(ctx, ox, 78, oppW, oppH);
    ox += oppW + oppGap;
  }
  ctx.fillStyle = '#cfe3f7';
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Warden hand: ${state.warden.hand.length} cards  •  deck ${state.warden.deck.length}`, 640, 222);

  // Middle strip: turn, score, energy, deck counts, streak, log.
  // Two rows with clear lanes so nothing sits on anything else.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, 48, 240, 1184, 92, 14);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Turn ${state.turn}`, 68, 266);
  ctx.font = '19px Georgia, serif';
  ctx.fillText(`Score ${state.score}`, 68, 300);
  ctx.fillText(`Energy ${state.energy} / 3`, 230, 266);
  // Energy pips, on their own row under the Energy label.
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(244 + i * 30, 300, 10, 0, Math.PI * 2);
    ctx.fillStyle = i < state.energy ? '#ffd23e' : '#4a463c';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1d3557';
    ctx.stroke();
  }
  ctx.fillStyle = '#cfe3f7';
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`Deck ${state.player.deck.length}  •  discard ${state.player.discard.length}`, 340, 300);
  // Suit streak readout.
  const streaks = Object.entries(state.suitStreak).filter(([, n]) => n > 0);
  ctx.font = 'italic 16px Georgia, serif';
  ctx.fillStyle = '#ffe9a8';
  if (streaks.length > 0) {
    ctx.fillText(
      'Suit streak: ' + streaks.map(([s, n]) => `${SUITS[s].label} x${n}`).join('  '),
      560, 266,
    );
  }
  // Log lines, newest last.
  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = '#e8e2d2';
  ctx.textAlign = 'left';
  const lines = state.log.slice(-2);
  lines.forEach((line, i) => {
    ctx.fillText(line, 560, 292 + i * 18);
  });

  // Player row: life, then the hand.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('YOU — EMBER KNIGHT', 48, 380);
  drawLifeBar(ctx, 380, 368, 300, state.player.life, state.player.shield, 'left');
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'italic 17px Georgia, serif';
  ctx.fillText('Click a card or press 1–5. Same suit twice: +2 damage.', 780, 380);

  const hand = state.player.hand;
  const gap = 16;
  const totalW = hand.length * CARD_W + (hand.length - 1) * gap;
  let hx = 640 - totalW / 2;
  const hy = 420;
  state.handRects = [];
  hand.forEach((card, i) => {
    const hovered = state.hoverIndex === i;
    const selected = state.selectedIndex === i;
    drawCardFace(ctx, card, hx, hy, CARD_W, CARD_H, {
      playable: state.phase === 'player' && card.cost <= state.energy,
      hovered,
      selected,
    });
    state.handRects.push({ x: hx, y: hy - (hovered ? 12 : 0) - (selected ? 22 : 0), w: CARD_W, h: CARD_H, index: i });
    hx += CARD_W + gap;
  });

  // End Turn button, bottom right.
  const bx = 1060;
  const by = 648;
  drawButton(ctx, bx, by, 172, 52, 'END TURN ⏎', state.phase === 'player', state.hoverEndTurn);
  state.endTurnRect = { x: bx, y: by, w: 172, h: 52 };

  ctx.fillStyle = '#cfe3f7';
  ctx.font = '14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('1–5 play a card  •  Enter ends your turn  •  R restarts  •  Esc title', 48, 688);
}

function drawTitle(ctx, state) {
  const grad = ctx.createLinearGradient(0, 0, 0, STAGE_H);
  grad.addColorStop(0, '#1d3557');
  grad.addColorStop(0.55, '#274b73');
  grad.addColorStop(1, '#173d2b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  // Two big suit marks flanking the title.
  drawSuitMark(ctx, 'ember', 300, 250, 64);
  drawSuitMark(ctx, 'tide', 980, 250, 64);
  drawSuitMark(ctx, 'grove', 180, 470, 40);
  drawSuitMark(ctx, 'stone', 1100, 470, 40);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 92px Georgia, serif';
  ctx.fillText('EMBER & TIDE', 640, 200);
  ctx.fillStyle = '#fff';
  ctx.font = 'italic 30px Georgia, serif';
  ctx.fillText('A duel of sparks and waves', 640, 272);
  ctx.font = '21px Georgia, serif';
  ctx.fillStyle = '#e8e2d2';
  ctx.fillText('You are the Ember Knight. The Tide Warden holds the far side of the table.', 640, 350);
  ctx.fillText('Play cards with 3 energy a turn. Same suit twice in a turn hits +2 harder.', 640, 384);
  ctx.fillText('Read the Warden\u2019s intent, break its shield, bring its life to 0.', 640, 418);

  drawButton(ctx, 490, 470, 300, 64, 'BEGIN THE DUEL', true, state.hoverStart);
  state.startRect = { x: 490, y: 470, w: 300, h: 64 };

  ctx.fillStyle = '#cfe3f7';
  ctx.font = '17px Georgia, serif';
  ctx.fillText('Click BEGIN or press Enter  •  1–5 play cards  •  Enter ends turn', 640, 580);
  ctx.fillText('An original card game. No network, no account, just the table.', 640, 612);
}

function drawEnd(ctx, state, won) {
  ctx.fillStyle = won ? '#1e5c29' : '#5c1e1e';
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  const grad = ctx.createRadialGradient(640, 360, 80, 640, 360, 700);
  grad.addColorStop(0, won ? 'rgba(255,210,62,0.25)' : 'rgba(0,0,0,0.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = won ? '#ffd23e' : '#ff8a7a';
  ctx.font = 'bold 96px Georgia, serif';
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', 640, 210);
  ctx.fillStyle = '#fff';
  ctx.font = 'italic 28px Georgia, serif';
  ctx.fillText(
    won ? 'The Tide Warden bows. The table is yours.' : 'The Tide Warden takes the table this time.',
    640, 300,
  );
  ctx.font = '24px Georgia, serif';
  ctx.fillStyle = '#e8e2d2';
  ctx.fillText(`Final score ${state.score}  •  ${state.turn} turns played`, 640, 360);
  ctx.fillText(`Your life ${Math.max(0, state.player.life)}  •  Warden life ${Math.max(0, state.warden.life)}`, 640, 398);

  drawButton(ctx, 490, 470, 300, 64, 'PLAY AGAIN (R)', true, state.hoverStart);
  state.startRect = { x: 490, y: 470, w: 300, h: 64 };
  ctx.fillStyle = '#cfe3f7';
  ctx.font = '17px Georgia, serif';
  ctx.fillText('Press R or click PLAY AGAIN to deal a new game.', 640, 580);
}

// The one entry point: draw the screen that matches state.screen.
export function render(ctx, state) {
  ctx.save();
  ctx.clearRect(0, 0, STAGE_W, STAGE_H);
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'win') drawEnd(ctx, state, true);
  else if (state.screen === 'loss') drawEnd(ctx, state, false);
  else drawTable(ctx, state);
  ctx.restore();
}

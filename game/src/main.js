// main.js — the game state machine of Ember & Tide.
//
// Screens: title → table → win | loss. A turn: the player draws to 5,
// spends 3 energy on cards, ends the turn, and the Tide Warden answers
// with the intent it announced. Life starts at 30 on both sides; the
// first life total to reach 0 ends the game.

import { buildDeck, drawCards, makeRng } from './deck.js';
import { applyCard, chooseIntent, playWardenTurn } from './ai.js';
import { attachInput } from './input.js';
import { render, STAGE_H, STAGE_W } from './render.js';
import { applyShot } from './shots.js';

export function freshState(seed) {
  const rng = makeRng(seed);
  const state = {
    screen: 'title',
    phase: 'player',
    turn: 1,
    score: 0,
    energy: 3,
    seed,
    rng,
    log: ['Welcome to the table. The Warden is waiting.'],
    suitStreak: {},
    lastSuitPlayed: null,
    hoverIndex: -1,
    hoverEndTurn: false,
    hoverStart: false,
    handRects: [],
    endTurnRect: null,
    startRect: null,
    selectedIndex: -1,
    player: {
      life: 30, shield: 0,
      deck: buildDeck(rng), discard: [], hand: [],
    },
    warden: {
      life: 30, shield: 0, intent: 'strike',
      deck: buildDeck(rng), discard: [], hand: [],
    },
  };
  drawCards(state.player.deck, state.player.discard, state.player.hand, 5, rng);
  drawCards(state.warden.deck, state.warden.discard, state.warden.hand, 5, rng);
  state.warden.intent = chooseIntent(state, rng);
  return state;
}

function checkEnd(state) {
  if (state.warden.life <= 0) {
    state.screen = 'win';
    state.log.push('The Warden falls. Victory is yours.');
  } else if (state.player.life <= 0) {
    state.screen = 'loss';
    state.log.push('Your life runs out. The Warden takes the table.');
  }
}

function startTurn(state) {
  state.turn += 1;
  state.energy = 3;
  state.suitStreak = {};
  state.lastSuitPlayed = null;
  state.phase = 'player';
  drawCards(state.player.deck, state.player.discard, state.player.hand, 2, state.rng);
  state.warden.intent = chooseIntent(state, state.rng);
  state.log.push(`Turn ${state.turn}: you draw 2. The Warden plans to ${state.warden.intent}.`);
}

export function boot(canvas) {
  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get('seed') || '1') || 1;
  const state = freshState(seed);
  const ctx = canvas.getContext('2d');
  // Exposed for automated play-tests (and nothing else reads it).
  window.__etState = state;

  function fit() {
    const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    canvas.style.width = `${Math.floor(STAGE_W * scale)}px`;
    canvas.style.height = `${Math.floor(STAGE_H * scale)}px`;
  }

  function redraw() {
    fit();
    render(ctx, state);
  }

  const actions = {
    redraw,
    start() {
      const next = freshState(seed);
      Object.assign(state, next);
      state.screen = 'table';
      state.log.push('A new duel begins. Your move.');
      redraw();
    },
    toTitle() {
      state.screen = 'title';
      redraw();
    },
    playCard(index) {
      if (state.screen !== 'table' || state.phase !== 'player') return;
      const card = state.player.hand[index];
      if (!card) return;
      if (card.cost > state.energy) {
        state.log.push(`${card.name} costs ${card.cost} energy — you have ${state.energy}.`);
        redraw();
        return;
      }
      state.energy -= card.cost;
      state.player.hand.splice(index, 1);
      state.player.discard.push(card.id);
      state.selectedIndex = index;
      const line = applyCard(state, card, 'player', state.rng);
      state.log.push(line);
      checkEnd(state);
      redraw();
    },
    endTurn() {
      if (state.screen !== 'table' || state.phase !== 'player') return;
      state.phase = 'warden';
      state.log.push('You end your turn. The Warden answers.');
      redraw();
      window.setTimeout(() => {
        const lines = playWardenTurn(state, state.rng);
        for (const line of lines) state.log.push(line);
        // The Warden draws back up to 5 for its next hand.
        drawCards(state.warden.deck, state.warden.discard, state.warden.hand,
          Math.max(0, 5 - state.warden.hand.length), state.rng);
        checkEnd(state);
        if (state.screen === 'table') startTurn(state);
        redraw();
      }, 650);
    },
  };

  // Exposed for automated play-tests (and nothing else reads it).
  window.__etActions = actions;

  attachInput(canvas, state, actions);

  // A ?shot= query drives a fixed table for screenshots (see shots.js).
  const shot = params.get('shot');
  if (shot) applyShot(state, shot, seed);
  redraw();
  return { state, actions, redraw };
}

const canvas = document.getElementById('game');
canvas.width = STAGE_W;
canvas.height = STAGE_H;
boot(canvas);

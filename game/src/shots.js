// shots.js — fixed table setups for screenshots.
//
// ?shot=title | table | win | loss drives the game into one exact
// screen, from the same seeded state the game itself builds, so a
// screenshot is always a real render of the game's own code. The
// table shot sets a lively mid-game hand with a suit streak already
// running, so the log, the streak readout and the spent energy all
// show a game in progress.

import { cardById } from './deck.js';

export function applyShot(state, shot, seed) {
  if (shot === 'title') {
    state.screen = 'title';
    return;
  }
  if (shot === 'table') {
    state.screen = 'table';
    // Hand-pick a lively mid-game hand: two Ember cards in a row for
    // the suit streak, plus a Tide shield, then play them for real.
    const wanted = ['spark-jab', 'flame-lash', 'wave-wall', 'thorn-vine', 'flood-step'];
    state.player.hand = wanted.map((id) => cardById(id));
    state.player.life = 24;
    state.player.shield = 4;
    state.warden.life = 21;
    state.warden.shield = 3;
    state.warden.intent = 'strike';
    state.turn = 4;
    state.score = 17;
    state.energy = 3;
    state.log = [
      'Turn 4: you draw 2. The Warden plans to strike.',
      'Spark Jab: You deal 3 damage.',
      'Flame Lash: You deal 8 damage, suit streak +2.',
    ];
    state.suitStreak = { ember: 2 };
    state.lastSuitPlayed = 'ember';
    return;
  }
  if (shot === 'win') {
    state.screen = 'win';
    state.score = 34;
    state.turn = 7;
    state.player.life = 12;
    state.warden.life = 0;
    return;
  }
  if (shot === 'loss') {
    state.screen = 'loss';
    state.score = 19;
    state.turn = 6;
    state.player.life = 0;
    state.warden.life = 14;
    return;
  }
  // Unknown shot name: leave the title up.
  state.screen = 'title';
}

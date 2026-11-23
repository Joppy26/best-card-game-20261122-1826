// ai.js — the Tide Warden, the opponent across the table.
//
// The Warden plays the same 24 cards as the player, from its own deck,
// with 3 energy a turn. Its plan is readable: before it acts, the table
// shows its intent (Strike, Guard or Trick) and the damage or shield
// that intent promises, so the player can answer it on their next turn.

import { cardById, drawCards } from './deck.js';

export const INTENTS = {
  strike: { label: 'Strike', hint: 'is coming at you' },
  guard: { label: 'Guard', hint: 'is raising shields' },
  trick: { label: 'Trick', hint: 'is drawing deep' },
};

// Pick an intent for the Warden's next turn. It leans aggressive when
// the player is low, defensive when it is low, and otherwise rolls.
export function chooseIntent(state, rng) {
  const playerLow = state.player.life <= 10;
  const wardenLow = state.warden.life <= 10;
  const roll = rng();
  if (wardenLow && roll < 0.55) return 'guard';
  if (playerLow && roll < 0.65) return 'strike';
  if (roll < 0.45) return 'strike';
  if (roll < 0.75) return 'guard';
  return 'trick';
}

// Score one card for the given intent so the Warden spends its energy
// on cards that fit the plan it announced.
export function scoreCardForIntent(card, intent) {
  if (intent === 'strike') return card.damage * 2 + card.shield * 0.3 + card.draw * 0.5;
  if (intent === 'guard') return card.shield * 2 + card.heal * 1.5 + card.damage * 0.4;
  return card.draw * 3 + card.damage + card.shield * 0.5 + card.heal;
}

// Play the Warden's turn: sort its hand by fit for its intent, then
// play the best cards it can afford, one at a time, and return a list
// of plain-text log lines describing what happened.
export function playWardenTurn(state, rng) {
  const log = [];
  const intent = state.warden.intent;
  let energy = 3;
  const hand = state.warden.hand.slice().sort(
    (a, b) => scoreCardForIntent(b, intent) - scoreCardForIntent(a, intent),
  );
  let played = 0;
  for (const card of hand) {
    if (energy < card.cost) continue;
    energy -= card.cost;
    played += 1;
    const idx = state.warden.hand.indexOf(card);
    if (idx >= 0) state.warden.hand.splice(idx, 1);
    state.warden.discard.push(card.id);
    log.push(applyCard(state, card, 'warden', rng));
    if (state.player.life <= 0 || state.warden.life <= 0) break;
  }
  if (played === 0) log.push('Tide Warden holds its cards and passes.');
  return log;
}

// Resolve one card played by `side` ('player' or 'warden') against the
// other side. Shield soaks damage first; Riptide pierces shield.
// Returns one log line. Same-suit follow-ups (Blaze Rush, Avalanche)
// gain +2 damage when the previous card this turn shares their suit.
export function applyCard(state, card, side, rng) {
  const me = side === 'player' ? state.player : state.warden;
  const foe = side === 'player' ? state.warden : state.player;
  const who = side === 'player' ? 'You' : 'Tide Warden';

  let damage = card.damage;
  const followUp = (card.id === 'blaze-rush' || card.id === 'avalanche')
    && state.lastSuitPlayed === card.suit;
  if (followUp) damage += 2;

  // Same-suit streak: the second and later cards of one suit in a turn
  // hit +2 harder. The streak is what makes sequencing a decision.
  const streak = state.suitStreak[card.suit] || 0;
  if (streak >= 1 && card.damage > 0) damage += 2;
  state.suitStreak[card.suit] = streak + 1;
  state.lastSuitPlayed = card.suit;

  const parts = [];
  if (damage > 0) {
    let dealt = damage;
    if (card.id !== 'riptide' && foe.shield > 0) {
      const soaked = Math.min(foe.shield, dealt);
      foe.shield -= soaked;
      dealt -= soaked;
      if (soaked > 0) parts.push(`shield soaks ${soaked}`);
    }
    foe.life = Math.max(0, foe.life - dealt);
    if (side === 'player') state.score += dealt;
    parts.push(`${who} deal${side === 'player' ? '' : 's'} ${dealt} damage`);
    if (followUp) parts.push('follow-up +2');
    if (streak >= 1) parts.push('suit streak +2');
  }
  if (card.shield > 0) {
    me.shield += card.shield;
    parts.push(`${who} gain${side === 'player' ? '' : 's'} ${card.shield} shield`);
  }
  if (card.heal > 0) {
    const healed = Math.min(card.heal, 30 - me.life);
    me.life += healed;
    parts.push(`${who} heal${side === 'player' ? '' : 's'} ${healed}`);
  }
  if (card.draw > 0) {
    const deck = side === 'player' ? state.player.deck : state.warden.deck;
    const discard = side === 'player' ? state.player.discard : state.warden.discard;
    const hand = side === 'player' ? state.player.hand : state.warden.hand;
    const drawn = drawCards(deck, discard, hand, card.draw, rng);
    if (drawn.length > 0) parts.push(`${who} draw${side === 'player' ? '' : 's'} ${drawn.length}`);
  }
  return `${card.name}: ${parts.join(', ')}.`;
}

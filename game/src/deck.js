// deck.js — the cards of Ember & Tide and the deck that deals them.
//
// Four suits, each with its own job on the table:
//   Ember (red) hits hard. Tide (blue) shields and draws. Grove (green)
//   heals and grows. Stone (grey) hits heavy and holds the line.
// A card is plain data: name, suit, cost, damage, shield, heal, draw,
// and one line of rules text. No card here copies any other game.

export const SUITS = {
  ember: { label: 'Ember', color: '#e2483d', dark: '#8f1d16', light: '#ff8a7a' },
  tide: { label: 'Tide', color: '#2f7fd0', dark: '#174a80', light: '#7fb8f0' },
  grove: { label: 'Grove', color: '#3d9e4d', dark: '#1e5c29', light: '#8ed69a' },
  stone: { label: 'Stone', color: '#8a7f72', dark: '#4d453d', light: '#c9bda9' },
};

// mulberry32: a tiny seeded generator so a screenshot seed replays
// the exact same shuffle and draw every time.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}

// The card pool: 24 unique cards, six per suit. Costs run 0 to 3 energy.
export const CARD_POOL = [
  // Ember — damage, with a spark of draw.
  { id: 'spark-jab', name: 'Spark Jab', suit: 'ember', cost: 1, damage: 3, shield: 0, heal: 0, draw: 0, text: 'Deal 3 damage.' },
  { id: 'flame-lash', name: 'Flame Lash', suit: 'ember', cost: 2, damage: 6, shield: 0, heal: 0, draw: 0, text: 'Deal 6 damage.' },
  { id: 'inferno', name: 'Inferno', suit: 'ember', cost: 3, damage: 9, shield: 0, heal: 0, draw: 0, text: 'Deal 9 damage.' },
  { id: 'cinder-fan', name: 'Cinder Fan', suit: 'ember', cost: 2, damage: 4, shield: 0, heal: 0, draw: 1, text: 'Deal 4 damage. Draw 1.' },
  { id: 'blaze-rush', name: 'Blaze Rush', suit: 'ember', cost: 1, damage: 2, shield: 0, heal: 0, draw: 0, text: 'Deal 2 damage. +2 if it follows Ember.' },
  { id: 'ember-guard', name: 'Ember Guard', suit: 'ember', cost: 1, damage: 2, shield: 2, heal: 0, draw: 0, text: 'Deal 2 damage. Gain 2 shield.' },
  // Tide — shield and flow.
  { id: 'wave-wall', name: 'Wave Wall', suit: 'tide', cost: 1, damage: 0, shield: 5, heal: 0, draw: 0, text: 'Gain 5 shield.' },
  { id: 'tide-surge', name: 'Tide Surge', suit: 'tide', cost: 2, damage: 0, shield: 4, heal: 0, draw: 1, text: 'Gain 4 shield. Draw 1.' },
  { id: 'riptide', name: 'Riptide', suit: 'tide', cost: 2, damage: 5, shield: 0, heal: 0, draw: 0, text: 'Deal 5 damage through shield.' },
  { id: 'deep-calm', name: 'Deep Calm', suit: 'tide', cost: 1, damage: 0, shield: 3, heal: 2, draw: 0, text: 'Gain 3 shield. Heal 2.' },
  { id: 'flood-step', name: 'Flood Step', suit: 'tide', cost: 1, damage: 0, shield: 0, heal: 0, draw: 2, text: 'Draw 2 cards.' },
  { id: 'crashing-wave', name: 'Crashing Wave', suit: 'tide', cost: 3, damage: 7, shield: 3, heal: 0, draw: 0, text: 'Deal 7 damage. Gain 3 shield.' },
  // Grove — healing and growth.
  { id: 'thorn-vine', name: 'Thorn Vine', suit: 'grove', cost: 1, damage: 3, shield: 0, heal: 1, draw: 0, text: 'Deal 3 damage. Heal 1.' },
  { id: 'root-mend', name: 'Root Mend', suit: 'grove', cost: 2, damage: 0, shield: 0, heal: 6, draw: 0, text: 'Heal 6 life.' },
  { id: 'bloom', name: 'Bloom', suit: 'grove', cost: 1, damage: 0, shield: 0, heal: 2, draw: 1, text: 'Heal 2. Draw 1.' },
  { id: 'spore-burst', name: 'Spore Burst', suit: 'grove', cost: 2, damage: 4, shield: 0, heal: 0, draw: 1, text: 'Deal 4 damage. Draw 1.' },
  { id: 'ancient-oak', name: 'Ancient Oak', suit: 'grove', cost: 3, damage: 0, shield: 6, heal: 3, draw: 0, text: 'Gain 6 shield. Heal 3.' },
  { id: 'seedling', name: 'Seedling', suit: 'grove', cost: 0, damage: 0, shield: 0, heal: 0, draw: 1, text: 'Draw 1 card. Free.' },
  // Stone — heavy hits that hold the line.
  { id: 'rock-slam', name: 'Rock Slam', suit: 'stone', cost: 2, damage: 5, shield: 2, heal: 0, draw: 0, text: 'Deal 5 damage. Gain 2 shield.' },
  { id: 'boulder', name: 'Boulder', suit: 'stone', cost: 3, damage: 8, shield: 0, heal: 0, draw: 0, text: 'Deal 8 damage.' },
  { id: 'granite-skin', name: 'Granite Skin', suit: 'stone', cost: 1, damage: 0, shield: 4, heal: 0, draw: 0, text: 'Gain 4 shield.' },
  { id: 'quake', name: 'Quake', suit: 'stone', cost: 3, damage: 6, shield: 2, heal: 0, draw: 0, text: 'Deal 6 damage. Gain 2 shield.' },
  { id: 'pebble-toss', name: 'Pebble Toss', suit: 'stone', cost: 0, damage: 1, shield: 0, heal: 0, draw: 0, text: 'Deal 1 damage. Free.' },
  { id: 'avalanche', name: 'Avalanche', suit: 'stone', cost: 2, damage: 4, shield: 0, heal: 0, draw: 0, text: 'Deal 4 damage. +2 if it follows Stone.' },
];

export function cardById(id) {
  return CARD_POOL.find((c) => c.id === id);
}

// A fresh 24-card deck, shuffled with the given rng.
export function buildDeck(rng) {
  return shuffle(CARD_POOL.map((c) => c.id), rng);
}

// Draw n cards from a deck into a hand, reshuffling the discard pile
// back in when the deck runs dry. A hand holds at most 7 cards: extra
// draws are skipped, so a draw-heavy game can never stall on a hand
// that only grows. Returns the drawn card objects.
export function drawCards(deck, discard, hand, n, rng) {
  const drawn = [];
  for (let i = 0; i < n; i++) {
    if (hand.length >= 7) break;
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck.push(...shuffle(discard.splice(0), rng));
    }
    const id = deck.pop();
    const card = cardById(id);
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

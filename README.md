# Ember & Tide

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Joppy26/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Joppy26/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

A duel of sparks and waves: an original deck-battler card game built for
[make.fun's best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826).

You are the Ember Knight, across the table from the Tide Warden. Both sides
start at 30 life. Each turn you draw cards, spend 3 energy playing them,
and answer the Warden's announced intent — Strike, Guard, or Trick — before
it answers you.

## The cards

Four suits, each with its own job, told apart by colour and by a drawn
shape (flame, wave, leaf, stone):

- **Ember** (red) — hits hard: Spark Jab, Flame Lash, Inferno.
- **Tide** (blue) — shields and draws: Wave Wall, Tide Surge, Riptide.
- **Grove** (green) — heals and grows: Root Mend, Bloom, Ancient Oak.
- **Stone** (grey) — heavy hits that hold the line: Boulder, Quake, Avalanche.

The decision in every hand is sequencing: play two cards of the same suit
in one turn and the second hits +2 harder (the suit streak), and follow-up
cards like Blaze Rush and Avalanche gain +2 more when they follow their
own suit. Shield soaks damage first; Riptide pierces it.

## How to play

Open `game/index.html` in a desktop browser — no build step, no network,
plain static files.

- **Click** a card, or press **1–5**, to play it.
- **Enter** (or the END TURN button) ends your turn; the Warden plays next.
- **R** deals a new game. **Esc** returns to the title screen.
- Bring the Warden's life to 0 to win; lose yours and the table is theirs.

## Files

- `game/index.html` — the page, one canvas.
- `game/src/main.js` — the state machine: title, table, win, loss.
- `game/src/deck.js` — the 24-card pool, the seeded shuffle, the draw.
- `game/src/ai.js` — the Tide Warden: its readable intent and its turn.
- `game/src/render.js` — every screen drawn on canvas.
- `game/src/input.js` — keyboard and mouse, both feeding the same actions.
- `game/src/shots.js` — fixed table setups behind `?shot=title|table|win|loss`,
  used for the screenshots in `screenshots/`.
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to
  `/output` and writes `/output/dossier.json`.

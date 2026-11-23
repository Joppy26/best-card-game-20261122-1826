// input.js — keyboard and mouse for Ember & Tide.
//
// Keys: 1–5 play the card in that slot, Enter/Space ends the turn or
// starts the game, R restarts, Esc goes back to the title. The mouse
// does the same by clicking cards and buttons. Both feed the same
// actions on the game state, so either hand can play a whole game.

export function attachInput(canvas, state, actions) {
  function scalePoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function inside(rect, p) {
    return rect && p.x >= rect.x && p.x <= rect.x + rect.w
      && p.y >= rect.y && p.y <= rect.y + rect.h;
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = scalePoint(event.clientX, event.clientY);
    state.hoverIndex = -1;
    state.hoverEndTurn = false;
    state.hoverStart = false;
    if (state.screen === 'table' && state.handRects) {
      for (const rect of state.handRects) {
        if (inside(rect, p)) state.hoverIndex = rect.index;
      }
      if (inside(state.endTurnRect, p)) state.hoverEndTurn = true;
    }
    if ((state.screen === 'title' || state.screen === 'win' || state.screen === 'loss')
      && inside(state.startRect, p)) {
      state.hoverStart = true;
    }
    actions.redraw();
  });

  canvas.addEventListener('click', (event) => {
    const p = scalePoint(event.clientX, event.clientY);
    if ((state.screen === 'title' || state.screen === 'win' || state.screen === 'loss')
      && inside(state.startRect, p)) {
      actions.start();
      return;
    }
    if (state.screen === 'table') {
      if (inside(state.endTurnRect, p)) {
        actions.endTurn();
        return;
      }
      if (state.handRects) {
        for (const rect of state.handRects) {
          if (inside(rect, p)) {
            actions.playCard(rect.index);
            return;
          }
        }
      }
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (state.screen === 'title' || state.screen === 'win' || state.screen === 'loss') {
        actions.start();
      } else if (state.screen === 'table') {
        actions.endTurn();
      }
      return;
    }
    if (key === 'r' || key === 'R') {
      actions.start();
      return;
    }
    if (key === 'Escape') {
      actions.toTitle();
      return;
    }
    if (state.screen === 'table' && key >= '1' && key <= '9') {
      const index = Number(key) - 1;
      if (index < state.player.hand.length) actions.playCard(index);
    }
  });
}

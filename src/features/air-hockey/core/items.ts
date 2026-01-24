import { GameState, ItemType } from './types';

const magnitude = (vx: number, vy: number) => Math.sqrt(vx ** 2 + vy ** 2);

export const ItemEffects = {
  split: (game: GameState) => {
    if (game.pucks.length !== 1) return;
    const p = game.pucks[0];
    const speed = magnitude(p.vx, p.vy) || 3;
    const angle = Math.atan2(p.vy, p.vx);
    game.pucks = [
      { ...p },
      { ...p, x: p.x - 20, vx: Math.cos(angle - 0.5) * speed, vy: Math.sin(angle - 0.5) * speed },
      { ...p, x: p.x + 20, vx: Math.cos(angle + 0.5) * speed, vy: Math.sin(angle + 0.5) * speed },
    ];
  },
  speed: (game: GameState, target: 'player' | 'cpu') => {
    game.effects[target].speed = { start: Date.now(), duration: 8000 };
  },
  invisible: (game: GameState, target: 'player' | 'cpu') => {
    game.effects[target].invisible = 5;
  },
};

export const applyItemEffect = (
  game: GameState,
  item: { id: ItemType },
  target: 'player' | 'cpu',
  now: number
) => {
  game.flash = { type: item.id, time: now };
  const effect = ItemEffects[item.id];
  if (effect) {
    if (item.id === 'split') {
      (effect as (g: GameState) => void)(game);
    } else {
      (effect as (g: GameState, t: 'player' | 'cpu') => void)(game, target);
    }
  }
};

import { GameState, ItemType, Puck, GameEffects } from './types';
import { magnitude } from '../../../utils/math-utils';

/**
 * アイテムエフェクト適用結果の型
 */
export type ItemEffectResult = Partial<Pick<GameState, 'pucks' | 'effects' | 'flash'>>;

/**
 * アイテムエフェクト（不変更新パターン）
 */
export const ItemEffects = {
  split: (game: GameState): ItemEffectResult => {
    if (game.pucks.length !== 1) return {};
    const p = game.pucks[0];
    const speed = magnitude(p.vx, p.vy) || 3;
    const angle = Math.atan2(p.vy, p.vx);
    const newPucks: Puck[] = [
      { ...p },
      { ...p, x: p.x - 20, vx: Math.cos(angle - 0.5) * speed, vy: Math.sin(angle - 0.5) * speed },
      { ...p, x: p.x + 20, vx: Math.cos(angle + 0.5) * speed, vy: Math.sin(angle + 0.5) * speed },
    ];
    return { pucks: newPucks };
  },
  speed: (game: GameState, target: 'player' | 'cpu'): ItemEffectResult => {
    const newEffects: GameEffects = {
      ...game.effects,
      [target]: {
        ...game.effects[target],
        speed: { start: Date.now(), duration: 8000 },
      },
    };
    return { effects: newEffects };
  },
  invisible: (game: GameState, target: 'player' | 'cpu'): ItemEffectResult => {
    const newEffects: GameEffects = {
      ...game.effects,
      [target]: {
        ...game.effects[target],
        invisible: 5,
      },
    };
    return { effects: newEffects };
  },
};

/**
 * アイテムエフェクトを適用（不変更新パターン）
 * @returns ゲーム状態の更新部分
 */
export const applyItemEffect = (
  game: GameState,
  item: { id: ItemType },
  target: 'player' | 'cpu',
  now: number
): ItemEffectResult => {
  const result: ItemEffectResult = {
    flash: { type: item.id, time: now },
  };

  const effect = ItemEffects[item.id];
  if (effect) {
    let effectResult: ItemEffectResult;
    if (item.id === 'split') {
      effectResult = (effect as (g: GameState) => ItemEffectResult)(game);
    } else {
      effectResult = (effect as (g: GameState, t: 'player' | 'cpu') => ItemEffectResult)(
        game,
        target
      );
    }
    return { ...result, ...effectResult };
  }

  return result;
};

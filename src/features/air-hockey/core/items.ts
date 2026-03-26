import { GameState, ItemType, Puck, GameEffects, EffectState, EffectTarget } from './types';
import { magnitude } from '../../../utils/math-utils';

/**
 * アイテムエフェクト適用結果の型
 */
export type ItemEffectResult = Partial<Pick<GameState, 'pucks' | 'effects' | 'flash'>>;

/** 対象のエフェクト状態を安全に取得（ally/enemy が undefined の場合はデフォルト値） */
function getEffectState(effects: GameEffects, target: EffectTarget): EffectState {
  const state = effects[target];
  return state ?? { speed: null, invisible: 0, shield: false, magnet: null, big: null };
}

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
  speed: (game: GameState, target: EffectTarget): ItemEffectResult => {
    const newEffects: GameEffects = {
      ...game.effects,
      [target]: {
        ...getEffectState(game.effects, target),
        speed: { start: Date.now(), duration: 8000 },
      },
    };
    return { effects: newEffects };
  },
  invisible: (game: GameState, target: EffectTarget): ItemEffectResult => {
    const newEffects: GameEffects = {
      ...game.effects,
      [target]: {
        ...getEffectState(game.effects, target),
        invisible: 5,
      },
    };
    return { effects: newEffects };
  },
  shield: (game: GameState, target: EffectTarget): ItemEffectResult => {
    const newEffects: GameEffects = {
      ...game.effects,
      [target]: {
        ...getEffectState(game.effects, target),
        shield: true,
      },
    };
    return { effects: newEffects };
  },
  magnet: (game: GameState, target: EffectTarget): ItemEffectResult => {
    const newEffects: GameEffects = {
      ...game.effects,
      [target]: {
        ...getEffectState(game.effects, target),
        magnet: { start: Date.now(), duration: 5000 },
      },
    };
    return { effects: newEffects };
  },
  big: (game: GameState, target: EffectTarget): ItemEffectResult => {
    const newEffects: GameEffects = {
      ...game.effects,
      [target]: {
        ...getEffectState(game.effects, target),
        big: { start: Date.now(), duration: 8000, scale: 1.5 },
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
  target: EffectTarget,
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
      effectResult = (effect as (g: GameState, t: EffectTarget) => ItemEffectResult)(
        game,
        target
      );
    }
    return { ...result, ...effectResult };
  }

  return result;
};

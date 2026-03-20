/**
 * アイテムエフェクトサービス（Strategy パターン）
 * - 各アイテムは ItemEffectStrategy を実装
 * - 新アイテム追加時は Strategy の実装を追加するのみ
 */
import type { GameState, ItemType, Puck, GameEffects } from '../types';
import { magnitude } from '../../../../utils/math-utils';

/** エフェクト関連定数 */
const EFFECT_CONSTANTS = {
  /** 速度エフェクト持続時間（ms） */
  SPEED_DURATION: 8000,
  /** 不可視エフェクトカウント */
  INVISIBLE_COUNT: 5,
  /** マグネットエフェクト持続時間（ms） */
  MAGNET_DURATION: 5000,
  /** 巨大化エフェクト持続時間（ms） */
  BIG_DURATION: 8000,
  /** 巨大化スケール */
  BIG_SCALE: 1.5,
  /** 分裂時のデフォルト速度 */
  SPLIT_DEFAULT_SPEED: 3,
  /** 分裂時の角度オフセット */
  SPLIT_ANGLE_OFFSET: 0.5,
  /** 分裂時のX座標オフセット */
  SPLIT_X_OFFSET: 20,
} as const;

/**
 * アイテムエフェクト Strategy インターフェース
 *
 * NOTE: apply は GameState 全体を受け取る設計。
 * SplitEffect が pucks を操作し、他エフェクトが effects を操作するため、
 * 現時点では統一的な GameState 受け渡しが最もシンプル。
 * 将来的にエフェクトが増えた場合、必要なフィールドのみのサブセット型への移行を検討する。
 */
export interface ItemEffectStrategy {
  readonly type: ItemType;
  apply(state: GameState, target: 'player' | 'cpu', now: number): GameState;
}

/** パック分裂エフェクト */
export class SplitEffect implements ItemEffectStrategy {
  readonly type: ItemType = 'split';

  apply(state: GameState, _target: 'player' | 'cpu', _now: number): GameState {
    if (state.pucks.length !== 1) return state;
    const p = state.pucks[0];
    const speed = magnitude(p.vx, p.vy) || EFFECT_CONSTANTS.SPLIT_DEFAULT_SPEED;
    const angle = Math.atan2(p.vy, p.vx);
    const newPucks: Puck[] = [
      { ...p },
      {
        ...p,
        x: p.x - EFFECT_CONSTANTS.SPLIT_X_OFFSET,
        vx: Math.cos(angle - EFFECT_CONSTANTS.SPLIT_ANGLE_OFFSET) * speed,
        vy: Math.sin(angle - EFFECT_CONSTANTS.SPLIT_ANGLE_OFFSET) * speed,
      },
      {
        ...p,
        x: p.x + EFFECT_CONSTANTS.SPLIT_X_OFFSET,
        vx: Math.cos(angle + EFFECT_CONSTANTS.SPLIT_ANGLE_OFFSET) * speed,
        vy: Math.sin(angle + EFFECT_CONSTANTS.SPLIT_ANGLE_OFFSET) * speed,
      },
    ];
    return { ...state, pucks: newPucks };
  }
}

/** 速度UPエフェクト */
export class SpeedEffect implements ItemEffectStrategy {
  readonly type: ItemType = 'speed';

  apply(state: GameState, target: 'player' | 'cpu', now: number): GameState {
    const newEffects: GameEffects = {
      ...state.effects,
      [target]: {
        ...state.effects[target],
        speed: { start: now, duration: EFFECT_CONSTANTS.SPEED_DURATION },
      },
    };
    return { ...state, effects: newEffects };
  }
}

/** 不可視エフェクト */
export class InvisibleEffect implements ItemEffectStrategy {
  readonly type: ItemType = 'invisible';

  apply(state: GameState, target: 'player' | 'cpu', _now: number): GameState {
    const newEffects: GameEffects = {
      ...state.effects,
      [target]: {
        ...state.effects[target],
        invisible: EFFECT_CONSTANTS.INVISIBLE_COUNT,
      },
    };
    return { ...state, effects: newEffects };
  }
}

/** シールドエフェクト */
export class ShieldEffect implements ItemEffectStrategy {
  readonly type: ItemType = 'shield';

  apply(state: GameState, target: 'player' | 'cpu', _now: number): GameState {
    const newEffects: GameEffects = {
      ...state.effects,
      [target]: {
        ...state.effects[target],
        shield: true,
      },
    };
    return { ...state, effects: newEffects };
  }
}

/** マグネットエフェクト */
export class MagnetEffect implements ItemEffectStrategy {
  readonly type: ItemType = 'magnet';

  apply(state: GameState, target: 'player' | 'cpu', now: number): GameState {
    const newEffects: GameEffects = {
      ...state.effects,
      [target]: {
        ...state.effects[target],
        magnet: { start: now, duration: EFFECT_CONSTANTS.MAGNET_DURATION },
      },
    };
    return { ...state, effects: newEffects };
  }
}

/** 巨大化エフェクト */
export class BigEffect implements ItemEffectStrategy {
  readonly type: ItemType = 'big';

  apply(state: GameState, target: 'player' | 'cpu', now: number): GameState {
    const newEffects: GameEffects = {
      ...state.effects,
      [target]: {
        ...state.effects[target],
        big: { start: now, duration: EFFECT_CONSTANTS.BIG_DURATION, scale: EFFECT_CONSTANTS.BIG_SCALE },
      },
    };
    return { ...state, effects: newEffects };
  }
}

/** エフェクトレジストリ */
export class ItemEffectRegistry {
  private readonly strategies: Map<ItemType, ItemEffectStrategy> = new Map();

  constructor() {
    // デフォルトで全エフェクトを登録
    const defaults: ItemEffectStrategy[] = [
      new SplitEffect(),
      new SpeedEffect(),
      new InvisibleEffect(),
      new ShieldEffect(),
      new MagnetEffect(),
      new BigEffect(),
    ];
    for (const strategy of defaults) {
      this.strategies.set(strategy.type, strategy);
    }
  }

  register(strategy: ItemEffectStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  apply(type: ItemType, state: GameState, target: 'player' | 'cpu', now: number): GameState {
    const strategy = this.strategies.get(type);
    if (!strategy) return state;
    return strategy.apply(state, target, now);
  }

  getAll(): ReadonlyArray<ItemEffectStrategy> {
    return Array.from(this.strategies.values());
  }
}

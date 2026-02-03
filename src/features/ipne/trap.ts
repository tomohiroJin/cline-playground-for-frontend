/**
 * 罠システムモジュール
 */
import { Trap, TrapType, TrapTypeValue, TrapState, TrapStateValue, Player, Enemy } from './types';

/** 罠の設定 */
interface TrapConfig {
  damage?: number;
  slowDuration?: number;
  slowRate?: number;
  alertRadius?: number;
  cooldown?: number;
  reusable: boolean;
}

/** 罠種類別設定 */
export const TRAP_CONFIGS: Record<TrapTypeValue, TrapConfig> = {
  [TrapType.DAMAGE]: {
    damage: 3,
    cooldown: 5000,
    reusable: true,
  },
  [TrapType.SLOW]: {
    slowDuration: 6000,
    slowRate: 0.5,
    cooldown: 5000,
    reusable: true,
  },
  [TrapType.ALERT]: {
    alertRadius: 5,
    cooldown: 8000,
    reusable: true,
  },
};

let trapIdCounter = 0;

/**
 * 罠IDを生成
 */
export const generateTrapId = (): string => {
  trapIdCounter += 1;
  return `trap-${trapIdCounter}`;
};

/**
 * 罠IDカウンタをリセット
 */
export const resetTrapIdCounter = (): void => {
  trapIdCounter = 0;
};

/**
 * 罠を作成
 */
export const createTrap = (
  type: TrapTypeValue,
  x: number,
  y: number,
  state: TrapStateValue = TrapState.HIDDEN
): Trap => {
  return {
    id: generateTrapId(),
    x,
    y,
    type,
    state,
    isVisibleToThief: true,
    cooldownUntil: undefined,
  };
};

/**
 * ダメージ罠を作成
 */
export const createDamageTrap = (x: number, y: number): Trap => {
  return createTrap(TrapType.DAMAGE, x, y);
};

/**
 * 移動妨害罠を作成
 */
export const createSlowTrap = (x: number, y: number): Trap => {
  return createTrap(TrapType.SLOW, x, y);
};

/**
 * 索敵反応罠を作成
 */
export const createAlertTrap = (x: number, y: number): Trap => {
  return createTrap(TrapType.ALERT, x, y);
};

/** 罠発動結果 */
export interface TrapTriggerResult {
  trap: Trap;
  damage: number;
  slowDuration: number;
  alertRadius: number;
  alertedEnemies: Enemy[];
}

/**
 * 罠を発動
 */
export const triggerTrap = (
  trap: Trap,
  player: Player,
  enemies: Enemy[],
  currentTime: number
): TrapTriggerResult => {
  const config = TRAP_CONFIGS[trap.type];
  let newState: TrapStateValue;
  let cooldownUntil: number | undefined;

  if (config.reusable) {
    newState = TrapState.REVEALED;
    cooldownUntil = currentTime + (config.cooldown ?? 0);
  } else {
    newState = TrapState.TRIGGERED;
    cooldownUntil = undefined;
  }

  const updatedTrap: Trap = {
    ...trap,
    state: newState,
    cooldownUntil,
  };

  // 効果を計算
  let damage = 0;
  let slowDuration = 0;
  let alertRadius = 0;
  let alertedEnemies: Enemy[] = [];

  switch (trap.type) {
    case TrapType.DAMAGE:
      damage = config.damage ?? 0;
      break;
    case TrapType.SLOW:
      slowDuration = config.slowDuration ?? 0;
      break;
    case TrapType.ALERT:
      alertRadius = config.alertRadius ?? 0;
      // 範囲内の敵を引き寄せ対象にする
      alertedEnemies = enemies.filter(enemy => {
        const dx = enemy.x - trap.x;
        const dy = enemy.y - trap.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= alertRadius;
      });
      break;
  }

  return {
    trap: updatedTrap,
    damage,
    slowDuration,
    alertRadius,
    alertedEnemies,
  };
};

/**
 * 罠が発動可能かどうかを判定
 */
export const canTriggerTrap = (trap: Trap, currentTime: number): boolean => {
  const config = TRAP_CONFIGS[trap.type];

  // 発動済みで再利用不可の罠は発動不可
  if (trap.state === TrapState.TRIGGERED && !config.reusable) {
    return false;
  }

  // クールダウン中は発動不可
  if (trap.cooldownUntil !== undefined && currentTime < trap.cooldownUntil) {
    return false;
  }

  return true;
};

/**
 * 指定位置の罠を取得
 */
export const getTrapAt = (traps: Trap[], x: number, y: number): Trap | undefined => {
  return traps.find(trap => trap.x === x && trap.y === y);
};

/**
 * 罠を発見済み状態にする
 */
export const revealTrap = (trap: Trap): Trap => {
  if (trap.state === TrapState.TRIGGERED) return trap;
  return {
    ...trap,
    state: TrapState.REVEALED,
  };
};

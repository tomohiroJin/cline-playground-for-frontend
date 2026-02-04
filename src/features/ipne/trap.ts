/**
 * 罠システムモジュール
 */
import { Trap, TrapType, TrapTypeValue, TrapState, TrapStateValue, Player, GameMap, TileType } from './types';

/** 罠の設定 */
interface TrapConfig {
  damage?: number;
  slowDuration?: number;
  slowRate?: number;
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
  [TrapType.TELEPORT]: {
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
 * テレポート罠を作成
 */
export const createTeleportTrap = (x: number, y: number): Trap => {
  return createTrap(TrapType.TELEPORT, x, y);
};

/** テレポート先座標 */
export interface TeleportDestination {
  x: number;
  y: number;
}

/** 罠発動結果 */
export interface TrapTriggerResult {
  trap: Trap;
  damage: number;
  slowDuration: number;
  teleportDestination?: TeleportDestination;
}

/**
 * 迷路内のランダムな通行可能タイルを取得
 */
export const getRandomPassableTile = (map: GameMap): TeleportDestination | undefined => {
  const passableTiles: TeleportDestination[] = [];

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const tile = map[y][x];
      // 床、スタート、ゴールは通行可能
      if (tile === TileType.FLOOR || tile === TileType.START || tile === TileType.GOAL) {
        passableTiles.push({ x, y });
      }
    }
  }

  if (passableTiles.length === 0) {
    return undefined;
  }

  // ランダムに選択（敵がいる場所へのワープも許可）
  const index = Math.floor(Math.random() * passableTiles.length);
  return passableTiles[index];
};

/**
 * 罠を発動
 */
export const triggerTrap = (
  trap: Trap,
  player: Player,
  currentTime: number,
  map?: GameMap
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
  let teleportDestination: TeleportDestination | undefined;

  switch (trap.type) {
    case TrapType.DAMAGE:
      damage = config.damage ?? 0;
      break;
    case TrapType.SLOW:
      slowDuration = config.slowDuration ?? 0;
      break;
    case TrapType.TELEPORT:
      // 迷路内のランダムな通行可能タイルにワープ
      if (map) {
        teleportDestination = getRandomPassableTile(map);
      }
      break;
  }

  return {
    trap: updatedTrap,
    damage,
    slowDuration,
    teleportDestination,
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

export type GameConstants = {
  CANVAS: { WIDTH: number; HEIGHT: number };
  SIZES: { MALLET: number; PUCK: number; ITEM: number };
  PHYSICS: { FRICTION: number; MIN_SPEED: number; MAX_POWER: number };
  TIMING: { ITEM_SPAWN: number; GOAL_EFFECT: number; FLASH: number; HELP_TIMEOUT: number; FEVER_TRIGGER: number; FEVER_INTERVAL: number; OBSTACLE_RESPAWN: number };
  CPU: { easy: number; normal: number; hard: number };
  FEVER: { MAX_EXTRA_PUCKS: number };
  COMEBACK: { THRESHOLD: number; MALLET_BONUS: number; GOAL_REDUCTION: number };
};

/** マレットと壁の間のマージン（px） */
export const MALLET_WALL_MARGIN = 5;
/** マレットと中央ラインの間のマージン（px） */
export const MALLET_CENTER_LINE_MARGIN = 10;

/** デフォルトのプレイヤーマレット色 */
export const DEFAULT_PLAYER_MALLET_COLOR = '#3498db';
/** デフォルトの CPU マレット色 */
export const DEFAULT_CPU_MALLET_COLOR = '#e74c3c';

/**
 * プレイヤーのマレット移動範囲（Y 軸）を取得する
 * player1/player2: 下半分/上半分（2Pモード互換）
 * player3/player4: getPlayerZone 経由で上半分に制約
 */
export function getPlayerYBounds(
  playerSlot: 'player1' | 'player2' | 'player3' | 'player4',
  constants: GameConstants
): { minY: number; maxY: number } {
  // player3/player4 は4分割ゾーンから取得
  if (playerSlot === 'player3' || playerSlot === 'player4') {
    const zone = getPlayerZone(playerSlot, constants);
    return { minY: zone.minY, maxY: zone.maxY };
  }
  const { HEIGHT: H } = constants.CANVAS;
  const MR = constants.SIZES.MALLET;
  const minY = playerSlot === 'player2'
    ? MR + MALLET_WALL_MARGIN
    : H / 2 + MR + MALLET_CENTER_LINE_MARGIN;
  const maxY = playerSlot === 'player2'
    ? H / 2 - MR - MALLET_CENTER_LINE_MARGIN
    : H - MR - MALLET_WALL_MARGIN;
  return { minY, maxY };
}

/**
 * プレイヤーのマレット移動範囲（X 軸）を取得する
 */
export function getPlayerXBounds(
  constants: GameConstants
): { minX: number; maxX: number } {
  const { WIDTH: W } = constants.CANVAS;
  const MR = constants.SIZES.MALLET;
  return { minX: MR + MALLET_WALL_MARGIN, maxX: W - MR - MALLET_WALL_MARGIN };
}

/**
 * 2v2 モードの4分割ゾーン境界を取得する
 * 各マレットは自分のゾーン内でのみ移動可能
 */
export function getPlayerZone(
  slot: 'player1' | 'player2' | 'player3' | 'player4',
  constants: GameConstants
): { minX: number; maxX: number; minY: number; maxY: number } {
  const { WIDTH: W, HEIGHT: H } = constants.CANVAS;
  const MR = constants.SIZES.MALLET;
  const margin = MALLET_WALL_MARGIN;
  const centerMargin = MALLET_CENTER_LINE_MARGIN;
  const halfW = W / 2;
  const halfH = H / 2;

  switch (slot) {
    case 'player1': // 左下
      return { minX: MR + margin, maxX: halfW, minY: halfH + MR + centerMargin, maxY: H - MR - margin };
    case 'player2': // 右下
      return { minX: halfW, maxX: W - MR - margin, minY: halfH + MR + centerMargin, maxY: H - MR - margin };
    case 'player3': // 左上
      return { minX: MR + margin, maxX: halfW, minY: MR + margin, maxY: halfH - MR - centerMargin };
    case 'player4': // 右上
      return { minX: halfW, maxX: W - MR - margin, minY: MR + margin, maxY: halfH - MR - centerMargin };
  }
}

/**
 * 画面座標を Canvas 座標に変換する
 */
export function screenToCanvas(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  constants: GameConstants
): { canvasX: number; canvasY: number } {
  return {
    canvasX: ((clientX - rect.left) / rect.width) * constants.CANVAS.WIDTH,
    canvasY: ((clientY - rect.top) / rect.height) * constants.CANVAS.HEIGHT,
  };
}

// 内部解像度 600x1200 固定（CSS でビューポートに応答的にスケーリング）
export const CONSTANTS: GameConstants = {
  CANVAS: { WIDTH: 600, HEIGHT: 1200 },
  SIZES: { MALLET: 42, PUCK: 21, ITEM: 24 },
  PHYSICS: { FRICTION: 0.998, MIN_SPEED: 2.0, MAX_POWER: 16 },
  TIMING: { ITEM_SPAWN: 6000, GOAL_EFFECT: 1500, FLASH: 500, HELP_TIMEOUT: 5000, FEVER_TRIGGER: 15000, FEVER_INTERVAL: 10000, OBSTACLE_RESPAWN: 5000 },
  CPU: { easy: 2.0, normal: 4.7, hard: 8.0 },
  FEVER: { MAX_EXTRA_PUCKS: 2 },
  COMEBACK: { THRESHOLD: 3, MALLET_BONUS: 0.1, GOAL_REDUCTION: 0.1 },
};

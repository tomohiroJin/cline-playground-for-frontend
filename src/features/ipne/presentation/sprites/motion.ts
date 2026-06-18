/**
 * キャラクターモーション計算（純粋関数）
 *
 * 描画層から呼ぶアニメーションの数式を集約する。Canvas 非依存・副作用なし。
 */
import type { Direction } from './playerSprites';

/** 歩行フレーム循環順（idle=0 を除き walk1→mid→walk2→mid） */
const WALK_CYCLE = [1, 2, 3, 2] as const;

/** 歩行バウンスの振幅（px、spriteScale 適用前） */
export const WALK_BOB_AMPLITUDE = 2;

/** 踏み込みスカッシュの最大縮み量 */
const SQUASH_DEPTH = 0.06;

/** 攻撃の予備動作・踏み込み量・拡大ピーク（px / 比率、spriteScale 適用前） */
const ATTACK_ANTICIPATION = 3;
const ATTACK_LUNGE = 6;
const ATTACK_SCALE_PEAK = 0.08;

/**
 * 歩行アニメのフレーム番号を返す（4枚循環で walk2 を含める）。
 */
export function selectWalkFrameIndex(now: number, frameDuration: number): number {
  const step = Math.floor(now / frameDuration) % WALK_CYCLE.length;
  return WALK_CYCLE[step];
}

/**
 * 歩行中の上下バウンス量（px、上方向が正）。
 *
 * @param now 現在の経過時間（ms）
 * @param frameDuration 1フレームの時間（ms）。正の値であること。
 */
export function computeWalkBob(now: number, frameDuration: number): number {
  const phase = (now / frameDuration) * Math.PI;
  return Math.abs(Math.sin(phase)) * WALK_BOB_AMPLITUDE;
}

/**
 * 接地（踏み込み）時の縦スケール。接地の瞬間に最小、空中で 1.0。
 *
 * @param now 現在の経過時間（ms）
 * @param frameDuration 1フレームの時間（ms）。正の値であること。
 */
export function computeSquash(now: number, frameDuration: number): number {
  const lift = Math.abs(Math.sin((now / frameDuration) * Math.PI));
  return 1 - SQUASH_DEPTH * (1 - lift);
}

/** 方向ごとの前進単位ベクトル（スクリーン座標、y+ が下） */
const DIRECTION_VECTORS: Record<Direction, { x: number; y: number }> = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** 攻撃モーションの位置・拡大トランスフォーム（px / 比率、spriteScale 適用前） */
export interface AttackTransform {
  dx: number;
  dy: number;
  scale: number;
}

/**
 * 攻撃モーションのトランスフォームを返す。
 * 予備動作（後退）→ 踏み込み（前進＋拡大）→ オーバーシュート復帰。
 *
 * @param progress 攻撃進行度 0..1（範囲外はクランプ）
 */
export function computeAttackTransform(progress: number, direction: Direction): AttackTransform {
  const t = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  const v = DIRECTION_VECTORS[direction];
  let forward: number;
  let scale: number;
  if (t < 0.2) {
    const k = t / 0.2;
    forward = -ATTACK_ANTICIPATION * k;
    scale = 1;
  } else if (t < 0.5) {
    const k = (t - 0.2) / 0.3;
    forward = -ATTACK_ANTICIPATION + (ATTACK_ANTICIPATION + ATTACK_LUNGE) * k;
    scale = 1 + ATTACK_SCALE_PEAK * Math.sin(k * Math.PI);
  } else {
    const k = (t - 0.5) / 0.5;
    forward = ATTACK_LUNGE * (1 - k);
    scale = 1;
  }
  return { dx: v.x * forward, dy: v.y * forward, scale };
}

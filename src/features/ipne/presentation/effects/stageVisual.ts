/**
 * ステージ進行見た目変化
 *
 * ステージクリア報酬で選択した能力に応じて、プレイヤーに視覚的なアクセントを追加する。
 * - maxHp強化: キャラ外枠に淡い青白の輝き（シールド風）
 * - 攻撃力強化: 武器ティア計算に反映（weaponEffect.ts 参照）
 * - 移動速度強化: 移動時に足元に淡い残像
 * - 攻撃速度強化: 手元/武器周囲に小さな回転パーティクル
 * - 回復量強化: 回復タイミングで緑のパーティクル上昇
 */

import type { StageRewardHistory, DirectionValue } from '../../types';

/** 報酬別エフェクト有効状態 */
export interface RewardEffectFlags {
  /** maxHp強化: シールド輝き */
  hasShieldGlow: boolean;
  /** 移動速度強化: 残像 */
  hasAfterImage: boolean;
  /** 攻撃速度強化: 回転パーティクル */
  hasSpinParticles: boolean;
  /** 回復量強化: 回復パーティクル */
  hasHealParticles: boolean;
}

/** 残像データ */
export interface AfterImage {
  x: number;
  y: number;
  alpha: number;
  direction: DirectionValue;
}

/** 残像の最大保持数 */
const MAX_AFTER_IMAGES = 2;

/** 残像の初期アルファ値 */
const AFTER_IMAGE_INITIAL_ALPHA = 0.3;

/** シールド輝きの脈動周期（ms） */
const SHIELD_PULSE_SPEED = 1500;

/** 回転パーティクルの数 */
const SPIN_PARTICLE_COUNT = 3;

/** 回転パーティクルの回転速度（ラジアン/ms） */
const SPIN_SPEED = 0.004;

/** 回復パーティクルの数 */
const HEAL_PARTICLE_COUNT = 3;

/** 回復パーティクルの上昇サイクル（ms） */
const HEAL_CYCLE = 2000;

/**
 * ステージ報酬履歴からアクティブなビジュアルエフェクトを判定する
 */
export function getActiveRewardEffects(rewards: StageRewardHistory[]): RewardEffectFlags {
  const flags: RewardEffectFlags = {
    hasShieldGlow: false,
    hasAfterImage: false,
    hasSpinParticles: false,
    hasHealParticles: false,
  };

  for (const reward of rewards) {
    switch (reward.reward) {
      case 'max_hp':
        flags.hasShieldGlow = true;
        break;
      case 'move_speed':
        flags.hasAfterImage = true;
        break;
      case 'attack_speed':
        flags.hasSpinParticles = true;
        break;
      case 'heal_bonus':
        flags.hasHealParticles = true;
        break;
    }
  }

  return flags;
}

/**
 * シールド輝きを描画する（maxHp強化時、常時表示）
 *
 * キャラ外枠に淡い青白の輝きリングを脈動付きで描画する。
 */
export function drawShieldGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  now: number,
): void {
  const phase = (now / SHIELD_PULSE_SPEED) * Math.PI * 2;
  const alpha = 0.15 + 0.1 * Math.sin(phase);
  const radius = tileSize * 0.55;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'rgba(147, 197, 253, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * 残像管理クラス（移動速度強化時）
 *
 * 移動時に過去の位置を記録し、半透明の残像として描画できる。
 */
export class AfterImageManager {
  private images: AfterImage[] = [];

  /**
   * 位置を記録する（移動時に呼び出す）
   */
  recordPosition(x: number, y: number, direction: DirectionValue, _now: number): void {
    // 同じ位置なら記録しない
    const last = this.images[this.images.length - 1];
    if (last && last.x === x && last.y === y) return;

    this.images.push({
      x,
      y,
      alpha: AFTER_IMAGE_INITIAL_ALPHA,
      direction,
    });

    // 最大保持数を超えた場合、古いものを削除
    while (this.images.length > MAX_AFTER_IMAGES) {
      this.images.shift();
    }
  }

  /**
   * 現在の残像データを取得する
   */
  getAfterImages(): readonly AfterImage[] {
    return this.images;
  }

  /**
   * 残像をクリアする
   */
  clear(): void {
    this.images = [];
  }
}

/**
 * 残像を描画する（移動速度強化時）
 *
 * 半透明の円で過去の位置を表示する。
 */
export function drawAfterImage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  alpha: number,
): void {
  const radius = tileSize * 0.35;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(147, 197, 253, 0.5)';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 回転パーティクルを描画する（攻撃速度強化時、常時微小表示）
 *
 * 手元/武器周囲に小さなパーティクルが回転する。
 */
export function drawSpinParticles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  now: number,
): void {
  const orbitRadius = tileSize * 0.4;
  const particleSize = 2;
  const baseAngle = now * SPIN_SPEED;

  ctx.save();
  ctx.globalAlpha = 0.6;

  for (let i = 0; i < SPIN_PARTICLE_COUNT; i++) {
    const angle = baseAngle + (i * Math.PI * 2) / SPIN_PARTICLE_COUNT;
    const px = x + Math.cos(angle) * orbitRadius;
    const py = y + Math.sin(angle) * orbitRadius;

    ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.beginPath();
    ctx.arc(px, py, particleSize, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 回復パーティクルを描画する（回復量強化時、自動回復タイミングで表示）
 *
 * 緑のパーティクルがゆっくり上昇する。
 */
export function drawHealParticles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  now: number,
): void {
  const cycleProgress = (now % HEAL_CYCLE) / HEAL_CYCLE;

  ctx.save();

  for (let i = 0; i < HEAL_PARTICLE_COUNT; i++) {
    const offset = i / HEAL_PARTICLE_COUNT;
    const particleProgress = (cycleProgress + offset) % 1.0;

    // 上昇: tileSize の半分の範囲を移動
    const riseHeight = tileSize * 0.5;
    const py = y - particleProgress * riseHeight;
    // 左右にわずかに揺れる
    const px = x + Math.sin(particleProgress * Math.PI * 4 + i * 2) * tileSize * 0.15;

    // フェードアウト
    const alpha = 0.6 * (1.0 - particleProgress);
    const size = 2 + (1 - particleProgress);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

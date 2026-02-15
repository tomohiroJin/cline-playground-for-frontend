/**
 * 死亡エフェクト
 *
 * プレイヤー死亡時の3フェーズアニメーションを管理する。
 * - フェーズ1（0.0〜0.5秒）: 点滅
 * - フェーズ2（0.5〜1.0秒）: 赤変色
 * - フェーズ3（1.0〜1.5秒）: パーティクル分解
 */

import { Particle } from './effectTypes';
import { updateParticles, drawParticles } from './particleSystem';

/** 死亡アニメーションの総時間（ミリ秒） */
export const DEATH_ANIMATION_DURATION = 1500;

/** 各フェーズの境界時間（ミリ秒） */
const PHASE1_END = 500;
const PHASE2_END = 1000;

/** 点滅間隔（ミリ秒） */
const BLINK_INTERVAL = 100;

/** パーティクル分解の粒子数 */
const DECOMPOSE_PARTICLE_COUNT = 14;

/** 死亡アニメーションの現在フェーズ */
export const DeathPhase = {
  BLINK: 'blink',
  RED_SHIFT: 'red_shift',
  DECOMPOSE: 'decompose',
  DONE: 'done',
} as const;

export type DeathPhaseValue = (typeof DeathPhase)[keyof typeof DeathPhase];

/**
 * 指定範囲内のランダム値を返す
 */
function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * 死亡エフェクト管理クラス
 *
 * start() で開始し、update() / draw() で毎フレーム更新・描画する。
 */
export class DeathEffect {
  /** アニメーション開始時刻（ミリ秒） */
  private startTime: number = 0;
  /** アニメーション実行中フラグ */
  private active: boolean = false;
  /** パーティクル分解用パーティクル */
  private particles: Particle[] = [];
  /** パーティクル生成済みフラグ */
  private particlesCreated: boolean = false;

  /**
   * 死亡アニメーションを開始する
   *
   * @param now - 現在時刻（ミリ秒）
   */
  start(now: number): void {
    this.startTime = now;
    this.active = true;
    this.particles = [];
    this.particlesCreated = false;
  }

  /**
   * アニメーションが実行中かどうかを返す
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * 現在のフェーズを取得する
   *
   * @param now - 現在時刻（ミリ秒）
   * @returns 現在のフェーズ
   */
  getPhase(now: number): DeathPhaseValue {
    if (!this.active) return DeathPhase.DONE;

    const elapsed = now - this.startTime;
    if (elapsed < PHASE1_END) return DeathPhase.BLINK;
    if (elapsed < PHASE2_END) return DeathPhase.RED_SHIFT;
    if (elapsed < DEATH_ANIMATION_DURATION) return DeathPhase.DECOMPOSE;
    return DeathPhase.DONE;
  }

  /**
   * フェーズ1: プレイヤーを表示するかどうかを返す（点滅判定）
   *
   * @param now - 現在時刻（ミリ秒）
   * @returns true の場合表示する
   */
  isPlayerVisible(now: number): boolean {
    const phase = this.getPhase(now);
    if (phase === DeathPhase.BLINK) {
      // 100ms間隔で点滅
      const elapsed = now - this.startTime;
      return Math.floor(elapsed / BLINK_INTERVAL) % 2 === 0;
    }
    if (phase === DeathPhase.RED_SHIFT) {
      return true;
    }
    // パーティクル分解フェーズではプレイヤー非表示
    return false;
  }

  /**
   * フェーズ2: 赤変色の透明度を取得する
   *
   * @param now - 現在時刻（ミリ秒）
   * @returns 赤色オーバーレイの透明度（0.0〜0.8）
   */
  getRedShiftAlpha(now: number): number {
    const phase = this.getPhase(now);
    if (phase !== DeathPhase.RED_SHIFT) return 0;

    const elapsed = now - this.startTime;
    // 0.5秒〜1.0秒で 0.0 → 0.8 に線形補間
    const progress = (elapsed - PHASE1_END) / (PHASE2_END - PHASE1_END);
    return Math.min(0.8, Math.max(0, progress * 0.8));
  }

  /**
   * パーティクルを更新する
   *
   * @param now - 現在時刻（ミリ秒）
   * @param playerX - プレイヤーのスクリーン座標 X
   * @param playerY - プレイヤーのスクリーン座標 Y
   * @param playerColors - プレイヤースプライトの代表色配列
   */
  update(
    now: number,
    playerX: number,
    playerY: number,
    playerColors: string[]
  ): void {
    if (!this.active) return;

    const elapsed = now - this.startTime;

    // アニメーション終了判定
    if (elapsed >= DEATH_ANIMATION_DURATION) {
      this.active = false;
      return;
    }

    const phase = this.getPhase(now);

    // フェーズ3: パーティクル生成（一度だけ）
    if (phase === DeathPhase.DECOMPOSE && !this.particlesCreated) {
      this.particlesCreated = true;
      this.particles = this.createDecomposeParticles(
        playerX,
        playerY,
        playerColors
      );
    }

    // パーティクル更新（重力付き）
    if (this.particles.length > 0) {
      const deltaTime = 0.1; // 100ms 間隔の呼び出しを想定
      this.particles = updateParticles(this.particles, deltaTime, 150);
    }
  }

  /**
   * 死亡エフェクトを描画する
   *
   * フェーズ2の赤変色オーバーレイとフェーズ3のパーティクルを描画する。
   * プレイヤースプライト自体の描画は呼び出し元が isPlayerVisible() を使って制御する。
   *
   * @param ctx - Canvas コンテキスト
   * @param now - 現在時刻（ミリ秒）
   * @param playerX - プレイヤーのスクリーン座標 X
   * @param playerY - プレイヤーのスクリーン座標 Y
   * @param playerSize - プレイヤーの描画サイズ（px）
   */
  draw(
    ctx: CanvasRenderingContext2D,
    now: number,
    playerX: number,
    playerY: number,
    playerSize: number
  ): void {
    if (!this.active) return;

    const phase = this.getPhase(now);

    // フェーズ2: 赤色オーバーレイをプレイヤー位置に重ねる
    if (phase === DeathPhase.RED_SHIFT) {
      const alpha = this.getRedShiftAlpha(now);
      if (alpha > 0) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(
          playerX - playerSize / 2,
          playerY - playerSize / 2,
          playerSize,
          playerSize
        );
        ctx.restore();
      }
    }

    // フェーズ3: パーティクル描画
    if (phase === DeathPhase.DECOMPOSE && this.particles.length > 0) {
      drawParticles(ctx, this.particles, 0, 0);
    }
  }

  /**
   * リセットする
   */
  reset(): void {
    this.active = false;
    this.startTime = 0;
    this.particles = [];
    this.particlesCreated = false;
  }

  /**
   * パーティクル分解用のパーティクルを生成する
   *
   * スプライトのピクセルが飛散するイメージで、プレイヤー位置から
   * ランダム方向に放射状にパーティクルを生成する。
   */
  private createDecomposeParticles(
    x: number,
    y: number,
    colors: string[]
  ): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < DECOMPOSE_PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / DECOMPOSE_PARTICLE_COUNT + randomRange(-0.4, 0.4);
      const speed = randomRange(40, 120);
      particles.push({
        x: x + randomRange(-6, 6),
        y: y + randomRange(-6, 6),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randomRange(20, 60),
        size: randomRange(2, 5),
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        life: 1.0,
        decay: 1.8,
      });
    }
    return particles;
  }
}

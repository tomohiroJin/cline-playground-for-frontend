/**
 * エフェクトマネージャー
 *
 * 視覚エフェクトの統一管理を行うクラス。
 * パーティクルエフェクトの追加・更新・描画・クリアを提供する。
 */

import { EffectType, EffectTypeValue, EffectOptions, GameEffect } from './effectTypes';
import {
  updateParticles,
  drawParticles,
} from './particleSystem';
import { EFFECT_FACTORIES } from './effectFactories';
import { computeShakeOffset } from './shake';

/** パーティクル上限数 */
const MAX_PARTICLES = 200;

let effectIdCounter = 0;

/**
 * エフェクトIDカウンタをリセットする（テスト用）
 */
export function resetEffectIdCounter(): void {
  effectIdCounter = 0;
}

/**
 * エフェクトマネージャー
 *
 * 全エフェクトの追加・更新・描画・クリアを管理する。
 */
export class EffectManager {
  private effects: GameEffect[] = [];

  /**
   * エフェクトを追加する
   *
   * @param type - エフェクト種類
   * @param x - ワールド座標 X（スクリーン座標）
   * @param y - ワールド座標 Y（スクリーン座標）
   * @param now - 現在時刻（ミリ秒）
   */
  addEffect(type: EffectTypeValue, x: number, y: number, now: number = Date.now(), options?: EffectOptions): void {
    // 未処理タイプ(LOW_HP_WARNING)でも id カウンタは進める（元の挙動を保存）
    effectIdCounter += 1;
    const id = `effect-${effectIdCounter}`;

    const factory = EFFECT_FACTORIES[type];
    if (factory) {
      const { effect, followUps } = factory({ id, x, y, now, options });
      // ENEMY_DEATH(enemyType 未指定) のように effect を生成しないケースを保存
      if (effect) {
        this.effects.push(effect);
      }
      // 合成: 親エフェクトを push してから追従(SCREEN_SHAKE)を追加（元の順序を維持）
      followUps?.forEach((f) => this.addEffect(f.type, f.x, f.y, now, f.options));
    }

    // 元と同じく factory ブロックの後で常に呼ぶ（未処理タイプでも実行）
    this.enforceParticleLimit();
  }

  /** 前回 updateAt 呼び出し時のタイムスタンプ（実経過時間の算出用） */
  private lastUpdateAt?: number;

  /**
   * タイムスタンプから実経過時間を算出して更新する
   *
   * rAF 駆動（可変フレームレート）用。凍結された now が渡された場合は
   * デルタ 0 となり、パーティクル等が自然に静止する（ヒットストップ対応）。
   */
  updateAt(now: number): void {
    const deltaSec = this.lastUpdateAt === undefined
      ? 0
      : Math.min(0.1, Math.max(0, (now - this.lastUpdateAt) / 1000));
    this.lastUpdateAt = now;
    this.update(deltaSec, now);
  }

  /**
   * 全エフェクトを更新する
   *
   * @param deltaTime - 経過時間（秒）
   * @param now - 現在時刻（ミリ秒）
   */
  update(deltaTime: number, now: number = Date.now()): void {
    const alive: GameEffect[] = [];

    for (const effect of this.effects) {
      const elapsed = now - effect.startTime;

      // 持続時間を超えたエフェクトは削除
      if (elapsed > effect.duration) continue;

      const progress = elapsed / effect.duration;

      // パーティクル更新
      const gravity = effect.type === EffectType.DAMAGE ||
        effect.type === EffectType.TRAP_DAMAGE
        ? 120
        : effect.type === EffectType.STAGE_CLEAR
        ? 60
        : 0;
      effect.particles = updateParticles(effect.particles, deltaTime, gravity);

      // 画面シェイク減衰更新
      if (effect.shakeIntensity !== undefined && effect.shakeDecay !== undefined) {
        effect.shakeIntensity = Math.max(0, effect.shakeIntensity - effect.shakeDecay * deltaTime);
      }

      // リングエフェクト更新
      if (effect.ringMaxRadius !== undefined) {
        effect.ringRadius = progress * effect.ringMaxRadius;
      }

      // 画面フラッシュ更新
      if (effect.flashAlpha !== undefined) {
        // 200ms でフェードアウト
        const flashDuration = 200;
        effect.flashAlpha = elapsed < flashDuration
          ? 1.0 - elapsed / flashDuration
          : 0;
      }

      alive.push(effect);
    }

    this.effects = alive;
  }

  /**
   * 全エフェクトを描画する
   *
   * @param ctx - Canvas コンテキスト
   * @param canvasWidth - キャンバス幅
   * @param canvasHeight - キャンバス高さ
   */
  draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    for (const effect of this.effects) {
      // パーティクル描画
      drawParticles(ctx, effect.particles, 0, 0);

      // リングエフェクト描画（レベルアップ、テレポート罠）
      if (effect.ringRadius !== undefined && effect.ringRadius > 0) {
        const progress = (Date.now() - effect.startTime) / effect.duration;
        const ringAlpha = Math.max(0, 1.0 - progress);

        ctx.save();
        ctx.globalAlpha = ringAlpha;
        ctx.strokeStyle = effect.type === EffectType.LEVEL_UP
          ? '#fbbf24'
          : '#7c3aed';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 画面フラッシュ描画（ボス撃破、レベルアップ等）
      if (effect.flashAlpha !== undefined && effect.flashAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = effect.flashAlpha * 0.6;
        ctx.fillStyle = effect.flashColor ?? '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
      }
    }
  }

  /**
   * 現在の画面シェイクオフセットを取得する
   * シェイク中は {x, y} を返し、シェイク終了後は null を返す
   *
   * @param now - 現在時刻（ms）。凍結された時刻を渡すとシェイクも静止する
   */
  getShakeOffset(now: number): { x: number; y: number } | null {
    for (const effect of this.effects) {
      if (effect.type === EffectType.SCREEN_SHAKE && effect.shakeIntensity && effect.shakeIntensity > 0.1) {
        return computeShakeOffset(effect.shakeIntensity, now - effect.startTime, effect.shakeDirection);
      }
    }
    return null;
  }

  /**
   * 全エフェクトをクリアする
   */
  clear(): void {
    this.effects = [];
  }

  /**
   * 現在のエフェクト数を取得する（テスト用）
   */
  getEffectCount(): number {
    return this.effects.length;
  }

  /**
   * 全エフェクトを取得する（テスト用）
   */
  getEffects(): readonly GameEffect[] {
    return this.effects;
  }

  /**
   * 全パーティクル数の合計を取得する（テスト用）
   */
  getTotalParticleCount(): number {
    return this.effects.reduce((sum, e) => sum + e.particles.length, 0);
  }

  /**
   * パーティクル数の上限を強制する
   * 上限を超えた場合、古いエフェクトから順に削除する
   */
  private enforceParticleLimit(): void {
    let total = this.getTotalParticleCount();
    while (total > MAX_PARTICLES && this.effects.length > 1) {
      const removed = this.effects.shift();
      if (removed) {
        total -= removed.particles.length;
      }
    }
  }
}

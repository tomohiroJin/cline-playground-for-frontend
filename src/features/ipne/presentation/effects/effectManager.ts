/**
 * エフェクトマネージャー
 *
 * 視覚エフェクトの統一管理を行うクラス。
 * パーティクルエフェクトの追加・更新・描画・クリアを提供する。
 */

import { EffectType, EffectTypeValue, EffectOptions, GameEffect } from './effectTypes';
import {
  createRadialParticles,
  createRisingParticles,
  createSpiralParticles,
  createPulseParticles,
  createTrailParticles,
  updateParticles,
  drawParticles,
} from './particleSystem';
import { getHitEffectConfig } from './hitEffectScaling';
import { getEnemyDeathParticleConfig } from './enemyDeath';
import { getItemPickupEffectConfig } from './itemFeedback';

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
    effectIdCounter += 1;
    const id = `effect-${effectIdCounter}`;

    switch (type) {
      case EffectType.ATTACK_HIT: {
        const pl = options?.powerLevel ?? 1;
        const combo = options?.comboMultiplier ?? 1.0;
        const hitConfig = getHitEffectConfig(pl);
        const count = Math.round(hitConfig.particleCount * combo);
        const sizeMin = 2 * hitConfig.sizeMultiplier;
        const sizeMax = 4 * hitConfig.sizeMultiplier;
        const speedMin = 60 * hitConfig.speedMultiplier;
        const speedMax = 150 * hitConfig.speedMultiplier;

        this.effects.push({
          id,
          type,
          x,
          y,
          startTime: now,
          duration: 300,
          particles: createRadialParticles(
            count, x, y,
            ['#ffffff', '#ffffcc', '#ffff99'],
            speedMin, speedMax,
            sizeMin, sizeMax,
            3.0
          ),
          ringRadius: hitConfig.hasShockwave ? 0 : undefined,
          ringMaxRadius: hitConfig.hasShockwave ? (8 + pl * 4) : undefined,
          flashAlpha: hitConfig.hasFlash ? 0.4 : undefined,
        });

        // 画面シェイク追加（powerLevel 4）
        if (hitConfig.hasShake) {
          this.addEffect(EffectType.SCREEN_SHAKE, 0, 0, now, { damage: 3 });
        }
        break;
      }

      case EffectType.DAMAGE:
        this.effects.push({
          id,
          type,
          x,
          y,
          startTime: now,
          duration: 400,
          particles: createRisingParticles(
            6, x, y,
            ['#ef4444', '#dc2626', '#ff6b6b'],
            2, 4,
            2.5
          ),
        });
        break;

      case EffectType.TRAP_DAMAGE:
        this.effects.push({
          id,
          type,
          x,
          y,
          startTime: now,
          duration: 350,
          particles: createRisingParticles(
            6, x, y,
            ['#dc2626', '#ef4444', '#f87171'],
            2, 3,
            2.8
          ),
        });
        break;

      case EffectType.TRAP_SLOW:
        this.effects.push({
          id,
          type,
          x,
          y,
          startTime: now,
          duration: 500,
          particles: createRadialParticles(
            8, x, y,
            ['#3b82f6', '#60a5fa', '#93c5fd'],
            15, 40,
            3, 5,
            2.0
          ),
        });
        break;

      case EffectType.TRAP_TELEPORT:
        this.effects.push({
          id,
          type,
          x,
          y,
          startTime: now,
          duration: 400,
          particles: createRadialParticles(
            10, x, y,
            ['#7c3aed', '#a78bfa', '#c4b5fd'],
            30, 80,
            2, 4,
            2.5
          ),
          ringRadius: 0,
          ringMaxRadius: 30,
        });
        break;

      case EffectType.ITEM_PICKUP: {
        const itemType = options?.itemType;
        const itemConfig = itemType ? getItemPickupEffectConfig(itemType) : undefined;
        const pCount = itemConfig?.particleCount ?? 6;
        const pColors = itemConfig?.colors ?? ['#fbbf24', '#fcd34d', '#fef08a'];
        const pPattern = itemConfig?.pattern ?? 'rising';

        const particles =
          pPattern === 'spiral'
            ? createSpiralParticles(pCount, x, y, pColors, 80, 1.5)
            : pPattern === 'radial'
            ? createRadialParticles(pCount, x, y, pColors, 40, 100, 2, 4, 2.0)
            : createRisingParticles(pCount, x, y, pColors, 2, 3, 2.0);

        this.effects.push({
          id,
          type,
          x,
          y,
          startTime: now,
          duration: 500,
          particles,
        });
        break;
      }

      case EffectType.LEVEL_UP:
        this.effects.push({
          id,
          type,
          x,
          y,
          startTime: now,
          duration: 1500,
          particles: createSpiralParticles(
            24, x, y,
            ['#fbbf24', '#fcd34d', '#fef08a', '#ffffff'],
            100,
            0.7
          ),
          ringRadius: 0,
          ringMaxRadius: 40,
          flashAlpha: 0.4,
          flashColor: '#fbbf24',
        });
        break;

      case EffectType.BOSS_KILL:
        this.effects.push({
          id,
          type,
          x,
          y,
          startTime: now,
          duration: 1200,
          particles: createRadialParticles(
            24, x, y,
            ['#dc2626', '#f97316', '#ffffff', '#fbbf24'],
            80, 200,
            3, 6,
            0.8
          ),
          flashAlpha: 1.0,
        });
        break;

      case EffectType.ENEMY_ATTACK: {
        const variant = options?.variant ?? 'melee';
        if (variant === 'boss') {
          this.effects.push({
            id,
            type,
            x,
            y,
            startTime: now,
            duration: 500,
            particles: createPulseParticles(
              16, x, y,
              ['#dc2626', '#ef4444', '#f87171', '#ffffff'],
              100,
              2.0
            ),
          });
        } else if (variant === 'ranged') {
          this.effects.push({
            id,
            type,
            x,
            y,
            startTime: now,
            duration: 400,
            particles: createTrailParticles(
              8, x, y,
              0, -1,
              ['#f97316', '#fdba74', '#fff7ed'],
              120,
              2.5
            ),
          });
        } else {
          // melee
          this.effects.push({
            id,
            type,
            x,
            y,
            startTime: now,
            duration: 300,
            particles: createRadialParticles(
              8, x, y,
              ['#ef4444', '#dc2626', '#ff6b6b'],
              50, 120,
              2, 4,
              3.0
            ),
          });
        }
        break;
      }

      case EffectType.SCREEN_SHAKE: {
        const intensity = Math.min(4, options?.damage ? options.damage * 0.5 : 2);
        this.effects.push({
          id,
          type,
          x: 0,
          y: 0,
          startTime: now,
          duration: 200,
          particles: [],
          shakeIntensity: intensity,
          shakeDecay: intensity / 0.2,
        });
        break;
      }

      case EffectType.STAGE_CLEAR: {
        const stageColors = [
          ['#60a5fa', '#93c5fd', '#ffffff'],
          ['#34d399', '#6ee7b7', '#ffffff'],
          ['#fbbf24', '#fcd34d', '#ffffff'],
          ['#f472b6', '#f9a8d4', '#ffffff'],
          ['#a78bfa', '#c4b5fd', '#fbbf24', '#ffffff'],
        ];
        const stageIdx = Math.min((options?.stageNumber ?? 1) - 1, stageColors.length - 1);
        this.effects.push({
          id,
          type,
          x,
          y,
          startTime: now,
          duration: 1500,
          particles: createSpiralParticles(
            32, x, y,
            stageColors[stageIdx],
            100,
            0.7
          ),
          flashAlpha: 1.0,
        });
        break;
      }

      case EffectType.ENEMY_DEATH: {
        const enemyType = options?.enemyType;
        if (enemyType) {
          const deathConfig = getEnemyDeathParticleConfig(enemyType);
          const combo = options?.comboMultiplier ?? 1.0;
          const count = Math.round(deathConfig.particleCount * combo);
          this.effects.push({
            id,
            type,
            x,
            y,
            startTime: now,
            duration: deathConfig.duration,
            particles: createRadialParticles(
              count, x, y,
              deathConfig.colors,
              deathConfig.speedMin, deathConfig.speedMax,
              deathConfig.sizeMin, deathConfig.sizeMax,
              2.0
            ),
          });
        }
        break;
      }
    }

    // パーティクル上限を超えた場合、古いエフェクトから削除
    this.enforceParticleLimit();
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
   */
  getShakeOffset(): { x: number; y: number } | null {
    for (const effect of this.effects) {
      if (effect.type === EffectType.SCREEN_SHAKE && effect.shakeIntensity && effect.shakeIntensity > 0.1) {
        const intensity = effect.shakeIntensity;
        return {
          x: (Math.random() - 0.5) * 2 * intensity,
          y: (Math.random() - 0.5) * 2 * intensity,
        };
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

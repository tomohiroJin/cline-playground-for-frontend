/**
 * スピードエフェクト
 *
 * 高速移動時の残像とダッシュダスト（土煙パーティクル）を管理・描画する。
 * 発動条件: effectiveSpeed >= SPEED_EFFECT_THRESHOLD (5.2)
 *           かつ同一方向に SUSTAINED_MOVE_FRAMES (8) フレーム以上連続移動
 */

import { DirectionValue, Direction } from '../../types';
import { SPEED_EFFECT_THRESHOLD } from '../../movement';
import { SpriteRenderer } from '../sprites/spriteRenderer';
import { SpriteDefinition } from '../sprites/spriteData';

/** 同一方向への連続移動フレーム数しきい値（約0.5秒） */
export const SUSTAINED_MOVE_FRAMES = 8;

/** 残像データ */
export interface AfterImage {
  /** X座標（スクリーン座標） */
  x: number;
  /** Y座標（スクリーン座標） */
  y: number;
  /** プレイヤーの向き */
  direction: DirectionValue;
  /** 透明度 */
  alpha: number;
  /** 記録時のスプライトフレームインデックス */
  spriteIndex: number;
}

/** ダッシュダスト（土煙パーティクル） */
interface DashDust {
  /** X座標 */
  x: number;
  /** Y座標 */
  y: number;
  /** X方向速度（移動方向の逆方向に漂う） */
  vx: number;
  /** Y方向速度（上方向にわずかに浮く） */
  vy: number;
  /** サイズ（2 or 3、ドット絵風正方形） */
  size: number;
  /** 透明度（初期 0.3～0.5 → 0.0 まで減衰） */
  alpha: number;
  /** 残り寿命（1.0 → 0.0） */
  life: number;
}

/** 残像の透明度（最新→最古） */
const AFTER_IMAGE_ALPHAS = [0.5, 0.3, 0.1];

/** 残像の最大保持数 */
const MAX_AFTER_IMAGES = 3;

/** 残像フェードアウト速度（1フレームあたりの減衰量） */
const AFTER_IMAGE_FADE_RATE = 0.03;

/** ダッシュダストの色（砂色） */
const DASH_DUST_COLOR = '#8b7355';

/** ダッシュダストの最大保持数 */
const MAX_DASH_DUST = 6;

/** ダッシュダストの寿命減衰率（1フレームあたり、約0.3秒で消滅: 1/18 ≈ 0.055） */
const DASH_DUST_DECAY = 0.055;

/**
 * スピードエフェクト管理クラス
 *
 * 過去のフレーム位置を保持し、残像とダッシュダストを描画する。
 */
export class SpeedEffectManager {
  private afterImages: AfterImage[] = [];
  private dustParticles: DashDust[] = [];
  private lastPlayerX = -1;
  private lastPlayerY = -1;

  /**
   * プレイヤー位置を記録する。
   * 移動した場合のみ残像を追加し、ダッシュダストを生成する。
   *
   * @param screenX - スクリーンX座標
   * @param screenY - スクリーンY座標
   * @param direction - プレイヤーの向き
   * @param isActive - スピードエフェクトがアクティブか
   * @param spriteIndex - 現在のスプライトフレームインデックス
   */
  recordPosition(
    screenX: number,
    screenY: number,
    direction: DirectionValue,
    isActive: boolean,
    spriteIndex: number
  ): void {
    // ダッシュダストは常に更新（フェードアウト処理のため）
    this.updateDust();

    if (!isActive) {
      // 非アクティブ時は既存の残像をフェードアウト
      this.fadeOutAfterImages();
      this.lastPlayerX = screenX;
      this.lastPlayerY = screenY;
      return;
    }

    // 位置が変わった場合のみ残像を追加
    if (screenX !== this.lastPlayerX || screenY !== this.lastPlayerY) {
      if (this.lastPlayerX >= 0 && this.lastPlayerY >= 0) {
        this.afterImages.unshift({
          x: this.lastPlayerX,
          y: this.lastPlayerY,
          direction,
          alpha: AFTER_IMAGE_ALPHAS[0],
          spriteIndex,
        });

        // 最大数を超えた分を削除
        if (this.afterImages.length > MAX_AFTER_IMAGES) {
          this.afterImages = this.afterImages.slice(0, MAX_AFTER_IMAGES);
        }

        // 各残像の透明度を更新
        for (let i = 0; i < this.afterImages.length; i++) {
          this.afterImages[i].alpha = AFTER_IMAGE_ALPHAS[i] ?? 0.1;
        }

        // ダッシュダスト生成（位置が変わった時のみ 1～2 個）
        this.spawnDust(screenX, screenY, direction);
      }

      this.lastPlayerX = screenX;
      this.lastPlayerY = screenY;
    }
  }

  /**
   * 残像をスプライト描画する。
   * プレイヤー描画の直前（描画順序9: スピードエフェクト）に呼ぶ。
   *
   * @param ctx - Canvas コンテキスト
   * @param renderer - スプライトレンダラー
   * @param getSprite - 方向とフレームインデックスからスプライト定義を返す関数
   * @param scale - 描画スケール
   * @param drawSize - スプライト描画サイズ（ピクセル）
   */
  drawAfterImages(
    ctx: CanvasRenderingContext2D,
    renderer: SpriteRenderer,
    getSprite: (direction: DirectionValue, spriteIndex: number) => SpriteDefinition,
    scale: number,
    drawSize: number
  ): void {
    for (const image of this.afterImages) {
      if (image.alpha <= 0) continue;
      const sprite = getSprite(image.direction, image.spriteIndex);
      const drawX = image.x - drawSize / 2;
      const drawY = image.y - drawSize / 2;
      renderer.drawSpriteWithAlpha(ctx, sprite, drawX, drawY, scale, image.alpha);
    }
  }

  /**
   * ダッシュダスト（土煙パーティクル）を描画する。
   *
   * @param ctx - Canvas コンテキスト
   */
  drawDashDust(ctx: CanvasRenderingContext2D): void {
    if (this.dustParticles.length === 0) return;

    ctx.save();
    ctx.fillStyle = DASH_DUST_COLOR;

    for (const dust of this.dustParticles) {
      if (dust.alpha <= 0) continue;
      ctx.globalAlpha = dust.alpha * dust.life;
      ctx.fillRect(
        Math.round(dust.x),
        Math.round(dust.y),
        dust.size,
        dust.size
      );
    }

    ctx.restore();
  }

  /**
   * 残像とダッシュダストが存在するか（描画判定用）
   */
  hasVisibleEffects(): boolean {
    return this.afterImages.some(img => img.alpha > 0) || this.dustParticles.length > 0;
  }

  /**
   * 状態をクリアする
   */
  clear(): void {
    this.afterImages = [];
    this.dustParticles = [];
    this.lastPlayerX = -1;
    this.lastPlayerY = -1;
  }

  /**
   * 残像の数を取得する（テスト用）
   */
  getAfterImageCount(): number {
    return this.afterImages.length;
  }

  /**
   * ダッシュダストの数を取得する（テスト用）
   */
  getDustCount(): number {
    return this.dustParticles.length;
  }

  /**
   * 非アクティブ時に残像をフェードアウトする
   */
  private fadeOutAfterImages(): void {
    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      this.afterImages[i].alpha -= AFTER_IMAGE_FADE_RATE;
      if (this.afterImages[i].alpha <= 0) {
        this.afterImages.splice(i, 1);
      }
    }
  }

  /**
   * ダッシュダストパーティクルを更新する
   */
  private updateDust(): void {
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const dust = this.dustParticles[i];
      dust.x += dust.vx;
      dust.y += dust.vy;
      dust.life -= DASH_DUST_DECAY;

      if (dust.life <= 0) {
        this.dustParticles.splice(i, 1);
      }
    }
  }

  /**
   * ダッシュダストを生成する
   * 位置が変わった時のみ 1～2 個生成、最大 6 個まで保持
   *
   * @param screenX - プレイヤーのスクリーンX座標
   * @param screenY - プレイヤーのスクリーンY座標
   * @param direction - 移動方向
   */
  private spawnDust(
    screenX: number,
    screenY: number,
    direction: DirectionValue
  ): void {
    // 最大数に達している場合は古いものを削除
    const count = 1 + Math.floor(Math.random() * 2); // 1～2個
    for (let i = 0; i < count; i++) {
      if (this.dustParticles.length >= MAX_DASH_DUST) {
        this.dustParticles.shift();
      }

      // 移動方向の逆方向ベクトル
      let reverseVx = 0;
      let reverseVy = 0;
      switch (direction) {
        case Direction.UP:
          reverseVy = 0.8;
          break;
        case Direction.DOWN:
          reverseVy = -0.8;
          break;
        case Direction.LEFT:
          reverseVx = 0.8;
          break;
        case Direction.RIGHT:
          reverseVx = -0.8;
          break;
      }

      // 足元付近にランダムオフセットして出現
      const offsetX = (Math.random() - 0.5) * 6;
      const offsetY = 4 + Math.random() * 4; // スプライト下端付近

      this.dustParticles.push({
        x: screenX + offsetX + reverseVx * 2,
        y: screenY + offsetY + reverseVy * 2,
        vx: reverseVx * (0.5 + Math.random() * 0.5),
        vy: -0.3 + reverseVy * 0.3, // 上方向にわずかに浮く
        size: 2 + Math.floor(Math.random() * 2), // 2 or 3
        alpha: 0.3 + Math.random() * 0.2, // 0.3～0.5
        life: 1.0,
      });
    }
  }
}

/**
 * スピードエフェクトが有効かどうかを判定する（純粋な速度判定）
 *
 * @param effectiveSpeed - 実効移動速度
 * @returns スピードエフェクトが有効な場合 true
 */
export function isSpeedEffectActive(effectiveSpeed: number): boolean {
  return effectiveSpeed >= SPEED_EFFECT_THRESHOLD;
}

/**
 * スピードエフェクト
 *
 * 高速移動時の残像とスピードラインを管理・描画する。
 * 発動条件: effectiveSpeed >= SPEED_EFFECT_THRESHOLD (5.2)
 */

import { DirectionValue, Direction } from '../../types';
import { SPEED_EFFECT_THRESHOLD } from '../../movement';

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
}

/** 残像の透明度（最新→最古） */
const AFTER_IMAGE_ALPHAS = [0.5, 0.3, 0.1];

/** 残像の最大保持数 */
const MAX_AFTER_IMAGES = 3;

/** スピードラインの本数 */
const SPEED_LINE_COUNT = 4;

/** スピードラインの透明度 */
const SPEED_LINE_ALPHA = 0.4;

/**
 * スピードエフェクト管理クラス
 *
 * 過去のフレーム位置を保持し、残像とスピードラインを描画する。
 */
export class SpeedEffectManager {
  private afterImages: AfterImage[] = [];
  private lastPlayerX = -1;
  private lastPlayerY = -1;
  private speedLineOffsets: number[] = [];

  /**
   * プレイヤー位置を記録する。
   * 移動した場合のみ残像を追加する。
   *
   * @param screenX - スクリーンX座標
   * @param screenY - スクリーンY座標
   * @param direction - プレイヤーの向き
   * @param isActive - スピードエフェクトがアクティブか
   */
  recordPosition(
    screenX: number,
    screenY: number,
    direction: DirectionValue,
    isActive: boolean
  ): void {
    if (!isActive) {
      this.afterImages = [];
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
        });

        // 最大数を超えた分を削除
        if (this.afterImages.length > MAX_AFTER_IMAGES) {
          this.afterImages = this.afterImages.slice(0, MAX_AFTER_IMAGES);
        }

        // 各残像の透明度を更新
        for (let i = 0; i < this.afterImages.length; i++) {
          this.afterImages[i].alpha = AFTER_IMAGE_ALPHAS[i] ?? 0.1;
        }
      }

      this.lastPlayerX = screenX;
      this.lastPlayerY = screenY;
    }

    // スピードラインのランダムオフセットを更新
    this.speedLineOffsets = [];
    for (let i = 0; i < SPEED_LINE_COUNT; i++) {
      this.speedLineOffsets.push((Math.random() - 0.5) * 16); // ±8px
    }
  }

  /**
   * 残像を描画する。
   * プレイヤー描画の直前（描画順序9: スピードエフェクト）に呼ぶ。
   *
   * @param ctx - Canvas コンテキスト
   * @param playerColor - プレイヤーの色
   * @param playerRadius - プレイヤーの半径
   */
  drawAfterImages(
    ctx: CanvasRenderingContext2D,
    playerColor: string,
    playerRadius: number
  ): void {
    for (const image of this.afterImages) {
      ctx.save();
      ctx.globalAlpha = image.alpha;
      ctx.fillStyle = playerColor;
      ctx.beginPath();
      ctx.arc(image.x, image.y, playerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * スピードラインを描画する。
   * 移動方向と逆方向に白い線を描画する。
   *
   * @param ctx - Canvas コンテキスト
   * @param playerScreenX - プレイヤーのスクリーンX座標
   * @param playerScreenY - プレイヤーのスクリーンY座標
   * @param direction - プレイヤーの移動方向
   * @param effectiveSpeed - 実効移動速度
   */
  drawSpeedLines(
    ctx: CanvasRenderingContext2D,
    playerScreenX: number,
    playerScreenY: number,
    direction: DirectionValue,
    effectiveSpeed: number
  ): void {
    if (this.speedLineOffsets.length === 0) return;

    // ラインの長さ: スピードに比例（5～15px）
    const lineLength = (effectiveSpeed - SPEED_EFFECT_THRESHOLD) * 3 + 5;

    // 移動方向の逆方向ベクトル
    let dx = 0;
    let dy = 0;
    switch (direction) {
      case Direction.UP:
        dy = 1; // 逆方向は下
        break;
      case Direction.DOWN:
        dy = -1; // 逆方向は上
        break;
      case Direction.LEFT:
        dx = 1; // 逆方向は右
        break;
      case Direction.RIGHT:
        dx = -1; // 逆方向は左
        break;
    }

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = SPEED_LINE_ALPHA;

    for (let i = 0; i < this.speedLineOffsets.length; i++) {
      const offset = this.speedLineOffsets[i];
      // オフセットは移動方向に対して垂直に適用
      const startX = playerScreenX + (dy !== 0 ? offset : 0);
      const startY = playerScreenY + (dx !== 0 ? offset : 0);
      const endX = startX + dx * lineLength;
      const endY = startY + dy * lineLength;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 状態をクリアする
   */
  clear(): void {
    this.afterImages = [];
    this.lastPlayerX = -1;
    this.lastPlayerY = -1;
    this.speedLineOffsets = [];
  }

  /**
   * 残像の数を取得する（テスト用）
   */
  getAfterImageCount(): number {
    return this.afterImages.length;
  }
}

/**
 * スピードエフェクトが有効かどうかを判定する
 *
 * @param effectiveSpeed - 実効移動速度
 * @returns スピードエフェクトが有効な場合 true
 */
export function isSpeedEffectActive(effectiveSpeed: number): boolean {
  return effectiveSpeed >= SPEED_EFFECT_THRESHOLD;
}

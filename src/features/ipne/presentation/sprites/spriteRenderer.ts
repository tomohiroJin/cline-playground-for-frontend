/**
 * スプライトレンダラー
 *
 * スプライトの描画とキャッシュ管理を行うクラス。
 * スケール別にキャッシュを保持し、再描画時のパフォーマンスを向上させる。
 */

import { SpriteDefinition, createSprite } from './spriteData';
import { SpriteSheetDefinition, getAnimationFrameIndex } from './spriteSheet';
import { applyOutline, applyEdgeShading } from './dotEnhance';

/** 自動補正オプション（呼び出し側＝描画層が指定） */
export interface EnhanceOptions {
  /** 輪郭線を付与する */
  outline?: boolean;
  /** 縁陰影を付与する */
  shade?: boolean;
}

/** 補正フラグをキャッシュキー用の文字列に変換する */
function enhanceKey(enhance?: EnhanceOptions): string {
  return `${enhance?.outline ? 1 : 0}${enhance?.shade ? 1 : 0}`;
}

/** キャッシュ用キャンバスを生成する */
function createCacheCanvas(
  width: number,
  height: number
): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * スプライトレンダラー
 *
 * スプライト描画のキャッシュ管理と描画 API を提供する。
 * スケール別にキャンバスをキャッシュし、ニアレストネイバー拡大で
 * ドット絵の鮮明さを維持する。
 */
export class SpriteRenderer {
  /** スケール別スプライトキャッシュ */
  private cache = new Map<string, HTMLCanvasElement | OffscreenCanvas>();
  /** スプライト定義 → 一意 ID のマッピング */
  private spriteIds = new WeakMap<SpriteDefinition, number>();
  /** 次に割り当てるスプライト ID */
  private nextId = 0;

  /**
   * スプライト定義に一意の ID を割り当てる
   */
  private getSpriteId(sprite: SpriteDefinition): number {
    let id = this.spriteIds.get(sprite);
    if (id === undefined) {
      id = this.nextId++;
      this.spriteIds.set(sprite, id);
    }
    return id;
  }

  /**
   * スケール済みスプライトのキャッシュキャンバスを取得する
   * キャッシュが無い場合は生成してキャッシュに保存する
   * 補正オプションがキャッシュキーに含まれるため、補正有無で別キャッシュが生成される
   */
  private getCachedCanvas(
    sprite: SpriteDefinition,
    scale: number,
    enhance?: EnhanceOptions
  ): HTMLCanvasElement | OffscreenCanvas {
    const id = this.getSpriteId(sprite);
    const key = `${id}-${scale}-${enhanceKey(enhance)}`;

    let canvas = this.cache.get(key);
    if (canvas) return canvas;

    // 輪郭線（index 空間）→ ImageData 生成 → 縁陰影（RGB 空間）の順で補正
    const outlined = enhance?.outline ? applyOutline(sprite) : sprite;
    let imageData = createSprite(outlined.pixels, outlined.palette);
    if (enhance?.shade) {
      imageData = applyEdgeShading(imageData);
    }

    // 元サイズのキャンバスに ImageData を配置
    const srcCanvas = createCacheCanvas(sprite.width, sprite.height);
    const srcCtx = srcCanvas.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D;
    srcCtx.putImageData(imageData, 0, 0);

    // スケール済みキャンバスにニアレストネイバー拡大で描画
    const scaledWidth = Math.round(sprite.width * scale);
    const scaledHeight = Math.round(sprite.height * scale);
    canvas = createCacheCanvas(scaledWidth, scaledHeight);
    const ctx = canvas.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(srcCanvas, 0, 0, scaledWidth, scaledHeight);

    this.cache.set(key, canvas);
    return canvas;
  }

  /**
   * 単一スプライトを描画する
   *
   * @param ctx - 描画先の Canvas コンテキスト
   * @param sprite - スプライト定義
   * @param x - 描画先 X 座標
   * @param y - 描画先 Y 座標
   * @param scale - 拡大倍率
   * @param enhance - 自動補正オプション（省略時は補正なし）
   */
  drawSprite(
    ctx: CanvasRenderingContext2D,
    sprite: SpriteDefinition,
    x: number,
    y: number,
    scale: number,
    enhance?: EnhanceOptions
  ): void {
    const canvas = this.getCachedCanvas(sprite, scale, enhance);
    ctx.drawImage(canvas, x, y);
  }

  /**
   * アニメーションスプライトを描画する
   * currentTime に基づいて適切なフレームを自動選択する
   *
   * @param ctx - 描画先の Canvas コンテキスト
   * @param sheet - スプライトシート定義
   * @param currentTime - 現在時刻（ミリ秒）
   * @param x - 描画先 X 座標
   * @param y - 描画先 Y 座標
   * @param scale - 拡大倍率
   * @param enhance - 自動補正オプション（省略時は補正なし）
   */
  drawAnimatedSprite(
    ctx: CanvasRenderingContext2D,
    sheet: SpriteSheetDefinition,
    currentTime: number,
    x: number,
    y: number,
    scale: number,
    enhance?: EnhanceOptions
  ): void {
    const frameIndex = getAnimationFrameIndex(sheet, currentTime);
    this.drawSprite(ctx, sheet.sprites[frameIndex], x, y, scale, enhance);
  }

  /**
   * 透明度を指定してスプライトを描画する（残像エフェクト用）
   *
   * @param ctx - 描画先の Canvas コンテキスト
   * @param sprite - スプライト定義
   * @param x - 描画先 X 座標
   * @param y - 描画先 Y 座標
   * @param scale - 拡大倍率
   * @param alpha - 透明度（0.0 〜 1.0）
   */
  drawSpriteWithAlpha(
    ctx: CanvasRenderingContext2D,
    sprite: SpriteDefinition,
    x: number,
    y: number,
    scale: number,
    alpha: number
  ): void {
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha;
    this.drawSprite(ctx, sprite, x, y, scale);
    ctx.globalAlpha = prevAlpha;
  }

  /**
   * スプライトキャッシュをすべてクリアする
   */
  clearCache(): void {
    this.cache.clear();
  }
}

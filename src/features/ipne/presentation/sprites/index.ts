/**
 * スプライトシステム
 *
 * ドット絵スプライトの定義・レンダリング基盤モジュール。
 */

// スプライトデータ定義・生成
export { createSprite, hexToRgba } from './spriteData';
export type { SpriteDefinition } from './spriteData';

// スプライトシート・アニメーション
export { getAnimationFrame, getAnimationFrameIndex } from './spriteSheet';
export type { SpriteSheetDefinition } from './spriteSheet';

// スプライトレンダラー
export { SpriteRenderer } from './spriteRenderer';

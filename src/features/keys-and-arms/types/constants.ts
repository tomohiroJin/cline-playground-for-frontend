/**
 * KEYS & ARMS — 定数の型定義
 */

/** スプライトデータ（ピクセル配列） */
export type SpriteData = ReadonlyArray<ReadonlyArray<number>>;

/** 2D 座標 */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/** 洞窟の部屋ナビゲーション */
export interface RoomNavigation {
  readonly l?: number;
  readonly r?: number;
  readonly u?: number;
  readonly d?: number;
}

/** LCD カラーパレット */
export interface LCDPalette {
  readonly fg: string;
  readonly bg: string;
  readonly scanline: string;
}

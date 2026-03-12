/**
 * KEYS & ARMS — 描画 API の型定義
 */
import type { SpriteData } from './constants';

/** 描画 API インターフェース（createRendering の戻り値型） */
export interface DrawingAPI {
  readonly $: CanvasRenderingContext2D;
  lcdFg(on: boolean): string;
  lcdBg(on: boolean): string;
  circle(x: number, y: number, r: number): void;
  circleS(x: number, y: number, r: number): void;
  onFill(alpha: number): void;
  onStroke(alpha: number, lw?: number): void;
  R(x: number, y: number, w: number, h: number, on: boolean): void;
  txt(s: string, x: number, y: number, sz?: number, on?: boolean, al?: CanvasTextAlign): void;
  txtC(s: string, x: number, y: number, sz?: number, on?: boolean): void;
  px(data: SpriteData, dx: number, dy: number, s: number, on: boolean, flip?: boolean): void;
  drawK(spr: SpriteData, x: number, y: number, s: number, on: boolean, dir: number): void;
  iHeart(x: number, y: number, on: boolean): void;
  iGem(x: number, y: number, on: boolean): void;
  iSlime(x: number, y: number, on: boolean): void;
  iGoblin(x: number, y: number, on: boolean): void;
  iSkel(x: number, y: number, on: boolean): void;
  iBoss(x: number, y: number, on: boolean): void;
  iArmDown(x: number, y: number, on: boolean): void;
  iArmUp(x: number, y: number, on: boolean): void;
}

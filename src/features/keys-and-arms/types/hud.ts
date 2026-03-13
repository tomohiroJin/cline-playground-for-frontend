/**
 * KEYS & ARMS — HUD API の型定義
 */

/** HUD モジュール（createHUD の戻り値型） */
export interface HUDModule {
  BL(): number;
  twoBeatDuration(): number;
  doHurt(): void;
  doBeat(): boolean;
  drawHUD(): void;
  transTo(text: string, fn: (() => void) | undefined, sub?: string): void;
  drawTrans(): boolean;
}

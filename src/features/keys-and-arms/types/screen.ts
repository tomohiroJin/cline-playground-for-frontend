/**
 * KEYS & ARMS — 画面共通インターフェース
 */

/** 画面共通インターフェース */
export interface Screen {
  draw(): void;
  update?(): void;
}

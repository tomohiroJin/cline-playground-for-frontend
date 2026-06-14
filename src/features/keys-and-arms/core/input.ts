/**
 * 入力ハンドラー
 *
 * キーボード入力の状態管理を担当する。
 * kd: 押下中フラグ、jp: フレーム中に押されたフラグ（1フレーム有効）
 */

/** アクションキー（拾う・攻撃・設置・開始などに使う）の唯一の定義 */
export const ACTION_KEYS = ['z', ' '] as const;

/** 指定キーがアクションキーかどうか */
export function isActionKey(key: string): boolean {
  return (ACTION_KEYS as readonly string[]).includes(key.toLowerCase());
}

/** アクションキーが押下中（held）かどうか */
export function isActionHeld(kd: Record<string, boolean>): boolean {
  return ACTION_KEYS.some((k) => kd[k]);
}

export interface InputHandler {
  /** 押下中フラグ */
  readonly kd: Record<string, boolean>;
  /** フレーム中に押されたフラグ */
  readonly jp: Record<string, boolean>;
  /** キーが今フレーム押されたか */
  justPressed(key: string): boolean;
  /** jp フラグを全クリア */
  clearJustPressed(): void;
  /** アクションキー（z / スペース）が押されたか */
  isAction(): boolean;
  /** キー押下イベント処理 */
  handleKeyDown(key: string): void;
  /** キーリリースイベント処理 */
  handleKeyUp(key: string): void;
}

/** 入力ハンドラーを生成 */
export function createInputHandler(): InputHandler {
  const kd: Record<string, boolean> = {};
  const jp: Record<string, boolean> = {};

  function justPressed(key: string): boolean {
    return !!jp[key.toLowerCase()];
  }

  function clearJustPressed(): void {
    for (const k in jp) delete jp[k];
  }

  function isAction(): boolean {
    return ACTION_KEYS.some((k) => justPressed(k));
  }

  function handleKeyDown(key: string): void {
    const k = key.toLowerCase();
    if (!kd[k]) jp[k] = true;
    kd[k] = true;
  }

  function handleKeyUp(key: string): void {
    kd[key.toLowerCase()] = false;
  }

  return { kd, jp, justPressed, clearJustPressed, isAction, handleKeyDown, handleKeyUp };
}

/**
 * jp オブジェクトからキー押下ヘルパーを生成
 * 各ステージ・スクリーンで重複していた J(k) / jAct() を共通化
 */
export function createInputHelpers(jp: Record<string, boolean>) {
  /** キーが今フレーム押されたか */
  function J(k: string): boolean { return !!jp[k.toLowerCase()]; }
  /** アクションキー（z / スペース）が押されたか */
  function jAct(): boolean { return ACTION_KEYS.some((k) => J(k)); }
  return { J, jAct };
}

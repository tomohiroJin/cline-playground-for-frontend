/**
 * 入力ハンドラー
 *
 * キーボード入力の状態管理を担当する。
 * kd: 押下中フラグ、jp: フレーム中に押されたフラグ（1フレーム有効）
 */

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
    return justPressed('z') || justPressed(' ');
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

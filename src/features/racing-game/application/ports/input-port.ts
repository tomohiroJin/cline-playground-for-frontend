// 入力ポートインターフェース

/** プレイヤー入力状態 */
export interface InputState {
  readonly left: boolean;
  readonly right: boolean;
  readonly handbrake: boolean;
}

/** ドラフト UI 入力 */
export interface DraftInput {
  readonly left: boolean;
  readonly right: boolean;
  readonly confirm: boolean;
}

export interface InputPort {
  /** 現在の入力状態を取得 */
  getPlayerInput(playerIndex: number): InputState;
  /** ドラフト UI 用の入力を取得 */
  getDraftInput(playerIndex: number): DraftInput;
  /** 入力状態のリセット */
  clearDraftInput(playerIndex: number, action: string): void;
}

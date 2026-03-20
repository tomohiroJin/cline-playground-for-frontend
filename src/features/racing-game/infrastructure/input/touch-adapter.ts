// InputPort のタッチ入力実装（将来拡張用の骨格）

import type { InputPort, InputState, DraftInput } from '../../application/ports/input-port';

/** タッチ入力アダプターの生成（現在はキーボードアダプターに統合済み） */
export const createTouchAdapter = (): InputPort => {
  const defaultInput: InputState = { left: false, right: false, handbrake: false };
  const defaultDraft: DraftInput = { left: false, right: false, confirm: false };

  return {
    getPlayerInput(): InputState {
      return defaultInput;
    },
    getDraftInput(): DraftInput {
      return defaultDraft;
    },
    clearDraftInput(): void {
      // no-op
    },
  };
};

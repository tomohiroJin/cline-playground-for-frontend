// InputPort のキーボード実装

import type { InputPort, InputState, DraftInput } from '../../application/ports/input-port';

/** キーマッピング設定 */
interface KeyMapping {
  readonly left: readonly string[];
  readonly right: readonly string[];
  readonly handbrake: readonly string[];
  readonly draftLeft: readonly string[];
  readonly draftRight: readonly string[];
  readonly draftConfirm: readonly string[];
}

/** プレイヤー 1 のキーマッピング（ソロ / CPU モード） */
const P1_SOLO_KEYS: KeyMapping = {
  left: ['a', 'A'],
  right: ['d', 'D'],
  handbrake: [' '],
  draftLeft: ['a', 'A', 'ArrowLeft'],
  draftRight: ['d', 'D', 'ArrowRight'],
  draftConfirm: ['w', 'W', 'Enter', ' '],
};

/** プレイヤー 1 のキーマッピング（2P モード） */
const P1_2P_KEYS: KeyMapping = {
  left: ['a', 'A'],
  right: ['d', 'D'],
  handbrake: ['code:ShiftLeft'],
  draftLeft: ['a', 'A'],
  draftRight: ['d', 'D'],
  draftConfirm: ['w', 'W'],
};

/** プレイヤー 2 のキーマッピング */
const P2_KEYS: KeyMapping = {
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  handbrake: ['code:ShiftRight', 'Enter'],
  draftLeft: ['ArrowLeft'],
  draftRight: ['ArrowRight'],
  draftConfirm: ['Enter'],
};

/** キーのいずれかが押されているか */
const anyPressed = (keys: Record<string, boolean>, mapping: readonly string[]): boolean =>
  mapping.some(k => !!keys[k]);

/** キーをクリア */
const clearKeys = (keys: Record<string, boolean>, mapping: readonly string[]): void => {
  mapping.forEach(k => { keys[k] = false; });
};

/** Ref ライクなオブジェクト（React 非依存） */
interface Ref<T> {
  current: T;
}

/** キーボード入力アダプターの生成 */
export const createKeyboardAdapter = (
  keys: Ref<Record<string, boolean>>,
  touch: Ref<{ L: boolean; R: boolean }>,
  mode: string,
): InputPort => {
  const getMapping = (playerIndex: number): KeyMapping => {
    if (playerIndex === 0) {
      return mode === '2p' ? P1_2P_KEYS : P1_SOLO_KEYS;
    }
    return P2_KEYS;
  };

  return {
    getPlayerInput(playerIndex: number): InputState {
      const mapping = getMapping(playerIndex);
      const k = keys.current;
      return {
        left: anyPressed(k, mapping.left) || (playerIndex === 0 && touch.current.L),
        right: anyPressed(k, mapping.right) || (playerIndex === 0 && touch.current.R),
        handbrake: anyPressed(k, mapping.handbrake),
      };
    },

    getDraftInput(playerIndex: number): DraftInput {
      const mapping = getMapping(playerIndex);
      const k = keys.current;
      return {
        left: anyPressed(k, mapping.draftLeft),
        right: anyPressed(k, mapping.draftRight),
        confirm: anyPressed(k, mapping.draftConfirm),
      };
    },

    clearDraftInput(playerIndex: number, action: string): void {
      const mapping = getMapping(playerIndex);
      const k = keys.current;
      if (action === 'left') clearKeys(k, mapping.draftLeft);
      else if (action === 'right') clearKeys(k, mapping.draftRight);
      else clearKeys(k, mapping.draftConfirm);
    },
  };
};

/**
 * Phase S4-2: ペアマッチ（2v2）入力層のテスト
 */
import {
  createMultiTouchState,
  processTouchStart,
  processTouchMove,
  processTouchEnd,
  getPlayerPosition,
} from './multi-touch';
import {
  createKeyboardState,
  updateKeyboardStateForPlayer,
  calculateKeyboardMovement,
} from './keyboard';
import { CONSTANTS, getPlayerZone } from './constants';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;
const IS_4ZONE = true;

describe('Phase S4-2: ペアマッチ入力層', () => {
  // ── S4-2-1: マルチタッチ4タッチ対応 ────────────────

  describe('S4-2-1: マルチタッチ4タッチ対応（2v2 モード: is4Zone=true）', () => {
    it('4つのタッチを同時追跡できる', () => {
      let state = createMultiTouchState();

      state = processTouchStart(state, 1, { canvasX: W / 4, canvasY: H * 3 / 4 }, CONSTANTS, IS_4ZONE);
      state = processTouchStart(state, 2, { canvasX: W * 3 / 4, canvasY: H * 3 / 4 }, CONSTANTS, IS_4ZONE);
      state = processTouchStart(state, 3, { canvasX: W / 4, canvasY: H / 4 }, CONSTANTS, IS_4ZONE);
      state = processTouchStart(state, 4, { canvasX: W * 3 / 4, canvasY: H / 4 }, CONSTANTS, IS_4ZONE);

      expect(getPlayerPosition(state, 'player1')).toBeDefined();
      expect(getPlayerPosition(state, 'player2')).toBeDefined();
      expect(getPlayerPosition(state, 'player3')).toBeDefined();
      expect(getPlayerPosition(state, 'player4')).toBeDefined();
    });

    it('4分割ゾーン判定: 左下タッチは player1 に割り当て', () => {
      let state = createMultiTouchState();
      state = processTouchStart(state, 1, { canvasX: W / 4, canvasY: H * 3 / 4 }, CONSTANTS, IS_4ZONE);
      expect(getPlayerPosition(state, 'player1')).toBeDefined();
      expect(getPlayerPosition(state, 'player2')).toBeUndefined();
    });

    it('4分割ゾーン判定: 右下タッチは player2 に割り当て', () => {
      let state = createMultiTouchState();
      state = processTouchStart(state, 1, { canvasX: W * 3 / 4, canvasY: H * 3 / 4 }, CONSTANTS, IS_4ZONE);
      expect(getPlayerPosition(state, 'player2')).toBeDefined();
      expect(getPlayerPosition(state, 'player1')).toBeUndefined();
    });

    it('4分割ゾーン判定: 左上タッチは player3 に割り当て', () => {
      let state = createMultiTouchState();
      state = processTouchStart(state, 1, { canvasX: W / 4, canvasY: H / 4 }, CONSTANTS, IS_4ZONE);
      expect(getPlayerPosition(state, 'player3')).toBeDefined();
    });

    it('4分割ゾーン判定: 右上タッチは player4 に割り当て', () => {
      let state = createMultiTouchState();
      state = processTouchStart(state, 1, { canvasX: W * 3 / 4, canvasY: H / 4 }, CONSTANTS, IS_4ZONE);
      expect(getPlayerPosition(state, 'player4')).toBeDefined();
    });

    it('タッチ移動で位置が更新される（player3）', () => {
      let state = createMultiTouchState();
      state = processTouchStart(state, 3, { canvasX: W / 4, canvasY: H / 4 }, CONSTANTS, IS_4ZONE);
      state = processTouchMove(state, 3, { canvasX: W / 4 + 10, canvasY: H / 4 + 10 }, CONSTANTS);
      const pos = getPlayerPosition(state, 'player3');
      expect(pos).toBeDefined();
    });

    it('タッチ終了でプレイヤーが解放される（player4）', () => {
      let state = createMultiTouchState();
      state = processTouchStart(state, 4, { canvasX: W * 3 / 4, canvasY: H / 4 }, CONSTANTS, IS_4ZONE);
      expect(getPlayerPosition(state, 'player4')).toBeDefined();
      state = processTouchEnd(state, 4);
      expect(getPlayerPosition(state, 'player4')).toBeUndefined();
    });
  });

  describe('S4-2-1b: 2P モード互換（is4Zone=false: デフォルト）', () => {
    it('下半分タッチは player1、上半分タッチは player2 に割り当て', () => {
      let state = createMultiTouchState();
      // is4Zone 未指定（デフォルト false）→ 上下2分割
      state = processTouchStart(state, 1, { canvasX: W / 2, canvasY: H * 3 / 4 }, CONSTANTS);
      expect(getPlayerPosition(state, 'player1')).toBeDefined();
      state = processTouchStart(state, 2, { canvasX: W / 2, canvasY: H / 4 }, CONSTANTS);
      expect(getPlayerPosition(state, 'player2')).toBeDefined();
    });

    it('画面中央の左右どちらにタッチしても上下のみで判定される', () => {
      let state = createMultiTouchState();
      // 右下 → 2P モードでは player1（下半分）
      state = processTouchStart(state, 1, { canvasX: W * 3 / 4, canvasY: H * 3 / 4 }, CONSTANTS);
      expect(getPlayerPosition(state, 'player1')).toBeDefined();
      expect(getPlayerPosition(state, 'player2')).toBeUndefined();
    });
  });

  // ── S4-2-2: キーボード入力の2v2対応 ────────────────

  describe('S4-2-2: キーボード入力の2v2対応', () => {
    it('WASD キーが player2 スロットで受け付けられる', () => {
      let keys = createKeyboardState();
      keys = updateKeyboardStateForPlayer(keys, 'w', true, 'player2');
      expect(keys.up).toBe(true);
    });

    it('calculateKeyboardMovement が player2 スロットのY範囲でクランプされる', () => {
      const keys = { up: false, down: true, left: false, right: true };
      const currentPos = { x: 300, y: 300 };
      const result = calculateKeyboardMovement(keys, currentPos, CONSTANTS, 'player2');
      expect(result.y).toBeLessThanOrEqual(H / 2);
    });
  });
});

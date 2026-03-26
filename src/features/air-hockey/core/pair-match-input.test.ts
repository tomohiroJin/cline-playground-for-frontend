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

describe('Phase S4-2: ペアマッチ入力層', () => {
  // ── S4-2-1: マルチタッチ4タッチ対応 ────────────────

  describe('S4-2-1: マルチタッチ4タッチ対応', () => {
    it('4つのタッチを同時追跡できる', () => {
      let state = createMultiTouchState();

      // P1: 左下
      state = processTouchStart(state, 1, { canvasX: W / 4, canvasY: H * 3 / 4 }, CONSTANTS);
      // P2: 右下
      state = processTouchStart(state, 2, { canvasX: W * 3 / 4, canvasY: H * 3 / 4 }, CONSTANTS);
      // P3: 左上
      state = processTouchStart(state, 3, { canvasX: W / 4, canvasY: H / 4 }, CONSTANTS);
      // P4: 右上
      state = processTouchStart(state, 4, { canvasX: W * 3 / 4, canvasY: H / 4 }, CONSTANTS);

      expect(getPlayerPosition(state, 'player1')).toBeDefined();
      expect(getPlayerPosition(state, 'player2')).toBeDefined();
      expect(getPlayerPosition(state, 'player3')).toBeDefined();
      expect(getPlayerPosition(state, 'player4')).toBeDefined();
    });

    it('4分割ゾーン判定: 左下タッチは player1 に割り当て', () => {
      let state = createMultiTouchState();
      state = processTouchStart(state, 1, { canvasX: W / 4, canvasY: H * 3 / 4 }, CONSTANTS);
      expect(getPlayerPosition(state, 'player1')).toBeDefined();
      expect(getPlayerPosition(state, 'player2')).toBeUndefined();
    });

    it('4分割ゾーン判定: 右下タッチは player2 に割り当て', () => {
      let state = createMultiTouchState();
      state = processTouchStart(state, 1, { canvasX: W * 3 / 4, canvasY: H * 3 / 4 }, CONSTANTS);
      expect(getPlayerPosition(state, 'player2')).toBeDefined();
      expect(getPlayerPosition(state, 'player1')).toBeUndefined();
    });

    it('4分割ゾーン判定: 左上タッチは player3 に割り当て', () => {
      let state = createMultiTouchState();
      state = processTouchStart(state, 1, { canvasX: W / 4, canvasY: H / 4 }, CONSTANTS);
      expect(getPlayerPosition(state, 'player3')).toBeDefined();
    });

    it('4分割ゾーン判定: 右上タッチは player4 に割り当て', () => {
      let state = createMultiTouchState();
      state = processTouchStart(state, 1, { canvasX: W * 3 / 4, canvasY: H / 4 }, CONSTANTS);
      expect(getPlayerPosition(state, 'player4')).toBeDefined();
    });

    it('タッチ移動で位置が更新される（player3）', () => {
      let state = createMultiTouchState();
      state = processTouchStart(state, 3, { canvasX: W / 4, canvasY: H / 4 }, CONSTANTS);
      state = processTouchMove(state, 3, { canvasX: W / 4 + 10, canvasY: H / 4 + 10 }, CONSTANTS);
      const pos = getPlayerPosition(state, 'player3');
      expect(pos).toBeDefined();
    });

    it('タッチ終了でプレイヤーが解放される（player4）', () => {
      let state = createMultiTouchState();
      state = processTouchStart(state, 4, { canvasX: W * 3 / 4, canvasY: H / 4 }, CONSTANTS);
      expect(getPlayerPosition(state, 'player4')).toBeDefined();
      state = processTouchEnd(state, 4);
      expect(getPlayerPosition(state, 'player4')).toBeUndefined();
    });

    it('2P モード互換: 下半分左側 → player1、上半分左側 → player3', () => {
      let state = createMultiTouchState();
      // 下半分左側 → player1
      state = processTouchStart(state, 1, { canvasX: W / 4, canvasY: H * 3 / 4 }, CONSTANTS);
      expect(getPlayerPosition(state, 'player1')).toBeDefined();
      // 上半分左側 → player3
      state = processTouchStart(state, 2, { canvasX: W / 4, canvasY: H / 4 }, CONSTANTS);
      expect(getPlayerPosition(state, 'player3')).toBeDefined();
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
      // 既存のキーボード移動はgetPlayerYBoundsを使用（上半分）
      // 2v2ゾーン制約はゲームループ層で適用する
      const currentPos = { x: 300, y: 300 };
      const result = calculateKeyboardMovement(keys, currentPos, CONSTANTS, 'player2');
      // player2 は上半分なので maxY < H/2
      expect(result.y).toBeLessThanOrEqual(H / 2);
    });
  });
});

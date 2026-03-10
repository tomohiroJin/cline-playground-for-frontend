/**
 * コンボシステムテスト
 */

import {
  createComboState,
  registerKill,
  isComboActive,
  getComboMultiplier,
  COMBO_WINDOW_MS,
  COMBO_DISPLAY_MIN,
} from './combo';

describe('コンボシステム', () => {
  describe('createComboState', () => {
    it('初期状態はコンボ0・最大コンボ0', () => {
      const state = createComboState();
      expect(state.count).toBe(0);
      expect(state.maxCombo).toBe(0);
      expect(state.lastKillTime).toBe(0);
    });
  });

  describe('registerKill', () => {
    it('初回撃破でコンボ1になる', () => {
      const state = createComboState();
      const updated = registerKill(state, 1000);
      expect(updated.count).toBe(1);
      expect(updated.lastKillTime).toBe(1000);
    });

    it('時間窓内の連続撃破でコンボが加算される', () => {
      let state = createComboState();
      state = registerKill(state, 1000);
      state = registerKill(state, 2000); // 1秒後（窓内）
      expect(state.count).toBe(2);
      state = registerKill(state, 3000); // さらに1秒後（窓内）
      expect(state.count).toBe(3);
    });

    it('時間窓を超えるとコンボがリセットされる', () => {
      let state = createComboState();
      state = registerKill(state, 1000);
      state = registerKill(state, 2000);
      expect(state.count).toBe(2);
      // 3秒超経過
      state = registerKill(state, 2000 + COMBO_WINDOW_MS + 1);
      expect(state.count).toBe(1); // リセットされて1から
    });

    it('最大コンボ数が記録される', () => {
      let state = createComboState();
      state = registerKill(state, 1000);
      state = registerKill(state, 2000);
      state = registerKill(state, 3000);
      expect(state.maxCombo).toBe(3);
      // リセット後
      state = registerKill(state, 3000 + COMBO_WINDOW_MS + 1);
      expect(state.count).toBe(1);
      expect(state.maxCombo).toBe(3); // 最大値は保持
    });
  });

  describe('isComboActive', () => {
    it('撃破直後はアクティブ', () => {
      let state = createComboState();
      state = registerKill(state, 1000);
      expect(isComboActive(state, 1500)).toBe(true);
    });

    it('時間窓内はアクティブ', () => {
      let state = createComboState();
      state = registerKill(state, 1000);
      expect(isComboActive(state, 1000 + COMBO_WINDOW_MS - 1)).toBe(true);
    });

    it('時間窓超過で非アクティブ', () => {
      let state = createComboState();
      state = registerKill(state, 1000);
      expect(isComboActive(state, 1000 + COMBO_WINDOW_MS + 1)).toBe(false);
    });

    it('撃破がない場合は非アクティブ', () => {
      const state = createComboState();
      expect(isComboActive(state, 1000)).toBe(false);
    });
  });

  describe('getComboMultiplier', () => {
    it('コンボ1は倍率1.0', () => {
      let state = createComboState();
      state = registerKill(state, 1000);
      expect(getComboMultiplier(state)).toBe(1.0);
    });

    it('コンボ2-3は倍率1.2', () => {
      let state = createComboState();
      state = registerKill(state, 1000);
      state = registerKill(state, 2000);
      expect(getComboMultiplier(state)).toBe(1.2);
      state = registerKill(state, 3000);
      expect(getComboMultiplier(state)).toBe(1.2);
    });

    it('コンボ4-6は倍率1.4', () => {
      let state = createComboState();
      for (let i = 0; i < 4; i++) {
        state = registerKill(state, 1000 + i * 500);
      }
      expect(getComboMultiplier(state)).toBe(1.4);
    });

    it('コンボ7-9は倍率1.6', () => {
      let state = createComboState();
      for (let i = 0; i < 7; i++) {
        state = registerKill(state, 1000 + i * 400);
      }
      expect(getComboMultiplier(state)).toBe(1.6);
    });

    it('コンボ10以上は倍率1.8', () => {
      let state = createComboState();
      for (let i = 0; i < 10; i++) {
        state = registerKill(state, 1000 + i * 200);
      }
      expect(getComboMultiplier(state)).toBe(1.8);
    });

    it('コンボ0は倍率1.0', () => {
      const state = createComboState();
      expect(getComboMultiplier(state)).toBe(1.0);
    });
  });

  describe('定数', () => {
    it('コンボ時間窓は3000ms', () => {
      expect(COMBO_WINDOW_MS).toBe(3000);
    });

    it('コンボ表示最小値は2', () => {
      expect(COMBO_DISPLAY_MIN).toBe(2);
    });
  });
});

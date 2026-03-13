/**
 * MIMIC ロジックのテスト
 */
import {
  createMimicState,
  pryMimic,
  decayPryCount,
  updateMimicOpen,
  isMimicDangerous,
} from '../../domain/enemies/mimic-behavior';

describe('enemies/mimic-behavior', () => {
  describe('createMimicState', () => {
    it('初期状態は pryCount 0、未開放', () => {
      const state = createMimicState();
      expect(state.pryCount).toBe(0);
      expect(state.isOpen).toBe(false);
    });
  });

  describe('pryMimic', () => {
    it('Z 連打で pryCount が増加する', () => {
      let state = createMimicState();
      state = pryMimic(state);
      expect(state.pryCount).toBe(1);
    });

    it('5 回連打で鍵取得可能状態になる', () => {
      let state = createMimicState();
      for (let i = 0; i < 5; i++) {
        state = pryMimic(state);
      }
      expect(state.pryCount).toBe(5);
      expect(state.isKeyReady).toBe(true);
    });

    it('5 回を超えても pryCount は増加する', () => {
      let state = createMimicState();
      for (let i = 0; i < 6; i++) {
        state = pryMimic(state);
      }
      expect(state.pryCount).toBe(6);
    });
  });

  describe('decayPryCount', () => {
    it('pryCount が 1 減少する', () => {
      let state = createMimicState();
      state = pryMimic(state);
      state = pryMimic(state);
      state = decayPryCount(state);
      expect(state.pryCount).toBe(1);
    });

    it('0 未満にはならない', () => {
      const state = createMimicState();
      const result = decayPryCount(state);
      expect(result.pryCount).toBe(0);
    });
  });

  describe('updateMimicOpen', () => {
    it('周期内の危険期間で開く', () => {
      // 周期 6、count >= 4 で開く
      expect(updateMimicOpen(5, 6)).toBe(true);
    });

    it('周期内の安全期間で閉じる', () => {
      expect(updateMimicOpen(0, 6)).toBe(false);
    });
  });

  describe('isMimicDangerous', () => {
    it('開いている状態で危険', () => {
      expect(isMimicDangerous(true)).toBe(true);
    });

    it('閉じている状態で安全', () => {
      expect(isMimicDangerous(false)).toBe(false);
    });
  });
});

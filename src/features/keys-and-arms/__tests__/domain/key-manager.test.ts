/**
 * 鍵管理のテスト
 */
import {
  createKeyState,
  collectKey,
  placeKey,
  isAllKeysPlaced,
  dropKey,
} from '../../domain/items/key-manager';

describe('items/key-manager', () => {
  describe('createKeyState', () => {
    it('初期状態は鍵なし、設置なし', () => {
      const state = createKeyState();
      expect(state.keys).toEqual([false, false, false]);
      expect(state.keysPlaced).toBe(0);
      expect(state.carrying).toBe(false);
    });
  });

  describe('collectKey', () => {
    it('鍵を拾うと所持状態になる', () => {
      const state = createKeyState();
      const result = collectKey(state, 0);
      expect(result.keys[0]).toBe(true);
      expect(result.carrying).toBe(true);
    });

    it('既に取得済みの鍵は再取得不可（変化なし）', () => {
      let state = createKeyState();
      state = collectKey(state, 0);
      state = placeKey(state);
      const result = collectKey(state, 0);
      expect(result.keys[0]).toBe(true);
    });
  });

  describe('placeKey', () => {
    it('鍵を設置すると keysPlaced が増加する', () => {
      let state = createKeyState();
      state = collectKey(state, 0);
      const result = placeKey(state);
      expect(result.keysPlaced).toBe(1);
      expect(result.carrying).toBe(false);
    });

    it('所持していない状態で設置するとエラーになる', () => {
      const state = createKeyState();
      expect(() => placeKey(state)).toThrow('[Contract]');
    });
  });

  describe('isAllKeysPlaced', () => {
    it('3 つ設置で true', () => {
      expect(isAllKeysPlaced(3)).toBe(true);
    });

    it('2 つ設置で false', () => {
      expect(isAllKeysPlaced(2)).toBe(false);
    });
  });

  describe('dropKey', () => {
    it('最後に取得した鍵を落とす', () => {
      let state = createKeyState();
      state = collectKey(state, 0);
      state = placeKey(state);
      state = collectKey(state, 1);
      const result = dropKey(state);
      expect(result.carrying).toBe(false);
      expect(result.keys[1]).toBe(false);
    });

    it('鍵を持っていない場合は変化なし', () => {
      const state = createKeyState();
      const result = dropKey(state);
      expect(result).toEqual(state);
    });
  });
});

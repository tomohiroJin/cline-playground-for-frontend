import type { SaveData } from '../../types';
import { toggleEquip, maxEquipSlots } from './style-ops';

const createDefault = (overrides?: Partial<SaveData>): SaveData => ({
  pts: 0,
  plays: 0,
  best: 0,
  bestSt: 0,
  sty: ['standard'],
  ui: [],
  eq: ['standard'],
  ...overrides,
});

describe('style-ops', () => {
  describe('maxEquipSlots', () => {
    it('アンロックなしの場合は 1 を返す', () => {
      // Arrange
      const data = createDefault();

      // Act & Assert
      expect(maxEquipSlots(data)).toBe(1);
    });

    it('slot2 アンロック済みの場合は 2 を返す', () => {
      // Arrange
      const data = createDefault({ ui: ['slot2'] });

      // Act & Assert
      expect(maxEquipSlots(data)).toBe(2);
    });

    it('slot3 アンロック済みの場合は 3 を返す', () => {
      // Arrange
      const data = createDefault({ ui: ['slot2', 'slot3'] });

      // Act & Assert
      expect(maxEquipSlots(data)).toBe(3);
    });

    it('slot3 のみアンロック済みでも 3 を返す', () => {
      // Arrange
      const data = createDefault({ ui: ['slot3'] });

      // Act & Assert
      expect(maxEquipSlots(data)).toBe(3);
    });
  });

  describe('toggleEquip', () => {
    it('未所持スタイルの装備は undefined を返す', () => {
      // Arrange
      const data = createDefault();

      // Act
      const result = toggleEquip(data, 'aggressive');

      // Assert
      expect(result).toBeUndefined();
    });

    it('装備中スタイルを外す（残り1つの場合は外せない）', () => {
      // Arrange
      const data = createDefault();

      // Act
      const result = toggleEquip(data, 'standard');

      // Assert
      expect(result).toBeUndefined();
    });

    it('装備中スタイルを外す（残り2つの場合は外せる）', () => {
      // Arrange
      const data = createDefault({
        sty: ['standard', 'aggressive'],
        eq: ['standard', 'aggressive'],
        ui: ['slot2'],
      });

      // Act
      const result = toggleEquip(data, 'standard');

      // Assert
      expect(result).toBeDefined();
      expect(result!.eq).toEqual(['aggressive']);
    });

    it('所持スタイルを新規装備する', () => {
      // Arrange
      const data = createDefault({
        sty: ['standard', 'aggressive'],
        ui: ['slot2'],
      });

      // Act
      const result = toggleEquip(data, 'aggressive');

      // Assert
      expect(result).toBeDefined();
      expect(result!.eq).toContain('aggressive');
    });

    it('スロット上限を超える場合は最古のスタイルが外れる', () => {
      // Arrange: スロット1つ、standard 装備中
      const data = createDefault({
        sty: ['standard', 'aggressive'],
      });

      // Act: aggressive を装備 → standard が押し出される
      const result = toggleEquip(data, 'aggressive');

      // Assert
      expect(result).toBeDefined();
      expect(result!.eq).toEqual(['aggressive']);
      expect(result!.eq).not.toContain('standard');
    });

    it('元のデータを変更しない', () => {
      // Arrange
      const data = createDefault({
        sty: ['standard', 'aggressive'],
        ui: ['slot2'],
      });
      const originalEq = [...data.eq];

      // Act
      toggleEquip(data, 'aggressive');

      // Assert
      expect(data.eq).toEqual(originalEq);
    });
  });
});

import {
  createHealthLarge,
  createHealthSmall,
  createHealthFull,
  createLevelUpItem,
  createMapRevealItem,
  canPickupItem,
  pickupItem,
  resetItemIdCounter,
} from '../item';
import { ItemType } from '../types';
import { createTestPlayer, createTestPlayerWithStats } from './testUtils';

describe('item', () => {
  beforeEach(() => {
    resetItemIdCounter();
  });

  describe('アイテム生成', () => {
    test('小回復アイテムが正しく生成されること', () => {
      const small = createHealthSmall(1, 1);
      expect(small.healAmount).toBe(3);
      expect(small.type).toBe(ItemType.HEALTH_SMALL);
    });

    test('大回復アイテムが正しく生成されること', () => {
      const large = createHealthLarge(2, 2);
      expect(large.healAmount).toBe(7);
      expect(large.type).toBe(ItemType.HEALTH_LARGE);
    });

    test('全回復アイテムが正しく生成されること', () => {
      const full = createHealthFull(3, 3);
      expect(full.type).toBe(ItemType.HEALTH_FULL);
    });

    test('レベルアップアイテムが正しく生成されること', () => {
      const levelUp = createLevelUpItem(4, 4);
      expect(levelUp.type).toBe(ItemType.LEVEL_UP);
    });

    test('マップ公開アイテムが正しく生成されること', () => {
      const mapReveal = createMapRevealItem(5, 5);
      expect(mapReveal.type).toBe(ItemType.MAP_REVEAL);
    });
  });

  describe('アイテム取得判定', () => {
    test('同じタイルで取得可能になること', () => {
      const player = createTestPlayer(2, 2);
      const item = createHealthSmall(2, 2);
      expect(canPickupItem(player, item)).toBe(true);
    });

    test('離れている場合は取得できないこと', () => {
      const player = createTestPlayer(2, 2);
      const item = createHealthSmall(3, 3);
      expect(canPickupItem(player, item)).toBe(false);
    });
  });

  describe('回復アイテム効果', () => {
    test('小回復アイテムで回復すること（戦士）', () => {
      // 戦士はhealBonus: 1を持つため、回復量3+1=4
      const player = { ...createTestPlayer(2, 2), hp: 12, maxHp: 20 };
      const item = createHealthSmall(2, 2);
      const result = pickupItem(player, item);
      expect(result.player.hp).toBe(16); // 12 + 4 = 16
      expect(result.effectType).toBe('heal');
      expect(result.triggerLevelUp).toBe(false);
      expect(result.triggerMapReveal).toBe(false);
    });

    test('大回復アイテムで最大HPを超えないこと', () => {
      // 戦士はhealBonus: 1、maxHp: 20
      const player = { ...createTestPlayer(2, 2), hp: 18, maxHp: 20 };
      const item = createHealthLarge(2, 2); // 回復量7+1=8
      const result = pickupItem(player, item);
      expect(result.player.hp).toBe(20); // 最大HP
      expect(result.effectType).toBe('heal');
    });

    test('全回復アイテムでmaxHpまで回復すること', () => {
      const player = { ...createTestPlayer(2, 2), hp: 1, maxHp: 20 };
      const item = createHealthFull(2, 2);
      const result = pickupItem(player, item);
      expect(result.player.hp).toBe(20);
      expect(result.effectType).toBe('heal');
    });

    describe('回復量ボーナス', () => {
      test('healBonusが加算されること', () => {
        // healBonus = 2のプレイヤーを作成
        const player = { ...createTestPlayerWithStats({ healBonus: 2 }, 2, 2), hp: 10, maxHp: 20 };
        const item = createHealthSmall(2, 2); // 回復量3
        const result = pickupItem(player, item);
        // 3 + 2 = 5回復 → hp: 10 + 5 = 15
        expect(result.player.hp).toBe(15);
      });

      test('healBonusが0の場合は通常の回復量になること', () => {
        const player = { ...createTestPlayerWithStats({ healBonus: 0 }, 2, 2), hp: 10, maxHp: 20 };
        const item = createHealthSmall(2, 2); // 回復量3
        const result = pickupItem(player, item);
        expect(result.player.hp).toBe(13);
      });

      test('healBonus付きでも最大HPを超えないこと', () => {
        const player = { ...createTestPlayerWithStats({ healBonus: 5 }, 2, 2), hp: 18, maxHp: 20 };
        const item = createHealthSmall(2, 2); // 回復量3 + 5 = 8
        const result = pickupItem(player, item);
        expect(result.player.hp).toBe(20);
      });
    });
  });

  describe('特殊アイテム効果', () => {
    test('レベルアップアイテムでレベルアップがトリガーされること', () => {
      const player = createTestPlayer(2, 2);
      const item = createLevelUpItem(2, 2);
      const result = pickupItem(player, item);
      expect(result.effectType).toBe('level_up');
      expect(result.triggerLevelUp).toBe(true);
      expect(result.triggerMapReveal).toBe(false);
    });

    test('マップ公開アイテムでマップ公開がトリガーされること', () => {
      const player = createTestPlayer(2, 2);
      const item = createMapRevealItem(2, 2);
      const result = pickupItem(player, item);
      expect(result.effectType).toBe('map_reveal');
      expect(result.triggerLevelUp).toBe(false);
      expect(result.triggerMapReveal).toBe(true);
    });
  });
});

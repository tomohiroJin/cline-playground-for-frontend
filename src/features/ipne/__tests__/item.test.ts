import {
  createHealthLarge,
  createHealthSmall,
  createHealthFull,
  createLevelUpItem,
  createMapRevealItem,
  canPickupItem,
  pickupItem,
} from '../domain/entities/item';
import { ItemType } from '../types';
import { aPlayer } from './builders';
import { MockIdGenerator } from './mocks/MockIdGenerator';

describe('item', () => {
  let idGen: MockIdGenerator;

  beforeEach(() => {
    idGen = new MockIdGenerator();
  });

  describe('アイテム生成', () => {
    test('小回復アイテムが正しく生成されること', () => {
      const small = createHealthSmall(1, 1, idGen);
      expect(small.healAmount).toBe(3);
      expect(small.type).toBe(ItemType.HEALTH_SMALL);
    });

    test('大回復アイテムが正しく生成されること', () => {
      const large = createHealthLarge(2, 2, idGen);
      expect(large.healAmount).toBe(7);
      expect(large.type).toBe(ItemType.HEALTH_LARGE);
    });

    test('全回復アイテムが正しく生成されること', () => {
      const full = createHealthFull(3, 3, idGen);
      expect(full.type).toBe(ItemType.HEALTH_FULL);
    });

    test('レベルアップアイテムが正しく生成されること', () => {
      const levelUp = createLevelUpItem(4, 4, idGen);
      expect(levelUp.type).toBe(ItemType.LEVEL_UP);
    });

    test('マップ公開アイテムが正しく生成されること', () => {
      const mapReveal = createMapRevealItem(5, 5, idGen);
      expect(mapReveal.type).toBe(ItemType.MAP_REVEAL);
    });
  });

  describe('アイテム取得判定', () => {
    test('同じタイルで取得可能になること', () => {
      const player = aPlayer().at(2, 2).build();
      const item = createHealthSmall(2, 2, idGen);
      expect(canPickupItem(player, item)).toBe(true);
    });

    test('離れている場合は取得できないこと', () => {
      const player = aPlayer().at(2, 2).build();
      const item = createHealthSmall(3, 3, idGen);
      expect(canPickupItem(player, item)).toBe(false);
    });
  });

  describe('回復アイテム効果', () => {
    test('小回復アイテムで回復すること（戦士）', () => {
      // 戦士はhealBonus: 1を持つため、回復量3+1=4
      const player = aPlayer().at(2, 2).withHp(12).withStats({ healBonus: 1 }).build();
      const item = createHealthSmall(2, 2, idGen);
      const result = pickupItem(player, item);
      expect(result.player.hp).toBe(16);
      expect(result.effectType).toBe('heal');
      expect(result.triggerLevelUp).toBe(false);
      expect(result.triggerMapReveal).toBe(false);
    });

    test('大回復アイテムで最大HPを超えないこと', () => {
      // 戦士はhealBonus: 1、maxHp: 20
      const player = aPlayer().at(2, 2).withHp(18).withStats({ healBonus: 1 }).build();
      const item = createHealthLarge(2, 2, idGen);
      const result = pickupItem(player, item);
      expect(result.player.hp).toBe(20);
      expect(result.effectType).toBe('heal');
    });

    test('全回復アイテムでmaxHpまで回復すること', () => {
      const player = aPlayer().at(2, 2).withHp(1).build();
      const item = createHealthFull(2, 2, idGen);
      const result = pickupItem(player, item);
      expect(result.player.hp).toBe(20);
      expect(result.effectType).toBe('heal');
    });

    describe('回復量ボーナス', () => {
      test('healBonusが加算されること', () => {
        const player = aPlayer().at(2, 2).withHp(10).withStats({ healBonus: 2 }).build();
        const item = createHealthSmall(2, 2, idGen);
        const result = pickupItem(player, item);
        // 3 + 2 = 5回復 → hp: 10 + 5 = 15
        expect(result.player.hp).toBe(15);
      });

      test('healBonusが0の場合は通常の回復量になること', () => {
        const player = aPlayer().at(2, 2).withHp(10).withStats({ healBonus: 0 }).build();
        const item = createHealthSmall(2, 2, idGen);
        const result = pickupItem(player, item);
        expect(result.player.hp).toBe(13);
      });

      test('healBonus付きでも最大HPを超えないこと', () => {
        const player = aPlayer().at(2, 2).withHp(18).withStats({ healBonus: 5 }).build();
        const item = createHealthSmall(2, 2, idGen);
        const result = pickupItem(player, item);
        expect(result.player.hp).toBe(20);
      });
    });
  });

  describe('特殊アイテム効果', () => {
    test('レベルアップアイテムでレベルアップがトリガーされること', () => {
      const player = aPlayer().at(2, 2).build();
      const item = createLevelUpItem(2, 2, idGen);
      const result = pickupItem(player, item);
      expect(result.effectType).toBe('level_up');
      expect(result.triggerLevelUp).toBe(true);
      expect(result.triggerMapReveal).toBe(false);
    });

    test('マップ公開アイテムでマップ公開がトリガーされること', () => {
      const player = aPlayer().at(2, 2).build();
      const item = createMapRevealItem(2, 2, idGen);
      const result = pickupItem(player, item);
      expect(result.effectType).toBe('map_reveal');
      expect(result.triggerLevelUp).toBe(false);
      expect(result.triggerMapReveal).toBe(true);
    });
  });
});

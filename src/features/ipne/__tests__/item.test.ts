import {
  createHealthLarge,
  createHealthSmall,
  canPickupItem,
  pickupItem,
  resetItemIdCounter,
} from '../item';
import { createTestPlayer } from './testUtils';

describe('item', () => {
  beforeEach(() => {
    resetItemIdCounter();
  });
  test('アイテム生成が正しいこと', () => {
    const small = createHealthSmall(1, 1);
    expect(small.healAmount).toBe(3);

    const large = createHealthLarge(2, 2);
    expect(large.healAmount).toBe(7);
  });

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

  test('回復効果が適用されること', () => {
    const player = { ...createTestPlayer(2, 2), hp: 12 };
    const item = createHealthSmall(2, 2);
    const result = pickupItem(player, item);
    expect(result.player.hp).toBe(15);
  });

  test('最大HPを超えないこと', () => {
    const player = { ...createTestPlayer(2, 2), hp: 15 };
    const item = createHealthLarge(2, 2);
    const result = pickupItem(player, item);
    expect(result.player.hp).toBe(16);
  });
});

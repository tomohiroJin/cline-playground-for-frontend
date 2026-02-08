import { createPlayer } from '../../player';
import { createHealthSmall, createLevelUpItem, createMapRevealItem } from '../../item';
import { resolveItemPickupEffects } from './resolveItemPickupEffects';

describe('resolveItemPickupEffects', () => {
  it('取得可能なアイテムのみ処理して、残りアイテムを返す', () => {
    const player = { ...createPlayer(2, 2), hp: 5 };
    const healItem = createHealthSmall(2, 2);
    const otherItem = createHealthSmall(5, 5);

    const result = resolveItemPickupEffects({
      player,
      items: [healItem, otherItem],
    });

    expect(result.player.hp).toBeGreaterThan(player.hp);
    expect(result.remainingItems).toHaveLength(1);
    expect(result.remainingItems[0].id).toBe(otherItem.id);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].healed).toBe(true);
  });

  it('レベルアップとマップ公開のフラグを集約する', () => {
    const player = createPlayer(2, 2);
    const levelUpItem = createLevelUpItem(2, 2);
    const mapRevealItem = createMapRevealItem(2, 2);

    const result = resolveItemPickupEffects({
      player,
      items: [levelUpItem, mapRevealItem],
    });

    expect(result.triggerLevelUp).toBe(true);
    expect(result.triggerMapReveal).toBe(true);
    expect(result.events).toHaveLength(2);
    expect(result.remainingItems).toHaveLength(0);
  });
});

import { canPickupItem, ItemEffectType, ItemPickupResult, pickupItem } from '../../item';
import { Item, Player } from '../../types';

interface ResolveItemPickupEffectsParams {
  player: Player;
  items: Item[];
  canPickup?: (player: Player, item: Item) => boolean;
  pickup?: (player: Player, item: Item) => ItemPickupResult;
}

export interface ItemPickupEffectEvent {
  itemId: string;
  effectType: ItemEffectType;
  healed: boolean;
}

interface ResolveItemPickupEffectsResult {
  player: Player;
  remainingItems: Item[];
  triggerLevelUp: boolean;
  triggerMapReveal: boolean;
  triggerKeyPickup: boolean;
  events: ItemPickupEffectEvent[];
}

/**
 * アイテム取得と派生効果を解決するユースケース
 */
export function resolveItemPickupEffects({
  player,
  items,
  canPickup = canPickupItem,
  pickup = pickupItem,
}: ResolveItemPickupEffectsParams): ResolveItemPickupEffectsResult {
  let nextPlayer = player;
  const pickedIds: string[] = [];
  let triggerLevelUp = false;
  let triggerMapReveal = false;
  let triggerKeyPickup = false;
  const events: ItemPickupEffectEvent[] = [];

  for (const item of items) {
    if (!canPickup(nextPlayer, item)) continue;

    const prevHp = nextPlayer.hp;
    const result = pickup(nextPlayer, item);
    nextPlayer = result.player;

    pickedIds.push(result.itemId);
    if (result.triggerLevelUp) triggerLevelUp = true;
    if (result.triggerMapReveal) triggerMapReveal = true;
    if (result.triggerKeyPickup) triggerKeyPickup = true;

    events.push({
      itemId: result.itemId,
      effectType: result.effectType,
      healed: nextPlayer.hp > prevHp,
    });
  }

  return {
    player: nextPlayer,
    remainingItems: items.filter(item => !pickedIds.includes(item.id)),
    triggerLevelUp,
    triggerMapReveal,
    triggerKeyPickup,
    events,
  };
}

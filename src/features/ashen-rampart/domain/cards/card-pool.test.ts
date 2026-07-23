/**
 * 灰燼の城壁 - カードプールテスト
 */
import { getCardDefinition, INITIAL_DECK, REWARD_POOL } from './card-pool';

describe('card-pool', () => {
  it('初期デッキは10枚（タワー6・スペル3・罠1）', () => {
    expect(INITIAL_DECK).toHaveLength(10);
    const types = INITIAL_DECK.map((id) => getCardDefinition(id).type);
    expect(types.filter((t) => t === 'tower')).toHaveLength(6);
    expect(types.filter((t) => t === 'spell')).toHaveLength(3);
    expect(types.filter((t) => t === 'trap')).toHaveLength(1);
  });

  it('報酬プールの全カードが定義済みでコストが1以上', () => {
    expect(REWARD_POOL.length).toBeGreaterThanOrEqual(6);
    for (const id of REWARD_POOL) {
      const card = getCardDefinition(id);
      expect(card.cost).toBeGreaterThanOrEqual(1);
    }
  });

  it('タワーカードは tower スペックを持つ', () => {
    const arrow = getCardDefinition('arrow-tower');
    expect(arrow.type).toBe('tower');
    expect(arrow.tower).toBeDefined();
    expect(arrow.tower?.range).toBeGreaterThan(0);
  });

  it('未知のカードIDは例外を投げる', () => {
    expect(() => getCardDefinition('unknown-card')).toThrow();
  });

  it('初期デッキは10枚で、かがり火と火砲台を含む', () => {
    expect(INITIAL_DECK).toHaveLength(10);
    expect(INITIAL_DECK).toContain('beacon');
    expect(INITIAL_DECK).toContain('cannon-tower');
  });

  it('初期デッキの弓兵の塔は4枚に抑えられている', () => {
    const arrows = INITIAL_DECK.filter((id) => id === 'arrow-tower');
    expect(arrows).toHaveLength(4);
  });
});

import { DOMAIN_ITEMS } from './items';

describe('アイテム定数', () => {
  it('アイテムが6種類定義されている', () => {
    expect(DOMAIN_ITEMS).toHaveLength(6);
  });

  it('各アイテムに必須プロパティがある', () => {
    for (const item of DOMAIN_ITEMS) {
      expect(item.id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.color).toBeDefined();
      expect(item.icon).toBeDefined();
    }
  });

  it('全アイテムIDが一意である', () => {
    const ids = DOMAIN_ITEMS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

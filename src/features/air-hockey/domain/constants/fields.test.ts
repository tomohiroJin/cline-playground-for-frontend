import { DOMAIN_FIELDS } from './fields';

describe('フィールド定数', () => {
  it('フィールドが6つ定義されている', () => {
    expect(DOMAIN_FIELDS).toHaveLength(6);
  });

  it('各フィールドに必須プロパティがある', () => {
    for (const field of DOMAIN_FIELDS) {
      expect(field.id).toBeDefined();
      expect(field.name).toBeDefined();
      expect(field.goalSize).toBeGreaterThan(0);
      expect(field.color).toBeDefined();
      expect(field.obstacles).toBeDefined();
    }
  });

  it('classic フィールドに障害物がない', () => {
    const classic = DOMAIN_FIELDS.find(f => f.id === 'classic');
    expect(classic?.obstacles).toHaveLength(0);
  });

  it('fortress フィールドが破壊可能である', () => {
    const fortress = DOMAIN_FIELDS.find(f => f.id === 'fortress');
    expect(fortress?.destructible).toBe(true);
    expect(fortress?.obstacleHp).toBe(3);
  });
});

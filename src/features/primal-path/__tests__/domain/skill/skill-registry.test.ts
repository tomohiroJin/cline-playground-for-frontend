/**
 * skillRegistry のテスト
 */
import { skillRegistry } from '../../../domain/skill/skill-registry';

describe('skillRegistry', () => {
  it('全4種類のスキルタイプが登録されている', () => {
    expect(skillRegistry.has('dmgAll')).toBe(true);
    expect(skillRegistry.has('healAll')).toBe(true);
    expect(skillRegistry.has('buffAtk')).toBe(true);
    expect(skillRegistry.has('shield')).toBe(true);
  });

  it('登録されていないタイプはundefinedを返す', () => {
    // 型安全なレジストリのため、ランタイムでの未知キーテストはキャストが必要
    expect((skillRegistry as ReadonlyMap<string, unknown>).get('unknown')).toBeUndefined();
  });
});

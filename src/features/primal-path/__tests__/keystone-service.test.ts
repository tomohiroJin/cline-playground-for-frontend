/**
 * キーストーン — 定数とエンジンのテスト
 */
import { KEYSTONES } from '../constants';
import type { KeystoneId } from '../types';

describe('KEYSTONES 定数', () => {
  it('10種が定義され、id が一意である', () => {
    expect(KEYSTONES).toHaveLength(10);
    const ids = KEYSTONES.map(k => k.id);
    expect(new Set(ids).size).toBe(10);
  });

  it('各キーストーンは tag と curve を持つ', () => {
    for (const k of KEYSTONES) {
      expect(k.tag).toBeTruthy();
      expect(['front', 'scaling', 'combo', 'wild']).toContain(k.curve);
    }
  });

  it('代表 id が含まれる', () => {
    const ids = KEYSTONES.map(k => k.id);
    const expected: KeystoneId[] = ['madblood', 'chain_blaze', 'thorn_guard', 'double_edge'];
    expect(ids).toEqual(expect.arrayContaining(expected));
  });

  it('KEYSTONES は凍結されている', () => {
    expect(Object.isFrozen(KEYSTONES)).toBe(true);
  });
});

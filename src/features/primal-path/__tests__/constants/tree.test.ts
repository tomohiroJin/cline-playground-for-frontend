/**
 * constants/tree.ts のテスト
 */
import { TREE, TIER_UNLOCK, TIER_NAMES } from '../../constants/tree';

describe('constants/tree', () => {
  describe('TREE（文明ツリー）', () => {
    it('ツリーノードが定義されている', () => {
      expect(TREE.length).toBeGreaterThanOrEqual(30);
    });

    it('各ノードに id, n, c, e, t が揃っている', () => {
      TREE.forEach(node => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('n');
        expect(node).toHaveProperty('c');
        expect(node).toHaveProperty('e');
        expect(node).toHaveProperty('t');
      });
    });
  });

  describe('TIER_UNLOCK', () => {
    it('8ティアのアンロック条件が定義されている', () => {
      expect(Object.keys(TIER_UNLOCK)).toHaveLength(8);
    });
  });

  describe('TIER_NAMES', () => {
    it('8ティアの名前が定義されている', () => {
      expect(Object.keys(TIER_NAMES)).toHaveLength(8);
    });
  });
});

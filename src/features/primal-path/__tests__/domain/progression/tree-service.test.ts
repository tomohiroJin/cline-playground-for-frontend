/**
 * domain/progression/tree-service のテスト
 */
import { getTB, tbSummary, bestDiffLabel } from '../../../domain/progression/tree-service';
import { TB_DEFAULTS, FRESH_SAVE, TREE, DIFFS } from '../../../constants';

describe('domain/progression/tree-service', () => {
  describe('getTB', () => {
    it('空のツリーの場合デフォルト値を返す', () => {
      const tb = getTB({});
      expect(tb).toEqual(TB_DEFAULTS);
    });

    it('購入済みノードのボーナスが反映される', () => {
      // Arrange: 最初のツリーノードを購入
      const firstNode = TREE[0];
      if (!firstNode) return;
      const tree: Record<string, number> = { [firstNode.id]: 1 };

      // Act
      const tb = getTB(tree);

      // Assert: ノードの効果が適用されている
      const effectKeys = Object.keys(firstNode.e) as (keyof typeof firstNode.e)[];
      effectKeys.forEach(k => {
        const v = firstNode.e[k];
        if (v !== undefined) {
          expect(tb[k]).toBe(TB_DEFAULTS[k] + v);
        }
      });
    });

    it('複数ノード購入時にボーナスが累積する', () => {
      // Arrange: 同じ効果を持つ2つのノードを探す
      const bANodes = TREE.filter(n => n.e.bA !== undefined);
      if (bANodes.length < 2) return;
      const tree: Record<string, number> = {
        [bANodes[0].id]: 1,
        [bANodes[1].id]: 1,
      };

      // Act
      const tb = getTB(tree);

      // Assert: bA が2つ分累積
      expect(tb.bA).toBe(TB_DEFAULTS.bA + (bANodes[0].e.bA ?? 0) + (bANodes[1].e.bA ?? 0));
    });

    it('tree[id]=0のノードは無視される', () => {
      // Arrange
      const firstNode = TREE[0];
      if (!firstNode) return;
      const tree: Record<string, number> = { [firstNode.id]: 0 };

      // Act
      const tb = getTB(tree);

      // Assert: デフォルト値と同じ
      expect(tb).toEqual(TB_DEFAULTS);
    });

    it('存在しないノードIDは無視される', () => {
      // Arrange
      const tree: Record<string, number> = { 'nonexistent_node': 1 };

      // Act
      const tb = getTB(tree);

      // Assert: デフォルト値と同じ
      expect(tb).toEqual(TB_DEFAULTS);
    });
  });

  describe('tbSummary', () => {
    it('デフォルトボーナスの場合空配列を返す', () => {
      expect(tbSummary({ ...TB_DEFAULTS })).toEqual([]);
    });

    it('ATKボーナスがある場合ATK+Nを含む', () => {
      const tb = { ...TB_DEFAULTS, bA: 5 };
      expect(tbSummary(tb)).toContain('ATK+5');
    });

    it('HPボーナスがある場合HP+Nを含む', () => {
      const tb = { ...TB_DEFAULTS, bH: 20 };
      expect(tbSummary(tb)).toContain('HP+20');
    });

    it('DEFボーナスがある場合DEF+Nを含む', () => {
      const tb = { ...TB_DEFAULTS, bD: 3 };
      expect(tbSummary(tb)).toContain('DEF+3');
    });

    it('会心ボーナスがある場合パーセント表示で含む', () => {
      const tb = { ...TB_DEFAULTS, cr: 0.1 };
      expect(tbSummary(tb)).toContain('会心+10%');
    });

    it('骨ボーナスがある場合パーセント表示で含む', () => {
      const tb = { ...TB_DEFAULTS, bM: 0.25 };
      expect(tbSummary(tb)).toContain('骨+25%');
    });

    it('復活ボーナスがある場合に表示される', () => {
      const tb = { ...TB_DEFAULTS, rv: 1 };
      expect(tbSummary(tb)).toContain('復活');
    });

    it('仲間枠ボーナスがある場合に表示される', () => {
      const tb = { ...TB_DEFAULTS, aS: 1 };
      expect(tbSummary(tb)).toContain('仲間枠+1');
    });

    it('複数ボーナスがある場合に全て表示される', () => {
      const tb = { ...TB_DEFAULTS, bA: 5, bH: 10, cr: 0.05 };
      const parts = tbSummary(tb);
      expect(parts).toContain('ATK+5');
      expect(parts).toContain('HP+10');
      expect(parts).toContain('会心+5%');
    });
  });

  describe('bestDiffLabel', () => {
    it('クリアした難易度がない場合は空文字を返す', () => {
      expect(bestDiffLabel({ ...FRESH_SAVE })).toBe('');
    });

    it('クリア済み難易度がある場合にアイコン+名前を返す', () => {
      // Arrange
      const save = { ...FRESH_SAVE, best: { 0: 1 } };

      // Act
      const label = bestDiffLabel(save);

      // Assert
      expect(label).toContain(DIFFS[0].ic);
      expect(label).toContain(DIFFS[0].n);
    });

    it('複数難易度クリア済みの場合にスペース区切りで結合される', () => {
      // Arrange
      const save = { ...FRESH_SAVE, best: { 0: 1, 1: 1 } };

      // Act
      const label = bestDiffLabel(save);

      // Assert
      expect(label).toContain(DIFFS[0].n);
      if (DIFFS.length > 1) {
        expect(label).toContain(DIFFS[1].n);
        expect(label).toContain(' ');
      }
    });
  });
});

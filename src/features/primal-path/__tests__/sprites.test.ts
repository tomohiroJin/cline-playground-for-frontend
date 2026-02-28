/**
 * 原始進化録 - PRIMAL PATH - スプライトバリエーションテスト
 */
import { getAwakeningVisual } from '../sprites';
import type { AwokenRecord, CivTypeExt } from '../types';

describe('スプライトバリエーション', () => {
  describe('getAwakeningVisual', () => {
    it('覚醒なしの場合は空の装飾情報を返す', () => {
      const result = getAwakeningVisual(null, []);
      expect(result.symbols).toHaveLength(0);
      expect(result.hasAura).toBe(false);
    });

    it('小覚醒1つの場合はシンボルを1つ返す', () => {
      const awoken: AwokenRecord[] = [
        { id: 'sa_tech', nm: '炎の目覚め', cl: '#f08050' },
      ];
      const result = getAwakeningVisual(null, awoken);
      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].color).toBe('#f08050');
      expect(result.hasAura).toBe(false);
    });

    it('大覚醒の場合はオーラエフェクトを持つ', () => {
      const awoken: AwokenRecord[] = [
        { id: 'sa_tech', nm: '炎の目覚め', cl: '#f08050' },
        { id: 'fa_tech', nm: '炎王の始祖', cl: '#f08050' },
      ];
      const result = getAwakeningVisual('tech', awoken);
      expect(result.hasAura).toBe(true);
      expect(result.auraColor).toBe('#f08050');
    });

    it('複数の小覚醒がある場合はそれぞれシンボルを返す', () => {
      const awoken: AwokenRecord[] = [
        { id: 'sa_tech', nm: '炎の目覚め', cl: '#f08050' },
        { id: 'sa_life', nm: '森の息吹', cl: '#50e090' },
      ];
      const result = getAwakeningVisual(null, awoken);
      expect(result.symbols).toHaveLength(2);
    });

    it('大覚醒(fe指定)でオーラカラーはfe色に一致する', () => {
      const feOptions: CivTypeExt[] = ['tech', 'life', 'rit', 'bal'];
      const clMap: Record<string, string> = {
        tech: '#f08050',
        life: '#50e090',
        rit: '#d060ff',
        bal: '#e0c060',
      };

      for (const fe of feOptions) {
        const awoken: AwokenRecord[] = [
          { id: `fa_${fe}`, nm: 'テスト覚醒', cl: clMap[fe] },
        ];
        const result = getAwakeningVisual(fe, awoken);
        expect(result.hasAura).toBe(true);
        expect(result.auraColor).toBe(clMap[fe]);
      }
    });
  });
});

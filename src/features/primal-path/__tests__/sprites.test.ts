/**
 * 原始進化録 - PRIMAL PATH - スプライトバリエーション・描画関数テスト
 */
import { getAwakeningVisual, drawEnemyHpBar, drawStatusIcons, drawBurnFx, drawDmgPopup } from '../sprites';
import type { AwokenRecord, CivTypeExt, DmgPopup } from '../types';

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

    it('覚醒IDからシンボル形状が正しく決定される', () => {
      const testCases: { id: string; expected: string }[] = [
        { id: 'sa_tech', expected: 'flame' },
        { id: 'fa_tech', expected: 'flame' },
        { id: 'sa_life', expected: 'leaf' },
        { id: 'sa_rit', expected: 'skull' },
        { id: 'sa_bal', expected: 'star' },
        { id: 'unknown', expected: 'star' },
      ];

      for (const { id, expected } of testCases) {
        const awoken: AwokenRecord[] = [{ id, nm: 'テスト', cl: '#fff' }];
        const result = getAwakeningVisual(null, awoken);
        expect(result.symbols[0].shape).toBe(expected);
      }
    });
  });

  describe('drawEnemyHpBar', () => {
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      ctx = {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
      } as unknown as CanvasRenderingContext2D;
    });

    it('HPが満タンの場合は緑色のバーを描画する', () => {
      drawEnemyHpBar(ctx, 100, 100, 0, 0, 50);
      // fillRect が呼ばれていること（背景 + HPバー）
      expect(ctx.fillRect).toHaveBeenCalledTimes(2);
      // HPバーの色は緑（ratio > 0.5）
      const fillCalls = (ctx.fillRect as jest.Mock).mock.calls;
      // 2回目のfillRectの直前にfillStyleが設定されるので、最終的なfillStyleを確認
      expect(ctx.fillStyle).toBe('#50e090');
    });

    it('HPが低い場合は赤色のバーを描画する', () => {
      drawEnemyHpBar(ctx, 10, 100, 0, 0, 50);
      // ratio = 0.1 < 0.2 なので赤色
      expect(ctx.fillStyle).toBe('#f05050');
    });

    it('HPが中間の場合は黄色のバーを描画する', () => {
      drawEnemyHpBar(ctx, 30, 100, 0, 0, 50);
      // ratio = 0.3 > 0.2 かつ <= 0.5 なので黄色
      expect(ctx.fillStyle).toBe('#f0c040');
    });

    it('HP=0の場合もエラーなく描画される', () => {
      expect(() => drawEnemyHpBar(ctx, 0, 100, 0, 0, 50)).not.toThrow();
    });

    it('枠線が描画される', () => {
      drawEnemyHpBar(ctx, 50, 100, 10, 20, 60);
      expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 60, 3);
    });
  });

  describe('drawStatusIcons', () => {
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      ctx = {
        font: '',
        fillText: jest.fn(),
      } as unknown as CanvasRenderingContext2D;
    });

    it('火傷中は🔥アイコンが描画される', () => {
      drawStatusIcons(ctx, 10, 20, true);
      expect(ctx.fillText).toHaveBeenCalledWith('🔥', 10, 20);
    });

    it('火傷なしの場合はアイコンが描画されない', () => {
      drawStatusIcons(ctx, 10, 20, false);
      expect(ctx.fillText).not.toHaveBeenCalled();
    });
  });

  describe('drawBurnFx', () => {
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      ctx = {
        globalAlpha: 1,
        fillStyle: '',
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
      } as unknown as CanvasRenderingContext2D;
    });

    it('12個のパーティクルが描画される', () => {
      drawBurnFx(ctx, 48, 48, 0);
      // 各パーティクルはメイン + 白い芯 = 2回描画 × 12個 = 24回
      expect(ctx.fill).toHaveBeenCalledTimes(24);
    });

    it('描画後に globalAlpha が 1 にリセットされる', () => {
      drawBurnFx(ctx, 48, 48, 5);
      expect(ctx.globalAlpha).toBe(1);
    });
  });

  describe('drawDmgPopup', () => {
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      ctx = {
        globalAlpha: 1,
        font: '',
        textAlign: '',
        strokeStyle: '',
        fillStyle: '',
        lineWidth: 0,
        strokeText: jest.fn(),
        fillText: jest.fn(),
      } as unknown as CanvasRenderingContext2D;
    });

    it('ダメージ値がテキストで描画される', () => {
      const popup: DmgPopup = { v: 42, x: 0.5, y: -10, cl: '#fff', fs: 14, a: 1, lt: 8 };
      drawDmgPopup(ctx, popup, 100, 100);
      expect(ctx.strokeText).toHaveBeenCalledWith('42', 50, 40);
      expect(ctx.fillText).toHaveBeenCalledWith('42', 50, 40);
    });

    it('ポップアップのアルファ値が反映される', () => {
      const popup: DmgPopup = { v: 10, x: 0.5, y: 0, cl: '#f00', fs: 20, a: 0.5, lt: 4 };
      drawDmgPopup(ctx, popup, 100, 100);
      // 描画後に globalAlpha が 1 にリセットされる
      expect(ctx.globalAlpha).toBe(1);
    });

    it('ポップアップの色が正しく設定される', () => {
      const popup: DmgPopup = { v: 99, x: 0.5, y: 0, cl: '#50e090', fs: 14, a: 1, lt: 8 };
      drawDmgPopup(ctx, popup, 100, 100);
      expect(ctx.fillStyle).toBe('#50e090');
    });
  });
});

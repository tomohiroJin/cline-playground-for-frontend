/**
 * colorUtils のユニットテスト
 *
 * 色操作ユーティリティの動作を検証する。
 */

import { applyAlpha, CLASS_BASE_COLORS, GOLD_COLOR, WHITE_COLOR } from './colorUtils';
import { PlayerClass } from '../../types';

describe('colorUtils', () => {
  describe('applyAlpha', () => {
    it('テンプレートの {a} をアルファ値に置換する', () => {
      // Arrange
      const template = 'rgba(102, 126, 234, {a})';

      // Act
      const result = applyAlpha(template, 0.5);

      // Assert
      expect(result).toBe('rgba(102, 126, 234, 0.500)');
    });

    it('アルファ値0で完全透明を返す', () => {
      const result = applyAlpha('rgba(255, 255, 255, {a})', 0);
      expect(result).toBe('rgba(255, 255, 255, 0.000)');
    });

    it('アルファ値1で完全不透明を返す', () => {
      const result = applyAlpha('rgba(255, 255, 255, {a})', 1);
      expect(result).toBe('rgba(255, 255, 255, 1.000)');
    });

    it('小数点以下3桁に丸める', () => {
      const result = applyAlpha('rgba(0, 0, 0, {a})', 0.123456789);
      expect(result).toBe('rgba(0, 0, 0, 0.123)');
    });

    it('テンプレートに {a} がない場合はそのまま返す', () => {
      const result = applyAlpha('rgb(0, 0, 0)', 0.5);
      expect(result).toBe('rgb(0, 0, 0)');
    });
  });

  describe('CLASS_BASE_COLORS', () => {
    it('戦士の基本色テンプレートが定義されている', () => {
      expect(CLASS_BASE_COLORS[PlayerClass.WARRIOR]).toContain('{a}');
      expect(CLASS_BASE_COLORS[PlayerClass.WARRIOR]).toContain('102');
    });

    it('盗賊の基本色テンプレートが定義されている', () => {
      expect(CLASS_BASE_COLORS[PlayerClass.THIEF]).toContain('{a}');
      expect(CLASS_BASE_COLORS[PlayerClass.THIEF]).toContain('167');
    });

    it('全職業の色テンプレートで applyAlpha が使える', () => {
      const classes = [PlayerClass.WARRIOR, PlayerClass.THIEF] as const;
      for (const cls of classes) {
        const result = applyAlpha(CLASS_BASE_COLORS[cls], 0.5);
        expect(result).not.toContain('{a}');
        expect(result).toContain('0.500');
      }
    });
  });

  describe('定数テンプレート', () => {
    it('GOLD_COLOR テンプレートが正しい形式である', () => {
      expect(GOLD_COLOR).toContain('{a}');
      const result = applyAlpha(GOLD_COLOR, 0.8);
      expect(result).toContain('0.800');
      expect(result).not.toContain('{a}');
    });

    it('WHITE_COLOR テンプレートが正しい形式である', () => {
      expect(WHITE_COLOR).toContain('{a}');
      const result = applyAlpha(WHITE_COLOR, 1.0);
      expect(result).toContain('1.000');
      expect(result).not.toContain('{a}');
    });
  });
});

import { neonGlow, playerHitboxRadius, enemyBulletCoreSize, NEON_FILTER_ID } from '../visuals';
import { Config, ColorPalette } from '../constants';

describe('visuals', () => {
  describe('neonGlow', () => {
    test('色を含む drop-shadow フィルタ文字列を返す', () => {
      const result = neonGlow('#ff5544');
      expect(result).toContain('drop-shadow');
      expect(result).toContain('#ff5544');
    });

    test('strong は soft より大きいブラー半径を使う', () => {
      // 先頭の drop-shadow のブラー px 値を取り出して比較する
      const firstBlur = (s: string): number =>
        Number(/drop-shadow\(0 0 (\d+)px/.exec(s)?.[1] ?? '0');
      expect(firstBlur(neonGlow('#fff', 'strong'))).toBeGreaterThan(
        firstBlur(neonGlow('#fff', 'soft'))
      );
    });

    test('intensity 未指定時は soft と同じ', () => {
      expect(neonGlow('#0af')).toBe(neonGlow('#0af', 'soft'));
    });
  });

  describe('playerHitboxRadius', () => {
    test('Config の size × hitboxRatio（半径直接）と一致する', () => {
      expect(playerHitboxRadius()).toBe(
        Config.player.size * Config.player.hitboxRatio
      );
    });
  });

  describe('enemyBulletCoreSize', () => {
    test('弾サイズに比例し、最小 3 を下回らない', () => {
      expect(enemyBulletCoreSize(16)).toBeGreaterThanOrEqual(3);
      expect(enemyBulletCoreSize(16)).toBeLessThan(16);
      expect(enemyBulletCoreSize(2)).toBe(3);
    });
  });

  test('NEON_FILTER_ID は安定した文字列 id', () => {
    expect(NEON_FILTER_ID).toBe('dsiNeonGlow');
  });
});

describe('ColorPalette.bullet（敵弾の役割色）', () => {
  test('敵弾はコア・グロー・縁の3色を持つ', () => {
    expect(ColorPalette.bullet.enemyCore).toBeDefined();
    expect(ColorPalette.bullet.enemyGlow).toBeDefined();
    expect(ColorPalette.bullet.enemyEdge).toBeDefined();
  });

  test('敵弾コアは高輝度（白系）で視認性を確保する', () => {
    expect(ColorPalette.bullet.enemyCore.toLowerCase()).toBe('#ffffff');
  });
});

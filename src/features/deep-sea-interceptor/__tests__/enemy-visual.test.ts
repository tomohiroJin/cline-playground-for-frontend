import {
  EnemyVisual,
  isRegularEnemyType,
  getEnemyVisual,
  type RegularEnemyType,
} from '../enemy-visual';

describe('enemy-visual', () => {
  const regulars: RegularEnemyType[] = ['basic', 'fast', 'shooter', 'tank'];

  describe('EnemyVisual テーブル', () => {
    test('通常敵4種すべてに定義がある', () => {
      regulars.forEach(t => expect(EnemyVisual[t]).toBeDefined());
    });

    test('各定義は silhouette/glowColor/danger/movement を持つ', () => {
      regulars.forEach(t => {
        const v = EnemyVisual[t];
        expect(v.silhouette).toBeTruthy();
        expect(v.glowColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(['low', 'mid', 'high']).toContain(v.danger);
        expect(['straight', 'sine', 'drift', 'weave']).toContain(v.movement);
      });
    });

    test('4種のシルエットは互いに異なる（没個性の解消）', () => {
      const silhouettes = regulars.map(t => EnemyVisual[t].silhouette);
      expect(new Set(silhouettes).size).toBe(4);
    });

    test('4種の動きは互いに異なる（挙動差別化）', () => {
      const movements = regulars.map(t => EnemyVisual[t].movement);
      expect(new Set(movements).size).toBe(4);
    });

    test('shooter は high 危険度（弾を撃つため）', () => {
      expect(EnemyVisual.shooter.danger).toBe('high');
    });
  });

  describe('isRegularEnemyType', () => {
    test('通常敵4種には true', () => {
      regulars.forEach(t => expect(isRegularEnemyType(t)).toBe(true));
    });
    test('ボス・機雷には false', () => {
      ['boss1', 'midboss1', 'mine', 'boss5'].forEach(t =>
        expect(isRegularEnemyType(t)).toBe(false)
      );
    });
  });

  describe('getEnemyVisual', () => {
    test('通常敵は定義を返す', () => {
      expect(getEnemyVisual('fast')?.silhouette).toBe('dart');
    });
    test('非通常敵は undefined', () => {
      expect(getEnemyVisual('boss1')).toBeUndefined();
      expect(getEnemyVisual('mine')).toBeUndefined();
    });
  });
});

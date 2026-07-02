import {
  EnemyVisual,
  isRegularEnemyType,
  getEnemyVisual,
  isEnemyTelegraphing,
  TELEGRAPH_LEAD_MS,
  type RegularEnemyType,
} from '../enemy-visual';
import { EntityFactory } from '../entities';

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

  describe('isEnemyTelegraphing', () => {
    // shooter は canShoot=true, fireRate=2000。y>0 の位置に配置する。
    const makeShooter = (lastShotAt: number, y = 100): ReturnType<typeof EntityFactory.enemy> => {
      const e = EntityFactory.enemy('shooter', 400, y);
      e.lastShotAt = lastShotAt;
      return e;
    };

    test('発射直後（クールダウン開始直後）は予兆なし', () => {
      const now = 10000;
      const e = makeShooter(now); // elapsed 0
      expect(isEnemyTelegraphing(e, now)).toBe(false);
    });

    test('クールダウン残りが先行時間を切ると予兆あり', () => {
      const now = 10000;
      // elapsed = fireRate - TELEGRAPH_LEAD_MS ちょうどで境界成立
      const e = makeShooter(now - (2000 - TELEGRAPH_LEAD_MS));
      expect(isEnemyTelegraphing(e, now)).toBe(true);
    });

    test('撃たない敵（basic, canShoot=false）は常に予兆なし', () => {
      const e = EntityFactory.enemy('basic', 400, 100);
      e.lastShotAt = 0;
      expect(isEnemyTelegraphing(e, 999999)).toBe(false);
    });

    test('画面外（y<=0）は予兆なし', () => {
      const now = 10000;
      const e = makeShooter(now - 2000, 0); // 十分経過だが y=0
      expect(isEnemyTelegraphing(e, now)).toBe(false);
    });
  });
});

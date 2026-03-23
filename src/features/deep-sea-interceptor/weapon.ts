// ============================================================================
// Deep Sea Interceptor - 武器ロジック（純粋関数）
// ============================================================================

import { EntityFactory } from './entities';
import type { Bullet, WeaponType } from './types';

/** 武器タイプ別の射撃ロジック（純粋関数） */
export function createBulletsForWeapon(
  x: number,
  y: number,
  weaponType: WeaponType,
  power: number,
  hasSpread: boolean
): Bullet[] {
  const bullets: Bullet[] = [];

  switch (weaponType) {
    case 'torpedo': {
      // トーピード: power レベルに応じた弾数
      const angles = hasSpread
        ? [-0.25, 0, 0.25]
        : power >= 5
          ? [-0.1, 0, 0.1, 0]
          : power >= 4
            ? [-0.1, 0, 0.1]
            : power >= 3
              ? [-0.1, 0.1]
              : [0];
      for (const a of angles) {
        bullets.push(
          EntityFactory.bullet(x, y - 24, {
            angle: -Math.PI / 2 + a,
            weaponType: 'torpedo',
            damage: power >= 2 && a === 0 ? 1.5 : 1,
          })
        );
      }
      break;
    }
    case 'sonarWave': {
      // ソナーウェーブ: 扇状発射、高火力・射程制限あり（強化済み）
      const spreadAngle = power >= 5 ? 0.40 : power >= 3 ? 0.30 : 0.20;
      const lifespan = power >= 5 ? 70 : power >= 3 ? 55 : 45;
      const dmg = power >= 5 ? 4.0 : power >= 3 ? 3.0 : 2.0;
      const count = power >= 5 ? 7 : power >= 3 ? 5 : 3;
      for (let i = 0; i < count; i++) {
        const a = (i - (count - 1) / 2) * (spreadAngle / ((count - 1) / 2 || 1));
        bullets.push(
          EntityFactory.bullet(x, y - 24, {
            angle: -Math.PI / 2 + a,
            weaponType: 'sonarWave',
            speed: 13,
            damage: dmg,
            lifespan,
          })
        );
      }
      break;
    }
    case 'bioMissile': {
      // バイオミサイル: ホーミング弾
      const count = power >= 5 ? 3 : power >= 3 ? 2 : 1;
      const dmg = 1;
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * 0.2;
        bullets.push(
          EntityFactory.bullet(x, y - 24, {
            angle: -Math.PI / 2 + offset,
            weaponType: 'bioMissile',
            speed: 9,
            damage: dmg,
            homing: true,
          })
        );
      }
      break;
    }
  }

  return bullets;
}

/** 武器タイプ別チャージショット（純粋関数） */
export function createChargedShot(
  x: number,
  y: number,
  weaponType: WeaponType
): Bullet[] {
  const bullets: Bullet[] = [];

  switch (weaponType) {
    case 'torpedo':
      bullets.push(
        EntityFactory.bullet(x, y - 24, {
          charged: true,
          weaponType: 'torpedo',
          piercing: true,
          damage: 5,
        })
      );
      break;
    case 'sonarWave':
      // 全方位12発パルス（貫通付き）
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        bullets.push(
          EntityFactory.bullet(x, y, {
            charged: true,
            weaponType: 'sonarWave',
            angle,
            speed: 10,
            damage: 6,
            lifespan: 50,
            piercing: true,
          })
        );
      }
      break;
    case 'bioMissile':
      // 追尾型拡散5発
      for (let i = 0; i < 5; i++) {
        const offset = (i - 2) * 0.3;
        bullets.push(
          EntityFactory.bullet(x, y - 24, {
            charged: true,
            weaponType: 'bioMissile',
            angle: -Math.PI / 2 + offset,
            speed: 10,
            damage: 2,
            homing: true,
          })
        );
      }
      break;
  }

  return bullets;
}

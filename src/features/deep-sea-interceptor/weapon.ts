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
          EntityFactory.bullet(x, y - 12, {
            angle: -Math.PI / 2 + a,
            weaponType: 'torpedo',
            damage: power >= 2 && a === 0 ? 1.5 : 1,
          })
        );
      }
      break;
    }
    case 'sonarWave': {
      // ソナーウェーブ: 扇状3発、高火力・射程制限あり
      const spreadAngle = power >= 5 ? 0.35 : power >= 3 ? 0.26 : 0.17;
      const lifespan = power >= 5 ? 40 : power >= 3 ? 33 : 28;
      const dmg = power >= 5 ? 2.5 : power >= 3 ? 2 : 1.5;
      for (const a of [-spreadAngle, 0, spreadAngle]) {
        bullets.push(
          EntityFactory.bullet(x, y - 12, {
            angle: -Math.PI / 2 + a,
            weaponType: 'sonarWave',
            speed: 8,
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
          EntityFactory.bullet(x, y - 12, {
            angle: -Math.PI / 2 + offset,
            weaponType: 'bioMissile',
            speed: 7,
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
        EntityFactory.bullet(x, y - 12, {
          charged: true,
          weaponType: 'torpedo',
          piercing: true,
          damage: 5,
        })
      );
      break;
    case 'sonarWave':
      // 全方位8発パルス
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        bullets.push(
          EntityFactory.bullet(x, y, {
            charged: true,
            weaponType: 'sonarWave',
            angle,
            speed: 7,
            damage: 4,
            lifespan: 32,
          })
        );
      }
      break;
    case 'bioMissile':
      // 追尾型拡散5発
      for (let i = 0; i < 5; i++) {
        const offset = (i - 2) * 0.3;
        bullets.push(
          EntityFactory.bullet(x, y - 12, {
            charged: true,
            weaponType: 'bioMissile',
            angle: -Math.PI / 2 + offset,
            speed: 8,
            damage: 2,
            homing: true,
          })
        );
      }
      break;
  }

  return bullets;
}

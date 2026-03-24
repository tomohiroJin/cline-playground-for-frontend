// ============================================================================
// Deep Sea Interceptor - 武器ロジック（純粋関数）
// ============================================================================

import { EntityFactory } from './entities';
import type { Bullet, WeaponType } from './types';

// ---------------------------------------------------------------------------
// パワーレベル別設定テーブル
// ---------------------------------------------------------------------------

/** ソナーウェーブのパワーレベル別設定 */
interface SonarWaveConfig {
  spreadAngle: number;
  lifespan: number;
  damage: number;
  count: number;
}

/** パワーレベルの閾値に基づいてソナーウェーブ設定を返す */
const SONAR_WAVE_CONFIGS: { minPower: number; config: SonarWaveConfig }[] = [
  { minPower: 5, config: { spreadAngle: 0.40, lifespan: 35, damage: 4.5, count: 5 } },
  { minPower: 3, config: { spreadAngle: 0.30, lifespan: 30, damage: 3.5, count: 5 } },
  { minPower: 0, config: { spreadAngle: 0.20, lifespan: 25, damage: 2.5, count: 3 } },
];

/** パワーレベルに応じたソナーウェーブ設定を取得する */
const getSonarWaveConfig = (power: number): SonarWaveConfig =>
  // minPower 降順のため、最初にマッチしたものが正しい設定
  SONAR_WAVE_CONFIGS.find(({ minPower }) => power >= minPower)!.config;

/** トーピードのパワーレベル別発射角度テーブル */
const TORPEDO_ANGLES_BY_POWER: { minPower: number; angles: number[] }[] = [
  { minPower: 5, angles: [-0.1, 0, 0.1, 0] },
  { minPower: 4, angles: [-0.1, 0, 0.1] },
  { minPower: 3, angles: [-0.1, 0.1] },
  { minPower: 0, angles: [0] },
];

/** パワーレベルに応じたトーピード発射角度を取得する */
const getTorpedoAngles = (power: number): number[] =>
  TORPEDO_ANGLES_BY_POWER.find(({ minPower }) => power >= minPower)!.angles;

/** スプレッド時のトーピード発射角度 */
/** スプレッド時のトーピード発射角度（3WAY） */
const TORPEDO_SPREAD_ANGLES = [-0.2, 0, 0.2];

/** バイオミサイルのパワーレベル別発射数テーブル */
const BIO_MISSILE_COUNT_BY_POWER: { minPower: number; count: number }[] = [
  { minPower: 5, count: 3 },
  { minPower: 3, count: 2 },
  { minPower: 0, count: 1 },
];

/** パワーレベルに応じたバイオミサイル発射数を取得する */
const getBioMissileCount = (power: number): number =>
  BIO_MISSILE_COUNT_BY_POWER.find(({ minPower }) => power >= minPower)!.count;

// ---------------------------------------------------------------------------
// 武器生成関数
// ---------------------------------------------------------------------------

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
        ? TORPEDO_SPREAD_ANGLES
        : getTorpedoAngles(power);
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
      const { lifespan, damage } = getSonarWaveConfig(power);
      if (hasSpread) {
        // スプレッド時: 後方含む全方位8方向（接近戦特化）
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          bullets.push(
            EntityFactory.bullet(x, y, {
              angle: a,
              weaponType: 'sonarWave',
              speed: 13,
              damage,
              lifespan,
            })
          );
        }
      } else {
        // 通常: 扇状発射、高火力・射程制限あり
        const { spreadAngle, count } = getSonarWaveConfig(power);
        for (let i = 0; i < count; i++) {
          const a = (i - (count - 1) / 2) * (spreadAngle / ((count - 1) / 2 || 1));
          bullets.push(
            EntityFactory.bullet(x, y - 24, {
              angle: -Math.PI / 2 + a,
              weaponType: 'sonarWave',
              speed: 13,
              damage,
              lifespan,
            })
          );
        }
      }
      break;
    }
    case 'bioMissile': {
      // バイオミサイル: ホーミング弾
      const count = getBioMissileCount(power);
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
      // 全方位8発パルス（貫通付き）
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        bullets.push(
          EntityFactory.bullet(x, y, {
            charged: true,
            weaponType: 'sonarWave',
            angle,
            speed: 10,
            damage: 4,
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

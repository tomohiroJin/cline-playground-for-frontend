// ============================================================================
// Deep Sea Interceptor - 敵AI
// ============================================================================

import { EntityFactory } from './entities';
import type { Enemy, EnemyBullet, Position } from './types';

/** Position ベクトルを正規化 */
const normalize = ({ x, y }: Position): Position => {
  const m = Math.hypot(x, y);
  return m === 0 ? { x: 0, y: 0 } : { x: x / m, y: y / m };
};

/** ベクトルを回転 */
const rotateVector = (v: Position, angle: number): Position => ({
  x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
  y: v.x * Math.sin(angle) + v.y * Math.cos(angle),
});

/** ボス別攻撃パターン */
export const BossPatterns: Record<string, Record<number, (boss: Enemy, target: Position) => EnemyBullet[]>> = {
  // boss1: アンコウ・ガーディアン
  boss1: {
    // Phase 1: 5発の扇状弾
    1: (boss, target) => {
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      const angles = [-0.52, -0.26, 0, 0.26, 0.52];
      return angles.map(a => {
        const rotated = rotateVector(dir, a);
        return EntityFactory.enemyBullet(boss.x, boss.y, { x: rotated.x * 3, y: rotated.y * 3 });
      });
    },
    // Phase 2: 引き寄せ + 自機狙い弾
    2: (boss, target) => {
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      return [
        EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 4, y: dir.y * 4 }),
        EntityFactory.enemyBullet(boss.x - 15, boss.y, { x: dir.x * 3.5, y: dir.y * 3.5 }),
        EntityFactory.enemyBullet(boss.x + 15, boss.y, { x: dir.x * 3.5, y: dir.y * 3.5 }),
      ];
    },
  },

  // boss2: マインレイヤー
  boss2: {
    // Phase 1: 機雷設置風（静止弾）+ 直線弾
    1: (boss, _target) => [
      // 静止弾（機雷風）
      EntityFactory.enemyBullet(boss.x, boss.y + 20, { x: 0, y: 0.5 }),
      // 左右からの直線弾
      EntityFactory.enemyBullet(boss.x - 30, boss.y, { x: -1.5, y: 3 }),
      EntityFactory.enemyBullet(boss.x + 30, boss.y, { x: 1.5, y: 3 }),
    ],
    // Phase 2: 高速機雷 + 自機狙い弾
    2: (boss, target) => {
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      return [
        EntityFactory.enemyBullet(boss.x - 20, boss.y + 10, { x: 0, y: 0.8 }),
        EntityFactory.enemyBullet(boss.x + 20, boss.y + 10, { x: 0, y: 0.8 }),
        EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 4, y: dir.y * 4 }),
        EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 3, y: dir.y * 3 }),
      ];
    },
  },

  // boss3: サーマルドラゴン
  boss3: {
    // Phase 1: 回転弾（12方向）
    1: (boss, _target) => {
      const bullets: EnemyBullet[] = [];
      const offset = (Date.now() / 500) % (Math.PI * 2);
      for (let i = 0; i < 12; i++) {
        const angle = offset + (Math.PI * 2 * i) / 12;
        bullets.push(
          EntityFactory.enemyBullet(boss.x, boss.y, {
            x: Math.cos(angle) * 2.5,
            y: Math.sin(angle) * 2.5,
          })
        );
      }
      return bullets;
    },
    // Phase 2: 高密度回転弾
    2: (boss, target) => {
      const bullets: EnemyBullet[] = [];
      const offset = (Date.now() / 400) % (Math.PI * 2);
      for (let i = 0; i < 16; i++) {
        const angle = offset + (Math.PI * 2 * i) / 16;
        bullets.push(
          EntityFactory.enemyBullet(boss.x, boss.y, {
            x: Math.cos(angle) * 3,
            y: Math.sin(angle) * 3,
          })
        );
      }
      // 自機狙い弾も追加
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      bullets.push(EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 4.5, y: dir.y * 4.5 }));
      return bullets;
    },
  },

  // boss4: ルミナス・リヴァイアサン
  boss4: {
    // Phase 1: 波状弾幕（sin波弾道）
    1: (boss, _target) => {
      const bullets: EnemyBullet[] = [];
      for (let i = -2; i <= 2; i++) {
        bullets.push(
          EntityFactory.enemyBullet(boss.x + i * 25, boss.y, {
            x: Math.sin(Date.now() / 300 + i) * 1.5,
            y: 3,
          })
        );
      }
      return bullets;
    },
    // Phase 2: 稲妻パターン（縦線弾幕）
    2: (boss, _target) => {
      const bullets: EnemyBullet[] = [];
      // 縦線上に複数弾を配置
      for (let i = 0; i < 8; i++) {
        const xOffset = (i - 3.5) * 40;
        bullets.push(
          EntityFactory.enemyBullet(boss.x + xOffset, boss.y, { x: 0, y: 3.5 + Math.random() })
        );
      }
      return bullets;
    },
  },

  // boss5: アビサル・コア
  boss5: {
    // Phase 1: 他ボスのパターンをランダム選択
    1: (boss, target) => {
      const patterns = [
        BossPatterns.boss1[1],
        BossPatterns.boss2[1],
        BossPatterns.boss3[1],
        BossPatterns.boss4[1],
      ];
      const idx = Math.floor(Date.now() / 3000) % patterns.length;
      return patterns[idx](boss, target);
    },
    // Phase 2: 16方向全方位弾 + 回転
    2: (boss, _target) => {
      const bullets: EnemyBullet[] = [];
      const offset = (Date.now() / 300) % (Math.PI * 2);
      for (let i = 0; i < 16; i++) {
        const angle = offset + (Math.PI * 2 * i) / 16;
        bullets.push(
          EntityFactory.enemyBullet(boss.x, boss.y, {
            x: Math.cos(angle) * 3,
            y: Math.sin(angle) * 3,
          })
        );
      }
      return bullets;
    },
  },
};

/** ミッドボス別攻撃パターン */
export const MidbossPatterns: Record<string, (boss: Enemy, target: Position) => EnemyBullet[]> = {
  // midboss1: ヤドカリ — 3WAY弾
  midboss1: (boss, target) => {
    const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
    return [-0.3, 0, 0.3].map(a => {
      const rotated = rotateVector(dir, a);
      return EntityFactory.enemyBullet(boss.x, boss.y, { x: rotated.x * 3, y: rotated.y * 3 });
    });
  },
  // midboss2: 双子エイ — 左右交互弾
  midboss2: (boss, _target) => [
    EntityFactory.enemyBullet(boss.x - 20, boss.y, { x: -1.5, y: 3 }),
    EntityFactory.enemyBullet(boss.x + 20, boss.y, { x: 1.5, y: 3 }),
  ],
  // midboss3: 溶岩カメ — 8方向熱波
  midboss3: (boss, _target) => {
    const bullets: EnemyBullet[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      bullets.push(
        EntityFactory.enemyBullet(boss.x, boss.y, {
          x: Math.cos(angle) * 2.5,
          y: Math.sin(angle) * 2.5,
        })
      );
    }
    return bullets;
  },
  // midboss4: 発光イカ — 拡散弾
  midboss4: (boss, target) => {
    const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
    return [-0.4, -0.2, 0, 0.2, 0.4].map(a => {
      const rotated = rotateVector(dir, a);
      return EntityFactory.enemyBullet(boss.x, boss.y, { x: rotated.x * 2.5, y: rotated.y * 2.5 });
    });
  },
  // midboss5: 深海サメ — 高速直線弾
  midboss5: (boss, target) => {
    const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
    return [
      EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 5, y: dir.y * 5 }),
    ];
  },
};

/** 敵AIモジュール */
export const EnemyAI = {
  /** 敵が射撃可能か判定 */
  shouldShoot: (e: Enemy, now: number) => e.canShoot && e.y > 0 && now - e.lastShotAt > e.fireRate,

  /** 敵弾を生成（ボスはタイプ×フェーズ別パターン、ミッドボスは専用パターン） */
  createBullets: (e: Enemy, target: Position) => {
    // ミッドボスパターンへディスパッチ
    const midbossPattern = MidbossPatterns[e.enemyType];
    if (midbossPattern) {
      return midbossPattern(e, target);
    }

    // ボスタイプ別パターンへディスパッチ
    const bossType = e.enemyType === 'boss' ? 'boss1' : e.enemyType;
    const pattern = BossPatterns[bossType];
    if (pattern) {
      const phase = e.bossPhase || 1;
      const phaseFn = pattern[phase] || pattern[1];
      return phaseFn(e, target);
    }

    // 通常敵の弾生成
    const dir = normalize({ x: target.x - e.x, y: target.y - e.y });
    const speed = 3.5;
    const baseVel = { x: dir.x * speed, y: dir.y * speed };
    return [EntityFactory.enemyBullet(e.x, e.y, baseVel)];
  },
};

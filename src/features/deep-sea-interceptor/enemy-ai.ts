// ============================================================================
// Deep Sea Interceptor - 敵AI
// ============================================================================

import { EntityFactory } from './entities';
import type { Enemy, EnemyBullet, EnemyType, Position } from './types';

/** ボスタイプのサブセット */
type BossType = Extract<EnemyType, 'boss1' | 'boss2' | 'boss3' | 'boss4' | 'boss5'>;

/** ミッドボスタイプのサブセット */
type MidbossType = Extract<EnemyType, 'midboss1' | 'midboss2' | 'midboss3' | 'midboss4' | 'midboss5'>;

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
export const BossPatterns: Record<BossType, Record<number, (boss: Enemy, target: Position) => EnemyBullet[]>> = {
  // boss1: アンコウ・ガーディアン
  boss1: {
    // Phase 1: 5発の扇状弾
    1: (boss, target) => {
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      const angles = [-0.52, -0.26, 0, 0.26, 0.52];
      return angles.map(a => {
        const rotated = rotateVector(dir, a);
        return EntityFactory.enemyBullet(boss.x, boss.y, { x: rotated.x * 4, y: rotated.y * 4 });
      });
    },
    // Phase 2: 引き寄せ + 自機狙い弾
    2: (boss, target) => {
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      return [
        EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 5, y: dir.y * 5 }),
        EntityFactory.enemyBullet(boss.x - 30, boss.y, { x: dir.x * 4.5, y: dir.y * 4.5 }),
        EntityFactory.enemyBullet(boss.x + 30, boss.y, { x: dir.x * 4.5, y: dir.y * 4.5 }),
      ];
    },
    // Phase 3: 扇状弾 + 自機狙い弾を交互
    3: (boss, target) => {
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      const fanBullets = [-0.52, -0.26, 0, 0.26, 0.52].map(a => {
        const rotated = rotateVector(dir, a);
        return EntityFactory.enemyBullet(boss.x, boss.y, { x: rotated.x * 4.5, y: rotated.y * 4.5 });
      });
      const aimedBullets = [
        EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 5.5, y: dir.y * 5.5 }),
        EntityFactory.enemyBullet(boss.x - 30, boss.y, { x: dir.x * 5, y: dir.y * 5 }),
        EntityFactory.enemyBullet(boss.x + 30, boss.y, { x: dir.x * 5, y: dir.y * 5 }),
      ];
      return [...fanBullets, ...aimedBullets];
    },
  },

  // boss2: マインレイヤー
  boss2: {
    // Phase 1: 機雷設置風（静止弾）+ 直線弾
    1: (boss, _target) => [
      EntityFactory.enemyBullet(boss.x, boss.y + 40, { x: 0, y: 0.7 }),
      EntityFactory.enemyBullet(boss.x - 60, boss.y, { x: -2, y: 4 }),
      EntityFactory.enemyBullet(boss.x + 60, boss.y, { x: 2, y: 4 }),
    ],
    // Phase 2: 高速機雷 + 自機狙い弾
    2: (boss, target) => {
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      return [
        EntityFactory.enemyBullet(boss.x - 40, boss.y + 20, { x: 0, y: 1.0 }),
        EntityFactory.enemyBullet(boss.x + 40, boss.y + 20, { x: 0, y: 1.0 }),
        EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 5, y: dir.y * 5 }),
        EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 4, y: dir.y * 4 }),
      ];
    },
    // Phase 3: 機雷設置 + 高速自機狙いを同時
    3: (boss, target) => {
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      return [
        EntityFactory.enemyBullet(boss.x, boss.y + 40, { x: 0, y: 0.7 }),
        EntityFactory.enemyBullet(boss.x - 60, boss.y, { x: -2, y: 4 }),
        EntityFactory.enemyBullet(boss.x + 60, boss.y, { x: 2, y: 4 }),
        EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 5.5, y: dir.y * 5.5 }),
        EntityFactory.enemyBullet(boss.x - 40, boss.y, { x: dir.x * 5, y: dir.y * 5 }),
        EntityFactory.enemyBullet(boss.x + 40, boss.y, { x: dir.x * 5, y: dir.y * 5 }),
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
            x: Math.cos(angle) * 3.5,
            y: Math.sin(angle) * 3.5,
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
            x: Math.cos(angle) * 4,
            y: Math.sin(angle) * 4,
          })
        );
      }
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      bullets.push(EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 5.5, y: dir.y * 5.5 }));
      return bullets;
    },
    // Phase 3: 12方向弾幕 + 自機狙いを同時
    3: (boss, target) => {
      const bullets: EnemyBullet[] = [];
      const offset = (Date.now() / 350) % (Math.PI * 2);
      for (let i = 0; i < 16; i++) {
        const angle = offset + (Math.PI * 2 * i) / 16;
        bullets.push(
          EntityFactory.enemyBullet(boss.x, boss.y, {
            x: Math.cos(angle) * 4.5,
            y: Math.sin(angle) * 4.5,
          })
        );
      }
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      bullets.push(EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 6, y: dir.y * 6 }));
      bullets.push(EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 5, y: dir.y * 5 }));
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
          EntityFactory.enemyBullet(boss.x + i * 50, boss.y, {
            x: Math.sin(Date.now() / 300 + i) * 2,
            y: 4,
          })
        );
      }
      return bullets;
    },
    // Phase 2: 稲妻パターン（縦線弾幕）
    2: (boss, _target) => {
      const bullets: EnemyBullet[] = [];
      for (let i = 0; i < 8; i++) {
        const xOffset = (i - 3.5) * 80;
        bullets.push(
          EntityFactory.enemyBullet(boss.x + xOffset, boss.y, { x: 0, y: 4.5 + Math.random() })
        );
      }
      return bullets;
    },
    // Phase 3: 波状弾幕 + 稲妻パターンを同時
    3: (boss, _target) => {
      const bullets: EnemyBullet[] = [];
      for (let i = -2; i <= 2; i++) {
        bullets.push(
          EntityFactory.enemyBullet(boss.x + i * 50, boss.y, {
            x: Math.sin(Date.now() / 300 + i) * 2.5,
            y: 4.5,
          })
        );
      }
      for (let i = 0; i < 6; i++) {
        const xOffset = (i - 2.5) * 80;
        bullets.push(
          EntityFactory.enemyBullet(boss.x + xOffset, boss.y, { x: 0, y: 5 + Math.random() })
        );
      }
      return bullets;
    },
  },

  // boss5: アビサル・コア
  boss5: {
    // Phase 1（外殻）: 他ボスのパターンをランダム選択
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
    // Phase 2（内核露出）: 16方向回転弾幕
    2: (boss, target) => {
      const bullets: EnemyBullet[] = [];
      const offset = (Date.now() / 300) % (Math.PI * 2);
      for (let i = 0; i < 16; i++) {
        const angle = offset + (Math.PI * 2 * i) / 16;
        bullets.push(
          EntityFactory.enemyBullet(boss.x, boss.y, {
            x: Math.cos(angle) * 4.5,
            y: Math.sin(angle) * 4.5,
          })
        );
      }
      // 自機狙い弾
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      bullets.push(EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 5, y: dir.y * 5 }));
      return bullets;
    },
    // Phase 3（暴走コア）: 24方向全方位弾幕 + ホーミング弾
    3: (boss, target) => {
      const bullets: EnemyBullet[] = [];
      const offset = (Date.now() / 250) % (Math.PI * 2);
      for (let i = 0; i < 24; i++) {
        const angle = offset + (Math.PI * 2 * i) / 24;
        bullets.push(
          EntityFactory.enemyBullet(boss.x, boss.y, {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5,
          })
        );
      }
      // 自機狙い弾×2
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      bullets.push(EntityFactory.enemyBullet(boss.x - 40, boss.y, { x: dir.x * 6, y: dir.y * 6 }));
      bullets.push(EntityFactory.enemyBullet(boss.x + 40, boss.y, { x: dir.x * 6, y: dir.y * 6 }));
      return bullets;
    },
  },
};

/** ミッドボス別攻撃パターン */
export const MidbossPatterns: Record<MidbossType, (boss: Enemy, target: Position) => EnemyBullet[]> = {
  // midboss1: ヤドカリ — 3WAY弾
  midboss1: (boss, target) => {
    const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
    return [-0.3, 0, 0.3].map(a => {
      const rotated = rotateVector(dir, a);
      return EntityFactory.enemyBullet(boss.x, boss.y, { x: rotated.x * 4, y: rotated.y * 4 });
    });
  },
  // midboss2: 双子エイ — 左右交互弾
  midboss2: (boss, _target) => [
    EntityFactory.enemyBullet(boss.x - 40, boss.y, { x: -2, y: 4 }),
    EntityFactory.enemyBullet(boss.x + 40, boss.y, { x: 2, y: 4 }),
  ],
  // midboss3: 溶岩カメ — 8方向熱波
  midboss3: (boss, _target) => {
    const bullets: EnemyBullet[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      bullets.push(
        EntityFactory.enemyBullet(boss.x, boss.y, {
          x: Math.cos(angle) * 3.5,
          y: Math.sin(angle) * 3.5,
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
      return EntityFactory.enemyBullet(boss.x, boss.y, { x: rotated.x * 3.5, y: rotated.y * 3.5 });
    });
  },
  // midboss5: 深海サメ — 高速直線弾
  midboss5: (boss, target) => {
    const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
    return [
      EntityFactory.enemyBullet(boss.x, boss.y, { x: dir.x * 6, y: dir.y * 6 }),
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
    const midbossKey = e.enemyType as MidbossType;
    if (midbossKey in MidbossPatterns) {
      return MidbossPatterns[midbossKey](e, target);
    }

    // ボスタイプ別パターンへディスパッチ
    const bossType: BossType = e.enemyType === 'boss' ? 'boss1' : e.enemyType as BossType;
    if (bossType in BossPatterns) {
      const pattern = BossPatterns[bossType];
      const phase = e.bossPhase || 1;
      const phaseFn = pattern[phase] || pattern[1];
      return phaseFn(e, target);
    }

    // 通常敵の弾生成
    const dir = normalize({ x: target.x - e.x, y: target.y - e.y });
    const speed = 4.5;
    const baseVel = { x: dir.x * speed, y: dir.y * speed };
    return [EntityFactory.enemyBullet(e.x, e.y, baseVel)];
  },
};

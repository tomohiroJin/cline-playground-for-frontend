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

// ============================================================================
// 弾幕生成ヘルパー関数
// ============================================================================

/** 自機狙い弾の設定 */
interface AimedBulletConfig {
  readonly offsetX: number;
  readonly speed: number;
}

/**
 * 扇状弾を生成する
 * 指定した角度配列に沿って、ターゲット方向を基準に弾を扇状に展開する
 */
const createFanBullets = (
  boss: Enemy,
  dir: Position,
  angles: readonly number[],
  speed: number
): EnemyBullet[] =>
  angles.map(a => {
    const rotated = rotateVector(dir, a);
    return EntityFactory.enemyBullet(boss.x, boss.y, {
      x: rotated.x * speed,
      y: rotated.y * speed,
    });
  });

/**
 * N方向回転弾を生成する
 * 等間隔にN方向へ弾を放射状に発射する
 */
const createRadialBullets = (
  boss: Enemy,
  count: number,
  speed: number,
  offsetAngle = 0
): EnemyBullet[] => {
  const bullets: EnemyBullet[] = [];
  for (let i = 0; i < count; i++) {
    const angle = offsetAngle + (Math.PI * 2 * i) / count;
    bullets.push(
      EntityFactory.enemyBullet(boss.x, boss.y, {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      })
    );
  }
  return bullets;
};

/**
 * 自機狙い弾を生成する
 * 設定配列に基づいて、ターゲット方向への弾を複数生成する
 */
const createAimedBullets = (
  boss: Enemy,
  target: Position,
  configs: readonly AimedBulletConfig[]
): EnemyBullet[] => {
  const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
  return configs.map(({ offsetX, speed }) =>
    EntityFactory.enemyBullet(boss.x + offsetX, boss.y, {
      x: dir.x * speed,
      y: dir.y * speed,
    })
  );
};

/** ボス別攻撃パターン */
export const BossPatterns: Record<BossType, Record<number, (boss: Enemy, target: Position) => EnemyBullet[]>> = {
  // boss1: アンコウ・ガーディアン
  boss1: {
    // Phase 1: 5発の扇状弾
    1: (boss, target) => {
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      return createFanBullets(boss, dir, [-0.52, -0.26, 0, 0.26, 0.52], 4);
    },
    // Phase 2: 引き寄せ + 自機狙い弾
    2: (boss, target) =>
      createAimedBullets(boss, target, [
        { offsetX: 0, speed: 5 },
        { offsetX: -30, speed: 4.5 },
        { offsetX: 30, speed: 4.5 },
      ]),
    // Phase 3: 扇状弾 + 自機狙い弾を交互
    3: (boss, target) => {
      const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
      const fanBullets = createFanBullets(boss, dir, [-0.52, -0.26, 0, 0.26, 0.52], 4.5);
      const aimedBullets = createAimedBullets(boss, target, [
        { offsetX: 0, speed: 5.5 },
        { offsetX: -30, speed: 5 },
        { offsetX: 30, speed: 5 },
      ]);
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
    2: (boss, target) => [
      EntityFactory.enemyBullet(boss.x - 40, boss.y + 20, { x: 0, y: 1.0 }),
      EntityFactory.enemyBullet(boss.x + 40, boss.y + 20, { x: 0, y: 1.0 }),
      ...createAimedBullets(boss, target, [
        { offsetX: 0, speed: 5 },
        { offsetX: 0, speed: 4 },
      ]),
    ],
    // Phase 3: 機雷設置 + 高速自機狙いを同時
    3: (boss, target) => [
      EntityFactory.enemyBullet(boss.x, boss.y + 40, { x: 0, y: 0.7 }),
      EntityFactory.enemyBullet(boss.x - 60, boss.y, { x: -2, y: 4 }),
      EntityFactory.enemyBullet(boss.x + 60, boss.y, { x: 2, y: 4 }),
      ...createAimedBullets(boss, target, [
        { offsetX: 0, speed: 5.5 },
        { offsetX: -40, speed: 5 },
        { offsetX: 40, speed: 5 },
      ]),
    ],
  },

  // boss3: サーマルドラゴン
  boss3: {
    // Phase 1: 回転弾（12方向）
    1: (boss, _target) => {
      const offset = (Date.now() / 500) % (Math.PI * 2);
      return createRadialBullets(boss, 12, 3.5, offset);
    },
    // Phase 2: 高密度回転弾
    2: (boss, target) => {
      const offset = (Date.now() / 400) % (Math.PI * 2);
      return [
        ...createRadialBullets(boss, 16, 4, offset),
        ...createAimedBullets(boss, target, [{ offsetX: 0, speed: 5.5 }]),
      ];
    },
    // Phase 3: 16方向弾幕 + 自機狙いを同時
    3: (boss, target) => {
      const offset = (Date.now() / 350) % (Math.PI * 2);
      return [
        ...createRadialBullets(boss, 16, 4.5, offset),
        ...createAimedBullets(boss, target, [
          { offsetX: 0, speed: 6 },
          { offsetX: 0, speed: 5 },
        ]),
      ];
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
      const offset = (Date.now() / 300) % (Math.PI * 2);
      return [
        ...createRadialBullets(boss, 16, 4.5, offset),
        ...createAimedBullets(boss, target, [{ offsetX: 0, speed: 5 }]),
      ];
    },
    // Phase 3（暴走コア）: 24方向全方位弾幕 + ホーミング弾
    3: (boss, target) => {
      const offset = (Date.now() / 250) % (Math.PI * 2);
      return [
        ...createRadialBullets(boss, 24, 5, offset),
        ...createAimedBullets(boss, target, [
          { offsetX: -40, speed: 6 },
          { offsetX: 40, speed: 6 },
        ]),
      ];
    },
  },
};

/** ミッドボス別攻撃パターン */
export const MidbossPatterns: Record<MidbossType, (boss: Enemy, target: Position) => EnemyBullet[]> = {
  // midboss1: ヤドカリ — 3WAY弾
  midboss1: (boss, target) => {
    const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
    return createFanBullets(boss, dir, [-0.3, 0, 0.3], 4);
  },
  // midboss2: 双子エイ — 左右交互弾
  midboss2: (boss, _target) => [
    EntityFactory.enemyBullet(boss.x - 40, boss.y, { x: -2, y: 4 }),
    EntityFactory.enemyBullet(boss.x + 40, boss.y, { x: 2, y: 4 }),
  ],
  // midboss3: 溶岩カメ — 8方向熱波
  midboss3: (boss, _target) => createRadialBullets(boss, 8, 3.5),
  // midboss4: 発光イカ — 拡散弾
  midboss4: (boss, target) => {
    const dir = normalize({ x: target.x - boss.x, y: target.y - boss.y });
    return createFanBullets(boss, dir, [-0.4, -0.2, 0, 0.2, 0.4], 3.5);
  },
  // midboss5: 深海サメ — 高速直線弾
  midboss5: (boss, target) =>
    createAimedBullets(boss, target, [{ offsetX: 0, speed: 6 }]),
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

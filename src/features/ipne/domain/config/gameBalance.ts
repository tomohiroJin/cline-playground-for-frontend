/**
 * ゲームバランス定数
 *
 * 全バランス関連のマジックナンバーを一箇所に集約し、
 * バランス調整を容易にする。
 */

export const GAME_BALANCE = {
  /** 戦闘関連 */
  combat: {
    /** 基本攻撃クールダウン（ms） */
    baseCooldownMs: 500,
    /** ノックバック距離（マス） */
    knockbackDistance: 1,
    /** ノックバック持続時間（ms） */
    knockbackDurationMs: 200,
    /** 無敵持続時間（ms） */
    invincibleDurationMs: 1000,
    /** プレイヤー基本攻撃ダメージ */
    playerAttackDamage: 1,
  },

  /** 回復関連 */
  regen: {
    /** 基本回復間隔（ms） */
    baseIntervalMs: 12000,
    /** healBonus 1ポイントあたりの短縮量（ms） */
    reductionPerBonus: 1000,
    /** 最短回復間隔（ms） */
    minIntervalMs: 5000,
    /** 基本回復量 */
    baseHealAmount: 1,
  },

  /** 移動関連 */
  movement: {
    /** 基本移動間隔（ms） */
    baseMoveIntervalMs: 140,
    /** 初回移動遅延（ms） */
    initialMoveDelayMs: 180,
    /** 速度低下時の倍率（0.5 = 50%低下） */
    slowedSpeedMultiplier: 0.5,
  },

  /** 敵AI関連 */
  enemyAi: {
    /** AI更新間隔（ms） */
    updateIntervalMs: 200,
    /** 追跡タイムアウト（ms） */
    chaseTimeoutMs: 3000,
    /** 敵の攻撃クールダウン（ms） */
    attackCooldownMs: 1000,
    /** ボスの攻撃クールダウン（ms） */
    bossAttackCooldownMs: 700,
    /** 遠距離敵が維持したい距離（マス） */
    rangedPreferredDistance: 3,
    /** 敵攻撃アニメーション持続時間（ms） */
    attackAnimDurationMs: 300,
  },

  /** コンボ関連 */
  combo: {
    /** コンボ有効時間窓（ms） */
    windowMs: 3000,
    /** コンボ表示の最小値 */
    minDisplay: 2,
    /** 最大エフェクト倍率 */
    maxEffectMultiplier: 1.8,
    /** 最大エフェクト倍率に達するコンボ数 */
    maxEffectCombo: 10,
  },

  /** プレイヤー関連 */
  player: {
    /** 戦士の初期値 */
    warrior: {
      initialHp: 20,
      attackPower: 2,
      attackRange: 1,
      moveSpeed: 4,
      attackSpeed: 0.7,
      healBonus: 1,
    },
    /** 盗賊の初期値 */
    thief: {
      initialHp: 12,
      attackPower: 1,
      attackRange: 1,
      moveSpeed: 6,
      attackSpeed: 1.0,
      healBonus: 0,
    },
    /** 能力値の上限 */
    statLimits: {
      attackRange: 3,
      moveSpeed: 8,
      attackSpeed: 0.5,
      healBonus: 5,
    },
    /** 最大レベル */
    maxLevel: 22,
  },

  /** 敵タイプ別ステータス */
  enemy: {
    patrol: {
      hp: 4,
      damage: 1,
      speed: 2,
      detectionRange: 5,
      chaseRange: 8,
      attackRange: 3,
    },
    charge: {
      hp: 3,
      damage: 2,
      speed: 5,
      detectionRange: 6,
      chaseRange: 10,
      attackRange: 1,
    },
    ranged: {
      hp: 3,
      damage: 1,
      speed: 1.5,
      detectionRange: 7,
      chaseRange: 10,
      attackRange: 4,
    },
    specimen: {
      hp: 1,
      damage: 0,
      speed: 4,
      detectionRange: 4,
      chaseRange: undefined,
      attackRange: 0,
    },
    boss: {
      hp: 35,
      damage: 4,
      speed: 1.5,
      detectionRange: 8,
      chaseRange: 15,
      attackRange: 3,
    },
    miniBoss: {
      hp: 15,
      damage: 3,
      speed: 2,
      detectionRange: 7,
      chaseRange: 12,
      attackRange: 2,
    },
    megaBoss: {
      hp: 80,
      damage: 4,
      speed: 1.8,
      detectionRange: 12,
      chaseRange: 20,
      attackRange: 4,
    },
  },
} as const;

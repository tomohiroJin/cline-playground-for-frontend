/**
 * プレイヤーテストデータビルダー
 * テストで使用するPlayerオブジェクトを流暢なAPIで構築する
 */
import {
  Player,
  PlayerClass,
  PlayerClassValue,
  PlayerStats,
  Direction,
  DirectionValue,
} from '../../types';

/** デフォルトの能力値（戦士） */
const DEFAULT_STATS: PlayerStats = {
  attackPower: 1,
  attackRange: 1,
  moveSpeed: 3,
  attackSpeed: 1,
  healBonus: 0,
};

export class PlayerBuilder {
  private data: Player = {
    x: 1,
    y: 1,
    hp: 20,
    maxHp: 20,
    direction: Direction.DOWN,
    isInvincible: false,
    invincibleUntil: 0,
    attackCooldownUntil: 0,
    playerClass: PlayerClass.WARRIOR,
    level: 1,
    killCount: 0,
    stats: { ...DEFAULT_STATS },
    slowedUntil: 0,
    hasKey: false,
    lastRegenAt: 0,
  };

  at(x: number, y: number): this {
    this.data.x = x;
    this.data.y = y;
    return this;
  }

  withHp(hp: number, maxHp?: number): this {
    this.data.hp = hp;
    if (maxHp !== undefined) this.data.maxHp = maxHp;
    return this;
  }

  withClass(cls: PlayerClassValue): this {
    this.data.playerClass = cls;
    return this;
  }

  withLevel(level: number): this {
    this.data.level = level;
    return this;
  }

  withStats(stats: Partial<PlayerStats>): this {
    this.data.stats = { ...this.data.stats, ...stats };
    return this;
  }

  withDirection(direction: DirectionValue): this {
    this.data.direction = direction;
    return this;
  }

  invincibleUntil(time: number): this {
    this.data.isInvincible = true;
    this.data.invincibleUntil = time;
    return this;
  }

  withKillCount(count: number): this {
    this.data.killCount = count;
    return this;
  }

  withKey(): this {
    this.data.hasKey = true;
    return this;
  }

  slowedUntil(time: number): this {
    this.data.slowedUntil = time;
    return this;
  }

  withAttackCooldownUntil(time: number): this {
    this.data.attackCooldownUntil = time;
    return this;
  }

  withLastRegenAt(time: number): this {
    this.data.lastRegenAt = time;
    return this;
  }

  build(): Player {
    return {
      ...this.data,
      stats: { ...this.data.stats },
    };
  }
}

/** PlayerBuilder のファクトリ関数 */
export const aPlayer = (): PlayerBuilder => new PlayerBuilder();

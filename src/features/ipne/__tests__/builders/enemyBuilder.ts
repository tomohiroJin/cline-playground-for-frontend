/**
 * 敵テストデータビルダー
 * テストで使用するEnemyオブジェクトを流暢なAPIで構築する
 */
import {
  Enemy,
  EnemyType,
  EnemyTypeValue,
  EnemyState,
  EnemyStateValue,
  Position,
  DirectionValue,
} from '../../types';

export class EnemyBuilder {
  private data: Enemy;

  constructor() {
    this.data = {
      id: 'enemy-test-default',
      x: 5,
      y: 5,
      type: EnemyType.PATROL,
      hp: 3,
      maxHp: 3,
      damage: 1,
      speed: 1,
      detectionRange: 5,
      attackRange: 1,
      attackCooldownUntil: 0,
      state: EnemyState.IDLE,
      homePosition: { x: 5, y: 5 },
    };
  }

  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  at(x: number, y: number): this {
    this.data.x = x;
    this.data.y = y;
    this.data.homePosition = { x, y };
    return this;
  }

  withType(type: EnemyTypeValue): this {
    this.data.type = type;
    return this;
  }

  withHp(hp: number, maxHp?: number): this {
    this.data.hp = hp;
    this.data.maxHp = maxHp ?? hp;
    return this;
  }

  withDamage(damage: number): this {
    this.data.damage = damage;
    return this;
  }

  withSpeed(speed: number): this {
    this.data.speed = speed;
    return this;
  }

  withState(state: EnemyStateValue): this {
    this.data.state = state;
    return this;
  }

  withDetectionRange(range: number): this {
    this.data.detectionRange = range;
    return this;
  }

  withAttackRange(range: number): this {
    this.data.attackRange = range;
    return this;
  }

  withHomePosition(pos: Position): this {
    this.data.homePosition = pos;
    return this;
  }

  withPatrolPath(path: Position[]): this {
    this.data.patrolPath = path;
    this.data.patrolIndex = 0;
    return this;
  }

  withLastKnownPlayerPos(pos: Position): this {
    this.data.lastKnownPlayerPos = pos;
    return this;
  }

  withKnockback(until: number, direction: DirectionValue): this {
    this.data.knockbackUntil = until;
    this.data.knockbackDirection = direction;
    return this;
  }

  dying(deathStartTime: number): this {
    this.data.isDying = true;
    this.data.deathStartTime = deathStartTime;
    return this;
  }

  withAttackCooldownUntil(time: number): this {
    this.data.attackCooldownUntil = time;
    return this;
  }

  build(): Enemy {
    return {
      ...this.data,
      homePosition: { ...this.data.homePosition },
      ...(this.data.patrolPath ? { patrolPath: this.data.patrolPath.map(p => ({ ...p })) } : {}),
    };
  }
}

/** EnemyBuilder のファクトリ関数 */
export const anEnemy = (): EnemyBuilder => new EnemyBuilder();

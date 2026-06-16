/**
 * 敵AI関数の Policy 統合テスト
 *
 * enemyAI.ts から移動した関数が domain/policies/enemyAi/ から
 * 正しくインポート・動作することを検証する。
 */
import {
  detectPlayer,
  shouldChase,
  shouldStopChase,
  updatePatrolEnemy,
  updateChargeEnemy,
  updateRangedEnemy,
  updateFleeEnemy,
  generatePatrolPath,
  canEnemyAttack,
  getDirectPathToPlayer,
  markEnemyAttacking,
  resolveEnemyAttackState,
  ENEMY_ATTACK_ANIM_DURATION,
  AI_CONFIG,
  updateEnemiesWithContact,
} from './enemyAiFunctions';
import type { EnemyUpdateResult } from './enemyAiFunctions';
import { createPatrolEnemy, createChargeEnemy, createSpecimenEnemy, createRangedEnemy } from '../../entities/enemy';
import { EnemyState, TileType, GameMap } from '../../types';

// テスト用モック
const mockIdGen = {
  generateEnemyId: () => 'e1',
  generateTrapId: () => 't1',
  generateItemId: () => 'i1',
  generateFeedbackId: () => 'f1',
};

// テスト用の5x5マップ（周囲壁、中央通路）
const testMap: GameMap = [
  [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
  [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
  [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
  [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
  [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
];

describe('敵AI関数（Policy 統合後）', () => {
  describe('detectPlayer', () => {
    it('検知範囲内のプレイヤーを検知できる', () => {
      const enemy = createPatrolEnemy(2, 2, mockIdGen);
      expect(detectPlayer(enemy, { x: 3, y: 3 })).toBe(true);
    });

    it('検知範囲外のプレイヤーを検知しない', () => {
      const enemy = createPatrolEnemy(1, 1, mockIdGen);
      expect(detectPlayer(enemy, { x: 100, y: 100 })).toBe(false);
    });
  });

  describe('shouldChase', () => {
    it('検知範囲内のプレイヤーを追跡する', () => {
      const enemy = createPatrolEnemy(2, 2, mockIdGen);
      expect(shouldChase(enemy, { x: 3, y: 3 })).toBe(true);
    });
  });

  describe('shouldStopChase', () => {
    it('追跡範囲外になると追跡を停止する', () => {
      const enemy = { ...createPatrolEnemy(1, 1, mockIdGen), lastSeenAt: 0 };
      expect(shouldStopChase(enemy, { x: 100, y: 100 }, 0)).toBe(true);
    });
  });

  describe('updatePatrolEnemy', () => {
    it('ノックバック状態の場合はそのまま返す', () => {
      const knockbackEnemy = { ...createPatrolEnemy(2, 2, mockIdGen), state: EnemyState.KNOCKBACK };
      const result = updatePatrolEnemy(knockbackEnemy as typeof knockbackEnemy & { state: 'knockback' }, { x: 3, y: 3 }, testMap, 1000);
      expect(result.state).toBe(EnemyState.KNOCKBACK);
    });
  });

  describe('updateChargeEnemy', () => {
    it('ノックバック状態の場合はそのまま返す', () => {
      const knockbackEnemy = { ...createChargeEnemy(2, 2, mockIdGen), state: EnemyState.KNOCKBACK };
      const result = updateChargeEnemy(knockbackEnemy as typeof knockbackEnemy & { state: 'knockback' }, { x: 3, y: 3 }, testMap, 1000);
      expect(result.state).toBe(EnemyState.KNOCKBACK);
    });
  });

  describe('updateRangedEnemy', () => {
    it('ノックバック状態の場合はそのまま返す', () => {
      const knockbackEnemy = { ...createRangedEnemy(2, 2, mockIdGen), state: EnemyState.KNOCKBACK };
      const result = updateRangedEnemy(knockbackEnemy as typeof knockbackEnemy & { state: 'knockback' }, { x: 3, y: 3 }, testMap, 1000);
      expect(result.state).toBe(EnemyState.KNOCKBACK);
    });
  });

  describe('updateFleeEnemy', () => {
    it('ノックバック状態の場合はそのまま返す', () => {
      const knockbackEnemy = { ...createSpecimenEnemy(2, 2, mockIdGen), state: EnemyState.KNOCKBACK };
      const result = updateFleeEnemy(knockbackEnemy as typeof knockbackEnemy & { state: 'knockback' }, { x: 3, y: 3 }, testMap, 1000);
      expect(result.state).toBe(EnemyState.KNOCKBACK);
    });
  });

  describe('canEnemyAttack', () => {
    it('攻撃範囲0の敵は攻撃できない', () => {
      const enemy = createSpecimenEnemy(2, 2, mockIdGen);
      expect(canEnemyAttack(enemy, { x: 2, y: 2 }, 0)).toBe(false);
    });

    it('射程内・クールダウン明けの生存している敵は攻撃できる', () => {
      const enemy = { ...createRangedEnemy(2, 2, mockIdGen), attackRange: 3, hp: 5, attackCooldownUntil: 0 };
      expect(canEnemyAttack(enemy, { x: 2, y: 2 }, 1000)).toBe(true);
    });

    it('HPが0の敵は攻撃できない（最後っ屁攻撃の防止）', () => {
      const deadEnemy = { ...createRangedEnemy(2, 2, mockIdGen), attackRange: 3, hp: 0, attackCooldownUntil: 0 };
      expect(canEnemyAttack(deadEnemy, { x: 2, y: 2 }, 1000)).toBe(false);
    });

    it('死亡アニメーション中（isDying）の敵は攻撃できない', () => {
      const dyingEnemy = { ...createRangedEnemy(2, 2, mockIdGen), attackRange: 3, hp: 5, isDying: true, attackCooldownUntil: 0 };
      expect(canEnemyAttack(dyingEnemy, { x: 2, y: 2 }, 1000)).toBe(false);
    });
  });

  describe('markEnemyAttacking', () => {
    it('ATTACK状態にマークする', () => {
      const enemy = createPatrolEnemy(2, 2, mockIdGen);
      const result = markEnemyAttacking(enemy, 1000);
      expect(result.state).toBe(EnemyState.ATTACK);
      expect(result.attackAnimUntil).toBe(1000 + ENEMY_ATTACK_ANIM_DURATION);
    });
  });

  describe('resolveEnemyAttackState', () => {
    it('アニメーション期間中はATTACK状態を維持', () => {
      const attackEnemy = {
        ...createPatrolEnemy(2, 2, mockIdGen),
        state: EnemyState.ATTACK,
        attackAnimUntil: 1500,
      };
      const result = resolveEnemyAttackState(attackEnemy as typeof attackEnemy & { state: 'attack' }, 1000);
      expect(result.state).toBe(EnemyState.ATTACK);
    });

    it('アニメーション期間後にIDLEに戻す', () => {
      const attackEnemy = {
        ...createPatrolEnemy(2, 2, mockIdGen),
        state: EnemyState.ATTACK,
        attackAnimUntil: 1000,
      };
      const result = resolveEnemyAttackState(attackEnemy as typeof attackEnemy & { state: 'attack' }, 1500);
      expect(result.state).toBe(EnemyState.IDLE);
    });
  });

  describe('generatePatrolPath', () => {
    it('パスを生成する', () => {
      const path = generatePatrolPath({ x: 5, y: 5 });
      expect(path.length).toBeGreaterThan(0);
      expect(path[0].x).toBe(5);
    });
  });

  describe('getDirectPathToPlayer', () => {
    it('直線パスを生成する', () => {
      const enemy = createPatrolEnemy(1, 1, mockIdGen);
      const path = getDirectPathToPlayer(enemy, { x: 3, y: 1 });
      expect(path.length).toBe(2);
    });
  });

  describe('updateEnemiesWithContact', () => {
    it('空の敵配列でも正常に動作する', () => {
      const result: EnemyUpdateResult = updateEnemiesWithContact([], { x: 2, y: 2 }, testMap, 1000);
      expect(result.enemies).toEqual([]);
      expect(result.contactDamage).toBe(0);
      expect(result.attackDamage).toBe(0);
    });

    it('死亡した敵（isDying）はプレイヤーと同マスでも接触・攻撃ダメージを発生させない', () => {
      const deadEnemy = {
        ...createRangedEnemy(2, 2, mockIdGen),
        attackRange: 3,
        damage: 5,
        hp: 0,
        isDying: true,
        attackCooldownUntil: 0,
      };
      const result = updateEnemiesWithContact([deadEnemy], { x: 2, y: 2 }, testMap, 1000);
      expect(result.attackDamage).toBe(0);
      expect(result.contactDamage).toBe(0);
    });
  });

  describe('AI_CONFIG', () => {
    it('定数が正しく公開されている', () => {
      expect(AI_CONFIG.updateInterval).toBeGreaterThan(0);
      expect(AI_CONFIG.chaseTimeout).toBeGreaterThan(0);
      expect(AI_CONFIG.attackCooldown).toBeGreaterThan(0);
    });
  });
});

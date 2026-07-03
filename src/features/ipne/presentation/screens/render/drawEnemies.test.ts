/**
 * 敵の攻撃フレーム選択（溜め→攻撃の2段モーション）のテスト
 *
 * selectEnemyAttackFrame は進行度（0〜1）を受け取り、
 * 前 ENEMY_WINDUP_RATIO（40%）は溜めフレーム、残り60%は攻撃フレームを返す純粋関数。
 */
import { EnemyType } from '../../../index';
import {
  PATROL_ATTACK_FRAME,
  CHARGE_RUSH_FRAME,
  RANGED_CAST_FRAME,
  SPECIMEN_MUTATE_FRAME,
  BOSS_ATTACK_FRAME,
  MINI_BOSS_ATTACK_FRAME,
  MEGA_BOSS_ATTACK_FRAME,
  PATROL_WINDUP_FRAME,
  CHARGE_WINDUP_FRAME,
  RANGED_WINDUP_FRAME,
  SPECIMEN_WINDUP_FRAME,
  BOSS_WINDUP_FRAME,
  MINI_BOSS_WINDUP_FRAME,
  MEGA_BOSS_WINDUP_FRAME,
} from '../../sprites';
import { ENEMY_WINDUP_RATIO, selectEnemyAttackFrame } from './drawEnemies';

describe('ENEMY_WINDUP_RATIO', () => {
  it('前40%が溜めの境界値である', () => {
    expect(ENEMY_WINDUP_RATIO).toBe(0.4);
  });
});

describe('selectEnemyAttackFrame', () => {
  const cases = [
    [EnemyType.PATROL, PATROL_WINDUP_FRAME, PATROL_ATTACK_FRAME],
    [EnemyType.CHARGE, CHARGE_WINDUP_FRAME, CHARGE_RUSH_FRAME],
    [EnemyType.RANGED, RANGED_WINDUP_FRAME, RANGED_CAST_FRAME],
    [EnemyType.SPECIMEN, SPECIMEN_WINDUP_FRAME, SPECIMEN_MUTATE_FRAME],
    [EnemyType.BOSS, BOSS_WINDUP_FRAME, BOSS_ATTACK_FRAME],
    [EnemyType.MINI_BOSS, MINI_BOSS_WINDUP_FRAME, MINI_BOSS_ATTACK_FRAME],
    [EnemyType.MEGA_BOSS, MEGA_BOSS_WINDUP_FRAME, MEGA_BOSS_ATTACK_FRAME],
  ] as const;

  it.each(cases)('%s: 進行度 0.39 は溜め、0.4 以降は攻撃フレームを返す', (type, windupFrame, attackFrame) => {
    expect(selectEnemyAttackFrame(type, 0.39)).toBe(windupFrame);
    expect(selectEnemyAttackFrame(type, 0.4)).toBe(attackFrame);
  });

  it.each(cases)('%s: 進行度 0 は溜め、進行度 1 は攻撃フレームを返す', (type, windupFrame, attackFrame) => {
    expect(selectEnemyAttackFrame(type, 0)).toBe(windupFrame);
    expect(selectEnemyAttackFrame(type, 1)).toBe(attackFrame);
  });

  it('未知の敵タイプは null を返す', () => {
    expect(selectEnemyAttackFrame('unknown', 0.5)).toBeNull();
  });

  it('attackAnimUntil 未設定の ATTACK は攻撃フレームにフォールバックする（従来挙動の保存）', () => {
    expect(selectEnemyAttackFrame(EnemyType.PATROL, 1)).toBe(PATROL_ATTACK_FRAME);
  });
});

/**
 * 敵の状態判定のテスト
 *
 * 飛行判定は射撃・範囲巻き込み・罠・業火の4経路から呼ばれる。
 * 直接 getEnemySpec(...).flying を見ていた実装を関数に集約したため、
 * ここが唯一の真実になる。
 */
import { isEnemyFlying, isEnemyStunned } from './enemy-status';
import type { ActiveEnemy } from './combat-state';

const enemy = (enemyId: string, overrides: Partial<ActiveEnemy> = {}): ActiveEnemy => ({
  id: 1,
  enemyId,
  hp: 10,
  maxHp: 10,
  progress: 0,
  spawnTick: 0,
  spawnPathIndex: 0,
  alive: true,
  leaked: false,
  groundedUntilTick: 0,
  stunnedUntilTick: 0,
  ...overrides,
});

describe('isEnemyFlying', () => {
  it('鴉は飛行している', () => {
    expect(isEnemyFlying(enemy('raven'), 10)).toBe(true);
  });

  it('地上の敵は飛行していない', () => {
    expect(isEnemyFlying(enemy('grunt'), 10)).toBe(false);
  });

  it('地上化中の鴉は飛行していない', () => {
    expect(isEnemyFlying(enemy('raven', { groundedUntilTick: 50 }), 30)).toBe(false);
  });

  it('地上化が切れた鴉は再び飛行する', () => {
    expect(isEnemyFlying(enemy('raven', { groundedUntilTick: 50 }), 51)).toBe(true);
  });

  it('地上化の境界 tick では まだ地上にいる', () => {
    expect(isEnemyFlying(enemy('raven', { groundedUntilTick: 50 }), 50)).toBe(false);
  });

  it('地上の敵に地上化を掛けても飛行状態は変わらない', () => {
    expect(isEnemyFlying(enemy('grunt', { groundedUntilTick: 50 }), 30)).toBe(false);
  });
});

describe('isEnemyStunned', () => {
  it('既定では足止めされていない', () => {
    expect(isEnemyStunned(enemy('grunt'), 10)).toBe(false);
  });

  it('足止め中は true', () => {
    expect(isEnemyStunned(enemy('grunt', { stunnedUntilTick: 40 }), 20)).toBe(true);
  });

  it('境界 tick では まだ足止めされている', () => {
    expect(isEnemyStunned(enemy('grunt', { stunnedUntilTick: 40 }), 40)).toBe(true);
  });

  it('切れたら false', () => {
    expect(isEnemyStunned(enemy('grunt', { stunnedUntilTick: 40 }), 41)).toBe(false);
  });
});

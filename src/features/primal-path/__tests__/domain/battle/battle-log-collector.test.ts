/**
 * BattleLogCollector のテスト
 */
import { createLogCollector } from '../../../domain/battle/battle-log-collector';

describe('BattleLogCollector', () => {
  it('空のコレクターを生成する', () => {
    const collector = createLogCollector();
    expect(collector.entries).toEqual([]);
  });

  it('ダメージログを追加できる', () => {
    const collector = createLogCollector()
      .addDamage('プレイヤー', 'スライム', 50, false);
    expect(collector.entries).toHaveLength(1);
    expect(collector.entries[0].x).toContain('50');
  });

  it('会心ダメージの場合にラベルが付く', () => {
    const collector = createLogCollector()
      .addDamage('プレイヤー', 'スライム', 100, true);
    expect(collector.entries[0].x).toContain('💥会心');
    expect(collector.entries[0].c).toBe('gc');
  });

  it('回復ログを追加できる', () => {
    const collector = createLogCollector()
      .addHeal('プレイヤー', 30);
    expect(collector.entries).toHaveLength(1);
    expect(collector.entries[0].x).toContain('+30');
    expect(collector.entries[0].c).toBe('lc');
  });

  it('スキル使用ログを追加できる', () => {
    const collector = createLogCollector()
      .addSkillUse('🔥', '炎の爆発');
    expect(collector.entries[0].x).toContain('炎の爆発');
  });

  it('ステータスログを追加できる', () => {
    const collector = createLogCollector()
      .addStatus('部族は滅びた…', 'xc');
    expect(collector.entries[0]).toEqual({ x: '部族は滅びた…', c: 'xc' });
  });

  it('イミュータブルに連鎖できる', () => {
    const c1 = createLogCollector();
    const c2 = c1.addDamage('A', 'B', 10, false);
    const c3 = c2.addHeal('A', 20);

    expect(c1.entries).toHaveLength(0);
    expect(c2.entries).toHaveLength(1);
    expect(c3.entries).toHaveLength(2);
  });
});

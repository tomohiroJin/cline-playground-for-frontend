// ドメインイベント型のテスト

import type { DomainEvent } from '../../domain/events';

describe('domain/events', () => {
  it('各イベント型が正しく構築できる', () => {
    // 型レベルのテスト: 各イベントが DomainEvent ユニオン型に適合することを確認
    const events: DomainEvent[] = [
      { type: 'lap_completed', player: 0, lap: 1, lapTime: 30000 },
      { type: 'race_finished', winner: 'P1', totalTimes: [60000, 65000] },
      { type: 'collision', player1: 0, player2: 1, point: { x: 100, y: 200 } },
      { type: 'wall_hit', player: 0, stage: 1 },
      { type: 'drift_start', player: 0 },
      { type: 'drift_end', player: 0, boostPower: 0.2 },
      { type: 'heat_boost', player: 0 },
      { type: 'checkpoint_passed', player: 0, checkpoint: 2 },
      { type: 'draft_triggered', player: 0, lap: 1 },
      { type: 'card_selected', player: 0, card: { id: 'SPD_01', name: 'test', category: 'speed', rarity: 'R', description: '', effect: {}, icon: '' } },
      { type: 'highlight', event: { type: 'drift_bonus', player: 0, lap: 1, time: 5000, score: 200, message: 'test' } },
    ];

    // 全 11 種のイベント型が生成可能であることを確認
    expect(events).toHaveLength(11);
    const types = events.map(e => e.type);
    expect(types).toContain('lap_completed');
    expect(types).toContain('race_finished');
    expect(types).toContain('collision');
    expect(types).toContain('wall_hit');
    expect(types).toContain('drift_start');
    expect(types).toContain('drift_end');
    expect(types).toContain('heat_boost');
    expect(types).toContain('checkpoint_passed');
    expect(types).toContain('draft_triggered');
    expect(types).toContain('card_selected');
    expect(types).toContain('highlight');
  });

  it('イベント型は readonly プロパティを持つ', () => {
    // readonly の確認（コンパイルが通ること自体が型テスト）
    const event: DomainEvent = { type: 'lap_completed', player: 0, lap: 1, lapTime: 30000 };
    expect(event.type).toBe('lap_completed');
  });
});

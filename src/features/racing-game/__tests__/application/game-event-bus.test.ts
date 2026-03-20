// GameEventBus のテスト

import { createEventBus } from '../../application/game-event-bus';
import type { DomainEvent } from '../../domain/events';

describe('GameEventBus', () => {
  it('subscribe したイベントが publish で通知される', () => {
    // Arrange
    const bus = createEventBus();
    const received: DomainEvent[] = [];
    bus.subscribe('lap_completed', (e) => received.push(e));

    // Act
    bus.publish({ type: 'lap_completed', player: 0, lap: 1, lapTime: 30000 });

    // Assert
    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('lap_completed');
  });

  it('異なるイベントタイプは通知されない', () => {
    // Arrange
    const bus = createEventBus();
    const received: DomainEvent[] = [];
    bus.subscribe('collision', (e) => received.push(e));

    // Act
    bus.publish({ type: 'lap_completed', player: 0, lap: 1, lapTime: 30000 });

    // Assert
    expect(received).toHaveLength(0);
  });

  it('複数リスナーに通知される', () => {
    // Arrange
    const bus = createEventBus();
    let count1 = 0;
    let count2 = 0;
    bus.subscribe('drift_start', () => { count1++; });
    bus.subscribe('drift_start', () => { count2++; });

    // Act
    bus.publish({ type: 'drift_start', player: 0 });

    // Assert
    expect(count1).toBe(1);
    expect(count2).toBe(1);
  });

  it('unsubscribe でリスナーが解除される', () => {
    // Arrange
    const bus = createEventBus();
    const received: DomainEvent[] = [];
    const unsubscribe = bus.subscribe('heat_boost', (e) => received.push(e));

    // Act
    bus.publish({ type: 'heat_boost', player: 0 });
    unsubscribe();
    bus.publish({ type: 'heat_boost', player: 1 });

    // Assert
    expect(received).toHaveLength(1);
  });

  it('リスナーなしのイベント publish でエラーが起きない', () => {
    const bus = createEventBus();
    expect(() => {
      bus.publish({ type: 'race_finished', winner: 'P1', totalTimes: [60000] });
    }).not.toThrow();
  });
});

/**
 * イベント選択の決定論的テスト
 */
import { pickEvent, findChainEvent } from '../../../domain/events/event-selector';
import { SeededRandomSource } from '../../../domain/events/random';
import { createTestEvent, createTestFx } from '../../helpers/factories';
import { createMetaState } from '../../../domain/models/meta-state';
import type { GameEvent } from '../../../domain/events/game-event';

describe('pickEvent', () => {
  describe('決定論的選出', () => {
    it('同一seed + 同一プールで毎回同じイベントが選出される', () => {
      // Arrange
      const events: GameEvent[] = [
        createTestEvent({ id: 'e001', fl: [1] }),
        createTestEvent({ id: 'e002', fl: [1] }),
        createTestEvent({ id: 'e003', fl: [1] }),
      ];
      const meta = createMetaState();
      const fx = createTestFx();

      // Act
      const rng1 = new SeededRandomSource(42);
      const rng2 = new SeededRandomSource(42);
      const result1 = pickEvent(events, 1, [], meta, fx, rng1);
      const result2 = pickEvent(events, 1, [], meta, fx, rng2);

      // Assert
      expect(result1).not.toBeNull();
      expect(result1!.id).toBe(result2!.id);
    });
  });

  describe('フィルタリング', () => {
    it('フロアに含まれないイベントは除外される', () => {
      // Arrange
      const events: GameEvent[] = [
        createTestEvent({ id: 'e001', fl: [2] }), // フロア2のみ
      ];
      const meta = createMetaState();
      const fx = createTestFx();
      const rng = new SeededRandomSource(42);

      // Act
      const result = pickEvent(events, 1, [], meta, fx, rng);

      // Assert
      expect(result).toBeNull();
    });

    it('使用済みIDのイベントは除外される', () => {
      // Arrange
      const events: GameEvent[] = [
        createTestEvent({ id: 'e001', fl: [1] }),
      ];
      const meta = createMetaState();
      const fx = createTestFx();
      const rng = new SeededRandomSource(42);

      // Act
      const result = pickEvent(events, 1, ['e001'], meta, fx, rng);

      // Assert
      expect(result).toBeNull();
    });

    it('chainOnlyイベントは除外される', () => {
      // Arrange
      const events: GameEvent[] = [
        createTestEvent({ id: 'e001', fl: [1], chainOnly: true }),
      ];
      const meta = createMetaState();
      const fx = createTestFx();
      const rng = new SeededRandomSource(42);

      // Act
      const result = pickEvent(events, 1, [], meta, fx, rng);

      // Assert
      expect(result).toBeNull();
    });

    it('metaCondが偽のイベントは除外される', () => {
      // Arrange
      const events: GameEvent[] = [
        createTestEvent({ id: 'e001', fl: [1], metaCond: () => false }),
      ];
      const meta = createMetaState();
      const fx = createTestFx();
      const rng = new SeededRandomSource(42);

      // Act
      const result = pickEvent(events, 1, [], meta, fx, rng);

      // Assert
      expect(result).toBeNull();
    });

    it('metaCondが真のイベントは選出対象になる', () => {
      // Arrange
      const events: GameEvent[] = [
        createTestEvent({ id: 'e001', fl: [1], metaCond: () => true }),
      ];
      const meta = createMetaState();
      const fx = createTestFx();
      const rng = new SeededRandomSource(42);

      // Act
      const result = pickEvent(events, 1, [], meta, fx, rng);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe('e001');
    });
  });

  // 確率分布検証のため、複数の seed で意図的に反復テストを実施
  describe('重み付け', () => {
    it('安息イベントの出現確率が上がる（重み2倍）', () => {
      // Arrange — 多数回実行して安息イベントの比率を確認
      const events: GameEvent[] = [
        createTestEvent({ id: 'e001', fl: [1], tp: 'exploration' }),
        createTestEvent({ id: 'e002', fl: [1], tp: 'rest' }),
      ];
      const meta = createMetaState();
      const fx = createTestFx();

      // Act — 100回試行
      const counts: Record<string, number> = { e001: 0, e002: 0 };
      for (let i = 1; i <= 100; i++) {
        const rng = new SeededRandomSource(i);
        const result = pickEvent(events, 1, [], meta, fx, rng);
        if (result) counts[result.id]++;
      }

      // Assert — 安息イベントが通常より多く選ばれる
      expect(counts['e002']).toBeGreaterThan(counts['e001']);
    });

    it('chainBoostでチェインイベントの重みが増加する', () => {
      // Arrange
      const events: GameEvent[] = [
        createTestEvent({ id: 'e001', fl: [1], ch: [{ t: '通常', o: [{ c: 'default', r: '結果' }] }] }),
        createTestEvent({ id: 'e002', fl: [1], ch: [{ t: 'チェイン', o: [{ c: 'default', r: '結果', fl: 'chain:e100' }] }] }),
      ];
      const meta = createMetaState();
      const fx = createTestFx({ chainBoost: true });

      // Act — 100回試行
      const counts: Record<string, number> = { e001: 0, e002: 0 };
      for (let i = 1; i <= 100; i++) {
        const rng = new SeededRandomSource(i);
        const result = pickEvent(events, 1, [], meta, fx, rng);
        if (result) counts[result.id]++;
      }

      // Assert — チェインイベントがより多く選ばれる
      expect(counts['e002']).toBeGreaterThan(counts['e001']);
    });
  });

  describe('境界値', () => {
    it('プール空時にnullを返す', () => {
      // Arrange
      const events: GameEvent[] = [];
      const meta = createMetaState();
      const fx = createTestFx();
      const rng = new SeededRandomSource(42);

      // Act
      const result = pickEvent(events, 1, [], meta, fx, rng);

      // Assert
      expect(result).toBeNull();
    });

    it('プール1件時にそのイベントを返す', () => {
      // Arrange
      const events: GameEvent[] = [
        createTestEvent({ id: 'e001', fl: [1] }),
      ];
      const meta = createMetaState();
      const fx = createTestFx();
      const rng = new SeededRandomSource(42);

      // Act
      const result = pickEvent(events, 1, [], meta, fx, rng);

      // Assert
      expect(result!.id).toBe('e001');
    });
  });
});

describe('findChainEvent', () => {
  it('IDに一致するイベントを返す', () => {
    // Arrange
    const events: GameEvent[] = [
      createTestEvent({ id: 'e001' }),
      createTestEvent({ id: 'e002' }),
    ];

    // Act
    const result = findChainEvent(events, 'e002');

    // Assert
    expect(result).not.toBeNull();
    expect(result!.id).toBe('e002');
  });

  it('IDに一致するイベントがない場合はnullを返す', () => {
    const events: GameEvent[] = [createTestEvent({ id: 'e001' })];
    const result = findChainEvent(events, 'nonexistent');
    expect(result).toBeNull();
  });
});

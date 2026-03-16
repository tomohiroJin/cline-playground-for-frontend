/**
 * createEvents - スプリントイベント生成のテスト
 *
 * ランダム依存関数の確定的テスト:
 * randomFn 注入で緊急対応の発生パスと非発生パスの両方を検証
 */
import { createEvents } from '../event-generator';
import { CONFIG } from '../../../constants';

describe('createEvents - スプリントイベント生成', () => {
  it('7つの標準イベントが返される', () => {
    // Arrange & Act
    const events = createEvents(0, 0);

    // Assert
    expect(events).toHaveLength(7);
  });

  it('最初のスプリントでは緊急対応が発生しない', () => {
    // Arrange
    const alwaysTrigger = () => 0;

    // Act
    const events = createEvents(0, 0, alwaysTrigger);

    // Assert
    const hasEmergency = events.some((e) => e.id === 'emergency');
    expect(hasEmergency).toBe(false);
  });

  it('2スプリント目以降で確率条件を満たすと緊急対応が挿入される', () => {
    // Arrange
    const alwaysTrigger = () => 0;

    // Act
    const events = createEvents(1, 0, alwaysTrigger);

    // Assert
    const hasEmergency = events.some((e) => e.id === 'emergency');
    expect(hasEmergency).toBe(true);
  });

  it('緊急対応は位置1〜3のいずれかに挿入される', () => {
    // Arrange: randomFn が常に 0 → position = minPosition(1) + floor(0 * 3) = 1
    const alwaysTrigger = () => 0;

    // Act
    const events = createEvents(1, 0, alwaysTrigger);

    // Assert
    expect(events[1].id).toBe('emergency');
  });

  it('確率が低く乱数が高い場合は緊急対応が発生しない', () => {
    // Arrange: probability = min(0.5, 0.1 + 0*0.004) = 0.1 < 0.99
    const neverTrigger = () => 0.99;

    // Act
    const events = createEvents(1, 0, neverTrigger);

    // Assert
    const hasEmergency = events.some((e) => e.id === 'emergency');
    expect(hasEmergency).toBe(false);
  });

  it('負債が高いと緊急対応の確率が上がる', () => {
    // Arrange: debt=100 → probability = min(0.5, 0.1 + 100*0.004) = 0.5
    const justUnder = () => 0.49;

    // Act
    const events = createEvents(1, 100, justUnder);

    // Assert
    const hasEmergency = events.some((e) => e.id === 'emergency');
    expect(hasEmergency).toBe(true);
  });

  // ── ランダム依存: 緊急対応の挿入位置制御 ──────────────

  describe('緊急対応の挿入位置が randomFn で制御される', () => {
    it('randomFn=0.0 → position=minPosition(1)', () => {
      // Arrange: 常に0を返す → 発生判定も位置決定も0
      const randomFn = () => 0;

      // Act
      const events = createEvents(1, 0, randomFn);

      // Assert
      expect(events[CONFIG.emergency.minPosition].id).toBe('emergency');
    });

    it('randomFn=0.99 (位置決定時) → position=maxPosition-1', () => {
      // Arrange: 1回目=0(発生), 2回目=0.99(位置)
      let callCount = 0;
      const randomFn = () => {
        callCount++;
        return callCount === 1 ? 0 : 0.99;
      };

      // Act
      const events = createEvents(1, 0, randomFn);

      // Assert: position = 1 + floor(0.99 * 3) = 1 + 2 = 3
      const emergencyIndex = events.findIndex((e) => e.id === 'emergency');
      expect(emergencyIndex).toBeGreaterThanOrEqual(CONFIG.emergency.minPosition);
      expect(emergencyIndex).toBeLessThan(CONFIG.emergency.maxPosition);
    });
  });

  // ── 境界値テスト ──────────────────────────────────

  describe('境界値', () => {
    it('sprintNumber=0 では緊急対応が発生しない（境界値: 最初のスプリント）', () => {
      // Arrange: 必ず発生する乱数でも sprintNumber=0 なら発生しない
      const alwaysTrigger = () => 0;

      // Act
      const events = createEvents(0, 0, alwaysTrigger);

      // Assert
      expect(events.every((e) => e.id !== 'emergency')).toBe(true);
    });

    it('sprintNumber=1 は緊急対応が発生し得る（境界値: 2スプリント目）', () => {
      // Arrange
      const alwaysTrigger = () => 0;

      // Act
      const events = createEvents(1, 0, alwaysTrigger);

      // Assert
      expect(events.some((e) => e.id === 'emergency')).toBe(true);
    });

    it('debt=0 の場合、確率は base(0.1) のみ', () => {
      // Arrange: probability = min(0.5, 0.1 + 0) = 0.1
      // randomFn=0.09 < 0.1 → 発生
      const justUnder = () => 0.09;

      // Act
      const events = createEvents(1, 0, justUnder);

      // Assert
      expect(events.some((e) => e.id === 'emergency')).toBe(true);
    });

    it('debt=0 で randomFn=0.1 の場合は発生しない（境界値: ちょうど確率値）', () => {
      // Arrange: probability = 0.1, randomFn=0.1 → 0.1 < 0.1 は false
      const atBoundary = () => 0.1;

      // Act
      const events = createEvents(1, 0, atBoundary);

      // Assert
      expect(events.some((e) => e.id === 'emergency')).toBe(false);
    });

    it('確率が maxProbability(0.5) で頭打ちになる', () => {
      // Arrange: debt=200 → probability = min(0.5, 0.1 + 200*0.004) = min(0.5, 0.9) = 0.5
      // randomFn=0.49 < 0.5 → 発生
      const justUnder = () => 0.49;
      const events1 = createEvents(1, 200, justUnder);

      // randomFn=0.5 → 0.5 < 0.5 は false → 発生しない
      const atMax = () => 0.5;
      const events2 = createEvents(1, 200, atMax);

      // Assert
      expect(events1.some((e) => e.id === 'emergency')).toBe(true);
      expect(events2.some((e) => e.id === 'emergency')).toBe(false);
    });
  });
});

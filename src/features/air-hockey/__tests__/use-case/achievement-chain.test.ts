/**
 * 実績連鎖フロー結合テスト
 * - 初勝利・連勝実績の判定を検証
 */
import { FreeBattleUseCase } from '../../application/use-cases/free-battle';
import { createEventDispatcher, type GameEvent } from '../../domain/events/game-events';
import { InMemoryStorageAdapter } from '../helpers/in-memory-storage';
import { TestFactory } from '../helpers/factories';

describe('実績連鎖', () => {
  let storage: InMemoryStorageAdapter;
  let useCase: FreeBattleUseCase;
  let dispatchedEvents: GameEvent[];

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    const dispatcher = createEventDispatcher();
    dispatchedEvents = [];
    // イベントを記録する
    dispatcher.subscribe((event) => {
      dispatchedEvents.push(event);
    });
    useCase = new FreeBattleUseCase(storage, dispatcher);
  });

  it('初勝利実績の判定', () => {
    // Arrange
    const field = TestFactory.createTestFieldConfig();
    const config = useCase.createGameConfig('normal', field, 5);
    const stats = TestFactory.createTestMatchStats();
    const finalScore = { player: 5, cpu: 3 };

    // Act
    const result = useCase.completeGame(config, 'player', stats, finalScore);

    // Assert: 初勝利実績が解除される
    expect(result.achievements).toContain('first_win');

    // ストレージに保存されている
    const savedAchievements = storage.loadAchievements();
    expect(savedAchievements).toContain('first_win');

    // ACHIEVEMENT_UNLOCKED イベントが発行されている
    const achievementEvents = dispatchedEvents.filter(
      (e) => e.type === 'ACHIEVEMENT_UNLOCKED'
    );
    expect(achievementEvents.length).toBeGreaterThan(0);
    const firstWinEvent = achievementEvents.find(
      (e) => e.type === 'ACHIEVEMENT_UNLOCKED' && e.achievementId === 'first_win'
    );
    expect(firstWinEvent).toBeDefined();
  });

  it('連勝実績の判定', () => {
    // Arrange
    const field = TestFactory.createTestFieldConfig();
    const config = useCase.createGameConfig('normal', field, 5);
    const stats = TestFactory.createTestMatchStats();
    const finalScore = { player: 5, cpu: 3 };

    // Act: 3連勝する
    useCase.completeGame(config, 'player', stats, finalScore);
    useCase.completeGame(config, 'player', stats, finalScore);
    const result3 = useCase.completeGame(config, 'player', stats, finalScore);

    // Assert: 3連勝実績が解除される
    expect(result3.achievements).toContain('streak_3');

    // ストレージに保存されている
    const savedAchievements = storage.loadAchievements();
    expect(savedAchievements).toContain('streak_3');

    // 3連勝イベントが発行されている
    const achievementEvents = dispatchedEvents.filter(
      (e) => e.type === 'ACHIEVEMENT_UNLOCKED' && e.achievementId === 'streak_3'
    );
    expect(achievementEvents).toHaveLength(1);
  });
});

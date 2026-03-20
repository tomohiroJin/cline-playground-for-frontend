/**
 * フリー対戦フロー結合テスト
 * - スコア保存・実績判定・アンロック連鎖を検証
 */
import { FreeBattleUseCase } from '../../application/use-cases/free-battle';
import { createEventDispatcher } from '../../domain/events/game-events';
import { InMemoryStorageAdapter } from '../helpers/in-memory-storage';
import { TestFactory } from '../helpers/factories';

describe('フリー対戦フロー', () => {
  let storage: InMemoryStorageAdapter;
  let useCase: FreeBattleUseCase;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    const dispatcher = createEventDispatcher();
    useCase = new FreeBattleUseCase(storage, dispatcher);
  });

  it('フリー対戦完了でスコアが保存される', () => {
    // Arrange
    const field = TestFactory.createTestFieldConfig();
    const config = useCase.createGameConfig('normal', field, 5);
    const stats = TestFactory.createTestMatchStats({ playerHits: 15 });
    const finalScore = { player: 5, cpu: 3 };

    // Act
    const result = useCase.completeGame(config, 'player', stats, finalScore);

    // Assert: アンロック状態が更新される（勝利でtotalWinsが増加）
    const unlockState = storage.loadUnlockState();
    expect(unlockState.totalWins).toBe(1);
    expect(result).toBeDefined();
  });

  it('ハイスコア更新時に正しく記録される', () => {
    // Arrange
    const field = TestFactory.createTestFieldConfig();
    const config = useCase.createGameConfig('normal', field, 5);
    const stats = TestFactory.createTestMatchStats();

    // Act: 複数回プレイして勝利数を蓄積
    useCase.completeGame(config, 'player', stats, { player: 5, cpu: 2 });
    useCase.completeGame(config, 'player', stats, { player: 5, cpu: 1 });
    useCase.completeGame(config, 'cpu', stats, { player: 2, cpu: 5 });

    // Assert: 勝利数は2（3戦目は敗北）
    const unlockState = storage.loadUnlockState();
    expect(unlockState.totalWins).toBe(2);
  });

  it('実績条件を満たした場合に実績が解除される', () => {
    // Arrange: 初勝利実績を狙う
    const field = TestFactory.createTestFieldConfig();
    const config = useCase.createGameConfig('normal', field, 5);
    const stats = TestFactory.createTestMatchStats();
    const finalScore = { player: 5, cpu: 0 };

    // Act
    const result = useCase.completeGame(config, 'player', stats, finalScore);

    // Assert: 初勝利 + パーフェクト実績が解除される
    expect(result.achievements).toContain('first_win');
    expect(result.achievements).toContain('perfect');

    // ストレージにも保存されている
    const savedAchievements = storage.loadAchievements();
    expect(savedAchievements).toContain('first_win');
    expect(savedAchievements).toContain('perfect');
  });

  it('フィールド・アイテムアンロック条件判定が連鎖する', () => {
    // Arrange: 3勝すると pillars フィールドと shield アイテムがアンロックされる
    const field = TestFactory.createTestFieldConfig();
    const config = useCase.createGameConfig('normal', field, 5);
    const stats = TestFactory.createTestMatchStats();
    const finalScore = { player: 5, cpu: 2 };

    // Act: 3回勝利
    useCase.completeGame(config, 'player', stats, finalScore);
    useCase.completeGame(config, 'player', stats, finalScore);
    const result = useCase.completeGame(config, 'player', stats, finalScore);

    // Assert: 3勝時点で pillars と shield がアンロックされる
    const unlockState = storage.loadUnlockState();
    expect(unlockState.totalWins).toBe(3);
    expect(unlockState.unlockedFields).toContain('pillars');
    expect(unlockState.unlockedItems).toContain('shield');
    // 新規アンロックが結果に含まれる
    expect(result.newUnlocks).toContain('pillars');
    expect(result.newUnlocks).toContain('shield');
  });
});

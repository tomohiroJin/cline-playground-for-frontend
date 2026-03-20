/**
 * ストーリーモード全フロー結合テスト
 * - ステージクリア → 進行保存 → アンロック連鎖を検証
 */
import { StoryModeUseCase } from '../../application/use-cases/story-mode';
import { createEventDispatcher } from '../../domain/events/game-events';
import { InMemoryStorageAdapter } from '../helpers/in-memory-storage';
import { TestFactory } from '../helpers/factories';

describe('ストーリーモード全フロー', () => {
  let storage: InMemoryStorageAdapter;
  let useCase: StoryModeUseCase;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    const dispatcher = createEventDispatcher();
    useCase = new StoryModeUseCase(storage, dispatcher);
  });

  it('ステージ1-1クリアでストーリー進行が保存される', () => {
    // Arrange
    const stats = TestFactory.createTestMatchStats({ playerHits: 10 });

    // Act
    const result = useCase.completeStage('1-1', 'player', stats);

    // Assert
    expect(result.progress.clearedStages).toContain('1-1');
    expect(result.progress.clearedStages).toHaveLength(1);
  });

  it('敗北してもストーリー進行は保存されない', () => {
    // Arrange
    const stats = TestFactory.createTestMatchStats();

    // Act
    const result = useCase.completeStage('1-1', 'cpu', stats);

    // Assert
    expect(result.progress.clearedStages).toHaveLength(0);
    expect(result.newUnlocks).toHaveLength(0);
    expect(result.achievements).toHaveLength(0);
  });

  it('ストーリーリセットで全進行がクリアされる', () => {
    // Arrange: ステージ1-1をクリアしておく
    const stats = TestFactory.createTestMatchStats();
    useCase.completeStage('1-1', 'player', stats);

    // Act
    useCase.resetProgress();

    // Assert
    const progress = useCase.loadProgress();
    expect(progress.clearedStages).toHaveLength(0);
  });

  it('ストーリー進行がストレージに正しく永続化される', () => {
    // Arrange
    const stats = TestFactory.createTestMatchStats();

    // Act: 複数ステージをクリア
    useCase.completeStage('1-1', 'player', stats);
    useCase.completeStage('1-2', 'player', stats);

    // Assert: ストレージから直接読み込んで確認
    const savedProgress = storage.loadStoryProgress();
    expect(savedProgress.clearedStages).toContain('1-1');
    expect(savedProgress.clearedStages).toContain('1-2');
    expect(savedProgress.clearedStages).toHaveLength(2);
  });
});

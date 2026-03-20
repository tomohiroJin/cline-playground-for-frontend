/**
 * アンロック連鎖フロー結合テスト
 * - ステージクリア → キャラアンロック → 図鑑通知の一連の流れを検証
 */
import { StoryModeUseCase } from '../../application/use-cases/story-mode';
import { FreeBattleUseCase } from '../../application/use-cases/free-battle';
import { CharacterDexUseCase } from '../../application/use-cases/character-dex';
import { createEventDispatcher } from '../../domain/events/game-events';
import { InMemoryStorageAdapter } from '../helpers/in-memory-storage';
import { TestFactory } from '../helpers/factories';

describe('アンロック連鎖', () => {
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
  });

  it('ステージクリア → キャラアンロック → 図鑑通知の連鎖', () => {
    // Arrange
    const dispatcher = createEventDispatcher();
    const storyUseCase = new StoryModeUseCase(storage, dispatcher);
    const dexUseCase = new CharacterDexUseCase(storage);
    const stats = TestFactory.createTestMatchStats();

    // Act: ステージ1-1をクリア（hiro がアンロックされるはず）
    const result = storyUseCase.completeStage('1-1', 'player', stats);

    // Assert: hiro がアンロックされている
    expect(result.newUnlocks).toContain('hiro');

    // 図鑑進行でも確認
    const dexProgress = dexUseCase.getProgress();
    expect(dexProgress.unlockedCharacterIds).toContain('hiro');
    // 新規アンロック通知に含まれている
    expect(dexProgress.newlyUnlockedIds).toContain('hiro');

    // Act: 通知を既読にする
    dexUseCase.markViewed(['hiro']);

    // Assert: 既読後は newlyUnlockedIds から消える
    const updatedProgress = dexUseCase.getProgress();
    expect(updatedProgress.newlyUnlockedIds).not.toContain('hiro');
    // アンロック自体は維持される
    expect(updatedProgress.unlockedCharacterIds).toContain('hiro');
  });

  it('フリー対戦勝利 → アンロック状態更新の連鎖', () => {
    // Arrange
    const dispatcher = createEventDispatcher();
    const freeBattleUseCase = new FreeBattleUseCase(storage, dispatcher);
    const field = TestFactory.createTestFieldConfig();
    const config = freeBattleUseCase.createGameConfig('normal', field, 5);
    const stats = TestFactory.createTestMatchStats();
    const finalScore = { player: 5, cpu: 2 };

    // Act: 初期状態のアンロック状態を確認
    const initialUnlockState = storage.loadUnlockState();
    expect(initialUnlockState.totalWins).toBe(0);

    // 3回勝利してアンロック連鎖を発生させる
    freeBattleUseCase.completeGame(config, 'player', stats, finalScore);
    freeBattleUseCase.completeGame(config, 'player', stats, finalScore);
    freeBattleUseCase.completeGame(config, 'player', stats, finalScore);

    // Assert: アンロック状態が連鎖的に更新される
    const unlockState = storage.loadUnlockState();
    expect(unlockState.totalWins).toBe(3);
    // 3勝で pillars フィールドがアンロック
    expect(unlockState.unlockedFields).toContain('pillars');
    // 3勝で shield アイテムがアンロック
    expect(unlockState.unlockedItems).toContain('shield');
  });
});

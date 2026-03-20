/**
 * キャラクター図鑑ユースケースのテスト
 */
import { CharacterDexUseCase } from './character-dex';
import { InMemoryStorageAdapter } from '../../__tests__/helpers/in-memory-storage';
import type { GameStoragePort } from '../../domain/contracts/storage';

describe('CharacterDexUseCase', () => {
  let storage: GameStoragePort;
  let useCase: CharacterDexUseCase;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    useCase = new CharacterDexUseCase(storage);
  });

  describe('getProgress', () => {
    it('初期状態ではplayerのみアンロック済みである', () => {
      const progress = useCase.getProgress();
      expect(progress.unlockedCharacterIds).toContain('player');
      expect(progress.unlockedCharacterIds).toHaveLength(1);
    });

    it('新規アンロック通知は空である', () => {
      const progress = useCase.getProgress();
      expect(progress.newlyUnlockedIds).toHaveLength(0);
    });
  });

  describe('checkAndUnlock', () => {
    it('ストーリー1-1クリアでhiroがアンロックされる', () => {
      const newUnlocks = useCase.checkAndUnlock({ clearedStages: ['1-1'] });
      expect(newUnlocks).toContain('hiro');
    });

    it('アンロック後はストレージに永続化される', () => {
      useCase.checkAndUnlock({ clearedStages: ['1-1'] });
      const progress = storage.loadDexProgress();
      expect(progress.unlockedCharacterIds).toContain('hiro');
    });

    it('アンロック後はnewlyUnlockedIdsに追加される', () => {
      useCase.checkAndUnlock({ clearedStages: ['1-1'] });
      const progress = useCase.getProgress();
      expect(progress.newlyUnlockedIds).toContain('hiro');
    });

    it('既にアンロック済みのキャラは再アンロックされない', () => {
      useCase.checkAndUnlock({ clearedStages: ['1-1'] });
      const newUnlocks = useCase.checkAndUnlock({ clearedStages: ['1-1'] });
      expect(newUnlocks).toHaveLength(0);
    });
  });

  describe('markViewed', () => {
    it('既読処理でnewlyUnlockedIdsから削除される', () => {
      useCase.checkAndUnlock({ clearedStages: ['1-1'] });
      useCase.markViewed(['hiro']);
      const progress = useCase.getProgress();
      expect(progress.newlyUnlockedIds).not.toContain('hiro');
    });

    it('既読処理後もアンロック状態は維持される', () => {
      useCase.checkAndUnlock({ clearedStages: ['1-1'] });
      useCase.markViewed(['hiro']);
      expect(useCase.isUnlocked('hiro')).toBe(true);
    });
  });

  describe('isUnlocked', () => {
    it('playerは初期状態でアンロック済みである', () => {
      expect(useCase.isUnlocked('player')).toBe(true);
    });

    it('未アンロックのキャラはfalseを返す', () => {
      expect(useCase.isUnlocked('hiro')).toBe(false);
    });
  });

  describe('getNewUnlockCount', () => {
    it('初期状態では0を返す', () => {
      expect(useCase.getNewUnlockCount()).toBe(0);
    });

    it('アンロック後は新規数を返す', () => {
      useCase.checkAndUnlock({ clearedStages: ['1-1'] });
      expect(useCase.getNewUnlockCount()).toBe(1);
    });

    it('既読処理後は0に戻る', () => {
      useCase.checkAndUnlock({ clearedStages: ['1-1'] });
      useCase.markViewed(['hiro']);
      expect(useCase.getNewUnlockCount()).toBe(0);
    });
  });
});

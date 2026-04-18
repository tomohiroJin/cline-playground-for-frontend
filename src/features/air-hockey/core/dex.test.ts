/**
 * アンロックシステム（dex.ts）のテスト
 * P2-02: 永続化・判定ロジックの検証
 */
import {
  loadDexProgress,
  saveDexProgress,
  resetDexProgress,
  checkNewUnlocks,
  markAsViewed,
  DEFAULT_DEX_PROGRESS,
  DEX_STORAGE_KEY,
} from './dex';
import type { DexProgress } from './types';
import type { StoryProgress } from './story';
import {
  getMockStorage,
  setupMockLocalStorage,
  teardownMockLocalStorage,
} from '../__tests__/helpers/mock-local-storage';

const mockStorage = getMockStorage();

beforeEach(() => {
  setupMockLocalStorage();
});

afterEach(() => {
  teardownMockLocalStorage();
});

describe('loadDexProgress', () => {
  it('localStorage にデータがない場合、デフォルト状態を返す', () => {
    // Act
    const progress = loadDexProgress();

    // Assert
    expect(progress).toEqual(DEFAULT_DEX_PROGRESS);
    expect(progress.unlockedCharacterIds).toContain('player');
    // ユウ・ソウタ・ケンジ・レンは初期ロック
    expect(progress.unlockedCharacterIds).not.toContain('yuu');
    expect(progress.unlockedCharacterIds).not.toContain('rookie');
    expect(progress.unlockedCharacterIds).not.toContain('regular');
    expect(progress.unlockedCharacterIds).not.toContain('ace');
    expect(progress.newlyUnlockedIds).toEqual([]);
  });

  it('localStorage から正常にデータを読み込む', () => {
    // Arrange
    const saved: DexProgress = {
      unlockedCharacterIds: ['player', 'hiro'],
      newlyUnlockedIds: ['hiro'],
    };
    mockStorage[DEX_STORAGE_KEY] = JSON.stringify(saved);

    // Act
    const progress = loadDexProgress();

    // Assert
    expect(progress).toEqual(saved);
    expect(progress.unlockedCharacterIds).toContain('hiro');
  });

  it('localStorage のデータが破損している場合、デフォルト状態を返す', () => {
    // Arrange
    mockStorage[DEX_STORAGE_KEY] = '{ invalid json';

    // Act
    const progress = loadDexProgress();

    // Assert
    expect(progress).toEqual(DEFAULT_DEX_PROGRESS);
  });

  it('localStorage のデータが不正な構造の場合、デフォルト状態を返す', () => {
    // Arrange
    mockStorage[DEX_STORAGE_KEY] = JSON.stringify({ foo: 'bar' });

    // Act
    const progress = loadDexProgress();

    // Assert
    expect(progress).toEqual(DEFAULT_DEX_PROGRESS);
  });
});

describe('saveDexProgress', () => {
  it('localStorage にデータを保存する', () => {
    // Arrange
    const progress: DexProgress = {
      unlockedCharacterIds: ['player', 'hiro'],
      newlyUnlockedIds: ['hiro'],
    };

    // Act
    saveDexProgress(progress);

    // Assert
    const stored = JSON.parse(mockStorage[DEX_STORAGE_KEY]);
    expect(stored).toEqual(progress);
  });
});

describe('resetDexProgress', () => {
  it('localStorage からデータを削除する', () => {
    // Arrange
    mockStorage[DEX_STORAGE_KEY] = JSON.stringify({ unlockedCharacterIds: [], newlyUnlockedIds: [] });

    // Act
    resetDexProgress();

    // Assert
    expect(mockStorage[DEX_STORAGE_KEY]).toBeUndefined();
  });
});

describe('checkNewUnlocks', () => {
  it('ストーリークリアで新規アンロック対象を返す', () => {
    // Arrange: ステージ 1-1 をクリア済み
    const storyProgress: StoryProgress = { clearedStages: ['1-1'] };
    const currentDexProgress: DexProgress = {
      unlockedCharacterIds: ['player'],
      newlyUnlockedIds: [],
    };

    // Act
    const newUnlocks = checkNewUnlocks(storyProgress, currentDexProgress);

    // Assert: ヒロがアンロックされる
    expect(newUnlocks).toEqual(['hiro']);
  });

  it('既にアンロック済みのキャラは返さない', () => {
    // Arrange: ステージ 1-1 クリア済み、ヒロはアンロック済み
    const storyProgress: StoryProgress = { clearedStages: ['1-1'] };
    const currentDexProgress: DexProgress = {
      unlockedCharacterIds: ['player', 'hiro'],
      newlyUnlockedIds: [],
    };

    // Act
    const newUnlocks = checkNewUnlocks(storyProgress, currentDexProgress);

    // Assert
    expect(newUnlocks).toEqual([]);
  });

  it('条件未達のキャラはアンロックされない', () => {
    // Arrange: ストーリー未クリア
    const storyProgress: StoryProgress = { clearedStages: [] };
    const currentDexProgress: DexProgress = {
      unlockedCharacterIds: ['player'],
      newlyUnlockedIds: [],
    };

    // Act
    const newUnlocks = checkNewUnlocks(storyProgress, currentDexProgress);

    // Assert
    expect(newUnlocks).toEqual([]);
  });

  it('複数ステージクリアで複数キャラをアンロックする', () => {
    // Arrange: ステージ 1-1, 1-2, 1-3 をクリア済み
    const storyProgress: StoryProgress = { clearedStages: ['1-1', '1-2', '1-3'] };
    const currentDexProgress: DexProgress = {
      unlockedCharacterIds: ['player'],
      newlyUnlockedIds: [],
    };

    // Act
    const newUnlocks = checkNewUnlocks(storyProgress, currentDexProgress);

    // Assert
    expect(newUnlocks).toContain('hiro');
    expect(newUnlocks).toContain('misaki');
    expect(newUnlocks).toContain('takuma');
    expect(newUnlocks).toHaveLength(3);
  });
});

describe('markAsViewed', () => {
  it('指定されたキャラIDを newlyUnlockedIds から除去する', () => {
    // Arrange
    const progress: DexProgress = {
      unlockedCharacterIds: ['player', 'hiro', 'misaki'],
      newlyUnlockedIds: ['hiro', 'misaki'],
    };

    // Act
    const updated = markAsViewed(progress, ['hiro']);

    // Assert
    expect(updated.newlyUnlockedIds).toEqual(['misaki']);
    // unlockedCharacterIds は変更なし
    expect(updated.unlockedCharacterIds).toEqual(progress.unlockedCharacterIds);
  });

  it('全ての未確認を既読にできる', () => {
    // Arrange
    const progress: DexProgress = {
      unlockedCharacterIds: ['player', 'hiro', 'misaki'],
      newlyUnlockedIds: ['hiro', 'misaki'],
    };

    // Act
    const updated = markAsViewed(progress, ['hiro', 'misaki']);

    // Assert
    expect(updated.newlyUnlockedIds).toEqual([]);
  });
});

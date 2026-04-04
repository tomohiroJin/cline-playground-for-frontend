/**
 * useCharacterDex フックのテスト
 * P2-02: カスタムフックの検証
 */
import { renderHook, act } from '@testing-library/react';
import { useCharacterDex } from './useCharacterDex';
import { DEX_STORAGE_KEY, DEFAULT_DEX_PROGRESS } from '../core/dex';
import type { DexProgress } from '../core/types';
import type { StoryProgress } from '../core/story';
import { getVisibleDexEntries } from '../core/dex-data';
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

describe('useCharacterDex', () => {
  it('初期状態で初期解放キャラがアンロック済みになっている', () => {
    // Act
    const { result } = renderHook(() => useCharacterDex());

    // Assert
    expect(result.current.unlockedIds).toEqual(
      DEFAULT_DEX_PROGRESS.unlockedCharacterIds
    );
    expect(result.current.newlyUnlockedIds).toEqual([]);
    expect(result.current.dexEntries).toEqual(getVisibleDexEntries());
    expect(result.current.isUnlocked('player')).toBe(true);
    // ユウは隠しキャラのため初期ロック
    expect(result.current.isUnlocked('yuu')).toBe(false);
    expect(result.current.isUnlocked('hiro')).toBe(false);
  });

  it('checkAndUnlock でストーリークリア時にアンロックされる', () => {
    // Arrange
    const { result } = renderHook(() => useCharacterDex());
    const storyProgress: StoryProgress = { clearedStages: ['1-1'] };

    // Act
    let newUnlocks: string[] = [];
    act(() => {
      newUnlocks = result.current.checkAndUnlock(storyProgress);
    });

    // Assert
    expect(newUnlocks).toEqual(['hiro']);
    expect(result.current.unlockedIds).toContain('hiro');
    expect(result.current.newlyUnlockedIds).toContain('hiro');
    expect(result.current.isUnlocked('hiro')).toBe(true);
    // localStorage にも保存される
    const stored: DexProgress = JSON.parse(mockStorage[DEX_STORAGE_KEY]);
    expect(stored.unlockedCharacterIds).toContain('hiro');
  });

  it('markViewed で新規アンロック通知が消える', () => {
    // Arrange: ヒロがアンロック済み＋未確認状態
    const saved: DexProgress = {
      unlockedCharacterIds: ['player', 'hiro'],
      newlyUnlockedIds: ['hiro'],
    };
    mockStorage[DEX_STORAGE_KEY] = JSON.stringify(saved);
    const { result } = renderHook(() => useCharacterDex());

    // Act
    act(() => {
      result.current.markViewed(['hiro']);
    });

    // Assert
    expect(result.current.newlyUnlockedIds).toEqual([]);
    expect(result.current.getNewUnlockCount()).toBe(0);
  });

  it('completionRate が表示対象キャラのみで計算される', () => {
    // Arrange: デフォルトで1キャラ（player）アンロック
    const { result } = renderHook(() => useCharacterDex());

    // Assert: hidden キャラを除外した7件が母数
    // player(1) / visible(7)
    expect(result.current.dexEntries).toHaveLength(7);
    expect(result.current.completionRate).toBe(1 / 7);
  });

  it('getNewUnlockCount が未確認数を正しく返す', () => {
    // Arrange
    const saved: DexProgress = {
      unlockedCharacterIds: ['player', 'hiro', 'misaki'],
      newlyUnlockedIds: ['hiro', 'misaki'],
    };
    mockStorage[DEX_STORAGE_KEY] = JSON.stringify(saved);
    const { result } = renderHook(() => useCharacterDex());

    // Assert
    expect(result.current.getNewUnlockCount()).toBe(2);
  });
});

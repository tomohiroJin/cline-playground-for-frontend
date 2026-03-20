/**
 * LocalStorageAdapter テスト
 * - 各データ型の保存・読込
 * - JSON 破損時のフォールバック
 * - localStorage 未対応時の安全な動作
 */
import { LocalStorageAdapter } from './local-storage-adapter';
import {
  setupMockLocalStorage,
  teardownMockLocalStorage,
  getMockStorage,
} from '../../__tests__/helpers/mock-local-storage';
import type { GameStoragePort } from '../../domain/contracts/storage';

describe('LocalStorageAdapter', () => {
  let adapter: GameStoragePort;

  beforeEach(() => {
    setupMockLocalStorage();
    adapter = new LocalStorageAdapter();
  });

  afterEach(() => {
    teardownMockLocalStorage();
  });

  describe('実績', () => {
    it('初期状態で空配列を返す', () => {
      expect(adapter.loadAchievements()).toEqual([]);
    });

    it('保存した実績を読み込める', () => {
      const ids = ['first_win', 'perfect'];
      adapter.saveAchievements(ids);
      expect(adapter.loadAchievements()).toEqual(ids);
    });

    it('JSON 破損時は空配列にフォールバックする', () => {
      getMockStorage()['air_hockey_achievements'] = 'broken json';
      expect(adapter.loadAchievements()).toEqual([]);
    });
  });

  describe('ストーリー進行', () => {
    it('初期状態でデフォルト値を返す', () => {
      expect(adapter.loadStoryProgress()).toEqual({ clearedStages: [] });
    });

    it('保存したストーリー進行を読み込める', () => {
      const progress = { clearedStages: ['1-1', '1-2'] };
      adapter.saveStoryProgress(progress);
      expect(adapter.loadStoryProgress()).toEqual(progress);
    });

    it('JSON 破損時はデフォルト値にフォールバックする', () => {
      getMockStorage()['ah_story_progress'] = '{invalid}';
      expect(adapter.loadStoryProgress()).toEqual({ clearedStages: [] });
    });

    it('構造が不正な場合はデフォルト値にフォールバックする', () => {
      getMockStorage()['ah_story_progress'] = JSON.stringify({ wrong: true });
      expect(adapter.loadStoryProgress()).toEqual({ clearedStages: [] });
    });
  });

  describe('アンロック状態', () => {
    it('初期状態でデフォルト値を返す', () => {
      const state = adapter.loadUnlockState();
      expect(state.unlockedFields).toEqual(['classic', 'wide']);
      expect(state.unlockedItems).toEqual(['split', 'speed', 'invisible']);
      expect(state.totalWins).toBe(0);
    });

    it('保存したアンロック状態を読み込める', () => {
      const state = {
        unlockedFields: ['classic', 'wide', 'pillars'],
        unlockedItems: ['split', 'speed', 'invisible', 'shield'],
        totalWins: 5,
      };
      adapter.saveUnlockState(state);
      expect(adapter.loadUnlockState()).toEqual(state);
    });

    it('JSON 破損時はデフォルト値にフォールバックする', () => {
      getMockStorage()['ah_unlock_state'] = 'broken';
      const state = adapter.loadUnlockState();
      expect(state.unlockedFields).toEqual(['classic', 'wide']);
      expect(state.totalWins).toBe(0);
    });
  });

  describe('図鑑進行', () => {
    it('初期状態でデフォルト値を返す', () => {
      const progress = adapter.loadDexProgress();
      expect(progress.unlockedCharacterIds).toEqual(['player']);
      expect(progress.newlyUnlockedIds).toEqual([]);
    });

    it('保存した図鑑進行を読み込める', () => {
      const progress = {
        unlockedCharacterIds: ['player', 'hiro'],
        newlyUnlockedIds: ['hiro'],
      };
      adapter.saveDexProgress(progress);
      expect(adapter.loadDexProgress()).toEqual(progress);
    });

    it('JSON 破損時はデフォルト値にフォールバックする', () => {
      getMockStorage()['ah_dex_progress'] = '{bad';
      const progress = adapter.loadDexProgress();
      expect(progress.unlockedCharacterIds).toEqual(['player']);
    });
  });

  describe('オーディオ設定', () => {
    it('初期状態でデフォルト値を返す', () => {
      expect(adapter.loadAudioSettings()).toEqual({
        bgmVolume: 50,
        seVolume: 50,
        muted: false,
      });
    });

    it('保存したオーディオ設定を読み込める', () => {
      const settings = { bgmVolume: 80, seVolume: 30, muted: true };
      adapter.saveAudioSettings(settings);
      expect(adapter.loadAudioSettings()).toEqual(settings);
    });

    it('JSON 破損時はデフォルト値にフォールバックする', () => {
      getMockStorage()['air_hockey_audio_settings'] = 'nope';
      expect(adapter.loadAudioSettings()).toEqual({
        bgmVolume: 50,
        seVolume: 50,
        muted: false,
      });
    });
  });

  describe('デイリーチャレンジ', () => {
    it('結果がない日付は undefined を返す', () => {
      expect(adapter.loadDailyChallengeResult('2026-03-20')).toBeUndefined();
    });

    it('保存したチャレンジ結果を読み込める', () => {
      const result = {
        date: '2026-03-20',
        isCleared: true,
        playerScore: 7,
        cpuScore: 3,
      };
      adapter.saveDailyChallengeResult('2026-03-20', result);
      expect(adapter.loadDailyChallengeResult('2026-03-20')).toEqual(result);
    });

    it('異なる日付の結果は独立して管理される', () => {
      const result1 = { date: '2026-03-20', isCleared: true, playerScore: 7, cpuScore: 3 };
      const result2 = { date: '2026-03-21', isCleared: false, playerScore: 2, cpuScore: 7 };
      adapter.saveDailyChallengeResult('2026-03-20', result1);
      adapter.saveDailyChallengeResult('2026-03-21', result2);
      expect(adapter.loadDailyChallengeResult('2026-03-20')).toEqual(result1);
      expect(adapter.loadDailyChallengeResult('2026-03-21')).toEqual(result2);
    });

    it('JSON 破損時は undefined にフォールバックする', () => {
      getMockStorage()['ah_daily_challenge'] = 'broken';
      expect(adapter.loadDailyChallengeResult('2026-03-20')).toBeUndefined();
    });
  });

  describe('スコア', () => {
    it('スコアがないキーは空配列を返す', () => {
      expect(adapter.loadHighScores('easy')).toEqual([]);
    });

    it('保存したスコアを降順で読み込める', () => {
      adapter.saveHighScore('easy', 3);
      adapter.saveHighScore('easy', 7);
      adapter.saveHighScore('easy', 5);
      expect(adapter.loadHighScores('easy')).toEqual([7, 5, 3]);
    });

    it('異なるキーのスコアは独立して管理される', () => {
      adapter.saveHighScore('easy', 10);
      adapter.saveHighScore('hard', 5);
      expect(adapter.loadHighScores('easy')).toEqual([10]);
      expect(adapter.loadHighScores('hard')).toEqual([5]);
    });

    it('JSON 破損時は空配列にフォールバックする', () => {
      getMockStorage()['ah_high_scores'] = 'broken';
      expect(adapter.loadHighScores('easy')).toEqual([]);
    });
  });
});

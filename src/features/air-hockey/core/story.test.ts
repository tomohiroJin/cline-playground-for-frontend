/**
 * Phase 2: ストーリー進行保存のテスト
 * US-2.8（ストーリー進行の保存）に対応
 */
import {
  loadStoryProgress,
  saveStoryProgress,
  resetStoryProgress,
  isStageUnlocked,
  STORY_PROGRESS_KEY,
} from './story';
import type { StoryProgress, StageDefinition } from './story';

// テスト用のステージデータ
const TEST_STAGES: StageDefinition[] = [
  {
    id: '1-1',
    chapter: 1,
    stageNumber: 1,
    name: 'テストステージ1',
    characterId: 'hiro',
    fieldId: 'classic',
    difficulty: 'easy',
    winScore: 3,
    preDialogue: [],
    postWinDialogue: [],
    postLoseDialogue: [],
  },
  {
    id: '1-2',
    chapter: 1,
    stageNumber: 2,
    name: 'テストステージ2',
    characterId: 'misaki',
    fieldId: 'wide',
    difficulty: 'normal',
    winScore: 3,
    preDialogue: [],
    postWinDialogue: [],
    postLoseDialogue: [],
  },
  {
    id: '1-3',
    chapter: 1,
    stageNumber: 3,
    name: 'テストステージ3',
    characterId: 'takuma',
    fieldId: 'pillars',
    difficulty: 'hard',
    winScore: 5,
    preDialogue: [],
    postWinDialogue: [],
    postLoseDialogue: [],
  },
];

// localStorage のモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Phase 2: ストーリー進行保存', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  // ── P2-07: ストーリー進行保存 ─────────────────────
  describe('P2-07: ストーリー進行の保存と読み込み', () => {
    describe('loadStoryProgress', () => {
      it('初期状態で空のクリア済みステージ配列を返す', () => {
        const progress = loadStoryProgress();
        expect(progress.clearedStages).toEqual([]);
      });

      it('保存済みデータを正しく読み込む', () => {
        const saved: StoryProgress = { clearedStages: ['1-1', '1-2'] };
        localStorageMock.setItem(STORY_PROGRESS_KEY, JSON.stringify(saved));

        const progress = loadStoryProgress();
        expect(progress.clearedStages).toEqual(['1-1', '1-2']);
      });

      it('不正な JSON の場合はフォールバックを返す', () => {
        localStorageMock.setItem(STORY_PROGRESS_KEY, '{invalid json');

        const progress = loadStoryProgress();
        expect(progress).toEqual({ clearedStages: [] });
      });

      it('clearedStages が配列でない場合はフォールバックを返す', () => {
        localStorageMock.setItem(STORY_PROGRESS_KEY, JSON.stringify({ clearedStages: 'not-array' }));

        const progress = loadStoryProgress();
        expect(progress).toEqual({ clearedStages: [] });
      });

      it('パースしたデータに clearedStages がない場合はフォールバックを返す', () => {
        localStorageMock.setItem(STORY_PROGRESS_KEY, JSON.stringify({ other: 'data' }));

        const progress = loadStoryProgress();
        expect(progress).toEqual({ clearedStages: [] });
      });
    });

    describe('saveStoryProgress', () => {
      it('進行データを localStorage に保存する', () => {
        const progress: StoryProgress = { clearedStages: ['1-1'] };
        saveStoryProgress(progress);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          STORY_PROGRESS_KEY,
          JSON.stringify(progress)
        );
      });
    });

    describe('save → load の往復テスト', () => {
      it('保存したデータを正しく読み込める', () => {
        const original: StoryProgress = { clearedStages: ['1-1', '1-2'] };
        saveStoryProgress(original);

        const loaded = loadStoryProgress();
        expect(loaded).toEqual(original);
      });
    });

    describe('resetStoryProgress', () => {
      it('進行データを削除する', () => {
        saveStoryProgress({ clearedStages: ['1-1'] });
        resetStoryProgress();

        expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORY_PROGRESS_KEY);
      });

      it('リセット後は初期状態に戻る', () => {
        saveStoryProgress({ clearedStages: ['1-1', '1-2'] });
        resetStoryProgress();

        const progress = loadStoryProgress();
        expect(progress.clearedStages).toEqual([]);
      });
    });
  });

  // ── ステージ解放判定 ───────────────────────────────
  describe('isStageUnlocked', () => {
    it('最初のステージ（1-1）は常に解放されている', () => {
      const progress: StoryProgress = { clearedStages: [] };
      expect(isStageUnlocked('1-1', progress, TEST_STAGES)).toBe(true);
    });

    it('前のステージがクリア済みなら次のステージが解放される', () => {
      const progress: StoryProgress = { clearedStages: ['1-1'] };
      expect(isStageUnlocked('1-2', progress, TEST_STAGES)).toBe(true);
    });

    it('前のステージが未クリアなら次のステージは未解放', () => {
      const progress: StoryProgress = { clearedStages: [] };
      expect(isStageUnlocked('1-2', progress, TEST_STAGES)).toBe(false);
    });

    it('1-1 と 1-2 がクリア済みなら 1-3 が解放される', () => {
      const progress: StoryProgress = { clearedStages: ['1-1', '1-2'] };
      expect(isStageUnlocked('1-3', progress, TEST_STAGES)).toBe(true);
    });

    it('1-1 だけクリアでは 1-3 は未解放', () => {
      const progress: StoryProgress = { clearedStages: ['1-1'] };
      expect(isStageUnlocked('1-3', progress, TEST_STAGES)).toBe(false);
    });
  });

  // ── localStorage キーの衝突防止 ────────────────────
  describe('localStorage キー', () => {
    it('ストーリー進行キーが ah_story_progress である', () => {
      expect(STORY_PROGRESS_KEY).toBe('ah_story_progress');
    });
  });
});

/**
 * Phase 3: ストーリーモード統合テスト
 * US-2.2〜US-2.6 の統合的な動作検証
 */
import { CHAPTER_1_STAGES } from './dialogue-data';
import {
  loadStoryProgress,
  saveStoryProgress,
  resetStoryProgress,
  isStageUnlocked,
} from './story';
import type { StoryProgress } from './story';
import { findCharacterById, PLAYER_CHARACTER } from './characters';
import { FIELDS } from './config';
import type { GameMode } from './types';

describe('Phase 3: ストーリーモード統合テスト', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('P3-01: タイトル画面のモード選択', () => {
    it('GameMode 型が free と story を持つ', () => {
      const free: GameMode = 'free';
      const story: GameMode = 'story';
      expect(free).toBe('free');
      expect(story).toBe('story');
    });
  });

  describe('P3-03: ステージ選択の解放ロジック', () => {
    it('初期状態: ステージ1-1のみ解放', () => {
      const progress: StoryProgress = { clearedStages: [] };
      expect(isStageUnlocked('1-1', progress, CHAPTER_1_STAGES)).toBe(true);
      expect(isStageUnlocked('1-2', progress, CHAPTER_1_STAGES)).toBe(false);
      expect(isStageUnlocked('1-3', progress, CHAPTER_1_STAGES)).toBe(false);
    });

    it('1-1クリア後: 1-2が解放される', () => {
      const progress: StoryProgress = { clearedStages: ['1-1'] };
      expect(isStageUnlocked('1-1', progress, CHAPTER_1_STAGES)).toBe(true);
      expect(isStageUnlocked('1-2', progress, CHAPTER_1_STAGES)).toBe(true);
      expect(isStageUnlocked('1-3', progress, CHAPTER_1_STAGES)).toBe(false);
    });

    it('1-1, 1-2クリア後: 1-3が解放される', () => {
      const progress: StoryProgress = { clearedStages: ['1-1', '1-2'] };
      expect(isStageUnlocked('1-3', progress, CHAPTER_1_STAGES)).toBe(true);
    });
  });

  describe('P3-04: ダイアログデータの整合性', () => {
    CHAPTER_1_STAGES.forEach(stage => {
      describe(`ステージ ${stage.id}: ${stage.name}`, () => {
        it('試合前ダイアログのキャラクターIDが有効', () => {
          stage.preDialogue.forEach(d => {
            const char = findCharacterById(d.characterId);
            expect(char).toBeDefined();
          });
        });

        it('勝利後ダイアログのキャラクターIDが有効', () => {
          stage.postWinDialogue.forEach(d => {
            const char = findCharacterById(d.characterId);
            expect(char).toBeDefined();
          });
        });

        it('敗北後ダイアログのキャラクターIDが有効', () => {
          stage.postLoseDialogue.forEach(d => {
            const char = findCharacterById(d.characterId);
            expect(char).toBeDefined();
          });
        });
      });
    });
  });

  describe('P3-05: VS画面に必要なデータの整合性', () => {
    it('プレイヤーキャラクターが定義されている', () => {
      expect(PLAYER_CHARACTER.id).toBe('player');
      expect(PLAYER_CHARACTER.name).toBe('アキラ');
      expect(PLAYER_CHARACTER.icon).toBeTruthy();
    });

    CHAPTER_1_STAGES.forEach(stage => {
      it(`ステージ ${stage.id} の対戦相手キャラクターが定義されている`, () => {
        const char = findCharacterById(stage.characterId);
        expect(char).toBeDefined();
        expect(char?.name).toBeTruthy();
        expect(char?.icon).toBeTruthy();
      });

      it(`ステージ ${stage.id} のフィールドが定義されている`, () => {
        const field = FIELDS.find(f => f.id === stage.fieldId);
        expect(field).toBeDefined();
        expect(field?.name).toBeTruthy();
      });
    });
  });

  describe('P3-06: ストーリー進行の保存と読み込み', () => {
    it('勝利時にクリアフラグを保存し、次ステージが解放される', () => {
      // 初期状態
      let progress = loadStoryProgress();
      expect(progress.clearedStages).toEqual([]);

      // ステージ1-1をクリア
      progress = { clearedStages: ['1-1'] };
      saveStoryProgress(progress);

      // 読み込みで反映される
      const loaded = loadStoryProgress();
      expect(loaded.clearedStages).toContain('1-1');
      expect(isStageUnlocked('1-2', loaded, CHAPTER_1_STAGES)).toBe(true);
    });

    it('全ステージクリアのフロー', () => {
      // 各ステージを順にクリア
      saveStoryProgress({ clearedStages: ['1-1'] });
      saveStoryProgress({ clearedStages: ['1-1', '1-2'] });
      saveStoryProgress({ clearedStages: ['1-1', '1-2', '1-3'] });

      const progress = loadStoryProgress();
      expect(progress.clearedStages).toHaveLength(3);

      // 全ステージ解放済み
      CHAPTER_1_STAGES.forEach(stage => {
        expect(isStageUnlocked(stage.id, progress, CHAPTER_1_STAGES)).toBe(true);
      });
    });

    it('リセットで全進行データがクリアされる', () => {
      saveStoryProgress({ clearedStages: ['1-1', '1-2'] });
      resetStoryProgress();

      const progress = loadStoryProgress();
      expect(progress.clearedStages).toEqual([]);
      expect(isStageUnlocked('1-2', progress, CHAPTER_1_STAGES)).toBe(false);
    });

    it('重複クリアで同じステージIDが二重登録されない（アプリ側で制御）', () => {
      const clearedStages = ['1-1'];
      // 重複チェック
      const stageId = '1-1';
      if (!clearedStages.includes(stageId)) {
        clearedStages.push(stageId);
      }
      expect(clearedStages).toHaveLength(1);
    });
  });

  describe('P3-07: リザルト画面のストーリーモード対応', () => {
    it('次のステージの存在判定が正しく動作する', () => {
      // ステージ1-1の次は1-2
      const stage1Idx = CHAPTER_1_STAGES.findIndex(s => s.id === '1-1');
      expect(CHAPTER_1_STAGES[stage1Idx + 1]).toBeDefined();
      expect(CHAPTER_1_STAGES[stage1Idx + 1].id).toBe('1-2');

      // ステージ1-3の次はない（最終ステージ）
      const stage3Idx = CHAPTER_1_STAGES.findIndex(s => s.id === '1-3');
      expect(CHAPTER_1_STAGES[stage3Idx + 1]).toBeUndefined();
    });
  });
});

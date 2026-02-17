import { PROLOGUE_STORY, getStageStory, getAllStoryScenes, getEndingEpilogue, STAGE_REWARD_CHOICES } from '../story';

describe('story', () => {
  describe('PROLOGUE_STORY', () => {
    test('id、title、linesプロパティを持つこと', () => {
      expect(PROLOGUE_STORY).toHaveProperty('id');
      expect(PROLOGUE_STORY).toHaveProperty('title');
      expect(PROLOGUE_STORY).toHaveProperty('lines');
    });

    test('linesが5つの要素を持つこと', () => {
      expect(PROLOGUE_STORY.lines).toHaveLength(5);
    });

    test('タイトルが「調査開始」であること', () => {
      expect(PROLOGUE_STORY.title).toBe('調査開始');
    });
  });

  describe('getStageStory', () => {
    test('ステージ1のストーリーシーンを正しく取得できること', () => {
      const scene = getStageStory(1);
      expect(scene).toBeDefined();
      expect(scene.id).toBe('story_1');
    });

    test('ステージ5のストーリーシーンを取得できること', () => {
      const scene = getStageStory(5);
      expect(scene).toBeDefined();
      expect(scene).toHaveProperty('id');
      expect(scene).toHaveProperty('title');
      expect(scene).toHaveProperty('lines');
    });
  });

  describe('getAllStoryScenes', () => {
    test('6件のストーリーシーンを返すこと（プロローグ1件 + 5ステージ分）', () => {
      const scenes = getAllStoryScenes();
      expect(scenes).toHaveLength(6);
    });
  });

  describe('getEndingEpilogue', () => {
    test('全5種類の評価に対してテキストを返すこと', () => {
      const ratings = ['s', 'a', 'b', 'c', 'd'] as const;
      for (const rating of ratings) {
        const epilogue = getEndingEpilogue(rating);
        expect(epilogue).toBeDefined();
        expect(epilogue).toHaveProperty('title');
        expect(epilogue).toHaveProperty('text');
      }
    });
  });

  describe('STAGE_REWARD_CHOICES', () => {
    test('6種類の報酬選択肢が存在すること', () => {
      expect(STAGE_REWARD_CHOICES).toHaveLength(6);
    });
  });
});

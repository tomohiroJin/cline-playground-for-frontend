/**
 * story-data.ts のユニットテスト
 * ストーリーデータの整合性とマッピング関数を検証
 */
import { STORY_ENTRIES, getStoriesForSprintCount } from '../story-data';
import { CHARACTER_PROFILES } from '../character-profiles';

/** 有効なキャラクターID一覧 */
const VALID_CHARACTER_IDS = CHARACTER_PROFILES.map((c) => c.id);

describe('STORY_ENTRIES', () => {
  it('8スプリント分のストーリーが定義されている', () => {
    expect(STORY_ENTRIES).toHaveLength(8);
  });

  it('スプリント番号が1〜8の連番になっている', () => {
    const sprintNumbers = STORY_ENTRIES.map((e) => e.sprintNumber);
    expect(sprintNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('各ストーリーにタイトルがある', () => {
    for (const entry of STORY_ENTRIES) {
      expect(entry.title).toBeTruthy();
      expect(typeof entry.title).toBe('string');
    }
  });

  it('各ストーリーの語り手が有効なキャラクターIDである', () => {
    for (const entry of STORY_ENTRIES) {
      expect(VALID_CHARACTER_IDS).toContain(entry.narratorId);
    }
  });

  it('各ストーリーに1行以上のテキスト行がある', () => {
    for (const entry of STORY_ENTRIES) {
      expect(entry.lines.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('各テキスト行のspeakerIdが有効なキャラクターIDまたはundefined', () => {
    for (const entry of STORY_ENTRIES) {
      for (const line of entry.lines) {
        if (line.speakerId !== undefined) {
          expect(VALID_CHARACTER_IDS).toContain(line.speakerId);
        }
      }
    }
  });

  it('各テキスト行のテキストが空でない', () => {
    for (const entry of STORY_ENTRIES) {
      for (const line of entry.lines) {
        expect(line.text).toBeTruthy();
        expect(typeof line.text).toBe('string');
      }
    }
  });

  it('各ストーリーに画像キーが設定されている', () => {
    for (const entry of STORY_ENTRIES) {
      expect(entry.imageKey).toBeTruthy();
      expect(typeof entry.imageKey).toBe('string');
    }
  });
});

describe('getStoriesForSprintCount', () => {
  describe('正常系', () => {
    it('1スプリント選択時はSprint 1のストーリーのみ返す', () => {
      const stories = getStoriesForSprintCount(1);
      expect(stories).toHaveLength(1);
      expect(stories[0].sprintNumber).toBe(1);
    });

    it('2スプリント選択時はSprint 1, 8のストーリーを返す', () => {
      const stories = getStoriesForSprintCount(2);
      expect(stories).toHaveLength(2);
      expect(stories.map((s) => s.sprintNumber)).toEqual([1, 8]);
    });

    it('3スプリント選択時はSprint 1, 4, 8のストーリーを返す', () => {
      const stories = getStoriesForSprintCount(3);
      expect(stories).toHaveLength(3);
      expect(stories.map((s) => s.sprintNumber)).toEqual([1, 4, 8]);
    });

    it('5スプリント選択時はSprint 1, 2, 4, 6, 8のストーリーを返す', () => {
      const stories = getStoriesForSprintCount(5);
      expect(stories).toHaveLength(5);
      expect(stories.map((s) => s.sprintNumber)).toEqual([1, 2, 4, 6, 8]);
    });

    it('8スプリント選択時は全8スプリントのストーリーを返す', () => {
      const stories = getStoriesForSprintCount(8);
      expect(stories).toHaveLength(8);
      expect(stories.map((s) => s.sprintNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe('返り値の整合性', () => {
    it('返り値の各要素がSTORY_ENTRIESに存在する', () => {
      for (const count of [1, 2, 3, 5, 8]) {
        const stories = getStoriesForSprintCount(count);
        for (const story of stories) {
          const found = STORY_ENTRIES.find(
            (e) => e.sprintNumber === story.sprintNumber
          );
          expect(found).toBeDefined();
          expect(found).toBe(story);
        }
      }
    });

    it('返り値はスプリント番号の昇順で並んでいる', () => {
      for (const count of [1, 2, 3, 5, 8]) {
        const stories = getStoriesForSprintCount(count);
        for (let i = 1; i < stories.length; i++) {
          expect(stories[i].sprintNumber).toBeGreaterThan(
            stories[i - 1].sprintNumber
          );
        }
      }
    });
  });

  describe('フォールバック動作', () => {
    it('未定義のスプリント数ではSprint 1のストーリーにフォールバックする', () => {
      const stories = getStoriesForSprintCount(4);
      expect(stories).toHaveLength(1);
      expect(stories[0].sprintNumber).toBe(1);
    });

    it('大きな数値でもSprint 1にフォールバックする', () => {
      const stories = getStoriesForSprintCount(10);
      expect(stories).toHaveLength(1);
      expect(stories[0].sprintNumber).toBe(1);
    });
  });

  describe('スプリント番号からストーリー取得', () => {
    it('各スプリント数で、現在のスプリント番号に対応するストーリーが取得できる', () => {
      // 3スプリント選択時: スプリント0→Sprint1, スプリント1→Sprint4, スプリント2→Sprint8
      const stories = getStoriesForSprintCount(3);
      expect(stories[0].sprintNumber).toBe(1);
      expect(stories[1].sprintNumber).toBe(4);
      expect(stories[2].sprintNumber).toBe(8);
    });
  });
});

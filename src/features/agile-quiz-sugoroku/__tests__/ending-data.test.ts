/**
 * ending-data.ts のユニットテスト
 * エンディングストーリーデータの整合性と取得関数を検証
 */
import { getEndingStories, ENDING_COMMON, ENDING_EPILOGUES } from '../ending-data';
import { CHARACTER_PROFILES } from '../character-profiles';
import { TEAM_TYPES } from '../team-classifier';

/** 有効なキャラクターID一覧 */
const VALID_CHARACTER_IDS = CHARACTER_PROFILES.map((c) => c.id);

/** 全チームタイプID */
const ALL_TEAM_TYPE_IDS = TEAM_TYPES.map((t) => t.id);

describe('ENDING_COMMON（共通パート）', () => {
  it('共通パートが存在する', () => {
    expect(ENDING_COMMON).toBeDefined();
    expect(ENDING_COMMON.phase).toBe('common');
  });

  it('タイトルが設定されている', () => {
    expect(ENDING_COMMON.title).toBeTruthy();
    expect(typeof ENDING_COMMON.title).toBe('string');
  });

  it('1行以上のテキスト行がある', () => {
    expect(ENDING_COMMON.lines.length).toBeGreaterThanOrEqual(1);
  });

  it('各テキスト行のspeakerIdが有効なキャラクターIDまたはundefined', () => {
    for (const line of ENDING_COMMON.lines) {
      if (line.speakerId !== undefined) {
        expect(VALID_CHARACTER_IDS).toContain(line.speakerId);
      }
    }
  });

  it('各テキスト行のテキストが空でない', () => {
    for (const line of ENDING_COMMON.lines) {
      expect(line.text).toBeTruthy();
      expect(typeof line.text).toBe('string');
    }
  });

  it('画像キーが設定されている', () => {
    expect(ENDING_COMMON.imageKey).toBeTruthy();
    expect(typeof ENDING_COMMON.imageKey).toBe('string');
  });

  it('teamTypeIdが設定されていない', () => {
    expect(ENDING_COMMON.teamTypeId).toBeUndefined();
  });
});

describe('ENDING_EPILOGUES（チームタイプ別エピローグ）', () => {
  it('全6チームタイプのエピローグが存在する', () => {
    expect(ENDING_EPILOGUES).toHaveLength(6);
  });

  it('全てのチームタイプIDに対応するエピローグがある', () => {
    const epilogueTeamIds = ENDING_EPILOGUES.map((e) => e.teamTypeId);
    for (const teamTypeId of ALL_TEAM_TYPE_IDS) {
      expect(epilogueTeamIds).toContain(teamTypeId);
    }
  });

  it('各エピローグのphaseがepilogueである', () => {
    for (const epilogue of ENDING_EPILOGUES) {
      expect(epilogue.phase).toBe('epilogue');
    }
  });

  it('各エピローグにタイトルが設定されている', () => {
    for (const epilogue of ENDING_EPILOGUES) {
      expect(epilogue.title).toBeTruthy();
      expect(typeof epilogue.title).toBe('string');
    }
  });

  it('各エピローグに1行以上のテキスト行がある', () => {
    for (const epilogue of ENDING_EPILOGUES) {
      expect(epilogue.lines.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('各テキスト行のspeakerIdが有効なキャラクターIDまたはundefined', () => {
    for (const epilogue of ENDING_EPILOGUES) {
      for (const line of epilogue.lines) {
        if (line.speakerId !== undefined) {
          expect(VALID_CHARACTER_IDS).toContain(line.speakerId);
        }
      }
    }
  });

  it('各テキスト行のテキストが空でない', () => {
    for (const epilogue of ENDING_EPILOGUES) {
      for (const line of epilogue.lines) {
        expect(line.text).toBeTruthy();
        expect(typeof line.text).toBe('string');
      }
    }
  });

  it('各エピローグに画像キーが設定されている', () => {
    for (const epilogue of ENDING_EPILOGUES) {
      expect(epilogue.imageKey).toBeTruthy();
      expect(typeof epilogue.imageKey).toBe('string');
    }
  });

  it('各エピローグにteamTypeIdが設定されている', () => {
    for (const epilogue of ENDING_EPILOGUES) {
      expect(epilogue.teamTypeId).toBeTruthy();
      expect(typeof epilogue.teamTypeId).toBe('string');
    }
  });
});

describe('getEndingStories', () => {
  it('共通パート＋指定チームタイプのエピローグを返す', () => {
    const stories = getEndingStories('synergy');
    expect(stories).toHaveLength(2);
    expect(stories[0].phase).toBe('common');
    expect(stories[1].phase).toBe('epilogue');
    expect(stories[1].teamTypeId).toBe('synergy');
  });

  it('全チームタイプで共通パート＋エピローグが取得できる', () => {
    for (const teamTypeId of ALL_TEAM_TYPE_IDS) {
      const stories = getEndingStories(teamTypeId);
      expect(stories).toHaveLength(2);
      expect(stories[0].phase).toBe('common');
      expect(stories[1].phase).toBe('epilogue');
      expect(stories[1].teamTypeId).toBe(teamTypeId);
    }
  });

  it('最初の要素が共通パート（ENDING_COMMON）と同一オブジェクト', () => {
    const stories = getEndingStories('forming');
    expect(stories[0]).toBe(ENDING_COMMON);
  });

  it('存在しないチームタイプIDの場合は共通パートのみ返す', () => {
    const stories = getEndingStories('unknown_type');
    expect(stories).toHaveLength(1);
    expect(stories[0].phase).toBe('common');
  });

  describe('仕様に沿ったエピローグタイトルの確認', () => {
    const EXPECTED_TITLES: Record<string, string> = {
      synergy: '次なる挑戦へ',
      resilient: '嵐の後の虹',
      evolving: '成長の軌跡',
      agile: '風のように',
      struggling: '泥の中から咲く花',
      forming: 'はじまりの一歩',
    };

    for (const [teamTypeId, expectedTitle] of Object.entries(EXPECTED_TITLES)) {
      it(`${teamTypeId} のエピローグタイトルが「${expectedTitle}」である`, () => {
        const stories = getEndingStories(teamTypeId);
        expect(stories[1].title).toBe(expectedTitle);
      });
    }
  });
});

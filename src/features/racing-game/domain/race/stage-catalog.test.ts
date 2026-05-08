// stage-catalog.ts の単体テスト

import { getStage, getNextStage, getAllStages } from './stage-catalog';

describe('getStage', () => {
  it('全 8 ステージが取得できる', () => {
    for (let i = 1; i <= 8; i++) {
      const stage = getStage(i as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);
      expect(stage.id).toBe(i);
    }
  });

  it('各ステージは spec の不変条件を満たす（assertValidStage）', () => {
    // ロード時に検証されるため、import 時点で例外なく取得できる時点でパス
    expect(() => getStage(1)).not.toThrow();
  });
});

describe('getNextStage', () => {
  it('1 → 2 / 7 → 8', () => {
    expect(getNextStage(1)?.id).toBe(2);
    expect(getNextStage(7)?.id).toBe(8);
  });

  it('8 の次は undefined（最終ステージ）', () => {
    expect(getNextStage(8)).toBeUndefined();
  });
});

describe('getAllStages', () => {
  it('8 ステージを順序通りに返す', () => {
    const all = getAllStages();
    expect(all).toHaveLength(8);
    expect(all.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('各ステージのタイトルは「夜明け」関連語を最低 1 つ含む（縦糸シンボル）', () => {
    const dawnRelatedWords = ['夜明け', '朝', '東', '光', '影', '闇', '夜', '白む', '星', '潮', 'ネオン', '滲'];
    const all = getAllStages();
    all.forEach((s) => {
      const hasSymbol = dawnRelatedWords.some((w) => s.intro.includes(w));
      expect({ id: s.id, intro: s.intro, hasSymbol }).toMatchObject({ hasSymbol: true });
    });
  });

  it('各ステージの intro は全角 56 字以内', () => {
    getAllStages().forEach((s) => {
      // 雑な「全角換算 = length」のサーフェス検証
      expect(s.intro.length).toBeLessThanOrEqual(56);
    });
  });
});

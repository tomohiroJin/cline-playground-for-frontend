import { isThemeUnlocked } from './score-utils';
import { UnlockCondition, ThemeId, PuzzleRecord } from '../types/puzzle';

describe('isThemeUnlocked', () => {
  const makeRecord = (imageId: string, clearCount: number): PuzzleRecord => ({
    imageId,
    division: 4,
    bestScore: 5000,
    bestRank: '★★☆',
    bestTime: 60,
    bestMoves: 30,
    clearCount,
    lastClearDate: '2026-01-01T00:00:00Z',
  });

  it('always条件は常にtrueを返すこと', () => {
    const condition: UnlockCondition = { type: 'always' };
    expect(isThemeUnlocked(condition, 0, [])).toBe(true);
  });

  it('clearCount条件で回数未達はfalseを返すこと', () => {
    const condition: UnlockCondition = { type: 'clearCount', count: 5 };
    expect(isThemeUnlocked(condition, 3, [])).toBe(false);
  });

  it('clearCount条件で回数達成はtrueを返すこと', () => {
    const condition: UnlockCondition = { type: 'clearCount', count: 5 };
    expect(isThemeUnlocked(condition, 5, [])).toBe(true);
  });

  it('themesClear条件で全テーマクリア済みはtrueを返すこと', () => {
    const condition: UnlockCondition = {
      type: 'themesClear',
      themeIds: ['illustration-gallery', 'world-scenery'] as ThemeId[],
    };
    const themeImageIds = new Map<ThemeId, string[]>([
      ['illustration-gallery', ['img1']],
      ['world-scenery', ['img2']],
    ]);
    const records = [makeRecord('img1', 1), makeRecord('img2', 1)];
    expect(isThemeUnlocked(condition, 0, records, themeImageIds)).toBe(true);
  });

  it('themesClear条件で未クリアテーマがある場合はfalseを返すこと', () => {
    const condition: UnlockCondition = {
      type: 'themesClear',
      themeIds: ['illustration-gallery', 'world-scenery'] as ThemeId[],
    };
    const themeImageIds = new Map<ThemeId, string[]>([
      ['illustration-gallery', ['img1']],
      ['world-scenery', ['img2']],
    ]);
    const records = [makeRecord('img1', 1)];
    expect(isThemeUnlocked(condition, 0, records, themeImageIds)).toBe(false);
  });

  it('themeImageIdsがない場合はfalseを返すこと', () => {
    const condition: UnlockCondition = {
      type: 'themesClear',
      themeIds: ['illustration-gallery'] as ThemeId[],
    };
    expect(isThemeUnlocked(condition, 0, [])).toBe(false);
  });
});

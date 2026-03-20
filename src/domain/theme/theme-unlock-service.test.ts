import { isThemeUnlocked, UnlockContext } from './theme-unlock-service';
import { UnlockCondition, ThemeId } from '../../types/puzzle';

describe('ThemeUnlockService', () => {
  const createContext = (overrides?: Partial<UnlockContext>): UnlockContext => ({
    totalClears: 0,
    records: [],
    themeImageIds: new Map(),
    ...overrides,
  });

  describe('always 条件', () => {
    it('常にtrueを返す', () => {
      const condition: UnlockCondition = { type: 'always' };
      expect(isThemeUnlocked(condition, createContext())).toBe(true);
    });
  });

  describe('clearCount 条件', () => {
    it('クリア数が条件を満たす場合trueを返す', () => {
      const condition: UnlockCondition = { type: 'clearCount', count: 5 };
      expect(isThemeUnlocked(condition, createContext({ totalClears: 5 }))).toBe(true);
    });

    it('クリア数が条件を超える場合もtrueを返す', () => {
      const condition: UnlockCondition = { type: 'clearCount', count: 5 };
      expect(isThemeUnlocked(condition, createContext({ totalClears: 10 }))).toBe(true);
    });

    it('クリア数が不足する場合falseを返す', () => {
      const condition: UnlockCondition = { type: 'clearCount', count: 5 };
      expect(isThemeUnlocked(condition, createContext({ totalClears: 4 }))).toBe(false);
    });
  });

  describe('themesClear 条件', () => {
    const themeImageIds = new Map<ThemeId, string[]>([
      ['illustration-gallery', ['img1', 'img2']],
      ['world-scenery', ['img3']],
    ]);

    it('指定テーマのいずれかの画像がクリア済みならtrueを返す', () => {
      const condition: UnlockCondition = {
        type: 'themesClear',
        themeIds: ['illustration-gallery' as ThemeId],
      };
      const context = createContext({
        themeImageIds,
        records: [
          {
            imageId: 'img1',
            division: 4,
            bestScore: 8000,
            bestRank: '★★★',
            bestTime: 30,
            bestMoves: 10,
            clearCount: 1,
            lastClearDate: '2026-03-20',
          },
        ],
      });
      expect(isThemeUnlocked(condition, context)).toBe(true);
    });

    it('指定テーマの画像がクリアされていない場合falseを返す', () => {
      const condition: UnlockCondition = {
        type: 'themesClear',
        themeIds: ['illustration-gallery' as ThemeId],
      };
      expect(isThemeUnlocked(condition, createContext({ themeImageIds }))).toBe(false);
    });

    it('themeImageIdsが空の場合falseを返す', () => {
      const condition: UnlockCondition = {
        type: 'themesClear',
        themeIds: ['illustration-gallery' as ThemeId],
      };
      expect(isThemeUnlocked(condition, createContext())).toBe(false);
    });

    it('複数テーマの全てがクリアされている場合trueを返す', () => {
      const themeImageIds = new Map<ThemeId, string[]>([
        ['illustration-gallery', ['img1']],
        ['world-scenery', ['img3']],
      ]);
      const condition: UnlockCondition = {
        type: 'themesClear',
        themeIds: ['illustration-gallery' as ThemeId, 'world-scenery' as ThemeId],
      };
      const context = createContext({
        themeImageIds,
        records: [
          { imageId: 'img1', division: 4, bestScore: 8000, bestRank: '★★★', bestTime: 30, bestMoves: 10, clearCount: 1, lastClearDate: '2026-03-20' },
          { imageId: 'img3', division: 4, bestScore: 5000, bestRank: '★★☆', bestTime: 60, bestMoves: 20, clearCount: 1, lastClearDate: '2026-03-20' },
        ],
      });
      expect(isThemeUnlocked(condition, context)).toBe(true);
    });

    it('複数テーマのうち一つがクリアされていない場合falseを返す', () => {
      const themeImageIds = new Map<ThemeId, string[]>([
        ['illustration-gallery', ['img1']],
        ['world-scenery', ['img3']],
      ]);
      const condition: UnlockCondition = {
        type: 'themesClear',
        themeIds: ['illustration-gallery' as ThemeId, 'world-scenery' as ThemeId],
      };
      const context = createContext({
        themeImageIds,
        records: [
          { imageId: 'img1', division: 4, bestScore: 8000, bestRank: '★★★', bestTime: 30, bestMoves: 10, clearCount: 1, lastClearDate: '2026-03-20' },
        ],
      });
      expect(isThemeUnlocked(condition, context)).toBe(false);
    });
  });
});

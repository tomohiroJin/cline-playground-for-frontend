import { selectDailyPuzzle, DAILY_DIVISIONS } from './select-daily-puzzle';
import { Theme } from '../../types/puzzle';

const themes: Theme[] = [
  {
    id: 'illustration-gallery',
    name: 'イラストギャラリー',
    description: 'd',
    unlockCondition: { type: 'always' },
    images: [
      { id: 'img_a', filename: 'a.webp', alt: 'A', themeId: 'illustration-gallery', hasVideo: false },
      { id: 'img_b', filename: 'b.webp', alt: 'B', themeId: 'illustration-gallery', hasVideo: false },
    ],
  },
  {
    id: 'mystery',
    name: 'ミステリー',
    description: 'd',
    unlockCondition: { type: 'themesClear', themeIds: [] },
    images: [
      { id: 'img_c', filename: 'c.webp', alt: 'C', themeId: 'mystery', hasVideo: false },
    ],
  },
];

describe('selectDailyPuzzle', () => {
  it('同一シードは同一の出題（作品・難易度）を返す', () => {
    const a = selectDailyPuzzle(themes, 20260709);
    const b = selectDailyPuzzle(themes, 20260709);
    expect(a).toEqual(b);
  });

  it('難易度は DAILY_DIVISIONS のいずれか', () => {
    const daily = selectDailyPuzzle(themes, 20260709);
    expect(DAILY_DIVISIONS).toContain(daily.division);
  });

  it('未開館テーマ(mystery)の作品も選ばれ得る（全画像が対象）', () => {
    // seed % 3 === 2 で3枚目(img_c, mystery)が選ばれるシードを探す
    const seed = [0, 1, 2].map(n => n).find(n => n % 3 === 2) ?? 2;
    const daily = selectDailyPuzzle(themes, seed);
    // 全画像フラット [img_a, img_b, img_c] の index 2
    expect(daily.imageId).toBe('img_c');
    expect(daily.filename).toBe('c.webp');
  });
});

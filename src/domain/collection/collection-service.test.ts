import { aggregateByArtwork, compareRank } from './collection-service';
import { PuzzleImage, PuzzleRecord } from '../../types/puzzle';

const image: PuzzleImage = {
  id: 'moonlight_dancer',
  filename: 'moonlight_dancer.webp',
  alt: '月明かりのダンサー',
  themeId: 'illustration-gallery',
  hasVideo: true,
};

const rec = (over: Partial<PuzzleRecord>): PuzzleRecord => ({
  imageId: 'moonlight_dancer',
  division: 4,
  bestScore: 1000,
  bestRank: 'クリア',
  bestTime: 100,
  bestMoves: 50,
  clearCount: 1,
  lastClearDate: '2026-07-01T00:00:00.000Z',
  ...over,
});

describe('compareRank', () => {
  it('★★★ は クリア より上位', () => {
    expect(compareRank('★★★', 'クリア')).toBeGreaterThan(0);
  });
  it('同ランクは 0', () => {
    expect(compareRank('★☆☆', '★☆☆')).toBe(0);
  });
});

describe('aggregateByArtwork', () => {
  it('レコードなしは未収蔵として畳む', () => {
    const result = aggregateByArtwork(image, []);
    expect(result.isCollected).toBe(false);
    expect(result.clearCount).toBe(0);
    expect(result.bestRank).toBeUndefined();
    expect(result.title).toBe('月明かりのダンサー');
    expect(result.filename).toBe('moonlight_dancer.webp');
  });

  it('複数難易度のレコードを最良値へ集約する', () => {
    const records = [
      rec({ division: 3, bestScore: 2000, bestRank: '★☆☆', bestTime: 120, bestMoves: 60, clearCount: 2, lastClearDate: '2026-07-01T00:00:00.000Z' }),
      rec({ division: 5, bestScore: 5000, bestRank: '★★★', bestTime: 80, bestMoves: 40, clearCount: 3, lastClearDate: '2026-07-05T00:00:00.000Z' }),
    ];
    const result = aggregateByArtwork(image, records);
    expect(result.isCollected).toBe(true);
    expect(result.bestScore).toBe(5000);
    expect(result.bestRank).toBe('★★★');
    expect(result.bestTime).toBe(80);
    expect(result.bestMoves).toBe(40);
    expect(result.clearCount).toBe(5);
    expect(result.lastClearDate).toBe('2026-07-05T00:00:00.000Z');
  });

  it('bestMoves が全て null なら undefined', () => {
    const result = aggregateByArtwork(image, [rec({ bestMoves: null })]);
    expect(result.bestMoves).toBeUndefined();
  });

  it('別 imageId のレコードは無視する', () => {
    const other = rec({ imageId: 'other_image', clearCount: 9 });
    const result = aggregateByArtwork(image, [other]);
    expect(result.isCollected).toBe(false);
    expect(result.clearCount).toBe(0);
  });
});

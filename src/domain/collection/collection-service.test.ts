import { aggregateByArtwork, compareRank, buildRoomCollections, buildCollectionSummary } from './collection-service';
import { PuzzleImage, PuzzleRecord, Theme } from '../../types/puzzle';

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

const twoRoomThemes: Theme[] = [
  {
    id: 'illustration-gallery',
    name: 'イラストギャラリー',
    description: 'desc-a',
    unlockCondition: { type: 'always' },
    images: [
      { id: 'img_a1', filename: 'a1.webp', alt: 'A1', themeId: 'illustration-gallery', hasVideo: false },
      { id: 'img_a2', filename: 'a2.webp', alt: 'A2', themeId: 'illustration-gallery', hasVideo: false },
    ],
  },
  {
    id: 'sea-and-sky',
    name: '海と空',
    description: 'desc-b',
    unlockCondition: { type: 'clearCount', count: 5 },
    images: [
      { id: 'img_b1', filename: 'b1.webp', alt: 'B1', themeId: 'sea-and-sky', hasVideo: false },
    ],
  },
];

const clearedRecord = (imageId: string): PuzzleRecord => ({
  imageId,
  division: 4,
  bestScore: 3000,
  bestRank: '★★☆',
  bestTime: 90,
  bestMoves: 30,
  clearCount: 1,
  lastClearDate: '2026-07-06T00:00:00.000Z',
});

describe('buildRoomCollections', () => {
  it('開館室は収蔵率を、未開館室は解放条件文言を返す', () => {
    const rooms = buildRoomCollections(twoRoomThemes, [clearedRecord('img_a1')], 1);
    const roomA = rooms.find(r => r.themeId === 'illustration-gallery')!;
    const roomB = rooms.find(r => r.themeId === 'sea-and-sky')!;

    expect(roomA.isUnlocked).toBe(true);
    expect(roomA.unlockHint).toBeUndefined();
    expect(roomA.collectedCount).toBe(1);
    expect(roomA.totalCount).toBe(2);
    expect(roomA.artworks[0].isCollected).toBe(true);
    expect(roomA.artworks[1].isCollected).toBe(false);

    expect(roomB.isUnlocked).toBe(false);
    expect(roomB.unlockHint).toContain('5');
  });
});

describe('evaluateCuratorGoal / buildCollectionSummary', () => {
  it('全作品★★★で名誉学芸員を達成する', () => {
    const summary = buildCollectionSummary(
      twoRoomThemes,
      [
        { ...clearedRecord('img_a1'), bestRank: '★★★' },
        { ...clearedRecord('img_a2'), bestRank: '★★★' },
        { ...clearedRecord('img_b1'), bestRank: '★★★' },
      ],
      5
    );
    expect(summary.goal.total).toBe(3);
    expect(summary.goal.collected).toBe(3);
    expect(summary.goal.appraised3star).toBe(3);
    expect(summary.goal.isHonorary).toBe(true);
    expect(summary.rooms).toHaveLength(2);
  });

  it('一部のみ収蔵なら名誉学芸員は未達', () => {
    const summary = buildCollectionSummary(twoRoomThemes, [clearedRecord('img_a1')], 1);
    expect(summary.goal.collected).toBe(1);
    expect(summary.goal.appraised3star).toBe(0);
    expect(summary.goal.isHonorary).toBe(false);
  });
});

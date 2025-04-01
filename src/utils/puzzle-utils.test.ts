import * as puzzleUtils from './puzzle-utils';
import { PuzzlePiece } from '../store/atoms';

const {
  getImageSize,
  generatePuzzlePieces,
  shufflePuzzlePieces,
  isPuzzleCompleted,
  formatElapsedTime,
  checkFileSize: checkImageFileSize,
} = puzzleUtils;

// モックの作成
class MockImage {
  onload: () => void = () => {};
  onerror: () => void = () => {};
  src: string = '';
  width: number = 0;
  height: number = 0;

  constructor() {
    setTimeout(() => {
      this.width = 100;
      this.height = 200;
      this.onload();
    }, 0);
  }
}

// @ts-ignore - HTMLImageElementとの互換性エラーを無視
global.Image = MockImage as any;

describe('puzzle-utils', () => {
  describe('getImageSize', () => {
    it('画像のサイズを正しく取得できること', async () => {
      const size = await getImageSize('dummy-url.jpg');
      expect(size).toEqual({ width: 100, height: 200 });
    });

    it('画像の読み込みに失敗した場合はエラーをスローすること', async () => {
      // モックをオーバーライド
      const originalImage = global.Image;

      class ErrorMockImage {
        onload: () => void = () => {};
        onerror: () => void = () => {};
        src: string = '';

        constructor() {
          setTimeout(() => {
            this.onerror();
          }, 0);
        }
      }

      // @ts-ignore - HTMLImageElementとの互換性エラーを無視
      global.Image = ErrorMockImage as any;

      await expect(getImageSize('invalid-url.jpg')).rejects.toThrow('画像の読み込みに失敗しました');

      // モックを元に戻す
      global.Image = originalImage;
    });
  });

  describe('generatePuzzlePieces', () => {
    it('指定された分割数に応じたパズルピースを生成すること', () => {
      const result = generatePuzzlePieces(3);
      const pieces = result.pieces;

      // 3x3=9ピースが生成されること
      expect(pieces.length).toBe(9);

      // 各ピースが正しい位置情報を持っていること
      expect(pieces[0]).toEqual({
        id: 0,
        correctPosition: { row: 0, col: 0 },
        currentPosition: { row: 0, col: 0 },
        isEmpty: false,
      });

      expect(pieces[4]).toEqual({
        id: 4,
        correctPosition: { row: 1, col: 1 },
        currentPosition: { row: 1, col: 1 },
        isEmpty: false,
      });

      // 右下のピースが空白であること
      expect(pieces[8]).toEqual({
        id: 8,
        correctPosition: { row: 2, col: 2 },
        currentPosition: { row: 2, col: 2 },
        isEmpty: true,
      });

      // 空白ピースの位置が正しいこと
      expect(result.emptyPosition).toEqual({ row: 2, col: 2 });
    });
  });

  describe('shufflePuzzlePieces', () => {
    const createTestPieces = (): PuzzlePiece[] => [
      {
        id: 0,
        correctPosition: { row: 0, col: 0 },
        currentPosition: { row: 0, col: 0 },
        isEmpty: false,
      },
      {
        id: 1,
        correctPosition: { row: 0, col: 1 },
        currentPosition: { row: 0, col: 1 },
        isEmpty: false,
      },
      {
        id: 2,
        correctPosition: { row: 0, col: 2 },
        currentPosition: { row: 0, col: 2 },
        isEmpty: true,
      },
    ];

    it('パズルピースの位置をシャッフルすること', () => {
      // テスト用のピースを作成
      const pieces = createTestPieces();

      const emptyPosition = { row: 0, col: 2 };
      const division = 3;
      const result = shufflePuzzlePieces(pieces, emptyPosition, division, 1);

      // 元の配列が変更されていないこと
      expect(pieces[0].currentPosition).toEqual({ row: 0, col: 0 });

      // シャッフル後も全てのピースが存在すること
      expect(result.pieces.length).toBe(pieces.length);
    });

    it('シャッフル時に空白ピースの位置情報が正しく更新されること', () => {
      // テスト用のピースを作成
      const pieces = createTestPieces();

      const emptyPosition = { row: 0, col: 2 };
      const division = 3;

      // シャッフルの回数を1回に制限し、動作を予測可能にする
      // getAdjacentPositionsのモックを作成して、隣接位置を固定
      const getAdjacentPositionsSpy = jest
        .spyOn(puzzleUtils, 'getAdjacentPositions')
        .mockReturnValue([{ row: 0, col: 1 }]);

      const result = shufflePuzzlePieces(pieces, emptyPosition, division, 1);

      // モックをリストア
      getAdjacentPositionsSpy.mockRestore();

      // 空白ピースの位置情報が更新されていること
      const emptyPiece = result.pieces.find(p => p.isEmpty);
      expect(emptyPiece).toBeDefined();
      expect(emptyPiece?.currentPosition).toEqual({ row: 0, col: 1 });

      // emptyPositionも更新されていること
      expect(result.emptyPosition).toEqual({ row: 0, col: 1 });

      // 移動したピースの位置情報も更新されていること
      const movedPiece = result.pieces.find(p => p.id === 1);
      expect(movedPiece).toBeDefined();
      expect(movedPiece?.currentPosition).toEqual({ row: 0, col: 2 });
    });

    it('シャッフル回数が0の場合、ピースの位置が変更されないこと', () => {
      const pieces = createTestPieces();
      const emptyPosition = { row: 0, col: 2 };
      const division = 3;

      const result = shufflePuzzlePieces(pieces, emptyPosition, division, 0);

      expect(result.pieces).toEqual(pieces);
      expect(result.emptyPosition).toEqual(emptyPosition);
    });

    it('隣接位置が1つしかない場合でも正しく動作すること', () => {
      const pieces = [
        {
          id: 0,
          correctPosition: { row: 0, col: 0 },
          currentPosition: { row: 0, col: 0 },
          isEmpty: true,
        },
        {
          id: 1,
          correctPosition: { row: 0, col: 1 },
          currentPosition: { row: 0, col: 1 },
          isEmpty: false,
        },
      ];

      const emptyPosition = { row: 0, col: 0 }; // 左上隅
      const division = 2;

      const result = shufflePuzzlePieces(pieces, emptyPosition, division, 1);

      expect(result.emptyPosition).not.toEqual(emptyPosition);
    });
  });

  describe('isPuzzleCompleted', () => {
    it('全てのピースが正しい位置にある場合はtrueを返すこと', () => {
      const pieces: PuzzlePiece[] = [
        {
          id: 0,
          correctPosition: { row: 0, col: 0 },
          currentPosition: { row: 0, col: 0 },
          isEmpty: false,
        },
        {
          id: 1,
          correctPosition: { row: 0, col: 1 },
          currentPosition: { row: 0, col: 1 },
          isEmpty: false,
        },
      ];

      expect(isPuzzleCompleted(pieces)).toBe(true);
    });

    it('一部のピースが正しくない位置にある場合はfalseを返すこと', () => {
      const pieces: PuzzlePiece[] = [
        {
          id: 0,
          correctPosition: { row: 0, col: 0 },
          currentPosition: { row: 0, col: 0 },
          isEmpty: false,
        },
        {
          id: 1,
          correctPosition: { row: 0, col: 1 },
          currentPosition: { row: 1, col: 0 }, // 正しくない位置
          isEmpty: false,
        },
      ];

      expect(isPuzzleCompleted(pieces)).toBe(false);
    });

    it('空きピースが正しくない位置にあっても、他のピースが全て正しい位置にある場合はtrueを返すこと', () => {
      const pieces: PuzzlePiece[] = [
        {
          id: 0,
          correctPosition: { row: 0, col: 0 },
          currentPosition: { row: 0, col: 0 },
          isEmpty: false,
        },
        {
          id: 1,
          correctPosition: { row: 0, col: 1 },
          currentPosition: { row: 0, col: 1 },
          isEmpty: false,
        },
        {
          id: 2,
          correctPosition: { row: 0, col: 2 },
          currentPosition: { row: 1, col: 2 }, // 正しくない位置
          isEmpty: true, // 空きピース
        },
      ];

      expect(isPuzzleCompleted(pieces)).toBe(true);
    });

    it('空きピースが正しい位置にあっても、他のピースが正しくない位置にある場合はfalseを返すこと', () => {
      const pieces: PuzzlePiece[] = [
        {
          id: 0,
          correctPosition: { row: 0, col: 0 },
          currentPosition: { row: 1, col: 0 }, // 正しくない位置
          isEmpty: false,
        },
        {
          id: 1,
          correctPosition: { row: 0, col: 1 },
          currentPosition: { row: 0, col: 1 },
          isEmpty: false,
        },
        {
          id: 2,
          correctPosition: { row: 0, col: 2 },
          currentPosition: { row: 0, col: 2 }, // 正しい位置
          isEmpty: true, // 空きピース
        },
      ];

      expect(isPuzzleCompleted(pieces)).toBe(false);
    });
  });

  describe('formatElapsedTime', () => {
    test.each([
      [0, '00:00'],
      [59, '00:59'],
      [60, '01:00'],
      [65, '01:05'],
      [3599, '59:59'],
      [3600, '60:00'],
    ])('経過時間が %i の場合は %s が表示されること', (seconds, expected) => {
      expect(formatElapsedTime(seconds)).toBe(expected);
    });
  });

  describe('checkImageFileSize', () => {
    it('ファイルサイズが制限内の場合はtrueを返すこと', () => {
      const file = new File(['dummy content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB

      expect(checkImageFileSize(file, 10)).toBe(true);
    });

    it('ファイルサイズが制限を超える場合はfalseを返すこと', () => {
      const file = new File(['dummy content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }); // 15MB

      expect(checkImageFileSize(file, 10)).toBe(false);
    });
  });

  describe('getAdjacentPositions', () => {
    it('指定された位置の隣接位置を正しく取得できること（中央の場合）', () => {
      const row = 1;
      const col = 1;
      const division = 3;

      const result = puzzleUtils.getAdjacentPositions(row, col, division);

      expect(result).toEqual([
        { row: 0, col: 1 }, // 上
        { row: 2, col: 1 }, // 下
        { row: 1, col: 0 }, // 左
        { row: 1, col: 2 }, // 右
      ]);
    });

    it('指定された位置の隣接位置を正しく取得できること（左上の場合）', () => {
      const row = 0;
      const col = 0;
      const division = 3;

      const result = puzzleUtils.getAdjacentPositions(row, col, division);

      expect(result).toEqual([
        { row: 1, col: 0 }, // 下
        { row: 0, col: 1 }, // 右
      ]);
    });

    it('指定された位置の隣接位置を正しく取得できること（右下の場合）', () => {
      const row = 2;
      const col = 2;
      const division = 3;

      const result = puzzleUtils.getAdjacentPositions(row, col, division);

      expect(result).toEqual([
        { row: 1, col: 2 }, // 上
        { row: 2, col: 1 }, // 左
      ]);
    });

    it('指定された位置の隣接位置を正しく取得できること（境界線上の場合）', () => {
      const row = 0;
      const col = 1;
      const division = 3;

      const result = puzzleUtils.getAdjacentPositions(row, col, division);

      expect(result).toEqual([
        { row: 1, col: 1 }, // 下
        { row: 0, col: 0 }, // 左
        { row: 0, col: 2 }, // 右
      ]);
    });
  });
});

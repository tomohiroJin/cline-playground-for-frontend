import {
  getImageSize,
  generatePuzzlePieces,
  shufflePuzzlePieces,
  isPuzzleCompleted,
  formatElapsedTime,
  checkImageFileSize,
} from "./puzzle-utils";
import { PuzzlePiece } from "../store/atoms";

// モックの作成
class MockImage {
  onload: () => void = () => {};
  onerror: () => void = () => {};
  src: string = "";
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

describe("puzzle-utils", () => {
  describe("getImageSize", () => {
    it("画像のサイズを正しく取得できること", async () => {
      const size = await getImageSize("dummy-url.jpg");
      expect(size).toEqual({ width: 100, height: 200 });
    });

    it("画像の読み込みに失敗した場合はエラーをスローすること", async () => {
      // モックをオーバーライド
      const originalImage = global.Image;

      class ErrorMockImage {
        onload: () => void = () => {};
        onerror: () => void = () => {};
        src: string = "";

        constructor() {
          setTimeout(() => {
            this.onerror();
          }, 0);
        }
      }

      // @ts-ignore - HTMLImageElementとの互換性エラーを無視
      global.Image = ErrorMockImage as any;

      await expect(getImageSize("invalid-url.jpg")).rejects.toThrow(
        "画像の読み込みに失敗しました"
      );

      // モックを元に戻す
      global.Image = originalImage;
    });
  });

  describe("generatePuzzlePieces", () => {
    it("指定された分割数に応じたパズルピースを生成すること", () => {
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

  describe("shufflePuzzlePieces", () => {
    it("パズルピースの位置をシャッフルすること", () => {
      // 乱数生成をモック化して結果を予測可能にする
      const originalRandom = Math.random;
      Math.random = jest
        .fn()
        .mockReturnValueOnce(0.5) // 最初の呼び出しで0.5を返す
        .mockReturnValueOnce(0.1) // 2回目の呼び出しで0.1を返す
        .mockReturnValueOnce(0.9); // 3回目の呼び出しで0.9を返す

      // テスト用のピースを作成
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
          currentPosition: { row: 0, col: 2 },
          isEmpty: true,
        },
      ];

      const emptyPosition = { row: 0, col: 2 };
      const division = 3;
      const result = shufflePuzzlePieces(pieces, emptyPosition, division);

      // 元の配列が変更されていないこと
      expect(pieces[0].currentPosition).toEqual({ row: 0, col: 0 });

      // シャッフル後の配列が元の配列と異なること
      expect(result.pieces).not.toEqual(pieces);

      // シャッフル後も全てのピースが存在すること
      expect(result.pieces.length).toBe(pieces.length);

      // モックを元に戻す
      Math.random = originalRandom;
    });
  });

  describe("isPuzzleCompleted", () => {
    it("全てのピースが正しい位置にある場合はtrueを返すこと", () => {
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

    it("一部のピースが正しくない位置にある場合はfalseを返すこと", () => {
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
  });

  describe("formatElapsedTime", () => {
    it("経過時間を正しくフォーマットすること", () => {
      expect(formatElapsedTime(0)).toBe("00:00");
      expect(formatElapsedTime(59)).toBe("00:59");
      expect(formatElapsedTime(60)).toBe("01:00");
      expect(formatElapsedTime(65)).toBe("01:05");
      expect(formatElapsedTime(3599)).toBe("59:59");
      expect(formatElapsedTime(3600)).toBe("60:00");
    });
  });

  describe("checkImageFileSize", () => {
    it("ファイルサイズが制限内の場合はtrueを返すこと", () => {
      const file = new File(["dummy content"], "test.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 }); // 5MB

      expect(checkImageFileSize(file, 10)).toBe(true);
    });

    it("ファイルサイズが制限を超える場合はfalseを返すこと", () => {
      const file = new File(["dummy content"], "test.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(file, "size", { value: 15 * 1024 * 1024 }); // 15MB

      expect(checkImageFileSize(file, 10)).toBe(false);
    });
  });
});

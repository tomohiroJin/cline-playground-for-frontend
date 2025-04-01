import { PuzzlePiece } from '../store/atoms';

type Position = { row: number; col: number };

/**
 * 空白ピースの位置を更新する
 *
 * @param pieces パズルのピース配列
 * @param newEmptyPosition 新しい空白ピースの位置
 * @returns 更新されたピース配列
 */
const updateEmptyPiecePosition = (
  pieces: PuzzlePiece[],
  newEmptyPosition: Position
): PuzzlePiece[] => {
  const updatedPieces = [...pieces];
  const emptyPieceIndex = updatedPieces.findIndex(p => p.isEmpty);

  if (emptyPieceIndex !== -1) {
    updatedPieces[emptyPieceIndex] = {
      ...updatedPieces[emptyPieceIndex],
      currentPosition: { ...newEmptyPosition },
    };
  }

  return updatedPieces;
};

/**
 * 画像をロードしてサイズを取得する
 *
 * @param url 画像のURL
 * @returns 画像のサイズ（幅と高さ）を含むPromise
 */
export const getImageSize = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('画像の読み込みに失敗しました'));
    };
    img.src = url;
  });
};

/**
 * パズルのピースを生成する（スライドパズル方式）
 *
 * @param division 分割数（例：4なら4x4=16ピース）
 * @returns パズルのピース配列と空白ピースの位置
 */
export const generatePuzzlePieces = (
  division: number
): { pieces: PuzzlePiece[]; emptyPosition: Position } => {
  if (division <= 0) {
    throw new Error('division must be greater than 0');
  }

  const pieces: PuzzlePiece[] = [];

  // 右下を空白にする
  const emptyRow = division - 1;
  const emptyCol = division - 1;

  // 全てのピースを生成
  for (let row = 0; row < division; row++) {
    for (let col = 0; col < division; col++) {
      // 右下は空白ピース
      const isEmpty = row === emptyRow && col === emptyCol;
      const id = row * division + col;

      pieces.push({
        id,
        correctPosition: { row, col },
        currentPosition: { row, col }, // 初期状態では正しい位置
        isEmpty,
      });
    }
  }

  return {
    pieces,
    emptyPosition: { row: emptyRow, col: emptyCol },
  };
};

/**
 * パズルのピースをシャッフルする（スライドパズル方式）
 *
 * @param pieces パズルのピース配列
 * @param emptyPosition 空白ピースの位置
 * @param division 分割数
 * @param moves シャッフルの移動回数
 * @returns シャッフルされたパズルのピース配列と新しい空白ピースの位置
 */
export const shufflePuzzlePieces = (
  pieces: PuzzlePiece[],
  emptyPosition: Position,
  division: number,
  moves: number = 100
): { pieces: PuzzlePiece[]; emptyPosition: Position } => {
  if (division <= 0) {
    throw new Error('division must be greater than 0');
  }
  if (pieces.length === 0) {
    throw new Error('pieces array must not be empty');
  }

  let shuffledPieces = [...pieces];
  let currentEmptyPos = { ...emptyPosition };

  for (let i = 0; i < moves; i++) {
    const adjacentPositions = getAdjacentPositions(
      currentEmptyPos.row,
      currentEmptyPos.col,
      division
    );

    // ピースのインデックスをキャッシュ
    const pieceIndexMap = new Map(
      shuffledPieces.map((piece, index) => [
        `${piece.currentPosition.row},${piece.currentPosition.col}`,
        index,
      ])
    );

    let moved = false;
    while (!moved) {
      const randomIndex = Math.floor(Math.random() * adjacentPositions.length);
      const selectedPos = adjacentPositions[randomIndex];

      const selectedPieceIndex = pieceIndexMap.get(`${selectedPos.row},${selectedPos.col}`);

      if (selectedPieceIndex !== undefined) {
        shuffledPieces[selectedPieceIndex].currentPosition = { ...currentEmptyPos };
        shuffledPieces = updateEmptyPiecePosition(shuffledPieces, selectedPos);
        currentEmptyPos = { ...selectedPos };
        moved = true; // 移動が発生した場合にループを終了
      }
    }
  }

  return {
    pieces: shuffledPieces,
    emptyPosition: currentEmptyPos,
  };
};

/**
 * 指定された位置の隣接位置を取得する
 *
 * @param row 行
 * @param col 列
 * @param division 分割数
 * @returns 隣接位置の配列
 */
export const getAdjacentPositions = (row: number, col: number, division: number): Position[] => {
  const directions: Position[] = [
    { row: -1, col: 0 }, // 上
    { row: 1, col: 0 }, // 下
    { row: 0, col: -1 }, // 左
    { row: 0, col: 1 }, // 右
  ];

  return directions
    .map(({ row: rowOffset, col: colOffset }) => ({
      row: row + rowOffset,
      col: col + colOffset,
    }))
    .filter(({ row, col }) => row >= 0 && row < division && col >= 0 && col < division);
};

/**
 * パズルが完成したかどうかをチェックする
 *
 * @param pieces パズルのピース配列
 * @returns 完成していればtrue、そうでなければfalse
 */
export const isPuzzleCompleted = (pieces: PuzzlePiece[]): boolean => {
  // 空きピース以外のすべてのピースが正しい位置にあるかをチェック
  return pieces.every(
    piece =>
      piece.isEmpty || // 空きピースは位置をチェックしない
      (piece.correctPosition.row === piece.currentPosition.row &&
        piece.correctPosition.col === piece.currentPosition.col)
  );
};

/**
 * 経過時間をフォーマットする（mm:ss形式）
 *
 * @param seconds 経過秒数
 * @returns フォーマットされた時間文字列
 */
export const formatElapsedTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * ファイルのサイズをチェックする
 *
 * @param file ファイル
 * @param maxSizeInMB 最大サイズ（MB）
 * @returns サイズが制限内ならtrue、そうでなければfalse
 */
export const checkFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

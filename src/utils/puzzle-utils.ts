import { PuzzlePiece } from '../store/atoms';

/**
 * 画像をロードしてサイズを取得する
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
 * @param division 分割数（例：4なら4x4=16ピース）
 * @returns パズルのピース配列と空白ピースの位置
 */
export const generatePuzzlePieces = (
  division: number
): { pieces: PuzzlePiece[]; emptyPosition: { row: number; col: number } } => {
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
 * @param pieces パズルのピース配列
 * @param emptyPosition 空白ピースの位置
 * @param division 分割数
 * @param moves シャッフルの移動回数
 * @returns シャッフルされたパズルのピース配列と新しい空白ピースの位置
 */
export const shufflePuzzlePieces = (
  pieces: PuzzlePiece[],
  emptyPosition: { row: number; col: number },
  division: number,
  moves: number = 100
): { pieces: PuzzlePiece[]; emptyPosition: { row: number; col: number } } => {
  // ピースの配列をコピー
  const shuffledPieces = [...pieces];
  let currentEmptyPos = { ...emptyPosition };

  // 指定された回数だけランダムに移動
  for (let i = 0; i < moves; i++) {
    // 空白の隣接ピースを取得
    const adjacentPositions = getAdjacentPositions(
      currentEmptyPos.row,
      currentEmptyPos.col,
      division
    );

    // ランダムに1つ選択
    const randomIndex = Math.floor(Math.random() * adjacentPositions.length);
    const selectedPos = adjacentPositions[randomIndex];

    // 選択されたピースと空白を交換
    const selectedPieceIndex = shuffledPieces.findIndex(
      p => p.currentPosition.row === selectedPos.row && p.currentPosition.col === selectedPos.col
    );

    if (selectedPieceIndex !== -1) {
      // 選択されたピースを空白の位置に移動
      shuffledPieces[selectedPieceIndex].currentPosition = {
        ...currentEmptyPos,
      };

      // 空白の位置を更新
      currentEmptyPos = { ...selectedPos };
    }
  }

  return {
    pieces: shuffledPieces,
    emptyPosition: currentEmptyPos,
  };
};

/**
 * 指定された位置の隣接位置を取得する
 * @param row 行
 * @param col 列
 * @param division 分割数
 * @returns 隣接位置の配列
 */
export const getAdjacentPositions = (
  row: number,
  col: number,
  division: number
): { row: number; col: number }[] => {
  const positions: { row: number; col: number }[] = [];

  // 上
  if (row > 0) {
    positions.push({ row: row - 1, col });
  }

  // 下
  if (row < division - 1) {
    positions.push({ row: row + 1, col });
  }

  // 左
  if (col > 0) {
    positions.push({ row, col: col - 1 });
  }

  // 右
  if (col < division - 1) {
    positions.push({ row, col: col + 1 });
  }

  return positions;
};

/**
 * パズルが完成したかどうかをチェックする
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
 * @param seconds 経過秒数
 * @returns フォーマットされた時間文字列
 */
export const formatElapsedTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
};

/**
 * 画像ファイルのサイズをチェックする
 * @param file 画像ファイル
 * @param maxSizeInMB 最大サイズ（MB）
 * @returns サイズが制限内ならtrue、そうでなければfalse
 */
export const checkImageFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

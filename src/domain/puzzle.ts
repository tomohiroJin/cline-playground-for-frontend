import {
  Board,
  Coordinate,
  PieceId,
  Position,
  PuzzleDomainState,
  PuzzlePiece,
  Result,
  err,
  ok,
  toCoordinate,
  toPieceId,
} from './types';

/**
 * 初期のパズルボードを生成する（整列された状態）。
 * @param division 分割数
 */
export const generateBoard = (division: number): PuzzleDomainState => {
  if (division <= 0) {
    throw new Error('division must be greater than 0');
  }

  const pieces: PuzzlePiece[] = [];
  const emptyRow = toCoordinate(division - 1);
  const emptyCol = toCoordinate(division - 1);

  for (let r = 0; r < division; r++) {
    for (let c = 0; c < division; c++) {
      const row = toCoordinate(r);
      const col = toCoordinate(c);
      const isEmpty = row === emptyRow && col === emptyCol;
      const id = toPieceId(r * division + c);

      pieces.push({
        id,
        correctPosition: { row, col },
        currentPosition: { row, col },
        isEmpty,
      });
    }
  }

  return {
    pieces,
    division,
    emptyPosition: { row: emptyRow, col: emptyCol },
    completed: true, // 正しい位置で生成されるため完了状態
  };
};

/**
 * 指定された位置の隣接位置を取得する。
 */
export const getAdjacentPositions = (pos: Position, division: number): ReadonlyArray<Position> => {
  const directions = [
    { r: -1, c: 0 }, // 上
    { r: 1, c: 0 }, // 下
    { r: 0, c: -1 }, // 左
    { r: 0, c: 1 }, // 右
  ];

  return directions
    .map(d => ({
      row: pos.row + d.r,
      col: pos.col + d.c,
    }))
    .filter(p => p.row >= 0 && p.row < division && p.col >= 0 && p.col < division)
    .map(p => ({
      row: toCoordinate(p.row),
      col: toCoordinate(p.col),
    }));
};

/**
 * 2つの位置が等しいか判定する。
 */
export const isSamePosition = (p1: Position, p2: Position): boolean =>
  p1.row === p2.row && p1.col === p2.col;

/**
 * ピースを移動する（純粋関数）。
 * 指定されたピースが空白の隣にあればスワップして新しい状態を返す。
 */
export const movePiece = (
  state: PuzzleDomainState,
  pieceId: PieceId
): Result<PuzzleDomainState, string> => {
  const pieceIndex = state.pieces.findIndex(p => p.id === pieceId);
  if (pieceIndex === -1) {
    return err('Piece not found');
  }

  const piece = state.pieces[pieceIndex];
  const emptyPos = state.emptyPosition;

  // 隣接判定
  const isAdjacent = getAdjacentPositions(piece.currentPosition, state.division).some(adj =>
    isSamePosition(adj, emptyPos)
  );

  if (!isAdjacent) {
    return err('Piece is not adjacent to empty space');
  }

  // スワップ処理（不変性を維持）
  const newPieces = [...state.pieces];

  // 移動するピースの位置を更新
  newPieces[pieceIndex] = {
    ...piece,
    currentPosition: emptyPos,
  };

  // 空白ピースを探して位置を更新
  const emptyPieceIndex = newPieces.findIndex(p => p.isEmpty);
  if (emptyPieceIndex !== -1) {
    newPieces[emptyPieceIndex] = {
      ...newPieces[emptyPieceIndex],
      currentPosition: piece.currentPosition,
    };
  }

  // 完成判定
  const completed = newPieces.every(
    p =>
      p.isEmpty ||
      (p.correctPosition.row === p.currentPosition.row &&
        p.correctPosition.col === p.currentPosition.col)
  );

  return ok({
    ...state,
    pieces: newPieces,
    emptyPosition: piece.currentPosition, // 元のピースの位置が新しい空白位置になる
    completed,
  });
};

/**
 * パズルをシャッフルする（純粋関数）。
 * ランダムネスは外部から注入される。
 * @param state 現在の状態
 * @param moves シャッフル回数
 * @param randomProvider 0以上1未満の乱数を返す関数
 */
export const shuffleBoard = (
  state: PuzzleDomainState,
  moves: number,
  randomProvider: () => number
): PuzzleDomainState => {
  // 不変性を維持するため、ローカルで状態をシミュレーションするためのコピーを作成
  // ただし、ループごとに新しいオブジェクトを作るのはコストが高いので、
  // 計算自体はミュータブルに行い、最後に新しいステートを返す「Local Mutation」パターンを使うのが一般的だが、
  // ここでは厳密な関数型スタイルとして reduce を使うか、あるいは再帰を使う。
  // TypeScript で 100回の再帰はスタックオーバーフローのリスクがあるため、ループ内部で計算する。

  let currentPieces = [...state.pieces];
  let currentEmptyPos = state.emptyPosition; // 値コピー（Primitive/Object with primitive fields）

  // 高速化のためのマップ作成（位置 -> インデックス）
  // 毎回再構築すると遅いので、移動ごとにメンテナンスするか、あるいは検索するか。
  // 配列サイズが小さい（最大16または25）ので findIndex でも十分高速。

  for (let i = 0; i < moves; i++) {
    const adjacents = getAdjacentPositions(currentEmptyPos, state.division);
    const randomIndex = Math.floor(randomProvider() * adjacents.length);
    const selectedPos = adjacents[randomIndex];

    // 選ばれた位置にあるピースを探す
    const targetPieceIndex = currentPieces.findIndex(p =>
      isSamePosition(p.currentPosition, selectedPos)
    );

    if (targetPieceIndex !== -1) {
      // スワップ
      const targetPiece = currentPieces[targetPieceIndex];
      const emptyPieceIndex = currentPieces.findIndex(p => p.isEmpty);

      // ターゲットを空白位置へ
      currentPieces[targetPieceIndex] = {
        ...targetPiece,
        currentPosition: currentEmptyPos,
      };

      // 空白ターゲット位置へ
      if (emptyPieceIndex !== -1) {
        currentPieces[emptyPieceIndex] = {
          ...currentPieces[emptyPieceIndex],
          currentPosition: selectedPos,
        };
      }

      currentEmptyPos = selectedPos;
    }
  }

  // 完成している可能性は極めて低いが、一応判定
  // シャッフル後は completed = false とみなすのが通例だが、ロジックとしてチェックする
  const completed = currentPieces.every(
    p =>
      p.isEmpty ||
      (p.correctPosition.row === p.currentPosition.row &&
        p.correctPosition.col === p.currentPosition.col)
  );

  return {
    ...state,
    pieces: currentPieces,
    emptyPosition: currentEmptyPos,
    completed,
  };
};

/**
 * パズルを完成状態にする（デバッグ/チート用）。
 */
export const solveBoard = (state: PuzzleDomainState): PuzzleDomainState => {
  const solvedPieces = state.pieces.map(piece => ({
    ...piece,
    currentPosition: piece.correctPosition,
  }));

  // 空白位置も正しい位置（右下）になる想定
  // 空白の correctPosition を探す
  const emptyPiece = solvedPieces.find(p => p.isEmpty);
  const emptyPosition = emptyPiece?.correctPosition || {
    row: toCoordinate(state.division - 1),
    col: toCoordinate(state.division - 1),
  };

  return {
    ...state,
    pieces: solvedPieces,
    emptyPosition,
    completed: true,
  };
};

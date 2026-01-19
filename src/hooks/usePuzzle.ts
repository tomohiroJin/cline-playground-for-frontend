import { useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import {
  imageUrlAtom,
  originalImageSizeAtom,
  puzzleStateAtom,
  puzzleStartTimeAtom,
  puzzleElapsedTimeAtom,
} from '../store/atoms';
import { generateBoard, shuffleBoard, movePiece, solveBoard } from '../domain/puzzle';
import { toPieceId } from '../domain/types';

/**
 * パズルの状態と操作を管理するカスタムフック
 */
export const usePuzzle = () => {
  // 状態
  const [imageUrl, setImageUrl] = useAtom(imageUrlAtom);
  const [originalImageSize, setOriginalImageSize] = useAtom(originalImageSizeAtom);

  // ドメイン状態（単一のアトムに統合）
  const [puzzleState, setPuzzleState] = useAtom(puzzleStateAtom);

  const [startTime, setStartTime] = useAtom(puzzleStartTimeAtom);
  const [elapsedTime, setElapsedTime] = useAtom(puzzleElapsedTimeAtom);

  // 以前のAPIとの互換性のための派生値
  // コンポーネント側で domain types を使うように修正するのが理想だが、
  // 一旦ここで展開して返すことで修正範囲をフック内に留めることも可能。
  // ただし、型安全性を高めるため、可能な限りドメイン型をそのまま露出させる。
  const { pieces, division, emptyPosition, completed } = puzzleState;

  /**
   * 分割数に基づいてシャッフル回数を計算する
   */
  const calculateShuffleMoves = (div: number): number => {
    const totalPieces = div * div;
    const shuffleFactor = div * 2;
    return totalPieces * shuffleFactor;
  };

  /**
   * 分割数を変更するハンドラ（状態更新も含む）
   */
  const setDivision = useCallback(
    (newDivision: number) => {
      if (newDivision <= 0) return;
      setPuzzleState(generateBoard(newDivision));
    },
    [setPuzzleState]
  );

  /**
   * パズルを初期化する
   */
  const initializePuzzle = useCallback(() => {
    if (!imageUrl) return;

    // 1. 生成
    let newState = generateBoard(division);

    // 2. シャッフル
    newState = shuffleBoard(
      newState,
      calculateShuffleMoves(division),
      Math.random // 純粋関数に乱数生成器を注入
    );

    // 状態更新
    setPuzzleState(newState);
    setStartTime(Date.now());
    setElapsedTime(0);
  }, [imageUrl, division, setPuzzleState, setStartTime, setElapsedTime]);

  /**
   * ピースを移動する
   */
  const handleMovePiece = useCallback(
    (pieceIdAsNumber: number) => {
      // 完了していたら何もしない
      if (puzzleState.completed) return;

      const pieceId = toPieceId(pieceIdAsNumber);
      const result = movePiece(puzzleState, pieceId);

      if (result.ok) {
        setPuzzleState(result.value);
        // 完了判定は movePiece 内で行われ、state.completed に反映されている
        // 必要ならここでエフェクトをトリガーできるが、基本は宣言的UIに任せる
      } else {
        // エラーハンドリング（必要ならログ出力など）
        // console.warn(result.error);
      }
    },
    [puzzleState, setPuzzleState]
  );

  /*
   * パズルの状態を監視し、時間を更新する
   */
  useEffect(() => {
    if (!startTime || completed) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startTime, completed, setElapsedTime]);

  /**
   * パズルをリセットする
   */
  const resetPuzzle = useCallback(() => {
    initializePuzzle();
  }, [initializePuzzle]);

  /**
   * パズルを完成させる（デバッグ/チート用）
   */
  const solvePuzzle = useCallback(() => {
    if (puzzleState.completed) return;
    setPuzzleState(solveBoard(puzzleState));
  }, [puzzleState, setPuzzleState]);

  return {
    imageUrl,
    setImageUrl,
    originalImageSize,
    setOriginalImageSize,
    division,
    setDivision, // 独自のハンドラに置き換え
    pieces,
    // setPieces, // 削除
    emptyPosition,
    elapsedTime,
    completed,
    // setCompleted, // 削除
    initializePuzzle,
    movePiece: handleMovePiece,
    resetPuzzle,
    solvePuzzle,
  };
};

/**
 * ゲームフロー制御フック
 *
 * ゲームのフェーズ管理（開始・完成・リセット・終了）を担当する。
 * スコア計算・保存はユースケース経由で行う。
 */
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { gamePhaseAtom, selectedImageUrlAtom, selectedImageSizeAtom, gameScoreAtom, isBestScoreAtom, gameElapsedTimeAtom } from '../store/game-atoms';
import { emptyPanelClicksAtom, hintUsedAtom } from '../store/ui-atoms';
import { usePuzzleGame } from './usePuzzleGame';
import { completePuzzleUseCase } from '../../application/use-cases/complete-puzzle';
import { PuzzleRecordStorage, TotalClearsStorage } from '../../application/ports/storage-port';
import { extractImageName } from '../../shared/utils/image-utils';

/** ゲームフロー制御フックのオプション（DI 用） */
export interface UseGameFlowOptions {
  readonly recordStorage: PuzzleRecordStorage;
  readonly totalClearsStorage: TotalClearsStorage;
}

/**
 * ゲームフロー制御フック
 *
 * @param options ストレージの注入（DIP: ポート経由で依存）
 */
export const useGameFlow = (options: UseGameFlowOptions) => {
  const { recordStorage, totalClearsStorage } = options;

  const [gamePhase, setGamePhase] = useAtom(gamePhaseAtom);
  const [imageUrl, setImageUrl] = useAtom(selectedImageUrlAtom);
  const [imageSize, setImageSize] = useAtom(selectedImageSizeAtom);
  const [score, setScore] = useAtom(gameScoreAtom);
  const [isBestScore, setIsBestScore] = useAtom(isBestScoreAtom);
  const [elapsedTime] = useAtom(gameElapsedTimeAtom);
  const [emptyPanelClicks, setEmptyPanelClicks] = useAtom(emptyPanelClicksAtom);
  const [hintUsed] = useAtom(hintUsedAtom);

  const { boardState, initialize, move, reset, completeForDebug } = usePuzzleGame();

  const prevCompletedRef = useRef(false);

  // パズル完成時にスコアを計算し記録する
  useEffect(() => {
    if (boardState?.isCompleted && !prevCompletedRef.current) {
      const imageId = imageUrl ? extractImageName(imageUrl) : 'unknown';
      const result = completePuzzleUseCase({
        imageId,
        actualMoves: boardState.moveCount,
        optimalMoves: boardState.division * boardState.division * 2,
        elapsedSeconds: elapsedTime,
        hintUsed,
        division: boardState.division,
        recordStorage,
        totalClearsStorage,
      });
      setScore(result.score);
      setIsBestScore(result.isBestScore);
    }
    prevCompletedRef.current = boardState?.isCompleted ?? false;
  }, [boardState?.isCompleted, boardState?.moveCount, boardState?.division, elapsedTime, hintUsed, imageUrl, recordStorage, totalClearsStorage, setScore, setIsBestScore]);

  /** 画像を選択する */
  const handleImageSelect = useCallback(
    (url: string, width: number, height: number) => {
      setImageUrl(url);
      setImageSize({ width, height });
    },
    [setImageUrl, setImageSize]
  );

  /** ゲームを開始する */
  const handleStartGame = useCallback(
    (division: number) => {
      setScore(null);
      setIsBestScore(false);
      setEmptyPanelClicks(0);
      initialize(division);
      setGamePhase('playing');
    },
    [initialize, setGamePhase, setScore, setIsBestScore, setEmptyPanelClicks]
  );

  /** ピースを移動する */
  const handlePieceMove = useCallback(
    (pieceId: number) => {
      move(pieceId);
    },
    [move]
  );

  /** ゲームをリセットする */
  const handleResetGame = useCallback(
    (division: number) => {
      setScore(null);
      setIsBestScore(false);
      reset(division);
    },
    [reset, setScore, setIsBestScore]
  );

  /** ゲームを終了する */
  const handleEndGame = useCallback(() => {
    setGamePhase('setup');
  }, [setGamePhase]);

  /** 空パネルクリック */
  const handleEmptyPanelClick = useCallback(() => {
    if (!boardState?.isCompleted) {
      setEmptyPanelClicks(prev => prev + 1);
    }
  }, [boardState?.isCompleted, setEmptyPanelClicks]);

  return {
    gamePhase,
    setGamePhase,
    imageUrl,
    imageSize,
    boardState,
    score,
    isBestScore,
    emptyPanelClicks,
    handleImageSelect,
    handleStartGame,
    handlePieceMove,
    handleResetGame,
    handleEndGame,
    handleEmptyPanelClick,
    completeForDebug,
  };
};

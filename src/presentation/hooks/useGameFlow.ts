/**
 * ゲームフロー制御フック
 *
 * ゲームのフェーズ管理（開始・完成・リセット・終了）を担当する。
 * スコア計算・保存はユースケース経由で行う。
 */
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import {
  gamePhaseAtom,
  selectedImageUrlAtom,
  selectedImageSizeAtom,
  gameScoreAtom,
  isBestScoreAtom,
  gameElapsedTimeAtom,
  puzzleDivisionAtom,
  puzzleStartTimeAtom,
} from '../store/game-atoms';
import { emptyPanelClicksAtom, hintUsedAtom, hintModeEnabledAtom } from '../store/ui-atoms';
import { usePuzzleGame } from './usePuzzleGame';
import { completePuzzleUseCase } from '../../application/use-cases/complete-puzzle';
import { PuzzleRecordStorage, TotalClearsStorage } from '../../application/ports/storage-port';
import { extractImageName } from '../../shared/utils/image-utils';
import { calculateCorrectRate } from '../../domain/puzzle/aggregates/puzzle-board';

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
  const [division, setDivision] = useAtom(puzzleDivisionAtom);
  const [score, setScore] = useAtom(gameScoreAtom);
  const [isBestScore, setIsBestScore] = useAtom(isBestScoreAtom);
  const [elapsedTime, setElapsedTime] = useAtom(gameElapsedTimeAtom);
  const [startTime, setStartTime] = useAtom(puzzleStartTimeAtom);
  const [emptyPanelClicks, setEmptyPanelClicks] = useAtom(emptyPanelClicksAtom);
  const [hintUsed] = useAtom(hintUsedAtom);
  const [hintModeEnabled, setHintModeEnabled] = useAtom(hintModeEnabledAtom);

  const { boardState, initialize, move, reset, completeForDebug } = usePuzzleGame();

  const prevCompletedRef = useRef(false);

  // タイマー: ゲーム開始後、完了するまで毎秒経過時間を更新
  useEffect(() => {
    if (!startTime || boardState?.isCompleted) return;

    const intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startTime, boardState?.isCompleted, setElapsedTime]);

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

  /** ヒントモードのトグル */
  const toggleHintMode = useCallback(() => {
    setHintModeEnabled(prev => !prev);
  }, [setHintModeEnabled]);

  /** 画像を選択する */
  const handleImageSelect = useCallback(
    (url: string, width: number, height: number) => {
      setImageUrl(url);
      setImageSize({ width, height });
    },
    [setImageUrl, setImageSize]
  );

  /** 難易度を変更する */
  const handleDifficultyChange = useCallback(
    (newDivision: number) => {
      setDivision(newDivision);
    },
    [setDivision]
  );

  /** ゲームを開始する */
  const handleStartGame = useCallback(() => {
    setScore(null);
    setIsBestScore(false);
    setEmptyPanelClicks(0);
    setElapsedTime(0);
    setStartTime(Date.now());
    initialize(division);
    setGamePhase('playing');
  }, [initialize, division, setGamePhase, setScore, setIsBestScore, setEmptyPanelClicks, setElapsedTime, setStartTime]);

  /** ピースを移動する */
  const handlePieceMove = useCallback(
    (pieceId: number) => {
      move(pieceId);
    },
    [move]
  );

  /** ゲームをリセットする */
  const handleResetGame = useCallback(() => {
    setScore(null);
    setIsBestScore(false);
    setElapsedTime(0);
    setStartTime(Date.now());
    reset(division);
  }, [reset, division, setScore, setIsBestScore, setElapsedTime, setStartTime]);

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

  // ドメインから正解率を導出
  const correctRate = boardState ? calculateCorrectRate(boardState) : 0;

  return {
    gamePhase,
    setGamePhase,
    imageUrl,
    imageSize,
    division,
    boardState,
    elapsedTime,
    score,
    isBestScore,
    hintModeEnabled,
    correctRate,
    emptyPanelClicks,
    toggleHintMode,
    handleImageSelect,
    handleDifficultyChange,
    handleStartGame,
    handlePieceMove,
    handleResetGame,
    handleEndGame,
    handleEmptyPanelClick,
    completeForDebug,
  };
};

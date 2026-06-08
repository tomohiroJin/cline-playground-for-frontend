// キャンペーンセッション全体の状態管理
//
// 担当:
// - 進捗（CampaignProgress）の load / save
// - lives（残機）の管理。STAGE SELECT 入場で 3 リセット
// - 現在挑戦中のステージ
// - クリア時の進捗更新

import { useCallback, useMemo, useState } from 'react';
import type { Stage } from '../../domain/race/stage';
import type { CampaignProgress } from '../../domain/race/campaign-progress';
import type { StageRank } from '../../domain/race/rank';
import { isCampaignCompleted, resetProgress } from '../../domain/race/campaign-progress';
import { INITIAL_LIVES, decrementLives } from '../../domain/race/lives';
import type { CampaignProgressPort } from '../../application/ports/campaign-progress-port';
import { handleStageClear } from '../../application/use-cases/handle-stage-clear';

/** UI フェーズ（キャンペーン全体の画面状態） */
export type CampaignUiPhase =
  | 'menu'              // 通常メニュー
  | 'stage_select'      // ステージ選択画面
  | 'racing'            // 実走中
  | 'retry'             // 残機 > 0 で時間切れ時のリトライ確認画面（spec §2.4）
  | 'stage_clear'       // ステージクリア画面
  | 'game_over'         // GAME OVER 画面
  | 'ending';           // エンディング画面

export interface UseCampaignSessionResult {
  readonly phase: CampaignUiPhase;
  readonly progress: CampaignProgress;
  readonly currentStage: Stage | null;
  readonly livesRemaining: number;
  readonly canReplayEnding: boolean;
  readonly enterStageSelect: () => void;
  readonly leaveToMenu: () => void;
  readonly selectStage: (stage: Stage) => void;
  readonly handleClear: (goalTimeSec: number, rank: Exclude<StageRank, 'NONE'>) => void;
  readonly continueAfterClear: () => void;
  readonly handleTimeUp: () => void;  // ライフ消費 → 残あれば再挑戦の選択肢
  readonly retryStage: () => void;
  readonly returnToStageSelect: () => void;
  readonly viewEnding: () => void;
  readonly resetAllProgress: () => void;
}

/**
 * キャンペーンセッション管理フック。
 *
 * @param port  CampaignProgressPort（テスト時はインメモリ実装で差替可能）
 */
export const useCampaignSession = (
  port: CampaignProgressPort,
): UseCampaignSessionResult => {
  const [progress, setProgress] = useState<CampaignProgress>(() => port.load());
  const [phase, setPhase] = useState<CampaignUiPhase>('menu');
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [livesRemaining, setLivesRemaining] = useState<number>(INITIAL_LIVES);

  const canReplayEnding = useMemo(() => isCampaignCompleted(progress), [progress]);

  const persist = useCallback(
    (next: CampaignProgress) => {
      setProgress(next);
      port.save(next);
    },
    [port],
  );

  const enterStageSelect = useCallback(() => {
    setLivesRemaining(INITIAL_LIVES);  // §2.4 リセット規則
    setCurrentStage(null);
    setPhase('stage_select');
  }, []);

  const leaveToMenu = useCallback(() => {
    setCurrentStage(null);
    setPhase('menu');
  }, []);

  const selectStage = useCallback((stage: Stage) => {
    setCurrentStage(stage);
    setPhase('racing');
  }, []);

  const handleClear = useCallback(
    (goalTimeSec: number, rank: Exclude<StageRank, 'NONE'>) => {
      if (!currentStage) return;
      const next = handleStageClear({
        progress,
        stage: currentStage,
        goalTimeSec,
        rank,
      });
      persist(next);
      setPhase('stage_clear');
    },
    [currentStage, progress, persist],
  );

  const continueAfterClear = useCallback(() => {
    if (!currentStage) {
      enterStageSelect();
      return;
    }
    // 全クリアならエンディング、そうでなければ次ステージ → STAGE SELECT に戻す
    if (isCampaignCompleted(progress)) {
      setPhase('ending');
      return;
    }
    enterStageSelect();
  }, [currentStage, progress, enterStageSelect]);

  const handleTimeUp = useCallback(() => {
    setLivesRemaining((current) => {
      const next = decrementLives(current);
      // spec §2.4: 残機 0 なら GAME OVER、残機 > 0 ならリトライ確認画面へ
      setPhase(next <= 0 ? 'game_over' : 'retry');
      return next;
    });
  }, []);

  const retryStage = useCallback(() => {
    if (!currentStage) {
      enterStageSelect();
      return;
    }
    setPhase('racing');
  }, [currentStage, enterStageSelect]);

  const returnToStageSelect = useCallback(() => {
    enterStageSelect();
  }, [enterStageSelect]);

  const viewEnding = useCallback(() => {
    setPhase('ending');
  }, []);

  const resetAllProgress = useCallback(() => {
    const fresh = resetProgress();
    persist(fresh);
    port.clear();
    setLivesRemaining(INITIAL_LIVES);
    setCurrentStage(null);
    setPhase('stage_select');
  }, [persist, port]);

  return {
    phase,
    progress,
    currentStage,
    livesRemaining,
    canReplayEnding,
    enterStageSelect,
    leaveToMenu,
    selectStage,
    handleClear,
    continueAfterClear,
    handleTimeUp,
    retryStage,
    returnToStageSelect,
    viewEnding,
    resetAllProgress,
  };
};

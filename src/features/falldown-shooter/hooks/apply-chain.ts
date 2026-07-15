// スキル・爆弾でセルを消した後に連鎖を適用する共通ヘルパー
import type { GameState, ChainStep } from '../types';
import { GameLogic } from '../game-logic';

export interface ApplyChainContext {
  scoreMultiplier: number;
  comboMult: number;
  onLineClear?: (lines: number) => void;
}

export interface ApplyChainResult {
  grid: (string | null)[][];
  addedScore: number;
  addedLines: number;
  chainSteps: ChainStep[];
}

/** グリッドに連鎖解決を適用し、加算スコア・ライン数を返す（純粋に近い: onLineClear のみ副作用） */
export const applyChain = (
  grid: (string | null)[][],
  state: Pick<GameState, 'stage'>,
  ctx: ApplyChainContext
): ApplyChainResult => {
  const resolved = GameLogic.resolveBoard(grid);
  // 何も消えていない（同色グループも完全行も無い）場合のみ加点なし
  if (resolved.chainSteps.length === 0) {
    return { grid: resolved.grid, addedScore: 0, addedLines: 0, chainSteps: resolved.chainSteps };
  }
  // onLineClear（コンボ登録）は完全行が消えたときだけ。同色グループのみの連鎖では呼ばない
  if (resolved.totalLines > 0 && ctx.onLineClear) ctx.onLineClear(resolved.totalLines);
  // スコアは同色グループのセル点も含めて算出する（完全行の有無に依らず加点）
  const addedScore = GameLogic.calcResolveScore(resolved.chainSteps, {
    stage: state.stage,
    scoreMultiplier: ctx.scoreMultiplier,
    comboMult: ctx.comboMult,
  });
  return { grid: resolved.grid, addedScore, addedLines: resolved.totalLines, chainSteps: resolved.chainSteps };
};

/**
 * KEYS & ARMS — 画面トランジションの状態前進
 *
 * 残りカウントを進め、中点で登録コールバック（次ステージ init 等）を実行する。
 * 注: 本番では描画関数 drawTrans（render 経由・約60Hz）から呼ばれる。
 *     呼び出しタイミングは変更しないため、ここでは状態前進のみを担う。
 */
import type { GameState } from '../types';
import { TRANSITION_MID } from '../constants';

/** トランジションの状態を1ステップ進める */
export function advanceTransition(G: GameState): void {
  G.transition.t--;
  if (G.transition.t === TRANSITION_MID && G.transition.fn) G.transition.fn();
}

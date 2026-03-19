/**
 * クイズ画面用ヘルパー関数・型定義
 */
import type { ReactionSituation } from '../../../character-reactions';

/** フィードバック状態（フラッシュとスコア表示を統合管理） */
export interface FeedbackState {
  flashType: 'correct' | 'incorrect' | 'timeup' | undefined;
  scoreText: string;
}

/** 初期フィードバック状態 */
export const INITIAL_FEEDBACK: FeedbackState = { flashType: undefined, scoreText: '' };

/** リアクション状況を判定するヘルパー関数 */
export function determineReaction(
  answered: boolean,
  selectedAnswer: number | null,
  isEmergency: boolean,
  combo: number,
  correctAnswer: number,
): ReactionSituation {
  if (!answered) {
    return isEmergency ? 'emergency' : 'idle';
  }
  if (selectedAnswer === null || selectedAnswer === -1) {
    return 'idle';
  }
  if (selectedAnswer === correctAnswer) {
    return combo >= 3 ? 'combo' : 'correct';
  }
  return 'incorrect';
}

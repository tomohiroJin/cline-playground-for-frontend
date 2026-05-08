// ゲームオーバー処理 Use Case

import type { GamePhase } from '../../domain/race/types';

/**
 * 残機 0 でステージ時間切れになったときの遷移先を返す。
 * - 残機の永続化はしない（spec §2.4）
 * - STAGE SELECT に戻り、その時点で lives は 3 に戻される（プレゼンテーション層の責務）
 *
 * 本 Use Case は純粋に「次に行くべきフェーズ」を返す薄いロジック。
 */
export const handleGameOver = (): GamePhase => 'stage_select';

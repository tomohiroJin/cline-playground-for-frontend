/**
 * 加速チャージのドメインロジック
 * ストックした加速を任意タイミングで発動する（追われた瞬間に切る切り札）
 */
import type { GameState } from '../../types';
import { GAME_BALANCE } from '../constants';

/** 加速チャージを使う。所持なし・隠れ中・加速効果中は発動できない */
export const tryUseSpeedCharge = (g: GameState): boolean => {
  if (g.speedCharges <= 0 || g.hiding || g.speedBoost > 0) return false;
  g.speedCharges--;
  g.speedBoost = GAME_BALANCE.timing.SPEED_BOOST_DURATION;
  return true;
};

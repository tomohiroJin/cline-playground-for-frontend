/**
 * 敵更新・死亡フィルタユースケース
 * 死亡アニメーション完了後の敵を除去する
 */
import { Enemy } from '../../types';

/** 死亡アニメーション時間（ms） */
const DEATH_ANIMATION_DURATION = 300;

/**
 * 敵リストから死亡アニメーション完了した敵を除去する
 * isDying 状態の敵は DEATH_ANIMATION_DURATION 経過まで保持
 */
export function resolveEnemyUpdates(enemies: Enemy[], currentTime: number): Enemy[] {
  return enemies.filter(enemy => {
    if (enemy.hp > 0) return true;
    if (enemy.isDying && enemy.deathStartTime) {
      return currentTime - enemy.deathStartTime < DEATH_ANIMATION_DURATION;
    }
    return false;
  });
}

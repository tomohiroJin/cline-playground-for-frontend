/**
 * テスト用共通ユーティリティ
 */
import type { Obstacle, Ramp } from '../../types';
import { buildObstacle, buildRamp } from './test-factories';

/**
 * 指定した数のランプ配列を生成する
 *
 * @param count - 生成するランプの数
 * @param obstacleFactory - 各ランプに配置する障害物を生成するファクトリ関数（省略時は空配列）
 * @returns テスト用のランプ配列
 */
export const createRampsWithObstacles = (
  count: number,
  obstacleFactory?: (rampIndex: number) => Obstacle[]
): Ramp[] =>
  Array.from({ length: count }, (_, i) =>
    buildRamp({
      // 奇数番目は方向を反転させてジグザグ配置にする
      dir: i % 2 === 0 ? 1 : -1,
      obs: obstacleFactory ? obstacleFactory(i) : [buildObstacle()],
    })
  );

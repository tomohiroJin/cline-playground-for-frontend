// 壁衝突物理計算モジュール
// 移行期間中: domain/track/wall-physics.ts へ委譲

export {
  calculateWallPenalty,
  shouldWarp,
  calculateWarpDestination,
  calculateSlideVector,
  calculateSlideAngle,
  calculateWallSlidePosition,
} from './domain/track/wall-physics';

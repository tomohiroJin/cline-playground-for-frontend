export { EnemyAiPolicyRegistry } from './policies/enemyAi/EnemyAiPolicyRegistry';
export { buildDefaultEnemyAiPolicyRegistry } from './policies/enemyAi/policies';
export type { EnemyAiPolicy, EnemyAiUpdateContext } from './policies/enemyAi/types';

export {
  detectTrapCandidateTiles,
  detectWallPlacementCandidates,
  collectContinuousWallSegments,
  collectShortcutWallPositions,
  collectWallAdjacentTiles,
  findPenetrationShortcuts,
} from './services/gimmickPlacement/candidateDetection';
export {
  getDistanceFromPath,
  calculateShortcutValue,
  hasAlternativeRoute,
  findShortcutBlockingWalls,
  findSecretPassageWalls,
  findTrickWalls,
  findCorridorBlockWalls,
} from './services/gimmickPlacement/scoring';
export {
  validateGimmickPlacementConfig,
  assertGimmickPlacementPostconditions,
  selectTrapType,
  selectWallType,
  calculateWallTypeCounts,
  placeMultiWallCandidate,
} from './services/gimmickPlacement/placementDecision';
export type {
  WallSegment,
  PenetrationCandidate,
  ScoredWallCandidate,
  MultiWallCandidate,
} from './services/gimmickPlacement/types';

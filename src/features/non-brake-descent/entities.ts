/**
 * @deprecated domain/entities/ 配下のモジュールを使用してください
 * 後方互換のため EntityFactory オブジェクトとして re-export しています
 */
import {
  createPlayer,
  createObstacle,
  createRamp,
  createParticle,
  createParticles,
  createJetParticle,
  createScorePopup,
  createNearMissEffect,
  createCloud,
  createBuilding,
} from './domain/entities';

export const EntityFactory = {
  createPlayer,
  createParticle,
  createParticles,
  createJetParticle,
  createScorePopup,
  createNearMissEffect,
  createObstacle,
  createRamp,
  createCloud,
  createBuilding,
} as const;

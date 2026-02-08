import { Enemy, GameMap, Position, EnemyTypeValue } from '../../../types';

export interface EnemyAiUpdateContext {
  enemy: Enemy;
  player: Position;
  map: GameMap;
  currentTime: number;
}

export interface EnemyAiPolicy {
  supports(type: EnemyTypeValue): boolean;
  update(context: EnemyAiUpdateContext): Enemy;
}

/**
 * 敵の移動エンジン
 *
 * マップ衝突（collisionService）を考慮した1ステップ移動と巡回パス生成を提供する。
 * 方向計算は aiGeometry.calculateStep に集約。
 */
import { Enemy, GameMap, Position } from '../../types';
import { canMove } from '../../services/collisionService';
import { calculateStep, getManhattanDistance } from './aiGeometry';
import { getRandom } from './aiRandom';

/** ターゲットへ1歩近づく（横優先/縦優先を距離差で決定、塞がれたら停止） */
const stepTowards = (enemy: Enemy, target: Position, map: GameMap): Position => {
  const { stepX, stepY } = calculateStep(enemy, target);
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const tryHorizontal = Math.abs(dx) >= Math.abs(dy);

  const candidates: Position[] = tryHorizontal
    ? [
        { x: enemy.x + stepX, y: enemy.y },
        { x: enemy.x, y: enemy.y + stepY },
      ]
    : [
        { x: enemy.x, y: enemy.y + stepY },
        { x: enemy.x + stepX, y: enemy.y },
      ];

  for (const pos of candidates) {
    if (canMove(map, pos.x, pos.y)) return pos;
  }
  return { x: enemy.x, y: enemy.y };
};

/** プレイヤーから1歩離れる（4方向を順に試行） */
const stepAway = (enemy: Enemy, player: Position, map: GameMap): Position => {
  const { stepX, stepY } = calculateStep(player, enemy);
  const candidates: Position[] = [
    { x: enemy.x + stepX, y: enemy.y },
    { x: enemy.x, y: enemy.y + stepY },
    { x: enemy.x - stepX, y: enemy.y },
    { x: enemy.x, y: enemy.y - stepY },
  ];
  for (const pos of candidates) {
    if (canMove(map, pos.x, pos.y)) return pos;
  }
  return { x: enemy.x, y: enemy.y };
};

/** 突進（最大距離内かつ確率成立時、2マス先まで一気に移動） */
export const attemptLunge = (
  enemy: Enemy,
  target: Position,
  map: GameMap,
  maxDistance: number,
  chance: number
): Enemy | null => {
  const distance = getManhattanDistance(enemy, target);
  if (distance > maxDistance) return null;
  if (getRandom().random() > chance) return null;

  const { stepX, stepY } = calculateStep(enemy, target);
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const preferHorizontal = Math.abs(dx) >= Math.abs(dy);

  const firstStep = preferHorizontal
    ? { x: enemy.x + stepX, y: enemy.y }
    : { x: enemy.x, y: enemy.y + stepY };
  const secondStep = preferHorizontal
    ? { x: enemy.x + stepX * 2, y: enemy.y }
    : { x: enemy.x, y: enemy.y + stepY * 2 };

  if (!canMove(map, firstStep.x, firstStep.y)) return null;
  if (!canMove(map, secondStep.x, secondStep.y)) return null;
  return { ...enemy, x: secondStep.x, y: secondStep.y };
};

/** ランダムな方向に1歩移動 */
const stepRandom = (enemy: Enemy, map: GameMap): Position => {
  const directions = [
    { x: enemy.x + 1, y: enemy.y },
    { x: enemy.x - 1, y: enemy.y },
    { x: enemy.x, y: enemy.y + 1 },
    { x: enemy.x, y: enemy.y - 1 },
  ];
  const shuffled = getRandom().shuffle(directions);
  for (const pos of shuffled) {
    if (canMove(map, pos.x, pos.y)) return pos;
  }
  return { x: enemy.x, y: enemy.y };
};

export const moveEnemyTowards = (enemy: Enemy, target: Position, map: GameMap): Enemy => {
  const next = stepTowards(enemy, target, map);
  return { ...enemy, x: next.x, y: next.y };
};

export const moveEnemyAway = (enemy: Enemy, player: Position, map: GameMap): Enemy => {
  const next = stepAway(enemy, player, map);
  return { ...enemy, x: next.x, y: next.y };
};

export const moveEnemyRandom = (enemy: Enemy, map: GameMap): Enemy => {
  const next = stepRandom(enemy, map);
  return { ...enemy, x: next.x, y: next.y };
};

/** 巡回パスを生成する（往路＋復路、長さ4-8マス） */
export const generatePatrolPath = (origin: Position): Position[] => {
  const length = getRandom().randomInt(4, 9); // 4-8
  const horizontal = getRandom().random() > 0.5;
  const path: Position[] = [];
  for (let i = 0; i < length; i++) {
    path.push({
      x: origin.x + (horizontal ? i : 0),
      y: origin.y + (horizontal ? 0 : i),
    });
  }
  const back = [...path].reverse().slice(1);
  return [...path, ...back];
};

/** 次の巡回ポイントを取得する */
export const getNextPatrolPoint = (enemy: Enemy): Position | undefined => {
  if (!enemy.patrolPath || enemy.patrolPath.length === 0) return undefined;
  const index = enemy.patrolIndex ?? 0;
  return enemy.patrolPath[index];
};

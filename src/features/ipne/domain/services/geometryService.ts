/**
 * 幾何ユーティリティ（純粋関数）
 */
import { Position } from '../types';

/** 2点間のマンハッタン距離（各軸の差の絶対値の和） */
export const manhattanDistance = (a: Position, b: Position): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/**
 * エンジニアタイプ分類
 */
import { EngineerType, ClassifyStats } from './types';
import { ENGINEER_TYPES } from './constants';

/** エンジニアタイプを判定 */
export function classifyEngineerType(data: ClassifyStats): EngineerType {
  return ENGINEER_TYPES.find((t) => t.condition(data)) ?? ENGINEER_TYPES[ENGINEER_TYPES.length - 1];
}

/**
 * 宝石管理（純粋関数）
 *
 * ボスステージの台座・宝石管理ロジック。
 * 台座状態: 0=空, 1=宝石設置済み, 2=シールド付き
 */
import { assertRange } from '../contracts/assertions';

/** 台座数 */
export const PEDESTAL_COUNT = 6;

/** index の事前条件チェック */
function validateIndex(peds: number[], index: number): void {
  assertRange(index, 0, peds.length - 1, '台座インデックス');
}

/** 台座状態を生成 */
export function createPedestalState(): number[] {
  return new Array(PEDESTAL_COUNT).fill(0);
}

/** 宝石を設置 */
export function placeGem(peds: number[], index: number): number[] {
  validateIndex(peds, index);
  if (peds[index] !== 0) return peds;
  const newPeds = [...peds];
  newPeds[index] = 1;
  return newPeds;
}

/** 宝石を除去（腕による盗み） */
export function removeGem(peds: number[], index: number): number[] {
  validateIndex(peds, index);
  const newPeds = [...peds];
  newPeds[index] = 0;
  return newPeds;
}

/** シールドを付与（1 → 2） */
export function applyShield(peds: number[], index: number): number[] {
  validateIndex(peds, index);
  const newPeds = [...peds];
  if (newPeds[index] === 1) {
    newPeds[index] = 2;
  }
  return newPeds;
}

/** シールドを破壊（2 → 1） */
export function breakShield(peds: number[], index: number): number[] {
  validateIndex(peds, index);
  const newPeds = [...peds];
  if (newPeds[index] === 2) {
    newPeds[index] = 1;
  }
  return newPeds;
}

/** 全台座に宝石が設置されているか */
export function isAllGemsPlaced(peds: number[]): boolean {
  return peds.every(p => p > 0);
}

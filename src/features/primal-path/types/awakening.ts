/**
 * 覚醒関連の型定義
 */
import type { CivTypeExt } from './common';

/** 覚醒エフェクト */
export interface AwakeningEffect {
  readonly atk?: number;
  readonly def?: number;
  readonly mhp?: number;
  readonly sd?: number;
  readonly burn?: number;
  readonly bb?: number;
  readonly allyAtkMul?: number;
  readonly allyFullHeal?: number;
}

/** 覚醒情報 */
export interface AwakeningInfo {
  readonly nm: string;
  readonly ds: string;
  readonly cl: string;
  readonly fx: AwakeningEffect;
  readonly bn?: string;
}

/** 覚醒記録 */
export interface AwokenRecord {
  id: string;
  nm: string;
  cl: string;
}

/** 覚醒ルール */
export interface AwakeningRule {
  id: string;
  t: CivTypeExt;
  tier: number;
  ok: boolean;
}

/** 覚醒次情報 */
export interface AwakeningNext {
  nm: string;
  need: string;
  cl: string;
}

/** 覚醒関連の状態 */
export interface AwakeningState {
  /** 覚醒済みリスト */
  awoken: AwokenRecord[];
  /** 覚醒条件チェック要否（0 or 1） */
  saReq: number;
  /** 復活使用済みフラグ（0 or 1） */
  rvU: number;
}

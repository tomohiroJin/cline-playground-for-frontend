/**
 * ユニット（味方・敵）の型定義
 */
import type { CivType } from './common';

/** 味方テンプレート */
export interface AllyTemplate {
  readonly n: string;
  readonly hp: number;
  readonly atk: number;
  readonly t: CivType;
  readonly h?: number;
  readonly tk?: number;
}

/** 味方 (実行時) */
export interface Ally {
  n: string;
  hp: number;
  mhp: number;
  atk: number;
  t: CivType;
  a: number;
  h?: number;
  tk?: number;
}

/** 敵テンプレート */
export interface EnemyTemplate {
  readonly n: string;
  readonly hp: number;
  readonly atk: number;
  readonly def: number;
  readonly bone: number;
}

/** 敵 (実行時) */
export interface Enemy {
  n: string;
  hp: number;
  mhp: number;
  atk: number;
  def: number;
  bone: number;
}

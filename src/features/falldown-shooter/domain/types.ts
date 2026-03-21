// ドメイン層 型定義

export type PowerType = 'triple' | 'pierce' | 'bomb' | 'slow' | 'downshot';
export type SkillType = 'laser' | 'blast' | 'clear';

/** セル座標 */
export interface Cell {
  readonly x: number;
  readonly y: number;
}

/** 位置 */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/** 方向 */
export interface Direction {
  readonly dx: number;
  readonly dy: number;
}

/** 読み取り専用のシェイプ型 */
export type ReadonlyShape = ReadonlyArray<ReadonlyArray<number>>;

/** 衝突ターゲット */
export interface CollisionTarget {
  readonly type: 'grid' | 'block';
  readonly blockId?: string;
  readonly x: number;
  readonly y: number;
  readonly power?: PowerType | null;
}

/** 衝突マップ */
export type CollisionMap = Map<string, CollisionTarget>;

/** 衝突判定結果 */
export interface CollisionResult {
  readonly target: CollisionTarget;
  readonly position: Position;
}

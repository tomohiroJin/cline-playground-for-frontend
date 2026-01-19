/**
 * 座標（行または列のインデックス）を表す型。
 * Branded Type を使用して、他の数値との混同を防ぐ。
 */
export type Coordinate = number & { readonly __brand: 'Coordinate' };

/**
 * 数値を Coordinate 型にキャストするヘルパー関数。
 * @param n 数値
 */
export const toCoordinate = (n: number): Coordinate => n as Coordinate;

/**
 * ピースの識別子を表す型。
 */
export type PieceId = number & { readonly __brand: 'PieceId' };

/**
 * 数値を PieceId 型にキャストするヘルパー関数。
 * @param n 数値
 */
export const toPieceId = (n: number): PieceId => n as PieceId;

/**
 * ボード上の位置を表す不変な型。
 */
export type Position = {
  readonly row: Coordinate;
  readonly col: Coordinate;
};

/**
 * パズルのピースを表す不変な型。
 */
export type PuzzlePiece = {
  readonly id: PieceId;
  readonly correctPosition: Position;
  readonly currentPosition: Position;
  readonly isEmpty: boolean;
};

/**
 * パズルボード全体を表す型（ピースの読み取り専用配列）。
 */
export type Board = ReadonlyArray<PuzzlePiece>;

/**
 * パズルの完全な状態を表す型。
 */
export type PuzzleDomainState = {
  readonly pieces: Board;
  readonly emptyPosition: Position;
  readonly division: number;
  readonly completed: boolean;
};

/**
 * 結果型（エラーハンドリング用）。
 * Railway Oriented Programming をサポートする。
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * 画像サイズを表す型
 */
export type ImageSize = {
  readonly width: number;
  readonly height: number;
};

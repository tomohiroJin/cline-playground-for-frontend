import { Player } from '../../types';

/** 座標値が有限数であることを検証する */
const assertFiniteCoordinate = (value: number, label: string): void => {
  if (!Number.isFinite(value)) {
    throw new Error(`プレイヤーの${label}が有限数ではありません: ${value}`);
  }
};

/** デフォルトのプレイヤー初期位置 */
const DEFAULT_X = 60;

/** プレイヤーを生成する（DbC: 座標の有限数チェック付き） */
export const createPlayer = (x = DEFAULT_X, y = 0): Player => {
  assertFiniteCoordinate(x, 'x座標');
  assertFiniteCoordinate(y, 'y座標');
  return {
    x,
    y,
    ramp: 0,
    vx: 0,
    vy: 0,
    jumping: false,
    jumpCD: 0,
    onGround: true,
  };
};

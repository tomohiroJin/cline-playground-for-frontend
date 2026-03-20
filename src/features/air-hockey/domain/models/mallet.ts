/**
 * マレットエンティティ
 * - プレイヤー/CPU の操作対象
 * - 移動制限（自陣半分のみ）
 */

export type MalletState = Readonly<{
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  side: 'player' | 'cpu';
}>;

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

export const Mallet = {
  /** マレットを生成する */
  create(x: number, y: number, radius: number, side: 'player' | 'cpu'): MalletState {
    return { x, y, vx: 0, vy: 0, radius, side };
  },

  /** ターゲット方向に移動する */
  moveTo(mallet: MalletState, targetX: number, targetY: number, maxSpeed: number): MalletState {
    const dx = targetX - mallet.x;
    const dy = targetY - mallet.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) {
      return { ...mallet, vx: 0, vy: 0 };
    }

    const speed = Math.min(dist, maxSpeed);
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    return {
      ...mallet,
      x: mallet.x + vx,
      y: mallet.y + vy,
      vx,
      vy,
    };
  },

  /** マレットを自陣に制限する */
  clampToSide(mallet: MalletState, canvasWidth: number, canvasHeight: number): MalletState {
    const r = mallet.radius;
    const x = clamp(mallet.x, r, canvasWidth - r);
    let y: number;

    if (mallet.side === 'player') {
      // プレイヤーは下半分
      y = clamp(mallet.y, canvasHeight / 2, canvasHeight - r);
    } else {
      // CPU は上半分
      y = clamp(mallet.y, r, canvasHeight / 2);
    }

    return { ...mallet, x, y };
  },
} as const;

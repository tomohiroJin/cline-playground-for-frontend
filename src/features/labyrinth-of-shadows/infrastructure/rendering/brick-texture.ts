/**
 * プロシージャルレンガテクスチャ計算
 * 壁のレンガパターンの色を算出する
 */

/** レンガパターンのサイズ定数 */
const BRICK_WIDTH = 0.5;
const BRICK_HEIGHT = 0.25;
/** 目地（モルタル）の幅 */
const MORTAR_WIDTH = 0.03;

/**
 * レンガパターンの色を計算する
 * @param hitX - レイキャストのヒット位置 X
 * @param hitY - レイキャストのヒット位置 Y
 * @param shade - シェーディング係数（0〜1）
 * @returns RGB の3要素タプル
 */
export const getBrickColor = (hitX: number, hitY: number, shade: number): [number, number, number] => {
  // レンガの繰り返しパターン
  const row = Math.floor(hitY / BRICK_HEIGHT);
  const offset = (row % 2) * BRICK_WIDTH * 0.5;
  const bx = (hitX + offset) % BRICK_WIDTH;
  const by = hitY % BRICK_HEIGHT;

  // 目地（モルタル）の判定
  const isMortar = bx < MORTAR_WIDTH || by < MORTAR_WIDTH;

  if (isMortar) {
    return [
      Math.floor(35 * shade),
      Math.floor(30 * shade),
      Math.floor(28 * shade),
    ];
  }

  // レンガ本体の色バリエーション
  const noise = Math.sin(hitX * 13.7 + hitY * 7.3) * 0.5 + 0.5;
  const r = (70 + noise * 20) * shade;
  const g = (38 + noise * 10) * shade;
  const b = (45 + noise * 12) * shade;
  return [Math.floor(r), Math.floor(g), Math.floor(b)];
};

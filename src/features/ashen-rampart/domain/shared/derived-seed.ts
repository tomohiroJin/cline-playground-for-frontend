/**
 * 灰燼の城壁 - 派生シード（反復6・設計書 §4.4）
 *
 * 遠征は1つのシードから「ステージ抽選」「各ステージのシャッフル」「獲得の3択」を
 * 決めるが、**1本のストリームを順に消費してはいけない。**
 *
 * 較正では「獲得する腕」と「獲得しない腕」を比べる（設計書 §8.2 の G1）。
 * 単一ストリームだと、獲得しない腕は3択の抽選を消費しないため以降の
 * シャッフルが全部ずれ、**獲得が無力でも必ず差が出る**。それでは
 * ゲートが何も検出しない。
 *
 * 目的ごとに独立したシードを導けば、両腕で同じシャッフルを共有できる。
 * FNV-1a を32bitで回すだけの純関数で、暗号強度は要らない
 * （必要なのは決定性と、目的間で相関しないこと）。
 */

/** 派生の目的。増やすときは衝突しない名前にすること */
export type SeedPurpose = 'stage-draw' | 'shuffle' | 'offer';

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * 元のシード・目的・添字から、独立したシードを導く
 *
 * 戻り値は 1 以上 0xffffffff 以下の整数。`SeededRandom` にそのまま渡せる。
 */
export const derivedSeed = (seed: number, purpose: SeedPurpose, index = 0): number => {
  const source = `${seed >>> 0}:${purpose}:${index}`;
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  // 0 を避ける（値域の下端を 1 にするだけで、分布は実用上変わらない）
  return (hash >>> 0) || 1;
};

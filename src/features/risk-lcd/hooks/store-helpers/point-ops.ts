import type { SaveData } from '../../types';

// PT を加算した新しい SaveData を返す
export function addPoints(data: SaveData, amount: number): SaveData {
  return { ...data, pts: data.pts + amount };
}

// PT を消費した新しい SaveData を返す（残高不足なら undefined）
export function spendPoints(data: SaveData, cost: number): SaveData | undefined {
  if (data.pts < cost) return undefined;
  return { ...data, pts: data.pts - cost };
}

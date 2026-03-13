import type { SaveData } from '../../types';

// 最大装備スロット数を計算
export function maxEquipSlots(data: SaveData): number {
  return data.ui.includes('slot3') ? 3 : data.ui.includes('slot2') ? 2 : 1;
}

// 装備をトグル（成功時は新しい SaveData、失敗時は undefined）
export function toggleEquip(data: SaveData, id: string): SaveData | undefined {
  // 未所持スタイルは装備できない
  if (!data.sty.includes(id)) return undefined;

  // 装備中のスタイルを外す
  if (data.eq.includes(id)) {
    // 最後の1つは外せない
    if (data.eq.length <= 1) return undefined;
    return { ...data, eq: data.eq.filter((x) => x !== id) };
  }

  // 新規装備（スロット上限を超える場合は最古を押し出す）
  const mx = maxEquipSlots(data);
  const newEq = [...data.eq];
  if (newEq.length >= mx) newEq.shift();
  newEq.push(id);
  return { ...data, eq: newEq };
}

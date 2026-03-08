/**
 * ツリーサービス
 *
 * 文明ツリーのボーナス計算、サマリー表示、難易度ラベルを担当する。
 */
import type { TreeBonus, TreeEffect, SaveData } from '../../types';
import { TREE, TB_DEFAULTS, DIFFS } from '../../constants';

/** ツリー購入状況からボーナスを集計する */
export function getTB(tree: Record<string, number>): TreeBonus {
  const b: TreeBonus = { ...TB_DEFAULTS };
  for (const id in tree) {
    if (!tree[id]) continue;
    const nd = TREE.find(x => x.id === id);
    if (nd) {
      for (const k of Object.keys(nd.e) as (keyof TreeEffect)[]) {
        const v = nd.e[k];
        if (v !== undefined) b[k] += v;
      }
    }
  }
  return b;
}

/** ツリーボーナスを表示用文字列に変換する */
export function tbSummary(tb: TreeBonus): string[] {
  const parts: string[] = [];
  const summaryDefs: { k: keyof TreeBonus; f: (v: number) => string }[] = [
    { k: 'bA', f: v => 'ATK+' + v }, { k: 'bH', f: v => 'HP+' + v },
    { k: 'bD', f: v => 'DEF+' + v }, { k: 'cr', f: v => '会心+' + (v * 100).toFixed(0) + '%' },
    { k: 'bM', f: v => '骨+' + (v * 100).toFixed(0) + '%' }, { k: 'dM', f: v => 'ダメ+' + (v * 100).toFixed(0) + '%' },
    { k: 'rg', f: v => '再生+' + (v * 100).toFixed(0) + '%' }, { k: 'rv', f: () => '復活' },
    { k: 'iR', f: v => '氷耐' + (v * 100).toFixed(0) + '%' }, { k: 'fR', f: v => '火耐' + (v * 100).toFixed(0) + '%' },
    { k: 'aS', f: v => '仲間枠+' + v }, { k: 'aH', f: v => '仲間HP+' + (v * 100).toFixed(0) + '%' },
    { k: 'aA', f: v => '仲間ATK+' + (v * 100).toFixed(0) + '%' }, { k: 'eN', f: v => '進化択+' + v },
    { k: 'sC', f: v => '初期Lv+' + v },
  ];
  summaryDefs.forEach(s => { if (tb[s.k]) parts.push(s.f(tb[s.k])); });
  return parts;
}

/** クリア済み難易度をアイコン+名前で返す */
export function bestDiffLabel(save: SaveData): string {
  const marks: string[] = [];
  DIFFS.forEach((d, i) => {
    if (save.best && save.best[i]) marks.push(d.ic + d.n);
  });
  return marks.join(' ');
}

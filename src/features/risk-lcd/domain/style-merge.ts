import type { MergedStyle } from '../types';
import { STY } from '../constants/game-config';

/**
 * 複数スタイルをマージする純粋関数
 *
 * マージ戦略:
 * - 倍率(mu): 各レーンの最大値を取る
 * - 速度修飾(wm, cm): 加算
 * - シールド(sh): 加算
 * - フリーズ(sp), 死亡ボーナス(db), クリアボーナス(cb): 最大値
 * - 制限レーン(rs): 和集合
 * - 予告セット(bfSet): 合計が小さい方を採用
 * - autoBlock: 1つでもあれば有効化
 *
 * 事前条件: ids.length > 0
 */
export function mergeStyles(ids: string[]): MergedStyle {
  if (ids.length === 0) throw new Error('mergeStyles: empty');
  const b: MergedStyle = {
    mu: [1, 2, 4],
    rs: [],
    sf: [],
    wm: 0,
    cm: 0,
    sh: 0,
    sp: 0,
    db: 0,
    cb: 0,
    bfSet: [0, 4, 6],
    autoBlock: 0,
  };
  ids.forEach(id => {
    const s = STY[id];
    if (!s) return;
    b.mu = b.mu.map((v, i) => Math.max(v, s.mu[i]));
    s.rs.forEach(r => {
      if (!b.rs.includes(r)) b.rs.push(r);
    });
    b.wm += s.wm;
    b.cm += s.cm;
    b.sh += s.sh;
    b.sp = Math.max(b.sp, s.sp);
    b.db = Math.max(b.db, s.db);
    b.cb = Math.max(b.cb, s.cb);
    if (s.autoBlock) b.autoBlock = 1;
    if (s.bfSet.reduce((a, c) => a + c, 0) < b.bfSet.reduce((a, c) => a + c, 0))
      b.bfSet = [...s.bfSet];
  });
  return b;
}

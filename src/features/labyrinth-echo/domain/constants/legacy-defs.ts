/**
 * 迷宮の残響 - 残響継承（先人レガシー）定義
 *
 * 先人の断片を全収集すると解禁されるトレードオフ型ビルド効果（5種）。
 * 効果は既存 FxState キーのみで表現する（combat-service 無改造）。
 */
import type { EchoLegacy } from '../models/echo';

/** レガシー定義一覧 */
export const LEGACIES: readonly EchoLegacy[] = Object.freeze([
  {
    id: 'lg_lian', predecessorId: 'p_lian', name: '記録者の継承', icon: '📜', color: '#60a5fa',
    upside: '初期情報+8・情報取得×1.3', downside: '回復×0.55・被ダメ+20%',
    fx: { infoBonus: 8, infoMult: 1.3, healMult: 0.55, hpReduce: 1.2 },
  },
  {
    id: 'lg_twins', predecessorId: 'p_twins', name: '絆の継承', icon: '♊', color: '#a0a0b8',
    upside: '一度だけ半分回復で復活', downside: '初期HP-10・初期精神-8',
    fx: { secondLife: true, hpBonus: -10, mentalBonus: -8 },
  },
  {
    id: 'lg_galen', predecessorId: 'p_galen', name: '解析者の継承', icon: '🗺', color: '#c084fc',
    upside: '危機・精神・遭遇の判定を緩和', downside: '精神被ダメ+30%',
    fx: { dangerSense: true, mentalSense: true, negotiator: true, mnReduce: 1.3 },
  },
  {
    id: 'lg_elna', predecessorId: 'p_elna', name: '守人の継承', icon: '🕯', color: '#fbbf24',
    upside: '侵蝕無効・出血半減・被ダメ-18%', downside: '初期HP-14・初期精神-12',
    fx: { drainImmune: true, bleedReduce: true, hpReduce: 0.82, mnReduce: 0.82, hpBonus: -14, mentalBonus: -12 },
  },
  {
    id: 'lg_first', predecessorId: 'p_first', name: '起源の継承', icon: '✶', color: '#ff8fa3',
    upside: '全ステ強化・回復×1.25・侵蝕無効', downside: '全被ダメ+40%（ガラスの大砲）',
    fx: { hpBonus: 10, mentalBonus: 10, infoBonus: 6, healMult: 1.25, drainImmune: true, hpReduce: 1.4, mnReduce: 1.4 },
  },
]);

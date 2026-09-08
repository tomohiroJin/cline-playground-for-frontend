/**
 * 灰燼の城壁 - 要求軸を落とした戦略【⚠️ 反証済み。測定に使ってはならない】
 *
 * **この道具は設計書 §8.2.15(a) で反証されている。**
 * 「軸が要るか」ではなく「デッキから何割の火力が抜けたか」を測っていた。
 *
 * 落ちる札の枚数とコストが軸ごとに大きく違う:
 *
 * | デッキ | 軸 | 置かなくなる枚数（12枚中） | その総コスト |
 * |---|---|---|---|
 * | swift | block | 2 | 2 |
 * | swift | anti-air | 3 | 8 |
 * | heavy | anti-air | 5 | 14 |
 * | heavy | mass-answer / heavy-hit | 3 | 13 |
 *
 * **決定的な反証**: 飛行が1体もいないステージ（`prov-t2-a` は雑兵・俊足・群れのみ）で
 * `anti-air` を落とすと、真の効果は定義上ゼロのはずなのに **差16** が出た。
 * 弩砲2枚と徹甲弩1枚＝このデッキの主火力が消えていただけである。
 *
 * **代わりに `axis-knockout.ts` の `knockoutDeck` を使う**
 * （札は同じ位置に残し、その軸の能力だけを消した変種へ差し替える）。
 *
 * 関数を残してあるのは §8.2.7 の実測を次に読む人へ渡すためで、
 * 現役の消費者は無い（`deployThenIdleStrategy` とは事情が違う）。
 */
import { greedyExcept, type Strategy } from '../combat/run-simulation';
import { axesOf, type DemandAxis } from './stage-definition';

/**
 * 指定した軸を持つ札を一切置かない戦略を作る
 *
 * 魔力炉は `axesOf` が空配列を返すので、どの軸を落としても許可される。
 * これは意図的で、マナ源を止めると「軸が要るか」ではなく
 * 「マナが足りるか」を測ってしまう（`noPureGroundAttackStrategy` と同じ理由）。
 */
export const withoutAxisStrategy = (axis: DemandAxis): Strategy =>
  greedyExcept((card) => !axesOf(card.id).includes(axis));

/**
 * 灰燼の城壁 - 要求軸を落とした戦略（反復6・設計書 §8.2.6(j)）
 *
 * ステージが宣言した要求軸を**実際に要求しているか**を監査するための道具。
 *
 * 撤回時の実測で、暫定ステージ6つのうち4つは経路を一切塞がない戦略が
 * 15/15 で勝った。宣言と実態が食い違っている。軸が勝敗に無関係なら、
 * 獲得の選び方の差は「軸に合っているか」ではなく、取る札のコストや
 * 生の火力で説明されてしまう。`G1'` の測定より前にここを確かめる。
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

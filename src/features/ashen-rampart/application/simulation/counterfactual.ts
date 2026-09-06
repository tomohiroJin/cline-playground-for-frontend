/**
 * 灰燼の城壁 - 反実仮想の再生（反復6・設計書 §8.2.6）
 *
 * 撤回された `G1` の事前登録第2条を実装する:
 * 「同一シード・同一操作列を再生し、獲得札だけを抜いて結果が変わるかを見る」。
 * 段階A は代わりに4戦略の勝率を比べており、条文を実行していなかった（§8.2.4(a)）。
 *
 * 遠征を1度走らせて各提示の内容と各回の選択を記録し、その選択列を
 * **最後の1回だけ**差し替えて再生する。最後に限るのは、それ以降に提示が
 * 無いため下流が乖離しないからである（§8.2.4(g)-3）。
 */
import { getCardDefinition } from '../../domain/cards/card-pool';
import { axesOf, type DemandAxis } from '../../domain/expedition/stage-definition';
import type { Strategy } from '../../domain/combat/run-simulation';
import type { SeededRandomFactory } from '../ports/random-port';
import {
  simulateExpedition,
  type AcquireStrategy,
  type ExpeditionSimulationResult,
} from './expedition-simulation';

const satisfiedCount = (cardId: string, demands: readonly DemandAxis[]): number =>
  axesOf(cardId).filter((axis) => demands.includes(axis)).length;

type SortDirection = 'ascending' | 'descending';

/**
 * 提示の中から軸スコア→コストの順に並べ替えて1枚選ぶ共通ロジック（G1 反復6 やり直し・設計書 §8.2.11）。
 *
 * `worstDemandAcquire` / `axisWorstAcquire` / `costWorstAcquire` の3戦略は
 * 「軸スコアの向き」と「同点時のコストの向き」の組み合わせが違うだけで、
 * 選定ロジック自体は同一である。3回書くと将来の修正が3か所に散るので、
 * 向きだけをパラメータにして共通化する。
 */
const acquireBySortOrder = (
  offer: readonly string[],
  demands: readonly DemandAxis[],
  axisOrder: SortDirection,
  costOrder: SortDirection
): string | undefined => {
  if (offer.length === 0) return undefined;
  const axisSign = axisOrder === 'descending' ? -1 : 1;
  const costSign = costOrder === 'descending' ? -1 : 1;
  return [...offer].sort((a, b) => {
    const axisDiff = axisSign * (satisfiedCount(a, demands) - satisfiedCount(b, demands));
    return axisDiff !== 0
      ? axisDiff
      : costSign * (getCardDefinition(a).cost - getCardDefinition(b).cost);
  })[0];
};

/**
 * 提示の中で、要求軸を満たす数が最も少ない札を選ぶ（同数ならコストが高いほう）
 *
 * 軸適合・コストの**両方**を基準の腕（`demandAwareAcquire`）から反転させた腕。
 * 単独では「軸が悪いから」なのか「コストが高いから」なのかを分離できない
 * （§8.2.11 反対解釈1）。分離には `axisWorstAcquire` / `costWorstAcquire` を使う。
 */
export const worstDemandAcquire: AcquireStrategy = (offer, nextDemands) =>
  acquireBySortOrder(offer, nextDemands, 'ascending', 'descending');

/**
 * 軸スコアだけを基準の腕（`demandAwareAcquire`）から反転させた腕（軸昇順・同点ならコスト昇順＝最安）。
 *
 * `demandAwareAcquire` と比べたとき、コストの同点処理は**両方とも「昇順＝最安」で揃っている**。
 * したがって `demandAwareAcquire` 対 `axisWorstAcquire` の差は**軸適合の効果だけ**を表す
 * （§8.2.11 反対解釈1 の分離）。
 */
export const axisWorstAcquire: AcquireStrategy = (offer, nextDemands) =>
  acquireBySortOrder(offer, nextDemands, 'ascending', 'ascending');

/**
 * コストの同点処理だけを基準の腕（`demandAwareAcquire`）から反転させた腕（軸降順＝基準と同じ・同点ならコスト降順＝最高）。
 *
 * 軸スコアの向きは `demandAwareAcquire` と**同じ**（降順＝良い軸を優先）。
 * したがって `demandAwareAcquire` 対 `costWorstAcquire` の差は、軸スコアに差が付かず
 * 同点処理まで下りた提示に限って現れる**コストの効果だけ**を表す
 * （§8.2.11 反対解釈1 の分離）。
 */
export const costWorstAcquire: AcquireStrategy = (offer, nextDemands) =>
  acquireBySortOrder(offer, nextDemands, 'descending', 'descending');

export interface CounterfactualInput {
  initialDeck: readonly string[];
  seed: number;
  strategy: Strategy;
  acquire: AcquireStrategy;
  randomFactory: SeededRandomFactory;
  /** 最後の提示で差し替える先の戦略。省略時は `worstDemandAcquire`（既存の挙動） */
  counterfactualAcquire?: AcquireStrategy;
}

export interface CounterfactualPair {
  /** 基準となる実ラン */
  actual: ExpeditionSimulationResult;
  /** 最後の獲得を抜いた再生（`G1a`）。獲得が1度も無ければ undefined */
  ablated: ExpeditionSimulationResult | undefined;
  /** 最後の提示を反実仮想側の獲得戦略（`counterfactualAcquire`）で取り直した再生（`G1b`）。差し替え先が無ければ undefined */
  swapped: ExpeditionSimulationResult | undefined;
  lastOffer: readonly string[] | undefined;
  /**
   * 何回目の提示を差し替えたか（0始まり）
   *
   * **提示 i はステージ i の後に起きるので、影響を受けるのはステージ i+1 以降である。**
   * ステージ i 以前の結果は両腕で完全に一致していなければならない（前提 P1・P3・P4）。
   * この添字が無いと、テストは「どこまでが一致すべきか」を知れない。
   */
  lastOfferIndex: number | undefined;
  lastTaken: string | undefined;
  swappedTo: string | undefined;
  /**
   * 反実仮想が交絡していないか
   *
   * **`false` の組を測定に使ってはならない。** §8.2.4(g)-3 の「下流に乖離が
   * 生じない」という論証は、抜く獲得がその遠征の**最後の提示**であるときにしか
   * 成り立たない。ステージ2 で敗北した遠征では最後の獲得はステージ1 後の提示であり、
   * 再生でステージ2 に勝つと実ランには存在しなかった2回目の提示が現れる。
   */
  isClean: boolean;
}

/** 記録した選択列をそのまま再生する獲得戦略。範囲外は「取らない」 */
const scriptedAcquire = (script: readonly (string | undefined)[]): AcquireStrategy => {
  let index = 0;
  return () => script[index++];
};

interface Recording {
  result: ExpeditionSimulationResult;
  offers: string[][];
  demands: DemandAxis[][];
  choices: (string | undefined)[];
}

const record = (input: CounterfactualInput): Recording => {
  const offers: string[][] = [];
  const demands: DemandAxis[][] = [];
  const choices: (string | undefined)[] = [];
  const wrapped: AcquireStrategy = (offer, nextDemands, deck) => {
    offers.push([...offer]);
    demands.push([...nextDemands]);
    const chosen = input.acquire(offer, nextDemands, deck);
    choices.push(chosen);
    return chosen;
  };
  return { result: simulateExpedition({ ...input, acquire: wrapped }), offers, demands, choices };
};

/** 記録した選択列の一部を差し替えて再生し、提示回数が増えていないかも返す */
const replay = (
  input: CounterfactualInput,
  script: readonly (string | undefined)[]
): { result: ExpeditionSimulationResult; offerCount: number } => {
  let offerCount = 0;
  const scripted = scriptedAcquire(script);
  const counting: AcquireStrategy = (offer, nextDemands, deck) => {
    offerCount++;
    return scripted(offer, nextDemands, deck);
  };
  return {
    result: simulateExpedition({ ...input, acquire: counting }),
    offerCount,
  };
};

export const runCounterfactual = (input: CounterfactualInput): CounterfactualPair => {
  const { result: actual, offers, demands, choices } = record(input);

  const lastIndex = choices.reduce(
    (found, choice, index) => (choice === undefined ? found : index),
    -1
  );
  const empty = {
    actual,
    ablated: undefined,
    swapped: undefined,
    lastOffer: undefined,
    lastOfferIndex: undefined,
    lastTaken: undefined,
    swappedTo: undefined,
    isClean: false,
  };
  if (lastIndex < 0) return empty;

  const lastOffer = offers[lastIndex] ?? [];
  const lastTaken = choices[lastIndex];
  // 抜く獲得より後に提示があった遠征は交絡している（上の isClean の説明を参照）
  const isLastOffer = lastIndex === offers.length - 1;

  const ablatedScript = [...choices];
  ablatedScript[lastIndex] = undefined;
  const ablated = replay(input, ablatedScript);

  const counterfactualAcquire = input.counterfactualAcquire ?? worstDemandAcquire;
  const counterfactualPick = counterfactualAcquire(lastOffer, demands[lastIndex] ?? [], []);
  const swappedTo = counterfactualPick === lastTaken ? undefined : counterfactualPick;
  const swapped = swappedTo === undefined
    ? undefined
    : replay(input, choices.map((c, i) => (i === lastIndex ? swappedTo : c)));

  // 再生で提示が増えていたら、実ランに無かった選択が生まれている
  const noExtraOffers =
    ablated.offerCount === offers.length
    && (swapped === undefined || swapped.offerCount === offers.length);

  return {
    actual,
    ablated: ablated.result,
    swapped: swapped?.result,
    lastOffer,
    lastOfferIndex: lastIndex,
    lastTaken,
    swappedTo,
    isClean: isLastOffer && noExtraOffers,
  };
};

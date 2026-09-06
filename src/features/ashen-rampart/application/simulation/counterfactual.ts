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

/** 提示の中で、要求軸を満たす数が最も少ない札を選ぶ（同数ならコストが高いほう） */
export const worstDemandAcquire: AcquireStrategy = (offer, nextDemands) => {
  if (offer.length === 0) return undefined;
  return [...offer].sort(
    (a, b) => satisfiedCount(a, nextDemands) - satisfiedCount(b, nextDemands)
      || getCardDefinition(b).cost - getCardDefinition(a).cost
  )[0];
};

const satisfiedCount = (cardId: string, demands: readonly DemandAxis[]): number =>
  axesOf(cardId).filter((axis) => demands.includes(axis)).length;

export interface CounterfactualInput {
  initialDeck: readonly string[];
  seed: number;
  strategy: Strategy;
  acquire: AcquireStrategy;
  randomFactory: SeededRandomFactory;
}

export interface CounterfactualPair {
  /** 基準となる実ラン */
  actual: ExpeditionSimulationResult;
  /** 最後の獲得を抜いた再生（`G1a`）。獲得が1度も無ければ undefined */
  ablated: ExpeditionSimulationResult | undefined;
  /** 最後の提示で最も要求に合わない札を取った再生（`G1b`）。差し替え先が無ければ undefined */
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

  const worst = worstDemandAcquire(lastOffer, demands[lastIndex] ?? [], []);
  const swappedTo = worst === lastTaken ? undefined : worst;
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

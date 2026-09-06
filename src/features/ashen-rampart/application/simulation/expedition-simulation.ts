/**
 * 灰燼の城壁 - 遠征のシミュレーション（反復6・設計書 §8.2）
 *
 * **application 層に置く。** use-case（startExpedition / startStage / advanceStage）を
 * 組み立てるため、domain に置くと domain → application の逆流になる。
 * `domain/combat/run-simulation.ts` が domain にあるのは、あれが domain だけで
 * 完結しているからである。
 *
 * **獲得戦略を1本にしない。** どんな獲得戦略も人間とは違う癖を持つので、
 * 「獲得機構の効果」と「その戦略の癖」を分離するには複数要る（設計書 §8.2）。
 * とくに `greedyAcquire`（最も高コストを取る）は単独で使わないこと——
 * マナが唯一の律速である `greedyStrategy` にとって
 * **最も打てない札を選び続ける戦略**であり、差の符号が解釈できない。
 */
import type { RandomFn } from '../../domain/shared/random';
import type { SeededRandomFactory } from '../ports/random-port';
import { getCardDefinition } from '../../domain/cards/card-pool';
import { simulateRun, type Strategy } from '../../domain/combat/run-simulation';
import { startExpedition, startStage } from '../use-cases/start-expedition';
import { advanceStage } from '../use-cases/advance-stage';
import {
  chooseAcquisition, declineOffer, currentStage,
  type ExpeditionOutcome, type ExpeditionState,
} from '../../domain/expedition/expedition-state';
import { axesOf, type DemandAxis } from '../../domain/expedition/stage-definition';

/** 3択から1枚を選ぶ。`undefined` は「取らない」 */
export type AcquireStrategy = (
  offer: readonly string[],
  nextDemands: readonly DemandAxis[],
  deck: readonly string[]
) => string | undefined;

export const noAcquire: AcquireStrategy = () => undefined;

const costOf = (id: string): number => getCardDefinition(id).cost;

export const cheapestAcquire: AcquireStrategy = (offer) =>
  [...offer].sort((a, b) => costOf(a) - costOf(b))[0];

export const randomAcquireOf =
  (rng: RandomFn): AcquireStrategy =>
  (offer) =>
    offer[Math.min(offer.length - 1, Math.floor(rng() * offer.length))];

/** 次のステージの要求軸を最も多く満たす札を選ぶ。同点なら安いほう */
export const demandAwareAcquire: AcquireStrategy = (offer, nextDemands) => {
  if (offer.length === 0) return undefined;
  const score = (id: string): number =>
    axesOf(id).filter((axis) => nextDemands.includes(axis)).length;
  return [...offer].sort((a, b) => score(b) - score(a) || costOf(a) - costOf(b))[0];
};

export interface StageOutcome {
  stageId: string;
  won: boolean;
  ticks: number;
  lifeLeft: number;
  cardsPlayed: number;
}

export interface ExpeditionSimulationResult {
  outcome: ExpeditionOutcome;
  stagesCleared: number;
  reachedTier3: boolean;
  lifeLeft: number;
  acquired: readonly string[];
  stageOutcomes: readonly StageOutcome[];
}

/**
 * `simulateExpedition` の入力
 *
 * 位置引数4つはコーディング規約（パラメータは3個以内、超える場合はオブジェクトに
 * まとめる）に反するうえ、`strategy` と `acquire` はどちらも関数で
 * 取り違えても型が通ってしまう。名前付きにして取り違えを構造的に防ぐ。
 */
export interface ExpeditionSimulationInput {
  initialDeck: readonly string[];
  seed: number;
  /** 盤面の戦略（どこに何を置くか） */
  strategy: Strategy;
  /** 獲得の戦略（3択から何を選ぶか） */
  acquire: AcquireStrategy;
  /**
   * シードから乱数源を作る factory（反復6 最終レビュー指摘 I1）
   *
   * `startExpedition` / `startStage` / `advanceStage` が要求する。
   * ここで受け取って渡すだけにし、application 層が
   * `infrastructure/random/seeded-random` を直接 import しないようにする。
   */
  randomFactory: SeededRandomFactory;
}

/** 遠征を最後まで回す */
export const simulateExpedition = ({
  initialDeck,
  seed,
  strategy,
  acquire,
  randomFactory,
}: ExpeditionSimulationInput): ExpeditionSimulationResult => {
  let exp: ExpeditionState = startExpedition(initialDeck, seed, randomFactory);
  const stageOutcomes: StageOutcome[] = [];
  let reachedTier3 = false;

  while (exp.phase !== 'ended') {
    const stage = currentStage(exp);
    if (!stage) break;
    if (stage.tier === 3) reachedTier3 = true;

    const run = simulateRun(startStage(exp, randomFactory), strategy, stage.map);
    const won = run.outcome === 'won';
    stageOutcomes.push({
      stageId: stage.id,
      won,
      ticks: run.ticks,
      lifeLeft: run.lifeLeft,
      cardsPlayed: run.cardsPlayed,
    });

    exp = advanceStage(exp, { won, lifeLeft: run.lifeLeft }, randomFactory);
    if (exp.phase !== 'offer') continue;

    const nextDemands = currentStage(exp)?.demands ?? [];
    const picked = acquire(exp.offer, nextDemands, exp.deckCards);
    exp = picked === undefined ? declineOffer(exp) : chooseAcquisition(exp, picked);
  }

  return {
    outcome: exp.outcome,
    stagesCleared: stageOutcomes.filter((s) => s.won).length,
    reachedTier3,
    lifeLeft: exp.life,
    acquired: exp.acquired,
    stageOutcomes,
  };
};

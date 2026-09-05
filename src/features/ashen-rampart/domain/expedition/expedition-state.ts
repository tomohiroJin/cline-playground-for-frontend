/**
 * 灰燼の城壁 - 遠征の状態（反復6・設計書 §4.1 / §4.3）
 *
 * ローグライト。3ステージ連続。ライフは持ち越し、負けたら遠征終了で
 * 獲得したカードも失う。盤面の設置物はステージごとにリセットされる
 * （`CombatState` をステージごとに作り直すため、ここでは何もしない）。
 *
 * **`CombatState` は遠征を知らない。** 参照は一方向である（設計書 §4.2）。
 *
 * **乱数を持たない。** 獲得の3択を抽選するのは application 層で、
 * ここは `presentOffer` で結果を受け取るだけにしてある。
 * 遷移を `completeStage` / `presentOffer` / `chooseAcquisition` の3つに
 * 割っているのはこのためである。`completeStage` に rng を渡すと
 * domain が乱数を持つことになり、層別の設計が崩れる
 * （既存の `createDeck` が `RandomFn` を受け取るのと同じ方針）。
 */
import { applyAcquisition } from './acquisition';
import type { StageDefinition } from './stage-definition';
import { LIFE_INITIAL, STAGE_CLEAR_HEAL } from '../combat/combat-state';

export type ExpeditionPhase = 'stage' | 'offer' | 'ended';
export type ExpeditionOutcome = 'running' | 'cleared' | 'failed';

/** ステージの決着。`lifeLeft` は決着時点の残ライフ */
export interface StageResult {
  won: boolean;
  lifeLeft: number;
}

export interface ExpeditionState {
  seed: number;
  stages: readonly StageDefinition[];
  /** これから挑む（または挑んでいる）ステージの添字 */
  stageIndex: number;
  /**
   * 構築時の12枚。**遠征を通じて変わらない。**
   *
   * シャッフルは常にこの配列に対して行い、獲得した札は山札の固定位置へ
   * 挿入する（設計書 §8.2）。獲得を含めた配列をシャッフルすると、
   * **枚数が変わるだけでシャッフルが全面的に変わり、獲得する腕と
   * しない腕を比較できなくなる**——G1 が反転した初版の欠陥そのものである。
   */
  initialDeckCards: readonly string[];
  /** initialDeckCards ＋ acquired。表示と検証に使う */
  deckCards: readonly string[];
  life: number;
  /** 獲得の3択。空なら提示なし */
  offer: readonly string[];
  acquired: readonly string[];
  phase: ExpeditionPhase;
  outcome: ExpeditionOutcome;
}

export const createExpedition = (
  seed: number,
  initialDeck: readonly string[],
  stages: readonly StageDefinition[]
): ExpeditionState => ({
  seed,
  stages,
  stageIndex: 0,
  initialDeckCards: [...initialDeck],
  deckCards: [...initialDeck],
  life: LIFE_INITIAL,
  offer: [],
  acquired: [],
  phase: 'stage',
  outcome: 'running',
});

export const currentStage = (exp: ExpeditionState): StageDefinition | undefined =>
  exp.stages[exp.stageIndex];

/**
 * ステージの決着を反映する
 *
 * 勝ち: ライフを持ち越して回復し、次のステージがあれば獲得の提示へ。
 *       **回復は `LIFE_INITIAL` を上限とする**——上限が無いと
 *       無失点のプレイでライフが際限なく増え、難度カーブが消える。
 * 負け: 遠征終了。
 */
export const completeStage = (exp: ExpeditionState, result: StageResult): ExpeditionState => {
  if (exp.phase === 'ended') {
    throw new Error('遠征は既に終了しています');
  }
  if (!result.won) {
    return { ...exp, life: result.lifeLeft, phase: 'ended', outcome: 'failed' };
  }
  const nextIndex = exp.stageIndex + 1;
  const healed = Math.min(LIFE_INITIAL, result.lifeLeft + STAGE_CLEAR_HEAL);
  if (nextIndex >= exp.stages.length) {
    return { ...exp, life: healed, stageIndex: nextIndex, phase: 'ended', outcome: 'cleared' };
  }
  return { ...exp, life: healed, stageIndex: nextIndex, phase: 'offer' };
};

/** 抽選された3択を載せる（抽選そのものは application が行う） */
export const presentOffer = (
  exp: ExpeditionState,
  offer: readonly string[]
): ExpeditionState => ({ ...exp, offer: [...offer], phase: 'offer' });

/** 3択から1枚を選ぶ */
export const chooseAcquisition = (exp: ExpeditionState, cardId: string): ExpeditionState => {
  if (exp.phase !== 'offer') {
    throw new Error('獲得の提示中ではありません');
  }
  return {
    ...exp,
    deckCards: applyAcquisition(exp.deckCards, exp.offer, cardId),
    acquired: [...exp.acquired, cardId],
    offer: [],
    phase: 'stage',
  };
};

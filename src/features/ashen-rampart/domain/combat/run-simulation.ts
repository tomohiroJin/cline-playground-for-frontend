/**
 * 灰燼の城壁 - UI 抜きでランを丸ごと回すヘルパー（テスト用）
 *
 * stepTick が純粋関数であることの見返り。バランス較正と
 * 支配戦略の検出を自動テストとして常設できる（設計書 §7）。
 */
import type { StageMap } from '../board/stage-map';
import { allPathCells, offPathCells } from '../board/stage-map';
import type { CombatState } from './combat-state';
import { stepTick, canPlaceAt, type PlayerAction } from './step-tick';
import { getCardDefinition } from '../cards/card-pool';
import { placementKindOf } from '../cards/card-definition';

/** その tick に何をするかを決める関数。プレイヤーの代役 */
export type Strategy = (state: CombatState, map: StageMap) => PlayerAction[];

export interface RunSimulationResult {
  outcome: CombatState['outcome'];
  ticks: number;
  lifeLeft: number;
  cardsPlayed: number;
  finalState: CombatState;
}

/** 安全弁。ラン長 950 tick を大きく超えたら打ち切る */
export const SIMULATION_MAX_TICKS = 3000;

export const simulateRun = (
  initial: CombatState,
  strategy: Strategy,
  map: StageMap
): RunSimulationResult => {
  let state = initial;
  let cardsPlayed = 0;
  while (state.outcome === 'playing' && state.tick < SIMULATION_MAX_TICKS) {
    const actions = strategy(state, map);
    state = stepTick(state, actions, map);
    cardsPlayed += state.events.filter((e) => e.kind === 'played').length;
  }
  return {
    outcome: state.outcome,
    ticks: state.tick,
    lifeLeft: state.life,
    cardsPlayed,
    finalState: state,
  };
};

/**
 * 素直な戦略: 置けるなら手札の先頭から置ける札を置き、燠火は点火できるなら点火する
 *
 * 人間の上手さを模さない。「雑に遊んでも勝ててしまうか」を測るための下限。
 */
export const greedyStrategy: Strategy = (state, map) => {
  const actions: PlayerAction[] = [];
  state.embers.forEach((ember, emberIndex) => {
    if (ember.cooldownLeft === 0) actions.push({ kind: 'reactivate', emberIndex });
  });
  // 徴発の候補を放置すると山札が減り続けて実質デッキが痩せるため、
  // 常に先頭を選ぶ。候補を評価して選ぶ賢い戦略にはしない（下限を測る道具のため）。
  if (state.levyOptions.length > 0) {
    actions.push({ kind: 'choose-levy', optionIndex: 0 });
  }
  for (let handIndex = 0; handIndex < state.deck.hand.length; handIndex++) {
    const cardId = state.deck.hand[handIndex];
    if (cardId === undefined) continue;
    const card = getCardDefinition(cardId);
    if (card.cost > state.mana) continue;
    // 魔力炉はクールダウン中なら飛ばす。他の札はマナが唯一の律速で妨げられない
    if (card.type === 'reactor' && state.placeCooldown > 0) continue;
    const kind = placementKindOf(card);
    if (kind === 'none') {
      actions.push({ kind: 'play-card', handIndex });
      return actions;
    }
    const candidates = kind === 'path' ? allPathCells(map) : offPathCells(map);
    const pos = candidates.find((c) => canPlaceAt(state, card, c, map));
    if (pos) {
      actions.push({ kind: 'play-card', handIndex, pos });
      return actions;
    }
  }
  return actions;
};

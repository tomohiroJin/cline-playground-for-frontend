/**
 * 灰燼の城壁 - UI 抜きでランを丸ごと回すヘルパー（テスト用）
 *
 * stepTick が純粋関数であることの見返り。バランス較正と
 * 支配戦略の検出を自動テストとして常設できる（設計書 §7）。
 */
import type { CellPos, StageMap } from '../board/stage-map';
import { allPathCells, isPathCell } from '../board/stage-map';
import type { CombatState } from './combat-state';
import { stepTick, placeableCells, type PlayerAction } from './step-tick';
import { getCardDefinition } from '../cards/card-pool';
import { placementKindOf, type CardDefinition } from '../cards/card-definition';

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

/** そのセルから最も近い経路セルまでの距離 */
const distanceToPath = (map: StageMap, pos: CellPos): number =>
  allPathCells(map).reduce(
    (min, c) => Math.min(min, Math.hypot(c.x - pos.x, c.y - pos.y)),
    Infinity
  );

/**
 * その札を置くべき場所を選ぶ
 *
 * 設置マスの規則が消えたため、候補には射程がまったく届かないマスも含まれる。
 * 先頭を機械的に取ると隅に塔が並び、較正が「隅に置いた勝率」になってしまう。
 *
 * - 攻撃しない守り手（石壁）… 経路上（止めることが仕事のため）
 * - 攻撃する守り手・オーラ … 射程が経路に届くマスのうち、経路に最も近いもの
 * - 罠 … 経路上
 * - 魔力炉 … 経路外のどこでも（攻撃も妨害もしないため）
 */
const choosePlacement = (
  state: CombatState,
  card: CardDefinition,
  map: StageMap,
  /** 追加の絞り込み。Task 14 の戦略変種が使う */
  allow: (pos: CellPos) => boolean = () => true
): CellPos | undefined => {
  const candidates = placeableCells(state, card, map).filter(allow);
  if (card.type === 'reactor') return candidates[0];
  const spec = card.tower;
  const wantsPath = card.type === 'trap' || card.type === 'ember' ||
    (spec !== undefined && spec.damage === 0 && spec.aura === undefined);
  if (wantsPath) return candidates.find((c) => isPathCell(map, c));
  // 射程（オーラ分は見ない。素の射程で届く場所を選ぶ）が経路に届くマスのうち、最も近いもの
  const reach = spec?.range ?? 0;
  return candidates
    .filter((c) => distanceToPath(map, c) <= reach)
    .sort((a, b) => distanceToPath(map, a) - distanceToPath(map, b))[0];
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
    const pos = choosePlacement(state, card, map);
    if (pos) {
      actions.push({ kind: 'play-card', handIndex, pos });
      return actions;
    }
  }
  return actions;
};

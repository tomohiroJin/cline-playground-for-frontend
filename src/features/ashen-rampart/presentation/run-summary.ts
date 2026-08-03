/**
 * 灰燼の城壁 - 判定7項目の集計（純粋）
 *
 * 反復1 では判定項目が未集計のまま判定された。ログはブラウザの
 * localStorage にあり開発側から読めないため、**画面に出す**。
 * ここは集計の計算だけを持ち、表示は RunSummary.tsx が持つ。
 */
import type { CellPos, StageMap } from '../domain/board/stage-map';
import { allPathCells, offPathCells } from '../domain/board/stage-map';
import { getCardDefinition } from '../domain/cards/card-pool';
import { placementKindOf } from '../domain/cards/card-definition';
import type { CombatState, TickEvent } from '../domain/combat/combat-state';
import { canPlaceAt } from '../domain/combat/step-tick';

type RejectionReason = Extract<TickEvent, { kind: 'rejected' }>['reason'];

export interface RunTally {
  /** カード id ごとの撃破数（撃破源のカードで数える） */
  defeatsByCard: Record<string, number>;
  /** 篝火の隣接オーラで増えた与ダメージの累計 */
  beaconBonusDamage: number;
  /** 鍛冶場の射程延長で初めて届いた射撃の回数 */
  forgeExtendedShots: number;
  /** 拒否の理由別回数 */
  rejections: Record<RejectionReason, number>;
  /** 徴発を使った回数 */
  levyPlayed: number;
  /** 徴発の選択が成立した回数 */
  levyResolved: number;
  /** 配置が成立した瞬間に選べたマス数の履歴 */
  placeableCounts: number[];
  /** 最初の魔力炉が置かれた tick。未設置なら undefined */
  firstReactorTick?: number;
  /** 手札が非空で1枚も払えなかった tick 数 */
  manaStarvedTicks: number;
  /** 一度でも場に出たカード id */
  playedCardIds: Set<string>;
}

export const emptyTally = (): RunTally => ({
  defeatsByCard: {},
  beaconBonusDamage: 0,
  forgeExtendedShots: 0,
  rejections: { cooldown: 0, mana: 0, target: 0, occupied: 0, pending: 0 },
  levyPlayed: 0,
  levyResolved: 0,
  placeableCounts: [],
  firstReactorTick: undefined,
  manaStarvedTicks: 0,
  playedCardIds: new Set(),
});

/** 撃破源に対応するカード id */
const sourceCardId = (
  state: CombatState,
  source: Extract<TickEvent, { kind: 'defeat' }>['source']
): string | undefined => {
  if (source.kind === 'tower') return state.towers[source.index]?.cardId;
  if (source.kind === 'trap') return state.traps[source.index]?.cardId;
  // PlacedEmber はカード種別を持たない（ドメインの制約）ため、ember 由来の撃破は
  // 固定文字列で代表させている。これは「燠火カードが常に1種類（ember-blast）」
  // という現状のカードプールの前提の上でのみ正しい。燠火カードが2種類目に
  // 増えた瞬間、この固定値は静かに誤帰属する（どちらの燠火が倒したか区別できない）。
  // そのときは PlacedEmber に cardId を持たせるドメイン変更とセットで直すこと。
  return 'ember-blast';
};

/**
 * その盤面でそのカードを置けるマスの数
 *
 * UI の選択状態ではなく prevState から機械的に再計算する。
 * UI 由来にすると、拒否されたクリックまで数えてしまう。
 */
const placeableCountFor = (
  state: CombatState,
  cardId: string,
  map: StageMap
): number => {
  const card = getCardDefinition(cardId);
  const kind = placementKindOf(card);
  if (kind === 'none') return 0;
  // useAshenRampartGame の placeableCells と同じ判定を使う。
  // 独自に card.type で分けると、盤面に置く札の判定が2箇所に分かれて食い違う
  const candidates: readonly CellPos[] = kind === 'path' ? allPathCells(map) : offPathCells(map);
  return candidates.filter((pos) => canPlaceAt(state, card, pos, map)).length;
};

/** 手札に1枚も払える札が無い（かつ手札が空でない）か */
const isManaStarved = (state: CombatState): boolean =>
  state.deck.hand.length > 0 &&
  state.deck.hand.every((id) => getCardDefinition(id).cost > state.mana);

/** この tick のイベントを累積する */
export const accumulateTick = (
  tally: RunTally,
  prevState: CombatState,
  state: CombatState,
  map: StageMap
): RunTally => {
  const next: RunTally = {
    ...tally,
    defeatsByCard: { ...tally.defeatsByCard },
    rejections: { ...tally.rejections },
    placeableCounts: [...tally.placeableCounts],
    playedCardIds: new Set(tally.playedCardIds),
  };

  state.events.forEach((event) => {
    if (event.kind === 'defeat') {
      const cardId = sourceCardId(state, event.source);
      if (cardId) next.defeatsByCard[cardId] = (next.defeatsByCard[cardId] ?? 0) + 1;
      return;
    }
    if (event.kind === 'shot') {
      next.beaconBonusDamage += event.auraDamageBonus;
      if (event.beyondBaseRange) next.forgeExtendedShots += 1;
      return;
    }
    if (event.kind === 'rejected') {
      next.rejections[event.reason] += 1;
      return;
    }
    if (event.kind === 'played') {
      next.playedCardIds.add(event.cardId);
      if (event.cardId === 'levy') next.levyPlayed += 1;
      if (event.cardId === 'reactor' && next.firstReactorTick === undefined) {
        next.firstReactorTick = state.tick;
      }
      if (event.pos) {
        next.placeableCounts.push(placeableCountFor(prevState, event.cardId, map));
      }
    }
  });

  // 徴発の選択成立（候補が出ていた状態から空になった遷移）
  if (prevState.levyOptions.length > 0 && state.levyOptions.length === 0) {
    next.levyResolved += 1;
  }

  if (isManaStarved(state)) next.manaStarvedTicks += 1;

  return next;
};

export interface RunSummaryView {
  defeats: { name: string; count: number }[];
  beaconBonusDamage: number;
  forgeExtendedShots: number;
  rejectionTotal: number;
  rejectionDetail: { label: string; count: number }[];
  levyPlayed: number;
  levyResolved: number;
  placeableAverage: number;
  placeableMin: number;
  firstReactorTick?: number;
  manaStarvedTicks: number;
  unusedCardNames: string[];
}

const REJECTION_LABEL: Record<RejectionReason, string> = {
  cooldown: '設置間隔',
  mana: 'マナ不足',
  target: '置けない場所',
  occupied: '設置済み',
  pending: '徴発の選択待ち',
};

/** 集計を表示用に整える */
export const summarize = (tally: RunTally, deckCards: readonly string[]): RunSummaryView => {
  const counts = tally.placeableCounts;
  const unused = [...new Set(deckCards)].filter((id) => !tally.playedCardIds.has(id));
  return {
    defeats: Object.entries(tally.defeatsByCard)
      .map(([id, count]) => ({ name: getCardDefinition(id).name, count }))
      .sort((a, b) => b.count - a.count),
    beaconBonusDamage: tally.beaconBonusDamage,
    forgeExtendedShots: tally.forgeExtendedShots,
    rejectionTotal: Object.values(tally.rejections).reduce((sum, n) => sum + n, 0),
    rejectionDetail: (Object.keys(REJECTION_LABEL) as RejectionReason[])
      .filter((reason) => tally.rejections[reason] > 0)
      .map((reason) => ({ label: REJECTION_LABEL[reason], count: tally.rejections[reason] })),
    levyPlayed: tally.levyPlayed,
    levyResolved: tally.levyResolved,
    placeableAverage:
      counts.length === 0 ? 0 : counts.reduce((sum, n) => sum + n, 0) / counts.length,
    placeableMin: counts.length === 0 ? 0 : Math.min(...counts),
    firstReactorTick: tally.firstReactorTick,
    manaStarvedTicks: tally.manaStarvedTicks,
    unusedCardNames: unused.map((id) => getCardDefinition(id).name),
  };
};

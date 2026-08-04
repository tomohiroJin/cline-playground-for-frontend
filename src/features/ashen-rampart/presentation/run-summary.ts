/**
 * 灰燼の城壁 - 判定7項目の集計（純粋）
 *
 * 反復1 では判定項目が未集計のまま判定された。ログはブラウザの
 * localStorage にあり開発側から読めないため、**画面に出す**。
 * ここは集計の計算だけを持ち、表示は RunSummary.tsx が持つ。
 *
 * 反復3 で集計項目を設計書 §9.1 の7項目（表示は6項目、7項目目「前回より
 * 面白くなったか」は数値化できないため画面には出ない）に差し替えた。
 * 集計は tick ごとに置き換わる `state.events` だけを見るため、
 * 反復2 まで受け取っていた `prevState` はもう不要（配置時に選べたマス数の
 * 集計を廃止したため）——引数からも外した。
 */
import type { CellPos, StageMap } from '../domain/board/stage-map';
import { isPathCell, laneOf } from '../domain/board/stage-map';
import { getCardDefinition } from '../domain/cards/card-pool';
import { placementKindOf } from '../domain/cards/card-definition';
import type { CombatState, TickEvent } from '../domain/combat/combat-state';

type RejectionReason = Extract<TickEvent, { kind: 'rejected' }>['reason'];

/** 経路上の位置（レーンとレーン内 index） */
interface LaneCell {
  laneIndex: number;
  index: number;
}

/** コスト帯の区分数。設計書 §7.1 でコスト帯を 0〜5 に広げたことに合わせる */
const COST_BUCKET_COUNT = 6;

/** 項目5 が対象にする敵種。鴉以外の撃破位置は判定に使わないため集計しない */
const RAVEN_ENEMY_ID = 'raven';

export interface RunTally {
  /** 項目1: レーンごとの配置数（前線=経路上に置いた守り手の数） */
  laneAllocation: number[];
  /** 項目2: 経路上に置いた守り手（ブロッカー）のレーン内位置 */
  blockerPositions: LaneCell[];
  /** 項目3: 失った守り手（カードIDごとの数） */
  unitsLost: Record<string, number>;
  /** 項目4: 経路上／経路外に置いた守り手の数 */
  placedOnPath: number;
  placedOffPath: number;
  /** 項目5: 鴉を倒したときの進捗比（0 = 入口、1 = 砦） */
  ravenDefeatProgress: number[];
  /** 項目6: 使ったカードのコスト別回数（index = コスト） */
  costHistogram: number[];
  /** 項目6: 一度でも場に出たカード id（使わなかった札の算出に使う） */
  playedCardIds: Set<string>;
  /** 補助: 拒否理由の内訳（配置クールダウンを魔力炉限定にした変更が効いたかの確認用。設計書 §7.1） */
  rejectionCounts: Record<RejectionReason, number>;
  /** 守り手別の撃破数（反復2 から引き継ぐ） */
  defeatsByUnit: Record<string, number>;
  /** 篝火の隣接オーラで増えた与ダメージの累計（反復2 から引き継ぐ） */
  beaconBonusDamage: number;
  /** 鍛冶場の射程延長で初めて届いた射撃の回数（反復2 から引き継ぐ） */
  forgeExtendedShots: number;
}

export const emptyTally = (): RunTally => ({
  laneAllocation: [],
  blockerPositions: [],
  unitsLost: {},
  placedOnPath: 0,
  placedOffPath: 0,
  ravenDefeatProgress: [],
  costHistogram: new Array(COST_BUCKET_COUNT).fill(0) as number[],
  playedCardIds: new Set(),
  rejectionCounts: { cooldown: 0, mana: 0, target: 0, occupied: 0, pending: 0 },
  defeatsByUnit: {},
  beaconBonusDamage: 0,
  forgeExtendedShots: 0,
});

/** 撃破源に対応するカード id */
const sourceCardId = (
  state: CombatState,
  source: Extract<TickEvent, { kind: 'defeat' }>['source']
): string | undefined => {
  if (source.kind === 'unit') return state.units[source.index]?.cardId;
  if (source.kind === 'trap') return state.traps[source.index]?.cardId;
  // PlacedEmber はカード種別を持たない（ドメインの制約）ため、ember 由来の撃破は
  // 固定文字列で代表させている。これは「燠火カードが常に1種類（ember-blast）」
  // という現状のカードプールの前提の上でのみ正しい。燠火カードが2種類目に
  // 増えた瞬間、この固定値は静かに誤帰属する（どちらの燠火が倒したか区別できない）。
  // そのときは PlacedEmber に cardId を持たせるドメイン変更とセットで直すこと。
  return 'ember-blast';
};

/** pos が経路上ならその所属レーンとレーン内 index を返す（経路外なら undefined） */
const laneCellOf = (map: StageMap, pos: CellPos): LaneCell | undefined => {
  for (let laneIndex = 0; laneIndex < map.lanes.length; laneIndex++) {
    const index = laneOf(map, laneIndex).findIndex((c) => c.x === pos.x && c.y === pos.y);
    if (index >= 0) return { laneIndex, index };
  }
  return undefined;
};

/** レーン別配置数を1増やす（存在しない index までは 0 埋めで拡張する） */
const incrementLaneAllocation = (allocation: number[], laneIndex: number): void => {
  while (allocation.length <= laneIndex) allocation.push(0);
  allocation[laneIndex] += 1;
};

/** state と map をまとめた文脈。'defeat' 集計はこの2つを同時に必要とする（パラメータ3個超過を避けるため） */
interface DefeatContext {
  state: CombatState;
  map: StageMap;
}

/**
 * 'defeat' イベントを集計する（守り手別撃破 + 項目5: 鴉の撃破位置）
 *
 * 撃破された敵は resolveDamage で alive:false になるだけで state.enemies から
 * 消えないため、同じ tick の state から enemyId で引ける（stepTick の契約）。
 */
const applyDefeatEvent = (
  next: RunTally,
  event: Extract<TickEvent, { kind: 'defeat' }>,
  ctx: DefeatContext
): void => {
  const cardId = sourceCardId(ctx.state, event.source);
  if (cardId) next.defeatsByUnit[cardId] = (next.defeatsByUnit[cardId] ?? 0) + 1;

  const enemy = ctx.state.enemies.find((e) => e.id === event.enemyId);
  if (!enemy || enemy.enemyId !== RAVEN_ENEMY_ID) return;
  const goal = laneOf(ctx.map, enemy.laneIndex).length - 1;
  if (goal <= 0) return;
  next.ravenDefeatProgress.push(enemy.progress / goal);
};

/**
 * 'played' イベントを集計する（項目1・2・4・6）
 *
 * コスト帯・使用札はカード種を問わず数える（項目6は札全体の分布を見る指標のため）。
 * 前線の配分（項目1・2・4）は守り手（ブロッカー）だけを対象にする。罠・燠火は
 * 経路限定、魔力炉は経路外限定と置ける場所自体が固定されているため、含めると
 * 経路上/外の比率が常に両端へ振れなくなり、判定として機能しなくなる（設計書 §9.1）。
 */
const applyPlayedEvent = (next: RunTally, event: Extract<TickEvent, { kind: 'played' }>, map: StageMap): void => {
  const card = getCardDefinition(event.cardId);
  next.playedCardIds.add(event.cardId);
  next.costHistogram[card.cost] = (next.costHistogram[card.cost] ?? 0) + 1;

  if (!event.pos || placementKindOf(card) !== 'unit') return;
  if (!isPathCell(map, event.pos)) {
    next.placedOffPath += 1;
    return;
  }
  next.placedOnPath += 1;
  const cell = laneCellOf(map, event.pos);
  if (!cell) return;
  next.blockerPositions.push(cell);
  incrementLaneAllocation(next.laneAllocation, cell.laneIndex);
};

/** 'unit-lost' イベントを集計する（項目3） */
const applyUnitLostEvent = (next: RunTally, event: Extract<TickEvent, { kind: 'unit-lost' }>): void => {
  next.unitsLost[event.cardId] = (next.unitsLost[event.cardId] ?? 0) + 1;
};

/** 'shot' イベントを集計する（支援2種の貢献） */
const applyShotEvent = (next: RunTally, event: Extract<TickEvent, { kind: 'shot' }>): void => {
  next.beaconBonusDamage += event.auraDamageBonus;
  if (event.beyondBaseRange) next.forgeExtendedShots += 1;
};

/** 'rejected' イベントを集計する（拒否理由の内訳） */
const applyRejectedEvent = (next: RunTally, event: Extract<TickEvent, { kind: 'rejected' }>): void => {
  next.rejectionCounts[event.reason] += 1;
};

/** この tick のイベントを累積する */
export const accumulateTick = (tally: RunTally, state: CombatState, map: StageMap): RunTally => {
  const next: RunTally = {
    ...tally,
    laneAllocation: [...tally.laneAllocation],
    blockerPositions: [...tally.blockerPositions],
    unitsLost: { ...tally.unitsLost },
    ravenDefeatProgress: [...tally.ravenDefeatProgress],
    costHistogram: [...tally.costHistogram],
    playedCardIds: new Set(tally.playedCardIds),
    rejectionCounts: { ...tally.rejectionCounts },
    defeatsByUnit: { ...tally.defeatsByUnit },
  };

  state.events.forEach((event) => {
    if (event.kind === 'defeat') applyDefeatEvent(next, event, { state, map });
    else if (event.kind === 'shot') applyShotEvent(next, event);
    else if (event.kind === 'rejected') applyRejectedEvent(next, event);
    else if (event.kind === 'unit-lost') applyUnitLostEvent(next, event);
    else if (event.kind === 'played') applyPlayedEvent(next, event, map);
  });

  return next;
};

export interface RunSummaryView {
  /** 守り手別の撃破数（反復2 から引き継ぐ） */
  defeats: { name: string; count: number }[];
  beaconBonusDamage: number;
  forgeExtendedShots: number;
  /** 拒否理由の内訳（反復2 から引き継ぐ） */
  rejectionTotal: number;
  rejectionDetail: { label: string; count: number }[];
  /** 項目1: レーンごとの配置数 */
  laneAllocation: number[];
  /** 項目2: 経路上に置いた守り手の位置 */
  blockerPositions: LaneCell[];
  /** 項目3: 失った守り手（カードIDごとの数） */
  unitsLost: Record<string, number>;
  /** 項目4: 経路上／経路外の配置数と、経路上の比率 */
  placedOnPath: number;
  placedOffPath: number;
  onPathRatio: number;
  /** 項目5: 鴉を落とした位置の平均進捗比（0 = 入口、1 = 砦）。1体も倒していなければ 0 */
  ravenDefeatAverage: number;
  ravenDefeatCount: number;
  /** 項目6: 使ったカードのコスト別回数 / 一度も出さなかった札 */
  costHistogram: number[];
  unusedCardIds: string[];
}

const REJECTION_LABEL: Record<RejectionReason, string> = {
  cooldown: '設置間隔',
  mana: 'マナ不足',
  target: '置けない場所',
  occupied: '設置済み',
  pending: '徴発の選択待ち',
};

/** 平均を求める。空配列は 0（「未計測」と「0」を区別しない代わりに、呼び出し側で件数を別途出す） */
const average = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;

/** 集計を表示用に整える */
export const summarize = (tally: RunTally, deckCards: readonly string[]): RunSummaryView => {
  const onPathTotal = tally.placedOnPath + tally.placedOffPath;
  return {
    defeats: Object.entries(tally.defeatsByUnit)
      .map(([id, count]) => ({ name: getCardDefinition(id).name, count }))
      .sort((a, b) => b.count - a.count),
    beaconBonusDamage: tally.beaconBonusDamage,
    forgeExtendedShots: tally.forgeExtendedShots,
    rejectionTotal: Object.values(tally.rejectionCounts).reduce((sum, n) => sum + n, 0),
    rejectionDetail: (Object.keys(REJECTION_LABEL) as RejectionReason[])
      .filter((reason) => tally.rejectionCounts[reason] > 0)
      .map((reason) => ({ label: REJECTION_LABEL[reason], count: tally.rejectionCounts[reason] })),
    laneAllocation: tally.laneAllocation,
    blockerPositions: tally.blockerPositions,
    unitsLost: tally.unitsLost,
    placedOnPath: tally.placedOnPath,
    placedOffPath: tally.placedOffPath,
    onPathRatio: onPathTotal === 0 ? 0 : tally.placedOnPath / onPathTotal,
    ravenDefeatAverage: average(tally.ravenDefeatProgress),
    ravenDefeatCount: tally.ravenDefeatProgress.length,
    costHistogram: tally.costHistogram,
    unusedCardIds: [...new Set(deckCards)].filter((id) => !tally.playedCardIds.has(id)),
  };
};

/**
 * 灰燼の城壁 - UI 抜きでランを丸ごと回すヘルパー（テスト用）
 *
 * stepTick が純粋関数であることの見返り。バランス較正と
 * 支配戦略の検出を自動テストとして常設できる（設計書 §7）。
 */
import type { CellPos, StageMap } from '../board/stage-map';
import { allPathCells, isPathCell, laneOf } from '../board/stage-map';
import type { CombatState } from './combat-state';
import { stepTick, placeableCells, type PlayerAction } from './step-tick';
import { getCardDefinition } from '../cards/card-pool';
import { HAND_LIMIT } from '../cards/deck';
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

/** そのセルから、与えたセル群のうち最も近いものまでの距離 */
const distanceToCells = (cells: readonly CellPos[], pos: CellPos): number =>
  cells.reduce((min, c) => Math.min(min, Math.hypot(c.x - pos.x, c.y - pos.y)), Infinity);

/**
 * いま生きた敵が最も多いレーン（同数なら若い番号）
 *
 * 2レーンになったことで、盤面の並び順（行優先）で機械的に選ぶと守りが
 * 北へ偏り続ける。それでは較正が「デッキの強さ」ではなく「北へ寄る癖」を
 * 測ってしまう。素直な戦略でも「敵が多いほうを守る」ことだけは要る。
 */
const busiestLaneIndex = (state: CombatState, map: StageMap): number => {
  const counts = map.lanes.map(
    (_lane, index) => state.enemies.filter((e) => e.alive && e.laneIndex === index).length
  );
  return Math.max(0, counts.indexOf(Math.max(...counts)));
};

/** そのレーンで最も進んでいる生きた敵の足元セル index（いなければ -1） */
const leadingCellIndexOn = (state: CombatState, laneIndex: number): number =>
  state.enemies.reduce(
    (max, e) =>
      e.alive && e.laneIndex === laneIndex ? Math.max(max, Math.floor(e.progress)) : max,
    -1
  );

/**
 * 止める札（壁・罠・燠火）を置くレーン上のセル
 *
 * 既に通り過ぎたセルに壁を置いてもその敵は止まらないため、先頭の敵より
 * 前方から探す。前方が埋まっているときだけ入口側へ戻る。
 */
const blockCellOn = (
  lane: readonly CellPos[],
  candidates: readonly CellPos[],
  fromIndex: number
): CellPos | undefined => {
  const isFree = (cell: CellPos): boolean =>
    candidates.some((c) => c.x === cell.x && c.y === cell.y);
  return lane.slice(fromIndex).find(isFree) ?? lane.find(isFree);
};

/** 射程 reach が target のいずれかに届く候補のうち、target に最も近いもの */
const shootingCellFor = (
  candidates: readonly CellPos[],
  target: readonly CellPos[],
  reach: number
): CellPos | undefined =>
  candidates
    .filter((c) => distanceToCells(target, c) <= reach)
    .sort((a, b) => distanceToCells(target, a) - distanceToCells(target, b))[0];

/**
 * その札を置くべき場所を選ぶ
 *
 * 設置マスの規則が消えたため、候補には射程がまったく届かないマスも含まれる。
 * 先頭を機械的に取ると隅に塔が並び、較正が「隅に置いた勝率」になってしまう。
 *
 * - 攻撃しない守り手（石壁）・罠・燠火 … 守るレーン上の、先頭の敵より前方のセル
 * - 攻撃する守り手・オーラ ………………… 射程が守るレーンに届くマスのうち最も近いもの
 * - 魔力炉 ………………………………………… 経路外のどこでも（攻撃も妨害もしないため）
 *
 * 守るレーンが埋まっている場合だけ、経路全体を対象にした従来の選び方へ戻す。
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
  const laneIndex = busiestLaneIndex(state, map);
  const lane = laneOf(map, laneIndex);
  const spec = card.tower;
  const blocks =
    card.type === 'trap' ||
    card.type === 'ember' ||
    (spec !== undefined && spec.damage === 0 && spec.aura === undefined);
  if (blocks) {
    return (
      blockCellOn(lane, candidates, leadingCellIndexOn(state, laneIndex) + 1) ??
      candidates.find((c) => isPathCell(map, c))
    );
  }
  // 射程はオーラ分を見ない（素の射程で届く場所を選ぶ）
  const reach = spec?.range ?? 0;
  return (
    shootingCellFor(candidates, lane, reach) ??
    shootingCellFor(candidates, allPathCells(map), reach)
  );
};

/**
 * 置いてよい札と場所を絞る述語（Task 14 の対照条件が使う）
 *
 * 「その札を」「その位置に」置いてよいかを一括で問う。札だけを見る条件
 * （壁と対空だけ）と位置だけを見る条件（経路外だけ）の両方を1つの型で表せる。
 */
type PlacementFilter = (card: CardDefinition, pos: CellPos) => boolean;

/**
 * 盤面に置かない札（呪文・徴発）を述語に問うときの便宜上の位置
 *
 * 盤外の座標なので経路セルには決してならない。位置だけを見る述語
 * （経路外のみ）はこれらの札を一律に許可することになり、意図どおり
 * 「置き場所の制約」が盤面に出ない札を巻き込まない。
 */
const NO_POSITION: CellPos = { x: -1, y: -1 };

/**
 * 手札から出す札を1枚選ぶ（先頭から見て、述語が許す最初の1枚）
 *
 * 1 tick に出せるのは1枚まで。restrictedGreedy から切り出してあるのは
 * ループの早期脱出（return）を素直に書くため。
 */
const chooseCardAction = (
  state: CombatState,
  map: StageMap,
  allow: PlacementFilter
): PlayerAction | undefined => {
  for (let handIndex = 0; handIndex < state.deck.hand.length; handIndex++) {
    const cardId = state.deck.hand[handIndex];
    if (cardId === undefined) continue;
    const card = getCardDefinition(cardId);
    if (card.cost > state.mana) continue;
    // 魔力炉はクールダウン中なら飛ばす。他の札はマナが唯一の律速で妨げられない
    if (card.type === 'reactor' && state.placeCooldown > 0) continue;
    if (placementKindOf(card) === 'none') {
      if (!allow(card, NO_POSITION)) continue;
      return { kind: 'play-card', handIndex };
    }
    const pos = choosePlacement(state, card, map, (c) => allow(card, c));
    if (pos) return { kind: 'play-card', handIndex, pos };
  }
  return undefined;
};

/**
 * この戦略が決して置かない札の手札 index（手札が上限のときだけ探す）
 *
 * 手札上限を超えて引いた札は墓地へ直行する（deck.ts）。置かない札で手札が
 * 埋まると以後に引く札がすべて墓地へ落ち、対照条件が「経路に置かないと弱い」
 * ではなく「手札が詰まった」ことを測ってしまう。捨てて枠を空ける。
 *
 * 空きがあるうちは捨てない。捨てても新しい札を早く引けるわけではない
 * （ドローは時間駆動）ため、上限に達する前に捨てるのは損でしかない。
 *
 * マナは見ない。高価な札を今だけ出せない状態と、この戦略が原理的に置かない
 * 札とを混同しないため（choosePlacement もマナを見ない）。
 */
const refusedHandIndex = (
  state: CombatState,
  map: StageMap,
  allow: PlacementFilter
): number | undefined => {
  if (state.deck.hand.length < HAND_LIMIT) return undefined;
  const index = state.deck.hand.findIndex((cardId) => {
    const card = getCardDefinition(cardId);
    if (placementKindOf(card) === 'none') return !allow(card, NO_POSITION);
    return choosePlacement(state, card, map, (c) => allow(card, c)) === undefined;
  });
  return index < 0 ? undefined : index;
};

/**
 * 述語で絞った素直な戦略（greedyStrategy と対照条件の共通実装）
 *
 * 対照条件ごとに戦略を書き下ろすと、燠火の点火や徴発の扱いが少しずつ
 * ずれて「戦略の差」ではなく「実装の差」を測ってしまう。差は述語1つに閉じる。
 */
const restrictedGreedy = (
  state: CombatState,
  map: StageMap,
  allow: PlacementFilter
): PlayerAction[] => {
  const actions: PlayerAction[] = [];
  state.embers.forEach((ember, emberIndex) => {
    if (ember.cooldownLeft === 0) actions.push({ kind: 'reactivate', emberIndex });
  });
  // 徴発の候補を放置すると山札が減り続けて実質デッキが痩せるため、
  // 常に先頭を選ぶ。候補を評価して選ぶ賢い戦略にはしない（下限を測る道具のため）。
  if (state.levyOptions.length > 0) {
    actions.push({ kind: 'choose-levy', optionIndex: 0 });
  }
  const play = chooseCardAction(state, map, allow);
  if (play) {
    actions.push(play);
    return actions;
  }
  const refused = refusedHandIndex(state, map, allow);
  if (refused !== undefined) actions.push({ kind: 'discard', handIndex: refused });
  return actions;
};

/**
 * 素直な戦略: 置けるなら手札の先頭から置ける札を置き、燠火は点火できるなら点火する
 *
 * 人間の上手さを模さない。「雑に遊んでも勝ててしまうか」を測るための下限。
 */
export const greedyStrategy: Strategy = (state, map) => restrictedGreedy(state, map, () => true);

/**
 * 経路外にしか置かない戦略（対照条件・ブロックが必要か）
 *
 * ブロックという行為が本当に必要かを測る。**デッキ構成では検査できない**——
 * すべての守り手がブロックできる以上、石壁を抜いたデッキでも弓兵を経路上に
 * 置けばブロックは成立してしまう。検査したいのは行為のほうなので戦略で絞る。
 * この戦略が勝ててしまうなら、モデルを拡張したのに旧タワーディフェンスとして
 * 遊べているということ。
 */
export const offPathOnlyStrategy: Strategy = (state, map) =>
  restrictedGreedy(state, map, (_card, pos) => !isPathCell(map, pos));

/**
 * この戦略が許可する札か（＝「地上専用の攻撃札」でないか）
 *
 * **名前に反して「壁と対空」のリストではない。** 弩砲・徹甲弩は対空の答えを
 * 持ちながら地上へも十分な火力（9・14ダメージ）を出す塔であり、この述語は
 * それらを許可する。したがって noPureGroundAttackStrategy が締め出すのは
 * 「地上にしか当たらず、かつ実際にダメージを持つ攻撃札」（弓兵・火砲台・投石機・
 * 棘罠・業火）だけで、対空を持つ攻撃的な塔は禁止していない。
 */
const isNotPureGroundOnlyAttacker = (card: CardDefinition): boolean => {
  // 魔力炉はマナ源であって戦力ではない。止めるとマナ不足で自明に負け、
  // 「ブロックが強すぎないか」ではなく「マナが足りるか」を測ってしまう
  if (card.type === 'reactor') return true;
  // 落網のような「飛行を地上化する罠」も対空の答え。塔だけを見ると
  // balance.test.ts の対空判定と食い違い、対空の定義が2つできてしまう。
  // 対空手段を取りこぼすと上限の不変条件（10/20 未満）が甘い側へ倒れる
  if (card.trap?.groundedTicks !== undefined) return true;
  const spec = card.tower;
  if (!spec) return false;
  return spec.damage === 0 || spec.hitsFlying;
};

/**
 * 地上専用の攻撃札を締め出した戦略（対照条件・ブロックが強すぎないか）
 *
 * **旧名 `wallAndAirOnlyStrategy` は実体と食い違っていた。** 「壁と対空だけ」と
 * 読めるが、isNotPureGroundOnlyAttacker は対空を持つ塔（弩砲・徹甲弩）の
 * 地上火力までは締め出さない。実体は「地上にしか当たらない攻撃札を持たない
 * 戦略」であり、対空の答えを持つ塔なら主力として使ってよい。
 *
 * 経路外にしか置かない戦略（offPathOnlyStrategy）と対で置く。片側だけでは
 * 較正が厳しすぎても緩すぎても検出できない。この戦略が勝ちすぎるなら、
 * 地上専用の火力（弓兵・火砲台・投石機等）を積む意味が消えている。
 *
 * **この対照条件は、「対空札の地上火力を見落として較正が甘くなる」という
 * 同じ欠陥を過去4回繰り返した経験に対する唯一の防具である**（.superpowers の
 * 進捗レジャー Task 14 参照）。実測 6/20（この戦略）vs 14/20（greedyStrategy）は
 * 有意差であり、名前・コメントを直す際も balance.test.ts の閾値・実測値は
 * 変更しないこと。
 */
export const noPureGroundAttackStrategy: Strategy = (state, map) =>
  restrictedGreedy(state, map, isNotPureGroundOnlyAttacker);

/**
 * 配備の「供給」を打ち切るまでの上限 tick
 *
 * 初期手札3枚を除いた山札17枚を、DRAW_INTERVAL_TICKS（40）ごとに1枚ずつ
 * 時間駆動で引くだけなら 40 × 17 = 680 tick で尽きる。定数から導出せず実数で
 * 置くのは、この値が「供給の終わり」という判定上の意味を持つ tick であり、
 * 式の変更で静かに動いてほしくないため。
 *
 * **ただし、この tick で「ちょうど」尽きるとは限らない。** FULL_DECK は徴発
 * （levy）を1枚含み、これを打つと山札の上から3枚が時間駆動のドローとは別経路で
 * 一度に取り除かれる。素直な戦略は徴発を早めに打つため、実測ではもっと前
 * （シード1で560 tick）に山札が空になる。DEPLOY_ONLY_UNTIL_TICK が保証するのは
 * 「この tick には尽きている」という上限であり、balance.test.ts の診断
 * （DEPLOY_ONLY_UNTIL_TICK までに、素直な戦略で進めると山札が尽きている）が
 * その保証を裏取りする。DECK_SIZE や DRAW_INTERVAL_TICKS を変えたときは、
 * その式の値をここへ手で反映しつつ、あのテストで裏取りすること。
 */
export const DEPLOY_ONLY_UNTIL_TICK = 680;

/**
 * 配備が終わったら何もしない戦略（反復5 の診断・対照条件）
 *
 * **この戦略は「配備後の判断」を測る道具にならない（反復5 の較正で判明・実測）。**
 * 較正でここを回そうとする前に、必ず以下を読むこと。41通りの掃引を繰り返さずに済む。
 *
 * - `DEPLOY_ONLY_UNTIL_TICK`(680) は**山札が尽きる tick として定義されている**。
 *   実測では20シードすべてで 680 時点の山札が0枚、手札は0〜2枚だった
 * - 素直な戦略が 680 以降に打つ札は**20ラン合計で12枚**（1ランあたり0.6枚）
 * - **20シード中11シードでは素直な戦略も 680 以降に一切操作しない。**
 *   この11シードでは両戦略の入力列が同一になり、ランが完全に一致する
 *   （勝ち数も greedy 7・idle 7 で同じ）
 * - したがって、この戦略が放棄しているのは平均0.6枚の札であって判断ではない。
 *   `attackRange` とウェーブを41通り掃引しても、全要求充足デッキが 12/20 以上に
 *   留まる限り、この戦略は 8/20 を下回らなかった（最小は 4/20。そのとき
 *   全要求充足デッキは 7/20 まで落ちていた）
 *
 * **測れるようにするには供給を終盤へ伸ばすしかないが、それは設計書 §2.3 が
 * 意図的に残している「無補給の後半」を崩す。** 山札20枚・ドロー40tick 周期という
 * 経済そのものが「後半は配り終わっている」ことを前提にしており、この戦略の
 * 無力さはその経済の帰結である。較正で直せる種類のズレではない。
 *
 * 反復5 では「配備が終わった後にも判断が残るか」を自動検証から**実プレイの判定へ
 * 移した**（設計書 §8.2 の判定項目5 `unitsLost`・6「最後に出した tick ÷ 決着 tick」）。
 * 札を抱える人間のプレイなら、この戦略が測れなかったものが測れる。
 *
 * 削除せず残してあるのは、`balance.test.ts` の
 * `較正ハーネスの性質` が測定器の性質としてこの戦略を使い続けるためと、
 * 上の実測を次に較正する人へ渡すためである。
 *
 * `state.tick < DEPLOY_ONLY_UNTIL_TICK` の間だけ素直に打ち、`state.tick` が
 * DEPLOY_ONLY_UNTIL_TICK に達した呼び出し以降は一切操作しない。`>=` で切るため、
 * **その時点で山札に札が残っていてもすべて未使用のまま放置され、手札に残っている
 * 札も一度も打たれない。** これは実装の欠陥ではなく測定対象そのもの——「配備が
 * 終わった後に何もしない」戦略が、抱えた手札（あるいは残った山札）ごと無力化
 * することを込みで測りたい（境界を変えると 20 シードの実測値が変わるため、
 * `>=` の挙動そのものは変えないこと）。
 *
 * **「盤面が一方向のラチェットである限りこの戦略は勝ててしまう」という当初の
 * 読みは誤りだった。** 反復5 でラチェットは実際に壊れた（守り手が摩耗で消える）が、
 * この戦略の勝率は 11/20 → 10/20 としか動いていない。壊れた盤面を建て直す札が
 * 終盤に存在しない以上、素直な戦略にも同じことができないからである。
 * **この戦略が勝つことはラチェットの証拠ではなく、供給が尽きていることの証拠だった。**
 */
export const deployThenIdleStrategy: Strategy = (state, map) =>
  state.tick >= DEPLOY_ONLY_UNTIL_TICK ? [] : greedyStrategy(state, map);

/**
 * 灰燼の城壁 - 1 tick 前進（決定的・純粋関数）
 *
 * 乱数を取らないため、同じ状態と同じ操作列からは常に同じ結果になる。
 * 時間を進めるのは presentation の setInterval だけで、
 * ここにはタイマーも副作用も持ち込まない（設計書 §8.2）。
 *
 * 1 tick の処理順:
 *   操作 → マナ生成 → ドロー → 出現 → 移動 → 罠 → 射撃 → 漏れ → 勝敗
 *
 * `stepTick` 本体は上記の順で各段階のヘルパー関数を呼ぶだけの薄い関数にし、
 * 各段階の実装は module-private なヘルパーに切り出している（Task 7.5）。
 * 分割は振る舞いを1ミリも変えないことを最優先し、処理順序・計算式は元のまま。
 */
import type { CellPos, StageMap } from '../board/stage-map';
import { isSlowCell, isHighGround, laneOf, isPathCell, fortressCell } from '../board/stage-map';
import { drawOne, discardFromHand, peekTop, takeFromPeek } from '../cards/deck';
import type { DeckState } from '../cards/deck';
import { getCardDefinition } from '../cards/card-pool';
import { placementKindOf, type CardDefinition } from '../cards/card-definition';
import { getEnemySpec } from './enemies';
import { isEnemyFlying } from './enemy-status';
import { isBlocked, attackersFor } from './blocking';
import type { BlockContext } from './blocking';
import { DRAW_INTERVAL_TICKS, PLACE_COOLDOWN_TICKS } from './combat-state';
import type {
  CombatState,
  ActiveEnemy,
  TickEvent,
  PlacedUnit,
  PlacedTrap,
  PlacedReactor,
  PlacedEmber,
  DefeatSource,
} from './combat-state';

/** プレイヤーがその tick に行った操作 */
export type PlayerAction =
  | { kind: 'play-card'; handIndex: number; pos?: CellPos }
  | { kind: 'reactivate'; emberIndex: number }
  | { kind: 'choose-levy'; optionIndex: number }
  | { kind: 'discard'; handIndex: number };

/** 滞留セル上の移動量倍率 */
export const SLOW_TERRAIN_MULT = 0.6;

/** 高台に設置した守り手の火力倍率 */
export const HIGH_GROUND_DAMAGE_MULT = 1.3;

/**
 * 守り手の実効ダメージの内訳
 *
 * 篝火の貢献を測るため、オーラ抜きのダメージと実効ダメージを両方返す。
 * 丸めはそれぞれに適用する（合計してから丸めると差分がずれる）。
 * 倍率の二重適用を避けるため、この関数だけがダメージ算出の責務を持つ。
 */
export const damageBreakdown = (
  state: CombatState,
  unitIndex: number,
  map: StageMap,
  _target: ActiveEnemy
): { total: number; auraBonus: number } => {
  const unit = state.units[unitIndex];
  if (!unit) return { total: 0, auraBonus: 0 };
  const spec = getCardDefinition(unit.cardId).tower;
  if (!spec || spec.aura) return { total: 0, auraBonus: 0 };
  const auraBonus = state.units.reduce((sum, other) => {
    const otherSpec = getCardDefinition(other.cardId).tower;
    const damageBonus = otherSpec?.aura?.towerDamageBonus;
    if (damageBonus === undefined) return sum;
    const adjacent =
      Math.abs(other.pos.x - unit.pos.x) <= 1 && Math.abs(other.pos.y - unit.pos.y) <= 1;
    return adjacent ? sum + damageBonus : sum;
  }, 0);
  const highGround = isHighGround(map, unit.pos) ? HIGH_GROUND_DAMAGE_MULT : 1;
  const base = Math.round(spec.damage * highGround);
  const total = Math.round(spec.damage * highGround * (1 + auraBonus));
  return { total, auraBonus: total - base };
};

/**
 * 守り手の実効ダメージ
 *
 * 倍率の二重適用を避けるため、damageBreakdown だけがダメージ算出の責務を持つ。
 */
export const effectiveDamage = (
  state: CombatState,
  unitIndex: number,
  map: StageMap,
  target: ActiveEnemy
): number => damageBreakdown(state, unitIndex, map, target).total;

/**
 * 守り手の実効射程
 *
 * 基礎射程 + Σ隣接オーラの射程加算。effectiveDamage と同じく、
 * 算出責務をこの関数だけに持たせて加算の二重適用を防ぐ。
 * オーラの守り手自身は攻撃しないため 0 を返す。
 */
export const effectiveRange = (
  state: CombatState,
  unitIndex: number,
  _map: StageMap
): number => {
  const unit = state.units[unitIndex];
  if (!unit) return 0;
  const spec = getCardDefinition(unit.cardId).tower;
  if (!spec || spec.aura) return 0;
  const bonus = state.units.reduce((sum, other) => {
    const otherSpec = getCardDefinition(other.cardId).tower;
    const rangeBonus = otherSpec?.aura?.towerRangeBonus;
    if (rangeBonus === undefined) return sum;
    const adjacent =
      Math.abs(other.pos.x - unit.pos.x) <= 1 && Math.abs(other.pos.y - unit.pos.y) <= 1;
    return adjacent ? sum + rangeBonus : sum;
  }, 0);
  return spec.range + bonus;
};

/** 進行度から補間済みの盤面座標を求める */
export const positionOf = (progress: number, path: readonly CellPos[]): CellPos => {
  if (path.length === 0) return { x: 0, y: 0 };
  const last = path.length - 1;
  const clamped = Math.max(0, Math.min(progress, last));
  const i = Math.min(Math.floor(clamped), Math.max(0, last - 1));
  const a = path[i];
  const b = path[i + 1] ?? a;
  if (!a || !b) return { x: 0, y: 0 };
  const frac = clamped - i;
  return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
};

/** その敵の所属レーン */
const laneFor = (map: StageMap, enemy: ActiveEnemy): readonly CellPos[] =>
  laneOf(map, enemy.laneIndex);

/** その敵が砦に到達したとみなす進行度 */
const goalFor = (map: StageMap, enemy: ActiveEnemy): number =>
  Math.max(0, laneFor(map, enemy).length - 1);

/** その敵の現在の盤面座標 */
export const enemyPosition = (map: StageMap, enemy: ActiveEnemy): CellPos =>
  positionOf(enemy.progress, laneFor(map, enemy));

const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

/** そのセルに既に守り手・魔力炉・燠火・罠のいずれかがあるか */
const isCellOccupied = (state: CombatState, pos: CellPos): boolean =>
  state.units.some((u) => samePos(u.pos, pos)) ||
  state.reactors.some((r) => samePos(r.pos, pos)) ||
  state.embers.some((e) => samePos(e.pos, pos)) ||
  state.traps.some((t) => samePos(t.pos, pos));

/**
 * そのカードをその位置に置けるか
 *
 * UI はこれを使って「置けるマスだけをハイライト」する（設計書 §9.7）。
 * ドメインが唯一の真実を持つ。
 *
 * 引数 `state` は tick 開始時点（今 tick に処理済みの配置操作を含まない）のものを渡す前提。
 * `stepTick` は配置クールダウンにより1 tick に1回しか配置を確定しないため、
 * 同一 tick 内で2回目の判定が必要になるケースは存在しない。
 *
 * 設置マスの概念を廃止し、砦セル以外なら守り手はどこにでも置ける（Task 8）。
 * 砦は全レーンの合流点で、置けると1体で両レーンを同時に塞げてしまうため
 * 唯一の例外として禁止する。魔力炉はコスト0・デッキ上限なしのため、
 * 経路に置けると無限の無料ブロッカーになる——経路外限定はその防止策。
 */
export const canPlaceAt = (
  state: CombatState,
  card: CardDefinition,
  pos: CellPos,
  map: StageMap
): boolean => {
  const kind = placementKindOf(card);
  if (kind === 'none') return false;
  if (pos.x < 0 || pos.x >= map.width || pos.y < 0 || pos.y >= map.height) return false;
  // 砦セルは全レーンの合流点。ここに置けると1体で両レーンを塞げてしまう
  const fortress = fortressCell(map);
  if (fortress && samePos(fortress, pos)) return false;
  if (isCellOccupied(state, pos)) return false;
  const onPath = isPathCell(map, pos);
  if (kind === 'path') return onPath;
  if (kind === 'reactor') return !onPath;
  return true;
};

/** そのカードを今置けるセルの一覧（UI のハイライトと集計が使う） */
export const placeableCells = (
  state: CombatState,
  card: CardDefinition,
  map: StageMap
): CellPos[] => {
  const cells: CellPos[] = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const pos = { x, y };
      if (canPlaceAt(state, card, pos, map)) cells.push(pos);
    }
  }
  return cells;
};

/** そのウェーブ定義から、この tick に出現すべき敵を作る */
const spawnAt = (state: CombatState, tick: number, nextId: number): ActiveEnemy[] => {
  const spawned: ActiveEnemy[] = [];
  let id = nextId;
  state.waves.forEach((wave) => {
    wave.entries.forEach((entry) => {
      for (let c = 0; c < entry.count; c++) {
        // 出現判定は新 tick ではなく tick - 1 基準（呼び出し側で tick = state.tick + 1 を渡すため）
        if (wave.startTick + c * entry.spawnIntervalTicks !== tick - 1) continue;
        const spec = getEnemySpec(entry.enemyId);
        spawned.push({
          id: id++,
          enemyId: entry.enemyId,
          hp: spec.hp,
          maxHp: spec.hp,
          // 全ての敵は所属レーンの入口（0）から進軍する（フィードバック#4）
          progress: 0,
          spawnTick: tick,
          laneIndex: entry.laneIndex,
          alive: true,
          leaked: false,
          groundedUntilTick: 0,
        });
      }
    });
  });
  return spawned;
};

/** 全ウェーブの敵が出尽くし、盤面に生きた敵がいないか */
const isCleared = (state: CombatState, tick: number): boolean => {
  const lastSpawnTick = state.waves.reduce((max, wave) => {
    const waveMax = wave.entries.reduce(
      (m, e) => Math.max(m, wave.startTick + Math.max(0, e.count - 1) * e.spawnIntervalTicks),
      wave.startTick
    );
    return Math.max(max, waveMax);
  }, 0);
  // 境界は <=（< だと最後の敵が出る前に勝利判定が出てしまう）
  if (tick <= lastSpawnTick) return false;
  return state.enemies.every((e) => !e.alive);
};

/** 業火・燠火の即時ダメージ予約（罠・射撃より先に確定し、後段でまとめて反映する） */
interface PendingBlast {
  pos: CellPos;
  radius: number;
  damage: number;
  /** 発生源の燠火 index。撃破の帰属に使う */
  emberIndex: number;
}

/**
 * 敵ごとの「最後に削った者」
 *
 * hpById と対で更新する。hpById.set と sourceById.set は必ず同じ箇所で行う
 * （片方だけ更新すると帰属が前の tick の値のまま残る）。
 */
type SourceById = Map<number, DefeatSource>;

/**
 * 「プレイヤー操作」段階の作業用下書き。1 tick 分の操作をすべて畳み込む間だけ存在し、
 * 各操作ハンドラがこれを直接書き換える（tick 内部の一時作業状態であり外部状態ではない）。
 */
interface ActionsDraft {
  events: TickEvent[];
  mana: number;
  deck: DeckState;
  placeCooldown: number;
  slowUntilTick: number;
  slowMultiplier: number;
  units: PlacedUnit[];
  traps: PlacedTrap[];
  reactors: PlacedReactor[];
  embers: PlacedEmber[];
  blasts: PendingBlast[];
  /** この tick に配置・再点火した燠火の index（クールダウン減算の対象外にする） */
  freshEmberIndices: Set<number>;
  /** 徴発で提示中の候補。空配列なら選択待ちなし */
  levyOptions: string[];
}

/** 燠火の再点火操作を適用する（クールダウン中なら何もしない） */
const applyReactivate = (
  draft: ActionsDraft,
  action: Extract<PlayerAction, { kind: 'reactivate' }>
): void => {
  const ember = draft.embers[action.emberIndex];
  if (!ember || ember.cooldownLeft > 0) return;
  const spec = getCardDefinition('ember-blast').ember;
  if (!spec) return;
  draft.embers[action.emberIndex] = { ...ember, cooldownLeft: spec.cooldownTicks };
  draft.freshEmberIndices.add(action.emberIndex);
  draft.blasts.push({
    pos: ember.pos,
    radius: spec.radius,
    damage: spec.damage,
    emberIndex: action.emberIndex,
  });
  draft.events.push({ kind: 'ember', emberIndex: action.emberIndex });
};

/** カード使用の効果を種別ごとに盤面へ反映する（コスト・クールダウン確定後） */
const applyCardEffect = (
  draft: ActionsDraft,
  card: CardDefinition,
  cardId: string,
  pos: CellPos | undefined,
  tick: number
): void => {
  if (card.type === 'tower' && pos && card.tower) {
    draft.units.push({ cardId, pos, hp: card.tower.hp, maxHp: card.tower.hp, cooldownLeft: 0 });
  } else if (card.type === 'trap' && pos && card.trap) {
    draft.traps.push({ cardId, pos, usesLeft: card.trap.uses, hitEnemyIds: [] });
  } else if (card.type === 'reactor' && pos && card.reactor) {
    draft.reactors.push({ pos, ticksToMana: card.reactor.intervalTicks });
  } else if (card.type === 'ember' && pos && card.ember) {
    draft.embers.push({ pos, cooldownLeft: card.ember.cooldownTicks });
    draft.freshEmberIndices.add(draft.embers.length - 1);
    draft.blasts.push({
      pos,
      radius: card.ember.radius,
      damage: card.ember.damage,
      emberIndex: draft.embers.length - 1,
    });
  } else if (card.type === 'spell' && card.spell) {
    draft.slowUntilTick = tick + card.spell.durationTicks;
    draft.slowMultiplier = card.spell.speedMultiplier;
  } else if (card.type === 'levy' && card.levy) {
    const peeked = peekTop(draft.deck, card.levy.peekCount);
    draft.deck = peeked.deck;
    draft.levyOptions = peeked.options;
  }
};

/**
 * 手札から1枚を能動的に捨てる
 *
 * コストもクールダウンも消費しない。**ドローは早まらない**
 * （ドローは DRAW_INTERVAL_TICKS の時間駆動）ため、「捨てて回す」戦術は
 * 成立せず、効果は手札の枠を空けることに限定される。有限デッキという
 * 前提を緩めないための意図的な設計（設計書 §5.3）。
 */
const applyDiscard = (
  draft: ActionsDraft,
  action: Extract<PlayerAction, { kind: 'discard' }>
): void => {
  if (draft.deck.hand[action.handIndex] === undefined) return;
  draft.deck = discardFromHand(draft.deck, action.handIndex);
};

/**
 * カード使用操作を適用する（手札・カード種別・マナ・設置可否を順に検査）
 *
 * **配置クールダウンは魔力炉だけに課す。**
 * 他の札はマナが唯一の律速になる。「マナがあるのに置けない」ことが、
 * 溜めて一気に置くか少しずつ置くかという戦略の選択を消していたため（反復2 #1）。
 * 徴発・時泥のような即時札はもともと盤面を占有しないため対象外だった。
 */
const applyPlayCard = (
  draft: ActionsDraft,
  state: CombatState,
  map: StageMap,
  tick: number,
  action: Extract<PlayerAction, { kind: 'play-card' }>
): void => {
  const cardId = draft.deck.hand[action.handIndex];
  if (cardId === undefined) {
    draft.events.push({ kind: 'rejected', reason: 'target' });
    return;
  }
  const card = getCardDefinition(cardId);
  const needsPlacement = placementKindOf(card) !== 'none';
  const usesCooldown = card.type === 'reactor';
  if (usesCooldown && draft.placeCooldown > 0) {
    draft.events.push({ kind: 'rejected', reason: 'cooldown' });
    return;
  }
  if (card.type === 'levy' && draft.levyOptions.length > 0) {
    draft.events.push({ kind: 'rejected', reason: 'pending' });
    return;
  }
  if (card.cost > draft.mana) {
    draft.events.push({ kind: 'rejected', reason: 'mana' });
    return;
  }
  if (needsPlacement && (!action.pos || !canPlaceAt(state, card, action.pos, map))) {
    draft.events.push({ kind: 'rejected', reason: 'target' });
    return;
  }
  // ここから確定
  draft.mana -= card.cost;
  draft.deck = discardFromHand(draft.deck, action.handIndex);
  if (usesCooldown) draft.placeCooldown = PLACE_COOLDOWN_TICKS;
  draft.events.push({ kind: 'played', cardId, pos: action.pos });
  applyCardEffect(draft, card, cardId, action.pos, tick);
};

/**
 * プレイヤー操作を適用する（1 tick の最初の段階）
 *
 * 後続の全段階（マナ生成〜勝敗判定）はこの結果を土台にするため、最初に確定させる。
 * カード使用・燠火再点火の受理／却下判定・カード効果の反映をここに集約する。
 */
const applyActions = (
  state: CombatState,
  actions: readonly PlayerAction[],
  map: StageMap,
  tick: number
): ActionsDraft => {
  const draft: ActionsDraft = {
    events: [],
    mana: state.mana,
    deck: state.deck,
    placeCooldown: Math.max(0, state.placeCooldown - 1),
    slowUntilTick: state.slowUntilTick,
    slowMultiplier: state.slowMultiplier,
    units: [...state.units],
    traps: [...state.traps],
    reactors: [...state.reactors],
    embers: [...state.embers],
    blasts: [],
    freshEmberIndices: new Set<number>(),
    levyOptions: state.levyOptions,
  };

  actions.forEach((action) => {
    if (action.kind === 'reactivate') {
      applyReactivate(draft, action);
    } else if (action.kind === 'choose-levy') {
      if (draft.levyOptions.length === 0) return;
      draft.deck = takeFromPeek(draft.deck, draft.levyOptions, action.optionIndex);
      draft.levyOptions = [];
    } else if (action.kind === 'discard') {
      applyDiscard(draft, action);
    } else {
      applyPlayCard(draft, state, map, tick, action);
    }
  });

  return draft;
};

/**
 * 魔力炉のマナ生成
 *
 * 操作適用の直後に処理する（設計書の tick 順序どおり）。生成できたら
 * イベントを積み、間隔をリセットする。まだなら残り tick を1減らすだけ。
 */
const runReactors = (
  reactors: readonly PlacedReactor[],
  mana: number,
  events: TickEvent[]
): { reactors: PlacedReactor[]; mana: number } => {
  let nextMana = mana;
  const next = reactors.map((r) => {
    const remaining = r.ticksToMana - 1;
    if (remaining > 0) return { ...r, ticksToMana: remaining };
    nextMana += getCardDefinition('reactor').reactor?.manaPerTick ?? 1;
    events.push({ kind: 'mana', amount: 1 });
    return { ...r, ticksToMana: getCardDefinition('reactor').reactor?.intervalTicks ?? remaining };
  });
  return { reactors: next, mana: nextMana };
};

/**
 * 燠火のクールダウンを毎 tick 1 減らす（0 で止める）
 *
 * 今 tick に配置・再点火したもの（freshEmberIndices）はまだ経過していないため
 * 減らさない。マナ生成の直後、ドローより前に処理して他段階との依存はない。
 */
const decayEmbers = (
  embers: readonly PlacedEmber[],
  freshEmberIndices: ReadonlySet<number>
): PlacedEmber[] =>
  embers.map((e, i) =>
    freshEmberIndices.has(i) ? e : { ...e, cooldownLeft: Math.max(0, e.cooldownLeft - 1) }
  );

/**
 * 手札のドロー
 *
 * マナ生成・燠火のクールダウン処理の後、出現より前に行う（tick 順序どおり）。
 * 間隔に達していなければ残り tick を減らすだけで何もしない。
 */
const runDraw = (
  deck: DeckState,
  ticksToDraw: number,
  events: TickEvent[]
): { deck: DeckState; ticksToDraw: number } => {
  let remaining = ticksToDraw - 1;
  if (remaining > 0) return { deck, ticksToDraw: remaining };
  remaining = DRAW_INTERVAL_TICKS;
  const outcome = drawOne(deck);
  if (outcome.drawn !== undefined) {
    events.push(
      outcome.overflowed
        ? { kind: 'overflow', cardId: outcome.drawn }
        : { kind: 'draw', cardId: outcome.drawn }
    );
  }
  return { deck: outcome.deck, ticksToDraw: remaining };
};

/** moveEnemies の時間・速度に関する文脈をまとめたもの（パラメータ3個超過を避けるため） */
interface MoveContext {
  tick: number;
  slowUntilTick: number;
  slowMultiplier: number;
}

/**
 * 敵の移動
 *
 * 出現直後の敵（spawnTick === tick）はまだ動かさない。時泥の効果中は
 * 全体の移動量が下がり、滞留セルではさらに移動量が落ちる（乗算）。
 * 罠・射撃の判定はこの後の座標を前提にするため、必ず先に確定させる。
 *
 * 経路上に守り手がいる地上の敵はここで止める（ブロック判定）。飛行は
 * ブロックを無視する。ただし地上化中は通常の地上敵として扱う（Task 6）。
 */
const moveEnemies = (
  existing: readonly ActiveEnemy[],
  spawned: readonly ActiveEnemy[],
  ctx: MoveContext,
  map: StageMap,
  units: readonly PlacedUnit[]
): ActiveEnemy[] => {
  const slowMult = ctx.tick <= ctx.slowUntilTick ? ctx.slowMultiplier : 1;
  return [...existing, ...spawned].map((enemy) => {
    if (!enemy.alive) return enemy;
    if (enemy.spawnTick === ctx.tick) return enemy;
    if (isBlocked({ units, map, tick: ctx.tick }, enemy)) return enemy;
    const spec = getEnemySpec(enemy.enemyId);
    const lane = laneFor(map, enemy);
    const cell = lane[Math.min(Math.floor(enemy.progress), goalFor(map, enemy))];
    const terrain = cell && isSlowCell(map, cell) ? SLOW_TERRAIN_MULT : 1;
    return { ...enemy, progress: enemy.progress + spec.speed * terrain * slowMult };
  });
};

/**
 * 敵の攻撃と守り手の消滅
 *
 * 移動確定後に呼ぶ。止められている敵が attackIntervalTicks ごとに
 * ブロッカーのHPを削り、0 になった守り手を取り除く。
 *
 * 攻撃タイミングは敵ごとの内部カウンタではなく
 * `tick % attackIntervalTicks === 0` で決める。敵に状態を増やさずに済み、
 * 同じ敵が同じ tick に二度殴ることもない。
 *
 * 契約: `unitIndex` は消滅前（この関数の入力である ctx.units）の配列の index。
 * unit-lost の後に返り値の配列が縮むため、同一 tick 内の shot イベントの
 * unitIndex とはずれる。描画側は unit-damaged / unit-lost が持つ pos で
 * 座標から解決する（Task 11）。
 */
const applyEnemyAttacks = (
  ctx: BlockContext,
  moved: readonly ActiveEnemy[],
  events: TickEvent[]
): PlacedUnit[] => {
  const { units, tick } = ctx;
  const damaged = units.map((unit, unitIndex) => {
    const attackers = attackersFor(ctx, moved, unitIndex);
    const total = attackers.reduce((sum, enemy) => {
      const spec = getEnemySpec(enemy.enemyId);
      if (spec.attackIntervalTicks <= 0) return sum;
      if (tick % spec.attackIntervalTicks !== 0) return sum;
      events.push({
        kind: 'unit-damaged', unitIndex, pos: unit.pos, enemyId: enemy.id, amount: spec.attack,
      });
      return sum + spec.attack;
    }, 0);
    return total === 0 ? unit : { ...unit, hp: unit.hp - total };
  });
  damaged.forEach((unit, unitIndex) => {
    if (unit.hp > 0) return;
    events.push({ kind: 'unit-lost', unitIndex, cardId: unit.cardId, pos: unit.pos });
  });
  return damaged.filter((unit) => unit.hp > 0);
};

/** 罠が発動する距離（セル）。表示側の STACK_DISTANCE とは無関係 */
export const TRAP_TRIGGER_DISTANCE = 0.5;

/** 敵の状態変更の下書き（地上化） */
type EnemyStatusDraft = { groundedUntilTick?: number };

/**
 * 罠の発動
 *
 * 罠は2種類の対象判定を持つ:
 *   棘罠   … 地上にダメージ
 *   落網   … 飛行を地上化（ダメージなし）
 * 発動条件が逆のカードがあるため、対象判定は罠ごとに決める。
 *
 * 移動確定後の座標で判定する。ダメージは hpById に、状態変更は statusById に
 * 反映するが、生死・状態の確定はまだしない（射撃・業火と合算してから
 * resolveDamage でまとめて行う）。いずれも罠・射撃・業火の3段階で共有する
 * 下書きなので、この関数はそれらを直接書き換える（1 tick 分の作業用 Map で
 * あり外部状態ではない）。
 */
const applyTraps = (
  traps: readonly PlacedTrap[],
  moved: readonly ActiveEnemy[],
  hpById: Map<number, number>,
  sourceById: SourceById,
  statusById: Map<number, EnemyStatusDraft>,
  tick: number,
  map: StageMap,
  events: TickEvent[]
): PlacedTrap[] =>
  traps.map((trap, trapIndex) => {
    if (trap.usesLeft <= 0) return trap;
    const spec = getCardDefinition(trap.cardId).trap;
    if (!spec) return trap;
    let usesLeft = trap.usesLeft;
    const hitEnemyIds = [...trap.hitEnemyIds];
    moved.forEach((enemy) => {
      if (!enemy.alive || usesLeft <= 0) return;
      if (hitEnemyIds.includes(enemy.id)) return;
      const flying = isEnemyFlying(enemy, tick);
      // 落網は飛行のみ、それ以外の罠は地上のみに発動する
      const targetsFlying = spec.groundedTicks !== undefined;
      if (targetsFlying !== flying) return;
      const pos = enemyPosition(map, enemy);
      if (Math.hypot(pos.x - trap.pos.x, pos.y - trap.pos.y) > TRAP_TRIGGER_DISTANCE) return;

      if (spec.damage > 0) {
        hpById.set(enemy.id, (hpById.get(enemy.id) ?? 0) - spec.damage);
        sourceById.set(enemy.id, { kind: 'trap', index: trapIndex });
      }
      if (spec.groundedTicks !== undefined) {
        statusById.set(enemy.id, { groundedUntilTick: tick + spec.groundedTicks - 1 });
      }

      hitEnemyIds.push(enemy.id);
      usesLeft -= 1;
      events.push({ kind: 'trap', trapIndex, targetId: enemy.id });
    });
    return { ...trap, usesLeft, hitEnemyIds };
  });

/**
 * 守り手の射撃（クールダウンを消化し、射程内の先頭の敵を狙う）
 *
 * 罠の判定の後に行う（hpById に罠のダメージが反映済みの状態で対象の生死を見る）。
 * オーラ計算に今 tick 配置した守り手（篝火含む）も含めるため、units（unitsDraft）を
 * 反映した stateForDamage を effectiveDamage に渡す。素の state を渡すと
 * 今 tick に置いた守り手のダメージが0になるため、ここは順序も引数も変えてはいけない。
 */
const applyUnitShots = (
  state: CombatState,
  units: readonly PlacedUnit[],
  moved: readonly ActiveEnemy[],
  map: StageMap,
  hpById: Map<number, number>,
  sourceById: SourceById,
  events: TickEvent[],
  tick: number
): PlacedUnit[] => {
  const stateForDamage: CombatState = { ...state, units: [...units] };
  return units.map((unit, unitIndex) => {
    const spec = getCardDefinition(unit.cardId).tower;
    if (!spec || spec.aura) return unit;
    if (unit.cooldownLeft > 0) return { ...unit, cooldownLeft: unit.cooldownLeft - 1 };
    const range = effectiveRange(stateForDamage, unitIndex, map);
    const target = selectUnitTarget(unit, spec, range, moved, map, hpById, tick);
    if (!target) return unit;
    const { total: damage, auraBonus } = damageBreakdown(stateForDamage, unitIndex, map, target);
    const targetPos = enemyPosition(map, target);
    const distance = Math.hypot(targetPos.x - unit.pos.x, targetPos.y - unit.pos.y);
    events.push({
      kind: 'shot',
      unitIndex,
      targetId: target.id,
      auraDamageBonus: auraBonus,
      // 素の射程を超えている＝鍛冶場のオーラで初めて届いた射撃
      beyondBaseRange: distance > spec.range,
    });
    // 貫通・範囲・単体は互いに排他な3つの当たり方（設計書 §7 の3軸）。
    // 貫通は標的自身も直線上の1点として applyPiercingDamage が拾うため、
    // ここで別途 hpById.set しない（二重にダメージが乗ってしまう）。
    if (spec.piercing) {
      applyPiercingDamage(
        { from: unit.pos, toward: targetPos, range },
        moved,
        map,
        damage,
        hpById,
        sourceById,
        { kind: 'unit', index: unitIndex }
      );
    } else {
      hpById.set(target.id, (hpById.get(target.id) ?? 0) - damage);
      sourceById.set(target.id, { kind: 'unit', index: unitIndex });
      if (spec.splashRadius > 0) {
        applySplashDamage(
          target,
          spec,
          moved,
          map,
          hpById,
          sourceById,
          tick,
          stateForDamage,
          unitIndex
        );
      }
    }
    // 発射周期をちょうど cooldownTicks tick にするため -1 する
    // （次tick以降の `cooldownLeft > 0` decrement 判定と合わせて、
    // ちょうど cooldownTicks tick後に再発射できる）。
    // Math.max で下限0にガード: 現行カードに cooldownTicks:0 の通常の守り手は存在しない
    // （aura守り手の beacon のみ0だが、aura守り手は関数冒頭で早期returnし本行に到達しない）が、
    // 将来のカード追加で0や不正値が来ても負のcooldownLeftを作らないための契約保証。
    return { ...unit, cooldownLeft: Math.max(0, spec.cooldownTicks - 1) };
  });
};

/** 射程内・命中対象種別を満たす敵のうち、砦に一番近い（progress 降順）ものを狙う */
const selectUnitTarget = (
  unit: PlacedUnit,
  spec: NonNullable<CardDefinition['tower']>,
  range: number,
  moved: readonly ActiveEnemy[],
  map: StageMap,
  hpById: ReadonlyMap<number, number>,
  tick: number
): ActiveEnemy | undefined =>
  [...moved]
    .filter((e) => e.alive && (hpById.get(e.id) ?? 0) > 0)
    .filter((e) => spec.hitsFlying || !isEnemyFlying(e, tick))
    .filter((e) => {
      const pos = enemyPosition(map, e);
      return Math.hypot(pos.x - unit.pos.x, pos.y - unit.pos.y) <= range;
    })
    .sort((a, b) => b.progress - a.progress)[0];

/**
 * 着弾点から splashRadius 以内の他の敵にも巻き込みダメージを与える
 *
 * ダメージは敵によらず一定だが、中心の敵のダメージ値を流用せず
 * 巻き込む敵ごとに effectiveDamage を呼び直す（damageBreakdown がダメージ算出の
 * 唯一の責務を持つという契約を、この呼び出し側でも崩さないため）。
 */
const applySplashDamage = (
  target: ActiveEnemy,
  spec: NonNullable<CardDefinition['tower']>,
  moved: readonly ActiveEnemy[],
  map: StageMap,
  hpById: Map<number, number>,
  sourceById: SourceById,
  tick: number,
  stateForDamage: CombatState,
  unitIndex: number
): void => {
  const center = enemyPosition(map, target);
  moved.forEach((other) => {
    if (other.id === target.id || !other.alive) return;
    if (!spec.hitsFlying && isEnemyFlying(other, tick)) return;
    const pos = enemyPosition(map, other);
    if (Math.hypot(pos.x - center.x, pos.y - center.y) <= spec.splashRadius) {
      const damage = effectiveDamage(stateForDamage, unitIndex, map, other);
      hpById.set(other.id, (hpById.get(other.id) ?? 0) - damage);
      sourceById.set(other.id, { kind: 'unit', index: unitIndex });
    }
  });
};

/** 点 p と線分 ab の距離（貫通の判定に使う） */
const distanceToSegment = (
  p: { x: number; y: number },
  a: CellPos,
  b: { x: number; y: number }
): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

/** 貫通の当たり幅（セル）。この距離まで直線に近い敵に当たる */
export const PIERCING_WIDTH = 0.5;

/**
 * 貫通ダメージ
 *
 * 守り手から標的へ引いた直線上にいる敵すべてに、同じダメージを与える。
 * 標的より奥の敵にも当たるよう、線分は標的の先まで射程いっぱいに伸ばす。
 * 貫通する守り手（徹甲弩）は hitsFlying が常に true のため、飛行判定による
 * 絞り込みは行わない（applySplashDamage と異なり tick を引数に取らない）。
 */
const applyPiercingDamage = (
  ctx: { from: CellPos; toward: { x: number; y: number }; range: number },
  moved: readonly ActiveEnemy[],
  map: StageMap,
  damage: number,
  hpById: Map<number, number>,
  sourceById: SourceById,
  source: DefeatSource
): void => {
  const dx = ctx.toward.x - ctx.from.x;
  const dy = ctx.toward.y - ctx.from.y;
  const length = Math.hypot(dx, dy) || 1;
  const end = {
    x: ctx.from.x + (dx / length) * ctx.range,
    y: ctx.from.y + (dy / length) * ctx.range,
  };
  moved.forEach((enemy) => {
    if (!enemy.alive) return;
    const current = hpById.get(enemy.id) ?? enemy.hp;
    if (current <= 0) return;
    const pos = enemyPosition(map, enemy);
    if (distanceToSegment(pos, ctx.from, end) > PIERCING_WIDTH) return;
    hpById.set(enemy.id, current - damage);
    sourceById.set(enemy.id, source);
  });
};

/**
 * 業火・燠火の即時ダメージ（地上敵のみ）
 *
 * 罠・射撃の後に反映する（tick 順序どおり）。プレイヤー操作段階で予約した
 * blasts をここでまとめて hpById に反映する。hpById は罠・射撃と共有する
 * 下書きのため、この関数もそれを直接書き換える。
 */
const applyBlasts = (
  blasts: readonly PendingBlast[],
  moved: readonly ActiveEnemy[],
  map: StageMap,
  hpById: Map<number, number>,
  sourceById: SourceById,
  tick: number
): void => {
  blasts.forEach((blast) => {
    moved.forEach((enemy) => {
      if (!enemy.alive || isEnemyFlying(enemy, tick)) return;
      const pos = enemyPosition(map, enemy);
      if (Math.hypot(pos.x - blast.pos.x, pos.y - blast.pos.y) <= blast.radius) {
        hpById.set(enemy.id, (hpById.get(enemy.id) ?? 0) - blast.damage);
        sourceById.set(enemy.id, { kind: 'ember', index: blast.emberIndex });
      }
    });
  });
};

/**
 * ダメージ・状態変更を反映し、撃破を確定する
 *
 * 罠・射撃・業火の3段階すべてが hpById / statusById に書き終わった後、
 * 最後にまとめて敵の hp・状態・生死を確定する。ここで初めて hp <= 0 の敵が
 * alive: false になる。状態（地上化・足止め）は statusById に値がある敵にのみ
 * 上書きし、ない場合は既存の状態を保つ。
 */
const resolveDamage = (
  moved: readonly ActiveEnemy[],
  hpById: ReadonlyMap<number, number>,
  sourceById: ReadonlyMap<number, DefeatSource>,
  statusById: ReadonlyMap<number, EnemyStatusDraft>,
  events: TickEvent[]
): ActiveEnemy[] =>
  moved.map((enemy) => {
    if (!enemy.alive) return enemy;
    const status = statusById.get(enemy.id);
    const withStatus =
      status === undefined
        ? enemy
        : { ...enemy, groundedUntilTick: status.groundedUntilTick ?? enemy.groundedUntilTick };
    const hp = hpById.get(enemy.id) ?? withStatus.hp;
    if (hp > 0) return { ...withStatus, hp };
    const source = sourceById.get(enemy.id);
    // 撃破源が無い hp<=0 は論理的に起こり得ない（誰かが削った結果でしか 0 にならない）。
    // 万一起きた場合に defeat を握り潰すと集計が静かに壊れるため、契約違反として落とす。
    if (!source) {
      throw new Error(`撃破源が記録されていません: enemyId=${enemy.id}`);
    }
    events.push({ kind: 'defeat', enemyId: enemy.id, source });
    return { ...withStatus, hp: 0, alive: false };
  });

/**
 * 漏れ（砦到達）の確定とライフ減算
 *
 * ダメージ確定の最後、勝敗判定の直前に行う。撃破と漏れは両立しない
 * （resolveDamage で alive: false になった敵はここでは弾かれる）。
 */
const resolveLeaks = (
  damaged: readonly ActiveEnemy[],
  map: StageMap,
  life: number,
  events: TickEvent[]
): { settled: ActiveEnemy[]; life: number } => {
  let nextLife = life;
  const settled = damaged.map((enemy) => {
    if (!enemy.alive || enemy.progress < goalFor(map, enemy)) return enemy;
    nextLife -= 1;
    events.push({ kind: 'leak', enemyId: enemy.id });
    return { ...enemy, alive: false, leaked: true };
  });
  return { settled, life: nextLife };
};

export const stepTick = (
  state: CombatState,
  actions: readonly PlayerAction[],
  map: StageMap
): CombatState => {
  if (state.outcome !== 'playing') return state;

  const tick = state.tick + 1;

  // --- プレイヤー操作 ---
  const afterActions = applyActions(state, actions, map, tick);
  const { events } = afterActions;

  // --- マナ生成 ---
  const { reactors, mana } = runReactors(afterActions.reactors, afterActions.mana, events);

  // --- 燠火のクールダウン消化 ---
  const embers = decayEmbers(afterActions.embers, afterActions.freshEmberIndices);

  // --- ドロー ---
  const { deck, ticksToDraw } = runDraw(afterActions.deck, state.ticksToDraw, events);

  // --- 出現 ---
  const nextId = state.enemies.reduce((max, e) => Math.max(max, e.id + 1), 0);
  const spawned = spawnAt(state, tick, nextId);

  // --- 移動（時泥の効果中は敵の足が遅くなる。プレイヤー操作の後に行うため、
  //     この tick に置いた守り手が即座にブロックへ効く） ---
  const moved = moveEnemies(
    state.enemies,
    spawned,
    { tick, slowUntilTick: afterActions.slowUntilTick, slowMultiplier: afterActions.slowMultiplier },
    map,
    afterActions.units
  );

  // --- 敵の攻撃（移動確定後・罠より前。移動後の座標でブロック関係が決まるため） ---
  const blockCtx: BlockContext = { units: afterActions.units, map, tick };
  const survivingUnits = applyEnemyAttacks(blockCtx, moved, events);

  // --- 罠 → 射撃 → 業火・燠火の順で hpById に下書きし、最後にまとめて反映する ---
  const hpById = new Map<number, number>();
  const sourceById: SourceById = new Map();
  moved.forEach((e) => hpById.set(e.id, e.hp));
  const statusById = new Map<number, EnemyStatusDraft>();
  const traps = applyTraps(
    afterActions.traps, moved, hpById, sourceById, statusById, tick, map, events
  );
  const units = applyUnitShots(
    state, survivingUnits, moved, map, hpById, sourceById, events, tick
  );
  applyBlasts(afterActions.blasts, moved, map, hpById, sourceById, tick);

  // --- ダメージ・状態反映 → 漏れ ---
  const damaged = resolveDamage(moved, hpById, sourceById, statusById, events);
  const { settled, life } = resolveLeaks(damaged, map, state.life, events);

  const next: CombatState = {
    ...state,
    tick,
    life,
    mana,
    deck,
    reactors,
    units,
    traps,
    embers,
    ticksToDraw,
    enemies: settled,
    placeCooldown: afterActions.placeCooldown,
    slowUntilTick: afterActions.slowUntilTick,
    slowMultiplier: afterActions.slowMultiplier,
    events,
    outcome: 'playing',
    levyOptions: afterActions.levyOptions,
  };

  if (life <= 0) return { ...next, life: 0, outcome: 'lost' };
  if (isCleared(next, tick)) return { ...next, outcome: 'won' };
  return next;
};

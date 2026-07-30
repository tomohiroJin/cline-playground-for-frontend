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
import { isSlowCell, isHighGround } from '../board/stage-map';
import { drawOne, discardFromHand, peekTop, takeFromPeek } from '../cards/deck';
import type { DeckState } from '../cards/deck';
import { getCardDefinition } from '../cards/card-pool';
import { placementKindOf, type CardDefinition } from '../cards/card-definition';
import { getEnemySpec } from './enemies';
import { isEnemyFlying, isEnemyStunned } from './enemy-status';
import { DRAW_INTERVAL_TICKS, PLACE_COOLDOWN_TICKS } from './combat-state';
import type {
  CombatState,
  ActiveEnemy,
  TickEvent,
  PlacedTower,
  PlacedTrap,
  PlacedReactor,
  PlacedEmber,
} from './combat-state';

/** プレイヤーがその tick に行った操作 */
export type PlayerAction =
  | { kind: 'play-card'; handIndex: number; pos?: CellPos }
  | { kind: 'reactivate'; emberIndex: number }
  | { kind: 'choose-levy'; optionIndex: number };

/** 滞留セル上の移動量倍率 */
export const SLOW_TERRAIN_MULT = 0.6;

/** 高台に設置した塔の火力倍率 */
export const HIGH_GROUND_DAMAGE_MULT = 1.3;

/**
 * 塔の実効ダメージ
 *
 * round(基礎 × 重装特効 × 高台倍率 × (1 + Σ隣接オーラ))。
 * 特効は対象の**最大HP**で判定する（現在HPだと削るほど弱くなり直感に反する）。
 * 倍率の二重適用を避けるため、この関数だけがダメージ算出の責務を持つ。
 */
export const effectiveDamage = (
  state: CombatState,
  towerIndex: number,
  map: StageMap,
  target: ActiveEnemy
): number => {
  const tower = state.towers[towerIndex];
  if (!tower) return 0;
  const spec = getCardDefinition(tower.cardId).tower;
  if (!spec || spec.aura) return 0;
  const auraBonus = state.towers.reduce((sum, other) => {
    const otherSpec = getCardDefinition(other.cardId).tower;
    const damageBonus = otherSpec?.aura?.towerDamageBonus;
    if (damageBonus === undefined) return sum;
    const adjacent =
      Math.abs(other.pos.x - tower.pos.x) <= 1 && Math.abs(other.pos.y - tower.pos.y) <= 1;
    return adjacent ? sum + damageBonus : sum;
  }, 0);
  const highGround = isHighGround(map, tower.pos) ? HIGH_GROUND_DAMAGE_MULT : 1;
  const threshold = spec.heavyBonusThreshold;
  const heavy =
    threshold !== undefined && target.maxHp >= threshold ? (spec.heavyBonusMultiplier ?? 1) : 1;
  return Math.round(spec.damage * heavy * highGround * (1 + auraBonus));
};

/**
 * 塔の実効射程
 *
 * 基礎射程 + Σ隣接オーラの射程加算。effectiveDamage と同じく、
 * 算出責務をこの関数だけに持たせて加算の二重適用を防ぐ。
 * オーラ塔自身は攻撃しないため 0 を返す。
 */
export const effectiveRange = (
  state: CombatState,
  towerIndex: number,
  _map: StageMap
): number => {
  const tower = state.towers[towerIndex];
  if (!tower) return 0;
  const spec = getCardDefinition(tower.cardId).tower;
  if (!spec || spec.aura) return 0;
  const bonus = state.towers.reduce((sum, other) => {
    const otherSpec = getCardDefinition(other.cardId).tower;
    const rangeBonus = otherSpec?.aura?.towerRangeBonus;
    if (rangeBonus === undefined) return sum;
    const adjacent =
      Math.abs(other.pos.x - tower.pos.x) <= 1 && Math.abs(other.pos.y - tower.pos.y) <= 1;
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

const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

/** そのスロットが既に何かで埋まっているか */
const isSlotOccupied = (state: CombatState, pos: CellPos): boolean =>
  state.towers.some((t) => samePos(t.pos, pos)) ||
  state.reactors.some((r) => samePos(r.pos, pos)) ||
  state.embers.some((e) => samePos(e.pos, pos));

/**
 * そのカードをその位置に置けるか
 *
 * UI はこれを使って「置けるマスだけをハイライト」する（設計書 §9.7）。
 * 選択空間 60通りを数個に落とすための判定であり、ドメインが唯一の真実を持つ。
 *
 * 引数 `state` は tick 開始時点（今 tick に処理済みの配置操作を含まない）のものを渡す前提。
 * `stepTick` は配置クールダウンにより1 tick に1回しか配置を確定しないため、
 * 同一 tick 内で2回目の判定が必要になるケースは存在しない。
 */
export const canPlaceAt = (
  state: CombatState,
  card: CardDefinition,
  pos: CellPos,
  map: StageMap
): boolean => {
  const kind = placementKindOf(card);
  if (kind === 'none') return false;
  if (kind === 'path') {
    return map.path.some((c) => samePos(c, pos)) && !state.traps.some((t) => samePos(t.pos, pos));
  }
  return map.buildSlots.some((c) => samePos(c, pos)) && !isSlotOccupied(state, pos);
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
          progress: entry.spawnPathIndex,
          spawnTick: tick,
          spawnPathIndex: entry.spawnPathIndex,
          alive: true,
          leaked: false,
          groundedUntilTick: 0,
          stunnedUntilTick: 0,
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
}

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
  towers: PlacedTower[];
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
  draft.blasts.push({ pos: ember.pos, radius: spec.radius, damage: spec.damage });
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
  if (card.type === 'tower' && pos) {
    draft.towers.push({ cardId, pos, cooldownLeft: 0 });
  } else if (card.type === 'trap' && pos && card.trap) {
    draft.traps.push({ cardId, pos, usesLeft: card.trap.uses, hitEnemyIds: [] });
  } else if (card.type === 'reactor' && pos && card.reactor) {
    draft.reactors.push({ pos, ticksToMana: card.reactor.intervalTicks });
  } else if (card.type === 'ember' && pos && card.ember) {
    draft.embers.push({ pos, cooldownLeft: card.ember.cooldownTicks });
    draft.freshEmberIndices.add(draft.embers.length - 1);
    draft.blasts.push({ pos, radius: card.ember.radius, damage: card.ember.damage });
  } else if (card.type === 'spell' && card.spell) {
    draft.slowUntilTick = tick + card.spell.durationTicks;
    draft.slowMultiplier = card.spell.speedMultiplier;
  } else if (card.type === 'levy' && card.levy) {
    const peeked = peekTop(draft.deck, card.levy.peekCount);
    draft.deck = peeked.deck;
    draft.levyOptions = peeked.options;
  }
};

/** カード使用操作を適用する（クールダウン・手札・マナ・設置可否を順に検査） */
const applyPlayCard = (
  draft: ActionsDraft,
  state: CombatState,
  map: StageMap,
  tick: number,
  action: Extract<PlayerAction, { kind: 'play-card' }>
): void => {
  if (draft.placeCooldown > 0) {
    draft.events.push({ kind: 'rejected', reason: 'cooldown' });
    return;
  }
  const cardId = draft.deck.hand[action.handIndex];
  if (cardId === undefined) {
    draft.events.push({ kind: 'rejected', reason: 'target' });
    return;
  }
  const card = getCardDefinition(cardId);
  if (card.type === 'levy' && draft.levyOptions.length > 0) {
    draft.events.push({ kind: 'rejected', reason: 'pending' });
    return;
  }
  if (card.cost > draft.mana) {
    draft.events.push({ kind: 'rejected', reason: 'mana' });
    return;
  }
  if (placementKindOf(card) !== 'none' && (!action.pos || !canPlaceAt(state, card, action.pos, map))) {
    draft.events.push({ kind: 'rejected', reason: 'target' });
    return;
  }
  // ここから確定
  draft.mana -= card.cost;
  draft.deck = discardFromHand(draft.deck, action.handIndex);
  draft.placeCooldown = PLACE_COOLDOWN_TICKS;
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
    towers: [...state.towers],
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

/**
 * 敵の移動
 *
 * 出現直後の敵（spawnTick === tick）はまだ動かさない。時泥の効果中は
 * 全体の移動量が下がり、滞留セルではさらに移動量が落ちる（乗算）。
 * 罠・射撃の判定はこの後の座標を前提にするため、必ず先に確定させる。
 */
const moveEnemies = (
  existing: readonly ActiveEnemy[],
  spawned: readonly ActiveEnemy[],
  tick: number,
  slowUntilTick: number,
  slowMultiplier: number,
  map: StageMap,
  goal: number
): ActiveEnemy[] => {
  const slowMult = tick <= slowUntilTick ? slowMultiplier : 1;
  return [...existing, ...spawned].map((enemy) => {
    if (!enemy.alive) return enemy;
    if (enemy.spawnTick === tick) return enemy;
    if (isEnemyStunned(enemy, tick)) return enemy;
    const spec = getEnemySpec(enemy.enemyId);
    const cell = map.path[Math.min(Math.floor(enemy.progress), goal)];
    const terrain = cell && isSlowCell(map, cell) ? SLOW_TERRAIN_MULT : 1;
    return { ...enemy, progress: enemy.progress + spec.speed * terrain * slowMult };
  });
};

/** 罠が発動する距離（セル）。表示側の STACK_DISTANCE とは無関係 */
export const TRAP_TRIGGER_DISTANCE = 0.5;

/** 敵の状態変更の下書き（地上化・足止め） */
type EnemyStatusDraft = { groundedUntilTick?: number; stunnedUntilTick?: number };

/**
 * 罠の発動
 *
 * 罠は3種類の対象判定を持つ:
 *   棘罠   … 地上にダメージ
 *   落網   … 飛行を地上化（ダメージなし）
 *   石壁   … 地上を足止め（ダメージなし）
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
      const pos = positionOf(enemy.progress, map.path);
      if (Math.hypot(pos.x - trap.pos.x, pos.y - trap.pos.y) > TRAP_TRIGGER_DISTANCE) return;

      if (spec.damage > 0) {
        hpById.set(enemy.id, (hpById.get(enemy.id) ?? 0) - spec.damage);
      }
      const status = statusById.get(enemy.id) ?? {};
      if (spec.groundedTicks !== undefined) {
        status.groundedUntilTick = tick + spec.groundedTicks - 1;
      }
      if (spec.stunTicks !== undefined) {
        status.stunnedUntilTick = tick + spec.stunTicks - 1;
      }
      statusById.set(enemy.id, status);

      hitEnemyIds.push(enemy.id);
      usesLeft -= 1;
      events.push({ kind: 'trap', trapIndex, targetId: enemy.id });
    });
    return { ...trap, usesLeft, hitEnemyIds };
  });

/**
 * 塔の射撃（クールダウンを消化し、射程内の先頭の敵を狙う）
 *
 * 罠の判定の後に行う（hpById に罠のダメージが反映済みの状態で対象の生死を見る）。
 * オーラ計算に今 tick 配置した塔（篝火含む）も含めるため、towers（towersDraft）を
 * 反映した stateForDamage を effectiveDamage に渡す。素の state を渡すと
 * 今 tick に置いた塔のダメージが0になるため、ここは順序も引数も変えてはいけない。
 */
const applyTowerShots = (
  state: CombatState,
  towers: readonly PlacedTower[],
  moved: readonly ActiveEnemy[],
  map: StageMap,
  hpById: Map<number, number>,
  events: TickEvent[],
  tick: number
): PlacedTower[] => {
  const stateForDamage: CombatState = { ...state, towers: [...towers] };
  return towers.map((tower, towerIndex) => {
    const spec = getCardDefinition(tower.cardId).tower;
    if (!spec || spec.aura) return tower;
    if (tower.cooldownLeft > 0) return { ...tower, cooldownLeft: tower.cooldownLeft - 1 };
    const range = effectiveRange(stateForDamage, towerIndex, map);
    const target = selectTowerTarget(tower, spec, range, moved, map, hpById, tick);
    if (!target) return tower;
    const damage = effectiveDamage(stateForDamage, towerIndex, map, target);
    hpById.set(target.id, (hpById.get(target.id) ?? 0) - damage);
    events.push({ kind: 'shot', towerIndex, targetId: target.id });
    if (spec.splashRadius > 0) {
      applySplashDamage(target, spec, moved, map, hpById, tick, stateForDamage, towerIndex);
    }
    // 発射周期をちょうど cooldownTicks tick にするため -1 する
    // （次tick以降の `cooldownLeft > 0` decrement 判定と合わせて、
    // ちょうど cooldownTicks tick後に再発射できる）。
    // Math.max で下限0にガード: 現行カードに cooldownTicks:0 の通常塔は存在しない
    // （aura塔の beacon のみ0だが、aura塔は関数冒頭で早期returnし本行に到達しない）が、
    // 将来のカード追加で0や不正値が来ても負のcooldownLeftを作らないための契約保証。
    return { ...tower, cooldownLeft: Math.max(0, spec.cooldownTicks - 1) };
  });
};

/** 射程内・命中対象種別を満たす敵のうち、砦に一番近い（progress 降順）ものを狙う */
const selectTowerTarget = (
  tower: PlacedTower,
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
      const pos = positionOf(e.progress, map.path);
      return Math.hypot(pos.x - tower.pos.x, pos.y - tower.pos.y) <= range;
    })
    .sort((a, b) => b.progress - a.progress)[0];

/**
 * 着弾点から splashRadius 以内の他の敵にも巻き込みダメージを与える
 *
 * 特効は敵ごとに判定されるべきなので、中心の敵のダメージ値を流用せず
 * 巻き込む敵ごとに effectiveDamage を呼び直す（重装だけが特効で2倍を受ける）。
 */
const applySplashDamage = (
  target: ActiveEnemy,
  spec: NonNullable<CardDefinition['tower']>,
  moved: readonly ActiveEnemy[],
  map: StageMap,
  hpById: Map<number, number>,
  tick: number,
  stateForDamage: CombatState,
  towerIndex: number
): void => {
  const center = positionOf(target.progress, map.path);
  moved.forEach((other) => {
    if (other.id === target.id || !other.alive) return;
    if (!spec.hitsFlying && isEnemyFlying(other, tick)) return;
    const pos = positionOf(other.progress, map.path);
    if (Math.hypot(pos.x - center.x, pos.y - center.y) <= spec.splashRadius) {
      const damage = effectiveDamage(stateForDamage, towerIndex, map, other);
      hpById.set(other.id, (hpById.get(other.id) ?? 0) - damage);
    }
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
  tick: number
): void => {
  blasts.forEach((blast) => {
    moved.forEach((enemy) => {
      if (!enemy.alive || isEnemyFlying(enemy, tick)) return;
      const pos = positionOf(enemy.progress, map.path);
      if (Math.hypot(pos.x - blast.pos.x, pos.y - blast.pos.y) <= blast.radius) {
        hpById.set(enemy.id, (hpById.get(enemy.id) ?? 0) - blast.damage);
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
  statusById: ReadonlyMap<number, EnemyStatusDraft>,
  events: TickEvent[]
): ActiveEnemy[] =>
  moved.map((enemy) => {
    if (!enemy.alive) return enemy;
    const status = statusById.get(enemy.id);
    const withStatus =
      status === undefined
        ? enemy
        : {
            ...enemy,
            groundedUntilTick: status.groundedUntilTick ?? enemy.groundedUntilTick,
            stunnedUntilTick: status.stunnedUntilTick ?? enemy.stunnedUntilTick,
          };
    const hp = hpById.get(enemy.id) ?? withStatus.hp;
    if (hp > 0) return { ...withStatus, hp };
    events.push({ kind: 'defeat', enemyId: enemy.id });
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
  goal: number,
  life: number,
  events: TickEvent[]
): { settled: ActiveEnemy[]; life: number } => {
  let nextLife = life;
  const settled = damaged.map((enemy) => {
    if (!enemy.alive || enemy.progress < goal) return enemy;
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
  const goal = map.path.length - 1;

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

  // --- 移動（時泥の効果中は敵の足が遅くなる） ---
  const moved = moveEnemies(
    state.enemies,
    spawned,
    tick,
    afterActions.slowUntilTick,
    afterActions.slowMultiplier,
    map,
    goal
  );

  // --- 罠 → 射撃 → 業火・燠火の順で hpById に下書きし、最後にまとめて反映する ---
  const hpById = new Map<number, number>();
  moved.forEach((e) => hpById.set(e.id, e.hp));
  const statusById = new Map<number, EnemyStatusDraft>();
  const traps = applyTraps(afterActions.traps, moved, hpById, statusById, tick, map, events);
  const towers = applyTowerShots(state, afterActions.towers, moved, map, hpById, events, tick);
  applyBlasts(afterActions.blasts, moved, map, hpById, tick);

  // --- ダメージ・状態反映 → 漏れ ---
  const damaged = resolveDamage(moved, hpById, statusById, events);
  const { settled, life } = resolveLeaks(damaged, goal, state.life, events);

  const next: CombatState = {
    ...state,
    tick,
    life,
    mana,
    deck,
    reactors,
    towers,
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

/**
 * 灰燼の城壁 - 1 tick 前進（決定的・純粋関数）
 *
 * 乱数を取らないため、同じ状態と同じ操作列からは常に同じ結果になる。
 * 時間を進めるのは presentation の setInterval だけで、
 * ここにはタイマーも副作用も持ち込まない（設計書 §8.2）。
 *
 * 1 tick の処理順:
 *   操作 → マナ生成 → ドロー → 出現 → 移動 → 罠 → 射撃 → 漏れ → 勝敗
 */
import type { CellPos, StageMap } from '../board/stage-map';
import { isSlowCell, isHighGround } from '../board/stage-map';
import { drawOne, discardFromHand } from '../cards/deck';
import { getCardDefinition } from '../cards/card-pool';
import { placementKindOf, type CardDefinition } from '../cards/card-definition';
import { getEnemySpec } from './enemies';
import { DRAW_INTERVAL_TICKS, PLACE_COOLDOWN_TICKS } from './combat-state';
import type { CombatState, ActiveEnemy, TickEvent } from './combat-state';

/** プレイヤーがその tick に行った操作 */
export type PlayerAction =
  | { kind: 'play-card'; handIndex: number; pos?: CellPos }
  | { kind: 'reactivate'; emberIndex: number };

/** 滞留セル上の移動量倍率 */
export const SLOW_TERRAIN_MULT = 0.6;

/** 高台に設置した塔の火力倍率 */
export const HIGH_GROUND_DAMAGE_MULT = 1.3;

/**
 * 塔の実効ダメージ
 *
 * round(基礎 × 高台倍率 × (1 + Σ隣接オーラ))。倍率の二重適用を避けるため
 * この関数だけがダメージ算出の責務を持つ。
 */
export const effectiveDamage = (
  state: CombatState,
  towerIndex: number,
  map: StageMap
): number => {
  const tower = state.towers[towerIndex];
  if (!tower) return 0;
  const spec = getCardDefinition(tower.cardId).tower;
  if (!spec || spec.aura) return 0;
  const auraBonus = state.towers.reduce((sum, other) => {
    const otherSpec = getCardDefinition(other.cardId).tower;
    if (!otherSpec?.aura) return sum;
    const adjacent =
      Math.abs(other.pos.x - tower.pos.x) <= 1 && Math.abs(other.pos.y - tower.pos.y) <= 1;
    return adjacent ? sum + otherSpec.aura.towerDamageBonus : sum;
  }, 0);
  const highGround = isHighGround(map, tower.pos) ? HIGH_GROUND_DAMAGE_MULT : 1;
  return Math.round(spec.damage * highGround * (1 + auraBonus));
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
  if (tick <= lastSpawnTick) return false;
  return state.enemies.every((e) => !e.alive);
};

export const stepTick = (
  state: CombatState,
  actions: readonly PlayerAction[],
  map: StageMap
): CombatState => {
  if (state.outcome !== 'playing') return state;

  const events: TickEvent[] = [];
  const tick = state.tick + 1;
  let life = state.life;
  const goal = map.path.length - 1;

  // --- プレイヤー操作 ---
  let deckAfterActions = state.deck;
  let manaAfterActions = state.mana;
  let placeCooldown = Math.max(0, state.placeCooldown - 1);
  let slowUntilTick = state.slowUntilTick;
  const towersDraft = [...state.towers];
  const trapsDraft = [...state.traps];
  const reactorsDraft = [...state.reactors];
  const embersDraft = [...state.embers];
  /** 業火・燠火が与える即時ダメージ。敵の HP 反映時に適用する */
  const blasts: { pos: CellPos; radius: number; damage: number }[] = [];
  /** この tick に配置・再点火した燠火の index。今 tick は経過減算の対象から外す */
  const freshEmberIndices = new Set<number>();

  actions.forEach((action) => {
    if (action.kind === 'reactivate') {
      const ember = embersDraft[action.emberIndex];
      if (!ember || ember.cooldownLeft > 0) return;
      const spec = getCardDefinition('ember-blast').ember;
      if (!spec) return;
      embersDraft[action.emberIndex] = { ...ember, cooldownLeft: spec.cooldownTicks };
      freshEmberIndices.add(action.emberIndex);
      blasts.push({ pos: ember.pos, radius: spec.radius, damage: spec.damage });
      events.push({ kind: 'ember', emberIndex: action.emberIndex });
      return;
    }
    if (placeCooldown > 0) {
      events.push({ kind: 'rejected', reason: 'cooldown' });
      return;
    }
    const cardId = deckAfterActions.hand[action.handIndex];
    if (cardId === undefined) {
      events.push({ kind: 'rejected', reason: 'target' });
      return;
    }
    const card = getCardDefinition(cardId);
    if (card.cost > manaAfterActions) {
      events.push({ kind: 'rejected', reason: 'mana' });
      return;
    }
    const kind = placementKindOf(card);
    if (kind !== 'none') {
      if (!action.pos || !canPlaceAt(state, card, action.pos, map)) {
        events.push({ kind: 'rejected', reason: 'target' });
        return;
      }
    }
    // ここから確定
    manaAfterActions -= card.cost;
    deckAfterActions = discardFromHand(deckAfterActions, action.handIndex);
    placeCooldown = PLACE_COOLDOWN_TICKS;
    events.push({ kind: 'played', cardId, pos: action.pos });

    if (card.type === 'tower' && action.pos) {
      towersDraft.push({ cardId, pos: action.pos, cooldownLeft: 0 });
    } else if (card.type === 'trap' && action.pos && card.trap) {
      trapsDraft.push({ cardId, pos: action.pos, usesLeft: card.trap.uses, hitEnemyIds: [] });
    } else if (card.type === 'reactor' && action.pos && card.reactor) {
      reactorsDraft.push({ pos: action.pos, ticksToMana: card.reactor.intervalTicks });
    } else if (card.type === 'ember' && action.pos && card.ember) {
      embersDraft.push({ pos: action.pos, cooldownLeft: card.ember.cooldownTicks });
      freshEmberIndices.add(embersDraft.length - 1);
      blasts.push({ pos: action.pos, radius: card.ember.radius, damage: card.ember.damage });
    } else if (card.type === 'spell' && card.spell) {
      slowUntilTick = tick + card.spell.durationTicks;
    }
  });

  // マナ生成
  const reactors = reactorsDraft.map((r) => {
    const next = r.ticksToMana - 1;
    if (next > 0) return { ...r, ticksToMana: next };
    manaAfterActions += 1;
    events.push({ kind: 'mana', amount: 1 });
    return { ...r, ticksToMana: getCardDefinition('reactor').reactor?.intervalTicks ?? next };
  });

  // 燠火のクールダウンを毎 tick 1 減らす（0 で止める）。
  // 今 tick に配置・再点火したものは、まだ経過していないので減らさない
  const embers = embersDraft.map((e, i) =>
    freshEmberIndices.has(i) ? e : { ...e, cooldownLeft: Math.max(0, e.cooldownLeft - 1) }
  );

  // ドロー
  let ticksToDraw = state.ticksToDraw - 1;
  if (ticksToDraw <= 0) {
    ticksToDraw = DRAW_INTERVAL_TICKS;
    const outcome = drawOne(deckAfterActions);
    deckAfterActions = outcome.deck;
    if (outcome.drawn !== undefined) {
      events.push(
        outcome.overflowed
          ? { kind: 'overflow', cardId: outcome.drawn }
          : { kind: 'draw', cardId: outcome.drawn }
      );
    }
  }

  // 出現
  const nextId = state.enemies.reduce((max, e) => Math.max(max, e.id + 1), 0);
  const spawned = spawnAt(state, tick, nextId);

  // 移動（時泥の効果中は敵の足が遅くなる）
  const slowMult = tick <= slowUntilTick ? 0.6 : 1;
  const moved = [...state.enemies, ...spawned].map((enemy) => {
    if (!enemy.alive) return enemy;
    if (enemy.spawnTick === tick) return enemy;
    const spec = getEnemySpec(enemy.enemyId);
    const cell = map.path[Math.min(Math.floor(enemy.progress), goal)];
    const terrain = cell && isSlowCell(map, cell) ? SLOW_TERRAIN_MULT : 1;
    return { ...enemy, progress: enemy.progress + spec.speed * terrain * slowMult };
  });

  // 罠（地上敵のみ・同じ敵は同じ罠で一度だけ）
  const hpById = new Map<number, number>();
  moved.forEach((e) => hpById.set(e.id, e.hp));
  const traps = trapsDraft.map((trap, trapIndex) => {
    if (trap.usesLeft <= 0) return trap;
    let usesLeft = trap.usesLeft;
    const hitEnemyIds = [...trap.hitEnemyIds];
    const spec = getCardDefinition(trap.cardId).trap;
    if (!spec) return trap;
    moved.forEach((enemy) => {
      if (!enemy.alive || usesLeft <= 0) return;
      if (getEnemySpec(enemy.enemyId).flying) return;
      if (hitEnemyIds.includes(enemy.id)) return;
      const pos = positionOf(enemy.progress, map.path);
      if (Math.hypot(pos.x - trap.pos.x, pos.y - trap.pos.y) > 0.5) return;
      hpById.set(enemy.id, (hpById.get(enemy.id) ?? 0) - spec.damage);
      hitEnemyIds.push(enemy.id);
      usesLeft -= 1;
      events.push({ kind: 'trap', trapIndex, targetId: enemy.id });
    });
    return { ...trap, usesLeft, hitEnemyIds };
  });

  // 射撃（クールダウンを消化し、射程内の先頭の敵を狙う）
  // オーラ計算に今 tick 配置した塔（篝火含む）も含めるため towersDraft を渡す
  const stateForDamage: CombatState = { ...state, towers: towersDraft };
  const towers = towersDraft.map((tower, towerIndex) => {
    const spec = getCardDefinition(tower.cardId).tower;
    if (!spec || spec.aura) return tower;
    if (tower.cooldownLeft > 0) return { ...tower, cooldownLeft: tower.cooldownLeft - 1 };
    const damage = effectiveDamage(stateForDamage, towerIndex, map);
    // 砦に近い敵を優先（progress 降順）
    const target = [...moved]
      .filter((e) => e.alive && (hpById.get(e.id) ?? 0) > 0)
      .filter((e) => spec.hitsFlying || !getEnemySpec(e.enemyId).flying)
      .filter((e) => {
        const pos = positionOf(e.progress, map.path);
        return Math.hypot(pos.x - tower.pos.x, pos.y - tower.pos.y) <= spec.range;
      })
      .sort((a, b) => b.progress - a.progress)[0];
    if (!target) return tower;
    hpById.set(target.id, (hpById.get(target.id) ?? 0) - damage);
    events.push({ kind: 'shot', towerIndex, targetId: target.id });
    if (spec.splashRadius > 0) {
      const center = positionOf(target.progress, map.path);
      moved.forEach((other) => {
        if (other.id === target.id || !other.alive) return;
        if (!spec.hitsFlying && getEnemySpec(other.enemyId).flying) return;
        const pos = positionOf(other.progress, map.path);
        if (Math.hypot(pos.x - center.x, pos.y - center.y) <= spec.splashRadius) {
          hpById.set(other.id, (hpById.get(other.id) ?? 0) - damage);
        }
      });
    }
    return { ...tower, cooldownLeft: spec.cooldownTicks };
  });

  // 業火・燠火の即時ダメージ（地上敵のみ）
  blasts.forEach((blast) => {
    moved.forEach((enemy) => {
      if (!enemy.alive || getEnemySpec(enemy.enemyId).flying) return;
      const pos = positionOf(enemy.progress, map.path);
      if (Math.hypot(pos.x - blast.pos.x, pos.y - blast.pos.y) <= blast.radius) {
        hpById.set(enemy.id, (hpById.get(enemy.id) ?? 0) - blast.damage);
      }
    });
  });

  // ダメージを反映し、撃破を確定する
  const damaged = moved.map((enemy) => {
    if (!enemy.alive) return enemy;
    const hp = hpById.get(enemy.id) ?? enemy.hp;
    if (hp > 0) return { ...enemy, hp };
    events.push({ kind: 'defeat', enemyId: enemy.id });
    return { ...enemy, hp: 0, alive: false };
  });

  // 漏れ
  const settled = damaged.map((enemy) => {
    if (!enemy.alive || enemy.progress < goal) return enemy;
    life -= 1;
    events.push({ kind: 'leak', enemyId: enemy.id });
    return { ...enemy, alive: false, leaked: true };
  });

  const next: CombatState = {
    ...state,
    tick,
    life,
    mana: manaAfterActions,
    deck: deckAfterActions,
    reactors,
    towers,
    traps,
    embers,
    ticksToDraw,
    enemies: settled,
    placeCooldown,
    slowUntilTick,
    events,
    outcome: 'playing',
  };

  if (life <= 0) return { ...next, life: 0, outcome: 'lost' };
  if (isCleared(next, tick)) return { ...next, outcome: 'won' };
  return next;
};

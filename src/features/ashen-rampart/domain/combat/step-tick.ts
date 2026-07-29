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
import { drawOne } from '../cards/deck';
import { getCardDefinition } from '../cards/card-pool';
import { getEnemySpec } from './enemies';
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
  let { life, mana, deck } = state;
  const goal = map.path.length - 1;

  // マナ生成
  const reactors = state.reactors.map((r) => {
    const next = r.ticksToMana - 1;
    if (next > 0) return { ...r, ticksToMana: next };
    const card = 60;
    mana += 1;
    events.push({ kind: 'mana', amount: 1 });
    return { ...r, ticksToMana: card };
  });

  // ドロー
  let ticksToDraw = state.ticksToDraw - 1;
  if (ticksToDraw <= 0) {
    ticksToDraw = 40;
    const outcome = drawOne(deck);
    deck = outcome.deck;
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

  // 移動
  const slowMult = tick <= state.slowUntilTick ? 0.6 : 1;
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
  const traps = state.traps.map((trap, trapIndex) => {
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
  const towers = state.towers.map((tower, towerIndex) => {
    const spec = getCardDefinition(tower.cardId).tower;
    if (!spec || spec.aura) return tower;
    if (tower.cooldownLeft > 0) return { ...tower, cooldownLeft: tower.cooldownLeft - 1 };
    const damage = effectiveDamage(state, towerIndex, map);
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
    mana,
    deck,
    reactors,
    towers,
    traps,
    ticksToDraw,
    enemies: settled,
    placeCooldown: Math.max(0, state.placeCooldown - 1),
    events,
    outcome: 'playing',
  };

  if (life <= 0) return { ...next, life: 0, outcome: 'lost' };
  if (isCleared(next, tick)) return { ...next, outcome: 'won' };
  return next;
};

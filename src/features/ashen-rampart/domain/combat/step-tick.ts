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
import { isSlowCell } from '../board/stage-map';
import { drawOne } from '../cards/deck';
import { getEnemySpec } from './enemies';
import type { CombatState, ActiveEnemy, TickEvent } from './combat-state';

/** プレイヤーがその tick に行った操作 */
export type PlayerAction =
  | { kind: 'play-card'; handIndex: number; pos?: CellPos }
  | { kind: 'reactivate'; emberIndex: number };

/** 滞留セル上の移動量倍率 */
export const SLOW_TERRAIN_MULT = 0.6;

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

  // 漏れ
  const settled = moved.map((enemy) => {
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

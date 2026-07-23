/**
 * 灰燼の城壁 - 戦闘シミュレーション（決定的・純粋関数）
 *
 * (盤面, ウェーブ定義, 修飾子) → tick列 を返す。乱数を使わないため
 * 同一入力からは常に同一結果。UI はこの tick 列を再生するだけで、
 * ゲームロジックを一切持たない。
 */
import type { BoardState } from '../board/board-state';
import type { CellPos } from '../board/stage-map';
import { isSlowCell, isHighGround } from '../board/stage-map';
import { getCardDefinition } from '../cards/card-pool';
import { getEnemySpec, type EnemySpec } from './enemies';
import type { WaveDefinition } from './waves';

/** スペルによる次ウェーブへの修飾 */
export interface WaveModifiers {
  /** スポーン時に全敵へ与えるダメージ */
  openingDamage: number;
  /** 敵速度の倍率 */
  speedMultiplier: number;
}

export const NO_MODIFIERS: WaveModifiers = {
  openingDamage: 0,
  speedMultiplier: 1,
};

export interface EnemySnapshot {
  index: number;
  enemyId: string;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
}

export type TickEvent =
  | { kind: 'shot'; towerIndex: number; targetIndex: number }
  | { kind: 'trap'; trapIndex: number; targetIndex: number }
  | { kind: 'defeat'; enemyIndex: number }
  | { kind: 'leak'; enemyIndex: number };

export interface CombatTick {
  tick: number;
  enemies: EnemySnapshot[];
  events: TickEvent[];
}

export interface CombatResult {
  ticks: CombatTick[];
  defeated: number;
  leaked: number;
  /** 撃破報酬の合計スコア */
  rewardScore: number;
  /** 盤面の罠ごとの残使用回数（インデックスは board.traps と対応） */
  trapUsesLeft: number[];
}

/** 無限ループ防止の安全弁 */
export const MAX_TICKS = 2000;

/** 滞留セル上の敵の移動量倍率 */
export const SLOW_TERRAIN_MULT = 0.6;

/** 高台に設置したタワーの火力倍率 */
export const HIGH_GROUND_DAMAGE_MULT = 1.3;

interface RuntimeEnemy {
  index: number;
  spec: EnemySpec;
  hp: number;
  progress: number;
  spawnTick: number;
  alive: boolean;
  leaked: boolean;
  hitTraps: Set<number>;
}

/** 進行度から補間済み描画座標を求める */
const positionOf = (progress: number, path: CellPos[]): { x: number; y: number } => {
  const i = Math.min(Math.floor(progress), path.length - 2);
  const frac = Math.min(progress - i, 1);
  const a = path[i];
  const b = path[i + 1];
  return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
};

export const simulateWave = (
  board: BoardState,
  wave: WaveDefinition,
  modifiers: WaveModifiers = NO_MODIFIERS
): CombatResult => {
  const path = board.map.path;

  // スポーン計画: エントリ順に間隔を空けて出現
  const enemies: RuntimeEnemy[] = [];
  let spawnOffset = 0;
  for (const entry of wave.entries) {
    const spec = getEnemySpec(entry.enemyId);
    for (let c = 0; c < entry.count; c++) {
      enemies.push({
        index: enemies.length,
        spec,
        hp: spec.hp,
        progress: 0,
        spawnTick: spawnOffset + c * entry.spawnIntervalTicks,
        alive: false,
        leaked: false,
        hitTraps: new Set(),
      });
    }
    spawnOffset += entry.count * entry.spawnIntervalTicks;
  }

  // 8近傍判定（対角含む）。同一セルは除く
  const areAdjacent = (a: CellPos, b: CellPos): boolean =>
    Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1;

  // オーラ源（かがり火など）。攻撃タワーの実効値算出に使う
  const auraSources = board.towers.filter(
    (t) => getCardDefinition(t.cardId).tower?.aura
  );

  // タワー実効値を戦闘開始時に一括算出（placement は1ウェーブ中不変）
  const towers = board.towers
    .map((t) => {
      const spec = getCardDefinition(t.cardId).tower;
      if (!spec) {
        throw new Error(`タワーカードではありません: ${t.cardId}`);
      }
      return { pos: t.pos, spec };
    })
    // オーラ塔は攻撃しない
    .filter((t) => !t.spec.aura)
    .map((t) => {
      const beaconBonus = auraSources
        .filter((b) => areAdjacent(b.pos, t.pos))
        .reduce(
          (sum, b) => sum + getCardDefinition(b.cardId).tower!.aura!.towerDamageBonus,
          0
        );
      const highGroundMult = isHighGround(board.map, t.pos)
        ? HIGH_GROUND_DAMAGE_MULT
        : 1;
      const effectiveDamage = Math.round(
        t.spec.damage * highGroundMult * board.towerAttackMultiplier * (1 + beaconBonus)
      );
      return {
        pos: t.pos,
        range: t.spec.range,
        splashRadius: t.spec.splashRadius,
        cooldownTicks: t.spec.cooldownTicks,
        effectiveDamage,
        cooldown: 0,
      };
    });
  const trapUsesLeft = board.traps.map((t) => t.usesLeft);

  const ticks: CombatTick[] = [];
  let defeated = 0;
  let leaked = 0;
  let rewardScore = 0;

  const kill = (e: RuntimeEnemy, events: TickEvent[]): void => {
    e.alive = false;
    defeated++;
    rewardScore += e.spec.reward;
    events.push({ kind: 'defeat', enemyIndex: e.index });
  };

  for (let tick = 0; tick < MAX_TICKS; tick++) {
    const events: TickEvent[] = [];

    // ① スポーン（先制ダメージ適用）
    for (const e of enemies) {
      if (!e.alive && !e.leaked && e.hp > 0 && e.spawnTick === tick) {
        e.alive = true;
        if (modifiers.openingDamage > 0) {
          e.hp -= modifiers.openingDamage;
          if (e.hp <= 0) kill(e, events);
        }
      }
    }

    // ② 移動と漏れ判定（滞留セル上は減速）
    for (const e of enemies) {
      if (!e.alive) continue;
      const cell = path[Math.min(Math.floor(e.progress), path.length - 1)];
      const terrainMult = isSlowCell(board.map, cell) ? SLOW_TERRAIN_MULT : 1;
      e.progress += e.spec.speed * modifiers.speedMultiplier * terrainMult;
      if (e.progress >= path.length - 1) {
        e.alive = false;
        e.leaked = true;
        leaked++;
        events.push({ kind: 'leak', enemyIndex: e.index });
      }
    }

    // ③ 罠発動（同じ罠は同じ敵に1回だけ）
    board.traps.forEach((trap, trapIndex) => {
      const trapSpec = getCardDefinition(trap.cardId).trap;
      if (!trapSpec) return;
      for (const e of enemies) {
        if (trapUsesLeft[trapIndex] <= 0) break;
        if (!e.alive || e.hitTraps.has(trapIndex)) continue;
        const cell = path[Math.min(Math.floor(e.progress), path.length - 1)];
        if (cell.x === trap.pos.x && cell.y === trap.pos.y) {
          e.hp -= trapSpec.damage;
          e.hitTraps.add(trapIndex);
          trapUsesLeft[trapIndex]--;
          events.push({ kind: 'trap', trapIndex, targetIndex: e.index });
          if (e.hp <= 0) kill(e, events);
        }
      }
    });

    // ④ タワー攻撃（射程内で最も進んだ敵を狙う）
    towers.forEach((tower, towerIndex) => {
      if (tower.cooldown > 0) {
        tower.cooldown--;
        return;
      }
      let target: RuntimeEnemy | null = null;
      for (const e of enemies) {
        if (!e.alive) continue;
        const p = positionOf(e.progress, path);
        const dist = Math.hypot(p.x - tower.pos.x, p.y - tower.pos.y);
        if (dist <= tower.range && (!target || e.progress > target.progress)) {
          target = e;
        }
      }
      if (!target) return;
      const damage = tower.effectiveDamage;
      const targetPos = positionOf(target.progress, path);
      const victims =
        tower.splashRadius > 0
          ? enemies.filter((e) => {
              if (!e.alive) return false;
              const p = positionOf(e.progress, path);
              return (
                Math.hypot(p.x - targetPos.x, p.y - targetPos.y) <=
                tower.splashRadius
              );
            })
          : [target];
      events.push({ kind: 'shot', towerIndex, targetIndex: target.index });
      for (const v of victims) {
        v.hp -= damage;
        if (v.hp <= 0 && v.alive) kill(v, events);
      }
      // 発射周期をちょうど cooldownTicks tick にするため -1 する
      // （次tick以降の `cooldown > 0` decrement 判定と合わせて、
      // ちょうど cooldownTicks tick後に再発射できる）
      tower.cooldown = tower.cooldownTicks - 1;
    });

    // ⑤ スナップショット
    ticks.push({
      tick,
      enemies: enemies
        .filter((e) => e.alive)
        .map((e) => {
          const p = positionOf(e.progress, path);
          return {
            index: e.index,
            enemyId: e.spec.id,
            hp: e.hp,
            maxHp: e.spec.hp,
            x: p.x,
            y: p.y,
          };
        }),
      events,
    });

    // 終了判定: 生存もスポーン待ちもいなければ終わり
    const hasPending = enemies.some(
      (e) => e.alive || (!e.leaked && e.hp > 0 && e.spawnTick > tick)
    );
    if (!hasPending) break;
  }

  return { ticks, defeated, leaked, rewardScore, trapUsesLeft };
};

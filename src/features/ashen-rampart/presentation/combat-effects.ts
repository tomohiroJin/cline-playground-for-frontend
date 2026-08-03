/**
 * 灰燼の城壁 - エフェクトの寿命管理（純粋）
 *
 * 敵は撃破後も `alive: false` のまま `enemies` に残るが、**`state.events` は
 * 毎 tick 丸ごと置き換わる**。しかも `shot` は `towerIndex`、`defeat` は
 * `enemyId` という参照しか持たない。イベントを受け取ったその tick のうちに
 * 座標へ解決してスナップショットしておくのが、参照の解決先が将来変わっても
 * 壊れない形である。この関数だけがその責務を持つ。
 *
 * 座標はセル座標系のまま保持する（SVG の viewBox をセル座標に一致させるため）。
 */
import type { CellPos, StageMap } from '../domain/board/stage-map';
import { fortressCell, laneOf } from '../domain/board/stage-map';
import type { CombatState, TickEvent } from '../domain/combat/combat-state';
import { positionOf } from '../domain/combat/step-tick';
import { getCardDefinition } from '../domain/cards/card-pool';

/**
 * 同時に描くエフェクトの上限
 *
 * 塔6基 × クールダウン8 tick では常時1〜3本の線が明滅し、群れ22体と
 * 重なる局面がある。反証条件「情報量そのものが過大」に当たったときは
 * まずこの値を下げる（設計書 §8.4）。
 */
export const MAX_CONCURRENT_EFFECTS = 12;

/** 各エフェクトの寿命（tick）。1 tick = 100ms */
export const EFFECT_LIFETIME = {
  shot: 3,
  trap: 3,
  ember: 5,
  defeat: 8,
  leak: 8,
} as const;

/**
 * 破棄の優先度（大きいほど残す）
 *
 * 寿命は shot 3 tick に対し leak 8 tick で、leak は常に「古い」側になる。
 * 古い順に落とすと最も重要な情報が最初に捨てられるため、優先度順にする。
 */
const EFFECT_PRIORITY = {
  leak: 4,
  defeat: 3,
  trap: 2,
  ember: 2,
  shot: 1,
} as const;

/**
 * reduced-motion 時の一律の寿命（tick）
 *
 * 寿命 3/5/8 tick のものが同時に静止すると、動きで区別していた手がかりが
 * 消え、罠の縁と漏れの塗り（どちらも danger）が位置以外で弁別できなくなる。
 * 最長に揃えて数を減らし、1つずつ確実に見せる方向へ倒す。
 */
export const REDUCED_MOTION_LIFETIME = EFFECT_LIFETIME.defeat;

/**
 * エフェクトの線幅・破線パターン
 *
 * 設計書 §4.5 は「MAX_CONCURRENT_EFFECTS・各イベントの寿命・線幅」を
 * 1ファイルに集約すると定める。反証条件「情報量が過大」に当たったとき、
 * 太さ側で調整すべき値がここに揃っていることが目的（BoardEffectLayer.tsx は
 * この定数を参照するだけにし、リテラルを持たない）。
 */
export const EFFECT_STROKE_WIDTH = {
  /** 通常の射撃線 */
  shot: 1,
  /** 範囲攻撃の射撃線（太線） */
  shotWide: 3,
  /** 撃破の主線 */
  defeat: 4,
  /** 撃破終端の ✕ マーク */
  defeatMark: 3,
  /** 罠の枠 */
  trap: 3,
  /** 燠火の輪 */
  ember: 2,
} as const;

/** 貫通の塔の射撃線に使う破線パターン */
export const EFFECT_DASH_PATTERN = '4 3';

export interface AdvanceOptions {
  /** prefers-reduced-motion: reduce のとき true */
  reducedMotion?: boolean;
}

export type Effect =
  | {
      kind: 'shot';
      id: string;
      from: CellPos;
      to: CellPos;
      untilTick: number;
      /** 範囲攻撃の塔は太線で描く */
      wide: boolean;
      /** 貫通の塔は破線で描く */
      dashed: boolean;
    }
  | { kind: 'defeat'; id: string; from: CellPos; to: CellPos; untilTick: number }
  | { kind: 'trap'; id: string; at: CellPos; untilTick: number }
  | { kind: 'ember'; id: string; at: CellPos; radius: number; untilTick: number }
  | { kind: 'leak'; id: string; at: CellPos; untilTick: number };

/** 敵の現在位置。既に消えた敵は undefined */
const enemyPos = (state: CombatState, enemyId: number, map: StageMap): CellPos | undefined => {
  const enemy = state.enemies.find((e) => e.id === enemyId);
  if (!enemy) return undefined;
  return positionOf(enemy.progress, laneOf(map, 0));
};

/** 撃破源の座標。既に消えた設置物は undefined */
const sourcePos = (state: CombatState, source: Extract<TickEvent, { kind: 'defeat' }>['source']): CellPos | undefined => {
  if (source.kind === 'tower') return state.towers[source.index]?.pos;
  if (source.kind === 'trap') return state.traps[source.index]?.pos;
  return state.embers[source.index]?.pos;
};

/** そのイベントに与える寿命。reduced-motion では一律にする */
const lifetimeOf = (kind: Effect['kind'], reducedMotion: boolean): number =>
  reducedMotion ? REDUCED_MOTION_LIFETIME : EFFECT_LIFETIME[kind];

/** 1件の TickEvent をエフェクトへ変換する。描かないイベントは undefined */
const toEffect = (
  event: TickEvent,
  state: CombatState,
  map: StageMap,
  index: number,
  reducedMotion: boolean
): Effect | undefined => {
  const tick = state.tick;
  const id = `${tick}-${index}`;
  if (event.kind === 'shot') {
    const from = state.towers[event.towerIndex]?.pos;
    const to = enemyPos(state, event.targetId, map);
    if (!from || !to) return undefined;
    const spec = getCardDefinition(state.towers[event.towerIndex]?.cardId ?? '').tower;
    return {
      kind: 'shot',
      id,
      from,
      to,
      untilTick: tick + lifetimeOf('shot', reducedMotion),
      wide: (spec?.splashRadius ?? 0) > 0,
      dashed: spec?.heavyBonusThreshold !== undefined,
    };
  }
  if (event.kind === 'defeat') {
    const from = sourcePos(state, event.source);
    const to = enemyPos(state, event.enemyId, map);
    if (!from || !to) return undefined;
    return { kind: 'defeat', id, from, to, untilTick: tick + lifetimeOf('defeat', reducedMotion) };
  }
  if (event.kind === 'trap') {
    const at = state.traps[event.trapIndex]?.pos;
    if (!at) return undefined;
    return { kind: 'trap', id, at, untilTick: tick + lifetimeOf('trap', reducedMotion) };
  }
  if (event.kind === 'ember') {
    const at = state.embers[event.emberIndex]?.pos;
    if (!at) return undefined;
    const radius = getCardDefinition('ember-blast').ember?.radius ?? 1;
    return { kind: 'ember', id, at, radius, untilTick: tick + lifetimeOf('ember', reducedMotion) };
  }
  if (event.kind === 'leak') {
    const at = fortressCell(map);
    if (!at) return undefined;
    return { kind: 'leak', id, at, untilTick: tick + lifetimeOf('leak', reducedMotion) };
  }
  return undefined;
};

/**
 * 前 tick までのエフェクトを進め、この tick のイベントを足す
 *
 * 上限を超えた場合は**優先度の低いものから**落とす。同一優先度の中でのみ
 * 古い順（untilTick が小さい順）に落とす。
 *
 * **寿命の統一と上限の半減は生成時に行う。** 生成後に untilTick を書き換える
 * 関数にすると、毎 tick 呼ばれて寿命が延び続けエフェクトが二度と消えない。
 */
export const advanceEffects = (
  prev: readonly Effect[],
  state: CombatState,
  map: StageMap,
  options: AdvanceOptions = {}
): Effect[] => {
  const reducedMotion = options.reducedMotion ?? false;
  const limit = reducedMotion
    ? Math.floor(MAX_CONCURRENT_EFFECTS / 2)
    : MAX_CONCURRENT_EFFECTS;
  const alive = prev.filter((e) => e.untilTick > state.tick);
  const born = state.events
    .map((event, index) => toEffect(event, state, map, index, reducedMotion))
    .filter((e): e is Effect => e !== undefined);
  const all = [...alive, ...born];
  if (all.length <= limit) return all;
  return [...all]
    .sort((a, b) => {
      const priority = EFFECT_PRIORITY[b.kind] - EFFECT_PRIORITY[a.kind];
      return priority !== 0 ? priority : b.untilTick - a.untilTick;
    })
    .slice(0, limit);
};

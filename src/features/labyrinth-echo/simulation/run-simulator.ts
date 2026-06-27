/**
 * 迷宮の残響 - ヘッドレス・ランシミュレータ
 *
 * 本番と同じ純粋関数（pickEvent/processChoice/checkSecondLife）を合成し、
 * 1ラン分の探索を決定論的に再現する。バランス契約テスト用。
 * フロア/ボス進行ロジックは use-game-actions の useProceed/resolveBossRetry を
 * 純粋関数として再構成したもの（フックは副作用込みで流用不可）。CFG を直接参照し
 * 進行ルールの定数乖離を防ぐ。
 */
import { pickEvent, processChoice, findChainEvent } from '../events/event-utils';
import type { GameEvent } from '../events/event-utils';
import { checkSecondLife } from '../domain/services/combat-service';
import { determineEnding } from '../domain/services/ending-service';
import { createNewPlayer } from '../domain/services/unlock-service';
import { createMetaState } from '../domain/models/meta-state';
import { CFG } from '../domain/constants/config';
import type { Player } from '../domain/models/player';
import type { DifficultyDef } from '../domain/models/difficulty';
import type { FxState } from '../domain/models/unlock';
import type { RandomSource } from '../domain/events/random';
import type { MetaState } from '../domain/models/meta-state';

/** 1ランの結果 */
export interface RunResult {
  readonly survived: boolean;
  readonly floorReached: number;
  readonly endingId: string | null;
  /** "escape" | "体力消耗" | "精神崩壊" */
  readonly cause: string;
  /** 消化したイベント数 */
  readonly events: number;
}

/** 選択方針 */
export interface RunPolicy {
  choose(event: GameEvent, player: Player, fx: FxState, diff: DifficultyDef, rng: RandomSource): number;
}

/** 慎重ポリシー: 解決後 hp+mn 最良の選択肢を貪欲選択（脱出を最優先） */
export const CAREFUL_POLICY: RunPolicy = {
  choose(event, player, fx, diff) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < event.ch.length; i++) {
      const res = processChoice({ event, choiceIdx: i, player, fx, diff });
      const score = res.outcome.fl === 'escape'
        ? Number.POSITIVE_INFINITY
        : res.drained.hp + res.drained.mn;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    return bestIdx;
  },
};

/** 無策ポリシー: 一様ランダム選択 */
export const RANDOM_POLICY: RunPolicy = {
  choose(event, _player, _fx, _diff, rng) {
    return Math.floor(rng.random() * event.ch.length);
  },
};

/** シミュレータ専用の固定メタ（初回相当: echoDepth0 / 履歴なし） */
const SIM_META: MetaState = createMetaState();

/** ボス再戦の進行判定（resolveBossRetry の純粋版） */
const resolveBossStep = (
  usedIds: readonly string[],
  floor: number,
  events: readonly GameEvent[],
  fx: FxState,
  rng: RandomSource,
): { event: GameEvent } | { gameover: true } => {
  const boss = events.find(e => e.id === CFG.BOSS_EVENT_ID);
  if (boss && !usedIds.includes(CFG.BOSS_EVENT_ID)) return { event: boss };

  const bossCount = usedIds.filter(id => id === CFG.BOSS_EVENT_ID).length;
  const lastBossIdx = usedIds.lastIndexOf(CFG.BOSS_EVENT_ID);
  const postBoss = usedIds.length - lastBossIdx - 1;

  if (bossCount < CFG.MAX_BOSS_RETRIES && postBoss < 2) {
    const ev = pickEvent({ events: [...events], floor, usedIds: [...usedIds], meta: SIM_META, fx, rng });
    if (ev) return { event: ev };
  }
  if (bossCount < CFG.MAX_BOSS_RETRIES && boss) return { event: boss };
  return { gameover: true };
};

/** 1ランを決定論的に実行する */
export const simulateRun = (params: {
  difficulty: DifficultyDef;
  fx: FxState;
  rng: RandomSource;
  policy: RunPolicy;
  events: readonly GameEvent[];
}): RunResult => {
  const { difficulty, fx, rng, policy, events } = params;
  // 初期プレイヤー（本番と同じ createNewPlayer を流用＝DRY・定数乖離なし）
  let player: Player = createNewPlayer(difficulty, fx);
  let floor = 1;
  let step = 0;
  let usedIds: string[] = [];
  let usedSecondLife = false;
  let eventsConsumed = 0;

  let event = pickEvent({ events: [...events], floor, usedIds, meta: SIM_META, fx, rng });

  const fail = (cause: string): RunResult =>
    ({ survived: false, floorReached: floor, endingId: null, cause, events: eventsConsumed });

  while (event) {
    const choiceIdx = policy.choose(event, player, fx, difficulty, rng);
    const res = processChoice({ event, choiceIdx, player, fx, diff: difficulty });
    eventsConsumed++;

    const sl = checkSecondLife(res.drained, fx, usedSecondLife);
    player = sl.player;
    if (sl.activated) usedSecondLife = true;

    if (res.outcome.fl === 'escape') {
      const endingId = determineEnding(player, [], difficulty).id;
      return { survived: true, floorReached: floor, endingId, cause: 'escape', events: eventsConsumed };
    }
    if (player.hp <= 0 || player.mn <= 0) {
      return fail(player.hp <= 0 ? '体力消耗' : '精神崩壊');
    }

    // チェイン優先（step を進めるが floor は進めない: useProceed と同じ）
    if (res.chainId) {
      const ce = findChainEvent([...events], res.chainId);
      if (ce) {
        usedIds = [...usedIds, event.id];
        step = step + 1;
        event = ce;
        continue;
      }
    }

    const nextStep = step + 1;
    usedIds = [...usedIds, event.id];
    const isShort = res.outcome.fl === 'shortcut';
    const nextFloor = isShort
      ? Math.min(floor + 2, CFG.MAX_FLOOR)
      : (nextStep >= CFG.EVENTS_PER_FLOOR ? floor + 1 : floor);

    if (nextFloor > floor && nextFloor <= CFG.MAX_FLOOR) {
      floor = nextFloor; step = 0;
      event = pickEvent({ events: [...events], floor, usedIds, meta: SIM_META, fx, rng });
      continue;
    }
    if (nextFloor > CFG.MAX_FLOOR) {
      const r = resolveBossStep(usedIds, floor, events, fx, rng);
      if ('gameover' in r) return fail('精神崩壊');
      step = nextStep; event = r.event;
      continue;
    }
    step = nextStep;
    event = pickEvent({ events: [...events], floor, usedIds, meta: SIM_META, fx, rng });
  }
  // プール枯渇 = 探索続行不能
  return fail('精神崩壊');
};

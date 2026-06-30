/**
 * 迷宮の残響 - ヘッドレス・ランシミュレータ
 *
 * 純粋関数（pickEvent/processChoice）と正準の domain `checkSecondLife` を合成し、
 * 1ラン分の探索を決定論的に再現する。バランス契約テスト用。
 * base sim は secondLife 無効（fx.secondLife=false）のため checkSecondLife は発動せず無影響。
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
import { applyPressureToDifficulty } from '../domain/services/pressure-service';
import { mergeLegacyIntoFx } from '../domain/services/legacy-service';
import { CFG } from '../domain/constants/config';
import type { Player } from '../domain/models/player';
import type { DifficultyDef } from '../domain/models/difficulty';
import type { FxState } from '../domain/models/unlock';
import type { RandomSource } from '../domain/events/random';
import type { MetaState } from '../domain/models/meta-state';
import type { EchoLegacy } from '../domain/models/echo';
import type { LogEntry } from '../domain/models/game-state';

/** 1ランの結果 */
export interface RunResult {
  readonly survived: boolean;
  readonly floorReached: number;
  readonly endingId: string | null;
  /** "escape" | "体力消耗" | "精神崩壊" */
  readonly cause: string;
  /** 消化したイベント数 */
  readonly events: number;
  /** 探索中に「読み解いた」断片 id 群（キャリアシミュレーション用） */
  readonly fragmentsRead: readonly string[];
}

/** 選択方針 */
export interface RunPolicy {
  choose(event: GameEvent, player: Player, fx: FxState, diff: DifficultyDef, rng: RandomSource): number;
}

// ポリシー実体は policies.ts に集約（type-only 依存のため循環参照にならない）
export { CAREFUL_POLICY, RANDOM_POLICY, LORE_POLICY } from './policies';

/** シミュレータ専用の固定メタ（初回相当: echoDepth0 / 履歴なし） */
const SIM_META: MetaState = createMetaState();

/** 合成ログ要素（determineEnding は log.length のみ参照するため内容はゼロで足りる） */
const SYNTHETIC_LOG_ENTRY: LogEntry = { fl: 0, step: 0, ch: '', hp: 0, mn: 0, inf: 0 };

/** ボス再戦の進行判定（resolveBossRetry の純粋版） */
const resolveBossStep = (
  usedIds: readonly string[],
  floor: number,
  events: readonly GameEvent[],
  fx: FxState,
  rng: RandomSource,
  pressure: number,
  meta: MetaState,
): { event: GameEvent } | { gameover: true } => {
  const boss = events.find(e => e.id === CFG.BOSS_EVENT_ID);
  if (boss && !usedIds.includes(CFG.BOSS_EVENT_ID)) return { event: boss };

  const bossCount = usedIds.filter(id => id === CFG.BOSS_EVENT_ID).length;
  const lastBossIdx = usedIds.lastIndexOf(CFG.BOSS_EVENT_ID);
  const postBoss = usedIds.length - lastBossIdx - 1;

  if (bossCount < CFG.MAX_BOSS_RETRIES && postBoss < 2) {
    const ev = pickEvent({ events: [...events], floor, usedIds: [...usedIds], meta, fx, rng, pressure });
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
  /** 残響圧（既定0: 圧なし） */
  pressure?: number;
  /** メタ状態（既定: 初回相当の SIM_META） */
  meta?: MetaState;
  /** 残響継承（既定null: 継承なし） */
  legacy?: EchoLegacy | null;
}): RunResult => {
  const { difficulty: baseDifficulty, fx: baseFx, rng, policy, events, pressure = 0, meta = SIM_META, legacy = null } = params;
  // 残響継承を基礎 fx にマージ（legacy=null のとき baseFx をそのまま使用）
  const fx = mergeLegacyIntoFx(baseFx, legacy);
  // 残響圧を難易度に適用（pressure=0 のとき baseDifficulty そのまま）
  const difficulty = applyPressureToDifficulty(baseDifficulty, pressure);
  // 初期プレイヤー（本番と同じ createNewPlayer を流用＝DRY・定数乖離なし）
  let player: Player = createNewPlayer(difficulty, fx);
  let floor = 1;
  let step = 0;
  let usedIds: string[] = [];
  let usedSecondLife = false;
  let eventsConsumed = 0;
  const fragmentsRead: string[] = [];

  let event = pickEvent({ events: [...events], floor, usedIds, meta, fx, rng, pressure });

  const fail = (cause: string): RunResult =>
    ({ survived: false, floorReached: floor, endingId: null, cause, events: eventsConsumed, fragmentsRead });

  while (event) {
    const choiceIdx = policy.choose(event, player, fx, difficulty, rng);
    const res = processChoice({ event, choiceIdx, player, fx, diff: difficulty });
    eventsConsumed++;

    // 探索中に読み解いた断片を記録（fl:"frag:<id>"）
    if (res.outcome.fl?.startsWith('frag:')) fragmentsRead.push(res.outcome.fl.slice('frag:'.length));

    const sl = checkSecondLife(res.drained, fx, usedSecondLife);
    player = sl.player;
    if (sl.activated) usedSecondLife = true;

    if (res.outcome.fl === 'escape') {
      // determineEnding は log.length のみ参照する（veteran 判定）。本番のログ件数 ≒ 消化イベント数
      // なので、消化数長の合成ログを渡して log ベース END（歴戦の探索者）も sim で評価可能にする。
      const syntheticLog: LogEntry[] = Array.from({ length: eventsConsumed }, () => SYNTHETIC_LOG_ENTRY);
      const endingId = determineEnding(player, syntheticLog, difficulty).id;
      return { survived: true, floorReached: floor, endingId, cause: 'escape', events: eventsConsumed, fragmentsRead };
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
    const isShort = res.outcome.fl === 'shortcut';
    const nextFloor = isShort
      ? Math.min(floor + 2, CFG.MAX_FLOOR)
      : (nextStep >= CFG.EVENTS_PER_FLOOR ? floor + 1 : floor);

    if (nextFloor > floor && nextFloor <= CFG.MAX_FLOOR) {
      // フロア遷移イベントは本番 CHANGE_FLOOR が usedIds に積まないため除外しない（再出現しうる）
      floor = nextFloor; step = 0;
      event = pickEvent({ events: [...events], floor, usedIds, meta, fx, rng, pressure });
      continue;
    }
    // 同フロア継続・ボス再戦は本番 ADVANCE_STEP が usedIds に積む
    usedIds = [...usedIds, event.id];
    if (nextFloor > CFG.MAX_FLOOR) {
      const r = resolveBossStep(usedIds, floor, events, fx, rng, pressure, meta);
      if ('gameover' in r) return fail('精神崩壊');
      step = nextStep; event = r.event;
      continue;
    }
    step = nextStep;
    event = pickEvent({ events: [...events], floor, usedIds, meta, fx, rng, pressure });
  }
  // プール枯渇 = 探索続行不能
  return fail('精神崩壊');
};

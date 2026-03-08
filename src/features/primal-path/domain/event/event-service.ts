/**
 * イベントサービス
 *
 * ランダムイベントの発生判定、選択肢の効果適用、結果表示を担当する。
 * イベント効果は EventEffectHandler レジストリにより拡張可能（OCP準拠）。
 */
import type {
  RunState, BiomeId, EventChoice, EventCost, EventEffect, RandomEventDef,
} from '../../types';
import { RANDOM_EVENTS, EVENT_CHANCE, EVENT_MIN_BATTLES } from '../../constants';
import { deepCloneRun } from '../shared/utils';
import { eventEffectRegistry } from './event-effect-registry';

/**
 * バトル後にイベントを発生させるか判定する
 */
export function rollEvent(
  r: RunState,
  rng: () => number = Math.random,
): RandomEventDef | undefined {
  // 序盤はイベント発生しない
  if (r.btlCount < EVENT_MIN_BATTLES) return undefined;

  // 確率チェック
  if (rng() >= EVENT_CHANCE) return undefined;

  // バイオームアフィニティを考慮して候補をフィルタ
  const currentBiome = r.cBT;
  const candidates = RANDOM_EVENTS.filter(e => {
    if (e.minBiomeCount && r.bc < e.minBiomeCount) return false;
    return true;
  });

  // バイオームアフィニティがあるイベントを優先（2倍の重み）
  const weighted: RandomEventDef[] = [];
  for (const evt of candidates) {
    weighted.push(evt);
    if (evt.biomeAffinity?.includes(currentBiome as BiomeId)) {
      weighted.push(evt);
    }
  }

  if (weighted.length === 0) return undefined;
  const idx = Math.floor(rng() * weighted.length);
  return weighted[idx];
}

/**
 * イベント選択肢の効果を適用する — Registry ベースで効果を実行
 */
export function applyEventChoice(
  r: RunState,
  choice: EventChoice,
  rng: () => number = Math.random,
): RunState {
  const eff = choice.effect;
  const handler = eventEffectRegistry.get(eff.type);

  // ハンドラーが見つからない場合はそのまま返す
  let next: RunState;
  if (handler) {
    next = handler.apply(r, eff, rng);
  } else {
    next = deepCloneRun(r);
  }

  next.eventCount += 1;
  return next;
}

/** エフェクトタイプに対応するヒントカラーを返す — Registry ベース */
export function getEffectHintColor(effect: EventEffect): string {
  const handler = eventEffectRegistry.get(effect.type);
  return handler ? handler.getHintColor() : '#606060';
}

/** エフェクトタイプに対応するヒントアイコンを返す — Registry ベース */
export function getEffectHintIcon(effect: EventEffect): string {
  const handler = eventEffectRegistry.get(effect.type);
  return handler ? handler.getHintIcon() : '…';
}

/** イベント効果の結果メッセージを生成 — Registry ベース */
export function formatEventResult(
  effect: EventEffect,
  cost?: EventCost,
  evoName?: string,
): { icon: string; text: string } {
  const handler = eventEffectRegistry.get(effect.type);
  if (!handler) return { icon: '…', text: '何も起こらなかった' };
  return handler.formatResult(effect, cost, evoName);
}

/** イベント選択の結果を事前計算（コスト適用 + 効果適用 + メタデータ取得） */
export function computeEventResult(
  run: RunState,
  choice: EventChoice,
  rng: () => number = Math.random,
): { nextRun: RunState; evoName?: string } {
  // コスト適用
  const costApplied = deepCloneRun(run);
  if (choice.cost?.type === 'bone') {
    costApplied.bE = Math.max(0, costApplied.bE - choice.cost.amount);
  } else if (choice.cost?.type === 'hp_damage') {
    costApplied.hp = Math.max(1, costApplied.hp - choice.cost.amount);
  }

  // 効果適用前の進化数を記録
  const evsBefore = costApplied.evs.length;

  // 効果適用
  const nextRun = applyEventChoice(costApplied, choice, rng);

  // ランダム進化の場合、新たに追加された進化名を取得
  const evoName = nextRun.evs.length > evsBefore
    ? nextRun.evs[nextRun.evs.length - 1]?.n
    : undefined;

  return { nextRun, evoName };
}

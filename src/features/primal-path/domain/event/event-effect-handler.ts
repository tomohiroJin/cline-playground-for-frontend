/**
 * イベント効果ハンドラーインターフェース
 *
 * Strategy パターンにより、新しいイベント効果タイプの追加を
 * 既存コードの修正なしで実現する（OCP準拠）。
 */
import type { RunState, EventEffect, EventCost } from '../../types';

/** イベント効果ハンドラーインターフェース */
export interface EventEffectHandler {
  /** イベント効果を適用する */
  apply(run: RunState, effect: EventEffect, rng: () => number): RunState;
  /** ヒントカラーを返す */
  getHintColor(): string;
  /** ヒントアイコンを返す */
  getHintIcon(): string;
  /** 結果メッセージを生成する */
  formatResult(effect: EventEffect, cost?: EventCost, evoName?: string): { icon: string; text: string };
}

/** イベント効果レジストリ型 */
export type EventEffectRegistry = ReadonlyMap<string, EventEffectHandler>;

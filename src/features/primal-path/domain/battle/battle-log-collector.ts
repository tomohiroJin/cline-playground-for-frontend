/**
 * 戦闘ログコレクター
 *
 * tick内で発生したイベントのログエントリを収集する。
 * イミュータブルなコレクターパターンで、純粋関数的な戦闘処理と相性が良い。
 */
import type { LogEntry } from '../../types';

/** バトルログコレクターインターフェース */
export interface BattleLogCollector {
  readonly entries: readonly LogEntry[];
  addDamage(source: string, target: string, amount: number, isCrit: boolean): BattleLogCollector;
  addHeal(target: string, amount: number): BattleLogCollector;
  addSkillUse(icon: string, skillName: string): BattleLogCollector;
  addStatus(message: string, color: string): BattleLogCollector;
}

/** ログコレクターを生成する */
export function createLogCollector(initial: readonly LogEntry[] = []): BattleLogCollector {
  return {
    entries: initial,
    addDamage(source: string, target: string, amount: number, isCrit: boolean): BattleLogCollector {
      const critLabel = isCrit ? ' 💥会心' : '';
      const color = isCrit ? 'gc' : '';
      return createLogCollector([
        ...this.entries,
        { x: `⚔ ${source} → ${target} ${amount}${critLabel}`, c: color },
      ]);
    },
    addHeal(target: string, amount: number): BattleLogCollector {
      return createLogCollector([
        ...this.entries,
        { x: `💚 ${target} +${amount}`, c: 'lc' },
      ]);
    },
    addSkillUse(icon: string, skillName: string): BattleLogCollector {
      return createLogCollector([
        ...this.entries,
        { x: `✦ ${icon} ${skillName}`, c: 'gc' },
      ]);
    },
    addStatus(message: string, color: string): BattleLogCollector {
      return createLogCollector([
        ...this.entries,
        { x: message, c: color },
      ]);
    },
  };
}

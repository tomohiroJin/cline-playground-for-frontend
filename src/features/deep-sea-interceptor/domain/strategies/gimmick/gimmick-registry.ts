// ============================================================================
// Deep Sea Interceptor - ギミックレジストリ
// switch文を排除し、OCP準拠のレジストリパターンで管理
// ============================================================================

import type { GimmickStrategy } from './gimmick-strategy';

/** ギミック名とストラテジーの対応マップ */
const gimmickRegistry = new Map<string, GimmickStrategy>();

/** ギミック戦略を登録 */
export function registerGimmick(name: string, strategy: GimmickStrategy): void {
  gimmickRegistry.set(name, strategy);
}

/** ギミック名からストラテジーを解決 */
export function resolveGimmick(gimmickName: string): GimmickStrategy | undefined {
  return gimmickRegistry.get(gimmickName);
}

/** 登録済みギミック名一覧を取得 */
export function getRegisteredGimmicks(): string[] {
  return Array.from(gimmickRegistry.keys());
}

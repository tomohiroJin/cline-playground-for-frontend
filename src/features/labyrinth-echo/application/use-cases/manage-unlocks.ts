/**
 * 迷宮の残響 - ManageUnlocksUseCase（アンロック管理ユースケース）
 *
 * 購入可否判定 → KP減算 → アンロック追加。
 * 純粋関数として実装し、副作用を持たない。
 */
import type { MetaState } from '../../domain/models/meta-state';
import { canPurchaseUnlock } from '../../domain/services/unlock-service';
import { UNLOCKS } from '../../domain/constants/unlock-defs';

/** アンロック購入の入力 */
export interface PurchaseUnlockInput {
  readonly unlockId: string;
  readonly meta: MetaState;
}

/** アンロック購入の出力 */
export interface PurchaseUnlockOutput {
  readonly updatedMeta: MetaState;
  readonly success: boolean;
  readonly reason?: string;
}

/** アンロック購入ユースケース（純粋関数） */
export const purchaseUnlock = (input: PurchaseUnlockInput): PurchaseUnlockOutput => {
  const { unlockId, meta } = input;

  // 購入可否判定（ドメインサービスに委譲）
  const check = canPurchaseUnlock(unlockId, meta);
  if (!check.purchasable) {
    return {
      updatedMeta: meta,
      success: false,
      reason: check.reason,
    };
  }

  // コストを取得
  const def = UNLOCKS.find(u => u.id === unlockId);
  if (!def) {
    return { updatedMeta: meta, success: false, reason: '定義が見つかりません' };
  }

  // KP減算 + アンロック追加
  const updatedMeta: MetaState = {
    ...meta,
    kp: meta.kp - def.cost,
    unlocked: [...meta.unlocked, unlockId],
  };

  return {
    updatedMeta,
    success: true,
  };
};

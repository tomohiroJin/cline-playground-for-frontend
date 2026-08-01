/**
 * 灰燼の城壁 - 拒否理由の文言（純粋）
 *
 * 表示位置は盤面直下。近接の法則により、フィードバックは原因の近くに置く。
 * 「置けない」は盤面をクリックしたときに起きるため視線は盤面にあり、
 * 手札の上に出すと見落とされる（手札溢れ通知とは別枠にする理由）。
 */
import type { CombatState, TickEvent } from '../domain/combat/combat-state';

export type RejectionReason = Extract<TickEvent, { kind: 'rejected' }>['reason'];

/** tick を秒へ（1 tick = 100ms） */
const toSeconds = (ticks: number): string => (ticks / 10).toFixed(1);

export const rejectionText = (reason: RejectionReason, state: CombatState): string => {
  if (reason === 'cooldown') return `次の設置まで あと ${toSeconds(state.placeCooldown)} 秒`;
  if (reason === 'mana') return `マナが足りない（現在 ${state.mana}）`;
  if (reason === 'occupied') return 'すでに何かが置かれている';
  if (reason === 'pending') return '徴発の選択が先';
  return 'そこには置けない';
};

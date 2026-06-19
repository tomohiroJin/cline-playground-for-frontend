/**
 * キーストーン進化（質的効果カード）の型定義
 */
import type { SynergyTag } from './evolution';
import type { PowerCurve } from './totem';

/** キーストーン識別子（10種） */
export type KeystoneId =
  | 'madblood' | 'primal_roar' | 'hunter_stack' | 'wolf_pack' | 'bone_eater'
  | 'chain_blaze' | 'thorn_guard' | 'eternal_freeze' | 'undying_prayer' | 'double_edge';

/** キーストーン定義（メタ情報。効果ロジックは domain/keystone に分離） */
export interface KeystoneDef {
  readonly id: KeystoneId;
  readonly nm: string;
  readonly ic: string;
  readonly tag: SynergyTag;
  readonly curve: PowerCurve;
  readonly desc: string;
}

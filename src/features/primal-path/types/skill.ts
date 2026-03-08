/**
 * スキル関連の型定義
 */
import type { CivType } from './common';
import type { Ally } from './units';

/** アクティブスキルID */
export type ASkillId = 'fB' | 'nH' | 'bR' | 'sW';

/** スキルエフェクト */
export type SkillFx =
  | { t: 'dmgAll'; bd: number; mul: number }
  | { t: 'healAll'; bh: number; aR: number }
  | { t: 'buffAtk'; aM: number; hC: number; dur: number }
  | { t: 'shield'; dR: number; dur: number };

/** アクティブスキル定義 */
export interface ASkillDef {
  readonly id: ASkillId;
  readonly nm: string;
  readonly ds: string;
  readonly ct: CivType | 'bal';
  readonly rL: number;
  readonly cd: number;
  readonly fx: SkillFx;
  readonly ic: string;
}

/** アクティブバフ */
export interface ABuff {
  sid: ASkillId;
  rT: number;
  fx: SkillFx;
}

/** スキルステート */
export interface SkillSt {
  avl: ASkillId[];
  cds: Partial<Record<ASkillId, number>>;
  bfs: ABuff[];
}

/** スキル関連の状態 */
export interface SkillState {
  /** スキルスロット状態 */
  sk: SkillSt;
  /** 仲間リスト */
  al: Ally[];
  /** 最大仲間数 */
  mxA: number;
  /** スキル使用回数 */
  skillUseCount: number;
}

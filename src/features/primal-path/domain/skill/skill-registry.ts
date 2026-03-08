/**
 * スキルハンドラーレジストリ
 *
 * 全スキルタイプとハンドラーの対応を管理する。
 * 新しいスキルタイプを追加する場合は、ハンドラーを実装し
 * このレジストリに登録するだけで拡張可能（OCP準拠）。
 */
import type { SkillHandler } from './skill-handler';
import type { SkillFx } from '../../types';
import { dmgAllHandler } from './handlers/dmg-all-handler';
import { healAllHandler } from './handlers/heal-all-handler';
import { buffAtkHandler } from './handlers/buff-atk-handler';
import { shieldHandler } from './handlers/shield-handler';

/** スキルハンドラーレジストリ */
export const skillRegistry: ReadonlyMap<SkillFx['t'], SkillHandler> = new Map<SkillFx['t'], SkillHandler>([
  ['dmgAll', dmgAllHandler],
  ['healAll', healAllHandler],
  ['buffAtk', buffAtkHandler],
  ['shield', shieldHandler],
]);

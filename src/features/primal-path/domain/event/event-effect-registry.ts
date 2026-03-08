/**
 * イベント効果ハンドラーレジストリ
 *
 * 全イベント効果タイプとハンドラーの対応を管理する。
 * 新しい効果タイプを追加する場合は、ハンドラーを実装し
 * このレジストリに登録するだけで拡張可能（OCP準拠）。
 */
import type { EventEffectHandler } from './event-effect-handler';
import type { EventEffect } from '../../types';
import { statChangeHandler } from './handlers/stat-change-handler';
import { healHandler } from './handlers/heal-handler';
import { damageHandler } from './handlers/damage-handler';
import { boneChangeHandler } from './handlers/bone-change-handler';
import { addAllyHandler } from './handlers/add-ally-handler';
import { randomEvolutionHandler } from './handlers/random-evolution-handler';
import { civLevelUpHandler } from './handlers/civ-level-up-handler';
import { nothingHandler } from './handlers/nothing-handler';

/** イベント効果ハンドラーレジストリ */
export const eventEffectRegistry: ReadonlyMap<EventEffect['type'], EventEffectHandler> = new Map<EventEffect['type'], EventEffectHandler>([
  ['stat_change', statChangeHandler],
  ['heal', healHandler],
  ['damage', damageHandler],
  ['bone_change', boneChangeHandler],
  ['add_ally', addAllyHandler],
  ['random_evolution', randomEvolutionHandler],
  ['civ_level_up', civLevelUpHandler],
  ['nothing', nothingHandler],
]);

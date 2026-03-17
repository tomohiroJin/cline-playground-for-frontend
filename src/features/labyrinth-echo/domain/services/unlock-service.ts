/**
 * 迷宮の残響 - UnlockService（アンロック計算サービス）
 *
 * アンロック効果の集約・プレイヤー生成・購入判定を行う純粋関数群。
 * game-logic.ts から抽出。
 */
import { CFG } from '../constants/config';
import { UNLOCKS } from '../constants/unlock-defs';
import { FX_DEFAULTS, FX_MULT, FX_BOOL } from '../models/unlock';
import type { FxState, FxMultKey, FxBoolKey, FxAddKey } from '../models/unlock';
import type { Player } from '../models/player';
import { createPlayer } from '../models/player';
import type { DifficultyDef } from '../models/difficulty';
import type { MetaState } from '../models/meta-state';

/**
 * アンロック効果を集約する（純粋関数）
 * 指定されたアンロックIDリストの効果を合算して FxState を生成する。
 * 存在しないIDは無視される。
 * @post 返却値は FX_DEFAULTS と同じキーセットを持つ
 */
export const computeFx = (unlockIds: readonly string[]): FxState => {
  // Partial で段階的に構築し、最後に FxState へ合成する
  const mult: Record<FxMultKey, number> = {
    infoMult: FX_DEFAULTS.infoMult,
    healMult: FX_DEFAULTS.healMult,
    mnReduce: FX_DEFAULTS.mnReduce,
    hpReduce: FX_DEFAULTS.hpReduce,
  };
  const bool: Record<FxBoolKey, boolean> = {
    dangerSense: FX_DEFAULTS.dangerSense,
    bleedReduce: FX_DEFAULTS.bleedReduce,
    drainImmune: FX_DEFAULTS.drainImmune,
    curseImmune: FX_DEFAULTS.curseImmune,
    secondLife: FX_DEFAULTS.secondLife,
    chainBoost: FX_DEFAULTS.chainBoost,
    negotiator: FX_DEFAULTS.negotiator,
    mentalSense: FX_DEFAULTS.mentalSense,
  };
  const add: Record<FxAddKey, number> = {
    hpBonus: FX_DEFAULTS.hpBonus,
    mentalBonus: FX_DEFAULTS.mentalBonus,
    infoBonus: FX_DEFAULTS.infoBonus,
  };

  for (const uid of unlockIds) {
    const def = UNLOCKS.find(u => u.id === uid);
    if (!def?.effects) continue;
    for (const [k, v] of Object.entries(def.effects)) {
      if (FX_MULT.has(k as FxMultKey)) mult[k as FxMultKey] *= v as number;
      else if (FX_BOOL.has(k as FxBoolKey)) bool[k as FxBoolKey] = v as boolean;
      else add[k as FxAddKey] += v as number;
    }
  }

  return { ...add, ...mult, ...bool };
};

/**
 * プレイヤーの初期ステータスを生成する（Factory パターン）
 * @post hp > 0 && mn > 0
 */
export const createNewPlayer = (diff: DifficultyDef, fx: FxState): Player => {
  const hp = CFG.BASE_HP + fx.hpBonus + diff.modifiers.hpMod;
  const mn = CFG.BASE_MN + fx.mentalBonus + diff.modifiers.mnMod;
  return createPlayer({ hp, maxHp: hp, mn, maxMn: mn, inf: CFG.BASE_INF + fx.infoBonus, statuses: [] });
};

/**
 * アンロック購入可否を判定する
 */
export const canPurchaseUnlock = (
  unlockId: string,
  meta: MetaState,
): { purchasable: boolean; reason?: string } => {
  const def = UNLOCKS.find(u => u.id === unlockId);
  if (!def) return { purchasable: false, reason: '不明なアンロック' };

  // 既に購入済み
  if (meta.unlocked.includes(unlockId)) {
    return { purchasable: false, reason: '既に取得済み' };
  }

  // KP不足
  if (meta.kp < def.cost) {
    return { purchasable: false, reason: 'KPが不足しています' };
  }

  // ゲート制限（修羅クリア必須）
  if (def.gateRequirement && !meta.clearedDifficulties.includes(def.gateRequirement)) {
    return { purchasable: false, reason: `${def.gateRequirement}クリアが必要` };
  }

  // 難易度クリア報酬（abyss_perfect はエンディング達成で判定）
  if (def.difficultyRequirement) {
    const req = def.difficultyRequirement;
    const isMet = req === 'abyss_perfect'
      ? meta.endings.includes('abyss_perfect')
      : meta.clearedDifficulties.includes(req);
    if (!isMet) {
      return { purchasable: false, reason: `${req}クリアが必要` };
    }
  }

  // 実績条件
  if (def.achievementCondition && !def.achievementCondition(meta)) {
    return { purchasable: false, reason: def.achievementDescription ?? '条件未達成' };
  }

  return { purchasable: true };
};

/**
 * トロフィー・実績の自動解放判定
 * 条件を満たし、かつ未アンロックのアイテムのIDリストを返す
 */
export const checkAutoUnlocks = (meta: MetaState): readonly string[] => {
  const newUnlocks: string[] = [];

  for (const def of UNLOCKS) {
    if (meta.unlocked.includes(def.id)) continue;

    // トロフィー: 難易度クリア報酬（abyss_perfect はエンディング達成で判定）
    if (def.category === 'trophy' && def.difficultyRequirement) {
      const req = def.difficultyRequirement;
      const isMet = req === 'abyss_perfect'
        ? meta.endings.includes('abyss_perfect')
        : meta.clearedDifficulties.includes(req);
      if (isMet) {
        newUnlocks.push(def.id);
      }
    }

    // 実績: 条件達成
    if (def.category === 'achieve' && def.achievementCondition) {
      if (def.achievementCondition(meta)) {
        newUnlocks.push(def.id);
      }
    }
  }

  return newUnlocks;
};

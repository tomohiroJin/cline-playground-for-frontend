/**
 * シナジーサービス
 *
 * 進化のタグからシナジーの発動判定とボーナス集計を行う。
 */
import type { Evolution, ActiveSynergy, SynergyTag, SynergyEffect } from '../../types';
import { SYNERGY_BONUSES } from '../../constants';

/** シナジーボーナス適用結果 */
export interface SynergyBonusResult {
  atkBonus: number;
  defBonus: number;
  hpBonus: number;
  crBonus: number;
  burnMul: number;
  healBonusRatio: number;
  allyAtkBonus: number;
  allyHpBonus: number;
}

/**
 * 取得済み進化からシナジー状況を計算する
 * @param evolutions - 取得済み進化の配列
 * @returns 発動中のシナジー配列
 */
export function calcSynergies(evolutions: Evolution[]): ActiveSynergy[] {
  // タグを集計
  const tagCounts = new Map<SynergyTag, number>();
  for (const evo of evolutions) {
    if (!evo.tags) continue;
    for (const tag of evo.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  // 各タグについてシナジー発動判定
  const result: ActiveSynergy[] = [];
  for (const bonus of SYNERGY_BONUSES) {
    const count = tagCounts.get(bonus.tag) ?? 0;
    if (count < 2) continue;
    const tier: 1 | 2 = count >= 3 ? 2 : 1;
    const bonusDef = tier === 2 ? bonus.tier2 : bonus.tier1;
    result.push({
      tag: bonus.tag,
      count,
      tier,
      bonusName: bonusDef.name,
    });
  }
  return result;
}

/**
 * シナジーボーナスを集計する
 * @param synergies - 発動中シナジー配列
 * @returns ボーナス集計結果
 */
export function applySynergyBonuses(synergies: ActiveSynergy[]): SynergyBonusResult {
  let atkBonus = 0, defBonus = 0, hpBonus = 0, crBonus = 0, burnMul = 1;
  let healBonusRatio = 0, allyAtkBonus = 0, allyHpBonus = 0;

  /** 単一効果を適用するヘルパー */
  const applyEffect = (effect: SynergyEffect): void => {
    switch (effect.type) {
      case 'stat_bonus':
        if (effect.stat === 'atk') atkBonus += effect.value;
        if (effect.stat === 'def') defBonus += effect.value;
        if (effect.stat === 'hp') hpBonus += effect.value;
        if (effect.stat === 'cr') crBonus += effect.value;
        break;
      case 'damage_multiplier':
        if (effect.target === 'burn') burnMul *= effect.multiplier;
        break;
      case 'heal_bonus':
        healBonusRatio += effect.ratio;
        break;
      case 'ally_bonus':
        if (effect.stat === 'atk') allyAtkBonus += effect.value;
        if (effect.stat === 'hp') allyHpBonus += effect.value;
        break;
      case 'compound':
        for (const sub of effect.effects) applyEffect(sub);
        break;
    }
  };

  for (const syn of synergies) {
    const bonusDef = SYNERGY_BONUSES.find(b => b.tag === syn.tag);
    if (!bonusDef) continue;
    const effect = syn.tier === 2 ? bonusDef.tier2.effect : bonusDef.tier1.effect;
    applyEffect(effect);
  }

  return { atkBonus, defBonus, hpBonus, crBonus, burnMul, healBonusRatio, allyAtkBonus, allyHpBonus };
}

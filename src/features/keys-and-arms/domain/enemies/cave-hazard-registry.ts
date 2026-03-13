/**
 * 洞窟ハザードレジストリ（Strategy パターン）
 *
 * 洞窟ステージの各ハザード（BAT, SPIDER, MIMIC, TRAP）の行動を
 * 統一インターフェースで管理する。
 */

import { updateBatPhase, isBatDangerous } from './bat-behavior';
import { updateSpiderPhase, isSpiderDangerous } from './spider-behavior';
import { isMimicDangerous } from './mimic-behavior';
import { calculateHazardPhase } from './hazard-phase';

/** 洞窟ハザードコンテキスト */
export interface CaveHazardContext {
  readonly beatCount: number;
  readonly hazardPeriod: number;
}

/** 洞窟ハザード判定結果 */
export interface CaveHazardResult {
  readonly phase: number;
  readonly isDangerous: boolean;
}

/** ハザード行動インターフェース */
export interface CaveHazardBehavior {
  /** ビートカウントに基づいてフェーズを算出 */
  evaluate(context: CaveHazardContext): CaveHazardResult;
}

/** BAT ハザード行動 */
const batBehavior: CaveHazardBehavior = {
  evaluate({ beatCount, hazardPeriod }) {
    const phase = updateBatPhase(beatCount, hazardPeriod);
    return { phase, isDangerous: isBatDangerous(phase) };
  },
};

/** SPIDER ハザード行動 */
const spiderBehavior: CaveHazardBehavior = {
  evaluate({ beatCount, hazardPeriod }) {
    const phase = updateSpiderPhase(beatCount, hazardPeriod);
    return { phase, isDangerous: isSpiderDangerous(phase) };
  },
};

/** TRAP ハザード行動（電撃トラップ） */
const trapBehavior: CaveHazardBehavior = {
  evaluate({ beatCount, hazardPeriod }) {
    const isOn = (beatCount % hazardPeriod) >= (hazardPeriod - 2);
    return { phase: isOn ? 1 : 0, isDangerous: isOn };
  },
};

/** MIMIC ハザード行動 */
const mimicBehavior: CaveHazardBehavior = {
  evaluate({ beatCount, hazardPeriod }) {
    const phase = calculateHazardPhase(beatCount, hazardPeriod, 0.6, 0.8);
    return { phase, isDangerous: isMimicDangerous(phase >= 2) };
  },
};

/** 洞窟ハザードレジストリ */
export class CaveHazardRegistry {
  private readonly behaviors = new Map<string, CaveHazardBehavior>();

  register(type: string, behavior: CaveHazardBehavior): void {
    this.behaviors.set(type, behavior);
  }

  evaluate(type: string, context: CaveHazardContext): CaveHazardResult {
    const behavior = this.behaviors.get(type);
    if (!behavior) {
      throw new Error(`[CaveHazardRegistry] 未登録のハザードタイプ: ${type}`);
    }
    return behavior.evaluate(context);
  }
}

/** デフォルトのレジストリを生成（全洞窟ハザードを登録済み） */
export function createCaveHazardRegistry(): CaveHazardRegistry {
  const registry = new CaveHazardRegistry();
  registry.register('bat', batBehavior);
  registry.register('spider', spiderBehavior);
  registry.register('trap', trapBehavior);
  registry.register('mimic', mimicBehavior);
  return registry;
}

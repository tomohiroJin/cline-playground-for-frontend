/**
 * KEYS & ARMS — 草原ステージの初期状態ファクトリ
 *
 * GameState 構築時に grs スライスを型的に完全な状態で初期化するためのデフォルト値。
 * 実際のステージ突入時には grsInit が全フィールドを上書きするため、
 * ここでは loop 非依存・RNG 非使用の不活性な既定値を返す。
 */
import type { PrairieState } from '../types';

/** 草原ステージの不活性な初期状態を生成する（全フィールド定義済み） */
export function createInitialPrairieState(): PrairieState {
  return {
    ens: [], kills: 0, goal: 0, maxSpawn: 0, spawned: 0, guards: 0,
    atkAnim: [-1, 0], atkCD: 0, guardAnim: 0, guardFlash: 0, hurtCD: 0,
    combo: 0, comboT: 0, maxCombo: 0, won: false, wonT: 0,
    shieldOrbs: [], nextShieldAt: 0, sweepReady: false, sweepFlash: 0,
    slash: [], dead: [], grass: [], laneFlash: [], miss: [],
  };
}

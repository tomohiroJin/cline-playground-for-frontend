/**
 * KEYS & ARMS — 洞窟ステージの初期状態ファクトリ
 *
 * GameState 構築時に cav スライスを型的に完全な状態で初期化するためのデフォルト値。
 * 実際のステージ突入時には cavInit が全フィールドを上書きするため、
 * ここでは loop 非依存・RNG 非使用の不活性な既定値を返す。
 */
import type { CaveState } from '../types';

/** 洞窟ステージの不活性な初期状態を生成する（全フィールド定義済み） */
export function createInitialCaveState(): CaveState {
  return {
    pos: 0, prevPos: -1, dir: 1, keys: [false, false, false], keysPlaced: 0, carrying: false,
    trapOn: false, trapBeat: 0, trapSparks: [], trapWasDanger: 0,
    cageProgress: 0, cageMax: 0, cageHolding: false,
    batPhase: 0, batBeat: 0, batHitAnim: 0, batWasDanger: 0,
    mimicOpen: false, mimicBeat: 0, pryCount: 0, mimicShake: 0, mimicWasDanger: 0, pryDecayT: 0,
    spiderY: 0, spiderBeat: 0, spiderWasDanger: 0,
    hurtCD: 0, actAnim: 0, actType: '', walkAnim: 0, idleT: 0, won: false, wonT: 0,
    trailAlpha: 0, roomNameT: 0, roomName: '',
    sparks: [], dust: [], feathers: [], smoke: [], stepDust: [], keySpk: [], drips: [],
  };
}

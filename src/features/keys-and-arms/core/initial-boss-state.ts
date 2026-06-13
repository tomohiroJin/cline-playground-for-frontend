/**
 * KEYS & ARMS — ボスステージの初期状態ファクトリ
 *
 * GameState 構築時に bos スライスを型的に完全な状態で初期化するためのデフォルト値。
 * 実際のステージ突入時には bosInit が全フィールドを上書きするため、
 * ここでは loop 非依存・RNG 非使用の不活性な既定値を返す。
 */
import type { BossState } from '../types';

/** ボスステージの不活性な初期状態を生成する（全フィールド定義済み） */
export function createInitialBossState(): BossState {
  return {
    pos: 0, hasGem: false,
    peds: [], armStage: [], armDir: [], armSpeed: [],
    armBaseSpd: 0, armSpdVar: 0,
    armRest: [], armBaseRest: 0, armRestVar: 0,
    armBeat: [], armResting: [], armRestT: [], armWarn: [],
    shields: 0, hurtCD: 0, moveCD: 0, won: false, wonT: 0, walkT: 0, prevPos: -1,
    stealAnim: [-1, 0], placeAnim: [-1, 0], shieldAnim: [-1, 0],
    bossAnger: 0, bossPulse: 0, bossBreath: 0,
    counterCD: 0, counterFlash: [-1, 0], rageWave: 0, quake: 0,
    particles: [], shieldBreak: [], armTrail: [],
  };
}

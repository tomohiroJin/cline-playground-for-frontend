/**
 * 2v2 ペアマッチのゲームロジックヘルパー
 * processCollisions や resolveMalletPuckOverlap で使用するマレット配列構築など
 */
import type { GameState, Mallet } from './types';

/** マレット情報（衝突処理用） */
export type MalletEntry = {
  mallet: Mallet;
  side: 'player' | 'cpu' | 'ally' | 'enemy';
  isPlayer: boolean; // チーム1（player/ally）= true
};

/** エフェクトの対象側 */
export type EffectSide = 'player' | 'cpu' | 'ally' | 'enemy';

/**
 * GameState から全マレットを配列として取得する
 * 通常モード: player, cpu の2つ
 * 2v2 モード: player, cpu, ally, enemy の4つ
 */
export function getAllMallets(game: GameState): MalletEntry[] {
  const mallets: MalletEntry[] = [
    { mallet: game.player, side: 'player', isPlayer: true },
    { mallet: game.cpu, side: 'cpu', isPlayer: false },
  ];

  if (game.ally) {
    mallets.push({ mallet: game.ally, side: 'ally', isPlayer: true });
  }
  if (game.enemy) {
    mallets.push({ mallet: game.enemy, side: 'enemy', isPlayer: false });
  }

  return mallets;
}

/**
 * マレット側からエフェクトアクセス用のキーを取得する
 */
export function getMalletEffectSide(side: EffectSide): EffectSide {
  return side;
}

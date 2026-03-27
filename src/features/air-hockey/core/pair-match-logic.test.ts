/**
 * Phase S4-3: ペアマッチ（2v2）ゲームロジックのテスト
 */
import { EntityFactory, resolveMalletPuckOverlap } from './entities';
import { CONSTANTS } from './constants';
import { getAllMallets, applyGoalScore } from './pair-match-logic';
import { applyItemEffect } from './items';
import type { GameState } from './types';

const MR = CONSTANTS.SIZES.MALLET;
const BR = CONSTANTS.SIZES.PUCK;

/** 2v2 GameState のヘルパー */
function create2v2State(): GameState {
  return EntityFactory.createGameState(CONSTANTS, undefined, true);
}

describe('Phase S4-3: ペアマッチゲームロジック', () => {
  // ── S4-3-1: processCollisions の4マレット対応 ──────

  describe('S4-3-1: getAllMallets ヘルパー', () => {
    it('通常モードでは player と cpu の2つを返す', () => {
      const state = EntityFactory.createGameState(CONSTANTS);
      const mallets = getAllMallets(state);
      expect(mallets).toHaveLength(2);
      expect(mallets[0].side).toBe('player');
      expect(mallets[1].side).toBe('cpu');
    });

    it('2v2 モードでは4つのマレットを返す', () => {
      const state = create2v2State();
      const mallets = getAllMallets(state);
      expect(mallets).toHaveLength(4);
      expect(mallets.map(m => m.side)).toEqual(['player', 'cpu', 'ally', 'enemy']);
    });

    it('各マレットに isPlayer フラグが正しく設定される', () => {
      const state = create2v2State();
      const mallets = getAllMallets(state);
      const playerMallet = mallets.find(m => m.side === 'player');
      const allyMallet = mallets.find(m => m.side === 'ally');
      const cpuMallet = mallets.find(m => m.side === 'cpu');
      const enemyMallet = mallets.find(m => m.side === 'enemy');

      // チーム1（player/ally）= isPlayer: true
      expect(playerMallet!.isPlayer).toBe(true);
      expect(allyMallet!.isPlayer).toBe(true);
      // チーム2（cpu/enemy）= isPlayer: false
      expect(cpuMallet!.isPlayer).toBe(false);
      expect(enemyMallet!.isPlayer).toBe(false);
    });
  });

  // ── S4-3-2: resolveMalletPuckOverlap の4マレット対応 ──

  describe('S4-3-2: 4マレットの食い込み解消', () => {
    it('ally マレットとパックの食い込みが解消される', () => {
      const state = create2v2State();
      // パックを ally マレットと重なる位置に配置
      state.pucks[0].x = state.ally!.x;
      state.pucks[0].y = state.ally!.y;
      state.pucks[0].vx = 0;
      state.pucks[0].vy = 0;

      resolveMalletPuckOverlap(state.ally!, state.pucks, MR, BR, CONSTANTS.PHYSICS.MAX_POWER);

      // パックが押し出されている（完全重複→離れている）
      const dx = state.pucks[0].x - state.ally!.x;
      const dy = state.pucks[0].y - state.ally!.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).toBeGreaterThanOrEqual(MR + BR);
    });

    it('enemy マレットとパックの食い込みが解消される', () => {
      const state = create2v2State();
      state.pucks[0].x = state.enemy!.x;
      state.pucks[0].y = state.enemy!.y;
      state.pucks[0].vx = 0;
      state.pucks[0].vy = 0;

      resolveMalletPuckOverlap(state.enemy!, state.pucks, MR, BR, CONSTANTS.PHYSICS.MAX_POWER);

      const dx = state.pucks[0].x - state.enemy!.x;
      const dy = state.pucks[0].y - state.enemy!.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).toBeGreaterThanOrEqual(MR + BR);
    });
  });

  // ── S4-3-3: ゴール判定のチーム制対応 ──────────────

  describe('S4-3-3: チーム制ゴール判定（applyGoalScore）', () => {
    it('上ゴールに入る（scored=cpu）→ チーム1（p）得点', () => {
      const result = applyGoalScore({ p: 0, c: 0 }, 'cpu');
      expect(result).toEqual({ p: 1, c: 0 });
    });

    it('下ゴールに入る（scored=player）→ チーム2（c）得点', () => {
      const result = applyGoalScore({ p: 0, c: 0 }, 'player');
      expect(result).toEqual({ p: 0, c: 1 });
    });

    it('連続得点が正しく加算される', () => {
      let score = { p: 0, c: 0 };
      score = applyGoalScore(score, 'cpu');
      score = applyGoalScore(score, 'cpu');
      score = applyGoalScore(score, 'player');
      expect(score).toEqual({ p: 2, c: 1 });
    });

    it('元のスコアオブジェクトを変更しない（不変更新）', () => {
      const original = { p: 3, c: 2 };
      const result = applyGoalScore(original, 'cpu');
      expect(original).toEqual({ p: 3, c: 2 });
      expect(result).toEqual({ p: 4, c: 2 });
    });
  });

  // ── S4-3-5: アイテム・エフェクトの4プレイヤー対応 ──

  describe('S4-3-5: アイテム・エフェクトの4プレイヤー対応', () => {
    it('ally にエフェクトを適用できる', () => {
      const state = create2v2State();
      const result = applyItemEffect(state, { id: 'shield' }, 'ally', Date.now());
      expect(result.effects?.ally?.shield).toBe(true);
    });

    it('enemy にエフェクトを適用できる', () => {
      const state = create2v2State();
      const result = applyItemEffect(state, { id: 'big' }, 'enemy', Date.now());
      expect(result.effects?.enemy?.big).toBeDefined();
      expect(result.effects?.enemy?.big?.scale).toBe(1.5);
    });

    it('既存の player/cpu エフェクト適用が壊れない', () => {
      const state = EntityFactory.createGameState(CONSTANTS);
      const result = applyItemEffect(state, { id: 'shield' }, 'player', Date.now());
      expect(result.effects?.player?.shield).toBe(true);
    });
  });
});

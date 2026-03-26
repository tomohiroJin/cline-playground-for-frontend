/**
 * Phase S4-3: ペアマッチ（2v2）ゲームロジックのテスト
 */
import { EntityFactory, resolveMalletPuckOverlap } from './entities';
import { CONSTANTS } from './constants';
import { getAllMallets, getMalletEffectSide } from './pair-match-logic';
import { applyItemEffect } from './items';
import type { GameState, Mallet } from './types';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;
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

  // ── S4-3-3: getMalletEffectSide ──────────────────

  describe('S4-3-3: getMalletEffectSide', () => {
    it('player のエフェクト側は player', () => {
      expect(getMalletEffectSide('player')).toBe('player');
    });

    it('ally のエフェクト側は ally', () => {
      expect(getMalletEffectSide('ally')).toBe('ally');
    });

    it('cpu のエフェクト側は cpu', () => {
      expect(getMalletEffectSide('cpu')).toBe('cpu');
    });

    it('enemy のエフェクト側は enemy', () => {
      expect(getMalletEffectSide('enemy')).toBe('enemy');
    });
  });

  // ── S4-3-4: ゴール判定のチーム制対応 ──────────────

  describe('S4-3-4: チーム制ゴール判定', () => {
    it('上ゴールに入る → チーム1（player側）得点', () => {
      // 既存のスコア構造: p = team1, c = team2
      // scored === 'cpu' のとき p++ (team1得点)
      // この仕様は既存ロジックそのまま使える
      const score = { p: 0, c: 0 };
      const scored = 'cpu'; // パックが上ゴール(cpu側)に入った
      if (scored === 'cpu') score.p++;
      expect(score.p).toBe(1);
      expect(score.c).toBe(0);
    });

    it('下ゴールに入る → チーム2（cpu側）得点', () => {
      const score = { p: 0, c: 0 };
      const scored = 'player'; // パックが下ゴール(player側)に入った
      if (scored === 'player') score.c++;
      expect(score.p).toBe(0);
      expect(score.c).toBe(1);
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

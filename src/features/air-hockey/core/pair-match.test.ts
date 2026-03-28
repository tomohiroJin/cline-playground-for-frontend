/**
 * Phase S4-1: ペアマッチ（2v2）型定義・データ構造のテスト
 */
import { EntityFactory } from './entities';
import { CONSTANTS, getPlayerZone, getPlayerYBounds } from './constants';
import type { GameMode, PlayerSlot } from './types';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;
const MR = CONSTANTS.SIZES.MALLET;

describe('Phase S4-1: ペアマッチ型定義・データ構造', () => {
  // ── S4-1-1: GameMode に '2v2-local' を追加 ──────────

  describe('S4-1-1: GameMode 型', () => {
    it('2v2-local が有効な GameMode として使用できる', () => {
      const mode: GameMode = '2v2-local';
      expect(mode).toBe('2v2-local');
    });
  });

  // ── S4-1-2: GameState に ally/enemy マレットを追加 ──

  describe('S4-1-2: GameState の ally/enemy マレット', () => {
    it('2v2 用 GameState に ally マレットが存在する', () => {
      const state = EntityFactory.createGameState(CONSTANTS, undefined, true);
      expect(state.ally).toBeDefined();
      expect(state.ally!.x).toBeGreaterThan(0);
      expect(state.ally!.y).toBeGreaterThan(0);
    });

    it('2v2 用 GameState に enemy マレットが存在する', () => {
      const state = EntityFactory.createGameState(CONSTANTS, undefined, true);
      expect(state.enemy).toBeDefined();
      expect(state.enemy!.x).toBeGreaterThan(0);
      expect(state.enemy!.y).toBeGreaterThan(0);
    });

    it('通常モードでは ally/enemy は undefined', () => {
      const state = EntityFactory.createGameState(CONSTANTS);
      expect(state.ally).toBeUndefined();
      expect(state.enemy).toBeUndefined();
    });

    it('2v2 用 GameEffects に ally/enemy の EffectState が存在する', () => {
      const state = EntityFactory.createGameState(CONSTANTS, undefined, true);
      expect(state.effects.ally).toBeDefined();
      expect(state.effects.ally!.shield).toBe(false);
      expect(state.effects.enemy).toBeDefined();
      expect(state.effects.enemy!.shield).toBe(false);
    });

    it('通常モードでは effects の ally/enemy は undefined', () => {
      const state = EntityFactory.createGameState(CONSTANTS);
      expect(state.effects.ally).toBeUndefined();
      expect(state.effects.enemy).toBeUndefined();
    });
  });

  // ── S4-1-3: 上下2分割ゾーン境界の定義 ─────────────────

  describe('S4-1-3: 上下2分割ゾーン境界', () => {
    it('PlayerSlot 型が4スロット分使用できる', () => {
      const slots: PlayerSlot[] = ['player1', 'player2', 'player3', 'player4'];
      expect(slots).toHaveLength(4);
    });

    it('player1（チーム1・下半分）ゾーンが正しい範囲', () => {
      const zone = getPlayerZone('player1', CONSTANTS);
      expect(zone.minX).toBeGreaterThanOrEqual(MR);
      expect(zone.maxX).toBeLessThanOrEqual(W);
      expect(zone.minY).toBeGreaterThan(H / 2);
      expect(zone.maxY).toBeLessThanOrEqual(H);
    });

    it('player2（チーム1・下半分）は player1 と同じゾーン', () => {
      const z1 = getPlayerZone('player1', CONSTANTS);
      const z2 = getPlayerZone('player2', CONSTANTS);
      expect(z2).toEqual(z1);
    });

    it('player3（チーム2・上半分）ゾーンが正しい範囲', () => {
      const zone = getPlayerZone('player3', CONSTANTS);
      expect(zone.minX).toBeGreaterThanOrEqual(0);
      expect(zone.maxX).toBeLessThanOrEqual(W);
      expect(zone.minY).toBeGreaterThanOrEqual(0);
      expect(zone.maxY).toBeLessThan(H / 2);
    });

    it('player4（チーム2・上半分）は player3 と同じゾーン', () => {
      const z3 = getPlayerZone('player3', CONSTANTS);
      const z4 = getPlayerZone('player4', CONSTANTS);
      expect(z4).toEqual(z3);
    });

    it('チーム1とチーム2のゾーンが Y 軸で分離している', () => {
      const team1 = getPlayerZone('player1', CONSTANTS);
      const team2 = getPlayerZone('player3', CONSTANTS);
      expect(team1.minY).toBeGreaterThan(team2.maxY);
    });

    it('既存の getPlayerYBounds が引き続き動作する', () => {
      const p1 = getPlayerYBounds('player1', CONSTANTS);
      const p2 = getPlayerYBounds('player2', CONSTANTS);
      expect(p1.minY).toBeGreaterThan(H / 2);
      expect(p2.maxY).toBeLessThan(H / 2);
    });
  });

  // ── S4-1-4: EntityFactory の4マレット初期化 ────────

  describe('S4-1-4: 4マレット初期化', () => {
    it('2v2 時の ally 初期位置は右下エリア (3W/4, H-120)', () => {
      const state = EntityFactory.createGameState(CONSTANTS, undefined, true);
      expect(state.ally!.x).toBe(W * 3 / 4);
      expect(state.ally!.y).toBe(H - 120);
    });

    it('2v2 時の enemy 初期位置は右上エリア (3W/4, 120)', () => {
      const state = EntityFactory.createGameState(CONSTANTS, undefined, true);
      expect(state.enemy!.x).toBe(W * 3 / 4);
      expect(state.enemy!.y).toBe(120);
    });

    it('2v2 時の player 初期位置は左下 (W/4, H-120)', () => {
      const state = EntityFactory.createGameState(CONSTANTS, undefined, true);
      expect(state.player.x).toBe(W / 4);
      expect(state.player.y).toBe(H - 120);
    });

    it('2v2 時の cpu 初期位置は左上 (W/4, 120)', () => {
      const state = EntityFactory.createGameState(CONSTANTS, undefined, true);
      expect(state.cpu.x).toBe(W / 4);
      expect(state.cpu.y).toBe(120);
    });

    it('通常モードでは既存の初期位置が維持される', () => {
      const state = EntityFactory.createGameState(CONSTANTS);
      expect(state.player.x).toBe(W / 2);
      expect(state.player.y).toBe(H - 70);
      expect(state.cpu.x).toBe(W / 2);
      expect(state.cpu.y).toBe(70);
    });

    it('ally/enemy の初期速度は0', () => {
      const state = EntityFactory.createGameState(CONSTANTS, undefined, true);
      expect(state.ally!.vx).toBe(0);
      expect(state.ally!.vy).toBe(0);
      expect(state.enemy!.vx).toBe(0);
      expect(state.enemy!.vy).toBe(0);
    });
  });
});

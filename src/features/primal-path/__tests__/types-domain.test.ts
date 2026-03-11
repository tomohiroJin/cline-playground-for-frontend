/**
 * ドメインモデルの型分割テスト
 *
 * フェーズ1: 型が正しく分割され、後方互換が保たれることを検証する
 */
import type {
  PlayerState,
  BattleState,
  ProgressState,
  EvolutionState,
  SkillState,
  AwakeningState,
  RunStatsState,
  ChallengeState,
  EndlessState,
} from '../types/index';
import { makeRun } from './test-helpers';

describe('ドメインモデルの型分割', () => {
  describe('サブステート型の定義', () => {
    it('PlayerState がプレイヤー戦闘ステータスを持つ', () => {
      // Arrange & Act: PlayerState に準拠したオブジェクトを作成
      const player: PlayerState = {
        hp: 80,
        mhp: 100,
        atk: 10,
        def: 5,
        cr: 10,
        burn: 0,
        aM: 1,
        dm: 1,
      };

      // Assert: 各フィールドが正しく型付けされている
      expect(player.hp).toBe(80);
      expect(player.mhp).toBe(100);
      expect(player.atk).toBe(10);
      expect(player.def).toBe(5);
      expect(player.cr).toBe(10);
      expect(player.burn).toBe(0);
      expect(player.aM).toBe(1);
      expect(player.dm).toBe(1);
    });

    it('BattleState が戦闘進行状態を持つ', () => {
      // Arrange & Act
      const battle: BattleState = {
        en: null,
        turn: 0,
        cW: 1,
        wpb: 4,
        cT: 0,
        cL: 0,
        cR: 0,
        bE: 0,
      };

      // Assert
      expect(battle.en).toBeNull();
      expect(battle.turn).toBe(0);
      expect(battle.cW).toBe(1);
      expect(battle.wpb).toBe(4);
    });

    it('ProgressState がゲーム進行状態を持つ', () => {
      // Arrange & Act
      const progress: ProgressState = {
        di: 0,
        dd: { n: 'test', d: 'test', env: 1, bm: 1, ul: 1, ic: '', hm: 1, am: 1, bb: 1 },
        bc: 0,
        bms: ['grassland', 'glacier', 'volcano'],
        cB: 0,
        cBT: 'grassland',
        fe: null,
        evoN: 0,
        fReq: 5,
      };

      // Assert
      expect(progress.di).toBe(0);
      expect(progress.bms).toHaveLength(3);
      expect(progress.fe).toBeNull();
      expect(progress.fReq).toBe(5);
    });

    it('EvolutionState が進化関連の状態を持つ', () => {
      // Arrange & Act
      const evolution: EvolutionState = {
        evs: [],
      };

      // Assert
      expect(evolution.evs).toEqual([]);
      // maxEvo はオプショナル
      expect(evolution.maxEvo).toBeUndefined();
    });

    it('SkillState がスキル関連の状態を持つ', () => {
      // Arrange & Act
      const skills: SkillState = {
        sk: { avl: [], cds: {}, bfs: [] },
        al: [],
        mxA: 3,
        skillUseCount: 0,
      };

      // Assert
      expect(skills.sk.avl).toEqual([]);
      expect(skills.al).toEqual([]);
      expect(skills.mxA).toBe(3);
    });

    it('AwakeningState が覚醒関連の状態を持つ', () => {
      // Arrange & Act
      const awakening: AwakeningState = {
        awoken: [],
        saReq: 4,
        rvU: 0,
      };

      // Assert
      expect(awakening.awoken).toEqual([]);
      expect(awakening.saReq).toBe(4);
      expect(awakening.rvU).toBe(0);
    });

    it('RunStatsState がランの統計データを持つ', () => {
      // Arrange & Act
      const stats: RunStatsState = {
        kills: 0,
        dmgDealt: 0,
        dmgTaken: 0,
        maxHit: 0,
        wDmg: 0,
        wTurn: 0,
        totalHealing: 0,
      };

      // Assert
      expect(stats.kills).toBe(0);
      expect(stats.dmgDealt).toBe(0);
      expect(stats.totalHealing).toBe(0);
    });

    it('ChallengeState がチャレンジモード固有の状態を持つ', () => {
      // Arrange & Act: すべてオプショナル
      const challenge: ChallengeState = {};

      // Assert
      expect(challenge.challengeId).toBeUndefined();
      expect(challenge.enemyAtkMul).toBeUndefined();
      expect(challenge.noHealing).toBeUndefined();
      expect(challenge.timeLimit).toBeUndefined();
      expect(challenge.timerStart).toBeUndefined();
    });

    it('EndlessState がエンドレスモード固有の状態を持つ', () => {
      // Arrange & Act
      const endless: EndlessState = {
        isEndless: false,
        endlessWave: 0,
      };

      // Assert
      expect(endless.isEndless).toBe(false);
      expect(endless.endlessWave).toBe(0);
    });
  });

  describe('RunState の後方互換', () => {
    it('既存の makeRun で生成した RunState が合成型として有効', () => {
      // Arrange & Act
      const run = makeRun();

      // Assert: PlayerState のフィールド
      expect(run.hp).toBeDefined();
      expect(run.mhp).toBeDefined();
      expect(run.atk).toBeDefined();

      // Assert: BattleState のフィールド
      expect(run.turn).toBeDefined();
      expect(run.cW).toBeDefined();

      // Assert: ProgressState のフィールド
      expect(run.di).toBeDefined();
      expect(run.bms).toBeDefined();

      // Assert: EvolutionState のフィールド
      expect(run.evs).toBeDefined();

      // Assert: SkillState のフィールド
      expect(run.sk).toBeDefined();
      expect(run.al).toBeDefined();

      // Assert: AwakeningState のフィールド
      expect(run.awoken).toBeDefined();

      // Assert: RunStatsState のフィールド
      expect(run.kills).toBeDefined();

      // Assert: EndlessState のフィールド
      expect(run.isEndless).toBeDefined();

      // Assert: RunState 固有フィールド
      expect(run.log).toBeDefined();
      expect(run.bb).toBeDefined();
      expect(run._fPhase).toBeDefined();
    });

    it('RunState はすべてのサブステートのフィールドをフラットに持つ', () => {
      // Arrange
      const run = makeRun({
        hp: 50,
        mhp: 100,
        atk: 15,
        en: { n: 'テスト敵', hp: 30, mhp: 30, atk: 5, def: 2, bone: 10 },
        isEndless: true,
        endlessWave: 3,
      });

      // Assert: オーバーライドが反映されている
      expect(run.hp).toBe(50);
      expect(run.mhp).toBe(100);
      expect(run.en).not.toBeNull();
      expect(run.isEndless).toBe(true);
      expect(run.endlessWave).toBe(3);
    });
  });
});

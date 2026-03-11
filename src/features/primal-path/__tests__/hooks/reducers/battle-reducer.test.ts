/**
 * 原始進化録 - PRIMAL PATH - battle-reducer テスト
 */
import { battleReducer } from '../../../hooks/reducers/battle-reducer';
import { makeRun, makeGameState, makeSave } from '../../test-helpers';
import { DIFFS, BOSS } from '../../../constants';
import { scaleEnemy } from '../../../game-logic';

describe('battleReducer', () => {
  describe('BATTLE_TICK', () => {
    it('nextRun で run を更新する', () => {
      // Arrange
      const run = makeRun({ hp: 100, mhp: 100 });
      const state = makeGameState({ run, phase: 'battle' });
      const nextRun = makeRun({ hp: 80, mhp: 100 });

      // Act
      const next = battleReducer(state, { type: 'BATTLE_TICK', nextRun });

      // Assert
      expect(next.run!.hp).toBe(80);
    });
  });

  describe('AFTER_BATTLE', () => {
    it('battle 以外のフェーズでは状態が変化しない', () => {
      // Arrange
      const state = makeGameState({ run: makeRun(), phase: 'evo' });

      // Act
      const next = battleReducer(state, { type: 'AFTER_BATTLE' });

      // Assert
      expect(next).toEqual(state);
    });

    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null, phase: 'battle' });
      const next = battleReducer(state, { type: 'AFTER_BATTLE' });
      expect(next).toEqual(state);
    });

    it('バイオームクリア時に battle 以外のフェーズに遷移する', () => {
      // Arrange: バイオーム内の最後の敵を倒した状態
      const run = makeRun({
        di: 1, dd: DIFFS[1],
        cW: 5, wpb: 4, bc: 0, cBT: 'glacier',
        hp: 60, mhp: 100,
        en: { n: 'マンモス', hp: 0, mhp: 160, atk: 16, def: 6, bone: 6 },
      });
      const state = makeGameState({ phase: 'battle', run, finalMode: false });

      // Act
      const next = battleReducer(state, { type: 'AFTER_BATTLE' });

      // Assert
      expect(next.phase).not.toBe('battle');
      expect(next.run!.bc).toBe(1);
    });
  });

  describe('USE_SKILL', () => {
    it('battle 以外のフェーズでは状態が変化しない', () => {
      const run = makeRun({ sk: { avl: [], cds: {}, bfs: [] } });
      const state = makeGameState({ run, phase: 'evo' });
      const next = battleReducer(state, { type: 'USE_SKILL', sid: 'dmgAll' as never });
      expect(next).toEqual(state);
    });
  });

  describe('CHANGE_SPEED', () => {
    it('バトルスピードが更新される', () => {
      const state = makeGameState({ battleSpd: 750 });
      const next = battleReducer(state, { type: 'CHANGE_SPEED', speed: 400 });
      expect(next.battleSpd).toBe(400);
    });
  });

  describe('SURRENDER', () => {
    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null });
      const next = battleReducer(state, { type: 'SURRENDER' });
      expect(next).toEqual(state);
    });

    it('投降時に over フェーズに遷移し骨が半減される', () => {
      const run = makeRun({ bE: 100 });
      const state = makeGameState({ run, phase: 'battle', save: makeSave({ bones: 0 }) });
      const next = battleReducer(state, { type: 'SURRENDER' });
      expect(next.phase).toBe('over');
      expect(next.gameResult).toBe(false);
      // bE が半減（100 → 50）
      expect(next.run!.bE).toBe(50);
    });
  });

  describe('FINAL_BOSS_KILLED', () => {
    it('連戦継続時にphaseがbattleのまま維持される（氷河期 bb=2）', () => {
      // Arrange
      const dd = DIFFS[1];
      const boss = scaleEnemy(BOSS['ft'], dd.hm, dd.am, 1);
      const run = makeRun({
        di: 1, dd,
        _fPhase: 1, _fbk: 'ft',
        cBT: 'final', cW: 5, wpb: 4,
        en: { ...boss, hp: 0 },
      });
      const state = makeGameState({ run, phase: 'battle', finalMode: true });

      // Act
      const next = battleReducer(state, { type: 'FINAL_BOSS_KILLED' });

      // Assert
      expect(next.phase).toBe('battle');
      expect(next.run!._fPhase).toBe(2);
    });

    it('最終撃破で勝利となる（原始 bb=1）', () => {
      const dd = DIFFS[0];
      const boss = scaleEnemy(BOSS['ft'], dd.hm, dd.am, 1);
      const run = makeRun({
        di: 0, dd,
        _fPhase: 1, _fbk: 'ft',
        cBT: 'final', cW: 5, wpb: 4,
        en: { ...boss, hp: 0 },
      });
      const state = makeGameState({ run, phase: 'battle', finalMode: true });
      const next = battleReducer(state, { type: 'FINAL_BOSS_KILLED' });
      expect(next.phase).toBe('over');
      expect(next.gameResult).toBe(true);
    });
  });
});

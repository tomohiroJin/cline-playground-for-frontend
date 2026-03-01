/**
 * 原始進化録 - PRIMAL PATH - gameReducer テスト
 */
import { gameReducer } from '../hooks';
import { FRESH_SAVE, TREE as TREE_DATA, EVOS, SPEED_OPTS, RANDOM_EVENTS, BOSS, DIFFS } from '../constants';
import { scaleEnemy } from '../game-logic';
import { makeRun, makeGameState } from './test-helpers';

/* ===== テスト ===== */

describe('gameReducer', () => {
  describe('BUY_TREE_NODE バリデーション', () => {
    it('存在しないノードIDでは状態が変化しない', () => {
      const state = makeGameState({ save: { ...FRESH_SAVE, bones: 100, tree: {}, clears: 0, runs: 0, best: {} } });
      const next = gameReducer(state, { type: 'BUY_TREE_NODE', nodeId: 'non_existent_node' });
      expect(next.save.bones).toBe(100);
      expect(next.save.tree).toEqual({});
    });

    it('骨が不足している場合は購入できない', () => {
      const firstNode = TREE_DATA[0];
      if (!firstNode) return; // ツリーが空なら skip
      const state = makeGameState({ save: { ...FRESH_SAVE, bones: 0, tree: {}, clears: 0, runs: 0, best: {} } });
      const next = gameReducer(state, { type: 'BUY_TREE_NODE', nodeId: firstNode.id });
      expect(next.save.bones).toBe(0);
      expect(next.save.tree).toEqual({});
    });

    it('既に購入済みのノードは重複購入できない', () => {
      const firstNode = TREE_DATA[0];
      if (!firstNode) return;
      const state = makeGameState({
        save: { ...FRESH_SAVE, bones: 999, tree: { [firstNode.id]: 1 }, clears: 0, runs: 0, best: {} },
      });
      const next = gameReducer(state, { type: 'BUY_TREE_NODE', nodeId: firstNode.id });
      expect(next.save.bones).toBe(999); // 骨が減らない
    });
  });

  describe('RECORD_RUN_END ボーン加算', () => {
    it('ラン終了時に獲得ボーンが save.bones に加算される', () => {
      const run = makeRun({ bE: 50, bb: 0 });
      const state = makeGameState({
        run,
        save: { ...FRESH_SAVE, bones: 100 },
      });
      const next = gameReducer(state, { type: 'RECORD_RUN_END', won: false });
      // calcBoneReward(run, false) は bE + bb = 50, bm=1, (1+bM=0)=1, 勝利なし → 50
      expect(next.save.bones).toBeGreaterThan(100);
    });

    it('勝利時はボーナス込みで加算される', () => {
      const run = makeRun({ bE: 50, bb: 0 });
      const state = makeGameState({
        run,
        save: { ...FRESH_SAVE, bones: 0 },
      });
      const nextLose = gameReducer(state, { type: 'RECORD_RUN_END', won: false });
      const nextWin = gameReducer(state, { type: 'RECORD_RUN_END', won: true });
      // 勝利時は 1.5 倍のボーナス
      expect(nextWin.save.bones).toBeGreaterThan(nextLose.save.bones);
    });
  });

  describe('SELECT_EVO maxEvo ガード', () => {
    it('maxEvo に達している場合、進化をスキップしてバトルへ直行する', () => {
      const evo = EVOS[0];
      const run = makeRun({
        maxEvo: 5,
        evs: [evo, evo, evo, evo, evo], // 既に5回進化済み
        en: { n: 'テスト', hp: 10, mhp: 10, atk: 5, def: 0, bone: 3 },
      });
      const state = makeGameState({ run, phase: 'evo' as const });
      const next = gameReducer(state, { type: 'SELECT_EVO', evo });

      // maxEvo に達しているので進化が適用されず、バトルフェーズへ直行
      expect(next.phase).toBe('battle');
      // 進化は追加されていない（evs.length は変わらない）
      expect(next.run!.evs.length).toBe(5);
      // ログに上限メッセージが含まれる
      expect(next.run!.log.some(l => l.x.includes('進化上限'))).toBe(true);
    });

    it('maxEvo 未設定の場合は通常通り進化が適用される', () => {
      const evo = EVOS[0];
      const run = makeRun({
        evs: [evo, evo],
        en: { n: 'テスト', hp: 10, mhp: 10, atk: 5, def: 0, bone: 3 },
      });
      const state = makeGameState({ run, phase: 'evo' as const });
      const next = gameReducer(state, { type: 'SELECT_EVO', evo });

      expect(next.phase).toBe('battle');
      // 進化が適用されている
      expect(next.run!.evs.length).toBe(3);
    });

    it('maxEvo 未到達の場合は通常通り進化が適用される', () => {
      const evo = EVOS[0];
      const run = makeRun({
        maxEvo: 5,
        evs: [evo, evo], // まだ2回
        en: { n: 'テスト', hp: 10, mhp: 10, atk: 5, def: 0, bone: 3 },
      });
      const state = makeGameState({ run, phase: 'evo' as const });
      const next = gameReducer(state, { type: 'SELECT_EVO', evo });

      expect(next.phase).toBe('battle');
      expect(next.run!.evs.length).toBe(3);
    });
  });

  describe('SKIP_EVO アクション', () => {
    it('SKIP_EVO でバトルフェーズに遷移する', () => {
      const run = makeRun({
        maxEvo: 5,
        evs: Array(5).fill(EVOS[0]),
        en: { n: 'テスト', hp: 10, mhp: 10, atk: 5, def: 0, bone: 3 },
      });
      const state = makeGameState({ run, phase: 'evo' as const });
      const next = gameReducer(state, { type: 'SKIP_EVO' });

      expect(next.phase).toBe('battle');
      // startBattle によって enemy が設定される
      expect(next.run!.en).not.toBeNull();
    });

    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null });
      const next = gameReducer(state, { type: 'SKIP_EVO' });

      expect(next).toEqual(state);
    });
  });

  describe('FINAL_BOSS_KILLED Phase 2 遷移', () => {
    it('神話世界（di>=3）のPhase 1撃破でPhase 2に遷移し、新しい敵が設定される', () => {
      const dd = DIFFS[3]; // 神話世界
      const boss = scaleEnemy(BOSS['ft'], dd.hm, dd.am, 1);
      const run = makeRun({
        di: 3, dd,
        _fPhase: 1,
        _fbk: 'ft',
        cBT: 'final',
        cW: 5, wpb: 4,
        en: { ...boss, hp: 0 }, // ボスHP=0（撃破済み）
      });
      const state = makeGameState({ run, phase: 'battle' as const, finalMode: true });
      const next = gameReducer(state, { type: 'FINAL_BOSS_KILLED' });

      // Phase 2 に遷移
      expect(next.phase).toBe('battle');
      expect(next.run!._fPhase).toBe(2);
      // 新しい敵が生成されている
      expect(next.run!.en).not.toBeNull();
      expect(next.run!.en!.hp).toBeGreaterThan(0);
      expect(next.run!.en!.n).not.toBe('氷の神獣'); // ft 以外のボス
    });

    it('Phase 2撃破で勝利となる', () => {
      const dd = DIFFS[3];
      const boss = scaleEnemy(BOSS['fl'], dd.hm, dd.am, 0.85);
      const run = makeRun({
        di: 3, dd,
        _fPhase: 2,
        _fbk: 'ft',
        cBT: 'final',
        cW: 5, wpb: 4,
        en: { ...boss, hp: 0 },
      });
      const state = makeGameState({ run, phase: 'battle' as const, finalMode: true });
      const next = gameReducer(state, { type: 'FINAL_BOSS_KILLED' });

      expect(next.phase).toBe('over');
      expect(next.gameResult).toBe(true);
    });
  });

  describe('RESET_SAVE', () => {
    it('FRESH_SAVE と同じ構造にリセットされる', () => {
      const state = makeGameState({
        save: { ...FRESH_SAVE, bones: 500, tree: { t1: 1 }, clears: 10, runs: 20, best: { 0: 1 } },
      });
      const next = gameReducer(state, { type: 'RESET_SAVE' });
      // FRESH_SAVE のキーをすべて含むことを確認
      expect(Object.keys(next.save)).toEqual(expect.arrayContaining(Object.keys(FRESH_SAVE)));
      expect(next.save.bones).toBe(0);
      expect(next.save.clears).toBe(0);
      expect(next.save.runs).toBe(0);
    });
  });
});

/* ===== P1 定数変更テスト ===== */

describe('FB#5: bone_merchant コスト調整', () => {
  const bm = RANDOM_EVENTS.find(e => e.id === 'bone_merchant')!;

  it('小取引のコストが骨10に変更されている', () => {
    const small = bm.choices[0];
    expect(small.cost!.amount).toBe(10);
  });

  it('小取引の報酬がATK+4に変更されている', () => {
    const small = bm.choices[0];
    expect(small.effect).toEqual(expect.objectContaining({ type: 'stat_change', stat: 'atk', value: 4 }));
  });

  it('大取引のコストが骨25に変更されている', () => {
    const big = bm.choices[1];
    expect(big.cost!.amount).toBe(25);
  });

  it('大取引の報酬がATK+10に変更されている', () => {
    const big = bm.choices[1];
    expect(big.effect).toEqual(expect.objectContaining({ type: 'stat_change', stat: 'atk', value: 10 }));
  });

  it('ラベルテキストが更新されている', () => {
    expect(bm.choices[0].label).toBe('骨10で取引する');
    expect(bm.choices[1].label).toBe('骨25で大取引する');
  });
});

describe('FB#7: ゆっくり速度オプション', () => {
  it('SPEED_OPTS の先頭に ×0.5（1500ms）が追加されている', () => {
    expect(SPEED_OPTS[0][0]).toBe('×0.5');
    expect(SPEED_OPTS[0][1]).toBe(1500);
  });

  it('既存の速度オプションが維持されている', () => {
    expect(SPEED_OPTS[1][0]).toBe('×1');
    expect(SPEED_OPTS[1][1]).toBe(750);
    expect(SPEED_OPTS[2][0]).toBe('×2');
    expect(SPEED_OPTS[2][1]).toBe(400);
  });
});

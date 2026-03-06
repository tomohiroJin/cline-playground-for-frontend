/**
 * 原始進化録 - PRIMAL PATH - gameReducer テスト
 */
import { gameReducer } from '../hooks';
import { FRESH_SAVE, TREE as TREE_DATA, EVOS, SPEED_OPTS, RANDOM_EVENTS, BOSS, DIFFS, LOOP_SCALE_FACTOR } from '../constants';
import { calcBoneReward } from '../game-logic';
import { scaleEnemy } from '../game-logic';
import { makeRun, makeGameState, makeSave } from './test-helpers';

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

  describe('FINAL_BOSS_KILLED 最終ボス連戦', () => {
    it('連戦継続時にphaseがbattleのまま維持される（氷河期 bb=2）', () => {
      // Arrange: 氷河期のPhase 1撃破
      const dd = DIFFS[1];
      const boss = scaleEnemy(BOSS['ft'], dd.hm, dd.am, 1);
      const run = makeRun({
        di: 1, dd,
        _fPhase: 1, _fbk: 'ft',
        cBT: 'final', cW: 5, wpb: 4,
        en: { ...boss, hp: 0 },
      });
      const state = makeGameState({ run, phase: 'battle' as const, finalMode: true });
      const next = gameReducer(state, { type: 'FINAL_BOSS_KILLED' });

      // Assert
      expect(next.phase).toBe('battle');
      expect(next.run!._fPhase).toBe(2);
      expect(next.run!.en).not.toBeNull();
      expect(next.run!.en!.hp).toBeGreaterThan(0);
    });

    it('連戦継続時にログに連戦メッセージが追加される', () => {
      // Arrange
      const dd = DIFFS[1];
      const boss = scaleEnemy(BOSS['ft'], dd.hm, dd.am, 1);
      const run = makeRun({
        di: 1, dd,
        _fPhase: 1, _fbk: 'ft',
        cBT: 'final', cW: 5, wpb: 4,
        en: { ...boss, hp: 0 },
      });
      const state = makeGameState({ run, phase: 'battle' as const, finalMode: true });
      const next = gameReducer(state, { type: 'FINAL_BOSS_KILLED' });

      // Assert: ログに連戦メッセージが含まれる
      const chainLog = next.run!.log.find(l => l.x.includes('最終ボス連戦'));
      expect(chainLog).toBeDefined();
      expect(chainLog!.x).toContain('2/2');
    });

    it('最終撃破で勝利となる（氷河期 bb=2, Phase 2）', () => {
      const dd = DIFFS[1];
      const boss = scaleEnemy(BOSS['fl'], dd.hm, dd.am, 1);
      const run = makeRun({
        di: 1, dd,
        _fPhase: 2, _fbk: 'ft',
        cBT: 'final', cW: 5, wpb: 4,
        en: { ...boss, hp: 0 },
      });
      const state = makeGameState({ run, phase: 'battle' as const, finalMode: true });
      const next = gameReducer(state, { type: 'FINAL_BOSS_KILLED' });

      expect(next.phase).toBe('over');
      expect(next.gameResult).toBe(true);
    });

    it('原始（bb=1）のPhase 1撃破で即勝利', () => {
      const dd = DIFFS[0];
      const boss = scaleEnemy(BOSS['ft'], dd.hm, dd.am, 1);
      const run = makeRun({
        di: 0, dd,
        _fPhase: 1, _fbk: 'ft',
        cBT: 'final', cW: 5, wpb: 4,
        en: { ...boss, hp: 0 },
      });
      const state = makeGameState({ run, phase: 'battle' as const, finalMode: true });
      const next = gameReducer(state, { type: 'FINAL_BOSS_KILLED' });

      expect(next.phase).toBe('over');
      expect(next.gameResult).toBe(true);
    });
  });

  describe('AFTER_BATTLE ボス撃破で連戦なし', () => {
    it('ボス撃破時にbattle以外のフェーズに遷移する（連戦なし）', () => {
      // Arrange: 氷河期のバイオームボス撃破
      const run = makeRun({
        di: 1, dd: DIFFS[1],
        cW: 5, wpb: 4, bc: 0, cBT: 'glacier',
        hp: 60, mhp: 100,
        en: { n: 'マンモス', hp: 0, mhp: 160, atk: 16, def: 6, bone: 6 },
      });
      const state = makeGameState({ phase: 'battle' as const, run, finalMode: false });

      // Act
      const next = gameReducer(state, { type: 'AFTER_BATTLE' });

      // Assert: battleではないフェーズに遷移（ally_revive, evo, biome, prefinal のいずれか）
      expect(next.phase).not.toBe('battle');
      expect(next.run!.bc).toBe(1);
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

/* ===== FB#11: 周回システム (reducer) ===== */

describe('FB#11: 周回システム', () => {
  it('FRESH_SAVE に loopCount: 0 が含まれる', () => {
    expect(FRESH_SAVE.loopCount).toBe(0);
  });

  it('FINAL_BOSS_KILLED（di===3）で勝利時に save.loopCount がインクリメントされる', () => {
    // Arrange: 神話世界（di=3）の最終ボス戦、bb=1 で即勝利する設定
    const dd = { ...DIFFS[3], bb: 1 };
    const run = makeRun({
      di: 3, dd, _fPhase: 1, _fbk: 'ft',
      hp: 200, mhp: 200, cBT: 'final', cW: 5, wpb: 4,
      en: { n: '氷の神獣', hp: 0, mhp: 320, atk: 30, def: 7, bone: 10 },
      bE: 50, loopCount: 0,
    });
    const save = makeSave({ loopCount: 0 });
    const state = makeGameState({
      run, save, phase: 'battle', finalMode: true,
    });

    // Act
    const next = gameReducer(state, { type: 'FINAL_BOSS_KILLED' });

    // Assert: ゲームクリア時に loopCount が +1
    expect(next.save.loopCount).toBe(1);
  });

  it('FINAL_BOSS_KILLED（di!==3）では save.loopCount が変化しない', () => {
    // Arrange: 原始（di=0）の最終ボス戦
    const dd = { ...DIFFS[0], bb: 1 };
    const run = makeRun({
      di: 0, dd, _fPhase: 1, _fbk: 'ft',
      hp: 200, mhp: 200, cBT: 'final', cW: 5, wpb: 4,
      en: { n: '氷の神獣', hp: 0, mhp: 320, atk: 30, def: 7, bone: 10 },
      bE: 50, loopCount: 0,
    });
    const save = makeSave({ loopCount: 2 });
    const state = makeGameState({
      run, save, phase: 'battle', finalMode: true,
    });

    // Act
    const next = gameReducer(state, { type: 'FINAL_BOSS_KILLED' });

    // Assert: di===0 なので loopCount は変わらない
    expect(next.save.loopCount).toBe(2);
  });
});

/* ===== FB#4: エンドレスチャレンジ (reducer) ===== */

describe('FB#4: エンドレスチャレンジ (reducer)', () => {
  it('START_CHALLENGE で endless チャレンジを開始できる', () => {
    const save = makeSave({ bones: 100, runs: 0 });
    const state = makeGameState({ save });

    const next = gameReducer(state, { type: 'START_CHALLENGE', challengeId: 'endless', di: 0 });

    expect(next.run).not.toBeNull();
    expect(next.run!.isEndless).toBe(true);
    expect(next.run!.endlessWave).toBe(0);
    expect(next.run!.challengeId).toBe('endless');
  });

  it('エンドレスモードで bc>=3 時に endless_checkpoint に遷移する', () => {
    // Arrange: bc=3 到達、エンドレスモード
    const bossRun = makeRun({
      bc: 3, isEndless: true, endlessWave: 0,
      bms: ['grassland', 'glacier', 'volcano'],
      cBT: 'volcano', cB: 3,
      cW: 5, wpb: 4,
      en: { n: 'テストボス', hp: 0, mhp: 100, atk: 10, def: 0, bone: 5 },
      btlCount: 5,
    });
    const bossState = makeGameState({
      run: bossRun, phase: 'battle', finalMode: false,
    });

    // Act
    const next = gameReducer(bossState, { type: 'AFTER_BATTLE' });

    // Assert: prefinal ではなく endless_checkpoint に遷移
    expect(next.phase).toBe('endless_checkpoint');
  });

  it('ENDLESS_CONTINUE でリループして evo に遷移する', () => {
    const run = makeRun({
      bc: 3, isEndless: true, endlessWave: 1,
      bms: ['grassland', 'glacier', 'volcano'],
      cBT: 'volcano', cB: 3,
    });
    const state = makeGameState({
      run, phase: 'endless_checkpoint', finalMode: false,
    });

    const next = gameReducer(state, { type: 'ENDLESS_CONTINUE' });

    // Assert: evo に遷移、endlessWave +1、bc リセット
    expect(next.phase).toBe('evo');
    expect(next.run!.endlessWave).toBe(2);
    expect(next.run!.bc).toBe(0);
  });

  it('ENDLESS_RETIRE で over に遷移し骨削減なし', () => {
    const run = makeRun({
      bc: 3, isEndless: true, endlessWave: 3,
      bms: ['grassland', 'glacier', 'volcano'],
      cBT: 'volcano', bE: 50, bb: 10,
    });
    const state = makeGameState({
      run, phase: 'endless_checkpoint', finalMode: false,
      save: makeSave({ bones: 100 }),
    });

    const next = gameReducer(state, { type: 'ENDLESS_RETIRE' });

    // Assert: over に遷移
    expect(next.phase).toBe('over');
    expect(next.gameResult).toBe(false);
    // 骨がペナルティなしで加算される
    const expectedBone = calcBoneReward(run, false);
    expect(next.save.bones).toBe(100 + expectedBone);
  });

  it('ENDLESS_RETIRE は SURRENDER より多くの骨を獲得する', () => {
    const run = makeRun({
      bc: 3, isEndless: true, endlessWave: 3,
      bms: ['grassland', 'glacier', 'volcano'],
      cBT: 'volcano', bE: 50, bb: 10,
    });
    const save = makeSave({ bones: 0 });

    // ENDLESS_RETIRE
    const retireState = makeGameState({ run, phase: 'endless_checkpoint', save });
    const retireNext = gameReducer(retireState, { type: 'ENDLESS_RETIRE' });

    // SURRENDER（骨を50%削減）
    const surrenderState = makeGameState({ run, phase: 'battle', save });
    const surrenderNext = gameReducer(surrenderState, { type: 'SURRENDER' });

    // Assert: RETIRE のほうが骨が多い
    expect(retireNext.save.bones).toBeGreaterThan(surrenderNext.save.bones);
  });
});

/* ===== FB#12: START_RUN loopOverride ===== */

describe('FB#12: START_RUN loopOverride（周回数選択）', () => {
  it('loopOverride: 0 → スケーリングなし（loopCount=0 として開始）', () => {
    const save = makeSave({ loopCount: 3, runs: 0 });
    const state = makeGameState({ save });

    const next = gameReducer(state, { type: 'START_RUN', di: 0, loopOverride: 0 });

    expect(next.run).not.toBeNull();
    // loopOverride=0 なので RunState の loopCount は 0
    expect(next.run!.loopCount).toBe(0);
    // 敵のスケーリングは loopCount=0 相当（dd.hm === DIFFS[0].hm）
    expect(next.run!.dd.hm).toBe(DIFFS[0].hm);
    expect(next.run!.dd.am).toBe(DIFFS[0].am);
  });

  it('loopOverride < save.loopCount → 中間値でスケーリング', () => {
    const save = makeSave({ loopCount: 4, runs: 0 });
    const state = makeGameState({ save });

    const next = gameReducer(state, { type: 'START_RUN', di: 0, loopOverride: 2 });

    expect(next.run).not.toBeNull();
    expect(next.run!.loopCount).toBe(2);
    // loopOverride=2 → スケール倍率 = 1 + 2 * 0.5 = 2.0
    const expectedHm = DIFFS[0].hm * (1 + 2 * LOOP_SCALE_FACTOR);
    expect(next.run!.dd.hm).toBeCloseTo(expectedHm);
  });

  it('loopOverride === save.loopCount → 最大スケーリング（既存動作相当）', () => {
    const save = makeSave({ loopCount: 3, runs: 0 });
    const state = makeGameState({ save });

    const next = gameReducer(state, { type: 'START_RUN', di: 0, loopOverride: 3 });

    expect(next.run).not.toBeNull();
    expect(next.run!.loopCount).toBe(3);
    const expectedHm = DIFFS[0].hm * (1 + 3 * LOOP_SCALE_FACTOR);
    expect(next.run!.dd.hm).toBeCloseTo(expectedHm);
  });
});

/* ===== FB#11: LOOP_SCALE_FACTOR 定数 ===== */

describe('FB#11: LOOP_SCALE_FACTOR 定数', () => {
  it('LOOP_SCALE_FACTOR が 0.5 である', () => {
    expect(LOOP_SCALE_FACTOR).toBe(0.5);
  });
});


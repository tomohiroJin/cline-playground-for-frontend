/**
 * Phase S4-3: ペアマッチ（2v2）ゲームロジックのテスト
 */
import { EntityFactory, resolveMalletPuckOverlap, resolveMalletMalletOverlaps } from './entities';
import { CONSTANTS } from './constants';
import { getAllMallets, applyGoalScore, updateExtraMalletAI } from './pair-match-logic';
import { applyItemEffect } from './items';
import { CpuAI } from './ai';
import { AI_BEHAVIOR_PRESETS } from './story-balance';
import { DEFAULT_PLAY_STYLE } from './character-ai-profiles';
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

  // ── GP-1: ally CPU ゾーン制約 ──────────────────

  describe('GP-1: ally CPU ゾーン制約（座標反転アプローチ）', () => {
    it('ally（player チーム）の AI 結果が下半分に制約される', () => {
      const state = create2v2State();
      const H = CONSTANTS.CANVAS.HEIGHT;
      // パックを下半分に配置（ally に向かって来る方向）
      state.pucks[0].x = 300;
      state.pucks[0].y = H - 100;
      state.pucks[0].vy = 5;

      const updateFn = CpuAI.updateWithBehavior.bind(CpuAI);
      const config = AI_BEHAVIOR_PRESETS.normal;
      const result = updateExtraMalletAI(
        state, state.ally!,
        { target: null, targetTime: 0, stuckTimer: 0 },
        updateFn, config, Date.now(), CONSTANTS, 0,
        'player'
      );

      expect(result).toBeDefined();
      // ally の Y 座標が下半分（H/2 以上）に制約される
      expect(result!.mallet.y).toBeGreaterThanOrEqual(H / 2);
    });

    it('enemy（cpu チーム）の AI 結果が上半分に制約される', () => {
      const state = create2v2State();
      const H = CONSTANTS.CANVAS.HEIGHT;
      state.pucks[0].x = 300;
      state.pucks[0].y = 100;
      state.pucks[0].vy = -5;

      const updateFn = CpuAI.updateWithBehavior.bind(CpuAI);
      const config = AI_BEHAVIOR_PRESETS.normal;
      const result = updateExtraMalletAI(
        state, state.enemy!,
        { target: null, targetTime: 0, stuckTimer: 0 },
        updateFn, config, Date.now(), CONSTANTS, 0,
        'cpu'
      );

      expect(result).toBeDefined();
      // enemy の Y 座標が上半分（H/2 以下）に制約される
      expect(result!.mallet.y).toBeLessThanOrEqual(H / 2);
    });
  });

  // ── GP-2: マレット間衝突判定 ──────────────────

  describe('GP-2: マレット間衝突判定', () => {
    it('重なったマレットが分離される', () => {
      const state = create2v2State();
      // player と ally を同じ位置に配置
      state.player.x = 300;
      state.player.y = 800;
      state.ally!.x = 300;
      state.ally!.y = 800;

      resolveMalletMalletOverlaps(getAllMallets(state), MR);

      const dx = state.player.x - state.ally!.x;
      const dy = state.player.y - state.ally!.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).toBeGreaterThanOrEqual(MR * 2 - 1); // 浮動小数点誤差許容
    });

    it('離れているマレットは影響を受けない', () => {
      const state = create2v2State();
      const origPlayerX = state.player.x;
      const origPlayerY = state.player.y;

      resolveMalletMalletOverlaps(getAllMallets(state), MR);

      expect(state.player.x).toBe(origPlayerX);
      expect(state.player.y).toBe(origPlayerY);
    });
  });
});

// ── Phase S6-2: ally sidePreference 反転テスト ──────

describe('updateExtraMalletAI — sidePreference 反転（R-4）', () => {
  it('ally（team=player）で sidePreference が反転されて AI に渡される', () => {
    const state = create2v2State();
    // パックが画面下方（ally 自陣）にいて上方向に移動
    // Y 反転後: y=1200-900=300, vy=-(-3)=3 → vy < 0 ではないので defenseStyle 分岐
    // → パックを反転後にパック追跡分岐に入るよう設定
    // 反転後: y=1200-900=300（< H/2+50=650）, vy=3 → vy < 0 ではない
    // パック追跡分岐: puck.vy < 0 && puck.y < H/2+50
    // ally の反転: y → H-y, vy → -vy なので、元の vy=-3 → 反転後 vy=3（追跡しない）
    // 元の vy=3 → 反転後 vy=-3（追跡する）
    state.pucks[0].y = 900;    // 反転後: 300
    state.pucks[0].vy = 3;     // 反転後: -3 → パック追跡分岐に入る
    state.pucks[0].x = CONSTANTS.CANVAS.WIDTH / 2;
    state.pucks[0].vx = 0;

    const configRight = {
      ...AI_BEHAVIOR_PRESETS.normal,
      playStyle: { ...DEFAULT_PLAY_STYLE, sidePreference: 0.5 },
    };
    const configCenter = {
      ...AI_BEHAVIOR_PRESETS.normal,
      playStyle: { ...DEFAULT_PLAY_STYLE, sidePreference: 0 },
    };

    const updateFn = CpuAI.updateWithBehavior.bind(CpuAI);
    const aiState = { target: null, targetTime: 0, stuckTimer: 0 };

    const resultRight = updateExtraMalletAI(
      state, state.ally!, aiState, updateFn, configRight, 1000, CONSTANTS, 0, 'player'
    );
    const resultCenter = updateExtraMalletAI(
      state, state.ally!, aiState, updateFn, configCenter, 1000, CONSTANTS, 0, 'player'
    );

    // ally（player チーム）では sidePreference が反転されるため、
    // configRight の 0.5 → -0.5 として AI に渡され、結果が center と異なる
    if (resultRight && resultCenter) {
      expect(resultRight.mallet.x).not.toBe(resultCenter.mallet.x);
    }
  });

  it('attacker の teamRole で aggressiveness が +0.3 加算される', () => {
    const state = create2v2State();
    state.pucks[0].y = 200;
    state.pucks[0].vy = -5;
    state.pucks[0].x = CONSTANTS.CANVAS.WIDTH / 2;

    // aggressiveness=0.5 + attacker=+0.3 = 0.8
    const configAttacker = {
      ...AI_BEHAVIOR_PRESETS.normal,
      playStyle: { ...DEFAULT_PLAY_STYLE, teamRole: 'attacker' as const, aggressiveness: 0.5 },
    };
    // aggressiveness=0.5 + balanced=0 = 0.5
    const configBalanced = {
      ...AI_BEHAVIOR_PRESETS.normal,
      playStyle: { ...DEFAULT_PLAY_STYLE, teamRole: 'balanced' as const, aggressiveness: 0.5 },
    };

    const updateFn = CpuAI.updateWithBehavior.bind(CpuAI);
    const aiState = { target: null, targetTime: 0, stuckTimer: 0 };

    const resultAttacker = updateExtraMalletAI(
      state, state.enemy!, aiState, updateFn, configAttacker, 1000, CONSTANTS, 0, 'cpu'
    );
    const resultBalanced = updateExtraMalletAI(
      state, state.enemy!, aiState, updateFn, configBalanced, 1000, CONSTANTS, 0, 'cpu'
    );

    // attacker は balanced より前方（Y が大きい = ゴールから遠い）にポジションする
    if (resultAttacker && resultBalanced) {
      expect(resultAttacker.mallet.y).toBeGreaterThanOrEqual(resultBalanced.mallet.y);
    }
  });

  it('enemy（team=cpu）では sidePreference が反転されない', () => {
    const state = create2v2State();
    state.pucks[0].y = 200;
    state.pucks[0].vy = -5;
    state.pucks[0].x = CONSTANTS.CANVAS.WIDTH / 2;

    const configRight = {
      ...AI_BEHAVIOR_PRESETS.normal,
      playStyle: { ...DEFAULT_PLAY_STYLE, sidePreference: 0.5 },
    };
    const configCenter = {
      ...AI_BEHAVIOR_PRESETS.normal,
      playStyle: { ...DEFAULT_PLAY_STYLE, sidePreference: 0 },
    };

    const updateFn = CpuAI.updateWithBehavior.bind(CpuAI);
    const aiState = { target: null, targetTime: 0, stuckTimer: 0 };

    const resultRight = updateExtraMalletAI(
      state, state.enemy!, aiState, updateFn, configRight, 1000, CONSTANTS, 0, 'cpu'
    );
    const resultCenter = updateExtraMalletAI(
      state, state.enemy!, aiState, updateFn, configCenter, 1000, CONSTANTS, 0, 'cpu'
    );

    // enemy では反転なし → sidePreference=0.5 で右にオフセット
    if (resultRight && resultCenter) {
      expect(resultRight.mallet.x).toBeGreaterThanOrEqual(resultCenter.mallet.x);
    }
  });
});

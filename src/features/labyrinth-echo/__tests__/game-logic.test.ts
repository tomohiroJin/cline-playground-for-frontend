/**
 * 迷宮の残響 - ゲームロジックのテスト
 */
import {
  CFG, DIFFICULTY, FX_DEFAULTS,
  computeFx, createPlayer, evalCond, resolveOutcome,
  applyModifiers, applyToPlayer, computeDrain,
  classifyImpact, computeProgress,
} from '../game-logic';
import {
  createTestPlayer,
  createTestFx,
  createTestOutcome,
} from './helpers/factories';

/** テスト用難易度 */
const normalDiff = DIFFICULTY.find(d => d.id === 'normal')!;
const easyDiff = DIFFICULTY.find(d => d.id === 'easy')!;
const hardDiff = DIFFICULTY.find(d => d.id === 'hard')!;

describe('迷宮の残響 - ゲームロジック', () => {
  // ── computeFx ────────────────────────────────────────

  describe('computeFx - アンロック効果の合算', () => {
    it('空リストを渡すとデフォルト値を返す', () => {
      // Act
      const fx = computeFx([]);

      // Assert
      expect(fx).toEqual(FX_DEFAULTS);
    });

    it('加算型FXを複数渡すと足し算で合算される', () => {
      // Arrange — u1: infoBonus:3, u2: hpBonus:5

      // Act
      const fx = computeFx(['u1', 'u2']);

      // Assert
      expect(fx.infoBonus).toBe(3);
      expect(fx.hpBonus).toBe(5);
    });

    it('乗算型FXを複数渡すと掛け算で合算される', () => {
      // Arrange — u4: infoMult:1.1, u14: infoMult:1.15

      // Act
      const fx = computeFx(['u4', 'u14']);

      // Assert
      expect(fx.infoMult).toBeCloseTo(1.1 * 1.15, 5);
    });

    it('ブール型FXを渡すとtrueに設定される', () => {
      // Arrange — u6: dangerSense:true

      // Act
      const fx = computeFx(['u6']);

      // Assert
      expect(fx.dangerSense).toBe(true);
    });

    it('複合FX（加算型2つ）を渡すと各型で正しく処理される', () => {
      // Arrange — u26: hpBonus:12, mentalBonus:10

      // Act
      const fx = computeFx(['u26']);

      // Assert
      expect(fx.hpBonus).toBe(12);
      expect(fx.mentalBonus).toBe(10);
    });

    it('存在しないIDを渡すと無視されデフォルト値を返す', () => {
      // Act
      const fx = computeFx(['nonexistent']);

      // Assert
      expect(fx).toEqual(FX_DEFAULTS);
    });
  });

  // ── createPlayer ─────────────────────────────────────

  describe('createPlayer - プレイヤー初期状態', () => {
    it('normal難易度でデフォルトFXを渡すと基本値＋難易度修正の初期値になる', () => {
      // Arrange
      const fx = createTestFx();

      // Act
      const player = createPlayer(normalDiff, fx);

      // Assert
      expect(player.hp).toBe(CFG.BASE_HP + normalDiff.hpMod);
      expect(player.mn).toBe(CFG.BASE_MN + normalDiff.mnMod);
      expect(player.inf).toBe(CFG.BASE_INF);
      expect(player.st).toEqual([]);
    });

    it('easy難易度を渡すとHP/MNが高くなる', () => {
      // Arrange
      const fx = createTestFx();

      // Act
      const player = createPlayer(easyDiff, fx);

      // Assert
      expect(player.hp).toBe(CFG.BASE_HP + easyDiff.hpMod);
      expect(player.mn).toBe(CFG.BASE_MN + easyDiff.mnMod);
    });

    it('hard難易度を渡すとHP/MNが低くなる', () => {
      // Arrange
      const fx = createTestFx();

      // Act
      const player = createPlayer(hardDiff, fx);

      // Assert
      expect(player.hp).toBe(CFG.BASE_HP + hardDiff.hpMod);
      expect(player.mn).toBe(CFG.BASE_MN + hardDiff.mnMod);
    });

    it('アンロック効果付きFXを渡すと初期値に反映される', () => {
      // Arrange
      const fx = createTestFx({ hpBonus: 10, mentalBonus: 5, infoBonus: 3 });

      // Act
      const player = createPlayer(normalDiff, fx);

      // Assert
      expect(player.hp).toBe(CFG.BASE_HP + 10 + normalDiff.hpMod);
      expect(player.mn).toBe(CFG.BASE_MN + 5 + normalDiff.mnMod);
      expect(player.inf).toBe(CFG.BASE_INF + 3);
    });

    it('生成されたプレイヤーのmaxHpとmaxMnがhpとmnに一致する', () => {
      // Arrange
      const fx = createTestFx();

      // Act
      const player = createPlayer(normalDiff, fx);

      // Assert
      expect(player.maxHp).toBe(player.hp);
      expect(player.maxMn).toBe(player.mn);
    });
  });

  // ── evalCond ─────────────────────────────────────────

  describe('evalCond - 条件評価', () => {
    describe('正常系', () => {
      it('"default"条件を渡すと常にtrueを返す', () => {
        // Arrange
        const player = createTestPlayer();
        const fx = createTestFx();

        // Act & Assert
        expect(evalCond('default', player, fx)).toBe(true);
      });

      it('"status:呪い"条件を呪い状態のプレイヤーに渡すとtrueを返す', () => {
        // Arrange
        const player = createTestPlayer({ st: ['呪い'] });
        const fx = createTestFx();

        // Act
        const result = evalCond('status:呪い', player, fx);

        // Assert
        expect(result).toBe(true);
      });

      it('"status:呪い"条件を呪いなしプレイヤーに渡すとfalseを返す', () => {
        // Arrange
        const player = createTestPlayer({ st: [] });
        const fx = createTestFx();

        // Act
        const result = evalCond('status:呪い', player, fx);

        // Assert
        expect(result).toBe(false);
      });

      it('"hp>30"条件をHP31のプレイヤーに渡すとtrueを返す', () => {
        // Arrange
        const fx = createTestFx();

        // Act & Assert
        expect(evalCond('hp>30', createTestPlayer({ hp: 31 }), fx)).toBe(true);
        expect(evalCond('hp>30', createTestPlayer({ hp: 30 }), fx)).toBe(false);
      });

      it('"mn>20"条件をMN21のプレイヤーに渡すとtrueを返す', () => {
        // Arrange
        const fx = createTestFx();

        // Act & Assert
        expect(evalCond('mn>20', createTestPlayer({ mn: 21 }), fx)).toBe(true);
        expect(evalCond('mn>20', createTestPlayer({ mn: 20 }), fx)).toBe(false);
      });

      it('"inf>5"条件をINF6のプレイヤーに渡すとtrueを返す', () => {
        // Arrange
        const fx = createTestFx();

        // Act & Assert
        expect(evalCond('inf>5', createTestPlayer({ inf: 6 }), fx)).toBe(true);
        expect(evalCond('inf>5', createTestPlayer({ inf: 5 }), fx)).toBe(false);
      });

      it('"hp<20"条件をHP19のプレイヤーに渡すとtrueを返す', () => {
        // Arrange
        const fx = createTestFx();

        // Act & Assert
        expect(evalCond('hp<20', createTestPlayer({ hp: 19 }), fx)).toBe(true);
        expect(evalCond('hp<20', createTestPlayer({ hp: 20 }), fx)).toBe(false);
      });
    });

    describe('FX効果による条件緩和', () => {
      it('dangerSense有効かつHP<30のとき、HP判定に+20ボーナスが適用される', () => {
        // Arrange
        const fx = createTestFx({ dangerSense: true });

        // Act & Assert — HP=20, 閾値30 → 20+20=40 > 30 → true
        expect(evalCond('hp>30', createTestPlayer({ hp: 20 }), fx)).toBe(true);
        // HP=40, 閾値30 → dangerSense不適用(HP>=30) → 40 > 30 → true
        expect(evalCond('hp>30', createTestPlayer({ hp: 40 }), fx)).toBe(true);
      });

      it('negotiator有効のとき、MN判定に+8ボーナスが適用される', () => {
        // Arrange
        const fx = createTestFx({ negotiator: true });

        // Act — mn=15, 閾値20 → 15+8=23 > 20 → true
        const result = evalCond('mn>20', createTestPlayer({ mn: 15 }), fx);

        // Assert
        expect(result).toBe(true);
      });

      it('mentalSense有効かつMN<25のとき、MN判定に+15ボーナスが適用される', () => {
        // Arrange
        const fx = createTestFx({ mentalSense: true });

        // Act — mn=10, 閾値20 → 10+15=25 > 20 → true
        const result = evalCond('mn>20', createTestPlayer({ mn: 10 }), fx);

        // Assert
        expect(result).toBe(true);
      });
    });
  });

  // ── applyModifiers ───────────────────────────────────

  describe('applyModifiers - 修正値の適用', () => {
    it('healMult付きFXで回復アウトカムを渡すと回復倍率が適用される', () => {
      // Arrange
      const fx = createTestFx({ healMult: 1.5 });
      const outcome = createTestOutcome({ hp: 10, mn: 0, inf: 0 });

      // Act
      const result = applyModifiers(outcome, fx, normalDiff, []);

      // Assert
      expect(result.hp).toBe(Math.round(10 * 1.5));
    });

    it('hpReduce付きFXでダメージアウトカムを渡すとダメージ軽減が適用される', () => {
      // Arrange
      const fx = createTestFx({ hpReduce: 0.9 });
      const outcome = createTestOutcome({ hp: -10, mn: 0, inf: 0 });

      // Act
      const result = applyModifiers(outcome, fx, normalDiff, []);

      // Assert
      expect(result.hp).toBe(Math.round(-10 * 0.9));
    });

    it('hard難易度でダメージアウトカムを渡すと難易度倍率が適用される', () => {
      // Arrange
      const fx = createTestFx();
      const outcome = createTestOutcome({ hp: -10, mn: -5, inf: 0 });

      // Act
      const result = applyModifiers(outcome, fx, hardDiff, []);

      // Assert
      expect(result.hp).toBe(Math.round(Math.round(-10 * 1) * hardDiff.dmgMult));
      expect(result.mn).toBe(Math.round(Math.round(-5 * hardDiff.dmgMult) * 1));
    });

    it('infoMult付きFXで情報取得アウトカムを渡すと倍率が適用される', () => {
      // Arrange
      const fx = createTestFx({ infoMult: 1.2 });
      const outcome = createTestOutcome({ hp: 0, mn: 0, inf: 10 });

      // Act
      const result = applyModifiers(outcome, fx, normalDiff, []);

      // Assert
      expect(result.inf).toBe(Math.round(10 * 1.2));
    });

    it('呪い状態で情報取得アウトカムを渡すと情報取得量が半減する', () => {
      // Arrange
      const fx = createTestFx();
      const outcome = createTestOutcome({ hp: 0, mn: 0, inf: 10 });

      // Act
      const result = applyModifiers(outcome, fx, normalDiff, ['呪い']);

      // Assert
      expect(result.inf).toBe(Math.round(10 * 0.5));
    });

    it('mnReduce付きFXで精神ダメージアウトカムを渡すと軽減が適用される', () => {
      // Arrange
      const fx = createTestFx({ mnReduce: 0.8 });
      const outcome = createTestOutcome({ hp: 0, mn: -10, inf: 0 });

      // Act
      const result = applyModifiers(outcome, fx, normalDiff, []);

      // Assert
      expect(result.mn).toBe(Math.round(-10 * 0.8));
    });
  });

  // ── applyToPlayer ────────────────────────────────────

  describe('applyToPlayer - プレイヤー状態更新', () => {
    it('HP/MN/情報値の変更を渡すと正しく加算される', () => {
      // Arrange
      const player = createTestPlayer({ hp: 30, mn: 20, inf: 5 });

      // Act
      const updated = applyToPlayer(player, { hp: 10, mn: 5, inf: 3 }, null);

      // Assert
      expect(updated.hp).toBe(40);
      expect(updated.mn).toBe(25);
      expect(updated.inf).toBe(8);
    });

    it('maxHpを超える回復を渡すとmaxHpにクランプされる', () => {
      // Arrange
      const player = createTestPlayer({ hp: 50, maxHp: 55 });

      // Act
      const updated = applyToPlayer(player, { hp: 20, mn: 0, inf: 0 }, null);

      // Assert
      expect(updated.hp).toBe(55);
    });

    it('致命的ダメージを渡すとHPが0にクランプされる', () => {
      // Arrange
      const player = createTestPlayer({ hp: 5 });

      // Act
      const updated = applyToPlayer(player, { hp: -20, mn: 0, inf: 0 }, null);

      // Assert
      expect(updated.hp).toBe(0);
    });

    it('"add:呪い"フラグを渡すと呪い状態が追加される', () => {
      // Arrange
      const player = createTestPlayer();

      // Act
      const updated = applyToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'add:呪い');

      // Assert
      expect(updated.st).toContain('呪い');
    });

    it('既に呪い状態のプレイヤーに"add:呪い"を渡すと重複追加されない', () => {
      // Arrange
      const player = createTestPlayer({ st: ['呪い'] });

      // Act
      const updated = applyToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'add:呪い');

      // Assert
      expect(updated.st.filter(s => s === '呪い')).toHaveLength(1);
    });

    it('"remove:呪い"フラグを渡すと呪い状態が除去され他の状態は維持される', () => {
      // Arrange
      const player = createTestPlayer({ st: ['呪い', '出血'] });

      // Act
      const updated = applyToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'remove:呪い');

      // Assert
      expect(updated.st).not.toContain('呪い');
      expect(updated.st).toContain('出血');
    });

    it('状態変更を行っても元のプレイヤーオブジェクトは変更されない', () => {
      // Arrange
      const player = createTestPlayer();
      const originalHp = player.hp;

      // Act
      applyToPlayer(player, { hp: -10, mn: 0, inf: 0 }, null);

      // Assert
      expect(player.hp).toBe(originalHp);
    });
  });

  // ── computeDrain ─────────────────────────────────────

  describe('computeDrain - ドレイン計算', () => {
    it('ドレイン免疫かつ状態異常なしのプレイヤーを渡すとドレインなし', () => {
      // Arrange
      const fx = createTestFx({ drainImmune: true });
      const player = createTestPlayer();

      // Act
      const { drain } = computeDrain(player, fx, normalDiff);

      // Assert
      expect(drain).toBeNull();
    });

    it('ドレイン免疫なしのプレイヤーを渡すと精神ドレインが発生する', () => {
      // Arrange
      const fx = createTestFx();
      const player = createTestPlayer();

      // Act
      const { drain } = computeDrain(player, fx, normalDiff);

      // Assert — normalDiff.drainMod = -1
      expect(drain).not.toBeNull();
      expect(drain!.mn).toBe(-1);
    });

    it('出血状態のプレイヤーを渡すと出血ダメージが適用される', () => {
      // Arrange
      const fx = createTestFx({ drainImmune: true });
      const player = createTestPlayer({ st: ['出血'] });

      // Act
      const { drain } = computeDrain(player, fx, normalDiff);

      // Assert — 出血tick: hp=-5
      expect(drain).not.toBeNull();
      expect(drain!.hp).toBe(-5);
    });

    it('bleedReduce有効で出血状態のプレイヤーを渡すと出血ダメージが半減する', () => {
      // Arrange
      const fx = createTestFx({ drainImmune: true, bleedReduce: true });
      const player = createTestPlayer({ st: ['出血'] });

      // Act
      const { drain } = computeDrain(player, fx, normalDiff);

      // Assert
      expect(drain!.hp).toBe(Math.round(-5 * 0.5));
    });

    it('恐怖状態のプレイヤーを渡すと精神ダメージが適用される', () => {
      // Arrange
      const fx = createTestFx({ drainImmune: true });
      const player = createTestPlayer({ st: ['恐怖'] });

      // Act
      const { drain } = computeDrain(player, fx, normalDiff);

      // Assert — 恐怖tick: mn=-4
      expect(drain!.mn).toBe(-4);
    });

    it('HP/MNが低いプレイヤーにドレインを適用すると0以上にクランプされる', () => {
      // Arrange
      const fx = createTestFx();
      const player = createTestPlayer({ hp: 2, mn: 1, st: ['出血'] });

      // Act
      const { player: updated } = computeDrain(player, fx, normalDiff);

      // Assert
      expect(updated.hp).toBeGreaterThanOrEqual(0);
      expect(updated.mn).toBeGreaterThanOrEqual(0);
    });
  });

  // ── classifyImpact ───────────────────────────────────

  describe('classifyImpact - インパクト分類', () => {
    it('HP -16以下を渡すと"bigDmg"を返す', () => {
      // Act & Assert
      expect(classifyImpact(-16, 0)).toBe('bigDmg');
      expect(classifyImpact(-20, 0)).toBe('bigDmg');
    });

    it('HP -1〜-15を渡すと"dmg"を返す', () => {
      // Act & Assert
      expect(classifyImpact(-1, 0)).toBe('dmg');
      expect(classifyImpact(-15, 0)).toBe('dmg');
    });

    it('MN -11以下を渡すと"dmg"を返す', () => {
      // Act & Assert
      expect(classifyImpact(0, -11)).toBe('dmg');
    });

    it('HP正の値を渡すと"heal"を返す', () => {
      // Act & Assert
      expect(classifyImpact(5, 0)).toBe('heal');
    });

    it('変化なしを渡すとnullを返す', () => {
      // Act & Assert
      expect(classifyImpact(0, 0)).toBeNull();
      expect(classifyImpact(0, -5)).toBeNull();
    });
  });

  // ── computeProgress ──────────────────────────────────

  describe('computeProgress - 進行度計算', () => {
    it('最初の階・ステップ0を渡すと0%を返す', () => {
      // Act & Assert
      expect(computeProgress(1, 0)).toBe(0);
    });

    it('最終階・最終ステップを渡すと100%を返す', () => {
      // Act
      const progress = computeProgress(CFG.MAX_FLOOR, CFG.EVENTS_PER_FLOOR);

      // Assert
      expect(progress).toBeCloseTo(100, 0);
    });

    it('途中の階・ステップを渡すと正しい進行度を返す', () => {
      // Arrange — floor=2, step=1 → ((2-1)*3+1)/(5*3)*100 ≈ 26.67

      // Act
      const progress = computeProgress(2, 1);

      // Assert
      expect(progress).toBeCloseTo(26.67, 0);
    });

    it('範囲外の値を渡しても100%を超えない', () => {
      // Act & Assert
      expect(computeProgress(10, 10)).toBe(100);
    });
  });

  // ── resolveOutcome ───────────────────────────────────

  describe('resolveOutcome - 結果解決', () => {
    it('条件一致するアウトカムがある選択肢を渡すとそのアウトカムを返す', () => {
      // Arrange
      const choice = {
        t: 'テスト選択肢',
        o: [
          { c: 'hp>50', r: 'HP高い' },
          { c: 'default', r: 'デフォルト' },
        ],
      };
      const player = createTestPlayer({ hp: 55 });
      const fx = createTestFx();

      // Act
      const result = resolveOutcome(choice, player, fx);

      // Assert
      expect(result.r).toBe('HP高い');
    });

    it('条件不一致の場合defaultアウトカムを返す', () => {
      // Arrange
      const choice = {
        t: 'テスト選択肢',
        o: [
          { c: 'hp>80', r: 'HP超高い' },
          { c: 'default', r: 'デフォルト' },
        ],
      };
      const player = createTestPlayer({ hp: 30 });
      const fx = createTestFx();

      // Act
      const result = resolveOutcome(choice, player, fx);

      // Assert
      expect(result.r).toBe('デフォルト');
    });

    it('defaultがない場合は最初のアウトカムを返す', () => {
      // Arrange
      const choice = {
        t: 'テスト選択肢',
        o: [
          { c: 'hp>100', r: '条件不一致' },
        ],
      };
      const player = createTestPlayer({ hp: 30 });
      const fx = createTestFx();

      // Act
      const result = resolveOutcome(choice, player, fx);

      // Assert
      expect(result.r).toBe('条件不一致');
    });
  });
});

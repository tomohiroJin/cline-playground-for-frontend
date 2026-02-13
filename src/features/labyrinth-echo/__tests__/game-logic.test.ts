// @ts-nocheck
/**
 * 迷宮の残響 - ゲームロジックのテスト
 */
import {
  CFG, DIFFICULTY, FX_DEFAULTS,
  computeFx, createPlayer, evalCond, resolveOutcome,
  applyModifiers, applyToPlayer, computeDrain,
  classifyImpact, computeProgress, clamp,
} from '../game-logic';

/** テスト用デフォルトFX */
const defaultFx = () => ({ ...FX_DEFAULTS });

/** テスト用プレイヤー生成ヘルパー */
const makePlayer = (overrides = {}) => ({
  hp: 55, maxHp: 55, mn: 35, maxMn: 35, inf: 5, st: [],
  ...overrides,
});

/** テスト用難易度（normal） */
const normalDiff = DIFFICULTY.find(d => d.id === 'normal');
const easyDiff = DIFFICULTY.find(d => d.id === 'easy');
const hardDiff = DIFFICULTY.find(d => d.id === 'hard');

describe('迷宮の残響 - ゲームロジック', () => {
  // ── computeFx ────────────────────────────────────────

  describe('computeFx - アンロック効果の合算', () => {
    it('空リストではデフォルト値を返す', () => {
      const fx = computeFx([]);
      expect(fx).toEqual(FX_DEFAULTS);
    });

    it('加算型FXは足し算で合算する', () => {
      // u1: infoBonus:3, u2: hpBonus:5
      const fx = computeFx(['u1', 'u2']);
      expect(fx.infoBonus).toBe(3);
      expect(fx.hpBonus).toBe(5);
    });

    it('乗算型FXは掛け算で合算する', () => {
      // u4: infoMult:1.1, u14: infoMult:1.15
      const fx = computeFx(['u4', 'u14']);
      expect(fx.infoMult).toBeCloseTo(1.1 * 1.15, 5);
    });

    it('ブール型FXはtrueで上書きする', () => {
      // u6: dangerSense:true
      const fx = computeFx(['u6']);
      expect(fx.dangerSense).toBe(true);
    });

    it('複合FXは各型で正しく処理される', () => {
      // u26: hpBonus:12, mentalBonus:10 (加算型2つ)
      const fx = computeFx(['u26']);
      expect(fx.hpBonus).toBe(12);
      expect(fx.mentalBonus).toBe(10);
    });

    it('存在しないIDは無視される', () => {
      const fx = computeFx(['nonexistent']);
      expect(fx).toEqual(FX_DEFAULTS);
    });
  });

  // ── createPlayer ─────────────────────────────────────

  describe('createPlayer - プレイヤー初期状態', () => {
    it('normal難易度でデフォルトFXの初期値が正しい', () => {
      const fx = defaultFx();
      const player = createPlayer(normalDiff, fx);
      expect(player.hp).toBe(CFG.BASE_HP + normalDiff.hpMod);
      expect(player.mn).toBe(CFG.BASE_MN + normalDiff.mnMod);
      expect(player.inf).toBe(CFG.BASE_INF);
      expect(player.st).toEqual([]);
    });

    it('easy難易度ではHP/MNが高い', () => {
      const fx = defaultFx();
      const player = createPlayer(easyDiff, fx);
      expect(player.hp).toBe(CFG.BASE_HP + easyDiff.hpMod);
      expect(player.mn).toBe(CFG.BASE_MN + easyDiff.mnMod);
    });

    it('hard難易度ではHP/MNが低い', () => {
      const fx = defaultFx();
      const player = createPlayer(hardDiff, fx);
      expect(player.hp).toBe(CFG.BASE_HP + hardDiff.hpMod);
      expect(player.mn).toBe(CFG.BASE_MN + hardDiff.mnMod);
    });

    it('アンロック効果が反映される', () => {
      const fx = { ...defaultFx(), hpBonus: 10, mentalBonus: 5, infoBonus: 3 };
      const player = createPlayer(normalDiff, fx);
      expect(player.hp).toBe(CFG.BASE_HP + 10 + normalDiff.hpMod);
      expect(player.mn).toBe(CFG.BASE_MN + 5 + normalDiff.mnMod);
      expect(player.inf).toBe(CFG.BASE_INF + 3);
    });

    it('maxHpとmaxMnがhpとmnに一致する', () => {
      const player = createPlayer(normalDiff, defaultFx());
      expect(player.maxHp).toBe(player.hp);
      expect(player.maxMn).toBe(player.mn);
    });
  });

  // ── evalCond ─────────────────────────────────────────

  describe('evalCond - 条件評価', () => {
    it('"default"条件は常にtrueを返す', () => {
      expect(evalCond('default', makePlayer(), defaultFx())).toBe(true);
    });

    it('"status:呪い"条件: 呪い状態ならtrue', () => {
      const player = makePlayer({ st: ['呪い'] });
      expect(evalCond('status:呪い', player, defaultFx())).toBe(true);
    });

    it('"status:呪い"条件: 呪い状態でなければfalse', () => {
      const player = makePlayer({ st: [] });
      expect(evalCond('status:呪い', player, defaultFx())).toBe(false);
    });

    it('"hp>30"条件: HPが31以上ならtrue', () => {
      expect(evalCond('hp>30', makePlayer({ hp: 31 }), defaultFx())).toBe(true);
      expect(evalCond('hp>30', makePlayer({ hp: 30 }), defaultFx())).toBe(false);
    });

    it('dangerSenseによるHP判定ボーナス: HP<30なら+20', () => {
      const fx = { ...defaultFx(), dangerSense: true };
      // HP=20, 閾値30 → 20+20=40 > 30 → true
      expect(evalCond('hp>30', makePlayer({ hp: 20 }), fx)).toBe(true);
      // HP=40, 閾値30 → dangerSense不適用(HP>=30) → 40 > 30 → true
      expect(evalCond('hp>30', makePlayer({ hp: 40 }), fx)).toBe(true);
    });

    it('"mn>20"条件: 精神力が21以上ならtrue', () => {
      expect(evalCond('mn>20', makePlayer({ mn: 21 }), defaultFx())).toBe(true);
      expect(evalCond('mn>20', makePlayer({ mn: 20 }), defaultFx())).toBe(false);
    });

    it('交渉術によるMN判定ボーナス: +8', () => {
      const fx = { ...defaultFx(), negotiator: true };
      // mn=15, 閾値20 → 15+8=23 > 20 → true
      expect(evalCond('mn>20', makePlayer({ mn: 15 }), fx)).toBe(true);
    });

    it('第六感によるMN判定ボーナス: MN<25なら+15', () => {
      const fx = { ...defaultFx(), mentalSense: true };
      // mn=10, 閾値20 → 10+15=25 > 20 → true
      expect(evalCond('mn>20', makePlayer({ mn: 10 }), fx)).toBe(true);
    });

    it('"inf>5"条件: 情報値が6以上ならtrue', () => {
      expect(evalCond('inf>5', makePlayer({ inf: 6 }), defaultFx())).toBe(true);
      expect(evalCond('inf>5', makePlayer({ inf: 5 }), defaultFx())).toBe(false);
    });

    it('"hp<20"条件: HPが20未満ならtrue', () => {
      expect(evalCond('hp<20', makePlayer({ hp: 19 }), defaultFx())).toBe(true);
      expect(evalCond('hp<20', makePlayer({ hp: 20 }), defaultFx())).toBe(false);
    });
  });

  // ── applyModifiers ───────────────────────────────────

  describe('applyModifiers - 修正値の適用', () => {
    it('healMultによる回復倍率が適用される', () => {
      const fx = { ...defaultFx(), healMult: 1.5 };
      const result = applyModifiers({ hp: 10, mn: 0, inf: 0 }, fx, normalDiff, []);
      expect(result.hp).toBe(Math.round(10 * 1.5));
    });

    it('hpReduceによるダメージ軽減が適用される', () => {
      const fx = { ...defaultFx(), hpReduce: 0.9 };
      const result = applyModifiers({ hp: -10, mn: 0, inf: 0 }, fx, normalDiff, []);
      expect(result.hp).toBe(Math.round(-10 * 0.9));
    });

    it('難易度倍率のダメージ適用（hard）', () => {
      const fx = defaultFx();
      const result = applyModifiers({ hp: -10, mn: -5, inf: 0 }, fx, hardDiff, []);
      expect(result.hp).toBe(Math.round(Math.round(-10 * 1) * hardDiff.dmgMult));
      expect(result.mn).toBe(Math.round(Math.round(-5 * hardDiff.dmgMult) * 1));
    });

    it('infoMultによる情報取得量の倍率が適用される', () => {
      const fx = { ...defaultFx(), infoMult: 1.2 };
      const result = applyModifiers({ hp: 0, mn: 0, inf: 10 }, fx, normalDiff, []);
      expect(result.inf).toBe(Math.round(10 * 1.2));
    });

    it('呪い状態時の情報取得量が半減する', () => {
      const fx = defaultFx();
      const result = applyModifiers({ hp: 0, mn: 0, inf: 10 }, fx, normalDiff, ['呪い']);
      expect(result.inf).toBe(Math.round(10 * 0.5));
    });

    it('mnReduceによる精神ダメージ軽減が適用される', () => {
      const fx = { ...defaultFx(), mnReduce: 0.8 };
      const result = applyModifiers({ hp: 0, mn: -10, inf: 0 }, fx, normalDiff, []);
      expect(result.mn).toBe(Math.round(-10 * 0.8));
    });
  });

  // ── applyToPlayer ────────────────────────────────────

  describe('applyToPlayer - プレイヤー状態更新', () => {
    it('HP/MN/情報値の加算が正しく適用される', () => {
      const player = makePlayer({ hp: 30, mn: 20, inf: 5 });
      const updated = applyToPlayer(player, { hp: 10, mn: 5, inf: 3 }, null);
      expect(updated.hp).toBe(40);
      expect(updated.mn).toBe(25);
      expect(updated.inf).toBe(8);
    });

    it('HPは0〜maxHpにクランプされる', () => {
      const player = makePlayer({ hp: 50, maxHp: 55 });
      const updated = applyToPlayer(player, { hp: 20, mn: 0, inf: 0 }, null);
      expect(updated.hp).toBe(55);
    });

    it('HPが0以下にならない', () => {
      const player = makePlayer({ hp: 5 });
      const updated = applyToPlayer(player, { hp: -20, mn: 0, inf: 0 }, null);
      expect(updated.hp).toBe(0);
    });

    it('"add:呪い"フラグで呪い状態が追加される', () => {
      const player = makePlayer();
      const updated = applyToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'add:呪い');
      expect(updated.st).toContain('呪い');
    });

    it('既に持っている状態異常は重複追加されない', () => {
      const player = makePlayer({ st: ['呪い'] });
      const updated = applyToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'add:呪い');
      expect(updated.st.filter(s => s === '呪い')).toHaveLength(1);
    });

    it('"remove:呪い"フラグで呪い状態が除去される', () => {
      const player = makePlayer({ st: ['呪い', '出血'] });
      const updated = applyToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'remove:呪い');
      expect(updated.st).not.toContain('呪い');
      expect(updated.st).toContain('出血');
    });

    it('元のプレイヤーオブジェクトは変更されない', () => {
      const player = makePlayer();
      const originalHp = player.hp;
      applyToPlayer(player, { hp: -10, mn: 0, inf: 0 }, null);
      expect(player.hp).toBe(originalHp);
    });
  });

  // ── computeDrain ─────────────────────────────────────

  describe('computeDrain - ドレイン計算', () => {
    it('状態異常なしかつドレイン免疫時はドレインなし', () => {
      const fx = { ...defaultFx(), drainImmune: true };
      const player = makePlayer();
      const { drain } = computeDrain(player, fx, normalDiff);
      expect(drain).toBeNull();
    });

    it('ドレイン免疫でない場合は精神ドレインが発生する', () => {
      const fx = defaultFx();
      const player = makePlayer();
      const { drain } = computeDrain(player, fx, normalDiff);
      // normalDiff.drainMod = -1
      expect(drain).not.toBeNull();
      expect(drain.mn).toBe(-1);
    });

    it('出血ダメージが適用される', () => {
      const fx = { ...defaultFx(), drainImmune: true };
      const player = makePlayer({ st: ['出血'] });
      const { drain } = computeDrain(player, fx, normalDiff);
      expect(drain).not.toBeNull();
      expect(drain.hp).toBe(-5); // 出血tick: hp=-5
    });

    it('bleedReduceで出血ダメージが半減する', () => {
      const fx = { ...defaultFx(), drainImmune: true, bleedReduce: true };
      const player = makePlayer({ st: ['出血'] });
      const { drain } = computeDrain(player, fx, normalDiff);
      expect(drain.hp).toBe(Math.round(-5 * 0.5));
    });

    it('恐怖による精神ダメージが適用される', () => {
      const fx = { ...defaultFx(), drainImmune: true };
      const player = makePlayer({ st: ['恐怖'] });
      const { drain } = computeDrain(player, fx, normalDiff);
      expect(drain.mn).toBe(-4); // 恐怖tick: mn=-4
    });

    it('ドレイン後のプレイヤーHP/MNがクランプされる', () => {
      const fx = defaultFx();
      const player = makePlayer({ hp: 2, mn: 1, st: ['出血'] });
      const { player: updated } = computeDrain(player, fx, normalDiff);
      expect(updated.hp).toBeGreaterThanOrEqual(0);
      expect(updated.mn).toBeGreaterThanOrEqual(0);
    });
  });

  // ── classifyImpact ───────────────────────────────────

  describe('classifyImpact - インパクト分類', () => {
    it('HP -16以下で"bigDmg"を返す', () => {
      expect(classifyImpact(-16, 0)).toBe('bigDmg');
      expect(classifyImpact(-20, 0)).toBe('bigDmg');
    });

    it('HP -1〜-15で"dmg"を返す', () => {
      expect(classifyImpact(-1, 0)).toBe('dmg');
      expect(classifyImpact(-15, 0)).toBe('dmg');
    });

    it('MN -11以下で"dmg"を返す', () => {
      expect(classifyImpact(0, -11)).toBe('dmg');
    });

    it('HP回復で"heal"を返す', () => {
      expect(classifyImpact(5, 0)).toBe('heal');
    });

    it('変化なしでnullを返す', () => {
      expect(classifyImpact(0, 0)).toBeNull();
      expect(classifyImpact(0, -5)).toBeNull();
    });
  });

  // ── computeProgress ──────────────────────────────────

  describe('computeProgress - 進行度計算', () => {
    it('最初の階・ステップ0で0%', () => {
      expect(computeProgress(1, 0)).toBe(0);
    });

    it('最終階・最終ステップで100%', () => {
      const progress = computeProgress(CFG.MAX_FLOOR, CFG.EVENTS_PER_FLOOR);
      expect(progress).toBeCloseTo(100, 0);
    });

    it('途中の進行度が正しく計算される', () => {
      // floor=2, step=1 → ((2-1)*3+1)/(5*3)*100 = 4/15*100 ≈ 26.67
      const progress = computeProgress(2, 1);
      expect(progress).toBeCloseTo(26.67, 0);
    });

    it('100%を超えない', () => {
      expect(computeProgress(10, 10)).toBe(100);
    });
  });

  // ── resolveOutcome ───────────────────────────────────

  describe('resolveOutcome - 結果解決', () => {
    it('条件一致するアウトカムを返す', () => {
      const choice = {
        o: [
          { c: 'hp>50', text: 'HP高い' },
          { c: 'default', text: 'デフォルト' },
        ],
      };
      const player = makePlayer({ hp: 55 });
      const result = resolveOutcome(choice, player, defaultFx());
      expect(result.text).toBe('HP高い');
    });

    it('条件不一致の場合はdefaultを返す', () => {
      const choice = {
        o: [
          { c: 'hp>80', text: 'HP超高い' },
          { c: 'default', text: 'デフォルト' },
        ],
      };
      const player = makePlayer({ hp: 30 });
      const result = resolveOutcome(choice, player, defaultFx());
      expect(result.text).toBe('デフォルト');
    });

    it('defaultがない場合は最初のアウトカムを返す', () => {
      const choice = {
        o: [
          { c: 'hp>100', text: '条件不一致' },
        ],
      };
      const player = makePlayer({ hp: 30 });
      const result = resolveOutcome(choice, player, defaultFx());
      expect(result.text).toBe('条件不一致');
    });
  });
});

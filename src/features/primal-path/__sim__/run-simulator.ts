/**
 * 原始進化録 - PRIMAL PATH - バランス検証シミュレータ
 *
 * 本番の `gameReducer` をそのまま駆動して 1 ラン丸ごとを自動プレイし、
 * 勝敗・到達バイオーム・パワーカーブ等を定量計測する。検証専用ツールであり
 * プロダクト本体からは参照されない（テストからのみ利用）。
 *
 * 設計上の要点:
 * - 検証対象（reducer 群）と実行コードが同一なので、計測結果は本番挙動に忠実。
 * - `Math.random` をシード付き PRNG に一時差し替えることで、reducer 内部の
 *   進化ロール・仲間リクルート等まで含めて完全に決定論化する。
 * - 戦闘ループは `use-battle.ts` と同じイベント判定（enemy_killed → AFTER_BATTLE
 *   等）を同期的に再現する。setInterval は演出ペーシングに過ぎずロジックは同期。
 */
import type {
  GameState, RunState, Evolution, TotemId, KeystoneId, EventChoice,
} from '../types';
import { initialState } from '../hooks/use-game-state';
import { gameReducer } from '../hooks/reducers/game-reducer';
import { tick, simEvo, pickBiomeAuto, aliveAllies } from '../game-logic';
import { TREE } from '../constants';

/** 全ツリーノードを解放した「フル強化」状態（メタ進行の上限ケース） */
export const FULL_TREE: Readonly<Record<string, number>> =
  Object.freeze(Object.fromEntries(TREE.map(n => [n.id, 1])));

/** 進化選択ポリシー */
export type EvoStrategy =
  | 'greedy-atk' // 実効 ATK(atk×aM×dm) が最も伸びる進化を選ぶ。simEvo が実効値を返すため、血の契約(aM×2)等の乗算系も評価され、最適バースト相当の選択になる
  | 'random' // 一様ランダム（無方針プレイヤー）
  | 'balanced' // 文明レベルが最も低い系統を伸ばす（覚醒・調和狙い）
  | 'rit-burst'; // 儀式(rit)型進化を優先して cR を上げ rit 大覚醒(fe='rit')を狙う実プレイ最強の低HPバースト建造。狂血キーストーン優先(keystone選択)＋HP犠牲rit進化で低HP×2バーストを再現

/** 1 ランのシミュレーション設定 */
export interface SimConfig {
  /** 難易度インデックス（DIFFS の添字。0=原始） */
  readonly di: number;
  /** 始祖トーテム ID */
  readonly totemId: TotemId;
  /** 進化選択ポリシー */
  readonly evoStrategy: EvoStrategy;
  /** 決定論シード */
  readonly seed: number;
  /**
   * メタ進行（ツリー）解放状況。未指定なら FRESH_SAVE（無強化）。
   * 例: `{ atk1: 1, hp1: 1 }`。全解放は FULL_TREE を使う。
   */
  readonly tree?: Record<string, number>;
  /** 周回数（神話世界クリアで加算される敵スケール。未指定なら 0） */
  readonly loopCount?: number;
}

/** 戦闘開始時点のパワースナップショット（パワーカーブ計測用） */
export interface PowerSnapshot {
  /** 踏破済みバイオーム数（戦闘開始時点） */
  readonly bc: number;
  /** 通算戦闘番号（1 始まり） */
  readonly battleIndex: number;
  /** 素の ATK */
  readonly atk: number;
  /** 実効 ATK（ATK × 攻撃倍率） */
  readonly effAtk: number;
  /** DEF */
  readonly def: number;
  /** 最大 HP */
  readonly mhp: number;
  /** 進化回数 */
  readonly evoCount: number;
  /** 生存仲間数 */
  readonly allies: number;
}

/** 1 ランのシミュレーション結果 */
export interface SimResult {
  readonly totemId: TotemId;
  readonly evoStrategy: EvoStrategy;
  readonly seed: number;
  readonly result: 'victory' | 'defeat';
  /** 到達バイオーム数（0〜3。3 で最終ボス到達） */
  readonly biomesCleared: number;
  /** 戦闘数 */
  readonly battles: number;
  /** 総 tick 数 */
  readonly ticks: number;
  /** 最終 ATK（実効） */
  readonly finalEffAtk: number;
  /** 最終最大 HP */
  readonly finalMhp: number;
  /** 進化回数 */
  readonly evoCount: number;
  /** 取得キーストーン */
  readonly keystones: readonly KeystoneId[];
  /** 解放した覚醒 ID */
  readonly awakenings: readonly string[];
  /** パワーカーブ（各戦闘開始時点） */
  readonly powerCurve: readonly PowerSnapshot[];
}

/** Mulberry32: 高速・高品質なシード付き PRNG */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 実効 ATK（攻撃倍率込み） */
function effAtk(r: RunState): number {
  return Math.floor(r.atk * r.aM);
}

/** 進化候補から戦略に沿って 1 つ選ぶ */
function pickEvo(run: RunState, picks: readonly Evolution[], strategy: EvoStrategy): Evolution {
  if (strategy === 'random') {
    return picks[Math.floor(Math.random() * picks.length)];
  }
  if (strategy === 'greedy-atk') {
    return picks.reduce((best, ev) =>
      simEvo(run, ev).atk > simEvo(run, best).atk ? ev : best);
  }
  if (strategy === 'rit-burst') {
    // 儀式(rit)型を優先して cR を伸ばし rit 大覚醒(fe='rit')を発火させる。
    // rit 型同士・rit 型が無い場合は実効ATK最大で選ぶ（狂血は keystone 選択側で優先取得済み）。
    const byEff = (a: Evolution, b: Evolution): Evolution => (simEvo(run, a).atk >= simEvo(run, b).atk ? a : b);
    const rit = picks.filter(ev => ev.t === 'rit');
    if (rit.length) return rit.reduce(byEff);
    return picks.reduce(byEff);
  }
  // balanced: 取得後に最も底上げになる（＝現在レベルが低い系統の）進化を優先。
  // 候補の civ 系統が現状の最小レベル系統に一致するものを優先し、なければ先頭。
  const lv = { tech: run.cT, life: run.cL, rit: run.cR };
  const minLv = Math.min(lv.tech, lv.life, lv.rit);
  const balanced = picks.find(ev => {
    const key = ev.t === 'tech' ? lv.tech : ev.t === 'life' ? lv.life : lv.rit;
    return key === minLv;
  });
  return balanced ?? picks[0];
}

/** イベント選択（安全な選択肢を優先する平均的プレイヤー） */
function pickEventChoice(choices: readonly EventChoice[]): EventChoice {
  return choices.find(c => c.riskLevel === 'safe') ?? choices[0];
}

/** 1 戦闘（敵 1 体）を最後まで回し、AFTER_BATTLE 等の終端アクションまで適用する */
function runOneBattle(state: GameState, onTick: () => void): GameState {
  let s = state;
  let guard = 0;
  while (s.phase === 'battle' && s.run?.en && guard++ < 10000) {
    const { nextRun, events } = tick(s.run, s.finalMode);
    s = gameReducer(s, { type: 'BATTLE_TICK', nextRun });
    onTick();
    if (events.some(e => e.type === 'player_dead')) {
      return gameReducer(s, { type: 'GAME_OVER', won: false });
    }
    if (events.some(e => e.type === 'final_boss_killed')) {
      return gameReducer(s, { type: 'FINAL_BOSS_KILLED' });
    }
    if (events.some(e => e.type === 'enemy_killed')) {
      return gameReducer(s, { type: 'AFTER_BATTLE' });
    }
  }
  return s;
}

/**
 * 1 ランをシミュレートする。
 *
 * `Math.random` を一時差し替えるため副作用を持つが、必ず finally で復元する。
 */
export function simulateRun(config: SimConfig): SimResult {
  const originalRandom = Math.random;
  const originalEnv = process.env.NODE_ENV;
  Math.random = mulberry32(config.seed);
  // 実プレイヤーが遊ぶ production ビルドでは DbC コントラクト（gameReducer の
  // assertRunInvariant / tick の事後条件等）は無効。本番相当の挙動を計測するため
  // production 扱いにする。dev コントラクトの HP>=0 事後条件は数千ラン規模では
  // 終盤の高 ATK 敵により稀に踏むため、計測ノイズになる。
  process.env.NODE_ENV = 'production';
  try {
    return drive(config);
  } finally {
    Math.random = originalRandom;
    process.env.NODE_ENV = originalEnv;
  }
}

/** reducer 駆動の本体（Math.random は呼び出し元で差し替え済み前提） */
function drive(config: SimConfig): SimResult {
  const { di, totemId, evoStrategy } = config;
  const base = initialState();
  const start = config.tree
    ? { ...base, save: { ...base.save, tree: { ...config.tree } } }
    : base;
  let s = gameReducer(start, {
    type: 'START_RUN', di, loopOverride: config.loopCount ?? 0, totemId,
  });

  const powerCurve: PowerSnapshot[] = [];
  let battles = 0;
  let ticks = 0;

  // 戦闘開始の検出用: phase が battle に遷移した最初のフレームで snapshot を取る
  let inBattle = false;

  let steps = 0;
  while (steps++ < 20000) {
    const run = s.run;
    switch (s.phase) {
      case 'evo': {
        inBattle = false;
        if (!run || s.evoPicks.length === 0) {
          // 候補ゼロは想定外だが安全にスキップ
          s = gameReducer(s, { type: 'SKIP_EVO' });
          break;
        }
        const evo = pickEvo(run, s.evoPicks, evoStrategy);
        s = gameReducer(s, { type: 'SELECT_EVO', evo });
        break;
      }
      case 'awakening':
        inBattle = false;
        s = gameReducer(s, { type: 'PROCEED_TO_BATTLE' });
        break;
      case 'battle': {
        if (run && !inBattle) {
          // この戦闘の開始スナップショット
          battles++;
          powerCurve.push({
            bc: run.bc,
            battleIndex: battles,
            atk: run.atk,
            effAtk: effAtk(run),
            def: run.def,
            mhp: run.mhp,
            evoCount: run.evs.length,
            allies: aliveAllies(run.al).length,
          });
          inBattle = true;
        }
        s = runOneBattle(s, () => { ticks++; });
        inBattle = false;
        break;
      }
      case 'keystone': {
        inBattle = false;
        const picks = s.keystonePicks ?? [];
        // 実プレイの最適選択を近似: ATK バースト系を優先（狂血>原始の咆哮>狩人の蓄積）、無ければ先頭。
        const PRIORITY = ['madblood', 'primal_roar', 'hunter_stack'];
        const best = PRIORITY.map(id => picks.find(p => p.id === id)).find(Boolean) ?? picks[0];
        s = gameReducer(s, { type: 'SELECT_KEYSTONE', id: best.id });
        break;
      }

      case 'biome': {
        inBattle = false;
        if (!run) return finish(s, config, powerCurve, battles, ticks);
        const { options } = pickBiomeAuto(run);
        const biome = options[Math.floor(Math.random() * options.length)];
        s = gameReducer(s, { type: 'PICK_BIOME', biome });
        break;
      }
      case 'event': {
        inBattle = false;
        if (!s.currentEvent) return finish(s, config, powerCurve, battles, ticks);
        const choice = pickEventChoice(s.currentEvent.choices);
        s = gameReducer(s, { type: 'CHOOSE_EVENT', choice });
        break;
      }
      case 'ally_revive':
        inBattle = false;
        s = gameReducer(s, { type: 'SKIP_REVIVE' });
        break;
      case 'prefinal':
        inBattle = false;
        s = gameReducer(s, { type: 'GO_FINAL_BOSS' });
        break;
      case 'endless_checkpoint':
        inBattle = false;
        s = gameReducer(s, { type: 'ENDLESS_RETIRE' });
        break;
      case 'over':
        return finish(s, config, powerCurve, battles, ticks);
      default:
        // title 等の想定外フェーズ
        return finish(s, config, powerCurve, battles, ticks);
    }
  }
  // ステップ上限到達（無限ループ防止網）
  return finish(s, config, powerCurve, battles, ticks);
}

/** 終端 GameState から SimResult を組み立てる */
function finish(
  s: GameState,
  config: SimConfig,
  powerCurve: PowerSnapshot[],
  battles: number,
  ticks: number,
): SimResult {
  const run = s.run;
  const result: SimResult['result'] = s.gameResult === true ? 'victory' : 'defeat';
  return {
    totemId: config.totemId,
    evoStrategy: config.evoStrategy,
    seed: config.seed,
    result,
    biomesCleared: run?.bc ?? 0,
    battles,
    ticks,
    finalEffAtk: run ? effAtk(run) : 0,
    finalMhp: run?.mhp ?? 0,
    evoCount: run?.evs.length ?? 0,
    keystones: run?.keystones ?? [],
    awakenings: run?.awoken.map(a => a.id) ?? [],
    powerCurve,
  };
}

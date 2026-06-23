/**
 * バランスガードレール（手動実行）。
 *
 *   RUN_BALANCE_SIM=1 npx jest balance-guardrail --no-coverage
 *   RUN_BALANCE_SIM=1 SIM_SEEDS=30 npx jest balance-guardrail --no-coverage   // 調整用の軽量実行
 *
 * 面白さ検証の設計目標（(a) メタ進行二値支配の是正 / (b) パワーカーブ終盤交差）を
 * 本番 reducer 駆動シミュレータで定量検証し、目標バンドをハードアサーションで強制する。
 * 重いため CI ではスキップ（health check は run-simulator.test.ts）。
 */
import { simulateRun, FULL_TREE, type SimResult } from './run-simulator';
import { TOTEMS } from '../constants';
import type { TotemId } from '../types';

const RUN = process.env.RUN_BALANCE_SIM === '1';
const d = RUN ? describe : describe.skip;

const TOTEM_IDS: readonly TotemId[] = TOTEMS.map(t => t.id);
const SEEDS = Number(process.env.SIM_SEEDS ?? 60);

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** ある条件で SEEDS 回シミュレートする */
function batch(opts: { di: number; totemId: TotemId; tree?: Record<string, number> }): SimResult[] {
  return Array.from({ length: SEEDS }, (_, i) =>
    simulateRun({ ...opts, evoStrategy: 'greedy-atk', seed: i * 7919 + 13 }));
}

const winRate = (rs: SimResult[]): number => rs.filter(r => r.result === 'victory').length / rs.length;

/** トーテム平均勝率（greedy-atk） */
function totemAvgWinRate(di: number, tree?: Record<string, number>): number {
  return mean(TOTEM_IDS.map(t => winRate(batch({ di, totemId: t, tree }))));
}

/** あるトーテムの bc 開始時 実効ATK 平均（フル強化・di0） */
function curveAt(totemId: TotemId, bc: number): number {
  const rs = batch({ di: 0, totemId, tree: FULL_TREE });
  return mean(rs.flatMap(r => {
    const s = r.powerCurve.find(p => p.bc === bc);
    return s ? [s.effAtk] : [];
  }));
}

// 【2026-06-23 プレイテストアンカーへ転換】
// sim(greedy-atk) は「並プレイヤー」の下限であり、rit フォーカス×3＋狂血の低HPバーストを
// 狙うエキスパートの楽勝は再現しない（測定で無強化 di1=33% のまま）。よって本ガードレールは
// 「苦戦の体感」ではなく健全性のみを守る: 投資が報われ・必勝でなく・ツリーが効き・断崖がないこと。
// 苦戦/狂気リスク化の体感はユーザーのプレイテストで確定する。
d('PRIMAL PATH バランスガードレール（下限サニティ）', () => {
  jest.setTimeout(900_000);

  it('(a) 投資が報われる: フル強化 di1 トーテム平均勝率が 0.55 超', () => {
    expect(totemAvgWinRate(1, FULL_TREE)).toBeGreaterThan(0.55);
  });

  it('(a) 必勝でなく到達不能でもない: フル強化 di3 トーテム平均勝率が [0.30, 0.85]', () => {
    const wr = totemAvgWinRate(3, FULL_TREE);
    expect(wr).toBeGreaterThanOrEqual(0.30);
    expect(wr).toBeLessThanOrEqual(0.85);
  });

  it('(a) メタ進行が効く: 無強化 di1 がフル強化 di1 より 0.30 以上低い', () => {
    const full = totemAvgWinRate(1, FULL_TREE);
    const none = totemAvgWinRate(1, undefined);
    expect(full - none).toBeGreaterThanOrEqual(0.30);
  });

  it('(a) 断崖なし: フル強化の隣接難易度(di1→di2→di3)の勝率低下が各 0.40 以下', () => {
    const w1 = totemAvgWinRate(1, FULL_TREE);
    const w2 = totemAvgWinRate(2, FULL_TREE);
    const w3 = totemAvgWinRate(3, FULL_TREE);
    expect(w1 - w2).toBeLessThanOrEqual(0.40);
    expect(w2 - w3).toBeLessThanOrEqual(0.40);
  });

  it('(b) 終盤交差: bc0/bc1 は blood>ember、bc2 は ember>blood', () => {
    const bloodBc0 = curveAt('blood', 0);
    const emberBc0 = curveAt('ember', 0);
    const bloodBc1 = curveAt('blood', 1);
    const emberBc1 = curveAt('ember', 1);
    const bloodBc2 = curveAt('blood', 2);
    const emberBc2 = curveAt('ember', 2);
    expect(bloodBc0).toBeGreaterThan(emberBc0);
    expect(bloodBc1).toBeGreaterThan(emberBc1);
    expect(emberBc2).toBeGreaterThan(bloodBc2);
  });
});

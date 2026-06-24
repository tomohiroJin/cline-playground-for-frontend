/**
 * バランス・多様性 定量レポート（手動実行）。
 *
 *   RUN_BALANCE_SIM=1 npx jest balance-report --no-coverage
 *   RUN_BALANCE_SIM=1 SIM_SEEDS=200 SIM_DIFFS=0,1,2,3 npx jest balance-report --no-coverage
 *
 * 「毎ランの手触りが違う／成立はするが必勝ではない／即効と晩成のパワーカーブが
 * 中盤で交差する」という当初の設計目標を、本番 reducer を駆動して定量評価する。
 * メタ進行（ツリー）の有無で体験が大きく変わるため、無強化(下限)とフル強化(上限)を
 * 対比する。CI では重いためスキップされる（health check は run-simulator.test.ts）。
 */
import {
  simulateRun, FULL_TREE, type SimResult, type EvoStrategy, type SimConfig,
} from './run-simulator';
import { TOTEMS, TREE } from '../constants';
import type { TotemId } from '../types';

/** Tier maxTier 以下のツリーノードを全解放した部分メタ進行状態 */
const treeUpToTier = (maxTier: number): Record<string, number> =>
  Object.fromEntries(TREE.filter(n => n.t <= maxTier).map(n => [n.id, 1]));

const RUN = process.env.RUN_BALANCE_SIM === '1';
const d = RUN ? describe : describe.skip;

const TOTEM_IDS = TOTEMS.map(t => t.id);
const STRATEGIES: readonly EvoStrategy[] = ['greedy-atk', 'balanced', 'random'];
const SEEDS = Number(process.env.SIM_SEEDS ?? 150);
const DIFFS_TO_RUN = (process.env.SIM_DIFFS ?? '0,1,2,3').split(',').map(Number);

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (x: number): string => `${(x * 100).toFixed(0)}%`;
const f1 = (x: number): string => x.toFixed(1);
const totemName = (id: TotemId): string => TOTEMS.find(t => t.id === id)?.nm ?? id;
const log = (...a: unknown[]): void => console.log(...a);
const table = (rows: unknown[]): void => console.table(rows);

/** ある条件で SEEDS 回シミュレートする */
function batch(opts: Omit<SimConfig, 'seed'>): SimResult[] {
  return Array.from({ length: SEEDS }, (_, i) =>
    simulateRun({ ...opts, seed: i * 7919 + 13 }));
}

const winRate = (rs: SimResult[]): number => rs.filter(r => r.result === 'victory').length / rs.length;
const curveAt = (rs: SimResult[], bc: number): number =>
  mean(rs.flatMap(r => { const s = r.powerCurve.find(p => p.bc === bc); return s ? [s.effAtk] : []; }));

d('PRIMAL PATH バランス・多様性レポート', () => {
  jest.setTimeout(900_000);

  it('① 無強化 vs フル強化 の勝率（greedy-atk, トーテム平均）', () => {
    log('\n========== ① メタ進行が体験に与える影響（greedy-atk）==========');
    const rows = DIFFS_TO_RUN.map(di => {
      const none = mean(TOTEM_IDS.map(t => winRate(batch({ di, totemId: t, evoStrategy: 'greedy-atk' }))));
      const full = mean(TOTEM_IDS.map(t => winRate(batch({ di, totemId: t, evoStrategy: 'greedy-atk', tree: FULL_TREE }))));
      return { 難易度: di, 無強化勝率: pct(none), フル強化勝率: pct(full) };
    });
    table(rows);
    expect(rows.length).toBe(DIFFS_TO_RUN.length);
  });

  for (const di of DIFFS_TO_RUN) {
    it(`② [フル強化] 難易度 ${di} トーテム×戦略 サマリ`, () => {
      log(`\n========== ② フル強化 di=${di}（seeds=${SEEDS}）==========`);
      const rows: Record<string, string | number>[] = [];
      for (const totemId of TOTEM_IDS) {
        for (const strat of STRATEGIES) {
          const rs = batch({ di, totemId, evoStrategy: strat, tree: FULL_TREE });
          rows.push({
            トーテム: totemName(totemId),
            戦略: strat,
            勝率: pct(winRate(rs)),
            平均到達bc: f1(mean(rs.map(r => r.biomesCleared))),
            平均進化: f1(mean(rs.map(r => r.evoCount))),
            最終ATK: Math.round(mean(rs.map(r => r.finalEffAtk))),
          });
        }
      }
      table(rows);
      expect(rows.length).toBe(TOTEM_IDS.length * STRATEGIES.length);
    });
  }

  it('③ [フル強化] パワーカーブ交差（即効 blood vs 晩成 ember/spirit）', () => {
    // 到達率が高い難易度で測る（交差を観測するには終盤まで到達する必要がある）
    const di = Math.min(...DIFFS_TO_RUN);
    log(`\n========== ③ パワーカーブ交差 di=${di}（フル強化, greedy-atk, bc 開始時 実効ATK 平均）==========`);
    const rows: Record<string, string | number>[] = [];
    for (const totemId of TOTEM_IDS) {
      const rs = batch({ di, totemId, evoStrategy: 'greedy-atk', tree: FULL_TREE });
      rows.push({
        トーテム: totemName(totemId),
        'bc0(序盤)': Math.round(curveAt(rs, 0)),
        'bc1(中盤)': Math.round(curveAt(rs, 1)),
        'bc2(終盤)': Math.round(curveAt(rs, 2)),
      });
    }
    table(rows);
    expect(rows.length).toBe(TOTEM_IDS.length);
  });

  it('④ 多様性: フル強化での最終ATKにトーテム差が残る', () => {
    const di = DIFFS_TO_RUN.includes(2) ? 2 : Math.max(...DIFFS_TO_RUN);
    log(`\n========== ④ トーテム多様性 di=${di}（フル強化, greedy-atk）==========`);
    const profiles = TOTEM_IDS.map(totemId => {
      const rs = batch({ di, totemId, evoStrategy: 'greedy-atk', tree: FULL_TREE });
      return { totemId, win: winRate(rs), evo: mean(rs.map(r => r.evoCount)), atk: mean(rs.map(r => r.finalEffAtk)) };
    });
    table(profiles.map(p => ({
      トーテム: totemName(p.totemId), 勝率: pct(p.win), 平均進化: f1(p.evo), 平均ATK: Math.round(p.atk),
    })));
    // フル強化では勝率は飽和(全100%)しがちだが、最終ATKにはトーテム個性が残るはず
    const atkSpread = Math.max(...profiles.map(p => p.atk)) - Math.min(...profiles.map(p => p.atk));
    expect(atkSpread).toBeGreaterThan(0);
  });

  it('⑤ 際どい帯の探索: 部分メタ進行での勝率曲線（トーテム平均, greedy-atk）', () => {
    const tiers: { label: string; tree?: Record<string, number> }[] = [
      { label: '無強化', tree: undefined },
      { label: 'T1', tree: treeUpToTier(1) },
      { label: 'T1-2', tree: treeUpToTier(2) },
      { label: 'T1-3', tree: treeUpToTier(3) },
      { label: 'T1-4', tree: treeUpToTier(4) },
      { label: 'フル', tree: FULL_TREE },
    ];
    const targets = DIFFS_TO_RUN.filter(di => di >= 1);
    log('\n========== ⑤ メタ進行段階別の勝率（際どい帯の探索, greedy-atk）==========');
    const rows = tiers.map(t => {
      const row: Record<string, string> = { 解放: t.label };
      for (const di of targets) {
        const wr = mean(TOTEM_IDS.map(totemId =>
          winRate(batch({ di, totemId, evoStrategy: 'greedy-atk', tree: t.tree }))));
        row[`di${di}`] = pct(wr);
      }
      return row;
    });
    table(rows);
    expect(rows.length).toBe(tiers.length);
  });
});

/**
 * エキスパート・バランスレポート（手動実行）。
 *
 *   RUN_BALANCE_SIM=1 npx jest expert-balance --no-coverage --silent=false
 *   RUN_BALANCE_SIM=1 SIM_SEEDS=80 npx jest expert-balance --no-coverage --silent=false
 *
 * greedy-atk は「並プレイヤー」の下限しか測れず、実プレイヤーが狙う rit フォーカス×2＋狂血の
 * 低HPバースト（エキスパート建造）を再現しない。本レポートは `'rit-burst'` 戦略で
 * エキスパート相当の建造を本番 reducer 駆動で再現し、メタ進行（ツリー）段階別に
 * 「どこまで到達・クリアできるか」を定量化する。CI では重いためスキップ。
 */
import { simulateRun, FULL_TREE, type SimResult } from './run-simulator';
import { TOTEMS, TREE } from '../constants';
import type { TotemId } from '../types';

const RUN = process.env.RUN_BALANCE_SIM === '1';
const d = RUN ? describe : describe.skip;

const TOTEM_IDS: readonly TotemId[] = TOTEMS.map(t => t.id);
const SEEDS = Number(process.env.SIM_SEEDS ?? 80);
const DIFFS_TO_RUN = (process.env.SIM_DIFFS ?? '0,1,2,3').split(',').map(Number);

const treeUpToTier = (maxTier: number): Record<string, number> =>
  Object.fromEntries(TREE.filter(n => n.t <= maxTier).map(n => [n.id, 1]));

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (x: number): string => `${(x * 100).toFixed(0)}%`;
const f1 = (x: number): string => x.toFixed(1);

function batch(opts: { di: number; totemId: TotemId; tree?: Record<string, number> }): SimResult[] {
  return Array.from({ length: SEEDS }, (_, i) =>
    simulateRun({ ...opts, evoStrategy: 'rit-burst', seed: i * 7919 + 13 }));
}

const winRate = (rs: SimResult[]): number => rs.filter(r => r.result === 'victory').length / rs.length;
const avgBiomes = (rs: SimResult[]): number => mean(rs.map(r => r.biomesCleared));

/** あるツリー状態・難易度のトーテム平均勝率と平均到達バイオーム（batch は1トーテム1回） */
function profile(di: number, tree?: Record<string, number>): { win: number; bc: number } {
  const perTotem = TOTEM_IDS.map(t => {
    const rs = batch({ di, totemId: t, tree });
    return { win: winRate(rs), bc: avgBiomes(rs) };
  });
  return { win: mean(perTotem.map(p => p.win)), bc: mean(perTotem.map(p => p.bc)) };
}

d('PRIMAL PATH エキスパート・バランス（rit-burst）', () => {
  jest.setTimeout(1_800_000);

  it('ツリー段階 × 難易度の勝率（rit-burst, トーテム平均）', () => {
    const tiers: { label: string; tree?: Record<string, number> }[] = [
      { label: '無強化', tree: undefined },
      { label: 'T1', tree: treeUpToTier(1) },
      { label: 'T1-2', tree: treeUpToTier(2) },
      { label: 'T1-3', tree: treeUpToTier(3) },
      { label: 'T1-4', tree: treeUpToTier(4) },
      { label: 'フル', tree: FULL_TREE },
    ];
    const rows = tiers.map(t => {
      const row: Record<string, string> = { 解放: t.label };
      for (const di of DIFFS_TO_RUN) {
        const p = profile(di, t.tree);
        row[`di${di}勝率`] = pct(p.win);
      }
      return row;
    });
    console.log('\n========== エキスパート(rit-burst) ツリー段階別 勝率 ==========');
    console.table(rows);
    expect(rows.length).toBe(tiers.length);
  });

  it('到達バイオーム（無強化/フル, rit-burst, トーテム平均）', () => {
    const rows = DIFFS_TO_RUN.map(di => {
      const none = profile(di, undefined);
      const full = profile(di, FULL_TREE);
      return {
        難易度: di,
        無強化_勝率: pct(none.win),
        無強化_平均bc: f1(none.bc),
        フル_勝率: pct(full.win),
        フル_平均bc: f1(full.bc),
      };
    });
    console.log('\n========== エキスパート(rit-burst) 無強化 vs フル 到達度 ==========');
    console.table(rows);
    expect(rows.length).toBe(DIFFS_TO_RUN.length);
  });
});

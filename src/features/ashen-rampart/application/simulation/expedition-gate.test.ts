/**
 * 灰燼の城壁 - G1: 獲得の測定可能性ゲート（反復6 段階A の出口・設計書 §8.2）
 *
 * **初版のゲートは反転していた。** 「差が出れば合格」としていたが、
 * 獲得でデッキ枚数が変わると createDeck のシャッフルが全面的に変わるため、
 * **獲得が因果的に無力でも必ず差が出た。**
 *
 * 段階A では startStage が「基底12枚だけをシャッフルし、獲得札を山札の
 * 固定位置へ挿す」ようになっているので、両腕は同じ初期手札・同じ基底の並びで走る
 * （start-expedition.test.ts の4件がその前提を検査している）。
 *
 * したがってここで観測される差は**獲得そのものの効果**である。
 *
 * **このファイルは判断を下さない。** 数値を測って出力するだけであり、
 * 通過・不通過の判断とその設計書への追記は人間（コントローラ）が行う。
 *
 * **この測定は撤回済みである（設計書 §8.2.4）。**
 *
 * 事前登録した反実仮想を実行しておらず、4戦略の勝率を比べただけだった。
 * n=40 の検出力は 8.1% で、差があるともないとも言えなかった。
 * やり直しは `expedition-gate-redo.manual.test.ts` で行う。
 *
 * 記録として残すが CI には常駐させない（31秒かかる。§8.3 の較正予算は60秒）。
 * 実行するには: ASHEN_RAMPART_GATE_LEGACY=1 npx jest expedition-gate
 */
import { greedyStrategy } from '../../domain/combat/run-simulation';
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import {
  simulateExpedition, noAcquire, cheapestAcquire, demandAwareAcquire, randomAcquireOf,
  type AcquireStrategy,
} from './expedition-simulation';
import { createSeededRandom } from '../../infrastructure/random/seeded-random';
import type { SeededRandomFactory } from '../ports/random-port';

const isLegacyEnabled = process.env.ASHEN_RAMPART_GATE_LEGACY === '1';
const randomFactory: SeededRandomFactory = createSeededRandom;

// 4腕 × 20シード × 2プリセット × 3ステージ ≒ 480遠征を回すため、既定の5秒では足りない
jest.setTimeout(120_000);

const SEEDS = 20;
const seeds = Array.from({ length: SEEDS }, (_, i) => i + 1);

const measure = (label: string, acquire: AcquireStrategy) => {
  const results = seeds.flatMap((seed) =>
    Object.values(PRESET_DECKS).map((preset) =>
      simulateExpedition({ initialDeck: preset.cards, seed, strategy: greedyStrategy, acquire, randomFactory })
    )
  );
  const total = results.length;
  return {
    label,
    total,
    cleared: results.filter((r) => r.outcome === 'cleared').length,
    reachedTier3: results.filter((r) => r.reachedTier3).length,
    stagesCleared: results.reduce((s, r) => s + r.stagesCleared, 0),
    acquiredTotal: results.reduce((s, r) => s + r.acquired.length, 0),
  };
};

(isLegacyEnabled ? describe : describe.skip)('G1: 獲得の測定可能性ゲート', () => {
  it('4つの腕を測って表に出す', () => {
    let seedCounter = 0;
    const rng = () => {
      seedCounter = (seedCounter * 1103515245 + 12345) % 2147483648;
      return seedCounter / 2147483648;
    };
    const arms = [
      measure('noAcquire', noAcquire),
      measure('randomAcquire', randomAcquireOf(rng)),
      measure('cheapestAcquire', cheapestAcquire),
      measure('demandAwareAcquire', demandAwareAcquire),
    ];
    console.table(arms);

    // 構造の検査だけを assert する。**踏破率の閾値は assert しない**——
    // まだ測っていない値を閾値にするのは反復5 で外した誤りである（設計書 §8.1）。
    arms.forEach((arm) => {
      expect(arm.total).toBe(SEEDS * Object.keys(PRESET_DECKS).length);
    });
    expect(arms[0]?.acquiredTotal).toBe(0); // noAcquire は1枚も取らない
    expect(arms[3]?.acquiredTotal).toBeGreaterThan(0); // demandAware は取る
  });

  it('demandAware と random が実際に違う札を選んでいる（差が生まれる余地があるか）', () => {
    // **反復5 の教訓の直接の適用。** deployThenIdleStrategy は
    // 20シード中11シードで両戦略のランが完全に一致していた。
    // 「2つの戦略が実際に違う行動を取る余地があるか」を先に実測する。
    let seedCounter = 0;
    const rng = () => {
      seedCounter = (seedCounter * 1103515245 + 12345) % 2147483648;
      return seedCounter / 2147483648;
    };
    const randomArm = randomAcquireOf(rng);
    let differing = 0;
    let comparable = 0;
    seeds.forEach((seed) => {
      const base = { initialDeck: PRESET_DECKS.swift.cards, seed, strategy: greedyStrategy, randomFactory };
      const a = simulateExpedition({ ...base, acquire: demandAwareAcquire });
      const b = simulateExpedition({ ...base, acquire: randomArm });
      if (a.acquired.length === 0 && b.acquired.length === 0) return;
      comparable++;
      if (a.acquired.join('|') !== b.acquired.join('|')) differing++;
    });
    console.log(`獲得内容が異なった遠征: ${differing}/${comparable}`);
    expect(comparable).toBeGreaterThan(0);
    // レビュー指摘 I3: このテスト名は「demandAware と random が実際に違う札を
    // 選んでいる」ことを主張しているが、`comparable` は「両腕とも何か獲得した
    // 遠征の数」でしかなく、両腕が毎回同じ札を選んでも 0 にはならない。
    // 判断の入力になるのは `differing`（実際に選んだ札が食い違った件数）の方。
    // 同じ構図の expedition-replay.test.ts:75 は既にこの assertion を持つ。
    expect(differing).toBeGreaterThan(0);
  });
});

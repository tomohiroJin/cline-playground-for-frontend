/**
 * 軸ノックアウトの健全性検査（設計書 §8.2.15(f)・`B0-P1` / `B0-P3`）
 *
 * **環境変数ゲートの向こうに置かない。** 重い監査の中にしか無い健全性検査は、
 * 壊れても誰も気づかない。撤回された §8.2.14 は、比較集合が主張より狭かったために
 * 「壊れているのに緑」になっていた（実測: 登録した5項目の不一致 0/20 に対し、
 * 罠状態の不一致は最大 15/20）。
 */
import { createDeck, shuffle } from '../../domain/cards/deck';
import { baseIdOf } from '../../domain/cards/knockout-cards';
import { createCombatState } from '../../domain/combat/combat-state';
import { getEnemySpec } from '../../domain/combat/enemies';
import { greedyStrategy, simulateRunCollecting } from '../../domain/combat/run-simulation';
import { AUDIT_FULL_DECK, knockoutDeck } from '../../domain/expedition/axis-knockout';
import { PROVISIONAL_STAGES } from '../../domain/expedition/stage-pool';
import { createSeededRandom } from '../../infrastructure/random/seeded-random';
import type { StageDefinition } from '../../domain/expedition/stage-definition';

/** 陰性対照のシード帯（設計書 §8.2.15(f)） */
const SEEDS = Array.from({ length: 20 }, (_, i) => 1251 + i);

/** そのステージに飛行する敵が1体でも出るか */
const hasFlyingEnemy = (stage: StageDefinition): boolean =>
  stage.waves.some((w) => w.entries.some((e) => getEnemySpec(e.enemyId).flying));

const NO_FLYING_STAGES = PROVISIONAL_STAGES.filter((s) => !hasFlyingEnemy(s));

/** カードIDの接頭辞を剥がして比べる（腕どうしは ID だけが構造上必ず違う） */
const normalize = (value: unknown): string =>
  JSON.stringify(value, (_key, v: unknown) => (typeof v === 'string' ? baseIdOf(v) : v));

const runOn = (stage: StageDefinition, cards: readonly string[], seed: number) => {
  const random = createSeededRandom(seed);
  const deck = createDeck(cards, () => random.random());
  return simulateRunCollecting(createCombatState(deck, stage.waves), greedyStrategy, stage.map);
};

describe('B0-P1 陰性対照: 飛行が1体もいないステージで anti-air をノックアウトしてもランは変わらない', () => {
  jest.setTimeout(60000);

  it('飛行がいないステージが4つある（検査の前提）', () => {
    expect(NO_FLYING_STAGES.map((s) => s.id)).toEqual([
      'prov-t1-a',
      'prov-t1-b',
      'prov-t2-a',
      'prov-t3-b',
    ]);
  });

  it.each(NO_FLYING_STAGES.map((s) => [s.id, s] as const))('%s', (_id, stage) => {
    const koCards = knockoutDeck(AUDIT_FULL_DECK, 'anti-air');
    SEEDS.forEach((seed) => {
      const base = runOn(stage, AUDIT_FULL_DECK, seed);
      const ko = runOn(stage, koCards, seed);

      expect(ko.outcome).toBe(base.outcome);
      expect(ko.ticks).toBe(base.ticks);
      expect(ko.lifeLeft).toBe(base.lifeLeft);
      expect(ko.cardsPlayed).toBe(base.cardsPlayed);
      // **状態の全体とイベント列まで比べる。** スカラーだけでは、
      // 罠の使用回数の差（damage 0 なので HP に出ない）を素通りさせる
      expect(normalize(ko.finalState)).toBe(normalize(base.finalState));
      expect(normalize(ko.eventLog)).toBe(normalize(base.eventLog));
    });
  });
});

describe('B0-P3 シャッフルの位置対応', () => {
  it('同じシードなら、差し替えたデッキも同じ置換になる', () => {
    SEEDS.forEach((seed) => {
      const a = createSeededRandom(seed);
      const b = createSeededRandom(seed);
      const baseOrder = shuffle(AUDIT_FULL_DECK, () => a.random());
      const koOrder = shuffle(knockoutDeck(AUDIT_FULL_DECK, 'mass-answer'), () => b.random());
      expect(koOrder.map(baseIdOf)).toEqual(baseOrder);
    });
  });
});

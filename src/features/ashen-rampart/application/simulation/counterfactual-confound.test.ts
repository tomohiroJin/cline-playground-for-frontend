/**
 * 灰燼の城壁 - 反実仮想の交絡検査（台本を「新敵の入らない版」に固定・修正ラウンド1）
 *
 * `counterfactual.test.ts` の「再生で提示が増える組は交絡として除外される（isClean=false）」は
 * `isClean` の `noExtraOffers` 節を守る唯一のテストで、heavy プリセットがステージ2 で敗北する
 * シード `[20, 21, 34, 39, 54]` に「最後の獲得を抜いた再生がステージ2 に勝ち、実ランに無かった
 * 2回目の提示が現れる」ことを前提にしていた。
 *
 * Task 8（`76259c29`）で暫定ステージの層2 に盾衛（`warden`）・癒し手（`mender`）が出るようになった
 * 結果、抜いた再生がステージ2 に勝てなくなり、上記5シードのうち4シード（20・21・39・54）で
 * 前提の場面そのものが消えた（コントローラの実測・2026-09-25。34 だけは元から前提のとおり）。
 * `runCounterfactual` という測定道具は壊れていない——台本の難度が変わって、道具が検査する
 * 場面が偶然に減っただけである。
 *
 * **このテストが守るのは測定道具（`isClean` の `noExtraOffers` 節）の規則であって、
 * 台本の難しさではない。** そのため、このファイルに限り `stage-pool` を
 * 「現行の暫定ステージから、反復7 段階2 で足した新敵（`warden` / `mender`）の出現だけを
 * 取り除いた台本」に差し替え、前提の場面を再現する。**台本を差し替えたのはこのファイルだけ**で、
 * `stage-pool.ts` 本体（他のテスト・アプリ本体が使う台本）は変えていない。
 */
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { greedyStrategy } from '../../domain/combat/run-simulation';
import { createSeededRandom } from '../../infrastructure/random/seeded-random';
import { demandAwareAcquire } from './expedition-simulation';
import { runCounterfactual } from './counterfactual';
import type { StageDefinition, StageTier } from '../../domain/expedition/stage-definition';
import type { WaveDefinition } from '../../domain/combat/waves';

/**
 * 差し替え対象の新敵ID（反復7 段階2 で足した2種）
 *
 * `jest.mock` はファイル先頭へホイストされ、この定数より先に（他 import の解決を通じて）
 * 走ってしまうため、factory の中では同じ値を持つ別のローカル定数を持つ（下記）。
 * ここは describe 側の検査でだけ使う。
 */
const NEW_ENEMY_IDS = ['warden', 'mender'] as const;

jest.mock('../../domain/expedition/stage-pool', () => {
  // jest.mock はファイル先頭へホイストされるため、外側の import・定数を直接参照できない
  // （ホイスト制約。上の NEW_ENEMY_IDS が初期化される前にこの factory が走る）。
  // 実物は requireActual で読み、新敵の出現だけを取り除いた台本を作って差し替える。
  const actual = jest.requireActual(
    '../../domain/expedition/stage-pool'
  ) as typeof import('../../domain/expedition/stage-pool');

  const newEnemyIdsInFactory: readonly string[] = ['warden', 'mender'];
  const stripNewEnemies = (waves: readonly WaveDefinition[]): WaveDefinition[] =>
    waves.map((wave) => ({
      ...wave,
      entries: wave.entries.filter((entry) => !newEnemyIdsInFactory.includes(entry.enemyId)),
    }));

  // ID・層・地図・demands・他の出現は一切変えない。波の中身（新敵の出現）だけを取り除く
  const strippedStages: StageDefinition[] = actual.PROVISIONAL_STAGES.map((stage) => ({
    ...stage,
    waves: stripNewEnemies(stage.waves),
  }));

  return {
    ...actual,
    PROVISIONAL_STAGES: strippedStages,
    // 実物の stagesOfTier は実物の PROVISIONAL_STAGES を参照するため、
    // 差し替えた配列を見る版に上書きしないと差し替えが効かない（drawStages はこちらを import する）
    stagesOfTier: (tier: StageTier): readonly StageDefinition[] =>
      strippedStages.filter((s) => s.tier === tier),
  };
});

// jest.mock の後に import しないと差し替えが効かない
import { stagesOfTier } from '../../domain/expedition/stage-pool';

const swift = PRESET_DECKS.swift?.cards ?? [];
const base = {
  initialDeck: swift,
  strategy: greedyStrategy,
  acquire: demandAwareAcquire,
  randomFactory: createSeededRandom,
};

describe('runCounterfactual（台本を新敵の入らない版に固定した交絡検査・修正ラウンド1）', () => {
  it('再生で提示が増える組は交絡として除外される（isClean=false）', () => {
    // **このテストは `isClean` の `noExtraOffers` 節を守る唯一のテストである。**
    // heavy プリセットはステージ2 で敗北することがあり（40シード中7回）、
    // そのとき最後の獲得はステージ1 後の提示になる。獲得を抜いた再生で
    // ステージ2 に勝ってしまうと、**実ランには存在しなかった2回目の提示**が
    // 現れる。この組を測定に使うと、比較していない選択の差が結果に混ざる。
    //
    // swift プリセットでは 40/40 でステージ1・2 を必勝するため、この経路は
    // 一度も通らない。**プリセットを変えるとこのテストは何も検査しなくなる。**
    const heavy = PRESET_DECKS.heavy?.cards ?? [];
    // 実測で要因が `!noExtraOffers` だと確認済みのシード（2026-09-06）
    const confoundedSeeds = [20, 21, 34, 39, 54];
    confoundedSeeds.forEach((seed) => {
      const pair = runCounterfactual({
        ...base, initialDeck: heavy, seed,
      });
      expect(pair.lastTaken).toBeDefined();
      // **発火要因を要因B（!noExtraOffers）に固定する。**
      // stagesCleared < 2 は「実ランがステージ2 までに敗北した」ことを意味し、
      // そのとき提示は1回しか起きていないので lastOfferIndex 0 は最後の提示であり、
      // `isLastOffer` は必ず true。したがって isClean=false の原因は
      // `noExtraOffers` 以外にありえない。
      //
      // **この2行が無いと、将来この組の発火要因が要因A（!isLastOffer）へ移ったとき、**
      // **テストは緑のまま `noExtraOffers` 節が無防備に戻る**（レビュー指摘 R1）。
      expect(pair.lastOfferIndex).toBe(0);
      expect(pair.actual.stagesCleared).toBeLessThan(2);
      expect(pair.isClean).toBe(false);
    });
  });
});

describe('台本の差し替えが効いていることの検査（このファイル限定・修正ラウンド1）', () => {
  const enemiesOf = (stage: StageDefinition): Set<string> =>
    new Set(stage.waves.flatMap((wave) => wave.entries.map((entry) => entry.enemyId)));

  it('mock 越しの stagesOfTier には新敵が1つも無く、差し替え前（requireActual）の層2 には少なくとも1つある', () => {
    // これが無いと、将来 mock が効かなくなっても（例: import のパスが変わる）
    // テストが別の理由で緑のまま残りうる
    ([1, 2, 3] as const).forEach((tier) => {
      stagesOfTier(tier).forEach((stage) => {
        NEW_ENEMY_IDS.forEach((id) => expect(enemiesOf(stage).has(id)).toBe(false));
      });
    });

    const actualStagePool = jest.requireActual(
      '../../domain/expedition/stage-pool'
    ) as typeof import('../../domain/expedition/stage-pool');
    const actualTier2HasNewEnemy = actualStagePool
      .stagesOfTier(2)
      .some((stage) => NEW_ENEMY_IDS.some((id) => enemiesOf(stage).has(id)));
    expect(actualTier2HasNewEnemy).toBe(true);
  });
});

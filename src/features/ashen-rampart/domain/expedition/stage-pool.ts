/**
 * 灰燼の城壁 - 暫定ステージプール（反復6 段階A）
 *
 * **⚠️ これは段階A の足場であり、段階B で6つの新マップに置き換える。**
 * 段階A の目的は遠征の骨格と G1（獲得の測定可能性ゲート）であって、
 * コンテンツではない。
 *
 * マップは凍結した PLAINS_MAP をそのまま参照する（設計書 §5.2・段階A0）。
 * 台本は段階0 の検算で実測に使ったものをそのまま置いた——
 * 全要求充足12枚デッキ・greedyStrategy・シード1〜20 での実測は
 * 決着 488 / 540 / 720 tick、山札の枯渇はいずれも 360 tick である。
 *
 * **要求軸（demands）は暫定であり、台本がその軸を本当に要求するかは
 * まだ検査していない**（それは段階D の不変条件 C1 の仕事）。
 * G1 が「差が出ない」と判定した場合、原因が機構なのか
 * 「暫定台本が軸を要求していないこと」なのかを先に切り分けること。
 *
 * **反復7 段階2 で新敵を足した**（設計書 §4.1）。層1 は変えない。層2 に届いた遠征は
 * 必ず盾衛か癒し手に、層3 では両方に出会う。数値は暫定で、段階3 で本番の6ステージに
 * 置き換え、段階4 で較正する。射程を持つ盾衛は北レーンにだけ出す（enemies.test.ts）。
 */
import { PLAINS_MAP } from '../board/stage-map';
import type { WaveDefinition } from '../combat/waves';
import type { StageDefinition, StageTier } from './stage-definition';

const tier1North: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 }] },
  {
    startTick: 260,
    entries: [
      { enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 },
      { enemyId: 'runner', count: 2, spawnIntervalTicks: 6, laneIndex: 1 },
    ],
  },
];

const tier1Swarm: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 }] },
  { startTick: 260, entries: [{ enemyId: 'swarm', count: 10, spawnIntervalTicks: 1, laneIndex: 1 }] },
];

const tier2Swarm: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 }] },
  {
    startTick: 200,
    entries: [
      { enemyId: 'runner', count: 3, spawnIntervalTicks: 6, laneIndex: 1 },
      // 反復7 段階2: 盾衛（装甲4）。射程を持つので北レーン
      { enemyId: 'warden', count: 2, spawnIntervalTicks: 20, laneIndex: 0 },
    ],
  },
  { startTick: 340, entries: [{ enemyId: 'swarm', count: 12, spawnIntervalTicks: 1, laneIndex: 1 }] },
];

const tier2Raven: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 }] },
  { startTick: 200, entries: [{ enemyId: 'runner', count: 3, spawnIntervalTicks: 6, laneIndex: 1 }] },
  {
    startTick: 340,
    entries: [
      { enemyId: 'raven', count: 8, spawnIntervalTicks: 18, laneIndex: 1 },
      // 反復7 段階2: 癒し手。鴉と同じ南レーンで、追い越していく鴉を回復する
      { enemyId: 'mender', count: 2, spawnIntervalTicks: 40, laneIndex: 1 },
    ],
  },
];

const tier3Raven: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 3, spawnIntervalTicks: 8, laneIndex: 0 }] },
  { startTick: 200, entries: [{ enemyId: 'swarm', count: 10, spawnIntervalTicks: 1, laneIndex: 1 }] },
  {
    startTick: 380,
    entries: [
      { enemyId: 'brute', count: 3, spawnIntervalTicks: 15, laneIndex: 0 },
      { enemyId: 'raven', count: 6, spawnIntervalTicks: 18, laneIndex: 1 },
      { enemyId: 'grunt', count: 3, spawnIntervalTicks: 8, laneIndex: 0 },
      // 反復7 段階2: 盾衛と癒し手を北レーンに出す（速度が違うので、癒し手が盾衛を回復するのは壁で止めたときに限られる）
      { enemyId: 'warden', count: 2, spawnIntervalTicks: 20, laneIndex: 0 },
      { enemyId: 'mender', count: 1, spawnIntervalTicks: 1, laneIndex: 0 },
    ],
  },
];

const tier3Swarm: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 3, spawnIntervalTicks: 8, laneIndex: 0 }] },
  { startTick: 200, entries: [{ enemyId: 'swarm', count: 14, spawnIntervalTicks: 1, laneIndex: 1 }] },
  {
    startTick: 380,
    entries: [
      { enemyId: 'brute', count: 4, spawnIntervalTicks: 15, laneIndex: 0 },
      { enemyId: 'swarm', count: 10, spawnIntervalTicks: 1, laneIndex: 1 },
      // 反復7 段階2: 盾衛と癒し手を北レーンに出す（速度が違うので、癒し手が盾衛を回復するのは壁で止めたときに限られる）
      { enemyId: 'warden', count: 2, spawnIntervalTicks: 20, laneIndex: 0 },
      { enemyId: 'mender', count: 1, spawnIntervalTicks: 1, laneIndex: 0 },
    ],
  },
];

export const PROVISIONAL_STAGES: readonly StageDefinition[] = [
  { id: 'prov-t1-a', name: '隘路（暫定）', tier: 1, map: PLAINS_MAP, waves: tier1North, demands: ['block'] },
  { id: 'prov-t1-b', name: '涸れ沢（暫定）', tier: 1, map: PLAINS_MAP, waves: tier1Swarm, demands: ['mass-answer'] },
  { id: 'prov-t2-a', name: '石切場（暫定）', tier: 2, map: PLAINS_MAP, waves: tier2Swarm, demands: ['block', 'mass-answer'] },
  { id: 'prov-t2-b', name: '鴉の谷（暫定）', tier: 2, map: PLAINS_MAP, waves: tier2Raven, demands: ['block', 'anti-air'] },
  { id: 'prov-t3-a', name: '城下（暫定）', tier: 3, map: PLAINS_MAP, waves: tier3Raven, demands: ['block', 'anti-air', 'heavy-hit'] },
  { id: 'prov-t3-b', name: '灰の丘（暫定）', tier: 3, map: PLAINS_MAP, waves: tier3Swarm, demands: ['block', 'mass-answer', 'heavy-hit'] },
];

/** 指定した層のステージ。抽選はここから選ぶ */
export const stagesOfTier = (tier: StageTier): readonly StageDefinition[] =>
  PROVISIONAL_STAGES.filter((s) => s.tier === tier);

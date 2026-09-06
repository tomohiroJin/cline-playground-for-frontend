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
  { startTick: 200, entries: [{ enemyId: 'runner', count: 3, spawnIntervalTicks: 6, laneIndex: 1 }] },
  { startTick: 340, entries: [{ enemyId: 'swarm', count: 12, spawnIntervalTicks: 1, laneIndex: 1 }] },
];

const tier2Raven: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 }] },
  { startTick: 200, entries: [{ enemyId: 'runner', count: 3, spawnIntervalTicks: 6, laneIndex: 1 }] },
  { startTick: 340, entries: [{ enemyId: 'raven', count: 8, spawnIntervalTicks: 18, laneIndex: 1 }] },
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

/**
 * ストーリーテキストデータ
 *
 * プロローグ + 5ステージ分のストーリーテキスト + エンディングバリエーション
 */
import { EpilogueText, RatingValue, StageNumber, StoryScene } from './types';

/** プロローグ（ストーリー #0） */
export const PROLOGUE_STORY: StoryScene = {
  id: 'story_0',
  title: '調査開始',
  lines: [
    '調査だけのはずだった。',
    '突如出現したこのダンジョンは、入るたびに内部構造が変化する。',
    '最深部の「核」に到達し、この異常構造体の封鎖を解除する。',
    'それが、今回の任務だ。',
    '――入口は、もう閉じている。',
  ],
  imageKey: 'ipne_story_prologue',
};

/** ステージ間ストーリー */
const STAGE_STORIES: Record<StageNumber, StoryScene> = {
  1: {
    id: 'story_1',
    title: '第一層突破',
    lines: [
      '最初の核の反応が消えた。',
      'だが、奥にはさらに深い層が続いている。',
      '構造が安定しかけた壁の向こうに、新たな通路が開いた。',
      '――まだ、先がある。',
    ],
    imageKey: 'ipne_story_1',
  },
  2: {
    id: 'story_2',
    title: '深部への接近',
    lines: [
      '二つ目の核も沈黙した。',
      '迷宮の反応が明らかに変わっている。',
      '壁の紋様が複雑になり、通路の構造が不規則になってきた。',
      'まるで、侵入者を拒んでいるかのように。',
    ],
    imageKey: 'ipne_story_2',
  },
  3: {
    id: 'story_3',
    title: '異変',
    lines: [
      '三つ目の核を停止させた。',
      '周囲の空気が変質している。壁が不自然に増殖している。',
      'ここから先は、迷宮そのものが防衛行動を取っている。',
      '慎重に、だが確実に進まなければならない。',
    ],
    imageKey: 'ipne_story_3',
  },
  4: {
    id: 'story_4',
    title: '最深部へ',
    lines: [
      '四つ目の核が崩壊し、最後の封鎖が解けた。',
      'この先に、迷宮の中枢がある。',
      '今まで以上に強い反応体の気配。',
      '――これが、最後の調査になる。',
    ],
    imageKey: 'ipne_story_4',
  },
  5: {
    id: 'story_5',
    title: '封鎖解除',
    lines: [
      '最後の核が停止し、迷宮全体が静まりかえった。',
      '入口方向の封鎖が完全に解除された。',
      '長い調査が、ようやく終わる。',
    ],
    imageKey: 'ipne_story_5',
  },
};

/** エンディングテキスト（評価別） */
const ENDING_EPILOGUES: Record<RatingValue, EpilogueText> = {
  s: {
    title: '伝説の調査記録',
    text: '全5層を驚異的な速さで踏破した。この調査記録は、後の探索者たちの指針となるだろう。',
  },
  a: {
    title: '優秀な調査報告',
    text: '確かな実力で全層を制覇した。解析班からも高い評価が寄せられている。',
  },
  b: {
    title: '堅実な踏破記録',
    text: '着実に5つの層を攻略した。得られたデータは今後の調査に大きく貢献する。',
  },
  c: {
    title: '生還報告',
    text: '幾度も危機を乗り越え、全層を踏破した。何より、生きて帰れたことが最大の成果だ。',
  },
  d: {
    title: '辛勝の脱出記録',
    text: '長い戦いの末、ようやく迷宮の封鎖が解除された。記録に残る限りの困難を極めた調査だった。',
  },
};

/**
 * ステージクリア後のストーリーを取得する
 * @param stage ステージ番号
 * @returns ストーリーシーン
 */
export const getStageStory = (stage: StageNumber): StoryScene => {
  return STAGE_STORIES[stage];
};

/**
 * プロローグストーリーを取得する
 * @returns プロローグのストーリーシーン
 */
export const getPrologueStory = (): StoryScene => {
  return PROLOGUE_STORY;
};

/**
 * 評価に応じたエンディングエピローグを取得する
 * @param rating 評価ランク
 * @returns エピローグテキスト
 */
export const getEndingEpilogue = (rating: RatingValue): EpilogueText => {
  return ENDING_EPILOGUES[rating];
};

/**
 * 全ストーリーシーンを取得する（テスト用）
 * @returns 全ストーリーシーンの配列
 */
export const getAllStoryScenes = (): StoryScene[] => {
  return [PROLOGUE_STORY, ...Object.values(STAGE_STORIES)];
};

/** ステージ報酬の選択肢 */
export const STAGE_REWARD_CHOICES = [
  {
    type: 'max_hp' as const,
    label: '最大HP強化',
    effect: 'maxHp +5 & 現在HP +5',
    description: '探索の経験が生命力を高めた',
  },
  {
    type: 'attack_power' as const,
    label: '攻撃力強化',
    effect: 'attackPower +1',
    description: '戦闘の記憶が攻撃を鋭くした',
  },
  {
    type: 'attack_range' as const,
    label: '攻撃距離強化',
    effect: 'attackRange +1',
    description: '間合いの感覚が研ぎ澄まされた',
  },
  {
    type: 'move_speed' as const,
    label: '移動速度強化',
    effect: 'moveSpeed +1',
    description: '足運びが迷宮に適応した',
  },
  {
    type: 'attack_speed' as const,
    label: '攻撃速度強化',
    effect: 'attackSpeed -0.1',
    description: '反応速度が一段上がった',
  },
  {
    type: 'heal_bonus' as const,
    label: '回復量強化',
    effect: 'healBonus +1',
    description: '回復の効率が改善された',
  },
] as const;

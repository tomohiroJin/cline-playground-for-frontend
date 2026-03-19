/**
 * チームタイプ分類
 *
 * エンジニア個人の能力診断ではなく、チームとしての成熟段階を判定する。
 */
import { TeamType, ClassifyStats } from './domain/types';
import { COLORS } from './constants';

/** チームタイプ定義（6種類） */
export const TEAM_TYPES: TeamType[] = [
  {
    id: 'synergy',
    name: 'シナジーチーム',
    emoji: '🌟',
    color: COLORS.orange,
    description: '全員の力が噛み合い、チームとして最高のパフォーマンスを発揮した',
    feedback:
      '素晴らしい。このチームはまさにスクラムが目指す姿だ。安定したベロシティ、低い技術的負債、そしてメンバー全員が各自の強みを活かしている。ステークホルダーとしても、安心してプロダクトを任せられる。',
    nextStep:
      '次の挑戦は、この成功パターンを組織全体に広げること。他チームのメンタリングや、より大きなプロダクトへの挑戦を検討しよう。',
    condition: (s) => s.stab >= 65 && s.debt <= 20 && s.tp >= 60,
  },
  {
    id: 'resilient',
    name: 'レジリエントチーム',
    emoji: '🔥',
    color: COLORS.orange,
    description: '緊急事態にも動じず、チーム全体で問題を解決する力を持つ',
    feedback:
      'このチームの真価は、危機の時にこそ発揮される。緊急対応を複数回成功させた実績は、チームの結束力と問題解決能力の証だ。',
    nextStep:
      '障害対応力は十分。次はプロアクティブな改善 — 技術的負債の計画的な返済やリスクの事前検知に取り組もう。',
    condition: (s) => s.emSuc >= 2,
  },
  {
    id: 'evolving',
    name: '成長するチーム',
    emoji: '📈',
    color: COLORS.yellow,
    description: 'スプリントを重ねるごとに改善し、チームとして成長し続けている',
    feedback:
      '最初のスプリントでは手探りだったが、レトロスペクティブでの振り返りを活かし、確実に成長している。この改善のサイクルこそアジャイルの本質だ。',
    nextStep:
      '成長の勢いを維持するために、チーム内でのナレッジ共有を強化しよう。ペアプログラミングやモブプログラミングも効果的だ。',
    condition: (s) => s.sc.length >= 2 && s.sc[0] < 50 && s.sc[s.sc.length - 1] >= 65,
  },
  {
    id: 'agile',
    name: 'アジャイルチーム',
    emoji: '⚡',
    color: COLORS.purple,
    description: '素早い判断と実行力で、価値あるプロダクトを迅速にデリバリーする',
    feedback:
      'スピード感のある開発で、ビジネス価値を素早く届けている。意思決定速度の速さは、チームの知識レベルと判断力の高さを物語る。',
    nextStep:
      'スピードは武器だが、品質とのバランスも忘れずに。テスト自動化やコードレビューの文化を強化して、持続可能な速度を保とう。',
    condition: (s) => s.spd <= 5.5 && s.tp >= 50,
  },
  {
    id: 'struggling',
    name: 'もがくチーム',
    emoji: '💪',
    color: COLORS.red,
    description: '技術的負債に苦しみながらも、諦めずに前に進み続けている',
    feedback:
      '技術的負債が積み上がっているのは厳しい状況だ。しかし、このチームは諦めていない。苦しい中でも走り続ける姿勢は評価に値する。',
    nextStep:
      'まずはリファインメントの時間を確保して負債を減らそう。20%ルール（スプリントの20%を改善に充てる）の導入を提案する。',
    condition: (s) => s.debt >= 35,
  },
  {
    id: 'forming',
    name: '結成したてのチーム',
    emoji: '🌱',
    color: COLORS.muted,
    description: 'まだチームとしての形を模索中。伸びしろは無限大',
    feedback:
      'スプリントを完走したことは、それ自体が大きな一歩だ。タックマンモデルで言えば、まだForming（形成期）の段階。ここからStorming（混乱期）を経て、チームは成長していく。',
    nextStep:
      'チームの約束事（ワーキングアグリーメント）を作ることから始めよう。お互いの得意・不得意を共有し、チームとしての強みを見つけていこう。',
    condition: () => true,
  },
];

/** チームタイプを判定 */
export function classifyTeamType(data: ClassifyStats): TeamType {
  return TEAM_TYPES.find((t) => t.condition(data)) ?? TEAM_TYPES[TEAM_TYPES.length - 1];
}

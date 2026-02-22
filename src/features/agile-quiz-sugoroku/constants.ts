/**
 * Agile Quiz Sugoroku - 定数・設定
 */
import { GameEvent, EngineerType, Grade, ExplanationMap, GameStats } from './types';

/** ゲーム設定 */
export const CONFIG = {
  /** スプリント数 */
  sprintCount: 3,
  /** 制限時間（秒） */
  timeLimit: 15,
  /** 技術的負債の設定 */
  debt: {
    impl: 5,
    test: 3,
    refinement: 4,
  },
  /** 緊急対応の発生確率設定 */
  emergency: {
    base: 0.1,
    debtMultiplier: 0.004,
    maxProbability: 0.5,
    minPosition: 1,
    maxPosition: 4,
  },
} as const;

/** カラーパレット */
export const COLORS = {
  bg: '#060a12',
  bg2: '#0c1220',
  card: '#111826',
  border: '#1c2438',
  border2: '#263050',
  text: '#d4dce8',
  text2: '#e8edf4',
  muted: '#5e6e8a',
  accent: '#4d9fff',
  accent2: '#3a7fd9',
  green: '#34d399',
  green2: '#22b07a',
  red: '#f06070',
  red2: '#d84858',
  yellow: '#f0b040',
  yellow2: '#d89a30',
  purple: '#a78bfa',
  orange: '#fb923c',
  cyan: '#22d3ee',
  pink: '#f472b6',
  glass: 'rgba(16,22,36,0.82)',
  glassBorder: 'rgba(80,120,200,0.1)',
} as const;

/** 値に応じた色を取得（高いほど良い） */
export function getColorByThreshold(value: number, high: number, low: number): string {
  if (value >= high) return COLORS.green;
  if (value >= low) return COLORS.yellow;
  return COLORS.red;
}

/** 値に応じた色を取得（低いほど良い） */
export function getInverseColorByThreshold(value: number, low: number, high: number): string {
  if (value <= low) return COLORS.green;
  if (value <= high) return COLORS.yellow;
  return COLORS.red;
}

/** スプリントイベント */
export const EVENTS: GameEvent[] = [
  { id: 'planning', name: 'プランニング', icon: '📋', description: '計画・合意', color: COLORS.accent },
  { id: 'impl1', name: '実装（1回目）', icon: '⌨️', description: '作り始め', color: COLORS.purple },
  { id: 'test1', name: 'テスト（1回目）', icon: '🧪', description: '確認', color: COLORS.cyan },
  { id: 'refinement', name: 'リファインメント', icon: '🔧', description: '整理・調整', color: COLORS.yellow },
  { id: 'impl2', name: '実装（2回目）', icon: '⌨️', description: '修正・対応', color: COLORS.purple },
  { id: 'test2', name: 'テスト（2回目）', icon: '✅', description: '最終確認', color: COLORS.green },
  { id: 'review', name: 'スプリントレビュー', icon: '📊', description: '共有・評価', color: COLORS.orange },
];

/** 緊急対応イベント */
export const EMERGENCY_EVENT: GameEvent = {
  id: 'emergency',
  name: '緊急対応',
  icon: '🚨',
  description: '障害対応',
  color: COLORS.red,
};

/** イベント別の負債ポイント */
const DEBT_POINTS: Record<string, number> = {
  impl1: CONFIG.debt.impl,
  impl2: CONFIG.debt.impl,
  test1: CONFIG.debt.test,
  test2: CONFIG.debt.test,
  refinement: CONFIG.debt.refinement,
};

/** 負債が発生するイベント */
export const DEBT_EVENTS: { [key: string]: number } = {
  impl1: 1,
  impl2: 1,
  test1: 1,
  test2: 1,
  refinement: 1,
};

/** イベントに応じた負債ポイントを計算 */
export function getDebtPoints(eventId: string): number {
  return DEBT_POINTS[eventId] ?? 0;
}

/** フォント設定 */
export const FONTS = {
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  jp: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif",
} as const;

/** 強み評価の閾値 */
export const STRENGTH_THRESHOLDS = [
  { min: 80, text: '非常に高い精度でスプリントを完走' },
  { min: 60, text: '安定した知識基盤で進行' },
  { min: 40, text: '基礎知識はあるが精度にばらつき' },
  { min: 0, text: '知識の補強で大きく伸びる余地あり' },
] as const;

/** 課題評価 */
export const CHALLENGE_EVALUATIONS = [
  { check: (debt: number) => debt >= 30, text: '技術的負債の蓄積が深刻化' },
  { check: (debt: number) => debt >= 15, text: '技術的負債に注意' },
  { check: (debt: number, spd: number) => spd > 10, text: '回答速度の改善で安定度アップ' },
  { check: (debt: number, spd: number, pct: number) => pct < 50, text: '正答率の向上が鍵' },
  { check: () => true, text: '高水準を維持' },
] as const;

/** 強み評価テキストを取得 */
export function getStrengthText(rate: number): string {
  const match = STRENGTH_THRESHOLDS.find(x => rate >= x.min);
  return match?.text ?? STRENGTH_THRESHOLDS[STRENGTH_THRESHOLDS.length - 1].text;
}

/** 課題評価テキストを取得 */
export function getChallengeText(debt: number, spd: number, rate: number): string {
  const match = CHALLENGE_EVALUATIONS.find(x => x.check(debt, spd, rate));
  return match?.text ?? CHALLENGE_EVALUATIONS[CHALLENGE_EVALUATIONS.length - 1].text;
}

/** エンジニアタイプ */
export const ENGINEER_TYPES: EngineerType[] = [
  {
    id: 'stable',
    name: '安定運用型エンジニア',
    emoji: '🛡️',
    color: COLORS.green,
    description: '堅実にスプリントを回し品質を維持。チームの安定感を支える信頼の存在。',
    condition: s => s.stab >= 65 && s.debt <= 20 && s.tp >= 60,
  },
  {
    id: 'firefighter',
    name: '火消し職人エンジニア',
    emoji: '🔥',
    color: COLORS.orange,
    description: '緊急事態に強く障害対応で真価を発揮。修羅場を突破する力の持ち主。',
    condition: s => s.emSuc >= 2,
  },
  {
    id: 'growth',
    name: '成長曲線型エンジニア',
    emoji: '📈',
    color: COLORS.yellow,
    description: '序盤はラフだがスプリントごとに精度が上がる。経験値でカバーするタイプ。',
    condition: s => s.sc.length >= 2 && s.sc[0] < 50 && s.sc[s.sc.length - 1] >= 65,
  },
  {
    id: 'speed',
    name: '高速レスポンスエンジニア',
    emoji: '⚡',
    color: COLORS.purple,
    description: '回答速度が圧倒的に速い。直感と経験で即断即決するタイプ。',
    condition: s => s.spd <= 5.5 && s.tp >= 50,
  },
  {
    id: 'debt',
    name: '技術的負債と共に生きる人',
    emoji: '💀',
    color: COLORS.red,
    description: '負債を抱えながらも前に進む覚悟の開発者。',
    condition: s => s.debt >= 35,
  },
  {
    id: 'default',
    name: '無難に回すエンジニア',
    emoji: '⚙️',
    color: COLORS.muted,
    description: '安定してスプリントを回す。地道な堅実さが武器。',
    condition: () => true,
  },
];

/** グレード設定 */
export const GRADES: Grade[] = [
  { min: 90, grade: 'S', color: COLORS.orange, label: 'Legendary' },
  { min: 75, grade: 'A', color: COLORS.green, label: 'Excellent' },
  { min: 60, grade: 'B', color: COLORS.accent, label: 'Good' },
  { min: 45, grade: 'C', color: COLORS.yellow, label: 'Average' },
  { min: 0, grade: 'D', color: COLORS.red, label: 'Needs Work' },
];

/** グレード計算の重み */
const GRADE_WEIGHTS = {
  accuracy: 0.5,
  stability: 0.3,
  speed: 0.2,
} as const;

/** 速度スコア係数（spd * SPEED_FACTOR を100から引いてスコア化） */
const SPEED_FACTOR = 8;

/** グレードを計算 */
export function getGrade(tp: number, stab: number, spd: number): Grade {
  const speedScore = Math.max(0, Math.min(100, 100 - spd * SPEED_FACTOR));
  const score =
    tp * GRADE_WEIGHTS.accuracy +
    stab * GRADE_WEIGHTS.stability +
    speedScore * GRADE_WEIGHTS.speed;
  return GRADES.find(g => score >= g.min) ?? GRADES[GRADES.length - 1];
}

/** サマリーテキストを生成 */
export function getSummaryText(tp: number, spd: number, debt: number, emergencySuccess: number): string {
  const sc = CONFIG.sprintCount;
  if (tp >= 70) {
    return `高い正答率で${sc}スプリントを安定完走。${spd <= 6 ? '回答速度も優秀。' : ''}信頼性の高いエンジニアリングを実現。`;
  }
  if (tp >= 50) {
    return `基礎力のあるスプリント進行。${debt > 20 ? '技術的負債の管理が次の成長ポイント。' : 'さらなる精度向上でワンランク上へ。'}`;
  }
  return `${sc}スプリントを走破。${emergencySuccess > 0 ? '緊急対応での活躍が光りました。' : '知識の幅を広げれば次回はさらに好結果に。'}`;
}

/** 初期ゲーム状態 */
export const INITIAL_GAME_STATS: GameStats = {
  totalCorrect: 0,
  totalQuestions: 0,
  speeds: [],
  debt: 0,
  emergencyCount: 0,
  emergencySuccess: 0,
  combo: 0,
  maxCombo: 0,
};

/** カテゴリ名マッピング */
export const CATEGORY_NAMES: { [key: string]: string } = {
  planning: '計画',
  impl1: '実装1',
  test1: 'テスト1',
  refinement: 'リファ',
  impl2: '実装2',
  test2: 'テスト2',
  review: 'レビュー',
  emergency: '緊急',
};

/** 解説データ */
export const EXPLANATIONS: ExplanationMap = {
  planning: {
    0: 'POはプロダクト価値最大化の責任者。',
    1: 'プランニングでスプリントゴールを決める。',
    2: 'フィボナッチ数列で相対見積もりを行う。',
    5: 'ベロシティはチームの実績ベースの指標。',
    8: 'SMはサーバントリーダーとしてチームを支援。',
    10: 'アジャイル宣言は4つの価値と12の原則。',
    12: '3本柱：透明性・検査・適応。予測は含まない。',
  },
  impl1: {
    0: 'SRP：1つのクラスに変更理由は1つだけ。',
    1: "Don't Repeat Yourself：重複を排除。",
    5: 'ハッシュテーブルは衝突がなければO(1)。',
    7: '純粋関数は同じ入力に同じ出力を返す。',
    9: 'OCP：拡張に開き、修正に閉じる。',
  },
  test1: {
    0: 'BBT：仕様ベースで内部を見ない。',
    5: 'TDD：テスト先行で設計を駆動する。',
    9: 'モックで外部依存を切り離す。',
  },
  refinement: {
    0: '負債は短期的妥協の長期的コスト。',
    1: 'リファクタ＝外部振る舞い不変で内部改善。',
    6: '来た時より美しく。継続的改善の精神。',
  },
  impl2: {
    3: 'DI：外から依存を注入し結合度を下げる。',
    5: 'デグレ＝リグレッション。回帰テストで防ぐ。',
    7: 'DIP：上位は下位に依存せず抽象に依存。',
  },
  test2: {
    0: '回帰テストで既存機能の破壊を検出。',
    4: 'カナリアリリースでリスクを限定。',
    6: 'ピラミッド底辺＝単体テストが最多。',
  },
  review: {
    0: 'レビュー＝成果物のインスペクション。',
    3: 'DoDは「完成」の共通認識を定義。',
    7: 'MVP＝最小機能で仮説検証。',
  },
  emergency: {
    0: 'まず影響範囲を把握し優先度を判断。',
    3: 'ポストモーテム＝blame-freeな振り返り。',
    5: 'MTTR：Mean Time To Recovery。',
  },
};

/** 選択肢ラベル */
export const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

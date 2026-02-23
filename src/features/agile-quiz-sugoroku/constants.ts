/**
 * Agile Quiz Sugoroku - 定数・設定
 */
import { GameEvent, EngineerType, Grade, GameStats } from './types';

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

/** スプリント数の選択肢（フィボナッチ数列） */
export const SPRINT_OPTIONS = [1, 2, 3, 5, 8] as const;

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

/** サマリーテキストを生成（タカ / ビジネスオーナー視点） */
export function getSummaryText(tp: number, spd: number, debt: number, emergencySuccess: number, sc: number = CONFIG.sprintCount): string {
  if (tp >= 70) {
    return `素晴らしい。${sc}スプリントを安定して完走し、プロダクトの価値を最大化した。${spd <= 6 ? '意思決定のスピードも申し分ない。' : ''}我々のビジネスに大きく貢献してくれた。`;
  }
  if (tp >= 50) {
    return `基礎力はある。${debt > 20 ? '技術的負債の管理を改善すれば、プロダクトの品質がさらに上がるだろう。' : '精度を高めて、より大きな価値を生み出してほしい。'}期待しているぞ。`;
  }
  return `${sc}スプリントを走り抜いたことは評価する。${emergencySuccess > 0 ? '緊急時の対応力は光るものがあった。' : '知識の幅を広げれば、次はもっと大きな成果を出せるはずだ。'}`;
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

/** 選択肢ラベル */
export const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

/** スプリント工程とジャンルのマッピング */
export const PHASE_GENRE_MAP: { [phase: string]: string[] } = {
  planning: ['scrum', 'agile', 'estimation', 'backlog'],
  impl1: ['design-principles', 'design-patterns', 'data-structures', 'programming'],
  impl2: ['design-principles', 'design-patterns', 'data-structures', 'programming'],
  test1: ['testing', 'code-quality', 'ci-cd'],
  test2: ['testing', 'code-quality', 'ci-cd'],
  refinement: ['refactoring', 'code-quality', 'backlog'],
  review: ['release', 'team', 'scrum'],
  emergency: ['incident', 'sre'],
};

/**
 * Agile Quiz Sugoroku - タグマスタ定義
 */

export interface TagDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
}

export const TAG_MASTER: TagDefinition[] = [
  { id: 'scrum', name: 'スクラム', description: '役割・イベント・成果物', color: '#4d9fff' },
  { id: 'agile', name: 'アジャイル原則', description: '宣言・価値・カンバン・WIP', color: '#3a7fd9' },
  { id: 'estimation', name: '見積もり', description: 'SP・PP・ベロシティ・Tシャツ', color: '#a78bfa' },
  { id: 'backlog', name: 'バックログ管理', description: 'PBI・優先順位・US・INVEST', color: '#f0b040' },
  { id: 'design-principles', name: '設計原則', description: 'SOLID・DRY・KISS・YAGNI・SoC', color: '#34d399' },
  { id: 'design-patterns', name: 'デザインパターン', description: 'Singleton・Observer・Adapter 等', color: '#22b07a' },
  { id: 'data-structures', name: 'データ構造・アルゴリズム', description: 'Stack・Queue・Sort・Big-O', color: '#22d3ee' },
  { id: 'programming', name: 'プログラミング概念', description: 'FP・OOP・クロージャ・副作用', color: '#f472b6' },
  { id: 'code-quality', name: 'コード品質', description: '命名・可読性・コードスメル', color: '#fb923c' },
  { id: 'testing', name: 'テスト', description: 'テスト種類・技法・TDD・モック', color: '#22d3ee' },
  { id: 'ci-cd', name: 'CI/CD', description: 'CI・デプロイ・ブランチ戦略', color: '#a78bfa' },
  { id: 'refactoring', name: 'リファクタリング・技術的負債', description: 'リファクタリング・負債管理', color: '#f0b040' },
  { id: 'release', name: 'リリース', description: 'カナリア・ブルーグリーン・FF', color: '#34d399' },
  { id: 'incident', name: '障害対応', description: 'インシデント対応・PM・RCA', color: '#f06070' },
  { id: 'sre', name: 'SRE・運用', description: 'SLA/SLO・MTTR・監視・カオス', color: '#d84858' },
  { id: 'team', name: 'チーム・改善', description: 'レトロ・FB・心理的安全性', color: '#fb923c' },
];

export const VALID_TAG_IDS = TAG_MASTER.map((t) => t.id);

export const TAG_MAP = new Map(TAG_MASTER.map((t) => [t.id, t]));

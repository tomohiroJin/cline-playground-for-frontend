# Agile Quiz Sugoroku - クイズタグ仕様書

## タグマスタ定義（16 ジャンル）

| ID | 日本語名 | 対象範囲 | カラー |
|---|---|---|---|
| `scrum` | スクラム | 役割・イベント・成果物 | `#4d9fff` |
| `agile` | アジャイル原則 | 宣言・価値・カンバン・WIP | `#3a7fd9` |
| `estimation` | 見積もり | SP・PP・ベロシティ・Tシャツ | `#a78bfa` |
| `backlog` | バックログ管理 | PBI・優先順位・US・INVEST | `#f0b040` |
| `design-principles` | 設計原則 | SOLID・DRY・KISS・YAGNI・SoC | `#34d399` |
| `design-patterns` | デザインパターン | Singleton・Observer・Adapter 等 | `#22b07a` |
| `data-structures` | データ構造・アルゴリズム | Stack・Queue・Sort・Big-O | `#22d3ee` |
| `programming` | プログラミング概念 | FP・OOP・クロージャ・副作用 | `#f472b6` |
| `code-quality` | コード品質 | 命名・可読性・コードスメル | `#fb923c` |
| `testing` | テスト | テスト種類・技法・TDD・モック | `#22d3ee` |
| `ci-cd` | CI/CD | CI・デプロイ・ブランチ戦略 | `#a78bfa` |
| `refactoring` | リファクタリング・技術的負債 | リファクタリング・負債管理 | `#f0b040` |
| `release` | リリース | カナリア・ブルーグリーン・FF | `#34d399` |
| `incident` | 障害対応 | インシデント対応・PM・RCA | `#f06070` |
| `sre` | SRE・運用 | SLA/SLO・MTTR・監視・カオス | `#d84858` |
| `team` | チーム・改善 | レトロ・FB・心理的安全性 | `#fb923c` |

## タグ付けルール

- 各問 1〜3 タグ（主に 1〜2）
- 主タグ = 問題が教えたい核心概念
- 副タグ = 明確に 2 領域にまたがる場合のみ
- 全タグがマスタ定義に存在すること（バリデーションで保証）

## 型定義

```typescript
export interface Question {
  q: string;
  o: string[];
  a: number;
  tags?: string[];  // 新規追加（optional）
}
```

## バリデーション

- `tags` が存在する場合: 配列であること、各要素が `VALID_TAG_IDS` に含まれること
- `tags` が存在しない場合: エラーにしない（後方互換性）

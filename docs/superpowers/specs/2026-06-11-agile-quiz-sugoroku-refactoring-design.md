# Agile Quiz Sugoroku 大規模リファクタリング 設計ドキュメント

- 作成日: 2026-06-11
- 対象: `src/features/agile-quiz-sugoroku/`(テスト除き約 12,700 行)
- 種別: 純粋な構造リファクタリング(挙動変更なし)

## 1. 背景と目的

Agile Quiz Sugoroku は過去のリファクタリング(フェーズ 4〜10、Batch 1〜4)で
`domain/`(quiz, scoring, team, achievement, game, types)と
`infrastructure/`(Port / Adapter / Repository)が整備されたが、移行が途中で止まり、
以下の二重構造が残っている。

- Feature 直下に旧式のフラットファイル群(`character-*.ts`, `story-data.ts`,
  `ending-data.ts`, `daily-quiz.ts`, `team-classifier.ts`, `images.ts`, `audio/`)
- `team-classifier.ts` は実体がルート、`domain/team/` 側がシムという逆転状態
- `presentation/` は再エクスポートシムのみで実体は `components/`・`hooks/` にある
- `pages/AgileQuizSugorokuPage.tsx`(622 行)が Feature 内部の深いパス 17 箇所を
  直接インポート

**目的: 移行を完遂し、構造を統一する。** 機能追加・挙動変更は行わない。

## 2. 最終形

3 層構成(`domain` / `infrastructure` / `presentation`)+ `data/` + 公開 API の一本化。
`application/` 層は過去に死蔵化した実績(フェーズ 5 で導入 → Batch 4 で削除)が
あるため再導入しない。

```
features/agile-quiz-sugoroku/
├── index.ts             # 唯一の公開 API(外部はここからのみインポート)
├── data/                # 静的データ(新設)
│   ├── story-data.ts
│   ├── ending-data.ts
│   ├── character-profiles.ts
│   ├── images.ts
│   └── questions/       # JSON 8 本 + tag-master.ts + index.ts
├── domain/
│   ├── quiz/            # 既存 + daily-quiz.ts を収容
│   ├── scoring/ game/ achievement/ types/ testing/   # 現状維持
│   ├── team/
│   │   └── team-classifier.ts   # 実体をルートから移設(シム逆転の解消)
│   └── narrative/       # 新設
│       ├── character-narrative.ts
│       ├── character-reactions.ts
│       └── character-genre-map.ts
├── infrastructure/      # 現状維持 + audio 統合
│   └── audio/
│       ├── sound.ts             # ルート audio/ から移設(Tone.js 直接操作)
│       └── audio-actions.ts     # 同上(インターフェース整理はスコープ外)
├── presentation/        # シムを廃止し実体を移設
│   ├── components/
│   │   └── screens/     # 全画面コンポーネントを screens/ 配下に統一
│   ├── hooks/
│   └── styles/          # components/styles/ から昇格
├── constants/           # 現状維持(colors, events, game-config, grades)
├── doc/                 # 現状維持(設計ドキュメント群)
├── __tests__/           # 現状維持(インポートパスのみ更新)
└── README.md
```

### 分類基準

| 行き先 | 基準 |
|---|---|
| `domain/` | 関数・条件分岐を持つロジック |
| `data/` | 定義のみの静的データ |
| `presentation/` | React コンポーネント・フック・スタイル |
| `infrastructure/` | 外部技術(Tone.js, localStorage)への接続 |

### 個別の判断

- `daily-quiz.ts`: 日付ベースのシード計算ロジックを含むため `data/` ではなく
  `domain/quiz/daily-quiz.ts` へ
- `audio/audio-actions.ts`: コメントに「後方互換用」とあるが Page が使用中のため
  削除せず `infrastructure/audio/` へ統合。インターフェース整理は今回のスコープ外
- `index.ts` の `../../utils/math-utils` 再エクスポート(`shuffle`, `clamp` 等)は廃止。
  Page は共通ユーティリティを直接インポートする(公開 API による横流しの解消)

## 3. 実行計画(ファサード先行方式・4 PR)

最初に公開 API を凍結して外部境界を固定し、以降は Feature 内部だけで完結させる。
各 PR は独立して CI 全パスし、マージ後も常にゲームが動作する。
問題発生時は単一 PR の revert で完全に戻せる(PR 間に非可逆な依存はない)。

### PR1: `refactor/aqs-facade` — 公開 API の確立とインポート一本化

- `index.ts` の `export *`(ワイルドカード)を、外部が実際に使うものだけの
  **名前付きエクスポート**に整理
- `AgileQuizSugorokuPage.tsx` の深いインポート 17 箇所を
  `'../features/agile-quiz-sugoroku'` 一本に集約
- `math-utils` の再エクスポートを廃止し、Page は直接インポートに変更
- 差分は Page と `index.ts` のみ

### PR2: `refactor/aqs-data-layer` — data/ の抽出

- `story-data.ts`, `ending-data.ts`, `character-profiles.ts`, `images.ts`,
  `questions/` を `data/` へ `git mv`
- Feature 内部の参照パスと対応テストのインポートパスを更新
  (外部は index.ts 経由のため影響なし)

### PR3: `refactor/aqs-domain` — domain/ への収容と二重存在解消

- `team-classifier.ts` の実体を `domain/team/team-classifier.ts` へ移設し、
  ルートのファイルとシムを削除
- `character-narrative.ts`, `character-reactions.ts`, `character-genre-map.ts`
  → `domain/narrative/`
- `daily-quiz.ts` → `domain/quiz/daily-quiz.ts`
- `audio/sound.ts`, `audio/audio-actions.ts` → `infrastructure/audio/`、
  ルートの `audio/` を削除

### PR4: `refactor/aqs-presentation` — presentation/ への移設とシム全廃

- `components/` の実体を `presentation/components/` へ移設し、フラットに並ぶ
  画面コンポーネントを `screens/` 配下へ統一
- `hooks/` → `presentation/hooks/`、`components/styles/` → `presentation/styles/`
- 再エクスポートシム(現 `presentation/components/index.ts` 等)を全廃
- `__tests__/architecture.test.ts` に逆行防止ルールを追加(下記)

## 4. テスト・検証戦略

### 挙動不変の保証

- 既存の 26 本のテストファイルが安全網。**テストロジックは一切変更せず**、
  インポートパスのみ更新する(移動前後で同じ対象を検証し続けることが
  挙動不変の根拠)
- 各 PR で `npm run ci`(lint:ci → typecheck → test → build)+
  `npm run test:e2e` の全パスを確認してからレビュー依頼
- PR1 のエクスポート整理で外部使用シンボルの見落としがあっても、
  typecheck がコンパイルエラーとして検出する(実行時まで漏れない)

### 逆行防止ガードレール(PR4 で `architecture.test.ts` に追加)

1. **ルート直下の禁止**: Feature 直下に置ける**ファイル**は `index.ts` と
   `README.md` のみ(ディレクトリは `data/`, `domain/`, `infrastructure/`,
   `presentation/`, `constants/`, `doc/`, `__tests__/` のみ許可)
2. **旧パス参照の禁止**: Feature 内のインポートが `../../components` 等の
   廃止済みパスを参照していないこと
3. **外部からの深いインポート禁止**: `src/pages/AgileQuizSugorokuPage.tsx` が
   `features/agile-quiz-sugoroku/` 配下の深いパスをインポートしていないこと
   (`index.ts` 経由のみ許可)

### エラーハンドリング

純粋な構造リファクタリングのため、新規のエラーハンドリングは発生しない。

## 5. スコープ外(明示)

- `AgileQuizSugorokuPage.tsx` の内部ロジック分解(622 行のオーケストレーション)
  → 次回のリファクタリングに分離
- `application/` 層の再導入
- `AudioActions` インターフェースの整理・統合
- 機能追加・UI 変更・パフォーマンス改善

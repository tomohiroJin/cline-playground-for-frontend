# Agile Quiz Sugoroku 大規模リファクタリング計画

## 1. 概要

### 1.1 目的
Agile Quiz Sugoroku（以下 AQS）の大規模リファクタリングを実施し、以下を達成する：
- **DDD（ドメイン駆動設計）** の導入によるドメイン境界の強化
- **副作用の除去**（純粋関数化、インフラ層の分離）
- **DRY / DbC / SOLID 原則** の適用
- **デザインパターン** の導入によるカスタマイズ性向上
- **E2E テスト** の導入とテストリファクタリング

### 1.2 現状分析

| 項目 | 現状 |
|------|------|
| ソースファイル数 | 約60ファイル |
| メインコード | 約3,154行 |
| テストコード | 約5,882行（32ファイル） |
| アーキテクチャ | フラット構造（domain/infrastructure 分離なし） |
| 状態管理 | useState × 多数（useGame.ts: 337行） |
| 副作用 | localStorage × 6箇所、Audio × 2箇所、Math.random 散在 |
| E2E テスト | 未実装（primal-path に実装例あり） |

### 1.3 リファクタリング方針
- **primal-path の DDD 構造** を参考アーキテクチャとする
- **ipne のレイヤード構造**（application/domain/infrastructure/presentation）も参照
- 既存テストを維持しながら段階的に移行
- 各フェーズ完了時にテストが全パスすることを保証

### 1.4 参考アーキテクチャ（primal-path）
```
domain/         → ビジネスロジック（純粋関数）
contracts/      → DbC アサーション
constants/      → ゲームデータ定数（Object.freeze）
components/     → React コンポーネント
hooks/          → カスタムフック
```

---

## 2. ターゲットアーキテクチャ

### 2.1 ディレクトリ構造（目標）
```
src/features/agile-quiz-sugoroku/
  ├─ domain/                        # ドメイン層（純粋関数のみ）
  │  ├─ game/                       # ゲーム進行ドメイン
  │  │  ├─ game-state.ts            # GameState 値オブジェクト
  │  │  ├─ sprint.ts                # Sprint エンティティ
  │  │  ├─ event-generator.ts       # イベント生成ロジック
  │  │  └─ game-rules.ts            # ゲームルール（定数・制約）
  │  ├─ quiz/                       # クイズドメイン
  │  │  ├─ question-picker.ts       # 問題選択ロジック
  │  │  ├─ answer-evaluator.ts      # 回答評価ロジック
  │  │  └─ combo-calculator.ts      # コンボ計算
  │  ├─ scoring/                    # スコアリングドメイン
  │  │  ├─ score-calculator.ts      # スコア計算
  │  │  ├─ debt-calculator.ts       # 技術的負債計算
  │  │  └─ grade-classifier.ts      # グレード分類
  │  ├─ team/                       # チーム分類ドメイン
  │  │  ├─ team-classifier.ts       # チームタイプ分類
  │  │  └─ team-types.ts            # チームタイプ定義
  │  ├─ achievement/                # 実績ドメイン
  │  │  ├─ achievement-checker.ts   # 実績判定ロジック
  │  │  └─ achievement-definitions.ts
  │  └─ types/                      # ドメイン型定義
  │     ├─ game-types.ts            # ゲーム関連型
  │     ├─ quiz-types.ts            # クイズ関連型
  │     ├─ scoring-types.ts         # スコア関連型
  │     └─ index.ts                 # 再エクスポート
  │
  ├─ contracts/                     # DbC（Design by Contract）
  │  ├─ game-contracts.ts           # ゲーム不変条件
  │  ├─ quiz-contracts.ts           # クイズ事前・事後条件
  │  └─ scoring-contracts.ts        # スコア計算契約
  │
  ├─ infrastructure/                # インフラ層（副作用を集約）
  │  ├─ storage/                    # ストレージアダプタ
  │  │  ├─ storage-adapter.ts       # StoragePort インターフェース
  │  │  ├─ local-storage-adapter.ts # localStorage 実装
  │  │  ├─ game-repository.ts       # ゲーム結果リポジトリ
  │  │  ├─ history-repository.ts    # 履歴リポジトリ
  │  │  ├─ achievement-repository.ts
  │  │  └─ save-repository.ts       # セーブデータリポジトリ
  │  ├─ audio/                      # オーディオアダプタ
  │  │  ├─ audio-port.ts            # AudioPort インターフェース
  │  │  ├─ tone-audio-adapter.ts    # Tone.js 実装
  │  │  └─ silent-audio-adapter.ts  # テスト用サイレント実装
  │  └─ random/                     # 乱数アダプタ
  │     ├─ random-port.ts           # RandomPort インターフェース
  │     └─ math-random-adapter.ts   # Math.random 実装
  │
  ├─ application/                   # アプリケーション層（ユースケース）
  │  ├─ start-game.ts               # ゲーム開始ユースケース
  │  ├─ answer-question.ts          # 回答処理ユースケース
  │  ├─ advance-event.ts            # イベント進行ユースケース
  │  ├─ finish-sprint.ts            # スプリント終了ユースケース
  │  └─ save-load-game.ts           # セーブ/ロードユースケース
  │
  ├─ presentation/                  # プレゼンテーション層
  │  ├─ components/                 # React コンポーネント
  │  │  ├─ screens/                 # 画面コンポーネント
  │  │  │  ├─ TitleScreen.tsx
  │  │  │  ├─ StoryScreen.tsx
  │  │  │  ├─ SprintStartScreen.tsx
  │  │  │  ├─ QuizScreen.tsx
  │  │  │  ├─ RetrospectiveScreen.tsx
  │  │  │  ├─ ResultScreen/         # 大規模コンポーネントの分割
  │  │  │  │  ├─ ResultScreen.tsx
  │  │  │  │  ├─ GradeDisplay.tsx
  │  │  │  │  ├─ StatsPanel.tsx
  │  │  │  │  └─ ResultActions.tsx
  │  │  │  ├─ StudySelectScreen.tsx
  │  │  │  ├─ StudyScreen.tsx
  │  │  │  ├─ AchievementScreen.tsx
  │  │  │  ├─ HistoryScreen.tsx
  │  │  │  ├─ DailyQuizScreen.tsx
  │  │  │  └─ GuideScreen/
  │  │  │     ├─ GuideScreen.tsx
  │  │  │     ├─ GuideSection.tsx
  │  │  │     └─ GuideNavigation.tsx
  │  │  ├─ shared/                  # 共有コンポーネント
  │  │  │  ├─ CharacterReaction.tsx
  │  │  │  ├─ DifficultySelector.tsx
  │  │  │  └─ charts/
  │  │  │     ├─ RadarChart.tsx
  │  │  │     ├─ BarChart.tsx
  │  │  │     └─ LineChart.tsx
  │  │  └─ effects/                 # エフェクトコンポーネント
  │  │     ├─ ComboEffect.tsx
  │  │     ├─ ParticleEffect.tsx
  │  │     ├─ FlashOverlay.tsx
  │  │     ├─ ScoreFloat.tsx
  │  │     └─ AchievementToast.tsx
  │  ├─ hooks/                      # プレゼンテーション層フック
  │  │  ├─ useGame.ts               # ゲーム状態管理（Reducer化）
  │  │  ├─ useGameReducer.ts        # Reducer 定義
  │  │  ├─ useChallenge.ts
  │  │  ├─ useCountdown.ts
  │  │  ├─ useFade.ts
  │  │  ├─ useKeys.ts
  │  │  └─ useStudy.ts
  │  └─ styles/                     # スタイル定義
  │     ├─ design-tokens.ts         # デザイントークン（色・間隔・フォント）
  │     ├─ animations.ts
  │     ├─ common.ts
  │     ├─ layout.ts
  │     ├─ quiz.ts
  │     ├─ result.ts
  │     └─ story.ts
  │
  ├─ constants/                     # 定数（分割後）
  │  ├─ game-config.ts              # ゲーム設定
  │  ├─ events.ts                   # イベント定義
  │  ├─ grades.ts                   # グレード定義
  │  └─ index.ts
  │
  ├─ data/                          # 静的データ
  │  ├─ questions/                  # 問題データ
  │  ├─ story-data.ts               # ストーリーデータ
  │  ├─ ending-data.ts              # エンディングデータ
  │  ├─ character-profiles.ts       # キャラクタープロファイル
  │  └─ images.ts                   # 画像アセット参照
  │
  └─ index.ts                       # 公開 API
```

### 2.2 依存関係の方向
```
presentation → application → domain ← contracts
                    ↓
              infrastructure
```
- **domain 層は他の層に依存しない**（純粋関数のみ）
- **infrastructure 層は domain 層のインターフェースを実装**
- **application 層は domain と infrastructure を組み合わせる**
- **presentation 層は application 層のみに依存**

---

## 3. 実施フェーズ

### フェーズ 0: 準備（安全網の構築）
**期間目安**: 1-2日
**目的**: リファクタリング前の安全網を確立

1. 現状のテストが全パスすることを確認
2. テストカバレッジのベースラインを取得
3. E2E テストのスケルトンを作成（基本画面遷移のみ）
4. ブランチ戦略の確認（refactor/agile-quiz-large-scale）

### フェーズ 1: 型定義の分割とドメイン型の確立
**期間目安**: 1-2日
**目的**: types.ts を分割し、ドメイン境界を型で表現

1. `domain/types/` ディレクトリの作成
2. `types.ts` → `game-types.ts`, `quiz-types.ts`, `scoring-types.ts` に分割
3. 既存の `types.ts` を再エクスポート用に維持（後方互換）
4. テスト全パスの確認

### フェーズ 2: ドメイン層の抽出
**期間目安**: 3-4日
**目的**: ビジネスロジックを純粋関数として domain/ に集約

1. `game-logic.ts` → `domain/game/` に移動・分割
2. `answer-processor.ts` → `domain/quiz/answer-evaluator.ts` に移動
3. `engineer-classifier.ts` → `domain/team/team-classifier.ts` に移動
4. `achievements.ts` → `domain/achievement/` に移動
5. `difficulty.ts`, `combo-color.ts` → 適切な domain サブディレクトリへ
6. `tag-stats.ts` → `domain/quiz/` に移動
7. `study-question-pool.ts` → `domain/quiz/` に移動
8. 各関数の純粋性を検証（副作用がないことを確認）
9. **ランダム依存関数の純粋化**: `Math.random` を直接呼ぶ関数に `randomFn: () => number` 引数を追加
   - `pickQuestion()`: 問題選択
   - `makeEvents()` → `createEvents()`: イベント生成・緊急対応判定
   - `shuffleArray()`: シャッフル処理
   - これにより、ユニットテストで乱数を固定した確定的テストが可能になる
10. テスト全パスの確認

### フェーズ 3: DbC（Design by Contract）の導入
**期間目安**: 2-3日
**目的**: 契約による設計でドメインの不変条件を保護

1. `contracts/` ディレクトリの作成
2. ゲーム不変条件の定義（スプリント数、スコア範囲、負債制約）
3. クイズ事前・事後条件の定義（問題選択、回答評価）
4. スコア計算契約の定義（グレード判定、チーム分類）
5. 契約テストの作成
6. テスト全パスの確認

### フェーズ 4: インフラ層の分離（副作用の除去）
**期間目安**: 3-4日
**目的**: 副作用を infrastructure/ に集約し、Port/Adapter パターンで分離

1. **StoragePort** インターフェースの定義
2. `result-storage.ts` → `infrastructure/storage/game-repository.ts`
3. `history-storage.ts` → `infrastructure/storage/history-repository.ts`
4. `achievement-storage.ts` → `infrastructure/storage/achievement-repository.ts`
5. `save-manager.ts` → `infrastructure/storage/save-repository.ts`
6. `challenge-storage.ts`, `daily-quiz.ts` → 適切なリポジトリへ
7. **AudioPort** インターフェースの定義
8. `audio/sound.ts` → `infrastructure/audio/tone-audio-adapter.ts`
9. **RandomPort** インターフェースの定義（Math.random の抽象化）
10. テスト全パスの確認

### フェーズ 5: アプリケーション層の構築
**期間目安**: 2-3日
**目的**: ユースケースを application/ に定義し、domain と infrastructure を接続

1. `start-game.ts` ユースケースの作成
2. `answer-question.ts` ユースケースの作成
3. `advance-event.ts` ユースケースの作成
4. `finish-sprint.ts` ユースケースの作成
5. `save-load-game.ts` ユースケースの作成
6. テスト全パスの確認

### フェーズ 6: 定数の分割とデザイントークン化
**期間目安**: 1-2日
**目的**: constants.ts の責務分割、スタイルの整理

1. `constants.ts` → `constants/game-config.ts`, `constants/events.ts`, `constants/grades.ts` に分割
2. カラーパレット → `presentation/styles/design-tokens.ts` に移動
3. `Object.freeze` による定数の不変性保証
4. テスト全パスの確認

### フェーズ 7: プレゼンテーション層のリファクタリング
**期間目安**: 4-5日
**目的**: コンポーネント分割と状態管理の改善

1. **useGame の Reducer 化**
   - `useGameReducer.ts` の作成（Action/State/Reducer 定義）
   - `useGame.ts` を Reducer ベースに書き換え
   - 複数の `setState` を単一の `dispatch` に統合

2. **大規模コンポーネントの分割**
   - `ResultScreen.tsx`（581行）→ `ResultScreen/` ディレクトリに分割
   - `GuideScreen.tsx`（420行）→ `GuideScreen/` ディレクトリに分割
   - `QuizScreen.tsx`（431行）→ タイマー・選択肢・リアクション表示を分離
   - `TitleScreen.tsx`（328行）→ 難易度選択・スプリント数選択を分離

3. **デザインパターンの適用**
   - Compound Component パターン（ResultScreen）
   - Strategy パターン（難易度設定）
   - Observer パターン（実績通知）

4. テスト全パスの確認

### フェーズ 8: テストリファクタリング
**期間目安**: 3-4日
**目的**: テスト品質の向上とアーキテクチャ整合性の確保

1. **ドメイン層テスト**
   - 純粋関数テストの整理（AAA パターン徹底）
   - 境界値テストの追加
   - **ランダム依存関数のテスト強化**
     - `randomFn` 注入による確定的テスト（緊急対応の発生/非発生を両パス検証）
     - 問題選択ロジックの乱数固定テスト
     - シャッフル関数の振る舞いテスト

2. **インフラ層テスト**
   - StorageAdapter のモック化テスト
   - AudioAdapter のモック化テスト
   - テスト用 In-memory 実装の作成
   - テスト用 SeededRandomAdapter の作成（再現可能なテスト用）

3. **アプリケーション層テスト**
   - ユースケースの統合テスト
   - 副作用のモック化

4. **コンポーネントテスト**
   - Testing Library ベストプラクティスの適用
   - `getByRole` / `getByText` 優先
   - ユーザー操作フローのテスト強化

5. **テスト構造の整理**
   - `__tests__/` を各層に移動（domain/__tests__/, infrastructure/__tests__/ 等）
   - テストヘルパー・ファクトリの作成

### フェーズ 9: E2E テストの導入
**期間目安**: 3-4日
**目的**: Playwright による画面遷移・構造検証の E2E テスト

> **設計方針**: AQS にはランダム要素（問題選択、イベント生成、緊急対応確率等）が多数存在する。
> E2E テストではランダムな「内容」ではなく「構造」と「遷移」を検証する。
> 確率的要素（緊急対応の発生等）の検証はユニットテスト（フェーズ 8）で担保済み。
> primal-path の E2E 実装パターン（複数パス許容、test.skip、自動中間画面処理）を参考にする。

1. **Page Object パターン**の作成（primal-path-helper.ts を参考）
   - `AqsHelper` クラス: ランダムな中間画面を自動処理する `advanceToPhase()` メソッドを含む
   - 選択肢の順序に依存しない `answerAnyOption()` メソッド
2. **基本フローテスト（構造と遷移の検証）**
   - タイトル画面の要素が存在すること
   - ゲーム開始操作でスプリント開始画面に遷移すること
   - クイズ画面に問題と4つの選択肢が表示されること（具体的な問題内容は検証しない）
   - 回答後に正解/不正解いずれかのフィードバックが表示されること
   - ゲーム完走後に結果画面が表示され、グレード（S/A/B/C/D）が存在すること
3. **ゲーミング機能テスト（画面遷移の検証）**
   - 勉強会モード: ジャンル選択画面 → 問題画面 → 結果画面の遷移
   - デイリークイズ: 問題表示 → 回答 → スコア表示（日付シード付きで安定）
   - 実績画面: 画面表示と要素の存在確認
   - 履歴画面: 画面表示と要素の存在確認
4. **セーブ/ロード テスト**
   - ゲーム途中のリロードで状態が復元されること（具体的な問題内容は検証しない）
5. **E2E テストで検証しないもの（ユニットテストで担保）**
   - 特定の問題が出題されること
   - 緊急対応イベントの発生/非発生
   - 特定のキャラクターコメントの内容
   - 特定のコンボ数やスコア値

### フェーズ 10: 最終検証とクリーンアップ
**期間目安**: 1-2日
**目的**: 全テストパス、不要コード削除、ドキュメント整理

1. 全テスト（ユニット + E2E）の実行と確認
2. 未使用コード・型の削除（旧 `EngineerType` 等）
3. 後方互換の再エクスポート整理
4. カバレッジ目標の確認
5. lint / typecheck の確認
6. PR 作成

---

## 4. 適用する設計原則とデザインパターン

### 4.1 SOLID 原則

| 原則 | 適用箇所 | 具体策 |
|------|---------|--------|
| **S**: Single Responsibility | useGame.ts, ResultScreen.tsx | Reducer 化、コンポーネント分割 |
| **O**: Open/Closed | AudioPort, StoragePort | インターフェースによる拡張ポイント |
| **L**: Liskov Substitution | Storage 実装 | LocalStorage ↔ InMemory 置換可能 |
| **I**: Interface Segregation | UseGameReturn | 機能別インターフェース分割 |
| **D**: Dependency Inversion | 全インフラ依存 | Port/Adapter パターン |

### 4.2 DRY 原則

| 対象 | 現状 | 改善 |
|------|------|------|
| マイグレーション処理 | result-storage, history-storage で重複 | 共通マイグレーションユーティリティ |
| localStorage アクセス | 6ファイルで同様のパターン | StorageAdapter に集約 |
| カラー定数 | constants.ts とスタイルに分散 | デザイントークンに一元化 |

### 4.3 DbC（Design by Contract）原則

| 契約 | 内容 |
|------|------|
| ゲーム不変条件 | スプリント数 ≥ 1、スコア ≥ 0、負債 ≥ 0 |
| 問題選択事前条件 | 問題プール ≠ 空、usedIndices ⊂ 問題インデックス範囲 |
| 回答評価事後条件 | 正解/不正解のスコア更新が正しい範囲 |
| グレード分類不変条件 | 全スコアがいずれかのグレードに分類される |

### 4.4 デザインパターン

| パターン | 適用箇所 | 目的 |
|---------|---------|------|
| **Repository** | Storage 系 | データアクセスの抽象化 |
| **Adapter** | Audio, Storage, Random | 外部依存の差し替え可能化 |
| **Strategy** | 難易度設定、グレード判定 | アルゴリズムの差し替え |
| **Factory** | テストデータ生成 | テスト用データの一元生成 |
| **Observer** | 実績通知 | 疎結合なイベント通知 |
| **Reducer** | ゲーム状態管理 | 予測可能な状態遷移 |
| **Compound Component** | ResultScreen | 柔軟なコンポーネント構成 |
| **Page Object** | E2E テスト | テストの保守性向上 |

---

## 5. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| リファクタリング中のリグレッション | 高 | フェーズ毎のテスト全パス確認 |
| 移行の中途半端な状態 | 中 | 各フェーズで動作する状態を維持 |
| 型定義の破壊的変更 | 中 | 再エクスポートによる後方互換維持 |
| パフォーマンス低下 | 低 | Reducer 化による不要再描画の削減 |
| E2E テストのフレーキー化 | 中 | ランダム要素の内容を検証せず構造のみ検証、確率的要素はユニットテストで担保 |

---

## 6. 成功基準

- [ ] 全ユニットテストがパス
- [ ] 全 E2E テストがパス
- [ ] カバレッジ目標: domain 層 85%以上、全体 50%以上
- [ ] `npm run ci`（lint + typecheck + test + build）が成功
- [ ] ドメイン層に副作用がないことの保証
- [ ] 各層の依存方向が正しいことの確認

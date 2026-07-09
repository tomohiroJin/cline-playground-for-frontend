# Picture Puzzle ギャラリー化 フェーズ4「面白さ（新モード）」設計書

> 親設計書: `2026-07-07-picture-puzzle-gallery-brushup-design.md` §5 フェーズ4
> P1(#158)/P2(#159)/P3(#160) マージ済の最終フェーズ。本書は実装レベル設計。

## 1. 目的

ギャラリー体験に「継続動機」と「やり込み」を足す2モードを追加する。既存の盤面ロジックへの
侵襲を最小化し、シード・達成判定はドメイン/ユースケースへ配置する（UI 都合を持ち込まない）。

- **本日の一枚（デイリー）**: 日替わりで固定の作品＋難易度を出題（日付シード固定）。自己ベスト更新の習慣化。
- **鑑定チャレンジ**: 既存作品にタイム＋手数の達成条件を付与し、達成度で鑑定メダル（銅/銀/金）。

## 2. スコープと確定した設計判断

| 項目 | 決定 |
|---|---|
| スコープ | デイリーと鑑定チャレンジの**両方を本フェーズで**実装 |
| チャレンジ条件 | **タイム＋手数の両方**を評価し、達成度で銅/銀/金メダル |
| デイリー出題範囲 | **全展6室15点から**（アンロック状態に依存しない＝全員同じ一枚） |
| メダルの永続化 | **しない**。既存 `bestTime`/`bestMoves` から都度再評価して表示（新規キー不要） |
| 再シャッフル決定性 | seed＋試行番号で rng を決定的に派生（同日同一配置を保証） |
| 不純な日付取得 | `new Date()` はプレゼンテーション層のみ。日付文字列を純粋関数へ渡す |

## 3. 安全境界（親設計書 §4 厳守）

picture-puzzle 専用コードのみ変更。`domain/puzzle/*`・`application/use-cases/*` は「フェーズ4のみ最小限」。
- 触ってよい: `src/domain/puzzle/*`・`src/application/use-cases/*`・`src/presentation/*`・
  `src/components/{TitleScreen,SetupSection,PuzzleSections}.tsx`・`src/pages/PuzzlePage.tsx`・
  `src/data/themes.ts`（参照のみ）・`src/shared/*`（puzzle 専用ユーティリティ）
- 触らない: `src/styles/GlobalStyle.ts`・`src/styles/tokens/*`・`src/App.tsx`・
  `src/pages/GameListPage.tsx`・`src/features/*`
- **新規 localStorage キーを追加しない**。

## 4. 基盤: シード付きシャッフル

現状 `shuffle-service.ts` は `Math.random()` を1箇所直呼び。solvability は「合法手で実際に混ぜる」
方式で保証されており、シード化しても保たれる。

### 4.1 ドメイン純粋関数（新規・`src/domain/puzzle/`）

```
createSeededRng(seed: number): () => number
  mulberry32 等の決定的 PRNG。同一 seed → 同一の [0,1) 数列。外部依存ゼロ。

dateStringToSeed(yyyymmdd: string): number
  'YYYYMMDD'（例 '20260709'）→ number。決定的。事前条件: 8桁数字（DbC で検証）。
```

### 4.2 既存関数のシード対応（後方互換）

```
shufflePuzzle(board, moves, rng: () => number = Math.random)
  第3引数 rng を追加（default Math.random）。通常プレイは呼び出し不変で挙動不変。

initializePuzzle(division, options?: { seed?: number; shuffleMovesOverride?: number })
  seed 未指定時は現状どおり Math.random。seed 指定時は再シャッフル各試行 attempt(0..N) で
  createSeededRng(seed + attempt) を用いる。これにより「完成状態を引いたら再シャッフル」ループが
  決定的かつ完成回避を両立し、同日同一 seed で必ず同一配置になる（受け入れ基準）。
```

通常プレイ（seed なし）への影響がないことを型と default 引数で担保する。

## 5. 本日の一枚（デイリー）

### 5.1 出題選択（新規純粋関数）

`src/application/use-cases/select-daily-puzzle.ts`（または `domain/puzzle/services/daily-picker.ts`）:

```
selectDailyPuzzle(themes, seed): { imageId: string; filename: string; division: number }
  1. 全テーマの images をフラット化（全15点・アンロック状態は無視）
  2. 作品 = images[seed % images.length]
  3. 難易度 = DAILY_DIVISIONS[seed % DAILY_DIVISIONS.length]（DAILY_DIVISIONS = [3, 4, 5]）
  いずれも決定的。同一 seed → 同一出題。
```

### 5.2 フロー

TitleScreen「本日の一枚」→ `dateStringToSeed(todayString)` で seed 生成（今日の日付は
presentation で取得）→ `selectDailyPuzzle` で画像+難易度確定 → SetupSection を経由せず
seed 付きで直接プレイ開始（`initializePuzzle(division, { seed })`）。
画像 URL は `filename` から `/images/default/{filename}` で解決（既存 ThemeSelector と同形式）。

### 5.3 表示・永続化

- 「本日の作品」ラベルと日付を表示。
- ベストは既存 `PuzzleRecord`(imageId×division) にそのまま記録（**新規キー不要**）。

## 6. 鑑定チャレンジ

### 6.1 達成判定（新規ドメイン純粋関数・`src/domain/puzzle/services/challenge-evaluator.ts`）

```
type ChallengeMedal = 'gold' | 'silver' | 'bronze';

evaluateChallenge(input: {
  elapsedSeconds: number;
  actualMoves: number;
  optimalMoves: number;  // = division² × 2（既存 useGameFlow と同一定義）
}): ChallengeMedal
  timeLimit  = optimalMoves × MEDAL_TIME_SECONDS_PER_OPTIMAL_MOVE  (定数=3秒)
  moveLimit  = round(optimalMoves × MEDAL_MOVE_MARGIN_RATIO)       (定数=1.5)
  withinTime = elapsedSeconds <= timeLimit
  withinMove = actualMoves    <= moveLimit
  両方 → 'gold' / 片方 → 'silver' / どちらも達成せず（=クリアのみ）→ 'bronze'
```

定数は `MEDAL_*` として名前付きで置き、後日の調整を容易にする（例: division 4 は optimal=32 →
timeLimit=96秒・moveLimit=48手。親設計書の例「90秒以内・最適手数+10以内」に整合するオーダー）。

### 6.2 フロー

TitleScreen「鑑定チャレンジ」→ 既存 SetupSection でテーマ/難易度選択（チャレンジ条件を併記）→
通常シャッフルでプレイ（**シード不要**）→ 完成時に `evaluateChallenge` でメダル判定 →
リザルトに達成条件と獲得メダルを表示。

### 6.3 表示・永続化

- リザルトに獲得メダル（銅/銀/金）と条件（制限時間・手数）を表示。
- **メダルは永続化しない**。収蔵目録では既存 `bestTime`/`bestMoves`＋division から
  `evaluateChallenge` を都度再評価してメダルを表示できる（新規キー不要・任意表示）。

## 7. モード状態と UI

- `PuzzlePage` にローカル `mode: 'normal' | 'daily' | 'challenge'` を追加（既存 `showTitle`/
  `showCollection` と同流儀の最小侵襲）。
- TitleScreen に「本日の一枚」「鑑定チャレンジ」ボタンを追加（`EnterButton`/`SecondaryButton` の
  トーンに倣い galleryTokens で統一。P3 の focus-visible/44px パターンを踏襲）。
- `handleStartGame`/`usePuzzleGame.initialize` に mode/seed を通す経路を拡張。通常は省略で従来どおり。

## 8. テスト方針（TDD・親設計書 §6 準拠・ドメイン90%+）

- `createSeededRng`: 同一 seed → 同一数列、異なる seed → 異なる数列。
- `dateStringToSeed`: 既知入力→既知 seed、不正入力で例外（DbC）。
- `shufflePuzzle` シード版: 同一 rng → **同一配置**（既存の非決定的テストの弱点を解消）。
- `initializePuzzle` シード版: 同一 seed → 同一配置（再シャッフル経路含む決定性）。seed 無し時は従来動作。
- `selectDailyPuzzle`: 同一 seed → 同一出題、seed 変化で出題が変わり得る、全15点が選ばれ得る。
- `evaluateChallenge`: gold/silver/bronze の各境界（時間のみ・手数のみ・両方・どちらも）を検証。
- ドメインに `new Date()` を持ち込まない（日付は文字列で注入）ことを担保。
- 回帰: 通常プレイ（seed なし）が従来どおり動くこと、他12ゲーム非波及。

## 9. 受け入れ基準（親設計書 §5 準拠）

- [ ] デイリーは同日同一シードで同一の作品・難易度・配置を再現する。
- [ ] チャレンジのメダル判定（タイム＋手数）が銅/銀/金で正しく付与される。
- [ ] 既存の通常プレイに影響しない（seed なしで従来動作）。
- [ ] 新規 localStorage キーを追加していない。
- [ ] シード・日付・達成判定・デイリー選択がドメイン/ユースケースの純粋関数に置かれ、
      `new Date()` 等の副作用が presentation に閉じている。
- [ ] 他12ゲームの見た目・挙動に影響しない。

## 10. アウトオブスコープ（backlog・親設計書明記）

- 回転ピース変種・ぼかしミステリー展・企画展ローテーション（名前のみ・実装見送り）。
- デイリー連続達成日数・日別履歴など時系列に依存する記録（新規 localStorage キーが必要なため見送り）。
- TimerPort への計時移行（現行の interval 方式を踏襲し、タイムアタックの残時間表示は presentation で算出）。

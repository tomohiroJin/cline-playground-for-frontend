# RISK LCD ブラッシュアップ — タスクチェックリスト

## 凡例

- `[ ]` 未着手
- `[x]` 完了
- 括弧内はストリーム: `[A]` デイリー, `[B]` 共有/ゴースト, `[C]` オンボーディング

---

## Sprint 1: デイリーチャレンジ

### Phase 1-1: シード付き乱数基盤

> 前提: なし | ストリーム: A

- [x] **T-1.1.1** `[A]` `utils/seeded-random.ts` 新規作成 — `SeededRand` クラス（mulberry32 PRNG）
  - `int(n)`, `pick(arr)`, `chance(p)`, `shuffle(arr)` の4メソッド
  - 既存 `Rand` と同一 API
- [x] **T-1.1.2** `[A]` `utils/seeded-random.ts` — `dateToSeed(dateStr)` 関数（FNV-1a ハッシュ）
- [x] **T-1.1.3** `[A]` `utils/seeded-random.ts` — `getDailyId()` 関数（YYYY-MM-DD 形式）
- [x] **T-1.1.4** `[A]` `utils/seeded-random.test.ts` 新規作成 — ユニットテスト
  - 同一シードで同一結果
  - 異なるシードで異なる結果
  - `dateToSeed` の決定論性テスト
  - `getDailyId` のフォーマットテスト
- [x] **T-1.1.5** `[A]` `utils/index.ts` 更新 — `SeededRand`, `dateToSeed`, `getDailyId` を re-export

---

### Phase 1-2: デイリーゲーム状態

> 前提: Phase 1-1 完了 | ストリーム: A

- [x] **T-1.2.1** `[A]` `types.ts` 更新 — `DailyData` インターフェース追加
  - `date: string`, `played: boolean`, `bestScore: number`, `firstPlayRewarded: boolean`
- [x] **T-1.2.2** `[A]` `types.ts` 更新 — `SaveData` に `daily?: DailyData` フィールド追加
- [x] **T-1.2.3** `[A]` `types.ts` 更新 — `ScreenId` に `'D'` 追加
- [x] **T-1.2.4** `[A]` `types.ts` 更新 — `GameState` に `dailyMode: boolean` フィールド追加
- [x] **T-1.2.5** `[A]` `hooks/useStore.ts` 更新 — `getDailyData()` メソッド追加
- [x] **T-1.2.6** `[A]` `hooks/useStore.ts` 更新 — `isDailyPlayed()` メソッド追加
- [x] **T-1.2.7** `[A]` `hooks/useStore.ts` 更新 — `recordDailyPlay(score)` メソッド追加
  - 初回プレイ報酬(+50PT) + 自己ベスト更新報酬(差分10%)
- [ ] **T-1.2.8** `[A]` `hooks/useStore.test.ts` 更新 — デイリーメソッドのテスト追加

---

### Phase 1-3: デイリーモードUI

> 前提: Phase 1-2 完了 | ストリーム: A

- [x] **T-1.3.1** `[A]` `constants/game-config.ts` 更新 — `MENUS` に `'DAILY'` をインデックス1に挿入
- [x] **T-1.3.2** `[A]` `components/styles.ts` 更新 — デイリー画面用スタイルコンポーネント追加
  - `DailyLayer`, `DailyTitle`, `DailyDate`, `DailyModifier`, `DailyStatus`, `DailyAction`
- [x] **T-1.3.3** `[A]` `components/DailyScreen.tsx` 新規作成 — デイリー条件表示画面
  - 日次ID表示、モディファイア一覧、プレイ状態表示、開始ボタン
- [x] **T-1.3.4** `[A]` `components/TitleScreen.tsx` 更新 — メニューインデックスの対応更新
- [x] **T-1.3.5** `[A]` `components/RiskLcdGame.tsx` 更新 — `DailyScreen` のルーティング追加
- [x] **T-1.3.6** `[A]` `hooks/useGameEngine.ts` 更新 — `dispatch` のメニュー処理を更新
  - DAILY 選択時に `ScreenId: 'D'` に遷移
  - 'D' 画面での入力ディスパッチ追加

---

### Phase 1-4: RNG 注入 + デイリーゲームロジック

> 前提: Phase 1-2, 1-3 完了 | ストリーム: A

- [x] **T-1.4.1** `[A]` `hooks/phases/types.ts` 更新 — `RngApi` インターフェース定義、`PhaseContext` に `rng` ref 追加
- [x] **T-1.4.2** `[A]` `hooks/useGameEngine.ts` 更新 — RNG ref の管理（通常: `Rand` ラッパー / デイリー: `SeededRand`）
- [x] **T-1.4.3** `[A]` `utils/game-logic.ts` 更新 — `wPick` に `rng?: () => number` 引数追加（デフォルト: `Math.random`）
- [x] **T-1.4.4** `[A]` `hooks/phases/useRunningPhase.ts` 更新 — `startGame` にモード引数追加
  - `mode: 'normal' | 'daily' | 'practice'`
  - デイリーモード時: `SeededRand` インスタンスを RNG ref に設定
- [x] **T-1.4.5** `[A]` `hooks/phases/useRunningPhase.ts` 更新 — `announce`, `pickObs`, `nextCycle` の `Rand.*` を `ctx.rng.current.*` に置換
- [x] **T-1.4.6** `[A]` `hooks/phases/usePerkPhase.ts` 更新 — `showPerks` 内の `Rand.shuffle` × 2箇所を `ctx.rng.current.shuffle` に置換
- [x] **T-1.4.7** `[A]` `hooks/phases/useResultPhase.ts` 更新 — デイリーモード時の報酬計算
  - `store.recordDailyPlay(score)` を呼び出し
- [ ] **T-1.4.8** `[A]` 結合テスト — デイリーモードの一連フロー確認（手動）
  - 同日に同一条件（モディファイア・障害・パーク候補）が再現されることを検証

---

## Sprint 2: リザルト共有

### Phase 2-1: 共有URLユーティリティ

> 前提: なし（独立） | ストリーム: B

- [x] **T-2.1.1** `[B]` `utils/share.ts` 新規作成 — `ShareParams` 型定義
- [x] **T-2.1.2** `[B]` `utils/share.ts` — `encodeShareUrl(params)` 関数
  - URLSearchParams ベースでクエリ文字列生成
- [x] **T-2.1.3** `[B]` `utils/share.ts` — `decodeShareUrl(search)` 関数
  - クエリ文字列パース、バリデーション付き
- [x] **T-2.1.4** `[B]` `utils/share.ts` — `encodeBuild(styles, perks)` 関数
  - スタイルID + パークIDの短縮コード化
- [x] **T-2.1.5** `[B]` `utils/share.ts` — `decodeBuild(code)` 関数
  - 短縮コードからスタイル名・パーク名の復元
- [x] **T-2.1.6** `[B]` `utils/share.test.ts` 新規作成 — ユニットテスト
  - エンコード→デコード往復テスト
  - 不正入力のハンドリングテスト
  - ビルドコードの往復テスト
- [x] **T-2.1.7** `[B]` `utils/index.ts` 更新 — 共有ユーティリティを re-export

---

### Phase 2-2: シェアカードUI

> 前提: Phase 2-1 完了 | ストリーム: B

- [x] **T-2.2.1** `[B]` `components/styles.ts` 更新 — シェアボタン用スタイル追加
  - `ShareRow`, `ShareButton`
- [x] **T-2.2.2** `[B]` `components/ResultScreen.tsx` 更新 — Props 拡張（`equippedStyles`, `dailyId`, `ghostData`）
- [x] **T-2.2.3** `[B]` `components/RiskLcdGame.tsx` 更新 — `ResultScreen` への新規 Props 受け渡し
- [x] **T-2.2.4** `[B]` `components/ResultScreen.tsx` 更新 — 共有ボタンの追加
  - 「SHARE」: `navigator.share` 対応時のみ表示
  - 「COPY」: 常に表示
- [x] **T-2.2.5** `[B]` `components/ResultScreen.tsx` 更新 — 共有テキスト生成ロジック
  - デイリーモード判定、ビルド要約テキスト生成
- [x] **T-2.2.6** `[B]` `components/ResultScreen.tsx` 更新 — コピー成功フィードバック
  - ボタンテキスト一時変更（"COPIED!" → 2秒後に戻る）

---

### Phase 2-3: 共有URL受信処理

> 前提: Phase 2-1 完了 | ストリーム: B

- [ ] **T-2.3.1** `[B]` `components/RiskLcdGame.tsx` 更新 — マウント時にURLクエリをチェック
  - `decodeShareUrl(window.location.search)` の呼び出し
- [ ] **T-2.3.2** `[B]` `hooks/useGameEngine.ts` 更新 — 共有データの初期表示処理
  - 閲覧モードリザルト表示 or デイリー導線表示
- [ ] **T-2.3.3** `[B]` 結合テスト — 共有URL生成→受信の一連フロー確認（手動）

---

## Sprint 3: ゴースト表示

### Phase 3-1: ゴーストデータ収集

> 前提: なし（独立） | ストリーム: B

- [x] **T-3.1.1** `[B]` `utils/ghost.ts` 新規作成 — `GhostRecorder` クラス
  - `record(lane)`, `compress()`, `reset()` メソッド
- [x] **T-3.1.2** `[B]` `utils/ghost.ts` — `GhostPlayer` クラス
  - コンストラクタで圧縮データを展開
  - `getPosition(tick)`, `length` プロパティ
- [x] **T-3.1.3** `[B]` `utils/ghost.ts` — ランレングス圧縮/展開の内部関数
  - `rleEncode(log)`, `rleDecode(data)` — バイナリパック + Base64url
- [x] **T-3.1.4** `[B]` `utils/ghost.test.ts` 新規作成 — ユニットテスト
  - 記録→圧縮→展開の往復テスト
  - 空データのハンドリング
  - 境界値テスト（1エントリ、最大80エントリ）
- [x] **T-3.1.5** `[B]` `utils/index.ts` 更新 — ゴーストユーティリティを re-export

---

### Phase 3-2: ゲームループ統合

> 前提: Phase 3-1 完了 | ストリーム: B

- [x] **T-3.2.1** `[B]` `types.ts` 更新 — `GameState` に `ghostLog: number[]` フィールド追加
- [x] **T-3.2.2** `[B]` `hooks/phases/useRunningPhase.ts` 更新 — `createGameState` に `ghostLog: []` 初期化追加
- [x] **T-3.2.3** `[B]` `hooks/phases/useRunningPhase.ts` 更新 — `resolve()` 内でレーン位置を `ghostLog` に記録
- [ ] **T-3.2.4** `[B]` `hooks/phases/useResultPhase.ts` 更新 — リザルト時に `GhostRecorder.compress()` で圧縮
- [x] **T-3.2.5** `[B]` `utils/share.ts` 更新 — `ShareParams` に `ghost` フィールド追加、URL生成に反映

---

### Phase 3-3: ゴースト再生UI

> 前提: Phase 3-1, 3-2 完了 | ストリーム: B

- [ ] **T-3.3.1** `[B]` `hooks/useGameEngine.ts` 更新 — URLからゴーストデータ読み込み、`GhostPlayer` インスタンス管理
- [ ] **T-3.3.2** `[B]` `hooks/useGameEngine.ts` 更新 — `RenderState` にゴーストレーン位置フィールド追加
- [ ] **T-3.3.3** `[B]` `components/LaneGrid.tsx` 更新 — ゴーストドット表示（点滅アニメーション）
  - `SegState` に `'ghostPlayer'` を新規追加（既存の `'ghost'` ArtKey との混同防止）
  - 対象レーンのセグメント行5に `◇` 表示
  - 500ms on / 300ms off の点滅
- [ ] **T-3.3.4** `[B]` `components/GameScreen.tsx` 更新 — ゴーストレーン位置を `LaneGrid` に受け渡し
- [x] **T-3.3.5** `[B]` `components/styles.ts` 更新 — ゴースト表示用スタイル追加（点滅アニメーション）
- [ ] **T-3.3.6** `[B]` 結合テスト — ゴースト記録→圧縮→URL→展開→再生の一連フロー確認（手動）

---

## Sprint 4: 初回オンボーディング

### Phase 4-1: チュートリアル

> 前提: なし（独立） | ストリーム: C

- [x] **T-4.1.1** `[C]` `types.ts` 更新 — `ScreenId` に `'TU'` 追加
- [x] **T-4.1.2** `[C]` `types.ts` 更新 — `SaveData` に `tutorialDone?: boolean` 追加
- [x] **T-4.1.3** `[C]` `hooks/useStore.ts` 更新 — マイグレーション処理追加
  - 既存ユーザー（`plays > 0`）は `tutorialDone = true` を自動設定
- [x] **T-4.1.4** `[C]` `hooks/useStore.ts` 更新 — `markTutorialDone()` メソッド追加
- [x] **T-4.1.5** `[C]` `components/styles.ts` 更新 — チュートリアル画面用スタイル追加
  - `TutorialLayer`, `TutorialStep`, `TutorialTitle`, `TutorialBody`, `TutorialAction`
- [x] **T-4.1.6** `[C]` `components/TutorialScreen.tsx` 新規作成 — 4ステップチュートリアル画面
  - Step 1: 予告の見方
  - Step 2: レーン移動（回避）
  - Step 3: 倍率とスコア
  - Step 4: パークとビルド構築
  - ACT ボタンで次ステップ進行、最終ステップで開始
- [x] **T-4.1.7** `[C]` `components/RiskLcdGame.tsx` 更新 — `TutorialScreen` のルーティング追加
- [x] **T-4.1.8** `[C]` `hooks/useGameEngine.ts` 更新 — GAME START 時のチュートリアル遷移判定
  - `!tutorialDone && plays === 0` → `ScreenId: 'TU'` に遷移
- [x] **T-4.1.9** `[C]` `hooks/useGameEngine.ts` 更新 — 'TU' 画面の入力ディスパッチ追加
  - ACT: 次ステップ or ゲーム開始
  - BACK: タイトルに戻る

---

### Phase 4-2: 練習モード

> 前提: なし（独立） | ストリーム: C

- [x] **T-4.2.1** `[C]` `types.ts` 更新 — `GameState` に `practiceMode: boolean` 追加
- [x] **T-4.2.2** `[C]` `constants/game-config.ts` 更新 — `MENUS` に `'PRACTICE'` をインデックス2に挿入
- [x] **T-4.2.3** `[C]` `components/TitleScreen.tsx` 更新 — メニューインデックスの対応更新
- [x] **T-4.2.4** `[C]` `hooks/useGameEngine.ts` 更新 — PRACTICE 選択時の処理追加
  - `startGame('practice')` 呼び出し
- [x] **T-4.2.5** `[C]` `hooks/phases/useRunningPhase.ts` 更新 — 練習モード時のステージ制御
  - `maxStg = 0`（ステージ1固定）、モディファイアなし
- [x] **T-4.2.6** `[C]` `hooks/phases/useResultPhase.ts` 更新 — 練習モードのリザルト処理
  - PT獲得なし、`updateBest()` スキップ
- [x] **T-4.2.7** `[C]` `components/ResultScreen.tsx` 更新 — 練習モードの表示分岐
  - タイトル: "PRACTICE CLEAR!" or "PRACTICE OVER"
  - PT表示: "PT獲得なし"

---

## 横断タスク

### コードメンテナンス

- [x] **T-X.1** `constants/game-config.ts` の `MENUS` 変更に伴う全インデックス参照の更新確認
  - `useGameEngine.ts` の `dispatch` 内 `switch` 文（`case 0:` 〜 `case 5:` に拡張）
  - `TitleScreen.tsx` のメニュー表示
  - **注意**: Sprint 1（DAILY追加）と Sprint 4（PRACTICE追加）で `MENUS` を2回変更する。並行実装時は先に MENUS の最終形を統合するか、順次実装にすること
- [x] **T-X.2** `ScreenId` 追加（'D', 'TU'）に伴う全 `switch` 文の網羅確認
- [x] **T-X.3** `GameState` フィールド追加（`dailyMode`, `ghostLog`, `practiceMode`）に伴う `createGameState` の初期値設定確認
- [x] **T-X.4** `SegState` に `'ghostPlayer'` 追加に伴う `LaneGrid` / `styles.ts` のスタイル定義確認

### テスト

- [x] **T-T.1** 全ユニットテスト実行・パス確認（`npm test`）
- [x] **T-T.2** 既存テスト（`RiskLcdGame.test.tsx`, `useStore.test.ts`, `game-logic.test.ts`, `random.test.ts`）の回帰確認
- [ ] **T-T.3** 手動テスト: 通常モード（既存機能の回帰なし）
- [ ] **T-T.4** 手動テスト: デイリーモード（同日再プレイで同条件、報酬付与、翌日リセット）
- [ ] **T-T.5** 手動テスト: 共有URL生成→コピー→新タブで開く→閲覧モード表示
- [ ] **T-T.6** 手動テスト: ゴースト付きプレイ（ゴースト表示・非干渉確認）
- [ ] **T-T.7** 手動テスト: 初回チュートリアル（4ステップ→ゲーム開始）
- [ ] **T-T.8** 手動テスト: 練習モード（ステージ1固定、スコア非記録、PT非獲得）
- [ ] **T-T.9** 手動テスト: 既存ユーザーのマイグレーション（チュートリアルスキップ）

---

## タスク集計

| Sprint | Phase | タスク数 | 完了 |
|--------|-------|---------|------|
| S1 | Phase 1-1: シード付き乱数基盤 | 5 | 5 |
| S1 | Phase 1-2: デイリーゲーム状態 | 8 | 7 |
| S1 | Phase 1-3: デイリーモードUI | 6 | 6 |
| S1 | Phase 1-4: RNG注入+デイリーロジック | 8 | 7 |
| S2 | Phase 2-1: 共有URLユーティリティ | 7 | 7 |
| S2 | Phase 2-2: シェアカードUI | 6 | 6 |
| S2 | Phase 2-3: 共有URL受信処理 | 3 | 0 |
| S3 | Phase 3-1: ゴーストデータ収集 | 5 | 5 |
| S3 | Phase 3-2: ゲームループ統合 | 5 | 4 |
| S3 | Phase 3-3: ゴースト再生UI | 6 | 1 |
| S4 | Phase 4-1: チュートリアル | 9 | 9 |
| S4 | Phase 4-2: 練習モード | 7 | 7 |
| 横断 | コードメンテナンス | 4 | 4 |
| 横断 | テスト | 9 | 2 |
| **合計** | | **88** | **70** |

### 未完了タスクまとめ

| タスク | 理由 |
|--------|------|
| T-1.2.8 | useStore.test.ts のデイリーメソッドテスト未追加 |
| T-1.4.8 | 手動テスト（デイリーフロー確認） |
| T-2.3.1〜T-2.3.3 | 共有URL受信処理（マウント時URLチェック + 閲覧モード表示）未実装 |
| T-3.2.4 | useResultPhase でのゴーストデータ圧縮処理未実装 |
| T-3.3.1〜T-3.3.4, T-3.3.6 | ゴースト再生UIの接続（GhostPlayer管理・LaneGrid表示）未実装 |
| T-T.3〜T-T.9 | 手動テスト未実施 |

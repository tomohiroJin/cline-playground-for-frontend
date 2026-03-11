# Phase 1: ストーリービジュアル強化 — タスクチェックリスト

## 進捗サマリー

| タスク | ステータス | 完了日 |
|--------|-----------|--------|
| P1-01 データ層整備 | [ ] 未着手 | - |
| P1-02 画像アセット生成 | [ ] 未着手 | - |
| P1-03 画像プリロード基盤 | [ ] 未着手 | - |
| P1-04 DialogueOverlay 改修 | [ ] 未着手 | - |
| P1-05 VsScreen 演出強化 | [ ] 未着手 | - |
| P1-06 ChapterTitleCard 新規 | [ ] 未着手 | - |
| P1-07 VictoryCutIn 新規 | [ ] 未着手 | - |
| P1-08 統合・遷移管理 | [ ] 未着手 | - |
| P1-09 テスト・動作確認 | [ ] 未着手 | - |

---

## P1-01: データ層整備

### 型定義の拡張
- [ ] `types.ts` に `PortraitSet` 型を追加
- [ ] `Character` 型に `portrait?: PortraitSet` フィールドを追加
- [ ] `Dialogue` 型に `expression?: DialogueExpression` フィールドを追加
- [ ] `StageDefinition` 型に `backgroundId?`, `chapterTitle?`, `chapterSubtitle?`, `isChapterFinale?` を追加
- [ ] `ScreenType` に `'chapterTitle'` と `'victoryCutIn'` を追加

### characters.ts の更新
- [ ] フリー対戦: rookie（ソウタ）のカラーを `#27ae60` に更新
- [ ] フリー対戦: regular（ケンジ）のカラーを `#2c3e50` に更新
- [ ] フリー対戦: ace（レン）のカラーを `#2c3e50` に更新
- [ ] 全キャラクターに `portrait` フィールドを追加（8キャラ分）
- [ ] `STORY_CHARACTERS` にユウ（yuu）を追加
- [ ] ユウ（yuu）の `reactions` を設定
- [ ] 背景IDマッピング `BACKGROUND_MAP` を追加

### dialogue-data.ts の更新
- [ ] ステージ 1-1 に `backgroundId: 'bg-clubroom'`, `chapterTitle`, `chapterSubtitle` を追加
- [ ] ステージ 1-2 に `backgroundId: 'bg-gym'` を追加
- [ ] ステージ 1-3 に `backgroundId: 'bg-school-gate'`, `isChapterFinale: true` を追加
- [ ] 既存ダイアログに適切な `expression` を追加（勝利・励まし場面で `'happy'`）

### テスト
- [ ] `characters.test.ts` が全パス
- [ ] `dialogue-data.test.ts` が全パス
- [ ] 型エラーがないこと（`tsc --noEmit`）

---

## P1-02: 画像アセット生成

### ディレクトリ作成
- [ ] `public/assets/portraits/` ディレクトリ作成
- [ ] `public/assets/backgrounds/` ディレクトリ作成
- [ ] `public/assets/cutins/` ディレクトリ作成

### 立ち絵の生成（16枚）
- [ ] `akira-normal.png` — 512x1024, PNG透過
- [ ] `akira-happy.png` — 512x1024, PNG透過
- [ ] `hiro-normal.png` — 512x1024, PNG透過
- [ ] `hiro-happy.png` — 512x1024, PNG透過
- [ ] `misaki-normal.png` — 512x1024, PNG透過
- [ ] `misaki-happy.png` — 512x1024, PNG透過
- [ ] `takuma-normal.png` — 512x1024, PNG透過
- [ ] `takuma-happy.png` — 512x1024, PNG透過
- [ ] `yuu-normal.png` — 512x1024, PNG透過
- [ ] `yuu-happy.png` — 512x1024, PNG透過
- [ ] `rookie-normal.png` — 512x1024, PNG透過
- [ ] `rookie-happy.png` — 512x1024, PNG透過
- [ ] `regular-normal.png` — 512x1024, PNG透過
- [ ] `regular-happy.png` — 512x1024, PNG透過
- [ ] `ace-normal.png` — 512x1024, PNG透過
- [ ] `ace-happy.png` — 512x1024, PNG透過

### 背景の生成（3枚）
- [ ] `bg-clubroom.webp` — 450x900, WebP
- [ ] `bg-gym.webp` — 450x900, WebP
- [ ] `bg-school-gate.webp` — 450x900, WebP

### 勝利カットインの生成（1枚）
- [ ] `victory-ch1.png` — 450x400, PNG

### 品質チェック
- [ ] 全画像のサイズ・フォーマットが仕様通り
- [ ] 立ち絵の背景が正しく透過されている
- [ ] キャラクター間でアートスタイルが統一されている
- [ ] 立ち絵と既存アイコンの整合性（髪型・配色が一致）
- [ ] ユウ（yuu）の 128px アイコンも生成（`public/assets/characters/yuu.png`）

---

## P1-03: 画像プリロード基盤

### useImagePreloader フック
- [ ] `hooks/useImagePreloader.ts` を作成
- [ ] `Image` オブジェクトによるプリロード処理を実装
- [ ] ロード進捗の追跡（`isLoaded`, `progress`, `errors`）
- [ ] アンマウント時のクリーンアップ処理
- [ ] 空配列時の即座完了

### アセットURL収集関数
- [ ] `getStageAssetUrls()` 関数を実装
- [ ] 背景画像URLの収集
- [ ] キャラ立ち絵URLの収集
- [ ] カットイン画像URLの収集（最終ステージの場合）

### テスト
- [ ] `useImagePreloader.test.ts` を作成
- [ ] 正常ロードのテスト
- [ ] エラー時のフォールバックテスト
- [ ] 空配列のテスト

---

## P1-04: DialogueOverlay 改修

### レイアウト変更
- [ ] 背景画像の全画面表示を実装
- [ ] 背景なし時のフォールバック（既存の暗い半透明背景）
- [ ] 暗めオーバーレイ（rgba(0,0,0,0.3)）の追加

### 立ち絵表示
- [ ] 発話キャラの立ち絵を中央配置で表示
- [ ] `portrait` 未定義時のアイコンフォールバック
- [ ] キャラ変更時のクロスフェード（200ms）
- [ ] 立ち絵の初回フェードイン（300ms）

### 表情差分
- [ ] `expression` に基づく画像切り替え
- [ ] 省略時の `'normal'` デフォルト処理

### テキストウィンドウ
- [ ] 半透明パネルデザイン（rgba(0,0,0,0.7)、角丸 8px）
- [ ] キャラ名表示（キャラカラー）
- [ ] 既存のテキスト送り機能の維持

### テスト
- [ ] 改修後も既存テストがパス
- [ ] 背景あり/なしの両方で正しく表示されること
- [ ] 立ち絵あり/なしの両方で正しく表示されること

---

## P1-05: VsScreen 演出強化

### 背景
- [ ] 2色グラデーション背景（プレイヤーカラー ← → CPUカラー）

### キャラクター表示
- [ ] 立ち絵（256x512相当）の左右配置
- [ ] `portrait` 未定義時のアイコン拡大フォールバック
- [ ] 左からのスライドイン（プレイヤー、200ms〜800ms）
- [ ] 右からのスライドイン（CPU、200ms〜800ms）

### VS テキスト
- [ ] 大きな「VS」テキスト（72px、太字、白+影）
- [ ] バウンスアニメーション（800ms）

### 情報表示
- [ ] キャラ名の表示（各キャラカラー）
- [ ] ステージ名・フィールド名の表示

### アニメーション
- [ ] 全体で約3秒の演出
- [ ] 最後のフェードアウト（500ms）
- [ ] `onComplete()` の正しいタイミング呼び出し

### テスト
- [ ] 改修後も既存テストがパス
- [ ] アニメーション完了後に `onComplete` が呼ばれること

---

## P1-06: ChapterTitleCard 新規

### コンポーネント作成
- [ ] `components/ChapterTitleCard.tsx` を作成
- [ ] Props 型定義（`chapter`, `title`, `subtitle?`, `backgroundUrl?`, `onComplete`）

### 表示
- [ ] ぼかし背景（blur 10px）+ 暗めオーバーレイ
- [ ] 章番号テキスト（18px、白半透明）
- [ ] タイトルテキスト（36px、白、太字、中央配置）
- [ ] サブタイトルテキスト（20px、白半透明）
- [ ] 背景なし時の黒背景フォールバック

### アニメーション
- [ ] 要素の段階的フェードイン
- [ ] 約4秒の全体演出
- [ ] タップ/クリックでスキップ可能
- [ ] フェードアウト後に `onComplete()` 呼び出し

### テスト
- [ ] `ChapterTitleCard.test.tsx` を作成
- [ ] レンダリングテスト
- [ ] スキップ操作のテスト
- [ ] `onComplete` コールバックのテスト

---

## P1-07: VictoryCutIn 新規

### コンポーネント作成
- [ ] `components/VictoryCutIn.tsx` を作成
- [ ] Props 型定義（`imageUrl`, `message?`, `onComplete`）

### 表示
- [ ] 黒背景のフェードイン
- [ ] カットイン画像のスケールアップ（0.8→1.0）+ フェードイン
- [ ] 「TO BE CONTINUED...」テキストのフェードイン
- [ ] ユーザー入力待ち（クリック/タップ/Enter/Space）

### アニメーション
- [ ] 画像表示までの演出（約1秒）
- [ ] テキスト表示（約2.5秒後）
- [ ] 入力後のフェードアウト（500ms）
- [ ] `onComplete()` の呼び出し

### テスト
- [ ] `VictoryCutIn.test.tsx` を作成
- [ ] レンダリングテスト
- [ ] ユーザー入力でのコールバックテスト
- [ ] デフォルトメッセージのテスト

---

## P1-08: 統合・遷移管理

### ScreenType 更新
- [ ] `AirHockeyGame.tsx` の ScreenType に `'chapterTitle'` を追加
- [ ] `AirHockeyGame.tsx` の ScreenType に `'victoryCutIn'` を追加

### 遷移ハンドラ
- [ ] `handleChapterTitleComplete()` を追加（→ preDialogue）
- [ ] `handleVictoryCutInComplete()` を追加（→ result）
- [ ] `handleSelectStage()` を改修（chapterTitle 判定を追加）
- [ ] `handlePostDialogueComplete()` を改修（victoryCutIn 判定を追加）

### コンポーネント統合
- [ ] `ChapterTitleCard` のレンダリング追加（screen === 'chapterTitle'）
- [ ] `VictoryCutIn` のレンダリング追加（screen === 'victoryCutIn'）
- [ ] `DialogueOverlay` に背景URL を渡す処理を追加
- [ ] `VsScreen` の既存呼び出しを確認（Props 変更なし）

### 画像プリロード統合
- [ ] ステージ選択時に `getStageAssetUrls()` でURL収集
- [ ] `useImagePreloader` フックの統合
- [ ] ロード中の表示（ローディングインジケーター or 即座遷移）

### テスト
- [ ] ストーリーモードの全遷移パスが正しいこと
- [ ] フリーモードに影響がないこと
- [ ] 型エラーがないこと

---

## P1-09: テスト・動作確認

### 既存テスト
- [ ] `npm test` で全テストパス
- [ ] `tsc --noEmit` で型エラーなし
- [ ] `npm run lint`（あれば）でエラーなし

### 新規テスト
- [ ] `ChapterTitleCard.test.tsx` 作成・パス
- [ ] `VictoryCutIn.test.tsx` 作成・パス
- [ ] `useImagePreloader.test.ts` 作成・パス

### 通しプレイ確認
- [ ] タイトル → ストーリー → ステージ選択の遷移
- [ ] ステージ 1-1: チャプタータイトル → ダイアログ（背景+立ち絵） → VS → 試合 → ダイアログ → リザルト
- [ ] ステージ 1-2: ダイアログ（背景+立ち絵） → VS → 試合 → ダイアログ → リザルト
- [ ] ステージ 1-3: ダイアログ（背景+立ち絵） → VS → 試合 → ダイアログ → 勝利カットイン → リザルト
- [ ] ステージ 1-3 敗北時: 勝利カットインがスキップされること
- [ ] フリー対戦: 既存動作に変更がないこと
- [ ] キャラカラーが設計書と一致していること

### パフォーマンス確認
- [ ] 画像プリロードが正しく動作（遷移時にちらつきなし）
- [ ] メモリ使用量が許容範囲内
- [ ] アニメーションが60fpsで動作

---

## 完了条件

- [ ] 全チェックボックスが完了
- [ ] 既存テスト + 新規テストが全パス
- [ ] ストーリーモード通しプレイで問題なし
- [ ] フリーモードに影響なし

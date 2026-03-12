# Phase 1: ストーリービジュアル強化 — タスクチェックリスト

## 進捗サマリー

| タスク | ステータス | 完了日 |
|--------|-----------|--------|
| P1-01 データ層整備 | [x] 完了 | 2026-03-12 |
| P1-02 画像アセット生成 | [x] 完了 | 2026-03-13 |
| P1-03 画像プリロード基盤 | [x] 完了 | 2026-03-12 |
| P1-04 DialogueOverlay 改修 | [x] 完了 | 2026-03-13 |
| P1-05 VsScreen 演出強化 | [x] 完了 | 2026-03-13 |
| P1-06 ChapterTitleCard 新規 | [x] 完了 | 2026-03-12 |
| P1-07 VictoryCutIn 新規 | [x] 完了 | 2026-03-12 |
| P1-08 統合・遷移管理 | [x] 完了 | 2026-03-13 |
| P1-09 テスト・動作確認 | [~] 進行中 | - |

---

## P1-01: データ層整備

### 型定義の拡張
- [x] `types.ts` に `PortraitSet` 型を追加
- [x] `Character` 型に `portrait?: PortraitSet` フィールドを追加
- [x] `Dialogue` 型に `expression?: DialogueExpression` フィールドを追加
- [x] `StageDefinition` 型に `backgroundId?`, `chapterTitle?`, `chapterSubtitle?`, `isChapterFinale?` を追加
- [x] `ScreenType` に `'chapterTitle'` と `'victoryCutIn'` を追加（P1-08 で実施済み）

### characters.ts の更新
- [x] フリー対戦: rookie（ソウタ）のカラーを `#27ae60` に更新
- [x] フリー対戦: regular（ケンジ）のカラーを `#2c3e50` に更新
- [x] フリー対戦: ace（レン）のカラーを `#2c3e50` に更新
- [x] 全キャラクターに `portrait` フィールドを追加（8キャラ分）
- [x] `STORY_CHARACTERS` にユウ（yuu）を追加
- [x] ユウ（yuu）の `reactions` を設定
- [x] 背景IDマッピング `BACKGROUND_MAP` を追加

### dialogue-data.ts の更新
- [x] ステージ 1-1 に `backgroundId: 'bg-clubroom'`, `chapterTitle`, `chapterSubtitle` を追加
- [x] ステージ 1-2 に `backgroundId: 'bg-gym'` を追加
- [x] ステージ 1-3 に `backgroundId: 'bg-school-gate'`, `isChapterFinale: true` を追加
- [x] 既存ダイアログに適切な `expression` を追加（勝利・励まし場面で `'happy'`）

### テスト
- [x] `characters.test.ts` が全パス
- [x] `dialogue-data.test.ts` が全パス
- [x] 型エラーがないこと（`tsc --noEmit`）
- [x] `p1-01-data-layer.test.ts` 新規39テスト全パス

---

## P1-02: 画像アセット生成

> **プロンプト・手順の詳細**: `image-generation-guide.md` を参照
> **生成ツール**: Google Nanobanana2（透過背景非対応 → クロマキー方式で対応）

### ディレクトリ作成
- [x] `public/assets/portraits/` ディレクトリ作成
- [x] `public/assets/vs/` ディレクトリ作成
- [x] `public/assets/backgrounds/` ディレクトリ作成
- [x] `public/assets/cutins/` ディレクトリ作成

### Step 1: 立ち絵の生成（16枚、クロマキー背景付き）
- [x] `akira-normal.png` — 512x1024, グリーンバック
- [x] `akira-happy.png` — 512x1024, グリーンバック
- [x] `hiro-normal.png` — 512x1024, グリーンバック
- [x] `hiro-happy.png` — 512x1024, グリーンバック
- [x] `misaki-normal.png` — 512x1024, グリーンバック
- [x] `misaki-happy.png` — 512x1024, グリーンバック
- [x] `takuma-normal.png` — 512x1024, グリーンバック
- [x] `takuma-happy.png` — 512x1024, グリーンバック
- [x] `yuu-normal.png` — 512x1024, **ブルーバック**（服が緑のため）
- [x] `yuu-happy.png` — 512x1024, **ブルーバック**
- [x] `rookie-normal.png` — 512x1024, **ブルーバック**（服が緑のため）
- [x] `rookie-happy.png` — 512x1024, **ブルーバック**
- [x] `regular-normal.png` — 512x1024, グリーンバック
- [x] `regular-happy.png` — 512x1024, グリーンバック
- [x] `ace-normal.png` — 512x1024, グリーンバック
- [x] `ace-happy.png` — 512x1024, グリーンバック

### Step 2: 背景の生成（3枚、透過不要）
- [x] `bg-clubroom.webp` — 450x900, WebP
- [x] `bg-gym.webp` — 450x900, WebP
- [x] `bg-school-gate.webp` — 450x900, WebP

### Step 3: 勝利カットインの生成（1枚、透過不要）
- [x] `victory-ch1.png` — 450x400, PNG

### Step 4: ユウのアイコン生成（1枚）
- [x] `yuu.png` — 128x128, **ブルーバック** → `public/assets/characters/yuu.png`

### Step 5: 後処理 — クロマキー背景除去
- [x] グリーンバック立ち絵 12枚の透過変換（ImageMagick: `convert -fuzz 30% -fill none -opaque`）
- [x] ブルーバック立ち絵 4枚の透過変換（実際の背景色を検出して除去）
- [x] ユウアイコンのブルーバック除去
- [x] フリンジ（にじみ）のチェックと修正
- [x] キャラの緑/青の要素が誤って透過されていないことを確認

### Step 6: VS画面用画像のトリミング（7枚）
- [x] `akira-vs.png` — 透過済み akira-normal.png の上半身 → 256x512
- [x] `hiro-vs.png` — 透過済み hiro-normal.png の上半身 → 256x512
- [x] `misaki-vs.png` — 透過済み misaki-normal.png の上半身 → 256x512
- [x] `takuma-vs.png` — 透過済み takuma-normal.png の上半身 → 256x512
- [x] `rookie-vs.png` — 透過済み rookie-normal.png の上半身 → 256x512
- [x] `regular-vs.png` — 透過済み regular-normal.png の上半身 → 256x512
- [x] `ace-vs.png` — 透過済み ace-normal.png の上半身 → 256x512

### 品質チェック
- [x] 全画像のサイズ・フォーマットが仕様通り
- [x] 立ち絵の背景が正しく透過されている（白背景・黒背景の両方で確認）
- [x] 緑/青のフリンジが残っていない
- [x] キャラクター間でアートスタイルが統一されている
- [x] 立ち絵と既存アイコンの整合性（髪型・配色が一致）
- [x] normal と happy の表情の違いが明確
- [x] 全画像が所定のディレクトリに配置されている

---

## P1-03: 画像プリロード基盤

### useImagePreloader フック
- [x] `hooks/useImagePreloader.ts` を作成
- [x] `Image` オブジェクトによるプリロード処理を実装
- [x] ロード進捗の追跡（`isLoaded`, `progress`, `errors`）
- [x] アンマウント時のクリーンアップ処理
- [x] 空配列時の即座完了

### アセットURL収集関数
- [x] `getStageAssetUrls()` 関数を実装
- [x] 背景画像URLの収集
- [x] キャラ立ち絵URLの収集
- [x] カットイン画像URLの収集（最終ステージの場合）

### テスト
- [x] `useImagePreloader.test.ts` を作成
- [x] 正常ロードのテスト
- [x] エラー時のフォールバックテスト
- [x] 空配列のテスト

---

## P1-04: DialogueOverlay 改修

### レイアウト変更
- [x] 背景画像の全画面表示を実装
- [x] 背景なし時のフォールバック（既存の暗い半透明背景）
- [x] 暗めオーバーレイ（rgba(0,0,0,0.3)）の追加

### 立ち絵表示
- [x] 発話キャラの立ち絵を中央配置で表示
- [x] `portrait` 未定義時のアイコンフォールバック
- [x] キャラ変更時のクロスフェード（200ms）
- [x] 立ち絵の初回フェードイン（300ms）

### 表情差分
- [x] `expression` に基づく画像切り替え
- [x] 省略時の `'normal'` デフォルト処理

### テキストウィンドウ
- [x] 半透明パネルデザイン（rgba(0,0,0,0.7)、角丸 8px）
- [x] キャラ名表示（キャラカラー）
- [x] 既存のテキスト送り機能の維持

### テスト
- [x] 改修後も既存テストがパス
- [x] 背景あり/なしの両方で正しく表示されること
- [x] 立ち絵あり/なしの両方で正しく表示されること

---

## P1-05: VsScreen 演出強化

### 背景
- [x] 2色グラデーション背景（プレイヤーカラー ← → CPUカラー）

### キャラクター表示
- [x] 立ち絵（256x512相当）の左右配置
- [x] `portrait` 未定義時のアイコン拡大フォールバック
- [x] 左からのスライドイン（プレイヤー、200ms〜800ms）
- [x] 右からのスライドイン（CPU、200ms〜800ms）

### VS テキスト
- [x] 大きな「VS」テキスト（72px、太字、白+影）
- [x] バウンスアニメーション（800ms、cubic-bezier）

### 情報表示
- [x] キャラ名の表示（各キャラカラー、24px）
- [x] ステージ名・フィールド名の表示（16px、白半透明）

### アニメーション
- [x] 全体で約3秒の演出（7フェーズ）
- [x] 最後のフェードアウト（500ms）
- [x] `onComplete()` の正しいタイミング呼び出し（3000ms）

### リファクタリング
- [x] CharacterPanel サブコンポーネントの抽出（プレイヤー/CPU共通化）
- [x] CharacterAvatar 依存の除去（VS用立ち絵に変更）

### テスト
- [x] 全17テストがパス（表示5 + 背景1 + 立ち絵4 + アニメ2 + 遷移2 + スタイル3）
- [x] 全267テストスイート・3876テストがパス（既存テスト影響なし）

---

## P1-06: ChapterTitleCard 新規

### コンポーネント作成
- [x] `components/ChapterTitleCard.tsx` を作成
- [x] Props 型定義（`chapter`, `title`, `subtitle?`, `backgroundUrl?`, `onComplete`）

### 表示
- [x] ぼかし背景（blur 10px）+ 暗めオーバーレイ
- [x] 章番号テキスト（18px、白半透明）
- [x] タイトルテキスト（36px、白、太字、中央配置）
- [x] サブタイトルテキスト（20px、白半透明）
- [x] 背景なし時の黒背景フォールバック

### アニメーション
- [x] 要素の段階的フェードイン
- [x] 約4秒の全体演出
- [x] タップ/クリックでスキップ可能
- [x] フェードアウト後に `onComplete()` 呼び出し

### テスト
- [x] `ChapterTitleCard.test.tsx` を作成
- [x] レンダリングテスト
- [x] スキップ操作のテスト
- [x] `onComplete` コールバックのテスト

---

## P1-07: VictoryCutIn 新規

### コンポーネント作成
- [x] `components/VictoryCutIn.tsx` を作成
- [x] Props 型定義（`imageUrl`, `message?`, `onComplete`）

### 表示
- [x] 黒背景のフェードイン
- [x] カットイン画像のスケールアップ（0.8→1.0）+ フェードイン
- [x] 「TO BE CONTINUED...」テキストのフェードイン
- [x] ユーザー入力待ち（クリック/タップ/Enter/Space）

### アニメーション
- [x] 画像表示までの演出（約1秒）
- [x] テキスト表示（約2.5秒後）
- [x] 入力後のフェードアウト（500ms）
- [x] `onComplete()` の呼び出し

### テスト
- [x] `VictoryCutIn.test.tsx` を作成
- [x] レンダリングテスト
- [x] ユーザー入力でのコールバックテスト
- [x] デフォルトメッセージのテスト

---

## P1-08: 統合・遷移管理

### ScreenType 更新
- [x] `AirHockeyGame.tsx` の ScreenType に `'chapterTitle'` を追加
- [x] `AirHockeyGame.tsx` の ScreenType に `'victoryCutIn'` を追加

### 遷移ハンドラ
- [x] `handleChapterTitleComplete()` を追加（→ preDialogue）
- [x] `handleVictoryCutInComplete()` を追加（→ result）
- [x] `handleSelectStage()` を改修（chapterTitle 判定を追加）
- [x] `handlePostDialogueComplete()` を改修（victoryCutIn 判定を追加）

### コンポーネント統合
- [x] `ChapterTitleCard` のレンダリング追加（screen === 'chapterTitle'）
- [x] `VictoryCutIn` のレンダリング追加（screen === 'victoryCutIn'）
- [x] `DialogueOverlay` に背景URL を渡す処理を追加
- [x] `VsScreen` の既存呼び出しを確認（Props 変更なし）

### 画像プリロード統合
- [x] ステージ選択時に `getStageAssetUrls()` でURL収集
- [x] `useImagePreloader` フックの統合
- [x] ロード中の表示（即座遷移方式 — バックグラウンドプリロード）

### テスト
- [x] ストーリーモードの全遷移パスが正しいこと（p1-08-integration.test.ts: 26テスト全パス）
- [x] フリーモードに影響がないこと（全268スイート・3902テストパス）
- [x] 型エラーがないこと（tsc --noEmit パス）

---

## P1-09: テスト・動作確認

### 既存テスト
- [x] `npm test` で全テストパス（268スイート・3902テスト全パス）
- [x] `tsc --noEmit` で型エラーなし
- [x] `npm run lint`（あれば）でエラーなし（未使用インポート1件を修正）

### 新規テスト
- [x] `ChapterTitleCard.test.tsx` 作成・パス
- [x] `VictoryCutIn.test.tsx` 作成・パス
- [x] `useImagePreloader.test.ts` 作成・パス

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

# Phase 2: キャラクター図鑑・ゲーム内紹介 — タスクチェックリスト

## 進捗サマリー

| タスク | ステータス | 画像必要 | 完了日 |
|--------|-----------|---------|--------|
| P2-00 画像アセット準備 | [x] 完了 | ✅ | 2026-03-15 |
| P2-01 データ層整備 | [x] 完了 | — | 2026-03-15 |
| P2-02 アンロックシステム | [x] 完了 | — | 2026-03-15 |
| P2-03 キャラクター図鑑画面 | [x] 完了 | ✅ ※1 | 2026-03-15 |
| P2-04 キャラクタープロフィールカード | [ ] 未着手 | ✅ ※2 | - |
| P2-05 リザルト画面改修 | [ ] 未着手 | ✅ ※2 | - |
| P2-06 タイトル画面改修 | [ ] 未着手 | — | - |
| P2-07 統合・遷移管理 | [ ] 未着手 | — | - |
| P2-08 テスト・動作確認 | [ ] 未着手 | ✅ ※3 | - |

> **画像依存の凡例**:
> - ✅ ※1: 既存アイコン（`characters/*.png`）を使用 — Phase 1 生成済み、追加作業なし
> - ✅ ※2: 既存立ち絵（`portraits/*.png`）を使用 — Phase 1 生成済み、追加作業なし
> - ✅ ※3: `yuu-vs.png` が動作確認に必要 — **P2-00 で作成**
> - —: 画像に依存しないタスク

---

## P2-00: 画像アセット準備

> **重要**: Phase 2 は Phase 1 の既存アセットをほぼすべて再利用します。
> 新規の AI 画像生成は不要です。後処理（トリミング）のみ必要です。
> 詳細は `image-generation-guide.md` を参照してください。

### 既存アセットの確認

- [x] 全 8 キャラのアイコン（`characters/*.png` — 128x128）が存在することを確認
- [x] 全 16 枚の立ち絵（`portraits/*.png` — 512x1024）が存在することを確認
- [x] 立ち絵の normal / happy で表情の違いが明確であることを確認
- [x] 立ち絵の背景が正しく透過されていることを確認（白背景・黒背景の両方で確認）
- [x] 既存 VS 画像 7 枚（`vs/*.png` — 256x512）が存在することを確認

### yuu-vs.png の作成（★唯一の新規作成）

> **背景**: ユウの VS 用画像は Phase 1 では「第2章で登場予定のため未作成」とされていましたが、
> Phase 2 の図鑑機能でキャラクターデータの完全性が必要なため、このタイミングで作成します。
> `characters.ts` でユウに `vsImage` を設定するためにも必要です。

- [x] 既存 VS 画像の構図を確認（`identify public/assets/vs/akira-vs.png` 等で参考）
- [x] `portraits/yuu-normal.png`（512x1024、透過済み）からトリミング + リサイズ
- [x] 方法A（全体リサイズ）:
  ```bash
  convert public/assets/portraits/yuu-normal.png \
    -resize 256x512 \
    public/assets/vs/yuu-vs.png
  ```
- [x] 方法B（上半身トリミング、頭部が小さい場合）:
  ```bash
  convert public/assets/portraits/yuu-normal.png \
    -crop 512x768+0+0 -resize 256x384 \
    -gravity North -extent 256x512 \
    public/assets/vs/yuu-vs.png
  ```
- [x] サイズが 256 × 512 px であること
- [x] 背景が透過されていること
- [x] 他の VS 画像と同じ構図・サイズ感であること
- [x] ユウの特徴（丸メガネ、ストップウォッチ、緑の服）が認識できること
- [x] `characters.ts` のユウに `vsImage: '/assets/vs/yuu-vs.png'` を追加

### 完了条件

- [x] `public/assets/vs/yuu-vs.png` が配置されている
- [x] 全 8 キャラの VS 画像が揃っている（akira, hiro, misaki, takuma, yuu, rookie, regular, ace）
- [x] 既存アセット（アイコン・立ち絵）に問題がないことを確認済み

---

## P2-01: データ層整備

### 型定義の追加
- [x] `types.ts` に `CharacterProfile` 型を追加
- [x] `types.ts` に `UnlockCondition` 型を追加
- [x] `types.ts` に `DexEntry` 型を追加
- [x] `types.ts` に `DexProgress` 型を追加
- [x] `ScreenType` に `'characterDex'` を追加

### 図鑑データの作成
- [x] `core/dex-data.ts` を新規作成
- [x] アキラ（characterId: `'player'`）の `DexEntry` を作成 — アンロック: `{ type: 'default' }`
- [x] ユウ（characterId: `'yuu'`）の `DexEntry` を作成 — アンロック: `{ type: 'default' }`
- [x] ヒロ（characterId: `'hiro'`）の `DexEntry` を作成 — アンロック: `{ type: 'story-clear', stageId: '1-1' }`
- [x] ミサキ（characterId: `'misaki'`）の `DexEntry` を作成 — アンロック: `{ type: 'story-clear', stageId: '1-2' }`
- [x] タクマ（characterId: `'takuma'`）の `DexEntry` を作成 — アンロック: `{ type: 'story-clear', stageId: '1-3' }`
- [x] ソウタ（characterId: `'rookie'`）の `DexEntry` を作成 — アンロック: `{ type: 'default' }`
- [x] ケンジ（characterId: `'regular'`）の `DexEntry` を作成 — アンロック: `{ type: 'default' }`
- [x] レン（characterId: `'ace'`）の `DexEntry` を作成 — アンロック: `{ type: 'default' }`
- [x] `getDexEntryById()` ヘルパー関数を実装
- [x] `getAllDexEntries()` ヘルパー関数を実装
- [x] `character-profiles.md` との内容整合性を確認
  - [x] フルネーム・読み・学年・年齢・身長・学校・部活が一致
  - [x] プレイスタイル・得意技・代表セリフが一致
  - [x] 性格キーワードが一致

### テスト
- [x] `tsc --noEmit` で型エラーがないこと
- [x] 既存テストが全パス

---

## P2-02: アンロックシステム

### コアロジック（core/dex.ts）
- [x] `core/dex.ts` を新規作成
- [x] `DEFAULT_DEX_PROGRESS` 定数を定義（初期解放キャラ: player, yuu, rookie, regular, ace）
- [x] `loadDexProgress()` を実装 — localStorage からの読み込み + try-catch + バリデーション
- [x] `saveDexProgress()` を実装 — localStorage への保存
- [x] `resetDexProgress()` を実装 — 図鑑進行のリセット
- [x] `checkNewUnlocks()` を実装 — ストーリー進行状態から新規アンロック対象を判定
- [x] `markAsViewed()` を実装 — 新規アンロック通知の既読処理

### カスタムフック（hooks/useCharacterDex.ts）
- [x] `hooks/useCharacterDex.ts` を新規作成
- [x] `dexEntries` の提供（全図鑑エントリ）
- [x] `unlockedIds` の状態管理
- [x] `newlyUnlockedIds` の状態管理
- [x] `completionRate` の計算
- [x] `checkAndUnlock()` アクションの実装
- [x] `markViewed()` アクションの実装
- [x] `isUnlocked()` 判定関数の実装
- [x] `getNewUnlockCount()` 取得関数の実装

### テスト
- [x] `dex.test.ts` を作成
  - [x] `loadDexProgress()` の正常読み込みテスト
  - [x] `loadDexProgress()` の localStorage 破損時フォールバックテスト
  - [x] `saveDexProgress()` の保存テスト
  - [x] `resetDexProgress()` のリセットテスト
  - [x] `checkNewUnlocks()` のアンロック判定テスト — 新規アンロックあり
  - [x] `checkNewUnlocks()` のアンロック判定テスト — 既にアンロック済み
  - [x] `checkNewUnlocks()` のアンロック判定テスト — 条件未達
  - [x] `markAsViewed()` の既読処理テスト
- [x] `useCharacterDex.test.ts` を作成
  - [x] 初期状態のテスト（初期解放キャラがアンロック済み）
  - [x] `checkAndUnlock()` でストーリークリア時にアンロックされるテスト
  - [x] `markViewed()` で新規アンロック通知が消えるテスト
  - [x] `completionRate` が正しく計算されるテスト

---

## P2-03: キャラクター図鑑画面

### コンポーネント作成
- [x] `components/CharacterDexScreen.tsx` を新規作成
- [x] Props 型定義

### ヘッダー部
- [x] 「キャラクター図鑑」タイトルの表示
- [x] 「戻る」ボタンの実装（`onBack` コールバック）
- [x] コンプリート率のプログレスバー表示（例: 5/8）

### キャラクターカードグリッド
- [x] 2列グリッドレイアウトの実装
- [x] アンロック済みカード: アイコン（64x64）+ 名前 + テーマカラーボーダー
- [x] ロック中カード: グレースケール + シルエット + 「???」表示
- [x] NEW バッジ: 赤背景 + 白文字、カード右上に配置
- [x] カードタップでプロフィール表示（`onSelectCharacter` コールバック）
- [x] ロック中カードはタップ不可

### アニメーション
- [x] カード一覧の stagger フェードイン（各50ms遅延）
- [x] NEW バッジのパルスアニメーション（1秒周期）
- [x] カードタップ時のスケールダウン（0.95、100ms）

### テスト
- [x] `CharacterDexScreen.test.tsx` を作成
  - [x] 全キャラカードが表示されるテスト
  - [x] アンロック済みキャラのアイコンと名前が表示されるテスト
  - [x] ロック中キャラが「???」で表示されるテスト
  - [x] NEW バッジが新規アンロックキャラに表示されるテスト
  - [x] アンロック済みカードタップで `onSelectCharacter` が呼ばれるテスト
  - [x] ロック中カードタップで `onSelectCharacter` が呼ばれないテスト
  - [x] コンプリート率が正しく表示されるテスト
  - [x] 「戻る」ボタンで `onBack` が呼ばれるテスト

---

## P2-04: キャラクタープロフィールカード

### コンポーネント作成
- [ ] `components/CharacterProfileCard.tsx` を新規作成
- [ ] Props 型定義

### 表示要素
- [ ] モーダルオーバーレイ（背景タップで閉じる）
- [ ] 立ち絵表示（中央配置、最大幅 200px、最大高さ 300px）
- [ ] 立ち絵タップで表情切替（normal ⇔ happy、クロスフェード 150ms）
- [ ] 「タップで表情変更」ヒントテキスト
- [ ] `portrait` 未定義時のアイコン拡大フォールバック
- [ ] 代表セリフ（イタリック、テーマカラー、引用マーク）
- [ ] キャラ名（太字 24px）+ 読み（14px、グレー）
- [ ] 基本情報（学年・年齢・身長・誕生日・所属 — 「|」区切り）
- [ ] 性格キーワードのタグ表示（角丸チップ、テーマカラー）
- [ ] プレイスタイル名 + 得意技名 + 説明
- [ ] キャラクター紹介文
- [ ] 閉じるボタン（✕、カード右上）

### アニメーション
- [ ] オーバーレイのフェードイン（200ms）
- [ ] カードのスライドアップ + フェードイン（300ms、ease-out）
- [ ] 閉じる時のフェードアウト（200ms）

### アクセシビリティ
- [ ] Escape キーで閉じる
- [ ] 閉じるボタンにフォーカス

### テスト
- [ ] `CharacterProfileCard.test.tsx` を作成
  - [ ] プロフィール情報が正しく表示されるテスト
  - [ ] 立ち絵が正しく表示されるテスト
  - [ ] 立ち絵タップで表情が切り替わるテスト
  - [ ] `portrait` 未定義時にアイコンが表示されるテスト
  - [ ] 閉じるボタンで `onClose` が呼ばれるテスト
  - [ ] 背景タップで `onClose` が呼ばれるテスト
  - [ ] 性格タグが正しく表示されるテスト

---

## P2-05: リザルト画面改修

### キャラ表情差分の追加
- [ ] `ResultScreen.tsx` に `cpuCharacter?`, `playerCharacter?` Props を追加
- [ ] ストーリーモード勝利時: プレイヤー立ち絵（happy）+ 対戦キャラ立ち絵（normal）を表示
- [ ] ストーリーモード敗北時: プレイヤー立ち絵（normal）+ 対戦キャラ立ち絵（happy）を表示
- [ ] フリー対戦時: 対戦キャラ立ち絵を表示（`portrait` がある場合のみ）
- [ ] 立ち絵未定義時のフォールバック（表示しない）
- [ ] 立ち絵のフェードインアニメーション（300ms）

### アンロック通知の追加
- [ ] `newlyUnlockedCharacterName?` Props を追加
- [ ] 通知バナー: 金色ボーダー + 🔓アイコン + 「{キャラ名} が図鑑に追加されました！」
- [ ] 通知表示タイミング: スコアカウントアップ完了後に 500ms ディレイでフェードイン

### テスト
- [ ] `ResultScreen.test.tsx` のテスト更新
  - [ ] 勝利時にプレイヤー happy + 対戦キャラ normal が表示されるテスト
  - [ ] 敗北時にプレイヤー normal + 対戦キャラ happy が表示されるテスト
  - [ ] キャラ情報なし時に立ち絵が表示されないテスト（後方互換性）
  - [ ] アンロック通知が表示されるテスト
  - [ ] アンロック通知なし時にバナーが表示されないテスト

---

## P2-06: タイトル画面改修

### ボタン追加
- [ ] `TitleScreen.tsx` に `onCharacterDexClick` Props を追加
- [ ] `TitleScreen.tsx` に `newUnlockCount` Props を追加
- [ ] 「キャラクター」ボタンの追加（ストーリーボタンの下に配置）
- [ ] ボタンスタイル: 紫系グラデーション（#9b59b6 ベース）
- [ ] 通知バッジ: 赤丸（直径 20px）+ 白文字数字、`newUnlockCount > 0` 時のみ表示
- [ ] バッジのパルスアニメーション（1.5秒周期）
- [ ] メニューレイアウトの調整（ボタン増加に伴うスペース調整）

### テスト
- [ ] `TitleScreen.test.tsx` のテスト更新
  - [ ] 「キャラクター」ボタンが表示されるテスト
  - [ ] ボタンタップで `onCharacterDexClick` が呼ばれるテスト
  - [ ] `newUnlockCount > 0` 時にバッジが表示されるテスト
  - [ ] `newUnlockCount === 0` 時にバッジが表示されないテスト

---

## P2-07: 統合・遷移管理

### ScreenType 更新
- [ ] `AirHockeyGame.tsx` で `screen === 'characterDex'` 時の描画を追加

### フック統合
- [ ] `useCharacterDex` フックを `AirHockeyGame.tsx` に統合
- [ ] 図鑑の状態（アンロック・新規通知等）を管理

### 遷移ハンドラ
- [ ] `handleCharacterDexClick()` を追加（menu → characterDex）
- [ ] `handleBackFromDex()` を追加（characterDex → menu）
- [ ] プロフィールカード表示用の状態管理（`selectedCharacterId`）

### ストーリークリア時のアンロック統合
- [ ] ストーリーモードでプレイヤー勝利時に `checkAndUnlock()` を実行
- [ ] 新規アンロック情報を `ResultScreen` に渡す
- [ ] 図鑑画面表示時に `markViewed()` を実行（NEW バッジの消去）

### Props の受け渡し
- [ ] `TitleScreen` に `onCharacterDexClick`, `newUnlockCount` を渡す
- [ ] `ResultScreen` に `cpuCharacter`, `playerCharacter`, `newlyUnlockedCharacterName` を渡す
- [ ] `CharacterDexScreen` に必要な Props を渡す

### テスト
- [ ] 既存の遷移テストが全パス
- [ ] menu → characterDex → menu の遷移テスト
- [ ] ストーリークリア時のアンロック連携テスト
- [ ] フリーモードに影響がないこと

---

## P2-08: テスト・動作確認

### 既存テスト
- [ ] `npm test` で全テストパス
- [ ] `tsc --noEmit` で型エラーなし

### 新規テスト一覧
- [ ] `dex-data.test.ts`: 図鑑データの整合性テスト
  - [ ] 全8キャラクターのエントリが存在するテスト
  - [ ] `characterId` が `characters.ts` の ID と一致するテスト
  - [ ] アンロック条件の `stageId` が `dialogue-data.ts` のステージ ID と一致するテスト
  - [ ] 必須フィールドがすべて入力されているテスト
- [ ] `dex.test.ts`: アンロックロジックのテスト（P2-02 で作成）
- [ ] `useCharacterDex.test.ts`: カスタムフックのテスト（P2-02 で作成）
- [ ] `CharacterDexScreen.test.tsx`: 図鑑画面のテスト（P2-03 で作成）
- [ ] `CharacterProfileCard.test.tsx`: プロフィールカードのテスト（P2-04 で作成）

### 動作確認
- [ ] タイトル画面 → 「キャラクター」ボタン → 図鑑画面の遷移
- [ ] 図鑑画面のカード一覧表示（アンロック/ロック状態）
- [ ] カードタップ → プロフィールカード表示
- [ ] プロフィールカードの立ち絵表情切替
- [ ] プロフィールカードを閉じる（✕ / 背景タップ / Escape）
- [ ] 「戻る」ボタン → タイトル画面に戻る
- [ ] ストーリーモード 1-1 クリア → ヒロがアンロック → リザルト画面に通知表示
- [ ] ストーリーモード 1-2 クリア → ミサキがアンロック
- [ ] ストーリーモード 1-3 クリア → タクマがアンロック
- [ ] リザルト画面でキャラ表情差分が正しく表示される（勝利/敗北両方）
- [ ] タイトル画面の通知バッジが表示/消去される
- [ ] 初回プレイ時（全ロック状態）の動作確認
- [ ] 全クリア状態（全アンロック）の動作確認
- [ ] フリー対戦に影響がないことの確認
- [ ] ストーリーモードの既存フローに影響がないことの確認

### パフォーマンス確認
- [ ] 図鑑画面の画像読み込みが適切（遅延読み込み動作）
- [ ] プロフィールカード表示時のアニメーションが滑らか
- [ ] localStorage の読み書きが正常

---

## 完了条件

- [ ] 全チェックボックスが完了
- [ ] 既存テスト + 新規テストが全パス
- [ ] タイトル → 図鑑 → プロフィール の遷移が正常動作
- [ ] ストーリークリア時のアンロックが正常動作
- [ ] リザルト画面の表情差分が正常動作
- [ ] フリーモード・ストーリーモードの既存動作に影響なし

# 迷宮の残響 — シナリオ画像生成 タスクチェックリスト

## 進捗サマリー

| フェーズ | 状況 | タスク数 |
|---|---|---|
| フェーズ1: スタイルガイド策定 | 完了 | 3/3 |
| フェーズ2: AI画像生成 | 完了 | 7/7 |
| フェーズ3: コード実装 | 完了 | 7/7 |
| フェーズ4: 検証・最適化 | 完了 | 4/4 |
| **合計** | **100%** | **21/21** |

---

## フェーズ1: スタイルガイド策定

- [x] 1.1 共通ベースプロンプトの確定（物語的写実主義 × ダンジョンファンタジー融合定義）
- [x] 1.2 全26枚の個別プロンプト確定（spec.md のプロンプトをレビュー・調整）
- [x] 1.3 README.md に画像スタイルガイドセクションを追記

---

## フェーズ2: AI画像生成（26枚）

- [x] 2.1 タイトル画面画像の生成（1枚: le_title）
- [x] 2.2 難易度カード画像の生成（4枚: le_diff_easy/normal/hard/abyss）
- [x] 2.3 フロアイントロ画像の生成（5枚: le_floor_1〜5）
- [x] 2.4 イベントタイプ画像の生成（4枚: le_event_exploration/encounter/trap/rest）
- [x] 2.5 エンディング画像の生成（11枚: le_ending_*）
- [x] 2.6 ゲームオーバー画像の生成（1枚: le_gameover）
- [x] 2.7 全画像の WebP 変換・サイズ確認（各300KB以下、全体8MB以下） — 最大83KB、合計1.6MB

---

## フェーズ3: コード実装

- [x] 3.1 `src/features/labyrinth-echo/images.ts` 新規作成（画像 import マッピング）
- [x] 3.2 `TitleScreen.tsx` にタイトル背景画像を追加
- [x] 3.3 `GameComponents.tsx` の DiffCard にカードヘッダー画像を追加
- [x] 3.4 `FloorIntroScreen.tsx` にフロア画像を追加
- [x] 3.5 `EventResultScreen.tsx` にイベントタイプ画像を追加 — BUG-001 修正済: `LE_IMAGES.events[evType.id]` → `LE_IMAGES.events[event.tp]`
- [x] 3.6 `EndScreens.tsx` にエンディング画像・ゲームオーバー画像を追加 — BUG-002, BUG-003 修正済: 重複行を削除
- [x] 3.7 `index.ts` に images.ts の export を追加（必要に応じて） — images.ts は各コンポーネントから直接 import しており barrel export 不要と判断、対応不要

---

## フェーズ4: 検証・最適化

- [x] 4.1 全画面の画像表示確認（タイトル → 難易度選択 → フロアイントロ → イベント → エンディング/ゲームオーバー） — コード上の参照整合性を確認済
- [x] 4.2 ファイルサイズ最終確認（個別300KB以下、全体8MB以下） — 最大83KB(le_ending_abyss_clear.webp)、合計1.6MB
- [x] 4.3 loading 属性の最適化（初期表示は eager、遅延表示は lazy） — 全画像がCSS backgroundImageで条件付きレンダリングされるため、実質的にlazy loading済。タイトル画像のみ初期表示（eager相当）
- [x] 4.4 ビルド成功確認・本番バンドルサイズ確認 — webpack production build 成功（warning: 他アセットのサイズ警告のみ、LE画像は問題なし）

---

## 不具合一覧

### BUG-001: EventResultScreen — イベント画像が常に exploration にフォールバック — **修正済 ✓**

- **ファイル**: `src/features/labyrinth-echo/components/EventResultScreen.tsx` L69
- **内容**: `LE_IMAGES.events[evType.id]` としているが、`EVENT_TYPE` オブジェクト（`definitions.ts` L23-28）には `id` プロパティが存在しない。そのため `evType.id` は常に `undefined` となり、フォールバックの `LE_IMAGES.events.exploration` が全イベントタイプで使われてしまう。
- **影響**: 遭遇(encounter)・罠(trap)・安息(rest) のイベントでも探索(exploration)の画像が表示される
- **修正**: `LE_IMAGES.events[evType.id]` → `LE_IMAGES.events[event.tp]` に変更。`event.tp` は `exploration` / `encounter` / `trap` / `rest` のいずれかで、`LE_IMAGES.events` のキーと一致する。

### BUG-002: EndScreens — GameOverScreen の `<h2>探索失敗</h2>` 重複 — **修正済 ✓**

- **ファイル**: `src/features/labyrinth-echo/components/EndScreens.tsx` L20-21
- **内容**: feat ブランチの差分で `<h2>探索失敗</h2>` が2行追加されており、画面上に「探索失敗」が2回表示される。
- **修正**: L21 の重複行を削除

### BUG-003: EndScreens — VictoryScreen の isNewDiffClear バッジ重複 — **修正済 ✓**

- **ファイル**: `src/features/labyrinth-echo/components/EndScreens.tsx` L79-80
- **内容**: feat ブランチの差分で `{isNewDiffClear && <div ...>🏆 {diff?.name}初クリア</div>}` が2行あり、難易度初クリア時にバッジが2つ表示される。
- **修正**: L80 の重複行を削除

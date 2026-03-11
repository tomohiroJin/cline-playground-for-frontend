# Phase 1: ストーリービジュアル強化 — 実装計画

## 概要

Phase 0 で整備した世界観・キャラ設定・画像スタイルガイドを基に、ストーリーモードのビジュアル演出を大幅に強化する。
「テキスト+アイコンのみ」から「背景+立ち絵+表情差分+VS演出+カットイン」への進化。

## 目標

- 「見て楽しい」ストーリー体験を実現
- 没入感のあるダイアログ演出（背景画像 + 立ち絵 + 表情変化）
- 対決感のある VS 画面（全身イラスト + スライドインアニメーション）
- 章の区切りを印象づけるチャプタータイトルカード
- クリアの達成感を高める勝利カットイン

## 前提条件

- Phase 0 成果物がすべて完了済み（D-01〜D-04 + 整合性レビュー）
- 参照ドキュメント:
  - `src/features/air-hockey/doc/world/image-style-guide.md`（D-04: 画像仕様）
  - `src/features/air-hockey/doc/world/character-profiles.md`（D-02: キャラ設定）
  - `src/features/air-hockey/doc/world/world-setting.md`（D-01: 世界観）
  - `.docs/ah-20260311-01/narrative-flow.md`（画面遷移・UX設計）
  - `.docs/ah-20260311-01/brushup-vision.md`（ブラッシュアップ計画 v3）

## 設計制約

- 既存のゲームロジック（物理エンジン・AI・アイテム等）には変更を加えない
- 新コンポーネントは既存のスタイルパターン（インラインスタイル + CSS-in-JS）に準拠
- パフォーマンス: 画像プリロードで遷移時のちらつきを防止
- アセットは WebP/PNG、合計バンドルサイズ増加を最小限に
- 第2章のコード実装は Phase 1 のスコープ外（アセット・データ追加は別フェーズ）

## タスク構造と依存関係

```
P1-01（データ層整備）
  ├── characters.ts カラー更新
  ├── ユウ（yuu）キャラ追加
  └── Character 型拡張（portrait フィールド）
        ↓
P1-02（画像アセット生成）
  ├── 立ち絵 16枚（8キャラ × 2表情）
  ├── 背景 3枚
  └── 勝利カットイン 1枚
        ↓
P1-03（画像プリロード基盤）
  └── アセットプリローダー
        ↓
P1-04（DialogueOverlay 改修）─────────┐
P1-05（VsScreen 演出強化）            │
P1-06（ChapterTitleCard 新規）        ├─→ P1-08（統合・遷移管理）
P1-07（VictoryCutIn 新規）────────────┘
        ↓
P1-09（テスト・動作確認）
```

## タスク一覧

### P1-01: データ層整備

**目的**: コードレベルのキャラクター情報を Phase 0 設定書に合わせる

**作業内容**:
1. `characters.ts` のフリー対戦キャラカラーを設計書の値に更新
   - rookie（ソウタ）: `#e74c3c` → `#27ae60`（ライムグリーン）
   - regular（ケンジ）: `#e74c3c` → `#2c3e50`（ネイビー）
   - ace（レン）: `#e74c3c` → `#2c3e50`（メイン黒+赤アクセント）
2. `Character` 型に立ち絵パス用フィールドを追加
   ```typescript
   portrait?: {
     normal: string;  // 通常表情の画像パス
     happy: string;   // 嬉しい表情の画像パス
   };
   ```
3. 各キャラクターに portrait 情報を設定
4. ユウ（yuu）を `STORY_CHARACTERS` に追加（第2章準備だが、図鑑・キャラ情報で使用）
5. `StageDefinition` 型に背景ID・チャプタータイトル情報を追加
   ```typescript
   backgroundId?: string;        // 背景画像ID
   chapterTitle?: string;        // チャプタータイトル（章の最初のステージのみ）
   chapterSubtitle?: string;     // サブタイトル
   ```
6. `dialogue-data.ts` の既存ステージに背景ID・チャプタータイトルを追加

**成果物**: 更新された `types.ts`, `characters.ts`, `dialogue-data.ts`
**完了条件**: 既存テスト（`characters.test.ts`, `dialogue-data.test.ts`）がパス

### P1-02: 画像アセット生成

**目的**: D-04 スタイルガイドに基づいて全画像アセットを生成・配置

**作業内容**:
1. ディレクトリ構造の作成
   ```
   public/assets/
   ├── portraits/          # 立ち絵（512x1024 PNG）
   │   ├── akira-normal.png
   │   ├── akira-happy.png
   │   ├── hiro-normal.png
   │   ├── hiro-happy.png
   │   ├── misaki-normal.png
   │   ├── misaki-happy.png
   │   ├── takuma-normal.png
   │   ├── takuma-happy.png
   │   ├── rookie-normal.png
   │   ├── rookie-happy.png
   │   ├── regular-normal.png
   │   ├── regular-happy.png
   │   ├── ace-normal.png
   │   ├── ace-happy.png
   │   ├── yuu-normal.png
   │   └── yuu-happy.png
   ├── backgrounds/        # 背景（450x900 WebP）
   │   ├── bg-clubroom.webp
   │   ├── bg-gym.webp
   │   └── bg-school-gate.webp
   └── cutins/             # カットイン（450x400 PNG）
       └── victory-ch1.png
   ```
2. D-04 のプロンプトを使用して画像生成
3. 生成画像の品質チェック（スタイル統一性・解像度・透過処理）

**成果物**: 20枚の画像アセット
**完了条件**: 全画像が正しいサイズ・フォーマットで配置済み

### P1-03: 画像プリロード基盤

**目的**: 画面遷移時の画像読み込み遅延を防止

**作業内容**:
1. `useImagePreloader` カスタムフックの作成
   ```typescript
   function useImagePreloader(urls: string[]): {
     isLoaded: boolean;
     progress: number; // 0-1
   };
   ```
2. ステージ選択時に該当ステージの画像をプリロード
3. フォールバック表示（ロード中のプレースホルダー）

**成果物**: `hooks/useImagePreloader.ts`
**完了条件**: プリロード完了後に画像がちらつかないこと

### P1-04: DialogueOverlay 改修

**目的**: テキスト+アイコンのみの演出から、背景+立ち絵+表情差分の演出に強化

**現状**: `DialogueOverlay.tsx` — 暗い半透明背景 + 小さなキャラアイコン + テキスト

**改修内容**:
1. 背景画像の表示（全画面、ダイアログの後ろに表示）
2. 立ち絵の表示（画面中央〜左右、発話キャラを強調）
3. 表情差分の切り替え（Dialogue 型に `expression` フィールド追加）
4. テキストウィンドウのデザイン改善（半透明パネル + キャラ名表示）
5. 立ち絵のフェードイン/スライドインアニメーション

**Dialogue 型の拡張**:
```typescript
type Dialogue = {
  characterId: string;
  text: string;
  expression?: 'normal' | 'happy';  // 表情指定（省略時 normal）
  background?: string;               // 背景切り替え（省略時は前の背景を維持）
};
```

**成果物**: 改修された `DialogueOverlay.tsx`
**完了条件**: 背景・立ち絵・表情が正しく切り替わること

### P1-05: VsScreen 演出強化

**目的**: 対決感のある VS 画面に強化

**現状**: `VsScreen.tsx` — シンプルなフェードイン/アウト、アイコン表示

**改修内容**:
1. 背景をエフェクト付きグラデーションに変更
2. キャラクター立ち絵（256x512相当）を左右に配置
3. スライドインアニメーション（左右からキャラが登場）
4. 「VS」テキストのバウンスアニメーション
5. ステージ名・フィールド名の表示改善
6. 演出時間の調整（合計約3秒）

**成果物**: 改修された `VsScreen.tsx`
**完了条件**: スライドイン→VS表示→フェードアウトの一連の演出が動作

### P1-06: ChapterTitleCard 新規コンポーネント

**目的**: 章の開始時に雰囲気を高めるタイトルカードを表示

**仕様**:
- 背景画像（ぼかし付き）の上にチャプター番号 + タイトルテキスト
- フェードイン → 2秒表示 → フェードアウト
- 各章の最初のステージ選択時のみ表示（初回のみ or 毎回は設定で切替可能）
- ScreenType に `'chapterTitle'` を追加

**Props**:
```typescript
type ChapterTitleCardProps = {
  chapter: number;
  title: string;
  subtitle?: string;
  backgroundUrl?: string;
  onComplete: () => void;
};
```

**成果物**: `components/ChapterTitleCard.tsx`
**完了条件**: タイトルカードが正しくフェードイン/アウトすること

### P1-07: VictoryCutIn 新規コンポーネント

**目的**: 章の最終ステージクリア時に達成感を演出するカットイン

**仕様**:
- 一枚絵（450x400）をスケールアップアニメーションで表示
- 「TO BE CONTINUED...」テキストのフェードイン
- タップ/クリックで次へ進む
- 第1章最終ステージ（1-3）クリア時のみ表示

**Props**:
```typescript
type VictoryCutInProps = {
  imageUrl: string;
  message?: string;    // デフォルト: 'TO BE CONTINUED...'
  onComplete: () => void;
};
```

**成果物**: `components/VictoryCutIn.tsx`
**完了条件**: カットイン画像 + テキストが正しく表示されること

### P1-08: AirHockeyGame 統合・遷移管理

**目的**: 新コンポーネントをメインゲームフローに統合

**作業内容**:
1. `ScreenType` に `'chapterTitle'` と `'victoryCutIn'` を追加
2. ストーリーモードの遷移フローを更新:
   ```
   stageSelect
     → chapterTitle（章の最初のステージのみ）
     → preDialogue
     → vsScreen
     → game
     → postDialogue
     → victoryCutIn（最終ステージクリア時のみ）
     → result
   ```
3. 各画面遷移ハンドラの追加・修正
4. 画像プリロードの統合（ステージ選択時にトリガー）

**成果物**: 更新された `AirHockeyGame.tsx`
**完了条件**: 全遷移パスが正しく動作すること

### P1-09: テスト・動作確認

**目的**: Phase 1 の全変更が正しく動作し、既存機能を壊していないことを確認

**作業内容**:
1. 既存テストの実行・全パス確認
2. 新コンポーネントのユニットテスト作成
   - `ChapterTitleCard.test.tsx`
   - `VictoryCutIn.test.tsx`
   - `useImagePreloader.test.ts`
3. DialogueOverlay・VsScreen の改修後テスト更新
4. ストーリーモード通しプレイでの動作確認
   - 第1章全3ステージを順にプレイ
   - チャプタータイトル → ダイアログ → VS → 試合 → ダイアログ → カットイン → リザルトの遷移確認
   - 勝利・敗北の両パス確認
5. フリーモードに影響がないことの確認
6. パフォーマンス確認（画像ロード時間、メモリ使用量）

**成果物**: テストファイル群 + 動作確認結果
**完了条件**: 全テストパス + 通しプレイで問題なし

## リスク管理

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 画像生成のスタイル不統一 | 高 | D-04 のプロンプトを厳守、生成後のレビューを徹底 |
| 立ち絵とアイコンのギャップ | 中 | D-04 の維持項目（髪型・配色）を遵守 |
| 画像ファイルサイズによるロード遅延 | 中 | WebP 圧縮 + プリロード基盤で対応 |
| DialogueOverlay 改修の影響範囲 | 中 | 既存の Dialogue 型を後方互換で拡張 |
| 遷移フローの複雑化 | 低 | ScreenType の型安全性で遷移ミスを防止 |

## Phase 1 完了後の状態

- ストーリーモードが「背景+立ち絵+表情差分」でビジュアルリッチに
- VS 画面が対決感のあるスライドインアニメーション付きに
- チャプタータイトルカードで章の区切りが明確に
- 勝利カットインでクリアの達成感が向上
- フリー対戦キャラのカラーが設計書と整合
- ユウ（yuu）がキャラクターデータに追加済み
- Phase 2（キャラクター図鑑）の基盤が整備

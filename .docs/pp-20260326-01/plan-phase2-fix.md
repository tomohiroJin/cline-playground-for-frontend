# フォントサイズ追加修正計画（Phase 2 補完）

## 問題

Phase 2 で `styles.ts` の styled-components のフォントサイズは拡大済みだが、
**各コンポーネント内のインラインスタイル（`fontSize: N`）が 146 箇所も旧サイズのまま**残っている。
結果として、画面の枠は大きくなったが文字が小さくて読めない。

## 影響範囲

| 旧サイズ | 箇所数 | 主な用途 |
|---------|--------|---------|
| 7px | 25 | タグ、ボーナス表示、シナジーバッジ |
| 8px | 24 | バッジ、コスト表示、バフ表示 |
| 9px | 38 | 説明文、統計詳細、進化カード |
| 10px | 26 | ラベル、ステータス、ツリーボーナス |
| 11px | 15 | セクションタイトル、ステータス名 |
| 12px | 13 | ボタンテキスト、ターン表示 |
| 13px | 5 | サブ情報テキスト |

---

## 修正方針

### フォントサイズスケーリングルール

画面が 480→800（×1.67 倍）に拡大したので、全フォントサイズを **約1.5〜1.7 倍** にスケーリングし、
**最小 12px** を保証する。

情報の階層（メイン → サブ → 補足）を維持するため、5 段階に整理する。

| 段階 | 新サイズ | 旧サイズ | 用途 |
|------|---------|---------|------|
| xs | 12px | 7px | 最小テキスト（タグ、シナジーバッジ、相性表示） |
| sm | 14px | 8-9px | 説明文、統計、バッジ、コスト表示 |
| md | 16px | 10px | ラベル、ステータス、ツリーボーナス |
| lg | 18px | 11-12px | セクションタイトル、ボタンテキスト |
| xl | 20px | 13px | サブ情報テキスト |

### 定数定義

`constants/ui.ts` にインラインフォント用の定数マップを追加する。
既存の `FONT_SIZES` は styled-components 専用、`IFS` はインラインスタイル専用として使い分ける。

```typescript
/**
 * インラインフォントサイズ（コンポーネント内のインラインスタイルで使用）
 *
 * ※ styled-components 用の FONT_SIZES とは別管理。
 *   FONT_SIZES: styled-components の各コンポーネントに対応（Title, StatText 等）
 *   IFS:        インラインスタイルの fontSize に使用する汎用サイズスケール
 */
export const IFS = Object.freeze({
  xs: 12,   // 旧 7px: タグ、シナジーバッジ、相性表示
  sm: 14,   // 旧 8-9px: 説明文、統計、バッジ、コスト表示
  md: 16,   // 旧 10px: ラベル、ステータス、ツリーボーナス
  lg: 18,   // 旧 11-12px: セクションタイトル、ボタンテキスト
  xl: 20,   // 旧 13px: サブ情報テキスト
});
```

### 旧サイズ → IFS マッピング早見表

置換作業時にこの表を参照する。

| 旧 fontSize | → IFS | 備考 |
|-------------|-------|------|
| 7 | `IFS.xs` (12) | |
| 8 | `IFS.sm` (14) | 旧 8px は旧 9px と統合 |
| 9 | `IFS.sm` (14) | |
| 10 | `IFS.md` (16) | |
| 11 | `IFS.lg` (18) | 旧 11px は旧 12px と統合 |
| 12 | `IFS.lg` (18) | |
| 13 | `IFS.xl` (20) | |

---

## はみ出し防止対策

### 高リスク箇所（必ず対策を実施）

#### 1. AllyBadge（`styles.ts`）
- **現状**: `min-width: 62px`, `padding: 3px 6px`, `font-size: 13px`
- **問題**: 仲間名が長いとはみ出す
- **対策**:
  - `min-width` を `80px` に拡大
  - `padding` を `4px 8px` に拡大
  - `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` を追加

#### 2. TreeNodeBox（`styles.ts` + `TreeScreen.tsx`）
- **現状**: `min-width: 84px`, `padding: 5px 6px`, `font-size: 14px`
- **問題**: ノード名・説明がフォント拡大で 84px に収まらない
- **対策**:
  - `min-width` を `110px` に拡大
  - `padding` を `6px 8px` に拡大
  - `overflow-wrap: break-word` を追加（日本語テキスト対応）
  - TreeScreen 内の flex レイアウトに `flex-wrap: wrap` + `gap` を確認

#### 3. バッジ群（AffinityBadge, CivBadge, SynergyBadges, AwakeningBadges）
- **現状**: `padding: 1px 5px` 程度、`font-size: 7-8px`
- **問題**: 12-14px に拡大すると横並びで重なる
- **対策**:
  - `padding` を `2px 6px` に拡大
  - 親コンテナの `gap` を確認・拡大（4px → 6px）
  - `flex-wrap: wrap` で折り返し可能にする
  - バッジ内は `white-space: nowrap` を維持

#### 4. PlayerPanel 内のステータス・バフ表示
- **現状**: 多数の小フォントテキストが 1 行に並ぶ
- **問題**: フォント拡大で行が溢れる
- **対策**:
  - バフコンテナの `padding` を `2px 6px` に拡大
  - `flex-wrap: wrap` を確認
  - ATKボーナス等のインラインバッジの `padding` を `2px 6px` に拡大

### 中リスク箇所（改善推奨）

#### 5. SkillBtn（`styles.ts`）
- **現状**: `min-width: 96px`, `font-size: 20px`, `padding: 8px 14px`
- **対策**: `min-width` を `120px` に拡大

#### 6. ProgressBar ラベル
- **現状**: flex space-between で左右にテキスト配置
- **対策**: ラベルに `max-width: 45%` + `overflow: hidden; text-overflow: ellipsis` を追加

#### 7. EnemyPanel 名前欄
- **現状**: `fontSize: 16px`（前回の修正で FONT_SIZES.gameButton を適用済み）
- **対策**: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` を追加

---

## 対象ファイル一覧（29 ファイル）

### 修正方針: ファイル単位の一括修正

各ファイルで **フォントサイズ変更とはみ出し防止対策を同時に実施**する。
同じファイルを何度も開く非効率を避け、変更の一貫性を保つ。

### Step 1: 定数 + テスト
- `constants/ui.ts` — `IFS` 定数追加
- `__tests__/inline-font.test.ts` — 全値が 12px 以上テスト

### Step 2: styles.ts はみ出し防止 + フォント修正
- `styles.ts` — AllyBadge, TreeNodeBox, SkillBtn のサイズ拡大 + overflow 対策

### Step 3: 大量修正ファイル（10+ 箇所）— フォント + はみ出し対策を同時実施
1. `HowToPlayScreen.tsx` — 19 箇所
2. `EvolutionScreen.tsx` — 11 箇所
3. `TreeScreen.tsx` — 7 箇所 + TreeNodeBox レイアウト確認

### Step 4: 中規模修正ファイル（4〜9 箇所）— フォント + はみ出し対策を同時実施
4. `ChallengeScreen.tsx` — 9 箇所
5. `GameOverScreen.tsx` — 8 箇所
6. `PlayerPanel.tsx` — 7 箇所 + バフ・バッジ padding 拡大
7. `AllyReviveScreen.tsx` — 7 箇所
8. `StatsScreen.tsx` — 5 箇所
9. `DifficultyScreen.tsx` — 5 箇所
10. `AchievementScreen.tsx` — 5 箇所
11. `BiomeSelectScreen.tsx` — 5 箇所
12. `TitleScreen.tsx` — 4 箇所
13. `AwakeningScreen.tsx` — 4 箇所
14. `EndlessCheckpointScreen.tsx` — 4 箇所

### Step 5: 小規模修正ファイル（1〜3 箇所）— フォント + はみ出し対策を同時実施
15. `BattleScreen.tsx` — 1 箇所（12→`IFS.lg`=18px）
16. `EnemyPanel.tsx` — 1 箇所 + 敵名 overflow 対策
17. `PreFinalScreen.tsx` — 3 箇所
18. `contracts.tsx` — 2 箇所
19. `AllyList.tsx` — 2 箇所
20. `HpBar.tsx` — 1 箇所
21. `AffinityBadge.tsx` — 2 箇所 + padding 拡大
22. `CivBadge.tsx` — 1 箇所 + padding 拡大
23. `SynergyBadges.tsx` — 1 箇所 + padding 拡大
24. `StatPreview.tsx` — 2 箇所
25. `SpeedControl.tsx` — 1 箇所
26. `AwakeningBadges.tsx` — 1 箇所 + padding 拡大
27. `ProgressBar.tsx` — 1 箇所 + overflow 対策

### Step 6: styled-components 修正（CSS-in-JS）
28. `EventChoices.tsx` — 5 箇所（ChoiceBtn, ChoiceLabel, ChoiceHint, CostTag, EffectHintBadge）
29. `EventCard.tsx` — 2 箇所（EventDesc, SituationText）

### Step 7: 最終検証
- ビルド確認
- 全テストパス確認
- `grep` で **リテラル数値の** fontSize が 14 未満で残存していないことを確認
  - 除外対象: 定数経由（`IFS.xs`, `FONT_SIZES.surrenderBtn` 等）、Canvas 描画（`sprites.ts` の `font: '10px serif'`）
- コードレビュー

---

## 作業ステップ詳細

| # | 内容 | TDD | 備考 |
|---|------|-----|------|
| 1 | `IFS` 定数追加 + テスト | Red → Green | 全値 ≥ 12 |
| 2 | `styles.ts` はみ出し防止 | — | AllyBadge, TreeNodeBox, SkillBtn |
| 3 | 大量修正 3 ファイル | — | フォント + はみ出し対策を同時実施 |
| 4 | 中規模修正 11 ファイル | — | フォント + はみ出し対策を同時実施 |
| 5 | 小規模修正 13 ファイル | — | フォント + はみ出し対策を同時実施 |
| 6 | styled-components 2 ファイル | — | EventChoices, EventCard |
| 7 | ビルド + テスト + 残存チェック | — | grep 検証（リテラル数値のみ） |
| 8 | コードレビュー + リファクタリング | — | |
| 9 | tasks.md 更新 + コミット + プッシュ | — | |

---

## リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| テキストが枠からはみ出す | UI 崩壊 | 高リスク箇所に overflow + ellipsis + コンテナ拡大を事前適用 |
| 横並びバッジが重なる | 可読性低下 | flex-wrap: wrap + gap 拡大 |
| TreeNodeBox の横並びが崩れる | ツリー画面使用不可 | min-width 拡大 + overflow-wrap: break-word |
| SkillBtn のラベルはみ出し | 操作不可 | min-width 拡大 |
| 修正漏れ | 一部だけ小さいまま | Step 7 の grep 検証で全件チェック（リテラル数値のみ対象） |
| レイアウト崩れ（予期せぬ） | 一部画面表示不正 | ビルド後の手動目視確認（tasks.md で管理） |

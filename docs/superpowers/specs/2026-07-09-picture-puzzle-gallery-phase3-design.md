# Picture Puzzle ギャラリー化 フェーズ3「快適性（アクセシビリティ中核）」設計書

> 親設計書: `2026-07-07-picture-puzzle-gallery-brushup-design.md` §5 フェーズ3
> P1（PR #158）・P2（PR #159）マージ済の続き。本書はアクセシビリティ中核3領域に絞った実装レベル設計。

## 1. 目的

ギャラリー化で白基調・明るい配色にしたことで新たに顕在化したアクセシビリティ負債を回収する。
親設計書 §5 フェーズ3 の受け入れ基準「**主要導線がキーボードで完結・コントラスト AA・
reduced-motion で過剰演出が止まる**」を満たす。

## 2. スコープ

親設計書のフェーズ3は5領域（色覚/コントラスト・キーボード・モバイル・ロード体感・モーション）を
挙げるが、本フェーズは**受け入れ基準に直結する中核3領域**に絞る。ロード体感・HUD解説プレート化・
盤面のビューポート追従は §8 のとおり別フェーズへ繰延する（PR を適切な大きさに保つため）。

- A. コントラスト AA 準拠
- B. キーボード操作・フォーカス可視化・タップターゲット 44px
- C. reduced-motion 配慮

## 3. スコープと安全境界（親設計書 §4 厳守）

picture-puzzle 専用コードのみ変更。共有コードへ波及させない。

- 触ってよい: `src/pages/gallery-theme.ts` / `src/pages/PuzzlePage.styles.ts` /
  `src/components/TitleScreen.tsx` / `src/components/molecules/{DifficultySelector,ArtworkFrame,CuratorGoalBanner,CollectionView}.styles.ts` /
  `src/components/molecules/CollectionView.tsx`（BackButton の focus-visible が styles 側で完結しない場合のみ）
- 触らない: `src/styles/GlobalStyle.ts`（reduced-motion の既存ブロックはあるが不可侵）・
  `src/styles/tokens/*`・`src/App.tsx`・`src/pages/GameListPage.tsx`・`src/features/*`
- reduced-motion は `PuzzlePageContainer`（`PuzzlePage.styles.ts`）配下に `@media` を置き、
  カスケードで**配下限定**にする（局所テーマ注入と同じ「他ゲーム無傷」の原則）。

## 4. A. コントラスト AA 準拠

色は `gallery-theme.ts` の `galleryTokens` が単一ソース。各 styled は galleryTokens 経由で
色を参照するため、トークンを修正すれば全 picture-puzzle コンポーネントへ波及する。

### 確定値（cream `#f4f1ea` / mat `#fffdf9` 背景で WCAG 相対輝度比を実測）

| トークン | 変更前 | 変更後 | cream 比 | 用途 |
|---|---|---|---|---|
| `sub` | `#7a7062`（4.31:1・AA不足） | `#6b6155` | **5.37:1** ✅ | サブ文字（説明・ラベル・キャプション） |
| `goldText`（新設） | —（gold をテキストに流用し 2.93:1） | `#7a5f28` | **5.33:1** ✅ | ★ランク・称号など**テキスト**用途 |
| `gold`（据置） | `#a8894e` | `#a8894e`（変更なし） | 2.93:1 | 額縁・ボーダー・プログレス塗り（**非テキスト**装飾のみ） |

- `ink #2b2620`（13.29:1）・`sage`（塗り専用）・`frameBorder`・`mat`・`cream` は変更しない。
- `goldText` へ差し替える**テキスト**用途:
  - `ArtworkFrame.styles.ts` の `Rank`（★鑑定評価）
  - `CuratorGoalBanner.styles.ts` の `Honor`（「あなたは名誉学芸員に認定されました」）
  - `TitleScreen.tsx` の `SecondaryButton` hover 色
- `gold` を維持する**非テキスト**用途: `CuratorGoalBanner` の `Fill`（★★★塗り）、
  `PuzzlePage.styles.ts` の `Instructions` 左ボーダー、額縁系。
- 大文字扱いの小型ラベル（`Kicker` 等 letter-spacing 付き大文字）も、通常文字基準（4.5:1）を
  満たす `sub` 新色で一律 AA 合格とする（大文字 3:1 の緩和には依存しない）。

### 色覚配慮（現状維持＋回帰確認）
- ★ランクは記号（形状）で階級を表現済み、収蔵/未収蔵/未開館はテキスト併記済み、
  ThemeSelector の locked は `🔒` アイコン併記済み。**色のみ依存は既に無い**。本フェーズでは
  これを壊さないことをテストで担保する（色以外の手がかりの存在確認）。

## 5. B. キーボード・フォーカス・タップターゲット

既存の模範実装 `src/features/agile-quiz-sugoroku/presentation/styles/common.ts` の
`&:focus-visible { outline: 2px solid; outline-offset: 2px }` ＋ `min-height: 44px` を
picture-puzzle 局所へ流用する（参照するだけで features を import しない。パターンの踏襲）。

### 対象と変更
- **DifficultySelector**（`.styles.ts`）: `outline: none` を除去し `&:focus-visible` で
  `outline: 2px solid ${ink}; outline-offset: 2px` を付与。現在値の視覚強調は `:focus` 依存を
  やめ、選択済み枠（`frameBorder`→`ink` 太枠）は常時反映。native `<select>` は維持（カスタム化は
  YAGNI・別フェーズ）。コントロール高さを `min-height: 44px` に。
- **TitleScreen**（`.tsx`）: `SecondaryButton`・`EnterButton` に `&:focus-visible` の outline と
  `min-height: 44px`。hover の gold 色は `goldText` へ（§4）。
- **PuzzlePage**（`.styles.ts`）: `StartButton` に `&:focus-visible` と `min-height: 44px`。
- **CollectionView**（`.styles.ts`）: `BackButton` に `&:focus-visible` と `min-height: 44px`。
- 主要導線がキーボードで完結すること（Tab でフォーカス移動、Enter/Space で操作）をテストで確認。

## 6. C. reduced-motion 配慮

`PuzzlePage.styles.ts` の `PuzzlePageContainer` に以下を追加（配下限定）:

```
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- 抑制対象: `TitleScreen` の `fadeIn`、`CuratorGoalBanner` の `Fill` transition、
  `PuzzleBoard` の `completeImageFadeIn`/`confettiFall`/dissolve、`StartButton` hover transform 等。
- JS 生成の演出（`ConfettiOverlay` 等、CSS だけで止まらないもの）は
  `matchMedia('(prefers-reduced-motion: reduce)')`（`ConfirmDialog.tsx`/`TypeWriter.tsx` の前例）で
  分岐し、粒子生成をスキップする。**picture-puzzle 内の該当箇所に限定**する。

## 7. テスト方針（TDD・親設計書 §6 準拠）

- `gallery-theme.test.ts` に**コントラスト比検証**を追加: `sub`・`goldText` × `cream`/`mat` の
  相対輝度比が ≥4.5 であることを純粋計算（WCAG 相対輝度式）でアサート。`gold` は非テキスト用途の
  ため対象外だが、「テキスト用途は goldText を使う」ことを対象コンポーネントの色参照で確認。
- **focus-visible / 44px**: 各 styled のスナップショット的検証は脆いため、
  対象コンポーネントに `:focus-visible` ルールと `min-height: 44px` が存在することを
  スタイル文字列で確認、または主要導線のキーボード操作（Tab→Enter）を testing-library で検証。
- **reduced-motion**: `PuzzlePageContainer` のスタイルに `prefers-reduced-motion` メディアクエリが
  含まれることを確認。JS 分岐は `matchMedia` をモックして粒子生成スキップを検証。
- 回帰: 他ゲーム1本以上をブラウザで開き、背景・配色・アニメが従来どおりか確認（親 §4 手順）。
  特に `gallery-theme.ts` 変更が features/* へ波及しないこと（galleryTokens は picture-puzzle 局所参照）。

## 8. 受け入れ基準

- [ ] `sub`・`goldText` の cream/mat 背景コントラストが ≥4.5:1（テストで検証）。
- [ ] gold のテキスト用途が goldText へ置換され、装飾用途のみ gold が残る。
- [ ] DifficultySelector・主要ボタンにフォーカスリング（focus-visible）が可視化される。
- [ ] 主要導線（入館→目録→戻る／テーマ・難易度→開始）がキーボードで完結する。
- [ ] 主要インタラクティブ要素のタップターゲットが 44px 以上。
- [ ] `prefers-reduced-motion: reduce` で picture-puzzle のアニメ・トランジションが停止する。
- [ ] 色覚依存が増えていない（★・状態はテキスト/形状併用のまま）。
- [ ] 他12ゲームの見た目・アニメに影響しない。

## 9. アウトオブスコープ（YAGNI・別フェーズへ繰延）

- **ロード体感**: 額縁スケルトン・次作品の先読み・レイアウトシフト防止。
- **HUD 解説プレート化 + 盤面額装**: `PuzzleBoard` の StatusBar を美術館の解説プレート体裁へ、
  盤面（現状 `#f0f0f0`/`#ccc`）を ArtFrame 額装へ。構造変更を伴う視覚刷新のため独立フェーズ。
- **モバイル最適化（重）**: 盤面 `maxBoardWidth=600` 固定のビューポート追従、`useSwipe` 閾値調整、
  Wall グリッドの狭幅チューニング。小画面での盤面横はみ出しは既知事項として本繰延に含める。
- DifficultySelector の完全カスタム UI 化（native select 維持で focus-visible により基準は充足）。

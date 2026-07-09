# Picture Puzzle フェーズ3「快適性（アクセシビリティ中核）」Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ギャラリー化で顕在化したアクセシビリティ負債（コントラスト不足・キーボード可視性・過剰モーション）を回収し、WCAG AA・キーボード完結・reduced-motion を満たす。

**Architecture:** 色は `gallery-theme.ts` の `galleryTokens` 単一ソースを修正して全 picture-puzzle へ波及。focus-visible/44px は各 styled に付与。reduced-motion は `PuzzlePageContainer` 配下に `@media` を置きカスケードで配下限定にする。共有 `GlobalStyle.ts`/`tokens/`/`App.tsx`/`features/*` は不可侵。

**Tech Stack:** React 19 + TypeScript + styled-components。テストは Jest 30 + @testing-library/react + user-event。`jest-styled-components` は未導入のため、純 CSS ルールの自動検証は行わず、コントラスト比（純粋計算）とキーボード活性化（振る舞い）を自動テストの核とする。

## Global Constraints

- 応答・コメント・ドキュメントは日本語。コード（変数・関数名）は英語可。`any` 型禁止。
- **安全境界（厳守）**: 変更は picture-puzzle 専用コードに閉じる。触らない: `src/styles/GlobalStyle.ts` / `src/styles/tokens/*` / `src/App.tsx` / `src/pages/GameListPage.tsx` / `src/features/*`。**新規依存を追加しない**（`jest-styled-components` 等も入れない）。
- 色トークンは `gallery-theme.ts` の `galleryTokens` を単一ソースとする。各 styled は galleryTokens 経由で参照する。
- コントラスト確定値（cream `#f4f1ea` / mat `#fffdf9` 背景・WCAG 相対輝度）: `sub` `#7a7062`→`#6b6155`（cream 5.37:1）。`goldText`（新設）`#7a5f28`（cream 5.33:1）。装飾 `gold` `#a8894e` は据置（非テキストのみ）。
- focus-visible の outline は `ink #2b2620`（cream 上 13:1・非テキスト 3:1 を確実に満たす）を使う。タップターゲットは `min-height: 44px`。
- reduced-motion の抑制は `PuzzlePageContainer` 配下限定（他ゲーム無傷）。
- TDD（Red→Green→Refactor）。UI 70%+。コミットは Conventional Commits。

---

### Task 1: コントラスト AA トークン（sub 暗色化・goldText 新設）＋ WCAG 検証テスト

**Files:**
- Modify: `src/pages/gallery-theme.ts`
- Test: `src/pages/gallery-theme.test.ts`

**Interfaces:**
- Produces: `galleryTokens.sub`（`#6b6155`）, `galleryTokens.goldText`（`#7a5f28`・新設）。`gold`/`ink`/`cream`/`mat` 等は不変。

- [ ] **Step 1: 失敗するテストを追記する**

`src/pages/gallery-theme.test.ts` の先頭 import 直後に WCAG コントラスト計算ヘルパと検証を追記する:

```typescript
// WCAG 相対輝度によるコントラスト比（テスト内ローカル計算・実装非依存）
const channelLuminance = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const relativeLuminance = (hex: string): number => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
};
const contrastRatio = (fg: string, bg: string): number => {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
};

describe('gallery-theme コントラスト（WCAG AA）', () => {
  it('sub はテキスト色として cream/mat 背景で 4.5:1 以上', () => {
    expect(contrastRatio(galleryTokens.sub, galleryTokens.cream)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(galleryTokens.sub, galleryTokens.mat)).toBeGreaterThanOrEqual(4.5);
  });

  it('goldText はテキスト色として cream/mat 背景で 4.5:1 以上', () => {
    expect(contrastRatio(galleryTokens.goldText, galleryTokens.cream)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(galleryTokens.goldText, galleryTokens.mat)).toBeGreaterThanOrEqual(4.5);
  });

  it('ink は本文テキストとして cream 背景で AA を十分満たす', () => {
    expect(contrastRatio(galleryTokens.ink, galleryTokens.cream)).toBeGreaterThanOrEqual(7);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- gallery-theme`
Expected: FAIL（`galleryTokens.goldText` が undefined、かつ現行 `sub #7a7062` は cream で 4.31 < 4.5）

- [ ] **Step 3: トークンを修正する**

`src/pages/gallery-theme.ts` の `galleryTokens` を以下へ変更（`sub` を暗色化、`goldText` を追加。他は不変）:

```typescript
export const galleryTokens = {
  cream: '#f4f1ea',
  ink: '#2b2620',
  sub: '#6b6155',
  gold: '#a8894e',
  goldText: '#7a5f28',
  sage: '#8a9a7b',
  mat: '#fffdf9',
  frameBorder: '#e3ddd0',
} as const;
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- gallery-theme`
Expected: PASS（既存4件 + 新規3件）

- [ ] **Step 5: コミット**

```bash
git add src/pages/gallery-theme.ts src/pages/gallery-theme.test.ts
git commit -m "feat: gallery テーマの sub を AA 準拠へ暗色化し goldText トークンを新設"
```

---

### Task 2: テキスト用途を goldText へ差し替え

**Files:**
- Modify: `src/components/molecules/ArtworkFrame.styles.ts:44-47`
- Modify: `src/components/molecules/CuratorGoalBanner.styles.ts:57-62`
- Modify: `src/components/TitleScreen.tsx`（SecondaryButton hover 色）

**Interfaces:**
- Consumes: `galleryTokens.goldText`（Task 1）
- Produces: なし（スタイル差し替え）

- [ ] **Step 1: ArtworkFrame の Rank を goldText に変更する**

`src/components/molecules/ArtworkFrame.styles.ts` の `Rank`（44-47行）の `color` を変更:

```typescript
export const Rank = styled.span`
  color: ${galleryTokens.goldText};
  letter-spacing: 0.1em;
`;
```

- [ ] **Step 2: CuratorGoalBanner の Honor を goldText に変更する**

`src/components/molecules/CuratorGoalBanner.styles.ts` の `Honor`（57-62行）の `color` を変更（`Fill` の gold 塗りは非テキストのため据置）:

```typescript
export const Honor = styled.p`
  margin: 12px 0 0;
  text-align: center;
  color: ${galleryTokens.goldText};
  font-family: Georgia, 'Times New Roman', 'Yu Mincho', serif;
`;
```

- [ ] **Step 3: TitleScreen の SecondaryButton hover 色を goldText に変更する**

`src/components/TitleScreen.tsx` の `SecondaryButton` の `&:hover` の `color` を `galleryTokens.gold` から `galleryTokens.goldText` に変更する（既存の該当行のみ差し替え）:

```tsx
  &:hover {
    color: ${galleryTokens.goldText};
  }
```

- [ ] **Step 4: 既存テスト・型・lint が壊れていないことを確認する**

Run: `npm test -- ArtworkFrame CuratorGoalBanner TitleScreen`
Expected: PASS（既存テストが緑のまま。色はスタイルのみの変更で描画は不変）
Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/components/molecules/ArtworkFrame.styles.ts src/components/molecules/CuratorGoalBanner.styles.ts src/components/TitleScreen.tsx
git commit -m "feat: 鑑定評価・称号・導線hoverのテキストを goldText へ差し替え AA 準拠化"
```

---

### Task 3: DifficultySelector の focus-visible 化と 44px タップターゲット

**Files:**
- Modify: `src/components/molecules/DifficultySelector.styles.ts:23-46`

**Interfaces:**
- Consumes: `galleryTokens.ink`, `galleryTokens.mat`, `galleryTokens.frameBorder`, `galleryTokens.cream`
- Produces: なし

- [ ] **Step 1: StyledSelect を focus-visible + 44px へ変更する**

`src/components/molecules/DifficultySelector.styles.ts` の `StyledSelect`（23-46行）を以下へ置き換える（`outline: none` の常時抑制をやめ、`:focus` を `:focus-visible` にしてフォーカスリングを可視化。高さ 44px を保証）:

```typescript
export const StyledSelect = styled.select`
  width: 100%;
  padding: 10px;
  min-height: 44px;
  box-sizing: border-box;
  /* 額縁のサイズ選択。非選択時は控えめな縁取りのみ */
  border: 1px solid ${galleryTokens.frameBorder};
  border-radius: 2px;
  background-color: ${galleryTokens.cream};
  color: ${galleryTokens.ink};
  font-size: 1rem;
  appearance: none;
  cursor: pointer;

  &:focus-visible {
    /* キーボード操作時は額のサイズを選んでいる状態としてフォーカスリングで強調する */
    outline: 2px solid ${galleryTokens.ink};
    outline-offset: 2px;
    border-color: ${galleryTokens.ink};
    background: ${galleryTokens.mat};
  }

  option {
    background-color: ${galleryTokens.cream};
    color: ${galleryTokens.ink};
  }
`;
```

- [ ] **Step 2: 既存 DifficultySelector テストが緑のままか確認する**

Run: `npm test -- DifficultySelector`
Expected: PASS（描画・onChange は不変。スタイルのみ変更）

- [ ] **Step 3: 型・lint を確認する**

Run: `npm run typecheck && npx eslint src/components/molecules/DifficultySelector.styles.ts`
Expected: エラー・警告なし

- [ ] **Step 4: コミット**

```bash
git add src/components/molecules/DifficultySelector.styles.ts
git commit -m "feat: 難易度セレクタを focus-visible フォーカスリング＋44px タップtarget化"
```

---

### Task 4: 主要ボタンの focus-visible と 44px

**Files:**
- Modify: `src/pages/PuzzlePage.styles.ts:32-55`（StartButton。EnterButton は `styled(StartButton)` のため継承）
- Modify: `src/components/molecules/CollectionView.styles.ts:25-37`（BackButton）
- Modify: `src/components/TitleScreen.tsx`（SecondaryButton の focus-visible + 44px）

**Interfaces:**
- Consumes: `galleryTokens.ink`, `galleryTokens.mat`, `galleryTokens.frameBorder`
- Produces: なし

- [ ] **Step 1: StartButton に focus-visible + min-height を追加する**

`src/pages/PuzzlePage.styles.ts` の `StartButton`（32-55行）に `min-height: 44px` と `&:focus-visible` を追加する（既存の `&:hover` / `&:disabled` は保持）:

```typescript
export const StartButton = styled.button`
  background: ${galleryTokens.ink};
  color: ${galleryTokens.cream};
  padding: 13px 34px;
  min-height: 44px;
  box-sizing: border-box;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  margin-top: 24px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    filter: brightness(1.15);
  }

  &:focus-visible {
    outline: 2px solid ${galleryTokens.ink};
    outline-offset: 2px;
  }

  &:disabled {
    background: #b8b0a2;
    cursor: not-allowed;
    transform: none;
  }
`;
```

- [ ] **Step 2: BackButton に focus-visible + min-height を追加する**

`src/components/molecules/CollectionView.styles.ts` の `BackButton`（25-37行）を以下へ変更:

```typescript
export const BackButton = styled.button`
  background: transparent;
  border: 1px solid ${galleryTokens.frameBorder};
  border-radius: 4px;
  padding: 6px 14px;
  min-height: 44px;
  box-sizing: border-box;
  color: ${galleryTokens.ink};
  cursor: pointer;
  font-size: 0.8rem;

  &:hover {
    background: ${galleryTokens.mat};
  }

  &:focus-visible {
    outline: 2px solid ${galleryTokens.ink};
    outline-offset: 2px;
  }
`;
```

- [ ] **Step 3: SecondaryButton に focus-visible + min-height を追加する**

`src/components/TitleScreen.tsx` の `SecondaryButton`（styled.button）に `min-height: 44px` と `&:focus-visible` を追加する。既存の定義（background transparent / border none / 下線 / hover goldText）に以下を加える形にする:

```tsx
const SecondaryButton = styled.button`
  display: block;
  margin: 14px auto 0;
  min-height: 44px;
  background: transparent;
  border: none;
  color: ${galleryTokens.sub};
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  cursor: pointer;
  text-decoration: underline;
  animation: ${fadeIn} 0.8s ease-out 0.9s both;

  &:hover {
    color: ${galleryTokens.goldText};
  }

  &:focus-visible {
    outline: 2px solid ${galleryTokens.ink};
    outline-offset: 2px;
  }
`;
```

> 注: `fadeIn` は既存の keyframes、`galleryTokens` は既存 import。Task 2 で hover は既に goldText 化済み。本タスクでは focus-visible と min-height の追加が新規差分。既存の `SecondaryButton` 定義に無い行だけを足すこと（重複定義を作らない）。

- [ ] **Step 4: 既存テスト・型・lint を確認する**

Run: `npm test -- TitleScreen CollectionView PuzzlePage`
Expected: PASS（描画・導線は不変）
Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/pages/PuzzlePage.styles.ts src/components/molecules/CollectionView.styles.ts src/components/TitleScreen.tsx
git commit -m "feat: 主要ボタン（開始・戻る・目録導線）に focus-visible と 44px を付与"
```

---

### Task 5: reduced-motion 配慮（PuzzlePageContainer 配下限定）

**Files:**
- Modify: `src/pages/PuzzlePage.styles.ts:4-15`（PuzzlePageContainer）

**Interfaces:**
- Consumes: `galleryTokens`, `galleryThemeVars`（既存 import）
- Produces: なし

- [ ] **Step 1: PuzzlePageContainer に reduced-motion メディアクエリを追加する**

`src/pages/PuzzlePage.styles.ts` の `PuzzlePageContainer`（4-15行）の末尾（`color: var(--text-primary);` の後）に、配下限定の抑制を追加する:

```typescript
export const PuzzlePageContainer = styled.div`
  ${galleryThemeVars}
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  width: 100%;
  min-height: 100vh;
  /* 美術館の壁。グローバル背景グラデを覆い、配下だけをギャラリー色にする */
  background: ${galleryTokens.cream};
  color: var(--text-primary);

  /* モーション過敏設定では配下の演出（fadeIn・紙吹雪・ディゾルブ・hover 移動等）を抑制する。
     配下限定なので他ゲームには波及しない。 */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
```

- [ ] **Step 2: 既存 PuzzlePage テスト・型・lint を確認する**

Run: `npm test -- PuzzlePage`
Expected: PASS
Run: `npm run typecheck && npx eslint src/pages/PuzzlePage.styles.ts`
Expected: エラー・警告なし

- [ ] **Step 3: コミット**

```bash
git add src/pages/PuzzlePage.styles.ts
git commit -m "feat: prefers-reduced-motion で picture-puzzle 配下の演出を抑制（配下限定）"
```

---

### Task 6: キーボード完結の振る舞いテスト

**Files:**
- Create: `src/pages/PuzzlePage.keyboard.test.tsx`

**Interfaces:**
- Consumes: `PuzzlePage`（`src/pages/PuzzlePage`）、`PuzzleRecordStorage`/`TotalClearsStorage`（`src/application/ports/storage-port`）
- Produces: なし

- [ ] **Step 1: 失敗するテストを書く**

native ボタンがキーボード（Enter）で活性化し、主要導線（タイトル→収蔵目録→戻る）が完結することを検証する。TitleScreen をモックせず実コンポーネントで描画する:

```tsx
// src/pages/PuzzlePage.keyboard.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PuzzlePage from './PuzzlePage';
import { PuzzleRecordStorage, TotalClearsStorage } from '../application/ports/storage-port';

const emptyRecordStorage: PuzzleRecordStorage = {
  getAll: () => [],
  get: () => undefined,
  save: () => {},
  recordScore: () => ({ isBestScore: false }),
};
const zeroTotalClears: TotalClearsStorage = {
  get: () => 0,
  increment: () => 0,
};

describe('PuzzlePage キーボード操作', () => {
  it('収蔵目録の導線と戻るがキーボード（Enter）で完結する', async () => {
    const user = userEvent.setup();
    render(
      <PuzzlePage recordStorage={emptyRecordStorage} totalClearsStorage={zeroTotalClears} />
    );

    // タイトルの「収蔵目録を見る」を Enter で開く
    const openButton = screen.getByRole('button', { name: '収蔵目録を見る' });
    openButton.focus();
    expect(openButton).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('収蔵目録')).toBeInTheDocument();

    // 「戻る」を Enter でタイトルへ戻る
    const backButton = screen.getByRole('button', { name: '戻る' });
    backButton.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: '入館する' })).toBeInTheDocument();
  });
});
```

> 注: `PuzzleRecordStorage`/`TotalClearsStorage` の正確な型は `src/application/ports/storage-port.ts` を Read して合わせること。`recordScore` の戻り値型が異なる場合はその型に合わせる（このテストでは呼ばれないので最小スタブでよい）。実 `PuzzlePage.test.tsx` のモックストレージ定義があれば流用してもよい。

- [ ] **Step 2: テストが失敗しないこと（もしくは意図通り緑）を確認する**

Run: `npm test -- PuzzlePage.keyboard`
Expected: PASS（native `<button>` は Enter で onClick が発火する。もし FAIL する場合は、ボタンが非 native 要素になっていないか、導線名が一致しているかを確認）

> このテストは「キーボードで主要導線が完結する」受け入れ基準の回帰ガード。実装は Task 3/4 で既に満たされているため、テスト追加時点で緑になる想定（回帰防止テスト）。

- [ ] **Step 3: コミット**

```bash
git add src/pages/PuzzlePage.keyboard.test.tsx
git commit -m "test: 収蔵目録導線がキーボードで完結することの回帰テストを追加"
```

---

### Task 7: 全体検証・アクセシビリティ手動確認・回帰・PR

**Files:**
- なし（検証のみ）

- [ ] **Step 1: CI パイプラインを実行する**

Run: `npm run ci`
Expected: lint:ci（警告0）→ typecheck → test → build がすべて PASS

- [ ] **Step 2: 開発サーバーでアクセシビリティを手動確認する**

Run: `npm start`
確認項目:
- Tab キーで「入館する」「収蔵目録を見る」「戻る」「難易度セレクタ」「パズルを開始」にフォーカスリング（ink の 2px outline）が可視化される
- マウスクリック時はフォーカスリングが出ない（`:focus-visible` の効果）
- 難易度セレクタ・各ボタンの高さが 44px 以上（DevTools で計測）
- OS のモーション低減設定 ON（または DevTools の Rendering → Emulate `prefers-reduced-motion: reduce`）で、タイトルの fadeIn・紙吹雪・ボタン hover 移動が止まる
- 収蔵目録の★鑑定評価・「名誉学芸員に認定」・サブ文字（説明・キャプション）が読みやすい（暗色化後）

- [ ] **Step 3: 他ゲーム非波及の回帰チェック（親設計書 §4 手順）**

`npm start` で picture-puzzle 以外のゲーム1本以上（例: air-hockey）を開き、背景・配色・アニメが従来どおりであること、reduced-motion 抑制が picture-puzzle 外へ波及していないことを確認する。

- [ ] **Step 4: プッシュして PR を作成する**

```bash
git push -u origin feature/picture-puzzle-gallery-phase3
gh pr create --base main --title "feat: Picture Puzzle フェーズ3 快適性（アクセシビリティ中核）" --body "$(cat <<'EOF'
## 概要
ギャラリー化で顕在化したアクセシビリティ負債を回収。WCAG AA コントラスト・キーボード完結・reduced-motion を満たす。変更は picture-puzzle 局所に限定。

## 変更内容
- コントラスト AA: gallery-theme の sub を #6b6155(5.37:1) へ、テキスト用 goldText #7a5f28(5.33:1) を新設。★鑑定評価・称号・導線hoverを goldText へ差し替え
- キーボード/フォーカス: 難易度セレクタと主要ボタンを :focus-visible フォーカスリング化、min 44px タップターゲット
- reduced-motion: PuzzlePageContainer 配下限定でアニメ・トランジションを抑制

## テスト方法
- [x] npm run ci（警告0）
- [ ] Tab でフォーカスリング可視・マウスでは非表示
- [ ] reduced-motion で演出停止
- [ ] 他12ゲームへ非波及

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: CI を確認する**

Run: `gh pr checks <PR番号>`
Expected: 全チェック（Lint/Test/TypeCheck/Build/E2E）が PASS

---

## Self-Review

**Spec coverage（設計書 §8 受け入れ基準 との対応）:**
- sub・goldText の cream/mat コントラスト ≥4.5:1（テスト検証）→ Task 1 ✅
- gold のテキスト用途を goldText へ置換・装飾用途のみ gold 残置 → Task 2 ✅
- DifficultySelector・主要ボタンに focus-visible フォーカスリング → Task 3, 4 ✅
- 主要導線がキーボードで完結 → Task 6（振る舞いテスト）＋ Task 3/4（実装）✅
- タップターゲット 44px 以上 → Task 3, 4 ✅
- prefers-reduced-motion で picture-puzzle のアニメ・トランジション停止 → Task 5 ✅
- 色覚依存が増えていない → 既存のテキスト/形状併用を変更せず（Task 2 は色のみ変更）、Task 7 手動確認 ✅
- 他12ゲーム非波及 → 全タスク picture-puzzle 局所＋Task 7 回帰チェック ✅

**Placeholder scan:** プレースホルダなし。純 CSS ルール（outline/44px/media query）は jest-styled-components 不在のため自動テストせず、Task 7 で手動確認と明記（testing.md の過度なスナップショット回避に整合）。コントラストとキーボードは自動テストで担保。

**Type consistency:** `galleryTokens.goldText`（Task 1 で追加）を Task 2/4 で参照。`sub` 新色を Task 1 で確定し他タスクは参照のみ。`PuzzleRecordStorage`/`TotalClearsStorage`（Task 6）は実型を Read して合わせる注記あり。focus-visible outline 色は全タスクで `ink` に統一。

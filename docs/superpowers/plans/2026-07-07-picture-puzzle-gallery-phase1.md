# Picture Puzzle ギャラリー化 フェーズ1「ギャラリーの器」実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** picture-puzzle の全4画面（タイトル／セットアップ／プレイ中／リザルト）を、共有スタイルに触れずに「美術館ギャラリー」のトーンへ視覚刷新する。

**Architecture:** ギャラリーのトーンは `PuzzlePageContainer` に CSS カスタムプロパティを局所上書きして配下だけに適用する（グローバル `:root` は不可侵）。額装は再利用コンポーネント `ArtFrame` に集約し、各画面へ差し込む。コピー変更は概念の核となる2箇所に限定する。

**Tech Stack:** React 19 / TypeScript / styled-components / Jest + @testing-library/react / Playwright(E2E)

## Global Constraints

設計書 `docs/superpowers/specs/2026-07-07-picture-puzzle-gallery-brushup-design.md` の §4 安全境界を全タスクで厳守する。

- **触らない（全ゲーム共有）**: `src/styles/GlobalStyle.ts`、`src/styles/tokens/*`、`src/App.tsx`、`src/pages/GameListPage.tsx`、`src/features/*`
- **局所テーマ注入のみ**: グローバル CSS 変数の再定義は `PuzzlePageContainer` セレクタ内に閉じる。`:root` や `body` へ書かない
- **禁止**: `any` 型、`domain/` からの外側参照、`dangerouslySetInnerHTML`
- **命名**: 変数/関数 camelCase、型/コンポーネント PascalCase、ファイル kebab-case（コンポーネントは PascalCase.tsx）、テスト `*.test.tsx`
- **コメントは日本語**、「なぜ」を優先
- **各タスク完了時**: `npm test -- <対象>` がグリーン。フェーズ完了時に `npm run ci`（lint:ci→typecheck→test:coverage→build）を通す。E2E はローカル実行不可のため CI 検証（コミットには E2E 修正を含める）
- **回帰確認**: フェーズ完了時、picture-puzzle 以外のゲーム1本を `npm start` で開き、背景・配色が従来どおりであることを目視確認

## パレット（設計書 §3 より・全タスク共通）

| トークン | 値 | 用途 |
|---|---|---|
| cream | `#f4f1ea` | 美術館の壁（ページ背景） |
| ink | `#2b2620` | 主要テキスト |
| sub | `#7a7062` | 副次テキスト |
| gold | `#a8894e` | アクセント（評価・定位置光） |
| sage | `#8a9a7b` | 進捗 |
| mat | `#fffdf9` | 額の台紙・パネル |
| frameBorder | `#e3ddd0` | 額縁・境界線 |

## ファイル構成（作成/変更）

- 作成: `src/pages/gallery-theme.ts` — 局所テーマ変数（トークン定数＋CSS変数文字列）
- 作成: `src/pages/gallery-theme.test.ts`
- 作成: `src/components/molecules/ArtFrame.tsx` / `ArtFrame.styles.ts` / `ArtFrame.test.tsx` — 額装
- 変更: `src/pages/PuzzlePage.styles.ts` — `PuzzlePageContainer` へ局所テーマ注入＋美術館背景、`SetupSection`/`GameSection`/`StartButton`/`Instructions` のトーン調整
- 変更: `src/components/TitleScreen.tsx` / `TitleScreen.test.tsx` — ギャラリー化＋コピー「入館する」
- 変更: `e2e/picture-puzzle/helpers/puzzle-page.ts` — コピー変更に追随
- 変更: `src/components/molecules/ThemeSelector.styles.ts` — 展示室カード化
- 変更: `src/components/molecules/DifficultySelector.styles.ts` — 「額のサイズ」トーン
- 変更: `src/components/GameSection.tsx` — 盤面の額装＋HUD解説プレート
- 変更: `src/components/molecules/ResultScreen.tsx` / `ResultScreen.styles.ts` / `ResultScreen.test.tsx` — 収蔵セレモニー＋コピー「作品を収蔵しました」

---

### Task 1: ギャラリー・テーマトークンと局所注入

**Files:**
- Create: `src/pages/gallery-theme.ts`
- Test: `src/pages/gallery-theme.test.ts`
- Modify: `src/pages/PuzzlePage.styles.ts:3-9`（`PuzzlePageContainer`）

**Interfaces:**
- Produces: `galleryTokens`（`Record` 定数: cream/ink/sub/gold/sage/mat/frameBorder）、`galleryThemeVars: string`（CSS カスタムプロパティ上書き文字列）

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/pages/gallery-theme.test.ts
import { galleryTokens, galleryThemeVars } from './gallery-theme';

describe('gallery-theme', () => {
  it('美術館トーンの基調色トークンを提供する', () => {
    expect(galleryTokens.cream).toBe('#f4f1ea');
    expect(galleryTokens.ink).toBe('#2b2620');
    expect(galleryTokens.gold).toBe('#a8894e');
  });

  it('text-primary をインク色へ局所上書きする', () => {
    expect(galleryThemeVars).toContain(`--text-primary: ${galleryTokens.ink}`);
  });

  it('グローバル背景グラデを配下で無効化する', () => {
    expect(galleryThemeVars).toContain('--bg-gradient: none');
  });

  it('アクセント色をゴールドへ差し替える', () => {
    expect(galleryThemeVars).toContain(`--accent-color: ${galleryTokens.gold}`);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- gallery-theme`
Expected: FAIL（`Cannot find module './gallery-theme'`）

- [ ] **Step 3: 最小実装**

```ts
// src/pages/gallery-theme.ts
/**
 * ギャラリー（美術館）トーンの局所テーマ。
 * PuzzlePageContainer にのみ注入し、配下だけへ適用する。
 * グローバル :root（styles/GlobalStyle.ts）は不可侵 —— 他ゲームへ波及させないため。
 */
export const galleryTokens = {
  cream: '#f4f1ea',
  ink: '#2b2620',
  sub: '#7a7062',
  gold: '#a8894e',
  sage: '#8a9a7b',
  mat: '#fffdf9',
  frameBorder: '#e3ddd0',
} as const;

/** PuzzlePageContainer に注入する CSS カスタムプロパティ上書き（配下限定） */
export const galleryThemeVars = `
  --bg-gradient: none;
  --text-primary: ${galleryTokens.ink};
  --text-secondary: ${galleryTokens.sub};
  --accent-color: ${galleryTokens.gold};
  --glass-bg: ${galleryTokens.mat};
  --glass-border: ${galleryTokens.frameBorder};
  --glass-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
`;
```

- [ ] **Step 4: `PuzzlePageContainer` へ注入**

```ts
// src/pages/PuzzlePage.styles.ts （先頭の import を追加）
import styled from 'styled-components';
import { galleryThemeVars, galleryTokens } from './gallery-theme';

// PuzzlePageContainer を差し替え
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
`;
```

- [ ] **Step 5: テストと関連テストがパス**

Run: `npm test -- gallery-theme PuzzlePage`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/pages/gallery-theme.ts src/pages/gallery-theme.test.ts src/pages/PuzzlePage.styles.ts
git commit -m "feat: ギャラリー局所テーマを PuzzlePageContainer へ注入"
```

---

### Task 2: 額装コンポーネント ArtFrame

**Files:**
- Create: `src/components/molecules/ArtFrame.tsx`
- Create: `src/components/molecules/ArtFrame.styles.ts`
- Test: `src/components/molecules/ArtFrame.test.tsx`

**Interfaces:**
- Consumes: `galleryTokens`（Task 1）
- Produces: `ArtFrame`（`React.FC<ArtFrameProps>`, props `{ children: React.ReactNode; className?: string }`, ルートに `data-testid="art-frame"`）

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/molecules/ArtFrame.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ArtFrame } from './ArtFrame';

describe('ArtFrame', () => {
  it('子要素を額縁の中に描画する', () => {
    render(
      <ArtFrame>
        <img alt="作品" src="art.webp" />
      </ArtFrame>
    );
    const frame = screen.getByTestId('art-frame');
    expect(frame).toContainElement(screen.getByAltText('作品'));
  });

  it('className を外側へ引き継ぐ', () => {
    render(<ArtFrame className="hero">中身</ArtFrame>);
    expect(screen.getByTestId('art-frame')).toHaveClass('hero');
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- ArtFrame`
Expected: FAIL（`Cannot find module './ArtFrame'`）

- [ ] **Step 3: スタイルと実装**

```ts
// src/components/molecules/ArtFrame.styles.ts
import styled from 'styled-components';
import { galleryTokens } from '../../pages/gallery-theme';

/** 額縁（外枠＋影） */
export const FrameOuter = styled.div`
  background: ${galleryTokens.mat};
  padding: 10px;
  border: 1px solid ${galleryTokens.frameBorder};
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
`;

/** 台紙（マット）。作品と額縁の間の余白 */
export const FrameMat = styled.div`
  background: #ffffff;
  padding: 6px;
  line-height: 0;
`;
```

```tsx
// src/components/molecules/ArtFrame.tsx
import React from 'react';
import { FrameOuter, FrameMat } from './ArtFrame.styles';

export interface ArtFrameProps {
  /** 額装する中身（画像・盤面など） */
  readonly children: React.ReactNode;
  /** 外枠へ渡す追加クラス */
  readonly className?: string;
}

/** 作品を美術館の額縁＋マットで額装する共通コンポーネント */
export const ArtFrame: React.FC<ArtFrameProps> = ({ children, className }) => (
  <FrameOuter className={className} data-testid="art-frame">
    <FrameMat>{children}</FrameMat>
  </FrameOuter>
);
```

- [ ] **Step 4: テストがパス**

Run: `npm test -- ArtFrame`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/components/molecules/ArtFrame.tsx src/components/molecules/ArtFrame.styles.ts src/components/molecules/ArtFrame.test.tsx
git commit -m "feat: 額装コンポーネント ArtFrame を追加"
```

---

### Task 3: タイトル画面のギャラリー化

コピー「はじめる」→「入館する」。単体テスト・E2E ヘルパを同時更新する（E2E はローカル実行不可・CI 検証）。

**Files:**
- Modify: `src/components/TitleScreen.tsx`
- Modify: `src/components/TitleScreen.test.tsx`
- Modify: `src/pages/PuzzlePage.test.tsx:16,72,83,101`（スタブの「はじめる」を「入館する」へ）
- Modify: `e2e/picture-puzzle/helpers/puzzle-page.ts:40,45`

**Interfaces:**
- Consumes: `ArtFrame`（Task 2）

- [ ] **Step 1: 失敗するテストへ更新**

`src/components/TitleScreen.test.tsx` の該当2箇所を書き換える:

```tsx
  it('タイトルと入館するボタンが表示される', () => {
    render(<TitleScreen onStart={jest.fn()} onDebugActivate={jest.fn()} />);
    expect(screen.getByText('ピクチャーパズル')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '入館する' })).toBeInTheDocument();
  });

  it('入館するボタンをクリックするとonStartが呼ばれる', () => {
    const onStart = jest.fn();
    render(<TitleScreen onStart={onStart} onDebugActivate={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '入館する' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- TitleScreen`
Expected: FAIL（「入館する」が見つからない）

- [ ] **Step 3: TitleScreen を実装**

`src/components/TitleScreen.tsx` を更新（グロー装飾を廃し、ArtFrame ヒーロー＋明朝トーン＋コピー変更）:

```tsx
import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { SetupSection, StartButton } from '../pages/PuzzlePage.styles';
import { ArtFrame } from './molecules/ArtFrame';
import { galleryTokens } from '../pages/gallery-theme';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Hero = styled(ArtFrame)`
  width: 150px;
  margin: 0 auto 22px;
  animation: ${fadeIn} 0.8s ease-out;
`;

/** ヒーロー額の中身（作品を象徴する静かなグラデ面） */
const HeroArt = styled.div`
  height: 96px;
  background: linear-gradient(135deg, ${galleryTokens.sage}, ${galleryTokens.gold});
`;

const Title = styled.h1`
  font-family: Georgia, 'Times New Roman', 'Yu Mincho', serif;
  font-size: 2.4rem;
  letter-spacing: 0.14em;
  margin: 0 0 8px;
  color: ${galleryTokens.ink};
  animation: ${fadeIn} 0.8s ease-out;
`;

const Kicker = styled.p`
  font-size: 0.72rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: ${galleryTokens.sub};
  margin: 0 0 24px;
  animation: ${fadeIn} 0.8s ease-out 0.3s both;
`;

const EnterButton = styled(StartButton)`
  animation: ${fadeIn} 0.8s ease-out 0.6s both;
`;

type TitleScreenProps = {
  onStart: () => void;
  onDebugActivate: () => void;
};

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onDebugActivate }) => {
  const bufferRef = useRef('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      bufferRef.current = (bufferRef.current + e.key).slice(-3);
      if (bufferRef.current === 'jin') {
        onDebugActivate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDebugActivate]);

  return (
    <SetupSection>
      <Hero>
        <HeroArt />
      </Hero>
      <Title>ピクチャーパズル</Title>
      <Kicker>Your Private Gallery</Kicker>
      <EnterButton onClick={onStart}>入館する</EnterButton>
    </SetupSection>
  );
};

export default TitleScreen;
```

- [ ] **Step 4: StartButton を美術館トーンへ調整**

`src/pages/PuzzlePage.styles.ts` の `StartButton`（27-52行）を差し替え。丸ピル＋シアン発光を廃し、角ばった上品なボタンへ:

```ts
export const StartButton = styled.button`
  background: ${galleryTokens.ink};
  color: ${galleryTokens.cream};
  padding: 13px 34px;
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

  &:disabled {
    background: #b8b0a2;
    cursor: not-allowed;
    transform: none;
  }
`;
```

- [ ] **Step 5: 参照コピーを一括更新**

`src/pages/PuzzlePage.test.tsx` の「はじめる」4箇所を「入館する」へ、`e2e/picture-puzzle/helpers/puzzle-page.ts` の2箇所（`getByText('はじめる')` → `getByText('入館する')`）を更新。

Run: `grep -rn "はじめる" src/pages/PuzzlePage.test.tsx e2e/picture-puzzle`
Expected: 一致なし（すべて「入館する」へ置換済み）

- [ ] **Step 6: テストがパス**

Run: `npm test -- TitleScreen PuzzlePage`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/components/TitleScreen.tsx src/components/TitleScreen.test.tsx src/pages/PuzzlePage.styles.ts src/pages/PuzzlePage.test.tsx e2e/picture-puzzle/helpers/puzzle-page.ts
git commit -m "feat: タイトル画面をギャラリー化しコピーを入館するへ変更"
```

---

### Task 4: セットアップ画面（展示室カード＋額のサイズ）

テーマ選択を美術館の「展示室カード」トーンへ、難易度選択を「額のサイズ」トーンへ視覚刷新する。**スタイルのみ**変更し、DOM 構造・props・表示文言（アンロック条件等）は維持する（既存テストを壊さない）。収蔵率の実データ表示はフェーズ2で接続。

**Files:**
- Modify: `src/components/molecules/ThemeSelector.styles.ts`
- Modify: `src/components/molecules/DifficultySelector.styles.ts`
- Modify: `src/pages/PuzzlePage.styles.ts`（`SetupSection` のガラス質感をマット質感へ）

**Interfaces:**
- Consumes: `galleryTokens`（Task 1）

- [ ] **Step 1: 既存テストがグリーンであることを確認（着手前ベースライン）**

Run: `npm test -- ThemeSelector DifficultySelector PuzzleSections`
Expected: PASS（既存の全テスト。以降スタイル変更で壊さないこと）

- [ ] **Step 2: SetupSection をマット質感へ**

`src/pages/PuzzlePage.styles.ts` の `SetupSection`（11-25行）の `background`/`border`/`backdrop-filter` を調整:

```ts
export const SetupSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  padding: 30px;
  background: ${galleryTokens.mat};
  border: 1px solid ${galleryTokens.frameBorder};
  border-radius: 6px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 700px;
  color: var(--text-primary);
`;
```

（`backdrop-filter: blur(10px)` は削除。美術館トーンはガラスでなく紙/マット質感）

- [ ] **Step 3: ThemeSelector を展示室カードへ**

`src/components/molecules/ThemeSelector.styles.ts` を開き、サムネイルカード相当の styled 要素の `background`/`border`/`box-shadow`/角丸を `galleryTokens` の mat/frameBorder に合わせて調整（額装カード見た目）。選択中カードの強調は `outline: 2px solid ${galleryTokens.gold}` を使う。ファイル冒頭に `import { galleryTokens } from '../../pages/gallery-theme';` を追加。

（実際の要素名はファイルに依存。カード外枠・選択状態・見出しの3要素に上記トークンを適用する）

- [ ] **Step 4: DifficultySelector を「額のサイズ」トーンへ**

`src/components/molecules/DifficultySelector.styles.ts` を開き、各難易度ボタンを角ばった上品なトーンへ（`galleryTokens` 使用）。選択中は `border: 2px solid ${galleryTokens.ink}; background: ${galleryTokens.mat};`、非選択は `border: 1px solid ${galleryTokens.frameBorder};`。

- [ ] **Step 5: スタイル変更後も既存テストがグリーン**

Run: `npm test -- ThemeSelector DifficultySelector PuzzleSections`
Expected: PASS（DOM 構造・文言は不変のため既存テストは通る）

- [ ] **Step 6: 目視確認**

Run: `npm start`（別ターミナル）→ ブラウザで /puzzle のセットアップ画面を開き、展示室カード・額のサイズが美術館トーンで表示されることを確認

- [ ] **Step 7: コミット**

```bash
git add src/components/molecules/ThemeSelector.styles.ts src/components/molecules/DifficultySelector.styles.ts src/pages/PuzzlePage.styles.ts
git commit -m "feat: セットアップ画面を展示室カードのトーンへ刷新"
```

---

### Task 5: プレイ中画面（盤面の額装＋HUD解説プレート）

**Files:**
- Modify: `src/components/GameSection.tsx`
- Modify: `src/pages/PuzzlePage.styles.ts`（`GameSection` styled のマット化）

**Interfaces:**
- Consumes: `ArtFrame`（Task 2）、`galleryTokens`（Task 1）

- [ ] **Step 1: 着手前ベースライン確認**

Run: `npm test -- GameSection PuzzleSections`
Expected: PASS

- [ ] **Step 2: HUD 解説プレートのテストを追加（新規の testable seam）**

`src/components/GameSection.tsx` に対応するテスト（`src/components/PuzzleSections.test.tsx` 近傍に既存の GameSection テストがあればそこへ、なければ `src/components/GameSection.test.tsx` を新規作成）に、HUD が「時間」「手数」ラベルを解説プレートとして表示することを確認するテストを追加:

```tsx
// 既存の render ヘルパに合わせて GameSectionComponent を描画したうえで
expect(screen.getByText('時間')).toBeInTheDocument();
expect(screen.getByText('手数')).toBeInTheDocument();
```

（既存 GameSection が既に経過時間・手数を表示している場合は、ラベル文言が「時間」「手数」であることの確認に読み替える。未表示なら本タスクで追加する）

- [ ] **Step 3: テスト失敗を確認**

Run: `npm test -- GameSection`
Expected: FAIL（ラベル未表示の場合）／既存表示済みなら文言差分で FAIL

- [ ] **Step 4: 盤面を ArtFrame で額装し、HUD を解説プレート化**

`src/components/GameSection.tsx` で、`PuzzleBoard` を `ArtFrame` でラップし、経過時間・手数の表示を解説プレート（小型オールキャップスのラベル＋数値）としてまとめる。styled は同ファイル内または `PuzzlePage.styles.ts` に追加:

```tsx
// import 追加
import { ArtFrame } from './molecules/ArtFrame';
```

盤面描画箇所を `<ArtFrame><PuzzleBoard ... /></ArtFrame>` に変更し、HUD 部を以下トーンの styled でラップ（`galleryTokens.sub` のラベル＋`galleryTokens.ink` の数値）。ラベル文言は「時間」「手数」に統一。

- [ ] **Step 5: `GameSection` styled をマット化**

`src/pages/PuzzlePage.styles.ts` の `GameSection`（54-64行）の `background: var(--glass-bg)` はそのまま（Task 1 で `--glass-bg` は mat 色に上書き済み）だが、`backdrop-filter: blur(10px)` を削除し `border: 1px solid ${galleryTokens.frameBorder};` を追加。

- [ ] **Step 6: テストがパス**

Run: `npm test -- GameSection PuzzleSections`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/components/GameSection.tsx src/pages/PuzzlePage.styles.ts src/components/GameSection.test.tsx
git commit -m "feat: プレイ中の盤面を額装しHUDを解説プレート化"
```

---

### Task 6: リザルト画面（収蔵セレモニー）

コピー「パズル完成！」→「作品を収蔵しました」。ランクを「鑑定評価」ラベル付きで見せ、完成画像を ArtFrame で額装する。

**Files:**
- Modify: `src/components/molecules/ResultScreen.tsx`
- Modify: `src/components/molecules/ResultScreen.styles.ts`
- Modify: `src/components/molecules/ResultScreen.test.tsx:29`

**Interfaces:**
- Consumes: `ArtFrame`（Task 2）、`galleryTokens`（Task 1）
- 既存 props（`ResultScreenProps`）は不変

- [ ] **Step 1: 失敗するテストへ更新**

`src/components/molecules/ResultScreen.test.tsx` の29行付近を更新し、収蔵コピーと鑑定評価ラベルを検証:

```tsx
    expect(screen.getByText('作品を収蔵しました')).toBeInTheDocument();
    expect(screen.getByText('鑑定評価')).toBeInTheDocument();
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- ResultScreen`
Expected: FAIL（「作品を収蔵しました」「鑑定評価」が未表示）

- [ ] **Step 3: ResultScreen を実装**

`src/components/molecules/ResultScreen.tsx` の見出しと評価表示を更新:

```tsx
// import 追加
import { ArtFrame } from './ArtFrame';
```

- `<ResultTitle>パズル完成！</ResultTitle>` → `<ResultTitle>作品を収蔵しました</ResultTitle>`
- ランク（`score.rank`）の表示行の直前に、ラベル「鑑定評価」を小型オールキャップスで表示する要素を追加（例: `<RankLabel>鑑定評価</RankLabel>`）。`RankLabel` は `ResultScreen.styles.ts` に追加:

```ts
// src/components/molecules/ResultScreen.styles.ts へ追加
import { galleryTokens } from '../../pages/gallery-theme';

export const RankLabel = styled.p`
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${galleryTokens.sub};
  margin: 12px 0 2px;
`;
```

- 完成画像を表示している箇所があれば `<ArtFrame>` でラップ（画像が無い構成なら本手順はスキップ可）。`ResultTitle` の色を `galleryTokens.gold` の上品なトーンへ調整。

- [ ] **Step 4: テストがパス**

Run: `npm test -- ResultScreen`
Expected: PASS

- [ ] **Step 5: E2E のリザルト依存を確認**

Run: `grep -rn "パズル完成" e2e/picture-puzzle`
Expected: 一致あれば当該行を「作品を収蔵しました」へ更新してから再コミット。一致なしなら追加変更不要

- [ ] **Step 6: コミット**

```bash
git add src/components/molecules/ResultScreen.tsx src/components/molecules/ResultScreen.styles.ts src/components/molecules/ResultScreen.test.tsx
git commit -m "feat: リザルトを収蔵セレモニーへ刷新（鑑定評価表示）"
```

---

### Task 7: 仕上げ・整合・回帰チェック

**Files:**
- Modify: `src/pages/PuzzlePage.styles.ts`（`Instructions`/`InstructionsTitle`/`InstructionsList` のトーン）

- [ ] **Step 1: 遊び方セクションのトーン調整**

`src/pages/PuzzlePage.styles.ts` の `Instructions`（66-74行）の `background: rgba(0,0,0,0.2)` を美術館トーンへ:

```ts
export const Instructions = styled.div`
  margin: 40px 0;
  padding: 24px;
  background: ${galleryTokens.mat};
  border-left: 4px solid ${galleryTokens.gold};
  border-radius: 4px;
  width: 100%;
  max-width: 700px;
`;
```

- [ ] **Step 2: 全単体テスト＋型＋lint＋build**

Run: `npm run ci`
Expected: PASS（lint:ci → typecheck → test:coverage → build すべて成功）

- [ ] **Step 3: 共有物への波及がないことを確認**

Run: `git diff --name-only main...HEAD`
Expected: 変更ファイルに `src/styles/`、`src/App.tsx`、`src/pages/GameListPage.tsx`、`src/features/` が**含まれないこと**

- [ ] **Step 4: 他ゲームの視覚回帰を目視確認**

Run: `npm start` → ゲーム一覧から picture-puzzle 以外（例: primal-path）を開き、背景グラデ・配色・タイポが従来どおりであることを確認。picture-puzzle だけがギャラリー色になっていること

- [ ] **Step 5: コミット**

```bash
git add src/pages/PuzzlePage.styles.ts
git commit -m "chore: 遊び方セクションのトーンを整えフェーズ1を仕上げ"
```

---

## Self-Review（計画作成者チェック済み）

- **Spec coverage**: 設計書フェーズ1の4画面（タイトル=Task3／セットアップ=Task4／プレイ=Task5／リザルト=Task6）＋器（Task1 局所テーマ・Task2 額装・Task7 仕上げ）を網羅。収蔵率の実データ・収蔵目録導線はフェーズ2へ明示的に繰り延べ（設計書 §5 フェーズ2 と整合）
- **安全境界**: Task7 Step3 で共有物不可侵を機械チェック。局所注入は Task1 で `PuzzlePageContainer` に限定
- **型/命名整合**: `galleryTokens` / `galleryThemeVars` / `ArtFrame` を全タスクで一貫使用。`ArtFrame` の `data-testid="art-frame"` は Task2 で定義し Task5/6 で消費
- **コピー変更の波及**: 「はじめる」→「入館する」は単体（TitleScreen/PuzzlePage）＋E2E ヘルパを Task3 で一括更新。「パズル完成！」→「作品を収蔵しました」は Task6 で単体更新＋E2E grep 確認
- **E2E 制約**: ローカル実行不可のため CI 検証。コミットには E2E 修正を含める

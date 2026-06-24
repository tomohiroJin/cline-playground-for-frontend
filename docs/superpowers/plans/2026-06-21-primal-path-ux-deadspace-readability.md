# PRIMAL PATH UX調整 (c) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** デッドスペースを装飾背景で額縁化し、極小・低コントラストのテキストを WCAG AA(4.5:1) と可読サイズへ是正し、アーキタイプタグを発見しやすく強調する。

**Architecture:** WCAG コントラスト比の計算ユーティリティと「テキスト色が AA を満たす」ガードレールテストを新設して可読性を自動回帰ガード化する。色は共有定義（design-tokens / SYNERGY_TAG_INFO）で集中是正。フォントは各コンポーネントの 7px を最小 10px へ。アーキタイプタグは curve→色マッピングを追加して色分け＋拡大。背景は GameContainer のみ変更（レイアウト無変更）。

**Tech Stack:** TypeScript / React 19 / styled-components / Jest 30

## Global Constraints

- WCAG AA: テキスト色は背景に対し **コントラスト比 ≥ 4.5:1**。
- 色相は維持し明度のみ調整（色彩心理＝アーキタイプ/文明の色の意味を壊さない）。
- レイアウトはリフローしない（デッドスペースは背景装飾のみ）。60-30-10 配色を維持。
- フォント最小 10px（アーキタイプタグは 12px）。カード内のはみ出しを起こさない。
- `any` 型禁止。コメントは日本語で「なぜ」。
- `dangerouslySetInnerHTML` 禁止。

## 現状の確定値（調査済み）

- `styles.ts:93` `GameContainer` 背景 `background: #0a0a12;`（ハードコード。`--c-bg-deep` も注入済み）。
- 7px 箇所: `AffinityBadge.tsx:18,19`、`SynergyBadges.tsx:22`、`EvolutionScreen.tsx:66,103-107,118,119,120,131,155,168`、`PlayerPanel.tsx:54,59,60`。
- 色定義: `constants/evolution.ts:92-101` `SYNERGY_TAG_INFO`（低コントラスト: fire `#f08050`、tribe `#e0c060`、wild `#c0a040`）。`design-tokens.ts`: `textDim #988070`(46)、`bgDeep #0a0a12`(48)、`civTech #f08050`(53)、`civBal #e0c060`(56)。`#c0a040` は design-tokens に無く `SYNERGY_TAG_INFO.wild` 等にハードコード。
- アーキタイプタグ: `TotemSelectScreen.tsx:12-16` `CURVE_LABEL`、描画 `:55` `<span style={{ fontSize: 11, color: '#988070' }}>{CURVE_LABEL[t.curve]}</span>`（全アーキタイプ同色）。
- コントラスト計算ユーティリティ: **存在しない**（新規作成）。
- 影響テスト: `design-tokens.test.ts:41,43,47,50` が `textDim/bgDeep/civTech/civBal` の色値を直接アサート（色変更で要更新）。コンポーネントテストは font/色を未アサート（壊れない）。`styles-layout.test.tsx` は 720/960 のレイアウト値のみ（背景変更で壊れない）。

---

### Task 1: コントラスト計算ユーティリティ＋AA ガードレールテスト（先に書く失敗テスト）

**Files:**
- Create: `src/features/primal-path/__tests__/helpers/contrast.ts`
- Create: `src/features/primal-path/__tests__/a11y-contrast.test.ts`

**Interfaces:**
- Produces:
  - `relativeLuminance(hex: string): number`
  - `contrastRatio(fg: string, bg: string): number`（1〜21）
- Consumes（テスト側）: `SYNERGY_TAG_INFO`（`../constants`）、`DESIGN_TOKENS`（`../design-tokens` の実パスは Task 実行時に確認）

- [ ] **Step 1: コントラストユーティリティを作成する**

`src/features/primal-path/__tests__/helpers/contrast.ts`:

```typescript
/**
 * WCAG 2.x コントラスト比の計算ユーティリティ（テスト用）。
 *
 * テキスト色がアクセシビリティ基準(AA=4.5:1)を満たすことを自動検証するために使う。
 */

/** #rrggbb を [r,g,b]（0-255）に変換する */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** sRGB チャンネル(0-1)を相対輝度の線形値へ変換する（WCAG 定義） */
function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** 相対輝度（WCAG, 0=黒〜1=白） */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** 2 色のコントラスト比（1〜21） */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 2: AA ガードレールテストを作成する**

`src/features/primal-path/__tests__/a11y-contrast.test.ts`:

```typescript
/**
 * 可読性ガードレール: UI テキスト色が WCAG AA(4.5:1) を満たすことを検証する。
 *
 * 面白さ検証 UX レビューで指摘された「極小テキスト＋低コントラスト」の回帰防止。
 * 最悪ケース背景＝ゲームシェル背景 #12121e に対して評価する（#0a0a12 はより暗く高コントラスト）。
 */
import { contrastRatio } from './helpers/contrast';
import { SYNERGY_TAG_INFO } from '../constants';

/** 最悪ケースのテキスト背景（ゲームシェル） */
const SHELL_BG = '#12121e';
const AA = 4.5;

describe('可読性ガードレール — テキスト色の WCAG AA', () => {
  describe('シナジータグ色', () => {
    for (const [tag, info] of Object.entries(SYNERGY_TAG_INFO)) {
      it(`${tag}(${info.cl}) が ${AA}:1 以上`, () => {
        expect(contrastRatio(info.cl, SHELL_BG)).toBeGreaterThanOrEqual(AA);
      });
    }
  });

  describe('主要テキスト色', () => {
    // 低コントラストとして報告された色（是正後は AA を満たすこと）
    const TEXT_COLORS: Readonly<Record<string, string>> = {
      textDim: '#988070',   // ← Task2 で AA 準拠値へ更新
      civTech: '#f08050',   // ← Task2 で更新
      civBal: '#e0c060',    // ← Task2 で更新
    };
    for (const [name, hex] of Object.entries(TEXT_COLORS)) {
      it(`${name}(${hex}) が ${AA}:1 以上`, () => {
        expect(contrastRatio(hex, SHELL_BG)).toBeGreaterThanOrEqual(AA);
      });
    }
  });
});
```

> 注: `TEXT_COLORS` はリテラルで現行値を書いているため、Task2 で実際の色を AA 準拠へ変えた後に
> ここの値も新色へ更新する（テストが「採用色」を検証する形にする）。Step3 ではまず現行値で FAIL を確認する。

- [ ] **Step 3: テストを実行して FAIL を確認する**

Run: `npx jest src/features/primal-path/__tests__/a11y-contrast.test.ts --no-coverage`
Expected: FAIL。fire `#f08050`(≈3.8)、tribe `#e0c060`、wild `#c0a040`、textDim `#988070`(≈3.1) などが 4.5 未満で失敗する。失敗した色と実測比を記録する。

- [ ] **Step 4: コミット**

```bash
git add src/features/primal-path/__tests__/helpers/contrast.ts \
        src/features/primal-path/__tests__/a11y-contrast.test.ts
git commit -m "test: PRIMAL PATH 可読性コントラストガードレールを追加（AA未達）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 低コントラスト色を WCAG AA へ是正

**Files:**
- Modify: `src/features/primal-path/design-tokens.ts`（`textDim`/`civTech`/`civBal`。実パスは Step で確認）
- Modify: `src/features/primal-path/constants/evolution.ts`（`SYNERGY_TAG_INFO` の fire/tribe/wild）
- Modify: `src/features/primal-path/__tests__/a11y-contrast.test.ts`（`TEXT_COLORS` を採用色へ更新）
- Modify: `src/features/primal-path/__tests__/design-tokens.test.ts`（色値アサートを採用色へ更新）

**Interfaces:**
- Consumes: Task 1 の `contrastRatio`（採用色決定に使用）

- [ ] **Step 1: AA 準拠の色を決定する**

色相維持・明度のみ上げる。下記を初期候補とし、`contrastRatio(hex, '#12121e') >= 4.5` を満たす最小の明度へ調整する
（`contrast.ts` を一時 import した使い捨てスクリプト、または Node REPL で即時計算。コントラストは即時計算なので反復は瞬時）。

| 用途 | 現行 | 初期候補（AA 準拠） |
|------|------|------|
| textDim（暗い文字） | `#988070`(3.1) | `#b6a288` 付近 |
| civTech / fire（橙） | `#f08050`(3.8) | `#ff9d6e` 付近 |
| civBal / tribe（黄） | `#e0c060`(3.8) | `#ecce78` 付近 |
| wild（暗黄） | `#c0a040`(2.9) | `#d8bd66` 付近 |

各候補で `contrastRatio(候補, '#12121e')` を計算し、**4.5 以上になる最小の明るさ**を採用値とする（採用値を記録）。

- [ ] **Step 2: design-tokens の色を採用値へ更新する**

`design-tokens.ts` の `textDim`/`civTech`/`civBal` を Step1 の採用値へ置換する（CSS 変数経由で全画面に波及）。

- [ ] **Step 3: SYNERGY_TAG_INFO の低コントラスト色を採用値へ更新する**

`constants/evolution.ts:92-101` の `fire`(`#f08050`)・`tribe`(`#e0c060`)・`wild`(`#c0a040`) を Step1 の採用値へ置換する。
（fire/tribe は design-tokens と同色なら同じ採用値を使い整合を取る。wild は専用採用値）

- [ ] **Step 4: ガードレールテストの採用色を更新する**

`a11y-contrast.test.ts` の `TEXT_COLORS` を Step1 の採用値へ更新する。

- [ ] **Step 5: design-tokens テストの色アサートを更新する**

`__tests__/design-tokens.test.ts:41,47,50` の `textDim`/`civTech`/`civBal` 期待値を採用値へ更新する
（`bgDeep #0a0a12` は不変なので 48行は据え置き）。

- [ ] **Step 6: ガードレール緑と design-tokens テスト緑を確認する**

Run: `npx jest src/features/primal-path/__tests__/a11y-contrast.test.ts src/features/primal-path/__tests__/design-tokens.test.ts --no-coverage`
Expected: 両方 PASS（全テキスト色が ≥4.5:1）。

- [ ] **Step 7: コミット**

```bash
git add src/features/primal-path/design-tokens.ts \
        src/features/primal-path/constants/evolution.ts \
        src/features/primal-path/__tests__/a11y-contrast.test.ts \
        src/features/primal-path/__tests__/design-tokens.test.ts
git commit -m "fix: PRIMAL PATH 低コントラスト色を WCAG AA へ是正

- textDim/civTech/civBal/SYNERGY_TAG_INFO(fire/tribe/wild) を色相維持で明度UP
- コントラストガードレール緑（全テキスト色 ≥4.5:1）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 極小フォント(7px)を可読サイズ(10px)へ

**Files:**
- Modify: `src/features/primal-path/components/shared/AffinityBadge.tsx:18,19`
- Modify: `src/features/primal-path/components/shared/SynergyBadges.tsx:22`
- Modify: `src/features/primal-path/components/EvolutionScreen.tsx:66,103-107,118,119,120,131,155,168`
- Modify: `src/features/primal-path/components/battle/PlayerPanel.tsx:54,59,60`

**Interfaces:**
- Consumes: なし（インラインスタイルの数値変更）
- Produces: なし

- [ ] **Step 1: 各 `fontSize: 7` を `fontSize: 10` へ置換する**

上記4ファイルのインラインスタイル `fontSize: 7` をすべて `fontSize: 10` に変更する。
AffinityBadge.tsx:19 の相性─表示色 `#988070` は Task2 で design-tokens 側を変えてもこの行はハードコードのため、
ここも Task2 の textDim 採用値へ揃える（AA 維持）。

- [ ] **Step 2: カード内のはみ出しがないことを目視・スナップショットで確認する**

Run: `npx jest src/features/primal-path/__tests__/EvolutionScreen.test.tsx src/features/primal-path/__tests__/components/battle/PlayerPanel.test.tsx src/features/primal-path/__tests__/components/shared/SynergyBadges.test.tsx --no-coverage`
Expected: PASS（既存テストは font 値を未アサートのため緑のまま。レンダリング破綻がないこと）。

- [ ] **Step 3: コミット**

```bash
git add src/features/primal-path/components/shared/AffinityBadge.tsx \
        src/features/primal-path/components/shared/SynergyBadges.tsx \
        src/features/primal-path/components/EvolutionScreen.tsx \
        src/features/primal-path/components/battle/PlayerPanel.tsx
git commit -m "fix: PRIMAL PATH 極小テキスト(7px)を可読サイズ(10px)へ

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: アーキタイプタグの強調（色分け＋拡大＋チップ化）

**Files:**
- Modify: `src/features/primal-path/components/TotemSelectScreen.tsx:12-16,55`

**Interfaces:**
- Consumes: `PowerCurve` 型（既存）、Task1 の AA 採用色思想
- Produces: `CURVE_COLOR: Readonly<Record<PowerCurve, string>>`（curve→AA 準拠色）

- [ ] **Step 1: curve→色マッピングを追加する**

`TotemSelectScreen.tsx` の `CURVE_LABEL` 付近に、色彩心理に沿った AA 準拠の色マップを追加する。
各色は `contrastRatio(色, '#12121e') >= 4.5` を満たすこと（即効=赤/晩成=緑/コンボ=青）。
初期候補（Task1 のユーティリティで AA を確認して採用値を決定）:

```typescript
// アーキタイプの色彩心理（即効=赤 / 晩成=緑 / コンボ=青）。AA(4.5:1) を満たす明度を採用する。
const CURVE_COLOR: Readonly<Record<PowerCurve, string>> = {
  front: '#ff6b6b',   // 即効=赤（AA 確認のうえ採用）
  scaling: '#50e090', // 晩成=緑
  combo: '#5cc8f0',   // コンボ=青
};
```

> `PowerCurve` のキーが上記3種以外（例: 'wild'）を含む場合は、その値の色（ワイルド=白系 `#e8e0d0` 等）も
> AA を確認して追加し、全キーを網羅すること（型エラー回避）。

- [ ] **Step 2: アーキタイプタグの描画を強調する**

`TotemSelectScreen.tsx:55` の span を、`CURVE_COLOR` で色分け・12px・チップ状（背景＋枠）に変更する:

```tsx
<span style={{
  fontSize: 12,
  fontWeight: 'bold',
  color: CURVE_COLOR[t.curve],
  background: CURVE_COLOR[t.curve] + '1f',
  border: `1px solid ${CURVE_COLOR[t.curve]}55`,
  borderRadius: 4,
  padding: '1px 6px',
}}>{CURVE_LABEL[t.curve]}</span>
```

- [ ] **Step 3: テストと型チェック**

Run: `npx jest src/features/primal-path/__tests__ -t "TotemSelect" --no-coverage && npm run typecheck`
Expected: PASS、型エラー0（`CURVE_COLOR` が `PowerCurve` の全キーを網羅）。TotemSelect のテストが無い場合は typecheck のみで可。

- [ ] **Step 4: コミット**

```bash
git add src/features/primal-path/components/TotemSelectScreen.tsx
git commit -m "feat: PRIMAL PATH アーキタイプタグを色分け・拡大・チップ化で強調

- curve→色(即効=赤/晩成=緑/コンボ=青、AA準拠)で色彩心理を実装
- 11px単色→12pxチップでビルド軸を発見しやすく

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: デッドスペース解消（GameContainer の装飾背景）

**Files:**
- Modify: `src/features/primal-path/styles.ts:93`（`GameContainer` の背景）

**Interfaces:**
- Consumes: なし
- Produces: なし

- [ ] **Step 1: GameContainer の背景を装飾化する**

`styles.ts:93` の `background: #0a0a12;` を、放射状グラデ＋ヴィネットの多層背景へ置換する。
彩度・明度は強く抑制し、中央シェルと競合させない（60-30-10 維持）:

```css
background:
  radial-gradient(ellipse at center, #14121c 0%, #0a0a12 55%, #060608 100%),
  repeating-linear-gradient(115deg, #ffffff03 0 2px, transparent 2px 7px);
background-color: #0a0a12;
```

（1層目=中央やや明るく外周を落とすヴィネット、2層目=極薄の原始モチーフ風ストライプ。色は暗く抑制）

- [ ] **Step 2: レイアウトテストが壊れないことを確認する**

Run: `npx jest src/features/primal-path/__tests__/styles-layout.test.tsx --no-coverage`
Expected: PASS（720/960 のレイアウト値は不変。背景プロパティはアサート対象外）。

- [ ] **Step 3: コミット**

```bash
git add src/features/primal-path/styles.ts
git commit -m "feat: PRIMAL PATH デッドスペースを装飾背景で額縁化

- GameContainer をヴィネット＋極薄モチーフの多層背景に（レイアウト無変更）
- 広い画面の黒余白を意図した額縁に見せ品質感を改善

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: 最終検証

**Files:**
- Verify: primal-path 全スイート・typecheck・lint

- [ ] **Step 1: primal-path 全テスト・型・lint**

Run: `npx jest src/features/primal-path --no-coverage && npm run typecheck && npm run lint`
Expected: 全 PASS、EXIT=0、警告0。a11y-contrast ガードレールが緑であること。

- [ ] **Step 2: 視覚確認（可能なら）**

開発サーバ（`npm start`）＋ Playwright で TotemSelect・Evolution・Battle 画面のスクリーンショットを取得し、
デッドスペースの額縁化・タグ強調・可読性を目視確認する。E2E がローカルで動かない場合はスキップし、その旨を記録する。

---

## Self-Review

- **Spec coverage:** spec §3① デッドスペース → Task5。②可読性（フォント）→ Task3、（色 AA）→ Task1+2、（ガードレール）→ Task1。③タグ強調 → Task4。spec §4 検証 → Task6＋各 Task の局所テスト。全カバー。
- **Placeholder scan:** 色の「初期候補→採用値」は経験的でなく即時計算（contrast util で確定）。TBD/TODO なし。
- **Type consistency:** `relativeLuminance`/`contrastRatio` のシグネチャ、`CURVE_COLOR: Record<PowerCurve, string>`、`SYNERGY_TAG_INFO` の `.cl` 参照を実コードと一致確認済み。

## 実行上の注意

- 色の採用値は `contrast.ts` で即時計算できるため、バランス調整のような長い反復は不要（瞬時に確定）。
- `PowerCurve` の全キー網羅に注意（型エラー回避）。実装時に型定義を確認すること。

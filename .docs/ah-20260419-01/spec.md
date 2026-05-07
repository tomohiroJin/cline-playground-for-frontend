# Air Hockey S9 — 技術仕様書（v4）

> 作成日: 2026-04-19（v4: 全レビュー反映）
> ブランチ: `feature/air-hockey-brushup-20260419`
> 関連: [plan.md](./plan.md) / [review-log.md](./review-log.md)

本仕様は `plan.md` 各フェーズの具体インターフェース・ファイル配置・アルゴリズムを定義する。

---

## 重要: ファイルパス表記ルール

**`useGameLoop` の正しい編集対象**（Codex P0）:

| ファイル | 役割 | 編集可否 |
|---|---|---|
| `src/features/air-hockey/presentation/hooks/useGameLoop.ts` | **実体（1032 行）** | ✅ こちらを編集 |
| `src/features/air-hockey/hooks/useGameLoop.ts` | 後方互換アダプタ（85 行） | ⛔ 原則ノータッチ |

以下の仕様で `useGameLoop.ts` とのみ記述しても、**すべて `presentation/hooks/useGameLoop.ts` を指す**。

**Canvas 描画の正しい編集対象**（v3 最終 Codex P0 追加）:

| ファイル | 役割 | 編集可否 |
|---|---|---|
| `src/features/air-hockey/renderer.ts` | **主 Renderer（802 行、実ゲーム描画の中心）**。`"PAUSED"` / `"Tap to Resume"` / Arial 指定が大量に存在 | ✅ **必須編集対象** |
| `src/features/air-hockey/infrastructure/renderer/ui-renderer.ts` | UiRenderer クラス（252 行）。将来的な統合先候補だが現状は renderer.ts からの呼び出しが主 | ✅ 併せて編集 |
| `src/features/air-hockey/infrastructure/renderer/canvas-renderer.ts` | エントリポイント | 場合により編集 |

**i18n 文字列 / フォント統一（V-3 / V-4 / D-3）の適用スコープ**:
- `renderer.ts` にもハードコード文字列・Arial 指定が残っているため、`ui-renderer.ts` だけでなく `renderer.ts` も編集対象に含める
- 対象文字列の例: `"PAUSED"`（renderer.ts L633）、`"Tap to Resume"`（L548）、`'How to Play'`（ヘルプ画面）
- 対象 `ctx.font` 指定の例: renderer.ts L413/422/452/469/475/488/491/496/516/520/529/533/547/559/600/606/629 など計 20 箇所以上

**E2E テストのパス**（v3 最終 Codex P0 追加）:
- Playwright の設定は `playwright.config.ts` の `testDir: './e2e'`
- 本仕様で `e2e/...` と記述した場合、すべてリポジトリルート直下の `e2e/` ディレクトリを指す
- `tests/e2e/` は存在しないため **絶対に使わない**

---

## S9-D: デザイン基盤（縮小版）

### D-0. 既存トークン優先原則（v3 追記・デザインレビュー MF-1 / RC-3 反映）

**air-hockey feature 内で新しい色・サイズを定義する前に、以下の順で既存資産を探索する**:

1. `src/styles/tokens/colors.ts` — `--color-text-primary/secondary/muted`, `--color-bg-*` 等
2. `src/styles/tokens/game-ui.ts` — `--game-danger/info/heal/achievement/energy/mystery`（HSB × 4 状態）
3. `src/styles/tokens/typography.ts` — `--font-size-xs ... --font-size-3xl`（clamp 済）
4. `src/styles/tokens/spacing.ts` — `--space-1 ... --space-16`（8px ベース）

上記で賄えない **ゲーム固有の意味論のみ** を `AH_TOKENS` に追加する。重複定義は PR でブロック。

**チーム色の扱い**（MF-1 対応）:
- `TEAM1_COLOR = '#3498db'` / `TEAM2_COLOR = '#e74c3c'` は **`tokens/game-ui.ts` にチーム色を追加**してから参照
- 追加する CSS 変数: `--game-team-a: #3498db` / `--game-team-b: #e74c3c`（ダーク/ライト共通、対戦の視認性優先）
- TS 側: `gameUi.teamA / teamB` を `tokens/game-ui.ts` の `gameUi` オブジェクトに追加

### D-1. `core/design-tokens.ts`（新規、縮小版）

```typescript
// air-hockey 固有の意味論のみ集約。色・サイズ・タイポは既存グローバルトークン参照を優先
import { colors, typography, spacing, gameUi } from '../../../styles/tokens';

export const AH_TOKENS = {
  // ゲーム固有の役割色（既存 game-ui.ts の teamA/teamB を再エクスポート）
  team: {
    a: gameUi.teamA,  // = 'var(--game-team-a)' → #3498db
    b: gameUi.teamB,  // = 'var(--game-team-b)' → #e74c3c
  },
  label: {
    // MF-4: 固定値でなく既存トークン参照
    cpu: colors.textMuted,      // = 'var(--color-text-muted)'（ダーク: rgba(255,255,255,0.5)）
    // human はチームカラーを直接使用
  },
  // RC-3: 既存 typography.ts の fluid スケールを優先使用。独自 clamp は代替不能な場合のみ
  vs: {
    textSize:          typography.fontSize3xl,  // 従来 '72px' 相当
    characterNameSize: typography.fontSizeLg,   // 従来 '24px' 相当
    infoSize:          typography.fontSizeBase, // 従来 '16px' 相当
    labelSize:         typography.fontSizeXs,   // 従来 '12px' 相当
    mobileBreakpoint:  '600px',                 // ブレイクポイントは独自
  },
  // アニメーション原則（enter/exit/emphasis の 3 種のみ、既存 tokens には該当なし）
  anim: {
    enter:    { duration: 200, easing: 'ease-out' },
    exit:     { duration: 150, easing: 'ease-in' },
    emphasis: { duration: 300, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  },
} as const;

export type AhAnimType = keyof typeof AH_TOKENS.anim;

export const animCss = (type: AhAnimType, property = 'all'): string => {
  const { duration, easing } = AH_TOKENS.anim[type];
  return `${property} ${duration}ms ${easing}`;
};
```

**独自 clamp を使う場合のガード**（RC-3 対応）:
- 独自 `clamp(min, val, max)` を書く前に、typography.ts の既存 8 段階で代替不能なことを PR 本文で説明する
- 代替可能なのに独自定義した場合はレビューで差し戻し

### D-2. `hooks/useReducedMotion.ts`（新規）

```typescript
import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}
```

### D-3. コントラスト修正対象（AA 計測セレクタ一覧、v3 でレビュー反映拡張）

| 対象 | 現在 | 修正後 | 背景想定 | 比率（目標） |
|---|---|---|---|---|
| `VsScreen.tsx` `LABEL_COLOR_CPU` | `#888` | `colors.textMuted`（≒ `rgba(255,255,255,0.5)` in dark） | gradient 合成 (#1e2930 程度) | ≥ 4.5:1 |
| `VsScreen.tsx` キャラ名（chara.color） | 既存 | 維持（text-shadow 補強） | gradient | ≥ 4.5:1（要計測） |
| `TitleScreen.tsx` アンロック注釈 | `#888` | `colors.textMuted` | glass-card 背景 | ≥ 4.5:1 |
| `ui-renderer.ts:153,155` ヘルプ文 `#888` | `#888` | `#b4b4b4`（Canvas は CSS 変数非対応のため固定値） | `rgba(0,0,0,0.92)` | 9.8:1 |
| `ui-renderer.ts` `drawPauseOverlay` `#888888` | `#888888` | `#b4b4b4` | `rgba(0,0,0,0.7)` | 8.2:1 |
| **`Scoreboard.tsx:22,27` `ScoreText`**（MF-2 新規） | キャラカラー全 11 色 | キャラカラー × `text-shadow`（glow）補強 | ゲーム背景 `#0d1117` | **全 11 組で ≥ 4.5:1 計測必須** |
| **`ResultScreen.tsx:87` `StatRow` ラベル**（MF-3 新規） | `#888` | `colors.textMuted` | `MenuCard` glass 背景 | ≥ 4.5:1 |
| **`ResultScreen.tsx:324,363` MVP/実績サブ名**（MF-3 新規） | `#ffd700` | 維持（`gameUi.achievement` に統一） | 金グラデ背景 | ≥ 4.5:1 |
| **`ResultScreen.tsx:333,337,347,364` 統計サブ `#aaa`/`#666`**（MF-3 新規） | `#aaa`, `#666` | `colors.textSecondary` | `rgba(0,0,0,0.3)` | ≥ 4.5:1 |

**Scoreboard キャラカラー × 背景 `#0d1117` の計測方針**（MF-2 詳細）:

1. 既存 11 キャラ色を全列挙し、WebAIM Contrast Checker 相当の関数で一括計測
2. 4.5:1 未満の色は次のいずれかで対応:
   - `text-shadow: 0 0 10px ${color}` のグロー強度を倍増し、実効コントラストを稼ぐ
   - 文字色は維持しつつ、1px の暗色ストローク（`-webkit-text-stroke`）で輪郭強調
   - どうしても満たせない場合のみ、キャラ固有色とは別に「スコア表示用の派生色」（明度 +20%）を character データに追加
3. 計測結果と対応方針を `.docs/ah-20260419-01/contrast-audit.md` に記録

### D-4. ドキュメント: `doc/design-system.md`

- カラー / タイポ / スペーシング / アニメーション一覧
- 原則チェックリスト（`.claude/rules/design-ui-ux-principles.md` の air-hockey 適用版）
- 新規コンポーネント追加時の手順（トークン参照 → ダーク確認 → reduced-motion）
- **M1 の最終タスク**: 本ドキュメントから「プロジェクト共通トークンへの還元候補」をリストアップ

---

## S9-V: 横断的品質基盤（新設）

### V-1. VRT 基盤（v3 で reduced-motion 強制を追加、RC-7 反映）

**ファイル**: `e2e/air-hockey-visual.spec.ts`（新規）

```typescript
import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iphone-se', viewport: { width: 375, height: 667 } },
  { name: 'iphone-14', viewport: { width: 393, height: 852 } },
  { name: 'tablet',    viewport: { width: 768, height: 1024 } },
  { name: 'desktop',   viewport: { width: 1280, height: 720 } },
] as const;

// アニメーション・遷移を強制停止する CSS（撮影時のみ注入）
const FREEZE_ANIMATIONS_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`;

// v3 最終 Codex P1-3: goto() を先に行わないと addStyleTag / document.fonts.ready が
// about:blank に対して実行されて効かない。各 test で goto() → 安定化処理 → スクショの順。
async function stabilize(page: import('@playwright/test').Page): Promise<void> {
  await page.addStyleTag({ content: FREEZE_ANIMATIONS_CSS });
  await page.evaluate(() => document.fonts.ready);
}

for (const vp of VIEWPORTS) {
  test.describe(`@${vp.name}`, () => {
    test.use({
      viewport: vp.viewport,
      // RC-7: reduced-motion をエミュレートしてアニメ完了状態を安定取得
      reducedMotion: 'reduce',
    });

    test('TitleScreen', async ({ page }) => {
      await page.goto('/air-hockey');
      await stabilize(page);
      await expect(page).toHaveScreenshot(`title-${vp.name}.png`, { maxDiffPixelRatio: 0.001 });
    });

    test('VsScreen 1v1', async ({ page }) => {
      await page.goto('/air-hockey');
      // キャラ選択 → VS 画面に到達するフロー（テスト用の data-testid 経由で最短到達）
      // ...
      await stabilize(page);
      await expect(page).toHaveScreenshot(`vs-1v1-${vp.name}.png`, { maxDiffPixelRatio: 0.001 });
    });

    test('VsScreen 2v2', async ({ page }) => {
      await page.goto('/air-hockey');
      // ペアマッチフロー
      await stabilize(page);
      await expect(page).toHaveScreenshot(`vs-2v2-${vp.name}.png`, { maxDiffPixelRatio: 0.001 });
    });

    test('ResultScreen', async ({ page }) => {
      await page.goto('/air-hockey');
      // リザルトに到達（テスト用の初期状態注入で最短到達）
      await stabilize(page);
      await expect(page).toHaveScreenshot(`result-${vp.name}.png`, { maxDiffPixelRatio: 0.001 });
    });
  });
}
```

**代替案（推奨の上位）**: `page.addInitScript()` で `<script>` を事前注入し、アプリ起動時にアニメーションを停止する仕組みを作る。これなら `goto` の前にフラグを仕込める。ただし実装コスト高のため、第一選択は上記の各 test で `stabilize()` を呼ぶ方式。

**ベースライン**:
- 初回は `npx playwright test --update-snapshots` で生成
- `e2e/screenshots/` に保存、git 追跡
- フォントレンダリング差を避けるため、CI も含めて全環境で `playwright-chromium` を使用
- **アニメーションの撮影タイミング**（RC-7）: `reducedMotion: 'reduce'` + `animation-duration: 0s` 強制で「完了状態」を即時撮影。flaky 防止

### V-2. Canvas A11y ライブリージョン

**ファイル**: `src/features/air-hockey/components/CanvasLiveRegion.tsx`（新規、feature ローカル配置）

```typescript
import React from 'react';
import styled from 'styled-components';

const VisuallyHidden = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

type Props = {
  message: string;
  politeness?: 'polite' | 'assertive';
};

// v3 最終 Codex P2-5: role="status" は暗黙に aria-live="polite"。
// assertive を流したい場合は role を付けず aria-live のみで制御する方が素直。
export const CanvasLiveRegion: React.FC<Props> = ({ message, politeness = 'polite' }) => (
  <VisuallyHidden aria-live={politeness} aria-atomic="true">
    {message}
  </VisuallyHidden>
);
```

**発火タイミング**:
- スコア変化: `"プレイヤー {p} 対 相手 {c}"` を `polite` で
- ゲームパッドトースト: トーストメッセージを `polite` で
- ゲーム終了: `"ゲーム終了：{winner} の勝利"` を `assertive` で

**配置**:
- `AirHockeyGame.tsx` のゲーム画面（`screen === 'game'`）でマウント
- message の state は `useState` で管理、`useEffect` でスコア差分を検出して更新

### V-3. i18n 語彙分離

**ファイル**: `core/i18n-strings.ts`（新規）

```typescript
// Canvas / UI で使用する日本語表示文字列の一元管理
// 現時点では日本語のみ。将来 Jotai atom + locale 切り替えに対応可能な構造。

export const AH_STRINGS = {
  common: {
    cpu: 'CPU',
    vs: 'VS',
    goal: 'GOAL!',
    fever: 'FEVER!',
    win: '勝利',
    lose: '敗北',
  },
  /** ゲーム内表示用（日本ゲーム慣習の "数字先" 表記）、v4: Gemini M2-M4 レビュー反映 */
  player: {
    p1: '1P',
    p2: '2P',
    p3: '3P',
    p4: '4P',
  },
  playerAria: {
    p1Human:   'プレイヤー1（キーボード/マウス）',
    p2Human:   'プレイヤー2（WASD/ゲームパッド1）',
    p3Human:   'プレイヤー3（ゲームパッド2）',
    p4Human:   'プレイヤー4（ゲームパッド3）',
    cpu:       'CPU 操作',
  },
  game: {
    countdown: (n: number | 'GO') => n === 'GO' ? 'GO!' : String(n),
    combo: (count: number) => `x${count} COMBO!`,
    paused: 'PAUSED',
    tapToResume: 'Tap to Resume',
  },
} as const;
```

**置換対象**（初期移行）:
- `ui-renderer.ts` のハードコード文字列（`"PAUSED"`, `"Tap to Resume"`, `"GO!"`, `"How to Play"` 等）
- `VsScreen.tsx` の `"VS"` 文字、`"CPU"` ラベル
- `Scoreboard.tsx` のプレイヤー名（既存 props 経由は維持、デフォルト値のみ定数化）

**非目標**: 実際の多言語翻訳。定数化と atom 注入準備まで。

### V-4. Canvas フォント統一（v3 新規、RC-4 反映）

**問題**: `ui-renderer.ts` 全体で `'bold 80px Arial'` など Arial ハードコード。DOM 側は `--font-family-body: 'Inter'` を使用しており、**DOM と Canvas で書体が一致しない**。日本語ダイアログが混在する場面で特に見た目の違和感が出る。

**ファイル**: `src/features/air-hockey/core/canvas-fonts.ts`（新規）

```typescript
// Canvas 2D コンテキスト用のフォント指定を一元化
// DOM 側の --font-family-body（Inter + Noto Sans JP フォールバック）と揃える

const FONT_STACK_BODY = `'Inter', 'Noto Sans JP', system-ui, -apple-system, 'Segoe UI', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif`;
const FONT_STACK_HEADING = `'Orbitron', 'Inter', 'Noto Sans JP', system-ui, sans-serif`;

export const CANVAS_FONTS = {
  /** カウントダウン数字（3/2/1） */
  countdownNumber: `bold 80px ${FONT_STACK_HEADING}`,
  /** カウントダウン GO! */
  countdownGo: `bold 90px ${FONT_STACK_HEADING}`,
  /** ポーズ PAUSED */
  pauseTitle: `bold 48px ${FONT_STACK_HEADING}`,
  /** ポーズ本文 */
  pauseBody: `bold 20px ${FONT_STACK_BODY}`,
  pauseHint: `16px ${FONT_STACK_BODY}`,
  /** ヘルプ画面 */
  helpTitle: `bold 18px ${FONT_STACK_BODY}`,
  helpSubtitle: `12px ${FONT_STACK_BODY}`,
  helpSectionTitle: `bold 14px ${FONT_STACK_BODY}`,
  helpItem: `bold 13px ${FONT_STACK_BODY}`,
  helpItemDesc: `11px ${FONT_STACK_BODY}`,
  /** HUD */
  hudStatus: `bold 12px ${FONT_STACK_BODY}`,
  /** コンボ */
  combo: (scale: number) => `bold ${Math.floor(28 * scale)}px ${FONT_STACK_HEADING}`,
  /** ゲームパッドトースト */
  toast: `bold 14px ${FONT_STACK_BODY}`,
} as const;
```

**置換対象**: `infrastructure/renderer/ui-renderer.ts` 全体の `ctx.font = 'bold Npx Arial'` 形式を `ctx.font = CANVAS_FONTS.xxx` へ置換

**注意点**:
- **フォントロードのタイミング**（Gemini v3 最終レビュー追加）: WebFont 未読込の初回描画ではシステムフォントにフォールバック。数フレーム後にフォント切り替えが起きて見た目がぶれる可能性。対応方針:
  1. `useGameLoop` の初期化で `document.fonts.ready` を await（パフォーマンス影響を計測）
  2. 見た目が許容範囲ならフォールバック（`system-ui` / `sans-serif`）で妥協
  3. いずれを採用したかを `doc/design-system.md` に明記
- Canvas の絵文字描画: `Segoe UI Emoji` / `Apple Color Emoji` をスタックに含めて OS 差を吸収

---

## S9-A1: VsScreen 2v2 モバイルレスポンシブ

### A1-1. レイアウト変更

```
【PC（≥600px）】                       【モバイル（<600px）】
[P1 P2] VS [P3 P4]                    [P1 P2]
                                          VS
                                      [P3 P4]
```

### A1-2. 実装

- `VsScreen.tsx` の 2v2 ブランチ（240-243 行）を styled-components + `@media` 書き換え
- インライン `style={{...}}` を排除、`AH_TOKENS` 参照
- 立ち絵: `max-width: min(45vw, 240px); aspect-ratio: 1/2`
- VS テキスト: `font-size: ${AH_TOKENS.vs.textSize}`（clamp）
- `useReducedMotion` フックで reduced-motion 対応を一元化

### A1-3. 新規 styled コンポーネント

```typescript
const VsTeamsLayout = styled.div<{ $is2v2: boolean }>`
  display: flex;
  align-items: center;
  gap: 20px;
  ${p => p.$is2v2 && css`
    @media (max-width: ${AH_TOKENS.vs.mobileBreakpoint}) {
      flex-direction: column;
      gap: 12px;
    }
  `}
`;
```

### A1-4. 検証（Playwright 優先）

| テスト種別 | ケース |
|---|---|
| Jest 単体 | `matchMedia` モックで 2v2 レイアウトのクラス付与 |
| Jest 単体 | 既存の 3 秒シーケンス・1v1 / 2v2 描画 |
| Playwright スクショ | 4 viewport × 2 モード（1v1 / 2v2）計 8 枚 |
| Playwright 機能 | viewport 375px で `page.evaluate(() => document.documentElement.scrollWidth)` が window 幅以下 |

---

## S9-A2: ゲームパッドトースト Canvas 描画（検証）

### A2-1. 現状（確認済み）

- `presentation/hooks/useGameLoop.ts:916` で `Renderer.drawToast(ctx, gamepadToastRef?.current, now)` が呼ばれている
- `infrastructure/renderer/ui-renderer.ts:25` に `drawToastOnCanvas` 実装済み

### A2-2. やること

1. **単体テスト補強**: `canvas-renderer.test.ts` に `drawToastOnCanvas` のアサート
   - トースト `undefined` では描画なし
   - 3000ms 以内は α = 1
   - 2500ms 〜 3000ms で α 減衰
   - 接続/切断で背景色切替
2. **実機確認**: ゲーム中にゲームパッドを接続/切断 → トースト表示・フェードアウト
3. **A11y 連携**: `useGamepadInput` のトースト発火 → `CanvasLiveRegion` に転送（S9-V-2）

### A2-3. CanvasLiveRegion 連携

```typescript
// AirHockeyGame.tsx
const [liveMessage, setLiveMessage] = useState('');
useEffect(() => {
  if (gamepadToast) setLiveMessage(gamepadToast.message);
}, [gamepadToast]);
// JSX:
{screen === 'game' && <CanvasLiveRegion message={liveMessage} />}
```

---

## S9-A3: 操作タイプ表示統一（内部語彙 + aria-label）

### A3-1. 内部語彙と表示の分離（Codex P1）

```typescript
// core/i18n-strings.ts の AH_STRINGS.player と playerAria を使う
const controlLabel = (controlType: 'cpu' | 'human', slot: 'p1'|'p2'|'p3'|'p4'):
  { display: string; ariaLabel: string } => {
  if (controlType === 'cpu') {
    return { display: AH_STRINGS.common.cpu, ariaLabel: AH_STRINGS.playerAria.cpu };
  }
  const map = {
    p1: { display: `🎮 ${AH_STRINGS.player.p1}`, ariaLabel: AH_STRINGS.playerAria.p1Human },
    p2: { display: `🎮 ${AH_STRINGS.player.p2}`, ariaLabel: AH_STRINGS.playerAria.p2Human },
    p3: { display: `🎮 ${AH_STRINGS.player.p3}`, ariaLabel: AH_STRINGS.playerAria.p3Human },
    p4: { display: `🎮 ${AH_STRINGS.player.p4}`, ariaLabel: AH_STRINGS.playerAria.p4Human },
  };
  return map[slot];
};
```

### A3-2. VsScreen / TeamSetupScreen 適用

```tsx
// v3 最終 Codex P2-5: 文字列ラベルに role="img" は過剰。aria-label のみで十分。
<span aria-label={label.ariaLabel}>
  {label.display}
</span>
```

### A3-3. TeamSetupScreen: 人間ボタン disabled（v4: Codex P1-2 反映で現実装に合わせて修正）

実際の TeamSetupScreen の実装に合わせる:

| ボタン | 入力デバイス | disabled 条件 |
|---|---|---|
| P2 人間 | WASD / タッチ（ゲームパッド不要） | なし（常時有効） |
| P3 人間 | ゲームパッド 1 | `gamepadConnected < 1` |
| P4 人間 | ゲームパッド 2 | `gamepadConnected < 2` |

- disabled 時: `opacity: 0.4`, `cursor: not-allowed`, `aria-disabled="true"`, `title="ゲームパッドを接続してください"`
- `AH_STRINGS.playerAria` も上記に準拠

---

## S9-B1: 第 2 章カットイン・ユウ VS 画像（品質確認）

### B1-1. 確認対象

- `public/assets/cutins/victory-ch2.png`
- `public/assets/vs/yuu-vs.png`

### B1-2. 客観的合格基準（Gemini 低）

| 項目 | 基準 |
|---|---|
| 解像度 | cutin: 1920×1080 以上 / VS: 1024×1024 以上 |
| 透過 | cutin: 不要 / VS: 必須 |
| 色味一致 | 既存他キャラ VS 画像との HSL 平均値で明度 ±10%、彩度 ±10% |
| 輪郭黒ずみ | 閾値走査で境界ピクセル中の黒ずみ（R+G+B < 60）が 2% 未満 |
| 文字要素 | 混入なし（テキストは DOM 側） |

### B1-3. リテイク（NG 時のみ）

- Nanobanana2 用プロンプトを `.docs/ah-20260419-01/asset-prompts.md` に記載
- 生成 → imagesorcery で後処理 → 再検査
- 合格後、原本を `.docs/ah-20260419-01/作成画像/` に退避

---

## S9-B2: 透過アーティファクト除去（輪郭近傍限定）

### B2-1. 調査スクリプト: `scripts/air-hockey/audit-portrait-fringe.ts`（新規）

**仕様**（Codex P2 修正版）:

```typescript
// 半透明境界ピクセルのみを対象にフリンジを検出
// 輪郭近傍 = alpha が 0 < a < 255 で、周囲 3x3 に α=0 ピクセルがあるもの
// 白フリンジ = 輪郭近傍で R>=240 && G>=240 && B>=240
// 黒ずみ = 輪郭近傍で R+G+B < 60

type AuditResult = {
  file: string;
  totalEdgePixels: number;
  whiteFringeCount: number;
  darkenedCount: number;
  whiteRatio: number;   // whiteFringeCount / totalEdgePixels
  darkenedRatio: number;
  verdict: 'OK' | 'NG';
};
```

### B2-2. 合格閾値

- 白フリンジ率: < 2%
- 黒ずみ率: < 2%
- 両方達成で OK

### B2-3. OK/NG テンプレ（tasks.md に反映）

| ファイル | 白 % | 黒 % | 判定 | 理由 | 処理 |
|---|---|---|---|---|---|
| akira-normal.png | 0.5 | 0.1 | OK | — | 不要 |
| akira-happy.png | 3.2 | 0.2 | NG | 左肩外側に白フリンジ | imagesorcery change_color |
| ... |

### B2-4. 処理

- NG ファイルに imagesorcery / ImageMagick で処理
- 処理後に audit スクリプト再実行で OK 確認
- 処理前後の diff 画像を `.docs/ah-20260419-01/作成画像/portrait-fix/` に保存

---

## S9-S: シナリオ補強（v3+ で新規追加、/scenario-review 反映）

**編集対象**: `src/features/air-hockey/core/chapter2-dialogue-data.ts` のみ

### S-1. SC-01: アキラの準々決勝補足（1 行追加）

**問題**: Ch2 2-3 preDialogue で ヒロ/ミサキ が「2 回戦敗退」と明言する一方、アキラは 2-2（1 回戦）から 2-3（準決勝）に直接ジャンプ。2 回戦の描写が無い。

**修正**: `STAGE_2_3.preDialogue` の先頭付近（ユウの「白波カナタ選手」解説の前）に 1 行追加:

```typescript
// 追加候補 A（Bye / 不戦勝として処理、最小修正）
{ characterId: 'yuu', text: 'アキラの 2 回戦は相手棄権で不戦勝だったから、ここまで実質 1 試合で来てる', expression: 'normal' },

// 追加候補 B（非プレイアブルな 2 回戦を示唆）
{ characterId: 'hiro', text: 'お前は 2 回戦もケロッと勝ち抜いてきたからな…やっぱすげーよ', expression: 'happy' },
```

**推奨**: 候補 B（プレイヤーのエンパワメント + ヒロのキャラクター性の補強）

### S-2. SC-02 + SC-07: リクの出演最小実装

**問題**: プロット・`story-mode.md`・`characters.ts` ではリクが第 2 章登場キャラだが、実装ダイアログに 0 行。

**選択肢 A（推奨）**: リクを 2-4 preDialogue に 1 行追加

```typescript
// STAGE_2_4.preDialogue の takuma「決勝の相手は氷室レン」直前に挿入
{ characterId: 'riku', text: '蒼風館の 1 年…アキラ、だっけ？ 俺、準々決勝でレンにやられた。あいつのスピード、マジでヤバい。気をつけろよ', expression: 'normal' },
```

**選択肢 B**: リクを 2-1 postWin に 1 行追加（ソウタ経由の情報リレー、SC-07 と統合）

```typescript
// STAGE_2_1.postWinDialogue の rookie「黒鉄高校にレンってやつ」の直後に挿入
{ characterId: 'rookie', text: 'しかも天嶺のリクさんも『レンには速さで勝てない』って言ってたって' },
```

**推奨**: 選択肢 A（リクが自分の言葉で語ることで印象に残る、第 3 章での再登場時の土台にもなる）

### S-3. SC-03: ユウの勝利祝辞挿入

**問題**: Ch2 2-4 postWin にユウのコメントが無い。プロット（chapter2-plot.md L292）には「ユウ『県大会…行けるんだね、僕たち』」が記載されている。

**修正**: `STAGE_2_4.postWinDialogue` の ミサキ「…やるじゃない。見直したわ」と ヒロ「地区大会優勝だーーー！！」の間に挿入:

```typescript
{ characterId: 'yuu', text: '県大会…行けるんだね、僕たち。データじゃ計れない戦いを、アキラが見せてくれた', expression: 'happy' },
```

**副次効果**: 第 3 章「ユウの選手デビュー」伏線（F010）が復活

### S-4. SC-05: 2-3 preDialogue の会話フロー並び替え

**現状（`chapter2-dialogue-data.ts` L85-93）**:

```
1. hiro「2回戦敗退…」
2. misaki「タクマ部長は別ブロックの準決勝に進んでる」
3. kanata「蒼風館の…アキラ、だっけ？」
4. player「うん。…君が準決勝の相手？」
5. kanata「ストレートな子だね。…」（挑発）
6. player「…やってみなきゃ分からないでしょ！」（反論）
7. yuu「白波カナタ選手。…」（情報提供 ← 反論後）
8. misaki「気をつけて」（助言 ← 反論後）
```

**問題**: カナタとプレイヤーの緊張感ある対話の**後**にユウ/ミサキの情報が挿入され、余韻を断つ。

**修正後**:

```
1. hiro「2回戦敗退…」
2. misaki「タクマ部長は別ブロックの準決勝に進んでる」
3. yuu「白波カナタ選手。碧波学院の2年生。データが少ないけど…変則的なプレイスタイルらしい」  ← 先行
4. misaki「気をつけて。読みづらい相手は、焦りが一番の敵よ」  ← 先行
5. kanata「蒼風館の…アキラ、だっけ？」
6. player「うん。…君が準決勝の相手？」
7. kanata「ストレートな子だね。…」
8. player「…やってみなきゃ分からないでしょ！」  ← 余韻を残して試合開始
```

**適用**: SC-01 と同時に `STAGE_2_3.preDialogue` 全体を再構築。

### S-5. SC-08: 2-4 postWin の余韻（低優先）

**修正**: `STAGE_2_4.postWinDialogue` の ヒロ「地区大会優勝だーーー！！」と シオン「ふぅん…」の間に短い場面転換セリフを挿入（任意）。

```typescript
// takuma の一言で余韻を作る
{ characterId: 'takuma', text: '…よくやった。本当に、よくやった', expression: 'happy' },
// その後シオン
```

**注**: 余韻過剰になる場合は省略可。テンポを優先するなら本項目はスキップでも良い。

### S-6. SC-09: `expression: 'normal'` 冗長指定の削除（低優先）

**対象**: `chapter2-dialogue-data.ts` L26, 58, 86, 90, 93, 102, 142 他

**修正**: `expression: 'normal'` を全削除。デフォルト値として扱う（既存型定義でデフォルトが normal になっていることを型定義と `DialogueOverlay` 側で確認）。

**確認事項**:
- `DialogueLine` 型の `expression?: 'normal' | 'happy'` の optional 扱いが `DialogueOverlay.tsx` で正しく normal にフォールバックするか
- 既存テスト `dialogue-data.test.ts` にアサーションがあれば同期修正

### S-7. ドキュメント同期

- `src/features/air-hockey/doc/story-mode.md` の「リク | 2-4（ダイアログ出演）」記述と実装（S-2 で追加）の一致を再確認
- `doc/world/chapter2-plot.md` の「ユウ『県大会…行けるんだね、僕たち』」記述と実装（S-3 で追加）の一致を明示

---

## S9-C1: パフォーマンス計測基盤

### C1-1. `core/perf-probe.ts`（新規）

```typescript
export type PerfSection = 'physics' | 'ai' | 'render' | 'total';
export type PerfSample = Record<PerfSection, number>;  // ms

export type PerfSnapshot = {
  fps: number;
  p50: PerfSample;
  p95: PerfSample;
  p99: PerfSample;
  sampleCount: number;
  tbt: number;              // Total Blocking Time (ms)
  longTaskCount: number;
  heapUsed?: number;        // MB, Chrome only (performance.memory)
  devicePixelRatio: number;
};

export class PerfProbe {
  begin(section: PerfSection): void;
  end(section: PerfSection): void;
  commit(): void;           // current → samples
  snapshot(): PerfSnapshot;
  reset(): void;
  attachLongTaskObserver(): void;  // PerformanceObserver で longtask 監視
}
```

### C1-2. `useGameLoop` への組み込み

**編集対象**: `src/features/air-hockey/presentation/hooks/useGameLoop.ts`（実体）

- URL パラメータ `?perf=1` で有効化
- 物理更新・AI 更新・描画の各セクションで begin/end
- 既存 FPS 表示（999-1011 行）を拡張して `p50/p95/p99 / TBT / heap` も表示

### C1-3. DPR 検証

- `window.devicePixelRatio` を取得、Canvas サイズと実ピクセル比をログ出力
- オーバーレイに `DPR: 2.0` のような表示を追加
- Retina での描画ぼやけ・負荷増の有無を観察

### C1-4. E2E 計測

- `e2e/air-hockey-perf.spec.ts`（新規）
  - 2v2 / 1v1 各モードで 60 秒プレイ
  - `probe.snapshot()` を `window.__ahPerfSnapshot` に expose
  - CI 実行はスキップ（手動実行用：`npm run test:e2e:perf`）

### C1-5. 計測結果テンプレ: `.docs/ah-20260419-01/perf-baseline.md`

```markdown
## 計測日: 2026-04-XX

| 端末 | OS | ブラウザ | モード | フィールド | FPS p50 | FPS p95 | FPS p99 | TBT | heap | DPR | サンプル数 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| iPhone SE 2 | iOS 17 | Safari | 2v2 | Original | 58 | 55 | 48 | 180ms | — | 2.0 | 3600 |
| ... |
```

---

## S9-C2: パフォーマンス最適化

**前提**: S9-C1 の計測結果を根拠に 1〜2 施策に限定

### C2-候補 1: AI 再計算の間引き（計測で優先される場合）

- `character-ai-profiles.ts` の `reactionDelay` を 2v2 時は ×1.5
- 既存 `reactionDelay * 3` 周期の頻度を 2v2 で ×2 に

### C2-候補 2: フィールド背景キャッシュ（**Safari 互換前提**、Codex P1）

**設計方針**: 通常の `HTMLCanvasElement` でキャッシュし、将来 `OffscreenCanvas` 対応可能な抽象を用意。

```typescript
// infrastructure/renderer/field-cache.ts（新規）
export class FieldCache {
  private cache: HTMLCanvasElement | null = null;
  private cachedFieldId: string | null = null;
  private cachedScale: number | null = null;

  getOrCreate(field: FieldConfig, scale: number, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
    if (this.cachedFieldId === field.id && this.cachedScale === scale && this.cache) {
      return this.cache;
    }
    // hidden canvas で再生成
    const canvas = document.createElement('canvas');
    // ... OffscreenCanvas 対応は将来別 PR
    // if ('OffscreenCanvas' in window) { ... }
    const ctx = canvas.getContext('2d');
    if (ctx) draw(ctx);
    this.cache = canvas;
    this.cachedFieldId = field.id;
    this.cachedScale = scale;
    return canvas;
  }

  invalidate() {
    this.cache = null;
    this.cachedFieldId = null;
  }
}
```

- **機能検出フォールバック**: `OffscreenCanvas` は使わない（iPhone SE 2 / iOS 17 の Safari は未対応ケースあり）
- 将来改善は「hidden canvas + OffscreenCanvas 優先」の抽象として残す

### C2-候補 3: パーティクル上限の動的化

- `core/constants.ts` に `PARTICLE_LIMIT_DEFAULT` / `PARTICLE_LIMIT_2V2` を定義
- フィーバー時は 1.5 倍許容（体感維持）

### C2-候補 4: quickReject 拡張

- マレット-マレット衝突判定で AABB 事前除外
- 計測で衝突判定が支配的なら適用

### C2-候補 5: 省電力モード（Gemini 中、将来オプション）

- 設定パネルに「省電力モード」トグル（既定 off）
- ON: 30fps 上限、パーティクル半減、トレイル無効
- **本 PR では実装しないが、省電力フックは残す**

---

## 影響範囲マトリクス

| 変更 | 編集ファイル |
|---|---|
| design-tokens | `core/design-tokens.ts`（新規、既存グローバル参照）、`src/styles/tokens/game-ui.ts`（チーム色追加） |
| useReducedMotion | `hooks/useReducedMotion.ts`（新規）、既存 VsScreen/VictoryCutIn/ChapterTitleCard/ConfirmDialog |
| VRT 基盤 | `e2e/air-hockey-visual.spec.ts`（新規、reduced-motion 強制） |
| CanvasLiveRegion | `components/CanvasLiveRegion.tsx`（新規）、`presentation/AirHockeyGame.tsx` |
| i18n-strings | `core/i18n-strings.ts`（新規）、`ui-renderer.ts`, `VsScreen.tsx`, `Scoreboard.tsx` |
| canvas-fonts | `core/canvas-fonts.ts`（新規）、`infrastructure/renderer/ui-renderer.ts` 全体 |
| Scoreboard コントラスト | `Scoreboard.tsx`, `.docs/ah-20260419-01/contrast-audit.md`（新規） |
| ResultScreen コントラスト | `ResultScreen.tsx`（`#888`/`#aaa`/`#666` → トークン参照） |
| 2v2 mobile | `components/VsScreen.tsx`, `VsScreen.test.tsx` |
| gamepad toast 検証 | `canvas-renderer.test.ts`（既存）、`presentation/AirHockeyGame.tsx` |
| 操作タイプ統一 | `components/VsScreen.tsx`, `components/TeamSetupScreen.tsx` |
| ch2 カットイン / yuu vs | `public/assets/cutins/`, `public/assets/vs/` |
| portrait fringe | `public/assets/portraits/`, `scripts/air-hockey/audit-portrait-fringe.ts`（新規） |
| シナリオ補強（S9-S） | `core/chapter2-dialogue-data.ts`、`doc/story-mode.md`（記述同期）、`core/chapter2-dialogue-data.test.ts`（テスト期待値調整の可能性） |
| PerfProbe | `core/perf-probe.ts`（新規）、`presentation/hooks/useGameLoop.ts`（実体） |
| FieldCache | `infrastructure/renderer/field-cache.ts`（新規）、`renderer.ts` |
| 最適化（AI 間引き） | `core/character-ai-profiles.ts`, `presentation/hooks/useGameLoop.ts` |

## テスト戦略

- **単体 (Jest)**: 新規ユーティリティ（PerfProbe, useReducedMotion, audit-portrait-fringe, AH_STRINGS）は全て追加
- **結合 (Jest)**: VsScreen 2v2 mobile はレイアウト切り替え、トーストは呼び出し + α 減衰
- **VRT (Playwright)**: 4 viewport × 主要 3 画面
- **E2E 機能 (Playwright)**: 手動チェックリスト（各デバイス・各モードで FPS 確認）
- **視覚 diff**: 画像処理前後を `作成画像/before-after/` に配置

## ロールバック戦略

- 各フェーズは独立 PR。revert で個別切り戻し可能
- 画像差替え（B1/B2）は原本を `作成画像/` に退避してから処理
- PerfProbe は `?perf=1` の opt-in、本番挙動に影響なし
- VRT ベースライン画像は「人手で目視後」コミット、意図せぬ変更時は即 rollback

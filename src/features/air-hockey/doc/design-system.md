# Air Hockey デザインシステム

> 作成日: 2026-04-19（S9-D-4）
> 対象: air-hockey feature の UI/UX 実装時のガイドライン

## 目的

- プロジェクト全体のデザイントークン（`src/styles/tokens/`）を air-hockey 内で一貫して活用
- ゲーム UI 特有の原則（HUD ミニマリズム、HSB カラー、ゲーム色彩心理）を実装時に遵守
- アニメーション・コントラスト・`prefers-reduced-motion` のルールを統一

## 優先順位: 既存トークン活用

新しい色・サイズを追加する前に、以下の順で既存資産を確認すること。

| 参照先 | 対象 |
|---|---|
| `src/styles/tokens/colors.ts` | テキスト・背景・ボーダー・状態 |
| `src/styles/tokens/game-ui.ts` | ゲームセマンティック色（danger/info/heal/achievement/energy/mystery/teamA/teamB） |
| `src/styles/tokens/typography.ts` | `--font-size-xs ... --font-size-3xl`（clamp 済の流動スケール 8 段階） |
| `src/styles/tokens/spacing.ts` | `--space-1 ... --space-16`（8px ベース） |

上記でカバーできない **ゲーム固有の意味論のみ** を `src/features/air-hockey/core/design-tokens.ts`（`AH_TOKENS`）に追加する。重複定義は PR でブロック対象。

## AH_TOKENS の中身（v4 時点）

```typescript
AH_TOKENS = {
  team: { a, b },             // gameUi.teamA / teamB 参照
  label: { cpu },             // colors.textMuted 参照
  vs: { textSize, characterNameSize, infoSize, labelSize, mobileBreakpoint },
  anim: { enter, exit, emphasis },
}
```

**独自定義は 3 項目のみ**:
- `vs.mobileBreakpoint: '600px'`（他トークンに該当値なし）
- `anim.enter / exit / emphasis`（既存 tokens にアニメーション定義なし）

他はすべて既存トークンの参照。

## アニメーション原則

| 用途 | Duration | Easing |
|---|---|---|
| `enter` | 200ms | `ease-out` |
| `exit` | 150ms | `ease-in`（退出は速く） |
| `emphasis` | 300ms | `cubic-bezier(0.34, 1.56, 0.64, 1)`（バウンス） |

**ルール**:
- この 3 種以外の独自 `transition` は禁止（PR レビューで差し戻し）
- 利用時は `animCss('enter', 'opacity')` ヘルパ経由
- `prefers-reduced-motion: reduce` では `useReducedMotion` フックで duration を 0 に

## コントラスト比 (WCAG AA)

すべての本文テキストに対して **≥ 4.5:1** を確保する。対象セレクタと修正履歴は [`.docs/ah-20260419-01/contrast-audit.md`](../../../../.docs/ah-20260419-01/contrast-audit.md) を参照。

**主な落とし穴**:
- ネオン系の彩度高い色（`#00ffff` 等）は背景とのコントラストが不足しがち。`text-shadow` グローで補強
- `#888` は背景 `#0d1117` で 6.4:1 だが、glass カード背景（半透明）では 3:1 程度に落ちる。`#b4b4b4` まで明るくする

## ゲーム UI 原則（air-hockey 固有）

### HUD ミニマリズム
- Scoreboard はゲーム中の主視線領域なので、操作ボタン（Menu / Pause）は透明度を下げる想定（将来タスク）
- プレイ中のテキストは常に最小限、情報は `aria-live` で支援技術にも露出

### ゲーム色彩心理（既存 `tokens/game-ui.ts` に準拠）
- `danger` (赤): ダメージ表示・リトライ
- `info` (青/ティール): ナビゲーション・ツールチップ
- `heal` (緑): 回復・正のフィードバック
- `achievement` (金): 実績・レアリティ
- `energy` (オレンジ): エネルギー・パワー
- `mystery` (紫): 隠し要素・神秘

### Canvas フォント統一（S9-V-4 実施済み）
- `renderer.ts` / `ui-renderer.ts` の全 `ctx.font` は `core/canvas-fonts.ts` 経由
- 本文系: `FONT_STACK_BODY`（Inter + Noto Sans JP + emoji フォールバック）
- 見出し系: `FONT_STACK_HEADING`（Orbitron 優先）
- DOM と Canvas で書体を揃え、日本語混在時の違和感を解消

### i18n 準備（S9-V-3 実施済み）
- Canvas 描画される日本語・英語文字列は `core/i18n-strings.ts` の `AH_STRINGS` 経由
- 現状は日本語のみ。実翻訳は別フェーズ

### `prefers-reduced-motion` 対応
- `useReducedMotion` フック（`hooks/useReducedMotion.ts`）を使う
- 各コンポーネントで個別に `matchMedia` を呼ばない

## 新規コンポーネント追加時のチェックリスト

1. ⬜ 既存 `styles/tokens/` で賄えないか確認（`colors` / `game-ui` / `typography` / `spacing`）
2. ⬜ 独自定義する場合、本ドキュメント + `AH_TOKENS` に追記
3. ⬜ コントラスト比 AA を満たすか WebAIM 相当で計測
4. ⬜ アニメーションは `enter` / `exit` / `emphasis` の 3 種のみ
5. ⬜ `useReducedMotion` で `prefers-reduced-motion` 対応
6. ⬜ ダークモード（`body.premium-theme`）で視認性確認
7. ⬜ ゲームパッド・キーボード操作で動作確認

## プロジェクト共通トークンへの還元候補

air-hockey で洗練されたパターンのうち、他の 12 タイトルに展開したいもの:

| 項目 | 還元先 | 優先度 |
|---|---|---|
| `useReducedMotion` フック | `src/hooks/useReducedMotion.ts`（共通化） | 中 |
| `CanvasLiveRegion` コンポーネント | `src/components/molecules/CanvasLiveRegion.tsx` | 中 |
| アニメーション 3 種原則（enter/exit/emphasis） | グローバルデザイン原則ドキュメント | 低 |
| `FONT_STACK_BODY` / `FONT_STACK_HEADING` | `src/styles/canvas-fonts.ts` | 低（他ゲームで Canvas 使用時に必要） |

還元タスクは air-hockey の S9 完了後、別マイルストーンで検討。

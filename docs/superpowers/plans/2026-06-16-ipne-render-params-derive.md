# IPNE UseGameRenderParams 型導出 実装計画（Phase D-2）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `useGameRender.ts` の `UseGameRenderParams` を `RenderContext` から `Omit` 導出し、約27フィールドの手書き重複と未使用 import を解消する（振る舞い不変）。

**Architecture:** `UseGameRenderParams = Omit<RenderContext, 'ctx' | 'canvas' | 'now'> & { canvasRef; renderTime }` に型導出。フック本体は `{ ...rest, ctx, canvas, now: renderTime }` で `RenderContext` を再構築。依存配列は元と完全に同一。`Game.test.tsx`（GameScreen を render）＋ typecheck が安全網。

**Tech Stack:** React 19, TypeScript, Jest (SWC)。

**設計の出典:** `docs/superpowers/specs/2026-06-16-ipne-render-params-derive-design.md`

---

## 対象ファイル

| ファイル | 扱い |
|---------|------|
| `src/features/ipne/presentation/screens/useGameRender.ts`（135行） | **変更**（型導出＋フック本体＋import 整理。約35行へ） |
| `render/renderContext.ts` / `render/*` / `Game.tsx` | **無変更**（RenderContext・各層・useGameRender 呼び出しは触らない） |

### 不変条件（厳守）

- `useGameRender` の useEffect 依存配列を1要素も変えない（再描画挙動不変）。
- `renderGameFrame` に渡る `RenderContext` の中身が従来と同一であること。
- `UseGameRenderParams` の公開名・公開フィールド（外部から見た型）が実質同一であること（Game.tsx の呼び出しが無修正で通る）。

---

## Task 0: ベースライン確認

**Files:** なし

- [ ] **Step 1: ブランチ確認**

Run: `git branch --show-current`
Expected: `refactor/ipne-render-params-derive`

- [ ] **Step 2: Game テスト緑＋typecheck**

Run: `npx jest Game.test 2>&1 | tail -6`（PASS）
Run: `npm run typecheck 2>&1 | tail -3`（エラーなし）

---

## Task 1: `useGameRender.ts` を型導出に書き換え

**Files:**
- Modify: `src/features/ipne/presentation/screens/useGameRender.ts`

- [ ] **Step 1: ファイル全体を以下に置換**

`useGameRender.ts` の内容を**丸ごと**以下に置き換える（個別型 import の削除・型導出・フック本体のスプレッド化を一括で行う）:

```typescript
/**
 * Canvas描画フック
 *
 * Game.tsx の Canvas描画 useEffect を移設したもの。
 * canvas/ctx ガード後に renderGameFrame で1フレームを描画する。
 * 依存配列・描画ロジックは元 effect と完全に同一。
 */
import React, { useEffect } from 'react';
import { renderGameFrame } from './render/renderGameFrame';
import type { RenderContext } from './render/renderContext';

/**
 * useGameRender に渡すパラメータ。
 * RenderContext の生入力から導出する（ctx/canvas/now はフック内で canvasRef/renderTime から導出）。
 */
export type UseGameRenderParams = Omit<RenderContext, 'ctx' | 'canvas' | 'now'> & {
  /** canvas 要素の ref（フック内で .current から canvas/ctx を導出） */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** 描画タイムスタンプ（RenderContext.now の供給元） */
  renderTime: number;
};

export function useGameRender(params: UseGameRenderParams): void {
  const { canvasRef, renderTime, ...rest } = params;
  // 依存配列用に reactive 値を明示分割代入（可読性のため）
  const {
    map, player, enemies, items, traps, walls, mapState, goalPos, debugState,
    attackEffect, lastDamageAt, effectQueueRef, floatingTextManagerRef, comboStateRef,
    spriteRenderer, isDying,
  } = params;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderGameFrame({ ...rest, ctx, canvas, now: renderTime });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    map, player, enemies, items, traps, walls, mapState, goalPos, debugState, renderTime,
    attackEffect, lastDamageAt, effectQueueRef, floatingTextManagerRef, comboStateRef,
    spriteRenderer, isDying,
  ]);
}
```

注意:
- `rest` は `Omit<RenderContext, 'ctx' | 'canvas' | 'now'>`（`canvasWrapperRef` を含む）。
  `{ ...rest, ctx, canvas, now: renderTime }` で完全な `RenderContext` になる。
- 依存配列は元（135行目）と**完全に同一**: `[map, player, enemies, items, traps, walls, mapState,
  goalPos, debugState, renderTime, attackEffect, lastDamageAt, effectQueueRef,
  floatingTextManagerRef, comboStateRef, spriteRenderer, isDying]`。
- `UseGameRenderParams` を `interface` から `type`（交差型）に変更する点に注意（`export type`）。
- 旧ファイルの個別型 import（GameMap/Player/Enemy/.../EffectEvent 等）は全て削除済みの状態にする
  （上記が最終形）。`React`/`useEffect`/`renderGameFrame`/`RenderContext` のみ import。

- [ ] **Step 2: 型チェック**

Run: `npm run typecheck 2>&1 | tail -5`
Expected: エラーなし。特に:
- `renderGameFrame({ ...rest, ctx, canvas, now: renderTime })` が `RenderContext` を満たす。
- `Game.tsx` の `useGameRender({...})` 呼び出しが新 `UseGameRenderParams` を満たす（無修正で通る）。
もし型エラーが出たら、`canvasWrapperRef` が RenderContext 側にあること（Omit 対象に含めない）を再確認する。

- [ ] **Step 3: Game テスト（振る舞い不変の確認）**

Run: `npx jest Game.test 2>&1 | tail -6`
Expected: PASS（GameScreen が render され useGameRender が実行される）

- [ ] **Step 4: lint**

Run: `npx eslint src/features/ipne/presentation/screens/useGameRender.ts 2>&1 | tail -10`
Expected: エラーなし（未使用 import が残っていないこと）

- [ ] **Step 5: 行数が縮小したことを確認**

Run: `wc -l src/features/ipne/presentation/screens/useGameRender.ts`
Expected: 135行から大幅減（約35行）

- [ ] **Step 6: コミット**

```bash
git add src/features/ipne/presentation/screens/useGameRender.ts
git commit -m "refactor: IPNE UseGameRenderParams を RenderContext から型導出

- 約27フィールドの手書き重複を Omit<RenderContext,'ctx'|'canvas'|'now'>＋{canvasRef,renderTime} で解消
- フック本体は ...rest 再構築に簡潔化、未使用の個別型 import を削除（135→約35行）
- 依存配列・公開 props は不変

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 最終検証

**Files:** なし

- [ ] **Step 1: IPNE 全テスト**

Run: `npx jest ipne 2>&1 | tail -6`
Expected: PASS（IPNE 全スイート green）

- [ ] **Step 2: lint:ci（警告ゼロ強制）**

Run: `npm run lint:ci 2>&1 | tail -8`
Expected: エラー・警告なし（exit 0）

- [ ] **Step 3: 依存配列が元と同一であることを目視確認**

`git show HEAD:src/features/ipne/presentation/screens/useGameRender.ts` と旧版（`git show HEAD~1:...`）の
依存配列を比較し、要素・順序が完全一致であることを確認。

---

## 完了の定義（Definition of Done）

- [ ] `UseGameRenderParams` が `Omit<RenderContext, 'ctx'|'canvas'|'now'> & { canvasRef; renderTime }` に導出されている
- [ ] フック本体が `{ ...rest, ctx, canvas, now: renderTime }` で再構築（フィールド手書き列挙が消滅）
- [ ] 依存配列が元と完全に同一
- [ ] 未使用の個別型 import が削除され useGameRender.ts が縮小（135→約35行）
- [ ] `RenderContext`・`render/` 各層・`Game.tsx` の useGameRender 呼び出しは無変更
- [ ] `npx jest ipne` / `npm run typecheck` / `npm run lint:ci` 全パス

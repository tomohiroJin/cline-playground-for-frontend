# IPNE UseGameRenderParams の型導出 設計（Phase D-2）

- 日付: 2026-06-16
- 対象: `src/features/ipne/presentation/screens/useGameRender.ts`
- 種別: リファクタリング（**振る舞い不変**・型重複の解消）
- 位置づけ: IPNE 包括リファクタリング・ロードマップの **Phase D-2**（D-1 の後続）

## 1. 背景と目的

Phase D-1 で描画ロジックを `useGameRender` フック＋`render/` の5層へ抽出した。その過程で
`useGameRender.ts` の `UseGameRenderParams` インターフェースが、`render/renderContext.ts` の
`RenderContext` から `ctx`/`canvas`/`now` を除いた約27フィールドを**手書きで再列挙**している。

`RenderContext`（正準）と `UseGameRenderParams`（ほぼ複製）の2つの型で同じフィールド群を
重複定義しており、片方を変更するともう片方の更新漏れが起こる DRY 違反である。

本作業の目的:

1. `UseGameRenderParams` を `RenderContext` から **`Omit` で型導出**し、約27フィールドの
   手書き重複を解消する。
2. フックの `renderGameFrame` 再構築をスプレッドで簡潔にし、未使用になる import を削除する。
3. **依存配列・描画の振る舞いを一切変えない**。

### 非目標（YAGNI）

- **refs のグルーピング**（`effectRefs`/`timingRefs` 等の入れ子化）はしない。5層全ての参照書き換えが
  必要で高リスク・低価値（refs は綺麗にグループ化しづらい）。Phase D-2 のスコープ外。
- `RenderContext` 型・`render/` の各層・`Game.tsx` の `useGameRender` 呼び出し（shorthand）は変更しない。
- 依存配列の内容変更。

## 2. 現状調査の要点

- `useGameRender.ts`（135行）: `UseGameRenderParams` が `canvasRef`/`renderTime` ＋ RenderContext の
  生入力相当（map/player/.../全 ref）を手書き列挙。型 import も個別に約12個（GameMap/Player/
  EffectManager/DeathEffect/...）。
- `RenderContext`（renderContext.ts）との対応:
  `UseGameRenderParams` ≡ `Omit<RenderContext, 'ctx' | 'canvas' | 'now'>` ＋ `{ canvasRef; renderTime }`。
  - `canvasWrapperRef` は両方にあり同型 → Omit 基底に残り継承される。
  - `canvas`(HTMLCanvasElement)/`ctx`/`now` はフック内で `canvasRef.current` / `getContext` /
    `renderTime` から導出されるため UseGameRenderParams には無い。
- フック本体は現在、全 params を分割代入し `renderGameFrame({ ...全フィールド列挙... })` で再構築。
- 依存配列（要維持・元と同一）:
  `[map, player, enemies, items, traps, walls, mapState, goalPos, debugState, renderTime,
  attackEffect, lastDamageAt, effectQueueRef, floatingTextManagerRef, comboStateRef,
  spriteRenderer, isDying]`。
- 安全網: `Game.test.tsx`（GameScreen を render → `useGameRender` を実行）が存在。IPNE 1324テスト。

## 3. 変更後の構造

### `UseGameRenderParams` の型導出

```typescript
import type { RenderContext } from './render/renderContext';

/** useGameRender に渡すパラメータ（RenderContext の生入力から導出） */
export type UseGameRenderParams = Omit<RenderContext, 'ctx' | 'canvas' | 'now'> & {
  /** canvas 要素の ref（フック内で .current から canvas/ctx を導出） */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** 描画タイムスタンプ（RenderContext.now の供給元） */
  renderTime: number;
};
```

### フック本体（スプレッドで再構築）

```typescript
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

- `rest` ＝ `Omit<RenderContext, 'ctx' | 'canvas' | 'now'>`。`{ ...rest, ctx, canvas, now: renderTime }`
  で完全な `RenderContext` になる（従来の再構築と同一内容）。
- 依存配列は**元と完全に同一**（順序・要素とも）。

### import の整理

`UseGameRenderParams` が `RenderContext` 由来になるため、個別の型 import（`GameMap`/`Player`/
`Enemy`/`Item`/`Trap`/`Wall`/`AutoMapState`/`Position`/`StageNumber`/`DebugState`/`MovementState`/
`SpriteRenderer`/`EffectManager`/`DeathEffect`/`BossWarningState`/`AfterImageManager`/
`RewardEffectFlags`/`FloatingTextManager`/`ComboState`/`EffectEvent` 等）が**未使用になり削除可能**。
import は `RenderContext`（`./render/renderContext`）＋ `React`/`useEffect`/`renderGameFrame` に絞られ、
ファイルが 135行 → 約35行に縮小する。typecheck/lint の未使用検出に従って正確に削除する。

## 4. 安全網（振る舞い不変の証明）

- **`npm run typecheck`**: 型導出（`Omit` ＋ 交差型）が `RenderContext` と整合し、フックの
  `renderGameFrame({ ...rest, ctx, canvas, now })` が `RenderContext` を満たすことを保証。
  Game.tsx の `useGameRender({...})` 呼び出しが新 `UseGameRenderParams` を満たすことも検証される。
- **`Game.test.tsx`**: GameScreen を render し `useGameRender` を実行する統合テストが緑のまま。
- 依存配列が元と同一であることを目視確認（再描画挙動の不変）。

## 5. 検証手順（refactor-safely）

1. `UseGameRenderParams` を `Omit` 導出に変更し、フック本体を `...rest` 再構築に書き換え、未使用 import を削除。
2. 検証:

```bash
npm run typecheck
npx jest Game.test
npx eslint src/features/ipne/presentation/screens/useGameRender.ts
```

3. 最終確認: `npx jest ipne` / `npm run lint:ci` 全パス。

### 完了の定義（Definition of Done）

- [ ] `UseGameRenderParams` が `Omit<RenderContext, 'ctx'|'canvas'|'now'> & { canvasRef; renderTime }` に導出されている
- [ ] フック本体が `{ ...rest, ctx, canvas, now: renderTime }` で再構築し、フィールド手書き列挙が消えている
- [ ] 依存配列が元と完全に同一
- [ ] 未使用になった個別型 import が削除され useGameRender.ts が縮小（135→約35行）
- [ ] `RenderContext`・`render/` 各層・`Game.tsx` の useGameRender 呼び出しは無変更
- [ ] `npx jest ipne` / `npm run typecheck` / `npm run lint:ci` 全パス

## 6. リスクと緩和

| リスク | 緩和策 |
|--------|--------|
| `Omit`/交差型の導出が RenderContext とズレて型エラー | typecheck で検出。`canvasWrapperRef` が両型にある点に注意（Omit 基底に残す） |
| `{ ...rest, ctx, canvas, now }` が RenderContext を満たさない（フィールド漏れ） | rest が Omit 基底＝必要十分。typecheck で渡り先 `renderGameFrame(rc: RenderContext)` が検証 |
| 依存配列の取りこぼし | 元の依存配列をそのままコピー。目視確認＋ Game.test |
| import 削除で必要な型まで消す | typecheck/lint の未使用検出に従い、消しすぎは型エラーで即検出 |

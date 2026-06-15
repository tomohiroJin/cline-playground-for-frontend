# IPNE Game.tsx 描画ロジック抽出 実装計画（Phase D-1）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Game.tsx` の645行の描画 `useEffect` を `useGameRender` フック＋`render/` の中粒度5モジュールへ抽出し、Game.tsx を薄くする（描画順序・出力不変）。

**Architecture:** まず effect 本体を単一関数 `renderGameFrame(rc)` へ丸ごと抽出し、モック ctx で描画コマンド列を記録する特性化テストで baseline を固定。その後 `renderGameFrame` がセットアップで計算する共有ローカルを `FrameContext` に束ね、5層関数（drawWorld/drawEnemies/combatEffects/drawPlayer/drawOverlays）へ分割。最後に呼び出しを `useGameRender` フックへ移す。各ステップで特性化テストの差分ゼロと既存 `Game.test.tsx` の緑を保つ。

**Tech Stack:** React 19, TypeScript, Canvas 2D, Jest (SWC) + @testing-library/react（jsdom）。

**設計の出典:** `docs/superpowers/specs/2026-06-15-ipne-game-render-extract-design.md`

---

## 対象ファイルと責務

すべて `src/features/ipne/presentation/screens/` 配下（render/ サブディレクトリ新設）。

| ファイル | 役割 | 扱い |
|---------|------|------|
| `render/renderContext.ts` | `RenderContext`（生入力）と `FrameContext`（rc＋計算済みローカル）の型 | 新規（Task 1） |
| `render/renderGameFrame.ts` | effect 本体を移植した描画オーケストレーター。Task 4〜8 で層へ委譲 | 新規（Task 2） |
| `render/drawWorld.ts` 他4 | 層別描画関数（drawWorld/drawEnemies/combatEffects/drawPlayer/drawOverlays） | 新規（Task 4〜8） |
| `render/__mockCtx.ts`（テスト補助） | 描画コマンド列を記録するモック ctx | 新規（Task 3）→ Task 10 で削除 |
| `render/renderGameFrame.characterization.test.ts` | 特性化テスト（一時） | 新規（Task 3）→ Task 10 で削除 |
| `useGameRender.ts` | 描画 useEffect を移したフック | 新規（Task 9） |
| `Game.tsx`（990行） | 描画 effect を `useGameRender(...)` 呼び出しに置換し薄くする | 変更（Task 2, 9） |

### 不変条件（厳守）

- 描画順序（z-order）と ctx へのコマンド列を変えない。
- 「効果トリガー＋更新」節（combatEffects）の呼び出し位置（敵描画とプレイヤー描画の間）を保つ。
- `GameScreen` の公開 props・描画 effect の依存配列を変えない。
- refs の構造化（D-2）はしない。兄弟コンポーネント（GameCanvas/HUD/Controls/Modals）は無変更。

---

## Task 0: ベースライン確認

**Files:** なし

- [ ] **Step 1: ブランチ確認**

Run: `git branch --show-current`
Expected: `refactor/ipne-game-render-extract`

- [ ] **Step 2: Game テスト緑確認**

Run: `npx jest Game 2>&1 | tail -8`
Expected: PASS（`Game.test.tsx`）

- [ ] **Step 3: typecheck ベースライン**

Run: `npm run typecheck 2>&1 | tail -3`
Expected: エラーなし

---

## Task 1: `RenderContext` / `FrameContext` 型を定義

**Files:**
- Create: `src/features/ipne/presentation/screens/render/renderContext.ts`

- [ ] **Step 1: 型を定義**

`Game.tsx` の描画 `useEffect`（280-950行）が closure で参照している値を確認し、その全てを `RenderContext` に列挙する。`FrameContext` は `RenderContext` を継承し、effect のセットアップで計算される共有ローカル（`spriteScale`/`drawWidth`/`drawHeight`/`stageFloor`/`stageWall`/`toScreenPosition`/`playerScreen`/`startPos`/`path`）を加える。

Create `render/renderContext.ts`（型 import は Game.tsx の既存 import を踏襲。下記は骨子。実際の型は Game.tsx の参照に合わせて過不足なく定義すること）:

```typescript
import type React from 'react';
import type { GameMap, Player, Enemy, Item, Trap, Wall, AutoMapState, Position, StageNumber } from '../../../types';
import type { Direction } from '../../../types';
import type { DebugState } from '../../../infrastructure/debug/debugService';
import type { Viewport } from '../../services/viewportService';
import type { SpriteRenderer } from '../sprites';
import type { EffectManager } from '../effects/effectManager';
import type { DeathEffect } from '../effects/deathEffect';
import type { BossWarningState } from '../effects/bossEffects';
import type { AfterImageManager } from '../effects/afterImage';
import type { FloatingTextManager } from '../effects/floatingText';
import type { ComboState } from '../../domain/services/comboService';
import type { EffectEvent } from '../GameModals';

/** 描画に必要な生入力（Game.tsx の effect closure 相当） */
export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  now: number;
  map: GameMap;
  player: Player;
  enemies: Enemy[];
  items: Item[];
  traps: Trap[];
  walls: Wall[];
  mapState: AutoMapState;
  goalPos: { x: number; y: number };
  debugState: DebugState;
  attackEffect?: { position: Position; until: number };
  lastDamageAt: number;
  isDying: boolean;
  currentStage?: StageNumber;
  maxLevel: number;
  rewardEffects: import('../effects/stageVisual').RewardVisualEffects; // 実際の getActiveRewardEffects 戻り型に合わせる
  spriteRenderer: SpriteRenderer;
  effectManagerRef: React.MutableRefObject<EffectManager>;
  deathEffectRef: React.MutableRefObject<DeathEffect>;
  bossWarningRef: React.MutableRefObject<BossWarningState>;
  afterImageManagerRef: React.MutableRefObject<AfterImageManager>;
  stageStartTimeRef: React.MutableRefObject<number>;
  dyingStartTimeRef: React.MutableRefObject<number>;
  playerAttackUntilRef: React.MutableRefObject<number>;
  playerDamageUntilRef: React.MutableRefObject<number>;
  lastAttackEffectKeyRef: React.MutableRefObject<string | null>;
  lastDamageAtRef: React.MutableRefObject<number>;
  floatingTextManagerRef?: React.MutableRefObject<FloatingTextManager>;
  comboStateRef?: React.MutableRefObject<ComboState>;
  effectQueueRef?: React.MutableRefObject<EffectEvent[]>;
}

/** RenderContext＋セットアップで計算した共有ローカル。層関数はこれを受け取る */
export interface FrameContext extends RenderContext {
  viewport: Viewport;
  tileSize: number;
  offsetX: number;
  offsetY: number;
  useFullMap: boolean;
  drawWidth: number;
  drawHeight: number;
  spriteScale: number;
  stageFloor: import('../sprites').SpriteDefinition;
  stageWall: import('../sprites').SpriteDefinition;
  startPos: Position | null;
  path: Position[];
  playerScreen: Position;
  toScreenPosition: (pos: Position) => Position;
}
```

> 重要: import パス・型名は実際の Game.tsx の import を確認して正確に合わせること（上記は設計時点の推定）。
> `RewardVisualEffects`/`SpriteDefinition` 等の正確な型名・配置は元コードに従う。

- [ ] **Step 2: 型チェック**

Run: `npm run typecheck 2>&1 | tail -5`
Expected: エラーなし（型のみ。まだ未使用）

- [ ] **Step 3: コミット**

```bash
git add src/features/ipne/presentation/screens/render/renderContext.ts
git commit -m "feat: IPNE 描画コンテキスト型 RenderContext/FrameContext を定義

- Game.tsx の描画 effect が参照する値を RenderContext に集約
- セットアップ計算済みローカルを足した FrameContext を層関数の引数型とする

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: effect 本体を `renderGameFrame(rc)` へ単一抽出

**Files:**
- Create: `src/features/ipne/presentation/screens/render/renderGameFrame.ts`
- Modify: `src/features/ipne/presentation/screens/Game.tsx`

このタスクは**純粋な move**。effect 本体のうち「描画ロジック」部分を丸ごと `renderGameFrame(rc)` へ移し、
Game.tsx の effect は canvas/ctx ガード・canvas サイズ計算・viewport/tileSize 計算・`RenderContext` 構築・
`renderGameFrame(rc)` 呼び出しに縮小する。**ロジック・順序は1行も変えない。**

- [ ] **Step 1: 現在の effect（280-950行）を読む**

境界を把握する:
- 前半（280-335行付近）: canvas/ctx ガード、`mapWidth`/`mapHeight`、`now = renderTime`、`useFullMap`、
  `tileSize`/`offsetX`/`offsetY`/`viewport`、canvas.width/height 設定、背景クリア、シェイク適用。
- 後半（335-950行）: 描画ロジック本体（startPos/path、マップ、罠、壁、アイテム、敵、効果、プレイヤー、
  オーバーレイ群）。

- [ ] **Step 2: `renderGameFrame.ts` を作成**

`renderGameFrame(rc: RenderContext): void` を作り、**effect 後半の描画ロジック（背景クリア後〜末尾）を
逐語移植**する。`now`/`map`/`player`/`ctx` 等の参照は `rc.now`/`rc.map`/… に置換（または冒頭で
`const { ctx, now, map, ... } = rc;` と分割代入して元の変数名を維持＝本体無改変にする）。

`canvas.width`/`canvas.height` やシェイクの `ctx.save/translate` 等、後半が前半のローカル
（`viewport`/`tileSize`/`offsetX`/`offsetY`/`useFullMap`/`shakeOffset`）に依存する場合は、それらも
`renderGameFrame` 側で計算するか rc に含めて渡す。**このタスクでは「rc に最小限の生入力を渡し、
renderGameFrame 内でセットアップ計算も行う」方針**とし、後の分割（Task 4〜）で FrameContext へ整理する。

具体方針: `renderGameFrame(rc)` の冒頭で `const { ctx, canvas, now, map, ... } = rc;` を分割代入し、
viewport/tileSize/offset/useFullMap・背景クリア・シェイク適用・startPos・path・spriteScale 等の
**セットアップ計算と描画を、元 effect の 282行目以降と同じ順序・同じコードで**実行する。

```typescript
// render/renderGameFrame.ts（骨子。本体は Game.tsx の effect から逐語移植）
import type { RenderContext } from './renderContext';
// 元 effect が import していた描画ヘルパー・sprites・effects 等をここへ移す
// （calculateViewport, getCanvasSize, calculateTileSize, findPath, drawAutoMap,
//   drawDebugPanel, drawPlayerAura, drawWeaponTrail, ... SPRITE シート類）

export function renderGameFrame(rc: RenderContext): void {
  const {
    ctx, canvas, now, map, player, enemies, items, traps, walls, mapState, goalPos,
    debugState, attackEffect, lastDamageAt, isDying, currentStage, maxLevel, rewardEffects,
    spriteRenderer, effectManagerRef, deathEffectRef, bossWarningRef, afterImageManagerRef,
    stageStartTimeRef, dyingStartTimeRef, playerAttackUntilRef, playerDamageUntilRef,
    lastAttackEffectKeyRef, lastDamageAtRef, floatingTextManagerRef, comboStateRef, effectQueueRef,
  } = rc;

  if (map.length === 0 || !map[0]) return;
  const mapWidth = map[0].length;
  const mapHeight = map.length;
  // ...元 effect 282行目以降の本体を逐語移植（変数名そのまま）...
}
```

- [ ] **Step 3: Game.tsx の effect を rc 構築＋呼び出しに置換**

`Game.tsx` の描画 `useEffect`（280行）の本体を、canvas/ctx ガードと `RenderContext` 構築 ＋
`renderGameFrame(rc)` 呼び出しに置換する。`canvasWrapperRef` はサイズ計算に必要なので rc に含めるか、
canvas サイズ計算は renderGameFrame 側で `rc.canvas`/ラッパー参照を使う形にする（元の
`canvasWrapperRef.current` 依存を保つため、`canvasWrapperRef` も rc に追加してよい）。
**依存配列（280行の `useEffect` 末尾の deps）は元と完全に同一に保つ。**

```typescript
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderGameFrame({
      ctx, canvas, now: renderTime, map, player, enemies, items, traps, walls, mapState, goalPos,
      debugState, attackEffect, lastDamageAt, isDying, currentStage, maxLevel, rewardEffects,
      spriteRenderer, effectManagerRef, deathEffectRef, bossWarningRef, afterImageManagerRef,
      stageStartTimeRef, dyingStartTimeRef, playerAttackUntilRef, playerDamageUntilRef,
      lastAttackEffectKeyRef, lastDamageAtRef, floatingTextManagerRef, comboStateRef, effectQueueRef,
      canvasWrapperRef, // canvas サイズ計算に使う場合
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, player, enemies, items, traps, walls, mapState, goalPos, debugState, renderTime, attackEffect, lastDamageAt, effectQueueRef, floatingTextManagerRef, comboStateRef, spriteRenderer, isDying]);
```

> 注: `playerScreen` を後段（デバッグ座標オーバーレイ）で使うため、renderGameFrame 内で計算した
> `playerScreen` を最後まで参照できるようにすること（元 effect と同じスコープ構造を保つ）。
> `canvasWrapperRef` を rc に含めるなら RenderContext 型にも追加する。

- [ ] **Step 4: 既存 Game テストが緑であることを確認**

Run: `npx jest Game 2>&1 | tail -8`
Expected: PASS（描画が同じく走り、render が成功する）

- [ ] **Step 5: 型チェック＆lint**

Run: `npm run typecheck 2>&1 | tail -3`（エラーなし）
Run: `npx eslint src/features/ipne/presentation/screens/ 2>&1 | tail -10`（エラーなし、Game.tsx で未使用になった import を renderGameFrame へ移動済みか確認）

- [ ] **Step 6: コミット**

```bash
git add src/features/ipne/presentation/screens/render/renderGameFrame.ts \
        src/features/ipne/presentation/screens/Game.tsx
git commit -m "refactor: IPNE 描画 effect 本体を renderGameFrame へ単一抽出

- Game.tsx の描画ロジックを renderGameFrame(rc) へ逐語移植し effect を薄く
- 描画順序・依存配列は不変。後続で層へ分割する土台

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 特性化テスト（描画コマンド列）で baseline 固定

**Files:**
- Create: `src/features/ipne/presentation/screens/render/__mockCtx.ts`
- Create: `src/features/ipne/presentation/screens/render/renderGameFrame.characterization.test.ts`
- Create（生成物）: `render/__snapshots__/renderGameFrame.characterization.test.ts.snap`

- [ ] **Step 1: 記録するモック ctx を作成**

Create `render/__mockCtx.ts`:

```typescript
/**
 * 描画コマンド列を記録するモック CanvasRenderingContext2D（Phase D-1 特性化用）
 *
 * 主要メソッドの呼び出し名・引数と、主要プロパティ代入を順に records へ積む。
 * drawImage 等の引数に DOM/ImageData が来る場合は型名に丸めて決定的にする。
 */
export interface DrawCall {
  op: string;
  args: unknown[];
}

export function createRecordingCtx(): { ctx: CanvasRenderingContext2D; records: DrawCall[] } {
  const records: DrawCall[] = [];
  const sanitize = (a: unknown): unknown => {
    if (a && typeof a === 'object') {
      const name = (a as { constructor?: { name?: string } }).constructor?.name;
      return `[${name ?? 'object'}]`;
    }
    return a;
  };
  const methods = [
    'save', 'restore', 'translate', 'setTransform', 'resetTransform', 'scale', 'rotate',
    'fillRect', 'strokeRect', 'clearRect', 'beginPath', 'closePath', 'moveTo', 'lineTo',
    'arc', 'ellipse', 'rect', 'fill', 'stroke', 'clip', 'fillText', 'strokeText',
    'drawImage', 'createLinearGradient', 'createRadialGradient', 'measureText',
    'setLineDash', 'putImageData', 'getImageData', 'createImageData',
  ];
  const props = ['fillStyle', 'strokeStyle', 'globalAlpha', 'lineWidth', 'font', 'textAlign', 'textBaseline', 'globalCompositeOperation', 'shadowBlur', 'shadowColor', 'lineCap', 'lineJoin'];

  const target: Record<string, unknown> = {};
  for (const m of methods) {
    target[m] = (...args: unknown[]) => {
      records.push({ op: m, args: args.map(sanitize) });
      // 一部メソッドは戻り値が必要
      if (m === 'measureText') return { width: 0 } as TextMetrics;
      if (m === 'createLinearGradient' || m === 'createRadialGradient') {
        return { addColorStop: () => {} };
      }
      if (m === 'getImageData' || m === 'createImageData') {
        return { data: new Uint8ClampedArray(4), width: 1, height: 1 } as ImageData;
      }
      return undefined;
    };
  }
  for (const p of props) {
    let v: unknown;
    Object.defineProperty(target, p, {
      get: () => v,
      set: (nv: unknown) => { v = nv; records.push({ op: `set:${p}`, args: [sanitize(nv)] }); },
    });
  }
  return { ctx: target as unknown as CanvasRenderingContext2D, records };
}
```

同じファイルに、**描画シーケンスを完全に捕捉するための記録 SpriteRenderer** も用意する。
理由: 既存の sprite 描画は `spriteRenderer.drawSprite(ctx, ...)` 経由で、`SpriteRenderer` は内部で
オフスクリーン canvas にキャッシュしてから `ctx.drawImage` するため、jsdom では実 ctx 呼び出しが
不安定・非決定的になりうる。そこで `rc.spriteRenderer` に**記録 SpriteRenderer**（drawSprite 等の
呼び出しを records に積むスパイ）を渡し、ctx 直接呼び出し（fillRect/save/restore/fillText 等）と
sprite 呼び出しを**同一 records 配列へ時系列順に**記録する。これで描画順序全体を特性化できる。

```typescript
import type { SpriteRenderer } from '../sprites';

/** drawSprite 等の呼び出しを records に記録する SpriteRenderer スパイ */
export function createRecordingSpriteRenderer(records: DrawCall[]): SpriteRenderer {
  const rec = (op: string) => (...args: unknown[]) => {
    // 第1引数の ctx は除外し、スプライト識別と座標・scale を記録
    records.push({ op: `sprite:${op}`, args: args.slice(1).map((a) => (a && typeof a === 'object' ? `[${(a as { constructor?: { name?: string } }).constructor?.name ?? 'sheet'}]` : a)) });
  };
  return {
    drawSprite: rec('drawSprite'),
    drawAnimatedSprite: rec('drawAnimatedSprite'),
    drawSpriteWithAlpha: rec('drawSpriteWithAlpha'),
    clearCache: () => {},
  } as unknown as SpriteRenderer;
}
```

> 注: 特性化テストでは `../sprites` の `SpriteRenderer` を jest.mock せず、`rc.spriteRenderer` に
> 上記スパイを渡す（renderGameFrame は `rc.spriteRenderer` を使うため module mock 不要）。
> 一方 `drawPlayerAura`/`drawWeaponTrail` 等の ctx 直描画ヘルパーは実物を使い、mock ctx が記録する。

- [ ] **Step 2: 特性化テストを作成**

Create `render/renderGameFrame.characterization.test.ts`。既存テスト（`Game.test.tsx`）が使う builder/fixture を
流用して代表的な `RenderContext` を組み、`renderGameFrame(rc)` を呼んで `records` をスナップショットする。
**決定性のため**: `now` を固定値（例 `1000`）、`attackEffect` 無し、`isDying: false`、新規 `EffectManager`
（アクティブシェイク無し→`getShakeOffset()` が null）を使う。複数状態（通常／敵あり／デバッグ有効）を
別 it で baseline 化する。

`buildRc` は `Game.test.tsx` の `createMinimalProps`（map=createTestMap(7,7), player=createPlayer(1,1,WARRIOR),
goalPos={x:5,y:5}, debugState 全 false 等）と同じ fixture を流用して構築する。fixture の import 元は
Game.test.tsx と同一: `createTestMap`(`../../__tests__/testUtils`), `createPlayer`(`../../domain/entities/player`),
`PlayerClass`/`ExplorationState`(`../../types`)。refs は `{ current: new EffectManager() }` のように生成する。

```typescript
import { renderGameFrame } from './renderGameFrame';
import { createRecordingCtx, createRecordingSpriteRenderer } from './__mockCtx';
import type { RenderContext } from './renderContext';
import { createTestMap } from '../../__tests__/testUtils';
import { createPlayer } from '../../domain/entities/player';
import { PlayerClass, ExplorationState } from '../../types';
import { EffectManager } from '../effects/effectManager';
import { DeathEffect } from '../effects/deathEffect';
import { createBossWarningState } from '../effects/bossEffects';
import { AfterImageManager } from '../effects/afterImage';
import { getActiveRewardEffects } from '../effects/stageVisual';
// ↑ 正確な import 元/名は renderGameFrame と Game.tsx の import を確認して合わせる

function buildRc(records: import('./__mockCtx').DrawCall[], overrides: Partial<RenderContext> = {}): RenderContext {
  const map = createTestMap(7, 7);
  const player = createPlayer(1, 1, PlayerClass.WARRIOR);
  const mapState = {
    exploration: Array.from({ length: 7 }, () => Array.from({ length: 7 }, () => ExplorationState.UNEXPLORED)),
    isMapVisible: false,
    isFullScreen: false,
  };
  // jsdom canvas（getContext は呼ばない。ctx は overrides で記録 ctx を渡す）
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 528;
  return {
    ctx: overrides.ctx as CanvasRenderingContext2D, // 呼び出し側で記録 ctx を渡す
    canvas,
    now: 1000,
    map,
    player,
    enemies: [],
    items: [],
    traps: [],
    walls: [],
    mapState,
    goalPos: { x: 5, y: 5 },
    debugState: { enabled: false, showPanel: false, showFullMap: false, showPath: false, showCoordinates: false } as never,
    attackEffect: undefined,
    lastDamageAt: 0,
    isDying: false,
    currentStage: undefined,
    maxLevel: 10,
    rewardEffects: getActiveRewardEffects([]),
    spriteRenderer: createRecordingSpriteRenderer(records),
    effectManagerRef: { current: new EffectManager() },
    deathEffectRef: { current: new DeathEffect() },
    bossWarningRef: { current: createBossWarningState() },
    afterImageManagerRef: { current: new AfterImageManager() },
    stageStartTimeRef: { current: 0 },
    dyingStartTimeRef: { current: 0 },
    playerAttackUntilRef: { current: 0 },
    playerDamageUntilRef: { current: 0 },
    lastAttackEffectKeyRef: { current: null },
    lastDamageAtRef: { current: 0 },
    floatingTextManagerRef: undefined,
    comboStateRef: undefined,
    effectQueueRef: undefined,
    ...overrides,
  } as RenderContext;
}

describe('renderGameFrame 特性化（Phase D-1・完了後削除）', () => {
  it('通常状態の描画コマンド列が変化しないこと', () => {
    const { ctx, records } = createRecordingCtx();
    renderGameFrame(buildRc(records, { ctx }));
    expect(records).toMatchSnapshot();
  });

  it('敵がいる状態の描画コマンド列が変化しないこと', () => {
    const { ctx, records } = createRecordingCtx();
    const enemy = createEnemy(3, 3, /* type */ undefined as never, idGen); // 実 fixture に合わせる
    renderGameFrame(buildRc(records, { ctx, enemies: [enemy] }));
    expect(records).toMatchSnapshot();
  });

  it('デバッグ有効時の描画コマンド列が変化しないこと', () => {
    const { ctx, records } = createRecordingCtx();
    renderGameFrame(buildRc(records, { ctx, debugState: { enabled: true, showPanel: true, showFullMap: false, showPath: false, showCoordinates: true } as never }));
    expect(records).toMatchSnapshot();
  });
});
```

> 重要:
> - `buildRc` は Game.test.tsx の既存 fixture（createTestMap/createPlayer 等）を流用済み（上記）。
> - canvas サイズ計算は `canvasWrapperRef` 未指定（null）の場合 `window.innerWidth`（jsdom 既定 1024）へ
>   フォールバックするため、ラッパー無しでも決定的。renderGameFrame が `canvasWrapperRef` を必須とする実装に
>   なっているなら、`clientWidth`/`clientHeight` を固定したダミーを rc に追加して決定化する。
> - 「敵がいる状態」の敵生成は Game.test や enemy.test の実 fixture（`createEnemy`/`createPatrolEnemy` 等）に
>   合わせて正確に書くこと。記録 SpriteRenderer 経由で敵スプライト呼び出しも records に乗る。

- [ ] **Step 3: 実行して baseline スナップショット生成**

Run: `npx jest renderGameFrame.characterization 2>&1 | tail -12`
Expected: PASS（`snapshots written`）。非決定的な records が混じってテストが不安定な場合は、原因の op
（例: ランダム由来の translate）を特定し、決定的な入力に調整するか該当 op を sanitize で丸める。

- [ ] **Step 4: コミット**

```bash
git add src/features/ipne/presentation/screens/render/__mockCtx.ts \
        src/features/ipne/presentation/screens/render/renderGameFrame.characterization.test.ts \
        src/features/ipne/presentation/screens/render/__snapshots__/renderGameFrame.characterization.test.ts.snap
git commit -m "test: IPNE 描画コマンド列の特性化テストを追加（Phase D-1 一時安全網）

- モック ctx で renderGameFrame の描画コマンド列を baseline 固定
- 通常/敵あり/デバッグ有効の3状態。層分割の前後で差分ゼロを保証（完了後削除）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4〜8: `renderGameFrame` を5層へ分割

各タスク共通の進め方:
1. `renderGameFrame` のセットアップ部で `FrameContext`（rc＋計算済みローカル）を組み立てる
   （初回 Task 4 で `frame` オブジェクトを作る。以降の層も同じ `frame` を受け取る）。
2. 対象の描画ブロックを `render/<層>.ts` の `export function <層>(frame: FrameContext): void` へ**逐語移植**し、
   `renderGameFrame` からは同じ位置で `<層>(frame)` を呼ぶだけにする。
3. 各タスク後に**特性化スナップショット差分ゼロ**＋`Game.test.tsx` 緑＋typecheck/lint を確認。

> ブロックの移植では、参照しているローカル（`spriteScale`/`toScreenPosition`/`playerScreen` 等）が
> `FrameContext` 経由で渡るようにする。`renderGameFrame` 側は `const frame: FrameContext = { ...rc, viewport, tileSize, offsetX, offsetY, useFullMap, drawWidth, drawHeight, spriteScale, stageFloor, stageWall, startPos, path, playerScreen, toScreenPosition };` を組んでから各層に渡す。

### Task 4: `drawWorld.ts`（背景＋シェイク適用＋マップ＋パス＋罠＋壁＋アイテム）
- Create: `render/drawWorld.ts`、Modify: `render/renderGameFrame.ts`
- [ ] Step 1: `renderGameFrame` 内に `frame: FrameContext` 構築を追加（共有ローカルを集約）。
- [ ] Step 2: 背景クリア〜アイテム描画のブロックを `drawWorld(frame)` へ逐語移植し、その位置で呼ぶ。
- [ ] Step 3: `npx jest renderGameFrame.characterization Game 2>&1 | tail -8`（差分ゼロ・緑）
- [ ] Step 4: `npm run typecheck`（エラーなし）
- [ ] Step 5: コミット `refactor: IPNE 描画のワールド層を drawWorld へ分離`

### Task 5: `drawEnemies.ts`（敵＋撃破アニメ＋ボスHPオーラ＋HPバー＋攻撃スラッシュ）
- Create: `render/drawEnemies.ts`、Modify: `render/renderGameFrame.ts`
- [ ] Step 1: 敵描画〜攻撃スラッシュのブロックを `drawEnemies(frame)` へ逐語移植し、その位置で呼ぶ。
- [ ] Step 2〜4: 特性化差分ゼロ・Game 緑・typecheck（上と同じコマンド）
- [ ] Step 5: コミット `refactor: IPNE 描画の敵層を drawEnemies へ分離`

### Task 6: `combatEffects.ts`（攻撃/被弾トリガー＋シェイク＋外部キュー＋エフェクト更新描画＋floating text）
- Create: `render/combatEffects.ts`、Modify: `render/renderGameFrame.ts`
- [ ] Step 1: 「パーティクルエフェクトシステム」節を `combatEffects(frame)` へ逐語移植し、**敵とプレイヤーの間の位置**で呼ぶ。この層は `effectManagerRef`/`lastAttackEffectKeyRef`/`lastDamageAtRef`/`effectQueueRef`/`floatingTextManagerRef` を**変更**するため、副作用を取りこぼさないこと。
- [ ] Step 2〜4: 特性化差分ゼロ・Game 緑・typecheck
- [ ] Step 5: コミット `refactor: IPNE 描画の戦闘エフェクト処理を combatEffects へ分離`

### Task 7: `drawPlayer.ts`（プレイヤー＋オーラ＋シールド＋残像＋武器光跡＋衝撃波＋回転/回復パーティクル）
- Create: `render/drawPlayer.ts`、Modify: `render/renderGameFrame.ts`
- [ ] Step 1: プレイヤー描画ブロックを `drawPlayer(frame)` へ逐語移植し、その位置で呼ぶ。`afterImageManagerRef`/`playerAttackUntilRef`/`playerDamageUntilRef`/`deathEffectRef` の参照・変更を保つ。
- [ ] Step 2〜4: 特性化差分ゼロ・Game 緑・typecheck
- [ ] Step 5: コミット `refactor: IPNE 描画のプレイヤー層を drawPlayer へ分離`

### Task 8: `drawOverlays.ts`（低HP警告＋コンボ＋ボスWARNING＋シェイク復元＋暗転＋自動マップ＋デバッグ）
- Create: `render/drawOverlays.ts`、Modify: `render/renderGameFrame.ts`
- [ ] Step 1: 残りのオーバーレイ群を `drawOverlays(frame)` へ逐語移植し、その位置で呼ぶ。`bossWarningRef`/`stageStartTimeRef`/`dyingStartTimeRef` の参照・変更とシェイク `ctx.restore()` の位置を保つ。
- [ ] Step 2: この時点で `renderGameFrame` はセットアップ＋`drawWorld→drawEnemies→combatEffects→drawPlayer→drawOverlays` の呼び出しのみになっているはず。
- [ ] Step 3〜4: 特性化差分ゼロ・Game 緑・typecheck
- [ ] Step 5: コミット `refactor: IPNE 描画のオーバーレイ層を drawOverlays へ分離`

---

## Task 9: `useGameRender` フックへ移設し Game.tsx を薄くする

**Files:**
- Create: `src/features/ipne/presentation/screens/useGameRender.ts`
- Modify: `src/features/ipne/presentation/screens/Game.tsx`

- [ ] **Step 1: `useGameRender.ts` を作成**

Game.tsx の描画 `useEffect`（canvas/ctx ガード＋rc 構築＋`renderGameFrame(rc)` 呼び出し）と、その
依存配列を `useGameRender(params)` へ移す。`params` は effect が参照する props・refs・`renderTime` を含む。

```typescript
// useGameRender.ts（骨子）
import { useEffect } from 'react';
import { renderGameFrame } from './render/renderGameFrame';
import type { RenderContext } from './render/renderContext';

export interface UseGameRenderParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasWrapperRef: React.RefObject<HTMLDivElement | null>;
  renderTime: number;
  // 元 effect が参照する props/refs を列挙（RenderContext の生入力相当）
  // ...
}

export function useGameRender(params: UseGameRenderParams): void {
  const { canvasRef, renderTime, /* ... */ } = params;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderGameFrame({ ctx, canvas, now: renderTime, /* ...params... */ } as RenderContext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* 元と同一の依存配列 */]);
}
```

- [ ] **Step 2: Game.tsx の effect を `useGameRender(...)` 呼び出しに置換**

Game.tsx から描画 `useEffect` を削除し、`useGameRender({ canvasRef, canvasWrapperRef, renderTime, ...props, ...refs })` を呼ぶ。依存配列は useGameRender 内で元と同一に保つ。Game.tsx で不要になった import を整理。

- [ ] **Step 3: Game テスト緑＋特性化＋型/lint 確認**

Run: `npx jest Game renderGameFrame.characterization 2>&1 | tail -8`（緑・差分ゼロ）
Run: `npm run typecheck 2>&1 | tail -3`（エラーなし）
Run: `npx eslint src/features/ipne/presentation/screens/ 2>&1 | tail -10`（エラーなし）

- [ ] **Step 4: コミット**

```bash
git add src/features/ipne/presentation/screens/useGameRender.ts \
        src/features/ipne/presentation/screens/Game.tsx
git commit -m "refactor: IPNE 描画を useGameRender フックへ移設し Game.tsx を薄く

- 描画 useEffect を useGameRender へ移し Game.tsx は呼び出し中心に
- 依存配列・公開 props は不変

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: 一時特性化テストを削除し最終検証

**Files:**
- Delete: `render/renderGameFrame.characterization.test.ts`, `render/__mockCtx.ts`, `render/__snapshots__/renderGameFrame.characterization.test.ts.snap`

- [ ] **Step 1: 一時テスト一式を削除**

```bash
git rm src/features/ipne/presentation/screens/render/renderGameFrame.characterization.test.ts \
       src/features/ipne/presentation/screens/render/__mockCtx.ts \
       src/features/ipne/presentation/screens/render/__snapshots__/renderGameFrame.characterization.test.ts.snap
```

- [ ] **Step 2: Game.tsx の行数が大幅減したことを確認**

Run: `wc -l src/features/ipne/presentation/screens/Game.tsx`
Expected: 990行から大幅に減少（描画ロジックが render/ + useGameRender へ移動）

- [ ] **Step 3: IPNE 全テスト**

Run: `npx jest ipne 2>&1 | tail -8`
Expected: PASS

- [ ] **Step 4: 型チェック**

Run: `npm run typecheck 2>&1 | tail -3`
Expected: エラーなし

- [ ] **Step 5: lint（警告ゼロ強制）**

Run: `npm run lint:ci 2>&1 | tail -10`
Expected: エラー・警告なし（exit 0）

- [ ] **Step 6: コミット**

```bash
git add -A src/features/ipne/presentation/screens/
git commit -m "test: IPNE 描画特性化テストを削除（Phase D-1 完了）

- 描画コマンド列の不変を全分割で確認済み。一時安全網の役目を終え削除
- Phase D-1（Game.tsx 描画ロジック抽出）完了

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 完了の定義（Definition of Done）

- [ ] 描画ロジックが `useGameRender` ＋ `render/` の5モジュール（drawWorld/drawEnemies/combatEffects/drawPlayer/drawOverlays）＋`renderGameFrame` オーケストレーターへ抽出されている
- [ ] `Game.tsx` が `useGameRender(...)` 呼び出し中心の薄いコンポーネントになっている（990行→大幅減）
- [ ] 描画順序・ctx コマンド列が抽出前後で一致（特性化で全分割を検証済み）
- [ ] combatEffects の呼び出し位置（敵とプレイヤーの間）と副作用が保たれている
- [ ] `GameScreen` の公開 props・依存配列が不変、兄弟コンポーネント無変更、refs 構造化（D-2）未着手
- [ ] 一時特性化テストが削除されている（負債ゼロ）
- [ ] `npx jest ipne` / `npm run typecheck` / `npm run lint:ci` 全パス

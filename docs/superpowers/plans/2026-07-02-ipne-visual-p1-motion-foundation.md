# IPNE Phase 1「動きの基盤」実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** IPNE の移動・カメラをピクセル補間で滑らかにし、ヒットストップと方向性シェイクで打撃感を底上げする（スペック: `docs/superpowers/specs/2026-07-02-ipne-visual-motion-brushup-design.md` の Phase 1）。

**Architecture:** すべて `src/features/ipne/presentation/` 層で完結させる。ドメインのタイル座標・移動ロジックは不変。描画時に「視覚位置トラッカー」が論理位置を補間し、カメラは補間位置を浮動小数で追従する。ヒットストップは描画用タイムスタンプ（`now`）の凍結で実現し、ゲームループ・入力には触れない。前提として描画を rAF ループ化する（現状は 100ms インターバル駆動 ≒ 10fps で、補間しても滑らかに見えないため）。

**Tech Stack:** React 19 + Canvas 2D + Jest 30（テストは対象と同じディレクトリに `*.test.ts`）。

## Global Constraints

- ブランチ: `feature/ipne-visual-p1`（作成済み・origin/main 起点）
- `domain/` / `application/` のファイルは変更禁止（`presentation/` のみ）
- `any` 型禁止（`unknown` + 型ガード）。コメントは日本語
- 純粋関数（補間・シェイク・ヒットストップ）は TDD（Red→Green→Refactor）、カバレッジ 90%+ 目標
- 各タスク完了時にコミット（Conventional Commits、日本語メッセージ）
- 最終タスクで `npm run ci`（lint:ci + typecheck + test + build）全パス必須。E2E は CI 実行（ローカル実行不可）
- ドット絵の質感維持: `imageSmoothingEnabled=false` を崩さない。スクリーン座標は整数に丸める

## 既存コードの前提知識（全タスク共通）

- 描画エントリ: `useGameRender.ts` → `renderGameFrame.ts` → `drawWorld` → `drawEnemies` → `combatEffects` → `drawPlayer` → `drawOverlays`
- `RenderContext` / `FrameContext` 型: `presentation/screens/render/renderContext.ts`。ref 群は `Game.tsx`（127-138行付近）で `useRef` 生成
- 論理座標はタイル整数。`calculateViewport`（`presentation/services/viewportService.ts`）が整数タイルのビューポートを返す。表示タイル数は 15×11 固定
- プレイヤー移動間隔は 140ms（`domain/config/gameBalance.ts` の `baseMoveIntervalMs`。参照のみ、変更しない）
- `EffectManager`（`presentation/effects/effectManager.ts`）が SCREEN_SHAKE を含む全エフェクトを管理。`getShakeOffset()` は現在 `Math.random()` ベース
- `Enemy` 型は `id: string` を持つ（`domain/types/enemy.ts:37`）

---

### Task 1: 視覚位置トラッカー（visualPosition.ts）

**Files:**
- Create: `src/features/ipne/presentation/screens/render/visualPosition.ts`
- Test: `src/features/ipne/presentation/screens/render/visualPosition.test.ts`

**Interfaces:**
- Consumes: `Position`（`{x, y}`、`../../../index` からの型 import）
- Produces: `VisualPositionTracker` クラス（`resolve(id: string, logical: Position, now: number): Position` / `prune(activeIds: ReadonlySet<string>): void` / `clear(): void`）、定数 `MOVE_TWEEN_MS = 120`、`SNAP_DISTANCE_TILES = 1.5`、関数 `easeOutQuad(t: number): number`。Task 3 が使用する

- [ ] **Step 1: 失敗するテストを書く**

```typescript
/**
 * 視覚位置トラッカーのテスト
 */
import {
  VisualPositionTracker,
  MOVE_TWEEN_MS,
  SNAP_DISTANCE_TILES,
  easeOutQuad,
} from './visualPosition';

describe('easeOutQuad', () => {
  it('0 で 0、1 で 1 を返す', () => {
    expect(easeOutQuad(0)).toBe(0);
    expect(easeOutQuad(1)).toBe(1);
  });

  it('中間点では線形より進んでいる（減速カーブ）', () => {
    expect(easeOutQuad(0.5)).toBeGreaterThan(0.5);
  });

  it('範囲外はクランプする', () => {
    expect(easeOutQuad(-1)).toBe(0);
    expect(easeOutQuad(2)).toBe(1);
  });
});

describe('VisualPositionTracker', () => {
  it('初回登録はスナップ（補間しない）', () => {
    const tracker = new VisualPositionTracker();
    const pos = tracker.resolve('player', { x: 5, y: 3 }, 1000);
    expect(pos).toEqual({ x: 5, y: 3 });
  });

  it('論理位置が1タイル動くと補間途中の位置を返す', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    // 移動発生
    tracker.resolve('player', { x: 6, y: 3 }, 1100);
    // 半分経過時点: 5 と 6 の間（ease-out なので 0.5 より先）
    const mid = tracker.resolve('player', { x: 6, y: 3 }, 1100 + MOVE_TWEEN_MS / 2);
    expect(mid.x).toBeGreaterThan(5.5);
    expect(mid.x).toBeLessThan(6);
    expect(mid.y).toBe(3);
  });

  it('補間時間経過後は目標位置に到達する', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    tracker.resolve('player', { x: 6, y: 3 }, 1100);
    const done = tracker.resolve('player', { x: 6, y: 3 }, 1100 + MOVE_TWEEN_MS);
    expect(done).toEqual({ x: 6, y: 3 });
  });

  it('補間中に次の移動が来たら現在の視覚位置から新目標へ補間する', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    tracker.resolve('player', { x: 6, y: 3 }, 1100);
    // 半分だけ進んだ時点で次の移動
    const halfway = tracker.resolve('player', { x: 6, y: 3 }, 1100 + MOVE_TWEEN_MS / 2);
    tracker.resolve('player', { x: 7, y: 3 }, 1100 + MOVE_TWEEN_MS / 2);
    // 直後の視覚位置は halfway 近傍（巻き戻らない）
    const justAfter = tracker.resolve('player', { x: 7, y: 3 }, 1101 + MOVE_TWEEN_MS / 2);
    expect(justAfter.x).toBeGreaterThanOrEqual(halfway.x);
    expect(justAfter.x).toBeLessThan(7);
  });

  it('SNAP_DISTANCE_TILES を超える跳躍は補間せず即スナップする', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    // テレポート（距離 > 1.5）
    const warped = tracker.resolve('player', { x: 10, y: 8 }, 1100);
    expect(warped).toEqual({ x: 10, y: 8 });
    expect(SNAP_DISTANCE_TILES).toBe(1.5);
  });

  it('エンティティごとに独立して追跡する', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    tracker.resolve('enemy-a', { x: 1, y: 1 }, 1000);
    tracker.resolve('player', { x: 6, y: 3 }, 1100);
    const enemyPos = tracker.resolve('enemy-a', { x: 1, y: 1 }, 1100);
    expect(enemyPos).toEqual({ x: 1, y: 1 });
  });

  it('prune で消えたエンティティのエントリを掃除する', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    tracker.resolve('enemy-a', { x: 1, y: 1 }, 1000);
    tracker.prune(new Set(['player']));
    expect(tracker.size()).toBe(1);
  });

  it('clear で全エントリを破棄する', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    tracker.clear();
    expect(tracker.size()).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ipne/presentation/screens/render/visualPosition.test.ts`
Expected: FAIL（`Cannot find module './visualPosition'`）

- [ ] **Step 3: 最小実装を書く**

```typescript
/**
 * 視覚位置トラッカー（描画位置の補間）
 *
 * ドメインのタイル整数座標は変更せず、描画専用の補間位置を供給する。
 * エンティティ ID ごとに「補間元 → 目標位置・開始時刻」を保持し、
 * ease-out で目標へ収束する。大きな跳躍（テレポート等）は補間せずスナップする。
 */
import type { Position } from '../../../index';

/** 1タイル移動の補間時間（ms）。移動間隔 140ms より短くして追いつき遅れを防ぐ */
export const MOVE_TWEEN_MS = 120;

/** これを超える移動距離（タイル）は補間せずスナップする（テレポート・ステージ遷移対策） */
export const SNAP_DISTANCE_TILES = 1.5;

/**
 * ease-out（二次）。序盤に速く動き終端で減速する。範囲外はクランプ。
 */
export function easeOutQuad(t: number): number {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return k * (2 - k);
}

/** 補間エントリ（補間元・目標・開始時刻） */
interface TweenEntry {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startAt: number;
}

/** エントリの現在の補間位置を計算する */
function interpolate(entry: TweenEntry, now: number): Position {
  const progress = easeOutQuad((now - entry.startAt) / MOVE_TWEEN_MS);
  return {
    x: entry.fromX + (entry.toX - entry.fromX) * progress,
    y: entry.fromY + (entry.toY - entry.fromY) * progress,
  };
}

/**
 * 視覚位置トラッカー
 *
 * 毎フレーム resolve() を呼ぶことで論理位置の変化を検知し、補間位置を返す。
 */
export class VisualPositionTracker {
  private entries = new Map<string, TweenEntry>();

  /**
   * 論理位置を登録しつつ現在の視覚位置を返す。
   * 初回・大跳躍はスナップ、通常移動は現在の視覚位置から新目標へ補間する。
   */
  resolve(id: string, logical: Position, now: number): Position {
    const entry = this.entries.get(id);

    if (!entry) {
      this.entries.set(id, {
        fromX: logical.x, fromY: logical.y,
        toX: logical.x, toY: logical.y,
        startAt: now,
      });
      return { x: logical.x, y: logical.y };
    }

    if (entry.toX !== logical.x || entry.toY !== logical.y) {
      const distance = Math.hypot(logical.x - entry.toX, logical.y - entry.toY);
      const current = interpolate(entry, now);
      const isWarp = distance > SNAP_DISTANCE_TILES;
      entry.fromX = isWarp ? logical.x : current.x;
      entry.fromY = isWarp ? logical.y : current.y;
      entry.toX = logical.x;
      entry.toY = logical.y;
      entry.startAt = now;
    }

    return interpolate(entry, now);
  }

  /** 生存していないエンティティのエントリを削除する（メモリリーク防止） */
  prune(activeIds: ReadonlySet<string>): void {
    for (const id of this.entries.keys()) {
      if (!activeIds.has(id)) this.entries.delete(id);
    }
  }

  /** 全エントリを破棄する（ステージ遷移・リセット用） */
  clear(): void {
    this.entries.clear();
  }

  /** 現在のエントリ数を返す（テスト用） */
  size(): number {
    return this.entries.size;
  }
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ipne/presentation/screens/render/visualPosition.test.ts`
Expected: PASS（9 テスト）

- [ ] **Step 5: コミット**

```bash
git add src/features/ipne/presentation/screens/render/visualPosition.ts src/features/ipne/presentation/screens/render/visualPosition.test.ts
git commit -m "feat(ipne): 視覚位置トラッカー（描画位置補間の純粋モジュール）を追加

- タイル整数座標を描画時に ease-out 補間（120ms）
- 1.5タイル超の跳躍はスナップ（テレポート対策）
- prune/clear でエントリ掃除に対応"
```

---

### Task 2: 浮動小数カメラ原点の計算関数

**Files:**
- Modify: `src/features/ipne/presentation/services/viewportService.ts`（末尾に追加）
- Test: `src/features/ipne/presentation/services/viewportService.test.ts`（存在すれば追記、無ければ新規作成）

**Interfaces:**
- Consumes: `VIEWPORT_CONFIG`（同ファイル既存）、`Position`（`../../types` 既存 import）
- Produces: `calculateCameraOrigin(center: Position, mapWidth: number, mapHeight: number): Position` — 浮動小数タイル座標のビューポート左上。整数タイル位置を渡すと既存 `calculateViewport` の x/y と一致する。Task 3 が使用する

- [ ] **Step 1: 失敗するテストを書く**

テストファイルが既にあるか確認: `ls src/features/ipne/presentation/services/viewportService.test.ts`。無ければ新規作成し、あれば describe を追記する。

```typescript
import { calculateCameraOrigin, calculateViewport, VIEWPORT_CONFIG } from './viewportService';

describe('calculateCameraOrigin', () => {
  const mapW = 40;
  const mapH = 40;

  it('整数タイル位置では calculateViewport の原点と一致する', () => {
    const center = { x: 20, y: 20 };
    const viewport = calculateViewport(center, mapW, mapH, 48);
    const origin = calculateCameraOrigin(center, mapW, mapH);
    expect(origin.x).toBe(viewport.x);
    expect(origin.y).toBe(viewport.y);
  });

  it('小数タイル位置では小数の原点を返す（滑らかな追従）', () => {
    const origin = calculateCameraOrigin({ x: 20.5, y: 20 }, mapW, mapH);
    const originNext = calculateCameraOrigin({ x: 21, y: 20 }, mapW, mapH);
    expect(origin.x).toBeGreaterThan(calculateCameraOrigin({ x: 20, y: 20 }, mapW, mapH).x);
    expect(origin.x).toBeLessThan(originNext.x);
  });

  it('マップ左上端でクランプする', () => {
    const origin = calculateCameraOrigin({ x: 0.5, y: 0.5 }, mapW, mapH);
    expect(origin.x).toBe(0);
    expect(origin.y).toBe(0);
  });

  it('マップ右下端でクランプする', () => {
    const origin = calculateCameraOrigin({ x: 39.5, y: 39.5 }, mapW, mapH);
    expect(origin.x).toBe(mapW - VIEWPORT_CONFIG.tilesX);
    expect(origin.y).toBe(mapH - VIEWPORT_CONFIG.tilesY);
  });

  it('ビューポートよりマップが小さい場合は 0 に固定する', () => {
    const origin = calculateCameraOrigin({ x: 3, y: 3 }, 10, 8);
    expect(origin).toEqual({ x: 0, y: 0 });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ipne/presentation/services/viewportService.test.ts`
Expected: FAIL（`calculateCameraOrigin` が未エクスポート）

- [ ] **Step 3: 実装を追加**

`viewportService.ts` の `calculateViewport` の直後に追加:

```typescript
/**
 * 補間位置（小数タイル座標）を中心とした浮動小数のカメラ原点を計算する
 *
 * calculateViewport の実数版。整数タイル位置を渡すと calculateViewport の
 * x/y と一致する（15/2 の floor=7 と 7.5-0.5 が同値のため）。
 * マップ端のクランプ挙動も calculateViewport と同一。
 *
 * @param center - カメラ中心のタイル座標（補間済み・小数可）
 * @param mapWidth - マップの幅（タイル数）
 * @param mapHeight - マップの高さ（タイル数）
 * @returns ビューポート左上のワールド座標（タイル単位・小数）
 */
export function calculateCameraOrigin(
  center: Position,
  mapWidth: number,
  mapHeight: number
): Position {
  // タイル中心（+0.5）を画面中央に置くための原点
  let x = center.x + 0.5 - VIEWPORT_CONFIG.tilesX / 2;
  let y = center.y + 0.5 - VIEWPORT_CONFIG.tilesY / 2;

  const maxX = Math.max(0, mapWidth - VIEWPORT_CONFIG.tilesX);
  const maxY = Math.max(0, mapHeight - VIEWPORT_CONFIG.tilesY);

  x = Math.max(0, Math.min(x, maxX));
  y = Math.max(0, Math.min(y, maxY));

  return { x, y };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ipne/presentation/services/viewportService.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ipne/presentation/services/viewportService.ts src/features/ipne/presentation/services/viewportService.test.ts
git commit -m "feat(ipne): 浮動小数カメラ原点の計算関数を追加

- calculateViewport の実数版（整数入力では既存と同値）
- 補間位置ベースの滑らかなカメラ追従の土台"
```

---

### Task 3: rAF 描画ループ化と補間・カメラの組み込み

**Files:**
- Modify: `src/features/ipne/presentation/screens/useGameRender.ts`
- Modify: `src/features/ipne/presentation/screens/render/renderContext.ts`
- Modify: `src/features/ipne/presentation/screens/render/renderGameFrame.ts`
- Modify: `src/features/ipne/presentation/screens/render/drawWorld.ts`（タイル描画座標）
- Modify: `src/features/ipne/presentation/screens/render/drawEnemies.ts`（敵の補間位置）
- Modify: `src/features/ipne/presentation/screens/Game.tsx`（ref 追加・受け渡し）

**Interfaces:**
- Consumes: Task 1 の `VisualPositionTracker`、Task 2 の `calculateCameraOrigin`
- Produces: `RenderContext` に `visualPositionsRef: React.MutableRefObject<VisualPositionTracker>` を追加。`FrameContext` に `cameraOrigin: Position` を追加。`toScreenPosition` は小数 Position を受け付け整数 px を返す。Task 4 がこの構造を前提とする

**背景**: 現在 `renderTime` は `Game.tsx:196-201` の 100ms setInterval で供給され、描画は実質 10fps。補間を滑らかに見せるため useGameRender に rAF ループを追加する（既存の「param 変化時に描画する useEffect」は残し、テスト互換性を保つ）。

- [ ] **Step 1: useGameRender に rAF ループを追加**

`useGameRender.ts` の `useGameRender` 関数を以下に置き換える:

```typescript
export function useGameRender(params: UseGameRenderParams): void {
  const { canvasRef, renderTime, ...rest } = params;
  // rAF ループから最新 params を参照するための ref（クロージャ固定を回避）
  const paramsRef = React.useRef(params);
  paramsRef.current = params;

  // 依存配列用に reactive 値を明示分割代入（可読性のため）
  const {
    map, player, enemies, items, traps, walls, mapState, goalPos, debugState,
    attackEffect, lastDamageAt, effectQueueRef, floatingTextManagerRef, comboStateRef,
    spriteRenderer, isDying,
  } = params;

  // 状態変化時の即時描画（既存挙動・テスト互換を維持）
  // now は rAF ループと同じ Date.now() を使う（renderTime は最大100ms古く、
  // 交互に描画すると補間タイムスタンプが非単調になり視覚位置が巻き戻るため）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderGameFrame({ ...rest, ctx, canvas, now: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    map, player, enemies, items, traps, walls, mapState, goalPos, debugState, renderTime,
    attackEffect, lastDamageAt, effectQueueRef, floatingTextManagerRef, comboStateRef,
    spriteRenderer, isDying,
  ]);

  // 連続描画ループ（補間・カメラ追従を滑らかに見せるため 60fps で描画）
  useEffect(() => {
    let rafId = 0;
    const renderLoop = () => {
      const { canvasRef: ref, renderTime: _rt, ...rc } = paramsRef.current;
      const canvas = ref.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        renderGameFrame({ ...rc, ctx, canvas, now: Date.now() });
      }
      rafId = requestAnimationFrame(renderLoop);
    };
    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  }, []);
}
```

注意: `import React, { useEffect } from 'react';` は既存のまま使える。

- [ ] **Step 2: RenderContext / FrameContext に型を追加**

`renderContext.ts`:
- import に追加: `import type { VisualPositionTracker } from './visualPosition';`
- `RenderContext` の ref 群（`effectManagerRef` の近く）に追加:

```typescript
  /** 視覚位置トラッカー ref（描画位置補間用） */
  visualPositionsRef: React.MutableRefObject<VisualPositionTracker>;
```

- `FrameContext` に追加:

```typescript
  /** 浮動小数カメラ原点（タイル単位。全体マップ表示時は {x:0, y:0}） */
  cameraOrigin: Position;
```

- [ ] **Step 3: renderGameFrame に補間とカメラを組み込む**

`renderGameFrame.ts` を変更する。

import に追加:

```typescript
import { calculateCameraOrigin } from '../../services/viewportService';
```

（`calculateViewport` 等は `'../../../index'` から import 済み。`calculateCameraOrigin` も `index.ts` 経由でエクスポートされていればそちらを使う。エクスポートされていない場合は上記の直接 import とし、`index.ts` への追記はしない）

`rc` の分割代入に `enemies` と `visualPositionsRef` を追加し、ビューポート計算ブロック（`if (useFullMap) {...} else {...}`）の**後**に以下を挿入:

```typescript
  // 視覚位置の解決（論理タイル座標 → 補間座標）とエントリ掃除
  const tracker = visualPositionsRef.current;
  const activeIds = new Set<string>(['player']);
  for (const enemy of enemies) activeIds.add(`enemy-${enemy.id}`);
  tracker.prune(activeIds);
  const playerVisual = tracker.resolve('player', player, rc.now);
```

`else` 分岐（通常ビューポート）を以下に変更（カメラを補間位置基準にする）:

```typescript
  } else {
    // 通常のビューポート表示（動的 tileSize を使用）
    viewport = calculateViewport(player, mapWidth, mapHeight, dynamicTileSize);
    tileSize = viewport.tileSize;
    const canvasSize = getCanvasSize(tileSize);
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
  }
```

は既存のまま維持し、`playerVisual` 解決の後にカメラ原点を計算:

```typescript
  // カメラ原点（通常時は補間位置追従、全体マップ時は原点固定）
  const cameraOrigin: Position = useFullMap
    ? { x: 0, y: 0 }
    : calculateCameraOrigin(playerVisual, mapWidth, mapHeight);

  // カメラの小数部で右端・下端に隙間ができないよう、描画タイルを1つ広げる
  const drawWidth = useFullMap ? mapWidth : viewport.width + 1;
  const drawHeight = useFullMap ? mapHeight : viewport.height + 1;
```

※ 既存の `const drawWidth = useFullMap ? mapWidth : viewport.width;` 行はこの形に置き換える。
※ ビューポートの整数原点はタイルループの起点に使うため、`viewport.x = Math.floor(cameraOrigin.x); viewport.y = Math.floor(cameraOrigin.y);` を `cameraOrigin` 計算直後に代入する（通常時のみ。`calculateViewport` の返り値を書き換える）。

`toScreenPosition` を以下に置き換える（両モード統一・整数 px 化）:

```typescript
  const toScreenPosition = (pos: Position): Position => ({
    x: Math.round(offsetX + (pos.x - cameraOrigin.x) * tileSize + tileSize / 2),
    y: Math.round(offsetY + (pos.y - cameraOrigin.y) * tileSize + tileSize / 2),
  });
```

（全体マップ時は `cameraOrigin = {x:0, y:0}` なので既存式 `offsetX + pos.x * tileSize + tileSize/2` と同値、通常時は既存式の `viewport.x` が `cameraOrigin.x` に変わっただけ）

`playerScreen` を補間位置で計算:

```typescript
  const playerScreen = toScreenPosition(playerVisual);
```

`FrameContext` 構築に `cameraOrigin` を追加:

```typescript
  const frame: FrameContext = {
    ...rc,
    viewport, tileSize, offsetX, offsetY, useFullMap, drawWidth, drawHeight,
    spriteScale, stageFloor, stageWall, startPos, path, playerScreen, toScreenPosition,
    cameraOrigin,
  };
```

- [ ] **Step 4: drawWorld のタイル座標をカメラ原点基準にする**

`drawWorld.ts` の分割代入に `cameraOrigin` を追加し、タイルループ内の座標計算を変更:

```typescript
      const tile = map[worldY][worldX];
      const tileDrawX = Math.round(offsetX + (worldX - cameraOrigin.x) * tileSize);
      const tileDrawY = Math.round(offsetY + (worldY - cameraOrigin.y) * tileSize);
```

（既存は `offsetX + vx * tileSize`。`worldX = viewport.x + vx` なので通常時は小数部シフトが加わるだけ、全体マップ時は同値）

デバッグパス描画（109-130行）の `screenX`/`screenY` も同じ式に統一:

```typescript
      const screenX = offsetX + (p.x - cameraOrigin.x) * tileSize + tileSize / 2;
      const screenY = offsetY + (p.y - cameraOrigin.y) * tileSize + tileSize / 2;
```

- [ ] **Step 5: drawEnemies を補間位置にする**

`drawEnemies.ts` の分割代入に `visualPositionsRef` を追加し、敵ループ先頭の `enemyScreen` 計算を変更:

```typescript
    const enemyVisual = visualPositionsRef.current.resolve(`enemy-${enemy.id}`, enemy, now);
    const enemyScreen = toScreenPosition(enemyVisual);
```

（ビューポート外カリング判定は論理座標 `enemy.x/enemy.y` のまま。±1 タイルの余裕があるため補間位置とのずれは吸収される）

- [ ] **Step 6: Game.tsx で tracker ref を生成して渡す**

`Game.tsx` のエフェクトシステム ref 群（133行付近）に追加:

```typescript
  const visualPositionsRef = useRef(new VisualPositionTracker());
```

import を追加（既存の presentation 系 import に合わせる。`./render/visualPosition` からの相対 import）:

```typescript
import { VisualPositionTracker } from './render/visualPosition';
```

`useGameRender({...})` 呼び出し（204行付近）のオブジェクトに `visualPositionsRef,` を追加する。

- [ ] **Step 7: typecheck と既存テストで回帰確認**

Run: `npm run typecheck && npm test -- src/features/ipne`
Expected: PASS（`renderContext` の必須フィールド追加でテストが型エラーになる場合は、該当テストのモック構築に `visualPositionsRef: { current: new VisualPositionTracker() }` を追加して修正する）

- [ ] **Step 8: コミット**

```bash
git add -A src/features/ipne
git commit -m "feat(ipne): 描画位置補間と滑らかなカメラ追従を実装

- useGameRender に rAF 連続描画ループを追加（従来は 100ms 間隔）
- プレイヤー・敵の描画位置を 120ms ease-out で補間
- カメラは補間位置を浮動小数で追従（タイル境界のスナップを解消）
- ドメインのタイル座標ロジックは不変（描画層のみの変更）"
```

---

### Task 4: ヒットストップ（描画時間の凍結）

**Files:**
- Create: `src/features/ipne/presentation/effects/hitStop.ts`
- Test: `src/features/ipne/presentation/effects/hitStop.test.ts`
- Modify: `src/features/ipne/presentation/effects/effectManager.ts`（`updateAt` 追加）
- Modify: `src/features/ipne/presentation/screens/render/renderContext.ts`
- Modify: `src/features/ipne/presentation/screens/render/renderGameFrame.ts`
- Modify: `src/features/ipne/presentation/screens/render/combatEffects.ts`
- Modify: `src/features/ipne/presentation/screens/Game.tsx`

**Interfaces:**
- Consumes: Task 3 の FrameContext 構造
- Produces: `HitStopManager` クラス（`trigger(now: number, durationMs: number): void` / `isFrozen(now: number): boolean` / `resolveVisualNow(now: number): number` / `clear(): void`）、定数 `HIT_STOP_DURATIONS = { attackHit: 70, playerDamage: 70, bossKill: 150 }`。`RenderContext` に `hitStopRef`、`FrameContext` に `realNow: number` を追加。`EffectManager` に `updateAt(now: number): void` を追加

- [ ] **Step 1: 失敗するテストを書く（hitStop.test.ts）**

```typescript
/**
 * ヒットストップマネージャーのテスト
 */
import { HitStopManager, HIT_STOP_DURATIONS } from './hitStop';

describe('HitStopManager', () => {
  it('トリガー前は now をそのまま返す', () => {
    const hs = new HitStopManager();
    expect(hs.resolveVisualNow(1000)).toBe(1000);
    expect(hs.isFrozen(1000)).toBe(false);
  });

  it('トリガー後の凍結中は凍結開始時刻を返す', () => {
    const hs = new HitStopManager();
    hs.trigger(1000, 70);
    expect(hs.isFrozen(1050)).toBe(true);
    expect(hs.resolveVisualNow(1050)).toBe(1000);
  });

  it('凍結終了後は now をそのまま返す', () => {
    const hs = new HitStopManager();
    hs.trigger(1000, 70);
    expect(hs.isFrozen(1070)).toBe(false);
    expect(hs.resolveVisualNow(1071)).toBe(1071);
  });

  it('凍結中の再トリガーは終了時刻を延長する（開始時刻は維持）', () => {
    const hs = new HitStopManager();
    hs.trigger(1000, 70);
    hs.trigger(1050, 70); // 1120 まで延長
    expect(hs.isFrozen(1100)).toBe(true);
    expect(hs.resolveVisualNow(1100)).toBe(1000);
    expect(hs.isFrozen(1120)).toBe(false);
  });

  it('短い再トリガーで終了時刻は縮まない', () => {
    const hs = new HitStopManager();
    hs.trigger(1000, 150);
    hs.trigger(1010, 10);
    expect(hs.isFrozen(1100)).toBe(true);
  });

  it('clear で凍結を解除する', () => {
    const hs = new HitStopManager();
    hs.trigger(1000, 150);
    hs.clear();
    expect(hs.isFrozen(1050)).toBe(false);
  });

  it('持続時間定数が仕様どおり', () => {
    expect(HIT_STOP_DURATIONS.attackHit).toBe(70);
    expect(HIT_STOP_DURATIONS.playerDamage).toBe(70);
    expect(HIT_STOP_DURATIONS.bossKill).toBe(150);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ipne/presentation/effects/hitStop.test.ts`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: HitStopManager を実装**

```typescript
/**
 * ヒットストップ（打撃の重み演出）
 *
 * 描画用タイムスタンプを短時間凍結して「時が止まる」打撃感を作る。
 * ゲームループ・入力・ドメイン更新には一切影響しない（描画層専用）。
 * 凍結は非累積方式: 凍結中は開始時刻を返し、終了後は実時刻へ復帰する
 * （実時刻ベースの各種 until 比較と整合させるため、時間オフセットは持たない）。
 */

/** ヒットストップの持続時間（ms） */
export const HIT_STOP_DURATIONS = {
  /** プレイヤー攻撃ヒット時 */
  attackHit: 70,
  /** プレイヤー被弾時 */
  playerDamage: 70,
  /** ボス撃破時 */
  bossKill: 150,
} as const;

/**
 * ヒットストップマネージャー
 */
export class HitStopManager {
  private freezeStart = 0;
  private freezeUntil = 0;

  /** 凍結を開始する。凍結中の再トリガーは終了時刻の延長のみ行う */
  trigger(now: number, durationMs: number): void {
    if (now >= this.freezeUntil) {
      this.freezeStart = now;
    }
    this.freezeUntil = Math.max(this.freezeUntil, now + durationMs);
  }

  /** 凍結中か否か */
  isFrozen(now: number): boolean {
    return now < this.freezeUntil;
  }

  /** 描画に使うタイムスタンプを返す（凍結中は凍結開始時刻で固定） */
  resolveVisualNow(now: number): number {
    return this.isFrozen(now) ? this.freezeStart : now;
  }

  /** 凍結を解除する（ステージ遷移・リセット用） */
  clear(): void {
    this.freezeStart = 0;
    this.freezeUntil = 0;
  }
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ipne/presentation/effects/hitStop.test.ts`
Expected: PASS

- [ ] **Step 5: EffectManager に updateAt を追加（TDD）**

まず `effectManager.test.ts` に追記:

```typescript
describe('updateAt', () => {
  it('前回時刻からの実経過秒で更新する', () => {
    const em = new EffectManager();
    em.addEffect(EffectType.DAMAGE, 100, 100, 1000);
    em.updateAt(1000); // 初回はデルタ0
    em.updateAt(1050); // 50ms 経過
    // 例外なく生存していること（DAMAGE duration=400ms）
    expect(em.getEffectCount()).toBe(1);
  });

  it('now が進まない場合（凍結中）はデルタ0で更新する', () => {
    const em = new EffectManager();
    em.addEffect(EffectType.DAMAGE, 100, 100, 1000);
    em.updateAt(1050);
    const before = em.getEffects()[0].particles.map((p) => ({ x: p.x, y: p.y }));
    em.updateAt(1050); // 同時刻 → パーティクルは動かない
    const after = em.getEffects()[0].particles.map((p) => ({ x: p.x, y: p.y }));
    expect(after).toEqual(before);
  });
});
```

Run: `npm test -- src/features/ipne/presentation/effects/effectManager.test.ts`
Expected: FAIL（`updateAt` 未定義）

`effectManager.ts` の `update()` の直前にフィールドとメソッドを追加:

```typescript
  private lastUpdateAt?: number;

  /**
   * タイムスタンプから実経過時間を算出して更新する
   *
   * rAF 駆動（可変フレームレート）用。凍結された now が渡された場合は
   * デルタ 0 となり、パーティクル等が自然に静止する（ヒットストップ対応）。
   */
  updateAt(now: number): void {
    const deltaSec = this.lastUpdateAt === undefined
      ? 0
      : Math.min(0.1, Math.max(0, (now - this.lastUpdateAt) / 1000));
    this.lastUpdateAt = now;
    this.update(deltaSec, now);
  }
```

Run: `npm test -- src/features/ipne/presentation/effects/effectManager.test.ts`
Expected: PASS

- [ ] **Step 6: renderContext / renderGameFrame / Game.tsx への組み込み**

`renderContext.ts`:
- import 追加: `import type { HitStopManager } from '../../effects/hitStop';`
- `RenderContext` に追加:

```typescript
  /** ヒットストップマネージャー ref */
  hitStopRef: React.MutableRefObject<HitStopManager>;
```

- `FrameContext` に追加:

```typescript
  /** 凍結を適用しない実タイムスタンプ（トリガー検知用） */
  realNow: number;
```

`renderGameFrame.ts`: 関数冒頭（空マップガードの直後）に凍結解決を追加し、`frame` 構築で `now` を差し替える:

```typescript
  // ヒットストップ: 描画用タイムスタンプを解決（凍結中は時が止まる）
  const realNow = rc.now;
  const visualNow = rc.hitStopRef.current.resolveVisualNow(realNow);
```

以降の描画・補間はすべて凍結時刻で動くよう、`frame` を以下のように構築する:

```typescript
  const frame: FrameContext = {
    ...rc,
    now: visualNow,
    realNow,
    viewport, tileSize, offsetX, offsetY, useFullMap, drawWidth, drawHeight,
    spriteScale, stageFloor, stageWall, startPos, path, playerScreen, toScreenPosition,
    cameraOrigin,
  };
```

※ Task 3 で追加した `tracker.resolve(...)` の引数も `rc.now` から `visualNow` に変更する（補間も凍結対象）。`visualNow` の算出はビューポート計算より前に移動してよい。

`Game.tsx`:

```typescript
  const hitStopRef = useRef(new HitStopManager());
```

import: `import { HitStopManager } from '../effects/hitStop';`（`Game.tsx` から effects への既存 import パスに合わせる。`EffectManager` の import と同じ形式にする）
`useGameRender({...})` に `hitStopRef,` を追加。

- [ ] **Step 7: combatEffects でトリガーと updateAt 化**

`combatEffects.ts` を変更。分割代入に `realNow` と `hitStopRef` を追加し、import に `HIT_STOP_DURATIONS` と `EffectType` 系を追加:

```typescript
import { EffectType, calculatePowerLevel } from '../../effects';
import { HIT_STOP_DURATIONS } from '../../effects/hitStop';
```

変更点（該当行のみ）:

```typescript
  // 攻撃ヒットエフェクトのトリガー（パワーレベルスケーリング）
  if (attackEffect && realNow < attackEffect.until) {
    const key = `${attackEffect.position.x}-${attackEffect.position.y}-${attackEffect.until}`;
    if (lastAttackEffectKeyRef.current !== key) {
      lastAttackEffectKeyRef.current = key;
      playerAttackUntilRef.current = attackEffect.until;
      const screenPos = toScreenPosition(attackEffect.position);
      const powerLevel = calculatePowerLevel(player);
      em.addEffect(EffectType.ATTACK_HIT, screenPos.x, screenPos.y, now, { powerLevel });
      // ヒットストップ（打撃の重み）
      hitStopRef.current.trigger(realNow, HIT_STOP_DURATIONS.attackHit);
    }
  }

  // ダメージエフェクトのトリガー
  if (lastDamageAt > lastDamageAtRef.current) {
    lastDamageAtRef.current = lastDamageAt;
    playerDamageUntilRef.current = realNow + 200; // 被弾フレーム200ms表示
    const screenPos = toScreenPosition(player);
    em.addEffect(EffectType.DAMAGE, screenPos.x, screenPos.y, now);
    // 画面シェイク（Phase 4）
    em.addEffect(EffectType.SCREEN_SHAKE, 0, 0, now, { damage: 4 });
    // ヒットストップ（被弾の衝撃）
    hitStopRef.current.trigger(realNow, HIT_STOP_DURATIONS.playerDamage);
  }
```

外部エフェクトキュー処理ループ内、`em.addEffect(...)` の後に追加:

```typescript
      if (evt.type === EffectType.BOSS_KILL) {
        hitStopRef.current.trigger(realNow, HIT_STOP_DURATIONS.bossKill);
      }
```

エフェクト更新を updateAt 化（固定 0.1 秒デルタを廃止。rAF 化で更新頻度が 100ms→毎フレームに上がったため必須）:

```typescript
  // エフェクト更新・描画（実経過時間ベース。凍結中はデルタ0で静止）
  em.updateAt(now);
  em.draw(ctx, canvas.width, canvas.height);
```

- [ ] **Step 8: 回帰確認とコミット**

Run: `npm run typecheck && npm test -- src/features/ipne`
Expected: PASS（RenderContext を直接構築しているテストがあれば `hitStopRef: { current: new HitStopManager() }` を追加）

```bash
git add -A src/features/ipne
git commit -m "feat(ipne): ヒットストップ（描画時間の凍結）を実装

- 攻撃ヒット70ms・被弾70ms・ボス撃破150msの時間凍結
- 描画層の now 凍結方式でゲームループ・入力には非侵襲
- EffectManager.updateAt で実経過時間ベースの更新に移行（rAF 対応）"
```

---

### Task 5: 方向性シェイク

**Files:**
- Create: `src/features/ipne/presentation/effects/shake.ts`
- Test: `src/features/ipne/presentation/effects/shake.test.ts`
- Modify: `src/features/ipne/presentation/effects/effectTypes.ts`（`shakeDirection` 追加）
- Modify: `src/features/ipne/presentation/effects/effectFactories.ts`（SCREEN_SHAKE ファクトリ）
- Modify: `src/features/ipne/presentation/effects/effectManager.ts`（`getShakeOffset(now)` 化）
- Modify: `src/features/ipne/presentation/screens/render/renderGameFrame.ts`（呼び出し）
- Modify: `src/features/ipne/presentation/screens/render/combatEffects.ts`（攻撃ヒットの方向キック）
- Modify: `src/features/ipne/presentation/sprites/motion.ts`（`DIRECTION_VECTORS` エクスポート）

**Interfaces:**
- Consumes: `GameEffect.shakeIntensity` / `startTime`（既存）、`Direction` 型（`motion.ts`）
- Produces: `computeShakeOffset(intensity: number, elapsedMs: number, direction?: {x: number; y: number}): {x: number; y: number}`（決定論的・純粋関数）。`EffectManager.getShakeOffset(now: number)` にシグネチャ変更。`EffectOptions.shakeDirection?: {x: number; y: number}`。`motion.ts` の `DIRECTION_VECTORS` を export 化

- [ ] **Step 1: 失敗するテストを書く（shake.test.ts）**

```typescript
/**
 * 方向性シェイク計算のテスト
 */
import { computeShakeOffset } from './shake';

describe('computeShakeOffset', () => {
  it('強度0では動かない', () => {
    expect(computeShakeOffset(0, 50)).toEqual({ x: 0, y: 0 });
  });

  it('決定論的（同じ入力で同じ出力）', () => {
    const a = computeShakeOffset(4, 33);
    const b = computeShakeOffset(4, 33);
    expect(a).toEqual(b);
  });

  it('方向なしでも両軸に振動する（経過時間で変化）', () => {
    const t1 = computeShakeOffset(4, 10);
    const t2 = computeShakeOffset(4, 60);
    expect(t1).not.toEqual(t2);
    expect(Math.abs(t1.x)).toBeLessThanOrEqual(4);
    expect(Math.abs(t1.y)).toBeLessThanOrEqual(4);
  });

  it('水平方向指定時は主振動が X 軸に乗る', () => {
    // 複数時点で X 振幅の最大値が Y 振幅の最大値を上回ることを確認
    let maxX = 0;
    let maxY = 0;
    for (let t = 0; t <= 200; t += 10) {
      const o = computeShakeOffset(4, t, { x: 1, y: 0 });
      maxX = Math.max(maxX, Math.abs(o.x));
      maxY = Math.max(maxY, Math.abs(o.y));
    }
    expect(maxX).toBeGreaterThan(maxY);
  });

  it('ゼロベクトル方向は方向なしと同じ挙動にフォールバックする', () => {
    expect(computeShakeOffset(4, 50, { x: 0, y: 0 })).toEqual(computeShakeOffset(4, 50));
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ipne/presentation/effects/shake.test.ts`
Expected: FAIL

- [ ] **Step 3: computeShakeOffset を実装**

```typescript
/**
 * 画面シェイクのオフセット計算（純粋関数）
 *
 * 従来の Math.random() による無方向ジッタを置き換える。
 * 決定論的な正弦合成で「ヒット方向優勢の減衰振動」を作る。
 * 減衰は呼び出し側（EffectManager の shakeIntensity 減衰）が担う。
 */

/** シェイク方向ベクトル */
export interface ShakeDirection {
  x: number;
  y: number;
}

/** 主振動の角速度（rad/ms）。約 140ms 周期 */
const MAIN_ANGULAR_SPEED = 0.045;

/** ジッタ振動の角速度（rad/ms）。主振動と非整合な周期で自然な揺れを作る */
const JITTER_ANGULAR_SPEED = 0.031;

/** ジッタの位相オフセット（X/Y の同期を崩す） */
const JITTER_PHASE = 1.7;

/** 方向指定時の直交ジッタ比率 */
const CROSS_JITTER_RATIO = 0.3;

/**
 * シェイクオフセットを計算する
 *
 * @param intensity - 振幅（px）。0以下は無振動
 * @param elapsedMs - シェイク開始からの経過時間（ms）
 * @param direction - ヒット方向（省略・ゼロベクトル時は無方向振動）
 */
export function computeShakeOffset(
  intensity: number,
  elapsedMs: number,
  direction?: ShakeDirection
): { x: number; y: number } {
  if (intensity <= 0) return { x: 0, y: 0 };

  const main = Math.sin(elapsedMs * MAIN_ANGULAR_SPEED) * intensity;
  const jitter = Math.sin(elapsedMs * JITTER_ANGULAR_SPEED + JITTER_PHASE) * intensity;

  const length = direction ? Math.hypot(direction.x, direction.y) : 0;
  if (!direction || length === 0) {
    // 無方向: 2軸を非整合周期で振動させて擬似ランダムに見せる
    return { x: main, y: jitter };
  }

  // 方向あり: 主振動をヒット方向に、弱いジッタを直交方向に重ねる
  const nx = direction.x / length;
  const ny = direction.y / length;
  const cross = jitter * CROSS_JITTER_RATIO;
  return {
    x: nx * main - ny * cross,
    y: ny * main + nx * cross,
  };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ipne/presentation/effects/shake.test.ts`
Expected: PASS

- [ ] **Step 5: 型とファクトリに shakeDirection を配線**

`effectTypes.ts`:
- `GameEffect` の `shakeDecay?` の後に追加:

```typescript
  /** 画面シェイクの方向（省略時は無方向振動） */
  shakeDirection?: { x: number; y: number };
```

- `EffectOptions` に追加:

```typescript
  /** 画面シェイクの方向（ヒット方向。省略時は無方向） */
  shakeDirection?: { x: number; y: number };
```

`effectFactories.ts` の SCREEN_SHAKE ファクトリ（235行付近）の effect オブジェクトに追加:

```typescript
      shakeDirection: options?.shakeDirection,
```

- [ ] **Step 6: getShakeOffset を決定論化・方向対応**

`effectManager.ts` の import に追加:

```typescript
import { computeShakeOffset } from './shake';
```

`getShakeOffset` を置き換え:

```typescript
  /**
   * 現在の画面シェイクオフセットを取得する
   * シェイク中は {x, y} を返し、シェイク終了後は null を返す
   *
   * @param now - 現在時刻（ms）。凍結された時刻を渡すとシェイクも静止する
   */
  getShakeOffset(now: number): { x: number; y: number } | null {
    for (const effect of this.effects) {
      if (effect.type === EffectType.SCREEN_SHAKE && effect.shakeIntensity && effect.shakeIntensity > 0.1) {
        return computeShakeOffset(
          effect.shakeIntensity,
          now - effect.startTime,
          effect.shakeDirection
        );
      }
    }
    return null;
  }
```

呼び出し側 `renderGameFrame.ts`（133行付近）を変更:

```typescript
  const shakeOffset = effectManagerRef.current.getShakeOffset(visualNow);
```

既存テスト（`effectManager.test.ts` 等）で `getShakeOffset()` を引数なし呼び出ししている箇所があれば `getShakeOffset(Date.now())` 等に更新する（`grep -rn "getShakeOffset" src/features/ipne` で全呼び出しを確認すること）。

- [ ] **Step 7: 攻撃ヒットの方向キックと被弾方向の配線**

`motion.ts` の `DIRECTION_VECTORS`（53行）を export 化:

```typescript
/** 方向ごとの前進単位ベクトル（スクリーン座標、y+ が下） */
export const DIRECTION_VECTORS: Record<Direction, { x: number; y: number }> = {
```

`sprites/index.ts` が motion を再エクスポートしているか確認し、していなければ直接 import する。

`combatEffects.ts` の攻撃ヒットトリガー内（Task 4 で追加した `hitStopRef.current.trigger(...)` の直前）に追加:

```typescript
      // 攻撃方向への小さな画面キック（打撃感）
      em.addEffect(EffectType.SCREEN_SHAKE, 0, 0, now, {
        damage: 2,
        shakeDirection: DIRECTION_VECTORS[player.direction as keyof typeof DIRECTION_VECTORS],
      });
```

import 追加:

```typescript
import { DIRECTION_VECTORS } from '../../sprites/motion';
```

被弾時のシェイク（`{ damage: 4 }`）は攻撃元が特定できないため無方向のまま（決定論的ジッタにフォールバック）。

- [ ] **Step 8: 回帰確認とコミット**

Run: `npm run typecheck && npm test -- src/features/ipne`
Expected: PASS

```bash
git add -A src/features/ipne
git commit -m "feat(ipne): 画面シェイクを方向性の減衰振動に刷新

- Math.random ジッタを決定論的な正弦合成に置き換え
- ヒット方向優勢の主振動＋直交ジッタで被弾方向を体感できるように
- プレイヤー攻撃ヒット時に攻撃方向への小キックを追加"
```

---

### Task 6: 全体検証と PR 作成

**Files:**
- Modify: なし（検証のみ。問題があれば該当タスクの範囲で修正）

**Interfaces:**
- Consumes: Task 1〜5 の全成果物
- Produces: CI 全パスの `feature/ipne-visual-p1` ブランチと PR

- [ ] **Step 1: CI パイプライン全体を実行**

Run: `npm run ci`
Expected: lint:ci（警告ゼロ）→ typecheck → test → build すべて成功

- [ ] **Step 2: 開発サーバーで目視確認（可能なら）**

Run: `npm start` して IPNE をプレイし、以下を確認:
- 移動が滑らか（タイル間をスライド、カメラも追従）
- 攻撃ヒット・被弾時に一瞬「時が止まる」感覚がある
- 被弾シェイクが不自然に見えない、攻撃時に前方への小キックがある
- 全体マップ表示（デバッグ）が崩れていない
- ステージ遷移で位置が飛んでも変な補間アニメが出ない

- [ ] **Step 3: プッシュして PR 作成**

```bash
git push -u origin feature/ipne-visual-p1
gh pr create --title "feat(ipne): 動きの基盤刷新（描画補間・カメラ追従・ヒットストップ・方向性シェイク）" --body "$(cat <<'EOF'
## 概要
IPNE ビジュアル・モーション ブラッシュアップ Phase 1（設計: docs/superpowers/specs/2026-07-02-ipne-visual-motion-brushup-design.md）。
タイルスナップだった移動・カメラをピクセル補間で滑らかにし、ヒットストップと方向性シェイクで打撃感を底上げする。

## 変更内容
- 視覚位置トラッカー（120ms ease-out 補間、1.5タイル超はスナップ）を追加しプレイヤー・敵に適用
- カメラを補間位置ベースの浮動小数追従に変更（描画は rAF 連続ループ化）
- ヒットストップ（攻撃70ms/被弾70ms/ボス撃破150ms、描画時間の凍結方式）を追加
- 画面シェイクを決定論的な方向性減衰振動に刷新、攻撃方向の小キックを追加
- ドメイン層は無変更（presentation 層で完結）

## テスト方法
- [ ] npm run ci（lint/typecheck/test/build）
- [ ] CI 上の E2E パス
- [ ] 手動確認: 移動の滑らかさ・ヒットストップ・シェイク・全体マップ表示・ステージ遷移

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## リスクと注意点（実装者向け）

1. **rAF ループと React の再レンダー**: rAF ループは `paramsRef` 経由で最新 props を読む。ref を介さず closure で捕まえると古い状態を描き続けるバグになる
2. **`em.update(0.1, now)` の固定デルタは廃止必須**: rAF 化で呼び出し頻度が 100ms→16ms になるため、固定 0.1 秒のままだとパーティクルが約6倍速になる（Task 4 Step 7 の `updateAt` が対策）
3. **凍結 now と実時刻の混在**: トリガー検知（`attackEffect.until`・`lastDamageAt` の比較、until 系 ref への書き込み）は `realNow`、描画・補間・エフェクト時間は凍結後の `now`。逆にすると凍結中に多重トリガーや被弾表示の短縮が起きる
4. **`getShakeOffset` のシグネチャ変更**: 全呼び出し箇所を grep で確認してから変更する
5. **RenderContext への必須フィールド追加**: RenderContext/FrameContext を直接組み立てる既存テストがあればモック追加が必要
6. **サブピクセル描画**: `toScreenPosition` とタイル描画座標は `Math.round` で整数化する。浮動小数のまま `drawImage` するとドット絵がにじむ・シマーが出る
7. **タイムスタンプの単調性**: 描画に渡す `now` は両描画パスとも `Date.now()` に統一する。古い `renderTime`（最大100ms遅れ）と混在させると補間・`updateAt` に非単調な時刻が入り、視覚位置の巻き戻りが起きる（`updateAt` のデルタは `Math.max(0, ...)` でガード済みだが根本は now の統一）

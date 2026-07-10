# Labyrinth of Shadows 3D化 Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 疑似3D（レイキャスティング）の Labyrinth of Shadows を、ゲームルールを一切変えずに本物の3D（react-three-fiber, 一人称視点）へ描画層だけ差し替える。

**Architecture:** 既存の Clean Architecture により domain 層（迷路生成・敵AI・経路探索・スコア・衝突判定）と描画が分離済み。ロジック更新ステップを純粋関数 `advanceGame` に抽出し、R3F の `useFrame` から駆動する。2D Canvas レイキャスティング描画（`renderer.ts`）を R3F シーングラフ（`presentation/three/*`）に置換。カメラは `g.player` を毎フレーム反映。壁衝突・敵AI・アイテム取得は既存ロジックが無改修で動く。

**Tech Stack:** React 19 / TypeScript / three 0.185 / @react-three/fiber 9.6 / @react-three/drei 10.7 / Jest 30 / styled-components / Webpack 5

## Global Constraints

- パリティ厳守: 難易度設定（EASY/NORMAL/HARD の size・keys・traps・heals・speeds・maps・time・enemySpeed・敵数・lives）、鍵/罠箱(-12秒)/回復/加速(10秒)/地図(周囲公開) のルール、スコア・コンボ・ライフ・スタミナ・隠れるエネルギー、敵AI・BFS経路探索を**一切変更しない**。
- 変更対象は描画層のみ。`domain/` 配下・`game-logic.ts`・`constants.ts` のロジック値は改変禁止。
- `any` 型禁止（`unknown` + 型ガード）。`var` 禁止。名前付きエクスポート優先。相対 import の `../` は2階層まで。
- コメント・docstring は日本語。ファイル名 kebab-case、コンポーネント PascalCase。
- `domain/` から `infrastructure/`・`presentation/` を参照しない。他 feature を参照しない。
- 追加依存の固定バージョン: `three@0.185.1` / `@react-three/fiber@9.6.1` / `@react-three/drei@10.7.7` / `@types/three@0.185.1`（devDependencies）。
- 座標規約: `maze[y][x] === 0` が通行可、非0が壁。プレイヤー `x`=列, `y`=行, セル1単位。グリッド(x,y) → ワールド(X=x, Y=up, Z=y)。
- WebGL は jsdom で動作しないため、R3F コンポーネントはユニットテスト対象外（`air-hockey` の前例に倣い許容）。ロジック・純粋ヘルパーは TDD。
- 各タスク完了時に該当テストが green であること。最終タスクで `npm run ci` 全通過。

---

## ファイル構成

### 新規作成

| ファイル | 責務 |
|---------|------|
| `src/features/labyrinth-of-shadows/game-tick.ts` | 1フレームのロジック更新を行う純粋関数 `advanceGame`（描画・React 非依存） |
| `src/features/labyrinth-of-shadows/__tests__/game-tick.test.ts` | `advanceGame` のパリティテスト |
| `src/features/labyrinth-of-shadows/presentation/three/geometry.ts` | グリッド→ワールド座標変換・壁セル列挙・カメラヨー計算（純粋関数＋定数） |
| `src/features/labyrinth-of-shadows/presentation/three/__tests__/geometry.test.ts` | `geometry.ts` のユニットテスト |
| `src/features/labyrinth-of-shadows/presentation/three/MazeWalls.tsx` | 迷路の壁を InstancedMesh で描画 |
| `src/features/labyrinth-of-shadows/presentation/three/FloorCeiling.tsx` | 床・天井の平面 |
| `src/features/labyrinth-of-shadows/presentation/three/ItemMeshes.tsx` | 未取得アイテムの発光3Dオブジェクト群 |
| `src/features/labyrinth-of-shadows/presentation/three/EnemyMeshes.tsx` | 敵のタイプ別プロシージャル3Dオブジェクト群 |
| `src/features/labyrinth-of-shadows/presentation/three/GameController.tsx` | `useFrame` でティック実行・カメラ同期・トーチ揺らぎ・HUD/ミニマップ更新 |
| `src/features/labyrinth-of-shadows/presentation/three/LabyrinthScene.tsx` | `<Canvas>` ルート。フォグ・ライト・全シーン要素を組み立て |
| `src/features/labyrinth-of-shadows/presentation/hooks/use-pointer-look.ts` | ポインタロック＋マウス移動量を ref に蓄積 |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `package.json` | 3D依存を追加 |
| `src/features/labyrinth-of-shadows/LabyrinthOfShadowsGame.tsx` | 2D `<Canvas>` を `<LabyrinthScene>` に置換。`useGameLoop` 依存を除去 |
| `src/features/labyrinth-of-shadows/index.ts` | `Renderer` エクスポート削除、`LabyrinthScene` 追加（必要なら） |

### 削除

| ファイル | 理由 |
|---------|------|
| `src/features/labyrinth-of-shadows/renderer.ts` | レイキャスティング描画は不要 |
| `src/features/labyrinth-of-shadows/__tests__/renderer.test.ts` | 上記に伴い削除 |
| `src/features/labyrinth-of-shadows/presentation/hooks/use-game-loop.ts` | ロジックは `game-tick.ts` へ、描画ループは `useFrame` へ移行 |

> 注: `use-game-loop.ts` に依存する既存テストが無いこと（`git grep use-game-loop -- '*.test.*'` で0件）を Task 9 で確認してから削除する。存在する場合は該当タスクで移行する。

---

### Task 1: 3D依存の追加とビルド健全性確認

**Files:**
- Modify: `package.json`（dependencies / devDependencies）

**Interfaces:**
- Produces: `three` / `@react-three/fiber` / `@react-three/drei` / `@types/three` がインポート可能になる

- [ ] **Step 1: 依存をインストール**

```bash
cd /workspaces/claym/local/cline-playground-for-frontend
npm install three@0.185.1 @react-three/fiber@9.6.1 @react-three/drei@10.7.7
npm install --save-dev @types/three@0.185.1
```

- [ ] **Step 2: React 19 との peer 整合を確認**

Run: `npm ls @react-three/fiber react`
Expected: エラーなく `@react-three/fiber@9.6.1` と `react@19.x` が表示される（peer: react `>=19 <19.3` を満たす）

- [ ] **Step 3: 型チェックとビルドが通ることを確認**

Run: `npm run typecheck && npm run build`
Expected: 両方成功（依存追加のみでコード未変更のため既存挙動は不変）

- [ ] **Step 4: コミット**

```bash
git add package.json package-lock.json
git commit -m "chore: 3D描画用に three/react-three-fiber/drei を追加"
```

---

### Task 2: ゲームティックロジックの抽出（`advanceGame`）

`use-game-loop.ts` の rAF 内ロジック（描画を除く）を、React・描画に依存しない純粋関数へ抽出する。マウスルックによる角度変更は呼び出し側で適用するため、この関数は入力の `left/right`（キー旋回）を従来通り扱う。

**Files:**
- Create: `src/features/labyrinth-of-shadows/game-tick.ts`
- Test: `src/features/labyrinth-of-shadows/__tests__/game-tick.test.ts`

**Interfaces:**
- Consumes: `GameLogic`（`game-logic.ts`）、`AudioService`（`audio.ts`）、`GameState`（`types.ts`）
- Produces:
  ```ts
  export interface TickInput {
    readonly left: boolean;
    readonly right: boolean;
    readonly forward: boolean;
    readonly backward: boolean;
    readonly hide: boolean;
    readonly sprint: boolean;
  }
  export type TickStatus = 'playing' | 'timeout' | 'victory' | 'gameover';
  export interface TickResult {
    readonly status: TickStatus;
    readonly closestEnemy: number;
    readonly moved: boolean;
  }
  export function advanceGame(g: GameState, dt: number, input: TickInput): TickResult;
  ```

- [ ] **Step 1: 失敗するテストを書く**

`src/features/labyrinth-of-shadows/__tests__/game-tick.test.ts`:

```ts
import { advanceGame, TickInput } from '../game-tick';
import { GameStateFactory } from '../entity-factory';
import type { GameState } from '../types';

// AudioService は Web Audio に触れるためモックする
jest.mock('../audio', () => ({
  AudioService: {
    play: jest.fn(),
    startBGM: jest.fn(),
    stopBGM: jest.fn(),
    updateBGM: jest.fn(),
  },
}));

const NO_INPUT: TickInput = {
  left: false, right: false, forward: false, backward: false, hide: false, sprint: false,
};

const setup = (): GameState => GameStateFactory.create('EASY');

describe('advanceGame', () => {
  test('経過時間 dt だけ残り時間が減る', () => {
    const g = setup();
    const before = g.time;
    advanceGame(g, 16, NO_INPUT);
    expect(g.time).toBeCloseTo(before - 16);
    expect(g.gTime).toBeCloseTo(16);
  });

  test('残り時間が尽きると timeout を返す', () => {
    const g = setup();
    g.time = 10;
    const result = advanceGame(g, 16, NO_INPUT);
    expect(result.status).toBe('timeout');
  });

  test('ライフが尽きると gameover を返す', () => {
    const g = setup();
    g.lives = 1;
    // プレイヤー位置に敵を重ね、無敵を切る
    g.invince = 0;
    g.hiding = false;
    const e = g.enemies[0];
    e.active = true;
    e.x = g.player.x;
    e.y = g.player.y;
    const result = advanceGame(g, 16, NO_INPUT);
    expect(result.status).toBe('gameover');
    expect(g.lives).toBe(0);
  });

  test('全鍵所持で出口に重なると victory を返す', () => {
    const g = setup();
    g.keys = g.reqKeys;
    g.player.x = g.exit.x;
    g.player.y = g.exit.y;
    const result = advanceGame(g, 16, NO_INPUT);
    expect(result.status).toBe('victory');
  });

  test('通常フレームは playing と最近敵距離を返す', () => {
    const g = setup();
    const result = advanceGame(g, 16, NO_INPUT);
    expect(result.status).toBe('playing');
    expect(typeof result.closestEnemy).toBe('number');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- game-tick.test.ts`
Expected: FAIL（`advanceGame` が存在しない / Cannot find module '../game-tick'）

- [ ] **Step 3: 最小実装を書く**

`src/features/labyrinth-of-shadows/game-tick.ts`:

```ts
import type { GameState } from './types';
import { GameLogic } from './game-logic';
import { AudioService } from './audio';

/** プレイヤー入力（1フレーム分） */
export interface TickInput {
  readonly left: boolean;
  readonly right: boolean;
  readonly forward: boolean;
  readonly backward: boolean;
  readonly hide: boolean;
  readonly sprint: boolean;
}

/** ティックの結果状態 */
export type TickStatus = 'playing' | 'timeout' | 'victory' | 'gameover';

/** ティック結果 */
export interface TickResult {
  readonly status: TickStatus;
  readonly closestEnemy: number;
  readonly moved: boolean;
}

/**
 * 1フレーム分のゲームロジックを進める純粋関数。
 * 描画・React に依存せず、既存 use-game-loop のロジック部と同一挙動を保つ（パリティ）。
 * マウスルックによる角度変更は呼び出し側で g.player.angle に適用済みである前提。
 */
export function advanceGame(g: GameState, dt: number, input: TickInput): TickResult {
  g.gTime += dt;
  g.time -= dt;
  if (g.invince > 0) g.invince -= dt;
  if (g.msgTimer > 0) g.msgTimer -= dt;
  if (g.speedBoost > 0) g.speedBoost -= dt;

  if (g.time <= 0) {
    return { status: 'timeout', closestEnemy: Infinity, moved: false };
  }

  GameLogic.updateHiding(g, input.hide, dt);
  GameLogic.updateSprinting(g, input.sprint, dt);
  const moved = GameLogic.updatePlayer(
    g,
    { left: input.left, right: input.right, forward: input.forward, backward: input.backward },
    dt
  );
  GameLogic.updateFootstep(g, moved, dt);
  GameLogic.updateItems(g);

  const exitResult = GameLogic.checkExit(g);
  if (exitResult === 'victory') {
    return { status: 'victory', closestEnemy: Infinity, moved };
  }

  const closestEnemy = GameLogic.updateEnemies(g, dt);
  if (g.lives <= 0) {
    return { status: 'gameover', closestEnemy, moved };
  }

  GameLogic.updateSounds(g, closestEnemy, dt);
  AudioService.updateBGM(Math.max(0, 1 - closestEnemy / 8));

  return { status: 'playing', closestEnemy, moved };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- game-tick.test.ts`
Expected: PASS（5テスト）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-of-shadows/game-tick.ts src/features/labyrinth-of-shadows/__tests__/game-tick.test.ts
git commit -m "feat: ゲームティックロジックを純粋関数 advanceGame に抽出"
```

---

### Task 3: 3D幾何ヘルパー（座標変換・壁列挙・カメラヨー）

**Files:**
- Create: `src/features/labyrinth-of-shadows/presentation/three/geometry.ts`
- Test: `src/features/labyrinth-of-shadows/presentation/three/__tests__/geometry.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const CELL_SIZE = 1;
  export const WALL_HEIGHT = 3;
  export const EYE_HEIGHT = 1.4;
  export interface WallCell { readonly x: number; readonly z: number }
  export function collectWallCells(maze: number[][]): WallCell[];
  export function cameraYaw(angle: number): number;
  ```

- [ ] **Step 1: 失敗するテストを書く**

`src/features/labyrinth-of-shadows/presentation/three/__tests__/geometry.test.ts`:

```ts
import { collectWallCells, cameraYaw, WALL_HEIGHT, EYE_HEIGHT } from '../geometry';

describe('geometry', () => {
  test('collectWallCells は非0セルのみを壁として列挙する', () => {
    // 0=通行可, 1=壁
    const maze = [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ];
    const walls = collectWallCells(maze);
    // 中央(1,1)以外の8セルが壁
    expect(walls).toHaveLength(8);
    expect(walls).not.toContainEqual({ x: 1, z: 1 });
    expect(walls).toContainEqual({ x: 0, z: 0 });
  });

  test('cameraYaw(0) は -π/2（angle=0 で +X 方向を向く）', () => {
    expect(cameraYaw(0)).toBeCloseTo(-Math.PI / 2);
  });

  test('cameraYaw は angle の増加に対して単調減少（-angle-π/2）', () => {
    expect(cameraYaw(Math.PI / 2)).toBeCloseTo(-Math.PI);
  });

  test('高さ定数は正の値', () => {
    expect(WALL_HEIGHT).toBeGreaterThan(0);
    expect(EYE_HEIGHT).toBeGreaterThan(0);
    expect(EYE_HEIGHT).toBeLessThan(WALL_HEIGHT);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- geometry.test.ts`
Expected: FAIL（Cannot find module '../geometry'）

- [ ] **Step 3: 最小実装を書く**

`src/features/labyrinth-of-shadows/presentation/three/geometry.ts`:

```ts
/**
 * 3Dシーンの幾何ヘルパー。
 * グリッド座標(maze[y][x], x=列/y=行) → ワールド座標(X=x, Y=up, Z=y) の規約に基づく。
 */

/** 1セルのワールドサイズ */
export const CELL_SIZE = 1;
/** 壁の高さ */
export const WALL_HEIGHT = 3;
/** カメラ（プレイヤーの目線）の高さ */
export const EYE_HEIGHT = 1.4;

/** 壁セルのワールド上の格子位置（X=x, Z=z に対応） */
export interface WallCell {
  readonly x: number;
  readonly z: number;
}

/** 迷路の非0セル（壁）を列挙する */
export function collectWallCells(maze: number[][]): WallCell[] {
  const cells: WallCell[] = [];
  for (let y = 0; y < maze.length; y++) {
    const row = maze[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== 0) cells.push({ x, z: y });
    }
  }
  return cells;
}

/**
 * プレイヤーの向き angle（+X方向が0, cos/sin基準）から
 * three カメラの Y軸ヨー角を求める。rotation.order='YXZ' を前提。
 * 導出: 望むワールド前方 (cos angle, 0, sin angle) を
 * three 既定の前方 (-sinφ, 0, -cosφ) に一致させると φ = -angle - π/2。
 */
export function cameraYaw(angle: number): number {
  return -angle - Math.PI / 2;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- geometry.test.ts`
Expected: PASS（4テスト）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-of-shadows/presentation/three/geometry.ts src/features/labyrinth-of-shadows/presentation/three/__tests__/geometry.test.ts
git commit -m "feat: 3Dシーンの座標変換・壁列挙ヘルパーを追加"
```

---

### Task 4: 壁・床・天井のシーンコンポーネント

R3F コンポーネントは WebGL 依存のためユニットテスト不可。**型チェック＋ビルド成功＋手動確認**で検証する。

**Files:**
- Create: `src/features/labyrinth-of-shadows/presentation/three/MazeWalls.tsx`
- Create: `src/features/labyrinth-of-shadows/presentation/three/FloorCeiling.tsx`

**Interfaces:**
- Consumes: `collectWallCells`, `WALL_HEIGHT`, `CELL_SIZE`（`geometry.ts`）
- Produces:
  ```ts
  export function MazeWalls(props: { maze: number[][] }): JSX.Element;
  export function FloorCeiling(props: { width: number; depth: number }): JSX.Element;
  ```

- [ ] **Step 1: MazeWalls を実装**

`src/features/labyrinth-of-shadows/presentation/three/MazeWalls.tsx`:

```tsx
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { collectWallCells, WALL_HEIGHT, CELL_SIZE } from './geometry';

/** 迷路の壁を InstancedMesh（1ドローコール）で描画する */
export function MazeWalls({ maze }: { maze: number[][] }): JSX.Element {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  // 壁セルは対局中に変化しないため maze 参照が変わったときのみ再計算
  const cells = useMemo(() => collectWallCells(maze), [maze]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    cells.forEach((c, i) => {
      // セル中心をワールド座標へ（X=x+0.5, Z=z+0.5, Y=壁の中央高さ）
      dummy.position.set(c.x + 0.5, WALL_HEIGHT / 2, c.z + 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [cells]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, cells.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
      {/* 石壁風。トーチ点光源で陰影が付く */}
      <meshStandardMaterial color="#3a3630" roughness={0.9} metalness={0.05} />
    </instancedMesh>
  );
}
```

- [ ] **Step 2: FloorCeiling を実装**

`src/features/labyrinth-of-shadows/presentation/three/FloorCeiling.tsx`:

```tsx
import React from 'react';
import { WALL_HEIGHT } from './geometry';

/** 迷路全体を覆う床・天井の平面 */
export function FloorCeiling({ width, depth }: { width: number; depth: number }): JSX.Element {
  return (
    <>
      {/* 床（原点隅から width×depth を覆うため中心へオフセット） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, depth / 2]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#141014" roughness={1} />
      </mesh>
      {/* 天井 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[width / 2, WALL_HEIGHT, depth / 2]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#0c0a0e" roughness={1} />
      </mesh>
    </>
  );
}
```

- [ ] **Step 3: 型チェックが通ることを確認**

Run: `npm run typecheck`
Expected: 成功（JSX の three 要素が @react-three/fiber の型で解決される）

- [ ] **Step 4: コミット**

```bash
git add src/features/labyrinth-of-shadows/presentation/three/MazeWalls.tsx src/features/labyrinth-of-shadows/presentation/three/FloorCeiling.tsx
git commit -m "feat: 迷路の壁(InstancedMesh)・床・天井シーンを追加"
```

---

### Task 5: アイテムの3Dオブジェクト

**Files:**
- Create: `src/features/labyrinth-of-shadows/presentation/three/ItemMeshes.tsx`

**Interfaces:**
- Consumes: `GameState`（`types.ts`）、`CONTENT`（`constants.ts`：`items[type].color`）
- Produces:
  ```ts
  export function ItemMeshes(props: { gameRef: React.MutableRefObject<GameState | null> }): JSX.Element;
  ```

- [ ] **Step 1: ItemMeshes を実装**

`src/features/labyrinth-of-shadows/presentation/three/ItemMeshes.tsx`:

```tsx
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { GameState, Item } from '../../types';
import { CONTENT } from '../../constants';

/** アイテム1個。取得済みなら非表示、未取得なら上下にbob */
function SingleItem({ item }: { item: Item }): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const color = CONTENT.items[item.type].color;
  const baseY = 0.6;

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    g.visible = !item.got;
    // ふわふわと上下（既存 renderer の bob 相当）
    g.position.y = baseY + Math.sin(state.clock.elapsedTime * 4) * 0.12;
  });

  return (
    <group ref={groupRef} position={[item.x + 0.5, baseY, item.y + 0.5]}>
      <mesh castShadow>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
      </mesh>
      {/* アイテムを照らす小さな点光源で存在感を出す */}
      <pointLight color={color} intensity={1.2} distance={3} decay={2} />
    </group>
  );
}

/** 全アイテムを描画する。アイテム配列は対局中に長さが変わらない */
export function ItemMeshes({ gameRef }: { gameRef: React.MutableRefObject<GameState | null> }): JSX.Element {
  const items = gameRef.current?.items ?? [];
  return (
    <>
      {items.map((item, i) => (
        <SingleItem key={i} item={item} />
      ))}
    </>
  );
}
```

> 注: `key={i}` はアイテム配列が対局中に並び替わらず長さも不変のため安定。ゲーム開始ごとにシーンは再マウントされる。

- [ ] **Step 2: 型チェックが通ることを確認**

Run: `npm run typecheck`
Expected: 成功

- [ ] **Step 3: コミット**

```bash
git add src/features/labyrinth-of-shadows/presentation/three/ItemMeshes.tsx
git commit -m "feat: アイテムの発光3Dオブジェクトを追加"
```

---

### Task 6: 敵のタイプ別3Dオブジェクト

**Files:**
- Create: `src/features/labyrinth-of-shadows/presentation/three/EnemyMeshes.tsx`

**Interfaces:**
- Consumes: `GameState`, `Enemy`, `EnemyType`（`types.ts`）、`CONTENT`（`constants.ts`）
- Produces:
  ```ts
  export function EnemyMeshes(props: { gameRef: React.MutableRefObject<GameState | null> }): JSX.Element;
  ```

- [ ] **Step 1: EnemyMeshes を実装**

`src/features/labyrinth-of-shadows/presentation/three/EnemyMeshes.tsx`:

```tsx
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { GameState, Enemy, EnemyType } from '../../types';
import { CONTENT } from '../../constants';

/** 敵タイプごとの見た目パラメータ */
const ENEMY_VISUAL: Record<EnemyType, { color: string; opacity: number; emissive: number }> = {
  chaser: { color: CONTENT.items.enemy.color, opacity: 1, emissive: 0.8 },       // 威圧的な赤い塊
  wanderer: { color: CONTENT.items.wanderer.color, opacity: 0.55, emissive: 0.5 }, // 半透明の漂う霊
  teleporter: { color: CONTENT.items.teleporter.color, opacity: 0.75, emissive: 1.1 }, // 歪む渦
};

/** 敵1体。active な間だけ表示し、live な座標(gameRef経由)を毎フレーム反映 */
function SingleEnemy({ enemy }: { enemy: Enemy }): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const v = ENEMY_VISUAL[enemy.type];

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    g.visible = enemy.active;
    // enemy.x/y は game-logic が毎フレーム書き換える live な値
    g.position.set(enemy.x, 1.0, enemy.y);
    // 微動（浮遊感）とテレポート型の脈動
    const t = state.clock.elapsedTime;
    g.position.y = 1.0 + Math.sin(t * 3 + enemy.x) * 0.08;
    const pulse = enemy.type === 'teleporter' ? 1 + Math.sin(t * 5) * 0.12 : 1;
    g.scale.setScalar(pulse);
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow>
        {/* タイプで形状を分ける: 追跡=球塊 / 徘徊=縦長 / テレポート=八面体 */}
        {enemy.type === 'teleporter' ? (
          <octahedronGeometry args={[0.5, 0]} />
        ) : enemy.type === 'wanderer' ? (
          <capsuleGeometry args={[0.28, 0.7, 4, 8]} />
        ) : (
          <sphereGeometry args={[0.45, 16, 16]} />
        )}
        <meshStandardMaterial
          color={v.color}
          emissive={v.color}
          emissiveIntensity={v.emissive}
          transparent={v.opacity < 1}
          opacity={v.opacity}
        />
      </mesh>
      <pointLight color={v.color} intensity={1.5} distance={4} decay={2} />
    </group>
  );
}

/** 全敵を描画する。敵配列は対局中に長さが変わらない */
export function EnemyMeshes({ gameRef }: { gameRef: React.MutableRefObject<GameState | null> }): JSX.Element {
  const enemies = gameRef.current?.enemies ?? [];
  return (
    <>
      {enemies.map((enemy, i) => (
        <SingleEnemy key={i} enemy={enemy} />
      ))}
    </>
  );
}
```

- [ ] **Step 2: 型チェックが通ることを確認**

Run: `npm run typecheck`
Expected: 成功

- [ ] **Step 3: コミット**

```bash
git add src/features/labyrinth-of-shadows/presentation/three/EnemyMeshes.tsx
git commit -m "feat: 敵のタイプ別プロシージャル3Dオブジェクトを追加"
```

---

### Task 7: ポインタロック＋マウスルックのフック

マウス移動量を ref に蓄積する。DOM 依存部（pointer lock）は薄く保ち、蓄積ロジックを検証する。

**Files:**
- Create: `src/features/labyrinth-of-shadows/presentation/hooks/use-pointer-look.ts`
- Test: `src/features/labyrinth-of-shadows/presentation/hooks/__tests__/use-pointer-look.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const LOOK_SENSITIVITY = 0.0022;
  export interface LookRef { dx: number }
  export function accumulateLook(current: number, movementX: number): number;
  export function usePointerLook(enabled: boolean): {
    lookRef: React.MutableRefObject<LookRef>;
    bindTargetRef: React.RefObject<HTMLElement>;
  };
  ```

- [ ] **Step 1: 失敗するテストを書く**

`src/features/labyrinth-of-shadows/presentation/hooks/__tests__/use-pointer-look.test.ts`:

```ts
import { accumulateLook, LOOK_SENSITIVITY } from '../use-pointer-look';

describe('accumulateLook', () => {
  test('マウス移動量に感度を掛けて加算する', () => {
    const next = accumulateLook(0, 100);
    expect(next).toBeCloseTo(100 * LOOK_SENSITIVITY);
  });

  test('既存の蓄積値に加算される', () => {
    const first = accumulateLook(0, 50);
    const second = accumulateLook(first, 50);
    expect(second).toBeCloseTo(100 * LOOK_SENSITIVITY);
  });

  test('負の移動量は逆方向に加算', () => {
    expect(accumulateLook(0, -30)).toBeCloseTo(-30 * LOOK_SENSITIVITY);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- use-pointer-look.test.ts`
Expected: FAIL（Cannot find module '../use-pointer-look'）

- [ ] **Step 3: 最小実装を書く**

`src/features/labyrinth-of-shadows/presentation/hooks/use-pointer-look.ts`:

```ts
import { useEffect, useRef } from 'react';

/** マウス感度（1px あたりのラジアン。既存 CONFIG.player.rotSpeed に近い値） */
export const LOOK_SENSITIVITY = 0.0022;

/** 未消費のマウス水平移動量（ラジアン換算）を保持する */
export interface LookRef {
  dx: number;
}

/** 現在の蓄積量にマウス移動量(px)を感度換算して加算する（純粋関数） */
export function accumulateLook(current: number, movementX: number): number {
  return current + movementX * LOOK_SENSITIVITY;
}

/**
 * ポインタロックを管理し、マウス水平移動量を lookRef.dx に蓄積するフック。
 * bindTargetRef の要素クリックでロック要求、mousemove で蓄積する。
 * 蓄積値は毎フレーム消費側（GameController）が 0 にリセットする。
 */
export function usePointerLook(enabled: boolean): {
  lookRef: React.MutableRefObject<LookRef>;
  bindTargetRef: React.RefObject<HTMLElement>;
} {
  const lookRef = useRef<LookRef>({ dx: 0 });
  const bindTargetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = bindTargetRef.current;
    if (!enabled || !target) return;

    const requestLock = () => {
      if (document.pointerLockElement !== target) target.requestPointerLock();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== target) return;
      lookRef.current.dx = accumulateLook(lookRef.current.dx, e.movementX);
    };

    target.addEventListener('click', requestLock);
    document.addEventListener('mousemove', onMouseMove);
    return () => {
      target.removeEventListener('click', requestLock);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [enabled]);

  return { lookRef, bindTargetRef };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- use-pointer-look.test.ts`
Expected: PASS（3テスト）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-of-shadows/presentation/hooks/use-pointer-look.ts src/features/labyrinth-of-shadows/presentation/hooks/__tests__/use-pointer-look.test.ts
git commit -m "feat: ポインタロック＋マウスルックのフックを追加"
```

---

### Task 8: GameController（ティック駆動・カメラ同期・トーチ・HUD更新）

`<Canvas>` 内に置き、`useFrame` で毎フレーム `advanceGame` を実行、カメラを `g.player` に同期、トーチ点光源を揺らし、HUD/ミニマップ更新コールバックを呼ぶ。

**Files:**
- Create: `src/features/labyrinth-of-shadows/presentation/three/GameController.tsx`

**Interfaces:**
- Consumes: `advanceGame`, `TickInput`（`game-tick.ts`）、`cameraYaw`, `EYE_HEIGHT`（`geometry.ts`）、`LookRef`（`use-pointer-look.ts`）、`MinimapRenderer`（`minimap-renderer.ts`）、`GameState`, `HUDData`（`types.ts`）、`CONFIG`, `CONTENT`（`constants.ts`）
- Produces:
  ```ts
  export interface GameControllerProps {
    gameRef: React.MutableRefObject<GameState | null>;
    keysRef: React.RefObject<Record<string, boolean>>;
    lookRef: React.MutableRefObject<{ dx: number }>;
    minimapCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    paused: boolean;
    diff: string;
    highScores: Record<string, number>;
    onHudUpdate: (hud: HUDData) => void;
    onGameEnd: (type: keyof typeof CONTENT.stories) => void;
  }
  export function GameController(props: GameControllerProps): JSX.Element;
  ```

- [ ] **Step 1: GameController を実装**

`src/features/labyrinth-of-shadows/presentation/three/GameController.tsx`:

```tsx
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { GameState, HUDData } from '../../types';
import { CONFIG, CONTENT } from '../../constants';
import { advanceGame, TickInput } from '../../game-tick';
import { cameraYaw, EYE_HEIGHT } from './geometry';
import { MinimapRenderer } from '../../minimap-renderer';

export interface GameControllerProps {
  gameRef: React.MutableRefObject<GameState | null>;
  keysRef: React.RefObject<Record<string, boolean>>;
  lookRef: React.MutableRefObject<{ dx: number }>;
  minimapCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  paused: boolean;
  diff: string;
  highScores: Record<string, number>;
  onHudUpdate: (hud: HUDData) => void;
  onGameEnd: (type: keyof typeof CONTENT.stories) => void;
}

/** keysRef からティック入力を生成 */
function readInput(k: Record<string, boolean>): TickInput {
  return {
    left: k['a'] || k['arrowleft'] || false,
    right: k['d'] || k['arrowright'] || false,
    forward: k['w'] || k['arrowup'] || false,
    backward: k['s'] || k['arrowdown'] || false,
    hide: k[' '] || false,
    sprint: k['shift'] || false,
  };
}

/** HUDData の浅い比較（既存 use-game-loop と同一） */
const hudEqual = (a: HUDData, b: HUDData): boolean =>
  a.keys === b.keys && a.req === b.req && a.time === b.time && a.lives === b.lives &&
  a.maxL === b.maxL && a.hide === b.hide && a.energy === b.energy && a.eNear === b.eNear &&
  a.score === b.score && a.stamina === b.stamina && a.highScore === b.highScore;

/**
 * ゲーム進行の心臓部。useFrame（R3FのrAF）で毎フレーム:
 * 1) マウスルック蓄積を角度へ反映 2) advanceGame でロジック更新
 * 3) カメラを player に同期 4) トーチ揺らぎ 5) HUD/ミニマップ更新
 */
export function GameController(props: GameControllerProps): JSX.Element {
  const { gameRef, keysRef, lookRef, minimapCanvasRef, paused, diff, highScores, onHudUpdate, onGameEnd } = props;
  const { camera } = useThree();
  const torchRef = useRef<THREE.PointLight>(null);
  const prevHudRef = useRef<HUDData | null>(null);
  const endedRef = useRef(false);

  useFrame(() => {
    const g = gameRef.current;
    if (!g || endedRef.current) return;

    const now = performance.now();
    const dt = Math.min(50, now - g.lastT);
    g.lastT = now;
    if (paused) return;

    // マウスルック: 蓄積分を角度へ反映して消費
    if (lookRef.current.dx !== 0) {
      g.player.angle += lookRef.current.dx;
      lookRef.current.dx = 0;
    }

    const result = advanceGame(g, dt, readInput(keysRef.current ?? {}));

    // カメラ同期（ロジック更新後の最新 player を反映）
    camera.position.set(g.player.x, EYE_HEIGHT, g.player.y);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = cameraYaw(g.player.angle);

    // トーチ点光源をカメラ位置へ。既存 renderer の複数周波数フリッカを流用
    if (torchRef.current) {
      const time = g.gTime / 1000;
      const flicker = Math.sin(time * 3.7) * 0.3 + Math.sin(time * 7.1) * 0.15 + Math.sin(time * 11.3) * 0.05 + 0.5;
      torchRef.current.position.set(g.player.x, EYE_HEIGHT, g.player.y);
      torchRef.current.intensity = 2.2 + flicker * 0.8;
    }

    if (result.status !== 'playing') {
      endedRef.current = true;
      onGameEnd(result.status);
      return;
    }

    // ミニマップ更新（既存 MinimapRenderer をそのまま利用）
    const minimapCtx = minimapCanvasRef.current?.getContext('2d');
    if (minimapCtx) {
      MinimapRenderer.render(minimapCtx, {
        maze: g.maze, player: g.player, exit: g.exit, items: g.items, enemies: g.enemies,
        keys: g.keys, reqKeys: g.reqKeys, explored: g.explored, time: g.gTime / 1000,
      });
    }

    // HUD更新（変化検知付き）
    const newHud: HUDData = {
      keys: g.keys, req: g.reqKeys, time: Math.ceil(g.time / 1000), lives: g.lives, maxL: g.maxLives,
      hide: g.hiding, energy: Math.round(g.energy), eNear: Math.max(0, 1 - result.closestEnemy / 7),
      score: g.score, stamina: Math.round(g.player.stamina), highScore: highScores[diff] || 0,
    };
    if (!prevHudRef.current || !hudEqual(newHud, prevHudRef.current)) {
      prevHudRef.current = newHud;
      onHudUpdate(newHud);
    }
  });

  return <pointLight ref={torchRef} color="#ffb060" intensity={2.2} distance={8} decay={1.6} castShadow />;
}
```

- [ ] **Step 2: 型チェックが通ることを確認**

Run: `npm run typecheck`
Expected: 成功

- [ ] **Step 3: コミット**

```bash
git add src/features/labyrinth-of-shadows/presentation/three/GameController.tsx
git commit -m "feat: useFrame駆動のGameController(ティック・カメラ同期・トーチ・HUD)を追加"
```

---

### Task 9: シーン組み立て・本体統合・旧描画の削除・全体検証

`<LabyrinthScene>` で全要素を組み立て、`LabyrinthOfShadowsGame.tsx` の 2D Canvas を置換。旧レイキャスティング資産を削除し、CI と手動プレイで検証する。

**Files:**
- Create: `src/features/labyrinth-of-shadows/presentation/three/LabyrinthScene.tsx`
- Modify: `src/features/labyrinth-of-shadows/LabyrinthOfShadowsGame.tsx`
- Modify: `src/features/labyrinth-of-shadows/index.ts`
- Delete: `src/features/labyrinth-of-shadows/renderer.ts`
- Delete: `src/features/labyrinth-of-shadows/__tests__/renderer.test.ts`
- Delete: `src/features/labyrinth-of-shadows/presentation/hooks/use-game-loop.ts`

**Interfaces:**
- Consumes: Task 4–8 の全コンポーネント、`AudioService`（BGM開始/停止）、`GameState`, `HUDData`（`types.ts`）
- Produces:
  ```ts
  export interface LabyrinthSceneProps {
    gameRef: React.MutableRefObject<GameState | null>;
    keysRef: React.RefObject<Record<string, boolean>>;
    minimapCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    paused: boolean;
    diff: string;
    highScores: Record<string, number>;
    onHudUpdate: (hud: HUDData) => void;
    onGameEnd: (type: keyof typeof CONTENT.stories) => void;
  }
  export function LabyrinthScene(props: LabyrinthSceneProps): JSX.Element;
  ```

- [ ] **Step 1: 削除対象に依存するテストが無いことを確認**

Run: `git grep -l "use-game-loop\|from '../renderer'\|from './renderer'\|Renderer\." -- 'src/features/labyrinth-of-shadows/**/*.test.*'`
Expected: `renderer.test.ts` 以外に出力が無いこと（あれば該当テストを本タスクで移行・削除する）

- [ ] **Step 2: LabyrinthScene を実装**

`src/features/labyrinth-of-shadows/presentation/three/LabyrinthScene.tsx`:

```tsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import type { GameState, HUDData } from '../../types';
import { CONFIG, CONTENT } from '../../constants';
import { EYE_HEIGHT } from './geometry';
import { MazeWalls } from './MazeWalls';
import { FloorCeiling } from './FloorCeiling';
import { ItemMeshes } from './ItemMeshes';
import { EnemyMeshes } from './EnemyMeshes';
import { GameController } from './GameController';
import { usePointerLook } from '../hooks/use-pointer-look';

export interface LabyrinthSceneProps {
  gameRef: React.MutableRefObject<GameState | null>;
  keysRef: React.RefObject<Record<string, boolean>>;
  minimapCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  paused: boolean;
  diff: string;
  highScores: Record<string, number>;
  onHudUpdate: (hud: HUDData) => void;
  onGameEnd: (type: keyof typeof CONTENT.stories) => void;
}

/** 3D迷宮シーンのルート。<Canvas> にフォグ・ライト・全要素を配置 */
export function LabyrinthScene(props: LabyrinthSceneProps): JSX.Element {
  const { gameRef } = props;
  const maze = gameRef.current?.maze ?? [];
  const size = maze.length;
  // デスクトップのマウスルック（ポーズ中は無効）
  const { lookRef, bindTargetRef } = usePointerLook(!props.paused);

  return (
    <div
      ref={bindTargetRef as React.RefObject<HTMLDivElement>}
      style={{ width: CONFIG.render.width, height: CONFIG.render.height, maxWidth: '100%' }}
    >
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.05, far: CONFIG.render.maxDepth, position: [0, EYE_HEIGHT, 0] }}
        gl={{ antialias: true }}
      >
        {/* 恐怖演出＋描画距離制限を兼ねる指数フォグ */}
        <fogExp2 attach="fog" args={['#05040a', 0.14]} />
        <color attach="background" args={['#05040a']} />
        {/* 環境光は極小。視界はカメラ追従トーチ（GameController内）で確保 */}
        <ambientLight intensity={0.12} />

        {size > 0 && (
          <>
            <MazeWalls maze={maze} />
            <FloorCeiling width={maze[0].length} depth={size} />
            <ItemMeshes gameRef={gameRef} />
            <EnemyMeshes gameRef={gameRef} />
          </>
        )}
        <GameController {...props} lookRef={lookRef} />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 3: 本体コンポーネントを差し替え**

`src/features/labyrinth-of-shadows/LabyrinthOfShadowsGame.tsx` を以下のように変更する。

3-a. import を差し替える（`useGameLoop`・`Canvas` スタイルを除去し、`LabyrinthScene` と `AudioService` を使う）:

```tsx
// 削除する import:
//   import { useGameLoop } from './presentation/hooks/use-game-loop';
//   import { Canvas, ... } from './presentation/styles/game.styles'; の Canvas
// 追加する import:
import { LabyrinthScene } from './presentation/three/LabyrinthScene';
```

`import type { MapData } from './presentation/hooks/use-game-loop';` は削除し、`MapData` 依存を除去する（下記 3-b で `_mapData` を廃止）。styled `Canvas` は不要になるため import 一覧から外す（`PageContainer, MessageOverlay, Overlay, ModalContent, ControlBtn` は残す）。

3-b. `_mapData` / `setMapData` の state を削除する（3Dシーンは gameRef を直接読むため MapData は不要。ミニマップは GameController が描画する）:

```tsx
// 削除:
//   const [_mapData, setMapData] = useState<MapData>({ ... });
```

3-c. `useGameLoop({...})` 呼び出しブロック（L112–L127 相当）を削除し、`stopLoop` 参照を除去する。ゲーム終了時の BGM 停止は `endGame` 内で既に `AudioService.stopBGM()` されている。`onGameEnd` は直接 `endGame` を渡す。

3-d. プレイ画面の JSX（`return (<PageContainer> ... )`）内の 2D `<Canvas ... />` を `<LabyrinthScene>` に置換する:

```tsx
return (
  <PageContainer>
    <LabyrinthScene
      gameRef={gameRef}
      keysRef={keysRef}
      minimapCanvasRef={minimapCanvasRef}
      paused={paused}
      diff={diff}
      highScores={highScores}
      onHudUpdate={setHud}
      onGameEnd={endGame}
    />
    <HUD h={hud} />
    <Controls keysRef={keysRef} hiding={hud.hide} energy={hud.energy} stamina={hud.stamina} />
    {mazeSize > 0 && <Minimap canvasRef={minimapCanvasRef} size={mazeSize} />}
    <MessageOverlay $visible={!!(gameRef.current && gameRef.current.msgTimer > 0)}>
      {gameRef.current?.msg}
    </MessageOverlay>
    {paused && (
      /* 既存のポーズ Overlay ブロックをそのまま維持 */
      <Overlay>{/* ...既存内容... */}</Overlay>
    )}
  </PageContainer>
);
```

3-e. BGM 開始/停止: 従来 `useGameLoop` 内で `AudioService.startBGM()` していたため、`onStoryDone` でプレイ開始時に `AudioService.startBGM()` を呼ぶ。`LabyrinthOfShadowsGame.tsx` 冒頭の import に `AudioService`（既に import 済み）を利用:

```tsx
const onStoryDone = useCallback(() => {
  if (storyType === 'intro') {
    gameRef.current = GameStateFactory.create(diff);
    AudioService.startBGM(); // 従来 useGameLoop が担っていた BGM 開始を移設
    setScreen('playing');
  } else setScreen('title');
}, [storyType, diff]);
```

- [ ] **Step 4: barrel を更新**

`src/features/labyrinth-of-shadows/index.ts` の `export { Renderer } from './renderer';` を削除し、`LabyrinthScene` を公開に追加する:

```ts
// 削除:
//   export { Renderer } from './renderer';
// 追加:
export { LabyrinthScene } from './presentation/three/LabyrinthScene';
```

- [ ] **Step 5: 旧描画資産を削除**

```bash
git rm src/features/labyrinth-of-shadows/renderer.ts \
       src/features/labyrinth-of-shadows/__tests__/renderer.test.ts \
       src/features/labyrinth-of-shadows/presentation/hooks/use-game-loop.ts
```

- [ ] **Step 6: 型チェック・lint・テストを実行**

Run: `npm run typecheck && npm run lint:ci && npm test`
Expected: 全 green。特に `domain/`・`game-logic`・`game-tick`・`geometry`・`use-pointer-look` のテストが通り、`renderer.test.ts` が消えていること。`MazeHorrorPage.test.tsx` は title/story 画面のみ検証しR3F未マウントのため通過する。

- [ ] **Step 7: ビルドとバンドル分割を確認**

Run: `npm run build`
Expected: 成功。ビルド出力で `three` が maze-horror ルート（`App.tsx` の `lazy(() => import('./pages/MazeHorrorPage'))`）のチャンクに含まれ、メイン(entry)バンドルに `three` が入っていないことを確認する。

確認コマンド例:
```bash
# three を含むチャンクを特定し、それが maze-horror 系チャンクであることを目視確認
grep -rl "THREE.WebGLRenderer\|react-three" dist/*.js | head
```

- [ ] **Step 8: 手動プレイ確認（WebGL は自動テスト不可のため必須）**

Run: `npm start` → ブラウザで `/maze-horror` を開く
確認項目:
1. タイトル→難易度選択→イントロ→プレイ画面へ遷移し、**3Dの迷路**が一人称で描画される
2. WASD/矢印で前後・旋回移動でき、壁をすり抜けない（`isWalkable` 衝突が効いている）
3. 画面クリックでポインタロックがかかり、マウス左右で視点が回る。Esc でロック解除＋ポーズ
4. 鍵/回復/加速/地図/罠箱が発光オブジェクトとして見え、近づくと取得しHUDが更新される
5. 敵3種（追跡=赤球/徘徊=半透明カプセル/テレポート=脈動八面体）が表示・移動する
6. 全鍵取得後に出口へ到達で victory、ライフ0で gameover、時間切れで timeout に遷移
7. ミニマップが従来通り描画される
8. トーチのフリッカと指数フォグでホラーの雰囲気が出ている

- [ ] **Step 9: CI 全パイプラインを実行**

Run: `npm run ci`
Expected: lint:ci → typecheck → test:coverage → build が全通過

- [ ] **Step 10: コミット**

```bash
git add -A
git commit -m "feat: Labyrinth of Shadows を本物の3D(R3F/FP視点)へ移行

- レイキャスティング描画を R3F シーングラフに置換
- 迷路/壁/敵/アイテムをプロシージャル3Dオブジェクト化
- マウスルック(ポインタロック)対応、ルールはパリティ維持
- renderer.ts / use-game-loop.ts を削除"
```

---

## Self-Review

**1. Spec coverage:**
- 「R3F導入・描画層置換」→ Task 1,4–9 ✅
- 「ロジック更新を useFrame 駆動の純粋関数へ抽出」→ Task 2（`advanceGame`）✅
- 「domain 無改修再利用」→ 全タスクで domain 不変（Global Constraints）✅
- 「FP＋マウスルック」→ Task 7,8,9 ✅
- 「プロシージャル中心（壁/床/天井/敵/アイテム）」→ Task 4,5,6 ✅
- 「フォグ＋ライティングで恐怖」→ Task 9（fogExp2）＋Task 8（トーチ）✅
- 「ミニマップは既存2D Canvas継続」→ Task 8（MinimapRenderer 呼び出し）✅
- 「遅延ロード」→ 既存 `App.tsx` lazy ルートで担保、Task 9 Step 7 で検証 ✅
- 「domain/game-logic テスト全green維持」→ Task 9 Step 6 ✅
- 「パリティ（難易度/アイテム/スコア等不変）」→ Global Constraints＋Task 2 パリティテスト ✅
- 受け入れ基準1–7 → Task 9 Step 6–9（CI）＋Step 8（手動）で網羅 ✅

**2. Placeholder scan:** プレースホルダ無し。R3F コンポーネントは完全なコードを提示。手動確認タスクは具体的な確認項目を列挙済み。

**3. Type consistency:**
- `advanceGame(g, dt, input): TickResult` — Task 2 定義、Task 8 で使用 ✅
- `cameraYaw` / `EYE_HEIGHT` / `WALL_HEIGHT` / `CELL_SIZE` / `collectWallCells` — Task 3 定義、Task 4/8/9 で使用 ✅
- `usePointerLook(enabled)` → `{ lookRef, bindTargetRef }`、`lookRef.current.dx` — Task 7 定義、Task 8/9 で使用（`{ dx: number }` 一致）✅
- `MazeWalls({maze})` / `FloorCeiling({width,depth})` / `ItemMeshes({gameRef})` / `EnemyMeshes({gameRef})` / `GameController(props)` / `LabyrinthScene(props)` — 各 Task 定義と Task 9 の利用が一致 ✅
- `MinimapRenderer.render` の引数（maze/player/exit/items/enemies/keys/reqKeys/explored/time）— 既存 use-game-loop と同一形状 ✅

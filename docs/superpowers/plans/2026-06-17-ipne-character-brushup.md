# IPNE キャラクター・ブラッシュアップ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** IPNE のキャラクター（プレイヤー・敵）のドット絵と動きの質を、3 層（動き / ドット自動補正 / ドット手描き）に分けて向上させる。

**Architecture:** 変更は `src/features/ipne/presentation/` 配下のみ（DDD の依存方向を維持し domain/application は非干渉）。動きの数式とドット補正をそれぞれ純粋関数（`motion.ts` / `dotEnhance.ts`）に切り出し、描画層（`drawPlayer.ts` / `drawEnemies.ts`）と `SpriteRenderer` から呼ぶ。自動補正は描画呼び出し側で `EnhanceOptions` を渡す方式とし、環境タイル（床/壁/アイテム）には適用しない。

**Tech Stack:** React 19 / TypeScript / Canvas 2D（コードスプライト方式）/ Jest + SWC。

**設計書:** `docs/superpowers/specs/2026-06-17-ipne-character-brushup-design.md`

> 仕様書の `autoShade?: boolean` は本計画では「描画呼び出し側が渡す `EnhanceOptions { outline, shade }`」に具体化する。プレイヤーは手描き対象のため `{ outline: true, shade: false }`、敵は `{ outline: true, shade: true }` を渡す。これによりキャッシュ単位で補正を切り替え、タイルには一切適用されない。

---

## ファイル構成

| ファイル | 区分 | 責務 |
|---|---|---|
| `presentation/sprites/motion.ts` | 新規 | 歩行フレーム選択・bob・スカッシュ・攻撃トランスフォームの純粋関数 |
| `presentation/sprites/motion.test.ts` | 新規 | 上記の境界値テスト |
| `presentation/sprites/dotEnhance.ts` | 新規 | 輪郭線（index 空間）・縁陰影（ImageData 空間）の純粋関数 |
| `presentation/sprites/dotEnhance.test.ts` | 新規 | 上記の入出力テスト |
| `presentation/screens/render/groundShadow.ts` | 新規 | 接地シャドウ描画ヘルパー |
| `presentation/screens/render/groundShadow.test.ts` | 新規 | スタブ ctx による描画呼び出しテスト |
| `presentation/sprites/spriteRenderer.ts` | 変更 | `EnhanceOptions` 対応（キャッシュ時に補正適用） |
| `presentation/sprites/index.ts` | 変更 | 新規 export の追加 |
| `presentation/screens/render/drawPlayer.ts` | 変更 | motion/shadow/enhance 配線 |
| `presentation/screens/render/drawEnemies.ts` | 変更 | shadow/enhance 配線 |

---

## フェーズと PR 対応

- **PR-1（Task 1〜4）動きの層**: `motion.ts`・`groundShadow.ts`・`drawPlayer`/`drawEnemies` 配線
- **PR-2（Task 5〜8）自動補正層**: `dotEnhance.ts`・`SpriteRenderer` 対応・描画側で `EnhanceOptions` を付与
- **PR-3（Task 9〜11）手描き層**: 戦士・盗賊 4 方向のドット作り込み（左右ミラー脱却）と不変条件テスト

各 PR の最後に `npm run ci`（lint:ci → typecheck → test:coverage → build）を通す。

---

# PR-1: 動きの層

## Task 1: motion.ts — 歩行フレーム選択

**Files:**
- Create: `src/features/ipne/presentation/sprites/motion.ts`
- Test: `src/features/ipne/presentation/sprites/motion.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ipne/presentation/sprites/motion.test.ts`:

```ts
import { selectWalkFrameIndex } from './motion';

describe('selectWalkFrameIndex', () => {
  // 4枚循環 [walk1, mid, walk2, mid] = [1, 2, 3, 2] で walk2(=3) を必ず含む
  it('は now の進行に応じて [1,2,3,2] を循環する', () => {
    const fd = 100;
    expect(selectWalkFrameIndex(0, fd)).toBe(1);
    expect(selectWalkFrameIndex(100, fd)).toBe(2);
    expect(selectWalkFrameIndex(200, fd)).toBe(3);
    expect(selectWalkFrameIndex(300, fd)).toBe(2);
    expect(selectWalkFrameIndex(400, fd)).toBe(1); // 一巡して戻る
  });

  it('は死蔵フレーム walk2(=3) を循環内に含む', () => {
    const fd = 100;
    const seen = [0, 1, 2, 3].map((i) => selectWalkFrameIndex(i * fd, fd));
    expect(seen).toContain(3);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/ipne/presentation/sprites/motion.test.ts -t selectWalkFrameIndex`
Expected: FAIL（`Cannot find module './motion'`）

- [ ] **Step 3: 最小実装**

`src/features/ipne/presentation/sprites/motion.ts`:

```ts
/**
 * キャラクターモーション計算（純粋関数）
 *
 * 描画層から呼ぶアニメーションの数式を集約する。Canvas 非依存・副作用なし。
 */
import type { Direction } from './playerSprites';

/** 歩行フレーム循環順（idle=0 を除き walk1→mid→walk2→mid） */
const WALK_CYCLE = [1, 2, 3, 2] as const;

/**
 * 歩行アニメのフレーム番号を返す（4枚循環で walk2 を含める）。
 */
export function selectWalkFrameIndex(now: number, frameDuration: number): number {
  const step = Math.floor(now / frameDuration) % WALK_CYCLE.length;
  return WALK_CYCLE[step];
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/ipne/presentation/sprites/motion.test.ts -t selectWalkFrameIndex`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ipne/presentation/sprites/motion.ts src/features/ipne/presentation/sprites/motion.test.ts
git commit -m "feat: IPNE 歩行フレーム選択を4枚循環の純粋関数化"
```

## Task 2: motion.ts — bob・スカッシュ・攻撃トランスフォーム

**Files:**
- Modify: `src/features/ipne/presentation/sprites/motion.ts`
- Test: `src/features/ipne/presentation/sprites/motion.test.ts`

- [ ] **Step 1: 失敗するテストを追記**

`src/features/ipne/presentation/sprites/motion.test.ts` の末尾に追記:

```ts
import {
  computeWalkBob,
  computeSquash,
  computeAttackTransform,
  WALK_BOB_AMPLITUDE,
} from './motion';

describe('computeWalkBob', () => {
  const fd = 100;
  it('は接地（sin=0）で 0、半周期（sin=1）で振幅最大になる', () => {
    expect(computeWalkBob(0, fd)).toBeCloseTo(0);
    expect(computeWalkBob(50, fd)).toBeCloseTo(WALK_BOB_AMPLITUDE); // sin(pi/2)=1
  });
  it('は常に 0 以上 振幅以下', () => {
    for (let t = 0; t < 200; t += 7) {
      const b = computeWalkBob(t, fd);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(WALK_BOB_AMPLITUDE + 1e-9);
    }
  });
});

describe('computeSquash', () => {
  const fd = 100;
  it('は接地（sin=0）で最も縮み、空中（sin=1）で 1.0', () => {
    expect(computeSquash(0, fd)).toBeLessThan(1);
    expect(computeSquash(50, fd)).toBeCloseTo(1);
  });
});

describe('computeAttackTransform', () => {
  it('は予備動作で進行方向の逆へ引く（down は dy<0）', () => {
    const tf = computeAttackTransform(0.1, 'down');
    expect(tf.dy).toBeLessThan(0);
    expect(tf.scale).toBeCloseTo(1);
  });
  it('は踏み込みで進行方向へ前進し拡大する（right は dx>0, scale>1）', () => {
    const tf = computeAttackTransform(0.35, 'right');
    expect(tf.dx).toBeGreaterThan(0);
    expect(tf.scale).toBeGreaterThan(1);
  });
  it('は終了時（progress=1）に原点・等倍へ戻る', () => {
    const tf = computeAttackTransform(1, 'up');
    expect(tf.dx).toBeCloseTo(0);
    expect(tf.dy).toBeCloseTo(0);
    expect(tf.scale).toBeCloseTo(1);
  });
  it('は範囲外 progress をクランプする', () => {
    expect(computeAttackTransform(-5, 'left')).toEqual(computeAttackTransform(0, 'left'));
    expect(computeAttackTransform(5, 'left')).toEqual(computeAttackTransform(1, 'left'));
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/ipne/presentation/sprites/motion.test.ts`
Expected: FAIL（`computeWalkBob` 等が未定義）

- [ ] **Step 3: motion.ts に追記**

`src/features/ipne/presentation/sprites/motion.ts` の `selectWalkFrameIndex` の下に追記:

```ts
/** 歩行バウンスの振幅（px、spriteScale 適用前） */
export const WALK_BOB_AMPLITUDE = 2;

/** 踏み込みスカッシュの最大縮み量 */
const SQUASH_DEPTH = 0.06;

/** 攻撃の予備動作・踏み込み量・拡大ピーク（px / 比率、spriteScale 適用前） */
const ATTACK_ANTICIPATION = 3;
const ATTACK_LUNGE = 6;
const ATTACK_SCALE_PEAK = 0.08;

/**
 * 歩行中の上下バウンス量（px、上方向が正）。
 */
export function computeWalkBob(now: number, frameDuration: number): number {
  const phase = (now / frameDuration) * Math.PI;
  return Math.abs(Math.sin(phase)) * WALK_BOB_AMPLITUDE;
}

/**
 * 接地（踏み込み）時の縦スケール。接地の瞬間に最小、空中で 1.0。
 */
export function computeSquash(now: number, frameDuration: number): number {
  const lift = Math.abs(Math.sin((now / frameDuration) * Math.PI));
  return 1 - SQUASH_DEPTH * (1 - lift);
}

/** 方向ごとの前進単位ベクトル（スクリーン座標、y+ が下） */
const DIRECTION_VECTORS: Record<Direction, { x: number; y: number }> = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** 攻撃モーションの位置・拡大トランスフォーム（px / 比率、spriteScale 適用前） */
export interface AttackTransform {
  dx: number;
  dy: number;
  scale: number;
}

/**
 * 攻撃モーションのトランスフォームを返す。
 * 予備動作（後退）→ 踏み込み（前進＋拡大）→ オーバーシュート復帰。
 *
 * @param progress 攻撃進行度 0..1（範囲外はクランプ）
 */
export function computeAttackTransform(progress: number, direction: Direction): AttackTransform {
  const t = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  const v = DIRECTION_VECTORS[direction];
  let forward: number;
  let scale: number;
  if (t < 0.2) {
    const k = t / 0.2;
    forward = -ATTACK_ANTICIPATION * k;
    scale = 1;
  } else if (t < 0.5) {
    const k = (t - 0.2) / 0.3;
    forward = -ATTACK_ANTICIPATION + (ATTACK_ANTICIPATION + ATTACK_LUNGE) * k;
    scale = 1 + ATTACK_SCALE_PEAK * Math.sin(k * Math.PI);
  } else {
    const k = (t - 0.5) / 0.5;
    forward = ATTACK_LUNGE * (1 - k);
    scale = 1;
  }
  return { dx: v.x * forward, dy: v.y * forward, scale };
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/ipne/presentation/sprites/motion.test.ts`
Expected: PASS（全 describe）

- [ ] **Step 5: コミット**

```bash
git add src/features/ipne/presentation/sprites/motion.ts src/features/ipne/presentation/sprites/motion.test.ts
git commit -m "feat: IPNE bob・スカッシュ・攻撃トランスフォームの純粋関数を追加"
```

## Task 3: 接地シャドウ描画ヘルパー

**Files:**
- Create: `src/features/ipne/presentation/screens/render/groundShadow.ts`
- Test: `src/features/ipne/presentation/screens/render/groundShadow.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ipne/presentation/screens/render/groundShadow.test.ts`:

```ts
import { drawGroundShadow } from './groundShadow';

/** ellipse / globalAlpha の呼び出しを記録するスタブ ctx */
function createStubCtx() {
  const calls: { ellipseArgs: number[][]; alphas: number[]; fills: number } = {
    ellipseArgs: [],
    alphas: [],
    fills: 0,
  };
  const ctx = {
    globalAlpha: 1,
    fillStyle: '',
    save() {},
    restore() {},
    beginPath() {},
    ellipse(x: number, y: number, rw: number, rh: number) {
      calls.ellipseArgs.push([x, y, rw, rh]);
      calls.alphas.push(this.globalAlpha);
    },
    fill() {
      calls.fills += 1;
    },
  } as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

describe('drawGroundShadow', () => {
  it('は楕円を1つ塗る', () => {
    const { ctx, calls } = createStubCtx();
    drawGroundShadow(ctx, 100, 100, 64, 0);
    expect(calls.ellipseArgs).toHaveLength(1);
    expect(calls.fills).toBe(1);
  });

  it('は lift が大きいほど影が小さく薄くなる', () => {
    const { ctx, calls } = createStubCtx();
    drawGroundShadow(ctx, 100, 100, 64, 0); // 接地
    drawGroundShadow(ctx, 100, 100, 64, 2); // 浮き
    const [grounded, lifted] = calls.ellipseArgs;
    const [groundedAlpha, liftedAlpha] = calls.alphas;
    expect(lifted[2]).toBeLessThan(grounded[2]); // rw が小さい
    expect(liftedAlpha).toBeLessThan(groundedAlpha); // alpha が小さい
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/ipne/presentation/screens/render/groundShadow.test.ts`
Expected: FAIL（`Cannot find module './groundShadow'`）

- [ ] **Step 3: 最小実装**

`src/features/ipne/presentation/screens/render/groundShadow.ts`:

```ts
/**
 * 接地シャドウ描画
 *
 * キャラクター足元に楕円シャドウを描き、接地感を与える。
 * lift（浮き上がり px）が大きいほど影は小さく薄くなる。
 */

/** lift 1px あたりの縮小率 */
const SHRINK_PER_LIFT = 0.06;
/** 縮小率の上限 */
const MAX_SHRINK = 0.4;
/** 接地時の基準不透明度 */
const BASE_ALPHA = 0.32;
/** 影の横半径（drawSize 比） */
const RADIUS_RATIO = 0.3;
/** 影の縦横比 */
const FLATNESS = 0.32;

export function drawGroundShadow(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  drawSize: number,
  lift: number
): void {
  const shrink = Math.min(MAX_SHRINK, lift * SHRINK_PER_LIFT);
  const rw = drawSize * RADIUS_RATIO * (1 - shrink);
  const rh = rw * FLATNESS;
  const feetY = screenY + drawSize / 2 - rh;
  ctx.save();
  ctx.globalAlpha = BASE_ALPHA * (1 - shrink);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(screenX, feetY, rw, rh, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/ipne/presentation/screens/render/groundShadow.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ipne/presentation/screens/render/groundShadow.ts src/features/ipne/presentation/screens/render/groundShadow.test.ts
git commit -m "feat: IPNE 接地シャドウ描画ヘルパーを追加"
```

## Task 4: drawPlayer / drawEnemies に動きを配線

**Files:**
- Modify: `src/features/ipne/presentation/screens/render/drawPlayer.ts`
- Modify: `src/features/ipne/presentation/screens/render/drawEnemies.ts`

> このタスクは Canvas 描画の統合のため、ロジックは Task 1〜3 の純粋関数＋ヘルパーに集約済み。手動確認（開発サーバー）で検証する。

- [ ] **Step 1: drawPlayer の import を追加**

`src/features/ipne/presentation/screens/render/drawPlayer.ts` の import 群（`import type { FrameContext }` の直前）に追加:

```ts
import {
  selectWalkFrameIndex,
  computeWalkBob,
  computeSquash,
  computeAttackTransform,
} from '../../sprites/motion';
import { drawGroundShadow } from './groundShadow';
```

- [ ] **Step 2: 攻撃ブランチを踏み込み付きに置換**

`drawPlayer.ts` の `if (isAttacking) {` ブロック内、`spriteRenderer.drawSprite(ctx, attackSheet.sprites[attackFrameIndex], playerDrawX, playerDrawY, spriteScale);` の行を、以下に置換:

```ts
        // 攻撃進行度（既存の attackElapsed/attackDuration を先に算出）
        const atkDuration = 300;
        const atkElapsed = now - (playerAttackUntilRef.current - atkDuration);
        const atkProgress = atkElapsed / atkDuration;
        const tf = computeAttackTransform(atkProgress, pDir);
        ctx.save();
        ctx.translate(tf.dx * spriteScale, tf.dy * spriteScale);
        ctx.translate(playerScreen.x, playerScreen.y);
        ctx.scale(tf.scale, tf.scale);
        ctx.translate(-playerScreen.x, -playerScreen.y);
        spriteRenderer.drawSprite(ctx, attackSheet.sprites[attackFrameIndex], playerDrawX, playerDrawY, spriteScale);
        ctx.restore();
```

- [ ] **Step 3: 移動ブランチを 4枚循環＋bob＋スカッシュ＋シャドウに置換**

`drawPlayer.ts` の `} else if (isMoving) {` ブロック内の先頭3行:

```ts
        const playerSheet = getPlayerSpriteSheet(pClass, pDir);
        const walkFrameIndex = Math.floor(now / playerSheet.frameDuration) % 2;
        spriteRenderer.drawSprite(ctx, playerSheet.sprites[1 + walkFrameIndex], playerDrawX, playerDrawY, spriteScale);
```

を以下に置換:

```ts
        const playerSheet = getPlayerSpriteSheet(pClass, pDir);
        const bob = computeWalkBob(now, playerSheet.frameDuration);
        const squash = computeSquash(now, playerSheet.frameDuration);
        const walkFrame = playerSheet.sprites[selectWalkFrameIndex(now, playerSheet.frameDuration)];
        drawGroundShadow(ctx, playerScreen.x, playerScreen.y, playerDrawSize, bob);
        const feetY = playerDrawY + playerDrawSize;
        ctx.save();
        ctx.translate(0, -bob * spriteScale);
        ctx.translate(playerScreen.x, feetY);
        ctx.scale(1, squash);
        ctx.translate(-playerScreen.x, -feetY);
        spriteRenderer.drawSprite(ctx, walkFrame, playerDrawX, playerDrawY, spriteScale);
        ctx.restore();
```

- [ ] **Step 4: アイドルブランチにシャドウを追加**

`drawPlayer.ts` の `} else {`（アイドルブリーズ）ブロック内、`const idleFrameIndex = ...` の直前に追加:

```ts
        drawGroundShadow(ctx, playerScreen.x, playerScreen.y, playerDrawSize, 0);
```

- [ ] **Step 5: drawEnemies にシャドウを配線**

`src/features/ipne/presentation/screens/render/drawEnemies.ts` の import に追加（`import type { FrameContext }` の直前）:

```ts
import { drawGroundShadow } from './groundShadow';
```

続いて、通常スプライト描画の直前（`const enemyStateFrame = getEnemyStateFrame(...)` の直前）に追加:

```ts
    drawGroundShadow(ctx, enemyScreen.x, enemyScreen.y, enemyDrawSize, 0);
```

- [ ] **Step 6: 型チェックと既存テストを確認**

Run: `npm run typecheck && npx jest src/features/ipne/presentation/screens/render src/features/ipne/__tests__/movement.test.ts`
Expected: PASS（型エラーなし・既存描画テストが緑）

- [ ] **Step 7: 手動確認**

Run: `npm start`（別ターミナル）
確認: IPNE をプレイし、(1) 歩行で上下バウンス＋足元シャドウ、(2) 攻撃で予備動作→踏み込み→復帰、(3) 攻撃中・被弾中は bob が出ない、(4) 敵の足元にシャドウ。

- [ ] **Step 8: コミット**

```bash
git add src/features/ipne/presentation/screens/render/drawPlayer.ts src/features/ipne/presentation/screens/render/drawEnemies.ts
git commit -m "feat: IPNE プレイヤー・敵の動きにbob/シャドウ/踏み込みを配線"
```

- [ ] **Step 9: PR-1 の CI を通す**

Run: `npm run ci`
Expected: lint:ci → typecheck → test:coverage → build がすべて成功

---

# PR-2: ドット自動補正層

## Task 5: dotEnhance.ts — 輪郭線（index 空間）

**Files:**
- Create: `src/features/ipne/presentation/sprites/dotEnhance.ts`
- Test: `src/features/ipne/presentation/sprites/dotEnhance.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ipne/presentation/sprites/dotEnhance.test.ts`:

```ts
import { applyOutline } from './dotEnhance';
import type { SpriteDefinition } from './spriteData';

/** 中央1ピクセルだけ不透明な 3x3 スプライト */
function dotSprite(): SpriteDefinition {
  return {
    width: 3,
    height: 3,
    pixels: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    palette: ['', '#ffffff'],
  };
}

describe('applyOutline', () => {
  it('は不透明ピクセルの上下左右に輪郭色を置く', () => {
    const out = applyOutline(dotSprite());
    const outlineIndex = out.palette.length - 1;
    // 4近傍が輪郭色に
    expect(out.pixels[0][1]).toBe(outlineIndex);
    expect(out.pixels[2][1]).toBe(outlineIndex);
    expect(out.pixels[1][0]).toBe(outlineIndex);
    expect(out.pixels[1][2]).toBe(outlineIndex);
    // 斜めは輪郭にしない（4近傍のみ）
    expect(out.pixels[0][0]).toBe(0);
    // 元の不透明ピクセルは保持
    expect(out.pixels[1][1]).toBe(1);
  });

  it('は入力を破壊しない', () => {
    const src = dotSprite();
    const snapshot = JSON.stringify(src.pixels);
    applyOutline(src);
    expect(JSON.stringify(src.pixels)).toBe(snapshot);
  });

  it('は輪郭色をパレット末尾に1度だけ追加する', () => {
    const once = applyOutline(dotSprite());
    const twice = applyOutline(once);
    expect(twice.palette.length).toBe(once.palette.length);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/ipne/presentation/sprites/dotEnhance.test.ts -t applyOutline`
Expected: FAIL（`Cannot find module './dotEnhance'`）

- [ ] **Step 3: 最小実装**

`src/features/ipne/presentation/sprites/dotEnhance.ts`:

```ts
/**
 * ドット自動補正（純粋関数）
 *
 * コードスプライトに輪郭線（パレット index 空間）と縁陰影（ImageData RGB 空間）を
 * 機械適用する。いずれも入力非破壊。
 */
import type { SpriteDefinition } from './spriteData';

/** 輪郭線に使う暗色 */
const OUTLINE_COLOR = '#0a0a14';

const isOpaque = (pixels: number[][], x: number, y: number): boolean =>
  pixels[y]?.[x] !== undefined && pixels[y][x] !== 0;

/**
 * 透明かつキャラ縁（4近傍に不透明あり）のピクセルを輪郭色で埋めた新スプライトを返す。
 */
export function applyOutline(sprite: SpriteDefinition): SpriteDefinition {
  const { pixels, palette } = sprite;
  const existing = palette.indexOf(OUTLINE_COLOR);
  const nextPalette = existing >= 0 ? palette : [...palette, OUTLINE_COLOR];
  const outlineIndex = existing >= 0 ? existing : nextPalette.length - 1;

  const next = pixels.map((row) => [...row]);
  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      if (pixels[y][x] !== 0) continue;
      const edge =
        isOpaque(pixels, x, y - 1) ||
        isOpaque(pixels, x, y + 1) ||
        isOpaque(pixels, x - 1, y) ||
        isOpaque(pixels, x + 1, y);
      if (edge) next[y][x] = outlineIndex;
    }
  }
  return { ...sprite, palette: nextPalette, pixels: next };
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/ipne/presentation/sprites/dotEnhance.test.ts -t applyOutline`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ipne/presentation/sprites/dotEnhance.ts src/features/ipne/presentation/sprites/dotEnhance.test.ts
git commit -m "feat: IPNE ドット輪郭線の自動補正純粋関数を追加"
```

## Task 6: dotEnhance.ts — 縁陰影（ImageData 空間）

**Files:**
- Modify: `src/features/ipne/presentation/sprites/dotEnhance.ts`
- Test: `src/features/ipne/presentation/sprites/dotEnhance.test.ts`

- [ ] **Step 1: 失敗するテストを追記**

`src/features/ipne/presentation/sprites/dotEnhance.test.ts` の末尾に追記:

```ts
import { applyEdgeShading } from './dotEnhance';

/** 2x2 すべて不透明な灰色 ImageData を作る */
function grayImage(): ImageData {
  const data = new Uint8ClampedArray(2 * 2 * 4);
  for (let i = 0; i < 4; i++) {
    data[i * 4] = 100;
    data[i * 4 + 1] = 100;
    data[i * 4 + 2] = 100;
    data[i * 4 + 3] = 255;
  }
  return new ImageData(data, 2, 2);
}

describe('applyEdgeShading', () => {
  it('は右下の縁（外周が透明扱い）を暗くする', () => {
    const out = applyEdgeShading(grayImage());
    // 右下ピクセル(1,1)は下・右が範囲外=透明 → 暗化
    const o = (1 * 2 + 1) * 4;
    expect(out.data[o]).toBeLessThan(100);
  });

  it('は入力 ImageData を破壊しない', () => {
    const src = grayImage();
    applyEdgeShading(src);
    expect(src.data[0]).toBe(100);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/ipne/presentation/sprites/dotEnhance.test.ts -t applyEdgeShading`
Expected: FAIL（`applyEdgeShading` 未定義）

- [ ] **Step 3: dotEnhance.ts に追記**

`src/features/ipne/presentation/sprites/dotEnhance.ts` の末尾に追記:

```ts
/** 縁内側（下・右が透明）の暗化係数 */
const SHADE_DARK = 0.62;
/** 上面（上・左が透明）の明化係数 */
const SHADE_LIGHT = 0.3;

/**
 * ImageData の不透明ピクセルについて、下/右に透明が隣接する縁を暗く、
 * 上/左に透明が隣接する縁を明るくした新しい ImageData を返す（非破壊）。
 */
export function applyEdgeShading(image: ImageData): ImageData {
  const { width, height, data } = image;
  const out = new Uint8ClampedArray(data);
  const isTransparent = (x: number, y: number): boolean =>
    x < 0 || y < 0 || x >= width || y >= height || data[(y * width + x) * 4 + 3] === 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      if (data[o + 3] === 0) continue;
      const dark = isTransparent(x, y + 1) || isTransparent(x + 1, y);
      const light = isTransparent(x, y - 1) || isTransparent(x - 1, y);
      if (dark) {
        out[o] = data[o] * SHADE_DARK;
        out[o + 1] = data[o + 1] * SHADE_DARK;
        out[o + 2] = data[o + 2] * SHADE_DARK;
      } else if (light) {
        out[o] = data[o] + (255 - data[o]) * SHADE_LIGHT;
        out[o + 1] = data[o + 1] + (255 - data[o + 1]) * SHADE_LIGHT;
        out[o + 2] = data[o + 2] + (255 - data[o + 2]) * SHADE_LIGHT;
      }
    }
  }
  return new ImageData(out, width, height);
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/ipne/presentation/sprites/dotEnhance.test.ts`
Expected: PASS（applyOutline / applyEdgeShading 全件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ipne/presentation/sprites/dotEnhance.ts src/features/ipne/presentation/sprites/dotEnhance.test.ts
git commit -m "feat: IPNE ドット縁陰影の自動補正純粋関数を追加"
```

## Task 7: SpriteRenderer に EnhanceOptions を実装

**Files:**
- Modify: `src/features/ipne/presentation/sprites/spriteRenderer.ts`
- Modify: `src/features/ipne/presentation/sprites/index.ts`
- Test: `src/features/ipne/presentation/sprites/spriteRenderer.test.ts`（新規）

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ipne/presentation/sprites/spriteRenderer.test.ts`:

```ts
import { SpriteRenderer } from './spriteRenderer';
import type { SpriteDefinition } from './spriteData';

function makeSprite(): SpriteDefinition {
  return {
    width: 2,
    height: 2,
    pixels: [
      [1, 0],
      [0, 1],
    ],
    palette: ['', '#ffffff'],
  };
}

/** drawImage 呼び出しを記録するスタブ ctx */
function stubCtx() {
  const drawn: unknown[] = [];
  const ctx = {
    imageSmoothingEnabled: true,
    globalAlpha: 1,
    drawImage(src: unknown) {
      drawn.push(src);
    },
  } as unknown as CanvasRenderingContext2D;
  return { ctx, drawn };
}

describe('SpriteRenderer enhance', () => {
  it('は enhance 指定の有無で別キャッシュを生成する（描画が成功する）', () => {
    const r = new SpriteRenderer();
    const sprite = makeSprite();
    const { ctx, drawn } = stubCtx();
    r.drawSprite(ctx, sprite, 0, 0, 4);
    r.drawSprite(ctx, sprite, 0, 0, 4, { outline: true, shade: true });
    expect(drawn).toHaveLength(2);
  });
});
```

> 注: `OffscreenCanvas` が無い jsdom では内部で `document.createElement('canvas')` が使われる。`getContext('2d')` が利用可能であることは既存の `spriteData.test.ts` で前提済み。

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/ipne/presentation/sprites/spriteRenderer.test.ts`
Expected: FAIL（`drawSprite` が 6 引数目を受け付けない／コンパイルエラー）

- [ ] **Step 3: spriteRenderer.ts を変更**

`src/features/ipne/presentation/sprites/spriteRenderer.ts` の import 行の下に型を追加:

```ts
import { SpriteDefinition, createSprite } from './spriteData';
import { SpriteSheetDefinition, getAnimationFrameIndex } from './spriteSheet';
import { applyOutline, applyEdgeShading } from './dotEnhance';

/** 自動補正オプション（呼び出し側＝描画層が指定） */
export interface EnhanceOptions {
  /** 輪郭線を付与する */
  outline?: boolean;
  /** 縁陰影を付与する */
  shade?: boolean;
}

/** 補正フラグをキャッシュキー用の文字列に変換する */
function enhanceKey(enhance?: EnhanceOptions): string {
  return `${enhance?.outline ? 1 : 0}${enhance?.shade ? 1 : 0}`;
}
```

次に `getCachedCanvas` を以下のシグネチャ・本体に置換:

```ts
  private getCachedCanvas(
    sprite: SpriteDefinition,
    scale: number,
    enhance?: EnhanceOptions
  ): HTMLCanvasElement | OffscreenCanvas {
    const id = this.getSpriteId(sprite);
    const key = `${id}-${scale}-${enhanceKey(enhance)}`;

    let canvas = this.cache.get(key);
    if (canvas) return canvas;

    // 輪郭線（index 空間）→ ImageData 生成 → 縁陰影（RGB 空間）の順で補正
    const outlined = enhance?.outline ? applyOutline(sprite) : sprite;
    let imageData = createSprite(outlined.pixels, outlined.palette);
    if (enhance?.shade) {
      imageData = applyEdgeShading(imageData);
    }

    // 元サイズのキャンバスに ImageData を配置
    const srcCanvas = createCacheCanvas(sprite.width, sprite.height);
    const srcCtx = srcCanvas.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D;
    srcCtx.putImageData(imageData, 0, 0);

    // スケール済みキャンバスにニアレストネイバー拡大で描画
    const scaledWidth = Math.round(sprite.width * scale);
    const scaledHeight = Math.round(sprite.height * scale);
    canvas = createCacheCanvas(scaledWidth, scaledHeight);
    const ctx = canvas.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(srcCanvas, 0, 0, scaledWidth, scaledHeight);

    this.cache.set(key, canvas);
    return canvas;
  }
```

次に `drawSprite` に enhance 引数を追加:

```ts
  drawSprite(
    ctx: CanvasRenderingContext2D,
    sprite: SpriteDefinition,
    x: number,
    y: number,
    scale: number,
    enhance?: EnhanceOptions
  ): void {
    const canvas = this.getCachedCanvas(sprite, scale, enhance);
    ctx.drawImage(canvas, x, y);
  }
```

次に `drawAnimatedSprite` に enhance 引数を追加して転送:

```ts
  drawAnimatedSprite(
    ctx: CanvasRenderingContext2D,
    sheet: SpriteSheetDefinition,
    currentTime: number,
    x: number,
    y: number,
    scale: number,
    enhance?: EnhanceOptions
  ): void {
    const frameIndex = getAnimationFrameIndex(sheet, currentTime);
    this.drawSprite(ctx, sheet.sprites[frameIndex], x, y, scale, enhance);
  }
```

- [ ] **Step 4: index.ts に export を追加**

`src/features/ipne/presentation/sprites/index.ts` の `export { SpriteRenderer } from './spriteRenderer';` を以下に置換:

```ts
export { SpriteRenderer } from './spriteRenderer';
export type { EnhanceOptions } from './spriteRenderer';
export { applyOutline, applyEdgeShading } from './dotEnhance';
```

- [ ] **Step 5: テストと型チェックを実行して成功を確認**

Run: `npx jest src/features/ipne/presentation/sprites/spriteRenderer.test.ts && npm run typecheck`
Expected: PASS（既存の drawSprite 呼び出しは enhance 省略で互換）

- [ ] **Step 6: コミット**

```bash
git add src/features/ipne/presentation/sprites/spriteRenderer.ts src/features/ipne/presentation/sprites/spriteRenderer.test.ts src/features/ipne/presentation/sprites/index.ts
git commit -m "feat: IPNE SpriteRenderer に自動補正(EnhanceOptions)を実装"
```

## Task 8: 描画側で EnhanceOptions を付与（キャラのみ）

**Files:**
- Modify: `src/features/ipne/presentation/screens/render/drawPlayer.ts`
- Modify: `src/features/ipne/presentation/screens/render/drawEnemies.ts`

> プレイヤーは手描き対象のため輪郭のみ（`shade:false`）。敵は輪郭＋陰影（`shade:true`）。タイル描画（drawWorld）には付与しないため環境タイルは無補正のまま。

- [ ] **Step 1: drawPlayer に定数を追加**

`src/features/ipne/presentation/screens/render/drawPlayer.ts` の `import { drawGroundShadow } from './groundShadow';` の下に追加:

```ts
import type { EnhanceOptions } from '../../sprites';

/** プレイヤー補正：手描きの陰影を尊重し輪郭線のみ付与 */
const PLAYER_ENHANCE: EnhanceOptions = { outline: true, shade: false };
```

- [ ] **Step 2: drawPlayer の各 drawSprite に PLAYER_ENHANCE を付与**

`drawPlayer.ts` 内のプレイヤー本体スプライト描画呼び出し（通常時ブロックの攻撃・被弾・移動・アイドルの4箇所）について、`spriteRenderer.drawSprite(ctx, <frame>, playerDrawX, playerDrawY, spriteScale)` を `spriteRenderer.drawSprite(ctx, <frame>, playerDrawX, playerDrawY, spriteScale, PLAYER_ENHANCE)` に変更する。

対象の4呼び出し:
- 攻撃: `attackSheet.sprites[attackFrameIndex]`
- 被弾: `damageSprites[pDir]`
- 移動: `walkFrame`（Task 4 で導入した変数）
- アイドル: `idleSheet.sprites[idleFrameIndex]`

> 死亡アニメーション中の `playerSheet.sprites[0]` 描画には補正を付けない（赤変色オーバーレイと競合させないため、現状維持）。

- [ ] **Step 3: drawEnemies に定数を追加して付与**

`src/features/ipne/presentation/screens/render/drawEnemies.ts` の `import { drawGroundShadow } from './groundShadow';` の下に追加:

```ts
import type { EnhanceOptions } from '../../sprites';

/** 敵補正：輪郭線＋縁陰影 */
const ENEMY_ENHANCE: EnhanceOptions = { outline: true, shade: true };
```

通常スプライト描画の分岐を以下に変更:

```ts
    const enemyStateFrame = getEnemyStateFrame(enemy.type, enemy.state);
    if (enemyStateFrame) {
      spriteRenderer.drawSprite(ctx, enemyStateFrame, enemyDrawX, enemyDrawY, spriteScale, ENEMY_ENHANCE);
    } else {
      spriteRenderer.drawAnimatedSprite(ctx, enemySheet, now, enemyDrawX, enemyDrawY, spriteScale, ENEMY_ENHANCE);
    }
```

- [ ] **Step 4: 型チェックと描画テストを実行**

Run: `npm run typecheck && npx jest src/features/ipne/presentation/screens/render`
Expected: PASS

- [ ] **Step 5: 手動確認**

Run: `npm start`
確認: (1) プレイヤー・敵に輪郭線が付き背景から分離、(2) 敵に縁陰影で立体感、(3) 床/壁/アイテムには輪郭が付かない。

- [ ] **Step 6: コミット**

```bash
git add src/features/ipne/presentation/screens/render/drawPlayer.ts src/features/ipne/presentation/screens/render/drawEnemies.ts
git commit -m "feat: IPNE キャラ描画に自動補正を付与（タイルは対象外）"
```

- [ ] **Step 7: PR-2 の CI を通す**

Run: `npm run ci`
Expected: すべて成功

---

# PR-3: ドット手描き層

> このフェーズは芸術的なピクセル編集を含む。各方向のピクセル配列編集は、ビジュアルコンパニオン（`docs/superpowers/specs/` 作成時のプレビュー手法）または `npm start` で実物を見ながら反復する。本計画は「編集対象・手順・受け入れ基準（テスト）」を定義し、ピクセルの良し悪しは手動確認で担保する。

## Task 9: 左右ミラー脱却の不変条件テスト（Red 固定）

**Files:**
- Test: `src/features/ipne/presentation/sprites/playerSprites.demirror.test.ts`（新規）

- [ ] **Step 1: 不変条件テストを書く（最初は失敗想定）**

`src/features/ipne/presentation/sprites/playerSprites.demirror.test.ts`:

```ts
import { WARRIOR_SPRITES, THIEF_SPRITES } from './playerSprites';
import type { SpriteDefinition } from './spriteData';

/** pixels を左右反転した配列を返す */
function mirror(pixels: number[][]): number[][] {
  return pixels.map((row) => [...row].reverse());
}

/** 2つのスプライトのピクセルが完全一致するか */
function pixelsEqual(a: SpriteDefinition, b: SpriteDefinition): boolean {
  return JSON.stringify(a.pixels) === JSON.stringify(b.pixels);
}

describe('プレイヤー左右スプライトのミラー脱却', () => {
  it.each([
    ['warrior', WARRIOR_SPRITES],
    ['thief', THIEF_SPRITES],
  ])('%s の left の idle は right の単純ミラーではない', (_name, sprites) => {
    const left = sprites.left.sprites[0];
    const rightMirrored: SpriteDefinition = { ...sprites.right.sprites[0], pixels: mirror(sprites.right.sprites[0].pixels) };
    expect(pixelsEqual(left, rightMirrored)).toBe(false);
  });

  it.each([
    ['warrior', WARRIOR_SPRITES],
    ['thief', THIEF_SPRITES],
  ])('%s は全方向・全フレームが 32x32 を維持する', (_name, sprites) => {
    for (const dir of ['down', 'up', 'left', 'right'] as const) {
      for (const frame of sprites[dir].sprites) {
        expect(frame.width).toBe(32);
        expect(frame.height).toBe(32);
        expect(frame.pixels).toHaveLength(32);
        frame.pixels.forEach((row) => expect(row).toHaveLength(32));
      }
    }
  });

  it.each([
    ['warrior', WARRIOR_SPRITES],
    ['thief', THIEF_SPRITES],
  ])('%s はパレット範囲外の index を持たない', (_name, sprites) => {
    for (const dir of ['down', 'up', 'left', 'right'] as const) {
      for (const frame of sprites[dir].sprites) {
        const max = frame.palette.length - 1;
        frame.pixels.forEach((row) => row.forEach((v) => {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(max);
        }));
      }
    }
  });
});
```

- [ ] **Step 2: テストを実行して現状を確認**

Run: `npx jest src/features/ipne/presentation/sprites/playerSprites.demirror.test.ts`
Expected: 32x32・パレット範囲のテストは PASS、「単純ミラーではない」テストは **FAIL**（現状 left = mirror(right) のため）。この失敗が Task 10 のゴールを定義する。

- [ ] **Step 3: コミット（Red を記録）**

```bash
git add src/features/ipne/presentation/sprites/playerSprites.demirror.test.ts
git commit -m "test: IPNE プレイヤー左右ミラー脱却の不変条件テストを追加(Red)"
```

## Task 10: 戦士・盗賊の左右スプライトを描き分ける

**Files:**
- Modify: `src/features/ipne/presentation/sprites/playerSprites.ts`

> 現状 `left = mirror(right)`（`mirrorPixels` 使用）。左右で武器/装備の持ち手・髪の流れを描き分け、個性を付与する。idle ＋ 歩行2枚（walk1, walk2）を対象とする。

- [ ] **Step 1: 左向きピクセル定義をミラー由来から独立配列に切り出す**

`playerSprites.ts` で戦士・盗賊の left 系ピクセル（例: `warriorLeftIdle`, `warriorLeftWalk1`, `warriorLeftWalk2`, `warriorLeftMid` および thief 同様）が `mirrorPixels(...)` で定義されている箇所を、`clonePixels(mirrorPixels(...))` で初期値を作り、その後 `applyPixelEdits` で持ち手・髪などの差分を加える形に変更する。

`pixelOps` の既存 API（`clonePixels` / `applyPixelEdits`）を使用する。例（戦士・左・idle、剣の持ち手を左手側へ寄せ髪を左に流す差分。座標・index は実物を見て調整）:

```ts
// 左向きは右向きミラーを土台に、左右非対称の差分を加えて個性化する
const warriorLeftIdle = applyPixelEdits(mirrorPixels(warriorRightIdle), [
  // 例: 剣の柄頭ハイライトを左手側に移すなどの差分（実物を見て確定）
  { x: 9, y: 18, value: 6 },
  { x: 10, y: 18, value: 8 },
]);
```

> ピクセル座標・index は `npm start` のプレビューを見ながら確定する。重要なのは「left が right の単純ミラーと一致しなくなる」差分が入ること。idle・walk1・walk2 の3フレーム × 戦士/盗賊 = 6 箇所に最低1つずつ差分を入れる。

- [ ] **Step 2: ミラー脱却テストが通ることを確認**

Run: `npx jest src/features/ipne/presentation/sprites/playerSprites.demirror.test.ts`
Expected: すべて PASS（「単純ミラーではない」も緑）

- [ ] **Step 3: 手動確認**

Run: `npm start`
確認: 戦士・盗賊が左右で見分けられ、装備の持ち手が自然。32x32 内に収まり破綻なし。

- [ ] **Step 4: コミット**

```bash
git add src/features/ipne/presentation/sprites/playerSprites.ts
git commit -m "feat: IPNE 戦士・盗賊の左右スプライトを描き分け個性化"
```

## Task 11: 上・下スプライトのディテール作り込み

**Files:**
- Modify: `src/features/ipne/presentation/sprites/playerSprites.ts`

> 正面（down）・背面（up）の顔（目）・装備（剣/盾・ダガー/マント）の視認性を上げる。`applyPixelEdits` で局所修正する。輪郭線は自動補正（PLAYER_ENHANCE）で付くため、ここでは内部ディテールと陰影に集中する。

- [ ] **Step 1: down/up の idle に局所ディテール差分を加える**

`playerSprites.ts` の `warriorDownIdle` / `warriorUpIdle` / `thiefDownIdle` / `thiefUpIdle` に対し、`applyPixelEdits` で目のハイライト（index 10）・装備の明部（戦士 index 5/8、盗賊 index 5/10）を追加する。例（座標・index は実物を見て確定）:

```ts
// 目のきらめきと装備明部を加えて視認性を上げる
const warriorDownIdleDetailed = applyPixelEdits(warriorDownIdle, [
  { x: 13, y: 12, value: 10 }, // 左目ハイライト
  { x: 18, y: 12, value: 10 }, // 右目ハイライト
]);
```

> 既存の `warriorDownIdle` 等を直接書き換えるのではなく、詳細版を作って `WARRIOR_SPRITES.down` / 各シートのフレーム参照を詳細版に差し替える。歩行/攻撃/被弾フレームが idle 由来（`createVariant(warriorDownIdle, ...)`）の場合、土台を詳細版へ更新すると一括で反映される点に注意し、意図した範囲のみ反映させる。

- [ ] **Step 2: 構造不変条件テストを実行**

Run: `npx jest src/features/ipne/presentation/sprites/playerSprites.demirror.test.ts src/features/ipne/presentation/sprites/spriteData.test.ts`
Expected: PASS（32x32・パレット範囲を維持）

- [ ] **Step 3: 手動確認**

Run: `npm start`
確認: 正面・背面で顔と装備が判別しやすく、のっぺり感が解消。自動輪郭と二重にならず自然。

- [ ] **Step 4: コミット**

```bash
git add src/features/ipne/presentation/sprites/playerSprites.ts
git commit -m "feat: IPNE 戦士・盗賊の正面/背面ドットのディテールを強化"
```

- [ ] **Step 5: PR-3 の CI を通す**

Run: `npm run ci`
Expected: すべて成功

---

## 完了の定義（全 PR 共通）

- [ ] `npm run ci` がパス（lint:ci / typecheck / test:coverage / build）
- [ ] 新規純粋関数（motion / dotEnhance）のカバレッジ 90%+
- [ ] 歩行・待機・攻撃の動きが改善し、接地シャドウが付く
- [ ] 攻撃中・被弾中に bob が無効
- [ ] キャラに輪郭線＋（敵は）陰影が付き、環境タイルには付かない
- [ ] 戦士・盗賊の left が right の単純ミラーでない（テストで保証）

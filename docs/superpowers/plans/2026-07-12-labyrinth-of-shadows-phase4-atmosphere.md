# Labyrinth of Shadows Phase 4「雰囲気パス」Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Labyrinth of Shadows の空間の質感・照明を後処理（Bloom+Vignette）・石積みテクスチャ・トーチ炎で底上げし、「安っぽさ」を解消する。

**Architecture:** R3F は jsdom テスト不可のため、見た目を決める数値・生成ロジックを純粋モジュール（`lighting-config.ts` / `stone-texture.ts`）に切り出して TDD し、R3F 配線（`PostFx.tsx` / `TorchFlame.tsx` / マテリアル適用）は目視QAで担保する。石テクスチャは canvas 非依存の `Uint8Array` 生成にして jsdom でテスト可能にし、R3F 側で `THREE.DataTexture` に渡す。

**Tech Stack:** React 19 + TypeScript, react-three-fiber@9.6.1, three@0.185.1, @react-three/drei@10, @react-three/postprocessing + postprocessing（新規）, Jest 30 + SWC, Webpack 5。

## Global Constraints

- 応答・コメント・ドキュメントは日本語。コード（変数名・関数名）は英語可
- `any` 型禁止（`unknown` + 型ガード）。`var` 禁止・`const` 優先
- 名前付きエクスポートを優先（デフォルトエクスポート回避）
- 相対 import の `../` は2階層まで
- `domain/` は外部依存なし。本 spec の変更は `presentation/` と設定ファイルに閉じる
- three のバージョンは `0.185.1`、R3F は `9.6.1` に固定。postprocessing 系は peer 互換を検証してから固定
- fog 色は `#05040a`、トーチ色は `#ffb060`（現行値を起点に深化。路線変更しない）
- `prefers-reduced-motion` を尊重（アニメ・bloom 動的強度を抑制）
- CI 全パス必須: `npm run lint:ci && npm run typecheck && npm test && npm run build`
- 単一テスト実行は `npx jest <パターン>`（例: `npx jest lighting-config`）

---

### Task 1: 後処理ライブラリ導入とバージョン整合検証・webpack チャンク拡張

後続の R3F 後処理タスクの前提。互換性リスク（spec 第一リスク）をここで潰す。

**Files:**
- Modify: `package.json`（dependencies に追加）
- Modify: `webpack.config.ts:73`（`vendor-three` cacheGroup の test 拡張）

**Interfaces:**
- Consumes: なし
- Produces: `@react-three/postprocessing` の `EffectComposer` / `Bloom` / `Vignette`、`postprocessing` の型が import 可能になる

- [ ] **Step 1: 依存をインストール（R3F v9 / three 0.185 互換版）**

```bash
cd /workspaces/claym/local/cline-playground-for-frontend
npm install @react-three/postprocessing postprocessing
```

- [ ] **Step 2: peer 依存の互換を確認**

Run:
```bash
npm ls @react-three/postprocessing postprocessing three @react-three/fiber
```
Expected: 依存ツリーが解決され、`three@0.185.1` / `@react-three/fiber@9.6.1` と競合（`invalid`/`peer dep missing`）が出ないこと。競合が出た場合は互換バージョン（例: `@react-three/postprocessing@2.x` 系で R3F9 対応の版）へピン留めして再インストールし、`package.json` の該当バージョンを固定表記にする。

- [ ] **Step 3: webpack の vendor-three cacheGroup を拡張**

`webpack.config.ts` の 73 行目付近を編集:

```ts
        // three 系は 3D ゲームルートの遅延チャンク専用に分離（メイン初期ロードへの混入防止）
        three: {
          test: /[\\/]node_modules[\\/](three|@react-three|postprocessing)[\\/]/,
          name: 'vendor-three',
          priority: 30,
        },
```

（`postprocessing` ベースパッケージが `vendors` チャンクに落ちてメイン初期ロードを膨らませるのを防ぐ）

- [ ] **Step 4: 型チェックとビルドが通ることを確認**

Run: `npm run typecheck && npm run build`
Expected: PASS（新規依存が解決され、既存ビルドが壊れていない）

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json webpack.config.ts
git commit -m "chore: 後処理ライブラリ導入と vendor-three チャンク拡張

@react-three/postprocessing + postprocessing を追加（R3F9/three0.185 互換確認）。
postprocessing ベースパッケージを vendor-three チャンクに含めメイン初期ロード混入を防止。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: lighting-config.ts（純粋モジュール・照明/後処理パラメータ）

ムード色定数・トーチフリッカ合成・トーチ強度・Bloom/Vignette パラメータを一元管理する純関数群。R3F 各所がここを参照する。

**Files:**
- Create: `src/features/labyrinth-of-shadows/presentation/three/lighting-config.ts`
- Test: `src/features/labyrinth-of-shadows/presentation/three/__tests__/lighting-config.test.ts`

**Interfaces:**
- Consumes: なし
- Produces:
  - `MOOD`: `{ fog: string; fogDensity: number; ambient: string; ambientIntensity: number; torch: string }`（定数オブジェクト）
  - `torchFlicker(timeSec: number): number` — 多周波合成、概ね 0.0〜1.0 付近
  - `torchIntensity(flicker: number, reducedMotion: boolean): number` — reducedMotion 時は揺らぎ無しの一定値
  - `BLOOM_CONFIG`: `{ intensity: number; luminanceThreshold: number; luminanceSmoothing: number; mipmapBlur: boolean }`
  - `VIGNETTE_CONFIG`: `{ offset: number; darkness: number }`
  - `bloomIntensity(reducedMotion: boolean): number` — reducedMotion 時は控えめな固定値

- [ ] **Step 1: 失敗するテストを書く**

`src/features/labyrinth-of-shadows/presentation/three/__tests__/lighting-config.test.ts`:

```ts
import {
  MOOD,
  torchFlicker,
  torchIntensity,
  BLOOM_CONFIG,
  VIGNETTE_CONFIG,
  bloomIntensity,
} from '../lighting-config';

describe('lighting-config', () => {
  it('MOOD は現行路線（暗紫フォグ・橙トーチ）を維持する', () => {
    expect(MOOD.fog).toBe('#05040a');
    expect(MOOD.torch).toBe('#ffb060');
    expect(MOOD.fogDensity).toBeGreaterThan(0);
  });

  it('torchFlicker は決定論的で概ね 0〜1 の範囲に収まる', () => {
    for (let t = 0; t < 10; t += 0.37) {
      const v = torchFlicker(t);
      expect(v).toBeGreaterThanOrEqual(-0.2);
      expect(v).toBeLessThanOrEqual(1.2);
    }
    // 同一入力→同一出力
    expect(torchFlicker(3.14)).toBe(torchFlicker(3.14));
  });

  it('torchIntensity は reducedMotion で揺らぎのない一定値を返す', () => {
    const a = torchIntensity(torchFlicker(1), true);
    const b = torchIntensity(torchFlicker(2), true);
    expect(a).toBe(b); // フリッカに依らず一定
    // 通常時はフリッカで変動する
    expect(torchIntensity(0, false)).not.toBe(torchIntensity(1, false));
  });

  it('bloomIntensity は reducedMotion で通常時以下に抑制される', () => {
    expect(bloomIntensity(true)).toBeLessThanOrEqual(bloomIntensity(false));
  });

  it('BLOOM/VIGNETTE パラメータが妥当な値域', () => {
    expect(BLOOM_CONFIG.luminanceThreshold).toBeGreaterThan(0);
    expect(BLOOM_CONFIG.luminanceThreshold).toBeLessThan(1);
    expect(VIGNETTE_CONFIG.darkness).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest lighting-config`
Expected: FAIL（`Cannot find module '../lighting-config'`）

- [ ] **Step 3: 最小実装を書く**

`src/features/labyrinth-of-shadows/presentation/three/lighting-config.ts`:

```ts
/**
 * 照明・後処理のムードパラメータを一元管理する純粋モジュール。
 * R3F は jsdom テスト不可のため、見た目を決める数値をここに集約してテスト可能にする。
 * 現行の暗紫フォグ＋橙トーチ路線を「深化」させる（路線変更はしない）。
 */

/** 迷宮のムード色（現行値を起点に深化） */
export const MOOD = {
  /** 指数フォグ色（暗紫） */
  fog: '#05040a',
  /** フォグ密度（Phase1-3 の 0.11 を踏襲） */
  fogDensity: 0.11,
  /** 環境光色（石壁の寒色に寄せる） */
  ambient: '#3a4258',
  /** 環境光強度 */
  ambientIntensity: 0.35,
  /** トーチ火の橙 */
  torch: '#ffb060',
} as const;

/**
 * トーチの多周波フリッカ（GameController の既存合成式を抽出）。
 * 時刻 timeSec に対し決定論的。概ね 0.0〜1.0 付近を返す。
 */
export const torchFlicker = (timeSec: number): number =>
  Math.sin(timeSec * 3.7) * 0.3 +
  Math.sin(timeSec * 7.1) * 0.15 +
  Math.sin(timeSec * 11.3) * 0.05 +
  0.5;

/** トーチ点光源の基準強度（物理ベース照明準拠で高め） */
const TORCH_BASE_INTENSITY = 9;
/** フリッカによる強度振幅 */
const TORCH_FLICKER_AMP = 3;

/**
 * トーチ強度。reducedMotion 時は揺らぎを止めて一定値にする
 * （design-ui-ux-principles のマイクロアニメーション規約）。
 */
export const torchIntensity = (flicker: number, reducedMotion: boolean): number =>
  reducedMotion
    ? TORCH_BASE_INTENSITY + TORCH_FLICKER_AMP * 0.5
    : TORCH_BASE_INTENSITY + flicker * TORCH_FLICKER_AMP;

/** Bloom（発光体のにじみ）設定。壁・床は閾値を超えないため にじまない */
export const BLOOM_CONFIG = {
  intensity: 0.9,
  luminanceThreshold: 0.35,
  luminanceSmoothing: 0.3,
  mipmapBlur: true,
} as const;

/** Vignette（周辺減光）設定。閉塞感と視線集中 */
export const VIGNETTE_CONFIG = {
  offset: 0.3,
  darkness: 0.7,
} as const;

/** Bloom 強度。reducedMotion 時は控えめに固定 */
export const bloomIntensity = (reducedMotion: boolean): number =>
  reducedMotion ? 0.5 : BLOOM_CONFIG.intensity;
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest lighting-config`
Expected: PASS（5 テスト緑）

- [ ] **Step 5: Commit**

```bash
git add src/features/labyrinth-of-shadows/presentation/three/lighting-config.ts src/features/labyrinth-of-shadows/presentation/three/__tests__/lighting-config.test.ts
git commit -m "feat: 照明・後処理パラメータの純粋モジュールを追加

lighting-config.ts にムード色・トーチフリッカ・Bloom/Vignette 設定を集約。
reducedMotion 抑制ロジックを純関数化してテスト可能にする。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: stone-texture.ts（純粋モジュール・石積みピクセル生成）

石積みの color/roughness/normal ピクセルを `Uint8Array` に決定論的生成する純関数。canvas API 非依存で jsdom テスト可能。R3F 側が `THREE.DataTexture` に渡す。

**Files:**
- Create: `src/features/labyrinth-of-shadows/presentation/three/textures/stone-texture.ts`
- Test: `src/features/labyrinth-of-shadows/presentation/three/textures/__tests__/stone-texture.test.ts`

**Interfaces:**
- Consumes: なし
- Produces:
  - `type StoneKind = 'wall' | 'floor' | 'ceiling'`
  - `interface StoneTexture { color: Uint8Array; roughness: Uint8Array; normal: Uint8Array; size: number }`（各配列は `size*size*4`、RGBA）
  - `generateStoneTexture(opts: { size: number; seed: number; kind: StoneKind }): StoneTexture`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/labyrinth-of-shadows/presentation/three/textures/__tests__/stone-texture.test.ts`:

```ts
import { generateStoneTexture } from '../stone-texture';

describe('stone-texture', () => {
  const opts = { size: 32, seed: 7, kind: 'wall' as const };

  it('color/roughness/normal を size*size*4 の Uint8Array で返す', () => {
    const tex = generateStoneTexture(opts);
    expect(tex.size).toBe(32);
    expect(tex.color).toBeInstanceOf(Uint8Array);
    expect(tex.color.length).toBe(32 * 32 * 4);
    expect(tex.roughness.length).toBe(32 * 32 * 4);
    expect(tex.normal.length).toBe(32 * 32 * 4);
  });

  it('決定論的（同一シード→同一ピクセル）', () => {
    const a = generateStoneTexture(opts);
    const b = generateStoneTexture(opts);
    expect(Array.from(a.color)).toEqual(Array.from(b.color));
  });

  it('シードが違えば色パターンが変わる', () => {
    const a = generateStoneTexture({ ...opts, seed: 1 });
    const b = generateStoneTexture({ ...opts, seed: 2 });
    expect(Array.from(a.color)).not.toEqual(Array.from(b.color));
  });

  it('全チャンネルが 0〜255 の値域に収まりアルファは 255', () => {
    const tex = generateStoneTexture(opts);
    for (let i = 0; i < tex.color.length; i++) {
      expect(tex.color[i]).toBeGreaterThanOrEqual(0);
      expect(tex.color[i]).toBeLessThanOrEqual(255);
    }
    for (let i = 3; i < tex.color.length; i += 4) {
      expect(tex.color[i]).toBe(255); // アルファ
    }
  });

  it('normal マップの中央値は概ね (128,128,255) 付近（平坦面が上向き）', () => {
    const tex = generateStoneTexture(opts);
    // 青チャンネル（法線Z）が最も強いことを平均で確認
    let sumR = 0, sumB = 0;
    for (let i = 0; i < tex.normal.length; i += 4) {
      sumR += tex.normal[i];
      sumB += tex.normal[i + 2];
    }
    expect(sumB).toBeGreaterThan(sumR);
  });

  it('kind により基調色が変わる（wall と floor）', () => {
    const wall = generateStoneTexture({ ...opts, kind: 'wall' });
    const floor = generateStoneTexture({ ...opts, kind: 'floor' });
    expect(Array.from(wall.color)).not.toEqual(Array.from(floor.color));
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest stone-texture`
Expected: FAIL（`Cannot find module '../stone-texture'`）

- [ ] **Step 3: 最小実装を書く**

`src/features/labyrinth-of-shadows/presentation/three/textures/stone-texture.ts`:

```ts
/**
 * 石積みのプロシージャルテクスチャを Uint8Array（RGBA）に決定論的生成する純粋モジュール。
 * canvas API に依存しない（jsdom は canvas 2D の getImageData を標準実装しないため）。
 * R3F 側はこの配列を THREE.DataTexture に渡してマップとして供給する。
 */

/** 石テクスチャの種別（基調色・目地の強さを変える） */
export type StoneKind = 'wall' | 'floor' | 'ceiling';

/** 生成された石テクスチャ（各配列は size*size*4 の RGBA） */
export interface StoneTexture {
  color: Uint8Array;
  roughness: Uint8Array;
  normal: Uint8Array;
  size: number;
}

/** 種別ごとの基調色（RGB）と目地の暗さ */
const BASE: Record<StoneKind, { r: number; g: number; b: number; mortar: number }> = {
  wall: { r: 74, g: 82, b: 96, mortar: 0.45 },     // 冷たい青グレー
  floor: { r: 52, g: 54, b: 60, mortar: 0.55 },    // 湿った暗い石畳
  ceiling: { r: 30, g: 32, b: 40, mortar: 0.6 },   // より暗く
};

/** mulberry32: シード付き決定論的 PRNG（Math.random 非使用でテスト決定性を担保） */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** レンガの目地パターン（行ごとに半ブロックずらす） */
function isMortar(x: number, y: number, size: number): boolean {
  const brickH = size / 4; // 縦4段
  const brickW = size / 2; // 横2列
  const row = Math.floor(y / brickH);
  const offset = (row % 2) * (brickW / 2);
  const localX = (x + offset) % brickW;
  const localY = y % brickH;
  const line = Math.max(1, Math.floor(size / 32));
  return localX < line || localY < line;
}

export function generateStoneTexture(opts: {
  size: number;
  seed: number;
  kind: StoneKind;
}): StoneTexture {
  const { size, seed, kind } = opts;
  const base = BASE[kind];
  const rand = mulberry32(seed);
  const n = size * size * 4;
  const color = new Uint8Array(n);
  const roughness = new Uint8Array(n);
  const normal = new Uint8Array(n);

  // ピクセルごとの明度ノイズを先に生成（法線の勾配計算に使う）
  const lum = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    lum[i] = 0.85 + rand() * 0.3; // 0.85〜1.15 の粒状ムラ
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const flat = y * size + x;
      const mortar = isMortar(x, y, size);
      const shade = mortar ? base.mortar : lum[flat];

      color[idx] = Math.min(255, Math.round(base.r * shade));
      color[idx + 1] = Math.min(255, Math.round(base.g * shade));
      color[idx + 2] = Math.min(255, Math.round(base.b * shade));
      color[idx + 3] = 255;

      // 目地は粗く、石面はやや滑らか
      const rough = mortar ? 245 : 200 + Math.round((lum[flat] - 1) * 60);
      const rv = Math.max(0, Math.min(255, rough));
      roughness[idx] = rv;
      roughness[idx + 1] = rv;
      roughness[idx + 2] = rv;
      roughness[idx + 3] = 255;

      // 高さ勾配から法線を近似（目地で凹む）
      const hL = pixelHeight(lum, size, x - 1, y);
      const hR = pixelHeight(lum, size, x + 1, y);
      const hU = pixelHeight(lum, size, x, y - 1);
      const hD = pixelHeight(lum, size, x, y + 1);
      const mortarDip = mortar ? -0.5 : 0;
      const dx = (hL - hR) + mortarDip;
      const dy = (hU - hD) + mortarDip;
      normal[idx] = Math.max(0, Math.min(255, Math.round(128 + dx * 90)));
      normal[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + dy * 90)));
      normal[idx + 2] = 255; // Z（面法線）を最強に
      normal[idx + 3] = 255;
    }
  }

  return { color, roughness, normal, size };
}

/** 端をクランプして高さ（明度）を取得 */
function pixelHeight(lum: Float32Array, size: number, x: number, y: number): number {
  const cx = Math.max(0, Math.min(size - 1, x));
  const cy = Math.max(0, Math.min(size - 1, y));
  return lum[cy * size + cx];
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest stone-texture`
Expected: PASS（6 テスト緑）

- [ ] **Step 5: Commit**

```bash
git add src/features/labyrinth-of-shadows/presentation/three/textures/
git commit -m "feat: 石積みプロシージャルテクスチャの純粋生成器を追加

stone-texture.ts が color/roughness/normal を Uint8Array へ決定論的生成。
canvas 非依存で jsdom テスト可能。R3F 側で DataTexture に渡す。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: PostFx.tsx（Bloom + Vignette）を Canvas に組み込み

後処理を LabyrinthScene の `<Canvas>` 内に追加する。R3F 配線のため目視QA。

**Files:**
- Create: `src/features/labyrinth-of-shadows/presentation/three/PostFx.tsx`
- Modify: `src/features/labyrinth-of-shadows/presentation/three/LabyrinthScene.tsx`（PostFx を Canvas 内に追加）

**Interfaces:**
- Consumes: `BLOOM_CONFIG`, `VIGNETTE_CONFIG`, `bloomIntensity`（Task 2）
- Produces: `PostFx` コンポーネント（props: `{ reducedMotion: boolean }`）

- [ ] **Step 1: PostFx コンポーネントを作成**

`src/features/labyrinth-of-shadows/presentation/three/PostFx.tsx`:

```tsx
import React from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BLOOM_CONFIG, VIGNETTE_CONFIG, bloomIntensity } from './lighting-config';

/**
 * 後処理パス。発光体（アイテム・敵の目・出口ランプ・トーチ炎）だけが
 * luminanceThreshold を超えて Bloom でにじむ。壁・床は閾値未満のためにじまない。
 * Vignette で周辺を落として閉塞感を出す。
 */
export function PostFx({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity(reducedMotion)}
        luminanceThreshold={BLOOM_CONFIG.luminanceThreshold}
        luminanceSmoothing={BLOOM_CONFIG.luminanceSmoothing}
        mipmapBlur={BLOOM_CONFIG.mipmapBlur}
      />
      <Vignette offset={VIGNETTE_CONFIG.offset} darkness={VIGNETTE_CONFIG.darkness} />
    </EffectComposer>
  );
}
```

- [ ] **Step 2: LabyrinthScene に組み込む**

`LabyrinthScene.tsx` の import に追加:

```tsx
import { PostFx } from './PostFx';
```

`prefers-reduced-motion` を読む（`LabyrinthScene` 関数の先頭付近、既存 `usePointerLook` の近く）:

```tsx
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
```

`<GameController {...props} lookRef={lookRef} />` の直後（`</Canvas>` の内側）に追加:

```tsx
        <GameController {...props} lookRef={lookRef} />
        <PostFx reducedMotion={reducedMotion} />
```

- [ ] **Step 3: 型チェックとビルド**

Run: `npm run typecheck && npm run build`
Expected: PASS

- [ ] **Step 4: 目視QA（実ブラウザ）**

Run: `npm start`（別ターミナル）してブラウザで Labyrinth of Shadows を開く。
Expected: アイテム・敵・出口の発光が bloom でにじみ、画面周辺がわずかに暗い（vignette）。壁はにじまない。
（ヘッドレスはカメラ真下バグの教訓によりスクリーンショット誤読に注意。人間の目視を優先）

- [ ] **Step 5: Commit**

```bash
git add src/features/labyrinth-of-shadows/presentation/three/PostFx.tsx src/features/labyrinth-of-shadows/presentation/three/LabyrinthScene.tsx
git commit -m "feat: 後処理（Bloom+Vignette）をシーンに追加

発光体だけが bloom でにじみ、壁は閾値未満でにじまない。
prefers-reduced-motion 時は bloom 強度を抑制。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: 壁・床・天井に石積み DataTexture を適用

`stone-texture.ts` の出力を `THREE.DataTexture` にして MazeWalls / FloorCeiling のマテリアルへ適用する。

**Files:**
- Create: `src/features/labyrinth-of-shadows/presentation/three/textures/use-stone-texture.ts`（DataTexture 化フック）
- Modify: `src/features/labyrinth-of-shadows/presentation/three/MazeWalls.tsx`
- Modify: `src/features/labyrinth-of-shadows/presentation/three/FloorCeiling.tsx`

**Interfaces:**
- Consumes: `generateStoneTexture`, `StoneKind`（Task 3）
- Produces: `useStoneMaps(kind: StoneKind, seed?: number): { map: THREE.DataTexture; roughnessMap: THREE.DataTexture; normalMap: THREE.DataTexture }`

- [ ] **Step 1: DataTexture 化フックを作成**

`src/features/labyrinth-of-shadows/presentation/three/textures/use-stone-texture.ts`:

```ts
import { useMemo } from 'react';
import * as THREE from 'three';
import { generateStoneTexture, type StoneKind } from './stone-texture';

/** Uint8Array(RGBA) から繰り返しラップの DataTexture を生成 */
function toDataTexture(pixels: Uint8Array, size: number, srgb: boolean): THREE.DataTexture {
  const tex = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 石積みの color/roughness/normal を DataTexture 化して返す。
 * 生成は決定論的なので seed 固定で毎回同じ見た目になる。
 */
export function useStoneMaps(kind: StoneKind, seed = 1337) {
  return useMemo(() => {
    const size = 128;
    const t = generateStoneTexture({ size, seed, kind });
    return {
      map: toDataTexture(t.color, size, true),
      roughnessMap: toDataTexture(t.roughness, size, false),
      normalMap: toDataTexture(t.normal, size, false),
    };
  }, [kind, seed]);
}
```

- [ ] **Step 2: MazeWalls にテクスチャを適用**

`MazeWalls.tsx` の import に追加:

```tsx
import { useStoneMaps } from './textures/use-stone-texture';
```

`MazeWalls` 関数内で取得し、繰り返し回数を壁高さに合わせる:

```tsx
  const { map, roughnessMap, normalMap } = useStoneMaps('wall');
  // 壁1セルあたり縦2回繰り返して石のスケール感を出す
  useMemo(() => {
    [map, roughnessMap, normalMap].forEach((t) => t.repeat.set(1, WALL_HEIGHT / CELL_SIZE));
  }, [map, roughnessMap, normalMap]);
```

`<meshStandardMaterial>` を差し替え:

```tsx
      <meshStandardMaterial
        map={map}
        roughnessMap={roughnessMap}
        normalMap={normalMap}
        roughness={0.9}
        metalness={0.05}
      />
```

- [ ] **Step 3: FloorCeiling にテクスチャを適用**

`FloorCeiling.tsx` の import に追加:

```tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { useStoneMaps } from './textures/use-stone-texture';
```

`FloorCeiling` 関数内で床・天井のマップを取得し、迷路全体をタイルするよう繰り返す:

```tsx
  const floor = useStoneMaps('floor');
  const ceil = useStoneMaps('ceiling');
  useMemo(() => {
    Object.values(floor).forEach((t) => (t as THREE.Texture).repeat.set(width, depth));
    Object.values(ceil).forEach((t) => (t as THREE.Texture).repeat.set(width, depth));
  }, [floor, ceil, width, depth]);
```

床メッシュのマテリアルを差し替え:

```tsx
        <meshStandardMaterial map={floor.map} roughnessMap={floor.roughnessMap} normalMap={floor.normalMap} roughness={1} />
```

天井メッシュのマテリアルを差し替え:

```tsx
        <meshStandardMaterial map={ceil.map} roughnessMap={ceil.roughnessMap} normalMap={ceil.normalMap} roughness={1} />
```

- [ ] **Step 4: 型チェックとビルド**

Run: `npm run typecheck && npm run build`
Expected: PASS

- [ ] **Step 5: 目視QA（実ブラウザ）**

Run: `npm start` してブラウザで確認。
Expected: 壁・床・天井が石積み目地の質感を持ち、トーチ光で法線の凹凸が陰影として見える。フラット単色でない。

- [ ] **Step 6: Commit**

```bash
git add src/features/labyrinth-of-shadows/presentation/three/textures/use-stone-texture.ts src/features/labyrinth-of-shadows/presentation/three/MazeWalls.tsx src/features/labyrinth-of-shadows/presentation/three/FloorCeiling.tsx
git commit -m "feat: 壁・床・天井に石積み DataTexture を適用

stone-texture の Uint8Array を DataTexture 化し map/roughnessMap/normalMap に適用。
フラット単色を廃し石積みの質感と陰影を付与。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: トーチ炎メッシュ追加と照明の lighting-config 参照化

一人称手元の炎メッシュ（bloom 対象）を追加し、GameController のトーチ強度・LabyrinthScene の fog/ambient を lighting-config 参照に統一する。

**Files:**
- Create: `src/features/labyrinth-of-shadows/presentation/three/TorchFlame.tsx`
- Modify: `src/features/labyrinth-of-shadows/presentation/three/GameController.tsx:124-131,163`（トーチ強度・色を lighting-config 参照へ）
- Modify: `src/features/labyrinth-of-shadows/presentation/three/LabyrinthScene.tsx`（fog/ambient を MOOD 参照へ、TorchFlame 追加）

**Interfaces:**
- Consumes: `MOOD`, `torchFlicker`, `torchIntensity`（Task 2）
- Produces: `TorchFlame` コンポーネント（props: `{ reducedMotion: boolean }`）

- [ ] **Step 1: TorchFlame コンポーネントを作成**

`src/features/labyrinth-of-shadows/presentation/three/TorchFlame.tsx`:

```tsx
/* eslint-disable react/no-unknown-property */
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { MOOD, torchFlicker } from './lighting-config';

/**
 * 一人称の手元に見える小さな炎メッシュ。カメラ手前下にオフセット配置し、
 * 発光マテリアルで bloom の対象になる。reducedMotion 時は揺らぎを止める。
 */
export function TorchFlame({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    // カメラ手前やや下・右にオフセット（手に持つ松明のイメージ）
    const offset = new THREE.Vector3(0.35, -0.45, -0.9).applyQuaternion(camera.quaternion);
    mesh.position.copy(camera.position).add(offset);
    mesh.quaternion.copy(camera.quaternion);
    const flick = reducedMotion ? 0.5 : torchFlicker(state.clock.elapsedTime);
    mat.opacity = 0.7 + flick * 0.3;
    const s = 1 + (reducedMotion ? 0 : flick * 0.2);
    mesh.scale.set(s, s * 1.4, s);
  });

  return (
    <mesh ref={meshRef}>
      <coneGeometry args={[0.12, 0.3, 8]} />
      <meshBasicMaterial ref={matRef} color={MOOD.torch} transparent opacity={0.9} />
    </mesh>
  );
}
```

- [ ] **Step 2: GameController のトーチを lighting-config 参照へ**

`GameController.tsx` の import に追加:

```tsx
import { MOOD, torchFlicker, torchIntensity } from './lighting-config';
```

トーチ更新ブロック（124-131 行付近）を置き換え:

```tsx
    // トーチ点光源をカメラ位置へ。フリッカ・強度は lighting-config に委譲
    if (torchRef.current) {
      const flicker = torchFlicker(g.gTime / 1000);
      torchRef.current.position.set(g.player.x, EYE_HEIGHT, g.player.y);
      torchRef.current.intensity = torchIntensity(flicker, props.reducedMotion);
    }
```

戻り値のトーチ色を MOOD 参照へ（163 行）:

```tsx
  return <pointLight ref={torchRef} color={MOOD.torch} intensity={9} distance={8} decay={1.6} castShadow />;
```

`GameControllerProps` に `reducedMotion: boolean` を追加し、分割代入にも加える:

```tsx
export interface GameControllerProps {
  // ...既存フィールド...
  onAlert: (marker: AlertMarker) => void;
  reducedMotion: boolean;
}
```

- [ ] **Step 3: LabyrinthScene の fog/ambient を MOOD へ、TorchFlame を追加**

`LabyrinthScene.tsx` の import に追加:

```tsx
import { MOOD } from './lighting-config';
import { TorchFlame } from './TorchFlame';
```

fog / color / ambientLight を MOOD 参照に:

```tsx
        <fogExp2 attach="fog" args={[MOOD.fog, MOOD.fogDensity]} />
        <color attach="background" args={[MOOD.fog]} />
        <ambientLight color={MOOD.ambient} intensity={MOOD.ambientIntensity} />
```

`GameController` に `reducedMotion` を渡し、TorchFlame を追加:

```tsx
        <GameController {...props} lookRef={lookRef} reducedMotion={reducedMotion} />
        <TorchFlame reducedMotion={reducedMotion} />
        <PostFx reducedMotion={reducedMotion} />
```

- [ ] **Step 4: 型チェックとビルド**

Run: `npm run typecheck && npm run build`
Expected: PASS

- [ ] **Step 5: 既存テストの回帰確認**

Run: `npx jest labyrinth-of-shadows`
Expected: PASS（既存 240 テストが緑のまま。GameController の純関数抽出で回帰がない）

- [ ] **Step 6: 目視QA（実ブラウザ）**

Run: `npm start` してブラウザで確認。
Expected: 画面手前に揺らめく橙の炎が見え bloom でにじむ。トーチ光のフリッカが炎と同期。fog/ambient の寒暖対比が強まる。

- [ ] **Step 7: Commit**

```bash
git add src/features/labyrinth-of-shadows/presentation/three/TorchFlame.tsx src/features/labyrinth-of-shadows/presentation/three/GameController.tsx src/features/labyrinth-of-shadows/presentation/three/LabyrinthScene.tsx
git commit -m "feat: トーチ炎メッシュ追加と照明を lighting-config に統一

一人称手元に bloom 対象の炎メッシュを追加。トーチ強度・フリッカ・
fog/ambient を lighting-config 参照に統一し reducedMotion を尊重。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: 旧レイキャスト時代のデッドコード削除

3D 化で不要になった `getBrickColor`（brick-texture.ts）と `RENDER_CONFIG`（render-config.ts）を削除する。どちらも `index.ts` で再エクスポートされるだけで消費者ゼロ。

**Files:**
- Delete: `src/features/labyrinth-of-shadows/infrastructure/rendering/brick-texture.ts`
- Delete: `src/features/labyrinth-of-shadows/infrastructure/rendering/render-config.ts`
- Modify: `src/features/labyrinth-of-shadows/index.ts:27-28`（再エクスポート2行を削除）

**Interfaces:**
- Consumes: なし
- Produces: なし（削除のみ）

- [ ] **Step 1: 消費者ゼロを再確認**

Run:
```bash
grep -rn "getBrickColor\|RENDER_CONFIG" src/ | grep -v "index.ts\|brick-texture.ts\|render-config.ts"
```
Expected: 出力なし（再エクスポートと定義元以外に参照がない）

- [ ] **Step 2: ファイルと再エクスポートを削除**

```bash
git rm src/features/labyrinth-of-shadows/infrastructure/rendering/brick-texture.ts
git rm src/features/labyrinth-of-shadows/infrastructure/rendering/render-config.ts
```

`index.ts` の 27-28 行を削除:

```ts
export { getBrickColor } from './infrastructure/rendering/brick-texture';
export { RENDER_CONFIG } from './infrastructure/rendering/render-config';
```

- [ ] **Step 3: 型チェック・lint・ビルドで壊れないことを確認**

Run: `npm run typecheck && npm run lint:ci && npm run build`
Expected: PASS（未使用 import 残りや参照切れがない）

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: 旧レイキャスト時代のデッドコードを削除

getBrickColor(brick-texture.ts) と RENDER_CONFIG(render-config.ts) を削除。
3D 化で不要になり index.ts の再エクスポートのみで消費者ゼロだった。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: 最終検証（CI 全パス＋目視QA＋レビュー）

全変更を統合して品質ゲートを通す。

**Files:** なし（検証のみ）

- [ ] **Step 1: CI 全パイプラインを実行**

Run: `npm run ci`
Expected: PASS（lint:ci → typecheck → test → build 全緑）

- [ ] **Step 2: 実ブラウザ目視QAチェックリスト**

Run: `npm start` して Labyrinth of Shadows をプレイし以下を確認:
- [ ] 壁・床・天井が石積みの質感を持つ（フラット単色でない）
- [ ] アイテム・敵・出口の発光が bloom でにじむ／壁はにじまない
- [ ] 手元の炎が揺らめき bloom でにじむ
- [ ] vignette で画面周辺がわずかに暗い
- [ ] カメラが真下を向いていない（Phase1-2 の教訓）
- [ ] `prefers-reduced-motion: reduce` で炎・bloom の揺らぎが止まる（DevTools のレンダリング設定でエミュレート）
- [ ] フレームレートが体感で滑らか

- [ ] **Step 3: コードレビュー依頼**

`superpowers:requesting-code-review` でレビューを実施し、指摘を反映する。

- [ ] **Step 4: ブランチ完了処理**

`superpowers:finishing-a-development-branch` で PR 作成等の統合オプションを提示。

---

## 自己レビュー結果

- **spec カバレッジ**: 後処理（Task4）/ 石テクスチャ（Task3,5）/ 照明再調整・炎（Task2,6）/ デッドコード削除（Task7）/ webpack 拡張（Task1）/ reduced-motion（Task2,4,6）/ 非目標（計画に含めず）— 全てタスクに対応済み
- **プレースホルダ**: なし（全ステップに実コード・実コマンド）
- **型整合**: `generateStoneTexture` / `useStoneMaps` / `torchFlicker` / `torchIntensity` / `bloomIntensity` / `PostFx` / `TorchFlame` の署名が定義タスクと消費タスクで一致。`GameControllerProps.reducedMotion` を Task6 で追加し LabyrinthScene から供給
- **既知の実装時リスク**: (1) postprocessing の R3F9/three0.185 peer 互換（Task1 で検証・ピン留め）。(2) DataTexture の `colorSpace` API 名は three 0.185 準拠（旧 `encoding` ではない）。(3) bloom 閾値は発光体の emissiveIntensity（アイテム0.9/敵0.8-1.1/出口1.2/炎 basic）を見て目視調整が必要

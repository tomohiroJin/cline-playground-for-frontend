# Deep Sea Interceptor ビジュアル刷新 Phase 1 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 派手なネオン演出でも敵弾・敵・自弾が埋もれない「見やすさの足場」を作る（Phase 1: 描画基盤＋配色整理＋敵弾/当たり判定の視認性）。

**Architecture:** 既存の DOM + インライン SVG 描画を維持したまま、純粋ヘルパー `visuals.ts`（発光・当たり判定・敵弾コアの計算）を新設し、描画コンポーネントはそこを参照する。TDD 対象は純粋ヘルパーとパレット、描画は testing-library のスモークテストで担保。

**Tech Stack:** React 19, TypeScript, styled-components, Jest 30 + @testing-library/react, jsdom。

## Global Constraints

- 対象ディレクトリ: `src/features/deep-sea-interceptor/`。他 Feature を参照しない。
- `any` 型禁止（`unknown` + 型ガード）。`var` 禁止・`const` 優先。マジックナンバーは名前付き定数化。
- コメント/ドキュメントは日本語。命名: 変数/関数 camelCase、型/コンポーネント PascalCase、ファイル kebab-case（コンポーネントは PascalCase.tsx）。
- `EnemyConfig` の数値バランス（HP・速度・点数）と `EnemyType` は変更しない。
- 当たり判定半径は既存定義に一致させる: `Config.player.size * Config.player.hitboxRatio`（= 40 × 0.4 = 16）。直径ではなく半径。
- Conventional Commits（`feat:` / `test:` / `refactor:` 等）。`main` 直コミット禁止・作業ブランチ `feature/dsi-visual-overhaul-p1`。
- 検証コマンド（feature 単位の高速確認）: `npx jest src/features/deep-sea-interceptor` / 型: `npm run typecheck`。

---

## ファイル構成

**新規作成:**
- `src/features/deep-sea-interceptor/visuals.ts` — 純粋な描画計算ヘルパー（発光フィルタ文字列・当たり判定半径・敵弾コアサイズ）。
- `src/features/deep-sea-interceptor/__tests__/visuals.test.ts` — 上記のユニットテスト。
- `src/features/deep-sea-interceptor/components/EnemyBulletSprite.tsx` — 敵弾専用スプライト（白コア＋暖色グロー）。
- `src/features/deep-sea-interceptor/components/__tests__/EnemyBulletSprite.test.tsx` — スモークテスト。
- `src/features/deep-sea-interceptor/components/__tests__/PlayerSprite.test.tsx` — 当たり判定コア表示のスモークテスト。

**修正:**
- `src/features/deep-sea-interceptor/constants.ts` — `ColorPalette` に敵弾の役割色 `bullet` グループを追加。
- `src/features/deep-sea-interceptor/components/PlayerSprite.tsx` — 実当たり判定コア点＋リングを描画。
- `src/features/deep-sea-interceptor/components/BulletSprite.tsx` — 発光を `neonGlow` ヘルパー経由に統一。
- `src/features/deep-sea-interceptor/DeepSeaInterceptorGame.tsx:408-422` — インライン敵弾を `EnemyBulletSprite` に差し替え。
- `src/features/deep-sea-interceptor/styles.ts` — `GameGlobalStyles` に `prefers-reduced-motion` ガードと `pulse` keyframe を追加。

---

## Task 1: 純粋描画ヘルパー `visuals.ts`

**Files:**
- Create: `src/features/deep-sea-interceptor/visuals.ts`
- Test: `src/features/deep-sea-interceptor/__tests__/visuals.test.ts`

**Interfaces:**
- Consumes: `Config`（`./constants`）。
- Produces:
  - `NEON_FILTER_ID: string`（定数 `'dsiNeonGlow'`）
  - `type GlowIntensity = 'soft' | 'strong'`
  - `neonGlow(color: string, intensity?: GlowIntensity): string` — CSS `filter` 用の drop-shadow 文字列
  - `playerHitboxRadius(): number` — 実当たり判定半径（Config 由来）
  - `enemyBulletCoreSize(bulletSize: number): number` — 敵弾中心コアの直径

- [ ] **Step 1: 失敗するテストを書く**

`src/features/deep-sea-interceptor/__tests__/visuals.test.ts`:

```ts
import { neonGlow, playerHitboxRadius, enemyBulletCoreSize, NEON_FILTER_ID } from '../visuals';
import { Config } from '../constants';

describe('visuals', () => {
  describe('neonGlow', () => {
    test('色を含む drop-shadow フィルタ文字列を返す', () => {
      const result = neonGlow('#ff5544');
      expect(result).toContain('drop-shadow');
      expect(result).toContain('#ff5544');
    });

    test('strong は soft より大きいブラー半径を使う', () => {
      // 先頭の drop-shadow のブラー px 値を取り出して比較する
      const firstBlur = (s: string): number =>
        Number(/drop-shadow\(0 0 (\d+)px/.exec(s)?.[1] ?? '0');
      expect(firstBlur(neonGlow('#fff', 'strong'))).toBeGreaterThan(
        firstBlur(neonGlow('#fff', 'soft'))
      );
    });

    test('intensity 未指定時は soft と同じ', () => {
      expect(neonGlow('#0af')).toBe(neonGlow('#0af', 'soft'));
    });
  });

  describe('playerHitboxRadius', () => {
    test('Config の size × hitboxRatio（半径直接）と一致する', () => {
      expect(playerHitboxRadius()).toBe(
        Config.player.size * Config.player.hitboxRatio
      );
    });
  });

  describe('enemyBulletCoreSize', () => {
    test('弾サイズに比例し、最小 3 を下回らない', () => {
      expect(enemyBulletCoreSize(16)).toBeGreaterThanOrEqual(3);
      expect(enemyBulletCoreSize(16)).toBeLessThan(16);
      expect(enemyBulletCoreSize(2)).toBe(3);
    });
  });

  test('NEON_FILTER_ID は安定した文字列 id', () => {
    expect(NEON_FILTER_ID).toBe('dsiNeonGlow');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/visuals.test.ts`
Expected: FAIL（`Cannot find module '../visuals'`）

- [ ] **Step 3: 最小実装を書く**

`src/features/deep-sea-interceptor/visuals.ts`:

```ts
// ============================================================================
// Deep Sea Interceptor - 純粋描画ヘルパー（発光・当たり判定・敵弾コア）
// ============================================================================

import { Config } from './constants';

/** ネオングロー用 SVG フィルタの id（将来の共有 defs 用に固定） */
export const NEON_FILTER_ID = 'dsiNeonGlow';

/** グロー強度 */
export type GlowIntensity = 'soft' | 'strong';

/** グロー強度ごとの基準ブラー半径（px） */
const GLOW_BLUR_PX: Record<GlowIntensity, number> = { soft: 5, strong: 10 };

/**
 * ネオン発光の CSS filter 文字列を返す。
 * div / svg どちらの style.filter にも使える。二重の drop-shadow で
 * 中心の芯を残しつつ外側へにじませる。
 */
export const neonGlow = (color: string, intensity: GlowIntensity = 'soft'): string => {
  const blur = GLOW_BLUR_PX[intensity];
  return `drop-shadow(0 0 ${blur}px ${color}) drop-shadow(0 0 ${blur * 2}px ${color})`;
};

/**
 * 自機の実当たり判定半径を返す。
 * 衝突判定（collision.ts）は size × hitboxRatio を半径として使うため、それに一致させる。
 */
export const playerHitboxRadius = (): number =>
  Config.player.size * Config.player.hitboxRatio;

/** 敵弾中心の高輝度コアの直径。弾サイズに比例させつつ最小値を保証する */
export const enemyBulletCoreSize = (bulletSize: number): number =>
  Math.max(3, Math.round(bulletSize * 0.35));
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/visuals.test.ts`
Expected: PASS（全 6 テスト）

- [ ] **Step 5: コミット**

```bash
git add src/features/deep-sea-interceptor/visuals.ts src/features/deep-sea-interceptor/__tests__/visuals.test.ts
git commit -m "feat(deep-sea-interceptor): ネオン描画・当たり判定の純粋ヘルパーを追加"
```

---

## Task 2: 敵弾の役割色を `ColorPalette` に追加

**Files:**
- Modify: `src/features/deep-sea-interceptor/constants.ts`（`ColorPalette` 定義）
- Test: `src/features/deep-sea-interceptor/__tests__/visuals.test.ts`（追記）

**Interfaces:**
- Produces: `ColorPalette.bullet` = `{ enemyCore: string; enemyGlow: string; enemyEdge: string }`

- [ ] **Step 1: 失敗するテストを追記**

まず `visuals.test.ts` 冒頭の constants import を `ColorPalette` も含む形に変更（重複 import を避ける / `import/no-duplicates` 対策）:

```ts
import { Config, ColorPalette } from '../constants';
```

続いて `src/features/deep-sea-interceptor/__tests__/visuals.test.ts` の末尾に追記:

```ts
describe('ColorPalette.bullet（敵弾の役割色）', () => {
  test('敵弾はコア・グロー・縁の3色を持つ', () => {
    expect(ColorPalette.bullet.enemyCore).toBeDefined();
    expect(ColorPalette.bullet.enemyGlow).toBeDefined();
    expect(ColorPalette.bullet.enemyEdge).toBeDefined();
  });

  test('敵弾コアは高輝度（白系）で視認性を確保する', () => {
    expect(ColorPalette.bullet.enemyCore.toLowerCase()).toBe('#ffffff');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/visuals.test.ts`
Expected: FAIL（`ColorPalette.bullet` が `undefined` / 型エラー）

- [ ] **Step 3: 実装する**

`src/features/deep-sea-interceptor/constants.ts` の `ColorPalette` の型注釈と値を修正。型注釈に `bullet` を追加:

```ts
export const ColorPalette: {
  enemy: Record<EnemyType, string>;
  ui: Record<string, string>;
  particle: Record<string, string>;
  bullet: { enemyCore: string; enemyGlow: string; enemyEdge: string };
} = Object.freeze({
```

そして `particle: {...}` ブロックの直後（`Object.freeze` の閉じ括弧の前）に以下を追加:

```ts
  // 敵弾の役割色: 白コア＋暖色グロー＋濃い縁で背景・発光に埋もれさせない
  bullet: { enemyCore: '#ffffff', enemyGlow: '#ff5544', enemyEdge: '#a32020' },
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/visuals.test.ts`
Expected: PASS

- [ ] **Step 5: 型チェックとコミット**

```bash
npm run typecheck
git add src/features/deep-sea-interceptor/constants.ts src/features/deep-sea-interceptor/__tests__/visuals.test.ts
git commit -m "feat(deep-sea-interceptor): 敵弾の役割色（コア/グロー/縁）をパレットに追加"
```

---

## Task 3: 敵弾スプライト `EnemyBulletSprite` の切り出しと適用

**Files:**
- Create: `src/features/deep-sea-interceptor/components/EnemyBulletSprite.tsx`
- Test: `src/features/deep-sea-interceptor/components/__tests__/EnemyBulletSprite.test.tsx`
- Modify: `src/features/deep-sea-interceptor/DeepSeaInterceptorGame.tsx:408-422`

**Interfaces:**
- Consumes: `neonGlow`, `enemyBulletCoreSize`（`../visuals`）、`ColorPalette`（`../constants`）、`EnemyBullet`（`../types`）。
- Produces: `EnemyBulletSprite`（default export）— props `{ bullet: EnemyBullet }`。

- [ ] **Step 1: 失敗するスモークテストを書く**

`src/features/deep-sea-interceptor/components/__tests__/EnemyBulletSprite.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react';
import EnemyBulletSprite from '../EnemyBulletSprite';
import { EntityFactory } from '../../entities';

describe('EnemyBulletSprite', () => {
  test('敵弾を例外なく描画し、白コアを含む', () => {
    const bullet = EntityFactory.enemyBullet(100, 200, { x: 0, y: 4 });
    const { container } = render(<EnemyBulletSprite bullet={bullet} />);
    // ルート要素が存在する
    const root = container.firstChild as HTMLElement;
    expect(root).not.toBeNull();
    // 白コア（#ffffff / #fff / rgb(255,255,255)）を持つ子要素が存在する
    const html = container.innerHTML.toLowerCase();
    expect(html.includes('#fff') || html.includes('rgb(255, 255, 255)')).toBe(true);
  });

  test('弾の座標が left/top に反映される', () => {
    const bullet = EntityFactory.enemyBullet(120, 240, { x: 0, y: 4 });
    const { container } = render(<EnemyBulletSprite bullet={bullet} />);
    const root = container.firstChild as HTMLElement;
    // 中心 (120,240) からサイズ 16 の半分ずれた位置
    expect(root.style.left).toBe(`${120 - 8}px`);
    expect(root.style.top).toBe(`${240 - 8}px`);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/EnemyBulletSprite.test.tsx`
Expected: FAIL（`Cannot find module '../EnemyBulletSprite'`）

- [ ] **Step 3: コンポーネントを実装**

`src/features/deep-sea-interceptor/components/EnemyBulletSprite.tsx`:

```tsx
// ============================================================================
// Deep Sea Interceptor - 敵弾描画コンポーネント
// ============================================================================

import React, { memo } from 'react';
import { ColorPalette } from '../constants';
import { neonGlow, enemyBulletCoreSize } from '../visuals';
import type { EnemyBullet } from '../types';

/**
 * 敵弾スプライト。
 * 白コア＋暖色グローリング＋縁取りの二層構造で、背景やネオン発光に
 * 埋もれず「必ず見える弾」にする（見やすさ最優先）。
 */
const EnemyBulletSprite = memo(function EnemyBulletSprite({ bullet }: { bullet: EnemyBullet }) {
  const { enemyCore, enemyGlow, enemyEdge } = ColorPalette.bullet;
  const size = bullet.size;
  const coreSize = enemyBulletCoreSize(size);
  const coreOffset = (size - coreSize) / 2;

  return (
    <div
      style={{
        position: 'absolute',
        left: bullet.x - size / 2,
        top: bullet.y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${enemyGlow}, ${enemyEdge})`,
        border: `1px solid ${enemyEdge}`,
        filter: neonGlow(enemyGlow, 'soft'),
        boxSizing: 'border-box',
      }}
    >
      {/* 中心の高輝度コア */}
      <div
        style={{
          position: 'absolute',
          left: coreOffset,
          top: coreOffset,
          width: coreSize,
          height: coreSize,
          borderRadius: '50%',
          background: enemyCore,
        }}
      />
    </div>
  );
});

export default EnemyBulletSprite;
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/EnemyBulletSprite.test.tsx`
Expected: PASS

- [ ] **Step 5: ゲーム本体のインライン敵弾を差し替える**

`src/features/deep-sea-interceptor/DeepSeaInterceptorGame.tsx` の import 群（`import BulletSprite ...` の下, 23 行目付近）に追加:

```tsx
import EnemyBulletSprite from './components/EnemyBulletSprite';
```

同ファイルの敵弾レンダリング部（現状 408-422 行の `gd.enemyBullets.map(...)` ブロック全体）を以下に置換:

```tsx
        {gd.enemyBullets.map(b => (
          <EnemyBulletSprite key={b.id} bullet={b} />
        ))}
```

- [ ] **Step 6: feature 全体テストと型チェック**

Run: `npx jest src/features/deep-sea-interceptor && npm run typecheck`
Expected: PASS（既存テストも緑）

- [ ] **Step 7: コミット**

```bash
git add src/features/deep-sea-interceptor/components/EnemyBulletSprite.tsx \
        src/features/deep-sea-interceptor/components/__tests__/EnemyBulletSprite.test.tsx \
        src/features/deep-sea-interceptor/DeepSeaInterceptorGame.tsx
git commit -m "feat(deep-sea-interceptor): 敵弾を白コア＋グロー構造の専用スプライトに刷新"
```

---

## Task 4: 自機の当たり判定を可視化（PlayerSprite）

**Files:**
- Modify: `src/features/deep-sea-interceptor/components/PlayerSprite.tsx`
- Test: `src/features/deep-sea-interceptor/components/__tests__/PlayerSprite.test.tsx`

**Interfaces:**
- Consumes: `playerHitboxRadius`, `neonGlow`（`../visuals`）。
- Produces: `PlayerSprite`（既存 default export・props 不変 `{ x, y, opacity, shield }`）。当たり判定コアを追加描画。

- [ ] **Step 1: 失敗するスモークテストを書く**

`src/features/deep-sea-interceptor/components/__tests__/PlayerSprite.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react';
import PlayerSprite from '../PlayerSprite';
import { playerHitboxRadius } from '../../visuals';

describe('PlayerSprite', () => {
  test('当たり判定コア（data-testid=hitbox-core）を中心に描画する', () => {
    const { getByTestId } = render(
      <PlayerSprite x={200} y={300} opacity={1} shield={false} />
    );
    const core = getByTestId('hitbox-core');
    expect(core).toBeInTheDocument();
  });

  test('当たり判定リングの直径が実判定半径の2倍に一致する', () => {
    const { getByTestId } = render(
      <PlayerSprite x={200} y={300} opacity={1} shield={false} />
    );
    const ring = getByTestId('hitbox-ring');
    const expectedDiameter = playerHitboxRadius() * 2;
    expect(ring.style.width).toBe(`${expectedDiameter}px`);
    expect(ring.style.height).toBe(`${expectedDiameter}px`);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/PlayerSprite.test.tsx`
Expected: FAIL（`hitbox-core` が見つからない）

- [ ] **Step 3: PlayerSprite に当たり判定表示を追加**

`src/features/deep-sea-interceptor/components/PlayerSprite.tsx` を修正。まず import を追加:

```tsx
import React, { memo } from 'react';
import { playerHitboxRadius, neonGlow } from '../visuals';
```

次に、`</svg>` の直後（フラグメントを閉じる `</>` の直前）に当たり判定の可視化要素を追加:

```tsx
      {/* 実当たり判定の可視化: 薄いリング（真の判定範囲）＋ 中心の高輝度コア */}
      <div
        data-testid="hitbox-ring"
        style={{
          position: 'absolute',
          left: x - playerHitboxRadius(),
          top: y - playerHitboxRadius(),
          width: playerHitboxRadius() * 2,
          height: playerHitboxRadius() * 2,
          borderRadius: '50%',
          border: '1px solid rgba(120,220,255,0.35)',
          pointerEvents: 'none',
          opacity,
        }}
      />
      <div
        data-testid="hitbox-core"
        style={{
          position: 'absolute',
          left: x - 3,
          top: y - 3,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#eaffff',
          filter: neonGlow('#6cf', 'soft'),
          pointerEvents: 'none',
          opacity,
        }}
      />
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/PlayerSprite.test.tsx`
Expected: PASS

- [ ] **Step 5: 型チェックとコミット**

```bash
npm run typecheck
git add src/features/deep-sea-interceptor/components/PlayerSprite.tsx \
        src/features/deep-sea-interceptor/components/__tests__/PlayerSprite.test.tsx
git commit -m "feat(deep-sea-interceptor): 自機の実当たり判定をリング＋コアで可視化"
```

---

## Task 5: 自弾の発光統一と reduced-motion ガード

**Files:**
- Modify: `src/features/deep-sea-interceptor/components/BulletSprite.tsx`
- Modify: `src/features/deep-sea-interceptor/styles.ts`（`GameGlobalStyles`）
- Test: `src/features/deep-sea-interceptor/components/__tests__/BulletSprite.test.tsx`（新規）

**Interfaces:**
- Consumes: `neonGlow`（`../visuals`）。
- Produces: `BulletSprite`（既存 default export・props 不変 `{ bullet: Bullet }`）。発光を `neonGlow` 経由に統一。

- [ ] **Step 1: 失敗するスモークテストを書く**

`src/features/deep-sea-interceptor/components/__tests__/BulletSprite.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react';
import BulletSprite from '../BulletSprite';
import { EntityFactory } from '../../entities';

describe('BulletSprite', () => {
  test('通常弾を例外なく描画し、発光フィルタを持つ', () => {
    const bullet = EntityFactory.bullet(100, 200);
    const { container } = render(<BulletSprite bullet={bullet} />);
    const root = container.firstChild as HTMLElement;
    expect(root.style.filter).toContain('drop-shadow');
  });

  test('チャージ弾も描画できる', () => {
    const bullet = EntityFactory.bullet(100, 200, { charged: true });
    const { container } = render(<BulletSprite bullet={bullet} />);
    expect(container.firstChild).not.toBeNull();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/BulletSprite.test.tsx`
Expected: FAIL（現状 `filter` 未設定・`boxShadow` のみ）

- [ ] **Step 3: BulletSprite の発光を neonGlow に統一**

`src/features/deep-sea-interceptor/components/BulletSprite.tsx` を修正。import を追加し、`boxShadow` を `filter: neonGlow(...)` に置換:

```tsx
import React, { memo } from 'react';
import { neonGlow } from '../visuals';
import type { Bullet } from '../types';

/** プレイヤー弾のスプライト */
const BulletSprite = memo(function BulletSprite({ bullet }: { bullet: Bullet }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: bullet.x - bullet.size / 2,
        top: bullet.y - bullet.size / 2,
        width: bullet.size,
        height: bullet.size,
        borderRadius: '50%',
        background: bullet.charged
          ? 'radial-gradient(circle,#fff,#64c8ff,#06c)'
          : 'radial-gradient(circle,#fff,#64c8ff)',
        filter: neonGlow('#64c8ff', bullet.charged ? 'strong' : 'soft'),
      }}
    />
  );
});

export default BulletSprite;
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/BulletSprite.test.tsx`
Expected: PASS

- [ ] **Step 5: reduced-motion ガードと pulse keyframe を追加**

`src/features/deep-sea-interceptor/styles.ts` の `GameGlobalStyles` を以下に置換（`pulse` の追加と reduced-motion ガード）:

```tsx
/** グローバルアニメーション定義（WARNING演出等） */
export const GameGlobalStyles = createGlobalStyle`
  @keyframes warningPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.7; }
  }
  @keyframes warningBorder {
    0%, 100% { border-color: rgba(255,0,0,0.5); }
    50% { border-color: rgba(255,0,0,0.1); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.15); opacity: 0.25; }
  }
  /* 視差・過剰アニメを避ける設定では装飾アニメを停止（UI/UX ルール準拠） */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`;
```

- [ ] **Step 6: feature 全体テストと型チェック**

Run: `npx jest src/features/deep-sea-interceptor && npm run typecheck`
Expected: PASS（全緑）

- [ ] **Step 7: コミット**

```bash
git add src/features/deep-sea-interceptor/components/BulletSprite.tsx \
        src/features/deep-sea-interceptor/components/__tests__/BulletSprite.test.tsx \
        src/features/deep-sea-interceptor/styles.ts
git commit -m "feat(deep-sea-interceptor): 自弾発光をヘルパー統一しreduced-motionガードを追加"
```

---

## Task 6: Phase 1 総合検証

**Files:** なし（検証のみ）

- [ ] **Step 1: CI パイプライン全体を実行**

Run: `npm run ci`
Expected: lint:ci → typecheck → test:coverage → build がすべて PASS

- [ ] **Step 2: 手動確認の観点メモ（レビュー用・任意）**

`npm start` で以下を目視確認（環境がある場合のみ）:
- 敵弾が白コア＋暖色グローで背景に埋もれず見える
- 自機中心に当たり判定リング＋コアが表示される
- 自弾（シアン）と敵弾（暖色）が色で明確に分離している

- [ ] **Step 3: 未コミット差分がないことを確認**

Run: `git status`
Expected: `nothing to commit, working tree clean`

---

## 完了基準（Phase 1 DoD）

- [ ] `visuals.ts` の純粋ヘルパーにテストがあり通過
- [ ] `ColorPalette.bullet` の役割色が追加され、敵弾スプライトが参照している
- [ ] 敵弾が `EnemyBulletSprite`（白コア＋グロー）で描画される
- [ ] 自機の実当たり判定（半径 = size × hitboxRatio）がリング＋コアで可視化される
- [ ] 自弾の発光が `neonGlow` に統一されている
- [ ] `prefers-reduced-motion: reduce` で装飾アニメが停止する
- [ ] `npm run ci` がグリーン

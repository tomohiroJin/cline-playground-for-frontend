# IPNE エフェクト生成のファクトリー化 実装計画（Phase C）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `EffectManager.addEffect` の12ケース巨大switchを、`EffectType → 純粋ファクトリー` の registry（新規 `effectFactories.ts`）へ分離し、`addEffect` を薄い処理に縮小する（振る舞い不変）。

**Architecture:** 各 case 本体を「`GameEffect` を返す純粋関数」へ逐語移植し `EFFECT_FACTORIES` registry に登録。`addEffect` は id 採番 → registry 引き → push → 追従エフェクト再帰 → `enforceParticleLimit` の薄い処理になる。ATTACK_HIT→SCREEN_SHAKE の合成は `followUps` 記述子で表現。既存 `effectManager.test.ts` ＋ 決定的フィールド検証の補強で振る舞い不変を担保。

**Tech Stack:** TypeScript, Jest (SWC), Canvas 2D パーティクルエフェクト。

**設計の出典:** `docs/superpowers/specs/2026-06-15-ipne-effect-factories-design.md`

---

## 対象ファイルと責務

すべて `src/features/ipne/presentation/effects/` 配下。

| ファイル | 役割 | 本計画での扱い |
|---------|------|---------------|
| `effectFactories.ts` | 型（`EffectFactory`/`EffectFactoryContext`/`FollowUpEffect`/`EffectBuildResult`）と12ファクトリー＋`EFFECT_FACTORIES` registry | **新規**（Task 1） |
| `effectManager.test.ts`（220行） | 決定的フィールド検証を補強 | **変更**（Task 2） |
| `effectManager.ts`（505行） | `addEffect` を registry 駆動へ置換 | **変更**（Task 3） |
| `effectTypes.ts` / `particleSystem.ts` / `hitEffectScaling.ts` / `enemyDeath.ts` / `itemFeedback.ts` | 依存元 | **無変更** |

### 不変条件（厳守）

- `addEffect` は switch（現: factory ブロック）の **前で必ず** `effectIdCounter += 1` し id を採番。
- switch（現: factory ブロック）の **後で必ず** `this.enforceParticleLimit()` を呼ぶ（未処理タイプでも実行）。
- `LOW_HP_WARNING` は registry に登録しない（元の switch に case が無い＝未処理を保存）。
- `ENEMY_DEATH(enemyType 未指定)` は effect を生成しない（`EffectBuildResult.effect` は optional）。
- `ATTACK_HIT(hasShake)` は effect を push 後に SCREEN_SHAKE を追従追加（順序維持）。
- 公開 API（`EffectManager` のメソッド・`resetEffectIdCounter`・`effects/index.ts` 再公開分）は不変。

---

## Task 0: ベースライン確認

**Files:** なし（確認のみ）

- [ ] **Step 1: ブランチ確認**

Run: `git branch --show-current`
Expected: `refactor/ipne-effect-factories`

- [ ] **Step 2: effects テスト緑確認**

Run: `npx jest effects 2>&1 | tail -8`
Expected: PASS（`effectManager.test.ts` 等）

- [ ] **Step 3: typecheck ベースライン**

Run: `npm run typecheck 2>&1 | tail -3`
Expected: エラーなし

---

## Task 1: `effectFactories.ts` を作成

**Files:**
- Create: `src/features/ipne/presentation/effects/effectFactories.ts`

各ファクトリーは元の case 本体を逐語移植し、`this.effects.push({...})` を `return { effect: {...} }` に置換したもの。
`type` フィールドは各ファクトリー固定の `EffectType.XXX` を使う（元 switch の case 変数 `type` と等価）。

- [ ] **Step 1: `effectFactories.ts` を実装**

Create `effectFactories.ts`:

```typescript
/**
 * エフェクト生成ファクトリー
 *
 * EffectType ごとに GameEffect を構築する純粋関数群と、その registry を提供する。
 * EffectManager.addEffect はこの registry を引いてエフェクトを生成する。
 * パーティクル生成は particleSystem の共有関数へ委譲する（this に依存しない）。
 */
import { EffectType, EffectTypeValue, EffectOptions, GameEffect } from './effectTypes';
import {
  createRadialParticles,
  createRisingParticles,
  createSpiralParticles,
  createPulseParticles,
  createTrailParticles,
} from './particleSystem';
import { getHitEffectConfig } from './hitEffectScaling';
import { getEnemyDeathParticleConfig } from './enemyDeath';
import { getItemPickupEffectConfig } from './itemFeedback';

/** ファクトリーに渡す生成コンテキスト */
export interface EffectFactoryContext {
  id: string;
  x: number;
  y: number;
  now: number;
  options?: EffectOptions;
}

/** 追従エフェクト（合成）の記述子 */
export interface FollowUpEffect {
  type: EffectTypeValue;
  x: number;
  y: number;
  options?: EffectOptions;
}

/** ファクトリーの生成結果。effect は optional（ENEMY_DEATH の enemyType 未指定時は生成しない） */
export interface EffectBuildResult {
  effect?: GameEffect;
  followUps?: FollowUpEffect[];
}

/** エフェクト生成ファクトリー（純粋関数。this に依存しない） */
export type EffectFactory = (ctx: EffectFactoryContext) => EffectBuildResult;

const createAttackHitEffect: EffectFactory = ({ id, x, y, now, options }) => {
  const pl = options?.powerLevel ?? 1;
  const combo = options?.comboMultiplier ?? 1.0;
  const hitConfig = getHitEffectConfig(pl);
  const count = Math.round(hitConfig.particleCount * combo);
  const sizeMin = 2 * hitConfig.sizeMultiplier;
  const sizeMax = 4 * hitConfig.sizeMultiplier;
  const speedMin = 60 * hitConfig.speedMultiplier;
  const speedMax = 150 * hitConfig.speedMultiplier;

  const effect: GameEffect = {
    id,
    type: EffectType.ATTACK_HIT,
    x,
    y,
    startTime: now,
    duration: 300,
    particles: createRadialParticles(
      count, x, y,
      ['#ffffff', '#ffffcc', '#ffff99'],
      speedMin, speedMax,
      sizeMin, sizeMax,
      3.0
    ),
    ringRadius: hitConfig.hasShockwave ? 0 : undefined,
    ringMaxRadius: hitConfig.hasShockwave ? (8 + pl * 4) : undefined,
    flashAlpha: hitConfig.hasFlash ? 0.4 : undefined,
  };

  const followUps = hitConfig.hasShake
    ? [{ type: EffectType.SCREEN_SHAKE, x: 0, y: 0, options: { damage: 3 } }]
    : undefined;

  return { effect, followUps };
};

const createDamageEffect: EffectFactory = ({ id, x, y, now }) => ({
  effect: {
    id,
    type: EffectType.DAMAGE,
    x,
    y,
    startTime: now,
    duration: 400,
    particles: createRisingParticles(6, x, y, ['#ef4444', '#dc2626', '#ff6b6b'], 2, 4, 2.5),
  },
});

const createTrapDamageEffect: EffectFactory = ({ id, x, y, now }) => ({
  effect: {
    id,
    type: EffectType.TRAP_DAMAGE,
    x,
    y,
    startTime: now,
    duration: 350,
    particles: createRisingParticles(6, x, y, ['#dc2626', '#ef4444', '#f87171'], 2, 3, 2.8),
  },
});

const createTrapSlowEffect: EffectFactory = ({ id, x, y, now }) => ({
  effect: {
    id,
    type: EffectType.TRAP_SLOW,
    x,
    y,
    startTime: now,
    duration: 500,
    particles: createRadialParticles(8, x, y, ['#3b82f6', '#60a5fa', '#93c5fd'], 15, 40, 3, 5, 2.0),
  },
});

const createTrapTeleportEffect: EffectFactory = ({ id, x, y, now }) => ({
  effect: {
    id,
    type: EffectType.TRAP_TELEPORT,
    x,
    y,
    startTime: now,
    duration: 400,
    particles: createRadialParticles(10, x, y, ['#7c3aed', '#a78bfa', '#c4b5fd'], 30, 80, 2, 4, 2.5),
    ringRadius: 0,
    ringMaxRadius: 30,
  },
});

const createItemPickupEffect: EffectFactory = ({ id, x, y, now, options }) => {
  const itemType = options?.itemType;
  const itemConfig = itemType ? getItemPickupEffectConfig(itemType) : undefined;
  const pCount = itemConfig?.particleCount ?? 6;
  const pColors = itemConfig?.colors ?? ['#fbbf24', '#fcd34d', '#fef08a'];
  const pPattern = itemConfig?.pattern ?? 'rising';

  const particles =
    pPattern === 'spiral'
      ? createSpiralParticles(pCount, x, y, pColors, 80, 1.5)
      : pPattern === 'radial'
      ? createRadialParticles(pCount, x, y, pColors, 40, 100, 2, 4, 2.0)
      : createRisingParticles(pCount, x, y, pColors, 2, 3, 2.0);

  return {
    effect: {
      id,
      type: EffectType.ITEM_PICKUP,
      x,
      y,
      startTime: now,
      duration: 500,
      particles,
    },
  };
};

const createLevelUpEffect: EffectFactory = ({ id, x, y, now }) => ({
  effect: {
    id,
    type: EffectType.LEVEL_UP,
    x,
    y,
    startTime: now,
    duration: 1500,
    particles: createSpiralParticles(24, x, y, ['#fbbf24', '#fcd34d', '#fef08a', '#ffffff'], 100, 0.7),
    ringRadius: 0,
    ringMaxRadius: 40,
    flashAlpha: 0.4,
    flashColor: '#fbbf24',
  },
});

const createBossKillEffect: EffectFactory = ({ id, x, y, now }) => ({
  effect: {
    id,
    type: EffectType.BOSS_KILL,
    x,
    y,
    startTime: now,
    duration: 1200,
    particles: createRadialParticles(24, x, y, ['#dc2626', '#f97316', '#ffffff', '#fbbf24'], 80, 200, 3, 6, 0.8),
    flashAlpha: 1.0,
  },
});

const createEnemyAttackEffect: EffectFactory = ({ id, x, y, now, options }) => {
  const variant = options?.variant ?? 'melee';
  if (variant === 'boss') {
    return {
      effect: {
        id,
        type: EffectType.ENEMY_ATTACK,
        x,
        y,
        startTime: now,
        duration: 500,
        particles: createPulseParticles(16, x, y, ['#dc2626', '#ef4444', '#f87171', '#ffffff'], 100, 2.0),
      },
    };
  }
  if (variant === 'ranged') {
    return {
      effect: {
        id,
        type: EffectType.ENEMY_ATTACK,
        x,
        y,
        startTime: now,
        duration: 400,
        particles: createTrailParticles(8, x, y, 0, -1, ['#f97316', '#fdba74', '#fff7ed'], 120, 2.5),
      },
    };
  }
  // melee
  return {
    effect: {
      id,
      type: EffectType.ENEMY_ATTACK,
      x,
      y,
      startTime: now,
      duration: 300,
      particles: createRadialParticles(8, x, y, ['#ef4444', '#dc2626', '#ff6b6b'], 50, 120, 2, 4, 3.0),
    },
  };
};

const createScreenShakeEffect: EffectFactory = ({ id, now, options }) => {
  const intensity = Math.min(4, options?.damage ? options.damage * 0.5 : 2);
  return {
    effect: {
      id,
      type: EffectType.SCREEN_SHAKE,
      x: 0,
      y: 0,
      startTime: now,
      duration: 200,
      particles: [],
      shakeIntensity: intensity,
      shakeDecay: intensity / 0.2,
    },
  };
};

const createStageClearEffect: EffectFactory = ({ id, x, y, now, options }) => {
  const stageColors = [
    ['#60a5fa', '#93c5fd', '#ffffff'],
    ['#34d399', '#6ee7b7', '#ffffff'],
    ['#fbbf24', '#fcd34d', '#ffffff'],
    ['#f472b6', '#f9a8d4', '#ffffff'],
    ['#a78bfa', '#c4b5fd', '#fbbf24', '#ffffff'],
  ];
  const stageIdx = Math.min((options?.stageNumber ?? 1) - 1, stageColors.length - 1);
  return {
    effect: {
      id,
      type: EffectType.STAGE_CLEAR,
      x,
      y,
      startTime: now,
      duration: 1500,
      particles: createSpiralParticles(32, x, y, stageColors[stageIdx], 100, 0.7),
      flashAlpha: 1.0,
    },
  };
};

const createEnemyDeathEffect: EffectFactory = ({ id, x, y, now, options }) => {
  const enemyType = options?.enemyType;
  if (!enemyType) {
    return {}; // enemyType 未指定時はエフェクトを生成しない（元の挙動を保存）
  }
  const deathConfig = getEnemyDeathParticleConfig(enemyType);
  const combo = options?.comboMultiplier ?? 1.0;
  const count = Math.round(deathConfig.particleCount * combo);
  return {
    effect: {
      id,
      type: EffectType.ENEMY_DEATH,
      x,
      y,
      startTime: now,
      duration: deathConfig.duration,
      particles: createRadialParticles(
        count, x, y,
        deathConfig.colors,
        deathConfig.speedMin, deathConfig.speedMax,
        deathConfig.sizeMin, deathConfig.sizeMax,
        2.0
      ),
    },
  };
};

/**
 * EffectType → ファクトリーの registry。
 * LOW_HP_WARNING は元の switch に case が無く未処理のため登録しない（Partial）。
 */
export const EFFECT_FACTORIES: Partial<Record<EffectTypeValue, EffectFactory>> = {
  [EffectType.ATTACK_HIT]: createAttackHitEffect,
  [EffectType.DAMAGE]: createDamageEffect,
  [EffectType.TRAP_DAMAGE]: createTrapDamageEffect,
  [EffectType.TRAP_SLOW]: createTrapSlowEffect,
  [EffectType.TRAP_TELEPORT]: createTrapTeleportEffect,
  [EffectType.ITEM_PICKUP]: createItemPickupEffect,
  [EffectType.LEVEL_UP]: createLevelUpEffect,
  [EffectType.BOSS_KILL]: createBossKillEffect,
  [EffectType.ENEMY_ATTACK]: createEnemyAttackEffect,
  [EffectType.SCREEN_SHAKE]: createScreenShakeEffect,
  [EffectType.STAGE_CLEAR]: createStageClearEffect,
  [EffectType.ENEMY_DEATH]: createEnemyDeathEffect,
};
```

> 実装前に元 `effectManager.ts` の各 case（55-349行）と上記を照合し、色・速度・サイズ・duration・count・
> 条件分岐が逐語一致することを確認すること。`GameEffect` の任意フィールド（ringRadius/flashAlpha/flashColor/
> shakeIntensity/shakeDecay 等）が optional であることは既存コードのコンパイル実績で担保される。

- [ ] **Step 2: 型チェック**

Run: `npm run typecheck 2>&1 | tail -5`
Expected: エラーなし（registry はまだ未使用だが型は通る）

- [ ] **Step 3: lint**

Run: `npx eslint src/features/ipne/presentation/effects/effectFactories.ts 2>&1 | tail -10`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/features/ipne/presentation/effects/effectFactories.ts
git commit -m "feat: IPNE エフェクト生成ファクトリーと registry を新設

- 12種の EffectType を純粋ファクトリー関数に分離し EFFECT_FACTORIES に集約
- ATTACK_HIT は SCREEN_SHAKE 合成を followUps で表現
- LOW_HP_WARNING は未登録（未処理を保存）、ENEMY_DEATH は effect optional
- 後続タスクで addEffect がこの registry へ委譲する

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 既存テストに決定的フィールド検証を補強

**Files:**
- Modify: `src/features/ipne/presentation/effects/effectManager.test.ts`

リファクタ前の現挙動に対して、パーティクル位置以外の決定的フィールドを検証するテストを追加する。
これらは Task 3 のリファクタ後も緑のままでなければならない（特性化）。

- [ ] **Step 1: 補強テストを追加**

`effectManager.test.ts` の末尾（最後の `});`（describe 'EffectManager' の閉じ）の直前）に以下の describe を追加する。
先頭の import に `EffectType` と型 `EffectTypeValue`（`./effectTypes` から。テストの相対パスに合わせる）が無ければ追加する。
既存テストが `EffectManager`/`EffectType` をどこから import しているかを確認し、同じパスに揃えること。

```typescript
  describe('決定的フィールド検証（Phase C 特性化）', () => {
    it('ATTACK_HIT は duration 300 で、powerLevel 4 では shockwave/flash/shake を伴う', () => {
      const m = new EffectManager();
      m.addEffect(EffectType.ATTACK_HIT, 10, 20, 1000, { powerLevel: 4 });
      const effects = m.getEffects();
      const hit = effects.find((e) => e.type === EffectType.ATTACK_HIT);
      expect(hit?.duration).toBe(300);
      expect(hit?.ringMaxRadius).toBe(8 + 4 * 4);
      expect(hit?.flashAlpha).toBe(0.4);
      // hasShake により SCREEN_SHAKE が追従追加される
      expect(effects.some((e) => e.type === EffectType.SCREEN_SHAKE)).toBe(true);
    });

    it('各エフェクト型の duration が規定値である', () => {
      const cases: Array<[EffectTypeValue, number]> = [
        [EffectType.DAMAGE, 400],
        [EffectType.TRAP_DAMAGE, 350],
        [EffectType.TRAP_SLOW, 500],
        [EffectType.TRAP_TELEPORT, 400],
        [EffectType.ITEM_PICKUP, 500],
        [EffectType.LEVEL_UP, 1500],
        [EffectType.BOSS_KILL, 1200],
        [EffectType.STAGE_CLEAR, 1500], // stageNumber 未指定でも既定 1 で生成される
      ];
      for (const [type, duration] of cases) {
        const m = new EffectManager();
        m.addEffect(type, 0, 0, 1000);
        const e = m.getEffects().find((ef) => ef.type === type);
        expect(e?.duration).toBe(duration);
      }
    });

    it('SCREEN_SHAKE は particles が空で shakeIntensity を持つ', () => {
      const m = new EffectManager();
      m.addEffect(EffectType.SCREEN_SHAKE, 0, 0, 1000, { damage: 4 });
      const e = m.getEffects().find((ef) => ef.type === EffectType.SCREEN_SHAKE);
      expect(e?.particles.length).toBe(0);
      expect(e?.shakeIntensity).toBe(Math.min(4, 4 * 0.5));
    });

    it('LOW_HP_WARNING は addEffect してもエフェクトを追加しない（未処理を保存）', () => {
      const m = new EffectManager();
      m.addEffect(EffectType.LOW_HP_WARNING, 0, 0, 1000);
      expect(m.getEffectCount()).toBe(0);
    });

    it('ENEMY_DEATH は enemyType 未指定だとエフェクトを追加しない', () => {
      const m = new EffectManager();
      m.addEffect(EffectType.ENEMY_DEATH, 0, 0, 1000);
      expect(m.getEffectCount()).toBe(0);
    });
  });
```

> 注: 既存テストが `new EffectManager()` をどう生成し `EffectType`/`resetEffectIdCounter` をどう import しているか
> を確認し、スタイルを揃えること。`getEffects()`/`getEffectCount()` は既存の公開メソッド。

- [ ] **Step 2: 補強テストが現コード（リファクタ前）で緑であることを確認**

Run: `npx jest effectManager 2>&1 | tail -8`
Expected: PASS（既存＋補強テストすべて green。ここが baseline）

- [ ] **Step 3: 型チェック**

Run: `npm run typecheck 2>&1 | tail -3`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/features/ipne/presentation/effects/effectManager.test.ts
git commit -m "test: IPNE effectManager に決定的フィールド検証を補強（Phase C 特性化）

- duration/ringMaxRadius/flashAlpha/shakeIntensity・LOW_HP_WARNING 非追加・
  ENEMY_DEATH(enemyType無) 非追加・ATTACK_HIT の SCREEN_SHAKE 追従を検証
- リファクタ前後で振る舞い不変を担保する安全網

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `addEffect` を registry 駆動へ置換

**Files:**
- Modify: `src/features/ipne/presentation/effects/effectManager.ts`

- [ ] **Step 1: 現状の `addEffect`（50-354行）を読む**

特に switch 前の id 採番（51-52行）と switch 後の `this.enforceParticleLimit()`（353行）を確認する。

- [ ] **Step 2: import を追加**

`effectManager.ts` の冒頭 import 群（8-20行）を整理する。
1. `EFFECT_FACTORIES` を import に追加:

```typescript
import { EFFECT_FACTORIES } from './effectFactories';
```

2. switch 本体を削除した結果、`effectManager.ts` で **不要になった import を削除**する。
   `createRadialParticles`/`createRisingParticles`/`createSpiralParticles`/`createPulseParticles`/
   `createTrailParticles`（particleSystem からの生成系）、`getHitEffectConfig`、`getEnemyDeathParticleConfig`、
   `getItemPickupEffectConfig` は addEffect 内でのみ使われているため、移植後は未使用になる見込み。
   ただし `updateParticles`/`drawParticles`（particleSystem）は `update`/`draw` で使うため残す。
   `EffectType`/`EffectTypeValue`/`EffectOptions`/`GameEffect` は他メソッドでも使うため残す。
   → typecheck/lint の未使用検出に従って正確に削除する。

- [ ] **Step 3: `addEffect` メソッド本体を置換**

現在の `addEffect`（51行の `effectIdCounter += 1;` から 354行のメソッド閉じ `}` まで）の本体を以下に置換:

```typescript
  addEffect(type: EffectTypeValue, x: number, y: number, now: number = Date.now(), options?: EffectOptions): void {
    // 未処理タイプ(LOW_HP_WARNING)でも id カウンタは進める（元の挙動を保存）
    effectIdCounter += 1;
    const id = `effect-${effectIdCounter}`;

    const factory = EFFECT_FACTORIES[type];
    if (factory) {
      const { effect, followUps } = factory({ id, x, y, now, options });
      // ENEMY_DEATH(enemyType 未指定) のように effect を生成しないケースを保存
      if (effect) {
        this.effects.push(effect);
      }
      // 合成: 親エフェクトを push してから追従(SCREEN_SHAKE)を追加（元の順序を維持）
      followUps?.forEach((f) => this.addEffect(f.type, f.x, f.y, now, f.options));
    }

    // 元と同じく factory ブロックの後で常に呼ぶ（未処理タイプでも実行）
    this.enforceParticleLimit();
  }
```

注意:
- `effectIdCounter` はモジュール変数（既存）。`enforceParticleLimit` は既存の private メソッド。両者は無変更。
- メソッドの JSDoc（42-49行）は残してよい。
- switch・各 case（54-350行）は完全に削除される。

- [ ] **Step 4: 補強テストを含む effectManager テストが緑であることを確認（振る舞い不変の証明）**

Run: `npx jest effectManager 2>&1 | tail -8`
Expected: PASS（既存＋Task 2 の補強テストすべて green）

- [ ] **Step 5: effects ディレクトリ全テスト＋levelUpEffect を確認**

Run: `npx jest effects levelUpEffect 2>&1 | tail -8`
Expected: PASS（`performance.test.ts`・`levelUpEffect.test.ts` 含む）

- [ ] **Step 6: 型チェック＆lint**

Run: `npm run typecheck 2>&1 | tail -3`（エラーなし）
Run: `npx eslint src/features/ipne/presentation/effects/ 2>&1 | tail -10`（エラーなし、未使用 import は削除）

- [ ] **Step 7: コミット**

```bash
git add src/features/ipne/presentation/effects/effectManager.ts
git commit -m "refactor: IPNE addEffect を effectFactories registry 駆動へ置換

- 12ケース巨大switchを EFFECT_FACTORIES 引きに置換し addEffect を薄い処理に縮小
- id 採番の位置・enforceParticleLimit の常時呼び出し・追従順序を逐語的に保存
- 不要になった particle/config 生成系の import を削除

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 最終検証

**Files:** なし（確認のみ）

- [ ] **Step 1: switch が消えたことを確認**

Run: `grep -n "switch\|case EffectType" src/features/ipne/presentation/effects/effectManager.ts || echo "(switch なし ✓)"`
Expected: `(switch なし ✓)`（addEffect から switch が消えている。update/draw 内の三項・if は残ってよい）

- [ ] **Step 2: IPNE 全テスト（回帰確認）**

Run: `npx jest ipne 2>&1 | tail -8`
Expected: PASS（IPNE 全スイート green）

- [ ] **Step 3: 型チェック**

Run: `npm run typecheck 2>&1 | tail -3`
Expected: エラーなし

- [ ] **Step 4: lint（警告ゼロ強制）**

Run: `npm run lint:ci 2>&1 | tail -10`
Expected: エラー・警告なし（exit 0）

---

## 完了の定義（Definition of Done）

- [ ] `effectFactories.ts` に 12 ファクトリーと `EFFECT_FACTORIES` registry がある
- [ ] `addEffect` が registry 駆動の薄い処理に縮小されている（id 採番位置を保存）
- [ ] `enforceParticleLimit()` が早期 return されず常に呼ばれる
- [ ] `ATTACK_HIT` の SCREEN_SHAKE 合成が `followUps` で再現され、追加順序が元と一致
- [ ] `LOW_HP_WARNING` が未処理（非追加・カウンタ加算のみ）、`ENEMY_DEATH(enemyType 無)` が非追加のまま保存
- [ ] `update`/`draw`/`getShakeOffset` は据え置き、公開 API 不変
- [ ] 既存＋補強テストが緑、決定的フィールドが検証されている
- [ ] `npx jest ipne` / `npm run typecheck` / `npm run lint:ci` 全パス

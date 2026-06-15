# IPNE エフェクト生成のファクトリー化 設計（Phase C）

- 日付: 2026-06-15
- 対象: `src/features/ipne/presentation/effects/effectManager.ts`
- 種別: リファクタリング（**振る舞い不変**・巨大 switch のファクトリー分離）
- 位置づけ: IPNE 包括リファクタリング・ロードマップの **Phase C**

## 1. 背景と目的

`effectManager.ts`（505行）の `EffectManager.addEffect`（50〜360行・約310行）は、
`EffectType` で分岐する **12 ケースの巨大 switch** になっている。各 case は
「設定値を組み立てて `GameEffect` を生成し `this.effects.push` する」純粋な構築ロジックで、
パーティクル生成は `particleSystem` の共有関数（`createRadialParticles` 等）に委譲済み。

新エフェクト種別の追加や個別エフェクトの調整のたびにこの巨大メソッドを編集する必要があり、
責務が一箇所に凝集している。IPNE には既に同型の解（`EnemyAiPolicyRegistry`：型→関数の registry、
Phase A で確認）があるため、同じパターンでファクトリー化する。

本作業の目的:

1. 各 case を **純粋なエフェクトファクトリー関数**へ切り出し、`EffectType → ファクトリー` の
   registry（`effectFactories.ts`）に集約する。
2. `addEffect` を **registry 引き + push + 追従エフェクト処理**の薄い処理（〜15行）に縮小する。
3. 公開 API・エフェクトの生成結果（振る舞い）を **一切変えない**。

### 非目標（YAGNI）

- `update` / `draw` / `getShakeOffset` 内の小さな型分岐（重力の有無、`LEVEL_UP` の strokeStyle、
  `SCREEN_SHAKE` のオフセット判定）は **据え置く**。これらは描画・更新ロジックに密着しており、
  生成ロジックとは別関心。本フェーズのスコープ外。
- パーティクル生成関数（`createRadialParticles` 等）・config ヘルパー（`getHitEffectConfig` 等）の変更。
- 新しいエフェクト種別の追加や既存エフェクトのパラメータ調整。

## 2. 現状調査の要点

- `addEffect(type, x, y, now = Date.now(), options?)` は **switch の前で必ず**
  `effectIdCounter += 1` と `id = \`effect-${effectIdCounter}\`` を行う（51-52行）。
- switch には **12 ケース**: `ATTACK_HIT`, `DAMAGE`, `TRAP_DAMAGE`, `TRAP_SLOW`, `TRAP_TELEPORT`,
  `ITEM_PICKUP`, `LEVEL_UP`, `BOSS_KILL`, `ENEMY_ATTACK`, `SCREEN_SHAKE`, `STAGE_CLEAR`, `ENEMY_DEATH`。
- **`EffectType` は13値**だが `LOW_HP_WARNING` は switch に **無く未処理**（default 句も無い）。
  → `addEffect(LOW_HP_WARNING, ...)` は **id カウンタだけ進めて何もしない**。この副作用も保存対象。
- `ATTACK_HIT` の case は `hitConfig.hasShake` 時に `this.addEffect(EffectType.SCREEN_SHAKE, 0, 0, now, { damage: 3 })`
  を**再帰呼び**する（合成）。先に ATTACK_HIT を push してから SCREEN_SHAKE を追加する順序。
- `addEffect` は switch の **後（353行）で常に** `this.enforceParticleLimit()`（private、496行）を呼ぶ。
  これは `total > MAX_PARTICLES(200) && effects.length > 1` の間、古いエフェクトを `shift()` で削除する。
  **未処理タイプ（LOW_HP_WARNING）でもこの呼び出しは走る**ため、ファクトリー化後も常に呼ぶ必要がある。
- 依存（ファクトリーへ渡す必要あり）: `createRadialParticles`/`createRisingParticles`/`createSpiralParticles`/
  `createPulseParticles`/`createTrailParticles`（particleSystem）, `getHitEffectConfig`,
  `getEnemyDeathParticleConfig`, `getItemPickupEffectConfig`。いずれもモジュール関数で `this` に依存しない。
- ファクトリーが触る状態は `this.effects.push`（生成結果）と `id`（採番済みを受け取る）のみ。
- 公開 API: `EffectManager` クラス（`addEffect`/`update`/`draw`/`getShakeOffset`/`clear`/`getEffectCount`/
  `getEffects`/`getTotalParticleCount`）と `resetEffectIdCounter`。`effects/index.ts` 経由で公開。
- 安全網: `effectManager.test.ts`（220行）が **型ごとのパーティクル数・振る舞い**を検証
  （ATTACK_HIT の powerLevel 0=4個/4=24個・コンボ倍率、ENEMY_DEATH の敵型別、SCREEN_SHAKE はパーティクルなし、
  STAGE_CLEAR の螺旋、パーティクル上限超過の削除、update の期限切れ削除 等）。
  ただし非パーティクルの決定的フィールド（duration/ringRadius/flashAlpha/shakeIntensity）は一部未検証。

## 3. ファクトリー化後の構造

### 新モジュール `effectFactories.ts`

```typescript
import { EffectType, EffectTypeValue, EffectOptions, GameEffect } from './effectTypes';
// particleSystem / config ヘルパーの import

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

// 各 case 本体を逐語移植したファクトリー関数（createAttackHitEffect 等）

/**
 * EffectType → ファクトリーの registry。
 * LOW_HP_WARNING は元の switch に case が無く未処理のため、ここにも登録しない（Partial）。
 */
export const EFFECT_FACTORIES: Partial<Record<EffectTypeValue, EffectFactory>> = {
  [EffectType.ATTACK_HIT]: createAttackHitEffect,
  [EffectType.DAMAGE]: createDamageEffect,
  // ... 12 ケース分
};
```

- 各ファクトリーは元の case 本体を **逐語移植**し、`this.effects.push({...})` の代わりに
  `return { effect: {...} }` を返す。`id`/`x`/`y`/`now`/`options` は ctx から受け取る。
- `ATTACK_HIT` ファクトリーは合成を `followUps` で表現:

```typescript
const createAttackHitEffect: EffectFactory = ({ id, x, y, now, options }) => {
  // ... hitConfig 計算と effect 構築（元の case 本体を逐語移植）
  const followUps = hitConfig.hasShake
    ? [{ type: EffectType.SCREEN_SHAKE, x: 0, y: 0, options: { damage: 3 } }]
    : undefined;
  return { effect, followUps };
};
```

### `addEffect` の置換

```typescript
addEffect(type: EffectTypeValue, x: number, y: number, now: number = Date.now(), options?: EffectOptions): void {
  // 元の挙動を保存: 未処理タイプ(LOW_HP_WARNING)でも id カウンタは進める
  effectIdCounter += 1;
  const id = `effect-${effectIdCounter}`;

  const factory = EFFECT_FACTORIES[type];
  if (factory) {
    const { effect, followUps } = factory({ id, x, y, now, options });
    // ENEMY_DEATH(enemyType 未指定) のように effect を生成しないケースを保存
    if (effect) this.effects.push(effect);
    // 合成: ATTACK_HIT を push してから追従(SCREEN_SHAKE)を追加（元の順序を維持）
    followUps?.forEach((f) => this.addEffect(f.type, f.x, f.y, now, f.options));
  }

  // 元と同じく switch(現: factory ブロック)の後で常に呼ぶ。未処理タイプでも実行される
  this.enforceParticleLimit();
}
```

> 重要: `enforceParticleLimit()` は **早期 return せず常に呼ぶ**こと。元の `addEffect` は switch の後
> （353行）で無条件に `this.enforceParticleLimit()` を呼んでおり、未処理タイプ(LOW_HP_WARNING)でも実行される。
> `if (!factory) return;` のように早期 return すると上限処理がスキップされ挙動が変わる。
> 追従エフェクトの再帰（SCREEN_SHAKE）はそれ自身の `enforceParticleLimit` を実行し、その後で外側の
> `addEffect` が再度 `enforceParticleLimit` を呼ぶ — この二重呼び出し順序も元と一致する。

### 依存方向（循環なし）

```
effectFactories.ts → particleSystem / hitEffectScaling / enemyDeath / itemFeedback / effectTypes
effectManager.ts   → effectFactories
```

`effectManager.ts` に残る `MAX_PARTICLES` 定数・`effectIdCounter`・`update`/`draw` 等はそのまま。

## 4. 安全網（振る舞い不変の証明）

パーティクルは `Math.random` 依存で位置が非決定的なため、Phase B のような全出力スナップショットは使えない。
代わりに既存テスト＋決定的フィールド検証で守る。

- **既存 `effectManager.test.ts` を全工程で緑に保つ**（型ごとのパーティクル数・振る舞い・上限・update）。
- **決定的フィールドのアサーションを補強する**（恒久）。各エフェクト型について、パーティクル位置以外の
  決定的な生成結果を `effectManager.test.ts` に追加検証する:
  - `ATTACK_HIT`: `duration === 300`、`hasShockwave` 時の `ringMaxRadius`、`hasFlash` 時の `flashAlpha`、
    `hasShake`（powerLevel 4 等）時に SCREEN_SHAKE が追従追加されること。
  - 各型の `duration`（DAMAGE=400, TRAP_DAMAGE=350 等）と `type` フィールド。
  - `SCREEN_SHAKE`: `shakeIntensity` が設定され particles が空であること。
  - `LOW_HP_WARNING`: `addEffect` してもエフェクトが追加されないこと（未処理の保存）。
- 加えて全工程で `npm run typecheck` を緑に保つ。

## 5. 検証手順（refactor-safely）

1. `effectFactories.ts` を作成し、12 ケースのファクトリーと registry を実装（各 case を逐語移植）。
2. 既存テストの補強（決定的フィールド検証）を追加。
3. `addEffect` を registry 駆動へ置換。
4. 各ステップで以下を実行:

```bash
npx jest effectManager levelUpEffect 2>&1 | tail -8
npm run typecheck
```

5. 最終確認: `npx jest effects`（effects ディレクトリ全テスト）/ `npx jest ipne` / `npm run lint:ci` 全パス。

### 完了の定義（Definition of Done）

- [ ] `effectFactories.ts` に 12 ファクトリーと `EFFECT_FACTORIES` registry がある
- [ ] `addEffect` が registry 駆動の薄い処理に縮小されている（id カウンタ加算の位置・タイミングを保存）
- [ ] `ATTACK_HIT` の SCREEN_SHAKE 合成が `followUps` で再現され、追加順序が元と一致
- [ ] `LOW_HP_WARNING` が未処理（エフェクト非追加・カウンタ加算のみ）のまま保存されている
- [ ] `enforceParticleLimit()` が早期 return されず常に呼ばれる（未処理タイプでも実行・上限処理を保存）
- [ ] `update`/`draw`/`getShakeOffset` は据え置き、公開 API 不変
- [ ] 既存テスト＋補強テストが緑、決定的フィールドが検証されている
- [ ] `npx jest effects` / `npx jest ipne` / `npm run typecheck` / `npm run lint:ci` 全パス

## 6. リスクと緩和

| リスク | 緩和策 |
|--------|--------|
| case 移植時にパラメータ（色・速度・duration・count）を取り違える | 元 case を逐語移植。決定的フィールドのアサーションと既存パーティクル数テストで検出 |
| ATTACK_HIT→SCREEN_SHAKE の追加順序/id 採番が変わる | followUps を push 後に処理し元の順序を維持。補強テストで追従追加を検証 |
| LOW_HP_WARNING の未処理挙動を取りこぼす | Partial record で未登録にし、カウンタ加算は lookup 前に行う。補強テストで非追加を確認 |
| パーティクル上限処理の位置がずれる | 元 addEffect の該当処理を逐語維持。上限テストで担保 |
| 循環 import | effectManager → effectFactories の一方向を厳守 |

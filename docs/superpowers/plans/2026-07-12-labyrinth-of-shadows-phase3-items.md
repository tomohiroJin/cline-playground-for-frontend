# Labyrinth of Shadows Phase 3: アイテム再設計 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存6種アイテムをステルス土台（視線・音・追跡）に接続する — 罠=騒音罠、加速=能動ストック制（Eキー）、地図=敵位置5秒表示。

**Architecture:** ロジックは全て純粋関数層（`game-tick.ts` の `advanceGame` / `game-logic.ts` / `domain/`）に閉じる。騒音は「半径付き音源 `NoiseSource`」に一般化し、小石（半径5）と罠（半径8）が同じ敵反応経路（`respondToNoise` → search 遷移）を共有する。UI は小石の実装パターン（keysRef 仮想キー・HUDData・ControlBtn）を踏襲する。

**Tech Stack:** React 19 + TypeScript + R3F（表示層は変更最小）、Jest 30 + @testing-library/react

**Spec:** `docs/superpowers/specs/2026-07-12-labyrinth-of-shadows-phase3-items-design.md`

## Global Constraints

- 作業ディレクトリ: `/workspaces/claym/local/cline-playground-for-frontend`（feature ルート: `src/features/labyrinth-of-shadows/`。以下 Files のパスはこの feature ルート相対）
- ブランチ: `feature/labyrinth-of-shadows-phase3-items`（作成済み）。main 直コミット禁止
- バランス初期値（spec より verbatim）: 加速ストック上限 **2** ／ 地図の敵表示 **5000ms** ／ 罠の騒音半径 **8 セル** ／ 加速 10 秒・1.3 倍（現行維持）
- 罠の時間ペナルティ（-12秒）は**廃止**。コンボリセットは維持。chase 中の敵は騒音に反応しない（既存 respondToNoise の呼び出し位置がこれを保証済み — chase 分岐は respondToNoise を呼ばない）
- `any` 禁止・コメントは日本語・コミットメッセージは Conventional Commits（日本語）
- **地雷**: `domain/types.ts` の `SoundName` は `constants.ts` の `CONTENT.sounds` と手書き二重管理。本計画では新サウンドを追加しない（既存 `trap`/`speed` を音量違いで再利用）ため同期作業は不要
- `domain/models/item.ts` の `processItemPickup` は `game-logic.ts` の `updateItems` と重複実装（現在テストからのみ参照）。**両方を新仕様に同期させる**（Phase 2 教訓）
- R3F コンポーネント（GameController 等）は jsdom テスト不可。HUD/Controls は plain React なので RTL でテストする
- テスト実行: `npx jest src/features/labyrinth-of-shadows --silent 2>&1 | tail -20`（`forceExit: true` は仕様）

---

### Task 1: 騒音源の半径付き一般化（NoiseSource）

罠と小石で反応半径が異なるため、音源を `{x, y}` から `{x, y, radius}` に一般化する。挙動は不変（小石の半径5を音源自身が持つだけ）。

**Files:**
- Modify: `domain/services/enemy-strategy.ts`（NoiseSource 型追加・respondToNoise の半径参照変更）
- Modify: `domain/services/stone.ts`（戻り値に radius を付与）
- Modify: `game-logic.ts`（updateEnemies の noise 引数型）
- Modify: `game-tick.ts`（型の追従のみ）
- Test: `domain/__tests__/enemy-strategy.test.ts`（既存があれば追記、なければ既存テストの noise リテラルに radius を追加）

**Interfaces:**
- Produces: `export interface NoiseSource { readonly x: number; readonly y: number; readonly radius: number }`（enemy-strategy.ts からエクスポート。Task 2 以降が使用）
- Produces: `updateStoneProjectiles(g, dt): NoiseSource | undefined`
- Produces: `GameLogic.updateEnemies(g, dt, noise?: NoiseSource)`

- [ ] **Step 1: 失敗するテストを書く**

`domain/__tests__/` 配下の enemy-strategy 関連テスト（`grep -rln respondToNoise domain/__tests__ __tests__` で特定。テスト本体がなければ既存の noise を使うテストファイルに追記）:

```ts
// 半径は音源側が持つ: radius 外の敵は反応しない、radius 内は search へ遷移する
test('騒音は音源の radius に従う（半径外は不反応・半径内は search 遷移）', () => {
  // 敵と音源の距離 = 6 セル
  const far = makeEnemy({ x: 1.5, y: 1.5, aiState: 'patrol' });
  const params = baseParams(far, { noise: { x: 7.5, y: 1.5, radius: 5 } });
  new WandererStrategy().update(params);
  expect(far.aiState).toBe('patrol'); // 半径5 < 距離6 → 反応しない

  const near = makeEnemy({ x: 1.5, y: 1.5, aiState: 'patrol' });
  const params2 = baseParams(near, { noise: { x: 7.5, y: 1.5, radius: 8 } });
  new WandererStrategy().update(params2);
  expect(near.aiState).toBe('search'); // 半径8 ≥ 距離6 → search 遷移
});
```

（`makeEnemy`/`baseParams` は既存テストのヘルパー命名に合わせること。存在しない場合は既存テストのパラメータ構築コードをそのまま流用する）

- [ ] **Step 2: テスト失敗を確認**

Run: `npx jest src/features/labyrinth-of-shadows/domain --silent 2>&1 | tail -10`
Expected: 型エラーまたは FAIL（noise に radius プロパティが存在しない）

- [ ] **Step 3: 実装**

`domain/services/enemy-strategy.ts` — 型を追加し、`respondToNoise` の定数参照を音源の radius に差し替え:

```ts
/** 半径付きの音源。radius 内の敵が捜索状態で反応する */
export interface NoiseSource {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}
```

`EnemyUpdateParams` の noise を差し替え:

```ts
  /** このフレームに発生した音源（石の着地・罠の作動）。未発生なら undefined */
  readonly noise?: NoiseSource;
```

`respondToNoise` 内（`GAME_BALANCE.stone.NOISE_RADIUS` 参照を廃止）:

```ts
  if (distance(e.x, e.y, noise.x, noise.y) > noise.radius) return false;
```

`domain/services/stone.ts` — 戻り値に半径を付与:

```ts
const { SPEED, THROW_RANGE, NOISE_RADIUS } = GAME_BALANCE.stone;
```

```ts
export const updateStoneProjectiles = (
  g: GameState,
  dt: number
): NoiseSource | undefined => {
  let noise: NoiseSource | undefined;
  g.stoneProjectiles = g.stoneProjectiles.filter(p => {
    const step = SPEED * dt;
    const nx = p.x + p.dirX * step;
    const ny = p.y + p.dirY * step;
    p.traveled += step;
    if (!MazeService.isWalkable(g.maze, nx, ny) || p.traveled >= THROW_RANGE) {
      noise = { x: p.x, y: p.y, radius: NOISE_RADIUS }; // 壁にめり込まず手前で着地
      return false;
    }
    p.x = nx;
    p.y = ny;
    return true;
  });
  return noise;
};
```

（import に `import type { NoiseSource } from './enemy-strategy';` を追加）

`game-logic.ts` — `updateEnemies` のシグネチャを差し替え:

```ts
  updateEnemies(
    g: GameState,
    dt: number,
    noise?: NoiseSource
  ): { closest: number; nearest: Enemy | undefined; alerts: EnemyAlert[] } {
```

（import に `NoiseSource` を追加。`updateEnemyWithStrategy` の noise 引数の型も同様に差し替え）

既存テストで `noise: { x, y }` リテラルを渡している箇所があれば `radius: 5` を追加する。

- [ ] **Step 4: 全テストが通ることを確認**

Run: `npx jest src/features/labyrinth-of-shadows --silent 2>&1 | tail -10` および `npm run typecheck`
Expected: PASS / 型エラーなし

- [ ] **Step 5: コミット**

```bash
git add -A src/features/labyrinth-of-shadows
git commit -m "refactor: 騒音源を半径付き NoiseSource に一般化

- 反応半径を音源側が持つ形にし、罠（半径8）導入の下準備
- 小石の挙動は不変（半径5を音源に付与しただけ）"
```

---

### Task 2: 罠 = 騒音罠（時間ペナルティ廃止・敵を呼ぶ）

**Files:**
- Modify: `domain/constants.ts`（`trap.NOISE_RADIUS` 追加・`timing.TRAP_TIME_PENALTY` 削除）
- Modify: `constants.ts`（`CONFIG.timing.trapPenalty` 削除）
- Modify: `game-logic.ts`（updateItems: trap 分岐の書き換えと NoiseSource 返却）
- Modify: `game-tick.ts`（trap 騒音を敵更新へ配線）
- Modify: `domain/models/item.ts`（processItemPickup の trap 分岐を同期）
- Test: `__tests__/game-logic.test.ts`, `__tests__/game-tick.test.ts`, `domain/__tests__/item.test.ts`

**Interfaces:**
- Consumes: `NoiseSource`（Task 1）
- Produces: `GameLogic.updateItems(g): NoiseSource | undefined`（罠作動時のみ音源を返す）
- Produces: `GAME_BALANCE.trap.NOISE_RADIUS === 8`

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/game-logic.test.ts` の罠テスト（161行目付近の `withItem('trap', ...)` を使う既存テスト）を新仕様に書き換え、以下を追加:

```ts
test('罠を踏んでも時間は減らない（騒音罠化）', () => {
  const g = GameStateBuilder.easy().withPlayerAt(1.5, 1.5).withItem('trap', 1, 1).build();
  const before = g.time;
  GameLogic.updateItems(g);
  expect(g.time).toBe(before);
  expect(g.combo).toBe(0); // コンボリセットは維持
});

test('罠を踏むと半径8の騒音源を返す', () => {
  const g = GameStateBuilder.easy().withPlayerAt(1.5, 1.5).withItem('trap', 1, 1).build();
  const noise = GameLogic.updateItems(g);
  expect(noise).toEqual({ x: 1.5, y: 1.5, radius: 8 });
});

test('罠以外のアイテムでは騒音源を返さない', () => {
  const g = GameStateBuilder.easy().withPlayerAt(1.5, 1.5).withItem('key', 1, 1).build();
  expect(GameLogic.updateItems(g)).toBeUndefined();
});
```

（`GameStateBuilder.easy()` / `withPlayerAt` / `withItem` は既存ヘルパーの実名に合わせる — `__tests__/helpers/game-state-builder.ts` を確認して調整）

`__tests__/game-tick.test.ts` に統合テストを追加:

```ts
test('罠を踏むと騒音半径内の敵が search 状態でその地点へ向かう', () => {
  // 敵を罠から 6 セル（小石半径5の外・罠半径8の内）に配置して advanceGame を1tick
  const g = GameStateBuilder.easy()
    .withPlayerAt(1.5, 1.5)
    .withItem('trap', 1, 1)
    .withEnemy({ x: 7.5, y: 1.5, active: true, aiState: 'patrol' })
    .build();
  advanceGame(g, 16, NEUTRAL_INPUT);
  expect(g.enemies[0].aiState).toBe('search');
  expect(g.enemies[0].lastSeenX).toBeCloseTo(1.5);
});
```

（`NEUTRAL_INPUT` 等の入力定数・敵ビルダーは既存テストの流儀に合わせる。FIXED_MAZE_9X9 上で (7,1) が通路であることを fixed-maze.ts で確認し、必要なら通路セルに調整）

`domain/__tests__/item.test.ts` の trap テスト（48行目・54行目付近）を新仕様に書き換え:

```ts
test('罠は時間を減らさずコンボのみリセットする', () => {
  const result = processItemPickup('trap', 1, 1, baseContext);
  expect(result.stateChanges.time).toBeUndefined();
  expect(result.stateChanges.combo).toBe(0);
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npx jest src/features/labyrinth-of-shadows --silent 2>&1 | tail -15`
Expected: 新規・書き換えテストが FAIL（時間が減る／noise が返らない）

- [ ] **Step 3: 実装**

`domain/constants.ts` — `timing.TRAP_TIME_PENALTY` の2行（コメント含む）を削除し、`stone` ブロックの後に追加:

```ts
  trap: {
    /** 罠作動音に敵が反応する半径（セル）。小石(5)より大きい＝罠の音の方が大きい */
    NOISE_RADIUS: 8,
  },
```

`constants.ts` — `CONFIG.timing` から `trapPenalty: 12000` を削除:

```ts
  timing: { invinceDuration: 2500, msgDuration: 2000 },
```

`game-logic.ts` — `updateItems` を騒音返却型に変更:

```ts
  updateItems(g: GameState): NoiseSource | undefined {
    let trapNoise: NoiseSource | undefined;
    for (const item of g.items) {
      // （既存の radius 判定・got/near ガード・stone 満杯ガードはそのまま）
      ...
      switch (item.type) {
        ...
        case 'trap':
          g.combo = 0;
          // アイテム座標はセル整数なので中心 (+0.5) を音源にする
          trapNoise = {
            x: item.x + 0.5,
            y: item.y + 0.5,
            radius: GAME_BALANCE.trap.NOISE_RADIUS,
          };
          g.msg = '📦 罠だ！大きな音が鳴り響く…！';
          AudioService.play('trap', 0.6);
          break;
        ...
      }
      g.msgTimer = CONFIG.timing.msgDuration;
    }
    return trapNoise;
  },
```

`game-tick.ts` — 罠騒音を敵更新に配線（updateItems 呼び出しと石ブロックを差し替え）:

```ts
  const trapNoise = GameLogic.updateItems(g);

  // 石: 投擲入力 → 飛行更新 → 着地音（音源はこのフレームの敵更新に渡す）
  if (input.throwStone && tryThrowStone(g)) {
    AudioService.play('stoneThrow', 0.3);
  }
  const stoneNoise = updateStoneProjectiles(g, dt);
  if (stoneNoise) AudioService.play('stoneLand', 0.35);
  // 同一フレームに両方発生したら音の大きい罠を優先する
  const noise = trapNoise ?? stoneNoise;
```

（以降の `GameLogic.updateEnemies(g, dt, noise)` は変数名がそのままなら変更不要）

`domain/models/item.ts` — trap 分岐を同期（TRAP_TIME_PENALTY の import も削除）:

```ts
    case 'trap':
      return {
        stateChanges: {
          combo: 0,
        },
        events: [createSoundEvent('trap', 0.6)],
        message: '📦 罠だ！大きな音が鳴り響く…！',
      };
```

- [ ] **Step 4: 全テストが通ることを確認**

Run: `npx jest src/features/labyrinth-of-shadows --silent 2>&1 | tail -10` && `npm run typecheck`
Expected: PASS（`trapPenalty` 参照が残っていれば typecheck が検出する）

- [ ] **Step 5: コミット**

```bash
git add -A src/features/labyrinth-of-shadows
git commit -m "feat: 罠を騒音罠に再設計（時間ペナルティ廃止・敵を呼ぶ）

- 踏むと半径8セルの騒音が発生し敵が search 状態で殺到する
- 時間 -12 秒ペナルティを廃止、コンボリセットは維持
- 小石と同じ騒音反応経路（respondToNoise）を共有"
```

---

### Task 3: 加速 = 能動ストック制

**Files:**
- Modify: `domain/constants.ts`（`speedCharge.MAX_COUNT` 追加）
- Create: `domain/services/speed.ts`（発動ロジック）
- Modify: `types.ts`（GameState.speedCharges）
- Modify: `entity-factory.ts`（初期値 0）
- Modify: `game-logic.ts`（speed 分岐: 即時発動→ストック加算）
- Modify: `game-tick.ts`（TickInput.useSpeed と発動配線）
- Modify: `domain/models/item.ts`（speed 分岐の同期）
- Modify: `__tests__/helpers/game-state-builder.ts`（speedCharges 初期値）
- Test: `domain/__tests__/speed.test.ts`（新規）, `__tests__/game-logic.test.ts`, `__tests__/game-tick.test.ts`, `domain/__tests__/item.test.ts`

**Interfaces:**
- Produces: `GameState.speedCharges: number`
- Produces: `tryUseSpeedCharge(g: GameState): boolean`（domain/services/speed.ts）
- Produces: `TickInput.useSpeed?: boolean`（Task 5 の UI が設定する）
- Produces: `GAME_BALANCE.speedCharge.MAX_COUNT === 2`

- [ ] **Step 1: 失敗するテストを書く**

`domain/__tests__/speed.test.ts`（新規。`domain/__tests__/item.test.ts` の GameState 構築流儀を流用）:

```ts
import { tryUseSpeedCharge } from '../services/speed';
import { GameStateBuilder } from '../../__tests__/helpers/game-state-builder';

describe('tryUseSpeedCharge', () => {
  test('チャージがあれば消費して speedBoost が設定される', () => {
    const g = GameStateBuilder.easy().build();
    g.speedCharges = 2;
    expect(tryUseSpeedCharge(g)).toBe(true);
    expect(g.speedCharges).toBe(1);
    expect(g.speedBoost).toBe(10000);
  });

  test('チャージ0では発動できない', () => {
    const g = GameStateBuilder.easy().build();
    g.speedCharges = 0;
    expect(tryUseSpeedCharge(g)).toBe(false);
    expect(g.speedBoost).toBe(0);
  });

  test('隠れ中は発動できない', () => {
    const g = GameStateBuilder.easy().build();
    g.speedCharges = 1;
    g.hiding = true;
    expect(tryUseSpeedCharge(g)).toBe(false);
    expect(g.speedCharges).toBe(1);
  });

  test('加速効果中は再発動できない（無駄撃ち防止）', () => {
    const g = GameStateBuilder.easy().build();
    g.speedCharges = 2;
    g.speedBoost = 5000;
    expect(tryUseSpeedCharge(g)).toBe(false);
    expect(g.speedCharges).toBe(2);
  });
});
```

`__tests__/game-logic.test.ts` — 既存の「加速アイテムでspeedBoostが設定される」（219行目付近）を書き換え＋追加:

```ts
test('加速アイテムはストックに加算され即時発動しない', () => {
  const g = GameStateBuilder.easy().withPlayerAt(1.5, 1.5).withItem('speed', 1, 1).build();
  GameLogic.updateItems(g);
  expect(g.speedCharges).toBe(1);
  expect(g.speedBoost).toBe(0);
  expect(g.items[0].got).toBe(true);
});

test('ストック満杯（2個）なら加速アイテムはフィールドに残る', () => {
  const g = GameStateBuilder.easy().withPlayerAt(1.5, 1.5).withItem('speed', 1, 1).build();
  g.speedCharges = 2;
  GameLogic.updateItems(g);
  expect(g.speedCharges).toBe(2);
  expect(g.items[0].got).toBe(false);
});
```

`__tests__/game-tick.test.ts` に追加:

```ts
test('useSpeed 入力でチャージが消費され加速が発動する', () => {
  const g = GameStateBuilder.easy().build();
  g.speedCharges = 1;
  advanceGame(g, 16, { ...NEUTRAL_INPUT, useSpeed: true });
  expect(g.speedCharges).toBe(0);
  expect(g.speedBoost).toBeGreaterThan(0);
});
```

`domain/__tests__/item.test.ts` — speed テスト（75行目付近）を書き換え:

```ts
test('加速はチャージ+1で即時発動しない', () => {
  const result = processItemPickup('speed', 1, 1, baseContext);
  expect(result.stateChanges.speedBoost).toBeUndefined();
  expect(result.stateChanges.speedCharges).toBe(1);
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npx jest src/features/labyrinth-of-shadows --silent 2>&1 | tail -15`
Expected: FAIL（speedCharges が存在しない・speedBoost が即時設定される）

- [ ] **Step 3: 実装**

`domain/constants.ts` — `trap` ブロックの後に追加:

```ts
  speedCharge: {
    /** 加速チャージの最大ストック数 */
    MAX_COUNT: 2,
  },
```

`types.ts` — GameState に追加（`stones` の直後）:

```ts
  /** 加速チャージの所持数（Eキー/ボタンで発動） */
  speedCharges: number;
```

`entity-factory.ts` — `stones: GAME_BALANCE.stone.INITIAL_COUNT,` の直後に:

```ts
      speedCharges: 0,
```

`__tests__/helpers/game-state-builder.ts` — デフォルト state の `stones: 3,` の直後に `speedCharges: 0,` を追加。

`domain/services/speed.ts`（新規）:

```ts
/**
 * 加速チャージのドメインロジック
 * ストックした加速を任意タイミングで発動する（追われた瞬間に切る切り札）
 */
import type { GameState } from '../../types';
import { GAME_BALANCE } from '../constants';

/** 加速チャージを使う。所持なし・隠れ中・加速効果中は発動できない */
export const tryUseSpeedCharge = (g: GameState): boolean => {
  if (g.speedCharges <= 0 || g.hiding || g.speedBoost > 0) return false;
  g.speedCharges--;
  g.speedBoost = GAME_BALANCE.timing.SPEED_BOOST_DURATION;
  return true;
};
```

`game-logic.ts` — `updateItems` 内、stone 満杯ガードの直後に追加:

```ts
      // 加速チャージは満杯なら拾わずフィールドに残す
      if (item.type === 'speed' && g.speedCharges >= GAME_BALANCE.speedCharge.MAX_COUNT)
        continue;
```

speed 分岐を差し替え:

```ts
        case 'speed':
          g.speedCharges++;
          g.msg = `⚡ 加速チャージを拾った (${g.speedCharges}/${GAME_BALANCE.speedCharge.MAX_COUNT})`;
          AudioService.play('speed', 0.3);
          break;
```

`game-tick.ts` — `TickInput` に追加:

```ts
  /** 加速チャージの発動入力（Eキー/タッチボタン。省略時は false） */
  readonly useSpeed?: boolean;
```

石ブロックの直後に発動処理を追加（import: `import { tryUseSpeedCharge } from './domain/services/speed';` と `import { GAME_BALANCE } from './domain/constants';`）:

```ts
  // 加速チャージ: 発動は任意タイミング（chase 中でも使える切り札）
  if (input.useSpeed && tryUseSpeedCharge(g)) {
    g.msg = '⚡ 加速発動！ 10秒間スピードアップ！';
    g.msgTimer = GAME_BALANCE.timing.MESSAGE_DURATION;
    AudioService.play('speed', 0.4);
  }
```

`domain/models/item.ts` — `ItemPickupResult.stateChanges` に `readonly speedCharges?: number;` を追加し、speed 分岐を差し替え:

```ts
    case 'speed':
      return {
        stateChanges: { speedCharges: 1 },
        events: [createSoundEvent('speed', 0.3)],
        message: '⚡ 加速チャージを拾った',
      };
```

（SPEED_BOOST_DURATION の import が未使用になったら削除）

- [ ] **Step 4: 全テストが通ることを確認**

Run: `npx jest src/features/labyrinth-of-shadows --silent 2>&1 | tail -10` && `npm run typecheck`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add -A src/features/labyrinth-of-shadows
git commit -m "feat: 加速を能動ストック制に変更

- 拾うとチャージ（上限2）、useSpeed 入力で任意タイミング発動
- 隠れ中・効果中は発動不可、満杯時はフィールドに残す
- 発動効果は現行維持（10秒・1.3倍）"
```

---

### Task 4: 地図 = 索敵ツール化（敵位置5秒表示）

ミニマップは現在**全敵を常時表示**している。これを「探索済みセルにいる敵のみ」に絞り、地図取得から5秒間だけ全敵を表示する（地図に索敵価値を持たせる前提変更。索敵の主役は Phase 2 の !/? マーカーと立体音響）。

**Files:**
- Modify: `domain/constants.ts`（`items.ENEMY_REVEAL_DURATION` 追加）
- Modify: `types.ts`（GameState.enemyRevealTimer）
- Modify: `entity-factory.ts`（初期値 0）
- Modify: `game-logic.ts`（map 分岐でタイマー設定）
- Modify: `game-tick.ts`（タイマー減衰）
- Modify: `minimap-renderer.ts`（enemyReveal による表示制御）
- Modify: `__tests__/helpers/game-state-builder.ts`（enemyRevealTimer 初期値）
- Test: `__tests__/game-logic.test.ts`, `__tests__/game-tick.test.ts`, `__tests__/minimap-renderer.test.ts`（新規）

**Interfaces:**
- Consumes: `GameState`（Task 3 までの形）
- Produces: `GameState.enemyRevealTimer: number`（ms、>0 の間ミニマップに全敵表示）
- Produces: `MinimapData.enemyReveal: boolean`（呼び出し側は Task 5 で `g.enemyRevealTimer > 0` を渡す）
- Produces: `GAME_BALANCE.items.ENEMY_REVEAL_DURATION === 5000`

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/game-logic.test.ts` に追加:

```ts
test('地図取得で敵表示タイマーが5秒セットされる', () => {
  const g = GameStateBuilder.easy().withPlayerAt(1.5, 1.5).withItem('map', 1, 1).build();
  GameLogic.updateItems(g);
  expect(g.enemyRevealTimer).toBe(5000);
});
```

`__tests__/game-tick.test.ts` に追加:

```ts
test('敵表示タイマーは時間経過で減衰する', () => {
  const g = GameStateBuilder.easy().build();
  g.enemyRevealTimer = 100;
  advanceGame(g, 16, NEUTRAL_INPUT);
  expect(g.enemyRevealTimer).toBe(84);
});
```

`__tests__/minimap-renderer.test.ts`（新規。ctx をスタブして描画呼び出しを検証）:

```ts
import { MinimapRenderer, MinimapData } from '../minimap-renderer';
import { GameStateBuilder } from './helpers/game-state-builder';

/** arc 呼び出し座標を記録する CanvasRenderingContext2D スタブ */
const createCtxStub = () => {
  const arcs: Array<{ x: number; y: number }> = [];
  const ctx = {
    clearRect: jest.fn(), fillRect: jest.fn(), beginPath: jest.fn(), fill: jest.fn(),
    arc: jest.fn((x: number, y: number) => arcs.push({ x, y })),
    globalAlpha: 1, fillStyle: '', shadowColor: '', shadowBlur: 0,
  } as unknown as CanvasRenderingContext2D;
  return { ctx, arcs };
};

const makeData = (overrides: Partial<MinimapData>): MinimapData => {
  const g = GameStateBuilder.easy()
    .withEnemy({ x: 5.5, y: 5.5, active: true }) // 未探索セル (5,5) に敵
    .build();
  return {
    maze: g.maze, player: g.player, exit: g.exit, items: [], enemies: g.enemies,
    keys: 0, reqKeys: 2, explored: { '1,1': true }, time: 0, enemyReveal: false,
    ...overrides,
  };
};

describe('MinimapRenderer 敵表示', () => {
  test('通常時: 未探索セルの敵は描画されない', () => {
    const { ctx, arcs } = createCtxStub();
    MinimapRenderer.render(ctx, makeData({ enemyReveal: false }));
    // プレイヤー分の arc のみ（敵の arc = 5.5*CELL(4) = 22 が存在しない）
    expect(arcs.some(a => a.x === 22 && a.y === 22)).toBe(false);
  });

  test('地図効果中: 未探索セルの敵も描画される', () => {
    const { ctx, arcs } = createCtxStub();
    MinimapRenderer.render(ctx, makeData({ enemyReveal: true }));
    expect(arcs.some(a => a.x === 22 && a.y === 22)).toBe(true);
  });

  test('通常時でも探索済みセルの敵は描画される', () => {
    const { ctx, arcs } = createCtxStub();
    MinimapRenderer.render(ctx, makeData({ enemyReveal: false, explored: { '5,5': true } }));
    expect(arcs.some(a => a.x === 22 && a.y === 22)).toBe(true);
  });
});
```

（GameStateBuilder に `withEnemy` がなければ既存の敵構築ヘルパー名に合わせる。FIXED_MAZE_9X9 の (5,5) が通路でなければ通路セルへ調整し、期待座標 `セルx * 4` も追従させる）

- [ ] **Step 2: テスト失敗を確認**

Run: `npx jest src/features/labyrinth-of-shadows --silent 2>&1 | tail -15`
Expected: FAIL（enemyRevealTimer が存在しない・敵が常時描画される）

- [ ] **Step 3: 実装**

`domain/constants.ts` の `items` ブロックに追加:

```ts
    /** 地図取得後に敵位置をミニマップへ表示する時間（ms） */
    ENEMY_REVEAL_DURATION: 5000,
```

`types.ts` — GameState に追加（`speedCharges` の直後）:

```ts
  /** 敵位置表示の残り時間 ms（地図取得でセット、>0 の間ミニマップに全敵表示） */
  enemyRevealTimer: number;
```

`entity-factory.ts` と `game-state-builder.ts` に `enemyRevealTimer: 0,` を追加。

`game-logic.ts` — map 分岐を差し替え:

```ts
        case 'map':
          this.revealMap(g, item.x, item.y);
          g.enemyRevealTimer = GAME_BALANCE.items.ENEMY_REVEAL_DURATION;
          g.msg = '🗺️ 地図を発見！ 周囲の地形と敵の位置が見える！';
          AudioService.play('mapReveal', 0.4);
          break;
```

`game-tick.ts` — 冒頭のタイマー減衰群に追加:

```ts
  if (g.enemyRevealTimer > 0) g.enemyRevealTimer -= dt;
```

`minimap-renderer.ts` — `MinimapData` に追加:

```ts
  /** 地図効果中か（true の間は未探索セルの敵も表示する） */
  enemyReveal: boolean;
```

敵描画ループを差し替え:

```ts
    // 敵描画（パルスアニメーション付き）。
    // 索敵の主役は !/? マーカーと立体音響のため、通常時は探索済みセルにいる敵のみ表示。
    // 地図効果中（enemyReveal）は全敵を表示して索敵ツールとして機能させる
    const pulse = 0.5 + Math.sin(time * 6) * 0.5;
    for (const e of enemies) {
      if (!e.active) continue;
      if (!data.enemyReveal && !explored[`${Math.floor(e.x)},${Math.floor(e.y)}`]) continue;
      ctx.beginPath();
      ctx.arc(e.x * CELL, e.y * CELL, CELL / 2 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 0, 68, ${0.7 + pulse * 0.3})`;
      ctx.fill();
    }
```

（render の分割代入に `enemyReveal` を使わない場合は `data.enemyReveal` 参照で統一）

- [ ] **Step 4: 全テストが通ることを確認**

Run: `npx jest src/features/labyrinth-of-shadows --silent 2>&1 | tail -10` && `npm run typecheck`
Expected: PASS（この時点で GameController が `enemyReveal` 未指定なら型エラー → Task 5 で配線するため、暫定で `enemyReveal: false` を渡しておく）

- [ ] **Step 5: コミット**

```bash
git add -A src/features/labyrinth-of-shadows
git commit -m "feat: 地図を索敵ツール化（敵位置5秒表示・ミニマップ常時表示を廃止）

- 地図取得から5秒間、全敵位置をミニマップにリアルタイム表示
- 通常時の敵表示は探索済みセル内のみに制限（索敵は!/?マーカーと音が主役）
- 周囲公開（半径10）は従来通り維持"
```

---

### Task 5: 入力・HUD・タッチUIの結線

**Files:**
- Modify: `presentation/three/GameController.tsx`（readInput / hudEqual / minimap 呼び出し / HUD 生成）
- Modify: `types.ts`（HUDData に speedCharges / boostActive）
- Modify: `components/HUD.tsx`（⚡ ストック表示パネル）
- Modify: `components/Controls.tsx`（⚡ 発動ボタン）
- Modify: `LabyrinthOfShadowsGame.tsx`（HUD 初期値と Controls への props）
- Test: `components/__tests__/HUD.test.tsx`（新規）, `components/__tests__/Controls.test.tsx`（新規）

**Interfaces:**
- Consumes: `TickInput.useSpeed`（Task 3）、`GameState.speedCharges` / `enemyRevealTimer`（Task 3/4）
- Produces: `HUDData.speedCharges: number` / `HUDData.boostActive: boolean`
- キー割り当て: キーボード **E**（`keysRef.current['e']`、use-input が全キーを記録済みのため追加処理不要）、タッチは同じ仮想キー `'e'` を設定

- [ ] **Step 1: 失敗するテストを書く**

`components/__tests__/HUD.test.tsx`（新規）:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { HUD } from '../HUD';
import type { HUDData } from '../../types';

const baseHud: HUDData = {
  keys: 0, req: 2, maxL: 5, lives: 5, stamina: 100, time: 200, score: 0,
  eNear: 0, hide: false, energy: 100, highScore: 0, stones: 3, sprinting: false,
  speedCharges: 2, boostActive: false,
};

describe('HUD 加速チャージ表示', () => {
  test('⚡ とストック数が表示される', () => {
    render(<HUD h={baseHud} />);
    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
```

`components/__tests__/Controls.test.tsx`（新規）:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Controls } from '../Controls';

describe('Controls 加速ボタン', () => {
  test('押下で仮想キー e が立ち、離すと解除される', () => {
    const keysRef = { current: {} as Record<string, boolean> };
    render(
      <Controls keysRef={keysRef} hiding={false} energy={100} stamina={100}
        sprinting={false} speedCharges={1} boostActive={false} />
    );
    const btn = screen.getByText(/加速/).closest('button')!;
    fireEvent.pointerDown(btn);
    expect(keysRef.current['e']).toBe(true);
    fireEvent.pointerUp(btn);
    expect(keysRef.current['e']).toBe(false);
  });

  test('加速中はボタンが「加速中!」表示になる', () => {
    const keysRef = { current: {} as Record<string, boolean> };
    render(
      <Controls keysRef={keysRef} hiding={false} energy={100} stamina={100}
        sprinting={false} speedCharges={0} boostActive={true} />
    );
    expect(screen.getByText(/加速中/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npx jest src/features/labyrinth-of-shadows/components --silent 2>&1 | tail -10`
Expected: FAIL（HUDData に speedCharges がない・ボタンが存在しない）

- [ ] **Step 3: 実装**

`types.ts` — HUDData に追加（`stones` の直後）:

```ts
  /** 加速チャージの所持数 */
  speedCharges: number;
  /** 加速効果中か（ボタン点灯表示に使う） */
  boostActive: boolean;
```

`components/HUD.tsx` — 🪨 パネルの直後に追加:

```tsx
      <HUDPanel
        $borderColor="#b45309"
        $bg={h.boostActive ? 'rgba(180, 83, 9, 0.4)' : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⚡</span>
          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{h.speedCharges}</span>
        </div>
      </HUDPanel>
```

`components/Controls.tsx` — props に追加:

```ts
  /** 加速チャージの所持数（ボタンのラベル・活性表示に使う） */
  speedCharges: number;
  /** 加速効果中か（ボタン点灯表示に使う） */
  boostActive: boolean;
```

「隠れる」ボタンの直後（同じ縦並び div 内）に追加:

```tsx
      <ControlBtn
        $variant="action"
        onPointerDown={e => {
          e.preventDefault();
          keysRef.current['e'] = true;
        }}
        onPointerUp={e => {
          e.preventDefault();
          keysRef.current['e'] = false;
        }}
        onPointerLeave={e => {
          e.preventDefault();
          keysRef.current['e'] = false;
        }}
        style={{
          backgroundColor: boostActive ? '#b45309' : speedCharges > 0 ? 'rgba(180, 83, 9, 0.9)' : undefined,
          boxShadow: boostActive ? '0 0 12px #fbbf24' : undefined,
        }}
      >
        <div style={{ fontSize: '1.25rem' }}>⚡</div>
        <div style={{ fontSize: '0.75rem' }}>{boostActive ? '加速中!' : `加速 x${speedCharges}`}</div>
      </ControlBtn>
```

`presentation/three/GameController.tsx`:

readInput に追加（戻り値オブジェクト内）:

```ts
    useSpeed: k['e'] || false,
```

hudEqual に追加:

```ts
  a.speedCharges === b.speedCharges && a.boostActive === b.boostActive;
```

MinimapRenderer.render 呼び出しに追加（Task 4 の暫定 `enemyReveal: false` を差し替え）:

```ts
        enemyReveal: g.enemyRevealTimer > 0,
```

newHud に追加:

```ts
      speedCharges: g.speedCharges, boostActive: g.speedBoost > 0,
```

`LabyrinthOfShadowsGame.tsx` — HUD 初期値（30行目付近）に `speedCharges: 0, boostActive: false,` を追加し、171行目の Controls を差し替え:

```tsx
      <Controls keysRef={keysRef} hiding={hud.hide} energy={hud.energy} stamina={hud.stamina}
        sprinting={hud.sprinting} speedCharges={hud.speedCharges} boostActive={hud.boostActive} />
```

- [ ] **Step 4: 全テスト・型チェック・lint が通ることを確認**

Run: `npx jest src/features/labyrinth-of-shadows --silent 2>&1 | tail -10` && `npm run typecheck` && `npm run lint`
Expected: PASS / エラーなし

- [ ] **Step 5: コミット**

```bash
git add -A src/features/labyrinth-of-shadows
git commit -m "feat: 加速チャージのHUD表示とEキー/タッチボタンを追加

- HUD に ⚡ ストック数パネル、タッチUIに発動ボタン（仮想キー e）
- ミニマップの敵表示を enemyRevealTimer と連動
- 地図効果・加速状態を HUDData に反映"
```

---

### Task 6: チュートリアル文言・README 更新と CI 検証

**Files:**
- Modify: `constants.ts`（CONTENT.demo のアイテム・小石スライド）
- Modify: `README.md`（feature ルートの README。アイテム仕様の記述があれば更新）
- Test: 既存テスト全体 + `npm run ci`

**Interfaces:**
- Consumes: Task 2〜5 の確定仕様（文言をコードの実挙動に一致させる）

- [ ] **Step 1: CONTENT.demo を新仕様に更新**

`constants.ts` の demo 配列で、アイテムスライドを差し替え:

```ts
    {
      title: '🔑 アイテム',
      items: [
        '🔑 鍵：出口を開ける',
        '💊 回復薬：体力回復',
        '⚡ 加速：拾って貯めてEキーで発動',
        '🗺️ 地図：周囲と敵の位置が見える',
      ],
      icon: '📦',
    },
```

小石スライドの後に罠の説明を含める（既存6スライド構成を維持するため、小石スライドを「音」テーマに拡張）:

```ts
    {
      title: '🪨 音の駆け引き',
      items: ['クリックで小石を投げ敵を誘導', '📦 罠を踏むと大音で敵が来る', '追跡中の敵には効かない'],
      icon: '🎯',
    },
```

- [ ] **Step 2: README のアイテム記述を確認・更新**

Run: `grep -n "罠\|加速\|地図" src/features/labyrinth-of-shadows/README.md`
記述があれば Task 2〜4 の仕様（騒音罠・ストック制・敵位置表示）に合わせて書き換える。なければ変更不要。

- [ ] **Step 3: デモ表示のテストがあれば追従**

Run: `npx jest src/features/labyrinth-of-shadows --silent 2>&1 | tail -10`
Expected: PASS（demo 文言をアサートするテストが落ちたら新文言に更新）

- [ ] **Step 4: CI フルパイプラインを実行**

Run: `npm run ci 2>&1 | tail -20`
Expected: lint:ci / typecheck / test / build すべて成功

- [ ] **Step 5: コミット**

```bash
git add -A src/features/labyrinth-of-shadows
git commit -m "docs: チュートリアルとREADMEをPhase 3アイテム仕様に更新

- アイテム説明を騒音罠・加速ストック・索敵地図に差し替え
- 小石スライドを「音の駆け引き」として罠の説明を統合"
```

---

## 完了後

1. 実機確認（`npm start` → http://localhost:3000。**dev サーバー注意**: watch が変更を拾わないことが頻発。反映確認は実測で行い、古ければ `fuser -k 3000/tcp` してから再起動。`pkill -f` は使わない）
   - 罠を踏む → 大音＋敵が寄ってくる／時間が減らないこと
   - ⚡ 拾う → HUD 加算 → E キーで発動 → chase 中でも使えること
   - 🗺️ 拾う → ミニマップに全敵が5秒表示 → 消えること／通常時は未探索セルの敵が見えないこと
2. バランス較正（騒音半径8・表示5秒・上限2 を体感で調整）
3. PR 作成（`feat: Labyrinth of Shadows Phase 3 アイテムの意味の再設計`）。CI 全パス後にマージ

# 影の迷宮 捕縛ペナルティ再設計（鍵ドロップ）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 敵接触時に鍵を1個ドロップさせ、捕縛を「軽い被弾」から「鍵を落とす事件」へ格上げする。

**Architecture:** 落下先セルの選定を純粋関数 `chooseDropCell`（domain service）に切り出してユニットテストで検証。既存の接触分岐（`GameLogic.updateEnemyWithStrategy` 内）にドロップ処理を上乗せし、`updateItems` の鍵回収に `dropped` フラグ分岐を足してスコア抜け穴を封じる。ライフ・敵AI・時間は一切変更しない。

**Tech Stack:** TypeScript / React 19 / Jest 30（@testing-library）。ロジックは純粋関数に閉じ、R3F 非依存。

## Global Constraints

- `any` 型禁止（`unknown` + 型ガード）。`null` より `undefined` を優先
- 相対 import は `../` を2階層まで
- コメント・メッセージは日本語
- 変更対象は影の迷宮のみ。他 feature・共有コードに波及させない
- **ライフ数（5/3/2）・敵AI・視野・速度・制限時間は変更しない**
- 既存の被弾挙動（ライフ-1／無敵2.5秒／ノックバック／スコア-50／コンボリセット）は維持
- 新規サウンドアセットを追加しない（既存 `hurt` / `key` を流用）
- 完了条件: `npm run ci`（lint:ci → typecheck → test:coverage → build）全緑
- 参照 spec: `docs/superpowers/specs/2026-07-16-labyrinth-of-shadows-capture-key-drop-design.md`

---

### Task 1: `chooseDropCell` 純粋関数（落下先セル選定）

プレイヤー隣接の歩けるセルのうち「敵と最も反対方向」を選ぶ純粋関数。歩ける隣接が無ければプレイヤー自身のセルを返す（デススパイラル・理不尽落下の対策）。

**Files:**
- Create: `src/features/labyrinth-of-shadows/domain/services/key-drop.ts`
- Test: `src/features/labyrinth-of-shadows/domain/__tests__/key-drop.test.ts`

**Interfaces:**
- Consumes: `MazeService.isWalkable(maze, x, y)`（`../../maze-service`）
- Produces: `chooseDropCell(maze: number[][], playerX: number, playerY: number, enemyX: number, enemyY: number): { x: number; y: number }` — 整数セル座標を返す（既存アイテム座標と同じ規約）

- [ ] **Step 1: 失敗するテストを書く**

`src/features/labyrinth-of-shadows/domain/__tests__/key-drop.test.ts`:

```typescript
import { chooseDropCell } from '../services/key-drop';
import { FIXED_MAZE_9X9 } from '../../__tests__/helpers/fixed-maze';

describe('chooseDropCell', () => {
  test('敵と最も反対方向の歩けるセルを返す', () => {
    // プレイヤーはセル(1,1)中心。敵は南(+y)側。
    // (1,1)の歩ける隣接は (2,1) と (1,2)。敵から遠い (2,1) を選ぶ。
    const cell = chooseDropCell(FIXED_MAZE_9X9, 1.5, 1.5, 1.5, 1.8);
    expect(cell).toEqual({ x: 2, y: 1 });
  });

  test('歩ける隣接が無ければプレイヤー自身のセルにフォールバックする', () => {
    // 中央だけ通路、四方が壁の 3x3 迷路
    const boxed = [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ];
    const cell = chooseDropCell(boxed, 1.5, 1.5, 1.5, 1.5);
    expect(cell).toEqual({ x: 1, y: 1 });
  });

  test('返すセルは必ず歩ける（壁を返さない）', () => {
    const cell = chooseDropCell(FIXED_MAZE_9X9, 1.5, 1.5, 1.5, 1.8);
    expect(FIXED_MAZE_9X9[cell.y][cell.x]).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/labyrinth-of-shadows/domain/__tests__/key-drop.test.ts`
Expected: FAIL（`Cannot find module '../services/key-drop'`）

- [ ] **Step 3: 最小実装を書く**

`src/features/labyrinth-of-shadows/domain/services/key-drop.ts`:

```typescript
import { MazeService } from '../../maze-service';

/** 4近傍（上下左右）のオフセット */
const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * 落とした鍵の着地セルを選ぶ。
 * プレイヤー隣接の歩けるセルのうち「敵から最も遠い」ものを返し、
 * 取りに戻る動線が即・敵側へ向かわないようにする（デススパイラル対策）。
 * 歩ける隣接が無ければプレイヤー自身のセルを返す（そこは必ず歩ける）。
 */
export const chooseDropCell = (
  maze: number[][],
  playerX: number,
  playerY: number,
  enemyX: number,
  enemyY: number
): { x: number; y: number } => {
  const pcx = Math.floor(playerX);
  const pcy = Math.floor(playerY);

  let best: { x: number; y: number } | undefined;
  let bestDist = -Infinity;
  for (const [dx, dy] of NEIGHBORS) {
    const nx = pcx + dx;
    const ny = pcy + dy;
    if (!MazeService.isWalkable(maze, nx, ny)) continue;
    // セル中心 (nx+0.5, ny+0.5) と敵の距離が最大＝最も敵から遠い方向
    const cx = nx + 0.5;
    const cy = ny + 0.5;
    const dist = (cx - enemyX) ** 2 + (cy - enemyY) ** 2;
    if (dist > bestDist) {
      bestDist = dist;
      best = { x: nx, y: ny };
    }
  }

  return best ?? { x: pcx, y: pcy };
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/labyrinth-of-shadows/domain/__tests__/key-drop.test.ts`
Expected: PASS（3 tests）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-of-shadows/domain/services/key-drop.ts src/features/labyrinth-of-shadows/domain/__tests__/key-drop.test.ts
git commit -m "feat: 影の迷宮 落とした鍵の着地セル選定 chooseDropCell を追加

- プレイヤー隣接の歩けるセルのうち敵から最も遠い方向を選ぶ
- 歩ける隣接が無ければプレイヤー自身のセルへフォールバック"
```

---

### Task 2: 接触時に鍵をドロップ（`Item.dropped` 型追加 + 衝突分岐）

敵接触時、鍵を1個持っていれば `dropped:true` の鍵を着地セルへ生成し、`g.keys` を1減らす。メッセージを「🔑 鍵を落とした！」に切り替える。既存の被弾挙動は維持。

**Files:**
- Modify: `src/features/labyrinth-of-shadows/types.ts:48-51`（`Item` に `dropped?` 追加）
- Modify: `src/features/labyrinth-of-shadows/game-logic.ts:1-12`（import 追加）, `:200-215`（衝突分岐）
- Test: `src/features/labyrinth-of-shadows/__tests__/game-logic.test.ts`

**Interfaces:**
- Consumes: `chooseDropCell`（Task 1）
- Produces: 接触時の副作用（`g.keys--` と `g.items` への `{ type:'key', got:false, dropped:true }` push）

- [ ] **Step 1: 失敗するテストを書く**

`src/features/labyrinth-of-shadows/__tests__/game-logic.test.ts` の末尾（最後の `});` の直前）に追加:

```typescript
  describe('捕縛時の鍵ドロップ', () => {
    test('鍵を持って接触すると鍵を1個落とす', () => {
      const s = GameStateBuilder.create()
        .withPlayer({ x: 1.5, y: 1.5 })
        .withEnemy('chaser', { x: 1.5, y: 1.8, active: true })
        .withKeys(2, 3)
        .build();
      const enemy = s.enemies[0];

      GameLogic.updateEnemyWithStrategy(s, enemy, 16);

      expect(s.keys).toBe(1);
      const dropped = s.items.filter((i) => i.type === 'key' && i.dropped);
      expect(dropped).toHaveLength(1);
      // 着地セルは歩ける
      expect(s.maze[dropped[0].y][dropped[0].x]).toBe(0);
      expect(s.msg).toBe('🔑 鍵を落とした！');
    });

    test('鍵0で接触してもドロップせず keys は負にならない', () => {
      const s = GameStateBuilder.create()
        .withPlayer({ x: 1.5, y: 1.5 })
        .withEnemy('chaser', { x: 1.5, y: 1.8, active: true })
        .withKeys(0, 3)
        .build();
      const enemy = s.enemies[0];

      GameLogic.updateEnemyWithStrategy(s, enemy, 16);

      expect(s.keys).toBe(0);
      expect(s.items.some((i) => i.dropped)).toBe(false);
      expect(s.msg).toBe('💔 ダメージ！');
    });

    test('無敵中は接触してもドロップしない（1接触=最大1ドロップ）', () => {
      const s = GameStateBuilder.create()
        .withPlayer({ x: 1.5, y: 1.5 })
        .withEnemy('chaser', { x: 1.5, y: 1.8, active: true })
        .withKeys(2, 3)
        .withInvincibility(1000)
        .build();
      const enemy = s.enemies[0];

      GameLogic.updateEnemyWithStrategy(s, enemy, 16);

      expect(s.keys).toBe(2);
      expect(s.items.some((i) => i.dropped)).toBe(false);
    });
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/labyrinth-of-shadows/__tests__/game-logic.test.ts -t "捕縛時の鍵ドロップ"`
Expected: FAIL（`dropped` プロパティが型に無く、ドロップ処理も未実装）

- [ ] **Step 3a: `Item` 型に `dropped?` を追加**

`src/features/labyrinth-of-shadows/types.ts` の `Item` インターフェース:

```typescript
export interface Item extends Entity {
  type: EntityType;
  got: boolean;
  /** 捕縛時に落とした鍵は true（再回収時にスコア/コンボを与えない目印） */
  dropped?: boolean;
}
```

- [ ] **Step 3b: game-logic に import を追加**

`src/features/labyrinth-of-shadows/game-logic.ts` の import 群（`getEnemyStrategy` の行の直後あたり）に追加:

```typescript
import { chooseDropCell } from './domain/services/key-drop';
```

- [ ] **Step 3c: 衝突分岐にドロップ処理を挿入**

`src/features/labyrinth-of-shadows/game-logic.ts` の衝突分岐（現状 `:201-215`）を次で置き換える:

```typescript
    if (isPlayerCollidingEnemy(g.player.x, g.player.y, e.x, e.y) && !g.hiding && g.invince <= 0) {
      g.lives--;
      g.invince = CONFIG.timing.invinceDuration;
      g.score = Math.max(0, g.score - CONFIG.score.damagePenalty);
      g.combo = 0;

      // 鍵を持っていれば1個ドロップし、捕縛を「事件」にする。
      // 着地は敵と反対方向の歩けるセル（chooseDropCell がデススパイラルを抑制）。
      if (g.keys > 0) {
        const cell = chooseDropCell(g.maze, g.player.x, g.player.y, e.x, e.y);
        g.keys--;
        g.items.push({ x: cell.x, y: cell.y, type: 'key', got: false, dropped: true });
        g.msg = '🔑 鍵を落とした！';
      } else {
        g.msg = '💔 ダメージ！';
      }
      g.msgTimer = GAME_BALANCE.timing.DAMAGE_MESSAGE_DURATION;
      AudioService.play('hurt', 0.5);

      const edx = g.player.x - e.x;
      const edy = g.player.y - e.y;
      e.x -= (edx / d) * GAME_BALANCE.collision.ENEMY_KNOCKBACK_DISTANCE;
      e.y -= (edy / d) * GAME_BALANCE.collision.ENEMY_KNOCKBACK_DISTANCE;
      e.dir += Math.PI;
    }
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/labyrinth-of-shadows/__tests__/game-logic.test.ts -t "捕縛時の鍵ドロップ"`
Expected: PASS（3 tests）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-of-shadows/types.ts src/features/labyrinth-of-shadows/game-logic.ts src/features/labyrinth-of-shadows/__tests__/game-logic.test.ts
git commit -m "feat: 影の迷宮 敵接触で鍵を1個落とすようにする

- Item に dropped フラグを追加
- 鍵所持時の接触で歩けるセルへ鍵をドロップ（既存の被弾挙動は維持）
- 鍵0/無敵中はドロップしない"
```

---

### Task 3: 落とした鍵の再回収でスコア/コンボを与えない

落とした鍵（`dropped:true`）を拾い直しても進行（`g.keys++`）だけ戻し、スコア加算・コンボ加算を行わない。「被弾-50 → 再回収+100」の純増とコンボ稼ぎを封じる。通常の鍵は従来通り。

**Files:**
- Modify: `src/features/labyrinth-of-shadows/game-logic.ts:118-127`（`updateItems` の `key` 分岐）
- Test: `src/features/labyrinth-of-shadows/__tests__/game-logic.test.ts`

**Interfaces:**
- Consumes: `Item.dropped`（Task 2）
- Produces: `updateItems` の `dropped` 鍵分岐（スコア/コンボ非加算）

- [ ] **Step 1: 失敗するテストを書く**

`src/features/labyrinth-of-shadows/__tests__/game-logic.test.ts` の `describe('捕縛時の鍵ドロップ', ...)` の直後に追加:

```typescript
  describe('落とした鍵の再回収', () => {
    test('落とした鍵を拾い直すと keys は戻るがスコア/コンボは増えない', () => {
      const s = GameStateBuilder.create()
        .withPlayer({ x: 2, y: 1 })
        .withScore(500)
        .withCombo(3, 1000)
        .build();
      s.keys = 1;
      s.items = [{ x: 2, y: 1, type: 'key', got: false, dropped: true }];

      GameLogic.updateItems(s);

      expect(s.keys).toBe(2);
      expect(s.score).toBe(500);
      expect(s.combo).toBe(3);
      expect(s.items[0].got).toBe(true);
    });

    test('通常の鍵は従来通りスコアが加算される（リグレッション防止）', () => {
      const s = GameStateBuilder.create()
        .withPlayer({ x: 2, y: 1 })
        .withScore(500)
        .build();
      s.keys = 0;
      s.items = [{ x: 2, y: 1, type: 'key', got: false }];

      GameLogic.updateItems(s);

      expect(s.keys).toBe(1);
      expect(s.score).toBeGreaterThan(500);
    });
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/labyrinth-of-shadows/__tests__/game-logic.test.ts -t "落とした鍵の再回収"`
Expected: FAIL（1つ目のテストが失敗＝落とした鍵でもスコア/コンボが加算される）

- [ ] **Step 3: `key` 分岐に `dropped` 判定を追加**

`src/features/labyrinth-of-shadows/game-logic.ts` の `updateItems` 内 `case 'key':` を次で置き換える:

```typescript
        case 'key': {
          if (item.dropped) {
            // 落とした鍵の拾い直し: 進行だけ戻し、スコア/コンボは与えない
            // （被弾→再回収での純増・コンボ稼ぎを防ぐ）
            g.keys++;
            g.msg = `🔑 落とした鍵を拾い直した (${g.keys}/${g.reqKeys})`;
            AudioService.play('key', 0.45);
            break;
          }
          g.combo = calculateCombo(g.combo, g.gTime, g.lastKeyTime);
          g.lastKeyTime = g.gTime;
          const bonus = calculateKeyScore(g.combo);
          g.keys++;
          g.score += bonus;
          g.msg = `🔑 鍵を入手！ +${bonus}pt (${g.keys}/${g.reqKeys})`;
          AudioService.play('key', 0.45);
          break;
        }
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/labyrinth-of-shadows/__tests__/game-logic.test.ts -t "落とした鍵の再回収"`
Expected: PASS（2 tests）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-of-shadows/game-logic.ts src/features/labyrinth-of-shadows/__tests__/game-logic.test.ts
git commit -m "feat: 影の迷宮 落とした鍵の再回収はスコア/コンボを与えない

- dropped 鍵は g.keys++ のみで進行のみ戻す
- 被弾→再回収での純増・コンボ稼ぎの抜け穴を封じる"
```

---

### Task 4: 全体検証（CI + 実プレイゲート）

**Files:** なし（検証のみ）

- [ ] **Step 1: フル CI を実行**

Run: `npm run ci`
Expected: lint:ci → typecheck → test:coverage → build がすべて PASS

- [ ] **Step 2: 影の迷宮のページテストを jest で回す（ESM 罠の保険）**

Run: `npx jest src/features/labyrinth-of-shadows`
Expected: 全 PASS（スイート起動失敗が無い）

- [ ] **Step 3: 実プレイ検証ゲート（ユーザーと実施）**

`fuser -k 3000/tcp` で3000解放後 `npm start`（ビルド2〜5分）。ブラウザで確認:
1. 「鍵を落とす」が"事件"として効いているか（取り返したくなるか）
2. 捕まる頻度は妥当か（少なすぎたら別途「敵AI軸」を相談）
3. デススパイラル（取りに戻って連続被弾）になっていないか
4. 落下先が理不尽（壁/敵の中/戻れない位置）でないか

> 注: `pkill -f` は自分のシェルに自滅するので使わない。

- [ ] **Step 4: 実プレイ FB を反映（必要時）**

体感に応じて chooseDropCell の選定や演出を微調整。数値の追加変更が必要なら**別タスク/別 spec**として切り出し、今回のスコープ（鍵ドロップ1点）は保つ。

---

## Self-Review 結果

- **Spec coverage:** 発動条件→Task2 / 1個ドロップ→Task2 / walkable着地・敵反対方向・フォールバック→Task1 / スコア抜け穴封じ→Task3 / 型変更→Task2 / 多重ドロップ防止→Task2(無敵ガード) / メッセージ→Task2,3 / 音（hurt/key流用）→Task2,3 / テスト→各Task / CI・実プレイゲート→Task4。すべて対応。
- **Placeholder scan:** プレースホルダ無し（全コード実体入り）。
- **Type consistency:** `chooseDropCell` の戻り値 `{x,y}`（整数セル）を Task2 で `g.items.push({ x: cell.x, y: cell.y, ... })` に使用。`Item.dropped?: boolean` を Task2 で定義し Task3 で参照。整合。

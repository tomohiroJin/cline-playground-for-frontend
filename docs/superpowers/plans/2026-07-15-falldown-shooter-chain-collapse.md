# Falldown Shooter 連鎖崩壊システム 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 撃破・着地・スキルでセルが消えたら列重力＋連鎖ライン消去が発動する「連鎖崩壊」を導入し、「溜め→解放」の山場を作る。

**Architecture:** ドメイン（純粋関数 `Grid.applyColumnGravity` / `GameLogic.resolveBoard`）が連鎖を一瞬で解決し順序付きステップ列を返す。プレゼン（`use-chain-resolver` フック）がそのステップ列を時間軸で1段ずつ再生し、`isResolving` ロックで既存ループを止めて演出を段階増幅する。実行経路は flat モジュールのみ。`domain/` 層（死蔵）は触らない。

**Tech Stack:** React 19 + TypeScript, Jest 30 + @testing-library/react, styled-components, Web Audio API。

## Global Constraints

- `any` 型禁止（`unknown` + 型ガード）。コメント・docstring は日本語。
- 純粋関数を先にテスト（TDD: Red→Green→Refactor）。新規コード 80%+、ビジネスロジック 90%+。
- `features/falldown-shooter/` 内で完結。他 feature 参照禁止。`domain/` 層には追加しない（flat モジュールに実装）。
- `main` 直接コミット禁止。ブランチ `feature/falldown-shooter-chain-collapse`（作成済み）。
- コミットは Conventional Commits（`feat:` / `test:` / `refactor:`）＋日本語詳細。
- テスト実行: `npx jest --testPathPatterns='falldown-shooter' --no-coverage`。最終ゲート: `npm run ci`。
- 盤面定数: グリッド幅 `CONFIG.grid.width = 12`、高さ `CONFIG.grid.height = 18`。セル型は `(string | null)[][]`（null=空、色文字列=埋まり）。

---

# Phase 1: 純粋関数（列重力＋連鎖）と着地統合

**成果物:** 着地時に `clearFullLines` ではなく `resolveBoard` が走り、連鎖が成立してスコアに反映される（この段階では演出なし・即時解決）。

---

### Task 1: 型定義（ChainStep / ResolveResult）

**Files:**
- Modify: `src/features/falldown-shooter/types.ts`（末尾に追記）

**Interfaces:**
- Produces:
  - `ChainStep { chain: number; clearedRows: number[]; grid: (string | null)[][]; cellsCleared: number }`
  - `ResolveResult { grid: (string | null)[][]; chainSteps: ChainStep[]; totalLines: number; totalCells: number }`

- [ ] **Step 1: 型を追記する**

`src/features/falldown-shooter/types.ts` の末尾に追記:

```typescript
/** 連鎖1段分の記録（演出の再生とスコア計算に使用） */
export interface ChainStep {
  /** 連鎖番号（1始まり） */
  chain: number;
  /** このステップで消えた行インデックス（消去前・重力適用後の盤面基準） */
  clearedRows: number[];
  /** このステップ適用後（重力＋消去＋再重力で安定した）盤面 */
  grid: (string | null)[][];
  /** このステップで消えたセル数 */
  cellsCleared: number;
}

/** 盤面解決（重力＋連鎖消去）の結果 */
export interface ResolveResult {
  /** 最終的に安定した盤面 */
  grid: (string | null)[][];
  /** 連鎖ステップ列（空なら連鎖なし） */
  chainSteps: ChainStep[];
  /** 消えた総行数（ステージ進行・コンボ登録に使用） */
  totalLines: number;
  /** 消えた総セル数 */
  totalCells: number;
}
```

- [ ] **Step 2: 型チェックが通ることを確認**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "types.ts" || echo "types.ts エラーなし"`
Expected: `types.ts エラーなし`

- [ ] **Step 3: コミット**

```bash
git add src/features/falldown-shooter/types.ts
git commit -m "feat: 連鎖崩壊の型定義（ChainStep / ResolveResult）を追加"
```

---

### Task 2: `Grid.applyColumnGravity`（列ごとの重力）

**Files:**
- Modify: `src/features/falldown-shooter/grid.ts`
- Test: `src/features/falldown-shooter/__tests__/grid.test.ts`

**Interfaces:**
- Produces: `Grid.applyColumnGravity(grid: (string | null)[][]): (string | null)[][]` — 各列の非 null セルを、順序を保ったまま列の下端へ詰めた新しいグリッドを返す（純粋）。

- [ ] **Step 1: 失敗するテストを書く**

`src/features/falldown-shooter/__tests__/grid.test.ts` の `describe('Grid', ...)` 内に追記:

```typescript
  describe('applyColumnGravity', () => {
    test('浮いたセルが列の下端まで落ちること', () => {
      const grid = Grid.create(2, 3); // 幅2 高さ3
      grid[0][0] = 'red'; // 最上段に浮いたセル
      const result = Grid.applyColumnGravity(grid);
      expect(result[2][0]).toBe('red'); // 最下段に落ちる
      expect(result[0][0]).toBeNull();
    });

    test('列内の積み順を保って詰めること', () => {
      const grid = Grid.create(1, 4);
      grid[0][0] = 'a'; // 上
      grid[2][0] = 'b'; // 下（間に穴）
      const result = Grid.applyColumnGravity(grid);
      expect(result[2][0]).toBe('a'); // 上にあった a が上のまま
      expect(result[3][0]).toBe('b'); // 下にあった b が最下段
      expect(result[0][0]).toBeNull();
      expect(result[1][0]).toBeNull();
    });

    test('列は独立して落下すること（他列に影響しない）', () => {
      const grid = Grid.create(2, 2);
      grid[0][0] = 'x'; // 左列だけ浮いている
      const result = Grid.applyColumnGravity(grid);
      expect(result[1][0]).toBe('x');
      expect(result[1][1]).toBeNull();
    });

    test('元のグリッドを破壊しないこと', () => {
      const grid = Grid.create(1, 2);
      grid[0][0] = 'red';
      Grid.applyColumnGravity(grid);
      expect(grid[0][0]).toBe('red'); // 元は不変
    });
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest --testPathPatterns='grid.test' -t 'applyColumnGravity' --no-coverage`
Expected: FAIL（`Grid.applyColumnGravity is not a function`）

- [ ] **Step 3: 最小実装を書く**

`src/features/falldown-shooter/grid.ts` の `Grid` オブジェクト内（`clearColumn` の後）に追記:

```typescript
  /** 各列の非 null セルを順序を保ったまま下端へ詰める（列独立の重力） */
  applyColumnGravity: (grid: (string | null)[][]): (string | null)[][] => {
    const height = grid.length;
    const width = grid[0].length;
    const newGrid = Grid.create(width, height);

    for (let x = 0; x < width; x++) {
      const stacked: (string | null)[] = [];
      for (let y = 0; y < height; y++) {
        if (grid[y][x] !== null) stacked.push(grid[y][x]);
      }
      // stacked を列の下端から順に配置（上下の順序を維持）
      for (let i = 0; i < stacked.length; i++) {
        newGrid[height - stacked.length + i][x] = stacked[i];
      }
    }

    return newGrid;
  },
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest --testPathPatterns='grid.test' -t 'applyColumnGravity' --no-coverage`
Expected: PASS（4件）

- [ ] **Step 5: コミット**

```bash
git add src/features/falldown-shooter/grid.ts src/features/falldown-shooter/__tests__/grid.test.ts
git commit -m "feat: 列ごとの重力 Grid.applyColumnGravity を追加"
```

---

### Task 3: 行検出ヘルパー（`Grid.findFullRows` / `Grid.nullifyRows`）

**Files:**
- Modify: `src/features/falldown-shooter/grid.ts`
- Test: `src/features/falldown-shooter/__tests__/grid.test.ts`

**Interfaces:**
- Produces:
  - `Grid.findFullRows(grid: (string | null)[][]): number[]` — 全セルが非 null の行インデックス配列（昇順）。
  - `Grid.nullifyRows(grid: (string | null)[][], rows: number[]): (string | null)[][]` — 指定行を全 null にした新グリッド（シフトしない）。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/grid.test.ts` に追記:

```typescript
  describe('findFullRows', () => {
    test('全セルが埋まった行のインデックスを返すこと', () => {
      const grid = Grid.create(2, 3);
      grid[2][0] = 'a';
      grid[2][1] = 'b'; // 最下段が full
      grid[1][0] = 'c'; // 1行目は穴あり
      expect(Grid.findFullRows(grid)).toEqual([2]);
    });

    test('full 行がなければ空配列を返すこと', () => {
      const grid = Grid.create(2, 2);
      grid[1][0] = 'a';
      expect(Grid.findFullRows(grid)).toEqual([]);
    });
  });

  describe('nullifyRows', () => {
    test('指定行を全 null にし、他行を変えないこと', () => {
      const grid = Grid.create(2, 2);
      grid[0][0] = 'top';
      grid[1][0] = 'a';
      grid[1][1] = 'b';
      const result = Grid.nullifyRows(grid, [1]);
      expect(result[1][0]).toBeNull();
      expect(result[1][1]).toBeNull();
      expect(result[0][0]).toBe('top'); // シフトしない
    });
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest --testPathPatterns='grid.test' -t 'findFullRows' --no-coverage`
Expected: FAIL

- [ ] **Step 3: 最小実装を書く**

`src/features/falldown-shooter/grid.ts` の `Grid` 内に追記:

```typescript
  /** 全セルが非 null の行インデックスを昇順で返す */
  findFullRows: (grid: (string | null)[][]): number[] => {
    const rows: number[] = [];
    grid.forEach((row, y) => {
      if (row.every(c => c !== null)) rows.push(y);
    });
    return rows;
  },

  /** 指定行を全 null にした新グリッドを返す（行シフトはしない） */
  nullifyRows: (grid: (string | null)[][], rows: number[]): (string | null)[][] => {
    const rowSet = new Set(rows);
    return grid.map((row, y) => (rowSet.has(y) ? Array(row.length).fill(null) : [...row]));
  },
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest --testPathPatterns='grid.test' -t 'findFullRows|nullifyRows' --no-coverage`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/falldown-shooter/grid.ts src/features/falldown-shooter/__tests__/grid.test.ts
git commit -m "feat: 行検出ヘルパー Grid.findFullRows / nullifyRows を追加"
```

---

### Task 4: `GameLogic.resolveBoard`（重力＋連鎖ループ）

**Files:**
- Modify: `src/features/falldown-shooter/game-logic.ts`
- Test: `src/features/falldown-shooter/__tests__/resolve-board.test.ts`（新規）

**Interfaces:**
- Consumes: `Grid.applyColumnGravity`, `Grid.findFullRows`, `Grid.nullifyRows`（Task 2-3）。
- Produces: `GameLogic.resolveBoard(grid: (string | null)[][]): ResolveResult`（Task 1 の型）。

**アルゴリズム:** 初回に重力で settle → full 行を検出 → あれば消去して再 settle（=1連鎖）→ 検出を繰り返す。full 行が出なくなったら終了。各ステップの `grid` は「消去＋再重力で安定した盤面」。

- [ ] **Step 1: 失敗するテストを書く**

`src/features/falldown-shooter/__tests__/resolve-board.test.ts` を新規作成:

```typescript
import { GameLogic } from '../game-logic';
import { Grid } from '../grid';

/** 幅 w のグリッドを作り、fullRowText の行を全埋めするヘルパー */
const fullRow = (w: number): (string | null)[] => Array(w).fill('x');

describe('GameLogic.resolveBoard', () => {
  describe('連鎖なし', () => {
    test('full 行がなければ chainSteps 空・盤面は重力で settle されること', () => {
      const grid = Grid.create(2, 3);
      grid[0][0] = 'a'; // 浮いたセル1個
      const result = GameLogic.resolveBoard(grid);
      expect(result.chainSteps).toHaveLength(0);
      expect(result.totalLines).toBe(0);
      expect(result.grid[2][0]).toBe('a'); // 落ちて settle
    });
  });

  describe('1連鎖', () => {
    test('full 行が1つ消え、上のセルが落ちること', () => {
      const grid = Grid.create(2, 3);
      grid[2] = fullRow(2); // 最下段 full
      grid[1][0] = 'top';   // その上に浮いたセル
      const result = GameLogic.resolveBoard(grid);
      expect(result.chainSteps).toHaveLength(1);
      expect(result.chainSteps[0].chain).toBe(1);
      expect(result.chainSteps[0].clearedRows).toEqual([2]);
      expect(result.totalLines).toBe(1);
      expect(result.totalCells).toBe(2); // 幅2の1行
      expect(result.grid[2][0]).toBe('top'); // top が最下段へ落下
    });
  });

  describe('多段連鎖', () => {
    test('消去→落下で新たな full 行ができ、連鎖すること', () => {
      // 幅2・高さ3。最下段 full。その上に、消えると揃う配置を作る。
      const grid = Grid.create(2, 3);
      grid[2] = fullRow(2);      // 下段 full（1連鎖目で消える）
      grid[0][0] = 'a';          // 左列に浮いたセル
      grid[1][1] = 'b';          // 右列に浮いたセル
      // 下段が消えて重力がかかると a,b が最下段で揃い full → 2連鎖目
      const result = GameLogic.resolveBoard(grid);
      expect(result.chainSteps).toHaveLength(2);
      expect(result.chainSteps[1].chain).toBe(2);
      expect(result.totalLines).toBe(2);
      expect(result.grid.every(row => row.every(c => c === null))).toBe(true); // 全消し
    });
  });

  test('元のグリッドを破壊しないこと', () => {
    const grid = Grid.create(2, 3);
    grid[2] = fullRow(2);
    GameLogic.resolveBoard(grid);
    expect(grid[2][0]).toBe('x');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest --testPathPatterns='resolve-board' --no-coverage`
Expected: FAIL（`GameLogic.resolveBoard is not a function`）

- [ ] **Step 3: 最小実装を書く**

`src/features/falldown-shooter/game-logic.ts` の import に型を追加:

```typescript
import type { BlockData, BulletData, BulletProcessResult, PowerType, ChainStep, ResolveResult } from './types';
```

`GameLogic` オブジェクト内（`applyClearBottom` の後あたり）に追記:

```typescript
  /**
   * 盤面を解決する: 列重力で settle → full 行消去 → 再 settle を、
   * full 行が出なくなるまで繰り返す。1ループ=1連鎖。
   */
  resolveBoard: (grid: (string | null)[][]): ResolveResult => {
    const width = grid[0].length;
    const chainSteps: ChainStep[] = [];
    let current = Grid.applyColumnGravity(grid); // 初回 settle
    let chain = 0;

    for (;;) {
      const fullRows = Grid.findFullRows(current);
      if (fullRows.length === 0) break;

      chain += 1;
      const cellsCleared = fullRows.length * width;
      // 消去してから再度重力で settle（連鎖検出の起点になる安定盤面）
      current = Grid.applyColumnGravity(Grid.nullifyRows(current, fullRows));
      chainSteps.push({ chain, clearedRows: fullRows, grid: current, cellsCleared });
    }

    const totalLines = chainSteps.reduce((s, step) => s + step.clearedRows.length, 0);
    const totalCells = chainSteps.reduce((s, step) => s + step.cellsCleared, 0);
    return { grid: current, chainSteps, totalLines, totalCells };
  },
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest --testPathPatterns='resolve-board' --no-coverage`
Expected: PASS（5件）

- [ ] **Step 5: コミット**

```bash
git add src/features/falldown-shooter/game-logic.ts src/features/falldown-shooter/__tests__/resolve-board.test.ts
git commit -m "feat: 連鎖解決 GameLogic.resolveBoard を追加"
```

---

### Task 5: 着地ループを `resolveBoard` に置換（即時解決）

**Files:**
- Modify: `src/features/falldown-shooter/hooks/use-game-loop.ts:104-164`
- Test: `src/features/falldown-shooter/__tests__/integration.test.tsx`（既存回帰を確認）

**Interfaces:**
- Consumes: `GameLogic.resolveBoard`（Task 4）。
- 挙動: 着地時に `Grid.clearFullLines` の代わりに `resolveBoard` を使う。連鎖で消えた総行数 = `totalLines`。スコアは既存式のまま（連鎖倍率は Phase 2 で追加）。

- [ ] **Step 1: 着地ブロックを書き換える**

`use-game-loop.ts` の import から `Grid` は残しつつ、着地処理（現行 119-139 行付近）を以下に置換:

```typescript
      const gridWithLanded = Block.placeOnGrid(landing, state.grid);
      const resolved = GameLogic.resolveBoard(gridWithLanded);
      const cleared = resolved.totalLines;

      if (cleared > 0) {
        if (soundEnabled) Audio.line();
        if (onLineClear) onLineClear(cleared);
      }

      const newLines = state.lines + cleared;
      const newPlayerY = GameLogic.calculatePlayerY(resolved.grid);
      const simultaneousBonus = SIMULTANEOUS_LINE_BONUS[cleared] ?? 1.0;
      const lineScore = Math.round(cleared * CONFIG.score.line * simultaneousBonus * state.stage * scoreMultiplier * comboMult);
      const finalScore = state.score + lineScore;

      gameState.updateState({
        blocks: falling,
        grid: resolved.grid,
        playerY: newPlayerY,
        score: finalScore,
        lines: newLines,
      });
```

（`if (newLines >= state.linesNeeded)` 以降のステージクリア・ゲームオーバー判定はそのまま。`Grid.clearFullLines` 呼び出しは削除。`Grid` import が他で未使用なら削除。）

- [ ] **Step 2: 既存の統合テストを実行**

Run: `npx jest --testPathPatterns='falldown-shooter' --no-coverage`
Expected: PASS（既存挙動を維持。落ちなければ Step 3 で回帰移行）

- [ ] **Step 3: 回帰したテストがあれば列重力仕様に更新する**

`clearFullLines` のテトリス式一括シフト（消えた行の上が「そのまま平行移動」）を前提にしたアサーションは、列重力仕様（各列が独立して落下）に更新する。対象は `integration.test.tsx` と、もしあれば着地系テスト。判断基準: 「full でない行に穴があるケース」で結果が変わる。full 行のみ・穴なしのケースは両仕様で同一結果になるため多くはそのまま通る。

Run（全体）: `npx jest --testPathPatterns='falldown-shooter' --no-coverage`
Expected: PASS

- [ ] **Step 4: コミット**

```bash
git add src/features/falldown-shooter/hooks/use-game-loop.ts src/features/falldown-shooter/__tests__/
git commit -m "feat: 着地時のライン消去を resolveBoard（列重力＋連鎖）に置換"
```

---

# Phase 2: 連鎖スコアリングと弾・スキルへの統合

**成果物:** 連鎖倍率がスコアに乗り、弾・爆弾・スキルでもセル消去後に連鎖が発動する。

---

### Task 6: 連鎖倍率テーブルと算出ヘルパー

**Files:**
- Modify: `src/features/falldown-shooter/constants.ts`
- Modify: `src/features/falldown-shooter/game-logic.ts`
- Test: `src/features/falldown-shooter/__tests__/chain-score.test.ts`（新規）

**Interfaces:**
- Produces:
  - 定数 `CHAIN_BONUS: { minChain: number; multiplier: number }[]`。
  - `GameLogic.getChainMultiplier(maxChain: number): number` — 連鎖数に対応する倍率（6以上は 8.0 上限）。
  - `GameLogic.calcResolveScore(chainSteps: ChainStep[], ctx: { stage: number; scoreMultiplier: number; comboMult: number }): number` — ライン得点（丸め済み整数）。

- [ ] **Step 1: 失敗するテストを書く**

`src/features/falldown-shooter/__tests__/chain-score.test.ts` を新規作成:

```typescript
import { GameLogic } from '../game-logic';
import type { ChainStep } from '../types';

const step = (chain: number, rows: number): ChainStep => ({
  chain,
  clearedRows: Array.from({ length: rows }, (_, i) => i),
  grid: [],
  cellsCleared: rows * 12,
});

describe('GameLogic.getChainMultiplier', () => {
  test.each([
    [1, 1.0],
    [2, 1.5],
    [3, 2.5],
    [4, 4.0],
    [5, 6.0],
    [6, 8.0],
    [10, 8.0], // 6以上は上限
  ])('連鎖%iで倍率%f', (chain, expected) => {
    expect(GameLogic.getChainMultiplier(chain)).toBe(expected);
  });

  test('連鎖0（=消去なし）は倍率1.0', () => {
    expect(GameLogic.getChainMultiplier(0)).toBe(1.0);
  });
});

describe('GameLogic.calcResolveScore', () => {
  test('1連鎖1行: line100 × 同時消し1.0 × stage × scoreMult × chain1.0 × combo', () => {
    const score = GameLogic.calcResolveScore([step(1, 1)], {
      stage: 2,
      scoreMultiplier: 1.5,
      comboMult: 2.0,
    });
    // 1 * 100 * 1.0 * 2 * 1.5 * 1.0(chain) * 2.0(combo) = 600
    expect(score).toBe(600);
  });

  test('多段連鎖: 各ステップの同時消しボーナス総和 × 最大連鎖倍率', () => {
    // step1=1行(1.0), step2=2行(1.5) → Σ = 1*100*1.0 + 2*100*1.5 = 400
    // 最大連鎖=2 → chainMult 1.5。stage1, scoreMult1, combo1
    const score = GameLogic.calcResolveScore([step(1, 1), step(2, 2)], {
      stage: 1,
      scoreMultiplier: 1.0,
      comboMult: 1.0,
    });
    expect(score).toBe(600); // 400 * 1.5
  });

  test('連鎖なし（空配列）は0点', () => {
    expect(GameLogic.calcResolveScore([], { stage: 1, scoreMultiplier: 1, comboMult: 1 })).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest --testPathPatterns='chain-score' --no-coverage`
Expected: FAIL

- [ ] **Step 3: 定数とヘルパーを実装する**

`constants.ts` の `SIMULTANEOUS_LINE_BONUS` の後に追記:

```typescript
// 連鎖数 → スコア倍率（6連鎖以上は 8.0 上限）
export const CHAIN_BONUS: { minChain: number; multiplier: number }[] = [
  { minChain: 1, multiplier: 1.0 },
  { minChain: 2, multiplier: 1.5 },
  { minChain: 3, multiplier: 2.5 },
  { minChain: 4, multiplier: 4.0 },
  { minChain: 5, multiplier: 6.0 },
  { minChain: 6, multiplier: 8.0 },
];
```

`game-logic.ts` の import に定数を追加:

```typescript
import { CONFIG, CHAIN_BONUS, SIMULTANEOUS_LINE_BONUS } from './constants';
```

`GameLogic` 内に追記:

```typescript
  /** 連鎖数に対応するスコア倍率を返す（0連鎖は1.0、6以上は上限8.0） */
  getChainMultiplier: (maxChain: number): number => {
    let multiplier = 1.0;
    for (const entry of CHAIN_BONUS) {
      if (maxChain >= entry.minChain) multiplier = entry.multiplier;
    }
    return multiplier;
  },

  /**
   * 連鎖解決のライン得点を算出する（純粋）。
   * Σ(各ステップ: 消えた行数 × line × 同時消しボーナス) × stage × scoreMult × chainMult(最大連鎖) × comboMult
   * comboMult は呼び出し側で「連鎖開始時点のコンボ倍率」を固定して渡すこと（自己増幅防止）。
   */
  calcResolveScore: (
    chainSteps: ChainStep[],
    ctx: { stage: number; scoreMultiplier: number; comboMult: number }
  ): number => {
    if (chainSteps.length === 0) return 0;
    const base = chainSteps.reduce((sum, step) => {
      const rows = step.clearedRows.length;
      const simBonus = SIMULTANEOUS_LINE_BONUS[rows] ?? 1.0;
      return sum + rows * CONFIG.score.line * simBonus;
    }, 0);
    const maxChain = chainSteps[chainSteps.length - 1].chain;
    const chainMult = GameLogic.getChainMultiplier(maxChain);
    return Math.round(base * ctx.stage * ctx.scoreMultiplier * chainMult * ctx.comboMult);
  },
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest --testPathPatterns='chain-score' --no-coverage`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/falldown-shooter/constants.ts src/features/falldown-shooter/game-logic.ts src/features/falldown-shooter/__tests__/chain-score.test.ts
git commit -m "feat: 連鎖倍率テーブルとスコア算出 calcResolveScore を追加"
```

---

### Task 7: 着地スコアを `calcResolveScore` に切り替え

**Files:**
- Modify: `src/features/falldown-shooter/hooks/use-game-loop.ts`（Task 5 で書き換えた着地ブロック）

**Interfaces:**
- Consumes: `GameLogic.calcResolveScore`（Task 6）。

- [ ] **Step 1: 着地スコア計算を差し替える**

Task 5 で書いた `simultaneousBonus` / `lineScore` の2行を以下に置換:

```typescript
      // 連鎖倍率込みのライン得点（comboMult はこの着地時点の値で固定）
      const lineScore = GameLogic.calcResolveScore(resolved.chainSteps, {
        stage: state.stage,
        scoreMultiplier,
        comboMult,
      });
      const finalScore = state.score + lineScore;
```

（`SIMULTANEOUS_LINE_BONUS` の import が use-game-loop 内で他に使われていなければ削除。）

- [ ] **Step 2: テスト全体を実行**

Run: `npx jest --testPathPatterns='falldown-shooter' --no-coverage`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add src/features/falldown-shooter/hooks/use-game-loop.ts
git commit -m "feat: 着地スコアに連鎖倍率を適用"
```

---

### Task 8: 弾ループにセル消去後の連鎖を統合

**Files:**
- Modify: `src/features/falldown-shooter/hooks/use-game-loop.ts:74-102`（弾ループ）
- Test: `src/features/falldown-shooter/__tests__/integration.test.tsx`（弾トリガー連鎖の追加）

**Interfaces:**
- Consumes: `GameLogic.resolveBoard`, `GameLogic.calcResolveScore`。
- 挙動: `processBullets` で `hitCount > 0`（セル消去あり）のとき、`result.grid` を `resolveBoard` に通す。連鎖で行が消えたら `onLineClear` とスコア加算・ステージクリア判定を行う。

- [ ] **Step 1: 弾ループを書き換える**

`use-game-loop.ts` の弾ループ内、`gameState.updateState({...score...})` の箇所（現行 91-96 行）を以下に置換:

```typescript
      // 弾で盤面セルを消した場合は連鎖解決（撃って引き金を引く連鎖）
      const bulletScore = Math.round(result.score * scoreMultiplier);
      let nextGrid = result.grid;
      let addedLineScore = 0;
      let clearedByChain = 0;

      if (result.hitCount > 0) {
        const resolved = GameLogic.resolveBoard(result.grid);
        nextGrid = resolved.grid;
        clearedByChain = resolved.totalLines;
        if (clearedByChain > 0) {
          if (soundEnabled) Audio.line();
          if (onLineClear) onLineClear(clearedByChain);
          addedLineScore = GameLogic.calcResolveScore(resolved.chainSteps, {
            stage: state.stage,
            scoreMultiplier,
            comboMult,
          });
        }
      }

      const newScore = state.score + bulletScore + addedLineScore;
      const newLines = state.lines + clearedByChain;

      gameState.updateState({
        bullets: result.bullets,
        blocks: result.blocks,
        grid: nextGrid,
        score: newScore,
        lines: newLines,
        playerY: GameLogic.calculatePlayerY(nextGrid),
      });

      // 弾連鎖でステージクリアに到達した場合の判定
      if (clearedByChain > 0 && newLines >= state.linesNeeded) {
        saveScore('falling-shooter', newScore, difficulty)
          .then(() => loadHighScore())
          .catch(err => console.error(err));
        setStatus(Stage.isFinal(state.stage) ? 'ending' : 'clear');
      }
```

（`result.pendingBombs.forEach(...)` はそのまま後段に残す。弾ループのシグネチャに `setStatus` / `loadHighScore` / `difficulty` / `comboMult` は既に利用可能。）

- [ ] **Step 2: 失敗するテスト（弾トリガー連鎖）を書く**

`integration.test.tsx` に、弾でグリッドの穴を作り連鎖が起きるシナリオのテストを追加する。既存の統合テストのセットアップ（`render(<FalldownShooterGame />)` とテストモード or 直接 state 操作）に倣う。最小形:

```typescript
  test('弾で盤面セルを消すと連鎖解決が走りスコアが加算されること', async () => {
    // 既存の統合テストのハーネスに合わせて、grid に full 行の1セル手前を用意し、
    // 弾でその上の浮きセルを落として full 行を成立させる。
    // アサーション: onLineClear 相当（lines 増加）と score 増加。
    // ※ セットアップは既存 integration.test.tsx のパターン（テストモード fillRows 等）を流用する。
  });
```

（注: 既存ハーネスの具体 API に合わせて肉付けする。テストモードの `handleFillRows` を使うと full 手前の盤面が作りやすい。実装者は既存の `integration.test.tsx` を読んでから記述すること。）

- [ ] **Step 3: テストを実行**

Run: `npx jest --testPathPatterns='falldown-shooter' --no-coverage`
Expected: PASS

- [ ] **Step 4: コミット**

```bash
git add src/features/falldown-shooter/hooks/use-game-loop.ts src/features/falldown-shooter/__tests__/integration.test.tsx
git commit -m "feat: 弾でのセル消去後に連鎖解決を発動"
```

---

### Task 9: スキル・爆弾のセル消去後に連鎖を統合

**Files:**
- Modify: `src/features/falldown-shooter/hooks/use-skill-system.ts`
- Modify: `src/features/falldown-shooter/hooks/use-power-up.ts`（bomb の `applyExplosion` 後）
- Test: 各フックのテスト（既存があれば拡張、なければ薄い純粋部分のみ）

**Interfaces:**
- Consumes: `GameLogic.resolveBoard`, `GameLogic.calcResolveScore`。
- 挙動: laser/blast/clear/bomb がグリッドのセルを消した後、更新後グリッドを `resolveBoard` に通し、連鎖ぶんのスコア・ライン数・`onLineClear` を反映する。

- [ ] **Step 1: 実装方針を確認する（コード読解）**

`use-skill-system.ts` と `use-power-up.ts` を読み、各スキルがグリッドを更新して `gameState.updateState({ grid })` する箇所を特定する。それぞれのグリッド確定直後に共通処理を挟む。

- [ ] **Step 2: 共通の連鎖適用ヘルパーを作る**

`src/features/falldown-shooter/hooks/apply-chain.ts` を新規作成:

```typescript
// スキル・爆弾でセルを消した後に連鎖を適用する共通ヘルパー
import type { GameState } from '../types';
import { GameLogic } from '../game-logic';

export interface ApplyChainContext {
  scoreMultiplier: number;
  comboMult: number;
  onLineClear?: (lines: number) => void;
}

export interface ApplyChainResult {
  grid: (string | null)[][];
  addedScore: number;
  addedLines: number;
}

/** グリッドに連鎖解決を適用し、加算スコア・ライン数を返す（純粋に近い: onLineClear のみ副作用） */
export const applyChain = (
  grid: (string | null)[][],
  state: Pick<GameState, 'stage'>,
  ctx: ApplyChainContext
): ApplyChainResult => {
  const resolved = GameLogic.resolveBoard(grid);
  if (resolved.totalLines === 0) {
    return { grid: resolved.grid, addedScore: 0, addedLines: 0 };
  }
  if (ctx.onLineClear) ctx.onLineClear(resolved.totalLines);
  const addedScore = GameLogic.calcResolveScore(resolved.chainSteps, {
    stage: state.stage,
    scoreMultiplier: ctx.scoreMultiplier,
    comboMult: ctx.comboMult,
  });
  return { grid: resolved.grid, addedScore, addedLines: resolved.totalLines };
};
```

- [ ] **Step 3: 失敗するテストを書く**

`src/features/falldown-shooter/__tests__/apply-chain.test.ts` を新規作成:

```typescript
import { applyChain } from '../hooks/apply-chain';
import { Grid } from '../grid';

describe('applyChain', () => {
  test('連鎖なしなら加算0・grid は settle 済み', () => {
    const grid = Grid.create(2, 2);
    grid[0][0] = 'a';
    const r = applyChain(grid, { stage: 1 }, { scoreMultiplier: 1, comboMult: 1 });
    expect(r.addedLines).toBe(0);
    expect(r.addedScore).toBe(0);
    expect(r.grid[1][0]).toBe('a'); // 落ちている
  });

  test('full 行があれば onLineClear が呼ばれスコアが加算される', () => {
    const grid = Grid.create(2, 2);
    grid[1] = ['x', 'x'];
    const onLineClear = jest.fn();
    const r = applyChain(grid, { stage: 1 }, { scoreMultiplier: 1, comboMult: 1, onLineClear });
    expect(r.addedLines).toBe(1);
    expect(onLineClear).toHaveBeenCalledWith(1);
    expect(r.addedScore).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: テストを実行（失敗→実装で通す）**

Run: `npx jest --testPathPatterns='apply-chain' --no-coverage`
Expected: 最初 FAIL → `apply-chain.ts` 実装済みなら PASS

- [ ] **Step 5: 各スキル・爆弾に `applyChain` を差し込む**

`use-skill-system.ts` の laser/blast/clear、`use-power-up.ts` の bomb で、グリッド更新後に `applyChain` を呼び、返った `grid` を state に、`addedScore` を score に、`addedLines` を lines に加算する。各フックが `scoreMultiplier` / `comboMult` / `onLineClear` を受け取れるよう props を追加（未受領なら `FalldownShooterGame.tsx` から配線）。

- [ ] **Step 6: テスト全体を実行**

Run: `npx jest --testPathPatterns='falldown-shooter' --no-coverage`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/falldown-shooter/hooks/ src/features/falldown-shooter/__tests__/apply-chain.test.ts src/features/falldown-shooter/FalldownShooterGame.tsx
git commit -m "feat: スキル・爆弾のセル消去後に連鎖解決を適用"
```

---

### Task 10: スコアバランス回帰テストの追加

**Files:**
- Modify: `src/features/falldown-shooter/__tests__/score-balance.test.ts`

**Interfaces:**
- Consumes: `GameLogic.calcResolveScore`, `GameLogic.getChainMultiplier`。

- [ ] **Step 1: 想定スコア帯を固定するテストを追加**

`score-balance.test.ts` に、代表ケースの期待スコアを回帰固定するテストを追加:

```typescript
import { GameLogic } from '../game-logic';
import type { ChainStep } from '../types';

const mkSteps = (rowsPerChain: number[]): ChainStep[] =>
  rowsPerChain.map((rows, i) => ({
    chain: i + 1,
    clearedRows: Array.from({ length: rows }, (_, r) => r),
    grid: [],
    cellsCleared: rows * 12,
  }));

describe('連鎖スコアの回帰固定', () => {
  test('通常難易度・stage1・combo1 の 1連鎖1行 = 100点', () => {
    expect(
      GameLogic.calcResolveScore(mkSteps([1]), { stage: 1, scoreMultiplier: 1, comboMult: 1 })
    ).toBe(100);
  });

  test('コンボ最大5×連鎖最大8 でも上限内に収まる（青天井にならない）', () => {
    // 5連鎖×各1行, stage4, hard(1.5), combo5.0
    // base = 5*100*1.0 = 500 → *4 *1.5 *6.0(chain5) *5.0 = 90000
    const score = GameLogic.calcResolveScore(mkSteps([1, 1, 1, 1, 1]), {
      stage: 4,
      scoreMultiplier: 1.5,
      comboMult: 5.0,
    });
    expect(score).toBe(90000);
    expect(score).toBeLessThan(200000); // 事故的インフレの検知
  });
});
```

- [ ] **Step 2: テストを実行**

Run: `npx jest --testPathPatterns='score-balance' --no-coverage`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add src/features/falldown-shooter/__tests__/score-balance.test.ts
git commit -m "test: 連鎖スコアの想定帯を回帰固定"
```

---

# Phase 3: 連鎖ステップ再生と演出の段階増幅

**成果物:** 2連鎖以上のときに `isResolving` ロックで既存ループを止め、120ms間隔でステップを1段ずつ再生。連鎖数に応じて「◯ CHAIN!」表示・SEピッチ上昇・シェイク・パーティクルが段階増幅する。

---

### Task 11: 連鎖効果音 `Audio.chain(level)`

**Files:**
- Modify: `src/features/falldown-shooter/audio.ts`
- Test: `src/features/falldown-shooter/__tests__/audio.test.ts`

**Interfaces:**
- Produces: `Audio.chain(level: number): void` — 連鎖レベルに応じて基準周波数を半音ずつ上げて発音（例: `523 * 2^(level/12)`）。

- [ ] **Step 1: 失敗するテストを書く**

`audio.test.ts` の既存パターン（AudioContext をモックし例外を投げないことを確認）に倣って追加:

```typescript
  test('chain(level) は例外を投げないこと（未対応環境でも安全）', () => {
    expect(() => Audio.chain(1)).not.toThrow();
    expect(() => Audio.chain(5)).not.toThrow();
  });
```

- [ ] **Step 2: テストを実行（失敗確認）**

Run: `npx jest --testPathPatterns='falldown-shooter/__tests__/audio' --no-coverage`
Expected: FAIL（`Audio.chain is not a function`）

- [ ] **Step 3: 実装する**

`audio.ts` の return オブジェクトに追加:

```typescript
    // 連鎖レベルに応じてピッチを半音ずつ上げる（ぷよ的な上昇音）
    chain: (level: number) => {
      const base = 523; // C5
      const freq = base * Math.pow(2, Math.max(0, level - 1) / 12);
      playTone(freq, 0.1, 'sine', 0.25);
    },
```

- [ ] **Step 4: テストを実行（成功確認）**

Run: `npx jest --testPathPatterns='falldown-shooter/__tests__/audio' --no-coverage`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/falldown-shooter/audio.ts src/features/falldown-shooter/__tests__/audio.test.ts
git commit -m "feat: 連鎖効果音 Audio.chain（ピッチ上昇）を追加"
```

---

### Task 12: 連鎖表示コンポーネント `ChainDisplay`

**Files:**
- Create: `src/features/falldown-shooter/components/ChainDisplay.tsx`
- Test: `src/features/falldown-shooter/__tests__/components/ChainDisplay.test.tsx`
- Modify: `src/features/falldown-shooter/constants.ts`（連鎖演出色テーブル追加）

**Interfaces:**
- Produces: `ChainDisplay: React.FC<{ chain: number }>` — `chain >= 2` のとき「◯ CHAIN!」を表示、`chain < 2` は null。連鎖数で色が段階変化。
- 定数 `CHAIN_EFFECT: { colorByChain: string[]; shakeIntensity: (chain: number) => number }`。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/components/ChainDisplay.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { ChainDisplay } from '../../components/ChainDisplay';

describe('ChainDisplay', () => {
  test('chain>=2 のとき「N CHAIN!」を表示すること', () => {
    render(<ChainDisplay chain={3} />);
    expect(screen.getByText(/3 CHAIN/)).toBeInTheDocument();
  });

  test('chain<2 のときは何も表示しないこと', () => {
    const { container } = render(<ChainDisplay chain={1} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: テストを実行（失敗確認）**

Run: `npx jest --testPathPatterns='ChainDisplay' --no-coverage`
Expected: FAIL

- [ ] **Step 3: 定数を追加する**

`constants.ts` に追記:

```typescript
// 連鎖演出（連鎖数に応じた色とシェイク強度）
export const CHAIN_EFFECT = {
  // index=連鎖数-2（2連鎖以上で表示）。上限超えは末尾色。
  colorByChain: ['#FFFFFF', '#FFEAA7', '#FF8C42', '#FF4500', '#FF00FF'],
  /** 連鎖数に比例したシェイク強度（上限あり） */
  shakeIntensity: (chain: number): number => Math.min(2 + chain, 8),
} as const;
```

- [ ] **Step 4: コンポーネントを実装する**

`components/ChainDisplay.tsx`:

```typescript
// 連鎖数を大きくポップ表示するコンポーネント（React.memo）
import React from 'react';
import { CHAIN_EFFECT } from '../constants';

interface ChainDisplayProps {
  chain: number;
}

/** 2連鎖以上のとき「N CHAIN!」を段階色で表示する */
export const ChainDisplay: React.FC<ChainDisplayProps> = React.memo(({ chain }) => {
  if (chain < 2) return null;
  const colors = CHAIN_EFFECT.colorByChain;
  const color = colors[Math.min(chain - 2, colors.length - 1)];
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color,
        fontWeight: 'bold',
        fontSize: `${Math.min(2 + chain * 0.3, 4)}rem`,
        textShadow: '0 0 12px currentColor',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {chain} CHAIN!
    </div>
  );
});

ChainDisplay.displayName = 'ChainDisplay';
```

- [ ] **Step 5: テストを実行（成功確認）**

Run: `npx jest --testPathPatterns='ChainDisplay' --no-coverage`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/falldown-shooter/components/ChainDisplay.tsx src/features/falldown-shooter/__tests__/components/ChainDisplay.test.tsx src/features/falldown-shooter/constants.ts
git commit -m "feat: 連鎖数表示コンポーネント ChainDisplay を追加"
```

---

### Task 13: 連鎖再生フック `use-chain-resolver`

**Files:**
- Create: `src/features/falldown-shooter/hooks/use-chain-resolver.ts`
- Test: `src/features/falldown-shooter/__tests__/use-chain-resolver.test.ts`

**Interfaces:**
- Consumes: `ChainStep`（型）, `Audio.chain`, `CHAIN_EFFECT`。
- Produces:
  - `useChainResolver(): { isResolving: boolean; currentChain: number; play: (steps: ChainStep[], onCommit: (grid) => void, onDone: () => void) => void }`
  - `play` は `steps.length >= 2` のとき再生モードに入り、`intervalMs`（120ms）ごとに各 `step.grid` を `onCommit` し `Audio.chain(step.chain)` を鳴らす。最終ステップ後 `onDone` を呼び `isResolving=false`。`steps.length < 2` のときは即座に最終 grid を `onCommit` して `onDone`（再生しない）。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/use-chain-resolver.test.ts`（`@testing-library/react` の `renderHook` + `act` + `jest.useFakeTimers`）:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useChainResolver } from '../hooks/use-chain-resolver';
import type { ChainStep } from '../types';

const mkStep = (chain: number): ChainStep => ({
  chain,
  clearedRows: [0],
  grid: [[`g${chain}`]],
  cellsCleared: 1,
});

describe('useChainResolver', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('2連鎖以上は isResolving=true になり、間隔ごとに commit されること', () => {
    const commits: unknown[] = [];
    const onDone = jest.fn();
    const { result } = renderHook(() => useChainResolver());

    act(() => {
      result.current.play([mkStep(1), mkStep(2)], g => commits.push(g), onDone);
    });
    expect(result.current.isResolving).toBe(true);

    act(() => { jest.advanceTimersByTime(120); });
    act(() => { jest.advanceTimersByTime(120); });

    expect(commits.length).toBe(2);
    expect(onDone).toHaveBeenCalled();
    expect(result.current.isResolving).toBe(false);
  });

  test('連鎖1段以下は再生せず即 commit・onDone すること', () => {
    const commits: unknown[] = [];
    const onDone = jest.fn();
    const { result } = renderHook(() => useChainResolver());
    act(() => {
      result.current.play([mkStep(1)], g => commits.push(g), onDone);
    });
    expect(result.current.isResolving).toBe(false);
    expect(commits.length).toBe(1);
    expect(onDone).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: テストを実行（失敗確認）**

Run: `npx jest --testPathPatterns='use-chain-resolver' --no-coverage`
Expected: FAIL

- [ ] **Step 3: フックを実装する**

`hooks/use-chain-resolver.ts`:

```typescript
// 連鎖ステップを時間軸で1段ずつ再生するフック
import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChainStep } from '../types';
import { Audio } from '../audio';

const STEP_INTERVAL_MS = 120;

interface UseChainResolverReturn {
  isResolving: boolean;
  currentChain: number;
  play: (
    steps: ChainStep[],
    onCommit: (grid: (string | null)[][]) => void,
    onDone: () => void
  ) => void;
}

/** 2連鎖以上を1段ずつ再生し、演出（連鎖数・SE）を段階発火する */
export const useChainResolver = (): UseChainResolverReturn => {
  const [isResolving, setIsResolving] = useState(false);
  const [currentChain, setCurrentChain] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const play = useCallback<UseChainResolverReturn['play']>((steps, onCommit, onDone) => {
    // 1段以下は即時確定（通常プレイのテンポを保つ）
    if (steps.length < 2) {
      if (steps.length === 1) onCommit(steps[0].grid);
      setCurrentChain(0);
      setIsResolving(false);
      onDone();
      return;
    }

    setIsResolving(true);
    let i = 0;
    const advance = (): void => {
      const step = steps[i];
      onCommit(step.grid);
      setCurrentChain(step.chain);
      Audio.chain(step.chain);
      i += 1;
      if (i < steps.length) {
        timerRef.current = setTimeout(advance, STEP_INTERVAL_MS);
      } else {
        timerRef.current = setTimeout(() => {
          setIsResolving(false);
          setCurrentChain(0);
          onDone();
        }, STEP_INTERVAL_MS);
      }
    };
    advance();
  }, []);

  return { isResolving, currentChain, play };
};
```

- [ ] **Step 4: テストを実行（成功確認）**

Run: `npx jest --testPathPatterns='use-chain-resolver' --no-coverage`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/falldown-shooter/hooks/use-chain-resolver.ts src/features/falldown-shooter/__tests__/use-chain-resolver.test.ts
git commit -m "feat: 連鎖ステップ再生フック use-chain-resolver を追加"
```

---

### Task 14: 再生フックを本体に配線（isResolving ロック＋演出）

**Files:**
- Modify: `src/features/falldown-shooter/FalldownShooterGame.tsx`
- Modify: `src/features/falldown-shooter/hooks/use-game-loop.ts`（着地・弾・スキル経路で「2連鎖以上なら resolver に委譲」する分岐）
- Test: `src/features/falldown-shooter/__tests__/integration.test.tsx`

**Interfaces:**
- Consumes: `useChainResolver`, `ChainDisplay`, `CHAIN_EFFECT`。
- 挙動:
  - `FalldownShooterGame` で `const chainResolver = useChainResolver()` を生成。
  - `useGameLoop` の `isPlaying` を `isPlaying && !isPaused && !chainResolver.isResolving` に変更（再生中はループ停止）。
  - `gameBoardContent` に `<ChainDisplay chain={chainResolver.currentChain} />` を追加。
  - 各解決点（着地・弾・スキル）で `resolveBoard` の結果 `chainSteps.length >= 2` のとき `chainResolver.play(steps, grid => updateState({ grid, playerY }), onDone)` に委譲し、`onDone` でステージクリア／ゲームオーバー判定を評価。1段以下は従来どおり即時 `updateState`。
  - 連鎖再生中は連鎖数に応じて `shake.triggerShake(CHAIN_EFFECT.shakeIntensity(chain), 200)`、`chain >= 4` で花火エフェクト発火。

- [ ] **Step 1: 配線方針を確認（コード読解）**

`FalldownShooterGame.tsx` の `useGameLoop` 呼び出しと `gameBoardContent`、`use-game-loop.ts` の3解決点を読み、`chainResolver` と `onDone` コールバックを渡す口を決める。`useGameLoop` に `chainResolver` を props で渡し、内部で「2連鎖以上なら play」を分岐する。

- [ ] **Step 2: `FalldownShooterGame.tsx` を配線する**

- `import { useChainResolver } from './hooks/use-chain-resolver';` と `import { ChainDisplay } from './components/ChainDisplay';` を追加。
- `const chainResolver = useChainResolver();` を追加。
- `useGameLoop({...})` に `isPlaying: isPlaying && !isPaused && !chainResolver.isResolving` と `chainResolver` を渡す。
- `gameBoardContent` の `<ComboDisplay .../>` の隣に `<ChainDisplay chain={chainResolver.currentChain} />` を追加。

- [ ] **Step 3: `use-game-loop.ts` の3解決点を「2連鎖以上は委譲」に分岐する**

各解決点で `resolved.chainSteps.length >= 2` のとき `chainResolver.play(resolved.chainSteps, grid => gameState.updateState({ grid, playerY: GameLogic.calculatePlayerY(grid) }), () => { /* スコア加算・ライン加算・進行判定 */ })`。1段以下は現行どおり即時 `updateState`。スコア・ライン加算は再生の有無に関わらず `play` 呼び出し前に一括 `updateState`（grid を除く）してよい（grid のみ再生でアニメーション）。

- [ ] **Step 4: 統合テストを追加・実行する**

`integration.test.tsx` に「2連鎖発生時に再生が走り、完了後に最終盤面へ収束する」テストを追加（`jest.useFakeTimers` で 120ms×N 進める）。既存ハーネスに合わせて記述。

Run: `npx jest --testPathPatterns='falldown-shooter' --no-coverage`
Expected: PASS

- [ ] **Step 5: 連鎖演出（シェイク・花火）を追加する**

`use-chain-resolver` の `advance` 内、または `FalldownShooterGame` 側で `currentChain` の変化を `useEffect` で監視し、`shake.triggerShake(CHAIN_EFFECT.shakeIntensity(currentChain), 200)` と `chain >= 4` の花火を発火する。`prefers-reduced-motion` は既存 shake が尊重済み。

Run: `npx jest --testPathPatterns='falldown-shooter' --no-coverage`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/falldown-shooter/
git commit -m "feat: 連鎖再生を本体に配線し isResolving ロックと段階演出を追加"
```

---

# Phase 4: バランス実測と回帰仕上げ

**成果物:** 実プレイ確認でバランスを検証し、必要な微調整と回帰テストの仕上げを行う。

---

### Task 15: 手動プレイ検証とバランス微調整

**Files:**
- Modify（必要時）: `src/features/falldown-shooter/constants.ts`（`CHAIN_BONUS` / `CONFIG.timing`）

- [ ] **Step 1: 開発サーバーで実プレイ確認**

Run: `npm start`
確認項目（テストモードの `handleFillRows` で連鎖セットアップを作ると再現しやすい）:
- 2〜5連鎖を意図的に起こし、演出（CHAIN 表示・SE 上昇・シェイク・花火）が段階増幅するか。
- 再生中に落下・スポーンが止まり、完了後に正しく再開するか。
- 難易度が極端に易しく/難しくなっていないか（連鎖で片付きすぎないか）。

- [ ] **Step 2: 必要なら倍率・タイミングを微調整**

- 連鎖が簡単すぎる → `CHAIN_BONUS` の高連鎖倍率を下げる、または `CONFIG.timing.spawn` を短くして供給を増やす。
- 山場が地味 → `CHAIN_EFFECT` の色・シェイク・`STEP_INTERVAL_MS` を調整。
- 変更したら `score-balance.test.ts` の期待値も更新する。

- [ ] **Step 3: 調整があればコミット**

```bash
git add src/features/falldown-shooter/
git commit -m "perf: 連鎖バランスを実測に基づき微調整"
```

---

### Task 16: 回帰テストの仕上げと CI 全体パス

**Files:**
- Modify: 影響のあったテスト各種
- Modify: `src/features/falldown-shooter/README.md`（連鎖仕様の追記）

- [ ] **Step 1: README に連鎖崩壊の説明を追記**

「機能」節に「連鎖崩壊: 撃破・着地で列重力が働き、揃った行が連続で消える連鎖」を追加。

- [ ] **Step 2: falldown-shooter のカバレッジ確認**

Run: `npx jest --testPathPatterns='falldown-shooter' --coverage`
Expected: 新規純粋関数（grid / game-logic / apply-chain）90%+、フック・コンポーネント 70%+。不足なら分岐テストを追加。

- [ ] **Step 3: CI 全体パイプラインを実行**

Run: `npm run ci`
Expected: lint:ci → typecheck → test:coverage → build 全て PASS

- [ ] **Step 4: コミット**

```bash
git add src/features/falldown-shooter/README.md src/features/falldown-shooter/
git commit -m "docs: README に連鎖崩壊仕様を追記しテストを仕上げ"
```

---

## 完了条件

- [ ] 弾・着地・スキル・爆弾のいずれでも、揃った行が列重力＋連鎖で消える。
- [ ] 2連鎖以上で `isResolving` ロック下のステップ再生と段階演出（CHAIN 表示・SE 上昇・シェイク・花火）が走る。
- [ ] 連鎖倍率がスコアに乗り、コンボとの二重暴走がない（`comboMult` は解決開始時点で固定）。
- [ ] `npm run ci` が全てパスする。
- [ ] `domain/` 層（死蔵）を変更していない。

## スコープ外（YAGNI）

- フィーバー／オーバードライブモード（別案 B）、土壇場デンジャー・クリア（別案 C）。
- `domain/` 層の整理・統合。
- 難易度パラメータの先回りチューニング（Task 15 の実測後に限定的に実施）。

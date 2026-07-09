# Picture Puzzle フェーズ4「面白さ（新モード）」Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「本日の一枚（日付シード固定）」と「鑑定チャレンジ（タイム＋手数でメダル）」の2モードを追加し、既存の通常プレイに影響を与えない。

**Architecture:** シード・日付変換・デイリー選択・達成判定はドメイン/ユースケースの純粋関数に置く。`shufflePuzzle` に rng を注入（default `Math.random`）し、`initializePuzzle` の再シャッフルを seed+試行番号で決定化。UI は `PuzzlePage` の `mode` state とモード導線・メダル表示のみ。`new Date()` は presentation 限定。

**Tech Stack:** React 19 + TypeScript + Jotai + styled-components。テストは Jest 30 + @testing-library。

## Global Constraints

- 応答・コメント・ドキュメントは日本語。コード（変数・関数名）は英語可。`any` 型禁止（`unknown`+型ガード）。名前付きエクスポート優先。
- **安全境界（厳守）**: 変更は picture-puzzle 局所。触らない: `src/styles/GlobalStyle.ts` / `src/styles/tokens/*` / `src/App.tsx` / `src/pages/GameListPage.tsx` / `src/features/*`。**新規 localStorage キーを追加しない**。
- **依存方向**: `domain/` は外部依存なし・副作用なし（`new Date()`/`Math.random` を直接持ち込まない。乱数は rng 引数、日付は文字列引数で注入）。`application/` は `domain/` のみ参照。
- 通常プレイ（seed なし）は挙動不変。seed は optional で後方互換を型で担保。
- デイリー出題: 全15点（アンロック無視）。難易度プール `DAILY_DIVISIONS = [3, 4, 5]`。
- チャレンジメダル定数: `MEDAL_TIME_SECONDS_PER_OPTIMAL_MOVE = 3`, `MEDAL_MOVE_MARGIN_RATIO = 1.5`。`optimalMoves = division² × 2`。両条件達成=gold / 片方=silver / クリアのみ=bronze。
- focus-visible / 44px は P3 のパターン（`outline: 2px solid ${galleryTokens.ink}; outline-offset: 2px; min-height: 44px`）を新規ボタンにも踏襲。
- TDD。ドメイン 90%+ / 新規コード 80%+。Conventional Commits。

---

### Task 1: シード RNG と日付シード（ドメイン純粋関数）

**Files:**
- Create: `src/domain/puzzle/value-objects/seed.ts`
- Test: `src/domain/puzzle/value-objects/seed.test.ts`

**Interfaces:**
- Produces:
  - `createSeededRng(seed: number): () => number` — [0,1) を返す決定的 PRNG
  - `dateStringToSeed(yyyymmdd: string): number`

- [ ] **Step 1: 失敗するテストを書く**

```typescript
// src/domain/puzzle/value-objects/seed.test.ts
import { createSeededRng, dateStringToSeed } from './seed';

describe('createSeededRng', () => {
  it('同一シードは同一の数列を返す', () => {
    const a = createSeededRng(12345);
    const b = createSeededRng(12345);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('異なるシードは異なる数列を返す', () => {
    const a = createSeededRng(1);
    const b = createSeededRng(2);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it('返す値は 0 以上 1 未満', () => {
    const rng = createSeededRng(99);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('dateStringToSeed', () => {
  it('YYYYMMDD 文字列を数値シードへ変換する', () => {
    expect(dateStringToSeed('20260709')).toBe(20260709);
  });

  it('同一日付は同一シード', () => {
    expect(dateStringToSeed('20260709')).toBe(dateStringToSeed('20260709'));
  });

  it('8桁数字以外は例外を投げる（事前条件）', () => {
    expect(() => dateStringToSeed('2026-07-09')).toThrow();
    expect(() => dateStringToSeed('2026070')).toThrow();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- puzzle/value-objects/seed`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: 最小実装を書く**

```typescript
// src/domain/puzzle/value-objects/seed.ts
import { assert } from '../../../shared/utils/assert';

/**
 * 決定的擬似乱数生成器（mulberry32）を生成する。
 * 同一シードから常に同一の [0,1) 数列を返す純粋関数。
 */
export const createSeededRng = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** 'YYYYMMDD' 形式の日付文字列を数値シードへ変換する（事前条件: 8桁数字） */
export const dateStringToSeed = (yyyymmdd: string): number => {
  assert(/^\d{8}$/.test(yyyymmdd), `Invalid date seed: ${yyyymmdd}. Must be YYYYMMDD.`);
  return parseInt(yyyymmdd, 10);
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- puzzle/value-objects/seed`
Expected: PASS（6件）

- [ ] **Step 5: コミット**

```bash
git add src/domain/puzzle/value-objects/seed.ts src/domain/puzzle/value-objects/seed.test.ts
git commit -m "feat: シードRNG(mulberry32)と日付シード変換の純粋関数を追加"
```

---

### Task 2: shufflePuzzle に rng 注入（決定的シャッフル）

**Files:**
- Modify: `src/domain/puzzle/services/shuffle-service.ts:19,41`
- Test: `src/domain/puzzle/services/shuffle-service.test.ts`（追記）

**Interfaces:**
- Consumes: `createSeededRng`（Task 1）
- Produces: `shufflePuzzle(board, moves, rng?: () => number)` — 第3引数 rng（default `Math.random`）

- [ ] **Step 1: 失敗するテストを追記する**

```typescript
// src/domain/puzzle/services/shuffle-service.test.ts に追記
import { createSeededRng } from '../value-objects/seed';
// 既存の import（shufflePuzzle, createPuzzleBoard 等）を利用する

describe('shufflePuzzle シード対応', () => {
  it('同一 rng シーケンスは同一の配置を生成する（決定的）', () => {
    const board = createPuzzleBoard(4);
    const a = shufflePuzzle(board, 30, createSeededRng(777));
    const b = shufflePuzzle(board, 30, createSeededRng(777));
    expect(a.pieces.map(p => p.currentPosition)).toEqual(b.pieces.map(p => p.currentPosition));
    expect(a.emptyPosition).toEqual(b.emptyPosition);
  });

  it('rng 省略時は従来どおり動作する（Math.random）', () => {
    const board = createPuzzleBoard(3);
    const shuffled = shufflePuzzle(board, 20);
    expect(shuffled.pieces).toHaveLength(board.pieces.length);
  });
});
```

> 注: `createPuzzleBoard` の import が既存テストにあるか確認し、なければ `import { createPuzzleBoard } from '../aggregates/puzzle-board';` を追加する。

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- shuffle-service`
Expected: FAIL（`shufflePuzzle` が3引数を受け付けない → 決定性テストが安定しない or 型エラー）

- [ ] **Step 3: 実装を変更する**

`shuffle-service.ts` の関数シグネチャ（19行）と乱数呼び出し（41行）を変更する:

```typescript
export const shufflePuzzle = (
  board: PuzzleBoardState,
  moves: number,
  rng: () => number = Math.random
): PuzzleBoardState => {
```

41行の `Math.random()` を `rng()` に差し替える:

```typescript
      const randomIdx = Math.floor(rng() * adjacents.length);
```

（他の行は不変。JSDoc に `@param rng 乱数生成器（デフォルト Math.random）` を追記する。）

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- shuffle-service`
Expected: PASS（既存 + 新規2件）

- [ ] **Step 5: コミット**

```bash
git add src/domain/puzzle/services/shuffle-service.ts src/domain/puzzle/services/shuffle-service.test.ts
git commit -m "feat: shufflePuzzle に rng 注入を追加し決定的シャッフルを可能に"
```

---

### Task 3: initializePuzzle のシード対応（再シャッフル決定化）

**Files:**
- Modify: `src/application/use-cases/initialize-puzzle.ts:22-42`
- Test: `src/application/use-cases/initialize-puzzle.test.ts`（追記）

**Interfaces:**
- Consumes: `createSeededRng`（Task 1）, `shufflePuzzle`（Task 2）
- Produces: `initializePuzzle(division, options?: { seed?: number; shuffleMovesOverride?: number }): PuzzleBoardState`

- [ ] **Step 1: 失敗するテストを追記する**

```typescript
// src/application/use-cases/initialize-puzzle.test.ts に追記
// 既存の import（initializePuzzle）を利用する

describe('initializePuzzle シード対応', () => {
  it('同一シードは同一配置を生成する（同日同一シードで再現）', () => {
    const a = initializePuzzle(4, { seed: 20260709 });
    const b = initializePuzzle(4, { seed: 20260709 });
    expect(a.pieces.map(p => p.currentPosition)).toEqual(b.pieces.map(p => p.currentPosition));
    expect(a.emptyPosition).toEqual(b.emptyPosition);
    expect(a.isCompleted).toBe(false);
  });

  it('異なるシードは異なる配置になり得る', () => {
    const a = initializePuzzle(4, { seed: 1 });
    const b = initializePuzzle(4, { seed: 2 });
    expect(a.pieces.map(p => p.currentPosition)).not.toEqual(b.pieces.map(p => p.currentPosition));
  });

  it('seed 未指定時は従来どおり未完成のボードを返す', () => {
    const board = initializePuzzle(3);
    expect(board.isCompleted).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- initialize-puzzle`
Expected: FAIL（`initializePuzzle` が options オブジェクトを受け付けない・既存の第2引数は number）

- [ ] **Step 3: 実装を変更する**

`initialize-puzzle.ts` を以下へ置き換える（第2引数を options 化。seed 指定時は試行ごとに `createSeededRng(seed + attempt)` を使い決定化）:

```typescript
/**
 * パズル初期化ユースケース
 *
 * パズルの生成 → シャッフル → 初期状態の返却を行う。
 */
import { createPuzzleBoard, PuzzleBoardState } from '../../domain/puzzle/aggregates/puzzle-board';
import { shufflePuzzle } from '../../domain/puzzle/services/shuffle-service';
import { calculateShuffleMoves, createDivision } from '../../domain/puzzle/value-objects/division';
import { createSeededRng } from '../../domain/puzzle/value-objects/seed';

/** シャッフル後に完成状態だった場合の最大再試行回数 */
const MAX_RESHUFFLE_ATTEMPTS = 10;

/** パズル初期化オプション */
export interface InitializePuzzleOptions {
  /** 日付シード等。指定時は決定的シャッフル（同一シード→同一配置） */
  readonly seed?: number;
  /** シャッフル回数の上書き（テスト用） */
  readonly shuffleMovesOverride?: number;
}

/**
 * パズルを初期化する。
 *
 * シャッフル後に偶然完成状態になった場合は再シャッフルする。
 * seed 指定時は試行番号を加味した決定的 rng を使い、同一シードで必ず同一配置になる。
 *
 * @param division 分割数
 * @param options seed / shuffleMovesOverride
 * @returns シャッフル済みのパズルボード状態（必ず未完成）
 */
export const initializePuzzle = (
  division: number,
  options?: InitializePuzzleOptions
): PuzzleBoardState => {
  const validDivision = createDivision(division);
  const board = createPuzzleBoard(validDivision);
  const moves = options?.shuffleMovesOverride ?? calculateShuffleMoves(validDivision);
  const seed = options?.seed;

  for (let attempt = 0; attempt <= MAX_RESHUFFLE_ATTEMPTS; attempt++) {
    const shuffleMoves = attempt < MAX_RESHUFFLE_ATTEMPTS ? moves : moves * 2;
    // seed 指定時は試行ごとに決定的 rng を派生（再シャッフルも再現可能にする）
    const rng = seed !== undefined ? createSeededRng(seed + attempt) : Math.random;
    const shuffled = shufflePuzzle(board, shuffleMoves, rng);
    if (!shuffled.isCompleted) {
      return shuffled;
    }
  }

  const finalRng = seed !== undefined ? createSeededRng(seed + MAX_RESHUFFLE_ATTEMPTS) : Math.random;
  return shufflePuzzle(board, moves * 2, finalRng);
};
```

> 注: 既存テストが `initializePuzzle(division, shuffleMovesOverride)` の第2引数に number を渡している場合、それらを `initializePuzzle(division, { shuffleMovesOverride })` へ更新する必要がある。既存テストを Read し、呼び出し箇所をすべて options 形式へ修正すること（挙動は不変）。

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- initialize-puzzle`
Expected: PASS（既存 + 新規3件）。既存テストの呼び出し形式修正も緑であること。

- [ ] **Step 5: 呼び出し元の型互換を確認する**

Run: `npm run typecheck`
Expected: PASS（`usePuzzleGame` はまだ `initializePuzzle(division)` の1引数呼び出しで、options は optional なので型エラーなし）

- [ ] **Step 6: コミット**

```bash
git add src/application/use-cases/initialize-puzzle.ts src/application/use-cases/initialize-puzzle.test.ts
git commit -m "feat: initializePuzzle をシード対応化し再シャッフルを決定化"
```

---

### Task 4: 本日の一枚 選択ユースケース

**Files:**
- Create: `src/application/use-cases/select-daily-puzzle.ts`
- Test: `src/application/use-cases/select-daily-puzzle.test.ts`

**Interfaces:**
- Consumes: `Theme`（`src/types/puzzle`）
- Produces: `selectDailyPuzzle(themes: readonly Theme[], seed: number): DailyPuzzle`（`{ imageId, filename, division }`）, `DAILY_DIVISIONS`

- [ ] **Step 1: 失敗するテストを書く**

```typescript
// src/application/use-cases/select-daily-puzzle.test.ts
import { selectDailyPuzzle, DAILY_DIVISIONS } from './select-daily-puzzle';
import { Theme } from '../../types/puzzle';

const themes: Theme[] = [
  {
    id: 'illustration-gallery',
    name: 'イラストギャラリー',
    description: 'd',
    unlockCondition: { type: 'always' },
    images: [
      { id: 'img_a', filename: 'a.webp', alt: 'A', themeId: 'illustration-gallery', hasVideo: false },
      { id: 'img_b', filename: 'b.webp', alt: 'B', themeId: 'illustration-gallery', hasVideo: false },
    ],
  },
  {
    id: 'mystery',
    name: 'ミステリー',
    description: 'd',
    unlockCondition: { type: 'themesClear', themeIds: [] },
    images: [
      { id: 'img_c', filename: 'c.webp', alt: 'C', themeId: 'mystery', hasVideo: false },
    ],
  },
];

describe('selectDailyPuzzle', () => {
  it('同一シードは同一の出題（作品・難易度）を返す', () => {
    const a = selectDailyPuzzle(themes, 20260709);
    const b = selectDailyPuzzle(themes, 20260709);
    expect(a).toEqual(b);
  });

  it('難易度は DAILY_DIVISIONS のいずれか', () => {
    const daily = selectDailyPuzzle(themes, 20260709);
    expect(DAILY_DIVISIONS).toContain(daily.division);
  });

  it('未開館テーマ(mystery)の作品も選ばれ得る（全画像が対象）', () => {
    // seed % 3 === 2 で3枚目(img_c, mystery)が選ばれるシードを探す
    const seed = [0, 1, 2].map(n => n).find(n => n % 3 === 2) ?? 2;
    const daily = selectDailyPuzzle(themes, seed);
    // 全画像フラット [img_a, img_b, img_c] の index 2
    expect(daily.imageId).toBe('img_c');
    expect(daily.filename).toBe('c.webp');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- select-daily-puzzle`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: 最小実装を書く**

```typescript
// src/application/use-cases/select-daily-puzzle.ts
import { Theme } from '../../types/puzzle';

/** デイリー出題で使う難易度プール */
export const DAILY_DIVISIONS = [3, 4, 5] as const;

/** 本日の一枚の出題内容 */
export interface DailyPuzzle {
  readonly imageId: string;
  readonly filename: string;
  readonly division: number;
}

/**
 * 日付シードから「本日の一枚」を決定的に選ぶ純粋関数。
 * 全テーマの全画像（アンロック状態は無視）をフラット化し、シードで作品と難易度を決める。
 */
export const selectDailyPuzzle = (themes: readonly Theme[], seed: number): DailyPuzzle => {
  const images = themes.flatMap(theme => theme.images);
  if (images.length === 0) {
    throw new Error('No images available for daily puzzle');
  }
  const image = images[seed % images.length];
  const division = DAILY_DIVISIONS[seed % DAILY_DIVISIONS.length];
  return { imageId: image.id, filename: image.filename, division };
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- select-daily-puzzle`
Expected: PASS（3件）

- [ ] **Step 5: コミット**

```bash
git add src/application/use-cases/select-daily-puzzle.ts src/application/use-cases/select-daily-puzzle.test.ts
git commit -m "feat: 本日の一枚を日付シードで決定的に選ぶユースケースを追加"
```

---

### Task 5: 鑑定チャレンジ 達成判定（ドメイン純粋関数）

**Files:**
- Create: `src/domain/puzzle/services/challenge-evaluator.ts`
- Test: `src/domain/puzzle/services/challenge-evaluator.test.ts`

**Interfaces:**
- Produces: `evaluateChallenge(input): ChallengeMedal`（`'gold'|'silver'|'bronze'`）, 定数 `MEDAL_TIME_SECONDS_PER_OPTIMAL_MOVE`, `MEDAL_MOVE_MARGIN_RATIO`

- [ ] **Step 1: 失敗するテストを書く**

```typescript
// src/domain/puzzle/services/challenge-evaluator.test.ts
import { evaluateChallenge } from './challenge-evaluator';

// division 4 → optimalMoves = 32 → timeLimit = 96秒, moveLimit = round(48) = 48
const optimalMoves = 32;

describe('evaluateChallenge', () => {
  it('時間内かつ手数内は gold', () => {
    expect(evaluateChallenge({ elapsedSeconds: 90, actualMoves: 40, optimalMoves })).toBe('gold');
  });

  it('時間内だが手数超過は silver', () => {
    expect(evaluateChallenge({ elapsedSeconds: 90, actualMoves: 60, optimalMoves })).toBe('silver');
  });

  it('手数内だが時間超過は silver', () => {
    expect(evaluateChallenge({ elapsedSeconds: 200, actualMoves: 40, optimalMoves })).toBe('silver');
  });

  it('両方未達（クリアのみ）は bronze', () => {
    expect(evaluateChallenge({ elapsedSeconds: 200, actualMoves: 100, optimalMoves })).toBe('bronze');
  });

  it('境界値（ちょうど制限）は達成扱い', () => {
    // timeLimit=96, moveLimit=48
    expect(evaluateChallenge({ elapsedSeconds: 96, actualMoves: 48, optimalMoves })).toBe('gold');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- challenge-evaluator`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: 最小実装を書く**

```typescript
// src/domain/puzzle/services/challenge-evaluator.ts

/** 鑑定メダルの種別 */
export type ChallengeMedal = 'gold' | 'silver' | 'bronze';

/** 制限時間 = 最適手数 × この秒数 */
export const MEDAL_TIME_SECONDS_PER_OPTIMAL_MOVE = 3;
/** 手数制限 = 最適手数 × この比率 */
export const MEDAL_MOVE_MARGIN_RATIO = 1.5;

/** 達成判定の入力 */
export interface ChallengeInput {
  readonly elapsedSeconds: number;
  readonly actualMoves: number;
  /** 最適手数 = division² × 2 */
  readonly optimalMoves: number;
}

/**
 * タイム＋手数の両条件から鑑定メダルを判定する純粋関数。
 * 両達成=gold / 片方達成=silver / クリアのみ=bronze。
 */
export const evaluateChallenge = (input: ChallengeInput): ChallengeMedal => {
  const timeLimit = input.optimalMoves * MEDAL_TIME_SECONDS_PER_OPTIMAL_MOVE;
  const moveLimit = Math.round(input.optimalMoves * MEDAL_MOVE_MARGIN_RATIO);
  const withinTime = input.elapsedSeconds <= timeLimit;
  const withinMove = input.actualMoves <= moveLimit;

  if (withinTime && withinMove) return 'gold';
  if (withinTime || withinMove) return 'silver';
  return 'bronze';
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- challenge-evaluator`
Expected: PASS（5件）

- [ ] **Step 5: コミット**

```bash
git add src/domain/puzzle/services/challenge-evaluator.ts src/domain/puzzle/services/challenge-evaluator.test.ts
git commit -m "feat: 鑑定チャレンジのメダル判定（タイム+手数）ドメイン関数を追加"
```

---

### Task 6: プレイフローに seed/division 注入経路を追加

**Files:**
- Modify: `src/presentation/hooks/usePuzzleGame.ts:22-29`
- Modify: `src/presentation/hooks/useGameFlow.ts:118-126`

**Interfaces:**
- Consumes: `initializePuzzle` options（Task 3）
- Produces:
  - `usePuzzleGame().initialize(division: number, seed?: number)`
  - `useGameFlow().handleStartGame(options?: { division?: number; seed?: number })`

- [ ] **Step 1: usePuzzleGame.initialize に seed を追加する**

`usePuzzleGame.ts` の `initialize`（22-29行）を変更:

```typescript
  /** パズルを初期化する（seed 指定時は決定的シャッフル） */
  const initialize = useCallback(
    (division: number, seed?: number) => {
      const board = initializePuzzle(division, seed !== undefined ? { seed } : undefined);
      setBoardState(board);
      setHintUsed(false);
    },
    [setBoardState, setHintUsed]
  );
```

（`reset` は `initialize(division)` のままでよい＝リセットは通常シャッフル。）

- [ ] **Step 2: useGameFlow.handleStartGame に options を追加する**

`useGameFlow.ts` の `handleStartGame`（118-126行）を変更（division/seed を明示注入できるようにし、atom タイミングに依存しない）:

```typescript
  /** ゲームを開始する（options で難易度・シードを明示注入可能） */
  const handleStartGame = useCallback(
    (options?: { division?: number; seed?: number }) => {
      const startDivision = options?.division ?? division;
      setScore(null);
      setIsBestScore(false);
      setEmptyPanelClicks(0);
      setElapsedTime(0);
      setStartTime(Date.now());
      if (options?.division !== undefined) {
        setDivision(options.division);
      }
      initialize(startDivision, options?.seed);
      setGamePhase('playing');
    },
    [initialize, division, setDivision, setGamePhase, setScore, setIsBestScore, setEmptyPanelClicks, setElapsedTime, setStartTime]
  );
```

> 注: `setDivision` は既存の `handleDifficultyChange` で使われている setter。`useGameFlow` 内で既に `const [division, setDivision] = useAtom(puzzleDivisionAtom);` が定義済み（43行）なので追加 import 不要。

- [ ] **Step 3: 既存の handleStartGame 呼び出しが壊れないことを確認する**

`SetupSection`/`PuzzleSections` から `handleStartGame` は引数なしで呼ばれる。options は optional なので互換。

Run: `npm run typecheck && npm test -- useGameFlow usePuzzleGame PuzzlePage`
Expected: PASS（既存テストが緑。引数なし呼び出しは従来動作）

- [ ] **Step 4: コミット**

```bash
git add src/presentation/hooks/usePuzzleGame.ts src/presentation/hooks/useGameFlow.ts
git commit -m "feat: プレイフローに seed/division 明示注入の経路を追加（通常プレイは不変）"
```

---

### Task 7: モード state・タイトル導線・本日の一枚 起動フロー

**Files:**
- Modify: `src/components/TitleScreen.tsx`
- Modify: `src/components/TitleScreen.test.tsx`
- Modify: `src/pages/PuzzlePage.tsx`

**Interfaces:**
- Consumes: `selectDailyPuzzle`（Task 4）, `dateStringToSeed`（Task 1）, `handleStartGame` options（Task 6）, `getImageSize`（`src/utils/puzzle-utils`）
- Produces: `TitleScreenProps` に `onStartDaily: () => void`, `onStartChallenge: () => void` を追加

- [ ] **Step 1: TitleScreen のテストを追記する**

```tsx
// src/components/TitleScreen.test.tsx に追記（既存 render に onStartDaily/onStartChallenge を補完）
it('「本日の一枚」で onStartDaily を呼ぶ', () => {
  const onStartDaily = jest.fn();
  render(
    <TitleScreen
      onStart={() => {}}
      onDebugActivate={() => {}}
      onOpenCollection={() => {}}
      onStartDaily={onStartDaily}
      onStartChallenge={() => {}}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: '本日の一枚' }));
  expect(onStartDaily).toHaveBeenCalledTimes(1);
});

it('「鑑定チャレンジ」で onStartChallenge を呼ぶ', () => {
  const onStartChallenge = jest.fn();
  render(
    <TitleScreen
      onStart={() => {}}
      onDebugActivate={() => {}}
      onOpenCollection={() => {}}
      onStartDaily={() => {}}
      onStartChallenge={onStartChallenge}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: '鑑定チャレンジ' }));
  expect(onStartChallenge).toHaveBeenCalledTimes(1);
});
```

> 注: 既存 `TitleScreen.test.tsx` の**すべての** `render(<TitleScreen .../>)` に `onStartDaily={() => {}}` と `onStartChallenge={() => {}}` を補完する（必須 prop 追加による型エラー防止）。

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- TitleScreen`
Expected: FAIL（「本日の一枚」「鑑定チャレンジ」ボタンが無い）

- [ ] **Step 3: TitleScreen にモード導線を追加する**

`TitleScreen.tsx` の `TitleScreenProps` に2つのコールバックを追加し、「入館する」の下（「収蔵目録を見る」の近く）に2ボタンを追加する。既存の `SecondaryButton` スタイルを流用する:

```tsx
type TitleScreenProps = {
  onStart: () => void;
  onDebugActivate: () => void;
  onOpenCollection: () => void;
  onStartDaily: () => void;
  onStartChallenge: () => void;
};
```

本体の `return` の `<EnterButton>` と `<SecondaryButton>収蔵目録を見る</SecondaryButton>` の間に追加:

```tsx
      <SecondaryButton onClick={onStartDaily}>本日の一枚</SecondaryButton>
      <SecondaryButton onClick={onStartChallenge}>鑑定チャレンジ</SecondaryButton>
```

（`SecondaryButton` は P3 で focus-visible/44px 済みのため踏襲される。関数の引数分割にも `onStartDaily, onStartChallenge` を追加すること。）

- [ ] **Step 4: PuzzlePage にモード state と本日の一枚フローを追加する**

`src/pages/PuzzlePage.tsx` を変更する。

import 追加:

```tsx
import { selectDailyPuzzle } from '../application/use-cases/select-daily-puzzle';
import { dateStringToSeed } from '../domain/puzzle/value-objects/seed';
import { getImageSize } from '../utils/puzzle-utils';
```

`showCollection` state の近くに mode state と今日のシード生成ヘルパを追加:

```tsx
  // 現在のモード（通常 / 本日の一枚 / 鑑定チャレンジ）
  const [mode, setMode] = useState<'normal' | 'daily' | 'challenge'>('normal');
```

コンポーネント内に本日の一枚の起動ハンドラを追加（`new Date()` は presentation 限定でここに閉じる）:

```tsx
  // 今日の日付を YYYYMMDD 文字列へ（presentation 層で副作用を閉じる）
  const todaySeedString = (): string => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  };

  const handleStartDaily = async () => {
    const seed = dateStringToSeed(todaySeedString());
    const daily = selectDailyPuzzle(themes, seed);
    const url = `${window.location.origin}/images/default/${daily.filename}`;
    try {
      const { width, height } = await getImageSize(url);
      handleImageSelect(url, width, height);
      setMode('daily');
      setShowTitle(false);
      handleStartGame({ division: daily.division, seed });
    } catch (err) {
      console.error('本日の一枚の読み込みに失敗しました:', err);
    }
  };

  const handleStartChallenge = () => {
    setMode('challenge');
    setShowTitle(false);
  };
```

`TitleScreen` の呼び出しに props を追加:

```tsx
        <TitleScreen
          onStart={() => { setMode('normal'); setShowTitle(false); }}
          onDebugActivate={() => setDebugMode(true)}
          onOpenCollection={() => setShowCollection(true)}
          onStartDaily={handleStartDaily}
          onStartChallenge={handleStartChallenge}
        />
```

`handleEndGame` で通常モードに戻るよう、GameSection の「設定に戻る」後にモードをリセットしたい。`handleEndGame` は useGameFlow 側だが、mode は PuzzlePage state。SetupSection へ戻った際に mode を保持するため、ここでは mode リセットは行わず、タイトルの `onStart`（入館する）で `setMode('normal')` するのみとする（チャレンジは設定画面に留まる想定）。

- [ ] **Step 5: テストが通ることを確認する**

Run: `npm test -- TitleScreen PuzzlePage`
Expected: PASS（TitleScreen 既存＋新規2件、PuzzlePage 既存が緑）
Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/components/TitleScreen.tsx src/components/TitleScreen.test.tsx src/pages/PuzzlePage.tsx
git commit -m "feat: タイトルに本日の一枚・鑑定チャレンジ導線とモードstateを追加"
```

---

### Task 8: 鑑定チャレンジのメダル表示（リザルトへ結線）

**Files:**
- Modify: `src/pages/PuzzlePage.tsx`（medal 算出と GameSection への受け渡し）
- Modify: `src/components/GameSection.tsx`（prop 追加・PuzzleBoard へ委譲）
- Modify: `src/components/organisms/PuzzleBoard.tsx`（prop 追加・ResultScreen へ委譲）
- Modify: `src/components/molecules/ResultScreen.tsx`（medal 表示）
- Modify: `src/components/molecules/ResultScreen.styles.ts`（メダル用スタイル）
- Test: `src/components/molecules/ResultScreen.test.tsx`（追記）

**Interfaces:**
- Consumes: `evaluateChallenge`, `ChallengeMedal`（Task 5）
- Produces: `ResultScreenProps` に `challengeMedal?: ChallengeMedal` を追加

- [ ] **Step 1: ResultScreen のテストを追記する**

```tsx
// src/components/molecules/ResultScreen.test.tsx に追記
// 既存の import と score モックを利用する（無ければ最小の PuzzleScore を用意）
it('challengeMedal 指定時はメダルを表示する', () => {
  render(
    <ResultScreen
      imageAlt="A"
      division={4}
      score={{ totalScore: 5000, moveCount: 40, elapsedTime: 90, hintUsed: false, division: 4, rank: '★★☆', shuffleMoves: 32 }}
      isBestScore={false}
      onRetry={() => {}}
      onBackToSetup={() => {}}
      challengeMedal="gold"
    />
  );
  expect(screen.getByText(/鑑定メダル/)).toBeInTheDocument();
  expect(screen.getByText('金')).toBeInTheDocument();
});

it('challengeMedal 未指定時はメダルを表示しない', () => {
  render(
    <ResultScreen
      imageAlt="A"
      division={4}
      score={{ totalScore: 5000, moveCount: 40, elapsedTime: 90, hintUsed: false, division: 4, rank: '★★☆', shuffleMoves: 32 }}
      isBestScore={false}
      onRetry={() => {}}
      onBackToSetup={() => {}}
    />
  );
  expect(screen.queryByText(/鑑定メダル/)).not.toBeInTheDocument();
});
```

> 注: 既存 `ResultScreen.test.tsx` の score モック形状を Read し合わせること（`PuzzleScore` 型: totalScore/moveCount/elapsedTime/hintUsed/division/rank/shuffleMoves）。

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- ResultScreen`
Expected: FAIL（`challengeMedal` prop 未対応・メダル表示なし）

- [ ] **Step 3: ResultScreen にメダル表示を追加する**

`ResultScreen.styles.ts` にメダル用スタイルを追加:

```typescript
export const MedalLabel = styled.p`
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.75;
  margin: 12px 0 2px;
`;

export const Medal = styled.p<{ $medal: 'gold' | 'silver' | 'bronze' }>`
  margin: 0;
  font-size: 1.3rem;
  font-weight: bold;
  color: ${({ $medal }) =>
    $medal === 'gold' ? '#ffd54a' : $medal === 'silver' ? '#d0d0d8' : '#cd9b6a'};
`;
```

`ResultScreen.tsx` を変更（`ChallengeMedal` を import、prop 追加、メダル表示）:

```tsx
import { ChallengeMedal } from '../../domain/puzzle/services/challenge-evaluator';
import { MedalLabel, Medal } from './ResultScreen.styles';

export interface ResultScreenProps {
  imageAlt: string;
  division: number;
  score: PuzzleScore;
  isBestScore: boolean;
  onRetry: () => void;
  onBackToSetup: () => void;
  challengeMedal?: ChallengeMedal;
}

const MEDAL_TEXT: Record<ChallengeMedal, string> = { gold: '金', silver: '銀', bronze: '銅' };
```

分割代入に `challengeMedal` を追加し、`<RankLabel>鑑定評価</RankLabel>` のブロックの後に追加:

```tsx
      {challengeMedal && (
        <>
          <MedalLabel>鑑定メダル</MedalLabel>
          <Medal $medal={challengeMedal}>{MEDAL_TEXT[challengeMedal]}</Medal>
        </>
      )}
```

- [ ] **Step 4: PuzzleBoard と GameSection に prop を通す**

`PuzzleBoard.tsx`: props 型に `challengeMedal?: ChallengeMedal;` を追加（`import { ChallengeMedal } from '../../domain/puzzle/services/challenge-evaluator';`）、分割代入に追加、`<ResultScreen ... />`（204-215行付近）に `challengeMedal={challengeMedal}` を渡す。

`GameSection.tsx`: `GameSectionProps` に `challengeMedal?: ChallengeMedal;` を追加（import 同上）、分割代入に追加、`<PuzzleBoard ... />` に `challengeMedal={challengeMedal}` を渡す。

- [ ] **Step 5: PuzzlePage で medal を算出し GameSection へ渡す**

`PuzzlePage.tsx` に import 追加:

```tsx
import { evaluateChallenge } from '../domain/puzzle/services/challenge-evaluator';
```

`return` の前で medal を算出:

```tsx
  // 鑑定チャレンジモードかつスコア確定時のみメダルを算出（永続化せず都度評価）
  const challengeMedal =
    mode === 'challenge' && score
      ? evaluateChallenge({
          elapsedSeconds: score.elapsedTime,
          actualMoves: score.moveCount,
          optimalMoves: score.division * score.division * 2,
        })
      : undefined;
```

`GameSectionComponent` の呼び出しに `challengeMedal={challengeMedal}` を追加する。

- [ ] **Step 6: テストが通ることを確認する**

Run: `npm test -- ResultScreen PuzzleBoard GameSection PuzzlePage`
Expected: PASS（ResultScreen 新規2件含む・既存緑）
Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/pages/PuzzlePage.tsx src/components/GameSection.tsx src/components/organisms/PuzzleBoard.tsx src/components/molecules/ResultScreen.tsx src/components/molecules/ResultScreen.styles.ts src/components/molecules/ResultScreen.test.tsx
git commit -m "feat: 鑑定チャレンジの獲得メダルをリザルトに表示"
```

---

### Task 9: 全体検証・手動確認・回帰・PR

**Files:** なし（検証のみ）

- [ ] **Step 1: CI パイプラインを実行する**

Run: `npm run ci`
Expected: lint:ci（警告0）→ typecheck → test → build 全 PASS

- [ ] **Step 2: 開発サーバーで手動確認する**

Run: `npm start`
確認項目:
- タイトルに「本日の一枚」「鑑定チャレンジ」導線が出る（focus-visible/44px 踏襲）
- 「本日の一枚」→ 固定の作品・難易度で即開始。リロードしても同日は同一配置
- 「鑑定チャレンジ」→ 設定画面 → 任意作品でプレイ → クリアでリザルトに鑑定メダル（金/銀/銅）が出る
- 通常プレイ（入館する）は従来どおり（シードなしでランダム配置）
- gallery トーンが新モード UI にも適用されている

- [ ] **Step 3: 他ゲーム非波及の回帰チェック（親設計書 §4 手順）**

`npm start` で picture-puzzle 以外のゲーム1本以上を開き、背景・配色・挙動が従来どおりであることを確認する。

- [ ] **Step 4: プッシュして PR を作成する**

```bash
git push -u origin feature/picture-puzzle-gallery-phase4
gh pr create --base main --title "feat: Picture Puzzle フェーズ4 面白さ（新モード）" --body "$(cat <<'EOF'
## 概要
「本日の一枚（日付シード固定）」と「鑑定チャレンジ（タイム+手数でメダル）」の2モードを追加。既存の通常プレイに影響なし。新規 localStorage キーは追加しない。ギャラリー化ブラッシュアップの最終フェーズ。

設計書: `docs/superpowers/specs/2026-07-09-picture-puzzle-gallery-phase4-design.md`
実装計画: `docs/superpowers/plans/2026-07-09-picture-puzzle-gallery-phase4.md`

## 変更内容
- ドメイン: シードRNG(mulberry32)・日付シード変換・鑑定メダル判定の純粋関数
- shufflePuzzle に rng 注入（default Math.random）、initializePuzzle をシード対応（再シャッフル決定化）
- ユースケース: 本日の一枚の決定的選択（全15点）
- UI: タイトルにモード導線、PuzzlePage に mode state、リザルトに鑑定メダル表示
- new Date() は presentation 限定・ドメインは純粋

## テスト方法
- [x] npm run ci
- [ ] 本日の一枚が同日同一配置で再現
- [ ] 鑑定メダルが金/銀/銅で正しく付与
- [ ] 通常プレイが従来どおり
- [ ] 他12ゲームへ非波及

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: CI を確認する**

Run: `gh pr checks <PR番号>`
Expected: 全チェック（Lint/Test/TypeCheck/Build/E2E）が PASS

---

## Self-Review

**Spec coverage（設計書 §9 受け入れ基準）:**
- デイリー同日同一シードで再現 → Task 1(seed) + Task 3(決定化) + Task 4(選択) + Task 7(起動) ✅
- チャレンジのメダル判定（タイム+手数）→ Task 5 + Task 8(表示) ✅
- 通常プレイに影響なし → Task 2/3/6 で seed optional・default Math.random、Task 9 手動確認 ✅
- 新規 localStorage キーなし → 全タスクで新規ストア無し ✅
- シード/日付/判定/選択がドメイン/ユースケースの純粋関数、new Date() は presentation 限定 → Task 1/3/4/5 は純粋、Task 7 で new Date() を PuzzlePage に閉じる ✅
- 他12ゲーム非波及 → 全変更 picture-puzzle 局所 + Task 9 回帰 ✅

**Placeholder scan:** プレースホルダなし。全コードブロックは実行可能。既存テスト形式合わせ（initialize-puzzle の第2引数 options 化・ResultScreen score モック・TitleScreen 全 render の prop 補完）は該当タスクに注記済み。

**Type consistency:** `createSeededRng`/`dateStringToSeed`(Task1)、`shufflePuzzle(board,moves,rng)`(Task2)、`initializePuzzle(division,{seed})`(Task3)、`selectDailyPuzzle→{imageId,filename,division}`(Task4)、`evaluateChallenge→ChallengeMedal`(Task5)、`handleStartGame({division,seed})`(Task6)、`ResultScreenProps.challengeMedal`(Task8) のシグネチャは全タスクで一貫。`optimalMoves = division²×2` は useGameFlow の既存定義（78行）と一致。

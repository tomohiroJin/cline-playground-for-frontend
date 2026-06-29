# Task 3 Fix Report: 迷宮の残響キャリアシミュレータ断片二重収集バグ修正

## 概要

`career-simulator.ts` の断片収集ロジックにおいて、同一 run 内で同一断片 ID が複数回
`res.fragmentsRead` に含まれる場合、重複が除去されずに `meta.fragments` に積まれ、
`fragmentCount` が最大値 19 を超過するバグを修正した。

## バグの根本原因

### 問題のコード（修正前）

```ts
const readFrags = res.fragmentsRead.filter(id => !meta.fragments.includes(id));
fragsReadThisRun = readFrags.length;
let fragments = readFrags.length ? [...meta.fragments, ...readFrags] : meta.fragments;
```

### なぜ重複が発生するか

- `ECHO_EVENTS` の各断片イベントは複数フロアに登録される（例: `f_lian_2 = floors [1, 2]`）
- `metaCond` は `meta.fragments`（run 前の状態）を参照し、run 内では更新されない
- そのため、同一 run でフロア 1 と 2 の両方で断片を「読み解く」ことができ、
  `fragmentsRead` に同一 ID が2回入る
- `filter` は前の run の `meta.fragments` に対してのみチェックするため、
  同一 run 内の重複は除去されない

### 影響

`meta.fragments` に重複が蓄積し、セーフティネットが新規断片を追加するタイミングで
`meta.fragments.length > 19` が発生する。

**再現シード**: easy×LORE_POLICY × seed=80（run 15 で `fragmentCount=20`）、seed=87

## 修正内容

### ファイル

`src/features/labyrinth-echo/simulation/career-simulator.ts`

### 変更後のコード

```ts
// Set ベースで断片を管理し、run 内重複を自動除去する
const fragmentSet = new Set<string>(meta.fragments);
const prevSize = fragmentSet.size;
for (const id of res.fragmentsRead) {
  fragmentSet.add(id);
}
fragsReadThisRun = fragmentSet.size - prevSize;
// セーフティネット（脱出ごとに1片保証）
const safety = selectSafetyNetFragment(newDepth, [...fragmentSet]);
if (safety && !fragmentSet.has(safety.id)) {
  fragmentSet.add(safety.id);
  safetyNetGranted = true;
}
const fragments = [...fragmentSet];
```

### 修正の効果

- `Set` に `meta.fragments` を初期値として構築
- `res.fragmentsRead` の各 ID を `Set.add()` で追加（重複は自動除去）
- `fragsReadThisRun` = サイズ差分（真の新規追加数）
- `fragments` は常に重複なし → `fragmentCount <= 19` を保証

## テスト結果

### RED（修正前）

```
FAIL career-simulator.test.ts
  ✕ easy/normal×lorehunter: seeds 1..200 で断片数が常に19以下（run内重複収集バグ回帰）

    Expected: <= 19
    Received:  20

    at step.fragmentCount.toBeLessThanOrEqual (career-simulator.test.ts:71)
```

### GREEN（修正後）

```
PASS career-simulator.test.ts
  ✓ easy×careful は19脱出で真ルート解禁（セーフティネット1/脱出）
  ✓ timeline は runs と同数で depth/断片は非減少
  ✓ escapes + deaths == runs
  ✓ legacyUnlocks は5件記録され runIndex 昇順（先人完収集の順）
  ✓ maxRuns 到達で未解禁なら unlocked=false（censored）
  ✓ easy/normal×lorehunter: seeds 1..200 で断片数が常に19以下（run内重複収集バグ回帰）

Tests: 6 passed, 6 total
```

### 不変条件テスト

```
PASS invariants.test.ts
Tests: 15 passed, 15 total
```

### Lint

```
npx eslint src/... --max-warnings 0
EXIT: 0
```

## 回帰テスト追加

`career-simulator.test.ts` に以下テストを追加:

- **テスト名**: `easy/normal×lorehunter: seeds 1..200 で断片数が常に19以下（run内重複収集バグ回帰）`
- **範囲**: easy + normal × seeds 1..200 × maxRuns 120
- **アサーション**:
  - 全 `timeline` ステップで `fragmentCount <= 19`
  - `finalFragments <= 19`
- **再現確認**: seed=80, seed=87 で修正前に `fragmentCount=20` を検出

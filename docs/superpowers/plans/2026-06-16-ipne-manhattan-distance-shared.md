# IPNE マンハッタン距離計算の共通化 実装計画（Phase E）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** マンハッタン距離の5重複を `domain/services/geometryService.ts` の `manhattanDistance` へ集約する（振る舞い不変）。

**Architecture:** `manhattanDistance(a: Position, b: Position): number` を新設し TDD でテスト。5箇所（item/aiGeometry/collisionService/scoring/bossEffects）をそこへ置換。`aiGeometry` は `getManhattanDistance` を re-export して4消費者を無修正に保つ。各箇所の既存テスト＋typecheck が安全網（同一公式＝振る舞い不変）。

**Tech Stack:** TypeScript, Jest (SWC), Clean Architecture + DDD（domain 層）。

**設計の出典:** `docs/superpowers/specs/2026-06-16-ipne-manhattan-distance-shared-design.md`

---

## 対象ファイル

| ファイル | 扱い | geometryService への相対パス |
|---------|------|------------------------------|
| `domain/services/geometryService.ts` | **新規** | — |
| `domain/services/geometryService.test.ts` | **新規** | — |
| `domain/entities/item.ts` | **変更**（getDistance 削除→import） | `../services/geometryService` |
| `domain/policies/enemyAi/aiGeometry.ts` | **変更**（定義削除→import as getManhattanDistance＋re-export） | `../../services/geometryService` |
| `domain/services/collisionService.ts` | **変更**（インライン置換） | `./geometryService` |
| `domain/services/gimmickPlacement/scoring.ts` | **変更**（インライン置換） | `../geometryService` |
| `presentation/effects/bossEffects.ts` | **変更**（インライン置換） | `../../domain/services/geometryService` |

### 不変条件（厳守）

- マンハッタン距離の公式（`Math.abs(a.x-b.x) + Math.abs(a.y-b.y)`）を変えない。
- `aiGeometry` が `getManhattanDistance` を export し続け、4消費者（attackState/enemyMovement/chargeBehavior/rangedBehavior）が無修正で動く。
- `tickGameState`・`combatEffects` は無変更。

---

## Task 0: ベースライン確認

**Files:** なし

- [ ] **Step 1: ブランチ確認**

Run: `git branch --show-current`
Expected: `refactor/ipne-manhattan-distance-shared`

- [ ] **Step 2: 関連テスト緑＋typecheck**

Run: `npx jest collision item scoring enemyAI bossEffects aiGeometry 2>&1 | tail -8`（PASS）
Run: `npm run typecheck 2>&1 | tail -3`（エラーなし）

---

## Task 1: `geometryService.ts` を新設（TDD）

**Files:**
- Create: `src/features/ipne/domain/services/geometryService.ts`
- Create: `src/features/ipne/domain/services/geometryService.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

Create `geometryService.test.ts`:

```typescript
import { manhattanDistance } from './geometryService';

describe('manhattanDistance', () => {
  it('同一座標は 0 を返す', () => {
    expect(manhattanDistance({ x: 3, y: 5 }, { x: 3, y: 5 })).toBe(0);
  });

  it('各軸の差の絶対値の和を返す', () => {
    expect(manhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
  });

  it('負方向（引数の順序）でも同じ値を返す（対称性）', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 5, y: 9 };
    expect(manhattanDistance(a, b)).toBe(manhattanDistance(b, a));
    expect(manhattanDistance(a, b)).toBe(4 + 7);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest geometryService 2>&1 | tail -10`
Expected: FAIL（`Cannot find module './geometryService'`）

- [ ] **Step 3: `geometryService.ts` を実装**

Create `geometryService.ts`:

```typescript
/**
 * 幾何ユーティリティ（純粋関数）
 */
import { Position } from '../types';

/** 2点間のマンハッタン距離（各軸の差の絶対値の和） */
export const manhattanDistance = (a: Position, b: Position): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest geometryService 2>&1 | tail -8`
Expected: PASS（3件）

- [ ] **Step 5: 型チェック＆コミット**

Run: `npm run typecheck 2>&1 | tail -3`（エラーなし）

```bash
git add src/features/ipne/domain/services/geometryService.ts \
        src/features/ipne/domain/services/geometryService.test.ts
git commit -m "feat: IPNE 幾何ユーティリティ geometryService.manhattanDistance を新設

- マンハッタン距離の単一定義。後続タスクで5重複箇所を集約する

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 5箇所を `manhattanDistance` 利用へ置換

**Files:**
- Modify: `domain/entities/item.ts`, `domain/policies/enemyAi/aiGeometry.ts`,
  `domain/services/collisionService.ts`, `domain/services/gimmickPlacement/scoring.ts`,
  `presentation/effects/bossEffects.ts`

- [ ] **Step 1: `item.ts` を変更**

ローカル `getDistance`（92-94行）を削除し、import を追加、呼び出し（121行 `getDistance(tile, goalPos)`）を `manhattanDistance(tile, goalPos)` に置換。

1. import 追加（既存 import 群の近く）:
```typescript
import { manhattanDistance } from '../services/geometryService';
```
2. `const getDistance = (a: Position, b: Position): number => { return Math.abs(...); };` を削除。
3. `getDistance(tile, goalPos)` → `manhattanDistance(tile, goalPos)`。
4. `Position` が他で使われていなければ未使用 import になるので lint で確認（getDistance 削除で Position の利用が減る可能性。typecheck/lint に従う）。

- [ ] **Step 2: `aiGeometry.ts` を変更**

ローカル定義（18-19行 `export const getManhattanDistance = (a, b) => Math.abs(...)`）を削除し、
新 util を `getManhattanDistance` という名前で import＋re-export する（内部利用 35/41/46 行等は無修正で動く）。

1. ファイル冒頭の import 群に追加:
```typescript
import { manhattanDistance as getManhattanDistance } from '../../services/geometryService';
```
2. `export const getManhattanDistance = (a: Position, b: Position): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);` の定義（18-19行）を削除。
3. 消費者（attackState/enemyMovement/chargeBehavior/rangedBehavior）のために再公開:
```typescript
export { getManhattanDistance };
```
（import した `getManhattanDistance` を再 export。aiGeometry 内部の `getManhattanDistance(...)` 呼び出しは
import 名と一致するため無修正で動く。）
4. `Position` の import が `getManhattanDistance` 定義削除で未使用になるか確認。他の関数（detectPlayer 等は
Position を引数に取る）で使われているので残るはず。lint に従う。

- [ ] **Step 3: `collisionService.ts` を変更**

`Position` は既に import 済み。`manhattanDistance` を import し、67行のインラインを置換。
1. import 追加:
```typescript
import { manhattanDistance } from './geometryService';
```
2. `enemy => Math.abs(enemy.x - position.x) + Math.abs(enemy.y - position.y) <= range` を
`enemy => manhattanDistance(enemy, position) <= range` に置換（`Enemy` は x/y を持ち `Position` 互換）。

- [ ] **Step 4: `scoring.ts` を変更**

ループ内インライン（10行）を置換。
1. import 追加:
```typescript
import { manhattanDistance } from '../geometryService';
```
2. `const dist = Math.abs(p.x - pos.x) + Math.abs(p.y - pos.y);` を
`const dist = manhattanDistance(p, pos);` に置換。

- [ ] **Step 5: `bossEffects.ts` を変更**

インライン（58行）を置換（presentation→domain の import）。
1. import 追加:
```typescript
import { manhattanDistance } from '../../domain/services/geometryService';
```
2. `const distance = Math.abs(enemy.x - playerX) + Math.abs(enemy.y - playerY);` を
`const distance = manhattanDistance(enemy, { x: playerX, y: playerY });` に置換
（`enemy` は x/y を持ち `Position` 互換）。

- [ ] **Step 6: 関連テスト＋型/lint を確認**

Run: `npx jest collision item scoring enemyAI enemyAttackAnim bossEffects aiGeometry gimmickPlacement 2>&1 | tail -10`
Expected: PASS（特に enemyAI/enemyAttackAnim は aiGeometry の re-export 経由で getManhattanDistance を使う）
Run: `npm run typecheck 2>&1 | tail -3`（エラーなし）
Run: `npx eslint src/features/ipne/ 2>&1 | tail -15`（エラーなし、未使用 import 削除）

- [ ] **Step 7: コミット**

```bash
git add src/features/ipne/domain/entities/item.ts \
        src/features/ipne/domain/policies/enemyAi/aiGeometry.ts \
        src/features/ipne/domain/services/collisionService.ts \
        src/features/ipne/domain/services/gimmickPlacement/scoring.ts \
        src/features/ipne/presentation/effects/bossEffects.ts
git commit -m "refactor: IPNE マンハッタン距離の5重複を geometryService へ集約

- item/collisionService/scoring/bossEffects のインライン・ローカル定義を manhattanDistance に置換
- aiGeometry は getManhattanDistance を re-export し4消費者を無修正維持
- 公式不変につき各箇所の既存テストで振る舞い不変を確認

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 最終検証

**Files:** なし

- [ ] **Step 1: マンハッタン計算の重複が解消されたことを確認**

Run: `grep -rn "Math.abs" src/features/ipne --include=*.ts 2>/dev/null | grep -v test | grep -E "Math\.abs.*\+.*Math\.abs"`
Expected: `geometryService.ts` の1件のみ（他の4インライン＋2ローカル定義が消えている）。
※ 方向計算（aiGeometry の calculateStep 等で `Math.abs(dx) >= Math.abs(dy)` のような**距離でない** abs 比較）が
残るのは正常。マンハッタン距離（`abs + abs` の和）が geometryService 以外に残っていないことを確認する。

- [ ] **Step 2: IPNE 全テスト**

Run: `npx jest ipne 2>&1 | tail -6`
Expected: PASS（IPNE 全スイート green）

- [ ] **Step 3: 型チェック**

Run: `npm run typecheck 2>&1 | tail -3`
Expected: エラーなし

- [ ] **Step 4: lint:ci（警告ゼロ強制）**

Run: `npm run lint:ci 2>&1 | tail -8`
Expected: エラー・警告なし（exit 0）

---

## 完了の定義（Definition of Done）

- [ ] `geometryService.ts` に `manhattanDistance` があり専用テストがある
- [ ] 5箇所が `manhattanDistance` を利用、インライン・重複ローカル定義が解消
- [ ] `aiGeometry` が `getManhattanDistance` を re-export し、4消費者が無修正
- [ ] マンハッタン距離（`abs + abs`）の計算が geometryService 以外に残っていない
- [ ] `tickGameState`・`combatEffects` は無変更
- [ ] `npx jest ipne` / `npm run typecheck` / `npm run lint:ci` 全パス

# IPNE マンハッタン距離計算の共通化 設計（Phase E）

- 日付: 2026-06-16
- 対象: `src/features/ipne/`（domain/services・domain/entities・domain/policies・presentation/effects）
- 種別: リファクタリング（**振る舞い不変**・DRY 解消）
- 位置づけ: IPNE 包括リファクタリング・ロードマップの **Phase E**（仕上げ）

## 1. 背景と目的

マンハッタン距離 `Math.abs(a.x - b.x) + Math.abs(a.y - b.y)` の計算が、IPNE 内の **5箇所**に
重複している（ローカル関数2つ＋インライン3つ）。

| # | 箇所 | 形 |
|---|------|----|
| 1 | `domain/entities/item.ts:92` | ローカル `getDistance(a, b)` |
| 2 | `domain/policies/enemyAi/aiGeometry.ts:18` | `getManhattanDistance(a, b)`（export、4ファイルが使用） |
| 3 | `domain/services/collisionService.ts:67` | インライン（`enemy`/`position`） |
| 4 | `domain/services/gimmickPlacement/scoring.ts:10` | インライン（`p`/`pos`、ループ内） |
| 5 | `presentation/effects/bossEffects.ts:58` | インライン（`enemy`/`playerX`/`playerY`） |

Phase A の spec §6 でも「`getManhattanDistance` の重複（`gimmickPlacement/scoring.ts` 等）」を
Phase E の共通化候補として記録済み。

本作業の目的:

1. 単一の `manhattanDistance(a: Position, b: Position): number` を **`domain/services/geometryService.ts`**
   に新設し、5箇所をそこへ集約する。
2. 公式・振る舞いを一切変えない（同一の `Math.abs` 計算）。

### 非目標（YAGNI）

- **`tickGameState` の整理はしない。** 217行の10ステップは `resolveXxx` ユースケースを順に呼ぶ
  綺麗な Facade で、オーケストレーション自体が責務。分割の価値が薄い。
- **`combatEffects.ts` のインライン型 import 整理はしない**（些末・スコープ外）。
- 距離計算の公式変更・最適化。

## 2. 現状調査の要点

- 5箇所すべて `{ x, y }` 対で計算。`bossEffects.ts` のみスカラー（`playerX`/`playerY`）だが
  `{ x: playerX, y: playerY }` で包めば同一シグネチャで扱える。
- `Position` 型は `domain/types/world.ts` 定義（`{ x: number; y: number }`）。`Enemy` は x/y を持つため
  構造的に `Position` 互換（`manhattanDistance(enemy, ...)` がそのまま通る）。
- 配置先の依存規則: 消費側は domain 4ファイル＋presentation 1ファイル。**domain → 外部依存なし /
  presentation → domain は参照可** のため、共有 util は **domain 内**（`domain/services/`）に置く。
  presentation/bossEffects から `domain/services/geometryService` を import するのは presentation→domain で合法。
- `aiGeometry.getManhattanDistance` は **4ファイルが import**（`attackState.ts`/`enemyMovement.ts`/
  `behaviors/chargeBehavior.ts`/`behaviors/rangedBehavior.ts`）。これらを無修正に保つため
  aiGeometry は新 util を **re-export** する。
- 既存テスト: collision/item/scoring/enemyAI/boss 系が各箇所をカバー。

## 3. 変更後の構造

### 新モジュール `domain/services/geometryService.ts`

```typescript
/**
 * 幾何ユーティリティ（純粋関数）
 */
import { Position } from '../types';

/** 2点間のマンハッタン距離 */
export const manhattanDistance = (a: Position, b: Position): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
```

### 5箇所の集約

| 箇所 | 変更 |
|------|------|
| `item.ts` | ローカル `getDistance` を削除し、`manhattanDistance` を import。呼び出しを `manhattanDistance(...)` に置換 |
| `collisionService.ts` | インラインを `manhattanDistance(enemy, position) <= range` に置換、import 追加 |
| `scoring.ts` | ループ内インラインを `manhattanDistance(p, pos)` に置換、import 追加 |
| `bossEffects.ts` | インラインを `manhattanDistance(enemy, { x: playerX, y: playerY })` に置換、import 追加（presentation→domain） |
| `aiGeometry.ts` | ローカル `getManhattanDistance` 定義を削除し、`import { manhattanDistance } from '../../services/geometryService'`。内部利用は `manhattanDistance` に置換。**消費者保持のため `export { manhattanDistance as getManhattanDistance };` で再公開** |

> `aiGeometry` の `getManhattanDistance` re-export により、4つの消費者（attackState/enemyMovement/
> chargeBehavior/rangedBehavior）は**無修正**で動く。

### 依存方向（循環なし）

```
geometryService.ts → domain/types（Position 型のみ）
item / collisionService / scoring / aiGeometry → geometryService（domain 内）
bossEffects（presentation）→ geometryService（domain）  ※ presentation→domain は合法
```

## 4. 安全網（振る舞い不変の証明）

公式は同一（`Math.abs(a.x-b.x) + Math.abs(a.y-b.y)`）なので、各箇所の既存テストが緑のままであることが
振る舞い不変の証明になる。

- **新規 `geometryService.test.ts`**: `manhattanDistance` の振る舞い（0距離・正/負方向・対称性）を検証。
- 既存テストを全工程で緑に保つ: `collision.test`/`item.test`/`scoring`（gimmickPlacement）/`enemyAI.test`/
  `enemyAttackAnim.test`/`aiGeometry.test`/`bossEffects.test`。
- `npm run typecheck`（型整合、特に `Enemy` を `Position` として渡せること、re-export の解決）。

## 5. 検証手順（refactor-safely）

1. `geometryService.ts` を新設し、`geometryService.test.ts` を TDD で追加。
2. 5箇所を1つずつ `manhattanDistance` 利用へ置換（1コミット=1〜複数箇所）。各置換後に該当テスト＋typecheck。
3. 最終確認:

```bash
npx jest ipne
npm run typecheck
npm run lint:ci
```

### 完了の定義（Definition of Done）

- [ ] `domain/services/geometryService.ts` に `manhattanDistance` があり、専用テストがある
- [ ] 5箇所（item/collisionService/scoring/bossEffects/aiGeometry）が `manhattanDistance` を利用
- [ ] `aiGeometry` が `getManhattanDistance` を re-export し、4消費者が無修正で動く
- [ ] マンハッタン距離のインライン計算・重複ローカル定義が解消（geometryService 以外に残らない）
- [ ] `tickGameState`・`combatEffects` は無変更（YAGNI）
- [ ] `npx jest ipne` / `npm run typecheck` / `npm run lint:ci` 全パス

## 6. リスクと緩和

| リスク | 緩和策 |
|--------|--------|
| 置換時に引数の向き・スカラー包みを誤る | 公式は対称（`abs`）なので向きは無関係。bossEffects のスカラー包み `{x:playerX,y:playerY}` をテストで担保 |
| aiGeometry の re-export 漏れで4消費者が壊れる | typecheck と enemyAI/enemyAttackAnim テストで検出。re-export の名前一致を確認 |
| presentation→domain 参照が層規則違反では | 規則上 presentation→domain は合法（domain が外側を参照しないことが規則。逆は可） |
| 距離の意味取り違え（マンハッタンと別物） | 5箇所すべて `abs+abs`＝マンハッタンであることを移植前に確認。別公式（ユークリッド等）は対象外 |

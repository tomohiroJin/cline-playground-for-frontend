# IPNE 敵AIロジックの責務分割 設計（Phase A）

- 日付: 2026-06-14
- 対象: `src/features/ipne/domain/policies/enemyAi/`
- 種別: リファクタリング（**振る舞い不変** の構造分割）
- 位置づけ: IPNE 包括リファクタリング・ロードマップの **Phase A**（最初のサブプロジェクト）

## 1. 背景と目的

IPNE は既に Phase 1〜7 のリファクタリングを経た成熟コードだが、調査の結果、
ドメイン層の `enemyAiFunctions.ts`（600行）が **「Strategy パターンの皮を被った関数ダンプ」**
になっていることが判明した。隣接する `EnemyAiPolicyRegistry.ts` / `policies.ts` / `types.ts`
という Strategy 基盤は健全に整理されているのに、肝心の AI ロジック本体が
7 つの異なる責務を 1 ファイルに同居させている。

| 責務 | 該当関数 |
|------|---------|
| 乱数プロバイダ DI | `defaultRandom`, `setRandomProvider`, `resetRandomProvider`, `_random` |
| 幾何・検知判定 | `getManhattanDistance`, `calculateFleeDirection`, `getDirectPathToPlayer`, `detectPlayer`, `shouldChase`, `shouldStopChase` |
| 移動エンジン | `stepTowards`, `stepAway`, `stepRandom`, `attemptLunge`, `moveEnemyTowards/Away/Random`, `generatePatrolPath`, `getNextPatrolPoint` |
| 攻撃・ノックバック状態 | `canEnemyAttack`, `setEnemyAttackCooldown`, `markEnemyAttacking`, `resolveEnemyAttackState`, `resolveKnockbackState`, `ENEMY_ATTACK_ANIM_DURATION`, `AI_CONFIG` |
| 敵タイプ別 AI | `updatePatrolEnemy`, `updateChargeEnemy`, `updateRangedEnemy`, `updateFleeEnemy` |
| 一括更新オーケストレーション | `updateEnemyAI`, `updateEnemies`, `updateEnemiesWithContact` |

加えて、**方向計算 `dx, dy → stepX, stepY` のコピペが 5 箇所**（`stepTowards` /
`stepAway` / `attemptLunge` / `getDirectPathToPlayer` / `calculateFleeDirection`）に存在し、
DRY 違反となっている。

本作業の目的:

1. 600 行の単一ファイルを **責務単位のファイル群へ分割**し、可読性・拡張性を高める。
2. 方向計算の DRY 違反を **単一の `calculateStep()`** に集約する。
3. 公開 API・振る舞い・テストを **一切変えない**（純粋な構造リファクタリング）。

### 非目標（YAGNI）

- **`_random` のグローバル可変状態の DI 化は行わない。** これは明確な smell だが、
  「構造分割」と「DI 変更」を同一フェーズで混ぜると、テスト失敗時の原因切り分けが
  困難になる。本フェーズでは `aiRandom.ts` に隠蔽するに留め、グローバル可変状態の除去は
  **別フェーズの課題**として §6 に記録する。
- 敵 AI の挙動・バランス調整（移動確率、突進確率、検知範囲など）の変更。
- `enemyAi/` 以外の領域（`tickGameState.ts` の整理等）。これらは後続フェーズ（B〜E）で扱う。

## 2. 現状調査の要点

- **参照元は 4 つだけ**（公開 API として維持すべき対象）:
  - `src/features/ipne/index.ts`（barrel re-export）
  - `src/features/ipne/application/engine/tickGameState.ts`（`updateEnemiesWithContact` 等）
  - `src/features/ipne/__tests__/enemyAttackAnim.test.ts`
  - `src/features/ipne/__tests__/enemyAI.test.ts`
- **同ディレクトリのテスト**: `enemyAiFunctions.test.ts`（174行）がこのファイルを直接 import。
- Strategy 基盤（`EnemyAiPolicyRegistry` / `policies.ts` / `types.ts`）は健全。今回は触らない。
- `policies.ts` は `updatePatrol/Charge/Ranged/Flee` の 4 関数を注入して registry を構築する。
  分割後もこの 4 関数のシグネチャは不変なので、`policies.ts` は無修正で動く。

## 3. 後方互換の方針

Phase 1 で `types.ts` を 9 分割しつつ `types.ts` 自体を re-export barrel として残し、
後方互換を保った前例がある。同じ手法を採用する:

- **`enemyAiFunctions.ts` を re-export barrel として残す。**
  全エクスポート（型・関数・定数）を新ファイル群から re-export し、
  **エクスポート名・シグネチャを 1 文字も変えない**。
- これにより 4 つの参照元（index.ts / tickGameState.ts / 2 テスト）と
  `policies.ts` は **無修正**のまま動作する。

## 4. 分割後のファイル構成

`src/features/ipne/domain/policies/enemyAi/` 配下に以下を新設する:

```
enemyAi/
  enemyAiFunctions.ts        # ← barrel: 下記すべてを re-export（後方互換）
  aiRandom.ts                # 乱数プロバイダ DI
  aiGeometry.ts              # 幾何・検知判定（calculateStep を新規追加）
  enemyMovement.ts           # 移動エンジン
  attackState.ts             # 攻撃・ノックバック状態
  enemyOrchestrator.ts       # 一括更新オーケストレーション
  behaviors/
    patrolBehavior.ts        # updatePatrolEnemy
    chargeBehavior.ts        # updateChargeEnemy
    rangedBehavior.ts        # updateRangedEnemy
    fleeBehavior.ts          # updateFleeEnemy
  # 既存（無修正）: EnemyAiPolicyRegistry.ts, policies.ts, types.ts
```

### 各ファイルの責務と移動関数

| ファイル | 責務 | 移動/新設する要素 |
|---------|------|------------------|
| `aiRandom.ts` | 乱数プロバイダの保持と差し替え | `defaultRandom`, `setRandomProvider`, `resetRandomProvider`, 内部 `_random` と getter |
| `aiGeometry.ts` | 純粋な幾何計算・検知判定 | **`calculateStep`（新規）**, `getManhattanDistance`, `calculateFleeDirection`, `getDirectPathToPlayer`, `detectPlayer`, `shouldChase`, `shouldStopChase`, `AI_CONFIG`(検知/追跡定数) |
| `enemyMovement.ts` | マップ衝突を考慮した移動 | `stepTowards`, `stepAway`, `stepRandom`, `attemptLunge`, `moveEnemyTowards`, `moveEnemyAway`, `moveEnemyRandom`, `generatePatrolPath`, `getNextPatrolPoint` |
| `attackState.ts` | 攻撃可否・状態アニメーション | `canEnemyAttack`, `setEnemyAttackCooldown`, `markEnemyAttacking`, `resolveEnemyAttackState`, `resolveKnockbackState`, `ENEMY_ATTACK_ANIM_DURATION` |
| `behaviors/*.ts` | 敵タイプ別 AI（各1ファイル） | `updatePatrolEnemy` / `updateChargeEnemy` / `updateRangedEnemy` / `updateFleeEnemy` |
| `enemyOrchestrator.ts` | 全敵の一括更新・接触判定 | `updateEnemyAI`, `updateEnemies`, `updateEnemiesWithContact`, `EnemyUpdateResult`, 内部 `toPositionKey`, registry 構築 |
| `enemyAiFunctions.ts` | **barrel** | 上記すべてを `export ... from` で再公開 |

> 注: `AI_CONFIG` は検知/追跡系の定数（`updateInterval`, `chaseTimeout`, `attackCooldown`）。
> 検知判定（`shouldStopChase`）と攻撃（`setEnemyAttackCooldown`）の両方から参照されるため、
> `aiGeometry.ts` に定義し `attackState.ts` から import する。`enemyAiFunctions.ts` からの
> `export { AI_CONFIG }` は barrel 経由で維持する。

### モジュール依存方向（循環なし）

```
aiRandom ──┐
aiGeometry ─┼─→ enemyMovement ──→ behaviors/* ──→ enemyOrchestrator ──→ (barrel)
            └─→ attackState ─────────────────────→ enemyOrchestrator
```

- `aiGeometry` / `aiRandom` は最も内側（他に依存しない、`collisionService` を除く）。
- `behaviors/*` は `enemyMovement` / `aiGeometry` / `attackState` に依存。
- `enemyOrchestrator` が registry を組み立て、`behaviors/*` と `attackState` を統合。

## 5. DRY の核：`calculateStep` の抽出

5 箇所に散る方向計算を 1 関数へ集約する:

```typescript
// aiGeometry.ts
/** 2点間の各軸の単位ステップ（-1 / 0 / +1）を返す */
export const calculateStep = (
  from: Position,
  to: Position
): { stepX: number; stepY: number } => ({
  stepX: Math.sign(to.x - from.x),
  stepY: Math.sign(to.y - from.y),
});
```

- 既存の `dx === 0 ? 0 : dx > 0 ? 1 : -1` は **`Math.sign` と挙動が完全一致**
  （0→0, 正→+1, 負→-1。座標は整数なので小数・NaN は発生しない）。
- `stepTowards` / `stepAway` / `attemptLunge` / `getDirectPathToPlayer` /
  `calculateFleeDirection` は内部で `calculateStep` を呼ぶように書き換える。
- **引数の向きに注意**: `stepTowards` は `to - from`（敵→ターゲット）、
  `stepAway`/`calculateFleeDirection` は `from - to`（プレイヤー→敵 = 逃走方向）。
  後者は `calculateStep(player, enemy)` として呼び、意味を保つ。

## 6. 既知の負債（本フェーズでは触らず記録のみ）

| 項目 | 内容 | 想定フェーズ |
|------|------|-------------|
| `_random` グローバル可変状態 | `setRandomProvider`/`resetRandomProvider` でモジュール変数を差し替える方式。テスト間の状態リークや並行性の懸念。関数引数 or context 経由の DI へ移行が望ましい | 後続（要 spec） |
| `getManhattanDistance` の重複 | `gimmickPlacement/scoring.ts` にも同等ロジックあり。`shared/` への共通化候補 | Phase E（小物共通化） |

## 7. 検証手順（refactor-safely）

1 コミット = 1 ファイル分の責務移動を基本とし、各ステップで以下を実行する:

```bash
npm test -- enemyAi          # 当該ディレクトリのテスト（enemyAiFunctions.test / Registry.test）
npm test -- enemyAI enemyAttackAnim   # 参照元テスト
npm run typecheck            # 型整合（barrel 経由の re-export 含む）
```

全ファイル移動の完了後、最終確認として:

```bash
npm run lint:ci              # 警告ゼロ強制（未使用 import の検出含む）
npm test                     # IPNE 全テスト（回帰確認）
```

### 完了の定義（Definition of Done）

- [ ] `enemyAiFunctions.ts` が barrel（re-export のみ）になっている
- [ ] 上記 6 ファイル（barrel 含む）+ `behaviors/` 4 ファイルに責務が分割されている
- [ ] `calculateStep` が新設され、5 箇所のコピペが解消されている
- [ ] 公開 API（エクスポート名・シグネチャ）が変更前と完全一致
- [ ] 参照元 4 ファイル・`policies.ts` が無修正
- [ ] `npm test` / `npm run typecheck` / `npm run lint:ci` が全てパス
- [ ] 既知の負債（§6）が記録されている

## 8. リスクと緩和

| リスク | 緩和策 |
|--------|--------|
| barrel の re-export 漏れで公開 API が欠落 | typecheck と参照元テストで検出。エクスポート一覧を移動前後で diff 確認 |
| `calculateStep` 置換で方向計算の符号を誤る | 各呼び出しの引数の向き（§5）をテストで保証。既存テストが緑であることを必須条件にする |
| 循環 import の発生 | §4 の依存方向を厳守（geometry/random を最内、orchestrator を最外） |
| 移動の粒度が大きすぎて切り戻し困難 | 1 コミット = 1 ファイル移動に分割 |

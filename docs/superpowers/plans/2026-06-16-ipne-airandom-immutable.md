# IPNE aiRandom 可変モジュール状態の除去 実装計画（フォローアップ）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `aiRandom.ts` の可変モジュール状態（`let _random` ＋ 未使用 setter）を削除し、`defaultRandom`（const）の直接利用へ置き換える（振る舞い不変）。

**Architecture:** 未使用の `setRandomProvider`/`resetRandomProvider`/`getRandom`/`let _random` を削除し `defaultRandom` のみ残す。`enemyMovement.ts` の `getRandom()` 4箇所を `defaultRandom` に置換。`enemyAiFunctions.ts` の死んだ barrel 再公開を削除。`getRandom()` は常に `defaultRandom` を返していたため挙動は完全同一。既存テスト＋typecheck が安全網。

**Tech Stack:** TypeScript, Jest (SWC), Clean Architecture + DDD（domain 層）。

**設計の出典:** `docs/superpowers/specs/2026-06-16-ipne-airandom-immutable-design.md`

---

## 対象ファイル（3ファイル）

| ファイル | 扱い |
|---------|------|
| `domain/policies/enemyAi/aiRandom.ts` | **変更**（可変機構削除、defaultRandom のみ残す） |
| `domain/policies/enemyAi/enemyMovement.ts` | **変更**（getRandom→defaultRandom、4箇所） |
| `domain/policies/enemyAi/enemyAiFunctions.ts` | **変更**（barrel 再公開1行削除） |

### 不変条件（厳守）

- `defaultRandom` の実装（random/randomInt/pick/shuffle）を逐語維持。
- 敵AIの乱数挙動を変えない（getRandom() は常に defaultRandom を返していた）。
- `index.ts` の公開 API は無変更（setter/getRandom は元々 export していない）。
- フル DI（random 引数注入）はしない。

---

## Task 0: ベースライン確認

**Files:** なし

- [ ] **Step 1: ブランチ確認**

Run: `git branch --show-current`
Expected: `refactor/ipne-airandom-immutable`

- [ ] **Step 2: 関連テスト緑＋typecheck**

Run: `npx jest enemyAI enemyAiFunctions enemyAttackAnim 2>&1 | tail -6`（PASS）
Run: `npm run typecheck 2>&1 | tail -3`（エラーなし）

---

## Task 1: 可変機構の削除と defaultRandom 直接利用

**Files:**
- Modify: `domain/policies/enemyAi/aiRandom.ts`
- Modify: `domain/policies/enemyAi/enemyMovement.ts`
- Modify: `domain/policies/enemyAi/enemyAiFunctions.ts`

- [ ] **Step 1: `aiRandom.ts` を defaultRandom のみに**

`src/features/ipne/domain/policies/enemyAi/aiRandom.ts` の内容を**丸ごと**以下に置換（`defaultRandom` の実装は現行と逐語同一、`let _random`/`getRandom`/`setRandomProvider`/`resetRandomProvider` を削除）:

```typescript
/**
 * 敵AIの乱数プロバイダ
 *
 * Math.random ベースの不変プロバイダを提供する。
 */
import { RandomProvider } from '../../ports';

/** デフォルトの乱数プロバイダー（Math.random ベース） */
export const defaultRandom: RandomProvider = {
  random: () => Math.random(),
  randomInt: (min, max) => min + Math.floor(Math.random() * (max - min)),
  pick: (array) => array[Math.floor(Math.random() * array.length)],
  shuffle: (array) => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },
};
```

- [ ] **Step 2: `enemyMovement.ts` を defaultRandom 直接利用へ**

`src/features/ipne/domain/policies/enemyAi/enemyMovement.ts`:
1. import を変更: `import { getRandom } from './aiRandom';` → `import { defaultRandom } from './aiRandom';`
2. 4箇所の `getRandom()` を `defaultRandom` に置換:
   - `attemptLunge`（63行付近）: `if (getRandom().random() > chance) return null;` → `if (defaultRandom.random() > chance) return null;`
   - `stepRandom`（90行付近）: `const shuffled = getRandom().shuffle(directions);` → `const shuffled = defaultRandom.shuffle(directions);`
   - `generatePatrolPath`（114行付近）: `const length = getRandom().randomInt(4, 9); // 4-8` → `const length = defaultRandom.randomInt(4, 9); // 4-8`
   - `generatePatrolPath`（115行付近）: `const horizontal = getRandom().random() > 0.5;` → `const horizontal = defaultRandom.random() > 0.5;`

> 注: `getRandom()` の出現は上記4箇所のみ（事前 grep で確認済み）。`grep -n "getRandom" enemyMovement.ts` で残存ゼロを確認すること。

- [ ] **Step 3: `enemyAiFunctions.ts` の死んだ barrel 再公開を削除**

`src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts` の9行目を削除:
```typescript
export { setRandomProvider, resetRandomProvider } from './aiRandom';
```
（消費者ゼロ・index.ts にも無いため安全。削除後、enemyAiFunctions の他の export は無変更。）

- [ ] **Step 4: 削除した識別子の参照が残っていないことを確認**

Run: `grep -rn "getRandom\|setRandomProvider\|resetRandomProvider\|_random" src/features/ipne 2>/dev/null | grep -v test | grep -v "getRandomPassableTile\|getRandomRoom\|README"`
Expected: 出力なし（`getRandomPassableTile`/`getRandomRoom` は別関数なので除外。`_random` も消滅）。

- [ ] **Step 5: 関連テスト＋型/lint**

Run: `npx jest enemyAI enemyAiFunctions enemyAttackAnim 2>&1 | tail -8`
Expected: PASS（enemyMovement の attemptLunge/stepRandom/generatePatrolPath を間接的にカバー。挙動は defaultRandom で従来同一）
Run: `npm run typecheck 2>&1 | tail -3`（エラーなし＝削除した getRandom/setter の未定義参照が無い）
Run: `npx eslint src/features/ipne/domain/policies/enemyAi/ 2>&1 | tail -10`（エラーなし、未使用 import なし）

- [ ] **Step 6: コミット**

```bash
git add src/features/ipne/domain/policies/enemyAi/aiRandom.ts \
        src/features/ipne/domain/policies/enemyAi/enemyMovement.ts \
        src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts
git commit -m "refactor: IPNE aiRandom の可変モジュール状態を除去

- 未使用の setRandomProvider/resetRandomProvider/let _random/getRandom を削除し defaultRandom(const) のみに
- enemyMovement は defaultRandom を直接利用（getRandom は常に defaultRandom を返していたため挙動同一）
- 死んだ barrel 再公開を削除。Phase A spec §6 の可変モジュール状態の負債を解消

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: README 更新（任意・軽微）

**Files:**
- Modify: `src/features/ipne/README.md`

- [ ] **Step 1: aiRandom.ts の記述を更新**

`README.md` の `aiRandom.ts # 乱数プロバイダ DI`（109行付近）の記述を、可変状態除去後の実態
（不変の Math.random プロバイダ）に合わせて更新する。例: `aiRandom.ts # 乱数プロバイダ（不変・Math.random ベース）`。
（該当行の正確な文言は README を確認して整える。）

- [ ] **Step 2: コミット**

```bash
git add src/features/ipne/README.md
git commit -m "docs: IPNE README の aiRandom 記述を可変状態除去後に更新

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 最終検証

**Files:** なし

- [ ] **Step 1: 可変モジュール状態が消えたことを確認**

Run: `grep -rn "let _random\|setRandomProvider\|resetRandomProvider\|getRandom\b" src/features/ipne 2>/dev/null | grep -v test`
Expected: 出力なし（可変状態・未使用 setter・getRandom が IPNE から消滅。`getRandomPassableTile`/`getRandomRoom` は `\b` 境界で除外される別名）。

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

- [ ] `aiRandom.ts` が `defaultRandom`（const）のみ。`let _random`/`getRandom`/setter が消滅
- [ ] `enemyMovement.ts` が `defaultRandom` を直接利用（4箇所）
- [ ] `enemyAiFunctions.ts` の死んだ barrel 再公開が削除
- [ ] 可変モジュール状態が IPNE から消えている
- [ ] 敵AIの挙動・公開 API は不変
- [ ] `npx jest ipne` / `npm run typecheck` / `npm run lint:ci` 全パス

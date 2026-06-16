# IPNE aiRandom の可変モジュール状態を除去 設計（フォローアップ）

- 日付: 2026-06-16
- 対象: `src/features/ipne/domain/policies/enemyAi/`（aiRandom.ts / enemyMovement.ts / enemyAiFunctions.ts）
- 種別: リファクタリング（**振る舞い不変**・可変モジュール状態の除去）
- 位置づけ: IPNE 包括リファクタリング（A〜E 完了）の**残フォローアップ**。Phase A spec §6 の既知の負債を解消。

## 1. 背景と目的

`aiRandom.ts` は敵AIの乱数プロバイダを **モジュールレベルの可変変数 `let _random`** で保持し、
`setRandomProvider`/`resetRandomProvider` で差し替え、`getRandom()` で取得する設計になっている。
Phase A の spec §6 で「モジュールレベルの可変状態は既知の負債」と記録された箇所。

調査で判明した事実:

- **`setRandomProvider` / `resetRandomProvider` は誰も呼んでいない**（テストも本番も。`index.ts` の公開 API にも無い）。
  → 「差し替えるための可変状態」なのに一度も差し替えられていない、**死んだ差し替え機構**。
- `getRandom()` を本番で使うのは `enemyMovement.ts` の3関数（`attemptLunge`/`stepRandom`/`generatePatrolPath`）のみ。
  いずれも `getRandom()` は常に `defaultRandom`（Math.random ベース）を返す。
- `generatePatrolPath` は本番から呼ばれずテスト専用。

負債の実体は **「可変性」**（`let` ＋ setter）。注入の実需要はゼロ。よって最小変更で可変性だけを除去する。

### 非目標（YAGNI）

- **フル DI（`random` 引数を context/オーケストレータ/3関数へ7層に通す）はしない。** 誰も注入しない以上、
  注入口の plumbing は過剰投資。プロジェクトの DI 規約（trap/mazeGenerator が `random` を引数で受ける）には
  揃わないが、本件は「可変状態の除去」が目的で、注入機能の追加は別問題。
- `tickGameState` の `random` を敵AIへ接続しない（現状は分断。接続するとテスト挙動が変わるため別判断）。
- 乱数公式・敵AIの挙動の変更。

## 2. 現状調査の要点

- `aiRandom.ts`: `export const defaultRandom`（Math.random プロバイダ）/ `let _random = defaultRandom` /
  `export const getRandom = () => _random` / `setRandomProvider` / `resetRandomProvider`。
- 利用: `enemyMovement.ts:10` `import { getRandom } from './aiRandom'`、`getRandom()` を 63/90/114/115 行で使用。
  `enemyAiFunctions.ts:9` が `setRandomProvider`/`resetRandomProvider` を barrel 再公開（**消費者なし**）。
- `index.ts` に setRandomProvider/resetRandomProvider/getRandom の export は**無い**（公開 API に影響なし）。
- 既存テスト: enemyAI / enemyAiFunctions / enemyAttackAnim が enemyMovement 経由の乱数挙動をカバー
  （default の Math.random で動作）。

## 3. 変更後の構造

### `aiRandom.ts`（可変機構を削除し defaultRandom のみ残す）

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

削除: `let _random`、`getRandom`、`setRandomProvider`、`resetRandomProvider`。`defaultRandom` の実装は逐語維持。

### `enemyMovement.ts`（getRandom → defaultRandom）

- `import { getRandom } from './aiRandom';` を `import { defaultRandom } from './aiRandom';` に変更。
- 4箇所の `getRandom()` を `defaultRandom` に置換:
  - `getRandom().random()`（attemptLunge 63行）→ `defaultRandom.random()`
  - `getRandom().shuffle(directions)`（stepRandom 90行）→ `defaultRandom.shuffle(directions)`
  - `getRandom().randomInt(4, 9)`（generatePatrolPath 114行）→ `defaultRandom.randomInt(4, 9)`
  - `getRandom().random()`（generatePatrolPath 115行）→ `defaultRandom.random()`

`getRandom()` は常に `defaultRandom` を返していたため、挙動は完全に同一。

### `enemyAiFunctions.ts`（死んだ barrel 再公開を削除）

- 9行目 `export { setRandomProvider, resetRandomProvider } from './aiRandom';` を**削除**
  （消費者ゼロ・index.ts にも無いため安全）。

### README（任意・軽微）

`src/features/ipne/README.md` の `aiRandom.ts # 乱数プロバイダ DI` の記述を「不変の乱数プロバイダ」へ更新（任意）。

### 依存方向（不変）

`enemyMovement.ts → aiRandom.ts（defaultRandom）`。循環なし。

## 4. 安全網（振る舞い不変の証明）

`getRandom()` が常に `defaultRandom` を返していたため、`defaultRandom` 直接利用への置換は**完全に挙動同一**。

- 既存テストを全工程で緑に保つ: `enemyAI.test` / `enemyAiFunctions.test` / `enemyAttackAnim.test`
  （enemyMovement の attemptLunge/stepRandom/generatePatrolPath を間接的にカバー）。
- `npm run typecheck`: 削除した `getRandom`/`setRandomProvider`/`resetRandomProvider` の参照が
  残っていないこと（残っていれば未定義参照でコンパイルエラー＝検出）を保証。
- `npm run lint:ci`: 未使用 import の検出。

## 5. 検証手順（refactor-safely）

1. `aiRandom.ts` から可変機構を削除（defaultRandom のみ残す）。
2. `enemyMovement.ts` を defaultRandom 直接利用へ。
3. `enemyAiFunctions.ts` の barrel 再公開を削除。
4. （任意）README 更新。
5. 検証:

```bash
npx jest enemyAI enemyAiFunctions enemyAttackAnim
npm run typecheck
npm run lint:ci
```

6. 最終確認: `npx jest ipne` 全パス。

### 完了の定義（Definition of Done）

- [ ] `aiRandom.ts` から `let _random`/`getRandom`/`setRandomProvider`/`resetRandomProvider` が削除され、`defaultRandom`（const）のみ残る
- [ ] `enemyMovement.ts` が `defaultRandom` を直接利用（4箇所）
- [ ] `enemyAiFunctions.ts` の `setRandomProvider`/`resetRandomProvider` 再公開が削除されている
- [ ] 可変モジュール状態（`let _random` ＋ setter）が IPNE から消えている
- [ ] `tickGameState`・敵AIの挙動は不変（フル DI はしない）
- [ ] `npx jest ipne` / `npm run typecheck` / `npm run lint:ci` 全パス

## 6. リスクと緩和

| リスク | 緩和策 |
|--------|--------|
| 削除した getRandom/setter を見落とした箇所が参照 | typecheck で未定義参照を即検出。事前 grep で参照元が enemyMovement のみと確認済み |
| defaultRandom 置換で挙動が変わる | getRandom() は常に defaultRandom を返していた＝完全同一。既存テストで担保 |
| 公開 API の破壊 | index.ts は setter/getRandom を export していない（確認済み）。barrel 削除のみで外部影響なし |
| defaultRandom の実装変質 | shuffle の Fisher-Yates 等を逐語維持（変更しない） |

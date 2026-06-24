# PRIMAL PATH HP負クランプ漏れバグ修正 設計

- 日付: 2026-06-21
- 対象: `src/features/primal-path/domain/battle/tick-phases.ts`
- ブランチ: `chore/primal-path-fun-verification`
- 関連: [面白さ検証レポート](../reports/2026-06-21-primal-path-fun-verification-report.md) 第8節

## 1. 背景と目的

面白さ検証レポート第8節で報告された副産物バグ。シミュレーションで数千ラン回した際、
dev モードの事後条件 `ensureTickResult`（`contracts/tick-postconditions.ts:17`）が
**HP が負の値**を検出して例外を投げるケースが稀に発生した。

本サブプロジェクトは、この HP 負値リークを根本から是正する（改善提案の優先度「低」）。

## 2. 根本原因（実コード調査で特定）

事後条件 `ensureTickResult` が呼ばれる `tick()` の出口は2つ:

1. **敵撃破時** `resolveEnemyDefeat`（`tick-phases.ts:207`）
2. **通常 tick 終了時**（`tick-phases.ts:263`）

通常終了(2)は安全である。`tickDeathCheck`（241行）が `hp <= 0` を必ず捕捉し、
死亡なら hp=0 に正規化、復活/不滅発動なら正の値に戻すため、263 到達時の HP は必ず正。

**真のリーク経路は撃破時(1)。** `tickEnvPhase`（33行 `next.hp -= envD`）で環境ダメージが
HP を負にした直後、同じ tick でプレイヤーがトドメを刺すと、**プレイヤーの死亡判定を
一切通らずに** `resolveEnemyDefeat` → 事後条件が負 HP を検出して例外を投げる。

production ビルドではコントラクトが無効化されるため例外は出ないが、
プレイヤーが「環境ダメージで本来死ぬべき tick に敵を倒して負 HP のまま勝利」し、
負 HP のまま次戦闘に持ち越す潜在バグが残る。

> 補足: 敵 HP・仲間 HP も減算直後に一時的な負値を取りうるが、それぞれ直後の `<= 0` 判定
> （235/247行の敵撃破、134/159行の仲間死亡）で内部的に処理済み。事後条件が検証するのは
> プレイヤー `nextRun.hp` のみであり、契約違反に直結するのは上記の環境ダメージ経路に限られる。

## 3. 修正方針（方針C: 死亡判定追加＋保険クランプ）

### 3.1 死亡判定の追加（本丸）

`tick()` 内の `tickEnvPhase(next, events)` 直後に既存の `tickDeathCheck` を呼ぶ。

```ts
tickEnvPhase(next, events);
if (tickDeathCheck(next, events)) {
  return { nextRun: next, events }; // 環境ダメージ致死 → 正しく死亡（敵は撃破されない）
}
```

- `tickDeathCheck` は既存関数。`hp > 0` または復活/不滅発動時は `false`（HP を正に戻す）、
  真の死亡時のみ `true`（hp=0 正規化）を返す。この行を通過した時点でプレイヤー HP は必ず `>= 0`。
- 副次効果: 「復活の儀」「不滅の祈り」が**環境ダメージ致死でも発動**する。
  従来は敵攻撃フェーズ後の死亡判定でしか発動しなかった取りこぼしの是正。

### 3.2 保険クランプ

`resolveEnemyDefeat` の事後条件呼び出し直前に1行追加する。

```ts
if (next.hp < 0) next.hp = 0;
```

死亡判定追加により本来は到達しないが、将来のリグレッションで契約違反を二度と起こさないための保険。

## 4. 挙動変更の明示

| 場面 | 変更前 | 変更後 |
|------|--------|--------|
| 環境ダメージが致死量で同 tick に敵撃破 | 負 HP のまま勝利（dev では例外） | プレイヤー死亡（または復活/不滅が発動） |
| 環境ダメージなし・非致死 | 不変 | 不変 |

これは意図的な是正である。

## 5. テスト（TDD・先に書く）

配置: `src/features/primal-path/__tests__/domain/battle/`

1. 環境ダメージが致死量のとき、その tick でプレイヤーが死亡する（`player_dead` イベント発火、
   敵は撃破されない＝`enemy_killed`/`final_boss_killed` が発火しない）。
2. 環境ダメージで負 HP 直後に敵を撃破できる状態で、dev 環境（`NODE_ENV !== 'production'`）でも
   事後条件例外が出ない（元バグの回帰テスト）。
3. 復活の儀（`tb.rv`）/ 不滅の祈り保有時、環境ダメージ致死でも発動し HP が正に戻り戦闘継続
   （`player_dead` が発火しない）。
4. 環境ダメージなし／非致死の通常戦闘で既存挙動が不変（回帰防止）。

## 6. 影響範囲

- 変更ファイル: `src/features/primal-path/domain/battle/tick-phases.ts`（`tick` と `resolveEnemyDefeat`）のみ。
- テスト追加: `src/features/primal-path/__tests__/domain/battle/`。
- 既存 655+ スイートへの破壊的影響はない想定（環境ダメージ致死という稀ケースのみ挙動変更）。

## 7. 成果物

- 修正: `tick-phases.ts`
- 新規テスト: 環境ダメージ致死・回帰・復活発動・通常戦闘不変の4観点
- 本設計ドキュメント

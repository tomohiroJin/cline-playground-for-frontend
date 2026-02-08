# IPNE MVP07 実装計画（PLAN駆動）

## 概要

MVP07は、IPNEの既存機能を維持したまま、実装構造を再設計するリファクタリングフェーズとする。
対象は次の5点:

1. SOLID 原則の適用
2. DRY 原則の適用
3. DbC（Design by Contract）原則の適用
4. 関数型スタイル（宣言的・副作用分離）の適用
5. ディレクトリ構成の整理

機能追加は行わず、保守性・テスト容易性・変更容易性を高める。

---

## 現状課題（根拠）

- `src/pages/IpnePage.tsx:1455` 以降にゲーム進行、状態遷移、入力、描画、音声トリガー、永続化関連の関心が集中している（SRP違反）。
- `src/pages/IpnePage.tsx:1726`（`handleMove`）と `src/pages/IpnePage.tsx:1957`（ゲーム更新ループ）で、ダメージ処理・ノックバック・SE再生の重複がある（DRY違反）。
- `src/features/ipne/gimmickPlacement.ts` が候補探索、スコアリング、配置、フォールバックを単一モジュールで担い肥大化している（責務分離不足）。
- `src/features/ipne/enemyAI.ts` に敵タイプごとの意思決定、移動、接触ダメージ関連が混在している（OCPに弱い）。
- `Math.random()` と `Date.now()` への直接依存が広範囲に散在し、純粋関数の境界が曖昧（テスト容易性低下）。
- 重要入力値（配置比率、座標範囲、状態遷移条件）に契約チェックが不足している（DbC不足）。
- `src/pages/IpnePage.tsx` で `setState` と `ref.current` の二重更新が多く、同期待ちによる不整合リスクがある。
- `src/pages/IpnePage.test.tsx` は画面遷移中心で、ゲームループ内の状態更新（接触・罠・ドロップ・死亡）の回帰保証が薄い。
- `record.ts` `tutorial.ts` `audioSettings.ts` `debug.ts` で `window/localStorage` 直参照が分散している。

---

## 目標アーキテクチャ

`src/features/ipne` を段階的に次の構造へ寄せる。

```text
src/features/ipne/
  application/
    engine/
    usecases/
  domain/
    model/
    services/
    policies/
  infrastructure/
    random/
    clock/
    storage/
  presentation/
    canvas/
    input/
  shared/
    contracts/
    utils/
```

補足:
- 既存 import 互換のため、`src/features/ipne/index.ts` は当面 Facade として維持する。
- まず「移動」ではなく「再エクスポート + 段階置換」で安全に移行する。

---

## 設計方針

### SOLID
- SRP: `IpnePage` の責務を `GameOrchestrator`, `InputController`, `CanvasRenderer`, `EffectDispatcher` に分離。
- OCP: 敵AIをタイプ別ストラテジで拡張可能にする。
- DIP: `RandomProvider` `ClockProvider` `StorageProvider` を注入可能にする。

### DRY
- ダメージ適用、ノックバック適用、SE発火条件を共通ユースケースへ統合。
- `shuffle` などの重複ユーティリティを `shared/utils` に集約。
- `setState + ref同期` の更新パターンを共通 state container に統合。

### DbC
- `shared/contracts` に前提/事後/不変条件チェックを実装。
- 主要関数（配置、戦闘、状態遷移）で契約を明示し、テストで保証する。

### 関数型
- ゲーム更新を「純粋な状態変換 + 副作用命令」に分離。
- `GameTickResult = { nextState, effects }` 形式を採用し、副作用は React 層で実行。
- 画面描画入力は `GameViewModel` 化し、UIでは描画に必要な値のみ参照する。

### 構成整理
- `pages` からドメインロジックを排除し、UIコンポーネントは表示責務に限定。

---

## 実装フェーズ

### Phase 0: セーフティネット整備
- 既存テストを基準化（主要シナリオのスナップショット化/特性テスト追加）。
- `IpnePage` の現行挙動を壊さない回帰テストを追加。
- ゲームループの回帰観点（被弾/罠/撃破/鍵/クリア/死亡）を明文化。

### Phase 1: 契約層と抽象依存導入
- `shared/contracts` 作成。
- `RandomProvider` `ClockProvider` `StorageProvider` のインターフェースを導入。
- 既存関数へデフォルト実装注入（互換維持）。
- `window` 依存は `BrowserEnvProvider` 経由へ移し、ドメイン層直参照を禁止。

### Phase 2: 状態同期モデルの整理
- `setState + ref.current` の二重更新を削減し、単一の state container（`useReducer` または store）へ統合。
- フレーム更新で参照する値は container から取得し、同期責務を1箇所に集約。

### Phase 3: 戦闘・被ダメージ処理のDRY化
- 共通ユースケース `resolvePlayerDamage`, `resolveKnockback`, `resolveItemPickupEffects` を作成。
- `handleMove` と更新ループの重複処理を統合。

### Phase 4: 敵AIの戦略分割（SOLID/OCP）
- `enemyAI` をタイプ別ポリシーへ分割。
- `EnemyAiPolicyRegistry` で切替し、`switch` の拡張コストを削減。

### Phase 5: ギミック配置の分解（SOLID/DbC）
- 候補検出、スコアリング、配置決定を別モジュール化。
- 比率・上限・座標範囲を契約で検証。

### Phase 6: 関数型ゲームループ導入
- `tickGameState(state, input, deps)` の純粋関数化。
- 副作用（音、storage、timer）は `effects` 配列に分離。

### Phase 7: ディレクトリ移行とFacade整備
- 新構成へファイルを段階移行。
- `index.ts` の再エクスポートを整備して既存参照を維持。

### Phase 8: 最終整理
- 未使用コード削除。
- import 正規化。
- テスト・ビルド・lint の最終通過確認。

---

## 完了条件（Definition of Done）

- `IpnePage` がオーケストレーション主体となり、ドメイン判断ロジックを直接持たない。
- `IpnePage` 内の `state/ref` 二重同期が解消され、状態源が一本化される。
- 重複していたダメージ/ノックバック/SE条件分岐が1箇所に集約される。
- 主要モジュールで契約違反時に明示的な失敗が発生する。
- `Math.random` / `Date.now` 直参照がドメイン層から排除される。
- `src/features/ipne` の新ディレクトリ構成が適用される。
- 既存テスト + 追加テストが通過する。

---

## リスクと対策

- リスク: 構造変更による回帰。
- 対策: フェーズごとに小さく分割し、毎フェーズでテストを通す。

- リスク: 一度に移動すると import 崩壊が起きる。
- 対策: Facade (`index.ts`) を維持して段階移行する。

- リスク: 契約チェックの過剰導入で可読性低下。
- 対策: ドメイン境界の重要関数に限定して導入する。

---

## 実施結果（2026-02-07）

### スコープ注記

- Phase 0 は本リファクタリング実施のスコープ外として扱い、別タスクで実施する方針とした。

### 完了フェーズ

- Phase 1: 抽象依存（random/clock/storage/browser）と契約基盤を導入。
- Phase 2: `useSyncedState` により `setState + ref.current` 二重同期を削減し、状態源を一本化。
- Phase 3: 被ダメージ/ノックバック/アイテム取得効果を `application/usecases` へ集約。
- Phase 4: 敵AIをポリシーレジストリへ分解し OCP を改善。
- Phase 5: ギミック配置を候補検出・スコアリング・配置決定へ分割し、設定/事後条件契約を追加。
- Phase 6: `tickGameState` と `effects` モデルを導入し、更新ループを `tick + dispatcher` へ置換。
- Phase 7: `application/domain/infrastructure/presentation/shared` のレイヤー入口を整備し、Facadeを再整理。
- Phase 8: 明確な未使用コードを削除し、最終テストとビルドを完了。

### 主要な最終成果物

- `src/features/ipne/application/engine/tickGameState.ts`
- `src/features/ipne/application/engine/tickGameState.test.ts`
- `src/features/ipne/application/index.ts`
- `src/features/ipne/domain/index.ts`
- `src/features/ipne/infrastructure/index.ts`
- `src/features/ipne/presentation/index.ts`
- `src/features/ipne/shared/index.ts`
- `src/features/ipne/index.ts`（Facade再整理）

### 検証結果

- `npm test -- --watch=false`: **66 suites / 713 tests passed**
- `npm run build`: **pass**（asset size warning 1件は既存）

### 補足

- lint は既存コード由来の指摘（`react-hooks/preserve-manual-memoization` 等）が多数残るため、今回の仕上げでは挙動非変更を優先し、Phase 8 では未使用 import/未使用ローカル関数などの明確な不要コード削除に限定した。

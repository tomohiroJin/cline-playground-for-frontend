# MVP07 タスク一覧

## Phase 0: ベースライン固定
- [ ] 現行 `ipne` の回帰テスト観点を列挙
- [ ] `IpnePage` の主要フロー（開始/移動/戦闘/クリア/ゲームオーバー）の回帰テストを追加
- [ ] ゲームループ観点（接触ダメージ/罠発動/鍵取得/ボス撃破/クリア失敗/死亡）のテストケースを追加
- [ ] `npm test` のベースラインを記録

## Phase 1: 抽象依存と契約基盤
- [x] `src/features/ipne/infrastructure/random/RandomProvider.ts` を追加
- [x] `src/features/ipne/infrastructure/clock/ClockProvider.ts` を追加
- [x] `src/features/ipne/infrastructure/storage/StorageProvider.ts` を追加
- [x] `src/features/ipne/infrastructure/browser/BrowserEnvProvider.ts` を追加
- [x] `src/features/ipne/shared/contracts` に契約チェック関数を追加
- [x] 既存ロジックへデフォルト依存注入を適用
- [x] `window/localStorage` 直参照箇所をインフラ層へ移送（`record/tutorial/audio/debug`）

## Phase 2: 状態同期モデルの整理
- [x] ゲーム状態ストア（`useReducer` または同等）を導入
- [x] `setState + ref.current` の二重更新箇所を移行
- [x] 更新ループが単一の状態源を読むように変更

## Phase 3: DRY統合（被ダメージ/ノックバック/SE）
- [x] `resolvePlayerDamage` ユースケースを追加
- [x] `resolveKnockback` ユースケースを追加
- [x] `resolveItemPickupEffects` ユースケースを追加
- [x] `IpnePage.tsx` の `handleMove` から重複処理を移管
- [x] `IpnePage.tsx` の更新ループから重複処理を移管

## Phase 4: 敵AIのSOLID化
- [x] 敵タイプ別ポリシーを `domain/policies/enemyAi` 配下へ分離
- [x] `EnemyAiPolicyRegistry` を導入
- [x] `updateEnemyAI` をレジストリ経由に置換
- [x] 敵AIポリシー単体テストを追加

## Phase 5: ギミック配置の分解
- [x] `gimmickPlacement` を候補検出・スコアリング・配置決定に分割
- [x] 配置設定値（比率/個数）の契約チェックを追加
- [x] 配置結果の事後条件（重複なし・件数）を追加
- [x] 既存 `gimmickPlacement.test.ts` を分割構成に追従

## Phase 6: 関数型ゲームループ化
- [x] `tickGameState`（純粋関数）を `application/engine` に追加
- [x] `effects` モデル（音/保存/表示）を定義
- [x] `IpnePage` の更新ループを `tick + effect dispatcher` 方式へ置換
- [x] tick関数のシナリオテストを追加

## Phase 7: ディレクトリ構成移行
- [x] `application/domain/infrastructure/presentation/shared` を作成
- [x] 既存モジュールを段階移行（互換エクスポート維持）
- [x] `src/features/ipne/index.ts` を Facade として再整理
- [x] import パスを正規化

## Phase 8: 仕上げ
- [x] 未使用コードを削除
- [x] `npm test` を実行し全通過を確認
- [x] `npm run build` を実行しビルド通過を確認
- [x] リファクタリング結果を `.docs/ipne/mvp/07` に追記

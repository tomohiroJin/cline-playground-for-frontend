# MVP06 タスク一覧

## Phase 1: ボスHP調整
- [x] `enemy.ts` のボスHPを35に変更

## Phase 2: 鍵システム基盤
- [x] `types.ts` に KEY アイテムタイプ追加
- [x] `types.ts` の Player に hasKey フィールド追加
- [x] `player.ts` の createPlayer に hasKey: false 追加
- [x] `item.ts` に ITEM_CONFIGS[KEY] 追加
- [x] `item.ts` に SPAWN_CONFIG[KEY] 追加
- [x] `item.ts` に createKeyItem 関数追加

## Phase 3: 鍵取得・ドロップ機能
- [x] `item.ts` の ItemEffectType に 'key' 追加
- [x] `item.ts` の ItemPickupResult に triggerKeyPickup 追加
- [x] `item.ts` の pickupItem に KEY 処理追加
- [x] `item.ts` の spawnItems に鍵配置ロジック追加（goalPosパラメータ追加）
- [x] `enemy.ts` の processEnemyDeath にボス鍵ドロップ追加

## Phase 4: ゴール判定修正
- [x] `goal.ts` に canGoal 関数追加
- [x] `index.ts` に canGoal エクスポート追加
- [x] `IpnePage.tsx` の handleMove でゴール判定修正
- [x] `IpnePage.tsx` に showKeyRequiredMessage ステート追加
- [x] `IpnePage.tsx` の spawnItems 呼び出しに goalPos 追加
- [x] `IpnePage.tsx` にボス撃破時の鍵ドロップ処理追加

## Phase 5: UI表示
- [x] `IpnePage.styles.ts` に KeyIndicator スタイル追加
- [x] `IpnePage.styles.ts` に KeyIcon スタイル追加
- [x] `IpnePage.styles.ts` に KeyRequiredMessage スタイル追加
- [x] `IpnePage.tsx` にスタイルインポート追加
- [x] `IpnePage.tsx` の CONFIG.itemColors に key 追加
- [x] GameScreen に showKeyRequiredMessage props 追加
- [x] GameScreen に鍵インジケータ追加
- [x] GameScreen に「鍵が必要です」メッセージ追加

## Phase 6: 画像対応
- [x] PNG→WebP変換（戦士、盗賊）
- [x] 画像を src/assets/images/ に配置
- [x] `IpnePage.styles.ts` に ClassImage スタイル追加
- [x] `IpnePage.tsx` に画像インポート追加
- [x] 職業選択画面で画像表示（ClassIcon → ClassImage）

## Phase 7: テスト・ドキュメント
- [x] `enemy.test.ts` のボスHP期待値を35に変更
- [x] `enemy.test.ts` にボス鍵ドロップテスト追加
- [x] 全テスト通過確認
- [x] ビルド確認
- [x] `.docs/ipne/mvp/06/spec.md` 作成
- [x] `.docs/ipne/mvp/06/tasks.md` 作成

# Air Hockey ブラッシュアップ タスクリスト

## Phase 1: 基盤変更（サイズ動的化）

- [x] 1-1. `core/types.ts` に `CanvasSize` 型とサイズ関連型を追加
- [x] 1-2. `core/constants.ts` をサイズパラメータ対応に変更（関数化 or マップ化）
- [x] 1-3. `core/config.ts` にサイズオプション定義を追加
- [x] 1-4. `core/entities.ts` のエンティティ生成をサイズ対応化
- [x] 1-5. `core/physics.ts` のサイズ参照を動的化
- [x] 1-6. `core/ai.ts` のサイズ参照を動的化
- [x] 1-7. `renderer.ts` のサイズ参照を動的化
- [x] 1-8. `hooks/useGameLoop.ts` のサイズ参照を動的化
- [x] 1-9. `hooks/useInput.ts` のサイズ参照を動的化
- [x] 1-10. `components/Field.tsx` を動的サイズ対応
- [x] 1-11. `AirHockeyGame.tsx` にサイズ state を追加
- [x] 1-12. `components/TitleScreen.tsx` にサイズ選択UI追加
- [x] 1-13. 動作確認：Standard サイズで既存動作が崩れていないか確認
- [x] 1-14. 動作確認：Large サイズでゲームが正常動作するか確認

## Phase 2: ステージ追加

- [ ] 2-1. `core/config.ts` に Zigzag ステージを追加
- [ ] 2-2. `core/config.ts` に Fortress ステージを追加
- [ ] 2-3. 動作確認：新ステージで障害物との衝突が正常に動作するか確認

## Phase 3: サーブ方向修正

- [ ] 3-1. `hooks/useGameLoop.ts` のゴール後パック生成の方向を修正
- [ ] 3-2. `core/entities.ts` の初期パック生成のvy方向をランダム化
- [ ] 3-3. 動作確認：得点後のサーブ方向が正しいか確認

## Phase 4: CPU AI 調整

- [ ] 4-1. `core/constants.ts` の CPU 速度定数を調整
- [ ] 4-2. `core/ai.ts` の Easy モード調整（ブレ増加、緩やかな動き）
- [ ] 4-3. `core/ai.ts` の Normal モード調整（予測改善、積極性向上）
- [ ] 4-4. `core/ai.ts` の Hard モード調整（壁反射予測、ポジショニング改善）
- [ ] 4-5. 動作確認：各難易度で適切な強さになっているか確認

## Phase 5: フィーバータイム

- [ ] 5-1. `core/types.ts` にフィーバー状態型を追加
- [ ] 5-2. `core/constants.ts` にフィーバー関連定数を追加
- [ ] 5-3. `core/entities.ts` のゲームステート初期化にフィーバー状態を追加
- [ ] 5-4. `hooks/useGameLoop.ts` にフィーバー判定ロジックを実装
- [ ] 5-5. `hooks/useGameLoop.ts` にフィーバー中のパック追加ロジックを実装
- [ ] 5-6. `renderer.ts` にフィーバー演出描画を追加
- [ ] 5-7. 動作確認：膠着状態でフィーバーが発動するか確認

## Phase 6: 見た目強化

- [ ] 6-1. `renderer.ts` にパックのトレイル（残像）エフェクトを追加
- [ ] 6-2. `renderer.ts` のマレットグロー効果を強化
- [ ] 6-3. `renderer.ts` のゴールエフェクトにパーティクルを追加
- [ ] 6-4. `renderer.ts` に背景のグラデーションアニメーションを追加
- [ ] 6-5. `renderer.ts` のフィールド線のネオングロー強化
- [ ] 6-6. 動作確認：視覚的な改善がパフォーマンスに影響していないか確認

## Phase 7: テスト & 最終確認

- [ ] 7-1. 既存ユニットテスト（AI.test.ts, Physics.test.ts, entities.test.ts, items.test.ts）の修正・実行
- [ ] 7-2. 全体の統合動作確認
- [ ] 7-3. コミット

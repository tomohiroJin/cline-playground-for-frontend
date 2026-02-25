# LABYRINTH OF SHADOWS ブラッシュアップ タスクリスト

## Phase 1: 基盤整備

- [x] パフォーマンス最適化: setHud/setMapData の変化検知
- [x] Minimap Canvas化: minimap-renderer.ts 新規作成
- [x] Minimap Canvas化: Minimap.tsx をCanvas ベースに変更
- [x] ポーズ機能: コンポーネントレベルで paused state 管理
- [x] ポーズ機能: Escape キーハンドラ追加
- [x] ポーズ機能: ポーズ画面オーバーレイ追加
- [x] README 操作説明修正（Ctrl → Space）
- [x] README に Escape: ポーズ を追加
- [x] テスト: renderer.test.ts 新規作成
- [x] テスト: audio.test.ts 新規作成

## Phase 2: ゲームプレイ強化

- [x] BFS パスファインディング関数を maze-service.ts に追加
- [x] 敵AI: BFS ベースの追跡に変更
- [x] 型定義: EntityType に heal/speed/map 追加
- [x] 型定義: EnemyType 追加
- [x] 型定義: GameState に speedBoost 追加
- [x] constants.ts: 新アイテム定義追加
- [x] constants.ts: 新敵タイプ定義追加
- [x] constants.ts: 難易度設定に新アイテム・新敵パラメータ追加
- [x] entity-factory.ts: 新アイテム・新敵の生成ロジック
- [x] game-logic.ts: 新アイテムの効果処理
- [x] game-logic.ts: 敵タイプ別AI（徘徊/追跡/テレポート）
- [x] renderer.ts: 新アイテム・新敵のスプライト対応

## Phase 3: 視覚・聴覚演出強化

- [x] renderer.ts: プロシージャルレンガテクスチャ
- [x] renderer.ts: トーチ照明揺らぎ効果
- [x] renderer.ts: ポストプロセス（スキャンライン + ビネット）
- [x] audio.ts: BGM生成（プロシージャルアンビエント）
- [x] audio.ts: BGM のゲーム状態連動
- [x] LabyrinthOfShadowsGame.tsx: BGM の開始/停止制御

## Phase 4: 追加コンテンツ + 仕上げ

- [x] maze-service.ts: Prim法による迷路生成
- [x] entity-factory.ts: 難易度に応じた迷路アルゴリズム選択
- [x] audio.ts: StereoPannerNode による3D音響
- [x] constants.ts: ストーリーテキスト強化
- [x] テスト: BFS パスファインディングのテスト
- [x] テスト: 新アイテム効果のテスト
- [x] テスト: 新敵タイプAIのテスト
- [x] テスト: Prim法迷路生成のテスト

## 検証

- [x] npm test 全テスト通過（84テスト）
- [x] npm run build ビルド成功
- [x] ブラウザ確認: 全難易度プレイ

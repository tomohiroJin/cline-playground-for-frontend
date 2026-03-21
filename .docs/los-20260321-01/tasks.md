# Labyrinth of Shadows リファクタリング タスク管理

## Phase 0: テスト基盤整備 ✅
- [x] AudioContext モック共通化
- [x] GameStateBuilder 作成
- [x] 条件付きテスト除去

## Phase 1: ドメイン層の抽出 ✅
- [x] 型定義（domain/types.ts）
- [x] 定数（domain/constants.ts）
- [x] 衝突判定（domain/services/collision.ts）
- [x] スコア計算（domain/services/scoring.ts）
- [x] パスファインディング（domain/services/pathfinding.ts）
- [x] 迷路生成（domain/services/maze-generator.ts）

## Phase 2: 副作用の分離 ✅
- [x] GameEvent 型定義（application/game-events.ts）
- [x] processItemPickup 純粋関数化

## Phase 3: 敵 AI リファクタリング ✅
- [x] EnemyStrategy インターフェース
- [x] WandererStrategy
- [x] ChaserStrategy
- [x] TeleporterStrategy

## Phase 4: インフラ層の整理 ✅
- [x] IAudioService インターフェース定義
- [x] WebAudioService クラス実装
- [x] NullAudioService（テスト用）実装
- [x] Renderer のレンガテクスチャ分離（infrastructure/rendering/brick-texture.ts）
- [x] レンダリング設定の分離（infrastructure/rendering/render-config.ts）
- [x] スタイル定義の feature 内移動（presentation/styles/game.styles.ts）

## Phase 5: プレゼンテーション層の分割 ✅
- [x] useInput カスタムフック抽出
- [x] useAudio カスタムフック抽出
- [x] useGameLoop カスタムフック抽出
- [x] LabyrinthOfShadowsGame のスリム化（354行→175行）
- [x] フックロジックのテスト追加（use-input, use-audio）

## Phase 6: E2E テスト・最終整備 ✅
- [x] 画面遷移 E2E テスト（e2e/labyrinth-of-shadows/screen-flow.spec.ts）
- [x] index.ts エクスポート整理（ドメイン・インフラ層のエクスポート追加）
- [x] 全テスト通過確認（16 suites, 177 tests）
- [x] lint クリーン確認

## 手動動作確認 ✅
- [x] ゲームを開始してプレイできること
- [x] ブラウザでの動作に問題がないこと

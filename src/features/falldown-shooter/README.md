# Falldown Shooter（フォールダウンシューター）

## 概要

上から落ちてくるブロックを弾で撃って消すシューティングゲーム。
ステージが進むと難易度が上昇し、パワーアップアイテムやスキルを駆使して高得点を目指す。

## 機能

- **ステージ制**: ライン消去で進行、最終ステージクリアでエンディング
- **難易度選択**: Easy / Normal / Hard の3段階（スコア倍率・落下速度・パワーアップ確率が変化）
- **ポーズ機能**: ゲーム中に一時停止可能（Escape / P キー）
- **ランキング**: 難易度別トップ10スコアを表示
- **パワーアップ**: トリプルショット、貫通弾、ダウンショット、スロー、爆弾
- **スキルシステム**: 3種類のスキル（レーザー / ブラスト / クリア）

## 操作方法

| 操作 | キー | 説明 |
|------|------|------|
| 移動 | ← → | 左右移動 |
| 射撃 | Space | 弾を発射 |
| スキル | Z / X / C | レーザー / ブラスト / クリア |
| ポーズ | Escape / P | 一時停止トグル |
| モバイル | タッチボタン | 画面下部のコントロールボタン |

## 難易度パラメータ

| パラメータ | Easy | Normal | Hard |
|-----------|------|--------|------|
| スポーン間隔倍率 | 1.5x（遅い） | 1.0x | 0.7x（速い） |
| 落下速度倍率 | 1.3x（遅い） | 1.0x | 0.8x（速い） |
| スコア倍率 | 0.8x | 1.0x | 1.5x |
| パワーアップ出現率 | 20% | 15% | 10% |
| スキルチャージ速度 | 1.2x（速い） | 1.0x | 0.8x（遅い） |

## ファイル構成

```
src/features/falldown-shooter/
  types.ts              # 型定義（GameState, Difficulty, Powers 等）
  constants.ts          # ゲーム設定定数（CONFIG）
  difficulty.ts         # 難易度定義（DIFFICULTIES）
  block.ts              # ブロック生成・管理
  bullet.ts             # 弾管理
  grid.ts               # グリッド管理
  stage.ts              # ステージ進行
  collision.ts          # 衝突判定
  game-logic.ts         # ゲームロジック（純粋関数）
  audio.ts              # 効果音生成（Web Audio API）
  utils.ts              # ユーティリティ関数
  hooks.ts              # 共通カスタムフック（useInterval, useKeyboard, useIdleTimer）
  FalldownShooterGame.tsx  # メインゲームコンポーネント
  index.ts              # barrel export

  hooks/                # ゲーム専用カスタムフック
    use-game-state.ts   # ゲーム状態管理（stateRef, updateState）
    use-game-flow.ts    # ゲームフロー（startStage, goToTitle, resetGame, nextStage, loadHighScore）
    use-game-controls.ts # 操作（moveLeft, moveRight, fire）
    use-game-loop.ts    # ゲームループ（4つのuseInterval統合、スコア保存、難易度パラメータ適用）
    use-skill-system.ts # スキルシステム（チャージ、発動、skillChargeMultiplier適用）
    use-power-up.ts     # パワーアップ管理
    use-responsive-size.ts # レスポンシブセルサイズ計算
    index.ts            # barrel export

  components/           # UIコンポーネント（すべてReact.memo適用）
    BulletView.tsx      # 弾描画
    CellView.tsx        # セル描画
    Effects.tsx         # エフェクト（レーザー、爆発、ブラスト）
    Overlays.tsx        # オーバーレイ（スタート、クリア、ゲームオーバー、エンディング、デモ）
    PlayerShip.tsx      # プレイヤー描画（SVG）
    PowerUpIndicator.tsx # パワーアップ状態表示
    SkillGauge.tsx      # スキルゲージ（ARIA対応）
    StatusBar.tsx       # ステータスバー（ステージ、ライン、スコア）
    DifficultySelector.tsx # 難易度選択UI
    GameBoard.tsx       # ゲーム盤面描画
    GameOverlays.tsx    # オーバーレイ統合管理
    PauseOverlay.tsx    # ポーズ画面
    RankingOverlay.tsx  # ランキング表示（難易度別タブ）

  __tests__/            # テスト
    block.test.ts       # ブロックロジック
    bullet.test.ts      # 弾ロジック
    collision.test.ts   # 衝突判定
    game-logic.test.ts  # ゲームロジック
    grid.test.ts        # グリッドロジック
    stage.test.ts       # ステージ進行
    utils.test.ts       # ユーティリティ
    audio.test.ts       # 音声エラーハンドリング
    hooks.test.ts       # カスタムフック（useInterval, useKeyboard, useIdleTimer）
    integration.test.tsx # 統合テスト（ゲームフロー、ポーズ、難易度、ランキング）
    components/         # コンポーネントテスト
      BulletView.test.tsx
      CellView.test.tsx
      Effects.test.tsx
      Overlays.test.tsx
      PlayerShip.test.tsx
      PowerUpIndicator.test.tsx
      SkillGauge.test.tsx
      StatusBar.test.tsx

src/pages/FallingShooterPage.tsx        # ページコンポーネント（薄いラッパー）
src/pages/FallingShooterPage.styles.ts  # スタイル定義（レスポンシブ対応）
src/utils/score-storage.ts             # スコア保存・取得（難易度別キー対応）
```

## 状態管理

- React Hooks（`useState`, `useRef`, `useCallback`）によるゲーム状態管理
- `useRef` でゲームループの高頻度更新に対応（`Object.assign` によるミューテーション）
- カスタムフックへの分離でメインコンポーネントを約180行に維持

## 使用技術

- **CSS Animation**: レーザー、爆発、デンジャーラインエフェクト
- **Web Audio API**: 効果音生成（AudioContext suspended 対応）
- **localStorage**: スコア保存（難易度別キー、QuotaExceededError 対応）
- **React.memo**: 全プレゼンテーショナルコンポーネントのレンダリング最適化
- **ARIA**: スキルゲージ、ボタンラベル、ライブリージョンによるアクセシビリティ対応

## テスト実行

```bash
# falldown-shooter のテストのみ実行
npx jest --testPathPatterns='falldown-shooter' --no-coverage

# カバレッジ付き
npx jest --testPathPatterns='falldown-shooter' --coverage
```

**テスト構成**: 18テストスイート / 158テスト

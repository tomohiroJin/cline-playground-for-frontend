# アーキテクチャ・技術詳細

## ファイル構成

```
src/features/air-hockey/
  core/
    physics.ts            # 物理演算（衝突判定、速度計算）
    ai.ts                 # CPU AI ロジック（3段階難易度、壁反射予測）
    entities.ts           # エンティティ定義（パック、マレット、統計）
    items.ts              # アイテムシステム（6種）
    sound.ts              # 効果音・BGM 生成（Web Audio API）
    config.ts             # ゲーム設定（ステージ、アイテム定義）
    constants.ts          # 定数（キャンバス、物理、CPU、フィーバー、カムバック）
    types.ts              # 型定義
    achievements.ts       # 実績システム（定義・判定・localStorage 管理）
    audio-settings.ts     # 音量設定（localStorage 管理）
    characters.ts         # キャラクター定義（主人公・対戦相手・リアクション）
    daily-challenge.ts    # デイリーチャレンジ（シード生成・ルール・結果保存）
    dialogue-data.ts      # ストーリーモード第1章ダイアログデータ
    difficulty-adjust.ts  # 難易度オートアジャスト（連勝/連敗判定）
    keyboard.ts           # キーボード操作（状態管理・移動計算）
    story.ts              # ストーリー進行管理（保存・読込・リセット・解放判定）
    story-balance.ts      # ステージ別バランス設定・AI 振る舞いプリセット
    unlock.ts             # フィールド/アイテムアンロック（条件・状態管理）
  hooks/
    useGameLoop.ts        # ゲームループ（フェーズ管理、物理更新、描画）
    useInput.ts           # マウス/タッチ入力ハンドリング
    useKeyboardInput.ts   # キーボード入力ハンドリング
  components/
    Field.tsx             # フィールド描画（Canvas、シェイク）
    ResultScreen.tsx       # リザルト画面（統計、実績、紙吹雪、リプレイ）
    Scoreboard.tsx         # スコアボード（ポーズボタン）
    TitleScreen.tsx        # タイトル画面（設定選択、実績、デイリー）
    AchievementList.tsx    # 実績一覧モーダル
    DailyChallengeScreen.tsx # デイリーチャレンジ画面
    SettingsPanel.tsx      # 設定パネルモーダル（音量調整）
    CharacterAvatar.tsx    # キャラクターアイコン表示（共通コンポーネント）
    DialogueOverlay.tsx    # ダイアログオーバーレイ（ストーリーモード）
    StageSelectScreen.tsx  # ステージ選択画面（ストーリーモード）
    Transition.tsx         # 画面トランジション
    Tutorial.tsx           # チュートリアルオーバーレイ
    VsScreen.tsx           # VS 画面（ストーリーモード・2P 対戦）
    CharacterSelectScreen.tsx  # キャラクター選択画面（2P 対戦）
  AirHockeyGame.tsx       # メインゲームコンポーネント
  renderer.ts             # Canvas 描画（トレイル、グロー、パーティクル、フィーバー演出等）
  styles.ts               # スタイル定義（レスポンシブ対応）
  index.ts                # barrel export
src/pages/AirHockeyPage.tsx  # ページコンポーネント
```

## 状態管理

- React Hooks（`useState`, `useRef`, `useEffect`）
- カスタムフック（`useGameLoop`, `useInput`, `useKeyboardInput`）でゲームループと入力を分離
- `useRef` でゲームループの状態をフレーム間で保持
- localStorage でハイスコア、実績、音量設定、アンロック状態、デイリーチャレンジ結果を永続化

## 2P 対戦のアーキテクチャ

### 入力分離

`keyboard.ts` で 1P（矢印キー）と 2P（WASD）のキーマッピングを分離:
- `PLAYER1_KEY_MAP`: 矢印キーのみ
- `PLAYER2_KEY_MAP`: WASD のみ
- `updateKeyboardStateForPlayer()`: プレイヤー別に独立したキー状態を管理
- `calculateKeyboardMovement()`: `playerSlot` に応じて Y 軸クランプ範囲を切替（1P: 下半分、2P: 上半分）

### ゲームループの 2P 分岐

```
gameMode === '2p-local' の場合:
  AI 更新をスキップ → WASD 入力で CPU マレット位置を更新
gameMode !== '2p-local' の場合:
  従来の CPU AI でマレット位置を更新
```

### レイヤー配置

| レイヤー | 2P 対戦関連 |
|---------|------------|
| domain | `PlayerSlot` 型 |
| application | `TwoPlayerBattleUseCase`（スコア・勝敗管理） |
| presentation | `useGameMode`（キャラ選択状態）、`useGameLoop`（2P 入力分岐） |
| components | `CharacterSelectScreen`、`TitleScreen`（2P ボタン）、`ResultScreen`（2P 表示） |

## 使用技術

| 技術 | 用途 |
|------|------|
| Canvas 2D | リアルタイム物理演算＆描画 |
| Web Audio API | 効果音・BGM の動的生成 |
| 物理演算 | 衝突判定（円-円、円-壁）、反射、摩擦 |
| AI | 難易度に応じた CPU 戦略（Easy: ブレ＋低速、Normal: 予測＋積極性、Hard: 壁反射予測＋ポジショニング） |
| CSS Transform | 画面シェイク、レスポンシブスケーリング |

## テスト

355テスト（全フェーズ合計）:

| テストファイル | 対象 |
|--------------|------|
| `core/phase1.test.ts` | レスポンシブ・カウントダウン・シェイク・速度ビジュアル・BGM・サウンド改善 |
| `core/phase2.test.ts` | ポーズ・新アイテム・コンボ・カムバック・統計 |
| `core/phase3.test.ts` | 実績・音量設定・チュートリアル |
| `core/phase4.test.ts` | キーボード操作・難易度調整・アンロック・デイリーチャレンジ |
| `core/AI.test.ts` | AI ロジック |
| `core/ai-configurable.test.ts` | AI 設定可能インターフェース |
| `core/Physics.test.ts` | 物理演算 |
| `core/entities.test.ts` | エンティティ |
| `core/items.test.ts` | アイテムシステム |
| `core/characters.test.ts` | キャラクターデータ整合性 |
| `core/story.test.ts` | ストーリー進行ロジック |
| `core/dialogue-data.test.ts` | ダイアログデータ整合性 |
| `core/story-mode.test.ts` | ストーリーモード統合テスト |
| `core/story-balance.test.ts` | バランス設定テスト |
| `core/integration.test.ts` | クロスモジュール統合テスト |
| `core/visual-effects.test.ts` | ヒットストップ・スローモーション |
| `components/StageSelectScreen.test.tsx` | ステージ選択画面 |
| `components/DialogueOverlay.test.tsx` | ダイアログオーバーレイ |
| `components/VsScreen.test.tsx` | VS 画面 |

## リファクタリング方針（CR-06）

### AirHockeyGame.tsx の分割案

`AirHockeyGame.tsx` は 600 行超に肥大化しており、画面追加に伴い保守性が低下している。
以下のカスタムフックへの段階的な分離を推奨する。

| フック名 | 責務 | 抽出対象 |
|----------|------|----------|
| `useScreenTransition` | 画面遷移の状態管理 | `screen`, `setScreen`, 遷移ハンドラ群 |
| `useStoryMode` | ストーリーモード固有ロジック | `currentStage`, `storyProgress`, ストーリー関連ハンドラ |
| `useGameScores` | スコアの ref/state 二重管理の統合 | `scoreRef`, `scores`, スコア更新ロジック |
| `useGameLoop` | ゲームループ・描画 | `canvasRef`, `gameRef`, 描画ループ |

**注意**: 影響範囲が大きいため、十分なテストカバレッジを確保した上で段階的に実施すること。

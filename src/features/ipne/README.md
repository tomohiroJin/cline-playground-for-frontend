# IPNE（アイピーエヌイー）

## 概要

ランダム生成迷路を探索するローグライクRPG。
敵を倒し、アイテムを集め、ゴールを目指す。
クラスシステム、レベルアップ、罠・壁ギミック、チュートリアルなど多彩な要素を搭載。
レイヤードアーキテクチャ＆DDD 風設計で整理されたコード構成。

## ゲームシステム

### 5ステージ制

全5ステージで構成され、各ステージごとに迷路サイズ・敵数・難易度が段階的に上昇する。

| ステージ | 名称 | 迷路サイズ | 敵数 | レベル上限 | ボス |
|---------|------|-----------|------|-----------|------|
| 1 | 第一層 | 80×80 | 25体 | Lv10 | ボス |
| 2 | 第二層 | 85×85 | 31体 | Lv13 | ボス |
| 3 | 第三層 | 90×90 | 40体 | Lv16 | ボス |
| 4 | 第四層 | 95×95 | 47体 | Lv19 | ボス |
| 5 | 最深部 | 100×100 | 55体 | Lv22 | メガボス |

### レベルアップシステム

- 敵を撃破して経験値（累計撃破数）を獲得し、レベルアップ
- レベルアップ時に5つの能力から1つを選択して強化
  - 攻撃力 +1（上限なし）
  - 攻撃距離 +1（上限3）
  - 移動速度 +1（上限8）
  - 攻撃速度 +10%（クールダウン-0.1、上限0.5）
  - 回復量 +1（上限5）
- ステージごとにレベル上限があり、3レベルずつ拡張される

### HP 自動回復

- 一定時間（基本12秒）ごとに HP が 1 回復する
- 回復量ボーナス（healBonus）により回復間隔が短縮される（ボーナス1あたり1秒短縮、最短5秒）
- 戦闘中も自動で回復するため、慎重な立ち回りが生存率を高める

### ステージ別ビジュアル

各ステージで壁・床の色が変化し、進行に応じた雰囲気の変化を演出する。

- ステージ1: 茶系（スタンダード）
- ステージ2: 灰系（石造り）
- ステージ3: 青緑系（水の層）
- ステージ4: 紫系（魔法の層）
- ステージ5: 深紅・黒系（最深部）

### ステージクリア報酬

ボス撃破後、次ステージへ進む前に特別な報酬を1つ選択できる（最大HP+5、攻撃力+1、各種能力強化）。

## 操作方法

- **WASD / 矢印キー**: 移動
- **スペース**: 攻撃
- **M**: オートマップ切り替え
- **モバイル**: 十字キーボタン操作

## 技術詳細

### ファイル構成

`types.ts` は Phase 1 で 9 つのドメイン別ファイル（`domain/types/`）に分割され、
`types.ts` 自体は barrel re-export として後方互換性を維持しています。

```
src/features/ipne/
  index.ts                    # barrel export
  types.ts                    # barrel re-export（domain/types/ への後方互換）
  domain/                     # ドメイン層（ビジネスルール、外部依存なし）
    types/                    # 型定義（9ファイルに分割）
      world.ts                #   TileType, GameMap, Position, Direction, MazeConfig 等
      player.ts               #   Player, PlayerClass, ClassConfig, PlayerStats 等
      enemy.ts                #   Enemy, EnemyType, EnemyState
      gimmicks.ts             #   Trap, TrapType, Wall, WallType 等
      items.ts                #   Item, ItemType
      stage.ts                #   StageNumber, StageConfig, StageRewardType 等
      game-state.ts           #   GameState, ScreenState, CombatState, Rating 等
      feedback.ts             #   FeedbackType, FeedbackEffect, TutorialState 等
      audio.ts                #   AudioSettings, SoundEffectType, BgmType 等
      index.ts                #   barrel export
    entities/                 # エンティティ（純粋関数、IdGenerator DI）
      player.ts               #   プレイヤー生成・状態変更
      enemy.ts                #   敵生成・状態変更・ドロップ判定
      trap.ts                 #   罠生成・状態変更
      wall.ts                 #   壁生成・状態変更
      item.ts                 #   アイテム生成
    valueObjects/             # 値オブジェクト
      playerClass.ts          #   職業設定（WARRIOR, THIEF）
    services/                 # ドメインサービス
      combatService.ts        #   戦闘判定・ダメージ計算
      collisionService.ts     #   衝突判定
      movementService.ts      #   移動ロジック
      pathfinderService.ts    #   経路探索（A*）
      mazeGenerator.ts        #   迷路生成（BSP法）
      progressionService.ts   #   レベルアップ・能力値成長
      goalService.ts          #   ゴール判定
      endingService.ts        #   エンディング条件・評価計算
      comboService.ts         #   コンボカウンター管理
      mapService.ts           #   マップ管理
      gimmickPlacement/       #   ギミック配置サービス
    policies/                 # ドメインポリシー（Strategy パターン）
      enemyAi/                #   敵AIポリシー（patrol, charge, ranged, flee 等）
    config/                   # ドメイン定数
      stageConfig.ts          #   5ステージ設定データ
      gameBalance.ts          #   全バランス定数（マジックナンバー集約）
      story.ts                #   ストーリーデータ
    ports/                    # ポート（依存性逆転用インターフェース）
      IdGenerator.ts          #   ID 生成器
      RandomProvider.ts       #   乱数プロバイダー
      ClockProvider.ts        #   時計プロバイダー
    contracts/                # DbC アサーション（require, ensure, invariant）
    factories/                # 統一ファクトリ
      entityFactory.ts        #   EntityFactory（enemy, trap, wall, item）
  application/                # アプリケーション層（ユースケース）
    engine/
      tickGameState.ts        #   ゲームティック（オーケストレーター）
    usecases/
      resolvePlayerDamage.ts  #   ダメージ解決
      resolveItemPickupEffects.ts # アイテム取得効果
      resolveKnockback.ts     #   ノックバック処理
      resolveTraps.ts         #   罠トリガー処理
      resolveRegen.ts         #   リジェネ処理
      resolveEnemyUpdates.ts  #   敵更新・死亡フィルタ
      enemySpawner.ts         #   敵スポーン
      autoMapping.ts          #   オートマッピング
    services/
      timerService.ts         #   ゲームタイマー
  infrastructure/             # インフラ層（外部依存の実装）
    browser/                  #   ブラウザ環境
    clock/                    #   ClockProvider 実装
    random/                   #   RandomProvider 実装
    storage/                  #   StorageProvider / recordStorage
    id/                       #   SequentialIdGenerator 実装
    debug/                    #   デバッグサービス
  presentation/               # プレゼンテーション層（React UI）
    hooks/
      useGameState.ts         #   統合 Facade フック
      useGameSetup.ts         #   マップ生成・初期化
      useScreenTransition.ts  #   画面遷移ハンドラー
      useStageManagement.ts   #   ステージ進行・報酬・引き継ぎ
      useGameAudio.ts         #   BGM/SE管理
      useGameLoop.ts          #   ゲームループ
      useEffectDispatcher.ts  #   エフェクトディスパッチ
    screens/
      Game.tsx                #   メインゲーム画面
      GameCanvas.tsx          #   Canvas 描画
      GameHUD.tsx             #   HUD 表示
      GameControls.tsx        #   入力操作（モバイル十字キー含む）
      GameModals.tsx          #   モーダル（レベルアップ選択等）
      Title.tsx               #   タイトル画面
      Prologue.tsx            #   プロローグ画面
      Clear.tsx               #   クリア画面
    effects/                  #   エフェクトシステム
    services/
      tutorialService.ts      #   チュートリアル
      feedbackService.ts      #   フィードバック
      viewportService.ts      #   ビューポート
    state/
      useSyncedState.ts       #   同期状態管理
  audio/                      # 音声モジュール
    bgm.ts                    #   BGM管理
    soundEffect.ts            #   効果音
    audioContext.ts            #   AudioContext 管理
    audioSettings.ts          #   オーディオ設定
  shared/                     # 共有モジュール（公開API用再エクスポート）
  __tests__/                  # テスト
    builders/                 #   テストデータビルダー
    fixtures/                 #   テストフィクスチャ
    helpers/                  #   テストヘルパー（SeededRandomProvider 等）
    integration/              #   統合テスト
    scenarios/                #   決定的シナリオテスト
    mocks/                    #   テスト用モック
src/pages/IpnePage.tsx        # ページコンポーネント（薄いラッパー）
src/pages/IpnePage.styles.ts  # スタイルコンポーネント
```

### エフェクトシステム

視覚演出を統合管理するシステム。パーティクル、フローティングテキスト、画面エフェクトを提供する。

```
presentation/effects/
  effectTypes.ts         # エフェクト型定義（12種別）
  effectManager.ts       # エフェクト統合管理（パーティクル上限200個）
  particleSystem.ts      # パーティクル生成・更新・描画基盤
  floatingText.ts        # ダメージ数値等のフローティングテキスト（上限30個）
  hitEffectScaling.ts    # レベル連動ヒットエフェクトスケーリング
  enemyDeath.ts          # 敵撃破アニメーション（3フェーズ300ms）
  deathEffect.ts         # プレイヤー死亡アニメーション（3フェーズ1500ms）
  bossEffects.ts         # ボス戦演出（WARNING、HP残量オーラ、撃破演出）
  aura.ts                # パワーオーラシステム（レベル連動5段階）
  weaponEffect.ts        # 武器エフェクト（攻撃力連動4段階）
  stageVisual.ts         # ステージ報酬ビジュアルエフェクト
  screenTransition.ts    # 画面遷移演出（フェードイン、暗転）
  itemFeedback.ts        # アイテム取得フィードバック
  colorUtils.ts          # 色操作ユーティリティ
```

#### コンボシステム

短時間連続撃破でコンボカウンターが加算され、エフェクト演出が強化される。

- コンボ時間窓: 3秒
- 表示最小値: 2コンボ以上
- エフェクト倍率: 最大1.8倍（10コンボ以上）
- ダメージには影響しない（演出のみ）

#### ステージ別BGM

各ステージに固有の BGM パターンを割り当て、進行に応じた雰囲気変化を実現する。

| ステージ | トーン | 波形 |
|---------|--------|------|
| 1 | 探索的 | triangle |
| 2 | 神秘的 | triangle+sine |
| 3 | 不安 | sawtooth+triangle |
| 4 | 重厚 | sawtooth |
| 5 | 激しい | square+sawtooth |
| ボス戦 | 緊迫 | square |

### 状態管理

- React Hooks（`useState`, `useRef`, `useCallback`, `useEffect`）
- カスタムフック（`useGameLoop`, `useGameState`, `useSyncedState`）でプレゼンテーション層を分離

### 使用技術

- **Canvas 2D**: タイルベース描画
- **Web Audio API**: BGM・効果音
- **レイヤードアーキテクチャ**: application / domain / infrastructure / presentation の4層
- **ローグライク要素**: ランダム迷路生成、リアルタイム戦闘、クラスシステム、レベルアップ
- **5ステージ進行**: 段階的な難易度上昇、ステージ別ビジュアル、ステージクリア報酬
- **成長システム**: 撃破数ベースのレベルアップ（最大Lv22）、5種能力選択、HP自動回復
- **オートマップ**: 探索済みエリアの自動記録
- **チュートリアルシステム**: 段階的なゲーム説明

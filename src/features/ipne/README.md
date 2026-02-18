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

```
src/features/ipne/
  index.ts                  # barrel export
  types.ts                  # 型定義
  application/              # アプリケーション層
    engine/
      tickGameState.ts      # ゲームティック処理
    usecases/
      resolveItemPickupEffects.ts  # アイテム取得効果
      resolveKnockback.ts   # ノックバック処理
      resolvePlayerDamage.ts # ダメージ処理
  domain/                   # ドメイン層
    policies/
      enemyAi/              # 敵AIポリシー
    services/
      gimmickPlacement/     # ギミック配置サービス
  infrastructure/           # インフラ層
    browser/                # ブラウザ環境
    clock/                  # 時計プロバイダー
    random/                 # 乱数プロバイダー
    storage/                # ストレージプロバイダー
  presentation/             # プレゼンテーション層
    config.ts               # 表示設定
    index.ts                # barrel export
    hooks/
      useGameLoop.ts        # ゲームループ
      useGameState.ts       # ゲーム状態管理
    screens/
      Title.tsx             # タイトル画面
      Prologue.tsx          # プロローグ画面
      Game.tsx              # ゲーム画面
      Clear.tsx             # クリア画面
    state/
      useSyncedState.ts     # 同期状態管理
  shared/
    contracts/              # DbC アサーション
  audio/
    bgm.ts                  # BGM管理
    soundEffect.ts          # 効果音
    audioContext.ts          # AudioContext 管理
    audioSettings.ts        # オーディオ設定
  mazeGenerator.ts          # 迷路生成
  player.ts                 # プレイヤーロジック
  enemy.ts                  # 敵ロジック
  enemyAI.ts                # 敵AIロジック
  enemySpawner.ts           # 敵スポーン
  item.ts                   # アイテム
  combat.ts                 # 戦闘システム
  movement.ts               # 移動ロジック
  pathfinder.ts             # 経路探索
  autoMapping.ts            # オートマップ
  class.ts                  # クラスシステム
  collision.ts              # 衝突判定
  progression.ts            # 成長・レベルアップ管理（撃破テーブル、能力上限）
  stageConfig.ts            # 5ステージ設定データ（迷路サイズ、敵数、レベル上限）
  trap.ts                   # 罠ギミック
  wall.ts                   # 壁ギミック
  gimmickPlacement.ts       # ギミック配置
  goal.ts                   # ゴール判定
  tutorial.ts               # チュートリアル
  record.ts                 # 記録管理
  timer.ts                  # タイマー
  ending.ts                 # エンディング処理
  feedback.ts               # フィードバック
  viewport.ts               # ビューポート
  map.ts                    # マップ管理
  debug.ts                  # デバッグ
  __tests__/                # ユニットテスト
src/pages/IpnePage.tsx      # ページコンポーネント（薄いラッパー）
src/pages/IpnePage.styles.ts # スタイルコンポーネント
```

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

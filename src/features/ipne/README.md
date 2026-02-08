# IPNE（アイピーエヌイー）

## 概要

ランダム生成迷路を探索するローグライクRPG。
敵を倒し、アイテムを集め、ゴールを目指す。
クラスシステム、レベルアップ、罠・壁ギミック、チュートリアルなど多彩な要素を搭載。
レイヤードアーキテクチャ＆DDD 風設計で整理されたコード構成。

## 操作方法

- **WASD / 矢印キー**: 移動
- **スペース**: 攻撃
- **M**: オートマップ切り替え
- **モバイル**: 十字キーボタン操作

## 技術詳細

### ファイル構成

```
src/features/ipne/
  index.ts                  # barrel export（100行以上）
  types.ts                  # 型定義
  application/              # アプリケーション層
  domain/                   # ドメイン層
  infrastructure/           # インフラ層
  presentation/             # プレゼンテーション層
  audio/
    bgm.ts                  # BGM管理
    soundEffect.ts          # 効果音
    audioContext.ts          # AudioContext 管理
  mazeGenerator.ts          # 迷路生成
  player.ts                 # プレイヤーロジック
  enemy.ts                  # 敵ロジック
  item.ts                   # アイテム
  combat.ts                 # 戦闘システム
  movement.ts               # 移動ロジック
  pathfinder.ts             # 経路探索
  autoMapping.ts            # オートマップ
  class.ts                  # クラスシステム
  progression.ts            # 進行管理
  trap.ts                   # 罠ギミック
  wall.ts                   # 壁ギミック
  tutorial.ts               # チュートリアル
  record.ts                 # 記録管理
  timer.ts                  # タイマー
  debug.ts                  # デバッグ
src/pages/IpnePage.tsx              # ページコンポーネント（約2000行）
src/pages/IpnePage.styles.ts       # スタイル定義
```

### 状態管理

- React Hooks（`useState`, `useRef`, `useCallback`, `useEffect`）

### 使用技術

- **Canvas 2D**: タイルベース描画
- **Web Audio API**: BGM・効果音
- **レイヤードアーキテクチャ**: application / domain / infrastructure / presentation の4層
- **ローグライク要素**: ランダム迷路生成、ターン制戦闘、クラスシステム、レベルアップ
- **オートマップ**: 探索済みエリアの自動記録
- **チュートリアルシステム**: 段階的なゲーム説明

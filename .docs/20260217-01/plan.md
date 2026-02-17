# IPNE 5ステージ制 + ストーリー進行 — 実装計画書

## 概要

### 変更目的

IPNE（調査中につき脱出不能）を現在の **1ステージ構成** から **5ステージ構成** に拡張し、以下の効果を得る：

- **プレイ体験の深化**: 段階的に難易度が上がる迷宮を攻略する達成感
- **ナラティブの強化**: ステージ間ストーリーにより世界観への没入感を向上
- **リプレイ性の向上**: ステージ報酬による戦略的なビルド選択
- **プレイ時間の拡大**: 1プレイ 5〜10分 → 15〜40分（5ステージ合計）

### 設計判断（確認済み）

| 項目 | 決定 |
|------|------|
| ゲームオーバー時 | ステージ1から完全リスタート（レベル・能力も全リセット） |
| クリア条件 | 全ステージ共通：ボス撃破 + 鍵取得 → ゴール |
| クリアタイム | 全5ステージの合計時間（ストーリー/報酬選択中は一時停止） |

---

## 画面状態マシン

### 現在の ScreenState

```typescript
const ScreenState = {
  TITLE: 'title',
  CLASS_SELECT: 'class_select',
  PROLOGUE: 'prologue',
  GAME: 'game',
  DYING: 'dying',
  CLEAR: 'clear',
  GAME_OVER: 'game_over',
} as const;
```

### 拡張後の ScreenState

```typescript
const ScreenState = {
  // 既存
  TITLE: 'title',
  CLASS_SELECT: 'class_select',
  PROLOGUE: 'prologue',
  GAME: 'game',
  DYING: 'dying',
  GAME_OVER: 'game_over',
  // 変更: CLEAR → FINAL_CLEAR にリネーム（最終ステージクリア時のみ使用）
  FINAL_CLEAR: 'final_clear',
  // 新規追加
  STAGE_CLEAR: 'stage_clear',     // ステージクリア演出（Stage 1〜5）
  STAGE_STORY: 'stage_story',     // ステージ間ストーリー表示
  STAGE_REWARD: 'stage_reward',   // ステージ報酬選択
} as const;
```

### 画面遷移図

```
TITLE
  → CLASS_SELECT
    → PROLOGUE（ストーリー#0：導入）
      → GAME (Stage 1)
        ├── [ボス撃破+鍵+ゴール] → STAGE_CLEAR
        │     → STAGE_STORY（ストーリー#1）
        │       → STAGE_REWARD（報酬選択）
        │         → GAME (Stage 2)
        │           ├── [ボス撃破+鍵+ゴール] → STAGE_CLEAR
        │           │     → STAGE_STORY（ストーリー#2）
        │           │       → STAGE_REWARD（報酬選択）
        │           │         → GAME (Stage 3) → ... → GAME (Stage 4) → ...
        │           │           → GAME (Stage 5)
        │           │             └── [ボス撃破+鍵+ゴール] → STAGE_CLEAR
        │           │                   → STAGE_STORY（ストーリー#5：最終）
        │           │                     → FINAL_CLEAR（評価表示）
        │           └── [HP=0] → DYING → GAME_OVER
        └── [HP=0] → DYING → GAME_OVER

GAME_OVER → TITLE（ステージ1から完全リスタート）
FINAL_CLEAR → TITLE
```

---

## ステージ遷移フロー（簡略版）

```
PROLOGUE → GAME(S1) → STAGE_CLEAR → STAGE_STORY → STAGE_REWARD
         → GAME(S2) → STAGE_CLEAR → STAGE_STORY → STAGE_REWARD
         → GAME(S3) → STAGE_CLEAR → STAGE_STORY → STAGE_REWARD
         → GAME(S4) → STAGE_CLEAR → STAGE_STORY → STAGE_REWARD
         → GAME(S5) → STAGE_CLEAR → STAGE_STORY → FINAL_CLEAR

ゲームオーバー（任意のステージ）→ TITLE → ステージ1から完全リスタート
```

---

## 実装フェーズ

### Phase 1: 型定義・設定データ層

**目標**: 5ステージ制の基盤となる型定義と設定データを整備

**対象ファイル**:
- `src/features/ipne/types.ts` — ScreenState 拡張、StageNumber 型、StageConfig 型追加
- `src/features/ipne/stageConfig.ts` — **新規**: 5ステージ分の設定値
- `src/features/ipne/story.ts` — **新規**: ストーリーテキストデータ
- `src/features/ipne/progression.ts` — レベル上限 10→15 拡張、キルカウントテーブル追加
- `src/features/ipne/ending.ts` — 評価閾値を5ステージ合計基準に変更

**依存関係**: なし（他フェーズの土台）

---

### Phase 2: ドメインロジック層

**目標**: ステージごとの敵スケーリング、メガボス、ゴール判定ロジックを実装

**対象ファイル**:
- `src/features/ipne/enemy.ts` — MEGA_BOSS タイプ追加、ENEMY_CONFIGS 拡張
- `src/features/ipne/enemySpawner.ts` — StageConfig に基づくスポーン数制御
- `src/features/ipne/goal.ts` — ステージクリア判定（canGoal にステージ情報を考慮）
- `src/features/ipne/map.ts` — StageConfig に基づく迷路サイズ・パラメータ制御
- `src/features/ipne/gimmickPlacement.ts` — StageConfig に基づく罠・壁数制御
- `src/features/ipne/combat.ts` — ミニボス接触ダメージ処理

**依存関係**: Phase 1 完了必須

---

### Phase 3: エンジン層

**目標**: ゲームループとAIにステージ概念を統合

**対象ファイル**:
- `src/features/ipne/application/engine/tickGameState.ts` — ステージクリア判定、画面遷移トリガー
- `src/features/ipne/domain/policies/enemyAi/policies.ts` — メガボスAI追加
- `src/features/ipne/timer.ts` — ステージ間の一時停止対応（既存のpause/resumeで対応可能）
- `src/features/ipne/enemyAI.ts` — ミニボスAI挙動

**依存関係**: Phase 2 完了必須

---

### Phase 4: プレゼンテーション層（新画面コンポーネント）

**目標**: 新規画面コンポーネントの実装と状態管理の拡張

**対象ファイル（新規）**:
- `src/features/ipne/presentation/screens/StageClear.tsx` — ステージクリア画面
- `src/features/ipne/presentation/screens/StageStory.tsx` — ステージ間ストーリー画面
- `src/features/ipne/presentation/screens/StageReward.tsx` — 報酬選択画面
- `src/features/ipne/presentation/screens/FinalClear.tsx` — 最終クリア画面（旧 Clear.tsx を拡張）

**対象ファイル（変更）**:
- `src/features/ipne/presentation/hooks/useGameState.ts` — ステージ番号管理、画面遷移ハンドラー拡張
- `src/features/ipne/presentation/hooks/useGameLoop.ts` — ステージクリア検知
- `src/features/ipne/presentation/screens/Game.tsx` — ステージ番号表示、UI調整
- `src/features/ipne/presentation/screens/Prologue.tsx` — ストーリーデータ参照方式の変更
- `src/features/ipne/presentation/sprites/enemySprites.ts` — メガボススプライト追加
- `src/pages/IpnePage.tsx` — 新画面コンポーネントの組み込み

**依存関係**: Phase 3 完了必須

---

### Phase 5: 統合・テスト

**目標**: 全機能の統合テスト、バランス調整、既存テストの修正

**対象**:
- 既存テストファイルの修正（progression.test.ts, ending.test.ts, enemy.test.ts 等）
- 新規テスト追加（stageConfig.test.ts, story.test.ts）
- ステージ間データ引き継ぎの確認
- ゲームオーバー → 完全リスタートの動作確認
- 5ステージ通しプレイのバランスチェック

**依存関係**: Phase 4 完了必須

---

### Phase 6: ドキュメント・仕上げ

**目標**: README更新、画像差し込み準備

**対象**:
- `.docs/ipne/specs/` 各仕様書の更新
- README.md 更新（ゲーム説明、スクリーンショット箇所）
- 画像挿入箇所のドキュメント作成

**依存関係**: Phase 5 完了必須

---

## 変更ファイル一覧

### 既存ファイル変更（約20ファイル）

| ファイル | 変更内容 |
|---------|---------|
| `types.ts` | ScreenState 拡張（STAGE_CLEAR/STAGE_STORY/STAGE_REWARD/FINAL_CLEAR）、StageNumber 型、StageConfig インターフェース |
| `progression.ts` | MAX_LEVEL: 10→15、KILL_COUNT_TABLE にレベル11〜15を追加 |
| `enemy.ts` | MEGA_BOSS タイプ・パラメータ追加、ENEMY_CONFIGS 拡張 |
| `enemySpawner.ts` | SPAWN_CONFIG をステージ別に動的化、ミニボス・メガボスのスポーン対応 |
| `ending.ts` | RATING_THRESHOLDS を5ステージ合計基準に変更（S:10分, A:15分, B:25分, C:40分） |
| `goal.ts` | canGoal にステージ番号を考慮（変更不要の可能性あり：既存の鍵判定で十分） |
| `map.ts` | DEFAULT_CONFIG をステージ別に切り替え可能に |
| `gimmickPlacement.ts` | DEFAULT_GIMMICK_CONFIG をステージ別に動的化 |
| `timer.ts` | 変更不要（既存のpause/resumeでステージ間一時停止を実現） |
| `combat.ts` | ミニボスの接触ダメージ処理（必要に応じて） |
| `tickGameState.ts` | ステージクリア検知とエフェクト発行 |
| `policies.ts` | メガボスAI ポリシー追加 |
| `enemyAI.ts` | ミニボス挙動の追加 |
| `useGameState.ts` | currentStage 状態追加、setupGameState のステージ対応、新画面遷移ハンドラー |
| `useGameLoop.ts` | ステージクリア時の画面遷移トリガー |
| `Game.tsx` | ステージ番号表示UI、HUD調整 |
| `Prologue.tsx` | ストーリーデータをstory.tsから参照 |
| `enemySprites.ts` | メガボスのスプライト描画 |
| `IpnePage.tsx` | 新画面コンポーネントの条件分岐追加 |
| `index.ts` | 新モジュールのエクスポート追加 |

### 新規ファイル（6ファイル）

| ファイル | 内容 |
|---------|------|
| `stageConfig.ts` | 5ステージ分のMazeConfig, 敵数, ギミック数, HP/ダメージ/速度倍率 |
| `story.ts` | プロローグ + 5ステージ分のストーリーテキスト + エンディングバリエーション |
| `StageClear.tsx` | ステージクリア演出画面コンポーネント |
| `StageStory.tsx` | ステージ間ストーリー表示画面コンポーネント |
| `StageReward.tsx` | ステージ報酬選択画面コンポーネント |
| `FinalClear.tsx` | 最終クリア画面コンポーネント（評価表示、既存Clear.tsxベース） |

---

## ステージ間データ引き継ぎ

### 引き継ぐもの（次ステージに持ち越し）

| データ | 説明 |
|--------|------|
| プレイヤーレベル | 現在のレベル |
| 能力値（PlayerStats） | attackPower, attackRange, moveSpeed, attackSpeed, healBonus |
| 撃破数（killCount） | 累計撃破数 |
| HP | 現在のHP（最大HPも含む） |
| 職業（PlayerClass） | 選択した職業 |
| タイマー | 一時停止のみ（合計時間として継続） |
| ステージ報酬効果 | 累積した報酬バフ |

### リセットするもの（各ステージ開始時に初期化）

| データ | 説明 |
|--------|------|
| マップ | 新規生成 |
| 敵 | 新規スポーン（ステージ設定に基づく） |
| アイテム | 新規スポーン |
| 罠・壁 | 新規配置 |
| 自動マップ | 初期化 |
| hasKey | false |
| 探索状態 | 初期化 |

---

## 画像挿入準備

### 将来の画像差し込み箇所

| 箇所 | ファイル | 用途 |
|------|---------|------|
| ストーリー画面背景 | `StageStory.tsx` | 各ストーリーシーンのイメージ画像 |
| ステージクリア演出 | `StageClear.tsx` | クリア時の演出画像 |
| 最終クリア画面 | `FinalClear.tsx` | エンディング画像（既存の評価別画像を流用） |
| ステージ選択表示 | `Game.tsx` | ステージ番号・テーマアイコン |

### 画像差し込み手順

1. 画像ファイルを `src/assets/images/` に配置（WebP形式推奨）
2. コンポーネント内で `import` で読み込み（Webpack でバンドル）
3. styled-components の `background-image` または `<img>` タグで表示
4. 既存パターン（`ending.ts` の画像import方式）に従う

---

## リスク・注意事項

| リスク | 対策 |
|--------|------|
| 5ステージのバランス崩壊 | Phase 5 でバランス調整フェーズを設ける |
| パフォーマンス劣化（大きい迷路） | Stage 5 の 100x100 が重い場合、サイズを縮小 |
| 既存テストの破壊 | Phase 1 で型変更時に即座にテスト修正 |
| ストーリーテキストのトーン不一致 | 世界観仕様（01-worldview.md）を厳守 |
| タイマーの精度問題 | 既存のpause/resume機能で対応可能（追加実装不要） |
| メガボスの強さ調整 | テストプレイ後にパラメータ微調整 |

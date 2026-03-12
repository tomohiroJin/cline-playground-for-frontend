# RISK LCD リファクタリング タスクリスト

## 凡例

- [ ] 未着手
- [~] 進行中
- [x] 完了
- [!] ブロック中

優先度: P0（必須）> P1（重要）> P2（推奨）

---

## Phase 1: ドメインロジックの純粋関数化

### 1.1 被弾判定の抽出 [P0]

- [ ] `useRunningPhase.ts` の `resolve` 関数を読み込み、ドメインロジック部分を特定
- [ ] `domain/judgment.ts` を作成
- [ ] `judgeCycle` 純粋関数を実装
- [ ] 単体テスト: 障害物がプレイヤーレーンにある場合 → 被弾
- [ ] 単体テスト: 障害物がプレイヤーレーンにない場合 → 回避 + スコア加算
- [ ] 単体テスト: 隣接レーンに障害物 → ニアミス判定
- [ ] 単体テスト: シールド保持中の被弾 → シールド消費
- [ ] 単体テスト: シェルターレーンでの被弾 → シェルター回避
- [ ] 単体テスト: フリーズ中の判定
- [ ] `useRunningPhase.ts` の `resolve` から `judgeCycle` を呼び出すよう変更
- [ ] 全既存テスト通過を確認

### 1.2 スコア計算の移行・拡充 [P0]

- [ ] `domain/scoring.ts` を作成
- [ ] `game-logic.ts` の `comboMult`, `computePoints`, `computeStageBonus`, `getRank` を移行
- [ ] `game-logic.ts` は `domain/scoring.ts` からの re-export に変更（後方互換性）
- [ ] `calculateDailyReward` を新規実装（useStore.recordDailyPlay から報酬計算を抽出）
- [ ] 単体テスト: 既存テスト（game-logic.test.ts）の移行
- [ ] 単体テスト: calculateDailyReward（初回/更新/非更新）
- [ ] 全既存テスト通過を確認

### 1.3 障害物配置の抽出 [P0]

- [ ] `useRunningPhase.ts` の `pickObs` 関数を読み込み
- [ ] `domain/obstacle.ts` を作成
- [ ] `placeObstacles` 純粋関数を実装
- [ ] 単体テスト: 各ステージ設定での配置パターン
- [ ] 単体テスト: 制限レーンの反映
- [ ] 単体テスト: ダブル障害物の確率
- [ ] `useRunningPhase.ts` から `placeObstacles` を呼び出すよう変更
- [ ] 全既存テスト通過を確認

### 1.4 ステージ進行の抽出 [P1]

- [ ] `domain/stage-progress.ts` を作成
- [ ] `isStageCleared` 純粋関数を実装・テスト
- [ ] `createStageConfig` 純粋関数を実装・テスト
- [ ] `useRunningPhase.ts` から呼び出すよう変更
- [ ] 全既存テスト通過を確認

### 1.5 スタイルマージの移行 [P1]

- [ ] `domain/style-merge.ts` を作成
- [ ] `game-logic.ts` の `mergeStyles` を移行
- [ ] `game-logic.ts` は re-export に変更
- [ ] 単体テスト: 単一スタイル
- [ ] 単体テスト: 複数スタイルのマージ（倍率: max、修飾: 加算）
- [ ] 単体テスト: 空配列でエラー
- [ ] 全既存テスト通過を確認

### 1.6 DbC アサーション関数 [P2]

- [ ] `domain/assertions.ts` を作成
- [ ] `assertGameStateInvariant` を実装（開発環境のみ有効）
- [ ] useRunningPhase の resolve 後に呼び出しを追加
- [ ] 単体テスト: 不正な値で console.assert が発火すること

---

## Phase 2: インターフェース導入と useStore 改善

### 2.1 インターフェースの定義 [P1]

- [ ] `interfaces/rng.ts` を作成（既存 RngApi を昇格）
- [ ] `interfaces/storage.ts` を作成
- [ ] `interfaces/audio.ts` を作成
- [ ] `interfaces/index.ts` バレルエクスポート作成
- [ ] 既存の `phases/types.ts` の RngApi を `interfaces/rng.ts` からの re-export に変更
- [ ] 全既存テスト通過を確認

### 2.2 useStore のヘルパー関数分離 [P0]

- [ ] `hooks/store-helpers/` ディレクトリを作成
- [ ] `point-ops.ts` を作成（addPoints, spendPoints 純粋関数）
- [ ] `style-ops.ts` を作成（toggleEquip, maxEquipSlots 純粋関数）
- [ ] `daily-ops.ts` を作成（recordDaily 純粋関数、domain/scoring の calculateDailyReward を使用）
- [ ] 各ヘルパーの単体テスト作成
- [ ] `useStore.ts` をヘルパー関数呼び出しに変更（公開 API は維持）
- [ ] 既存の useStore.test.ts が通過することを確認
- [ ] 全既存テスト通過を確認

### 2.3 useAudio のマジックナンバー定数化 [P1]

- [ ] 音声設定定数オブジェクトを定義（周波数、音量、持続時間）
- [ ] useAudio.ts の beep 呼び出しを定数参照に変更
- [ ] 全既存テスト通過を確認

---

## Phase 3: useRunningPhase の責務分割

### 3.1 セグメント初期化の共通関数化 [P0]

- [ ] 3箇所で重複するセグメント初期化ロジックを特定
- [ ] `createSegments` 共通関数を作成
- [ ] `createSegTexts` 共通関数を作成
- [ ] 3箇所を共通関数呼び出しに変更
- [ ] 全既存テスト通過を確認

### 3.2 resolve の副作用分離 [P0]

- [ ] resolve 内を3段階に分離: (1) 純粋関数呼び出し → (2) 状態更新 → (3) UI 更新
- [ ] `applyHitEffect` ヘルパー関数を作成（被弾時の状態更新）
- [ ] `applyDodgeEffect` ヘルパー関数を作成（回避時の状態更新）
- [ ] `renderJudgmentResult` ヘルパー関数を作成（判定結果の UI 描画）
- [ ] 全既存テスト通過を確認
- [ ] ブラウザでの動作確認

### 3.3 nextCycle のタイマー整理 [P1]

- [ ] nextCycle 内のタイマーチェーンの構造を整理（コメント・変数名の改善）
- [ ] フェイク障害物の生成ロジックを小関数に抽出
- [ ] カスケードアニメーションのステップ計算を明確化
- [ ] 全既存テスト通過を確認

### 3.4 useGameEngine の dispatch 整理 [P1]

- [ ] dispatch 内の switch/case をコメント付きで構造化
- [ ] 各 case のロジックが3行以上の場合は名前付き関数に抽出
- [ ] 全既存テスト通過を確認

### 3.5 循環依存の改善 [P2]

- [ ] endGameRef / showPerksRef / announceRef の依存構造を図示
- [ ] ref 経由の相互参照を最小化する方法を検討・実装
- [ ] 全既存テスト通過を確認

---

## Phase 4: テスト強化

### 4.1 統合テスト基盤の構築 [P0]

- [ ] テスト用のモック RNG 生成ユーティリティを作成（シード固定）
- [ ] テスト用の localStorage モックを整備
- [ ] テスト用の AudioContext モックを整備
- [ ] `renderHook` + `useFakeTimers` のテストパターンを確立

### 4.2 統合テスト実装 [P0]

- [ ] ゲーム開始テスト: dispatch('act') でゲームが開始されること
- [ ] サイクル進行テスト: タイマー進行でサイクルが完了すること
- [ ] 回避テスト: 障害物のないレーンにいるとスコアが加算されること
- [ ] 被弾テスト: 障害物レーンにいるとゲームオーバーになること
- [ ] ステージクリアテスト: 全サイクル完了でステージが進むこと
- [ ] デイリーモードテスト: シード固定で再現性があること

### 4.3 コンポーネントテスト [P1]

- [ ] TitleScreen のテスト（メニュー項目の表示・選択操作）
- [ ] ResultScreen のテスト（スコア・ランクの表示）
- [ ] PerkSelectScreen のテスト（パーク一覧の表示・選択）
- [ ] StyleListScreen のテスト（スタイル一覧・装備トグル）
- [ ] UnlockShopScreen のテスト（ショップ一覧・購入）

### 4.4 既存テストの改善 [P1]

- [ ] random.test.ts に確率分布テストを追加
- [ ] RiskLcdGame.test.tsx に画面遷移テストを追加
- [ ] useStore.test.ts をヘルパー分割後の構造に合わせて更新

### 4.5 カバレッジ設定 [P0]

- [ ] jest.config.js に RISK LCD のカバレッジ閾値を追加
  - [ ] domain/: branches 85%, functions 90%, lines 90%
  - [ ] risk-lcd 全体: branches 50%, functions 60%, lines 60%
- [ ] CI でカバレッジチェックが実行されることを確認

---

## Phase 5: 仕上げ

### 5.1 DRY 違反の最終チェック [P1]

- [ ] isShelter チェックの共通化
- [ ] その他重複コードの統合
- [ ] 全箇所をレビュー

### 5.2 マジックナンバーの排除 [P1]

- [ ] セグメント・レーン関連の数値を定数化
- [ ] タイミング関連の数値を定数化
- [ ] 全箇所をレビュー

### 5.3 パフォーマンス最適化 [P2]

- [ ] wPick の excludes を Set に変更
- [ ] 不要な re-render の特定と React.memo 適用検討
- [ ] バンドルサイズへの影響確認（5% 以内）

### 5.4 クリーンアップ [P1]

- [ ] 旧 utils/game-logic.ts が re-export のみになっていることを確認
- [ ] 未使用の import の削除
- [ ] ESLint エラー・警告の解消

### 5.5 最終確認 [P0]

- [ ] 全単体テスト通過
- [ ] 全統合テスト通過
- [ ] カバレッジ閾値達成
- [ ] ESLint エラーゼロ
- [ ] TypeScript コンパイルエラーゼロ
- [ ] `any` 型使用ゼロ
- [ ] useRunningPhase が 300 行以下
- [ ] ブラウザでの動作確認（通常/デイリー/ショップ/チュートリアル）

---

## 依存関係

```
Phase 1 ──→ Phase 3（ドメイン関数を使って resolve を分割）
Phase 1 ──→ Phase 4（ドメイン関数のテスト + 統合テスト）
Phase 2 ──→ Phase 4（useStore ヘルパーのテスト）
Phase 3 ──→ Phase 5（分割後のクリーンアップ）
Phase 4 ──→ Phase 5（テスト完了後の仕上げ）
```

- Phase 1 と Phase 2 は **並行して着手可能**（相互依存なし）
- Phase 3 は Phase 1 完了後に着手（domain/ の純粋関数が必要）
- Phase 4 は Phase 1, 2 の完了後に統合テスト着手（部分的に並行可能）
- Phase 5 は全フェーズの仕上げ

## タスク数サマリー

| Phase | タスク数 | 規模感 |
|-------|---------|--------|
| Phase 1 | 33 | 中（純粋関数の抽出が核心） |
| Phase 2 | 16 | 小（インターフェース定義 + ヘルパー分離） |
| Phase 3 | 15 | 中（useRunningPhase の責務分割） |
| Phase 4 | 18 | 中（統合テスト + コンポーネントテスト） |
| Phase 5 | 12 | 小（仕上げ） |
| **合計** | **94** | |

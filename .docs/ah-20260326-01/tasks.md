# Step 4: ペアマッチ（2v2）— タスクチェックリスト

## 進捗サマリー

| フェーズ | ステータス | タスク数 | 完了日 |
|---------|-----------|---------|--------|
| S4-1 型定義・データ構造 | [x] 完了 | 8 | 2026-03-26 |
| S4-2 入力層の拡張 | [x] 完了 | 5 | 2026-03-26 |
| S4-3 ゲームロジック | [x] 完了 | 9 | 2026-03-26 |
| S4-4 レンダリング | [x] 完了 | 4 | 2026-03-26 |
| S4-5 UI・画面フロー | [x] 完了 | 6 | 2026-03-26 |
| S4-6 テスト・品質保証 | [x] 完了 | 6 | 2026-03-26 |

### 並行作業ガイド

```
S4-1（型定義・データ構造）
  ├──→ S4-2（入力層）           ← S4-1 完了後
  │     └──→ S4-3（ロジック）    ← S4-2 完了後
  │           └──→ S4-4（描画）  ← S4-3 完了後
  │                 └──→ S4-5（UI） ← S4-4 完了後
  └──→ S4-6-1（型テスト）       ← S4-1 完了後すぐ並行可
              └──→ S4-6-2〜4   ← S4-5 完了後に一括
```

---

## Phase S4-1: 型定義・データ構造

### S4-1-1: GameMode に '2v2-local' を追加

- [x] `core/types.ts` の `GameMode` 型に `'2v2-local'` を追加

### S4-1-2: GameState に ally/enemy マレットを追加

- [x] `GameState` に `ally?: Mallet` を追加（P2 味方）
- [x] `GameState` に `enemy?: Mallet` を追加（P4 敵2）
- [x] `GameEffects` に `ally?: EffectState` と `enemy?: EffectState` を追加

### S4-1-3: 4分割ゾーン境界の定義

- [x] `core/constants.ts` に `getPlayerZone(slot, constants)` を追加
- [x] PlayerSlot 型を `'player1' | 'player2' | 'player3' | 'player4'` に拡張

### S4-1-4: EntityFactory の4マレット初期化

- [x] `EntityFactory.createGameState()` に2v2用の初期化オプションを追加
- [x] ally: (3W/4, H-120), enemy: (3W/4, 120) の初期位置

**確認**:
- [x] `tsc --noEmit` で型エラーなし

---

## Phase S4-2: 入力層の拡張

### S4-2-1: マルチタッチを4タッチ対応に

- [x] `MultiTouchState` に `player3TouchId/Position`, `player4TouchId/Position` を追加
- [x] `getZone()` をX軸+Y軸の4分割判定に変更
- [x] `processTouchStart/Move/End` を4タッチ対応に

### S4-2-2: キーボード入力の2v2対応

- [x] 2v2 時に WASD キーで P2（ally）を操作する処理を追加

### S4-2-3: useGameLoop での4マレット入力処理

- [x] ゲームループ内で ally/enemy の入力を処理
- [x] マウス/タッチ入力は P1（player）のみ
- [x] WASD は P2（ally）に割り当て

**確認**:
- [x] `tsc --noEmit` で型エラーなし

---

## Phase S4-3: ゲームロジック

### S4-3-1: processCollisions の4マレット対応

- [x] マレット配列に ally/enemy を追加（2v2 時）
- [x] 既存の player/cpu ループを `getAllMallets()` に統一

### S4-3-2: resolveMalletPuckOverlap の4マレット対応

- [x] ally/enemy マレットにも重なり解消を適用

### S4-3-3: CPU AI の2体同時制御

- [x] P3（cpu）と P4（enemy）を個別 AI プロファイルで制御
- [x] P2（ally）が CPU の場合も AI で制御
- [x] ally/enemy の AI 状態（cpuTarget/cpuTargetTime/cpuStuckTimer）を GameState に保持

### S4-3-4: ゴール判定のチーム制対応

- [x] 2v2 モードではチーム制スコア（team1/team2）
- [x] 既存の `{ p, c }` スコア構造を流用（p=team1, c=team2）
- [x] シールドをチーム単位で消費（ally/enemy シールドも有効）

### S4-3-5: アイテム・エフェクトの4プレイヤー対応

- [x] アイテム取得を4マレット対応に
- [x] エフェクト（ビッグ/スピード等）を ally/enemy にも適用
- [x] マグネット引力を ally/enemy にも適用

**確認**:
- [x] `tsc --noEmit` で型エラーなし

---

## Phase S4-4: レンダリング

### S4-4-1: 4マレット描画

- [x] ally/enemy マレットの描画を追加（プレイング・カウントダウン・ポーズ・ヒットストップ全画面）
- [x] Y 座標順の描画順序を維持

### S4-4-2: チーム制スコアボード

- [x] 既存スコアボード（p vs c）をそのまま活用（チーム制として表示）

### S4-4-3: マレットカラー管理

- [x] チーム別カラー適用（pColor=チーム1, cColor=チーム2）

**確認**:
- [x] `tsc --noEmit` で型エラーなし

---

## Phase S4-5: UI・画面フロー

### S4-5-1: タイトル画面に「ペアマッチ」ボタン追加

- [x] TitleScreen に「ペアマッチ」ボタンを追加（緑グラデーション）
- [x] `onPairMatchClick` コールバックを実装

### S4-5-2: ゲームモード統合

- [x] AirHockeyGame.tsx に `handlePairMatchClick` を追加
- [x] `is2v2Mode` 判定を追加
- [x] マルチタッチ・キーボード入力を2v2でも有効化

### S4-5-3: GameState 初期化

- [x] `createGameState` に `is2v2` フラグを渡す
- [x] 2v2 時は4マレット配置で初期化

**確認**:
- [x] `tsc --noEmit` で型エラーなし

---

## Phase S4-6: テスト・品質保証

### S4-6-1: 型定義・初期化テスト

- [x] 2v2 GameState 初期化テスト（pair-match.test.ts: 19テスト）
- [x] 4分割ゾーン境界テスト
- [x] 既存モード互換テスト（ally/enemy undefined で既存動作と同一）

### S4-6-2: 入力テスト

- [x] マルチタッチ4タッチ対応テスト（pair-match-input.test.ts: 10テスト）
- [x] 既存multi-touch.testの4分割対応更新

### S4-6-3: 衝突・ゴール判定テスト

- [x] getAllMallets ヘルパーテスト（pair-match-logic.test.ts: 14テスト）
- [x] 4マレット食い込み解消テスト
- [x] アイテムエフェクト ally/enemy テスト

### S4-6-4: UI テスト

- [x] ペアマッチボタン表示テスト（PairMatchButton.test.tsx: 3テスト）

### S4-6-5: 既存テスト全パス確認

- [x] air-hockey 全テスト: 1,185テスト / 84スイート 合格
- [x] 全プロジェクトテスト: 7,263テスト / 581スイート 合格
- [x] `tsc --noEmit` で型エラーなし

### S4-6-6: コードレビュー・リファクタリング

- [x] processCollisions の DRY 化（`getAllMallets` 統一）
- [x] シールドゴール判定のチーム対応修正
- [x] ally/enemy の AI 状態保持修正

---

## 各フェーズの共通完了条件

各フェーズ完了時に以下をすべて確認:

- [x] `tsc --noEmit` で型エラーなし
- [x] 既存モード（フリー対戦、ストーリー、2P、デイリー、図鑑）に影響なし

---

## 新規作成ファイル

| ファイル | 説明 |
|---------|------|
| `core/pair-match-logic.ts` | 2v2 ヘルパー（getAllMallets, getMalletEffectSide） |
| `core/pair-match.test.ts` | Phase S4-1 テスト（19件） |
| `core/pair-match-input.test.ts` | Phase S4-2 テスト（10件） |
| `core/pair-match-logic.test.ts` | Phase S4-3 テスト（14件） |
| `components/PairMatchButton.test.tsx` | Phase S4-5 テスト（3件） |

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `core/types.ts` | GameMode に '2v2-local' 追加、PlayerSlot re-export、GameState に ally/enemy/AI状態追加 |
| `core/constants.ts` | `getPlayerZone()` 追加、`getPlayerYBounds()` を player3/player4 対応 |
| `core/entities.ts` | `createGameState()` に `is2v2` パラメータ追加 |
| `core/multi-touch.ts` | 4分割ゾーン判定に全面書き換え |
| `core/items.ts` | `EffectTarget` 型に ally/enemy 追加 |
| `domain/contracts/input.ts` | PlayerSlot に player3/player4 追加 |
| `application/use-cases/two-player-battle.ts` | TwoPlayerSlot ローカル型で型制約 |
| `components/TitleScreen.tsx` | ペアマッチボタン追加 |
| `presentation/AirHockeyGame.tsx` | 2v2 画面遷移・入力有効化 |
| `presentation/hooks/useGameLoop.ts` | 4マレット衝突・描画・AI・シールド対応 |
| `core/multi-touch.test.ts` | 4分割ゾーン対応にテスト更新 |

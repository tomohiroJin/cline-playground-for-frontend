# Step 4: ペアマッチ（2v2）— タスクチェックリスト

## 進捗サマリー

| フェーズ | ステータス | タスク数 | 完了日 |
|---------|-----------|---------|--------|
| S4-1 型定義・データ構造 | [ ] 未着手 | 8 | |
| S4-2 入力層の拡張 | [ ] 未着手 | 5 | |
| S4-3 ゲームロジック | [ ] 未着手 | 9 | |
| S4-4 レンダリング | [ ] 未着手 | 4 | |
| S4-5 UI・画面フロー | [ ] 未着手 | 6 | |
| S4-6 テスト・品質保証 | [ ] 未着手 | 6 | |

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

- [ ] `core/types.ts` の `GameMode` 型に `'2v2-local'` を追加

### S4-1-2: GameState に ally/enemy マレットを追加

- [ ] `GameState` に `ally?: Mallet` を追加（P2 味方）
- [ ] `GameState` に `enemy?: Mallet` を追加（P4 敵2）
- [ ] `GameEffects` に `ally?: EffectState` と `enemy?: EffectState` を追加

### S4-1-3: 4分割ゾーン境界の定義

- [ ] `core/constants.ts` に `getPlayerZone(slot, constants)` を追加
- [ ] PlayerSlot 型を `'player1' | 'player2' | 'player3' | 'player4'` に拡張

### S4-1-4: EntityFactory の4マレット初期化

- [ ] `EntityFactory.createGameState()` に2v2用の初期化オプションを追加
- [ ] ally: (3W/4, H-120), enemy: (3W/4, 120) の初期位置

**確認**:
- [ ] `tsc --noEmit` で型エラーなし

---

## Phase S4-2: 入力層の拡張

### S4-2-1: マルチタッチを4タッチ対応に

- [ ] `MultiTouchState` に `player3TouchId/Position`, `player4TouchId/Position` を追加
- [ ] `getZone()` をX軸+Y軸の4分割判定に変更
- [ ] `processTouchStart/Move/End` を4タッチ対応に

### S4-2-2: キーボード入力の2v2対応

- [ ] 2v2 時に WASD キーで P2（ally）を操作する処理を追加

### S4-2-3: useGameLoop での4マレット入力処理

- [ ] ゲームループ内で ally/enemy の入力を処理
- [ ] マウス/タッチ入力は P1（player）のみ
- [ ] WASD は P2（ally）に割り当て

**確認**:
- [ ] `tsc --noEmit` で型エラーなし

---

## Phase S4-3: ゲームロジック

### S4-3-1: processCollisions の4マレット対応

- [ ] マレット配列に ally/enemy を追加（2v2 時）
- [ ] 既存の player/cpu ループを拡張

### S4-3-2: resolveMalletPuckOverlap の4マレット対応

- [ ] ally/enemy マレットにも重なり解消を適用

### S4-3-3: CPU AI の2体同時制御

- [ ] P3（cpu）と P4（enemy）を個別 AI プロファイルで制御
- [ ] P2（ally）が CPU の場合も AI で制御
- [ ] 各 AI にキャラ個性（playStyle）を反映

### S4-3-4: ゴール判定のチーム制対応

- [ ] 2v2 モードではチーム制スコア（team1/team2）
- [ ] 既存の `{ p, c }` スコア構造を流用（p=team1, c=team2）

### S4-3-5: アイテム・エフェクトの4プレイヤー対応

- [ ] アイテム取得を4マレット対応に
- [ ] エフェクト（ビッグ/スピード等）を ally/enemy にも適用

**確認**:
- [ ] `tsc --noEmit` で型エラーなし

---

## Phase S4-4: レンダリング

### S4-4-1: 4マレット描画

- [ ] ally/enemy マレットの描画を追加
- [ ] Y 座標順の描画順序を維持

### S4-4-2: チーム制スコアボード

- [ ] 2v2 モード時のスコアボード表示（team1 vs team2）

### S4-4-3: マレットカラー管理

- [ ] チーム内の2マレットに異なるカラーを割り当て
- [ ] キャラ選択のカラーを反映

**確認**:
- [ ] `tsc --noEmit` で型エラーなし

---

## Phase S4-5: UI・画面フロー

### S4-5-1: タイトル画面に「ペアマッチ」ボタン追加

- [ ] TitleScreen に「ペアマッチ」ボタンを追加
- [ ] `handlePairMatchStart` コールバックを実装

### S4-5-2: チーム設定画面

- [ ] TeamSetupScreen コンポーネントを新規作成（or 既存拡張）
- [ ] チーム1/2 のキャラ選択
- [ ] CPU/人間切替
- [ ] フィールド・勝利スコア選択

### S4-5-3: VS 画面のチーム表示

- [ ] VsScreen をチーム表示に対応（チーム1 vs チーム2）

### S4-5-4: リザルト画面のチーム表示

- [ ] ResultScreen をチーム制に対応

**確認**:
- [ ] `tsc --noEmit` で型エラーなし

---

## Phase S4-6: テスト・品質保証

### S4-6-1: 型定義・初期化テスト

- [ ] 2v2 GameState 初期化テスト
- [ ] 4分割ゾーン境界テスト
- [ ] 既存モード互換テスト（ally/enemy undefined で既存動作と同一）

### S4-6-2: 衝突・ゴール判定テスト

- [ ] 4マレット衝突テスト
- [ ] チーム制得点テスト

### S4-6-3: 既存テスト全パス確認

- [ ] `npm test` で全テストパス
- [ ] `tsc --noEmit` で型エラーなし

### S4-6-4: ビルド確認

- [ ] `npm run build` でビルド成功

---

## 各フェーズの共通完了条件

各フェーズ完了時に以下をすべて確認:

- [ ] `tsc --noEmit` で型エラーなし
- [ ] 既存モード（フリー対戦、ストーリー、2P、デイリー、図鑑）に影響なし
